/**
 * ============================================================================
 * Ingestão de Formulários KoboToolbox de Campo — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * ESPECIFICAÇÃO (PLANO V3, §12.1):
 * - Ingestão de respostas brutas de campo da Fase B.
 * - Casamento por código e por coordenada com tolerância geodésica P03 (ex.: 150 m).
 * - Preserva respostas como vieram do formulário, sem inventar valores.
 */

import { Rotulo } from "@/types/rotulo";
import { validarRotulo } from "./concordancia";

export interface ItemKoboProcessado {
  pontoCodigo: string;
  rotulo: Rotulo;
  distanciaGpsMetros?: number;
  desvioAceitavel: boolean;
  respostasBrutas: Record<string, unknown>;
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
 * Distância Haversine em metros entre dois pontos geográficos.
 */
export function calcularDistanciaHaversineMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
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

export interface CoordenadaEsperada {
  codigo: string;
  latitude: number;
  longitude: number;
}

/**
 * Ingere lote de submissões KoboToolbox validando raio de casamento P03.
 */
export function ingestarSubmissoesKobo(
  registros: Record<string, unknown>[],
  coordenadasEsperadas: Record<string, CoordenadaEsperada>,
  raioToleranciaMetros: number // P03 (ex.: 150m)
): ResultadoIngestaoKobo {
  const aceitos: ItemKoboProcessado[] = [];
  const rejeitados: RegistroRejeitadoKobo[] = [];
  const avisosQualidade: string[] = [];

  for (const reg of registros) {
    const codigo = String(reg.codigoPonto || reg.codigo || reg.ponto_id || "").trim();
    if (!codigo) {
      rejeitados.push({ registro: reg, motivo: "Identificador 'codigoPonto' ausente." });
      continue;
    }

    const classe = String(reg.classe || reg.classe_erosao || "").trim();
    const observador = String(reg.observador || reg.entrevistador || "").trim();
    const observadoEm = String(reg.observadoEm || reg.data_observacao || "").trim();
    const cego = reg.cego === false ? false : true;

    const rotulo: Rotulo = {
      classe,
      modalidade: "campo",
      observador,
      observadoEm,
      cego,
      confianca: reg.confianca as "alta" | "media" | "baixa" | undefined,
      observacoes: reg.observacoes ? String(reg.observacoes) : undefined,
    };

    const validacao = validarRotulo(rotulo);
    if (!validacao.valido) {
      rejeitados.push({ registro: reg, motivo: validacao.motivo || "Rótulo inválido." });
      continue;
    }

    if (!cego) {
      avisosQualidade.push(
        `AVISO DE QUALIDADE: Ponto ${codigo} rotulado em campo em modo NÃO-CEGO (cego: false).`
      );
    }

    let distanciaMetros: number | undefined = undefined;
    let desvioAceitavel = true;

    const geoArr = Array.isArray(reg._geolocation) ? (reg._geolocation as unknown[]) : null;
    const latGps = Number(reg.latitude ?? geoArr?.[0]);
    const lngGps = Number(reg.longitude ?? geoArr?.[1]);

    if (!isNaN(latGps) && !isNaN(lngGps) && coordenadasEsperadas[codigo]) {
      const esp = coordenadasEsperadas[codigo];
      distanciaMetros = calcularDistanciaHaversineMetros(latGps, lngGps, esp.latitude, esp.longitude);
      if (distanciaMetros > raioToleranciaMetros) {
        desvioAceitavel = false;
        avisosQualidade.push(
          `AVISO: Ponto ${codigo} coletado a ${distanciaMetros.toFixed(1)} m da coordenada planejada (tolerância P03: ${raioToleranciaMetros} m).`
        );
      }
    }

    aceitos.push({
      pontoCodigo: codigo,
      rotulo,
      distanciaGpsMetros: distanciaMetros,
      desvioAceitavel,
      respostasBrutas: reg,
    });
  }

  return {
    totalProcessados: registros.length,
    aceitos,
    rejeitados,
    avisosQualidade,
  };
}
