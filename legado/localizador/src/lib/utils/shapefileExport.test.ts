import { describe, it, expect } from "vitest";
import {
  calculatePolygonMetrics,
  generateShapefileBuffers,
  exportPolygonsToKML,
  exportPolygonsToGeoJSON,
  exportPolygonsToShapefileZip,
} from "./shapefileExport";
import { DrawnPolygon } from "@/types/erosion";

describe("shapefileExport & polygon metrics", () => {
  const samplePolygon: DrawnPolygon = {
    id: "POLY-001",
    name: "Talhão Piloto Céu Azul",
    category: "Talhão Agrícola",
    severity: "Alta",
    notes: "Talhão com evidência de perda de horizonte superficial",
    areaM2: 50000,
    areaHa: 5.0,
    perimeterM: 900,
    createdAt: "2026-08-30T10:00:00.000Z",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-53.84, -25.15],
          [-53.83, -25.15],
          [-53.83, -25.16],
          [-53.84, -25.16],
          [-53.84, -25.15],
        ],
      ],
    },
  };

  it("calculates area and perimeter accurately for coordinates", () => {
    const coords: [number, number][] = [
      [-53.84, -25.15],
      [-53.83, -25.15],
      [-53.83, -25.16],
      [-53.84, -25.16],
    ];
    const metrics = calculatePolygonMetrics(coords);
    expect(metrics.areaM2).toBeGreaterThan(0);
    expect(metrics.areaHa).toBeGreaterThan(0);
    expect(metrics.perimeterM).toBeGreaterThan(0);
  });

  it("generates valid binary Shapefile buffers (.shp, .shx, .dbf, .prj)", () => {
    const buffers = generateShapefileBuffers([samplePolygon]);
    expect(buffers.shp).toBeDefined();
    expect(buffers.shx).toBeDefined();
    expect(buffers.dbf).toBeDefined();
    expect(buffers.prj).toContain("GCS_WGS_1984");

    // Check .shp Header File Code (9994 = 0x0000270A)
    const view = new DataView(buffers.shp.buffer);
    expect(view.getInt32(0, false)).toBe(9994);
    // Check Shape Type (5 = Polygon)
    expect(view.getInt32(32, true)).toBe(5);

    // Check DBF Header byte 0
    expect(buffers.dbf[0]).toBe(0x03);
  });

  it("exports polygons to valid KML with styling", () => {
    const kml = exportPolygonsToKML([samplePolygon]);
    expect(kml).toContain("<?xml");
    expect(kml).toContain("<kml");
    expect(kml).toContain("Talhão Piloto Céu Azul");
    expect(kml).toContain("<Polygon>");
    expect(kml).toContain("<outerBoundaryIs>");
  });

  it("exports polygons to GeoJSON FeatureCollection", () => {
    const geojsonStr = exportPolygonsToGeoJSON([samplePolygon]);
    const parsed = JSON.parse(geojsonStr);
    expect(parsed.type).toBe("FeatureCollection");
    expect(parsed.features).toHaveLength(1);
    expect(parsed.features[0].properties.name).toBe("Talhão Piloto Céu Azul");
  });

  it("creates a downloadable ZIP containing Shapefile components", async () => {
    const zipBlob = await exportPolygonsToShapefileZip([samplePolygon], "meus_talhoes");
    expect(zipBlob).toBeDefined();
    expect(zipBlob.size).toBeGreaterThan(100);
  });

  it("generates valid Point Shapefile binary buffers and zip package", async () => {
    const { generatePointShapefileBuffers, exportPointsToShapefileZip } = await import("./shapefileExport");
    const samplePoint = {
      id: "PR-TEST-001",
      code: "PR-CAND-001",
      name: "Ponto Teste Céu Azul",
      latitude: -25.155,
      longitude: -53.845,
      elevation: 550,
      slopePercent: 14.5,
      slopeDegrees: 8.2,
      bsi: 0.35,
      ndvi: 0.28,
      municipality: "Céu Azul",
      state: "PR",
      macroRegion: "Oeste",
      watershed: "Bacia do Paraná III",
      soilType: "Latossolo Vermelho",
      featureType: "Erosão Laminar",
      severity: "Alta" as const,
      estimatedSoilLoss: 38.5,
      priorityScore: 82,
      detectionDate: "2026-08-31",
      notes: "Ponto de amostragem",
      dataProvenance: "gee-calculated" as const,
    };

    const buffers = generatePointShapefileBuffers([samplePoint]);
    expect(buffers.shp).toBeDefined();
    expect(buffers.shx).toBeDefined();
    expect(buffers.dbf).toBeDefined();
    expect(buffers.prj).toContain("GCS_WGS_1984");

    // ShapeType 1 = Point
    const view = new DataView(buffers.shp.buffer);
    expect(view.getInt32(0, false)).toBe(9994);
    expect(view.getInt32(32, true)).toBe(1);

    const zipBlob = await exportPointsToShapefileZip([samplePoint], "pontos_teste");
    expect(zipBlob).toBeDefined();
    expect(zipBlob.size).toBeGreaterThan(100);
  });
});
