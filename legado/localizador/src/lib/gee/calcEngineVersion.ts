/**
 * Módulo de Versionamento e Guarda de Plausibilidade do Motor de Cálculo GEE
 *
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA - 2026)
 *
 * Registra a versão do motor de cálculo do Earth Engine para rastreabilidade
 * de integridade e auditoria metodológica dos dados de declividade e RUSLE.
 */

export const GEE_CALC_ENGINE_VERSION = "2026-08-30-slope-projection-fix";

/**
 * Limite máximo fisicamente plausível para declividade em terreno continental (graus).
 * 75° representa uma escarpa rochosa extrema (~373.2% de declividade).
 * Valores próximos de 90° (~5.700.000%) indicam bug de projeção métrica do DEM
 * (Δz em metros dividido por Δx em graus não projetados).
 */
export const MAX_PLAUSIBLE_SLOPE_DEG = 75.0;
export const MIN_PLAUSIBLE_SLOPE_DEG = 0.0;

/**
 * Valida se o valor de declividade retornado pelo Earth Engine está dentro
 * de uma faixa fisicamente plausível para a superfície terrestre.
 *
 * Lança um erro explícito caso o valor seja implausível ou nulo, impedindo
 * que valores corrompidos por falhas de projeção sejam propagados pelas fórmulas
 * de severidade, prioridade e Fator LS da RUSLE.
 *
 * @param slopeDeg Ângulo de declividade em graus (0° a 75°)
 * @throws Error se o valor for implausível, NaN ou nulo
 */
export function validateSlopePlausibility(slopeDeg: number): void {
  if (
    typeof slopeDeg !== "number" ||
    Number.isNaN(slopeDeg) ||
    !Number.isFinite(slopeDeg) ||
    slopeDeg < MIN_PLAUSIBLE_SLOPE_DEG ||
    slopeDeg > MAX_PLAUSIBLE_SLOPE_DEG
  ) {
    throw new Error(
      `Declividade retornada pelo Earth Engine é fisicamente implausível (${slopeDeg}°) — possível bug de projeção do DEM.`
    );
  }
}

/**
 * Verifica se um ponto foi calculado com uma versão anterior ou ausente
 * do motor de cálculo do Earth Engine, indicando necessidade de recálculo
 * devido à correção histórica da projeção métrica do DEM.
 *
 * Aplica-se exclusivamente a pontos de proveniência de satélite/GEE:
 * - "satellite-derived"
 * - "gee-screened"
 */
export function isPointSlopeOutdated(point: {
  dataProvenance?: string;
  calcEngineVersion?: string;
}): boolean {
  if (!point) return false;
  const isGeeDerived =
    point.dataProvenance === "satellite-derived" || point.dataProvenance === "gee-screened";

  if (!isGeeDerived) {
    return false;
  }

  return !point.calcEngineVersion || point.calcEngineVersion !== GEE_CALC_ENGINE_VERSION;
}
