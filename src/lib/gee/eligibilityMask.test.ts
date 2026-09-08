import { describe, it, expect } from "vitest";
import {
  DEFAULT_ELIGIBILITY_OPTIONS,
  WORLDCOVER_CLASSES,
  validateEligibilityOptions,
  isLandCoverClassEligible,
  normalizeAoIToGeoJSON,
} from "./eligibilityConstants";

describe("eligibilityMask - Configurações e Valores Padrão", () => {
  it("deve conter valores padrão alinhados com o README §2.2 / §3.3", () => {
    expect(DEFAULT_ELIGIBILITY_OPTIONS.allowedLandCoverClasses).toEqual([30, 40, 60]);
    expect(DEFAULT_ELIGIBILITY_OPTIONS.minSlopePercent).toBe(3.0);
    expect(DEFAULT_ELIGIBILITY_OPTIONS.maxSlopePercent).toBe(20.0);
    expect(DEFAULT_ELIGIBILITY_OPTIONS.waterOccurrenceThreshold).toBe(10);
    expect(DEFAULT_ELIGIBILITY_OPTIONS.waterBufferMeters).toBe(30);
    expect(DEFAULT_ELIGIBILITY_OPTIONS.urbanBufferMeters).toBe(150);
  });

  it("deve mapear corretamente o catálogo de classes ESA WorldCover 10m", () => {
    expect(WORLDCOVER_CLASSES[10].name).toBe("Tree cover");
    expect(WORLDCOVER_CLASSES[10].defaultEligible).toBe(false);

    expect(WORLDCOVER_CLASSES[30].name).toBe("Grassland");
    expect(WORLDCOVER_CLASSES[30].defaultEligible).toBe(true);

    expect(WORLDCOVER_CLASSES[40].name).toBe("Cropland");
    expect(WORLDCOVER_CLASSES[40].defaultEligible).toBe(true);

    expect(WORLDCOVER_CLASSES[50].name).toBe("Built-up");
    expect(WORLDCOVER_CLASSES[50].defaultEligible).toBe(false);

    expect(WORLDCOVER_CLASSES[60].name).toBe("Bare / sparse vegetation");
    expect(WORLDCOVER_CLASSES[60].defaultEligible).toBe(true);

    expect(WORLDCOVER_CLASSES[80].name).toBe("Permanent water bodies");
    expect(WORLDCOVER_CLASSES[80].defaultEligible).toBe(false);
  });
});

describe("validateEligibilityOptions - Validação de Parâmetros", () => {
  it("deve preencher valores padrão quando nenhum parâmetro for informado", () => {
    const opts = validateEligibilityOptions();
    expect(opts).toEqual(DEFAULT_ELIGIBILITY_OPTIONS);
  });

  it("deve aceitar parâmetros parciais customizados e completar com os padrões", () => {
    const opts = validateEligibilityOptions({
      minSlopePercent: 5,
      maxSlopePercent: 15,
      urbanBufferMeters: 200,
    });
    expect(opts.minSlopePercent).toBe(5);
    expect(opts.maxSlopePercent).toBe(15);
    expect(opts.allowedLandCoverClasses).toEqual([30, 40, 60]);
    expect(opts.waterBufferMeters).toBe(30);
    expect(opts.urbanBufferMeters).toBe(200);
    expect(opts.waterOccurrenceThreshold).toBe(10);
  });

  it("deve aceitar classes customizadas de Land Cover", () => {
    const opts = validateEligibilityOptions({
      allowedLandCoverClasses: [40], // apenas Cropland
    });
    expect(opts.allowedLandCoverClasses).toEqual([40]);
  });

  it("deve rejeitar declividade mínima negativa", () => {
    expect(() => validateEligibilityOptions({ minSlopePercent: -1 })).toThrow(
      /Declividade mínima inválida/
    );
  });

  it("deve rejeitar declividade máxima menor ou igual à mínima", () => {
    expect(() => validateEligibilityOptions({ minSlopePercent: 10, maxSlopePercent: 10 })).toThrow(
      /Declividade máxima .* deve ser estritamente maior/
    );
    expect(() => validateEligibilityOptions({ minSlopePercent: 12, maxSlopePercent: 8 })).toThrow(
      /Declividade máxima .* deve ser estritamente maior/
    );
  });

  it("deve rejeitar limiar de ocorrência de água fora da faixa 0-100", () => {
    expect(() => validateEligibilityOptions({ waterOccurrenceThreshold: -5 })).toThrow(
      /Limiar de ocorrência de água deve estar entre 0% e 100%/
    );
    expect(() => validateEligibilityOptions({ waterOccurrenceThreshold: 105 })).toThrow(
      /Limiar de ocorrência de água deve estar entre 0% e 100%/
    );
  });

  it("deve rejeitar buffer de água negativo", () => {
    expect(() => validateEligibilityOptions({ waterBufferMeters: -10 })).toThrow(
      /Buffer de exclusão de corpos d'água não pode ser negativo/
    );
  });

  it("deve rejeitar buffer de área urbana negativo", () => {
    expect(() => validateEligibilityOptions({ urbanBufferMeters: -15 })).toThrow(
      /Buffer de exclusão de áreas urbanas não pode ser negativo/
    );
  });

  it("deve rejeitar lista vazia de classes de cobertura da terra", () => {
    expect(() => validateEligibilityOptions({ allowedLandCoverClasses: [] })).toThrow(
      /Pelo menos uma classe de cobertura do solo/
    );
  });
});

describe("isLandCoverClassEligible - Helper Puro", () => {
  it("deve identificar corretamente classes elegíveis pelo padrão", () => {
    expect(isLandCoverClassEligible(40)).toBe(true); // Cropland
    expect(isLandCoverClassEligible(30)).toBe(true); // Grassland
    expect(isLandCoverClassEligible(60)).toBe(true); // Bare
    expect(isLandCoverClassEligible(10)).toBe(false); // Tree
    expect(isLandCoverClassEligible(50)).toBe(false); // Built-up
    expect(isLandCoverClassEligible(80)).toBe(false); // Water
  });

  it("deve respeitar classes customizadas fornecidas nas opções", () => {
    const customOptions = { allowedLandCoverClasses: [40, 20] };
    expect(isLandCoverClassEligible(40, customOptions)).toBe(true);
    expect(isLandCoverClassEligible(20, customOptions)).toBe(true);
    expect(isLandCoverClassEligible(30, customOptions)).toBe(false);
  });
});

describe("normalizeAoIToGeoJSON - Extração e Validação de Geometria", () => {
  it("deve lançar erro se AOI for nula ou indefinida", () => {
    expect(() => normalizeAoIToGeoJSON(null)).toThrow(/AOI .* não fornecida/);
    expect(() => normalizeAoIToGeoJSON(undefined)).toThrow(/AOI .* não fornecida/);
  });

  it("deve validar e retornar um objeto GeoJSON Polygon", () => {
    const geojsonPolygon: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [-53.0, -25.0],
          [-53.0, -24.9],
          [-52.9, -24.9],
          [-52.9, -25.0],
          [-53.0, -25.0],
        ],
      ],
    };
    const geom = normalizeAoIToGeoJSON(geojsonPolygon);
    expect(geom.type).toBe("Polygon");
    expect(geom.coordinates).toEqual(geojsonPolygon.coordinates);
  });

  it("deve extrair a geometria de um objeto AOIPolygon estruturado", () => {
    const aoiPolygon = {
      id: "aoi-test",
      name: "Céu Azul - PR",
      fileName: "ceu_azul.geojson",
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [-53.9, -25.2],
            [-53.9, -25.0],
            [-53.7, -25.0],
            [-53.7, -25.2],
            [-53.9, -25.2],
          ],
        ],
      },
      importedAt: "2026-08-29T00:00:00.000Z",
    };
    const geom = normalizeAoIToGeoJSON(aoiPolygon);
    expect(geom.type).toBe("Polygon");
    expect(geom.coordinates).toEqual(aoiPolygon.geometry.coordinates);
  });

  it("deve rejeitar geometrias GeoJSON não poligonais (ex: Point)", () => {
    const pointGeoJson = {
      type: "Point",
      coordinates: [-53.0, -25.0],
    };
    expect(() => normalizeAoIToGeoJSON(pointGeoJson)).toThrow(
      /Tipo de geometria GeoJSON não suportado como AOI/
    );
  });
});
