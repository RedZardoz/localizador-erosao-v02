import { describe, it, expect } from "vitest";
import { consolidarInspecaoPonto } from "./consolidacaoInspecao";
import type { PontoAmostral } from "@/types/ponto";

function criarPontoBase(): PontoAmostral {
  const indisponivel = (motivo: string) => ({
    estado: "indisponivel" as const,
    causa: "decisao-pendente" as const,
    motivo,
  });

  return {
    id: "ponto-teste-c24",
    codigo: "PT-TEST-001",
    latitude: -25.25,
    longitude: -53.85,
    origemSintetica: false,
    blocoEspacial: "BLOCO_01",
    estratoId: "S1-E1-K1",
    criterioSelecao: {
      tercilS: 1,
      tercilE: 1,
      nivelK: 1,
      phiDiag: null,
      semente: 42,
    },
    localizacao: {
      municipio: { estado: "medido", valor: "Toledo", fonte: "IBGE", adquiridoEm: "2024-01-01", consultadoEm: "2026-10-17" },
      codigoIbge: { estado: "medido", valor: "4127700", fonte: "IBGE", adquiridoEm: "2024-01-01", consultadoEm: "2026-10-17" },
      bacia: { estado: "medido", valor: "Paraná 3", fonte: "ANA", adquiridoEm: "2024-01-01", consultadoEm: "2026-10-17" },
    },
    terreno: {
      elevacao: indisponivel("Pendente"),
      declividadePct: indisponivel("Pendente"),
      declividadeGraus: indisponivel("Pendente"),
      curvaturaPerfil: indisponivel("Pendente"),
      curvaturaPlana: indisponivel("Pendente"),
      acumuloFluxo: indisponivel("Pendente"),
      twi: indisponivel("Pendente"),
    },
    solo: {
      ordem: indisponivel("Pendente"),
      subOrdem: indisponivel("Pendente"),
      grandeGrupo: indisponivel("Pendente"),
      tipoUnidade: indisponivel("Pendente"),
      confiancaPedologica: "indisponivel",
      erodibilidadeClasse: indisponivel("Pendente"),
    },
    temporal: {
      D: {
        janela: { inicio: "2021-01-01", fim: "2026-01-01" },
        serie: {
          sensores: ["COPERNICUS/S2_SR_HARMONIZED"],
          nObservacoesValidas: {},
          harmonicos: {},
          estatisticas: {},
          frequenciaSoloNu: indisponivel("Pendente"),
          maiorSequenciaSoloNu: indisponivel("Pendente"),
          mesModalExposicao: indisponivel("Pendente"),
          compostoSoloNu: {},
        },
        chuva: {
          precipAcum30d: indisponivel("Pendente"),
          precipAcum90d: indisponivel("Pendente"),
          i30Max: indisponivel("Pendente"),
          nEventosErosivos: indisponivel("Pendente"),
          indiceMecanismo: indisponivel("Pendente"),
        },
      },
    },
    fundiario: {
      status: "sem-correspondencia",
      motivo: "Consulta prévia",
      consultadoEm: "2026-10-10",
      criterioAssociacao: "ponto-em-poligono",
      codigoCar: "PR-CAR-ANTERIOR-123",
      titularMascarado: "***",
      documentoMascarado: "***",
      registroIncra: null,
      areaImovelHa: 50.0,
      bases: { uf: "PR", sicar: "v2024" },
    },
    rastreio: {
      versaoMotor: "2.0.0",
      cenas: ["COPERNICUS/S2_SR_HARMONIZED"],
      calculadoEm: "2026-10-17T00:00:00.000Z",
    },
  };
}

describe("C24 — Consolidação da inspeção pontual registrando falhas sem engoli-las", () => {
  it("falha injetada na consulta fundiária -> avisos não vazio e estado erro-na-consulta sem apagar dados anteriores", () => {
    const pontoOriginal = criarPontoBase();
    const erroFundiario = new Error("Serviço SICAR indisponível (HTTP 504 Gateway Timeout)");

    const resultado = consolidarInspecaoPonto({
      point: pontoOriginal,
      fundiario: { erro: erroFundiario },
      dataConsultaAtual: "2026-10-17",
    });

    expect(resultado.avisos.length).toBeGreaterThan(0);
    expect(resultado.avisos.some((a) => a.includes("fundiária"))).toBe(true);

    // O status deve ser erro-na-consulta
    expect(resultado.ponto.fundiario?.status).toBe("erro-na-consulta");
    expect(resultado.ponto.fundiario?.motivo).toContain("HTTP 504 Gateway Timeout");

    // O contexto anterior NÃO deve ser apagado
    expect(resultado.ponto.fundiario?.codigoCar).toBe("PR-CAR-ANTERIOR-123");
    expect(resultado.ponto.fundiario?.areaImovelHa).toBe(50.0);
    expect(resultado.ponto.fundiario?.bases?.sicar).toBe("v2024");
  });

  it("falha injetada no Embrapa -> avisos não vazio e campos de solo com causa servico-indisponivel", () => {
    const pontoOriginal = criarPontoBase();
    const erroEmbrapa = new Error("GeoServer Embrapa indisponível (WFS 503)");

    const resultado = consolidarInspecaoPonto({
      point: pontoOriginal,
      solo: { erro: erroEmbrapa },
      dataConsultaAtual: "2026-10-17",
    });

    expect(resultado.avisos.length).toBeGreaterThan(0);
    expect(resultado.avisos.some((a) => a.includes("Embrapa"))).toBe(true);

    expect(resultado.ponto.solo.confiancaPedologica).toBe("indisponivel");

    const camposSolo = [
      resultado.ponto.solo.subOrdem,
      resultado.ponto.solo.grandeGrupo,
      resultado.ponto.solo.tipoUnidade,
      resultado.ponto.solo.erodibilidadeClasse,
    ];

    for (const c of camposSolo) {
      expect(c.estado).toBe("indisponivel");
      if (c.estado === "indisponivel") {
        expect(c.causa).toBe("servico-indisponivel");
        expect(c.motivo).toContain("WFS 503");
      }
    }
  });

  it("sucesso em todas as consultas -> avisos vazio e dados consolidados com êxito", () => {
    const pontoOriginal = criarPontoBase();

    const resultado = consolidarInspecaoPonto({
      point: pontoOriginal,
      solo: {
        dados: {
          solo: {
            tipoUnidade: "simples",
            confianca: "alta",
            componentes: [
              {
                ordem: "LATOSSOLO",
                subOrdem: "VERMELHO",
                grandeGrupo: "Distroférrico",
              },
            ],
          },
          erodibilidade: {
            classe: "Média",
          },
        },
      },
      fundiario: {
        dados: {
          status: "encontrado",
          carCode: "PR-4127700-NOVO-456",
          areaImovelHa: 85.5,
          nomeProprietario: "Fazenda Modelo",
          municipio: "Toledo",
        },
      },
      dataConsultaAtual: "2026-10-17",
    });

    expect(resultado.avisos).toEqual([]);
    expect(resultado.ponto.fundiario?.status).toBe("encontrado");
    expect(resultado.ponto.fundiario?.codigoCar).toBe("PR-4127700-NOVO-456");
    expect(resultado.ponto.solo.confiancaPedologica).toBe("alta");
    expect(resultado.ponto.solo.subOrdem.estado).toBe("medido");
  });
});
