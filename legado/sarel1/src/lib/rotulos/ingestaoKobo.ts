/**
 * ============================================================================
 * Ingestão de Formulários KoboToolbox de Campo — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * Conforme §11.1 do Plano v2 e §3 da Etapa 0 do Planejamento v3:
 * Ingestão de dados observados em campo, casamento por código de ponto e
 * verificação espacial por distância geodésica com tolerância de desvio.
 */

import { PontoAmostral } from "@/types/ponto";
import { ClasseRotulo, Rotulo, SubmissaoKobo } from "@/types/rotulo";
import { validarRotulo } from "./concordancia";

export interface ItemKoboProcessado {
  pontoCodigo: string;
  rotulo: Rotulo;
  atributosCampo?: Record<string, unknown>;
  distanciaGpsMetros?: number;
  desvioAceitavel?: boolean;
}

export interface RegistroRejeitadoKobo {
  registro: unknown;
  motivo: string;
}

export interface ResultadoIngestaoKobo {
  totalProcessados: number;
  aceitos: ItemKoboProcessado[];
  rejeitados: RegistroRejeitadoKobo[];
  avisosQualidade: string[];
}

/**
 * Calcula a distância ortodrômica (Haversine) em metros entre dois pares (lat, lon).
 */
export function calcularDistanciaHaversineMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Raio médio da Terra em metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Normaliza uma submissão bruta vinda do KoboToolbox (API REST ou exportação CSV/JSON).
 */
export function normalizarSubmissaoKobo(raw: Record<string, unknown>): SubmissaoKobo {
  // Identificação do ponto
  const codigoPonto = String(
    raw.codigoPonto ??
      raw.codigo_ponto ??
      raw.ponto_codigo ??
      raw.ponto_id ??
      raw.id_ponto ??
      ""
  ).trim();

  // Coordenadas GPS
  let latitude: number | undefined = undefined;
  let longitude: number | undefined = undefined;

  if (Array.isArray(raw._geolocation) && raw._geolocation.length >= 2) {
    latitude = Number(raw._geolocation[0]);
    longitude = Number(raw._geolocation[1]);
  } else if (raw.latitude !== undefined && raw.longitude !== undefined) {
    latitude = Number(raw.latitude);
    longitude = Number(raw.longitude);
  } else if (typeof raw.gps_ponto === "string") {
    // Kobo exporta "lat lon alt acc"
    const partes = raw.gps_ponto.split(" ").map(Number);
    if (partes.length >= 2 && !isNaN(partes[0]) && !isNaN(partes[1])) {
      latitude = partes[0];
      longitude = partes[1];
    }
  }

  // Rótulo / Classe
  const classeRaw = String(
    raw.classe ?? raw.erosao_observada ?? raw.classe_erosao ?? ""
  ).toLowerCase().trim() as ClasseRotulo;

  // Observador e data
  const observador = String(
    raw.observador ?? raw.entrevistador ?? raw._submitted_by ?? raw.agente_campo ?? ""
  ).trim();

  const observadoEm = String(
    raw.observadoEm ?? raw.data_observacao ?? raw.today ?? raw.data ?? ""
  ).trim();

  // Confiança
  let confianca: "alta" | "media" | "baixa" | undefined = undefined;
  const confRaw = String(raw.confianca ?? "").toLowerCase().trim();
  if (confRaw === "alta" || confRaw === "media" || confRaw === "baixa") {
    confianca = confRaw;
  }

  const observacoes = raw.observacoes ? String(raw.observacoes).trim() : undefined;
  const cego = raw.cego === undefined ? true : Boolean(raw.cego);

  // Atributos de campo adicionais
  const atributosCampo: Record<string, unknown> = {};
  if (raw.espessuraHorizonteA_cm !== undefined) {
    atributosCampo.espessuraHorizonteA_cm = Number(raw.espessuraHorizonteA_cm);
  }
  if (raw.exposicaoHorizonteB !== undefined) {
    atributosCampo.exposicaoHorizonteB = Boolean(raw.exposicaoHorizonteB);
  }
  if (raw.pedestaisRaizes !== undefined) {
    atributosCampo.pedestaisRaizes = Boolean(raw.pedestaisRaizes);
  }
  if (raw.sulcosIncipientes !== undefined) {
    atributosCampo.sulcosIncipientes = Boolean(raw.sulcosIncipientes);
  }
  if (raw.deposicaoSope !== undefined) {
    atributosCampo.deposicaoSope = Boolean(raw.deposicaoSope);
  }
  if (raw.grandeGrupoSolo !== undefined) {
    atributosCampo.grandeGrupoSolo = String(raw.grandeGrupoSolo);
  }

  return {
    codigoPonto,
    latitude,
    longitude,
    classe: classeRaw,
    observador,
    observadoEm,
    confianca,
    observacoes,
    cego,
    atributosCampo,
  };
}

/**
 * Ingere lote de submissões KoboToolbox e realiza casamento com a malha amostral.
 *
 * @param submissoes Array de submissões normalizadas ou registros brutos
 * @param pontosReferencia Pontos amostrais planejados do SAREL
 * @param toleranciaMetros Tolerância máxima aceitável de desvio GPS (padrão: 100 metros)
 */
export function ingestarSubmissoesKobo(
  submissoes: (SubmissaoKobo | Record<string, unknown>)[],
  pontosReferencia?: PontoAmostral[],
  toleranciaMetros: number = 100
): ResultadoIngestaoKobo {
  const aceitos: ItemKoboProcessado[] = [];
  const rejeitados: RegistroRejeitadoKobo[] = [];
  const avisosQualidade: string[] = [];

  const mapaPontosRef: Record<string, PontoAmostral> = {};
  if (pontosReferencia) {
    for (const p of pontosReferencia) {
      mapaPontosRef[p.codigo.toUpperCase()] = p;
    }
  }

  for (let i = 0; i < submissoes.length; i++) {
    const raw = submissoes[i];
    const sub = "codigoPonto" in raw && typeof raw.codigoPonto === "string"
      ? (raw as SubmissaoKobo)
      : normalizarSubmissaoKobo(raw as Record<string, unknown>);

    if (!sub.codigoPonto || sub.codigoPonto.length === 0) {
      rejeitados.push({
        registro: raw,
        motivo: "Identificador 'codigoPonto' ausente na submissão de campo.",
      });
      continue;
    }

    const rotulo: Rotulo = {
      classe: sub.classe,
      modalidade: "campo",
      observador: sub.observador,
      observadoEm: sub.observadoEm,
      confianca: sub.confianca,
      observacoes: sub.observacoes,
      cego: sub.cego ?? true,
    };

    const validacao = validarRotulo(rotulo);
    if (!validacao.valido) {
      rejeitados.push({
        registro: raw,
        motivo: `Validação do rótulo falhou para ${sub.codigoPonto}: ${validacao.motivo}`,
      });
      continue;
    }

    // Sinalização de não-cegueira (Auditoria B3 e Regra 4)
    if (!rotulo.cego) {
      avisosQualidade.push(
        `AVISO DE QUALIDADE: Rótulo de campo do ponto ${sub.codigoPonto} coletado em modo NÃO-CEGO (cego: false).`
      );
    }

    // Casamento e verificação espacial
    let distanciaGpsMetros: number | undefined = undefined;
    let desvioAceitavel: boolean | undefined = undefined;

    const pontoRef = mapaPontosRef[sub.codigoPonto.toUpperCase()];
    if (pontoRef) {
      if (
        sub.latitude !== undefined &&
        sub.longitude !== undefined &&
        !isNaN(sub.latitude) &&
        !isNaN(sub.longitude)
      ) {
        distanciaGpsMetros = calcularDistanciaHaversineMetros(
          pontoRef.latitude,
          pontoRef.longitude,
          sub.latitude,
          sub.longitude
        );

        distanciaGpsMetros = Number(distanciaGpsMetros.toFixed(1));
        desvioAceitavel = distanciaGpsMetros <= toleranciaMetros;

        if (!desvioAceitavel) {
          avisosQualidade.push(
            `AVISO ESPACIAL: Ponto ${sub.codigoPonto} foi registrado no GPS a ${distanciaGpsMetros}m ` +
              `da coordenada teórica planejada (tolerância: ${toleranciaMetros}m).`
          );
        }
      }
    } else if (pontosReferencia && pontosReferencia.length > 0) {
      avisosQualidade.push(
        `AVISO DE REFERÊNCIA: Código de ponto ${sub.codigoPonto} não encontrado na lista de pontos de referência do SAREL.`
      );
    }

    aceitos.push({
      pontoCodigo: sub.codigoPonto,
      rotulo,
      atributosCampo: sub.atributosCampo,
      distanciaGpsMetros,
      desvioAceitavel,
    });
  }

  return {
    totalProcessados: submissoes.length,
    aceitos,
    rejeitados,
    avisosQualidade,
  };
}
