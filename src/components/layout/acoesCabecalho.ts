/**
 * ============================================================================
 * Lógica Pura de Ações do Cabeçalho por Largura da Tela (U01)
 * ============================================================================
 *
 * Mapeamento e distribuição de ações entre barra principal do cabeçalho
 * e menu responsivo "Mais Ações", garantindo que nenhum controle fique
 * fora da janela entre 390px e 1440px e prevenindo rolagem horizontal.
 */

export type AcaoCabecalhoId =
  | "defesa"
  | "aoi"
  | "amostras"
  | "tema"
  | "candidatos"
  | "campanha"
  | "matriz"
  | "config"
  | "export";

export interface AcaoCabecalhoDef {
  id: AcaoCabecalhoId;
  rotulo: string;
  rotuloCurto: string;
  ariaLabel: string;
  tipo: "primaria" | "secundaria";
}

export const ACOES_CABECALHO: AcaoCabecalhoDef[] = [
  {
    id: "defesa",
    rotulo: "Modo Defesa / Tour",
    rotuloCurto: "Defesa",
    ariaLabel: "Modo de Defesa e Tour Metodológico",
    tipo: "secundaria",
  },
  {
    id: "aoi",
    rotulo: "Área de Interesse",
    rotuloCurto: "AOI",
    ariaLabel: "Seletor de Área de Interesse",
    tipo: "primaria",
  },
  {
    id: "amostras",
    rotulo: "Amostras",
    rotuloCurto: "Amostras",
    ariaLabel: "Contador de amostras ativas pós-thinning",
    tipo: "primaria",
  },
  {
    id: "tema",
    rotulo: "Tema",
    rotuloCurto: "Tema",
    ariaLabel: "Alternar tema claro e escuro",
    tipo: "secundaria",
  },
  {
    id: "candidatos",
    rotulo: "Amostragem GEE",
    rotuloCurto: "GEE",
    ariaLabel: "Amostragem GEE",
    tipo: "primaria",
  },
  {
    id: "campanha",
    rotulo: "Campanha & Rótulos",
    rotuloCurto: "Campanha",
    ariaLabel: "Campanha e Rótulos",
    tipo: "secundaria",
  },
  {
    id: "matriz",
    rotulo: "Matriz de Treino",
    rotuloCurto: "Matriz",
    ariaLabel: "Montagem da Matriz de Treino",
    tipo: "secundaria",
  },
  {
    id: "config",
    rotulo: "Configurações",
    rotuloCurto: "Config",
    ariaLabel: "Configurações, Governança, Decisões e Diagnóstico",
    tipo: "secundaria",
  },
  {
    id: "export",
    rotulo: "Exportar",
    rotuloCurto: "Exportar",
    ariaLabel: "Exportar dados oficiais",
    tipo: "primaria",
  },
];

export interface DistribuicaoAcoes {
  noCabecalho: AcaoCabecalhoId[];
  noMenu: AcaoCabecalhoId[];
}

/**
 * Regra pura de distribuição das ações do cabeçalho por largura da tela (U01).
 * Garante que nenhum controle fique fora da janela em larguras de 390px a 1440px.
 *
 * - >= 1440px: Todas as 9 ações visíveis diretamente no cabeçalho (0 no menu Mais ações).
 * - >= 1280px && < 1440px: Campanha e matriz no menu; 7 no cabeçalho.
 * - >= 1024px && < 1280px: Defesa, campanha, matriz e config no menu Mais ações; 5 no cabeçalho.
 * - >= 768px && < 1024px: Defesa, candidatos, campanha, matriz e config no menu; 4 no cabeçalho.
 * - < 768px (ex: 390px): Apenas AOI e botão Mais ações no cabeçalho; 8 ações no menu.
 */
export function obterDistribuicaoAcoes(largura: number): DistribuicaoAcoes {
  if (largura >= 1440) {
    return {
      noCabecalho: [
        "defesa",
        "aoi",
        "amostras",
        "tema",
        "candidatos",
        "campanha",
        "matriz",
        "config",
        "export",
      ],
      noMenu: [],
    };
  }
  if (largura >= 1280) {
    return {
      noCabecalho: [
        "defesa",
        "aoi",
        "amostras",
        "tema",
        "candidatos",
        "config",
        "export",
      ],
      noMenu: ["campanha", "matriz"],
    };
  }
  if (largura >= 1024) {
    return {
      noCabecalho: ["aoi", "amostras", "tema", "candidatos", "export"],
      noMenu: ["defesa", "campanha", "matriz", "config"],
    };
  }
  if (largura >= 768) {
    return {
      noCabecalho: ["aoi", "amostras", "tema", "export"],
      noMenu: ["defesa", "candidatos", "campanha", "matriz", "config"],
    };
  }
  // < 768px (ex: 390px)
  return {
    noCabecalho: ["aoi"],
    noMenu: [
      "defesa",
      "amostras",
      "tema",
      "candidatos",
      "campanha",
      "matriz",
      "config",
      "export",
    ],
  };
}
