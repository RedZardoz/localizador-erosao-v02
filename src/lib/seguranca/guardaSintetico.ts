import type { PontoAmostral } from "@/types/ponto";

export class ErroPontoSinteticoDetectado extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroPontoSinteticoDetectado";
  }
}

/**
 * Verifica se um ponto individual e sintetico / gerado para teste.
 */
export function ehPontoSintetico(ponto: PontoAmostral): boolean {
  if (ponto.origemSintetica === true) {
    return true;
  }
  if (ponto.id.startsWith("TEST-") || ponto.id.startsWith("SYNTHETIC-")) {
    return true;
  }
  if (ponto.codigo.startsWith("TEST-") || ponto.codigo.startsWith("SINT-")) {
    return true;
  }
  return false;
}

/**
 * Retorna true se houver qualquer ponto sintetico na lista.
 */
export function contemPontoSintetico(pontos: PontoAmostral[]): boolean {
  return pontos.some(ehPontoSintetico);
}

/**
 * Assegura que nenhum ponto sintetico avance para exportacao real ou persistencia.
 * Lanca ErroPontoSinteticoDetectado caso detecte dados sinteticos.
 */
export function assegurarApenasPontosReais(pontos: PontoAmostral[], contextoOperacao: string = "exportação"): void {
  const pontosSinteticos = pontos.filter(ehPontoSintetico);
  if (pontosSinteticos.length > 0) {
    const codigos = pontosSinteticos.slice(0, 5).map((p) => p.codigo).join(", ");
    const sufixo = pontosSinteticos.length > 5 ? ` (+${pontosSinteticos.length - 5} outros)` : "";
    throw new ErroPontoSinteticoDetectado(
      `Operação de ${contextoOperacao} abortada: o conjunto contém ${pontosSinteticos.length} ponto(s) sintético(s) de teste [${codigos}${sufixo}]. Dados sintéticos nunca podem alcançar arquivos exportados ou matrizes de treino.`
    );
  }
}
