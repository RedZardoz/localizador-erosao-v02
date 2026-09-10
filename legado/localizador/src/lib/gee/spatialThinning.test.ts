import { describe, it, expect } from "vitest";
import { thinBySpacing, GeoCandidate } from "./spatialThinning";

describe("spatialThinning - Filtro Espacial por Distância Mínima", () => {
  it("deve lidar com casos triviais (array vazio e ponto único)", () => {
    expect(thinBySpacing([], 1.0)).toEqual([]);

    const single: GeoCandidate[] = [
      { id: "1", latitude: -25.4284, longitude: -49.2733, priorityScore: 80 },
    ];
    expect(thinBySpacing(single, 1.0)).toEqual(single);
  });

  it("deve aceitar pontos que estão suficientemente distantes (> minSpacingKm)", () => {
    // Curitiba e Ponta Grossa (~90 km de distância)
    const points: GeoCandidate[] = [
      { id: "curitiba", latitude: -25.4284, longitude: -49.2733, priorityScore: 50 },
      { id: "ponta_grossa", latitude: -25.0994, longitude: -50.1583, priorityScore: 60 },
    ];

    const result = thinBySpacing(points, 5.0); // min 5 km
    expect(result).toHaveLength(2);
  });

  it("deve filtrar pontos muito próximos e manter o de maior prioridade", () => {
    // Três pontos muito próximos (< 500m de distância entre si)
    const cluster: GeoCandidate[] = [
      { id: "p1", latitude: -25.0000, longitude: -53.0000, priorityScore: 40 },
      { id: "p2", latitude: -25.0010, longitude: -53.0010, priorityScore: 95 }, // Maior prioridade
      { id: "p3", latitude: -25.0020, longitude: -53.0020, priorityScore: 60 },
    ];

    const result = thinBySpacing(cluster, 2.0); // min 2 km
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p2"); // deve preservar o de prioridade 95
  });

  it("deve respeitar o limite máximo maxPoints quando especificado", () => {
    const points: GeoCandidate[] = [
      { id: "1", latitude: -24.0, longitude: -52.0, priorityScore: 90 },
      { id: "2", latitude: -24.5, longitude: -52.0, priorityScore: 80 },
      { id: "3", latitude: -25.0, longitude: -52.0, priorityScore: 70 },
      { id: "4", latitude: -25.5, longitude: -52.0, priorityScore: 60 },
    ];

    const result = thinBySpacing(points, 1.0, 2);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("2");
  });

  it("se minSpacingKm <= 0, deve retornar todos os pontos respeitando maxPoints", () => {
    const points: GeoCandidate[] = [
      { id: "1", latitude: -25.0, longitude: -53.0, priorityScore: 50 },
      { id: "2", latitude: -25.0, longitude: -53.0, priorityScore: 50 },
    ];

    expect(thinBySpacing(points, 0)).toHaveLength(2);
    expect(thinBySpacing(points, 0, 1)).toHaveLength(1);
  });
});
