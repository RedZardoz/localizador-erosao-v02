import { describe, it, expect } from "vitest";
import { grausParaPct, pctParaGraus, calcularTwi } from "./terreno";

describe("Cálculo e Conversão de Declividade (Invariante 2)", () => {
  it("deve converter 0° em 0%", () => {
    expect(grausParaPct(0)).toBe(0);
  });

  it("deve converter 45° exatamente em 100% de declividade", () => {
    expect(grausParaPct(45)).toBeCloseTo(100, 5);
  });

  it("deve converter de volta 100% para 45°", () => {
    expect(pctParaGraus(100)).toBeCloseTo(45, 5);
  });

  it("deve lançar erro para declividade implausível acima de 75°", () => {
    expect(() => grausParaPct(75.1)).toThrow(/fisicamente implausível/);
    expect(() => grausParaPct(90)).toThrow(/fisicamente implausível/);
  });
});

describe("Cálculo do Topographic Wetness Index (TWI)", () => {
  it("deve calcular TWI corretamente para valores nominais positivos", () => {
    // a = 1000 m², declividade = 10°
    const twi = calcularTwi(1000, 10);
    expect(twi.estado).toBe("modelado");
    if (twi.estado === "modelado") {
      expect(twi.valor).toBeGreaterThan(0);
      expect(twi.modelo).toContain("TWI");
    }
  });

  it("deve retornar indisponivel com causa fora-do-dominio para declividade 0° (Invariante 5)", () => {
    const twi = calcularTwi(1000, 0);
    expect(twi.estado).toBe("indisponivel");
    if (twi.estado === "indisponivel") {
      expect(twi.causa).toBe("fora-do-dominio");
      expect(twi.motivo).toContain("divisão por zero");
    }
  });

  it("deve retornar indisponivel com causa fora-do-dominio para área <= 0", () => {
    const twi = calcularTwi(0, 15);
    expect(twi.estado).toBe("indisponivel");
    if (twi.estado === "indisponivel") {
      expect(twi.causa).toBe("fora-do-dominio");
    }
  });

  it("deve retornar indisponivel com causa fora-do-dominio para declividade > 75°", () => {
    const twi = calcularTwi(1000, 80);
    expect(twi.estado).toBe("indisponivel");
    if (twi.estado === "indisponivel") {
      expect(twi.causa).toBe("fora-do-dominio");
    }
  });

  it("deve retornar indisponivel com causa fora-do-dominio para NaN", () => {
    const twi = calcularTwi(NaN, 10);
    expect(twi.estado).toBe("indisponivel");
    if (twi.estado === "indisponivel") {
      expect(twi.causa).toBe("fora-do-dominio");
    }
  });
});
