/**
 * ============================================================================
 * Análise do Pool de Candidatos por Estrato e Disponibilidade de Reservas
 * SAREL v2.0 — Protocolo de Negação de Acesso (DP-20)
 * ============================================================================
 *
 * SIMPLIFICAÇÃO METODOLÓGICA:
 * A suposição de recusas independentes entre propriedades é uma simplificação
 * metodológica: recusas podem apresentar correlação espacial ou social
 * (ex.: vizinhança, cooperativa, perfil fundiário).
 */

export const SIMPLIFICACAO_METODOLOGICA_RECUSAS =
  "A suposição de recusas independentes entre propriedades é uma simplificação metodológica: " +
  "recusas podem apresentar correlação espacial ou social (ex.: vizinhança, cooperativa, perfil fundiário).";

export interface ParametrosAnalisePool {
  reservasPorEstrato: number;
  nMinimoPorEstrato: number;
  taxasRecusa: number[];
}

export interface ResultadoEstratoPool {
  estrato: string;
  Nh: number;
  N_h: number;
  titularesExigidos: 4;
  reservasPossiveis: number;
  reservasEfetivas: number;
  ok: boolean;
  inviavel: boolean;
  probabilidadesPorTaxa: Record<number, number>;
}

export interface ResumoAnalisePool {
  totalCandidatos: number;
  totalEstratos: number;
  estratosOk: number;
  estratosDeficientes: number;
  estratosInviaveis: number;
  reservasPorEstrato: number;
  nMinimoPorEstrato: number;
  taxasRecusa: number[];
}

export type ResultadoAnalisePool = Record<string, ResultadoEstratoPool> & {
  estratos: Record<string, ResultadoEstratoPool>;
  simplificacaoMetodologica: string;
  resumo: ResumoAnalisePool;
};

/**
 * Calcula o coeficiente binomial C(n, k) = n! / (k! * (n - k)!).
 */
export function combinacao(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  const m = Math.min(k, n - k);
  let c = 1;
  for (let i = 1; i <= m; i++) {
    c = (c * (n - i + 1)) / i;
  }
  return Math.round(c);
}

/**
 * Calcula a probabilidade acumulada P(X >= k) para X ~ Binomial(n, pSucesso).
 * Fórmula: P(X >= k) = sum_{j=k}^{n} C(n, j) * pSucesso^j * (1 - pSucesso)^(n - j).
 */
export function calcularProbabilidadeBinomialAcumulada(
  n: number,
  k: number,
  pSucesso: number
): number {
  if (k <= 0) return 1.0;
  if (k > n) return 0.0;
  if (pSucesso <= 0) {
    return k <= 0 ? 1.0 : 0.0;
  }
  if (pSucesso >= 1) {
    return k <= n ? 1.0 : 0.0;
  }

  const pFracasso = 1 - pSucesso;
  let soma = 0;
  for (let j = k; j <= n; j++) {
    const c = combinacao(n, j);
    const termo = c * Math.pow(pSucesso, j) * Math.pow(pFracasso, n - j);
    soma += termo;
  }

  // Garantir limites numéricos [0, 1]
  if (soma <= 0) return 0.0;
  if (soma >= 1) return 1.0;
  return soma;
}

/**
 * Função pura que avalia a disponibilidade do pool de candidatos por estrato
 * e calcula cenários analíticos de taxa de recusa sob modelo binomial.
 *
 * Parâmetros são estritamente obrigatórios (sem padrões embutidos).
 */
export function analisarPoolPorEstrato(
  contagemPorEstrato: Record<string, number>,
  parametros: ParametrosAnalisePool
): ResultadoAnalisePool {
  if (!parametros || typeof parametros !== "object") {
    throw new Error(
      "[PARAMETROS_OBRIGATORIOS_AUSENTES] Objeto de parâmetros de análise do pool é obrigatório."
    );
  }

  const { reservasPorEstrato, nMinimoPorEstrato, taxasRecusa } = parametros;

  if (
    typeof reservasPorEstrato !== "number" ||
    !Number.isInteger(reservasPorEstrato) ||
    reservasPorEstrato < 0
  ) {
    throw new Error(
      `[PARAMETRO_OBRIGATORIO_AUSENTE:reservasPorEstrato] 'reservasPorEstrato' é obrigatório e deve ser inteiro >= 0 (recebido: ${reservasPorEstrato}).`
    );
  }

  if (
    typeof nMinimoPorEstrato !== "number" ||
    !Number.isInteger(nMinimoPorEstrato) ||
    nMinimoPorEstrato < 1 ||
    nMinimoPorEstrato > 4
  ) {
    throw new Error(
      `[PARAMETRO_OBRIGATORIO_AUSENTE:nMinimoPorEstrato] 'nMinimoPorEstrato' é obrigatório e deve ser inteiro entre 1 e 4 (recebido: ${nMinimoPorEstrato}).`
    );
  }

  if (
    !Array.isArray(taxasRecusa) ||
    taxasRecusa.length === 0 ||
    taxasRecusa.some(
      (p) => typeof p !== "number" || Number.isNaN(p) || p < 0 || p > 1
    )
  ) {
    throw new Error(
      `[PARAMETRO_OBRIGATORIO_AUSENTE:taxasRecusa] 'taxasRecusa' é obrigatório e deve ser lista não-vazia de números em [0, 1] (recebido: ${JSON.stringify(taxasRecusa)}).`
    );
  }

  if (
    !contagemPorEstrato ||
    typeof contagemPorEstrato !== "object" ||
    Object.keys(contagemPorEstrato).length === 0
  ) {
    throw new Error(
      "[CONTAGEM_INVALIDA] 'contagemPorEstrato' é obrigatório e não pode ser vazio."
    );
  }

  const estratosMap: Record<string, ResultadoEstratoPool> = {};
  let totalCandidatos = 0;
  let estratosOk = 0;
  let estratosInviaveis = 0;
  let estratosDeficientes = 0;

  for (const [estrato, contagemBruta] of Object.entries(contagemPorEstrato)) {
    const Nh = Number(contagemBruta);
    if (!Number.isInteger(Nh) || Nh < 0) {
      throw new Error(
        `[CONTAGEM_INVALIDA] Contagem do estrato '${estrato}' deve ser inteiro >= 0 (recebido: ${contagemBruta}).`
      );
    }

    totalCandidatos += Nh;
    const inviavel = Nh < 4;
    if (inviavel) {
      estratosInviaveis++;
    }

    const excedente = Nh - 4;
    const reservasPossiveis = excedente > 0 ? excedente : 0;
    const reservasEfetivas = Math.min(reservasPorEstrato, reservasPossiveis);
    const ok = Nh >= 4 + reservasPorEstrato;

    if (ok) {
      estratosOk++;
    } else {
      estratosDeficientes++;
    }

    // X ~ Binomial(4 + reservasEfetivas, 1 - p)
    const nEnsaios = 4 + reservasEfetivas;
    const probabilidadesPorTaxa: Record<number, number> = {};

    for (const p of taxasRecusa) {
      const pSucesso = 1 - p;
      probabilidadesPorTaxa[p] = calcularProbabilidadeBinomialAcumulada(
        nEnsaios,
        nMinimoPorEstrato,
        pSucesso
      );
    }

    const item: ResultadoEstratoPool = {
      estrato,
      Nh,
      N_h: Nh,
      titularesExigidos: 4,
      reservasPossiveis,
      reservasEfetivas,
      ok,
      inviavel,
      probabilidadesPorTaxa,
    };

    estratosMap[estrato] = item;
  }

  const chavesEstratos = Object.keys(estratosMap);
  const resumo: ResumoAnalisePool = {
    totalCandidatos,
    totalEstratos: chavesEstratos.length,
    estratosOk,
    estratosDeficientes,
    estratosInviaveis,
    reservasPorEstrato,
    nMinimoPorEstrato,
    taxasRecusa,
  };

  const resultadoFinal = {
    ...estratosMap,
    estratos: estratosMap,
    simplificacaoMetodologica: SIMPLIFICACAO_METODOLOGICA_RECUSAS,
    resumo,
  } as ResultadoAnalisePool;

  return resultadoFinal;
}
