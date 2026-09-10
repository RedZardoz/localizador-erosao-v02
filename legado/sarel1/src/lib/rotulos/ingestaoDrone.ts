/**
 * ============================================================================
 * Ingestão de Validação por Drone — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * Conforme §11.4 do Plano v2 e Fase D do Planejamento v3:
 * Ingestão de validação de alta resolução (GSD centimétrico) por drone multiespectral.
 *
 * REGRA INVIOLÁVEL:
 * Conjunto de validação por drone é estritamente marcado como HELD-OUT.
 * Sob NENHUMA hipótese pode ser misturado ao conjunto de treino do classificador.
 */

import { ClasseRotulo, Rotulo, SubmissaoDrone } from "@/types/rotulo";
import { validarRotulo } from "./concordancia";

export interface ItemDroneProcessado {
  codigoPonto: string;
  rotulo: Rotulo;
  resolucaoGsdCm?: number;
  dataVoo?: string;
  sensor?: string;
  altitudeVooMetros?: number;
  papelConjunto: "held-out"; // Sempre held-out
}

export interface ResultadoIngestaoDrone {
  totalProcessados: number;
  aceitos: ItemDroneProcessado[];
  rejeitados: { registro: unknown; motivo: string }[];
  avisosQualidade: string[];
}

/**
 * Normaliza e valida um registro de validação por drone.
 */
export function normalizarSubmissaoDrone(raw: Record<string, unknown>): SubmissaoDrone {
  const codigoPonto = String(
    raw.codigoPonto ?? raw.codigo_ponto ?? raw.ponto_codigo ?? raw.id ?? ""
  ).trim();

  const classeRaw = String(
    raw.classe ?? raw.erosao_observada ?? ""
  ).toLowerCase().trim() as ClasseRotulo;

  const observador = String(
    raw.observador ?? raw.piloto ?? raw.especialista ?? ""
  ).trim();

  const observadoEm = String(
    raw.observadoEm ?? raw.data_voo ?? raw.data ?? ""
  ).trim();

  let confianca: "alta" | "media" | "baixa" | undefined = undefined;
  const confRaw = String(raw.confianca ?? "").toLowerCase().trim();
  if (confRaw === "alta" || confRaw === "media" || confRaw === "baixa") {
    confianca = confRaw;
  }

  const resolucaoGsdCm = raw.resolucaoGsdCm !== undefined ? Number(raw.resolucaoGsdCm) : undefined;
  const dataVoo = raw.dataVoo ? String(raw.dataVoo) : observadoEm;
  const sensor = raw.sensor ? String(raw.sensor) : undefined;
  const altitudeVooMetros = raw.altitudeVooMetros !== undefined ? Number(raw.altitudeVooMetros) : undefined;
  const observacoes = raw.observacoes ? String(raw.observacoes).trim() : undefined;

  return {
    codigoPonto,
    latitude: raw.latitude !== undefined ? Number(raw.latitude) : undefined,
    longitude: raw.longitude !== undefined ? Number(raw.longitude) : undefined,
    classe: classeRaw,
    observador,
    observadoEm,
    resolucaoGsdCm,
    dataVoo,
    sensor,
    altitudeVooMetros,
    confianca,
    observacoes,
    papelConjunto: "held-out", // Inviolável
  };
}

/**
 * Ingere lote de observações de alta resolução por drone multiespectral.
 */
export function ingestarValidacaoDrone(
  entradas: (SubmissaoDrone | Record<string, unknown>)[]
): ResultadoIngestaoDrone {
  const aceitos: ItemDroneProcessado[] = [];
  const rejeitados: { registro: unknown; motivo: string }[] = [];
  const avisosQualidade: string[] = [];

  for (let i = 0; i < entradas.length; i++) {
    const raw = entradas[i];
    const sub = "papelConjunto" in raw && raw.papelConjunto === "held-out"
      ? (raw as SubmissaoDrone)
      : normalizarSubmissaoDrone(raw as Record<string, unknown>);

    if (!sub.codigoPonto || sub.codigoPonto.length === 0) {
      rejeitados.push({
        registro: raw,
        motivo: "Identificador 'codigoPonto' ausente no registro de drone.",
      });
      continue;
    }

    const rotulo: Rotulo = {
      classe: sub.classe,
      modalidade: "drone",
      observador: sub.observador,
      observadoEm: sub.observadoEm,
      confianca: sub.confianca,
      observacoes: sub.observacoes,
      cego: true, // Protocolo de validação final independente
    };

    const validacao = validarRotulo(rotulo);
    if (!validacao.valido) {
      rejeitados.push({
        registro: raw,
        motivo: `Validação do rótulo falhou para ${sub.codigoPonto}: ${validacao.motivo}`,
      });
      continue;
    }

    aceitos.push({
      codigoPonto: sub.codigoPonto,
      rotulo,
      resolucaoGsdCm: sub.resolucaoGsdCm,
      dataVoo: sub.dataVoo,
      sensor: sub.sensor,
      altitudeVooMetros: sub.altitudeVooMetros,
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
 * GUARDA DE SEGREGAÇÃO (Regra de Pesquisa da Fase D):
 * Verifica se algum ponto rotulado por drone ou marcado como held-out
 * está presente indevidamente na coleção de treino.
 *
 * @throws Error se qualquer item violar a segregação.
 */
export function assegurarSegregacaoTreino(
  pontosTreino: Array<{ rotulo?: Rotulo; modalidade?: string; papelConjunto?: string; codigo?: string }>
): void {
  for (const p of pontosTreino) {
    if (p.papelConjunto === "held-out") {
      throw new Error(
        `VIOLAÇÃO DE SEGREGAÇÃO METODOLÓGICA: O ponto ${p.codigo || "desconhecido"} está marcado como "held-out" e não pode integrar a matriz de treino.`
      );
    }
    if (p.rotulo?.modalidade === "drone" || p.modalidade === "drone") {
      throw new Error(
        `VIOLAÇÃO DE SEGREGAÇÃO METODOLÓGICA: O ponto ${p.codigo || "desconhecido"} possui rótulo de drone (Fase D) e é restrito ao conjunto held-out de validação final.`
      );
    }
  }
}
