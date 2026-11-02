import type { ModalidadeRotulo, Rotulo } from "@/types/rotulo";
import { binarizarFracao } from "./binarizacao";

export interface InsumosRotuloHumano {
  classe: string;
  modalidade: ModalidadeRotulo;
  observador: string;
  observadoEm: string;
  confianca: "alta" | "media" | "baixa" | "";
  modo: "inspecao" | "registro";
  fracaoErodida: number | null;
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
 * Regras 1, 3 e C25: Nenhum campo de metadado (data da observação, observador, nível de
 * confiança) nem o ALVO PRIMÁRIO de D26 (fração erodida) recebe valor padrão do sistema.
 * Sem data, sem observador, sem confiança ou sem fração, a gravação é terminantemente recusada.
 *
 * A fração erodida é o alvo primário do modelo (D26). Zero é um VALOR científico válido — célula
 * observada e delineada como não erodida —, e não um marcador de ausência: por isso o campo não
 * pode ter default. Um rótulo gravado com fração 0,00 por omissão do observador entra na matriz
 * como negativo, de forma indistinguível de um zero observado (Regra 1).
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

  if (!insumos.confianca) {
    return {
      valido: false,
      motivo:
        "Nível de confiança da observação é obrigatório (proibido valor-padrão de sistema — C25).",
    };
  }

  // Regra 1: o alvo primário de D26 não tem default. Ausente permanece ausente, com causa.
  if (insumos.fracaoErodida === null || insumos.fracaoErodida === undefined) {
    return {
      valido: false,
      motivo:
        "Fração erodida da célula é obrigatória: é o alvo primário de D26 e zero é valor observado, não ausência. " +
        "Informe a fração medida por delineação (Regra 1).",
    };
  }

  if (!Number.isFinite(insumos.fracaoErodida)) {
    return {
      valido: false,
      motivo: "Fração erodida inválida: valor não numérico (Regra 1).",
    };
  }

  // Regra 2: valor fora do domínio é erro explícito, nunca corte silencioso.
  if (insumos.fracaoErodida < 0 || insumos.fracaoErodida > 1) {
    return {
      valido: false,
      motivo: `Fração erodida fora do domínio [0, 1]: ${insumos.fracaoErodida}. Valor fora do domínio é recusado, não ajustado (Regra 2).`,
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
