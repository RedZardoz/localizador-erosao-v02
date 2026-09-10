/**
 * ============================================================================
 * Serviço de Integração com a API de Malhas & Localidades do IBGE — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * SERVIÇO EXTERNO ACESSADO:
 * - Instituto Brasileiro de Geografia e Estatística (IBGE)
 * - Localidades: https://servicodados.ibge.gov.br/api/v1/localidades
 * - Malhas Territoriais: https://servicodados.ibge.gov.br/api/v3/malhas
 *
 * REGRA 1 E REGRA 5:
 * Nunca inferir ou inventar códigos municipais ou nomes. Em caso de falha de rede
 * ou ausência, retorna erro explícito ou null.
 */

export interface MunicipioIbge {
  id: number;
  nome: string;
  microrregiao?: {
    id: number;
    nome: string;
    mesorregiao?: {
      id: number;
      nome: string;
      UF?: {
        id: number;
        sigla: string;
        nome: string;
      };
    };
  };
}

const IBGE_LOCALIDADES_BASE = "https://servicodados.ibge.gov.br/api/v1/localidades";
const IBGE_MALHAS_BASE = "https://servicodados.ibge.gov.br/api/v3/malhas";
const DEFAULT_TIMEOUT_MS = 15000;

const cacheMunicipiosPorUf: Record<string, MunicipioIbge[]> = {};
const cacheMalhasGeoJson: Record<string, GeoJSON.GeoJsonObject> = {};

/**
 * Consulta a lista oficial de municípios de uma Unidade Federativa via API do IBGE.
 */
export async function listarMunicipiosPorUf(
  uf: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<MunicipioIbge[]> {
  const ufNormalizada = uf.trim().toUpperCase();
  if (cacheMunicipiosPorUf[ufNormalizada]) {
    return cacheMunicipiosPorUf[ufNormalizada];
  }

  const url = `${IBGE_LOCALIDADES_BASE}/estados/${ufNormalizada}/municipios?orderBy=nome`;
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });

  if (!res.ok) {
    throw new Error(`Falha ao obter municípios da UF ${ufNormalizada} no IBGE (status HTTP ${res.status}).`);
  }

  const data: MunicipioIbge[] = await res.json();
  cacheMunicipiosPorUf[ufNormalizada] = data;
  return data;
}

/**
 * Obtém a malha vetorial GeoJSON oficial de um município pelo seu código IBGE (7 dígitos).
 */
export async function obterMalhaMunicipioGeoJson(
  codigoIbge: string | number,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<GeoJSON.FeatureCollection | GeoJSON.Feature | GeoJSON.Geometry> {
  const chave = `mun_${codigoIbge}`;
  if (cacheMalhasGeoJson[chave]) {
    return cacheMalhasGeoJson[chave] as GeoJSON.FeatureCollection;
  }

  const url = `${IBGE_MALHAS_BASE}/municipios/${codigoIbge}?formato=application/vnd.geo+json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });

  if (!res.ok) {
    throw new Error(`Falha ao obter malha vetorial do município IBGE ${codigoIbge} (status HTTP ${res.status}).`);
  }

  const geojson = await res.json();
  cacheMalhasGeoJson[chave] = geojson;
  return geojson;
}

/**
 * Algoritmo de Ray-Casting para verificar se um ponto [lon, lat] está contido em um anel poligonal.
 */
export function pontoEmAnel(lon: number, lat: number, vertices: number[][]): boolean {
  let dentro = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i][0];
    const yi = vertices[i][1];
    const xj = vertices[j][0];
    const yj = vertices[j][1];

    const intersecta = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersecta) dentro = !dentro;
  }
  return dentro;
}

/**
 * Testa se um par de coordenadas [lon, lat] está dentro das geometrias contidas em um objeto GeoJSON
 * (Polygon ou MultiPolygon), descontando eventuais anéis internos (ilhas/furos).
 */
export function pontoEmGeoJson(
  lon: number,
  lat: number,
  geojson: GeoJSON.GeoJsonObject | unknown
): boolean {
  if (!geojson || typeof geojson !== "object") return false;

  const g = geojson as {
    type?: string;
    features?: Array<{ geometry?: { type: string; coordinates: any[] } }>;
    geometry?: { type: string; coordinates: any[] };
    coordinates?: any[];
  };

  const geometries: Array<{ type: string; coordinates: any[] }> = [];

  if (g.type === "FeatureCollection" && Array.isArray(g.features)) {
    for (const f of g.features) {
      if (f.geometry) geometries.push(f.geometry);
    }
  } else if (g.type === "Feature" && g.geometry) {
    geometries.push(g.geometry);
  } else if (g.type === "Polygon" || g.type === "MultiPolygon") {
    geometries.push({ type: g.type, coordinates: g.coordinates || [] });
  }

  for (const geom of geometries) {
    if (geom.type === "Polygon" && Array.isArray(geom.coordinates)) {
      const anelExterno = geom.coordinates[0];
      if (Array.isArray(anelExterno) && pontoEmAnel(lon, lat, anelExterno)) {
        let emFuro = false;
        for (let b = 1; b < geom.coordinates.length; b++) {
          if (Array.isArray(geom.coordinates[b]) && pontoEmAnel(lon, lat, geom.coordinates[b])) {
            emFuro = true;
            break;
          }
        }
        if (!emFuro) return true;
      }
    } else if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
      for (const pol of geom.coordinates) {
        if (Array.isArray(pol) && Array.isArray(pol[0]) && pontoEmAnel(lon, lat, pol[0])) {
          let emFuro = false;
          for (let b = 1; b < pol.length; b++) {
            if (Array.isArray(pol[b]) && pontoEmAnel(lon, lat, pol[b])) {
              emFuro = true;
              break;
            }
          }
          if (!emFuro) return true;
        }
      }
    }
  }

  return false;
}
