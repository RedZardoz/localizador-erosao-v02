import { describe, it, expect } from "vitest";
import { medido, ehMedido, valorOuNulo } from "./proveniencia";
import fs from "fs";
import path from "path";

describe("Proveniência - medido() com adquiridoEm obrigatório (C08 / A16 / DEC-9)", () => {
  it("garante que medido() sem data não compila em TypeScript (via @ts-expect-error)", () => {
    // @ts-expect-error Deve falhar em tempo de compilação por falta do argumento adquiridoEm
    const prov = medido(42, "Fonte Teste");
    expect(prov.estado).toBe("medido");
    expect(ehMedido(prov)).toBe(true);
    expect(valorOuNulo(prov)).toBe(42);
  });

  it("aceita data explícita da fonte e preserva o valor", () => {
    const prov = medido(100, "Fonte Teste", "2020-11-05", "2026-10-15T12:00:00Z");
    expect(prov.estado).toBe("medido");
    if (prov.estado === "medido") {
      expect(prov.adquiridoEm).toBe("2020-11-05");
      expect(prov.consultadoEm).toBe("2026-10-15T12:00:00Z");
      expect(prov.valor).toBe(100);
    }
  });

  it("garante que nenhum chamador de produção em src/lib passa literal de data constante '2024-01-01'", () => {
    const dirLib = path.resolve(process.cwd(), "src/lib");
    function listarTs(dir: string): string[] {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory() && e.name !== "node_modules") {
          files.push(...listarTs(full));
        } else if (e.isFile() && (full.endsWith(".ts") || full.endsWith(".tsx")) && !full.endsWith(".test.ts")) {
          files.push(full);
        }
      }
      return files;
    }

    const arquivos = listarTs(dirLib);
    for (const arq of arquivos) {
      const conteudo = fs.readFileSync(arq, "utf-8");
      const linhas = conteudo.split("\n");
      linhas.forEach((linha, num) => {
        if (linha.includes("medido(") && linha.includes('"2024-01-01"')) {
          expect.fail(
            `Chamada proibida a medido() com literal '2024-01-01' encontrada em ${path.relative(process.cwd(), arq)}:${num + 1}`
          );
        }
      });
    }
  });
});
