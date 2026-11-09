import { describe, it, expect, vi } from "vitest";
import {
  calcularFrequenciasVarreduraNbr2,
  executarVarreduraCli,
} from "../../../scripts/auditoria/varrer_faixas_nbr2.mjs";
import { FAIXAS_NBR2_DEMATTE_2018 } from "./mascaraSoloNuGeos3";

describe("Instrumentação de Varredura das Seis Faixas de NBR2 (Tarefa 4)", () => {
  it("produz frequências Ê monotonicamente não-decrescentes ao relaxar o limiar de NBR2", () => {
    // Cria 10 cenas sintéticas com NBR2 distribuído em patamares crescentes:
    // Todas atendem os critérios de NDVI [0, 0.25], B4-B3 >= 0 e B3-B2 >= 0
    // b2=0.10, b3=0.12, b4=0.15, b8=0.18 -> NDVI = 0.03 / 0.33 = 0.0909
    function criarCenaComNbr2(nbr2Desejado: number) {
      // NBR2 = (b11 - b12) / (b11 + b12)
      // Fixando b12 = 0.20 -> b11 = 0.20 * (1 + nbr2) / (1 - nbr2)
      const b12 = 0.20;
      const b11 = Number(((0.20 * (1 + nbr2Desejado)) / (1 - nbr2Desejado)).toFixed(4));
      return {
        b2: 0.10,
        b3: 0.12,
        b4: 0.15,
        b8: 0.18,
        b11,
        b12,
      };
    }

    const series = [
      criarCenaComNbr2(0.015), // <= 0.025
      criarCenaComNbr2(0.050), // <= 0.075
      criarCenaComNbr2(0.075), // == 0.075 (limiar padrão D10)
      criarCenaComNbr2(0.120), // <= 0.150
      criarCenaComNbr2(0.180), // <= 0.225
      criarCenaComNbr2(0.250), // <= 0.300
      criarCenaComNbr2(0.320), // <= 0.350
      criarCenaComNbr2(0.400), // > 0.350 (excluído em todas)
    ];

    const resultados = calcularFrequenciasVarreduraNbr2(series, FAIXAS_NBR2_DEMATTE_2018);

    const faixas = [...FAIXAS_NBR2_DEMATTE_2018];
    const freqs = faixas.map(f => resultados[f].frequencia);

    // Monotonicidade estrita não-decrescente: f[i] <= f[i+1]
    for (let i = 0; i < freqs.length - 1; i++) {
      expect(freqs[i]).toBeLessThanOrEqual(freqs[i + 1]);
    }

    // A faixa mais estreita (0.025) admite 1 cena (1/8 = 0.125)
    expect(resultados[0.025].nSoloNu).toBe(1);
    expect(resultados[0.025].frequencia).toBe(0.125);

    // A faixa padrão D10 (0.075) admite 3 cenas (3/8 = 0.375)
    expect(resultados[0.075].nSoloNu).toBe(3);
    expect(resultados[0.075].frequencia).toBe(0.375);

    // A faixa mais ampla (0.350) admite 7 cenas (7/8 = 0.875)
    expect(resultados[0.350].nSoloNu).toBe(7);
    expect(resultados[0.350].frequencia).toBe(0.875);
  });

  it("recusa-se a executar via CLI sem arquivo de dados reais (fail-closed / Regra 1)", () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Executa sem argumentos (simulando chamada em repositório sem ingestão de séries)
    const res = executarVarreduraCli(undefined);

    expect(res.sucesso).toBe(false);
    expect(res.motivo).toBe("sem_dados_reais");
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("FONTE_DOS_DADOS: AUSENTE (candidatosComSoloNuMedido: 0 no repositório)")
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("A varredura das seis faixas de NBR2 recusa-se a rodar sem dados reais")
    );

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
