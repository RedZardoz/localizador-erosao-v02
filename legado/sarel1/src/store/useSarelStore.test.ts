import { describe, expect, it } from "vitest";
import { useSarelStore } from "./useSarelStore";
import { PontoAmostral } from "@/types/ponto";
import { RotuloConsolidado } from "@/types/rotulo";

describe("Store Global do SAREL (Zustand)", () => {
  it("inicializa com estado limpo e sem pontos sintéticos fabricados (Regra 1)", () => {
    const state = useSarelStore.getState();
    expect(state.pontos.length).toBe(0);
    expect(state.pontoSelecionadoId).toBeNull();
    expect(state.abaAtiva).toBe("mapa");
  });

  it("permite carregar pontos e selecionar ponto ativo", () => {
    const state = useSarelStore.getState();
    state.carregarColecaoDemonstrativa();

    const stateAtualizado = useSarelStore.getState();
    expect(stateAtualizado.pontos.length).toBeGreaterThan(0);
    const segundoPonto = stateAtualizado.pontos[1];

    stateAtualizado.selecionarPonto(segundoPonto.id);

    const pontoAtualizado = useSarelStore.getState().obterPontoSelecionado();
    expect(pontoAtualizado?.id).toBe(segundoPonto.id);
    expect(pontoAtualizado?.codigo).toBe(segundoPonto.codigo);
  });

  it("permite transição entre abas de navegação (§12)", () => {
    const state = useSarelStore.getState();

    state.definirAba("matriz");
    expect(useSarelStore.getState().abaAtiva).toBe("matriz");

    state.definirAba("campanha");
    expect(useSarelStore.getState().abaAtiva).toBe("campanha");
  });

  it("aplica filtros amostrais por estrato e bloco espacial", () => {
    const state = useSarelStore.getState();

    const primeiroEstrato = state.pontos[0].estratoId;
    state.atualizarFiltros({ estrato: primeiroEstrato });

    const filtrados = useSarelStore.getState().obterPontosFiltrados();
    expect(filtrados.every((p) => p.estratoId === primeiroEstrato)).toBe(true);

    // Resetar filtro
    state.atualizarFiltros({ estrato: "todos" });
    expect(useSarelStore.getState().obterPontosFiltrados().length).toBe(state.pontos.length);
  });

  it("incorpora novos rótulos consolidados e atualiza o ponto correspondente", () => {
    const state = useSarelStore.getState();
    const pontoRef = state.pontos[0];

    const novoRotulo: RotuloConsolidado = {
      final: {
        classe: "severa",
        modalidade: "campo",
        observador: "Banca Examinadora",
        observadoEm: "2026-06-01",
        cego: true,
      },
      origens: [],
      divergencia: "nenhuma",
    };

    state.adicionarRotuloConsolidado(pontoRef.codigo, novoRotulo);

    const stateAtualizado = useSarelStore.getState();
    expect(stateAtualizado.rotulosConsolidados[pontoRef.codigo].final.classe).toBe("severa");
    const pAtualizado = stateAtualizado.pontos.find((p) => p.codigo === pontoRef.codigo);
    expect(pAtualizado?.rotulo?.classe).toBe("severa");
  });
});
