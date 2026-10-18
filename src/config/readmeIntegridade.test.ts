import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { DECISOES } from "./decisoes";

describe("C14 — Alinhamento e integridade do README.md", () => {
  const caminhoReadme = path.resolve(process.cwd(), "README.md");
  const conteudoReadme = fs.readFileSync(caminhoReadme, "utf8");

  it("não deve conter instrução obsoleta 'git checkout legado-pre-sarel'", () => {
    expect(conteudoReadme).not.toContain("git checkout legado-pre-sarel");
  });

  it("nenhuma decisão citada como pendente no README pode estar decidida em decisoes.ts", () => {
    // Procura padrões como "decisões metodológicas pendentes (D13, D14, D15)" ou "Dxx pendente"
    const regexPendentes = /pendentes?\s*\(([^)]+)\)|pendentes?:\s*([^\n.]+)/gi;
    const idsPendentes: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regexPendentes.exec(conteudoReadme)) !== null) {
      const trecho = match[1] || match[2] || "";
      const matchesD = trecho.match(/\bD\d+\b/g);
      if (matchesD) {
        idsPendentes.push(...matchesD);
      }
    }

    const indevidamenteMarcadasComoPendentes: string[] = [];
    for (const id of idsPendentes) {
      const d = (DECISOES as Record<string, any>)[id];
      if (d && d.estado === "decidida") {
        indevidamenteMarcadasComoPendentes.push(`${id} (estado em decisoes.ts: decidida)`);
      }
    }

    expect(
      indevidamenteMarcadasComoPendentes,
      `README cita como pendente decisões já decididas em decisoes.ts: ${indevidamenteMarcadasComoPendentes.join(", ")}`
    ).toEqual([]);
  });
});
