import { describe, it, expect } from "vitest";
import {
  distanciaHaversineMetros,
  embaralharDeterminista,
  aplicarThinningDeterminista,
  CandidatoEspacial,
} from "./thinning";

describe("Geodésia e Distância Haversine", () => {
  it("deve calcular a distância entre pontos na mesma latitude/longitude", () => {
    expect(distanciaHaversineMetros(-25.0, -50.0, -25.0, -50.0)).toBe(0);
  });

  it("deve calcular ~111 km para 1 grau de latitude no equador", () => {
    const dist = distanciaHaversineMetros(0.0, 0.0, 1.0, 0.0);
    expect(dist).toBeGreaterThan(110000);
    expect(dist).toBeLessThan(112000);
  });
});

describe("Embaralhamento Determinístico (P07)", () => {
  it("deve ser estritamente determinístico para a mesma semente", () => {
    const lista = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const res1 = embaralharDeterminista(lista, 42);
    const res2 = embaralharDeterminista(lista, 42);
    expect(res1).toEqual(res2);
  });

  it("deve produzir ordens diferentes para sementes diferentes", () => {
    const lista = Array.from({ length: 20 }, (_, i) => i);
    const res1 = embaralharDeterminista(lista, 123);
    const res2 = embaralharDeterminista(lista, 999);
    expect(res1).not.toEqual(res2);
  });
});

describe("Thinning Espacial Determinístico (P02)", () => {
  it("deve filtrar pontos que estejam a menos de 1000 metros entre si", () => {
    const candidatos: CandidatoEspacial[] = [
      { id: "p1", latitude: -25.0000, longitude: -50.0000 },
      // p2 está a ~11 metros de p1 (muito próximo, deve ser filtrado)
      { id: "p2", latitude: -25.0001, longitude: -50.0001 },
      // p3 está a ~22 km de p1 (deve ser aceito)
      { id: "p3", latitude: -25.2000, longitude: -50.0000 },
    ];

    const aceitos = aplicarThinningDeterminista(candidatos, 1000, 42);
    expect(aceitos).toHaveLength(2);

    const ids = aceitos.map(p => p.id);
    expect(ids).toContain("p3");
    // Não pode conter p1 e p2 juntos
    expect(ids.includes("p1") && ids.includes("p2")).toBe(false);
  });

  it("deve respeitar a meta máxima de pontos aceitos", () => {
    // 5 pontos bem espaçados entre si (a cada ~11 km)
    const candidatos: CandidatoEspacial[] = Array.from({ length: 5 }, (_, i) => ({
      id: `p-${i}`,
      latitude: -25.0 - i * 0.1,
      longitude: -50.0,
    }));

    const aceitos = aplicarThinningDeterminista(candidatos, 1000, 42, 3);
    expect(aceitos).toHaveLength(3);
  });
});
