import { describe, it, expect } from "vitest";
import { montarMatrizTreino } from "./montagem";
import { binarizarOrdinal, ErroRotuloInvalido } from "../rotulos/binarizacao";
import { PontoAmostral } from "@/types/ponto";
import { RotuloConsolidado } from "@/types/rotulo";

function criarPontoTeste(id: string, codigo: string): PontoAmostral {
  return {
    id,
    codigo,
    latitude: -25.1,
    longitude: -53.8,
    origemSintetica: false,
    blocoEspacial: "BLOCO_T01",
    estratoId: "E01",
    criterioSelecao: {
      tercilS: 1,
      tercilE: 1,
      nivelK: 1,
      phiDiag: 0.5,
      semente: 100,
    },
    localizacao: {
      municipio: { estado: "medido", valor: "Cascavel", fonte: "IBGE", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      codigoIbge: { estado: "medido", valor: "4104808", fonte: "IBGE", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      bacia: { estado: "medido", valor: "Paraná 3", fonte: "IAT", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
    },
    terreno: {
      elevacao: { estado: "medido", valor: 650, fonte: "Copernicus GLO-30", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      declividadePct: { estado: "medido", valor: 6.0, fonte: "Copernicus GLO-30", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      declividadeGraus: { estado: "medido", valor: 3.43, fonte: "Copernicus GLO-30", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      curvaturaPerfil: { estado: "medido", valor: 0.0, fonte: "Copernicus GLO-30", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      curvaturaPlana: { estado: "medido", valor: 0.0, fonte: "Copernicus GLO-30", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      acumuloFluxo: { estado: "medido", valor: 80, fonte: "Copernicus GLO-30", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      twi: { estado: "medido", valor: 6.5, fonte: "Copernicus GLO-30", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
    },
    solo: {
      ordem: { estado: "medido", valor: "LATOSSOLO", fonte: "Embrapa", adquiridoEm: "2024-01-01", consultadoEm: "2026-01-01" },
      subOrdem: { estado: "medido", valor: "VERMELHO", fonte: "Embrapa", adquiridoEm: "2024-01-01", consultadoEm: "2026-01-01" },
      grandeGrupo: { estado: "medido", valor: "Eutrofico", fonte: "Embrapa", adquiridoEm: "2024-01-01", consultadoEm: "2026-01-01" },
      tipoUnidade: { estado: "medido", valor: "simples", fonte: "Embrapa", adquiridoEm: "2024-01-01", consultadoEm: "2026-01-01" },
      confiancaPedologica: "alta",
      erodibilidadeClasse: { estado: "medido", valor: "Media", fonte: "Embrapa", adquiridoEm: "2024-01-01", consultadoEm: "2026-01-01" },
    },
    temporal: {},
    rastreio: { versaoMotor: "2.0.0", cenas: [], calculadoEm: "2026-01-01" },
  };
}

describe("C09 — Validação Canônica de Rótulo e Recusa de Substring (A26 / DEC-3)", () => {
  it("binarizarOrdinal recusa 'Sem erosão' e 'indeterminado' lançando ErroRotuloInvalido", () => {
    expect(() => binarizarOrdinal("Sem erosão")).toThrow(ErroRotuloInvalido);
    expect(() => binarizarOrdinal("sem erosao")).toThrow(ErroRotuloInvalido);
    expect(() => binarizarOrdinal("indeterminado")).toThrow(ErroRotuloInvalido);
  });

  it("binarizarOrdinal mapeia corretamente o vocabulário válido (DEC-3) e tolera variações de caixa e acento", () => {
    // ausente -> 0
    expect(binarizarOrdinal("ausente")).toBe(0);
    expect(binarizarOrdinal("  Ausente  ")).toBe(0);
    expect(binarizarOrdinal("AUSENTE")).toBe(0);

    // incipiente, moderada, severa -> 1
    expect(binarizarOrdinal("incipiente")).toBe(1);
    expect(binarizarOrdinal("Incipiente")).toBe(1);
    expect(binarizarOrdinal("moderada")).toBe(1);
    expect(binarizarOrdinal("MODERADA")).toBe(1);
    expect(binarizarOrdinal("severa")).toBe(1);
    expect(binarizarOrdinal("SEVERA")).toBe(1);

    // aliases legados canônicos mapeiam para 1
    expect(binarizarOrdinal("presente")).toBe(1);
    expect(binarizarOrdinal("erosao")).toBe(1);
    expect(binarizarOrdinal("erosão")).toBe(1);
    expect(binarizarOrdinal("Erosão")).toBe(1);
    expect(binarizarOrdinal("1")).toBe(1);
  });

  it("montarMatrizTreino recusa ponto com classe inválida ('Sem erosão') e registra exclusão", () => {
    const p = criarPontoTeste("p1", "PR-T01");
    const rotulos: Record<string, RotuloConsolidado> = {
      "PR-T01": {
        final: {
          classe: "Sem erosão",
          modalidade: "drone",
          observador: "Obs1",
          observadoEm: "2026-03-01",
          cego: true,
        },
        origens: [],
        kappa: null,
        divergencia: "nenhuma",
        papelConjunto: "treino",
      },
    };

    const res = montarMatrizTreino([p], rotulos);
    expect(res.linhas).toHaveLength(0);
    expect(res.exclusoes).toHaveLength(1);
    expect(res.exclusoes[0].codigo).toBe("PR-T01");
  });

  it("montarMatrizTreino recusa ponto com classe inválida ('indeterminado') e registra exclusão", () => {
    const p = criarPontoTeste("p2", "PR-T02");
    const rotulos: Record<string, RotuloConsolidado> = {
      "PR-T02": {
        final: {
          classe: "indeterminado",
          modalidade: "drone",
          observador: "Obs1",
          observadoEm: "2026-03-01",
          cego: true,
        },
        origens: [],
        kappa: null,
        divergencia: "nenhuma",
        papelConjunto: "treino",
      },
    };

    const res = montarMatrizTreino([p], rotulos);
    expect(res.linhas).toHaveLength(0);
    expect(res.exclusoes).toHaveLength(1);
    expect(res.exclusoes[0].codigo).toBe("PR-T02");
  });
});
