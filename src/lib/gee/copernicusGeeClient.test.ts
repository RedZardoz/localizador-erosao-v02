import { describe, it, expect, vi, afterEach } from "vitest";
import {
  WORLDCOVER_V100_ASSET_ID,
  WORLDCOVER_V200_ASSET_ID,
  construirExpressaoGeeSentinel2WorldCover,
  processarRespostaGeeSentinel2,
  medirSentinel2PontoGeeRest,
} from "./copernicusGeeClient";

function criarPayloadSentinel2Base(
  classe2020: number | null | undefined,
  classe2021: number | null | undefined
): Record<string, unknown> {
  return {
    B2_p15: 600,
    B4_p15: 800,
    B8_p15: 2200,
    B11_p15: 1800,
    B12_p15: 1200,
    B2_p50: 700,
    B4_p50: 1000,
    B8_p50: 2600,
    B11_p50: 2100,
    B12_p50: 1400,
    B2_p85: 850,
    B4_p85: 1300,
    B8_p85: 3100,
    B11_p85: 2500,
    B12_p85: 1700,
    B4_count: 18,
    Map_2020: classe2020,
    Map: classe2021,
    "system:time_start_p50": 1694736000000,
  };
}

describe("Cliente GEE Sentinel-2 e Concordância Multitemporal ESA WorldCover (Decisão D07 / P05)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve construir o grafo de expressão REST v1 carregando ambos os assets ESA/WorldCover/v100/2020 e ESA/WorldCover/v200/2021", () => {
    const expr = construirExpressaoGeeSentinel2WorldCover(-24.713, -53.743) as {
      result: string;
      values: Record<string, any>;
    };

    expect(expr.result).toBe("0");
    expect(expr.values["0"].functionInvocationValue.functionName).toBe("Image.reduceRegion");
    expect(expr.values["0"].functionInvocationValue.arguments.scale.constantValue).toBe(10);

    // Verifica carregamento de ESA/WorldCover/v200/2021 no nó 6
    const id2021 =
      expr.values["6"].functionInvocationValue.arguments.srcImg.functionInvocationValue.arguments.id
        .constantValue;
    expect(id2021).toBe(WORLDCOVER_V200_ASSET_ID);
    expect(id2021).toBe("ESA/WorldCover/v200/2021");

    // Verifica carregamento de ESA/WorldCover/v100/2020 renomeado para Map_2020 no nó 8
    const no8 = expr.values["8"].functionInvocationValue;
    expect(no8.functionName).toBe("Image.rename");
    expect(no8.arguments.names.constantValue).toEqual(["Map_2020"]);
    const id2020 = no8.arguments.input.functionInvocationValue.arguments.id.constantValue;
    expect(id2020).toBe(WORLDCOVER_V100_ASSET_ID);
    expect(id2020).toBe("ESA/WorldCover/v100/2020");
  });

  it("caso (30, 30) — deve ACEITAR ponto com Pastagem em 2020 (v100) e Pastagem em 2021 (v200)", () => {
    const res = processarRespostaGeeSentinel2(criarPayloadSentinel2Base(30, 30));
    expect(res).not.toBeNull();
    expect(res!.classeWorldCover2020).toBe(30);
    expect(res!.classeWorldCover2021).toBe(30);
    expect(res!.ehFlorestaOuInelegivel).toBe(false);
  });

  it("caso (40, 30) — deve ACEITAR ponto com Lavoura em 2020 (v100) e Pastagem em 2021 (v200)", () => {
    const res = processarRespostaGeeSentinel2(criarPayloadSentinel2Base(40, 30));
    expect(res).not.toBeNull();
    expect(res!.classeWorldCover2020).toBe(40);
    expect(res!.classeWorldCover2021).toBe(30);
    expect(res!.ehFlorestaOuInelegivel).toBe(false);
  });

  it("caso (30, 10) — deve REJEITAR ponto com Pastagem em 2020 (v100) e Floresta em 2021 (v200)", () => {
    const res = processarRespostaGeeSentinel2(criarPayloadSentinel2Base(30, 10));
    expect(res).not.toBeNull();
    expect(res!.classeWorldCover2020).toBe(30);
    expect(res!.classeWorldCover2021).toBe(10);
    expect(res!.ehFlorestaOuInelegivel).toBe(true);
  });

  it("caso (60, 40) — deve REJEITAR ponto com Solo Exposto (60) em 2020 (v100) e Lavoura (40) em 2021 (v200)", () => {
    const res = processarRespostaGeeSentinel2(criarPayloadSentinel2Base(60, 40));
    expect(res).not.toBeNull();
    expect(res!.classeWorldCover2020).toBe(60);
    expect(res!.classeWorldCover2021).toBe(40);
    expect(res!.ehFlorestaOuInelegivel).toBe(true);
  });

  it("deve REJEITAR ponto quando qualquer uma das duas épocas do WorldCover estiver ausente (null/undefined)", () => {
    const sem2020 = processarRespostaGeeSentinel2(criarPayloadSentinel2Base(null, 40));
    expect(sem2020).not.toBeNull();
    expect(sem2020!.classeWorldCover2020).toBeNull();
    expect(sem2020!.classeWorldCover2021).toBe(40);
    expect(sem2020!.ehFlorestaOuInelegivel).toBe(true);

    const sem2021 = processarRespostaGeeSentinel2(criarPayloadSentinel2Base(30, null));
    expect(sem2021).not.toBeNull();
    expect(sem2021!.classeWorldCover2020).toBe(30);
    expect(sem2021!.classeWorldCover2021).toBeNull();
    expect(sem2021!.ehFlorestaOuInelegivel).toBe(true);
  });

  it("deve integrar medirSentinel2PontoGeeRest via endpoint value:compute com as duas épocas do WorldCover", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ result: criarPayloadSentinel2Base(40, 30) }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const res = await medirSentinel2PontoGeeRest(-24.713, -53.743, "token-teste", "proj-teste");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res).not.toBeNull();
    expect(res!.classeWorldCover2020).toBe(40);
    expect(res!.classeWorldCover2021).toBe(30);
    expect(res!.ehFlorestaOuInelegivel).toBe(false);
  });
});
