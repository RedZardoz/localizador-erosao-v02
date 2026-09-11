/**
 * ============================================================================
 * Ingestão de Interpretação Visual — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * ESPECIFICAÇÃO (PLANO V3, §12.1):
 * - Ingestão de fotointerpretação da Fase A com dois intérpretes independentes.
 * - Consolidação estrita com cálculo de concordância Kappa de Cohen.
 * - Divergências sem resolução ficam como 'pendente' com final: null (não entram no treino).
 */

import { Rotulo, RotuloConsolidado } from "@/types/rotulo";
import {
  calcularKappaCohen,
  ParRotulo,
  resolverDivergencia,
  validarRotulo,
  ResultadoKappa,
} from "./concordancia";

export interface ItemInterpretacaoVisual {
  codigoPonto: string;
  classe: string;
  observador: string;
  observadoEm: string;
  cego?: boolean;
  confianca?: "alta" | "media" | "baixa";
  observacoes?: string;
}

export interface ResultadoIngestaoInterpretacao {
  totalEntradas: number;
  pontosProcessados: number;
  consolidados: Record<string, RotuloConsolidado>;
  pendenciasDivergencia: string[];
  concordancia?: ResultadoKappa;
  avisosQualidade: string[];
  erros: string[];
}

export function ingestarInterpretacaoVisual(
  itens: ItemInterpretacaoVisual[],
  classesPermitidas: string[]
): ResultadoIngestaoInterpretacao {
  const avisosQualidade: string[] = [];
  const erros: string[] = [];
  const agrupadosPorPonto: Record<string, Rotulo[]> = {};

  for (let idx = 0; idx < itens.length; idx++) {
    const item = itens[idx];
    const linha = idx + 1;

    if (!item.codigoPonto || item.codigoPonto.trim().length === 0) {
      erros.push(`Entrada #${linha}: 'codigoPonto' ausente.`);
      continue;
    }

    const rotulo: Rotulo = {
      classe: item.classe,
      modalidade: "interpretacao-visual",
      observador: item.observador,
      observadoEm: item.observadoEm,
      confianca: item.confianca,
      observacoes: item.observacoes,
      cego: item.cego ?? true,
    };

    const validacao = validarRotulo(rotulo);
    if (!validacao.valido) {
      erros.push(`Ponto ${item.codigoPonto} (entrada #${linha}): ${validacao.motivo}`);
      continue;
    }

    if (!rotulo.cego) {
      avisosQualidade.push(
        `AVISO DE QUALIDADE: Rótulo do ponto ${item.codigoPonto} pelo intérprete '${rotulo.observador}' foi realizado em modo NÃO-CEGO (cego: false).`
      );
    }

    if (!agrupadosPorPonto[item.codigoPonto]) {
      agrupadosPorPonto[item.codigoPonto] = [];
    }

    // Evita duplicata do mesmo observador no mesmo ponto
    const jaExiste = agrupadosPorPonto[item.codigoPonto].some(
      (r) => r.observador.toLowerCase() === rotulo.observador.toLowerCase()
    );
    if (jaExiste) {
      avisosQualidade.push(
        `AVISO: Observador '${rotulo.observador}' duplicado no ponto ${item.codigoPonto}. Segunda entrada descartada.`
      );
      continue;
    }

    agrupadosPorPonto[item.codigoPonto].push(rotulo);
  }

  const consolidados: Record<string, RotuloConsolidado> = {};
  const pendenciasDivergencia: string[] = [];
  const paresKappa: ParRotulo[] = [];

  for (const [codigo, obsList] of Object.entries(agrupadosPorPonto)) {
    if (obsList.length === 1) {
      // Ponto com apenas 1 observador
      consolidados[codigo] = {
        final: obsList[0],
        origens: obsList,
        kappa: null,
        divergencia: "nenhuma",
        papelConjunto: "treino",
      };
      avisosQualidade.push(`Ponto ${codigo} possui apenas 1 leitura de interpretação visual.`);
    } else if (obsList.length === 2) {
      paresKappa.push({ observador1: obsList[0].classe, observador2: obsList[1].classe });
      const cons = resolverDivergencia(obsList[0], obsList[1]);
      consolidados[codigo] = cons;
      if (cons.divergencia === "pendente") {
        pendenciasDivergencia.push(codigo);
      }
    } else if (obsList.length >= 3) {
      paresKappa.push({ observador1: obsList[0].classe, observador2: obsList[1].classe });
      const cons = resolverDivergencia(obsList[0], obsList[1], obsList[2]);
      consolidados[codigo] = cons;
      if (cons.divergencia === "pendente") {
        pendenciasDivergencia.push(codigo);
      }
    }
  }

  const concordancia = paresKappa.length > 0 ? calcularKappaCohen(paresKappa, classesPermitidas) : undefined;

  return {
    totalEntradas: itens.length,
    pontosProcessados: Object.keys(agrupadosPorPonto).length,
    consolidados,
    pendenciasDivergencia,
    concordancia,
    avisosQualidade,
    erros,
  };
}
