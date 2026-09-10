/**
 * ============================================================================
 * Serviço de Integração com a API de Malhas & Localidades do IBGE
 * SAREL — PPGTCA 2026
 * ============================================================================
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
  "regiao-imediata"?: {
    id: number;
    nome: string;
    "regiao-intermediaria"?: {
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

// Cache em memória para evitar requisições repetidas ao trocar abas/modais
const cacheMunicipiosPorUf: Record<string, MunicipioIbge[]> = {};
const cacheMalhasGeoJson: Record<string, any> = {};

/**
 * Consulta a lista oficial de municípios de uma Unidade Federativa via API do IBGE
 */
export async function listarMunicipiosPorUf(uf: string): Promise<MunicipioIbge[]> {
  const ufNormalizada = uf.trim().toUpperCase();
  if (cacheMunicipiosPorUf[ufNormalizada]) {
    return cacheMunicipiosPorUf[ufNormalizada];
  }

  // Tentar obter do localStorage se disponível no navegador
  if (typeof window !== "undefined") {
    try {
      const salvo = localStorage.getItem(`sarel_ibge_mun_${ufNormalizada}`);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cacheMunicipiosPorUf[ufNormalizada] = parsed;
          return parsed;
        }
      }
    } catch {}
  }

  const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufNormalizada}/municipios?orderBy=nome`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao obter municípios da UF ${ufNormalizada} no IBGE (status ${res.status}).`);
  }

  const data: MunicipioIbge[] = await res.json();
  cacheMunicipiosPorUf[ufNormalizada] = data;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`sarel_ibge_mun_${ufNormalizada}`, JSON.stringify(data));
    } catch {}
  }

  return data;
}

/**
 * Obtém a geometria vetorial GeoJSON oficial de um município via IBGE
 */
export async function obterMalhaMunicipioGeoJson(codigoIbge: string | number): Promise<any> {
  const chave = `mun_${codigoIbge}`;
  if (cacheMalhasGeoJson[chave]) {
    return cacheMalhasGeoJson[chave];
  }

  // Verificar fallback local em public/dados/municipios se for um dos 15 pré-baixados
  if (typeof window !== "undefined") {
    try {
      const localRes = await fetch(`/dados/municipios/${codigoIbge}.geojson`);
      if (localRes.ok) {
        const localData = await localRes.json();
        cacheMalhasGeoJson[chave] = localData;
        return localData;
      }
    } catch {}
  }

  const url = `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${codigoIbge}?formato=application/vnd.geo+json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao carregar malha vetorial do município IBGE ${codigoIbge} (status ${res.status}).`);
  }

  const geojson = await res.json();
  cacheMalhasGeoJson[chave] = geojson;
  return geojson;
}

/**
 * Obtém a geometria vetorial GeoJSON oficial de um estado via IBGE
 */
export async function obterMalhaEstadoGeoJson(codigoIbgeOuUf: string | number): Promise<any> {
  const chave = `uf_${codigoIbgeOuUf}`;
  if (cacheMalhasGeoJson[chave]) {
    return cacheMalhasGeoJson[chave];
  }

  // Fallback para Paraná se disponível localmente
  if (String(codigoIbgeOuUf) === "41" || String(codigoIbgeOuUf).toUpperCase() === "PR") {
    if (typeof window !== "undefined") {
      try {
        const localRes = await fetch("/dados/parana_ibge.geojson");
        if (localRes.ok) {
          const localData = await localRes.json();
          cacheMalhasGeoJson[chave] = localData;
          return localData;
        }
      } catch {}
    }
  }

  const url = `https://servicodados.ibge.gov.br/api/v3/malhas/estados/${codigoIbgeOuUf}?formato=application/vnd.geo+json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao carregar malha vetorial do estado IBGE ${codigoIbgeOuUf}.`);
  }

  const geojson = await res.json();
  cacheMalhasGeoJson[chave] = geojson;
  return geojson;
}

/**
 * Calcula com precisão a bounding box [minLng, minLat, maxLng, maxLat] a partir de qualquer GeoJSON
 */
export function extrairBboxGeoJson(geojson: any): [number, number, number, number] {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  function processarCoordenadas(coords: any) {
    if (!coords) return;
    if (
      Array.isArray(coords) &&
      coords.length >= 2 &&
      typeof coords[0] === "number" &&
      typeof coords[1] === "number"
    ) {
      const lng = coords[0];
      const lat = coords[1];
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
      return;
    }

    if (Array.isArray(coords)) {
      for (const item of coords) {
        processarCoordenadas(item);
      }
    }
  }

  if (geojson) {
    if (geojson.bbox && Array.isArray(geojson.bbox) && geojson.bbox.length === 4) {
      return geojson.bbox as [number, number, number, number];
    }
    if (geojson.type === "FeatureCollection" && Array.isArray(geojson.features)) {
      for (const f of geojson.features) {
        processarCoordenadas(f.geometry?.coordinates);
      }
    } else if (geojson.type === "Feature") {
      processarCoordenadas(geojson.geometry?.coordinates);
    } else if (geojson.coordinates) {
      processarCoordenadas(geojson.coordinates);
    }
  }

  if (!isFinite(minLng) || !isFinite(minLat) || !isFinite(maxLng) || !isFinite(maxLat)) {
    return [-54.62, -26.72, -48.02, -22.51]; // Bbox de salvaguarda padrão
  }

  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Algoritmo de Ray-Casting para verificar se um ponto [lng, lat] está contido em um anel poligonal.
 */
export function pontoEmPoligono(ponto: [number, number], vertices: [number, number][]): boolean {
  const [x, y] = ponto;
  let dentro = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i][0];
    const yi = vertices[i][1];
    const xj = vertices[j][0];
    const yj = vertices[j][1];

    const intercepta = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intercepta) dentro = !dentro;
  }
  return dentro;
}

/**
 * Testa se um par de coordenadas [lng, lat] está dentro das geometrias contidas em um objeto GeoJSON
 * (Polygon ou MultiPolygon).
 */
export function pontoEmGeoJson(lng: number, lat: number, geojson: any): boolean {
  if (!geojson) return true;

  const features =
    geojson.type === "FeatureCollection"
      ? geojson.features
      : geojson.type === "Feature"
      ? [geojson]
      : [{ geometry: geojson }];

  for (const f of features) {
    const geom = f.geometry || f;
    if (!geom) continue;

    if (geom.type === "Polygon") {
      const anelExterno = geom.coordinates[0];
      if (pontoEmPoligono([lng, lat], anelExterno)) {
        // Verificar se cai em algum buraco (anéis internos)
        let emBuraco = false;
        for (let b = 1; b < geom.coordinates.length; b++) {
          if (pontoEmPoligono([lng, lat], geom.coordinates[b])) {
            emBuraco = true;
            break;
          }
        }
        if (!emBuraco) return true;
      }
    } else if (geom.type === "MultiPolygon") {
      for (const poligono of geom.coordinates) {
        const anelExterno = poligono[0];
        if (pontoEmPoligono([lng, lat], anelExterno)) {
          let emBuraco = false;
          for (let b = 1; b < poligono.length; b++) {
            if (pontoEmPoligono([lng, lat], poligono[b])) {
              emBuraco = true;
              break;
            }
          }
          if (!emBuraco) return true;
        }
      }
    }
  }

  return false;
}
