/**
 * ============================================================================
 * Fator K de Erodibilidade do Solo — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * O QUE ESTE MÓDULO CALCULA:
 * - Converte as classes qualitativas da carta de erodibilidade da Embrapa Solos
 *   (cobertura nacional e regional) em valores numéricos contínuos de erodibilidade (K)
 *   em t·h/(MJ·mm), conforme a Tabela 5 da publicação oficial Documentos 246/2024.
 * - Mapeia a estratificação K̂ em 2 níveis amostrais conforme a Decisão D09:
 *   • Nível 1: Baixa / Média erodibilidade (K <= 0.0285)
 *   • Nível 2: Alta / Muito alta erodibilidade (K >= 0.0300)
 *
 * FUNDAMENTAÇÃO METODOLÓGICA (DECISÕES D09 E D14):
 * 1. Resolução da Incompatibilidade Carta vs. Equação:
 *    A carta pedológica oficial da Embrapa expressa erodibilidade em 5 classes ordinais.
 *    A equação da RUSLE, contudo, exige uma grandeza física contínua [t·h·MJ⁻¹·mm⁻¹].
 *    A Tabela 5 da Embrapa Solos (Doc. 246/2024, páginas 13 a 15), fundamentada no
 *    trabalho experimental seminal de Mannigel et al. (2002) e no Manual Técnico
 *    de Pedologia do IBGE (2018), estabelece a correspondência normativa oficial.
 *
 * 2. Domínio Agrícola Estrito (Decisão D09):
 *    Classes 1 a 5 integram o domínio de predição agrícola.
 *    Classes 6 ('Fase erodida'), 7 ('Dunas'), 8 ('Afloramento de rochas') e 9 ('Corpos d'água')
 *    são tratadas como fora do domínio de calibração agrícola (retornam 'fora-do-dominio').
 *
 * Referências:
 * - Bhering, S.B. et al. (2024). Erodibilidade dos solos do Brasil. Documentos 246,
 *   Embrapa Solos, Rio de Janeiro, 40 p. (Tabela 5, p. 13-15).
 * - Mannigel, E. et al. (2002). Fator erodibilidade de solos do estado de São Paulo.
 *   Revista Brasileira de Ciência do Solo, 26:1039–1049.
 * - IBGE (2018). Manual Técnico de Pedologia. Manuais Técnicos em Geociências, 3ª ed.
 */

import { Proveniencia, valorOuNulo } from "@/types/proveniencia";

export type ClasseErodibilidadeAgricola =
  | "Muito baixa"
  | "Baixa"
  | "Média"
  | "Alta"
  | "Muito alta";

export interface ResultadoFatorK {
  classeNormalizada: ClasseErodibilidadeAgricola;
  classeOrdinal: 1 | 2 | 3 | 4 | 5;
  kValor: number; // Média representativa da classe em t*h/(MJ*mm)
  faixaK: [number, number]; // Faixa oficial da Tabela 5 [min, max]
  nivelEstratoK: 1 | 2; // Decisão D09: 1 = Baixa/Média (classes 1-3) | 2 = Alta/Muito Alta (classes 4-5)
  referencia: string;
}

/**
 * Tabela oficial de conversão normativa (Embrapa Solos Doc. 246/2024 / Mannigel et al., 2002).
 */
const TABELA_5_EMBRAPA: Record<
  ClasseErodibilidadeAgricola,
  {
    classeOrdinal: 1 | 2 | 3 | 4 | 5;
    kValor: number;
    faixaK: [number, number];
    nivelEstratoK: 1 | 2;
  }
> = {
  "Muito baixa": {
    classeOrdinal: 1,
    kValor: 0.0052,
    faixaK: [0.0020, 0.0084],
    nivelEstratoK: 1,
  },
  Baixa: {
    classeOrdinal: 2,
    kValor: 0.0117,
    faixaK: [0.0090, 0.0144],
    nivelEstratoK: 1,
  },
  Média: {
    classeOrdinal: 3,
    kValor: 0.0218,
    faixaK: [0.0150, 0.0285],
    nivelEstratoK: 1,
  },
  Alta: {
    classeOrdinal: 4,
    kValor: 0.0360,
    faixaK: [0.0300, 0.0420],
    nivelEstratoK: 2,
  },
  "Muito alta": {
    classeOrdinal: 5,
    kValor: 0.0518,
    faixaK: [0.0450, 0.0585],
    nivelEstratoK: 2,
  },
};

/**
 * Normaliza strings textuais oriundas de WFS / GeoNode / cartas pedológicas.
 */
function normalizarTextoClasse(bruta: string): ClasseErodibilidadeAgricola | null {
  const limpo = bruta
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos

  if (limpo === "muito baixa" || limpo === "1" || limpo === "1.0") {
    return "Muito baixa";
  }
  if (limpo === "baixa" || limpo === "2" || limpo === "2.0") {
    return "Baixa";
  }
  if (limpo === "media" || limpo === "3" || limpo === "3.0") {
    return "Média";
  }
  if (limpo === "alta" || limpo === "4" || limpo === "4.0") {
    return "Alta";
  }
  if (limpo === "muito alta" || limpo === "5" || limpo === "5.0") {
    return "Muito alta";
  }

  return null;
}

/**
 * Converte a classe de erodibilidade textual da Embrapa para Fator K e estrato K̂.
 *
 * @param classeBruta Ex: "Média", "Alta", "Baixa", etc.
 * @returns ResultadoFatorK com valor contínuo e estrato, ou null se não pertencer ao domínio agrícola.
 */
export function converterErodibilidadeFatorK(
  classeBruta: string | null | undefined
): ResultadoFatorK | null {
  if (!classeBruta || typeof classeBruta !== "string") {
    return null;
  }

  const normalizada = normalizarTextoClasse(classeBruta);
  if (!normalizada) {
    return null;
  }

  const dados = TABELA_5_EMBRAPA[normalizada];
  return {
    classeNormalizada: normalizada,
    classeOrdinal: dados.classeOrdinal,
    kValor: dados.kValor,
    faixaK: dados.faixaK,
    nivelEstratoK: dados.nivelEstratoK,
    referencia: "Embrapa Solos Doc. 246/2024 (Tabela 5) / Mannigel et al. (2002)",
  };
}

/**
 * Encapsula o cálculo do Fator K com rastreabilidade de proveniência para a Linha de Base RUSLE.
 */
export function obterFatorKComProveniencia(
  classeProveniencia?: Proveniencia<string> | null
): Proveniencia<number> {
  if (!classeProveniencia) {
    return {
      estado: "indisponivel",
      causa: "sem-cobertura",
      motivo: "Classe de erodibilidade da Embrapa ausente para este ponto.",
    };
  }

  const texto = valorOuNulo(classeProveniencia);
  if (texto === null) {
    return {
      estado: "indisponivel",
      causa: classeProveniencia.estado === "indisponivel" ? classeProveniencia.causa : "sem-cobertura",
      motivo: classeProveniencia.estado === "indisponivel" ? classeProveniencia.motivo : "Valor de erodibilidade nulo.",
    };
  }

  const conv = converterErodibilidadeFatorK(texto);
  if (!conv) {
    return {
      estado: "indisponivel",
      causa: "fora-do-dominio",
      motivo: `Classe de erodibilidade '${texto}' fora do domínio agrícola calibrado [1..5] (Decisão D09).`,
    };
  }

  return {
    estado: "tabelado",
    valor: conv.kValor,
    tabela: "Tabela 5 Embrapa Solos (Doc. 246/2024) / Mannigel et al. (2002)",
    chave: conv.classeNormalizada,
    decisao: "D14",
  };
}
