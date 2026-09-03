import { describe, it, expect } from "vitest";
import { matchRuralProperty } from "./spatialMatcher";

describe("matchRuralProperty", () => {
  it("deve encontrar uma propriedade rural oficial indexada no SQLite local", async () => {
    // Coordenada real em Boa Ventura de São Roque / PR
    const result = await matchRuralProperty(-24.85, -51.5);

    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
    expect(result.status).toBe("encontrado");
    expect(result.carCode).toBeDefined();
    expect(result.carCode).toContain("PR-");
    expect(result.propertyName).toBeDefined();
    expect(result.ownerName).toBeDefined();
    expect(result.propertyAreaHa).toBeGreaterThan(0);
    expect(result.sicarArquivoOrigem).toBeDefined();
    expect(result.sncrArquivoOrigem).toBeDefined();
  }, 20000);

  it("deve retornar status sem-correspondencia para coordenada fora de qualquer perímetro cadastrado", async () => {
    const result = await matchRuralProperty(0.0, 0.0);

    expect(result).toBeDefined();
    expect(result.status).toBe("sem-correspondencia");
    expect(result.carCode).toBeUndefined();
  }, 20000);

  it("deve retornar status base-nao-disponivel para UF fora da cobertura (ex: BA)", async () => {
    const result = await matchRuralProperty(-12.97, -38.51, "BA");

    expect(result).toBeDefined();
    expect(result.status).toBe("base-nao-disponivel");
    expect(result.uf).toBe("BA");
    expect(result.carCode).toBeUndefined();
  }, 20000);

  it("deve retornar objeto vazio sem estourar exceção caso o banco não exista", async () => {
    const result = await matchRuralProperty(-24.85, -51.5, "data/inexistente.db");

    expect(result).toBeDefined();
    expect(Object.keys(result).length).toBe(0);
  }, 20000);
});
