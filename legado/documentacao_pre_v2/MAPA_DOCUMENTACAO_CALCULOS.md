# Mapa da Documentação Técnica e Referências aos Cálculos

### Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA - 2026)
**Linha de Pesquisa:** Sensoriamento Remoto, Inteligência Geoespacial e Conservação de Solos  
**Aplicação:** Plataforma de Triagem Espacial e Monitoramento 2D/3D de Erosão Laminar

---

## 1. Visão Geral da Arquitetura do Software

Este documento estabelece o mapeamento formal entre os módulos de código-fonte da aplicação, os servidores/APIs geoespaciais externos integrados e as formulações físico-matemáticas descritas no documento científico principal ([`README.md`](./README.md)).

```
                                ARQUITETURA DE INTEGRAÇÃO GEOESPACIAL
                                
   ┌─────────────────────────────── SERVIDORES E APIS EXTERNAS ───────────────────────────────┐
   │                                                                                          │
   │  ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────────────┐  │
   │  │ Google Earth Engine  │   │   NASA POWER API     │   │      ISRIC SoilGrids v2      │  │
   │  │ - Sentinel-2 MSI L2A │   │   - Climatologia     │   │      - Granulometria         │  │
   │  │ - Copernicus DEM     │   │     MERRA-2          │   │        (Areia/Silte/Argila)  │  │
   │  │ - ESA WorldCover 10m │   │   - Precipitação     │   │      - Carbono Orgânico      │  │
   │  │ - JRC Surface Water  │   │     Mensal / Anual   │   │        (SOC 0-5cm)           │  │
   │  └──────────┬───────────┘   └──────────┬───────────┘   └──────────────┬───────────────┘  │
   │             │                          │                              │                  │
   │             │   ┌──────────────────────┴──────────────────────────┐   │                  │
   │             │   │       IBGE Serviços de Dados & Malhas v3        │   │                  │
   │             │   │       - Limites Municipais e Estaduais (GeoJSON)│   │                  │
   │             │   └──────────────────────┬──────────────────────────┘   │                  │
   └─────────────┼──────────────────────────┼──────────────────────────────┼──────────────────┘
                 │                          │                              │
                 ▼                          ▼                              ▼
   ┌──────────────────────────────────────────────────────────────────────────────────────────┐
   │                         BACKEND NEXT.JS (API ROUTES / SERVER-SIDE)                       │
   │  - Autenticação Segura via Sessão Criptografada (Cookie httpOnly, sem expor chaves RSA)  │
   │  - /api/gee/analyze-point  •  /api/gee/select-candidates  •  /api/gee/replace-candidate │
   │  - /api/auth/gee-session   •  /api/auth/gee-test          •  /api/auth/token-test        │
   └────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                            │
                                            ▼
   ┌──────────────────────────────────────────────────────────────────────────────────────────┐
   │                         MÓDULOS DE MODELAGEM FÍSICA E ESPACIAL                           │
   │  - rusleCalculator.ts  (RUSLE, Fator C, Fator LS, Índice Φ e Score Top-N)                │
   │  - rainfallErosivity.ts (Equação de Lombardi Neto & Moldenhauer sobre MERRA-2)           │
   │  - soilErodibility.ts  (Modelo EPIC sobre SoilGrids + Tabela Regional SiBCS/IAT)         │
   │  - eligibilityMask.ts  (Máscara 10m: WorldCover + Copernicus DEM + JRC Buffer 30m)       │
   │  - stratification.ts   (Matriz Cruzada Declividade x Solo: Sub-estratos A1..B3)          │
   │  - spatialThinning.ts  (Thinning Espacial Geodésico com Raio Mínimo Configurável)       │
   │  - aoiTiling.ts        (Particionamento em Tiles para Amostragem 10m sem Estouro de RAM) │
   └────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                            │
                                            ▼
   ┌──────────────────────────────────────────────────────────────────────────────────────────┐
   │                         FRONTEND GIS INTERATIVO & INTEROPERABILIDADE                     │
   │  - MapLibre GL JS 3D com Terreno DEM Terrarium / Mapbox Ultra-HD / Esri Clarity         │
   │  - Gestão de Talhões Poligonais e Re-eleição de Candidatos com Herança Estrita de Código │
   │  - Validação de Campo: Importação KoboToolbox / GNSS RTK com matching espacial          │
   │  - Exportação: GeoJSON (RFC 7946), KML 2.2 (Google Earth), CSV Excel e Dataset XGBoost   │
   └──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tabela Mestra de Módulos, Funções e Referências Científicas

| Arquivo / Módulo | Servidor / API Externa | Função / Método Principal | Entradas & Saídas | Referência no [`README.md`](./README.md) |
| :--- | :--- | :--- | :--- | :--- |
| **`src/lib/rusle/rusleCalculator.ts`** | *Cálculo local determinístico* | `calculateSoilLossRUSLE` | **In:** $R, K, LS, C, P$<br>**Out:** $A$ [$\text{t}\cdot\text{ha}^{-1}\cdot\text{ano}^{-1}$] | **§2.5** (Equação RUSLE: $A = R \cdot K \cdot LS \cdot C \cdot P$) |
| **`src/lib/rusle/rusleCalculator.ts`** | *Cálculo local determinístico* | `calculateCFactor` | **In:** $\text{NDVI}, \text{BSI}$<br>**Out:** Fator $C \in [0.0, 1.0]$ | **§2.1.C** ($C = ((1 - \text{NDVI})/2)^{(1 + \text{BSI})}$) |
| **`src/lib/rusle/rusleCalculator.ts`** | *Cálculo local determinístico* | `calculateLSFactor` | **In:** $A_s$ [$\text{m}^2\cdot\text{m}^{-1}$], $\theta$ [°]<br>**Out:** Fator $LS$ adimensional | **§2.2.C** (Moore & Burch, 1986 / Desmet & Govers, 1996) |
| **`src/lib/rusle/rusleCalculator.ts`** | *Cálculo local determinístico* | `calculateSeverity` | **In:** $S$, $\text{BSI}$, Solo<br>**Out:** Severidade, $\Phi$ | **§3.1** ($\Phi_{\text{severidade}} = (S \times 0.40) + (\text{BSI} \times 50.0) + \Psi_{\text{solo}}$) |
| **`src/lib/rusle/rusleCalculator.ts`** | *Cálculo local determinístico* | `calculatePriorityScore` | **In:** Severidade, $\text{BSI}$, $\theta$, $\epsilon$<br>**Out:** Score $\in [10, 100]$ | **§3.2** ($\text{PriorityScore} = \min(100, \max(10, \text{Round}(\Omega_{\text{base}} + \dots)))$) |
| **`src/lib/gee/earthEngineClient.ts`** | **Google Earth Engine (GCP)** | `computeRealVariablesForPoint` | **In:** Lat, Lng, Credenciais<br>**Out:** BSI, NDVI, Cota, Declividade, Cena S2 | **§2.1.A** (Fórmula BSI), **§2.1.B** (NDVI), **§2.2.A/B** (Copernicus DEM 30m) |
| **`src/lib/rusle/rainfallErosivity.ts`** | **NASA POWER API** *(MERRA-2)* | `estimateRainfallErosivity` | **In:** Lat, Lng<br>**Out:** Fator $R$, Chuva anual e mensal | **§2.4** (Equação de Lombardi Neto & Moldenhauer, 1992: $EI_{30} = 67.355 \cdot (p^2/P)^{0.85}$) |
| **`src/lib/rusle/soilErodibility.ts`** | **ISRIC SoilGrids v2** / *SiBCS* | `getKFactorRealOrApproximate` | **In:** Lat, Lng, Ordem Pedológica<br>**Out:** Fator $K$, Fonte | **§2.3** (Tabela Pedológica Regional do Paraná, IAT/Embrapa 1:250k) |
| **`src/lib/rusle/soilGridsClient.ts`** | **ISRIC SoilGrids REST API** | `estimateKFactorFromSoilGrids` | **In:** Lat, Lng (prof. 0-5cm)<br>**Out:** Areia%, Silte%, Argila%, SOC% | **§2.3** (Modelo EPIC / Sharpley & Williams, 1990) |
| **`src/lib/gee/eligibilityMask.ts`** | **Google Earth Engine** | `buildEligibilityMask` | **In:** AOI Geometry, Opções<br>**Out:** Imagem binária 10m | **§3.3** (ESA WorldCover Cropland 40 + DEM $3\le S\le 20\%$ + Buffer Hídrico 30m) |
| **`src/lib/gee/stratification.ts`** | **Google Earth Engine** | `buildStratificationBand` | **In:** AOI Geometry<br>**Out:** Imagem com classes 1..6 | **§3** (Matriz de Estratificação Cruzada: Sub-estratos A1..A3 e B1..B3) |
| **`src/lib/gee/spatialThinning.ts`** | *Geodésia esférica local* | `thinBySpacing` | **In:** Candidatos, Raio (km)<br>**Out:** Candidatos dispersos | **§3.3** (Eliminação de aglomerações espaciais e garantia de representatividade) |
| **`src/lib/gee/aoiTiling.ts`** | *Particionamento espacial* | `generateAOITiles` | **In:** Geometria AOI, Raio Máx<br>**Out:** Grade de sub-polígonos | **§2** (Processamento em resolução nativa 10m para áreas extensas como todo o PR) |
| **`src/lib/gee/candidateSelector.ts`** | **Google Earth Engine** | `selectCandidatesWithGEE` | **In:** AOI, targetCount, minSpacing<br>**Out:** Focos amostrais estratificados | **§3** (Pipeline completo de amostragem multiespectral com RUSLE) |
| **`src/lib/gee/candidateSelector.ts`** | **Google Earth Engine** | `selectReplacementCandidateWithGEE`| **In:** Ponto descartado, AOI<br>**Out:** Ponto substituto elegível | **§3.3** (Substituição de alvo em floresta com **preservação estrita do código/ID**) |
| **`src/lib/api/ibgeClient.ts`** | **IBGE Serviços de Dados** | `fetchMunicipioBoundary` | **In:** ID IBGE do Município/UF<br>**Out:** Polígono GeoJSON oficial | **§1 & §3.3** (Delimitação territorial de precisão SIRGAS 2000 / WGS84) |
| **`src/lib/utils/koboParser.ts`** | *Processamento tabular CSV* | `parseAndMatchKoboExport` | **In:** CSV Kobo, Pontos triados<br>**Out:** Casamento espacial e atributos | **§1 & §5** (Ciclo de validação em campo com GNSS RTK e rotulagem `field-validated`) |
| **`src/lib/utils/exportUtils.ts`** | *Interoperabilidade SIG / ML* | `exportToGeoJSON` / `exportToKML` / `exportTrainingDatasetCSV` | **In:** Pontos triados / validados<br>**Out:** Arquivos GeoJSON, KML e CSV ML | **§1** (Exportação para QGIS, Google Earth Pro e Treinamento XGBoost/SHAP) |
| **`src/lib/utils/geoUtils.ts`** | *Geodésia computacional* | `formatToDMS` / `haversineDistanceMeters` / `isPointInPolygon` | **In:** Coordenadas decimais<br>**Out:** DMS, distância em metros, contenção | **§2** (Padrões cartográficos WGS84 EPSG:4326 e Ray-Casting) |

---

## 3. Detalhamento Físico-Matemático das Equações Implementadas

### 3.1. Equação Universal de Perda de Solo Revisada (RUSLE)
*Arquivo:* [`src/lib/rusle/rusleCalculator.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/localizador-erosao-parana-github/src/lib/rusle/rusleCalculator.ts) • *Referência:* README §2.5

$$A = R \times K \times LS \times C \times P \quad \left[\text{t}\cdot\text{ha}^{-1}\cdot\text{ano}^{-1}\right]$$

* **$R$ (Erosividade da Chuva):** Calculado pelo módulo [`rainfallErosivity.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/localizador-erosao-parana-github/src/lib/rusle/rainfallErosivity.ts) via API NASA POWER (Reanálise MERRA-2) utilizando a equação regional de Lombardi Neto & Moldenhauer (1992):
  $$EI_{30} = 67.355 \times \left( \frac{p^2}{P} \right)^{0.85} \quad [\text{MJ}\cdot\text{mm}\cdot\text{ha}^{-1}\cdot\text{h}^{-1}\cdot\text{mês}^{-1}]$$
  $$R = \sum_{j=1}^{12} (EI_{30})_j \quad [\text{MJ}\cdot\text{mm}\cdot\text{ha}^{-1}\cdot\text{h}^{-1}\cdot\text{ano}^{-1}]$$

* **$K$ (Erodibilidade do Solo):** Calculado pelo módulo [`soilErodibility.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/localizador-erosao-parana-github/src/lib/rusle/soilErodibility.ts) e [`soilGridsClient.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/localizador-erosao-parana-github/src/lib/rusle/soilGridsClient.ts) via modelo EPIC (Sharpley & Williams, 1990) ou tabela de solos regional SiBCS/IAT (Santos et al., 2018; escala 1:250.000).

* **$LS$ (Fator Topográfico):** Calculado a partir da área de contribuição específica ($A_s$, via HydroSHEDS ou pixel de 10m) e do ângulo de declividade ($\theta$, derivado do Copernicus DEM 30m em projeção métrica EPSG:3857):
  $$LS = \left( \frac{A_s}{22.13} \right)^{0.50} \times \left( \frac{\sin(\theta \cdot \pi / 180)}{0.0896} \right)^{1.30}$$

* **$C$ (Fator de Uso e Manejo):** Derivado da combinação multiespectral entre vigor vegetativo (NDVI) e desnudamento da superfície (BSI) extraídos do sensor Sentinel-2 MSI:
  $$C = \left( \frac{1 - \text{NDVI}}{2} \right)^{(1 + \text{BSI})}$$

* **$P$ (Práticas Conservacionistas):** Varia de $0.20$ (terraceamento em nível associado a cordões de vegetação) a $1.00$ (ausência de estruturas mecânicas de retenção de enxurrada).

---

### 3.2. Índices Multicritério de Triagem e Ranqueamento Amostral

#### A. Índice Ponderado de Severidade ($\Phi$)
*Arquivo:* [`src/lib/rusle/rusleCalculator.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/localizador-erosao-parana-github/src/lib/rusle/rusleCalculator.ts) • *Referência:* README §3.1

$$\Phi_{\text{severidade}} = \left( S \times 0.40 \right) + \left( \text{BSI} \times 50.0 \right) + \Psi_{\text{solo}}$$

* $\Psi_{\text{solo}} = 18.0$ para solos frágeis, rasos ou arenosos (Argissolos e Neossolos).
* $\Psi_{\text{solo}} = 8.0$ para solos profundos e muito argilosos (Latossolos e Nitossolos).
* **Classificação:** Crítica ($\Phi > 48.0$), Alta ($28.0 < \Phi \le 48.0$), Moderada ($\Phi \le 28.0$).

#### B. Score de Prioridade Global ($0$ a $100$)
*Arquivo:* [`src/lib/rusle/rusleCalculator.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/localizador-erosao-parana-github/src/lib/rusle/rusleCalculator.ts) • *Referência:* README §3.2

$$\text{PriorityScore} = \min \left( 100, \, \max \left( 10, \, \text{Round} \left( \Omega_{\text{base}} + (\text{BSI} \times 25.0) + (\theta \times 1.20) + \epsilon \right) \right) \right)$$

* $\Omega_{\text{base}} = 70$ (Crítica), $45$ (Alta), $20$ (Moderada).

---

### 3.3. Máscara de Elegibilidade Espacial e Estratificação no GEE
*Arquivos:* [`src/lib/gee/eligibilityMask.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/localizador-erosao-parana-github/src/lib/gee/eligibilityMask.ts) e [`src/lib/gee/stratification.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/localizador-erosao-parana-github/src/lib/gee/stratification.ts) • *Referência:* README §3 e §3.3

1. **Uso da Terra (ESA WorldCover 10m v200):** Seleciona exclusivamente a classe $40$ (*Cropland* / Solo Agrícola) e descarta áreas florestais ($10$), pastagens naturais arbustivas ($20/30$) e manchas urbanizadas ($50$).
2. **Relevo (Copernicus DEM GLO-30):** Filtra a janela de declividade com suscetibilidade ao escoamento superficial difuso ($3 \le S \le 20$ %).
3. **Buffer Hídrico (JRC Global Surface Water 1.4):** Aplica buffer morfológico de exclusão de $30\text{ metros}$ ao redor de qualquer corpo d'água superficial.
4. **Matriz de Estratificação Cruzada (Sub-estratos A1 a B3):**
   * Sub-estratos A1, A2, A3: Alta Erodibilidade (Argissolos/Neossolos) cruzados com declividade baixa, média e alta.
   * Sub-estratos B1, B2, B3: Média/Baixa Erodibilidade (Latossolos/Nitossolos) cruzados com declividade baixa, média e alta.

---

### 3.4. Mecanismo de Re-eleição Amostral com Preservação de Código
*Arquivos:* [`src/lib/gee/candidateSelector.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/localizador-erosao-parana-github/src/lib/gee/candidateSelector.ts) e [`src/app/api/gee/replace-candidate/route.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/localizador-erosao-parana-github/src/app/api/gee/replace-candidate/route.ts)

* Quando uma inspeção visual em ultra-resolução (Zoom 18.5x) constata que um ponto caiu inadvertidamente sobre área inadequada (ex: fragmento florestal não mapeado pelo WorldCover ou sombra de relevo), o sistema aciona `selectReplacementCandidateWithGEE`.
* **Regra de Ouro:** O novo ponto sorteado no GEE herda **rigorosamente o mesmo código identificador** (ex: `PR-CAND-042`) e o nome do candidato anulado, atualizando as coordenadas geográficas reais, elevação, BSI, declividade e RUSLE sem corromper a ordenação sequencial da campanha de campo.

---

### 3.5. Auditoria Científica Sequencial e Laudo Técnico em PDF
*Arquivos:* [`src/components/audit/AuditDossierModal.tsx`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/localizador-erosao-parana-github/src/components/audit/AuditDossierModal.tsx), [`src/lib/pdf/auditPdfGenerator.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/localizador-erosao-parana-github/src/lib/pdf/auditPdfGenerator.ts) e [`src/app/api/gee/analyze-point/route.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/localizador-erosao-parana-github/src/app/api/gee/analyze-point/route.ts)

* **Rastreabilidade Sentinel-2 Nível 2A (BOA):** Extrai o identificador ESA da cena (`PRODUCT_ID`), data e horário de aquisição, satélite (Sentinel-2A/2B), resolução nativa de 10m e máscara atmosférica `SCL` (descarte de sombras 3, nuvens 8/9 e cirrus 10).
* **Auditoria da Topografia (DEM):** Reprojeção métrica EPSG:3857 do Copernicus DEM GLO-30 para cálculo conforme da declividade angular/percentual e área de contribuição específica ($A_s$) pelo HydroSHEDS 15ACC.
* **Memória Numérica da RUSLE:** Detalha a substituição dos fatores $A = R \cdot K \cdot LS \cdot C \cdot P$ com unidades de medida oficiais e fontes primárias (NASA POWER MERRA-2 e ISRIC SoilGrids).
* **Script Reproduzível no GEE:** Gera código JavaScript completo e auto-contido para revalidação científica no Google Earth Engine Code Editor com 1 clique de cópia.
* **Laudo Vetorial em PDF:** Compilação no lado cliente (`jspdf`) de laudo técnico A4 diagramado em 2 páginas com tipografia vetorial, sem dependências externas de renderização.

---

## 4. Segurança de Credenciais e Sessão do Earth Engine

* **Sem Persistência de Chaves RSA no Navegador:** As chaves privadas (`private_key`) das Service Accounts do Google Cloud Platform **nunca** são salvas no `localStorage`, `sessionStorage` ou enviadas em requisições de consulta regulares.
* **Sessão Segura no Servidor (`httpOnly`):** A rota [`/api/auth/gee-session`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/localizador-erosao-parana-github/src/app/api/auth/gee-session/route.ts) armazena a sessão criptografada em memória no servidor Node.js e emite um cookie `httpOnly`, `secure`, `sameSite: strict` com TTL de 12 horas.
* **Compatibilidade com Git:** Arquivos sensíveis (`.env`, `.env.local`, `.gcp-credentials.json`, `*.pem`) estão formalmente listados no [`.gitignore`](./.gitignore) para evitar qualquer vazamento inadvertido no GitHub.

---

## 5. Status de Verificação e Testes Automatizados

A integridade do código e a exatidão das fórmulas são validadas de forma contínua por suíte de testes unitários automatizados com **Vitest**:

* **Total de Arquivos de Teste:** 17 arquivos (`*.test.ts`)
* **Total de Testes Unitários:** 119 testes automatizados
* **Taxa de Aprovação:** 100% de sucesso (`vitest run`)
* **Checagem de Tipagem Estrita:** 0 erros com TypeScript (`npx tsc --noEmit`)
* **Compilação de Produção:** Next.js 14 compilado com sucesso (`npm run build`)
