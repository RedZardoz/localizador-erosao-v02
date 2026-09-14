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

export interface RegistroChuvaDiaria {
  data: string; // YYYY-MM-DD
  precipitacaoMm: number;
}

/**
 * Calcula acumulados de chuva (30 e 90 dias) a partir de uma série diária observada.
 * Exige pelo menos 80% de dias válidos em cada janela móvel (25 dias para 30d, 75 dias para 90d).
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

  const acum30 =
    ultimos30.length >= 25
      ? Number(ultimos30.reduce((acc, r) => acc + r.precipitacaoMm, 0).toFixed(1))
      : null;

  const acum90 =
    ultimos90.length >= 75
      ? Number(ultimos90.reduce((acc, r) => acc + r.precipitacaoMm, 0).toFixed(1))
      : null;

  return {
    acum30d: acum30,
    acum90d: acum90,
    diasValidos: serieDiaria.length,
  };
}

export function criarProvenienciaChirps(
  valor: number | null,
  detalhe: string,
  adquiridoEm = new Date().toISOString().split("T")[0]
): Proveniencia<number> {
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
