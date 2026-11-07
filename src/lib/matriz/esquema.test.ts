import { describe, it, expect } from "vitest";
import {
  validarEsquemaMatriz,
  ErroEsquemaMatriz,
  ESQUEMA_MATRIZ_VERSAO,
  COLUNAS_OBRIGATORIAS_MATRIZ,
} from "./esquema";

/**
 * A-05 / C-02 — contrato de esquema da matriz.
 *
 * O que estes testes protegem: as guardas do avaliador D25 (`_so_incluidas` e
 * `_checar_pixels_disjuntos`) retornam em silêncio quando a coluna falta. Uma guarda que se
 * desliga por ausência de insumo produz confiança falsa, e era o estado anterior.
 */

function linhaValida(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    Celula_ID: "CEL-0001",
    Ponto_ID: "PT-0001",
    Poligono_ID: "D16_E_1_1_1_Q01",
    Pixel_ID: "px-opaco-abc123",
    Estrato_ID: "E_1_1_1",
    Pi_i: 0.5,
    W_i: 2,
    N_Candidatos_Estrato: 8,
    Papel_Conjunto: "treino",
    Bloco_Espacial: "BLOCO_A",
    Modelo: "D",
    Data_Referencia: "2026-03-01",
    Fim_Janela: "2026-06-30",
    Incluida: "true",
    Cobertura_Celula: 1,
    Area_Delineada_m2: 42.5,
    Fracao_Erodida: 0.425,
    ...over,
  };
}

describe("Contrato de esquema da matriz (A-05 / C-02)", () => {
  it("aceita um artefato íntegro e declara a versão do contrato", () => {
    expect(ESQUEMA_MATRIZ_VERSAO).toBe("2.0.0");
    expect(() => validarEsquemaMatriz("matriz-treino", [linhaValida()])).not.toThrow();
    expect(() => validarEsquemaMatriz("matriz-heldout", [linhaValida()])).not.toThrow();
  });

  it("não se aplica a perfis que não são de matriz", () => {
    expect(() => validarEsquemaMatriz("geojson-pontos", [{ qualquer: 1 }])).not.toThrow();
  });

  describe("presença das chaves do desenho", () => {
    it("rejeita matriz sem Estrato_ID", () => {
      const linha = linhaValida();
      delete linha.Estrato_ID;
      expect(() => validarEsquemaMatriz("matriz-treino", [linha])).toThrow(ErroEsquemaMatriz);
      try {
        validarEsquemaMatriz("matriz-treino", [linha]);
      } catch (e) {
        expect((e as ErroEsquemaMatriz).violacoes[0]).toContain("Estrato_ID");
      }
    });

    it("rejeita matriz sem as chaves que alimentam as guardas do D25", () => {
      for (const coluna of ["Incluida", "Pixel_ID", "Cobertura_Celula", "Pi_i", "Modelo"]) {
        const linha = linhaValida();
        delete linha[coluna];
        expect(
          () => validarEsquemaMatriz("matriz-treino", [linha]),
          `coluna ${coluna} deveria ser obrigatória`
        ).toThrow(ErroEsquemaMatriz);
      }
    });

    it("D26: contrato da matriz NÃO contém Alvo_Binario_25 (decisão de 06/11/2026)", () => {
      expect(COLUNAS_OBRIGATORIAS_MATRIZ).not.toContain("Alvo_Binario_25");
    });

    it("as onze colunas de A-05 estão no contrato", () => {
      for (const coluna of [
        "Estrato_ID",
        "Pi_i",
        "W_i",
        "N_Candidatos_Estrato",
        "Incluida",
        "Cobertura_Celula",
        "Area_Delineada_m2",
        "Pixel_ID",
        "Modelo",
        "Data_Referencia",
        "Fim_Janela",
      ]) {
        expect(COLUNAS_OBRIGATORIAS_MATRIZ).toContain(coluna);
      }
    });
  });

  describe("domínio dos valores", () => {
    it("rejeita Pi_i fora de (0, 1]", () => {
      for (const pi of [0, -0.1, 1.5]) {
        expect(() =>
          validarEsquemaMatriz("matriz-treino", [linhaValida({ Pi_i: pi, W_i: 1 / (pi || 1) })])
        ).toThrow(ErroEsquemaMatriz);
      }
    });

    it("rejeita Fracao_Erodida fora de [0, 1] e Cobertura_Celula fora de [0, 1]", () => {
      expect(() =>
        validarEsquemaMatriz("matriz-treino", [linhaValida({ Fracao_Erodida: 1.3 })])
      ).toThrow(ErroEsquemaMatriz);
      expect(() =>
        validarEsquemaMatriz("matriz-treino", [linhaValida({ Cobertura_Celula: -0.2 })])
      ).toThrow(ErroEsquemaMatriz);
    });

    it("rejeita Incluida numérica: 1/0 colidiria com o Invariante 7", () => {
      expect(() => validarEsquemaMatriz("matriz-treino", [linhaValida({ Incluida: 1 })])).toThrow(
        ErroEsquemaMatriz
      );
      expect(() => validarEsquemaMatriz("matriz-treino", [linhaValida({ Incluida: 0 })])).toThrow(
        ErroEsquemaMatriz
      );
    });

    it("aceita célula vazia como ausência declarada, nunca coagida a zero", () => {
      const semSelo = linhaValida({
        Estrato_ID: "",
        Pi_i: "",
        W_i: "",
        N_Candidatos_Estrato: "",
        Incluida: "",
        Cobertura_Celula: "",
        Area_Delineada_m2: "",
        Pixel_ID: "",
      });
      expect(() => validarEsquemaMatriz("matriz-treino", [semSelo])).not.toThrow();
    });
  });

  describe("identidade de Horvitz-Thompson", () => {
    it("exige Pi_i * W_i = 1", () => {
      expect(() =>
        validarEsquemaMatriz("matriz-treino", [linhaValida({ Pi_i: 0.5, W_i: 3 })])
      ).toThrow(ErroEsquemaMatriz);

      // 4/N_h com N_h = 7, e o peso correspondente
      expect(() =>
        validarEsquemaMatriz("matriz-treino", [
          linhaValida({ Pi_i: 4 / 7, W_i: 7 / 4, N_Candidatos_Estrato: 7 }),
        ])
      ).not.toThrow();
    });

    it("rejeita Pi_i presente sem W_i, e vice-versa", () => {
      expect(() => validarEsquemaMatriz("matriz-treino", [linhaValida({ W_i: "" })])).toThrow(
        ErroEsquemaMatriz
      );
      expect(() => validarEsquemaMatriz("matriz-treino", [linhaValida({ Pi_i: "" })])).toThrow(
        ErroEsquemaMatriz
      );
    });
  });

  describe("um artefato, um modelo (V-01)", () => {
    it("rejeita D e P na mesma matriz", () => {
      const linhas = [linhaValida({ Modelo: "D" }), linhaValida({ Modelo: "P" })];
      expect(() => validarEsquemaMatriz("matriz-treino", linhas)).toThrow(ErroEsquemaMatriz);
      try {
        validarEsquemaMatriz("matriz-treino", linhas);
      } catch (e) {
        expect((e as ErroEsquemaMatriz).message).toContain("mistura modelos");
      }
    });

    it("aceita artefato uniforme em P", () => {
      const linhas = [linhaValida({ Modelo: "P" }), linhaValida({ Modelo: "P" })];
      expect(() => validarEsquemaMatriz("matriz-treino", linhas)).not.toThrow();
    });
  });

  describe("o contrato não valida cardinalidade (nota de desenho de A-05)", () => {
    it("aceita qualquer número de linhas, polígonos e estratos", () => {
      // O gate G-01 ainda não foi decidido: 18, 15, 14 ou 12 estratos são todos possíveis, e
      // nenhum número pode estar gravado aqui.
      const umPoligono = [linhaValida()];
      const muitos = Array.from({ length: 57 }, (_, i) =>
        linhaValida({
          Ponto_ID: `PT-${i}`,
          Poligono_ID: `D16_E_${(i % 14) + 1}_Q01`,
          Estrato_ID: `E_${(i % 14) + 1}`,
        })
      );
      expect(() => validarEsquemaMatriz("matriz-treino", umPoligono)).not.toThrow();
      expect(() => validarEsquemaMatriz("matriz-treino", muitos)).not.toThrow();
    });

    it("o módulo do contrato não contém número de estratos, polígonos ou held-out", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const fonte = fs.readFileSync(
        path.resolve(process.cwd(), "src/lib/matriz/esquema.ts"),
        "utf-8"
      );
      const corpo = fonte
        .split("\n")
        .filter((l) => {
          const t = l.trim();
          return !t.startsWith("*") && !t.startsWith("//") && !t.startsWith("/*");
        })
        .join("\n");
      // Cardinalidade proibida no contrato: a contagem é do selo D16 e da verificação de A-06.
      expect(corpo).not.toMatch(/\b(18|36|72|56|60)\b/);
    });
  });
});
