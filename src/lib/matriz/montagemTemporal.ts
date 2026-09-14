/**
 * ============================================================================
 * Montagem de Preditores Multitemporais (Time-Series Stacking) ? SAREL
 * PPGTCA 2026 ? Pesquisa de Mestrado em Eros?o Laminar
 * ============================================================================
 *
 * ESPECIFICA??O METODOL?GICA (SE??O 4 E 6 DO PROJETO DE PESQUISA):
 * 1. Segrega??o Temporal Modelo D vs Modelo P (Decis?o D04):
 *    - MODELO D (Detec??o contempor?nea):
 *      S?rie temporal at? a data do evento / valida??o (t0).
 *      Mapeia o estado contempor?neo de degrada??o da fei??o.
 *    - MODELO P (Progn?stico Preditivo / Suscetibilidade Antecipada 6 a 12 meses):
 *      S?rie temporal encerrada antes da data do evento com Intervalo de Guarda (>= 12 meses).
 *      Elimina o vazamento temporal (data leakage), garantindo que o modelo prediga
 *      o risco futuro com base no hist?rico de manejo e vulnerabilidade f?sica pr?via.
 * 2. Time-Series Stacking com Lags Multitemporais:
 *    - Lags temporais de NDVI e BSI: t-12m (mesma safra no ano anterior), t-6m, t-3m.
 * 3. Estat?sticas Robustas e Harm?nicos:
 *    - Percentis (p10, p50, p90) de NDVI e BSI.
 *    - Tend?ncia de degrada??o linear no SWIR (B12).
 *    - Frequ?ncia multianual de solo exposto (E^).
 */

import { ObservacaoCena, calcularNdvi, calcularBsi, definirJanelasModelo, filtrarSeriePorJanela } from "../gee/serieTemporal";
import { analisarPersistenciaTemporal, DiagnosticoPersistencia } from "../gee/persistenciaTemporal";
import { ajustarHarmonicosBanda } from "../gee/harmonicos";
import { extrairMetricasSoloExposto } from "../gee/compostoSoloNu";

export interface PreditoresTemporaisPonto {
  tipoModelo: "D" | "P";
  janelaInicio: string;
  janelaFim: string;
  nObservacoesValidas: number;
  // Estat?sticas agregadas
  ndvi_p10: number | null;
  ndvi_p50: number | null;
  ndvi_p90: number | null;
  bsi_p50: number | null;
  frequenciaSoloNu: number;
  // Harm?nicos e tend?ncias
  tendenciaSwirB12: number | null;
  amplitudeAnualNdvi: number | null;
  // Lags temporais (Time-Series Stacking)
  lag_ndvi_t0: number | null;
  lag_ndvi_t3m: number | null;
  lag_ndvi_t6m: number | null;
  lag_ndvi_t12m: number | null;
  lag_bsi_t0: number | null;
  lag_bsi_t12m: number | null;
  // Regime fenol?gico derivado
  regimePersistencia: string;
}

export interface OpcoesMontagemTemporal {
  dataReferencia: string; // Data t0 (YYYY-MM-DD)
  intervaloGuardaMeses?: number; // Para Modelo P (Padr?o: 12 meses)
  duracaoJanelaAnos?: number;   // Padr?o: 3 anos
  limiarNdviSoloNu?: number;    // Padr?o: 0.40 (D10)
}

const TOLERANCIA_BUSCA_CENA_DIAS = 45;

function buscarCenaMaisProxima(
  cenasValidas: Array<{ data: string; dataMs: number; ndvi: number; bsi: number | null }>,
  alvoMs: number,
  toleranciaDias: number
): { ndvi: number; bsi: number | null } | null {
  let maisProxima: { ndvi: number; bsi: number | null } | null = null;
  let menorDif = toleranciaDias * 24 * 60 * 60 * 1000;

  for (const c of cenasValidas) {
    const dif = Math.abs(c.dataMs - alvoMs);
    if (dif < menorDif) {
      menorDif = dif;
      maisProxima = { ndvi: c.ndvi, bsi: c.bsi };
    }
  }

  return maisProxima;
}

/**
 * Monta o vetor completo de preditores temporais e lags para um ponto,
 * respeitando o isolamento entre Modelo D e Modelo P.
 */
export function montarPreditoresTemporais(
  cenas: ObservacaoCena[],
  tipoModelo: "D" | "P",
  opcoes: OpcoesMontagemTemporal
): PreditoresTemporaisPonto {
  const {
    dataReferencia,
    intervaloGuardaMeses = 12,
    duracaoJanelaAnos = 3,
    limiarNdviSoloNu = 0.40,
  } = opcoes;

  const guardaAnos = intervaloGuardaMeses / 12;
  const janelas = definirJanelasModelo(dataReferencia, guardaAnos, duracaoJanelaAnos);
  const janelaAtiva = tipoModelo === "D" ? janelas.modeloD : janelas.modeloP;

  // Filtrar cenas estritamente pertencentes ? janela permitida
  const cenasJanela = filtrarSeriePorJanela(cenas, janelaAtiva);
  const validas = cenasJanela
    .filter((c) => !c.nuvemSombra && c.b4 !== null && c.b8 !== null)
    .sort((a, b) => a.data.localeCompare(b.data));

  const nValidas = validas.length;

  if (nValidas === 0) {
    return {
      tipoModelo,
      janelaInicio: janelaAtiva.inicio,
      janelaFim: janelaAtiva.fim,
      nObservacoesValidas: 0,
      ndvi_p10: null,
      ndvi_p50: null,
      ndvi_p90: null,
      bsi_p50: null,
      frequenciaSoloNu: 0,
      tendenciaSwirB12: null,
      amplitudeAnualNdvi: null,
      lag_ndvi_t0: null,
      lag_ndvi_t3m: null,
      lag_ndvi_t6m: null,
      lag_ndvi_t12m: null,
      lag_bsi_t0: null,
      lag_bsi_t12m: null,
      regimePersistencia: "inconclusivo",
    };
  }

  // Perfis de NDVI e BSI
  const serieProcessada = validas.map((c) => {
    const ndvi = calcularNdvi(c.b8, c.b4)!;
    const bsi = calcularBsi(c.b11, c.b4, c.b8, c.b2);
    return {
      data: c.data,
      dataMs: new Date(c.data).getTime(),
      ndvi,
      bsi,
    };
  });

  const ndvis = serieProcessada.map((p) => p.ndvi).sort((a, b) => a - b);
  const bsis = serieProcessada
    .map((p) => p.bsi)
    .filter((v): v is number => v !== null && Number.isFinite(v))
    .sort((a, b) => a - b);

  const p10Idx = Math.floor(ndvis.length * 0.1);
  const p50Idx = Math.floor(ndvis.length * 0.5);
  const p90Idx = Math.floor(ndvis.length * 0.9);

  const ndvi_p10 = Number(ndvis[p10Idx].toFixed(4));
  const ndvi_p50 = Number(ndvis[p50Idx].toFixed(4));
  const ndvi_p90 = Number(ndvis[p90Idx].toFixed(4));
  const bsi_p50 = bsis.length > 0 ? Number(bsis[Math.floor(bsis.length * 0.5)].toFixed(4)) : null;

  // Frequ?ncia de solo nu (E^)
  const nSoloNu = ndvis.filter((v) => v < limiarNdviSoloNu).length;
  const frequenciaSoloNu = Number((nSoloNu / nValidas).toFixed(4));

  // Harm?nicos do SWIR B12 (tend?ncia de degrada??o)
  let tendenciaSwirB12: number | null = null;
  const coefSwir = ajustarHarmonicosBanda(cenasJanela, "b12");
  if (coefSwir.tendencia.estado === "modelado") {
    tendenciaSwirB12 = coefSwir.tendencia.valor;
  }

  // Harm?nicos do NDVI (amplitude sazonal de biomassa)
  let amplitudeAnualNdvi: number | null = null;
  const coefB8 = ajustarHarmonicosBanda(cenasJanela, "b8");
  if (coefB8.amplitudeAnual.estado === "modelado") {
    amplitudeAnualNdvi = coefB8.amplitudeAnual.valor;
  }

  // Time-Series Stacking: Lags a partir da data de corte da janela
  const dataCorteMs = new Date(janelaAtiva.fim).getTime();
  const ms3m = 90 * 24 * 60 * 60 * 1000;
  const ms6m = 180 * 24 * 60 * 60 * 1000;
  const ms12m = 365 * 24 * 60 * 60 * 1000;

  const obsT0 = buscarCenaMaisProxima(serieProcessada, dataCorteMs, TOLERANCIA_BUSCA_CENA_DIAS);
  const obsT3m = buscarCenaMaisProxima(serieProcessada, dataCorteMs - ms3m, TOLERANCIA_BUSCA_CENA_DIAS);
  const obsT6m = buscarCenaMaisProxima(serieProcessada, dataCorteMs - ms6m, TOLERANCIA_BUSCA_CENA_DIAS);
  const obsT12m = buscarCenaMaisProxima(serieProcessada, dataCorteMs - ms12m, TOLERANCIA_BUSCA_CENA_DIAS);

  // Diagn?stico de Persist?ncia Temporal
  const diag = analisarPersistenciaTemporal(cenasJanela, {
    limiarNdviSoloNu,
    limiarNdviDosselFechado: 0.65,
    limiarFreqDegradacao: 0.25,
  });

  return {
    tipoModelo,
    janelaInicio: janelaAtiva.inicio,
    janelaFim: janelaAtiva.fim,
    nObservacoesValidas: nValidas,
    ndvi_p10,
    ndvi_p50,
    ndvi_p90,
    bsi_p50,
    frequenciaSoloNu,
    tendenciaSwirB12,
    amplitudeAnualNdvi,
    lag_ndvi_t0: obsT0 ? obsT0.ndvi : null,
    lag_ndvi_t3m: obsT3m ? obsT3m.ndvi : null,
    lag_ndvi_t6m: obsT6m ? obsT6m.ndvi : null,
    lag_ndvi_t12m: obsT12m ? obsT12m.ndvi : null,
    lag_bsi_t0: obsT0 ? obsT0.bsi : null,
    lag_bsi_t12m: obsT12m ? obsT12m.bsi : null,
    regimePersistencia: diag.regime,
  };
}
