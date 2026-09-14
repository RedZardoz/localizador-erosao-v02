/**
 * ============================================================================
 * Camadas de Visualização e Tiles PlanetScope — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * ESPECIFICAÇÃO (PLANO V3, §11.5):
 * - Scene Tiles e Basemap Tiles para interpretação visual na Fase A.
 * - Não consomem cota de km² (downloads), preservando o orçamento para medição.
 * - Registra consumo de tiles e expõe a data de aquisição da cena.
 */

import { GerenciadorCotaPlanet } from "./quota";

export interface OpcoesTilePlanet {
  itemId: string;
  itemType: "PSScene";
  dataAdquisicaoIso: string;
  apiKey?: string;
}

export interface ResultadoTilePlanet {
  urlTemplate: string;
  dataAdquisicaoIso: string;
  avisoCota: string;
}

/**
 * Monta o endpoint de tiles para exibição no MapLibre/Leaflet.
 * Exemplo de URL oficial:
 * https://tiles.planet.com/data/v1/item-types/{item_type}/items/{item_id}/thumb
 * ou tileset XYZ autenticado com chave efêmera.
 */
export function obterUrlSceneTile(
  opcoes: OpcoesTilePlanet,
  gerenciadorCota: GerenciadorCotaPlanet
): ResultadoTilePlanet {
  if (!opcoes.itemId || !opcoes.itemType) {
    throw new Error("ItemId e ItemType são obrigatórios para montar a camada de tiles.");
  }

  // Registra consumo de 1 requisição de visualização
  gerenciadorCota.registrarConsumoTiles(1, `TILE-${opcoes.itemId}`, `Visualização de tile da cena ${opcoes.itemId}`);

  const url = `https://tiles.planet.com/data/v1/item-types/${opcoes.itemType}/items/${opcoes.itemId}/{z}/{x}/{y}.png`;

  return {
    urlTemplate: url,
    dataAdquisicaoIso: opcoes.dataAdquisicaoIso,
    avisoCota: "Visualização consome cota de Scene Tiles (100.000 permitidos), não faturando downloads em km².",
  };
}
