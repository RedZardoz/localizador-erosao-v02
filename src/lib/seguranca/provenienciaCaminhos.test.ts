import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

export interface CaminhoExtraidoProveniencia {
  linha: number;
  bruto: string;
  caminhoNormalizado: string;
  possuiBarraDiretorio: boolean;
}

const PREFIXOS_RAIZ_REPOSITORIO = ["src/", "docs/", "scripts/", "public/", "data/"];
const EXTENSOES_ARQUIVO_REPO = [".ts", ".tsx", ".py", ".mjs", ".md", ".json", ".sql", ".pdf"];

/**
 * Extrai todos os caminhos de arquivo ou diretório do repositório citados entre crases (`...`)
 * em um documento Markdown (Regra R1 / Regra 9).
 */
export function extrairCaminhosRepositorioProveniencia(
  conteudoMarkdown: string
): CaminhoExtraidoProveniencia[] {
  const linhas = conteudoMarkdown.split(/\r?\n/);
  const extraidos: CaminhoExtraidoProveniencia[] = [];

  linhas.forEach((linhaTexto, idx) => {
    const regexCrase = /`([^`\r\n]+)`/g;
    let match: RegExpExecArray | null;
    while ((match = regexCrase.exec(linhaTexto)) !== null) {
      const token = match[1].trim();
      if (!token || token.startsWith("--")) {
        continue;
      }

      // Ignora nomes de branches git como `sarel/v2`
      if (token === "sarel/v2" || token.startsWith("origin/")) {
        continue;
      }

      // Remove âncoras de linha como #L12-L34 ou :252
      const semAncora = token.replace(/#L\d+(-L\d+)?$/, "").replace(/:\d+(-\d+)?$/, "");

      const comecaComPrefixoRepo = PREFIXOS_RAIZ_REPOSITORIO.some((p) =>
        semAncora.startsWith(p)
      );
      const terminaComExtensaoRepo =
        !semAncora.includes(" ") &&
        EXTENSOES_ARQUIVO_REPO.some((ext) => semAncora.endsWith(ext));

      if (comecaComPrefixoRepo || terminaComExtensaoRepo) {
        // Ignora placeholders explícitos contendo <...> ou *
        if (semAncora.includes("<") || semAncora.includes(">") || semAncora.includes("*")) {
          continue;
        }
        extraidos.push({
          linha: idx + 1,
          bruto: token,
          caminhoNormalizado: semAncora,
          possuiBarraDiretorio: semAncora.includes("/"),
        });
      }
    }
  });

  return extraidos;
}

/**
 * Verifica se cada caminho extraído existe exatamente em `path.resolve(rootDir, caminhoNormalizado)`,
 * sem busca heurística por subpastas (exigindo caminhos relativos completos desde a raiz do repositório).
 */
export function verificarExistenciaCaminhosProveniencia(
  caminhos: CaminhoExtraidoProveniencia[],
  rootDir: string
): Array<{ item: CaminhoExtraidoProveniencia; motivo: string }> {
  const falhas: Array<{ item: CaminhoExtraidoProveniencia; motivo: string }> = [];

  for (const item of caminhos) {
    const absDireto = path.resolve(rootDir, item.caminhoNormalizado);
    if (!fs.existsSync(absDireto)) {
      falhas.push({
        item,
        motivo: `Caminho inexistente a partir da raiz do repositório: '${item.caminhoNormalizado}' (linha ${item.linha})`,
      });
    }
  }

  return falhas;
}

describe("Verificação automatizada de caminhos em docs/PROVENIENCIA_ASSISTENCIA_IA.md (Disciplina R1 / Regra 9)", () => {
  const rootDir = process.cwd();

  it("meta-teste: deve detectar caminhos plausíveis porém inexistentes como src/components/inspecao/, src/lib/exportacao/ e src/lib/bacias.ts", () => {
    const docFalso = [
      "Alterado `src/components/inspecao/InspetorPonto.tsx` e `src/lib/exportacao/pacoteReprodutibilidade.ts`.",
      "Polígono lido de `src/lib/bacias.ts` e decisão em `src/config/decisoes.ts`.",
    ].join("\n");

    const extraidos = extrairCaminhosRepositorioProveniencia(docFalso);
    expect(extraidos.map((e) => e.caminhoNormalizado)).toEqual([
      "src/components/inspecao/InspetorPonto.tsx",
      "src/lib/exportacao/pacoteReprodutibilidade.ts",
      "src/lib/bacias.ts",
      "src/config/decisoes.ts",
    ]);

    const falhas = verificarExistenciaCaminhosProveniencia(extraidos, rootDir);
    expect(falhas.map((f) => f.item.caminhoNormalizado)).toEqual([
      "src/components/inspecao/InspetorPonto.tsx",
      "src/lib/exportacao/pacoteReprodutibilidade.ts",
      "src/lib/bacias.ts",
    ]);
  });

  it("todos os caminhos de repositório citados em docs/PROVENIENCIA_ASSISTENCIA_IA.md devem existir no disco", () => {
    const docPath = path.resolve(rootDir, "docs/PROVENIENCIA_ASSISTENCIA_IA.md");
    expect(fs.existsSync(docPath)).toBe(true);

    const conteudo = fs.readFileSync(docPath, "utf-8");
    const extraidos = extrairCaminhosRepositorioProveniencia(conteudo);
    expect(extraidos.length).toBeGreaterThan(0);

    const falhas = verificarExistenciaCaminhosProveniencia(extraidos, rootDir);
    if (falhas.length > 0) {
      const msg = falhas.map((f) => `  - ${f.motivo}`).join("\n");
      expect.fail(
        `Caminhos inexistentes encontrados em docs/PROVENIENCIA_ASSISTENCIA_IA.md:\n${msg}`
      );
    }
    expect(falhas).toHaveLength(0);
  });
});
