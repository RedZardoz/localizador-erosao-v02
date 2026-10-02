import { describe, it, expect } from "vitest";
import {
  calcularBetaRUSLE,
  calcularExpoenteM,
  calcularFatorS,
  calcularFatorLDesmetGovers,
  calcularFatorLS,
  obterFatorLSComProveniencia,
  medirDistorcaoEscalaUTM22S,
  ErroForaDoDominio,
  COMPRIMENTO_PARCELA_PADRAO_SI_METROS,
  TAMANHO_CELULA_GLO30_METROS,
} from "./fatorLS";

describe("Decisão D15 — Fator LS da Linha de Base RUSLE", () => {
  describe("Conferência das Equações de Renard et al. (1997, AH 703)", () => {
    it("reproduz o patamar de referência padronizado de 9% de declividade", () => {
      // Declividade padrão RUSLE: s = 0.09 (9%)
      const theta9Rad = Math.atan(0.09);
      const beta9 = calcularBetaRUSLE(theta9Rad);
      const m9 = calcularExpoenteM(theta9Rad);
      const s9 = calcularFatorS(theta9Rad);

      // Na declividade unitária de 9%, m deve ser ~0.50 e S deve ser ~1.00
      expect(m9).toBeCloseTo(0.501, 3);
      expect(s9).toBeCloseTo(1.006, 3);
    });

    it("aplica Eq. [4-4] para declividades < 9% e Eq. [4-5] para declividades >= 9%", () => {
      // Declividade de 5% (suave, < 9%)
      const theta5Rad = Math.atan(0.05);
      const s5 = calcularFatorS(theta5Rad);
      // Eq. [4-4]: 10.8 * sin(theta) + 0.03
      const s5Esperado = 10.8 * Math.sin(theta5Rad) + 0.03;
      expect(s5).toBeCloseTo(s5Esperado, 6);

      // Declividade de 15% (ondulado, >= 9%)
      const theta15Rad = Math.atan(0.15);
      const s15 = calcularFatorS(theta15Rad);
      // Eq. [4-5]: 16.8 * sin(theta) - 0.50
      const s15Esperado = 16.8 * Math.sin(theta15Rad) - 0.50;
      expect(s15).toBeCloseTo(s15Esperado, 6);
    });

    it("expoente m é estritamente crescente com a declividade", () => {
      const declividades = [0.02, 0.05, 0.09, 0.14, 0.20, 0.30];
      const ms = declividades.map((d) => calcularExpoenteM(Math.atan(d)));

      for (let i = 1; i < ms.length; i++) {
        expect(ms[i]).toBeGreaterThan(ms[i - 1]);
      }
      // m varia entre ~0.15 para declividades fracas e ~0.80 para fortes
      expect(ms[0]).toBeGreaterThan(0.1);
      expect(ms[ms.length - 1]).toBeLessThan(0.9);
    });
  });

  describe("Formulações Bidimensionais de Desmet & Govers (1996)", () => {
    it("na crista da encosta (A_in = 0), L coincide analiticamente com (D / x*22.13)^m", () => {
      const thetaRad = Math.atan(0.09);
      const m = calcularExpoenteM(thetaRad);

      const lCalculado = calcularFatorLDesmetGovers(0, TAMANHO_CELULA_GLO30_METROS, m);
      const lTeorico = Math.pow(TAMANHO_CELULA_GLO30_METROS / COMPRIMENTO_PARCELA_PADRAO_SI_METROS, m);

      expect(lCalculado).toBeCloseTo(lTeorico, 5);
    });

    it("fator L cresce estritamente com a área de contribuição a montante", () => {
      const thetaRad = Math.atan(0.08);
      const m = calcularExpoenteM(thetaRad);

      const areas = [0, 900, 2700, 8100, 20000];
      const ls = areas.map((a) => calcularFatorLDesmetGovers(a, 30.0, m));

      for (let i = 1; i < ls.length; i++) {
        expect(ls[i]).toBeGreaterThan(ls[i - 1]);
      }
    });

    it("recusa entradas negativas ou inválidas com ErroForaDoDominio", () => {
      expect(() => calcularFatorLDesmetGovers(-10, 30.0, 0.5)).toThrow(ErroForaDoDominio);
      expect(() => calcularFatorLS({ declividadeGraus: -5 })).toThrow(ErroForaDoDominio);
      expect(() => calcularFatorLS({ declividadeGraus: 75 })).toThrow(ErroForaDoDominio);
    });
  });

  describe("Medição Obrigatória de Distorção de Escala UTM 22S (D15)", () => {
    it("mede a distorção linear no extremo oeste da BP3 (Foz do Iguaçu / Medianeira) e confirma que fica bem abaixo de 0.5%", () => {
      // Medianeira / Foz do Iguaçu (~54.5°W, 25.5°S)
      const med = medirDistorcaoEscalaUTM22S(-54.5, -25.5);

      expect(med.distorcaoPercentual).toBeGreaterThan(0.05);
      expect(med.distorcaoPercentual).toBeLessThan(0.20);
      expect(med.aceitavel).toBe(true);
      expect(med.fatorEscala).toBeGreaterThan(0.999);
      expect(med.fatorEscala).toBeLessThan(1.002);
    });
  });

  describe("Proveniência e Tratamento de Bordas Truncadas / Pits (D15 / P12)", () => {
    it("emite proveniência 'modelado', registrando D15, suporte nativo de 30m e a distorção linear medida", () => {
      const prov = obterFatorLSComProveniencia({
        declividadeGraus: 5.14, // ~9%
        areaContribuicaoMontanteM2: 2700,
        longitude: -53.74,
        latitude: -24.72,
      });

      expect(prov.estado).toBe("modelado");
      if (prov.estado === "modelado") {
        expect(prov.valor).toBeGreaterThan(1.0);
        expect(prov.decisoes).toContain("D15");
        expect(prov.modelo).toContain("Desmet & Govers (1996)");
        expect(prov.modelo).toContain("Renard et al. (1997, AH 703)");
        expect(prov.insumos.some((i) => i.includes("30 m"))).toBe(true);
        expect(prov.insumos.some((i) => i.includes("Distorção linear UTM 22S"))).toBe(true);
      }
    });

    it("retorna 'indisponivel' com causa 'fora-do-dominio' quando o pixel está na borda truncada", () => {
      const prov = obterFatorLSComProveniencia({
        declividadeGraus: 5.0,
        areaContribuicaoMontanteM2: 900,
        ehBordaTruncada: true,
      });

      expect(prov.estado).toBe("indisponivel");
      if (prov.estado === "indisponivel") {
        expect(prov.causa).toBe("fora-do-dominio");
        expect(prov.motivo).toContain("borda truncada");
      }
    });

    it("retorna 'indisponivel' com causa 'fora-do-dominio' para pit cells (depressão sem saída)", () => {
      const prov = obterFatorLSComProveniencia({
        declividadeGraus: 2.0,
        areaContribuicaoMontanteM2: 0,
        ehDepressaoSemSaida: true,
      });

      expect(prov.estado).toBe("indisponivel");
      if (prov.estado === "indisponivel") {
        expect(prov.causa).toBe("fora-do-dominio");
        expect(prov.motivo).toContain("depressão topográfica sem saída");
      }
    });

    it("retorna 'indisponivel' com causa 'insuficiente' para insumo nulo", () => {
      const prov = obterFatorLSComProveniencia(null);
      expect(prov.estado).toBe("indisponivel");
      if (prov.estado === "indisponivel") {
        expect(prov.causa).toBe("insuficiente");
      }
    });
  });
});
