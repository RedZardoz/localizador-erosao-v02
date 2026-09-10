/**
 * ============================================================================
 * Regressão Harmônica sobre Séries Temporais — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * FUNDAMENTAÇÃO (PLANEJAMENTO V3, §6.1):
 * Compressão por regressão harmônica com ajuste de senoide anual + semianual
 * e tendência linear (Zhu & Woodcock, 2014; CCDC).
 *
 * HIPÓTESE CIENTÍFICA:
 * A tendência linear de longo prazo no SWIR (B12) captura a degradação progressiva
 * do horizonte superficial do solo por erosão laminar ao longo dos anos.
 *
 * CORRIGE O ACHADO M2 DA AUDITORIA:
 * Cada coeficiente harmônico gerado carrega em sua Proveniencia<number> o
 * objeto QualidadeAjuste com nObservacoes, r2 e erroPadrao. Séries com muitas
 * lacunas de nuvem produzem coeficientes mal condicionados; a qualidade do
 * ajuste é parte obrigatória do dado científico.
 */

import { Proveniencia, QualidadeAjuste } from "@/types/proveniencia";
import { ObservacaoEspectral } from "./serieTemporal";

export interface CoeficientesHarmonicos {
  offset: Proveniencia<number>;
  tendencia: Proveniencia<number>;
  amplitudeAnual: Proveniencia<number>;
  faseAnual: Proveniencia<number>;
  amplitudeSemianual: Proveniencia<number>;
}

/**
 * Executa regressão linear multivariada por Mínimos Quadrados Ordinários (OLS).
 * y = beta_0 + beta_1 * t + beta_2 * cos(2pi t) + beta_3 * sin(2pi t) + beta_4 * cos(4pi t) + beta_5 * sin(4pi t)
 */
export function ajustarModeloHarmonico(
  observacoes: ObservacaoEspectral[],
  obterValorBanda: (obs: ObservacaoEspectral) => number | null,
  nomeVariavel: string = "B12"
): CoeficientesHarmonicos {
  // 1. Filtragem de observações válidas (sem nuvem e com valor numérico)
  const paresValidos: { t: number; y: number }[] = [];

  for (const obs of observacoes) {
    if (!obs.nuvemSombra) {
      const y = obterValorBanda(obs);
      if (y !== null && Number.isFinite(y) && !isNaN(y)) {
        paresValidos.push({ t: obs.tAnos, y });
      }
    }
  }

  const n = paresValidos.length;

  // Guarda de suficiência amostral: exige ao menos 12 observações distribuídas
  if (n < 12) {
    const motivoIndisp = `Série de ${nomeVariavel} possui apenas ${n} observações válidas (mínimo exigido: 12). Ajuste harmônico mal condicionado rejeitado para evitar artefatos.`;
    return {
      offset: { estado: "indisponivel", motivo: motivoIndisp },
      tendencia: { estado: "indisponivel", motivo: motivoIndisp },
      amplitudeAnual: { estado: "indisponivel", motivo: motivoIndisp },
      faseAnual: { estado: "indisponivel", motivo: motivoIndisp },
      amplitudeSemianual: { estado: "indisponivel", motivo: motivoIndisp },
    };
  }

  // 2. Montagem da Matriz de Desenho X (n x 6) e vetor Y (n x 1)
  // Colunas de X: [1, t, cos(2pi t), sin(2pi t), cos(4pi t), sin(4pi t)]
  const p = 6;
  const XtX: number[][] = Array.from({ length: p }, () => Array(p).fill(0));
  const XtY: number[] = Array(p).fill(0);

  for (const par of paresValidos) {
    const { t, y } = par;
    const w1 = 2 * Math.PI * t;
    const w2 = 4 * Math.PI * t;

    const row = [1, t, Math.cos(w1), Math.sin(w1), Math.cos(w2), Math.sin(w2)];

    for (let i = 0; i < p; i++) {
      XtY[i] += row[i] * y;
      for (let j = 0; j < p; j++) {
        XtX[i][j] += row[i] * row[j];
      }
    }
  }

  // 3. Resolução do Sistema Linear (XtX * beta = XtY) via eliminação de Gauss com pivoteamento
  const beta = resolverSistemaLinear(XtX, XtY);

  if (!beta) {
    const motivoErro = `Matriz de covariância singular ao ajustar harmônicos de ${nomeVariavel}.`;
    return {
      offset: { estado: "indisponivel", motivo: motivoErro },
      tendencia: { estado: "indisponivel", motivo: motivoErro },
      amplitudeAnual: { estado: "indisponivel", motivo: motivoErro },
      faseAnual: { estado: "indisponivel", motivo: motivoErro },
      amplitudeSemianual: { estado: "indisponivel", motivo: motivoErro },
    };
  }

  // 4. Cálculo da Qualidade do Ajuste (R² e Erro Padrão Residual)
  const yMedio = paresValidos.reduce((acc, p) => acc + p.y, 0) / n;
  let ssTot = 0;
  let ssRes = 0;

  for (const par of paresValidos) {
    const { t, y } = par;
    const w1 = 2 * Math.PI * t;
    const w2 = 4 * Math.PI * t;
    const yPred =
      beta[0] +
      beta[1] * t +
      beta[2] * Math.cos(w1) +
      beta[3] * Math.sin(w1) +
      beta[4] * Math.cos(w2) +
      beta[5] * Math.sin(w2);

    ssTot += Math.pow(y - yMedio, 2);
    ssRes += Math.pow(y - yPred, 2);
  }

  const r2 = ssTot > 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0;
  const grausLiberdade = Math.max(1, n - p);
  const erroPadrao = Math.sqrt(ssRes / grausLiberdade);

  const qualidade: QualidadeAjuste = {
    nObservacoes: n,
    r2: Number(r2.toFixed(3)),
    erroPadrao: Number(erroPadrao.toFixed(4)),
  };

  const offsetVal = Number(beta[0].toFixed(4));
  const tendVal = Number(beta[1].toFixed(5));
  const ampAnualVal = Number(Math.sqrt(beta[2] * beta[2] + beta[3] * beta[3]).toFixed(4));
  const faseAnualVal = Number(Math.atan2(beta[3], beta[2]).toFixed(3));
  const ampSemiVal = Number(Math.sqrt(beta[4] * beta[4] + beta[5] * beta[5]).toFixed(4));

  const modeloInfo = "Regressão Harmônica OLS (Zhu & Woodcock, 2014)";
  const insumosInfo = [`serie_${nomeVariavel}`, "Sentinel-2/Landsat"];

  return {
    offset: {
      estado: "modelado",
      valor: offsetVal,
      modelo: modeloInfo,
      insumos: insumosInfo,
      qualidade,
    },
    tendencia: {
      estado: "modelado",
      valor: tendVal,
      modelo: modeloInfo,
      insumos: insumosInfo,
      qualidade,
    },
    amplitudeAnual: {
      estado: "modelado",
      valor: ampAnualVal,
      modelo: modeloInfo,
      insumos: insumosInfo,
      qualidade,
    },
    faseAnual: {
      estado: "modelado",
      valor: faseAnualVal,
      modelo: modeloInfo,
      insumos: insumosInfo,
      qualidade,
    },
    amplitudeSemianual: {
      estado: "modelado",
      valor: ampSemiVal,
      modelo: modeloInfo,
      insumos: insumosInfo,
      qualidade,
    },
  };
}

/**
 * Resolução de sistema Ax = b por Eliminação Gaussiana com Pivoteamento Parcial.
 */
function resolverSistemaLinear(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let k = 0; k < n; k++) {
    // Escolha do pivô máximo
    let maxRow = k;
    let maxVal = Math.abs(M[k][k]);
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(M[i][k]) > maxVal) {
        maxVal = Math.abs(M[i][k]);
        maxRow = i;
      }
    }

    if (maxVal < 1e-12) return null; // Matriz singular

    // Troca de linhas
    if (maxRow !== k) {
      const temp = M[k];
      M[k] = M[maxRow];
      M[maxRow] = temp;
    }

    // Eliminação
    for (let i = k + 1; i < n; i++) {
      const factor = M[i][k] / M[k][k];
      for (let j = k; j <= n; j++) {
        M[i][j] -= factor * M[k][j];
      }
    }
  }

  // Substituição regressiva
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
