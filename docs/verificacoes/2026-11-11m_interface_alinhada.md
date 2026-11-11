# Evidência de Alinhamento da Interface ao Desenho Medido D16

**Data:** 11/11/2026  
**Rodada:** Prompt M — Executor SAREL  
**Branch:** `correcoes/contencao-2026-11-02`  
**Selo de Origem:** `docs/verificacoes/selo_publico_d16_2026-11-10.json`  

---

## 1. Contexto e Objetivo

Com a conclusão do sorteio oficial de polígonos D16 e o versionamento do **selo público auditável** (`docs/verificacoes/selo_publico_d16_2026-11-10.json`), os componentes de interface do SAREL precisavam ser alinhados para distinguir formalmente o **desenho nominal** planejado do **desenho realizado** medido:

- **Desenho Nominal (D12 / D16 / CONFIGURACAO_REGISTRADA_D16):** 72 polígonos de 5,02 ha (18 estratos × 4), ~361 ha (361,44 ha), distribuídos em 36 para treino e 36 reservados em held-out.
- **Desenho Realizado (Selo Público D16 de 10/11/2026):** 67 polígonos (336,34 ha), distribuídos em 34 para treino e 33 em held-out, com 4 estratos em censo amostral e 1 estrato vazio ($E\_1\_3\_2$).

A rodada cumpriu rigorosamente os limites estritos de escopo:
- Nenhum sorteio foi reexecutado.
- Nenhum arquivo de selo foi modificado.
- A guarda de cegamento K2 e o `.gitignore` permaneceram intocados.
- O tour metodológico (`src/config/tourMetodologico.ts`) permaneceu **intocado** (diferido para o Prompt N).
- `PainelCriterioRefutacaoD25.tsx:64` permaneceu **intocado**, servindo como modelo canônico.

---

## 2. Tarefa 1 — Leitor Único do Selo Público (`src/lib/gee/seloPublicoD16.ts`)

Foi implementado o módulo isomorfo `src/lib/gee/seloPublicoD16.ts`, estabelecendo um **ponto único de verdade** para consumo do selo público na interface e nos testes:

1. **Pureza de Importação:** Isento de chamadas a `node:fs`, `node:path` ou `node:crypto`. Permite importação direta em componentes React client (`"use client"`) e execução segura no navegador.
2. **Ausência Declarada (Fail-Closed):** Caso o selo público esteja ausente ou apresente formato inválido, a função `obterDesenhoRealizadoD16()` retorna `{ disponivel: false, motivo: "..." }` com todos os atributos numéricos como `null`, impedindo a invenção de números ou aplicação de valores padrão espúrios.
3. **Distinção Nominal vs. Realizado:** Exporta `DESENHO_NOMINAL_D16` e `obterComparativoDesenhoD16()`, rotulando explicitamente ambas as grandezas.
4. **Justificativa Biofísica do Déficit Integrada:** Disponibiliza as propriedades `motivoDeficit` e `motivoEstratoVazio` prontas para renderização textual nos painéis da interface.

### Testes Unitários do Leitor (`src/lib/gee/seloPublicoD16.test.ts`)
- 4 testes aprovados:
  - Validação dos números realizados exatos (67 polígonos, 336,34 ha, 34 treino, 33 held-out, 18 estratos, 4 censo, 1 vazio).
  - Devolução de estado indisponível declarado sem valores padrão inventados.
  - Distinção estrita entre nominal e realizado.
  - Pureza arquitetural (ausência de módulos `node:*`).

---

## 3. Tarefa 2 — Tabela Comparativa de Textos Corrigidos na Interface

| Arquivo e Linha | Texto Anterior (Hoje) | Texto Corrigido (Deve passar a) | Justificativa |
|---|---|---|---|
| `PainelSorteioD16.tsx:181-187` | `SELADO (72 POLÍGONOS / 361 ha)` <br> `O sorteio estratificado de 72 polígonos de 5,02 ha (36 treino + 36 held-out) já foi executado e selado.` | `SELADO (67 POLÍGONOS REALIZADOS / 336,34 ha [NOMINAL: 72 / 361 ha])` <br> Exibe 67 polígonos realizados (336,34 ha: 34 treino + 33 held-out) frente ao nominal de 72 (361 ha: 36 treino + 36 held-out), com linha explicativa do déficit estrutural da BP3 e estrato vazio $E\_1\_3\_2$. | Alinha o painel selado aos valores reais do sorteio preservando o nominal registrado. |
| `PainelSorteioD16.tsx:231-237` | `Sorteia exatamente 72 polígonos de 5,02 ha (4 por estrato sobre os 18 estratos de D12, totalizando 361 ha: 36 para treino e 36 reservados em held-out...)` | `Desenho nominal de 72 polígonos de 5,02 ha (4 por estrato nos 18 estratos de D12, totalizando 361 ha: 36 treino e 36 mantidos em held-out...). No sorteio realizado pelo selo oficial, são 67 polígonos (336,34 ha: 34 treino e 33 em held-out), com 4 estratos em censo e 1 estrato vazio (E_1_3_2)...` | Declara o nominal e anuncia os valores realizados do selo e motivo do déficit. |
| `PainelSorteioD16.tsx:311, :318, :329` | Botões e diálogo citando apenas `72 polígonos (361 ha)` | `Etapa 1/2 — Preparar Sorteio Irreversível de Polígonos (Nominal: 72 / 361 ha)` <br> `Confirmação Explícita (Etapa 2/2): Deseja selar definitivamente os polígonos (desenho nominal de 72 polígonos / 361 ha)...` <br> `Confirmar e Selar Sorteio Irreversível (Nominal: 72 Polígonos)` | Rotula explicitamente como desenho nominal de sorteio. |
| `PainelCampanha.tsx:350` | `72 Polígonos` | `{desenhoRealizado.disponivel ? "Nominal: 72 \| Realizado: 67 Polígonos" : "Nominal: 72 Polígonos"}` | Ambos visíveis dinamicamente no pill de navegação. |
| `PainelCampanha.tsx:426-438` | Card `72 Polígonos de VANT (5,02 ha)` com `361 ha Total` e `36 Treino \| 36 Held-out` | `Polígonos de VANT (Nominal: 72 \| Realizado: 67)` <br> `Nominal: 361 ha \| Realizado: 336,34 ha` <br> Texto explicativo: "No realizado, dois estratos de K̂=2 não atingem o piso de 4 polígonos (E_1_2_2 com 3 candidatos em censo) e um é vazio (E_1_3_2 vazio: a bacia possui apenas 9 candidatos em relevo plano e K̂=2, e o maior Ê é 0,0331 < corte 0,0490)." <br> `• Realizado: 34 Treino \| 33 Held-out (Nominal: 36 / 36)` | Apresenta ambos os números e explicita em uma linha a causa física do estrato vazio. |
| `PainelCampanha.tsx:906` (antiga :891) | `...amostragem probabilística estratificada dos 72 polígonos de VANT...` | `...amostragem probabilística estratificada dos polígonos de VANT (72 nominais / 67 realizados no selo D16)...` | Ambos os números visíveis na justificativa de aposentadoria de fotointerpretação. |
| `PainelCampanhaModal.tsx:39` | `...72 Polígonos de VANT e Âncora de Prevalência...` | `...Polígonos de VANT (72 nominais / 67 realizados) e Âncora de Prevalência...` | Ambos os números visíveis no subtítulo do modal de campanha. |
| `CalculadoraDesenhoAmostral.tsx:190, :205, :225, :238` | `361 ha (D16)` <br> `Registrado em D16` <br> `Número de Polígonos Total` <br> `Polígonos por Estrato (18 estratos D12)` | `361 ha (Nominal D16)` <br> `Registrado em D16 (Nominal)` <br> `Número de Polígonos Total (Nominal)` <br> `Polígonos por Estrato (18 estratos nominais D12)` | Rotula os parâmetros de referência estritamente como nominais de planejamento. |
| `PainelCriterioRefutacaoD25.tsx:64` | `alcanceEspacial: "1 unidade por polígono (72 polígonos nominais; n efetivo reduzido por compartilhamento de unidade pedológica)"` | **INTOCADO** | Já se encontrava no formato canônico exigido. |

---

## 4. Tarefa 3 — Aplicação da Emenda de 06/10/2026 a D02

Conforme a Emenda pré-dados de 06/10/2026 à Decisão D02, limiares de reflectância e solo exposto (BSI e NDVI) constituem **critério de triagem espectral**, nunca rótulo supervisionado (Regra 4: nada calculado vira rótulo).

1. **`src/lib/gee/amostragemBiofisica.ts`:**
   - Linhas 11-12: comentários de cabeçalho atualizados para "Candidato espectral a erosão" e "Candidato espectral a controle".
   - `CRITERIOS_ESPECTRAIS.EROSAO.rotulo`: atualizado de `"Erosão Laminar (Classe 1)"` para `"Candidato espectral a erosão"`.
   - `CRITERIOS_ESPECTRAIS.CONTROLE.rotulo`: atualizado de `"Controle / SPD (Classe 0)"` para `"Candidato espectral a controle"`.
   - Linhas 83 e 88: comentários de função alinhados à nova nomenclatura.
2. **`src/components/map/candidatoEspectral.test.ts`:**
   - Suíte atualizada para verificar e proibir explicitamente `"Classe 1"` e `"Classe 0"` em rótulos biofísicos de pontos em `src/lib/gee/amostragemBiofisica.ts` e em todos os arquivos de `src/components`.

---

## 5. Tarefa 4 — Trava de Paridade entre Registro e Interface

Para evitar novas derivas silenciosas de literais numéricos na interface, estendeu-se `src/config/paridadeArtefatos.test.ts` com os testes `G08` e `G09`:

1. **Varredura Automatizada (`G08`):**
   - Varre recursivamente todos os arquivos `.ts` e `.tsx` de `src/components` (excluindo testes).
   - Detecta números de desenho: `\b(72|36|18|361|360|67|34|33|336)\b`.
   - Detecta contexto metodológico na mesma linha: `\b(pol[íi]gonos?|estratos?|hectares?|ha|treino|held-?out)\b` (case-insensitive).
   - Exige que qualquer ocorrência esteja documentada na lista fechada de exceções autorizadas (`LISTA_EXCECOES_DESENHO_INTERFACE`), contendo arquivo, linha, trecho e justificativa substancial (>10 caracteres).
2. **Lista Exaustiva de Exceções Autorizadas:**
   - Exatamente 18 ocorrências mapeadas e justificadas (nominal rotulado, realizado rotulado ou referência à partição biofísica de 18 estratos).
3. **Meta-Teste (`G09`):**
   - Injeta linha sintética com violação proposital (`"Amostragem estratificada com 72 polígonos de validação"`) e prova que o scanner acusa a deriva.
   - Prova que linhas com números fora de contexto metodológico ou com contexto metodológico sem números de desenho não disparam falso positivo.
   - Prova que trechos autorizados na lista de exceções são aceitos.

---

## 6. Transcrição Textual do Painel de Sorteio D16 Corrigido

```text
[✓] Sorteio D16 Selado e Irreversível (Decisões D16 e D23)
Badge: SELADO (67 POLÍGONOS REALIZADOS / 336,34 ha [NOMINAL: 72 / 361 ha])

Texto:
O sorteio estratificado registrou 67 polígonos realizados (336,34 ha: 34 treino + 33 held-out)
frente ao plano nominal de 72 polígonos (361 ha: 36 treino + 36 held-out).

Déficit Estrutural da Bacia: Dois estratos com K̂=2 não atingem o piso de 4 polígonos:
E_1_2_2 tem 3 candidatos (todos incluídos em censo amostral) e E_1_3_2 tem 0 candidatos
(vazio biofísico da bacia), resultando em 67 polígonos realizados frente aos 72 nominais.
O estrato E_1_3_2 é vazio (Nh = 0): na bacia BP3 existem apenas 9 candidatos em relevo plano
(S ≤ 5,12%) com erodibilidade elevada (K̂=2), e o maior Ê medido entre eles é 0,0331,
abaixo do corte do tercil superior de solo exposto (Ê > 0,0490).

Conforme a Decisão D23, as probabilidades de inclusão (pi_i) registradas não podem ser
descartadas nem sobrescritas.

Arquivo do Selo: docs/verificacoes/sorteio/sorteio_d16_2026-11-10.json
• Semente: 20261110
• Hash: 15a5f1f38a3c...
• Selado em: 2026-11-10T23:59:28.093Z
```

---

## 7. Registro de Verificação e Integridade

- `npm test`: **110 arquivos de teste aprovados (1.176 testes unitários herméticos)**.
- `npx tsc --noEmit`: **zero erros de compilação**.
- `npm run estado:verificar`: **ESTADO.md sincronizado com sucesso**.
- Logs brutos de execução persistidos em `docs/verificacoes/execucao/2026-11-11m/`.
- Tour metodológico (`src/config/tourMetodologico.ts`): **intocado** (diferido para Prompt N).
