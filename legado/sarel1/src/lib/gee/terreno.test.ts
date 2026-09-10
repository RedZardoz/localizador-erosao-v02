import { describe, it, expect } from "vitest";
import {
  converterPctParaGraus,
  converterGrausParaPct,
  validarPlausibilidadeDeclividade,
  calcularTWI,
  construirBlocoTerreno,
  ErroPlausibilidadeTerreno,
} from "./terreno";

describe("Cálculos de Terreno e Projeção Métrica (src/lib/gee/terreno)", () => {
  describe("Conversões e Guarda de Plausibilidade", () => {
    it("converte declividade de % para graus com precisão trigonométrica", () => {
      expect(converterPctParaGraus(0)).toBe(0);
      expect(converterPctParaGraus(16)).toBe(9.09); // atan(0.16) = 9.09027...
      expect(converterPctParaGraus(100)).toBe(45); // atan(1.0) = 45°
    });

    it("converte declividade de graus para %", () => {
      expect(converterGrausParaPct(0)).toBe(0);
      expect(converterGrausParaPct(45)).toBe(100);
      expect(converterGrausParaPct(9.09)).toBe(16);
    });

    it("dispara ErroPlausibilidadeTerreno para declividade > 75°", () => {
      expect(() => validarPlausibilidadeDeclividade(75.1)).toThrow(ErroPlausibilidadeTerreno);
      expect(() => validarPlausibilidadeDeclividade(89.5)).toThrow(ErroPlausibilidadeTerreno);
    });

    it("dispara ErroPlausibilidadeTerreno para declividade negativa", () => {
      expect(() => validarPlausibilidadeDeclividade(-1)).toThrow(ErroPlausibilidadeTerreno);
    });
  });

  describe("Cálculo do TWI", () => {
    it("calcula TWI com fórmula de Moore & Burch (1986)", () => {
      // As = 1000 pixels * 30 m = 30.000 m²/m; declividade = 5° (0.08748 rad); tan(5°) = 0.08748
      // TWI = ln(30000 / 0.08748) ≈ ln(342935) ≈ 12.74
      const twi = calcularTWI(1000, 5, 30);
      expect(twi).toBeGreaterThan(10);
      expect(twi).toBeLessThan(15);
    });

    it("lida com declividade plana sem divisão por zero", () => {
      const twiPlano = calcularTWI(500, 0, 30);
      expect(Number.isFinite(twiPlano)).toBe(true);
    });
  });

  describe("construirBlocoTerreno", () => {
    it("atribui estados de proveniência corretos para insumos válidos", () => {
      const bloco = construirBlocoTerreno({
        elevacao: 520,
        declividadePct: 12.4,
        curvaturaPerfil: -0.003,
        curvaturaPlana: 0.002,
        acumuloFluxo: 1540,
        dataAdquisicao: "2026-09-08",
      });

      expect(bloco.elevacao.estado).toBe("medido");
      expect(bloco.declividadePct.estado).toBe("medido");
      expect(bloco.declividadeGraus.estado).toBe("modelado");
      expect(bloco.curvaturaPerfil.estado).toBe("medido");
      expect(bloco.acumuloFluxo.estado).toBe("medido");
      expect(bloco.twi.estado).toBe("modelado");

      if (bloco.declividadeGraus.estado === "modelado") {
        expect(bloco.declividadeGraus.valor).toBe(7.07);
      }
    });

    it("marca como 'indisponivel' quando um dado está ausente (nunca inventa zero)", () => {
      const bloco = construirBlocoTerreno({
        elevacao: null, // Ausente
        declividadePct: 10,
        curvaturaPerfil: null,
        curvaturaPlana: null,
        acumuloFluxo: null,
      });

      expect(bloco.elevacao.estado).toBe("indisponivel");
      if (bloco.elevacao.estado === "indisponivel") {
        expect(bloco.elevacao.motivo).toContain("Elevação não obtida");
      }
      expect(bloco.twi.estado).toBe("indisponivel"); // TWI não pode ser calculado sem acúmulo
    });
  });
});
