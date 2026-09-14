/**
 * ============================================================================
 * Taxa de Erro da Interpretação Visual (A x B) — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * ESPECIFICAÇÃO CIENTÍFICA (PLANO V3, §12.3 E PLANEJAMENTO V3 §8, FASE C):
 * Na subamostra que possui AMBOS os rótulos:
 * - Fase A (fotointerpretação visual de imagem satélite)
 * - Fase B (auditoria de verdade de campo)
 *
 * Calcula a matriz de confusão A x B e a taxa de erro por classe da fotointerpretação,
 * permitindo a calibração de pesos amostrais ou ponderação na modelagem supervisionada.
 * Apenas pontos com ambas as modalidades são computados.
 */

import { Rotulo } from "@/types/rotulo";

export interface TaxaErroClasse {
  classe: string;
  totalAmostrasCampo: number;
  acertosInterpretacao: number;
  errosInterpretacao: number;
  taxaErroPct: number; // (erros / total) * 100
}

export interface RelatorioTaxaErroInterpretacao {
  totalPontosCruzados: number;
  matrizConfusaoAxB: Record<string, Record<string, number>>; // [campo][interpretacao]
  taxasPorClasse: Record<string, TaxaErroClasse>;
  acuraciaGlobalPct: number;
}

/**
 * Calcula a matriz de confusão e taxas de erro entre fotointerpretação (A) e campo (B).
 */
export function calcularTaxaErroInterpretacao(
  pares: { pontoCodigo: string; rotuloCampo: Rotulo; rotuloInterpretacao: Rotulo }[],
  classesPermitidas: string[]
): RelatorioTaxaErroInterpretacao {
  const matriz: Record<string, Record<string, number>> = {};
  for (const cCampo of classesPermitidas) {
    matriz[cCampo] = {};
    for (const cInterp of classesPermitidas) {
      matriz[cCampo][cInterp] = 0;
    }
  }

  let totalAcertos = 0;

  for (const par of pares) {
    const cB = par.rotuloCampo.classe;
    const cA = par.rotuloInterpretacao.classe;

    if (!matriz[cB]) {
      matriz[cB] = {};
    }
    const vAtual = matriz[cB][cA];
    matriz[cB][cA] = typeof vAtual === "number" ? vAtual + 1 : 1;

    if (cB === cA) {
      totalAcertos++;
    }
  }

  const taxasPorClasse: Record<string, TaxaErroClasse> = {};

  for (const c of classesPermitidas) {
    let totalCampo = 0;
    let acertos = 0;

    for (const cInterp of classesPermitidas) {
      const v = matriz[c]?.[cInterp];
      const qtd = typeof v === "number" ? v : 0;
      totalCampo += qtd;
      if (cInterp === c) {
        acertos = qtd;
      }
    }

    const erros = totalCampo - acertos;
    const taxaPct = totalCampo > 0 ? Number(((erros / totalCampo) * 100).toFixed(2)) : 0;

    taxasPorClasse[c] = {
      classe: c,
      totalAmostrasCampo: totalCampo,
      acertosInterpretacao: acertos,
      errosInterpretacao: erros,
      taxaErroPct: taxaPct,
    };
  }

  const n = pares.length;
  const acuraciaGlobal = n > 0 ? Number(((totalAcertos / n) * 100).toFixed(2)) : 0;

  return {
    totalPontosCruzados: n,
    matrizConfusaoAxB: matriz,
    taxasPorClasse,
    acuraciaGlobalPct: acuraciaGlobal,
  };
}
