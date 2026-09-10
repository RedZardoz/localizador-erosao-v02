import { describe, it, expect } from "vitest";
import { calcularAcumuladosChuva, criarProvenienciaChirps } from "./chirps";
import { extrairI30Maximo, criarProvenienciaImerg } from "./imerg";
import { construirBlocoChuva } from "./eventos";

describe("CHIRPS Acumulados Diários", () => {
  it("deve calcular acumulados de 30 e 90 dias com dados suficientes", () => {
    // Série sintética de teste com 90 dias (1.0 mm por dia)
    const serie = Array.from({ length: 90 }, (_, i) => {
      const d = new Date(2026, 0, 1 + i);
      return {
        data: d.toISOString().split("T")[0],
        precipitacaoMm: 2.0,
      };
    });

    const res = calcularAcumuladosChuva(serie);
    expect(res.acum30d).toBe(60.0);
    expect(res.acum90d).toBe(180.0);
    expect(res.diasValidos).toBe(90);
  });

  it("deve retornar null para acumulados quando os dias observados forem insuficientes", () => {
    const serieCurta = [
      { data: "2026-01-01", precipitacaoMm: 10.0 },
      { data: "2026-01-02", precipitacaoMm: 5.0 },
    ];

    const res = calcularAcumuladosChuva(serieCurta);
    expect(res.acum30d).toBeNull();
    expect(res.acum90d).toBeNull();
  });

  it("criarProvenienciaChirps deve retornar indisponivel com causa insuficiente se nulo", () => {
    const prov = criarProvenienciaChirps(null, "teste");
    expect(prov.estado).toBe("indisponivel");
    if (prov.estado === "indisponivel") {
      expect(prov.causa).toBe("insuficiente");
    }
  });
});

describe("GPM IMERG Intensidade Sub-horária", () => {
  it("deve extrair a taxa máxima I30 entre os registros", () => {
    const registros = [
      { timestamp: "2026-01-01T12:00:00Z", taxaMmH: 5.4 },
      { timestamp: "2026-01-01T12:30:00Z", taxaMmH: 24.8 },
      { timestamp: "2026-01-01T13:00:00Z", taxaMmH: 12.1 },
    ];

    expect(extrairI30Maximo(registros)).toBe(24.8);
  });

  it("deve retornar null para lista vazia de registros IMERG", () => {
    expect(extrairI30Maximo([])).toBeNull();
  });

  it("criarProvenienciaImerg deve retornar indisponivel com causa insuficiente se nulo", () => {
    const prov = criarProvenienciaImerg(null, "teste");
    expect(prov.estado).toBe("indisponivel");
    if (prov.estado === "indisponivel") {
      expect(prov.causa).toBe("insuficiente");
    }
  });
});

describe("BlocoChuva e Decisão D13 (Invariante 5)", () => {
  it("deve construir bloco com nEventosErosivos e indiceMecanismo em estado decisao-pendente", () => {
    const serieDiaria = Array.from({ length: 30 }, (_, i) => ({
      data: `2026-01-${String(i + 1).padStart(2, "0")}`,
      precipitacaoMm: 3.0,
    }));

    const bloco = construirBlocoChuva({
      serieDiariaChirps: serieDiaria,
      serieImerg: [{ timestamp: "2026-01-15T14:00:00Z", taxaMmH: 18.5 }],
    });

    expect(bloco.precipAcum30d.estado).toBe("medido");
    expect(bloco.i30Max.estado).toBe("medido");

    // nEventosErosivos DEVE ser indisponivel com causa decisao-pendente (D13)
    expect(bloco.nEventosErosivos.estado).toBe("indisponivel");
    if (bloco.nEventosErosivos.estado === "indisponivel") {
      expect(bloco.nEventosErosivos.causa).toBe("decisao-pendente");
      expect(bloco.nEventosErosivos.motivo).toContain("D13");
    }

    // indiceMecanismo DEVE ser indisponivel com causa decisao-pendente (D13/D10)
    expect(bloco.indiceMecanismo.estado).toBe("indisponivel");
    if (bloco.indiceMecanismo.estado === "indisponivel") {
      expect(bloco.indiceMecanismo.causa).toBe("decisao-pendente");
      expect(bloco.indiceMecanismo.motivo).toContain("D13");
    }
  });
});
