import { GcpCredentials } from "@/types/erosion";
import { GEE_CALC_ENGINE_VERSION, validateSlopePlausibility } from "./calcEngineVersion";

/**
 * ============================================================================
 * Cliente de Integração com Google Earth Engine (Node.js SDK Server-Side)
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * SERVIDOR EXTERNO ACESSADO:
 * - Google Earth Engine (GEE API - Google Cloud Platform)
 * - Autenticação: OAuth 2.0 JWT com Chave Privada RSA (Service Account)
 * - SDK: @google/earthengine
 *
 * COLEÇÕES E PRODUTOS DE SENSORIAMENTO REMOTO PROCESSADOS:
 * 1. Copernicus Sentinel-2 MSI Harmonized Level-2A (COPERNICUS/S2_SR_HARMONIZED)
 *    - Bandas: B12 (SWIR-2 2190nm), B8 (NIR 842nm), B4 (Red 665nm), B2 (Blue 490nm), SCL (Scene Classification)
 *    - Filtro de qualidade: Remoção de nuvens/sombras via banda SCL (README §2.1)
 *    - BSI: ((B12 + B4) - (B8 + B2)) / ((B12 + B4) + (B8 + B2)) (README §2.1.A)
 *    - NDVI: (B8 - B4) / (B8 + B4) (README §2.1.B)
 *
 * 2. Copernicus Global Digital Elevation Model (COPERNICUS/DEM/GLO30)
 *    - Resolução nativa 30m, reamostrado para 10m (README §2.2)
 *    - Elevação ortométrica [m] no referencial vertical SIRGAS 2000 / EGM96 (README §2.2.A)
 *    - Declividade topográfica calculada em projeção métrica EPSG:3857 (README §2.2.B)
 *
 * 3. WWF HydroSHEDS Flow Accumulation (WWF/HydroSHEDS/15ACC)
 *    - Resolução 15 arc-segundos (~450m)
 *    - Área de contribuição específica As [m²·m⁻¹] para o Fator LS da RUSLE (README §2.2.C)
 */

const { XMLHttpRequest } = require("xmlhttprequest");
if (!(global as any).XMLHttpRequest) {
  (global as any).XMLHttpRequest = XMLHttpRequest;
}
const ee = require("@google/earthengine");

export interface RealSatelliteVariables {
  /** Bare Soil Index [-1.0 a +1.0] (README §2.1.A) */
  bsi: number;
  /** Normalized Difference Vegetation Index [-1.0 a +1.0] (README §2.1.B) */
  ndvi: number;
  /** Altitude ortométrica em metros (README §2.2.A) */
  elevation: number;
  /** Declividade do terreno em graus [°] (README §2.2.B) */
  slopeDegrees: number;
  /** Declividade do terreno em porcentagem [%] (README §2.2.B) */
  slopePercent: number;
  /** Área de contribuição específica a montante As [m²·m⁻¹] (README §2.2.C) */
  specificCatchmentAreaM2PerM: number;
  /** Flag indicando se a área de contribuição do Fator LS usou HydroSHEDS ou pixel de 10m */
  lsApproximated: boolean;
  /** Identificador do produto Sentinel-2 L2A no catálogo Copernicus */
  sentinelSceneId: string;
  /** Data da aquisição da cena (YYYY-MM-DD) */
  sentinelSceneDate: string;
  /** Porcentagem de nuvens na cena Sentinel-2 [%] */
  cloudyPixelPercentage: number;
  /** Versão do motor de cálculo GEE para rastreabilidade de integridade */
  calcEngineVersion: string;
}

let initializedForProjectId: string | null = null;

/**
 * Inicializa a sessão com a API do Google Earth Engine utilizando a Service Account GCP.
 *
 * @param credentials - Credenciais da Service Account (project_id, client_email, private_key)
 * @returns Promessa resolvida quando a autenticação e o handshake forem bem-sucedidos.
 */
export function initializeEarthEngine(credentials: GcpCredentials): Promise<void> {
  if (initializedForProjectId === credentials.project_id) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const normalizedKey = credentials.private_key.includes("\\n")
      ? credentials.private_key.replace(/\\n/g, "\n")
      : credentials.private_key;

    ee.data.authenticateViaPrivateKey(
      { client_email: credentials.client_email, private_key: normalizedKey },
      () => {
        ee.initialize(
          null,
          null,
          () => {
            initializedForProjectId = credentials.project_id;
            resolve();
          },
          (err: any) => reject(new Error(`Falha ao inicializar o Earth Engine: ${err?.message || err}`)),
          null,
          credentials.project_id
        );
      },
      (err: any) => {
        initializedForProjectId = null;
        reject(new Error(`Falha na autenticação da Service Account junto ao Earth Engine: ${err?.message || err}`));
      }
    );
  });
}

/**
 * Aplica máscara de nuvens e sombras na cena Sentinel-2 L2A através da banda SCL.
 *
 * @param image - Imagem Sentinel-2 L2A do Earth Engine
 * @returns Imagem com pixels de nuvem e sombra mascarados (README §2.1).
 */
function maskS2Clouds(image: any) {
  const scl = image.select("SCL");
  // Classes SCL descartadas: 3 (sombra de nuvem), 8/9 (nuvem média/alta), 10 (cirrus), 11 (neve/gelo)
  const invalid = scl.eq(3).or(scl.eq(8)).or(scl.eq(9)).or(scl.eq(10)).or(scl.eq(11));
  return image.updateMask(invalid.not());
}

/**
 * Executa o cálculo pontual no Earth Engine, extraindo as variáveis físicas reais de satélite e DEM.
 *
 * @param credentials - Credenciais do Google Cloud para autenticação no GEE
 * @param lat - Latitude decimal do ponto (EPSG:4326)
 * @param lng - Longitude decimal do ponto (EPSG:4326)
 * @returns Promessa com todas as métricas espectrais e geomorfológicas extraídas na resolução nativa.
 */
export async function computeRealVariablesForPoint(
  credentials: GcpCredentials,
  lat: number,
  lng: number
): Promise<RealSatelliteVariables> {
  await initializeEarthEngine(credentials);

  const point = ee.Geometry.Point([lng, lat]);
  const today = new Date();
  const start = new Date(today.getTime() - 120 * 24 * 3600 * 1000);

  // 1. Sentinel-2 Harmonized L2A - Busca a melhor cena nos últimos 120 dias com cobertura do ponto
  const s2Collection = ee
    .ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(point)
    .filterDate(start.toISOString().slice(0, 10), today.toISOString().slice(0, 10))
    .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 40))
    .map(maskS2Clouds)
    .sort("CLOUDY_PIXEL_PERCENTAGE");

  const scene = s2Collection.first();

  // BSI: Bare Soil Index — README §2.1.A
  const bsi = scene
    .expression("((SWIR2 + RED) - (NIR + BLUE)) / ((SWIR2 + RED) + (NIR + BLUE))", {
      SWIR2: scene.select("B12"),
      RED: scene.select("B4"),
      NIR: scene.select("B8"),
      BLUE: scene.select("B2"),
    })
    .rename("BSI");

  // NDVI: Normalized Difference Vegetation Index — README §2.1.B
  const ndvi = scene.normalizedDifference(["B8", "B4"]).rename("NDVI");

  // DEM Copernicus GLO-30 & Declividade em Projeção Métrica — README §2.2.A e §2.2.B
  const dem = ee.ImageCollection("COPERNICUS/DEM/GLO30")
    .select("DEM")
    .mosaic()
    .setDefaultProjection("EPSG:3857", null, 30)
    .rename("ELEVATION");
  const slope = ee.Terrain.slope(dem).rename("SLOPE_DEG");

  const combined = ee.Image.cat([bsi, ndvi, dem, slope]);

  const sceneMetadata: any = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout na busca de metadados Sentinel-2 no Earth Engine (limite de 30s excedido)."));
    }, 30000);
    scene.toDictionary(["PRODUCT_ID", "system:time_start", "CLOUDY_PIXEL_PERCENTAGE"]).evaluate((result: any, error: any) => {
      clearTimeout(timer);
      if (error) reject(new Error(`Nenhuma cena Sentinel-2 utilizável encontrada para este ponto nos últimos 120 dias: ${error}`));
      else resolve(result);
    });
  });

  const pixelValues: any = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout na amostragem de pixels no Earth Engine (limite de 30s excedido)."));
    }, 30000);
    combined
      .reduceRegion({ reducer: ee.Reducer.first(), geometry: point, scale: 10, maxPixels: 1e9 })
      .evaluate((result: any, error: any) => {
        clearTimeout(timer);
        if (error) reject(new Error(`Falha ao amostrar pixels no Earth Engine: ${error}`));
        else resolve(result);
      });
  });

  if (pixelValues.BSI == null || pixelValues.SLOPE_DEG == null) {
    throw new Error("O Earth Engine retornou valores nulos para este ponto (fora de cobertura ou 100% sob nuvens).");
  }

  const rawSlopeDeg = Number(pixelValues.SLOPE_DEG);
  validateSlopePlausibility(rawSlopeDeg);

  // Fator LS: área de contribuição específica As via WWF HydroSHEDS Flow Accumulation — README §2.2.C
  let specificCatchmentAreaM2PerM = 10;
  let lsApproximated = true;
  try {
    const flowAcc = ee.Image("WWF/HydroSHEDS/15ACC").select("b1");
    const cellSizeMeters = 463;
    const accValue: any = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Timeout HydroSHEDS"));
      }, 10000);
      flowAcc
        .reduceRegion({ reducer: ee.Reducer.first(), geometry: point, scale: cellSizeMeters, maxPixels: 1e9 })
        .evaluate((result: any, error: any) => {
          clearTimeout(timer);
          error ? reject(error) : resolve(result);
        });
    });
    const accCells = accValue?.b1;
    if (typeof accCells === "number" && accCells >= 0) {
      const contributingAreaM2 = (accCells + 1) * cellSizeMeters * cellSizeMeters;
      specificCatchmentAreaM2PerM = contributingAreaM2 / cellSizeMeters;
      lsApproximated = false;
    }
  } catch {
    // Mantém fallback conservador padrão de 10m
  }

  return {
    bsi: Number(pixelValues.BSI.toFixed(3)),
    ndvi: Number((pixelValues.NDVI ?? 0).toFixed(3)),
    elevation: Math.round(pixelValues.ELEVATION ?? 0),
    slopeDegrees: Number(rawSlopeDeg.toFixed(2)),
    slopePercent: Number((Math.tan((rawSlopeDeg * Math.PI) / 180) * 100).toFixed(2)),
    specificCatchmentAreaM2PerM: Number(specificCatchmentAreaM2PerM.toFixed(1)),
    lsApproximated,
    sentinelSceneId: sceneMetadata?.PRODUCT_ID || "desconhecido",
    sentinelSceneDate: sceneMetadata?.["system:time_start"]
      ? new Date(sceneMetadata["system:time_start"]).toISOString().slice(0, 10)
      : "desconhecida",
    cloudyPixelPercentage: Number((sceneMetadata?.CLOUDY_PIXEL_PERCENTAGE ?? 0).toFixed(1)),
    calcEngineVersion: GEE_CALC_ENGINE_VERSION,
  };
}
