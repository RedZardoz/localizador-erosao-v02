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
TWEEDIE_POWER = 1.5            # padrao quando a configuracao nao declara grade (P10, proposta)
GRADE_PADRAO = {"p": [1.2, 1.5, 1.8],
                "xgb": [dict(max_depth=md, learning_rate=lr, n_estimators=ne, min_child_weight=mcw)
                        for md in (2, 3) for lr in (0.05, 0.1) for ne in (100, 300) for mcw in (5, 20)],
                "alpha": [1e-3, 1e-2, 1e-1, 1.0, 10.0]}
# Saidas/derivados do competidor RUSLE nunca entram como preditor (D25: o modelo nao pode receber a
# saida do competidor). LS e K/R sao admitidos pelos blocos de D24 (terreno, solo, chuva).
PROIBIDOS_COMO_PREDITOR = {"RUSLE_Fator_C", "RUSLE_Fator_P", "RUSLE_Perda_Solo_t_ha_ano", "RUSLE_A"}
# Alvo, chaves, geometria e metadados nunca entram como preditor (revisao de 09/10/2026: o teto numerico
# por bloco nao pegava um erro de digitacao que levasse o alvo ou um identificador ao modelo).
PROIBIDOS_ALVO_E_CHAVES = {"Fracao_Erodida", "Alvo_Binario_25", "Classe_Alvo_Binaria", "Poligono_ID",
                           "Papel_Conjunto", "Estrato_ID", "Celula_ID", "Lat", "Lon", "Grade_X", "Grade_Y",
                           "Cobertura_Celula", "Incluida", "Area_Delineada_m2", "Marcador_K_Ambiguo_D08", "Pixel_ID"}
PREFIXOS_PROIBIDOS = ("Rotulo_",)
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
    vazados = sorted(c for c in usados if c in PROIBIDOS_ALVO_E_CHAVES or c.startswith(PREFIXOS_PROIBIDOS))
    if vazados:
        raise ErroAvaliacao(f"preditor proibido (alvo, chave, geometria ou rotulo): {vazados}")
    if sum(len(c) for c in blocos.values()) > 14:
        raise ErroAvaliacao("total de preditores > 14 (D24)")


def validar_monotonicidade(blocos: dict, mono: dict) -> None:
    """Toda chave de monotonicidade deve ser um preditor declarado e o sinal deve ser -1, 0 ou 1.
    (Uma chave com erro de digitacao desligaria a restricao pre-registrada em silencio.)"""
    cols = {c for b in blocos.values() for c in b}
    desconhecidas = sorted(set(mono) - cols)
    if desconhecidas:
        raise ErroAvaliacao(f"monotonicidade referencia coluna que nao e preditor declarado: {desconhecidas}")
    invalidos = {k: v for k, v in mono.items() if v not in (-1, 0, 1)}
    if invalidos:
        raise ErroAvaliacao(f"sinal de monotonicidade fora de {{-1,0,1}}: {invalidos}")


def hash_config(cfg: dict) -> str:
    """SHA-256 da configuracao SEM a chave 'pre_registro', em JSON canonico (chaves ordenadas, UTF-8, sem
    espacos). E o valor que o pesquisador declara em pre_registro.sha256_config_congelada."""
    corpo = {k: v for k, v in cfg.items() if k != "pre_registro"}
    texto = json.dumps(corpo, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(texto.encode("utf-8")).hexdigest()


def auditar_preditores(treino: pd.DataFrame, teste: pd.DataFrame, cols: list) -> dict:
    """Recusa preditor ausente do CSV, 100 % ausente ou constante no treino; devolve n_validos por coluna."""
    faltam = [c for c in cols if c not in treino.columns]
    if faltam:
        raise ErroAvaliacao(f"preditor declarado ausente da matriz: {faltam}")
    rel = {}
    for c in cols:
        v = pd.to_numeric(treino[c], errors="coerce")
        if v.notna().sum() == 0:
            raise ErroAvaliacao(f"preditor {c} esta 100 % ausente no treino")
        if v.dropna().nunique() < 2:
            raise ErroAvaliacao(f"preditor {c} e constante no treino")
        vt = pd.to_numeric(teste[c], errors="coerce")
        rel[c] = {"n_validos_treino": int(v.notna().sum()), "n_treino": int(len(v)),
                  "n_validos_heldout": int(vt.notna().sum()), "n_heldout": int(len(vt))}
    return rel


def _so_incluidas(df: pd.DataFrame) -> pd.DataFrame:
    """Se a matriz traz 'Incluida' (cobertura minima da celula no voo, P11), usa so as incluidas."""
    if "Incluida" not in df.columns:
        return df
    inc = df["Incluida"].map(lambda v: v is True or str(v).strip().lower() in ("true", "1", "1.0", "verdadeiro"))
    return df[inc].reset_index(drop=True)


def _checar_pixels_disjuntos(treino: pd.DataFrame, teste: pd.DataFrame) -> None:
    """O mesmo pixel de 10 m nao pode estar em treino e held-out (poligonos vizinhos compartilham pixels
    de borda). Usa a coluna opaca Pixel_ID; na falta dela, Grade_X/Grade_Y (so no CSV intermediario local)."""
    if "Pixel_ID" in treino.columns:
        k = lambda d: set(d["Pixel_ID"].astype(str))
    elif {"Grade_X", "Grade_Y"} <= set(treino.columns):
        k = lambda d: set(zip(d["Grade_X"].round(3), d["Grade_Y"].round(3)))
    else:
        return
    comum = k(treino) & k(teste)
    if comum:
        raise ErroAvaliacao(f"{len(comum)} pixel(is) de 10 m em treino e held-out (vazamento espacial)")


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
    """Aplica D25 + emenda proposta de 06/10/2026 (lacuna da margem: INCONCLUSIVA_MARGEM)."""
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
        desfecho, motivo = "INCONCLUSIVA_MARGEM", ("piso atingido e rho_xgb >= rho_rusle, mas margem < 0,10: "
                                                    "utilidade sem vantagem demonstrada (nao refuta nem corrobora)")
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


def _grades(cfg: dict) -> dict:
    """Grade pre-registrada (cfg['grade']) ou o padrao. A escolha dentro da grade usa SO o treino."""
    g = dict(GRADE_PADRAO)
    g.update(cfg.get("grade") or {})
    if not g["p"] or not all(1.0 < float(p) < 2.0 for p in g["p"]):
        raise ErroAvaliacao("expoentes de Tweedie devem estar em (1, 2)")
    return g


def _xgb(params, cols, mono, seed, p=TWEEDIE_POWER):
    import xgboost as xgb
    cst = "(" + ",".join(str(int(mono.get(c, 0))) for c in cols) + ")"
    return xgb.XGBRegressor(objective="reg:tweedie", tweedie_variance_power=float(p),
                            tree_method="hist", subsample=0.8, colsample_bytree=0.8, reg_lambda=1.0,
                            monotone_constraints=cst, random_state=seed, n_jobs=1, verbosity=0, **params)


def _penalizado(alpha, p=TWEEDIE_POWER):
    from sklearn.impute import SimpleImputer
    from sklearn.linear_model import TweedieRegressor
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler
    # imputacao pela mediana SOMENTE do treino da dobra, com indicador de ausencia (DEC-7)
    return make_pipeline(SimpleImputer(strategy="median", add_indicator=True), StandardScaler(),
                         TweedieRegressor(power=float(p), link="log", alpha=alpha, max_iter=2000))


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
    """Ajusta XGBoost (com e sem monotonicidade) e Tweedie penalizado SO com os poligonos de treino.
    Hiperparametros e expoente p de Tweedie escolhidos por validacao agrupada interna (no treino)."""
    validar_teto_blocos(cfg["blocos"])
    cols = [c for b in cfg["blocos"].values() for c in b]
    X = treino[cols]
    y = treino[cfg["alvo"]].to_numpy(dtype=float)
    g = treino[cfg["grupo"]].to_numpy()
    if (y < 0).any() or (y > 1).any() or np.isnan(y).any():
        raise ErroAvaliacao("Fracao_Erodida fora de [0,1] ou ausente no treino")
    mono = cfg.get("monotonicidade", {})
    gr = _grades(cfg)
    melhor_x, melhor_s = None, -np.inf
    for pw in gr["p"]:
        for par in gr["xgb"]:
            s_ = _cv_agrupado(lambda par=par, pw=pw: _xgb(par, cols, mono, seed, pw), X, y, g, 4, seed)
            if s_ > melhor_s:
                melhor_x, melhor_s = (par, pw), s_
    xgb_final = _xgb(melhor_x[0], cols, mono, seed, melhor_x[1]).fit(X, y)
    # sensibilidade pre-registrada: mesmos hiperparametros e p, SEM restricoes de monotonicidade
    xgb_livre = _xgb(melhor_x[0], cols, {}, seed, melhor_x[1]).fit(X, y)
    melhor_a, melhor_sa = None, -np.inf
    for pw in gr["p"]:
        for a in gr["alpha"]:
            s_ = _cv_agrupado(lambda a=a, pw=pw: _penalizado(a, pw), X, y, g, 4, seed)
            if s_ > melhor_sa:
                melhor_a, melhor_sa = (a, pw), s_
    pen_final = _penalizado(melhor_a[0], melhor_a[1]).fit(X, y)
    return {"xgb": xgb_final, "xgb_livre": xgb_livre, "pen": pen_final, "cols": cols,
            "hiper": {"xgb": melhor_x[0], "xgb_p_tweedie": melhor_x[1], "pen_alpha": melhor_a[0],
                      "pen_p_tweedie": melhor_a[1], "grade_p": gr["p"],
                      "cv_interna_rho": {"xgb": melhor_s, "pen": melhor_sa}}}


# ---------------------------------------------------------------- avaliacao unica no held-out
def _gravar_json(caminho: str, obj: dict) -> None:
    with open(caminho, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=2, default=float)


def avaliar_held_out(df: pd.DataFrame, cfg: dict, saida: str, *, dryrun_sintetico: bool,
                     B: int = 10000, seed: int = 20261006, origem_dados: str = "",
                     caminho_dados: str = "") -> dict:
    """Avaliacao unica do held-out (D25). A TRAVA e gravada ANTES do ajuste e da leitura dos rotulos do
    held-out; falha depois dela conta como tentativa consumida. Com caminho_dados, uma segunda trava fica
    ao lado do arquivo de dados (nao depende de --saida)."""
    for c in COLUNAS_OBRIGATORIAS:
        if c not in df.columns:
            raise ErroAvaliacao(f"coluna obrigatoria ausente: {c}")
    h_cfg = hash_config(cfg)
    if not dryrun_sintetico:
        pr = cfg.get("pre_registro") or {}
        if not (pr.get("declarado_por") and pr.get("declarado_em") and pr.get("sha256_config_congelada")):
            raise ErroAvaliacao("modo probatorio exige cfg['pre_registro'] com declarado_por, declarado_em e "
                                "sha256_config_congelada (D24 mitigacoes 2 e 3: blocos e monotonicidade "
                                "declarados ANTES do ajuste, pelo pesquisador)")
        if str(pr["sha256_config_congelada"]).strip().lower() != h_cfg:
            raise ErroAvaliacao("sha256_config_congelada nao confere com o hash da configuracao "
                                f"(esperado {h_cfg}): a configuracao mudou depois do congelamento")
    prefixo = "DRYRUN_SINTETICO_" if dryrun_sintetico else ""
    os.makedirs(saida, exist_ok=True)
    trava = os.path.join(saida, f"{prefixo}avaliacao_heldout.TRAVA.json")
    travas = [trava] + ([os.path.join(os.path.dirname(os.path.abspath(caminho_dados)),
                                      f"{prefixo}{os.path.basename(caminho_dados)}.TRAVA_D25.json")]
                        if caminho_dados else [])
    for t in travas:
        if os.path.exists(t):
            raise ErroAvaliacao("o held-out ja foi avaliado ou a tentativa foi consumida (D25: uma unica "
                                "avaliacao). Apague a trava somente por decisao escrita do pesquisador: " + t)
    df = _so_incluidas(df)
    papeis = set(df["Papel_Conjunto"].unique())
    if not papeis <= {"treino", "held-out"}:
        raise ErroAvaliacao(f"Papel_Conjunto invalido: {sorted(papeis)}")
    treino = df[df["Papel_Conjunto"] == "treino"].reset_index(drop=True)
    teste = df[df["Papel_Conjunto"] == "held-out"].reset_index(drop=True)
    if set(treino["Poligono_ID"]) & set(teste["Poligono_ID"]):
        raise ErroAvaliacao("poligono presente em treino e held-out (vazamento)")
    if teste["Poligono_ID"].nunique() < 2 or treino["Poligono_ID"].nunique() < 4:
        raise ErroAvaliacao("poligonos insuficientes")
    _checar_pixels_disjuntos(treino, teste)
    validar_teto_blocos(cfg["blocos"])
    validar_monotonicidade(cfg["blocos"], cfg.get("monotonicidade", {}))
    cols = [c for b in cfg["blocos"].values() for c in b]
    auditoria = auditar_preditores(treino, teste, cols)
    trava_dados = {"estado": "iniciada", "criado_em": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                   "origem_dados": origem_dados, "sha256_config": h_cfg, "dryrun_sintetico": dryrun_sintetico}
    for t in travas:
        _gravar_json(t, trava_dados)
    try:
        rel = _ajustar_e_pontuar(df, treino, teste, cfg, saida, prefixo, dryrun_sintetico, B, seed,
                                 origem_dados, auditoria, h_cfg)
    except Exception as e:                      # tentativa consumida: a trava permanece e registra a falha
        for t in travas:
            _gravar_json(t, dict(trava_dados, estado="falhou", erro=f"{type(e).__name__}: {e}"))
        raise
    for t in travas:
        _gravar_json(t, dict(trava_dados, estado="concluida", relatorio=f"{prefixo}avaliacao_d25.json",
                             sha256_relatorio=sha256_arquivo(os.path.join(saida, f"{prefixo}avaliacao_d25.json"))))
    return rel


def _ajustar_e_pontuar(df, treino, teste, cfg, saida, prefixo, dryrun_sintetico, B, seed, origem_dados,
                       auditoria, h_cfg) -> dict:
    mod = ajustar_competidores(treino, cfg, seed)
    X_te = teste[mod["cols"]]
    y_te = teste[cfg["alvo"]].to_numpy(dtype=float)
    g_te = teste[cfg["grupo"]].to_numpy()
    preds = {"xgb": mod["xgb"].predict(X_te), "pen": mod["pen"].predict(X_te),
             "rusle": rusle_a(teste, cfg["rusle"]), "xgb_livre": mod["xgb_livre"].predict(X_te)}
    # emparelhamento: mesmas celulas para os tres (descarta as sem RUSLE e REPORTA)
    ok = ~np.isnan(preds["rusle"]) & ~np.isnan(y_te)
    n_desc = int((~ok).sum())
    rusle_indisponivel = (ok.sum() == 0)
    rel = {"dryrun_sintetico": dryrun_sintetico, "origem_dados": origem_dados, "seed": seed, "B": B,
           "n_poligonos_treino": int(treino["Poligono_ID"].nunique()),
           "n_poligonos_heldout": int(teste["Poligono_ID"].nunique()),
           "n_celulas_heldout": int(len(teste)), "celulas_descartadas_sem_rusle": n_desc,
           "sha256_config": h_cfg, "preditores_n_validos": auditoria,
           "hiperparametros": mod["hiper"], "criterio": {"piso_rho": PISO_RHO, "margem_rho": MARGEM_RHO,
           "piso_auc": PISO_AUC, "margem_auc": MARGEM_AUC, "limiar_binario": LIMIAR_BINARIO,
           "grade_p_tweedie_P10": _grades(cfg)["p"]}}
    if rusle_indisponivel:
        rel["desfecho"] = classificar_desfecho(float("nan"), float("nan"), float("nan"), None, None)
    else:
        y, g = y_te[ok], g_te[ok]
        P = {k: v[ok] for k, v in preds.items()}
        rho = {k: spearman_rapido(y, v) for k, v in P.items()}
        yb = (y >= LIMIAR_BINARIO).astype(int)
        auc = {k: auc_postos(yb, v) for k, v in P.items() if k != "xgb_livre"}
        b_xr = bootstrap_diferenca(y, P["xgb"], P["rusle"], g, "spearman", B=B, seed=seed)
        b_xp = bootstrap_diferenca(y, P["xgb"], P["pen"], g, "spearman", B=B, seed=seed + 1)
        b_auc = bootstrap_diferenca(y, P["xgb"], P["rusle"], g, "auc", B=B, seed=seed + 2)
        b_livre = bootstrap_diferenca(y, P["xgb_livre"], P["rusle"], g, "spearman", B=B, seed=seed + 3)
        sens = {"xgb_sem_monotonicidade": {"rho": rho["xgb_livre"], "dif_rho_menos_rusle": vars(b_livre),
                "nota": "sensibilidade pre-registrada; o desfecho principal usa o XGBoost COM monotonicidade"}}
        col_d08 = cfg.get("coluna_marcador_d08")
        if col_d08 and col_d08 in teste.columns:
            m08 = teste[col_d08].to_numpy()[ok]
            manter = np.array([(v is False) or (str(v).strip().lower() in ("false", "falso", "0", "0.0")) for v in m08])
            if manter.sum() >= 3 and len(set(g[manter])) >= 2:
                b08 = bootstrap_diferenca(y[manter], P["xgb"][manter], P["rusle"][manter], g[manter],
                                          "spearman", B=B, seed=seed + 4)
                sens["d08_sem_marcador_verdadeiro_ou_indisponivel"] = {
                    "n_celulas": int(manter.sum()), "rho_xgb": spearman_rapido(y[manter], P["xgb"][manter]),
                    "rho_rusle": spearman_rapido(y[manter], P["rusle"][manter]), "dif_rho_xgb_menos_rusle": vars(b08),
                    "nota": "avaliacao PRINCIPAL inclui todas as celulas (D08); esta e sensibilidade declarada"}
        rel["sensibilidades_pre_registradas"] = sens
        rel.update({"rho_spearman": {k: v for k, v in rho.items() if k != "xgb_livre"}, "auc_binario_25pct": auc,
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
    return rel


def juntar_linha_de_base(df: pd.DataFrame, caminho_csv: str) -> pd.DataFrame:
    """Left join por Celula_ID com o arquivo do perfil 'linha-de-base-rusle' (Celula_ID, RUSLE_A e, se houver,
    Marcador_K_Ambiguo_D08).
    Celula sem correspondencia fica com RUSLE_A ausente (NaN), nunca 0."""
    if "Celula_ID" not in df.columns:
        raise ErroAvaliacao("matriz sem Celula_ID: nao e possivel juntar a linha de base")
    lb = carregar_csv_sarel(caminho_csv)
    for c in ("Celula_ID", "RUSLE_A"):
        if c not in lb.columns:
            raise ErroAvaliacao(f"linha de base sem coluna {c}")
    if lb["Celula_ID"].duplicated().any():
        raise ErroAvaliacao("Celula_ID duplicado na linha de base")
    lb["RUSLE_A"] = pd.to_numeric(lb["RUSLE_A"], errors="coerce")
    extras = [c for c in ("Marcador_K_Ambiguo_D08",) if c in lb.columns]   # metadado D08 (nunca preditor)
    return df.merge(lb[["Celula_ID", "RUSLE_A"] + extras], on="Celula_ID", how="left")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Avaliacao D25 (SAREL v2)")
    ap.add_argument("--dados", required=True, help="CSV ou XLSX da matriz (obrigatorio; sem padrao)")
    ap.add_argument("--config", required=True, help="JSON: alvo, grupo, blocos, monotonicidade, rusle")
    ap.add_argument("--saida", required=True)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--probatorio", action="store_true")
    g.add_argument("--dryrun-sintetico", action="store_true")
    ap.add_argument("--linha-de-base", help="CSV do perfil linha-de-base-rusle (Celula_ID, RUSLE_A)")
    ap.add_argument("--B", type=int, default=10000)
    ap.add_argument("--seed", type=int, default=20261006)
    a = ap.parse_args(argv)
    df = carregar_csv_sarel(a.dados) if a.dados.lower().endswith(".csv") else pd.read_excel(a.dados)
    if a.linha_de_base:
        df = juntar_linha_de_base(df, a.linha_de_base)
    with open(a.config, encoding="utf-8") as fh:
        cfg = json.load(fh)
    rel = avaliar_held_out(df, cfg, a.saida, dryrun_sintetico=a.dryrun_sintetico, B=a.B, seed=a.seed,
                           origem_dados=f"{a.dados} sha256={sha256_arquivo(a.dados)}", caminho_dados=a.dados)
    print(json.dumps(rel["desfecho"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except ErroAvaliacao as e:
        print(f"[ERRO] {e}", file=sys.stderr)
        sys.exit(2)
