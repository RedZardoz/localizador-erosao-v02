import { describe, it, expect } from "vitest";
import { montarMatrizTreino, LinhaMatrizTreino } from "./montagem";
import { assegurarSegregacaoTreino } from "../rotulos/ingestaoDrone";
import { PontoAmostral } from "@/types/ponto";
import { RotuloConsolidado } from "@/types/rotulo";
import { medido } from "@/types/proveniencia";
import { extrairLinhasPorPerfil } from "@/lib/export/planilha";

const prov = (v: number) => medido(v, "SINTETICO_TESTE_ENCANAMENTO", "2026-01-01");

function criarPontoBase(id: string, codigo: string): PontoAmostral {
  return {
    id,
    codigo,
    latitude: -24.5,
    longitude: -53.5,
    origemSintetica: false,
    poligonoId: `POL_TESTE_${id}`,
    blocoEspacial: "BLOCO_A",
    estratoId: "E01",
    criterioSelecao: {
      tercilS: 1,
      tercilE: 1,
      nivelK: 1,
      phiDiag: 0.5,
      semente: 42,
    },
    localizacao: {
      municipio: { estado: "medido", valor: "Toledo", fonte: "IBGE", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      codigoIbge: { estado: "medido", valor: "4127700", fonte: "IBGE", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      bacia: { estado: "medido", valor: "Paraná 3", fonte: "IAT", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
    },
    terreno: {
      elevacao: { estado: "medido", valor: 450, fonte: "Copernicus GLO-30", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      declividadePct: { estado: "medido", valor: 8.5, fonte: "Copernicus GLO-30", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      declividadeGraus: { estado: "medido", valor: 4.86, fonte: "Copernicus GLO-30", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      curvaturaPerfil: { estado: "medido", valor: 0.01, fonte: "Copernicus GLO-30", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      curvaturaPlana: { estado: "medido", valor: -0.01, fonte: "Copernicus GLO-30", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      acumuloFluxo: { estado: "medido", valor: 120, fonte: "Copernicus GLO-30", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
      twi: { estado: "medido", valor: 7.2, fonte: "Copernicus GLO-30", adquiridoEm: "2023-01-01", consultadoEm: "2026-01-01" },
    },
    solo: {
      ordem: { estado: "medido", valor: "LATOSSOLO", fonte: "Embrapa", adquiridoEm: "2024-01-01", consultadoEm: "2026-01-01" },
      subOrdem: { estado: "medido", valor: "VERMELHO", fonte: "Embrapa", adquiridoEm: "2024-01-01", consultadoEm: "2026-01-01" },
      grandeGrupo: { estado: "medido", valor: "Distrofico", fonte: "Embrapa", adquiridoEm: "2024-01-01", consultadoEm: "2026-01-01" },
      tipoUnidade: { estado: "medido", valor: "simples", fonte: "Embrapa", adquiridoEm: "2024-01-01", consultadoEm: "2026-01-01" },
      confiancaPedologica: "alta",
      erodibilidadeClasse: { estado: "medido", valor: "Baixa", fonte: "Embrapa", adquiridoEm: "2024-01-01", consultadoEm: "2026-01-01" },
    },
    temporal: {},
    rastreio: { versaoMotor: "2.0.0", cenas: [], calculadoEm: "2026-01-01" },
  };
}

describe("N02 — Contrato de Dados D16/D26 (montagemD16.test.ts)", () => {
  it("LinhaMatrizTreino deve possuir campos D16/D26: celulaId, poligonoId, papelConjunto, fracaoErodida, alvoBinario25, rotuloNObservadores", () => {
    const linha: Partial<LinhaMatrizTreino> = {
      pontoId: "p1",
      celulaId: "cel-001",
      poligonoId: "VANT-BLIND-01",
      papelConjunto: "treino",
      estratoId: "E01",
      fracaoErodida: 0.35,
      alvoBinario25: 1,
      rotuloNObservadores: 2,
    };
    expect(linha.celulaId).toBe("cel-001");
    expect(linha.poligonoId).toBe("VANT-BLIND-01");
    expect(linha.papelConjunto).toBe("treino");
    expect(linha.fracaoErodida).toBe(0.35);
    expect(linha.alvoBinario25).toBe(1);
    expect(linha.rotuloNObservadores).toBe(2);
  });

  it("montarMatrizTreino direciona rótulo de drone para 'linhas' (treino) quando papelConjunto === 'treino'", () => {
    const p = criarPontoBase("p1", "PR-2026-0001");
    const rotulos: Record<string, RotuloConsolidado> = {
      "PR-2026-0001": {
        final: {
          classe: "erosao",
          modalidade: "drone",
          observador: "Obs1",
          observadoEm: "2026-02-01",
          cego: true,
          fracaoErodida: 0.4,
          alvoBinarioDerivado: 1,
        },
        origens: [],
        kappa: 0.85,
        divergencia: "nenhuma",
        papelConjunto: "treino",
      },
    };

    const res = montarMatrizTreino([p], rotulos);
    expect(res.linhas.length).toBe(1);
    expect(res.heldOutDrone.length).toBe(0);
    expect(res.linhas[0].papelConjunto).toBe("treino");
    expect(res.linhas[0].alvoBinario25).toBe(1);
  });

  it("montarMatrizTreino direciona rótulo de drone para 'heldOutDrone' quando papelConjunto === 'held-out'", () => {
    const p = criarPontoBase("p2", "PR-2026-0002");
    const rotulos: Record<string, RotuloConsolidado> = {
      "PR-2026-0002": {
        final: {
          classe: "erosao",
          modalidade: "drone",
          observador: "Obs1",
          observadoEm: "2026-02-01",
          cego: true,
          fracaoErodida: 0.1,
          alvoBinarioDerivado: 0,
        },
        origens: [],
        kappa: 0.85,
        divergencia: "nenhuma",
        papelConjunto: "held-out",
      },
    };

    const res = montarMatrizTreino([p], rotulos);
    expect(res.linhas.length).toBe(0);
    expect(res.heldOutDrone.length).toBe(1);
    expect(res.heldOutDrone[0].papelConjunto).toBe("held-out");
  });

  it("montarMatrizTreino registra exclusão se papelConjunto === 'indisponivel'", () => {
    const p = criarPontoBase("p3", "PR-2026-0003");
    const rotulos: Record<string, RotuloConsolidado> = {
      "PR-2026-0003": {
        final: {
          classe: "erosao",
          modalidade: "drone",
          observador: "Obs1",
          observadoEm: "2026-02-01",
          cego: true,
        },
        origens: [],
        kappa: null,
        divergencia: "indisponivel",
        papelConjunto: "indisponivel",
      },
    };

    const res = montarMatrizTreino([p], rotulos);
    expect(res.linhas.length).toBe(0);
    expect(res.heldOutDrone.length).toBe(0);
    expect(res.exclusoes.length).toBeGreaterThan(0);
    expect(res.exclusoes[0].motivo).toContain("papelConjunto");
  });

  it("rótulos de campo (D03) NUNCA vão ao treino do modelo D26", () => {
    const p = criarPontoBase("p4", "PR-2026-0004");
    const rotulos: Record<string, RotuloConsolidado> = {
      "PR-2026-0004": {
        final: {
          classe: "erosao",
          modalidade: "campo",
          observador: "Perito Campo",
          observadoEm: "2026-02-01",
          cego: true,
        },
        origens: [],
        kappa: 1.0,
        divergencia: "nenhuma",
        papelConjunto: "treino",
      },
    };

    const res = montarMatrizTreino([p], rotulos);
    // Modalidade campo não vai ao treino de D26
    expect(res.linhas.length).toBe(0);
  });

  it("assegurarSegregacaoTreino lança se o mesmo poligonoId estiver em treino e held-out", () => {
    expect(() => {
      assegurarSegregacaoTreino("drone", "POLIGONO_01", new Set(["POLIGONO_01"]));
    }).toThrow(/segregação|held-out/i);
  });

  describe("DEFEITO 1 (N02-fix1) — Rótulo de drone sem poligonoId e veda POLIGONO_INDEFINIDO", () => {
    it("(i) rótulo drone sem poligonoId vai para exclusoes com motivo canônico e não para linhas nem heldOutDrone", () => {
      // Dado SINTETICO_TESTE_ENCANAMENTO
      const p = criarPontoBase("p-sintetico-1", "SINTETICO_TESTE_ENCANAMENTO_01");
      delete (p as any).poligonoId;
      const rotulos: Record<string, RotuloConsolidado> = {
        "SINTETICO_TESTE_ENCANAMENTO_01": {
          final: {
            classe: "erosao",
            modalidade: "drone",
            observador: "Obs1",
            observadoEm: "2026-02-01",
            cego: true,
          },
          origens: [],
          kappa: 0.85,
          divergencia: "nenhuma",
          papelConjunto: "treino",
        },
      };

      const res = montarMatrizTreino([p], rotulos);
      expect(res.linhas).toHaveLength(0);
      expect(res.heldOutDrone).toHaveLength(0);
      expect(res.exclusoes).toHaveLength(1);
      expect(res.exclusoes[0].motivo).toBe(
        "Rótulo de drone sem poligonoId (código opaco do sorteio D16)"
      );
    });

    it("(ii) rótulo drone com poligonoId opaco 'OPACO-A' mantém 'OPACO-A'", () => {
      // Dado SINTETICO_TESTE_ENCANAMENTO
      const p = {
        ...criarPontoBase("p-sintetico-2", "SINTETICO_TESTE_ENCANAMENTO_02"),
        poligonoId: "OPACO-A",
      };
      const rotulos: Record<string, RotuloConsolidado> = {
        "SINTETICO_TESTE_ENCANAMENTO_02": {
          final: {
            classe: "erosao",
            modalidade: "drone",
            observador: "Obs1",
            observadoEm: "2026-02-01",
            cego: true,
          },
          origens: [],
          kappa: 0.85,
          divergencia: "nenhuma",
          papelConjunto: "treino",
        },
      };

      const res = montarMatrizTreino([p], rotulos);
      expect(res.linhas).toHaveLength(1);
      expect(res.linhas[0].poligonoId).toBe("OPACO-A");
    });

    it("(iii) assegurarSegregacaoTreino lança violação com poligonoId vazio e com POLIGONO_INDEFINIDO", () => {
      // Dado SINTETICO_TESTE_ENCANAMENTO
      expect(() => {
        assegurarSegregacaoTreino(
          [{ pontoId: "p1", codigo: "SINTETICO_TESTE_ENCANAMENTO_P1", poligonoId: "" } as any],
          []
        );
      }).toThrow(/poligonoId ausente/i);

      expect(() => {
        assegurarSegregacaoTreino(
          [{ pontoId: "p2", codigo: "SINTETICO_TESTE_ENCANAMENTO_P2", poligonoId: "   " } as any],
          []
        );
      }).toThrow(/poligonoId ausente/i);

      expect(() => {
        assegurarSegregacaoTreino(
          [{ pontoId: "p3", codigo: "SINTETICO_TESTE_ENCANAMENTO_P3", poligonoId: "POLIGONO_INDEFINIDO" } as any],
          []
        );
      }).toThrow(/poligonoId ausente/i);

      expect(() => {
        assegurarSegregacaoTreino(
          [],
          [{ pontoId: "p4", codigo: "SINTETICO_TESTE_ENCANAMENTO_P4", poligonoId: "POLIGONO_INDEFINIDO" } as any]
        );
      }).toThrow(/poligonoId ausente/i);
    });

    it("(iv) assegurarSegregacaoTreino lança com o mesmo id de polígono nos dois conjuntos (treino e held-out)", () => {
      // Dado SINTETICO_TESTE_ENCANAMENTO
      expect(() => {
        assegurarSegregacaoTreino(
          [{ pontoId: "p1", codigo: "SINTETICO_TESTE_ENCANAMENTO_T1", poligonoId: "POL_COMPARTILHADO" } as any],
          [{ pontoId: "p2", codigo: "SINTETICO_TESTE_ENCANAMENTO_H1", poligonoId: "POL_COMPARTILHADO" } as any]
        );
      }).toThrow(/VIOLAÇÃO DE SEGREGAÇÃO \(D16\): O polígono 'POL_COMPARTILHADO' está presente simultaneamente nos conjuntos de treino e held-out/);
    });
  });

  describe("DEFEITO 2 (N02-fix2) — Desvincula compostos de solo nu das bandas de data única", () => {
    it("(i) ponto com espectral.b12=0.2 e SEM composto resulta em compostoSoloNuB12 === null", () => {
      // Dado SINTETICO_TESTE_ENCANAMENTO
      const p: PontoAmostral = {
        ...criarPontoBase("p-sintetico-b12", "SINTETICO_TESTE_ENCANAMENTO_B12"),
        poligonoId: "POL_TESTE_B12",
        espectral: {
          b2: prov(0.1),
          b4: prov(0.15),
          b8: prov(0.35),
          b12: prov(0.2),
        } as any,
        temporal: {}, // SEM composto de solo nu
      };
      const rotulos: Record<string, RotuloConsolidado> = {
        "SINTETICO_TESTE_ENCANAMENTO_B12": {
          final: { classe: "erosao", modalidade: "drone", observador: "Obs", observadoEm: "2026-02-01", cego: true },
          origens: [],
          kappa: 0.9,
          divergencia: "nenhuma",
          papelConjunto: "treino",
        },
      };

      const res = montarMatrizTreino([p], rotulos);
      expect(res.linhas).toHaveLength(1);
      expect(res.linhas[0].compostoSoloNuB12).toBeNull();
    });

    it("(ii) ponto com espectral.b4 e b2 e SEM composto resulta em compostoSoloNuRazaoB4B2 === null", () => {
      // Dado SINTETICO_TESTE_ENCANAMENTO
      const p: PontoAmostral = {
        ...criarPontoBase("p-sintetico-razao", "SINTETICO_TESTE_ENCANAMENTO_RAZAO"),
        poligonoId: "POL_TESTE_RAZAO",
        espectral: {
          b2: prov(0.1),
          b4: prov(0.2),
          b8: prov(0.4),
          b12: prov(0.25),
        } as any,
        temporal: {}, // SEM composto
      };
      const rotulos: Record<string, RotuloConsolidado> = {
        "SINTETICO_TESTE_ENCANAMENTO_RAZAO": {
          final: { classe: "erosao", modalidade: "drone", observador: "Obs", observadoEm: "2026-02-01", cego: true },
          origens: [],
          kappa: 0.9,
          divergencia: "nenhuma",
          papelConjunto: "treino",
        },
      };

      const res = montarMatrizTreino([p], rotulos);
      expect(res.linhas).toHaveLength(1);
      expect(res.linhas[0].compostoSoloNuRazaoB4B2).toBeNull();
    });

    it("(iii) com composto presente, assume os valores do composto da série e não de espectral", () => {
      // Dado SINTETICO_TESTE_ENCANAMENTO
      const p: PontoAmostral = {
        ...criarPontoBase("p-sintetico-comp", "SINTETICO_TESTE_ENCANAMENTO_COMP"),
        poligonoId: "POL_TESTE_COMP",
        espectral: {
          b2: prov(0.05),
          b4: prov(0.1),
          b8: prov(0.2),
          b12: prov(0.15),
        } as any,
        temporal: {
          D: {
            serie: {
              compostoSoloNuB12: prov(0.28),
              compostoSoloNu: {
                B2: prov(0.08),
                B4: prov(0.16),
                B12: prov(0.28),
              },
              compostoSoloNuRazaoB4B2: prov(2.0),
            } as any,
          } as any,
        },
      };
      const rotulos: Record<string, RotuloConsolidado> = {
        "SINTETICO_TESTE_ENCANAMENTO_COMP": {
          final: { classe: "erosao", modalidade: "drone", observador: "Obs", observadoEm: "2026-02-01", cego: true },
          origens: [],
          kappa: 0.9,
          divergencia: "nenhuma",
          papelConjunto: "treino",
        },
      };

      const res = montarMatrizTreino([p], rotulos, { modeloJanela: "D" });
      expect(res.linhas).toHaveLength(1);
      expect(res.linhas[0].compostoSoloNuB12).toBe(0.28);
      expect(res.linhas[0].compostoSoloNuRazaoB4B2).toBe(2.0);
    });

    it("(iv) Banda_B12 continua igual a espectral.b12 de data única", () => {
      // Dado SINTETICO_TESTE_ENCANAMENTO
      const p: PontoAmostral = {
        ...criarPontoBase("p-sintetico-b12-unica", "SINTETICO_TESTE_ENCANAMENTO_B12_UNICA"),
        poligonoId: "POL_TESTE_B12_UNICA",
        espectral: {
          b2: prov(0.12),
          b4: prov(0.18),
          b8: prov(0.44),
          b12: prov(0.23),
        } as any,
        temporal: {},
      };
      const rotulos: Record<string, RotuloConsolidado> = {
        "SINTETICO_TESTE_ENCANAMENTO_B12_UNICA": {
          final: { classe: "erosao", modalidade: "drone", observador: "Obs", observadoEm: "2026-02-01", cego: true },
          origens: [],
          kappa: 0.9,
          divergencia: "nenhuma",
          papelConjunto: "treino",
        },
      };

      const res = montarMatrizTreino([p], rotulos);
      expect(res.linhas).toHaveLength(1);
      expect(res.linhas[0].bandaB12).toBe(0.23);
      expect(res.linhas[0].compostoSoloNuB12).toBeNull();
    });
  });

  describe("DEFEITO 3 (N02-fix3) — Identificadores Padrão Silenciosos", () => {
    it("(i) ponto sem celulaId resulta em celulaId === null e Celula_ID vazio na exportação", () => {
      // Dado SINTETICO_TESTE_ENCANAMENTO
      const p: PontoAmostral = {
        ...criarPontoBase("p-sintetico-sem-celula", "SINTETICO_TESTE_ENCANAMENTO_SEM_CEL"),
        poligonoId: "POL_TESTE_CEL",
      };
      delete (p as any).celulaId;
      const rotulos: Record<string, RotuloConsolidado> = {
        "SINTETICO_TESTE_ENCANAMENTO_SEM_CEL": {
          final: { classe: "erosao", modalidade: "drone", observador: "Obs", observadoEm: "2026-02-01", cego: true },
          origens: [],
          kappa: 0.9,
          divergencia: "nenhuma",
          papelConjunto: "treino",
        },
      };

      const res = montarMatrizTreino([p], rotulos);
      expect(res.linhas).toHaveLength(1);
      expect(res.linhas[0].celulaId).toBeNull();

      const linhasExport = extrairLinhasPorPerfil([p], "matriz-treino", rotulos);
      expect(linhasExport).toHaveLength(1);
      expect(linhasExport[0].Celula_ID).toBe("");
    });

    it("(ii) ponto sem estratoId resulta em estratoId === null", () => {
      // Dado SINTETICO_TESTE_ENCANAMENTO
      const p: PontoAmostral = {
        ...criarPontoBase("p-sintetico-sem-estrato", "SINTETICO_TESTE_ENCANAMENTO_SEM_EST"),
        poligonoId: "POL_TESTE_EST",
      };
      delete (p as any).estratoId;
      const rotulos: Record<string, RotuloConsolidado> = {
        "SINTETICO_TESTE_ENCANAMENTO_SEM_EST": {
          final: { classe: "erosao", modalidade: "drone", observador: "Obs", observadoEm: "2026-02-01", cego: true },
          origens: [],
          kappa: 0.9,
          divergencia: "nenhuma",
          papelConjunto: "treino",
        },
      };

      const res = montarMatrizTreino([p], rotulos);
      expect(res.linhas).toHaveLength(1);
      expect(res.linhas[0].estratoId).toBeNull();
    });

    it("(iii) ponto com celulaId e estratoId presentes mantém ambos inalterados", () => {
      // Dado SINTETICO_TESTE_ENCANAMENTO
      const p: PontoAmostral = {
        ...criarPontoBase("p-sintetico-ambos", "SINTETICO_TESTE_ENCANAMENTO_AMBOS"),
        celulaId: "CEL-OPACA-99",
        estratoId: "E05",
        poligonoId: "POL_TESTE_AMBOS",
      };
      const rotulos: Record<string, RotuloConsolidado> = {
        "SINTETICO_TESTE_ENCANAMENTO_AMBOS": {
          final: { classe: "erosao", modalidade: "drone", observador: "Obs", observadoEm: "2026-02-01", cego: true },
          origens: [],
          kappa: 0.9,
          divergencia: "nenhuma",
          papelConjunto: "treino",
        },
      };

      const res = montarMatrizTreino([p], rotulos);
      expect(res.linhas).toHaveLength(1);
      expect(res.linhas[0].celulaId).toBe("CEL-OPACA-99");
      expect(res.linhas[0].estratoId).toBe("E05");

      const linhasExport = extrairLinhasPorPerfil([p], "matriz-treino", rotulos);
      expect(linhasExport).toHaveLength(1);
      expect(linhasExport[0].Celula_ID).toBe("CEL-OPACA-99");
    });
  });
});
