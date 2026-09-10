import { describe, it, expect } from "vitest";
import {
  calcularNdvi,
  calcularBsi,
  processarSerieTemporal,
  ObservacaoEspectral,
} from "./serieTemporal";
import { ajustarModeloHarmonico } from "./harmonicos";
import { gerarCompostoSoloNu } from "./compostoSoloNu";

describe("Séries Temporais, Harmônicos e Solo Exposto (Fase 3 — SAREL)", () => {
  describe("Regra 7: Preservação de Lacunas e Máscaras de Nuvem", () => {
    it("retorna null para NDVI se qualquer banda for mascarada/nula (nunca repõe default)", () => {
      expect(calcularNdvi(null, 0.1)).toBeNull();
      expect(calcularNdvi(0.5, null)).toBeNull();
      expect(calcularNdvi(NaN, 0.1)).toBeNull();
    });

    it("retorna null para BSI se qualquer banda for mascarada/nula", () => {
      expect(calcularBsi(0.2, null, 0.4, 0.1)).toBeNull();
      expect(calcularBsi(null, 0.15, 0.4, 0.1)).toBeNull();
    });

    it("descarta observações de nuvem sem aplicar unmask com constantes", () => {
      const obsBrutas: ObservacaoEspectral[] = [
        {
          data: "2026-01-05", tAnos: 2026.01, nuvemSombra: true, // Nuvem!
          b2: null, b3: null, b4: null, b5: null, b6: null, b7: null, b8: null, b8a: null, b11: null, b12: null,
          ndvi: null, bsi: null,
        },
        {
          data: "2026-01-15", tAnos: 2026.04, nuvemSombra: false, // Válido
          b2: 0.05, b3: 0.08, b4: 0.12, b5: 0.15, b6: 0.20, b7: 0.25, b8: 0.35, b8a: 0.36, b11: 0.22, b12: 0.18,
          ndvi: 0.4894, bsi: -0.1111,
        },
      ];

      const res = processarSerieTemporal(obsBrutas);
      expect(res.totalObservacoes).toBe(2);
      expect(res.nObservacoesValidas).toBe(1);
      expect(res.taxaNuvemPct).toBe(50.0);
      expect(res.observacoesValidas[0].data).toBe("2026-01-15");
    });
  });

  describe("Harmônicos e Qualidade do Ajuste (Corrige M2)", () => {
    it("rejeita ajuste harmônico quando há menos de 12 observações válidas", () => {
      // Apenas 5 observações válidas
      const poucasObs: ObservacaoEspectral[] = Array.from({ length: 5 }, (_, i) => ({
        data: `2026-0${i + 1}-01`,
        tAnos: 2026 + i * 0.08,
        nuvemSombra: false,
        b2: 0.05, b3: 0.08, b4: 0.12, b5: 0.15, b6: 0.20, b7: 0.25, b8: 0.35, b8a: 0.36, b11: 0.22, b12: 0.18,
        ndvi: 0.4, bsi: -0.1,
      }));

      const harm = ajustarModeloHarmonico(poucasObs, obs => obs.b12, "B12");
      expect(harm.tendencia.estado).toBe("indisponivel");
      if (harm.tendencia.estado === "indisponivel") {
        expect(harm.tendencia.motivo).toContain("mínimo exigido: 12");
      }
    });

    it("calcula coeficientes harmônicos com QualidadeAjuste (n, r2, erroPadrao)", () => {
      // Série sintética de 24 observações ao longo de 2 anos com ciclo anual e ruído baixo
      const obsValidas: ObservacaoEspectral[] = Array.from({ length: 24 }, (_, i) => {
        const t = 2024.0 + (i / 12);
        const cicloAnual = 0.05 * Math.cos(2 * Math.PI * t);
        const tendencia = 0.01 * (t - 2024);
        const b12 = 0.20 + tendencia + cicloAnual;

        return {
          data: `2024-${String((i % 12) + 1).padStart(2, "0")}-15`,
          tAnos: t,
          nuvemSombra: false,
          b2: 0.05, b3: 0.08, b4: 0.12, b5: 0.15, b6: 0.20, b7: 0.25, b8: 0.35, b8a: 0.36, b11: 0.22, b12,
          ndvi: 0.5, bsi: -0.2,
        };
      });

      const harm = ajustarModeloHarmonico(obsValidas, obs => obs.b12, "B12");
      expect(harm.offset.estado).toBe("modelado");
      expect(harm.tendencia.estado).toBe("modelado");
      expect(harm.amplitudeAnual.estado).toBe("modelado");

      if (harm.tendencia.estado === "modelado") {
        expect(harm.tendencia.qualidade).toBeDefined();
        expect(harm.tendencia.qualidade?.nObservacoes).toBe(24);
        expect(harm.tendencia.qualidade?.r2).toBeGreaterThanOrEqual(0.95);
        expect(harm.tendencia.valor).toBeCloseTo(0.01, 2);
      }
    });
  });

  describe("Composto de Solo Exposto e Frequência Ê", () => {
    it("calcula a frequência Ê e o composto mediano apenas das datas descobertas", () => {
      // 10 observações: 4 com solo nu (NDVI 0.15 < 0.25) e 6 com vegetação (NDVI 0.60)
      const serie: ObservacaoEspectral[] = Array.from({ length: 10 }, (_, i) => {
        const ehSoloNu = i < 4;
        return {
          data: `2026-0${i + 1}-01`,
          tAnos: 2026 + i * 0.1,
          nuvemSombra: false,
          b2: ehSoloNu ? 0.08 : 0.02,
          b3: ehSoloNu ? 0.12 : 0.04,
          b4: ehSoloNu ? 0.18 : 0.05,
          b5: 0.2, b6: 0.3, b7: 0.35,
          b8: ehSoloNu ? 0.22 : 0.60,
          b8a: 0.23,
          b11: ehSoloNu ? 0.28 : 0.10,
          b12: ehSoloNu ? 0.24 : 0.08,
          ndvi: ehSoloNu ? 0.15 : 0.60,
          bsi: ehSoloNu ? 0.20 : -0.50,
        };
      });

      const res = gerarCompostoSoloNu(serie, 0.25);
      expect(res.nObservacoesValidas).toBe(10);
      expect(res.nObservacoesSoloNu).toBe(4);
      expect(res.frequenciaSoloNu.estado).toBe("medido");
      if (res.frequenciaSoloNu.estado === "medido") {
        expect(res.frequenciaSoloNu.valor).toBe(0.4); // 4 / 10 = 0.40
      }

      // O composto para B4 deve ser 0.18 (mediana das 4 datas descobertas) e NÃO a média de todas as datas
      expect(res.compostoBandas.B4.estado).toBe("medido");
      if (res.compostoBandas.B4.estado === "medido") {
        expect(res.compostoBandas.B4.valor).toBe(0.18);
      }
    });

    it("retorna 'indisponivel' no composto se o solo nunca esteve exposto (nunca inventa valor)", () => {
      // 5 observações todas com dossel denso (NDVI 0.70)
      const serieVegetada: ObservacaoEspectral[] = Array.from({ length: 5 }, (_, i) => ({
        data: `2026-0${i + 1}-01`,
        tAnos: 2026 + i * 0.1,
        nuvemSombra: false,
        b2: 0.02, b3: 0.04, b4: 0.05, b5: 0.2, b6: 0.3, b7: 0.35, b8: 0.70, b8a: 0.72, b11: 0.10, b12: 0.08,
        ndvi: 0.70, bsi: -0.60,
      }));

      const res = gerarCompostoSoloNu(serieVegetada, 0.25);
      expect(res.nObservacoesSoloNu).toBe(0);
      expect(res.compostoBandas.B4.estado).toBe("indisponivel");
      if (res.compostoBandas.B4.estado === "indisponivel") {
        expect(res.compostoBandas.B4.motivo).toContain("cobertura vegetal contínua");
      }
    });
  });
});
