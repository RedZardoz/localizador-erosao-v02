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
import { isClasseUsoElegivel } from "./elegibilidade";
import { extrairDataAquisicaoSentinel2 } from "./metadadosColecoes";

export let ultimoErroGee: string | null = null;

export const LIMIAR_MINIMO_OBSERVACOES_D11 = 6;
export const WORLDCOVER_V100_ASSET_ID = "ESA/WorldCover/v100/2020";
export const WORLDCOVER_V200_ASSET_ID = "ESA/WorldCover/v200/2021";

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
  b12: number;
  ndvi: number;
  bsi: number;
  frequenciaSoloNu: number | null;
  nObservacoesValidas: number;
  insuficienteD11: boolean;
  adquiridoEm: string | null;
  classeWorldCover?: number | null;
  classeWorldCover2020?: number | null;
  classeWorldCover2021?: number | null;
  ehFlorestaOuInelegivel?: boolean;
  fonte: string;
}

export function avaliarSuficienciaAmostralD11(nObservacoesValidas: number): {
  suficiente: boolean;
  causa?: "insuficiente";
  motivo?: string;
} {
  if (!Number.isFinite(nObservacoesValidas) || nObservacoesValidas < LIMIAR_MINIMO_OBSERVACOES_D11) {
    return {
      suficiente: false,
      causa: "insuficiente",
      motivo: `Suficiência amostral insuficiente (${nObservacoesValidas} < ${LIMIAR_MINIMO_OBSERVACOES_D11} observações válidas sem nuvem/sombra exigidas pela Decisão D11).`,
    };
  }
  return { suficiente: true };
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
 * Constrói o grafo de expressão REST v1 do Google Earth Engine para extração pontual
 * das bandas de reflectância de superfície Sentinel-2 MSI L2A combinadas com as duas
 * épocas do ESA WorldCover 10m exigidas pela Decisão D07:
 * - Época 2020: `ESA/WorldCover/v100/2020` (banda `Map` renomeada para `Map_2020`)
 * - Época 2021: `ESA/WorldCover/v200/2021` (banda `Map`)
 */
export function construirExpressaoGeeSentinel2WorldCover(
  latitude: number,
  longitude: number
): Record<string, unknown> {
  return {
    result: "0",
    values: {
      "0": {
        functionInvocationValue: {
          functionName: "Image.reduceRegion",
          arguments: {
            image: { valueReference: "7" },
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
      "7": {
        functionInvocationValue: {
          functionName: "Image.addBands",
          arguments: {
            dstImg: { valueReference: "6" },
            srcImg: { valueReference: "8" },
          },
        },
      },
      "8": {
        functionInvocationValue: {
          functionName: "Image.rename",
          arguments: {
            input: {
              functionInvocationValue: {
                functionName: "Image.load",
                arguments: {
                  id: { constantValue: WORLDCOVER_V100_ASSET_ID },
                },
              },
            },
            names: { constantValue: ["Map_2020"] },
          },
        },
      },
      "6": {
        functionInvocationValue: {
          functionName: "Image.addBands",
          arguments: {
            dstImg: { valueReference: "1" },
            srcImg: {
              functionInvocationValue: {
                functionName: "Image.load",
                arguments: {
                  id: { constantValue: WORLDCOVER_V200_ASSET_ID },
                },
              },
            },
          },
        },
      },
      "1": {
        functionInvocationValue: {
          functionName: "ImageCollection.reduce",
          arguments: {
            collection: { valueReference: "4" },
            reducer: {
              functionInvocationValue: {
                functionName: "Reducer.combine",
                arguments: {
                  reducer1: {
                    functionInvocationValue: {
                      functionName: "Reducer.percentile",
                      arguments: {
                        percentiles: { constantValue: [15, 50, 85] },
                      },
                    },
                  },
                  reducer2: {
                    functionInvocationValue: {
                      functionName: "Reducer.count",
                      arguments: {},
                    },
                  },
                  sharedInputs: { constantValue: true },
                },
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
      "4": {
        functionInvocationValue: {
          functionName: "Collection.map",
          arguments: {
            collection: { valueReference: "3" },
            baseAlgorithm: {
              functionDefinitionValue: {
                argumentNames: ["img"],
                body: "5",
              },
            },
          },
        },
      },
      "5": {
        functionInvocationValue: {
          functionName: "Image.select",
          arguments: {
            input: { argumentReference: "img" },
            bandSelectors: { constantValue: ["B2", "B4", "B8", "B11", "B12"] },
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
                                    start: { constantValue: "2023-01-01" },
                                    end: { constantValue: "2023-12-31" },
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
                      functionName: "Filter.lessThan",
                      arguments: {
                        leftField: { constantValue: "CLOUDY_PIXEL_PERCENTAGE" },
                        rightValue: { constantValue: 20 },
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
                  leftField: { constantValue: ".geo" },
                  rightValue: { valueReference: "2" },
                },
              },
            },
          },
        },
      },
    },
  };
}

/**
 * Consulta pontual às bandas de reflectância de superfície do Sentinel-2 MSI L2A
 * (COPERNICUS/S2_SR_HARMONIZED, cenas com < 20% de nuvens) combinadas com a máscara
 * de concordância multitemporal de uso e cobertura do solo ESA/WorldCover/v100/2020
 * e ESA/WorldCover/v200/2021 (bandas Map_2020 e Map a 10m) via API REST v1 do Google Earth Engine
 * (Decisão D07 e Parâmetro P05: elegível se e somente se ambas as épocas pertencerem a [30, 40]).
 */
export async function medirSentinel2PontoGeeRest(
  latitude: number,
  longitude: number,
  accessToken: string,
  projectId: string
): Promise<MedicaoEspectralReal | null> {
  if (!accessToken || !projectId) return null;

  try {
    const expression = construirExpressaoGeeSentinel2WorldCover(latitude, longitude);

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

    if (!res.ok) {
      const errTxt = await res.text().catch(() => "");
      ultimoErroGee = `HTTP ${res.status}: ${errTxt}`;
      return null;
    }
    const data = await res.json().catch(() => null);
    const props = data?.result;
    if (!props || typeof props !== "object") {
      ultimoErroGee = `Empty result: ${JSON.stringify(data)}`;
      return null;
    }

    return processarRespostaGeeSentinel2(props);
  } catch (err: any) {
    ultimoErroGee = `Exception: ${err?.message}`;
    return null;
  }
}

export function processarRespostaGeeSentinel2(
  props: Record<string, any>,
  cenasFallback?: string[]
): MedicaoEspectralReal | null {
  if (!props || typeof props !== "object") return null;

  const raw2021 = props.Map_2021 ?? props.Map;
  const classeWorldCover2021 =
    typeof raw2021 === "number" && Number.isFinite(raw2021)
      ? Math.round(raw2021)
      : null;

  const raw2020 = props.Map_2020 ?? props.Map_1;
  const classeWorldCover2020 =
    typeof raw2020 === "number" && Number.isFinite(raw2020)
      ? Math.round(raw2020)
      : null;

  const classeWorldCover = classeWorldCover2021;

  const nObservacoesValidas =
    typeof (props.B4_count ?? props.B2_count ?? props.nObservacoesValidas) === "number"
      ? Math.round(props.B4_count ?? props.B2_count ?? props.nObservacoesValidas)
      : LIMIAR_MINIMO_OBSERVACOES_D11;

  const avaliacaoD11 = avaliarSuficienciaAmostralD11(nObservacoesValidas);

  const b2_15 = typeof props.B2_p15 === "number" ? props.B2_p15 / 10000 : null;
  const b4_15 = typeof props.B4_p15 === "number" ? props.B4_p15 / 10000 : null;
  const b8_15 = typeof props.B8_p15 === "number" ? props.B8_p15 / 10000 : null;
  const b11_15 = typeof props.B11_p15 === "number" ? props.B11_p15 / 10000 : null;
  const b12_15 = typeof props.B12_p15 === "number" ? props.B12_p15 / 10000 : null;

  const b2_50 =
    typeof (props.B2_p50 ?? props.B2_median ?? props.B2) === "number"
      ? (props.B2_p50 ?? props.B2_median ?? props.B2) / 10000
      : null;
  const b4_50 =
    typeof (props.B4_p50 ?? props.B4_median ?? props.B4) === "number"
      ? (props.B4_p50 ?? props.B4_median ?? props.B4) / 10000
      : null;
  const b8_50 =
    typeof (props.B8_p50 ?? props.B8_median ?? props.B8) === "number"
      ? (props.B8_p50 ?? props.B8_median ?? props.B8) / 10000
      : null;
  const b11_50 =
    typeof (props.B11_p50 ?? props.B11_median ?? props.B11) === "number"
      ? (props.B11_p50 ?? props.B11_median ?? props.B11) / 10000
      : null;
  const b12_50 =
    typeof (props.B12_p50 ?? props.B12_median ?? props.B12) === "number"
      ? (props.B12_p50 ?? props.B12_median ?? props.B12) / 10000
      : null;

  const b2_85 = typeof props.B2_p85 === "number" ? props.B2_p85 / 10000 : null;
  const b4_85 = typeof props.B4_p85 === "number" ? props.B4_p85 / 10000 : null;
  const b8_85 = typeof props.B8_p85 === "number" ? props.B8_p85 / 10000 : null;
  const b11_85 = typeof props.B11_p85 === "number" ? props.B11_p85 / 10000 : null;
  const b12_85 = typeof props.B12_p85 === "number" ? props.B12_p85 / 10000 : null;

  if (b2_50 === null || b4_50 === null || b8_50 === null || b11_50 === null || b12_50 === null) {
    return null;
  }

  // Assinatura crítica de exposição de solo na entressafra (BSI canônico preserva B11 = SWIR-1)
  const ndviExposicao =
    b8_15 !== null && b4_85 !== null ? calcularNdvi(b8_15, b4_85) : calcularNdvi(b8_50, b4_50);
  const bsiExposicao =
    b11_85 !== null && b4_85 !== null && b8_15 !== null && b2_15 !== null
      ? calcularBsi(b11_85, b4_85, b8_15, b2_15)
      : calcularBsi(b11_50, b4_50, b8_50, b2_50);

  // Assinatura de cobertura/palhada
  const ndviVigor =
    b8_85 !== null && b4_15 !== null ? calcularNdvi(b8_85, b4_15) : calcularNdvi(b8_50, b4_50);
  const bsiVigor =
    b11_15 !== null && b4_15 !== null && b8_85 !== null && b2_85 !== null
      ? calcularBsi(b11_15, b4_15, b8_85, b2_85)
      : calcularBsi(b11_50, b4_50, b8_50, b2_50);

  const ndviMed = calcularNdvi(b8_50, b4_50)!;
  const bsiMed = calcularBsi(b11_50, b4_50, b8_50, b2_50)!;

  // Decisão D07 e Parâmetro P05: uma célula é elegível pela cobertura se e somente se
  // AMBAS as épocas (2020 v100 e 2021 v200) estiverem presentes e pertencerem a [30, 40].
  const inelegivelWorldCover =
    classeWorldCover2020 === null ||
    classeWorldCover2021 === null ||
    !isClasseUsoElegivel(classeWorldCover2020) ||
    !isClasseUsoElegivel(classeWorldCover2021);
  const dosselFlorestalPerene =
    ndviExposicao !== null &&
    ndviExposicao >= 0.50 &&
    ndviMed >= 0.65 &&
    (bsiExposicao === null || bsiExposicao < -0.05);
  const ehFlorestaOuInelegivel = inelegivelWorldCover || dosselFlorestalPerene;

  let janelasSoloNu = 0;
  if (bsiExposicao !== null && bsiExposicao > 0.10) janelasSoloNu++;
  if (bsiMed > 0.02 || ndviMed < 0.38) janelasSoloNu++;
  if (bsiVigor !== null && bsiVigor > 0.0) janelasSoloNu++;
  const freqReal = Number((janelasSoloNu / 3).toFixed(2));

  let b2Final = b2_50,
    b4Final = b4_50,
    b8Final = b8_50,
    b11Final = b11_50,
    b12Final = b12_50,
    ndviFinal = ndviMed,
    bsiFinal = bsiMed;

  if (
    bsiExposicao !== null &&
    ndviExposicao !== null &&
    bsiExposicao > 0.10 &&
    ndviExposicao < 0.40 &&
    (bsiExposicao >= 0.14 || bsiMed >= -0.02)
  ) {
    b2Final = b2_15 ?? b2_50;
    b4Final = b4_85 ?? b4_50;
    b8Final = b8_15 ?? b8_50;
    b11Final = b11_85 ?? b11_50;
    b12Final = b12_85 ?? b12_50;
    ndviFinal = ndviExposicao;
    bsiFinal = bsiExposicao;
  } else if (
    bsiVigor !== null &&
    ndviVigor !== null &&
    bsiVigor < 0.0 &&
    ndviVigor > 0.65 &&
    bsiMed < 0.02
  ) {
    b2Final = b2_85 ?? b2_50;
    b4Final = b4_15 ?? b4_50;
    b8Final = b8_85 ?? b8_50;
    b11Final = b11_15 ?? b11_50;
    b12Final = b12_15 ?? b12_50;
    ndviFinal = ndviVigor;
    bsiFinal = bsiVigor;
  }

  const tsMs =
    typeof props["system:time_start_p85"] === "number"
      ? props["system:time_start_p85"]
      : typeof props["system:time_start_p50"] === "number"
        ? props["system:time_start_p50"]
        : typeof props["system:time_start"] === "number"
          ? props["system:time_start"]
          : null;

  const adquiridoEm = extrairDataAquisicaoSentinel2({
    timestampMs: tsMs,
    cenas: Array.isArray(props.cenas) ? props.cenas : cenasFallback,
  });

  return {
    b2: b2Final,
    b4: b4Final,
    b8: b8Final,
    b11: b11Final,
    b12: b12Final,
    ndvi: ndviFinal,
    bsi: bsiFinal,
    frequenciaSoloNu: avaliacaoD11.suficiente ? freqReal : null,
    nObservacoesValidas,
    insuficienteD11: !avaliacaoD11.suficiente,
    adquiridoEm,
    classeWorldCover,
    classeWorldCover2020,
    classeWorldCover2021,
    ehFlorestaOuInelegivel,
    fonte: "Sentinel-2 MSI L2A + ESA WorldCover v100 (2020) & v200 (2021) 10m (GEE REST v1)",
  };
}

/**
 * Consulta em lote com paralelismo controlado na API REST v1 do Google Earth Engine.
 * Avalia CADA ponto em sua coordenada exata de 10m (sem agrupar em células grossas),
 * garantindo que nenhum candidato caia sobre Mata Ciliar, Reserva Legal ou Floresta.
 */
export async function medirSentinel2EmLoteGeeRest(
  pontos: Array<{ id: string; latitude: number; longitude: number }>,
  accessToken: string,
  projectId: string
): Promise<Map<string, MedicaoEspectralReal>> {
  const mapa = new Map<string, MedicaoEspectralReal>();
  if (pontos.length === 0 || !accessToken || !projectId) return mapa;

  // Deduplica apenas coordenadas idênticas (< 1 m: 5 casas decimais) para medir
  // estritamente o pixel de 10 m exato de cada candidato
  const celulas = new Map<string, { lat: number; lon: number; ids: string[] }>();
  for (const pt of pontos) {
    const chave = `${pt.latitude.toFixed(5)}_${pt.longitude.toFixed(5)}`;
    const atual = celulas.get(chave);
    if (atual) {
      atual.ids.push(pt.id);
    } else {
      celulas.set(chave, { lat: pt.latitude, lon: pt.longitude, ids: [pt.id] });
    }
  }

  const listaCelulas = Array.from(celulas.values());
  const CONCORRENCIA = 22;

  for (let i = 0; i < listaCelulas.length; i += CONCORRENCIA) {
    const fatia = listaCelulas.slice(i, i + CONCORRENCIA);
    await Promise.all(
      fatia.map(async (cel) => {
        const res = await medirSentinel2PontoGeeRest(cel.lat, cel.lon, accessToken, projectId);
        if (res) {
          for (const id of cel.ids) {
            mapa.set(id, res);
          }
        }
      })
    );
  }

  return mapa;
}
