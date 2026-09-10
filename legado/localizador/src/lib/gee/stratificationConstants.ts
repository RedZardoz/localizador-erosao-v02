/**
 * Definições e Constantes Puras de Estratificação Espacial
 *
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA - 2026)
 *
 * Módulo puro (sem dependência do SDK do Google Earth Engine) para classificação
 * de declividade, erodibilidade pedológica e definição da matriz de estratos A1..B3.
 */

import { SoilType, ErosionFeatureType, SeverityLevel } from "@/types/erosion";

export type StratumId = "A1" | "A2" | "A3" | "B1" | "B2" | "B3";

export interface StratumInfo {
  code: number; // 1 a 6
  id: StratumId;
  name: string;
  slopeCategory: "Baixa (< 6%)" | "Média (6-12%)" | "Alta (> 12%)";
  erodibilityCategory: "Alta Erodibilidade" | "Média/Baixa Erodibilidade";
  description: string;
  samplingPriority: "Crítica" | "Elevada" | "Moderada" | "Controle";
}

export const STRATA_DEFINITIONS: Record<number, StratumInfo> = {
  1: {
    code: 1,
    id: "A1",
    name: "Sub-estrato A1 (Declividade < 6% × Alta Erodibilidade)",
    slopeCategory: "Baixa (< 6%)",
    erodibilityCategory: "Alta Erodibilidade",
    description: "Zona de latência e risco de infiltração / selamento superficial.",
    samplingPriority: "Moderada",
  },
  2: {
    code: 2,
    id: "A2",
    name: "Sub-estrato A2 (Declividade 6-12% × Alta Erodibilidade)",
    slopeCategory: "Média (6-12%)",
    erodibilityCategory: "Alta Erodibilidade",
    description: "Risco elevado de escoamento superficial difuso e início de sulcos.",
    samplingPriority: "Elevada",
  },
  3: {
    code: 3,
    id: "A3",
    name: "Sub-estrato A3 (Declividade > 12% × Alta Erodibilidade)",
    slopeCategory: "Alta (> 12%)",
    erodibilityCategory: "Alta Erodibilidade",
    description: "FOCO CRÍTICO: máxima energia cinética e risco de voçorocamento.",
    samplingPriority: "Crítica",
  },
  4: {
    code: 4,
    id: "B1",
    name: "Sub-estrato B1 (Declividade < 6% × Média/Baixa Erodibilidade)",
    slopeCategory: "Baixa (< 6%)",
    erodibilityCategory: "Média/Baixa Erodibilidade",
    description: "Área de controle e baseline para monitoramento conservacionista.",
    samplingPriority: "Controle",
  },
  5: {
    code: 5,
    id: "B2",
    name: "Sub-estrato B2 (Declividade 6-12% × Média/Baixa Erodibilidade)",
    slopeCategory: "Média (6-12%)",
    erodibilityCategory: "Média/Baixa Erodibilidade",
    description: "Zona de transição e perda moderada de solo.",
    samplingPriority: "Moderada",
  },
  6: {
    code: 6,
    id: "B3",
    name: "Sub-estrato B3 (Declividade > 12% × Média/Baixa Erodibilidade)",
    slopeCategory: "Alta (> 12%)",
    erodibilityCategory: "Média/Baixa Erodibilidade",
    description: "Arraste laminar acentuado sob rampas íngremes.",
    samplingPriority: "Elevada",
  },
};

/**
 * Classifica a declividade em classes discretas (0: <6%, 1: 6-12%, 2: >12%).
 */
export function classifySlope(slopePercent: number): 0 | 1 | 2 {
  if (slopePercent < 6.0) return 0;
  if (slopePercent <= 12.0) return 1;
  return 2;
}

/**
 * Classifica o solo entre Alta Erodibilidade (Grupo A) ou Média/Baixa Erodibilidade (Grupo B).
 * Aceita o nome da ordem pedológica ou o valor numérico do Fator K.
 */
export function classifySoilGroup(soilTypeOrK: string | number): "A" | "B" {
  if (typeof soilTypeOrK === "number") {
    // Solos com K >= 0.030 são considerados de Alta Erodibilidade (Argissolos/Neossolos)
    return soilTypeOrK >= 0.030 ? "A" : "B";
  }

  const s = String(soilTypeOrK).toLowerCase();
  if (
    s.includes("argissolo") ||
    s.includes("neossolo") ||
    s.includes("arenito") ||
    s.includes("arenoso")
  ) {
    return "A";
  }
  return "B";
}

/**
 * Retorna o código do estrato (1 a 6) para um determinado ponto.
 */
export function getStratumCode(slopePercent: number, soilTypeOrK: string | number): number {
  const slopeCls = classifySlope(slopePercent);
  const soilGrp = classifySoilGroup(soilTypeOrK);

  if (soilGrp === "A") {
    return 1 + slopeCls; // 1, 2, ou 3
  } else {
    return 4 + slopeCls; // 4, 5, ou 6
  }
}

/**
 * Retorna os metadados do estrato dado o código (1..6) ou ID ("A1".."B3").
 */
export function getStratumInfo(codeOrId: number | string): StratumInfo | undefined {
  if (typeof codeOrId === "number") {
    return STRATA_DEFINITIONS[codeOrId];
  }
  const match = Object.values(STRATA_DEFINITIONS).find((s) => s.id === codeOrId);
  return match;
}

/**
 * Classifica a ordem pedológica no Sistema Brasileiro de Classificação de Solos (SiBCS - Santos et al., 2018),
 * integrando a classe de estrato (erodibilidade do solo), a declividade do terreno e frações texturais.
 */
export function inferPedologyClass(
  stratumCode: number,
  slopePercent: number,
  sandPercent?: number,
  clayPercent?: number,
  _elevation?: number
): SoilType {
  const isGroupA = stratumCode >= 1 && stratumCode <= 3;

  if (isGroupA) {
    // Grupo A: Alta Erodibilidade (textura arenosa, gradiente textural ou solos rasos)
    if (slopePercent > 20 || (sandPercent !== undefined && sandPercent > 75)) {
      return slopePercent > 25 ? "Neossolo Litólico" : "Neossolo Regolítico";
    }
    if (slopePercent > 12) {
      return "Cambissolo Háplico";
    }
    return "Argissolo Vermelho-Amarelo";
  } else {
    // Grupo B: Média/Baixa Erodibilidade (solos profundos e estruturados)
    if (slopePercent > 12) {
      return "Nitossolo Vermelho";
    }
    if (slopePercent >= 6) {
      if (clayPercent !== undefined && clayPercent > 55) {
        return "Nitossolo Vermelho";
      }
      return "Latossolo Vermelho Distroférrico";
    }
    // Baixa declividade (< 6%)
    if (clayPercent !== undefined && clayPercent > 50) {
      return "Latossolo Vermelho Eutroférrico";
    }
    return "Latossolo Vermelho Distroférrico";
  }
}

/**
 * Classifica a tipologia da feição erosiva conforme a severidade, declividade e índice de solo exposto.
 * Alinhado à Matriz Metodológica do README §3 (Tabela de Sub-estratos e Feições).
 */
export function classifyFeatureType(
  severity: SeverityLevel,
  slopePercent: number,
  bsi: number
): ErosionFeatureType {
  if (severity === "Crítica") {
    if (slopePercent > 18 && bsi > 0.40) {
      return "Voçoroca em Expansão";
    }
    if (slopePercent > 12) {
      return "Sulcos de Erosão Acentuados";
    }
    return "Erosão Laminar Severa";
  }

  if (severity === "Alta") {
    if (slopePercent > 12) {
      return "Sulcos de Erosão Acentuados";
    }
    if (slopePercent < 6 && bsi > 0.25) {
      return "Depressão com Escoamento Concentrado";
    }
    return "Erosão Laminar Severa";
  }

  // Moderada
  if (slopePercent < 6 || bsi < 0.20) {
    return "Erosão Laminar Incipiente";
  }
  return "Erosão Laminar Moderada";
}

