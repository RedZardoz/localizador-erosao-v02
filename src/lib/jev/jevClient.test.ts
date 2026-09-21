import { describe, it, expect, vi, beforeEach } from "vitest";
import { executarAuditoriaJev } from "./jevClient";
import { executarAuditoriaLocal } from "./fallbackLocal";
import type { PontoAmostral } from "@/types/ponto";
import type { Proveniencia } from "@/types/proveniencia";

function medido<T>(valor: T): Proveniencia<T> {
  return {
    estado: "medido",
    valor,
    fonte: "Sensor/MDE Teste",
    adquiridoEm: "2023-01-01",
    consultadoEm: "2026-09-21",
  };
}

function criarPontoMock(parciais?: Partial<PontoAmostral>): PontoAmostral {
  return {
    id: "ponto-teste-1",
    codigo: "PR-2026-0001",
    latitude: -25.2985,
    longitude: -54.0208,
    origemSintetica: false,
    blocoEspacial: "bloco-01",
    estratoId: "E01",
    criterioSelecao: {
      tercilS: 2,
      tercilE: 1,
      nivelK: 1,
      phiDiag: 0.5,
      semente: 42,
    },
    localizacao: {
      municipio: medido("Medianeira"),
      codigoIbge: medido("4115804"),
      bacia: medido("Paraná 3"),
    },
    terreno: {
      elevacao: medido(310),
      declividadePct: medido(14.5),
      declividadeGraus: medido(8.2),
      curvaturaPerfil: medido(0.1),
      curvaturaPlana: medido(0.05),
      acumuloFluxo: medido(120),
      twi: medido(6.8),
    },
    solo: {
      ordem: medido("Latossolo Vermelho"),
      subOrdem: medido("Eutrófico"),
      grandeGrupo: { estado: "indisponivel", causa: "fora-do-dominio", motivo: "Não mapeado" },
      tipoUnidade: medido("simples"),
      confiancaPedologica: "alta",
      erodibilidadeClasse: { estado: "tabelado", valor: "Média", tabela: "Embrapa", chave: "LV" },
    },
    espectral: {
      ndvi: medido(0.28),
      bsi: medido(0.18),
      b2: medido(0.05),
      b4: medido(0.12),
      b8: medido(0.21),
      b12: medido(0.29),
    },
    temporal: {},
    rastreio: {
      versaoMotor: "2.0.0",
      cenas: ["S2_2023"],
      calculadoEm: "2026-09-21T00:00:00Z",
    },
    ...parciais,
  };
}

describe("Arquitetura Dual-Engine: Jev (System One) & Fallback Local RUSLE", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Motor Local Determinístico (RUSLE / Embrapa)", () => {
    it("deve atribuir suscetibilidade Alta para solo exposto em declive de 14.5%", () => {
      const ponto = criarPontoMock();
      const laudo = executarAuditoriaLocal(ponto, "Auditoria de teste local.");

      expect(laudo.metodo).toBe("MOTOR_LOCAL_RUSLE");
      expect(laudo.consistenciaFisica.valido).toBe(true);
      expect(laudo.scoreSuscetibilidade.grau).toBe(3); // >12% e solo exposto -> Alta
      expect(laudo.scoreSuscetibilidade.rotulo).toBe("Alta");
      expect(laudo.coberturaManejo.classe).toContain("Solo Exposto");
    });

    it("deve atribuir suscetibilidade Nula/Baixa para área com alta cobertura vegetal", () => {
      const ponto = criarPontoMock({
        terreno: {
          elevacao: medido(310),
          declividadePct: medido(4.0),
          declividadeGraus: medido(2.3),
          curvaturaPerfil: medido(0.0),
          curvaturaPlana: medido(0.0),
          acumuloFluxo: medido(50),
          twi: medido(5.0),
        },
        espectral: {
          ndvi: medido(0.75),
          bsi: medido(-0.15),
        },
      });

      const laudo = executarAuditoriaLocal(ponto, "Auditoria cobertura densa.");
      expect(laudo.scoreSuscetibilidade.grau).toBe(0);
      expect(laudo.scoreSuscetibilidade.rotulo).toBe("Nula");
      expect(laudo.coberturaManejo.classe).toContain("Plantio Direto");
    });

    it("deve detectar anomalia de física em declividade negativa", () => {
      const ponto = criarPontoMock({
        terreno: {
          elevacao: medido(310),
          declividadePct: medido(-5.0),
          declividadeGraus: medido(0),
          curvaturaPerfil: medido(0),
          curvaturaPlana: medido(0),
          acumuloFluxo: medido(0),
          twi: medido(0),
        },
      });

      const laudo = executarAuditoriaLocal(ponto, "Verificando anomalia.");
      expect(laudo.consistenciaFisica.valido).toBe(false);
      expect(laudo.consistenciaFisica.observacao).toContain("Declividade negativa");
    });
  });

  describe("Cliente Jev com Degradação Graciosa", () => {
    it("deve comutar para motor local quando a chave não for fornecida", async () => {
      const ponto = criarPontoMock();
      const laudo = await executarAuditoriaJev(ponto, "");

      expect(laudo.metodo).toBe("MOTOR_LOCAL_RUSLE");
      expect(laudo.detalhes.motivoFallback).toContain("Chave do Jev não configurada");
    });

    it("deve adotar resposta do Jev quando a API responder com sucesso", async () => {
      const ponto = criarPontoMock();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          answers: {
            consistencia_fisica: {
              result: true,
              confidence: 0.96,
              reasoning: "Assinatura espectral e declividade condizentes.",
            },
            suscetibilidade_erosao: {
              score: 3,
              confidence: 0.92,
            },
            manejo_cobertura: {
              choice: "Solo Exposto Degradado",
              confidence: 0.94,
            },
          },
        }),
      });
      global.fetch = mockFetch as any;

      const laudo = await executarAuditoriaJev(ponto, "ts_chave_valida_teste_12345");

      expect(laudo.metodo).toBe("JEV_SYSTEM_ONE");
      expect(laudo.consistenciaFisica.valido).toBe(true);
      expect(laudo.consistenciaFisica.confianca).toBe(0.96);
      expect(laudo.scoreSuscetibilidade.grau).toBe(3);
      expect(laudo.scoreSuscetibilidade.rotulo).toBe("Alta");
      expect(laudo.coberturaManejo.classe).toBe("Solo Exposto Degradado");
    });

    it("deve degradar para motor local em caso de falha de rede ou timeout", async () => {
      const ponto = criarPontoMock();

      const mockFetch = vi.fn().mockRejectedValue(new Error("Falha na conexão TCP"));
      global.fetch = mockFetch as any;

      const laudo = await executarAuditoriaJev(ponto, "ts_chave_valida_teste_12345");

      expect(laudo.metodo).toBe("MOTOR_LOCAL_RUSLE");
      expect(laudo.detalhes.motivoFallback).toContain("Falha de rede");
    });
  });
});
