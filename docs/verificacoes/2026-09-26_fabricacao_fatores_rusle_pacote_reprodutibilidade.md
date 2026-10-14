# Erradicação de Fabricação de Fatores RUSLE e Imputação por Zero no Pacote de Reprodutibilidade

**Data:** 26/09/2026  
**Contexto:** SAREL — Auditoria de Conformidade da Regra 1, Regra 3 e Regra 8 (PPGTCA 2026)  
**Assunto:** Eliminação de literais numéricos entre aspas em `gerarCsvMatrizTreinamento`, remoção de imputação silenciosa `.fillna(0.0)` no Arquivo 05, fechamento de lacuna no varredor de padrões proibidos e exposição da Linha de Base RUSLE no Inspetor.

---

## 1. Registro Histórico do Estado Anterior e Cadeia Causal da Fabricação

No módulo `src/lib/export/pacoteReprodutibilidade.ts`, dentro da função `gerarCsvMatrizTreinamento` (linhas originais 147 a 153, mais linhas 135, 137 e 138), o Arquivo 01 (`01_matriz_preditores_treinamento_sarel.csv`) continha os seguintes operadores de coalescência nula com literais entre aspas:

```ts
135:       Municipio: valorOuNulo(p.localizacao?.municipio) ?? "não determinado",
136:       Codigo_IBGE: valorOuNulo(p.localizacao?.codigoIbge) ?? "",
137:       Bacia_Hidrografica: valorOuNulo(p.localizacao?.bacia) ?? "Paraná 3",
138:       Bloco_Espacial: p.blocoEspacial ?? "bloco_central",
...
147:       Ordem_Solo: valorOuNulo(p.solo?.ordem) ?? "Latossolo Vermelho",
148:       Erodibilidade_Classe: valorOuNulo(p.solo?.erodibilidadeClasse) ?? "Baixa",
149:       RUSLE_Fator_K: valorOuNulo(p.linhaDeBase?.fatorK) ?? "0.0117",
150:       RUSLE_Fator_R: valorOuNulo(p.linhaDeBase?.fatorR) ?? "7500",
151:       RUSLE_Fator_LS: valorOuNulo(p.linhaDeBase?.fatorLS) ?? "1.45",
152:       RUSLE_Fator_C: valorOuNulo(p.linhaDeBase?.fatorC) ?? "0.12",
153:       RUSLE_Fator_P: valorOuNulo(p.linhaDeBase?.fatorP) ?? "1.0",
```

### Cadeia Causal Determinística (100% dos Pontos Amostrais)
1. Em `src/config/decisoes.ts` (linhas 139 e 156), as decisões `D13` (*Formulação do Fator R*) e `D15` (*Fator LS: método de acúmulo e expoentes m e n*) encontram-se formalmente em estado `"pendente"`.
2. Em `src/lib/rusle/linhaDeBase.ts` (linhas 66 a 105), `montarLinhaDeBaseRUSLE` respeita a Regra 9 e retém `fatorR` e `fatorLS` como `{ estado: "indisponivel", causa: "decisao-pendente" }` em **100% dos pontos amostrais**.
3. Na exportação do Arquivo 01, `valorOuNulo(p.linhaDeBase?.fatorR)` e `valorOuNulo(p.linhaDeBase?.fatorLS)` retornavam `null`.
4. O operador `??` ativava os literais `"7500"` e `"1.45"`, fazendo com que o Pacote de Reprodutibilidade emitisse $R = 7500\text{ MJ}\cdot\text{mm}\cdot\text{ha}^{-1}\cdot\text{h}^{-1}\cdot\text{ano}^{-1}$ e $LS = 1{,}45$ para a totalidade dos pontos sem nenhuma medição ou modelagem subjacente — violação direta da **Regra 1 (`docs/design.md:14`)**.

---

## 2. Demonstração Quantitativa do Efeito no Produto Final ($A$)

A Equação Universal de Perda de Solo Revisada (Renard et al., 1997) define a perda anual de solo $A$ ($\text{t}\cdot\text{ha}^{-1}\cdot\text{ano}^{-1}$) pelo produto multiplicativo dos cinco fatores:

$$A = R \cdot K \cdot LS \cdot C \cdot P$$

Quando um avaliador externo ou script de pós-processamento reconstruía $A$ a partir das colunas emitidas no Arquivo 01 com os literais de fallback ativos:
- $R = 7500\text{ MJ}\cdot\text{mm}\cdot\text{ha}^{-1}\cdot\text{h}^{-1}\cdot\text{ano}^{-1}$ (literal fabricado na linha 150);
- $K = 0{,}0117\text{ t}\cdot\text{h}\cdot\text{MJ}^{-1}\cdot\text{mm}^{-1}$ (literal de classe Baixa, Mannigel et al., 2002, na linha 149);
- $LS = 1{,}45$ (literal adimensional fabricado na linha 151);
- $C = 0{,}12$ (literal típico de Sistema Plantio Direto / cobertura intermediária na linha 152);
- $P = 1{,}0$ (tabelado na linha 153).

A multiplicação produzia:

$$A_{\text{fabricado}} = 7500 \times 0{,}0117 \times 1{,}45 \times 0{,}12 \times 1{,}0 = 87{,}75 \times 1{,}45 \times 0{,}12 = 127{,}2375 \times 0{,}12 = 15{,}2685\text{ t}\cdot\text{ha}^{-1}\cdot\text{ano}^{-1}$$

Mesmo quando $C$ era medido via Sentinel-2 pela equação de Durigon et al. (2014) (por exemplo, $\text{NDVI} = 0{,}60 \implies C = \frac{1 - 0{,}60}{2} = 0{,}20$), o produto $R \cdot K \cdot LS = 127{,}2375$ permanecia constante e artificial, gerando uma perda de solo aparente de:

$$A_{\text{aparente}} = 127{,}2375 \times 0{,}20 \times 1{,}0 = 25{,}4475\text{ t}\cdot\text{ha}^{-1}\cdot\text{ano}^{-1}$$

Em contraste, o comportamento correto exigido pelo **Invariante 1 (`docs/design.md:73`)** é a **retenção estrita** de $R$, $LS$ e $A$ (`célula vazia ""` na tabela de dados e declaração formal no `# CENSO DE PROVENIENCIA` do cabeçalho), impedindo qualquer reconstrução espúria de perda de solo enquanto `D13` e `D15` estiverem pendentes.

---

## 3. Evidência de Execução do Varredor de Padrões Proibidos (Antes vs. Depois)

### 3.1. Antes da Correção do Varredor (Lacuna de Aspas em `padroesProibidos.test.ts:24-25`)
As expressões regulares `/\|\|\s*\d+(\.\d+)?\b/` e `/\?\?\s*\d+(\.\d+)?\b/` exigiam dígito imediatamente após o operador, deixando escapar numerais delimitados por aspas (`?? "7500"`, `?? "1.45"`, `?? "2018-01-01"`).

```text
 RUN  v4.1.11 C:/Users/lalfr/Docs Fora do Ar/LUIS ALFREDO/01 - MESTRADO PPGTCA 2026/02 - PESQUISA EROSÃO LAMINAR/geolocalizacao-erosao-propriedade

 ✓ src/lib/seguranca/padroesProibidos.test.ts (12 tests) 145ms

 Test Files  1 passed (1)
      Tests  12 passed (12)
   Start at  15:23:18
   Duration  1.92s (transform 51ms, setup 0ms, import 78ms, tests 145ms, environment 0ms)
```

### 3.2. Depois da Inclusão de `coalescencia-com-numero-entre-aspas` e `ou-logico-com-numero-entre-aspas` (Violação Detectada)
Ao acrescentar `{ id: "coalescencia-com-numero-entre-aspas", regex: /\?\?\s*["'`]\s*[0-9]/ }` e `{ id: "ou-logico-com-numero-entre-aspas", regex: /\|\|\s*["'`]\s*[0-9]/ }`, o varredor acusou imediatamente as violações remanescentes em código ativo:

```text
 RUN  v4.1.11 C:/Users/lalfr/Docs Fora do Ar/LUIS ALFREDO/01 - MESTRADO PPGTCA 2026/02 - PESQUISA EROSÃO LAMINAR/geolocalizacao-erosao-propriedade

 ❯ src/lib/seguranca/padroesProibidos.test.ts (13 tests | 1 failed) 92ms
       ✓ detecta .unmask(0.0) 4ms
       ✓ detecta || seguido de número 1ms
       ✓ detecta ?? seguido de número 0ms
       ✓ detecta ?? e || seguidos de numeral entre aspas 0ms
       ✓ detecta parâmetro com default numérico na assinatura 0ms
       ✓ detecta cortes e pisos com Math.max/min e literal 0ms
       ✓ detecta adquiridoEm atribuído a partir de new Date 0ms
       ✓ permite exceção com justificativa válida (>= 20 caracteres) 0ms
       ✓ rejeita exceção sem justificativa suficiente (< 20 caracteres) 0ms
       ✓ detecta síntese aleatória de atributos físicos em Python sem comentário permitido 0ms
       ✓ permite síntese em Python quando acompanhada de justificativa >= 20 chars com # permitido: 0ms
       × nenhum arquivo científico ativo deve conter padrões proibidos 39ms
       ✓ nenhum script em scripts/ deve conter geração sintética não documentada ou padrões proibidos 44ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/lib/seguranca/padroesProibidos.test.ts > Varredor de Padrões Proibidos (Regra 1 e 5) > Varredura no código científico ativo em src/lib/ > nenhum arquivo científico ativo deve conter padrões proibidos
AssertionError: Violações de padrões proibidos encontradas em código ativo:
  src\lib\export\planilha.ts:144 [coalescencia-com-numero-entre-aspas] -> Janela_Inicio: p.temporal?.D?.janela?.inicio ?? "2018-01-01",
  src\lib\export\planilha.ts:145 [coalescencia-com-numero-entre-aspas] -> Janela_Fim: p.temporal?.D?.janela?.fim ?? "2023-12-31",
 ❯ src/lib/seguranca/padroesProibidos.test.ts:191:16

 Test Files  1 failed (1)
      Tests  1 failed | 12 passed (13)
```

### 3.3. Após Saneamento de `pacoteReprodutibilidade.ts` e `planilha.ts`
```text
 RUN  v4.1.11 C:/Users/lalfr/Docs Fora do Ar/LUIS ALFREDO/01 - MESTRADO PPGTCA 2026/02 - PESQUISA EROSÃO LAMINAR/geolocalizacao-erosao-propriedade

 ✓ src/lib/seguranca/padroesProibidos.test.ts (13 tests) 91ms

 Test Files  1 passed (1)
      Tests  13 passed (13)
```

---

## 4. Fundamentação Física e Algorítmica da Remoção de `.fillna(0.0)` no Arquivo 05

No script Python de auditoria reproduzível (`05_script_auditoria_reproduzivel.py`), a linha 543 executava:

```python
X = df[cols_existentes].apply(pd.to_numeric, errors="coerce").fillna(0.0)
```

### 4.1. Inviabilidade Física do Zero como Imputação
Em geomorfologia e hidrologia de encostas, o valor numérico $0{,}0$ **não representa ausência de informação**, mas sim um estado físico específico e restritivo:
- **`Curvatura_Perfil = 0.0` e `Curvatura_Plana = 0.0`:** afirmam geometricamente uma vertente perfeitamente retilínea/planar ($\frac{\partial^2 z}{\partial s^2} = 0$), sem convergência nem divergência de fluxo;
- **`Acumulo_Fluxo = 0.0`:** afirma área de contribuição específica nula ($A_s = 0\text{ m}^2\cdot\text{m}^{-1}$), correspondente exclusivamente a um divisor topográfico absoluto sem escoamento superficial a montante;
- **`TWI = 0.0`:** afirma $\ln(A_s / \tan \beta) = 0 \implies A_s = \tan \beta$, condição hidrológica arbitrária;
- **`RUSLE_Fator_R = 0.0`:** afirma erosividade pluvial anual nula ($R = 0$, regime desértico sem chuva erosiva).

### 4.2. Tratamento Nativo de Ausência no XGBoost (Chen & Guestrin, 2016)
O classificador `XGBClassifier` implementa na Seção 3.4 de **Chen & Guestrin (2016)** (*"Sparsity-aware Split Finding"*, Algorithm 3, KDD 2016, pp. 785–794) o aprendizado ótimo da direção padrão (*default direction*) em cada nó de decisão para entradas `NaN` (`missing=np.nan`). Além disso, variáveis com $0/N$ observações válidas (`100%` ausentes na origem) são explicitamente descartadas antes do ajuste com log de auditoria `[RETIDA]`, preservando a integridade estatística do conjunto preditor.

---

## 5. Declaração de Governança Metodológica

Declara-se formalmente que **nenhuma decisão metodológica (`D13` ou `D15`) foi tomada, alterada ou destravada nesta correção**. Em `src/config/decisoes.ts`, `D13` (*Formulação do Fator R*) e `D15` (*Fator LS: método de acúmulo e expoentes m e n*) permanecem estritamente com `estado: "pendente"`, e `src/lib/rusle/linhaDeBase.ts` permanece inalterado, retendo `fatorR`, `fatorLS` e `perdaSolo` como `indisponivel` (`causa: "decisao-pendente"`).
