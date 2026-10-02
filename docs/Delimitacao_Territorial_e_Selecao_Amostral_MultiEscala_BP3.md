# Delimitação Cartográfica Híbrida da Bacia Hidrográfica do Paraná 3 e Desenho de Seleção Amostral em Três Escalas Integradas (Orbital, In-Loco e VANT/Drone)

**Instituição:** Universidade Tecnológica Federal do Paraná (UTFPR) — Campus Medianeira  
**Programa:** Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA — 2026)  
**Pesquisa de Mestrado:** Sistema de Amostragem e Predição de Erosão Laminar no Paraná (SAREL v2.0)  
**Mestrando:** Luis Alfredo  
**Seção de Destino na Dissertação:** Capítulo 3 — Material e Métodos (Delimitação Territorial e Delineamento Amostral)

---

## 1. Fundamentação e Dupla Delimitação Cartográfica da Bacia Hidrográfica do Paraná 3

Na modelagem preditiva de processos hidrossedimentológicos assistida por sensoriamento remoto orbital e aprendizado de máquina, a definição rigorosa da **moldura amostral (*sampling frame*)** constitui requisito essencial para assegurar a validade interna e externa das inferências estatísticas (COCHRAN, 1977; BRUS, 2019). De acordo com a literatura clássica de conservação do solo e da água (WISCHMEIER; SMITH, 1978; RENARD et al., 1997), a **bacia hidrográfica** representa a unidade geomorfológica e hidrológica natural de recepção, escoamento superficial e transporte de sedimentos. Todavia, no contexto da gestão territorial brasileira, a operacionalização de políticas agroambientais, o cruzamento cadastral fundiário (SICAR/SNCR/SIGEF) e as estatísticas oficiais organizam-se segundo os **limites legais político-administrativos dos municípios** homologados pelo Instituto Brasileiro de Geografia e Estatística (IBGE) e pelo Instituto de Terras, Cartografia e Geociências do Paraná (ITCG, atual Instituto Água e Terra — IAT).

Para conciliar o rigor hidrológico com a exatidão jurídico-administrativa, o sistema **SAREL v2.0** implementa uma **arquitetura cartográfica híbrida em três camadas espaciais sobrepostas** (referenciadas ao Datum Oficial **SIRGAS 2000 / WGS 84 — EPSG:4326**), eliminando simplificações poligonais esquemáticas e desmembrando formalmente a **Bacia Hidrográfica do Paraná 3 (BP3)** da vizinha **Bacia Hidrográfica do Rio Piquiri (PIQ)**, em conformidade com a **Lei Estadual nº 12.726/1999** e a **Resolução CERH/PR nº 49/2006**:

1. **Limite Hidrológico Estrito da Bacia Hidrográfica do Paraná 3 (`BP3` — IAT/SEMA/ANA, $\approx 7.979\text{ km}^2$):**  
   Compreende o conjunto de microbacias da margem esquerda do Rio Paraná cujos cursos d'água drenam diretamente para o Reservatório da Usina Hidrelétrica de Itaipu (entre os municípios de Guaíra, ao norte, e Foz do Iguaçu, ao sul). Seu contorno oeste acompanha integralmente a linha de cota de inundação do Lago de Itaipu / Rio Paraná (fronteira internacional com o Paraguai), enquanto seu limite leste/norte/sul segue o divisor topográfico de águas (espigão da Serra Geral / eixo da rodovia BR-277) que a separa das bacias dos rios Piquiri (ao norte/nordeste) e Baixo Iguaçu (ao sul/sudeste).

2. **Limite Legal Político-Administrativo dos 28 Municípios Abrangidos (`BP3-MUN` — IBGE/ITCG, $\approx 13.350\text{ km}^2$):**  
   Corresponde à união vetorial oficial (API de Malhas Territoriais v3 do IBGE e Base Cartográfica ITCG) dos **28 municípios do Oeste Paranaense** que integram territorialmente a Região Hidrográfica do Paraná 3. Conforme demonstrado na cartografia oficial do estado (Quadro 1), **19 municípios possuem $100\%$ de sua área territorial contida no interior do divisor hidrológico da BP3**, enquanto **9 municípios limítrofes** são seccionados pelo divisor topográfico de águas, possuindo drenagem compartilhada com as bacias do Rio Piquiri ou do Baixo Iguaçu.

3. **Corredor Agroecológico Experimental para Verificação Presencial In-Loco e VANT (`BP3-COR` — Foz do Iguaçu a Céu Azul, $\approx 2.920\text{ km}^2$):**  
   Circunscreve o recorte contínuo formado pelos **6 municípios do eixo longitudinal sul-sudeste da bacia** (**Foz do Iguaçu, Santa Terezinha de Itaipu, São Miguel do Iguaçu, Medianeira, Matelândia e Céu Azul**), estrategicamente centrado na sede do Programa de Pós-Graduação (UTFPR — Campus Medianeira). Este corredor sintetiza, em um transecto de aproximadamente $80\text{ km}$, toda a amplitude altimétrica, topo-sequencial e pedológica da Bacia do Paraná 3:
   - **Compartimento Inferior (Calha do Lago de Itaipu — Foz do Iguaçu e Santa Terezinha de Itaipu):** altitudes de $180\text{ a }250\text{ m}$, relevo plano a suave-ondulado ($2\%\text{ a }6\%$ de declividade), predomínio de Latossolos Vermelhos e feições deposicionais de sopé;
   - **Compartimento Intermediário (Planalto de Medianeira e São Miguel do Iguaçu):** altitudes de $250\text{ a }450\text{ m}$, relevo suave-ondulado ($4\%\text{ a }10\%$), agricultura intensiva de grãos sob Sistema Plantio Direto (SPD) sobre Latossolos Vermelhos Eutroférricos;
   - **Compartimento Superior (Rebordo do Terceiro Planalto — Matelândia e Céu Azul):** altitudes de $550\text{ a }750\text{ m}$, relevo ondulado a forte-ondulado ($8\%\text{ a }20\%$), transição expressiva para Nitossolos Vermelhos Eutróficos e Latossolos Distroférricos, configurando a zona crítica de alta energia cinética de escoamento e desprendimento laminar.

### Quadro 1 — Relação Oficial dos 28 Municípios da Bacia Hidrográfica do Paraná 3 (Base Cartográfica ITCG / IBGE)

| Nº no Mapa (ITCG) | Município | Código IBGE (7 dígitos) | Inserção no Divisor Hidrológico (IAT) | Papel no Desenho Amostral do SAREL v2.0 |
| :---: | :--- | :---: | :--- | :--- |
| **01** | Cascavel | `4104808` | Parcial (Divisor Leste — Piquiri / Iguaçu / BP3) | Fase A — Amostragem Orbital da Bacia |
| **02** | Toledo | `4127700` | Integral ($100\%$ na BP3) | Fase A — Amostragem Orbital da Bacia |
| **03** | Maripá | `4115358` | Parcial (Divisor Norte — BP3 / Piquiri) | Fase A — Amostragem Orbital da Bacia |
| **04** | Terra Roxa | `4127403` | Parcial (Divisor Norte — BP3 / Piquiri) | Fase A — Amostragem Orbital da Bacia |
| **05** | Tupãssi | `4127957` | Parcial (Divisor Nordeste — BP3 / Piquiri) | Fase A — Amostragem Orbital da Bacia |
| **06** | Guaíra | `4108809` | Parcial (Divisor Extremo Norte — BP3 / Piquiri) | Fase A — Amostragem Orbital da Bacia |
| **07** | Mercedes | `4115853` | Integral ($100\%$ na BP3) | Fase A — Amostragem Orbital da Bacia |
| **08** | Quatro Pontes | `4120853` | Integral ($100\%$ na BP3) | Fase A — Amostragem Orbital da Bacia |
| **09** | Nova Santa Rosa | `4117222` | Integral ($100\%$ na BP3) | Fase A — Amostragem Orbital da Bacia |
| **10** | Marechal Cândido Rondon | `4114609` | Integral ($100\%$ na BP3) | Fase A — Amostragem Orbital da Bacia |
| **11** | Pato Bragado | `4118451` | Integral ($100\%$ na BP3) | Fase A — Amostragem Orbital da Bacia |
| **12** | Entre Rios do Oeste | `4107538` | Integral ($100\%$ na BP3) | Fase A — Amostragem Orbital da Bacia |
| **13** | Ouro Verde do Oeste | `4117453` | Integral ($100\%$ na BP3) | Fase A — Amostragem Orbital da Bacia |
| **14** | São José das Palmeiras | `4125456` | Integral ($100\%$ na BP3) | Fase A — Amostragem Orbital da Bacia |
| **15** | São Pedro do Iguaçu | `4125753` | Integral ($100\%$ na BP3) | Fase A — Amostragem Orbital da Bacia |
| **16** | Santa Tereza do Oeste | `4124020` | Parcial (Divisor Sudeste — BP3 / Iguaçu) | Fase A — Amostragem Orbital da Bacia |
| **17** | Santa Helena | `4123501` | Integral ($100\%$ na BP3) | Fase A — Amostragem Orbital da Bacia |
| **18** | Diamante D'Oeste | `4107157` | Integral ($100\%$ na BP3) | Fase A — Amostragem Orbital da Bacia |
| **19** | Vera Cruz do Oeste | `4128559` | Integral ($100\%$ na BP3) | Fase A — Amostragem Orbital da Bacia |
| **20** | **Céu Azul** | `4105300` | Parcial (Divisor Sul/Leste — BR-277) | **Fase A + Fase B (In-Loco) + Fase D (VANT: Sítios Gama e Delta)** |
| **21** | Missal | `4116059` | Integral ($100\%$ na BP3) | Fase A — Amostragem Orbital da Bacia |
| **22** | Ramilândia | `4121257` | Integral ($100\%$ na BP3) | Fase A — Amostragem Orbital da Bacia |
| **23** | Itaipulândia | `4110953` | Integral ($100\%$ na BP3) | Fase A — Amostragem Orbital da Bacia |
| **24** | **Medianeira** | `4115804` | Integral ($100\%$ na BP3) | **Fase A + Fase B (In-Loco) + Fase D (VANT: Sítios Alfa e Beta)** |
| **25** | **Matelândia** | `4115606` | Parcial (Divisor Sul — BR-277) | **Fase A + Fase B (Subamostra In-Loco no Corredor)** |
| **26** | **São Miguel do Iguaçu** | `4125704` | Integral ($100\%$ na BP3) | **Fase A + Fase B (Subamostra In-Loco no Corredor)** |
| **27** | **Santa Terezinha de Itaipu** | `4124053` | Integral ($100\%$ na BP3) | **Fase A + Fase B (Subamostra In-Loco no Corredor)** |
| **28** | **Foz do Iguaçu** | `4108304` | Parcial (Divisor Extremo Sul — BP3 / Iguaçu) | **Fase A + Fase B (Subamostra In-Loco no Corredor)** |

---

## 2. Seleção Amostral Estratificada e Partição Proporcional entre Bacia Toda (Fase A) e Verificação In-Loco (Fase B)

### 2.1 Estratificação Biofísica Cruzada ($3 \times 3 \times 2 = 18$ Estratos) e Thinning Geodésico

Dentro dos limites ativos da Bacia Hidrográfica do Paraná 3, a população elegível de pontos amostrais é restrita exclusivamente a imóveis rurais homologados na base oficial do **Cadastro Ambiental Rural (SICAR/SNCR)**, descartando-se áreas urbanas, corpos hídricos permanentes, reservas florestais densas e faixas de domínio rodoviário.

Para impedir a **autocorrelação espacial positiva** descrita pela Primeira Lei da Geografia de Tobler (1970) — segundo a qual pixels contíguos de um mesmo talhão agrícola exibem assinaturas espectrais e pedológicas redundantes, inflando artificialmente as métricas de validação cruzada —, aplica-se a filtragem de **Thinning Geodésico Determinístico** via distância ortodrômica de Haversine ($d_{\min} \ge 1,0\text{ a }5,0\text{ km}$ entre centróides vizinhos).

Os candidatos espacialmente descorrelacionados são então submetidos à **Amostragem Aleatória Estratificada Multivariada**, estruturada pelo produto cartesiano de três variáveis biofísicas governantes da Equação Universal de Perda de Solo Revisada (RUSLE):
1. **Declividade Topográfica ($S$, extraída do Copernicus GLO-30 DEM a $30\text{ m}$):** dividida em 3 níveis (Terço Suave: $3\% \le S < 6\%$; Terço Moderado: $6\% \le S < 12\%$; Terço Forte: $S \ge 12\%$);
2. **Frequência Histórica de Exposição de Solo Nu ($E$, série decenal Sentinel-2 MSI L2A 2016–2026):** dividida em 3 tercis de persistência temporal de solo descoberto ($\text{NDVI} < 0,25$ e $\text{BSI} > 0,05$);
3. **Susceptibilidade / Erodibilidade Pedológica ($K$, base SiBCS/Embrapa):** dividida em 2 classes (Nível $K_1$ — solos de maior estabilidade estrutural e permeabilidade, como Latossolos Vermelhos Distroférricos/Eutroférricos; Nível $K_2$ — solos com gradiente textural e maior susceptibilidade ao cisalhamento superficial, como Nitossolos e Argissolos).

Esse cruzamento gera **$3(S) \times 3(E) \times 2(K) = 18$ estratos biofísicos ortogonais**, garantindo que todas as combinações de relevo, cobertura e solo sejam equitativamente representadas.

---

### 2.2 Acoplamento Proporcional entre a Amostra Total da Bacia e a Subamostra In-Loco no Corredor Foz–Céu Azul

Uma questão metodológica central em levantamentos regionais consiste em definir como as amostras destinadas à **verificação presencial de campo (*ground truth*)** relacionam-se com o **conjunto amostral total da bacia hidrográfica**. No sistema SAREL v2.0, adota-se o **delineamento em duas fases com alocação proporcional estratificada acoplada**, parametrizável diretamente na interface de Eleição Amostral no Google Earth Engine (`proporcaoInLocoCorredorPct`):

Seja $N_{\text{total}}$ o número total de pontos candidatos sorteados na Bacia Hidrográfica do Paraná 3 (por exemplo, $N_{\text{total}} = 300\text{ a }500$ pontos no experimento completo da dissertação, ou $N_{\text{total}} = 50$ pontos em bateria piloto) e seja $p_{\text{in-loco}} \in [0,15;\, 0,20]$ (padrão de **$20\%$**) a fração destinada à auditoria presencial. O algoritmo particiona o sorteio estratificado em duas subpopulações complementares e mutuamente exclusivas:

$$N_{\text{total}} = N_{\text{Fase A (Macrobacia)}} + N_{\text{Fase B (Corredor In-Loco)}}$$

onde:

$$N_{\text{Fase B (Corredor In-Loco)}} = \text{round}\!\left(\frac{p_{\text{in-loco}}}{100} \cdot N_{\text{total}}\right)$$

$$N_{\text{Fase A (Macrobacia)}} = N_{\text{total}} - N_{\text{Fase B (Corredor In-Loco)}}$$

#### Funcionamento Prático na Execução Experimental:
1. **Subconjunto Fase A — Triagem Orbital na Macrobacia ($80\%\text{ a }85\%$ do total, ex.: $240\text{ pontos}$ para $N=300$, ou $40\text{ pontos}$ para $N=50$):**  
   Os pontos são sorteados de forma estratificada nos **18 estratos biofísicos** ao longo dos **22 municípios restantes da Bacia do Paraná 3** (de Guaíra, Terra Roxa, Marechal Cândido Rondon e Toledo até Santa Helena, Missal, Itaipulândia e Cascavel). Cada ponto recebe a extração automatizada de séries temporais orbitais de 10 anos do **Sentinel-2 MSI ($10\text{ m}$)**, mosaicos de alta resolução **PlanetScope NICFI ($3\text{ m}$)** pós-eventos extremos de precipitação (**CHIRPS / GPM IMERG**) e modelagem topográfica **Copernicus DEM ($30\text{ m}$)**, compondo a matriz de treinamento e validação cruzada espacial por blocos (**LOCO — *Leave-One-Catchment-Out***) do algoritmo **XGBoost**.

2. **Subconjunto Fase B — Verificação Presencial In-Loco no Corredor Foz–Céu Azul ($15\%\text{ a }20\%$ do total, ex.: $45\text{ a }60\text{ pontos}$ para $N=300$, ou $10\text{ pontos}$ para $N=50$):**  
   Simultaneamente, a fração exata $p_{\text{in-loco}}$ é sorteada aplicando-se a **mesma grade de 18 estratos biofísicos**, porém circunscrita ao polígono oficial do **Corredor Agroecológico Foz do Iguaçu – Céu Azul (`BP3-COR`)**. Cada ponto sorteado nesta subamostra recebe automaticamente a etiqueta de proveniência `[Fase B: Subamostra In-Loco — Corredor Foz–Céu Azul]` e é exportado sob o perfil estrito **`campo-cego` (Regra 4 — Protocolo Duplo-Cego)**.
   - **Blindagem contra Viés de Confirmação:** Na planilha e no aplicativo móvel de coleta em campo (*SAREL Field Collector* / KoboToolbox), o avaliador recebe exclusivamente as coordenadas geodésicas (SIRGAS 2000), o código do imóvel rural (CAR) e a rota de acesso. Todas as variáveis orbitais (NDVI, BSI, NBR2, fatores da RUSLE e predições preliminares do modelo) são suprimidas.
   - **Métrica de Concordância:** Os rótulos empíricos coletados presencialmente no corredor Foz–Céu Azul (registro de decapitação do horizonte A, pedestais de erosão por salpico, selamento superficial, micro-ravinas e assoreamento de terraços) são confrontados com a interpretação visual multi-sensor para o cálculo formal do **Coeficiente Kappa de Cohen ($\kappa \ge 0,61$, com intervalo de confiança a $95\%$)** e da taxa de erro $\varepsilon$ das classes amostrais.

---

## 3. Arquitetura das Áreas de Voo de VANT / Drone (Fase D — Sítios de Referência Padrão-Ouro `Held-Out`)

### 3.1 Por que as Áreas de Voo do Drone são Polígonos Contínuos de ~50 Hectares e Não Pontos Isolados?

Um diferencial metodológico fundamental do **SAREL v2.0** reside na distinção geométrica entre a **amostragem pontual** (Fases A e B) e o **mapeamento aerofotogramétrico contínuo por VANT/Drone (Fase D)**. Enquanto os satélites e as vistorias rápidas de campo avaliam coordenadas discretas, o fenômeno físico da **erosão hídrica laminar** não ocorre de maneira estática em um único ponto: ele é um **processo hidrossedimentológico contínuo ao longo da rampa (catena topo-sequencial)**.

Estudos tradicionais baseados em microparcelas experimentais (como a parcela padrão de Wischmeier de $22,1\text{ m} \times 1,8\text{ m}$) sofrem da chamada **falácia da microparcela**, pois não capturam a convergência tridimensional do escoamento superficial, o comprimento real das vertentes mecanizadas ($200\text{ a }800\text{ m}$), a eficácia ou ruptura de terraços agrícolas e a transição entre a zona de arranque (erosão) e a zona de sedimentação (colúvio).

Para superar essa limitação, as áreas de voo de VANT/Drone na Fase D foram projetadas como **4 polígonos contínuos de propriedades rurais reais (de $\approx 49,5\text{ a }50,0\text{ hectares}$ cada, totalizando $198,56\text{ hectares contínuos}$)** extraídos diretamente da base cadastral do **SICAR/CAR** dentro do corredor experimental (**municípios de Medianeira e Céu Azul**), conforme especificado no Quadro 2.

### Quadro 2 — Especificação dos 4 Sítios de Referência Padrão-Ouro (Áreas Contínuas de Voo de VANT/Drone)

| Identificador no SAREL | Município (Corredor BP3) | Registro Oficial no Cadastro Ambiental Rural (SICAR) | Área Contínua do Voo (ha) | Altitude Média (m) | Compartimento Geomorfológico | Total de Pixels Sentinel-2 ($10\times 10\text{ m}$) Equivalentes |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| **Sítio Alfa** (`sitio-ouro-01`) | **Medianeira** | `PR-4115804-63E945FC816944DA84D2DB2C9C3AF6F3` | **$49,94\text{ ha}$** | $395\text{ m}$ | Planalto Intermediário (Suave-Ondulado) | $4.994\text{ pixels}$ |
| **Sítio Beta** (`sitio-ouro-02`) | **Medianeira** | `PR-4115804-4ACF9DE20F19462B89232E3E54565B6E` | **$49,54\text{ ha}$** | $410\text{ m}$ | Planalto Intermediário (Transição Pedológica) | $4.954\text{ pixels}$ |
| **Sítio Gama** (`sitio-ouro-03`) | **Céu Azul** | `PR-4105300-DD634A8A94FB403B8C5492F9BF22EF5B` | **$49,54\text{ ha}$** | $580\text{ m}$ | Rebordo do 3º Planalto (Ondulado a Forte) | $4.954\text{ pixels}$ |
| **Sítio Delta** (`sitio-ouro-04`) | **Céu Azul** | `PR-4105300-DED72F1D0CA84A9AA5413B121592E6C0` | **$49,54\text{ ha}$** | $575\text{ m}$ | Rebordo do 3º Planalto (Alta Energia Cinética) | $4.954\text{ pixels}$ |
| **TOTAL FASE D** | **Medianeira & Céu Azul** | **4 Imóveis Rurais Auditados (Held-Out)** | **$198,56\text{ ha}$** | **$395\text{–}580\text{ m}$** | **Gradiente Completo da Bacia BP3** | **$19.856\text{ pixels}$** |

---

### 3.2 Estrutura Interna de Cada Área de Voo (A Catena em 3 Compartimentos) e Validação Matricial `Held-Out`

Cada um dos 4 polígonos de $\approx 50\text{ ha}$ foi selecionado de modo a englobar integralmente os **três compartimentos geomorfológicos da vertente agrícola**:

1. **Compartimento 1 — Topo Estável (`topo_estavel`, declividade de $2\%\text{ a }6\%$):**  
   Região do divisor local de águas (interflúvio), caracterizada por baixa velocidade de escoamento superficial, predomínio de infiltração vertical e ausência de feições de arraste laminar.
2. **Compartimento 2 — Meia Encosta de Escoamento (`encosta_escoamento`, declividade de $8\%\text{ a }18\%$):**  
   Terço médio da rampa onde o acúmulo de fluxo aumenta a tensão de cisalhamento hidráulico ($\tau_0$), provocando o desprendimento seletivo de argilas e matéria orgânica, exposição de horizontes subsuperficiais mais avermelhados/claros (aumento de reflectance no Vermelho/SWIR e elevação do índice BSI) e formação de erosão laminar severa.
3. **Compartimento 3 — Baixada e Sopé de Deposição (`baixada_deposicao`, declividade de $1\%\text{ a }5\%$):**  
   Zona de concavidade basal onde a redução abrupta do gradiente hidráulico reduz a capacidade de transporte da enxurrada, depositando os sedimentos erodidos da meia encosta sob a forma de leques coluviais e acúmulo de umidade.

#### Especificação Sensorial do VANT e Protocolo de Validação Externa (`Held-Out`):
- **Aeronave e Sensor Multiespectral:** Levantamento com VANT **Spectral 2 (Nuvem UAV)** (ou plataforma multiespectral equivalente), operando em 5 bandas espectrais discretas (**Blue, Green, Red, RedEdge e NIR**), calibrado radiometricamente por sensor de irradiância solar incidente (*Downwelling Light Sensor* — DLS) e painel de reflectância difusa calibrada.
- **Resolução Espacial e Posicionamento:** Resolução espacial no terreno (**GSD**) de **$7,5\text{ cm/pixel}$** (cerca de $17.700$ vezes mais detalhado em área que o pixel de $10\text{ m} \times 10\text{ m}$ do Sentinel-2), com georreferenciamento cinemático pós-processado (**PPK/RTK**) de precisão centimétrica, gerando o **Ortomosaico Multiespectral** e o **Modelo Digital de Terreno (MDT) centimétrico**.
- **Blindagem Estatística (`Held-Out` — Validação Matricial Externa):**  
  Os 4 sítios de voo de drone possuem o atributo estrito `papelConjunto = "held-out"`. Isso significa que **nenhum dos $19.856$ pixels de $10\text{ m} \times 10\text{ m}$ contidos no interior desses 4 polígonos participa do treinamento do modelo XGBoost**. Após o treinamento do modelo com as amostras da Bacia do Paraná 3 (Fases A e B), os mapas contínuos de verdade terrestre gerados pelo drone ($7,5\text{ cm}$) são agregados espacialmente para a grade exata de $10\text{ m} \times 10\text{ m}$ do Sentinel-2, permitindo validar matricialmente ($19.856\text{ pixels}$ independentes) se o classificador é capaz de:
  1. Detectar com precisão a mancha espacial de **erosão laminar ativa** na meia encosta (`encosta_escoamento`); e
  2. **Não confundir** o sedimento depositado na baixada (`baixada_deposicao`) ou a palhada senescente no topo (`topo_estavel`) com falsos positivos de erosão.

---

## 4. Síntese Integrada do Desenho Experimental Multi-Escala (SAREL v2.0)

| Dimensão / Escala | Fase A — Triagem Orbital na Bacia | Fase B — Subamostra de Verificação In-Loco | Fase D — Sítios Padrão-Ouro VANT/Drone |
| :--- | :--- | :--- | :--- |
| **Recorte Geográfico** | **Bacia do Paraná 3 Completa** (Divisor IAT $7.979\text{ km}^2$ + Limite Legal dos 28 Municípios IBGE $13.350\text{ km}^2$) | **Corredor Experimental Foz do Iguaçu – Céu Azul** (6 municípios: Foz, Sta. Terezinha, São Miguel, Medianeira, Matelândia e Céu Azul) | **4 Propriedades Rurais Reais (CAR)** em **Medianeira** (Sítios Alfa e Beta) e **Céu Azul** (Sítios Gama e Delta) |
| **Unidade Amostral** | Pontos discretos ($10\text{ m} \times 10\text{ m}$) descorrelacionados por Thinning Geodésico | Subamostra proporcional de pontos discretos ($15\%\text{ a }20\%$ do total $N$) | **Polígonos contínuos de $\approx 50\text{ ha}$ cada** ($198,56\text{ ha}$ totais = $19.856\text{ pixels}$ Sentinel-2) |
| **Proporção / Volume** | **$80\%\text{ a }85\%$** da amostra sorteada na bacia (ex.: $240\text{ de }300\text{ pts}$) | **$15\%\text{ a }20\%$** da amostra sorteada na bacia (ex.: $60\text{ de }300\text{ pts}$) | **4 Sítios Contínuos (`Held-Out`)** congelados fora do treinamento |
| **Sensores e Fontes** | Sentinel-2 MSI ($10\text{ m}$, 10 anos) + PlanetScope NICFI ($3\text{ m}$) + Copernicus DEM ($30\text{ m}$) + CHIRPS/IMERG | GNSS Submétrico + App *SAREL Field Collector* (protocolo `campo-cego`) + Fotografia Nadir/Horizonte A | VANT Spectral 2 Multiespectral (5 bandas, **GSD $7,5\text{ cm}$**, PPK/RTK) + MDT Centimétrico |
| **Papel Estatístico** | Treinamento supervisionado e Validação Cruzada por Blocos Espaciais (LOCO) | Auditoria de verdade terrestre e cálculo do Coeficiente Kappa de Cohen ($\kappa \ge 0,61$, IC $95\%$) | Validação Matricial Externa Independente da catena completa (Topo $\to$ Encosta $\to$ Baixada) |

---

## 5. Referências Bibliográficas (Padrão ABNT)

- BRUS, D. J. **Spatial sampling with R**. Boca Raton: CRC Press / Taylor & Francis, 2019.
- COCHRAN, W. G. **Sampling techniques**. 3. ed. New York: John Wiley & Sons, 1977.
- INSTITUTO ÁGUA E TERRA (IAT); CONSELHO ESTADUAL DE RECURSOS HÍDRICOS DO PARANÁ (CERH/PR). **Resolução CERH/PR nº 49, de 20 de dezembro de 2006**. Dispõe sobre a instituição de Unidades Hidrográficas de Gerenciamento de Recursos Hídricos do Estado do Paraná (Bacia Hidrográfica do Paraná 3). Curitiba: SEMA/IAT, 2006.
- INSTITUTO BRASILEIRO DE GEOGRAFIA E ESTATÍSTICA (IBGE). **Malhas Territoriais e Divisão Político-Administrativa Municipal do Estado do Paraná (SIRGAS 2000)**. Rio de Janeiro: IBGE, 2023.
- PARANÁ (Estado). **Lei Estadual nº 12.726, de 26 de novembro de 1999**. Institui a Política Estadual de Recursos Hídricos e cria o Sistema Estadual de Gerenciamento de Recursos Hídricos. Curitiba: Diário Oficial do Estado do Paraná, 1999.
- RENARD, K. G. et al. **Predicting soil erosion by water: a guide to conservation planning with the Revised Universal Soil Loss Equation (RUSLE)**. Washington, D.C.: USDA Agriculture Handbook n. 703, 1997.
- TOBLER, W. R. A computer movie simulating urban growth in the Detroit region. **Economic Geography**, v. 46, p. 234–240, 1970.
- WISCHMEIER, W. H.; SMITH, D. D. **Predicting rainfall erosion losses: a guide to conservation planning**. Washington, D.C.: USDA Agriculture Handbook n. 537, 1978.
