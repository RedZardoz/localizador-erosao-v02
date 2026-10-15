import { describe, expect, it, beforeAll } from "vitest";
import fs from "fs";
import path from "path";
import {
  criarAmostradorCopernicusGLO30Real,
  verificarCoberturaGLO30Poligonos,
  ErroTerrenoForaDeCoberturaGLO30,
} from "./planoVooNControl";

describe("Exportação de Planos de Voo (Testes Vivos com Copernicus DEM GLO-30)", () => {
  const demCacheDir = path.resolve(process.cwd(), "data/dem_cache");

  beforeAll(() => {
    if (!fs.existsSync(demCacheDir)) {
      throw new Error(`dado local ausente: ${demCacheDir}`);
    }
  });

  it(
    "Z1 & W3: amostrador real do Copernicus DEM GLO-30 lê os tiles oficiais com isolamento de PROJ_LIB, confere cota contra benchmark independente e recusa NoData / fora de borda (P12)",
    () => {
      if (!fs.existsSync(demCacheDir)) {
        throw new Error(`dado local ausente: ${demCacheDir}`);
      }
      const amostradorReal = criarAmostradorCopernicusGLO30Real();
      expect(amostradorReal.proveniencia).toBe("copernicus-glo30");
      expect(amostradorReal.descricaoFonte).toContain("COPERNICUS/DEM/GLO30");

      // Benchmark independente 1: Aeroporto Municipal de Toledo (SBTD, Bacia do Paraná 3)
      const cotaSbtd = amostradorReal.amostrar(-24.685833, -53.697778);
      expect(cotaSbtd).toBeCloseTo(555.89, 1);
      expect(Math.abs(cotaSbtd - 562.0)).toBeLessThan(10.0);

      // Benchmark 2: Coordenada de lavoura em Cascavel/Toledo (-25.1362, -53.8569)
      const cotaCascavel = amostradorReal.amostrar(-25.1362, -53.8569);
      expect(cotaCascavel).toBeCloseTo(586.43, 1);

      // Benchmark 3 (W4): Medianeira no quadrante S26/W055 (-25.295, -54.095)
      const cotaMedianeira = amostradorReal.amostrar(-25.295, -54.095);
      expect(cotaMedianeira).toBeCloseTo(413.63, 1);

      // Amostragem em lote com pre-carregamento
      if (amostradorReal.preCarregarCoordenadas) {
        amostradorReal.preCarregarCoordenadas([
          [-24.685833, -53.697778],
          [-25.1362, -53.8569],
          [-25.295, -54.095],
        ]);
      }
      expect(amostradorReal.amostrar(-24.685833, -53.697778)).toBeCloseTo(555.89, 1);

      // W3: Ponto imediatamente fora da borda física do tile em cache (não pode devolver 0.0)
      expect(() => amostradorReal.amostrar(-24.99990, -53.5000)).toThrow(
        ErroTerrenoForaDeCoberturaGLO30
      );

      // P12: Coordenada no Atlântico (0, 0) fora de cobertura
      expect(() => amostradorReal.amostrar(0.0, 0.0)).toThrow(
        ErroTerrenoForaDeCoberturaGLO30
      );
    },
    60000
  );

  it("W4: verificação prévia de cobertura de tiles DEM antes de emitir planos aborta cedo polígonos sem tile em cache", () => {
    if (!fs.existsSync(demCacheDir)) {
      throw new Error(`dado local ausente: ${demCacheDir}`);
    }
    const poligonosValidos = [
      { idPoligono: "P1", centroide: { latitude: -24.75, longitude: -53.72 } }, // S25_W054 (Toledo)
      { idPoligono: "P2", centroide: { latitude: -24.55, longitude: -54.05 } }, // S25_W055 (M.C. Rondon)
      { idPoligono: "P3", centroide: { latitude: -25.20, longitude: -53.80 } }, // S26_W054 (Capanema)
      { idPoligono: "P4", centroide: { latitude: -25.50, longitude: -54.50 } }, // S26_W055 (Foz do Iguaçu)
    ];

    const checagemOk = verificarCoberturaGLO30Poligonos(poligonosValidos);
    expect(checagemOk.coberturaCompleta).toBe(true);
    expect(checagemOk.tilesUtilizados).toEqual([
      "S25_00_W054_00",
      "S25_00_W055_00",
      "S26_00_W054_00",
      "S26_00_W055_00",
    ]);

    const poligonosComDescoberto = [
      ...poligonosValidos,
      { idPoligono: "P_FORA", centroide: { latitude: -12.50, longitude: -41.50 } }, // Bahia (S13_W042)
    ];

    const checagemFalha = verificarCoberturaGLO30Poligonos(poligonosComDescoberto);
    expect(checagemFalha.coberturaCompleta).toBe(false);
    expect(checagemFalha.poligonosDescobertos.length).toBe(1);
    expect(checagemFalha.poligonosDescobertos[0].idPoligono).toBe("P_FORA");
    expect(checagemFalha.poligonosDescobertos[0].tileRequerido).toBe("S13_00_W042_00");
  });
});
