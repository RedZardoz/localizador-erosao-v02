export type CausaIndisponibilidade =
  | "sem-cobertura"          // a fonte respondeu e não cobre o ponto
  | "servico-indisponivel"   // não foi possível consultar
  | "mascarado"              // pixel removido por máscara (nuvem, sombra)
  | "insuficiente"           // há dado, mas abaixo do mínimo (ex.: D11)
  | "fora-do-dominio"        // valor fora do domínio físico ou da fórmula
  | "decisao-pendente"       // depende de decisão ainda não tomada
  | "nao-calculado"          // etapa ainda não executada
  | "data-da-fonte-desconhecida"; // data de aquisição da fonte não informada (DEC-9)

export interface QualidadeAjuste {
  nObservacoes: number;
  r2?: number;
  erroPadrao?: number;
  regime?: "padrao" | "padrao_pleno" | "fallback_janela_curta";
  elegivelD12?: boolean;
}

/**
 * L-08 / F-18 — marca de pendência de verificação bibliográfica.
 *
 * Existe porque `fatorR.ts` a emitia com `as unknown as Proveniencia<number>`: o duplo cast
 * silenciava o erro de tipo e a marca morria ali, sem chegar ao selo, à interface nem ao CSV.
 * Uma pendência invisível não é pendência — é a incerteza apagada do artefato que a banca lê.
 *
 * Significado: o VALOR é utilizável e reproduzido nos dados, mas a forma funcional, os
 * coeficientes ou a constante de escala ainda não foram conferidos na fonte primária (R-L2).
 */
export type Proveniencia<T> =
  | { estado: "medido";       valor: T; fonte: string; adquiridoEm: string; consultadoEm: string; detalhe?: string; qualidade?: QualidadeAjuste }
  | { estado: "modelado";     valor: T; modelo: string; insumos: string[]; decisoes?: string[]; qualidade?: QualidadeAjuste; pendenteVerificacao?: boolean; detalheVerificacao?: string }
  | { estado: "tabelado";     valor: T; tabela: string; chave: string; decisao?: string }
  | { estado: "indisponivel"; causa: CausaIndisponibilidade; motivo: string };

export function valorOuNulo<T>(p?: Proveniencia<T> | null): T | null {
  return p && p.estado !== "indisponivel" ? p.valor : null;
}

export function ehMedido(p?: Proveniencia<unknown> | null): boolean {
  return p?.estado === "medido";
}

export function medido<T>(
  valor: T,
  fonte: string,
  adquiridoEm: string,
  consultadoEm: string = new Date().toISOString(),
  detalhe?: string,
  qualidade?: QualidadeAjuste
): Proveniencia<T> {
  return {
    estado: "medido",
    valor,
    fonte,
    adquiridoEm,
    consultadoEm,
    ...(detalhe ? { detalhe } : {}),
    ...(qualidade ? { qualidade } : {}),
  };
}

export function modelado<T>(
  valor: T,
  modelo: string,
  insumos: string[],
  decisoes?: string[],
  qualidade?: QualidadeAjuste
): Proveniencia<T> {
  return {
    estado: "modelado",
    valor,
    modelo,
    insumos,
    ...(decisoes ? { decisoes } : {}),
    ...(qualidade ? { qualidade } : {}),
  };
}

export function tabelado<T>(
  valor: T,
  tabela: string,
  chave: string,
  decisao?: string
): Proveniencia<T> {
  return {
    estado: "tabelado",
    valor,
    tabela,
    chave,
    ...(decisao ? { decisao } : {}),
  };
}

export function indisponivel<T = never>(
  causa: CausaIndisponibilidade,
  motivoOuPartes: string | string[]
): Proveniencia<T> {
  const motivo = Array.isArray(motivoOuPartes) ? motivoOuPartes.join(" — ") : motivoOuPartes;
  return {
    estado: "indisponivel",
    causa,
    motivo,
  };
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
