# Amostra dirigida às associações — Bacia do Paraná 3, 28/09/2026

**Motivo.** As duas medições anteriores caracterizavam a discordância entre cartas em unidades
compostas com `0 de 3` e depois `0 de 2` pontos **incidentais** — base probatória insuficiente para
uma questão que governa a dimensão K̂ da estratificação de D12 e a marcação de D08.

**Desenho.** Amostra **dirigida e estratificada**. A bacia contém **193 polígonos de associação**
em **8 unidades de mapeamento** distintas (`RRe12` 90, `LVef2` 37, `NVef4` 34, `PVe3` 16, `RRe9` 9,
`NVdf4` 4, `LVdf11` 2, `RRd7` 1). Amostrados até 5 polígonos por unidade, **32 pontos**, com ponto
interior garantido por `shapely.representative_point()` e atribuição por ponto-em-polígono
(WFS 1.1.0, `POINT(lat lon)`, conforme F9). Os 32 foram confirmados como `tipo_unida='associacao'`
pela própria consulta.

Script: `amostra_dirigida_associacoes.py` · dados: `amostra_dirigida_associacoes_2026-09-28.json`

---

## 1. Correspondência: 2 de 32 (6,2%)

| Métrica | Resultado |
|---|---|
| Pontos utilizáveis (associação confirmada) | 32 / 32 |
| Correspondência **estrita** da sequência de ordens | **2 / 32 (6,2%)** |
| Correspondência apenas do componente **dominante** | 10 / 32 (31,2%) |

Muito abaixo do que os dois pontos incidentais sugeriam, e agora com base suficiente.

## 2. A razão: a carta de 2024 GENERALIZA

| Componentes na carta de 2024 | Pontos |
|---|---|
| **1** (unidade simples) | **16** |
| 2 | 13 |
| 3 | 2 |
| 4 | 1 |

**Em metade dos pontos a carta nacional mapeia unidade SIMPLES onde a carta estadual mapeia
associação.** A correspondência de 6% não é problema de ordenação dos componentes: é diferença de
granularidade entre um levantamento estadual e um nacional a 1:250.000.

## 3. Reenquadramento: correspondência de sequência é o teste ERRADO para D08

D08 pergunta se os níveis de erodibilidade **dentro da unidade** atravessam a fronteira de D09.
Essa pergunta é respondida pelos próprios `erod_c1..erod_c4` da carta de 2024, **sem precisar
casar a ordem dos componentes com a carta estadual**. O casamento de sequência só era necessário
para atribuir a classe de um componente específico a um componente específico da outra carta.

Reenquadrada assim:

- **16 de 32 (50%)** — a carta de 2024 traz ≥ 2 componentes: a ambiguidade é **determinável na
  fonte oficial**, `tabelado`, sem heurística. Destes, **4 (25%) são oficialmente K-ambíguos.**
- **16 de 32 (50%)** — a carta de 2024 traz 1 componente: ela não tem o que responder, e a carta
  estadual diz associação. A ambiguidade fica **não resolvida**, o que deve ser `indisponivel` —
  **nunca `false`, e nunca resolvida por heurística.**

Isto fecha metade da dívida de D08 com proveniência tabelada e torna a outra metade honestamente
indeterminável, em lugar de adivinhada.

## 4. ACHADO GRAVE: 2 das 8 unidades recebem NÍVEIS DE K DIFERENTES em pontos distintos

| Unidade do PR | n | Unidades de 2024 encontradas (→ nível de K de `erod_um`) | Níveis |
|---|---|---|---|
| LVdf11 | 2 | SG22NVef2→1 | [1] |
| LVef2 | 5 | SG21NVef1→1, SG22LVef4→1 | [1] |
| NVdf4 | 4 | SG22LVdf5→1, SG22NVef3→1 | [1] |
| NVef4 | 5 | SG21LVdf1→1, SG21NVef1→1 | [1] |
| PVe3 | 5 | SG21LVef1→1, SG21NVef1→1, SG21PVe3→1, SG21Co→(água) | [1] |
| RRd7 | 1 | SG22NVef3→1 | [1] |
| **RRe12** | 5 | **SG21RLm4→2**, **SG22NVef3→1**, SG21Ár/SG22Ár→(urbano) | **[1, 2]** |
| **RRe9** | 5 | **SG22CXvef→2**, **SG22RLm2→2**, **SG22NVef3→1** | **[1, 2]** |

Dispersão do `k_solos` dentro da **mesma** unidade estadual:

    RRe9    0,012  0,0315  0,033     (fator 2,8)
    RRe12   0      0,012   0,0315
    PVe3    0      0,002   0,012   0,0165
    NVef4   0,002  0,012

**Por que isto é o achado mais importante.** As duas unidades que discordam são as associações de
**Neossolo Regolítico**, e a `RRe12` sozinha é **90 dos 193** polígonos de associação da bacia —
47%. A discordância recai sobre a associação mais comum da área de estudo.

Em alguns pontos a carta de 2024 atribui `SG22NVef3` (Nitossolo, Baixa, nível 1) dentro de
associações `RRe9` e `RRe12`, cujo componente dominante na carta estadual é **NEOSSOLO**. A prosa
do próprio Documentos 246 põe Neossolo Regolítico entre as classes **alta e muito alta**. Nesses
pontos a carta de 2024 contraria a carta estadual e a prosa do documento que a origina —
**observação de leitura taxonômica, não medição**, registrada como tal.

## 5. Consequência para a estratificação

D14, emendada, faz K vir de `k_solos` da carta de 2024 no ponto. D12 usa K̂ como uma das três
dimensões. Logo células dentro da **mesma** unidade de mapeamento estadual podem cair em
**estratos diferentes**.

Isso não é necessariamente errado — a erodibilidade varia no espaço — mas é mudança substantiva
no significado da estratificação, e precisa ser **decisão declarada**, não efeito colateral da
implementação. É o que falta decidir antes do sorteio.

## 6. Nota lateral

Alguns pontos interiores de polígonos de associação caem em **água ou área urbana** na carta de
2024 (`SG21Co`, `SG21Ár`, `SG22Ár`), com `k_solos = 0`. A exclusão por não-solo funciona, e o
fato registra que as duas cartas também discordam sobre a extensão de água e de área urbana.
