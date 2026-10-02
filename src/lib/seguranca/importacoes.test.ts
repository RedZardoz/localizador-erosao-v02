import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Varredor de quarentena:
 * Assegura que NENHUM arquivo dentro de src/ faça importações de legado/.
 */

export interface ImportacaoProibida {
  arquivo: string;
  linha: number;
  trecho: string;
}

const REGEX_IMPORT_LEGADO = /(from\s+["'].*legado.*["']|require\s*\(\s*["'].*legado.*["']\s*\))/;

export function verificarImportacoes(codigo: string, nomeArquivo: string): ImportacaoProibida[] {
  const linhas = codigo.split("\n");
  const violacoes: ImportacaoProibida[] = [];

  linhas.forEach((linha, idx) => {
    if (REGEX_IMPORT_LEGADO.test(linha)) {
      violacoes.push({
        arquivo: nomeArquivo,
        linha: idx + 1,
        trecho: linha.trim(),
      });
    }
  });

  return violacoes;
}

export function listarArquivos(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const arquivos: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      arquivos.push(...listarArquivos(fullPath));
    } else if (entry.isFile() && (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx"))) {
      // Não varrer este próprio arquivo de teste
      if (!fullPath.endsWith("importacoes.test.ts")) {
        arquivos.push(fullPath);
      }
    }
  }
  return arquivos;
}

describe("Varredor de Quarentena (Importações de legado/)", () => {
  describe("Meta-testes (confirma que detecta imports proibidos ou diretório vazio)", () => {
    it("detecta import from legado", () => {
      const code = `import { foo } from "@/legado/localizador/src/lib/algo";`;
      const v = verificarImportacoes(code, "exemplo.ts");
      expect(v).toHaveLength(1);
    });

    it("detecta require de legado", () => {
      const code = `const bar = require("../../legado/sarel1/src/algo");`;
      const v = verificarImportacoes(code, "exemplo.ts");
      expect(v).toHaveLength(1);
    });

    it("meta-teste: varredura em diretório vazio deve falhar compulsoriamente por piso mínimo de arquivos", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "meta_test_importacoes_vazio_"));
      try {
        const arquivosTmp = listarArquivos(tmpDir);
        const PISO_MINIMO_ARQUIVOS_SRC = 130;
        expect(() => {
          expect(
            arquivosTmp.length,
            `Varredura de importações proibidas examinou apenas ${arquivosTmp.length} arquivos em src/ (esperado >= ${PISO_MINIMO_ARQUIVOS_SRC}). Possível diretório renomeado ou raiz incorreta: ${tmpDir}`
          ).toBeGreaterThanOrEqual(PISO_MINIMO_ARQUIVOS_SRC);
        }).toThrow(/Possível diretório renomeado ou raiz incorreta/);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe("Varredura em todo src/", () => {
    it("nenhum arquivo em src/ importa de legado/", () => {
      const raizSrc = path.resolve(__dirname, "../..");
      const arquivos = listarArquivos(raizSrc);

      // Piso mínimo de arquivos examinados (medido hoje: 177 arquivos; folga de ~73% => piso 130)
      const PISO_MINIMO_ARQUIVOS_SRC = 130;
      expect(
        arquivos.length,
        `Varredura de importações proibidas examinou apenas ${arquivos.length} arquivos em src/ (esperado >= ${PISO_MINIMO_ARQUIVOS_SRC}). Possível diretório renomeado ou raiz incorreta: ${raizSrc}`
      ).toBeGreaterThanOrEqual(PISO_MINIMO_ARQUIVOS_SRC);

      const todasViolacoes: ImportacaoProibida[] = [];

      for (const arq of arquivos) {
        const conteudo = fs.readFileSync(arq, "utf-8");
        const rel = path.relative(process.cwd(), arq);
        todasViolacoes.push(...verificarImportacoes(conteudo, rel));
      }

      if (todasViolacoes.length > 0) {
        const msg = todasViolacoes.map((v) => `  ${v.arquivo}:${v.linha} -> ${v.trecho}`).join("\n");
        expect.fail(`Importações proibidas de legado/ detectadas em src/:\n${msg}`);
      }
      expect(todasViolacoes).toHaveLength(0);
    });
  });
});
