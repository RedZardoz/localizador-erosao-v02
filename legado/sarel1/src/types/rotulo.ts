/**
 * ============================================================================
 * Rótulos de Observação — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * REGRA 4 DA LEI FUNDAMENTAL:
 * "Nada calculado pelo sistema pode virar rótulo. O rótulo vem exclusivamente
 * de observação humana (interpretação visual, campo, drone)."
 */

/** Escala de rotulagem (PROVISÓRIA até a conclusão da Fase 0 com o orientador). */
export type ClasseRotulo = "ausente" | "incipiente" | "moderada" | "severa";

export type ModalidadeRotulo = "interpretacao-visual" | "campo" | "drone";

export interface Rotulo {
  classe: ClasseRotulo;
  modalidade: ModalidadeRotulo;
  observador: string;
  observadoEm: string; // formato ISO YYYY-MM-DD
  confianca?: "alta" | "media" | "baixa";
  observacoes?: string;
  cego: boolean; // TRUE: o observador desconhecia qualquer predição, score ou estrato
}

export interface RotuloConsolidado {
  final: Rotulo;
  origens: Rotulo[]; // todas as observações independentes coletadas
  kappa?: number;    // índice Kappa de Cohen quando houver 2+ observadores
  divergencia?: "nenhuma" | "resolvida-por-terceiro" | "pendente";
}

/** Patamares de Landis & Koch (1977) para interpretação de concordância. */
export type GrauConcordancia =
  | "pobre"          // < 0.00
  | "leve"           // 0.00 - 0.20
  | "razoavel"       // 0.21 - 0.40
  | "moderada"       // 0.41 - 0.60
  | "substancial"    // 0.61 - 0.80
  | "quase-perfeita"; // 0.81 - 1.00

export interface ResultadoKappa {
  kappa: number;
  po: number; // proporção observada de concordância
  pe: number; // proporção esperada pelo acaso
  grau: GrauConcordancia;
  operacional: boolean; // true se kappa >= 0.60 (patamar mínimo do planejamento v3)
  intervaloConfianca95: [number, number];
  alertaBloqueante?: string; // emitido se kappa < 0.60
  matrizConfusao: Record<string, Record<string, number>>;
  classes: ClasseRotulo[];
  nObservacoes: number;
}

/** Papel do conjunto de dados na modelagem — Drone é estritamente held-out (Fase D). */
export type PapelConjunto = "treino" | "held-out";

/** Entrada bruta de formulário KoboToolbox preenchido em campo. */
export interface SubmissaoKobo {
  codigoPonto: string;
  latitude?: number;
  longitude?: number;
  classe: ClasseRotulo;
  observador: string;
  observadoEm: string;
  confianca?: "alta" | "media" | "baixa";
  observacoes?: string;
  cego?: boolean;
  atributosCampo?: {
    espessuraHorizonteA_cm?: number;
    exposicaoHorizonteB?: boolean;
    pedestaisRaizes?: boolean;
    sulcosIncipientes?: boolean;
    deposicaoSope?: boolean;
    grandeGrupoSolo?: string;
    [key: string]: unknown;
  };
}

/** Entrada de rotulagem por fotointerpretação visual (Fases A e B). */
export interface ItemInterpretacaoVisual {
  codigoPonto: string;
  classe: ClasseRotulo;
  observador: string;
  observadoEm: string;
  confianca?: "alta" | "media" | "baixa";
  observacoes?: string;
  cego: boolean;
}

/** Entrada de validação por drone de altíssima resolução (Fase D — HELD-OUT). */
export interface SubmissaoDrone {
  codigoPonto: string;
  latitude?: number;
  longitude?: number;
  classe: ClasseRotulo;
  observador: string;
  observadoEm: string;
  resolucaoGsdCm?: number;
  dataVoo?: string;
  sensor?: string;
  altitudeVooMetros?: number;
  confianca?: "alta" | "media" | "baixa";
  observacoes?: string;
  papelConjunto: "held-out"; // Obrigatório e imutável
}

