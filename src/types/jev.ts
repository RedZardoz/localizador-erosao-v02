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

export type MetodoAuditoria = "JEV_SYSTEM_ONE" | "MOTOR_LOCAL_RUSLE";

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
  metodo: MetodoAuditoria;
  pontoId: string;
  codigo: string;
  timestamp: string;
  latenciaMs: number;
  consistenciaFisica: {
    valido: boolean;
    confianca: number;
    observacao: string;
  };
  scoreSuscetibilidade: {
    grau: GrauSuscetibilidade;
    rotulo: "Nula" | "Baixa" | "Moderada" | "Alta" | "Crítica";
    descricao: string;
  };
  coberturaManejo: {
    classe: string;
    confianca: number;
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
