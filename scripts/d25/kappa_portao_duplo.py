#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SIMULACAO — material de decisao do gate G-08 (regra de kappa).

A PERGUNTA. O codigo exige kappa >= 0,61 COM limite inferior do IC de 95% tambem >= 0,61
(portao duplo); os documentos dizem 0,60 pontual. O portao duplo e muito mais exigente que o
ponto, e a pergunta que falta ao gate e simples: COM O n DE FOTOINTERPRETACAO PREVISTO, ELE E
ALCANCAVEL? Se nao for, o pesquisador precisa saber antes de adotar a regra, nao depois de
reprovar uma concordancia que, no ponto, seria substancial.

O QUE ESTE SCRIPT FAZ. Para kappa verdadeiro em {0,65; 0,70; 0,75; 0,80} e varias prevalencias,
simula a tabela 2x2 de dois observadores independentes, calcula o kappa de Cohen e o seu
erro-padrao assintotico (Fleiss, Cohen & Everitt, 1969), e mede a fracao de replicas em que o
limite inferior do IC de 95% atinge 0,61. Reporta o menor n com poder >= 80%.

NAO DECIDE a regra. 0,60 ou 0,61, pontual ou com IC, e decisao do pesquisador (G-08), e tem de
estar em D03/D16 antes de qualquer dado.

Uso:
    python3 scripts/kappa_portao_duplo.py
    python3 scripts/kappa_portao_duplo.py --replicas 4000 --limiar 0.61
"""

from __future__ import annotations

import argparse

import numpy as np

KAPPAS_VERDADEIROS = (0.65, 0.70, 0.75, 0.80)
PREVALENCIAS = (0.50, 0.30, 0.20)
N_CANDIDATOS = (30, 50, 80, 120, 200, 300, 500, 800, 1200)
PODER_ALVO = 0.80


def tabela_probabilidades(kappa: float, p: float) -> tuple[float, float, float]:
    """Tabela 2x2 simetrica (a, b, d) com marginais `p` e kappa de Cohen igual a `kappa`.

    a = concordancia em "presente", d = concordancia em "ausente", b = cada celula discordante.
    """
    pe = p * p + (1 - p) * (1 - p)
    po = pe + kappa * (1 - pe)
    a = (po - 1 + 2 * p) / 2
    b = p - a
    d = 1 - a - 2 * b
    return a, b, d


def kappa_e_se(n11: int, n12: int, n21: int, n22: int) -> tuple[float, float]:
    """Kappa de Cohen e erro-padrao assintotico de Fleiss, Cohen & Everitt (1969).

    LIMITACAO DECLARADA: o SE assintotico supoe itens INDEPENDENTES. Em fotointerpretacao de
    celulas vizinhas isso e otimista, e o IC real e mais largo — o mesmo problema que o codigo
    de validacao matricial declara para os sitios continuos (achado V-06).
    """
    n = n11 + n12 + n21 + n22
    if n == 0:
        return float("nan"), float("nan")
    p11, p12, p21, p22 = n11 / n, n12 / n, n21 / n, n22 / n
    pl1, pl2 = p11 + p12, p21 + p22  # marginais de linha
    pc1, pc2 = p11 + p21, p12 + p22  # marginais de coluna

    po = p11 + p22
    pe = pl1 * pc1 + pl2 * pc2
    if abs(1 - pe) < 1e-12:
        return float("nan"), float("nan")
    k = (po - pe) / (1 - pe)

    a_term = p11 * (1 - (pl1 + pc1) * (1 - k)) ** 2 + p22 * (1 - (pl2 + pc2) * (1 - k)) ** 2
    b_term = (1 - k) ** 2 * (p12 * (pc1 + pl2) ** 2 + p21 * (pc2 + pl1) ** 2)
    c_term = (k - pe * (1 - k)) ** 2
    var = (a_term + b_term - c_term) / ((1 - pe) ** 2 * n)
    return k, float(np.sqrt(max(var, 0.0)))


def poder_portao(
    # Nenhum atributo fisico e sintetizado neste script: ele simula tabelas de concordancia entre
    # dois observadores para medir a POTENCIA DE UMA REGRA DE DECISAO (G-08). Nada do que produz
    # entra em matriz, rotulo ou metrica, e a saida e marcada como simulacao no cabecalho.
    rng: np.random.Generator, kappa: float, p: float, n: int, limiar: float, replicas: int
) -> tuple[float, float]:
    """(poder do portao duplo, poder do portao pontual) para um n."""
    a, b, d = tabela_probabilidades(kappa, p)
    probs = [a, b, b, d]
    if min(probs) < 0:
        return float("nan"), float("nan")

    amostras = rng.multinomial(n, probs, size=replicas)
    duplo = 0
    pontual = 0
    for n11, n12, n21, n22 in amostras:
        k_obs, se = kappa_e_se(int(n11), int(n12), int(n21), int(n22))
        if not np.isfinite(k_obs) or not np.isfinite(se):
            continue
        if k_obs >= limiar:
            pontual += 1
            if k_obs - 1.96 * se >= limiar:
                duplo += 1
    return duplo / replicas, pontual / replicas


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--replicas", type=int, default=3000)
    ap.add_argument("--limiar", type=float, default=0.61)
    ap.add_argument("--seed", type=int, default=20261103)
    a = ap.parse_args()

    # Simulacao declarada, com semente registrada em --seed e impressa no cabecalho. Mede a
    # potencia do portao duplo de kappa sob valores verdadeiros hipoteticos: nao ha ponto
    # amostral, nao ha matriz e nao ha rotulo, de modo que a Regra 5 nao tem objeto aqui.
    rng = np.random.default_rng(a.seed)

    print("=" * 86)
    print("SIMULACAO — PORTAO DUPLO DE KAPPA (material de decisao do gate G-08)")
    print("NAO E RESULTADO CIENTIFICO. Nao decide a regra: G-08 e do pesquisador.")
    print("=" * 86)
    print(f"Limiar: kappa >= {a.limiar} E limite inferior do IC de 95% >= {a.limiar}")
    print(f"Replicas por celula: {a.replicas} | semente: {a.seed}")
    print("SE assintotico de Fleiss, Cohen & Everitt (1969), que supoe itens independentes.")
    print()

    for p in PREVALENCIAS:
        print("-" * 86)
        print(f"PREVALENCIA MARGINAL = {p*100:.0f}%")
        print("-" * 86)
        print(f"{'n':>7}", end="")
        for k in KAPPAS_VERDADEIROS:
            print(f"{('k=' + format(k, '.2f')):>14}", end="")
        print()
        print("-" * (7 + 14 * len(KAPPAS_VERDADEIROS)))
        for n in N_CANDIDATOS:
            print(f"{n:>7}", end="")
            for k in KAPPAS_VERDADEIROS:
                duplo, pontual = poder_portao(rng, k, p, n, a.limiar, a.replicas)
                print(f"{duplo*100:>8.1f}%/{pontual*100:>4.0f}%", end="")
            print()
        print()
        print("  (poder do portao DUPLO / poder do portao PONTUAL)")
        print()
        print("  n minimo para poder >= 80% no portao duplo:")
        for k in KAPPAS_VERDADEIROS:
            achado = None
            for n in N_CANDIDATOS:
                duplo, _ = poder_portao(rng, k, p, n, a.limiar, a.replicas)
                if duplo >= PODER_ALVO:
                    achado = n
                    break
            if achado is None:
                print(f"    kappa verdadeiro {k:.2f}: NAO alcancado ate n = {max(N_CANDIDATOS)}")
            else:
                print(f"    kappa verdadeiro {k:.2f}: n >= {achado}")
        print()

    print("-" * 86)
    print("LEITURA")
    print("-" * 86)
    print("O portao duplo exige que a estimativa supere o limiar com margem de quase dois erros-")
    print("padrao. Com kappa verdadeiro proximo do limiar, nenhum n razoavel o satisfaz: a regra")
    print("reprova concordancias que, no ponto, seriam substanciais por Landis & Koch.")
    print()
    print("Isto NAO e argumento para afrouxar o criterio. E a informacao que faltava ao gate:")
    print("se o portao duplo ficar, o n necessario precisa estar declarado, e a cifra de 78% de")
    print("acerto de atribuicao ja esta EM VERIFICACAO por decisao propria do projeto (P03).")
    print()
    print("Limitacao: o SE assintotico supoe itens independentes. Em celulas vizinhas de")
    print("fotointerpretacao isso e otimista, e o n real necessario e MAIOR que o simulado.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
