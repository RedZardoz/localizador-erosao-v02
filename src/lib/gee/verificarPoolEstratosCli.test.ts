import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("scripts/verificar_pool_estratos.ts — CLI de Verificação do Pool por Estrato (DP-20 P1.2 e P1.3)", () => {
  const scriptPath = path.resolve(process.cwd(), "scripts", "verificar_pool_estratos.ts");
  const sorteioDir = path.resolve(process.cwd(), "docs", "verificacoes", "sorteio");

  function listarArquivosSorteio(): string[] {
    if (!fs.existsSync(sorteioDir)) return [];
    return fs.readdirSync(sorteioDir);
  }

  it("recusa execução sem --candidatos (exit code != 0)", () => {
    const arquivosAntes = listarArquivosSorteio();

    const resultado = spawnSync(
      process.execPath,
      [
        "--import",
        "./scripts/ts-loader.mjs",
        scriptPath,
        "--reservas",
        "2",
        "--n-minimo",
        "4",
        "--taxas",
        "0.1,0.25",
      ],
      {
        cwd: process.cwd(),
        encoding: "utf-8",
      }
    );

    const arquivosDepois = listarArquivosSorteio();
    expect(resultado.status).not.toBe(0);
    expect(resultado.stderr + resultado.stdout).toMatch(/--candidatos/i);
    expect(arquivosDepois).toEqual(arquivosAntes);
  });

  it("recusa candidato sintético com a MESMA mensagem do sorteio D23", () => {
    const arquivosAntes = listarArquivosSorteio();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sarel-pool-sint-"));
    const tempFile = path.join(tempDir, "candidatos_sinteticos.json");

    try {
      // 1. Candidato com DRY-CAND-
      fs.writeFileSync(
        tempFile,
        JSON.stringify([
          {
            id: "DRY-CAND-001",
            latitude: -24.5,
            longitude: -53.5,
            declividadePct: 10,
            frequenciaSoloNu: 0.2,
            nivelK: 1,
            classeWorldCover2020: 40,
            classeWorldCover2021: 40,
          },
        ])
      );

      const resultado = spawnSync(
        process.execPath,
        [
          "--import",
          "./scripts/ts-loader.mjs",
          scriptPath,
          "--candidatos",
          tempFile,
          "--reservas",
          "2",
          "--n-minimo",
          "4",
          "--taxas",
          "0.1,0.25",
        ],
        {
          cwd: process.cwd(),
          encoding: "utf-8",
        }
      );

      const arquivosDepois = listarArquivosSorteio();
      expect(resultado.status).not.toBe(0);
      const saidaCompleta = resultado.stderr + resultado.stdout;
      expect(saidaCompleta).toContain(
        "Recusa de sorteio D23 (T4.3): o selo de sorteio jamais pode ser gerado a partir de candidatos sintéticos/fabricados (DRY-CAND- / isSynthetic)."
      );
      expect(arquivosDepois).toEqual(arquivosAntes);
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
    }
  });

  it("executa com conjunto de verificação, exibe aviso obrigatório no topo, não imprime coordenadas/CAR e NÃO grava em docs/verificacoes/sorteio", () => {
    const arquivosAntes = listarArquivosSorteio();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sarel-pool-valido-"));
    const tempCandFile = path.join(tempDir, "candidatos_teste.json");
    const tempOutFile = path.join(tempDir, "relatorio_saida.txt");

    try {
      // Cria conjunto mínimo com 18 estratos (6 por estrato = 108 candidatos) com IDs neutros reais
      const sTercis = [4.2, 9.5, 15.8];
      const eTercis = [0.12, 0.38, 0.72];
      const kNiveis: Array<1 | 2> = [1, 2];
      const lista: Array<{
        id: string;
        latitude: number;
        longitude: number;
        declividadePct: number;
        frequenciaSoloNu: number;
        nivelK: 1 | 2;
        classeWorldCover2020: number;
        classeWorldCover2021: number;
      }> = [];

      let seq = 1;
      for (let sIdx = 0; sIdx < sTercis.length; sIdx++) {
        for (let eIdx = 0; eIdx < eTercis.length; eIdx++) {
          for (const k of kNiveis) {
            for (let i = 0; i < 6; i++) {
              lista.push({
                id: `PROP-TESTE-${String(seq).padStart(4, "0")}`,
                latitude: -24.75 - seq * 0.001,
                longitude: -53.78 - seq * 0.001,
                declividadePct: Number((sTercis[sIdx] + i * 0.04 + (eIdx * 2 + k) * 0.001).toFixed(4)),
                frequenciaSoloNu: Number((eTercis[eIdx] + i * 0.004 + (sIdx * 2 + k) * 0.0001).toFixed(4)),
                nivelK: k,
                classeWorldCover2020: 40,
                classeWorldCover2021: 40,
              });
              seq++;
            }
          }
        }
      }

      fs.writeFileSync(tempCandFile, JSON.stringify(lista));

      const resultado = spawnSync(
        process.execPath,
        [
          "--import",
          "./scripts/ts-loader.mjs",
          scriptPath,
          "--candidatos",
          tempCandFile,
          "--reservas",
          "2",
          "--n-minimo",
          "4",
          "--taxas",
          "0.1,0.25,0.5",
          "--saida",
          tempOutFile,
        ],
        {
          cwd: process.cwd(),
          encoding: "utf-8",
        }
      );

      const arquivosDepois = listarArquivosSorteio();
      expect(resultado.status).toBe(0);

      const stdout = resultado.stdout;
      // Regra (e): Aviso obrigatório no topo
      expect(stdout).toContain(
        "Cenários de taxa de recusa são ILUSTRATIVOS; não são estimativa. O pool só é confiável depois de fixadas as decisões DP-1, DP-3 e DP-6 (mudam N_h)."
      );

      // Regra (d): Não imprime coordenadas nem códigos CAR
      expect(stdout).not.toContain("-24.75");
      expect(stdout).not.toContain("-53.78");
      expect(stdout).not.toMatch(/PR-\d{7}/);

      // Citação obrigatória da função de contagem reaproveitada do sorteio
      expect(stdout).toContain("verificarPreCondicoesSorteioD16");

      // Regra (c): Nenhum arquivo criado em docs/verificacoes/sorteio
      expect(arquivosDepois).toEqual(arquivosAntes);

      // Arquivo opcional gravado fora do repositório
      expect(fs.existsSync(tempOutFile)).toBe(true);
      const conteudoSaida = fs.readFileSync(tempOutFile, "utf-8");
      expect(conteudoSaida).toContain("Cenários de taxa de recusa são ILUSTRATIVOS");
    } finally {
      if (fs.existsSync(tempCandFile)) fs.unlinkSync(tempCandFile);
      if (fs.existsSync(tempOutFile)) fs.unlinkSync(tempOutFile);
      if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
    }
  });

  it("recusa argumento --saida apontando para docs/verificacoes/sorteio", () => {
    const arquivosAntes = listarArquivosSorteio();
    const caminhoProibido = path.join(sorteioDir, "tentativa_proibida.txt");

    const resultado = spawnSync(
      process.execPath,
      [
        "--import",
        "./scripts/ts-loader.mjs",
        scriptPath,
        "--candidatos",
        "inexistente.json",
        "--reservas",
        "2",
        "--n-minimo",
        "4",
        "--taxas",
        "0.1",
        "--saida",
        caminhoProibido,
      ],
      {
        cwd: process.cwd(),
        encoding: "utf-8",
      }
    );

    const arquivosDepois = listarArquivosSorteio();
    expect(resultado.status).not.toBe(0);
    expect(arquivosDepois).toEqual(arquivosAntes);
    expect(fs.existsSync(caminhoProibido)).toBe(false);
  });
});
