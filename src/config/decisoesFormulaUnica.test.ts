import { describe, it, expect } from "vitest";
import { DECISOES, Decisao } from "./decisoes";

export interface ConflitoFormulaRusle {
  fator: string;
  decisoes: string[];
}

/**
 * Função de auditoria metodológica que verifica se há duplicidade de fórmulas analíticas
 * decididas para o mesmo fator RUSLE (R, K, LS, C, P).
 * Impede que duas decisões concorrentes em estado "decidida" criem "duas verdades" no registro (Achado S1-8).
 */
export function verificarUnicidadeFormulasRusle(
  registroDecisoes: Record<string, Decisao<any>>
): {
  valido: boolean;
  conflitos: ConflitoFormulaRusle[];
} {
  const FATORES_RUSLE = [
    {
      nome: "Fator C",
      identificar: (d: Decisao<any>) =>
        /f[aá]tor\s+c\b/i.test(d.titulo) &&
        /(?:f[oó]rmula|equa[cç][aã]o|modelo)/i.test(d.titulo) &&
        !/sensibilidade|n[aã]o\s+anal[ií]tico/i.test(d.titulo),
    },
    {
      nome: "Fator R",
      identificar: (d: Decisao<any>) =>
        /f[aá]tor\s+r\b/i.test(d.titulo) &&
        /(?:f[oó]rmula|equa[cç][aã]o|modelo)/i.test(d.titulo),
    },
    {
      nome: "Fator K",
      identificar: (d: Decisao<any>) =>
        /f[aá]tor\s+k\b/i.test(d.titulo) &&
        /(?:f[oó]rmula|equa[cç][aã]o|tabelado|atribui[cç][aã]o)/i.test(d.titulo),
    },
    {
      nome: "Fator LS",
      identificar: (d: Decisao<any>) =>
        /f[aá]tor\s+ls\b/i.test(d.titulo) &&
        /(?:f[oó]rmula|equa[cç][aã]o|desmet)/i.test(d.titulo),
    },
    {
      nome: "Fator P",
      identificar: (d: Decisao<any>) =>
        /f[aá]tor\s+p\b/i.test(d.titulo) &&
        /(?:f[oó]rmula|equa[cç][aã]o|tabela|derivado)/i.test(d.titulo),
    },
  ];

  const conflitos: ConflitoFormulaRusle[] = [];

  for (const fator of FATORES_RUSLE) {
    const decididas = Object.values(registroDecisoes).filter(
      (d) => d.estado === "decidida" && fator.identificar(d)
    );

    if (decididas.length > 1) {
      conflitos.push({
        fator: fator.nome,
        decisoes: decididas.map((d) => d.id),
      });
    }
  }

  return {
    valido: conflitos.length === 0,
    conflitos,
  };
}

describe("Trava de Unicidade Metodológica: Fórmulas Analíticas RUSLE (Prompt O / Achado S1-8)", () => {
  it("nenhum fator RUSLE deve ter mais de uma decisão decidida com fórmula analítica concorrente", () => {
    const resultado = verificarUnicidadeFormulasRusle(DECISOES);
    expect(
      resultado.conflitos,
      `Conflito de fórmulas RUSLE decididas detectado: ${JSON.stringify(resultado.conflitos)}`
    ).toEqual([]);
    expect(resultado.valido).toBe(true);
  });

  it("garante especificamente que o Fator C possui exclusivamente D01 como fórmula analítica decidida", () => {
    expect(DECISOES.D01.estado).toBe("decidida");
    expect(DECISOES.D20.estado).toBe("proposta");
    expect(DECISOES.D20.titulo).toContain("sensibilidade");
  });

  describe("Meta-teste da trava de unicidade", () => {
    it("deve detectar e acusar falha se houver duas decisões 'decidida' para o Fator C (ex: D01 e D20 simultaneamente decididas)", () => {
      // Simula o estado pré-Prompt O onde D01 e D20 estavam ambas decididas
      const decisoesConflitantes: Record<string, Decisao<any>> = {
        ...DECISOES,
        D20: {
          ...DECISOES.D20,
          titulo: "Fórmula do Fator C híbrido SPD: Durigon et al. (2014) modulada pelo BSI",
          estado: "decidida",
        },
      };

      const resultado = verificarUnicidadeFormulasRusle(decisoesConflitantes);
      expect(resultado.valido).toBe(false);
      expect(resultado.conflitos).toHaveLength(1);
      expect(resultado.conflitos[0].fator).toBe("Fator C");
      expect(resultado.conflitos[0].decisoes).toContain("D01");
      expect(resultado.conflitos[0].decisoes).toContain("D20");
    });

    it("deve detectar conflito sintético genérico para qualquer fator RUSLE", () => {
      const cloneDecisoes: Record<string, Decisao<any>> = {
        ...DECISOES,
        D_FAKE_R: {
          id: "D_FAKE_R",
          titulo: "Fórmula do Fator R alternativa concorrente",
          estado: "decidida",
          valor: "R = 999",
          justificativa: "Teste sintético",
          referencia: "Fonte sintética",
          decididoPor: "pesquisador",
          decididoEm: "2026-11-11",
        },
      };

      const resultado = verificarUnicidadeFormulasRusle(cloneDecisoes);
      expect(resultado.valido).toBe(false);
      expect(resultado.conflitos.some((c) => c.fator === "Fator R")).toBe(true);
    });
  });
});
