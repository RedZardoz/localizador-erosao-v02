import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InspetorPonto } from "./InspetorPonto";
import { useSarelStore } from "@/store/useSarelStore";
import type { PontoAmostral } from "@/types/ponto";
import type { RotuloConsolidado } from "@/types/rotulo";

function criarPontoComRotuloEmbutido(): PontoAmostral {
  const ind = (motivo: string) => ({
    estado: "indisponivel" as const,
    causa: "decisao-pendente" as const,
    motivo,
  });

  const rotuloConsolidadoEmbutido: RotuloConsolidado = {
    final: {
      classe: "erosao",
      modalidade: "campo",
      observador: "Perito Campo PPGTCA",
      observadoEm: "2026-09-26",
      confianca: "alta",
      cego: true,
    },
    origens: [
      {
        classe: "erosao",
        modalidade: "campo",
        observador: "Perito Campo PPGTCA",
        observadoEm: "2026-09-26",
        confianca: "alta",
        cego: true,
      },
    ],
    kappa: 0.91,
    divergencia: "nenhuma",
    papelConjunto: "treino",
  };

  return {
    id: "pt-d6",
    codigo: "PR-2026-0099",
    latitude: -24.955,
    longitude: -53.455,
    origemSintetica: false,
    blocoEspacial: "BLOCO_01",
    estratoId: "S2-E2-K1",
    criterioSelecao: {
      tercilS: 2,
      tercilE: 2,
      nivelK: 1,
      phiDiag: 0.42,
      semente: 42,
    },
    localizacao: {
      municipio: ind("Teste"),
      codigoIbge: ind("Teste"),
      bacia: ind("Teste"),
    },
    terreno: {
      elevacao: ind("Teste"),
      declividadePct: ind("Teste"),
      declividadeGraus: ind("Teste"),
      curvaturaPerfil: ind("Teste"),
      curvaturaPlana: ind("Teste"),
      acumuloFluxo: ind("Teste"),
      twi: ind("Teste"),
    },
    solo: {
      ordem: ind("Teste"),
      subOrdem: ind("Teste"),
      grandeGrupo: ind("Teste"),
      tipoUnidade: ind("Teste"),
      confiancaPedologica: "indisponivel",
      erodibilidadeClasse: ind("Teste"),
    },
    temporal: {},
    rotulo: rotuloConsolidadoEmbutido,
    rastreio: {
      versaoMotor: "2.0.0",
      cenas: [],
      calculadoEm: "2026-09-26T00:00:00Z",
    },
  };
}

describe("InspetorPonto — Fonte Única de Rótulo Humano e Eliminação do Defeito D6.b", () => {
  beforeEach(() => {
    useSarelStore.setState({
      pontos: [],
      pontosProvisorios: [],
      pontoSelecionadoId: null,
      rotulosConsolidados: {},
    });
  });

  it("D6.b (prova algébrica): o fallback antigo envolvia RotuloConsolidado em { final: ponto.rotulo }, produzindo campos undefined e cego=false", () => {
    const ponto = criarPontoComRotuloEmbutido();
    const rotulosConsolidadosVazio: Record<string, RotuloConsolidado> = {};

    // Expressão exata que existia em InspetorPonto.tsx:118-119 antes da correção:
    const rotuloConsolidadoLegado =
      rotulosConsolidadosVazio[ponto.codigo] ??
      (ponto.rotulo ? { final: ponto.rotulo, origens: [ponto.rotulo] } : null);
    const rotuloFinalLegado: any = rotuloConsolidadoLegado?.final;

    // Embora rotuloFinalLegado seja truthy (é o objeto RotuloConsolidado),
    // ele NÃO possui as propriedades de Rotulo (classe, modalidade, observador, observadoEm, cego):
    expect(Boolean(rotuloFinalLegado)).toBe(true);
    expect(rotuloFinalLegado.classe).toBeUndefined();
    expect(rotuloFinalLegado.modalidade).toBeUndefined();
    expect(rotuloFinalLegado.observador).toBeUndefined();
    expect(rotuloFinalLegado.observadoEm).toBeUndefined();
    expect(rotuloFinalLegado.cego ? "Sim (Cego)" : "Não").toBe("Não");
  });

  it("T6 (D6.a + D6.b): InspetorPonto usa exclusivamente rotulosConsolidados e declara ausência quando o ponto não está consolidado no mapa", () => {
    const ponto = criarPontoComRotuloEmbutido();
    // 1. Configura a store com o ponto que tem ponto.rotulo embutido, mas rotulosConsolidados VAZIO:
    useSarelStore.setState({
      pontos: [ponto],
      pontoSelecionadoId: ponto.id,
      rotulosConsolidados: {},
    });
    Object.assign(useSarelStore.getInitialState(), useSarelStore.getState());

    const htmlSemConsolidado = renderToStaticMarkup(React.createElement(InspetorPonto));
    expect(htmlSemConsolidado).toContain("Ponto ainda não rotulado por observação humana independente.");
    expect(htmlSemConsolidado).not.toContain("Classe Observada:");

    // 2. Consolida o rótulo na fonte única autoritativa (rotulosConsolidados):
    useSarelStore.setState({
      pontos: [ponto],
      pontoSelecionadoId: ponto.id,
      rotulosConsolidados: {
        [ponto.codigo]: ponto.rotulo!,
      },
    });
    Object.assign(useSarelStore.getInitialState(), useSarelStore.getState());

    const htmlComConsolidado = renderToStaticMarkup(React.createElement(InspetorPonto));
    expect(htmlComConsolidado).toContain("Classe Observada:");
    expect(htmlComConsolidado).toContain("erosao");
    expect(htmlComConsolidado).toContain("Perito Campo PPGTCA");
    expect(htmlComConsolidado).toContain("2026-09-26");
    expect(htmlComConsolidado).toContain("Sim (Cego)");
  });
});
