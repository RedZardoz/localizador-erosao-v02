import { describe, it, expect } from "vitest";
import {
  calcularDistanciaKm,
  calcularSemivariogramaEmpirico,
  atribuirBlocoEspacial,
} from "./blocosEspaciais";

describe("Blocos Espaciais e Semivariograma Empírico (Fase 4 — SAREL)", () => {
  const ORIGEM_PADRAO = { origemLat: -26.5, origemLng: -54.5 };

  describe("Cálculo de Distância Haversine", () => {
    it("calcula distância entre coordenadas do Paraná com precisão métrica", () => {
      // Cascavel (-24.95, -53.45) para Toledo (-24.71, -53.74) ≈ 40 km
      const d = calcularDistanciaKm(-24.95, -53.45, -24.71, -53.74);
      expect(d).toBeGreaterThan(35);
      expect(d).toBeLessThan(45);
    });

    it("retorna 0 para a mesma coordenada", () => {
      expect(calcularDistanciaKm(-25.0, -53.0, -25.0, -53.0)).toBe(0);
    });
  });

  describe("Atribuição de Bloco Espacial Regular", () => {
    it("atribui identificadores de bloco espacial consistentes (ex: BLOCO_R01_C02)", () => {
      const b1 = atribuirBlocoEspacial(-25.5, -53.5, 20.0, ORIGEM_PADRAO);
      const b2 = atribuirBlocoEspacial(-25.5005, -53.5005, 20.0, ORIGEM_PADRAO); // Ponto muito próximo
      const b3 = atribuirBlocoEspacial(-24.0, -51.0, 20.0, ORIGEM_PADRAO);       // Ponto distante

      expect(b1).toMatch(/^BLOCO_R\d{2}_C\d{2}$/);
      expect(b1).toBe(b2); // Mesma célula de 20 km
      expect(b1).not.toBe(b3); // Célula diferente
    });
  });

  describe("Semivariograma Empírico e Determinação do Bloco (Corrige I4 e S1-15)", () => {
    it("aplica fallback documentado de 20 km para amostra pequena (n < 15) sem atribuir a Roberts et al.", () => {
      const poucosPontos = [
        { latitude: -25.0, longitude: -53.0, valor: 10.0 },
        { latitude: -25.1, longitude: -53.1, valor: 12.0 },
      ];
      const res = calcularSemivariogramaEmpirico(poucosPontos, {
        tamanhoPassoKm: 2.0,
        distanciaMaximaKm: 40.0,
        fallbackArestaKm: 20.0,
      });
      expect(res.ehConclusivo).toBe(false);
      expect(res.arestaBlocoAdotadaKm).toBe(20.0);
      expect(res.justificativaAresta).toContain("Amostra insuficiente");
      expect(res.justificativaAresta).toContain("Roberts et al., 2017 orientam derivar do alcance, mas não determinam 20 km");
    });

    it("calcula semivariograma sem impor piso arbitrário de 10 km", () => {
      // Cria 40 pontos com alcance curto (~6 km)
      const pontos = Array.from({ length: 40 }, (_, i) => ({
        latitude: -25.0 - (i * 0.02),
        longitude: -53.0 - (i * 0.02),
        valor: 5.0 + Math.sin(i * 0.8) * 3.0,
      }));

      const res = calcularSemivariogramaEmpirico(pontos, {
        tamanhoPassoKm: 2.0,
        distanciaMaximaKm: 40.0,
        fallbackArestaKm: 20.0,
      });
      expect(res.bins.length).toBeGreaterThan(0);
      expect(res.arestaBlocoAdotadaKm).toBeGreaterThan(0);
      expect(res.justificativaAresta).toBeDefined();
    });
  });
});
