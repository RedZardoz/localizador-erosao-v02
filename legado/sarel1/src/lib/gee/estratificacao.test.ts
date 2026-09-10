import { describe, it, expect } from "vitest";
import {
  avaliarElegibilidadePonto,
  CandidatoPonto,
} from "./elegibilidade";
import {
  executarAmostragemEstratificada,
  CandidatoEstratificacao,
} from "./estratificacao";

describe("Elegibilidade e Estratificação Multivariada (Fase 4 — SAREL)", () => {
  describe("Frame de Elegibilidade (ESA, Relevo, Buffers e Série Mínima)", () => {
    it("aprova ponto agrícola típico dentro de todos os critérios", () => {
      const pontoApto: CandidatoPonto = {
        id: "p1",
        latitude: -25.0,
        longitude: -53.5,
        classeUsoEsa: 40, // Lavoura
        declividadePct: 8.5, // 3% a 20%
        distanciaAguaMetros: 120, // > 30m
        distanciaUrbanoMetros: 500, // > 150m
        nObservacoesValidasSerie: 38, // >= 24
      };
      const res = avaliarElegibilidadePonto(pontoApto);
      expect(res.elegivel).toBe(true);
      expect(res.motivosInaptidao).toHaveLength(0);
    });

    it("rejeita ponto em floresta ou com declividade fora de 3-20%", () => {
      const pontoFloresta: CandidatoPonto = {
        id: "p2",
        latitude: -25.0,
        longitude: -53.5,
        classeUsoEsa: 10, // Floresta
        declividadePct: 2.1, // Abaixo de 3%
        distanciaAguaMetros: 100,
        distanciaUrbanoMetros: 500,
        nObservacoesValidasSerie: 40,
      };
      const res = avaliarElegibilidadePonto(pontoFloresta);
      expect(res.elegivel).toBe(false);
      expect(res.motivosInaptidao.length).toBeGreaterThanOrEqual(2);
    });

    it("rejeita ponto com cobertura temporal insuficiente na série", () => {
      const pontoPoucasObs: CandidatoPonto = {
        id: "p3",
        latitude: -25.0,
        longitude: -53.5,
        classeUsoEsa: 40,
        declividadePct: 10.0,
        distanciaAguaMetros: 100,
        distanciaUrbanoMetros: 500,
        nObservacoesValidasSerie: 12, // Menos de 24!
      };
      const res = avaliarElegibilidadePonto(pontoPoucasObs);
      expect(res.elegivel).toBe(false);
      expect(res.motivosInaptidao[0]).toContain("Cobertura temporal insuficiente");
    });
  });

  describe("Amostragem por Terços Cruzados (S^ x E^ x K^)", () => {
    it("cobre todo o espectro dos 18 estratos, incluindo negativos (S=1, E=1)", () => {
      // Cria 300 candidatos cobrindo gradientes físicos
      const candidatos: CandidatoEstratificacao[] = [];
      for (let i = 0; i < 300; i++) {
        candidatos.push({
          id: `cand-${i}`,
          latitude: -25.0 - (i * 0.001),
          longitude: -53.0 - (i * 0.001),
          declividadePct: 3.0 + (i % 17), // 3% a 20%
          frequenciaSoloNu: (i % 100) / 100, // 0.0 a 1.0
          nivelK: (i % 2 === 0 ? 1 : 2) as 1 | 2,
        });
      }

      const { pontos, relatorio } = executarAmostragemEstratificada(candidatos, 90, 20260908);
      expect(pontos.length).toBeGreaterThanOrEqual(80);

      // Comprovar presença de terço 1, 2 e 3 em declividade
      const tercisS = new Set(pontos.map(p => p.tercilS));
      expect(tercisS.has(1)).toBe(true);
      expect(tercisS.has(2)).toBe(true);
      expect(tercisS.has(3)).toBe(true);

      // Comprovar presença de terço 1, 2 e 3 em frequência de solo nu
      const tercisE = new Set(pontos.map(p => p.tercilE));
      expect(tercisE.has(1)).toBe(true);
      expect(tercisE.has(2)).toBe(true);
      expect(tercisE.has(3)).toBe(true);

      // Comprovar presença de candidatos a negativo (células com S=1 e E=1)
      const candidatosNegativos = pontos.filter(p => p.tercilS === 1 && p.tercilE === 1);
      expect(candidatosNegativos.length).toBeGreaterThan(0);

      // Comprovar que Phi_diag está sempre na faixa [0, 1]
      for (const p of pontos) {
        expect(p.phiDiag).toBeGreaterThanOrEqual(0);
        expect(p.phiDiag).toBeLessThanOrEqual(1);
      }
    });

    it("reproduz exatamente a mesma amostra com a mesma semente (Achado M3)", () => {
      const candidatos: CandidatoEstratificacao[] = Array.from({ length: 60 }, (_, i) => ({
        id: `cand-${i}`,
        latitude: -25.0,
        longitude: -53.0,
        declividadePct: 5 + (i % 10),
        frequenciaSoloNu: 0.1 + (i % 5) * 0.1,
        nivelK: (i % 2 === 0 ? 1 : 2) as 1 | 2,
      }));

      const exec1 = executarAmostragemEstratificada(candidatos, 20, 20260908);
      const exec2 = executarAmostragemEstratificada(candidatos, 20, 20260908);

      expect(exec1.pontos.map(p => p.id)).toEqual(exec2.pontos.map(p => p.id));
      expect(exec1.relatorio.sementeAleatoria).toBe(20260908);
    });
  });
});
