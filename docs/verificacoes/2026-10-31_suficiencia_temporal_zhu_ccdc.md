# Verificação na fonte primária — Suficiência Amostral para Modelos Harmônicos Temporais (CCDC / OLS)

**Data:** 31 de outubro de 2026  
**Fonte primária:** Zhu, Z. (2013), tese de doutorado, Boston University, Cap. 4, p. 121 (lida no primário); Zhu & Woodcock (2014), RSE 144:152-171 — não conferida no primário.  
**Obra primária integral consultada e arquivada:** Zhu, Zhe (2013). *Continuous Change Detection and Classification of Land Cover Using All Available Landsat Data*. Ph.D. Dissertation, Department of Earth and Environment, Graduate School of Arts and Sciences, Boston University, 178 p. (Dissertação base contendo o desenvolvimento formal integral do algoritmo CCDC).  
**Arquivo arquivado:** `docs/verificacoes/fontes/zhu2013/zhu_2013_tese_ccdc.pdf`  
**SHA-256:** `4789edc19712c3bebf898002baf775c7fb07c628b76f58373f72897ee32ef173`  
**Script de extração:** `docs/verificacoes/fontes/zhu2013/extrair_zhu_2013.py`  
**Saída da extração:** `docs/verificacoes/fontes/zhu2013/saida_extracao_zhu_2013.txt`  
**Contexto:** Decisão D11, Decisão D05 e `src/lib/gee/harmonicos.ts:24,44` (`nMinimoObservacoes = 12`).

---

## 1. O que foi conferido, e está CONFIRMADO na fonte primária

### 1.1 Regra de Inicialização do Modelo Harmônico OLS: $N = 12$ observações limpas

No Capítulo 4 da dissertação (fundação textual de Zhu & Woodcock 2014), Seção 4.3.2 (*"CCDC Algorithm - Model Initialization"*), p. 121:

> *"Ideally, the more the parameters estimated, the more accurate the model will be. However, when there are too many parameters to estimate, it may start to fit to noise. To make the model robust to noise, the CCDC algorithm only uses two parameters to capture the intra-annual change. **Model initialization is started when the number of clear pixels is equal to 12** and there is no land cover change during model initialization."*

### 1.2 Relação entre Número de Parâmetros ($p$) e Observações Mínimas ($N$)

No Capítulo 3 (Seção 3.3.2, p. 76), para modelos de séries temporais de reflectância com componentes sazonais e de tendência:

> *"To estimate these 7 parameters, at least 7 clear observations are necessary in two years. To strengthen the robustness of the fitting, CMFDA only estimates a pixel **if the number of clear observation is more than one and a half times of the number of total parameters to be estimated, that is a total of 11 clear observations**."*

### 1.3 Consequência Matemática para o SAREL

O modelo harmônico ajustado pelo SAREL para as bandas B12 (SWIR) e B8 (NIR) estima tendência temporal decenal ($c_1$) e ciclos fenológicos:

$$\hat{\rho}(t) = c_0 + c_1 \cdot t + \sum_{i=1}^{k} \left[ a_i \cos\left(\frac{2\pi \cdot i \cdot t}{T}\right) + b_i \sin\left(\frac{2\pi \cdot i \cdot t}{T}\right) \right]$$

1. **Se $k = 1$ harmônico ($p = 4$ parâmetros: $c_0, c_1, a_1, b_1$):**
   - Com $N = 12$, a razão de amostragem é $N / p = 12 / 4 = 3{,}0$, resultando em **$df = 12 - 4 = 8$ graus de liberdade**.
   - Com $N = 6$, a razão é $6 / 4 = 1{,}5$, com $df = 2$ graus de liberdade.
2. **Se $k = 2$ harmônicos ($p = 6$ parâmetros: $c_0, c_1, a_1, b_1, a_2, b_2$ — publicado na Metodologia §3.4):**
   - Com $N = 12$, a razão de amostragem é $N / p = 12 / 6 = 2{,}0$, resultando em **$df = 12 - 6 = 6$ graus de liberdade**.
   - Com $N = 6$ (o piso literal de D11 anterior), a razão é $6 / 6 = 1{,}0$, resultando em **$df = 6 - 6 = 0$ graus de liberdade** (ajuste saturado, resíduos identicamente nulos, variância residual indefinida e colapso de significância estatística).

Portanto, a regra de Zhu & Woodcock (2014) de exigir **$N \ge 12$** protege o ajuste harmônico contra a saturação algébrica e o sobreajuste ao ruído em ambos os regimes ($p=4$ ou $p=6$).

---

## 2. Fronteira Declarada da Fonte (Regra R-L3)

- **O que a fonte SUSTENTA:**
  - O uso de regressão multivariada OLS harmônica temporal (senos, cossenos e tendência linear) para modelagem de séries temporais de reflectância de superfície.
  - O limiar de $N \ge 12$ observações limpas como requisito mínimo e robusto para inicialização e estabilidade do modelo harmônico.
- **O que a fonte NÃO SUSTENTA:**
  - Zhu & Woodcock (2014) **não** estabelece regras para proporção de solo exposto ($\hat{E} = n_{\text{SoloNu}} / n_{\text{Validas}}$).
  - Zhu & Woodcock (2014) **não** estabelece regras para percentis não paramétricos de cauda (`p10`/`p90`), governados por Hyndman & Fan (1996).
  - Zhu & Woodcock (2014) **não** impõe um número mínimo de 6 cenas para triagem geral de candidatos espectrais.

---

## 3. Divergência Documento versus Implementação

- **Metodologia Integrada (§3.4, `scripts/gerar_pdf_metodologia_integrada.py:540`):** publica modelo com 2 harmônicos ($p = 6$).
- **Código em Execução (`src/lib/gee/harmonicos.ts:45`):** utiliza default de 1 harmônico ($p = 4$, `usarDoisHarmonicos ?? false`), e nenhum chamador passa a opção `true`.
- **Compatibilidade com Zhu (2014):**
  - O piso $N = 12$ adotado em `harmonicos.ts:44` atende a ambos os regimes ($df = 8$ para $p=4$; $df = 6$ para $p=6$).
  - O piso anterior de D11 ($N = 6$) saturaria o modelo publicado na metodologia ($df = 0$).
