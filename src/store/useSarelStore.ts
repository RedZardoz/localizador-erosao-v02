/**
 * ============================================================================
 * Zustand Store Global do SAREL — SAREL v2 (PPGTCA 2026)
 * ============================================================================
 *
 * REGRAS INVIOLÁVEIS (LEI FUNDAMENTAL):
 * - Regra 1 e 5: Sem dados sintéticos fabricados por geradores ad-hoc em memória.
 * - Regra 3: Armazena diretamente objetos PontoAmostral com proveniência limpa.
 * - Invariante 2: Sem scores determinísticos ou severidade artificial.
 * - Memória Provisória: Pontos eleitos no GEE ficam em memória efêmera até
 *   serem salvos, impressos em planilha ou descartados ao limpar da tela.
 * - Áreas e Polígonos: Suporte a ativação/desativação individual para amostragem.
 */

import { create } from "zustand";
import { PontoAmostral } from "@/types/ponto";
import { RotuloConsolidado } from "@/types/rotulo";
import { valorOuNulo } from "@/types/proveniencia";
import { assegurarApenasPontosReais } from "@/lib/seguranca/guardaSintetico";
import type {
  AreaEstudo,
  CredenciaisState,
  MapViewState,
  ModalType,
  SystemLogEntry,
} from "@/types/ui";
import { PARANA_BASINS_GEOJSON } from "@/lib/localizacao/bacias";

export type AbaAtiva = "mapa" | "inspetor" | "matriz" | "campanha" | "decisoes";

export interface FiltrosState {
  bacia: string | null;
  solo: string | null;
  declividadeMin: number | null;
  declividadeMax: number | null;
  situacaoFundiaria: "todas" | "com-car" | "sem-car";
  rotulado: "todos" | "rotulado" | "nao-rotulado";
  buscaTexto: string;
}

interface SarelStoreState {
  // Abas e Modais
  abaAtiva: AbaAtiva;
  modalAtiva: ModalType;
  setAbaAtiva: (aba: AbaAtiva) => void;
  setModalAtiva: (modal: ModalType) => void;

  // Tema e Interface Geral
  tema: "dark" | "light";
  toggleTema: () => void;
  sidebarRecolhida: boolean;
  toggleSidebar: () => void;
  abaSidebar: "triagem" | "filtros";
  setAbaSidebar: (aba: "triagem" | "filtros") => void;

  // Pontos Salvos e Pontos Provisórios (Memória Efêmera)
  pontos: PontoAmostral[];
  pontosProvisorios: PontoAmostral[];
  pontoSelecionadoId: string | null;
  pontoAuditoria: PontoAmostral | null;
  rotulosConsolidados: Record<string, RotuloConsolidado>;

  // Métodos de Manipulação de Pontos
  carregarPontos: (novosPontos: PontoAmostral[]) => void;
  carregarPontosProvisorios: (novosPontos: PontoAmostral[]) => void;
  salvarPontosProvisorios: () => void;
  descartarPontosProvisorios: () => void;
  limparTela: () => void;
  selecionarPonto: (id: string | null) => void;
  setPontoAuditoria: (ponto: PontoAmostral | null) => void;
  definirRotuloConsolidado: (codigo: string, rotulo: RotuloConsolidado) => void;
  obterPontoSelecionado: () => PontoAmostral | undefined;

  // Áreas Territoriais e Polígonos Persistentes no Mapa
  areas: AreaEstudo[];
  adicionarArea: (area: AreaEstudo) => void;
  removerArea: (id: string) => void;
  alternarAreaAtiva: (id: string, ativa?: boolean) => void;
  definirAreas: (areas: AreaEstudo[]) => void;

  // Ferramenta de Desenho de Talhões / Polígonos
  modoDesenhoAtivo: boolean;
  poligonoDesenhando: [number, number][]; // [lon, lat]
  setModoDesenhoAtivo: (ativo: boolean) => void;
  adicionarVerticeDesenho: (coord: [number, number]) => void;
  desfazerVerticeDesenho: () => void;
  cancelarDesenho: () => void;
  concluirDesenhoTalhao: (nome: string, categoria?: string) => void;

  // Filtros da Sidebar
  filtroEstrato: string | null;
  filtroBloco: string | null;
  filtros: FiltrosState;
  topN: number | "todas";
  setFiltroEstrato: (estrato: string | null) => void;
  setFiltroBloco: (bloco: string | null) => void;
  setFiltros: (novosFiltros: Partial<FiltrosState>) => void;
  limparFiltros: () => void;
  setTopN: (n: number | "todas") => void;

  // Estado Cartográfico (MapLibre GL 3D)
  mapState: MapViewState;
  setMapState: (
    updater:
      | Partial<MapViewState>
      | ((prev: MapViewState) => Partial<MapViewState>)
  ) => void;

  // Credenciais e Status de Conexão com APIs
  credenciais: CredenciaisState;
  setCredenciais: (creds: Partial<CredenciaisState>) => void;
  setGeeSessionActive: (active: boolean) => void;

  // Logs e Diagnósticos
  systemLogs: SystemLogEntry[];
  adicionarLog: (
    severity: "info" | "warning" | "error",
    component: string,
    message: string,
    details?: Record<string, unknown>
  ) => void;
}

// Bacia padrão Paraná como área territorial inicial
const AREA_PARANA_INICIAL: AreaEstudo = {
  id: "area-pr-estado",
  nome: "Estado do Paraná (IBGE)",
  tipo: "estado",
  codigoIbge: "41",
  areaKm2: 199315,
  ativa: true,
  cor: "#059669",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-54.25, -24.01],
        [-54.08, -23.70],
        [-53.72, -23.25],
        [-53.40, -22.85],
        [-52.95, -22.52],
        [-52.50, -22.58],
        [-51.85, -22.65],
        [-51.20, -22.75],
        [-50.45, -22.95],
        [-49.95, -23.15],
        [-49.60, -23.40],
        [-49.30, -23.85],
        [-48.95, -24.30],
        [-48.50, -24.70],
        [-48.15, -25.05],
        [-48.40, -25.55],
        [-48.60, -25.90],
        [-49.00, -25.95],
        [-49.55, -26.05],
        [-50.10, -26.15],
        [-50.80, -26.10],
        [-51.40, -26.25],
        [-51.95, -26.45],
        [-52.30, -26.10],
        [-52.80, -26.20],
        [-53.10, -26.15],
        [-53.70, -26.25],
        [-54.20, -25.85],
        [-54.60, -25.55],
        [-54.35, -24.70],
        [-54.25, -24.01],
      ],
    ],
  },
};

const FILTROS_INICIAIS: FiltrosState = {
  bacia: null,
  solo: null,
  declividadeMin: null,
  declividadeMax: null,
  situacaoFundiaria: "todas",
  rotulado: "todos",
  buscaTexto: "",
};

export const useSarelStore = create<SarelStoreState>((set, get) => ({
  // Abas e Modais
  abaAtiva: "mapa",
  modalAtiva: null,
  setAbaAtiva: (aba) => set({ abaAtiva: aba }),
  setModalAtiva: (modal) => set({ modalAtiva: modal }),

  // Tema e Interface
  tema: "dark",
  toggleTema: () =>
    set((state) => ({ tema: state.tema === "dark" ? "light" : "dark" })),
  sidebarRecolhida: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarRecolhida: !state.sidebarRecolhida })),
  abaSidebar: "triagem",
  setAbaSidebar: (aba) => set({ abaSidebar: aba }),

  // Pontos Salvos e Pontos Provisórios
  // ZERO dados sintéticos: tela limpa inicialmente
  pontos: [],
  pontosProvisorios: [],
  pontoSelecionadoId: null,
  pontoAuditoria: null,
  rotulosConsolidados: {},

  carregarPontos: (novosPontos) => {
    assegurarApenasPontosReais(novosPontos);
    set({
      pontos: novosPontos,
      pontoSelecionadoId: novosPontos.length > 0 ? novosPontos[0].id : null,
    });
  },

  carregarPontosProvisorios: (novosPontos) => {
    assegurarApenasPontosReais(novosPontos);
    set({
      pontosProvisorios: novosPontos,
      pontoSelecionadoId: novosPontos.length > 0 ? novosPontos[0].id : null,
    });
  },

  salvarPontosProvisorios: () => {
    const { pontosProvisorios, pontos } = get();
    if (pontosProvisorios.length === 0) return;

    // Combina evitando duplicatas por ID
    const mapaExistente = new Map(pontos.map((p) => [p.id, p]));
    for (const p of pontosProvisorios) {
      mapaExistente.set(p.id, p);
    }
    const pontosSalvos = Array.from(mapaExistente.values());

    set({
      pontos: pontosSalvos,
      pontosProvisorios: [],
    });
  },

  descartarPontosProvisorios: () => {
    set({
      pontosProvisorios: [],
      pontoSelecionadoId: null,
    });
  },

  limparTela: () => {
    set({
      pontos: [],
      pontosProvisorios: [],
      pontoSelecionadoId: null,
      pontoAuditoria: null,
    });
  },

  selecionarPonto: (id) => set({ pontoSelecionadoId: id }),

  setPontoAuditoria: (ponto) => set({ pontoAuditoria: ponto }),

  definirRotuloConsolidado: (codigo, rotulo) =>
    set((state) => ({
      rotulosConsolidados: {
        ...state.rotulosConsolidados,
        [codigo]: rotulo,
      },
    })),

  obterPontoSelecionado: () => {
    const { pontos, pontosProvisorios, pontoSelecionadoId } = get();
    return (
      pontos.find((p) => p.id === pontoSelecionadoId) ||
      pontosProvisorios.find((p) => p.id === pontoSelecionadoId)
    );
  },

  // Áreas de Estudo e Polígonos
  areas: [],

  adicionarArea: (area) =>
    set((state) => ({
      areas: [...state.areas.filter((a) => a.id !== area.id), area],
    })),

  removerArea: (id) =>
    set((state) => ({
      areas: state.areas.filter((a) => a.id !== id),
    })),

  alternarAreaAtiva: (id, ativa) =>
    set((state) => ({
      areas: state.areas.map((a) =>
        a.id === id ? { ...a, ativa: ativa ?? !a.ativa } : a
      ),
    })),

  definirAreas: (areas) => set({ areas }),

  // Desenho de Polígonos / Talhões
  modoDesenhoAtivo: false,
  poligonoDesenhando: [],

  setModoDesenhoAtivo: (ativo) =>
    set({ modoDesenhoAtivo: ativo, poligonoDesenhando: [] }),

  adicionarVerticeDesenho: (coord) =>
    set((state) => ({
      poligonoDesenhando: [...state.poligonoDesenhando, coord],
    })),

  desfazerVerticeDesenho: () =>
    set((state) => ({
      poligonoDesenhando: state.poligonoDesenhando.slice(0, -1),
    })),

  cancelarDesenho: () =>
    set({ modoDesenhoAtivo: false, poligonoDesenhando: [] }),

  concluirDesenhoTalhao: (nome, categoria = "Talhão Agrícola") => {
    const { poligonoDesenhando, areas } = get();
    if (poligonoDesenhando.length < 3) return;

    // Fecha o anel se necessário
    const coordsFechadas =
      poligonoDesenhando[0][0] ===
        poligonoDesenhando[poligonoDesenhando.length - 1][0] &&
      poligonoDesenhando[0][1] ===
        poligonoDesenhando[poligonoDesenhando.length - 1][1]
        ? poligonoDesenhando
        : [...poligonoDesenhando, poligonoDesenhando[0]];

    const novoTalhao: AreaEstudo = {
      id: `talhao-${Date.now()}`,
      nome: nome.trim() || `Talhão ${areas.filter((a) => a.tipo === "talhao").length + 1}`,
      tipo: "talhao",
      categoria,
      ativa: true,
      cor: "#10B981",
      geometry: {
        type: "Polygon",
        coordinates: [coordsFechadas],
      },
    };

    set((state) => ({
      areas: [...state.areas, novoTalhao],
      modoDesenhoAtivo: false,
      poligonoDesenhando: [],
    }));
  },

  // Filtros
  filtroEstrato: null,
  filtroBloco: null,
  filtros: FILTROS_INICIAIS,
  topN: "todas",

  setFiltroEstrato: (estrato) => set({ filtroEstrato: estrato }),
  setFiltroBloco: (bloco) => set({ filtroBloco: bloco }),
  setFiltros: (novos) =>
    set((state) => ({ filtros: { ...state.filtros, ...novos } })),
  limparFiltros: () =>
    set({ filtros: FILTROS_INICIAIS, filtroEstrato: null, filtroBloco: null }),
  setTopN: (topN) => set({ topN }),

  // Visualização Cartográfica
  mapState: {
    basemap: "google-earth",
    terreno3d: true,
    exageracao3d: 1.5,
    mostrarBacias: false,
    mostrarLimites: false,
    mostrarSolosEmbrapa: false,
    mostrarErodibilidade: false,
    flyToTarget: null,
  },

  setMapState: (updater) =>
    set((state) => ({
      mapState:
        typeof updater === "function"
          ? { ...state.mapState, ...updater(state.mapState) }
          : { ...state.mapState, ...updater },
    })),

  // Credenciais
  credenciais: {
    geeSessionActive: false,
    gcpCredentials: null,
    mapboxToken: "",
    googleMapsKey: "",
    cartoApiKey: "",
    planetApiKey: "",
    embrapaToken: "",
  },

  setCredenciais: (creds) =>
    set((state) => ({
      credenciais: { ...state.credenciais, ...creds },
    })),

  setGeeSessionActive: (active) =>
    set((state) => ({
      credenciais: { ...state.credenciais, geeSessionActive: active },
    })),

  // Logs
  systemLogs: [
    {
      id: "log-init",
      timestamp: new Date().toISOString(),
      severity: "info",
      component: "SAREL-Core",
      message: "Sistema SAREL v2 inicializado com rigor de dados verificados.",
    },
  ],

  adicionarLog: (severity, component, message, details) =>
    set((state) => ({
      systemLogs: [
        {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          severity,
          component,
          message,
          details,
        },
        ...state.systemLogs.slice(0, 99),
      ],
    })),
}));

/**
 * Seletor de pontos visíveis combinando pontos salvos e provisórios com os filtros ativos.
 */
export function usePontosVisiveis(): PontoAmostral[] {
  const { pontos, pontosProvisorios, filtros, filtroEstrato, filtroBloco, topN } =
    useSarelStore();

  // Combina pontos salvos com provisórios
  const todosPontos = [...pontos, ...pontosProvisorios];

  return todosPontos.filter((p) => {
    if (filtroEstrato && p.estratoId !== filtroEstrato) return false;
    if (filtroBloco && p.blocoEspacial !== filtroBloco) return false;
    if (
      filtros.bacia &&
      valorOuNulo(p.localizacao?.bacia) !== filtros.bacia
    ) {
      return false;
    }
    if (
      filtros.solo &&
      valorOuNulo(p.solo?.ordem) !== filtros.solo
    ) {
      return false;
    }
    const decliv = valorOuNulo(p.terreno?.declividadePct);
    if (
      filtros.declividadeMin !== null &&
      (decliv === null || decliv < filtros.declividadeMin)
    ) {
      return false;
    }
    if (
      filtros.declividadeMax !== null &&
      (decliv === null || decliv > filtros.declividadeMax)
    ) {
      return false;
    }
    if (filtros.situacaoFundiaria === "com-car") {
      if (!p.fundiario?.codigoCar) return false;
    } else if (filtros.situacaoFundiaria === "sem-car") {
      if (p.fundiario?.codigoCar) return false;
    }
    if (filtros.rotulado === "rotulado") {
      if (!p.rotulo?.final) return false;
    } else if (filtros.rotulado === "nao-rotulado") {
      if (p.rotulo?.final) return false;
    }
    if (filtros.buscaTexto) {
      const q = filtros.buscaTexto.toLowerCase();
      const matchCodigo = p.codigo.toLowerCase().includes(q);
      const mun = valorOuNulo(p.localizacao?.municipio);
      const matchMun = mun ? mun.toLowerCase().includes(q) : false;
      const bac = valorOuNulo(p.localizacao?.bacia);
      const matchBacia = bac ? bac.toLowerCase().includes(q) : false;
      const matchCar = (p.fundiario?.codigoCar || "").toLowerCase().includes(q);
      if (!matchCodigo && !matchMun && !matchBacia && !matchCar) return false;
    }
    return true;
  }).slice(0, topN === "todas" ? undefined : topN);
}
