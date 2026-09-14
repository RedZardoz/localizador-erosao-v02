import { describe, it, expect } from "vitest";
import {
  calcularFatorC,
  calcularFatorCVanDerKnijff,
  obterFatorCComProveniencia,
  ErroForaDoDominio,
} from "./fatorC";
import { montarLinhaDeBaseRUSLE, obterFatorPPadrao } from "./linhaDeBase";
import { validarInvariantesArtefato, ArtefatoProjetado } from "../matriz/invariantes";
import { REGISTRO_DECISOES } from "@/config/decisoes";

describe("Fase 8 — Linha de Base RUSLE e Fator C", () => {
  describe("14.1 Fator C (Durigon et al., 2014)", () => {
    it("C decresce estritamente com o NDVI", () => {
      const cs = [-0.2, 0.05, 0.2, 0.4, 0.6, 0.8, 0.95].map((n) => calcularFatorC(n));
      for (let i = 1; i < cs.length; i++) {
        expect(cs[i]).toBeLessThan(cs[i - 1]);
      }
    });

    it("C permanece em [0, 1] em todo o domínio", () => {
      for (const n of [-1, -0.5, 0, 0.5, 0.99, 1]) {
        const c = calcularFatorC(n);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    });

    it("reproduz os valores de referência", () => {
      expect(calcularFatorC(0.0)).toBeCloseTo(0.5, 6);
      expect(calcularFatorC(0.5)).toBeCloseTo(0.25, 6);
      expect(calcularFatorC(1.0)).toBeCloseTo(0.0, 6);
    });

    it("NDVI fora do domínio lança em vez de ser cortado", () => {
      expect(() => calcularFatorC(1.2)).toThrow(ErroForaDoDominio);
      expect(() => calcularFatorC(-1.01)).toThrow(ErroForaDoDominio);
      expect(() => calcularFatorC(Number.NaN)).toThrow(ErroForaDoDominio);
      expect(() => calcularFatorC(Infinity)).toThrow(ErroForaDoDominio);
    });

    it("calcula a formulação híbrida SPD modulada por BSI: C = ((1 - NDVI)/2) * (1 + BSI)", () => {
      // Caso base (sem BSI ou BSI = 0): reduz a Durigon
      expect(calcularFatorC(0.2, 0)).toBeCloseTo(0.4, 6);

      // Solo exposto lavado (BSI positivo = 0.5): fator C aumenta
      expect(calcularFatorC(0.2, 0.5)).toBeCloseTo(0.6, 6);

      // Solo protegido com palhada (BSI negativo = -0.2): fator C diminui
      expect(calcularFatorC(0.7, -0.2)).toBeCloseTo(0.12, 6);
    });

    it("BSI fora do domínio [-1, 1] lança erro em vez de corte silencioso", () => {
      expect(() => calcularFatorC(0.4, 1.5)).toThrow(ErroForaDoDominio);
      expect(() => calcularFatorC(0.4, -1.2)).toThrow(ErroForaDoDominio);
    });

    it("encapsula proveniência corretamente e trata fora-do-dominio sem quebrar", () => {
      const respValida = obterFatorCComProveniencia({
        estado: "medido",
        valor: 0.4,
        fonte: "Sentinel-2 L2A",
        adquiridoEm: "2026-05-10T12:00:00Z",
        consultadoEm: "2026-09-10T21:00:00Z",
      });
      expect(respValida.estado).toBe("modelado");
      if (respValida.estado === "modelado") {
        expect(respValida.valor).toBe(0.3);
        expect(respValida.decisoes).toContain("D01");
      }

      const respFora = obterFatorCComProveniencia({
        estado: "medido",
        valor: 1.5,
        fonte: "Sentinel-2 L2A",
        adquiridoEm: "2026-05-10T12:00:00Z",
        consultadoEm: "2026-09-10T21:00:00Z",
      });
      expect(respFora.estado).toBe("indisponivel");
      if (respFora.estado === "indisponivel") {
        expect(respFora.causa).toBe("fora-do-dominio");
      }

      const respIndisp = obterFatorCComProveniencia(null);
      expect(respIndisp.estado).toBe("indisponivel");
    });
  });

  describe("14.2 Fator P (Renard et al., 1997)", () => {
    it("P é sempre tabelado por padrão, nunca medido", () => {
      const p = obterFatorPPadrao();
      expect(p.estado).toBe("tabelado");
      if (p.estado === "tabelado") {
        expect(p.valor).toBe(1.0);
        expect(p.tabela).toContain("Renard et al. (1997)");
        expect(p.chave).toBe("sem-pratica-informada");
      }
    });
  });

  describe("14.3 Análise de Sensibilidade — van der Knijff et al. (2000)", () => {
    it("ordena o Fator C monotonicamente mas com compressão exponencial", () => {
      const alpha = 2;
      const beta = 1;
      const ndvis = [0.15, 0.35, 0.55, 0.75];
      const durigonC = ndvis.map((n) => calcularFatorC(n));
      const knijffC = ndvis.map((n) => calcularFatorCVanDerKnijff(n, alpha, beta));

      // Ambas são estritamente decrescentes
      for (let i = 1; i < knijffC.length; i++) {
        expect(knijffC[i]).toBeLessThan(knijffC[i - 1]);
        expect(durigonC[i]).toBeLessThan(durigonC[i - 1]);
      }

      // Para vegetação densa (0.75), Knijff cai acentuadamente em relação a Durigon
      expect(knijffC[3]).toBeLessThan(0.01);
      expect(durigonC[3]).toBe(0.125);
    });
  });

  describe("14.4 Coerência e Invariante 1", () => {
    it("com D13, D14 ou D15 pendente, perdaSolo é indisponivel com causa decisao-pendente", () => {
      expect(REGISTRO_DECISOES.D13.estado).toBe("pendente");
      expect(REGISTRO_DECISOES.D14.estado).toBe("pendente");
      expect(REGISTRO_DECISOES.D15.estado).toBe("pendente");

      const rusle = montarLinhaDeBaseRUSLE({
        ndviProveniencia: {
          estado: "medido",
          valor: 0.5,
          fonte: "Sentinel-2 L2A",
          adquiridoEm: "2026-05-10T12:00:00Z",
          consultadoEm: "2026-09-10T21:00:00Z",
        },
      });

      expect(rusle.fatorC.estado).toBe("modelado");
      expect(rusle.fatorP.estado).toBe("tabelado");
      expect(rusle.fatorR.estado).toBe("indisponivel");
      expect(rusle.fatorK.estado).toBe("indisponivel");
      expect(rusle.fatorLS.estado).toBe("indisponivel");

      expect(rusle.perdaSolo.estado).toBe("indisponivel");
      if (rusle.perdaSolo.estado === "indisponivel") {
        expect(rusle.perdaSolo.causa).toBe("decisao-pendente");
      }
      expect(rusle.memoriaCalculo).toBeNull();
    });

    it("calcula perda de solo e gera memória de cálculo quando todos os 5 fatores são providos", () => {
      const dataIso = "2026-09-10T21:00:00Z";
      const rusle = montarLinhaDeBaseRUSLE({
        ndviProveniencia: {
          estado: "medido",
          valor: 0.5, // C = (1 - 0.5) / 2 = 0.25
          fonte: "Sentinel-2 L2A",
          adquiridoEm: dataIso,
          consultadoEm: dataIso,
        },
        fatorRSubstituto: {
          estado: "modelado",
          valor: 6800,
          modelo: "Equação regional",
          insumos: ["Chuva"],
          decisoes: ["D13"],
        },
        fatorKSubstituto: {
          estado: "tabelado",
          valor: 0.02,
          tabela: "Embrapa Solos",
          chave: "LVd",
        },
        fatorLSSubstituto: {
          estado: "modelado",
          valor: 1.405,
          modelo: "Desmet & Govers",
          insumos: ["MDE"],
          decisoes: ["D15"],
        },
        fatorPSubstituto: {
          estado: "tabelado",
          valor: 1.0,
          tabela: "Renard et al. (1997)",
          chave: "sem-pratica-informada",
        },
      });

      expect(rusle.fatorC.estado).toBe("modelado");
      expect(rusle.perdaSolo.estado).toBe("modelado");
      if (rusle.perdaSolo.estado === "modelado") {
        // A = 6800 * 0.020 * 1.405 * 0.25 * 1.0 = 47.77
        expect(rusle.perdaSolo.valor).toBeCloseTo(47.77, 2);
      }
      expect(rusle.memoriaCalculo).not.toBeNull();
      expect(rusle.memoriaCalculo).toContain("RUSLE A = R (6800) * K (0.02) * LS (1.405) * C (0.25) * P (1) = 47.7700 t/ha/ano");
    });

    it("Invariante 1 valida artefato com linhas RUSLE consistentes e recusa violações", () => {
      // Caso 1: Artefato válido com RUSLE calculada (5 fatores + perda + memória)
      const artefatoValido: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: [
          "Codigo",
          "Latitude",
          "Longitude",
          "RUSLE_Fator_R",
          "RUSLE_Fator_K",
          "RUSLE_Fator_LS",
          "RUSLE_Fator_C",
          "RUSLE_Fator_P",
          "RUSLE_Perda_Solo_t_ha_ano",
          "RUSLE_Memoria_Calculo",
        ],
        linhas: [
          {
            Codigo: "PR-2026-0001",
            Latitude: -24.1,
            Longitude: -51.2,
            RUSLE_Fator_R: 6800,
            RUSLE_Fator_K: 0.02,
            RUSLE_Fator_LS: 1.4,
            RUSLE_Fator_C: 0.25,
            RUSLE_Fator_P: 1.0,
            RUSLE_Perda_Solo_t_ha_ano: 47.6,
            RUSLE_Memoria_Calculo: "A = R*K*LS*C*P",
          },
        ],
      };
      const resValido = validarInvariantesArtefato(artefatoValido);
      expect(resValido.valido).toBe(true);

      // Caso 2: perdaSolo preenchida mas sem fator K
      const artefatoIncompleto: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: [
          "Codigo",
          "Latitude",
          "Longitude",
          "RUSLE_Fator_R",
          "RUSLE_Fator_K",
          "RUSLE_Fator_LS",
          "RUSLE_Fator_C",
          "RUSLE_Fator_P",
          "RUSLE_Perda_Solo_t_ha_ano",
          "RUSLE_Memoria_Calculo",
        ],
        linhas: [
          {
            Codigo: "PR-2026-0002",
            Latitude: -24.2,
            Longitude: -51.3,
            RUSLE_Fator_R: 6800,
            RUSLE_Fator_K: null, // ausente
            RUSLE_Fator_LS: 1.4,
            RUSLE_Fator_C: 0.25,
            RUSLE_Fator_P: 1.0,
            RUSLE_Perda_Solo_t_ha_ano: 47.6,
            RUSLE_Memoria_Calculo: "A = R*K*LS*C*P",
          },
        ],
      };
      const resIncompleto = validarInvariantesArtefato(artefatoIncompleto);
      expect(resIncompleto.valido).toBe(false);
      expect(resIncompleto.violacoes.some((v) => v.invariante === 1)).toBe(true);

      // Caso 3: 5 fatores presentes mas perdaSolo vazia
      const artefatoSemPerda: ArtefatoProjetado = {
        perfil: "planilha",
        cabecalho: [
          "Codigo",
          "Latitude",
          "Longitude",
          "RUSLE_Fator_R",
          "RUSLE_Fator_K",
          "RUSLE_Fator_LS",
          "RUSLE_Fator_C",
          "RUSLE_Fator_P",
          "RUSLE_Perda_Solo_t_ha_ano",
          "RUSLE_Memoria_Calculo",
        ],
        linhas: [
          {
            Codigo: "PR-2026-0003",
            Latitude: -24.3,
            Longitude: -51.4,
            RUSLE_Fator_R: 6800,
            RUSLE_Fator_K: 0.02,
            RUSLE_Fator_LS: 1.4,
            RUSLE_Fator_C: 0.25,
            RUSLE_Fator_P: 1.0,
            RUSLE_Perda_Solo_t_ha_ano: null, // vazio
            RUSLE_Memoria_Calculo: "A = R*K*LS*C*P",
          },
        ],
      };
      const resSemPerda = validarInvariantesArtefato(artefatoSemPerda);
      expect(resSemPerda.valido).toBe(false);
      expect(resSemPerda.violacoes.some((v) => v.invariante === 1)).toBe(true);
    });
  });
});
