/**
 * ============================================================================
 * Ingestão de Validação por Drone — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * ESPECIFICAÇÃO MANDATÓRIA (PLANO V3, §12.1):
 * - Dados de ortomosaicos de altíssima resolução por drone (Fase D).
 * - Conjunto estritamente segregado como HELD-OUT (validação cega independente).
 * - NUNCA misturado à matriz de treino do modelo supervisionado.
 */

import { Rotulo } from "@/types/rotulo";
import { validarRotulo } from "./concordancia";

export interface ItemDroneProcessado {
  codigoPonto: string;
  rotulo: Rotulo;
  resolucaoGsdCm?: number;
  dataVoo?: string;
  sensor?: string;
  altitudeVooMetros?: number;
  papelConjunto: "held-out"; // Inviolável
}

export interface ResultadoIngestaoDrone {
  totalProcessados: number;
  aceitos: ItemDroneProcessado[];
  rejeitados: { registro: unknown; motivo: string }[];
  avisosQualidade: string[];
}

export function ingestarValidacaoDrone(
  entradas: Record<string, unknown>[]
): ResultadoIngestaoDrone {
  const aceitos: ItemDroneProcessado[] = [];
  const rejeitados: { registro: unknown; motivo: string }[] = [];
  const avisosQualidade: string[] = [];

  for (const raw of entradas) {
    const codigo = String(raw.codigoPonto || raw.codigo || raw.ponto_id || "").trim();
    if (!codigo) {
      rejeitados.push({ registro: raw, motivo: "Identificador 'codigoPonto' ausente." });
      continue;
    }

    const classe = String(raw.classe || raw.erosao_observada || "").trim();
    const observador = String(raw.observador || raw.piloto || raw.especialista || "").trim();
    const observadoEm = String(raw.observadoEm || raw.data_voo || "").trim();

    const rotulo: Rotulo = {
      classe,
      modalidade: "drone",
      observador,
      observadoEm,
      cego: raw.cego === false ? false : true,
      confianca: raw.confianca as "alta" | "media" | "baixa" | undefined,
      observacoes: raw.observacoes ? String(raw.observacoes) : undefined,
    };

    const validacao = validarRotulo(rotulo);
    if (!validacao.valido) {
      rejeitados.push({ registro: raw, motivo: validacao.motivo || "Rótulo de drone inválido." });
      continue;
    }

    aceitos.push({
      codigoPonto: codigo,
      rotulo,
      resolucaoGsdCm: raw.resolucaoGsdCm !== undefined ? Number(raw.resolucaoGsdCm) : undefined,
      dataVoo: raw.dataVoo ? String(raw.dataVoo) : observadoEm,
      sensor: raw.sensor ? String(raw.sensor) : undefined,
      altitudeVooMetros: raw.altitudeVooMetros !== undefined ? Number(raw.altitudeVooMetros) : undefined,
      papelConjunto: "held-out",
    });
  }

  return {
    totalProcessados: entradas.length,
    aceitos,
    rejeitados,
    avisosQualidade,
  };
}

/**
 * Guarda estrita: recusa qualquer tentativa de incluir dados de drone no conjunto de treino.
 */
export function assegurarSegregacaoTreino(modalidade: string): void {
  if (modalidade === "drone") {
    throw new Error(
      "VIOLAÇÃO DA LEI FUNDAMENTAL (Regra 4 e §12.1): Observações da modalidade 'drone' são estritamente 'held-out' e nunca podem integrar a matriz de treino."
    );
  }
}
