/**
 * ============================================================================
 * Ingestão de Intensidade Sub-horária — GPM IMERG (PPGTCA 2026)
 * ============================================================================
 *
 * PRODUTO: NASA/GPM_L3/IMERG_V06 (ou coleção operacional corrente)
 * Resolução Temporal: 30 minutos (semi-horária).
 * Resolução Espacial: 0,1° (~11 km).
 *
 * JUSTIFICATIVA CIENTÍFICA (PLANEJAMENTO V3, §5.3):
 * O termo de erosividade da USLE/RUSLE é o EI30 — produto da energia cinética total
 * pela intensidade máxima em 30 minutos (I30) (Wischmeier & Smith, 1978).
 * A climatologia mensal média não contém intensidade: 40 mm em 8 horas é uma chuva
 * mansa, enquanto 40 mm em 40 minutos é uma tempestade torrencial erosiva severa.
 * A resolução semi-horária do GPM IMERG permite capturar a taxa máxima I30.
 *
 * REGRA 8 (Verificado em 08/09/2026):
 * - Banda física no Earth Engine: "precipitationCal" (unidade: mm/h).
 * - Intervalo de amostragem por cena: 30 minutos.
 */

import { Proveniencia } from "@/types/proveniencia";

export const IMERG_COLECAO = "NASA/GPM_L3/IMERG_V06";
export const IMERG_BANDA = "precipitationCal";

export interface RegistroImergSemiHorario {
  timestamp: string; // ISO 8601
  taxaMmH: number;   // precipitationCal em mm/h
}

/**
 * Calcula o I30 máximo observado (taxa máxima em mm/h em qualquer janela de 30 min).
 */
export function extrairI30Maximo(registros: RegistroImergSemiHorario[]): number | null {
  if (!registros || registros.length === 0) return null;

  let maxTaxa = 0;
  let teveValido = false;

  for (const reg of registros) {
    if (Number.isFinite(reg.taxaMmH) && !isNaN(reg.taxaMmH)) {
      if (reg.taxaMmH > maxTaxa) {
        maxTaxa = reg.taxaMmH;
      }
      teveValido = true;
    }
  }

  return teveValido ? Number(maxTaxa.toFixed(1)) : null;
}

export function criarProvenienciaImerg(valor: number | null, detalhe: string): Proveniencia<number> {
  if (valor === null || isNaN(valor)) {
    return { estado: "indisponivel", motivo: "Registros semi-horários do GPM IMERG insuficientes na janela." };
  }
  return {
    estado: "medido",
    valor,
    fonte: "GPM IMERG Semi-Horário (NASA/GPM_L3/IMERG_V06)",
    adquiridoEm: new Date().toISOString().split("T")[0],
    detalhe,
  };
}
