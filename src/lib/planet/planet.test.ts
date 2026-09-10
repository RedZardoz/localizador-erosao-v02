import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  GerenciadorCotaPlanet,
  calcularAreaBufferKm2,
  ErroCotaPlanetExcedida,
} from "./quota";
import {
  avaliarQualidadeUdm2NaAoi,
  buscarCenasPlanet,
  MetadadosCenaPlanet,
} from "./dataApi";
import {
  montarPedidoPlanetComClipping,
  submeterPedidoPlanet,
} from "./ordersApi";
import {
  montarTrioEvento,
  avaliarViabilidadeParesAOI,
} from "./paresEvento";
import { obterUrlSceneTile } from "./tiles";
import { buscarCenaSentinel1T0 } from "../gee/sentinel1";

describe("Integração PlanetScope e Pares de Evento (Fase 5 — SAREL)", () => {
  const TEST_LEDGER_PATH = path.join(process.cwd(), "test_ledger_planet.json");

  let gerenciador: GerenciadorCotaPlanet;

  beforeEach(() => {
    if (fs.existsSync(TEST_LEDGER_PATH)) {
      fs.unlinkSync(TEST_LEDGER_PATH);
    }
    gerenciador = new GerenciadorCotaPlanet({
      caminhoArquivoLedger: TEST_LEDGER_PATH,
      cotaInicialKm2: 3000.0,
      tilesInicial: 100000,
      cicloMes: "2026-09",
    });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_LEDGER_PATH)) {
      fs.unlinkSync(TEST_LEDGER_PATH);
    }
  });

  describe("Livro-Razão Persistente e Controle Orçamentário (quota.ts)", () => {
    it("calcula área do buffer de 250m como 0.25 km² (D18)", () => {
      const area = calcularAreaBufferKm2(250);
      expect(area).toBe(0.25);
    });

    it("permite consumo dentro do saldo e persiste livro-razão no disco", () => {
      expect(() => gerenciador.validarConsumoPrevisto(500)).not.toThrow();
      gerenciador.registrarConsumoDownload(500, "PEDIDO-01", "Primeiro lote");
      const est = gerenciador.obterEstado();
      expect(est.consumoAtualKm2).toBe(500);
      expect(est.saldoDisponivelKm2).toBe(2500);

      // Reinício do servidor / nova instância lendo o mesmo arquivo
      const reaberto = new GerenciadorCotaPlanet({
        caminhoArquivoLedger: TEST_LEDGER_PATH,
        cotaInicialKm2: 3000.0,
        tilesInicial: 100000,
        cicloMes: "2026-09",
      });
      expect(reaberto.obterEstado().saldoDisponivelKm2).toBe(2500);
      expect(reaberto.obterEstado().consumoAtualKm2).toBe(500);
    });

    it("BLOQUEIA pedidos que ultrapassem a cota disponível (OVERAGE: OFF)", () => {
      expect(() => gerenciador.validarConsumoPrevisto(3500)).toThrow(ErroCotaPlanetExcedida);
    });

    it("contabiliza consumo de tiles sem descontar km² de downloads", () => {
      gerenciador.registrarConsumoTiles(120, "TILE-01", "Visualização");
      const est = gerenciador.obterEstado();
      expect(est.tilesConsumidos).toBe(120);
      expect(est.saldoDisponivelKm2).toBe(3000.0);
    });
  });

  describe("Data API e Filtro UDM2 por AOI (dataApi.ts)", () => {
    it("aprova cena com nuvem no mosaico global se a AOI estiver limpa", () => {
      // 100 pixels na AOI: 95 clear, 0 nuvem, 0 sombra, limiar 80%
      const res = avaliarQualidadeUdm2NaAoi(100, 95, 0, 0, 80.0);
      expect(res.fracaoLimpaPct).toBe(95);
      expect(res.aprovado).toBe(true);
    });

    it("rejeita cena com nuvem cobrindo a AOI do alvo", () => {
      // 100 pixels na AOI: 50 clear, 40 nuvem -> 10 limpos
      const res = avaliarQualidadeUdm2NaAoi(100, 50, 0, 40, 80.0);
      expect(res.fracaoLimpaPct).toBe(10);
      expect(res.aprovado).toBe(false);
    });

    it("retorna 'sem-cena-limpa' quando nenhuma cena satisfaz a fração mínima", async () => {
      const mockApi = async () => [
        {
          id: "c1",
          dataAdquisicao: "2026-06-02T13:00:00Z",
          itemType: "PSScene" as const,
          sensor: "SuperDove" as const,
          coberturaNuvemGlobalPct: 80,
          fracaoLimpaAoiPct: 40, // Abaixo do limiar de 80%
          anguloZenital: 25,
          assetsDisponiveis: ["ortho_analytic_8b_sr", "udm2"],
        },
      ];

      const res = await buscarCenasPlanet(
        {
          latitude: -25.0,
          longitude: -53.5,
          raioBufferMetros: 250,
          dataInicio: "2026-06-01",
          dataFim: "2026-06-05",
          minFracaoLimpaAoiPct: 80.0,
        },
        "2026-09-10T20:00:00Z",
        mockApi
      );

      expect(res.status).toBe("sem-cena-limpa");
      expect(res.cenas).toHaveLength(0);
    });
  });

  describe("Orders API com Clipping e Confirmação de Segurança (ordersApi.ts)", () => {
    it("monta payload com clip e harmonize com Sentinel-2", () => {
      const recorte = { latitude: -25.0669, longitude: -53.688, raioBufferMetros: 250 };
      const itens = [{ itemId: "cena-1", itemType: "PSScene" as const, productBundle: "analytic_8b_sr_udm2" as const }];

      const { payload, areaEstimadaKm2 } = montarPedidoPlanetComClipping(
        "Pedido_PR_01",
        itens,
        recorte,
        true,
        gerenciador
      );

      expect(areaEstimadaKm2).toBe(0.25);
      expect(payload.tools).toHaveLength(2);
      expect("clip" in payload.tools[0]).toBe(true);
      expect("harmonize" in payload.tools[1]).toBe(true);
    });

    it("proíbe pedidos sem clipping para proteção do orçamento da cota", () => {
      const itens = [{ itemId: "cena-1", itemType: "PSScene" as const, productBundle: "analytic_8b_sr_udm2" as const }];
      expect(() =>
        montarPedidoPlanetComClipping(
          "Sem_Clip",
          itens,
          { latitude: -25, longitude: -53, raioBufferMetros: 0 },
          true,
          gerenciador
        )
      ).toThrow(/REQUISITO DE SEGURANÇA/);
    });

    it("recusa envio do pedido sem confirmação expressa do usuário", async () => {
      const recorte = { latitude: -25.0, longitude: -53.5, raioBufferMetros: 250 };
      const itens = [{ itemId: "c1", itemType: "PSScene" as const, productBundle: "analytic_8b_sr_udm2" as const }];
      const pedido = montarPedidoPlanetComClipping("P1", itens, recorte, true, gerenciador);

      await expect(submeterPedidoPlanet(pedido, false, gerenciador)).rejects.toThrow(/REQUISITO DE SEGURANÇA/);
    });

    it("submete pedido com confirmação e debita saldo no livro-razão", async () => {
      const recorte = { latitude: -25.0, longitude: -53.5, raioBufferMetros: 250 };
      const itens = [{ itemId: "c1", itemType: "PSScene" as const, productBundle: "analytic_8b_sr_udm2" as const }];
      const pedido = montarPedidoPlanetComClipping("P1", itens, recorte, true, gerenciador);

      const res = await submeterPedidoPlanet(pedido, true, gerenciador);
      expect(res.status).toBe("queued");
      expect(gerenciador.obterEstado().saldoDisponivelKm2).toBe(2999.75);
    });
  });

  describe("Pares de Evento e Script de Viabilidade (paresEvento.ts)", () => {
    it("monta trio completo (T-, T0, T+) com geometria comparável", () => {
      const cenasNaAoi: MetadadosCenaPlanet[] = [
        { id: "c_antes", dataAdquisicao: "2026-06-01T13:00:00Z", itemType: "PSScene", sensor: "SuperDove", coberturaNuvemGlobalPct: 10, fracaoLimpaAoiPct: 95, anguloZenital: 22.0, assetsDisponiveis: [] }, // 2 dias antes
        { id: "c_t0", dataAdquisicao: "2026-06-04T13:00:00Z", itemType: "PSScene", sensor: "SuperDove", coberturaNuvemGlobalPct: 15, fracaoLimpaAoiPct: 90, anguloZenital: 22.5, assetsDisponiveis: [] },    // 1 dia depois
        { id: "c_seco", dataAdquisicao: "2026-06-12T13:00:00Z", itemType: "PSScene", sensor: "SuperDove", coberturaNuvemGlobalPct: 5, fracaoLimpaAoiPct: 98, anguloZenital: 23.0, assetsDisponiveis: [] },     // 9 dias depois
      ];

      const trio = montarTrioEvento("2026-06-03", 45.0, 38.0, cenasNaAoi, 80.0);
      expect(trio).not.toBeNull();
      expect(trio?.cenaTMinus.id).toBe("c_antes");
      expect(trio?.cenaT0?.id).toBe("c_t0");
      expect(trio?.cenaTPlus.id).toBe("c_seco");
      expect(trio?.ehComparavel).toBe(true);
      expect(trio?.diferencaZenitalGraus).toBe(1.0);
    });

    it("avalia viabilidade orçamentária para a campanha", () => {
      const eventos = [{ data: "2026-06-03", volumeMm: 45.0, i30: 38.0 }];
      const cenasNaAoi: MetadadosCenaPlanet[] = [
        { id: "c_antes", dataAdquisicao: "2026-06-01T13:00:00Z", itemType: "PSScene", sensor: "SuperDove", coberturaNuvemGlobalPct: 10, fracaoLimpaAoiPct: 95, anguloZenital: 22.0, assetsDisponiveis: [] },
        { id: "c_seco", dataAdquisicao: "2026-06-12T13:00:00Z", itemType: "PSScene", sensor: "SuperDove", coberturaNuvemGlobalPct: 5, fracaoLimpaAoiPct: 98, anguloZenital: 23.0, assetsDisponiveis: [] },
      ];

      // 1 evento x 100 pontos x (0.25 * 2 = 0.50 km²) = 50 km²
      const relatorio = avaliarViabilidadeParesAOI(eventos, cenasNaAoi, {
        numPontosAmostrais: 100,
        raioBufferMetros: 250,
        tetoMensalSeguroKm2: 2400.0,
        minFracaoLimpaAoiPct: 80.0,
      });

      expect(relatorio.totalParesCompletosEncontrados).toBe(1);
      expect(relatorio.areaTotalRecorteKm2).toBe(50.0);
      expect(relatorio.ehViavel).toBe(true);
      expect(relatorio.consumoCotaMensalPct).toBeCloseTo(2.1, 1);
    });
  });

  describe("Visualização e Tiles (tiles.ts) e Sentinel-1 (sentinel1.ts)", () => {
    it("fornece URL de visualização de tiles contabilizando consumo de visualização", () => {
      const tile = obterUrlSceneTile(
        { itemId: "20260605_test", itemType: "PSScene", dataAdquisicaoIso: "2026-06-05T13:00:00Z" },
        gerenciador
      );
      expect(tile.urlTemplate).toContain("tiles.planet.com");
      expect(gerenciador.obterEstado().tilesConsumidos).toBe(1);
      expect(gerenciador.obterEstado().saldoDisponivelKm2).toBe(3000.0);
    });

    it("consulta Sentinel-1 para momento T0 sob cobertura de nuvens", async () => {
      const mockS1 = async () => [
        {
          id: "S1_GRD_20260604",
          dataAdquisicao: "2026-06-04T08:30:00Z",
          polarizacao: ["VV" as const, "VH" as const],
          orbita: "DESCENDING" as const,
          anguloIncidenciaGraus: 38.5,
        },
      ];

      const res = await buscarCenaSentinel1T0(
        { latitude: -25.0, longitude: -53.5, dataInicio: "2026-06-04", dataFim: "2026-06-05" },
        mockS1
      );
      expect(res.encontrado).toBe(true);
      expect(res.cena?.id).toBe("S1_GRD_20260604");
    });
  });
});
