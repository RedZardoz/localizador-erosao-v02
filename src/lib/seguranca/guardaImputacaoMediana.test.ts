import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Guarda Anti-Imputação por Mediana (N03.6, DEC-14c, DEC-15c)", () => {
  it("varre scripts/ e src/ e falha se houver imputação por mediana fora de scripts/d25/ e do legado deprecado", () => {
    const rootDir = path.resolve(__dirname, "../../..");
    const scriptsDir = path.join(rootDir, "scripts");
    const srcDir = path.join(rootDir, "src");

    // Exceções permitidas explicitamente:
    // 1. treinar_xgboost_loco.py: trainer legado deprecado (banner DEPRECATED e recusa em probatório com exit code 2)
    // 2. scriptAvaliacaoD25.generated.ts: embutimento byte-exato do scripts/d25/avaliacao_d25_referencia.py no ZIP de reprodutibilidade
    // 3. guardaImputacaoMediana.test.ts: o próprio teste de guarda
    const excecoesPermitidas = new Set([
      path.resolve(scriptsDir, "treinar_xgboost_loco.py"),
      path.resolve(srcDir, "lib/export/scriptAvaliacaoD25.generated.ts"),
      path.resolve(srcDir, "lib/seguranca/guardaImputacaoMediana.test.ts"),
    ]);

    // Padrões de detecção de imputação por mediana
    const padroesImputacao = [
      (linha: string) => linha.includes(".fillna(") && (linha.includes("median") || linha.includes(".median()")),
      (linha: string) => linha.toLowerCase().includes("simpleimputer") && linha.includes("median"),
      (linha: string) => linha.toLowerCase().includes("impute") && (linha.includes("median") || linha.includes("mediana")),
    ];

    function varrerDiretorio(dir: string): string[] {
      const arquivos: string[] = [];
      const itens = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of itens) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          // Ignora scripts/d25 (onde a implementação de referência opera) e diretórios auxiliares
          if (item.name === "d25" || item.name === "__pycache__" || item.name === "node_modules") {
            continue;
          }
          arquivos.push(...varrerDiretorio(fullPath));
        } else if (
          item.name.endsWith(".py") ||
          item.name.endsWith(".ts") ||
          item.name.endsWith(".tsx") ||
          item.name.endsWith(".js") ||
          item.name.endsWith(".mjs")
        ) {
          arquivos.push(fullPath);
        }
      }
      return arquivos;
    }

    const todosArquivos = [...varrerDiretorio(scriptsDir), ...varrerDiretorio(srcDir)];
    expect(todosArquivos.length).toBeGreaterThan(50);

    const violacoes: { arquivo: string; linha: number; texto: string }[] = [];

    for (const arq of todosArquivos) {
      if (excecoesPermitidas.has(path.resolve(arq))) {
        continue;
      }
      const conteudo = fs.readFileSync(arq, "utf8");
      const linhas = conteudo.split(/\r?\n/);
      for (let i = 0; i < linhas.length; i++) {
        const l = linhas[i];
        // Desconsidera menções ao município paranaense "Medianeira"
        const lSemMedianeira = l.replace(/medianeira/gi, "");
        for (const padrao of padroesImputacao) {
          if (padrao(lSemMedianeira)) {
            violacoes.push({
              arquivo: path.relative(rootDir, arq),
              linha: i + 1,
              texto: l.trim(),
            });
            break;
          }
        }
      }
    }

    expect(
      violacoes,
      `Violações de imputação por mediana encontradas em scripts/ e src/: ${JSON.stringify(violacoes, null, 2)}`
    ).toEqual([]);
  });

  it("o script legado treinar_xgboost_loco.py deve conter compulsoriamente banner DEPRECATED e recusa de modo probatório", () => {
    const legacyPath = path.resolve(__dirname, "../../../scripts/treinar_xgboost_loco.py");
    const conteudo = fs.readFileSync(legacyPath, "utf8");
    expect(conteudo).toContain("[DEPRECATED]");
    expect(conteudo).toContain("sys.exit(2)");
    expect(conteudo).toContain("scripts/d25/");
    expect(conteudo).not.toContain("auc = 0.5");
  });
});
