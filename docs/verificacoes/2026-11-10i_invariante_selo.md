# Relatório de Verificação — Invariantes de Totais e Integridade do Selo de Sorteio D16

**Data:** 2026-11-10  
**Referência:** Prompt I — Executor SAREL (`docs/planejamento/prompts/PROMPT_EXECUTOR_INVARIANTE_SELO_2026-11-10.md`)  
**Branch:** `correcoes/contencao-2026-11-02`  
**Status da Suíte:** 108/108 arquivos de teste aprovados (919 testes passando, 3 pulados, 0 falhas)  
**TypeScript (`tsc --noEmit`):** 0 erros  
**Auditoria de Estado (`npm run estado:verificar`):** OK (sincronizado)  

---

## 1. Contexto e Motivação

No Prompt H, a transição dos tipos literais nominais (`36 | 72`, `18 | 36`, `360 | 361.44`) para o tipo primitivo `number` foi necessária em função do ajuste decorrente da emenda D12/D16 (censo deficitário em `E_1_2_2` e estrato vazio declarado `E_1_3_2`, gerando totais de 67 polígonos, 34 de treino, 33 de held-out e 336,34 ha).

Contudo, `number` em TypeScript é uma tipagem permissiva que não valida em tempo de execução a consistência interna do selo. Para garantir que o selo criptográfico auditável de D16/D23 seja matematicamente infalsificável perante a banca examinadora, os invariantes de execução foram formalizados na função `validarInvariantesSeloD16`, invocada compulsoriamente antes de qualquer devolução ou persistência do selo.

---

## 2. Os Oito Invariantes Implementados (Redação Exata)

A validação foi implementada em `src/lib/gee/sorteioPoligonos.ts` com prefixo padronizado `[SELO_INVALIDO:<ID_INVARIANTE>]`:

| # | Identificador | Invariante Matemático | Redação Exata da Verificação |
|---|---|---|---|
| **1** | `INV_1_TOTAL_TREINO_HELDOUT` | $\text{totalTreino} + \text{totalHeldOut} = \text{totalPoligonosSorteados}$ | `selo.totalTreino + selo.totalHeldOut !== selo.totalPoligonosSorteados` $\rightarrow$ lança `[SELO_INVALIDO:INV_1_TOTAL_TREINO_HELDOUT]` |
| **2** | `INV_2_AREA_TOTAL` | $\text{areaTotalHectares} = \text{round}_2(\text{totalPoligonosSorteados} \times 5{,}02)$ | `selo.areaTotalHectares !== Number((selo.totalPoligonosSorteados * 5.02).toFixed(2))` $\rightarrow$ lança `[SELO_INVALIDO:INV_2_AREA_TOTAL]` |
| **3** | `INV_3_SOMA_POLIGONOS_POR_ESTRATO` | $\text{totalPoligonosSorteados} = \sum_{h=1}^{18} n_h$ | `selo.totalPoligonosSorteados !== somaNhAlocados` $\rightarrow$ lança `[SELO_INVALIDO:INV_3_SOMA_POLIGONOS_POR_ESTRATO]` |
| **4** | `INV_4_PARTICAO_CANDIDATOS` | $\text{totalCandidatosEntrada} = \sum_{h=1}^{18} N_h$ | `selo.totalCandidatosEntrada !== somaNhPopulacao` $\rightarrow$ lança `[SELO_INVALIDO:INV_4_PARTICAO_CANDIDATOS]` |
| **5** | `INV_5_POLIGONOS_UNICOS` | $\forall i \ne j, \text{idPoligono}_i \ne \text{idPoligono}_j$ | `idsPoligonoVistos.has(p.idPoligono)` $\rightarrow$ lança `[SELO_INVALIDO:INV_5_POLIGONOS_UNICOS]` |
| **6** | `INV_6_CENSO_PI_1` | $\forall h \in \text{estratosCenso}, \forall i \in h, \pi_i = 1$ | `polis.length === 0 \|\| p.pi_i !== 1` $\rightarrow$ lança `[SELO_INVALIDO:INV_6_CENSO_PI_1]` |
| **7** | `INV_7_ESTRATO_VAZIO` | $\forall h \in \text{estratosVazios}, N_h = 0 \land n_h = 0$ | `nh !== 0 \|\| polis.length !== 0` $\rightarrow$ lança `[SELO_INVALIDO:INV_7_ESTRATO_VAZIO]` |
| **8** | `INV_8_HORVITZ_THOMPSON` | $\forall i, \pi_i \in (0, 1] \land |\pi_i \times w_i - 1| \le 10^{-9}$ | `p.pi_i <= 0 \|\| p.pi_i > 1 \|\| Math.abs(p.pi_i * p.w_i - 1) > 1e-9` $\rightarrow$ lança `[SELO_INVALIDO:INV_8_HORVITZ_THOMPSON]` |

---

## 3. Tabela dos Testes de Adulteração (Cobertura Falsificável)

Para demonstrar empiricamente que a guarda não é decorativa, foram construídos testes unitários em `src/lib/gee/sorteioPoligonos.test.ts` clonando um selo legítimo e corrompendo exatamente um campo por teste:

| Teste | Invariante Testado | Mutação Injetada no Selo | Exceção Capturada | Status |
|---|---|---|---|:---:|
| Adulteração 1 | `INV_1_TOTAL_TREINO_HELDOUT` | `selo.totalTreino += 1` | `[SELO_INVALIDO:INV_1_TOTAL_TREINO_HELDOUT] Invariante 1 violado...` | **APROVADO** |
| Adulteração 2 | `INV_2_AREA_TOTAL` | `selo.areaTotalHectares = 999.99` | `[SELO_INVALIDO:INV_2_AREA_TOTAL] Invariante 2 violado...` | **APROVADO** |
| Adulteração 3 | `INV_3_SOMA_POLIGONOS_POR_ESTRATO` | `selo.poligonos.pop()` (remove 1 polígono) | `[SELO_INVALIDO:INV_3_SOMA_POLIGONOS_POR_ESTRATO] Invariante 3 violado...` | **APROVADO** |
| Adulteração 4 | `INV_4_PARTICAO_CANDIDATOS` | `selo.totalCandidatosEntrada += 10` | `[SELO_INVALIDO:INV_4_PARTICAO_CANDIDATOS] Invariante 4 violado...` | **APROVADO** |
| Adulteração 5 | `INV_5_POLIGONOS_UNICOS` | `selo.poligonos[1].idPoligono = selo.poligonos[0].idPoligono` | `[SELO_INVALIDO:INV_5_POLIGONOS_UNICOS] Invariante 5 violado...` | **APROVADO** |
| Adulteração 6 | `INV_6_CENSO_PI_1` | `selo.poligonos[0].pi_i = 0.8` em estrato de censo | `[SELO_INVALIDO:INV_6_CENSO_PI_1] Invariante 6 violado...` | **APROVADO** |
| Adulteração 7 | `INV_7_ESTRATO_VAZIO` | `selo.estratosVazios = ["E_1_1_1"]` (estrato ativo com $N_h=4$) | `[SELO_INVALIDO:INV_7_ESTRATO_VAZIO] Invariante 7 violado...` | **APROVADO** |
| Adulteração 8 | `INV_8_HORVITZ_THOMPSON` | `selo.poligonos[0].w_i = 999.0` (violando $\pi_i \times w_i = 1$) | `[SELO_INVALIDO:INV_8_HORVITZ_THOMPSON] Invariante 8 violado...` | **APROVADO** |

---

## 4. Confirmação dos Totais sobre o Universo Real da BP3

O teste de integração contra os dados reais da Bacia do Paraná 3 (`docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json` e `docs/verificacoes/cache_frequencia_solo_nu_bp3.json`) foi executado e atestou rigorosamente os quatro valores previstos:

- **Total de candidatos elegíveis avaliados:** **677**.
- **Total de polígonos sorteados:** **67**.
- **Total de polígonos no conjunto treino:** **34**.
- **Total de polígonos no conjunto held-out:** **33**.
- **Área total amostrada:** **336,34 ha** ($67 \times 5{,}02\text{ ha}$).
- **Estratos de censo confirmados:** `E_1_2_2` ($N_h = 3$), `E_2_2_2` ($N_h = 4$), `E_2_3_2` ($N_h = 4$), `E_3_2_2` ($N_h = 4$).
- **Estrato vazio confirmado:** `E_1_3_2` ($N_h = 0$).
- **Status dos 8 invariantes:** Todos os 8 invariantes foram aprovados sem ressalvas sobre o selo do universo real.

---

## 5. Decisão sobre a Versão do Esquema (`versaoEsquema`)

- **Decisão:** A versão do esquema foi formalmente elevada de `"1.3.0"` para **`"1.4.0"`**.
- **Justificativa:** O selo agora inclui obrigatoriamente a propriedade `invariantesVerificados: string[]`, contendo a lista dos 8 identificadores conferidos (`INV_1_TOTAL_TREINO_HELDOUT` a `INV_8_HORVITZ_THOMPSON`). Como novos campos adicionam metadados estruturais ao selo emitido, o incremento de versão menor (`minor`) cumpre a semântica de versionamento do projeto.
- **Retrocompatibilidade:** A união de versões literais em `SeloSorteioD16` foi expandida para `"1.0.0" | "1.1.0" | "1.2.0" | "1.3.0" | "1.4.0"`, preservando total compatibilidade com selos legados e fixtures de teste anteriores.

---

## 6. O Que NÃO Foi Feito (Protocolo Anti-Fabricação)

- **O sorteio com `--confirmar` NÃO foi executado.**
- A pasta `docs/verificacoes/sorteio/` permanece sem qualquer selo persistido, preservando a irrevogabilidade do sorteio D16/D23 para decisão explícita do pesquisador em rodada dedicada.
