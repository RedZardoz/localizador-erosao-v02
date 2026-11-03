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

describe("A-05 — chaves do desenho vindas do selo D16 e da delineacao de D26", () => {
  function rotuloDrone(): Record<string, RotuloConsolidado> {
    return {
      "PR-C01": {
        final: {
          classe: "erosao",
          modalidade: "drone",
          observador: "Obs1",
          observadoEm: "2026-03-01",
          cego: true,
          fracaoErodida: 0.4,
        },
        origens: [],
        kappa: null,
        divergencia: "nenhuma",
        papelConjunto: "treino",
      },
    };
  }

  const SELO = {
    poligonos: [
      {
        idPoligono: "D16_E_1_1_1_Q01",
        estratoId: "E_1_1_1",
        pi_i: 4 / 7,
        w_i: 7 / 4,
        nCandidatosEstrato: 7,
      },
    ],
  };

  it("popula Pi_i, W_i, N_Candidatos_Estrato e Estrato_ID a partir do selo, nao do ponto", () => {
    const p = criarPontoTeste("pc1", "PR-C01");
    p.poligonoId = "D16_E_1_1_1_Q01";
    p.estratoId = "ESTRATO_DIVERGENTE_NO_PONTO";

    const res = montarMatrizTreino([p], rotuloDrone(), { seloD16: SELO });

    expect(res.linhas).toHaveLength(1);
    const l = res.linhas[0];
    expect(l.pi_i).toBeCloseTo(4 / 7, 10);
    expect(l.w_i).toBeCloseTo(7 / 4, 10);
    expect(l.nCandidatosEstrato).toBe(7);
    // O selo e irreversivel e prevalece sobre o campo editavel do ponto (D23).
    expect(l.estratoId).toBe("E_1_1_1");
    expect(l.pi_i! * l.w_i!).toBeCloseTo(1, 10);
  });

  it("EXCLUI poligono ausente do selo, em vez de inventar pi_i (Regra 1)", () => {
    const p = criarPontoTeste("pc2", "PR-C01");
    p.poligonoId = "D16_POLIGONO_FORA_DO_SELO_Q09";

    const res = montarMatrizTreino([p], rotuloDrone(), { seloD16: SELO });

    expect(res.linhas).toHaveLength(0);
    expect(res.heldOutDrone).toHaveLength(0);
    expect(res.exclusoes).toHaveLength(1);
    expect(res.exclusoes[0].motivo).toContain("não consta do selo D16");
  });

  it("sem selo, as chaves ficam ausentes em vez de preenchidas com zero", () => {
    const p = criarPontoTeste("pc3", "PR-C01");
    p.poligonoId = "D16_E_1_1_1_Q01";

    const res = montarMatrizTreino([p], rotuloDrone());

    expect(res.linhas).toHaveLength(1);
    expect(res.linhas[0].pi_i).toBeNull();
    expect(res.linhas[0].w_i).toBeNull();
    expect(res.linhas[0].nCandidatosEstrato).toBeNull();
  });

  it("popula a delineacao de D26 e carrega Incluida como booleano", () => {
    const p = criarPontoTeste("pc4", "PR-C01");
    p.poligonoId = "D16_E_1_1_1_Q01";
    p.delineacaoD26 = {
      coberturaCelula: 0.97,
      incluida: true,
      areaDelineadaM2: 40,
      pixelId: "px-opaco-xyz",
    };

    const res = montarMatrizTreino([p], rotuloDrone(), { seloD16: SELO });

    const l = res.linhas[0];
    expect(l.incluida).toBe(true);
    expect(l.coberturaCelula).toBeCloseTo(0.97, 10);
    expect(l.areaDelineadaM2).toBe(40);
    expect(l.pixelId).toBe("px-opaco-xyz");
  });

  it("com exigirDelineacaoD26, celula sem correspondencia no CSV de D26 e excluida e contada", () => {
    const comDelineacao = criarPontoTeste("pc5", "PR-C01");
    comDelineacao.poligonoId = "D16_E_1_1_1_Q01";
    comDelineacao.delineacaoD26 = {
      coberturaCelula: 1,
      incluida: true,
      areaDelineadaM2: 10,
      pixelId: "px-1",
    };
    const semDelineacao = criarPontoTeste("pc6", "PR-C01");
    semDelineacao.poligonoId = "D16_E_1_1_1_Q01";

    const res = montarMatrizTreino([comDelineacao, semDelineacao], rotuloDrone(), {
      seloD16: SELO,
      exigirDelineacaoD26: true,
    });

    expect(res.linhas).toHaveLength(1);
    expect(res.exclusoes).toHaveLength(1);
    expect(res.exclusoes[0].motivo).toContain("CSV de delineação de D26");
  });

  it("registra o modelo e a janela, e nao mistura D com P no mesmo artefato", () => {
    const p = criarPontoTeste("pc7", "PR-C01");
    p.poligonoId = "D16_E_1_1_1_Q01";

    const resD = montarMatrizTreino([p], rotuloDrone(), { seloD16: SELO, modeloJanela: "D" });
    expect(resD.linhas[0].modelo).toBe("D");
    expect(new Set(resD.linhas.map((l) => l.modelo)).size).toBe(1);

    // Data de referencia explicita prevalece sobre a data do rotulo.
    const resData = montarMatrizTreino([p], rotuloDrone(), {
      seloD16: SELO,
      dataReferencia: "2026-01-15",
    });
    expect(resData.linhas[0].dataReferencia).toBe("2026-01-15");
  });
});

describe("A-08 / Regra 1 — ponto sem bloco espacial nao entra na matriz", () => {
  function rotuloValido(): Record<string, RotuloConsolidado> {
    return {
      "PR-B01": {
        final: {
          classe: "erosao",
          modalidade: "drone",
          observador: "Obs1",
          observadoEm: "2026-03-01",
          cego: true,
          fracaoErodida: 0.4,
        },
        origens: [],
        kappa: null,
        divergencia: "nenhuma",
        papelConjunto: "treino",
      },
    };
  }

  it("recusa e registra exclusao quando blocoEspacial esta ausente, em vez de usar sentinela", () => {
    const p = criarPontoTeste("pb1", "PR-B01");
    p.poligonoId = "D16_E_1_1_1_Q01";
    // @ts-expect-error: simula ponto cujo bloco espacial nao foi atribuido
    p.blocoEspacial = undefined;

    const res = montarMatrizTreino([p], rotuloValido());

    expect(res.linhas).toHaveLength(0);
    expect(res.exclusoes).toHaveLength(1);
    expect(res.exclusoes[0].codigo).toBe("PR-B01");
    expect(res.exclusoes[0].motivo).toContain("bloco espacial");
  });

  it("recusa blocoEspacial vazio ou so com espacos", () => {
    for (const vazio of ["", "   "]) {
      const p = criarPontoTeste("pb2", "PR-B01");
      p.poligonoId = "D16_E_1_1_1_Q01";
      p.blocoEspacial = vazio;
      const res = montarMatrizTreino([p], rotuloValido());
      expect(res.linhas).toHaveLength(0);
      expect(res.exclusoes).toHaveLength(1);
    }
  });

  it("nenhuma linha da matriz carrega o sentinela BLOCO_INDEFINIDO", () => {
    const p = criarPontoTeste("pb3", "PR-B01");
    p.poligonoId = "D16_E_1_1_1_Q01";
    const res = montarMatrizTreino([p], rotuloValido());
    for (const l of [...res.linhas, ...res.heldOutDrone]) {
      expect(l.blocoEspacial).not.toBe("BLOCO_INDEFINIDO");
      expect(l.blocoEspacial.trim()).not.toBe("");
    }
  });
});

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
