/**
 * ============================================================================
 * Polígonos das Macrobacias Hidrográficas do Paraná — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * PROVENIÊNCIA DOS DADOS:
 * - Fonte de referência: Instituto Água e Terra (IAT / antiga SUDERHSA)
 * - Sistema de Coordenadas de Referência: WGS84 (EPSG:4326), coordenadas em [longitude, latitude]
 * - Uso científico: Estratificação macrorregional e restrição espacial.
 * - REGRA 1 E REGRA 5: Ponto fora das macrobacias mapeadas retorna null.
 *   NUNCA inventar rótulo genérico como "Bacia Local" ou "Área Amostral GEE".
 */

export interface BaciaHidrograficaProperties {
  name: string;
  code: string;
  area_km2: number;
  color: string;
  mainCities: string;
}

export const PARANA_BASINS_GEOJSON: GeoJSON.FeatureCollection<
  GeoJSON.Polygon,
  BaciaHidrograficaProperties
> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "basin-tibagi",
      properties: {
        name: "Bacia do Rio Tibagi",
        code: "TIB",
        area_km2: 24715,
        color: "#0284C7",
        mainCities: "Londrina, Ponta Grossa, Telêmaco Borba, Arapongas, Apucarana",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-51.40, -22.75],
            [-50.80, -23.10],
            [-50.40, -23.80],
            [-50.10, -24.40],
            [-50.00, -25.20],
            [-50.40, -25.30],
            [-50.90, -24.80],
            [-51.30, -24.10],
            [-51.60, -23.40],
            [-51.40, -22.75],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "basin-ivai",
      properties: {
        name: "Bacia do Rio Ivaí",
        code: "IVA",
        area_km2: 36540,
        color: "#10B981",
        mainCities: "Maringá, Cianorte, Campo Mourão, Umuarama, Prudentópolis",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-53.70, -23.25],
            [-52.60, -23.20],
            [-51.80, -23.40],
            [-51.30, -24.10],
            [-50.90, -24.80],
            [-51.20, -25.25],
            [-52.10, -24.90],
            [-52.80, -24.40],
            [-53.40, -23.80],
            [-53.70, -23.25],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "basin-paranapanema",
      properties: {
        name: "Bacia do Rio Paranapanema / Pirapó",
        code: "PAN",
        area_km2: 39800,
        color: "#F59E0B",
        mainCities: "Paranavaí, Cornélio Procópio, Jacarezinho, Santo Antônio da Platina",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-53.40, -22.85],
            [-52.95, -22.52],
            [-51.85, -22.65],
            [-50.45, -22.95],
            [-49.60, -23.40],
            [-49.95, -23.90],
            [-50.80, -23.10],
            [-51.80, -23.40],
            [-52.60, -23.20],
            [-53.40, -22.85],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "basin-iguacu",
      properties: {
        name: "Bacia do Rio Iguaçu",
        code: "IGU",
        area_km2: 54820,
        color: "#8B5CF6",
        mainCities: "Guarapuava, Pato Branco, Francisco Beltrão, União da Vitória, Curitiba",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-54.60, -25.50],
            [-53.75, -25.80],
            [-52.55, -26.40],
            [-51.40, -26.25],
            [-50.10, -26.15],
            [-49.00, -25.95],
            [-49.20, -25.30],
            [-50.20, -25.40],
            [-51.20, -25.25],
            [-52.60, -25.40],
            [-53.80, -25.40],
            [-54.60, -25.50],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "basin-piquiri",
      properties: {
        name: "Bacia do Rio Piquiri / Paraná 3",
        code: "PIQ",
        area_km2: 24150,
        color: "#EC4899",
        mainCities: "Cascavel, Toledo, Palotina, Goioerê, Ubiratã",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-54.25, -24.01],
            [-53.70, -23.25],
            [-53.40, -23.80],
            [-52.80, -24.40],
            [-52.60, -25.40],
            [-53.80, -25.40],
            [-54.40, -24.80],
            [-54.25, -24.01],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "basin-litoral",
      properties: {
        name: "Bacia Litorânea & Ribeira",
        code: "LIT",
        area_km2: 14780,
        color: "#06B6D4",
        mainCities: "Paranaguá, Antonina, Morretes, Guaratuba, Cerro Azul",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-49.30, -23.85],
            [-48.50, -24.70],
            [-48.15, -25.05],
            [-48.40, -25.55],
            [-48.60, -25.90],
            [-49.00, -25.95],
            [-49.20, -25.30],
            [-49.60, -24.60],
            [-49.30, -23.85],
          ],
        ],
      },
    },
  ],
};

/**
 * Algoritmo de ray-casting no plano [lon, lat].
 */
function pontoEmAnel(lon: number, lat: number, anel: number[][]): boolean {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const xi = anel[i][0];
    const yi = anel[i][1];
    const xj = anel[j][0];
    const yj = anel[j][1];

    const intersecta = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersecta) dentro = !dentro;
  }
  return dentro;
}

/**
 * Identifica a macrobacia hidrográfica correspondente à coordenada.
 * Retorna o nome oficial da bacia ou null se o ponto não interceptar nenhuma bacia mapeada.
 * NUNCA retorna strings inventadas como "Bacia Local".
 */
export function identificarBacia(lat: number, lon: number): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  for (const feature of PARANA_BASINS_GEOJSON.features) {
    const coords = feature.geometry.coordinates;
    const anelExterno = coords[0];
    if (pontoEmAnel(lon, lat, anelExterno)) {
      // Checar eventuais buracos/anéis internos
      let emBuraco = false;
      for (let b = 1; b < coords.length; b++) {
        if (pontoEmAnel(lon, lat, coords[b])) {
          emBuraco = true;
          break;
        }
      }
      if (!emBuraco) {
        return feature.properties.name;
      }
    }
  }

  return null;
}
