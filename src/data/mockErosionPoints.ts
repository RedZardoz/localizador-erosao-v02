import { ErosionPoint } from "@/types/erosion";
import { calculatePriorityScore, calculateSeverity } from "@/lib/rusle/rusleCalculator";

// Helper generator for realistic 150 critical erosion points across Paraná
const paranaLocations = [
  // Noroeste / Arenito Caiuá (High vulnerability to erosion)
  { mun: "Paranavaí", lat: -23.081, lng: -52.464, basin: "Rio Paranapanema", reg: "Noroeste", soil: "Argissolo Vermelho-Amarelo", elev: 425 },
  { mun: "Umuarama", lat: -23.766, lng: -53.325, basin: "Rio Ivaí", reg: "Noroeste", soil: "Argissolo Vermelho-Amarelo", elev: 430 },
  { mun: "Cianorte", lat: -23.663, lng: -52.605, basin: "Rio Ivaí", reg: "Noroeste", soil: "Latossolo Vermelho Distroférrico", elev: 530 },
  { mun: "Cruzeiro do Oeste", lat: -23.784, lng: -53.075, basin: "Rio Ivaí", reg: "Noroeste", soil: "Argissolo Vermelho-Amarelo", elev: 440 },
  { mun: "Alto Paraná", lat: -23.129, lng: -52.318, basin: "Rio Paranapanema", reg: "Noroeste", soil: "Argissolo Vermelho-Amarelo", elev: 460 },
  { mun: "Loanda", lat: -22.923, lng: -52.987, basin: "Rio Paranapanema", reg: "Noroeste", soil: "Argissolo Vermelho-Amarelo", elev: 360 },
  { mun: "Cidade Gaúcha", lat: -23.362, lng: -52.944, basin: "Rio Ivaí", reg: "Noroeste", soil: "Argissolo Vermelho-Amarelo", elev: 410 },
  { mun: "Terra Roxa", lat: -24.159, lng: -54.098, basin: "Rio Paraná", reg: "Noroeste", soil: "Latossolo Vermelho Eutroférrico", elev: 320 },
  { mun: "Nova Londrina", lat: -22.765, lng: -52.986, basin: "Rio Paranapanema", reg: "Noroeste", soil: "Argissolo Vermelho-Amarelo", elev: 350 },
  { mun: "Paraíso do Norte", lat: -23.280, lng: -52.603, basin: "Rio Ivaí", reg: "Noroeste", soil: "Argissolo Vermelho-Amarelo", elev: 400 },

  // Norte Central / Bacia do Pirapó e Tibagi
  { mun: "Maringá", lat: -23.420, lng: -51.933, basin: "Rio Ivaí", reg: "Norte Central", soil: "Latossolo Vermelho Distroférrico", elev: 555 },
  { mun: "Londrina", lat: -23.304, lng: -51.169, basin: "Rio Tibagi", reg: "Norte Central", soil: "Latossolo Vermelho Eutroférrico", elev: 610 },
  { mun: "Arapongas", lat: -23.414, lng: -51.424, basin: "Rio Tibagi", reg: "Norte Central", soil: "Latossolo Vermelho Distroférrico", elev: 780 },
  { mun: "Apucarana", lat: -23.551, lng: -51.461, basin: "Rio Tibagi", reg: "Norte Central", soil: "Latossolo Vermelho Distroférrico", elev: 840 },
  { mun: "Rolândia", lat: -23.310, lng: -51.368, basin: "Rio Tibagi", reg: "Norte Central", soil: "Latossolo Vermelho Eutroférrico", elev: 645 },
  { mun: "Cambé", lat: -23.276, lng: -51.278, basin: "Rio Tibagi", reg: "Norte Central", soil: "Latossolo Vermelho Eutroférrico", elev: 670 },
  { mun: "Astorga", lat: -23.232, lng: -51.665, basin: "Rio Pirapó", reg: "Norte Central", soil: "Latossolo Vermelho Distroférrico", elev: 630 },
  { mun: "Mandaguari", lat: -23.528, lng: -51.772, basin: "Rio Ivaí", reg: "Norte Central", soil: "Latossolo Vermelho Distroférrico", elev: 650 },
  { mun: "Jandaia do Sul", lat: -23.601, lng: -51.644, basin: "Rio Ivaí", reg: "Norte Central", soil: "Latossolo Vermelho Distroférrico", elev: 690 },
  { mun: "Colorado", lat: -22.837, lng: -51.973, basin: "Rio Paranapanema", reg: "Norte Central", soil: "Argissolo Vermelho-Amarelo", elev: 400 },

  // Norte Pioneiro
  { mun: "Cornélio Procópio", lat: -23.181, lng: -50.646, basin: "Rio Paranapanema", reg: "Norte Pioneiro", soil: "Latossolo Vermelho Distroférrico", elev: 658 },
  { mun: "Santo Antônio da Platina", lat: -23.295, lng: -50.082, basin: "Rio Paranapanema", reg: "Norte Pioneiro", soil: "Nitossolo Vermelho", elev: 510 },
  { mun: "Jacarezinho", lat: -23.160, lng: -49.970, basin: "Rio Paranapanema", reg: "Norte Pioneiro", soil: "Nitossolo Vermelho", elev: 490 },
  { mun: "Bandeirantes", lat: -23.107, lng: -50.367, basin: "Rio Paranapanema", reg: "Norte Pioneiro", soil: "Latossolo Vermelho Distroférrico", elev: 492 },
  { mun: "Ibaiti", lat: -23.848, lng: -50.187, basin: "Rio Paranapanema", reg: "Norte Pioneiro", soil: "Neossolo Regolítico", elev: 850 },
  { mun: "Wenceslau Braz", lat: -23.874, lng: -49.803, basin: "Rio Paranapanema", reg: "Norte Pioneiro", soil: "Cambissolo Háplico", elev: 840 },
  { mun: "Siqueira Campos", lat: -23.689, lng: -49.833, basin: "Rio Paranapanema", reg: "Norte Pioneiro", soil: "Neossolo Regolítico", elev: 710 },

  // Centro-Ocidental / Bacia do Ivaí e Piquiri
  { mun: "Campo Mourão", lat: -24.045, lng: -52.381, basin: "Rio Ivaí", reg: "Centro-Ocidental", soil: "Latossolo Vermelho Distroférrico", elev: 630 },
  { mun: "Goioerê", lat: -24.184, lng: -53.027, basin: "Rio Piquiri", reg: "Centro-Ocidental", soil: "Latossolo Vermelho Distroférrico", elev: 520 },
  { mun: "Ubiratã", lat: -24.545, lng: -52.990, basin: "Rio Piquiri", reg: "Centro-Ocidental", soil: "Latossolo Vermelho Distroférrico", elev: 510 },
  { mun: "Mamborê", lat: -24.318, lng: -52.529, basin: "Rio Ivaí", reg: "Centro-Ocidental", soil: "Latossolo Vermelho Distroférrico", elev: 750 },
  { mun: "Engenheiro Beltrão", lat: -23.797, lng: -52.269, basin: "Rio Ivaí", reg: "Centro-Ocidental", soil: "Latossolo Vermelho Distroférrico", elev: 490 },
  { mun: "Campina da Lagoa", lat: -24.590, lng: -52.799, basin: "Rio Piquiri", reg: "Centro-Ocidental", soil: "Latossolo Vermelho Distroférrico", elev: 610 },

  // Oeste / Cascavel e Toledo
  { mun: "Cascavel", lat: -24.957, lng: -53.459, basin: "Rio Piquiri", reg: "Oeste", soil: "Nitossolo Vermelho", elev: 780 },
  { mun: "Toledo", lat: -24.724, lng: -53.743, basin: "Rio Paraná", reg: "Oeste", soil: "Latossolo Vermelho Eutroférrico", elev: 550 },
  { mun: "Palotina", lat: -24.283, lng: -53.840, basin: "Rio Piquiri", reg: "Oeste", soil: "Latossolo Vermelho Eutroférrico", elev: 335 },
  { mun: "Marechal Cândido Rondon", lat: -24.556, lng: -54.057, basin: "Rio Paraná", reg: "Oeste", soil: "Latossolo Vermelho Eutroférrico", elev: 410 },
  { mun: "Medianeira", lat: -25.297, lng: -54.094, basin: "Rio Iguaçu", reg: "Oeste", soil: "Nitossolo Vermelho", elev: 410 },
  { mun: "Foz do Iguaçu", lat: -25.516, lng: -54.585, basin: "Rio Paraná", reg: "Oeste", soil: "Nitossolo Vermelho", elev: 190 },
  { mun: "Assis Chateaubriand", lat: -24.417, lng: -53.521, basin: "Rio Piquiri", reg: "Oeste", soil: "Latossolo Vermelho Eutroférrico", elev: 440 },
  { mun: "Santa Helena", lat: -24.858, lng: -54.332, basin: "Rio Paraná", reg: "Oeste", soil: "Nitossolo Vermelho", elev: 250 },

  // Sudoeste / Bacia do Iguaçu
  { mun: "Pato Branco", lat: -26.228, lng: -52.671, basin: "Rio Iguaçu", reg: "Sudoeste", soil: "Nitossolo Vermelho", elev: 760 },
  { mun: "Francisco Beltrão", lat: -26.081, lng: -53.055, basin: "Rio Iguaçu", reg: "Sudoeste", soil: "Neossolo Regolítico", elev: 650 },
  { mun: "Dois Vizinhos", lat: -25.750, lng: -53.056, basin: "Rio Iguaçu", reg: "Sudoeste", soil: "Nitossolo Vermelho", elev: 520 },
  { mun: "Chopinzinho", lat: -25.856, lng: -52.523, basin: "Rio Iguaçu", reg: "Sudoeste", soil: "Cambissolo Háplico", elev: 740 },
  { mun: "Coronel Vivida", lat: -25.978, lng: -52.568, basin: "Rio Iguaçu", reg: "Sudoeste", soil: "Nitossolo Vermelho", elev: 720 },
  { mun: "Palmas", lat: -26.483, lng: -51.989, basin: "Rio Iguaçu", reg: "Sudoeste", soil: "Cambissolo Háplico", elev: 1115 },
  { mun: "Capanema", lat: -25.669, lng: -53.799, basin: "Rio Iguaçu", reg: "Sudoeste", soil: "Nitossolo Vermelho", elev: 360 },

  // Centro-Sul e Campos Gerais
  { mun: "Guarapuava", lat: -25.395, lng: -51.458, basin: "Rio Iguaçu", reg: "Centro-Sul", soil: "Latossolo Vermelho Distroférrico", elev: 1120 },
  { mun: "Ponta Grossa", lat: -25.095, lng: -50.161, basin: "Rio Tibagi", reg: "Campos Gerais", soil: "Cambissolo Háplico", elev: 975 },
  { mun: "Castro", lat: -24.791, lng: -50.012, basin: "Rio Tibagi", reg: "Campos Gerais", soil: "Latossolo Vermelho Distroférrico", elev: 990 },
  { mun: "Telêmaco Borba", lat: -24.323, lng: -50.615, basin: "Rio Tibagi", reg: "Campos Gerais", soil: "Neossolo Regolítico", elev: 740 },
  { mun: "Tibagi", lat: -24.512, lng: -50.413, basin: "Rio Tibagi", reg: "Campos Gerais", soil: "Neossolo Litólico", elev: 730 },
  { mun: "Prudentópolis", lat: -25.213, lng: -50.978, basin: "Rio Ivaí", reg: "Centro-Sul", soil: "Cambissolo Háplico", elev: 730 },
  { mun: "Irati", lat: -25.467, lng: -50.651, basin: "Rio Iguaçu", reg: "Centro-Sul", soil: "Cambissolo Háplico", elev: 830 },
  { mun: "União da Vitória", lat: -26.225, lng: -51.085, basin: "Rio Iguaçu", reg: "Centro-Sul", soil: "Cambissolo Háplico", elev: 750 },
  { mun: "São Mateus do Sul", lat: -25.873, lng: -50.383, basin: "Rio Iguaçu", reg: "Centro-Sul", soil: "Cambissolo Háplico", elev: 770 },
  { mun: "Laranjeiras do Sul", lat: -25.408, lng: -52.415, basin: "Rio Iguaçu", reg: "Centro-Sul", soil: "Nitossolo Vermelho", elev: 840 },
  { mun: "Pitanga", lat: -24.757, lng: -51.761, basin: "Rio Ivaí", reg: "Centro-Sul", soil: "Latossolo Vermelho Distroférrico", elev: 950 },
  { mun: "Ivaiporã", lat: -24.248, lng: -51.684, basin: "Rio Ivaí", reg: "Norte Central", soil: "Latossolo Vermelho Distroférrico", elev: 680 },

  // Região Metropolitana de Curitiba e Litoral
  { mun: "Curitiba", lat: -25.428, lng: -49.273, basin: "Rio Iguaçu", reg: "Metropolitana", soil: "Cambissolo Háplico", elev: 934 },
  { mun: "Lapa", lat: -25.769, lng: -49.716, basin: "Rio Iguaçu", reg: "Metropolitana", soil: "Neossolo Litólico", elev: 910 },
  { mun: "Rio Negro", lat: -26.103, lng: -49.797, basin: "Rio Iguaçu", reg: "Metropolitana", soil: "Cambissolo Háplico", elev: 780 },
  { mun: "Cerro Azul", lat: -24.825, lng: -49.260, basin: "Rio Ribeira", reg: "Metropolitana", soil: "Neossolo Litólico", elev: 340 },
  { mun: "Morretes", lat: -25.476, lng: -48.834, basin: "Litoral", reg: "Litoral", soil: "Neossolo Litólico", elev: 10 },
  { mun: "Antonina", lat: -25.429, lng: -48.712, basin: "Litoral", reg: "Litoral", soil: "Neossolo Litólico", elev: 8 },
  { mun: "Paranaguá", lat: -25.520, lng: -48.509, basin: "Litoral", reg: "Litoral", soil: "Neossolo Litólico", elev: 5 },
  { mun: "Guaratuba", lat: -25.883, lng: -48.575, basin: "Litoral", reg: "Litoral", soil: "Neossolo Litólico", elev: 6 },
];

const featureTypes = [
  "Erosão Laminar Severa",
  "Sulcos de Erosão Acentuados",
  "Ravina Ativa",
  "Voçoroca em Expansão",
  "Depressão com Escoamento Concentrado",
];

// Deterministic pseudorandom generator for consistent realistic values
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * @param seedOffset Desloca o gerador pseudoaleatório (mantendo a mesma
 * distribuição geográfica por município) para permitir "recarregar" o
 * conjunto de demonstração com jitter/atributos diferentes — usado pelo
 * botão "Recarregar Seleção" quando um ponto sintético cai sobre uma área
 * urbana ou outro local que foge aos critérios de elegibilidade (README §3.3).
 */
export function generate150MockErosionPoints(seedOffset = 0): ErosionPoint[] {
  const points: ErosionPoint[] = [];

  for (let i = 1; i <= 150; i++) {
    const locBase = paranaLocations[(i - 1) % paranaLocations.length];
    const seed = i * 42.17 + seedOffset;
    
    // Add small realistic spatial jitter (± 0.08° ≈ ± 8 km within municipality)
    const latOffset = (seededRandom(seed + 1) - 0.5) * 0.16;
    const lngOffset = (seededRandom(seed + 2) - 0.5) * 0.16;
    
    const lat = Number((locBase.lat + latOffset).toFixed(6));
    const lng = Number((locBase.lng + lngOffset).toFixed(6));
    
    // Slope calculation: sandy / hilly areas higher slope
    const isSteep = locBase.reg === "Norte Pioneiro" || locBase.reg === "Litoral" || locBase.reg === "Metropolitana" || locBase.reg === "Centro-Sul";
    const slopeDeg = Number((isSteep ? 12 + seededRandom(seed + 3) * 18 : 3 + seededRandom(seed + 3) * 14).toFixed(1));
    const slopePct = Number((Math.tan((slopeDeg * Math.PI) / 180) * 100).toFixed(1));
    
    // Bare Soil Index (BSI) from -0.30 (mild exposed) to +0.88 (extremely high bare soil)
    const bsi = Number((-0.20 + seededRandom(seed + 4) * 1.05).toFixed(2));
    const ndvi = Number((0.70 - bsi * 0.5 - seededRandom(seed + 5) * 0.2).toFixed(2));
    
    // Feature type & soil
    const featTypeIdx = Math.floor(seededRandom(seed + 6) * featureTypes.length);
    const featureType = featureTypes[featTypeIdx];
    
    // Severity e Score de Prioridade calculados pelas MESMAS fórmulas (README
    // §3.1/§3.2) usadas no cálculo real via satélite (src/lib/rusle/rusleCalculator.ts) —
    // aqui alimentadas por slope/BSI sintéticos, já que este é o gerador de
    // dados de DEMONSTRAÇÃO da interface (ver dataProvenance: "mock" abaixo).
    const { severity } = calculateSeverity(slopePct, bsi, locBase.soil);
    const priorityScore = calculatePriorityScore(severity, bsi, slopeDeg, seededRandom(seed + 7) * 10);

    // Estimativa heurística de perda de solo (NÃO é a RUSLE completa: usa apenas
    // declividade e BSI sintéticos, sem R/K/LS/C reais). Serve só para ordenar
    // os pontos de demonstração; ver /api/gee/analyze-point para o cálculo real.
    const soilLoss = Number((5 + (slopePct * 2.2) * (Math.max(0.1, bsi + 0.3) * 1.8)).toFixed(1));

    const elevation = Math.round(locBase.elev + (seededRandom(seed + 8) - 0.5) * 80);

    const padId = String(i).padStart(3, "0");

    // Amostras de dados fundiários cadastrais (SICAR/SNCR) para fins de demonstração
    const sampleProperties = [
      { name: "Fazenda Santa Maria", car: `BR-PR-4105404-${padId}123-A`, owner: "Maria Silva de Oliveira", doc: "***.482.919-**", incra: `950.041.${padId}.123-1`, area: Number((45 + seededRandom(seed + 11) * 280).toFixed(1)) },
      { name: "Fazenda Boa Esperança", car: `BR-PR-4115200-${padId}452-B`, owner: "João Carlos Silveira", doc: "***.109.839-**", incra: `950.152.${padId}.452-8`, area: Number((80 + seededRandom(seed + 11) * 420).toFixed(1)) },
      { name: "Sítio Alvorada", car: `BR-PR-4108309-${padId}789-C`, owner: "Pedro Henrique Zanin", doc: "***.324.779-**", incra: `950.083.${padId}.789-3`, area: Number((25 + seededRandom(seed + 11) * 75).toFixed(1)) },
      { name: "Estância Primavera", car: `BR-PR-4127700-${padId}204-D`, owner: "Agrícola Campos Gerais Ltda", doc: "**.392.110/0001-**", incra: `950.277.${padId}.204-5`, area: Number((150 + seededRandom(seed + 11) * 650).toFixed(1)) },
      { name: "Fazenda São José", car: `BR-PR-4104308-${padId}311-E`, owner: "Antônio Marcos Ferreira", doc: "***.891.229-**", incra: `950.043.${padId}.311-9`, area: Number((55 + seededRandom(seed + 11) * 190).toFixed(1)) },
    ];
    // Associa cada ponto a um imóvel rural do seu município para demonstração imediata
    const prop = sampleProperties[(i - 1) % sampleProperties.length];

    points.push({
      id: `ERO-PR-${padId}`,
      code: `PR-2026-${padId}`,
      name: `Foco Erosivo ${padId} - ${locBase.mun}`,
      latitude: lat,
      longitude: lng,
      elevation,
      slopePercent: slopePct,
      slopeDegrees: slopeDeg,
      bsi,
      ndvi: Math.max(0.05, ndvi),
      municipality: locBase.mun,
      state: "PR",
      macroRegion: locBase.reg,
      watershed: locBase.basin,
      soilType: locBase.soil,
      featureType,
      severity,
      estimatedSoilLoss: soilLoss,
      priorityScore,
      detectionDate: `2026-0${Math.floor(1 + seededRandom(seed + 9) * 7)}-${String(Math.floor(1 + seededRandom(seed + 10) * 28)).padStart(2, "0")}`,
      notes: `Candidato a talhão-piloto para amostragem em campo (GNSS RTK / VANT) e formação do dataset rotulado de treinamento do XGBoost — BSI de ${bsi} indica ${bsi > 0.4 ? "solo altamente exposto sem cobertura vegetal" : "cobertura parcial com risco de escoamento superficial"} (dado sintético de demonstração, não medido).`,
      dataProvenance: "mock",
      ...(prop ? {
        propertyName: prop.name,
        carCode: prop.car,
        ownerName: prop.owner,
        ownerDocumentMasked: prop.doc,
        incraRegistry: prop.incra,
        propertyAreaHa: prop.area,
      } : {}),
    });
  }

  // Sort initially by highest priority
  return points.sort((a, b) => b.priorityScore - a.priorityScore);
}

export const mockErosionPoints: ErosionPoint[] = generate150MockErosionPoints();
