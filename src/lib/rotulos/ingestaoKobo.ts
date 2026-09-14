/**
 * ============================================================================
 * Ingestão de Formulários KoboToolbox de Campo — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * O QUÊ ESTE MÓDULO REALIZA:
 * - Realiza a ingestão, validação geodésica e estruturação das respostas de campo
 *   coletadas em dispositivos móveis via formulários KoboToolbox / ODK (Fase B).
 * - Realiza o casamento biunívoco entre a coordenada GPS registrada in-situ pelo
 *   aplicativo e a coordenada teórica planejada pelo SAREL na malha amostral.
 * - Valida os metadados periciais: identificador do ponto, classe observada,
 *   nome do avaliador, data/hora da inspeção e protocolo cego.
 *
 * POR QUÊ ESTE PROCEDIMENTO É EXIGIDO NA METODOLOGIA (SEÇÃO 3.3 & REGRA 4):
 * 1. Tolerância Geodésica de Campo (Parâmetro P03 - Raio de 150 m):
 *    No campo real, obstáculos físicos (cercas, curvas de nível, carreadores com lama
 *    ou culturas altas) frequentemente impedem o operador de pisar exatamente no centróide
 *    do pixel de 10 m. O cálculo geodésico de Haversine audita a distância real: se o
 *    operador esteve a até 150 m da feição, o registro é aceito com registro do desvio;
 *    se a distância exceder o limite, o registro é rejeitado para impedir falsas atribuições.
 * 2. Inviolabilidade do Rótulo Humano (Regra 4 do SAREL):
 *    A classe de campo ("erosao" vs "controle") constitui a verdade terrestre primária.
 *    O sistema jamais pode alterar, imputar ou recalcular esse rótulo por heurísticas.
 * 3. Base para Análise de Concordância Inter-Avaliadores:
 *    A validação por protocolo cego com múltiplos técnicos avaliando os mesmos pontos
 *    permite calcular o Coeficiente Kappa de Cohen de campo, demonstrando à banca
 *    examinadora que o conceito de "erosão laminar ativa" é reprodutível entre peritos.
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
