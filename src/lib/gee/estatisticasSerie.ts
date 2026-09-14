/**
 * ============================================================================
 * Estatísticas Descritivas e Percentis da Série Temporal — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * PLANEJAMENTO V3, §6.1 (Estratégia 2):
 * Extração de percentis robustos não paramétricos (p10, p50, p90) e amplitude
 * interquantil por banda da série histórica, especialmente SWIR (B11 e B12).
 *
 * REGRA 1 DA LEI FUNDAMENTAL:
 * Sem observações suficientes (mínimo de 3 observações válidas na janela),
 * retorna rigorosamente "indisponivel" com causa "insuficiente".
 */

import { Proveniencia } from "@/types/proveniencia";
import { ObservacaoCena, NomeBandaEspectral } from "./serieTemporal";

export interface EstatisticasBanda {
  p10: Proveniencia<number>;
  p50: Proveniencia<number>;
  p90: Proveniencia<number>;
  media: Proveniencia<number>;
  desvioPadrao: Proveniencia<number>;
  amplitudeInterquantil: Proveniencia<number>; // p90 - p10
}

/**
 * Calcula um percentil [0, 100] de um array de números ordenados por interpolação linear.
 */
export function calcularPercentilOrdenado(ordenados: number[], percentil: number): number {
  const n = ordenados.length;
  if (n === 0) return 0;
  if (n === 1) return ordenados[0];

  if (!Number.isFinite(percentil) || percentil < 0 || percentil > 100) {
    throw new Error(`Percentil fora do domínio [0, 100]: ${percentil}`);
  }
  const p = percentil / 100;
  const index = p * (n - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;

  if (lower === upper) {
    return ordenados[lower];
  }

  return Number((ordenados[lower] + fraction * (ordenados[upper] - ordenados[lower])).toFixed(4));
}

/**
 * Calcula o conjunto completo de estatísticas e percentis para uma banda.
 */
export function calcularEstatisticasBanda(
  cenas: ObservacaoCena[],
  banda: NomeBandaEspectral,
  nMinimo = 3
): EstatisticasBanda {
  const valores: number[] = [];
  for (const c of cenas) {
    if (!c.nuvemSombra) {
      const v = c[banda];
      if (v !== null && Number.isFinite(v)) {
        valores.push(v);
      }
    }
  }

  const n = valores.length;
  const nomeB = banda.toUpperCase();

  if (n < nMinimo) {
    const indisp: Proveniencia<number> = {
      estado: "indisponivel",
      causa: "insuficiente",
      motivo: `Banda ${nomeB} possui apenas ${n} observações válidas (mínimo exigido: ${nMinimo}).`,
    };
    return {
      p10: indisp,
      p50: indisp,
      p90: indisp,
      media: indisp,
      desvioPadrao: indisp,
      amplitudeInterquantil: indisp,
    };
  }

  valores.sort((a, b) => a - b);

  const p10Val = calcularPercentilOrdenado(valores, 10);
  const p50Val = calcularPercentilOrdenado(valores, 50);
  const p90Val = calcularPercentilOrdenado(valores, 90);
  const ampIqVal = Number((p90Val - p10Val).toFixed(4));

  const mediaVal = Number((valores.reduce((acc, v) => acc + v, 0) / n).toFixed(4));
  const variancia = valores.reduce((acc, v) => acc + Math.pow(v - mediaVal, 2), 0) / (n > 1 ? n - 1 : 1);
  const dpVal = Number(Math.sqrt(variancia).toFixed(4));

  const modeloInfo = "Percentil e Estatísticas da Série Temporal";
  const insumosInfo = [`serie_${nomeB}`];
  const qualidade = { nObservacoes: n };

  return {
    p10: {
      estado: "modelado",
      valor: p10Val,
      modelo: modeloInfo,
      insumos: insumosInfo,
      qualidade,
    },
    p50: {
      estado: "modelado",
      valor: p50Val,
      modelo: modeloInfo,
      insumos: insumosInfo,
      qualidade,
    },
    p90: {
      estado: "modelado",
      valor: p90Val,
      modelo: modeloInfo,
      insumos: insumosInfo,
      qualidade,
    },
    media: {
      estado: "modelado",
      valor: mediaVal,
      modelo: modeloInfo,
      insumos: insumosInfo,
      qualidade,
    },
    desvioPadrao: {
      estado: "modelado",
      valor: dpVal,
      modelo: modeloInfo,
      insumos: insumosInfo,
      qualidade,
    },
    amplitudeInterquantil: {
      estado: "modelado",
      valor: ampIqVal,
      modelo: modeloInfo,
      insumos: insumosInfo,
      qualidade,
    },
  };
}

/**
 * Constrói o mapa de estatísticas para BlocoSerie["estatisticas"].
 * Gera chaves como "B11_p10", "B11_p50", "B11_p90", "B12_p10", "B12_p50", "B12_p90".
 */
export function construirEstatisticasBloco(
  cenas: ObservacaoCena[],
  bandas: NomeBandaEspectral[] = ["b11", "b12"]
): Record<string, Proveniencia<number>> {
  const mapa: Record<string, Proveniencia<number>> = {};

  for (const b of bandas) {
    const prefixo = b.toUpperCase();
    const est = calcularEstatisticasBanda(cenas, b);

    mapa[`${prefixo}_p10`] = est.p10;
    mapa[`${prefixo}_p50`] = est.p50;
    mapa[`${prefixo}_p90`] = est.p90;
    mapa[`${prefixo}_amplitudeInterquantil`] = est.amplitudeInterquantil;
    mapa[`${prefixo}_media`] = est.media;
    mapa[`${prefixo}_desvioPadrao`] = est.desvioPadrao;
  }

  return mapa;
}
