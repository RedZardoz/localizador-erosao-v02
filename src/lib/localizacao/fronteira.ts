/**
 * ============================================================================
 * Delimitação e Fronteira do Estado do Paraná — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * PROVENIÊNCIA DOS LIMITES:
 * - Limites estaduais oficiais: Instituto Brasileiro de Geografia e Estatística (IBGE)
 * - Geodésia: SIRGAS 2000 / WGS 84 (EPSG:4326)
 * - Bbox envolvente estrito do território do Paraná:
 *   Latitude: [-26.72, -22.51]
 *   Longitude: [-54.62, -48.02]
 */

export const BBOX_PARANA: {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} = {
  minLat: -26.72,
  maxLat: -22.51,
  minLon: -54.62,
  maxLon: -48.02,
};

/**
 * Verifica se a coordenada está dentro do envelope geográfico (Bounding Box) do Paraná.
 */
export function estaNoBboxParana(lat: number, lon: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  return (
    lat >= BBOX_PARANA.minLat &&
    lat <= BBOX_PARANA.maxLat &&
    lon >= BBOX_PARANA.minLon &&
    lon <= BBOX_PARANA.maxLon
  );
}
