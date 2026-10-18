import type { ModalidadeRotulo, Rotulo } from "@/types/rotulo";
import { binarizarFracao } from "./binarizacao";

export interface InsumosRotuloHumano {
  classe: string;
  modalidade: ModalidadeRotulo;
  observador: string;
  observadoEm: string;
  confianca: "alta" | "media" | "baixa";
  modo: "inspecao" | "registro";
  fracaoErodida: number;
  observacoes?: string;
}

export type ResultadoValidacaoRotuloHumano =
  | {
      valido: true;
      rotulo: Rotulo;
    }
  | {
      valido: false;
      motivo: string;
    };

/**
 * Validação pericial estrita para gravação de rótulo humano (Inspetor / Protocolo Cego).
 * Regras 1, 3 e C25: Nenhum campo de metadado (data da observação, observador) recebe
 * valor padrão do sistema. Sem data de observação, a gravação é terminantemente recusada.
 */
export function validarEConstruirRotuloHumano(
  insumos: InsumosRotuloHumano
): ResultadoValidacaoRotuloHumano {
  const observadoEm = insumos.observadoEm ? String(insumos.observadoEm).trim() : "";
  if (!observadoEm) {
    return {
      valido: false,
      motivo:
        "Data da observação é obrigatória para registrar o laudo pericial (não pode ser preenchida por padrão — Regras 1 e 3 / C25).",
    };
  }

  const observador = insumos.observador ? String(insumos.observador).trim() : "";
  if (!observador) {
    return {
      valido: false,
      motivo:
        "Nome do observador pericial é obrigatório para gravação do rótulo (proibido valor-padrão de sistema — C25).",
    };
  }

  const fracaoArmazenada = Number(insumos.fracaoErodida.toFixed(3));
  const alvoBinarioDerivado: 0 | 1 = binarizarFracao(fracaoArmazenada);
  const cegoDerivado = insumos.modo === "registro";

  const rotulo: Rotulo = {
    classe: insumos.classe,
    modalidade: insumos.modalidade,
    observador,
    observadoEm,
    cego: cegoDerivado,
    confianca: insumos.confianca,
    fracaoErodida: fracaoArmazenada,
    alvoBinarioDerivado,
    observacoes: insumos.observacoes?.trim() || undefined,
  };

  return {
    valido: true,
    rotulo,
  };
}
