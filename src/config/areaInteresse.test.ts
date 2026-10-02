import { describe, it, expect } from "vitest";
import { AREA_INTERESSE_BP3, AREA_INTERESSE_PADRAO } from "./areaInteresse";

describe("Configuração de Área de Interesse (J4)", () => {
  it("contém parâmetros canônicos da BP3 e rotulagem explícita de estudo local", () => {
    expect(AREA_INTERESSE_BP3.id).toBe("BP3");
    expect(AREA_INTERESSE_BP3.totalMunicipios).toBe(28);
    expect(AREA_INTERESSE_BP3.centro.lat).toBeCloseTo(-24.85);
    expect(AREA_INTERESSE_BP3.centro.lng).toBeCloseTo(-54.05);
    expect(AREA_INTERESSE_BP3.rotuloEstudo).toContain("BP3");
    expect(AREA_INTERESSE_PADRAO).toBe(AREA_INTERESSE_BP3);
  });
});
