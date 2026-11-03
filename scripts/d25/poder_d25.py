#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SIMULACAO — NAO E RESULTADO CIENTIFICO. Nao ha dado de desfecho neste projeto.

Material de decisao para os gates G-13 (poder e margem) e G-12 (escala da margem).

Responde a duas perguntas que o pre-registro de D25 deixa abertas:

  (1) ITEM 4 / N-04 — Qual o poder de detectar uma vantagem de 0,10 na correlacao de postos,
      com bootstrap por poligono, para cada numero de clusters que as saidas de G-01 produzem
      (36, 30, 28 ou 24 poligonos held-out)?

  (2) ITEM 5 / N-03 — A margem de 0,10 significa a MESMA COISA em qualquer prevalencia de
      zeros? D26 declara que "a maioria das celulas e 0"; com forte inflacao de zeros todos os
      zeros EMPATAM, e a correlacao de postos passa a medir sobretudo a separacao zero/nao-zero.
      Se a distribuicao nula depender da prevalencia, o pre-registro fixa um numero numa escala
      que so sera conhecida depois do primeiro voo.

TRATAMENTO DE EMPATES, declarado: usa `scipy.stats.rankdata` com o metodo "average" (ranks
medios), que e o padrao de `scipy.stats.spearmanr`. A escolha importa: com 70% a 95% de zeros,
a maior parte das observacoes compartilha um unico rank medio.

ESTRUTURA DO DADO SIMULADO: `k` poligonos de 502 celulas de 10 m (5,02 ha). O bootstrap
reamostra POLIGONOS com reposicao, como o D25 faz — nao celulas.

Uso:
    python3 scripts/d25/poder_d25.py
    python3 scripts/d25/poder_d25.py --replicas 400 --bootstrap 300 --seed 20261103
"""

from __future__ import annotations

import argparse
import sys

import numpy as np

try:
    from scipy.stats import rankdata, spearmanr
except ImportError:  # pragma: no cover
    print(
        "[ERRO] scipy e obrigatorio para esta simulacao (rankdata/spearmanr).\n"
        "       pip install -r scripts/d25/requirements.txt",
        file=sys.stderr,
    )
    raise SystemExit(1)

CELULAS_POR_POLIGONO = 502  # 5,02 ha a 10 m
MARGEM_D25 = 0.10
CLUSTERS_POR_CENARIO_G01 = {
    36: "pre-registrado, 18 estratos",
    30: "Op.1 / Op.2 pura / Op.3-S1, 15 estratos",
    28: "Op.1-v / Op.2+colapso, 14 estratos",
    24: "Op.3 em S1 e S2, 12 estratos",
}
PREVALENCIAS_ZERO = (0.50, 0.70, 0.85, 0.95)


def spearman(a: np.ndarray, b: np.ndarray) -> float:
    """Correlacao de postos com ranks medios nos empates.

    Implementada sobre `rankdata` + Pearson em vez de chamar `spearmanr` no laco, por
    desempenho. `--conferir` valida contra `spearmanr` para garantir que sao a mesma coisa.
    """
    ra = rankdata(a, method="average")
    rb = rankdata(b, method="average")
    ra = ra - ra.mean()
    rb = rb - rb.mean()
    denom = np.sqrt((ra * ra).sum() * (rb * rb).sum())
    if denom == 0:
        return float("nan")
    return float((ra * rb).sum() / denom)


# D24 estima ~920 unidades efetivas em 18.072 celulas de 36 poligonos held-out, isto e cerca de
# 25,6 unidades efetivas POR POLIGONO de 502 celulas. Isso implica correlacao intraclasse de
# aproximadamente n_eff = n / (1 + (n-1)*ICC)  ->  502/(1+501*ICC) = 25,6  ->  ICC ~ 0,0375.
UNIDADES_EFETIVAS_POR_POLIGONO_D24 = 25.6
ICC_IMPLICITO = (CELULAS_POR_POLIGONO / UNIDADES_EFETIVAS_POR_POLIGONO_D24 - 1) / (
    CELULAS_POR_POLIGONO - 1
)


def gerar_alvo(
    rng: np.random.Generator,
    n_poligonos: int,
    prevalencia_zero: float,
    sd_poligono: float,
) -> np.ndarray:
    """Alvo em [0, 1] com excesso de zeros e EFEITO DE POLIGONO (D26 + D24).

    A primeira versao desta simulacao gerava `y` i.i.d. em todas as celulas, sem efeito de
    poligono. Era otimista por construcao: sem variancia ENTRE clusters, o bootstrap por cluster
    produzia IC de largura ~0,02 e poder de 100% em todos os cenarios — o oposto do que a
    analise de D24 e da auditoria indicam. O erro era meu, e esta corrigido aqui.

    `sd_poligono` desloca a prevalencia de zeros de cada poligono na escala logito, o que gera a
    correlacao intraclasse que D24 mede indiretamente pelas unidades efetivas.
    """
    y = np.zeros(n_poligonos * CELULAS_POR_POLIGONO)
    logito_base = np.log(prevalencia_zero / (1 - prevalencia_zero))

    for j in range(n_poligonos):
        ini = j * CELULAS_POR_POLIGONO
        fim = ini + CELULAS_POR_POLIGONO
        logito_j = logito_base + rng.normal(0.0, sd_poligono)
        prev_j = 1.0 / (1.0 + np.exp(-logito_j))
        positivos = rng.random(CELULAS_POR_POLIGONO) >= prev_j
        k = int(positivos.sum())
        if k:
            # A intensidade tipica das manchas tambem varia por poligono (relevo, manejo, solo).
            a_j = np.clip(rng.normal(1.5, 0.4), 0.4, 5.0)
            y[ini:fim][positivos] = rng.beta(a_j, 6.0, size=k)
    return y


def score_com_rho(
    rng: np.random.Generator, y: np.ndarray, rho_alvo: float, tol: float = 0.004
) -> np.ndarray:
    """Score preditivo cuja correlacao de postos com `y` aproxima `rho_alvo`.

    Constroi `rank(y) + ruido` e calibra a escala do ruido por busca binaria. Nao ha formula
    fechada porque o numero de empates em y muda a relacao entre ruido e rho.
    """
    base = rankdata(y, method="average").astype(float)
    base = (base - base.mean()) / (base.std() or 1.0)
    ruido = rng.standard_normal(y.size)

    lo, hi = 1e-4, 200.0
    melhor = base + hi * ruido
    for _ in range(60):
        meio = (lo + hi) / 2
        cand = base + meio * ruido
        r = spearman(cand, y)
        if abs(r - rho_alvo) < tol:
            return cand
        if r > rho_alvo:  # pouco ruido -> correlacao alta demais
            lo = meio
        else:
            hi = meio
        melhor = cand
    return melhor


def scores_competidores(
    rng: np.random.Generator,
    y: np.ndarray,
    n_poligonos: int,
    rho_base: float,
    vantagem_media: float,
    sd_vantagem: float,
) -> tuple[np.ndarray, np.ndarray]:
    """Dois scores: competidor (`rho_base`) e modelo, com vantagem que VARIA por poligono.

    A vantagem do modelo nao e uniforme na paisagem: ele pode ganhar muito onde a feicao e
    nitida e nada onde a cobertura e densa. E essa heterogeneidade — nao o numero de celulas —
    que o bootstrap por poligono mede, e e ela que governa o poder com poucos clusters.
    """
    sa = np.empty_like(y)
    sb = np.empty_like(y)
    for j in range(n_poligonos):
        ini = j * CELULAS_POR_POLIGONO
        fim = ini + CELULAS_POR_POLIGONO
        yj = y[ini:fim]
        if np.unique(yj).size < 3:
            # Poligono praticamente sem variacao: nenhum modelo ordena nada aqui.
            sa[ini:fim] = rng.standard_normal(CELULAS_POR_POLIGONO)
            sb[ini:fim] = rng.standard_normal(CELULAS_POR_POLIGONO)
            continue
        rho_b_j = float(np.clip(rho_base + rng.normal(0.0, sd_vantagem), 0.02, 0.95))
        vantagem_j = rng.normal(vantagem_media, sd_vantagem)
        rho_a_j = float(np.clip(rho_b_j + vantagem_j, 0.02, 0.95))
        sb[ini:fim] = score_com_rho(rng, yj, rho_b_j)
        sa[ini:fim] = score_com_rho(rng, yj, rho_a_j)
    return sa, sb


def ic_bootstrap_por_cluster(
    rng: np.random.Generator,
    grupos: np.ndarray,
    y: np.ndarray,
    score_a: np.ndarray,
    score_b: np.ndarray,
    b: int,
) -> tuple[float, float, float]:
    """IC percentil 95% da diferenca de Spearman, reamostrando POLIGONOS com reposicao."""
    ids = np.unique(grupos)
    indices_por_grupo = {g: np.flatnonzero(grupos == g) for g in ids}
    difs = np.empty(b)

    for i in range(b):
        escolhidos = rng.choice(ids, size=ids.size, replace=True)
        idx = np.concatenate([indices_por_grupo[g] for g in escolhidos])
        difs[i] = spearman(score_a[idx], y[idx]) - spearman(score_b[idx], y[idx])

    return float(np.percentile(difs, 2.5)), float(np.percentile(difs, 97.5)), float(difs.std())


def teto_atingivel(
    rng: np.random.Generator, n_poligonos: int, prevalencia_zero: float, sd_poligono: float
) -> float:
    """Maior Spearman que um score CONTINUO alcanca contra um alvo com muitos empates.

    Importa porque, se o teto e bem menor que 1, uma margem absoluta de 0,10 consome uma fatia
    muito maior do intervalo util do que parece.
    """
    y = gerar_alvo(rng, n_poligonos, prevalencia_zero, sd_poligono)
    # Score perfeito: separa zeros de positivos e ordena os positivos corretamente.
    perfeito = y + rng.random(y.size) * 1e-9
    return spearman(perfeito, y)


def nula_por_prevalencia(
    rng: np.random.Generator,
    k_clusters: int,
    prevalencia_zero: float,
    replicas: int,
    sd_poligono: float,
) -> tuple[float, float]:
    """Desvio e percentil 97,5 da distribuicao NULA da diferenca de Spearman (sem sinal)."""
    n = k_clusters * CELULAS_POR_POLIGONO
    difs = np.empty(replicas)
    for i in range(replicas):
        y = gerar_alvo(rng, k_clusters, prevalencia_zero, sd_poligono)
        a = rng.standard_normal(n)
        b = rng.standard_normal(n)
        difs[i] = spearman(a, y) - spearman(b, y)
    return float(difs.std()), float(np.percentile(np.abs(difs), 97.5))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--replicas", type=int, default=200, help="repeticoes de Monte Carlo")
    ap.add_argument("--bootstrap", type=int, default=300, help="reamostragens por replica")
    ap.add_argument("--seed", type=int, default=20261103)
    ap.add_argument("--rho-base", type=float, default=0.45, help="Spearman do competidor")
    ap.add_argument(
        "--sd-poligono",
        type=float,
        default=0.8,
        help="desvio do efeito de poligono na prevalencia (escala logito)",
    )
    ap.add_argument(
        "--sd-vantagem",
        nargs="+",
        type=float,
        default=[0.05, 0.15, 0.30, 0.45],
        help="desvios da vantagem do modelo ENTRE poligonos; o poder depende criticamente disto",
    )
    ap.add_argument("--conferir", action="store_true", help="valida spearman() contra scipy")
    a = ap.parse_args()

    rng = np.random.default_rng(a.seed)

    print("=" * 84)
    print("SIMULACAO DE PODER E DE ESCALA DA MARGEM — D25")
    print("NAO E RESULTADO CIENTIFICO: nao existe dado de desfecho neste projeto.")
    print("=" * 84)
    print(f"Empates: ranks medios (scipy rankdata 'average'), o padrao de spearmanr.")
    print(f"Celulas por poligono: {CELULAS_POR_POLIGONO} | margem pre-registrada: {MARGEM_D25}")
    print(f"Monte Carlo: {a.replicas} replicas | bootstrap por cluster: {a.bootstrap}")
    print(f"Semente: {a.seed} | Spearman do competidor: {a.rho_base}")
    print(f"Efeito de poligono: SD {a.sd_poligono} em logito | ICC implicito por D24: "
          f"{ICC_IMPLICITO:.4f} (~{UNIDADES_EFETIVAS_POR_POLIGONO_D24:.1f} unidades efetivas/poligono)")
    print()

    if a.conferir:
        y = gerar_alvo(rng, 8, 0.80, a.sd_poligono)
        s = score_com_rho(rng, y, 0.5)
        meu, ref = spearman(s, y), float(spearmanr(s, y).statistic)
        print(f"[conferencia] spearman() = {meu:.10f} | scipy.spearmanr = {ref:.10f} | "
              f"diferenca = {abs(meu-ref):.2e}")
        print()

    print("-" * 84)
    print("ITEM 5 / N-03 — A MARGEM DE 0,10 TEM A MESMA ESCALA EM QUALQUER PREVALENCIA?")
    print("-" * 84)
    print(f"{'zeros':>7}{'teto Spearman':>16}{'SD da nula':>13}{'|dif| 97,5%':>13}"
          f"{'0,10 em SD':>12}{'0,10/teto':>11}")
    print("-" * 72)
    escala = {}
    for z in PREVALENCIAS_ZERO:
        teto = teto_atingivel(rng, 36, z, a.sd_poligono)
        sd, p975 = nula_por_prevalencia(rng, 36, z, max(60, a.replicas // 3), a.sd_poligono)
        escala[z] = (teto, sd, p975)
        print(f"{z*100:>6.0f}%{teto:>16.4f}{sd:>13.5f}{p975:>13.5f}"
              f"{MARGEM_D25/sd:>12.1f}{MARGEM_D25/teto:>11.3f}")
    print()
    tetos = [escala[z][0] for z in PREVALENCIAS_ZERO]
    sds = [escala[z][1] for z in PREVALENCIAS_ZERO]
    print(f"Teto varia de {min(tetos):.4f} a {max(tetos):.4f}  "
          f"(razao {max(tetos)/min(tetos):.2f}x)")
    print(f"SD da nula varia de {min(sds):.5f} a {max(sds):.5f}  "
          f"(razao {max(sds)/min(sds):.2f}x)")
    print()
    print("Leitura: 0,10 expresso em desvios da nula e em fracao do teto NAO e constante entre")
    print("prevalencias. A prevalencia de zeros so sera conhecida depois do primeiro voo.")
    print()

    print("-" * 84)
    print("ITEM 4 / N-04 — PODER POR NUMERO DE CLUSTERS (diferenca verdadeira = 0,10)")
    print("-" * 84)
    print(f"{'clusters':>9}{'cenario G-01':<38}{'poder':>8}{'IC medio':>11}{'largura':>10}")
    print("-" * 78)
    PREV_REFERENCIA = 0.85  # "a maioria das celulas e 0" (D26)
    print("Vantagem media verdadeira = 0,10. O poder depende criticamente de quanto essa")
    print("vantagem VARIA entre poligonos, que e quantidade desconhecida antes do voo.")
    print()
    print(f"{'SD vantagem':>12}", end="")
    for k in CLUSTERS_POR_CENARIO_G01:
        print(f"{('k=' + str(k)):>12}", end="")
    print()
    print("-" * (12 + 12 * len(CLUSTERS_POR_CENARIO_G01)))

    larguras_registro: dict[tuple[float, int], float] = {}
    for sd_v in a.sd_vantagem:
        print(f"{sd_v:>12.2f}", end="")
        for k in CLUSTERS_POR_CENARIO_G01:
            grupos = np.repeat(np.arange(k), CELULAS_POR_POLIGONO)
            acertos = 0
            larguras = []
            for _ in range(a.replicas):
                y = gerar_alvo(rng, k, PREV_REFERENCIA, a.sd_poligono)
                sa, sb = scores_competidores(
                    rng, y, k, a.rho_base, MARGEM_D25, sd_v
                )
                lo, hi, _sd = ic_bootstrap_por_cluster(rng, grupos, y, sa, sb, a.bootstrap)
                larguras.append(hi - lo)
                if lo > 0:
                    acertos += 1
            poder = acertos / a.replicas
            larguras_registro[(sd_v, k)] = float(np.mean(larguras))
            print(f"{poder*100:>11.1f}%", end="")
        print()
    print()
    print("Largura media do IC de 95%:")
    print(f"{'SD vantagem':>12}", end="")
    for k in CLUSTERS_POR_CENARIO_G01:
        print(f"{('k=' + str(k)):>12}", end="")
    print()
    print("-" * (12 + 12 * len(CLUSTERS_POR_CENARIO_G01)))
    for sd_v in a.sd_vantagem:
        print(f"{sd_v:>12.2f}", end="")
        for k in CLUSTERS_POR_CENARIO_G01:
            print(f"{larguras_registro[(sd_v, k)]:>12.4f}", end="")
        print()
    print()
    print(f"Prevalencia de zeros usada: {PREV_REFERENCIA*100:.0f}%. O poder tambem depende dela — Item 5.")
    print("Poder = fracao de replicas em que o limite inferior do IC de 95% por cluster excede 0.")
    print()
    print("Cenarios de G-01, por numero de clusters held-out:")
    for k, rotulo in CLUSTERS_POR_CENARIO_G01.items():
        print(f"  k={k:<3} {rotulo}")
    print()
    print("-" * 84)
    print("O que esta simulacao NAO faz")
    print("-" * 84)
    print("- Nao usa dado real: nao existe desfecho neste projeto.")
    print("- Nao modela autocorrelacao espacial ENTRE poligonos (V-02), so o agrupamento dentro.")
    print("- Nao recomenda margem, metrica nem desenho. G-12 e G-13 sao do pesquisador.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
