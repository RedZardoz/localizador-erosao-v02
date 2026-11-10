import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

describe("scripts/sortear_poligonos_d16.ts — Trava Pré-Registrada D11.2 (Prompt E' / 10/11/2026)", () => {
  const scriptPath = path.resolve(process.cwd(), "scripts", "sortear_poligonos_d16.ts");
  const sorteioDir = path.resolve(process.cwd(), "docs", "verificacoes", "sorteio");

  function listarArquivosSorteio(): string[] {
    if (!fs.existsSync(sorteioDir)) return [];
    return fs.readdirSync(sorteioDir);
  }

  it("recusa imediatamente qualquer execução do sorteio de D16 com bloqueio de pré-registro D11.2 (exit code 1)", () => {
    const arquivosAntes = listarArquivosSorteio();

    const resultado = spawnSync(
      process.execPath,
      ["--import", "./scripts/ts-loader.mjs", scriptPath, "--dry-run"],
      {
        cwd: process.cwd(),
        encoding: "utf-8",
        timeout: 20000,
      }
    );

    const arquivosDepois = listarArquivosSorteio();

    // Deve encerrar com código 1
    expect(resultado.status).toBe(1);

    // Mensagem mandatória exigida pela Tarefa 3
    const saida = resultado.stderr + resultado.stdout;
    expect(saida).toContain("[BLOQUEIO PRE-REGISTRADO D11.2]");
    expect(saida).toContain("O sorteio de D16 esta travado");
    expect(saida).toContain("Prompt H");

    // Nenhum selo gerado
    expect(arquivosDepois).toEqual(arquivosAntes);
  });
});
