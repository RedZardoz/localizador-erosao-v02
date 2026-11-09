import { describe, it, expect, vi, afterEach } from "vitest";
import {
  WORLDCOVER_V100_ASSET_ID,
  WORLDCOVER_V200_ASSET_ID,
  construirExpressaoGeeSentinel2WorldCover,
  construirExpressaoGeeSerieSentinel2,
  processarRespostaGeeSentinel2,
  processarObservacoesSerie,
  medirSentinel2PontoGeeRest,
  medirSerieSentinel2PontoGeeRest,
  medirSerieSentinel2EmLoteGeeRest,
  LIMIAR_MINIMO_OBSERVACOES_D11,
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

  it("deve construir a expressão com a janela única de D05 e máscara de pixel SCL classes 4 e 5 (DEC-16 / C10)", () => {
    const expr = construirExpressaoGeeSentinel2WorldCover(-24.713, -53.743) as {
      result: string;
      values: Record<string, any>;
    };

    // 1. Janela temporal D05 (2016-01-01 a 2026-06-30)
    const filtroData =
      expr.values["3"].functionInvocationValue.arguments.collection.functionInvocationValue.arguments
        .collection.functionInvocationValue.arguments.filter.functionInvocationValue;
    expect(filtroData.functionName).toBe("Filter.dateRangeContains");
    const dateRange = filtroData.arguments.leftValue.functionInvocationValue.arguments;
    expect(dateRange.start.constantValue).toBe("2016-01-01");
    expect(dateRange.end.constantValue).toBe("2026-06-30");

    // 2. Máscara SCL mantendo classes 4 e 5 via Image.updateMask no nó 5
    const no5 = expr.values["5"].functionInvocationValue;
    expect(no5.functionName).toBe("Image.updateMask");
    expect(no5.arguments.image.functionInvocationValue.functionName).toBe("Image.select");
    expect(no5.arguments.image.functionInvocationValue.arguments.bandSelectors.constantValue).toEqual([
      "B2",
      "B3",
      "B4",
      "B8",
      "B11",
      "B12",
    ]);

    const maskOr = no5.arguments.mask.functionInvocationValue;
    expect(maskOr.functionName).toBe("Image.or");
    expect(maskOr.arguments.image1.functionInvocationValue.functionName).toBe("Image.eq");
    expect(
      maskOr.arguments.image1.functionInvocationValue.arguments.image2.functionInvocationValue.arguments.value
        .constantValue
    ).toBe(4);
    expect(maskOr.arguments.image2.functionInvocationValue.functionName).toBe("Image.eq");
    expect(
      maskOr.arguments.image2.functionInvocationValue.arguments.image2.functionInvocationValue.arguments.value
        .constantValue
    ).toBe(5);
  });

  it("resposta sem contagem de observações deve resultar em insuficienteD11 e frequenciaSoloNu null (N17 / A9)", () => {
    const payloadSemContagem = criarPayloadSentinel2Base(40, 40);
    delete (payloadSemContagem as any).B4_count;
    delete (payloadSemContagem as any).B2_count;
    delete (payloadSemContagem as any).nObservacoesValidas;

    const res = processarRespostaGeeSentinel2(payloadSemContagem);
    expect(res).not.toBeNull();
    expect(res!.insuficienteD11).toBe(true);
    expect(res!.frequenciaSoloNu).toBeNull();
  });

  it("deve construir a expressão de série temporal com ImageCollection.getRegion e sem .unmask (Regra 7, D05)", () => {
    const expr = construirExpressaoGeeSerieSentinel2(-24.85, -54.05) as {
      result: string;
      values: Record<string, any>;
    };

    expect(expr.result).toBe("0");
    expect(expr.values["0"].functionInvocationValue.functionName).toBe("ImageCollection.getRegion");
    expect(expr.values["0"].functionInvocationValue.arguments.scale.constantValue).toBe(10);
    expect(expr.values["2"].functionInvocationValue.arguments.coordinates.constantValue).toEqual([-54.05, -24.85]);

    // Verifica que NENHUM nó na árvore usa unmask (Regra 7: sem .unmask() com constante)
    const rawJson = JSON.stringify(expr);
    expect(rawJson).not.toContain("unmask");
    expect(rawJson).not.toContain("Image.unmask");
  });

  it("processarObservacoesSerie deve converter tabela getRegion preservando datas reais e lacunas como null (§11, Regra 3)", () => {
    const tabelaGetRegion = [
      ["id", "longitude", "latitude", "time", "B2", "B4", "B8", "B11", "B12"],
      ["COPERNICUS/S2_SR_HARMONIZED/20210310T133222", -54.05, -24.85, 1615383142000, 350, 500, 2500, 1500, 900],
      ["COPERNICUS/S2_SR_HARMONIZED/20210315T133222", -54.05, -24.85, 1615815142000, null, null, null, null, null], // cena com nuvem/máscara
      ["COPERNICUS/S2_SR_HARMONIZED/20210320T133222", -54.05, -24.85, 1616247142000, 400, 600, 3000, 1600, 1000],
    ];

    const resultado = processarObservacoesSerie(tabelaGetRegion);
    expect(resultado.observacoes).toHaveLength(3);
    expect(resultado.observacoes[0].data).toBe("2021-03-10");
    expect(resultado.observacoes[0].ndvi).toBeCloseTo((0.25 - 0.05) / (0.25 + 0.05), 3);
    expect(resultado.observacoes[0].bsi).not.toBeNull();

    // Descontinuidade real preservada (§11)
    expect(resultado.observacoes[1].data).toBe("2021-03-15");
    expect(resultado.observacoes[1].ndvi).toBeNull();
    expect(resultado.observacoes[1].bsi).toBeNull();

    expect(resultado.observacoes[2].data).toBe("2021-03-20");
    expect(resultado.observacoes[2].ndvi).not.toBeNull();

    // Contagem por banda e D11
    expect(resultado.nObservacoesValidasPorBanda.B4).toBe(2);
    expect(resultado.nObservacoesValidasPorBanda.B8).toBe(2);
    expect(resultado.nObservacoesValidas).toBe(2);
    expect(resultado.insuficienteD11).toBe(true); // 2 < 6
  });

  it("processarObservacoesSerie atinge suficiência amostral quando observações válidas >= LIMIAR_MINIMO_OBSERVACOES_D11 (6)", () => {
    const tabelaGetRegion = [
      ["id", "longitude", "latitude", "time", "B2", "B4", "B8", "B11", "B12"],
      ["20200101T100000", -54.05, -24.85, 1577880000000, 300, 500, 2000, 1200, 800],
      ["20200201T100000", -54.05, -24.85, 1580558400000, 300, 500, 2000, 1200, 800],
      ["20200301T100000", -54.05, -24.85, 1583064000000, 300, 500, 2000, 1200, 800],
      ["20200401T100000", -54.05, -24.85, 1585742400000, 300, 500, 2000, 1200, 800],
      ["20200501T100000", -54.05, -24.85, 1588334400000, 300, 500, 2000, 1200, 800],
      ["20200601T100000", -54.05, -24.85, 1591012800000, 300, 500, 2000, 1200, 800],
    ];

    const resultado = processarObservacoesSerie(tabelaGetRegion);
    expect(resultado.nObservacoesValidas).toBe(6);
    expect(resultado.insuficienteD11).toBe(false);
  });
});

