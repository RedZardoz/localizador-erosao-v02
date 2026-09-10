/**
 * ============================================================================
 * Ingestão de Interpretação Visual — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * Conforme §11.2 do Plano v2 e Fases A/B do Planejamento v3:
 * Ingestão de rotulagem por interpretação visual com 2 intérpretes independentes,
 * cálculo de concordância Kappa de Cohen e consolidação com resolução de divergência.
 */

import {
  ItemInterpretacaoVisual,
  ResultadoKappa,
  Rotulo,
  RotuloConsolidado,
} from "@/types/rotulo";
import {
  calcularKappaCohen,
  ParRotulo,
  resolverDivergencia,
  validarRotulo,
} from "./concordancia";

export interface ResultadoIngestaoInterpretacao {
  totalEntradas: number;
  pontosProcessados: number;
  consolidados: Record<string, RotuloConsolidado>;
  pendenciasDivergencia: string[]; // códigos dos pontos que necessitam desempate
  concordancia?: ResultadoKappa;
  avisosQualidade: string[];
  erros: string[];
}

/**
 * Processa lote de registros de fotointerpretação visual independente.
 */
export function ingestarInterpretacaoVisual(
  itens: ItemInterpretacaoVisual[]
): ResultadoIngestaoInterpretacao {
  const avisosQualidade: string[] = [];
  const erros: string[] = [];
  const agrupadosPorPonto: Record<string, Rotulo[]> = {};

  let totalEntradasValidas = 0;

  for (let idx = 0; idx < itens.length; idx++) {
    const item = itens[idx];
    const linhaNum = idx + 1;

    if (!item.codigoPonto || item.codigoPonto.trim().length === 0) {
      erros.push(`Entrada #${linhaNum}: Identificador 'codigoPonto' ausente.`);
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
      erros.push(`Ponto ${item.codigoPonto} (entrada #${linhaNum}): ${validacao.motivo}`);
      continue;
    }

    // Sinalização de não-cegueira (Auditoria B3 e Regra 4)
    if (!rotulo.cego) {
      avisosQualidade.push(
        `AVISO DE QUALIDADE: Rótulo do ponto ${item.codigoPonto} pelo intérprete '${rotulo.observador}' foi realizado em modo NÃO-CEGO (cego: false).`
      );
    }

    if (!agrupadosPorPonto[item.codigoPonto]) {
      agrupadosPorPonto[item.codigoPonto] = [];
    }

    // Evitar que o mesmo observador rotule o mesmo ponto duas vezes
    const jaObservou = agrupadosPorPonto[item.codigoPonto].some(
      (r) => r.observador.toLowerCase() === rotulo.observador.toLowerCase()
    );
    if (jaObservou) {
      avisosQualidade.push(
        `AVISO: Observador '${rotulo.observador}' já rotulou o ponto ${item.codigoPonto}. Observação duplicada ignorada.`
      );
      continue;
    }

    agrupadosPorPonto[item.codigoPonto].push(rotulo);
    totalEntradasValidas++;
  }

  const consolidados: Record<string, RotuloConsolidado> = {};
  const pendenciasDivergencia: string[] = [];
  const paresKappa: ParRotulo[] = [];

  const codigosPontos = Object.keys(agrupadosPorPonto);

  for (const codigo of codigosPontos) {
    const observacoes = agrupadosPorPonto[codigo];

    if (observacoes.length === 1) {
      // Apenas um observador (aguardando segundo para validação do par)
      consolidados[codigo] = {
        final: observacoes[0],
        origens: observacoes,
        divergencia: "pendente",
      };
      avisosQualidade.push(
        `Ponto ${codigo}: Possui apenas 1 interpretação (de '${observacoes[0].observador}'). Aguardando 2º intérprete independente.`
      );
    } else if (observacoes.length === 2) {
      paresKappa.push({
        observador1: observacoes[0].classe,
        observador2: observacoes[1].classe,
      });

      const cons = resolverDivergencia(observacoes[0], observacoes[1]);
      consolidados[codigo] = cons;

      if (cons.divergencia === "pendente") {
        pendenciasDivergencia.push(codigo);
        avisosQualidade.push(
          `DIVERGÊNCIA PENDENTE no ponto ${codigo}: ${observacoes[0].observador} (${observacoes[0].classe}) vs ${observacoes[1].observador} (${observacoes[1].classe}). Necessita 3º observador para desempate.`
        );
      }
    } else if (observacoes.length >= 3) {
      // 3 observadores: usa os 2 primeiros para análise pareada se ainda não incluídos, e o terceiro para desempate
      paresKappa.push({
        observador1: observacoes[0].classe,
        observador2: observacoes[1].classe,
      });

      const cons = resolverDivergencia(observacoes[0], observacoes[1], observacoes[2]);
      consolidados[codigo] = cons;

      if (cons.divergencia === "pendente") {
        pendenciasDivergencia.push(codigo);
        avisosQualidade.push(
          `DIVERGÊNCIA TRIPLA PENDENTE no ponto ${codigo}: Os três observadores divergiram integralmente.`
        );
      }
    }
  }

  let concordancia: ResultadoKappa | undefined = undefined;
  if (paresKappa.length > 0) {
    concordancia = calcularKappaCohen(paresKappa);
    if (!concordancia.operacional && concordancia.alertaBloqueante) {
      erros.push(concordancia.alertaBloqueante);
    }
  }

  return {
    totalEntradas: totalEntradasValidas,
    pontosProcessados: codigosPontos.length,
    consolidados,
    pendenciasDivergencia,
    concordancia,
    avisosQualidade,
    erros,
  };
}
