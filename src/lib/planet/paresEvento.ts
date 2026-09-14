/**
 * ============================================================================
 * Montagem de Pares e Trios de Evento PlanetScope — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * ESPECIFICAÇÃO FÍSICA (PLANO V3, §11.4-11.6):
 * 1. Resposta física da chuva no solo:
 *    - T-  (Pré-evento):   Cena limpa mais próxima antes da chuva (1 a 5 dias antes).
 *    - T0  (0 a 2 dias):   Solo úmido -> incisões, leques de deposição e turbidez.
 *    - T+  (7 a 15 dias):  Solo seco -> padrão espectral de redistribuição da perda laminar
 *                          (horizonte B exposto mais claro por óxidos).
 * 2. Requisito de Comparabilidade:
 *    - Mesmo sensor e geometria próxima (diferença zenital <= 10°).
 * 3. Script de Viabilidade:
 *    - Cruzamento de eventos com catálogo antes de comprometer cota.
 */

import { MetadadosCenaPlanet } from "./dataApi";
import { calcularAreaBufferKm2 } from "./quota";

export interface TrioEventoPlanet {
  eventoId: string;
  dataEventoChuva: string;
  volumeChuvaMm: number;
  i30MmH?: number;
  cenaTMinus: MetadadosCenaPlanet; // Pré-evento limpo
  cenaT0?: MetadadosCenaPlanet;    // Pós-imediato (0-2 dias)
  cenaTPlus: MetadadosCenaPlanet;  // Pós-secagem (7-15 dias)
  diasEntreTMinusETPlus: number;
  diferencaZenitalGraus: number;
  ehComparavel: boolean;
}

export interface RelatorioViabilidadePares {
  totalEventosErosivosAvaliados: number;
  totalParesCompletosEncontrados: number;
  areaTotalRecorteKm2: number;
  consumoCotaMensalPct: number;
  ehViavel: boolean;
  motivosInviabilidade?: string;
}

/**
 * Diferença em dias entre duas datas ISO YYYY-MM-DD.
 */
function diferencaEmDias(dataA: string, dataB: string): number {
  const msPorDia = 1000 * 60 * 60 * 24;
  const tA = new Date(dataA).getTime();
  const tB = new Date(dataB).getTime();
  return Math.round((tB - tA) / msPorDia);
}

/**
 * Monta retrospectivamente o trio de evento (T-, T0, T+) para um evento de chuva.
 */
export function montarTrioEvento(
  dataChuva: string,
  volumeMm: number,
  i30: number | undefined,
  cenasDisponiveis: MetadadosCenaPlanet[],
  minFracaoLimpaAoiPct: number // P06 (ex.: 80%)
): TrioEventoPlanet | null {
  // Filtra apenas cenas com fração limpa suficiente na AOI
  const limpas = cenasDisponiveis.filter((c) => c.fracaoLimpaAoiPct >= minFracaoLimpaAoiPct);

  // 1. T- : 1 a 5 dias antes da chuva
  const candidatasTMinus = limpas.filter((c) => {
    const dataCena = c.dataAdquisicao.split("T")[0];
    const d = diferencaEmDias(dataCena, dataChuva);
    return d >= 1 && d <= 5;
  });
  if (candidatasTMinus.length === 0) return null;

  // Mais próxima da chuva
  candidatasTMinus.sort((a, b) => {
    const dA = diferencaEmDias(a.dataAdquisicao.split("T")[0], dataChuva);
    const dB = diferencaEmDias(b.dataAdquisicao.split("T")[0], dataChuva);
    return dA - dB;
  });
  const tMinus = candidatasTMinus[0];

  // 2. T+ : 7 a 15 dias após a chuva (solo seco)
  const candidatasTPlus = limpas.filter((c) => {
    const dataCena = c.dataAdquisicao.split("T")[0];
    const d = diferencaEmDias(dataChuva, dataCena);
    return d >= 7 && d <= 15;
  });
  if (candidatasTPlus.length === 0) return null;

  candidatasTPlus.sort((a, b) => {
    const dA = diferencaEmDias(dataChuva, a.dataAdquisicao.split("T")[0]);
    const dB = diferencaEmDias(dataChuva, b.dataAdquisicao.split("T")[0]);
    return dA - dB;
  });
  const tPlus = candidatasTPlus[0];

  // 3. T0 (Opcional): 0 a 2 dias após a chuva
  const candidatasT0 = limpas.filter((c) => {
    const dataCena = c.dataAdquisicao.split("T")[0];
    const d = diferencaEmDias(dataChuva, dataCena);
    return d >= 0 && d <= 2;
  });
  const t0 = candidatasT0.length > 0 ? candidatasT0[0] : undefined;

  // Comparabilidade geométrica e temporal
  const diffZenital = Math.abs(tMinus.anguloZenital - tPlus.anguloZenital);
  const intervaloDias = diferencaEmDias(tMinus.dataAdquisicao.split("T")[0], tPlus.dataAdquisicao.split("T")[0]);
  const ehComparavel = diffZenital <= 10.0 && intervaloDias <= 20;

  return {
    eventoId: `EV-${dataChuva}`,
    dataEventoChuva: dataChuva,
    volumeChuvaMm: volumeMm,
    i30MmH: i30,
    cenaTMinus: tMinus,
    cenaT0: t0,
    cenaTPlus: tPlus,
    diasEntreTMinusETPlus: intervaloDias,
    diferencaZenitalGraus: Number(diffZenital.toFixed(1)),
    ehComparavel,
  };
}

export interface ParametrosViabilidade {
  numPontosAmostrais: number;
  raioBufferMetros: number; // D18 (ex.: 250m)
  tetoMensalSeguroKm2: number; // Ex.: 2.400 km²
  minFracaoLimpaAoiPct: number; // P06
}

/**
 * Script de Viabilidade: avalia se a quantidade de pares é suportável pelo orçamento da cota.
 */
export function avaliarViabilidadeParesAOI(
  eventosChuva: { data: string; volumeMm: number; i30?: number }[],
  cenasNaAoi: MetadadosCenaPlanet[],
  params: ParametrosViabilidade
): RelatorioViabilidadePares {
  const triosEncontrados: TrioEventoPlanet[] = [];

  for (const ev of eventosChuva) {
    const trio = montarTrioEvento(ev.data, ev.volumeMm, ev.i30, cenasNaAoi, params.minFracaoLimpaAoiPct);
    if (trio && trio.ehComparavel) {
      triosEncontrados.push(trio);
    }
  }

  const nTrios = triosEncontrados.length;
  // 2 recortes faturados por trio (T- e T+; T0 opcional/gratuito via Sentinel-1)
  const areaPorPontoTrioKm2 = calcularAreaBufferKm2(params.raioBufferMetros) * 2;
  const areaTotalEstimada = Number((nTrios * params.numPontosAmostrais * areaPorPontoTrioKm2).toFixed(2));

  const consumoPct = Number(((areaTotalEstimada / params.tetoMensalSeguroKm2) * 100).toFixed(1));
  const ehViavel = areaTotalEstimada <= params.tetoMensalSeguroKm2 && nTrios > 0;

  let motivo: string | undefined;
  if (nTrios === 0) {
    motivo = "Nenhum par de evento satisfaz os critérios de fração limpa UDM2 e comparabilidade na AOI.";
  } else if (!ehViavel) {
    motivo = `Área estimada de download (${areaTotalEstimada} km²) excede o teto seguro de ${params.tetoMensalSeguroKm2} km² (${consumoPct}% da cota).`;
  }

  return {
    totalEventosErosivosAvaliados: eventosChuva.length,
    totalParesCompletosEncontrados: nTrios,
    areaTotalRecorteKm2: areaTotalEstimada,
    consumoCotaMensalPct: consumoPct,
    ehViavel,
    motivosInviabilidade: motivo,
  };
}
