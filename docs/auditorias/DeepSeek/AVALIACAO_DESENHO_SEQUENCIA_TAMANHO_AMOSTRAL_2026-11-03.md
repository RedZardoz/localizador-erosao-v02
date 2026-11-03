# Avaliação do desenho, da sequência e do tamanho amostral — SAREL v2

**Data:** 3 de novembro de 2026
**Commit de referência:** a058954 (branch correcoes/contencao-2026-11-02)
**Objeto:** sequência de decisões, quantidade de polígonos e tamanho amostral do SAREL, à luz da bibliografia e do estado atual.
**Natureza:** avaliação científica independente, somente leitura. Não é emenda, não é decisão e não altera código, parâmetro ou registro.

> O SAREL já tem um desenho conceitualmente sofisticado — estratificação, pi_i, alvo contínuo, D25 pré-registrado, bootstrap por polígono e monotonicidade. A pergunta aqui não é se o desenho é elegante, mas se é executável, identificável e potente para o que a dissertação vai alegar.

---

## 1. Tese

A sequência está quase certa, mas coloca o lastro depois da decisão que ele deveria sustentar. A quantidade de 72 polígonos é suficiente para um modelo global, mas o desenho 18 x 4 é sobre-estratificado e não é executável. O tamanho amostral é adequado para uma vantagem homogênea de 0,10, não para uma vantagem heterogênea, para estimativas por estrato ou para área da BP3.

Em uma frase: o gargalo não é o número de células, é o número de clusters independentes e a qualidade do alvo.

---

## 2. O que a literatura exige

- **Cochran (1977)** sustenta a estratificação e o estimador de variância; a seção 5A.12 trata do caso de uma unidade por estrato, em que a variância dentro do estrato não é estimável. O SAREL tem duas unidades held-out por estrato — melhor que uma, ainda insuficiente para estimativa específica por estrato.
- **Olofsson et al. (2014)** mostram que estimativa de área e acurácia exigem desenho probabilístico e matriz de erro. O pi_i do SAREL é de imóvel, não de hectare; para área da BP3, o desenho atual não identifica o estimando.
- **King & Zeng (2001)** justificam sobreamostrar o evento raro, mas a correção a priori é de probabilidade, não da distribuição de covariáveis. O modelo é treinado sem pesos e a matriz não carrega pi_i; a inferência populacional não está fechada.
- **Riley et al. (2019, Parte I)** trata de desfechos contínuos, que é o caso de D26. **Parte II** e **Riley et al. (2020)** tratam de desfechos binários e de desenvolvimento em geral.
- **van der Ploeg et al. (2014)** é a origem do critério de 200 eventos por variável usado em D24. Esse critério é para desfechos dicotômicos; aplicá-lo diretamente a uma fração contínua é uma transposição que precisa ser justificada. Para o alvo contínuo, o critério de Riley Parte I é o mais adequado.
- **Roberts et al. (2017)** e **Ploton et al. (2020)** mostram que validação aleatória superestima desempenho em dados espaciais; o held-out por polígono não é spatial CV.
- **Cawley & Talbot (2010)** mostram que escolher o modelo no mesmo conjunto de avaliação infla o desempenho; o held-out de D25 é de uso único.
- **Frénay & Verleysen (2014)** mostram que ruído de rótulo degrada qualquer modelo; a confiabilidade do alvo vem antes da tunagem.

---

## 3. Sequência recomendada

| Ordem | Etapa | Por quê |
|---:|---|---|
| 0 | Lastro de Cochran e P02 | G-01 depende de Cochran 5A.12 para colapso e de P02 para a contagem. Sem primário, a decisão fica suspensa; o próprio G-01 registra o impedimento. |
| 1 | G-08 (kappa) | A regra de concordância define o n da dupla delineação e o critério de aceitação do rótulo. Precisa vir antes do plano de campo. |
| 2 | G-01 (desenho) | Define estratos, polígonos e held-out. Sem isso, G-13 não tem número de clusters. |
| 3 | G-12 (escala da margem) | 0,10 absoluto não significa a mesma coisa com 50% ou 95% de zeros; a decisão precisa vir antes do poder. |
| 4 | G-13 (poder) | Depende de G-01 e G-12; o número de clusters e a prevalência de zeros entram na simulação. |
| 5 | G-15 (pré-registro externo) | Só depois de G-01/G-12/G-13, porque o config precisa estar fechado; antes do primeiro rótulo. |
| 6 | Piloto separado (4–6 polígonos) | Testa pipeline de alvo, selo, D25 estrito, tempo e confiabilidade; não usa os 72 polígonos do estudo principal, para não consumir o held-out. |
| 7 | Sorteio D16, CSV D26, D25 | Uma única avaliação; nenhuma escolha de modelo, feature ou margem depois de ver o held-out. |

O erro de sequência mais grave hoje: G-01 está bloqueado por Cochran/P02, mas o projeto ainda trata a opção 1 como recomendada e o tipo do selo (36|72) bloqueia as alternativas. A decisão precisa vir depois do lastro, não antes.

---

## 4. Quantidade: 18 x 4 é sobre-estratificado

O desenho atual é 18 estratos x 4 polígonos = 72, com 2 treino + 2 held-out. Quatro estratos têm N_h < 4; um tem zero. Não é executável. As alternativas de G-01 são:

| Desenho | Estratos | Polígonos | Held-out | Área | Problema |
|---|---:|---:|---:|---:|---|
| 18 x 4 (atual) | 18 | 72 | 36 | 361 ha | 4 estratos inviáveis; 2 held-out por estrato; sem variância por estrato |
| 15 x 4 (opção 1) | 15 | 60 | 30 | 301 ha | 31,6% de chance de preencher sob 25% de recusa; perde Ê em S1/S2 x K2 |
| 14 x 4 (opção 1-v) | 14 | 56 | 28 | 281 ha | 92,9% de preenchimento; perde Ê em todo S1 x K2 e S2 x K2 |
| 12 x 4 (opção 3+) | 12 | 48 | 24 | 241 ha | 100% de preenchimento; perde K em S1 e S2; menos poder |
| **12 x 6 (não está na mesa)** | **12** | **72** | **36** | **361 ha** | **mantém área e poder; 3+3 por estrato; perde 6 estratos** |

**Meu ponto de vista:** se a pergunta primária é se o XGBoost supera o RUSLE no conjunto, **12 x 6 é o desenho que eu colocaria na mesa**. Ele preserva os 72 polígonos, os 361 ha, os 36 clusters held-out e a alocação 3+3 por estrato; usa 12 estratos com pelo menos 12 candidatos (a opção 3+ de G-01), o que resolve a viabilidade e melhora a reserva sob recusa. O custo é perder o contraste de K em S1 e S2 — mas o desenho 18 x 4 também não estima esse contraste por estrato, porque só tem 2 held-out por estrato. A perda é menor do que parece; o ganho em poder e viabilidade é real.

Se o contraste de K ou de Ê for a contribuição central, a resposta muda: aí vale 14 x 4 ou 15 x 4, aceitando menos poder e mais fragilidade. Não se pode ter as duas coisas com 72 polígonos; a escolha é entre contraste por estrato e poder global. O texto atual não declara essa escolha.

---

## 5. Tamanho amostral por objetivo

| Objetivo | Desenho atual | Adequado? | Recomendação |
|---|---|---|---|
| Prevalência/área (D23) | 60–80 pontos de âncora; rota default 50 | Parcial | Para p ≈ 0,15 e ±0,08, são ~77 pontos; com correção finita, ~69. Com 25% de recusa, selecionar 80–100 para reter 60–75. O default 50 é insuficiente. |
| Treino do modelo | 1.841 unidades efetivas espectrais; 460 terreno; 72 solo/chuva | Adequado com tetos | 5–8 preditores espectrais cabem; para solo/chuva, 72 unidades é o limite; 1 preditor por bloco é defensável, 3 não. Riley Parte I deve substituir o 200 EPV de D24 para o alvo contínuo. |
| D25 (36 clusters) | 36 held-out; margem 0,10 | Condicional | Poder ~100% se a vantagem for homogênea (SD <= 0,10); ~80% em SD 0,126; 70% em SD 0,15; 32,5% em SD 0,20. Adequado para vantagem consistente, não para heterogênea. |
| D25 com 28 clusters (1-v) | 28 held-out | Condicional | 96,2% em SD 0,10; 63,7% em SD 0,15; 25% em SD 0,20. |
| D25 com 24 clusters (3+) | 24 held-out | Mais fraco | 86,2% em SD 0,10; 52,5% em SD 0,15; 22,5% em SD 0,20. |
| Confiabilidade do alvo | não definido | Ausente | Dupla delineação de 100–200 células; se G-08 mantiver o portão duplo, o n simulado é >=200 para kappa 0,75 e >=500 para 0,70. Se for pontual, 50–80 pode bastar. G-08 precisa vir antes. |
| Validação espacial | 36 polígonos | Insuficiente para bloco | Com 36 polígonos, um bloco CV com 6 blocos tem 6 unidades; use sensibilidade por buffer, não spatial CV. |

### 5.1 Prevalência

Para p = 0,15 e margem de erro de 0,08, com 95% de confiança:

n = 1,96^2 * 0,15 * 0,85 / 0,08^2 ≈ 76,6.

Com correção para população finita de 677 imóveis: n ≈ 68,8. Com 25% de recusa, é preciso selecionar cerca de 92 para reter 69. O intervalo de 60–80 de D23 é adequado sem recusa; com recusa, é apertado. O default 50 da rota não é.

### 5.2 Kappa

A G-08 mostra que o portão duplo (kappa >= 0,61 e limite inferior do IC >= 0,61) exige:
- kappa verdadeiro 0,75: n >= 200 para 80% de poder;
- kappa verdadeiro 0,70: n >= 500;
- kappa verdadeiro 0,65: não alcançado até n = 1.200.

Se o portão for pontual, 30–50 pares podem bastar para kappa 0,75–0,80. O n da dupla delineação depende da regra de G-08; por isso G-08 vem antes.

### 5.3 Poder de D25

A G-13, com 36 clusters:
- SD da vantagem 0,10: 100%;
- 0,12: 82,5%;
- 0,15: 70%;
- 0,20: 32,5%;
- 0,30: 15%.

Com 28 clusters, os valores caem para 96,2%, 78,8%, 63,7%, 25% e 17,5%. Com 24, para 86,2%, 72,5%, 52,5%, 22,5% e 15%.

Leitura: o desenho é potente para uma vantagem consistente; é frágil para uma vantagem heterogênea. A heterogeneidade da erosão na BP3 é provavelmente alta, de modo que INCONCLUSIVA é um desfecho plausível — e cientificamente aceitável.

---

## 6. Avaliação da metodologia

### 6.1 O que está forte

1. Pré-registro e uso único do held-out. D25 tem a arquitetura correta: uma avaliação, bootstrap por polígono, métrica primária fixada, proibições explícitas.
2. Alvo contínuo. D26 evita a dicotomização gratuita e preserva a informação da fração erodida.
3. Monotonicidade. As restrições físicas do XGBoost são uma forma de regularização com pouco dado.
4. Governança. As 9 Regras, os 7 Invariantes, o registro de decisões e as travas de lastro são mais rigorosos que a média da literatura aplicada.
5. Correção de rumo. A G-13 corrigiu a afirmação anterior de que 0,10 era sempre ruído; a G-12 descobriu que a margem absoluta não é invariante à prevalência de zeros. Isso é ciência funcionando.

### 6.2 O que está frágil

1. Sobre-estratificação. 18 estratos x 4 polígonos é fragmentado demais para um pool de 677 candidatos; quatro estratos são inviáveis. O desenho confunde cobrir o espaço de covariáveis com estimar cada célula do fatorial.
2. Duas unidades held-out por estrato. Não há variância por estrato; as estimativas específicas de estrato serão instáveis. O desenho deve declarar que a inferência é global, não por estrato.
3. Confiabilidade do alvo ausente. Não há n para dupla delineação; o alvo é a maior fonte de incerteza e não tem plano de confiabilidade.
4. Validação espacial não resolvida. O held-out por polígono mede generalização para novos polígonos na mesma paisagem, não para novas regiões. Chamar de spatial CV é incorreto.
5. Margem absoluta dependente da prevalência de zeros. G-12 mostra que 0,10 é 10,6% do espaço útil com 50% de zeros e 23,8% com 95%. A decisão está aberta e precisa vir antes do dado.
6. Poder condicional. 36 clusters resolvem uma vantagem homogênea, não uma heterogênea; a simulação é possivelmente otimista porque gera scores i.i.d. em 502 células, enquanto D24 estima ~25,6 unidades efetivas.
   > **[Nota de Retificação — 03/11/2026]:** A afirmação de que a simulação gera scores i.i.d. em 502 células e não modela as ~25,6 unidades efetivas de D24 descreve a **primeira versão preliminar** do simulador, mas **não se aplica à versão vigente utilizada na execução oficial**. O simulador `scripts/d25/poder_d25.py`:
   > - Gera o alvo com efeito de polígono por deslocamento na escala logito (`gerar_alvo`, parâmetro `sd_poligono`);
   > - Calibra a correlação intraclasse explicitamente pelas unidades efetivas de D24: `ICC_IMPLICITO = (502/25.6 - 1)/501 ≈ 0.0371`, constante nomeada no módulo;
   > - Modela a vantagem do modelo como variável entre polígonos (`scores_competidores`, parâmetro `sd_vantagem`);
   > - Imprime isso no cabeçalho de toda execução oficial (`docs/verificacoes/2026-11-03_poder_d25.txt`): `Efeito de poligono: SD 0.8 em logito | ICC implicito por D24: 0.0371 (~25.6 unidades efetivas/poligono)`.
   >
   > *Origem do mal-entendido:* O relatório de P-D documentou detalhadamente em seção própria o erro da versão inicial e sua correção. Uma leitura dessa documentação que não alcance os parágrafos subsequentes pode induzir à impressão de que o defeito persistia na versão de produção. A ressalva é legítima em razão da redação daquele relatório, mas o modelo computacional oficial já incorpora o efeito de agrupamento.
7. Inferência de área não identificada. pi_i é de imóvel, não de hectare; área da BP3 exige outro desenho ou pesos de área.
8. Treino sem pesos. A amostra é desproporcional; o modelo é ajustado sem sample_weight e a matriz não carrega pi_i. A relação aprendida é da amostra estratificada, não da população.

### 6.3 Veredito por tipo de alegação

| Alegação | O desenho sustenta? |
|---|---|
| O modelo ordena a fração erodida melhor que o RUSLE na amostra de polígonos | Sim, condicionalmente — se D25 estiver estrito e o alvo for confiável. |
| O XGBoost supera o RUSLE por 0,10 na BP3 | Não — a amostra não é de área e a heterogeneidade pode tornar o resultado inconclusivo. |
| A área afetada na BP3 é X | Não — pi_i é de imóvel, não de hectare. |
| O modelo prevê erosão futura | Não — o alvo é a cicatriz na data do voo; Modelo P não é exportado. |
| O desempenho vale por estrato | Não — 2 held-out por estrato não estimam variância por estrato. |
| A acurácia nos sítios contínuos é a acurácia do mapa | Não — amostra de conveniência e IC ingênuo. |

---

## 7. Cenários

### Cenário A — 18 x 4, como está

Não executável (4 estratos inviáveis). Se forçado por colapso/redistribuição, deixa de ser o desenho pré-registrado. Probabilidade de dissertação defensável: baixa, porque a banca pode perguntar como o sorteio foi feito. Recomendação: não insistir.

### Cenário B — 14 x 4 (1-v), 56 polígonos, 28 held-out

Viável, com 92,9% de preenchimento sob 25% de recusa. Perde o contraste de Ê em S1 x K2 e S2 x K2. Poder: 96,2% em SD 0,10; 63,7% em SD 0,15. Bom se o contraste de K é central e o Ê no quadrante deficiente não é.

### Cenário C — 12 x 6, 72 polígonos, 36 held-out

Mantém área, poder e 36 clusters; 3+3 por estrato. Requer 12 estratos com N_h >= 6; a opção 3+ tem min 12, então é viável. Perde K em S1 e S2; mantém K em S3. Bom se a pergunta é o desempenho global do modelo e a comparação com o RUSLE. É o desenho que eu recomendaria colocar na mesa de G-01, se o objetivo for o modelo global.

### Cenário D — 12 x 4 (3+), 48 polígonos, 24 held-out

100% de preenchimento; 241 ha; menos poder. Bom se o custo de voo é o limitante e o contraste de K em S1/S2 não é necessário. Poder: 86,2% em SD 0,10; 52,5% em SD 0,15.

---

## 8. O que mudaria a avaliação

Para melhor:
- Escolher 12 x 6 (72 polígonos, 36 held-out) ou 14 x 4 (56, 28), declarando o contraste perdido.
- Definir n de dupla delineação (100–200 células) e a regra de kappa (G-08) antes do campo.
- Decidir G-12 (margem absoluta vs relativa ao teto) antes do poder e do pré-registro.
- Usar 80–100 pontos de âncora para reter 60–75 com 25% de recusa.
- Fazer a validação espacial como sensibilidade por buffer, não como spatial CV.
- Declarar que a inferência é global, não por estrato.

Para pior:
- Insistir em 18 x 4 e chamar a redistribuição de amostragem estratificada.
- Aumentar o número de polígonos sem resolver o alvo e o desenho.
- Afrouxar a margem de 0,10 depois de ver os dados.
- Testar vários modelos no held-out e escolher o vencedor.
- Tratar a acurácia dos sítios contínuos como acurácia da BP3.

---

## 9. Limitações

- Não há dado de desfecho; os números de poder são simulações, não resultados.
- A heterogeneidade da vantagem entre polígonos é desconhecida; o poder real depende dela e da autocorrelação espacial dos resíduos.
- A simulação de G-13 modela o efeito de polígono no alvo, mas gera scores com ruído i.i.d. em 502 células; pode ser otimista em relação às ~25,6 unidades efetivas de D24.  
  *(Nota de retificação: ver esclarecimento na §6.2, item 6: a versão vigente do simulador já calibra o ICC em 0,0371 conforme D24 e varia a vantagem entre polígonos).*
- Cochran 5A.12 não está conferido no primário; a recomendação de colapso depende dessa conferência.
- A escolha de 12 x 6 não foi simulada; a avaliação é qualitativa: mantém 36 clusters, 3+3 por estrato e 361 ha, mas perde 6 estratos.
- Não decido estratos, margem, kappa ou desenho; apresento o custo científico de cada opção.

---

## 10. Referências

- Cochran, W. G. (1977). Sampling Techniques, 3rd ed. Wiley. ISBN 0-471-16240-X.
- Olofsson, P. et al. (2014). Good practices for estimating area and assessing accuracy of land change. Remote Sensing of Environment 148:42–57. https://doi.org/10.1016/j.rse.2014.02.015
- King, G. & Zeng, L. (2001). Logistic regression in rare events data. Political Analysis 9(2):137–163. https://doi.org/10.1093/oxfordjournals.pan.a004868
- Riley, R. D. et al. (2019). Minimum sample size for developing a multivariable prediction model: Part I — continuous outcomes. Statistics in Medicine 38(7):1262–1275. https://doi.org/10.1002/sim.7992
- Riley, R. D. et al. (2019). Part II — binary and time-to-event outcomes. Statistics in Medicine 38(7):1276–1296. https://doi.org/10.1002/sim.7993
- Riley, R. D. et al. (2020). Calculating the sample size required for developing a clinical prediction model. BMJ 368:m441. https://doi.org/10.1136/bmj.m441
- van der Ploeg, T., Austin, P. C. & Steyerberg, E. W. (2014). Modern modelling techniques are data hungry. BMC Medical Research Methodology 14:137. https://doi.org/10.1186/1471-2288-14-137
- Roberts, D. R. et al. (2017). Cross-validation strategies for data with temporal, spatial, hierarchical, or phylogenetic structure. Ecography 40(8):913–929. https://doi.org/10.1111/ecog.02881
- Ploton, P. et al. (2020). Spatial validation reveals poor predictive performance of large-scale ecological mapping models. Nature Communications 11:4540. https://doi.org/10.1038/s41467-020-18321-y
- Cawley, G. C. & Talbot, N. L. C. (2010). On over-fitting in model selection and subsequent selection bias in performance evaluation. JMLR 11:2079–2107. https://jmlr.csail.mit.edu/papers/v11/cawley10a.html
- Frénay, B. & Verleysen, M. (2014). Classification in the presence of label noise: a survey. IEEE TNNLS 25(5):845–869. https://doi.org/10.1109/TNNLS.2013.2292894
- Cohen, J. (1960). A coefficient of agreement for nominal scales. Educational and Psychological Measurement 20(1):37–46. https://doi.org/10.1177/001316446002000104
- Landis, J. R. & Koch, G. G. (1977). The measurement of observer agreement for categorical data. Biometrics 33(1):159–174. https://doi.org/10.2307/2529310
- Nosek, B. A. et al. (2018). The preregistration revolution. PNAS 115(11):2600–2606. https://doi.org/10.1073/pnas.1708274114
- Kaufman, S. et al. (2012). Leakage in data mining: formulation, detection, and avoidance. ACM TKDD 6(4):15. https://doi.org/10.1145/2382577.2382579

---

**Fim do documento.** Nenhum código, decisão ou parâmetro foi alterado.
