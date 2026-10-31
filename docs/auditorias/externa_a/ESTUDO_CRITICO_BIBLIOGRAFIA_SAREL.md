# Compêndio Analítico e Crítico da Seleção Bibliográfica — Projeto SAREL (PPGTCA 2026)
## Dossiê Técnico-Científico para Auditoria Externa Independente (112 Obras)

**Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA - 2026)**  
**Pesquisa de Mestrado:** Validação e Predição de Erosão Laminar usando Sensoriamento Remoto e Algoritmos de Gradiente Impulsionado (XGBoost)  
**Repositório Alvo:** `geolocalizacao-erosao-propriedade` (SAREL v2)  
**Data do Relatório:** 21 de Outubro de 2026  
**Diretriz de Conformidade:** [Norma de Lastro Científico (`NORMA_LASTRO_CIENTIFICO.md`)](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROSÃO%20LAMINAR/geolocalizacao-erosao-propriedade/docs/NORMA_LASTRO_CIENTIFICO.md) (Regras R-L1 a R-L5)

---

## 1. Apresentação e Escopo do Dossiê para a Auditoria Externa

Este compêndio foi elaborado para subsidiar o estudo crítico aprofundado por **auditores externos independentes** sobre a integralidade do lastro científico que fundamenta a arquitetura metodológica, os parâmetros biofísicos e o pipeline preditivo do **Projeto SAREL (Sistema Automatizado de Reconhecimento de Erosão Laminar)**.

A pesquisa de mestrado possui como tese central a **avaliação da capacidade de detecção e predição de erosão laminar em bacias agrícolas paranaenses (com foco na Bacia do Rio Paraná III - BP3)** por meio da integração entre:

1. **Sensoriamento Remoto Orbital:** Séries temporais multiespectrais Sentinel-2 (10m), PlanetScope (3m) e altimetria (ALOS PALSAR 12,5m / SRTM 30m);

2. **Modelagem Preditiva Supervisionada:** Algoritmos de aprendizado de máquina (*XGBoost*, ensembles baseados em árvores e redes neurais);

3. **Conhecimento Físico-Pedológico do Solo:** Fatores derivados da Equação Universal de Perdas de Solo (USLE/RUSLE — Fatores R, K, LS, C e P), modelo dinâmico G2 e índices de solo exposto (GEOS3/SYSI);

4. **Verdade de Campo e Validação Cega:** Levantamentos centimétricos por VANT (drone multiespectral Spectral 2 / MicaSense) e observação humana cega, respeitando a segregação estrita entre variáveis preditoras e rótulos de gabinete.


### Estrutura do Acervo Auditado (112 Obras):

- **Pesquisas Diretamente Relacionadas (35 obras):** Artigos centrais em machine learning para erosão, sensoriamento remoto, validação cruzada espacial e fundamentação teórica seminal;

- **Pesquisas Relacionadas (53 obras):** Estudos empíricos de USLE/RUSLE, sensoriamento remoto regional e baselines comparativos no Brasil e no Paraná;

- **Lote em Triagem e Revisão — `Para Revisar/` (22 obras):** Lote recente (20/10/2026) derivado do fluxo de curadoria *FLOW*, com dissertações da UTFPR Medianeira (PPGTCA), UNIOESTE (BP3) e estudos de malha fundiária (CAR);

- **Obras Seminais de Raiz (2 obras):** Clássicos históricos para o Fator R no Paraná (Rufino et al., 1993) e cálculo computacional do Fator LS em MDE (Hickey, 2000).


---

## 2. Matriz Teórico-Metodológica das Decisões Centrais do SAREL

A tabela abaixo mapeia cada decisão-chave do pipeline analítico do SAREL para as suas fontes primárias correspondentes, explicitando o que a literatura **sustenta** e quais são os **limites formais** declarados (cumprindo a regra R-L3 da Norma de Lastro Científico):


| Decisão / Parâmetro do SAREL | Fonte Primária no Acervo | O que a Fonte Sustenta | O que a Fonte NÃO Sustenta (Limite Declarado) |
|---|---|---|---|
| **D01 — Detectabilidade Remota de Erosão Laminar** | `Vrieling_2006_Satellite_remote_sensing_water_erosion_review.pdf` (*CATENA*) | Sensores orbitais de 10–30m detectam erosão laminar indiretamente por proxies espectrais (perda de biomassa, matéria orgânica, solo exposto). | NÃO sustenta delimitação física direta de feições milimétricas sem resolução centimétrica (<10cm) de VANT ou inspeção de campo. |
| **D02 / D10 — Limiar de NDVI para Solo Exposto ($NDVI \le 0,25$)** | `Safanelli_Dematte_2021_Fine_scale_soil_mapping_EO_data_GEOS3.pdf` (*RBCS*) | O limiar $NDVI \le 0,25$ discrimina com alta precisão solo descoberto de palhada senescente de Plantio Direto e vegetação residual no Brasil. | NÃO sustenta que todo pixel com $NDVI \le 0,25$ seja área erodida; apenas indica solo nu exposto à ação pluvial. |
| **D03 — Guarda Temporal de 2 Anos (Prevenção de Data Leakage)** | `Kaufman_2012_EmbrapaSoja_Fundamentacao_Guarda_Temporal_Data_Leakage.pdf` (*ACM TKDD* & Embrapa Soja) | Separação obrigatória de 24 meses em séries temporais agrícolas para respeitar a rotação bienal do Paraná (soja-trigo-milho safrinha) e evitar vazamento temporal. | NÃO sustenta que 24 meses elimine autocorrelação espacial (exige cumulativamente thinning espacial). |
| **D04 — Erodibilidade dos Solos -> Fator K da USLE** | `CNPS-DOC-246-2024.pdf` (Embrapa Solos, Doc. 246) | Conversão normativa oficial de classes qualitativas de erodibilidade da Embrapa para valores contínuos do Fator K (Mannigel et al., 2002). | NÃO sustenta calibração para camadas superficialmente compactadas por tráfego intenso de máquinas sem manejo. |
| **D05 — Spatial Cross-Validation e Thinning de 1 km** | `Roberts_2017_Cross_validation_strategies_spatial_temporal_structure.pdf` (*Ecography*) & `water-18-02255.pdf` | Demonstra que validação aleatória sob dependência espacial infla métricas de generalização, justificando validação em blocos espaciais. | NÃO fixa um buffer universal métrico; o limiar de 1 km do SAREL é escolha operacional baseada na geometria amostral. |
| **D06 — Mecanismo Interativo Chuva × Cobertura ($R_t \times (1 - C_t)$)** | `Karydas_Panagos_2018_The_G2_erosion_model_month_time_step_assessments.pdf` (*Env. Res.*) | Modela o mecanismo hidrológico real em que a perda de solo é fruto do produto coocorrente da energia da chuva pela fração desprotegida do solo. | NÃO sustenta coeficientes numéricos do Mediterrâneo sem retreinamento das árvores de decisão para o bioma subtropical brasileiro. |
| **D07 — Fator LS em Modelos Digitais de Elevação** | Hickey (2000) (*Computers & Geosciences*) & Rufino et al. (1993) | Algoritmo computacional para cálculo contínuo do comprimento de rampa cumulativo e declividade em grades altimétricas complexas. | NÃO sustenta aplicação direta sobre MDEs com ruído de cobertura florestal sem correção hidrológica prévia. |

---

## 3. Tabela Sinóptica Consolidada de Auditoria Forense (112 Obras)

A tabela a seguir consolida a integridade criptográfica (SHA-256), autoria e enquadramento de todas as 112 referências arquivadas:


| Nº | Subpasta | Arquivo | Autores / Ano | Título da Obra | Eixo Metodológico | Páginas | Hash SHA-256 (Prefixo) |
|:--:|---|---|---|---|---|:--:|---|
| 001 | Direta | `10452-29467-1-PB.pdf` | BEEI (2025) | Bulletin of Electrical Engineering and Informatics | Modelagem Preditiva com Machine Lea | 15 | `f6712f8f50d6b2f5...` |
| 002 | Direta | `agronomy-16-00294-v2.pdf` | Melek Işik, Mehmet Işik, Mert ... (2026) | Mapping Soil Erodibility Using Machine Learning and Rem... | Modelagem Preditiva com Machine Lea | 21 | `5a7cc612826ee4a4...` |
| 003 | Direta | `Análise espaço_temporal da degradação usando aprendizado de máquina e técnicas geoespaciais..pdf` | Ahmed et al. Discover Geoscien... (2026) | RESEARCH Open Access | Modelagem Preditiva com Machine Lea | 39 | `1478d3f8c9fffd62...` |
| 004 | Direta | `Avaliação da degradação do solo utilizando computação flexível baseada em SIG e algoritmos avançados de aprendizado de máquina.pdf` | Pesquisador(es) do Estudo (2025) | RESEARCH Open Access | Modelagem Preditiva com Machine Lea | 28 | `373509650679024f...` |
| 005 | Direta | `CNPS-DOC-246-2024.pdf` | Embrapa Solos (Geraldo et al. ... (2024) | Erodibilidade dos solos do Brasil: consolidação e valor... | Pedologia / Erodibilidade / Fator K | 40 | `4256459f154c2fe2...` |
| 006 | Direta | `Comparative-evaluation-of.pdf` | Pesquisador(es) do Estudo (2022) | INTRODUCTION | Modelagem Preditiva com Machine Lea | 17 | `8c19163797c1bfd2...` |
| 007 | Direta | `Comparison of machine learning models for gully erosion susceptibility mapping.pdf` | Pesquisador(es) do Estudo (2026) | Comparison of machine learning models for gully erosion... | Modelagem Preditiva com Machine Lea | 13 | `21d90043305fb28b...` |
| 008 | Direta | `Deteccao-de-feicoes-erosivas-em-bacias-hidrograficas-2025.pdf` | Pesquisador(es) do Estudo (2025) | [Anais do XXI Simpósio Brasileiro de Sensoriamento Remo... | Modelagem Preditiva com Machine Lea | 4 | `793f8671dc7e732d...` |
| 009 | Direta | `Enhancing predictive modeling of interrill and rill erosion susceptibility.pdf` | Pesquisador(es) do Estudo (2022) | Enhancing predictive modeling of interrill and rill ero... | Modelagem Preditiva com Machine Lea | 1 | `e7a847f167c77678...` |
| 010 | Direta | `galoa-proceedings-sbsr-2025-aplicacoes-de-aprendizado-de-maquina-para-modelagem-e-mapeamento.pdf` | Pesquisador(es) do Estudo (2025) | [Anais do XXI Simpósio Brasileiro de Sensoriamento Remo... | Modelagem Preditiva com Machine Lea | 4 | `bff39bad01950d1b...` |
| 011 | Direta | `Integrated machine learning and geospatial analysis enhanced gully erosion susceptibility modeling in the Erer watershed in East - Semantic Scholar.pdf` | Pesquisador(es) do Estudo (2026) | Integrated machine learning and geospatial analysis enh... | Modelagem Preditiva com Machine Lea | 27 | `f6535d1bf8a52b18...` |
| 012 | Direta | `Integração de dados geoespaciais de alta precisão e abordagens de aprendizado de máquina.pdf` | Hamza Bouguerra, Salah Eddine ... (2023) | Integration of High-Accuracy Geospatial Data and Machin... | Modelagem Preditiva com Machine Lea | 23 | `0c6a4ff6d90afeb0...` |
| 013 | Direta | `jh0260072.pdf` | Pesquisador(es) do Estudo (2022) | Mapping of soil erosion susceptibility using advanced m... | Modelagem Preditiva com Machine Lea | 16 | `40412123c7104c70...` |
| 014 | Direta | `jwc2025603.pdf` | Pesquisador(es) do Estudo (2022) | Tree-based machine learning algorithms for soil erosion... | Modelagem Preditiva com Machine Lea | 18 | `fd6d5e2a8ae64fa0...` |
| 015 | Direta | `Karydas_Panagos_2018_The_G2_erosion_model_month_time_step_assessments.pdf` | Christos G. Karydas, Panos Pan... (2018) | The G2 erosion model: An algorithm for month-time step ... | Modelo Físico-Dinâmico G2 / Interaç | 13 | `8c133b1e46049f37...` |
| 016 | Direta | `Kaufman_2012_EmbrapaSoja_Fundamentacao_Guarda_Temporal_Data_Leakage.pdf` | Compilação formal metodológica... (2012/2026) | Fundamentação Teórica: Guarda Temporal de 2 Anos e Prev... | Prevenção de Vazamento de Dados (Da | 1 | `1d20c09cf25e62d4...` |
| 017 | Direta | `land-13-01665-v2.pdf` | Jorge da Paixão Marques Filho,... (2024) | Machine Learning Models for the Spatial Prediction of G... | Modelagem Preditiva com Machine Lea | 21 | `708895d867f2111f...` |
| 018 | Direta | `land-14-00163-v3.pdf` | Tünde Takáts, László Pásztor, ... (2025) | Testing the Applicability and Transferability of Data-D... | Modelagem Preditiva com Machine Lea | 22 | `6969a67a1f2548b1...` |
| 019 | Direta | `Machine Learning Models for the Spatial Prediction of Gully Erosion Susceptibility in the Piraí Drainage Basin Paraíba Do Sul Middle Valley Southeast Brazil.pdf` | Pesquisador(es) do Estudo (2026) | Machine Learning Models for the Spatial Prediction of G... | Modelagem Preditiva com Machine Lea | 10 | `12a75e545762f439...` |
| 020 | Direta | `Mapeamento da suscetibilidade à erosão regressiva.pdf` | Pesquisador(es) do Estudo (2022) | Head-cut gully erosion | Modelagem Preditiva com Machine Lea | 19 | `6141f12f6f634966...` |
| 021 | Direta | `Mapping Soil Erosion Classes using Remote Sensing Data and Ensemble Models.pdf` | Pesquisador(es) do Estudo (2022) | Mapping Soil Erosion Classes using Remote Sensing Data ... | Modelagem Preditiva com Machine Lea | 8 | `9c9385b72bcb3c2d...` |
| 022 | Direta | `Prediction of gully erosion susceptibility mapping using novel ensemble machine learning algorithms - OPUS at UTS.pdf` | Pesquisador(es) do Estudo (2026) | Prediction of gully erosion susceptibility mapping usin... | Modelagem Preditiva com Machine Lea | 26 | `5746353481d371b1...` |
| 023 | Direta | `Prediction of gully erosion susceptibility mapping using novel ensemble machine learning algorithms.pdf` | Pesquisador(es) do Estudo (2022) | Prediction of gully erosion susceptibility mapping usin... | Modelagem Preditiva com Machine Lea | 31 | `0ed2e9101d3e8b04...` |
| 024 | Direta | `PREVISÃO DE CLASSES DE EROSÃO LAMINAR USANDO.pdf` | Pesquisador(es) do Estudo (2022) | XIII Simpósio Brasileiro de Recursos Hídricos 1 | Modelagem Preditiva com Machine Lea | 10 | `07bec135fecc5f94...` |
| 025 | Direta | `Roberts_2017_Cross_validation_strategies_spatial_temporal_structure.pdf` | David R. Roberts, Volker Bahn,... (2017) | Cross-validation strategies for data with temporal, spa... | Validação Cruzada Espacial (Spatial | 56 | `14c31173f60c662d...` |
| 026 | Direta | `Safanelli_Dematte_2021_Fine_scale_soil_mapping_EO_data_GEOS3.pdf` | José Lucas Safanelli, José Ale... (2021) | Fine scale soil mapping from earth observation data: th... | Mapeamento Digital de Solos / GEOS3 | 20 | `1f05f84f32e3114a...` |
| 027 | Direta | `sample_quantiles.pdf` | Rob J. Hyndman, Yanan Fan (1996) | Sample Quantiles in Statistical Packages | Estatística Matemática / Definições | 5 | `c3ae245d4fff1246...` |
| 028 | Direta | `SILVA_2025MODELAGEM_PREDITIVA_NA_SUSCETIBILIDADE_.pdf` | Luiz Felipe de Oliveira Ramos (2022) | MODELAGEM PREDITIVA NA SUSCETIBILIDADE À EROSÃO EM | Modelagem Preditiva com Machine Lea | 10 | `08d3980581903af8...` |
| 029 | Direta | `Soil erosion analysis based on machine learning method - Bulletin of Electrical Engineering and Informatics.pdf` | Pesquisador(es) do Estudo (2026) | Soil erosion analysis based on machine learning method ... | Modelagem Preditiva com Machine Lea | 29 | `1935e4627d2e9af8...` |
| 030 | Direta | `sustainability-15-01939-v2.pdf` | Ping Tu, Qianqian Zhou and Men... (2023) | Soil Erosion Type and Risk Identification from the Pers... | Modelagem Preditiva com Machine Lea | 22 | `2b59609400e73164...` |
| 031 | Direta | `The_Spatiotemporal_Evolution_Driving_Mechanisms_an.pdf` | Yangfei Huang, Chenjian Zhong,... (2025) | The Spatiotemporal Evolution, Driving Mechanisms, and F... | Modelagem Preditiva com Machine Lea | 29 | `18795ba0db374f60...` |
| 032 | Direta | `Tree-based machine learning algorithms for soil erosion vulnerability prediction in Saddang Watershed-south Sulawesi-Indonesia _ Journal of Water and Clima Fixed.pdf` | Pesquisador(es) do Estudo (2026) | Tree-based machine learning algorithms for soil erosion... | Modelagem Preditiva com Machine Lea | 39 | `4847f2f3ba26ac7d...` |
| 033 | Direta | `Utilizing Machine Learning Algorithms for the Development of Gully Erosion Susceptibility Maps - Semantic Scholar.pdf` | Pesquisador(es) do Estudo (2026) | Utilizing Machine Learning Algorithms for the Developme... | Modelagem Preditiva com Machine Lea | 26 | `f9a4d8d84f3188d1...` |
| 034 | Direta | `Vrieling_2006_Satellite_remote_sensing_water_erosion_review.pdf` | Anton Vrieling (2006) | Satellite remote sensing for water erosion assessment: ... | Sensoriamento Remoto Orbital / Prox | 17 | `08e2c12310079953...` |
| 035 | Direta | `water-18-02255.pdf` | Carmen Patino-Alonso, Fernando... (2026) | Assessing the Spatial Transferability of Annual Soil Er... | Modelagem Preditiva com Machine Lea | 23 | `b62a7d4136e40b9c...` |
| 036 | Relacionada | `13104+-+Avaliação+da+Susceptibilidade+à+Erosão+Laminar+no+Alto+Banabuiú+(CE).pdf` | Claudio Smalley Soares Pereira (2022) | Avaliação da Susceptibilidade à Erosão Laminar no Alto ... | Modelagem Empírica (RUSLE/USLE) / S | 23 | `f25b9f1c1cfd6bd0...` |
| 037 | Relacionada | `13659-45240-1-SM.pdf` | Thiago Neto (2022) | eISSN: 2358-1778 | Modelagem Empírica (RUSLE/USLE) / S | 22 | `7b9dd629f0f62d06...` |
| 038 | Relacionada | `232.pdf` | Proprietario (2022) | XV Simpósio Brasileiro de Recursos Hídricos 1 | Modelagem Empírica (RUSLE/USLE) / S | 13 | `23cec88af24c0dc2...` |
| 039 | Relacionada | `35cbe_149-154.pdf` | Aline Bentes PINTO; Leonardo C... (2019) | Utilização do mapeamento de suscetibilidade à erosão la... | Modelagem Empírica (RUSLE/USLE) / S | 7 | `f39d9ab20efa6091...` |
| 040 | Relacionada | `59130+Texto+do+artigo-263494-2-15-20210615.pdf` | Letícia Bueno de Oliveira Roch... (2022) | Caminhos de Geografia Uberlândia-MG v. 23, n. 87 jun./2... | Modelagem Empírica (RUSLE/USLE) / S | 22 | `55d9eaf09a4db4df...` |
| 041 | Relacionada | `63077+POTENCIAL+À+EROSÃO+LAMINAR+NA+BACIA+HIDROGRÁFICA+DO+RIBEIRÃO+DOURADINHO,+NO+TRIÂNGULO+MINEIRO_.pdf` | João Victor Freitas Silva (2023) | Caminhos de Geografia Uberlândia-MG v. 24, n. 92 abr./2... | Modelagem Empírica (RUSLE/USLE) / S | 18 | `0ec6c453d556dc26...` |
| 042 | Relacionada | `A study utilizing USLE and RUSLE.pdf` | Ajay Kumar Taloor (2025) | Geospatial assessment of soil erosion in the Basantar a... | Modelagem Empírica (RUSLE/USLE) / S | 14 | `146e825ff97ec921...` |
| 043 | Relacionada | `admin,+05-24-final.pdf` | Vítor Pereira (2015) | Jataí-GO | n.24 | Jan-Jun/2015 | Modelagem Empírica (RUSLE/USLE) / S | 17 | `d98beae516d7df6c...` |
| 044 | Relacionada | `admin,+Art.+5+-+Análise+da+Suscetibilidade+-+RBG+11+Nº+2.pdf` | Pesquisador(es) do Estudo (2010) | Geomorfologia 11n2.p65 | Modelagem Empírica (RUSLE/USLE) / S | 10 | `4a24404a51f8bc5f...` |
| 045 | Relacionada | `admin,+RBG_Ano_7_n_2_2006_73_85.pdf` | Pesquisador(es) do Estudo (2006) | E--NOVAPA~1-RGB_7.2.mdi | Modelagem Empírica (RUSLE/USLE) / S | 13 | `f3045e3d298a3a1e...` |
| 046 | Relacionada | `Aplicação de Aprendizado Profundo e Análise Geoespacial.pdf` | Mohammed Hlal, Bilal El Monhim... (2025) | Application of Deep Learning and Geospatial Analysis in... | Modelagem Empírica (RUSLE/USLE) / S | 23 | `2c290a45d2abbd90...` |
| 047 | Relacionada | `Aplicação de Redes Neurais Convolucionais para Prever a Erosão do Solo.pdf` | Chao Liu, Han Li, Jiuzhe Xu, W... (2023) | Applying Convolutional Neural Network to Predict Soil E... | Modelagem Empírica (RUSLE/USLE) / S | 21 | `64f16475d717dd65...` |
| 048 | Relacionada | `Applied and Environmental Soil Science - 2021 - García - Geospatial Analysis of Soil Ero.pdf` | Pesquisador(es) do Estudo (2021) | Geospatial Analysis of Soil Erosion including Precipita... | Modelagem Empírica (RUSLE/USLE) / S | 21 | `282f4aded1add0d4...` |
| 049 | Relacionada | `ASSESSING OF SOIL EROSION RISK.pdf` | Pesquisador(es) do Estudo (2022) | ChapterBook ver 0.29_rev1 | Modelagem Empírica (RUSLE/USLE) / S | 54 | `c97e4bf280f42e95...` |
| 050 | Relacionada | `Carvalho_EstimativaDePerdaDeSoloPoErosaoLaminarEmLucena_2019.pdf` | Ana Camino (2019) | 2019 | Modelagem Empírica (RUSLE/USLE) / S | 12 | `01764f6d3eed05f1...` |
| 051 | Relacionada | `CerriCarlosEduardoPellegrino.pdf` | Pesquisador(es) do Estudo (1999) | MAPEAMENTO DAS ÁREAS DE RISCO DE EROSÃO DOS | Modelagem Empírica (RUSLE/USLE) / S | 107 | `dfcba3289c267b3a...` |
| 052 | Relacionada | `Comprehensive Review on Surface Soil.pdf` | Mohit Kashyap (2022) | Comprehensive Review on Surface Soil Erosion: Current A... | Modelagem Empírica (RUSLE/USLE) / S | 22 | `073440078ec1af8a...` |
| 053 | Relacionada | `contgeo,+27-V_SGFNE_LISBOA_ET_AL_EIXO_05.pdf` | Melchior Nascimento (2024) | PÁGINA 317 | Modelagem Empírica (RUSLE/USLE) / S | 9 | `41c75ae7e976217e...` |
| 054 | Relacionada | `Detecting_Analyzing_and_Predicting_Land_UseLand_Co.pdf` | Salman A. H. Selmy, Dmitry E. ... (2023) | Detecting, Analyzing, and Predicting Land Use/Land Cove... | Modelagem Empírica (RUSLE/USLE) / S | 26 | `46e7d364124a5ec1...` |
| 055 | Relacionada | `dissertacao_elaine_final (2)_compressed.pdf` | Elaine Eluizy Ribeiro Silva (2021) | Modelagem de Perda de Solo por Erosão Laminar em Cenári... | Modelagem Empírica (RUSLE/USLE) / S | 75 | `52357fdf4a827255...` |
| 056 | Relacionada | `Elaboracao_das_Cartas_de_Suscetibilidade.pdf` | Pesquisador(es) do Estudo (2012) | Petsch, C.; Zucchi, V. P.; Bravo, J. V. M.; Bueno, M. B... | Modelagem Empírica (RUSLE/USLE) / S | 12 | `250874d39b919e13...` |
| 057 | Relacionada | `Estrutura modular com IA funde imagens Sentinel para detecção robusta de deslizamentos de terra.pdf` | Ioannis Nasios (2022) | Multi-Modal Landslide Detection from Sentinel-1 SAR and... | Modelagem Empírica (RUSLE/USLE) / S | 30 | `616d7bd2d96d003c...` |
| 058 | Relacionada | `Estudo_Da_Erosao_Laminar_Em_Municipio_PR.pdf` | Marina de Souza Muniz1, Júlio ... (2015) | You are free: to copy, distribute and transmit the work... | Modelagem Empírica (RUSLE/USLE) / S | 17 | `1e155a631d88dfc5...` |
| 059 | Relacionada | `fabiobreunig,+20_Espacialização+da+perda+de+solos.pdf` | Home (2011) | RA´E GA 23 (2011), p. 534-554 www.geografia.ufpr.br/rae... | Modelagem Empírica (RUSLE/USLE) / S | 21 | `e8446ef8d72fd3aa...` |
| 060 | Relacionada | `geografar,+12106-39730-1-CE.pdf` | sirtoli (2007) | Curitiba, v.2, n.2, p.172-188, jul./dez. 2007 ISSN: 198... | Modelagem Empírica (RUSLE/USLE) / S | 17 | `89a44c63ae5f5262...` |
| 061 | Relacionada | `Geoprocessamento Aplicado na Caracterizacao de Bacias Hidrograficas Visando a sua Sustentbilidade.pdf` | Usuário do Windows (2021) | Sérgio Campos - Marcelo Campos | Modelagem Empírica (RUSLE/USLE) / S | 182 | `99432c15d078cfc2...` |
| 062 | Relacionada | `Geoprocessamento-Aplicada-no-Planejamento-de-Bacias-Hidrograficas-1.pdf` | Flávia Luize Pereira de Souza (2019) | Geoprocessamento Aplicado no | Modelagem Empírica (RUSLE/USLE) / S | 137 | `eab09f117b782c12...` |
| 063 | Relacionada | `Identificacao_De_Areas_Criticas_De_Erosao Laminar.pdf` | Pesquisador(es) do Estudo (2013) | Sociedade Brasileira de Cartografia, Geodésia, Fotogram... | Modelagem Empírica (RUSLE/USLE) / S | 14 | `af621a82ae27302f...` |
| 064 | Relacionada | `Integrated image processing and machine learning framework.pdf` | Shubham Kumar (2025) | Integrated image processing and machine learning framew... | Modelagem Empírica (RUSLE/USLE) / S | 13 | `cfcc560c9c0fe56d...` |
| 065 | Relacionada | `Integrating_Remote_Sensing_GIS_and_AI_Technologies.pdf` | Pesquisador(es) do Estudo (2022) | 0005976638.INDD | Modelagem Empírica (RUSLE/USLE) / S | 21 | `d50af48a6c7a6fd8...` |
| 066 | Relacionada | `LUZIANE-SANTOS-RIBEIRO.pdf` | LUZIANE SANTOS RIBEIRO (2006) | AN`LISE QUALITATIVA E QUANTITATIVA DE EROSˆO | Modelagem Empírica (RUSLE/USLE) / S | 158 | `7ab59e6777b99077...` |
| 067 | Relacionada | `Mapeamento_da_vulnerabilidade_geoambient.pdf` | Pesquisador(es) do Estudo (2007) | Arquivo digital disponível on-line no site www.sbgeo.or... | Modelagem Empírica (RUSLE/USLE) / S | 9 | `59721860f5d182bb...` |
| 068 | Relacionada | `Mapeamento_do_potencial_de_erosao_lamina.pdf` | Pesquisador(es) do Estudo (2011) | 731Mapeamento do potencial de erosão laminar na bacia d... | Modelagem Empírica (RUSLE/USLE) / S | 10 | `068a338736355d05...` |
| 069 | Relacionada | `Mapeamento_Por_Tecnicas_De_Geoprocessame.pdf` | Pesquisador(es) do Estudo (2014) | XLIII Congresso Brasileiro de Engenharia Agrícola - CON... | Modelagem Empírica (RUSLE/USLE) / S | 4 | `6ef05655c1f8cf4e...` |
| 070 | Relacionada | `Modeling and Assessment of Land Degradation Vulnerability in Arid Ecosystem of Rajasthan Using Analytical Hierarchy Process and - Semantic Scholar.pdf` | Pesquisador(es) do Estudo (2026) | Modeling and Assessment of Land Degradation Vulnerabili... | Modelagem Empírica (RUSLE/USLE) / S | 23 | `2440d176326517da...` |
| 071 | Relacionada | `p103.pdf` | Pesquisador(es) do Estudo (2016) | Anais 6º Simpósio de Geotecnologias no Pantanal, Cuiabá... | Modelagem Empírica (RUSLE/USLE) / S | 10 | `f17ad0f6e65c102e...` |
| 072 | Relacionada | `Pesquisa sobre a previsão da degradação irregular do solo.pdf` | Pesquisador(es) do Estudo (2022) | Research on soil spotted | Modelagem Empírica (RUSLE/USLE) / S | 17 | `821e8f42c2ba8d19...` |
| 073 | Relacionada | `Potencial_a_erosao_laminar_utilizando_Si.pdf` | João Cândido André da Silva Ne... (2022) | Potencial à erosão laminar utilizando Sistema de Inform... | Modelagem Empírica (RUSLE/USLE) / S | 8 | `9bfa24eb708fb0be...` |
| 074 | Relacionada | `ppggeografia_danielsantanalanza_dissertacaomestrado.pdf` | Gui (2011) | Universidade Federal de Minas Gerais | Modelagem Empírica (RUSLE/USLE) / S | 151 | `b066150828552e2a...` |
| 075 | Relacionada | `Predicao_Da_Perda_De_Solo_Por_Erosao_Lam.pdf` | Letícia Bueno de Oliveira Roch... (2022) | Caminhos de Geografia Uberlândia-MG v. 23, n. 87 jun./2... | Modelagem Empírica (RUSLE/USLE) / S | 22 | `25935d876bbe4928...` |
| 076 | Relacionada | `PREMIO-MAPBIOMAS_VulnerabilidadeErosao_FINAL-Margareth-Simoes.pdf` | Rodrigo Demonte (2019) | Empresa Brasileira de Pesquisa Agropecuária | Modelagem Empírica (RUSLE/USLE) / S | 26 | `f7fd633d5f91bc1b...` |
| 077 | Relacionada | `Real-time_soil_erosion_detection_using_satellite_i.pdf` | Pesquisador(es) do Estudo (2025) | Vol.:(0123456789) | Modelagem Empírica (RUSLE/USLE) / S | 15 | `364601eb7b94ab74...` |
| 078 | Relacionada | `Relatorio_Tecnico_Suscetibilidade.pdf` | Rodrigo Demonte (2020) | Nota Técnica | Modelagem Empírica (RUSLE/USLE) / S | 2 | `81fb2440c2707c4e...` |
| 079 | Relacionada | `remotesensing-13-00155-v3.pdf` | Dmitry I. Rukhovich, Polina V.... (2022) | The Use of Deep Machine Learning for the Automated Sele... | Modelagem Empírica (RUSLE/USLE) / S | 28 | `8217b6443cb2c65c...` |
| 080 | Relacionada | `Research on Soil Erosion Based on Remote Sensing Technology.pdf` | Jiaqi Wang, Jiuchun Yang, Zhi ... (2025) | Research on Soil Erosion Based on Remote Sensing Techno... | Modelagem Empírica (RUSLE/USLE) / S | 31 | `423279a4fa62aae1...` |
| 081 | Relacionada | `salomao_fs_me_bauru.pdf` | Pesquisador(es) do Estudo (2020) | FERNANDA SOTA SALOMÃO | Modelagem Empírica (RUSLE/USLE) / S | 177 | `5675f9b47e18d557...` |
| 082 | Relacionada | `Spatiotemporal modeling of soil loss and sediment yield due to land use and land cover.pdf` | Pesquisador(es) do Estudo (2022) | Spatiotemporal modeling of soil loss and sediment yield... | Modelagem Empírica (RUSLE/USLE) / S | 26 | `f1558af8a36fb993...` |
| 083 | Relacionada | `SUSCETIBILIDADE_RISCO_EROSAO_LAMINAR.pdf` | Victoria (2004) | UNIVERSIDADE FEDERAL DE GOIÁS | Modelagem Empírica (RUSLE/USLE) / S | 149 | `535838f7f03f2148...` |
| 084 | Relacionada | `trabalho1_87.pdf` | Raimundo Almir Costa Conceicao (2022) | 17º Congresso Brasileiro de Geologia de Engenharia e Am... | Modelagem Empírica (RUSLE/USLE) / S | 14 | `2ee1e4965de4f80d...` |
| 085 | Relacionada | `transferir.pdf` | WalterLOVale (2011) | D:\RBEAA\v15n07\v15n07a12\086.1 | Modelagem Empírica (RUSLE/USLE) / S | 10 | `eb9b9f16151d870b...` |
| 086 | Relacionada | `USE+OF+REMOTE+SENSING+IN+EROSION+ANALYSIS+IN+THE+GENERAL+SAMPAIO+DAM+WATERSHED+-+CE.pdf` | nadilly oliveira (2026) | International Journal Semiarid –Vol. 9, n. 1. ISSN: 276... | Modelagem Empírica (RUSLE/USLE) / S | 14 | `2af345be91c403ff...` |
| 087 | Relacionada | `Uso_de_Tecnicas_de_Geoprocessamento.pdf` | Pesquisador(es) do Estudo (2020) | 1117 | Modelagem Empírica (RUSLE/USLE) / S | 15 | `1c000bd13c6032e6...` |
| 088 | Relacionada | `zeluiz,+02_Estimativa.pdf` | Laís (2016) | Estimativa de Perda de Solos por Erosão Laminar | Modelagem Empírica (RUSLE/USLE) / S | 14 | `2d42f6c38e1cd7b9...` |
| 089 | Triagem | `admin,+RBG_Ano_7_n_2_2006_73_85.pdf` | Pesquisador(es) do Estudo (2006) | E--NOVAPA~1-RGB_7.2.mdi | Validação Regional / Estrutura Fund | 13 | `f3045e3d298a3a1e...` |
| 090 | Triagem | `agb_xxvi_4-00.pdf` | Neo (2022) | Revista_AGB_XXVI-4.indb | Validação Regional / Estrutura Fund | 16 | `f19567db2db8df0d...` |
| 091 | Triagem | `AlissonA_Ribeiro_2026.pdf` | Claudio Schultz (2022) | UNIOESTE – UNIVERSIDADE ESTADUAL DO OESTE DO PARANÁ | Validação Regional / Estrutura Fund | 131 | `10df41566f6d6da0...` |
| 092 | Triagem | `Analise_espaco-temporal_da_erosao_hidrica_por_meio.pdf` | RBGF (2025) | Análise espaço-temporal da erosão hídrica por meio de m... | Validação Regional / Estrutura Fund | 28 | `af56c33162191200...` |
| 093 | Triagem | `Bloco+1+-+3+-+Manoel+et+al+SENSORIAMENTO+REMOTO+E+MACHINE+LEARNING.pdf` | antcneto (2022) | ¹Mestre pela UFAL, Instituto Nacional de Pesquisas Espa... | Validação Regional / Estrutura Fund | 23 | `e7df65fcccaf5ba7...` |
| 094 | Triagem | `Busca por artigos FLOW.pdf` | Luis Alfredo (2022) | Daily research update_ Laminar erosion and AI - Chat | Validação Regional / Estrutura Fund | 32 | `70247fcbb0fbc218...` |
| 095 | Triagem | `dissertacao_elaine_final (2).pdf` | Elaine Eluizy Ribeiro Silva (2021) | Modelagem de Perda de Solo por Erosão Laminar em Cenári... | Validação Regional / Estrutura Fund | 75 | `30438ff83b7dbd28...` |
| 096 | Triagem | `Erosodesoloemambienteamaznico.pdf` | Pesquisador(es) do Estudo (2022) | Editora CRV - Proibida a impressão e/ou comercialização | Validação Regional / Estrutura Fund | 156 | `5f12ce3588b97e89...` |
| 097 | Triagem | `Estimativa da perda de solo por erosão laminar usando ferramentas computacionais na agricultura de precisão.pdf` | * Corresponding author - E-mai... (2022) | Estimating soil loss by laminar erosion | Validação Regional / Estrutura Fund | 8 | `64ae9bfa593f2721...` |
| 098 | Triagem | `Estimativa de Perda de Solos por Erosão Laminar na Bacia Hidrográfica do Córrego.pdf` | Laís (2016) | Estimativa de Perda de Solos por Erosão Laminar | Validação Regional / Estrutura Fund | 14 | `2d42f6c38e1cd7b9...` |
| 099 | Triagem | `estimativaerosaolaminar.pdf` | Evelin Krug (2020) | UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ | Validação Regional / Estrutura Fund | 88 | `77f0bcfbaca0b086...` |
| 100 | Triagem | `geoprocessamentoerosaosolovalidacao.pdf` | Jaqueline de Moura (2022) | UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ | Validação Regional / Estrutura Fund | 184 | `e66a25cb1c454bc2...` |
| 101 | Triagem | `IV_SLGFA_1.pdf` | Messias (2022) | AVALIAÇÃO DO POTENCIAL NATURAL EROSIVO LAMINAR COM TÉCN... | Validação Regional / Estrutura Fund | 10 | `ea78a09a58b02f61...` |
| 102 | Triagem | `l+ARTIGO+7101+-+2023-03-09.pdf` | scien (2023) | Nature and Conservation | Validação Regional / Estrutura Fund | 12 | `fdcda7a0710af48e...` |
| 103 | Triagem | `Monitoramento de Erosão Laminar em Diferentes Usos da Terra.pdf` | Pesquisador(es) do Estudo (2008) | Sociedade & Natureza, Uberlândia, 20 (2): 157-175, DEZ.... | Validação Regional / Estrutura Fund | 19 | `0a12236c8646c0f1...` |
| 104 | Triagem | `perdasolobaciahidrografica.pdf` | Eduardo (2024) | UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ | Validação Regional / Estrutura Fund | 69 | `3484fca1086ab2e3...` |
| 105 | Triagem | `pereira_lh_me_rcla.pdf` | Camila (2022) | UNIVERSIDADE ESTADUAL PAULISTA | Validação Regional / Estrutura Fund | 125 | `4b59f4c94fa37fe4...` |
| 106 | Triagem | `Relatório de Curadoria e Auditoria Bibliográfica - Projeto SAREL.pdf` | Pesquisador(es) do Estudo (2026) | Relatório de Curadoria e Auditoria Bibliográfica - Proj... | Validação Regional / Estrutura Fund | 4 | `2497648afe4ccbb7...` |
| 107 | Triagem | `rgmf,+05+-+GUERRA,+A.+J.+T.;+JORGE,+M.+C.+O.;+RANGEL,+L.+A.;+BEZERRA,+J.+F.+R.;+LOUREIRO,+H.+A.+S.;+GARRITANO,+F.pdf` | Fábio Matos (2022) | EROSÃO DOS SOLOS, DIFERENTES ABORDAGENS E TÉCNICAS | Validação Regional / Estrutura Fund | 43 | `8deffc36d10a6ab4...` |
| 108 | Triagem | `TCC_Lucas Duarte Oliveira.pdf` | Lucas Duarte Oliveira (2022) | BACHARELADO EM ENGENHARIA AMBIENTAL | Validação Regional / Estrutura Fund | 46 | `8fc615b8d272fc7c...` |
| 109 | Triagem | `Trabalho-Apa-RNCS-.pdf` | Pesquisador(es) do Estudo (2022) | SENSORIAMENTO REMOTO APLICADO À EROSÃO DO SOLO NA PORÇÃ... | Validação Regional / Estrutura Fund | 1 | `fdd21595a91654f9...` |
| 110 | Triagem | `Técnicas de Sensoriamento Remoto.pdf` | Pesquisador(es) do Estudo (2025) | ' 10.37885/250920122 | Validação Regional / Estrutura Fund | 25 | `0fbf04fc6f2dde3c...` |
| 111 | Seminal | `agisprocedureforautomaticallycalculatingtheUSLELSfactorontopographicallycom.pdf` | Robert Hickey (2000) | A GIS procedure for automatically calculating the USLE ... | Topografia / MDE / Cálculo Automati | 8 | `e3b45734da57316c...` |
| 112 | Seminal | `Rufino, Biscaia e Merten (1993).pdf` | R. L. Rufino, R. C. M. Biscaia... (1993) | Determinação do potencial de erosão das chuvas do Estad... | Fator R da USLE / Erosividade das C | 6 | `149fb993bb1baef2...` |

---

## 4. Fichamento Analítico-Crítico: Pesquisas Diretamente Relacionadas (35 Obras)

As obras deste grupo constituem o núcleo duro metodológico do SAREL. Focam especificamente na detecção, predição e mapeamento de suscetibilidade à erosão utilizando algoritmos avançados de Machine Learning (XGBoost, Random Forest, SVM, ensembles), sensoriamento remoto de média e alta resolução, e fundamentações seminais contra data leakage e dependência espacial.


### 001. 10452-29467-1-PB.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/10452-29467-1-PB.pdf`
- **Integridade Criptográfica (SHA-256):** `f6712f8f50d6b2f5d50b1275980399348c1f77b503878bf814545261f3348eed`
- **Extensão:** 15 páginas | **Tamanho:** 818,899 bytes
- **Referência Formal:** **BEEI (2025)**. *Bulletin of Electrical Engineering and Informatics*. Remote Sensing. DOI/URL: `10.11591/eei.v14i6.10452`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Bulletin of Electrical Engineering and Informatics Vol. 14, No. 6, December 2025, pp. 4797~4811 ISSN: 2302-9285, DOI: 10.11591/eei.v14i6.10452  4797 Journal homepage: http://beei.org...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 002. agronomy-16-00294-v2.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/agronomy-16-00294-v2.pdf`
- **Integridade Criptográfica (SHA-256):** `5a7cc612826ee4a43981d4dd1d4f5baea16a3a09380bac49ec8d687b56f1cfc2`
- **Extensão:** 21 páginas | **Tamanho:** 3,451,363 bytes
- **Referência Formal:** **Melek Işik, Mehmet Işik, Mert Acar, Taofeek Samuel Wahab, Yakup Kenan Koca and Cenk Şahin (2026)**. *Mapping Soil Erodibility Using Machine Learning and Remote Sensing Data Fusion in the Northern Adana Region, Türkiye*. Land. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Academic Editor: Jayme Garcia Arnal Barbedo Received: 8 December 2025 Revised: 4 January 2026...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 003. Análise espaço_temporal da degradação usando aprendizado de máquina e técnicas geoespaciais..pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Análise espaço_temporal da degradação usando aprendizado de máquina e técnicas geoespaciais..pdf`
- **Integridade Criptográfica (SHA-256):** `1478d3f8c9fffd6272a2f5202da0ac9487321cf2f55e055a5ad959a1868d680e`
- **Extensão:** 39 páginas | **Tamanho:** 6,683,945 bytes
- **Referência Formal:** **Ahmed et al. Discover Geoscience (2026) 4:76 (2026)**. *RESEARCH Open Access*. Land. DOI/URL: `10.1007/s44288-026-00465-x`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** RESEARCH Open Access © The Author(s) 2026. Open Access This article is licensed under a Creative Commons Attribution 4.0 International License, which permits use, sharing, adaptation, distribution and reproduction in any medium or format, as long as you give appropriate credit to the original author(s) and the source, provide a link to the Creative Commons licence, and indicate if changes were made. The images or other third party material in this article...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 004. Avaliação da degradação do solo utilizando computação flexível baseada em SIG e algoritmos avançados de aprendizado de máquina.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Avaliação da degradação do solo utilizando computação flexível baseada em SIG e algoritmos avançados de aprendizado de máquina.pdf`
- **Integridade Criptográfica (SHA-256):** `373509650679024fd4a04fc8854e6f201de22585fb499180e705822730780f6a`
- **Extensão:** 28 páginas | **Tamanho:** 4,880,854 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2025)**. *RESEARCH Open Access*. Land. DOI/URL: `10.1007/s44288-025-00187-6`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** RESEARCH Open Access © The Author(s) 2025. Open Access This article is licensed under a Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License, which permits any non-commercial use, sharing, distribution and reproduction in any medium or format, as long as you give appropriate credit to the original author(s) and the source, provide a link to the Creative Commons licence, and indicate if you modified the licensed material....
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 005. CNPS-DOC-246-2024.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/CNPS-DOC-246-2024.pdf`
- **Integridade Criptográfica (SHA-256):** `4256459f154c2fe2c3aeaf83cc8d3e86d5744ff14c792f0d907afaef66536996`
- **Extensão:** 40 páginas | **Tamanho:** 1,852,923 bytes
- **Referência Formal:** **Embrapa Solos (Geraldo et al. / Santos et al.) (2024)**. *Erodibilidade dos solos do Brasil: consolidação e valores de referência para o Fator K da USLE*. Embrapa Solos, Documentos 246, Rio de Janeiro - RJ, Dezembro de 2024, 40 p.. DOI/URL: `ISSN 1517-2627 / e-ISSN 2966-2443`
- **Foco Metodológico:** Pedologia / Erodibilidade / Fator K da USLE / Tabela Normativa Embrapa
- **Escopo / Ambiência Geográfica:** Paraná / Brasil / Global
- **Síntese do Conteúdo:** Pilar Central 4 do SAREL: Apresenta na Tabela 5 (páginas 13 a 15) a conversão normativa oficial das classes qualitativas da Embrapa para valores contínuos do Fator K.
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta valores contínuos de Fator K (t·ha·h·ha⁻¹·MJ⁻¹·mm⁻¹) para Latossolos, Nitossolos, Neossolos e Argissolos paranaenses baseados em Mannigel et al. (2002) e IBGE (2018).
  - **O que a fonte NÃO sustenta:** NÃO sustenta calibração direta para horizontes compactados por tráfego de maquinário pesado em agricultura de precisão.

### 006. Comparative-evaluation-of.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Comparative-evaluation-of.pdf`
- **Integridade Criptográfica (SHA-256):** `8c19163797c1bfd2195fd2abdbe94e0dbf12dd63c6ad3fe96b05c69c9b0558ea`
- **Extensão:** 17 páginas | **Tamanho:** 3,102,832 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2022)**. *INTRODUCTION*. Remote Sensing. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** INTRODUCTION Soil erosion is a critical environmental issue that degrades land resources due to natural forces such as rain, wind, water flow, ice, and other en -...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 007. Comparison of machine learning models for gully erosion susceptibility mapping.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Comparison of machine learning models for gully erosion susceptibility mapping.pdf`
- **Integridade Criptográfica (SHA-256):** `21d90043305fb28b584e26971c1d303b8b4db89db1ebc552e2a050f37bbe5632`
- **Extensão:** 13 páginas | **Tamanho:** 282,000 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2026)**. *Comparison of machine learning models for gully erosion susceptibility mapping*. Periódico / Repositório Científico Indexado. DOI/URL: `10.1016/j.gsf.2019.11.009`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Comparison of machine learning models for gully erosion susceptibility mapping Model sourceFile: "Comparison of machine learning models for gully...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 008. Deteccao-de-feicoes-erosivas-em-bacias-hidrograficas-2025.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Deteccao-de-feicoes-erosivas-em-bacias-hidrograficas-2025.pdf`
- **Integridade Criptográfica (SHA-256):** `793f8671dc7e732dfe36735b6c162ae328a739a42289ef24ba061e3e82407abb`
- **Extensão:** 4 páginas | **Tamanho:** 916,725 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2025)**. *[Anais do XXI Simpósio Brasileiro de Sensoriamento Remoto] Detecção de feições erosivas em bacias hidrográficas por técnicas de Sensoriamento Remoto e classificação supervisionada com base em algoritmo de aprendizado de máquina | Galoá Proceedings*. Water. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** O presente estudo teve como finalidade o monitoramento e mapeamento de feições erosivas, tendo como área piloto a microbacia do Caiador localizada no município de Silvânia, Estado de Goiás (GO). Deste modo, recorreu -se ao uso de séries temporais de imagens de satélite Sentinel -2 (3 anos), amostras coletadas em tela d o computador e técnicas de Sensoriamento Remoto, como processamento digital de imagens e classificação supervisionada Random Forest . O VIgreen e o EVI foram os índices de vegetação mais importantes na classificação supervisionada Random Forest . As séries temporais de imagens S...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 009. Enhancing predictive modeling of interrill and rill erosion susceptibility.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Enhancing predictive modeling of interrill and rill erosion susceptibility.pdf`
- **Integridade Criptográfica (SHA-256):** `e7a847f167c776781aafcc38c6b24221e7572d27b08b436e8ab9c2bff49c3a6d`
- **Extensão:** 1 páginas | **Tamanho:** 6,339,122 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2022)**. *Enhancing predictive modeling of interrill and rill erosion susceptibility*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** ...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 010. galoa-proceedings-sbsr-2025-aplicacoes-de-aprendizado-de-maquina-para-modelagem-e-mapeamento.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/galoa-proceedings-sbsr-2025-aplicacoes-de-aprendizado-de-maquina-para-modelagem-e-mapeamento.pdf`
- **Integridade Criptográfica (SHA-256):** `bff39bad01950d1b39daec39ddd38dae1bfdc347a56a77495de720c96f59eb3d`
- **Extensão:** 4 páginas | **Tamanho:** 715,883 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2025)**. *[Anais do XXI Simpósio Brasileiro de Sensoriamento Remoto] APLICAÇÕES DE APRENDIZADO DE MÁQUINA PARA MODELAGEM E MAPEAMENTO DE EROSÃO NA BACIA HIDROGRAFICA DO RIO PARDO-BRASIL | Galoá Proceedings*. Water. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** A erosão do solo é uma ameaça à qualidade dos ecossistemas. Este estudo avalia os algoritmos Weighted Subspace Random Forest (WSRF), Random Rotation Forest (RRF) e Naive Bayes (NB) para mapear a suscetibilidade à erosão hídrica na bacia do Rio Pardo, entre São Paulo e Minas Gerais. Foram utilizados 120 pontos de amostras identificados por imagens de alta resolução e visitas de campo. Após a análise de multicolinearidade, treze fatores condicionantes foram selecionados para modelagem. Dividiu -se o conjunto d e dados em 70% para treinamento e 30% para teste, avaliando os modelos por acurácia e ...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 011. Integrated machine learning and geospatial analysis enhanced gully erosion susceptibility modeling in the Erer watershed in East - Semantic Scholar.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Integrated machine learning and geospatial analysis enhanced gully erosion susceptibility modeling in the Erer watershed in East - Semantic Scholar.pdf`
- **Integridade Criptográfica (SHA-256):** `f6535d1bf8a52b18d7b0431af0a0902843ef707f97c60029a7af6de83587e7a0`
- **Extensão:** 27 páginas | **Tamanho:** 455,566 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2026)**. *Integrated machine learning and geospatial analysis enhanced gully erosion susceptibility modeling in the Erer watershed in East - Semantic Scholar*. Remote Sensing. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Integrated machine learning and geospatial analysis enhanced gully erosion susceptibility modeling in the Erer watershed in East - Semantic Scholar Model...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 012. Integração de dados geoespaciais de alta precisão e abordagens de aprendizado de máquina.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Integração de dados geoespaciais de alta precisão e abordagens de aprendizado de máquina.pdf`
- **Integridade Criptográfica (SHA-256):** `0c6a4ff6d90afeb006ea25be55f2f74cf6d4d829e221ab89a014de597932d2fc`
- **Extensão:** 23 páginas | **Tamanho:** 10,317,666 bytes
- **Referência Formal:** **Hamza Bouguerra, Salah Eddine Tachi, Hamza Bouchehed, Gordon Gilja, Nadir Aloui, Yacine Hasnaoui, Abdelmalek Aliche, Saâdia Benmamar and Jose Navarro-Pedreño (2023)**. *Integration of High-Accuracy Geospatial Data and Machine Learning Approaches for Soil Erosion Susceptibility Mapping in the Mediterranean Region: A Case Study of the Macta Basin, Algeria*. Land. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Citation: Bouguerra, H.; Tachi, S.E.; Bouchehed, H.; Gilja, G.; Aloui, N.; Hasnaoui, Y.; Aliche, A.; Benmamar, S.; Navarro-Pedreño, J. Integration of...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 013. jh0260072.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/jh0260072.pdf`
- **Integridade Criptográfica (SHA-256):** `40412123c7104c705cde1838d1e3b0a337bc5cc9716d39c8bbe6dd471d284599`
- **Extensão:** 16 páginas | **Tamanho:** 1,433,307 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2022)**. *Mapping of soil erosion susceptibility using advanced machine learning models at Nghe*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Mapping of soil erosion susceptibility using advanced machine learning models at Nghe An, Vietnam Chien Quyet Nguyen a, Tuyen Thi Tran b,*, Trang Thanh Thi Nguyen b, Thuy Ha Thi Nguyen c,d, T. S. Astarkhanova d, Luong Van Vu c, Khac Tai Dau c, Hieu Ngoc Nguyen e, Giang Hu ̛ơng Pham f, Duc Dam Nguyen g, Indra Prakash h...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 014. jwc2025603.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/jwc2025603.pdf`
- **Integridade Criptográfica (SHA-256):** `fd6d5e2a8ae64fa03861c2d289eda01e191673b62c10c42ef72067a9befcbc66`
- **Extensão:** 18 páginas | **Tamanho:** 1,276,114 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2022)**. *Tree-based machine learning algorithms for soil erosion vulnerability (SEV) prediction in*. Remote Sensing. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Tree-based machine learning algorithms for soil erosion vulnerability (SEV) prediction in Saddang Watershed, south Sulawesi, Indonesia Muhammad Ramdhan Olii a,*, Abdul Kadir Zailani Olii a, Aleks Olii a, Rahman Abdul Djau a,...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 015. Karydas_Panagos_2018_The_G2_erosion_model_month_time_step_assessments.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Karydas_Panagos_2018_The_G2_erosion_model_month_time_step_assessments.pdf`
- **Integridade Criptográfica (SHA-256):** `8c133b1e46049f378968d8a31d1d1cef819ae97facc2c3a340dbd64f74108708`
- **Extensão:** 13 páginas | **Tamanho:** 42,580 bytes
- **Referência Formal:** **Christos G. Karydas, Panos Panagos (2018)**. *The G2 erosion model: An algorithm for month-time step assessments*. Environmental Research, v. 161, p. 115-124 (PMC5773245). DOI/URL: `10.1016/j.envres.2017.11.009`
- **Foco Metodológico:** Modelo Físico-Dinâmico G2 / Interação Chuva × Cobertura Vegetal / Passos Temporais Mensais
- **Escopo / Ambiência Geográfica:** Paraná / Brasil / Global
- **Síntese do Conteúdo:** Pilar Central 6 do SAREL: Provê a equação física de interação entre energia de chuva extrema e vulnerabilidade do solo descoberto (Rt * (1 - Ct)) incorporada às features do XGBoost.
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a formulação matemática de que a erosão laminar resulta da coocorrência da energia cinética da precipitação com a fração de solo exposto.
  - **O que a fonte NÃO sustenta:** NÃO sustenta que os coeficientes empíricos do G2 calibrados para o Mediterrâneo sejam transponíveis diretamente para a Bacia do Paraná sem retreinamento.

### 016. Kaufman_2012_EmbrapaSoja_Fundamentacao_Guarda_Temporal_Data_Leakage.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Kaufman_2012_EmbrapaSoja_Fundamentacao_Guarda_Temporal_Data_Leakage.pdf`
- **Integridade Criptográfica (SHA-256):** `1d20c09cf25e62d4a16ae9b3a8392baf6dd108a43b6f4ef6a0b872e70ebe3833`
- **Extensão:** 1 páginas | **Tamanho:** 3,495 bytes
- **Referência Formal:** **Compilação formal metodológica SAREL (apoiada em Kaufman et al., 2012 e Embrapa Soja) (2012/2026)**. *Fundamentação Teórica: Guarda Temporal de 2 Anos e Prevenção de Data Leakage*. ACM Transactions on Knowledge Discovery from Data (TKDD) & Embrapa Soja (Sistemas de Produção). DOI/URL: `10.1145/2089094.2089095 (Kaufman et al., 2012)`
- **Foco Metodológico:** Prevenção de Vazamento de Dados (Data Leakage) / Particionamento Temporal / Rotação de Culturas
- **Escopo / Ambiência Geográfica:** Paraná / Brasil / Global
- **Síntese do Conteúdo:** Pilar Central 3 do SAREL: Define a separação temporal obrigatória de 24 meses (2 anos) entre janelas amostrais para respeitar o ciclo agrícola bienal do Paraná (soja-trigo-milho safrinha).
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o princípio de learn-predict separation e a independência temporal estrita em séries temporais de aprendizado de máquina.
  - **O que a fonte NÃO sustenta:** NÃO sustenta que 24 meses elimina a autocorrelação espacial; por isso o SAREL exige cumulativamente o thinning espacial de 1 km.

### 017. land-13-01665-v2.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/land-13-01665-v2.pdf`
- **Integridade Criptográfica (SHA-256):** `708895d867f2111f746ba991ef5be0abc67608bedf909e0c6f27cdb43aba3ad6`
- **Extensão:** 21 páginas | **Tamanho:** 3,918,759 bytes
- **Referência Formal:** **Jorge da Paixão Marques Filho, Antônio José Teixeira Guerra, Carla Bernadete Madureira Cruz, Maria do Carmo Oliveira Jorge and Colin A. Booth (2024)**. *Machine Learning Models for the Spatial Prediction of Gully Erosion Susceptibility in the Piraí Drainage Basin, Paraíba Do Sul Middle Valley, Southeast Brazil*. Land. DOI/URL: `10.3390/land13101665`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Citation: Filho, J.d.P .M.; Guerra, A.J.T.; Cruz, C.B.M.; Jorge, M.d.C.O.; Booth, C.A. Machine Learning Models for the Spatial Prediction of Gully...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 018. land-14-00163-v3.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/land-14-00163-v3.pdf`
- **Integridade Criptográfica (SHA-256):** `6969a67a1f2548b196e208e6d270be78a4a86dea9bc06a19a6dee51dca28ee48`
- **Extensão:** 22 páginas | **Tamanho:** 5,777,655 bytes
- **Referência Formal:** **Tünde Takáts, László Pásztor, Mátyás Árvai, Gáspár Albert and János Mészáros (2025)**. *Testing the Applicability and Transferability of Data-Driven Geospatial Models for Predicting Soil Erosion in Vineyards*. Remote Sensing. DOI/URL: `10.3390/land14010163`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Academic Editor: Zisheng Xing Received: 3 December 2024 Revised: 8 January 2025 Accepted: 11 January 2025...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 019. Machine Learning Models for the Spatial Prediction of Gully Erosion Susceptibility in the Piraí Drainage Basin Paraíba Do Sul Middle Valley Southeast Brazil.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Machine Learning Models for the Spatial Prediction of Gully Erosion Susceptibility in the Piraí Drainage Basin Paraíba Do Sul Middle Valley Southeast Brazil.pdf`
- **Integridade Criptográfica (SHA-256):** `12a75e545762f43998b2c24441092dc7cb6ff21d85b24c43886d1d09d76a6c19`
- **Extensão:** 10 páginas | **Tamanho:** 280,434 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2026)**. *Machine Learning Models for the Spatial Prediction of Gully Erosion Susceptibility in the Piraí Drainage Basin, Paraíba Do Sul Middle Valley, Southeast Brazil - IDEAS/RePEc*. Land. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Machine Learning Models for the Spatial Prediction of Gully Erosion Susceptibility in the Piraí Drainage Basin, Paraíba Do Sul Middle Valley, Southeast Brazil - IDEAS/RePEc...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 020. Mapeamento da suscetibilidade à erosão regressiva.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Mapeamento da suscetibilidade à erosão regressiva.pdf`
- **Integridade Criptográfica (SHA-256):** `6141f12f6f63496687c7b4331db306ecd9a25a92573d567a196ea62f379da533`
- **Extensão:** 19 páginas | **Tamanho:** 4,875,829 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2022)**. *Head-cut gully erosion*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Head-cut gully erosion susceptibility mapping in semi-arid region using machine learning methods: insight from the...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 021. Mapping Soil Erosion Classes using Remote Sensing Data and Ensemble Models.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Mapping Soil Erosion Classes using Remote Sensing Data and Ensemble Models.pdf`
- **Integridade Criptográfica (SHA-256):** `9c9385b72bcb3c2d8c62789758baf6fa4aeed3408aeefc5756c55462242322bd`
- **Extensão:** 8 páginas | **Tamanho:** 2,137,228 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2022)**. *Mapping Soil Erosion Classes using Remote Sensing Data and Ensemble Models*. Remote Sensing. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Soil loss by water erosion is projected to increase by 13 - 22.5% in the European Union (EU) and United Kingdom (UK) by 2050, leading to loss of cultivable land and soil structure degradation. Accurate mapping of soil erosion is crucial for identifying vulnerable areas and implementing sustainable land management practices. In this study, we introduce machine learning (ML) models to map soil erosion, leveraging their capabilities in categorical mapping. Unlike previous applications that primarily mapped the absence or presence of a soil erosion class, we propose an ensemble strategy using thre...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 022. Prediction of gully erosion susceptibility mapping using novel ensemble machine learning algorithms - OPUS at UTS.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Prediction of gully erosion susceptibility mapping using novel ensemble machine learning algorithms - OPUS at UTS.pdf`
- **Integridade Criptográfica (SHA-256):** `5746353481d371b143bae5a687f5e9c12d2c3973be4a0540b9ba229e1bfee6e9`
- **Extensão:** 26 páginas | **Tamanho:** 488,802 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2026)**. *Prediction of gully erosion susceptibility mapping using novel ensemble machine learning algorithms - OPUS at UTS*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Prediction of gully erosion susceptibility mapping using novel ensemble machine learning algorithms - OPUS at UTS Model...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 023. Prediction of gully erosion susceptibility mapping using novel ensemble machine learning algorithms.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Prediction of gully erosion susceptibility mapping using novel ensemble machine learning algorithms.pdf`
- **Integridade Criptográfica (SHA-256):** `0ed2e9101d3e8b046c89d799aab39a1ac7077248bc3b3c9e0e82307906442a1c`
- **Extensão:** 31 páginas | **Tamanho:** 4,980,318 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2022)**. *Prediction of gully erosion susceptibility mapping using novel ensemble machine learning algorithms*. Water. DOI/URL: `10.1080/19475705.2021.1880977`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Geomatics, Natural Hazards and Risk ISSN: 1947-5705 (Print) 1947-5713 (Online) Journal homepage: www.tandfonline.com/journals/tgnh20 Prediction of gully erosion susceptibility mapping using novel ensemble machine learning...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 024. PREVISÃO DE CLASSES DE EROSÃO LAMINAR USANDO.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/PREVISÃO DE CLASSES DE EROSÃO LAMINAR USANDO.pdf`
- **Integridade Criptográfica (SHA-256):** `07bec135fecc5f944100a0d1b873052e2e0c797ffefc2cf6ebfcedb3df3ffcbc`
- **Extensão:** 10 páginas | **Tamanho:** 172,509 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2022)**. *XIII Simpósio Brasileiro de Recursos Hídricos 1*. Remote Sensing. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** A determinação do potencial de erosão laminar numa bacia hidrográfica requer extensivos trabalhos de campo o que demanda grande tempo além de representar custos elevados. Assim, neste trabalho é apresentada uma técnica que visa estimar qualitativamente o potencial de erosão laminar de uma bacia usando dados obtidos da class ificação de imagens digitais de sensoriamento remoto e dados derivados do processamento do modelo numérico do terreno, juntamente com técnicas de análise multivariada, especificamente o método de agrupamento. O produto final é um mapa com o zoneamento da b acia em termos de...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 025. Roberts_2017_Cross_validation_strategies_spatial_temporal_structure.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Roberts_2017_Cross_validation_strategies_spatial_temporal_structure.pdf`
- **Integridade Criptográfica (SHA-256):** `14c31173f60c662d727bbf20f269ca565265a1fbe9cd8818a1ce8ab8fa5fcd27`
- **Extensão:** 56 páginas | **Tamanho:** 1,106,830 bytes
- **Referência Formal:** **David R. Roberts, Volker Bahn, Simone Ciuti et al. (2017)**. *Cross-validation strategies for data with temporal, spatial, or phylogenetic structure*. Ecography, v. 40, n. 8, p. 913-929. DOI/URL: `10.1111/ecog.02881`
- **Foco Metodológico:** Validação Cruzada Espacial (Spatial Cross-Validation) / Block CV / Quebra da Hipótese I.I.D.
- **Escopo / Ambiência Geográfica:** Paraná / Brasil / Global
- **Síntese do Conteúdo:** Pilar Central 5 do SAREL: Fundamenta a rejeição do k-fold aleatório convencional e adoção obrigatória de validação por blocos espaciais e thinning de 1 km.
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta que amostras espacialmente dependentes geram acurácias e AUCs severamente superestimadas se avaliadas por amostragem aleatória simples.
  - **O que a fonte NÃO sustenta:** NÃO prescreve um buffer métrico universal fixo para todas as bacias; o buffer de 1 km do SAREL é escolha metodológica operacional apoiada na extensão dos polígonos amostrais.

### 026. Safanelli_Dematte_2021_Fine_scale_soil_mapping_EO_data_GEOS3.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Safanelli_Dematte_2021_Fine_scale_soil_mapping_EO_data_GEOS3.pdf`
- **Integridade Criptográfica (SHA-256):** `1f05f84f32e3114a6cf3e1729396f9f08e8952c3c5fd01e2f3358982dfd93715`
- **Extensão:** 20 páginas | **Tamanho:** 2,945,488 bytes
- **Referência Formal:** **José Lucas Safanelli, José Alexandre Melo Demattê et al. (2021)**. *Fine scale soil mapping from earth observation data: the Geospatial Soil Sensing System (GEOS3)*. Revista Brasileira de Ciência do Solo (RBCS), v. 45, e0210080. DOI/URL: `10.36783/18069657rbcs20210080`
- **Foco Metodológico:** Mapeamento Digital de Solos / GEOS3 / Synthetic Soil Image (SYSI) / Limiar de Solo Exposto
- **Escopo / Ambiência Geográfica:** Paraná / Brasil / Global
- **Síntese do Conteúdo:** Pilar Central 2 do SAREL: Justifica teoricamente e empiricamente o limiar de NDVI <= 0,25 para identificar solo exposto no Brasil em séries temporais de satélite.
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o limiar NDVI <= 0,25 para discriminação de solo nu contra palhada senescente de Plantio Direto e vegetação residual no território brasileiro sob imagens Sentinel-2/Landsat.
  - **O que a fonte NÃO sustenta:** NÃO sustenta que pixels com NDVI <= 0,25 representem necessariamente solo erodido; apenas que representam solo desnudo suscetível.

### 027. sample_quantiles.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/sample_quantiles.pdf`
- **Integridade Criptográfica (SHA-256):** `c3ae245d4fff12466d3c849503d3f0ec7ffaec90c0c2adce07cd3c163ffcb6b6`
- **Extensão:** 5 páginas | **Tamanho:** 405,765 bytes
- **Referência Formal:** **Rob J. Hyndman, Yanan Fan (1996)**. *Sample Quantiles in Statistical Packages*. The American Statistician, v. 50, n. 4, p. 361-365. DOI/URL: `10.1080/00031305.1996.10473566`
- **Foco Metodológico:** Estatística Matemática / Definições de Quantis Amostrais / Distribuições Empíricas
- **Escopo / Ambiência Geográfica:** Paraná / Brasil / Global
- **Síntese do Conteúdo:** Trabalho Seminal Estatístico: Caso paradigmático citado na Norma de Lastro Científico (R-L3) sobre a diferença entre o que a fonte diz e extrapolações indevidas.
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta que com n observações ordenadas espera-se massa 1/(n+1) abaixo do mínimo amostral segundo a definição padrão de quantil.
  - **O que a fonte NÃO sustenta:** NÃO sustenta nenhum limiar operacional de número mínimo de observações para séries Sentinel-2 ou dados geoespaciais (aplicação dessa regra é decisão do pesquisador).

### 028. SILVA_2025MODELAGEM_PREDITIVA_NA_SUSCETIBILIDADE_.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/SILVA_2025MODELAGEM_PREDITIVA_NA_SUSCETIBILIDADE_.pdf`
- **Integridade Criptográfica (SHA-256):** `08d3980581903af8735a1426797825839e7d81f6e26d36c694e71f4270bd508b`
- **Extensão:** 10 páginas | **Tamanho:** 945,198 bytes
- **Referência Formal:** **Luiz Felipe de Oliveira Ramos (2022)**. *MODELAGEM PREDITIVA NA SUSCETIBILIDADE À EROSÃO EM*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** A região semiárida nordestina apresenta áreas extensas suscetíveis aos processos de degradação, a partir de fatores naturais, como também dos processos de uso e ocupação. Deste modo, torna-se necessário a identificação de setores críticos, a fim de contrib uir com a proteção e recuperação. Diante disso, objetivou-se identificar áreas suscetíveis aos processos erosivos em municípios no entorno do Lago de Itaparica em Pernambuco, como forma de identificar setores com maiores índices de suscetibilidade à erosão. A técnica utilizada, a Regressão Logística, adotou -se variáveis a partir do Modelo D...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 029. Soil erosion analysis based on machine learning method - Bulletin of Electrical Engineering and Informatics.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Soil erosion analysis based on machine learning method - Bulletin of Electrical Engineering and Informatics.pdf`
- **Integridade Criptográfica (SHA-256):** `1935e4627d2e9af8f541884fe2cfb4caf7cb049f582bef7d354ac17e15705670`
- **Extensão:** 29 páginas | **Tamanho:** 536,800 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2026)**. *Soil erosion analysis based on machine learning method - Bulletin of Electrical Engineering and Informatics*. Remote Sensing. DOI/URL: `10.11591/eei.v14i6.10452`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Soil erosion analysis based on machine learning method - Bulletin of Electrical Engineering and Informatics Model...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 030. sustainability-15-01939-v2.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/sustainability-15-01939-v2.pdf`
- **Integridade Criptográfica (SHA-256):** `2b59609400e731644041b99ae28411586c5f327c8c6ef87cf5497285e091e6a8`
- **Extensão:** 22 páginas | **Tamanho:** 6,882,397 bytes
- **Referência Formal:** **Ping Tu, Qianqian Zhou and Meng Qi (2023)**. *Soil Erosion Type and Risk Identification from the Perspective of Directed Weighted Complex Network*. Land. DOI/URL: `10.3390/su15031939`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Citation: Tu, P .; Zhou, Q.; Qi, M. Soil Erosion Type and Risk Identiﬁcation from the Perspective of Directed Weighted Complex Network....
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 031. The_Spatiotemporal_Evolution_Driving_Mechanisms_an.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/The_Spatiotemporal_Evolution_Driving_Mechanisms_an.pdf`
- **Integridade Criptográfica (SHA-256):** `18795ba0db374f609b6eab1d3df367e3955a8b32a75a79d1ee31e379a067f02b`
- **Extensão:** 29 páginas | **Tamanho:** 8,442,257 bytes
- **Referência Formal:** **Yangfei Huang, Chenjian Zhong, Yuan Wang and Wenbin Hua (2025)**. *The Spatiotemporal Evolution, Driving Mechanisms, and Future Climate Scenario-Based Projection of Soil Erosion in the Southwest China*. Land. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Academic Editors: Ioannis N. Daliakopoulos, Nikolaos L. Tsakiridis, Nikolaos Tziolas and Nikiforos Samarinas...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 032. Tree-based machine learning algorithms for soil erosion vulnerability prediction in Saddang Watershed-south Sulawesi-Indonesia _ Journal of Water and Clima Fixed.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Tree-based machine learning algorithms for soil erosion vulnerability prediction in Saddang Watershed-south Sulawesi-Indonesia _ Journal of Water and Clima Fixed.pdf`
- **Integridade Criptográfica (SHA-256):** `4847f2f3ba26ac7d5a6904e858e6f284050f77c26fbff43e8340d60f23506c62`
- **Extensão:** 39 páginas | **Tamanho:** 843,578 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2026)**. *Tree-based machine learning algorithms for soil erosion vulnerability (SEV) prediction in Saddang Watershed, south Sulawesi, Indonesia | Journal of Water and Climate Change*. Water. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Tree-based machine learning algorithms for soil erosion vulnerability (SEV) prediction in Saddang Watershed, south Sulawesi, Indonesia | Journal of Water and Climate Change...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 033. Utilizing Machine Learning Algorithms for the Development of Gully Erosion Susceptibility Maps - Semantic Scholar.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Utilizing Machine Learning Algorithms for the Development of Gully Erosion Susceptibility Maps - Semantic Scholar.pdf`
- **Integridade Criptográfica (SHA-256):** `f9a4d8d84f3188d1b88c9b9b6baec0fe1a4d8622c2e02de961b73c8a0c59e33d`
- **Extensão:** 26 páginas | **Tamanho:** 534,655 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2026)**. *Utilizing Machine Learning Algorithms for the Development of Gully Erosion Susceptibility Maps - Semantic Scholar*. Land. DOI/URL: `10.3390/su16156569`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Utilizing Machine Learning Algorithms for the Development of Gully Erosion Susceptibility Maps - Semantic Scholar Model...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

### 034. Vrieling_2006_Satellite_remote_sensing_water_erosion_review.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/Vrieling_2006_Satellite_remote_sensing_water_erosion_review.pdf`
- **Integridade Criptográfica (SHA-256):** `08e2c12310079953d5d71b6066e835753010fb2a37fdb213b84bda4774111427`
- **Extensão:** 17 páginas | **Tamanho:** 241,221 bytes
- **Referência Formal:** **Anton Vrieling (2006)**. *Satellite remote sensing for water erosion assessment: A review*. CATENA, v. 65, n. 1, p. 2-18. DOI/URL: `10.1016/j.catena.2005.10.005`
- **Foco Metodológico:** Sensoriamento Remoto Orbital / Proxies Espectrais vs. Resolução Centimétrica
- **Escopo / Ambiência Geográfica:** Paraná / Brasil / Global
- **Síntese do Conteúdo:** Pilar Central 1 do SAREL: Fundamenta a distinção epistemológica fundamental entre detecção direta de feições físicas (requer resolução centimétrica < 10 cm obtida via VANT) e detecção por proxies espectrais indiretos (resolução de 10m do Sentinel-2: redução de NDVI, exposição de horizontes subsuperficiais, perda de matéria orgânica).
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta que sensores orbitais de média resolução (10–30m) NÃO enxergam microrravinas laminares diretamente, mas capturam suas manifestações na biomassa vegetal e resposta espectral do solo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta que imagens Sentinel-2 substituem inspeção de campo ou levantamentos centimétricos por drone para delimitação geométrica milimétrica de perda de solo.

### 035. water-18-02255.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/water-18-02255.pdf`
- **Integridade Criptográfica (SHA-256):** `b62a7d4136e40b9cdffd238ab13de5d4d8c613c3f4fbe3686cf6be74b860ec19`
- **Extensão:** 23 páginas | **Tamanho:** 6,327,954 bytes
- **Referência Formal:** **Carmen Patino-Alonso, Fernando Espejo, José-Luis Molina, Santiago Zazo and María-Carmen Molina (2026)**. *Assessing the Spatial Transferability of Annual Soil Erosion Models Across Mediterranean Catchments Using Hierarchical and Ensemble Approaches*. Land. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Academic Editor: Wei Zhao Received: 27 July 2026 Revised: 2 September 2026 Accepted: 9 September 2026...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta o uso de modelos não lineares (árvores de decisão, XGBoost, Random Forest) acoplados a dados multiespectrais orbitais para estimativa de suscetibilidade.
  - **O que a fonte NÃO sustenta:** NÃO sustenta generalização para áreas sem calibração edafoclimática específica ou substituição da validação com verdade de campo primária.

---

## 5. Fichamento Analítico-Crítico: Pesquisas Relacionadas (53 Obras)

Este acervo compreende a base empírica e conceitual de apoio: aplicações regionais da Equação Universal de Perdas de Solo (USLE/RUSLE), modelagem em ambiente SIG, análises de sensoriamento remoto de bacias hidrográficas no Paraná e no Brasil, e abordagens correlatas de visão computacional.


### 036. 13104+-+Avaliação+da+Susceptibilidade+à+Erosão+Laminar+no+Alto+Banabuiú+(CE).pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/13104+-+Avaliação+da+Susceptibilidade+à+Erosão+Laminar+no+Alto+Banabuiú+(CE).pdf`
- **Integridade Criptográfica (SHA-256):** `f25b9f1c1cfd6bd0a33c264932b5bc4d09cdba5c238569ed8cae2f1b87daf26c`
- **Extensão:** 23 páginas | **Tamanho:** 1,211,041 bytes
- **Referência Formal:** **Claudio Smalley Soares Pereira (2022)**. *Avaliação da Susceptibilidade à Erosão Laminar no Alto Banabuiú (CE) por*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** A abordagem morfopedológica delimita compartimentos a partir da relação entre os aspectos litológicos, geomorfológicos e pedológicos, sendo muito utilizada para o diagnóstico e controle dos processos erosivos. Nesse sentido, a área analisada localiza-se na porção central do estado do Ceará, abrangendo parte das sub-bacias dos rios Patu, Miguel Rodrigues, Bonsucesso e do Meio. O objetivo geral da pesquisa é analisar a susceptibilidade a erosão laminar da bacia hidrográfica do Alto Banabuiú a partir da compartimentação morfopedológica. Decidiu-se pela utilização da análise integrada do ambiente,...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 037. 13659-45240-1-SM.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/13659-45240-1-SM.pdf`
- **Integridade Criptográfica (SHA-256):** `7b9dd629f0f62d06beef896226b4783f580eca3069b63811da3e0af46781aecb`
- **Extensão:** 22 páginas | **Tamanho:** 1,860,748 bytes
- **Referência Formal:** **Thiago Neto (2022)**. *eISSN: 2358-1778*. Land. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** O objetivo do trabalho foi analisar a suscetibilidade à erosão laminar na Bacia Hidrográfica do Igarapé do Cachorro, Itacoatiara -AM. Para se alcançar esse objetivo foram categorizadas as classes de solos, uso da terra, cobertura vegetal e declivida de. Para elaboração dos produtos cartográficos por meio do Sistema de Informação Geográfica (SIG) com o uso do software QGIS 3.22.8, em que se utilizou as bases cartográficas do Instituto Brasileiro de Geografia e Estatística (IBGE), dados matriciais do Pr ojeto de Mapeamento Anual do Uso e Cobertura da Terra no Brasil (MAPBIOMAS) e dados de altitu...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 038. 232.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/232.pdf`
- **Integridade Criptográfica (SHA-256):** `23cec88af24c0dc2216a87b5cd68a57ca007a5d7cbe8d069219b5a73a1ad83c0`
- **Extensão:** 13 páginas | **Tamanho:** 1,205,760 bytes
- **Referência Formal:** **Proprietario (2022)**. *XV Simpósio Brasileiro de Recursos Hídricos 1*. Water. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** XV Simpósio Brasileiro de Recursos Hídricos 1 ESTIMATIVA DA PERDA DE SOLO POR EROSÃO LAMINAR NA BACIA HIDROGRÁFICA DO RIO CUIABÁ USANDO TÉCNICAS DE GEOPROCESSAMENTO Fernanda Helfer1; Fabíola Lopes2; Alfonso Risso3; Lawson Beltrame4 & Gustavo Merten5...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 039. 35cbe_149-154.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/35cbe_149-154.pdf`
- **Integridade Criptográfica (SHA-256):** `f39d9ab20efa609143a39196044b9dbd6305d4447b15bce47d132db6d3bd25ae`
- **Extensão:** 7 páginas | **Tamanho:** 685,303 bytes
- **Referência Formal:** **Aline Bentes PINTO; Leonardo Costa ALVES; Renata Santos MOMOLI (2019)**. *Utilização do mapeamento de suscetibilidade à erosão laminar como ferramenta para identificar propensão a processos erosivos no ntorno de cavernas*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** O artigo a seguir é parte integrando dos Anais do 35º Congresso Brasileiro de Espeleologia disponível gratuitamente em www.cavernas.org.br. Sugerimos a seguinte citação para este artigo: PINTO, A.P.; ALVES, L.C.; MOMOLI, R.S. Utilização do mapeamento de suscetibilidade à erosão laminar...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 040. 59130+Texto+do+artigo-263494-2-15-20210615.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/59130+Texto+do+artigo-263494-2-15-20210615.pdf`
- **Integridade Criptográfica (SHA-256):** `55d9eaf09a4db4df2ea4d40d0085a91835953fcc6c6782794dc3731567931a48`
- **Extensão:** 22 páginas | **Tamanho:** 987,093 bytes
- **Referência Formal:** **Letícia Bueno de Oliveira Rocha (2022)**. *Caminhos de Geografia Uberlândia-MG v. 23, n. 87 jun./2022 p. 153–174 Página 153*. Water. DOI/URL: `10.14393/RCG238759130`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** O objetivo dessa pesquisa foi pred izer a perda de solo por erosão laminar na bacia hidrográfica do Ribeirão Bocaina (BHRB), situada no munícipio de Passos -MG. A modelagem foi realizada por meio da aplicação da Equação Universal de Perdas de Solos (EUPS). Os fatores do meio físico e antrópi co influentes no processo de erosão hídrica considerados foram: erodibilidade, erosividade, topográfico e cobertura vegetal e práticas conservacionistas. Todos os fatores foram integrados e espacializados no Sistema de Informação Geográfica (SIG), com auxí lio de técnicas de geoprocessamento. Como resultad...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 041. 63077+POTENCIAL+À+EROSÃO+LAMINAR+NA+BACIA+HIDROGRÁFICA+DO+RIBEIRÃO+DOURADINHO,+NO+TRIÂNGULO+MINEIRO_.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/63077+POTENCIAL+À+EROSÃO+LAMINAR+NA+BACIA+HIDROGRÁFICA+DO+RIBEIRÃO+DOURADINHO,+NO+TRIÂNGULO+MINEIRO_.pdf`
- **Integridade Criptográfica (SHA-256):** `0ec6c453d556dc263b6f018eec864b10718053d2cb6aff68f4bc5712f540b84b`
- **Extensão:** 18 páginas | **Tamanho:** 1,859,876 bytes
- **Referência Formal:** **João Victor Freitas Silva (2023)**. *Caminhos de Geografia Uberlândia-MG v. 24, n. 92 abr./2023 p. 90–107 Página 90*. Land. DOI/URL: `10.14393/RCG249263077`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** O levantamento do potencial à erosão laminar resulta de uma análise detalhada sobre o risco da evolução dos processos erosivos nos terrenos em razão das interferências e modificações realizadas pela ação humana. Para esse levantame nto recorre -se, basicamente, ao cruzamento matricial de informações relacionadas a os fatores de suscetibilidade erosiva natural e de uso e ocupação dos solos. O presente texto relata resultados de pesquisa dedicada à determinação do potencial à erosão lami nar na bacia hidrográfica do Ribeirão Douradinho, buscando contribuir para identificação das áreas onde o uso...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 042. A study utilizing USLE and RUSLE.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/A study utilizing USLE and RUSLE.pdf`
- **Integridade Criptográfica (SHA-256):** `146e825ff97ec9212e753ec67ca7fe591173e28622d24ff2fb615ece3517de92`
- **Extensão:** 14 páginas | **Tamanho:** 5,156,267 bytes
- **Referência Formal:** **Ajay Kumar Taloor (2025)**. *Geospatial assessment of soil erosion in the Basantar and Devak watersheds of the NW Himalaya: A study utilizing USLE and RUSLE models*. Remote Sensing. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Geosystems and Geoenvironment 4 (2025) 100355 Contents lists available at ScienceDirect Geosystems and Geoenvironment journal homepage: www.elsevier.com/locate/geogeo...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 043. admin,+05-24-final.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/admin,+05-24-final.pdf`
- **Integridade Criptográfica (SHA-256):** `d98beae516d7df6c3c50f11d970c41f7f053ccc27f2b3465388dbdf8a0b906b9`
- **Extensão:** 17 páginas | **Tamanho:** 649,695 bytes
- **Referência Formal:** **Vítor Pereira (2015)**. *Jataí-GO | n.24 | Jan-Jun/2015*. Land. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** O presente artigo objetiva mapear a potencialidade à erosão laminar no município de Tibau do Sul/RN. Para isso, a metodologia adotada utiliza dados sobre erodibilidade dos solos, declividade e uso do solo para a geração de mapeamentos de áreas pote nciais a erosão laminar. Os resultados mostraram que o município estudado apresenta predominância de áreas classificadas como de médio potencial à erosão laminar. No entanto, para uma melhor análise sobre os processos erosivos são essenciais metodologias q ue incorporem a ação dos ventos e do mar, tendo em vista a localização costeira da área estuda...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 044. admin,+Art.+5+-+Análise+da+Suscetibilidade+-+RBG+11+Nº+2.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/admin,+Art.+5+-+Análise+da+Suscetibilidade+-+RBG+11+Nº+2.pdf`
- **Integridade Criptográfica (SHA-256):** `4a24404a51f8bc5f00ad5dcafe9b8b7bee979e2bdc94aa8d09a06530b4d1f5ae`
- **Extensão:** 10 páginas | **Tamanho:** 1,811,273 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2010)**. *Geomorfologia 11n2.p65*. Revista Brasileira de Geomorfologia. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Revista Brasileira de Geomorfologia - v. 11, nº 2 (2010) www.ugb.org.br Fernanda Vieira Xavier Geógrafa pela Universidade Federal de Viçosa. Mestre em Física Ambiental pela Universidade Federal de Mato Grosso...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 045. admin,+RBG_Ano_7_n_2_2006_73_85.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/admin,+RBG_Ano_7_n_2_2006_73_85.pdf`
- **Integridade Criptográfica (SHA-256):** `f3045e3d298a3a1e9dee7e329071b20a5b7d6da3b26fb71efc3898802d35bdf0`
- **Extensão:** 13 páginas | **Tamanho:** 2,046,694 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2006)**. *E--NOVAPA~1-RGB_7.2.mdi*. Revista Brasileira de Geomorfologia. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** A V ALIAÇÃO QUALITATIV A DO POTENCIAL DE EROSÃO LAMINAR EM GRANDES ÁREAS POR MEIO DA EUPS – EQUAÇÃO UNIVER- SAL DE PERDAS DE SOLOS UTILIZANDO NOV AS METODOLOGIAS EM SIG PARA OS CÁLCULOS DOS SEUS FATORES NA REGIÃO DO...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 046. Aplicação de Aprendizado Profundo e Análise Geoespacial.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Aplicação de Aprendizado Profundo e Análise Geoespacial.pdf`
- **Integridade Criptográfica (SHA-256):** `2c290a45d2abbd90c5a5b36bf66c8f3848ffb6dee9ae64e3068a6def67d915ba`
- **Extensão:** 23 páginas | **Tamanho:** 14,537,201 bytes
- **Referência Formal:** **Mohammed Hlal, Bilal El Monhim, Jérôme Chenal, Jean-Claude Baraka Munyaka, Rida Azmi, Abdelkader Sbai, Gary Cwick and Badr Ben Hichou (2025)**. *Application of Deep Learning and Geospatial Analysis in Soil Loss Risk in the Moulouya Watershed, Morocco*. Land. DOI/URL: `10.3390/w17091351`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Academic Editor: Mohamad Basel Al Sawaf Received: 20 February 2025 Revised: 7 April 2025...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 047. Aplicação de Redes Neurais Convolucionais para Prever a Erosão do Solo.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Aplicação de Redes Neurais Convolucionais para Prever a Erosão do Solo.pdf`
- **Integridade Criptográfica (SHA-256):** `64f16475d717dd6556aa7fa742963036bcc7bb337b77df68354a970f498e8107`
- **Extensão:** 21 páginas | **Tamanho:** 5,601,162 bytes
- **Referência Formal:** **Chao Liu, Han Li, Jiuzhe Xu, Weijun Gao, Xiang Shen, Sheng Miao (2023)**. *Applying Convolutional Neural Network to Predict Soil Erosion: A Case Study of Coastal Areas*. Remote Sensing. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Citation: Liu, C.; Li, H.; Xu, J.; Gao, W.; Shen, X.; Miao, S. Applying Convolutional Neural Network to Predict Soil Erosion: A Case Study of...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 048. Applied and Environmental Soil Science - 2021 - García - Geospatial Analysis of Soil Ero.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Applied and Environmental Soil Science - 2021 - García - Geospatial Analysis of Soil Ero.pdf`
- **Integridade Criptográfica (SHA-256):** `282f4aded1add0d45d014d4cf23921e69357e9b64a00c979099faf3e4f4f55ca`
- **Extensão:** 21 páginas | **Tamanho:** 10,877,878 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2021)**. *Geospatial Analysis of Soil Erosion including Precipitation Scenarios in a Conservation Area of the Amazon Region in Peru*. Land. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Research Article Geospatial Analysis of Soil Erosion including Precipitation Scenarios in a Conservation Area of the Amazon Region in Peru Ligia Garc´ıa...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 049. ASSESSING OF SOIL EROSION RISK.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/ASSESSING OF SOIL EROSION RISK.pdf`
- **Integridade Criptográfica (SHA-256):** `c97e4bf280f42e95acf4ad90e29f2a5d5526b177dfc53c537371e9a7a1b409f3`
- **Extensão:** 54 páginas | **Tamanho:** 546,639 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2022)**. *ChapterBook ver 0.29_rev1*. Remote Sensing. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** During past decades a marked manifestation of wides pread erosion phenomena was studied worldwide. Global conservation communit y has launched campaigns at local, regional and continental level in developing countr ies for preservation of soil resources in order not only to stop or mitigate human impact on nature but also to improve life in rural areas introducing new approaches for soil cultivati on. After the adoption of Sustainable Development Goals of UNs and launching several worl d initiatives such as the Land Degradation Neutrality (LDN) the world came to real ise the very importance of...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 050. Carvalho_EstimativaDePerdaDeSoloPoErosaoLaminarEmLucena_2019.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Carvalho_EstimativaDePerdaDeSoloPoErosaoLaminarEmLucena_2019.pdf`
- **Integridade Criptográfica (SHA-256):** `01764f6d3eed05f1b08e8d7fee737d32af890dcd9ccecb022381b748d69acfde`
- **Extensão:** 12 páginas | **Tamanho:** 835,976 bytes
- **Referência Formal:** **Ana Camino (2019)**. *2019*. Land. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** A erosão laminar provocada pela ação da chuva é um dos problemas ambientais mais frequentes nas cidades, causando diversos danos materiais e humanos anualmente. Esse tipo de erosão é mais intenso em terrenos mais inclinados e com pouca proteção do solo, a exemplo da cidade de Lucena, na Paraíba, onde já se percebem processos erosivos em áreas de intensa atividade agrícola, especialmente nas áreas mais elevadas onde predomina o solo Argissolo Vermelho Amarelo, cuja erodibilidade é relativamente alta. Este tr abalho apresenta os resultados de uma avaliação das condições de vulnerabilidade à perd...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 051. CerriCarlosEduardoPellegrino.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/CerriCarlosEduardoPellegrino.pdf`
- **Integridade Criptográfica (SHA-256):** `dfcba3289c267b3a11b36e745535c8f874d4133a1be32fb77d8a0389ed51d048`
- **Extensão:** 107 páginas | **Tamanho:** 7,485,304 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (1999)**. *MAPEAMENTO DAS ÁREAS DE RISCO DE EROSÃO DOS*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** MAPEAMENTO DAS ÁREAS DE RISCO DE EROSÃO DOS SOLOS DA BACIA DO RIO PIRACICABA, UTILIZANDO GEOPROCESSAMENTO CARLOS EDUARDO PÉLLEGRINO CERRI...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 052. Comprehensive Review on Surface Soil.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Comprehensive Review on Surface Soil.pdf`
- **Integridade Criptográfica (SHA-256):** `073440078ec1af8a81443e96c00c24ccb53272e3ec5f1f1c12dc817bc1fc911c`
- **Extensão:** 22 páginas | **Tamanho:** 767,301 bytes
- **Referência Formal:** **Mohit Kashyap (2022)**. *Comprehensive Review on Surface Soil Erosion: Current Assessment Methods, Challenges, and Future Directions*. Remote Sensing. DOI/URL: `10.1007/978-3-031-92277-0_1`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** An understanding of the extent and intensity of soil erosion is crucial for maintaining ecosystem services, safeguarding biodiversity, and ensuring food security in light of world’s population, that is predicted to reach above 10 billion people by the year 2050 and the reduction in arable land. The uppermost topsoil is lost due to soil erosion lowering the agricultural output and raising the requirement for fertilizers, both of which over time can deteriorate over soil health. Addition- ally, it increases the risk of ﬂooding and degrades water quality by causing sedi- mentation in rivers and r...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 053. contgeo,+27-V_SGFNE_LISBOA_ET_AL_EIXO_05.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/contgeo,+27-V_SGFNE_LISBOA_ET_AL_EIXO_05.pdf`
- **Integridade Criptográfica (SHA-256):** `41c75ae7e976217ee44523cafb3adff2b3ad7674b7a68cc44378e02c398dc9f9`
- **Extensão:** 9 páginas | **Tamanho:** 1,140,552 bytes
- **Referência Formal:** **Melchior Nascimento (2024)**. *PÁGINA 317*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** A pesquisa tem como objetivo o mapeamento do potencial laminar na bacia hidrográfica do rio dos Cachorros,Os procedimentos metodológicos constaram de: levantamento bibliográfico; atividade de campo; elaboração dos mapas temáticos; e análise dos dados.O potencial à erosão está em nível baixo, apresentando valores de 44, 24%, e apresenta médio potencial de 37,06 %. Possui classe de solo com argissolos vermelho -amarelos distróficos; e uso e ocupação de áreas com vegetação, mineração e solo exposto....
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 054. Detecting_Analyzing_and_Predicting_Land_UseLand_Co.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Detecting_Analyzing_and_Predicting_Land_UseLand_Co.pdf`
- **Integridade Criptográfica (SHA-256):** `46e7d364124a5ec192aac3a6324d7894f3eacac8bb344fa5c00c0659d90434c5`
- **Extensão:** 26 páginas | **Tamanho:** 16,475,751 bytes
- **Referência Formal:** **Salman A. H. Selmy, Dmitry E. Kucher, Gintautas Mozgeris, Ali R. A. Moursy, Raimundo Jimenez-Ballesta, Olga D. Kucher, Mohamed E. Fadl and Abdel-rahman A. Mustafa (2023)**. *Detecting, Analyzing, and Predicting Land Use/Land Cover (LULC) Changes in Arid Regions Using Landsat Images, CA-Markov Hybrid Model, and GIS Techniques*. Remote Sensing. DOI/URL: `10.3390/rs15235522`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Citation: Selmy, S.A.H.; Kucher, D.E.; Mozgeris, G.; Moursy, A.R.A.; Jimenez-Ballesta, R.; Kucher, O.D.; Fadl, M.E.; Mustafa, A.-r.A....
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 055. dissertacao_elaine_final (2)_compressed.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/dissertacao_elaine_final (2)_compressed.pdf`
- **Integridade Criptográfica (SHA-256):** `52357fdf4a8272552dcee0854fc2759bb7dacf9981931a282e0edae4419a615c`
- **Extensão:** 75 páginas | **Tamanho:** 8,080,585 bytes
- **Referência Formal:** **Elaine Eluizy Ribeiro Silva (2021)**. *Modelagem de Perda de Solo por Erosão Laminar em Cenários Pré e Pós Cadastro Ambiental Rural no Município de Mineiros-GO*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** SERVIÇO PÚBLICO FEDERAL INSTITUTO FEDERAL DE EDUCAÇÃO , CIÊNCIA E TECNOLOGIA DE GOIÁS PRÓ-REITORIA DE PESQUISA E PÓS-GRADUAÇÃO CÂMPUS GOIÂNIA...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 056. Elaboracao_das_Cartas_de_Suscetibilidade.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Elaboracao_das_Cartas_de_Suscetibilidade.pdf`
- **Integridade Criptográfica (SHA-256):** `250874d39b919e1311f65bdfcbf9d4a890268cf0660e42175ff437ff6f5887a1`
- **Extensão:** 12 páginas | **Tamanho:** 300,991 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2012)**. *Petsch, C.; Zucchi, V. P.; Bravo, J. V. M.; Bueno, M. B.; Minakawa, N. S. 400*. Revista Brasileira de Geografia Física. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Revista Brasileira de Geografia Física 02 (2012) 400-411 Petsch, C.; Zucchi, V. P.; Bravo, J. V. M.; Bueno, M. B.; Minakawa, N. S. 400 ISSN:1984-2295 Revista Brasileira de...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 057. Estrutura modular com IA funde imagens Sentinel para detecção robusta de deslizamentos de terra.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Estrutura modular com IA funde imagens Sentinel para detecção robusta de deslizamentos de terra.pdf`
- **Integridade Criptográfica (SHA-256):** `616d7bd2d96d003c795de94a4dccf1b6e660c0bb6806119fbbb5c2702571a727`
- **Extensão:** 30 páginas | **Tamanho:** 2,216,827 bytes
- **Referência Formal:** **Ioannis Nasios (2022)**. *Multi-Modal Landslide Detection from Sentinel-1 SAR and Sentinel-2 Optical Imagery Using Multi-Encoder Vision Transformers and Ensemble Learning*. Land. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Landslides represent a major geohazard with severe impacts on human life, infras- tructure, and ecosystems, underscoring the need for accurate and timely detection ap- proaches to support disaster risk reduction. This study proposes a modular, multi- model framework that fuses Sentinel-2 optical imagery with Sentinel-1 Synthetic Aper- ture Radar (SAR) data, for robust landslide detection. The methodology leverages multi-encoder vision transformers, where each data modality is processed through sep- arate lightweight pretrained encoders, achieving strong performance in landslide de- tection. In...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 058. Estudo_Da_Erosao_Laminar_Em_Municipio_PR.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Estudo_Da_Erosao_Laminar_Em_Municipio_PR.pdf`
- **Integridade Criptográfica (SHA-256):** `1e155a631d88dfc5eda5d4b0a40aafcf785d865265f8529fe8276bffd28b56f6`
- **Extensão:** 17 páginas | **Tamanho:** 1,364,443 bytes
- **Referência Formal:** **Marina de Souza Muniz1, Júlio Caetano Tomazoni2, Bruno Baierle3 (2015)**. *You are free: to copy, distribute and transmit the work; to adapt the work.*. Land. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Este estudo teve como objetivo a sistematização da Equação Universal de Perdas de So lo – EUPS no software SPRING, usando a Linguagem Espacial para Geoprocessamento Algébrico – LEGAL, a fim de estimar a perda de solo por erosão laminar que ocorre no município de Francisco Beltrão – PR, em toneladas por hectare por ano. O município de Francisco Beltrão está situado no sudoeste do Estado do Paraná e possui 735, 11 km2 de área total. Utilizando o SPRING geraram-se mapas deste município referentes aos tipos de solos, ao uso e ocupação do solo , aos fatores da EUPS e também às perdas de solo por er...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 059. fabiobreunig,+20_Espacialização+da+perda+de+solos.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/fabiobreunig,+20_Espacialização+da+perda+de+solos.pdf`
- **Integridade Criptográfica (SHA-256):** `e8446ef8d72fd3aa5c3b6bbda64dca5b795813ba8adfe6faf9d64e9e1a885d0d`
- **Extensão:** 21 páginas | **Tamanho:** 1,492,626 bytes
- **Referência Formal:** **Home (2011)**. *RA´E GA 23 (2011), p. 534-554 www.geografia.ufpr.br/raega/*. Water. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Com intuito de identificar as áreas mais suscetíveis aos processos erosivos, foi aplicada a equação universal de perda de solo (EUPS) em ambiente SIG na microbacia do Rio Campinas, tributário do Rio Cubatão do Norte, no município de Joinville, SC. O mapa de estimativa de perda anual de solo por erosão laminar demonstrou taxas de erosão de 0 a 355 t.ha -1.ano-1, divididos em 6 classes de perda de solo. As classes predominantes de perda de solo fora m de 0 a 1 t.ha -1.ano-1 (70,5%) e 1 -3 t.ha -1.ano-1 (22,8%). O grande percentual de áreas cobertas por floresta nativa e florestas plantadas foram...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 060. geografar,+12106-39730-1-CE.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/geografar,+12106-39730-1-CE.pdf`
- **Integridade Criptográfica (SHA-256):** `89a44c63ae5f52621acc1ee88d56303d340b63cb3001374443266efd9e31b937`
- **Extensão:** 17 páginas | **Tamanho:** 925,571 bytes
- **Referência Formal:** **sirtoli (2007)**. *Curitiba, v.2, n.2, p.172-188, jul./dez. 2007 ISSN: 1981-089X*. Water. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** A barragem Piraquara I abastece pa rte considerável da cidade de Curitiba e Região Metropolitana. A tendência de crescimento da população a ser atendida por esta barragem indica a necessidade de preservação da qualidade da água distribuída a seus habitantes. Uma vez que as bacias hidrográficas são naturais contribuidoras de sedimentos em reservatórios, procur ou-se levantar as principa is áreas-fonte potenciais ao assoreamento na barragem Piraquara I. Em função de uma visão sistêmica das b acias hidrográficas e das interações entre os processos físicos e humanos que a compreendem, a metodologi...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 061. Geoprocessamento Aplicado na Caracterizacao de Bacias Hidrograficas Visando a sua Sustentbilidade.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Geoprocessamento Aplicado na Caracterizacao de Bacias Hidrograficas Visando a sua Sustentbilidade.pdf`
- **Integridade Criptográfica (SHA-256):** `99432c15d078cfc260bcc59e4cea87c9cd70762401e69917ae35d0438755af36`
- **Extensão:** 182 páginas | **Tamanho:** 4,465,350 bytes
- **Referência Formal:** **Usuário do Windows (2021)**. *Sérgio Campos - Marcelo Campos*. UNESP. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Sérgio Campos - Marcelo Campos Yara Manfrin Garcia - Gabriel Rondina Pupo da Silveira GEOPROCESSAMENTO APLICADO NA CARACTERIZAÇÃO DE BACIAS...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 062. Geoprocessamento-Aplicada-no-Planejamento-de-Bacias-Hidrograficas-1.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Geoprocessamento-Aplicada-no-Planejamento-de-Bacias-Hidrograficas-1.pdf`
- **Integridade Criptográfica (SHA-256):** `eab09f117b782c124334da15c4ee6d182e96ff4810c0d01fa4f7eaf64d89b949`
- **Extensão:** 137 páginas | **Tamanho:** 8,760,841 bytes
- **Referência Formal:** **Flávia Luize Pereira de Souza (2019)**. *Geoprocessamento Aplicado no*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Geoprocessamento Aplicado no Planejamento de Bacias Hidrográficas Atena Editora 2019...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 063. Identificacao_De_Areas_Criticas_De_Erosao Laminar.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Identificacao_De_Areas_Criticas_De_Erosao Laminar.pdf`
- **Integridade Criptográfica (SHA-256):** `af621a82ae27302f9022e28e04979320fab351e3ffe30b8f20b24c84019988aa`
- **Extensão:** 14 páginas | **Tamanho:** 671,559 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2013)**. *Sociedade Brasileira de Cartografia, Geodésia, Fotogrametria e Sensoriamento Remoto*. Remote Sensing. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Revista Brasileira de Cartografia (2013) N 0 65/5: 881-894 Sociedade Brasileira de Cartografia, Geodésia, Fotogrametria e Sensoriamento Remoto ISSN: 1808-0936S B C IDENTIFICATION OF CRITICAL EROSION PRONE AREAS AND...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 064. Integrated image processing and machine learning framework.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Integrated image processing and machine learning framework.pdf`
- **Integridade Criptográfica (SHA-256):** `cfcc560c9c0fe56d69f664d90050d896b3eb8b9297e6f7642cd1a4b9c57ea513`
- **Extensão:** 13 páginas | **Tamanho:** 2,338,934 bytes
- **Referência Formal:** **Shubham Kumar (2025)**. *Integrated image processing and machine learning framework for precise quantification and prediction of soil erosion*. Land. DOI/URL: `10.1007/s00371-025-03863-3`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Soil erosion, primarily driven by water and wind, poses a signiﬁcant environmental challenge globally, leading to land degra- dation and geo-hazards. Despite various empirical methods, image analysis, and machine learning techniques employed to address this issue, effective mitigation tools remain lacking. This study presents an innovative framework integrating image processing (IP) and machine learning (ML) to enhance the understanding, quantiﬁcation, and prediction of soil erosion pro- cesses. Laboratory ﬂume experiments were conducted to capture erosion images, which were pre-processed usin...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 065. Integrating_Remote_Sensing_GIS_and_AI_Technologies.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Integrating_Remote_Sensing_GIS_and_AI_Technologies.pdf`
- **Integridade Criptográfica (SHA-256):** `d50af48a6c7a6fd803ae86eb5fb9504ada2b4a3cd2ada5e5f2745d4983e45208`
- **Extensão:** 21 páginas | **Tamanho:** 3,107,859 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2022)**. *0005976638.INDD*. Remote Sensing. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Chapter Integrating Remote Sensing, GIS, and AI Technologies in Soil Erosion Studies...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 066. LUZIANE-SANTOS-RIBEIRO.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/LUZIANE-SANTOS-RIBEIRO.pdf`
- **Integridade Criptográfica (SHA-256):** `7ab59e6777b9907701db9418e7c16b117fe3f72a2795ef73ca748dbc24e0bdec`
- **Extensão:** 158 páginas | **Tamanho:** 6,690,667 bytes
- **Referência Formal:** **LUZIANE SANTOS RIBEIRO (2006)**. *AN`LISE QUALITATIVA E QUANTITATIVA DE EROSˆO*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** AN`LISE QUALITATIVA E QUANTITATIVA DE EROSˆO LAMINAR NO MUNIC˝PIO DE CAMPOS DOS GOYTACAZES/RJ ATRAVÉS DE TÉCNICAS DE GEOPROCESSAMENTO...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 067. Mapeamento_da_vulnerabilidade_geoambient.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Mapeamento_da_vulnerabilidade_geoambient.pdf`
- **Integridade Criptográfica (SHA-256):** `59721860f5d182bb489427a020749345d48c2ae1238c8050260a763240391c83`
- **Extensão:** 9 páginas | **Tamanho:** 3,103,903 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2007)**. *Arquivo digital disponível on-line no site www.sbgeo.org.br812*. Water. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** O mapeamento da vulnerabilidade geoambiental do estado do Paraná, elaborado na escala 1:600.000, fundamenta-se no método da Análise Empírica da Fragilidade dos Ambientes Naturais e Antropi- zados apresentado por Ross (1994). Para obtenção das classes de vulnerabilidade foram levadas em conta a geologia, a geomorfologia e a pedologia, considerando-se três classes: baixa, moderada e alta, aplicadas em cinqüenta unidades geomorfológicas definidas no Paraná por Oka-Fiori et al. (2006) e Santos et al. (2006). As classes de vulnerabilidade estão condicionadas aos processos geoambientais: erosão, mov...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 068. Mapeamento_do_potencial_de_erosao_lamina.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Mapeamento_do_potencial_de_erosao_lamina.pdf`
- **Integridade Criptográfica (SHA-256):** `068a338736355d054c2ddb6ef32de0d2db9844e41036432fa7fc426c464cded3`
- **Extensão:** 10 páginas | **Tamanho:** 5,398,665 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2011)**. *731Mapeamento do potencial de erosão laminar na bacia do rio J aparatuba, S E , via S IG*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** 731Mapeamento do potencial de erosão laminar na bacia do rio J aparatuba, S E , via S IG R. Bras. E ng. Agríc. Ambiental, v.15, n.7, p.731–74 0, 2011. 1 DE C/UFS , Av. Marechal Rondon, s/n J ardim Rosa E lze, CE P 49100-000, S ão Cristóvão, S E . Fone: (79) 2105-6700. E -mail: ricardoaragao@ufs.br 2 NUGE O/UFS , Av. Marechal Rondon, s/n. Fone: (79) 21 05-6326. E -mail: jalmeida@ufs.br...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 069. Mapeamento_Por_Tecnicas_De_Geoprocessame.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Mapeamento_Por_Tecnicas_De_Geoprocessame.pdf`
- **Integridade Criptográfica (SHA-256):** `6ef05655c1f8cf4e6780c0314df88ad00803d2750b68224fcfc0afc0cd519589`
- **Extensão:** 4 páginas | **Tamanho:** 272,919 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2014)**. *XLIII Congresso Brasileiro de Engenharia Agrícola - CONBEA 2014*. UNIOESTE. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** XLIII Congresso Brasileiro de Engenharia Agrícola - CONBEA 2014 Centro de Convenções “Arquiteto Rubens Gil de Camillo”- Campo Grande -MS 27 a 31 de julho de 2014 MAPEAMENTO POR TÉCNICAS DE GEOPROCESSAMENTO DO POTENCIAL NATURAL DE...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 070. Modeling and Assessment of Land Degradation Vulnerability in Arid Ecosystem of Rajasthan Using Analytical Hierarchy Process and - Semantic Scholar.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Modeling and Assessment of Land Degradation Vulnerability in Arid Ecosystem of Rajasthan Using Analytical Hierarchy Process and - Semantic Scholar.pdf`
- **Integridade Criptográfica (SHA-256):** `2440d176326517daba5f68681b30a2a9d797968fb741cc04ef4ce97a7101440b`
- **Extensão:** 23 páginas | **Tamanho:** 480,752 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2026)**. *Modeling and Assessment of Land Degradation Vulnerability in Arid Ecosystem of Rajasthan Using Analytical Hierarchy Process and - Semantic Scholar*. Land. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Modeling and Assessment of Land Degradation Vulnerability in Arid Ecosystem of Rajasthan Using Analytical Hierarchy Process and - Semantic Scholar Model...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 071. p103.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/p103.pdf`
- **Integridade Criptográfica (SHA-256):** `f17ad0f6e65c102e469d0b4501b3aa338d964be87012fbec5bcae911533c65e1`
- **Extensão:** 10 páginas | **Tamanho:** 1,781,788 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2016)**. *Anais 6º Simpósio de Geotecnologias no Pantanal, Cuiabá, MT, 22 a 26 de outubro 2016*. INPE. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** A erosão é um fenômeno que influencia significativamente na vida humana e suas atividades. A erosão laminar é um dos tipos de erosão responsável pelo empobrecimento do solo e pela perca de sua fertilidade. Nesse sentido esse trabalho teve como intuito determinar a suscetibilidade à erosão laminar no município de Miranda – MS com base em uma abordagem qualitativa das variáveis naturais da Equação Universal de Perdas de Solo (EUPS) proposta por Salomão (2007) empregando um modelo preditivo e utilizando técnicas de geoprocessa - mento para a realização do cruzamento matricial na Linguagem de Geop...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 072. Pesquisa sobre a previsão da degradação irregular do solo.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Pesquisa sobre a previsão da degradação irregular do solo.pdf`
- **Integridade Criptográfica (SHA-256):** `821e8f42c2ba8d19ccf28560e09a4a54cba0a23290c1df9d1360a8cf740c0ce8`
- **Extensão:** 17 páginas | **Tamanho:** 5,607,688 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2022)**. *Research on soil spotted*. Remote Sensing. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Research on soil spotted degradation prediction in qinling tea-producing area of China based on deep learning...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 073. Potencial_a_erosao_laminar_utilizando_Si.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Potencial_a_erosao_laminar_utilizando_Si.pdf`
- **Integridade Criptográfica (SHA-256):** `9bfa24eb708fb0bec9a95a47b9e42fe1c569d37ec34e18a38ccf2feffff0eb08`
- **Extensão:** 8 páginas | **Tamanho:** 545,726 bytes
- **Referência Formal:** **João Cândido André da Silva Neto ¹ ³ (2022)**. *Potencial à erosão laminar utilizando Sistema de Informações Geográficas: aplicações*. UNESP. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Shares of deforestation and soil erosion originate the gradual depletion of biotic resources, the destruction of soil structure and destabilization of the ecosystem mechanisms that support the production and regeneration of natural resources (LEFF, 2002). Thus the process of laminate erosion is strongly conditioned by anthropic actions in complex environments, so that the soils with the same level may have different susceptibility to erosion potential lamina te, depending on the coverage and soil use. In this context, this study approached the Salobra river basin which is located in the southw...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 074. ppggeografia_danielsantanalanza_dissertacaomestrado.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/ppggeografia_danielsantanalanza_dissertacaomestrado.pdf`
- **Integridade Criptográfica (SHA-256):** `b066150828552e2a4ddd2183f11bbdb33cfb6b73096dd1d375e23c72dc354398`
- **Extensão:** 151 páginas | **Tamanho:** 11,940,983 bytes
- **Referência Formal:** **Gui (2011)**. *Universidade Federal de Minas Gerais*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** UNIVERSIDADE FEDERAL DE MINAS GERAIS Departamento de Geografia Daniel Santana Lanza DIAGNÓSTICO DA EROSÃO LAMINAR NA...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 075. Predicao_Da_Perda_De_Solo_Por_Erosao_Lam.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Predicao_Da_Perda_De_Solo_Por_Erosao_Lam.pdf`
- **Integridade Criptográfica (SHA-256):** `25935d876bbe492872210d4877c205519837fdc14a2161fa3771538ec52be983`
- **Extensão:** 22 páginas | **Tamanho:** 880,857 bytes
- **Referência Formal:** **Letícia Bueno de Oliveira Rocha (2022)**. *Caminhos de Geografia Uberlândia-MG v. 23, n. 87 jun./2022 p. 153–174 Página 153*. Water. DOI/URL: `10.14393/RCG238759130`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** O objetivo dessa pesquisa foi predizer a perda de solo por erosão laminar na bacia hidrográfica do Ribeirão Bocaina (BHRB), situada no munícipio de Passos-MG. A modelagem foi realizada por meio da aplicação da Equaçã o Universal de Perdas de Solos (EUPS). Os fatores do meio físico e antrópico influentes no process o de erosão hídrica considerados foram: erodibilidade, erosividade, topográfic o e cobertura vegetal e práticas conservacionistas. Todos os fatores foram integrad os e espacializados no Sistema de Informação Geográfica (SIG), com auxílio de técnicas de geoproc essamento. Como resulta...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 076. PREMIO-MAPBIOMAS_VulnerabilidadeErosao_FINAL-Margareth-Simoes.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/PREMIO-MAPBIOMAS_VulnerabilidadeErosao_FINAL-Margareth-Simoes.pdf`
- **Integridade Criptográfica (SHA-256):** `f7fd633d5f91bc1b33279d391e2b53a2f9787f94aa72865a0c9368e50a08a79f`
- **Extensão:** 26 páginas | **Tamanho:** 1,938,002 bytes
- **Referência Formal:** **Rodrigo Demonte (2019)**. *Empresa Brasileira de Pesquisa Agropecuária*. Embrapa. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Empresa Brasileira de Pesquisa Agropecuária Embrapa Solos Mapeamento da vulnerabilidade à erosão hídrica dos solos brasileiros em função da dinâmica de uso e cobertura da terra – Subsídio às políticas de...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 077. Real-time_soil_erosion_detection_using_satellite_i.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Real-time_soil_erosion_detection_using_satellite_i.pdf`
- **Integridade Criptográfica (SHA-256):** `364601eb7b94ab749cbe3ffc2257ffafc0445f5465d3b0de2b17cc385fb59e04`
- **Extensão:** 15 páginas | **Tamanho:** 1,219,939 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2025)**. *Vol.:(0123456789)*. Remote Sensing. DOI/URL: `10.1007/s11042-024-20215-w`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Soil erosion is very hazardous to the global ecosystem. Government aided soil erosion control schemes happen dilatorily with minimal resources. Recognition and identifying the scale and the area of eroded land can be extremely time-consuming and difficult as well. To overcome this problem, a real-time Soil erosion detection system is introduced. The real-time part has been implemented using satellite imagery with the use of RUSLE modelling considering various factors. This was generated with the help of Google Earth Engine (GEE) interface. The RUSLE model offers a straightforward approach to a...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 078. Relatorio_Tecnico_Suscetibilidade.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Relatorio_Tecnico_Suscetibilidade.pdf`
- **Integridade Criptográfica (SHA-256):** `81fb2440c2707c4ea9f606820a61e9db41d2ec95274e1ccdfa7edc9b3754075c`
- **Extensão:** 2 páginas | **Tamanho:** 119,415 bytes
- **Referência Formal:** **Rodrigo Demonte (2020)**. *Nota Técnica*. Embrapa. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Nota Técnica Título: Mapa de Suscetibilidade dos Solos à Erosão Hídrica do Brasil Informações Gerais Elaboração: Embrapa Solos...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 079. remotesensing-13-00155-v3.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/remotesensing-13-00155-v3.pdf`
- **Integridade Criptográfica (SHA-256):** `8217b6443cb2c65c691c495aa3cb82c9237c7a7fa936df38c86943a560a7336f`
- **Extensão:** 28 páginas | **Tamanho:** 13,126,942 bytes
- **Referência Formal:** **Dmitry I. Rukhovich, Polina V. Koroleva, Danila D. Rukhovich and Natalia V. Kalinina (2022)**. *The Use of Deep Machine Learning for the Automated Selection of Remote Sensing Data for the Determination of Areas of Arable Land Degradation Processes Distribution*. Remote Sensing. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** remote sensing Article The Use of Deep Machine Learning for the Automated Selection of Remote Sensing Data for the Determination of...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 080. Research on Soil Erosion Based on Remote Sensing Technology.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Research on Soil Erosion Based on Remote Sensing Technology.pdf`
- **Integridade Criptográfica (SHA-256):** `423279a4fa62aae1a6db6f0aaa65226eaadc301810108c43c569c3dfbd443abd`
- **Extensão:** 31 páginas | **Tamanho:** 1,466,870 bytes
- **Referência Formal:** **Jiaqi Wang, Jiuchun Yang, Zhi Li, Liwei Ke, Qingyao Li, Jianwei Fan and Xue Wang (2025)**. *Research on Soil Erosion Based on Remote Sensing Technology: A Review*. Remote Sensing. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Academic Editor: Tarendra Lakhankar Received: 13 November 2024 Revised: 20 December 2024...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 081. salomao_fs_me_bauru.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/salomao_fs_me_bauru.pdf`
- **Integridade Criptográfica (SHA-256):** `5675f9b47e18d557ad0aa335b5cac2870a615e5c01d025d2156476106aa6e2fc`
- **Extensão:** 177 páginas | **Tamanho:** 5,993,878 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2020)**. *FERNANDA SOTA SALOMÃO*. UNESP. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** FERNANDA SOTA SALOMÃO EROSÃO LAMINAR E QUALIDADE DO SOLO EM DUAS SUB- BACIAS HIDROGRÁFICAS NO MUNICÍPIO DE ITAPEVI/SP: SUBSÍDIO AO PLANEJAMENTO TERRITORIAL...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 082. Spatiotemporal modeling of soil loss and sediment yield due to land use and land cover.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Spatiotemporal modeling of soil loss and sediment yield due to land use and land cover.pdf`
- **Integridade Criptográfica (SHA-256):** `f1558af8a36fb993ada94b286967229b9ee0556e669a8a4c77b5e0a7120e78a4`
- **Extensão:** 26 páginas | **Tamanho:** 1,499,724 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2022)**. *Spatiotemporal modeling of soil loss and sediment yield due to land use and land cover*. Remote Sensing. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Spatiotemporal modeling of soil loss and sediment yield due to land use and land cover changes: implications for watershed management Engdaye Mersha a,*, Sileshi Degefa a, Mekuria Argaw a and Wondimagegn Mengist b...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 083. SUSCETIBILIDADE_RISCO_EROSAO_LAMINAR.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/SUSCETIBILIDADE_RISCO_EROSAO_LAMINAR.pdf`
- **Integridade Criptográfica (SHA-256):** `535838f7f03f21482f33e6b8a8a21e9e5a66385445e6462d220d2f1d7ec12f75`
- **Extensão:** 149 páginas | **Tamanho:** 3,453,998 bytes
- **Referência Formal:** **Victoria (2004)**. *UNIVERSIDADE FEDERAL DE GOIÁS*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** UNIVERSIDADE FEDERAL DE GOIÁS INSTITUTO DE ESTUDOS SÓCIO-AMBIENTAIS PROGRAMA DE PESQUISA E PÓS-GRADUAÇÃO EM GEOGRAFIA SUSCETIBILIDADE E RISCO À EROSÃO LAMINAR NO SETOR SUL DO ALTO...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 084. trabalho1_87.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/trabalho1_87.pdf`
- **Integridade Criptográfica (SHA-256):** `2ee1e4965de4f80d3e4c7087e25251663797bdc5f5c3e5bec569ef07220c056c`
- **Extensão:** 14 páginas | **Tamanho:** 886,293 bytes
- **Referência Formal:** **Raimundo Almir Costa Conceicao (2022)**. *17º Congresso Brasileiro de Geologia de Engenharia e Ambiental*. Land. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** A erosão dos solos é um fator natural, que pode ser agravado pelo uso inadequado do território, causando problemas s ocioambientais. Assim, com a finalidade de colaborar para um planejamento urbano mais adequado, este trabalho tem como objetivo elaborar um mapa de potencial erosivo dos solos, por meio de dados de formações superficiais, solo, declividade, relevo, chuva e uso do solo, fazendo uso da análise multicritério, apoiada na Análise de Processos Hierárquicos (AHP). Os resultados apontaram que 33% da Ilha apresenta potencial alto a muito alto, principalmente por ter v árias áreas com sol...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 085. transferir.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/transferir.pdf`
- **Integridade Criptográfica (SHA-256):** `eb9b9f16151d870b0f37563d8173d842f7b016df0db9243d669a8b3362da0f70`
- **Extensão:** 10 páginas | **Tamanho:** 5,335,176 bytes
- **Referência Formal:** **WalterLOVale (2011)**. *D:\RBEAA\v15n07\v15n07a12\086.1*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** A erosão do solo é a principal causa do empobrecimento precoce de terras produtivas e dentre as suas formas está a erosão laminar. Esta se caracteriza não apenas pela remoção de uma camada relativament e uniforme da superfície, mas também por seus nutrientes, sendo intensificada, portanto, pelas ações antrópicas. Para evitar ou reduzir seus impactos, fazem-se necessárias diretrizes para a adequação d o uso e da ocupação às condições de cobertura vegetal, tipo de solo e topografia, através de mapas do potencial erosivo laminar da região de interesse, obtidos via sistemas de informações geográfi...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 086. USE+OF+REMOTE+SENSING+IN+EROSION+ANALYSIS+IN+THE+GENERAL+SAMPAIO+DAM+WATERSHED+-+CE.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/USE+OF+REMOTE+SENSING+IN+EROSION+ANALYSIS+IN+THE+GENERAL+SAMPAIO+DAM+WATERSHED+-+CE.pdf`
- **Integridade Criptográfica (SHA-256):** `2af345be91c403ffb6a99f9cc2be4e5d626aa5f9324347c49de32d51fe43604c`
- **Extensão:** 14 páginas | **Tamanho:** 483,946 bytes
- **Referência Formal:** **nadilly oliveira (2026)**. *International Journal Semiarid –Vol. 9, n. 1. ISSN: 2764-6203, p. 86–99, 2026*. Remote Sensing. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** International Journal Semiarid –Vol. 9, n. 1. ISSN: 2764-6203, p. 86–99, 2026 USO DE SENSORIAMENTO REMOTO NA ANÁLISE DE EROSÃO NA BACIA HIDROGRÁFICA DO AÇUDE GENERAL...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 087. Uso_de_Tecnicas_de_Geoprocessamento.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/Uso_de_Tecnicas_de_Geoprocessamento.pdf`
- **Integridade Criptográfica (SHA-256):** `1c000bd13c6032e6e92cfdf94e60d5f7237d8314cc63c579f762f59408e5cf6a`
- **Extensão:** 15 páginas | **Tamanho:** 387,877 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2020)**. *1117*. Revista Brasileira de Geografia Física. DOI/URL: `-`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Revista Brasileira de Geografia Física v.13, n.03 (2020) 1117-1131. 1117 Vansan, A. P., Tomazoni, J .C. Uso de Técnicas de Geoprocessamento para Estudo da Erosão Hídrica Laminar...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

### 088. zeluiz,+02_Estimativa.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Pesquisas relacionadas/zeluiz,+02_Estimativa.pdf`
- **Integridade Criptográfica (SHA-256):** `2d42f6c38e1cd7b9ff90aed9112aae8e8125e582c0140d064a2742080ab6d061`
- **Extensão:** 14 páginas | **Tamanho:** 1,265,581 bytes
- **Referência Formal:** **Laís (2016)**. *Estimativa de Perda de Solos por Erosão Laminar*. Land. DOI/URL: `10.11606/rdg.v2i0.114308`
- **Foco Metodológico:** Modelagem Empírica (RUSLE/USLE) / Sensoriamento Remoto / Geoprocessamento Regional
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** A erosão é um fenômeno natural no modelado da superfície, no processo de remoção e de deposição de sedimentos, porém as atividades antrópicas, como o desmatamento, excedem os níveis naturais de perdas de solo. Para estimar a perda de solo anual em terrenos agricultáveis, existem modelos de predição que relacionam elementos físicos da paisagem junto às atividades antrópicas existentes. Nessa temática, o objetivo deste trabalho foi avaliar a perda de solos na Bacia Hidrográfica Córrego Baguaçu, localizada no oeste do estad o de São Paulo, considerada uma região com processos de erosão acelerada....
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a relevância dos fatores biofísicos clássicos (R, K, LS, C, P) e sua espacialização em ambiente SIG como baseline comparativo.
  - **O que a fonte NÃO sustenta:** NÃO sustenta capacidade preditiva supervisionada sem dados contínuos de monitoramento empírico ou imagens orbitais de alta frequência.

---

## 6. Fichamento Analítico-Crítico: Lote em Triagem e Revisão (`Para Revisar/` — 22 Obras)

Lote incorporado ao repositório em 20 de outubro de 2026 a partir do relatório de auditoria e curadoria (*FLOW*). Destacam-se as dissertações desenvolvidas no próprio programa de pós-graduação (UTFPR PPGTCA - Medianeira), trabalhos de doutorado na UNIOESTE focados na Bacia do Paraná 3, além de estudos dedicados à malha fundiária (CAR) e predição em lavouras tecnificadas.


### 089. admin,+RBG_Ano_7_n_2_2006_73_85.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/admin,+RBG_Ano_7_n_2_2006_73_85.pdf`
- **Integridade Criptográfica (SHA-256):** `f3045e3d298a3a1e9dee7e329071b20a5b7d6da3b26fb71efc3898802d35bdf0`
- **Extensão:** 13 páginas | **Tamanho:** 2,046,694 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2006)**. *E--NOVAPA~1-RGB_7.2.mdi*. Revista Brasileira de Geomorfologia. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** A V ALIAÇÃO QUALITATIV A DO POTENCIAL DE EROSÃO LAMINAR EM GRANDES ÁREAS POR MEIO DA EUPS – EQUAÇÃO UNIVER- SAL DE PERDAS DE SOLOS UTILIZANDO NOV AS METODOLOGIAS EM SIG PARA OS CÁLCULOS DOS SEUS FATORES NA REGIÃO DO...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 090. agb_xxvi_4-00.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/agb_xxvi_4-00.pdf`
- **Integridade Criptográfica (SHA-256):** `f19567db2db8df0d388f0735586c54aee6ebbb9f9b53cddd0a52004afbe8ba63`
- **Extensão:** 16 páginas | **Tamanho:** 2,133,531 bytes
- **Referência Formal:** **Neo (2022)**. *Revista_AGB_XXVI-4.indb*. Remote Sensing. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** 1718 Khokhy Sefo Maria Barros • João Francisco de Sousa Gaspar da Silva Ciência Geográﬁ ca - Bauru - XXVI - Vol. XXVI - (4): Janeiro/Dezembro - 2022 O USO DO SENSORIAMENTO REMOTO APLICADA NA DETERMINAÇÃO...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 091. AlissonA_Ribeiro_2026.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/AlissonA_Ribeiro_2026.pdf`
- **Integridade Criptográfica (SHA-256):** `10df41566f6d6da099ca9d5a5a47da4e4111aca50cca3cf853e7d3054fb668c4`
- **Extensão:** 131 páginas | **Tamanho:** 4,727,437 bytes
- **Referência Formal:** **Claudio Schultz (2022)**. *UNIOESTE – UNIVERSIDADE ESTADUAL DO OESTE DO PARANÁ*. UNIOESTE. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** UNIOESTE – UNIVERSIDADE ESTADUAL DO OESTE DO PARANÁ CAMPUS DE MARECHAL CÂNDIDO RONDON – PR CENTRO DE CIÊNCIAS AGRÁRIAS – CCA PÓS-GRADUAÇÃO STRICTO SENSU EM DESENVOLVIMENTO RURAL...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 092. Analise_espaco-temporal_da_erosao_hidrica_por_meio.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/Analise_espaco-temporal_da_erosao_hidrica_por_meio.pdf`
- **Integridade Criptográfica (SHA-256):** `af56c331621912006809fc642e0573dfc270f44a1500229b5786d997f742e49e`
- **Extensão:** 28 páginas | **Tamanho:** 3,291,103 bytes
- **Referência Formal:** **RBGF (2025)**. *Análise espaço-temporal da erosão hídrica por meio de modelagem e geotecnologias em bacias hidrográficas no Centro-Oeste do Brasil*. Revista Brasileira de Geografia Física. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Revista Brasileira de Geografia Física v.18, n.02 (2025) 1465-1492. 1465 Nunes, N. C., Angelini, L. P., Alves, W. S., Castro, R. M., Morais, W. A., Morais, N. G. Análise espaço-temporal da erosão hídrica por meio de modelagem e...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 093. Bloco+1+-+3+-+Manoel+et+al+SENSORIAMENTO+REMOTO+E+MACHINE+LEARNING.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/Bloco+1+-+3+-+Manoel+et+al+SENSORIAMENTO+REMOTO+E+MACHINE+LEARNING.pdf`
- **Integridade Criptográfica (SHA-256):** `e7df65fcccaf5ba7e1c80953651270a01588e115bc4cb5e2a0d9cd1a9cf4ef89`
- **Extensão:** 23 páginas | **Tamanho:** 990,036 bytes
- **Referência Formal:** **antcneto (2022)**. *¹Mestre pela UFAL, Instituto Nacional de Pesquisas Espaciais - INPE, Email: anselmo.icat.ufal@gmail.com*. Remote Sensing. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Compreender o uso e cobertura da terra é essencial para o planejamento territorial eficiente e sustentável. O presente estudo avaliou a dinâmica de uso e cobertura da terra em três municípios da microrregião do Vale do Açu, Rio Grande do Norte, utilizando geotecnologias. Foram analisadas imagens do satélite Sentinel-2, do dia de 24 de setembro de 2021. A classificação do uso e cobertura da terra foi realizada por meio de aprendizado de máquina com o modelo Random Forest, em abordagem supervisionada orientada a objetos. Os resultados indicaram que a vegetação nativa ainda predomina na região, e...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 094. Busca por artigos FLOW.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/Busca por artigos FLOW.pdf`
- **Integridade Criptográfica (SHA-256):** `70247fcbb0fbc218534fb4db95520425a0788d5dfdef6bd868b315283e960fa9`
- **Extensão:** 32 páginas | **Tamanho:** 12,417,238 bytes
- **Referência Formal:** **Luis Alfredo (2022)**. *Daily research update_ Laminar erosion and AI - Chat*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** ...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 095. dissertacao_elaine_final (2).pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/dissertacao_elaine_final (2).pdf`
- **Integridade Criptográfica (SHA-256):** `30438ff83b7dbd281327636bc8d7a2497715d7813821dba251ee04ae8d67e228`
- **Extensão:** 75 páginas | **Tamanho:** 26,670,146 bytes
- **Referência Formal:** **Elaine Eluizy Ribeiro Silva (2021)**. *Modelagem de Perda de Solo por Erosão Laminar em Cenários Pré e Pós Cadastro Ambiental Rural no Município de Mineiros-GO*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** SERVIÇO PÚBLICO FEDERAL INSTITUTO FEDERAL DE EDUCAÇÃO , CIÊNCIA E TECNOLOGIA DE GOIÁS PRÓ-REITORIA DE PESQUISA E PÓS-GRADUAÇÃO CÂMPUS GOIÂNIA...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 096. Erosodesoloemambienteamaznico.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/Erosodesoloemambienteamaznico.pdf`
- **Integridade Criptográfica (SHA-256):** `5f12ce3588b97e896835c653669e262b9f897d588bffefb4b106ba6c55ab9bb8`
- **Extensão:** 156 páginas | **Tamanho:** 28,426,099 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2022)**. *Editora CRV - Proibida a impressão e/ou comercialização*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Editora CRV - Proibida a impressão e/ou comercialização Editora CRV - Proibida a impressão e/ou comercialização EROSÃO DE SOLO EM AMBIENTE AMAZÔNICO...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 097. Estimativa da perda de solo por erosão laminar usando ferramentas computacionais na agricultura de precisão.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/Estimativa da perda de solo por erosão laminar usando ferramentas computacionais na agricultura de precisão.pdf`
- **Integridade Criptográfica (SHA-256):** `64ae9bfa593f27210e0143ed317a4b8307c6ddd163679aaf7682060831434945`
- **Extensão:** 8 páginas | **Tamanho:** 1,623,656 bytes
- **Referência Formal:** *** Corresponding author - E-mail: bazzi@utfpr.edu.br (2022)**. *Estimating soil loss by laminar erosion*. UTFPR. DOI/URL: `10.1590/1807-1929/agriambi.v26n12p907-914`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Estimating soil loss by laminar erosion using precision agriculture computational tools1 DOI: http://dx.doi.org/10.1590/1807-1929/agriambi.v26n12p907-914 • Ref. 263823 – Received 09 May, 2022...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 098. Estimativa de Perda de Solos por Erosão Laminar na Bacia Hidrográfica do Córrego.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/Estimativa de Perda de Solos por Erosão Laminar na Bacia Hidrográfica do Córrego.pdf`
- **Integridade Criptográfica (SHA-256):** `2d42f6c38e1cd7b9ff90aed9112aae8e8125e582c0140d064a2742080ab6d061`
- **Extensão:** 14 páginas | **Tamanho:** 1,265,581 bytes
- **Referência Formal:** **Laís (2016)**. *Estimativa de Perda de Solos por Erosão Laminar*. Land. DOI/URL: `10.11606/rdg.v2i0.114308`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** A erosão é um fenômeno natural no modelado da superfície, no processo de remoção e de deposição de sedimentos, porém as atividades antrópicas, como o desmatamento, excedem os níveis naturais de perdas de solo. Para estimar a perda de solo anual em terrenos agricultáveis, existem modelos de predição que relacionam elementos físicos da paisagem junto às atividades antrópicas existentes. Nessa temática, o objetivo deste trabalho foi avaliar a perda de solos na Bacia Hidrográfica Córrego Baguaçu, localizada no oeste do estad o de São Paulo, considerada uma região com processos de erosão acelerada....
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 099. estimativaerosaolaminar.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/estimativaerosaolaminar.pdf`
- **Integridade Criptográfica (SHA-256):** `77f0bcfbaca0b086d91f293c60b268b9ec5e2728aaa8114fae62c3b3bc787e6e`
- **Extensão:** 88 páginas | **Tamanho:** 4,725,368 bytes
- **Referência Formal:** **Evelin Krug (2020)**. *UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ*. UTFPR. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ DIRETORIA DE PESQUISA E PÓS-GRADUAÇÃO MESTRADO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO EVELIN TAIS SCHLICKMANN KRUG...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 100. geoprocessamentoerosaosolovalidacao.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/geoprocessamentoerosaosolovalidacao.pdf`
- **Integridade Criptográfica (SHA-256):** `e66a25cb1c454bc2eafdebd06c87b798d507e1c9149b8ce6271b087154bfa299`
- **Extensão:** 184 páginas | **Tamanho:** 13,908,930 bytes
- **Referência Formal:** **Jaqueline de Moura (2022)**. *UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ*. UTFPR. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ CAMPUS FRANCISCO BELTRÃO PROGRAMA DE PÓS-GRADUAÇÃO EM ENGENHARIA AMBIENTAL: ANÁLISE E TECNOLOGIA AMBIENTAL...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 101. IV_SLGFA_1.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/IV_SLGFA_1.pdf`
- **Integridade Criptográfica (SHA-256):** `ea78a09a58b02f61c1f59ae957a0dbcc4ccf589d967c345733be38f6223b0bbe`
- **Extensão:** 10 páginas | **Tamanho:** 2,472,730 bytes
- **Referência Formal:** **Messias (2022)**. *AVALIAÇÃO DO POTENCIAL NATURAL EROSIVO LAMINAR COM TÉCNICAS DE*. INPE. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** A erosão é um problema de elevada ocorrência no mun do todo. Consiste num processo que pode culminar na infertilidade do solo, contribuind o, muitas vezes, para o empobrecimento da qualidade das águas. Desse modo, é uma questão de d esenvolvimento sustentável, evidenciando-se como aspecto chave no planejamento ambiental. Este artigo pretende avaliar o potencial natural erosivo laminar da microbacia do Ribeirão Taquara-PR, com o uso da “Equação Universal de Perda de Solos” e utilizando o sistema de informações geográficas SPRING, desenvolvido pelo Instituto Nacional de Pes quisas Espaciais (INP...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 102. l+ARTIGO+7101+-+2023-03-09.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/l+ARTIGO+7101+-+2023-03-09.pdf`
- **Integridade Criptográfica (SHA-256):** `fdcda7a0710af48e0ec69cb3056f53ffba899f8f8da849ff9d6dad50cc8fbc97`
- **Extensão:** 12 páginas | **Tamanho:** 1,443,103 bytes
- **Referência Formal:** **scien (2023)**. *Nature and Conservation*. Land. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Nature and Conservation Dez 2021 a Fev 2022 - v.15 - n.1 ISSN: 2318-2881 This article is also available online at:...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 103. Monitoramento de Erosão Laminar em Diferentes Usos da Terra.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/Monitoramento de Erosão Laminar em Diferentes Usos da Terra.pdf`
- **Integridade Criptográfica (SHA-256):** `0a12236c8646c0f1cb1c8857480bec9427a6b6601082224e3ab8bbbbd913fee7`
- **Extensão:** 19 páginas | **Tamanho:** 542,119 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2008)**. *Sociedade & Natureza, Uberlândia, 20 (2): 157-175, DEZ. 2008*. Sociedade & Natureza. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Sociedade & Natureza, Uberlândia, 20 (2): 157-175, DEZ. 2008 Monitoramento de erosão laminar em diferentes usos da terra, Uberlândia – MG José Fernando Pinese Júnior, Lísia Moreira Cruz, Sí lvio Carlos Rodrigues MONITORAMENTO DE EROSÃO LAMINAR EM DIFERENTES USOS DA TERRA,...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 104. perdasolobaciahidrografica.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/perdasolobaciahidrografica.pdf`
- **Integridade Criptográfica (SHA-256):** `3484fca1086ab2e317a4b5941679465bbb873f134b1b9919ab50dd3963e797ad`
- **Extensão:** 69 páginas | **Tamanho:** 3,951,062 bytes
- **Referência Formal:** **Eduardo (2024)**. *UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ*. Water. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ TAILON DAL’ MASO LUCAS ESTIMATIVA DA PERDA DE SOLO NA BACIA HIDROGRÁFICA DO PARANÁ III: INFLUÊNCIA DE DIFERENTES CENÁRIOS DE CONSERVAÇÃO DO SOLO...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 105. pereira_lh_me_rcla.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/pereira_lh_me_rcla.pdf`
- **Integridade Criptográfica (SHA-256):** `4b59f4c94fa37fe433b5367f562152fa274fe0cd20a6919922695eae2be3353b`
- **Extensão:** 125 páginas | **Tamanho:** 2,022,527 bytes
- **Referência Formal:** **Camila (2022)**. *UNIVERSIDADE ESTADUAL PAULISTA*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** UNIVERSIDADE ESTADUAL PAULISTA Instituto de Geociências e Ciências Exatas Campus Rio Claro LUIZ HENRIQUE PEREIRA...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 106. Relatório de Curadoria e Auditoria Bibliográfica - Projeto SAREL.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/Relatório de Curadoria e Auditoria Bibliográfica - Projeto SAREL.pdf`
- **Integridade Criptográfica (SHA-256):** `2497648afe4ccbb72fd93604e46af3ebe6f7578e5b66dcd923937031a8a0fdab`
- **Extensão:** 4 páginas | **Tamanho:** 385,774 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2026)**. *Relatório de Curadoria e Auditoria Bibliográfica - Projeto SAREL*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** AUDITORIA E CURADORIA BIBLIOGRÁFICA: PROJETO SAREL Análise de Aderência Científica e Extração de Referências do Log "Busca por artigos FLOW" (Maio–Outubro de 2026)...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 107. rgmf,+05+-+GUERRA,+A.+J.+T.;+JORGE,+M.+C.+O.;+RANGEL,+L.+A.;+BEZERRA,+J.+F.+R.;+LOUREIRO,+H.+A.+S.;+GARRITANO,+F.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/rgmf,+05+-+GUERRA,+A.+J.+T.;+JORGE,+M.+C.+O.;+RANGEL,+L.+A.;+BEZERRA,+J.+F.+R.;+LOUREIRO,+H.+A.+S.;+GARRITANO,+F.pdf`
- **Integridade Criptográfica (SHA-256):** `8deffc36d10a6ab477e70af17bfbd4af7360ec4895b4f324531416129768da90`
- **Extensão:** 43 páginas | **Tamanho:** 1,516,024 bytes
- **Referência Formal:** **Fábio Matos (2022)**. *EROSÃO DOS SOLOS, DIFERENTES ABORDAGENS E TÉCNICAS*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** Esse artigo aborda erosão dos solos, em áreas rurais e urbanas, bem como geoturismo e geodiversidade, especialmente erosão em trilhas. Aborda diversos aspectos da erosão dos solos, levando em conta conceitos, teorias e metodologias envolvidas. O artigo apresenta diferentes técnicas para monitorar erosão, desde as mais tradicionais, como estacas colocadas no solo, até as mais modernas, como VANTs e Laser Scanner Terrestre. Os resultados apontam para a necessidade de continuar as pesquisas em erosão dos solos, porq ue, uma vez que esse processo geomorfológico seja melhor entendido, pode auxiliar...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 108. TCC_Lucas Duarte Oliveira.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/TCC_Lucas Duarte Oliveira.pdf`
- **Integridade Criptográfica (SHA-256):** `8fc615b8d272fc7c4a4fa87c63dda37cc950d3f71cf92f6295a5a8ca1c7cbc36`
- **Extensão:** 46 páginas | **Tamanho:** 3,904,328 bytes
- **Referência Formal:** **Lucas Duarte Oliveira (2022)**. *BACHARELADO EM ENGENHARIA AMBIENTAL*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** BACHARELADO EM ENGENHARIA AMBIENTAL MODELAGEM POR MEIO DE INTELIGÊNCIA GEOESPACIAL PARA ESTIMAR A EROSÃO LAMINAR NA BACIA HIDROGRÁFICA DO CÓRREGO GRANDE (ESTADO...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 109. Trabalho-Apa-RNCS-.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/Trabalho-Apa-RNCS-.pdf`
- **Integridade Criptográfica (SHA-256):** `fdd21595a91654f99cc7ca73dd79688692530ae6bbfa926789e323f262071982`
- **Extensão:** 1 páginas | **Tamanho:** 267,715 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2022)**. *SENSORIAMENTO REMOTO APLICADO À EROSÃO DO SOLO NA PORÇÃO*. Periódico / Repositório Científico Indexado. DOI/URL: `-`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** SENSORIAMENTO REMOTO APLICADO À EROSÃO DO SOLO NA PORÇÃO SUL DA APA LITORAL NORTE, MUNICÍPIO DE MATA DE SÃO JOÃO, BAHIA Nathali Lorena de Santana Rego1; Grace Bungenstab Alves1. nalodesare@gmail.com; Poluição, Remediação do Solo e Recuperação de Áreas Degradadas ,...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

### 110. Técnicas de Sensoriamento Remoto.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/Para Revisar/Técnicas de Sensoriamento Remoto.pdf`
- **Integridade Criptográfica (SHA-256):** `0fbf04fc6f2dde3c464a7b901ab405474fb91aab04b0b399d36bb048a024ef57`
- **Extensão:** 25 páginas | **Tamanho:** 523,736 bytes
- **Referência Formal:** **Pesquisador(es) do Estudo (2025)**. *' 10.37885/250920122*. Land. DOI/URL: `10.37885/250920122`
- **Foco Metodológico:** Validação Regional / Estrutura Fundiária (CAR) / Modelagem Preditiva em Microbacias
- **Escopo / Ambiência Geográfica:** Bacia Hidrográfica / Território Regional
- **Síntese do Conteúdo:** As áreas verdes urbanas desempenham funções ecológicas fundamentais, mas enfrentam ameaças crescentes de processos erosivos que comprometem sua integridade e funcionalidade. Este trabalho apresenta uma revisão crítica das técnicas de sensoriamento remoto aplicáveis à detecção de feições erosivas em áreas verdes urbanas, analisando a evolução metodológica desde proces- samento digital tradicional até a aprendizagem profunda. A análise abrange dados publicamente disponíveis, incluindo Landsat, Sentinel-2 e plataformas de processamento em nuvem, bem como abordagens metodológicas categoriza- das e...
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a parametrização de fatores físicos e pedológicos regionais no Paraná (BP3) ou o recorte fundiário por imóvel rural (CAR).
  - **O que a fonte NÃO sustenta:** NÃO sustenta aplicação sem validação em lote independente de amostragem cega (double-blind).

---

## 7. Fichamento Analítico-Crítico: Obras Seminais de Fundamentação na Raiz (2 Obras)

Documentos históricos fundamentais mantidos na raiz de `docs/Selecao Bibliografica/`, responsáveis pela sustentação do Fator R (erosividade das chuvas do Paraná) e do cálculo automático do Fator LS em grades altimétricas complexas.


### 111. agisprocedureforautomaticallycalculatingtheUSLELSfactorontopographicallycom.pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/raiz/agisprocedureforautomaticallycalculatingtheUSLELSfactorontopographicallycom.pdf`
- **Integridade Criptográfica (SHA-256):** `e3b45734da57316c09d1ca63184dc2c4283d015a136cad7fe6c575d5ba4b65cb`
- **Extensão:** 8 páginas | **Tamanho:** 930,133 bytes
- **Referência Formal:** **Robert Hickey (2000)**. *A GIS procedure for automatically calculating the USLE LS factor on topographically complex watersheds*. Computers & Geosciences, v. 26, n. 9-10, p. 1009-1018. DOI/URL: `10.1016/S0098-3004(00)00056-5`
- **Foco Metodológico:** Topografia / MDE / Cálculo Automatizado do Fator LS em SIG / Comprimento de Rampa
- **Escopo / Ambiência Geográfica:** Paraná / Brasil / Global
- **Síntese do Conteúdo:** Obra Seminal Raiz: Algoritmo base para extração de comprimento de rampa cumulativo e declividade a partir de modelos digitais de elevação em SIG.
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta a metodologia de cálculo do fator LS em terrenos não lineares e microbacias complexas via grades de elevação.
  - **O que a fonte NÃO sustenta:** NÃO trata de MDEs interferométricos modernos com ruído de copa florestal (ex.: ALOS PALSAR 12.5m ou MDEs de drones) sem pré-filtragem hidrológica.

### 112. Rufino, Biscaia e Merten (1993).pdf

- **Localização no Acervo:** `docs/Selecao Bibliografica/raiz/Rufino, Biscaia e Merten (1993).pdf`
- **Integridade Criptográfica (SHA-256):** `149fb993bb1baef2833adceabd322ebbccedf442bbcaaac1130e0017a778d8d3`
- **Extensão:** 6 páginas | **Tamanho:** 2,130,995 bytes
- **Referência Formal:** **R. L. Rufino, R. C. M. Biscaia, G. H. Merten (1993)**. *Determinação do potencial de erosão das chuvas do Estado do Paraná, através de pluviogramas e pluviômetros*. Revista Brasileira de Ciência do Solo, v. 17, n. 3, p. 439-444. DOI/URL: `IAPAR / SBCS (Artigo Histórico)`
- **Foco Metodológico:** Fator R da USLE / Erosividade das Chuvas / Equações Regionais do Paraná
- **Escopo / Ambiência Geográfica:** Paraná / Brasil / Global
- **Síntese do Conteúdo:** Obra Seminal Raiz: Estabelece as equações fundamentais de erosividade das chuvas para as diferentes regiões pluviométricas do Paraná.
- **Análise Crítica para a Auditoria:**
  - **O que a fonte sustenta:** Sustenta as regressões empíricas regionais de erosividade anual (EI30) para o Paraná com base em séries históricas pluviográficas.
  - **O que a fonte NÃO sustenta:** NÃO contempla produtos orbitais de satélite (CHIRPS, GPM) nem séries horárias de alta resolução temporal modernas.

---

## 8. Guia e Roteiro de Verificação para o Auditor Externo

Para a condução de uma auditoria técnica e epistemológica independente sobre a dissertação e o código do SAREL, recomenda-se a averiguação dos seguintes pontos focais:


1. **Integridade Forense dos Binários:** Verificar se os hashes SHA-256 informados na Seção 3 coincidem exatamente com os arquivos brutos armazenados no disco local (`Get-FileHash -Algorithm SHA256 <arquivo>`).

2. **Conferência no Primário (Regra R-L2 e R-L3):** Conferir as citações da Seção 2 contra o texto das fontes originais para garantir que nenhum limite metodológico foi violado (ex.: checar se Vrieling (2006) foi citado como proxy espectral e NÃO como detecção física direta de feição centimétrica).

3. **Ausência de Vazamento de Dados (Data Leakage):** Auditar no código-fonte Python (`scripts/treinar_xgboost_loco.py`, `src/lib/matriz/`) se a guarda temporal de 2 anos (Kaufman et al., 2012) e o thinning espacial de 1 km (Roberts et al., 2017) foram aplicados antes de qualquer divisão de treino/teste.

4. **Separação entre Gabarito e Variáveis Preditoras (Regra Inviolável 4):** Confirmar no código que o rótulo de erosão é exclusivamente empírico (observação humana / fotointerpretação) e que índices como RUSLE atuam apenas como features preditoras, jamais como rótulo gabarito supervisionado.

5. **Validação em Bacias Reais (BP3 e Paraná):** Confrontar os achados do SAREL com as teses locais da UTFPR PPGTCA (Krug, 2024; Lucas, 2024) e UNIOESTE (Ribeiro, 2026), verificando a coerência das ordens de grandeza da perda de solo modelada.


---
*Fim do Compêndio Analítico e Crítico da Seleção Bibliográfica — SAREL v2 (PPGTCA 2026)*
