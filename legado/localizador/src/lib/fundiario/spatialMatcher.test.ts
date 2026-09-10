import { describe, it, expect } from "vitest";
import { matchRuralProperty, batchMatchRuralProperties } from "./spatialMatcher";

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

  it("deve executar batchMatchRuralProperties em lote com alta performance para múltiplos pontos", async () => {
    const batchItems = [
      { id: "pt-1", latitude: -25.568434, longitude: -53.524454, uf: "PR" },
      { id: "pt-2", latitude: -24.85, longitude: -51.5, uf: "PR" },
      { id: "pt-3", latitude: 0.0, longitude: 0.0, uf: "PR" },
    ];

    const t0 = Date.now();
    const results = await batchMatchRuralProperties(batchItems);
    const durationMs = Date.now() - t0;

    expect(results).toBeDefined();
    expect(results["pt-1"]).toBeDefined();
    expect(results["pt-1"].status).toBe("encontrado");
    expect(results["pt-1"].carCode).toBeDefined();
    expect(results["pt-2"]).toBeDefined();
    expect(results["pt-2"].status).toBe("encontrado");
    expect(results["pt-3"]).toBeDefined();
    expect(results["pt-3"].status).toBe("sem-correspondencia");

    // Deve executar rapidamente (menos de 5 segundos)
    expect(durationMs).toBeLessThan(5000);
  }, 20000);
});

