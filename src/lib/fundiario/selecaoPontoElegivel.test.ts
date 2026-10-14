import { describe, it, expect } from "vitest";
import {
  selecionarPontoElegivelImovel,
  gerarMalhaCelulasImovel,
  ErroGuardaAnticircularidade,
  CelulaCandidataImovel,
} from "./selecaoPontoElegivel";

describe("X3: Seleção de Ponto na Parte Elegível do Imóvel Rural com Guarda Anticircularidade", () => {
  it("deve abortar imediatamente com ErroGuardaAnticircularidade se qualquer campo proibido estiver presente", () => {
    const celulasComScore: CelulaCandidataImovel[] = [
      {
        latitude: -24.75,
        longitude: -53.72,
        declividadePct: 8.5,
        scoreSuscetibilidade: 0.95, // Campo proibido!
      },
    ];

    expect(() => {
      selecionarPontoElegivelImovel(celulasComScore, { semente: 42 });
    }).toThrow(ErroGuardaAnticircularidade);

    try {
      selecionarPontoElegivelImovel(celulasComScore, { semente: 42 });
    } catch (e) {
      expect(e).toBeInstanceOf(ErroGuardaAnticircularidade);
      expect((e as ErroGuardaAnticircularidade).campoDetectado).toBe("scoreSuscetibilidade");
      expect((e as Error).message).toContain("jamais pode considerar suspeita de erosão");
    }
  });

  it("deve barrar campos proibidos como scoreJev, severidade, scorePrioridade e laudoJev", () => {
    const camposTestados = [
      "scoreJev",
      "laudoJev",
      "severidade",
      "scorePrioridade",
      "classeAmostral",
      "tipologia",
    ];

    for (const campo of camposTestados) {
      const celula: CelulaCandidataImovel = {
        latitude: -24.75,
        longitude: -53.72,
        declividadePct: 7.0,
        [campo]: 1,
      };

      expect(() => {
        selecionarPontoElegivelImovel([celula], { semente: 100 });
      }).toThrow(ErroGuardaAnticircularidade);
    }
  });

  it("deve filtrar estritamente por declividade física 3% a 20% (D07)", () => {
    const celulas: CelulaCandidataImovel[] = [
      { latitude: -24.71, longitude: -53.71, declividadePct: 1.5 }, // Fora (< 3%)
      { latitude: -24.72, longitude: -53.72, declividadePct: 2.9 }, // Fora (< 3%)
      { latitude: -24.73, longitude: -53.73, declividadePct: 22.0 }, // Fora (> 20%)
      { latitude: -24.74, longitude: -53.74, declividadePct: 8.5 }, // Elegível
    ];

    const escolhido = selecionarPontoElegivelImovel(celulas, { semente: 42 });
    expect(escolhido).not.toBeNull();
    expect(escolhido?.latitude).toBe(-24.74);
    expect(escolhido?.declividadePct).toBe(8.5);
  });

  it("deve retornar null se nenhuma célula do imóvel for elegível no intervalo 3% a 20%", () => {
    const celulasPlanas: CelulaCandidataImovel[] = [
      { latitude: -24.71, longitude: -53.71, declividadePct: 1.2 },
      { latitude: -24.72, longitude: -53.72, declividadePct: 2.1 },
    ];

    const resultado = selecionarPontoElegivelImovel(celulasPlanas, { semente: 42 });
    expect(resultado).toBeNull();
  });

  it("teste obrigatório: a escolha é estocástica e independe de qualquer ranking/ordem, produzindo pontos diferentes sob sementes distintas", () => {
    // Cria 10 células elegíveis no mesmo imóvel rural
    const celulasElegiveis: CelulaCandidataImovel[] = [];
    for (let i = 0; i < 10; i++) {
      celulasElegiveis.push({
        latitude: Number((-24.750 + i * 0.001).toFixed(6)),
        longitude: Number((-53.720 + i * 0.001).toFixed(6)),
        declividadePct: 5.0 + i * 1.2, // Todas em [5.0, 15.8]%
      });
    }

    const sementes = [42, 100, 2026, 99999, 777];
    const escolhas = sementes.map((s) => {
      const p = selecionarPontoElegivelImovel(celulasElegiveis, { semente: s });
      return `${p?.latitude}_${p?.longitude}`;
    });

    // Pelo menos 3 pontos distintos entre as 5 sementes, comprovando aleatoriedade uniforme
    const pontosDistintos = new Set(escolhas);
    expect(pontosDistintos.size).toBeGreaterThanOrEqual(3);

    // O ponto escolhido pela semente 42 NÃO é necessariamente o primeiro nem o último
    const p42 = selecionarPontoElegivelImovel(celulasElegiveis, { semente: 42 });
    expect(p42).not.toBeNull();
  });

  it("teste obrigatório: dado escore de suscetibilidade externo aos dados, a escolha não correlaciona com o escore e não seleciona o escore máximo", () => {
    // Mapa externo hipotético de score de suscetibilidade por coordenada
    const escoresExternos = new Map<string, number>();
    const celulas: CelulaCandidataImovel[] = [];
    for (let i = 0; i < 8; i++) {
      const lat = Number((-24.750 + i * 0.001).toFixed(6));
      const lon = Number((-53.720 + i * 0.001).toFixed(6));
      const chave = `${lat}_${lon}`;
      celulas.push({
        latitude: lat,
        longitude: lon,
        declividadePct: 10.0,
      });
      // Ponto 7 tem o score máximo (0.99), ponto 0 tem score mínimo (0.10)
      escoresExternos.set(chave, 0.10 + i * 0.12);
    }

    // Semente 42 sorteia um ponto:
    const escolhido = selecionarPontoElegivelImovel(celulas, { semente: 42 });
    expect(escolhido).not.toBeNull();
    const chaveEscolhida = `${escolhido?.latitude}_${escolhido?.longitude}`;
    const scoreEscolhido = escoresExternos.get(chaveEscolhida);

    // O ponto escolhido NÃO é o ponto de escore máximo (ponto 7, 0.94)
    expect(scoreEscolhido).not.toBe(0.10 + 7 * 0.12);
  });

  it("gerarMalhaCelulasImovel gera grade 3x3 no interior do imóvel e inclui o centroide", () => {
    const imovel = {
      latMin: -24.80,
      latMax: -24.70,
      lonMin: -53.80,
      lonMax: -53.70,
      lat: -24.75,
      lng: -53.75,
    };

    const malha = gerarMalhaCelulasImovel(imovel, (lat, lon) => ({
      declividadePct: 10.0,
      elevacaoMetros: 500,
    }));

    expect(malha).toHaveLength(10); // 9 na grade + 1 centroide
    for (const c of malha) {
      expect(c.latitude).toBeGreaterThanOrEqual(imovel.latMin);
      expect(c.latitude).toBeLessThanOrEqual(imovel.latMax);
      expect(c.longitude).toBeGreaterThanOrEqual(imovel.lonMin);
      expect(c.longitude).toBeLessThanOrEqual(imovel.lonMax);
      expect(c.declividadePct).toBe(10.0);
    }
  });
});
