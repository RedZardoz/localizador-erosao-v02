import { describe, it, expect } from "vitest";
import {
  LIMIAR_FRACAO_D26,
  binarizarFracao,
  binarizarOrdinal,
  ErroRotuloInvalido,
} from "./binarizacao";

describe("N02 — Binarização Única de Rótulos (D26 e D03)", () => {
  it("exporta LIMIAR_FRACAO_D26 = 0.25", () => {
    expect(LIMIAR_FRACAO_D26).toBe(0.25);
  });

  describe("binarizarFracao", () => {
    it("deve retornar 1 para fração >= 0.25 e 0 para fração < 0.25 dentro de [0, 1]", () => {
      expect(binarizarFracao(0.25)).toBe(1);
      expect(binarizarFracao(0.5)).toBe(1);
      expect(binarizarFracao(1.0)).toBe(1);
      expect(binarizarFracao(0.249)).toBe(0);
      expect(binarizarFracao(0.0)).toBe(0);
    });

    it("deve lançar erro para valores fora de [0, 1], NaN ou não finitos (nunca retorna 0)", () => {
      expect(() => binarizarFracao(-0.01)).toThrow();
      expect(() => binarizarFracao(1.01)).toThrow();
      expect(() => binarizarFracao(NaN)).toThrow();
      expect(() => binarizarFracao(Infinity)).toThrow();
      expect(() => binarizarFracao(-Infinity)).toThrow();
    });
  });

  describe("binarizarOrdinal", () => {
    it("mapeia ausente para 0", () => {
      expect(binarizarOrdinal("ausente")).toBe(0);
      expect(binarizarOrdinal("  Ausente  ")).toBe(0);
    });

    it("mapeia incipiente, moderada, severa para 1", () => {
      expect(binarizarOrdinal("incipiente")).toBe(1);
      expect(binarizarOrdinal("Incipiente")).toBe(1);
      expect(binarizarOrdinal("moderada")).toBe(1);
      expect(binarizarOrdinal("MODERADA")).toBe(1);
      expect(binarizarOrdinal("severa")).toBe(1);
      expect(binarizarOrdinal("Severa")).toBe(1);
    });

    it("mapeia aliases legados ('presente', 'erosao', 'erosão', '1') para 1", () => {
      expect(binarizarOrdinal("presente")).toBe(1);
      expect(binarizarOrdinal("erosao")).toBe(1);
      expect(binarizarOrdinal("erosão")).toBe(1);
      expect(binarizarOrdinal("Erosão")).toBe(1);
      expect(binarizarOrdinal("1")).toBe(1);
    });

    it("lança ErroRotuloInvalido para 'Sem erosão' e 'indeterminado' (C09 / DEC-3)", () => {
      expect(() => binarizarOrdinal("Sem erosão")).toThrow(ErroRotuloInvalido);
      expect(() => binarizarOrdinal("sem erosao")).toThrow(ErroRotuloInvalido);
      expect(() => binarizarOrdinal("indeterminado")).toThrow(ErroRotuloInvalido);
    });

    it("lança ErroRotuloInvalido para 'controle', 'spd' e '0' conforme DP-10", () => {
      expect(() => binarizarOrdinal("controle")).toThrow(ErroRotuloInvalido);
      expect(() => binarizarOrdinal("Controle")).toThrow(ErroRotuloInvalido);
      expect(() => binarizarOrdinal("spd")).toThrow(ErroRotuloInvalido);
      expect(() => binarizarOrdinal("0")).toThrow(ErroRotuloInvalido);
    });

    it("lança ErroRotuloInvalido para qualquer outro texto desconhecido", () => {
      expect(() => binarizarOrdinal("desconhecido")).toThrow(ErroRotuloInvalido);
      expect(() => binarizarOrdinal("qualquer")).toThrow(ErroRotuloInvalido);
      expect(() => binarizarOrdinal("")).toThrow(ErroRotuloInvalido);
    });
  });
});
