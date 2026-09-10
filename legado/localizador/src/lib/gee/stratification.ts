/**
 * Módulo de Estratificação Espacial (Google Earth Engine)
 *
 * Constrói a banda de estratificação cruzada de Declividade × Erodibilidade Pedológica
 * no Google Earth Engine (ee.Image) conforme a Matriz Metodológica do README §3.
 *
 * As definições e funções puras (sem dependência do SDK) estão em ./stratificationConstants.
 */
const { XMLHttpRequest } = require("xmlhttprequest");
if (!(global as any).XMLHttpRequest) {
  (global as any).XMLHttpRequest = XMLHttpRequest;
}
const ee = require("@google/earthengine");

export * from "./stratificationConstants";

/**
 * Constrói a banda de estratificação 'stratum' (valores inteiros 1 a 6) no Earth Engine.
 *
 * @param slopePercentImage ee.Image contendo a declividade em porcentagem (S%)
 * @param soilGroupImage ee.Image opcional (1 = Grupo A / Alta Erodibilidade, 0 = Grupo B).
 *        Se omitido, utiliza OpenLandMap Sand Content (>50% de areia = Grupo A).
 */
export function buildStratificationBand(
  slopePercentImage: any,
  soilGroupImage?: any
): any {
  // Classe de declividade: 0 (<6%), 1 (6-12%), 2 (>12%)
  const slopeClass = slopePercentImage
    .expression(
      "(slope < 6.0) ? 0 : ((slope <= 12.0) ? 1 : 2)",
      { slope: slopePercentImage }
    )
    .rename("slope_class");

  // Grupo de Solo: se não fornecido, defaulta para Grupo B (0)
  const isGroupA = soilGroupImage || ee.Image.constant(0);

  // Se isGroupA == 1: stratum = 1 + slopeClass (1..3)
  // Se isGroupA == 0: stratum = 4 + slopeClass (4..6)
  // Expressão: isGroupA * 1 + (1 - isGroupA) * 4 + slopeClass
  //          = isGroupA + 4 - 4*isGroupA + slopeClass
  //          = 4 - 3*isGroupA + slopeClass
  const stratum = slopeClass
    .expression(
      "4 - (3 * isA) + slopeCls",
      {
        isA: isGroupA,
        slopeCls: slopeClass,
      }
    )
    .toInt()
    .rename("stratum");

  return stratum;
}
