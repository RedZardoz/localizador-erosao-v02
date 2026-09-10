/**
 * ============================================================================
 * Ingestão de Precipitação Diária — CHIRPS (PPGTCA 2026)
 * ============================================================================
 *
 * PRODUTO: UCSB-CHG/CHIRPS/DAILY
 * Resolução: 0,05° (~5,5 km), cobertura quase-global 50°S a 50°N desde 1981.
 * Calibração: combinação de estimativas térmicas de infravermelho de satélite
 * com dados de estações pluviométricas de superfície (Funk et al., 2015).
 *
 * REGRA 8 (Verificado em 08/09/2026):
 * - Banda física no Earth Engine: "precipitation" (unidade: mm/dia).
 * - Sem valores nulos nas coordenadas do Paraná (cobertura total contínua).
 */

import { Proveniencia } from "@/types/proveniencia";

export const CHIRPS_COLECAO = "UCSB-CHG/CHIRPS/DAILY";
export const CHIRPS_BANDA = "precipitation";

export interface RegistroChuvaDiaria {
  data: string; // ISO YYYY-MM-DD
  precipitacaoMm: number;
}

/**
 * Calcula acumulados de chuva (30 e 90 dias) a partir de uma série diária.
 */
export function calcularAcumuladosChuva(serieDiaria: RegistroChuvaDiaria[]): {
  acum30d: number | null;
  acum90d: number | null;
  diasValidos: number;
} {
  if (!serieDiaria || serieDiaria.length === 0) {
    return { acum30d: null, acum90d: null, diasValidos: 0 };
  }

  // Ordena por data decrescente (mais recente primeiro)
  const ordenada = [...serieDiaria].sort((a, b) => b.data.localeCompare(a.data));

  const ultimos30 = ordenada.slice(0, 30);
  const ultimos90 = ordenada.slice(0, 90);

  const acum30 = ultimos30.length >= 25 // Exige pelo menos 25 dias observados
    ? Number(ultimos30.reduce((acc, r) => acc + r.precipitacaoMm, 0).toFixed(1))
    : null;

  const acum90 = ultimos90.length >= 75 // Exige pelo menos 75 dias observados
    ? Number(ultimos90.reduce((acc, r) => acc + r.precipitacaoMm, 0).toFixed(1))
    : null;

  return {
    acum30d: acum30,
    acum90d: acum90,
    diasValidos: serieDiaria.length,
  };
}

export function criarProvenienciaChirps(valor: number | null, detalhe: string): Proveniencia<number> {
  if (valor === null || isNaN(valor)) {
    return { estado: "indisponivel", motivo: "Série CHIRPS insuficiente ou fora da janela temporal." };
  }
  return {
    estado: "medido",
    valor,
    fonte: "CHIRPS Daily (UCSB-CHG/CHIRPS/DAILY)",
    adquiridoEm: new Date().toISOString().split("T")[0],
    detalhe,
  };
}
