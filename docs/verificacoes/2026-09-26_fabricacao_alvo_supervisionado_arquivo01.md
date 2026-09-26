# Erradicação de Fabricação do Alvo Supervisionado ($y$) no Arquivo 01 e Endurecimento da Validação Cruzada Espacial

**Data:** 26/09/2026  
**Contexto:** SAREL — Auditoria de Conformidade da Regra 4, Regra 1 e Regra 8 (PPGTCA 2026)  
**Assunto:** Convergência da derivação do alvo supervisionado (`Classe_Alvo_Binaria`, `Rotulo_Classe`, `Rotulo_Modalidade`) do Arquivo 01 (`01_matriz_preditores_treinamento_sarel.csv`) para a implementação canônica `montarMatrizTreino` (`src/lib/matriz/montagem.ts`), exclusão de amostras sem observação humana e endurecimento da validação cruzada espacial (`GroupKFold`) no Arquivo 05.

---

## 1. Registro Literal do Estado Anterior (Achado A)

Em `src/lib/export/pacoteReprodutibilidade.ts`, dentro da função `gerarCsvMatrizTreinamento`, as linhas 184–185 e 219–221 continham a seguinte implementação divergente da matriz de treino canônica:

```ts
184:     const classeStr = String(p.rotulo?.final?.classe ?? "ausente").toLowerCase();
185:     const classeBinaria = classeStr.includes("laminar") || classeStr.includes("erosao") || classeStr === "1" ? 1 : 0;
...
219:       Rotulo_Classe: p.rotulo?.final?.classe ?? "ausente",
220:       Rotulo_Modalidade: p.rotulo?.final?.modalidade ?? "campo",
221:       Classe_Alvo_Binaria: classeBinaria,
```

O script Python de auditoria reproduzível (`05_script_auditoria_reproduzivel.py`, linha 623) consumia diretamente essa coluna sem qualquer filtragem de observação:

```python
623:     y = df["Classe_Alvo_Binaria"].astype(int)
```

---

## 2. Tabela Comparativa de Binarização: `pacoteReprodutibilidade.ts:185` vs. `montagem.ts:139-148` (Achado A3)

A implementação canônica em `src/lib/matriz/montagem.ts` (linhas 139–148) define:

```ts
139:     const rotuloNorm = rotulo.classe.trim().toLowerCase();
140:     const ehErosao =
141:       rotuloNorm.includes("erosao") ||
142:       rotuloNorm.includes("erosão") ||
143:       rotuloNorm === "presente" ||
144:       rotuloNorm === "incipiente" ||
145:       rotuloNorm === "moderada" ||
146:       rotuloNorm === "severa" ||
147:       rotuloNorm === "1";
148:     const classeAlvoBinaria: 0 | 1 = ehErosao ? 1 : 0;
```

| Valor de `rotulo.classe` (normalizado) | `pacoteReprodutibilidade.ts:185` (Anterior) | `montagem.ts:139-148` (Canônico / Atual) | Efeito Anterior sobre o Alvo $y$ |
| :--- | :---: | :---: | :--- |
| `undefined` / ponto sem rótulo (`!rotuloCons`) | `0` (`?? "ausente"` $\to 0$) | **Excluído da matriz** (`exclusoes.push`) | **Falso Controle (`A1`):** Ausência de observação humana fabricava $y = 0$ com `Rotulo_Modalidade = "campo"` (`A2`). |
| `"divergencia"` pendente (`final: null`) | `0` (`?? "ausente"` $\to 0$) | **Excluído da matriz** (`exclusoes.push`) | **Falso Controle (`A1`):** Ponto sem consenso inter-intérpretes entrava como negativo confirmado ($y = 0$). |
| `"severa"` | **`0`** | **`1`** | **Falso Negativo Crítico (`A3`):** Erosão severa observada em campo era convertida em controle ($y = 0$). |
| `"moderada"` | **`0`** | **`1`** | **Falso Negativo (`A3`):** Erosão moderada observada em campo era convertida em controle ($y = 0$). |
| `"incipiente"` | **`0`** | **`1`** | **Falso Negativo (`A3`):** Erosão incipiente observada em campo era convertida em controle ($y = 0$). |
| `"presente"` | **`0`** | **`1`** | **Falso Negativo (`A3`):** Erosão presente era convertida em controle ($y = 0$). |
| `"erosão"` / `"erosão laminar"` (com acento) | **`0`** (se sem `"laminar"`) | **`1`** | **Falso Negativo (`A3`):** Grafia acentuada `"erosão"` sem o termo `"laminar"` recebia $y = 0$. |
| `"erosao"` / `"1"` | `1` | `1` | Concordante ($y = 1$). |
| `"controle"` / `"ausente"` / `"0"` (observado) | `0` | `0` | Concordante quando efetivamente observado por humano ($y = 0$). |

---

## 3. Demonstração do Falso Negativo em Observação Humana Válida (Achado A3)

Para um ponto amostral inspecionado em campo cujo perito registrou `rotulo.final.classe = "severa"` e `rotulo.final.modalidade = "campo"`:
- **Estado Anterior (`pacoteReprodutibilidade.ts:184-185`):**
  `classeStr = "severa"`. Como `"severa".includes("laminar")` é `false`, `"severa".includes("erosao")` é `false` e `"severa" === "1"` é `false`, a linha 185 atribuía `classeBinaria = 0`. A linha emitida no CSV terminava em `...,severa,campo,0`, contradizendo diretamente o laudo de campo.
- **Estado Corrigido (via `montarMatrizTreino`):**
  `rotuloNorm === "severa"` avalia `ehErosao = true` (`montagem.ts:146`), produzindo `classeAlvoBinaria = 1` e emitindo `...,severa,campo,1`.

---

## 4. Demonstração Quantitativa da Fabricação por Omissão (Achado A1)

No fluxo operacional de `src/components/export/ExportModal.tsx` (linha 95), `gerarPacoteReprodutibilidadeZip(pontosVisiveis)` era chamado sobre todos os pontos visíveis da campanha antes da realização da etapa de rotulagem humana (`rotulosConsolidados = {}`):
- **Antes da correção:** Para um lote de $N$ pontos amostrais selecionados no GEE com `rotulosConsolidados = {}` (ex.: $N = 50$ candidatos orbitais ou $N = 1$ no teste de ponto sem rótulo), **100% dos pontos ($N/N$)** eram emitidos no Arquivo 01 com `Rotulo_Classe = "ausente"`, `Rotulo_Modalidade = "campo"` e `Classe_Alvo_Binaria = 0` ($100\%$ de controles fabricados por omissão, violando a **Regra 4**, `docs/design.md:17`).
- **Depois da correção:** Com `rotulosConsolidados = {}`, **0 pontos ($0/N$)** são emitidos nas linhas de dados do Arquivo 01; todos os $N$ pontos são contabilizados em `# EXCLUSOES DE ROTULAGEM (Regra 4) — N pontos recebidos, 0 emitidos` (`# sem rotulagem=N | divergencia sem desempate=0`), e o Arquivo 05 aborta explicitamente com `[ABORTO] Matriz de treino vazia (0 amostras rotuladas emitidas no Arquivo 01)`.

---

## 5. Segregação Estrita do Padrão-Ouro VANT Spectral 2 (Achado A4 e Decisão D16)

Conforme a **Decisão `D16` (`src/config/decisoes.ts:163-170`)** e a **Regra 6 (`docs/design.md:19, 41`)**, os 4 sítios contínuos de referência territorial em Céu Azul e Medianeira voados com o VANT Multiespectral Spectral 2 (`modalidade = "drone"`) constituem o conjunto de validação independente (*held-out*) e jamais podem integrar a matriz de treino (`01_matriz_preditores_treinamento_sarel.csv`), sob pena de contaminação entre treino e teste.

- Em `src/lib/matriz/montagem.ts` (linhas 196–199), `montarMatrizTreino` segrega todo ponto com `rotulo.modalidade === "drone"` para o vetor separado `heldOutDrone` e executa `continue`, excluindo-o de `resultadoMatriz.linhas`.
- Ao convergir `gerarCsvMatrizTreinamento` para `montarMatrizTreino`, os pontos de drone são automaticamente excluídos das linhas emitidas no Arquivo 01, sua contagem é declarada no cabeçalho (`# HELD-OUT DRONE (D16): n pontos excluidos`), e `assegurarSegregacaoTreino(linhaCanonica.rotuloModalidade)` (`src/lib/rotulos/ingestaoDrone.ts:119-125`) atua como pós-condição inviolável sobre todas as linhas emitidas.

---

## 6. Evidência de Execução do Vitest (Antes e Depois)

### 6.1. Antes da Correção (10 testes em `pacoteReprodutibilidade.test.ts`, sem cobertura de A1, A3 e A4)
```text
 RUN  v4.1.11 C:/Users/lalfr/Docs Fora do Ar/LUIS ALFREDO/01 - MESTRADO PPGTCA 2026/02 - PESQUISA EROSÃO LAMINAR/geolocalizacao-erosao-propriedade

 ✓ src/lib/export/pacoteReprodutibilidade.test.ts (10 tests) 38ms

 Test Files  1 passed (1)
      Tests  10 passed (10)
```

### 6.2. Depois da Correção (13 testes em `pacoteReprodutibilidade.test.ts`, incluindo A1, A3 e A4)
```text
 RUN  v4.1.11 C:/Users/lalfr/Docs Fora do Ar/LUIS ALFREDO/01 - MESTRADO PPGTCA 2026/02 - PESQUISA EROSÃO LAMINAR/geolocalizacao-erosao-propriedade

 ✓ src/lib/seguranca/padroesProibidos.test.ts (13 tests) 146ms
 ✓ src/lib/export/pacoteReprodutibilidade.test.ts (13 tests) 42ms

 Test Files  2 passed (2)
      Tests  26 passed (26)
```

---

## 7. Declaração de Governança Metodológica (`D13` e `D15`)

Declara-se formalmente que **`REGISTRO_DECISOES.D13` e `REGISTRO_DECISOES.D15` permanecem em estado `"pendente"`** em `src/config/decisoes.ts` (linhas 139 e 156), que `src/lib/rusle/linhaDeBase.ts` não foi alterado, e que **nenhum valor numérico de `Fator R`, `Fator LS` ou `Perda de Solo A` foi produzido, estimado ou destravado**.
