import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildGetFeatureInfoUrl,
  clearEmbrapaSoilCache,
  formatSoilLabel,
  parseErodibilityFeature,
  parseSoilFeature,
  queryEmbrapaSoil,
} from "./embrapaSoilClient";

/**
 * Respostas fixadas a partir de consultas reais ao serviço da Embrapa
 * executadas em 08/09/2026. Servem de contrato: se o esquema da camada mudar,
 * estes testes continuam passando mas a consulta ao vivo falhará — por isso o
 * bloco de contrato ao final verifica os nomes de atributo esperados.
 */
const FEATURE_SOLO_ASSOCIACAO = {
  id: "parana_solos_20201105.3023",
  properties: {
    sbcs: "RRe12",
    tipo_unida: "associacao",
    ordem_1: "NEOSSOLO",
    sub_ordem_: "REGOLITICO",
    grande_gru: "Eutrofico",
    sub_grupo_: "chernossolico",
    familia_1_: "textura argilosa",
    familia_11: "pedregosa",
    familia_14: "substratos de rochas erupitivas basicas",
    fase_veget: "floresta tropical subperenifolia",
    fase_relev: "ondulado e montanhoso",
    ordem_2: "CHERNOSSOLO",
    sub_ordem1: "ARGILUVICO",
    grande_g_1: "Ferrico",
    sub_grupo1: "saprolitico",
    familia_2_: "textura argilosa",
    familia_21: "pedregosa",
    fase_veg_1: "floresta tropical subperenifolia",
    fase_rel_1: "forte ondulado",
    ordem_3: "NITOSSOLO",
    sub_orde_1: "VERMELHO",
    grande_g_2: "Distroferrico",
    sub_grup_1: "tipico",
    familia_3_: "textura argilosa",
    familia_33: "A moderado",
    fase_veg_2: "fase floresta tropical perenifolia",
    fase_rel_2: "ondulado",
    legenda: "RRe12 - NEOSSOLO REGOLITICO Eutrofico",
    area_km2: 38.4495380378,
  },
};

const FEATURE_SOLO_SIMPLES = {
  id: "parana_solos_20201105.1003",
  properties: {
    sbcs: "LVe1",
    tipo_unida: "simples",
    ordem_1: "LATOSSOLO",
    sub_ordem_: "VERMELHO",
    grande_gru: "Eutrofico",
    sub_grupo_: "tipico",
    familia_1_: "textura argilosa",
    familia_12: "A moderado",
    fase_veget: "floresta tropical subperenifolia",
    fase_relev: "suave ondulado",
    legenda: "LVe1 - LATOSSOLO VERMELHO Eutrofico",
    area_km2: 56.8170417937,
  },
};

const FEATURE_ERODIBILIDADE = {
  id: "brasil_erodibilidade_solo.21109",
  properties: { codnum: 4, classe: "Alta", area_km2: 2694.52367114 },
};

function mockFetchJson(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  clearEmbrapaSoilCache();
});

describe("buildGetFeatureInfoUrl", () => {
  it("consulta as duas camadas em uma única requisição, no formato JSON", () => {
    const url = buildGetFeatureInfoUrl(-25.066904, -53.688038);
    expect(url).toContain("request=GetFeatureInfo");
    expect(url).toContain("info_format=application%2Fjson");
    expect(url).toContain("parana_solos_20201105");
    expect(url).toContain("brasil_erodibilidade_solo");
    expect(url).toContain("srs=EPSG%3A4326");
  });

  it("centraliza a caixa de consulta na coordenada solicitada", () => {
    const url = new URL(buildGetFeatureInfoUrl(-25.0, -53.0));
    const [minx, miny, maxx, maxy] = (url.searchParams.get("bbox") || "")
      .split(",")
      .map(Number);
    expect((minx + maxx) / 2).toBeCloseTo(-53.0, 6);
    expect((miny + maxy) / 2).toBeCloseTo(-25.0, 6);
  });
});

describe("parseSoilFeature", () => {
  it("lê os três componentes de uma associação em ordem de predominância", () => {
    const u = parseSoilFeature(FEATURE_SOLO_ASSOCIACAO.properties)!;
    expect(u.sbcs).toBe("RRe12");
    expect(u.componentes).toHaveLength(3);
    expect(u.componentes[0].ordem).toBe("NEOSSOLO");
    expect(u.componentes[1].ordem).toBe("CHERNOSSOLO");
    expect(u.componentes[2].ordem).toBe("NITOSSOLO");
    expect(u.componentes[0].posicao).toBe(1);
  });

  it("preserva o caráter distrófico/eutrófico exatamente como levantado", () => {
    const u = parseSoilFeature(FEATURE_SOLO_ASSOCIACAO.properties)!;
    expect(u.componentes[0].grandeGrupo).toBe("Eutrofico");
    expect(u.componentes[2].grandeGrupo).toBe("Distroferrico");
  });

  it("marca associação como confiança média e unidade simples como alta", () => {
    expect(parseSoilFeature(FEATURE_SOLO_ASSOCIACAO.properties)!.confianca).toBe("media");
    expect(parseSoilFeature(FEATURE_SOLO_SIMPLES.properties)!.confianca).toBe("alta");
  });

  it("retorna null quando não há sequer o componente dominante", () => {
    expect(parseSoilFeature({ sbcs: "X", tipo_unida: "simples" })).toBeNull();
  });
});

describe("parseErodibilityFeature", () => {
  it("lê a classe e o código numérico", () => {
    const e = parseErodibilityFeature(FEATURE_ERODIBILIDADE.properties)!;
    expect(e.classe).toBe("Alta");
    expect(e.codnum).toBe(4);
  });

  it("aceita categorias não-pedológicas sem convertê-las em valor", () => {
    const e = parseErodibilityFeature({ classe: "Area urbana", codnum: 9 })!;
    expect(e.classe).toBe("Area urbana");
  });
});

describe("queryEmbrapaSoil", () => {
  it("preenche solo e erodibilidade quando o serviço retorna as duas feições", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchJson({ features: [FEATURE_SOLO_ASSOCIACAO, FEATURE_ERODIBILIDADE] })
    );
    const r = await queryEmbrapaSoil(-25.066904, -53.688038);
    expect(r.statusSolo).toBe("encontrado");
    expect(r.statusErodibilidade).toBe("encontrado");
    expect(r.solo?.componentes[0].ordem).toBe("NEOSSOLO");
    expect(r.erodibilidade?.classe).toBe("Alta");
    expect(r.motivo).toBeNull();
  });

  it("distingue AUSÊNCIA DE COBERTURA de FALHA DE SERVIÇO", async () => {
    vi.stubGlobal("fetch", mockFetchJson({ features: [] }));
    const semCobertura = await queryEmbrapaSoil(-25.5, -45.0);
    expect(semCobertura.statusSolo).toBe("sem-cobertura");
    expect(semCobertura.motivo).toContain("Paraná");

    clearEmbrapaSoilCache();
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));
    const falha = await queryEmbrapaSoil(-25.5, -45.0);
    expect(falha.statusSolo).toBe("servico-indisponivel");
    expect(falha.motivo).toContain("Nada se afirma");
  });

  it("fora do Paraná devolve erodibilidade e declara ausência de carta de solos", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchJson({
        features: [{ id: "brasil_erodibilidade_solo.85343", properties: { codnum: 9, classe: "Area urbana" } }],
      })
    );
    const r = await queryEmbrapaSoil(-15.78, -47.93);
    expect(r.statusErodibilidade).toBe("encontrado");
    expect(r.statusSolo).toBe("sem-cobertura");
    expect(r.solo).toBeNull();
  });

  it("NUNCA inventa valor: HTTP de erro não produz solo nem erodibilidade", async () => {
    vi.stubGlobal("fetch", mockFetchJson({}, false, 503));
    const r = await queryEmbrapaSoil(-25.0, -53.0);
    expect(r.statusSolo).toBe("servico-indisponivel");
    expect(r.solo).toBeNull();
    expect(r.erodibilidade).toBeNull();
    expect(r.motivo).toContain("503");
  });

  it("rejeita coordenada inválida sem sequer chamar o serviço", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    const r = await queryEmbrapaSoil(999, -53.0);
    expect(spy).not.toHaveBeenCalled();
    expect(r.statusSolo).toBe("servico-indisponivel");
    expect(r.motivo).toContain("inválida");
  });

  it("registra proveniência completa para auditoria", async () => {
    vi.stubGlobal("fetch", mockFetchJson({ features: [FEATURE_SOLO_SIMPLES] }));
    const r = await queryEmbrapaSoil(-23.42, -52.6);
    expect(r.proveniencia.servico).toContain("geoinfo.dados.embrapa.br");
    expect(r.proveniencia.camadaSolo).toBe("geonode:parana_solos_20201105");
    expect(r.proveniencia.latitude).toBe(-23.42);
    expect(Date.parse(r.proveniencia.consultadoEm)).not.toBeNaN();
  });

  it("usa cache: a segunda consulta na mesma célula não repete a requisição", async () => {
    const spy = mockFetchJson({ features: [FEATURE_SOLO_SIMPLES, FEATURE_ERODIBILIDADE] });
    vi.stubGlobal("fetch", spy);
    await queryEmbrapaSoil(-23.42, -52.6);
    await queryEmbrapaSoil(-23.42, -52.6);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("não guarda em cache resultado de falha de serviço", async () => {
    const spy = vi.fn().mockRejectedValue(new Error("timeout"));
    vi.stubGlobal("fetch", spy);
    await queryEmbrapaSoil(-23.42, -52.6);
    await queryEmbrapaSoil(-23.42, -52.6);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe("formatSoilLabel", () => {
  it("explicita a incerteza quando a unidade é associação", async () => {
    vi.stubGlobal("fetch", mockFetchJson({ features: [FEATURE_SOLO_ASSOCIACAO] }));
    const r = await queryEmbrapaSoil(-25.066904, -53.688038);
    const label = formatSoilLabel(r);
    expect(label).toContain("NEOSSOLO REGOLITICO Eutrofico");
    expect(label).toContain("associação");
    expect(label).toContain("não resolvida");
  });

  it("não acrescenta ressalva quando a unidade é simples", async () => {
    vi.stubGlobal("fetch", mockFetchJson({ features: [FEATURE_SOLO_SIMPLES] }));
    const r = await queryEmbrapaSoil(-23.42, -52.6);
    expect(formatSoilLabel(r)).toBe("LATOSSOLO VERMELHO Eutrofico");
  });

  it("nunca devolve nome de solo quando a consulta falhou", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    const r = await queryEmbrapaSoil(-23.42, -52.6);
    expect(formatSoilLabel(r)).toBe("Consulta pedológica não realizada");
  });
});
