# Verificação na fonte primária — estimador de quantil de `estatisticasSerie.ts`

**Data:** 20 de outubro de 2026
**Fonte lida:** Hyndman, R. J.; Fan, Y. (1996). "Sample Quantiles in Statistical Packages." *The American Statistician*, Nov. 1996, **50**(4), 361–365. Recebido mar/1995, revisado mar/1996. © American Statistical Association.
**Arquivo arquivado:** `docs/verificacoes/fontes/hyndman1996/hyndman_fan_1996_american_statistician.pdf`
**SHA-256:** `c3ae245d4fff12466d3c849503d3f0ec7ffaec90c0c2adce07cd3c163ffcb6b6`
**Contexto:** DP-24, item `nMinimo = 3` em `src/lib/gee/estatisticasSerie.ts:57`.

---

## 1. O que foi conferido, e está CONFIRMADO na fonte

### 1.1 O SAREL implementa a Definição 7

`calcularPercentilOrdenado` (`estatisticasSerie.ts:30-49`) calcula `index = p * (n - 1)` e interpola linearmente entre as ordens adjacentes. Em índice base 1, isso equivale a posicionar a k-ésima estatística de ordem em

$$p_k = \frac{k-1}{n-1}$$

que é exatamente a **Definição 7** do artigo (p. 363): *"Parzen (1979) also considered the modal position $p_k = \text{mode}F(X_{(k)}) = (k-1)/(n-1)$."* Na Tabela 3 (p. 364) a Definição 7 tem $\alpha = 1$, $\beta = 1$, $m = 1-p$.

É também a definição-padrão do S-PLUS e do R (`type = 7`).

### 1.2 Os autores recomendam a Definição 8, não a 7 — CONFIRMADO

Estava registrado como citação **suspensa**, por vir de fonte secundária. Agora está lido no primário, em dois lugares:

- **Resumo (p. 361):** *"We conclude by recommending that the median-unbiased estimator be used because it has most of the desirable properties of a quantile estimator and can be defined independently of the underlying distribution."*
- **§5, Conclusões (p. 364):** *"Of these, $\hat{Q}_8(p)$ seems the best because it gives (approximately) median-unbiased estimates of $Q(p)$ regardless of the distribution."* e *"We believe there is a similar need to adopt a standard sample quantile definition, and we propose that $\hat{Q}_8(p)$ is the best choice."*

A Definição 8 usa $p_k = (k - 1/3)/(n + 1/3)$.

### 1.3 A Definição 7 falha em duas das seis propriedades desejáveis

O artigo enuncia seis propriedades (Tabela 1, p. 361) e as condições para satisfazê-las (p. 363):

| Propriedade | Condição no artigo | Definição 7 ($\alpha=\beta=1$) |
|---|---|---|
| **P2** — $\text{Freq}(X_k \le \hat{Q}_i(p)) \ge pn$ | *"P2 is satisfied for all p if and only if $\alpha + \beta \le 1$ and $\alpha > 0$"* | **FALHA** ($\alpha+\beta = 2$) |
| **P5** — há probabilidade positiva além do intervalo dos dados | *"for P5 we need $\alpha < 1$ and $\beta < 1$"* | **FALHA** ($\alpha = 1$) |

**P5 é a propriedade que importa aqui.** O artigo a motiva assim (p. 362): *"Property P5 reflects the result that for a continuous distribution, we expect there to be positive probability for values beyond the range of the data."*

Ou seja: a Definição 7 **afirma que o mínimo observado é o percentil 0 e o máximo é o percentil 100**. Para uma variável contínua isso é falso, e é a origem formal da degeneração numérica medida abaixo.

### 1.4 A base para um n mínimo — CONFIRMADA

A Definição 6 (Weibull 1939; Gumbel 1939), p. 363, usa $p_k = k/(n+1)$, e o artigo afirma: *"the vertices divide the sample space into $n+1$ regions, each with probability $1/(n+1)$ on average. In particular, $\Pr(X < X_{(1)}) = \Pr(X > X_{(n)}) = 1/(n+1)$."*

Com $n$ observações, portanto, espera-se massa de probabilidade $1/(n+1)$ **abaixo do mínimo amostral**. Para que o percentil 10 caia dentro da faixa amostrada, é preciso

$$\frac{1}{n+1} \le 0{,}10 \quad \Longrightarrow \quad n \ge 9$$

---

## 2. Consequência numérica, calculada a partir das definições do artigo

Posição $h$ do percentil 10 na amostra ordenada ($h = 1$ é o mínimo):

| $n$ | Definição 7 (em uso) | Definição 8 (recomendada) |
|---|---|---|
| 3 | 1,200 | **0,667 — fora da amostra** |
| 6 | 1,500 | **0,967 — fora da amostra** |
| 8 | 1,700 | 1,167 |
| 9 | 1,800 | 1,267 |
| 12 | 2,100 | 1,567 |

Com $n = 3$, o p10 fica a 20% de distância do mínimo; com $n = 6$, a 50%. Abaixo de $n = 9$ o percentil 10 não está sendo estimado dentro da amostra: a Definição 7 interpola em silêncio, enquanto a Definição 8 sinaliza a extrapolação ao posicionar $h < 1$.

---

## 3. O que NÃO foi conferido

O artigo **não trata** de sensoriamento remoto, de séries temporais orbitais nem de número mínimo de observações válidas por pixel. Ele é sobre a definição do estimador de quantil amostral. Qualquer limiar operacional ($n \ge 9$ ou outro) é decisão do pesquisador, apoiada neste resultado — não prescrita pelo artigo.

Busca por literatura de sensoriamento remoto que fixe um mínimo de observações para composições por percentil **não encontrou padrão estabelecido**: as fontes consultadas tratam de janelas de composição e cobertura de dados, não de limiar de contagem. O mínimo de 6 de **D11** se apoia na própria metodologia do projeto (Seção 6.1), não em fonte externa.

---

## 4. Decisões que isto informa (do pesquisador, não do assistente)

1. **`nMinimo` para percentis de cauda.** O valor 3 em uso não tem origem declarada. O resultado de 1.4 sustenta $n \ge 9$ para p10/p90, ou o abandono da cauda em favor de estatísticas que $n$ menor sustenta.
2. **Definição 7 ou 8.** Trocar o estimador altera valores já computados. O custo é mínimo agora, enquanto não há resultado de modelagem válido, e cresce depois.
