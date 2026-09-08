/**
 * Módulo de Máscara de Elegibilidade Espacial (Google Earth Engine)
 *
 * Constrói a máscara binária de elegibilidade para triagem e seleção de candidatos
 * de visita de campo e treinamento de modelos de erosão laminar.
 *
 * Critérios combinados (README §3.3 & PLANO_SELECAO_CANDIDATOS_GEE.md):
 * 1. Uso do Solo (ESA WorldCover 10m v200/2021): mantém Cropland(40), Grassland(30)
 *    e Bare(60); exclui Built-up(50), Água(80), Florestas(10), etc.
 * 2. Declividade (Copernicus DEM GLO-30 via ee.Terrain.slope): restringe aos
 *    intervalos de risco de escoamento superficial (padrão: 3% a 20%, Embrapa §2.2.B).
 * 3. Corpos d'Água (JRC Global Surface Water 1.4 'occurrence'): detecta áreas
 *    hídricas e aplica buffer morfológico de exclusão (padrão: 30m, README §3.3.4).
 *
 * Este módulo só deve ser executado no ambiente de servidor (Node.js / API routes).
 */
const { XMLHttpRequest } = require("xmlhttprequest");
if (!(global as any).XMLHttpRequest) {
  (global as any).XMLHttpRequest = XMLHttpRequest;
}
const ee = require("@google/earthengine");

export * from "./eligibilityConstants";
import {
  EligibilityMaskOptions,
  normalizeAoIToGeoJSON,
  validateEligibilityOptions,
} from "./eligibilityConstants";

/**
 * Converte diferentes formatos de AOI (GeoJSON Geometry, GeoJSON Feature ou AOIPolygon)
 * para um objeto ee.Geometry.
 */
export function parseAoIToEeGeometry(aoi: any): any {
  if (!aoi) return null;
  // Se já for uma instância de ee.Geometry ou ee.ComputedObject, retorna diretamente
  if (
    aoi instanceof ee.Geometry ||
    (typeof aoi === "object" && typeof aoi.type === "function") ||
    (typeof aoi === "object" && typeof aoi.getInfo === "function")
  ) {
    return aoi;
  }
  const geojson = normalizeAoIToGeoJSON(aoi);
  return ee.Geometry(geojson);
}

/**
 * Constrói a máscara booleana de uso da terra a partir do ESA WorldCover 10m (v200).
 * Retorna imagem remapeada (1 = classe elegível, 0 = inelegível) com banda nomeada 'landcover_eligible'.
 */
export function buildWorldCoverMask(aoiGeometry: any, allowedClasses: number[]): any {
  const worldCoverCollection = ee.ImageCollection("ESA/WorldCover/v200");
  const filtered = aoiGeometry ? worldCoverCollection.filterBounds(aoiGeometry) : worldCoverCollection;
  const lcImage = filtered.mosaic().select("Map");

  const fromList = allowedClasses;
  const toList = allowedClasses.map(() => 1);
  return lcImage.remap(ee.List(fromList), ee.List(toList), 0).rename("landcover_eligible");
}

/**
 * Constrói a camada de declividade em porcentagem (S%) e a respectiva máscara de elegibilidade.
 * Utiliza o Copernicus DEM GLO-30 e calcula declividade em graus via ee.Terrain.slope,
 * convertendo em seguida para porcentagem: S% = tan(theta * pi / 180) * 100.
 */
export function buildSlopeMask(
  aoiGeometry: any,
  minSlopePercent: number,
  maxSlopePercent: number
): { slopePercent: any; slopeEligible: any } {
  const dem = ee.ImageCollection("COPERNICUS/DEM/GLO30")
    .select("DEM")
    .mosaic()
    .setDefaultProjection("EPSG:3857", null, 30);
  const slopeDeg = ee.Terrain.slope(dem);

  const slopePercent = slopeDeg.expression(
    "tan(deg * (pi / 180.0)) * 100.0",
    {
      deg: slopeDeg,
      pi: Math.PI,
    }
  ).rename("slope_percent");

  const slopeEligible = slopePercent
    .gte(minSlopePercent)
    .and(slopePercent.lte(maxSlopePercent))
    .rename("slope_eligible");

  return {
    slopePercent,
    slopeEligible,
  };
}

/**
 * Constrói a máscara de exclusão hídrica a partir do JRC Global Surface Water (1.4).
 * Identifica corpos d'água (occurrence > limiar) e aplica buffer morfológico (focalMax).
 * Retorna 'water_eligible' (1 = área segura sem água, 0 = dentro de corpo d'água ou do buffer).
 */
export function buildWaterExclusionMask(
  aoiGeometry: any,
  occurrenceThreshold: number,
  bufferMeters: number
): { waterRaw: any; waterExclusionZone: any; waterEligible: any } {
  const gsw = ee.Image("JRC/GSW1_4/GlobalSurfaceWater").select("occurrence");

  // Água presente quando ocorrência histórica > limiar (0..100)
  const water = gsw.unmask(0).gt(occurrenceThreshold);

  let waterExclusionZone = water;
  if (bufferMeters > 0) {
    // Expande a mancha d'água pelo raio configurado em metros
    waterExclusionZone = water.focalMax({
      radius: bufferMeters,
      units: "meters",
      kernelType: "circle",
    });
  }

  // Elegível onde NÃO há água (e nem no buffer): waterExclusionZone == 0
  const waterEligible = waterExclusionZone.unmask(0).eq(0).rename("water_eligible");

  return {
    waterRaw: water.rename("water_occurrence_raw"),
    waterExclusionZone: waterExclusionZone.rename("water_exclusion_zone"),
    waterEligible,
  };
}

/**
 * Constrói a máscara de exclusão de áreas urbanizadas e edificadas a partir do ESA WorldCover 10m (v200).
 * Extrai a classe 50 ('Built-up') e aplica buffer morfológico de dilatação (focalMax).
 * Retorna 'urban_eligible' (1 = área rural segura sem edificações, 0 = mancha urbana ou dentro do buffer).
 */
export function buildUrbanExclusionMask(
  aoiGeometry: any,
  bufferMeters: number,
  lcImageInput?: any
): { urbanRaw: any; urbanExclusionZone: any; urbanEligible: any } {
  let lcImage = lcImageInput;
  if (!lcImage) {
    const worldCoverCollection = ee.ImageCollection("ESA/WorldCover/v200");
    const filtered = aoiGeometry ? worldCoverCollection.filterBounds(aoiGeometry) : worldCoverCollection;
    lcImage = filtered.mosaic().select("Map");
  }

  // Classe 50 = Built-up (áreas urbanizadas, estruturas construídas, vias pavimentadas)
  const builtUp = lcImage.eq(50);

  let urbanExclusionZone = builtUp;
  if (bufferMeters > 0) {
    // Expande a mancha urbana pelo raio configurado em metros
    urbanExclusionZone = builtUp.focalMax({
      radius: bufferMeters,
      units: "meters",
      kernelType: "circle",
    });
  }

  // Elegível onde NÃO é área urbana nem faixa de amortecimento: urbanExclusionZone == 0
  const urbanEligible = urbanExclusionZone.unmask(0).eq(0).rename("urban_eligible");

  return {
    urbanRaw: builtUp.rename("urban_builtup_raw"),
    urbanExclusionZone: urbanExclusionZone.rename("urban_exclusion_zone"),
    urbanEligible,
  };
}

/**
 * Monta a ee.Image combinando os 4 filtros de elegibilidade:
 * (Uso do Solo Agrícola) E (Declividade na Faixa de Risco) E (Fora de Água/Buffer) E (Fora de Áreas Urbanas/Buffer).
 *
 * Retorna uma ee.Image contendo:
 *  - 'eligibility': 1 para pixel elegível, 0 para inelegível
 *  - 'landcover_eligible': 1 ou 0
 *  - 'slope_eligible': 1 ou 0
 *  - 'water_eligible': 1 ou 0
 *  - 'urban_eligible': 1 ou 0
 *  - 'slope_percent': valor contínuo da declividade calculada em %
 */
export function buildEligibilityMask(aoi: any, options?: EligibilityMaskOptions): any {
  const validated = validateEligibilityOptions(options);
  const aoiGeom = aoi ? parseAoIToEeGeometry(aoi) : null;

  const worldCoverCollection = ee.ImageCollection("ESA/WorldCover/v200");
  const filtered = aoiGeom ? worldCoverCollection.filterBounds(aoiGeom) : worldCoverCollection;
  const lcImage = filtered.mosaic().select("Map");

  const fromList = validated.allowedLandCoverClasses;
  const toList = validated.allowedLandCoverClasses.map(() => 1);
  const lcMask = lcImage.remap(ee.List(fromList), ee.List(toList), 0).rename("landcover_eligible");

  const { slopePercent, slopeEligible } = buildSlopeMask(
    aoiGeom,
    validated.minSlopePercent,
    validated.maxSlopePercent
  );
  const { waterEligible } = buildWaterExclusionMask(
    aoiGeom,
    validated.waterOccurrenceThreshold,
    validated.waterBufferMeters
  );
  const { urbanEligible } = buildUrbanExclusionMask(
    aoiGeom,
    validated.urbanBufferMeters,
    lcImage
  );

  // Interseção lógica quádrupla: Agrícola E Declividade E Fora de Água E Fora de Urbano
  const eligibility = lcMask.eq(1)
    .and(slopeEligible.eq(1))
    .and(waterEligible.eq(1))
    .and(urbanEligible.eq(1))
    .rename("eligibility");

  const combined = ee.Image.cat([
    eligibility,
    lcMask,
    slopeEligible,
    waterEligible,
    urbanEligible,
    slopePercent,
  ]);

  return aoiGeom ? combined.clip(aoiGeom) : combined;
}
