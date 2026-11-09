# Inventário e Classificação da Seleção Bibliográfica — Projeto SAREL

**Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA - 2026)**  
**Pesquisa de Mestrado:** Validação e Predição de Erosão Laminar usando Sensoriamento Remoto e XGBoost  
**Data de Organização e Atualização:** 22 de Setembro de 2026  

---

## 1. Escopo e Critérios Científicos de Classificação

O objetivo central da pesquisa consiste em **validar ou não a localização e predição de erosão laminar utilizando sensoriamento remoto e algoritmos de gradiente impulsionado (XGBoost)**. Com base nisso, o acervo foi analisado integralmente e categorizado em dois subdiretórios principais:

1. **Pesquisas Diretamente Relacionadas (34 artigos):**
   - Focam na predição, modelagem preditiva ou mapeamento de suscetibilidade à erosão do solo (laminar, entressulcos, ravinas ou perda de solo) através de **Machine Learning** (com destaque para **XGBoost, Gradient Boosting, Random Forest e ensembles baseados em árvores**) integrados a dados de **Sensoriamento Remoto** (Sentinel-2, Landsat, PlanetScope, índices espectrais), variáveis topográficas/geoespaciais e **fundamentações conceituais e metodológicas seminais** (resolução espacial vs. proxies, GEOS3, guarda temporal contra data leakage, Spatial Cross-Validation e modelo dinâmico G2).

2. **Pesquisas Relacionadas (53 artigos):**
   - Abrangem a base empírica e metodológica de apoio ao SAREL: estudos regionais de erosão laminar no Paraná e no Brasil, modelagem empírica via RUSLE/USLE (Fator C, Fator R, Fator K, Fator LS), e abordagens correlatas de Inteligência Artificial / Visão Computacional (redes neurais convolucionais, deep learning, fusão de radar Sentinel-1 SAR com óptico Sentinel-2).

3. **Restantes (13 itens):**
   - Arquivos não relacionados diretamente ao tema (modelos de linguagem / LLMs agrícolas, seguro agrícola, previsão de queimadas), livros volumosos de introdução a bacias hidrográficas, notas técnicas internas em `.docx`/`.pptx` e gravações de tela em `.mkv` (mantidos fora do repositório analítico).

4. **Lote em Triagem e Revisão — `Para Revisar/` (22 itens):**
   - Inserido em 20 de outubro de 2026 a partir da triagem automatizada do log diário de buscas (*FLOW*) e consolidado no relatório *Auditoria e Curadoria Bibliográfica: Projeto SAREL*. Inclui teses e dissertações da UTFPR Medianeira (PPGTCA), UNIOESTE (Bacia do Paraná 3), UNESP e IFs, além de artigos focados em predição de erosão laminar com IA, Fator LS e agricultura de precisão. Mantidos em disco local conforme o padrão do repositório, com integridade auditada por SHA-256 em `docs/bibliografia/Para Revisar/README.md`.

---

## 2. Pesquisas Diretamente Relacionadas (34 Artigos)

| Nº | Arquivo | Origem Prévia | Metodologia / Algoritmo | Relevância para o SAREL |
|---|---|---|---|---|
| 1 | **10452-29467-1-PB.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 2 | **agronomy-16-00294-v2.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 3 | **Análise espaço_temporal da degradação usando aprendizado de máquina e técnicas geoespaciais..pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 4 | **Avaliação da degradação do solo utilizando computação flexível baseada em SIG e algoritmos avançados de aprendizado de máquina.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 5 | **CNPS-DOC-246-2024.pdf** | `docs/03 - Bibliografia - Artigos/CNPS-DOC-246-2024.pdf` | Pedologia / Erodibilidade / Fator K da USLE / Mannigel et al. (2002) | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 6 | **Comparative-evaluation-of.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 7 | **Comparison of machine learning models for gully erosion susceptibility mapping.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 8 | **Deteccao-de-feicoes-erosivas-em-bacias-hidrograficas-2025.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 9 | **Enhancing predictive modeling of interrill and rill erosion susceptibility.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 10 | **galoa-proceedings-sbsr-2025-aplicacoes-de-aprendizado-de-maquina-para-modelagem-e-mapeamento.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 11 | **Integrated machine learning and geospatial analysis enhanced gully erosion susceptibility modeling in the Erer watershed in East - Semantic Scholar.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 12 | **Integração de dados geoespaciais de alta precisão e abordagens de aprendizado de máquina.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 13 | **jh0260072.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 14 | **jwc2025603.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 15 | **Karydas_Panagos_2018_The_G2_erosion_model_month_time_step_assessments.pdf** | `Europe PMC / Environmental Research 161 (2018) 115-124 (PMC5773245)` | Modelo Dinâmico G2 / Interação Chuva-Cobertura / Sensoriamento Remoto / JRC | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 16 | **Kaufman_2012_EmbrapaSoja_Fundamentacao_Guarda_Temporal_Data_Leakage.pdf** | `Compilação formal metodológica (ACM TKDD 2012 & Embrapa Soja)` | Machine Learning / Data Leakage / Particionamento Temporal / Rotação Bienal | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 17 | **land-13-01665-v2.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 18 | **land-14-00163-v3.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 19 | **Machine Learning Models for the Spatial Prediction of Gully Erosion Susceptibility in the Piraí Drainage Basin Paraíba Do Sul Middle Valley Southeast Brazil.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 20 | **Mapeamento da suscetibilidade à erosão regressiva.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 21 | **Mapping Soil Erosion Classes using Remote Sensing Data and Ensemble Models.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 22 | **Prediction of gully erosion susceptibility mapping using novel ensemble machine learning algorithms - OPUS at UTS.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 23 | **Prediction of gully erosion susceptibility mapping using novel ensemble machine learning algorithms.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 24 | **PREVISÃO DE CLASSES DE EROSÃO LAMINAR USANDO.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 25 | **Roberts_2017_Cross_validation_strategies_spatial_temporal_structure.pdf** | `Download da base Ecography (CORE repository)` | Spatial Cross-Validation / Block CV / Autocorrelação Espacial / Métricas Não Viesadas | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 26 | **Safanelli_Dematte_2021_Fine_scale_soil_mapping_EO_data_GEOS3.pdf** | `Download da Revista Brasileira de Ciência do Solo (RBCS / GeoCiS ESALQ-USP)` | GEOS3 / Mineração Espectral / Google Earth Engine / Limiar NDVI Solo Nu | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 27 | **SILVA_2025MODELAGEM_PREDITIVA_NA_SUSCETIBILIDADE_.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 28 | **Soil erosion analysis based on machine learning method - Bulletin of Electrical Engineering and Informatics.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 29 | **sustainability-15-01939-v2.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 30 | **The_Spatiotemporal_Evolution_Driving_Mechanisms_an.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 31 | **Tree-based machine learning algorithms for soil erosion vulnerability prediction in Saddang Watershed-south Sulawesi-Indonesia _ Journal of Water and Clima Fixed.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 32 | **Utilizing Machine Learning Algorithms for the Development of Gully Erosion Susceptibility Maps - Semantic Scholar.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 33 | **Vrieling_2006_Satellite_remote_sensing_water_erosion_review.pdf** | `Download da base Catena (Elsevier / Wageningen University)` | Sensoriamento Remoto Orbital / Proxies Espectrais / Limitações de Resolução Espacial | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |
| 34 | **water-18-02255.pdf** | `-` | Machine Learning / Ensemble / XGBoost / SR | Suporte direto à modelagem preditiva, validação de erosão com ML e fundamentação metodológica central |

### Detalhamento dos Artigos Diretamente Relacionados

#### 1. 10452-29467-1-PB.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/10452-29467-1-PB.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 2. agronomy-16-00294-v2.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/agronomy-16-00294-v2.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 3. Análise espaço_temporal da degradação usando aprendizado de máquina e técnicas geoespaciais..pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Análise espaço_temporal da degradação usando aprendizado de máquina e técnicas geoespaciais..pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 4. Avaliação da degradação do solo utilizando computação flexível baseada em SIG e algoritmos avançados de aprendizado de máquina.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Avaliação da degradação do solo utilizando computação flexível baseada em SIG e algoritmos avançados de aprendizado de máquina.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 5. CNPS-DOC-246-2024.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/CNPS-DOC-246-2024.pdf`
- **Local de Origem / Fonte:** `docs/03 - Bibliografia - Artigos/CNPS-DOC-246-2024.pdf`
- **Extensão/Páginas:** 40 páginas
- **Metodologia Principal:** Pedologia / Erodibilidade / Fator K da USLE / Mannigel et al. (2002)
- **Justificativa de Enquadramento:** Documento oficial definitivo da Embrapa Solos (Doc. 246/2024). Na Tabela 5 (páginas 13 a 15) estabelece a tabela oficial de conversão de classes qualitativas de erodibilidade para valores numéricos do Fator K da USLE (baseada em Mannigel et al., 2002 e IBGE, 2018). Fundamental para a seleção e ponderação pedológica amostral do SAREL.

#### 6. Comparative-evaluation-of.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Comparative-evaluation-of.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 7. Comparison of machine learning models for gully erosion susceptibility mapping.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Comparison of machine learning models for gully erosion susceptibility mapping.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 8. Deteccao-de-feicoes-erosivas-em-bacias-hidrograficas-2025.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Deteccao-de-feicoes-erosivas-em-bacias-hidrograficas-2025.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 9. Enhancing predictive modeling of interrill and rill erosion susceptibility.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Enhancing predictive modeling of interrill and rill erosion susceptibility.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 10. galoa-proceedings-sbsr-2025-aplicacoes-de-aprendizado-de-maquina-para-modelagem-e-mapeamento.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/galoa-proceedings-sbsr-2025-aplicacoes-de-aprendizado-de-maquina-para-modelagem-e-mapeamento.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 11. Integrated machine learning and geospatial analysis enhanced gully erosion susceptibility modeling in the Erer watershed in East - Semantic Scholar.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Integrated machine learning and geospatial analysis enhanced gully erosion susceptibility modeling in the Erer watershed in East - Semantic Scholar.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 12. Integração de dados geoespaciais de alta precisão e abordagens de aprendizado de máquina.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Integração de dados geoespaciais de alta precisão e abordagens de aprendizado de máquina.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 13. jh0260072.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/jh0260072.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 14. jwc2025603.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/jwc2025603.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 15. Karydas_Panagos_2018_The_G2_erosion_model_month_time_step_assessments.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Karydas_Panagos_2018_The_G2_erosion_model_month_time_step_assessments.pdf`
- **Local de Origem / Fonte:** `Europe PMC / Environmental Research 161 (2018) 115-124 (PMC5773245)`
- **Extensão/Páginas:** 12 páginas
- **Metodologia Principal:** Modelo Dinâmico G2 / Interação Chuva-Cobertura / Sensoriamento Remoto / JRC
- **Justificativa de Enquadramento:** Artigo de Christos Karydas e Panos Panagos que apresenta formalmente o modelo dinâmico de erosão G2. Fornece a base física e matemática para a feature de interação do SAREL (erosividade da chuva torrencial multiplicada pela vulnerabilidade de cobertura vegetal / solo exposto: R_t * (1 - C_t)), permitindo que o XGBoost aprenda a dinâmica física real do splash laminar.

#### 16. Kaufman_2012_EmbrapaSoja_Fundamentacao_Guarda_Temporal_Data_Leakage.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Kaufman_2012_EmbrapaSoja_Fundamentacao_Guarda_Temporal_Data_Leakage.pdf`
- **Local de Origem / Fonte:** `Compilação formal metodológica (ACM TKDD 2012 & Embrapa Soja)`
- **Extensão/Páginas:** 1 páginas
- **Metodologia Principal:** Machine Learning / Data Leakage / Particionamento Temporal / Rotação Bienal
- **Justificativa de Enquadramento:** Documenta a fundamentação metodológica da janela de guarda temporal de 2 anos adotada no SAREL. Integra a teoria de prevenção de vazamento de dados em Machine Learning (learn-predict separation de Kaufman et al., 2012 no ACM TKDD) com a realidade agronômica subtropical paranaense (rotação bienal de culturas: soja no verão, milho safrinha e trigo/aveia no inverno, conforme boletins da Embrapa Soja).

#### 17. land-13-01665-v2.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/land-13-01665-v2.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 18. land-14-00163-v3.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/land-14-00163-v3.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 19. Machine Learning Models for the Spatial Prediction of Gully Erosion Susceptibility in the Piraí Drainage Basin Paraíba Do Sul Middle Valley Southeast Brazil.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Machine Learning Models for the Spatial Prediction of Gully Erosion Susceptibility in the Piraí Drainage Basin Paraíba Do Sul Middle Valley Southeast Brazil.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 20. Mapeamento da suscetibilidade à erosão regressiva.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Mapeamento da suscetibilidade à erosão regressiva.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 21. Mapping Soil Erosion Classes using Remote Sensing Data and Ensemble Models.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Mapping Soil Erosion Classes using Remote Sensing Data and Ensemble Models.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 22. Prediction of gully erosion susceptibility mapping using novel ensemble machine learning algorithms - OPUS at UTS.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Prediction of gully erosion susceptibility mapping using novel ensemble machine learning algorithms - OPUS at UTS.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 23. Prediction of gully erosion susceptibility mapping using novel ensemble machine learning algorithms.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Prediction of gully erosion susceptibility mapping using novel ensemble machine learning algorithms.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 24. PREVISÃO DE CLASSES DE EROSÃO LAMINAR USANDO.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/PREVISÃO DE CLASSES DE EROSÃO LAMINAR USANDO.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 25. Roberts_2017_Cross_validation_strategies_spatial_temporal_structure.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Roberts_2017_Cross_validation_strategies_spatial_temporal_structure.pdf`
- **Local de Origem / Fonte:** `Download da base Ecography (CORE repository)`
- **Extensão/Páginas:** 56 páginas
- **Metodologia Principal:** Spatial Cross-Validation / Block CV / Autocorrelação Espacial / Métricas Não Viesadas
- **Justificativa de Enquadramento:** Artigo seminal de David R. Roberts et al. (Ecography 2017) sobre estratégias de validação cruzada para dados com estrutura espacial e temporal. Fundamenta tecnicamente por que o particionamento aleatório k-fold padrão falha em dados geoespaciais e valida a necessidade de Spatial Cross-Validation (Block CV e thinning com buffer de 1 km) para neutralizar a autocorrelação espacial.

#### 26. Safanelli_Dematte_2021_Fine_scale_soil_mapping_EO_data_GEOS3.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Safanelli_Dematte_2021_Fine_scale_soil_mapping_EO_data_GEOS3.pdf`
- **Local de Origem / Fonte:** `Download da Revista Brasileira de Ciência do Solo (RBCS / GeoCiS ESALQ-USP)`
- **Extensão/Páginas:** 20 páginas
- **Metodologia Principal:** GEOS3 / Mineração Espectral / Google Earth Engine / Limiar NDVI Solo Nu
- **Justificativa de Enquadramento:** Publicação do grupo de Geotecnologias em Ciência do Solo (GeoCiS / ESALQ-USP) liderado pelo Prof. Demattê. Descreve em detalhes a implementação operacional do algoritmo Geospatial Soil Sensing System (GEOS3) e fundamenta tecnicamente a identificação de solo exposto e o limiar espectral de NDVI <= 0,25 para discriminação precisa entre solo nu e palhada no Sistema Plantio Direto.

#### 27. SILVA_2025MODELAGEM_PREDITIVA_NA_SUSCETIBILIDADE_.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/SILVA_2025MODELAGEM_PREDITIVA_NA_SUSCETIBILIDADE_.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 28. Soil erosion analysis based on machine learning method - Bulletin of Electrical Engineering and Informatics.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Soil erosion analysis based on machine learning method - Bulletin of Electrical Engineering and Informatics.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 29. sustainability-15-01939-v2.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/sustainability-15-01939-v2.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 30. The_Spatiotemporal_Evolution_Driving_Mechanisms_an.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/The_Spatiotemporal_Evolution_Driving_Mechanisms_an.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 31. Tree-based machine learning algorithms for soil erosion vulnerability prediction in Saddang Watershed-south Sulawesi-Indonesia _ Journal of Water and Clima Fixed.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Tree-based machine learning algorithms for soil erosion vulnerability prediction in Saddang Watershed-south Sulawesi-Indonesia _ Journal of Water and Clima Fixed.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 32. Utilizing Machine Learning Algorithms for the Development of Gully Erosion Susceptibility Maps - Semantic Scholar.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Utilizing Machine Learning Algorithms for the Development of Gully Erosion Susceptibility Maps - Semantic Scholar.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

#### 33. Vrieling_2006_Satellite_remote_sensing_water_erosion_review.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Vrieling_2006_Satellite_remote_sensing_water_erosion_review.pdf`
- **Local de Origem / Fonte:** `Download da base Catena (Elsevier / Wageningen University)`
- **Extensão/Páginas:** 17 páginas
- **Metodologia Principal:** Sensoriamento Remoto Orbital / Proxies Espectrais / Limitações de Resolução Espacial
- **Justificativa de Enquadramento:** Artigo seminal clássico de Anton Vrieling (Catena 2006) que fundamenta a detectabilidade de erosão laminar por sensoriamento remoto óptico orbital. Formaliza que satélites com resolução de 10m (como Sentinel-2) captam proxies espectrais indiretos (perda de matéria orgânica, redução de biomassa, exposição de horizontes subsuperficiais e encrostamento), enquanto a visualização direta de microrrelevo laminar exige VANTs com resolução centimétrica.

#### 34. water-18-02255.pdf
- **Caminho Atual:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/water-18-02255.pdf`
- **Local de Origem / Fonte:** `-`
- **Extensão/Páginas:** - páginas
- **Metodologia Principal:** Machine Learning / SR
- **Justificativa de Enquadramento:** 

---

## 3. Pesquisas Relacionadas (53 Artigos)

| Nº | Arquivo | Origem Prévia | Metodologia / Foco | Relevância Secundária para o SAREL |
|---|---|---|---|---|
| 1 | **13104+-+Avaliação+da+Susceptibilidade+à+Erosão+Laminar+no+Alto+Banabuiú+(CE).pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 2 | **13659-45240-1-SM.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 3 | **232.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 4 | **35cbe_149-154.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 5 | **59130+Texto+do+artigo-263494-2-15-20210615.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 6 | **63077+POTENCIAL+À+EROSÃO+LAMINAR+NA+BACIA+HIDROGRÁFICA+DO+RIBEIRÃO+DOURADINHO,+NO+TRIÂNGULO+MINEIRO_.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 7 | **A study utilizing USLE and RUSLE.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 8 | **admin,+05-24-final.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 9 | **admin,+Art.+5+-+Análise+da+Suscetibilidade+-+RBG+11+Nº+2.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 10 | **admin,+RBG_Ano_7_n_2_2006_73_85.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 11 | **Aplicação de Aprendizado Profundo e Análise Geoespacial.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 12 | **Aplicação de Redes Neurais Convolucionais para Prever a Erosão do Solo.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 13 | **Applied and Environmental Soil Science - 2021 - García - Geospatial Analysis of Soil Ero.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 14 | **ASSESSING OF SOIL EROSION RISK.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 15 | **Carvalho_EstimativaDePerdaDeSoloPoErosaoLaminarEmLucena_2019.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 16 | **CerriCarlosEduardoPellegrino.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 17 | **Comprehensive Review on Surface Soil.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 18 | **contgeo,+27-V_SGFNE_LISBOA_ET_AL_EIXO_05.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 19 | **Detecting_Analyzing_and_Predicting_Land_UseLand_Co.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 20 | **dissertacao_elaine_final (2)_compressed.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 21 | **Elaboracao_das_Cartas_de_Suscetibilidade.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 22 | **Estrutura modular com IA funde imagens Sentinel para detecção robusta de deslizamentos de terra.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 23 | **Estudo_Da_Erosao_Laminar_Em_Municipio_PR.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 24 | **fabiobreunig,+20_Espacialização+da+perda+de+solos.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 25 | **geografar,+12106-39730-1-CE.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 26 | **Geoprocessamento Aplicado na Caracterizacao de Bacias Hidrograficas Visando a sua Sustentbilidade.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 27 | **Geoprocessamento-Aplicada-no-Planejamento-de-Bacias-Hidrograficas-1.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 28 | **Identificacao_De_Areas_Criticas_De_Erosao Laminar.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 29 | **Integrated image processing and machine learning framework.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 30 | **Integrating_Remote_Sensing_GIS_and_AI_Technologies.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 31 | **LUZIANE-SANTOS-RIBEIRO.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 32 | **Mapeamento_da_vulnerabilidade_geoambient.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 33 | **Mapeamento_do_potencial_de_erosao_lamina.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 34 | **Mapeamento_Por_Tecnicas_De_Geoprocessame.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 35 | **Modeling and Assessment of Land Degradation Vulnerability in Arid Ecosystem of Rajasthan Using Analytical Hierarchy Process and - Semantic Scholar.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 36 | **p103.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 37 | **Pesquisa sobre a previsão da degradação irregular do solo.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 38 | **Potencial_a_erosao_laminar_utilizando_Si.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 39 | **ppggeografia_danielsantanalanza_dissertacaomestrado.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 40 | **Predicao_Da_Perda_De_Solo_Por_Erosao_Lam.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 41 | **PREMIO-MAPBIOMAS_VulnerabilidadeErosao_FINAL-Margareth-Simoes.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 42 | **Real-time_soil_erosion_detection_using_satellite_i.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 43 | **Relatorio_Tecnico_Suscetibilidade.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 44 | **remotesensing-13-00155-v3.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 45 | **Research on Soil Erosion Based on Remote Sensing Technology.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 46 | **salomao_fs_me_bauru.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 47 | **Spatiotemporal modeling of soil loss and sediment yield due to land use and land cover.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 48 | **SUSCETIBILIDADE_RISCO_EROSAO_LAMINAR.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 49 | **trabalho1_87.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 50 | **transferir.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 51 | **USE+OF+REMOTE+SENSING+IN+EROSION+ANALYSIS+IN+THE+GENERAL+SAMPAIO+DAM+WATERSHED+-+CE.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 52 | **Uso_de_Tecnicas_de_Geoprocessamento.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |
| 53 | **zeluiz,+02_Estimativa.pdf** | `-` | RUSLE / SIG / Regional | Base regional, pedológica ou baseline metodológico empírico (RUSLE/USLE/Paraná) |

---

## 4. Matriz de Cobertura Teórico-Metodológica e Inventário Normativo de Decisões (R-L5)

A tabela abaixo sintetiza o inventário analítico das obras que sustentam as decisões e parâmetros pré-registrados do SAREL (R-L1 a R-L5), com metadados completos de autoria, ano, título, identificador/DOI e arquivo local arquivado:

| Decisão Vinculada | Autor Principal | Ano | Título da Obra | DOI / Identificador | Arquivo / Repositório Local | Papel Científico no SAREL |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **D01, D20** | Durigon, V. L. et al. | 2014 | NDVI time series for monitoring RUSLE cover management factor in a tropical watershed | `10.1080/01431161.2013.871081` | `docs/bibliografia/05_fundamentacao_teorica_dos_eixos/Durigon_etal_2014.pdf` | Formulação base do Fator C: C = (1 - NDVI) / 2 |
| **D02, D20** | Rikimaru, A., Roy, P. S. & Miyatake, S. | 2002 | Tropical forest cover density mapping | *Tropical Ecology* 43(1):39-47 | `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Tropical forest cover density mapping - International Society for ....pdf` (conferido em `docs/verificacoes/fontes/rikimaru2002/`) | Formulação do índice BSI (componente de solo nu do modelo FCD) — NÃO sustenta os cortes numéricos de D02 |
| **D04** | Kaufman, S. et al. | 2012 | Leakage in data mining: Formulation, detection, and avoidance | `10.1145/2382577.2382579` | `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Kaufman_2012_EmbrapaSoja_Fundamentacao_Guarda_Temporal_Data_Leakage.pdf` | Fundamentação de guarda temporal de 2 anos contra vazamento de dados |
| **D04** | Franchini, J. C. et al. | 2011 | Evolução da fertilidade do solo em sistemas de rotação de culturas | Embrapa Soja Doc. 326 | `docs/verificacoes/fontes/` | Rotação bienal no Sistema Plantio Direto no Paraná |
| **D05** | Drusch, M. et al. | 2012 | Sentinel-2: ESA's Optical High-Resolution Mission for GMES Operational Services | `10.1016/j.rse.2012.01.009` | `AUSENTE DO ACERVO` | Especificação e resolução das bandas nativas da constelação Sentinel-2 MSI |
| **D06** | Nuvem UAV | 2024 | Manual Técnico do VANT Multiespectral Spectral 2 | Nuvem UAV Indústria | `docs/verificacoes/voo/cobertura_voos.geojson` | Especificação instrumental de sensor de 5 bandas e acurácia de voo |
| **D07, P05** | Zanaga, D. et al. | 2022 | ESA WorldCover 10 m 2021 v200 | `10.5281/zenodo.5571936` | `GEE: ESA/WorldCover/v200/2021` | Máscara de elegibilidade de uso do solo (classes 30 e 40) |
| **D07, P04** | Santos, H. G. dos et al. | 2018 | Sistema Brasileiro de Classificação de Solos (SiBCS), 5ª ed. | ISBN 978-85-7035-800-4 | Embrapa Solos (356 p.) | Classes de relevo e domínio de declividade física 3% a 20% |
| **D08, D09, D12, D14** | Coelho, M. R. et al. | 2024 | Erodibilidade dos solos do Brasil | Embrapa Solos Doc. 246 | `docs/verificacoes/fontes/doc246/saida_extracao_cnps_doc_246_2024.txt` | Valores tabelados do Fator K (k_solos) da carta oficial nacional |
| **D10** | Demattê, J. A. M., Fongaro, C. T., Rizzo, R. & Safanelli, J. L. | 2018 | A powerful data mining procedure to retrieve soil spectral reflectance from satellite images | `10.1016/j.rse.2018.04.047` | `docs/bibliografia/01_pesquisas_diretamente_relacionadas/1-s2.0-S0034425718302049-main.pdf` (conferido em `docs/verificacoes/fontes/dematte2018/`) | Máscara de solo exposto do GEOS3: faixa de NDVI [0; 0,25], faixa de NBR2 [0; 0,075] e gradientes visuais (Landsat 5 TM; VNSIR ausente no primário de 2018) |
| **D10** | Safanelli, J. L. et al. | 2021 | Fine-scale soil mapping with Earth Observation data: a multiple geographic level comparison | `10.36783/18069657rbcs20210080` | `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Safanelli 2021.pdf` (conferido e arquivado em `docs/verificacoes/fontes/safanelli2021/`) | Mapeamento pedométrico em São Paulo com imagens sintéticas de solo nu (BSI = bare soil image); NÃO prescreve limiar de NDVI <= 0,25 de D10 nem trata de erosão |
| **D11** | Zhu, Zhe | 2013 | Continuous change detection and classification of land cover using all available Landsat data | Ph.D. Dissertation, Boston University | `docs/verificacoes/fontes/zhu2013/zhu_2013_tese_ccdc.pdf` | Piso de N=12 observações limpas para inicialização e estabilidade do modelo harmônico OLS multivariado (D11.4) |
| **D11, D12** | Agresti, A. & Coull, B. A. | 1998 | Approximate is better than 'exact' for interval estimation of binomial proportions | `10.1080/00031305.1998.10480550` | The American Statistician 52(2):119-126 | Propriedades assintóticas intervalares de proporção binomial e erro-padrão SE <= 0,144 para frequência de solo nu (Ê) em D11.2 |
| **D11, D12** | Brown, L. D., Cai, T. T. & DasGupta, A. | 2001 | Interval estimation for a binomial proportion | `10.1214/ss/1009213286` | Statistical Science 16(2):101-133 | Cobertura assintótica e suporte discreto para proporções binomiais na dimensão Ê de D11.2 e D12 |
| **D12, D23** | Cochran, W. G. | 1977 | Sampling Techniques (3rd Edition) | ISBN 0-471-16240-X | `docs/verificacoes/fontes/cochran1977/cochran_1977_sampling_techniques_ch5a12.md` | Teoria de amostragem probabilística estratificada desproporcional. **ATENÇÃO (L-01):** o que está arquivado NÃO é a obra, e sim uma síntese de literatura secundária que se autodeclara `NAO_CONFERIDO_NO_PRIMARIO`. O exemplar primário não está depositado. A §5A.12 (estratos colapsados) é o lastro da opção 1 do gate G-01 e **não pode sustentá-la** neste estado |
| **D13** | Waltrick, P. C. et al. | 2015 | Estimativa da erosividade das chuvas no Estado do Paraná | `10.1590/01000683rbcs20140718` | `docs/verificacoes/fontes/waltrick2015/waltrick_2015.pdf` | Erosividade regionalizada do Paraná (114 localidades) |
| **D13** | Waltrick, P. C. | 2010 | Potencial erosivo das chuvas no Estado do Paraná | Dissertação UFPR | `docs/verificacoes/fontes/waltrick2010/waltrick_2010.pdf` | Conversão para o Sistema Internacional (SI) via g = 9,81. Caminho corrigido em 02/11/2026 (L-05): o declarado antes, `fontes/2010_04_20_waltrick.pdf`, não existia no disco |
| **D13** | Waltrick, P. C.; Machado, M. A. de M.; Oliveira, D. de; Grimm, A. M. & Dieckow, J. | 2011 | Erosividade de chuvas no Estado do Paraná: atualização e influência dos eventos "El Niño" e "La Niña" | Boletim Técnico nº 01, SBCS-NEPAR, Curitiba, ISSN 2236-2916, 21 p. | `docs/verificacoes/fontes/nepar2011/nepar_boletim_01_2011.pdf` | Cadastrada em 02/11/2026 (L-05): PDF estava arquivado e a obra ausente do inventário. SHA-256 `c7391c1a9007d4d08eda1238a36347e8b89b437c7d8a078457ce939eeb2a3e20`, conferido na extração arquivada |
| **D15** | Schmidt, S. | 2019 | Modification of the RUSLE slope length and steepness factor (LS-factor) based on rainfall experiments at steep alpine grasslands | MethodsX (Elsevier) | `docs/verificacoes/fontes/schmidt2019/schmidt_2019_methodsx.pdf` | Cadastrada em 02/11/2026 (L-05): PDF arquivado e obra ausente do inventário. SHA-256 `f5aabe02b9bf20312018ccf43e17b29c6ed1343b7d2c933581387ea9c6cf927e`. Título e autoria lidos dos metadados do próprio PDF |
| **(a vincular)** | **IDENTIFICAÇÃO PENDENTE** | 2026 | (sem `/Title` nos metadados do PDF) | (a determinar) | `docs/verificacoes/fontes/tondati2026/tondati_2026.pdf` | Cadastrada em 02/11/2026 (L-05) como PENDENTE: o arquivo está no acervo sob o identificador `tondati2026`, mas o PDF não traz título e o campo `/Author` registra "Anna Carolina Barcelos", que não corresponde ao identificador. Autoria, título, veículo e decisão vinculada **não foram inventados** — ficam a determinar pelo pesquisador. SHA-256 `1ed9e5f49c8b3e65e0e1686ae99927bd37126aa57578b209cae65cbb3f66bf8c` |
| **D13** | Rufino, R. L. et al. | 1993 | Determinação do potencial erosivo das chuvas no Estado do Paraná: terceira aproximação | RBCS 17:439-444 | `docs/verificacoes/fontes/rufino1993/rufino_biscaia_merten_1993_rbcs.pdf` | Equações da Região 1 do Paraná (a = 18,64, b = 5,73) |
| **D13, D15, D20, D22** | Renard, K. G. et al. | 1997 | Predicting Soil Erosion by Water: A Guide to Conservation Planning with the RUSLE | USDA AH 703 | `docs/verificacoes/fontes/renard1997/ah_703.pdf` | Equações clássicas da RUSLE e definição física de fatores |
| **D13** | Funk, C. et al. | 2015 | The climate hazards group infrared precipitation with stations (CHIRPS) | `10.1038/sdata.2015.66` | Nature Scientific Data | Série climatológica de precipitação diária de satélite |
| **D13, D19** | Huffman, G. J. et al. | 2020 | Integrated Multi-satellitE Retrievals for GPM (IMERG) | NASA GSFC | GPM Data Products | Detecção de eventos pluviométricos extremos sub-diários |
| **D15, D21** | Desmet, P. J. J. & Govers, G. | 1996 | A GIS procedure for automatically calculating the USLE LS factor on topographically complex landscapes | JSWC 51(5):427-433 | `docs/verificacoes/fontes/desmet1996/desmet_govers_1996_jswc.pdf` | Algoritmo bidimensional de área de contribuição para Fator LS |
| **D15** | McCool, D. K. et al. | 1989 | Slope length and steepness factors for the revised universal soil loss equation | Trans. ASAE 32:1571-1576 | `docs/verificacoes/fontes/` | Fatores de declividade e comprimento de rampa |
| **D16, D24, D26** | van der Ploeg, T. et al. | 2014 | Modern modeling techniques are data hungry: a simulation study for predicting dichotomous endpoints | `10.1186/1471-2288-14-137` | BMC Med. Res. Methodol. | Regime de eventos por variável (200 epv) em modelos flexíveis |
| **D21** | Zevenbergen, L. W. & Thorne, C. R. | 1987 | Quantitative analysis of land surface topography | Earth Surf. Process. Landf. | `AUSENTE DO ACERVO` | Algoritmos polinomiais de curvatura de perfil e plano |
| **D21** | Beven, K. J. & Kirkby, M. J. | 1979 | A physically based, variable contributing area model of basin hydrology | Hydrol. Sci. Bull. | `AUSENTE DO ACERVO` | Índice topográfico de umidade (Topographic Wetness Index - TWI) |
| **D22** | Wischmeier, W. H. & Smith, D. D. | 1978 | Predicting Rainfall Erosion Losses: A Guide to Conservation Planning | USDA AH 537 | `docs/bibliografia/05_fundamentacao_teorica_dos_eixos/AH_537 Predicting Rainfall Soil Losses.pdf` | Estrutura multiplicativa e práticas conservacionistas do Fator P |
| **D23** | King, G. & Zeng, L. | 2001 | Logistic regression in rare events data | `10.1093/oxfordjournals.pan.a004868` | Political Analysis | Correção a priori de probabilidade em amostragem desbalanceada |
| **D23** | Olofsson, P. et al. | 2014 | Good practices for estimating area and assessing accuracy using land change science | `10.1016/j.rse.2014.02.015` | Remote Sens. Environ. | Inferência populacional e matrizes de erro estratificadas |
| **D24** | Riley, R. D. et al. | 2019 | Minimum sample size for developing a multivariable prediction model | `10.1002/sim.7993` | Statistics in Medicine | Critérios formais de dimensionamento amostral multivariado |
| **D24, D25, P01, P02** | Roberts, D. R. et al. | 2017 | Cross-validation strategies for data with temporal, spatial, hierarchical or phylogenetic structure | `10.1111/ecog.02881` | `docs/bibliografia/06_pesquisas_machine_learning/Ecography - 2016 - Roberts - Cross‐validation strategies for data with temporal  spatial  hierarchical  or phylogenetic.pdf` | Validação cruzada por blocos espaciais e alcance de variograma |
| **D24, D25** | Hanley, J. A. & McNeil, B. J. | 1982 | The meaning and use of the area under a receiver operating characteristic (ROC) curve | Radiology 143:29-36 | `AUSENTE DO ACERVO` | Propriedades estatísticas e erro-padrão da métrica AUC-ROC |
| **D25** | Nosek, B. A. et al. | 2018 | The preregistration revolution | `10.1073/pnas.1708274114` | `docs/bibliografia/05_fundamentacao_teorica_dos_eixos/nosek-et-al-2018-the-preregistration-revolution.pdf` | Fundamentação metodológica de pré-registro contra HARKing e p-hacking |
| **D25** | Cameron, A. C. et al. | 2008 | Bootstrap-based improvements for inference with clustered errors | `10.1162/rest.90.3.414` | Rev. Econ. Stat. | Inferência conservadora por cluster bootstrap |
| **D25** | DeLong, E. R. et al. | 1988 | Comparing the areas under two or more correlated receiver operating characteristic curves | `10.2307/2531595` | Biometrics | Teste emparelhado para comparação de AUC entre competidores |
| **D26** | Altman, D. G. & Royston, P. | 2006 | The cost of dichotomising continuous variables | `10.1136/bmj.332.7549.1080` | `docs/bibliografia/06_pesquisas_machine_learning/1080.1.full.pdf` | Justificativa estatística do alvo contínuo y in [0, 1] em vez de binarização |
| **D26, P10** | Tweedie, M. C. K. | 1984 | An index which distinguishes between some important exponential families | Statistics: Applications and New Directions | ISI Golden Jubilee | Distribuição composta de Poisson-gama para variáveis com excesso de zero |
| **P03** | Congalton, R. G. & Green, K. | 2019 | Assessing the Accuracy of Remotely Sensed Data: Principles and Practices (3rd ed.) | `10.1201/9780429052729` | CRC Press | Acurácia temática e protocolos de amostragem de validação de mapas |
| **P04** | Pekel, J.-F. et al. | 2016 | High-resolution mapping of global surface water and its long-term changes | `10.1038/nature20584` | Nature 540:418-422 | Máscara de ocorrência de água permanente > 10% |
| **P22** | Planet Labs PBC | 2022 | Planet Imagery Product Specifications | Planet Labs Technical Spec | Planet Product Documentation | Limiares de visada off-nadir para ortorretificação PlanetScope |
| **D11, DP-24** | Hyndman, R. J. & Fan, Y. | 1996 | Sample Quantiles in Statistical Packages | `10.1080/00031305.1996.10473566` | `docs/verificacoes/fontes/hyndman1996/hyndman_fan_1996_american_statistician.pdf` | Piso de n >= 9 para estimação de percentis de cauda (p10 e p90 em D11.3 / DP-24) |

---

## 4.1 Inventário do Pacote ScienceDirect (22/10/2026 — 9 Artigos Descompactados)

Acervo descompactado em `docs/bibliografia/06_pesquisas_machine_learning/` a partir de `ScienceDirect_articles_22Oct2026_13-13-36.639.zip`:

| Nº | Arquivo | Autor Principal | Ano | Título da Obra | Periódico / Fonte | Relevância para o SAREL |
|---|---|---|---|---|---|---|
| 1 | `An-evaluation-of-Landsat--Sentinel-2--Sentinel-1-and-MO_2021_Science-of-Remo.pdf` | Defourny, P. et al. | 2021 | An evaluation of Landsat, Sentinel-2, Sentinel-1 and MODIS data for crop type mapping | *Science of Remote Sensing* | Comparação de sinergias ópticas e radar para caracterização agrícola |
| 2 | `Assessing-the-use-of-harmonized-multisource-backscatter-_2021_Science-of-Rem.pdf` | Traganos, D. et al. | 2021 | Assessing the use of harmonized multisource backscatter data for thematic habitat mapping | *Science of Remote Sensing* | Harmonização de dados multiespectrais e SAR |
| 3 | `Characterization-of-Planetscope-0-Planetscope-1-surface-ref_2021_Science-of-.pdf` | Sadeh, R. et al. | 2021 | Characterization of Planetscope-0 Planetscope-1 surface reflectance and NDVI continuity | *Science of Remote Sensing* | Calibração radiométrica e continuidade de NDVI PlanetScope vs Sentinel-2 |
| 4 | `Improvements-in-high-temporal-resolution-active-fire-detection_2021_Science-.pdf` | Hall, J. V. et al. | 2021 | Improvements in high-temporal resolution active fire detection | *Science of Remote Sensing* | Modelagem temporal de resolução diária |
| 5 | `Object-based-classification-of-vegetation-species-in-a-sub_2021_Science-of-R.pdf` | Rapinel, S. et al. | 2021 | Object-based classification of vegetation species using Sentinel-1 and Sentinel-2A images | *Science of Remote Sensing* | Classificação orientada a objeto e segmentação de cobertura |
| 6 | `PolInSAR-coherence-based-decomposition-modeling-for-scatte_2021_Science-of-R.pdf` | Kumar, S. et al. | 2021 | PolInSAR coherence-based decomposition modeling for scattering characterization | *Science of Remote Sensing* | Caracterização de espalhamento de radar para detecção de solo |
| 7 | `Surface-heights-and-crevasse-morphologies-of-surging-and-fast-mo_2021_Scienc.pdf` | Trevers, M. et al. | 2021 | Surface heights and crevasse morphologies from ICESat-2 laser altimeter data | *Science of Remote Sensing* | MDE e altimetria laser para morfologia de terreno |
| 8 | `Time-weighted-dynamic-time-warping-analysis-for-mapping-inter_2021_Science-o.pdf` | Belgiu, M. et al. | 2021 | Time-weighted dynamic time warping analysis for mapping interannual cropping practices changes | *Science of Remote Sensing* | Séries temporais TWDTW para detecção de mudanças de uso |
| 9 | `UAV--amp--satellite-synergies-for-optical-remote-sensin_2021_Science-of-Remo.pdf` | Alvarez-Vanhard, E. et al. | 2021 | UAV & satellite synergies for optical remote sensing applications: A literature review | *Science of Remote Sensing* | Sinergia fundamental VANT (centimétrico) e Satélite (decamétrico) |

## 5. Lote em Triagem e Revisão (`docs/bibliografia/03_contexto_regional_e_triagem/` — 22 Obras)

Lote integrado ao acervo do SAREL em 20 de outubro de 2026, resultante da curadoria do histórico diário de buscas (*Daily research update: Laminar erosion and AI*) e do documento *Auditoria e Curadoria Bibliográfica: Projeto SAREL*.

Conforme a diretriz do repositório ([`.gitignore`](../../.gitignore)), os arquivos `.pdf` brutos permanecem salvos localmente na máquina do pesquisador, enquanto o inventário e a integridade são mantidos no versionamento Git via rastreamento de hashes SHA-256 e metadados, atendendo aos requisitos da [Norma de Lastro Científico (`docs/NORMA_LASTRO_CIENTIFICO.md`)](../NORMA_LASTRO_CIENTIFICO.md).

O detalhamento completo deste lote (com hashes SHA-256 de todas as obras, eixos temáticos e páginas) está documentado em:
👉 **[`docs/bibliografia/Para Revisar/README.md`](./Para%20Revisar/README.md)**

| Nº | Arquivo Local (.pdf) | Autor(es) / Ano | Título da Obra / Publicação | Eixo Temático | Hash de Integridade (SHA-256) |
|:--:|---|---|---|:--:|---|
| 1 | `AlissonA_Ribeiro_2026.pdf` | Alison Antony Ribeiro (2026) | *Gestão hídrica e desenvolvimento rural sustentável: desenvolvimento de modelo de previsão de vazão e recarga hídrica subterrânea na Bacia Hidrográfica do Rio Paraná III* (Tese de Doutorado, UNIOESTE) | Eixo II | `10df41566f6d6da099ca9d5a5a47da4e4111aca50cca3cf853e7d3054fb668c4` |
| 2 | `Analise_espaco-temporal_da_erosao_hidrica_por_meio.pdf` | Nunes et al. (2025) | *Análise espaço-temporal da erosão hídrica por meio de modelagem e geotecnologias em bacias hidrográficas no Centro-Oeste do Brasil* (*RBGF*, DOI: 10.26848/rbgf.v18.2.p1465-1492) | Eixo II | `af56c331621912006809fc642e0573dfc270f44a1500229b5786d997f742e49e` |
| 3 | `Bloco+1+-+3+-+Manoel+et+al+SENSORIAMENTO+REMOTO+E+MACHINE+LEARNING.pdf` | Anselmo Manoel et al. (2023) | *Sensoriamento Remoto e Machine Learning Aplicados ao Mapeamento e Classificação do Uso e Cobertura da Terra* (INPE / UFRN) | Eixo I | `e7df65fcccaf5ba7e1c80953651270a01588e115bc4cb5e2a0d9cd1a9cf4ef89` |
| 4 | `Busca por artigos FLOW.pdf` | Workspace Studio Flows (2026) | *Daily research update: Laminar erosion and AI (Histórico de varredura automatizada de busca, Mai–Out 2026, 32 p.)* | Doc/Log | `70247fcbb0fbc218534fb4db95520425a0788d5dfdef6bd868b315283e960fa9` |
| 5 | `Erosodesoloemambienteamaznico.pdf` | Elaine Lima da Fonseca (2024) | *Erosão de solo em ambiente amazônico: aplicações de modelagens preditivas* (Livro Editora CRV, 156 p., ISBN/RG: 384762439) | Eixo I | `5f12ce3588b97e896835c653669e262b9f897d588bffefb4b106ba6c55ab9bb8` |
| 6 | `Estimativa da perda de solo por erosão laminar usando ferramentas computacionais na agricultura de precisão.pdf` | Bazzi et al. (2022) | *Estimating soil loss by laminar erosion using precision agriculture computational tools* (*Rev. Bras. Eng. Agríc. Ambient.*, DOI: 10.1590/1807-1929/agriambi.v26n12p907-914) | Eixo III | `64ae9bfa593f27210e0143ed317a4b8307c6ddd163679aaf7682060831434945` |
| 7 | `Estimativa de Perda de Solos por Erosão Laminar na Bacia Hidrográfica do Córrego.pdf` | Nascimento & Lupinacci (2016) | *Estimativa de Perda de Solos por Erosão Laminar na Bacia Hidrográfica do Córrego Baguaçu-SP* (*Revista do Depto de Geografia USP*, DOI: 10.11606/rdg.v32i0.116568) | Eixo III | `2d42f6c38e1cd7b9ff90aed9112aae8e8125e582c0140d064a2742080ab6d061` |
| 8 | `IV_SLGFA_1.pdf` | Júlio Bandeira Guerra et al. (2006) | *Avaliação do potencial natural erosivo laminar com técnicas de geoprocessamento: o caso da microbacia do ribeirão Taquara-PR* (IV SLGFA / INPE) | Eixo II | `ea78a09a58b02f61c1f59ae957a0dbcc4ccf589d967c345733be38f6223b0bbe` |
| 9 | `Monitoramento de Erosão Laminar em Diferentes Usos da Terra.pdf` | Pinese Júnior, Cruz & Rodrigues (2008) | *Monitoramento de erosão laminar em diferentes usos da terra, Uberlândia – MG* (*Sociedade & Natureza*, 20(2): 157-175) | Eixo III | `0a12236c8646c0f1cb1c8857480bec9427a6b6601082224e3ab8bbbbd913fee7` |
| 10 | `Relatório de Curadoria e Auditoria Bibliográfica - Projeto SAREL.pdf` | Curadoria Metodológica SAREL (2026) | *Auditoria e Curadoria Bibliográfica: Projeto SAREL — Análise de Aderência Científica e Extração de Referências do Log "Busca por artigos FLOW"* (4 p.) | Doc/Norma | `2497648afe4ccbb72fd93604e46af3ebe6f7578e5b66dcd923937031a8a0fdab` |
| 11 | `TCC_Lucas Duarte Oliveira.pdf` | Lucas Duarte Oliveira (2022) | *Modelagem por meio de inteligência geoespacial para estimar a erosão laminar na Bacia Hidrográfica do Córrego Grande (Estado de Goiás – Brasil)* (TCC, IF Goiano) | Eixo I | `8fc615b8d272fc7c4a4fa87c63dda37cc950d3f71cf92f6295a5a8ca1c7cbc36` |
| 12 | `Trabalho-Apa-RNCS-.pdf` | Rego & Alves (2021) | *Sensoriamento Remoto aplicado à erosão do solo na porção sul da APA Litoral Norte, município de Mata de São João, Bahia* (UFBA / RNCS) | Eixo II | `fdd21595a91654f99cc7ca73dd79688692530ae6bbfa926789e323f262071982` |
| 13 | `Técnicas de Sensoriamento Remoto.pdf` | Tibcherani et al. (2025) | *Técnicas de Sensoriamento Remoto para Detecção de Feições Erosivas em Áreas Verdes Urbanas: Uma Revisão Crítica* (Ed. Científica Digital, DOI: 10.37885/250920122) | Eixo I | `0fbf04fc6f2dde3c464a7b901ab405474fb91aab04b0b399d36bb048a024ef57` |
| 14 | `admin,+RBG_Ano_7_n_2_2006_73_85.pdf` | Guimarães et al. (2006) | *A avaliação qualitativa do potencial de erosão laminar em grandes áreas por meio da EUPS utilizando novas metodologias em SIG para os cálculos dos seus fatores* (*RBG*, 7(2): 73-85) | Eixo II | `f3045e3d298a3a1e9dee7e329071b20a5b7d6da3b26fb71efc3898802d35bdf0` |
| 15 | `agb_xxvi_4-00.pdf` | Barros & Silva (2022) | *O uso do sensoriamento remoto aplicado na determinação e modelação das zonas de risco à erosão hídrica* (*Ciência Geográfica Bauru*, XXVI(4): 1718-1733) | Eixo II | `f19567db2db8df0d388f0735586c54aee6ebbb9f9b53cddd0a52004afbe8ba63` |
| 16 | `dissertacao_elaine_final (2).pdf` | Elaine Eluizy Ribeiro Silva (2021) | *Modelagem de Perda de Solo por Erosão Laminar em Cenários Pré e Pós Cadastro Ambiental Rural no Município de Mineiros-GO* (Dissertação de Mestrado, IF Goiás) | Eixo II | `30438ff83b7dbd281327636bc8d7a2497715d7813821dba251ee04ae8d67e228` |
| 17 | `estimativaerosaolaminar.pdf` | Evelin Tais Schlickmann Krug (2024) | *Estimativa de perda de solo por erosão laminar em função de suas características e diferentes níveis de precipitação* (Dissertação PPGTCA, UTFPR Medianeira) | Eixo III | `77f0bcfbaca0b086d91f293c60b268b9ec5e2728aaa8114fae62c3b3bc787e6e` |
| 18 | `geoprocessamentoerosaosolovalidacao.pdf` | Jaqueline de Moura (2022) | *Validação do método de geoprocessamento na estimativa de perdas de solo por erosão laminar, em pequenas propriedades rurais, pela EUPS* (Dissertação PPGEA, UTFPR Francisco Beltrão) | Eixo III | `e66a25cb1c454bc2eafdebd06c87b798d507e1c9149b8ce6271b087154bfa299` |
| 19 | `l+ARTIGO+7101+-+2023-03-09.pdf` | Silva et al. (2022) | *Estimativa de perda de solos por erosão laminar em bacia hidrográfica* (*Nature and Conservation*, DOI: 10.6008/CBPC2318-2881.2022.001.0007) | Eixo II | `fdcda7a0710af48e0ec69cb3056f53ffba899f8f8da849ff9d6dad50cc8fbc97` |
| 20 | `perdasolobaciahidrografica.pdf` | Tailon Dal’ Maso Lucas (2024) | *Estimativa da perda de solo na Bacia Hidrográfica do Paraná III: influência de diferentes cenários de conservação do solo* (Dissertação PPGTCA, UTFPR Medianeira) | Eixo III | `3484fca1086ab2e317a4b5941679465bbb873f134b1b9919ab50dd3963e797ad` |
| 21 | `pereira_lh_me_rcla.pdf` | Luiz Henrique Pereira (2020) | *Caracterização da erosão hídrica laminar do solo em bacia hidrográfica com base na malha fundiária, por meio de sensoriamento remoto, geoprocessamento e modelagem* (Dissertação, UNESP Rio Claro) | Eixo II | `4b59f4c94fa37fe433b5367f562152fa274fe0cd20a6919922695eae2be3353b` |
| 22 | `rgmf,+05+-+GUERRA,+A.+J.+T.;+JORGE,+M.+C.+O.;+RANGEL,+L.+A.;+BEZERRA,+J.+F.+R.;+LOUREIRO,+H.+A.+S.;+GARRITANO,+F.pdf` | Guerra et al. (2021) | *Erosão dos solos, diferentes abordagens e técnicas aplicadas em voçorocas e erosão em trilhas* (*Rev. de Geomorfologia William Morris Davis*, DOI: 10.48025/ISSN2675-6900.v2n2.2021.144) | Eixo III | `8deffc36d10a6ab477e70af17bfbd4af7360ec4895b4f324531416129768da90` |

---

## 6. Adições Recentes ao Acervo — Sensoriamento Espectral, Solo Nu e Resíduos de Cultura (09/11/2026 — 6 Obras)

Lote de 6 obras adicionado em 09 de novembro de 2026 ao diretório `docs/bibliografia/01_pesquisas_diretamente_relacionadas/`. Conforme a diretriz do repositório ([`.gitignore`](../../.gitignore)), os arquivos `.pdf` brutos permanecem armazenados localmente fora do Git (Opção A), enquanto o inventário formal, metadados e integridade criptográfica SHA-256 são mantidos sob versionamento.

| Nº | Arquivo Local (.pdf) | Autor(es) / Ano | Título da Obra / Publicação | Eixo Metodológico no SAREL | URL de Origem | Data de Obtenção | Hash de Integridade (SHA-256) |
|:--:|---|---|---|---|---|:--:|:--:|
| 110 | `1-s2.0-S0034425718302049-main.pdf` | Demattê et al. (2018) | *A powerful data mining procedure to retrieve soil spectral reflectance from satellite images* (*Remote Sensing of Environment*, 212: 161-175, DOI: 10.1016/j.rse.2018.04.047) | Metodologia seminal do GEOS3 para mineração espectral de solo nu | `https://doi.org/10.1016/j.rse.2018.04.047` | 2026-11-09 | `f6dc34d82c5bcd9165c78f32fe6efd2926275d1d5f81f4e037e43e4f4185ab87` |
| 111 | `2001Daughtry_web.pdf` | Daughtry et al. (2001) | *Assessing the Spatial Distribution of Plant Litter* (*Proceedings of the 10th JPL Airborne Earth Science Workshop / AVIRIS*, Pasadena, CA) | Quantificação e distribuição espacial de serapilheira e cobertura vegetal morta | `https://aviris.jpl.nasa.gov/proceedings/workshops/01_docs/2001Daughtry_web.pdf` | 2026-11-09 | `67d1bfe94e5cbba863a656d3ae46bb51c82e830520d178af58710adbf9906fda` |
| 112 | `41598_2020_Article_61408.pdf` | Demattê et al. (2020) | *Bare Earth’s Surface Spectra as a Proxy for Soil Resource Monitoring* (*Scientific Reports*, 10:4461, DOI: 10.1038/s41598-020-61408-1) | Monitoramento de solo exposto, índice VNSIR e assinaturas de solo nu | `https://doi.org/10.1038/s41598-020-61408-1` | 2026-11-09 | `a0b00330d76a8c153e6a7f4f9362dde900b116bcf356a6c829332964a7bc9a82` |
| 113 | `daughtry_rse04.pdf` | Daughtry, Hunt Jr. & McMurtrey III (2004) | *Assessing crop residue cover using shortwave infrared reflectance* (*Remote Sensing of Environment*, 92(4): 597-608, DOI: 10.1016/j.rse.2003.10.023) | Refletância SWIR e índice de absorção de celulose (CAI) para cobertura por palhada | `https://doi.org/10.1016/j.rse.2003.10.023` | 2026-11-09 | `a8cdd59e45f7e14e40e52dbb8671fa4436607d1c8cd31d31785b36384d75a87a` |
| 114 | `remotesensing-Eval of SWIR Crop.pdf` | Hively et al. (2021) | *Evaluation of SWIR Crop Residue Bands for the Landsat Next Mission* (*Remote Sensing*, 13(21): 4300, DOI: 10.3390/rs13214300) | Bandas espectrais no SWIR para discriminação de palhada e conservação do solo | `https://doi.org/10.3390/rs13214300` | 2026-11-09 | `258285bbbbae437c832802c92094026aff25c3a2a58d4a8ff7b46bd5e5bdf446` |
| 115 | `Tropical forest cover density mapping - International Society for ....pdf` | Rikimaru, Roy & Miyatake (2002) | *Tropical forest cover density mapping* (*Tropical Ecology*, 43(1): 39-47) | Formulação biofísica do Bare Soil Index (BSI) e modelo FCD para vegetação/solo | `https://www.yumpu.com/en/document/view/42602737/tropical-forest-cover-density-mapping-international-society-for-` | 2026-11-09 | `80e9e9fe884282860c1be461d08017515da18130d08531268b0d6c054b71885f` |
