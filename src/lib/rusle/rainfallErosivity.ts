/**
 * ============================================================================
 * Módulo de Erosividade da Chuva (Fator R da RUSLE)
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * SERVIDOR EXTERNO ACESSADO:
 * - NASA POWER API (Prediction Of Worldwide Energy Resources)
 * - Endpoint: https://power.larc.nasa.gov/api/temporal/climatology/point
 * - Base de dados: Reanálise Climatológica Global MERRA-2 (resolução ~55km / 0.5° × 0.625°)
 * - Parâmetro consultado: PRECTOTCORR (Precipitação diária corrigida em mm/dia, 2001-2020)
 *
 * MODELAGEM CIENTÍFICA & REFERÊNCIA AO README:
 * - README §2.4: Variáveis Climáticas e Erosividade da Chuva (R).
 * - Equação de Lombardi Neto & Moldenhauer (1992) / Bertoni & Lombardi Neto (2017)
 *   calibrada para o Estado do Paraná e Região Sul do Brasil:
 *
 *     EI30_mês = 67.355 × (p_mês² / P_anual)^0.85   [MJ·mm·ha⁻¹·h⁻¹·mês⁻¹]
 *     R = Σ (EI30_mês) de Janeiro a Dezembro         [MJ·mm·ha⁻¹·h⁻¹·ano⁻¹]
 *
 * Onde:
 * - p_mês: Precipitação total acumulada no mês em milímetros [mm].
 * - P_anual: Precipitação total anual acumulada em milímetros [mm].
 * - EI30: Índice de erosividade mensal (produto da energia cinética pela intensidade máxima em 30 min).
 */

const NASA_POWER_CLIMATOLOGY_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point";

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_KEYS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// Cache em memória indexado pela grade espacial (~25-50km)
const rFactorCache = new Map<string, RainfallErosivityResult>();

export function clearRFactorCache(): void {
  rFactorCache.clear();
}


/**
 * Modelo regional empírico do Fator R calibrado para o Estado do Paraná (Waltrick et al., 2015; Bertoni & Lombardi Neto, 2017).
 * Utilizado como fallback contínuo quando a API da NASA estiver offline ou em chamadas locais síncronas.
 */
export function getRegionalRFactorParana(lat: number, lng: number): number {
  // Litoral e Serra do Mar (lng > -49.5): R muito alto (7500 a 9500)
  if (lng > -49.5) {
    return Number((7500 + Math.abs(lat + 25.5) * 400 + (lng + 49.5) * 800).toFixed(1));
  }
  // Sudoeste e Oeste (Foz do Iguaçu / Francisco Beltrão): R elevado (6800 a 7600)
  if (lat < -25.0 && lng < -52.5) {
    return Number((7000 + Math.abs(lat + 25.5) * 250).toFixed(1));
  }
  // Noroeste e Norte (Paranavaí / Londrina / Maringá): R moderado a alto (6200 a 6600)
  if (lat > -24.0) {
    return Number((6300 + Math.abs(lng + 52.0) * 120).toFixed(1));
  }
  // Centro e Campos Gerais (Guarapuava / Ponta Grossa): R basal (5800 a 6400)
  return Number((6200 + Math.abs(lng + 51.5) * 100).toFixed(1));
}

export interface RainfallErosivityResult {
  /** Fator de erosividade anual R calculado [MJ·mm·ha⁻¹·h⁻¹·ano⁻¹] (README §2.4) */
  rFactor: number;
  /** Precipitação anual acumulada [mm] */
  annualPrecipitationMm: number;
  /** Distribuição mensal da precipitação de Jan a Dez [mm] */
  monthlyPrecipitationMm: number[];
  /** Identificador da fonte primária dos dados meteorológicos */
  source: "NASA_POWER_MERRA2_CLIMATOLOGY_2001_2020";
}

/**
 * Consulta a API externa da NASA POWER e calcula o Fator R de Erosividade da Chuva.
 *
 * @param lat - Latitude decimal do ponto (EPSG:4326)
 * @param lng - Longitude decimal do ponto (EPSG:4326)
 * @returns Promessa com o Fator R e a série climatológica mensal/anual de chuva.
 * @throws Error se a API da NASA estiver indisponível ou retornar dados fora do domínio físico.
 */
export async function estimateRainfallErosivity(lat: number, lng: number): Promise<RainfallErosivityResult> {
  const gridKey = `${(Math.round(lat * 4) / 4).toFixed(2)},${(Math.round(lng * 4) / 4).toFixed(2)}`;
  const cached = rFactorCache.get(gridKey);
  if (cached) return cached;

  const url = `${NASA_POWER_CLIMATOLOGY_URL}?parameters=PRECTOTCORR&community=AG&longitude=${lng}&latitude=${lat}&format=JSON`;

  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    throw new Error(`NASA POWER API retornou status ${res.status} ao consultar precipitação para (${lat}, ${lng}).`);
  }

  const json = await res.json();
  const prectot = json?.properties?.parameter?.PRECTOTCORR;
  if (!prectot) {
    throw new Error("Resposta da NASA POWER API não contém dados de precipitação (PRECTOTCORR) para este ponto.");
  }

  // Converte mm/dia para mm/mês multiplicando pelos dias de cada mês
  const monthlyPrecipitationMm = MONTH_KEYS.map((key, idx) => {
    const mmPerDay = prectot[key];
    if (typeof mmPerDay !== "number" || mmPerDay <= -900) {
      throw new Error(`Dado de precipitação ausente/inválido para o mês ${key} neste ponto.`);
    }
    return mmPerDay * DAYS_IN_MONTH[idx];
  });

  const annualPrecipitationMm = monthlyPrecipitationMm.reduce((a, b) => a + b, 0);

  // Aplica a equação regional de Lombardi Neto & Moldenhauer (1992) para cada mês
  const rFactor = monthlyPrecipitationMm.reduce((sum, p) => {
    const ei30 = 67.355 * Math.pow((p * p) / annualPrecipitationMm, 0.85);
    return sum + ei30;
  }, 0);

  const result: RainfallErosivityResult = {
    rFactor: Number(rFactor.toFixed(1)),
    annualPrecipitationMm: Number(annualPrecipitationMm.toFixed(1)),
    monthlyPrecipitationMm: monthlyPrecipitationMm.map((p) => Number(p.toFixed(1))),
    source: "NASA_POWER_MERRA2_CLIMATOLOGY_2001_2020",
  };

  rFactorCache.set(gridKey, result);
  return result;
}
