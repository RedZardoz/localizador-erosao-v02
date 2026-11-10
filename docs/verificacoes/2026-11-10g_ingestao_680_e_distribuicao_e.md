# Relatório de Ingestão de $\hat{E}$ (Solo Nu) e Caracterização da Distribuição — SAREL v2.0

**Data:** 10 de novembro de 2026  
**Contexto Metodológico:** Programa de Pós-Graduação em Tecnologias Limpas (PPGTCA 2026)  
**Projeto:** Modelagem e Quantificação de Erosão Laminar — Bacia do Paraná 3 (BP3)  
**Sessão:** 2026-11-10g (Execução do Prompt G)  
**Branch:** `correcoes/contencao-2026-11-02`  
**Protocolo Anti-Fabricação:** Saídas reais auditadas, logs de execução em `docs/verificacoes/execucao/2026-11-10g/` e commit escrito após o fato.

---

## 1. Resumo Executivo

Nesta sessão, foi realizada a ingestão empírica completa da dimensão $\hat{E}$ (frequência de solo nu sob a máscara GEOS3 de Demattê et al., 2018) para a totalidade dos **677 candidatos elegíveis** da Bacia Hidrográfica do Paraná 3 (BP3), conforme definido pelo pré-registro e pelo universo estrito com pedologia validada (`docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json`).

### Principais Indicadores
- **Universo Elegível Avaliado:** 677 candidatos (100% dos elegíveis com pedologia válida).
- **Candidatos com $\hat{E}$ Medido:** **677 de 677 (100,00%)**.
- **Candidatos Indisponíveis ao Final:** **0 (0,00%)**.
- **Custo Financeiro de API:** **R\$ 0,00 (Gratuito)** — O Google Earth Engine para fins de pesquisa científica acadêmica e conservação opera sob cotas não tarifadas dentro do projeto Google Cloud registrado (`imposing-muse-506616-i7`).
- **Tempo Total Efetivo de Processamento:** ~52 minutos (Rodada 1: 43,1 min; Recuperação 1: 8,7 min; Recuperação 2: 18,5 s).
- **Limiares Empíricos de Tercis Encontrados para $\hat{E}$:**
  - **$t_1$ (33,3%):** `0,0116` (1,16% de frequência de solo nu)
  - **$t_2$ (66,7%):** `0,0490` (4,90% de frequência de solo nu)
- **Status das 9 Células Críticas de $\hat{K}=2$ (D16):**
  - **7 células atendem ao piso de $\ge 4$ candidatos** (77,8%).
  - **2 células apresentam déficit:** $E_{1,2,2}$ tem 3 candidatos (déficit de 1); $E_{1,3,2}$ tem 0 candidatos (vazia, déficit de 4).
- **Preservação da Trava de Segurança D16:** O sorteio definitivo **NÃO FOI EXECUTADO**. A trava de segurança de `scripts/sortear_poligonos_d16.ts` permaneceu estritamente ativa.

---

## 2. Teste de Fumaça de Bloco (Tarefa 1)

Antes de disparar a ingestão dos 677 candidatos, realizou-se um teste empírico de calibração de bloco para mensurar a latência e a estabilidade das requisições síncronas ao endpoint REST do Google Earth Engine (`/v1/projects/.../image:computePixels` / `reduceRegions`).

### Comparativo Empírico
| Cenário / Configuração | Tamanho do Bloco | Timeout Configurado | Tempo de Resposta | Status HTTP | Taxa Média por Ponto |
|---|:---:|:---:|:---:|:---:|:---:|
| Teste Inicial (Prompt F) | 30 pontos | 60 s | > 60.000 ms | HTTP 0 (Timeout) | — |
| Ponto a Ponto (Prompt F) | 1 ponto | 60 s | ~1.500 ms | HTTP 200 | 1.500 ms/ponto |
| Teste de Fumaça A (Prompt G) | 25 pontos | 60 s | 60.010 ms | HTTP 0 (Timeout) | — |
| Teste de Fumaça B (Prompt G) | 25 pontos | 120 s | 113.832 ms | HTTP 200 | 4.553 ms/ponto |

### Justificativa e Decisão Metodológica
- **Tamanho Adotado:** Bloco de **25 pontos** para a rodada inicial, com redução dinâmica para **10 pontos** e **5 pontos** nas rodadas de recuperação.
- **Timeout Adotado:** **180.000 ms (180 s)**.
- **Fundamentação:** Uma requisição contendo 25 pontos dispersos espacialmente por mais de 100 km na BP3 sobre 10 anos de cenas do Sentinel-2 exige entre 14 e 173 segundos de processamento analítico no cluster do Earth Engine. O timeout de 180s garantiu margem de segurança contra flutuações de rede e latência de redução.
- **Evidência arquivada em:** `docs/verificacoes/execucao/2026-11-10g/escolha_bloco.txt`.

---

## 3. Balanço Geral da Ingestão dos 677 Pontos (Tarefa 2)

A ingestão operou em regime incremental estrito com gravação atômica a cada bloco concluído no cache (`docs/verificacoes/cache_frequencia_solo_nu_bp3.json`). Apenas candidatos com medição válida foram persistidos, preservando o princípio *fail-closed* (timeouts jamais geram imputação de 0).

### Cronologia dos Passes
1. **Cache Herdado da Calibração:** 29 pontos válidos herdados do commit `8d6bd48`. Restavam 648 pontos pendentes.
2. **Rodada 1 (Blocos de 25 pontos, timeout de 180s):**
   - 26 blocos processados (25 blocos de 25 pontos e 1 de 23 pontos).
   - 20 blocos com sucesso (HTTP 200) e 6 blocos com timeout (HTTP 0 nos blocos 2, 3, 7, 19, 20 e 24).
   - Acréscimo: +498 pontos medidos com sucesso. Total acumulado: 527 medidos (77,84%), 150 pendentes.
3. **Passe de Recuperação 1 (Blocos de 10 pontos, timeout de 180s):**
   - 15 blocos processados sobre os 150 pontos residuais.
   - 14 blocos com sucesso (HTTP 200) e 1 bloco com timeout (HTTP 0 no bloco 6/15).
   - Acréscimo: +140 pontos medidos com sucesso. Total acumulado: 667 medidos (98,52%), 10 pendentes.
4. **Passe de Recuperação 2 (Blocos de 5 pontos, timeout de 180s):**
   - 2 blocos processados sobre os 10 pontos residuais.
   - 2 blocos com sucesso imediato (HTTP 200 em 13,1s e 5,3s).
   - Acréscimo: +10 pontos medidos. Total acumulado: **677 de 677 medidos (100,00%)**.

### Tabela Sintética do Balanço
| Etapa de Processamento | Pontos Submetidos | Pontos com Sucesso | Timeouts (HTTP 0) | Saldo Medido no Cache | % do Universo |
|---|:---:|:---:|:---:|:---:|:---:|
| Herança da Calibração | 30 | 29 | 1 | 29 | 4,28% |
| Rodada 1 (Bloco 25) | 648 | 498 | 150 | 527 | 77,84% |
| Recuperação 1 (Bloco 10) | 150 | 140 | 10 | 667 | 98,52% |
| Recuperação 2 (Bloco 5) | 10 | 10 | 0 | **677** | **100,00%** |

---

## 4. Caracterização Estatística Detalhada de $\hat{E}$ (Tarefa 3)

Com a totalidade dos 677 candidatos mensurados empiricamente, executou-se a caracterização da distribuição através do script `scripts/auditoria/caracterizar_distribuicao_e.mjs`.

### 4.1 Quantis da Distribuição
- **Mínimo ($p_0$):** `0,0000`
- **Percentil 10 ($p_{10}$):** `0,0000`
- **Tercil 1 ($t_1$, 33,3%):** `0,0116` (1,16% de exposição)
- **Mediana ($p_{50}$):** `0,0330` (3,30% de exposição)
- **Tercil 2 ($t_2$, 66,7%):** `0,0490` (4,90% de exposição)
- **Percentil 90 ($p_{90}$):** `0,0942` (9,42% de exposição)
- **Máximo ($p_{100}$):** `0,5520` (55,20% de exposição)

### 4.2 Massa em Zero
- **Contagem de pontos com $\hat{E} = 0,0000$:** 181 pontos de 677.
- **Proporção observada:** **26,74%** (`0,2674`).
- **Intervalo de Confiança de Wilson a 95%:** **[23,54% ; 30,19%]** (em proporção absoluta: `[0,2354 ; 0,3019]`).
- **Relevância Metodológica:** A proporção de massa em zero situa-se estritamente abaixo do limiar do primeiro tercil (26,74% < 33,33%). Consequentemente, a função de particionamento empírico por tercis não colapsa $t_1$ em zero ($t_1 = 0,0116 > 0$).

### 4.3 Empates e Valores Distintos
- **Valores numéricos distintos observados:** 372 valores distintos entre os 677 pontos.
- **Maior grupo de valores idênticos:** 181 pontos com $\hat{E} = 0,0000$ (26,74%).
- **Empates nos limiares:**
  - Empates exatos em $t_1$ (`0,0116`): 3 pontos.
  - Empates exatos em $t_2$ (`0,0490`): 2 pontos.

### 4.4 Precisão e Erro-Padrão Binomial por Ponto
Para cada candidato, o erro-padrão amostral foi computado pela fórmula binomial analítica:
$$SE = \sqrt{\frac{p(1 - p)}{n}}$$
onde $p$ é a frequência estimada de solo nu $\hat{E}$ e $n$ é o número de observações válidas sob máscara GEOS3.
- **$SE$ Mediana:** `0,00870` (0,87%)
- **$SE$ Percentil 90:** `0,01700` (1,70%)
- **$SE$ Máximo:** `0,03167` (3,17%)
- **Largura do Tercil Central ($t_2 - t_1$):** $0,0490 - 0,0116 = 0,0374$ (3,74%).
- **Razão entre $SE$ Mediana e a Largura do Tercil Central:** $\frac{0,00870}{0,0374} = \mathbf{23,26\%}$.
- **Interpretação:** A incerteza de medição individual (~0,87%) é substancialmente menor que a amplitude da faixa central do tercil (~3,74%), o que confere estabilidade estatística à classificação do tercil.

### 4.5 Histograma ASCII da Frequência de Solo Nu (Passo de 0,01)
```text
  [0.00 - 0.01[:  221 ( 32.6%) ██████████████████████████████████████████████████
  [0.01 - 0.02[:   34 (  5.0%) ████████
  [0.02 - 0.03[:   62 (  9.2%) ██████████████
  [0.03 - 0.04[:   71 ( 10.5%) ████████████████
  [0.04 - 0.05[:   71 ( 10.5%) ████████████████
  [0.05 - 0.06[:   36 (  5.3%) ████████
  [0.06 - 0.07[:   40 (  5.9%) █████████
  [0.07 - 0.08[:   43 (  6.4%) ██████████
  [0.08 - 0.09[:   21 (  3.1%) █████
  [0.09 - 0.10[:   20 (  3.0%) █████
  [0.10 - 0.11[:   11 (  1.6%) ██
  [0.11 - 0.12[:   10 (  1.5%) ██
  [0.12 - 0.13[:    4 (  0.6%) █
  [0.13 - 0.14[:    9 (  1.3%) ██
  [0.14 - 0.15[:    2 (  0.3%) 
  [0.15 - 0.16[:    5 (  0.7%) █
  [0.16 - 0.17[:    2 (  0.3%) 
  [0.17 - 0.18[:    2 (  0.3%) 
  [0.18 - 0.19[:    3 (  0.4%) █
  [0.20 - 0.21[:    1 (  0.1%) 
  [0.21 - 0.22[:    1 (  0.1%) 
  [0.22 - 0.23[:    1 (  0.1%) 
  [0.24 - 0.25[:    1 (  0.1%) 
  [0.26 - 0.27[:    3 (  0.4%) █
  [0.37 - 0.38[:    1 (  0.1%) 
  [0.54 - 0.55[:    1 (  0.1%) 
  [0.55 - 0.56[:    1 (  0.1%) 
```

### 4.6 Alocação Observada nos Tercis Empíricos
O particionamento pela função canônica `calcularLimiaresTercis` com os limiares $t_1 = 0,0116$ e $t_2 = 0,0490$ resultou na seguinte distribuição (alvo teórico ideal: 225,67 candidatos por tercil):
- **Tercil 1 ($\hat{E} \le 0,0116$):** **226 candidatos (33,38%)** [Desvio: $+0,3$ candidato]
- **Tercil 2 ($0,0116 < \hat{E} \le 0,0490$):** **227 candidatos (33,53%)** [Desvio: $+1,3$ candidato]
- **Tercil 3 ($\hat{E} > 0,0490$):** **224 candidatos (33,09%)** [Desvio: $-1,7$ candidato]

Aderência notável: o desvio máximo em relação à equipartição teórica é de menos de 2 candidatos.

---

## 5. Janela Temporal Real do Sentinel-2 na BP3 (Tarefa 5)

Em cumprimento estrito às exigências da Tarefa 5:

1. **Parâmetros Solicitados no Código:** O script `amostragemSoloNuLote.ts` parametrizou a janela de busca entre `2016-01-01` e `2026-06-30`.
2. **Disponibilidade Efetiva na Coleção `COPERNICUS/S2_SR_HARMONIZED`:**
   - A coleção Sentinel-2 MSI Level-2A (Refletância de Superfície Harmonizada) no catálogo global do Google Earth Engine possui disponibilidade operacional documentada a partir de **2017-03-28T00:00:00Z**.
   - No período entre `2016-01-01` e `2017-03-27`, **não existem produtos Level-2A disponíveis nesta coleção**. O processamento operacional de refletância de superfície pela ESA foi lançado no início de 2017 sobre a Europa e expandido globalmente (incluindo o Brasil) em dezembro de 2018, com reprocessamentos sistemáticos posteriores cobrindo a partir de março de 2017.
   - Portanto, a série temporal efetivamente integrada no GEE inicia-se na primeira cena Sentinel-2 L2A disponível sobre a órbita da BP3 em 2017 e estende-se até a data presente.
3. **Comportamento do Endpoint REST:**
   - O endpoint REST do GEE retorna a redução temporal agregada via `ee.Reducer.mean()` (proporção de solo nu) e `ee.Reducer.count()` (número de observações sob a conjunção de máscaras). A data exata da primeira e da última cena individual válida por ponto **não é exposta pela API nesta modalidade de agregação em lote**.
   - Em observância ao protocolo anti-fabricação, **não são inferidas nem fabricadas datas pontuais fictícias**.
   - A robustez amostral é confirmada pelo volume de observações sob a máscara GEOS3: **mínimo de 148 observações**, **mediana de 477 observações** e **máximo de 1.011 observações** por ponto ao longo do período.

---

## 6. Tabulação Cruzada dos 18 Estratos Tridimensionais ($\hat{S} \times \hat{E} \times \hat{K}$) e Avaliação de $\hat{K}=2$ (Tarefa 4)

Com a integração das três dimensões para os 677 candidatos aptos:
- **Dimensão $\hat{S}$ (Declividade % do Copernicus DEM 30m):**
  - Limiares empíricos de tercis: $t_1 = 5,12\%$, $t_2 = 8,46\%$.
  - Classes: $S_1$ ($\le 5,12\%$), $S_2$ ($5,12\%$ a $8,46\%$), $S_3$ ($> 8,46\%$).
- **Dimensão $\hat{E}$ (Frequência de Solo Nu GEOS3 Sentinel-2):**
  - Limiares empíricos de tercis: $t_1 = 0,0116$, $t_2 = 0,0490$.
  - Classes: $E_1$ ($\le 0,0116$), $E_2$ ($0,0116$ a $0,0490$), $E_3$ ($> 0,0490$).
- **Dimensão $\hat{K}$ (Erodibilidade Pedológica Embrapa 2024):**
  - Classes: $K_1$ (Baixa/Média erodibilidade), $K_2$ (Alta/Muito Alta erodibilidade — foco do sorteio D16).

### 6.1 Tabela Completa dos 18 Estratos Tridimensionais
| Estrato | Terreno ($\hat{S}$) | Solo Nu ($\hat{E}$) | Erodibilidade ($\hat{K}$) | Candidatos Aptos |
|:---:|:---:|:---:|:---:|:---:|
| **$E_{1,1,1}$** | Baixa ($\le 5,1\%$) | Baixa ($\le 0,0116$) | $K_1$ (Baixa/Média) | 41 |
| **$E_{1,1,2}$** | Baixa ($\le 5,1\%$) | Baixa ($\le 0,0116$) | $K_2$ (Alta/M.Alta) | **6** |
| **$E_{1,2,1}$** | Baixa ($\le 5,1\%$) | Média ($0,0116$ a $0,0490$) | $K_1$ (Baixa/Média) | 86 |
| **$E_{1,2,2}$** | Baixa ($\le 5,1\%$) | Média ($0,0116$ a $0,0490$) | $K_2$ (Alta/M.Alta) | **3** |
| **$E_{1,3,1}$** | Baixa ($\le 5,1\%$) | Alta ($> 0,0490$) | $K_1$ (Baixa/Média) | 91 |
| **$E_{1,3,2}$** | Baixa ($\le 5,1\%$) | Alta ($> 0,0490$) | $K_2$ (Alta/M.Alta) | **0** |
| **$E_{2,1,1}$** | Média ($5,1\%$ a $8,5\%$) | Baixa ($\le 0,0116$) | $K_1$ (Baixa/Média) | 43 |
| **$E_{2,1,2}$** | Média ($5,1\%$ a $8,5\%$) | Baixa ($\le 0,0116$) | $K_2$ (Alta/M.Alta) | **6** |
| **$E_{2,2,1}$** | Média ($5,1\%$ a $8,5\%$) | Média ($0,0116$ a $0,0490$) | $K_1$ (Baixa/Média) | 80 |
| **$E_{2,2,2}$** | Média ($5,1\%$ a $8,5\%$) | Média ($0,0116$ a $0,0490$) | $K_2$ (Alta/M.Alta) | **4** |
| **$E_{2,3,1}$** | Média ($5,1\%$ a $8,5\%$) | Alta ($> 0,0490$) | $K_1$ (Baixa/Média) | 88 |
| **$E_{2,3,2}$** | Média ($5,1\%$ a $8,5\%$) | Alta ($> 0,0490$) | $K_2$ (Alta/M.Alta) | **4** |
| **$E_{3,1,1}$** | Alta ($> 8,5\%$) | Baixa ($\le 0,0116$) | $K_1$ (Baixa/Média) | 79 |
| **$E_{3,1,2}$** | Alta ($> 8,5\%$) | Baixa ($\le 0,0116$) | $K_2$ (Alta/M.Alta) | **51** |
| **$E_{3,2,1}$** | Alta ($> 8,5\%$) | Média ($0,0116$ a $0,0490$) | $K_1$ (Baixa/Média) | 50 |
| **$E_{3,2,2}$** | Alta ($> 8,5\%$) | Média ($0,0116$ a $0,0490$) | $K_2$ (Alta/M.Alta) | **4** |
| **$E_{3,3,1}$** | Alta ($> 8,5\%$) | Alta ($> 0,0490$) | $K_1$ (Baixa/Média) | 35 |
| **$E_{3,3,2}$** | Alta ($> 8,5\%$) | Alta ($> 0,0490$) | $K_2$ (Alta/M.Alta) | **6** |
| **Total** | — | — | — | **677** |

---

### 6.2 Análise das 9 Células Críticas de $\hat{K}=2$ frente ao Piso de D16 ($\ge 4$ Candidatos)
O pré-registro e a Decisão D16 exigem formalmente um piso mínimo de **4 candidatos por célula** para permitir a alocação de 2 titulares e 2 reservas por célula ($9 \times 4 = 36$ alvos).

| Célula de $\hat{K}=2$ | Terreno ($\hat{S}$) | Solo Nu ($\hat{E}$) | Candidatos Encontrados | Status D16 | Déficit |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **$E_{1,1,2}$** | $S_1$ (Baixa) | $E_1$ (Baixa) | 6 | **OK** ($\ge 4$) | 0 |
| **$E_{1,2,2}$** | $S_1$ (Baixa) | $E_2$ (Média) | 3 | **DEFICIT** ($3 < 4$) | **-1** |
| **$E_{1,3,2}$** | $S_1$ (Baixa) | $E_3$ (Alta) | 0 | **DEFICIT** ($0 < 4$) | **-4** (Célula Vazia) |
| **$E_{2,1,2}$** | $S_2$ (Média) | $E_1$ (Baixa) | 6 | **OK** ($\ge 4$) | 0 |
| **$E_{2,2,2}$** | $S_2$ (Média) | $E_2$ (Média) | 4 | **OK** ($\ge 4$) | 0 |
| **$E_{2,3,2}$** | $S_2$ (Média) | $E_3$ (Alta) | 4 | **OK** ($\ge 4$) | 0 |
| **$E_{3,1,2}$** | $S_3$ (Alta) | $E_1$ (Baixa) | 51 | **OK** ($\ge 4$) | 0 |
| **$E_{3,2,2}$** | $S_3$ (Alta) | $E_2$ (Média) | 4 | **OK** ($\ge 4$) | 0 |
| **$E_{3,3,2}$** | $S_3$ (Alta) | $E_3$ (Alta) | 6 | **OK** ($\ge 4$) | 0 |

### Diagnóstico Pedológico e Geomorfológico do Déficit
1. **7 de 9 células (77,8%)** atendem plenamente ao requisito de $\ge 4$ candidatos.
2. **Apenas 2 células apresentam déficit**, ambas situadas no relevo plano/suave-ondulado ($S_1$, declividade $\le 5,12\%$):
   - $E_{1,2,2}$: possui 3 candidatos (necessita de 4 para 2 titulares + 2 reservas).
   - $E_{1,3,2}$: possui **0 candidatos** (célula estritamente vazia no universo amostral da BP3).
3. **Explicação física e de uso da terra:**
   - Na Bacia do Paraná 3, as áreas com solos de alta e muito alta erodibilidade ($K=2$, principalmente Neossolos Regolíticos/Litólicos e Argissolos Vermelho-Amarelos distróficos) coincidem primariamente com terrenos mais dissecados e íngremes ($S_3$, onde há 51 candidatos em $E_{3,1,2}$).
   - Onde o relevo é plano a suave-ondulado ($S_1$), predominam quase que com exclusividade os Latossolos Vermelhos e Nitossolos Vermelhos (de erodibilidade $K_1$, baixa a média), os quais sustentam a agricultura de grãos intensiva da região (observa-se que o estrato $E_{1,3,1}$ correspondente tem nada menos que 91 candidatos!).
   - Por outro lado, manchas de solos altamente erodíveis em relevo plano ($S_1$) são raras na bacia e, quando ocorrem, tendem a estar sob pastagem perene ou vegetação que impede alta frequência de exposição de solo nu ($E_3$). Portanto, a ausência de candidatos em $E_{1,3,2}$ é um reflexo fiel da realidade pedogeomorfológica da bacia, e não uma falha do pipeline.

### Confirmação da Trava de Segurança
Conforme estipulado no protocolo:
- O sorteio **NÃO FOI EXECUTADO**.
- A trava de pré-registro de `scripts/sortear_poligonos_d16.ts` permanece intacta.

---

## 7. Verificação da Guarda de D11.2 ($n < 12$)

A Decisão D11.2 impõe que nenhum ponto com menos de 12 observações válidas sob a máscara de solo nu pode ser utilizado para cálculo estatístico ou estratificação.
- **Total de candidatos elegíveis verificados:** 677.
- **Menor número de observações encontrado:** 148 observações.
- **Mediana de observações:** 477 observações.
- **Maior número de observações encontrado:** 1.011 observações.
- **Pontos violando a guarda ($n < 12$):** **ZERO (0 pontos de 677)**.
- **Conclusão:** 100% dos candidatos ultrapassam a exigência mínima com folga amostral de mais de uma ordem de grandeza.

---

## 8. Decisões Recomendadas para Deliberação na Próxima Sessão

Com os dados empíricos reais e a tabulação dos 18 estratos tridimensionais concluídos, a banca e a coordenação da pesquisa têm à disposição um panorama objetivo para deliberar sobre como tratar o desenho experimental frente às células deficientes de $K_2$:

### Opções Metodológicas para Deliberação:
1. **Opção 1 — Alocação Proporcional / Aceite de Tamanho Efetivo Reduzido:**
   - Sortear os alvos nas 7 células completas ($7 \times 4 = 28$ alvos: 14 titulares, 14 reservas).
   - Na célula $E_{1,2,2}$, alocar os 3 candidatos disponíveis (ex.: 2 titulares e 1 reserva, ou 1 titular e 2 reservas).
   - Aceitar a célula $E_{1,3,2}$ como estruturalmente vazia ($n=0$), documentando a justificativa pedogeomorfológica (ausência física de solos $K=2$ com alto solo nu em relevo plano na BP3).
   - Tamanho amostral de $K_2$: 31 alvos no total (ou 15/16 titulares).
2. **Opção 2 — Colapso Parcial de Níveis de $\hat{E}$ para $S_1$ em $K_2$:**
   - Em $S_1 \times K_2$, juntar as classes $E_2$ e $E_3$ (ou seja, $\hat{E} > 0,0116$), totalizando 3 candidatos, ou colapsar todos os candidatos de $S_1 \times K_2$ (6 de $E_1$ + 3 de $E_2$ = 9 candidatos), sorteando a cota necessária a partir do pool agregado de baixa declividade.
3. **Opção 3 — Redefinição dos Limiares de Tercis (Específica para $K_2$):**
   - Em vez de usar limiares globais da bacia ($t_1=0,0116$, $t_2=0,0490$), calcular os tercis de $\hat{E}$ condicionados exclusivamente ao subconjunto de candidatos com $K=2$. (Nota: requer emenda formal ao pré-registro).

A escolha entre essas abordagens compete à coordenação do mestrado antes de qualquer modificação em `scripts/sortear_poligonos_d16.ts`.

---

## 9. Inventário de Artefatos Produzidos

Os seguintes artefatos foram gerados e verificados nesta sessão:

1. **Evidências de Execução em `docs/verificacoes/execucao/2026-11-10g/`:**
   - `confirmacao_credencial.txt`: Validação da Service Account GEE fora do Git.
   - `bloco_25_teste_fumaca.txt`: Saída do teste de fumaça de 25 pontos.
   - `teste_bloco_25.json`: JSON estruturado do teste de fumaça.
   - `escolha_bloco.txt`: Documentação técnica da escolha de parâmetros.
   - `ingestao_677_rodada1.txt` e `diario_ingestao_677_rodada1.json`: Diário da Rodada 1.
   - `ingestao_677_recuperacao1.txt` e `diario_ingestao_677_recuperacao1.json`: Diário do Passe 1 de recuperação.
   - `ingestao_677_recuperacao2.txt` e `diario_ingestao_677_recuperacao2.json`: Diário do Passe 2 de recuperação.
   - `caracterizacao_distribuicao_e.txt`: Saída completa da caracterização estatística.
   - `ocupacao_estratos_d16.txt`: Saída completa da tabulação dos 18 estratos.
   - `janela_temporal_real.txt`: Parecer técnico sobre a janela temporal do Sentinel-2 L2A.
   - `tsc_noemit.txt`: Saída da compilação estrita do TypeScript.
   - `npm_test.txt`: Saída completa da suíte de 108 arquivos de teste do Vitest.
   - `estado_verificar.txt`: Saída do verificador de sincronia de `ESTADO.md`.
   - `git_status.txt`: Snapshot do estado do git.
   - `git_log.txt`: Snapshot dos últimos commits.
2. **Dados e Caches Atualizados:**
   - `docs/verificacoes/cache_frequencia_solo_nu_bp3.json`: Cache expandido para 677 candidatos.
   - `docs/verificacoes/ingestao_677_solo_nu.json`: Artefato de consolidação da rodada final.
3. **Scripts de Auditoria e Governança:**
   - `scripts/auditoria/caracterizar_distribuicao_e.mjs`: Auditoria da distribuição de $\hat{E}$.
   - `scripts/auditoria/tabular_ocupacao_estratos_d16.mjs`: Auditoria da ocupação dos 18 estratos.
4. **Relatório Oficial:**
   - `docs/verificacoes/2026-11-10g_ingestao_680_e_distribuicao_e.md` (este documento).
