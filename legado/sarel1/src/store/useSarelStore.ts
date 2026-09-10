/**
 * ============================================================================
 * Estado Global da Aplicação SAREL (Zustand) — PPGTCA 2026
 * ============================================================================
 *
 * Gerencia a coleção de pontos amostrais, filtros, ponto ativo no Inspetor,
 * rótulos consolidados e abas de navegação.
 *
 * REGRA 3: Não serializa proveniência de forma descolada do valor.
 * REGRA 4: Não calcula severidade nem substitui o rótulo por cálculo do sistema.
 */

import { create } from "zustand";
import { PontoAmostral } from "@/types/ponto";
import { RotuloConsolidado } from "@/types/rotulo";
import {
  gerarPontosDemonstrativos,
  gerarRotulosConsolidadosIniciais,
  gerarAmostragemParaAoi,
  ParametrosAmostragemAoi,
  SEMENTE_AMOSTRAGEM_PADRAO,
} from "@/lib/dados/pontosExemplo";

export type AbaNavegacao =
  | "mapa"
  | "inspetor"
  | "matriz"
  | "campanha"
  | "comparador"
  | "relatorios";

export type ModoColoracaoMapa = "estrato" | "completude" | "blocoEspacial";

export type ModalTipo = "region" | "candidate" | "settings" | "export" | "saved" | "logs" | null;

export type BasemapTipo = "google-hybrid" | "google-satellite" | "esri-satellite" | "osm";

export interface AoiDefinicao {
  tipo: "estado" | "municipio" | "bacia" | "talhao";
  nome: string;
  codigoIbge?: string;
  uf?: string;
  nomeEstado?: string;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  geojson?: any;
}

export interface FiltrosAmostrais {
  estrato: string | "todos";
  bloco: string | "todos";
  rotulagem: "todos" | "rotulado" | "pendente";
  colorirPor: ModoColoracaoMapa;
}

export interface GeeCredenciaisEstado {
  status: "desconectado" | "carregado" | "ativo";
  projectId: string;
  clientEmail: string;
  privateKey: string;
  armazenamento: "local" | "sessao";
  scopes?: string[];
  respostaValidacao?: any;
}

export interface ApiTokensEstado {
  mapbox: string;
  google: string;
  carto: string;
  embrapa: string;
  status: Record<string, "pendente" | "testando" | "valido" | "erro">;
  mensagens: Record<string, string>;
}

interface SarelState {
  pontos: PontoAmostral[];
  pontoSelecionadoId: string | null;
  abaAtiva: AbaNavegacao;
  filtros: FiltrosAmostrais;
  rotulosConsolidados: Record<string, RotuloConsolidado>;
  sementeAmostragem: number;
  avisos: string[];

  // Novos estados para o Design System e Controle Espacial
  aoiAtiva: AoiDefinicao;
  modalAtivo: ModalTipo;
  basemapAtivo: BasemapTipo;
  perimetroSicarAtivo: any | null;
  talhaoDesenhado: any | null;
  sidebarAberta: boolean;
  topN: number | "todas";
  modo3d: boolean;
  tema: "dark" | "light";
  camadasAtivas: {
    pontos: boolean;
    ibge: boolean;
    bacias: boolean;
    sicar: boolean;
    heatmap: boolean;
    talhoes: boolean;
  };
  talhoesSalvos: { id: string; nome: string; vertices: [number, number][]; areaHa: number; data: string }[];

  geeCredenciais: GeeCredenciaisEstado;
  apiTokens: ApiTokensEstado;

  // Actions
  definirGeeCredenciais: (dados: Partial<GeeCredenciaisEstado>) => void;
  definirApiToken: (servico: "mapbox" | "google" | "carto" | "embrapa", valor: string) => void;
  definirStatusApiToken: (servico: string, status: "pendente" | "testando" | "valido" | "erro", msg?: string) => void;
  limparGeeCredenciais: () => void;
  selecionarPonto: (id: string | null) => void;
  definirAba: (aba: AbaNavegacao) => void;
  atualizarFiltros: (novosFiltros: Partial<FiltrosAmostrais>) => void;
  adicionarRotuloConsolidado: (codigo: string, rotulo: RotuloConsolidado) => void;
  carregarPontos: (pontos: PontoAmostral[]) => void;
  obterPontoSelecionado: () => PontoAmostral | undefined;
  obterPontosFiltrados: () => PontoAmostral[];

  // Novas Actions
  definirAoiAtiva: (aoi: AoiDefinicao) => void;
  abrirModal: (modal: ModalTipo) => void;
  fecharModal: () => void;
  definirBasemap: (basemap: BasemapTipo) => void;
  definirPerimetroSicar: (geojson: any | null) => void;
  definirTalhaoDesenhado: (talhao: any | null) => void;
  alternarSidebar: () => void;
  definirTopN: (topN: number | "todas") => void;
  alternarModo3d: () => void;
  alternarTema: () => void;
  alternarCamada: (camada: "pontos" | "ibge" | "bacias" | "sicar" | "heatmap" | "talhoes") => void;
  adicionarTalhao: (talhao: { id: string; nome: string; vertices: [number, number][]; areaHa: number; data: string }) => void;
  amostrarNovaColecao: (params: {
    quantidade: number;
    semente: number;
    aoi: AoiDefinicao;
    substituir: boolean;
  }) => void;
  carregarColecaoDemonstrativa: () => void;
}

const aoiPadraoParana: AoiDefinicao = {
  tipo: "estado",
  nome: "Paraná (PR) — Limite Oficial IBGE",
  codigoIbge: "41",
  uf: "PR",
  nomeEstado: "Paraná",
  bbox: [-54.62, -26.72, -48.02, -22.51],
};

// REGRA 1 & 6: Dado verdadeiro ou ausência declarada.
// Inicializa vazio para que nenhuma amostragem sintética apareça sem conexão ao GEE ou critérios.
const pontosIniciais: PontoAmostral[] = [];
const rotulosIniciais: Record<string, RotuloConsolidado> = {};

export const useSarelStore = create<SarelState>((set, get) => ({
  pontos: pontosIniciais,
  pontoSelecionadoId: null,
  abaAtiva: "mapa",
  filtros: {
    estrato: "todos",
    bloco: "todos",
    rotulagem: "todos",
    colorirPor: "estrato",
  },
  rotulosConsolidados: rotulosIniciais,
  sementeAmostragem: SEMENTE_AMOSTRAGEM_PADRAO,
  avisos: [],

  aoiAtiva: aoiPadraoParana,
  modalAtivo: null,
  basemapAtivo: "google-hybrid",
  perimetroSicarAtivo: null,
  talhaoDesenhado: null,
  sidebarAberta: true,
  topN: "todas",
  modo3d: false,
  tema: "dark",
  camadasAtivas: {
    pontos: true,
    ibge: true,
    bacias: true,
    sicar: true,
    heatmap: false,
    talhoes: true,
  },
  talhoesSalvos: [],

  geeCredenciais: {
    status: "desconectado",
    projectId: "",
    clientEmail: "",
    privateKey: "",
    armazenamento: "local",
  },
  apiTokens: {
    mapbox: "",
    google: "",
    carto: "",
    embrapa: "",
    status: {},
    mensagens: {},
  },

  definirGeeCredenciais: (dados) =>
    set((s) => ({
      geeCredenciais: { ...s.geeCredenciais, ...dados },
    })),
  definirApiToken: (servico, valor) =>
    set((s) => ({
      apiTokens: {
        ...s.apiTokens,
        [servico]: valor,
        status: { ...s.apiTokens.status, [servico]: "pendente" },
      },
    })),
  definirStatusApiToken: (servico, status, msg) =>
    set((s) => ({
      apiTokens: {
        ...s.apiTokens,
        status: { ...s.apiTokens.status, [servico]: status },
        mensagens: msg ? { ...s.apiTokens.mensagens, [servico]: msg } : s.apiTokens.mensagens,
      },
    })),
  limparGeeCredenciais: () =>
    set({
      geeCredenciais: {
        status: "desconectado",
        projectId: "",
        clientEmail: "",
        privateKey: "",
        armazenamento: "local",
        respostaValidacao: undefined,
      },
    }),

  definirAoiAtiva: (aoi) => {
    set({
      aoiAtiva: aoi,
      pontos: [], // Regra 1 e 6: Selecionar o município define a AOI sem fabricar pontos sintéticos!
      pontoSelecionadoId: null,
      rotulosConsolidados: {},
      perimetroSicarAtivo: null,
    });
  },
  abrirModal: (modal) => set({ modalAtivo: modal }),
  fecharModal: () => set({ modalAtivo: null }),
  definirBasemap: (basemap) => set({ basemapAtivo: basemap }),
  definirPerimetroSicar: (geojson) => set({ perimetroSicarAtivo: geojson }),
  definirTalhaoDesenhado: (talhao) => set({ talhaoDesenhado: talhao }),
  alternarSidebar: () => set((s) => ({ sidebarAberta: !s.sidebarAberta })),
  definirTopN: (topN) => set({ topN }),
  alternarModo3d: () => set((s) => ({ modo3d: !s.modo3d })),
  alternarTema: () =>
    set((s) => {
      const novoTema = s.tema === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("sarel_tema", novoTema);
        } catch {}
      }
      return { tema: novoTema };
    }),
  alternarCamada: (camada) =>
    set((s) => ({
      camadasAtivas: { ...s.camadasAtivas, [camada]: !s.camadasAtivas[camada] },
    })),
  adicionarTalhao: (talhao) =>
    set((s) => ({
      talhoesSalvos: [talhao, ...s.talhoesSalvos],
    })),

  amostrarNovaColecao: ({ quantidade, semente, aoi, substituir }) => {
    const novosPontos = gerarAmostragemParaAoi({
      quantidade,
      semente,
      bbox: aoi.bbox,
      nomeRegiao: aoi.nome,
      municipio: aoi.tipo === "municipio" ? aoi.nome.replace("Município de ", "") : undefined,
      uf: aoi.uf || "PR",
      geojson: aoi.geojson,
    });

    const novosRotulos = gerarRotulosConsolidadosIniciais(novosPontos);

    set((state) => {
      const pontosFinais = substituir ? novosPontos : [...state.pontos, ...novosPontos];
      return {
        pontos: pontosFinais,
        pontoSelecionadoId: pontosFinais[0]?.id ?? null,
        sementeAmostragem: semente,
        rotulosConsolidados: substituir ? novosRotulos : { ...state.rotulosConsolidados, ...novosRotulos },
        aoiAtiva: aoi,
        modalAtivo: null,
        perimetroSicarAtivo: null,
      };
    });
  },

  carregarColecaoDemonstrativa: () => {
    const pontosDemo = gerarPontosDemonstrativos(36);
    const rotulosDemo = gerarRotulosConsolidadosIniciais(pontosDemo);
    set({
      pontos: pontosDemo,
      pontoSelecionadoId: pontosDemo[0]?.id ?? null,
      rotulosConsolidados: rotulosDemo,
    });
  },

  selecionarPonto: (id) => set({ pontoSelecionadoId: id }),

  definirAba: (aba) => set({ abaAtiva: aba }),

  atualizarFiltros: (novosFiltros) =>
    set((state) => ({
      filtros: { ...state.filtros, ...novosFiltros },
    })),

  adicionarRotuloConsolidado: (codigo, rotulo) =>
    set((state) => {
      const novosRotulos = { ...state.rotulosConsolidados, [codigo]: rotulo };
      // Atualiza também o ponto na coleção se ele existir
      const novosPontos = state.pontos.map((p) => {
        if (p.codigo === codigo) {
          return { ...p, rotulo: rotulo.final };
        }
        return p;
      });
      return { rotulosConsolidados: novosRotulos, pontos: novosPontos };
    }),

  carregarPontos: (novosPontos) =>
    set({
      pontos: novosPontos,
      pontoSelecionadoId: novosPontos[0]?.id ?? null,
    }),

  obterPontoSelecionado: () => {
    const { pontos, pontoSelecionadoId } = get();
    return pontos.find((p) => p.id === pontoSelecionadoId);
  },

  obterPontosFiltrados: () => {
    const { pontos, filtros, rotulosConsolidados, topN } = get();
    const filtrados = pontos.filter((p) => {
      // Filtro por estrato
      if (filtros.estrato !== "todos" && p.estratoId !== filtros.estrato) {
        return false;
      }
      // Filtro por bloco espacial
      if (filtros.bloco !== "todos" && p.blocoEspacial !== filtros.bloco) {
        return false;
      }
      // Filtro por status de rotulagem
      if (filtros.rotulagem !== "todos") {
        const temRotulo = Boolean(rotulosConsolidados[p.codigo] ?? p.rotulo);
        if (filtros.rotulagem === "rotulado" && !temRotulo) return false;
        if (filtros.rotulagem === "pendente" && temRotulo) return false;
      }
      return true;
    });

    if (topN !== "todas" && typeof topN === "number" && topN > 0) {
      return filtrados.slice(0, topN);
    }
    return filtrados;
  },
}));
