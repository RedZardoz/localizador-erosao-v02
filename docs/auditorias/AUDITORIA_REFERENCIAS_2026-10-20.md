# Auditoria de lastro bibliográfico das decisões — SAREL

**Data:** 20 de outubro de 2026
**Commit-base:** `69b22e5` (`sarel/executor-2026-10-09`)
**Motivo:** exigência do pesquisador de que todo procedimento ou decisão seja referenciado em bibliografia externa verdadeira, sem autorreferência.

---

## 1. Decisão de DP-24 / `nMinimo`, com o lastro bibliográfico

**Decidido pelo pesquisador em 20/10/2026: `n ≥ 9` para percentis de cauda (p10 e p90).**

### A fonte

**Hyndman, R. J.; Fan, Y. (1996). "Sample Quantiles in Statistical Packages." *The American Statistician*, 50(4), 361–365.**
Arquivada em `docs/verificacoes/fontes/hyndman1996/`, SHA-256 `c3ae245d4fff12466d3c849503d3f0ec7ffaec90c0c2adce07cd3c163ffcb6b6`. **Lida na fonte primária**, não em fonte secundária.

### O que a fonte sustenta

1. **O SAREL implementa a Definição 7** do artigo. `calcularPercentilOrdenado` usa `index = p·(n−1)`, equivalente a $p_k = (k-1)/(n-1)$ — a Definição 7 (Parzen, 1979), com $\alpha = \beta = 1$ na Tabela 3 (p. 364). É também a definição-padrão do R e do S-PLUS.

2. **A Definição 7 falha em duas das seis propriedades desejáveis.** O artigo dá as condições (p. 363): P2 exige $\alpha + \beta \le 1$; P5 exige $\alpha < 1$ e $\beta < 1$. Com $\alpha = \beta = 1$, ambas falham. A motivação de P5 (p. 362): *"for a continuous distribution, we expect there to be positive probability for values beyond the range of the data."* Em consequência, a Definição 7 afirma que o mínimo observado é o percentil 0 — falso para variável contínua.

3. **A base do limiar de 9.** A Definição 6 (Weibull, 1939; Gumbel, 1939) estabelece $p_k = k/(n+1)$, e o artigo afirma: *"the vertices divide the sample space into $n+1$ regions, each with probability $1/(n+1)$ on average. In particular, $\Pr(X < X_{(1)}) = \Pr(X > X_{(n)}) = 1/(n+1)$."*
   Logo, para que o percentil 10 caia dentro da faixa amostrada: $1/(n+1) \le 0{,}10 \Rightarrow n \ge 9$.

4. **Os autores recomendam a Definição 8**, não a 7. Resumo (p. 361): *"recommending that the median-unbiased estimator be used"*. §5 (p. 364): *"we propose that $\hat{Q}_8(p)$ is the best choice."*

### O que a fonte NÃO sustenta

O artigo **não trata** de sensoriamento remoto, de séries temporais orbitais nem de número mínimo de observações válidas por pixel. O limiar operacional de 9 é **decisão do pesquisador apoiada no resultado de (3)**, não prescrição do artigo. Esta fronteira deve constar da dissertação; citar Hyndman & Fan como se prescrevessem um mínimo para séries Sentinel-2 seria esticar a fonte além do que ela diz.

### Consequência da migração para a Definição 8 (decisão separada, ainda aberta)

Medido a partir das definições do artigo: o deslocamento de posição é **constante**, −0,533 no p10 e +0,533 no p90. A Definição 8 **alarga as caudas**; com $n \le 6$ ela satura (p10 = mínimo exato). Ou seja, migrar **sem** elevar o $n$ tornaria os percentis de cauda mais extremos, não mais confiáveis. As duas decisões são separáveis, mas só fazem sentido juntas.

---

## 2. Auditoria de autorreferência — 7 lacunas em 30 decisões

Varri os campos `referencia` das 30 entradas com estado `"decidida"` em `src/config/decisoes.ts`.

### 2.1 Sem nenhuma referência (2)

| ID | Título | Lastro externo candidato |
|---|---|---|
| **P05** | Classes elegíveis do ESA WorldCover (30 e 40) | **Zanaga et al. (2022)**, já citada em D07 para a mesma base. Correção de baixo custo: basta citar a obra que o próprio registro já usa |
| **P07** | Semente aleatória da amostragem | Sem candidato identificado. Reprodutibilidade de sorteio é convenção metodológica; **é preciso encontrar uma fonte, não inventá-la** |

### 2.2 Autorreferência, sem fonte externa (5)

| ID | Referência atual | Avaliação |
|---|---|---|
| **D02** | "Metodologia PPGTCA 2026, Seção 3.1 e Tabela 1" | Os limiares usam **BSI**, cuja fonte — **Rikimaru et al. (2002)** — **já está citada em D20**. A correção é cruzar a citação que o registro já possui |
| **D03** | "Metodologia PPGTCA 2026, Seções 3.1 e 5" + arquivos de código | Escala do rótulo. Sem candidato identificado no registro; exige busca |
| **D11** | "Metodologia PPGTCA 2026, Seção 6.1" | Mínimo de 6 observações. **Nenhuma fonte externa.** Busca por literatura de sensoriamento remoto que fixe mínimo de observações para composição por percentil **não encontrou padrão estabelecido** |
| **D18** | "Planejamento V3, §10.4" + código | Buffer do recorte Planet. Sem candidato identificado |
| **P02** | "Herdado do Localizador de Erosão (SAREL 1)" | Espaçamento do thinning. **Roberts et al. (2017)** já é citada em P01 para autocorrelação espacial e é o lastro natural |

### 2.3 Padrão observado

Das 5 autorreferências, **3 têm lastro externo já presente no próprio registro**, citado em outra decisão (D02→Rikimaru via D20; P05→Zanaga via D07; P02→Roberts via P01). Não é falta de fonte: é falta de **cruzamento**. São as correções mais baratas.

As outras 2 — **D03** e **D18** — e o **P07** exigem busca de fonte. E **D11** é a mais delicada: é um número que governa suficiência amostral e hoje se apoia apenas na metodologia do próprio projeto.

### 2.4 Boa prática já existente

**D13** registra explicitamente: *"Waltrick, P. C. et al. (2015) — NÃO conferida contra a fonte primária nesta…"*. Essa marcação de citação não conferida é exatamente a disciplina que esta auditoria recomenda generalizar.

---

## 3. O acervo não é conferível contra as citações — achado estrutural

A verificação pedida — *"qualquer artigo referenciado deve estar lá"* — **não pode ser executada com o inventário atual**, e isso é um achado, não uma recusa.

**Por quê:** o `INVENTARIO_SELECAO_BIBLIOGRAFICA.md` tem as colunas `Nº | Arquivo | Origem Prévia | Metodologia / Algoritmo | Relevância para o SAREL`. **Não há coluna de autor, ano, título ou DOI.** Dos 100 arquivos, 23 têm nome opaco de periódico (`agronomy-16-00294-v2.pdf`, `water-18-02255.pdf`, `jh0260072.pdf`) e o restante tem título temático sem autoria.

**Teste que eu rodei e que NÃO vale como evidência:** busquei os 37 sobrenomes citados em `decisoes.ts` contra nomes de arquivo e inventário; 4 apareceram. **Isso não significa que 33 obras estejam ausentes** — significa que o nome do autor não está no nome do arquivo. Registro o teste e o seu resultado nulo para que ninguém o repita achando que mede alguma coisa.

**Correção proposta:** acrescentar ao inventário as colunas **autor, ano, título e DOI**, e uma coluna de **decisão vinculada** (D01, D09, …). Com isso, a conferência "toda citação tem artigo no acervo" passa a ser automatizável — e pode virar um teste, como o varredor de padrões proibidos.

---

## 4. Ordem de correção sugerida

1. **As 3 de cruzamento** (D02, P05, P02) — citar obra que o registro já possui. Custo mínimo, risco nulo.
2. **Metadados do inventário** — autor, ano, título, DOI, decisão vinculada. Habilita toda a verificação futura.
3. **D11** — é a de maior consequência sem fonte: governa suficiência amostral.
4. **D03, D18, P07** — busca de fonte.
5. **Generalizar a marcação de D13** — toda citação não conferida no primário declarada como tal.

---

## 5. Limites desta auditoria

Auditei **apenas** `src/config/decisoes.ts`. **Não** auditei a apresentação, o compêndio metodológico, o manual nem os relatórios — onde o pesquisador relatou ter visto autorreferência. Esses documentos são PDF e a varredura exige extração de texto, que não foi feita aqui.

A classificação "autorreferência" usou busca por padrão (`Metodologia PPGTCA`, `Planejamento`, `docs/`, `Decisão D`). Uma referência mista — fonte externa **mais** menção interna — foi contada como externa. D05, D06, D12, D16, D17, D19 e P03 citam fonte externa **e** documento interno; estão em conformidade pelo critério adotado, mas vale conferir se a fonte externa sustenta de fato a decisão, ou se só acompanha.
