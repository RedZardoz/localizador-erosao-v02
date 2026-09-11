/**
 * ============================================================================
 * Fator C de Uso e Manejo do Solo — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * DECISÃO METODOLÓGICA D01 (Pesquisador, 2026-09-08):
 * - Fórmula regional tropical de Durigon et al. (2014):
 *   C = (1 - NDVI) / 2
 * - Referência:
 *   Durigon, V. L. et al. (2014). NDVI time series for monitoring RUSLE cover
 *   management factor in a tropical watershed. International Journal of Remote Sensing,
 *   35(2), 441-453.
 *
 * REGRAS INVIOLÁVEIS (LEI FUNDAMENTAL):
 * - Sem parâmetros livres e sem truncamento artificial em [0, 1].
 * - Não usa BSI (a extensão do Localizador (1 - NDVI)^(1 + BSI) invertia a resposta física).
 * - Sem corte silencioso: NDVI fora de [-1, 1] indica erro de produto/sensor a montante
 *   e lança erro explícito ou retorna estado "fora-do-dominio".
 */

import { Proveniencia } from "@/types/proveniencia";

export class ErroForaDoDominio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroForaDoDominio";
  }
}

/**
 * Função pura que calcula o Fator C a partir do NDVI pela equação de Durigon et al. (2014).
 */
export function calcularFatorC(ndvi: number): number {
  if (!Number.isFinite(ndvi) || ndvi < -1 || ndvi > 1) {
    throw new ErroForaDoDominio(`NDVI ${ndvi} fora do domínio biofísico [-1, 1].`);
  }
  return (1 - ndvi) / 2;
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
 * Encapsulador com Proveniência Científica para o Fator C (Decisão D01).
 */
export function obterFatorCComProveniencia(
  ndviProveniencia: Proveniencia<number> | null | undefined
): Proveniencia<number> {
  if (!ndviProveniencia || ndviProveniencia.estado === "indisponivel") {
    return {
      estado: "indisponivel",
      causa: ndviProveniencia?.causa ?? "sem-cobertura",
      motivo: "NDVI indisponível na série temporal para derivação do Fator C.",
    };
  }

  try {
    const c = calcularFatorC(ndviProveniencia.valor);
    return {
      estado: "modelado",
      valor: Number(c.toFixed(4)),
      modelo: "Durigon et al. (2014): C = (1 - NDVI) / 2",
      insumos: ["NDVI Sentinel-2 L2A"],
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
