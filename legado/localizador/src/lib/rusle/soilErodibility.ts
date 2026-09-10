/**
 * ============================================================================
 * Módulo de Erodibilidade do Solo (Fator K da RUSLE)
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * FUNDAMENTAÇÃO CIENTÍFICA & REFERÊNCIA AO README:
 * - README §2.3: Variáveis Pedológicas e Erodibilidade do Solo (K).
 * - Unidade física: [t·h·ha⁻¹·MJ⁻¹·mm⁻¹]
 *
 * Mapeamento Pedológico do Estado do Paraná (SiBCS - Santos et al., 2018; IAT/Embrapa 1:250k):
 * - Argissolos (PVA): Gradiente textural abrupto, horizonte B argiloso de baixa permeabilidade.
 *   Erodibilidade extremamente alta (K ~ 0.038 a 0.055).
 * - Neossolos (RR/RL): Solos rasos sobre rocha, baixa espessura e saturação rápida.
 *   Erodibilidade muito alta (K ~ 0.032 a 0.048).
 * - Cambissolos (CX): Estrutura em blocos, textura média a argilosa (K ~ 0.028 a 0.038).
 * - Nitossolos (NV): Horizonte B nítico, muito argiloso, excelente agregação inicial (K ~ 0.020 a 0.030).
 * - Latossolos (LVd/LVe): Muito profundos, estrutura microagregada ("pó-de-café"), alta permeabilidade
 *   e drenagem (K ~ 0.012 a 0.025).
 *
 * CONSULTA EXTERNA (ISRIC SoilGrids v2):
 * - Tenta obter a granulometria em alta resolução da API REST do ISRIC SoilGrids.
 * - Caso a grade global não possua dados ou a rede falhe, utiliza com segurança a tabela
 *   regional ponderada do SiBCS/IAT.
 */

export interface KFactorEntry {
  /** Sigla oficial da classe pedológica no SiBCS (ex: "PVA", "LVd") */
  order: string;
  /** Limite inferior da erodibilidade regional [t·h·ha⁻¹·MJ⁻¹·mm⁻¹] */
  min: number;
  /** Limite superior da erodibilidade regional [t·h·ha⁻¹·MJ⁻¹·mm⁻¹] */
  max: number;
  /** Valor médio adotado no modelo regional [t·h·ha⁻¹·MJ⁻¹·mm⁻¹] */
  mean: number;
  /** Grau descritivo de suscetibilidade à erosão laminar (README §2.3) */
  susceptibility: string;
}

/** Tabela Regional de Erodibilidade do Paraná — README §2.3 */
export const K_FACTOR_TABLE: Record<string, KFactorEntry> = {
  "Argissolo Vermelho-Amarelo": {
    order: "PVA",
    min: 0.038,
    max: 0.055,
    mean: 0.0465,
    susceptibility: "Extremamente Alta",
  },
  "Neossolo Regolítico": {
    order: "RR",
    min: 0.032,
    max: 0.048,
    mean: 0.04,
    susceptibility: "Muito Alta",
  },
  "Neossolo Litólico": {
    order: "RL",
    min: 0.032,
    max: 0.048,
    mean: 0.04,
    susceptibility: "Muito Alta",
  },
  "Cambissolo Háplico": {
    order: "CX",
    min: 0.028,
    max: 0.038,
    mean: 0.033,
    susceptibility: "Alta",
  },
  "Nitossolo Vermelho": {
    order: "NV",
    min: 0.02,
    max: 0.03,
    mean: 0.025,
    susceptibility: "Média a Alta",
  },
  "Latossolo Vermelho Distroférrico": {
    order: "LVd",
    min: 0.015,
    max: 0.025,
    mean: 0.02,
    susceptibility: "Moderada a Baixa",
  },
  "Latossolo Vermelho Eutroférrico": {
    order: "LVe",
    min: 0.012,
    max: 0.022,
    mean: 0.017,
    susceptibility: "Moderada a Baixa",
  },
};

const DEFAULT_K: KFactorEntry = {
  order: "N/D",
  min: 0.02,
  max: 0.04,
  mean: 0.03,
  susceptibility: "Desconhecida (valor padrão conservador)",
};

/**
 * Retorna os parâmetros de erodibilidade K a partir do nome da ordem pedológica.
 *
 * @param soilType - Nome do solo (ex: "Argissolo Vermelho-Amarelo")
 * @returns Registro completo de erodibilidade com faixas e suscetibilidade.
 */
export function getKFactor(soilType: string): KFactorEntry {
  return K_FACTOR_TABLE[soilType] ?? DEFAULT_K;
}

export interface KFactorResolution {
  /** Valor numérico do Fator K [t·h·ha⁻¹·MJ⁻¹·mm⁻¹] (README §2.3) */
  kFactor: number;
  /** Indica se o valor é aproximado por ordem pedológica ou derivado de frações granulométricas */
  approximated: boolean;
  /** Nível de suscetibilidade descritivo */
  susceptibility: string;
  /** Identificador da fonte do dado */
  source: "ISRIC_SOILGRIDS_V2" | "TABELA_SIBCS_APROXIMADA";
}

/**
 * Obtém o Fator K de Erodibilidade, integrando a API externa do SoilGrids com fallback à tabela SiBCS.
 *
 * @param lat - Latitude decimal do ponto
 * @param lng - Longitude decimal do ponto
 * @param soilType - Ordem do solo informada ou detectada
 * @returns Resolução do Fator K com metadados de proveniência e suscetibilidade.
 */
export async function getKFactorRealOrApproximate(
  lat: number,
  lng: number,
  soilType: string
): Promise<KFactorResolution> {
  const { estimateKFactorFromSoilGrids } = await import("./soilGridsClient");

  try {
    const real = await estimateKFactorFromSoilGrids(lat, lng);
    if (real && real.kFactor > 0) {
      return {
        kFactor: real.kFactor,
        approximated: false,
        susceptibility:
          real.kFactor >= 0.038
            ? "Extremamente Alta (SoilGrids)"
            : real.kFactor >= 0.03
            ? "Alta (SoilGrids)"
            : "Moderada/Baixa (SoilGrids)",
        source: "ISRIC_SOILGRIDS_V2",
      };
    }
  } catch {
    // Fallback gracioso para a tabela SiBCS do Paraná (README §2.3)
  }

  const entry = getKFactor(soilType);
  return {
    kFactor: entry.mean,
    approximated: true,
    susceptibility: entry.susceptibility,
    source: "TABELA_SIBCS_APROXIMADA",
  };
}
