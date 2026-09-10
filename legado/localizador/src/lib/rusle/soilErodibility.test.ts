import { afterEach, describe, expect, it, vi } from "vitest";
import { getKFactor, getKFactorRealOrApproximate, K_FACTOR_TABLE } from "./soilErodibility";

describe("getKFactor", () => {
  it("retorna o valor médio tabelado para uma ordem pedológica conhecida", () => {
    const entry = getKFactor("Argissolo Vermelho-Amarelo");
    expect(entry.mean).toBeCloseTo(0.0465, 4);
  });

  it("cai para um valor padrão conservador quando o tipo de solo é desconhecido", () => {
    const entry = getKFactor("Solo Inexistente XYZ");
    expect(entry.order).toBe("N/D");
    expect(entry.mean).toBeGreaterThan(0);
  });

  it("toda entrada da tabela tem min <= mean <= max", () => {
    for (const entry of Object.values(K_FACTOR_TABLE)) {
      expect(entry.min).toBeLessThanOrEqual(entry.mean);
      expect(entry.mean).toBeLessThanOrEqual(entry.max);
    }
  });
});

describe("getKFactorRealOrApproximate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("cai para a tabela aproximada quando a fonte real (SoilGrids) não tem cobertura para o ponto", async () => {
    // Simula exatamente o comportamento observado nos testes reais contra o
    // Brasil: HTTP 200 com todos os `mean` nulos (ver soilGridsClient.ts).
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ properties: { layers: [] } }),
      })
    );

    const result = await getKFactorRealOrApproximate(-23.42, -51.93, "Latossolo Vermelho Distroférrico");
    expect(result.approximated).toBe(true);
    expect(result.source).toBe("TABELA_SIBCS_APROXIMADA");
    expect(result.kFactor).toBeCloseTo(getKFactor("Latossolo Vermelho Distroférrico").mean, 4);
  });

  it("nunca lança erro quando a chamada de rede falha (fonte real é opcional)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );

    await expect(
      getKFactorRealOrApproximate(-23.42, -51.93, "Cambissolo Háplico")
    ).resolves.toMatchObject({ approximated: true });
  });

  it("usa o dado real quando a fonte externa retorna valores válidos", async () => {
    const mockLayer = (name: string, mean: number) => ({
      name,
      depths: [{ values: { mean } }],
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          properties: {
            layers: [mockLayer("clay", 300), mockLayer("sand", 400), mockLayer("silt", 300), mockLayer("soc", 20)],
          },
        }),
      })
    );

    const result = await getKFactorRealOrApproximate(54.2, -4.7, "Latossolo Vermelho Distroférrico");
    expect(result.approximated).toBe(false);
    expect(result.source).toBe("ISRIC_SOILGRIDS_V2");
    expect(result.kFactor).toBeGreaterThan(0);
  });
});
