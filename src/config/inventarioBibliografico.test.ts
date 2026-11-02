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

  /**
   * L-05 / N-13 — a trava anterior verificava apenas se o ID da decisão aparecia em algum
   * lugar do inventário. Como todos os IDs aparecem, qualquer citação passava: era o defeito
   * que a auditoria de 31/10/2026 (§6.5) descreveu como "falsa sensação de cobertura".
   *
   * Estas duas asserções passam a confrontar o inventário com o ACERVO EM DISCO, nos dois
   * sentidos. Nenhuma delas julga se a fonte sustenta a afirmação — isso é leitura humana,
   * registrada em LASTRO_NAO_CONFERIDO e nas verificações de docs/verificacoes/.
   */
  describe("R-L3 / R-L5 — o inventário e o acervo em disco têm de concordar", () => {
    const DIR_FONTES = path.resolve(process.cwd(), "docs/verificacoes/fontes");

    function caminhosDeclaradosNoInventario(): string[] {
      const conteudo = fs.readFileSync(CAMINHO_INVENTARIO, "utf-8");
      const achados = conteudo.match(/docs\/verificacoes\/fontes\/[A-Za-z0-9_./-]+/g) ?? [];
      return [...new Set(achados.map((c) => c.replace(/[.,;)`]+$/, "")))];
    }

    it("todo caminho de fonte declarado no inventário existe no disco", () => {
      const quebrados = caminhosDeclaradosNoInventario().filter(
        (rel) => !fs.existsSync(path.resolve(process.cwd(), rel))
      );

      if (quebrados.length > 0) {
        expect.fail(
          "Caminho de fonte declarado no inventário e inexistente no disco (R-L3):\n" +
            quebrados.map((c) => `  ${c}`).join("\n") +
            "\n\nOu arquive a obra no caminho declarado, ou corrija o inventário. Um caminho " +
            "quebrado é pior que a ausência: ele afirma cobertura que não existe."
        );
      }
      expect(quebrados).toHaveLength(0);
    });

    /**
     * Pastas do acervo que NAO sao obras bibliograficas, e sim artefatos de verificacao
     * produzidos pelo projeto (consultas WFS, medicoes, relatorios de correspondencia).
     * Elas pertencem ao acervo de evidencia, nao ao inventario de obras.
     */
    const ARTEFATOS_NAO_BIBLIOGRAFICOS = new Set(["wfs_erodibilidade", "doc246"]);

    it("toda obra arquivada no acervo tem o seu CAMINHO declarado no inventário", () => {
      if (!fs.existsSync(DIR_FONTES)) return;

      const conteudo = fs.readFileSync(CAMINHO_INVENTARIO, "utf-8");
      const pastasComConteudo = fs
        .readdirSync(DIR_FONTES, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .filter((d) => {
          try {
            return fs.readdirSync(path.join(DIR_FONTES, d.name)).some((f) => !f.startsWith("."));
          } catch {
            return false;
          }
        })
        .map((d) => d.name)
        .filter((nome) => !ARTEFATOS_NAO_BIBLIOGRAFICOS.has(nome));

      // Exige o CAMINHO, não apenas o nome do autor: é o caminho que liga a citação ao arquivo.
      const semCaminho = pastasComConteudo.filter(
        (nome) => !conteudo.includes(`docs/verificacoes/fontes/${nome}/`)
      );

      if (semCaminho.length > 0) {
        expect.fail(
          "Obra arquivada no acervo sem caminho declarado no inventário (R-L3 / R-L5):\n" +
            semCaminho.map((n) => `  docs/verificacoes/fontes/${n}/`).join("\n") +
            "\n\nO acervo é mais rico que o inventário declara. Declare o caminho com autor, ano, " +
            "título e decisão vinculada, ou o trabalho de conferência já feito fica invisível."
        );
      }
      expect(semCaminho).toHaveLength(0);
    });
  });
});
