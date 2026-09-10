/**
 * Definições e Constantes Puras de Elegibilidade Geoespacial
 *
 * Módulo puro e isomórfico (compatível com cliente e servidor), contendo
 * catálogo de classes da ESA WorldCover 10m, valores padrão de limiares
 * e funções de validação.
 */

export interface EligibilityMaskOptions {
  /**
   * Classes de cobertura do solo permitidas conforme classificação ESA WorldCover 10m.
   * Padrão: [30, 40, 60] (Grassland / Pastagem, Cropland / Agricultura, Bare / Solo Exposto).
   */
  allowedLandCoverClasses?: number[];

  /**
   * Declividade mínima em porcentagem (%).
   * Padrão: 3.0% (Início de relevo suave-ondulado conforme Embrapa / README §2.2.B).
   */
  minSlopePercent?: number;

  /**
   * Declividade máxima em porcentagem (%).
   * Padrão: 20.0% (Limite superior de relevo ondulado conforme Embrapa / README §2.2.B).
   */
  maxSlopePercent?: number;

  /**
   * Limiar de ocorrência de água superficial (JRC Global Surface Water 'occurrence') em %.
   * Padrão: 10% (qualquer pixel com histórico de presença de água > 10% é considerado corpo hídrico).
   */
  waterOccurrenceThreshold?: number;

  /**
   * Raio do buffer de exclusão ao redor de corpos d'água em metros.
   * Padrão: 30 metros (README §3.3.4 - Isolamento de Interferências de Borda).
   */
  waterBufferMeters?: number;

  /**
   * Raio do buffer de exclusão morfológica ao redor de áreas urbanizadas e edificações
   * (ESA WorldCover classe 50 'Built-up') em metros.
   * Padrão: 150 metros (conecta quadras urbanas, elimina vazios intraurbanos e isola sedes).
   */
  urbanBufferMeters?: number;
}

export interface LandCoverClassInfo {
  code: number;
  name: string;
  description: string;
  defaultEligible: boolean;
}

/**
 * Catálogo das classes oficiais da ESA WorldCover 10m (v200 / 2021).
 */
export const WORLDCOVER_CLASSES: Record<number, LandCoverClassInfo> = {
  10: { code: 10, name: "Tree cover", description: "Florestas e cobertura arbórea densa", defaultEligible: false },
  20: { code: 20, name: "Shrubland", description: "Vegetação arbustiva", defaultEligible: false },
  30: { code: 30, name: "Grassland", description: "Pastagens e formações campestres", defaultEligible: true },
  40: { code: 40, name: "Cropland", description: "Culturas agrícolas anuais e perenes", defaultEligible: true },
  50: { code: 50, name: "Built-up", description: "Áreas urbanizadas e infraestruturas construídas", defaultEligible: false },
  60: { code: 60, name: "Bare / sparse vegetation", description: "Solo exposto e vegetação esparsa", defaultEligible: true },
  70: { code: 70, name: "Snow and ice", description: "Neve e gelo perene", defaultEligible: false },
  80: { code: 80, name: "Permanent water bodies", description: "Corpos d'água permanentes", defaultEligible: false },
  90: { code: 90, name: "Herbaceous wetland", description: "Áreas úmidas e várzeas herbáceas", defaultEligible: false },
  95: { code: 95, name: "Mangroves", description: "Manguezais", defaultEligible: false },
  100: { code: 100, name: "Moss and lichen", description: "Musgos e líquens", defaultEligible: false },
};

/**
 * Valores padrão para os critérios de elegibilidade conforme diretrizes metodológicas.
 */
export const DEFAULT_ELIGIBILITY_OPTIONS: Required<EligibilityMaskOptions> = {
  allowedLandCoverClasses: [30, 40, 60],
  minSlopePercent: 3.0,
  maxSlopePercent: 20.0,
  waterOccurrenceThreshold: 10,
  waterBufferMeters: 30,
  urbanBufferMeters: 150,
};

/**
 * Valida e completa os parâmetros de opções de elegibilidade.
 * Lança erros descritivos caso parâmetros estejam inconsistentes.
 */
export function validateEligibilityOptions(options?: EligibilityMaskOptions): Required<EligibilityMaskOptions> {
  const minSlope = options?.minSlopePercent ?? DEFAULT_ELIGIBILITY_OPTIONS.minSlopePercent;
  const maxSlope = options?.maxSlopePercent ?? DEFAULT_ELIGIBILITY_OPTIONS.maxSlopePercent;
  const waterOccurrence = options?.waterOccurrenceThreshold ?? DEFAULT_ELIGIBILITY_OPTIONS.waterOccurrenceThreshold;
  const waterBuffer = options?.waterBufferMeters ?? DEFAULT_ELIGIBILITY_OPTIONS.waterBufferMeters;
  const urbanBuffer = options?.urbanBufferMeters ?? DEFAULT_ELIGIBILITY_OPTIONS.urbanBufferMeters;
  const allowedClasses = options?.allowedLandCoverClasses ?? DEFAULT_ELIGIBILITY_OPTIONS.allowedLandCoverClasses;

  if (typeof minSlope !== "number" || isNaN(minSlope) || minSlope < 0) {
    throw new Error(`Declividade mínima inválida (${minSlope}%). Deve ser um número maior ou igual a 0.`);
  }
  if (typeof maxSlope !== "number" || isNaN(maxSlope) || maxSlope <= minSlope) {
    throw new Error(`Declividade máxima (${maxSlope}%) deve ser estritamente maior que a mínima (${minSlope}%).`);
  }
  if (typeof waterOccurrence !== "number" || isNaN(waterOccurrence) || waterOccurrence < 0 || waterOccurrence > 100) {
    throw new Error(`Limiar de ocorrência de água deve estar entre 0% e 100% (recebido: ${waterOccurrence}%).`);
  }
  if (typeof waterBuffer !== "number" || isNaN(waterBuffer) || waterBuffer < 0) {
    throw new Error(`Buffer de exclusão de corpos d'água não pode ser negativo (recebido: ${waterBuffer}m).`);
  }
  if (typeof urbanBuffer !== "number" || isNaN(urbanBuffer) || urbanBuffer < 0) {
    throw new Error(`Buffer de exclusão de áreas urbanas não pode ser negativo (recebido: ${urbanBuffer}m).`);
  }
  if (!Array.isArray(allowedClasses) || allowedClasses.length === 0) {
    throw new Error("Pelo menos uma classe de cobertura do solo (Land Cover) deve ser informada como elegível.");
  }

  return {
    allowedLandCoverClasses: [...allowedClasses],
    minSlopePercent: minSlope,
    maxSlopePercent: maxSlope,
    waterOccurrenceThreshold: waterOccurrence,
    waterBufferMeters: waterBuffer,
    urbanBufferMeters: urbanBuffer,
  };
}

/**
 * Helper puro para verificar se uma classe do WorldCover é elegível sob um conjunto de opções.
 */
export function isLandCoverClassEligible(classCode: number, options?: EligibilityMaskOptions): boolean {
  const allowed = options?.allowedLandCoverClasses ?? DEFAULT_ELIGIBILITY_OPTIONS.allowedLandCoverClasses;
  return allowed.includes(classCode);
}

/**
 * Normaliza e valida a AOI para uma geometria GeoJSON válida (Polygon ou MultiPolygon).
 * Função pura executável sem dependência do runtime do Earth Engine.
 */
export function normalizeAoIToGeoJSON(aoi: any): GeoJSON.Polygon | GeoJSON.MultiPolygon {
  if (!aoi) {
    throw new Error("AOI (Área de Interesse) não fornecida para construção da máscara de elegibilidade.");
  }
  if (typeof aoi === "object") {
    // GeoJSON Feature
    if (aoi.type === "Feature" && aoi.geometry) {
      return normalizeAoIToGeoJSON(aoi.geometry);
    }
    // GeoJSON FeatureCollection
    if (aoi.type === "FeatureCollection" && Array.isArray(aoi.features) && aoi.features.length > 0) {
      return normalizeAoIToGeoJSON(aoi.features[0].geometry || aoi.features[0]);
    }
    // AOIPolygon wrapper ou objeto com campo .geometry
    if (aoi.geometry && typeof aoi.geometry === "object") {
      return normalizeAoIToGeoJSON(aoi.geometry);
    }
    // GeoJSON Geometry com type string (Polygon / MultiPolygon)
    if (typeof aoi.type === "string" && aoi.coordinates) {
      if (aoi.type !== "Polygon" && aoi.type !== "MultiPolygon") {
        throw new Error(`Tipo de geometria GeoJSON não suportado como AOI: "${aoi.type}". Use Polygon ou MultiPolygon.`);
      }
      return aoi as GeoJSON.Polygon | GeoJSON.MultiPolygon;
    }
  }
  throw new Error("Formato de AOI inválido ou não reconhecido como GeoJSON.");
}
