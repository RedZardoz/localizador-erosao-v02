/**
 * ============================================================================
 * Processamento e Validação de Derivadas de Terreno (DEM SRTM / NASADEM) — SAREL
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA 2026)
 * ============================================================================
 *
 * PROJEÇÃO MANDATÓRIA:
 * - Toda declividade deve ser calculada em projeção UTM métrica estrita (EPSG:31982 - SIRGAS 2000 / UTM 22S).
 * - Distorção linear documentada em docs/verificacoes/2026-09-10_distorcao_projecao_declividade.md.
 *
 * REGRAS DA LEI FUNDAMENTAL:
 * - Regra 1: Nunca inventar valores nem usar fallbacks silenciosos.
 * - Invariante 2: declividadePct = tan(graus * PI / 180) * 100.
 * - Invariante 5: Se declividade for 0°, TWI é indefinido -> estado: "indisponivel", causa: "fora-do-dominio".
 */

import { Proveniencia } from "@/types/proveniencia";
import {
  MAX_PLAUSIBLE_SLOPE_DEG,
  MIN_PLAUSIBLE_SLOPE_DEG,
  validateSlopePlausibility,
} from "./versaoMotor";

export const CRS_TERRENO_PADRAO = "EPSG:31982";

/**
 * Converte ângulo de declividade em graus para percentual através da tangente estrita.
 * Invariante 2: declividadePct = tan(graus * PI / 180) * 100.
 */
export function grausParaPct(graus: number): number {
  validateSlopePlausibility(graus);
  const rad = (graus * Math.PI) / 180;
  return Math.tan(rad) * 100;
}

/**
 * Converte declividade em percentual para graus através do arco-tangente.
 */
export function pctParaGraus(pct: number): number {
  if (!Number.isFinite(pct) || pct < 0) {
    throw new Error(`Declividade percentual inválida (${pct}%).`);
  }
  const rad = Math.atan(pct / 100);
  const graus = (rad * 180) / Math.PI;
  validateSlopePlausibility(graus);
  return graus;
}

/**
 * Calcula o Índice Topográfico de Umidade (TWI — Beven & Kirkby, 1979):
 * TWI = ln(a / tan(beta))
 *
 * Onde:
 * - a = área de contribuição específica acumulada (m² por unidade de largura de contorno)
 * - beta = declividade topográfica local em radianos
 *
 * CONDUTA RÍGIDA PARA beta = 0:
 * Quando a declividade é plana (beta = 0°), tan(0) = 0, gerando divisão por zero e ln(inf).
 * O SAREL NÃO arbitra um valor nem substitui por constante; reporta estado "indisponivel"
 * com causa "fora-do-dominio".
 */
export function calcularTwi(
  areaContribuicaoM2: number,
  declividadeGraus: number
): Proveniencia<number> {
  if (!Number.isFinite(declividadeGraus) || !Number.isFinite(areaContribuicaoM2)) {
    return {
      estado: "indisponivel",
      causa: "fora-do-dominio",
      motivo: "Parâmetros de terreno não numéricos.",
    };
  }

  if (declividadeGraus <= MIN_PLAUSIBLE_SLOPE_DEG) {
    return {
      estado: "indisponivel",
      causa: "fora-do-dominio",
      motivo: "Declividade plana (beta = 0°) impossibilita cálculo do TWI (divisão por zero em tan(beta)).",
    };
  }

  if (declividadeGraus > MAX_PLAUSIBLE_SLOPE_DEG) {
    return {
      estado: "indisponivel",
      causa: "fora-do-dominio",
      motivo: `Declividade fisicamente implausível (${declividadeGraus}°) acima de 75°.`,
    };
  }

  if (areaContribuicaoM2 <= 0) {
    return {
      estado: "indisponivel",
      causa: "fora-do-dominio",
      motivo: `Área de contribuição específica não positiva (${areaContribuicaoM2} m²).`,
    };
  }

  const rad = (declividadeGraus * Math.PI) / 180;
  const tanBeta = Math.tan(rad);
  const twiVal = Math.log(areaContribuicaoM2 / tanBeta);

  return {
    estado: "modelado",
    valor: Number(twiVal.toFixed(3)),
    modelo: "TWI = ln(a / tan(beta)) (Beven & Kirkby, 1979)",
    insumos: ["areaContribuicaoM2", "declividadeGraus"],
  };
}
