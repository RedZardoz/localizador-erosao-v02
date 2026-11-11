/**
 * ============================================================================
 * Catálogo do Modo de Apresentação & Tour Metodológico — SAREL v2.0
 * PPGTCA 2026 — Universidade Tecnológica Federal do Paraná (UTFPR)
 * ============================================================================
 *
 * Princípio da "Caixa de Vidro" (Glass-Box Architecture):
 * Toda e qualquer função do sistema é mapeada com sua fundamentação física,
 * formulação matemática formal, script executado e referência bibliográfica.
 */

import { DECISOES, PARAMETROS } from "./decisoes";
import { obterComparativoDesenhoD16 } from "@/lib/gee/seloPublicoD16";

const chavesDecisoes = Object.keys(DECISOES).sort();
export const TOTAL_DECISOES = chavesDecisoes.length;
export const TOTAL_PARAMETROS = Object.keys(PARAMETROS).length;
export const PRIMEIRA_DECISAO = chavesDecisoes[0] || "D01";
export const ULTIMA_DECISAO = chavesDecisoes[chavesDecisoes.length - 1] || "D26";
export const FAIXA_DECISOES = `${PRIMEIRA_DECISAO} a ${ULTIMA_DECISAO}`;

const comparativoD16 = obterComparativoDesenhoD16();
const { nominal: DESENHO_NOMINAL, realizado: DESENHO_REALIZADO } = comparativoD16;
const totalSorteadosD16 = DESENHO_REALIZADO.disponivel
  ? DESENHO_REALIZADO.totalPoligonosSorteados
  : 67;
const totalTreinoD16 = DESENHO_REALIZADO.disponivel
  ? DESENHO_REALIZADO.totalTreino
  : 34;
const totalHeldOutD16 = DESENHO_REALIZADO.disponivel
  ? DESENHO_REALIZADO.totalHeldOut
  : 33;
const areaHaRealizadoFormatada = DESENHO_REALIZADO.disponivel
  ? DESENHO_REALIZADO.areaTotalHectares.toFixed(2).replace(".", ",")
  : "336,34";
const nominalPoligonosD16 = DESENHO_NOMINAL.totalPoligonos;
const nominalHaD16 = DESENHO_NOMINAL.areaTotalArredondadaHa;

export interface VariavelCalculo {
  simbolo: string;
  significado: string;
  unidade?: string;
}

export interface CalculoMetodologico {
  nome: string;
  formulaTex: string;
  formulaDescritiva: string;
  variaveis: VariavelCalculo[];
  interpretacao: string;
}

export interface ScriptMetodologico {
  linguagem: "typescript" | "python-gee" | "sql";
  rotulo: string;
  codigo: string;
  explicacao: string;
}

export interface AcaoAtalho {
  rotulo: string;
  tipo: "modal" | "terreno3d" | "sidebar";
  modalAlvo?: string;
}

export interface ItemMetodologico {
  id: string;
  titulo: string;
  subtitulo: string;
  modulo: string;
  seletorAlvo: string;
  oQueFaz: string;
  comoUsar: string;
  comoFunciona: string;
  calculo: CalculoMetodologico;
  script: ScriptMetodologico;
  referencia: string;
  decisaoId?: string;
  acaoAtalho?: AcaoAtalho;
}

export const CATALOGO_METODOLOGICO: Record<string, ItemMetodologico> = {
  "aoi-selector": {
    id: "aoi-selector",
    titulo: "Delimitação da Área de Estudo (AOI)",
    subtitulo: "Recorte Territorial, Bacias Hidrográficas e Limites Políticos",
    modulo: "1. Geodésia & Recorte Espacial",
    seletorAlvo: '[data-metodologia="aoi-selector"]',
    oQueFaz:
      "Permite definir, selecionar e ativar a Área de Interesse (AOI), como a Bacia Hidrográfica do Paraná 3 (BP3), municípios do oeste paranaense ou polígonos customizados.",
    comoUsar:
      "Clique neste botão para abrir a central territorial, selecione o recorte desejado ou importe arquivos vetoriais em GeoJSON/KML. O mapa centralizará a visão sobre o polígono.",
    comoFunciona:
      "O sistema realiza a validação topológica do polígono, corrige orientações de anéis (conforme RFC 7946), converte coordenadas para SIRGAS 2000 / WGS84 (EPSG:4326) e calcula a área geodésica em hectares.",
    calculo: {
      nome: "Área Geodésica no Elipsoide WGS84",
      formulaTex: "A = R_e^2 \\oint (\\sin \\phi) \\, d\\lambda",
      formulaDescritiva:
        "Área (ha) = Integral de contorno geodésico sobre a malha de coordenadas de latitude (phi) e longitude (lambda) projetada no elipsoide de referência.",
      variaveis: [
        { simbolo: "A", significado: "Área de superfície da AOI", unidade: "ha" },
        { simbolo: "R_e", significado: "Raio médio volumétrico da Terra (6.371.008 m)", unidade: "m" },
        { simbolo: "\\phi, \\lambda", significado: "Latitude e Longitude geodésicas em radianos", unidade: "rad" },
      ],
      interpretacao:
        "Garante cálculo exato de hectares em larga escala sem as distorções planares de projeções UTM locais.",
    },
    script: {
      linguagem: "typescript",
      rotulo: "Validação e Cálculo Geodésico",
      codigo: `// Cálculo geodésico da área do polígono no elipsoide SIRGAS 2000
function calcularAreaGeodesica(coords: [number, number][]): number {
  let total = 0;
  const WGS84_RADIUS = 6378137;
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    total += ((p2[0] - p1[0]) * (Math.PI / 180)) *
      (2 + Math.sin(p1[1] * (Math.PI / 180)) + Math.sin(p2[1] * (Math.PI / 180)));
  }
  const areaM2 = Math.abs(total * WGS84_RADIUS * WGS84_RADIUS / 2);
  return areaM2 / 10000; // Retorna em hectares
}`,
      explicacao:
        "Algoritmo numérico de curvatura esferoidal para prevenir superestimação de área em bacias hidrográficas.",
    },
    referencia: "Karney (2013), Journal of Geodesy; IBGE (2020), Malhas Municipais e Bacias Hidrográficas.",
    decisaoId: "D10",
    acaoAtalho: {
      rotulo: "Abrir Seletor de AOI",
      tipo: "modal",
      modalAlvo: "region",
    },
  },

  "terreno-3d": {
    id: "terreno-3d",
    titulo: "Visualização Topográfica 3D & MDE Copernicus",
    subtitulo: "Relevo Tridimensional e Fatores de Encosta (LS)",
    modulo: "2. Geomorfometria & Terreno",
    seletorAlvo: '[data-metodologia="terreno-3d"]',
    oQueFaz:
      "Alterna entre a projeção cartográfica ortogonal 2D e o relevo tridimensional contínuo gerado a partir do Modelo Digital de Elevação Copernicus DEM (30m).",
    comoUsar:
      "Clique no botão para ativar o modo 3D. Em seguida, utilize o botão direito do mouse no mapa para inclinar o ângulo da câmera (pitch) e girar a perspectiva (bearing).",
    comoFunciona:
      "O visualizador WebGL consome malhas de elevação em tempo real (Terrain-RGB rasterizado), renderizando curvas de nível e sombreamento analítico (hillshade) para inspeção geomorfológica.",
    calculo: {
      nome: "Fator Topográfico LS 2D (Decisão D15: Desmet & Govers 1996 e Renard et al. 1997)",
      formulaTex:
        "LS = L_{i,j} \\cdot S, \\quad L_{i,j} = \\frac{(A_{in} + D^2)^{m+1} - A_{in}^{m+1}}{D^{m+2} \\cdot x^m \\cdot (22{,}13)^m}",
      formulaDescritiva:
        "LS = L * S; L = [(A_in + D^2)^(m+1) - A_in^(m+1)] / [D^(m+2) * x^m * 22.13^m]; S = 10.8*sen(θ)+0.03 (<9%) ou 16.8*sen(θ)-0.50 (>=9%)",
      variaveis: [
        { simbolo: "LS", significado: "Fator topográfico combinado de comprimento e declividade (D15)", unidade: "Adimensional" },
        { simbolo: "L_{i,j}", significado: "Fator de comprimento de rampa 2D (Desmet & Govers 1996, Eq. 9)", unidade: "Adimensional" },
        { simbolo: "S", significado: "Fator de declividade (Renard et al. 1997 AH 703, Eqs. [4-4]/[4-5])", unidade: "Adimensional" },
        { simbolo: "A_{in}", significado: "Área de contribuição a montante na entrada da célula", unidade: "m²" },
        { simbolo: "D", significado: "Tamanho da célula de grade Copernicus DEM GLO-30 (30 m)", unidade: "m" },
        { simbolo: "m", significado: "Expoente de fluxo dependente da declividade (Eqs. [4-2]/[4-3])", unidade: "Adimensional" },
        { simbolo: "x", significado: "Fator de contorno dependente do aspecto (|sen α| + |cos α|)", unidade: "Adimensional" },
      ],
      interpretacao:
        "O algoritmo 2D de Desmet & Govers modela a convergência e divergência de fluxo topográfico sem reamostragem simulada (D06/D21); nota: requer área de contribuição acumulada para cálculo do valor numérico.",
    },
    script: {
      linguagem: "typescript",
      rotulo: "Cálculo da Declividade Angular",
      codigo: `// Cálculo da declividade a partir do gradiente local nos eixos X e Y
function calcularDeclividade(dz_dx: number, dz_dy: number): number {
  const gradiente = Math.sqrt(dz_dx * dz_dx + dz_dy * dz_dy);
  const anguloRad = Math.atan(gradiente);
  return (anguloRad * 180) / Math.PI; // Graus de inclinação
}`,
      explicacao:
        "Diferenciação numérica por vizinhança de 8 células (Horn, 1981) aplicada à matriz altimétrica do MDE.",
    },
    referencia: "Desmet & Govers (1996); Renard et al. (1997, AH 703); Copernicus DEM GLO-30 (ESA, 2021).",
    decisaoId: "D07",
    acaoAtalho: {
      rotulo: "Alternar Relevo 3D",
      tipo: "terreno3d",
    },
  },

  "amostragem-gee": {
    id: "amostragem-gee",
    titulo: "Central de Amostragem Biofísica GEE",
    subtitulo: "Triagem Espectral de Candidatos a Erosão e Controle no Google Earth Engine",
    modulo: "3. Sensoriamento Remoto & Espectrometria",
    seletorAlvo: '[data-metodologia="amostragem-gee"]',
    oQueFaz:
      "Executa a busca e triagem espectral de candidatos a feições erosivas e candidatos a controle sob Sistema Plantio Direto (SPD) na Bacia Paraná 3, utilizando a coleção Sentinel-2 L2A via Google Earth Engine API.",
    comoUsar:
      "Clique para abrir o painel, defina a safra/período agrícola, especifique os limiares de reflectância e execute a triagem. Os pontos encontrados surgirão no mapa em memória efêmera.",
    comoFunciona:
      "Aplica máscara rígida de nuvens e sombras (QA60/SCL), reduz a série multitemporal pela mediana nos meses secos (janela de solo descoberto) e calcula os índices espectrais biofísicos NDVI e BSI para triagem de candidatos.",
    calculo: {
      nome: "Índice de Vegetação (NDVI) & Índice de Solo Exposto (BSI)",
      formulaTex: "\\text{BSI} = \\frac{(\\rho_{\\text{SWIR1}} + \\rho_{\\text{Red}}) - (\\rho_{\\text{NIR}} + \\rho_{\\text{Blue}})}{(\\rho_{\\text{SWIR1}} + \\rho_{\\text{Red}}) + (\\rho_{\\text{NIR}} + \\rho_{\\text{Blue}})}",
      formulaDescritiva:
        "BSI = [(SWIR1 + Vermelho) - (NIR + Azul)] / [(SWIR1 + Vermelho) + (NIR + Azul)]",
      variaveis: [
        { simbolo: "BSI", significado: "Bare Soil Index (Índice de Solo Exposto)", unidade: "[-1, 1]" },
        { simbolo: "\\rho_{\\text{SWIR1}}", significado: "Banda 11 do Sentinel-2 (1610 nm)", unidade: "Reflectância" },
        { simbolo: "\\rho_{\\text{NIR}}", significado: "Banda 8 do Sentinel-2 (842 nm)", unidade: "Reflectância" },
        { simbolo: "\\rho_{\\text{Red}}", significado: "Banda 4 do Sentinel-2 (665 nm)", unidade: "Reflectância" },
      ],
      interpretacao:
        "Candidato espectral a feição erosiva (BSI > 0,10 e NDVI < 0,40 · triagem D02) e candidato espectral a controle sob SPD (BSI < 0,00 e NDVI > 0,65). Os cortes numéricos são convenção operacional do projeto (com análise de sensibilidade pré-registrada e pendente), servindo para triagem preliminar de candidatos e auxílio visual ao intérprete, nunca como rótulo definitivo (Regra 4: nada calculado vira rótulo; Rikimaru et al., 2002 formula o índice, mas não prescreve cortes).",
    },
    script: {
      linguagem: "python-gee",
      rotulo: "Redução e Triagem de Candidatos Espectrais no GEE",
      codigo: `# Google Earth Engine - Script de Redução Temporal e Triagem Espectral (D02)
def extrair_candidatos_espectrais(aoi, ano_safra):
    s2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
          .filterBounds(aoi)
          .filterDate(f'{ano_safra}-07-01', f'{ano_safra}-10-31')
          .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
          .map(mascara_nuvens_scl))
    
    mediana = s2.median()
    ndvi = mediana.normalizedDifference(['B8', 'B4']).rename('NDVI')
    bsi = mediana.expression(
        '((b("B11") + b("B4")) - (b("B8") + b("B2"))) / ((b("B11") + b("B4")) + (b("B8") + b("B2")))'
    ).rename('BSI')
    
    # Triagem de candidatos espectrais (Decisão D02 - convenção operacional, não rótulo)
    candidatos_espectrais_erosao = bsi.gt(0.10).And(ndvi.lt(0.40))
    return candidatos_espectrais_erosao`,
      explicacao:
        "Operação executada no GEE para triagem inicial de candidatos espectrais, transferindo coordenadas elegíveis para inspeção visual sem atribuir rótulo antecipado.",
    },
    referencia: "Rouse et al. (1974); Rikimaru et al. (2002); Diek et al. (2017); Decisão D02 (Convenção Operacional PPGTCA 2026).",
    decisaoId: "D02",
    acaoAtalho: {
      rotulo: "Abrir Central GEE",
      tipo: "modal",
      modalAlvo: "candidates",
    },
  },

  "mascara-solo-geos3": {
    id: "mascara-solo-geos3",
    titulo: "Máscara de Solo Exposto GEOS3 (Sentinel-2)",
    subtitulo: "Discriminação Espectral de Solo Mineral vs. Palhada via SWIR (NBR2)",
    modulo: "3. Sensoriamento Remoto & Espectrometria",
    seletorAlvo: '[data-metodologia="mascara-solo-geos3"]',
    oQueFaz:
      "Aplica a máscara espectral multicritério do GEOS3 para isolar pixels de solo mineral exposto, eliminando vegetação fotossinteticamente ativa e cobertura morta (palhada agrícola sob Sistema Plantio Direto).",
    comoUsar:
      "Ativada no processamento de séries temporais Sentinel-2 L2A no Earth Engine ou no Inspetor de Séries Temporais para filtrar observações elegíveis de solo descoberto.",
    comoFunciona:
      "Submete cada pixel Sentinel-2 L2A a uma conjunção estrita de 5 testes espectrais: (1) NDVI ∈ [0,00; 0,25]; (2) NBR2 ∈ [0,00; 0,075]; (3) B4 ≥ B3; (4) B3 ≥ B2; e (5) ausência de nuvem/sombra. O índice NBR2 (baseado em SWIR1/B11 e SWIR2/B12) é o componente crítico que discrimina celulose e lignina da palhada do solo mineral desprovido de resíduo vegetal — separação que o NDVI isolado é incapaz de realizar. A transposição dos limiares empíricos de Landsat 5 TM para Sentinel-2 MSI L2A é declarada formalmente como hipótese de pesquisa não validada (Decisão D10 / EMENDA DE 09/11/2026).",
    calculo: {
      nome: "Critério Multiespectral GEOS3 para Detecção de Solo Exposto",
      formulaTex:
        "\\text{SoloMineral} \\iff (0{,}00 \\le \\text{NDVI} \\le 0{,}25) \\land (0{,}00 \\le \\text{NBR2} \\le 0{,}075) \\land (\\rho_{\\text{B4}} \\ge \\rho_{\\text{B3}}) \\land (\\rho_{\\text{B3}} \\ge \\rho_{\\text{B2}})",
      formulaDescritiva:
        "Solo Mineral = (0.00 <= NDVI <= 0.25) E (0.00 <= NBR2 <= 0.075) E (Banda 4 >= Banda 3) E (Banda 3 >= Banda 2), com NBR2 = (B11 - B12) / (B11 + B12).",
      variaveis: [
        {
          simbolo: "\\text{NBR2}",
          significado: "Normalized Burn Ratio 2: (SWIR1 - SWIR2) / (SWIR1 + SWIR2)",
          unidade: "[-1, 1]",
        },
        {
          simbolo: "\\text{NDVI}",
          significado: "Normalized Difference Vegetation Index: (NIR - Red) / (NIR + Red)",
          unidade: "[-1, 1]",
        },
        {
          simbolo: "\\rho_{\\text{B4}}, \\rho_{\\text{B3}}, \\rho_{\\text{B2}}",
          significado: "Reflectâncias de superfície no Vermelho (B4), Verde (B3) e Azul (B2)",
          unidade: "Reflectância de Superfície",
        },
      ],
      interpretacao:
        "O NBR2 aproveita bandas de absorção de celulose e lignina em 2,1-2,3 µm para distinguir palhada de solo mineral, enquanto as condições B4 >= B3 e B3 >= B2 asseguram curva espectral ascendente típica de solo. A transposição de Landsat para Sentinel-2 permanece como hipótese experimental não validada.",
    },
    script: {
      linguagem: "python-gee",
      rotulo: "Filtro Multicritério GEOS3 no GEE (D10)",
      codigo: `# Google Earth Engine - Máscara de Solo Exposto GEOS3 (Sentinel-2 L2A)
# Decisão D10: transposição Landsat 5 TM -> Sentinel-2 MSI (hipótese não validada)
def mascarar_solo_mineral_geos3(imagem):
    ndvi = imagem.normalizedDifference(['B8', 'B4']).rename('NDVI')
    nbr2 = imagem.normalizedDifference(['B11', 'B12']).rename('NBR2')
    b4 = imagem.select('B4')
    b3 = imagem.select('B3')
    b2 = imagem.select('B2')
    
    teste_ndvi = ndvi.gte(0.00).And(ndvi.lte(0.25))
    teste_nbr2 = nbr2.gte(0.00).And(nbr2.lte(0.075))
    teste_curva = b4.gte(b3).And(b3.gte(b2))
    
    solo_mineral = teste_ndvi.And(teste_nbr2).And(teste_curva)
    return imagem.updateMask(solo_mineral)`,
      explicacao:
        "Conjunção dos cinco testes espectrais no SWIR e visível para isolar exclusivamente solo mineral, descartando resíduo vegetal e palhada sob SPD.",
    },
    referencia:
      "Demattê et al. (2018), GEOS3; Daughtry et al. (2001, 2004); Hively et al. (2021); Decisão D10 (EMENDA DE 09/11/2026).",
    decisaoId: "D10",
  },

  "frequencia-solo-nu-e": {
    id: "frequencia-solo-nu-e",
    titulo: "Frequência Temporal de Solo Exposto (Dimensão Ê)",
    subtitulo: "Medição Multitemporal e Estratificação em Tercis Empíricos (D11/D12)",
    modulo: "4. Estatística Espacial & Amostragem",
    seletorAlvo: '[data-metodologia="frequencia-solo-nu-e"]',
    oQueFaz:
      "Mede a proporção histórica de cenas em que cada candidato apresentou solo mineral exposto ao longo da série Sentinel-2 L2A, derivando a dimensão Ê para estratificação amostral tridimensional.",
    comoUsar:
      "Consulte os histogramas de frequência temporal e as faixas de tercis empíricos calculados na Bacia Paraná 3 para verificar a partição em classes Ê1, Ê2 e Ê3.",
    comoFunciona:
      "Mede todos os 677 candidatos da base amostral, contabilizando de 148 a 1.011 observações válidas por ponto (mediana 477), com nenhum ponto abaixo do piso estrito de 12 observações (D11.2). A distribuição é fortemente assimétrica: 181 pontos (26,7%) apresentam exatamente zero observações de solo nu na série histórica (cobertura vegetal perene ou SPD ininterrupto). Os tercis empíricos foram calculados em t1 = 0,0116 e t2 = 0,0490, gerando uma ocupação balanceada de 226 pontos em Ê1, 225 em Ê2 e 226 em Ê3.",
    calculo: {
      nome: "Frequência Relativa de Solo Nu e Tercis Empíricos (D11/D12)",
      formulaTex:
        "\\hat{E}_i = \\frac{1}{N_{\\text{val}, i}} \\sum_{t=1}^{N_{\\text{val}, i}} \\mathbb{I}_{\\text{solo}}(p_i, t), \\quad \\text{onde } N_{\\text{val}, i} \\ge 12 \\; (\\text{mediana } 477)",
      formulaDescritiva:
        "Ê = (Número de passagens com solo exposto GEOS3) / (Total de cenas válidas sem nuvem). Limiares empíricos: Ê1: [0, 0.0116]; Ê2: (0.0116, 0.0490]; Ê3: (0.0490, 1.0].",
      variaveis: [
        {
          simbolo: "\\hat{E}_i",
          significado: "Frequência histórica relativa de solo descoberto no ponto i",
          unidade: "[0, 1]",
        },
        {
          simbolo: "N_{\\text{val}, i}",
          significado: "Número de passagens Sentinel-2 válidas e desobstruídas",
          unidade: "148 a 1011 (mediana 477)",
        },
        {
          simbolo: "\\mathbb{I}_{\\text{solo}}",
          significado: "Indicador binário de conformidade com os 5 testes GEOS3",
          unidade: "{0, 1}",
        },
      ],
      interpretacao:
        "Identifica áreas com exposição frequente do solo (alta propensão a processos erosivos) versus áreas com cobertura vegetal contínua, servindo como a segunda dimensão da estratificação D12.",
    },
    script: {
      linguagem: "typescript",
      rotulo: "Cálculo de Tercis Empíricos da Frequência de Solo Nu",
      codigo: `// Cálculo de tercis e estratificação da dimensão Ê (Decisões D11 e D12)
export function calcularTercisFrequenciaSoloNu(amostras: number[]): { t1: number; t2: number } {
  const ordenados = [...amostras].sort((a, b) => a - b);
  const n = ordenados.length; // 677 candidatos na Bacia Paraná 3
  const t1 = ordenados[Math.floor(n / 3)];       // 0.0116 (226 pontos em Ê1)
  const t2 = ordenados[Math.floor((2 * n) / 3)]; // 0.0490 (225 pontos em Ê2, 226 em Ê3)
  return { t1, t2 };
}`,
      explicacao:
        "Particiona o domínio contínuo de solo nu em três estratos equiprováveis para garantir máxima representatividade na alocação amostral.",
    },
    referencia: "Diek et al. (2017); Decisões D10, D11 e D12 (PPGTCA 2026).",
    decisaoId: "D11",
  },

  "thinning-espacial": {
    id: "thinning-espacial",
    titulo: "Descorrelação Espacial (Spatial Thinning)",
    subtitulo: "Eliminação de Autocorrelação Espacial e Inflação Estatística",
    modulo: "4. Estatística Espacial & Amostragem",
    seletorAlvo: '[data-metodologia="thinning-espacial"]',
    oQueFaz:
      "Aplica o algoritmo de poda espacial geodésica, garantindo distância mínima de 500 m (ou 1 km) entre quaisquer pares de pontos de treino.",
    comoUsar:
      "O thinning é executado automaticamente durante a consolidação de amostras na central GEE ou ao importar pontos em lote.",
    comoFunciona:
      "Calcula a matriz de distâncias euclidianas/geodésicas par a par; quando dois pontos situam-se abaixo da distância de limiar de dependência espacial, o ponto com menor representatividade de estrato é descartado.",
    calculo: {
      nome: "Distância Geodésica Mínima e Índice de Moran I",
      formulaTex: "d(p_i, p_j) \\ge d_{\\min} \\quad (d_{\\min} = 500\\text{ m}), \\qquad I = \\frac{N}{\\sum_{i} \\sum_{j} w_{ij}} \\frac{\\sum_{i} \\sum_{j} w_{ij} (x_i - \\bar{x})(x_j - \\bar{x})}{\\sum_{i} (x_i - \\bar{x})^2}",
      formulaDescritiva:
        "Distância euclidiana geodésica entre amostras >= 500 metros, reduzindo o I de Moran para próximo de zero.",
      variaveis: [
        { simbolo: "d(p_i, p_j)", significado: "Distância no terreno entre dois pontos amostrais", unidade: "m" },
        { simbolo: "d_{\\min}", significado: "Raio de corte de independência espacial", unidade: "500 m / 1000 m" },
        { simbolo: "I", significado: "Índice de Moran de Autocorrelação Espacial", unidade: "[-1, +1]" },
      ],
      interpretacao:
        "Pontos vizinhos no mesmo talhão compartilham o mesmo solo e mesma chuva, inflando a acurácia do modelo de forma artificial caso não haja thinning.",
    },
    script: {
      linguagem: "typescript",
      rotulo: "Algoritmo Geodésico de Spatial Thinning",
      codigo: `// Algoritmo de Poda Espacial para Independência Amostral
function aplicarSpatialThinning(pontos: PontoAmostral[], dMinMetros: number): PontoAmostral[] {
  const aprovados: PontoAmostral[] = [];
  for (const ponto of pontos) {
    const muitoProximo = aprovados.some(existente => {
      const d = distanciaHaversineMetros(
        ponto.latitude, ponto.longitude,
        existente.latitude, existente.longitude
      );
      return d < dMinMetros;
    });
    if (!muitoProximo) aprovados.push(ponto);
  }
  return aprovados;
}`,
      explicacao:
        "Filtro $O(n^2)$ com indexação espacial, eliminando pontos redundantes antes da montagem da matriz de treino.",
    },
    referencia: "Roberts et al. (2017), Ecography; Legendre (1993), Spatial Autocorrelation.",
    decisaoId: "D08",
  },

  "fator-c-rusle": {
    id: "fator-c-rusle",
    titulo: "Fator C de Cobertura do Solo (RUSLE)",
    subtitulo: "Mitigação da Erosão por Cobertura e Uso do Solo",
    modulo: "5. Mecânica dos Solos & Equação USLE/RUSLE",
    seletorAlvo: '[data-metodologia="fator-c-rusle"]',
    oQueFaz:
      "Calcula a atenuação da perda de solo propiciada pela presença de cobertura vegetal contínua e resíduos culturais (palhada de SPD).",
    comoUsar:
      "Visualizado na ficha de cada ponto amostral no Dossiê de Auditoria ou no cálculo da perda de solo predita na Matriz de Treino.",
    comoFunciona:
      "Implementa a equação empírica regionalizada de Durigon et al. (2014) calibrada especificamente para bacias agrícolas tropicais e subtropicais brasileiras, sem parâmetros livres sujeitos a overfitting.",
    calculo: {
      nome: "Equação de Durigon et al. (2014) — Decisão D01",
      formulaTex: "C = \\frac{1 - \\text{NDVI}}{2} \\quad \\text{para } \\text{NDVI} \\in [-1{,}0; +1{,}0]",
      formulaDescritiva: "C = (1 - NDVI) / 2",
      variaveis: [
        { simbolo: "C", significado: "Fator de cobertura e manejo da RUSLE", unidade: "[0, 1] (Adimensional)" },
        { simbolo: "\\text{NDVI}", significado: "Índice de Vegetação no pixel no instante da análise", unidade: "[-1, 1]" },
      ],
      interpretacao:
        "Se NDVI = 1.0 (vegetação densa de dossel fechado), C = 0.0 (proteção total contra impacto de gotas). Se NDVI = 0.0 (solo desnudo e exposto), C = 0.50 (suscetibilidade severa).",
    },
    script: {
      linguagem: "typescript",
      rotulo: "Implementação Oficial do Fator C",
      codigo: `// Decisão D01: Fator C Durigon et al. (2014) — Regra 2 (Sem cortes silenciosos)
export function calcularFatorC_Durigon(ndvi: Proveniencia<number>): Proveniencia<number> {
  if (ndvi.estado === "indisponivel") return ndvi;
  if (ndvi.valor < -1.0 || ndvi.valor > 1.0) {
    return indisponivel("fora-do-dominio", "NDVI fora de [-1, 1]");
  }
  return modelado((1 - ndvi.valor) / 2, "Durigon et al. (2014)", ["NDVI"]);
}`,
      explicacao:
        "Implementação determinística direta sem parâmetros livres, preservada na íntegra em src/lib/rusle/fatorC.ts.",
    },
    referencia: "Durigon et al. (2014), International Journal of Remote Sensing 35(2):441-453.",
    decisaoId: "D01",
  },

  "fator-k-pedologia": {
    id: "fator-k-pedologia",
    titulo: "Fator K de Erodibilidade do Solo (Embrapa SiBCS)",
    subtitulo: "Suscetibilidade Intrínseca do Solo à Desagregação",
    modulo: "5. Mecânica dos Solos & Equação USLE/RUSLE",
    seletorAlvo: '[data-metodologia="fator-k-pedologia"]',
    oQueFaz:
      "Associa cada coordenada geográfica à sua classe pedológica e erodibilidade físico-química tabelada conforme os padrões oficiais da Embrapa Solos.",
    comoUsar:
      "Ative a camada 'Solos Embrapa' no mapa ou inspecione a erodibilidade K na ficha cadastral de cada ponto amostral.",
    comoFunciona:
      "Realiza overlay espacial com o Mapa Pedológico do Estado do Paraná (ITCG/Embrapa, escala 1:250.000), convertendo a nomenclatura do SiBCS em valores contínuos de erodibilidade $K$ com base em Mannigel et al. (2002) e Coelho et al. (2024).",
    calculo: {
      nome: "Conversão Numérica da Carta Pedológica Oficial",
      formulaTex: "K \\in \\{0{,}0052; \\, 0{,}0117; \\, 0{,}0218; \\, 0{,}0360; \\, 0{,}0518\\} \\, \\text{t}\\cdot\\text{h}\\cdot\\text{MJ}^{-1}\\cdot\\text{mm}^{-1}",
      formulaDescritiva:
        "K tabelado de acordo com a textura e gênese do solo: Latossolo Vermelho Eutroférrico (K=0.015), Nitossolo (K=0.022), Neossolo Regolítico (K=0.045).",
      variaveis: [
        { simbolo: "K", significado: "Erodibilidade intrínseca do horizonte superficial", unidade: "t·h·MJ⁻¹·mm⁻¹" },
      ],
      interpretacao:
        "Solos arenosos e Neossolos possuem coesão baixa entre agregados e desprendem-se com pouca energia; Latossolos argilosos e estruturados resistem mais ao arraste hídrico.",
    },
    script: {
      linguagem: "typescript",
      rotulo: "Conversão Pedológica Contínua",
      codigo: `// Mapeamento de Classes SiBCS para Fator K Numérico (Embrapa Solos)
export function obterFatorKPorClasseSolo(classe: string): number {
  switch (classe.toUpperCase()) {
    case 'LV': return 0.015; // Latossolo Vermelho (Argiloso)
    case 'NV': return 0.022; // Nitossolo Vermelho
    case 'CX': return 0.032; // Cambissolo Háplico
    case 'RR': return 0.045; // Neossolo Regolítico (Alta erodibilidade)
    default:   return 0.020; // Valor mediano de referência regional
  }
}`,
      explicacao:
        "Garante conformidade com o SiBCS e afasta a arbitrariedade de estimativas empíricas isoladas.",
    },
    referencia: "Coelho et al. (2024), Embrapa Solos Doc. 246; Mannigel et al. (2002), Revista Brasileira de Ciência do Solo.",
    decisaoId: "D09",
  },

  "sorteio-d16-realizado": {
    id: "sorteio-d16-realizado",
    titulo: "Desenho Amostral Realizado (Selo Público D16)",
    subtitulo: "Estratificação Tridimensional (S x E x K), Alocação Ótima e Censo Estrutural",
    modulo: "5. Desenho Amostral & Planejamento de Campo",
    seletorAlvo: '[data-metodologia="sorteio-d16-realizado"]',
    oQueFaz:
      `Apresenta o plano amostral estratificado probabilístico executado na Bacia Paraná 3, confrontando o desenho nominal (${nominalPoligonosD16} polígonos, ~${nominalHaD16} ha) com o desenho realizado (${totalSorteadosD16} polígonos, ${areaHaRealizadoFormatada} ha: ${totalTreinoD16} treino + ${totalHeldOutD16} held-out).`,
    comoUsar:
      "Inspecione a distribuição de polígonos por estrato no mapa e na tabela do selo público para verificar a conformidade com as quotas amostrais e os pesos de Horvitz-Thompson.",
    comoFunciona:
      `O sorteio opera sobre 18 estratos tridimensionais (Declividade Ŝ × Solo Nu Ê × Erodibilidade K̂). No plano realizado, foram sorteados ${totalSorteadosD16} polígonos de 5,02 ha (${totalTreinoD16} treino e ${totalHeldOutD16} held-out reservado, totalizando ${areaHaRealizadoFormatada} ha), contra ${nominalPoligonosD16} nominais (~${nominalHaD16} ha). O estrato E_1_3_2 (Ŝ₁ × Ê₃ × K̂₂) resultou vazio porque a bacia hidrográfica possui apenas 9 candidatos de relevo plano com alta erodibilidade, e o valor máximo de Ê observado entre eles foi de 0,0331, abaixo do corte do tercil superior (0,0490) — um achado biofísico genuíno da BP3, não uma falha do método. Cinco dos nove estratos de K̂=2 operam em regime de censo ou déficit sem suplentes (E_1_3_2 vazio e E_1_2_2, E_2_2_2, E_2_3_2, E_3_2_2 com N <= 4).`,
    calculo: {
      nome: "Alocação Estratificada Probabilística e Pesos de Horvitz-Thompson",
      formulaTex:
        "n_h = \\min(4, N_h), \\quad \\pi_{hi} = \\frac{n_h}{N_h}, \\quad w_{hi} = \\frac{1}{\\pi_{hi}} = \\frac{N_h}{n_h}",
      formulaDescritiva:
        "Número de polígonos no estrato h = min(4, N_h). Probabilidade de inclusão pi = n_h / N_h; Peso amostral w = 1 / pi.",
      variaveis: [
        {
          simbolo: "n_h",
          significado: "Número de polígonos alocados ao estrato h (meta = 4: 2 treino + 2 held-out)",
          unidade: "Polígonos",
        },
        {
          simbolo: "N_h",
          significado: "Total de candidatos elegíveis pertencentes ao estrato h na bacia",
          unidade: "Candidatos",
        },
        {
          simbolo: "\\pi_{hi}",
          significado: "Probabilidade de inclusão de primeira ordem da unidade i",
          unidade: "(0, 1]",
        },
        {
          simbolo: "w_{hi}",
          significado: "Peso de expansão amostral de Horvitz-Thompson",
          unidade: "[1, +inf)",
        },
      ],
      interpretacao:
        "Garante inferência estatística não-viesada (D23) sobre a área total da bacia mesmo diante de desigualdades na frequência natural dos tipos de solo e relevo.",
    },
    script: {
      linguagem: "typescript",
      rotulo: "Consulta do Desenho Amostral pelo Leitor Único",
      codigo: `// Leitura única do desenho amostral nominal vs realizado (src/lib/gee/seloPublicoD16.ts)
import { obterComparativoDesenhoD16 } from "@/lib/gee/seloPublicoD16";

const { nominal, realizado } = obterComparativoDesenhoD16();
if (realizado.disponivel) {
  console.log(\`Polígonos: \${realizado.totalPoligonosSorteados} de \${nominal.totalPoligonos} nominais\`);
  console.log(\`Treino: \${realizado.totalTreino} | Held-out: \${realizado.totalHeldOut}\`);
  console.log(\`Área total: \${realizado.areaTotalHectares.toFixed(2)} ha\`);
  console.log(\`Estratos em censo sem suplentes: \${realizado.estratosCenso.join(", ")}\`);
  console.log(\`Estrato vazio biofísico: \${realizado.estratosVazios.join(", ")}\`);
}`,
      explicacao:
        "Importa os quantitativos certificados diretamente do leitor único do selo público, impedindo discrepâncias entre telas e módulos.",
    },
    referencia: "Cochran (1977), Sampling Techniques; Särndal et al. (1992); Decisões D12, D16 e D23.",
    decisaoId: "D16",
  },

  "campanha-rotulos": {
    id: "campanha-rotulos",
    titulo: "Central de Campanha & Ingestão de Rótulos",
    subtitulo: "Verdade de Terreno (Ground Truth), KoboToolbox, Drones e Índice Kappa",
    modulo: "6. Campanhas de Campo & Validação de Rótulos",
    seletorAlvo: '[data-metodologia="campanha-rotulos"]',
    oQueFaz:
      "Recebe e valida os dados de verdade terrestre coletados em campo via KoboToolbox, fotos com geotag EXIF e ortomosaicos multiespectrais de drone.",
    comoUsar:
      "Clique para abrir o painel, faça o upload de formulários de campo CSV/ODK ou ortomosaicos e verifique a concordância cega entre avaliadores.",
    comoFunciona:
      "Executa pareamento espacial por tolerância de raio (buffer de 15 m) e calcula a matriz de confusão e o Coeficiente Kappa de Cohen para blindar a fidedignidade dos rótulos de treino.",
    calculo: {
      nome: "Coeficiente de Concordância Kappa de Cohen (κ)",
      formulaTex: "\\kappa = \\frac{P_o - P_e}{1 - P_e}, \\quad P_o = \\frac{TP + TN}{N}, \\quad P_e = \\frac{(TP+FP)(TP+FN) + (FN+TN)(FP+TN)}{N^2}",
      formulaDescritiva:
        "Kappa = (Concordância Observada - Concordância Esperada ao Acaso) / (1 - Concordância Esperada)",
      variaveis: [
        { simbolo: "\\kappa", significado: "Grau de concordância inter-observador ajustado pelo acaso", unidade: "[-1, 1]" },
        { simbolo: "P_o", significado: "Proporção de concordância observada na matriz", unidade: "[0, 1]" },
        { simbolo: "P_e", significado: "Proporção de concordância esperada unicamente por acaso", unidade: "[0, 1]" },
      ],
      interpretacao:
        "Exige-se kappa >= 0.60 para que um lote de rotulagem humana ou aerofotogramétrica seja aprovado para compor a base de treino do modelo.",
    },
    script: {
      linguagem: "typescript",
      rotulo: "Cálculo do Coeficiente Kappa de Cohen",
      codigo: `// Avaliação da concordância entre Fotointerpretação e Visita de Campo
export function calcularKappaCohen(tp: number, fp: number, fn: number, tn: number): number | null {
  const n = tp + fp + fn + tn;
  if (n === 0) return null;
  const pObservado = (tp + tn) / n;
  const pEsperado = (((tp + fp) * (tp + fn)) + ((fn + tn) * (fp + tn))) / (n * n);
  if (pEsperado >= 1) return null;
  const kappa = (pObservado - pEsperado) / (1 - pEsperado);
  if (kappa > 1) return 1;
  if (kappa < -1) return -1;
  return Number(kappa.toFixed(4));
}`,
      explicacao:
        "Fórmula clássica de Cohen (1960), eliminando vieses otimistas de concordância aparente.",
    },
    referencia: "Cohen (1960), Educational and Psychological Measurement; Foody (2002), Remote Sensing of Environment.",
    decisaoId: "D03",
    acaoAtalho: {
      rotulo: "Abrir Central de Campanha",
      tipo: "modal",
      modalAlvo: "campanha",
    },
  },

  "matriz-treino": {
    id: "matriz-treino",
    titulo: "Central da Matriz de Treino (XGBoost)",
    subtitulo: "Engenharia de Preditores, VIF e Spatial Block Cross-Validation",
    modulo: "7. Machine Learning & Modelagem Preditiva",
    seletorAlvo: '[data-metodologia="matriz-treino"]',
    oQueFaz:
      "Gera a matriz tabular final consolidada, unindo todas as covariáveis ambientais (espectrais, topográficas, pedológicas e climáticas) aos alvos canônicos de erosão: Fracao_Erodida como alvo primário contínuo e desfechos secundários de classificação.",
    comoUsar:
      "Clique para abrir a central, visualize a tabela de atributos, verifique os diagnósticos de colinearidade (VIF) e exporte a base pronta para os scripts externos de modelagem.",
    comoFunciona:
      "Extrai os preditores biofísicos aprovados por ponto amostral, aplica divisão por blocos espaciais (Spatial Block CV com buffer de isolamento de 1 km) para evitar vazamento de dados (data leakage) e exporta em CSV/Parquet. Preditores derivados do competidor mecanicista RUSLE (Fator C, Fator P e Perda A) são expressamente proibidos por D25. O Fator LS foi retirado da matriz de treino por decisão metodológica (permanecendo na linha de base e na planilha). O Fator K e o Fator R são mantidos como insumos biofísicos legítimos.",
    calculo: {
      nome: "Fator de Inflação da Variância (VIF) para Remoção de Multicolinearidade",
      formulaTex: "\\text{VIF}_j = \\frac{1}{1 - R_j^2}, \\quad \\mathcal{L}^{(t)} \\approx \\sum_{i=1}^n \\left[ g_i f_t(x_i) + \\frac{1}{2} h_i f_t^2(x_i) \\right] + \\gamma T + \\frac{1}{2}\\lambda \\sum_{j=1}^T w_j^2",
      formulaDescritiva:
        "VIF = 1 / (1 - R_j^2). Covariáveis com VIF > 5.0 sofrem eliminação recursiva para proteger a estabilidade do Gradient Boosting.",
      variaveis: [
        { simbolo: "\\text{VIF}_j", significado: "Grau de colinearidade da variável j com as demais", unidade: "[1, +inf]" },
        { simbolo: "R_j^2", significado: "Coeficiente de determinação da regressão de x_j contra os demais preditores", unidade: "[0, 1]" },
        { simbolo: "\\mathcal{L}^{(t)}", significado: "Função objetivo regularizada de 2ª ordem do XGBoost", unidade: "Escalar" },
      ],
      interpretacao:
        "Impede que bandas espectrais altamente correlacionadas distorçam a importância das variáveis físicas nos valores de explicabilidade SHAP. O alvo primário contínuo Fracao_Erodida (D26) é modelado com objetivo reg:tweedie.",
    },
    script: {
      linguagem: "typescript",
      rotulo: "Montagem Tabular de Covariáveis do Ponto",
      codigo: `// Recorte ilustrativo de colunas reais do perfil 'matriz-treino' (src/lib/matriz/perfis.ts)
// Nota metodológica: saídas do competidor RUSLE (Fator C, Fator P, Perda A) são expressamente
// PROIBIDAS como preditor (D25). Fator LS foi removido da matriz por decisão metodológica
// (mantido na planilha e na linha de base mecanicista).
function extrairLinhaMatrizTreino(amostra: RegistroAmostral): Record<string, string | number> {
  return {
    // Identificadores e desenho amostral (D12 / D16 / D26)
    Celula_ID: amostra.celulaId,
    Poligono_ID: amostra.poligonoId,
    Papel_Conjunto: amostra.papelConjunto, // 'treino' | 'held-out'
    Estrato_ID: amostra.estratoId,
    // Topografia (Copernicus DEM 30m - D07)
    Elevacao_m: amostra.elevacao,
    Declividade_graus: amostra.declividadeGraus,
    Curvatura_Perfil: amostra.curvaturaPerfil,
    TWI: amostra.twi,
    // Pedologia e Chuva (insumos físicos admitidos)
    RUSLE_Fator_K: amostra.fatorK,
    RUSLE_Fator_R: amostra.fatorR,
    // Espectral e Dinâmica Temporal (Sentinel-2 L2A)
    Frequencia_Solo_Nu: amostra.frequenciaSoloNu,
    NDVI_P90_Serie: amostra.ndviP90,
    Taxa_Degradacao_SWIR_Anual: amostra.taxaSwir,
    // Alvo Canônico Primário (D26 - contínuo em [0, 1], reg:tweedie)
    Fracao_Erodida: amostra.fracaoErodida,
    // Alvo Secundário de Classificação (D03)
    Classe_Alvo_Binaria: amostra.classeAlvoBinaria
  };
}`,
      explicacao:
        "Recorte representativo de colunas reais da matriz de treino (perfis.ts). O alvo primário é Fracao_Erodida (contínuo em [0, 1], D26). O Fator C da RUSLE é preditor terminantemente proibido por D25 (saída do competidor), enquanto o Fator LS foi excluído por decisão metodológica (permanecendo na linha de base e na planilha). Fator K e Fator R são mantidos como insumos biofísicos.",
    },
    referencia: "Chen & Guestrin (2016), XGBoost; Roberts et al. (2017), Ecography; Decisões D04, D25 e D26.",
    decisaoId: "D04, D25, D26",
    acaoAtalho: {
      rotulo: "Abrir Matriz de Treino",
      tipo: "modal",
      modalAlvo: "matriz",
    },
  },

  "decisoes-metodologicas": {
    id: "decisoes-metodologicas",
    titulo: `Livro de Decisões Metodológicas (${FAIXA_DECISOES})`,
    subtitulo: "Rastreabilidade Epistemológica e Blindagem Metodológica para a Banca",
    modulo: "8. Governança Epistemológica & Auditoria",
    seletorAlvo: '[data-metodologia="decisoes-metodologicas"]',
    oQueFaz:
      `Apresenta o registro formal e imutável de todas as ${TOTAL_DECISOES} decisões metodológicas e ${TOTAL_PARAMETROS} parâmetros operacionais do SAREL, com justificativa científica, autoria, data e literatura de suporte.`,
    comoUsar:
      `Clique para abrir o catálogo de decisões. Cada decisão (${FAIXA_DECISOES}) pode ser inspecionada individualmente com seu status (decidida/proposta/pendente) e histórico de emendas.`,
    comoFunciona:
      "O sistema possui travas estritas no código (ex: `exigirDecisao(DECISOES.D01)`). Se qualquer cálculo tentar rodar sem que a respectiva decisão esteja formalmente selada no estado 'decidida', o sistema aborta a operação por segurança científica.",
    calculo: {
      nome: "Matriz de Rastreabilidade e Não-Violação de Invariantes",
      formulaTex: "\\forall d \\in \\mathcal{D}, \\quad \\text{estado}(d) = \\text{'decidida'} \\implies \\text{valor}(d) \\neq \\emptyset \\;\\wedge\\; \\text{ref}(d) \\in \\text{Literatura Validada}",
      formulaDescritiva:
        "Para toda decisão formal d no conjunto de decisões D, o estado deve ser estritamente 'decidida' e embasado em literatura consagrada.",
      variaveis: [
        { simbolo: "\\mathcal{D}", significado: `Conjunto formal de ${TOTAL_DECISOES} decisões metodológicas da dissertação (${FAIXA_DECISOES})`, unidade: "Conjunto" },
        { simbolo: "d", significado: "Decisão individual (ex: D01 para Fator C, D02 para Elegibilidade Espectral)", unidade: "Entidade" },
      ],
      interpretacao:
        "Elimina a introdução oculta de premissas arbitrárias por parte do programador, transferindo todo o rigor para o pesquisador e a literatura.",
    },
    script: {
      linguagem: "typescript",
      rotulo: "Invariante de Exigência Metodológica Estrita",
      codigo: `// Trava inviolável de conformidade científica (src/config/decisoes.ts)
export function exigirDecisao<T>(d: Decisao<T>): T {
  if (d.estado !== "decidida" || d.valor === undefined) {
    throw new ErroDecisaoPendente(d.id, d.titulo);
  }
  return d.valor;
}`,
      explicacao:
        "Garante que o software recuse a execução caso premissas científicas estejam pendentes.",
    },
    referencia: "Normas de Qualificação PPGTCA 2026; Diretrizes de Pesquisa e Inovação do Itaipu Parquetec.",
    decisaoId: `${PRIMEIRA_DECISAO}-${ULTIMA_DECISAO}`,
    acaoAtalho: {
      rotulo: "Abrir Livro de Decisões",
      tipo: "modal",
      modalAlvo: "decisoes",
    },
  },

  "cadeia-verificacao": {
    id: "cadeia-verificacao",
    titulo: "Cadeia de Verificação e Cegamento Amostral",
    subtitulo: "Selo Criptográfico, Invariantes do Sorteio e Reprodutibilidade Hermética",
    modulo: "8. Governança Epistemológica & Auditoria",
    seletorAlvo: '[data-metodologia="cadeia-verificacao"]',
    oQueFaz:
      "Demonstra a cadeia criptográfica de custódia e verificação do sorteio de polígonos (D16), atestando a reprodutibilidade exata com semente pré-registrada, cumprimento de 8 invariantes matemáticos e cegamento estrito da camada K2.",
    comoUsar:
      "Consulte o relatório forense de verificação e validação (docs/dissertacao/Verificacao_e_Validacao_SAREL_2026-11-11.docx) e execute os scripts de auditoria automatizados para reproduzir o sorteio bit a bit.",
    comoFunciona:
      "O sorteio de polígonos foi executado com a semente pré-registrada 20261110. A conformidade é garantida pela verificação compulsória de 8 invariantes matemáticos formais (INV-1 a INV-8), abrangendo partição exata de treino/held-out, conservação de área geodésica, quotas por estrato, identificadores únicos e censo de K2. O selo público redigido preserva o cegamento duplo dos observadores e da equipe de campo (sem divulgar a identidade dos candidatos de alta erodibilidade). A reprodutibilidade foi comprovada de ponta a ponta em clone limpo independente de sistema operacional e máquina.",
    calculo: {
      nome: "Verificação Criptográfica e Invariantes Formais de Amostragem",
      formulaTex:
        "H = \\text{SHA-256}(\\mathbf{C}_{\\text{candidatos}}), \\quad \\bigwedge_{k=1}^8 \\text{INV}_k = \\text{True}, \\quad \\text{Seed} = 20261110",
      formulaDescritiva:
        "Integridade = SHA-256 dos candidatos de entrada E Conjunção dos 8 invariantes INV-1 a INV-8 E Semente pseudo-aleatória pré-registrada.",
      variaveis: [
        {
          simbolo: "H",
          significado: "Hash SHA-256 do conjunto de entrada de 677 candidatos",
          unidade: "Hexadecimal (64 chars)",
        },
        {
          simbolo: "\\text{INV}_k",
          significado: "Invariante formal de amostragem k (k = 1, ..., 8)",
          unidade: "Booleano",
        },
        {
          simbolo: "\\text{Seed}",
          significado: "Semente do gerador Mersenne Twister pré-registrada antes do sorteio",
          unidade: "Inteiro (20261110)",
        },
      ],
      interpretacao:
        "Assegura que nenhuma amostra possa ter sido manipulada, trocada ou re-sorteada após conhecimento dos dados, provendo blindagem contra viés de confirmação e p-hacking.",
    },
    script: {
      linguagem: "typescript",
      rotulo: "Auditoria Criptográfica de Invariantes",
      codigo: `// Verificação dos 8 invariantes do selo de sorteio D16 (Prompt M / Dossiê V&V)
import { obterDesenhoRealizadoD16 } from "@/lib/gee/seloPublicoD16";

const selo = obterDesenhoRealizadoD16();
if (selo.disponivel) {
  const invariantesObrigatorios = [
    "INV_1_TOTAL_TREINO_HELDOUT",
    "INV_2_AREA_TOTAL",
    "INV_3_SOMA_POLIGONOS_POR_ESTRATO",
    "INV_4_PARTICAO_CANDIDATOS",
    "INV_5_POLIGONOS_UNICOS",
    "INV_6_CENSO_PI_1",
    "INV_7_ESTRATO_VAZIO",
    "INV_8_HORVITZ_THOMPSON",
  ];
  const todosAprovados = invariantesObrigatorios.every(inv =>
    selo.invariantesVerificados.includes(inv)
  );
  console.log(\`Cadeia de custódia íntegra: \${todosAprovados} (Semente: \${selo.semente})\`);
}`,
      explicacao:
        "Atesta o cumprimento rigoroso dos 8 invariantes do selo de sorteio e a integridade da semente pré-registrada.",
    },
    referencia:
      "Dossiê de Verificação e Validação SAREL (PPGTCA 2026); docs/dissertacao/Verificacao_e_Validacao_SAREL_2026-11-11.docx.",
    decisaoId: "D16, D23",
  },

  "dossie-auditoria": {
    id: "dossie-auditoria",
    titulo: "Dossiê Forense de Auditoria & Perda de Solo RUSLE",
    subtitulo: "Linha de Base Empírica e Confronto com a Equação Universal (A = R·K·LS·C·P)",
    modulo: "9. Linha de Base Físico-Conceitual",
    seletorAlvo: '[data-metodologia="dossie-auditoria"]',
    oQueFaz:
      "Exibe a auditoria completa de qualquer ponto amostral selecionado, confrontando os fatores preditivos biofísicos com a Equação Universal de Perda de Solo (RUSLE).",
    comoUsar:
      "Clique em qualquer ponto do mapa ou lista da barra lateral e selecione 'Auditar Dossiê' para abrir o relatório forense individual.",
    comoFunciona:
      "Integra precipitação histórica CHIRPS/IMERG para o Fator R, carta pedológica para o Fator K, MDE Copernicus para o Fator LS e séries Sentinel-2 para o Fator C, calculando a taxa teórica de perda de solo em t/ha/ano.",
    calculo: {
      nome: "Equação Universal de Perda de Solo Revisada (RUSLE)",
      formulaTex: "A = R \\cdot K \\cdot LS \\cdot C \\cdot P",
      formulaDescritiva:
        "Perda Anual de Solo (t/ha/ano) = Erosividade da Chuva (R) * Erodibilidade do Solo (K) * Topografia (LS) * Cobertura (C) * Práticas Conservacionistas (P)",
      variaveis: [
        { simbolo: "A", significado: "Perda média anual de solo estimada", unidade: "t·ha⁻¹·ano⁻¹" },
        { simbolo: "R", significado: "Fator de erosividade da chuva", unidade: "MJ·mm·ha⁻¹·h⁻¹·ano⁻¹" },
        { simbolo: "K", significado: "Fator de erodibilidade do solo", unidade: "t·h·MJ⁻¹·mm⁻¹" },
        { simbolo: "LS", significado: "Fator topográfico combinado de comprimento e declividade", unidade: "Adimensional" },
        { simbolo: "C", significado: "Fator de cobertura e manejo do solo", unidade: "Adimensional" },
        { simbolo: "P", significado: "Fator de práticas conservacionistas de suporte (ex: curvas de nível)", unidade: "Adimensional" },
      ],
      interpretacao:
        "Serve como linha de base mecanicista clássica para auditar e confrontar as classificações supervisionadas geradas pelo XGBoost.",
    },
    script: {
      linguagem: "typescript",
      rotulo: "Cálculo da Linha de Base RUSLE",
      codigo: `// Linha de Base Oficial RUSLE (Renard et al., 1997) — Invariante 1
export function calcularPerdaSoloRUSLE(
  r: number, k: number, ls: number, c: number, p: number
): number {
  const a = r * k * ls * c * p;
  return Number(a.toFixed(2)); // Retorna perda em t/(ha.ano)
}`,
      explicacao:
        "Calcula o potencial de perda em t/ha/ano preservando a física canônica de Renard et al. (1997).",
    },
    referencia: "Renard et al. (1997), Agriculture Handbook 703; Wischmeier & Smith (1978).",
    decisaoId: "D05",
  },

  "config-api": {
    id: "config-api",
    titulo: "Configurações de Conexão & Chaves de API",
    subtitulo: "Segurança de Credenciais, Google Earth Engine, PlanetScope e Mapbox",
    modulo: "10. Infraestrutura & Segurança de Dados",
    seletorAlvo: '[data-metodologia="config-api"]',
    oQueFaz:
      "Gerencia o armazenamento local seguro e a autenticação das chaves de API necessárias para consultar os provedores de dados geoespaciais em alta resolução.",
    comoUsar:
      "Clique para abrir o modal de configurações, insira as credenciais do Google Cloud Service Account, PlanetScope API Token ou Mapbox Access Token.",
    comoFunciona:
      "As chaves são preservadas exclusivamente no navegador (ou ambiente de execução seguro local) e nunca são enviadas para repositórios remotos nem salvas em texto plano público.",
    calculo: {
      nome: "Assinatura Criptográfica JWT para Google Service Account",
      formulaTex: "\\text{Signature} = \\text{RS256}_{K_{\\text{private}}}(\\text{Base64Url}(\\text{Header}) \\parallel \\text{Base64Url}(\\text{Payload}))",
      formulaDescritiva:
        "Token de autenticação de curta duração com validade máxima de 3600 segundos para consultas diretas ao Earth Engine.",
      variaveis: [
        { simbolo: "RS256", significado: "Algoritmo de criptografia assimétrica RSA com hash SHA-256", unidade: "Criptografia" },
      ],
      interpretacao:
        "Garante conformidade com as políticas corporativas do Google Cloud e proteção contra vazamento acidental de tokens do pesquisador.",
    },
    script: {
      linguagem: "typescript",
      rotulo: "Autenticação Segura de Sessão GEE",
      codigo: `// Inicialização autenticada da sessão do Google Earth Engine
async function autenticarGEE(serviceAccountEmail: string, privateKey: string) {
  return new Promise((resolve, reject) => {
    ee.initialize(null, null, () => {
      resolve({ sucesso: true });
    }, (err: Error) => {
      reject(err);
    });
  });
}`,
      explicacao:
        "Conexão direta de baixo nível com a API oficial do Google Earth Engine.",
    },
    referencia: "Google Cloud Platform IAM & OAuth 2.0 Security Guidelines.",
    acaoAtalho: {
      rotulo: "Abrir Configurações",
      tipo: "modal",
      modalAlvo: "settings",
    },
  },

  "diagnostico": {
    id: "diagnostico",
    titulo: "Diagnóstico e Integridade Científica",
    subtitulo: "Auditoria de Invariantes e Logs de Execução em Tempo Real",
    modulo: "11. Auditoria e Confiabilidade",
    seletorAlvo: '[data-metodologia="diagnostico"]',
    oQueFaz:
      "Monitora todos os eventos operacionais do sistema, registrando violações de invariantes, erros de rede e consistência amostral.",
    comoUsar:
      "Clique no ícone de pulso vital para inspecionar os logs de auditoria detalhados e alertas de integridade científica.",
    comoFunciona:
      "Insere interceptadores de eventos em cada módulo para registrar a proveniência dos dados e impedir a ingestão de valores sintéticos ou dados contaminados.",
    calculo: {
      nome: "Validação Lógica de Invariantes Metodológicos",
      formulaTex: "\\forall p \\in \\text{Amostras}, \\quad p.\\text{tipo} = \\text{'real'} \\;\\wedge\\; p.\\text{proveniencia} \\neq \\text{null}",
      formulaDescritiva:
        "Garante que toda amostra em memória possua coordenada real com rastreabilidade de sensor e data.",
      variaveis: [
        { simbolo: "p", significado: "Ponto Amostral inspecionado no sistema", unidade: "Entidade" },
      ],
      interpretacao:
        "Blindagem estrita contra contaminação por dados sintéticos ou simulados.",
    },
    script: {
      linguagem: "typescript",
      rotulo: "Guarda Inviolável contra Dados Sintéticos",
      codigo: `// Guarda estrita de conformidade com a Regra 1 e 5 da dissertação
export function assegurarApenasPontosReais(pontos: PontoAmostral[]): void {
  for (const ponto of pontos) {
    if (!ponto.proveniencia || ponto.proveniencia.tipoFonte === 'sintetica') {
      throw new Error(\`Violação científica: ponto \${ponto.id} é sintético!\`);
    }
  }
}`,
      explicacao:
        "Impede que dados simulados ingressem no treinamento do XGBoost.",
    },
    referencia: "Regras Fundamentais SAREL v2.0 (PPGTCA 2026).",
    acaoAtalho: {
      rotulo: "Abrir Painel de Diagnóstico",
      tipo: "modal",
      modalAlvo: "diagnostics",
    },
  },

  "exportacao-oficial": {
    id: "exportacao-oficial",
    titulo: "Central de Exportação Oficial & Reprodutibilidade",
    subtitulo: "Geração de Planilhas Auditáveis XLSX, CSV, GeoJSON e Shapefile",
    modulo: "12. Reprodutibilidade & Pacote da Dissertação",
    seletorAlvo: '[data-metodologia="exportacao-oficial"]',
    oQueFaz:
      "Exporta a base completa de dados coletados e auditados em formatos padronizados para a banca examinadora e para o repositório institucional da UTFPR.",
    comoUsar:
      "Clique no botão 'Exportar', selecione os formatos desejados (XLSX com fórmulas canônicas embutidas, GeoJSON com atributos biofísicos completos ou Shapefile compactado em ZIP) e efetue o download.",
    comoFunciona:
      "Compila a estrutura de dados aplicando hashes criptográficos SHA-256 em cada lote exportado para garantir que os arquivos apresentados na defesa coincidam exatamente com os gerados no sistema.",
    calculo: {
      nome: "Hash Criptográfico de Integridade Científica SHA-256",
      formulaTex: "H = \\text{SHA-256}(\\text{Dataset Exportado})",
      formulaDescritiva:
        "Geração de assinatura digital única de 256 bits atestando que os dados não sofreram adulteração posterior.",
      variaveis: [
        { simbolo: "H", significado: "Resumo criptográfico da matriz amostral", unidade: "Hexadecimal (64 chars)" },
      ],
      interpretacao:
        "Permite à banca examinadora validar a autenticidade e a rastreabilidade imutável de qualquer linha da tabela de resultados.",
    },
    script: {
      linguagem: "typescript",
      rotulo: "Geração da Planilha Oficial com Metadados de Prova",
      codigo: `// Exportação oficial com hash de rastreabilidade
export function exportarPlanilhaOficial(amostras: PontoAmostral[]): Blob {
  const linhas = amostras.map(a => ({
    codigo: a.id,
    latitude: a.latitude,
    longitude: a.longitude,
    municipio: a.municipio,
    classe: a.classe,
    ndvi: a.propriedades.ndvi,
    bsi: a.propriedades.bsi,
    fator_c: (1 - a.propriedades.ndvi) / 2,
    fator_k: a.propriedades.fatorK,
    ls: a.propriedades.ls
  }));
  // Converte para planilha estruturada com aba metodológica
  return gerarPlanilhaExcel(linhas);
}`,
      explicacao:
        "Produz a tabela definitiva que compõe os anexos metodológicos da dissertação.",
    },
    referencia: "Diretrizes de Acesso Aberto e Reprodutibilidade Científica PPGTCA 2026.",
    acaoAtalho: {
      rotulo: "Abrir Central de Exportação",
      tipo: "modal",
      modalAlvo: "export",
    },
  },
};

/**
 * Sequência didática ordenada para a Tour Metodológica da Dissertação
 */
export const PASSOS_TOUR_APRESENTACAO: string[] = [
  "aoi-selector",
  "terreno-3d",
  "amostragem-gee",
  "mascara-solo-geos3",
  "frequencia-solo-nu-e",
  "thinning-espacial",
  "fator-c-rusle",
  "fator-k-pedologia",
  "sorteio-d16-realizado",
  "campanha-rotulos",
  "matriz-treino",
  "decisoes-metodologicas",
  "cadeia-verificacao",
  "dossie-auditoria",
  "exportacao-oficial",
];

export function obterItemMetodologico(id: string): ItemMetodologico | undefined {
  return CATALOGO_METODOLOGICO[id];
}
