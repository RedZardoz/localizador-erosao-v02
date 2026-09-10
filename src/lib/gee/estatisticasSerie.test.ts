import { describe, it, expect } from "vitest";
import {
  calcularPercentilOrdenado,
  calcularEstatisticasBanda,
  construirEstatisticasBloco,
} from "./estatisticasSerie";
import { ObservacaoCena } from "./serieTemporal";

describe("Estatísticas e Percentis da Série Temporal", () => {
  it("calcularPercentilOrdenado deve interpolar percentis corretamente", () => {
    // Array de 0 a 100
    const ordenados = Array.from({ length: 101 }, (_, i) => i);
    expect(calcularPercentilOrdenado(ordenados, 10)).toBe(10);
    expect(calcularPercentilOrdenado(ordenados, 50)).toBe(50);
    expect(calcularPercentilOrdenado(ordenados, 90)).toBe(90);
  });

  it("calcularEstatisticasBanda deve calcular p10, p50, p90, média e amplitude interquantil", () => {
    // 10 valores de reflectância SWIR: 0.10, 0.12, 0.14, 0.16, 0.18, 0.20, 0.22, 0.24, 0.26, 0.28
    const cenas: ObservacaoCena[] = Array.from({ length: 10 }, (_, i) => ({
      data: `2024-0${i + 1}-01`,
      tAnos: 2024 + i / 12,
      productId: `CENA_${i}`,
      nuvemSombra: false,
      b2: 0.1, b3: 0.1, b4: 0.1, b5: 0.1, b6: 0.1, b7: 0.1, b8: 0.1, b8a: 0.1, b11: 0.1,
      b12: Number((0.10 + i * 0.02).toFixed(2)),
    }));

    const est = calcularEstatisticasBanda(cenas, "b12");
    expect(est.p50.estado).toBe("modelado");
    if (est.p50.estado === "modelado") {
      // Mediana de [0.10, ..., 0.28] = (0.18 + 0.20) / 2 = 0.19
      expect(est.p50.valor).toBeCloseTo(0.19, 2);
    }
    if (est.media.estado === "modelado") {
      expect(est.media.valor).toBeCloseTo(0.19, 2);
    }
    if (est.amplitudeInterquantil.estado === "modelado") {
      expect(est.amplitudeInterquantil.valor).toBeGreaterThan(0);
    }
  });

  it("deve retornar indisponivel com causa insuficiente se n < nMinimo", () => {
    const cenas: ObservacaoCena[] = [
      {
        data: "2024-01-01",
        tAnos: 2024.0,
        productId: "CENA_1",
        nuvemSombra: false,
        b2: 0.1, b3: 0.1, b4: 0.1, b5: 0.1, b6: 0.1, b7: 0.1, b8: 0.1, b8a: 0.1, b11: 0.1, b12: 0.2,
      },
    ];

    const est = calcularEstatisticasBanda(cenas, "b12", 3);
    expect(est.p10.estado).toBe("indisponivel");
    if (est.p10.estado === "indisponivel") {
      expect(est.p10.causa).toBe("insuficiente");
      expect(est.p10.motivo).toContain("mínimo exigido: 3");
    }
  });

  it("construirEstatisticasBloco deve gerar chaves completas para B11 e B12", () => {
    const cenas: ObservacaoCena[] = Array.from({ length: 5 }, (_, i) => ({
      data: `2024-0${i + 1}-01`,
      tAnos: 2024 + i / 12,
      productId: `CENA_${i}`,
      nuvemSombra: false,
      b2: 0.1, b3: 0.1, b4: 0.1, b5: 0.1, b6: 0.1, b7: 0.1, b8: 0.1, b8a: 0.1,
      b11: 0.25 + i * 0.01,
      b12: 0.15 + i * 0.01,
    }));

    const bloco = construirEstatisticasBloco(cenas, ["b11", "b12"]);
    expect(bloco["B11_p10"]).toBeDefined();
    expect(bloco["B11_p50"]).toBeDefined();
    expect(bloco["B11_p90"]).toBeDefined();
    expect(bloco["B12_p10"]).toBeDefined();
    expect(bloco["B12_p50"]).toBeDefined();
    expect(bloco["B12_p90"]).toBeDefined();
  });
});
