import { describe, it, expect } from "vitest";
import {
  analisarPersistenciaTemporal,
  OpcoesPersistencia,
} from "./persistenciaTemporal";
import { ObservacaoCena } from "./serieTemporal";

const OPCOES_PADRAO: OpcoesPersistencia = {
  limiarNdviSoloNu: 0.40,
  limiarNdviDosselFechado: 0.65,
  limiarFreqDegradacao: 0.25,
};

function criarCena(
  data: string,
  tAnos: number,
  ndviDesejado: number,
  b12: number = 0.20,
  nuvemSombra: boolean = false
): ObservacaoCena {
  // b8 e b4 para gerar o NDVI desejado: NDVI = (b8 - b4)/(b8 + b4)
  // Fixando b4 = 0.1: b8 = 0.1 * (1 + ndvi) / (1 - ndvi)
  const b4 = 0.1;
  const b8 = Number((0.1 * (1 + ndviDesejado) / (1 - ndviDesejado)).toFixed(4));
  return {
    data,
    tAnos,
    productId: `CENA_${data}`,
    nuvemSombra,
    b2: 0.05,
    b3: 0.08,
    b4,
    b5: 0.12,
    b6: 0.18,
    b7: 0.22,
    b8,
    b8a: 0.25,
    b11: 0.20,
    b12,
  };
}

describe("Discrimina??o de Persist?ncia Temporal (Pousio vs Degrada??o Cr?nica)", () => {
  it("deve classificar pousio agr?cola transit?rio quando solo fecha dossel com vigor pleno", () => {
    // Simula 10 cenas: 2 cenas de preparo/pousio (NDVI = 0.25) seguidas de safra vigorosa (NDVI = 0.80)
    const cenas: ObservacaoCena[] = [
      criarCena("2024-09-01", 2024.67, 0.25), // Pousio / desseca??o
      criarCena("2024-09-20", 2024.72, 0.28), // Plantio
      criarCena("2024-10-15", 2024.79, 0.50), // Emerg?ncia
      criarCena("2024-11-15", 2024.87, 0.75), // Vigor
      criarCena("2024-12-15", 2024.95, 0.82), // Pico de biomassa
      criarCena("2025-01-15", 2025.04, 0.78),
      criarCena("2025-02-15", 2025.12, 0.68),
      criarCena("2025-03-15", 2025.20, 0.45), // Matura??o
    ];

    const diag = analisarPersistenciaTemporal(cenas, OPCOES_PADRAO);
    expect(diag.regime).toBe("pousio_transitorio");
    expect(diag.confianca).toBe("alta");
    expect(diag.recuperouDossel).toBe(true);
    expect(diag.ndviMaximoMediano).toBeGreaterThanOrEqual(0.65);
  });

  it("deve classificar degrada??o cr?nica quando solo permanece frequentemente exposto e vigor ? atrofiado", () => {
    // Simula mancha erosiva persistente: solo exposto repetidamente, vigor atrofiado e SWIR crescente
    const cenas: ObservacaoCena[] = [
      criarCena("2022-09-01", 2022.67, 0.25, 0.20),
      criarCena("2022-11-15", 2022.87, 0.48, 0.22), // Pico fraco
      criarCena("2023-05-01", 2023.33, 0.22, 0.25), // Solo exposto novamente
      criarCena("2023-09-01", 2023.67, 0.20, 0.28), // Horizonte B exposto
      criarCena("2023-11-15", 2023.87, 0.42, 0.30),
      criarCena("2024-05-01", 2024.33, 0.24, 0.32),
      criarCena("2024-09-01", 2024.67, 0.18, 0.35),
      criarCena("2024-11-15", 2024.87, 0.40, 0.36),
    ];

    const diag = analisarPersistenciaTemporal(cenas, OPCOES_PADRAO);
    expect(diag.regime).toBe("degradacao_persistente");
    expect(diag.recuperouDossel).toBe(false);
    expect(diag.taxaDegradacaoSwirAnual).toBeGreaterThan(0.015);
  });

  it("deve classificar vegeta??o est?vel quando nunca h? exposi??o de solo e NDVI ? alto", () => {
    const cenas: ObservacaoCena[] = [
      criarCena("2024-01-01", 2024.00, 0.72),
      criarCena("2024-03-01", 2024.16, 0.75),
      criarCena("2024-05-01", 2024.33, 0.70),
      criarCena("2024-07-01", 2024.50, 0.68),
      criarCena("2024-09-01", 2024.67, 0.74),
      criarCena("2024-11-01", 2024.83, 0.78),
    ];

    const diag = analisarPersistenciaTemporal(cenas, OPCOES_PADRAO);
    expect(diag.regime).toBe("vegetacao_estavel");
    expect(diag.frequenciaExposicao).toBe(0.0);
  });

  it("deve retornar inconclusivo se houver menos de 6 observa??es v?lidas", () => {
    const poucasCenas: ObservacaoCena[] = [
      criarCena("2024-01-01", 2024.00, 0.50),
      criarCena("2024-02-01", 2024.08, 0.50, 0.20, true), // Nuvem
      criarCena("2024-03-01", 2024.16, 0.50),
    ];

    const diag = analisarPersistenciaTemporal(poucasCenas, OPCOES_PADRAO);
    expect(diag.regime).toBe("inconclusivo");
    expect(diag.confianca).toBe("baixa");
  });
});
