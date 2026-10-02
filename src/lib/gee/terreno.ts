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

/**
 * Sistema de Referência de Coordenadas padrão para processamento morfométrico (Decisão D15).
 *
 * Verificação empírica de distorção linear (GRS80 geodésico via pyproj vs. EPSG:31982 — SIRGAS 2000 / UTM 22S,
 * meridiano central -51°W, k0 = 0.9996) sobre 20 segmentos distribuídos na Bacia do Paraná 3
 * (incluindo 6 segmentos na borda oeste entre -54.6199°W e -54.4875°W, Foz do Iguaçu / Itaipu):
 * - Distorção linear máxima medida (2 casas decimais): +0,12% (razão L_proj/L_geo = 1.0012 em -54.6199°W,
 *   verificada via `docs/verificacoes/projecao/calcula_distorcao_20_segmentos_bp3_2026-09-28.py`),
 *   estritamente inferior ao limiar máximo de 0,5% fixado na Decisão D15.
 * - Sinal estritamente positivo em toda a bacia (+0,04% em Cascavel a -53.4550°W até +0,12% em Foz do Iguaçu),
 *   crescendo monotonicamente com o afastamento ao meridiano central de -51°W.
 * - Ressalva geométrica: a verificação abrange o polígono codificado em src/lib/localizacao/bacias.ts
 *   (que apresenta erro de área de -24,8% a +33,0% frente aos limites oficiais do Instituto Águas Paraná / ANA),
 *   estendendo-se até o extremo oeste da fronteira internacional (-54.6199°W).
 */
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
