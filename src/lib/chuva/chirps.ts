/**
 * ============================================================================
 * Ingestão e Processamento de Chuva Diária — CHIRPS (PPGTCA 2026)
 * ============================================================================
 *
 * PRODUTO: UCSB-CHG/CHIRPS/DAILY
 * - Resolução espacial: 0,05° (~5,5 km), banda: "precipitation" (mm/dia).
 * - Cobertura temporal contínua e sem falhas no Paraná.
 * - REGRA 1: Sem valores inventados. Se faltarem observações na janela, retorna null.
 */

import { Proveniencia } from "@/types/proveniencia";

export const CHIRPS_COLECAO = "UCSB-CHG/CHIRPS/DAILY";
export const CHIRPS_BANDA = "precipitation";
export const CHIRPS_NODATA_SENTINEL = -9999.0;
export const CHIRPS_LIMIAR_NODATA = -9000.0;

export interface RegistroChuvaDiaria {
  data: string; // YYYY-MM-DD
  precipitacaoMm: number;
}

/**
 * Calcula acumulados de chuva (30 e 90 dias) a partir de uma série diária observada.
 * Acumulados por janela [dataRef − 30 d, dataRef] e [dataRef − 90 d, dataRef] com contagem
 * de dias distintos (N17 / M14). Descarte valores <= -9000 e não-finitos.
 * Exige pelo menos 80% de dias válidos em cada janela móvel (25 dias para 30d, 75 dias para 90d).
 */
export function calcularAcumuladosChuva(
  serieDiaria: RegistroChuvaDiaria[],
  dataReferencia?: string
): {
  acum30d: number | null;
  acum90d: number | null;
  diasValidos: number;
} {
  if (!serieDiaria || serieDiaria.length === 0) {
    return { acum30d: null, acum90d: null, diasValidos: 0 };
  }

  // Filtrar valores válidos (descartar <= -9000 e não-finitos) e agrupar por dia (YYYY-MM-DD)
  const mapaDias = new Map<string, number>();
  for (const r of serieDiaria) {
    if (
      typeof r.precipitacaoMm === "number" &&
      Number.isFinite(r.precipitacaoMm) &&
      r.precipitacaoMm > CHIRPS_LIMIAR_NODATA &&
      r.data
    ) {
      const dia = r.data.split("T")[0];
      const anterior = mapaDias.get(dia);
      mapaDias.set(dia, anterior !== undefined ? anterior + r.precipitacaoMm : r.precipitacaoMm);
    }
  }

  if (mapaDias.size === 0) {
    return { acum30d: null, acum90d: null, diasValidos: 0 };
  }

  const diasOrdenados = Array.from(mapaDias.keys()).sort();
  const dataRefStr = dataReferencia ? dataReferencia.split("T")[0] : diasOrdenados[diasOrdenados.length - 1];

  const parseUtcDia = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };

  const refMs = parseUtcDia(dataRefStr);
  const msPorDia = 86400000;

  // Janela móvel de 30 e 90 dias de calendário terminando em dataRef (inclusive):
  const inicio30Ms = refMs - 30 * msPorDia;
  const inicio90Ms = refMs - 90 * msPorDia;

  let soma30 = 0;
  let contagem30 = 0;
  let soma90 = 0;
  let contagem90 = 0;

  for (const [dia, prec] of mapaDias.entries()) {
    const diaMs = parseUtcDia(dia);
    if (diaMs > inicio30Ms && diaMs <= refMs) {
      soma30 += prec;
      contagem30++;
    }
    if (diaMs > inicio90Ms && diaMs <= refMs) {
      soma90 += prec;
      contagem90++;
    }
  }

  const acum30 = contagem30 >= 25 ? Number(soma30.toFixed(1)) : null;
  const acum90 = contagem90 >= 75 ? Number(soma90.toFixed(1)) : null;

  return {
    acum30d: acum30,
    acum90d: acum90,
    diasValidos: mapaDias.size,
  };
}

export function criarProvenienciaChirps(
  valor: number | null,
  detalhe: string,
  adquiridoEm: string
): Proveniencia<number> {
  if (!adquiridoEm) {
    return {
      estado: "indisponivel",
      causa: "data-da-fonte-desconhecida",
      motivo: "Data de aquisição da fonte CHIRPS desconhecida (DEC-9).",
    };
  }

  if (valor === null || !Number.isFinite(valor)) {
    return {
      estado: "indisponivel",
      causa: "insuficiente",
      motivo: "Série diária CHIRPS com número insuficiente de observações na janela temporal.",
    };
  }

  return {
    estado: "medido",
    valor,
    fonte: CHIRPS_COLECAO,
    adquiridoEm,
    consultadoEm: new Date().toISOString(),
    detalhe,
  };
}


export interface RegistroMesChirps {
  ano: number;
  mes: number; // 1 a 12
  precipitacaoMm: number | null;
}

export interface ClimatologiaEstacaoProcessada {
  mesesEsperados: number;
  mesesValidos: number;
  mesesNoData: number;
  listaMesesNoData: string[];
  climatologiaMensalMediaMm: (number | null)[];
  precipitacaoMediaAnualMm: number | null;
}

/**
 * Processa uma série histórica mensal do CHIRPS com tratamento estrito de NoData (P12).
 * Ausência de dado (sentinela <= -9000, null ou NaN) propaga compulsoriamente como ausência e JAMAIS como 0.0 mm.
 * Médias mensais Jan..Dez são calculadas exclusivamente sobre os meses válidos observados.
 */
export function processarClimatologiaMensalChirps(
  registros: RegistroMesChirps[]
): ClimatologiaEstacaoProcessada {
  const listaMesesNoData: string[] = [];
  const validosPorMes: number[][] = Array.from({ length: 12 }, () => []);

  let mesesValidos = 0;
  let mesesNoData = 0;

  for (const reg of registros) {
    if (
      reg.precipitacaoMm === null ||
      Number.isNaN(reg.precipitacaoMm) ||
      reg.precipitacaoMm <= CHIRPS_LIMIAR_NODATA
    ) {
      mesesNoData++;
      listaMesesNoData.push(`${reg.ano}-${String(reg.mes).padStart(2, "0")}`);
    } else {
      mesesValidos++;
      const idxMes = reg.mes - 1;
      if (idxMes >= 0 && idxMes < 12) {
        validosPorMes[idxMes].push(reg.precipitacaoMm);
      }
    }
  }


  const climatologiaMensalMediaMm = validosPorMes.map((vals) => {
    if (vals.length === 0) return null;
    const soma = vals.reduce((acc, v) => acc + v, 0);
    return Number((soma / vals.length).toFixed(2));
  });

  const temMesIncompleto = climatologiaMensalMediaMm.some((m) => m === null);
  const precipitacaoMediaAnualMm = temMesIncompleto
    ? null
    : Number(
        (climatologiaMensalMediaMm as number[])
          .reduce((acc, v) => acc + v, 0)
          .toFixed(2)
      );


  return {
    mesesEsperados: registros.length,
    mesesValidos,
    mesesNoData,
    listaMesesNoData,
    climatologiaMensalMediaMm,
    precipitacaoMediaAnualMm,
  };
}

