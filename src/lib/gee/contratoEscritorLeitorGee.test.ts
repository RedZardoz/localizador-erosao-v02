import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  gravarEvidenciaLoteGeeSerieS2,
  gravarEvidenciaGeeSerieS2,
} from "./gravadorEvidenciaGee";

describe("Contrato Escritor-Leitor de Evidência da Regra 8 (GEE)", () => {
  const pastaVerificacoes = path.resolve(process.cwd(), "docs", "verificacoes");
  const arquivosParaLimpar: string[] = [];

  afterEach(() => {
    for (const arq of arquivosParaLimpar) {
      if (fs.existsSync(arq)) {
        try {
          fs.unlinkSync(arq);
        } catch {}
      }
    }
    arquivosParaLimpar.length = 0;
  });

  it("leitor consome com sucesso arquivo no formato de lote emitido pelo escritor", () => {
    const pontosMock = [
      {
        id: "PONTO_001",
        coordenadas: { latitude: -24.85, longitude: -54.05 },
        nObservacoesValidasPorBanda: { B2: 30, B4: 30, B8: 30, B11: 30, B12: 30 },
        nObservacoesValidas: 30,
        insuficienteD11: false,
        observacoes: [
          { data: "2019-05-10", ndvi: 0.55, bsi: -0.05 },
          { data: "2020-07-15", ndvi: 0.60, bsi: -0.08 },
          { data: "2021-08-20", ndvi: 0.45, bsi: 0.02 },
        ],
      },
      {
        id: "PONTO_002",
        coordenadas: { latitude: -24.95, longitude: -54.15 },
        nObservacoesValidasPorBanda: { B2: 2, B4: 2, B8: 2, B11: 2, B12: 2 },
        nObservacoesValidas: 2,
        insuficienteD11: true,
        observacoes: [
          { data: "2020-02-14", ndvi: 0.35, bsi: 0.15 },
        ],
      },
    ];

    const custoMedido = {
      requisicoesEmitidas: 2,
      tempoTotalMs: 850,
      tempoPorPontoMs: 425,
    };

    const resEscritor = gravarEvidenciaLoteGeeSerieS2({
      pontos: pontosMock,
      custoMedido,
      operacao: "contrato_teste_lote",
      dataConsulta: "2026-11-08",
    });

    arquivosParaLimpar.push(resEscritor.caminhoAbsoluto);

    const scriptLeitor = path.resolve(process.cwd(), "scripts/auditoria/medir_distribuicao_temporal_s2.mjs");
    const resLeitor = spawnSync(process.execPath, [scriptLeitor, resEscritor.caminhoRelativo], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    expect(resLeitor.status).toBe(0);

    const stdout = resLeitor.stdout;
    expect(stdout).toMatch(/^FONTE_DOS_DADOS\t/);
    expect(stdout).toMatch(/SHA256:[a-f0-9]{64}/);

    // Confirma leitura do custo medido cronometrado
    expect(stdout).toContain("CUSTO_MEDIDO_EXECUCAO");
    expect(stdout).toContain("requisicoes_http_emitidas\t2");
    expect(stdout).toContain("tempo_total_parede_ms\t850");
    expect(stdout).toContain("MEDICAO_REAL_CRONOMETRADA");

    // Confirma distribuição e estatísticas amostrais
    expect(stdout).toContain("DISTRIBUICAO_OBSERVACOES_VALIDAS_POR_PONTO");
    expect(stdout).toContain("PONTOS_ABAIXO_DO_LIMIAR_D11");
    expect(stdout).toContain("DISTRIBUICAO_OBSERVACOES_VALIDAS_POR_ANO");
  });

  it("leitor recusa compulsoriamente arquivo no formato pontual (um ponto) com código != 0 e sem imprimir números", () => {
    const resEscritorPontual = gravarEvidenciaGeeSerieS2({
      coordenadas: { latitude: -24.85, longitude: -54.05 },
      operacao: "contrato_teste_pontual",
      respostaBruta: [
        { data: "2020-03-10", ndvi: 0.65, bsi: -0.1 },
      ],
      dataConsulta: "2026-11-08",
    });

    arquivosParaLimpar.push(resEscritorPontual.caminhoAbsoluto);

    const scriptLeitor = path.resolve(process.cwd(), "scripts/auditoria/medir_distribuicao_temporal_s2.mjs");
    const resLeitor = spawnSync(process.execPath, [scriptLeitor, resEscritorPontual.caminhoRelativo], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    // Código diferente de zero obrigatório
    expect(resLeitor.status).not.toBe(0);

    const saidaTotal = (resLeitor.stdout || "") + (resLeitor.stderr || "");
    // Mensagem declarando formato esperado e motivo da recusa
    expect(saidaTotal).toContain("PONTUAL");
    expect(saidaTotal).toContain("REGRA_8_EVIDENCIA_GEE_LOTE");
    expect(saidaTotal).toContain("DECLARAÇÃO: NENHUM número foi computado");

    // Proibição estrita de tabelas numéricas na recusa
    expect(saidaTotal).not.toContain("DISTRIBUICAO_OBSERVACOES_VALIDAS_POR_PONTO");
    expect(saidaTotal).not.toContain("PONTOS_ABAIXO_DO_LIMIAR_D11");
    expect(saidaTotal).not.toContain("CUSTO_MEDIDO_EXECUCAO");
  });
});
