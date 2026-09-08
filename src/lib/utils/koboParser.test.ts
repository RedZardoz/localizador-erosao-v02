import { describe, expect, it } from "vitest";
import { parseAndMatchKoboExport } from "./koboParser";
import { ErosionPoint } from "@/types/erosion";

function makePoint(overrides: Partial<ErosionPoint>): ErosionPoint {
  return {
    id: "PR-CAND-001",
    code: "PR-CAND-001",
    name: "Foco 1",
    latitude: -23.42,
    longitude: -51.93,
    elevation: 500,
    slopePercent: 15,
    slopeDegrees: 8.5,
    bsi: 0.4,
    ndvi: 0.3,
    municipality: "Maringá",
    state: "PR",
    macroRegion: "Norte Central",
    watershed: "Rio Ivaí",
    soilType: "Latossolo Vermelho Distroférrico",
    featureType: "Erosão Laminar Severa",
    severity: "Alta",
    estimatedSoilLoss: 20,
    priorityScore: 60,
    detectionDate: "2026-01-01",
    dataProvenance: "gee-screened",
    ...overrides,
  };
}

describe("parseAndMatchKoboExport", () => {
  it("casa um registro pelo código explícito do formulário", () => {
    const existing = [makePoint({})];
    const csv = "code,_gps_latitude,_gps_longitude,pedestal_mm\nPR-CAND-001,-23.5,-52.5,12";
    const result = parseAndMatchKoboExport(csv, existing);
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].matchedPointId).toBe("PR-CAND-001");
    expect(result.matched[0].fieldObservations.pedestal_mm).toBe("12");
  });

  it("casa um registro pelo ponto de triagem mais próximo quando não há código", () => {
    const existing = [makePoint({ id: "A", latitude: -23.42, longitude: -51.93 }), makePoint({ id: "B", latitude: -25, longitude: -50 })];
    // ~50m do ponto A, bem dentro do raio de 150m
    const csv = "_gps_latitude,_gps_longitude\n-23.4204,-51.93";
    const result = parseAndMatchKoboExport(csv, existing);
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].matchedPointId).toBe("A");
  });

  it("não casa quando o ponto de campo está fora do raio de tolerância", () => {
    const existing = [makePoint({ id: "A", latitude: -23.42, longitude: -51.93 })];
    const csv = "_gps_latitude,_gps_longitude\n-24.0,-52.0"; // muito longe
    const result = parseAndMatchKoboExport(csv, existing);
    expect(result.matched).toHaveLength(0);
    expect(result.unmatchedRows).toBe(1);
  });

  it("reconhece o formato bruto de geopoint 'lat lon alt acc' numa única coluna", () => {
    const existing = [makePoint({ id: "A", latitude: -23.42, longitude: -51.93 })];
    const csv = "gps_point\n-23.4205 -51.9301 500 5";
    const result = parseAndMatchKoboExport(csv, existing);
    expect(result.matched).toHaveLength(1);
  });

  it("conta como não casada uma linha sem nenhuma coluna de GPS reconhecível", () => {
    const existing = [makePoint({})];
    const csv = "observacao\nSolo com crosta visível";
    const result = parseAndMatchKoboExport(csv, existing);
    expect(result.matched).toHaveLength(0);
    expect(result.unmatchedRows).toBe(1);
  });
});
