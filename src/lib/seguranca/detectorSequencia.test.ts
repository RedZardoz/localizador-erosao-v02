import { describe, it, expect } from "vitest";
import path from "path";
import {
  calcularCorrelacaoPearson,
  avaliarCorrelacaoComIndice,
  analisarEstruturaParaSequencias,
  varrerDiretorioParaSequencias,
} from "./detectorSequencia";

describe("Guarda Estrutural F5: Detector de Sequência Monotônica e Correlação com Índice", () => {
  describe("Meta-testes (confirma que o detector NÃO é vacuoso)", () => {
    it("detecta correlação r = +1.0 em progressão aritmética perfeitamente linear", () => {
      const linear = Array.from({ length: 100 }, (_, i) => 10 + i * 0.5);
      const res = avaliarCorrelacaoComIndice(linear, 0.95);
      expect(res.correlacao).toBe(1.0);
      expect(res.suspeito).toBe(true);
    });

    it("detecta correlação r = -1.0 em sequência decrescente pura", () => {
      const decrescente = Array.from({ length: 50 }, (_, i) => 100 - i * 2);
      const res = avaliarCorrelacaoComIndice(decrescente, 0.95);
      expect(res.correlacao).toBe(-1.0);
      expect(res.suspeito).toBe(true);
    });

    it("detecta com precisão a sequência artificial de Ê do achado pericial (0.0701 a 0.0768, r > +0.99)", () => {
      // Simula a progressão encontrada no cache espúrio com 680 entradas
      const serieFabricada = Array.from({ length: 680 }, (_, i) => {
        return Number((0.0701 + (i / 680) * 0.0067).toFixed(4));
      });

      const res = avaliarCorrelacaoComIndice(serieFabricada, 0.95);
      expect(res.correlacao).toBeGreaterThan(0.99);
      expect(res.suspeito).toBe(true);
    });

    it("não dispara falso positivo em dados estocásticos uniformes ou normais", () => {
      // Simula valores que variam aleatoriamente sem correlação com a ordem
      let semente = 42;
      function prng() {
        semente = (semente * 9301 + 49297) % 233280;
        return semente / 233280;
      }
      const aleatorios = Array.from({ length: 200 }, () => Number((0.05 + prng() * 0.25).toFixed(4)));

      const res = avaliarCorrelacaoComIndice(aleatorios, 0.95);
      expect(Math.abs(res.correlacao)).toBeLessThan(0.3);
      expect(res.suspeito).toBe(false);
    });

    it("analisa estruturas JSON complexas com dicionários indexados", () => {
      const jsonFabricado = {
        versao: "2.0",
        itens: {} as Record<string, { soloNu: number; elevacao: number }>,
      };

      for (let i = 0; i < 50; i++) {
        jsonFabricado.itens[`cand-${i}`] = {
          soloNu: 0.1 + i * 0.01, // Fabricado: correlação 1.0 com índice
          elevacao: 500 + Math.sin(i * 1.5) * 50, // Realista: sem correlação linear
        };
      }

      const violacoes = analisarEstruturaParaSequencias(jsonFabricado, "cache_teste.json", 0.95);
      expect(violacoes.length).toBeGreaterThan(0);
      expect(violacoes.some((v) => v.propriedade.includes("soloNu"))).toBe(true);
      expect(violacoes.some((v) => v.propriedade.includes("elevacao"))).toBe(false);
    });
  });

  describe("Varredura pericial sobre os artefatos em docs/verificacoes/", () => {
    it("nenhum artefato JSON ativo em docs/verificacoes deve conter séries numéricas com |r| > 0.95", () => {
      const pastaVerificacoes = path.resolve(process.cwd(), "docs/verificacoes");
      const violacoes = varrerDiretorioParaSequencias(pastaVerificacoes, 0.95);

      if (violacoes.length > 0) {
        const detalhes = violacoes
          .map((v) => `  - ${v.arquivo} [${v.propriedade}]: r = ${v.correlacao} (${v.motivo})`)
          .join("\n");
        expect.fail(`Violação de sequência monotônica artificial encontrada em artefatos:\n${detalhes}`);
      }

      expect(violacoes).toHaveLength(0);
    }, 30000);
  });
});
