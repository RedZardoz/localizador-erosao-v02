/**
 * ============================================================================
 * Máscara e Critérios de Elegibilidade Espacial — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * CRITÉRIOS DE ELEGIBILIDADE (PLANEJAMENTO V3, §10.1):
 * 1. Uso do Solo (P05): ESA WorldCover 10m [30: Pastagem, 40: Lavouras, 60: Solo Exposto].
 * 2. Declividade (P04): Calculada estritamente em EPSG:31982 (SIRGAS 2000 / UTM 22S)
 *    na faixa de escoamento superficial (padrão: 3% a 20%, relevo suave-ondulado e ondulado).
 * 3. Exclusão Hídrica (P04): Buffer de 30 metros ao redor de corpos d''água (JRC Global Surface Water).
 * 4. Exclusão Urbana (P04): Buffer de 150 metros ao redor de áreas urbanizadas (WorldCover classe 50).
 *
 * CORREÇÕES EM RELAÇÃO AO LEGADO:
 * - Declividade em EPSG:31982 no lugar de EPSG:3857 (elimina subestimação de ~10% no Paraná).
 * - Tratamento integral de FeatureCollection: une todas as feições em MultiPolygon sem descarte.
 */

import { CRS_TERRENO_PADRAO, grausParaPct, pctParaGraus } from "./terreno";

export interface OpcoesElegibilidade {
  allowedLandCoverClasses?: number[];
  minSlopePercent?: number;
  maxSlopePercent?: number;
  waterOccurrenceThreshold?: number;
  waterBufferMeters?: number;
  urbanBufferMeters?: number;
}

export const OPCOES_ELEGIBILIDADE_PADRAO: Required<OpcoesElegibilidade> = {
  allowedLandCoverClasses: [30, 40, 60], // P05
  minSlopePercent: 3.0,                  // P04
  maxSlopePercent: 20.0,                 // P04
  waterOccurrenceThreshold: 10,          // P04
  waterBufferMeters: 30,                 // P04
  urbanBufferMeters: 150,                // P04
};

export const PROJECAO_ELEGIBILIDADE = CRS_TERRENO_PADRAO; // "EPSG:31982"

/**
 * Valida as opções de elegibilidade garantindo limites e tipos consistentes.
 */
export function validarOpcoesElegibilidade(
  opcoes?: OpcoesElegibilidade
): Required<OpcoesElegibilidade> {
  const minSlope = opcoes?.minSlopePercent !== undefined ? opcoes.minSlopePercent : OPCOES_ELEGIBILIDADE_PADRAO.minSlopePercent;
  const maxSlope = opcoes?.maxSlopePercent !== undefined ? opcoes.maxSlopePercent : OPCOES_ELEGIBILIDADE_PADRAO.maxSlopePercent;
  const waterThreshold = opcoes?.waterOccurrenceThreshold !== undefined ? opcoes.waterOccurrenceThreshold : OPCOES_ELEGIBILIDADE_PADRAO.waterOccurrenceThreshold;
  const waterBuffer = opcoes?.waterBufferMeters !== undefined ? opcoes.waterBufferMeters : OPCOES_ELEGIBILIDADE_PADRAO.waterBufferMeters;
  const urbanBuffer = opcoes?.urbanBufferMeters !== undefined ? opcoes.urbanBufferMeters : OPCOES_ELEGIBILIDADE_PADRAO.urbanBufferMeters;
  const classes = opcoes?.allowedLandCoverClasses ? [...opcoes.allowedLandCoverClasses] : [...OPCOES_ELEGIBILIDADE_PADRAO.allowedLandCoverClasses];

  if (!Number.isFinite(minSlope) || minSlope < 0) {
    throw new Error(`Declividade mínima inválida (${minSlope}%).`);
  }
  if (!Number.isFinite(maxSlope) || maxSlope <= minSlope) {
    throw new Error(`Declividade máxima (${maxSlope}%) deve ser maior que a mínima (${minSlope}%).`);
  }
  if (classes.length === 0) {
    throw new Error("Pelo menos uma classe de cobertura deve ser elegível.");
  }

  return {
    allowedLandCoverClasses: classes,
    minSlopePercent: minSlope,
    maxSlopePercent: maxSlope,
    waterOccurrenceThreshold: waterThreshold,
    waterBufferMeters: waterBuffer,
    urbanBufferMeters: urbanBuffer,
  };
}

/**
 * Normaliza e consolida qualquer formato de AOI (Polygon, MultiPolygon ou FeatureCollection com múltiplas feições)
 * em uma geometria GeoJSON única sem descartar nenhuma feição (corrige achado 10.1 do plano).
 */
export function normalizarAoIGeoJson(aoi: any): GeoJSON.Polygon | GeoJSON.MultiPolygon {
  if (!aoi || typeof aoi !== "object") {
    throw new Error("AOI não fornecida ou formato inválido.");
  }

  // Se for uma Feature direta
  if (aoi.type === "Feature" && aoi.geometry) {
    return normalizarAoIGeoJson(aoi.geometry);
  }

  // Se for uma FeatureCollection, une todas as feições em um MultiPolygon
  if (aoi.type === "FeatureCollection" && Array.isArray(aoi.features)) {
    if (aoi.features.length === 0) {
      throw new Error("FeatureCollection de AOI está vazia.");
    }
    if (aoi.features.length === 1) {
      return normalizarAoIGeoJson(aoi.features[0].geometry || aoi.features[0]);
    }

    // Coleta todas as coordenadas de polígonos
    const todosPoligonos: number[][][][] = [];
    for (const f of aoi.features) {
      const geom = f.geometry || f;
      if (geom.type === "Polygon" && Array.isArray(geom.coordinates)) {
        todosPoligonos.push(geom.coordinates);
      } else if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
        for (const pol of geom.coordinates) {
          todosPoligonos.push(pol);
        }
      } else {
        throw new Error(`Geometria inválida ou não suportada em FeatureCollection: ${geom.type}`);
      }
    }

    return {
      type: "MultiPolygon",
      coordinates: todosPoligonos,
    };
  }

  // Geometria nativa
  if (aoi.type === "Polygon" || aoi.type === "MultiPolygon") {
    if (!Array.isArray(aoi.coordinates) || aoi.coordinates.length === 0) {
      throw new Error(`Geometria ${aoi.type} não possui coordenadas válidas.`);
    }
    return aoi as GeoJSON.Polygon | GeoJSON.MultiPolygon;
  }

  throw new Error(`Tipo de geometria não suportado para AOI: ${aoi.type}.`);
}

/**
 * Verifica se uma classe da ESA WorldCover pertence às classes elegíveis (P05).
 */
export function isClasseUsoElegivel(
  classeCodigo: number,
  classesPermitidas: number[] = OPCOES_ELEGIBILIDADE_PADRAO.allowedLandCoverClasses
): boolean {
  return classesPermitidas.includes(classeCodigo);
}

/**
 * Verifica se um valor de declividade (em percentual ou graus) atende aos critérios de elegibilidade de relevo.
 */
export function isDeclividadeElegivel(
  declividadePct: number,
  minPct = OPCOES_ELEGIBILIDADE_PADRAO.minSlopePercent,
  maxPct = OPCOES_ELEGIBILIDADE_PADRAO.maxSlopePercent
): boolean {
  if (!Number.isFinite(declividadePct)) return false;
  return declividadePct >= minPct && declividadePct <= maxPct;
}
