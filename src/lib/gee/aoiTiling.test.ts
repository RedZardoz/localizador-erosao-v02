import { describe, it, expect } from "vitest";
import { getGeoJsonBBox, generateAOITiles } from "./aoiTiling";

describe("aoiTiling - Particionamento Espacial em Lotes (Puro)", () => {
  const paranaBboxGeoJSON: GeoJSON.Polygon = {
    type: "Polygon",
    coordinates: [
      [
        [-54.6, -26.7],
        [-54.6, -22.5],
        [-48.0, -22.5],
        [-48.0, -26.7],
        [-54.6, -26.7],
      ],
    ],
  };

  it("deve calcular a BBox corretamente", () => {
    const [minLng, minLat, maxLng, maxLat] = getGeoJsonBBox(paranaBboxGeoJSON);
    expect(minLng).toBeCloseTo(-54.6);
    expect(minLat).toBeCloseTo(-26.7);
    expect(maxLng).toBeCloseTo(-48.0);
    expect(maxLat).toBeCloseTo(-22.5);
  });

  it("deve manter 1 único lote para áreas pequenas (< 1 grau)", () => {
    const smallAoi: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [-53.8, -25.2],
          [-53.8, -24.8],
          [-53.3, -24.8],
          [-53.3, -25.2],
          [-53.8, -25.2],
        ],
      ],
    };

    const tiles = generateAOITiles(smallAoi, 1.0);
    expect(tiles).toHaveLength(1);
  });

  it("deve subdividir áreas grandes como o Paraná em múltiplos lotes regulares", () => {
    const tiles = generateAOITiles(paranaBboxGeoJSON, 1.0);
    expect(tiles.length).toBeGreaterThanOrEqual(12); // ~7 colunas x 5 linhas
    expect(tiles[0].type).toBe("Polygon");
    expect(tiles[0].coordinates[0]).toHaveLength(5);
  });
});
