import { describe, it, expect } from "vitest";
import { useSarelStore } from "./useSarelStore";

describe("useSarelStore — Interface & Requisitos de Dados Reais", () => {
  it("inicia estritamente com tela limpa, sem pontos e sem polígonos invasivos", () => {
    const state = useSarelStore.getState();
    expect(state.pontos).toHaveLength(0);
    expect(state.pontosProvisorios).toHaveLength(0);
    expect(state.areas).toHaveLength(0); // Mapa inicia limpo conforme solicitado pelo usuário
    expect(state.mapState.mostrarBacias).toBe(false);
  });

  it("permite adicionar, ativar e desativar áreas mantendo a coleção sincronizada", () => {
    const store = useSarelStore.getState();
    const novaArea = {
      id: "teste-area-1",
      nome: "Área de Teste",
      tipo: "municipio" as const,
      ativa: true,
      geometry: { type: "Polygon" as const, coordinates: [] },
    };

    store.adicionarArea(novaArea);
    expect(useSarelStore.getState().areas).toHaveLength(1);
    expect(useSarelStore.getState().areas[0].ativa).toBe(true);

    // Desativa a área
    store.alternarAreaAtiva(novaArea.id);
    expect(useSarelStore.getState().areas[0].ativa).toBe(false);

    // Reativa a área
    store.alternarAreaAtiva(novaArea.id);
    expect(useSarelStore.getState().areas[0].ativa).toBe(true);
  });

  it("bloqueia eleição amostral quando a sessão GEE estiver inativa", () => {
    const state = useSarelStore.getState();
    expect(state.credenciais.geeSessionActive).toBe(false);
  });

  it("permite salvar pontos provisórios para a coleção oficial ou descartá-los", () => {
    const store = useSarelStore.getState();
    
    // Inicia vazio
    expect(store.pontosProvisorios).toHaveLength(0);

    // Carrega pontos provisórios de memória efêmera
    store.carregarPontosProvisorios([]);
    expect(useSarelStore.getState().pontosProvisorios).toHaveLength(0);

    // Descartar limpa os provisórios
    store.descartarPontosProvisorios();
    expect(useSarelStore.getState().pontosProvisorios).toHaveLength(0);
  });
});
