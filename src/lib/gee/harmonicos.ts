/**
 * ============================================================================
 * Ajuste de Modelos Harmônicos sobre Séries Temporais — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * FUNDAMENTAÇÃO:
 * - Compressão harmônica de séries temporais (Zhu & Woodcock, 2014; CCDC).
 * - Termo de tendência no SWIR (B12): eixos da degradação física do solo.
 *
 * DECISÃO D03:
 * - Modelo padrão: 1 harmônico anual (4 termos: offset, tendência, cos(2pi t), sin(2pi t)).
 * - Opção estendida: 2 harmônicos (6 termos: inclui cos(4pi t) e sin(4pi t)).
 *
 * QUALIDADE DO AJUSTE:
 * Todo coeficiente calculado carrega o objeto QualidadeAjuste com nObservacoes,
 * r2 e erroPadrao. Se as observações válidas forem inferiores ao mínimo (D11),
 * o retorno é obrigatoriamente "indisponivel" com causa "insuficiente".
 */

import { Proveniencia, QualidadeAjuste } from "@/types/proveniencia";
import { ObservacaoCena, NomeBandaEspectral } from "./serieTemporal";

export interface OpcoesAjusteHarmonico {
  nMinimoObservacoes?: number; // Padrão: 12
  usarDoisHarmonicos?: boolean; // Se true usa 6 termos, se false usa 4 termos (D03)
}

export interface CoeficientesHarmonicosBanda {
  offset: Proveniencia<number>;
  tendencia: Proveniencia<number>;
  amplitudeAnual: Proveniencia<number>;
  faseAnual: Proveniencia<number>;
  amplitudeSemianual?: Proveniencia<number>;
}

/**
 * Ajusta o modelo harmônico para uma banda espectral específica.
 */
export function ajustarHarmonicosBanda(
  cenas: ObservacaoCena[],
  banda: NomeBandaEspectral,
  opcoes: OpcoesAjusteHarmonico = {}
): CoeficientesHarmonicosBanda {
  const nMin = opcoes.nMinimoObservacoes !== undefined ? opcoes.nMinimoObservacoes : 12;
  const doisHarmonicos = opcoes.usarDoisHarmonicos ?? false;
  const p = doisHarmonicos ? 6 : 4;

  // 1. Filtrar observações válidas (sem nuvem e com valor numérico finito)
  const paresValidos: { t: number; y: number }[] = [];
  for (const c of cenas) {
    if (!c.nuvemSombra) {
      const y = c[banda];
      if (y !== null && Number.isFinite(y)) {
        paresValidos.push({ t: c.tAnos, y });
      }
    }
  }

  const n = paresValidos.length;
  const nomeB = banda.toUpperCase();

  // Guarda de suficiência amostral (D11)
  if (n < nMin) {
    const motivoInsuficiente = `Série da banda ${nomeB} possui ${n} observações válidas (mínimo exigido: ${nMin}). Ajuste harmônico recusado.`;
    const indisp: Proveniencia<number> = {
      estado: "indisponivel",
      causa: "insuficiente",
      motivo: motivoInsuficiente,
    };
    const res: CoeficientesHarmonicosBanda = {
      offset: indisp,
      tendencia: indisp,
      amplitudeAnual: indisp,
      faseAnual: indisp,
    };
    if (doisHarmonicos) {
      res.amplitudeSemianual = indisp;
    }
    return res;
  }

  // 2. Montagem das equações normais (XtX * beta = XtY)
  const XtX: number[][] = Array.from({ length: p }, () => Array(p).fill(0));
  const XtY: number[] = Array(p).fill(0);

  for (const { t, y } of paresValidos) {
    const w1 = 2 * Math.PI * t;
    const row = doisHarmonicos
      ? [1, t, Math.cos(w1), Math.sin(w1), Math.cos(2 * w1), Math.sin(2 * w1)]
      : [1, t, Math.cos(w1), Math.sin(w1)];

    for (let i = 0; i < p; i++) {
      XtY[i] += row[i] * y;
      for (let j = 0; j < p; j++) {
        XtX[i][j] += row[i] * row[j];
      }
    }
  }

  // 3. Resolução via eliminação de Gauss com pivoteamento
  const beta = resolverSistemaLinear(XtX, XtY);

  if (!beta) {
    const indispSingular: Proveniencia<number> = {
      estado: "indisponivel",
      causa: "fora-do-dominio",
      motivo: `Matriz de covariância singular ao ajustar harmônicos de ${nomeB} (colinearidade temporal).`,
    };
    const res: CoeficientesHarmonicosBanda = {
      offset: indispSingular,
      tendencia: indispSingular,
      amplitudeAnual: indispSingular,
      faseAnual: indispSingular,
    };
    if (doisHarmonicos) res.amplitudeSemianual = indispSingular;
    return res;
  }

  // 4. Cálculo de Qualidade do Ajuste (R² e erro padrão)
  const yMedio = paresValidos.reduce((acc, par) => acc + par.y, 0) / n;
  let ssTot = 0;
  let ssRes = 0;

  for (const { t, y } of paresValidos) {
    const w1 = 2 * Math.PI * t;
    const yPred = doisHarmonicos
      ? beta[0] + beta[1] * t + beta[2] * Math.cos(w1) + beta[3] * Math.sin(w1) + beta[4] * Math.cos(2 * w1) + beta[5] * Math.sin(2 * w1)
      : beta[0] + beta[1] * t + beta[2] * Math.cos(w1) + beta[3] * Math.sin(w1);

    ssTot += Math.pow(y - yMedio, 2);
    ssRes += Math.pow(y - yPred, 2);
  }

  let r2Bruto = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  if (r2Bruto < 0) r2Bruto = 0;
  if (r2Bruto > 1) r2Bruto = 1;

  const grausLiberdade = n > p ? n - p : 1;
  const erroPadrao = Math.sqrt(ssRes / grausLiberdade);

  const qualidade: QualidadeAjuste = {
    nObservacoes: n,
    r2: Number(r2Bruto.toFixed(3)),
    erroPadrao: Number(erroPadrao.toFixed(4)),
  };

  const offsetVal = Number(beta[0].toFixed(4));
  const tendVal = Number(beta[1].toFixed(5));
  const ampAnualVal = Number(Math.sqrt(beta[2] * beta[2] + beta[3] * beta[3]).toFixed(4));
  const faseAnualVal = Number(Math.atan2(beta[3], beta[2]).toFixed(3));

  const modeloInfo = doisHarmonicos
    ? "Regressão Harmônica OLS (2 harmônicos, 6 parâmetros)"
    : "Regressão Harmônica OLS (1 harmônico anual, 4 parâmetros — D03)";
  const insumosInfo = [`serie_${nomeB}`];
  const decisoesInfo = ["D03"];

  const resultado: CoeficientesHarmonicosBanda = {
    offset: {
      estado: "modelado",
      valor: offsetVal,
      modelo: modeloInfo,
      insumos: insumosInfo,
      decisoes: decisoesInfo,
      qualidade,
    },
    tendencia: {
      estado: "modelado",
      valor: tendVal,
      modelo: modeloInfo,
      insumos: insumosInfo,
      decisoes: decisoesInfo,
      qualidade,
    },
    amplitudeAnual: {
      estado: "modelado",
      valor: ampAnualVal,
      modelo: modeloInfo,
      insumos: insumosInfo,
      decisoes: decisoesInfo,
      qualidade,
    },
    faseAnual: {
      estado: "modelado",
      valor: faseAnualVal,
      modelo: modeloInfo,
      insumos: insumosInfo,
      decisoes: decisoesInfo,
      qualidade,
    },
  };

  if (doisHarmonicos) {
    const ampSemiVal = Number(Math.sqrt(beta[4] * beta[4] + beta[5] * beta[5]).toFixed(4));
    resultado.amplitudeSemianual = {
      estado: "modelado",
      valor: ampSemiVal,
      modelo: modeloInfo,
      insumos: insumosInfo,
      decisoes: decisoesInfo,
      qualidade,
    };
  }

  return resultado;
}

/**
 * Constrói o mapa consolidado de coeficientes harmônicos de BlocoSerie["harmonicos"].
 * Gera chaves padronizadas como "B12_amplitudeAnual", "B12_tendencia", "B12_offset", "B12_faseAnual".
 */
export function construirHarmonicosBloco(
  cenas: ObservacaoCena[],
  bandas: NomeBandaEspectral[] = ["b12", "b11", "b4"],
  opcoes: OpcoesAjusteHarmonico = {}
): Record<string, Proveniencia<number>> {
  const mapa: Record<string, Proveniencia<number>> = {};

  for (const b of bandas) {
    const prefixo = b.toUpperCase();
    const coef = ajustarHarmonicosBanda(cenas, b, opcoes);

    mapa[`${prefixo}_offset`] = coef.offset;
    mapa[`${prefixo}_tendencia`] = coef.tendencia;
    mapa[`${prefixo}_amplitudeAnual`] = coef.amplitudeAnual;
    mapa[`${prefixo}_faseAnual`] = coef.faseAnual;

    if (coef.amplitudeSemianual) {
      mapa[`${prefixo}_amplitudeSemianual`] = coef.amplitudeSemianual;
    }
  }

  return mapa;
}

/**
 * Resolução de sistema Ax = b por Eliminação Gaussiana com Pivoteamento Parcial.
 */
function resolverSistemaLinear(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let k = 0; k < n; k++) {
    let maxRow = k;
    let maxVal = Math.abs(M[k][k]);
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(M[i][k]) > maxVal) {
        maxVal = Math.abs(M[i][k]);
        maxRow = i;
      }
    }

    if (maxVal < 1e-12) return null; // Matriz singular

    if (maxRow !== k) {
      const temp = M[k];
      M[k] = M[maxRow];
      M[maxRow] = temp;
    }

    for (let i = k + 1; i < n; i++) {
      const factor = M[i][k] / M[k][k];
      for (let j = k; j <= n; j++) {
        M[i][j] -= factor * M[k][j];
      }
    }
  }

  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = sum / M[i][i];
  }

  return x;
}
