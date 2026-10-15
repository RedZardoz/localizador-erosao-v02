import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";
import {
  matchRuralProperty,
  batchMatchRuralProperties,
} from "./matcher";

describe("matchRuralProperty (Testes Vivos com SQLite local)", () => {
  const dbPath = path.resolve(process.cwd(), "data/fundiario_brasil.db");

  beforeAll(() => {
    if (!fs.existsSync(dbPath)) {
      throw new Error(`dado local ausente: ${dbPath}`);
    }
  });

  it("deve encontrar uma propriedade rural oficial indexada no SQLite local", async () => {
    if (!fs.existsSync(dbPath)) {
      throw new Error(`dado local ausente: ${dbPath}`);
    }
    // Coordenada real em Boa Ventura de São Roque / PR
    const result = await matchRuralProperty(-24.85, -51.5);

    expect(result).toBeDefined();
    expect(result.status).toBe("encontrado");
    expect(result.carCode).toBeDefined();
    expect(result.carCode).toContain("PR-");
    expect(result.propertyName).toBeDefined();
    expect(result.ownerName).toBeDefined();
    expect(result.propertyAreaHa).toBeGreaterThan(0);
  }, 25000);

  it("deve retornar status sem-correspondencia para coordenada fora de qualquer perímetro cadastrado", async () => {
    if (!fs.existsSync(dbPath)) {
      throw new Error(`dado local ausente: ${dbPath}`);
    }
    const result = await matchRuralProperty(0.0, 0.0);

    expect(result).toBeDefined();
    expect(result.status).toBe("sem-correspondencia");
    expect(result.carCode).toBeUndefined();
  }, 25000);

  it("deve executar batchMatchRuralProperties em lote com integridade de status", async () => {
    if (!fs.existsSync(dbPath)) {
      throw new Error(`dado local ausente: ${dbPath}`);
    }
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

    expect(durationMs).toBeLessThan(10000);
  }, 30000);
});
