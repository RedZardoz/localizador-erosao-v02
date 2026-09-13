import { describe, it, expect } from "vitest";
import {
  converterFracaoDroneParaBinario,
  calcularMatrizConfusao,
  calcularKappaCohen,
  executarValidacaoMatricial,
  assegurarSegregacaoHeldOut,
  PixelValidacao,
} from "./validacaoMatricial";

describe("Validação Matricial Padrão-Ouro (VANT/Drone vs Satélite)", () => {
  describe("converterFracaoDroneParaBinario", () => {
    it("classifica como erosão (1) quando fração atinge ou supera o limiar de 20%", () => {
      expect(converterFracaoDroneParaBinario(20.0, 20.0)).toBe(1);
      expect(converterFracaoDroneParaBinario(45.5, 20.0)).toBe(1);
      expect(converterFracaoDroneParaBinario(100.0, 20.0)).toBe(1);
    });

    it("classifica como controle (0) quando fração está abaixo do limiar", () => {
      expect(converterFracaoDroneParaBinario(19.9, 20.0)).toBe(0);
      expect(converterFracaoDroneParaBinario(5.0, 20.0)).toBe(0);
      expect(converterFracaoDroneParaBinario(0.0, 20.0)).toBe(0);
    });

    it("lança erro se percentual estiver fora de [0, 100]", () => {
      expect(() => converterFracaoDroneParaBinario(-1, 20)).toThrow("Fração de erosão inválida");
      expect(() => converterFracaoDroneParaBinario(101, 20)).toThrow("Fração de erosão inválida");
    });
  });

  describe("calcularMatrizConfusao e calcularKappaCohen", () => {
    it("produz matriz de confusão e Kappa = 1.0 para concordância perfeita", () => {
      const pixels: PixelValidacao[] = [
        { idPixel: "p1", latitude: -25.1, longitude: -54.0, referenciaDrone: 1, predicaoSatelite: 1 },
        { idPixel: "p2", latitude: -25.1, longitude: -54.0, referenciaDrone: 1, predicaoSatelite: 1 },
        { idPixel: "p3", latitude: -25.1, longitude: -54.0, referenciaDrone: 0, predicaoSatelite: 0 },
        { idPixel: "p4", latitude: -25.1, longitude: -54.0, referenciaDrone: 0, predicaoSatelite: 0 },
      ];

      const m = calcularMatrizConfusao(pixels);
      expect(m.tp).toBe(2);
      expect(m.tn).toBe(2);
      expect(m.fp).toBe(0);
      expect(m.fn).toBe(0);
      expect(m.total).toBe(4);

      const kappa = calcularKappaCohen(m.tp, m.fp, m.fn, m.tn);
      expect(kappa).toBe(1.0);
    });

    it("produz Kappa negativo para discordância sistemática total", () => {
      // Satélite inverteu tudo
      const kappa = calcularKappaCohen(0, 50, 50, 0);
      expect(kappa).toBe(-1.0);
    });

    it("retorna 0 para matriz vazia", () => {
      expect(calcularKappaCohen(0, 0, 0, 0)).toBe(0);
    });
  });

  describe("executarValidacaoMatricial", () => {
    it("calcula todas as métricas periciais e razão sub-pixel corretamente", () => {
      const pixels: PixelValidacao[] = [
        // 5 TP
        ...Array.from({ length: 5 }, (_, i) => ({
          idPixel: `tp-${i}`,
          latitude: -25.29,
          longitude: -54.02,
          referenciaDrone: 1 as const,
          predicaoSatelite: 1 as const,
          compartimento: "encosta_escoamento" as const,
        })),
        // 1 FP
        {
          idPixel: "fp-0",
          latitude: -25.29,
          longitude: -54.02,
          referenciaDrone: 0,
          predicaoSatelite: 1,
          compartimento: "encosta_escoamento",
        },
        // 1 FN
        {
          idPixel: "fn-0",
          latitude: -25.29,
          longitude: -54.02,
          referenciaDrone: 1,
          predicaoSatelite: 0,
          compartimento: "topo_estavel",
        },
        // 3 TN
        ...Array.from({ length: 3 }, (_, i) => ({
          idPixel: `tn-${i}`,
          latitude: -25.29,
          longitude: -54.02,
          referenciaDrone: 0 as const,
          predicaoSatelite: 0 as const,
          compartimento: "baixada_deposicao" as const,
        })),
      ];

      const resultado = executarValidacaoMatricial(pixels, {
        gsdDroneCm: 7.5,
        gradeSateliteM: 10.0,
      });

      expect(resultado.totalPixelsAvaliados).toBe(10);
      expect(resultado.matrizConfusao.tp).toBe(5);
      expect(resultado.matrizConfusao.fp).toBe(1);
      expect(resultado.matrizConfusao.fn).toBe(1);
      expect(resultado.matrizConfusao.tn).toBe(3);

      // Acurácia: (5 + 3) / 10 = 0.80
      expect(resultado.acuraciaGlobal).toBe(0.8);
      // Precisão: 5 / (5 + 1) = 0.8333
      expect(resultado.precisao).toBe(0.8333);
      // Sensibilidade: 5 / (5 + 1) = 0.8333
      expect(resultado.sensibilidade).toBe(0.8333);
      // IoU: 5 / (5 + 1 + 1) = 5/7 ≈ 0.7143
      expect(resultado.iouErosao).toBe(0.7143);
      // F1-Score: 2 * 0.8333 * 0.8333 / (0.8333 + 0.8333) = 0.8333
      expect(resultado.f1Score).toBe(0.8333);

      // Razão de sub-pixel: (10m / 0.075m)^2 = (133.33)^2 ≈ 17.778
      expect(resultado.razaoEscalaSubpixel).toBe(17778);
      expect(resultado.papelConjunto).toBe("held-out");

      // Verificação por compartimento topo-sequencial
      expect(resultado.porCompartimento.encosta_escoamento?.totalPixels).toBe(6);
      expect(resultado.porCompartimento.topo_estavel?.totalPixels).toBe(1);
      expect(resultado.porCompartimento.baixada_deposicao?.totalPixels).toBe(3);
    });

    it("rejeita conjunto vazio com exceção clara", () => {
      expect(() =>
        executarValidacaoMatricial([], { gsdDroneCm: 7.5, gradeSateliteM: 10.0 })
      ).toThrow("O conjunto de pixels de validação não pode estar vazio");
    });
  });

  describe("assegurarSegregacaoHeldOut (Invariante Metodológico)", () => {
    it("aprova conjunto com papel declarado 'held-out'", () => {
      expect(() => assegurarSegregacaoHeldOut({ papelConjunto: "held-out" })).not.toThrow();
    });

    it("bloqueia violação com erro se o papel for 'treino' ou outro", () => {
      expect(() => assegurarSegregacaoHeldOut({ papelConjunto: "treino" })).toThrow(
        "VIOLAÇÃO DA LEI FUNDAMENTAL DO SAREL"
      );
      expect(() => assegurarSegregacaoHeldOut({ papelConjunto: "desconhecido" })).toThrow(
        "VIOLAÇÃO DA LEI FUNDAMENTAL DO SAREL"
      );
    });
  });
});
