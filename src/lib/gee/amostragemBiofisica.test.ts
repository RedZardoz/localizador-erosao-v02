import { describe, it, expect } from "vitest";
import {
  classificarPontoEspectral,
  CRITERIOS_ESPECTRAIS,
} from "./amostragemBiofisica";

describe("Metodologia PPGTCA 2026 — Classificação Espectral Biofísica", () => {
  it("classifica como Erosão quando BSI > 0.10 e NDVI < 0.40", () => {
    expect(classificarPontoEspectral(0.15, 0.35)).toBe("erosao");
    expect(classificarPontoEspectral(0.45, 0.20)).toBe("erosao");
    expect(classificarPontoEspectral(0.11, 0.39)).toBe("erosao");
    expect(classificarPontoEspectral(0.2, 0.3)).toBe("erosao");
  });

  it("classifica como Controle quando BSI < 0.00 e NDVI > 0.65", () => {
    expect(classificarPontoEspectral(-0.05, 0.70)).toBe("controle");
    expect(classificarPontoEspectral(-0.25, 0.85)).toBe("controle");
    expect(classificarPontoEspectral(-0.01, 0.66)).toBe("controle");
  });

  it("classifica como Indefinido quando está em faixas de transição ou fora dos limiares", () => {
    // NDVI baixo mas BSI baixo/negativo (solo com palhada seca)
    expect(classificarPontoEspectral(0.05, 0.35)).toBe("indefinido");
    expect(classificarPontoEspectral(-0.10, 0.30)).toBe("indefinido");

    // BSI alto mas NDVI intermediário
    expect(classificarPontoEspectral(0.20, 0.50)).toBe("indefinido");

    // Ambos intermediários
    expect(classificarPontoEspectral(0.05, 0.50)).toBe("indefinido");
  });

  it("classifica como Indefinido quando valores finitos estao fora do dominio fisico [-1, 1]", () => {
    expect(classificarPontoEspectral(5, -3)).toBe("indefinido");
    expect(classificarPontoEspectral(-5, 3)).toBe("indefinido");
    expect(classificarPontoEspectral(1.05, 0.20)).toBe("indefinido");
    expect(classificarPontoEspectral(0.20, -1.05)).toBe("indefinido");
  });

  it("rejeita e retorna indefinido quando BSI ou NDVI são nulos ou ausentes (zero mock)", () => {
    expect(classificarPontoEspectral(null, 0.30)).toBe("indefinido");
    expect(classificarPontoEspectral(0.15, null)).toBe("indefinido");
    expect(classificarPontoEspectral(undefined, undefined)).toBe("indefinido");
    expect(classificarPontoEspectral(NaN, 0.5)).toBe("indefinido");
  });
});
