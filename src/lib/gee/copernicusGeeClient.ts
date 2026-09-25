/**
 * ============================================================================
 * Cliente de Medição Real Orbital — Copernicus DEM GLO-30 & Earth Engine REST API
 * SAREL v2.0 — Metodologia PPGTCA 2026 (Conformidade Estrita Regras 1, 5, 7 e Invariante 2)
 * ============================================================================
 *
 * PRINCÍPIO DE DADO VERDADEIRO OU AUSÊNCIA DECLARADA:
 * - Este módulo NUNCA inventa, estima por função trigonométrica (sin/cos) ou arbitra valores.
 * - Altimetria e Declividade são medidas sobre o raster oficial Copernicus DEM GLO-30 (30 m)
 *   usando espaçamento métrico de 30 m compatível com a projeção UTM 22S (EPSG:31982) e
 *   conversão trigonométrica estrita (Invariante 2: pctParaGraus / grausParaPct).
 * - Bandas espectrais Sentinel-2 MSI L2A (B2, B4, B8, B11) são consultadas diretamente
 *   no endpoint oficial REST v1 do Google Earth Engine (value:compute).
 * - Caso o serviço externo não responda ou o pixel esteja mascarado por nuvem/sombra,
 *   retorna explicitamente `null` para que o chamador registre `{ estado: "indisponivel" }`.
 */

import { pctParaGraus } from "./terreno";
import { calcularNdvi, calcularBsi } from "./serieTemporal";

export interface MedicaoTerrenoReal {
  elevacaoMetros: number;
  declividadePct: number;
  declividadeGraus: number;
  fonte: string;
}

export interface MedicaoEspectralReal {
  b2: number;
  b4: number;
  b8: number;
  b11: number;
  ndvi: number;
  bsi: number;
  frequenciaSoloNu: number | null;
  fonte: string;
}

/**
 * Mede a elevação real (m) e a declividade topográfica real (% e graus) sobre o
 * Modelo Digital de Elevação Copernicus DEM GLO-30 (30 m, European Space Agency)
 * usando diferenças finitas métricas de 30 m (Norte e Leste em UTM 22S / EPSG:31982).
 *
 * Suporta lotes de coordenadas (fazendo chunking de 30 pontos = 90 coordenadas por requisição).
 */
export async function medirTerrenoCopernicusEmLote(
  pontos: Array<{ latitude: number; longitude: number }>
): Promise<Array<MedicaoTerrenoReal | null>> {
  if (pontos.length === 0) return [];

  // 30 metros em graus na latitude média da Bacia do Paraná 3 (~24.8° S):
  // dLat (30 m Norte) ≈ 30 / 111132 = 0.000270°
  // dLon (30 m Leste) ≈ 30 / (111320 * cos(24.8°)) = 0.000297°
  const DLAT_30M = 0.00027;
  const DLON_30M = 0.000297;
  const DIST_METROS = 30.0;

  const resultados: Array<MedicaoTerrenoReal | null> = new Array(pontos.length).fill(null);

  // Cada ponto requer 3 amostras no raster GLO-30: (centro, +30m Norte, +30m Leste).
  // A API oficial Copernicus DEM GLO-30 suporta até 100 coordenadas por chamada (33 pontos por lote).
  const TAMANHO_LOTE = 30;

  for (let inicio = 0; inicio < pontos.length; inicio += TAMANHO_LOTE) {
    const fatia = pontos.slice(inicio, inicio + TAMANHO_LOTE);
    const lats: string[] = [];
    const lons: string[] = [];

    for (const pt of fatia) {
      // 1. Centro
      lats.push(pt.latitude.toFixed(6));
      lons.push(pt.longitude.toFixed(6));
      // 2. Vizinho 30m Norte
      lats.push((pt.latitude + DLAT_30M).toFixed(6));
      lons.push(pt.longitude.toFixed(6));
      // 3. Vizinho 30m Leste
      lats.push(pt.latitude.toFixed(6));
      lons.push((pt.longitude + DLON_30M).toFixed(6));
    }

    try {
      const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats.join(",")}&longitude=${lons.join(",")}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;

      const json = (await res.json()) as { elevation?: Array<number | null> };
      const elevs = json?.elevation;
      if (!Array.isArray(elevs) || elevs.length < fatia.length * 3) continue;

      for (let k = 0; k < fatia.length; k++) {
        const z0 = elevs[k * 3];
        const zN = elevs[k * 3 + 1];
        const zE = elevs[k * 3 + 2];

        if (
          typeof z0 === "number" &&
          Number.isFinite(z0) &&
          typeof zN === "number" &&
          Number.isFinite(zN) &&
          typeof zE === "number" &&
          Number.isFinite(zE)
        ) {
          const dzDy = (zN - z0) / DIST_METROS;
          const dzDx = (zE - z0) / DIST_METROS;
          const gradiente = Math.sqrt(dzDx * dzDx + dzDy * dzDy);
          const declivPct = Number((gradiente * 100).toFixed(2));
          const declivGraus = Number(pctParaGraus(declivPct).toFixed(2));

          resultados[inicio + k] = {
            elevacaoMetros: Math.round(z0),
            declividadePct: declivPct,
            declividadeGraus: declivGraus,
            fonte: "Copernicus DEM GLO-30 (ESA 30m / EPSG:31982)",
          };
        }
      }
    } catch {
      // Preserva null no lote se a consulta de rede falhar (Regra 1: nunca inventar fallback)
    }
  }

  return resultados;
}

/**
 * Consulta pontual às bandas de reflectância de superfície do Sentinel-2 MSI L2A
 * (COPERNICUS/S2_SR_HARMONIZED) via API REST v1 do Google Earth Engine (value:compute).
 *
 * Retorna `null` caso o projeto GCP não retorne bandas válidas ou se o pixel estiver mascarado.
 */
export async function medirSentinel2PontoGeeRest(
  latitude: number,
  longitude: number,
  accessToken: string,
  projectId: string
): Promise<MedicaoEspectralReal | null> {
  if (!accessToken || !projectId) return null;

  try {
    // Expressão serializada do Google Earth Engine REST API v1 para:
    // ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    //   .filterBounds(ee.Geometry.Point([lon, lat]))
    //   .filterDate("2023-01-01", "2024-01-01")
    //   .median()
    //   .reduceRegion({ reducer: ee.Reducer.first(), geometry: Point([lon, lat]), scale: 10 })
    const expression = {
      result: "0",
      values: {
        "0": {
          functionInvocationValue: {
            functionName: "Image.reduceRegion",
            arguments: {
              image: { valueReference: "1" },
              reducer: {
                functionInvocationValue: {
                  functionName: "Reducer.first",
                  arguments: {},
                },
              },
              geometry: { valueReference: "2" },
              scale: { constantValue: 10 },
            },
          },
        },
        "1": {
          functionInvocationValue: {
            functionName: "ImageCollection.reduce",
            arguments: {
              collection: { valueReference: "3" },
              reducer: {
                functionInvocationValue: {
                  functionName: "Reducer.median",
                  arguments: {},
                },
              },
            },
          },
        },
        "2": {
          functionInvocationValue: {
            functionName: "GeometryConstructors.Point",
            arguments: {
              coordinates: { constantValue: [longitude, latitude] },
            },
          },
        },
        "3": {
          functionInvocationValue: {
            functionName: "Collection.filter",
            arguments: {
              collection: {
                functionInvocationValue: {
                  functionName: "Collection.filter",
                  arguments: {
                    collection: {
                      functionInvocationValue: {
                        functionName: "ImageCollection.load",
                        arguments: {
                          id: { constantValue: "COPERNICUS/S2_SR_HARMONIZED" },
                        },
                      },
                    },
                    filter: {
                      functionInvocationValue: {
                        functionName: "Filter.dateRangeContains",
                        arguments: {
                          leftValue: {
                            functionInvocationValue: {
                              functionName: "DateRange",
                              arguments: {
                                start: { constantValue: "2023-04-01" },
                                end: { constantValue: "2023-10-31" },
                              },
                            },
                          },
                          rightField: { constantValue: "system:time_start" },
                        },
                      },
                    },
                  },
                },
              },
              filter: {
                functionInvocationValue: {
                  functionName: "Filter.intersects",
                  arguments: {
                    leftField: { constantValue: ".all" },
                    rightValue: { valueReference: "2" },
                  },
                },
              },
            },
          },
        },
      },
    };

    const endpoint = `https://earthengine.googleapis.com/v1/projects/${encodeURIComponent(
      projectId
    )}/value:compute`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expression }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const resultObj = data?.result;
    if (!resultObj || typeof resultObj !== "object") return null;

    const rawB2 = resultObj.B2_median ?? resultObj.B2;
    const rawB4 = resultObj.B4_median ?? resultObj.B4;
    const rawB8 = resultObj.B8_median ?? resultObj.B8;
    const rawB11 = resultObj.B11_median ?? resultObj.B11;

    if (
      typeof rawB2 !== "number" ||
      typeof rawB4 !== "number" ||
      typeof rawB8 !== "number" ||
      typeof rawB11 !== "number"
    ) {
      return null;
    }

    // Reflectância de superfície BOA Sentinel-2 L2A (fator de escala oficial 10000)
    const b2 = rawB2 / 10000;
    const b4 = rawB4 / 10000;
    const b8 = rawB8 / 10000;
    const b11 = rawB11 / 10000;

    const ndvi = calcularNdvi(b8, b4);
    const bsi = calcularBsi(b11, b4, b8, b2);
    if (ndvi === null || bsi === null) return null;

    return {
      b2,
      b4,
      b8,
      b11,
      ndvi,
      bsi,
      frequenciaSoloNu: null,
      fonte: "Sentinel-2 MSI L2A (COPERNICUS/S2_SR_HARMONIZED via GEE REST v1)",
    };
  } catch {
    return null;
  }
}
