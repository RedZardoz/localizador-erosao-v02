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

  it("J1 (Protocolo Cego): no modo de registro, nenhum campo proibido nem estratoId é renderizado, e o botão de salvar existe", async () => {
    const { CAMPOS_PROIBIDOS_MATRIZ_TREINO } = await import("@/lib/matriz/invariantes");
    const ponto = criarPontoComRotuloEmbutido();
    useSarelStore.setState({
      pontos: [ponto],
      pontoSelecionadoId: ponto.id,
      rotulosConsolidados: {},
    });

    const htmlRegistro = renderToStaticMarkup(
      React.createElement(InspetorPonto as React.ComponentType<{ modoInicial?: "inspecao" | "registro" }>, {
        modoInicial: "registro",
      })
    );

    // 1. O código do ponto e identificador de protocolo cego estão presentes:
    expect(htmlRegistro).toContain(ponto.codigo);
    expect(htmlRegistro).toContain("PROTOCOLO CEGO ATIVO (D26)");
    expect(htmlRegistro).toContain("ALVO PRIMÁRIO (D26)");
    expect(htmlRegistro).toContain("ALVO SECUNDÁRIO DERIVADO");
    expect(htmlRegistro).toContain("Gravar Rótulo Pericial Humano sob Protocolo Cego");

    // 2. estratoId ("S2-E2-K1") JAMAIS pode ser renderizado no modo de registro:
    expect(htmlRegistro).not.toContain(ponto.estratoId);
    expect(htmlRegistro).not.toContain("Estrato:");

    // 3. Nenhum campo de estratificação ou score proibido pode aparecer:
    expect(htmlRegistro).not.toContain(`S tercil ${ponto.criterioSelecao.tercilS}`);
    expect(htmlRegistro).not.toContain(`E tercil ${ponto.criterioSelecao.tercilE}`);
    expect(htmlRegistro).not.toContain(`K nível ${ponto.criterioSelecao.nivelK}`);
    expect(htmlRegistro).not.toContain("scoreJev");
    expect(htmlRegistro).not.toContain("scoreSuscetibilidade");
    expect(htmlRegistro).not.toContain("laudoJev");
    expect(htmlRegistro).not.toContain("phiDiag");

    // 4. Nenhum dos termos de CAMPOS_PROIBIDOS_MATRIZ_TREINO específicos de modelo/estrato pode vazar:
    const camposCriticos = [
      "estratoId",
      "tercilS",
      "tercilE",
      "nivelK",
      "scorePrioridade",
      "scoreSuscetibilidade",
      "scoreJev",
      "laudoJev",
      "phiDiag",
    ];
    for (const campo of camposCriticos) {
      expect(htmlRegistro).not.toContain(`>${campo}<`);
      expect(htmlRegistro).not.toContain(`"${campo}"`);
    }
  });

  it("J1 (Modo Inspeção): exibe estratificação completa mas NÃO permite gravar rótulo (botão de salvar ausente)", () => {
    const ponto = criarPontoComRotuloEmbutido();
    useSarelStore.setState({
      pontos: [ponto],
      pontoSelecionadoId: ponto.id,
      rotulosConsolidados: {},
    });

    const htmlInspecao = renderToStaticMarkup(
      React.createElement(InspetorPonto as React.ComponentType<{ modoInicial?: "inspecao" | "registro" }>, {
        modoInicial: "inspecao",
      })
    );

    // 1. Metadados de estrato e diagnóstico aparecem:
    expect(htmlInspecao).toContain(`Estrato: ${ponto.estratoId}`);
    expect(htmlInspecao).toContain(`S tercil ${ponto.criterioSelecao.tercilS}`);

    // 2. O botão de gravar/salvar rótulo NÃO EXISTE no modo de inspeção:
    expect(htmlInspecao).not.toContain("Gravar Rótulo Pericial Humano");
    expect(htmlInspecao).not.toContain("Consolidar Rótulo Humano");

    // 3. O aviso de gravação bloqueada está presente:
    expect(htmlInspecao).toContain("Gravação de Rótulos Bloqueada neste Modo");
  });
});
