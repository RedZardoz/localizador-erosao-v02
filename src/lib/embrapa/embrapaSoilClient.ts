/**
 * ============================================================================
 * Cliente de Consulta Pedológica e de Erodibilidade — Embrapa GeoInfo
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * SERVIÇO EXTERNO ACESSADO
 * - Embrapa GeoInfo / GeoServer (dados abertos)
 * - Endpoint OGC WMS 1.1.1, operação GetFeatureInfo, saída application/json
 * - https://geoinfo.dados.embrapa.br/geoserver/ows
 *
 * CAMADAS CONSULTADAS
 * 1. geonode:parana_solos_20201105
 *    Levantamento de solos do Estado do Paraná. Unidades de mapeamento com
 *    classificação no SiBCS (Santos et al., 2018) em até três componentes.
 *    Cobertura: apenas Paraná.
 * 2. geonode:brasil_erodibilidade_solo
 *    Classes qualitativas de erodibilidade do solo. Cobertura: Brasil.
 *
 * CAPACIDADE VERIFICADA EM 2026-09-10
 * VERIFICADO 2026-09-10 — evidência: docs/verificacoes/2026-09-10_embrapa_capabilities.xml
 * - GetCapabilities declara GetFeatureInfo com application/json.
 * - Ambas as camadas expõem queryable="1".
 * - Consulta combinada (query_layers com as duas camadas) retorna as duas
 *   feições em uma única requisição, discrimináveis pelo prefixo de `id`.
 * - Amostras reais arquivadas em docs/verificacoes/2026-09-10_embrapa_featureinfo_oeste.json,
 *   docs/verificacoes/2026-09-10_embrapa_featureinfo_noroeste.json e
 *   docs/verificacoes/2026-09-10_embrapa_featureinfo_oceano.json.
 *
 * PRINCÍPIO DE PROJETO — DADO VERDADEIRO OU AUSÊNCIA DECLARADA
 * Este módulo NUNCA inventa, estima ou infere um valor. Em qualquer situação
 * em que o dado não puder ser obtido, o retorno traz `status` explícito e o
 * motivo textual. Não existe valor padrão. Ausência de cobertura, falha de
 * rede e resposta malformada são estados DISTINTOS e nunca são colapsados —
 * afirmar "não há solo mapeado aqui" quando o serviço caiu seria uma
 * afirmação falsa sobre o território.
 */

/** Raiz do serviço OGC da Embrapa GeoInfo. */
export const EMBRAPA_OWS_URL = "https://geoinfo.dados.embrapa.br/geoserver/ows";

/** Camada de levantamento pedológico do Paraná (cobertura estadual). */
export const LAYER_SOLOS_PR = "geonode:parana_solos_20201105";

/** Camada de classes de erodibilidade do solo (cobertura nacional). */
export const LAYER_ERODIBILIDADE_BR = "geonode:brasil_erodibilidade_solo";

/** Timeout padrão da requisição, em milissegundos. */
const DEFAULT_TIMEOUT_MS = 20000;

/**
 * Precisão do arredondamento usado como chave de cache, em graus decimais.
 * 4 casas ≈ 11 m no equador, resolução muito superior à escala das cartas
 * consultadas, de modo que o arredondamento não altera a unidade de mapeamento.
 */
const CACHE_GRID_DECIMALS = 4;

/** Meio-lado da caixa de consulta, em graus. ~55 m: menor que qualquer polígono da carta. */
const BBOX_HALF_DEG = 0.0005;

/**
 * Um componente pedológico de uma unidade de mapeamento.
 *
 * Unidades do tipo `associacao` possuem até três componentes, em ordem de
 * predominância declarada pelo levantamento. A carta NÃO informa qual deles
 * ocorre em uma coordenada específica — é limitação de escala do levantamento,
 * não defeito do dado. Ver `EmbrapaSoilUnit.confianca`.
 */
export interface SoilComponent {
  /** Posição na unidade de mapeamento: 1 = componente dominante. */
  posicao: 1 | 2 | 3;
  /** Ordem do SiBCS (ex.: "LATOSSOLO", "NEOSSOLO"). */
  ordem: string;
  /** Subordem (ex.: "VERMELHO", "REGOLITICO"). */
  subOrdem: string;
  /** Grande grupo — carrega o caráter distrófico/eutrófico levantado em campo. */
  grandeGrupo: string;
  /** Subgrupo (ex.: "tipico", "chernossolico"). */
  subGrupo: string;
  /** Atributos de família (textura, pedregosidade, substrato, horizonte A). */
  familia: string[];
  /** Fase de vegetação primária declarada. */
  faseVegetacao: string;
  /** Fase de relevo declarada. */
  faseRelevo: string;
}

/** Unidade de mapeamento pedológico retornada pela carta da Embrapa. */
export interface EmbrapaSoilUnit {
  /** Código da unidade no levantamento (ex.: "RRe12", "LVe1"). */
  sbcs: string;
  /** Legenda textual completa da unidade. */
  legenda: string;
  /** "simples" (um componente) ou "associacao" (dois ou três componentes). */
  tipoUnidade: string;
  /** Componentes em ordem de predominância. Sempre ao menos um. */
  componentes: SoilComponent[];
  /** Área da unidade de mapeamento em km², quando declarada. */
  areaKm2: number | null;
  /**
   * Confiança da atribuição pontual.
   * - "alta": unidade simples — um único solo na unidade de mapeamento.
   * - "media": associação — o componente dominante é o mais provável, porém
   *   a carta não resolve qual dos componentes ocorre nesta coordenada.
   */
  confianca: "alta" | "media";
}

/**
 * Classe de erodibilidade da carta nacional.
 *
 * `classe` é CATEGÓRICA e o domínio inclui categorias não-pedológicas
 * (verificado: "Area urbana"). Não deve ser tratada como escala ordinal sem
 * antes enumerar o domínio completo da camada e decidir o tratamento de cada
 * categoria. Não converter para valor numérico de Fator K sem respaldo
 * documental da própria Embrapa.
 */
export interface EmbrapaErodibility {
  classe: string;
  codnum: number | null;
}

/** Estado da consulta. Estados distintos jamais são colapsados. */
export type EmbrapaQueryStatus =
  /** Serviço respondeu e há feição mapeada na coordenada. */
  | "encontrado"
  /** Serviço respondeu corretamente e NÃO há feição mapeada na coordenada. */
  | "sem-cobertura"
  /** Serviço indisponível, tempo esgotado ou resposta malformada. Nada se afirma. */
  | "servico-indisponivel";

/** Resultado completo, com proveniência suficiente para auditoria. */
export interface EmbrapaSoilQueryResult {
  statusSolo: EmbrapaQueryStatus;
  statusErodibilidade: EmbrapaQueryStatus;
  /** Motivo textual quando algum status não for "encontrado". */
  motivo: string | null;
  solo: EmbrapaSoilUnit | null;
  erodibilidade: EmbrapaErodibility | null;
  /** Proveniência: o que foi consultado, onde e quando. */
  proveniencia: {
    servico: string;
    camadaSolo: string;
    camadaErodibilidade: string;
    latitude: number;
    longitude: number;
    consultadoEm: string;
  };
}

interface GeoJsonFeature {
  id?: string;
  properties?: Record<string, unknown>;
}

const cache = new Map<string, EmbrapaSoilQueryResult>();

/** Limpa o cache em memória. Destinado a testes e a recarga deliberada. */
export function clearEmbrapaSoilCache(): void {
  cache.clear();
}

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(CACHE_GRID_DECIMALS)},${lng.toFixed(CACHE_GRID_DECIMALS)}`;
}

function texto(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  return s === "None" || s === "null" ? "" : s;
}

function numeroOuNulo(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Monta a URL de GetFeatureInfo para as duas camadas em uma única requisição.
 *
 * A caixa de consulta é mínima (~110 m de lado) e a amostragem ocorre no pixel
 * central de uma grade 3x3, garantindo que a feição retornada corresponda à
 * coordenada solicitada e não a uma vizinhança ampla.
 */
export function buildGetFeatureInfoUrl(lat: number, lng: number): string {
  const d = BBOX_HALF_DEG;
  const layers = `${LAYER_SOLOS_PR},${LAYER_ERODIBILIDADE_BR}`;
  const params = new URLSearchParams({
    service: "WMS",
    version: "1.1.1",
    request: "GetFeatureInfo",
    layers,
    query_layers: layers,
    srs: "EPSG:4326",
    bbox: `${lng - d},${lat - d},${lng + d},${lat + d}`,
    width: "3",
    height: "3",
    x: "1",
    y: "1",
    info_format: "application/json",
    feature_count: "5",
  });
  return `${EMBRAPA_OWS_URL}?${params.toString()}`;
}

/** Extrai um componente pedológico a partir dos sufixos de atributo da carta. */
function lerComponente(
  p: Record<string, unknown>,
  posicao: 1 | 2 | 3,
  chaves: {
    ordem: string;
    subOrdem: string;
    grandeGrupo: string;
    subGrupo: string;
    familia: string[];
    faseVegetacao: string;
    faseRelevo: string;
  }
): SoilComponent | null {
  const ordem = texto(p[chaves.ordem]);
  if (!ordem) return null;
  return {
    posicao,
    ordem,
    subOrdem: texto(p[chaves.subOrdem]),
    grandeGrupo: texto(p[chaves.grandeGrupo]),
    subGrupo: texto(p[chaves.subGrupo]),
    familia: chaves.familia.map((k) => texto(p[k])).filter((s) => s.length > 0),
    faseVegetacao: texto(p[chaves.faseVegetacao]),
    faseRelevo: texto(p[chaves.faseRelevo]),
  };
}

/**
 * Converte as propriedades brutas da camada de solos na estrutura tipada.
 * Os nomes de atributo seguem o esquema real da camada, verificado em 08/09/2026.
 */
export function parseSoilFeature(props: Record<string, unknown>): EmbrapaSoilUnit | null {
  const componentes: SoilComponent[] = [];

  const c1 = lerComponente(props, 1, {
    ordem: "ordem_1",
    subOrdem: "sub_ordem_",
    grandeGrupo: "grande_gru",
    subGrupo: "sub_grupo_",
    familia: ["familia_1_", "familia_11", "familia_12", "familia_14"],
    faseVegetacao: "fase_veget",
    faseRelevo: "fase_relev",
  });
  if (c1) componentes.push(c1);

  const c2 = lerComponente(props, 2, {
    ordem: "ordem_2",
    subOrdem: "sub_ordem1",
    grandeGrupo: "grande_g_1",
    subGrupo: "sub_grupo1",
    familia: ["familia_2_", "familia_21"],
    faseVegetacao: "fase_veg_1",
    faseRelevo: "fase_rel_1",
  });
  if (c2) componentes.push(c2);

  const c3 = lerComponente(props, 3, {
    ordem: "ordem_3",
    subOrdem: "sub_orde_1",
    grandeGrupo: "grande_g_2",
    subGrupo: "sub_grup_1",
    familia: ["familia_3_", "familia_33"],
    faseVegetacao: "fase_veg_2",
    faseRelevo: "fase_rel_2",
  });
  if (c3) componentes.push(c3);

  if (componentes.length === 0) return null;

  const tipoUnidade = texto(props["tipo_unida"]);
  // A confiança deriva do próprio dado: unidade simples resolve o ponto;
  // associação não resolve qual componente ocorre nesta coordenada.
  const confianca: "alta" | "media" =
    tipoUnidade.toLowerCase() === "simples" && componentes.length === 1 ? "alta" : "media";

  return {
    sbcs: texto(props["sbcs"]),
    legenda: texto(props["legenda"]),
    tipoUnidade,
    componentes,
    areaKm2: numeroOuNulo(props["area_km2"]),
    confianca,
  };
}

/** Converte as propriedades brutas da camada de erodibilidade. */
export function parseErodibilityFeature(
  props: Record<string, unknown>
): EmbrapaErodibility | null {
  const classe = texto(props["classe"]);
  if (!classe) return null;
  return { classe, codnum: numeroOuNulo(props["codnum"]) };
}

function resultadoBase(lat: number, lng: number): EmbrapaSoilQueryResult {
  return {
    statusSolo: "servico-indisponivel",
    statusErodibilidade: "servico-indisponivel",
    motivo: null,
    solo: null,
    erodibilidade: null,
    proveniencia: {
      servico: EMBRAPA_OWS_URL,
      camadaSolo: LAYER_SOLOS_PR,
      camadaErodibilidade: LAYER_ERODIBILIDADE_BR,
      latitude: lat,
      longitude: lng,
      consultadoEm: new Date().toISOString(),
    },
  };
}

export interface EmbrapaQueryOptions {
  /** Tempo máximo da requisição em ms. Padrão: 20000. */
  timeoutMs?: number;
  /** Ignora o cache em memória e força nova consulta ao serviço. */
  forceRefresh?: boolean;
}

/**
 * Consulta a classe pedológica e a classe de erodibilidade de uma coordenada.
 *
 * Nunca lança exceção e nunca devolve valor inventado: falhas retornam
 * `status` "servico-indisponivel" com o motivo preenchido, e ausência de
 * feição retorna "sem-cobertura". Os dois casos são distintos e o consumidor
 * deve tratá-los de forma distinta.
 *
 * @param lat Latitude decimal, EPSG:4326.
 * @param lng Longitude decimal, EPSG:4326.
 * @param options Timeout e controle de cache.
 */
export async function queryEmbrapaSoil(
  lat: number,
  lng: number,
  options: EmbrapaQueryOptions = {}
): Promise<EmbrapaSoilQueryResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    const r = resultadoBase(lat, lng);
    r.motivo = `Coordenada inválida (${lat}, ${lng}). Nenhuma consulta foi realizada.`;
    return r;
  }

  const key = cacheKey(lat, lng);
  if (!options.forceRefresh) {
    const hit = cache.get(key);
    if (hit) return hit;
  }

  const resultado = resultadoBase(lat, lng);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let payload: { features?: GeoJsonFeature[] };
  try {
    const res = await fetch(buildGetFeatureInfoUrl(lat, lng), {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      resultado.motivo = `Serviço GeoInfo da Embrapa retornou HTTP ${res.status}. Nada se afirma sobre esta coordenada.`;
      return resultado;
    }
    payload = await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    resultado.motivo = `Falha ao consultar o serviço GeoInfo da Embrapa: ${msg}. Nada se afirma sobre esta coordenada.`;
    return resultado;
  }

  const features = Array.isArray(payload?.features) ? payload.features : [];

  // Serviço respondeu: a partir daqui, ausência de feição é informação real
  // sobre o território, não falha técnica.
  resultado.statusSolo = "sem-cobertura";
  resultado.statusErodibilidade = "sem-cobertura";

  for (const f of features) {
    const id = typeof f?.id === "string" ? f.id : "";
    const props = (f?.properties ?? {}) as Record<string, unknown>;

    if (id.startsWith("parana_solos_")) {
      const solo = parseSoilFeature(props);
      if (solo) {
        resultado.solo = solo;
        resultado.statusSolo = "encontrado";
      }
    } else if (id.startsWith("brasil_erodibilidade_solo")) {
      const ero = parseErodibilityFeature(props);
      if (ero) {
        resultado.erodibilidade = ero;
        resultado.statusErodibilidade = "encontrado";
      }
    }
  }

  const pendencias: string[] = [];
  if (resultado.statusSolo === "sem-cobertura") {
    pendencias.push(
      "Carta de solos sem cobertura nesta coordenada (a camada abrange apenas o Estado do Paraná)."
    );
  }
  if (resultado.statusErodibilidade === "sem-cobertura") {
    pendencias.push("Carta de erodibilidade sem cobertura nesta coordenada.");
  }
  resultado.motivo = pendencias.length > 0 ? pendencias.join(" ") : null;

  cache.set(key, resultado);
  return resultado;
}

/**
 * Rótulo curto e auditável da classe pedológica dominante.
 *
 * Explicita o nível de confiança quando a unidade é uma associação, de modo
 * que a planilha exportada jamais apresente como certo aquilo que a carta
 * declara como associação de solos.
 */
export function formatSoilLabel(result: EmbrapaSoilQueryResult): string {
  if (result.statusSolo === "servico-indisponivel") {
    return "Consulta pedológica não realizada";
  }
  if (result.statusSolo === "sem-cobertura" || !result.solo) {
    return "Sem cobertura na carta de solos";
  }
  const c = result.solo.componentes[0];
  const partes = [c.ordem, c.subOrdem, c.grandeGrupo].filter((s) => s.length > 0);
  const base = partes.join(" ");
  if (result.solo.confianca === "media") {
    const n = result.solo.componentes.length;
    return `${base} (componente dominante de associação com ${n} solos — atribuição pontual não resolvida pela carta)`;
  }
  return base;
}
