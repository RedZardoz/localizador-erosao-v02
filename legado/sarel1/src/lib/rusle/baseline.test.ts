import { describe, expect, it } from "vitest";
import {
  calcularFatorC,
  calcularFatorLS,
  calcularFatorR,
  calcularLinhaDeBaseRUSLE,
  obterFatorCComProveniencia,
  obterFatorKComProveniencia,
  obterFatorLSComProveniencia,
  obterFatorPComProveniencia,
  obterFatorRComProveniencia,
  TABELA_ERODIBILIDADE_K,
} from "./fatores";
import { PontoAmostral } from "@/types/ponto";

describe("Linha de Base RUSLE — Fase 8 (§13)", () => {
  describe("Fator C — Durigon et al. (2014) (§13.1)", () => {
    it("C decresce monotonicamente com o NDVI (corrige B1)", () => {
      const ndvis = [0.05, 0.2, 0.4, 0.6, 0.8, 0.95];
      const cs = ndvis.map((n) => calcularFatorC(n));

      for (let i = 1; i < cs.length; i++) {
        expect(cs[i]).toBeLessThanOrEqual(cs[i - 1]);
      }

      // Verificação física de valores canônicos:
      // NDVI = 0 -> C = 0.5
      expect(calcularFatorC(0.0)).toBe(0.5);
      // NDVI = 1 -> C = 0.0 (proteção total)
      expect(calcularFatorC(1.0)).toBe(0.0);
    });

    it("C permanece em [0, 1] em todo o domínio", () => {
      for (const n of [-1.0, -0.5, 0.0, 0.3, 0.7, 0.99, 1.0]) {
        const c = calcularFatorC(n);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    });

    it("atribui proveniência 'modelado' com citação a Durigon et al. (2014)", () => {
      const provC = obterFatorCComProveniencia(0.65);
      expect(provC.estado).toBe("modelado");
      if (provC.estado === "modelado") {
        expect(provC.modelo).toContain("Durigon et al. (2014)");
        expect(provC.valor).toBeCloseTo(0.175, 3);
      }
    });

    it("retorna 'indisponivel' se o NDVI for nulo ou NaN", () => {
      const provNulo = obterFatorCComProveniencia(null);
      expect(provNulo.estado).toBe("indisponivel");
      if (provNulo.estado === "indisponivel") {
        expect(provNulo.motivo).toContain("NDVI ausente");
      }
    });
  });

  describe("Fator LS — Desmet & Govers (1996) e Moore & Burch (1986) (§13.2)", () => {
    it("calcula LS com área de contribuição real As, aumentando com fluxo e declive", () => {
      const lsBaixo = calcularFatorLS(50, 4.0); // 50 pixels de fluxo, 4° declive
      const lsAlto = calcularFatorLS(300, 12.0); // 300 pixels de fluxo, 12° declive

      expect(lsAlto).toBeGreaterThan(lsBaixo);
      expect(lsBaixo).toBeGreaterThan(0.1);
      expect(lsAlto).toBeLessThan(45.0);
    });

    it("rejeita insumos nulos retornando estado 'indisponivel'", () => {
      const provLSInvalido = obterFatorLSComProveniencia(null, 5.0);
      expect(provLSInvalido.estado).toBe("indisponivel");
    });
  });

  describe("Fator K — Classes Pedológicas da Embrapa (§13.2)", () => {
    it("mapeia classes pedológicas de referência da Embrapa (Santos et al., 2018)", () => {
      const provLatossolo = obterFatorKComProveniencia("Latossolo Vermelho Distrófico");
      expect(provLatossolo.estado).toBe("tabelado");
      if (provLatossolo.estado === "tabelado") {
        expect(provLatossolo.valor).toBe(TABELA_ERODIBILIDADE_K["Latossolo"]);
        expect(provLatossolo.tabela).toContain("Santos et al. (2018)");
      }

      const provNeossolo = obterFatorKComProveniencia("Neossolo Regolítico");
      if (provNeossolo.estado === "tabelado") {
        expect(provNeossolo.valor).toBe(TABELA_ERODIBILIDADE_K["Neossolo"]);
        // Neossolo tem erodibilidade muito maior que Latossolo
        expect(provNeossolo.valor).toBeGreaterThan(TABELA_ERODIBILIDADE_K["Latossolo"]);
      }
    });

    it("retorna 'indisponivel' se a ordem pedológica não for identificada", () => {
      const provDesconhecido = obterFatorKComProveniencia("Solo Não Determinado");
      expect(provDesconhecido.estado).toBe("indisponivel");
    });
  });

  describe("Fator P — Práticas de Suporte (§13.2)", () => {
    it("registra P como 'tabelado' (Renard et al., 1997) e NUNCA como medido", () => {
      const provP = obterFatorPComProveniencia();
      expect(provP.estado).toBe("tabelado");
      expect(provP.estado).not.toBe("medido");
      if (provP.estado === "tabelado") {
        expect(provP.valor).toBe(1.0);
        expect(provP.tabela).toContain("Renard et al. (1997)");
      }
    });
  });

  describe("Fator R — Erosividade Pluviométrica (§13.2)", () => {
    it("calcula R combinando lâmina anual e intensidade I30 do GPM IMERG", () => {
      const r = calcularFatorR(1600, 35.0);
      expect(r).toBeGreaterThan(4000);
      expect(r).toBeLessThan(15000);

      const provR = obterFatorRComProveniencia(1600, 35.0);
      expect(provR.estado).toBe("modelado");
    });
  });

  describe("Cálculo Consolidado da Linha de Base RUSLE (§13.3)", () => {
    const pontoCompletoMock: PontoAmostral = {
      id: "ponto-rusle-mock",
      codigo: "PR-2026-0001",
      latitude: -25.4284,
      longitude: -49.2733,
      blocoEspacial: "BLOCO_R01_C01",
      estratoId: "ESTRATO_S2_E2_K1",
      criterioSelecao: { phiDiag: 0.4 },
      terreno: {
        elevacao: { estado: "medido", valor: 850, fonte: "DEM", adquiridoEm: "2026-01-01" },
        declividadePct: { estado: "medido", valor: 8.5, fonte: "DEM", adquiridoEm: "2026-01-01" },
        declividadeGraus: { estado: "medido", valor: 4.8, fonte: "DEM", adquiridoEm: "2026-01-01" },
        curvaturaPerfil: { estado: "medido", valor: 0.01, fonte: "DEM", adquiridoEm: "2026-01-01" },
        curvaturaPlana: { estado: "medido", valor: -0.01, fonte: "DEM", adquiridoEm: "2026-01-01" },
        acumuloFluxo: { estado: "medido", valor: 150, fonte: "DEM", adquiridoEm: "2026-01-01" },
        twi: { estado: "medido", valor: 6.5, fonte: "DEM", adquiridoEm: "2026-01-01" },
      },
      solo: {
        ordem: { estado: "tabelado", valor: "Latossolo", tabela: "Embrapa", chave: "LV" },
        subOrdem: { estado: "tabelado", valor: "Vermelho", tabela: "Embrapa", chave: "LVd" },
        grandeGrupo: { estado: "medido", valor: "Distrófico", fonte: "Campo", adquiridoEm: "2026-01-01" },
        tipoUnidade: { estado: "tabelado", valor: "simples", tabela: "Embrapa", chave: "simples" },
        confiancaPedologica: "alta",
        erodibilidadeClasse: { estado: "tabelado", valor: "baixa", tabela: "Embrapa", chave: "baixa" },
      },
      serie: {
        janela: { inicio: "2023-01-01", fim: "2025-12-31" },
        nObservacoesValidas: 35,
        harmonicos: {},
        frequenciaSoloNu: { estado: "medido", valor: 0.25, fonte: "Sentinel-2", adquiridoEm: "2026-01-01" },
        compostoSoloNu: {},
      },
      chuva: {
        precipAcum30d: { estado: "medido", valor: 150, fonte: "CHIRPS", adquiridoEm: "2026-01-01" },
        precipAcum90d: { estado: "medido", valor: 420, fonte: "CHIRPS", adquiridoEm: "2026-01-01" },
        i30Max: { estado: "medido", valor: 28.5, fonte: "GPM IMERG", adquiridoEm: "2026-01-01" },
        nEventosErosivos: { estado: "medido", valor: 3, fonte: "GPM IMERG", adquiridoEm: "2026-01-01" },
        indiceMecanismo: { estado: "modelado", valor: 70, modelo: "Calculado", insumos: ["chuva"] },
      },
    };

    it("calcula A = R * K * LS * C * P com memória de cálculo explícita quando os 5 fatores existem", () => {
      const baseline = calcularLinhaDeBaseRUSLE(pontoCompletoMock, 0.60);

      expect(baseline).toBeDefined();
      if (baseline) {
        expect(baseline.fatorR.estado).toBe("modelado");
        expect(baseline.fatorK.estado).toBe("tabelado");
        expect(baseline.fatorLS.estado).toBe("modelado");
        expect(baseline.fatorC.estado).toBe("modelado");
        expect(baseline.fatorP.estado).toBe("tabelado");
        expect(baseline.perdaSolo.estado).toBe("modelado");

        // Perda de solo é positiva e coerente com a física
        if (baseline.perdaSolo.estado === "modelado") {
          expect(baseline.perdaSolo.valor).toBeGreaterThan(0);
          expect(baseline.perdaSolo.valor).toBeLessThan(300); // t/ha.ano
        }

        expect(baseline.memoriaCalculo).toContain("A = R");
        expect(baseline.memoriaCalculo).toContain("Durigon et al. (2014)");
        expect(baseline.memoriaCalculo).toContain("Desmet & Govers (1996)");
      }
    });

    it("recusa o cálculo da perda de solo (retorna undefined) se faltar qualquer fator (Regra 1 e §13.3)", () => {
      const pontoSemSolo: PontoAmostral = {
        ...pontoCompletoMock,
        solo: {
          ...pontoCompletoMock.solo,
          ordem: { estado: "indisponivel", motivo: "Fora da cobertura WMS Embrapa" },
        },
      };

      const baseline = calcularLinhaDeBaseRUSLE(pontoSemSolo);
      expect(baseline).toBeUndefined();
    });
  });
});
