/**
 * ============================================================================
 * Fator C de Uso e Manejo do Solo — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * METODOLOGIA OFICIAL DA PESQUISA (Mestrado PPGTCA 2026, Seção 2.1):
 * - Formulação híbrida adaptada ao Sistema Plantio Direto (SPD):
 *   A equação linear de Durigon et al. (2014) é modulada pelo BSI para
 *   separar solo lavado de solo protegido por palhada seca:
 *   C = ((1 - NDVI) / 2) * (1 + BSI)
 *
 * - Referência:
 *   Durigon, V. L. et al. (2014). NDVI time series for monitoring RUSLE cover
 *   management factor in a tropical watershed. International Journal of Remote Sensing,
 *   35(2), 441-453.
 *
 * REGRAS INVIOLÁVEIS (LEI FUNDAMENTAL):
 * - Sem parâmetros livres arbitrários.
 * - Sem corte silencioso: NDVI ou BSI fora de [-1, 1] indica erro de produto/sensor a montante
 *   e lança erro explícito ou retorna estado "fora-do-dominio".
 */

import { Proveniencia, valorOuNulo } from "@/types/proveniencia";

export class ErroForaDoDominio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroForaDoDominio";
  }
}

/**
 * Calcula o Fator C a partir do NDVI e opcionalmente BSI pela formulação híbrida SPD:
 * C = ((1 - NDVI) / 2) * (1 + BSI)
 * Quando BSI não é fornecido (ou BSI = 0), reduz à formulação linear clássica de Durigon et al. (2014).
 */
export function calcularFatorC(ndvi: number, bsi?: number): number {
  if (!Number.isFinite(ndvi) || ndvi < -1 || ndvi > 1) {
    throw new ErroForaDoDominio(`NDVI ${ndvi} fora do domínio biofísico [-1, 1].`);
  }
  if (bsi !== undefined) {
    if (!Number.isFinite(bsi) || bsi < -1 || bsi > 1) {
      throw new ErroForaDoDominio(`BSI ${bsi} fora do domínio biofísico [-1, 1].`);
    }
  }
  const bsiNum = bsi !== undefined ? bsi : 0;
  return ((1 - ndvi) / 2) * (1 + bsiNum);
}

/**
 * Formulação híbrida explícita adaptada ao Sistema Plantio Direto (SPD).
 */
export function calcularFatorCHibrido(ndvi: number, bsi: number): number {
  return calcularFatorC(ndvi, bsi);
}

/**
 * Fator C alternativo para análise de sensibilidade segundo van der Knijff et al. (2000):
 * C = exp(-alpha * (NDVI / (beta - NDVI)))
 * com parâmetros típicos alpha = 2 e beta = 1 (van der Knijff et al., 2000).
 */
export function calcularFatorCVanDerKnijff(ndvi: number, alpha: number, beta: number): number {
  if (!Number.isFinite(ndvi) || ndvi < -1 || ndvi > 1) {
    throw new ErroForaDoDominio(`NDVI ${ndvi} fora do domínio biofísico [-1, 1].`);
  }
  if (ndvi >= beta) {
    return 0.0;
  }
  if (ndvi <= 0) {
    return 1.0;
  }
  const expoente = -alpha * (ndvi / (beta - ndvi));
  return Math.exp(expoente);
}

/**
 * Encapsulador com Proveniência Científica para o Fator C (Decisão D01 / Método Mestrado 2026).
 */
export function obterFatorCComProveniencia(
  ndviProveniencia: Proveniencia<number> | null | undefined,
  bsiProveniencia?: Proveniencia<number> | null | undefined
): Proveniencia<number> {
  if (!ndviProveniencia || ndviProveniencia.estado === "indisponivel") {
    return {
      estado: "indisponivel",
      causa: ndviProveniencia?.causa ?? "sem-cobertura",
      motivo: "NDVI indisponível na série temporal para derivação do Fator C.",
    };
  }

  const bsiVal = valorOuNulo(bsiProveniencia);
  const temBsi = bsiVal !== null && Number.isFinite(bsiVal);

  try {
    const c = calcularFatorC(ndviProveniencia.valor, temBsi ? bsiVal : 0);
    return {
      estado: "modelado",
      valor: Number(c.toFixed(4)),
      modelo: temBsi
        ? "Híbrido SPD: C = ((1 - NDVI) / 2) * (1 + BSI) (Durigon et al., 2014 modulado por BSI)"
        : "Durigon et al. (2014): C = (1 - NDVI) / 2",
      insumos: temBsi
        ? ["NDVI Sentinel-2 L2A", "BSI Sentinel-2 L2A"]
        : ["NDVI Sentinel-2 L2A"],
      decisoes: ["D01"],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      estado: "indisponivel",
      causa: "fora-do-dominio",
      motivo: msg,
    };
  }
}
