export type EstadoDecisao = "pendente" | "proposta" | "decidida";

export interface Decisao<T> {
  id: string;              // "D10", "P04"
  titulo: string;
  estado: EstadoDecisao;
  valor?: T;               // so quando "decidida"
  justificativa?: string;
  referencia?: string;     // obra e secao, conferida na fonte
  decididoPor?: string;
  decididoEm?: string;     // AAAA-MM-DD
}

export class ErroDecisaoPendente extends Error {
  readonly decisaoId: string;
  constructor(id: string, titulo: string) {
    super(`Decisão pendente: ${id} (${titulo})`);
    this.name = "ErroDecisaoPendente";
    this.decisaoId = id;
  }
}

export function exigirDecisao<T>(d: Decisao<T>): T {
  if (d.estado !== "decidida" || d.valor === undefined) {
    throw new ErroDecisaoPendente(d.id, d.titulo);
  }
  return d.valor;
}

export const DECISOES: Record<string, Decisao<any>> = {
  D01: {
    id: "D01",
    titulo: "Fórmula do Fator C: Durigon et al. (2014)",
    estado: "decidida" as EstadoDecisao,
    valor: "(1 - NDVI) / 2",
    justificativa: "Validade regional em bacia tropical brasileira, concebida para serie temporal, sem parametros livres e sem corte em [0, 1].",
    referencia: "Durigon et al. (2014), International Journal of Remote Sensing 35(2):441-453",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-08",
  },
  D02: {
    id: "D02",
    titulo: "Critérios observacionais de presente/ausente e negativo explícito",
    estado: "pendente" as EstadoDecisao,
  },
  D03: {
    id: "D03",
    titulo: "Escala do rótulo (binária ou ordinal)",
    estado: "pendente" as EstadoDecisao,
  },
  D04: {
    id: "D04",
    titulo: "Modelo D (detecção), Modelo P (predição) ou ambos, e intervalo de guarda",
    estado: "pendente" as EstadoDecisao,
  },
  D05: {
    id: "D05",
    titulo: "Extensão da série: apenas Sentinel-2 ou inclui Landsat",
    estado: "pendente" as EstadoDecisao,
  },
  D06: {
    id: "D06",
    titulo: "Unidade de predição: pixel 10m, 30m ou talhão",
    estado: "pendente" as EstadoDecisao,
  },
  D07: {
    id: "D07",
    titulo: "Domínio de validade (ex.: declividade 3-20%, uso agrícola)",
    estado: "pendente" as EstadoDecisao,
  },
  D08: {
    id: "D08",
    titulo: "Tratamento das unidades pedológicas em associação",
    estado: "pendente" as EstadoDecisao,
  },
  D09: {
    id: "D09",
    titulo: "Mapa ordinal das classes da Embrapa e corte de K^ em 2 níveis",
    estado: "pendente" as EstadoDecisao,
  },
  D10: {
    id: "D10",
    titulo: "Limiar de NDVI para solo descoberto",
    estado: "pendente" as EstadoDecisao,
  },
  D11: {
    id: "D11",
    titulo: "Cobertura temporal mínima (nº mínimo de observações válidas)",
    estado: "pendente" as EstadoDecisao,
  },
  D12: {
    id: "D12",
    titulo: "Dimensões da estratificação (18 estratos vs ampliada)",
    estado: "pendente" as EstadoDecisao,
  },
  D13: {
    id: "D13",
    titulo: "Formulação do Fator R",
    estado: "pendente" as EstadoDecisao,
  },
  D14: {
    id: "D14",
    titulo: "Fator K numérico para linha de base RUSLE",
    estado: "pendente" as EstadoDecisao,
  },
  D15: {
    id: "D15",
    titulo: "Fator LS: método de acúmulo e expoentes m e n",
    estado: "pendente" as EstadoDecisao,
  },
  D16: {
    id: "D16",
    titulo: "Quantidade viável de pontos de campo e voos de drone",
    estado: "pendente" as EstadoDecisao,
  },
  D17: {
    id: "D17",
    titulo: "Ciclo da cota Planet: mensal ou total",
    estado: "pendente" as EstadoDecisao,
  },
  D18: {
    id: "D18",
    titulo: "Buffer do recorte Planet (recomendado 250m)",
    estado: "pendente" as EstadoDecisao,
  },
  D19: {
    id: "D19",
    titulo: "Quantidade de pontos com pares de evento",
    estado: "pendente" as EstadoDecisao,
  },
};

export const PARAMETROS: Record<string, Decisao<any>> = {
  P01: {
    id: "P01",
    titulo: "Aresta do bloco espacial",
    estado: "proposta" as EstadoDecisao,
    justificativa: "Derivada do alcance do variograma empírico; fallback provisório de 20 km",
    referencia: "Roberts et al. (2017)",
  },
  P02: {
    id: "P02",
    titulo: "Espaçamento mínimo do thinning",
    estado: "proposta" as EstadoDecisao,
    justificativa: "1 km herdado do Localizador para dispersão espacial",
  },
  P03: {
    id: "P03",
    titulo: "Raio de casamento Kobo com ponto planejado",
    estado: "proposta" as EstadoDecisao,
    justificativa: "150 m herdado do Localizador",
  },
  P04: {
    id: "P04",
    titulo: "Buffers de exclusão (água 30m, urbano 150m, ocorrência água 10%)",
    estado: "proposta" as EstadoDecisao,
    justificativa: "Constantes herdadas de eligibilityConstants.ts",
  },
  P05: {
    id: "P05",
    titulo: "Classes elegíveis do ESA WorldCover (30, 40, 60)",
    estado: "proposta" as EstadoDecisao,
    justificativa: "Classes agrícolas e campestres conforme planejamento v3",
  },
  P06: {
    id: "P06",
    titulo: "Fração limpa mínima (UDM2) na AOI do ponto",
    estado: "pendente" as EstadoDecisao,
  },
  P07: {
    id: "P07",
    titulo: "Semente aleatória da amostragem",
    estado: "decidida" as EstadoDecisao,
    valor: "dinamica-registrada",
    justificativa: "Registrada a cada execução para permitir reprodutibilidade exata",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-08",
  },
  P08: {
    id: "P08",
    titulo: "Limiar do alerta visual de baixa variância",
    estado: "proposta" as EstadoDecisao,
    justificativa: "Alerta visual informativo quando desvio padrão for baixo",
  },
  P09: {
    id: "P09",
    titulo: "Método de máscara de nuvem Sentinel-2 (QA60 / SCL)",
    estado: "proposta" as EstadoDecisao,
    justificativa: "maskS2Clouds sem unmask em bandas físicas",
  },
};

export const REGISTRO_DECISOES = DECISOES;
