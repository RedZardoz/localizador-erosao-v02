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
import { ehSoloExpostoGeos3 } from "./mascaraSoloNuGeos3";
import {
  ObservacaoCena,
  NomeBandaEspectral,
  TODAS_BANDAS_ESPECTRAIS,
  calcularNdvi,
  calcularBsi,
} from "./serieTemporal";

export interface OpcoesExtracaoSoloExposto {
  /**
   * Limiar mínimo de Bare Soil Index (BSI) para confirmação de solo mineral.
   * Em áreas sob Sistema Plantio Direto (SPD), palhada seca residual pode apresentar
   * NDVI baixo (< 0.25). A exigência opcional de BSI >= limiarMinBsi assegura que apenas
   * superfícies com assinatura mineral exposta sejam contabilizadas como solo nu (Ê).
   *
   * PONTO DE EXTENSÃO EXPERIMENTAL (Item 5 / Decisão D10):
   * O pipeline padrão de extração de Ê opera estritamente conforme a Decisão D10 (limiar puro
   * de NDVI <= 0.25), mantendo a integridade do pré-registro fatorial dos 18 estratos biofísicos.
   * O parâmetro limiarMinBsi permanece implementado como ponto de extensão analítica experimental,
   * coberto por testes unitários, e sua eventual ativação em produção dependerá de formalização
   * de nova decisão metodológica (D27) e recálculo dos tercis amostrais pré-registrados.
   */
  limiarMinBsi?: number;
}

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
  limiarNdvi: number,
  opcoes?: OpcoesExtracaoSoloExposto
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

  // 2. Classificar cada cena válida com a máscara GEOS3 (Demattê et al., 2018)
  // Regra 1 / Invariante 5: Se faltar banda para avaliar a máscara, ehSoloExpostoGeos3 retorna null.
  // Cenas com bandas ausentes são excluídas do denominador de Ê (declarado na Proveniência).
  const cenasAvaliadas = validas
    .map(c => {
      let veredito = ehSoloExpostoGeos3(c.b2, c.b3, c.b4, c.b8, c.b11, c.b12, { ndviMax: limiarNdvi });
      if (veredito === true && typeof opcoes?.limiarMinBsi === "number") {
        const bsi = calcularBsi(c.b11, c.b4, c.b8, c.b2);
        if (bsi !== null && bsi < opcoes.limiarMinBsi) {
          veredito = false;
        }
      }
      const ndvi = calcularNdvi(c.b8, c.b4);
      return { ...c, ndviCalculado: ndvi, vereditoGeos3: veredito };
    })
    .filter(c => c.vereditoGeos3 !== null);

  const nValidasAvaliadas = cenasAvaliadas.length;

  if (nValidasAvaliadas === 0) {
    const indispSemObs: Proveniencia<number> = {
      estado: "indisponivel",
      causa: "insuficiente",
      motivo: "Nenhuma observação com todas as bandas necessárias para a máscara GEOS3 (B2, B3, B4, B8, B11, B12).",
    };

    return {
      frequenciaSoloNu: indispSemObs,
      maiorSequenciaSoloNu: indispSemObs,
      mesModalExposicao: indispSemObs,
      compostoSoloNu: compostoVazio,
      nObservacoesValidas: 0,
      nObservacoesSoloNu: 0,
    };
  }

  const cenasSoloNu = cenasAvaliadas.filter(c => c.vereditoGeos3 === true);
  const nSoloNu = cenasSoloNu.length;

  // 3. Frequência de solo nu (Ê)
  // Regra 1 / Invariante 5: se nSoloNu == 0, frequencia = 0.0 é um valor real medido/modelado!
  const freqVal = Number((nSoloNu / nValidasAvaliadas).toFixed(4));
  const insumos = ["serie_B2", "serie_B3", "serie_B4", "serie_B8", "serie_B11", "serie_B12"];

  const frequenciaSoloNu: Proveniencia<number> = {
    estado: "modelado",
    valor: freqVal,
    modelo: "Ê = nSoloNu(GEOS3 Dematte et al. 2018: NDVI em [0,00; 0,25] & NBR2 em [0,00; 0,075] & (B4-B3)>=0 & (B3-B2)>=0) / nTotalValidas (cenas com bandas ausentes excluidas do denominador)",
    insumos,
    decisoes: ["D10"],
    qualidade: { nObservacoes: nValidasAvaliadas },
  };

  // 4. Maior sequência contínua de solo nu
  let maxSeq = 0;
  let seqAtual = 0;
  for (const c of cenasAvaliadas) {
    if (c.vereditoGeos3 === true) {
      seqAtual++;
      if (seqAtual > maxSeq) maxSeq = seqAtual;
    } else {
      seqAtual = 0;
    }
  }

  const maiorSequenciaSoloNu: Proveniencia<number> = {
    estado: "modelado",
    valor: maxSeq,
    modelo: "Maior sequência temporal consecutiva de cenas com solo exposto sob máscara GEOS3 (Demattê et al., 2018)",
    insumos: ["serie_B2", "serie_B3", "serie_B4", "serie_B8", "serie_B11", "serie_B12"],
    decisoes: ["D10"],
    qualidade: { nObservacoes: nValidasAvaliadas },
  };

  // 5. Mês modal de exposição
  let mesModalExposicao: Proveniencia<number>;
  if (nSoloNu === 0) {
    mesModalExposicao = {
      estado: "indisponivel",
      causa: "fora-do-dominio",
      motivo: `Nenhuma cena com solo descoberto sob máscara GEOS3 (Demattê et al., 2018) na série observada. Mês modal não aplicável.`,
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
      modelo: "Moda do mês de calendário das observações de solo descoberto sob máscara GEOS3 (Demattê et al., 2018)",
      insumos: ["serie_B2", "serie_B3", "serie_B4", "serie_B8", "serie_B11", "serie_B12", "datas_cenas"],
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
        motivo: `Solo permaneceu continuamente coberto na série (zero cenas sob máscara GEOS3). Composto espectral inexistente.`,
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
            modelo: "Mediana temporal das datas de solo exposto sob máscara GEOS3 (Demattê et al., 2018)",
            insumos: [`serie_${nomeB}`, "serie_B2", "serie_B3", "serie_B4", "serie_B8", "serie_B11", "serie_B12"],
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
    nObservacoesValidas: nValidasAvaliadas,
    nObservacoesSoloNu: nSoloNu,
  };
}
