import type { PontoAmostral } from "@/types/ponto";
import type { Proveniencia } from "@/types/proveniencia";
import {
  DATA_PUBLICACAO_COPERNICUS_GLO30,
  DATA_PUBLICACAO_EMBRAPA_SOLOS_PR,
  extrairDataAquisicaoSentinel2,
} from "./metadadosColecoes";
import { LIMIAR_MINIMO_OBSERVACOES_D11 } from "./copernicusGeeClient";
import { classificarPontoEspectral } from "./amostragemBiofisica";
import { montarLinhaDeBaseRUSLE } from "@/lib/rusle/linhaDeBase";
import { toContextoFundiario } from "@/lib/fundiario/matcher";

export interface ParametrosConsolidacaoInspecao {
  point: PontoAmostral;
  terreno?: {
    medicao?: {
      elevacaoMetros: number;
      declividadePct: number;
      declividadeGraus: number;
      fonte: string;
    } | null;
    erro?: Error | string | null;
  };
  solo?: {
    dados?: any | null;
    erro?: Error | string | null;
  };
  fundiario?: {
    dados?: any | null;
    erro?: Error | string | null;
  };
  gee?: {
    medicaoS2?: any | null;
    erro?: Error | string | null;
  };
  dataConsultaAtual?: string;
}

export interface ResultadoConsolidacaoInspecao {
  ponto: PontoAmostral;
  avisos: string[];
}

export function consolidarInspecaoPonto(
  params: ParametrosConsolidacaoInspecao
): ResultadoConsolidacaoInspecao {
  const { point, terreno, solo, fundiario, gee } = params;
  const avisos: string[] = [];
  const dataConsultaAtual =
    params.dataConsultaAtual || new Date().toISOString().split("T")[0];

  // 1. Processamento Fundiário
  let contextoFundiario = point.fundiario;
  if (fundiario?.erro) {
    const msgErro =
      fundiario.erro instanceof Error
        ? fundiario.erro.message
        : String(fundiario.erro);
    avisos.push(`Falha na consulta fundiária: ${msgErro}`);

    contextoFundiario = {
      ...(point.fundiario ?? {
        consultadoEm: null,
        criterioAssociacao: null,
        codigoCar: null,
        titularMascarado: null,
        documentoMascarado: null,
        registroIncra: null,
        areaImovelHa: null,
        bases: { uf: "PR" },
      }),
      status: "erro-na-consulta",
      motivo: `Falha na consulta à base fundiária: ${msgErro}`,
      consultadoEm: dataConsultaAtual,
    };
  } else if (fundiario?.dados) {
    contextoFundiario = toContextoFundiario(fundiario.dados, "PR");
  }

  // 2. Processamento Embrapa Solos
  const soloRes = solo?.dados ?? null;
  let subOrdemProv: Proveniencia<string> = point.solo.subOrdem;
  let grandeGrupoProv: Proveniencia<string> = point.solo.grandeGrupo;
  let tipoUnidadeProv: Proveniencia<string> = point.solo.tipoUnidade;
  let erodibilidadeProveniencia: Proveniencia<string> =
    point.solo.erodibilidadeClasse;
  let confiancaPedologica: "alta" | "media" | "indisponivel" =
    point.solo.confiancaPedologica;

  if (solo?.erro) {
    const msgErro =
      solo.erro instanceof Error ? solo.erro.message : String(solo.erro);
    avisos.push(`Falha na consulta Embrapa Solos: ${msgErro}`);

    const provServicoIndisponivel: Proveniencia<string> = {
      estado: "indisponivel",
      causa: "servico-indisponivel",
      motivo: `Serviço Embrapa Solos indisponível: ${msgErro}`,
    };

    subOrdemProv = provServicoIndisponivel;
    grandeGrupoProv = provServicoIndisponivel;
    tipoUnidadeProv = provServicoIndisponivel;
    erodibilidadeProveniencia = provServicoIndisponivel;
    confiancaPedologica = "indisponivel";
  } else if (soloRes) {
    const compDominante = soloRes?.solo?.componentes?.[0];

    subOrdemProv = compDominante
      ? {
          estado: "medido",
          valor: compDominante.subOrdem,
          fonte: "Embrapa GeoInfo / SiBCS 2020 (geonode:parana_solos_20201105)",
          adquiridoEm: DATA_PUBLICACAO_EMBRAPA_SOLOS_PR,
          consultadoEm: dataConsultaAtual,
        }
      : point.solo.subOrdem;

    grandeGrupoProv = compDominante?.grandeGrupo
      ? {
          estado: "medido",
          valor: compDominante.grandeGrupo,
          fonte: "Embrapa GeoInfo / SiBCS 2020 (geonode:parana_solos_20201105)",
          adquiridoEm: DATA_PUBLICACAO_EMBRAPA_SOLOS_PR,
          consultadoEm: dataConsultaAtual,
        }
      : point.solo.grandeGrupo;

    tipoUnidadeProv = soloRes?.solo?.tipoUnidade
      ? {
          estado: "medido",
          valor: soloRes.solo.tipoUnidade,
          fonte: "Embrapa GeoInfo / SiBCS 2020 (geonode:parana_solos_20201105)",
          adquiridoEm: DATA_PUBLICACAO_EMBRAPA_SOLOS_PR,
          consultadoEm: dataConsultaAtual,
        }
      : point.solo.tipoUnidade;

    confiancaPedologica =
      soloRes?.solo?.confianca ?? point.solo.confiancaPedologica;

    erodibilidadeProveniencia = soloRes?.erodibilidade?.classe
      ? {
          estado: "tabelado",
          valor: soloRes.erodibilidade.classe,
          tabela:
            "Embrapa Solos - Levantamento Pedológico do Estado do Paraná (geonode:brasil_erodibilidade_solo)",
          chave: soloRes.erodibilidade.classe,
        }
      : point.solo.erodibilidadeClasse;
  }

  // 3. Processamento Terreno (Copernicus DEM)
  let elevacaoProv = point.terreno.elevacao;
  let declividadePctProv = point.terreno.declividadePct;
  let declividadeGrausProv = point.terreno.declividadeGraus;

  if (terreno?.erro) {
    const msgErro =
      terreno.erro instanceof Error ? terreno.erro.message : String(terreno.erro);
    avisos.push(`Falha na consulta de terreno Copernicus DEM: ${msgErro}`);

    const provServicoIndisponivelNum: Proveniencia<number> = {
      estado: "indisponivel",
      causa: "servico-indisponivel",
      motivo: `Serviço de elevação Copernicus DEM indisponível: ${msgErro}`,
    };
    elevacaoProv = provServicoIndisponivelNum;
    declividadePctProv = provServicoIndisponivelNum;
    declividadeGrausProv = provServicoIndisponivelNum;
  } else if (terreno?.medicao) {
    elevacaoProv = {
      estado: "medido",
      valor: terreno.medicao.elevacaoMetros,
      fonte: terreno.medicao.fonte,
      adquiridoEm: DATA_PUBLICACAO_COPERNICUS_GLO30,
      consultadoEm: dataConsultaAtual,
    };
    declividadePctProv = {
      estado: "medido",
      valor: terreno.medicao.declividadePct,
      fonte: terreno.medicao.fonte,
      adquiridoEm: DATA_PUBLICACAO_COPERNICUS_GLO30,
      consultadoEm: dataConsultaAtual,
    };
    declividadeGrausProv = {
      estado: "medido",
      valor: terreno.medicao.declividadeGraus,
      fonte: terreno.medicao.fonte,
      adquiridoEm: DATA_PUBLICACAO_COPERNICUS_GLO30,
      consultadoEm: dataConsultaAtual,
    };
  }

  // 4. Processamento GEE / Sentinel-2
  const medicaoS2 = gee?.medicaoS2 ?? null;
  const dataAquisicaoS2 =
    medicaoS2?.adquiridoEm ??
    extrairDataAquisicaoSentinel2({ cenas: point.rastreio?.cenas }) ??
    point.rastreio?.calculadoEm?.slice(0, 10) ??
    dataConsultaAtual;

  let ndviProveniencia = point.espectral?.ndvi;
  let bsiProveniencia = point.espectral?.bsi;

  if (gee?.erro) {
    const msgErro =
      gee.erro instanceof Error ? gee.erro.message : String(gee.erro);
    avisos.push(`Falha na consulta Google Earth Engine / Sentinel-2: ${msgErro}`);

    const provServicoIndisponivelNum: Proveniencia<number> = {
      estado: "indisponivel",
      causa: "servico-indisponivel",
      motivo: `Google Earth Engine indisponível: ${msgErro}`,
    };
    ndviProveniencia = provServicoIndisponivelNum;
    bsiProveniencia = provServicoIndisponivelNum;
  } else if (medicaoS2) {
    const motivoD11 = `Suficiência amostral insuficiente (${medicaoS2.nObservacoesValidas} < ${LIMIAR_MINIMO_OBSERVACOES_D11} observações válidas sem nuvem/sombra exigidas pela Decisão D11).`;

    ndviProveniencia = medicaoS2.insuficienteD11
      ? {
          estado: "indisponivel",
          causa: "insuficiente",
          motivo: motivoD11,
        }
      : {
          estado: "medido",
          valor: medicaoS2.ndvi,
          fonte: medicaoS2.fonte,
          adquiridoEm: dataAquisicaoS2,
          consultadoEm: dataConsultaAtual,
        };

    bsiProveniencia = medicaoS2.insuficienteD11
      ? {
          estado: "indisponivel",
          causa: "insuficiente",
          motivo: motivoD11,
        }
      : {
          estado: "medido",
          valor: medicaoS2.bsi,
          fonte: medicaoS2.fonte,
          adquiridoEm: dataAquisicaoS2,
          consultadoEm: dataConsultaAtual,
        };
  }

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
                    estado: "medido",
                    valor: medicaoS2.b2,
                    fonte: medicaoS2.fonte,
                    adquiridoEm: dataAquisicaoS2,
                    consultadoEm: dataConsultaAtual,
                  },
                  b4: {
                    estado: "medido",
                    valor: medicaoS2.b4,
                    fonte: medicaoS2.fonte,
                    adquiridoEm: dataAquisicaoS2,
                    consultadoEm: dataConsultaAtual,
                  },
                  b8: {
                    estado: "medido",
                    valor: medicaoS2.b8,
                    fonte: medicaoS2.fonte,
                    adquiridoEm: dataAquisicaoS2,
                    consultadoEm: dataConsultaAtual,
                  },
                  b11: {
                    estado: "medido",
                    valor: medicaoS2.b11,
                    fonte: medicaoS2.fonte,
                    adquiridoEm: dataAquisicaoS2,
                    consultadoEm: dataConsultaAtual,
                  },
                  b12: {
                    estado: "medido",
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
      elevacao: elevacaoProv,
      declividadePct: declividadePctProv,
      declividadeGraus: declividadeGrausProv,
    },
    solo: {
      ...point.solo,
      subOrdem: subOrdemProv,
      grandeGrupo: grandeGrupoProv,
      tipoUnidade: tipoUnidadeProv,
      confiancaPedologica,
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
                ...(ndviProveniencia && ndviProveniencia.estado !== "indisponivel"
                  ? { B8_p50: ndviProveniencia }
                  : {}),
              },
              frequenciaSoloNu:
                medicaoS2
                  ? medicaoS2.insuficienteD11
                    ? {
                        estado: "indisponivel",
                        causa: "insuficiente",
                        motivo: `Suficiência amostral insuficiente (${medicaoS2.nObservacoesValidas} < ${LIMIAR_MINIMO_OBSERVACOES_D11} observações válidas sem nuvem/sombra exigidas pela Decisão D11).`,
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
    fundiario: contextoFundiario,
  };

  return {
    ponto: pontoAtualizado,
    avisos,
  };
}
