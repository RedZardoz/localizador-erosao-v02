import { describe, it, expect } from "vitest";
import { validarEConstruirRotuloHumano } from "./rotuloHumano";

describe("C25 — Validação pericial estrita de rótulo humano (Inspetor)", () => {
  it("recusa gravação quando a data da observação está ausente ou vazia", () => {
    const resSemData = validarEConstruirRotuloHumano({
      classe: "erosao",
      modalidade: "campo",
      observador: "Dr. Pesquisador",
      observadoEm: "",
      confianca: "alta",
      modo: "registro",
      fracaoErodida: 0.35,
    });

    expect(resSemData.valido).toBe(false);
    if (!resSemData.valido) {
      expect(resSemData.motivo).toContain("Data da observação é obrigatória");
    }

    const resEspacos = validarEConstruirRotuloHumano({
      classe: "erosao",
      modalidade: "campo",
      observador: "Dr. Pesquisador",
      observadoEm: "   ",
      confianca: "alta",
      modo: "registro",
      fracaoErodida: 0.35,
    });

    expect(resEspacos.valido).toBe(false);
  });

  it("recusa gravação quando o nome do observador está ausente ou vazio (sem preencher padrão)", () => {
    const resSemObs = validarEConstruirRotuloHumano({
      classe: "erosao",
      modalidade: "campo",
      observador: "",
      observadoEm: "2026-10-18",
      confianca: "alta",
      modo: "registro",
      fracaoErodida: 0.35,
    });

    expect(resSemObs.valido).toBe(false);
    if (!resSemObs.valido) {
      expect(resSemObs.motivo).toContain("Nome do observador pericial é obrigatório");
    }
  });

  it("valida e constrói o rótulo pericial com sucesso quando data e observador são informados", () => {
    const resValido = validarEConstruirRotuloHumano({
      classe: "erosao",
      modalidade: "campo",
      observador: "Dr. Pesquisador",
      observadoEm: "2026-10-15",
      confianca: "alta",
      modo: "registro",
      fracaoErodida: 0.35,
      observacoes: "Feição clara de ravina",
    });

    expect(resValido.valido).toBe(true);
    if (resValido.valido) {
      expect(resValido.rotulo.observadoEm).toBe("2026-10-15");
      expect(resValido.rotulo.observador).toBe("Dr. Pesquisador");
      expect(resValido.rotulo.cego).toBe(true);
      expect(resValido.rotulo.alvoBinarioDerivado).toBe(1);
    }
  });
});
