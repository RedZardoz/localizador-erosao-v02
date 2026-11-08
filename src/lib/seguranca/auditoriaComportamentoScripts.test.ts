import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface ResultadoValidacaoScript {
  valido: boolean;
  motivo?: string;
}

/**
 * Validador comportamental para scripts de auditoria (Regra 1, Regra 8 e §18).
 * Assegura que nenhum script de auditoria produza números sem declarar explicitamente
 * fontes de dados verificáveis existentes no disco na primeira linha de saída.
 */
export function validarComportamentoScriptAuditoria(
  caminhoScript: string,
  repoRoot: string = process.cwd()
): ResultadoValidacaoScript {
  const res = spawnSync(process.execPath, [caminhoScript], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 15000,
  });

  const stdout = res.stdout || "";
  const saidaTotal = stdout + (res.stderr || "");
  const primeiraLinha = stdout.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
  const temNumeros = /\d/.test(stdout);

  if (res.status === 0) {
    if (temNumeros) {
      if (!primeiraLinha.startsWith("FONTE_DOS_DADOS\t")) {
        return {
          valido: false,
          motivo: `Script ${path.basename(caminhoScript)} encerrou com código 0 e imprimiu números, mas a primeira linha não começa com "FONTE_DOS_DADOS\\t" (recebido: "${primeiraLinha}")`,
        };
      }

      const caminhosStr = primeiraLinha.slice("FONTE_DOS_DADOS\t".length).trim();
      if (!caminhosStr) {
        return {
          valido: false,
          motivo: `Script ${path.basename(caminhoScript)} declarou FONTE_DOS_DADOS sem caminhos`,
        };
      }

      const caminhos = caminhosStr.split("\t").map((c) => c.trim()).filter((c) => c.length > 0);
      if (caminhos.length === 0) {
        return {
          valido: false,
          motivo: `Script ${path.basename(caminhoScript)} não especificou caminhos válidos em FONTE_DOS_DADOS`,
        };
      }

      for (const caminho of caminhos) {
        const caminhoAbs = path.isAbsolute(caminho) ? caminho : path.resolve(repoRoot, caminho);
        if (!fs.existsSync(caminhoAbs)) {
          return {
            valido: false,
            motivo: `Script ${path.basename(caminhoScript)} declarou fonte de dados inexistente no disco: "${caminho}" (resolvido: "${caminhoAbs}")`,
          };
        }
      }
    }
    return { valido: true };
  } else {
    // Encerramento com código != 0 (recusa esperada quando parâmetros são omitidos)
    // A saída NÃO pode conter linhas de tabela com números fabricados
    const linhas = saidaTotal.split(/\r?\n/);
    for (const linha of linhas) {
      const colunas = linha.split("\t");
      if (colunas.length >= 2 && /\d+/.test(linha)) {
        const eStackTrace = /^\s*at\s+/.test(linha);
        if (!eStackTrace) {
          return {
            valido: false,
            motivo: `Script ${path.basename(caminhoScript)} encerrou com código ${res.status}, mas imprimiu linha de tabela com números: "${linha}"`,
          };
        }
      }
    }
    return { valido: true };
  }
}

describe("Trava comportamental de scripts de auditoria (Regras 1, 8 e §18)", () => {
  const dirAuditoria = path.resolve(process.cwd(), "scripts/auditoria");
  const scripts = fs.existsSync(dirAuditoria)
    ? fs
        .readdirSync(dirAuditoria)
        .filter((f) => f.endsWith(".mjs") || f.endsWith(".js"))
        .map((f) => path.join(dirAuditoria, f))
    : [];

  it("encontra scripts de auditoria em scripts/auditoria/", () => {
    expect(scripts.length).toBeGreaterThanOrEqual(4);
  });

  for (const scriptPath of scripts) {
    const nome = path.basename(scriptPath);
    it(`script ${nome} cumpre rigorosamente os requisitos de rastreabilidade e recusa`, () => {
      const resultado = validarComportamentoScriptAuditoria(scriptPath);
      expect(resultado.valido, resultado.motivo).toBe(true);
    });
  }

  describe("Meta-testes (§18 da Lei Fundamental: garantia de não-vacuidade)", () => {
    it("rejeita script que encerra com código 0 e imprime tabela de números literais sem FONTE_DOS_DADOS", () => {
      const tmpScript = path.join(os.tmpdir(), `meta_teste_fake_audit_${Date.now()}_1.mjs`);
      fs.writeFileSync(
        tmpScript,
        `console.log("RELATORIO FABRICADO");\nconsole.log("safra\\tquantidade");\nconsole.log("2020\\t100");\nprocess.exit(0);`
      );
      try {
        const resultado = validarComportamentoScriptAuditoria(tmpScript);
        expect(resultado.valido).toBe(false);
        expect(resultado.motivo).toMatch(/FONTE_DOS_DADOS/);
      } finally {
        if (fs.existsSync(tmpScript)) fs.unlinkSync(tmpScript);
      }
    });

    it("rejeita script que declara FONTE_DOS_DADOS apontando para arquivo inexistente", () => {
      const tmpScript = path.join(os.tmpdir(), `meta_teste_fake_audit_${Date.now()}_2.mjs`);
      fs.writeFileSync(
        tmpScript,
        `console.log("FONTE_DOS_DADOS\\tarquivo_inexistente_nao_encontrado_xyz.json");\nconsole.log("total\\t42");\nprocess.exit(0);`
      );
      try {
        const resultado = validarComportamentoScriptAuditoria(tmpScript);
        expect(resultado.valido).toBe(false);
        expect(resultado.motivo).toMatch(/inexistente no disco/);
      } finally {
        if (fs.existsSync(tmpScript)) fs.unlinkSync(tmpScript);
      }
    });

    it("rejeita script que encerra com erro mas imprime linhas de tabela com números", () => {
      const tmpScript = path.join(os.tmpdir(), `meta_teste_fake_audit_${Date.now()}_3.mjs`);
      fs.writeFileSync(
        tmpScript,
        `console.log("safra\\t2021\\t550");\nprocess.exit(1);`
      );
      try {
        const resultado = validarComportamentoScriptAuditoria(tmpScript);
        expect(resultado.valido).toBe(false);
        expect(resultado.motivo).toMatch(/linha de tabela com números/);
      } finally {
        if (fs.existsSync(tmpScript)) fs.unlinkSync(tmpScript);
      }
    });
  });
});
