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

  it("audita os geradores de documentos contra deriva: exige PARAM_DEFLACAO e proíbe literais derivados ou defasados", () => {
    const scriptsToCheck = [
      "scripts/gerar_pdf_metodologia_integrada.py",
      "scripts/gerar_docx_metodologia_integrada.py",
      "scripts/gerar_pdf_especificacao_projeto.py",
      "scripts/gerar_pdf_mudanca_metodologica.py",
      "scripts/gerar_pptx_mudanca_metodologica.py",
    ];

    // 1. Ler o JSON canônico
    const jsonPath = path.join(process.cwd(), "data", "PARAMETROS_DEFLACAO.json");
    const jsonRaw = fs.readFileSync(jsonPath, "utf-8");
    const params = JSON.parse(jsonRaw);

    // 2. Montar lista de proibições derivadas e históricas
    interface Proibicao {
      valor: string | number;
      regex: RegExp;
      motivo: string;
    }

    const proibicoes: Proibicao[] = [];

    // Valores inteiros derivados (total e held-out de espectro-temporal e terreno)
    const inteirosDerivados: Array<{ nome: string; val: number }> = [
      { nome: "espectroTemporal.unidadesEfetivasTotal", val: params.espectroTemporal.unidadesEfetivasTotal },
      { nome: "espectroTemporal.unidadesEfetivasHeldOut", val: params.espectroTemporal.unidadesEfetivasHeldOut },
      { nome: "terreno.unidadesEfetivasTotal", val: params.terreno.unidadesEfetivasTotal },
      { nome: "terreno.unidadesEfetivasHeldOut", val: params.terreno.unidadesEfetivasHeldOut },
    ];

    for (const item of inteirosDerivados) {
      const formatadoMilhar = item.val.toLocaleString("pt-BR").replace(/\./g, "\\.");
      const raw = item.val.toString();
      // Ancorado com unidades: ~? 1.841 unidades ou \b920 unidades
      const padrao = new RegExp(`(?:~\\s*|\\b)(?:${formatadoMilhar}|${raw})\\s+unidades`, "i");
      proibicoes.push({
        valor: item.val,
        regex: padrao,
        motivo: `valor derivado de ${item.nome} (${item.val}) deve ser interpolado via PARAM_DEFLACAO`,
      });
    }

    // Unidades por polígono derivadas (ex: 25.57 -> 25,6 ou 6.39 -> 6,4)
    const decimaisDerivados: Array<{ nome: string; val: number }> = [
      { nome: "espectroTemporal.unidadesEfetivasPorPoligono", val: params.espectroTemporal.unidadesEfetivasPorPoligono },
      { nome: "terreno.unidadesEfetivasPorPoligono", val: params.terreno.unidadesEfetivasPorPoligono },
    ];

    for (const item of decimaisDerivados) {
      const arredondado = (Math.round(item.val * 10) / 10).toFixed(1);
      const comVirgula = arredondado.replace(".", ",");
      const padrao = new RegExp(`(?:~\\s*|\\b)(?:${comVirgula}|${arredondado})\\s+unidades`, "i");
      proibicoes.push({
        valor: comVirgula,
        regex: padrao,
        motivo: `valor derivado de ${item.nome} (~${comVirgula}) deve ser interpolado via PARAM_DEFLACAO`,
      });
    }

    // 3. Lista negra de valores históricos superados
    const valoresSuperados: Array<{ val: string; regex: RegExp }> = [
      { val: "1.845", regex: /(?:~\s*|\b)1\.845(?:\s+unidades)?/i },
      { val: "396", regex: /(?:~\s*|\b)396\s+unidades/i },
      { val: "936", regex: /(?:~\s*|\b)936\s+unidades/i },
      { val: "1.836", regex: /(?:~\s*|\b)1\.836(?:\s+unidades)?/i },
      { val: "918", regex: /(?:~\s*|\b)918\s+unidades/i },
    ];

    for (const sup of valoresSuperados) {
      proibicoes.push({
        valor: sup.val,
        regex: sup.regex,
        motivo: `valor histórico defasado '${sup.val}' é estritamente proibido`,
      });
    }

    // 4. Auditar cada gerador
    for (const relPath of scriptsToCheck) {
      const fullPath = path.join(process.cwd(), relPath);
      const text = fs.readFileSync(fullPath, "utf-8");

      // Verificação positiva firme: TODO gerador deve carregar PARAM_DEFLACAO
      expect(
        text.includes("PARAM_DEFLACAO"),
        `${relPath} não carrega a fonte canônica PARAM_DEFLACAO.`
      ).toBe(true);

      // Verificação linha por linha com mensagem informativa
      const lines = text.split(/\r?\n/);
      lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        for (const p of proibicoes) {
          const match = p.regex.test(line);
          expect(
            match,
            `Literal proibido detectado em ${relPath}:${lineNum}: '${line.trim()}'. Motivo: ${p.motivo}.`
          ).toBe(false);
        }
      });
    }
  });
});
