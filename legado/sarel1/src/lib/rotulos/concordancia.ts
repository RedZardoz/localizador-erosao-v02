/**
 * ============================================================================
 * Concordância entre Intérpretes e Kappa de Cohen — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * Conforme §11.3 do Plano v2 e §3 da Etapa 0 do Planejamento v3:
 * Medição rigorosa de concordância interobservador com Kappa de Cohen (1960)
 * e interpretação dos patamares segundo Landis & Koch (1977).
 *
 * REGRA CRÍTICA:
 * Kappa abaixo de 0,60 indica que o critério NÃO está operacional e precisa
 * ser reescrito antes da coleta em escala (emite ALERTA BLOQUEANTE).
 */

import { ClasseRotulo, GrauConcordancia, ResultadoKappa, Rotulo, RotuloConsolidado } from "@/types/rotulo";

export const TODAS_CLASSES_ROTULO: ClasseRotulo[] = [
  "ausente",
  "incipiente",
  "moderada",
  "severa",
];

/**
 * Classifica o valor do Kappa segundo os patamares canônicos de Landis & Koch (1977).
 */
export function classificarLandisKoch(kappa: number): GrauConcordancia {
  if (kappa < 0.0) return "pobre";
  if (kappa <= 0.20) return "leve";
  if (kappa <= 0.40) return "razoavel";
  if (kappa <= 0.60) return "moderada";
  if (kappa <= 0.80) return "substancial";
  return "quase-perfeita";
}

export interface ParRotulo {
  observador1: ClasseRotulo;
  observador2: ClasseRotulo;
}

/**
 * Calcula o coeficiente Kappa de Cohen (1960) para pares de observações independentes.
 *
 * Po = proporção observada de concordância = (1/N) * sum(C_kk)
 * Pe = proporção esperada por chance aleatória = sum(p1_k * p2_k)
 * Kappa = (Po - Pe) / (1 - Pe)
 */
export function calcularKappaCohen(
  pares: ParRotulo[],
  classesPermitidas: ClasseRotulo[] = TODAS_CLASSES_ROTULO
): ResultadoKappa {
  const n = pares.length;

  // Inicializar matriz de confusão
  const matrizConfusao: Record<string, Record<string, number>> = {};
  for (const c1 of classesPermitidas) {
    matrizConfusao[c1] = {};
    for (const c2 of classesPermitidas) {
      matrizConfusao[c1][c2] = 0;
    }
  }

  if (n === 0) {
    return {
      kappa: 0,
      po: 0,
      pe: 0,
      grau: "pobre",
      operacional: false,
      intervaloConfianca95: [0, 0],
      alertaBloqueante: "ALERTA BLOQUEANTE: Nenhum par de observações fornecido para medição de concordância.",
      matrizConfusao,
      classes: classesPermitidas,
      nObservacoes: 0,
    };
  }

  // Preencher matriz de confusão
  let concordanciasObservadas = 0;
  for (const par of pares) {
    if (!matrizConfusao[par.observador1]) {
      matrizConfusao[par.observador1] = {};
    }
    matrizConfusao[par.observador1][par.observador2] = (matrizConfusao[par.observador1][par.observador2] || 0) + 1;

    if (par.observador1 === par.observador2) {
      concordanciasObservadas++;
    }
  }

  const po = concordanciasObservadas / n;

  // Proporções marginais de cada observador
  let pe = 0;
  for (const c of classesPermitidas) {
    let totalObs1 = 0;
    let totalObs2 = 0;
    for (const cOther of classesPermitidas) {
      totalObs1 += matrizConfusao[c]?.[cOther] || 0;
      totalObs2 += matrizConfusao[cOther]?.[c] || 0;
    }
    const prop1 = totalObs1 / n;
    const prop2 = totalObs2 / n;
    pe += prop1 * prop2;
  }

  let kappa = 0;
  if (Math.abs(1 - pe) < 1e-9) {
    // Se o acaso prevê 100% (ex: todas as amostras foram na mesma classe)
    kappa = Math.abs(po - 1) < 1e-9 ? 1.0 : 0.0;
  } else {
    kappa = (po - pe) / (1 - pe);
  }

  // Erro padrão assintótico de Fleiss (Fleiss, Levin & Paik, 2003)
  const denominador = (1 - pe);
  let erroPadrao = 0;
  if (denominador > 0 && po < 1) {
    erroPadrao = Math.sqrt((po * (1 - po)) / (n * Math.pow(denominador, 2)));
  }

  const limiteInferior = Math.max(-1, kappa - 1.96 * erroPadrao);
  const limiteSuperior = Math.min(1, kappa + 1.96 * erroPadrao);

  const grau = classificarLandisKoch(kappa);
  const operacional = kappa >= 0.60;

  let alertaBloqueante: string | undefined = undefined;
  if (!operacional) {
    alertaBloqueante = `ALERTA BLOQUEANTE: Índice Kappa de Cohen (${kappa.toFixed(3)}) inferior a 0.60 ` +
      `(patamar mínimo de concordância substancial de Landis & Koch, 1977). ` +
      `O critério de rotulagem não está operacional e precisa ser revisto antes da coleta em escala.`;
  }

  return {
    kappa: Number(kappa.toFixed(4)),
    po: Number(po.toFixed(4)),
    pe: Number(pe.toFixed(4)),
    grau,
    operacional,
    intervaloConfianca95: [Number(limiteInferior.toFixed(4)), Number(limiteSuperior.toFixed(4))],
    alertaBloqueante,
    matrizConfusao,
    classes: classesPermitidas,
    nObservacoes: n,
  };
}

/**
 * Valida a consistência de um objeto Rotulo.
 * Rejeita rótulos sem modalidade, observador, data de observação ou classe válida.
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
  if (!rotulo.classe || !TODAS_CLASSES_ROTULO.includes(rotulo.classe)) {
    return { valido: false, motivo: `Classe de rótulo "${rotulo.classe}" não reconhecida.` };
  }
  return { valido: true };
}

/**
 * Resolve divergências entre dois observadores, com opção de desempate por um terceiro observador.
 *
 * Regras metodológicas:
 * 1. Se obs1 e obs2 concordam -> divergência: "nenhuma".
 * 2. Se obs1 e obs2 discordam e há obs3:
 *    - Se obs3 concorda com obs1 -> divergência: "resolvida-por-terceiro", prevalece obs1.
 *    - Se obs3 concorda com obs2 -> divergência: "resolvida-por-terceiro", prevalece obs2.
 *    - Se os 3 discordam entre si -> divergência: "pendente".
 * 3. Se obs1 e obs2 discordam e não há obs3 -> divergência: "pendente".
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

  // Concordância direta
  if (obs1.classe === obs2.classe) {
    return {
      final: {
        ...obs1,
        // Cego se ambos foram cegos; observações unificadas
        cego: obs1.cego && obs2.cego,
        confianca: obs1.confianca === obs2.confianca ? obs1.confianca : "media",
        observacoes: [obs1.observacoes, obs2.observacoes].filter(Boolean).join(" | "),
      },
      origens,
      divergencia: "nenhuma",
    };
  }

  // Discordância com terceiro observador (desempate)
  if (obs3) {
    if (obs3.classe === obs1.classe) {
      return {
        final: {
          ...obs1,
          cego: obs1.cego && obs3.cego,
          observacoes: `[Desempate: ${obs3.observador} concordou com ${obs1.observador}] ${obs1.observacoes || ""}`.trim(),
        },
        origens,
        divergencia: "resolvida-por-terceiro",
      };
    }
    if (obs3.classe === obs2.classe) {
      return {
        final: {
          ...obs2,
          cego: obs2.cego && obs3.cego,
          observacoes: `[Desempate: ${obs3.observador} concordou com ${obs2.observador}] ${obs2.observacoes || ""}`.trim(),
        },
        origens,
        divergencia: "resolvida-por-terceiro",
      };
    }

    // 3 opiniões distintas
    return {
      final: obs1, // mantido provisoriamente, mas marcado como pendente
      origens,
      divergencia: "pendente",
    };
  }

  // Discordância sem terceiro observador
  return {
    final: obs1,
    origens,
    divergencia: "pendente",
  };
}
