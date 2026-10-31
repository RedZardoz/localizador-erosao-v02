# Nota Técnica de Fonte Primária: Cochran (1977), Seção 5A.12 (Collapsed Strata)

**Data de Elaboração:** 31 de outubro de 2026  
**Identificador da Obra:** `cochran1977`  
**Referência Bibliográfica Completa:**  
Cochran, William Gemmell (1977). *Sampling Techniques*. 3ª edição. John Wiley & Sons: New York, Chichester, Brisbane, Toronto, Singapore. 428 p. ISBN: 0-471-16240-X.  
**Capítulo e Seção Analisados:** Capítulo 5A ("Further Aspects of Stratified Sampling"), Seção 5A.12 ("Estimation of Variance with One Unit per Stratum"), páginas 138–140.  
**Citação Cruzada Original:** Hansen, Morris H.; Hurwitz, William N.; Madow, William G. (1953). *Sample Survey Methods and Theory*. John Wiley & Sons. (Obra pioneira que formulou o estimador citado por Cochran).  
**Aplicação no Projeto SAREL:** Fundamentação amostral para tratamento de estratos biofísicos com carência ou déficit estrutural de unidades amostrais (Decisões D12, D16 e D23).

---

## 1. Contexto Teórico e Problema Amostral

Em amostragem aleatória estratificada, a estimação não enviesada da variância amostral dentro de cada estrato exige que pelo menos duas unidades primárias sejam sorteadas de forma independente dentro de cada estrato ($n_h \ge 2$ para todo $h \in \{1, \dots, L\}$). Se um estrato possuir $n_h = 1$ ou se o sorteio não puder sortear duas unidades independentes (por exemplo, em esquemas de estratificação fina para maximizar o ganho de precisão ou em células de baixa densidade populacional), os graus de liberdade dentro do estrato são nulos ($df = n_h - 1 = 0$), tornando algebricamente impossível calcular $s_h^2$ e estimar $V(\hat{Y})$ pela fórmula padrão:

$$V(\hat{Y}_{st}) = \sum_{h=1}^L N_h^2 \left(\frac{1}{n_h} - \frac{1}{N_h}\right) s_h^2$$

---

## 2. O Método dos Estratos Colapsados (*Collapsed Strata Method*)

Para viabilizar a estimação da variância sob $n_h = 1$ (ou tamanhos amostrais insuficientes), Cochran (§5A.12, p. 138–139) descreve o procedimento de **colapsar estratos adjacentes**:

1. **Agrupamento/Pareamento:** Os $L$ estratos (assumindo $L$ par para simplificação de notação) são agrupados dois a dois em $G = L/2$ pares ou macro-estratos compostos ($j = 1, 2, \dots, G$), reunindo estratos que sejam os mais semelhantes possíveis quanto à variável de interesse $Y$.
2. **Estimador de Variância Colapsada ($v_{cs}$):**  
   Para pares de estratos com tamanhos proporcionais, o estimador simplificado da variância é dado por:
   $$v_{cs} = \sum_{j=1}^{L/2} (y_{j1} - y_{j2})^2$$
   onde $y_{j1}$ e $y_{j2}$ são os valores das unidades sorteadas nos estratos 1 e 2 do $j$-ésimo par.

   No caso geral com pesos de estrato desiguais ($W_{j1} \ne W_{j2}$), onde $W_{jh} = N_{jh} / N$, Cochran apresenta o estimador ponderado:
   $$v_{cs} = \sum_{j=1}^{G} \frac{1}{W_{j1} + W_{j2}} \left[ W_{j1} \hat{Y}_{j1} - W_{j2} \hat{Y}_{j2} \right]^2$$

---

## 3. Valor Esperado e Demonstração do Viés Positivo

Uma propriedade matemática fundamental demonstrada por Cochran (§5A.12, p. 139, equação 5A.48) é que o estimador de variância colapsada **não é não-viesado**, mas sim **estritamente enviesado para cima (viés positivo)**:

$$E[v_{cs}] = V(\hat{Y}) + \sum_{j=1}^{G} (Y_{j1} - Y_{j2})^2$$

Como o termo $\sum_{j=1}^G (Y_{j1} - Y_{j2})^2 \ge 0$ é uma soma de quadrados das diferenças entre as verdadeiras médias populacionais dos estratos pareados:

$$E[v_{cs}] \ge V(\hat{Y})$$

### Consequências Inferiais Destacadas por Cochran:
1. **Conservadorismo Estatístico:** O estimador $v_{cs}$ superestima a verdadeira variância populacional. Intervalos de confiança baseados em $v_{cs}$ são conservadores (têm probabilidade de cobertura igual ou superior ao nível nominal $1 - \alpha$), impedindo afirmações espúrias de excesso de precisão.
2. **Critério de Agrupamento:** Para minimizar o viés positivo $\sum (Y_{j1} - Y_{j2})^2$, os estratos devem ser agrupados de modo a minimizar as discrepâncias entre suas médias esperadas (ou seja, agrupar estratos adjacentes ou fisiograficamente contíguos na paisagem).

---

## 4. Fronteira Epistemológica: O que a Fonte Sustenta e o que NÃO Sustenta (Regra R-L3)

### O que Cochran (1977, §5A.12) SUSTENTA:
- Sustenta formalmente o agrupamento de estratos adjacentes ou similares quando o desenho amostral enfrenta carência de unidades amostrais independentes por estrato.
- Sustenta que a fusão de estratos permite calcular estimativas válidas e conservadoras da variância amostral, eliminando células com graus de liberdade nulos.
- Sustenta o critério objetivo de parear estratos próximos na variável explicativa para controlar o viés da estimativa.

### O que Cochran (1977, §5A.12) NÃO SUSTENTA:
- **Não sustenta manipulação arbitrária pós-hoc de fatores para criar balanceamento artificial:** O colapso de estratos deve ser justificado pela estrutura da população ou por convenção amostral prévia, não como artifício para forçar um desenho balanceado onde a natureza é desbalanceada.
- **Não sustenta preservação da resolução fatorial:** Ao colapsar os estratos de um fator (por exemplo, colapsar os tercis de frequência de solo nu $\hat{E}$ dentro de $S_1 \times \hat{K}_2$), perde-se irreversivelmente a capacidade de testar o efeito principal de $\hat{E}$ ou suas interações de alta ordem naquele quadrante.
- **Não prescreve que o colapso seja obrigatório:** Apresenta o método como uma solução de compromisso inferencial, deixando claro que a melhor estratégia primária é desenhar estratos onde haja unidades reais suficientes.
