# Relatório de Execução do Sorteio D16/D23 (Prompt J)

**Data de Execução:** 2026-11-10  
**Branch:** `correcoes/contencao-2026-11-02`  
**Selo Gerado:** `docs/verificacoes/sorteio/sorteio_d16_2026-11-10.json`  
**Decisões e Parâmetros Aplicados:** D07, D08, D10, D11, D12, D16, D23 e P07.

---

## 1. Fixação Prévia da Semente (Parâmetro P07)

Em conformidade estrita com o Parâmetro P07 (`dinamica-registrada`), que veda expressamente qualquer semente padrão oculta ou embutida no código, a semente de amostragem foi fixada pelo pesquisador **antes** da realização do sorteio:

- **Semente Selecionada:** `20261110`
- **Registro Pré-Execução:** Entrada 14 de `docs/planejamento/DECISOES_DE_CONVERSA.md`, devidamente registrada e commitada no histórico Git (`e67fc90` e `f475eed`) previamente a qualquer execução confirmada.
- **Garantia de Não-Condicionalidade:** O dry-run de teste da infraestrutura foi executado compulsoriamente **sem** a flag `--semente`, gerando semente volátil de verificação (`2021750194`), o que garantiu a impossibilidade de inspeção prévia dos resultados reais ou escolha de semente orientada pelo desfecho amostral.

---

## 2. Validação Prévia via Dry-Run

O comando de simulação foi executado:
```bash
node --import ./scripts/ts-loader.mjs scripts/sortear_poligonos_d16.ts --dry-run --candidatos docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json --cache docs/verificacoes/cache_frequencia_solo_nu_bp3.json
```
(Saída integral registrada em `docs/verificacoes/execucao/2026-11-10j/dry_run.txt`).

Resultados da validação:
- Modo: `DRY-RUN (SIMULAÇÃO SEGURA — NENHUM SORTEIO EXECUTADO)`
- Hash da definição de Ê: `6a63a17cb9760d507648b903beec99cfcce6479940e9041b90f23dc59daa7a21` (conforme GEOS3/D10)
- Total de candidatos avaliados: 677
- Pré-condições aprovadas: 7 de 7
- Nenhum selo gravado em disco durante a simulação.

---

## 3. Execução Real e Irreversível (Tarefa 3)

Com a semente `20261110` e a confirmação explícita de execução:
```bash
node --import ./scripts/ts-loader.mjs scripts/sortear_poligonos_d16.ts --confirmar --semente 20261110 --candidatos docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json --cache docs/verificacoes/cache_frequencia_solo_nu_bp3.json
```
(Saída integral gravada em `docs/verificacoes/execucao/2026-11-10j/sorteio_execucao.txt`).

O selo oficial foi gerado e persistido em:
`docs/verificacoes/sorteio/sorteio_d16_2026-11-10.json`.

Conforme determina a Decisão D23, esta execução é única e definitiva. Qualquer tentativa subsequente de execução com `--confirmar` é bloqueada imediatamente por recusa idempotente (`[RECUSA IDEMPOTENTE — D23]`).

---

## 4. Totais e Metadados do Selo Lidos do Disco (Tarefa 4)

A verificação foi executada diretamente contra o arquivo JSON persistido em disco (registro em `docs/verificacoes/execucao/2026-11-10j/verificacao_selo.txt`):

- **Versão do Esquema:** `1.4.0`
- **Semente:** `20261110` (política `dinamica-registrada`)
- **Git Commit de Referência:** `3b54177e3a716590c76443da784535be2eff55ba`
- **SHA-256 do Universo de Candidatos:** `0de2e0e3b313091a98cade8c507a6a88fb21b47399e486d70cf88eab74e5a65c`
- **Hash de Integridade (MurmurHash64):** `15a5f1f38a3cf512`
- **Total de Candidatos de Entrada:** `677`
- **Total de Polígonos Sorteados:** `67`
- **Total de Polígonos de Treino:** `34`
- **Total de Polígonos Held-Out:** `33`
- **Área Total Amostrada:** `336.34 ha`
- **Notação Compacta:** `totais 67 / 34 / 33 / 336,34`
- **Limiares S (declividade %):** $t_1 = 5,1200\%$, $t_2 = 8,4600\%$
- **Limiares E (freq. solo nu):** $t_1 = 0,0116$, $t_2 = 0,0490$

---

## 5. Tabela Completa dos 18 Estratos (D12 / D16)

| Estrato | $N_h$ | Polígonos Sorteados | $\pi_i$ | $w_i$ | $\pi_i \times w_i$ | Regime Amostral |
|---|:---:|:---:|:---:|:---:|:---:|---|
| `E_1_1_1` | 41 | 4 | 0,0976 | 10,2500 | 1,0000 | Amostra ($N_h > 4$) |
| `E_1_1_2` | 6 | 4 | 0,6667 | 1,5000 | 1,0000 | Amostra ($N_h > 4$) |
| `E_1_2_1` | 86 | 4 | 0,0465 | 21,5000 | 1,0000 | Amostra ($N_h > 4$) |
| `E_1_2_2` | 3 | 3 | 1,0000 | 1,0000 | 1,0000 | **Censo Integral** ($N_h = 3 < 4$, sem suplente) |
| `E_1_3_1` | 91 | 4 | 0,0440 | 22,7500 | 1,0000 | Amostra ($N_h > 4$) |
| `E_1_3_2` | 0 | 0 | - | - | - | **Estrato Vazio Declarado** ($N_h = 0$) |
| `E_2_1_1` | 43 | 4 | 0,0930 | 10,7500 | 1,0000 | Amostra ($N_h > 4$) |
| `E_2_1_2` | 6 | 4 | 0,6667 | 1,5000 | 1,0000 | Amostra ($N_h > 4$) |
| `E_2_2_1` | 80 | 4 | 0,0500 | 20,0000 | 1,0000 | Amostra ($N_h > 4$) |
| `E_2_2_2` | 4 | 4 | 1,0000 | 1,0000 | 1,0000 | **Censo Limite** ($N_h = 4$, sem suplente) |
| `E_2_3_1` | 88 | 4 | 0,0455 | 22,0000 | 1,0000 | Amostra ($N_h > 4$) |
| `E_2_3_2` | 4 | 4 | 1,0000 | 1,0000 | 1,0000 | **Censo Limite** ($N_h = 4$, sem suplente) |
| `E_3_1_1` | 79 | 4 | 0,0506 | 19,7500 | 1,0000 | Amostra ($N_h > 4$) |
| `E_3_1_2` | 51 | 4 | 0,0784 | 12,7500 | 1,0000 | Amostra ($N_h > 4$) |
| `E_3_2_1` | 50 | 4 | 0,0800 | 12,5000 | 1,0000 | Amostra ($N_h > 4$) |
| `E_3_2_2` | 4 | 4 | 1,0000 | 1,0000 | 1,0000 | **Censo Limite** ($N_h = 4$, sem suplente) |
| `E_3_3_1` | 35 | 4 | 0,1143 | 8,7500 | 1,0000 | Amostra ($N_h > 4$) |
| `E_3_3_2` | 6 | 4 | 0,6667 | 1,5000 | 1,0000 | Amostra ($N_h > 4$) |
| **Total** | **677** | **67** | - | - | - | **34 Treino / 33 Held-Out / 336,34 ha** |

---

## 6. Revalidação dos 8 Invariantes sobre o Artefato Persistido

O teste automatizado leu o arquivo `docs/verificacoes/sorteio/sorteio_d16_2026-11-10.json` e invocou `validarInvariantesSeloD16(selo)`:

1. `INV_1_TOTAL_TREINO_HELDOUT`: $34 + 33 = 67$ polígonos sorteados. Aprovado.
2. `INV_2_AREA_TOTAL`: $67 \times 5,02 = 336,34\text{ ha}$. Aprovado.
3. `INV_3_SOMA_POLIGONOS_POR_ESTRATO`: Soma dos 18 estratos confere exatamente com 67. Aprovado.
4. `INV_4_PARTICAO_CANDIDATOS`: Soma dos $N_h$ por estrato confere exatamente com 677. Aprovado.
5. `INV_5_POLIGONOS_UNICOS`: Todos os 67 identificadores de polígonos e de candidatos são estritamente únicos. Aprovado.
6. `INV_6_CENSO_PI_1`: Todos os polígonos nos 4 estratos de censo (`E_1_2_2`, `E_2_2_2`, `E_2_3_2`, `E_3_2_2`) possuem $\pi_i = 1,0000$ e $w_i = 1,0000$. Aprovado.
7. `INV_7_ESTRATO_VAZIO`: Estrato `E_1_3_2` possui $N_h = 0$ e zero polígonos alocados. Aprovado.
8. `INV_8_HORVITZ_THOMPSON`: Todos os 67 polígonos satisfazem $\pi_i \in (0, 1]$ e $\pi_i \times w_i = 1,0000$. Aprovado.

---

## 7. Declaração Formal de Ausência de Suplentes em K̂=2

Conforme já documentado no Prompt H (`docs/verificacoes/2026-11-10h_guarda_d11_e_desenho_18x4.md`):

> **IMPORTANTE — RESTRIÇÃO OPERACIONAL DE CAMPO:**
> Cinco dos nove estratos sob a classe de solo mais frágil ($\hat{K}=2$) encontram-se em regime de censo ou vazio:
> - `E_1_3_2`: $N_h = 0$ (vazio estrutural; não há candidatos);
> - `E_1_2_2`: $N_h = 3$ (censo total; alocados 3 de 3; **zero suplentes**);
> - `E_2_2_2`: $N_h = 4$ (censo limite; alocados 4 de 4; **zero suplentes**);
> - `E_2_3_2`: $N_h = 4$ (censo limite; alocados 4 de 4; **zero suplentes**);
> - `E_3_2_2`: $N_h = 4$ (censo limite; alocados 4 de 4; **zero suplentes**).
>
> Caso qualquer um dos polígonos sorteados nesses estratos sofra recusa de acesso fundiário ou impedimento em campo, **não existe suplente disponível** no universo amostral da BP3. A perda de polígono nesses estratos implicará redução censitária direta sem reposição.

---

## 8. O Que NÃO Foi Feito

- O sorteio **não** foi executado mais de uma vez.
- A semente **não** foi alterada após inspeção.
- Nenhum selo anterior foi sobrescrito ou versionado (D23).
- Nenhum polígono sintético ou fabricado foi introduzido.
