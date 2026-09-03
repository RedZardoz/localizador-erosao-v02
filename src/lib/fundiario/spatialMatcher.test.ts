import { describe, it, expect } from "vitest";
import { matchRuralProperty } from "./spatialMatcher";

describe("matchRuralProperty", () => {
  it("deve encontrar uma propriedade rural indexada por Bounding Box no SQLite de demonstração", async () => {
    // Coordenada dentro do polígono de Paranavaí/PR (Fazenda Bela Vista / Estância Três Rios)
    const result = await matchRuralProperty(-23.081, -52.464);

    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
    expect(result.carCode).toBeDefined();
    expect(result.carCode).toContain("PR-");
    expect(result.propertyName).toBeDefined();
    expect(result.ownerName).toBeDefined();
    expect(result.propertyAreaHa).toBeGreaterThan(0);
  }, 15000);

  it("deve retornar objeto vazio com segurança para coordenada fora de qualquer perímetro cadastrado", async () => {
    const result = await matchRuralProperty(0.0, 0.0);

    expect(result).toBeDefined();
    expect(Object.keys(result).length).toBe(0);
  }, 15000);

  it("deve retornar objeto vazio sem estourar exceção caso o banco não exista", async () => {
    const result = await matchRuralProperty(-23.081, -52.464, "data/inexistente.db");

    expect(result).toBeDefined();
    expect(Object.keys(result).length).toBe(0);
  }, 15000);
});
