# Medição Empírica W2 sobre o Conjunto de Candidatos da Bacia do Paraná 3 (28/09/2026)

- **Artefato JSON fonte:** `docs/verificacoes/fontes/wfs_erodibilidade/medicao_w2_candidatos_bp3_2026-09-28.json`
- **Script gerador:** `docs/verificacoes/fontes/wfs_erodibilidade/medir_w2_candidatos_bp3_2026-09-28.ts`
- **Pool de candidatos reais (SICAR/SNCR pós-thinning 500 m, semente=42):** `90` candidatos (de `593` imóveis no divisor hidrográfico da BP3 fora de UCs florestais).

## 1. Contagem por Nível de K̂ (`1` vs `2`) e Retirados por Categoria Não-Pedológica

| Universo Analisado | Total | Nível K̂ = 1 (`Baixa`/`Muito baixa`/`Média`) | Nível K̂ = 2 (`Alta`/`Muito alta`/`Extremamente alta`) | Retirados por Categoria Não-Pedológica (`fora-do-dominio`) |
|---|---:|---:|---:|---:|
| Pool pós-thinning completo (BP3) | 90 | 75 | 15 | 0 |
| Candidatos com declividade D07 elegível ($S \in [3\%, 45\%]$) | 38 | 29 | 9 | 0 |

## 2. Contagem dos 3 Estados de `kAmbiguoAssociacao` (`W1` / `W3`) sobre o Pool de 90 Candidatos

| Estado de `kAmbiguoAssociacao` | Contagem | Detalhamento por Ramo de `D08` |
|---|---:|---|
| `true` | 30 | Ramo (a) (`>= 2` componentes em `erod_c1..erod_c4` cruzando a fronteira de D09: 30) |
| `false` | 58 | Ramo (a) do mesmo lado (13) + Unidade simples estadual (45) |
| `"indisponivel"` | 2 | Ramo (b): 1 componente em 2024 sobre `associacao` estadual (2) + Fora do domínio/fronteira exata (0) |

## 3. Dispersão Intra-Unidade Estadual (`sbcs` em `parana_solos_20201105`)

- **Unidades estaduais distintas (`sbcs`) no pool de 90 candidatos:** `10`
- **Unidades `sbcs` que aparecem com mais de um nível de K̂ (`[1, 2]`) no pool de 90 candidatos:** `3` (`NVef2`, `LVef1`, `RRe12`)
- **Unidades `sbcs` que aparecem com mais de um nível de K̂ (`[1, 2]`) nos candidatos elegíveis ($S \in [3\%, 45\%]$):** `3` (`NVef2`, `LVef1`, `RRe12`)

| `sbcs` (`parana_solos_20201105`) | `tipo_unida` | Candidatos (Pool 90) | Nível K̂ = 1 | Nível K̂ = 2 | Retirados Não-Solo | Níveis K̂ Observados | `cod_um2` (2024) Observados | `erod_um` (2024) Observados | `kAmbiguo` (`true`/`false`/`indisp`) |
|---|---|---:|---:|---:|---:|---|---|---|---|
| `NVef2` | `simples` | 31 | 27 | 4 | 0 | `[1, 2]` | `SG21NVef1`, `SG21LVef3`, `SG21NVef5`, `SG22NVef2`, `SG21RLm4`, `SG22NVef7`, `SG22LVef1`, `SG22RLm2`, `SG22LVdf5`, `SG21LVef1` | `Baixa`, `Muito baixa`, `Média`, `Alta` | 14 / 17 / 0 |
| `LVef1` | `simples` | 25 | 24 | 1 | 0 | `[1, 2]` | `SG21LVef3`, `SG22LVef1`, `SG21LVef1`, `SG21NVef1`, `SG22NVef2`, `SG22NVef7`, `SG21RLm4`, `SG22LVdf5` | `Muito baixa`, `Baixa`, `Média`, `Alta` | 2 / 23 / 0 |
| `RRe12` | `associacao` | 12 | 2 | 10 | 0 | `[1, 2]` | `SG21RLm4`, `SG21LVef3`, `SG22RLm2`, `SG21NVef5` | `Alta`, `Muito baixa`, `Média` | 11 / 1 / 0 |
| `LVdf13` | `simples` | 9 | 9 | 0 | 0 | `[1]` | `SG21LVdf1`, `SG22LVef1`, `SG22NVef7`, `SG22LVdf5`, `SG22LVef5` | `Muito baixa`, `Média` | 1 / 8 / 0 |
| `LVef2` | `associacao` | 4 | 4 | 0 | 0 | `[1]` | `SG21NVef2`, `SG21LVef1`, `SG21NVef3`, `SG21LVdf1` | `Baixa`, `Muito baixa` | 0 / 2 / 2 |
| `LVdf1` | `simples` | 3 | 3 | 0 | 0 | `[1]` | `SG21LVef1` | `Muito baixa` | 0 / 3 / 0 |
| `LVdf10` | `simples` | 2 | 2 | 0 | 0 | `[1]` | `SG22LVdf5` | `Muito baixa` | 0 / 2 / 0 |
| `LVdf12` | `simples` | 2 | 2 | 0 | 0 | `[1]` | `SG22NVef7` | `Média` | 2 / 0 / 0 |
| `NVef8` | `simples` | 1 | 1 | 0 | 0 | `[1]` | `SG22NVef2` | `Baixa` | 0 / 1 / 0 |
| `PVe1` | `simples` | 1 | 1 | 0 | 0 | `[1]` | `SG21LVe2` | `Baixa` | 0 / 1 / 0 |

## 4. Distribuição dos 18 Estratos (`E_1_1_1` .. `E_3_3_2`) e Marginais Medidas $(\hat{S} \times \hat{K})$

| Estrato (`D12`) | Tercil $\hat{S}$ | Tercil $\hat{E}$ | Nível $\hat{K}$ | Contagem Local (sem GEE: $\hat{E}$ `indisponivel`) | Capacidade Marginal Medida $N(\text{Tercil }\hat{S}, \text{Nível }\hat{K}) = \sum_{e=1}^{3} N(E_{s,e,k})$ | Média Esperada por Estrato ($N_{s,k}/3$) | Viabilidade Marginal ($N_{s,k} \ge 6$ para $\ge 2$/estrato) |
|---|---:|---:|---:|---:|---:|---:|---|
| `E_1_1_1` | 1 | 1 | 1 | 0 | 13 | 4.33 | SIM (>= 6) |
| `E_1_1_2` | 1 | 1 | 2 | 0 | 3 | 1.00 | NÃO (< 6 — estrato K=2 insuficiente) |
| `E_1_2_1` | 1 | 2 | 1 | 0 | 13 | 4.33 | SIM (>= 6) |
| `E_1_2_2` | 1 | 2 | 2 | 0 | 3 | 1.00 | NÃO (< 6 — estrato K=2 insuficiente) |
| `E_1_3_1` | 1 | 3 | 1 | 0 | 13 | 4.33 | SIM (>= 6) |
| `E_1_3_2` | 1 | 3 | 2 | 0 | 3 | 1.00 | NÃO (< 6 — estrato K=2 insuficiente) |
| `E_2_1_1` | 2 | 1 | 1 | 0 | 11 | 3.67 | SIM (>= 6) |
| `E_2_1_2` | 2 | 1 | 2 | 0 | 2 | 0.67 | NÃO (< 6 — estrato K=2 insuficiente) |
| `E_2_2_1` | 2 | 2 | 1 | 0 | 11 | 3.67 | SIM (>= 6) |
| `E_2_2_2` | 2 | 2 | 2 | 0 | 2 | 0.67 | NÃO (< 6 — estrato K=2 insuficiente) |
| `E_2_3_1` | 2 | 3 | 1 | 0 | 11 | 3.67 | SIM (>= 6) |
| `E_2_3_2` | 2 | 3 | 2 | 0 | 2 | 0.67 | NÃO (< 6 — estrato K=2 insuficiente) |
| `E_3_1_1` | 3 | 1 | 1 | 0 | 5 | 1.67 | NÃO (< 6 — estrato K=1 insuficiente) |
| `E_3_1_2` | 3 | 1 | 2 | 0 | 4 | 1.33 | NÃO (< 6 — estrato K=2 insuficiente) |
| `E_3_2_1` | 3 | 2 | 1 | 0 | 5 | 1.67 | NÃO (< 6 — estrato K=1 insuficiente) |
| `E_3_2_2` | 3 | 2 | 2 | 0 | 4 | 1.33 | NÃO (< 6 — estrato K=2 insuficiente) |
| `E_3_3_1` | 3 | 3 | 1 | 0 | 5 | 1.67 | NÃO (< 6 — estrato K=1 insuficiente) |
| `E_3_3_2` | 3 | 3 | 2 | 0 | 4 | 1.33 | NÃO (< 6 — estrato K=2 insuficiente) |
