/**
 * ============================================================================
 * Concordância Interobservador e Kappa de Cohen — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * FUNDAMENTAÇÃO CIENTÍFICA (PLANO V3, §12.2 E ACHADO S1-13):
 * - Coeficiente Kappa de Cohen (1960) com patamares de Landis & Koch (1977).
 * - Sem pares de observação -> Kappa ausente (null), NUNCA 0 (que afirmaria concordância pobre).
 * - Se Pe = 1 (todas as observações idênticas na mesma classe) -> se Po = 1, Kappa = null (indefinido sem variância marginal).
 * - Divergência sem desempate -> final: null; o ponto não entra na matriz de treino.
 * - Consolidação não inventa confiança: se os observadores discordam na confiança, as origens mantêm cada qual a sua.
 */

import { ClasseRotulo, Rotulo, RotuloConsolidado } from "@/types/rotulo";

export type GrauConcordancia =
  | "pobre"
  | "leve"
  | "razoavel"
  | "moderada"
  | "substancial"
  | "quase-perfeita"
  | "indefinido";

export interface ResultadoKappa {
  kappa: number | null;
  po: number | null;
  pe: number | null;
  grau: GrauConcordancia;
  operacional: boolean;
  intervaloConfianca95?: [number, number];
  alertaBloqueante?: string;
  matrizConfusao: Record<string, Record<string, number>>;
  classes: string[];
  nObservacoes: number;
}

export interface ParRotulo {
  observador1: ClasseRotulo;
  observador2: ClasseRotulo;
}

/**
 * Classifica o Kappa segundo os patamares de Landis & Koch (1977).
 */
export function classificarLandisKoch(kappa: number | null): GrauConcordancia {
  if (kappa === null) return "indefinido";
  if (kappa < 0.0) return "pobre";
  if (kappa <= 0.2) return "leve";
  if (kappa <= 0.4) return "razoavel";
  if (kappa <= 0.6) return "moderada";
  if (kappa <= 0.8) return "substancial";
  return "quase-perfeita";
}

/**
 * Calcula o coeficiente Kappa de Cohen para pares de observações independentes.
 */
export function calcularKappaCohen(
  pares: ParRotulo[],
  classesPermitidas: string[]
): ResultadoKappa {
  const n = pares.length;

  const matrizConfusao: Record<string, Record<string, number>> = {};
  for (const c1 of classesPermitidas) {
    matrizConfusao[c1] = {};
    for (const c2 of classesPermitidas) {
      matrizConfusao[c1][c2] = 0;
    }
  }

  // Regra 2 & Achado S1-13: sem pares -> Kappa null, não 0
  if (n === 0) {
    return {
      kappa: null,
      po: null,
      pe: null,
      grau: "indefinido",
      operacional: false,
      alertaBloqueante: "Nenhum par de observações fornecido para medição de concordância.",
      matrizConfusao,
      classes: classesPermitidas,
      nObservacoes: 0,
    };
  }

  let concordanciasObservadas = 0;
  for (const par of pares) {
    if (!matrizConfusao[par.observador1]) {
      matrizConfusao[par.observador1] = {};
    }
    const valAtual = matrizConfusao[par.observador1][par.observador2];
    matrizConfusao[par.observador1][par.observador2] = typeof valAtual === "number" ? valAtual + 1 : 1;

    if (par.observador1 === par.observador2) {
      concordanciasObservadas++;
    }
  }

  const po = concordanciasObservadas / n;

  let pe = 0;
  for (const c of classesPermitidas) {
    let totalObs1 = 0;
    let totalObs2 = 0;
    for (const cOther of classesPermitidas) {
      const v1 = matrizConfusao[c]?.[cOther];
      if (typeof v1 === "number") totalObs1 += v1;
      const v2 = matrizConfusao[cOther]?.[c];
      if (typeof v2 === "number") totalObs2 += v2;
    }
    const prop1 = totalObs1 / n;
    const prop2 = totalObs2 / n;
    pe += prop1 * prop2;
  }

  // Se Pe = 1 (todas as observações na mesma categoria)
  if (Math.abs(1 - pe) < 1e-9) {
    return {
      kappa: null,
      po: Number(po.toFixed(4)),
      pe: Number(pe.toFixed(4)),
      grau: "indefinido",
      operacional: false,
      alertaBloqueante: "Concordância indeterminada: ausência de variabilidade marginal (todas as observações pertencem à mesma classe).",
      matrizConfusao,
      classes: classesPermitidas,
      nObservacoes: n,
    };
  }

  const kappa = (po - pe) / (1 - pe);
  const grau = classificarLandisKoch(kappa);
  const operacional = kappa >= 0.6;

  let alertaBloqueante: string | undefined = undefined;
  if (!operacional) {
    alertaBloqueante = `ALERTA BLOQUEANTE: Índice Kappa de Cohen (${kappa.toFixed(3)}) inferior a 0.60 (patamar mínimo substancial).`;
  }

  return {
    kappa: Number(kappa.toFixed(4)),
    po: Number(po.toFixed(4)),
    pe: Number(pe.toFixed(4)),
    grau,
    operacional,
    alertaBloqueante,
    matrizConfusao,
    classes: classesPermitidas,
    nObservacoes: n,
  };
}

/**
 * Validação estrita de rótulo (Regras 1, 2 e 4).
 */
export function validarRotulo(rotulo: Rotulo): { valido: boolean; motivo?: string } {
  if (!rotulo.modalidade || !["interpretacao-visual", "campo", "drone"].includes(rotulo.modalidade)) {
    return { valido: false, motivo: "Modalidade de rotulagem inválida ou não informada." };
  }
  if (!rotulo.observador || rotulo.observador.trim().length === 0) {
    return { valido: false, motivo: "Identificação do observador é obrigatória." };
  }
  if (!rotulo.observadoEm || !/^\d{4}-\d{2}-\d{2}/.test(rotulo.observadoEm)) {
    return { valido: false, motivo: "Data de observação (observadoEm) inválida. Esperado padrão YYYY-MM-DD." };
  }
  if (!rotulo.classe || rotulo.classe.trim().length === 0) {
    return { valido: false, motivo: "Classe de rótulo vazia ou não informada." };
  }
  return { valido: true };
}

/**
 * Resolve divergências entre observadores independentes.
 * Se não houver consenso ou desempate válido -> final: null (não entra no treino).
 */
export function resolverDivergencia(
  obs1: Rotulo,
  obs2: Rotulo,
  obs3?: Rotulo
): RotuloConsolidado {
  const v1 = validarRotulo(obs1);
  if (!v1.valido) throw new Error(`Observador 1 inválido: ${v1.motivo}`);
  const v2 = validarRotulo(obs2);
  if (!v2.valido) throw new Error(`Observador 2 inválido: ${v2.motivo}`);

  const origens = [obs1, obs2];
  if (obs3) {
    const v3 = validarRotulo(obs3);
    if (!v3.valido) throw new Error(`Observador 3 (desempate) inválido: ${v3.motivo}`);
    origens.push(obs3);
  }

  // Concordância direta entre obs1 e obs2
  if (obs1.classe === obs2.classe) {
    return {
      final: {
        classe: obs1.classe,
        modalidade: obs1.modalidade,
        observador: `${obs1.observador} + ${obs2.observador}`,
        observadoEm: obs1.observadoEm,
        cego: obs1.cego && obs2.cego,
        // Não inventa confiança única se divergirem; preserva a informada se coincidirem
        confianca: obs1.confianca === obs2.confianca ? obs1.confianca : undefined,
        observacoes: [obs1.observacoes, obs2.observacoes].filter(Boolean).join(" | "),
      },
      origens,
      kappa: null,
      divergencia: "nenhuma",
      papelConjunto: "treino",
    };
  }

  // Discordância com desempate por terceiro
  if (obs3) {
    if (obs3.classe === obs1.classe) {
      return {
        final: {
          classe: obs1.classe,
          modalidade: obs1.modalidade,
          observador: `${obs1.observador} (desempatado por ${obs3.observador})`,
          observadoEm: obs1.observadoEm,
          cego: obs1.cego && obs3.cego,
          confianca: obs1.confianca,
          observacoes: `[Desempate: ${obs3.observador} concordou com ${obs1.observador}] ${obs1.observacoes || ""}`.trim(),
        },
        origens,
        kappa: null,
        divergencia: "resolvida-por-terceiro",
        papelConjunto: "treino",
      };
    }

    if (obs3.classe === obs2.classe) {
      return {
        final: {
          classe: obs2.classe,
          modalidade: obs2.modalidade,
          observador: `${obs2.observador} (desempatado por ${obs3.observador})`,
          observadoEm: obs2.observadoEm,
          cego: obs2.cego && obs3.cego,
          confianca: obs2.confianca,
          observacoes: `[Desempate: ${obs3.observador} concordou com ${obs2.observador}] ${obs2.observacoes || ""}`.trim(),
        },
        origens,
        kappa: null,
        divergencia: "resolvida-por-terceiro",
        papelConjunto: "treino",
      };
    }
  }

  // Divergência pendente sem desempate -> final: null (não entra na matriz de treino)
  return {
    final: null,
    origens,
    kappa: null,
    divergencia: "pendente",
    papelConjunto: "treino",
  };
}
