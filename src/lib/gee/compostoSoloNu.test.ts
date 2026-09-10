import { describe, it, expect } from "vitest";
import { extrairMetricasSoloExposto } from "./compostoSoloNu";
import { ObservacaoCena } from "./serieTemporal";

describe("Composto de Solo Exposto e Frequência Ê (Decisão D10)", () => {
  it("deve calcular Ê, maior sequência e composto para série com ocorrência de solo nu", () => {
    // Limiar NDVI D10 = 0.25
    // 6 cenas: 2 com solo nu (NDVI ≈ 0.15) e 4 com vegetação (NDVI ≈ 0.6)
    const cenas: ObservacaoCena[] = [
      // Mês 05 (Maio) - Solo Nu
      {
        data: "2024-05-10",
        tAnos: 2024.36,
        productId: "CENA_1",
        nuvemSombra: false,
        b2: 0.12, b3: 0.14, b4: 0.20, b5: 0.22, b6: 0.24, b7: 0.25,
        b8: 0.26, // NDVI = (0.26 - 0.20) / 0.46 ≈ 0.13 (< 0.25 -> Solo Nu)
        b8a: 0.26, b11: 0.35, b12: 0.30,
      },
      // Mês 05 (Maio) - Solo Nu (segunda consecutiva)
      {
        data: "2024-05-25",
        tAnos: 2024.40,
        productId: "CENA_2",
        nuvemSombra: false,
        b2: 0.11, b3: 0.13, b4: 0.19, b5: 0.21, b6: 0.23, b7: 0.24,
        b8: 0.25, // NDVI = (0.25 - 0.19) / 0.44 ≈ 0.136 (< 0.25 -> Solo Nu)
        b8a: 0.25, b11: 0.33, b12: 0.28,
      },
      // Mês 07 (Julho) - Vegetação
      {
        data: "2024-07-15",
        tAnos: 2024.54,
        productId: "CENA_3",
        nuvemSombra: false,
        b2: 0.05, b3: 0.07, b4: 0.06, b5: 0.12, b6: 0.25, b7: 0.35,
        b8: 0.45, // NDVI = (0.45 - 0.06) / 0.51 ≈ 0.76 (Vegetação)
        b8a: 0.45, b11: 0.18, b12: 0.12,
      },
      // Mês 08 (Agosto) - Vegetação
      {
        data: "2024-08-15",
        tAnos: 2024.62,
        productId: "CENA_4",
        nuvemSombra: false,
        b2: 0.05, b3: 0.07, b4: 0.06, b5: 0.12, b6: 0.25, b7: 0.35,
        b8: 0.45,
        b8a: 0.45, b11: 0.18, b12: 0.12,
      },
      // Mês 09 (Setembro) - Vegetação
      {
        data: "2024-09-15",
        tAnos: 2024.71,
        productId: "CENA_5",
        nuvemSombra: false,
        b2: 0.05, b3: 0.07, b4: 0.06, b5: 0.12, b6: 0.25, b7: 0.35,
        b8: 0.45,
        b8a: 0.45, b11: 0.18, b12: 0.12,
      },
      // Mês 10 (Outubro) - Vegetação
      {
        data: "2024-10-15",
        tAnos: 2024.79,
        productId: "CENA_6",
        nuvemSombra: false,
        b2: 0.05, b3: 0.07, b4: 0.06, b5: 0.12, b6: 0.25, b7: 0.35,
        b8: 0.45,
        b8a: 0.45, b11: 0.18, b12: 0.12,
      },
    ];

    const metricas = extrairMetricasSoloExposto(cenas, 0.25);

    expect(metricas.nObservacoesValidas).toBe(6);
    expect(metricas.nObservacoesSoloNu).toBe(2);

    // Ê = 2 / 6 = 0.3333
    expect(metricas.frequenciaSoloNu.estado).toBe("modelado");
    if (metricas.frequenciaSoloNu.estado === "modelado") {
      expect(metricas.frequenciaSoloNu.valor).toBeCloseTo(0.3333, 3);
      expect(metricas.frequenciaSoloNu.decisoes).toContain("D10");
    }

    // Maior sequência = 2
    expect(metricas.maiorSequenciaSoloNu.estado).toBe("modelado");
    if (metricas.maiorSequenciaSoloNu.estado === "modelado") {
      expect(metricas.maiorSequenciaSoloNu.valor).toBe(2);
    }

    // Mês modal = 5 (Maio)
    expect(metricas.mesModalExposicao.estado).toBe("modelado");
    if (metricas.mesModalExposicao.estado === "modelado") {
      expect(metricas.mesModalExposicao.valor).toBe(5);
    }

    // Composto B12: mediana de [0.30, 0.28] = 0.29
    const compB12 = metricas.compostoSoloNu["B12"];
    expect(compB12.estado).toBe("modelado");
    if (compB12.estado === "modelado") {
      expect(compB12.valor).toBe(0.29);
    }
  });

  it("deve atribuir Ê = 0 como modelado e composto como fora-do-dominio quando nunca houve solo nu (Invariante 5)", () => {
    // Série com 4 cenas todas com vegetação (NDVI ≈ 0.7)
    const cenas: ObservacaoCena[] = Array.from({ length: 4 }, (_, i) => ({
      data: `2024-0${i + 1}-01`,
      tAnos: 2024 + i / 12,
      productId: `CENA_${i}`,
      nuvemSombra: false,
      b2: 0.05, b3: 0.07, b4: 0.06, b5: 0.12, b6: 0.25, b7: 0.35,
      b8: 0.50, // NDVI = (0.50 - 0.06) / 0.56 = 0.7857 (> 0.25)
      b8a: 0.50, b11: 0.15, b12: 0.10,
    }));

    const metricas = extrairMetricasSoloExposto(cenas, 0.25);

    expect(metricas.nObservacoesSoloNu).toBe(0);

    // Ê = 0.0 DEVE ser modelado (o zero é informação real)
    expect(metricas.frequenciaSoloNu.estado).toBe("modelado");
    if (metricas.frequenciaSoloNu.estado === "modelado") {
      expect(metricas.frequenciaSoloNu.valor).toBe(0);
    }

    // Mês modal DEVE ser indisponivel com causa fora-do-dominio
    expect(metricas.mesModalExposicao.estado).toBe("indisponivel");
    if (metricas.mesModalExposicao.estado === "indisponivel") {
      expect(metricas.mesModalExposicao.causa).toBe("fora-do-dominio");
    }

    // Composto de solo nu DEVE ser indisponivel com causa fora-do-dominio (NUNCA 0.25 arbitrário)
    expect(metricas.compostoSoloNu["B12"].estado).toBe("indisponivel");
    if (metricas.compostoSoloNu["B12"].estado === "indisponivel") {
      expect(metricas.compostoSoloNu["B12"].causa).toBe("fora-do-dominio");
      expect(metricas.compostoSoloNu["B12"].motivo).toContain("zero cenas");
    }
  });

  it("deve retornar indisponivel com causa insuficiente se todas as cenas forem mascaradas", () => {
    const cenasNuvem: ObservacaoCena[] = [
      {
        data: "2024-01-01",
        tAnos: 2024.0,
        productId: "CENA_1",
        nuvemSombra: true,
        b2: null, b3: null, b4: null, b5: null, b6: null, b7: null, b8: null, b8a: null, b11: null, b12: null,
      },
    ];

    const metricas = extrairMetricasSoloExposto(cenasNuvem, 0.25);
    expect(metricas.frequenciaSoloNu.estado).toBe("indisponivel");
    if (metricas.frequenciaSoloNu.estado === "indisponivel") {
      expect(metricas.frequenciaSoloNu.causa).toBe("insuficiente");
    }
  });
});
