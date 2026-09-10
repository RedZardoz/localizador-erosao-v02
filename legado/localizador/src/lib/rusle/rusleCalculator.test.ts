import { describe, expect, it } from "vitest";
import {
  calculateCFactor,
  calculateLSFactor,
  calculatePriorityScore,
  calculateSeverity,
  calculateSoilLossRUSLE,
} from "./rusleCalculator";

describe("calculateSeverity", () => {
  it("classifica como Moderada abaixo do limiar de 28.0", () => {
    // slopePercent*0.4 + bsi*50 + 8 (Latossolo) = 5*0.4 + 0*50 + 8 = 10
    const { severity, phi } = calculateSeverity(5, 0, "Latossolo Vermelho Distroférrico");
    expect(severity).toBe("Moderada");
    expect(phi).toBe(10);
  });

  it("classifica como Alta logo acima de 28.0", () => {
    // 10*0.4 + 0.5*50 + 8 = 4 + 25 + 8 = 37
    const { severity } = calculateSeverity(10, 0.5, "Latossolo Vermelho Distroférrico");
    expect(severity).toBe("Alta");
  });

  it("classifica como Crítica acima de 48.0", () => {
    // 20*0.4 + 0.8*50 + 18 (Argissolo) = 8 + 40 + 18 = 66
    const { severity } = calculateSeverity(20, 0.8, "Argissolo Vermelho-Amarelo");
    expect(severity).toBe("Crítica");
  });

  it("usa o peso pedológico correto para solos frágeis vs. estruturados", () => {
    const fragil = calculateSeverity(0, 0, "Neossolo Regolítico");
    const estruturado = calculateSeverity(0, 0, "Nitossolo Vermelho");
    expect(fragil.phi).toBe(18);
    expect(estruturado.phi).toBe(8);
  });
});

describe("calculatePriorityScore", () => {
  it("nunca fica abaixo de 10 (clamp inferior)", () => {
    const score = calculatePriorityScore("Moderada", -1, 0, -100);
    expect(score).toBe(10);
  });

  it("nunca fica acima de 100 (clamp superior)", () => {
    const score = calculatePriorityScore("Crítica", 1, 45, 50);
    expect(score).toBe(100);
  });

  it("usa a constante de base correta por severidade", () => {
    expect(calculatePriorityScore("Crítica", 0, 0, 0)).toBe(70);
    expect(calculatePriorityScore("Alta", 0, 0, 0)).toBe(45);
    expect(calculatePriorityScore("Moderada", 0, 0, 0)).toBe(20);
  });
});

describe("calculateCFactor", () => {
  it("fica baixo para vegetação densa (NDVI alto) e solo protegido (BSI baixo)", () => {
    // ((1-0.85)/2)^(1-0.2) = 0.075^0.8 ≈ 0.126
    const c = calculateCFactor(0.85, -0.2);
    expect(c).toBeCloseTo(0.126, 2);
  });

  it("fica mais alto para solo exposto (NDVI baixo, BSI alto)", () => {
    const cExposto = calculateCFactor(0.05, 0.6);
    const cProtegido = calculateCFactor(0.85, -0.2);
    expect(cExposto).toBeGreaterThan(cProtegido);
  });

  it("nunca sai do intervalo [0, 1]", () => {
    const c = calculateCFactor(-1, 1);
    expect(c).toBeGreaterThanOrEqual(0);
    expect(c).toBeLessThanOrEqual(1);
  });
});

describe("calculateLSFactor", () => {
  it("aumenta com a declividade, mantendo a área constante", () => {
    const lsBaixo = calculateLSFactor(50, 5);
    const lsAlto = calculateLSFactor(50, 20);
    expect(lsAlto).toBeGreaterThan(lsBaixo);
  });

  it("nunca é negativo", () => {
    const ls = calculateLSFactor(1, 0.001);
    expect(ls).toBeGreaterThanOrEqual(0);
  });
});

describe("calculateSoilLossRUSLE", () => {
  it("multiplica os cinco fatores corretamente (A = R*K*LS*C*P)", () => {
    const a = calculateSoilLossRUSLE(6000, 0.03, 2, 0.2, 1);
    expect(a).toBeCloseTo(6000 * 0.03 * 2 * 0.2 * 1, 5);
  });

  it("resulta em zero quando qualquer fator é zero", () => {
    expect(calculateSoilLossRUSLE(0, 0.03, 2, 0.2, 1)).toBe(0);
    expect(calculateSoilLossRUSLE(6000, 0.03, 2, 0, 1)).toBe(0);
  });
});
