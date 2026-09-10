import { describe, it, expect } from "vitest";
import { buildAuditPdf } from "./auditPdfGenerator";
import { ErosionPoint } from "@/types/erosion";

describe("auditPdfGenerator", () => {
  const point: ErosionPoint = {
    id: "p1",
    code: "PR-TEST-001",
    name: "Ponto Teste de Erosão",
    latitude: -25.4284,
    longitude: -49.2733,
    slopePercent: 14.2,
    slopeDegrees: 8.1,
    bsi: 0.28,
    ndvi: 0.19,
    elevation: 915,
    municipality: "Curitiba",
    state: "PR",
    macroRegion: "Primeiro Planalto",
    watershed: "Rio Iguaçu",
    soilType: "Latossolo Vermelho Distroférrico",
    featureType: "Erosão Laminar Severa",
    severity: "Alta",
    estimatedSoilLoss: 94.5,
    priorityScore: 82,
    detectionDate: "2026-08-30",
    dataProvenance: "satellite-derived",
    geeSourceImageId: "S2A_MSIL2A_20260815T132231_N0510_R138_T22JGR",
    geeComputedAt: "2026-08-30T15:00:00Z",
    calcEngineVersion: "2026.1-metric",
    rusleFactors: {
      r: 7800,
      k: 0.032,
      ls: 3.5,
      c: 0.27,
      p: 1.0,
    },
  };

  it("gera o laudo em PDF sem erros para um ponto auditado", () => {
    const doc = buildAuditPdf(point);

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBe(2);
    expect(doc.output()).toContain(point.code);
  });

  it("gera o PDF corretamente para pontos com nomes longos (sem quebrar layout)", () => {
    const pointWithLongName: ErosionPoint = {
      id: "p-cand-123",
      code: "PR-CAND-123",
      name: "Candidato 123 - Paraná (PR) — limite oficial IBGE",
      latitude: -24.450839,
      longitude: -51.493274,
      slopePercent: 13.88,
      slopeDegrees: 7.9,
      bsi: 0.101,
      ndvi: 0.193,
      elevation: 510,
      municipality: "Paraná (PR) — limite oficial IBGE",
      state: "PR",
      macroRegion: "Terceiro Planalto",
      watershed: "Bacia Hidrográfica Local",
      soilType: "Argissolo Vermelho-Amarelo",
      featureType: "Erosão Laminar Severa",
      severity: "Alta",
      estimatedSoilLoss: 129.88,
      priorityScore: 57,
      detectionDate: "2026-08-30",
      dataProvenance: "gee-screened",
      geeSourceImageId: "S2A_MSIL2A_HARMONIZED (Passagem com menor índice de nuvens nos últimos 120 dias)",
      geeComputedAt: "2026-08-31T23:35:25Z",
      calcEngineVersion: "2026-08-30-slope-projection-fix",
      rusleFactors: {
        r: 6472.8,
        k: 0.0465,
        ls: 1.172,
        c: 0.3682,
        p: 1.0,
      },
    };

    const doc = buildAuditPdf(pointWithLongName);

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBe(2);
    expect(doc.output()).toContain(pointWithLongName.code);
  });

  it("recusa emissao de laudo para pontos com proveniencia sintetica (mock)", () => {
    const mockPoint = { ...point, dataProvenance: "mock" } as unknown as ErosionPoint;
    expect(() => buildAuditPdf(mockPoint)).toThrow(
      "Recusa de emissao: ponto com proveniencia sintetica nao pode gerar laudo pericial."
    );
  });
});
