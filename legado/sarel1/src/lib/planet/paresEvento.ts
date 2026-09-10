/**
 * ============================================================================
 * Montagem de Pares e Trios de Evento PlanetScope — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * ESPECIFICAÇÃO FÍSICA (PLANEJAMENTO V3, §6.3):
 * 1. Resposta física da chuva no solo:
 *    - T-  (Antes):        Cena limpa mais próxima antes da chuva (1 a 5 dias antes).
 *    - T0  (0 a 2 dias):   Solo úmido -> detecta incisão, leques de deposição em sopé e turbidez.
 *    - T+  (7 a 15 dias):  Solo seco -> revela padrão espectral de redistribuição da perda laminar
 *                          (horizonte B exposto mais claro por óxidos de ferro).
 * 2. Requisito de Comparabilidade:
 *    - Mesmo sensor e geometria próxima;
 *    - Evitar falsa detecção por crescimento vegetativo da safra entre T- e T+.
 * 3. Script de Viabilidade:
 *    Contagem real de pares antes de comprometer o desenho da pesquisa.
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
  consumoCotaMensalPct: number; // Em relação a 2.400 km² úteis/mês
  ehViavel: boolean;
  motivosInviabilidade?: string;
}

/**
 * Diferença em dias entre duas datas ISO.
 */
function diferencaEmDias(dataA: string, dataB: string): number {
  const msPorDia = 1000 * 60 * 60 * 24;
  const tA = new Date(dataA).getTime();
  const tB = new Date(dataB).getTime();
  return Math.round((tB - tA) / msPorDia);
}

/**
 * Monta retrospectivamente o trio de evento (T-, T0, T+) para um evento erosivo.
 */
export function montarTrioEvento(
  dataChuva: string,
  volumeMm: number,
  i30: number | undefined,
  cenasDisponiveis: MetadadosCenaPlanet[]
): TrioEventoPlanet | null {
  // Filtra apenas cenas com alta fração limpa na AOI (>= 80%)
  const limpas = cenasDisponiveis.filter(c => c.fracaoLimpaAoiPct >= 80.0);

  // 1. T- : 1 a 5 dias antes da chuva
  const candidatasTMinus = limpas.filter(c => {
    const d = diferencaEmDias(c.dataAdquisicao.split("T")[0], dataChuva);
    return d >= 1 && d <= 5;
  });
  if (candidatasTMinus.length === 0) return null;
  // Escolhe a mais próxima do evento
  candidatasTMinus.sort((a, b) =>
    diferencaEmDias(b.dataAdquisicao, dataChuva) - diferencaEmDias(a.dataAdquisicao, dataChuva)
  );
  const tMinus = candidatasTMinus[0];

  // 2. T+ : 7 a 15 dias após a chuva (solo seco)
  const candidatasTPlus = limpas.filter(c => {
    const d = diferencaEmDias(dataChuva, c.dataAdquisicao.split("T")[0]);
    return d >= 7 && d <= 15;
  });
  if (candidatasTPlus.length === 0) return null;
  candidatasTPlus.sort((a, b) =>
    diferencaEmDias(dataChuva, a.dataAdquisicao) - diferencaEmDias(dataChuva, b.dataAdquisicao)
  );
  const tPlus = candidatasTPlus[0];

  // 3. T0 (Opcional, mas desejável): 0 a 2 dias após a chuva
  const candidatasT0 = limpas.filter(c => {
    const d = diferencaEmDias(dataChuva, c.dataAdquisicao.split("T")[0]);
    return d >= 0 && d <= 2;
  });
  const t0 = candidatasT0.length > 0 ? candidatasT0[0] : undefined;

  // Verificação de comparabilidade geométrica
  const diffZenital = Math.abs(tMinus.anguloZenital - tPlus.anguloZenital);
  const intervaloDias = diferencaEmDias(tMinus.dataAdquisicao, tPlus.dataAdquisicao);
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

/**
 * Script de Viabilidade: cruza eventos erosivos com arquivo Planet e dimensiona a cota.
 */
export function avaliarViabilidadeParesAOI(
  eventosChuva: { data: string; volumeMm: number; i30?: number }[],
  cenasNaAoi: MetadadosCenaPlanet[],
  numPontosAmostrais: number = 100,
  raioBufferMetros: number = 250
): RelatorioViabilidadePares {
  const triosEncontrados: TrioEventoPlanet[] = [];

  for (const ev of eventosChuva) {
    const trio = montarTrioEvento(ev.data, ev.volumeMm, ev.i30, cenasNaAoi);
    if (trio && trio.ehComparavel) {
      triosEncontrados.push(trio);
    }
  }

  const nTrios = triosEncontrados.length;
  const areaPorPontoTrioKm2 = calcularAreaBufferKm2(raioBufferMetros) * 2; // T- e T+ faturados (T0 opcional)
  const areaTotalEstimada = Number((nTrios * numPontosAmostrais * areaPorPontoTrioKm2).toFixed(2));

  // Teto mensal seguro: 2.400 km² (deixando 600 km² de contingência)
  const consumoPct = Number(((areaTotalEstimada / 2400.0) * 100).toFixed(1));
  const ehViavel = areaTotalEstimada <= 2400.0 && nTrios > 0;

  let motivo: string | undefined;
  if (nTrios === 0) {
    motivo = "Nenhum par de evento satisfaz os critérios de fração limpa UDM2 e comparabilidade na AOI.";
  } else if (!ehViavel) {
    motivo = `Área estimada de download (${areaTotalEstimada} km²) excede o teto mensal seguro de 2.400 km² (${consumoPct}% da cota). Reduzir o número de eventos ou o buffer.`;
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
