import { describe, it, expect } from "vitest";
import {
  validarOpcoesElegibilidade,
  normalizarAoIGeoJson,
  isClasseUsoElegivel,
  isDeclividadeElegivel,
  PROJECAO_ELEGIBILIDADE,
} from "./elegibilidade";

describe("Critérios de Elegibilidade Espacial (P04 / P05)", () => {
  it("deve adotar projeção métrica EPSG:31982 para cálculo de declividade", () => {
    expect(PROJECAO_ELEGIBILIDADE).toBe("EPSG:31982");
  });

  it("deve validar opções padrão e rejeitar intervalos inválidos", () => {
    const padrao = validarOpcoesElegibilidade();
    expect(padrao.minSlopePercent).toBe(3.0);
    expect(padrao.maxSlopePercent).toBe(20.0);
    expect(padrao.allowedLandCoverClasses).toContain(40);

    expect(() => validarOpcoesElegibilidade({ minSlopePercent: 25, maxSlopePercent: 10 })).toThrow(
      /maior que a mínima/
    );
  });

  it("deve verificar classes de uso da terra da ESA WorldCover (P05)", () => {
    expect(isClasseUsoElegivel(30)).toBe(true);  // Pastagem
    expect(isClasseUsoElegivel(40)).toBe(true);  // Agricultura
    expect(isClasseUsoElegivel(60)).toBe(true);  // Solo exposto
    expect(isClasseUsoElegivel(10)).toBe(false); // Floresta
    expect(isClasseUsoElegivel(50)).toBe(false); // Urbano
    expect(isClasseUsoElegivel(80)).toBe(false); // Água
  });

  it("deve verificar faixa de declividade de elegibilidade", () => {
    expect(isDeclividadeElegivel(5.0)).toBe(true);
    expect(isDeclividadeElegivel(1.5)).toBe(false); // Abaixo de 3%
    expect(isDeclividadeElegivel(25.0)).toBe(false); // Acima de 20%
  });
});

describe("Normalização Integral de AOI (sem perda de feições)", () => {
  it("deve normalizar Polygon simples", () => {
    const poly: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
    };
    const norm = normalizarAoIGeoJson(poly);
    expect(norm.type).toBe("Polygon");
  });

  it("deve unir TODAS as feições de uma FeatureCollection em MultiPolygon (corrige achado 10.1)", () => {
    const fc: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { nome: "Talhão 1" },
          geometry: {
            type: "Polygon",
            coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
          },
        },
        {
          type: "Feature",
          properties: { nome: "Talhão 2" },
          geometry: {
            type: "Polygon",
            coordinates: [[[2, 2], [2, 3], [3, 3], [3, 2], [2, 2]]],
          },
        },
      ],
    };

    const norm = normalizarAoIGeoJson(fc);
    expect(norm.type).toBe("MultiPolygon");
    // Deve conter as coordenadas dos 2 talhões, sem descartar o segundo
    expect(norm.coordinates.length).toBe(2);
  });

  it("deve rejeitar FeatureCollection vazia", () => {
    const fcVazia: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [],
    };
    expect(() => normalizarAoIGeoJson(fcVazia)).toThrow(/vazia/);
  });
});
