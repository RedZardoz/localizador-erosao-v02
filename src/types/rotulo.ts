// ClasseRotulo e criado SOMENTE depois da decisao D03 (Fase 0).
export type ClasseRotulo = string;

export type ModalidadeRotulo = "interpretacao-visual" | "campo" | "drone";

export interface Rotulo {
  classe: ClasseRotulo;
  modalidade: ModalidadeRotulo;
  observador: string;
  observadoEm: string;                        // AAAA-MM-DD
  confianca?: "alta" | "media" | "baixa";
  observacoes?: string;
  cego: boolean;  // desconhecia predicao, score, estrato e rotulo de outra modalidade
}

export interface RotuloConsolidado {
  final: Rotulo | null;                       // null enquanto a divergencia estiver pendente
  origens: Rotulo[];                          // todas as observacoes independentes
  kappa: number | null;                       // null sem pares ou quando indefinido
  divergencia: "nenhuma" | "resolvida-por-terceiro" | "pendente";
  papelConjunto: "treino" | "held-out";       // drone e sempre held-out
}
