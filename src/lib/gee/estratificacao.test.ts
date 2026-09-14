import { describe, it, expect } from "vitest";
import {
  executarAmostragemEstratificada,
  calcularLimiaresTercis,
  classificarTercil,
  CandidatoEstratificacao,
} from "./estratificacao";

describe("Limiares de Quantis e Tercis", () => {
  it("deve calcular limiares de 33.3% e 66.7% corretamente", () => {
    // 9 valores: 10, 20, 30, 40, 50, 60, 70, 80, 90
    const vals = [10, 20, 30, 40, 50, 60, 70, 80, 90];
    const lim = calcularLimiaresTercis(vals);
    expect(lim.t1).toBe(30);
    expect(lim.t2).toBe(70);

    expect(classificarTercil(20, lim)).toBe(1);
    expect(classificarTercil(50, lim)).toBe(2);
    expect(classificarTercil(85, lim)).toBe(3);
  });
});

describe("Amostragem Estratificada no Espaço Ŝ × Ê × K̂ (§10.6)", () => {
  // Cria 180 candidatos sintéticos distribuídos nos 18 estratos
  function gerarCandidatos(): CandidatoEstratificacao[] {
    const lista: CandidatoEstratificacao[] = [];
    let id = 1;
    for (let s = 1; s <= 3; s++) {
      for (let e = 1; e <= 3; e++) {
        for (const k of [1, 2] as const) {
          // 10 candidatos por estrato
          for (let i = 0; i < 10; i++) {
            lista.push({
              id: `cand-${id++}`,
              latitude: -25.0 - s * 0.1,
              longitude: -50.0 - e * 0.1,
              declividadePct: s * 5.0 + (i * 0.1), // s=1 -> ~5%, s=2 -> ~10%, s=3 -> ~15%
              frequenciaSoloNu: e * 0.25 + (i * 0.01), // e=1 -> ~0.25, e=2 -> ~0.50, e=3 -> ~0.75
              nivelK: k,
            });
          }
        }
      }
    }
    return lista;
  }

  it("amostra deve cobrir todos os terços de cada dimensão (incluindo baixos/negativos)", () => {
    const candidatos = gerarCandidatos();
    const resultado = executarAmostragemEstratificada(candidatos, 36, 42);

    expect(resultado.pontos.length).toBeLessThanOrEqual(36);
    expect(resultado.pontos.length).toBeGreaterThan(0);

    const tercisS = new Set(resultado.pontos.map(p => p.criterioSelecao.tercilS));
    const tercisE = new Set(resultado.pontos.map(p => p.criterioSelecao.tercilE));
    const niveisK = new Set(resultado.pontos.map(p => p.criterioSelecao.nivelK));

    // Garante cobertura de todos os terços (1, 2 e 3)
    expect(tercisS.has(1)).toBe(true);
    expect(tercisS.has(2)).toBe(true);
    expect(tercisS.has(3)).toBe(true);

    expect(tercisE.has(1)).toBe(true);
    expect(tercisE.has(2)).toBe(true);
    expect(tercisE.has(3)).toBe(true);

    expect(niveisK.has(1)).toBe(true);
    expect(niveisK.has(2)).toBe(true);
  });

  it("mesma semente deve reproduzir exatamente a mesma amostra (Achado M3 / P07)", () => {
    const candidatos = gerarCandidatos();
    const res1 = executarAmostragemEstratificada(candidatos, 36, 12345);
    const res2 = executarAmostragemEstratificada(candidatos, 36, 12345);

    expect(res1.pontos.map(p => p.id)).toEqual(res2.pontos.map(p => p.id));
    expect(res1.pontos.map(p => p.codigo)).toEqual(res2.pontos.map(p => p.codigo));
  });

  it("deve atribuir phiDiag como null quando uma dimensão tem amplitude zero (§3.5)", () => {
    // Todos os pontos com a MESMA declividade (amplitude S = 0)
    const candidatosPlanos: CandidatoEstratificacao[] = Array.from({ length: 10 }, (_, i) => ({
      id: `p-${i}`,
      latitude: -25.0,
      longitude: -50.0 + i * 0.01,
      declividadePct: 5.0, // Constante!
      frequenciaSoloNu: 0.1 * i,
      nivelK: 1,
    }));

    const res = executarAmostragemEstratificada(candidatosPlanos, 5, 42);
    expect(res.pontos.length).toBeGreaterThan(0);
    for (const p of res.pontos) {
      expect(p.criterioSelecao.phiDiag).toBeNull(); // NUNCA 0.5 inventado!
    }
  });

  it("total de pontos amostrados não deve exceder a meta", () => {
    const candidatos = gerarCandidatos();
    const res = executarAmostragemEstratificada(candidatos, 15, 42);
    expect(res.pontos.length).toBeLessThanOrEqual(15);
  });

  it("deve registrar déficit quando estrato não tiver candidatos suficientes", () => {
    // Apenas 2 candidatos para uma meta de 10
    const poucos: CandidatoEstratificacao[] = [
      { id: "c1", latitude: -25.0, longitude: -50.0, declividadePct: 5.0, frequenciaSoloNu: 0.2, nivelK: 1 },
      { id: "c2", latitude: -25.1, longitude: -50.1, declividadePct: 15.0, frequenciaSoloNu: 0.8, nivelK: 2 },
    ];

    const res = executarAmostragemEstratificada(poucos, 10, 42);
    expect(res.pontos.length).toBe(2);
    expect(res.relatorio.deficitTotal).toBeGreaterThan(0);
  });
});
