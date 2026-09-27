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

  it("Decisões formalizadas na metodologia devem estar decididas e retornar valor válido", () => {
    const decididas = ["D01", "D02", "D03", "D04", "D06", "D09", "D10", "D11", "D14", "D16"];
    for (const id of decididas) {
      const d = DECISOES[id];
      expect(d.estado).toBe("decidida");
      expect(exigirDecisao(d)).toBeDefined();
      expect(d.decididoPor).toBeDefined();
      expect(d.decididoEm).toBeDefined();
      expect(d.referencia).toBeDefined();
    }
  });

  it("Decisões pendentes devem lançar ErroDecisaoPendente ao serem exigidas", () => {
    const todas = Object.values(DECISOES);
    const pendentes = todas.filter((d) => d.estado === "pendente");
    const decididas = todas.filter((d) => d.estado === "decidida");

    // A partição de DECISOES é binária: toda decisão está "decidida" ou "pendente".
    // Asseverar a partição, e não uma contagem literal, evita que o registro de uma
    // nova decisão quebre o teste sem que nenhuma invariante tenha sido violada.
    expect(pendentes.length + decididas.length).toBe(todas.length);
    // Guarda antivacuidade: precisa haver pendência para o detector ter o que exercitar.
    expect(pendentes.length).toBeGreaterThan(0);

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
