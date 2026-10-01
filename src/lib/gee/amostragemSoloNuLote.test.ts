import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import {
  DEFINICAO_METRICA_SOLO_NU,
  calcularHashDefinicao,
  gerarChaveCacheSoloNu,
  carregarCacheFrequenciaSoloNu,
  salvarCacheFrequenciaSoloNu,
  construirExpressaoGeeSoloNuLote,
  processarRespostaGeeReduceRegions,
  medirFrequenciaSoloNuEmLoteGeeRest,
  PontoAmostragemSoloNu,
  CacheFrequenciaSoloNuArquivo,
} from "./amostragemSoloNuLote";
import { WORLDCOVER_V100_ASSET_ID, WORLDCOVER_V200_ASSET_ID } from "./copernicusGeeClient";

describe("Amostragem de Solo Nu em Lote via GEE REST e Cache Determinístico (C3)", () => {
  let pastaTemp: string;

  beforeEach(() => {
    pastaTemp = fs.mkdtempSync(path.join(os.tmpdir(), "sarel-cache-teste-"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    try {
      if (fs.existsSync(pastaTemp)) {
        fs.rmSync(pastaTemp, { recursive: true, force: true });
      }
    } catch {
      // Ignora falhas de cleanup temporário
    }
  });

  it("deve calcular o hash determinístico da definição e invalidar se a definição mudar", () => {
    const hashPadrao = calcularHashDefinicao();
    expect(hashPadrao).toHaveLength(16);
    expect(calcularHashDefinicao(DEFINICAO_METRICA_SOLO_NU)).toBe(hashPadrao);

    const hashAlternativo = calcularHashDefinicao(
      "s2_sr_harmonized_2018_2024_ndvi_lt_0.30_worldcover_v100_v200"
    );
    expect(hashAlternativo).not.toBe(hashPadrao);
  });

  it("deve gerar a chave canônica no formato ${id}@lat=${lat},lon=${lon}@def=${hash}", () => {
    const chave = gerarChaveCacheSoloNu("cand-42", -24.1234567, -53.9876543, "abc123def456");
    expect(chave).toBe("cand-42@lat=-24.12346,lon=-53.98765@def=abc123def456");
  });

  it("deve construir o grafo de expressão GEE REST com Image.reduceRegions e FeatureCollection", () => {
    const pontos: PontoAmostragemSoloNu[] = [
      { id: "cand-1", latitude: -24.71, longitude: -53.74 },
      { id: "cand-2", latitude: -24.82, longitude: -53.65 },
    ];

    const expr = construirExpressaoGeeSoloNuLote(pontos) as {
      result: string;
      values: Record<string, any>;
    };

    expect(expr.result).toBe("0");
    const no0 = expr.values["0"].functionInvocationValue;
    expect(no0.functionName).toBe("Image.reduceRegions");
    expect(no0.arguments.scale.constantValue).toBe(10);
    expect(no0.arguments.reducer.functionInvocationValue.functionName).toBe("Reducer.first");

    // Verifica a coleção de feições construída com os 2 pontos
    const noFeatures = expr.values["features_pontos"].functionInvocationValue;
    expect(noFeatures.functionName).toBe("FeatureCollection");
    const featuresList = noFeatures.arguments.features.constantValue;
    expect(featuresList).toHaveLength(2);
    expect(featuresList[0].properties.ponto_id).toBe("cand-1");
    expect(featuresList[1].properties.ponto_id).toBe("cand-2");

    // Verifica presença dos dois assets ESA WorldCover (2020 e 2021)
    const id2020 =
      expr.values["img_worldcover_2020"].functionInvocationValue.arguments.input
        .functionInvocationValue.arguments.id.constantValue;
    expect(id2020).toBe(WORLDCOVER_V100_ASSET_ID);

    const id2021 =
      expr.values["img_com_worldcover_2021"].functionInvocationValue.arguments.srcImg
        .functionInvocationValue.arguments.input.functionInvocationValue.arguments.id
        .constantValue;
    expect(id2021).toBe(WORLDCOVER_V200_ASSET_ID);
  });

  it("deve processar a resposta FeatureCollection do GEE reduceRegions", () => {
    const pontos: PontoAmostragemSoloNu[] = [
      { id: "cand-1", latitude: -24.71, longitude: -53.74 },
      { id: "cand-2", latitude: -24.82, longitude: -53.65 },
    ];

    const respostaGee = {
      result: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "0",
            properties: {
              ponto_id: "cand-1",
              solo_nu_mean: 0.185,
              solo_nu_count: 92,
              Map_2020: 40,
              Map_2021: 40,
            },
          },
          {
            type: "Feature",
            id: "1",
            properties: {
              ponto_id: "cand-2",
              solo_nu_mean: 0.082,
              solo_nu_count: 88,
              Map_2020: 30,
              Map_2021: 10, // Floresta em 2021 -> Inelegível
            },
          },
        ],
      },
    };

    const processados = processarRespostaGeeReduceRegions(respostaGee, pontos);
    expect(processados.size).toBe(2);

    const c1 = processados.get("cand-1");
    expect(c1).toBeDefined();
    expect(c1!.frequenciaSoloNu).toBe(0.185);
    expect(c1!.nObservacoes).toBe(92);
    expect(c1!.classeWorldCover2020).toBe(40);
    expect(c1!.classeWorldCover2021).toBe(40);
    expect(c1!.ehElegivelUso).toBe(true);

    const c2 = processados.get("cand-2");
    expect(c2).toBeDefined();
    expect(c2!.frequenciaSoloNu).toBe(0.082);
    expect(c2!.classeWorldCover2021).toBe(10);
    expect(c2!.ehElegivelUso).toBe(false);
  });

  it("deve persistir e recarregar o cache no disco, invalidando quando o hash for incompatível", () => {
    const caminhoCache = path.join(pastaTemp, "cache_solo_nu.json");

    const cacheOriginal: CacheFrequenciaSoloNuArquivo = {
      versao: "2.0",
      definicao: DEFINICAO_METRICA_SOLO_NU,
      hashDefinicao: calcularHashDefinicao(),
      atualizadoEm: new Date().toISOString(),
      totalItens: 1,
      itens: {
        "cand-1@lat=-24.71000,lon=-53.74000@def=123": {
          id: "cand-1",
          latitude: -24.71,
          longitude: -53.74,
          frequenciaSoloNu: 0.15,
          nObservacoes: 75,
          classeWorldCover2020: 40,
          classeWorldCover2021: 40,
          ehElegivelUso: true,
          fonte: "Teste",
          chaveCache: "cand-1@lat=-24.71000,lon=-53.74000@def=123",
        },
      },
    };

    salvarCacheFrequenciaSoloNu(cacheOriginal, caminhoCache);
    expect(fs.existsSync(caminhoCache)).toBe(true);

    const carregado = carregarCacheFrequenciaSoloNu(caminhoCache);
    expect(carregado).not.toBeNull();
    expect(carregado!.hashDefinicao).toBe(calcularHashDefinicao());
    expect(Object.keys(carregado!.itens)).toHaveLength(1);

    // Simula arquivo com definição antiga/divergente
    const cacheDivergente = {
      ...cacheOriginal,
      hashDefinicao: "hash_desatualizado_999",
    };
    fs.writeFileSync(caminhoCache, JSON.stringify(cacheDivergente), "utf8");

    const carregadoInvalido = carregarCacheFrequenciaSoloNu(caminhoCache);
    expect(carregadoInvalido).toBeNull();
  });

  it("deve executar amostragem em blocos de 100 pontos, reduzindo o número de requisições em >98%", async () => {
    const caminhoCache = path.join(pastaTemp, "cache_lote_metricas.json");

    // Cria 250 pontos sintéticos
    const pontos: PontoAmostragemSoloNu[] = [];
    for (let i = 1; i <= 250; i++) {
      pontos.push({
        id: `cand-${i}`,
        latitude: -24.5 + i * 0.001,
        longitude: -53.5 + i * 0.001,
      });
    }

    // Mock do fetch para simular resposta do GEE REST
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, opts: any) => {
      const body = JSON.parse(opts.body);
      const featuresEntrada =
        body.expression.values.features_pontos.functionInvocationValue.arguments.features
          .constantValue;

      const featuresSaida = featuresEntrada.map((f: any) => ({
        type: "Feature",
        id: f.id,
        properties: {
          ponto_id: f.properties.ponto_id,
          solo_nu_mean: 0.16,
          solo_nu_count: 85,
          Map_2020: 40,
          Map_2021: 40,
        },
      }));

      return new Response(JSON.stringify({ result: { features: featuresSaida } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const credenciais = { accessToken: "token-teste-123", projectId: "ee-projeto-teste" };

    const { resultados, metricas } = await medirFrequenciaSoloNuEmLoteGeeRest(
      pontos,
      credenciais,
      {
        tamanhoBloco: 100,
        caminhoCache,
        ignorarCache: false,
        salvarCache: true,
      }
    );

    // 250 pontos divididos em blocos de 100 -> 3 chamadas HTTP (100, 100, 50)
    expect(metricas.totalPontos).toBe(250);
    expect(metricas.requisicoesHttp).toBe(3);
    expect(metricas.requisicoesEvitadas).toBe(247);
    expect(metricas.reducaoRequisicoesPct).toBeCloseTo(98.8, 1);
    expect(resultados.size).toBe(250);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Segunda chamada para os mesmos pontos: 100% de cache hit, 0 chamadas HTTP!
    const segundaExecucao = await medirFrequenciaSoloNuEmLoteGeeRest(pontos, credenciais, {
      tamanhoBloco: 100,
      caminhoCache,
      ignorarCache: false,
    });

    expect(segundaExecucao.metricas.cacheHits).toBe(250);
    expect(segundaExecucao.metricas.cacheMisses).toBe(0);
    expect(segundaExecucao.metricas.requisicoesHttp).toBe(0);
    expect(segundaExecucao.resultados.size).toBe(250);
    // fetchMock não deve ter sido chamado novamente
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
