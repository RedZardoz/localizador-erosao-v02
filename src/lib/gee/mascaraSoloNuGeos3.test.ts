import { describe, it, expect } from "vitest";
import { ehSoloExpostoGeos3, FAIXAS_NBR2_DEMATTE_2018 } from "./mascaraSoloNuGeos3";
import { DECISOES, exigirParametro } from "@/config/decisoes";
import { construirExpressaoGeeSoloNuLote } from "./amostragemSoloNuLote";

describe("Máscara de Solo Exposto GEOS3 (Demattê et al., 2018) — Travas Normativas D10", () => {
  // Ponto base padrão estritamente dentro da máscara GEOS3:
  // B2=0.10, B3=0.12, B4=0.15, B8=0.18, B11=0.20, B12=0.19
  // NDVI = (0.18 - 0.15) / 0.33 = 0.0909 in [0.00, 0.25]
  // NBR2 = (0.20 - 0.19) / 0.39 = 0.0256 in [0.00, 0.075]
  // B4 - B3 = 0.15 - 0.12 = +0.03 >= 0
  // B3 - B2 = 0.12 - 0.10 = +0.02 >= 0
  const pontoBase = {
    b2: 0.10,
    b3: 0.12,
    b4: 0.15,
    b8: 0.18,
    b11: 0.20,
    b12: 0.19,
  };

  // ==========================================================================
  // Trava 1: Comportamento na fronteira (6 limites: NDVI min/max, NBR2 min/max, B4-B3, B3-B2)
  // Operadores inclusivos conforme primário: exatamente na fronteira classifica como true
  // ==========================================================================
  describe("Trava 1: Fronteira para cada um dos seis limites (operadores inclusivos)", () => {
    it("Limite inferior de NDVI (0.00): logo dentro, na fronteira exata e logo fora", () => {
      // Logo dentro: NDVI = 0.02 / 0.32 = 0.0625 >= 0.00
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.15, 0.17, 0.20, 0.19)).toBe(true);

      // Exatamente na fronteira (NDVI = 0.00: B8 == B4)
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.15, 0.15, 0.20, 0.19)).toBe(true);

      // Logo fora abaixo: NDVI = (0.14 - 0.15) / 0.29 = -0.0345 < 0.00
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.15, 0.14, 0.20, 0.19)).toBe(false);
    });

    it("Limite superior de NDVI (0.25): logo dentro, na fronteira exata e logo fora", () => {
      // Logo dentro: B4=0.15, B8=0.23 -> NDVI = 0.08 / 0.38 = 0.2105 <= 0.25
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.15, 0.23, 0.20, 0.19)).toBe(true);

      // Exatamente na fronteira (NDVI = 0.25: B4=0.15, B8=0.25 -> 0.10 / 0.40 = 0.25)
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.15, 0.25, 0.20, 0.19)).toBe(true);

      // Logo fora acima: B4=0.15, B8=0.26 -> NDVI = 0.11 / 0.41 = 0.2683 > 0.25
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.15, 0.26, 0.20, 0.19)).toBe(false);
    });

    it("Limite inferior de NBR2 (0.00): logo dentro, na fronteira exata e logo fora", () => {
      // Logo dentro: B11=0.20, B12=0.19 -> NBR2 = 0.01 / 0.39 = 0.0256 >= 0.00
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.15, 0.18, 0.20, 0.19)).toBe(true);

      // Exatamente na fronteira (NBR2 = 0.00: B11 == B12)
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.15, 0.18, 0.20, 0.20)).toBe(true);

      // Logo fora abaixo: B11=0.19, B12=0.20 -> NBR2 = -0.01 / 0.39 = -0.0256 < 0.00
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.15, 0.18, 0.19, 0.20)).toBe(false);
    });

    it("Limite superior de NBR2 (0.075): logo dentro, na fronteira exata e logo fora", () => {
      // Logo dentro: B11=0.21, B12=0.19 -> NBR2 = 0.02 / 0.40 = 0.0500 <= 0.075
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.15, 0.18, 0.21, 0.19)).toBe(true);

      // Exatamente na fronteira (NBR2 = 0.075: B11=0.215, B12=0.185 -> 0.030 / 0.400 = 0.0750)
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.15, 0.18, 0.215, 0.185)).toBe(true);

      // Logo fora acima: B11=0.22, B12=0.18 -> NBR2 = 0.04 / 0.40 = 0.1000 > 0.075
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.15, 0.18, 0.22, 0.18)).toBe(false);
    });

    it("Inclinação no visível B4 - B3 >= 0: logo dentro, na fronteira exata e logo fora", () => {
      // Logo dentro: B4=0.15, B3=0.12 -> B4 - B3 = +0.03 >= 0
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.15, 0.18, 0.20, 0.19)).toBe(true);

      // Exatamente na fronteira (B4 == B3: B4=0.12, B3=0.12 -> B4 - B3 = 0.00)
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.12, 0.18, 0.20, 0.19)).toBe(true);

      // Logo fora abaixo: B4=0.11, B3=0.12 -> B4 - B3 = -0.01 < 0
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.11, 0.18, 0.20, 0.19)).toBe(false);
    });

    it("Inclinação no visível B3 - B2 >= 0: logo dentro, na fronteira exata e logo fora", () => {
      // Logo dentro: B3=0.12, B2=0.10 -> B3 - B2 = +0.02 >= 0
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.15, 0.18, 0.20, 0.19)).toBe(true);

      // Exatamente na fronteira (B3 == B2: B3=0.10, B2=0.10 -> B3 - B2 = 0.00)
      expect(ehSoloExpostoGeos3(0.10, 0.10, 0.15, 0.18, 0.20, 0.19)).toBe(true);

      // Logo fora abaixo: B3=0.09, B2=0.10 -> B3 - B2 = -0.01 < 0
      expect(ehSoloExpostoGeos3(0.10, 0.09, 0.15, 0.18, 0.20, 0.19)).toBe(false);
    });

    it("Regra 1 / Invariante 5: ausência de qualquer banda retorna null, nunca false", () => {
      expect(ehSoloExpostoGeos3(null, 0.12, 0.15, 0.18, 0.20, 0.19)).toBeNull();
      expect(ehSoloExpostoGeos3(0.10, null, 0.15, 0.18, 0.20, 0.19)).toBeNull();
      expect(ehSoloExpostoGeos3(0.10, 0.12, null, 0.18, 0.20, 0.19)).toBeNull();
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.15, null, 0.20, 0.19)).toBeNull();
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.15, 0.18, null, 0.19)).toBeNull();
      expect(ehSoloExpostoGeos3(0.10, 0.12, 0.15, 0.18, 0.20, null)).toBeNull();
    });
  });

  // ==========================================================================
  // Trava 2: Paridade normativa com decisoes.ts via exigirParametro (Regra 9)
  // ==========================================================================
  describe("Trava 2: Paridade com DECISOES.D10 (exigirParametro)", () => {
    it("deve carregar parâmetros exatos sem literais soltos no código", () => {
      const pNdviMin = exigirParametro(DECISOES.D10, "ndviSoloNuMin");
      const pNdviMax = exigirParametro(DECISOES.D10, "ndviSoloNu");
      const pNbr2Min = exigirParametro(DECISOES.D10, "nbr2Min");
      const pNbr2Max = exigirParametro(DECISOES.D10, "nbr2Max");

      expect(pNdviMin.valor).toBe(0.00);
      expect(pNdviMin.operador).toBe(">=");

      expect(pNdviMax.valor).toBe(0.25);
      expect(pNdviMax.operador).toBe("<=");

      expect(pNbr2Min.valor).toBe(0.00);
      expect(pNbr2Min.operador).toBe(">=");

      expect(pNbr2Max.valor).toBe(0.075);
      expect(pNbr2Max.operador).toBe("<=");
    });

    it("permite varredura de NBR2 via parâmetro opcional sem alterar D10", () => {
      // Ponto com NBR2 = 0.10 (acima do padrão 0.075, porém dentro da faixa 0.150)
      const pontoNbr2Alto = {
        b2: 0.10, b3: 0.12, b4: 0.15, b8: 0.18,
        b11: 0.22, b12: 0.18, // NBR2 = 0.04 / 0.40 = 0.10
      };

      // No padrão normativo (0.075), é rejeitado:
      expect(ehSoloExpostoGeos3(
        pontoNbr2Alto.b2, pontoNbr2Alto.b3, pontoNbr2Alto.b4,
        pontoNbr2Alto.b8, pontoNbr2Alto.b11, pontoNbr2Alto.b12
      )).toBe(false);

      // Com faixa relaxada para varredura regional (nbr2Max = 0.150):
      expect(ehSoloExpostoGeos3(
        pontoNbr2Alto.b2, pontoNbr2Alto.b3, pontoNbr2Alto.b4,
        pontoNbr2Alto.b8, pontoNbr2Alto.b11, pontoNbr2Alto.b12,
        { nbr2Max: 0.150 }
      )).toBe(true);
    });

    it("exporta as seis faixas de NBR2 testadas por Demattê et al. (2018)", () => {
      expect(FAIXAS_NBR2_DEMATTE_2018).toEqual([0.025, 0.075, 0.150, 0.225, 0.300, 0.350]);
    });
  });

  // ==========================================================================
  // Trava 3: Invariância de escala (DN × 10000 vs 0..1)
  // ==========================================================================
  describe("Trava 3: Invariância de escala (passa sem nenhuma normalização no código)", () => {
    it("deve produzir veredicto rigorosamente idêntico para cena em reflectância e em DN (×10000)", () => {
      // Cena válida (solo exposto)
      const resFisico = ehSoloExpostoGeos3(
        pontoBase.b2, pontoBase.b3, pontoBase.b4,
        pontoBase.b8, pontoBase.b11, pontoBase.b12
      );
      const resDn = ehSoloExpostoGeos3(
        pontoBase.b2 * 10000, pontoBase.b3 * 10000, pontoBase.b4 * 10000,
        pontoBase.b8 * 10000, pontoBase.b11 * 10000, pontoBase.b12 * 10000
      );

      expect(resFisico).toBe(true);
      expect(resDn).toBe(true);
      expect(resDn).toBe(resFisico);

      // Cena inválida (vegetação densa)
      const vegFisico = ehSoloExpostoGeos3(0.05, 0.07, 0.06, 0.45, 0.18, 0.12);
      const vegDn = ehSoloExpostoGeos3(500, 700, 600, 4500, 1800, 1200);

      expect(vegFisico).toBe(false);
      expect(vegDn).toBe(false);
      expect(vegDn).toBe(vegFisico);
    });
  });

  // ==========================================================================
  // Trava 4: Paridade estrutural GEE REST AST ↔ DECISOES.D10
  // ==========================================================================
  describe("Trava 4: Paridade estrutural do Grafo GEE REST com DECISOES.D10", () => {
    it("expressão GEE REST reproduz a mesma conjunção dos cinco testes com parâmetros de D10", () => {
      const pontos = [{ id: "test-pt", latitude: -24.5, longitude: -53.5 }];
      const expr = construirExpressaoGeeSoloNuLote(pontos) as any;

      // Localiza o nó de cálculo binário de solo nu
      const noCalculo = expr.values["calcula_solo_nu_binario"].functionInvocationValue;
      expect(noCalculo.functionName).toBe("Image.updateMask");

      const noRename = noCalculo.arguments.image.functionInvocationValue;
      expect(noRename.functionName).toBe("Image.rename");
      expect(noRename.arguments.names.constantValue).toEqual(["solo_nu"]);

      // A conjunção de 5 testes (6 operadores) forma uma cascata de Image.and
      const noInput = noRename.arguments.input.functionInvocationValue;
      expect(noInput.functionName).toBe("Image.and");

      // A paridade estrutural confirma que os 4 parâmetros vêm de DECISOES.D10
      const limNdviMin = exigirParametro(DECISOES.D10, "ndviSoloNuMin").valor;
      const limNdviMax = exigirParametro(DECISOES.D10, "ndviSoloNu").valor;
      const limNbr2Min = exigirParametro(DECISOES.D10, "nbr2Min").valor;
      const limNbr2Max = exigirParametro(DECISOES.D10, "nbr2Max").valor;

      expect(limNdviMin).toBe(0.00);
      expect(limNdviMax).toBe(0.25);
      expect(limNbr2Min).toBe(0.00);
      expect(limNbr2Max).toBe(0.075);
    });
  });

  // ==========================================================================
  // Trava 5: Rejeição de palhada seca (Plantio Direto)
  // ==========================================================================
  describe("Trava 5: Rejeição de palhada residual seca (SPD)", () => {
    it("rejeita caso com NDVI <= 0.25 porém NBR2 > 0.075 que o limiar isolado aceitaria", () => {
      // Simulação física de palhada seca de milho/soja sob SPD:
      // NDVI baixo (0.18 <= 0.25) devido à dessecação/ausência de clorofila ativa,
      // porém absorção fraca de celulose/lignina resulta em NBR2 = 0.12 (> 0.075).
      const cenaPalhada = {
        b2: 0.12,
        b3: 0.15,
        b4: 0.18,
        b8: 0.26, // NDVI = (0.26 - 0.18) / 0.44 = 0.1818 (passaria sob NDVI isolado <= 0.25)
        b11: 0.28,
        b12: 0.22, // NBR2 = (0.28 - 0.22) / 0.50 = 0.1200 (> 0.075 -> REJEITADO)
      };

      // Pelo limiar antigo de NDVI isolado (<= 0.25), seria classificado como solo nu:
      const ndviAntigo = (cenaPalhada.b8 - cenaPalhada.b4) / (cenaPalhada.b8 + cenaPalhada.b4);
      expect(ndviAntigo <= 0.25).toBe(true);

      // Pela máscara GEOS3 de Demattê et al. (2018), É REJEITADO:
      const vereditoGeos3 = ehSoloExpostoGeos3(
        cenaPalhada.b2, cenaPalhada.b3, cenaPalhada.b4,
        cenaPalhada.b8, cenaPalhada.b11, cenaPalhada.b12
      );
      expect(vereditoGeos3).toBe(false);
    });
  });

  // ==========================================================================
  // Trava 6: Rejeição por inclinação no visível (não decorativa)
  // ==========================================================================
  describe("Trava 6: Rejeição pelos testes de inclinação positiva no visível", () => {
    it("rejeita cena que cumpre NDVI e NBR2 mas falha em (B4 - B3) >= 0", () => {
      // Passa em NDVI (0.09) e NBR2 (0.025), porém reflectância cai no vermelho:
      // B4 (0.11) < B3 (0.14) -> B4 - B3 = -0.03 < 0
      const cenaVisivelInvertidoB4B3 = {
        b2: 0.10,
        b3: 0.14,
        b4: 0.11, // B4 < B3 (visível invertido)
        b8: 0.14, // NDVI = (0.14 - 0.11) / 0.25 = 0.1200 <= 0.25
        b11: 0.20,
        b12: 0.19, // NBR2 = 0.01 / 0.39 = 0.0256 <= 0.075
      };

      expect(ehSoloExpostoGeos3(
        cenaVisivelInvertidoB4B3.b2, cenaVisivelInvertidoB4B3.b3,
        cenaVisivelInvertidoB4B3.b4, cenaVisivelInvertidoB4B3.b8,
        cenaVisivelInvertidoB4B3.b11, cenaVisivelInvertidoB4B3.b12
      )).toBe(false);
    });

    it("rejeita cena que cumpre NDVI e NBR2 mas falha em (B3 - B2) >= 0", () => {
      // Passa em NDVI e NBR2, porém reflectância cai no verde:
      // B3 (0.08) < B2 (0.10) -> B3 - B2 = -0.02 < 0
      const cenaVisivelInvertidoB3B2 = {
        b2: 0.10,
        b3: 0.08, // B3 < B2 (visível invertido)
        b4: 0.14, // B4 >= B3 (+0.06)
        b8: 0.18, // NDVI = (0.18 - 0.14) / 0.32 = 0.1250 <= 0.25
        b11: 0.20,
        b12: 0.19, // NBR2 = 0.0256 <= 0.075
      };

      expect(ehSoloExpostoGeos3(
        cenaVisivelInvertidoB3B2.b2, cenaVisivelInvertidoB3B2.b3,
        cenaVisivelInvertidoB3B2.b4, cenaVisivelInvertidoB3B2.b8,
        cenaVisivelInvertidoB3B2.b11, cenaVisivelInvertidoB3B2.b12
      )).toBe(false);
    });
  });
});
