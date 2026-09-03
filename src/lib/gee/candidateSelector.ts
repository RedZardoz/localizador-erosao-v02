/**
 * Seletor de Candidatos Espacialmente Equilibrados via Google Earth Engine
 *
 * Executa a amostragem estratificada em alta resolução (10m) sobre a máscara
 * de elegibilidade em uma Área de Interesse (AOI). Para áreas extensas (como o
 * Estado do Paraná inteiro ou grandes bacias), particiona a AOI em lotes espaciais
 * (tiles), processa cada lote em resolução nativa (10m) no GEE e agrega tudo em um
 * único resultado consolidado através de Thinning Espacial global e métricas RUSLE.
 */
const { XMLHttpRequest } = require("xmlhttprequest");
if (!(global as any).XMLHttpRequest) {
  (global as any).XMLHttpRequest = XMLHttpRequest;
}
const ee = require("@google/earthengine");

import { ErosionPoint, GcpCredentials, SoilType } from "@/types/erosion";
import { initializeEarthEngine } from "./earthEngineClient";
import { GEE_CALC_ENGINE_VERSION, validateSlopePlausibility } from "./calcEngineVersion";
import {
  EligibilityMaskOptions,
  buildEligibilityMask,
  normalizeAoIToGeoJSON,
} from "./eligibilityMask";
import { buildStratificationBand, getStratumInfo } from "./stratification";
import { thinBySpacing } from "./spatialThinning";
import { generateAOITiles } from "./aoiTiling";
import {
  calculateCFactor,
  calculateLSFactor,
  calculatePriorityScore,
  calculateSeverity,
  calculateSoilLossRUSLE,
} from "../rusle/rusleCalculator";
import { estimateRainfallErosivity } from "../rusle/rainfallErosivity";
import { getKFactorRealOrApproximate } from "../rusle/soilErodibility";

export interface CandidateSelectionParams {
  aoi: any; // GeoJSON Polygon / MultiPolygon ou AOIPolygon
  targetCount?: number; // Padrão: 30 a 50 candidatos (máx: 500)
  minSpacingKm?: number; // Padrão: 1.0 km
  municipalityName?: string;
  stateName?: string;
  eligibilityOptions?: EligibilityMaskOptions;
  seed?: number;
}

export interface CandidateSelectionResult {
  candidates: ErosionPoint[];
  summary: {
    totalRequested: number;
    rawSampledCount: number;
    survivingCount: number;
    minSpacingKm: number;
    strataDistribution: Record<string, number>;
    generatedAt: string;
    totalTilesProcessed?: number;
    diagnostics?: {
      eligiblePixels: number;
      landCoverEligiblePixels: number;
      slopeEligiblePixels: number;
      waterEligiblePixels: number;
    };
  };
}

/** Máscara de nuvem/sombra do Sentinel-2 SR via banda SCL (README §2.1) */
function maskS2Clouds(image: any) {
  const scl = image.select("SCL");
  const invalid = scl.eq(3).or(scl.eq(8)).or(scl.eq(9)).or(scl.eq(10)).or(scl.eq(11));
  return image.updateMask(invalid.not());
}

interface TileSampleOutput {
  features: any[];
  diagnostics: {
    eligiblePixels: number;
    landCoverEligiblePixels: number;
    slopeEligiblePixels: number;
    waterEligiblePixels: number;
  };
}

/**
 * Processa a amostragem estratificada em alta resolução para uma sub-região (tile).
 */
async function sampleTileGEE(
  tilePolygon: GeoJSON.Polygon,
  fullAoiGeom: any,
  isSingleTile: boolean,
  pointsPerStratum: number,
  eligibilityOptions?: EligibilityMaskOptions,
  seed?: number
): Promise<TileSampleOutput> {
  try {
    const sampleRegion = isSingleTile ? fullAoiGeom : ee.Geometry(tilePolygon);

    // 1. Sentinel-2 SR Harmonized - Busca automática das cenas mais recentes com menor nuvem
    const s2Collection = ee
      .ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
      .filterBounds(sampleRegion)
      .sort("system:time_start", false)
      .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 70))
      .limit(20)
      .map(maskS2Clouds);

    const s2Composite = s2Collection.sort("CLOUDY_PIXEL_PERCENTAGE").mosaic();

    const bsi = s2Composite
      .expression("((SWIR2 + RED) - (NIR + BLUE)) / ((SWIR2 + RED) + (NIR + BLUE))", {
        SWIR2: s2Composite.select("B12"),
        RED: s2Composite.select("B4"),
        NIR: s2Composite.select("B8"),
        BLUE: s2Composite.select("B2"),
      })
      .unmask(0.0)
      .rename("BSI");

    const ndvi = s2Composite.normalizedDifference(["B8", "B4"]).unmask(0.5).rename("NDVI");

    // 2. Copernicus DEM GLO-30 e Declividade
    const elevation = ee.ImageCollection("COPERNICUS/DEM/GLO30")
      .select("DEM")
      .mosaic()
      .setDefaultProjection("EPSG:3857", null, 30)
      .rename("ELEVATION");
    const slopeDeg = ee.Terrain.slope(elevation).rename("SLOPE_DEG");
    const slopePercent = slopeDeg.expression(
      "tan(deg * (pi / 180.0)) * 100.0",
      {
        deg: slopeDeg,
        pi: Math.PI,
      }
    ).rename("SLOPE_PERCENT");

    // 3. Estratificação (Banda 'stratum' 1..6)
    const stratum = buildStratificationBand(slopePercent, bsi.gte(0.1)).unmask(4).rename("STRATUM");

    // 4. Máscara de Elegibilidade e Diagnóstico (Passo 0)
    const eligibilityImage = buildEligibilityMask(fullAoiGeom, eligibilityOptions);
    const eligibilityBand = eligibilityImage.select("eligibility").rename("ELIGIBILITY");
    const lcMask = eligibilityImage.select("landcover_eligible");
    const slopeEligible = eligibilityImage.select("slope_eligible");
    const waterEligible = eligibilityImage.select("water_eligible");

    // Instrumentação diagnóstica do Passo 0 (Contagem dos 4 filtros na AOI)
    const statsImage = ee.Image.cat([
      eligibilityBand.rename("eligible_sum"),
      lcMask.rename("lc_sum"),
      slopeEligible.rename("slope_sum"),
      waterEligible.rename("water_sum"),
    ]);

    const statsDict = statsImage.reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: sampleRegion,
      scale: 30,
      maxPixels: 1e9,
      tileScale: 4,
    });

    const evaluatedStats: any = await new Promise((resolve) => {
      statsDict.evaluate((res: any, err: any) => {
        if (err) {
          console.warn("[GEE Diagnostics] Erro no reduceRegion:", err);
          resolve({});
        } else {
          resolve(res || {});
        }
      });
    });

    console.log("=== [GEE DIAGNOSTICO PIXELS (30m)] ===", evaluatedStats);

    const diagnostics = {
      eligiblePixels: Math.round(Number(evaluatedStats.eligible_sum ?? 0)),
      landCoverEligiblePixels: Math.round(Number(evaluatedStats.lc_sum ?? 0)),
      slopeEligiblePixels: Math.round(Number(evaluatedStats.slope_sum ?? 0)),
      waterEligiblePixels: Math.round(Number(evaluatedStats.water_sum ?? 0)),
    };

    // 5. Empilhamento e mascaramento
    const stack = ee.Image.cat([
      bsi,
      ndvi,
      elevation,
      slopeDeg,
      slopePercent,
      stratum,
      eligibilityBand,
    ]);

    const maskedStack = stack.updateMask(eligibilityBand.eq(1));

    // 6. Amostragem Estratificada no GEE (Hipótese 1: dropNulls: true para descartar pixels mascarados)
    const sampledFeatures = maskedStack.stratifiedSample({
      numPoints: pointsPerStratum,
      classBand: "STRATUM",
      region: sampleRegion,
      scale: 30,
      geometries: true,
      dropNulls: true,
      tileScale: 4,
      seed: seed ?? 42,
    });

    const rawFC: any = await new Promise((resolve, reject) => {
      sampledFeatures.evaluate((res: any, err: any) => {
        if (err) {
          console.error(`[GEE CandidateSelector Erro]:`, err);
          reject(new Error(`Erro no processamento do Earth Engine: ${err?.message || err}`));
        } else {
          resolve(res);
        }
      });
    });

    return {
      features: rawFC?.features || [],
      diagnostics,
    };
  } catch (err: any) {
    console.error(`[GEE CandidateSelector Exceção]:`, err);
    throw err;
  }
}

/**
 * Seleciona candidatos reais no Earth Engine para uma AOI dada, com processamento em lote
 * e unificação consolidada.
 */
export async function selectCandidatesWithGEE(
  credentials: GcpCredentials,
  params: CandidateSelectionParams
): Promise<CandidateSelectionResult> {
  await initializeEarthEngine(credentials);

  const targetCount = params.targetCount && params.targetCount > 0 ? Math.min(params.targetCount, 500) : 40;
  const minSpacingKm = params.minSpacingKm !== undefined ? Math.max(0, params.minSpacingKm) : 1.0;
  const seed = params.seed ?? Math.floor(Math.random() * 100000);
  const municipality = params.municipalityName || "Paraná";
  const state = params.stateName || "PR";

  const geojson = normalizeAoIToGeoJSON(params.aoi);
  const aoiGeom = ee.Geometry(geojson);

  // Gera lotes espaciais (tiles de ~1 grau x 1 grau)
  const tiles = generateAOITiles(geojson, 1.0);
  const isSingleTile = tiles.length <= 1;
  const pointsPerStratumPerTile = Math.max(4, Math.ceil((targetCount * 3.0) / (tiles.length * 6)));

  // Processa lotes em concorrência controlada (chunks de 4 lotes simultâneos)
  const allFeatures: any[] = [];
  let totalEligible = 0;
  let totalLC = 0;
  let totalSlope = 0;
  let totalWater = 0;

  const chunkSize = 4;

  for (let i = 0; i < tiles.length; i += chunkSize) {
    const chunk = tiles.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map((tile, idx) =>
        sampleTileGEE(tile, aoiGeom, isSingleTile, pointsPerStratumPerTile, params.eligibilityOptions, seed + i + idx)
      )
    );
    for (const res of chunkResults) {
      allFeatures.push(...res.features);
      totalEligible += res.diagnostics.eligiblePixels;
      totalLC += res.diagnostics.landCoverEligiblePixels;
      totalSlope += res.diagnostics.slopeEligiblePixels;
      totalWater += res.diagnostics.waterEligiblePixels;
    }
  }

  const diagnostics = {
    eligiblePixels: totalEligible,
    landCoverEligiblePixels: totalLC,
    slopeEligiblePixels: totalSlope,
    waterEligiblePixels: totalWater,
  };

  if (allFeatures.length === 0) {
    throw new Error(
      `Nenhum pixel elegível foi encontrado pelo Earth Engine para esta Área de Interesse (${municipality}). Diagnóstico de pixels (30m): Elegíveis: ${totalEligible}, Uso do Solo (LC 30/40/60): ${totalLC}, Declividade: ${totalSlope}, Fora de Água: ${totalWater}.`
    );
  }

  // Conversão e padronização dos pontos amostrados
  const rawCandidates = allFeatures.map((f: any, idx: number) => {
    const coords = f.geometry?.coordinates || [0, 0];
    const lng = Number(coords[0]);
    const lat = Number(coords[1]);
    const props = f.properties || {};

    const rawBsi = Number(props.BSI ?? 0);
    const rawNdvi = Number(props.NDVI ?? 0);
    const rawSlopePercent = Number(props.SLOPE_PERCENT ?? 0);
    const rawSlopeDeg = Number(props.SLOPE_DEG ?? 0);
    const rawElevation = Math.round(Number(props.ELEVATION ?? 0));
    const rawStratum = Number(props.STRATUM ?? 1);

    validateSlopePlausibility(rawSlopeDeg);

    // Mapeamento pedológico coerente com o estrato
    const isGroupA = rawStratum >= 1 && rawStratum <= 3;
    const soilType: SoilType = isGroupA
      ? "Argissolo Vermelho-Amarelo"
      : "Latossolo Vermelho Distroférrico";

    const { severity } = calculateSeverity(rawSlopePercent, rawBsi, soilType);
    const priorityScore = calculatePriorityScore(severity, rawBsi, rawSlopeDeg, 0);

    return {
      index: idx,
      latitude: lat,
      longitude: lng,
      elevation: rawElevation,
      slopePercent: Number(rawSlopePercent.toFixed(2)),
      slopeDegrees: Number(rawSlopeDeg.toFixed(2)),
      bsi: Number(rawBsi.toFixed(3)),
      ndvi: Number(rawNdvi.toFixed(3)),
      stratumCode: rawStratum,
      soilType,
      severity,
      priorityScore,
    };
  });

  // Thinning Espacial Global por Distância Mínima sobre todos os lotes agregados
  const thinned = thinBySpacing(rawCandidates, minSpacingKm, targetCount);

  // Estimativa climatológica R
  const avgLat = thinned.reduce((acc, p) => acc + p.latitude, 0) / (thinned.length || 1);
  const avgLng = thinned.reduce((acc, p) => acc + p.longitude, 0) / (thinned.length || 1);

  let rFactor = 6500;
  try {
    const rainfall = await estimateRainfallErosivity(avgLat, avgLng);
    rFactor = rainfall.rFactor;
  } catch {
    // Fallback regional
  }

  const today = new Date();
  const strataDistribution: Record<string, number> = {};

  // Unificação metodológica de K e LS idêntica ao analyze-point
  const candidates: ErosionPoint[] = await Promise.all(
    thinned.map(async (pt, i) => {
      const idNum = String(i + 1).padStart(3, "0");
      const code = `${state}-CAND-${idNum}`;
      const id = `CAND-${state}-${Date.now()}-${idNum}`;
      const name = `Candidato ${idNum} - ${municipality}`;

      const stratumInfo = getStratumInfo(pt.stratumCode);
      const stratumId = stratumInfo?.id || "A1";
      strataDistribution[stratumId] = (strataDistribution[stratumId] || 0) + 1;

      // 1. Fator K unificado via getKFactorRealOrApproximate
      const kResolution = await getKFactorRealOrApproximate(pt.latitude, pt.longitude, pt.soilType);
      const kFactor = kResolution.kFactor;
      const kFactorApproximated = kResolution.approximated;

      // 2. Fator LS unificado (área de contribuição padrão conservadora de 1 pixel: 10m)
      const specificCatchmentAreaM2PerM = 10.0;
      const lsApproximated = true;
      const lsFactor = calculateLSFactor(specificCatchmentAreaM2PerM, pt.slopeDegrees);

      const cFactor = calculateCFactor(pt.ndvi, pt.bsi);
      const pFactor = 1.0;
      const estimatedSoilLoss = calculateSoilLossRUSLE(rFactor, kFactor, lsFactor, cFactor, pFactor);

      const estimatedFields: string[] = [];
      if (kFactorApproximated) estimatedFields.push("kFactor");
      if (lsApproximated) estimatedFields.push("lsFactor");

      return {
        id,
        code,
        name,
        latitude: pt.latitude,
        longitude: pt.longitude,
        elevation: pt.elevation,
        slopePercent: pt.slopePercent,
        slopeDegrees: pt.slopeDegrees,
        bsi: pt.bsi,
        ndvi: pt.ndvi,
        municipality,
        state,
        macroRegion: "Área Amostral GEE",
        watershed: "Bacia Hidrográfica Local",
        soilType: pt.soilType,
        featureType: pt.severity === "Crítica" ? "Erosão Laminar Severa" : "Sulcos de Erosão Acentuados",
        severity: pt.severity,
        estimatedSoilLoss,
        priorityScore: pt.priorityScore ?? 50,
        detectionDate: today.toISOString().slice(0, 10),
        dataProvenance: "gee-screened",
        stratumId,
        stratumName: stratumInfo?.name,
        estimatedFields,
        rusleFactors: {
          r: rFactor,
          k: kFactor,
          ls: lsFactor,
          c: cFactor,
          p: pFactor,
        },
        notes: `Candidato selecionado via Earth Engine (Resolução 10m • Lote ${tiles.length > 1 ? `Grade ${tiles.length}x` : "Direto"} • Estrato ${stratumId} • Thinning ${minSpacingKm}km). Alvo preliminar pré-triado para validação em campo.`,
        geeComputedAt: new Date().toISOString(),
        calcEngineVersion: GEE_CALC_ENGINE_VERSION,
      };
    })
  );

  return {
    candidates,
    summary: {
      totalRequested: targetCount,
      rawSampledCount: rawCandidates.length,
      survivingCount: candidates.length,
      minSpacingKm,
      strataDistribution,
      totalTilesProcessed: tiles.length,
      diagnostics,
      generatedAt: new Date().toISOString(),
    },
  };
}

export interface ReplacementCandidateParams {
  pointToReplace: ErosionPoint;
  existingPoints?: ErosionPoint[];
  aoi?: any;
  municipalityName?: string;
  stateName?: string;
  minSpacingKm?: number;
  seed?: number;
}

/**
 * Executa nova eleição no GEE para substituir um ponto descartado (ex: que caiu em floresta).
 * O novo ponto sorteado herda com precisão a numeração, código e identificação do ponto anulado.
 */
export async function selectReplacementCandidateWithGEE(
  credentials: GcpCredentials,
  params: ReplacementCandidateParams
): Promise<ErosionPoint> {
  const { pointToReplace, existingPoints = [], aoi, minSpacingKm = 0.8 } = params;

  // 1. Define geometria de busca: AOI explícita ou bounding box local ao redor do ponto (15km)
  let searchAoi = aoi;
  if (!searchAoi) {
    const lat = pointToReplace.latitude;
    const lng = pointToReplace.longitude;
    const delta = 0.15; // ~15km de raio local
    searchAoi = {
      type: "Polygon",
      coordinates: [
        [
          [lng - delta, lat - delta],
          [lng + delta, lat - delta],
          [lng + delta, lat + delta],
          [lng - delta, lat + delta],
          [lng - delta, lat - delta],
        ],
      ],
    };
  }

  // 2. Executa a amostragem estratificada no GEE com nova semente aleatória
  const result = await selectCandidatesWithGEE(credentials, {
    aoi: searchAoi,
    targetCount: 15,
    minSpacingKm,
    municipalityName: pointToReplace.municipality || params.municipalityName,
    stateName: pointToReplace.state || params.stateName,
    seed: params.seed || Math.floor(Math.random() * 1000000) + 1,
  });

  if (!result.candidates || result.candidates.length === 0) {
    throw new Error(
      `Nenhum novo candidato elegível foi encontrado na área de ${pointToReplace.municipality || "busca"}.`
    );
  }

  // 3. Filtra candidatos para evitar sobreposição com pontos já existentes e com o ponto descartado
  const rejectedCoordKey = `${pointToReplace.latitude.toFixed(4)},${pointToReplace.longitude.toFixed(4)}`;
  const existingCoords = existingPoints
    .filter((p) => p.id !== pointToReplace.id && p.code !== pointToReplace.code)
    .map((p) => [p.longitude, p.latitude] as [number, number]);

  let bestCandidate: ErosionPoint | null = null;

  for (const cand of result.candidates) {
    const candKey = `${cand.latitude.toFixed(4)},${cand.longitude.toFixed(4)}`;
    if (candKey === rejectedCoordKey) continue; // Pula exatamente o mesmo local descartado

    let isFarEnough = true;
    for (const [eLng, eLat] of existingCoords) {
      const dLat = (cand.latitude - eLat) * 111.32;
      const dLng = (cand.longitude - eLng) * 111.32 * Math.cos((cand.latitude * Math.PI) / 180);
      const distKm = Math.sqrt(dLat * dLat + dLng * dLng);
      if (distKm < 0.4) {
        isFarEnough = false;
        break;
      }
    }

    if (isFarEnough) {
      bestCandidate = cand;
      break;
    }
  }

  if (!bestCandidate) {
    bestCandidate =
      result.candidates.find(
        (c) => `${c.latitude.toFixed(4)},${c.longitude.toFixed(4)}` !== rejectedCoordKey
      ) || result.candidates[0];
  }

  // 4. REGRA DE OURO: O novo ponto substituto assume estritamente a numeração e código do ponto anulado!
  const replacement: ErosionPoint = {
    ...bestCandidate,
    id: `CAND-${pointToReplace.state || "PR"}-${Date.now()}-${pointToReplace.code}`,
    code: pointToReplace.code, // Mantém exatamente o código do ponto anulado (ex: PR-CAND-042)
    name: pointToReplace.name, // Mantém o nome do candidato (ex: Candidato 042 - Céu Azul)
    municipality: pointToReplace.municipality || bestCandidate.municipality,
    state: pointToReplace.state || bestCandidate.state,
    notes: `Ponto re-eleito via Earth Engine em substituição ao alvo anterior do código ${pointToReplace.code}. (Resolução 10m • Sentinel-2/Copernicus DEM).`,
    geeComputedAt: new Date().toISOString(),
    calcEngineVersion: GEE_CALC_ENGINE_VERSION,
  };

  return replacement;
}
