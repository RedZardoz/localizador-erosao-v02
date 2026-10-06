#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SAREL v2 - avaliacao pre-registrada D24/D25/D26 (IMPLEMENTACAO DE REFERENCIA).

Esta implementacao NAO e evidencia cientifica por si so. Ela so produz resultado cientifico
quando alimentada com a matriz real (rotulos delineados pelo pesquisador) e com
--probatorio. Qualquer execucao sobre dado sintetico exige --dryrun-sintetico e grava
arquivos com prefixo DRYRUN_SINTETICO_.

Contrato de colunas da matriz (CSV/XLSX exportado pelo app):
  Fracao_Erodida   alvo primario D26, [0,1]
  Poligono_ID      unidade de agrupamento (D24 mitigacao 4; D25 bootstrap)
  Papel_Conjunto   'treino' | 'held-out'
  Estrato_ID       um dos 18 estratos de D12 (informativo)
  + as colunas de preditores declaradas no JSON de configuracao (blocos D24).

Decisoes aplicadas: D24 (tres competidores, teto por bloco, monotonicidade, validacao
interna agrupada por poligono), D25 (rho de Spearman primaria, piso 0,40, margem 0,10,
bootstrap por poligono, tres desfechos + quarto), D26 (reg:tweedie, binario a 25 %).
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
import os
import sys
import time
from dataclasses import dataclass, field

import numpy as np
import pandas as pd
from scipy.stats import rankdata, spearmanr

LIMIAR_BINARIO = 0.25          # D26
PISO_RHO = 0.40                # D25
MARGEM_RHO = 0.10              # D25
EPS = 1e-9                     # tolerancia de ponto flutuante nas comparacoes >= (0,50-0,40 = 0,0999...98)
PISO_AUC = 0.70                # D25 (secundaria)
MARGEM_AUC = 0.05              # D25 (secundaria)
TETO_BLOCO = {"espectro": 8, "terreno": 4, "solo": 1, "chuva": 1}   # D24
TWEEDIE_POWER = 1.5            # proposta (P10); nao decidida
# Saidas/derivados do competidor RUSLE nunca entram como preditor (D25: o modelo nao pode receber a
# saida do competidor). LS e K/R sao admitidos pelos blocos de D24 (terreno, solo, chuva).
PROIBIDOS_COMO_PREDITOR = {"RUSLE_Fator_C", "RUSLE_Fator_P", "RUSLE_Perda_Solo_t_ha_ano", "RUSLE_A"}
COLUNAS_OBRIGATORIAS = ("Fracao_Erodida", "Poligono_ID", "Papel_Conjunto")


class ErroAvaliacao(Exception):
    pass


# ---------------------------------------------------------------- carga
def carregar_csv_sarel(caminho: str) -> pd.DataFrame:
    """Le o CSV do app: ignora BOM, linhas '#' e linhas em branco ANTES do cabecalho."""
    with open(caminho, "r", encoding="utf-8-sig", newline="") as fh:
        linhas = fh.read().splitlines()
    i = 0
    while i < len(linhas) and (linhas[i].strip() == "" or linhas[i].lstrip().startswith("#")):
        i += 1
    if i >= len(linhas):
        raise ErroAvaliacao("CSV sem cabecalho apos as linhas de metadado")
    return pd.read_csv(io.StringIO("\n".join(linhas[i:])))


def sha256_arquivo(caminho: str) -> str:
    h = hashlib.sha256()
    with open(caminho, "rb") as fh:
        for bloco in iter(lambda: fh.read(1 << 20), b""):
            h.update(bloco)
    return h.hexdigest()


# ---------------------------------------------------------------- estatisticas
def spearman_rapido(x, y) -> float:
    """Spearman = Pearson dos postos medios (trata empates). NaN se um dos lados e constante."""
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    if x.size < 3:
        return float("nan")
    rx, ry = rankdata(x), rankdata(y)
    sx, sy = rx.std(), ry.std()
    if sx == 0.0 or sy == 0.0:
        return float("nan")
    return float(np.mean((rx - rx.mean()) * (ry - ry.mean())) / (sx * sy))


def auc_postos(y_bin, score) -> float:
    """AUC por Mann-Whitney (equivale a roc_auc_score com empates = 0,5). NaN se uma so classe."""
    y_bin = np.asarray(y_bin, dtype=int)
    score = np.asarray(score, dtype=float)
    n1 = int(y_bin.sum())
    n0 = int(y_bin.size - n1)
    if n1 == 0 or n0 == 0:
        return float("nan")
    r = rankdata(score)
    return float((r[y_bin == 1].sum() - n1 * (n1 + 1) / 2.0) / (n1 * n0))


def n_efetivo(area_m2: float, alcance_m: float) -> float:
    """Unidades espacialmente independentes: area / (pi (alcance/2)^2). Reproduz D24:
    10 ha e 50 m -> 50,9 (D24 diz ~51)."""
    if alcance_m <= 0:
        raise ErroAvaliacao("alcance deve ser > 0")
    return float(area_m2 / (math.pi * (alcance_m / 2.0) ** 2))


def validar_teto_blocos(blocos: dict) -> None:
    """D24: espectro<=8, terreno<=4, solo=1, chuva=1 (total <= 14). Bloco desconhecido = erro."""
    for nome, cols in blocos.items():
        if nome not in TETO_BLOCO:
            raise ErroAvaliacao(f"bloco desconhecido: {nome}")
        if len(cols) > TETO_BLOCO[nome]:
            raise ErroAvaliacao(f"teto D24 excedido no bloco {nome}: {len(cols)} > {TETO_BLOCO[nome]}")
    usados = {c for cols in blocos.values() for c in cols}
    if usados & PROIBIDOS_COMO_PREDITOR:
        raise ErroAvaliacao(f"preditor proibido (saida do competidor RUSLE): {sorted(usados & PROIBIDOS_COMO_PREDITOR)}")
    if sum(len(c) for c in blocos.values()) > 14:
        raise ErroAvaliacao("total de preditores > 14 (D24)")


# ---------------------------------------------------------------- bootstrap por poligono
@dataclass
class ResultadoBootstrap:
    n_reps_validas: int
    estimativa: float
    ic95: tuple
    exclui_zero: bool


def _indices_por_grupo(grupos) -> list:
    grupos = np.asarray(grupos)
    return [np.flatnonzero(grupos == g) for g in pd.unique(grupos)]


def bootstrap_diferenca(y, pred_a, pred_b, grupos, estatistica="spearman", limiar=LIMIAR_BINARIO,
                        B=10000, seed=20261006) -> ResultadoBootstrap:
    """IC 95 % percentil da DIFERENCA EMPARELHADA (a - b); unidade de reamostragem = poligono (D25)."""
    y = np.asarray(y, dtype=float)
    pa = np.asarray(pred_a, dtype=float)
    pb = np.asarray(pred_b, dtype=float)
    idx = _indices_por_grupo(grupos)
    G = len(idx)
    if G < 2:
        raise ErroAvaliacao("bootstrap exige >= 2 poligonos")

    def est(yy, pp):
        return spearman_rapido(yy, pp) if estatistica == "spearman" else auc_postos((yy >= limiar).astype(int), pp)

    ponto = est(y, pa) - est(y, pb)
    rng = np.random.default_rng(seed)
    difs = []
    for _ in range(B):
        sel = rng.integers(0, G, G)
        ii = np.concatenate([idx[k] for k in sel])
        d = est(y[ii], pa[ii]) - est(y[ii], pb[ii])
        if not math.isnan(d):
            difs.append(d)
    if len(difs) < 0.9 * B:
        raise ErroAvaliacao(f"so {len(difs)}/{B} reamostras validas; amostra degenerada")
    lo, hi = np.percentile(difs, [2.5, 97.5])
    return ResultadoBootstrap(len(difs), float(ponto), (float(lo), float(hi)), bool(lo > 0 or hi < 0))


# ---------------------------------------------------------------- desfechos pre-registrados D25
def classificar_desfecho(rho_xgb, rho_rusle, rho_pen, ic_xgb_rusle, ic_xgb_pen) -> dict:
    """Aplica D25 sem inventar regra. Casos que D25 nao cobre retornam 'NAO_PREVISTO_EM_D25'."""
    if any(v is None or (isinstance(v, float) and math.isnan(v)) for v in (rho_xgb, rho_rusle)):
        return {"desfecho": "NAO_AVALIAVEL", "motivo": "rho_xgb ou rho_rusle indisponivel",
                "hipotese_ensemble_refutada": None}
    margem = rho_xgb - rho_rusle
    if rho_xgb < PISO_RHO - EPS or rho_xgb < rho_rusle - EPS:
        desfecho, motivo = "REFUTADA", "estimativa pontual abaixo do piso 0,40 ou abaixo do RUSLE"
    elif margem >= MARGEM_RHO - EPS:
        if ic_xgb_rusle is not None and ic_xgb_rusle[0] > 0:
            desfecho, motivo = "CORROBORADA", "piso e margem atingidos; IC95% da diferenca exclui zero"
        else:
            desfecho, motivo = "INCONCLUSIVA", "margem atingida na estimativa, IC95% contem zero (potencia por poligonos)"
    else:
        desfecho, motivo = "NAO_PREVISTO_EM_D25", ("piso atingido e rho_xgb >= rho_rusle, mas margem < 0,10: "
                                                    "D25 nao define este desfecho; o pesquisador deve decidir")
    quarto = None
    if rho_pen is not None and not (isinstance(rho_pen, float) and math.isnan(rho_pen)) and ic_xgb_pen is not None:
        # D25: regressao penalizada empata ou vence o XGBoost dentro do intervalo
        quarto = not (ic_xgb_pen[0] > 0)
    return {"desfecho": desfecho, "motivo": motivo, "hipotese_ensemble_refutada": quarto,
            "margem_rho_pontual": margem}


# ---------------------------------------------------------------- competidores
def rusle_a(df: pd.DataFrame, cols: dict) -> np.ndarray:
    """A = R*K*LS*C*P (linha de base). NaN se qualquer fator estiver ausente (nunca 0).
    Se cols tiver a chave 'A', usa a coluna ja calculada (arquivo de linha de base separado)."""
    if "A" in cols:
        return df[cols["A"]].astype(float).to_numpy()
    m = df[[cols[k] for k in ("R", "K", "LS", "C", "P")]].astype(float)
    a = m.prod(axis=1, skipna=False)
    return a.to_numpy()


def _grid_xgb():
    for md in (2, 3):
        for lr in (0.05, 0.1):
            for ne in (100, 300):
                for mcw in (5, 20):
                    yield dict(max_depth=md, learning_rate=lr, n_estimators=ne, min_child_weight=mcw)


def _xgb(params, cols, mono, seed):
    import xgboost as xgb
    cst = "(" + ",".join(str(int(mono.get(c, 0))) for c in cols) + ")"
    return xgb.XGBRegressor(objective="reg:tweedie", tweedie_variance_power=TWEEDIE_POWER,
                            tree_method="hist", subsample=0.8, colsample_bytree=0.8, reg_lambda=1.0,
                            monotone_constraints=cst, random_state=seed, n_jobs=1, verbosity=0, **params)


def _penalizado(alpha):
    from sklearn.impute import SimpleImputer
    from sklearn.linear_model import TweedieRegressor
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler
    # imputacao pela mediana SOMENTE do treino da dobra, com indicador de ausencia (DEC-7)
    return make_pipeline(SimpleImputer(strategy="median", add_indicator=True), StandardScaler(),
                         TweedieRegressor(power=TWEEDIE_POWER, link="log", alpha=alpha, max_iter=2000))


def _cv_agrupado(fabrica, X, y, g, n_splits, seed):
    from sklearn.model_selection import GroupKFold
    gkf = GroupKFold(n_splits=min(n_splits, len(np.unique(g))))
    rhos = []
    for tr, va in gkf.split(X, y, g):
        mdl = fabrica()
        mdl.fit(X.iloc[tr], y[tr])
        r = spearman_rapido(y[va], mdl.predict(X.iloc[va]))
        if not math.isnan(r):
            rhos.append(r)
    return float(np.mean(rhos)) if rhos else float("-inf")


def ajustar_competidores(treino: pd.DataFrame, cfg: dict, seed: int):
    """Ajusta XGBoost e Tweedie penalizado SO com os poligonos de treino (selecao agrupada interna)."""
    validar_teto_blocos(cfg["blocos"])
    cols = [c for b in cfg["blocos"].values() for c in b]
    X = treino[cols]
    y = treino[cfg["alvo"]].to_numpy(dtype=float)
    g = treino[cfg["grupo"]].to_numpy()
    if (y < 0).any() or (y > 1).any() or np.isnan(y).any():
        raise ErroAvaliacao("Fracao_Erodida fora de [0,1] ou ausente no treino")
    mono = cfg.get("monotonicidade", {})
    melhor_x, melhor_s = None, -np.inf
    for p in _grid_xgb():
        s = _cv_agrupado(lambda p=p: _xgb(p, cols, mono, seed), X, y, g, 4, seed)
        if s > melhor_s:
            melhor_x, melhor_s = p, s
    xgb_final = _xgb(melhor_x, cols, mono, seed).fit(X, y)
    melhor_a, melhor_sa = None, -np.inf
    for a in (1e-3, 1e-2, 1e-1, 1.0, 10.0):
        s = _cv_agrupado(lambda a=a: _penalizado(a), X, y, g, 4, seed)
        if s > melhor_sa:
            melhor_a, melhor_sa = a, s
    pen_final = _penalizado(melhor_a).fit(X, y)
    return {"xgb": xgb_final, "pen": pen_final, "cols": cols,
            "hiper": {"xgb": melhor_x, "pen_alpha": melhor_a, "cv_interna_rho": {"xgb": melhor_s, "pen": melhor_sa}}}


# ---------------------------------------------------------------- avaliacao unica no held-out
def avaliar_held_out(df: pd.DataFrame, cfg: dict, saida: str, *, dryrun_sintetico: bool,
                     B: int = 10000, seed: int = 20261006, origem_dados: str = "") -> dict:
    for c in COLUNAS_OBRIGATORIAS:
        if c not in df.columns:
            raise ErroAvaliacao(f"coluna obrigatoria ausente: {c}")
    if not dryrun_sintetico:
        pr = cfg.get("pre_registro") or {}
        if not (pr.get("declarado_por") and pr.get("declarado_em") and pr.get("sha256_config_congelada")):
            raise ErroAvaliacao("modo probatorio exige cfg['pre_registro'] com declarado_por, declarado_em e "
                                "sha256_config_congelada (D24 mitigacoes 2 e 3: blocos e monotonicidade "
                                "declarados ANTES do ajuste, pelo pesquisador)")
    prefixo = "DRYRUN_SINTETICO_" if dryrun_sintetico else ""
    os.makedirs(saida, exist_ok=True)
    trava = os.path.join(saida, f"{prefixo}avaliacao_heldout.TRAVA.json")
    if os.path.exists(trava):
        raise ErroAvaliacao("o held-out ja foi avaliado (D25: uma unica avaliacao). Apague a trava "
                            "somente por decisao escrita do pesquisador: " + trava)
    papeis = set(df["Papel_Conjunto"].unique())
    if not papeis <= {"treino", "held-out"}:
        raise ErroAvaliacao(f"Papel_Conjunto invalido: {sorted(papeis)}")
    treino = df[df["Papel_Conjunto"] == "treino"].reset_index(drop=True)
    teste = df[df["Papel_Conjunto"] == "held-out"].reset_index(drop=True)
    if set(treino["Poligono_ID"]) & set(teste["Poligono_ID"]):
        raise ErroAvaliacao("poligono presente em treino e held-out (vazamento)")
    if teste["Poligono_ID"].nunique() < 2 or treino["Poligono_ID"].nunique() < 4:
        raise ErroAvaliacao("poligonos insuficientes")

    mod = ajustar_competidores(treino, cfg, seed)
    X_te = teste[mod["cols"]]
    y_te = teste[cfg["alvo"]].to_numpy(dtype=float)
    g_te = teste[cfg["grupo"]].to_numpy()
    preds = {"xgb": mod["xgb"].predict(X_te), "pen": mod["pen"].predict(X_te),
             "rusle": rusle_a(teste, cfg["rusle"])}
    # emparelhamento: mesmas celulas para os tres (descarta as sem RUSLE e REPORTA)
    ok = ~np.isnan(preds["rusle"]) & ~np.isnan(y_te)
    n_desc = int((~ok).sum())
    rusle_indisponivel = (ok.sum() == 0)
    rel = {"dryrun_sintetico": dryrun_sintetico, "origem_dados": origem_dados, "seed": seed, "B": B,
           "n_poligonos_treino": int(treino["Poligono_ID"].nunique()),
           "n_poligonos_heldout": int(teste["Poligono_ID"].nunique()),
           "n_celulas_heldout": int(len(teste)), "celulas_descartadas_sem_rusle": n_desc,
           "hiperparametros": mod["hiper"], "criterio": {"piso_rho": PISO_RHO, "margem_rho": MARGEM_RHO,
           "piso_auc": PISO_AUC, "margem_auc": MARGEM_AUC, "limiar_binario": LIMIAR_BINARIO,
           "tweedie_power_proposta_P10": TWEEDIE_POWER}}
    if rusle_indisponivel:
        rel["desfecho"] = classificar_desfecho(float("nan"), float("nan"), float("nan"), None, None)
    else:
        y, g = y_te[ok], g_te[ok]
        P = {k: v[ok] for k, v in preds.items()}
        rho = {k: spearman_rapido(y, v) for k, v in P.items()}
        yb = (y >= LIMIAR_BINARIO).astype(int)
        auc = {k: auc_postos(yb, v) for k, v in P.items()}
        b_xr = bootstrap_diferenca(y, P["xgb"], P["rusle"], g, "spearman", B=B, seed=seed)
        b_xp = bootstrap_diferenca(y, P["xgb"], P["pen"], g, "spearman", B=B, seed=seed + 1)
        b_auc = bootstrap_diferenca(y, P["xgb"], P["rusle"], g, "auc", B=B, seed=seed + 2)
        rel.update({"rho_spearman": rho, "auc_binario_25pct": auc,
                    "prevalencia_binaria_heldout": float(yb.mean()),
                    "dif_rho_xgb_menos_rusle": vars(b_xr), "dif_rho_xgb_menos_pen": vars(b_xp),
                    "dif_auc_xgb_menos_rusle": vars(b_auc),
                    "secundaria_atendida": {"auc_xgb>=0,70": bool(auc["xgb"] >= PISO_AUC - EPS),
                                            "delta_auc>=0,05": bool(auc["xgb"] - auc["rusle"] >= MARGEM_AUC - EPS)},
                    "desfecho": classificar_desfecho(rho["xgb"], rho["rusle"], rho["pen"],
                                                     b_xr.ic95, b_xp.ic95)})
    rel["aviso"] = ("DRYRUN SINTETICO: nenhum numero deste arquivo e evidencia cientifica."
                    if dryrun_sintetico else "Resultado PROBATORIO: avaliacao unica do held-out (D25).")
    caminho = os.path.join(saida, f"{prefixo}avaliacao_d25.json")
    with open(caminho, "w", encoding="utf-8") as fh:
        json.dump(rel, fh, ensure_ascii=False, indent=2, default=float)
    with open(trava, "w", encoding="utf-8") as fh:
        json.dump({"criado_em": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                   "relatorio": os.path.basename(caminho),
                   "sha256_relatorio": sha256_arquivo(caminho)}, fh, indent=2)
    return rel


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Avaliacao D25 (SAREL v2)")
    ap.add_argument("--dados", required=True, help="CSV ou XLSX da matriz (obrigatorio; sem padrao)")
    ap.add_argument("--config", required=True, help="JSON: alvo, grupo, blocos, monotonicidade, rusle")
    ap.add_argument("--saida", required=True)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--probatorio", action="store_true")
    g.add_argument("--dryrun-sintetico", action="store_true")
    ap.add_argument("--B", type=int, default=10000)
    ap.add_argument("--seed", type=int, default=20261006)
    a = ap.parse_args(argv)
    df = carregar_csv_sarel(a.dados) if a.dados.lower().endswith(".csv") else pd.read_excel(a.dados)
    with open(a.config, encoding="utf-8") as fh:
        cfg = json.load(fh)
    rel = avaliar_held_out(df, cfg, a.saida, dryrun_sintetico=a.dryrun_sintetico, B=a.B, seed=a.seed,
                           origem_dados=f"{a.dados} sha256={sha256_arquivo(a.dados)}")
    print(json.dumps(rel["desfecho"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except ErroAvaliacao as e:
        print(f"[ERRO] {e}", file=sys.stderr)
        sys.exit(2)
