export type CausaIndisponibilidade =
  | "sem-cobertura"          // a fonte respondeu e não cobre o ponto
  | "servico-indisponivel"   // não foi possível consultar
  | "mascarado"              // pixel removido por máscara (nuvem, sombra)
  | "insuficiente"           // há dado, mas abaixo do mínimo (ex.: D11)
  | "fora-do-dominio"        // valor fora do domínio físico ou da fórmula
  | "decisao-pendente"       // depende de decisão ainda não tomada
  | "nao-calculado";         // etapa ainda não executada

export interface QualidadeAjuste {
  nObservacoes: number;
  r2?: number;
  erroPadrao?: number;
}

export type Proveniencia<T> =
  | { estado: "medido";       valor: T; fonte: string; adquiridoEm: string; consultadoEm: string; detalhe?: string }
  | { estado: "modelado";     valor: T; modelo: string; insumos: string[]; decisoes?: string[]; qualidade?: QualidadeAjuste }
  | { estado: "tabelado";     valor: T; tabela: string; chave: string; decisao?: string }
  | { estado: "indisponivel"; causa: CausaIndisponibilidade; motivo: string };

export function valorOuNulo<T>(p?: Proveniencia<T> | null): T | null {
  return p && p.estado !== "indisponivel" ? p.valor : null;
}

export function ehMedido(p?: Proveniencia<unknown> | null): boolean {
  return p?.estado === "medido";
}

export function formatarDescricaoOrigem<T>(p?: Proveniencia<T> | null): string {
  if (!p) return "indisponível — não informado";
  switch (p.estado) {
    case "medido":
      return `medido (${p.fonte}, ${p.adquiridoEm}${p.detalhe ? ` - ${p.detalhe}` : ""})`;
    case "modelado": {
      const decStr = p.decisoes && p.decisoes.length > 0 ? ` [decisões: ${p.decisoes.join(", ")}]` : "";
      return `modelado (${p.modelo}, insumos: ${p.insumos.join(", ")}${decStr})`;
    }
    case "tabelado": {
      const decStr = p.decisao ? ` [decisão: ${p.decisao}]` : "";
      return `tabelado (${p.tabela}, chave: ${p.chave}${decStr})`;
    }
    case "indisponivel":
      return `indisponível — ${p.causa}: ${p.motivo}`;
  }
}
