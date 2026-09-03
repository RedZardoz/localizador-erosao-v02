# Manual de Operação e Uso da Plataforma

### Plataforma de Triagem Espacial e Auditoria de Erosão Laminar (Paraná / Brasil)
**Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA - 2026)**  
**Linha de Pesquisa:** Sensoriamento Remoto, Inteligência Geoespacial e Conservação de Solos

---

## Sumário

1. [Visão Geral da Interface Gráfica](#1-visão-geral-da-interface-gráfica)
2. [Barra Superior (Header) & Controles Globais](#2-barra-superior-header--controles-globais)
3. [Painel Lateral (Sidebar) — Triagem, Filtros e Lista de Focos](#3-painel-lateral-sidebar--triagem-filtros-e-lista-de-focos)
4. [Visualizador Geoespacial 3D (MapViewer) & Ferramentas Interativas](#4-visualizador-geoespacial-3d-mapviewer--ferramentas-interativas)
5. [Painel de Inspeção do Ponto (PointPopup)](#5-painel-de-inspeção-do-ponto-pointpopup)
6. [Dossiê de Auditoria Científica & Emissão de Laudo Técnico (AuditDossierModal)](#6-dossiê-de-auditoria-científica--emissão-de-laudo-técnico-auditdossiermodal)
7. [Central de Configurações e Credenciais (SettingsModal)](#7-central-de-configurações-e-credenciais-settingsmodal)
8. [Gerenciador de Dados e Validação de Campo (DataManagerModal)](#8-gerenciador-de-dados-e-validação-de-campo-datamanagermodal)
9. [Exportação de Dados Científicos (ExportModal)](#9-exportação-de-dados-científicos-exportmodal)
10. [Coleções e Projetos Salvos (SavedDatasetsModal)](#10-coleções-e-projetos-salvos-saveddatasetsmodal)
11. [Diagnósticos e Logs de Integridade (SystemLogsModal)](#11-diagnósticos-e-logs-de-integridade-systemlogsmodal)

---

## 1. Visão Geral da Interface Gráfica

A interface da plataforma foi desenhada em três áreas funcionais integradas e responsivas:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [1] BARRA SUPERIOR (HEADER): Conexão GEE | Seletor de Região/AOI | Ações Rápidas | Tema │
├──────────────────────────┬─────────────────────────────────────────────────────────────┤
│                          │                                                             │
│  [2] PAINEL LATERAL      │  [3] VISUALIZADOR GEOESPACIAL 3D (MAPVIEWER)                │
│      (SIDEBAR)           │      - Mapa Base (Satélite Esri / Mapbox HD / Topo / Dark)  │
│  - Seletor Top-N         │      - Relevo 3D (DEM Terrarium) & Exagero Vertical         │
│  - Filtros Multicritério │      - Limites IBGE, Macrobacias e Heatmap de Calor         │
│  - Ordenação             │      - Desenho Vetorial de Talhões                          │
│  - Lista de Cards        │      - Marcadores dos Focos de Erosão                       │
│  - Cálculo em Lote (GEE) │      - [PointPopup] Inspeção Detalhada e Auditoria          │
│                          │                                                             │
└──────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 2. Barra Superior (Header) & Controles Globais

Localizada no topo da aplicação, concentra os controles institucionais e a gestão do contexto espacial:

### 2.1. Identificação Institucional
- Exibe o título **"Localizador de Erosão Laminar"**, o logotipo e a chancela do **PPGTCA 2026 (Paraná / Brasil)**.

### 2.2. Indicador de Conexão com o Google Earth Engine
- **Badge Verde com Pulso:** Sessão ativa e autenticada com o Earth Engine via Service Account. Todas as funções de satélite ao vivo estão habilitadas.
- **Badge Cinza / Amarelo:** Modo de simulação local ativo (amostras pré-computadas). Para ativar o satélite ao vivo, clique no badge ou em *Configurações* e carregue suas credenciais GCP.
- **Badge Vermelho:** Falha de conexão ou credencial expirada. Clique para reautenticar.

### 2.3. Seletor de Região Territorial / Área de Interesse (AOI)
Permite definir o polígono de corte para amostragem e análise:
- **Todo o Paraná:** Carrega o contorno geográfico completo do Estado do Paraná (IBGE).
- **Macrobacias Hidrográficas:** Filtra automaticamente por grandes bacias (ex: *Bacia do Rio Paranapanema*, *Bacia do Rio Ivaí*, *Bacia do Rio Tibagi*, *Bacia do Paraná 3*, etc.).
- **Municípios Oficiais (IBGE):** Campo com autocompletar e busca em tempo real de todos os 399 municípios paranaenses, baixando o polígono vetorial oficial diretamente da API de Malhas do IBGE.
- **AOI Personalizada:** Permite carregar um polígono desenhado pelo usuário ou importado via GeoJSON/KML.

### 2.4. Botão "Triar Candidatos GEE"
- Dispara o pipeline de amostragem no Earth Engine sobre a área selecionada: aplica a **Máscara de Elegibilidade 10m** (exclusão de florestas, corpos d'água e áreas urbanas), a **Estratificação Cruzada A1..B3** e o **Thinning Espacial Geodésico**, gerando novos pontos reais.

### 2.5. Botões de Ferramentas Modais (Lado Direito)
- **Dados e Campo (Ícone de Banco de Dados):** Abre o `DataManagerModal` para importação de planilhas KoboToolbox, GNSS RTK e camadas externas.
- **Projetos Salvos (Ícone de Marcador):** Abre o `SavedDatasetsModal` para salvar ou restaurar conjuntos de focos no navegador.
- **Exportar (Ícone de Download):** Abre o `ExportModal` para geração de arquivos GeoJSON, KML 3D, CSV e datasets para XGBoost.
- **Configurações (Ícone de Engrenagem):** Abre o `SettingsModal` para gerenciamento de credenciais do Google Cloud e tokens de mapa.
- **Logs de Integridade (Ícone de Terminal):** Abre o `SystemLogsModal` para visualização das chamadas de API e versões do motor.
- **Alternador de Tema (Ícone Sol / Lua):** Alterna instantaneamente entre o **Modo Escuro** (alto contraste para imagens de satélite) e o **Modo Claro** (ideal para impressão e relatórios).

---

## 3. Painel Lateral (Sidebar) — Triagem, Filtros e Lista de Focos

O painel lateral à esquerda gerencia a exibição e o ranking dos focos de erosão identificados:

### 3.1. Seletor de Priorização Amostral (Top-N)
- Permite focar imediatamente nas áreas de intervenção mais urgentes:
  - **Top 10:** As 10 ocorrências com maior severidade combinada.
  - **Top 25:** Amostra padrão recomendada para campanhas de campo de curta duração.
  - **Top 50 / Top 100:** Amostragem abrangente para planejamento de bacias hidrográficas.
  - **Todas:** Exibe todas as centenas de ocorrências triadas no estado ou município.

### 3.2. Filtros Multicritério
- **Nível de Severidade:** Caixas de seleção para filtrar por graus:
  - **Crítica (Vermelho):** Perda de solo $> 100\text{ t/(ha}\cdot\text{ano)}$, solo desnudo e alta declividade.
  - **Alta (Laranja):** Perda de solo entre $50$ e $100\text{ t/(ha}\cdot\text{ano)}$.
  - **Moderada (Amarelo):** Perda de solo entre $15$ e $50\text{ t/(ha}\cdot\text{ano)}$.
- **Slider de Declividade (%):** Filtra feições por intervalo de inclinação do terreno (ex: focar apenas em encostas entre $8\%$ e $20\%$).
- **Slider de BSI (Bare Soil Index):** Filtra por intensidade de solo descoberto (valores de $-1.0$ a $+1.0$).
- **Filtro de Bacia Hidrográfica:** Seleção suspensa para restringir os pontos a uma bacia específica.
- **Busca Textual Rápida:** Campo de texto para localizar pontos pelo código (ex: `PR-CAND-015`), nome da localidade ou tipo de solo.

### 3.3. Ordenação da Lista
Seletor com quatro critérios de ranqueamento acadêmico:
1. **Score de Risco Top-N (0 - 100):** Combina severidade, BSI e relevo.
2. **Perda de Solo RUSLE (t/ha·ano):** Ordena pela taxa calculada na equação universal.
3. **Índice de Solo Exposto (BSI):** Prioriza talhões com maior desproteção superficial.
4. **Declividade do Terreno (%):** Prioriza feições em vertentes mais íngremes.

### 3.4. Lista de Cards dos Focos de Erosão
- Cada card exibe:
  - Código identificador único (ex: `PR-CAND-001` ou `PR-CAND-042`).
  - Município e Bacia Hidrográfica.
  - Badge de Severidade colorido.
  - Taxa estimada de perda de solo ($t/\text{ha}\cdot\text{ano}$).
  - Badges de BSI e Declividade.
  - Selo **"Validado em Campo"** (quando sincronizado com dados do KoboToolbox).
- **Ação ao clicar no card:** O mapa central realiza um voo suave 3D, centraliza o foco, aplica zoom e abre a janela detalhada de inspeção (`PointPopup`).

### 3.5. Calculadora em Lote via Earth Engine (Batch GEE Calculator)
- Botão localizado na base da Sidebar que recalcula em lote todos os pontos da seleção atual contra o satélite Sentinel-2 e DEM Copernicus mais recentes, atualizando índices biofísicos e a RUSLE.

---

## 4. Visualizador Geoespacial 3D (MapViewer) & Ferramentas Interativas

O mapa central é o núcleo de exploração geoespacial, baseado em MapLibre GL JS com aceleração por GPU:

### 4.1. Camadas de Mapa Base (Basemaps)
Acesse pelo menu flutuante de camadas no canto superior direito do mapa:
- **Satélite Esri Clarity / World Imagery (Padrão):** Mosaico óptico global de alta resolução espacial sem cobertura de nuvens.
- **Mapbox Satélite HD:** Imagens aéreas de ultra-alta resolução (quando a chave de API estiver configurada).
- **Topográfico OpenStreetMap:** Curvas de nível, hidrografia e rede viária rural.
- **CartoDB Dark Matter:** Mapa base escuro para apresentações noturnas e visualização de manchas térmicas.

### 4.2. Relevo Tridimensional (Terreno 3D) & Exagero Vertical
- **Ativação 3D:** Alternador que converte o mapa plano em um Modelo Digital de Elevação tridimensional contínuo (DEM Terrarium).
- **Controle de Exagero Vertical:** Slider de $1.0\times$ a $3.0\times$. Permite realçar vertentes suaves típicas dos planaltos paranaenses (ex: Terceiro Planalto / Arenito Caiuá) para evidenciar linhas de escoamento e anfiteatros erosivos.

### 4.3. Camadas Vetoriais Sobrepostas
- **Limite Oficial do Estado do Paraná (IBGE):** Contorno geodésico do estado em linha verde contínua.
- **Macrobacias Hidrográficas:** Malha vetorial das grandes bacias estaduais com rótulos toponímicos.
- **Mancha de Calor (Heatmap de Densidade):** Camada de interpolação por densidade de Kernel que destaca visualmente as manchas de maior concentração espacial de focos erosivos.

### 4.4. Ferramenta de Desenho Vetorial de Talhões
- Clique no ícone de polígono na barra de ferramentas do mapa.
- Clique sobre a imagem de satélite para delimitar os vértices do talhão agrícola ou voçoroca.
- O sistema calcula em tempo real a **área em hectares (ha)** e o perímetro em metros.
- Permite enviar o polígono desenhado diretamente para o Earth Engine como uma nova AOI de amostragem.

### 4.5. Controles de Navegação e Câmera 3D
- **Zoom (+ / -):** Aproximação e afastamento graduais.
- **Inclinação (Pitch):** Altera o ângulo de visão da câmera de $0^\circ$ (visão vertical ortogonal) até $60^\circ$ (visão oblíqua 3D).
- **Orientação Norte (Bússola):** Clicar na bússola reseta instantaneamente a rotação para o Norte verdadeiro.
- **Arrasto com Botão Direito:** Pressionar o botão direito do mouse e arrastar permite rotacionar a câmera livremente em 360° ao redor do foco.

---

## 5. Painel de Inspeção do Ponto (PointPopup)

Ao clicar em qualquer marcador no mapa ou em um card na Sidebar, abre-se a janela de detalhes do ponto:

### 5.1. Informações Cadastrais e Geodésicas
- **Código Amostral:** Identificador único (ex: `PR-CAND-042`).
- **Coordenadas Geodésicas:** Exibição simultânea em:
  - **Graus Decimais (WGS84):** Ex: `-24.450839°, -51.493274°`.
  - **Graus, Minutos e Segundos (DMS):** Ex: `24° 27' 03.0" S, 51° 29' 35.8" W`.
- **Altitude Ortométrica:** Extraída do Copernicus DEM GLO-30 (metros acima do nível do mar).
- **Classe Pedológica:** Identificação do solo segundo o SiBCS/IAT (ex: *Argissolo Vermelho-Amarelo*, *Latossolo Vermelho*).

### 5.2. Indicadores Biofísicos de Sensoriamento Remoto
- **BSI (Bare Soil Index):** Indicador de solo exposto com barra de progresso colorida.
- **NDVI:** Vigor da cobertura vegetal viva.
- **Declividade Local:** Exibida em **graus ($^\circ$)** e em **porcentagem ($\%$)**, calculada metricamente em projeção conforme EPSG:3857.

### 5.3. Memória de Cálculo da RUSLE
- Fatores individuais detalhados:
  - $R$: Erosividade da chuva ($MJ\cdot mm/(ha\cdot h\cdot ano)$).
  - $K$: Erodibilidade do solo ($t\cdot ha\cdot h/(ha\cdot MJ\cdot mm)$).
  - $LS$: Fator topográfico adimensional.
  - $C$: Fator de uso e cobertura da terra (derivado de NDVI e BSI).
  - $P$: Fator de práticas conservacionistas.
- **Taxa de Perda de Solo Calculada ($A$):** Valor resultante em $t/(ha\cdot ano)$.
- **Score de Prioridade:** Pontuação normalizada de $0$ a $100$.

### 5.4. Identificação Fundiária & Cadastro Rural (CAR / SIGEF / SNCR)
O sistema executa um duplo cruzamento espacial e alfanumérico instantâneo (< 10ms) contra a base de quase 4,5M de registros oficiais:
- **Imóvel Rural:** Denominação oficial da propriedade ou gleba registrada no SIGEF/INCRA (ex: *Fazenda Aliança - Parte 1* ou *Lote 07 - Gleba Jarau*).
- **Código do CAR:** Código oficial do Cadastro Ambiental Rural (SICAR/MMA) com botão de cópia com 1 clique (ex: `PR-4116109-4ACF130A59D4406D8B32B1FEEC9FBDB4`).
- **Titular / Proprietário:** Nome do proprietário resgatado via Database Merge alfanumérico com a base de dados abertos do SNCR / Receita Federal, acompanhado do selo verde `✓ SNCR / SICAR`.
- **Botão [Editar / Completar]:** Permite ao pesquisador completar o sobrenome de proprietários (caso a base governamental contenha asteriscos de proteção fiscal) ou registrar anotações de entrevistas em campo.
- **Registro INCRA & Área:** Código do imóvel no SNCR, número da **Matrícula no Cartório de Registro de Imóveis (CRI)** e área total da propriedade em hectares (ha).
- **Botão [Visualizar Perímetro no Mapa (SICAR)]:** Projeta instantaneamente o polígono vetorial da fazenda contornado em verde-esmeralda sobre a cena de satélite e ajusta a câmera do mapa com `fitBounds` automático.

### 5.5. Botões de Ação Operacional
1. **"Visualizar Perímetro no Mapa (SICAR)":** Alterna a exibição vetorial da divisa da fazenda sobreposta ao foco erosivo.
2. **"Ver em Ultra-Zoom (Z19)":** Dispara um voo instantâneo da câmera para nível de zoom 19 com $45^\circ$ de inclinação, permitindo inspecionar visualmente terraços, curvas de nível, sulcos e desagregação do solo.
3. **"Auditar Cena Sentinel-2":** Consulta a API do GEE em tempo real, obtendo a passagem do Sentinel-2 com menor nebulosidade nos últimos 120 dias, aplicando máscara SCL e recalculando as variáveis no ponto exato.
4. **"Substituir por Ponto Elegível (Re-eleger no GEE)":** Caso a inspeção visual mostre que o ponto caiu sobre elemento inadequado (ex: fragmento de mata ou mancha de sombra), essa função busca no GEE um novo ponto elegível no mesmo município/bacia, **preservando rigorosamente o mesmo código do candidato** (ex: `PR-CAND-042`).
5. **"Dossiê & Laudo de Auditoria (PDF)":** Abre a tela modal com a sequência completa de validação científica por pares.
6. **Links Externos:**
   - **Google Earth Web 3D:** Abre o ponto em 3D imersivo nos servidores do Google.
   - **Google Maps Satélite:** Abre o ponto em visualizador convencional com camada de tráfego e vias rurais.

---

## 6. Dossiê de Auditoria Científica & Emissão de Laudo Técnico (AuditDossierModal)

Esta tela popup foi concebida para atender aos requisitos de transparência e reprodutibilidade do **Mestrado PPGTCA 2026**:

### 6.1. Sequência Metodológica em 6 Etapas
1. **Etapa 1 — Rastreabilidade e Aquisição Sentinel-2 MSI:** Apresenta a coleção oficial `COPERNICUS/S2_SR_HARMONIZED`, o identificador ESA da imagem (`PRODUCT_ID`), a data exata da passagem e o funcionamento da máscara `SCL` (descarte de sombras e nuvens).
2. **Etapa 2 — Assinatura Espectral e Extração dos Índices Biofísicos:** Fórmulas explícitas do **BSI** e do **NDVI**, valores numéricos amostrados e diagnóstico físico da desproteção da superfície.
3. **Etapa 3 — Geometria Topográfica e Hidrologia:** Copernicus DEM GLO-30 reprojetado metricamente em EPSG:3857, declividade em graus e porcentagem, e fator LS via acumulação de fluxo HydroSHEDS 15ACC.
4. **Etapa 4 — Variáveis Climatológicas e Erodibilidade Pedológica:** Tabela com os fatores $R$ (NASA POWER / MERRA-2 via Lombardi Neto) e $K$ (IAT / SoilGrids).
5. **Etapa 5 — Modelagem RUSLE Completa:** Substituição passo a passo dos fatores numéricos na equação $A = R \cdot K \cdot LS \cdot C \cdot P$, exibição da perda estimada em $t/(ha\cdot ano)$, grau de severidade e score de risco.
6. **Etapa 6 — Guia de Revalidação Científica Independente por Pares:** Roteiro prático para pesquisadores externos reproduzirem o diagnóstico.

### 6.2. Botão "Copiar Script GEE"
- Copia um script JavaScript completo, formatado e auto-contido para a área de transferência.
- O usuário pode abrir o [Google Earth Engine Code Editor](https://code.earthengine.google.com/) e colar o código para reproduzir instantaneamente a cena, o recorte e a impressão dos valores na tela do console do Earth Engine.

### 6.3. Botão "Baixar Laudo PDF (.pdf)"
- Compila e descarrega no navegador um arquivo PDF de alta qualidade vetorial, diagramado em 2 páginas no padrão A4:
  - **Página 1:** Cabeçalho do PPGTCA, identificação geodésica do ponto com badges, e Etapas 1, 2, 3 e 4 (com a tabela de parâmetros).
  - **Página 2:** Cabeçalho de continuação, Etapa 5 (RUSLE completa), Etapa 6 (bloco de código GEE com linhas tabuladas) e rodapé oficial dinâmico (`Página 1 de 2` e `Página 2 de 2`).
- Nome padrão do arquivo: `Laudo_Auditoria_Erosao_[CODIGO]_[DATA].pdf`.

### 6.4. Botão "Imprimir"
- Abre a caixa de diálogo do navegador com folha de estilos `@media print` otimizada para impressão direta em papel ou salvamento via "Salvar como PDF" do sistema operacional.

---

## 7. Central de Configurações e Credenciais (SettingsModal)

Acessada pelo ícone de engrenagem no cabeçalho:

### 7.1. Conexão com o Google Earth Engine (Service Account)
- **Upload do Arquivo JSON de Chave de Serviço:** Permite selecionar o arquivo de credenciais da Service Account do Google Cloud.
- **Processamento no Servidor:** O arquivo JSON é transmitido por canal seguro e armazenado temporariamente em memória criptografada no servidor Node.js.
- **Cookie de Sessão (`httpOnly`):** A chave **nunca** é salva no navegador ou exposta no código-fonte, garantindo conformidade com as diretrizes de segurança da informação.
- **Botão "Testar Conexão":** Faz uma chamada à API `/api/auth/gee-test` e verifica se o Earth Engine responde com sucesso.
- **Botão "Desconectar Sessão":** Limpa o cookie e encerra a sessão ativa.

### 7.2. Provedores de Satélite Adicionais
- **Mapbox Access Token:** Insira seu token público `pk.ey...` para liberar o basemap Satélite Mapbox Ultra-HD.
- **Google Maps API Key:** Insira sua chave para habilitar visualizações auxiliares de satélite.

### 7.3. Modo de Persistência
- Alterna entre salvar preferências apenas na sessão atual do navegador ou manter configurações de visualização salvas no armazenamento local seguro.

---

## 8. Gerenciador de Dados e Validação de Campo (DataManagerModal)

Centraliza a ingestão de dados coletados em campo com equipes de extensão rural e pesquisadores:

### 8.1. Importação KoboToolbox / GNSS Geodésico (RTK)
- **Área de Arrastar e Soltar (Dropzone):** Arraste planilhas Excel (`.xlsx`), CSV ou arquivos KML/GeoJSON exportados do KoboToolbox ou do receptor GNSS RTK.
- **Mapeamento Automático de Colunas:** O sistema reconhece automaticamente cabeçalhos como `_geolocation`, `latitude`, `longitude`, `codigo_ponto`, `grau_erosao`, `observacoes_campo`.
- **Casamento Espacial (< 150m):** Quando um registro de campo é importado, o sistema procura o ponto amostral mais próximo dentro de um raio de 150 metros ou com o mesmo código.
- **Atribuição do Selo `field-validated`:** O ponto é marcado visualmente com uma insígnia dourada no mapa e na Sidebar, comprovando que o foco foi inspecionado presencialmente *in loco*.

### 8.2. Importação de Camadas Vetoriais Externas
- Carregue arquivos **GeoJSON**, **KML**, **KMZ** ou **Shapefiles (zipados)** contendo limites de fazendas, bacias hidrográficas particulares ou curvas de nível.

### 8.3. Gerenciamento de Talhões Desenhados
- Lista todos os polígonos traçados manualmente no mapa, exibindo a área em hectares, data de criação e opções para renomear, excluir ou exportar individualmente.

---

## 9. Exportação de Dados Científicos (ExportModal)

Permite exportar os dados da triagem atual para softwares de SIG e pacotes estatísticos:

### 9.1. GeoJSON (Padrão OGC / RFC 7946)
- Arquivo vetorial com geometria de pontos e tabela completa de atributos (coordenadas, BSI, NDVI, declividade, elevação, fatores RUSLE, severidade, score e histórico de auditoria).
- Compatibilidade nativa direta com **QGIS**, **ArcGIS Pro** e **Google Earth Engine**.

### 9.2. KML 3D (Google Earth)
- Arquivo com simbologia vetorial calibrada, ícones coloridos por grau de severidade e janelas de balão (*popups*) formatadas em HTML contendo tabelas resumidas de perda de solo e links.
- Pronto para visualização tridimensional no **Google Earth Pro** (desktop) ou **Google Earth Web**.

### 9.3. Planilha CSV Científica
- Formato tabular para abertura no Microsoft Excel, LibreOffice Calc, linguagem **R** e bibliotecas **Pandas (Python)**.
- Inclui colunas com coordenadas em Graus Decimais (DD) e em Graus-Minutos-Segundos (DMS), facilitando o uso por equipes de campo em navegadores GPS portáteis.

### 9.4. Dataset de Treinamento (XGBoost / Machine Learning)
- Exportação especializada que filtra exclusivamente os pontos com status `field-validated` (validados em campo), estruturando as colunas de *features* (BSI, NDVI, declividade, curvatura, fatores RUSLE) e a variável-alvo para alimentação do modelo supervisionado de Machine Learning.

---

## 10. Coleções e Projetos Salvos (SavedDatasetsModal)

Garante a reprodutibilidade e o arquivamento de campanhas de pesquisa:

### 10.1. Salvar Seleção Ativa no Navegador
- Permite nomear a seleção atual (ex: *"Focos Críticos Arenito Caiuá - Campanha Outubro 2026"*) e adicionar anotações descritivas.
- Salva o estado dos filtros, ordenações, talhões desenhados e pontos selecionados.

### 10.2. Carregamento com Voo 3D Automático
- Ao selecionar uma coleção salva na lista, o mapa realiza um enquadramento espacial automático com câmera suave sobre a região onde os pontos foram registrados.

### 10.3. Exportação e Importação de Arquivos de Projeto (`.json`)
- Permite exportar um projeto salvo para um arquivo portátil `.json`.
- Esse arquivo pode ser enviado por e-mail a outros pesquisadores, orientadores ou membros da equipe, que podem importá-lo em suas próprias máquinas com 1 clique.

---

## 11. Diagnósticos e Logs de Integridade (SystemLogsModal)

Destinado à auditoria de conformidade e depuração acadêmica:

### 11.1. Linha do Tempo de Eventos
- Registra cada requisição enviada aos servidores do Earth Engine, NASA POWER e ISRIC SoilGrids, com códigos de status HTTP, tempo de resposta em milissegundos e mensagens de retorno.

### 11.2. Rastreabilidade do Motor de Cálculo
- Exibe a versão ativa do motor matemático (ex: `2026.1-metric`), a data e horário de cada cálculo realizado e os parâmetros geodésicos empregados.

### 11.3. Ações de Diagnóstico
- **Botão "Copiar Logs":** Copia todo o histórico de eventos formatado em texto para facilitar o envio de relatórios de erros ao suporte ou equipe de desenvolvimento.
- **Botão "Limpar Logs":** Esvazia o histórico da sessão atual.
