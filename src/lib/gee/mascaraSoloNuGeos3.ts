/**
 * ============================================================================
 * Máscara de Solo Exposto GEOS3 (Demattê et al., 2018) — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * FUNDAMENTAÇÃO (Decisão D10 / Norma R-L1):
 * - Demattê et al. (2018), Remote Sensing of Environment 212:161-175.
 *   Conferido no primário em 09/11/2026 (docs/verificacoes/fontes/dematte2018/).
 * - Transposição espectral para Sentinel-2 MSI L2A:
 *   Landsat B1 -> S2 B2 (Blue)
 *   Landsat B2 -> S2 B3 (Green)
 *   Landsat B3 -> S2 B4 (Red)
 *   Landsat B4 -> S2 B8 (NIR amplo, 785-900 nm)
 *   Landsat B5 -> S2 B11 (SWIR-1)
 *   Landsat B7 -> S2 B12 (SWIR-2)
 *
 * CONJUNÇÃO DE CINCO TESTES INCLUSIVOS:
 * 1. NDVI >= ndviMin AND NDVI <= ndviMax (faixa [0,00; 0,25] em D10)
 * 2. NBR2 >= nbr2Min AND NBR2 <= nbr2Max (faixa [0,00; 0,075] em D10)
 * 3. (B4 - B3) >= 0 (Red - Green >= 0, gradiente positivo no visível, transposto de B3-B2 do Landsat)
 * 4. (B3 - B2) >= 0 (Green - Blue >= 0, gradiente positivo no visível, transposto de B2-B1 do Landsat)
 *
 * INVARIÂNCIA DE ESCALA:
 * Diferentemente de modelos lineares com termos aditivos constantes (como VNSIR), nenhum
 * dos cinco testes depende da escala absoluta da refletância: NDVI e NBR2 são razões
 * normalizadas adimensionais, e as inclinações no visível são testes de sinal de diferenças.
 * O resultado é idêntico em DN (0-10000) ou refletância de superfície física (0.0-1.0).
 *
 * REGRAS DA LEI FUNDAMENTAL:
 * - Regra 1 / Invariante 5: Se qualquer banda estiver ausente (null/undefined) ou inválida,
 *   a função retorna estritamente null. NUNCA retorna false por omissão de banda.
 * - Regra 9: Os limites padrão são recuperados exclusivamente via exigirParametro(DECISOES.D10).
 */

import { DECISOES, exigirParametro } from "@/config/decisoes";

export interface OpcoesMascaraGeos3 {
  ndviMin?: number;
  ndviMax?: number;
  nbr2Min?: number;
  nbr2Max?: number;
}

/**
 * Seis faixas de NBR2 testadas no primário de Demattê et al. (2018, p. 7).
 * Utilizadas na instrumentação da varredura comparativa regional (Tarefa 4).
 */
export const FAIXAS_NBR2_DEMATTE_2018 = [0.025, 0.075, 0.150, 0.225, 0.300, 0.350] as const;

/**
 * Avalia se uma observação espectral cumpre a máscara GEOS3 de solo exposto.
 *
 * @param b2 Refletância na banda B2 (Blue)
 * @param b3 Refletância na banda B3 (Green)
 * @param b4 Refletância na banda B4 (Red)
 * @param b8 Refletância na banda B8 (NIR amplo)
 * @param b11 Refletância na banda B11 (SWIR-1)
 * @param b12 Refletância na banda B12 (SWIR-2)
 * @param opcoes Limiares opcionais (permite varredura de NBR2 sem alterar código)
 * @returns boolean indicando solo exposto ou null se qualquer banda for ausente/inválida
 */
export function ehSoloExpostoGeos3(
  b2: number | null | undefined,
  b3: number | null | undefined,
  b4: number | null | undefined,
  b8: number | null | undefined,
  b11: number | null | undefined,
  b12: number | null | undefined,
  opcoes?: OpcoesMascaraGeos3
): boolean | null {
  // Regra 1: ausência declarada. Se faltar qualquer banda, retorna null.
  if (
    b2 === null || b2 === undefined || !Number.isFinite(b2) ||
    b3 === null || b3 === undefined || !Number.isFinite(b3) ||
    b4 === null || b4 === undefined || !Number.isFinite(b4) ||
    b8 === null || b8 === undefined || !Number.isFinite(b8) ||
    b11 === null || b11 === undefined || !Number.isFinite(b11) ||
    b12 === null || b12 === undefined || !Number.isFinite(b12)
  ) {
    return null;
  }

  const denomNdvi = b8 + b4;
  const denomNbr2 = b11 + b12;

  // Regra 1: denominador nulo não produz índice numérico
  if (Math.abs(denomNdvi) < 1e-6 || Math.abs(denomNbr2) < 1e-6) {
    return null;
  }

  const ndvi = Number(((b8 - b4) / denomNdvi).toFixed(4));
  const nbr2 = Number(((b11 - b12) / denomNbr2).toFixed(4));

  // Regra 2: valores fora do domínio físico [-1, 1] representam artefato ou corrupção
  if (ndvi < -1 || ndvi > 1 || nbr2 < -1 || nbr2 > 1) {
    return null;
  }

  // Parâmetros normativos recuperados via D10 (Regra 9)
  const limNdviMin = opcoes?.ndviMin ?? exigirParametro(DECISOES.D10, "ndviSoloNuMin").valor;
  const limNdviMax = opcoes?.ndviMax ?? exigirParametro(DECISOES.D10, "ndviSoloNu").valor;
  const limNbr2Min = opcoes?.nbr2Min ?? exigirParametro(DECISOES.D10, "nbr2Min").valor;
  const limNbr2Max = opcoes?.nbr2Max ?? exigirParametro(DECISOES.D10, "nbr2Max").valor;

  // Todos os cinco testes são inclusivos conforme o primário de Demattê et al. (2018)
  const ndviNaFaixa = ndvi >= limNdviMin && ndvi <= limNdviMax;
  const nbr2NaFaixa = nbr2 >= limNbr2Min && nbr2 <= limNbr2Max;
  const inclinacaoB4B3 = (b4 - b3) >= 0;
  const inclinacaoB3B2 = (b3 - b2) >= 0;

  return ndviNaFaixa && nbr2NaFaixa && inclinacaoB4B3 && inclinacaoB3B2;
}
