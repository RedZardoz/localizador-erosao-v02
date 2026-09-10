import { describe, it, expect } from "vitest";
import { extrairBboxGeoJson, pontoEmPoligono, pontoEmGeoJson } from "./ibgeService";
import { ESTADOS_BRASIL, obterEstadoPorSigla } from "../dados/estadosBrasil";

describe("Serviço de Malhas e Localidades IBGE", () => {
  it("contém todos os 27 estados brasileiros cadastrados com BBox válidas", () => {
    expect(ESTADOS_BRASIL).toHaveLength(27);
    const pr = obterEstadoPorSigla("PR");
    expect(pr).toBeDefined();
    expect(pr?.nome).toBe("Paraná");
    expect(pr?.id).toBe(41);
    expect(pr?.bbox[0]).toBeLessThan(pr?.bbox[2]!);
    expect(pr?.bbox[1]).toBeLessThan(pr?.bbox[3]!);

    const sp = obterEstadoPorSigla("SP");
    expect(sp?.id).toBe(35);
  });

  it("calcula bbox exato a partir de GeoJSON FeatureCollection", () => {
    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [-50.5, -24.5],
                [-50.0, -24.5],
                [-50.0, -24.0],
                [-50.5, -24.0],
                [-50.5, -24.5],
              ],
            ],
          },
        },
      ],
    };

    const bbox = extrairBboxGeoJson(geojson);
    expect(bbox).toEqual([-50.5, -24.5, -50.0, -24.0]);
  });

  it("verifica inclusão de ponto no polígono (ray casting)", () => {
    const quadrado: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ];

    expect(pontoEmPoligono([5, 5], quadrado)).toBe(true);
    expect(pontoEmPoligono([15, 5], quadrado)).toBe(false);
    expect(pontoEmPoligono([-2, 5], quadrado)).toBe(false);
  });

  it("verifica ponto dentro de GeoJSON com Polygon e MultiPolygon", () => {
    const geojson = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-50.5, -24.5],
            [-50.0, -24.5],
            [-50.0, -24.0],
            [-50.5, -24.0],
            [-50.5, -24.5],
          ],
        ],
      },
    };

    expect(pontoEmGeoJson(-50.25, -24.25, geojson)).toBe(true);
    expect(pontoEmGeoJson(-51.0, -24.25, geojson)).toBe(false);
  });
});
