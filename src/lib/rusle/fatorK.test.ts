import { describe, it, expect } from "vitest";
import {
  converterErodibilidadeFatorK,
  identificarViaFatorKD14,
  obterFatorKComProveniencia,
} from "./fatorK";
import { montarLinhaDeBaseRUSLE } from "./linhaDeBase";
import { Proveniencia } from "@/types/proveniencia";

describe("Fator K de Erodibilidade do Solo (Tabela 5 Embrapa Solos / Decisões D09 e D14)", () => {
  describe("Conversão Normativa da Tabela 5 (Doc. 246/2024 / Mannigel et al., 2002)", () => {
    it("converte Muito Baixa para kValor = 0.0052 e estrato K^ = 1", () => {
      const res = converterErodibilidadeFatorK("Muito baixa");
      expect(res).not.toBeNull();
      expect(res?.classeOrdinal).toBe(1);
      expect(res?.kValor).toBe(0.0052);
      expect(res?.faixaK).toEqual([0.0020, 0.0084]);
      expect(res?.nivelEstratoK).toBe(1);
    });

    it("converte Baixa para kValor = 0.0117 e estrato K^ = 1", () => {
      const res = converterErodibilidadeFatorK("Baixa");
      expect(res).not.toBeNull();
      expect(res?.classeOrdinal).toBe(2);
      expect(res?.kValor).toBe(0.0117);
      expect(res?.faixaK).toEqual([0.0090, 0.0144]);
      expect(res?.nivelEstratoK).toBe(1);
    });

    it("converte Média para kValor = 0.0218 e estrato K^ = 1", () => {
      const res = converterErodibilidadeFatorK("Média");
      expect(res).not.toBeNull();
      expect(res?.classeOrdinal).toBe(3);
      expect(res?.kValor).toBe(0.0218);
      expect(res?.faixaK).toEqual([0.0150, 0.0285]);
      expect(res?.nivelEstratoK).toBe(1);
    });

    it("converte Alta para kValor = 0.0360 e estrato K^ = 2", () => {
      const res = converterErodibilidadeFatorK("Alta");
      expect(res).not.toBeNull();
      expect(res?.classeOrdinal).toBe(4);
      expect(res?.kValor).toBe(0.0360);
      expect(res?.faixaK).toEqual([0.0300, 0.0420]);
      expect(res?.nivelEstratoK).toBe(2);
    });

    it("converte Muito Alta para kValor = 0.0518 e estrato K^ = 2", () => {
      const res = converterErodibilidadeFatorK("Muito alta");
      expect(res).not.toBeNull();
      expect(res?.classeOrdinal).toBe(5);
      expect(res?.kValor).toBe(0.0518);
      expect(res?.faixaK).toEqual([0.0450, 0.0585]);
      expect(res?.nivelEstratoK).toBe(2);
    });
  });

  describe("Robustez textual e normalização", () => {
    it("aceita variações de caixa e diacríticos ('media', 'MEDIA', '  MÉDIA  ')", () => {
      expect(converterErodibilidadeFatorK("media")?.kValor).toBe(0.0218);
      expect(converterErodibilidadeFatorK("MEDIA")?.kValor).toBe(0.0218);
      expect(converterErodibilidadeFatorK("  MÉDIA  ")?.kValor).toBe(0.0218);
      expect(converterErodibilidadeFatorK("muito ALTA")?.kValor).toBe(0.0518);
    });

    it("aceita códigos numéricos da carta ('1', '2.0', '3', '4', '5')", () => {
      expect(converterErodibilidadeFatorK("1")?.classeNormalizada).toBe("Muito baixa");
      expect(converterErodibilidadeFatorK("2.0")?.classeNormalizada).toBe("Baixa");
      expect(converterErodibilidadeFatorK("3")?.classeNormalizada).toBe("Média");
      expect(converterErodibilidadeFatorK("4.0")?.classeNormalizada).toBe("Alta");
      expect(converterErodibilidadeFatorK("5")?.classeNormalizada).toBe("Muito alta");
    });

    it("retorna null para classes fora do domínio agrícola (Decisão D09)", () => {
      expect(converterErodibilidadeFatorK("Fase erodida")).toBeNull();
      expect(converterErodibilidadeFatorK("Dunas")).toBeNull();
      expect(converterErodibilidadeFatorK("Afloramento de rochas")).toBeNull();
      expect(converterErodibilidadeFatorK("Corpos d'água")).toBeNull();
      expect(converterErodibilidadeFatorK(null)).toBeNull();
      expect(converterErodibilidadeFatorK(undefined)).toBeNull();
      expect(converterErodibilidadeFatorK("")).toBeNull();
    });
  });

  describe("obterFatorKComProveniencia e Decisão D14 emendada (U3)", () => {
    it("prefere k_solos da camada geonode:bra_erodibilidade_2024_sirgas2000 com proveniência tabelado (U3.1)", () => {
      const res = obterFatorKComProveniencia(
        { estado: "tabelado", valor: "Baixa", tabela: "Embrapa", chave: "Baixa" },
        { kSolos: 0.012, erodUm: "Baixa", codUm: "SG21NVef1NV", ogcFid: 102154 }
      );
      expect(res.estado).toBe("tabelado");
      if (res.estado === "tabelado") {
        expect(res.valor).toBe(0.012);
        expect(res.chave).toBe("SG21NVef1NV");
        expect(res.decisao).toBe("D14");
        expect(res.tabela).toContain("Tabela 5 do Documentos 246");
        expect(res.tabela).toContain("bra_erodibilidade_2024_sirgas2000");
      }
      expect(identificarViaFatorKD14(res)).toBe("k_solos_camada_2024_tabelado");
    });

    it("produz proveniência distinta de fallback (faixa-classe:...) quando k_solos está ausente (U3.2)", () => {
      const prov: Proveniencia<string> = {
        estado: "tabelado",
        valor: "Média",
        tabela: "Embrapa Solos",
        chave: "LV",
      };

      const res = obterFatorKComProveniencia(prov, null);
      expect(res.estado).toBe("tabelado");
      if (res.estado === "tabelado") {
        expect(res.valor).toBe(0.0218);
        expect(res.chave).toBe("faixa-classe:Média");
        expect(res.decisao).toBe("D14");
        expect(res.tabela).toContain("Fallback D14 derivado de faixa de classe ordinal");
      }
      expect(identificarViaFatorKD14(res)).toBe("fallback_faixa_classe_d14");
    });

    it("TESTE OBRIGATÓRIO U3: k_solos = 0 com erod_um = 'Área urbana' devolve indisponivel / fora-do-dominio (NÃO devolve K = 0) e perdaSolo permanece retida pelo Invariante 1", () => {
      const resUrbana = obterFatorKComProveniencia(
        { estado: "tabelado", valor: "Area urbana", tabela: "Embrapa", chave: "Urb" },
        { kSolos: 0, erodUm: "Área urbana", codUm: "SG22Ár", ogcFid: 99999 }
      );
      expect(resUrbana.estado).toBe("indisponivel");
      expect((resUrbana as { valor?: number }).valor).not.toBe(0);
      if (resUrbana.estado === "indisponivel") {
        expect(resUrbana.causa).toBe("fora-do-dominio");
      }
      expect(identificarViaFatorKD14(resUrbana)).toBe("indisponivel_fora_do_dominio");

      // Mesmo quando R, LS, C e P são fornecidos como números finitos válidos, perdaSolo permanece retida pelo Invariante 1
      const rusleUrbana = montarLinhaDeBaseRUSLE({
        ndviProveniencia: {
          estado: "medido",
          valor: 0.45,
          fonte: "Sentinel-2",
          adquiridoEm: "2026-05-10T12:00:00Z",
          consultadoEm: "2026-09-10T21:00:00Z",
        },
        fatorRSubstituto: {
          estado: "modelado",
          valor: 8500,
          modelo: "CHIRPS regional",
          insumos: ["CHIRPS"],
        },
        fatorLSSubstituto: {
          estado: "modelado",
          valor: 2.1,
          modelo: "Desmet & Govers (1996)",
          insumos: ["Copernicus DEM GLO-30"],
        },
        camadaErodibilidade2024: {
          kSolos: 0,
          erodUm: "Área urbana",
          codUm: "SG22Ár",
          ogcFid: 99999,
        },
      });

      expect(rusleUrbana.fatorK.estado).toBe("indisponivel");
      expect((rusleUrbana.fatorK as { valor?: number }).valor).not.toBe(0);
      if (rusleUrbana.fatorK.estado === "indisponivel") {
        expect(rusleUrbana.fatorK.causa).toBe("fora-do-dominio");
      }
      expect(rusleUrbana.perdaSolo.estado).toBe("indisponivel");
      expect((rusleUrbana.perdaSolo as { valor?: number }).valor).not.toBe(0);
    });

    it("retorna fora-do-dominio para feição não agrícola", () => {
      const prov: Proveniencia<string> = {
        estado: "tabelado",
        valor: "Afloramento de rocha",
        tabela: "Embrapa Solos",
        chave: "AF",
      };

      const res = obterFatorKComProveniencia(prov);
      expect(res.estado).toBe("indisponivel");
      if (res.estado === "indisponivel") {
        expect(res.causa).toBe("fora-do-dominio");
        expect(res.motivo).toContain("D09");
      }
    });

    it("retorna sem-cobertura quando a proveniência de entrada é nula ou indefinida", () => {
      const res = obterFatorKComProveniencia(null);
      expect(res.estado).toBe("indisponivel");
      if (res.estado === "indisponivel") {
        expect(res.causa).toBe("sem-cobertura");
      }
    });

    it("V3.1: VEDA usar o fallback por faixa de classe quando temUnidadeSoloMapeada === false (zero feições ou água), mesmo que brasil_erodibilidade_solo traga classe válida", () => {
      const classePresente: Proveniencia<string> = {
        estado: "tabelado",
        valor: "Baixa",
        tabela: "Embrapa Solos (brasil_erodibilidade_solo)",
        chave: "Baixa",
      };

      const resLacuna = obterFatorKComProveniencia(classePresente, {
        temUnidadeSoloMapeada: false,
        causaZeroFeicoes: "dentro-cobertura-lacuna-ou-agua",
      });
      expect(resLacuna.estado).toBe("indisponivel");
      if (resLacuna.estado === "indisponivel") {
        expect(resLacuna.causa).toBe("fora-do-dominio");
      }
      expect(identificarViaFatorKD14(resLacuna)).toBe("indisponivel_fora_do_dominio");

      const resForaCoberturaPr = obterFatorKComProveniencia(classePresente, {
        temUnidadeSoloMapeada: false,
        causaZeroFeicoes: "fora-cobertura-camada-estadual",
      });
      expect(resForaCoberturaPr.estado).toBe("indisponivel");
      if (resForaCoberturaPr.estado === "indisponivel") {
        expect(resForaCoberturaPr.causa).toBe("sem-cobertura");
      }
      expect(identificarViaFatorKD14(resForaCoberturaPr)).toBe("indisponivel_sem_cobertura");
    });

    it("V1.3: retorna indisponivel('insuficiente') quando fronteiraCompartilhadaExata === true (>1 feição na mesma camada no ponto-em-polígono)", () => {
      const classePresente: Proveniencia<string> = {
        estado: "tabelado",
        valor: "Baixa",
        tabela: "Embrapa Solos",
        chave: "Baixa",
      };
      const resFronteira = obterFatorKComProveniencia(classePresente, {
        kSolos: 0.012,
        erodUm: "Baixa",
        fronteiraCompartilhadaExata: true,
      });
      expect(resFronteira.estado).toBe("indisponivel");
      if (resFronteira.estado === "indisponivel") {
        expect(resFronteira.causa).toBe("insuficiente");
      }
      expect(identificarViaFatorKD14(resFronteira)).toBe("indisponivel_fronteira_exata");
    });
  });

  describe("Integração com Linha de Base RUSLE", () => {
    it("integra Fator K calculado a partir da erodibilidade informada (fallback por faixa) ou k_solos (camada 2024)", () => {
      const rusleFallback = montarLinhaDeBaseRUSLE({
        ndviProveniencia: {
          estado: "medido",
          valor: 0.5,
          fonte: "Sentinel-2",
          adquiridoEm: "2026-05-10T12:00:00Z",
          consultadoEm: "2026-09-10T21:00:00Z",
        },
        erodibilidadeProveniencia: {
          estado: "tabelado",
          valor: "Alta",
          tabela: "Embrapa Solos",
          chave: "PV",
        },
      });

      expect(rusleFallback.fatorK.estado).toBe("tabelado");
      if (rusleFallback.fatorK.estado === "tabelado") {
        expect(rusleFallback.fatorK.valor).toBe(0.0360);
        expect(rusleFallback.fatorK.chave).toBe("faixa-classe:Alta");
        expect(rusleFallback.fatorK.decisao).toBe("D14");
      }

      const rusleKSolos = montarLinhaDeBaseRUSLE({
        ndviProveniencia: {
          estado: "medido",
          valor: 0.5,
          fonte: "Sentinel-2",
          adquiridoEm: "2026-05-10T12:00:00Z",
          consultadoEm: "2026-09-10T21:00:00Z",
        },
        camadaErodibilidade2024: {
          kSolos: 0.0285,
          erodUm: "Média",
          codUm: "SG22NVef7",
          ogcFid: 105112,
        },
      });

      expect(rusleKSolos.fatorK.estado).toBe("tabelado");
      if (rusleKSolos.fatorK.estado === "tabelado") {
        expect(rusleKSolos.fatorK.valor).toBe(0.0285);
        expect(rusleKSolos.fatorK.chave).toBe("SG22NVef7");
        expect(rusleKSolos.fatorK.decisao).toBe("D14");
      }
    });
  });
});
