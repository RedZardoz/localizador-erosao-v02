import { describe, it, expect } from "vitest";
import { ajustarHarmonicosBanda, construirHarmonicosBloco } from "./harmonicos";
import { ObservacaoCena } from "./serieTemporal";

describe("Ajuste de Modelos Harmônicos (OLS)", () => {
  it("deve ajustar perfeitamente uma senoide com tendência e retornar R² alto e qualidade", () => {
    // Gerar 36 observações mensais ao longo de 3 anos (t de 0.0 a 3.0)
    // Modelo: y(t) = 0.2 + 0.01*t + 0.05*cos(2pi t) + 0.08*sin(2pi t)
    // Amplitude anual teórica = sqrt(0.05^2 + 0.08^2) = sqrt(0.0025 + 0.0064) = sqrt(0.0089) ≈ 0.0943
    const cenas: ObservacaoCena[] = [];
    for (let i = 0; i < 36; i++) {
      const t = i / 12;
      const y = 0.2 + 0.01 * t + 0.05 * Math.cos(2 * Math.PI * t) + 0.08 * Math.sin(2 * Math.PI * t);
      cenas.push({
        data: `2020-${String((i % 12) + 1).padStart(2, "0")}-01`,
        tAnos: t,
        productId: `CENA_${i}`,
        nuvemSombra: false,
        b2: 0.1, b3: 0.1, b4: 0.1, b5: 0.1, b6: 0.1, b7: 0.1, b8: 0.1, b8a: 0.1, b11: 0.1,
        b12: Number(y.toFixed(5)),
      });
    }

    const res = ajustarHarmonicosBanda(cenas, "b12");

    expect(res.offset.estado).toBe("modelado");
    if (res.offset.estado === "modelado") {
      expect(res.offset.valor).toBeCloseTo(0.2, 2);
      expect(res.offset.qualidade?.r2).toBeGreaterThanOrEqual(0.99);
      expect(res.offset.qualidade?.nObservacoes).toBe(36);
    }

    if (res.tendencia.estado === "modelado") {
      expect(res.tendencia.valor).toBeCloseTo(0.01, 2);
    }

    if (res.amplitudeAnual.estado === "modelado") {
      expect(res.amplitudeAnual.valor).toBeCloseTo(0.0943, 2);
    }
  });

  it("deve recusar ajuste e retornar indisponivel com causa insuficiente se n < 12 (D11)", () => {
    const poucasCenas: ObservacaoCena[] = [];
    for (let i = 0; i < 8; i++) {
      poucasCenas.push({
        data: `2020-${String(i + 1).padStart(2, "0")}-01`,
        tAnos: i / 12,
        productId: `CENA_${i}`,
        nuvemSombra: false,
        b2: 0.1, b3: 0.1, b4: 0.1, b5: 0.1, b6: 0.1, b7: 0.1, b8: 0.1, b8a: 0.1, b11: 0.1,
        b12: 0.25,
      });
    }

    const res = ajustarHarmonicosBanda(poucasCenas, "b12");
    expect(res.offset.estado).toBe("indisponivel");
    if (res.offset.estado === "indisponivel") {
      expect(res.offset.causa).toBe("insuficiente");
      expect(res.offset.motivo).toContain("mínimo exigido: 12");
    }
    expect(res.amplitudeAnual.estado).toBe("indisponivel");
  });

  it("deve construir mapa consolidado de harmônicos com chaves corretas", () => {
    const cenas: ObservacaoCena[] = Array.from({ length: 20 }, (_, i) => ({
      data: `2020-${String((i % 12) + 1).padStart(2, "0")}-01`,
      tAnos: i / 12,
      productId: `CENA_${i}`,
      nuvemSombra: false,
      b2: 0.1, b3: 0.1, b4: 0.15, b5: 0.1, b6: 0.1, b7: 0.1, b8: 0.3, b8a: 0.3, b11: 0.22, b12: 0.18,
    }));

    const mapa = construirHarmonicosBloco(cenas, ["b12", "b11"]);
    expect(mapa["B12_offset"]).toBeDefined();
    expect(mapa["B12_tendencia"]).toBeDefined();
    expect(mapa["B12_amplitudeAnual"]).toBeDefined();
    expect(mapa["B12_faseAnual"]).toBeDefined();
    expect(mapa["B11_offset"]).toBeDefined();
  });
});
