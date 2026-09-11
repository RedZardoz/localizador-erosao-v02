/**
 * ============================================================================
 * Linha de Base RUSLE — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * REGRAS DA LEI FUNDAMENTAL E IMPLEMENTATION PLAN (FASE 8):
 * - Desbloqueada para o Fator C (D01: Durigon et al., 2014) e Fator P (Renard et al., 1997).
 * - Fatores R, K e LS aguardam formalização metodológica das decisões D13, D14 e D15 (§3.8 e §14).
 * - perdaSolo só existe se TODOS os cinco fatores e a memória de cálculo existirem (Invariante 1).
 *   Enquanto houver fatores pendentes, perdaSolo é estritamente "indisponivel" com causa "decisao-pendente".
 * - Fator P é obrigatoriamente { estado: "tabelado", valor: 1.0, ... }, NUNCA "medido".
 * - Memória de cálculo registra a proveniência exata de cada fator ou motivo da indisponibilidade.
 */

import { LinhaDeBaseRUSLE } from "@/types/ponto";
import { Proveniencia } from "@/types/proveniencia";
import { REGISTRO_DECISOES } from "@/config/decisoes";
import { obterFatorCComProveniencia } from "./fatorC";

export interface ParametrosLinhaDeBaseRUSLE {
  ndviProveniencia?: Proveniencia<number> | null;
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
    fatorRSubstituto,
    fatorKSubstituto,
    fatorLSSubstituto,
    fatorPSubstituto,
  } = params;

  // 1. Fator C (Decisão D01 - Durigon et al., 2014)
  const fatorC = obterFatorCComProveniencia(ndviProveniencia);

  // 2. Fator P (Renard et al., 1997 - P = 1.0 tabelado por padrão)
  const fatorP: Proveniencia<number> = fatorPSubstituto ?? obterFatorPPadrao();

  // 3. Fator R (Aguardando Decisão D13)
  const fatorR: Proveniencia<number> = fatorRSubstituto ?? (
    REGISTRO_DECISOES.D13.estado === "pendente"
      ? {
          estado: "indisponivel",
          causa: "decisao-pendente",
          motivo: "Fator R aguarda definição metodológica da Decisão D13.",
        }
      : {
          estado: "indisponivel",
          causa: "nao-calculado",
          motivo: "Fator R decidido mas cálculo de erosividade não integrado nesta versão.",
        }
  );

  // 4. Fator K (Aguardando Decisão D14)
  const fatorK: Proveniencia<number> = fatorKSubstituto ?? (
    REGISTRO_DECISOES.D14.estado === "pendente"
      ? {
          estado: "indisponivel",
          causa: "decisao-pendente",
          motivo: "Fator K numérico para RUSLE aguarda definição da Decisão D14.",
        }
      : {
          estado: "indisponivel",
          causa: "nao-calculado",
          motivo: "Fator K decidido mas modelo de erodibilidade não integrado.",
        }
  );

  // 5. Fator LS (Aguardando Decisão D15)
  const fatorLS: Proveniencia<number> = fatorLSSubstituto ?? (
    REGISTRO_DECISOES.D15.estado === "pendente"
      ? {
          estado: "indisponivel",
          causa: "decisao-pendente",
          motivo: "Fator LS topográfico aguarda definição de expoentes m e n da Decisão D15.",
        }
      : {
          estado: "indisponivel",
          causa: "nao-calculado",
          motivo: "Fator LS decidido mas cálculo de acúmulo de fluxo não integrado.",
        }
  );

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
      decisoes: ["D01"],
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
