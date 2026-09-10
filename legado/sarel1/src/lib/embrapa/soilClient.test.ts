import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  parseSoilFeature,
  parseErodibilityFeature,
  formatSoilLabel,
  queryEmbrapaSoil,
  clearEmbrapaSoilCache,
  buildGetFeatureInfoUrl,
  mapearErodibilidadeParaOrdinal,
} from "./soilClient";

describe("Cliente Pedológico e de Erodibilidade — Embrapa GeoInfo (src/lib/embrapa/soilClient)", () => {
  beforeEach(() => {
    clearEmbrapaSoilCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("buildGetFeatureInfoUrl", () => {
    it("monta URL WMS válida apontando para o GeoServer da Embrapa", () => {
      const url = buildGetFeatureInfoUrl(-25.0669, -53.688);
      const urlDecodificada = decodeURIComponent(url);
      expect(urlDecodificada).toContain("https://geoinfo.dados.embrapa.br/geoserver/ows");
      expect(urlDecodificada).toContain("geonode:parana_solos_20201105");
      expect(urlDecodificada).toContain("geonode:brasil_erodibilidade_solo");
      expect(urlDecodificada).toContain("application/json");
    });
  });

  describe("parseSoilFeature", () => {
    it("converte propriedades de unidade simples (um componente) com alta confiança", () => {
      const props = {
        sbcs: "LVe1",
        legenda: "Latossolo Vermelho Eutrófico",
        tipo_unida: "simples",
        ordem_1: "LATOSSOLO",
        sub_ordem_: "VERMELHO",
        grande_gru: "Eutrofico",
        area_km2: 154.2,
      };
      const res = parseSoilFeature(props);
      expect(res).not.toBeNull();
      expect(res?.sbcs).toBe("LVe1");
      expect(res?.confianca).toBe("alta");
      expect(res?.componentes).toHaveLength(1);
      expect(res?.componentes[0].ordem).toBe("LATOSSOLO");
      expect(res?.componentes[0].grandeGrupo).toBe("Eutrofico");
    });

    it("converte unidade de associação (até 3 componentes) com média confiança", () => {
      const props = {
        sbcs: "RRe12",
        legenda: "Associação Neossolo / Chernossolo / Nitossolo",
        tipo_unida: "associacao",
        ordem_1: "NEOSSOLO",
        sub_ordem_: "REGOLITICO",
        grande_gru: "Eutrofico",
        ordem_2: "CHERNOSSOLO",
        sub_ordem1: "ARGILUVICO",
        grande_g_1: "Ferrico",
        ordem_3: "NITOSSOLO",
        sub_orde_1: "VERMELHO",
        grande_g_2: "Distroferrico",
      };
      const res = parseSoilFeature(props);
      expect(res).not.toBeNull();
      expect(res?.confianca).toBe("media");
      expect(res?.componentes).toHaveLength(3);
      expect(res?.componentes[0].ordem).toBe("NEOSSOLO");
      expect(res?.componentes[1].ordem).toBe("CHERNOSSOLO");
      expect(res?.componentes[2].ordem).toBe("NITOSSOLO");
    });

    it("retorna null se não houver componentes válidos", () => {
      expect(parseSoilFeature({})).toBeNull();
    });
  });

  describe("parseErodibilityFeature", () => {
    it("converte feição de erodibilidade", () => {
      const props = { classe: "Alta", codnum: 4 };
      const res = parseErodibilityFeature(props);
      expect(res).toEqual({ classe: "Alta", codnum: 4 });
    });

    it("retorna null para feição sem classe", () => {
      expect(parseErodibilityFeature({})).toBeNull();
    });
  });

  describe("formatSoilLabel", () => {
    it("inclui ressalva explicativa para associação pedológica", () => {
      const mockResult = {
        statusSolo: "encontrado" as const,
        statusErodibilidade: "encontrado" as const,
        motivo: null,
        solo: {
          sbcs: "RRe12",
          legenda: "Associação",
          tipoUnidade: "associacao",
          confianca: "media" as const,
          areaKm2: null,
          componentes: [
            { posicao: 1 as const, ordem: "NEOSSOLO", subOrdem: "REGOLITICO", grandeGrupo: "Eutrofico", subGrupo: "", familia: [], faseVegetacao: "", faseRelevo: "" },
            { posicao: 2 as const, ordem: "CHERNOSSOLO", subOrdem: "", grandeGrupo: "", subGrupo: "", familia: [], faseVegetacao: "", faseRelevo: "" },
          ],
        },
        erodibilidade: { classe: "Alta", codnum: 4 },
        proveniencia: { servico: "", camadaSolo: "", camadaErodibilidade: "", latitude: 0, longitude: 0, consultadoEm: "" },
      };
      const label = formatSoilLabel(mockResult);
      expect(label).toContain("NEOSSOLO REGOLITICO Eutrofico");
      expect(label).toContain("componente dominante de associação com 2 solos — atribuição pontual não resolvida pela carta");
    });
  });

  describe("mapearErodibilidadeParaOrdinal (§3.3.1 do Plano v2)", () => {
    it("mapeia classes pedológicas para ordinais de 1 a 5", () => {
      expect(mapearErodibilidadeParaOrdinal("Muito Baixa")).toEqual({
        classeOriginal: "Muito Baixa", ehPedologica: true, ordinal: 1, nivelK: 1
      });
      expect(mapearErodibilidadeParaOrdinal("Baixa")).toEqual({
        classeOriginal: "Baixa", ehPedologica: true, ordinal: 2, nivelK: 1
      });
      expect(mapearErodibilidadeParaOrdinal("Média")).toEqual({
        classeOriginal: "Média", ehPedologica: true, ordinal: 3, nivelK: 1
      });
      expect(mapearErodibilidadeParaOrdinal("Alta")).toEqual({
        classeOriginal: "Alta", ehPedologica: true, ordinal: 4, nivelK: 2
      });
      expect(mapearErodibilidadeParaOrdinal("Muito Alta")).toEqual({
        classeOriginal: "Muito Alta", ehPedologica: true, ordinal: 5, nivelK: 2
      });
    });

    it("identifica e exclui categorias não-pedológicas (ex.: Área urbana)", () => {
      const resUrbana = mapearErodibilidadeParaOrdinal("Area urbana");
      expect(resUrbana.ehPedologica).toBe(false);
      expect(resUrbana.ordinal).toBeNull();
      expect(resUrbana.motivo).toContain("Área urbana");
    });

    it("trata classe desconhecida sem inventar ordinal", () => {
      const resInvalida = mapearErodibilidadeParaOrdinal("Classe Inexistente XYZ");
      expect(resInvalida.ehPedologica).toBe(false);
      expect(resInvalida.ordinal).toBeNull();
      expect(resInvalida.motivo).toContain("não reconhecida");
    });
  });

  describe("queryEmbrapaSoil (Consulta com mock)", () => {
    it("rejeita coordenadas inválidas sem consultar serviço", async () => {
      const res = await queryEmbrapaSoil(999, -53);
      expect(res.statusSolo).toBe("servico-indisponivel");
      expect(res.motivo).toContain("Coordenada inválida");
    });

    it("retorna 'sem-cobertura' quando o serviço responde sem feições", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ features: [] }), { status: 200 })
      );

      const res = await queryEmbrapaSoil(-25.5, -45.0); // Oceano
      expect(res.statusSolo).toBe("sem-cobertura");
      expect(res.statusErodibilidade).toBe("sem-cobertura");
      expect(res.solo).toBeNull();
      expect(res.motivo).toContain("Carta de solos sem cobertura");
    });

    it("retorna 'servico-indisponivel' em falha de rede sem afirmar nada sobre o território", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Connection timeout"));

      const res = await queryEmbrapaSoil(-25.0, -53.0);
      expect(res.statusSolo).toBe("servico-indisponivel");
      expect(res.statusErodibilidade).toBe("servico-indisponivel");
      expect(res.motivo).toContain("Falha ao consultar o serviço GeoInfo da Embrapa");
    });
  });
});
