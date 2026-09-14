import { describe, it, expect } from "vitest";
import { calcularAcumuladosChuva, criarProvenienciaChirps } from "./chirps";
import { extrairI30Maximo, criarProvenienciaImerg } from "./imerg";
import { construirBlocoChuva, calcularIndiceMecanismo } from "./eventos";

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

  it("deve calcular índice de mecanismo acoplado quando série de solo for fornecida", () => {
    // 3 dias de chuva de 10mm
    const serieDiaria = [
      { data: "2026-01-10", precipitacaoMm: 10.0 },
      { data: "2026-01-11", precipitacaoMm: 15.0 },
      { data: "2026-01-20", precipitacaoMm: 20.0 },
    ];

    // Cena de satélite indicando solo descoberto (D10: NDVI < 0.40) em 10/01
    // e dossel fechado em 20/01
    const serieSolo = [
      { data: "2026-01-10", ehSoloNu: true, ndvi: 0.25 },
      { data: "2026-01-20", ehSoloNu: false, ndvi: 0.72 },
    ];

    const val = calcularIndiceMecanismo(serieDiaria, serieSolo, 5);
    // Dias 10 e 11 pareiam com cena de 10/01 (solo nu = true): 10 + 15 = 25 mm
    // Dia 20 pareia com cena de 20/01 (solo nu = false): 0 mm
    expect(val).toBe(25.0);

    const bloco = construirBlocoChuva({
      serieDiariaChirps: serieDiaria,
      serieImerg: [{ timestamp: "2026-01-10T14:00:00Z", taxaMmH: 22.0 }],
      serieSoloNu: serieSolo,
    });

    expect(bloco.indiceMecanismo.estado).toBe("modelado");
    if (bloco.indiceMecanismo.estado === "modelado") {
      expect(bloco.indiceMecanismo.valor).toBe(25.0);
      expect(bloco.indiceMecanismo.modelo).toContain("Sigma_t");
      expect(bloco.indiceMecanismo.insumos).toContain("CHIRPS (DAILY)");
    }
  });

  it("deve retornar 0 para o índice de mecanismo se o solo esteve sempre protegido por vegetação", () => {
    const serieDiaria = [{ data: "2026-01-10", precipitacaoMm: 50.0 }];
    const serieSolo = [{ data: "2026-01-10", ehSoloNu: false, ndvi: 0.80 }];

    const val = calcularIndiceMecanismo(serieDiaria, serieSolo);
    expect(val).toBe(0.0);
  });

  it("deve retornar null se entradas forem vazias ou sem pareamento temporal", () => {
    expect(calcularIndiceMecanismo([], [])).toBeNull();
    const valForaJanela = calcularIndiceMecanismo(
      [{ data: "2026-01-01", precipitacaoMm: 20.0 }],
      [{ data: "2026-06-01", ehSoloNu: true }],
      15 // Tolerância de 15 dias para pareamento
    );
    expect(valForaJanela).toBeNull();
  });
});
