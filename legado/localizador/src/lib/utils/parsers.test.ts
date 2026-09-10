import { describe, expect, it } from "vitest";
import { parseCSV, parseGeoJSON } from "./parsers";

// Nota: parseKML/parseKMZ dependem de `DOMParser`, indisponível no ambiente
// Node do Vitest. Ambos delegam para parseGeoJSON após a conversão
// (@tmcw/togeojson), cuja lógica já é coberta abaixo — ver
// PROMPT_IMPLEMENTACAO_SENIOR.md para adicionar um ambiente jsdom dedicado
// caso KML/KMZ precisem de testes próprios no futuro.

describe("parseCSV", () => {
  it("extrai pontos de um CSV com todas as colunas rastreadas preenchidas", async () => {
    const csv =
      "id,name,latitude,longitude,slope,bsi,severity,priority,soil_loss\nP1,Ponto 1,-23.42,-51.93,18,0.5,Crítica,80,25";
    const result = await parseCSV(csv, "teste.csv");
    expect(result.points).toHaveLength(1);
    expect(result.points![0].latitude).toBe(-23.42);
    expect(result.points![0].estimatedFields).toBeUndefined();
    expect(result.points![0].dataProvenance).toBe("user-upload");
  });

  it("marca campos ausentes como estimados, em vez de escondê-los", async () => {
    const csv = "id,latitude,longitude\nP1,-23.42,-51.93";
    const result = await parseCSV(csv, "teste.csv");
    const point = result.points![0];
    expect(point.estimatedFields).toContain("slopePercent");
    expect(point.estimatedFields).toContain("bsi");
    expect(point.estimatedFields).toContain("severity");
    expect(point.estimatedFields).toContain("priorityScore");
  });

  it("descarta linhas com coordenadas inválidas sem quebrar as demais", async () => {
    const csv = "id,latitude,longitude\nP1,-23.42,-51.93\nP2,999,-51.93\nP3,-24,-52";
    const result = await parseCSV(csv, "teste.csv");
    expect(result.points).toHaveLength(2);
  });

  it("aceita vírgula decimal (formato brasileiro) nas coordenadas", async () => {
    const csv = "id,latitude,longitude\nP1,\"-23,42\",\"-51,93\"";
    const result = await parseCSV(csv, "teste.csv");
    expect(result.points![0].latitude).toBeCloseTo(-23.42, 5);
  });

  it("rejeita CSV sem colunas de coordenadas reconhecíveis", async () => {
    const csv = "id,nome\nP1,Foo";
    await expect(parseCSV(csv, "teste.csv")).rejects.toThrow(/coordenadas não identificadas/i);
  });

  it("rejeita CSV vazio", async () => {
    await expect(parseCSV("", "teste.csv")).rejects.toThrow();
  });
});

describe("parseGeoJSON", () => {
  it("extrai pontos de um FeatureCollection", () => {
    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Foco 1", slope: 22, bsi: 0.6, severity: "Crítica", priorityScore: 80, estimatedSoilLoss: 25 },
          geometry: { type: "Point", coordinates: [-51.93, -23.42] },
        },
      ],
    };
    const result = parseGeoJSON(geojson, "teste.geojson");
    expect(result.points).toHaveLength(1);
    expect(result.points![0].name).toBe("Foco 1");
    expect(result.points![0].estimatedFields).toBeUndefined();
  });

  it("extrai polígonos como AOI, separados dos pontos", () => {
    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Área Teste" },
          geometry: {
            type: "Polygon",
            coordinates: [[[-52, -24], [-52, -23], [-51, -23], [-51, -24], [-52, -24]]],
          },
        },
      ],
    };
    const result = parseGeoJSON(geojson, "teste.geojson");
    expect(result.points).toBeUndefined();
    expect(result.polygons).toHaveLength(1);
    expect(result.summary.geometryType).toBe("Polygon");
  });

  it("lança erro para JSON malformado", () => {
    expect(() => parseGeoJSON("{not valid json", "teste.geojson")).toThrow(/corrompido/i);
  });

  it("sinaliza campos estimados quando properties não trazem slope/bsi", () => {
    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Foco Sem Dados" },
          geometry: { type: "Point", coordinates: [-51.93, -23.42] },
        },
      ],
    };
    const result = parseGeoJSON(geojson, "teste.geojson");
    expect(result.points![0].estimatedFields).toContain("slopePercent");
    expect(result.points![0].estimatedFields).toContain("bsi");
  });
});
