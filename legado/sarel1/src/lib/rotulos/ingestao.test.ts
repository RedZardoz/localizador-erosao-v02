import { describe, expect, it } from "vitest";
import {
  calcularDistanciaHaversineMetros,
  ingestarSubmissoesKobo,
  normalizarSubmissaoKobo,
} from "./ingestaoKobo";
import { ingestarInterpretacaoVisual } from "./ingestaoInterpretacao";
import {
  assegurarSegregacaoTreino,
  ingestarValidacaoDrone,
} from "./ingestaoDrone";
import { PontoAmostral } from "@/types/ponto";
import { ItemInterpretacaoVisual, SubmissaoDrone, SubmissaoKobo } from "@/types/rotulo";

describe("Ingestão de Rótulos — Kobo, Interpretação e Drone (§11)", () => {
  const pontoReferenciaMock: PontoAmostral = {
    id: "ponto-mock-1",
    codigo: "PR-2026-0001",
    latitude: -25.4284,
    longitude: -49.2733,
    blocoEspacial: "BLOCO_R01_C01",
    estratoId: "E1",
    criterioSelecao: { phiDiag: 0.4 },
    terreno: {} as any,
    solo: {} as any,
    serie: {} as any,
    chuva: {} as any,
  };

  describe("Ingestão Kobo (§11.1)", () => {
    it("calcula distância Haversine com precisão", () => {
      // Ponto idêntico -> 0 metros
      const d0 = calcularDistanciaHaversineMetros(-25.4284, -49.2733, -25.4284, -49.2733);
      expect(d0).toBe(0);

      // Deslocamento de aprox. 100m
      const d100 = calcularDistanciaHaversineMetros(-25.4284, -49.2733, -25.4293, -49.2733);
      expect(d100).toBeGreaterThan(90);
      expect(d100).toBeLessThan(110);
    });

    it("casa formulário Kobo por código e valida distância GPS", () => {
      const submissoes: SubmissaoKobo[] = [
        {
          codigoPonto: "PR-2026-0001",
          latitude: -25.4285, // ~11m de distância
          longitude: -49.2733,
          classe: "moderada",
          observador: "Técnico Silva",
          observadoEm: "2026-05-15",
          cego: true,
          atributosCampo: {
            espessuraHorizonteA_cm: 12,
            exposicaoHorizonteB: true,
          },
        },
      ];

      const res = ingestarSubmissoesKobo(submissoes, [pontoReferenciaMock], 100);

      expect(res.aceitos.length).toBe(1);
      expect(res.rejeitados.length).toBe(0);
      expect(res.aceitos[0].desvioAceitavel).toBe(true);
      expect(res.aceitos[0].distanciaGpsMetros).toBeLessThan(20);
      expect(res.aceitos[0].atributosCampo?.espessuraHorizonteA_cm).toBe(12);
    });

    it("emite aviso espacial se GPS Kobo divergir acima da tolerância", () => {
      const submissoes: SubmissaoKobo[] = [
        {
          codigoPonto: "PR-2026-0001",
          latitude: -25.4350, // ~730m de distância
          longitude: -49.2733,
          classe: "severa",
          observador: "Técnico Silva",
          observadoEm: "2026-05-15",
          cego: true,
        },
      ];

      const res = ingestarSubmissoesKobo(submissoes, [pontoReferenciaMock], 100);

      expect(res.aceitos.length).toBe(1);
      expect(res.aceitos[0].desvioAceitavel).toBe(false);
      expect(res.avisosQualidade.some((a) => a.includes("AVISO ESPACIAL"))).toBe(true);
    });

    it("sinaliza rótulo coletado em modo NÃO-CEGO (cego: false)", () => {
      const submissoes: SubmissaoKobo[] = [
        {
          codigoPonto: "PR-2026-0001",
          classe: "moderada",
          observador: "Técnico Silva",
          observadoEm: "2026-05-15",
          cego: false, // não-cego
        },
      ];

      const res = ingestarSubmissoesKobo(submissoes);
      expect(res.aceitos.length).toBe(1);
      expect(res.avisosQualidade.some((a) => a.includes("NÃO-CEGO"))).toBe(true);
    });

    it("recusa submissões sem observador ou data", () => {
      const submissaoIncompleta = {
        codigo_ponto: "PR-2026-0001",
        classe_erosao: "moderada",
        // sem observador nem data
      };

      const res = ingestarSubmissoesKobo([submissaoIncompleta]);
      expect(res.aceitos.length).toBe(0);
      expect(res.rejeitados.length).toBe(1);
    });
  });

  describe("Ingestão de Interpretação Visual (§11.2)", () => {
    it("processa dois intérpretes independentes e calcula Kappa conjunto", () => {
      const lote: ItemInterpretacaoVisual[] = [
        {
          codigoPonto: "PR-2026-0001",
          classe: "ausente",
          observador: "Especialista 1",
          observadoEm: "2026-05-10",
          cego: true,
        },
        {
          codigoPonto: "PR-2026-0001",
          classe: "ausente",
          observador: "Especialista 2",
          observadoEm: "2026-05-10",
          cego: true,
        },
        {
          codigoPonto: "PR-2026-0002",
          classe: "moderada",
          observador: "Especialista 1",
          observadoEm: "2026-05-10",
          cego: true,
        },
        {
          codigoPonto: "PR-2026-0002",
          classe: "moderada",
          observador: "Especialista 2",
          observadoEm: "2026-05-10",
          cego: true,
        },
      ];

      const res = ingestarInterpretacaoVisual(lote);

      expect(res.pontosProcessados).toBe(2);
      expect(res.consolidados["PR-2026-0001"].divergencia).toBe("nenhuma");
      expect(res.concordancia).toBeDefined();
      expect(res.concordancia?.kappa).toBe(1.0);
    });

    it("registra pendência quando há divergência entre os dois intérpretes", () => {
      const lote: ItemInterpretacaoVisual[] = [
        {
          codigoPonto: "PR-2026-0001",
          classe: "ausente",
          observador: "Especialista 1",
          observadoEm: "2026-05-10",
          cego: true,
        },
        {
          codigoPonto: "PR-2026-0001",
          classe: "severa",
          observador: "Especialista 2",
          observadoEm: "2026-05-10",
          cego: true,
        },
      ];

      const res = ingestarInterpretacaoVisual(lote);

      expect(res.pendenciasDivergencia).toContain("PR-2026-0001");
      expect(res.consolidados["PR-2026-0001"].divergencia).toBe("pendente");
    });
  });

  describe("Ingestão de Drone e Segregação Held-Out (§11.4)", () => {
    it("obriga a marcação estrita como papel held-out na ingestão de drone", () => {
      const droneData: SubmissaoDrone[] = [
        {
          codigoPonto: "PR-2026-0001",
          classe: "severa",
          observador: "Piloto Operador",
          observadoEm: "2026-05-20",
          resolucaoGsdCm: 2.5,
          sensor: "Micasense RedEdge",
          papelConjunto: "held-out",
        },
      ];

      const res = ingestarValidacaoDrone(droneData);

      expect(res.aceitos.length).toBe(1);
      expect(res.aceitos[0].papelConjunto).toBe("held-out");
      expect(res.aceitos[0].rotulo.modalidade).toBe("drone");
    });

    it("assegura que conjunto de drone/held-out JAMAIS entra no treino", () => {
      const pontosTreinoInvalidos = [
        {
          codigo: "PR-2026-0001",
          rotulo: {
            classe: "severa" as const,
            modalidade: "drone" as const,
            observador: "Piloto",
            observadoEm: "2026-05-20",
            cego: true,
          },
        },
      ];

      expect(() => assegurarSegregacaoTreino(pontosTreinoInvalidos)).toThrow(
        /VIOLAÇÃO DE SEGREGAÇÃO METODOLÓGICA/
      );

      const pontosHeldOut = [
        {
          codigo: "PR-2026-0002",
          papelConjunto: "held-out",
        },
      ];

      expect(() => assegurarSegregacaoTreino(pontosHeldOut)).toThrow(
        /VIOLAÇÃO DE SEGREGAÇÃO METODOLÓGICA/
      );
    });
  });
});
