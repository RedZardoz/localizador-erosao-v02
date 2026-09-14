import { describe, it, expect } from "vitest";
import {
  GEE_CALC_ENGINE_VERSION,
  MAX_PLAUSIBLE_SLOPE_DEG,
  MIN_PLAUSIBLE_SLOPE_DEG,
  validateSlopePlausibility,
  isPointSlopeOutdated,
} from "./versaoMotor";

describe("calcEngineVersion - Guarda de Plausibilidade Física da Declividade", () => {
  it("deve aceitar valores de declividade em faixas terrestres plausíveis (0° a 75°)", () => {
    expect(() => validateSlopePlausibility(0)).not.toThrow();
    expect(() => validateSlopePlausibility(5.2)).not.toThrow();
    expect(() => validateSlopePlausibility(15.0)).not.toThrow();
    expect(() => validateSlopePlausibility(45.0)).not.toThrow();
    expect(() => validateSlopePlausibility(75.0)).not.toThrow();
  });

  it("deve lançar erro claro para valores absurdos próximos a 90° (bug de projeção)", () => {
    expect(() => validateSlopePlausibility(89.99)).toThrowError(
      "Declividade retornada pelo Earth Engine é fisicamente implausível (89.99°) — possível bug de projeção do DEM."
    );
    expect(() => validateSlopePlausibility(90)).toThrowError(
      "Declividade retornada pelo Earth Engine é fisicamente implausível (90°) — possível bug de projeção do DEM."
    );
    expect(() => validateSlopePlausibility(85)).toThrowError(
      "Declividade retornada pelo Earth Engine é fisicamente implausível (85°) — possível bug de projeção do DEM."
    );
  });

  it("deve lançar erro para valores negativos, infinitos ou NaN", () => {
    expect(() => validateSlopePlausibility(-0.1)).toThrowError(
      /Declividade retornada pelo Earth Engine é fisicamente implausível/
    );
    expect(() => validateSlopePlausibility(NaN)).toThrowError(
      /Declividade retornada pelo Earth Engine é fisicamente implausível/
    );
    expect(() => validateSlopePlausibility(Infinity)).toThrowError(
      /Declividade retornada pelo Earth Engine é fisicamente implausível/
    );
  });
});

describe("calcEngineVersion - Identificação de Pontos Desatualizados (isPointSlopeOutdated)", () => {
  it("deve identificar como desatualizado ponto de satélite sem calcEngineVersion", () => {
    const pt = {
      dataProvenance: "satellite-derived",
    };
    expect(isPointSlopeOutdated(pt)).toBe(true);
  });

  it("deve identificar como desatualizado ponto triado no GEE sem calcEngineVersion", () => {
    const pt = {
      dataProvenance: "gee-screened",
    };
    expect(isPointSlopeOutdated(pt)).toBe(true);
  });

  it("deve identificar como desatualizado ponto com versão antiga do motor", () => {
    const pt = {
      dataProvenance: "satellite-derived",
      calcEngineVersion: "2026-08-01-legacy",
    };
    expect(isPointSlopeOutdated(pt)).toBe(true);
  });

  it("deve reconhecer como atualizado ponto com a versão exata GEE_CALC_ENGINE_VERSION", () => {
    const pt = {
      dataProvenance: "satellite-derived",
      calcEngineVersion: GEE_CALC_ENGINE_VERSION,
    };
    expect(isPointSlopeOutdated(pt)).toBe(false);

    const ptGee = {
      dataProvenance: "gee-screened",
      calcEngineVersion: GEE_CALC_ENGINE_VERSION,
    };
    expect(isPointSlopeOutdated(ptGee)).toBe(false);
  });

  it("não deve marcar pontos user-upload ou field-validated como desatualizados pelo motor GEE", () => {
    expect(isPointSlopeOutdated({ dataProvenance: "user-upload" })).toBe(false);
    expect(isPointSlopeOutdated({ dataProvenance: "field-validated" })).toBe(false);
  });
});
