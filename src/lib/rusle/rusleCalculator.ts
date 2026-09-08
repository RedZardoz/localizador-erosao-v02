import { SeverityLevel } from "@/types/erosion";

/**
 * ============================================================================
 * Módulo de Modelagem Físico-Matemática e Equações de Erosão Laminar
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * Contém a implementação estrita das fórmulas descritas no README metodológico:
 * - Equação Universal de Perda de Solo Revisada (RUSLE) — README §2.5
 * - Fator de Uso e Manejo do Solo (Fator C) — README §2.1.C
 * - Fator Topográfico de Comprimento e Grau de Declive (Fator LS) — README §2.2.C
 * - Algoritmo de Classificação do Índice de Severidade (Φ) — README §3.1
 * - Formulação do Score de Prioridade Global (0 a 100) — README §3.2
 *
 * Estas funções são puras e determinísticas, compartilhadas tanto pelo pipeline
 * de sensoriamento remoto real via Google Earth Engine quanto pelas rotinas
 * de cálculo e enriquecimento territorial.
 */

/**
 * Calcula a Perda Média Anual de Solo por Erosão Laminar e Entresulcos (A).
 *
 * Referência Metodológica:
 * - README §2.5: Equação Universal de Perda de Solo Revisada (RUSLE; Renard et al., 1997).
 * - Fórmula: A = R · K · LS · C · P
 *
 * @param r - Fator de Erosividade da Chuva [MJ·mm·ha⁻¹·h⁻¹·ano⁻¹] (README §2.4)
 * @param k - Fator de Erodibilidade do Solo [t·h·ha⁻¹·MJ⁻¹·mm⁻¹] (README §2.3)
 * @param ls - Fator Topográfico Comprimento e Grau de Declive (adimensional) (README §2.2.C)
 * @param c - Fator de Uso, Cobertura e Manejo do Solo [0.0 a 1.0] (README §2.1.C)
 * @param p - Fator de Práticas Conservacionistas de Suporte [0.20 a 1.00] (README §2.5)
 * @returns Perda estimada de solo [t·ha⁻¹·ano⁻¹] com duas casas decimais.
 */
export function calculateSoilLossRUSLE(
  r: number,
  k: number,
  ls: number,
  c: number,
  p: number
): number {
  return Number((r * k * ls * c * p).toFixed(2));
}

/**
 * Modela o Fator C (Uso, Cobertura e Manejo) a partir de Sensoriamento Remoto Multiespectral.
 *
 * Referência Metodológica:
 * - README §2.1.C: Parametrização empírica a partir do NDVI (vigor vegetal) e BSI (solo exposto).
 * - Fórmula: C = ((1 - NDVI) / 2)^(1 + BSI)
 *
 * Domínio e Limites:
 * - Se NDVI for alto (ex: > 0.70) e BSI negativo (vegetação densa/palhada), C aproxima-se de 0 (máxima proteção).
 * - Se NDVI for baixo (ex: < 0.15) e BSI positivo (solo desnudado), C aproxima-se de 1.0 (vulnerabilidade total).
 *
 * @param ndvi - Normalized Difference Vegetation Index [-1.0 a +1.0] (README §2.1.B)
 * @param bsi - Bare Soil Index [-1.0 a +1.0] (README §2.1.A)
 * @returns Fator C adimensional limitado estritamente entre [0.0000, 1.0000].
 */
export function calculateCFactor(ndvi: number, bsi: number): number {
  const c = Math.pow((1 - ndvi) / 2, 1 + bsi);
  return Number(Math.min(1, Math.max(0, c)).toFixed(4));
}

/**
 * Modela o Fator Topográfico LS (Comprimento e Grau de Declive).
 *
 * Referência Metodológica:
 * - README §2.2.C: Algoritmo bidimensional de acúmulo de fluxo distribuído
 *   (Desmet & Govers, 1996; Moore & Burch, 1986).
 * - Fórmula: LS = (As / 22.13)^m · (sin(β) / 0.0896)^n
 *
 * Onde:
 * - As: Área de contribuição específica a montante por unidade de largura de contorno [m²·m⁻¹].
 * - β: Ângulo de inclinação do terreno em radianos (β = θ · π / 180).
 * - m: Expoente de comprimento de rampa (padrão regional: 0.50).
 * - n: Expoente de inclinação do terreno (padrão regional: 1.30).
 *
 * @param specificCatchmentAreaM2PerM - Área de contribuição específica a montante [m²·m⁻¹]
 * @param slopeDegrees - Declividade do terreno em graus decimais [°] (README §2.2.B)
 * @param m - Expoente de comprimento (default = 0.5)
 * @param n - Expoente de inclinação (default = 1.3)
 * @returns Fator LS adimensional não-negativo.
 */
export function calculateLSFactor(
  specificCatchmentAreaM2PerM: number,
  slopeDegrees: number,
  m = 0.5,
  n = 1.3
): number {
  const beta = (slopeDegrees * Math.PI) / 180;
  const ls =
    Math.pow(specificCatchmentAreaM2PerM / 22.13, m) *
    Math.pow(Math.sin(beta) / 0.0896, n);
  return Number(Math.max(0, ls).toFixed(3));
}

export interface SeverityResult {
  severity: SeverityLevel;
  phi: number;
}

/**
 * Classifica a Severidade da Erosão Laminar pelo Índice Ponderado Φ.
 *
 * Referência Metodológica:
 * - README §3.1: Algoritmo de Cálculo do Índice de Severidade.
 * - Fórmula: Φ_severidade = (S% × 0.40) + (BSI × 50.0) + Ψ_solo
 *
 * Pesos Pedológicos (Ψ_solo):
 * - Solos frágeis/arenosos/rasos (Argissolos e Neossolos): Ψ_solo = 18.0 (README §2.3)
 * - Solos profundos estruturados (Latossolos e Nitossolos): Ψ_solo = 8.0 (README §2.3)
 *
 * Limiares de Enquadramento:
 * - Crítica:  Φ > 48.0 (Foco emergencial de voçorocamento / arrasto intenso)
 * - Alta:     28.0 < Φ ≤ 48.0 (Risco elevado com início de microrravinas)
 * - Moderada: Φ ≤ 28.0 (Perda laminar basal / monitoramento de controle)
 *
 * @param slopePercent - Declividade do terreno em porcentagem [%] (README §2.2.B)
 * @param bsi - Índice de Solo Exposto Bare Soil Index (README §2.1.A)
 * @param soilType - Nomenclatura da ordem pedológica (ex: "Argissolo Vermelho-Amarelo")
 * @returns Objeto com a classe de severidade e o valor numérico de Φ.
 */
export function calculateSeverity(
  slopePercent: number,
  bsi: number,
  soilType: string
): SeverityResult {
  const isFragile = /Argissolo|Neossolo/i.test(soilType);
  const isIntermediate = /Cambissolo/i.test(soilType);
  const psiSolo = isFragile ? 18.0 : isIntermediate ? 13.0 : 8.0;
  const phi = slopePercent * 0.4 + bsi * 50.0 + psiSolo;

  let severity: SeverityLevel = "Moderada";
  if (phi > 48.0) severity = "Crítica";
  else if (phi > 28.0) severity = "Alta";

  return { severity, phi: Number(phi.toFixed(2)) };
}

/**
 * Calcula o Score de Prioridade Global (0 a 100) para Triagem e Ranqueamento Top-N.
 *
 * Referência Metodológica:
 * - README §3.2: Formulação do Score de Prioridade Global.
 * - Fórmula: PriorityScore = min(100, max(10, Round(Ω_base + (BSI × 25.0) + (θ × 1.20) + ε)))
 *
 * Constante Base por Severidade (Ω_base):
 * - Crítica:  Ω_base = 70
 * - Alta:     Ω_base = 45
 * - Moderada: Ω_base = 20
 *
 * @param severity - Nível de severidade previamente classificado (README §3.1)
 * @param bsi - Bare Soil Index extraído do Sentinel-2 (README §2.1.A)
 * @param slopeDegrees - Declividade do terreno em graus [°] (README §2.2.B)
 * @param epsilon - Resíduo de calibração espacial (0 para dados reais de satélite)
 * @returns Score inteiro normalizado na escala de 10 a 100.
 */
export function calculatePriorityScore(
  severity: SeverityLevel,
  bsi: number,
  slopeDegrees: number,
  epsilon: number = 0
): number {
  const omegaBase = severity === "Crítica" ? 70 : severity === "Alta" ? 45 : 20;
  const raw = omegaBase + bsi * 25.0 + slopeDegrees * 1.2 + epsilon;
  return Math.min(100, Math.max(10, Math.round(raw)));
}
