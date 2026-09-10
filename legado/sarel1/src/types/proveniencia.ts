/**
 * ============================================================================
 * Proveniência de Dados Científicos — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * REGRA 3 DA LEI FUNDAMENTAL:
 * "Não existe número solto no sistema. Todo valor científico carrega de onde veio."
 *
 * A proveniência é parte inseparável do valor científico. Todo valor que entra
 * em cálculos, análises ou saídas tabulares deve carregar seu estado de medição,
 * modelagem, tabela ou motivo explícito de indisponibilidade.
 */

export interface QualidadeAjuste {
  nObservacoes: number;
  r2?: number;
  erroPadrao?: number;
}

export type Proveniencia<T> =
  | { estado: "medido"; valor: T; fonte: string; adquiridoEm: string; detalhe?: string }
  | { estado: "modelado"; valor: T; modelo: string; insumos: string[]; qualidade?: QualidadeAjuste }
  | { estado: "tabelado"; valor: T; tabela: string; chave: string }
  | { estado: "indisponivel"; motivo: string };

export function valorOuNulo<T>(p: Proveniencia<T> | undefined | null): T | null {
  return p && p.estado !== "indisponivel" ? p.valor : null;
}

export function ehMedido(p: Proveniencia<unknown> | undefined | null): boolean {
  return p?.estado === "medido";
}

export function formatarDescricaoOrigem<T>(p: Proveniencia<T> | undefined | null): string {
  if (!p) return "indisponível — não informado";
  switch (p.estado) {
    case "medido":
      return `medido (${p.fonte}${p.adquiridoEm ? `, ${p.adquiridoEm}` : ""}${p.detalhe ? ` - ${p.detalhe}` : ""})`;
    case "modelado":
      return `modelado (${p.modelo}${p.insumos && p.insumos.length > 0 ? `, insumos: ${p.insumos.join(", ")}` : ""})`;
    case "tabelado":
      return `tabelado (${p.tabela}, chave: ${p.chave})`;
    case "indisponivel":
      return `indisponível — ${p.motivo}`;
  }
}
