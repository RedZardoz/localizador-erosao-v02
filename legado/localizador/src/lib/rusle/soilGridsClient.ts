/**
 * ============================================================================
 * Cliente de Integração com a API ISRIC SoilGrids v2.0
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * SERVIDOR EXTERNO ACESSADO:
 * - ISRIC - World Soil Information (SoilGrids REST API v2.0)
 * - Endpoint: https://rest.isric.org/soilgrids/v2.0/properties/query
 * - Propriedades consultadas na profundidade 0-5cm:
 *   - clay: Teor de argila [g/kg]
 *   - sand: Teor de areia [g/kg]
 *   - silt: Teor de silte [g/kg]
 *   - soc: Teor de carbono orgânico do solo (Soil Organic Carbon) [dg/kg]
 *
 * MODELAGEM FÍSICO-QUÍMICA & REFERÊNCIA AO README:
 * - README §2.3: Variáveis Pedológicas e Erodibilidade do Solo (K).
 * - Equação de Sharpley & Williams (1990) / Modelo EPIC (Williams, 1995):
 *
 *   SN1 = 1 - (areia / 100)
 *   K = [0.2 + 0.3 · exp(-0.0256 · areia · (1 - silte / 100))]
 *       × (silte / (argila + silte))^0.3
 *       × [1 - 0.25 · C / (C + exp(3.72 - 2.95 · C))]
 *       × [1 - 0.7 · SN1 / (SN1 + exp(-5.51 + 22.9 · SN1))]
 *   K[SI] = K[US] × 0.1317   [t·h·ha⁻¹·MJ⁻¹·mm⁻¹]
 */

const SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query";

export interface SoilGridsKResult {
  /** Fator K em unidades do Sistema Internacional [t·h·ha⁻¹·MJ⁻¹·mm⁻¹] */
  kFactor: number;
  /** Porcentagem de argila no solo [%] */
  clayPercent: number;
  /** Porcentagem de areia no solo [%] */
  sandPercent: number;
  /** Porcentagem de silte no solo [%] */
  siltPercent: number;
  /** Porcentagem de carbono orgânico do solo [%] */
  organicCarbonPercent: number;
  /** Identificador da base de dados */
  source: "ISRIC_SOILGRIDS_V2";
}

/**
 * Calcula o Fator K de erodibilidade pela equação de Sharpley & Williams (1990) - EPIC.
 *
 * @param sandPct - Porcentagem de areia [%]
 * @param siltPct - Porcentagem de silte [%]
 * @param clayPct - Porcentagem de argila [%]
 * @param socPct - Porcentagem de carbono orgânico [%]
 * @returns Fator K em unidades SI [t·h·ha⁻¹·MJ⁻¹·mm⁻¹].
 */
function sharpleyWilliamsK(
  sandPct: number,
  siltPct: number,
  clayPct: number,
  socPct: number
): number {
  const sn1 = 1 - sandPct / 100;
  const term1 = 0.2 + 0.3 * Math.exp(-0.0256 * sandPct * (1 - siltPct / 100));
  const term2 = Math.pow(siltPct / (clayPct + siltPct), 0.3);
  const term3 = 1 - (0.25 * socPct) / (socPct + Math.exp(3.72 - 2.95 * socPct));
  const term4 = 1 - (0.7 * sn1) / (sn1 + Math.exp(-5.51 + 22.9 * sn1));
  const kUsCustomary = term1 * term2 * term3 * term4;
  return kUsCustomary * 0.1317;
}

/**
 * Consulta a API do ISRIC SoilGrids para obter a textura e estimar o Fator K real do ponto.
 *
 * @param lat - Latitude decimal (EPSG:4326)
 * @param lng - Longitude decimal (EPSG:4326)
 * @returns Objeto com frações granulométricas e Fator K, ou null se não houver dados no ponto.
 */
export async function estimateKFactorFromSoilGrids(
  lat: number,
  lng: number
): Promise<SoilGridsKResult | null> {
  const url = `${SOILGRIDS_URL}?lon=${lng}&lat=${lat}&property=clay&property=sand&property=silt&property=soc&depth=0-5cm&value=mean`;

  let json: any;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    json = await res.json();
  } catch {
    return null;
  }

  const layers: any[] = json?.properties?.layers ?? [];
  const getMean = (name: string): number | null => {
    const layer = layers.find((l) => l.name === name);
    const mean = layer?.depths?.[0]?.values?.mean;
    return typeof mean === "number" ? mean : null;
  };

  const clayRaw = getMean("clay");
  const sandRaw = getMean("sand");
  const siltRaw = getMean("silt");
  const socRaw = getMean("soc");

  if (clayRaw == null || sandRaw == null || siltRaw == null || socRaw == null) {
    return null;
  }

  // Conversão de unidades: SoilGrids retorna g/kg (textura) e dg/kg (carbono); converte para %
  const clayPercent = clayRaw / 10;
  const sandPercent = sandRaw / 10;
  const siltPercent = siltRaw / 10;
  const organicCarbonPercent = socRaw / 100;

  const kFactor = sharpleyWilliamsK(
    sandPercent,
    siltPercent,
    clayPercent,
    organicCarbonPercent
  );

  return {
    kFactor: Number(kFactor.toFixed(4)),
    clayPercent: Number(clayPercent.toFixed(1)),
    sandPercent: Number(sandPercent.toFixed(1)),
    siltPercent: Number(siltPercent.toFixed(1)),
    organicCarbonPercent: Number(organicCarbonPercent.toFixed(2)),
    source: "ISRIC_SOILGRIDS_V2",
  };
}
