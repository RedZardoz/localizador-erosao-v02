# Metodologia Geoespacial de Detecção, Triagem e Priorização de Focos de Erosão Laminar

### Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA - 2026)
**Linha de Pesquisa:** Sensoriamento Remoto, Inteligência Geoespacial e Conservação de Solos  
**Aplicação:** Plataforma de Triagem Espacial e Monitoramento 2D/3D de Erosão Laminar

---

## 1. Visão Geral e Contextualização Científica

A **erosão hídrica laminar** caracteriza-se pelo desprendimento e transporte uniforme das partículas superficiais do solo em finas camadas pela ação do salpicamento das gotas de chuva (*splash detachment*) e pelo escoamento superficial difuso (*sheet runoff*). Por se tratar de um processo contínuo e silencioso, sem incisões topográficas abruptas iniciais, sua identificação precoce em escala regional é um dos maiores desafios no manejo e conservação de bacias hidrográficas tropicais e subtropicais.

Este projeto estabelece um método científico estruturado para **detecção, triagem geoespacial e priorização de focos críticos de erosão laminar**, combinando:
1. **Sensoriamento Remoto Multiespectral** (Sentinel-2 MSI e Landsat-8/9 OLI);
2. **Morfometria de Terreno e Modelos Digitais de Elevação** (SRTM 30m / Copernicus DEM 30m / DEM Terrarium);
3. **Equação Universal de Perda de Solo Revisada (RUSLE)** e Fatores Físicos;
4. **Modelagem Preditiva por Aprendizado de Máquina** (XGBoost com interpretabilidade via SHAP);
5. **Amostragem Estratificada e Validação em Campo** com GNSS Geodésico (RTK) e VANTs Multiespectrais.

A plataforma web atua como o ambiente de **análise exploratória, visualização 2D/3D e triagem amostral** para seleção dos talhões-piloto e geração de diagnósticos espaciais no Estado do Paraná (com ênfase na região Noroeste/Arenito Caiuá, Bacia do Rio Tibagi, Rio Ivaí e Bacia Hidrográfica do Paraná 3).

> **Estado da Implementação e Recursos Ativos:**
> 1. **Seleção e Triagem Automática via Google Earth Engine:** A aplicação seleciona candidatos amostrais reais a partir de qualquer AOI (limites municipais do IBGE ou polígonos GeoJSON/KML customizados) combinando **Máscara de Elegibilidade 10m** (ESA WorldCover v200 + Copernicus DEM GLO-30 + JRC Global Surface Water), **Estratificação Cruzada A1..B3** e **Thinning Espacial** com raio configurável.
> 2. **Cálculo Físico de Variáveis Biofísicas:** Executa o cálculo de BSI/NDVI (Sentinel-2 Harmonized L2A), declividade e elevação (Copernicus DEM com projeção métrica EPSG:3857), erosividade da chuva (NASA POWER + eq. Lombardi Neto) e Fator K/LS sob demanda.
> 3. **Segurança de Credenciais:** A autenticação com a Service Account do GEE cria uma sessão criptografada no servidor via cookie `httpOnly`, nunca persistindo a chave privada RSA no `localStorage` do navegador e nem no repositório.
> 4. **Coleções e Projetos Salvos:** Permite salvar seleções ativas no navegador, recarregar instantaneamente com enquadramento 3D automático, ou exportar/importar arquivos de projeto `.json`.
> 5. **Ciclo de Validação de Campo (KoboToolbox):** Importa dados de campo do KoboToolbox, casa registros por proximidade/código, marca como `field-validated` e exporta o dataset rotulado para futuro treinamento do XGBoost/SHAP.
> 6. **Dossiê de Auditoria Científica e Laudo em PDF:** Permite auditar qualquer ponto amostral contra o Earth Engine, detalhando a sequência das 6 etapas físico-matemáticas com valores numéricos reais, gerando script reproduzível para o GEE Code Editor e exportando Laudo Técnico oficial em PDF (A4 vetorial) para revalidação por pares.
> 7. **Novo Pipeline Fundiário Integrado (Espacial + Alfanumérico):** Cruzamento espacial R\*Tree de altíssima performance (< 5ms) contra **quase 4,5 milhões de registros governamentais** no SQLite local:
>    - **SICAR/MMA (1,46M imóveis):** Código CAR, situação cadastral e projeção vetorial interativa do perímetro da fazenda no mapa (`fitBounds`);
>    - **SIGEF/INCRA (501K parcelas):** Denominação oficial da fazenda/gleba, Matrícula no Cartório de Registro de Imóveis (CRI) e ART do CREA;
>    - **SNCR/Receita Federal (2,46M cadastros):** Database Merge alfanumérico instantâneo para identificação do titular/proprietário e condição jurídica;
>    - **Edição Direta:** Opção de preenchimento e complemento manual de dados para o pesquisador registrar entrevistas de campo ou quando protegido por sigilo fiscal.
> 
> 📚 **Manuais de Uso e Documentação Técnica:**
> - 🚀 [**Manual de Instalação e Execução**](./MANUAL_INSTALACAO.md): Guia passo a passo de clonagem, dependências, scripts do Windows, ingestão de dados e compilação.
> - 🧭 [**Manual de Operação e Configuração**](./MANUAL_OPERACAO.md): Guia completo e detalhado de cada ferramenta, modal, botão, projeção de polígonos e laudos.
> - 📊 [**Apresentação de Slides em PowerPoint (.pptx)**](./Apresentacao_Localizador_Erosao_PPGTCA.pptx): Apresentação acadêmica/executiva completa em 12 slides widescreen (16:9) pronta para bancas e seminários.
> - 📐 [**Mapa de Documentação e Cálculos**](./MAPA_DOCUMENTACAO_CALCULOS.md): Mapeamento arquitetural das rotas, APIs e equações da RUSLE.

---

## 2. Processamento e Obtenção das Variáveis Geoespaciais

Para alimentar o modelo estatístico e os algoritmos de triagem, foi desenvolvido um pipeline de empilhamento raster (*raster stacking*) e extração vetorial onde cada ponto amostral ou pixel $P(x,y)$ agrega variáveis biofísicas, topográficas, pedológicas e climáticas na mesma grade espacial ($10 \times 10\text{ m}$).

```
                                  PIPELINE DE DADOS GEOESPACIAIS
                                  
  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │                                     FONTES PRIMÁRIAS                                        │
  │  ┌─────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────┐  │
  │  │   Sentinel-2 MSI /      │   │  Copernicus / SRTM DEM   │   │ Mapas Pedológicos IAT /  │  │
  │  │   Landsat-8 (GEE L2A)   │   │  (Resolução 30m / 10m)   │   │ Embrapa (Vetor 1:250k)   │  │
  │  └───────────┬─────────────┘   └────────────┬─────────────┘   └────────────┬─────────────┘  │
  └──────────────┼──────────────────────────────┼──────────────────────────────┼────────────────┘
                 │                              │                              │
                 ▼                              ▼                              ▼
  ┌─────────────────────────────┐  ┌──────────────────────────┐  ┌──────────────────────────┐
  │    ÍNDICES ESPECTRAIS       │  │   MÉTRICAS TOPOGRÁFICAS  │  │   VARIÁVEIS PEDOLÓGICAS  │
  │  - Bare Soil Index (BSI)    │  │  - Declividade (%, °)    │  │  - Tipologia de Solo     │
  │  - NDVI / NDRE              │  │  - Fator LS (Moore/Gov.) │  │  - Erodibilidade (K)     │
  │  - Fator C (RUSLE)          │  │  - Curvatura / Flow Acc. │  │  - Textura / Agregação   │
  └──────────────┬──────────────┘  └────────────┬─────────────┘  └─────────────┬────────────┘
                 │                              │                              │
                 └──────────────────────────────┼──────────────────────────────┘
                                                │
                                                ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │                          EMPILHAMENTO ESPACIAL (RASTER STACKING 10m)                        │
  │                        + FILTRO TEMPORAL & MÁSCARA DE NUVENS (QA60)                         │
  └─────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                                │
                                                ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
  │                               TRIAGEM MULTICRITÉRIO & RANKING                               │
  │  - Cálculo de Severidade (Moderada / Alta / Crítica)                                        │
  │  - Score de Priorização (0 - 100)                                                           │
  │  - Estimativa de Perda de Solo (t/ha/ano - RUSLE)                                           │
  │  - Seleção Top-N para Amostragem em Campo (GNSS RTK + VANT)                                │
  └─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.1. Variáveis Espectrais (Sensoriamento Remoto Óptico)

Os dados ópticos foram obtidos através de coleções de refletância de superfície (*Bottom-Of-Atmosphere* - BOA / Nível 2A) do satélite **Copernicus Sentinel-2 MSI** via Google Earth Engine (GEE), com aplicação de máscara de nuvens e sombras baseada na banda de qualidade `QA60` e `SCL` (*Scene Classification Layer*).

#### A. Índice de Solo Exposto (*Bare Soil Index* - BSI)
O BSI é o indicador espectral central para identificar talhões com ausência de cobertura vegetal viva ou palhada protetora, combinando as regiões espectrais do Azul, Vermelho, Infravermelho Próximo (NIR) e Infravermelho de Ondas Curtas (SWIR).

$$\text{BSI} = \frac{(\rho_{\text{SWIR2}} + \rho_{\text{Red}}) - (\rho_{\text{NIR}} + \rho_{\text{Blue}})}{(\rho_{\text{SWIR2}} + \rho_{\text{Red}}) + (\rho_{\text{NIR}} + \rho_{\text{Blue}})}$$

*Para o sensor Sentinel-2 MSI:*
$$\text{BSI} = \frac{(B12 + B4) - (B8 + B2)}{(B12 + B4) + (B8 + B2)}$$

- **Domínio Teórico:** $[-1.0, +1.0]$.
- **Interpretação Biofísica:**
  - $\text{BSI} > +0.35$: Solo totalmente desnudo, pulverizado ou com preparo convencional ativo (Altíssima vulnerabilidade ao impacto da gota de chuva);
  - $+0.05 \le \text{BSI} \le +0.35$: Cobertura vegetal incipiente, resíduos de colheita esparsos ou pastagem degradada;
  - $\text{BSI} < +0.05$: Solo protegido por densa cobertura de palhada, cultivo consolidado ou vegetação nativa.

#### B. Índice de Vegetação por Diferença Normalizada (*Normalized Difference Vegetation Index* - NDVI)
Utilizado para quantificar o vigor fotossintético e a densidade de biomassa verde sobre o solo:

$$\text{NDVI} = \frac{\rho_{\text{NIR}} - \rho_{\text{Red}}}{\rho_{\text{NIR}} + \rho_{\text{Red}}} = \frac{B8 - B4}{B8 + B4}$$

- **Fração de Cobertura Vegetal ($FVC$):**
  $$FVC = \left( \frac{\text{NDVI} - \text{NDVI}_{\text{solo}}}{\text{NDVI}_{\text{veg}} - \text{NDVI}_{\text{solo}}} \right)^2$$
  *(adotando $\text{NDVI}_{\text{solo}} = 0.05$ e $\text{NDVI}_{\text{veg}} = 0.85$ para a calibração regional).*

#### C. Fator de Uso, Cobertura e Manejo ($C$ da RUSLE)
O fator $C$ adimensional reflete a capacidade de atenuação da energia cinética da chuva pela copa das plantas e cobertura morta. O fator foi parametrizado empiricamente a partir da série temporal de NDVI e BSI:

$$C = \exp \left( -\alpha \cdot \frac{\text{NDVI}}{\beta - \text{NDVI}} \right) \quad \text{ou} \quad C = \left( \frac{1 - \text{NDVI}}{2} \right)^{(1 + \text{BSI})}$$

---

### 2.2. Variáveis Topográficas e Morfometria do Relevo

As métricas de relevo foram extraídas de Modelos Digitais de Elevação (MDE/DEM) ortorretificados (Copernicus DEM 30m e SRTM GL1 30m, reamostrados para 10m por interpolação bilinear e suavização por filtro Gaussiano $3 \times 3$).

#### A. Altitude Ortométrica ($z$)
Cota em metros acima do nível médio do mar (referencial vertical SIRGAS 2000 / EGM96).

#### B. Declividade em Graus ($\theta$) e Porcentagem ($S$)
Calculada a partir da derivada de primeira ordem da superfície topográfica nas direções cardeais $x$ (leste-oeste) e $y$ (norte-sul):

$$\theta = \arctan \left( \sqrt{ \left( \frac{\partial z}{\partial x} \right)^2 + \left( \frac{\partial z}{\partial y} \right)^2 } \right) \times \left( \frac{180}{\pi} \right)$$

$$S = \tan\left( \frac{\theta \cdot \pi}{180} \right) \times 100$$

- **Classes de Relevo (Embrapa):**
  - Plano: $0 \le S < 3$ %
  - Suave Ondulado: $3 \le S < 8$ %
  - Ondulado: $8 \le S < 20$ % (Limiar onde o escoamento superficial atinge velocidade crítica)
  - Fortemente Ondulado / Escarpado: $S \ge 20$ %

#### C. Fator Topográfico Comprimento e Grau de Declive ($LS$)
Representa o efeito combinado do comprimento do plano de escoamento ($L$) e da inclinação da rampa ($S$). Foi calculado pelo algoritmo bidimensional de acúmulo de fluxo distribuído de Desmet & Govers (1996) e Moore & Burch (1986):

$$LS = \left( \frac{A_s}{22.13} \right)^m \times \left( \frac{\sin \beta}{0.0896} \right)^n$$

Onde:
- $A_s$: Área de contribuição específica a montante por unidade de contorno ($m^2 \cdot m^{-1}$), obtida pelo algoritmo de direção de fluxo múltiplo ($D_{\infty}$ ou $MD8$);
- $\beta$: Ângulo de declividade local em radianos ($\beta = \theta \cdot \pi / 180$);
- $m$: Expoente de comprimento de rampa dependente da razão de suscetibilidade à erosão em sulcos versus entresulcos ($m = 0.4 \text{ a } 0.6$);
- $n$: Expoente de inclinação ($n = 1.3$).

---

### 2.3. Variáveis Pedológicas e Erodibilidade do Solo ($K$)

A base pedológica vetorial foi integrada a partir do Mapeamento de Solos do Estado do Paraná (IAT/Embrapa Florestas/IDR-Paraná na escala 1:250.000). A erodibilidade $K$ representa a suscetibilidade intrínseca do solo à desagregação e arraste:

$$\text{Erodibilidade } K \quad [\text{t}\cdot\text{h}\cdot\text{ha}^{-1}\cdot\text{MJ}^{-1}\cdot\text{mm}^{-1}]$$

| Ordem Pedológica (SiBCS) | Sigla / Ocorrência Regional | Suscetibilidade à Erosão Laminar | Fator $K$ Médio Estimado |
| :--- | :--- | :--- | :--- |
| **Argissolo Vermelho-Amarelo** | PVA (Noroeste / Arenito Caiuá) | **Extremamente Alta** (Gradiente textural abrupto, horizonte B argiloso de baixa permeabilidade) | $0.038 - 0.055$ |
| **Neossolo Regolítico / Litólico** | RR / RL (Norte Pioneiro / Sudoeste) | **Muito Alta** (Solos rasos, pouca espessura, rápida saturação) | $0.032 - 0.048$ |
| **Cambissolo Háplico** | CX (Campos Gerais / Centro-Sul) | **Alta** (Estrutura em blocos, textura média a argilosa) | $0.028 - 0.038$ |
| **Nitossolo Vermelho** | NV (Oeste / Sudoeste / Basalto) | **Média a Alta** (Horizonte B nítico, muito argiloso com boa agregação inicial) | $0.020 - 0.030$ |
| **Latossolo Vermelho Distroférrico**| LVd (Norte Central / Oeste) | **Moderada a Baixa** (Muito profundo, granular/microagregado "pó-de-café", alta infiltração) | $0.015 - 0.025$ |
| **Latossolo Vermelho Eutroférrico** | LVe (Norte Pioneiro / Oeste) | **Moderada a Baixa** (Alta fertilidade natural, excelente permeabilidade) | $0.012 - 0.022$ |

---

### 2.4. Variáveis Climáticas e Erosividade da Chuva ($R$)

A erosividade hídrica anual expressa o potencial das precipitações pluviométricas em provocar erosão sobre uma superfície sem cobertura.

$$R = \frac{1}{N} \sum_{k=1}^N \sum_{j=1}^{12} (EI_{30})_j \quad [\text{MJ}\cdot\text{mm}\cdot\text{ha}^{-1}\cdot\text{h}^{-1}\cdot\text{ano}^{-1}]$$

- **Cálculo da Energia Cinética Total ($E$):**
  $$e_r = 0.29 \cdot [1 - 0.72 \cdot \exp(-0.05 \cdot i)] \quad [\text{MJ}\cdot\text{ha}^{-1}\cdot\text{mm}^{-1}]$$
- **Índice $EI_{30}$:** Produto da energia cinética total da chuva ($E$) pela sua intensidade máxima contínua observada em 30 minutos ($I_{30}$).
- **Interpolação Espacial:** Séries históricas de estações pluviométricas automáticas e telemétricas (IDR-Paraná, ÁguasParaná/IAT e SIMEPAR) foram interpoladas pelo método de **Krigagem Ordinária Esférica** com grade de 1 km, reamostrada para 10m no empilhamento raster.

---

### 2.5. Modelo de Estimativa de Perda de Solo (RUSLE)

A perda média anual de solo por erosão laminar e entresulcos ($A$) é calculada pela clássica Equação Universal de Perda de Solo Revisada (Renard et al., 1997):

$$A = R \times K \times LS \times C \times P \quad \left[\text{t}\cdot\text{ha}^{-1}\cdot\text{ano}^{-1}\right]$$

Onde $P$ é o fator de práticas conservacionistas de suporte (plantio em curvas de nível, terraceamento em nível ou desnível, cordões de vegetação permanente, variando de $0.20$ a $1.00$).

---

## 3. Critérios Metodológicos para Seleção e Triagem dos Pontos Amostrais

A determinação dos focos erosivos monitorados não seguiu distribuição aleatória simples (*simple random sampling*), mas sim uma **Amostragem Espacial Estratificada Guiada por Modelagem Multicritério**, com o objetivo de capturar o gradiente completo de vulnerabilidade do Estado do Paraná e das microbacias hidrográficas pilotos.

```
                      MATRIZ DE ESTRATIFICAÇÃO PARA SELEÇÃO AMOSTRAL
                      
                          Declividade / Fator LS
                     Baixa (< 6%)       Média (6-12%)      Alta (> 12%)
                   ┌──────────────────┬──────────────────┬──────────────────┐
   Alta Erodibilidade│ Sub-estrato A1   │ Sub-estrato A2   │ Sub-estrato A3   │
   (Argissolos /   │ - Latência       │ - Risco Elevado  │ - FOCO CRÍTICO   │
   Neossolos)      │ - Risco Infiltra.│ - Início Sulcos  │ - Voçorocamento  │
Pedologia          ├──────────────────┼──────────────────┼──────────────────┤
 (Fator K)         │ Sub-estrato B1   │ Sub-estrato B2   │ Sub-estrato B3   │
   Média / Baixa   │ - Controle       │ - Transição      │ - Arraste        │
   (Latossolos /   │ - Baseline       │ - Perda de Solo  │   Laminar        │
   Nitossolos)     │   Conservacion.  │   Moderada       │   Acentuado      │
                   └──────────────────┴──────────────────┴──────────────────┘
```

---

### 3.1. Algoritmo de Cálculo do Índice de Severidade

A classificação de severidade de cada ponto é orientada por uma função de ponderação que integra a energia cinética potencial do relevo, o nível de desnudamento da superfície e a fragilidade do substrato pedológico:

$$\Phi_{\text{severidade}} = \left( S \times 0.40 \right) + \left( \text{BSI} \times 50.0 \right) + \Psi_{\text{solo}}$$

Onde o peso pedológico $\Psi_{\text{solo}}$ atribui:
- $\Psi_{\text{solo}} = 18.0$, para solos de textura arenosa ou rasos (Argissolos e Neossolos);
- $\Psi_{\text{solo}} = 8.0$, para solos de textura muito argilosa estruturados (Latossolos e Nitossolos).

#### Enquadramento de Severidade:
$$\text{Severidade} = \begin{cases} 
\mathbf{Crítica}, & \text{se } \Phi_{\text{severidade}} > 48.0 \\ 
\mathbf{Alta}, & \text{se } 28.0 < \Phi_{\text{severidade}} \le 48.0 \\ 
\mathbf{Moderada}, & \text{se } \Phi_{\text{severidade}} \le 28.0 
\end{cases}$$

---

### 3.2. Formulação do Score de Prioridade Global ($0$ a $100$)

Para ranquear e triar as áreas prioritárias para intervenção conservacionista e visita a campo (mecanismo **Top-N**), foi formulado o **Score de Prioridade**:

$$\text{PriorityScore} = \min \left( 100, \, \max \left( 10, \, \text{Round} \left( \Omega_{\text{base}} + (\text{BSI} \times 25.0) + (\theta \times 1.20) + \epsilon \right) \right) \right)$$

Onde a constante de base por classe de severidade ($\Omega_{\text{base}}$) é definida por:
$$\Omega_{\text{base}} = \begin{cases} 
70, & \text{para Severidade Crítica} \\ 
45, & \text{para Severidade Alta} \\ 
20, & \text{para Severidade Moderada} 
\end{cases}$$
*(sendo $\theta$ a declividade em graus e $\epsilon$ um resíduo de variabilidade espacial controlada).*

---

### 3.3. Critérios de Elegibilidade em Gabinete (Seleção de Talhões)

1. **Homogeneidade Espacial (Tamanho Mínimo da Área de Amostragem):**
   - O talhão deve conter pelo menos **$1 \text{ hectare}$ ($10.000\text{ m}^2$)** de características edafoclimáticas e de manejo homogêneas, equivalente a uma janela de no mínimo $10 \times 10$ pixels de $10\text{m}$ do sensor Sentinel-2.
2. **Histórico de Manejo Agrícola Conhecido:**
   - Prioridade a talhões sob rotação de culturas contínua (e.g. soja no verão / milho safrinha no outono-inverno ou trigo), permitindo isolar o efeito da cobertura de palhada e identificar os períodos de entressafra crítica.
3. **Contraste de Declividade e Solo (Estratificação Cruzada):**
   - Amostragem balanceada entre topos de coxilha (zona de perda laminar sutil), terço médio (zona de máxima aceleração da enxurrada e formação de microrravinas) e baixadas (zonas de deposição e coluvionamento).
4. **Isolamento de Interferências de Borda:**
   - Os pontos centrais são posicionados a uma distância mínima de **$30\text{ metros}$** de estradas vicinais, carreadores principais, cercas e corpos d'água superficiais para evitar contaminação espectral do pixel.

---

### 3.4. Critérios de Viabilidade Operacional e Segurança em Campo

1. **Acessibilidade Terrestre:**
   - Permissão de acesso prévia do produtor rural/proprietário e distância de deslocamento a pé inferior a $500\text{ metros}$ de ponto de parada de viatura.
2. **Linha de Visada e Segurança de Voo de VANT (Drone):**
   - Área livre de linhas de transmissão de alta tensão e obstáculos verticais que obstruam a decolagem/pouso e a operação em linha de visada visual (*Visual Line-of-Sight* - VLOS).
3. **Sincronismo Temporal Satélite-Campo (*Time Window Match*):**
   - Campanhas de campo e voos de drone multiespectral agendados em janelas de $\pm 48\text{ horas}$ da passagem do satélite Sentinel-2/Landsat sem ocorrência de precipitação pluviométrica torrencial no intervalo, garantindo congruência radiométrica e hídrica.

---

## 4. Protocolo de Validação em Campo (Ground Truth) e Rotulagem

Para transformar as predições em rótulos científicos de treino (*ground truth labels*), cada ponto amostral é submetido ao seguinte roteiro operacional de auditoria:

```
                            PROTOCOLO DE AUDITORIA DE CAMPO
                            
  ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
  │  1. GEOPOSICIONAMENTO │   │ 2. VOO MULTIESPECTRAL │   │  3. MORFOMETRIA SOLO  │
  │  - GNSS RTK Geodésico │   │  - VANT 80% sobrepos. │   │  - Pedestais (mm)     │
  │  - Precisão < 0.05m   │   │  - Placa de Calibraç. │   │  - Exposição de raiz  │
  │  - Marcação GCPs      │   │  - Sincronia solar    │   │  - Selamento / Crosta │
  └───────────┬───────────┘   └───────────┬───────────┘   └───────────┬───────────┘
              │                           │                           │
              └───────────────────────────┼───────────────────────────┘
                                          │
                                          ▼
  ┌───────────────────────────────────────────────────────────────────────────────────────┐
  │                     FORMULÁRIO ESTRUTURADO DIGITAL (KoboToolbox)                      │
  │  - ID Único (ex: CA_001 a CA_040 para Céu Azul)                                       │
  │  - % Real de Cobertura Morta / Palhada (Foto Nadir 1.5m)                             │
  │  - Rugosidade Superficial & Evidências de Deposição nas Baixadas                     │
  │  - Registro Fotográfico Padronizado (Paisagem, Macro, Solo, Tela do Receptor RTK)     │
  └───────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1. Indicadores Físicos de Diagnóstico em Campo
1. **Pedestais de Erosão:** Presença de fragmentos de solo ou agregados protegidos sob pequenas pedras ou restos culturais enquanto a matriz circundante foi removida pelo salpicamento/escoamento. Mede-se a altura do pedestal em milímetros para estimar a lâmina de solo decapitada.
2. **Exposição de Raízes e Colo de Plantas:** Verificação do descalçamento radicular de plântulas ou restos culturais deixados em suspensão acima do plano de topo do solo.
3. **Manchas de Deposição e Assoreamento:** Acúmulo de areia fina quartzosa ou silte decantado nas partes rebaixadas do relevo (*toe-slope*) soterrando a palhada pré-existente.
4. **Selamento Superficial (*Soil Crust*):** Formação de uma crosta compactada milimétrica decorrente da quebra mecânica dos agregados pela gota da chuva, reduzindo drasticamente a condutividade hidráulica saturada ($K_{sat}$) e acelerando o escoamento laminar.

### 4.2. Estrutura de Particionamento do Dataset de Inteligência Artificial
Para o treinamento dos modelos preditivos (XGBoost / Random Forest) e análise de interpretabilidade via SHAP (*SHapley Additive exPlanations*):
- **Treinamento ($70\%$):** Ajuste de pesos e aprendizagem de padrões multivariados em áreas-piloto documentadas (e.g. Céu Azul / Bacia do Paraná 3);
- **Validação ($15\%$):** Ajuste fino de hiperparâmetros (profundidade de árvore `max_depth`, taxa de aprendizado `learning_rate`, `subsample`);
- **Teste e Generalização Espacial/Temporal ($15\%$):** Aplicação sobre microbacias hidrográficas independentes (e.g. Rio Paranapanema, Rio Tibagi) para validação da robustez em condições pedoclimáticas distintas.

---

## 5. Estrutura de Dados e Tipos da Plataforma

A aplicação gerencia cada foco amostral sob o padrão TypeScript estritamente tipado:

```typescript
export interface ErosionPoint {
  id: string;                  // Identificador único (e.g., "ERO-PR-001")
  code: string;                // Código de protocolo de campo (e.g., "PR-2026-001")
  name: string;                // Denominação descritiva (e.g., "Foco Erosivo 001 - Paranavaí")
  latitude: number;            // Latitude em Graus Decimais (WGS84 / EPSG:4326)
  longitude: number;           // Longitude em Graus Decimais (WGS84 / EPSG:4326)
  elevation: number;           // Cota Altimétrica Ortométrica (metros)
  slopePercent: number;        // Declividade calculada em porcentagem (%)
  slopeDegrees: number;        // Declividade calculada em graus (°)
  bsi: number;                 // Bare Soil Index [-1.0 a +1.0] (Sentinel-2)
  ndvi: number;                // Normalized Difference Vegetation Index [-1.0 a +1.0]
  municipality: string;        // Município de localização
  state: string;               // Unidade Federativa (PR, SP, MS, etc.)
  macroRegion: string;         // Macrorregião fisiográfica (Noroeste, Campos Gerais, etc.)
  watershed: string;           // Bacia Hidrográfica hidrográfica estadual/federal
  soilType: SoilType | string; // Classificação pedológica conforme SiBCS
  featureType: string;         // Feição geomorfológica predominante
  severity: "Moderada" | "Alta" | "Crítica"; // Classe de severidade de risco
  estimatedSoilLoss: number;   // Perda de solo estimada em t/ha/ano (RUSLE)
  priorityScore: number;       // Score numérico de triagem e prioridade (0 - 100)
  detectionDate: string;       // Data da detecção / passagem de satélite (YYYY-MM-DD)
  notes?: string;              // Observações técnicas edafoclimáticas
  isCustom?: boolean;          // Flag de ingestão externa via KML/CSV
}
```

---

## 6. Recursos da Aplicação Web e Arquitetura do Sistema

A ferramenta foi projetada para oferecer uma experiência de Sistema de Informação Geográfica (GIS) moderna, veloz e responsiva:

1. **Visualizador Cartográfico 2D / 3D:**
   - Motor gráfico baseado em **MapLibre GL JS v4+** com aceleração WebGL;
   - Terreno tridimensional realimentado por DEM Terrarium AWS e basemaps em alta definição (Esri World Imagery, Mapbox Satellite, OpenStreetMap Topo);
   - Transição cinematográfica *"Fly-to"* com ajuste dinâmico de *pitch* ($62^\circ$) e *bearing* para inspeção morfométrica tridimensional;
   - Camada de calor (*Heatmap*) ponderada pelo Score de Prioridade e Índice BSI.

2. **Seleção e Triagem de Candidatos via Earth Engine:**
   - **Máscara de Elegibilidade 10m:** Combina ESA WorldCover v200 (classes 30, 40, 60), Copernicus DEM GLO-30 (declividade parametrizada 3%–20%) e JRC Global Surface Water (buffer de exclusão hídrica de 30m);
   - **Estratificação Cruzada 2x3:** Classes de relevo ($\le 6\%$, $6\%-12\%$, $>12\%$) $\times$ Grupos Pedológicos (A e B) gerando sub-estratos A1..B3;
   - **Thinning Espacial Geodésico:** Algoritmo de filtragem por distância mínima de Haversine (0.2 a 5.0 km), priorizando candidatos com maior Score de Prioridade.

3. **Mecanismo Dinâmico de Triagem Top-N & Inspeção:**
   - Seletor contínuo e botões pré-definidos (Top 10, Top 25, Top 50, Top 100, Todas) que filtram e ordenam instantaneamente as ocorrências mais críticas;
   - Tabela de dados detalhada do ponto (coordenadas WGS84 e DMS, altitude, declividade, BSI, perda de solo RUSLE, estrato, pedologia e bacia hidrográfica);
   - Recorte espacial automático por upload de polígonos de Área de Interesse (**AOI** via GeoJSON/KML) ou seleção de municípios oficiais do IBGE.

4. **Coleções & Projetos Salvos (Persistência Local):**
   - Salva seleções de focos de campo no navegador com nomes e descrições personalizadas;
   - Recarregamento instantâneo no mapa com voo 3D de enquadramento automático;
   - Exportação e importação de arquivos de projeto `.json` portáteis.

5. **Ingestão e Validação de Campo (KoboToolbox):**
   - Importação de dados de campo do KoboToolbox com pareamento por código ou proximidade espacial (< 150m);
   - Dropzone universal com auto-detecção de arquivos **GeoJSON**, **KML**, **KMZ** e planilhas **CSV** com coordenadas geográficas.

6. **Exportação de Dados Científicos:**
   - **GeoJSON:** Formato padrão OGC com geometria e tabela de atributos completa para QGIS e ArcGIS Pro;
   - **KML 3D:** Estrutura com estilos de ícones, elevação e tabelas formatadas em HTML para visualização imersiva no Google Earth Pro / Web;
   - **CSV Científico:** Planilha contendo coordenadas em Graus Decimais (DD) e Graus-Minutos-Segundos (DMS), com todas as variáveis numéricas para modelagem estatística em R e Python;
   - **Dataset de Treinamento (XGBoost):** Exportação dedicada contendo apenas pontos validados em campo com observações e fatores biofísicos.

7. **Dossiê de Auditoria Científica & Laudo em PDF (Revalidação por Pares):**
   - **Auditoria Pontual sob Demanda:** Reconsulta em tempo real ao Google Earth Engine (`/api/gee/analyze-point`), extraindo a cena Sentinel-2 mais límpida (`PRODUCT_ID`), data exata, banda `SCL` de qualidade, BSI, NDVI e DEM Copernicus GLO-30 em projeção métrica EPSG:3857;
   - **Tela Popup com Sequência em 6 Etapas:** Exibe a memória de cálculo completa e transparente das 6 etapas da modelagem (Satélite, Espectro, Topografia, Clima/Solo, RUSLE e Script de Revalidação);
   - **Script Executável para Google Earth Engine:** Gera código JavaScript auto-contido com botão de cópia com 1 clique para reprodução imediata no GEE Code Editor;
   - **Laudo Técnico Oficial em PDF (A4 Vetorial):** Compilação e download direto de documento de 2 páginas com formatação acadêmica rigorosa para publicações científicas e relatórios periciais.

---

## 7. Instalação e Execução da Plataforma

> 📖 **Documentação de Instalação e Operação:**
> - Para instruções aprofundadas de instalação e solução de problemas, consulte o [**Manual de Instalação**](./MANUAL_INSTALACAO.md).
> - Para o guia funcional completo de todas as ferramentas e parâmetros, consulte o [**Manual de Operação**](./MANUAL_OPERACAO.md).

### Pré-requisitos
- **Node.js**: versão 18.17.0 ou superior (Node 20+ recomendado)
- **npm** ou **yarn** / **pnpm**

```bash
# 1. Clonar o repositório
git clone https://github.com/SEU_USUARIO/localizador-erosao-parana.git
cd localizador-erosao-parana

# 2. Instalar as dependências do ecossistema
npm install

# 3. (Opcional) Configurar variáveis de ambiente
# A aplicação funciona 100% no modo padrão sem nenhuma chave obrigatória.
# As credenciais da Service Account do GEE são enviadas com segurança pela própria interface web.
cp .env.example .env.local

# 4. Executar os testes automatizados (Vitest)
npm run test

# 5. Executar o servidor de desenvolvimento
npm run dev

# 6. Gerar o build de produção otimizado (opcional)
npm run build
npm run start

# 7. Acessar a aplicação no navegador
http://localhost:3000
```

> 📖 **Guia Completo de Credenciais:** Para instruções passo a passo sobre como obter e configurar chaves do Google Earth Engine (GEE), Mapbox e Google Maps, consulte o documento [`GUIA_CONFIGURACAO_CREDENCIAIS.md`](./GUIA_CONFIGURACAO_CREDENCIAIS.md).

---

## 8. Referências Bibliográficas Normativas

1. **BERTONI, J.; LOMBARDI NETO, F.** *Conservação do solo*. 10. ed. São Paulo: Ícone, 2017. 392 p.
2. **DESMET, P. J. J.; GOVERS, G.** A GIS procedure for automatically calculating the USLE LS factor on topographically complex landscape units. *Journal of Soil and Water Conservation*, v. 51, n. 5, p. 427-433, 1996.
3. **LUNDBERG, S. M.; LEE, S. I.** A Unified Approach to Interpreting Model Predictions. In: *Advances in Neural Information Processing Systems (NeurIPS 2017)*, v. 30, p. 4765-4774, 2017.
4. **MOORE, I. D.; BURCH, G. J.** Physical basis of the length-slope factor in the Universal Soil Loss Equation. *Soil Science Society of America Journal*, v. 50, n. 5, p. 1294-1298, 1986.
5. **RENARD, K. G. et al.** *Predicting soil erosion by water: a guide to conservation planning with the Revised Universal Soil Loss Equation (RUSLE)*. Washington: USDA (Agriculture Handbook, 703), 1997. 404 p.
6. **RIKIMARU, A. et al.** Bare Soil Index (BSI) using Landsat TM data. *International Journal of Remote Sensing*, 2002.
7. **RUFINO, R. L.; BISCAIA, R. C. M.; MERTEN, G. H.** Determinação do potencial erosivo das chuvas no Estado do Paraná. *Revista Brasileira de Ciência do Solo*, v. 10, p. 279-281, 1986.
8. **SANTOS, H. G. et al.** *Sistema Brasileiro de Classificação de Solos (SiBCS)*. 5. ed. Brasília: Embrapa, 2018. 356 p.
9. **WANG, Y. et al.** Spatial-temporal soil erosion assessment and driving factor analysis using machine learning and Google Earth Engine. *Catena*, v. 248, 2025.
10. **WISCHMEIER, W. H.; SMITH, D. D.** *Predicting rainfall erosion losses: a guide to conservation planning*. Washington: USDA (Agriculture Handbook, 537), 1978. 58 p.

