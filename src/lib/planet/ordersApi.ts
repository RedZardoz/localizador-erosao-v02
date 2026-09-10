/**
 * ============================================================================
 * Montagem e Submissão de Pedidos (Orders API) — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * ESPECIFICAÇÃO MANDATÓRIA (PLANO V3, §11.1-11.6):
 * 1. CLIPPING OBRIGATÓRIO: Expressamente proibido submeter pedidos sem recorte.
 *    Baixar cena inteira sem buffer faturaria ~300 km² por item, esgotando a cota.
 * 2. HARMONIZAÇÃO RADIOMÉTRICA: Conversão espectral de SuperDove para Sentinel-2.
 * 3. CONTROLE DE COTA: Integração com GerenciadorCotaPlanet para bloquear o que
 *    exceder o saldo e exigir confirmação explícita do usuário.
 */

import { GerenciadorCotaPlanet, calcularAreaBufferKm2 } from "./quota";

export interface PontoGeoRecorte {
  latitude: number;
  longitude: number;
  raioBufferMetros: number; // D18 (ex.: 250m)
}

export interface ItemPedidoPlanet {
  itemId: string;
  itemType: "PSScene";
  productBundle: "analytic_8b_sr_udm2" | "visual";
}

export interface ToolClip {
  clip: {
    aoi: {
      type: "Polygon";
      coordinates: number[][][];
    };
  };
}

export interface ToolHarmonize {
  harmonize: {
    target_sensor: "Sentinel-2";
  };
}

export interface PayloadOrderPlanet {
  name: string;
  products: {
    item_ids: string[];
    item_type: string;
    product_bundle: string;
  }[];
  tools: (ToolClip | ToolHarmonize)[];
}

/**
 * Cria polígono envolvente (bounding box aproximado) em torno da coordenada para o clipping.
 */
export function criarPoligonoBufferAoi(lat: number, lng: number, raioMetros: number): number[][][] {
  if (raioMetros <= 0) {
    throw new Error("Raio do buffer deve ser estritamente positivo.");
  }

  // 1 grau lat ≈ 111.13 km; 1 grau lng no Paraná (~25.5°S) ≈ 100.3 km
  const dLat = (raioMetros / 1000) / 111.13;
  const dLng = (raioMetros / 1000) / (111.13 * Math.cos((lat * Math.PI) / 180));

  const minLat = lat - dLat;
  const maxLat = lat + dLat;
  const minLng = lng - dLng;
  const maxLng = lng + dLng;

  return [
    [
      [minLng, minLat],
      [maxLng, minLat],
      [maxLng, maxLat],
      [minLng, maxLat],
      [minLng, minLat],
    ],
  ];
}

/**
 * Monta e valida o payload da Orders API com clipping e harmonização obrigatórios.
 */
export function montarPedidoPlanetComClipping(
  nomePedido: string,
  itens: ItemPedidoPlanet[],
  recorte: PontoGeoRecorte,
  harmonizarComSentinel2: boolean,
  gerenciadorCota: GerenciadorCotaPlanet
): { payload: PayloadOrderPlanet; areaEstimadaKm2: number } {
  if (itens.length === 0) {
    throw new Error("O pedido Planet deve conter ao menos um item de cena.");
  }
  if (!recorte || recorte.raioBufferMetros <= 0) {
    throw new Error("REQUISITO DE SEGURANÇA: Pedidos Planet sem clipping são proibidos para proteger a cota.");
  }

  // 1. Cálculo da área por item
  const areaUnitariaKm2 = calcularAreaBufferKm2(recorte.raioBufferMetros);
  const areaTotalKm2 = Number((areaUnitariaKm2 * itens.length).toFixed(4));

  // 2. Validação prévia contra saldo da cota (bloqueia se exceder)
  gerenciadorCota.validarConsumoPrevisto(areaTotalKm2);

  // 3. Montagem do payload oficial da Orders API
  const aoiCoords = criarPoligonoBufferAoi(recorte.latitude, recorte.longitude, recorte.raioBufferMetros);

  const tools: (ToolClip | ToolHarmonize)[] = [
    {
      clip: {
        aoi: {
          type: "Polygon",
          coordinates: aoiCoords,
        },
      },
    },
  ];

  if (harmonizarComSentinel2) {
    tools.push({
      harmonize: {
        target_sensor: "Sentinel-2",
      },
    });
  }

  const payload: PayloadOrderPlanet = {
    name: nomePedido,
    products: [
      {
        item_ids: itens.map((it) => it.itemId),
        item_type: "PSScene",
        product_bundle: itens[0].productBundle,
      },
    ],
    tools,
  };

  return { payload, areaEstimadaKm2: areaTotalKm2 };
}

export interface RespostaSubmissaoPlanet {
  orderId: string;
  status: "queued" | "running" | "failed" | "cota-esgotada";
  areaFaturadaKm2: number;
}

/**
 * Submete o pedido pronto após confirmação explícita do usuário.
 */
export async function submeterPedidoPlanet(
  pedidoPronto: { payload: PayloadOrderPlanet; areaEstimadaKm2: number },
  confirmadoPeloUsuario: boolean,
  gerenciadorCota: GerenciadorCotaPlanet,
  executadorHttp?: (payload: PayloadOrderPlanet) => Promise<{ orderId: string; status: string }>
): Promise<RespostaSubmissaoPlanet> {
  if (!confirmadoPeloUsuario) {
    throw new Error("REQUISITO DE SEGURANÇA: Nenhum pedido Planet pode ser enviado sem confirmação expressa do usuário.");
  }

  // Se houver executador de rede real
  if (executadorHttp) {
    const res = await executadorHttp(pedidoPronto.payload);
    gerenciadorCota.registrarConsumoDownload(
      pedidoPronto.areaEstimadaKm2,
      res.orderId,
      `Pedido Planet ${pedidoPronto.payload.name} submetido via Orders API`
    );
    return {
      orderId: res.orderId,
      status: res.status as "queued" | "running",
      areaFaturadaKm2: pedidoPronto.areaEstimadaKm2,
    };
  }

  // Modo offline / simulação controlada
  const idSimulado = `SIMULATED-ORDER-${Date.now()}`;
  gerenciadorCota.registrarConsumoDownload(
    pedidoPronto.areaEstimadaKm2,
    idSimulado,
    `Pedido Planet simulado ${pedidoPronto.payload.name}`
  );

  return {
    orderId: idSimulado,
    status: "queued",
    areaFaturadaKm2: pedidoPronto.areaEstimadaKm2,
  };
}
