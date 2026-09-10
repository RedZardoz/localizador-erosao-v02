/**
 * ============================================================================
 * Guarda Antissintético — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * CORRIGE O ACHADO I2 DA AUDITORIA:
 * Impede que pontos de teste ou fixtures sintéticas (como o conjunto de 150
 * linhas idênticas usado para testar o Invariante 7) vazem para qualquer
 * artefato de exportação (XLSX, CSV, Dossiê, Matriz de Treino ou Campo).
 */

import { PontoAmostral } from "@/types/ponto";

export class ErroPontoSinteticoDetectado extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroPontoSinteticoDetectado";
  }
}

/**
 * Verifica se um ponto individual é sintético / gerado para teste.
 */
export function ehPontoSintetico(ponto: PontoAmostral): boolean {
  if (ponto.origemSintetica === true) {
    return true;
  }
  // IDs ou códigos com prefixos reservados de teste
  if (ponto.id.startsWith("TEST-") || ponto.id.startsWith("SYNTHETIC-")) {
    return true;
  }
  if (ponto.codigo.startsWith("TEST-") || ponto.codigo.startsWith("SINT-")) {
    return true;
  }
  return false;
}

/**
 * Retorna true se houver qualquer ponto sintético na lista.
 */
export function contemPontoSintetico(pontos: PontoAmostral[]): boolean {
  return pontos.some(ehPontoSintetico);
}

/**
 * Assegura que nenhum ponto sintético avance para exportação real.
 * Lança ErroPontoSinteticoDetectado caso detecte dados sintéticos.
 */
export function assegurarApenasPontosReais(pontos: PontoAmostral[], contextoOperacao: string = "exportação"): void {
  const pontosSinteticos = pontos.filter(ehPontoSintetico);
  if (pontosSinteticos.length > 0) {
    const codigos = pontosSinteticos.slice(0, 5).map(p => p.codigo).join(", ");
    const sufixo = pontosSinteticos.length > 5 ? ` (+${pontosSinteticos.length - 5} outros)` : "";
    throw new ErroPontoSinteticoDetectado(
      `Operação de ${contextoOperacao} abortada: o conjunto contém ${pontosSinteticos.length} ponto(s) sintético(s) de teste [${codigos}${sufixo}]. Dados sintéticos nunca podem alcançar arquivos exportados ou matrizes de treino.`
    );
  }
}
