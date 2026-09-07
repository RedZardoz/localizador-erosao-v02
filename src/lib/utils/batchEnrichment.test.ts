import { describe, it, expect } from "vitest";
import {
  resolveKFactorForPoint,
  resolveRegionalRFactor,
  enrichPointsBatch,
} from "./batchEnrichment";
import { ErosionPoint } from "@/types/erosion";

describe("batchEnrichment", () => {
  it("deve resolver o fator K corretamente para diferentes solos", () => {
    const kLatossolo = resolveKFactorForPoint("Latossolo Vermelho Distroférrico");
    expect(kLatossolo.kFactor).toBe(0.02);

    const kArgissolo = resolveKFactorForPoint("Argissolo Vermelho-Amarelo");
    expect(kArgissolo.kFactor).toBe(0.0465);

    const kDesconhecido = resolveKFactorForPoint("Solo Não Identificado");
    expect(kDesconhecido.kFactor).toBe(0.03);
    expect(kDesconhecido.approximated).toBe(true);
  });

  it("deve resolver o fator R regional com base na latitude e estado", () => {
    const rPr = resolveRegionalRFactor(-24.5, "PR");
    expect(rPr).toBe(6600);

    const rSulPr = resolveRegionalRFactor(-25.5, "PR");
    expect(rSulPr).toBe(7000);

    const rSc = resolveRegionalRFactor(-27.0, "SC");
    expect(rSc).toBe(7200);

    const rSp = resolveRegionalRFactor(-22.0, "SP");
    expect(rSp).toBe(6200);
  });

  it("deve enriquecer os fatores RUSLE quando solicitado", async () => {
    const samplePoint: ErosionPoint = {
      id: "pt-test-1",
      code: "PR-TEST-001",
      name: "Ponto de Teste",
      latitude: -24.0,
      longitude: -51.0,
      elevation: 600,
      slopePercent: 12,
      slopeDegrees: 6.84,
      bsi: 0.45,
      ndvi: 0.32,
      soilType: "Latossolo Vermelho",
      severity: "Alta",
      priorityScore: 75,
      estimatedSoilLoss: 20,
      municipality: "Apucarana",
      state: "PR",
      macroRegion: "Norte Central",
      watershed: "Rio Ivaí",
      detectionDate: "2026-09-04",
      featureType: "Erosão Laminar Severa",
    };

    const progressMessages: string[] = [];
    const enriched = await enrichPointsBatch(
      [samplePoint],
      { calculateRusle: true, queryTenure: false },
      (_curr, _total, msg) => progressMessages.push(msg)
    );

    expect(enriched.length).toBe(1);
    const pt = enriched[0];

    expect(pt.rusleFactors).toBeDefined();
    expect(pt.rusleFactors?.r).toBe(6600);
    expect(pt.rusleFactors?.k).toBe(0.02);
    expect(pt.rusleFactors?.ls).toBeGreaterThan(0);
    expect(pt.rusleFactors?.c).toBeGreaterThan(0);
    expect(pt.rusleFactors?.p).toBe(1.0);
    expect(pt.estimatedSoilLoss).toBeGreaterThan(0);
    expect(pt.calcEngineVersion).toBe("2026.1-batch-rusle");
    expect(progressMessages.length).toBeGreaterThan(0);
  });
});
