import { describe, it, expect } from "vitest";
import {
  analisarPoolPorEstrato,
  combinacao,
  calcularProbabilidadeBinomialAcumulada,
  ParametrosAnalisePool,
} from "./poolEstratos";
import { TODOS_ESTRATOS_D12 } from "./estratificacao";

describe("poolEstratos — Análise do Pool por Estrato e Disponibilidade de Reservas (DP-20)", () => {
  describe("Funções matemáticas auxiliares (Binomial pura)", () => {
    it("deve calcular combinação C(n, k) corretamente", () => {
      expect(combinacao(4, 4)).toBe(1);
      expect(combinacao(6, 4)).toBe(15);
      expect(combinacao(6, 5)).toBe(6);
      expect(combinacao(6, 6)).toBe(1);
      expect(combinacao(6, 0)).toBe(1);
      expect(combinacao(6, 7)).toBe(0);
    });

    it("Caso 1 calculado à mão: 4 titulares, 0 reservas (n = 4), p = 0 => P(X >= 4) = 1.0", () => {
      // n = 4 + 0 = 4, p = 0 => 1 - p = 1.0
      const prob = calcularProbabilidadeBinomialAcumulada(4, 4, 1.0);
      expect(prob).toBe(1.0);
    });

    it("Caso 2 calculado à mão: 4 titulares, 0 reservas (n = 4), p = 0.5, nMin = 4 => P(X = 4) = (0.5)^4 = 0.0625", () => {
      const prob = calcularProbabilidadeBinomialAcumulada(4, 4, 0.5);
      expect(prob).toBeCloseTo(0.0625, 6);
    });

    it("Caso 3 calculado à mão: 4 titulares, 2 reservas (n = 6), p = 0.5, nMin = 4 => (15 + 6 + 1)/64 = 22/64 = 0.34375", () => {
      const prob = calcularProbabilidadeBinomialAcumulada(6, 4, 0.5);
      expect(prob).toBeCloseTo(0.34375, 6);
    });
  });

  describe("analisarPoolPorEstrato — 3 casos calculados à mão via função completa", () => {
    it("Caso 1: 4 titulares, 0 reservas, p = 0 => probabilidade 1.0", () => {
      const contagem = { E1: 4 };
      const params: ParametrosAnalisePool = {
        reservasPorEstrato: 0,
        nMinimoPorEstrato: 4,
        taxasRecusa: [0],
      };
      const resultado = analisarPoolPorEstrato(contagem, params);
      const est = resultado.estratos["E1"];
      expect(est.Nh).toBe(4);
      expect(est.N_h).toBe(4);
      expect(est.titularesExigidos).toBe(4);
      expect(est.reservasPossiveis).toBe(0);
      expect(est.reservasEfetivas).toBe(0);
      expect(est.ok).toBe(true);
      expect(est.inviavel).toBe(false);
      expect(est.probabilidadesPorTaxa[0]).toBe(1.0);
    });

    it("Caso 2: 4 titulares, 0 reservas, p = 0.5, nMin = 4 => P(X = 4) = 0.0625", () => {
      const contagem = { E1: 4 };
      const params: ParametrosAnalisePool = {
        reservasPorEstrato: 0,
        nMinimoPorEstrato: 4,
        taxasRecusa: [0.5],
      };
      const resultado = analisarPoolPorEstrato(contagem, params);
      const est = resultado.estratos["E1"];
      expect(est.probabilidadesPorTaxa[0.5]).toBeCloseTo(0.0625, 6);
    });

    it("Caso 3: 4 titulares, 2 reservas, p = 0.5, nMin = 4 => 0.34375", () => {
      const contagem = { E1: 6 };
      const params: ParametrosAnalisePool = {
        reservasPorEstrato: 2,
        nMinimoPorEstrato: 4,
        taxasRecusa: [0.5],
      };
      const resultado = analisarPoolPorEstrato(contagem, params);
      const est = resultado.estratos["E1"];
      expect(est.reservasPossiveis).toBe(2);
      expect(est.reservasEfetivas).toBe(2);
      expect(est.ok).toBe(true);
      expect(est.inviavel).toBe(false);
      expect(est.probabilidadesPorTaxa[0.5]).toBeCloseTo(0.34375, 6);
    });
  });

  describe("Validação de parâmetros obrigatórios (sem padrões embutidos)", () => {
    const contagemValida = { E1: 10 };

    it("lança erro se parametros for nulo ou indefinido", () => {
      // @ts-expect-error teste de robustez em tempo de execução
      expect(() => analisarPoolPorEstrato(contagemValida, null)).toThrowError(
        /PARAMETROS_OBRIGATORIOS/
      );
    });

    it("lança erro se reservasPorEstrato estiver ausente ou inválido", () => {
      // @ts-expect-error teste de ausência
      expect(() => analisarPoolPorEstrato(contagemValida, { nMinimoPorEstrato: 4, taxasRecusa: [0.1] })).toThrowError(
        /reservasPorEstrato/
      );
      expect(() =>
        analisarPoolPorEstrato(contagemValida, {
          reservasPorEstrato: -1,
          nMinimoPorEstrato: 4,
          taxasRecusa: [0.1],
        })
      ).toThrowError(/reservasPorEstrato/);
      expect(() =>
        analisarPoolPorEstrato(contagemValida, {
          reservasPorEstrato: 1.5,
          nMinimoPorEstrato: 4,
          taxasRecusa: [0.1],
        })
      ).toThrowError(/reservasPorEstrato/);
    });

    it("lança erro se nMinimoPorEstrato estiver ausente ou fora de [1..4]", () => {
      // @ts-expect-error teste de ausência
      expect(() => analisarPoolPorEstrato(contagemValida, { reservasPorEstrato: 2, taxasRecusa: [0.1] })).toThrowError(
        /nMinimoPorEstrato/
      );
      expect(() =>
        analisarPoolPorEstrato(contagemValida, {
          reservasPorEstrato: 2,
          nMinimoPorEstrato: 0,
          taxasRecusa: [0.1],
        })
      ).toThrowError(/nMinimoPorEstrato/);
      expect(() =>
        analisarPoolPorEstrato(contagemValida, {
          reservasPorEstrato: 2,
          nMinimoPorEstrato: 5,
          taxasRecusa: [0.1],
        })
      ).toThrowError(/nMinimoPorEstrato/);
    });

    it("lança erro se taxasRecusa estiver ausente, vazia ou com valores fora de [0..1]", () => {
      // @ts-expect-error teste de ausência
      expect(() => analisarPoolPorEstrato(contagemValida, { reservasPorEstrato: 2, nMinimoPorEstrato: 4 })).toThrowError(
        /taxasRecusa/
      );
      expect(() =>
        analisarPoolPorEstrato(contagemValida, {
          reservasPorEstrato: 2,
          nMinimoPorEstrato: 4,
          taxasRecusa: [],
        })
      ).toThrowError(/taxasRecusa/);
      expect(() =>
        analisarPoolPorEstrato(contagemValida, {
          reservasPorEstrato: 2,
          nMinimoPorEstrato: 4,
          taxasRecusa: [-0.1],
        })
      ).toThrowError(/taxasRecusa/);
      expect(() =>
        analisarPoolPorEstrato(contagemValida, {
          reservasPorEstrato: 2,
          nMinimoPorEstrato: 4,
          taxasRecusa: [1.1],
        })
      ).toThrowError(/taxasRecusa/);
    });

    it("lança erro se contagemPorEstrato for inválida", () => {
      const paramsValidos: ParametrosAnalisePool = {
        reservasPorEstrato: 2,
        nMinimoPorEstrato: 4,
        taxasRecusa: [0.2],
      };
      // @ts-expect-error teste de robustez
      expect(() => analisarPoolPorEstrato(null, paramsValidos)).toThrowError(/CONTAGEM/);
      expect(() => analisarPoolPorEstrato({}, paramsValidos)).toThrowError(/CONTAGEM/);
    });
  });

  describe("Condições de fronteira do pool: N_h = 3 e reservas insuficientes", () => {
    it("N_h = 3 marca estrato inviável (inviavel: true, ok: false)", () => {
      const contagem = { E_DEFICIENTE: 3 };
      const params: ParametrosAnalisePool = {
        reservasPorEstrato: 0,
        nMinimoPorEstrato: 4,
        taxasRecusa: [0.1, 0.25],
      };
      const resultado = analisarPoolPorEstrato(contagem, params);
      const est = resultado.estratos["E_DEFICIENTE"];
      expect(est.Nh).toBe(3);
      expect(est.inviavel).toBe(true);
      expect(est.ok).toBe(false);
      expect(est.reservasPossiveis).toBe(0);
      expect(est.reservasEfetivas).toBe(0);
    });

    it("reservasPorEstrato maior que N_h - 4 marca ok: false (embora inviavel seja false se Nh >= 4)", () => {
      const contagem = { E_APERTADO: 5 }; // Nh = 5, reservasPossiveis = 1
      const params: ParametrosAnalisePool = {
        reservasPorEstrato: 3, // Pede 3, mas só há 1 possível
        nMinimoPorEstrato: 4,
        taxasRecusa: [0.2],
      };
      const resultado = analisarPoolPorEstrato(contagem, params);
      const est = resultado.estratos["E_APERTADO"];
      expect(est.Nh).toBe(5);
      expect(est.reservasPossiveis).toBe(1);
      expect(est.reservasEfetivas).toBe(1);
      expect(est.ok).toBe(false); // 5 < 4 + 3
      expect(est.inviavel).toBe(false); // Nh >= 4
    });
  });

  describe("Suporte a todos os 18 estratos canônicos de D12 e declaração metodológica", () => {
    it("avalia os 18 estratos de TODOS_ESTRATOS_D12 e declara a simplificação metodológica", () => {
      const contagem18: Record<string, number> = {};
      for (const e of TODOS_ESTRATOS_D12) {
        contagem18[e] = 8;
      }
      const params: ParametrosAnalisePool = {
        reservasPorEstrato: 2,
        nMinimoPorEstrato: 4,
        taxasRecusa: [0.1, 0.2, 0.3],
      };
      const resultado = analisarPoolPorEstrato(contagem18, params);

      expect(resultado.simplificacaoMetodologica).toContain(
        "A suposição de recusas independentes entre propriedades é uma simplificação metodológica"
      );
      expect(resultado.resumo.totalEstratos).toBe(18);
      expect(resultado.resumo.estratosOk).toBe(18);
      expect(resultado.resumo.estratosInviaveis).toBe(0);

      // Acesso direto por chave de estrato e via .estratos
      for (const e of TODOS_ESTRATOS_D12) {
        expect(resultado[e]).toBeDefined();
        expect(resultado[e].estrato).toBe(e);
        expect(resultado.estratos[e]).toBe(resultado[e]);
        expect(resultado[e].ok).toBe(true);
        expect(resultado[e].reservasEfetivas).toBe(2);
      }
    });
  });
});
