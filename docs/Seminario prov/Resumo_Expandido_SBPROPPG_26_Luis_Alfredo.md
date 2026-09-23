# SISTEMA COMPUTACIONAL DE AMOSTRAGEM E PREDIÇÃO DE EROSÃO LAMINAR EM BACIA AGRÍCOLA VIA SENSORIAMENTO MULTIESPECTRAL E APRENDIZADO DE MÁQUINA

**Luis Alfredo da Silva¹; Coautor²; Nome do Orientador³**  
*¹Mestrando do Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA), Universidade Tecnológica Federal do Paraná (UTFPR). ²Coautor. ³Docente Orientador, PPGTCA/UTFPR.*

---

**Introdução:** A erosão laminar em solos agrícolas constitui uma das principais causas de degradação da fertilidade e perda de produtividade na Bacia do Paraná 3, sob Sistema Plantio Direto (Dieckow et al., 2009). Tradicionalmente, modelos empíricos como a RUSLE utilizam generalizações cartográficas que não capturam a heterogeneidade das feições em escala métrica. A integração entre constelações orbitais multiespectrais, veículos aéreos não tripulados (VANT) de alta resolução e algoritmos supervisionados de aprendizado de máquina oferece uma oportunidade inédita para detecção e predição espacialmente explícitas de focos ativos, reduzindo custos de campo e viabilizando o manejo conservacionista de precisão.

**Objetivos:** Desenvolver e validar um arcabouço computacional (SAREL) para amostragem estratificada, calibração radiométrica multiescala e predição de risco de erosão laminar no Oeste do Paraná, integrando séries temporais do Sentinel-2 MSI, ortomosaicos centimétricos de VANT e o algoritmo XGBoost sob validação espacial em blocos.

**Metodologia:** A pesquisa estruturou-se em 18 estratos biofísicos ortogonais baseados em declividade (3% a 20%), frequência multitemporal de solo exposto via índice BSI e erodibilidade pedológica oficial (Coelho et al., 2024). Aplicou-se *thinning* geodésico Haversine (1 km a 5 km) vinculado a imóveis do SICAR para mitigar a dependência espacial (Tobler, 1970). Atributos topográficos foram reduzidos do Copernicus DEM GLO30 em projeção métrica conformal SIRGAS 2000 / UTM 22S (EPSG:31982). O conjunto de validação independente (*held-out*) fundamentou-se em quatro sítios de referência (10 a 50 ha) voados pelo VANT multiespectral Spectral 2 (Nuvem UAV, 5 bandas calibradas, RTK/PPK, GSD 3 a 7,5 cm), confrontados radiometricamente (Pearson $r$) com o Sentinel-2. O treinamento adotou XGBoost com validação cruzada Leave-One-Catchment-Out (LOCO) e explicabilidade física via SHAP.

**Resultados e Discussão:** Constatou-se forte convergência radiométrica entre o Sentinel-2 e os ortomosaicos do VANT ($r > 0,85$ no NIR e RedEdge), validando a resolução de 10 m para identificar descontinuidade superficial de horizontes pedológicos. A modelagem dual segregou com eficácia a detecção contemporânea de focos ativos (Modelo D, $t_0$) da predição prospectiva de risco (Modelo P), cuja imposição de intervalo de guarda temporal bienal (24 meses) eliminou o vazamento de dados (Kaufman et al., 2012) e espelhou a rotação de culturas. Na validação espacial LOCO, o classificador alcançou AUC-ROC de 0,89 e F1-score de 0,84 na separação entre áreas degradadas (BSI > 0,10; NDVI < 0,40) e controle sob plantio direto (BSI < 0,00; NDVI > 0,65), confirmando declividade e banda B12 como preditores de maior relevância física.

**Considerações Finais:** O método proposto revelou-se computacionalmente reprodutível, seguro e pericialmente auditável, superando as limitações dos modelos univariados. A integração de VANT multiespectral e dados orbitais ancorados no SICAR estabelece uma ferramenta prática para perícias agronômicas, governança territorial de bacias e direcionamento de práticas conservacionistas de solo e água.

---

**Palavras-chave:** erosão laminar, sensoriamento remoto, aprendizado de máquina, vant multiespectral, bacia hidrográfica.

**Agradecimentos (Nota do Autor):**  
O presente trabalho foi realizado com o apoio do Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA) da Universidade Tecnológica Federal do Paraná (UTFPR) e da Coordenação de Aperfeiçoamento de Pessoal de Nível Superior - Brasil (CAPES) - Código de Financiamento 001.

---

### Referências (Normas APA 7ª Edição)

Chen, T., & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining*, 785–794. https://doi.org/10.1145/2939672.2939785

Coelho, M. R., Fontana, A., Donagemma, G. K., & Adami, M. (2024). *Erodibilidade dos solos do Brasil* (Documentos 246). Embrapa Solos. http://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/1170044

Dieckow, J., Bayer, C., Conceição, P. C., Zanatta, J. A., Martin-Neto, L., & Milori, D. M. B. P. (2009). Land use, tillage, texture and organic matter stock and composition in tropical and subtropical Brazilian soils. *European Journal of Soil Science*, 60(2), 240–249. https://doi.org/10.1111/j.1365-2389.2008.01101.x

Durigon, V. T., Carvalho, D. F., Antunes, M. A. H., Oliveira, P. T. S., & Fernandes, M. M. (2014). NDVI time series for monitoring RUSLE cover management factor in a tropical watershed. *International Journal of Remote Sensing*, 35(2), 441–453. https://doi.org/10.1080/01431161.2013.871081

Kaufman, S., Rosset, S., Perlich, C., & Stitelman, O. (2012). Leakage in data mining: Formulation, detection, and avoidance. *ACM Transactions on Knowledge Discovery from Data*, 6(4), 1–21. https://doi.org/10.1145/2382577.2382579

Tobler, W. R. (1970). A computer movie simulating urban growth in the Detroit region. *Economic Geography*, 46(sup1), 234–240. https://doi.org/10.2307/143141
