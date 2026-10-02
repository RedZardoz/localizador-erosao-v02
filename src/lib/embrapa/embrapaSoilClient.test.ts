import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  avaliarAmbiguidadeKAssociacaoD08,
  buildGetFeatureInfoUrl,
  buildGetFeaturePointInPolygonUrl,
  classificarNivelKDaCarta2024,
  clearEmbrapaSoilCache,
  derivarNivelKDaCarta2024,
  diagnosticarFronteiraPedologicaBbox,
  ehCategoriaNaoSolo,
  ErroSanidadeEixosWfsEmbrapa,
  extrairOrdemSibcsDeLegenda,
  formatSoilLabel,
  LIMIAR_MAXIMO_FRACAO_ZERO_FEICOES_LOTE,
  parseErodibility2024Feature,
  parseErodibilityFeature,
  parseSoilFeature,
  queryEmbrapaSoil,
  verificarSanidadeZeroFeicoesLoteEmbrapa,
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

describe("W1 e W2: kAmbiguoAssociacao na fonte em dois ramos (D08 emendada) e nível K̂ da carta de 2024 (D12 emendada)", () => {
  it("W1 Ramo (a) — dois ou mais componentes em erod_c1..erod_c4 que ATRAVESSAM a fronteira de D09: devolve kAmbiguoAssociacao === true com proveniência tabelado (mesmo se a sequência de ordens divergir entre cartas)", () => {
    // Caso real R02 / RRe12 sobre SG22NVef2NV+RRe+RLd+MTe (4 componentes: Baixa [1], Alta [2], Muito alta [2], Alta [2])
    const erod2024QuatroComponentesAtravessa = {
      ogc_fid: 103981,
      cod_um: "SG22NVef3NV",
      cod_um2: "SG22NVef3",
      legenda_c1: "NITOSSOLO VERMELHO Eutroferrico",
      legenda_c2: "NEOSSOLO REGOLITICO Eutrofico",
      legenda_c3: "NEOSSOLO LITOLICO Distrofico",
      legenda_c4: "CHERNOSSOLO ARGILUVICO Ferrico",
      erod_c1: "Baixa",
      erod_c2: "Alta",
      erod_c3: "Muito alta",
      erod_c4: "Alta",
      erod_um: "Baixa",
      k_solos: 0.012,
    };
    const u = parseSoilFeature(FEATURE_SOLO_ASSOCIACAO.properties, erod2024QuatroComponentesAtravessa);
    expect(u).not.toBeNull();
    expect(u!.ramoAmbiguidadeD08).toBe("ramo-a-tabelado-multiplos-componentes");
    expect(u!.kAmbiguoAssociacao).toBe(true);
    expect(u!.kAmbiguoAssociacaoProveniencia.estado).toBe("tabelado");
    if (u!.kAmbiguoAssociacaoProveniencia.estado === "tabelado") {
      expect(u!.kAmbiguoAssociacaoProveniencia.valor).toBe(true);
      expect(u!.kAmbiguoAssociacaoProveniencia.decisao).toBe("D08");
      expect(u!.kAmbiguoAssociacaoProveniencia.chave).toContain("SG22NVef3NV");
    }
    expect(u!.provenienciaK).toBe("tabelado");
  });

  it("W1 Ramo (a) — dois ou mais componentes em erod_c1..erod_c4 que caem TODOS DO MESMO LADO da fronteira de D09: devolve kAmbiguoAssociacao === false com proveniência tabelado", () => {
    // Dois componentes na carta de 2024: Muito baixa (nível 1) e Baixa (nível 1) -> mesmo lado da fronteira de D09
    const erod2024DoisComponentesMesmoLado = {
      ogc_fid: 104112,
      cod_um: "SG21LVef2LV",
      cod_um2: "SG21LVef2",
      legenda_c1: "LATOSSOLO VERMELHO Eutroferrico",
      legenda_c2: "NITOSSOLO VERMELHO Eutroferrico",
      erod_c1: "Muito baixa",
      erod_c2: "Baixa",
      erod_um: "Muito baixa",
      k_solos: 0.0084,
    };
    const u = parseSoilFeature(
      {
        sbcs: "LVef2",
        tipo_unida: "associacao",
        ordem_1: "LATOSSOLO",
        sub_ordem_: "VERMELHO",
        grande_gru: "Eutroferrico",
        sub_grupo_: "tipico",
        familia_1_: "textura muito argilosa",
        ordem_2: "NITOSSOLO",
        sub_ordem1: "VERMELHO",
        grande_g_1: "Eutroferrico",
        sub_grupo1: "tipico",
        familia_2_: "textura argilosa",
        legenda: "LVef2 - Associação Latossolo Vermelho + Nitossolo Vermelho",
      },
      erod2024DoisComponentesMesmoLado
    );
    expect(u).not.toBeNull();
    expect(u!.ramoAmbiguidadeD08).toBe("ramo-a-tabelado-multiplos-componentes");
    expect(u!.kAmbiguoAssociacao).toBe(false);
    expect(u!.kAmbiguoAssociacaoProveniencia.estado).toBe("tabelado");
    if (u!.kAmbiguoAssociacaoProveniencia.estado === "tabelado") {
      expect(u!.kAmbiguoAssociacaoProveniencia.valor).toBe(false);
      expect(u!.kAmbiguoAssociacaoProveniencia.decisao).toBe("D08");
    }
    expect(u!.provenienciaK).toBe("tabelado");
  });

  it("W1 Ramo (b) [ASSERÇÃO OBRIGATÓRIA DE PROTEÇÃO DE D08] — um único componente na carta de 2024 com tipo_unida = 'associacao' na carta estadual: devolve estritamente indisponivel (causa 'insuficiente') e JAMAIS false", () => {
    // Metade das associações da BP3 (16/32 na campanha dirigida): a carta nacional 1:250.000 generaliza
    // a associação para unidade simples (apenas erod_c1 preenchido), enquanto parana_solos_20201105 declara tipo_unida='associacao'.
    const erod2024Generalizada1Componente = {
      ogc_fid: 104677,
      cod_um: "SG21LVdf1LV",
      cod_um2: "SG21LVdf1",
      legenda_c1: "LATOSSOLO VERMELHO Distroferrico",
      erod_c1: "Muito baixa",
      erod_c2: "",
      erod_c3: "",
      erod_c4: "",
      erod_um: "Muito baixa",
      k_solos: 0.002,
    };

    const u = parseSoilFeature(
      {
        sbcs: "NVef4",
        tipo_unida: "associacao",
        ordem_1: "NITOSSOLO",
        sub_ordem_: "VERMELHO",
        grande_gru: "Eutroferrico",
        sub_grupo_: "tipico",
        familia_1_: "textura muito argilosa",
        ordem_2: "LATOSSOLO",
        sub_ordem1: "VERMELHO",
        grande_g_1: "Eutroferrico",
        sub_grupo1: "tipico",
        familia_2_: "textura muito argilosa",
        legenda: "NVef4 - Associação Nitossolo Vermelho + Latossolo Vermelho",
      },
      erod2024Generalizada1Componente
    );

    expect(u).not.toBeNull();
    // PROIBIÇÃO CRÍTICA DE W1: é proibido devolver false no ramo (b)
    expect(u!.kAmbiguoAssociacao).not.toBe(false);
    expect(u!.kAmbiguoAssociacao).toBe("indisponivel");
    expect(u!.ramoAmbiguidadeD08).toBe("ramo-b-indisponivel-generalizacao-1-componente");
    expect(u!.kAmbiguoAssociacaoProveniencia.estado).toBe("indisponivel");
    if (u!.kAmbiguoAssociacaoProveniencia.estado === "indisponivel") {
      expect(u!.kAmbiguoAssociacaoProveniencia.causa).toBe("insuficiente");
      expect(u!.kAmbiguoAssociacaoProveniencia.motivo).toContain("Ramo (b) de D08");
    }
    expect(u!.provenienciaK).toBe("indisponivel-ramo-b-generalizacao");
  });

  it("Unidade simples na carta estadual (tipo_unida = 'simples') com 1 componente válido na carta de 2024: devolve kAmbiguoAssociacao === false tabelado", () => {
    const erod2024Simples = {
      ogc_fid: 102154,
      cod_um: "SG22NVef2NV",
      cod_um2: "SG22NVef2",
      legenda_c1: "NITOSSOLO VERMELHO Eutroferrico tipico",
      erod_c1: "Baixa",
      erod_um: "Baixa",
      k_solos: 0.012,
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
      erod2024Simples
    );
    expect(u).not.toBeNull();
    expect(u!.ramoAmbiguidadeD08).toBe("unidade-simples-1-componente");
    expect(u!.kAmbiguoAssociacao).toBe(false);
    expect(u!.kAmbiguoAssociacaoProveniencia.estado).toBe("tabelado");
    if (u!.kAmbiguoAssociacaoProveniencia.estado === "tabelado") {
      expect(u!.kAmbiguoAssociacaoProveniencia.valor).toBe(false);
    }
  });

  it("W2: derivarNivelKDaCarta2024 deriva nivelK (1 | 2) de erod_um / k_solos, registra cod_um, cod_um2 e ogc_fid, e retira categorias não-pedológicas do domínio", () => {
    const resNivel1 = derivarNivelKDaCarta2024({
      ogc_fid: 103981,
      cod_um: "SG22NVef3NV",
      cod_um2: "SG22NVef3",
      erod_um: "Baixa",
      k_solos: 0.012,
      legenda: "Nitossolo Vermelho",
    });
    expect(resNivel1.nivelK).toBe(1);
    expect(resNivel1.provenienciaNivelK.estado).toBe("tabelado");
    expect(resNivel1.unidadeDeterminante2024).toEqual({
      codUm: "SG22NVef3NV",
      codUm2: "SG22NVef3",
      ogcFid: 103981,
      erodUm: "Baixa",
      kSolos: 0.012,
      kSolosBruto: 0.012,
      nivelK: 1,
    });

    const resNivel2 = derivarNivelKDaCarta2024({
      ogc_fid: 104901,
      cod_um: "SG21RLm4RL",
      cod_um2: "SG21RLm4",
      erod_um: "Alta",
      k_solos: 0.0315,
      legenda: "Neossolo Litolico",
    });
    expect(resNivel2.nivelK).toBe(2);
    expect(resNivel2.provenienciaNivelK.estado).toBe("tabelado");
    expect(resNivel2.unidadeDeterminante2024?.codUm2).toBe("SG21RLm4");
    expect(resNivel2.unidadeDeterminante2024?.ogcFid).toBe(104901);

    const resUrbana = derivarNivelKDaCarta2024({
      ogc_fid: 155805,
      cod_um: "SG21Ár",
      cod_um2: "SG21Ár",
      erod_um: "Área urbana",
      k_solos: 0,
      legenda: "Área urbana",
    });
    expect(resUrbana.nivelK).toBeNull();
    expect(resUrbana.provenienciaNivelK.estado).toBe("indisponivel");
    if (resUrbana.provenienciaNivelK.estado === "indisponivel") {
      expect(resUrbana.provenienciaNivelK.causa).toBe("fora-do-dominio");
    }

    const resAgua = classificarNivelKDaCarta2024("Corpos d'água");
    expect(resAgua.estado).toBe("indisponivel");
    if (resAgua.estado === "indisponivel") {
      expect(resAgua.causa).toBe("fora-do-dominio");
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

describe("V1, V2 e V3 — Ponto-em-polígono WFS 1.1.0, marcador de fronteira por bbox e trava da ordem dos eixos", () => {
  afterEach(() => {
    clearEmbrapaSoilCache();
    vi.unstubAllGlobals();
  });

  it("V3.2.2 (trava da ordem dos eixos): buildGetFeaturePointInPolygonUrl contém POINT(<lat> <lon>) nessa exata ordem nas 3 cláusulas e jamais POINT(<lon> <lat>)", () => {
    const lat = -24.88;
    const lng = -54.26;
    const url = buildGetFeaturePointInPolygonUrl(lat, lng);
    const parsed = new URL(url);

    expect(parsed.searchParams.get("service")).toBe("WFS");
    expect(parsed.searchParams.get("version")).toBe("1.1.0");
    expect(parsed.searchParams.get("request")).toBe("GetFeature");
    expect(parsed.searchParams.get("typeName")).toBe(
      "geonode:parana_solos_20201105,geonode:bra_erodibilidade_2024_sirgas2000,geonode:brasil_erodibilidade_solo"
    );

    const cql = parsed.searchParams.get("CQL_FILTER") ?? "";
    const esperado = `INTERSECTS(geometry, POINT(${lat} ${lng}))`;
    expect(cql).toBe(`${esperado};${esperado};${esperado}`);
    expect(cql).toContain(`POINT(${lat} ${lng})`);
    expect(cql).not.toContain(`POINT(${lng} ${lat})`);
  });

  it("V3.2.1 (teste de fixture): carrega getfeature_pip_3camadas_r13_bp3.json (-24.8800, -54.2600) com exatamente 3 feições (uma por camada: sbcs='NVef2', cod_um2='SG21NVef1', classe='Baixa')", async () => {
    const fixturePath = path.resolve(
      process.cwd(),
      "docs/verificacoes/fontes/wfs_erodibilidade/getfeature_pip_3camadas_r13_bp3.json"
    );
    const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
    expect(fixture.features).toHaveLength(3);

    vi.stubGlobal("fetch", mockFetchJson(fixture));

    const r = await queryEmbrapaSoil(-24.88, -54.26);
    expect(r.statusSolo).toBe("encontrado");
    expect(r.foraDoDominioSolo).toBe(false);
    expect(r.fronteiraCompartilhadaExata).toBe(false);
    expect(r.totalFeicoesSoloRetornadas).toBe(1);
    expect(r.totalFeicoesErod2024Retornadas).toBe(1);
    expect(r.totalFeicoesErodBrRetornadas).toBe(1);
    expect(r.solo?.sbcs).toBe("NVef2");
    expect(r.erodibilidade2024?.codUm2).toBe("SG21NVef1");
    expect(r.erodibilidade2024?.codUm).toBe("SG21NVef1NV");
    expect(r.erodibilidade2024?.kSolos).toBe(0.012);
    expect(r.erodibilidade?.classe).toBe("Baixa");
    expect(r.solo?.correspondenciaCartas2024).toBe("correspondente");

    // V2.1: Quando não computado por bbox, pontoEmFronteiraPedologica é indisponivel("nao-calculado"), NUNCA false
    expect(r.pontoEmFronteiraPedologica).not.toBe(false);
    expect(r.pontoEmFronteiraPedologica.estado).toBe("indisponivel");
    if (r.pontoEmFronteiraPedologica.estado === "indisponivel") {
      expect(r.pontoEmFronteiraPedologica.causa).toBe("nao-calculado");
    }
  });

  it("V1.3 (fronteira compartilhada exata): quando GetFeature devolve >1 feição na mesma camada, trata como indisponivel('insuficiente') sem desempatar por ordem", async () => {
    const fixtureBboxPath = path.resolve(
      process.cwd(),
      "docs/verificacoes/fontes/wfs_erodibilidade/getfeatureinfo_3camadas_r13_fronteira_bp3.json"
    );
    const fixtureMultiplas = JSON.parse(fs.readFileSync(fixtureBboxPath, "utf-8"));
    vi.stubGlobal("fetch", mockFetchJson(fixtureMultiplas));

    const r = await queryEmbrapaSoil(-24.88, -54.26);
    expect(r.fronteiraCompartilhadaExata).toBe(true);
    expect(r.causaZeroFeicoes).toBe("fronteira-compartilhada-exata");
    expect(r.solo).toBeNull();
    expect(r.provenienciaAtribuicao?.estado).toBe("indisponivel");
    if (r.provenienciaAtribuicao?.estado === "indisponivel") {
      expect(r.provenienciaAtribuicao.causa).toBe("insuficiente");
    }
    expect(r.pontoEmFronteiraPedologica.estado).toBe("medido");
    if (r.pontoEmFronteiraPedologica.estado === "medido") {
      expect(r.pontoEmFronteiraPedologica.valor).toBe(true);
    }
  });

  it("V2.2: diagnosticarFronteiraPedologicaBbox computa medido(true) sobre getfeatureinfo_3camadas_r13_fronteira_bp3.json e medido(false) quando há 1 feição por camada", async () => {
    const fixtureBboxPath = path.resolve(
      process.cwd(),
      "docs/verificacoes/fontes/wfs_erodibilidade/getfeatureinfo_3camadas_r13_fronteira_bp3.json"
    );
    const fixtureBbox = JSON.parse(fs.readFileSync(fixtureBboxPath, "utf-8"));
    vi.stubGlobal("fetch", mockFetchJson(fixtureBbox));

    const diagTrue = await diagnosticarFronteiraPedologicaBbox(-24.88, -54.26);
    expect(diagTrue.pontoEmFronteiraPedologica.estado).toBe("medido");
    if (diagTrue.pontoEmFronteiraPedologica.estado === "medido") {
      expect(diagTrue.pontoEmFronteiraPedologica.valor).toBe(true);
    }
    expect(diagTrue.totalFeicoesSoloBbox).toBe(2);
    expect(diagTrue.fronteiraComNaoSoloBbox).toBe(true);

    const fixturePipPath = path.resolve(
      process.cwd(),
      "docs/verificacoes/fontes/wfs_erodibilidade/getfeature_pip_3camadas_r13_bp3.json"
    );
    const fixtureSingle = JSON.parse(fs.readFileSync(fixturePipPath, "utf-8"));
    vi.stubGlobal("fetch", mockFetchJson(fixtureSingle));

    const diagFalse = await diagnosticarFronteiraPedologicaBbox(-24.62, -53.71);
    expect(diagFalse.pontoEmFronteiraPedologica.estado).toBe("medido");
    if (diagFalse.pontoEmFronteiraPedologica.estado === "medido") {
      expect(diagFalse.pontoEmFronteiraPedologica.valor).toBe(false);
    }
  });

  it("V3.1: distingue zero feições por fora-cobertura-camada-estadual versus dentro-cobertura-lacuna-ou-agua", async () => {
    // Caso 1: 0 feições nas 3 camadas -> dentro-cobertura-lacuna-ou-agua (fora-do-dominio)
    vi.stubGlobal("fetch", mockFetchJson({ features: [] }));
    const rLacuna = await queryEmbrapaSoil(-24.85, -54.36);
    expect(rLacuna.causaZeroFeicoes).toBe("dentro-cobertura-lacuna-ou-agua");
    expect(rLacuna.foraDoDominioSolo).toBe(true);
    expect(rLacuna.provenienciaAtribuicao?.estado).toBe("indisponivel");
    if (rLacuna.provenienciaAtribuicao?.estado === "indisponivel") {
      expect(rLacuna.provenienciaAtribuicao.causa).toBe("fora-do-dominio");
    }

    clearEmbrapaSoilCache();

    // Caso 2: 0 feições em parana_solos, mas cobertura nacional de solo presente -> fora-cobertura-camada-estadual (sem-cobertura)
    vi.stubGlobal(
      "fetch",
      mockFetchJson({
        features: [
          {
            id: "brasil_erodibilidade_solo.10",
            properties: { codnum: 2, classe: "Baixa" },
          },
          {
            id: "bra_erodibilidade_2024_sirgas2000.10",
            properties: {
              ogc_fid: 10,
              cod_um: "SE22LVd1",
              cod_um2: "SE22LVd1",
              legenda_c1: "LATOSSOLO VERMELHO Distrofico",
              erod_c1: "Baixa",
              erod_um: "Baixa",
              k_solos: 0.012,
              fator_k_um: "0.0120",
            },
          },
        ],
      })
    );
    const rForaPr = await queryEmbrapaSoil(-21.17, -47.81);
    expect(rForaPr.causaZeroFeicoes).toBe("fora-cobertura-camada-estadual");
    expect(rForaPr.provenienciaAtribuicao?.estado).toBe("indisponivel");
    if (rForaPr.provenienciaAtribuicao?.estado === "indisponivel") {
      expect(rForaPr.provenienciaAtribuicao.causa).toBe("sem-cobertura");
    }
  });

  it("V3.4 (guarda de sanidade no código): verificarSanidadeZeroFeicoesLoteEmbrapa aborta com ErroSanidadeEixosWfsEmbrapa quando >50% de >=5 pontos devolvem zero feições", async () => {
    vi.stubGlobal("fetch", mockFetchJson({ features: [] }));
    const loteVazio: Awaited<ReturnType<typeof queryEmbrapaSoil>>[] = [];
    for (let i = 0; i < 6; i++) {
      loteVazio.push(await queryEmbrapaSoil(-24.5 - i * 0.01, -54.0 - i * 0.01));
    }
    expect(LIMIAR_MAXIMO_FRACAO_ZERO_FEICOES_LOTE).toBe(0.5);
    expect(() => verificarSanidadeZeroFeicoesLoteEmbrapa(loteVazio)).toThrowError(
      ErroSanidadeEixosWfsEmbrapa
    );
    expect(() => verificarSanidadeZeroFeicoesLoteEmbrapa(loteVazio)).toThrowError(
      /POINT\(<lat> <lon>\)/
    );
  });

  it("U3: parseErodibility2024Feature verifica erod_um ANTES de ler k_solos e anula kSolos para k_solos = 0 / não-solo", () => {
    const urbano = parseErodibility2024Feature({
      ogc_fid: 100237,
      cod_um: "SG21Au",
      cod_um2: "SG21Au",
      erod_um: "Área urbana",
      k_solos: 0,
      fator_k_um: "0.0000",
    });
    expect(urbano).not.toBeNull();
    expect(urbano!.erodUm).toBe("Área urbana");
    expect(urbano!.kSolos).toBeNull();
    expect(urbano!.kSolosBruto).toBe(0);
  });
});


