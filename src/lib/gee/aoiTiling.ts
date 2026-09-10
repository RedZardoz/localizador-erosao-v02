/**
 * Utilitários puros de Geometria e Tiling Espacial de Áreas de Interesse (AOI).
 *
 * Módulo puramente geométrico (zero dependência de SDKs externos ou I/O)
 * para garantir testes ultra-rápidos e isolamento de responsabilidades.
 */

/**
 * Calcula a Bounding Box [minLng, minLat, maxLng, maxLat] de um GeoJSON Polygon ou MultiPolygon.
 */
export function getGeoJsonBBox(
  geom: GeoJSON.Polygon | GeoJSON.MultiPolygon
): [number, number, number, number] {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const extractCoords = (coords: any) => {
    if (typeof coords[0] === "number") {
      const [lng, lat] = coords;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else {
      coords.forEach(extractCoords);
    }
  };

  extractCoords(geom.coordinates);
  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Divide uma AOI em uma grade regular de sub-regiões (lotes/tiles) para áreas extensas
 * (ex: Estado do Paraná), permitindo processamento em lote em resolução máxima (10m)
 * sem exceder os limites de timeout ou memória do Earth Engine.
 */
export function generateAOITiles(
  aoiGeoJSON: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  maxTileSizeDeg?: number
): GeoJSON.Polygon[] {
  const tamanhoTile = maxTileSizeDeg !== undefined ? maxTileSizeDeg : 1.0;
  const [minLng, minLat, maxLng, maxLat] = getGeoJsonBBox(aoiGeoJSON);
  const dLng = maxLng - minLng;
  const dLat = maxLat - minLat;

  if (dLng <= tamanhoTile && dLat <= tamanhoTile) {
    if (aoiGeoJSON.type === "Polygon") {
      return [aoiGeoJSON as GeoJSON.Polygon];
    }
    return [
      {
        type: "Polygon",
        coordinates: [
          [
            [minLng, minLat],
            [minLng, maxLat],
            [maxLng, maxLat],
            [maxLng, minLat],
            [minLng, minLat],
          ],
        ],
      },
    ];
  }

  let nCols = Math.ceil(dLng / tamanhoTile);
  if (nCols < 1) nCols = 1;
  let nRows = Math.ceil(dLat / tamanhoTile);
  if (nRows < 1) nRows = 1;

  const tiles: GeoJSON.Polygon[] = [];
  const colStep = dLng / nCols;
  const rowStep = dLat / nRows;

  for (let i = 0; i < nCols; i++) {
    for (let j = 0; j < nRows; j++) {
      const tileMinLng = minLng + i * colStep;
      const tileMaxLng = minLng + (i + 1) * colStep;
      const tileMinLat = minLat + j * rowStep;
      const tileMaxLat = minLat + (j + 1) * rowStep;

      tiles.push({
        type: "Polygon",
        coordinates: [
          [
            [tileMinLng, tileMinLat],
            [tileMinLng, tileMaxLat],
            [tileMaxLng, tileMaxLat],
            [tileMaxLng, tileMinLat],
            [tileMinLng, tileMinLat],
          ],
        ],
      });
    }
  }

  return tiles;
}
