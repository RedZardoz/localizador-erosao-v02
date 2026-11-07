import { describe, it, expect } from "vitest";
import { PERFIS_EXPORTACAO } from "./perfis";

describe("TAREFA 6 & 9 — Integridade dos Perfis de Exportação (Decisões de 06/11/2026)", () => {
  const colunasTreino = PERFIS_EXPORTACAO["matriz-treino"].colunasPermitidas;
  const colunasHeldout = PERFIS_EXPORTACAO["matriz-heldout"].colunasPermitidas;
  const colunasLinhaBase = PERFIS_EXPORTACAO["linha-de-base-rusle"].colunasPermitidas;
  const colunasPlanilha = PERFIS_EXPORTACAO["planilha"].colunasPermitidas;

  describe("Decisão (a) — Exclusão de RUSLE_Fator_LS das matrizes e retenção na linha de base", () => {
    it("falha se RUSLE_Fator_LS reaparecer em matriz-treino", () => {
      expect(colunasTreino).not.toContain("RUSLE_Fator_LS");
    });

    it("falha se RUSLE_Fator_LS reaparecer em matriz-heldout", () => {
      expect(colunasHeldout).not.toContain("RUSLE_Fator_LS");
    });

    it("assegura que RUSLE_Fator_LS permanece no perfil linha-de-base-rusle", () => {
      expect(colunasLinhaBase).toContain("RUSLE_Fator_LS");
    });

    it("assegura que os fatores físicos RUSLE_Fator_K e RUSLE_Fator_R permanecem na matriz", () => {
      expect(colunasTreino).toContain("RUSLE_Fator_K");
      expect(colunasTreino).toContain("RUSLE_Fator_R");
      expect(colunasHeldout).toContain("RUSLE_Fator_K");
      expect(colunasHeldout).toContain("RUSLE_Fator_R");
    });
  });

  describe("Decisão (c) — Exclusão de bandas e índices de data única das matrizes", () => {
    const espectraisRemovidos = [
      "Banda_B2",
      "Banda_B4",
      "Banda_B8",
      "Banda_B12",
      "NDVI",
      "BSI",
    ];

    for (const col of espectraisRemovidos) {
      it(`falha se a coluna espectral de data única '${col}' reaparecer em matriz-treino`, () => {
        expect(colunasTreino).not.toContain(col);
      });

      it(`falha se a coluna espectral de data única '${col}' reaparecer em matriz-heldout`, () => {
        expect(colunasHeldout).not.toContain(col);
      });
    }

    it("assegura que as métricas de série multitemporal permanecem nas matrizes", () => {
      const metricasSerie = [
        "Frequencia_Solo_Nu",
        "Composto_Solo_Nu_B12",
        "Composto_Solo_Nu_Razao_B4_B2",
        "Taxa_Degradacao_SWIR_Anual",
        "NDVI_P90_Serie",
      ];
      for (const m of metricasSerie) {
        expect(colunasTreino).toContain(m);
        expect(colunasHeldout).toContain(m);
      }
    });
  });

  describe("Decisão (d) & Tarefa 9 — NDVI e BSI com colunas duplas no perfil planilha", () => {
    it("assegura presença das quatro colunas no perfil planilha", () => {
      expect(colunasPlanilha).toContain("NDVI");
      expect(colunasPlanilha).toContain("NDVI_Origem");
      expect(colunasPlanilha).toContain("BSI");
      expect(colunasPlanilha).toContain("BSI_Origem");
    });

    it("assegura adjacência estrita entre o valor e sua respectiva coluna de origem (§15)", () => {
      const idxNdvi = colunasPlanilha.indexOf("NDVI");
      const idxNdviOrigem = colunasPlanilha.indexOf("NDVI_Origem");
      expect(idxNdviOrigem).toBe(idxNdvi + 1);

      const idxBsi = colunasPlanilha.indexOf("BSI");
      const idxBsiOrigem = colunasPlanilha.indexOf("BSI_Origem");
      expect(idxBsiOrigem).toBe(idxBsi + 1);
    });
  });
});
