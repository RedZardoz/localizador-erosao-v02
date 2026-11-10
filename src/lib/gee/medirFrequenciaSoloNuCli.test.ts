/**
 * ============================================================================
 * Testes Automatizados de Recusa Fail-Closed de Universo de Candidatos
 * SAREL v2.0 — Disciplina Pericial PPGTCA 2026 (Prompt F — Tarefa 4)
 * ============================================================================
 *
 * Assevera que o carregador de candidatos do CLI medir_frequencia_solo_nu_lote.ts:
 * 1. Recusa compulsoriamente arquivos contendo apenas metadados/agregados (ex: 2026-09-30);
 * 2. Elimina qualquer fallback silencioso para outros pools amostrais;
 * 3. Carrega com sucesso os 677 candidatos individuais do artefato oficial 2026-11-10.
 */

import { describe, it, expect } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";
import { carregarCandidatos } from "../../../scripts/medir_frequencia_solo_nu_lote";

describe("CLI Medição de Solo Nu — Recusa Fail-Closed sem Fallback Silencioso (Tarefa 4)", () => {
  it("recusa compulsoriamente arquivo de 30/09/2026 que contém apenas agregados sem lista individual", () => {
    const caminhoAgregados = "docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json";
    expect(fs.existsSync(caminhoAgregados)).toBe(true);

    expect(() => carregarCandidatos(caminhoAgregados)).toThrowError(
      /\[FAIL-CLOSED\] O arquivo indicado '.*' contém metadados\/agregados do funil amostral/
    );
  });

  it("recusa arquivo sintético contendo apenas agregados do funil e nenhum candidato individual", () => {
    const pastaTemp = fs.mkdtempSync(path.join(os.tmpdir(), "sarel-teste-agregados-"));
    const arquivoTemp = path.join(pastaTemp, "agregados_sem_pontos.json");

    try {
      fs.writeFileSync(
        arquivoTemp,
        JSON.stringify({
          dataExecucao: "2026-11-10",
          funilContagem: {
            candidatosComTerrenoD07: 680,
          },
        }),
        "utf8"
      );

      expect(() => carregarCandidatos(arquivoTemp)).toThrowError(
        /\[FAIL-CLOSED\] O arquivo indicado '.*' contém metadados\/agregados do funil amostral \(680 candidatos\)/
      );
    } finally {
      fs.rmSync(pastaTemp, { recursive: true, force: true });
    }
  });

  it("carrega com sucesso o universo canônico de 677 candidatos de 10/11/2026 sem fallback", () => {
    const caminhoUniverso = "docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json";
    expect(fs.existsSync(caminhoUniverso)).toBe(true);

    const resultado = carregarCandidatos(caminhoUniverso);
    expect(resultado.pontos).toHaveLength(677);
    expect(resultado.fonte).toBe(caminhoUniverso);
    expect(resultado.aviso).toBeUndefined();

    // Valida coordenadas do primeiro candidato
    const p0 = resultado.pontos[0];
    expect(p0.id).toBe("cand-3254");
    expect(p0.latitude).toBeCloseTo(-24.509018, 5);
    expect(p0.longitude).toBeCloseTo(-54.076338, 5);
  });

  it("garante que o CLI em subprocesso recusa arquivo de agregados com exit code 1", () => {
    const { execSync } = require("child_process");
    let falhouComErro = false;
    let saidaCapturada = "";

    try {
      execSync(
        `node --import ./scripts/ts-loader.mjs scripts/medir_frequencia_solo_nu_lote.ts --candidatos docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json`,
        { encoding: "utf8", stdio: "pipe" }
      );
    } catch (err: any) {
      falhouComErro = true;
      saidaCapturada = (err.stdout || "") + (err.stderr || "");
    }

    expect(falhouComErro).toBe(true);
    expect(saidaCapturada).toContain("[ERRO UNIVERSO DE CANDIDATOS]");
    expect(saidaCapturada).toContain("[FAIL-CLOSED]");
    expect(saidaCapturada).toContain("contém metadados/agregados do funil amostral");
  });
});
