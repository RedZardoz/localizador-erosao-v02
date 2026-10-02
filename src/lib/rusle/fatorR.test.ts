import { describe, it, expect } from "vitest";
import {
  calcularFatorR,
  obterFatorRComProveniencia,
  ErroForaDoDominio,
  CLIMATOLOGIA_CHIRPS_BP3_ESTACOES,
  TABELA_CONFERENCIA_CRUZADA_BP3,
  COEFICIENTES_REGIONAL_PARANA_OESTE,
  COEFICIENTES_TESTE_CALIBRACAO,
} from "./fatorR";

describe("Decisão D13 — Fator R da Linha de Base RUSLE (Diretrizes H1 e H2)", () => {
  describe("Diretriz H1 — Auditoria Estrita de Fontes Primárias e Desativação de Coeficientes", () => {
    it("declara coeficientes como indisponíveis por ausência de fonte primária arquivada contendo o par", () => {
      expect(COEFICIENTES_REGIONAL_PARANA_OESTE.estado).toBe("indisponivel");
      expect(COEFICIENTES_REGIONAL_PARANA_OESTE.a).toBeNull();
      expect(COEFICIENTES_REGIONAL_PARANA_OESTE.b).toBeNull();
      expect(COEFICIENTES_REGIONAL_PARANA_OESTE.causa).toBe("insuficiente");
      expect(COEFICIENTES_REGIONAL_PARANA_OESTE.motivo).toContain("Diretriz H1");
      // A referência deve citar APENAS as obras arquivadas no repositório:
      expect(COEFICIENTES_REGIONAL_PARANA_OESTE.referencia).toContain("Waltrick et al. (2015)");
      expect(COEFICIENTES_REGIONAL_PARANA_OESTE.referencia).toContain("NEPAR");
      expect(COEFICIENTES_REGIONAL_PARANA_OESTE.referencia).not.toContain("Rufino et al. (1993)");
    });

    it("recusa cálculo ativo do Fator R sem coeficientes comprovados em fonte arquivada", () => {
      const toledo = TABELA_CONFERENCIA_CRUZADA_BP3.TOLEDO;
      expect(() => calcularFatorR(toledo.precipitacaoMensalMm)).toThrow(ErroForaDoDominio);
      expect(() => calcularFatorR(toledo.precipitacaoMensalMm)).toThrow(/Diretriz H1/);
    });

    it("emite compulsoriamente 'indisponivel' com causa 'insuficiente' ao solicitar proveniência de R", () => {
      const toledo = TABELA_CONFERENCIA_CRUZADA_BP3.TOLEDO;
      const prov = obterFatorRComProveniencia({
        precipitacaoMensalMm: toledo.precipitacaoMensalMm,
        identificadorFonte: "CHIRPS v2.0 Toledo",
      });

      expect(prov.estado).toBe("indisponivel");
      if (prov.estado === "indisponivel") {
        expect(prov.causa).toBe("insuficiente");
        expect(prov.motivo).toContain("Diretriz H1");
        expect(prov.motivo).toContain("Waltrick et al., 2015");
      }
    });
  });

  describe("Cálculo Paramétrico Controlado (com coeficientes explícitos de teste)", () => {
    it("exige exatamente 12 totais mensais de chuva", () => {
      expect(() => calcularFatorR([100, 120], COEFICIENTES_TESTE_CALIBRACAO)).toThrow(ErroForaDoDominio);
      expect(() =>
        calcularFatorR(new Array(13).fill(100), COEFICIENTES_TESTE_CALIBRACAO)
      ).toThrow(ErroForaDoDominio);
    });

    it("recusa valores negativos de precipitação", () => {
      const pInvalida = [100, 100, -10, 100, 100, 100, 100, 100, 100, 100, 100, 100];
      expect(() => calcularFatorR(pInvalida, COEFICIENTES_TESTE_CALIBRACAO)).toThrow(
        ErroForaDoDominio
      );
    });

    it("recusa precipitação total nula", () => {
      const pZerada = new Array(12).fill(0);
      expect(() => calcularFatorR(pZerada, COEFICIENTES_TESTE_CALIBRACAO)).toThrow(
        ErroForaDoDominio
      );
    });

    it("reproduz o cálculo numérico para a série de Toledo sob coeficientes paramétricos", () => {
      const toledo = TABELA_CONFERENCIA_CRUZADA_BP3.TOLEDO;
      const res = calcularFatorR(toledo.precipitacaoMensalMm, COEFICIENTES_TESTE_CALIBRACAO);

      expect(res.pAnual).toBeGreaterThan(1500);
      expect(res.pAnual).toBeLessThan(2200);

      // Toledo sobre médias mensais de longo prazo: R ~8.920 MJ·mm·ha⁻¹·h⁻¹·ano⁻¹
      expect(res.rAnual).toBeGreaterThan(8500);
      expect(res.rAnual).toBeLessThan(12000);
      expect(Math.abs(res.rAnual - toledo.rReferenciaWaltrick) / toledo.rReferenciaWaltrick).toBeLessThan(
        0.20
      );

      // Monotonicidade: meses mais chuvosos têm maior Rc e maior EI30
      expect(res.ei30Mensal[9]).toBeGreaterThan(res.ei30Mensal[6]); // Outubro > Julho
      expect(res.ei30Mensal[11]).toBeGreaterThan(res.ei30Mensal[7]); // Dezembro > Agosto
    });

    it("reproduz o cálculo numérico para a série de Cascavel sob coeficientes paramétricos", () => {
      const cascavel = TABELA_CONFERENCIA_CRUZADA_BP3.CASCAVEL;
      const res = calcularFatorR(cascavel.precipitacaoMensalMm, COEFICIENTES_TESTE_CALIBRACAO);

      expect(res.rAnual).toBeGreaterThan(9000);
      expect(res.rAnual).toBeLessThan(13000);
      expect(
        Math.abs(res.rAnual - cascavel.rReferenciaWaltrick) / cascavel.rReferenciaWaltrick
      ).toBeLessThan(0.20);
    });
  });

  describe("Diretriz H2 — Tabela Declarada como Conferência Cruzada e Tratamento de Domínio", () => {
    it("declara a tabela histórica de estações estritamente como conferência cruzada", () => {
      expect(TABELA_CONFERENCIA_CRUZADA_BP3.TOLEDO.rReferenciaWaltrick).toBe(10623);
      expect(TABELA_CONFERENCIA_CRUZADA_BP3.CASCAVEL.rReferenciaWaltrick).toBe(11588);
      expect(CLIMATOLOGIA_CHIRPS_BP3_ESTACOES).toBe(TABELA_CONFERENCIA_CRUZADA_BP3);
    });

    it("retorna 'indisponivel' com causa 'fora-do-dominio' para coordenadas fora da bacia", () => {
      const prov = obterFatorRComProveniencia({
        latitude: -23.0,
        longitude: -45.0,
      });

      expect(prov.estado).toBe("indisponivel");
      if (prov.estado === "indisponivel") {
        expect(prov.causa).toBe("fora-do-dominio");
      }
    });

    it("retorna 'indisponivel' com causa 'insuficiente' para insumo nulo", () => {
      const provNulo = obterFatorRComProveniencia(null);
      expect(provNulo.estado).toBe("indisponivel");
      if (provNulo.estado === "indisponivel") {
        expect(provNulo.causa).toBe("insuficiente");
      }
    });
  });
});
