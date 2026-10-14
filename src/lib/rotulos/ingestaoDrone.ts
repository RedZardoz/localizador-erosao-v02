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

import { MetadadosSensorDrone, Rotulo } from "@/types/rotulo";
import { validarRotulo } from "./concordancia";

export const METADADOS_PADRAO_SPECTRAL_2: MetadadosSensorDrone = {
  tipoSensor: "multiespectral",
  fabricanteVant: "Nuvem UAV",
  modeloVant: "Spectral 2",
  bandas: ["blue", "green", "red", "rededge", "nir"],
  resolucaoGsdCm: 5.0,
  georreferenciamento: "ppk-rtk",
  calibracaoRadiometrica: true,
};

export interface ItemDroneProcessado {
  codigoPonto: string;
  rotulo: Rotulo;
  resolucaoGsdCm?: number;
  dataVoo?: string;
  sensor?: string;
  altitudeVooMetros?: number;
  metadadosSensor?: MetadadosSensorDrone;
  ndviMedioDrone?: number; // Média centimétrica no pixel orbital de 10m
  ndreMedioDrone?: number; // Normalized Difference Red Edge
  fracaoSoloNuEspectralPct?: number; // Fração de solo nu estimada por espectrometria de alta resolução
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

    const gsd = raw.resolucaoGsdCm !== undefined ? Number(raw.resolucaoGsdCm) : METADADOS_PADRAO_SPECTRAL_2.resolucaoGsdCm;

    const metadadosSensor: MetadadosSensorDrone = {
      tipoSensor: (raw.tipoSensor as "multiespectral" | "rgb") || METADADOS_PADRAO_SPECTRAL_2.tipoSensor,
      fabricanteVant: String(raw.fabricanteVant || METADADOS_PADRAO_SPECTRAL_2.fabricanteVant),
      modeloVant: String(raw.modeloVant || METADADOS_PADRAO_SPECTRAL_2.modeloVant),
      bandas: Array.isArray(raw.bandas) ? (raw.bandas as MetadadosSensorDrone["bandas"]) : METADADOS_PADRAO_SPECTRAL_2.bandas,
      resolucaoGsdCm: gsd,
      georreferenciamento: (raw.georreferenciamento as "ppk-rtk" | "gnss-navegacao") || METADADOS_PADRAO_SPECTRAL_2.georreferenciamento,
      calibracaoRadiometrica: raw.calibracaoRadiometrica !== undefined ? Boolean(raw.calibracaoRadiometrica) : METADADOS_PADRAO_SPECTRAL_2.calibracaoRadiometrica,
    };

    aceitos.push({
      codigoPonto: codigo,
      rotulo,
      resolucaoGsdCm: gsd,
      dataVoo: raw.dataVoo ? String(raw.dataVoo) : observadoEm,
      sensor: raw.sensor ? String(raw.sensor) : `${metadadosSensor.modeloVant} (${metadadosSensor.tipoSensor})`,
      altitudeVooMetros: raw.altitudeVooMetros !== undefined ? Number(raw.altitudeVooMetros) : undefined,
      metadadosSensor,
      ndviMedioDrone: raw.ndviMedioDrone !== undefined ? Number(raw.ndviMedioDrone) : undefined,
      ndreMedioDrone: raw.ndreMedioDrone !== undefined ? Number(raw.ndreMedioDrone) : undefined,
      fracaoSoloNuEspectralPct: raw.fracaoSoloNuEspectralPct !== undefined ? Number(raw.fracaoSoloNuEspectralPct) : undefined,
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
