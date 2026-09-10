/**
 * ============================================================================
 * Cliente de Integração com a API de Dados e Malhas Geográficas do IBGE
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * SERVIDOR EXTERNO ACESSADO:
 * - Instituto Brasileiro de Geografia e Estatística (IBGE - Governo Federal)
 * - Endpoints:
 *   - Localidades (Estados e Municípios): https://servicodados.ibge.gov.br/api/v1/localidades
 *   - Malhas Territoriais Vetoriais GeoJSON: https://servicodados.ibge.gov.br/api/v3/malhas
 *
 * OBJETIVO CIENTÍFICO & REFERÊNCIA AO README:
 * - README §1 & §3.3: Permite a delimitação estrita de Áreas de Interesse (AOI)
 *   utilizando os limites político-administrativos oficiais do Brasil (SIRGAS 2000 / WGS84).
 * - A geometria vetorial retornada alimenta o particionamento espacial e a amostragem
 *   estratificada do Google Earth Engine no nível municipal ou estadual.
 */

const IBGE_LOCALIDADES_BASE = "https://servicodados.ibge.gov.br/api/v1/localidades";
const IBGE_MALHAS_BASE = "https://servicodados.ibge.gov.br/api/v3/malhas";

export interface IbgeEstado {
  /** Código numérico oficial do estado no IBGE (ex: 41 para Paraná) */
  id: number;
  /** Sigla da Unidade Federativa (ex: "PR") */
  sigla: string;
  /** Nome completo do estado (ex: "Paraná") */
  nome: string;
}

export interface IbgeMunicipio {
  /** Código numérico oficial de 7 dígitos do município no IBGE */
  id: number;
  /** Nome oficial do município */
  nome: string;
}

/**
 * Consulta a lista completa de Unidades da Federação (Estados) brasileiras ordenadas por nome.
 *
 * @returns Promessa com array de estados do IBGE.
 * @throws Error se a requisição HTTP falhar.
 */
export async function fetchEstados(): Promise<IbgeEstado[]> {
  const res = await fetch(`${IBGE_LOCALIDADES_BASE}/estados?orderBy=nome`);
  if (!res.ok) throw new Error(`Falha ao buscar lista de estados do IBGE (HTTP ${res.status}).`);
  const data = await res.json();
  return data.map((e: any) => ({ id: e.id, sigla: e.sigla, nome: e.nome }));
}

/**
 * Consulta todos os municípios pertencentes a uma determinada Unidade da Federação.
 *
 * @param ufSigla - Sigla de dois caracteres da UF (ex: "PR", "SP")
 * @returns Promessa com array de municípios ordenados alfabeticamente.
 * @throws Error se a requisição HTTP falhar.
 */
export async function fetchMunicipios(ufSigla: string): Promise<IbgeMunicipio[]> {
  const res = await fetch(`${IBGE_LOCALIDADES_BASE}/estados/${ufSigla}/municipios`);
  if (!res.ok) throw new Error(`Falha ao buscar municípios de ${ufSigla} no IBGE (HTTP ${res.status}).`);
  const data = await res.json();
  return data
    .map((m: any) => ({ id: m.id, nome: m.nome }))
    .sort((a: IbgeMunicipio, b: IbgeMunicipio) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/**
 * Obtém a malha vetorial geográfica oficial (GeoJSON Polygon ou MultiPolygon) de um Estado.
 *
 * @param ufId - Código numérico da UF no IBGE (ex: 41 para o Paraná)
 * @returns Promessa com a geometria vetorial GeoJSON oficial.
 */
export async function fetchEstadoBoundary(ufId: number): Promise<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  const res = await fetch(`${IBGE_MALHAS_BASE}/estados/${ufId}?formato=application/vnd.geo+json`);
  if (!res.ok) throw new Error(`Falha ao buscar o limite territorial do estado no IBGE (HTTP ${res.status}).`);
  const geojson = await res.json();
  const geometry = geojson?.features?.[0]?.geometry;
  if (!geometry) throw new Error("A malha territorial retornada pelo IBGE não contém geometria válida.");
  return geometry;
}

/**
 * Obtém a malha vetorial geográfica oficial (GeoJSON Polygon ou MultiPolygon) de um Município.
 *
 * @param municipioId - Código de 7 dígitos do município no IBGE
 * @returns Promessa com a geometria vetorial GeoJSON do polígono municipal.
 */
export async function fetchMunicipioBoundary(municipioId: number): Promise<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  const res = await fetch(`${IBGE_MALHAS_BASE}/municipios/${municipioId}?formato=application/vnd.geo+json`);
  if (!res.ok) throw new Error(`Falha ao buscar o limite territorial do município no IBGE (HTTP ${res.status}).`);
  const geojson = await res.json();
  const geometry = geojson?.features?.[0]?.geometry;
  if (!geometry) throw new Error("A malha territorial retornada pelo IBGE não contém geometria válida.");
  return geometry;
}

/**
 * Calcula a Bounding Box geográfica [[minLng, minLat], [maxLng, maxLat]] de um polígono vetorial.
 *
 * @param geometry - Geometria GeoJSON (Polygon ou MultiPolygon)
 * @returns Par de coordenadas representando os cantos sudoeste e nordeste do envelope espacial.
 */
export function boundaryBBox(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): [[number, number], [number, number]] {
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;

  const rings = geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();

  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}
