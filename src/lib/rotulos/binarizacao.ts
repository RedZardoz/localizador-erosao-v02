/**
 * Binarização canônica de rótulos conforme D26 e D03 (DEC-3c, DEC-4a).
 * ÚNICA fonte de verdade para binarização em todo o repositório.
 */

export const LIMIAR_FRACAO_D26 = 0.25;

export class ErroRotuloInvalido extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroRotuloInvalido";
  }
}

/**
 * Binariza fração erodida contínua [0, 1] de acordo com D26 (limiar >= 0.25 -> 1).
 * Lança erro se o valor não for finito ou estiver fora do intervalo [0, 1].
 */
export function binarizarFracao(fracao: number): 0 | 1 {
  if (typeof fracao !== "number" || !Number.isFinite(fracao) || isNaN(fracao)) {
    throw new ErroRotuloInvalido(`Fração erodida não numérica ou não finita: ${fracao}`);
  }
  if (fracao < 0 || fracao > 1) {
    throw new ErroRotuloInvalido(`Fração erodida fora do domínio [0, 1]: ${fracao}`);
  }
  return fracao >= LIMIAR_FRACAO_D26 ? 1 : 0;
}

/**
 * Normaliza string removendo espaços externos e acentuação, e convertendo para minúsculas.
 */
function normalizarTexto(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Binariza rótulo ordinal de acordo com o vocabulário canônico (D03 e DEC-3c).
 * - "ausente" -> 0
 * - "incipiente", "moderada", "severa" -> 1
 * - Aliases legados exatos: "presente", "erosao", "erosão", "1" -> 1
 * Qualquer outro texto (incluindo "controle", "spd", "0", "sem erosão", "indeterminado") lança ErroRotuloInvalido (DP-10).
 */
export function binarizarOrdinal(classe: string): 0 | 1 {
  if (typeof classe !== "string") {
    throw new ErroRotuloInvalido(`Classe de rótulo inválida: ${classe}`);
  }

  const norm = normalizarTexto(classe);

  if (norm === "ausente") {
    return 0;
  }

  if (
    norm === "incipiente" ||
    norm === "moderada" ||
    norm === "severa" ||
    norm === "presente" ||
    norm === "erosao" ||
    norm === "1"
  ) {
    return 1;
  }

  throw new ErroRotuloInvalido(
    `Classe de rótulo '${classe}' não mapeável para alvo binário (DP-10/DEC-3)`
  );
}
