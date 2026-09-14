import { describe, it, expect } from "vitest";
import {
  matchRuralProperty,
  batchMatchRuralProperties,
  toContextoFundiario,
  RuralPropertyMatch,
} from "./matcher";
import { mascararDocumentoPessoal, validarMascaraTitularSncr } from "./protecao";

describe("Proteção de Dados LGPD Fundiário", () => {
  it("mascara CPF preservando apenas dígitos intermediários", () => {
    const masc = mascararDocumentoPessoal("123.456.789-00");
    expect(masc).toBe("***.456.789-**");
  });

  it("mascara CNPJ adequadamente", () => {
    const masc = mascararDocumentoPessoal("12.345.678/0001-99");
    expect(masc).toBe("**.***.678/0001-**");
  });

  it("retorna null para documento vazio ou nulo", () => {
    expect(mascararDocumentoPessoal(null)).toBeNull();
    expect(mascararDocumentoPessoal("   ")).toBeNull();
  });

  it("preserva a máscara oficial byte a byte do titular do SNCR", () => {
    const titularOficial = "ADAO ********************";
    expect(validarMascaraTitularSncr(titularOficial)).toBe("ADAO ********************");
  });

  it("mascara titular caso venha em claro acidentalmente", () => {
    const titularClaro = "João da Silva Santos";
    const masc = validarMascaraTitularSncr(titularClaro);
    expect(masc).toContain("João");
    expect(masc).toContain("*");
    expect(masc).not.toContain("Silva");
  });

  it("retorna null para titular vazio ou nulo", () => {
    expect(validarMascaraTitularSncr(null)).toBeNull();
    expect(validarMascaraTitularSncr("")).toBeNull();
  });
});

describe("toContextoFundiario", () => {
  it("converte RuralPropertyMatch em ContextoFundiario em conformidade com as regras", () => {
    const match: RuralPropertyMatch = {
      status: "encontrado",
      uf: "PR",
      carCode: "PR-4103206-0001",
      ownerName: "ADAO ********************",
      ownerDocumentMasked: "123.456.789-00",
      propertyAreaHa: 154.2,
      dataConsulta: "2026-09-10",
      criterioAssociacao: "Contenção topológica estrita",
      sncrArquivoOrigem: "Imoveis_PR_01_09_2026.csv",
    };

    const ctx = toContextoFundiario(match);
    expect(ctx.status).toBe("encontrado");
    expect(ctx.motivo).toBeNull();
    expect(ctx.codigoCar).toBe("PR-4103206-0001");
    expect(ctx.titularMascarado).toBe("ADAO ********************");
    expect(ctx.documentoMascarado).toBe("***.456.789-**");
    expect(ctx.areaImovelHa).toBe(154.2);
    expect(ctx.bases.uf).toBe("PR");
    expect(ctx.bases.sncr).toBe("Imoveis_PR_01_09_2026.csv");
  });

  it("atribui motivo obrigatório quando status não for encontrado e não permite área 0", () => {
    const match: RuralPropertyMatch = {
      status: "sem-correspondencia",
      uf: "PR",
      propertyAreaHa: 0,
    };

    const ctx = toContextoFundiario(match);
    expect(ctx.status).toBe("sem-correspondencia");
    expect(ctx.motivo).not.toBeNull();
    expect(ctx.areaImovelHa).toBeNull(); // NUNCA 0
  });
});

describe("matchRuralProperty", () => {
  it("deve encontrar uma propriedade rural oficial indexada no SQLite local", async () => {
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
    const result = await matchRuralProperty(0.0, 0.0);

    expect(result).toBeDefined();
    expect(result.status).toBe("sem-correspondencia");
    expect(result.carCode).toBeUndefined();
  }, 25000);

  it("deve retornar status base-nao-disponivel para UF fora da cobertura (ex: BA)", async () => {
    const result = await matchRuralProperty(-12.97, -38.51, "BA");

    expect(result).toBeDefined();
    expect(result.status).toBe("base-nao-disponivel");
    expect(result.uf).toBe("BA");
    expect(result.carCode).toBeUndefined();
  }, 25000);

  it("deve retornar base-nao-disponivel quando o caminho do banco for inexistente (Invariante 5)", async () => {
    const result = await matchRuralProperty(-24.85, -51.5, "data/inexistente.db");

    expect(result).toBeDefined();
    expect(result.status).toBe("base-nao-disponivel");
    expect(result.status).not.toBe("sem-correspondencia");
  }, 25000);

  it("deve retornar erro-na-consulta para coordenadas inválidas", async () => {
    const result = await matchRuralProperty(999, 999);

    expect(result).toBeDefined();
    expect(result.status).toBe("erro-na-consulta");
    expect(result.motivo).toContain("inválidas");
  });

  it("deve executar batchMatchRuralProperties em lote com integridade de status", async () => {
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
