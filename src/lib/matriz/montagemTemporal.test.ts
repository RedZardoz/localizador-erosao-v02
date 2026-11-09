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
    b11: Number((b12 * 1.05).toFixed(4)),
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

  it("aplica piso de DP-24 (Hyndman & Fan 1996): percentis de cauda nulos para n < 9 e calculados para n >= 9", () => {
    // 8 cenas validas: n < 9 -> ndvi_p10 e ndvi_p90 devem ser null, ndvi_p50 preenchido
    const cenas8: ObservacaoCena[] = [];
    for (let i = 1; i <= 8; i++) {
      const dataStr = `2026-0${i}-10`;
      cenas8.push(criarCenaTemporal(dataStr, 2026 + i / 12, 0.40 + i * 0.02, 0.10));
    }
    const res8 = montarPreditoresTemporais(cenas8, "D", {
      dataReferencia: "2026-08-30",
      duracaoJanelaAnos: 1,
    });
    expect(res8.nObservacoesValidas).toBe(8);
    expect(res8.ndvi_p10).toBeNull();
    expect(res8.ndvi_p90).toBeNull();
    expect(res8.ndvi_p50).not.toBeNull();

    // 9 cenas validas: n >= 9 -> ndvi_p10 e ndvi_p90 calculados normalmente
    const cenas9 = [...cenas8, criarCenaTemporal("2026-08-20", 2026.65, 0.60, 0.05)];
    const res9 = montarPreditoresTemporais(cenas9, "D", {
      dataReferencia: "2026-08-30",
      duracaoJanelaAnos: 1,
    });
    expect(res9.nObservacoesValidas).toBe(9);
    expect(res9.ndvi_p10).not.toBeNull();
    expect(res9.ndvi_p90).not.toBeNull();
    expect(res9.ndvi_p50).not.toBeNull();
  });

  describe("Pisos amostrais de D11.2 para Frequência de Solo Nu (Ê)", () => {
    it("deve retornar frequenciaSoloNu como indisponivel quando nValidas < 6 (D11.1 / D11.2)", () => {
      const cenas5: ObservacaoCena[] = [];
      for (let i = 1; i <= 5; i++) {
        cenas5.push(criarCenaTemporal(`2026-0${i}-10`, 2026 + i / 12, 0.20, 0.15));
      }
      const res5 = montarPreditoresTemporais(cenas5, "D", {
        dataReferencia: "2026-05-30",
        duracaoJanelaAnos: 1,
      });
      expect(res5.nObservacoesValidas).toBe(5);
      expect(res5.frequenciaSoloNu.estado).toBe("indisponivel");
      if (res5.frequenciaSoloNu.estado === "indisponivel") {
        expect(res5.frequenciaSoloNu.causa).toBe("insuficiente");
      }
      expect(res5.frequenciaSoloNuValor).toBeNull();
    });

    it("recusa Ê (indisponivel) quando 6 <= n < 12 em janela plurianual (D11.2; SE > 0,144)", () => {
      const cenas8: ObservacaoCena[] = [];
      for (let i = 1; i <= 8; i++) {
        cenas8.push(criarCenaTemporal(`2026-0${i}-10`, 2026 + i / 12, 0.20, 0.15));
      }
      // Janela de 1 ano (365 dias >= 120 dias)
      const res8 = montarPreditoresTemporais(cenas8, "D", {
        dataReferencia: "2026-08-30",
        duracaoJanelaAnos: 1,
      });
      expect(res8.nObservacoesValidas).toBe(8);
      expect(res8.frequenciaSoloNu.estado).toBe("indisponivel");
      if (res8.frequenciaSoloNu.estado === "indisponivel") {
        expect(res8.frequenciaSoloNu.causa).toBe("insuficiente");
        expect(res8.frequenciaSoloNu.motivo).toContain("Agresti & Coull");
      }
      expect(res8.frequenciaSoloNuValor).toBeNull();
    });

    it("admite fallback de Ê com metadados de incerteza em janela sazonal curta (< 120 dias; D11.2)", () => {
      // Cria 8 cenas concentradas em janela de 90 dias (01/01 a 31/03)
      const cenasCurta: ObservacaoCena[] = [];
      for (let i = 1; i <= 8; i++) {
        const dia = String(i * 10).padStart(2, "0");
        cenasCurta.push(criarCenaTemporal(`2026-01-${dia}`, 2026 + i / 36, 0.20, 0.15));
      }
      // duracaoJanelaAnos: 0.25 (91 dias < 120 dias)
      const resFallback = montarPreditoresTemporais(cenasCurta, "D", {
        dataReferencia: "2026-03-31",
        duracaoJanelaAnos: 0.25,
      });
      expect(resFallback.nObservacoesValidas).toBe(8);
      expect(resFallback.frequenciaSoloNu.estado).toBe("modelado");
      if (resFallback.frequenciaSoloNu.estado === "modelado") {
        expect(resFallback.frequenciaSoloNu.valor).toBe(1.0); // todas <= 0.25
        expect(resFallback.frequenciaSoloNu.qualidade?.regime).toBe("fallback_janela_curta");
        expect(resFallback.frequenciaSoloNu.qualidade?.erroPadrao).toBeCloseTo(0.1768, 3);
        expect(resFallback.frequenciaSoloNu.qualidade?.elegivelD12).toBe(false);
      }
      expect(resFallback.frequenciaSoloNuValor).toBe(1.0);
    });

    it("calcula Ê sob regime padrão quando n >= 12 (D11.2; SE <= 0,144)", () => {
      const cenas12: ObservacaoCena[] = [];
      for (let i = 1; i <= 12; i++) {
        const mes = String(i).padStart(2, "0");
        cenas12.push(criarCenaTemporal(`2026-${mes}-15`, 2026 + i / 12, i <= 3 ? 0.20 : 0.60, 0.10));
      }
      const res12 = montarPreditoresTemporais(cenas12, "D", {
        dataReferencia: "2026-12-31",
        duracaoJanelaAnos: 1,
      });
      expect(res12.nObservacoesValidas).toBe(12);
      expect(res12.frequenciaSoloNu.estado).toBe("modelado");
      if (res12.frequenciaSoloNu.estado === "modelado") {
        expect(res12.frequenciaSoloNu.valor).toBe(0.25); // 3 / 12 = 0.25
        expect(res12.frequenciaSoloNu.qualidade?.regime).toBe("padrao");
        expect(res12.frequenciaSoloNu.qualidade?.erroPadrao).toBeLessThanOrEqual(0.1444);
        expect(res12.frequenciaSoloNu.qualidade?.elegivelD12).toBe(true);
      }
    });

    it("avalia podeEntrarEstratificacaoD12 corretamente bloqueando fallback e liberando padrão", async () => {
      const { podeEntrarEstratificacaoD12 } = await import("./montagemTemporal");
      const provFallback: any = {
        estado: "modelado",
        valor: 0.3,
        qualidade: { nObservacoes: 8, regime: "fallback_janela_curta", elegivelD12: false },
      };
      const provPadrao: any = {
        estado: "modelado",
        valor: 0.3,
        qualidade: { nObservacoes: 14, regime: "padrao", elegivelD12: true },
      };
      const provIndisp: any = { estado: "indisponivel", causa: "insuficiente", motivo: "baixo" };

      expect(podeEntrarEstratificacaoD12(provFallback)).toBe(false);
      expect(podeEntrarEstratificacaoD12(provIndisp)).toBe(false);
      expect(podeEntrarEstratificacaoD12(provPadrao)).toBe(true);
    });
  });
});
