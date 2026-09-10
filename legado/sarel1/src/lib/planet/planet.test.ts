import { describe, it, expect, beforeEach } from "vitest";
import {
  obterEstadoCota,
  atualizarSaldoCota,
  calcularAreaBufferKm2,
  validarConsumoPrevisto,
  registrarConsumoDownload,
  registrarConsumoTiles,
  ErroCotaPlanetExcedida,
  COTA_PADRAO_ACADEMICA,
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

describe("Integração PlanetScope e Pares de Evento (Fase 5 — SAREL)", () => {
  beforeEach(() => {
    atualizarSaldoCota({
      cotaTotalKm2: 3000.0,
      consumoAtualKm2: 0.0,
      saldoDisponivelKm2: 3000.0,
      tilesConsumidos: 0,
    });
  });

  describe("Controle de Cota e Orçamento (quota.ts)", () => {
    it("calcula área do buffer de 250m como 0.25 km²", () => {
      const area = calcularAreaBufferKm2(250);
      expect(area).toBe(0.25);
    });

    it("permite consumo dentro do saldo da cota acadêmica", () => {
      expect(() => validarConsumoPrevisto(500)).not.toThrow();
      registrarConsumoDownload(500);
      const est = obterEstadoCota();
      expect(est.consumoAtualKm2).toBe(500);
      expect(est.saldoDisponivelKm2).toBe(2500);
    });

    it("BLOQUEIA pedidos que excedam a cota (OVERAGE: OFF)", () => {
      expect(() => validarConsumoPrevisto(3500)).toThrow(ErroCotaPlanetExcedida);
    });

    it("contabiliza tiles de visualização sem descontar da cota de km²", () => {
      registrarConsumoTiles(120);
      const est = obterEstadoCota();
      expect(est.tilesConsumidos).toBe(120);
      expect(est.saldoDisponivelKm2).toBe(3000.0); // Intacto
    });
  });

  describe("Data API e Filtro UDM2 por AOI (dataApi.ts)", () => {
    it("aprova cena com nuvem no mosaico global se a AOI estiver limpa", () => {
      // 100 pixels na AOI: 95 clear, 0 nuvem
      const res = avaliarQualidadeUdm2NaAoi(100, 95, 0, 0);
      expect(res.fracaoLimpaPct).toBe(95);
      expect(res.aprovado).toBe(true);
    });

    it("rejeita cena com nuvem cobrindo a AOI do alvo", () => {
      // 100 pixels na AOI: 50 nuvem
      const res = avaliarQualidadeUdm2NaAoi(100, 50, 0, 40);
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
          fracaoLimpaAoiPct: 40, // Abaixo de 80%
          anguloZenital: 25,
          assetsDisponiveis: ["ortho_analytic_8b_sr", "udm2"],
        },
      ];

      const res = await buscarCenasPlanet(
        { latitude: -25.0, longitude: -53.5, dataInicio: "2026-06-01", dataFim: "2026-06-05" },
        mockApi
      );

      expect(res.status).toBe("sem-cena-limpa");
      expect(res.cenas).toHaveLength(0);
    });
  });

  describe("Orders API com Clipping e Harmonização (ordersApi.ts)", () => {
    it("monta payload com ferramentas de clip e harmonize com Sentinel-2", () => {
      const recorte = { latitude: -25.0669, longitude: -53.688, raioBufferMetros: 250 };
      const itens = [{ itemId: "cena-1", itemType: "PSScene" as const, productBundle: "analytic_8b_sr_udm2" as const }];

      const { payload, areaEstimadaKm2 } = montarPedidoPlanetComClipping("Pedido_PR_01", itens, recorte, true);

      expect(areaEstimadaKm2).toBe(0.25);
      expect(payload.tools).toHaveLength(2);
      expect("clip" in payload.tools[0]).toBe(true);
      expect("harmonize" in payload.tools[1]).toBe(true);
    });

    it("proíbe pedidos sem especificação de clipping para proteção de cota", () => {
      const itens = [{ itemId: "cena-1", itemType: "PSScene" as const, productBundle: "analytic_8b_sr_udm2" as const }];
      expect(() => montarPedidoPlanetComClipping("Sem_Clip", itens, { latitude: -25, longitude: -53, raioBufferMetros: 0 }))
        .toThrow(/REQUISITO DE SEGURANÇA/);
    });
  });

  describe("Pares de Evento e Script de Viabilidade (paresEvento.ts)", () => {
    it("monta trio completo (T-, T0, T+) com geometria comparável", () => {
      const cenasNaAoi: MetadadosCenaPlanet[] = [
        { id: "c_antes", dataAdquisicao: "2026-06-01T13:00:00Z", itemType: "PSScene", sensor: "SuperDove", coberturaNuvemGlobalPct: 10, fracaoLimpaAoiPct: 95, anguloZenital: 22.0, assetsDisponiveis: [] }, // 2 dias antes
        { id: "c_t0", dataAdquisicao: "2026-06-04T13:00:00Z", itemType: "PSScene", sensor: "SuperDove", coberturaNuvemGlobalPct: 15, fracaoLimpaAoiPct: 90, anguloZenital: 22.5, assetsDisponiveis: [] },    // 1 dia depois
        { id: "c_seco", dataAdquisicao: "2026-06-12T13:00:00Z", itemType: "PSScene", sensor: "SuperDove", coberturaNuvemGlobalPct: 5, fracaoLimpaAoiPct: 98, anguloZenital: 23.0, assetsDisponiveis: [] },     // 9 dias depois
      ];

      const trio = montarTrioEvento("2026-06-03", 45.0, 38.0, cenasNaAoi);
      expect(trio).not.toBeNull();
      expect(trio?.cenaTMinus.id).toBe("c_antes");
      expect(trio?.cenaT0?.id).toBe("c_t0");
      expect(trio?.cenaTPlus.id).toBe("c_seco");
      expect(trio?.ehComparavel).toBe(true);
      expect(trio?.diferencaZenitalGraus).toBe(1.0);
    });

    it("avalia a viabilidade orçamentária para a campanha", () => {
      const eventos = [
        { data: "2026-06-03", volumeMm: 45.0, i30: 38.0 },
      ];
      const cenasNaAoi: MetadadosCenaPlanet[] = [
        { id: "c_antes", dataAdquisicao: "2026-06-01T13:00:00Z", itemType: "PSScene", sensor: "SuperDove", coberturaNuvemGlobalPct: 10, fracaoLimpaAoiPct: 95, anguloZenital: 22.0, assetsDisponiveis: [] },
        { id: "c_seco", dataAdquisicao: "2026-06-12T13:00:00Z", itemType: "PSScene", sensor: "SuperDove", coberturaNuvemGlobalPct: 5, fracaoLimpaAoiPct: 98, anguloZenital: 23.0, assetsDisponiveis: [] },
      ];

      // 1 evento x 100 pontos x (0.25 * 2 = 0.50 km²) = 50 km²
      const relatorio = avaliarViabilidadeParesAOI(eventos, cenasNaAoi, 100, 250);
      expect(relatorio.totalParesCompletosEncontrados).toBe(1);
      expect(relatorio.areaTotalRecorteKm2).toBe(50.0);
      expect(relatorio.ehViavel).toBe(true);
      expect(relatorio.consumoCotaMensalPct).toBeCloseTo(2.1, 1);
    });
  });
});
