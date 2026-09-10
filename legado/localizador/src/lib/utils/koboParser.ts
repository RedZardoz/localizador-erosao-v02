import Papa from "papaparse";
import { ErosionPoint } from "@/types/erosion";
import { haversineDistanceMeters } from "./geoUtils";

/**
 * ============================================================================
 * Módulo de Integração de Dados de Campo KoboToolbox / GNSS RTK
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * METODOLOGIA DE CAMPO & REFERÊNCIA AO README:
 * - README §1 & §5: Amostragem Estratificada e Validação em Campo com GNSS
 *   Geodésico (RTK) e Formulários Padronizados (KoboToolbox/ODK Collect).
 * - Fecha o ciclo científico: Triagem Espectral (GEE) -> Campanha de Campo ->
 *   Importação de Observações In Situ -> Rotulagem como 'field-validated'.
 * - Faz o casamento espacial por proximidade geográfica (raio padrão: 150m)
 *   e por correspondência de código ('PR-CAND-xxx').
 */

export const MATCH_DISTANCE_METERS = 150;

export interface KoboMatchResult {
  /** ID do ponto amostral casado na base do sistema */
  matchedPointId: string;
  /** Distância geodésica entre a coordenada planejada e a coordenada medida em campo [m] */
  distanceMeters: number;
  /** Dicionário completo de respostas e atributos do formulário KoboToolbox */
  fieldObservations: Record<string, string>;
}

export interface KoboImportSummary {
  /** Total de linhas processadas na planilha Kobo */
  totalRows: number;
  /** Lista de pontos casados com sucesso */
  matched: KoboMatchResult[];
  /** Número de linhas que não casaram com nenhum ponto de triagem existente */
  unmatchedRows: number;
}

interface ParsedGps {
  lat: number;
  lng: number;
}

/**
 * Extrai latitude e longitude de múltiplos formatos de exportação do KoboToolbox/ODK.
 * Suporta colunas separadas (_gps_latitude, _gps_longitude) ou formato bruto geopoint (lat lon alt acc).
 */
function extractGps(row: Record<string, any>): ParsedGps | null {
  const keys = Object.keys(row);

  const latKey = keys.find((k) => /latitude$/i.test(k.trim()));
  const lngKey = keys.find((k) => /longitude$/i.test(k.trim()));
  if (latKey && lngKey) {
    const lat = parseFloat(String(row[latKey]).replace(",", "."));
    const lng = parseFloat(String(row[lngKey]).replace(",", "."));
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // Formato bruto ODK/Kobo geopoint: "lat lon alt acc" numa única célula
  const geopointKey = keys.find((k) => /^(gps|location|point|geopoint|coordenad)/i.test(k.trim()));
  if (geopointKey) {
    const parts = String(row[geopointKey]).trim().split(/\s+/).map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
  }

  return null;
}

/**
 * Processa um arquivo CSV exportado do KoboToolbox e realiza o matching espacial com os pontos triados.
 *
 * @param csvContent - Conteúdo em texto bruto do arquivo CSV
 * @param existingPoints - Pontos atualmente carregados na plataforma
 * @returns Relatório de importação com os casamentos espaciais e atributos de campo.
 */
export function parseAndMatchKoboExport(csvContent: string, existingPoints: ErosionPoint[]): KoboImportSummary {
  const parsed = Papa.parse<Record<string, any>>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const matched: KoboMatchResult[] = [];
  let unmatchedRows = 0;

  for (const row of parsed.data) {
    // 1. Tenta correspondência exata por código do ponto (ex: PR-CAND-042)
    const codeKey = Object.keys(row).find((k) => /^(codigo|code|ponto_id|point_id|id_ponto)/i.test(k.trim()));
    const explicitCode = codeKey ? String(row[codeKey]).trim() : null;

    let matchedPoint: ErosionPoint | undefined;
    let matchDistance = 0;

    if (explicitCode) {
      matchedPoint = existingPoints.find(
        (p) => p.code.toLowerCase() === explicitCode.toLowerCase() || p.id.toLowerCase() === explicitCode.toLowerCase()
      );
    }

    // 2. Se não casou por código, tenta o vizinho mais próximo dentro do raio de tolerância (150m)
    if (!matchedPoint) {
      const gps = extractGps(row);
      if (gps) {
        let closestDist = Infinity;
        let closestPoint: ErosionPoint | undefined;

        for (const pt of existingPoints) {
          const dist = haversineDistanceMeters(gps.lat, gps.lng, pt.latitude, pt.longitude);
          if (dist < closestDist) {
            closestDist = dist;
            closestPoint = pt;
          }
        }

        if (closestPoint && closestDist <= MATCH_DISTANCE_METERS) {
          matchedPoint = closestPoint;
          matchDistance = closestDist;
        }
      }
    }

    if (matchedPoint) {
      // Limpa chaves internas do Kobo (que começam com __ ou metadados de sistema)
      const fieldObservations: Record<string, string> = {};
      for (const [k, v] of Object.entries(row)) {
        if (v != null && String(v).trim() !== "" && !k.startsWith("__") && k !== "_id" && k !== "_uuid") {
          fieldObservations[k] = String(v).trim();
        }
      }

      matched.push({
        matchedPointId: matchedPoint.id,
        distanceMeters: Number(matchDistance.toFixed(1)),
        fieldObservations,
      });
    } else {
      unmatchedRows++;
    }
  }

  return {
    totalRows: parsed.data.length,
    matched,
    unmatchedRows,
  };
}

export const parseKoboCsv = parseAndMatchKoboExport;
