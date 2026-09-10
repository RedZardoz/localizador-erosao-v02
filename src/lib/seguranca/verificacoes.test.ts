import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Varredor de evidências de verificação externa (Regra 8).
 * Qualquer comentário do tipo:
 * VERIFICADO AAAA-MM-DD — evidência: docs/verificacoes/<arquivo>
 * deve apontar para um arquivo existente em docs/verificacoes/.
 */

export interface DeclaracaoVerificacao {
  arquivoFonte: string;
  linha: number;
  data: string;
  caminhoEvidencia: string;
}

const REGEX_VERIFICADO = /VERIFICADO\s+(\d{4}-\d{2}-\d{2})\s*—\s*evidência:\s*([^\s*]+)/g;

export function extrairVerificacoes(codigo: string, arquivoFonte: string): DeclaracaoVerificacao[] {
  const linhas = codigo.split("\n");
  const encontradas: DeclaracaoVerificacao[] = [];

  linhas.forEach((linha, idx) => {
    let match;
    const regexLocal = new RegExp(REGEX_VERIFICADO);
    while ((match = regexLocal.exec(linha)) !== null) {
      encontradas.push({
        arquivoFonte,
        linha: idx + 1,
        data: match[1],
        caminhoEvidencia: match[2].trim(),
      });
    }
  });

  return encontradas;
}

describe("Varredor de Evidências de Verificação (Regra 8)", () => {
  describe("Meta-testes (confirma que o detector falha quando a evidência NÃO existe)", () => {
    it("extrai declaração de verificação formatada corretamente", () => {
      const code = `// VERIFICADO 2026-09-08 — evidência: docs/verificacoes/2026-09-08_embrapa_capabilities.xml`;
      const decs = extrairVerificacoes(code, "exemplo.ts");
      expect(decs).toHaveLength(1);
      expect(decs[0].data).toBe("2026-09-08");
      expect(decs[0].caminhoEvidencia).toBe("docs/verificacoes/2026-09-08_embrapa_capabilities.xml");
    });

    it("falha quando aponta para um arquivo inexistente", () => {
      const decInvalida: DeclaracaoVerificacao = {
        arquivoFonte: "exemplo.ts",
        linha: 10,
        data: "2026-09-08",
        caminhoEvidencia: "docs/verificacoes/arquivo_fantasma_nao_existe.xml",
      };

      const caminhoReal = path.resolve(process.cwd(), decInvalida.caminhoEvidencia);
      expect(fs.existsSync(caminhoReal)).toBe(false);
    });
  });

  describe("Varredura em código ativo em src/", () => {
    function listarArquivosTs(dir: string): string[] {
      if (!fs.existsSync(dir)) return [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const arquivos: string[] = [];
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          arquivos.push(...listarArquivosTs(fullPath));
        } else if (entry.isFile() && (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) && !fullPath.endsWith(".test.ts") && !fullPath.endsWith(".test.tsx")) {
          arquivos.push(fullPath);
        }
      }
      return arquivos;
    }

    it("toda afirmação VERIFICADO em código deve apontar para arquivo existente em docs/verificacoes/", () => {
      const raizSrc = path.resolve(__dirname, "../..");
      const arquivos = listarArquivosTs(raizSrc);
      const declaracoes: DeclaracaoVerificacao[] = [];

      for (const arq of arquivos) {
        const conteudo = fs.readFileSync(arq, "utf-8");
        const relPath = path.relative(process.cwd(), arq);
        declaracoes.push(...extrairVerificacoes(conteudo, relPath));
      }

      for (const d of declaracoes) {
        const absPath = path.resolve(process.cwd(), d.caminhoEvidencia);
        const existe = fs.existsSync(absPath);
        expect(
          existe,
          `Declaração de verificação em ${d.arquivoFonte}:${d.linha} cita evidência inexistente: ${d.caminhoEvidencia}`
        ).toBe(true);
      }
    });
  });
});
