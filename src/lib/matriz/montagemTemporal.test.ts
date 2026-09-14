import { describe, it, expect } from "vitest";
import { montarPreditoresTemporais } from "./montagemTemporal";
import { ObservacaoCena } from "../gee/serieTemporal";

function criarCenaTemporal(
  data: string,
  tAnos: number,
  ndvi: number,
  bsi: number,
  b12: number = 0.20
): ObservacaoCena {
  const b4 = 0.1;
  const b8 = Number((0.1 * (1 + ndvi) / (1 - ndvi)).toFixed(4));
  return {
    data,
    tAnos,
    productId: `CENA_${data}`,
    nuvemSombra: false,
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

describe("Montagem de Preditores Multitemporais (Time-Series Stacking e Modelo D vs P)", () => {
  const dataEvento = "2026-06-01";

  // Gera 24 meses de cenas (2024-06-01 a 2026-05-01)
  const cenas: ObservacaoCena[] = [];
  for (let ano = 2023; ano <= 2026; ano++) {
    for (let mes = 1; mes <= 12; mes++) {
      const dataStr = `${ano}-${String(mes).padStart(2, "0")}-15`;
      if (dataStr <= dataEvento) {
        const tAnos = ano + (mes - 1) / 12;
        // Padr?o com ciclo sazonal e degrada??o progressiva
        const ndvi = mes >= 5 && mes <= 8 ? 0.30 : 0.72; // Solo exposto no inverno
        const bsi = mes >= 5 && mes <= 8 ? 0.25 : -0.15;
        cenas.push(criarCenaTemporal(dataStr, tAnos, ndvi, bsi, 0.20 + (ano - 2023) * 0.04));
      }
    }
  }

  it("deve montar preditores para o Modelo D (Detec??o contempor?nea at? t0)", () => {
    const resD = montarPreditoresTemporais(cenas, "D", {
      dataReferencia: dataEvento,
      intervaloGuardaMeses: 12,
      duracaoJanelaAnos: 3,
    });

    expect(resD.tipoModelo).toBe("D");
    expect(resD.janelaFim).toBe(dataEvento);
    expect(resD.nObservacoesValidas).toBeGreaterThan(12);
    expect(resD.ndvi_p50).not.toBeNull();
    expect(resD.lag_ndvi_t0).not.toBeNull();
  });

  it("deve montar preditores para o Modelo P (Progn?stico com intervalo de guarda >= 12 meses)", () => {
    const resP = montarPreditoresTemporais(cenas, "P", {
      dataReferencia: dataEvento,
      intervaloGuardaMeses: 12,
      duracaoJanelaAnos: 3,
    });

    expect(resP.tipoModelo).toBe("P");
    // A janela do Modelo P deve terminar 12 meses antes do evento (2025-06-01)
    expect(resP.janelaFim).toBe("2025-06-01");
    expect(resP.nObservacoesValidas).toBeGreaterThan(6);

    // O lag_ndvi_t0 do Modelo P corresponde ao momento t - 12m (fim da janela de guarda)
    expect(resP.lag_ndvi_t0).not.toBeNull();
  });

  it("deve retornar nObservacoesValidas = 0 quando n?o houver cenas na janela", () => {
    const resVazio = montarPreditoresTemporais([], "D", {
      dataReferencia: dataEvento,
    });

    expect(resVazio.nObservacoesValidas).toBe(0);
    expect(resVazio.ndvi_p50).toBeNull();
    expect(resVazio.regimePersistencia).toBe("inconclusivo");
  });
});
