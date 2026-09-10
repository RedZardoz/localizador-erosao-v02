import { describe, it, expect } from "vitest";
import { DECISOES, PARAMETROS, exigirDecisao, ErroDecisaoPendente } from "./decisoes";

describe("Registro de Decisões — Mecanismo e Integridade", () => {
  it("D01 (Fator C) deve estar decidida e retornar a fórmula sem erros", () => {
    expect(DECISOES.D01.estado).toBe("decidida");
    const val = exigirDecisao(DECISOES.D01);
    expect(val).toBe("(1 - NDVI) / 2");
    expect(DECISOES.D01.decididoPor).toBeDefined();
    expect(DECISOES.D01.decididoEm).toBeDefined();
    expect(DECISOES.D01.referencia).toBeDefined();
  });

  it("Decisões pendentes (D02 a D19) devem lançar ErroDecisaoPendente ao serem exigidas", () => {
    const pendentes = Object.values(DECISOES).filter((d) => d.id !== "D01");
    expect(pendentes.length).toBe(18);

    for (const d of pendentes) {
      expect(d.estado).toBe("pendente");
      expect(() => exigirDecisao(d)).toThrow(ErroDecisaoPendente);
      try {
        exigirDecisao(d);
      } catch (err) {
        expect(err).toBeInstanceOf(ErroDecisaoPendente);
        expect((err as ErroDecisaoPendente).decisaoId).toBe(d.id);
      }
    }
  });

  it("Toda decisão com estado 'decidida' deve ter justificativa, referência e registro de autor/data", () => {
    for (const d of Object.values(DECISOES)) {
      if (d.estado === "decidida") {
        expect(d.valor).toBeDefined();
        expect(d.decididoPor).toBeDefined();
        expect(d.decididoEm).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(d.referencia || d.justificativa).toBeDefined();
      }
    }
  });

  it("Parâmetros operacionais P01 a P09 devem ter IDs e estados válidos", () => {
    expect(Object.keys(PARAMETROS).length).toBe(9);
    for (const p of Object.values(PARAMETROS)) {
      expect(["pendente", "proposta", "decidida"]).toContain(p.estado);
    }
  });
});
