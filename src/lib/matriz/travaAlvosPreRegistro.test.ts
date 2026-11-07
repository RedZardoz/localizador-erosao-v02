import { describe, it, expect } from "vitest";
import { SCRIPT_AVALIACAO_D25 } from "@/lib/export/scriptAvaliacaoD25.generated";
import {
  PERFIS_EXPORTACAO,
  DECLARACAO_ALVOS_MATRIZ,
  DECLARACAO_CHAVES_MATRIZ,
  type DeclaracaoAlvo,
  type DeclaracaoChave,
} from "./perfis";

/**
 * Extrai conjunto Python delimitado por chaves `{ ... }` do script gerado.
 */
export function extrairConjuntoPython(script: string, nome: string): Set<string> {
  const regex = new RegExp(`${nome}\\s*=\\s*\\{([\\s\\S]*?)\\}`, "m");
  const match = script.match(regex);
  if (!match) throw new Error(`Não foi possível extrair conjunto ${nome} do script Python.`);
  const itens = match[1]
    .split(",")
    .map((s) => s.replace(/#.*$/gm, "").trim())
    .map((s) => s.replace(/^["']|["']$/g, "").trim())
    .filter((s) => s.length > 0);
  return new Set(itens);
}

/**
 * Extrai tupla Python delimitada por parênteses `( ... )` do script gerado.
 */
export function extrairTuplaPython(script: string, nome: string): string[] {
  const regex = new RegExp(`${nome}\\s*=\\s*\\(([\\s\\S]*?)\\)`, "m");
  const match = script.match(regex);
  if (!match) throw new Error(`Não foi possível extrair tupla ${nome} do script Python.`);
  return match[1]
    .split(",")
    .map((s) => s.replace(/#.*$/gm, "").trim())
    .map((s) => s.replace(/^["']|["']$/g, "").trim())
    .filter((s) => s.length > 0);
}

/**
 * Função de verificação da trava espelhada (TypeScript vs. Avaliador Python).
 * Lança erro explícito diante de qualquer divergência entre o contrato da matriz e as travas do avaliador.
 */
export function verificarTravaEspelhada(
  colunasPermitidasMatriz: string[],
  alvosDeclarados: readonly DeclaracaoAlvo[],
  chavesDeclaradas: readonly DeclaracaoChave[],
  travasPython: {
    colunasObrigatorias: string[];
    proibidosAlvoEChaves: Set<string>;
    prefixosProibidos: string[];
    proibidosComoPreditor: Set<string>;
  }
): void {
  const permitidasSet = new Set(colunasPermitidasMatriz);

  // (a) Toda coluna de COLUNAS_OBRIGATORIAS deve estar na lista de permissão da matriz-treino
  for (const col of travasPython.colunasObrigatorias) {
    if (!permitidasSet.has(col)) {
      throw new Error(
        `[TRAVA ESPELHADA (a)] Coluna obrigatória do avaliador '${col}' ausente na lista de permissão de matriz-treino.`
      );
    }
  }

  // (b) Toda coluna declarada como alvo deve estar coberta pelo avaliador (por nome ou prefixo)
  for (const alvo of alvosDeclarados) {
    const cobertaPorNome =
      travasPython.proibidosAlvoEChaves.has(alvo.coluna) ||
      travasPython.proibidosComoPreditor.has(alvo.coluna);
    const cobertaPorPrefixo = travasPython.prefixosProibidos.some((pref) =>
      alvo.coluna.startsWith(pref)
    );
    if (!cobertaPorNome && !cobertaPorPrefixo) {
      throw new Error(
        `[TRAVA ESPELHADA (b)] Alvo declarado '${alvo.coluna}' (decisão ${alvo.decisaoId}) não está coberto pelas proibições do avaliador D25.`
      );
    }
  }

  // (c) Nenhuma coluna de matriz-treino pode estar em PROIBIDOS_COMO_PREDITOR
  // a menos que seja formalmente declarada como alvo ou desfecho.
  const alvosSet = new Set(alvosDeclarados.map((a) => a.coluna));
  for (const col of colunasPermitidasMatriz) {
    if (travasPython.proibidosComoPreditor.has(col) && !alvosSet.has(col)) {
      throw new Error(
        `[TRAVA ESPELHADA (c)] Coluna '${col}' de matriz-treino consta em PROIBIDOS_COMO_PREDITOR do avaliador sem estar declarada como alvo/desfecho.`
      );
    }
  }

  // (d) Toda coluna de matriz-treino que pertença a PROIBIDOS_ALVO_E_CHAVES deve estar declarada como ALVO ou como CHAVE no TypeScript
  const alvosEChavesDeclarados = new Set([
    ...alvosDeclarados.map((a) => a.coluna),
    ...chavesDeclaradas.map((c) => c.coluna),
  ]);
  for (const col of colunasPermitidasMatriz) {
    if (travasPython.proibidosAlvoEChaves.has(col) && !alvosEChavesDeclarados.has(col)) {
      throw new Error(
        `[TRAVA ESPELHADA (d)] Coluna '${col}' de matriz-treino pertence a PROIBIDOS_ALVO_E_CHAVES do Python mas NÃO está declarada como alvo nem como chave no TypeScript.`
      );
    }
  }

  // (e) Toda coluna declarada como alvo ou chave e presente na matriz deve estar coberta pelas proibições do Python, por nome ou por prefixo
  for (const col of alvosEChavesDeclarados) {
    if (permitidasSet.has(col)) {
      const cobertaPorNome =
        travasPython.proibidosAlvoEChaves.has(col) ||
        travasPython.proibidosComoPreditor.has(col);
      const cobertaPorPrefixo = travasPython.prefixosProibidos.some((pfx) =>
        col.startsWith(pfx)
      );
      if (!cobertaPorNome && !cobertaPorPrefixo) {
        throw new Error(
          `[TRAVA ESPELHADA (e)] Coluna '${col}' declarada como alvo/chave e presente na matriz NÃO está coberta pelas proibições do avaliador Python.`
        );
      }
    }
  }
}

describe("TAREFA 4 — Trava Espelhada de Alvos e Preditores (TypeScript vs Python D25)", () => {
  const proibidosComoPreditor = extrairConjuntoPython(SCRIPT_AVALIACAO_D25, "PROIBIDOS_COMO_PREDITOR");
  const proibidosAlvoEChaves = extrairConjuntoPython(SCRIPT_AVALIACAO_D25, "PROIBIDOS_ALVO_E_CHAVES");
  const prefixosProibidos = extrairTuplaPython(SCRIPT_AVALIACAO_D25, "PREFIXOS_PROIBIDOS");
  const colunasObrigatorias = extrairTuplaPython(SCRIPT_AVALIACAO_D25, "COLUNAS_OBRIGATORIAS");

  it("extrai corretamente as constantes do avaliador D25 gerado", () => {
    expect(proibidosComoPreditor.has("RUSLE_A")).toBe(true);
    expect(proibidosComoPreditor.has("RUSLE_Fator_C")).toBe(true);
    expect(proibidosComoPreditor.has("RUSLE_Fator_P")).toBe(true);
    expect(proibidosComoPreditor.has("RUSLE_Perda_Solo_t_ha_ano")).toBe(true);

    expect(proibidosAlvoEChaves.has("Fracao_Erodida")).toBe(true);
    expect(proibidosAlvoEChaves.has("Alvo_Binario_25")).toBe(true);
    expect(proibidosAlvoEChaves.has("Classe_Alvo_Binaria")).toBe(true);

    expect(prefixosProibidos).toContain("Rotulo_");
    expect(colunasObrigatorias).toEqual(["Fracao_Erodida", "Poligono_ID", "Papel_Conjunto"]);
  });

  it("aprova o estado oficial do repositório sob as travas espelhadas (a) a (e)", () => {
    const colunasTreino = PERFIS_EXPORTACAO["matriz-treino"].colunasPermitidas;
    expect(() =>
      verificarTravaEspelhada(
        colunasTreino,
        DECLARACAO_ALVOS_MATRIZ,
        DECLARACAO_CHAVES_MATRIZ,
        {
          colunasObrigatorias,
          proibidosAlvoEChaves,
          prefixosProibidos,
          proibidosComoPreditor,
        }
      )
    ).not.toThrow();
  });

  describe("META-TESTE (§18) — Detecção de divergências plantadas em memória", () => {
    const colunasTreino = PERFIS_EXPORTACAO["matriz-treino"].colunasPermitidas;

    it("falha quando alguma coluna de COLUNAS_OBRIGATORIAS é omitida de matriz-treino (a)", () => {
      // Planta omissão de Fracao_Erodida
      const colunasComOmissao = colunasTreino.filter((c) => c !== "Fracao_Erodida");
      expect(() =>
        verificarTravaEspelhada(
          colunasComOmissao,
          DECLARACAO_ALVOS_MATRIZ,
          DECLARACAO_CHAVES_MATRIZ,
          {
            colunasObrigatorias,
            proibidosAlvoEChaves,
            prefixosProibidos,
            proibidosComoPreditor,
          }
        )
      ).toThrow(/\[TRAVA ESPELHADA \(a\)\]/);
    });

    it("falha quando um alvo declarado em TypeScript não está coberto no avaliador Python (b)", () => {
      // Planta alvo hipotético não blindado no Python
      const alvosComDivergencia: DeclaracaoAlvo[] = [
        ...DECLARACAO_ALVOS_MATRIZ,
        {
          coluna: "Alvo_Nao_Blindado_Inventado",
          papel: "primario",
          decisaoId: "D99",
          descricao: "Alvo plantado para teste",
        },
      ];
      expect(() =>
        verificarTravaEspelhada(
          colunasTreino,
          alvosComDivergencia,
          DECLARACAO_CHAVES_MATRIZ,
          {
            colunasObrigatorias,
            proibidosAlvoEChaves,
            prefixosProibidos,
            proibidosComoPreditor,
          }
        )
      ).toThrow(/\[TRAVA ESPELHADA \(b\)\]/);
    });

    it("falha quando uma coluna proibida da RUSLE entra na matriz sem ser alvo (c)", () => {
      // Planta RUSLE_A em matriz-treino
      const colunasComVazamento = [...colunasTreino, "RUSLE_A"];
      expect(() =>
        verificarTravaEspelhada(
          colunasComVazamento,
          DECLARACAO_ALVOS_MATRIZ,
          DECLARACAO_CHAVES_MATRIZ,
          {
            colunasObrigatorias,
            proibidosAlvoEChaves,
            prefixosProibidos,
            proibidosComoPreditor,
          }
        )
      ).toThrow(/\[TRAVA ESPELHADA \(c\)\]/);
    });

    it("falha quando coluna de PROIBIDOS_ALVO_E_CHAVES está na matriz sem estar declarada como alvo ou chave (d)", () => {
      // Planta Alvo_Binario_25 de volta em matriz-treino (coluna presente em PROIBIDOS_ALVO_E_CHAVES mas não declarada)
      const colunasComAlvoNaoDeclarado = [...colunasTreino, "Alvo_Binario_25"];
      expect(() =>
        verificarTravaEspelhada(
          colunasComAlvoNaoDeclarado,
          DECLARACAO_ALVOS_MATRIZ,
          DECLARACAO_CHAVES_MATRIZ,
          {
            colunasObrigatorias,
            proibidosAlvoEChaves,
            prefixosProibidos,
            proibidosComoPreditor,
          }
        )
      ).toThrow(/\[TRAVA ESPELHADA \(d\)\]/);
    });

    it("falha quando coluna declarada como alvo ou chave presente na matriz não está coberta no Python (e)", () => {
      // Planta chave inventada presente na matriz mas ausente das proibições Python
      const chavesComChaveNaoCoberta: DeclaracaoChave[] = [
        ...DECLARACAO_CHAVES_MATRIZ,
        {
          coluna: "Chave_Ficticia_Nao_Coberta",
          categoria: "identificador",
          descricao: "Chave plantada para teste em memória",
        },
      ];
      const colunasComChaveFicticia = [...colunasTreino, "Chave_Ficticia_Nao_Coberta"];
      expect(() =>
        verificarTravaEspelhada(
          colunasComChaveFicticia,
          DECLARACAO_ALVOS_MATRIZ,
          chavesComChaveNaoCoberta,
          {
            colunasObrigatorias,
            proibidosAlvoEChaves,
            prefixosProibidos,
            proibidosComoPreditor,
          }
        )
      ).toThrow(/\[TRAVA ESPELHADA \(e\)\]/);
    });
  });
});
