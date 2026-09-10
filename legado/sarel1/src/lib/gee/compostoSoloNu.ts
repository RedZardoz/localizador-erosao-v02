/**
 * ============================================================================
 * Composto de Solo Exposto e Frequência de Exposição (Ê) — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * FUNDAMENTAÇÃO CIENTÍFICA (PLANEJAMENTO V3, §6.2):
 * Composição de reflectância sintética de solo descoberto a partir da série histórica
 * (Demattê et al., 2018 - GEOS3; Rogge et al., 2018 - SCMaP).
 *
 * O composto utiliza APENAS observações nas quais o pixel estava comprovadamente
 * livre de vegetação (NDVI abaixo do limiar de dossel) e sem contaminação de nuvem/sombra.
 *
 * DIMENSÃO Ê DA ESTRATIFICAÇÃO (PLANO V2, §3.3):
 * Ê = Frequência de exposição = (Nº de observações com solo descoberto) / (Nº total de observações válidas)
 * Separa a exposição transitória (preparo do solo normal) de feições erodidas persistentes.
 */

import { Proveniencia } from "@/types/proveniencia";
import { ObservacaoEspectral } from "./serieTemporal";

export const LIMIAR_NDVI_SOLO_NU_PADRAO = 0.25;

export interface ResultadoCompostoSoloNu {
  /** Dimensão Ê da amostragem: frequência de solo nu na série histórica [0, 1] */
  frequenciaSoloNu: Proveniencia<number>;
  /** Total de observações válidas (sem nuvem) */
  nObservacoesValidas: number;
  /** Total de observações com solo descoberto */
  nObservacoesSoloNu: number;
  /** Composto espectral por banda (reflectância mediana das datas descobertas) */
  compostoBandas: Record<string, Proveniencia<number>>;
}

/**
 * Calcula a mediana de um array numérico.
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
 * Gera o Composto de Solo Exposto e calcula a frequência Ê.
 */
export function gerarCompostoSoloNu(
  observacoes: ObservacaoEspectral[],
  limiarNdvi: number = LIMIAR_NDVI_SOLO_NU_PADRAO
): ResultadoCompostoSoloNu {
  // 1. Filtrar observações sem nuvem
  const validas = observacoes.filter(obs => !obs.nuvemSombra && obs.ndvi !== null);
  const nValidas = validas.length;

  if (nValidas === 0) {
    const motivoSemObs = "Sem observações válidas (todas as cenas mascaradas por nuvem).";
    return {
      frequenciaSoloNu: { estado: "indisponivel", motivo: motivoSemObs },
      nObservacoesValidas: 0,
      nObservacoesSoloNu: 0,
      compostoBandas: {},
    };
  }

  // 2. Identificar datas em que o solo esteve exposto (NDVI < limiar)
  const soloNuObs = validas.filter(obs => obs.ndvi !== null && obs.ndvi < limiarNdvi);
  const nSoloNu = soloNuObs.length;

  // 3. Frequência de solo nu (Ê)
  const frequencia = Number((nSoloNu / nValidas).toFixed(4));
  const frequenciaSoloNu: Proveniencia<number> = {
    estado: "medido",
    valor: frequencia,
    fonte: "Sentinel-2 MSI Harmonized",
    adquiridoEm: new Date().toISOString().split("T")[0],
    detalhe: `${nSoloNu} de ${nValidas} observações válidas com NDVI < ${limiarNdvi}`,
  };

  // 4. Composto mediano por banda
  const compostoBandas: Record<string, Proveniencia<number>> = {};
  const bandas: (keyof Pick<ObservacaoEspectral, "b2" | "b3" | "b4" | "b8" | "b11" | "b12">)[] = [
    "b2", "b3", "b4", "b8", "b11", "b12"
  ];

  for (const b of bandas) {
    const nomeBanda = b.toUpperCase();
    if (nSoloNu === 0) {
      // REGRA 1: Se nunca esteve descoberto, o valor é null/indisponível. NUNCA inventa constante!
      compostoBandas[nomeBanda] = {
        estado: "indisponivel",
        motivo: `Pixel com cobertura vegetal contínua (zero observações com NDVI < ${limiarNdvi}). Composto de solo descoberto inexistente.`,
      };
    } else {
      const valoresBanda = soloNuObs
        .map(obs => obs[b])
        .filter((v): v is number => v !== null && Number.isFinite(v) && !isNaN(v));

      const mediana = calcularMediana(valoresBanda);

      if (mediana !== null) {
        compostoBandas[nomeBanda] = {
          estado: "medido",
          valor: mediana,
          fonte: "Sentinel-2 Composto de Solo Exposto (SCMaP/GEOS3)",
          adquiridoEm: new Date().toISOString().split("T")[0],
          detalhe: `Mediana de ${valoresBanda.length} observações de solo descoberto`,
        };
      } else {
        compostoBandas[nomeBanda] = {
          estado: "indisponivel",
          motivo: `Sem valores válidos para a banda ${nomeBanda} nas datas de solo descoberto.`,
        };
      }
    }
  }

  return {
    frequenciaSoloNu,
    nObservacoesValidas: nValidas,
    nObservacoesSoloNu: nSoloNu,
    compostoBandas,
  };
}
