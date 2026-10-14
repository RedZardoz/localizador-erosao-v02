/**
 * ============================================================================
 * Linha de Base RUSLE — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * REGRAS DA LEI FUNDAMENTAL E IMPLEMENTATION PLAN:
 * - Fator C: Decisão D01 (Durigon et al., 2014)
 * - Fator P: Renard et al. (1997) — P = 1.0 tabelado por padrão
 * - Fator R: Decisão D13 (Rufino et al., 1993 / Waltrick et al., 2015 sobre CHIRPS 0,05°)
 * - Fator K: Decisão D14 emendada (k_solos da camada oficial 2024 / fallback)
 * - Fator LS: Decisão D15 (Desmet & Govers 1996 2D com m e S de Renard et al. 1997 AH 703 sobre Copernicus DEM 30 m)
 * - perdaSolo só existe se TODOS os cinco fatores e a memória de cálculo existirem (Invariante 1).
 *   Enquanto houver fatores pendentes ou com dados insuficientes, perdaSolo é estritamente "indisponivel".
 * - Fator P é obrigatoriamente { estado: "tabelado", valor: 1.0, ... }, NUNCA "medido".
 * - Memória de cálculo registra a proveniência exata de cada fator ou motivo da indisponibilidade.
 */

import { LinhaDeBaseRUSLE } from "@/types/ponto";
import { Proveniencia } from "@/types/proveniencia";
import { REGISTRO_DECISOES } from "@/config/decisoes";
import { obterFatorCComProveniencia } from "./fatorC";
import { obterFatorKComProveniencia, InsumoFatorKCamada2024 } from "./fatorK";
import { obterFatorRComProveniencia, InsumoFatorR } from "./fatorR";
import { obterFatorLSComProveniencia, InsumoFatorLS } from "./fatorLS";

export interface ParametrosLinhaDeBaseRUSLE {
  ndviProveniencia?: Proveniencia<number> | null;
  bsiProveniencia?: Proveniencia<number> | null;
  erodibilidadeProveniencia?: Proveniencia<string> | null;
  camadaErodibilidade2024?: InsumoFatorKCamada2024 | null;
  insumoFatorR?: InsumoFatorR | null;
  insumoFatorLS?: InsumoFatorLS | null;
  fatorRSubstituto?: Proveniencia<number>;
  fatorKSubstituto?: Proveniencia<number>;
  fatorLSSubstituto?: Proveniencia<number>;
  fatorPSubstituto?: Proveniencia<number>;
}

/**
 * Cria a proveniência padrão para o Fator P segundo Renard et al. (1997).
 * P = 1.0 quando a prática conservacionista é desconhecida ou não informada.
 * Estado: "tabelado", NUNCA "medido".
 */
export function obterFatorPPadrao(): Proveniencia<number> {
  return {
    estado: "tabelado",
    valor: 1.0,
    tabela: "Renard et al. (1997) — P = 1 quando a prática conservacionista é desconhecida",
    chave: "sem-pratica-informada",
  };
}

/**
 * Monta a estrutura da Linha de Base RUSLE para um ponto amostral,
 * respeitando as decisões em vigor e as travas de decisões pendentes.
 */
export function montarLinhaDeBaseRUSLE(params: ParametrosLinhaDeBaseRUSLE = {}): LinhaDeBaseRUSLE {
  const {
    ndviProveniencia,
    bsiProveniencia,
    erodibilidadeProveniencia,
    camadaErodibilidade2024,
    insumoFatorR,
    insumoFatorLS,
    fatorRSubstituto,
    fatorKSubstituto,
    fatorLSSubstituto,
    fatorPSubstituto,
  } = params;

  // 1. Fator C (Decisão D01 - Durigon et al., 2014)
  const fatorC = obterFatorCComProveniencia(ndviProveniencia, bsiProveniencia);

  // 2. Fator P (Renard et al., 1997 - P = 1.0 tabelado por padrão)
  const fatorP: Proveniencia<number> = fatorPSubstituto ?? obterFatorPPadrao();

  // 3. Fator R (Decisão D13 — Equação Regional do Paraná sobre CHIRPS Climatológico)
  const fatorR: Proveniencia<number> =
    fatorRSubstituto ??
    (REGISTRO_DECISOES.D13.estado === "pendente"
      ? {
          estado: "indisponivel",
          causa: "decisao-pendente",
          motivo: "Fator R aguarda definição metodológica da Decisão D13.",
        }
      : insumoFatorR
      ? obterFatorRComProveniencia(insumoFatorR)
      : {
          estado: "indisponivel",
          causa: "insuficiente",
          motivo:
            "Fator R requer totais pluviométricos mensais ou coordenadas geográficas para consulta climatológica CHIRPS (Decisão D13).",
        });

  // 4. Fator K (Decisão D14 emendada - k_solos de geonode:bra_erodibilidade_2024_sirgas2000, com fallback por faixa de classe)
  const fatorK: Proveniencia<number> =
    fatorKSubstituto ??
    (camadaErodibilidade2024 || erodibilidadeProveniencia
      ? obterFatorKComProveniencia(erodibilidadeProveniencia, camadaErodibilidade2024)
      : {
          estado: "indisponivel",
          causa: "insuficiente",
          motivo: "Fator K numérico para RUSLE requer k_solos da camada 2024 ou a classe de erodibilidade pedológica informada (Decisão D14).",
        });

  // 5. Fator LS (Decisão D15 — Desmet & Govers 1996 2D com m e S de Renard et al. 1997 AH 703)
  const fatorLS: Proveniencia<number> =
    fatorLSSubstituto ??
    (REGISTRO_DECISOES.D15.estado === "pendente"
      ? {
          estado: "indisponivel",
          causa: "decisao-pendente",
          motivo: "Fator LS topográfico aguarda definição de expoentes m e n da Decisão D15.",
        }
      : insumoFatorLS
      ? obterFatorLSComProveniencia(insumoFatorLS)
      : {
          estado: "indisponivel",
          causa: "insuficiente",
          motivo:
            "Fator LS requer declividade e área de contribuição a montante do Copernicus DEM GLO-30 nativo (Decisão D15).",
        });

  // Verificação do Invariante 1:
  // perdaSolo só pode existir e ser calculada se os cinco fatores estiverem simultaneamente disponíveis (valor numérico finito)
  const fatoresDisponiveis = [fatorR, fatorK, fatorLS, fatorC, fatorP].every(
    (f) => f.estado !== "indisponivel" && Number.isFinite(f.valor)
  );

  let perdaSolo: Proveniencia<number>;
  let memoriaCalculo: string | null = null;

  if (fatoresDisponiveis) {
    const valR = (fatorR as { valor: number }).valor;
    const valK = (fatorK as { valor: number }).valor;
    const valLS = (fatorLS as { valor: number }).valor;
    const valC = (fatorC as { valor: number }).valor;
    const valP = (fatorP as { valor: number }).valor;

    const perdaCalculada = valR * valK * valLS * valC * valP;
    memoriaCalculo = `RUSLE A = R (${valR}) * K (${valK}) * LS (${valLS}) * C (${valC}) * P (${valP}) = ${perdaCalculada.toFixed(4)} t/ha/ano`;

    perdaSolo = {
      estado: "modelado",
      valor: Number(perdaCalculada.toFixed(4)),
      modelo: "Equação Universal de Perda de Solo Revisada (RUSLE: A = R * K * LS * C * P)",
      insumos: ["Fator R", "Fator K", "Fator LS", "Fator C", "Fator P"],
      decisoes: ["D01", "D13", "D14", "D15"],
    };
  } else {
    // Coleta as causas de indisponibilidade para justificativa honesta
    const pendencias: string[] = [];
    if (fatorR.estado === "indisponivel") pendencias.push(`R (${fatorR.causa})`);
    if (fatorK.estado === "indisponivel") pendencias.push(`K (${fatorK.causa})`);
    if (fatorLS.estado === "indisponivel") pendencias.push(`LS (${fatorLS.causa})`);
    if (fatorC.estado === "indisponivel") pendencias.push(`C (${fatorC.causa})`);
    if (fatorP.estado === "indisponivel") pendencias.push(`P (${fatorP.causa})`);

    const temDecisaoPendente = [fatorR, fatorK, fatorLS, fatorC, fatorP].some(
      (f) => f.estado === "indisponivel" && f.causa === "decisao-pendente"
    );

    perdaSolo = {
      estado: "indisponivel",
      causa: temDecisaoPendente ? "decisao-pendente" : "insuficiente",
      motivo: `Cálculo de perda de solo retido pelo Invariante 1. Fatores ausentes ou retidos: ${pendencias.join(", ")}.`,
    };
    memoriaCalculo = null;
  }

  return {
    fatorR,
    fatorK,
    fatorLS,
    fatorC,
    fatorP,
    perdaSolo,
    memoriaCalculo,
  };
}
