import { describe, expect, it } from "vitest";
import {
  calculatePointsBBox,
  countPointsOutsideParana,
  formatToDMS,
  haversineDistanceMeters,
  isPointInParana,
  isPointInPolygon,
} from "./geoUtils";
import { ErosionPoint } from "@/types/erosion";

describe("formatToDMS", () => {
  it("formata latitude negativa com direção S", () => {
    expect(formatToDMS(-23.42, true)).toMatch(/S$/);
  });

  it("formata longitude negativa com direção W", () => {
    expect(formatToDMS(-51.93, false)).toMatch(/W$/);
  });

  it("formata coordenadas positivas com N/E", () => {
    expect(formatToDMS(10, true)).toMatch(/N$/);
    expect(formatToDMS(10, false)).toMatch(/E$/);
  });
});

describe("isPointInPolygon", () => {
  const square = [
    [
      [0, 0],
      [0, 10],
      [10, 10],
      [10, 0],
      [0, 0],
    ],
  ];

  it("detecta um ponto dentro do polígono", () => {
    expect(isPointInPolygon([5, 5], square)).toBe(true);
  });

  it("detecta um ponto fora do polígono", () => {
    expect(isPointInPolygon([50, 50], square)).toBe(false);
  });
});

describe("isPointInParana / countPointsOutsideParana", () => {
  it("um ponto claramente fora do Brasil não está no Paraná", () => {
    expect(isPointInParana(48.85, 2.35)).toBe(false); // Paris
  });

  it("um ponto no centro aproximado do PR é reconhecido como dentro", () => {
    // Ponta Grossa, bem dentro do polígono do estado
    expect(isPointInParana(-25.095, -50.161)).toBe(true);
  });

  it("conta corretamente quantos pontos de uma lista caem fora do limite", () => {
    const points = [
      { latitude: -25.095, longitude: -50.161 }, // dentro (Ponta Grossa)
      { latitude: 48.85, longitude: 2.35 }, // fora (Paris)
    ];
    expect(countPointsOutsideParana(points)).toBe(1);
  });
});

describe("haversineDistanceMeters", () => {
  it("retorna 0 para o mesmo ponto", () => {
    expect(haversineDistanceMeters(-23.42, -51.93, -23.42, -51.93)).toBe(0);
  });

  it("retorna uma distância positiva e plausível entre dois pontos próximos (~100m)", () => {
    // ~0.0009 graus de latitude equivale a aproximadamente 100m
    const dist = haversineDistanceMeters(-23.42, -51.93, -23.4209, -51.93);
    expect(dist).toBeGreaterThan(90);
    expect(dist).toBeLessThan(110);
  });
});

describe("calculatePointsBBox", () => {
  it("retorna null para lista vazia", () => {
    expect(calculatePointsBBox([])).toBeNull();
  });

  it("calcula a caixa envolvente com margem de 0.05 graus", () => {
    const points = [
      { latitude: -23, longitude: -51 },
      { latitude: -24, longitude: -52 },
    ] as ErosionPoint[];
    const bbox = calculatePointsBBox(points);
    expect(bbox).toEqual([
      [-52.05, -24.05],
      [-50.95, -22.95],
    ]);
  });
});
