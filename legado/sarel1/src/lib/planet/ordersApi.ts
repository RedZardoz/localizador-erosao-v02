/**
 * ============================================================================
 * Montagem e Submissão de Pedidos (Orders API) — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * ESPECIFICAÇÃO MANDATÓRIA (PLANO V2, §10.2):
 * 1. CLIPPING OBRIGATÓRIO: É expressamente proibido submeter pedidos sem clipping.
 *    Uma cena PSScene completa tem ~300 km²; baixar 1 cena inteira consumiria 10%
 *    da cota mensal inteira. Com clipping de 250m, consome apenas 0,25 km²!
 * 2. HARMONIZAÇÃO RADIOMÉTRICA: Conversão espectral de SuperDove para Sentinel-2,
 *    evitando que diferenças inter-sensores simulem falsos processos erosivos.
 * 3. VALIDAÇÃO DE SALDO: Integração com quota.ts para barrar pedidos que excedam a cota.
 */

import { calcularAreaBufferKm2, validarConsumoPrevisto, registrarConsumoDownload } from "./quota";

export interface PontoGeoRecorte {
  latitude: number;
  longitude: number;
  raioBufferMetros: number; // Recomendado: 250m
}

export interface ItemPedidoPlanet {
  itemId: string;
  itemType: "PSScene";
  productBundle: "analytic_8b_sr_udm2" | "visual";
}

export interface PayloadOrderPlanet {
  name: string;
  products: {
    item_ids: string[];
    item_type: string;
    product_bundle: string;
  }[];
  tools: (
    | { clip: { aoi: { type: "Polygon"; coordinates: number[][][] } } }
    | { harmonize: { target_sensor: "Sentinel-2" } }
  )[];
}

/**
 * Cria polígono delimitador (bounding box aproximado) em torno da coordenada para o clipping.
 */
export function criarPoligonoBufferAoi(lat: number, lng: number, raioMetros: number = 250): number[][][] {
  // 1 grau lat ≈ 111.13 km; 1 grau lng ≈ 100.7 km no Paraná
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
      [minLng, minLat], // Fechamento do anel
    ],
  ];
}

/**
 * Monta e valida o payload da Orders API com clipping e harmonização.
 */
export function montarPedidoPlanetComClipping(
  nomePedido: string,
  itens: ItemPedidoPlanet[],
  recorte: PontoGeoRecorte,
  harmonizarComSentinel2: boolean = true
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

  // 2. Validação prévia contra saldo da cota (lança erro se não couber)
  validarConsumoPrevisto(areaTotalKm2);

  // 3. Montagem do payload oficial da Orders API
  const aoiCoords = criarPoligonoBufferAoi(recorte.latitude, recorte.longitude, recorte.raioBufferMetros);

  const tools: PayloadOrderPlanet["tools"] = [
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
        item_ids: itens.map(it => it.itemId),
        item_type: "PSScene",
        product_bundle: itens[0].productBundle,
      },
    ],
    tools,
  };

  return { payload, areaEstimadaKm2: areaTotalKm2 };
}

/**
 * Simula a confirmação e submissão do pedido, debitando a cota faturada.
 */
export async function submeterPedidoPlanet(
  pedidoPronto: { payload: PayloadOrderPlanet; areaEstimadaKm2: number },
  executadorHttp?: (payload: PayloadOrderPlanet) => Promise<{ orderId: string; status: string }>
): Promise<{ orderId: string; status: string; areaFaturadaKm2: number }> {
  // Se houver executador de rede real
  if (executadorHttp) {
    const res = await executadorHttp(pedidoPronto.payload);
    registrarConsumoDownload(pedidoPronto.areaEstimadaKm2);
    return {
      orderId: res.orderId,
      status: res.status,
      areaFaturadaKm2: pedidoPronto.areaEstimadaKm2,
    };
  }

  // Modo offline / simulação controlada
  registrarConsumoDownload(pedidoPronto.areaEstimadaKm2);
  return {
    orderId: `SIMULATED-ORDER-${Date.now()}`,
    status: "queued",
    areaFaturadaKm2: pedidoPronto.areaEstimadaKm2,
  };
}
