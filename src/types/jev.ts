/**
 * ============================================================================
 * Tipos e Primitivas da API Jev (TypeSafe AI / System One) — SAREL v2.0
 * PPGTCA 2026 — Universidade Tecnológica Federal do Paraná (UTFPR)
 * ============================================================================
 *
 * O Jev opera com 3 primitivas estruturadas estritamente tipadas:
 * 1. Noul: Julgamento booleano calibrado (verdadeiro/falso com probabilidade)
 * 2. Choice: Classificação discreta sobre taxonomia fechada
 * 3. Score: Escala ordinal estruturada (0 a 4)
 */

export type MetodoAuditoria = "JEV_SYSTEM_ONE" | "HEURISTICA_LOCAL_SUSCETIBILIDADE";

export type GrauSuscetibilidade = 0 | 1 | 2 | 3 | 4;

export interface RespostaNoul {
  result: boolean;
  confidence: number; // 0.0 a 1.0
  reasoning?: string;
}

export interface RespostaChoice {
  choice: string;
  confidence: number;
}

export interface RespostaScore {
  score: GrauSuscetibilidade;
  confidence?: number;
}

export interface LaudoAuditoriaPonto {
  /**
   * A-09 / Regra 4: o laudo e AUDITORIA HEURISTICA de apoio visual. Jamais rotulo, jamais alvo,
   * jamais metrica. O campo existe para que nenhum consumidor possa alegar duvida sobre a natureza
   * da evidencia: nem o motor externo nem a heuristica local produzem medida calibrada.
   */
  naturezaEvidencia: "heuristica-nao-rotulo";
  metodo: MetodoAuditoria;
  pontoId: string;
  codigo: string;
  timestamp: string;
  latenciaMs: number;
  consistenciaFisica: {
    valido: boolean;
    /**
     * A-08 / Regra 1: confianca REPORTADA pelo servico externo. `null` quando o servico nao a
     * informa. Jamais preenchida por default: um numero fabricado com aparencia de probabilidade e
     * pior que a ausencia, porque nao se distingue de uma medida calibrada.
     */
    confianca: number | null;
    observacao: string;
  };
  scoreSuscetibilidade: {
    grau: GrauSuscetibilidade;
    rotulo: "Nula" | "Baixa" | "Moderada" | "Alta" | "Crítica";
    descricao: string;
  };
  coberturaManejo: {
    classe: string;
    /** A-08 / Regra 1: ver `consistenciaFisica.confianca`. `null` quando nao reportada. */
    confianca: number | null;
  };
  detalhes: {
    ndviObservado: number | null;
    bsiObservado: number | null;
    declividadePct: number | null;
    ordemSolo: string | null;
    erodibilidadeClasse: string | null;
    motivoFallback?: string;
  };
}
