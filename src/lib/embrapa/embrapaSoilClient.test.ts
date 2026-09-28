import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildGetFeatureInfoUrl,
  classificarNivelEstratoKComponente,
  clearEmbrapaSoilCache,
  ehCategoriaNaoSolo,
  extrairOrdemSibcsDeLegenda,
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
  it("consulta as três camadas em uma única requisição JSON com feature_count=10 (T1.4 / T2.1)", () => {
    const url = buildGetFeatureInfoUrl(-25.066904, -53.688038);
    expect(url).toContain("request=GetFeatureInfo");
    expect(url).toContain("info_format=application%2Fjson");
    expect(url).toContain("parana_solos_20201105");
    expect(url).toContain("brasil_erodibilidade_solo");
    expect(url).toContain("bra_erodibilidade_2024_sirgas2000");
    expect(url).toContain("feature_count=10");
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

describe("kAmbiguoAssociacao, erod_c1..erod_c4 (camada 2024) e fora-do-dominio (Decisões D08 e D09, T2-T4)", () => {
  it("testa a heurística de fallback taxonômico (sem erod2024Props): marca kAmbiguoAssociacao === true para associação LATOSSOLO + NEOSSOLO LITÓLICO e na feição RRe12", () => {
    const assocLvNeossolo = parseSoilFeature({
      sbcs: "LVef3",
      tipo_unida: "associacao",
      ordem_1: "LATOSSOLO",
      sub_ordem_: "VERMELHO",
      grande_gru: "Eutroferrico",
      sub_grupo_: "tipico",
      familia_1_: "textura muito argilosa",
      ordem_2: "NEOSSOLO",
      sub_ordem1: "LITOLICO",
      grande_g_1: "Eutrofico",
      sub_grupo1: "fragmentario",
      familia_2_: "textura media",
      legenda: "LVef3 - Associação Latossolo Vermelho + Neossolo Litólico",
    });
    expect(assocLvNeossolo).not.toBeNull();
    expect(assocLvNeossolo!.kAmbiguoAssociacao).toBe(true);
    expect(assocLvNeossolo!.correspondenciaCartas2024).toBe("sem-camada-2024");
    expect(assocLvNeossolo!.provenienciaK).toBe("heuristica-fallback-nao-conferida");

    const assocRRe12 = parseSoilFeature(FEATURE_SOLO_ASSOCIACAO.properties);
    expect(assocRRe12).not.toBeNull();
    expect(assocRRe12!.kAmbiguoAssociacao).toBe(true);
    expect(assocRRe12!.provenienciaK).toBe("heuristica-fallback-nao-conferida");
  });

  it("testa a heurística de fallback taxonômico (sem erod2024Props): marca kAmbiguoAssociacao === false para associação LATOSSOLO + NITOSSOLO (ambos K <= 0,0285)", () => {
    const assocMesmoNivel = parseSoilFeature({
      sbcs: "LVdf1",
      tipo_unida: "associacao",
      ordem_1: "LATOSSOLO",
      sub_ordem_: "VERMELHO",
      grande_gru: "Distroferrico",
      sub_grupo_: "tipico",
      familia_1_: "textura muito argilosa",
      ordem_2: "NITOSSOLO",
      sub_ordem1: "VERMELHO",
      grande_g_1: "Distroferrico",
      sub_grupo1: "tipico",
      familia_2_: "textura muito argilosa",
      legenda: "LVdf1 - Associação Latossolo Vermelho + Nitossolo Vermelho",
    });
    expect(assocMesmoNivel).not.toBeNull();
    expect(assocMesmoNivel!.confianca).toBe("media");
    expect(assocMesmoNivel!.kAmbiguoAssociacao).toBe(false);
    expect(assocMesmoNivel!.provenienciaK).toBe("heuristica-fallback-nao-conferida");
  });

  it("usa erod_c1..erod_c4 tabelado quando a sequência de ordens coincide entre parana_solos_20201105 e bra_erodibilidade_2024_sirgas2000 (T2.1 / T4.1)", () => {
    const erod2024Compativel = {
      cod_um2: "SG22NVef2NV",
      legenda_c1: "NITOSSOLO VERMELHO Eutroferrico tipico",
      erod_c1: "Baixa",
      erod_um: "Baixa",
    };
    const u = parseSoilFeature(
      {
        sbcs: "NVef2",
        tipo_unida: "simples",
        ordem_1: "NITOSSOLO",
        sub_ordem_: "VERMELHO",
        grande_gru: "Eutroferrico",
        sub_grupo_: "tipico",
        familia_1_: "textura argilosa",
        legenda: "NVef2 - NITOSSOLO VERMELHO Eutroferrico",
      },
      erod2024Compativel
    );
    expect(u).not.toBeNull();
    expect(u!.correspondenciaCartas2024).toBe("correspondente");
    expect(u!.divergenciaEntreCartas2024).toBe(false);
    expect(u!.provenienciaK).toBe("tabelado");
    expect(u!.chaveProvenienciaK).toBe("SG22NVef2NV:erod_c1=Baixa");
    expect(u!.kAmbiguoAssociacao).toBe(false);
  });

  it("não pareia por posição quando parana_solos_20201105 e bra_erodibilidade_2024_sirgas2000 divergem em sequência/número de componentes (T2.3)", () => {
    // Caso real R02_Cascavel_Rural_Oeste_RRe12 (-25.066904, -53.688038):
    // parana_solos: ['NEOSSOLO', 'CHERNOSSOLO', 'NITOSSOLO'] (3 componentes)
    // bra_erodibilidade_2024: ['NITOSSOLO', 'NEOSSOLO', 'NEOSSOLO', 'CHERNOSSOLO'] (4 componentes)
    const erod2024Divergente = {
      cod_um2: "SG22NVef2NV+RRe+RLd+MTe",
      legenda_c1: "NITOSSOLO VERMELHO Eutroferrico",
      legenda_c2: "NEOSSOLO REGOLITICO Eutrofico",
      legenda_c3: "NEOSSOLO LITOLICO Distrofico",
      legenda_c4: "CHERNOSSOLO ARGILUVICO Ferrico",
      erod_c1: "Baixa",
      erod_c2: "Alta",
      erod_c3: "Muito alta",
      erod_c4: "Alta",
      erod_um: "Baixa",
    };
    const u = parseSoilFeature(FEATURE_SOLO_ASSOCIACAO.properties, erod2024Divergente);
    expect(u).not.toBeNull();
    expect(u!.correspondenciaCartas2024).toBe("divergente");
    expect(u!.divergenciaEntreCartas2024).toBe(true);
    expect(u!.provenienciaK).toBe("divergencia-entre-cartas");
    expect(u!.kAmbiguoAssociacao).toBe(true);
    // Componente 1 de parana_solos (NEOSSOLO) NÃO recebeu erod_c1 ('Baixa', que era do NITOSSOLO em 2024)
    expect(u!.componentes[0].erodibilidadeComponente2024).toBeNull();
  });

  it("classificarNivelEstratoKComponente retorna Proveniencia<1|2> indisponivel('fora-do-dominio') para Area urbana e Corpos dagua (T3.1 / T3.2)", () => {
    const provUrbana = classificarNivelEstratoKComponente(
      {
        posicao: 1,
        ordem: "Area urbana",
        subOrdem: "",
        grandeGrupo: "",
        subGrupo: "",
        familia: [],
        faseVegetacao: "",
        faseRelevo: "",
      },
      "Area urbana"
    );
    expect(provUrbana.estado).toBe("indisponivel");
    if (provUrbana.estado === "indisponivel") {
      expect(provUrbana.causa).toBe("fora-do-dominio");
    }

    const provAgua = classificarNivelEstratoKComponente(
      {
        posicao: 1,
        ordem: "Corpos dagua",
        subOrdem: "",
        grandeGrupo: "",
        subGrupo: "",
        familia: [],
        faseVegetacao: "",
        faseRelevo: "",
      },
      "Corpos dagua"
    );
    expect(provAgua.estado).toBe("indisponivel");
    if (provAgua.estado === "indisponivel") {
      expect(provAgua.causa).toBe("fora-do-dominio");
    }
    expect(ehCategoriaNaoSolo("Corpo d'água")).toBe(true);
    expect(ehCategoriaNaoSolo("Área urbana")).toBe(true);
    expect(extrairOrdemSibcsDeLegenda("NITOSSOLO VERMELHO Eutroferrico")).toBe("NITOSSOLO");
  });

  it("queryEmbrapaSoil sinaliza foraDoDominioSolo === true quando qualquer camada retorna Area urbana ou Corpos dagua (T3.2 / T3.3)", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchJson({
        features: [
          FEATURE_SOLO_SIMPLES,
          { id: "brasil_erodibilidade_solo.1", properties: { codnum: 8, classe: "Corpos dagua" } },
          { id: "bra_erodibilidade_2024_sirgas2000.1", properties: { cod_um2: "SG21Co", erod_um: "Corpo d'água" } },
        ],
      })
    );
    const r = await queryEmbrapaSoil(-24.8531, -54.3622);
    expect(r.foraDoDominioSolo).toBe(true);
    expect(r.solo?.foraDoDominioSolo).toBe(true);
  });
});

