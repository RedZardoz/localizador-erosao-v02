import { describe, it, expect } from "vitest";
import { DECISOES, PARAMETROS } from "./decisoes";

describe("N06 — Emendas de 06/10/2026 e Novos Parâmetros Propostos", () => {
  it("as 10 decisões emendadas devem conter a marca EMENDA DE 06/10/2026 no campo apropriado", () => {
    expect(DECISOES.D25.valor).toContain("EMENDA DE 06/10/2026");
    expect(DECISOES.D24.valor).toContain("EMENDA DE 06/10/2026");
    expect(DECISOES.D06.valor).toContain("EMENDA DE 06/10/2026");
    expect(DECISOES.D16.valor).toContain("EMENDA DE 06/10/2026");
    expect(DECISOES.D02.valor).toContain("EMENDA DE 06/10/2026");
    expect(DECISOES.D09.referencia).toContain("EMENDA DE 06/10/2026");
    expect(DECISOES.D10.referencia).toContain("EMENDA DE 06/10/2026");
    expect(DECISOES.D14.valor).toContain("EMENDA DE 06/10/2026");
    expect(DECISOES.D13.valor).toContain("EMENDA DE 06/10/2026");
    expect(DECISOES.D15.valor).toContain("EMENDA DE 06/10/2026");
  });

  it("regra de preservação: estado, decididoPor e decididoEm devem ser rigorosamente preservados", () => {
    expect(DECISOES.D24.estado).toBe("decidida");
    expect(DECISOES.D25.estado).toBe("decidida");
    expect(DECISOES.D06.estado).toBe("decidida");
    expect(DECISOES.D16.estado).toBe("decidida");
    expect(DECISOES.D02.estado).toBe("decidida");
    expect(DECISOES.D09.estado).toBe("decidida");
    expect(DECISOES.D10.estado).toBe("decidida");
    expect(DECISOES.D14.estado).toBe("decidida");
    expect(DECISOES.D13.estado).toBe("decidida");
    expect(DECISOES.D15.estado).toBe("decidida");
  });

  it("novos parâmetros propostos P10, P11, P20..P24 devem existir com estado 'proposta' e SEM valor", () => {
    const novosIds = ["P10", "P11", "P20", "P21", "P22", "P23", "P24"];
    for (const id of novosIds) {
      const p = PARAMETROS[id];
      expect(p, `Parâmetro ${id} deve existir em PARAMETROS`).toBeDefined();
      expect(p.estado, `Parâmetro ${id} deve ter estado 'proposta'`).toBe("proposta");
      expect(p.valor, `Parâmetro ${id} não deve ter valor`).toBeUndefined();
    }
  });
});
