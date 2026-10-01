/**
 * ============================================================================
 * Amostragem de Solo Nu em Lote via Earth Engine REST API (C3)
 * SAREL v2.0 — Disciplina Pericial PPGTCA 2026 (Decisões D07, D10, D11, D12, D16)
 * ============================================================================
 *
 * OTIMIZAÇÃO DE CUSTO E TEMPO (REGRA C3):
 * - Substitui a amostragem ponto a ponto (680 chamadas REST) por imagem reduzida
 *   composta amostrada em blocos (~100 pontos por chamada REST v1 `value:compute`
 *   com `Image.reduceRegions`).
 * - Redução do tráfego de rede em >95% e diminuição drástica do tempo de parede.
 * - Cache local determinístico persistente indexado por:
 *   `${candidatoId}@lat=${lat},lon=${lon}@def=${hash}`
 * - Invalidação automática quando a definição espectral/temporal é alterada.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { isClasseUsoElegivel } from "./elegibilidade";
import { WORLDCOVER_V100_ASSET_ID, WORLDCOVER_V200_ASSET_ID } from "./copernicusGeeClient";
import { Proveniencia, medido, indisponivel, valorOuNulo } from "../../types/proveniencia";
import { DiarioRequisicoes, registrarChamadaDiario } from "../seguranca/diarioRequisicoes";

export const DEFINICAO_METRICA_SOLO_NU =
  "s2_sr_harmonized_2016_2026_ndvi_lt_0.25_worldcover_v100_v200";

export const ASSET_SENTINEL2_SR = "COPERNICUS/S2_SR_HARMONIZED";
export const LIMIAR_NDVI_SOLO_NU_D10 = 0.25;
export const TAMANHO_BLOCO_PADRAO = 100;

export interface PontoAmostragemSoloNu {
  id: string;
  latitude: number;
  longitude: number;
}

export interface MedicaoSoloNuLote {
  id: string;
  latitude: number;
  longitude: number;
  frequenciaSoloNu: Proveniencia<number>; // Fração de cenas válidas com solo nu [0, 1] ou indisponível
  nObservacoes: number;
  classeWorldCover2020: number | null;
  classeWorldCover2021: number | null;
  ehElegivelUso: boolean; // Ambas em [30, 40]
  fonte: string;
  chaveCache: string;
}

export interface CacheFrequenciaSoloNuArquivo {
  versao: string;
  definicao: string;
  hashDefinicao: string;
  atualizadoEm: string;
  totalItens: number;
  itens: Record<string, MedicaoSoloNuLote>;
}

export interface MetricasExecucaoLote {
  totalPontos: number;
  cacheHits: number;
  cacheMisses: number;
  requisicoesHttp: number;
  tempoTotalMs: number;
  requisicoesEvitadas: number;
  reducaoRequisicoesPct: number;
  pontosIndisponiveis: number;
}

export interface OpcoesAmostragemSoloNuLote {
  tamanhoBloco?: number;
  caminhoCache?: string;
  ignorarCache?: boolean;
  salvarCache?: boolean;
  timeoutMs?: number;
  diario?: DiarioRequisicoes;
}

/**
 * Calcula o hash determinístico SHA-256 da definição metodológica da métrica.
 */
export function calcularHashDefinicao(definicao: string = DEFINICAO_METRICA_SOLO_NU): string {
  return crypto.createHash("sha256").update(definicao.trim()).digest("hex").slice(0, 16);
}

/**
 * Constrói a chave canônica de cache para um candidato.
 */
export function gerarChaveCacheSoloNu(
  id: string,
  latitude: number,
  longitude: number,
  hashDefinicao: string = calcularHashDefinicao()
): string {
  const latStr = latitude.toFixed(5);
  const lonStr = longitude.toFixed(5);
  return `${id}@lat=${latStr},lon=${lonStr}@def=${hashDefinicao}`;
}

/**
 * Retorna o caminho canônico do arquivo de cache de solo nu da BP3.
 */
export function obterCaminhoPadraoCacheFrequenciaSoloNu(): string {
  return path.resolve(process.cwd(), "docs/verificacoes/cache_frequencia_solo_nu_bp3.json");
}

/**
 * Carrega o cache local persistente de frequência de solo nu.
 * Invalida e descarta automaticamente o cache se a definição do método divergir.
 */
export function carregarCacheFrequenciaSoloNu(
  caminhoArquivo?: string
): CacheFrequenciaSoloNuArquivo | null {
  const arquivo = caminhoArquivo || obterCaminhoPadraoCacheFrequenciaSoloNu();
  if (!fs.existsSync(arquivo)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(arquivo, "utf8");
    const parsed = JSON.parse(raw) as CacheFrequenciaSoloNuArquivo;

    const hashEsperado = calcularHashDefinicao();
    if (parsed.hashDefinicao !== hashEsperado) {
      // Invalidação automática por mudança de definição metodológica
      return null;
    }

    if (!parsed.itens || typeof parsed.itens !== "object") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Salva o cache de frequência de solo nu no disco com formatação legível para auditoria.
 */
export function salvarCacheFrequenciaSoloNu(
  cache: CacheFrequenciaSoloNuArquivo,
  caminhoArquivo?: string
): void {
  const arquivo = caminhoArquivo || obterCaminhoPadraoCacheFrequenciaSoloNu();
  const dir = path.dirname(arquivo);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const payload: CacheFrequenciaSoloNuArquivo = {
    ...cache,
    hashDefinicao: calcularHashDefinicao(cache.definicao || DEFINICAO_METRICA_SOLO_NU),
    atualizadoEm: new Date().toISOString(),
    totalItens: Object.keys(cache.itens).length,
  };

  fs.writeFileSync(arquivo, JSON.stringify(payload, null, 2), "utf8");
}

/**
 * Constrói o grafo de expressão AST do Google Earth Engine REST v1
 * para executar `Image.reduceRegions` sobre um bloco de pontos.
 */
export function construirExpressaoGeeSoloNuLote(
  pontos: PontoAmostragemSoloNu[]
): Record<string, unknown> {
  const featuresGeoJson = pontos.map((pt, idx) => ({
    type: "Feature",
    id: String(idx),
    geometry: {
      type: "Point",
      coordinates: [pt.longitude, pt.latitude],
    },
    properties: {
      ponto_id: pt.id,
      latitude: pt.latitude,
      longitude: pt.longitude,
    },
  }));

  return {
    result: "0",
    values: {
      "0": {
        functionInvocationValue: {
          functionName: "Image.reduceRegions",
          arguments: {
            image: { valueReference: "img_composta" },
            collection: { valueReference: "features_pontos" },
            reducer: {
              functionInvocationValue: {
                functionName: "Reducer.first",
                arguments: {},
              },
            },
            scale: { constantValue: 10 },
          },
        },
      },
      features_pontos: {
        functionInvocationValue: {
          functionName: "FeatureCollection",
          arguments: {
            features: {
              constantValue: featuresGeoJson,
            },
          },
        },
      },
      img_composta: {
        functionInvocationValue: {
          functionName: "Image.addBands",
          arguments: {
            dstImg: { valueReference: "img_com_worldcover_2021" },
            srcImg: { valueReference: "img_worldcover_2020" },
          },
        },
      },
      img_worldcover_2020: {
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
      img_com_worldcover_2021: {
        functionInvocationValue: {
          functionName: "Image.addBands",
          arguments: {
            dstImg: { valueReference: "img_solo_nu_reduzida" },
            srcImg: {
              functionInvocationValue: {
                functionName: "Image.rename",
                arguments: {
                  input: {
                    functionInvocationValue: {
                      functionName: "Image.load",
                      arguments: {
                        id: { constantValue: WORLDCOVER_V200_ASSET_ID },
                      },
                    },
                  },
                  names: { constantValue: ["Map_2021"] },
                },
              },
            },
          },
        },
      },
      img_solo_nu_reduzida: {
        functionInvocationValue: {
          functionName: "ImageCollection.reduce",
          arguments: {
            collection: { valueReference: "colecao_mascaras_solo_nu" },
            reducer: {
              functionInvocationValue: {
                functionName: "Reducer.combine",
                arguments: {
                  reducer1: {
                    functionInvocationValue: {
                      functionName: "Reducer.mean",
                      arguments: {},
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
      colecao_mascaras_solo_nu: {
        functionInvocationValue: {
          functionName: "Collection.map",
          arguments: {
            collection: { valueReference: "colecao_filtrada_s2" },
            baseAlgorithm: {
              functionDefinitionValue: {
                argumentNames: ["img"],
                body: "calcula_solo_nu_binario",
              },
            },
          },
        },
      },
      calcula_solo_nu_binario: {
        functionInvocationValue: {
          functionName: "Image.rename",
          arguments: {
            input: {
              functionInvocationValue: {
                functionName: "Image.lt",
                arguments: {
                  image1: {
                    functionInvocationValue: {
                      functionName: "Image.normalizedDifference",
                      arguments: {
                        input: { argumentReference: "img" },
                        bandNames: { constantValue: ["B8", "B4"] },
                      },
                    },
                  },
                  image2: {
                    functionInvocationValue: {
                      functionName: "Image.constant",
                      arguments: { value: { constantValue: LIMIAR_NDVI_SOLO_NU_D10 } },
                    },
                  },
                },
              },
            },
            names: { constantValue: ["solo_nu"] },
          },
        },
      },
      colecao_filtrada_s2: {
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
                      arguments: { id: { constantValue: ASSET_SENTINEL2_SR } },
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
                              start: { constantValue: "2016-01-01" },
                              end: { constantValue: "2026-06-30" },
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
    },
  };
}

/**
 * Converte a resposta GeoJSON FeatureCollection de `Image.reduceRegions`
 * em mapa de medições indexado pelo ID do candidato.
 */
export function processarRespostaGeeReduceRegions(
  respostaJson: any,
  pontosOriginais: PontoAmostragemSoloNu[]
): Map<string, MedicaoSoloNuLote> {
  const resultado = new Map<string, MedicaoSoloNuLote>();
  const mapaOriginais = new Map(pontosOriginais.map((p) => [p.id, p]));

  const features =
    respostaJson?.result?.features ||
    respostaJson?.features ||
    (Array.isArray(respostaJson) ? respostaJson : []);

  const hashDef = calcularHashDefinicao();

  for (const feat of features) {
    const props = feat?.properties || {};
    const pontoId = props.ponto_id || feat?.id || props.id;
    if (!pontoId) continue;

    const pontoOriginal = mapaOriginais.get(pontoId);
    const lat = pontoOriginal ? pontoOriginal.latitude : Number(props.latitude ?? feat?.geometry?.coordinates?.[1]);
    const lon = pontoOriginal ? pontoOriginal.longitude : Number(props.longitude ?? feat?.geometry?.coordinates?.[0]);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const rawCount = props.solo_nu_count ?? props.count ?? props.n_observacoes;
    const nObservacoes = typeof rawCount === "number" && Number.isFinite(rawCount) ? Math.round(rawCount) : 0;

    const rawSoloNu = props.solo_nu_mean ?? props.solo_nu ?? props.frequenciaSoloNu;
    let freqNuProv: Proveniencia<number>;

    if (rawSoloNu && typeof rawSoloNu === "object" && "estado" in rawSoloNu) {
      freqNuProv = rawSoloNu as Proveniencia<number>;
    } else if (typeof rawSoloNu === "number" && Number.isFinite(rawSoloNu)) {
      const clamped = Number(Math.max(0, Math.min(1, rawSoloNu)).toFixed(4)); // permitido: clamp de seguranca numerica para fracao normalizada de satelite no intervalo 0 a 1
      freqNuProv = medido(
        clamped,
        "GEE REST v1 reduceRegions (S2_SR_HARMONIZED)",
        "2016-2026",
        new Date().toISOString(),
        `reduceRegions first(solo_nu_mean), nObservacoes=${nObservacoes}`
      );
    } else {
      freqNuProv = indisponivel(
        "insuficiente",
        "Sem observações válidas ou pixel sem dado para cálculo de frequência de solo nu"
      );
    }

    const raw2020 = props.Map_2020 ?? props.classeWorldCover2020;
    const classeWorldCover2020 =
      typeof raw2020 === "number" && Number.isFinite(raw2020) ? Math.round(raw2020) : null;

    const raw2021 = props.Map_2021 ?? props.Map ?? props.classeWorldCover2021;
    const classeWorldCover2021 =
      typeof raw2021 === "number" && Number.isFinite(raw2021) ? Math.round(raw2021) : null;

    const ehElegivelUso =
      classeWorldCover2020 !== null &&
      classeWorldCover2021 !== null &&
      isClasseUsoElegivel(classeWorldCover2020) &&
      isClasseUsoElegivel(classeWorldCover2021);

    const chaveCache = gerarChaveCacheSoloNu(pontoId, lat, lon, hashDef);

    resultado.set(pontoId, {
      id: pontoId,
      latitude: lat,
      longitude: lon,
      frequenciaSoloNu: freqNuProv,
      nObservacoes,
      classeWorldCover2020,
      classeWorldCover2021,
      ehElegivelUso,
      fonte: "GEE REST v1 reduceRegions (S2_SR_HARMONIZED)",
      chaveCache,
    });
  }

  return resultado;
}

/**
 * Amostragem de Frequência de Solo Nu em Lote via Earth Engine REST API.
 * Aplica cacheamento persistente e particionamento em blocos de até 100 pontos.
 */
export async function medirFrequenciaSoloNuEmLoteGeeRest(
  pontos: PontoAmostragemSoloNu[],
  credenciais: { accessToken: string; projectId: string } | null,
  opcoes?: OpcoesAmostragemSoloNuLote
): Promise<{ resultados: Map<string, MedicaoSoloNuLote>; metricas: MetricasExecucaoLote }> {
  const inicioWallClock = performance.now();
  const tamanhoBloco = typeof opcoes?.tamanhoBloco === "number" ? opcoes.tamanhoBloco : TAMANHO_BLOCO_PADRAO;
  const caminhoCache = opcoes?.caminhoCache || obterCaminhoPadraoCacheFrequenciaSoloNu();
  const ignorarCache = Boolean(opcoes?.ignorarCache);
  const salvarAoFinal = opcoes?.salvarCache !== false;
  const timeoutMs = typeof opcoes?.timeoutMs === "number" ? opcoes.timeoutMs : 30000; // permitido: timeout de rede de requisicao http em milissegundos para conexao gee

  const resultados = new Map<string, MedicaoSoloNuLote>();
  let cacheAtual: CacheFrequenciaSoloNuArquivo | null = null;
  let cacheHits = 0;
  let cacheMisses = 0;
  let requisicoesHttp = 0;

  const hashDef = calcularHashDefinicao();

  if (!ignorarCache) {
    cacheAtual = carregarCacheFrequenciaSoloNu(caminhoCache);
  }

  if (!cacheAtual) {
    cacheAtual = {
      versao: "2.0",
      definicao: DEFINICAO_METRICA_SOLO_NU,
      hashDefinicao: hashDef,
      atualizadoEm: new Date().toISOString(),
      totalItens: 0,
      itens: {},
    };
  }

  const pontosParaConsultar: PontoAmostragemSoloNu[] = [];

  for (const pt of pontos) {
    const chave = gerarChaveCacheSoloNu(pt.id, pt.latitude, pt.longitude, hashDef);
    const itemEmCache = cacheAtual.itens[chave];

    if (itemEmCache && !ignorarCache) {
      resultados.set(pt.id, itemEmCache);
      cacheHits++;
    } else {
      pontosParaConsultar.push(pt);
      cacheMisses++;
    }
  }

  let houveAtualizacaoCache = false;

  // Se houver pontos pendentes e credenciais NÃO fornecidas, declara-os como indisponíveis (P12)
  if (pontosParaConsultar.length > 0 && (!credenciais?.accessToken || !credenciais?.projectId)) {
    for (const pt of pontosParaConsultar) {
      const chave = gerarChaveCacheSoloNu(pt.id, pt.latitude, pt.longitude, hashDef);
      resultados.set(pt.id, {
        id: pt.id,
        latitude: pt.latitude,
        longitude: pt.longitude,
        frequenciaSoloNu: indisponivel(
          "servico-indisponivel",
          "Credenciais GEE não configuradas (SAREL_GEE_SERVICE_ACCOUNT_FILE ausente)"
        ),
        nObservacoes: 0,
        classeWorldCover2020: null,
        classeWorldCover2021: null,
        ehElegivelUso: false,
        fonte: "GEE REST v1 (sem credencial)",
        chaveCache: chave,
      });
    }
  } else if (pontosParaConsultar.length > 0 && credenciais?.accessToken && credenciais?.projectId) {
    // Executa em blocos via REST com credencial real
    for (let i = 0; i < pontosParaConsultar.length; i += tamanhoBloco) {
      const lote = pontosParaConsultar.slice(i, i + tamanhoBloco);
      const expr = construirExpressaoGeeSoloNuLote(lote);

      const endpoint = `https://earthengine.googleapis.com/v1/projects/${encodeURIComponent(
        credenciais.projectId
      )}/value:compute`;

      requisicoesHttp++;
      const inicioReq = performance.now();
      let res: Response | null = null;
      let textoResposta = "";
      let bytesResposta = 0;
      let statusHttp = 0;

      try {
        res = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credenciais.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ expression: expr }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        statusHttp = res.status;
        textoResposta = await res.text();
        bytesResposta = Buffer.byteLength(textoResposta, "utf8");
      } catch {
        statusHttp = 0;
      }

      const duracaoReq = Math.round(performance.now() - inicioReq);

      if (opcoes?.diario) {
        registrarChamadaDiario(opcoes.diario, {
          timestampIso: new Date().toISOString(),
          servico: "GEE",
          endpoint,
          metodoHttp: "POST",
          quantidadeItens: lote.length,
          tamanhoRespostaBytes: bytesResposta,
          codigoHttp: statusHttp,
          duracaoMs: duracaoReq,
        });
      }

      if (res && res.ok && textoResposta) {
        try {
          const dados = JSON.parse(textoResposta);
          const processados = processarRespostaGeeReduceRegions(dados, lote);

          for (const [id, med] of processados.entries()) {
            resultados.set(id, med);
            cacheAtual.itens[med.chaveCache] = med;
            houveAtualizacaoCache = true;
          }
        } catch {
          // Erro de parse de JSON
        }
      }

      // Pontos que não receberam resultado nesta chamada são marcados como indisponíveis
      for (const pt of lote) {
        if (!resultados.has(pt.id)) {
          const chave = gerarChaveCacheSoloNu(pt.id, pt.latitude, pt.longitude, hashDef);
          resultados.set(pt.id, {
            id: pt.id,
            latitude: pt.latitude,
            longitude: pt.longitude,
            frequenciaSoloNu: indisponivel(
              "servico-indisponivel",
              `Falha na requisição HTTP GEE REST (status ${statusHttp})`
            ),
            nObservacoes: 0,
            classeWorldCover2020: null,
            classeWorldCover2021: null,
            ehElegivelUso: false,
            fonte: "GEE REST v1",
            chaveCache: chave,
          });
        }
      }
    }
  }

  if (houveAtualizacaoCache && salvarAoFinal) {
    salvarCacheFrequenciaSoloNu(cacheAtual, caminhoCache);
  }

  const fimWallClock = performance.now();
  const tempoTotalMs = Math.round(fimWallClock - inicioWallClock);
  const totalPontos = pontos.length;
  const requisicoesEvitadas = Math.max(0, totalPontos - requisicoesHttp); // permitido: metrica contavel de requisicoes http poupadas no processamento em lote
  const reducaoRequisicoesPct =
    totalPontos > 0 ? Number(((requisicoesEvitadas / totalPontos) * 100).toFixed(1)) : 0;

  let pontosIndisponiveis = 0;
  for (const med of resultados.values()) {
    if (med.frequenciaSoloNu.estado === "indisponivel") {
      pontosIndisponiveis++;
    }
  }

  return {
    resultados,
    metricas: {
      totalPontos,
      cacheHits,
      cacheMisses,
      requisicoesHttp,
      tempoTotalMs,
      requisicoesEvitadas,
      reducaoRequisicoesPct,
      pontosIndisponiveis,
    },
  };
}
