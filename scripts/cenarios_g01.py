#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Material de decisao do gate G-01 — cenarios do fatorial inviavel.

NAO DECIDE NADA. Produz a aritmetica para que o pesquisador escolha com o custo de cada
opcao a vista: numero de estratos, poligonos, held-out, hectares de voo, min(N_h),
estratos sem reserva, e a probabilidade de preencher os titulares sob recusa.

FONTE UNICA: a tabela de ocupacao e LIDA de
docs/verificacoes/2026-10-31_ocupacao_estratos_d16.md, nao transcrita. Se a tabela mudar,
este script acompanha; e ninguem precisa confiar na minha transcricao.

CONFERENCIA OBRIGATORIA: o total antes do thinning tem de fechar em 677 candidatos e o
pos-thinning em 453. Divergencia e erro de leitura da tabela, nao numero a acomodar.

Cobre os itens 1, 2 e 3 do prompt de material de decisao:
  1. aritmetica dos cenarios
  2. decomposicao da inviabilidade entre deficit estrutural e efeito do thinning (N-14)
  3. fragilidade a recusa por cenario

Uso:
    python3 scripts/cenarios_g01.py
    python3 scripts/cenarios_g01.py --markdown > docs/verificacoes/<data>_cenarios_g01.md
"""

from __future__ import annotations

import argparse
import math
import re
import sys
from dataclasses import dataclass
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
TABELA = RAIZ / "docs/verificacoes/2026-10-31_ocupacao_estratos_d16.md"

# D16 emendada: 4 poligonos por estrato (2 treino + 2 held-out), 5,02 ha cada.
POLIGONOS_POR_ESTRATO = 4
HELDOUT_POR_ESTRATO = 2
AREA_POLIGONO_HA = 5.02

# Conferencia da leitura da tabela. Nao sao parametros: sao checagens.
TOTAL_ANTES_ESPERADO = 677
TOTAL_POS_ESPERADO = 453


class ErroLeituraTabela(RuntimeError):
    pass


def conferir_probabilidades_da_tabela() -> list[tuple[str, int, float, float, float, float]]:
    """Confronta as colunas P(suc >= 4) da tabela com o modelo binomial que ela declara.

    A tabela de 31/10 publica, por estrato, a probabilidade de preencher os 4 titulares sob
    recusa de 10% e de 25%, declarando "modelo binomial puro". Esta funcao recalcula e devolve
    as divergencias. Nao corrige a tabela: aponta.
    """
    texto = TABELA.read_text(encoding="utf-8")
    divergencias = []

    def numero(celula: str) -> float | None:
        bruto = celula.replace("%", "").replace(",", ".").strip()
        try:
            return float(bruto)
        except ValueError:
            return None

    for linha in texto.splitlines():
        if not linha.lstrip().startswith("|"):
            continue
        celulas = [c.strip() for c in linha.replace("**", "").replace("`", "").strip().strip("|").split("|")]
        if len(celulas) < 11 or not re.fullmatch(r"E_\d_\d_\d", celulas[0]):
            continue
        try:
            n_h = int(celulas[5])
        except ValueError:
            continue
        tab10, tab25 = numero(celulas[9]), numero(celulas[10])
        if tab10 is None or tab25 is None:
            continue
        mod10 = p_preenche_titulares(n_h, 0.10) * 100
        mod25 = p_preenche_titulares(n_h, 0.25) * 100
        if abs(tab10 - mod10) > 0.15 or abs(tab25 - mod25) > 0.15:
            divergencias.append((celulas[0], n_h, tab10, mod10, tab25, mod25))

    return divergencias


def ler_ocupacao() -> dict[str, tuple[int, int]]:
    """Devolve {estrato: (N_h antes do thinning, N_h pos-thinning)} lido da tabela."""
    if not TABELA.exists():
        raise ErroLeituraTabela(f"tabela de ocupacao nao encontrada: {TABELA}")

    texto = TABELA.read_text(encoding="utf-8")
    ocupacao: dict[str, tuple[int, int]] = {}

    for linha in texto.splitlines():
        if not linha.lstrip().startswith("|"):
            continue
        # Limpa negrito e backticks, que a tabela usa para destacar os estratos deficientes.
        limpa = linha.replace("**", "").replace("`", "")
        celulas = [c.strip() for c in limpa.strip().strip("|").split("|")]
        if len(celulas) < 6:
            continue
        if not re.fullmatch(r"E_\d_\d_\d", celulas[0]):
            continue
        try:
            antes = int(celulas[4])
            pos = int(celulas[5])
        except ValueError:
            continue
        ocupacao[celulas[0]] = (antes, pos)

    if not ocupacao:
        raise ErroLeituraTabela("nenhuma linha de estrato reconhecida na tabela")

    soma_antes = sum(a for a, _ in ocupacao.values())
    soma_pos = sum(p for _, p in ocupacao.values())
    if soma_antes != TOTAL_ANTES_ESPERADO or soma_pos != TOTAL_POS_ESPERADO:
        raise ErroLeituraTabela(
            f"conferencia falhou: antes={soma_antes} (esperado {TOTAL_ANTES_ESPERADO}), "
            f"pos={soma_pos} (esperado {TOTAL_POS_ESPERADO}). A leitura da tabela esta errada."
        )
    return ocupacao


def p_preenche_titulares(n_h: int, p_recusa: float, titulares: int = POLIGONOS_POR_ESTRATO) -> float:
    """P(X >= titulares), X ~ Binomial(n_h, 1 - p_recusa). Binomial exata, sem aproximacao.

    LIMITACAO DECLARADA, a mesma que o modulo de pool do app declara: supoe recusas
    INDEPENDENTES. Recusas podem correlacionar por vizinhanca, cooperativa ou perfil
    fundiario, e nesse caso estas probabilidades sao OTIMISTAS.
    """
    if n_h < titulares:
        return 0.0
    p_aceita = 1.0 - p_recusa
    return sum(
        math.comb(n_h, k) * (p_aceita ** k) * (p_recusa ** (n_h - k))
        for k in range(titulares, n_h + 1)
    )


@dataclass
class Cenario:
    nome: str
    # grupos de estratos a colapsar (cada grupo vira um macro-estrato)
    colapsos: tuple[tuple[str, ...], ...] = ()
    # estratos removidos do dominio
    exclusoes: tuple[str, ...] = ()
    observacao: str = ""

    def avaliar(self, ocupacao: dict[str, tuple[int, int]]) -> dict:
        colapsados = {e for g in self.colapsos for e in g}
        restantes = [
            k for k in ocupacao
            if k not in self.exclusoes and k not in colapsados
        ]
        n_h = [ocupacao[k][1] for k in restantes]
        n_h += [sum(ocupacao[e][1] for e in g) for g in self.colapsos]

        n_estratos = len(n_h)
        return {
            "nome": self.nome,
            "estratos": n_estratos,
            "poligonos": POLIGONOS_POR_ESTRATO * n_estratos,
            "heldout": HELDOUT_POR_ESTRATO * n_estratos,
            "area_ha": POLIGONOS_POR_ESTRATO * n_estratos * AREA_POLIGONO_HA,
            "min_nh": min(n_h) if n_h else 0,
            "em_exatamente_4": sum(1 for x in n_h if x == POLIGONOS_POR_ESTRATO),
            "satisfaz_guarda": all(x >= POLIGONOS_POR_ESTRATO for x in n_h),
            "n_h": sorted(n_h),
            "p_mais_fragil_10": min(p_preenche_titulares(x, 0.10) for x in n_h) if n_h else 0.0,
            "p_mais_fragil_25": min(p_preenche_titulares(x, 0.25) for x in n_h) if n_h else 0.0,
            "observacao": self.observacao,
        }


S1_K2 = ("E_1_1_2", "E_1_2_2", "E_1_3_2")
S2_K2 = ("E_2_1_2", "E_2_2_2", "E_2_3_2")
S2_K2_DEFICIENTE = ("E_2_2_2", "E_2_3_2")

CENARIOS = [
    Cenario(
        "Pre-registrado (18 estratos, D16 emendada)",
        observacao="estado atual: a guarda do sorteio recusa",
    ),
    Cenario(
        "Op.1 — colapsar E em S1xK2 e no S2xK2 deficiente",
        colapsos=(S1_K2, S2_K2_DEFICIENTE),
        observacao="recomendada pelos documentos de 01/11; depende de Cochran 5A.12",
    ),
    Cenario(
        "Op.1-v — colapsar E em TODO S1xK2 e TODO S2xK2",
        colapsos=(S1_K2, S2_K2),
        observacao="ausente dos documentos de 01/11; domina a Op.1 em todos os eixos",
    ),
    Cenario(
        "Op.2 pura — excluir S1xK2 do dominio de D07",
        exclusoes=S1_K2,
        observacao="NAO RESOLVE: E_2_2_2 e E_2_3_2 sao S2xK2 e permanecem abaixo de 4",
    ),
    Cenario(
        "Op.2 + colapso do S2xK2 deficiente",
        colapsos=(S2_K2_DEFICIENTE,),
        exclusoes=S1_K2,
        observacao="combinacao; tambem usa colapso, logo tambem depende de Cochran",
    ),
    Cenario(
        "Op.3 — K agregado somente em S1",
        colapsos=(("E_1_1_1", "E_1_1_2"), ("E_1_2_1", "E_1_2_2"), ("E_1_3_1", "E_1_3_2")),
        observacao="NAO RESOLVE: mesmo motivo da Op.2 pura",
    ),
    Cenario(
        "Op.3 — K agregado em S1 e S2",
        colapsos=(
            ("E_1_1_1", "E_1_1_2"), ("E_1_2_1", "E_1_2_2"), ("E_1_3_1", "E_1_3_2"),
            ("E_2_1_1", "E_2_1_2"), ("E_2_2_1", "E_2_2_2"), ("E_2_3_1", "E_2_3_2"),
        ),
        observacao="o mais robusto e o mais barato; perde o contraste de K em S1 e S2",
    ),
]


def decompor_inviabilidade(ocupacao: dict[str, tuple[int, int]]) -> dict:
    """Item 2 / N-14: separa deficit estrutural do efeito do thinning de 1 km (P02)."""
    inviaveis_pos = sorted(k for k, (_, p) in ocupacao.items() if p < POLIGONOS_POR_ESTRATO)
    inviaveis_antes = sorted(k for k, (a, _) in ocupacao.items() if a < POLIGONOS_POR_ESTRATO)
    return {
        "inviaveis_pos": inviaveis_pos,
        "inviaveis_antes": inviaveis_antes,
        "so_por_thinning": sorted(set(inviaveis_pos) - set(inviaveis_antes)),
        "deficit_estrutural": inviaveis_antes,
        "perderam_reserva": sorted(
            k for k, (a, p) in ocupacao.items()
            if p == POLIGONOS_POR_ESTRATO and a > POLIGONOS_POR_ESTRATO
        ),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--markdown", action="store_true", help="saida em markdown")
    a = ap.parse_args()

    try:
        ocupacao = ler_ocupacao()
    except ErroLeituraTabela as e:
        print(f"[ERRO] {e}", file=sys.stderr)
        return 1

    resultados = [c.avaliar(ocupacao) for c in CENARIOS]
    dec = decompor_inviabilidade(ocupacao)

    if a.markdown:
        print("## Cenarios de G-01\n")
        print("| Cenario | Estratos | Poligonos | Held-out | Area (ha) | min(N_h) | Em 4 | Guarda | P(preencher\\|25%) |")
        print("|---|---:|---:|---:|---:|---:|---:|---|---:|")
        for r in resultados:
            print(
                f"| {r['nome']} | {r['estratos']} | {r['poligonos']} | {r['heldout']} | "
                f"{r['area_ha']:.1f} | {r['min_nh']} | {r['em_exatamente_4']} | "
                f"{'sim' if r['satisfaz_guarda'] else '**NAO**'} | {r['p_mais_fragil_25']*100:.1f}% |"
            )
        print("\n### Decomposicao da inviabilidade (N-14)\n")
        print(f"- Inviaveis pos-thinning ({len(dec['inviaveis_pos'])}): {', '.join(dec['inviaveis_pos'])}")
        print(f"- Inviaveis antes do thinning ({len(dec['inviaveis_antes'])}): {', '.join(dec['inviaveis_antes'])}")
        print(f"- Inviaveis SO por efeito do thinning: {', '.join(dec['so_por_thinning']) or 'nenhum'}")
        print(f"- Perderam a unica reserva por thinning: {', '.join(dec['perderam_reserva']) or 'nenhum'}")
        return 0

    print("=" * 78)
    print("MATERIAL DE DECISAO — GATE G-01 (fatorial inviavel)")
    print("=" * 78)
    print(f"Fonte: {TABELA.relative_to(RAIZ)}")
    print(f"Conferencia: total antes={sum(a for a,_ in ocupacao.values())}, "
          f"pos-thinning={sum(p for _,p in ocupacao.values())}  [OK]")
    print(f"Estratos lidos: {len(ocupacao)}")
    print()
    print("-" * 78)
    print("ITEM 2 / N-14 — DECOMPOSICAO DA INVIABILIDADE")
    print("-" * 78)
    print(f"Inviaveis (N_h < 4) POS-thinning  : {len(dec['inviaveis_pos'])}  {dec['inviaveis_pos']}")
    print(f"Inviaveis (N_h < 4) ANTES do thin.: {len(dec['inviaveis_antes'])}  {dec['inviaveis_antes']}")
    print(f"Inviavel SO por efeito de P02     : {dec['so_por_thinning'] or 'nenhum'}")
    print(f"Perdeu a unica reserva por P02    : {dec['perderam_reserva'] or 'nenhum'}")
    print()
    print("Leitura: sem o thinning de 1 km haveria "
          f"{len(dec['inviaveis_antes'])} estratos inviaveis, nao {len(dec['inviaveis_pos'])}.")
    print("Isto NAO recomenda afrouxar P02: o espacamento mitiga pseudorreplicacao e tem custo")
    print("na validacao se reduzido. O lastro de P02 esta sob auditoria (L-10).")
    print()
    print("-" * 78)
    print("ITEM 1 — CENARIOS")
    print("-" * 78)
    cab = f"{'Cenario':<46}{'Estr':>5}{'Pol':>5}{'HOut':>6}{'Area ha':>9}{'minNh':>7}{'em4':>5}{'Guarda':>8}"
    print(cab)
    print("-" * len(cab))
    for r in resultados:
        print(
            f"{r['nome'][:45]:<46}{r['estratos']:>5}{r['poligonos']:>5}{r['heldout']:>6}"
            f"{r['area_ha']:>9.1f}{r['min_nh']:>7}{r['em_exatamente_4']:>5}"
            f"{('sim' if r['satisfaz_guarda'] else 'NAO'):>8}"
        )
    print()
    print("-" * 78)
    print("ITEM 3 — FRAGILIDADE A RECUSA (estrato mais fragil de cada cenario)")
    print("-" * 78)
    print(f"{'Cenario':<46}{'P(>=4|10%)':>12}{'P(>=4|25%)':>12}")
    print("-" * 70)
    for r in resultados:
        print(f"{r['nome'][:45]:<46}{r['p_mais_fragil_10']*100:>11.1f}%{r['p_mais_fragil_25']*100:>11.1f}%")
    print()
    print("Modelo binomial com recusas INDEPENDENTES, a mesma simplificacao que o modulo de")
    print("pool do app declara. Se a recusa correlacionar por vizinhanca, cooperativa ou perfil")
    print("fundiario, estas probabilidades sao OTIMISTAS.")
    print()
    print("-" * 78)
    print("OBSERVACOES POR CENARIO")
    print("-" * 78)
    for r in resultados:
        if r["observacao"]:
            print(f"  {r['nome']}\n      -> {r['observacao']}")
    print()
    print("-" * 78)
    print("CONFERENCIA DAS PROBABILIDADES PUBLICADAS NA TABELA DE 31/10")
    print("-" * 78)
    divs = conferir_probabilidades_da_tabela()
    if not divs:
        print("Todos os valores publicados reproduzem o modelo binomial declarado.")
    else:
        print(f"{len(divs)} divergencia(s) entre a tabela e o modelo binomial que ela declara:")
        for est, n_h, t10, m10, t25, m25 in divs:
            print(f"  {est} (N_h={n_h}):")
            if abs(t10 - m10) > 0.15:
                print(f"      p_rec=0,10 -> tabela {t10:.1f}%, modelo {m10:.4f}%")
            if abs(t25 - m25) > 0.15:
                print(f"      p_rec=0,25 -> tabela {t25:.1f}%, modelo {m25:.4f}%")
        print()
        print("Nao corrigi a tabela: aponto. O impacto sobre as conclusoes de viabilidade e nulo")
        print("onde o estrato e viavel em qualquer cenario, mas o numero esta publicado em uma")
        print("verificacao e a sua origem precisa ser esclarecida pelo pesquisador.")
    print()
    print("Nenhuma opcao e recomendada por este script. A escolha e do pesquisador (G-01).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
