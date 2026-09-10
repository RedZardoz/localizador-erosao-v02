/**
 * ============================================================================
 * Ingestão de Intensidade Sub-horária — GPM IMERG (PPGTCA 2026)
 * ============================================================================
 *
 * PRODUTO: NASA/GPM_L3/IMERG_V06
 * Resolução Temporal: 30 minutos (semi-horária).
 * Resolução Espacial: 0,1° (~11 km).
 * Banda física no Earth Engine: "precipitationCal" (mm/h).
 *
 * Captura a taxa máxima semi-horária (I30 aproximado) na janela de interesse.
 */

import { Proveniencia } from "@/types/proveniencia";

export const IMERG_COLECAO = "NASA/GPM_L3/IMERG_V06";
export const IMERG_BANDA = "precipitationCal";

export interface RegistroImergSemiHorario {
  timestamp: string; // ISO 8601
  taxaMmH: number;   // precipitationCal em mm/h
}

/**
 * Calcula o I30 máximo observado (taxa máxima em mm/h em janelas semi-horárias).
 */
export function extrairI30Maximo(registros: RegistroImergSemiHorario[]): number | null {
  if (!registros || registros.length === 0) return null;

  let maxTaxa = 0;
  let teveValido = false;

  for (const reg of registros) {
    if (Number.isFinite(reg.taxaMmH)) {
      if (reg.taxaMmH > maxTaxa) {
        maxTaxa = reg.taxaMmH;
      }
      teveValido = true;
    }
  }

  return teveValido ? Number(maxTaxa.toFixed(1)) : null;
}

export function criarProvenienciaImerg(
  valor: number | null,
  detalhe: string,
  adquiridoEm = new Date().toISOString().split("T")[0]
): Proveniencia<number> {
  if (valor === null || !Number.isFinite(valor)) {
    return {
      estado: "indisponivel",
      causa: "insuficiente",
      motivo: "Registros semi-horários do GPM IMERG insuficientes na janela temporal.",
    };
  }

  return {
    estado: "medido",
    valor,
    fonte: IMERG_COLECAO,
    adquiridoEm,
    consultadoEm: new Date().toISOString(),
    detalhe,
  };
}
