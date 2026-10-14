# ARCABOUÇO COMPUTACIONAL AUDITÁVEL PARA AMOSTRAGEM ESTRATIFICADA E PREDIÇÃO DE EROSÃO LAMINAR EM BACIA AGRÍCOLA VIA SENSORIAMENTO MULTIESPECTRAL E APRENDIZADO DE MÁQUINA

**Luis Alfredo da Silva¹; Coautor²; Nome do Orientador³**  
*¹Mestrando do Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA), Universidade Tecnológica Federal do Paraná (UTFPR). ²Coautor. ³Docente Orientador, PPGTCA/UTFPR.*

---

**Introdução:** A erosão laminar degrada a fertilidade e reduz a produtividade na Bacia do Paraná 3, sob Sistema Plantio Direto (Dieckow et al., 2009). Modelos empíricos como a RUSLE apoiam-se em generalizações cartográficas que não capturam a heterogeneidade das feições em escala métrica. A integração entre constelações orbitais multiespectrais, veículos aéreos não tripulados (VANT) de alta resolução e aprendizado de máquina supervisionado abre caminho para a detecção e a predição espacialmente explícitas de focos ativos, reduzindo custos de campo e viabilizando o manejo conservacionista de precisão.

**Objetivo:** Desenvolver e validar um arcabouço computacional auditável (SAREL) para amostragem estratificada, calibração radiométrica multiescala e predição de risco de erosão laminar no Oeste do Paraná, integrando séries temporais do Sentinel-2 MSI, ortomosaicos centimétricos de VANT e o algoritmo XGBoost sob validação espacial em blocos.

**Metodologia:** O desenho amostral organiza-se em 18 estratos biofísicos ortogonais de declividade (3% a 20%), frequência multitemporal de solo exposto (índice BSI) e erodibilidade pedológica oficial (Coelho et al., 2024). Aplica-se *thinning* geodésico Haversine (1 km a 5 km) sobre imóveis do SICAR, mitigando a dependência espacial (Tobler, 1970). Atributos topográficos são reduzidos do Copernicus DEM GLO-30 em projeção métrica SIRGAS 2000 / UTM 22S (EPSG:31982), e o Fator C da RUSLE deriva de séries NDVI (Durigon et al., 2014). A validação independente (*held-out*) prevê quatro sítios contínuos de 10 a 50 ha, a imagear por VANT multiespectral (cinco bandas, RTK/PPK, GSD 3 a 7,5 cm) e confrontar radiometricamente com o Sentinel-2. O treinamento adotará XGBoost (Chen & Guestrin, 2016) sob validação cruzada Leave-One-Catchment-Out (Roberts et al., 2017), com explicabilidade via SHAP (Lundberg & Lee, 2017).

**Resultados e Discussão:** Esta etapa reporta a validação da infraestrutura computacional, não do desempenho preditivo. O sistema sustenta 270 testes automatizados e um varredor estático que barra constantes arbitrárias e dados sintéticos: toda variável carrega proveniência e data de aquisição, e ausência de dado nunca vira valor. Implementou-se a arquitetura dual, que segrega a detecção de focos ativos (Modelo D, $t_0$) da predição prospectiva (Modelo P), com guarda temporal de 24 meses que previne vazamento de dados (Kaufman et al., 2012) e espelha a rotação de culturas. Executou-se um *benchmark* de integridade do fluxo XGBoost + SHAP sob partição espacial, com a classe de controle sintetizada apenas para teste do *pipeline* e assim sinalizada no relatório: suas métricas aferem o código, não a separabilidade do fenômeno.

**Considerações Finais:** O arcabouço mostrou-se reprodutível e pericialmente auditável, com rastreabilidade ponto a ponto — contribuição direta para perícias agronômicas e governança territorial de bacias. A limitação principal é que a campanha de rotulagem e os sobrevoos ainda não foram executados; o desempenho preditivo será aferido após os rótulos periciais.

---

**Palavras-chave:** erosão laminar, sensoriamento remoto, aprendizado de máquina, vant multiespectral, bacia hidrográfica.

**Agradecimentos (Nota do Autor):**  
O presente trabalho foi realizado com o apoio do Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA) da Universidade Tecnológica Federal do Paraná (UTFPR) e do Itaipu Parquetec.

---

### Referências (Normas APA 7ª Edição)

Chen, T., & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining*, 785–794. https://doi.org/10.1145/2939672.2939785

Coelho, M. R., Lumbreras, J. F., Amaral, A. J. do, Vasques, G. M., Mansilla Baca, J. F., Dart, R. de O., & Pedreira, J. P. das N. C. (2024). *Erodibilidade dos solos do Brasil* (Documentos 246). Embrapa Solos. https://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/1170044

Dieckow, J., Bayer, C., Conceição, P. C., Zanatta, J. A., Martin-Neto, L., Milori, D. M. B. P., Salton, J. C., Macedo, M. M., Mielniczuk, J., & Hernani, L. C. (2009). Land use, tillage, texture and organic matter stock and composition in tropical and subtropical Brazilian soils. *European Journal of Soil Science*, 60(2), 240–249. https://doi.org/10.1111/j.1365-2389.2008.01101.x

Durigon, V. L., Carvalho, D. F., Antunes, M. A. H., Oliveira, P. T. S., & Fernandes, M. M. (2014). NDVI time series for monitoring RUSLE cover management factor in a tropical watershed. *International Journal of Remote Sensing*, 35(2), 441–453. https://doi.org/10.1080/01431161.2013.871081

Kaufman, S., Rosset, S., Perlich, C., & Stitelman, O. (2012). Leakage in data mining: Formulation, detection, and avoidance. *ACM Transactions on Knowledge Discovery from Data*, 6(4), 1–21. https://doi.org/10.1145/2382577.2382579

Lundberg, S. M., & Lee, S.-I. (2017). A unified approach to interpreting model predictions. In *Advances in Neural Information Processing Systems* (Vol. 30). Curran Associates. https://papers.nips.cc/paper_files/paper/2017/hash/8a20a8621978632d76c43dfd28b67767-Abstract.html

Roberts, D. R., Bahn, V., Ciuti, S., Boyce, M. S., Elith, J., Guillera-Arroita, G., Hauenstein, S., Lahoz-Monfort, J. J., Schröder, B., Thuiller, W., Warton, D. I., Wintle, B. A., Hartig, F., & Dormann, C. F. (2017). Cross-validation strategies for data with temporal, spatial, hierarchical, or phylogenetic structure. *Ecography*, 40(8), 913–929. https://doi.org/10.1111/ecog.02881

Tobler, W. R. (1970). A computer movie simulating urban growth in the Detroit region. *Economic Geography*, 46(sup1), 234–240. https://doi.org/10.2307/143141
