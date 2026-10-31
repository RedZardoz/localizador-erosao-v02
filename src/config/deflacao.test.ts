import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  obterParametrosDeflacao,
  calcularUnidadesEfetivas,
  canonicalData,
} from "./deflacao";
import { DECISOES, exigirParametro } from "./decisoes";

describe("Fonte Única de Parâmetros e Deflação Espacial (GOV-3 / D16 / D24)", () => {
  it("deriva com precisão matemática a área total e de held-out a partir de D16", () => {
    const params = obterParametrosDeflacao();
    expect(params.totalPoligonos).toBe(72);
    expect(params.areaPoligonoHa).toBe(5.02);
    expect(params.areaTotalHa).toBe(361.44);
    expect(params.poligonosHeldOut).toBe(36);
    expect(params.areaHeldOutHa).toBe(180.72);
  });

  it("calcula n_ef = 1.841 e held-out = 920 para o bloco espectro-temporal (a = 50 m)", () => {
    const params = obterParametrosDeflacao();
    expect(params.espectroTemporal.alcanceMetros).toBe(50.0);
    // Suporte = π · 25² = 1.963,4954 m²
    expect(params.espectroTemporal.suporteM2).toBeCloseTo(1963.4954, 3);
    // n_ef total = round(361,44 ha / 0,19635 ha) = 1.841
    expect(params.espectroTemporal.unidadesEfetivasTotal).toBe(1841);
    // n_ef held-out = round(180,72 ha / 0,19635 ha) = 920
    expect(params.espectroTemporal.unidadesEfetivasHeldOut).toBe(920);
    expect(params.espectroTemporal.tetoPreditores).toBe(8);
  });

  it("calcula n_ef = 460 e held-out = 230 para o bloco de terreno (a = 100 m)", () => {
    const params = obterParametrosDeflacao();
    expect(params.terreno.alcanceMetros).toBe(100.0);
    // Suporte = π · 50² = 7.853,9816 m²
    expect(params.terreno.suporteM2).toBeCloseTo(7853.9816, 3);
    // n_ef total = round(361,44 ha / 0,78540 ha) = 460
    expect(params.terreno.unidadesEfetivasTotal).toBe(460);
    // n_ef held-out = round(180,72 ha / 0,78540 ha) = 230
    expect(params.terreno.unidadesEfetivasHeldOut).toBe(230);
    expect(params.terreno.tetoPreditores).toBe(4);
  });

  it("assegura que os tetos físicos respeitam 8 + 4 + 1 + 1 = 14 preditores", () => {
    const params = obterParametrosDeflacao();
    expect(params.solo.tetoPreditores).toBe(1);
    expect(params.chuva.tetoPreditores).toBe(1);
    expect(params.tetoTotalMatriz).toBe(14);
    expect(
      params.espectroTemporal.tetoPreditores +
        params.terreno.tetoPreditores +
        params.solo.tetoPreditores +
        params.chuva.tetoPreditores
    ).toBe(14);
  });

  it("assevera paridade estrita entre os parâmetros derivados de DECISOES e data/PARAMETROS_DEFLACAO.json", () => {
    const params = obterParametrosDeflacao();

    expect(canonicalData.areaTotalHa).toBe(params.areaTotalHa);
    expect(canonicalData.areaHeldOutHa).toBe(params.areaHeldOutHa);
    expect(canonicalData.totalPoligonos).toBe(params.totalPoligonos);
    expect(canonicalData.poligonosHeldOut).toBe(params.poligonosHeldOut);

    expect(canonicalData.espectroTemporal.unidadesEfetivasTotal).toBe(
      params.espectroTemporal.unidadesEfetivasTotal
    );
    expect(canonicalData.espectroTemporal.unidadesEfetivasHeldOut).toBe(
      params.espectroTemporal.unidadesEfetivasHeldOut
    );
    expect(canonicalData.terreno.unidadesEfetivasTotal).toBe(
      params.terreno.unidadesEfetivasTotal
    );
    expect(canonicalData.terreno.unidadesEfetivasHeldOut).toBe(
      params.terreno.unidadesEfetivasHeldOut
    );
    expect(canonicalData.tetoTotalMatriz).toBe(params.tetoTotalMatriz);
  });

  it("assegura que o acessor fail-closed exigirParametro recupera todos os parâmetros de D16 e D24", () => {
    expect(exigirParametro(DECISOES.D16, "totalPoligonos").valor).toBe(72);
    expect(exigirParametro(DECISOES.D16, "areaPoligonoHa").valor).toBe(5.02);
    expect(exigirParametro(DECISOES.D16, "areaTotalHa").valor).toBe(361.44);
    expect(exigirParametro(DECISOES.D16, "poligonosHeldOut").valor).toBe(36);
    expect(exigirParametro(DECISOES.D16, "poligonosTreino").valor).toBe(36);

    expect(
      exigirParametro(DECISOES.D24, "alcanceEspectroTemporalMetros").valor
    ).toBe(50.0);
    expect(exigirParametro(DECISOES.D24, "alcanceTerrenoMetros").valor).toBe(
      100.0
    );
    expect(
      exigirParametro(DECISOES.D24, "unidadesEfetivasEspectroTemporal").valor
    ).toBe(1841);
    expect(exigirParametro(DECISOES.D24, "unidadesEfetivasTerreno").valor).toBe(
      460
    );
    expect(exigirParametro(DECISOES.D24, "tetoTotal").valor).toBe(14);
  });

  it("audita os scripts geradores de documentos e falha se houver cifras defasadas (1.845, 396 no terreno, ou 936 no held-out)", () => {
    const scriptsToCheck = [
      "scripts/gerar_pdf_metodologia_integrada.py",
      "scripts/gerar_docx_metodologia_integrada.py",
      "scripts/gerar_pdf_especificacao_projeto.py",
      "scripts/gerar_pdf_mudanca_metodologica.py",
      "scripts/gerar_pptx_mudanca_metodologica.py",
    ];

    for (const relPath of scriptsToCheck) {
      const fullPath = path.join(process.cwd(), relPath);
      const text = fs.readFileSync(fullPath, "utf-8");

      // Nenhum desses scripts pode trazer o valor defasado 1.845 no corpo do texto
      expect(
        text.includes("~1.845"),
        `${relPath} contém '~1.845' obsoleto. Deve usar o valor derivado (~1.841).`
      ).toBe(false);

      // Nenhum desses scripts pode trazer ~396 unidades independentes no bloco de terreno
      expect(
        text.includes("~396 unidades"),
        `${relPath} contém '~396 unidades' obsoleto. Deve usar o valor derivado (~460).`
      ).toBe(false);

      // Nenhum desses scripts pode trazer 936 unidades no held-out
      expect(
        text.includes("936 unidades"),
        `${relPath} contém '936 unidades' obsoleto. Deve usar 920 unidades.`
      ).toBe(false);

      // Os geradores principais devem referenciar o parâmetro canônico ou o valor 460
      if (
        relPath.includes("metodologia_integrada") ||
        relPath.includes("especificacao_projeto")
      ) {
        expect(
          text.includes("PARAM_DEFLACAO") || text.includes("460"),
          `${relPath} não referencia PARAM_DEFLACAO nem 460.`
        ).toBe(true);
      }
    }
  });
});
