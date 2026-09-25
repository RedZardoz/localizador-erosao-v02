import { describe, it, expect } from "vitest";
import { estaNoBboxParana, BBOX_PARANA } from "./fronteira";
import {
  identificarBacia,
  estaNoCorredorExperimentalBp3,
  PARANA_BASINS_GEOJSON,
  PARANA3_28_MUNICIPIOS_GEOJSON,
  PARANA3_UNIAO_28_MUNICIPIOS_FEATURE,
  CORREDOR_FOZ_CEU_AZUL_FEATURE,
} from "./bacias";
import { pontoEmAnel, pontoEmGeoJson } from "./municipio";

describe("Fronteira e Bbox do Paraná", () => {
  it("deve confirmar que Boa Ventura de São Roque está dentro do Paraná", () => {
    expect(estaNoBboxParana(-24.85, -51.5)).toBe(true);
  });

  it("deve rejeitar ponto em alto mar ou outro estado", () => {
    expect(estaNoBboxParana(0.0, 0.0)).toBe(false);
    expect(estaNoBboxParana(-12.97, -38.51)).toBe(false); // Salvador / BA
  });

  it("deve lidar com valores inválidos de forma defensiva", () => {
    expect(estaNoBboxParana(NaN, -51.5)).toBe(false);
    expect(estaNoBboxParana(-24.85, Infinity)).toBe(false);
  });
});

describe("Macrobacias Hidrográficas do Paraná & Limites Legais BP3", () => {
  it("deve identificar a bacia correta para pontos interiores (Ivaí e Paraná 3)", () => {
    // Coordenada no norte/noroeste do PR (Bacia do Ivaí)
    const baciaIvai = identificarBacia(-24.0, -52.5);
    expect(baciaIvai).toBe("Bacia do Rio Ivaí");

    // Coordenadas na Bacia Hidrográfica do Paraná 3 (Medianeira e Foz do Iguaçu)
    expect(identificarBacia(-25.295, -54.094)).toBe("Bacia Hidrográfica do Paraná 3");
    expect(identificarBacia(-25.516, -54.55)).toBe("Bacia Hidrográfica do Paraná 3");
    expect(estaNoCorredorExperimentalBp3(-25.295, -54.094)).toBe(true);
  });

  it("deve retornar null para pontos fora de qualquer bacia do Paraná (NUNCA inventar)", () => {
    const fora = identificarBacia(0.0, 0.0);
    expect(fora).toBeNull();
  });

  it("contém as 7 macrobacias oficiais (com Paraná 3 e Piquiri desmembradas) e os 28 municípios legais da BP3", () => {
    expect(PARANA_BASINS_GEOJSON.features.length).toBe(7);
    const codigos = PARANA_BASINS_GEOJSON.features.map(f => f.properties.code);
    expect(codigos).toContain("BP3");
    expect(codigos).toContain("PIQ");
    expect(codigos).toContain("TIB");
    expect(codigos).toContain("IVA");
    expect(codigos).toContain("PAN");
    expect(codigos).toContain("IGU");
    expect(codigos).toContain("LIT");

    expect(PARANA3_28_MUNICIPIOS_GEOJSON.features.length).toBe(28);
    expect(PARANA3_UNIAO_28_MUNICIPIOS_FEATURE.properties.code).toBe("BP3-MUN");
    expect(CORREDOR_FOZ_CEU_AZUL_FEATURE.properties.code).toBe("BP3-COR");
  });
});

describe("Geometria Espacial IBGE", () => {
  it("pontoEmAnel deve identificar pertinência em polígono simples", () => {
    // Quadrado unitário de [0,0] a [10,10]
    const anel = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ];

    expect(pontoEmAnel(5, 5, anel)).toBe(true);
    expect(pontoEmAnel(15, 5, anel)).toBe(false);
    expect(pontoEmAnel(-1, 5, anel)).toBe(false);
  });

  it("pontoEmGeoJson deve lidar com FeatureCollection e furos", () => {
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [
              // Anel externo
              [
                [0, 0],
                [10, 0],
                [10, 10],
                [0, 10],
                [0, 0],
              ],
              // Furo interno
              [
                [2, 2],
                [8, 2],
                [8, 8],
                [2, 8],
                [2, 2],
              ],
            ],
          },
        },
      ],
    };

    // Ponto na borda sólida
    expect(pontoEmGeoJson(1, 1, geojson)).toBe(true);
    // Ponto dentro do furo (deve ser false)
    expect(pontoEmGeoJson(5, 5, geojson)).toBe(false);
    // Ponto fora do polígono
    expect(pontoEmGeoJson(20, 20, geojson)).toBe(false);
  });
});
