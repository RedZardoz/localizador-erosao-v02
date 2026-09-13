/**
 * ============================================================================
 * Classificação e Limiares Biofísicos Espectrais — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * METODOLOGIA OFICIAL DA PESQUISA (Mestrado PPGTCA 2026, Seção 3.1):
 * - Ponto Classe 1 (Erosão Laminar): BSI > 0.10 e NDVI < 0.40
 * - Ponto Classe 0 (Controle / SPD): BSI < 0.00 e NDVI > 0.65
 * - Fora destes intervalos: Classe "indefinido" (amostra de transição)
 *
 * REGRAS INVIOLÁVEIS (LEI FUNDAMENTAL):
 * - Sem valores fabricados. Se BSI ou NDVI forem nulos ou indefinidos, retorna "indefinido".
 * - Sem truncamento forçado ou suposições sobre dados ausentes.
 */

import type { ClasseAmostral } from "@/types/ponto";

export const CRITERIOS_ESPECTRAIS = {
  EROSAO: {
    BSI_MIN: 0.10,
    NDVI_MAX: 0.40,
    rotulo: "Erosão Laminar (Classe 1)",
    descricao: "Solo exposto e mineralizado sem cobertura vegetal ativa",
  },
  CONTROLE: {
    BSI_MAX: 0.00,
    NDVI_MIN: 0.65,
    rotulo: "Controle / SPD (Classe 0)",
    descricao: "Solo protegido por biomassa ativa ou palhada em Sistema Plantio Direto",
  },
} as const;

/**
 * Classifica um ponto amostral estritamente segundo os limiares espectrais da pesquisa.
 */
export function classificarPontoEspectral(
  bsi: number | null | undefined,
  ndvi: number | null | undefined
): ClasseAmostral {
  if (
    bsi === null ||
    bsi === undefined ||
    !Number.isFinite(bsi) ||
    ndvi === null ||
    ndvi === undefined ||
    !Number.isFinite(ndvi)
  ) {
    return "indefinido";
  }

  // Classe 1: Erosão Laminar (BSI > 0.10 e NDVI < 0.40)
  if (bsi > CRITERIOS_ESPECTRAIS.EROSAO.BSI_MIN && ndvi < CRITERIOS_ESPECTRAIS.EROSAO.NDVI_MAX) {
    return "erosao";
  }

  // Classe 0: Controle / SPD (BSI < 0.00 e NDVI > 0.65)
  if (bsi < CRITERIOS_ESPECTRAIS.CONTROLE.BSI_MAX && ndvi > CRITERIOS_ESPECTRAIS.CONTROLE.NDVI_MIN) {
    return "controle";
  }

  return "indefinido";
}
