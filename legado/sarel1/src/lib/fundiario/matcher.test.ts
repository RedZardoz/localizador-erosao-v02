import { describe, it, expect } from "vitest";
import { consultarCadastroFundiario, BASES_PARANA_CONFIG } from "./matcher";
import { mascararDocumentoPessoal, validarMascaraTitularSncr } from "./protecao";

describe("Consulta Fundiária e Conformidade LGPD (src/lib/fundiario)", () => {
  describe("Proteção de Dados LGPD", () => {
    it("mascara CPF preservando apenas dígitos intermediários", () => {
      const masc = mascararDocumentoPessoal("123.456.789-00");
      expect(masc).toBe("***.456.789-**");
      expect(masc).not.toContain("123");
      expect(masc).not.toContain("00");
    });

    it("mascara CNPJ adequadamente", () => {
      const masc = mascararDocumentoPessoal("12.345.678/0001-99");
      expect(masc).toBe("**.***.678/0001-**");
    });

    it("preserva máscara oficial de titular do SNCR byte a byte", () => {
      const titularOficial = "ADAO ********************";
      expect(validarMascaraTitularSncr(titularOficial)).toBe("ADAO ********************");
    });
  });

  describe("Estados de Consulta Fundiária (Regra 2 da Lei Fundamental)", () => {
    it("retorna 'encontrado' quando o polígono contém o ponto", async () => {
      const mockMotor = async () => ({
        codigoCar: "PR-4114609-63321516A7494E64A536BFA695C3C641",
        titularSncr: "ADAO ********************",
        documentoMascarado: "***.456.789-**",
        registroIncra: "950.041.014.150-1",
        areaImovelHa: 12.1147,
        criterioAssociacao: "Contenção topológica estrita via polígono vetorial",
      });

      const res = await consultarCadastroFundiario(
        { latitude: -25.0669, longitude: -53.688, uf: "PR" },
        BASES_PARANA_CONFIG,
        mockMotor
      );

      expect(res.status).toBe("encontrado");
      expect(res.codigoCar).toContain("PR-4114609");
      expect(res.titularMascarado).toBe("ADAO ********************");
      expect(res.areaImovelHa).toBe(12.1147);
    });

    it("retorna 'sem-correspondencia' após consulta bem-sucedida sem match", async () => {
      const mockMotorSemMatch = async () => null;

      const res = await consultarCadastroFundiario(
        { latitude: -25.0669, longitude: -53.688, uf: "PR" },
        BASES_PARANA_CONFIG,
        mockMotorSemMatch
      );

      expect(res.status).toBe("sem-correspondencia");
      expect(res.motivo).toContain("nenhum imóvel cadastrado intercepta esta coordenada");
    });

    it("retorna 'erro-na-consulta' e NUNCA 'sem-correspondencia' em caso de falha técnica", async () => {
      const mockMotorComErro = async () => {
        throw new Error("SQLite database disk image is malformed / timeout");
      };

      const res = await consultarCadastroFundiario(
        { latitude: -25.0669, longitude: -53.688, uf: "PR" },
        BASES_PARANA_CONFIG,
        mockMotorComErro
      );

      // REGRA 2: Falha técnica nunca vira "sem-correspondência"
      expect(res.status).toBe("erro-na-consulta");
      expect(res.status).not.toBe("sem-correspondencia");
      expect(res.motivo).toContain("Falha técnica durante a execução da consulta fundiária");
      expect(res.motivo).toContain("Nada se afirma sobre a existência");
    });

    it("retorna 'base-nao-disponivel' quando a base não cobre a UF consultada", async () => {
      const res = await consultarCadastroFundiario(
        { latitude: -27.1, longitude: -50.5, uf: "SC" }, // Santa Catarina com base apenas PR
        BASES_PARANA_CONFIG
      );

      expect(res.status).toBe("base-nao-disponivel");
      expect(res.motivo).toContain("Base fundiária não instalada para a UF 'SC'");
    });
  });
});
