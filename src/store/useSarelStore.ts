/**
 * ============================================================================
 * Zustand Store Global do SAREL — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * REGRAS INVIOLÁVEIS (LEI FUNDAMENTAL):
 * - Regra 1 e 5: Sem dados sintéticos fabricados por geradores ad-hoc em memória.
 * - Regra 3: Armazena diretamente objetos PontoAmostral com proveniência limpa.
 * - Invariante 2: Sem scores determinísticos ou severidade artificial.
 */

import { create } from "zustand";
import { PontoAmostral } from "@/types/ponto";
import { RotuloConsolidado } from "@/types/rotulo";
import { assegurarApenasPontosReais } from "@/lib/seguranca/guardaSintetico";

export type AbaAtiva = "mapa" | "inspetor" | "matriz" | "campanha" | "decisoes";

interface SarelStoreState {
  abaAtiva: AbaAtiva;
  pontos: PontoAmostral[];
  pontoSelecionadoId: string | null;
  rotulosConsolidados: Record<string, RotuloConsolidado>;
  filtroEstrato: string | null;
  filtroBloco: string | null;

  setAbaAtiva: (aba: AbaAtiva) => void;
  carregarPontos: (novosPontos: PontoAmostral[]) => void;
  selecionarPonto: (id: string | null) => void;
  definirRotuloConsolidado: (codigo: string, rotulo: RotuloConsolidado) => void;
  setFiltroEstrato: (estrato: string | null) => void;
  setFiltroBloco: (bloco: string | null) => void;
  obterPontoSelecionado: () => PontoAmostral | undefined;
}

export const useSarelStore = create<SarelStoreState>((set, get) => ({
  abaAtiva: "mapa",
  pontos: [],
  pontoSelecionadoId: null,
  rotulosConsolidados: {},
  filtroEstrato: null,
  filtroBloco: null,

  setAbaAtiva: (aba) => set({ abaAtiva: aba }),

  carregarPontos: (novosPontos) => {
    // Guarda antissintético universal na reidratação do store (Regra 5)
    assegurarApenasPontosReais(novosPontos);
    set({
      pontos: novosPontos,
      pontoSelecionadoId: novosPontos.length > 0 ? novosPontos[0].id : null,
    });
  },

  selecionarPonto: (id) => set({ pontoSelecionadoId: id }),

  definirRotuloConsolidado: (codigo, rotulo) =>
    set((state) => ({
      rotulosConsolidados: {
        ...state.rotulosConsolidados,
        [codigo]: rotulo,
      },
    })),

  setFiltroEstrato: (estrato) => set({ filtroEstrato: estrato }),

  setFiltroBloco: (bloco) => set({ filtroBloco: bloco }),

  obterPontoSelecionado: () => {
    const { pontos, pontoSelecionadoId } = get();
    return pontos.find((p) => p.id === pontoSelecionadoId);
  },
}));
