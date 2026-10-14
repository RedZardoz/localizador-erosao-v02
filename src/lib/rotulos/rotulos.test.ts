import { describe, it, expect } from "vitest";
import {
  calcularKappaCohen,
  classificarLandisKoch,
  resolverDivergencia,
  validarRotulo,
} from "./concordancia";
import { ingestarSubmissoesKobo } from "./ingestaoKobo";
import { ingestarInterpretacaoVisual } from "./ingestaoInterpretacao";
import { ingestarValidacaoDrone, assegurarSegregacaoTreino } from "./ingestaoDrone";
import { calcularTaxaErroInterpretacao } from "./taxaErro";
import { montarMatrizTreino } from "@/lib/matriz/montagem";
import { PontoAmostral } from "@/types/ponto";
import { Rotulo, RotuloConsolidado } from "@/types/rotulo";

describe("Rotulagem, Concordância e Matriz de Treino (Fase 6 — SAREL)", () => {
  const CLASSES_4 = ["ausente", "incipiente", "moderada", "severa"];

  describe("Concordância Interobservador e Kappa de Cohen (concordancia.ts)", () => {
    it("retorna null para Kappa quando não há pares de observação (Regra 2 & S1-13)", () => {
      const res = calcularKappaCohen([], CLASSES_4);
      expect(res.kappa).toBeNull();
      expect(res.grau).toBe("indefinido");
      expect(res.operacional).toBe(false);
      expect(res.alertaBloqueante).toBeDefined();
    });

    it("retorna null para Kappa quando todas as observações estão na mesma classe (Pe = 1)", () => {
      const pares = [
        { observador1: "ausente", observador2: "ausente" },
        { observador1: "ausente", observador2: "ausente" },
      ];
      const res = calcularKappaCohen(pares, CLASSES_4);
      expect(res.kappa).toBeNull();
      expect(res.grau).toBe("indefinido");
      expect(res.alertaBloqueante).toContain("ausência de variabilidade marginal");
    });

    it("calcula Kappa perfeitamente em concordância total com classes distribuídas", () => {
      const pares = [
        { observador1: "ausente", observador2: "ausente" },
        { observador1: "moderada", observador2: "moderada" },
        { observador1: "severa", observador2: "severa" },
        { observador1: "ausente", observador2: "ausente" },
      ];
      const res = calcularKappaCohen(pares, CLASSES_4);
      expect(res.kappa).toBe(1.0);
      expect(res.grau).toBe("quase-perfeita");
      expect(res.operacional).toBe(true);
      expect(res.intervaloConfianca95).toBeDefined();
      expect(res.intervaloConfianca95?.[0]).toBe(1.0);
      expect(res.intervaloConfianca95?.[1]).toBe(1.0);
    });

    it("calcula intervalo de confiança de 95% e erro padrão em dados com discordância parcial", () => {
      const pares = [
        { observador1: "ausente", observador2: "ausente" },
        { observador1: "ausente", observador2: "ausente" },
        { observador1: "moderada", observador2: "moderada" },
        { observador1: "moderada", observador2: "severa" },
        { observador1: "severa", observador2: "severa" },
        { observador1: "severa", observador2: "severa" },
        { observador1: "ausente", observador2: "moderada" },
        { observador1: "moderada", observador2: "moderada" },
      ];
      const res = calcularKappaCohen(pares, CLASSES_4);
      expect(res.kappa).toBeGreaterThan(0.5);
      expect(res.intervaloConfianca95).toBeDefined();
      const [inf, sup] = res.intervaloConfianca95!;
      expect(inf).toBeLessThanOrEqual(res.kappa!);
      expect(sup).toBeGreaterThanOrEqual(res.kappa!);
      expect(inf).toBeGreaterThanOrEqual(-1.0);
      expect(sup).toBeLessThanOrEqual(1.0);
    });

    it("emite alerta bloqueante quando Kappa é inferior a 0.60", () => {
      const pares = [
        { observador1: "ausente", observador2: "severa" },
        { observador1: "moderada", observador2: "ausente" },
        { observador1: "severa", observador2: "moderada" },
      ];
      const res = calcularKappaCohen(pares, CLASSES_4);
      expect(res.operacional).toBe(false);
      expect(res.alertaBloqueante).toContain("ALERTA BLOQUEANTE");
    });

    it("resolve divergência marcando pendente quando não há consenso", () => {
      const r1: Rotulo = { classe: "ausente", modalidade: "interpretacao-visual", observador: "Obs1", observadoEm: "2026-06-01", cego: true };
      const r2: Rotulo = { classe: "severa", modalidade: "interpretacao-visual", observador: "Obs2", observadoEm: "2026-06-01", cego: true };

      const cons = resolverDivergencia(r1, r2);
      expect(cons.divergencia).toBe("pendente");
      expect(cons.final).toBeNull(); // Não vaza rótulo arbitrário
    });

    it("resolve divergência por terceiro observador de desempate", () => {
      const r1: Rotulo = { classe: "ausente", modalidade: "interpretacao-visual", observador: "Obs1", observadoEm: "2026-06-01", cego: true };
      const r2: Rotulo = { classe: "severa", modalidade: "interpretacao-visual", observador: "Obs2", observadoEm: "2026-06-01", cego: true };
      const r3: Rotulo = { classe: "severa", modalidade: "interpretacao-visual", observador: "Especialista", observadoEm: "2026-06-02", cego: true };

      const cons = resolverDivergencia(r1, r2, r3);
      expect(cons.divergencia).toBe("resolvida-por-terceiro");
      expect(cons.final?.classe).toBe("severa");
    });
  });

  describe("Ingestão KoboToolbox de Campo (ingestaoKobo.ts)", () => {
    it("aceita sem avisos pontos dentro da tolerância nominal P03 (<= 15 m)", () => {
      const registros = [
        {
          codigoPonto: "P01",
          classe: "moderada",
          observador: "Agente1",
          observadoEm: "2026-06-01",
          latitude: -25.0,
          longitude: -53.0,
        },
      ];
      // ~11 m de distância
      const esperadas = {
        P01: { codigo: "P01", latitude: -25.0001, longitude: -53.0 },
      };

      const res = ingestarSubmissoesKobo(registros, esperadas); // defaults: 15m nominal, 25m máxima
      expect(res.aceitos).toHaveLength(1);
      expect(res.aceitos[0].desvioAceitavel).toBe(true);
      expect(res.aceitos[0].distanciaGpsMetros).toBeLessThanOrEqual(15);
      expect(res.avisosQualidade).toHaveLength(0);
    });

    it("aceita com aviso de qualidade pontos entre 15 m e 25 m da coordenada planejada", () => {
      const registros = [
        {
          codigoPonto: "P02",
          classe: "severa",
          observador: "Agente1",
          observadoEm: "2026-06-01",
          latitude: -25.0,
          longitude: -53.0,
        },
      ];
      // ~19 m de distância (-25.00017 vs -25.0)
      const esperadas = {
        P02: { codigo: "P02", latitude: -25.00017, longitude: -53.0 },
      };

      const res = ingestarSubmissoesKobo(registros, esperadas);
      expect(res.aceitos).toHaveLength(1);
      expect(res.aceitos[0].desvioAceitavel).toBe(true);
      expect(res.aceitos[0].distanciaGpsMetros).toBeGreaterThan(15);
      expect(res.aceitos[0].distanciaGpsMetros).toBeLessThanOrEqual(25);
      expect(res.avisosQualidade[0]).toContain("tolerância nominal P03: 15 m; aceito sob tolerância ampliada de até 25 m");
    });

    it("rejeita pontos com desvio > 25 m (desvioAceitavel = false)", () => {
      const registros = [
        {
          codigoPonto: "P03",
          classe: "moderada",
          observador: "Agente1",
          observadoEm: "2026-06-01",
          latitude: -25.0,
          longitude: -53.0,
        },
      ];
      const esperadas = {
        P03: { codigo: "P03", latitude: -25.002, longitude: -53.0 }, // ~222 m de distância
      };

      const res = ingestarSubmissoesKobo(registros, esperadas);
      expect(res.aceitos).toHaveLength(1);
      expect(res.aceitos[0].desvioAceitavel).toBe(false);
      expect(res.avisosQualidade[0]).toContain("excede tolerância máxima P03 de 25 m");
    });

    it("rejeita linhas de template Kobo não editadas em campo (classe vazia ou sentinela — T9, Regra 4)", () => {
      const registros = [
        {
          codigoPonto: "P01",
          classe: "",
          observador: "",
          data_observacao: "",
          latitude: "-25.000000",
          longitude: "-53.000000",
          confianca: "",
          cego: "",
        },
        {
          codigoPonto: "P02",
          classe: "",
          observador: "Equipe_Campo_PPGTCA",
          data_observacao: "2026-09-26",
          latitude: "-25.000000",
          longitude: "-53.000000",
          confianca: "alta",
          cego: true,
        },
        {
          codigoPonto: "P03",
          classe: "PREENCHER_EM_CAMPO",
          observador: "Equipe_Campo_PPGTCA",
          data_observacao: "2026-09-26",
          latitude: "-25.000000",
          longitude: "-53.000000",
          confianca: "alta",
          cego: true,
        },
      ];
      const esperadas = {
        P01: { codigo: "P01", latitude: -25.0, longitude: -53.0 },
        P02: { codigo: "P02", latitude: -25.0, longitude: -53.0 },
        P03: { codigo: "P03", latitude: -25.0, longitude: -53.0 },
      };

      const res = ingestarSubmissoesKobo(registros, esperadas);
      expect(res.aceitos).toHaveLength(0);
      expect(res.rejeitados).toHaveLength(3);
      expect(res.rejeitados[0].motivo).toContain("sem classe de campo preenchida");
      expect(res.rejeitados[1].motivo).toContain("sem classe de campo preenchida");
      expect(res.rejeitados[2].motivo).toContain("inválida ou sentinela não preenchida");
    });
  });

  describe("Ingestão de Validação por Drone (ingestaoDrone.ts)", () => {
    it("segrega estritamente o papel do conjunto como held-out e preenche metadados do Spectral 2 (Nuvem UAV)", () => {
      const entradas = [
        {
          codigoPonto: "P01",
          classe: "severa",
          observador: "Piloto1",
          observadoEm: "2026-06-05",
          resolucaoGsdCm: 4.2,
          ndviMedioDrone: 0.18,
          ndreMedioDrone: 0.12,
          fracaoSoloNuEspectralPct: 82.5,
        },
      ];

      const res = ingestarValidacaoDrone(entradas);
      expect(res.aceitos).toHaveLength(1);
      const item = res.aceitos[0];
      expect(item.papelConjunto).toBe("held-out");
      expect(item.resolucaoGsdCm).toBe(4.2);
      expect(item.ndviMedioDrone).toBe(0.18);
      expect(item.ndreMedioDrone).toBe(0.12);
      expect(item.fracaoSoloNuEspectralPct).toBe(82.5);

      // Metadados do VANT Spectral 2
      expect(item.metadadosSensor?.fabricanteVant).toBe("Nuvem UAV");
      expect(item.metadadosSensor?.modeloVant).toBe("Spectral 2");
      expect(item.metadadosSensor?.tipoSensor).toBe("multiespectral");
      expect(item.metadadosSensor?.georreferenciamento).toBe("ppk-rtk");
      expect(item.metadadosSensor?.calibracaoRadiometrica).toBe(true);
      expect(item.metadadosSensor?.bandas).toEqual(["blue", "green", "red", "rededge", "nir"]);
    });

    it("lança erro se tentar incluir drone no treino", () => {
      expect(() => assegurarSegregacaoTreino("drone")).toThrow(/Observações da modalidade 'drone' são estritamente 'held-out'/);
    });
  });

  describe("Taxa de Erro da Interpretação Visual (taxaErro.ts)", () => {
    it("calcula matriz de confusão e taxas de erro por classe", () => {
      const pares = [
        {
          pontoCodigo: "P01",
          rotuloCampo: { classe: "severa", modalidade: "campo" as const, observador: "C", observadoEm: "2026-06-01", cego: true },
          rotuloInterpretacao: { classe: "severa", modalidade: "interpretacao-visual" as const, observador: "I", observadoEm: "2026-06-01", cego: true },
        },
        {
          pontoCodigo: "P02",
          rotuloCampo: { classe: "severa", modalidade: "campo" as const, observador: "C", observadoEm: "2026-06-01", cego: true },
          rotuloInterpretacao: { classe: "moderada", modalidade: "interpretacao-visual" as const, observador: "I", observadoEm: "2026-06-01", cego: true },
        },
        {
          pontoCodigo: "P03",
          rotuloCampo: { classe: "ausente", modalidade: "campo" as const, observador: "C", observadoEm: "2026-06-01", cego: true },
          rotuloInterpretacao: { classe: "ausente", modalidade: "interpretacao-visual" as const, observador: "I", observadoEm: "2026-06-01", cego: true },
        },
      ];

      const rel = calcularTaxaErroInterpretacao(pares, CLASSES_4);
      expect(rel.totalPontosCruzados).toBe(3);
      expect(rel.taxasPorClasse.severa.taxaErroPct).toBe(50.0);
      expect(rel.taxasPorClasse.ausente.taxaErroPct).toBe(0.0);
      expect(rel.acuraciaGlobalPct).toBeCloseTo(66.67, 1);
    });
  });

  describe("Montagem da Matriz de Treino (montagem.ts)", () => {
    const criarPonto = (id: string, codigo: string, lat: number, lng: number): PontoAmostral => ({
      id,
      codigo,
      latitude: lat,
      longitude: lng,
      origemSintetica: false,
      blocoEspacial: "BLOCO_R01_C01",
      estratoId: "ESTRATO_S1_E1_K1",
      criterioSelecao: {
        tercilS: 1,
        tercilE: 1,
        nivelK: 1,
        phiDiag: null,
        semente: 42,
      },
      localizacao: {
        municipio: { estado: "medido", valor: "Cascavel", fonte: "IBGE", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
        codigoIbge: { estado: "medido", valor: "4104808", fonte: "IBGE", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
        bacia: { estado: "medido", valor: "Paraná 3", fonte: "IAT", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
      },
      terreno: {
        elevacao: { estado: "medido", valor: 550, fonte: "DEM GLO-30", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
        declividadePct: { estado: "medido", valor: 8.5, fonte: "DEM GLO-30", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
        declividadeGraus: { estado: "medido", valor: 4.8, fonte: "DEM GLO-30", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
        curvaturaPerfil: { estado: "medido", valor: 0.01, fonte: "DEM GLO-30", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
        curvaturaPlana: { estado: "medido", valor: -0.01, fonte: "DEM GLO-30", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
        acumuloFluxo: { estado: "medido", valor: 120, fonte: "DEM GLO-30", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
        twi: { estado: "medido", valor: 6.2, fonte: "Calculado", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
      },
      solo: {
        ordem: { estado: "medido", valor: "LATOSSOLO", fonte: "Embrapa", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
        subOrdem: { estado: "medido", valor: "VERMELHO", fonte: "Embrapa", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
        grandeGrupo: { estado: "medido", valor: "Distrófico", fonte: "Embrapa", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
        tipoUnidade: { estado: "medido", valor: "simples", fonte: "Embrapa", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
        confiancaPedologica: "alta",
        erodibilidadeClasse: { estado: "medido", valor: "Média", fonte: "Embrapa", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
      },
      temporal: {
        D: {
          janela: { inicio: "2019-01-01", fim: "2025-12-31" },
          serie: {
            sensores: ["Sentinel-2"],
            nObservacoesValidas: { B4: 120 },
            harmonicos: {},
            estatisticas: {},
            frequenciaSoloNu: { estado: "medido", valor: 0.15, fonte: "S2", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
            maiorSequenciaSoloNu: { estado: "medido", valor: 3, fonte: "S2", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
            mesModalExposicao: { estado: "medido", valor: 8, fonte: "S2", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
            compostoSoloNu: {},
          },
          chuva: {
            precipAcum30d: { estado: "medido", valor: 120, fonte: "CHIRPS", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
            precipAcum90d: { estado: "medido", valor: 350, fonte: "CHIRPS", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
            i30Max: { estado: "medido", valor: 45, fonte: "IMERG", adquiridoEm: "2026-09-10", consultadoEm: "2026-09-10" },
            nEventosErosivos: { estado: "indisponivel", causa: "decisao-pendente", motivo: "Decisão pendente D13" },
            indiceMecanismo: { estado: "indisponivel", causa: "decisao-pendente", motivo: "Decisão pendente D13" },
          },
        },
      },
      rastreio: {
        versaoMotor: "sarel-v2-test",
        cenas: ["S2_SCENE_1"],
        calculadoEm: "2026-09-10",
      },
    });

    it("isola coordenadas geográficas no arquivo de chaves e exclui campos proibidos", () => {
      const p1 = criarPonto("p1", "PR-01", -25.0, -53.0);
      const rotulosConsolidados: Record<string, RotuloConsolidado> = {
        "PR-01": {
          final: { classe: "severa", modalidade: "campo", observador: "Agente1", observadoEm: "2026-06-01", cego: true },
          origens: [],
          kappa: null,
          divergencia: "nenhuma",
          papelConjunto: "treino",
        },
      };

      const res = montarMatrizTreino([p1], rotulosConsolidados, { modeloJanela: "D" });
      expect(res.totalAmostrasTreino).toBe(1);
      expect(res.chavesCoordenadas).toHaveLength(1);
      expect(res.chavesCoordenadas[0].latitude).toBe(-25.0);

      const linha = res.linhas[0];
      // Verifica que coordenadas NÃO estão na linha de features da matriz
      expect("latitude" in linha).toBe(false);
      expect("longitude" in linha).toBe(false);
      expect("phiDiag" in linha).toBe(false);
      expect("estratoId" in linha).toBe(false);
      expect(linha.blocoEspacial).toBe("BLOCO_R01_C01");
      expect(linha.declividadePct).toBe(8.5);
      expect(linha.frequenciaSoloNu).toBe(0.15);
      expect(linha.rotuloClasse).toBe("severa");
    });

    it("segrega pontos da modalidade 'drone' em heldOutDrone", () => {
      const p1 = criarPonto("p1", "PR-01", -25.0, -53.0);
      const rotulosConsolidados: Record<string, RotuloConsolidado> = {
        "PR-01": {
          final: { classe: "moderada", modalidade: "drone", observador: "DronePilot", observadoEm: "2026-06-01", cego: true },
          origens: [],
          kappa: null,
          divergencia: "nenhuma",
          papelConjunto: "held-out",
        },
      };

      const res = montarMatrizTreino([p1], rotulosConsolidados, { modeloJanela: "D" });
      expect(res.totalAmostrasTreino).toBe(0); // NENHUM drone no treino
      expect(res.heldOutDrone).toHaveLength(1);
      expect(res.heldOutDrone[0].rotuloModalidade).toBe("drone");
    });

    it("exclui pontos com divergência pendente", () => {
      const p1 = criarPonto("p1", "PR-01", -25.0, -53.0);
      const rotulosConsolidados: Record<string, RotuloConsolidado> = {
        "PR-01": {
          final: null, // pendente
          origens: [],
          kappa: null,
          divergencia: "pendente",
          papelConjunto: "treino",
        },
      };

      const res = montarMatrizTreino([p1], rotulosConsolidados, { modeloJanela: "D" });
      expect(res.totalAmostrasTreino).toBe(0);
      expect(res.exclusoes).toHaveLength(1);
      expect(res.exclusoes[0].motivo).toContain("Divergência entre observadores");
    });
  });
});
