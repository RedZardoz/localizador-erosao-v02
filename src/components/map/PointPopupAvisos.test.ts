import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PointPopup } from "./PointPopup";
import type { PontoAmostral } from "@/types/ponto";

function criarPontoMock(): PontoAmostral {
  const ind = (motivo: string) => ({
    estado: "indisponivel" as const,
    causa: "decisao-pendente" as const,
    motivo,
  });

  return {
    id: "pt-popup-01",
    codigo: "PR-2026-0001",
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
      municipio: ind("Cascavel"),
      codigoIbge: ind("4104808"),
      bacia: ind("Bacia do Paraná 3"),
    },
    terreno: {
      elevacao: ind("Elevacao"),
      declividadePct: ind("Declividade"),
      declividadeGraus: ind("Declividade"),
      curvaturaPerfil: ind("Curvatura"),
      curvaturaPlana: ind("Curvatura"),
      acumuloFluxo: ind("Fluxo"),
      twi: ind("TWI"),
    },
    solo: {
      ordem: ind("Latossolo"),
      subOrdem: ind("Vermelho"),
      grandeGrupo: ind("Distrofico"),
      tipoUnidade: ind("Unidade"),
      confiancaPedologica: "indisponivel",
      erodibilidadeClasse: ind("Media"),
    },
    espectral: {
      bsi: ind("BSI"),
      ndvi: ind("NDVI"),
    },
    temporal: {},
    fundiario: undefined,
    linhaDeBase: undefined,
    classeAmostral: "indefinido",
    rastreio: {
      versaoMotor: "2.0.0",
      cenas: [],
      calculadoEm: "2026-09-26T00:00:00Z",
    },
  };
}

describe("PointPopup (N15 / C24)", () => {
  it("renderiza corretamente a estrutura base do popup de inspeção", () => {
    const ponto = criarPontoMock();
    const html = renderToStaticMarkup(
      React.createElement(PointPopup, { point: ponto, onClose: () => {} })
    );

    expect(html).toContain("PR-2026-0001");
    expect(html).toContain("Estrato: S2-E2-K1");
  });
});
