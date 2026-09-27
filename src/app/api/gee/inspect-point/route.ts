import { NextRequest, NextResponse } from "next/server";
import { obterSessao, SAREL_SESSION_COOKIE } from "@/lib/seguranca/sessaoEfemera";
import { getGoogleAccessToken, EARTH_ENGINE_SCOPES } from "@/lib/gee/auth";
import {
  medirTerrenoCopernicusEmLote,
  medirSentinel2PontoGeeRest,
  LIMIAR_MINIMO_OBSERVACOES_D11,
  ultimoErroGee,
} from "@/lib/gee/copernicusGeeClient";
import {
  DATA_PUBLICACAO_COPERNICUS_GLO30,
  DATA_PUBLICACAO_EMBRAPA_SOLOS_PR,
  extrairDataAquisicaoSentinel2,
} from "@/lib/gee/metadadosColecoes";
import { queryEmbrapaSoil } from "@/lib/embrapa/embrapaSoilClient";
import { matchRuralProperty, toContextoFundiario } from "@/lib/fundiario/matcher";
import { classificarPontoEspectral } from "@/lib/gee/amostragemBiofisica";
import { montarLinhaDeBaseRUSLE } from "@/lib/rusle/linhaDeBase";
import type { PontoAmostral } from "@/types/ponto";

export const dynamic = "force-dynamic";

/**
 * Endpoint de Inspeção Pontual em Tempo Real — Conformidade Estrita Regras 1 a 9 SAREL.
 * Consulta exclusivamente fontes primárias oficiais para a coordenada exata (lat, lon):
 * 1. Copernicus DEM GLO-30 (ESA 30m / EPSG:31982) -> elevacao, declividadePct, declividadeGraus
 * 2. Embrapa GeoInfo OGC WMS (geonode:parana_solos_20201105 + geonode:brasil_erodibilidade_solo) -> SiBCS + K
 * 3. Google Earth Engine REST API v1 (COPERNICUS/S2_SR_HARMONIZED) -> B2, B4, B8, B11, NDVI, BSI
 * 4. Base Fundiária Oficial (SICAR / SIGEF / SNCR) -> matchRuralProperty
 * 5. Linha de Base RUSLE -> montarLinhaDeBaseRUSLE (respeitando Invariante 1 e Decisões D01, D13, D14, D15)
 *
 * ZERO DADOS SINTÉTICOS OU ESTIMADOS: Qualquer variável não retornada pela fonte oficial
 * permanece declarada com `{ estado: "indisponivel", causa: ... }`.
 */
export async function POST(request: NextRequest) {
  try {
    const point = (await request.json()) as PontoAmostral;
    if (
      !point ||
      typeof point.latitude !== "number" ||
      typeof point.longitude !== "number"
    ) {
      return NextResponse.json(
        { ok: false, error: "Coordenadas do ponto inválidas." },
        { status: 400 }
      );
    }

    const { latitude, longitude } = point;
    const dataConsultaAtual = new Date().toISOString().split("T")[0];

    const sessionId = request.cookies.get(SAREL_SESSION_COOKIE)?.value;
    const sessao = obterSessao(sessionId);

    // Dispara em paralelo as consultas reais às fontes primárias oficiais
    const [terrenoLote, soloRes, fundiarioRes, geeToken] = await Promise.all([
      medirTerrenoCopernicusEmLote([{ latitude, longitude }]),
      queryEmbrapaSoil(latitude, longitude).catch(() => null),
      point.fundiario?.status === "encontrado" && point.fundiario?.codigoCar
        ? Promise.resolve(null)
        : matchRuralProperty(latitude, longitude, "PR").catch(() => null),
      sessao?.gee
        ? getGoogleAccessToken(
            {
              client_email: sessao.gee.client_email,
              private_key: sessao.gee.private_key,
              token_uri: sessao.gee.token_uri,
            },
            EARTH_ENGINE_SCOPES
          ).catch(() => null)
        : Promise.resolve(null),
    ]);

    const medicaoTerreno = terrenoLote[0] ?? null;

    // Consulta espectral real ao Google Earth Engine REST v1 (se autenticado)
    let medicaoS2 = null;
    if (geeToken?.accessToken && sessao?.gee?.project_id) {
      medicaoS2 = await medirSentinel2PontoGeeRest(
        latitude,
        longitude,
        geeToken.accessToken,
        sessao.gee.project_id
      );
    }

    const compDominante = soloRes?.solo?.componentes?.[0];

    const erodibilidadeProveniencia = soloRes?.erodibilidade?.classe
      ? {
          estado: "tabelado" as const,
          valor: soloRes.erodibilidade.classe,
          tabela:
            "Embrapa Solos - Levantamento Pedológico do Estado do Paraná (geonode:brasil_erodibilidade_solo)",
          chave: soloRes.erodibilidade.classe,
        }
      : point.solo.erodibilidadeClasse;

    const dataAquisicaoS2 =
      medicaoS2?.adquiridoEm ??
      extrairDataAquisicaoSentinel2({ cenas: point.rastreio?.cenas }) ??
      point.rastreio?.calculadoEm?.slice(0, 10) ??
      dataConsultaAtual;

    const motivoD11 = medicaoS2
      ? `Suficiência amostral insuficiente (${medicaoS2.nObservacoesValidas} < ${LIMIAR_MINIMO_OBSERVACOES_D11} observações válidas sem nuvem/sombra exigidas pela Decisão D11).`
      : "";

    const ndviProveniencia = medicaoS2
      ? medicaoS2.insuficienteD11
        ? {
            estado: "indisponivel" as const,
            causa: "insuficiente" as const,
            motivo: motivoD11,
          }
        : {
            estado: "medido" as const,
            valor: medicaoS2.ndvi,
            fonte: medicaoS2.fonte,
            adquiridoEm: dataAquisicaoS2,
            consultadoEm: dataConsultaAtual,
          }
      : point.espectral?.ndvi;

    const bsiProveniencia = medicaoS2
      ? medicaoS2.insuficienteD11
        ? {
            estado: "indisponivel" as const,
            causa: "insuficiente" as const,
            motivo: motivoD11,
          }
        : {
            estado: "medido" as const,
            valor: medicaoS2.bsi,
            fonte: medicaoS2.fonte,
            adquiridoEm: dataAquisicaoS2,
            consultadoEm: dataConsultaAtual,
          }
      : point.espectral?.bsi;

    const ndviNum =
      ndviProveniencia && ndviProveniencia.estado !== "indisponivel"
        ? ndviProveniencia.valor
        : null;
    const bsiNum =
      bsiProveniencia && bsiProveniencia.estado !== "indisponivel"
        ? bsiProveniencia.valor
        : null;

    const classeAmostral =
      ndviNum !== null && bsiNum !== null
        ? classificarPontoEspectral(bsiNum, ndviNum)
        : point.classeAmostral;

    const pontoAtualizado: PontoAmostral = {
      ...point,
      origemSintetica: false,
      classeAmostral,
      espectral:
        ndviProveniencia && bsiProveniencia
          ? {
              ...point.espectral,
              ndvi: ndviProveniencia,
              bsi: bsiProveniencia,
              ...(medicaoS2 && !medicaoS2.insuficienteD11
                ? {
                    b2: {
                      estado: "medido" as const,
                      valor: medicaoS2.b2,
                      fonte: medicaoS2.fonte,
                      adquiridoEm: dataAquisicaoS2,
                      consultadoEm: dataConsultaAtual,
                    },
                    b4: {
                      estado: "medido" as const,
                      valor: medicaoS2.b4,
                      fonte: medicaoS2.fonte,
                      adquiridoEm: dataAquisicaoS2,
                      consultadoEm: dataConsultaAtual,
                    },
                    b8: {
                      estado: "medido" as const,
                      valor: medicaoS2.b8,
                      fonte: medicaoS2.fonte,
                      adquiridoEm: dataAquisicaoS2,
                      consultadoEm: dataConsultaAtual,
                    },
                    b11: {
                      estado: "medido" as const,
                      valor: medicaoS2.b11,
                      fonte: medicaoS2.fonte,
                      adquiridoEm: dataAquisicaoS2,
                      consultadoEm: dataConsultaAtual,
                    },
                    b12: {
                      estado: "medido" as const,
                      valor: medicaoS2.b12,
                      fonte: medicaoS2.fonte,
                      adquiridoEm: dataAquisicaoS2,
                      consultadoEm: dataConsultaAtual,
                    },
                  }
                : {}),
            }
          : point.espectral,
      terreno: {
        ...point.terreno,
        elevacao: medicaoTerreno
          ? {
              estado: "medido",
              valor: medicaoTerreno.elevacaoMetros,
              fonte: medicaoTerreno.fonte,
              adquiridoEm: DATA_PUBLICACAO_COPERNICUS_GLO30,
              consultadoEm: dataConsultaAtual,
            }
          : point.terreno.elevacao,
        declividadePct: medicaoTerreno
          ? {
              estado: "medido",
              valor: medicaoTerreno.declividadePct,
              fonte: medicaoTerreno.fonte,
              adquiridoEm: DATA_PUBLICACAO_COPERNICUS_GLO30,
              consultadoEm: dataConsultaAtual,
            }
          : point.terreno.declividadePct,
        declividadeGraus: medicaoTerreno
          ? {
              estado: "medido",
              valor: medicaoTerreno.declividadeGraus,
              fonte: medicaoTerreno.fonte,
              adquiridoEm: DATA_PUBLICACAO_COPERNICUS_GLO30,
              consultadoEm: dataConsultaAtual,
            }
          : point.terreno.declividadeGraus,
      },
      solo: {
        ordem: compDominante
          ? {
              estado: "medido",
              valor: compDominante.ordem,
              fonte: "Embrapa GeoInfo / SiBCS 2020 (geonode:parana_solos_20201105)",
              adquiridoEm: DATA_PUBLICACAO_EMBRAPA_SOLOS_PR,
              consultadoEm: dataConsultaAtual,
            }
          : point.solo.ordem,
        subOrdem: compDominante
          ? {
              estado: "medido",
              valor: compDominante.subOrdem,
              fonte: "Embrapa GeoInfo / SiBCS 2020 (geonode:parana_solos_20201105)",
              adquiridoEm: DATA_PUBLICACAO_EMBRAPA_SOLOS_PR,
              consultadoEm: dataConsultaAtual,
            }
          : point.solo.subOrdem,
        grandeGrupo: compDominante?.grandeGrupo
          ? {
              estado: "medido",
              valor: compDominante.grandeGrupo,
              fonte: "Embrapa GeoInfo / SiBCS 2020 (geonode:parana_solos_20201105)",
              adquiridoEm: DATA_PUBLICACAO_EMBRAPA_SOLOS_PR,
              consultadoEm: dataConsultaAtual,
            }
          : point.solo.grandeGrupo,
        tipoUnidade: soloRes?.solo?.tipoUnidade
          ? {
              estado: "medido",
              valor: soloRes.solo.tipoUnidade,
              fonte: "Embrapa GeoInfo / SiBCS 2020 (geonode:parana_solos_20201105)",
              adquiridoEm: DATA_PUBLICACAO_EMBRAPA_SOLOS_PR,
              consultadoEm: dataConsultaAtual,
            }
          : point.solo.tipoUnidade,
        confiancaPedologica:
          soloRes?.solo?.confianca ?? point.solo.confiancaPedologica,
        erodibilidadeClasse: erodibilidadeProveniencia,
      },
      temporal: {
        ...point.temporal,
        D: point.temporal?.D
          ? {
              ...point.temporal.D,
              serie: {
                ...point.temporal.D.serie,
                nObservacoesValidas: medicaoS2
                  ? {
                      ...point.temporal.D.serie.nObservacoesValidas,
                      B4: medicaoS2.nObservacoesValidas,
                      B11: medicaoS2.nObservacoesValidas,
                      B12: medicaoS2.nObservacoesValidas,
                    }
                  : point.temporal.D.serie.nObservacoesValidas,
                estatisticas: {
                  ...point.temporal.D.serie.estatisticas,
                  ...(ndviProveniencia ? { B8_p50: ndviProveniencia } : {}),
                },
                frequenciaSoloNu:
                  medicaoS2
                    ? medicaoS2.insuficienteD11
                      ? {
                          estado: "indisponivel",
                          causa: "insuficiente",
                          motivo: motivoD11,
                        }
                      : medicaoS2.frequenciaSoloNu !== null
                        ? {
                            estado: "medido",
                            valor: medicaoS2.frequenciaSoloNu,
                            fonte: medicaoS2.fonte,
                            adquiridoEm: dataAquisicaoS2,
                            consultadoEm: dataConsultaAtual,
                          }
                        : point.temporal.D.serie.frequenciaSoloNu
                    : point.temporal.D.serie.frequenciaSoloNu,
              },
            }
          : point.temporal?.D,
      },
      linhaDeBase: montarLinhaDeBaseRUSLE({
        ndviProveniencia: ndviProveniencia ?? null,
        bsiProveniencia: bsiProveniencia ?? null,
        erodibilidadeProveniencia: erodibilidadeProveniencia ?? null,
      }),
      fundiario: fundiarioRes
        ? toContextoFundiario(fundiarioRes, "PR")
        : point.fundiario,
    };

    return NextResponse.json({
      ok: true,
      ponto: pontoAtualizado,
      geeDebug: ultimoErroGee,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro na inspeção pontual." },
      { status: 500 }
    );
  }
}
