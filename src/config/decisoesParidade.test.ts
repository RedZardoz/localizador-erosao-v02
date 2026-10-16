import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { DECISOES, PARAMETROS } from "./decisoes";
import { extrairDecisoesDoMd } from "../../scripts/gerar_decisoes_md.mjs";

describe("C13 — Paridade DECISOES.md <-> src/config/decisoes.ts", () => {
  const caminhoMd = path.resolve(process.cwd(), "docs/planejamento/DECISOES.md");
  const conteudoMd = fs.readFileSync(caminhoMd, "utf8");
  const mapaMd = extrairDecisoesDoMd(conteudoMd);

  const mapaTs = new Map<string, string>();
  for (const [id, d] of Object.entries(DECISOES)) mapaTs.set(id, d.estado);
  for (const [id, p] of Object.entries(PARAMETROS)) mapaTs.set(id, p.estado);

  it("todos os IDs de DECISOES e PARAMETROS em decisoes.ts devem constar em DECISOES.md", () => {
    const ausentesNoMd: string[] = [];
    for (const id of mapaTs.keys()) {
      if (!mapaMd.has(id)) {
        ausentesNoMd.push(id);
      }
    }
    expect(
      ausentesNoMd,
      `IDs presentes em src/config/decisoes.ts mas ausentes em docs/planejamento/DECISOES.md: ${ausentesNoMd.join(", ")}`
    ).toEqual([]);
  });

  it("todos os estados em DECISOES.md devem ser idênticos aos definidos em decisoes.ts", () => {
    const divergencias: Array<{ id: string; estadoTs: string; estadoMd: string }> = [];
    for (const [id, estadoTs] of mapaTs.entries()) {
      if (mapaMd.has(id)) {
        const estadoMd = mapaMd.get(id);
        if (estadoMd !== estadoTs) {
          divergencias.push({ id, estadoTs, estadoMd: estadoMd! });
        }
      }
    }
    expect(
      divergencias,
      `Divergência de estados entre decisoes.ts e DECISOES.md: ${JSON.stringify(divergencias)}`
    ).toEqual([]);
  });

  it("não deve haver IDs em DECISOES.md que não existam em decisoes.ts", () => {
    const desconhecidosNoMd: string[] = [];
    for (const id of mapaMd.keys()) {
      if (!mapaTs.has(id)) {
        desconhecidosNoMd.push(id);
      }
    }
    expect(desconhecidosNoMd).toEqual([]);
  });
});
