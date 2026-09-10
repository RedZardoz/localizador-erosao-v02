import { ErosionPoint } from "@/types/erosion";
import { paranaBoundaryGeoJSON } from "@/data/paranaBoundary";

/**
 * ============================================================================
 * Módulo de Utilitários Geodésicos, Espaciais e Integração com Visualizadores
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * Contém funções para:
 * - Conversão de coordenadas entre Graus Decimais (DD) e Graus, Minutos e Segundos (DMS)
 * - Geração de links profundos para o Google Earth 3D Web e Google Maps Satélite
 * - Cálculo de distâncias esféricas de grande círculo (Fórmula de Haversine)
 * - Cálculo de enquadramento geográfico (Bounding Box / Envelope Espacial)
 * - Testes de contenção ponto-em-polígono (Ray-Casting Algorithm) para polígonos arbitrários e limites do Paraná
 */

/**
 * Converte coordenadas decimais em formato DMS (Graus, Minutos e Segundos com hemisfério).
 *
 * @param coordinate - Valor decimal da coordenada (ex: -25.4284)
 * @param isLatitude - True para Latitude (N/S), False para Longitude (E/W)
 * @returns String formatada (ex: 25° 25' 42.2" S)
 */
export function formatToDMS(coordinate: number, isLatitude: boolean): string {
  const absolute = Math.abs(coordinate);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);

  let direction = "";
  if (isLatitude) {
    direction = coordinate >= 0 ? "N" : "S";
  } else {
    direction = coordinate >= 0 ? "E" : "W";
  }

  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

/**
 * Gera URL com esquema de câmera tridimensional para visualização direta no Google Earth Web.
 *
 * @param lat - Latitude decimal (WGS84)
 * @param lng - Longitude decimal (WGS84)
 * @param elevation - Altitude ortométrica do terreno em metros (default: 500)
 * @returns Link para o visualizador 3D do Google Earth.
 */
export function getGoogleEarthWebUrl(lat: number, lng: number, elevation: number = 500): string {
  return `https://earth.google.com/web/@${lat.toFixed(6)},${lng.toFixed(6)},${elevation}a,1500d,35y,60h,60t,0r`;
}

/**
 * Gera URL direta para abrir as coordenadas no Google Maps em visualização de satélite.
 *
 * @param lat - Latitude decimal (WGS84)
 * @param lng - Longitude decimal (WGS84)
 * @returns Link para o Google Maps.
 */
export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}&layer=c`;
}

/**
 * Calcula o envelope geográfico envolvente (Bounding Box com margem de respiro) para um conjunto de pontos.
 *
 * @param points - Coleção de pontos de erosão
 * @returns [[minLng, minLat], [maxLng, maxLat]] ou null se o array estiver vazio.
 */
export function calculatePointsBBox(points: ErosionPoint[]): [[number, number], [number, number]] | null {
  if (!points.length) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const pt of points) {
    if (pt.longitude < minLng) minLng = pt.longitude;
    if (pt.longitude > maxLng) maxLng = pt.longitude;
    if (pt.latitude < minLat) minLat = pt.latitude;
    if (pt.latitude > maxLat) maxLat = pt.latitude;
  }

  return [
    [minLng - 0.05, minLat - 0.05],
    [maxLng + 0.05, maxLat + 0.05],
  ];
}

/**
 * Calcula a distância geodésica entre duas coordenadas na superfície da Terra pela Fórmula de Haversine.
 *
 * @param lat1 - Latitude do ponto 1 em graus
 * @param lon1 - Longitude do ponto 1 em graus
 * @param lat2 - Latitude do ponto 2 em graus
 * @param lon2 - Longitude do ponto 2 em graus
 * @returns Distância geodésica em metros [m].
 */
export function haversineDistanceMeters(
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
 * Testa se um ponto [lng, lat] está contido em um polígono de anéis lineares (algoritmo Ray-Casting).
 *
 * @param point - [longitude, latitude]
 * @param polygon - Array de anéis lineares [[[lng, lat], ...]]
 * @returns True se o ponto estiver dentro do polígono.
 */
export function isPointInPolygon(point: [number, number], polygon: number[][][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (const ring of polygon) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0],
        yi = ring[i][1];
      const xj = ring[j][0],
        yj = ring[j][1];

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
  }

  return inside;
}

/**
 * Testa se um ponto (latitude, longitude) está dentro de uma geometria GeoJSON Polygon ou MultiPolygon.
 */
export function isPointInGeoJSON(lat: number, lng: number, geometry: any): boolean {
  if (!geometry) return true;

  if (geometry.type === "Polygon") {
    return isPointInPolygon([lng, lat], geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    for (const poly of geometry.coordinates) {
      if (isPointInPolygon([lng, lat], poly)) return true;
    }
    return false;
  }

  return true;
}

/**
 * Verifica se um ponto (latitude, longitude) está dentro dos limites do Estado do Paraná.
 */
export function isPointInParana(lat: number, lng: number): boolean {
  const features = (paranaBoundaryGeoJSON as any).features;
  if (!features || !features.length) return true;

  for (const feat of features) {
    if (isPointInGeoJSON(lat, lng, feat.geometry)) return true;
  }

  return false;
}

/**
 * Alias para isPointInParana.
 */
export const isPointInsideParana = isPointInParana;

/**
 * Conta quantos pontos de uma lista caem fora dos limites territoriais do Estado do Paraná.
 */
export function countPointsOutsideParana(points: Array<{ latitude: number; longitude: number }>): number {
  return points.filter((p) => !isPointInParana(p.latitude, p.longitude)).length;
}
