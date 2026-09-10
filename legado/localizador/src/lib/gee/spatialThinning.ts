import { haversineDistanceMeters } from "../utils/geoUtils";

export interface GeoCandidate {
  latitude: number;
  longitude: number;
  priorityScore?: number;
  [key: string]: any;
}

/**
 * Algoritmo guloso de Thinning Espacial (Filtro por Distância Mínima).
 *
 * Garante que os pontos candidatos selecionados mantenham uma distância geodésica
 * mínima entre si (em km), evitando aglomerações (clusters) e garantindo uma
 * distribuição espacialmente equilibrada sobre a Área de Interesse (AOI).
 *
 * Quando dois pontos concorrem pela mesma vizinhança, o algoritmo preserva
 * aquele com maior `priorityScore` (ou severidade).
 *
 * @param candidates Lista de pontos candidatos
 * @param minSpacingKm Distância mínima exigida em quilômetros (ex: 1.0 km)
 * @param maxPoints Limite máximo opcional de pontos aceitos
 * @returns Lista filtrada de pontos que respeitam a distância mínima
 */
export function thinBySpacing<T extends GeoCandidate>(
  candidates: T[],
  minSpacingKm: number,
  maxPoints?: number
): T[] {
  if (!candidates || candidates.length === 0) {
    return [];
  }

  if (minSpacingKm <= 0) {
    return maxPoints ? candidates.slice(0, maxPoints) : [...candidates];
  }

  const minSpacingMeters = minSpacingKm * 1000;

  // Ordena prioritariamente por priorityScore decrescente (quando disponível)
  const sorted = [...candidates].sort((a, b) => {
    const scoreA = typeof a.priorityScore === "number" ? a.priorityScore : 0;
    const scoreB = typeof b.priorityScore === "number" ? b.priorityScore : 0;
    return scoreB - scoreA;
  });

  const accepted: T[] = [];

  for (const candidate of sorted) {
    if (typeof candidate.latitude !== "number" || typeof candidate.longitude !== "number") {
      continue;
    }

    // Verifica se o candidato está a pelo menos minSpacingMeters de todos os já aceitos
    let isFarEnough = true;
    for (const acceptedPoint of accepted) {
      const dist = haversineDistanceMeters(
        candidate.latitude,
        candidate.longitude,
        acceptedPoint.latitude,
        acceptedPoint.longitude
      );

      if (dist < minSpacingMeters) {
        isFarEnough = false;
        break;
      }
    }

    if (isFarEnough) {
      accepted.push(candidate);
      if (maxPoints && accepted.length >= maxPoints) {
        break;
      }
    }
  }

  return accepted;
}
