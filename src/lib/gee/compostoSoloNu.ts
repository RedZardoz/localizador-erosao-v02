/**
 * ============================================================================
 * Composto de Solo Exposto e Métricas de Exposição (Ê) — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * FUNDAMENTAÇÃO:
 * - Demattê et al. (2018 - GEOS3); Rogge et al. (2018 - SCMaP).
 * - O composto espectral utiliza EXCLUSIVAMENTE observações nas quais o pixel
 *   estava comprovadamente sem vegetação (NDVI < limiar D10) e livre de nuvem/sombra.
 *
 * REGRAS DA LEI FUNDAMENTAL:
 * - Regra 1: A constante 0,25 do SAREL 1 foi eliminada (S1-04/S1-16). Limiar D10
 *   deve ser passado explicitamente.
 * - Invariante 5: Quando o solo nunca esteve descoberto na série, Ê = 0 é um valor
 *   modelado legítimo (o pixel foi observado e esteve sempre coberto). Porém, o
 *   composto espectral e o mês modal são "indisponivel" com causa "fora-do-dominio".
 */

import { Proveniencia } from "@/types/proveniencia";
import {
  ObservacaoCena,
  NomeBandaEspectral,
  TODAS_BANDAS_ESPECTRAIS,
  calcularNdvi,
} from "./serieTemporal";

export interface MetricasSoloExposto {
  frequenciaSoloNu: Proveniencia<number>;       // E^
  maiorSequenciaSoloNu: Proveniencia<number>;   // Comprimento da maior sequência contínua
  mesModalExposicao: Proveniencia<number>;      // Mês (1..12) de maior frequência
  compostoSoloNu: Record<string, Proveniencia<number>>; // Mediana por banda nas datas de solo nu
  nObservacoesValidas: number;
  nObservacoesSoloNu: number;
}

/**
 * Calcula a mediana de um array de números.
 */
function calcularMediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  if (ordenados.length % 2 !== 0) {
    return ordenados[meio];
  }
  return Number(((ordenados[meio - 1] + ordenados[meio]) / 2).toFixed(4));
}

/**
 * Processa a série temporal e extrai as métricas de solo exposto e o composto mediano.
 * @param cenas Série cronológica de cenas
 * @param limiarNdvi Limiar de corte para solo nu (Decisão D10, ex: 0.25 ou 0.30)
 */
export function extrairMetricasSoloExposto(
  cenas: ObservacaoCena[],
  limiarNdvi: number
): MetricasSoloExposto {
  if (!Number.isFinite(limiarNdvi)) {
    throw new Error(`Limiar de NDVI inválido: ${limiarNdvi}`);
  }

  // 1. Filtrar cenas sem nuvem e com bandas B4 e B8 válidas para cálculo de NDVI
  const ordenadas = [...cenas].sort((a, b) => a.data.localeCompare(b.data));
  const validas = ordenadas.filter(
    c => !c.nuvemSombra && c.b4 !== null && c.b8 !== null
  );

  const nValidas = validas.length;

  if (nValidas === 0) {
    const indispSemObs: Proveniencia<number> = {
      estado: "indisponivel",
      causa: "insuficiente",
      motivo: "Nenhuma observação válida na série temporal (todas as cenas mascaradas por nuvem).",
    };

    const compostoVazio: Record<string, Proveniencia<number>> = {};
    for (const b of TODAS_BANDAS_ESPECTRAIS) {
      compostoVazio[b.toUpperCase()] = indispSemObs;
    }

    return {
      frequenciaSoloNu: indispSemObs,
      maiorSequenciaSoloNu: indispSemObs,
      mesModalExposicao: indispSemObs,
      compostoSoloNu: compostoVazio,
      nObservacoesValidas: 0,
      nObservacoesSoloNu: 0,
    };
  }

  // 2. Classificar cada cena válida como solo nu (NDVI < limiarNdvi)
  const cenasComNdvi = validas.map(c => {
    const ndvi = calcularNdvi(c.b8, c.b4);
    const ehSoloNu = ndvi !== null && ndvi < limiarNdvi;
    return { ...c, ndviCalculado: ndvi, ehSoloNu };
  });

  const cenasSoloNu = cenasComNdvi.filter(c => c.ehSoloNu);
  const nSoloNu = cenasSoloNu.length;

  // 3. Frequência de solo nu (Ê)
  // Regra 1 / Invariante 5: se nSoloNu == 0, frequencia = 0.0 é um valor real medido/modelado!
  const freqVal = Number((nSoloNu / nValidas).toFixed(4));
  const frequenciaSoloNu: Proveniencia<number> = {
    estado: "modelado",
    valor: freqVal,
    modelo: "Ê = nSoloNu / nTotalValidas",
    insumos: ["serie_B4", "serie_B8"],
    decisoes: ["D10"],
    qualidade: { nObservacoes: nValidas },
  };

  // 4. Maior sequência contínua de solo nu
  let maxSeq = 0;
  let seqAtual = 0;
  for (const c of cenasComNdvi) {
    if (c.ehSoloNu) {
      seqAtual++;
      if (seqAtual > maxSeq) maxSeq = seqAtual;
    } else {
      seqAtual = 0;
    }
  }

  const maiorSequenciaSoloNu: Proveniencia<number> = {
    estado: "modelado",
    valor: maxSeq,
    modelo: "Maior sequência temporal consecutiva de cenas com NDVI < limiar",
    insumos: ["serie_B4", "serie_B8"],
    decisoes: ["D10"],
    qualidade: { nObservacoes: nValidas },
  };

  // 5. Mês modal de exposição
  let mesModalExposicao: Proveniencia<number>;
  if (nSoloNu === 0) {
    mesModalExposicao = {
      estado: "indisponivel",
      causa: "fora-do-dominio",
      motivo: `Nenhuma cena com solo descoberto (NDVI < ${limiarNdvi}) na série observada. Mês modal não aplicável.`,
    };
  } else {
    const contagemMeses: number[] = new Array(13).fill(0);
    for (const c of cenasSoloNu) {
      const mes = parseInt(c.data.split("-")[1], 10);
      if (mes >= 1 && mes <= 12) {
        contagemMeses[mes] += 1;
      }
    }

    let melhorMes = 1;
    let maxContagem = -1;
    for (let m = 1; m <= 12; m++) {
      if (contagemMeses[m] > maxContagem) {
        maxContagem = contagemMeses[m];
        melhorMes = m;
      }
    }

    mesModalExposicao = {
      estado: "modelado",
      valor: melhorMes,
      modelo: "Moda do mês de calendário das observações de solo descoberto",
      insumos: ["serie_B4", "serie_B8", "datas_cenas"],
      decisoes: ["D10"],
      qualidade: { nObservacoes: nSoloNu },
    };
  }

  // 6. Composto espectral mediano por banda nas datas de solo nu
  const compostoSoloNu: Record<string, Proveniencia<number>> = {};

  for (const b of TODAS_BANDAS_ESPECTRAIS) {
    const nomeB = b.toUpperCase();
    if (nSoloNu === 0) {
      compostoSoloNu[nomeB] = {
        estado: "indisponivel",
        causa: "fora-do-dominio",
        motivo: `Solo permaneceu continuamente coberto na série (zero cenas com NDVI < ${limiarNdvi}). Composto espectral inexistente.`,
      };
    } else {
      const valoresBanda = cenasSoloNu
        .map(c => c[b])
        .filter((v): v is number => v !== null && Number.isFinite(v));

      if (valoresBanda.length === 0) {
        compostoSoloNu[nomeB] = {
          estado: "indisponivel",
          causa: "insuficiente",
          motivo: `Banda ${nomeB} mascarada em todas as cenas de solo descoberto.`,
        };
      } else {
        const medVal = calcularMediana(valoresBanda);
        if (medVal === null) {
          compostoSoloNu[nomeB] = {
            estado: "indisponivel",
            causa: "insuficiente",
            motivo: `Falha ao extrair mediana da banda ${nomeB}.`,
          };
        } else {
          compostoSoloNu[nomeB] = {
            estado: "modelado",
            valor: medVal,
            modelo: "Mediana temporal das datas de solo exposto (NDVI < limiar D10)",
            insumos: [`serie_${nomeB}`, "serie_B4", "serie_B8"],
            decisoes: ["D10"],
            qualidade: { nObservacoes: valoresBanda.length },
          };
        }
      }
    }
  }

  return {
    frequenciaSoloNu,
    maiorSequenciaSoloNu,
    mesModalExposicao,
    compostoSoloNu,
    nObservacoesValidas: nValidas,
    nObservacoesSoloNu: nSoloNu,
  };
}
