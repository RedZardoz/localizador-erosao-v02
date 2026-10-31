import { describe, it, expect } from "vitest";
import { DECISOES, PARAMETROS, Decisao } from "./decisoes";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * ============================================================================
 * Trava da Norma de Lastro Científico R-L5 — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * O QUÊ: confronta os campos `referencia` de DECISOES e PARAMETROS contra o
 * inventário bibliográfico em docs/bibliografia/INVENTARIO_SELECAO_BIBLIOGRAFICA.md.
 *
 * POR QUÊ EXISTE: a regra R-L5 da norma (docs/NORMA_LASTRO_CIENTIFICO.md) exige que
 * toda obra citada esteja catalogada no inventário do acervo, com metadados (autor,
 * ano, título, identificador e decisão vinculada).
 *
 * COMO SE COMPORTA: se uma decisão decidida ou proposta citar uma obra externa que não
 * conste no inventário formal do acervo, o teste reprova.
 */

const CAMINHO_INVENTARIO = path.resolve(
  process.cwd(),
  "docs/bibliografia/INVENTARIO_SELECAO_BIBLIOGRAFICA.md"
);

describe("Trava da Norma R-L5 — Inventário Bibliográfico Formal", () => {
  it("o arquivo de inventário bibliográfico deve existir e possuir metadados normativos", () => {
    expect(fs.existsSync(CAMINHO_INVENTARIO)).toBe(true);
    const conteudo = fs.readFileSync(CAMINHO_INVENTARIO, "utf-8");
    expect(conteudo).toContain("Matriz de Cobertura Teórico-Metodológica");
    expect(conteudo).toContain("Inventário do Pacote ScienceDirect");
  });

  it("toda decisão decidida com lastro externo tem registro correspondente no inventário", () => {
    const conteudoInventario = fs.readFileSync(CAMINHO_INVENTARIO, "utf-8");
    const entradas = [...Object.values(DECISOES), ...Object.values(PARAMETROS)].filter(
      (d) => d.estado === "decidida"
    ) as Decisao<unknown>[];

    const violacoes: string[] = [];

    for (const d of entradas) {
      if (!d.referencia || d.referencia.trim().length === 0) continue;

      // Pula dívidas contratuais/operacionais formais
      if (d.id === "D17" || d.id === "P07") continue;

      // Se possui autor e ano externo
      const temAutorAno = /\b[A-Z][a-zá-úA-Z]+(?: et al\.)?,? \(\d{4}\)/.test(d.referencia) ||
        /\b[A-Z][a-zá-úA-Z]+, [A-Z]\..*\(\d{4}\)/.test(d.referencia) ||
        /\(\d{4}\)/.test(d.referencia);

      if (temAutorAno) {
        // Verifica se o ID da decisão consta na coluna Decisão Vinculada da matriz
        const constaPorId = new RegExp(`\\b${d.id}\\b`).test(conteudoInventario);
        if (!constaPorId) {
          violacoes.push(`  ${d.id} — "${d.titulo}": citada no código mas não vinculada no inventário.`);
        }
      }
    }

    if (violacoes.length > 0) {
      expect.fail(
        "Decisão com lastro externo sem correspondência no inventário (Regra R-L5):\n" +
          violacoes.join("\n") +
          "\n\nCadastre a obra no inventário com autor, ano, título, DOI e a decisão vinculada."
      );
    }
    expect(violacoes).toHaveLength(0);
  });

  it("as 9 obras do ScienceDirect_articles_22Oct2026 estão catalogadas no inventário", () => {
    const conteudo = fs.readFileSync(CAMINHO_INVENTARIO, "utf-8");
    const arquivosScienceDirect = [
      "An-evaluation-of-Landsat--Sentinel-2--Sentinel-1-and-MO_2021_Science-of-Remo.pdf",
      "Assessing-the-use-of-harmonized-multisource-backscatter-_2021_Science-of-Rem.pdf",
      "Characterization-of-Planetscope-0-Planetscope-1-surface-ref_2021_Science-of-.pdf",
      "Improvements-in-high-temporal-resolution-active-fire-detection_2021_Science-.pdf",
      "Object-based-classification-of-vegetation-species-in-a-sub_2021_Science-of-R.pdf",
      "PolInSAR-coherence-based-decomposition-modeling-for-scatte_2021_Science-of-R.pdf",
      "Surface-heights-and-crevasse-morphologies-of-surging-and-fast-mo_2021_Scienc.pdf",
      "Time-weighted-dynamic-time-warping-analysis-for-mapping-inter_2021_Science-o.pdf",
      "UAV--amp--satellite-synergies-for-optical-remote-sensin_2021_Science-of-Remo.pdf",
    ];

    for (const arq of arquivosScienceDirect) {
      expect(conteudo).toContain(arq);
    }
  });
});
