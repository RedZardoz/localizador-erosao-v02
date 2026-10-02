import { describe, it, expect } from "vitest";
import {
  calcularFatorR,
  obterFatorRComProveniencia,
  ErroForaDoDominio,
  CLIMATOLOGIA_CHIRPS_BP3_ESTACOES,
  COEFICIENTES_REGIONAL_PARANA_OESTE,
} from "./fatorR";

describe("Decisão D13 — Fator R da Linha de Base RUSLE", () => {
  describe("Cálculo Numérico e Invariantes Físicos", () => {
    it("exige exatamente 12 totais mensais de chuva", () => {
      expect(() => calcularFatorR([100, 120])).toThrow(ErroForaDoDominio);
      expect(() => calcularFatorR(new Array(13).fill(100))).toThrow(ErroForaDoDominio);
    });

    it("recusa valores negativos de precipitação", () => {
      const pInvalida = [100, 100, -10, 100, 100, 100, 100, 100, 100, 100, 100, 100];
      expect(() => calcularFatorR(pInvalida)).toThrow(ErroForaDoDominio);
    });

    it("recusa precipitação total nula", () => {
      const pZerada = new Array(12).fill(0);
      expect(() => calcularFatorR(pZerada)).toThrow(ErroForaDoDominio);
    });

    it("reproduz o cálculo regional de Toledo em conformidade com Waltrick et al. (2015)", () => {
      const toledo = CLIMATOLOGIA_CHIRPS_BP3_ESTACOES.TOLEDO;
      const res = calcularFatorR(toledo.precipitacaoMensalMm);

      expect(res.pAnual).toBeGreaterThan(1500);
      expect(res.pAnual).toBeLessThan(2200);

      // Toledo sobre médias mensais de longo prazo: R ~8.920 MJ·mm·ha⁻¹·h⁻¹·ano⁻¹
      // Em Waltrick et al. (2015, Quadro 1, p. 262), a média ano a ano sobre 23 anos incorpora
      // a variância interanual (desigualdade de Jensen: E[p^2] > E[p]^2), resultando em 10.623.
      expect(res.rAnual).toBeGreaterThan(8500);
      expect(res.rAnual).toBeLessThan(12000);
      expect(Math.abs(res.rAnual - toledo.rReferenciaWaltrick) / toledo.rReferenciaWaltrick).toBeLessThan(0.20);

      // Verifica monotonicidade de Rc: mês com mais chuva tem maior Rc e maior EI30
      // Outubro (mês 10, index 9) e Dezembro (mês 12, index 11) têm os maiores valores
      expect(res.ei30Mensal[9]).toBeGreaterThan(res.ei30Mensal[6]); // Outubro > Julho
      expect(res.ei30Mensal[11]).toBeGreaterThan(res.ei30Mensal[7]); // Dezembro > Agosto
    });

    it("reproduz o cálculo regional de Cascavel em conformidade com Waltrick et al. (2015)", () => {
      const cascavel = CLIMATOLOGIA_CHIRPS_BP3_ESTACOES.CASCAVEL;
      const res = calcularFatorR(cascavel.precipitacaoMensalMm);

      // Cascavel sobre médias normais CHIRPS resulta em ~9.527 MJ·mm·ha⁻¹·h⁻¹·ano⁻¹
      // (Waltrick ano a ano = 11.588, concordância dentro de 20%)
      expect(res.rAnual).toBeGreaterThan(9000);
      expect(res.rAnual).toBeLessThan(13000);
      expect(Math.abs(res.rAnual - cascavel.rReferenciaWaltrick) / cascavel.rReferenciaWaltrick).toBeLessThan(0.20);
    });
  });

  describe("Proveniência e Tratamento de Indisponibilidade (D13)", () => {
    it("emite proveniência 'modelado', registrando D13 e a ressalva de sucedâneo do EI30", () => {
      const toledo = CLIMATOLOGIA_CHIRPS_BP3_ESTACOES.TOLEDO;
      const prov = obterFatorRComProveniencia({
        precipitacaoMensalMm: toledo.precipitacaoMensalMm,
        identificadorFonte: "CHIRPS v2.0 Toledo",
      });

      expect(prov.estado).toBe("modelado");
      if (prov.estado === "modelado") {
        expect(prov.valor).toBeGreaterThan(8500);
        expect(prov.decisoes).toContain("D13");
        expect(prov.modelo).toContain("Rufino et al.");
        expect(prov.modelo).toContain("Waltrick et al.");
        expect(prov.insumos.some((i) => i.includes("Sucedâneo declarado do EI30"))).toBe(true);
        expect(prov.insumos).toContain("CHIRPS v2.0 Toledo");
      }
    });

    it("realiza lookup climatológico automático para coordenadas da BP3", () => {
      // Coordenada em Toledo (-24.72, -53.74)
      const prov = obterFatorRComProveniencia({
        latitude: -24.72,
        longitude: -53.74,
      });

      expect(prov.estado).toBe("modelado");
      if (prov.estado === "modelado") {
        expect(prov.valor).toBeGreaterThan(8500);
        expect(prov.insumos.some((i) => i.includes("Toledo"))).toBe(true);
      }
    });

    it("retorna 'indisponivel' com causa 'fora-do-dominio' para coordenadas fora da bacia", () => {
      // Coordenada no Oceano Atlântico / São Paulo
      const prov = obterFatorRComProveniencia({
        latitude: -23.0,
        longitude: -45.0,
      });

      expect(prov.estado).toBe("indisponivel");
      if (prov.estado === "indisponivel") {
        expect(prov.causa).toBe("fora-do-dominio");
      }
    });

    it("retorna 'indisponivel' com causa 'insuficiente' para insumo nulo ou incompleto", () => {
      const provNulo = obterFatorRComProveniencia(null);
      expect(provNulo.estado).toBe("indisponivel");
      if (provNulo.estado === "indisponivel") {
        expect(provNulo.causa).toBe("insuficiente");
      }

      const provVazio = obterFatorRComProveniencia({});
      expect(provVazio.estado).toBe("indisponivel");
      if (provVazio.estado === "indisponivel") {
        expect(provVazio.causa).toBe("insuficiente");
      }
    });
  });
});
