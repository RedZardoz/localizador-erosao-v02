import { describe, it, expect } from "vitest";
import {
  DECISOES,
  exigirParametro,
  ErroDecisaoPendente,
  ErroParametroAusente,
  Decisao,
} from "./decisoes";
import { classificarPontoEspectral, CRITERIOS_ESPECTRAIS } from "../lib/gee/amostragemBiofisica";
import {
  analisarPersistenciaTemporal,
  OPCOES_PERSISTENCIA_PADRAO,
} from "../lib/gee/persistenciaTemporal";
import { ObservacaoCena } from "../lib/gee/serieTemporal";

describe("Governança — Fonte Única de Parâmetros e Acessor fail-closed (GOV-3)", () => {
  describe("Acessor exigirParametro", () => {
    it("recusa decisão pendente ou proposta com ErroDecisaoPendente", () => {
      const decisaoProposta: Decisao<unknown> = {
        id: "P_TESTE",
        titulo: "Parâmetro Proposto",
        estado: "proposta",
      };
      expect(() => exigirParametro(decisaoProposta, "qualquer")).toThrow(
        ErroDecisaoPendente
      );

      const decisaoPendente: Decisao<unknown> = {
        id: "D_PEND",
        titulo: "Parâmetro Pendente",
        estado: "pendente",
      };
      expect(() => exigirParametro(decisaoPendente, "qualquer")).toThrow(
        ErroDecisaoPendente
      );
    });

    it("recusa chave inexistente em decisão decidida com ErroParametroAusente", () => {
      expect(() => exigirParametro(DECISOES.D02, "chaveNaoExistente")).toThrow(
        ErroParametroAusente
      );
      expect(() => exigirParametro(DECISOES.D10, "chaveNaoExistente")).toThrow(
        ErroParametroAusente
      );
    });

    it("retorna valor e operador exatos para D02 e D10", () => {
      const bsiMin = exigirParametro(DECISOES.D02, "bsiMin");
      expect(bsiMin.valor).toBe(0.10);
      expect(bsiMin.operador).toBe(">");

      const ndviMax = exigirParametro(DECISOES.D02, "ndviMax");
      expect(ndviMax.valor).toBe(0.40);
      expect(ndviMax.operador).toBe("<");

      const bsiMax = exigirParametro(DECISOES.D02, "bsiMax");
      expect(bsiMax.valor).toBe(0.00);
      expect(bsiMax.operador).toBe("<");

      const ndviMin = exigirParametro(DECISOES.D02, "ndviMin");
      expect(ndviMin.valor).toBe(0.65);
      expect(ndviMin.operador).toBe(">");

      const ndviSoloNu = exigirParametro(DECISOES.D10, "ndviSoloNu");
      expect(ndviSoloNu.valor).toBe(0.25);
      expect(ndviSoloNu.operador).toBe("<=");
    });
  });

  describe("Comportamento na fronteira — D02 (Triagem Espectral de Candidatos)", () => {
    it("alimenta CRITERIOS_ESPECTRAIS a partir de exigirParametro sem divergência de valor", () => {
      expect(CRITERIOS_ESPECTRAIS.EROSAO.BSI_MIN).toBe(0.10);
      expect(CRITERIOS_ESPECTRAIS.EROSAO.NDVI_MAX).toBe(0.40);
      expect(CRITERIOS_ESPECTRAIS.CONTROLE.BSI_MAX).toBe(0.00);
      expect(CRITERIOS_ESPECTRAIS.CONTROLE.NDVI_MIN).toBe(0.65);
    });

    it("respeita operador estrito '>' em bsiMin: exatamente na fronteira (0.10) NÃO classifica como erosao", () => {
      // bsi = 0.10 (na fronteira), ndvi = 0.35 (< 0.40)
      expect(classificarPontoEspectral(0.10, 0.35)).toBe("indefinido");
      // bsi = 0.1001 (> 0.10)
      expect(classificarPontoEspectral(0.1001, 0.35)).toBe("erosao");
    });

    it("respeita operador estrito '<' em ndviMax: exatamente na fronteira (0.40) NÃO classifica como erosao", () => {
      // bsi = 0.20 (> 0.10), ndvi = 0.40 (na fronteira)
      expect(classificarPontoEspectral(0.20, 0.40)).toBe("indefinido");
      // ndvi = 0.3999 (< 0.40)
      expect(classificarPontoEspectral(0.20, 0.3999)).toBe("erosao");
    });

    it("respeita operador estrito '<' em bsiMax: exatamente na fronteira (0.00) NÃO classifica como controle", () => {
      // bsi = 0.00 (na fronteira), ndvi = 0.70 (> 0.65)
      expect(classificarPontoEspectral(0.00, 0.70)).toBe("indefinido");
      // bsi = -0.0001 (< 0.00)
      expect(classificarPontoEspectral(-0.0001, 0.70)).toBe("controle");
    });

    it("respeita operador estrito '>' em ndviMin: exatamente na fronteira (0.65) NÃO classifica como controle", () => {
      // bsi = -0.10 (< 0.00), ndvi = 0.65 (na fronteira)
      expect(classificarPontoEspectral(-0.10, 0.65)).toBe("indefinido");
      // ndvi = 0.6501 (> 0.65)
      expect(classificarPontoEspectral(-0.10, 0.6501)).toBe("controle");
    });
  });

  describe("Comportamento na fronteira — D10 (Solo Descoberto do Preditor Ê)", () => {
    function gerarCenasFronteira(ndviAlvo: number): ObservacaoCena[] {
      // Gera 6 cenas (mínimo exigido por D11) com NDVI exato
      // NDVI = (b8 - b4)/(b8 + b4) -> se b4 = 0.1, b8 = 0.1 * (1 + ndvi) / (1 - ndvi)
      const b4 = 0.1;
      const b8 = Number(((0.1 * (1 + ndviAlvo)) / (1 - ndviAlvo)).toFixed(6));
      return Array.from({ length: 6 }, (_, i) => ({
        data: `2024-0${i + 1}-15`,
        tAnos: 2024 + i / 12,
        productId: `CENA_FRONTEIRA_${i}`,
        nuvemSombra: false,
        b2: 0.05,
        b3: null,
        b4,
        b5: null,
        b6: null,
        b7: null,
        b8,
        b8a: null,
        b11: 0.15,
        b12: 0.20,
      }));
    }

    it("alimenta OPCOES_PERSISTENCIA_PADRAO a partir de D10 sem divergência de valor", () => {
      expect(OPCOES_PERSISTENCIA_PADRAO.limiarNdviSoloNu).toBe(0.25);
    });

    it("respeita operador inclusivo '<=' em ndviSoloNu: exatamente na fronteira (0.25) CLASSIFICA como solo nu", () => {
      // ndvi = 0.25: com <= 0.25, todas as 6 cenas devem ser classificadas como solo nu (frequência = 1.0)
      const cenasFronteira = gerarCenasFronteira(0.25);
      const diagFronteira = analisarPersistenciaTemporal(cenasFronteira);
      expect(diagFronteira.frequenciaExposicao).toBe(1.0);

      // ndvi = 0.2501 (> 0.25): com <= 0.25, nenhuma cena deve ser classificada como solo nu (frequência = 0.0)
      const cenasAcima = gerarCenasFronteira(0.2501);
      const diagAcima = analisarPersistenciaTemporal(cenasAcima);
      expect(diagAcima.frequenciaExposicao).toBe(0.0);
    });
  });
});
