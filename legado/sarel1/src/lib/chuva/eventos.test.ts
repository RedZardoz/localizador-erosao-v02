import { describe, it, expect } from "vitest";
import { calcularAcumuladosChuva } from "./chirps";
import { extrairI30Maximo } from "./imerg";
import {
  detectarEventosErosivos,
  calcularIndiceMecanismo,
  construirBlocoChuva,
} from "./eventos";

describe("Processamento de Chuva e Eventos Erosivos (src/lib/chuva)", () => {
  describe("CHIRPS diário e acumulados", () => {
    it("calcula acumulados de 30d e 90d corretamente", () => {
      // 90 dias de chuva com 5 mm/dia
      const serie = Array.from({ length: 90 }, (_, i) => ({
        data: `2026-06-${String((i % 30) + 1).padStart(2, "0")}`,
        precipitacaoMm: 5.0,
      }));

      const res = calcularAcumuladosChuva(serie);
      expect(res.acum30d).toBe(150.0); // 30 * 5
      expect(res.acum90d).toBe(450.0); // 90 * 5
      expect(res.diasValidos).toBe(90);
    });

    it("retorna null se a série for menor que o requisito mínimo de amostragem", () => {
      const serieCurta = [{ data: "2026-06-01", precipitacaoMm: 10.0 }];
      const res = calcularAcumuladosChuva(serieCurta);
      expect(res.acum30d).toBeNull();
      expect(res.acum90d).toBeNull();
    });
  });

  describe("GPM IMERG sub-horário", () => {
    it("extrai I30 máximo verdadeiro", () => {
      const registros = [
        { timestamp: "2026-06-01T12:00:00Z", taxaMmH: 5.2 },
        { timestamp: "2026-06-01T12:30:00Z", taxaMmH: 42.8 }, // Pico
        { timestamp: "2026-06-01T13:00:00Z", taxaMmH: 15.0 },
      ];
      expect(extrairI30Maximo(registros)).toBe(42.8);
    });

    it("retorna null para registros vazios", () => {
      expect(extrairI30Maximo([])).toBeNull();
    });
  });

  describe("Eventos erosivos e Índice de Mecanismo", () => {
    it("detecta eventos com chuva >= 10 mm", () => {
      const serie = [
        { data: "2026-06-01", precipitacaoMm: 2.0 },
        { data: "2026-06-02", precipitacaoMm: 25.4 }, // Evento
        { data: "2026-06-03", precipitacaoMm: 12.0 }, // Evento
      ];
      const eventos = detectarEventosErosivos(serie, 10.0);
      expect(eventos).toHaveLength(2);
      expect(eventos[0].data).toBe("2026-06-02");
    });

    it("calcula Índice de Mecanismo proporcional à erosividade e solo descoberto", () => {
      const pares = [
        { data: "2026-06-02", volumeChuvaMm: 40.0, i30MmH: 50.0, fracaoSoloNu: 0.8 }, // Alta erosão
        { data: "2026-06-10", volumeChuvaMm: 40.0, i30MmH: 50.0, fracaoSoloNu: 0.0 }, // Solo protegido por vegetação
      ];
      const indice = calcularIndiceMecanismo(pares);
      // Par 1: (40 * 50 / 100) * 0.8 = 20 * 0.8 = 16.0
      // Par 2: (40 * 50 / 100) * 0.0 = 0.0
      expect(indice).toBe(16.0);
    });

    it("monta o bloco 'chuva' de PontoAmostral com proveniência por variável", () => {
      const serie = Array.from({ length: 90 }, (_, i) => ({
        data: `2026-06-${String((i % 30) + 1).padStart(2, "0")}`,
        precipitacaoMm: 10.0,
      }));
      const imerg = [
        { timestamp: "2026-06-01T12:00:00Z", taxaMmH: 35.0 },
      ];

      const bloco = construirBlocoChuva({
        serieDiariaChirps: serie,
        serieImerg: imerg,
      });

      expect(bloco.precipAcum30d.estado).toBe("medido");
      expect(bloco.precipAcum90d.estado).toBe("medido");
      expect(bloco.i30Max.estado).toBe("medido");
      expect(bloco.nEventosErosivos.estado).toBe("medido");
    });
  });
});
