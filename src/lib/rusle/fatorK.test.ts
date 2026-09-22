import { describe, it, expect } from "vitest";
import { converterErodibilidadeFatorK, obterFatorKComProveniencia } from "./fatorK";
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

  describe("obterFatorKComProveniencia", () => {
    it("produz proveniência tabelada com D14 para classe válida", () => {
      const prov: Proveniencia<string> = {
        estado: "tabelado",
        valor: "Média",
        tabela: "Embrapa Solos",
        chave: "LV",
      };

      const res = obterFatorKComProveniencia(prov);
      expect(res.estado).toBe("tabelado");
      if (res.estado === "tabelado") {
        expect(res.valor).toBe(0.0218);
        expect(res.chave).toBe("Média");
        expect(res.decisao).toBe("D14");
        expect(res.tabela).toContain("Tabela 5 Embrapa Solos");
      }
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
  });

  describe("Integração com Linha de Base RUSLE", () => {
    it("integra Fator K calculado a partir da erodibilidade informada", () => {
      const rusle = montarLinhaDeBaseRUSLE({
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

      expect(rusle.fatorK.estado).toBe("tabelado");
      if (rusle.fatorK.estado === "tabelado") {
        expect(rusle.fatorK.valor).toBe(0.0360);
        expect(rusle.fatorK.chave).toBe("Alta");
        expect(rusle.fatorK.decisao).toBe("D14");
      }
    });
  });
});
