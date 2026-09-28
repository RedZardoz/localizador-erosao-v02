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

import { Proveniencia, tabelado, indisponivel } from "@/types/proveniencia";

/** Raiz do serviço OGC da Embrapa GeoInfo. */
export const EMBRAPA_OWS_URL = "https://geoinfo.dados.embrapa.br/geoserver/ows";

/** Camada de levantamento pedológico do Paraná (cobertura estadual). */
export const LAYER_SOLOS_PR = "geonode:parana_solos_20201105";

/** Camada de classes de erodibilidade do solo (cobertura nacional — corroborante independente de classe única no ponto). */
export const LAYER_ERODIBILIDADE_BR = "geonode:brasil_erodibilidade_solo";

/** Camada de erodibilidade por componente da unidade de mapeamento (Documentos 246 / IBGE 1:250.000, 2024). */
export const LAYER_ERODIBILIDADE_2024 = "geonode:bra_erodibilidade_2024_sirgas2000";

/**
 * Quantidade máxima de feições solicitadas no GetFeatureInfo combinado das 3 camadas.
 * Elevado de 5 para 10 para garantir que as 3 camadas (parana_solos_20201105,
 * brasil_erodibilidade_solo e bra_erodibilidade_2024_sirgas2000) caibam integralmente
 * na resposta JSON mesmo quando o bbox 3x3 interceptar bordas entre polígonos adjacentes.
 */
export const FEATURE_COUNT_PADRAO = 10;

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

const ORDENS_SIBCS_CANONICAS = [
  "LATOSSOLO",
  "NITOSSOLO",
  "ARGISSOLO",
  "NEOSSOLO",
  "CHERNOSSOLO",
  "CAMBISSOLO",
  "GLEISSOLO",
  "PLINTOSSOLO",
  "PLANOSSOLO",
  "ORGANOSSOLO",
  "ESPODOSSOLO",
  "LUVISSOLO",
  "VERTISSOLO",
] as const;

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
  /** Classe de erodibilidade do componente (erod_c1..erod_c4) quando correspondente à camada 2024. */
  erodibilidadeComponente2024?: string | null;
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
  /**
   * Marcação de ambiguidade do estrato de erodibilidade K (Decisões D08 e D09).
   * - `true`: unidade do tipo "associacao" na qual o componente dominante (`ordem_1`)
   *   e ao menos um componente subordinado (`ordem_2`, `ordem_3`) pertencem a níveis
   *   opostos de estratificação de K em D09 (Nível 1: K <= 0,0285 [classes 1–3] vs.
   *   Nível 2: K >= 0,0300 [classes 4–6]), OU quando há divergência de composição entre
   *   a carta estadual (`parana_solos_20201105`) e a carta nacional (`bra_erodibilidade_2024_sirgas2000`).
   * - `false`: unidade simples (com correspondência ou fallback sem conflito) ou associação em que
   *   todos os componentes pertencem ao mesmo nível de K de D09.
   * Nunca entra na matriz X de preditores (protegido em CAMPOS_PROIBIDOS_MATRIZ_TREINO).
   */
  kAmbiguoAssociacao: boolean;
  /** Estado da verificação de correspondência entre `parana_solos_20201105` e `bra_erodibilidade_2024_sirgas2000`. */
  correspondenciaCartas2024: "correspondente" | "divergente" | "sem-camada-2024";
  /** Marcador explícito de divergência taxonômica entre a carta do Paraná e a carta nacional de 2024 (T2.3). */
  divergenciaEntreCartas2024: boolean;
  /** Proveniência efetiva usada para classificar os níveis de K na unidade. */
  provenienciaK:
    | "tabelado"
    | "divergencia-entre-cartas"
    | "heuristica-fallback-nao-conferida"
    | "fora-do-dominio";
  /** Identificador (`cod_um` ou `ogc_fid`) da feição `bra_erodibilidade_2024_sirgas2000` quando `provenienciaK === "tabelado"`. */
  chaveProvenienciaK: string | null;
  /** Indica se a coordenada caiu em classe não-pedológica ("Area urbana", "Corpos dagua", etc.) em qualquer camada (T3). */
  foraDoDominioSolo: boolean;
}

/**
 * Classe de erodibilidade da carta nacional (`geonode:brasil_erodibilidade_solo`).
 *
 * `classe` é CATEGÓRICA e o domínio inclui categorias não-pedológicas
 * (verificado: "Area urbana", "Corpos dagua").
 */
export interface EmbrapaErodibility {
  classe: string;
  codnum: number | null;
}

/**
 * Feição detalhada por componente da camada `geonode:bra_erodibilidade_2024_sirgas2000` (Documentos 246).
 */
export interface EmbrapaErodibility2024 {
  ogcFid: number | null;
  codUm: string;
  codUm2?: string;
  legenda: string;
  legendasComponentes: string[];
  ordensExtraidas: string[];
  erodComponentes: string[];
  erodUm: string;
  fatorKUm: string;
  /** Valor de k_solos validado contra o domínio de erod_um (null se erod_um for não-solo ou k_solos <= 0). */
  kSolos: number | null;
  /** Valor bruto de k_solos retornado pelo GeoServer (0 para Área urbana / Corpo d'água). */
  kSolosBruto?: number | null;
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
  statusErodibilidade2024?: EmbrapaQueryStatus;
  /** Motivo textual quando algum status não for "encontrado". */
  motivo: string | null;
  solo: EmbrapaSoilUnit | null;
  erodibilidade: EmbrapaErodibility | null;
  erodibilidade2024?: EmbrapaErodibility2024 | null;
  /** Indica se nenhuma das feições de uma camada consultada possui solo mapeado (U1.4 / T3). */
  foraDoDominioSolo?: boolean;
  motivoForaDoDominioSolo?: string | null;
  /** Marcador de fronteira cartográfica: true quando houver mais de uma feição de solos na resposta (U1.5). */
  pontoEmFronteiraPedologica?: boolean;
  /** Quantidade total de feições retornadas pela camada parana_solos_20201105 (U1.3). */
  totalFeicoesSoloRetornadas?: number;
  /** Índice (0-based) da feição escolhida em parana_solos_20201105 (U1.3). */
  indiceFeicaoSoloEscolhida?: number | null;
  /** Identificador (id ou sbcs) da feição escolhida em parana_solos_20201105 (U1.3). */
  feicaoSoloEscolhidaId?: string | null;
  /** Quantidade total de feições retornadas pela camada bra_erodibilidade_2024_sirgas2000 (U1.3). */
  totalFeicoesErod2024Retornadas?: number;
  /** Índice (0-based) da feição escolhida em bra_erodibilidade_2024_sirgas2000 (U1.3). */
  indiceFeicaoErod2024Escolhida?: number | null;
  /** Identificador (cod_um / cod_um2 / id) da feição escolhida em bra_erodibilidade_2024_sirgas2000 (U1.3). */
  feicaoErod2024EscolhidaId?: string | null;
  /** Proveniência: o que foi consultado, onde e quando. */
  proveniencia: {
    servico: string;
    camadaSolo: string;
    camadaErodibilidade: string;
    camadaErodibilidade2024?: string;
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

function normalizarSemAcento(s: string): string {
  return s
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Reconhece explicitamente categorias não-pedológicas ("Area urbana", "Área urbana",
 * "Corpos dagua", "Corpo d'água", "agua", "agua_externa", "Afloramento de rocha", "Dunas")
 * que jamais podem ser convertidas em nível de erodibilidade K (T3 / P12).
 */
export function ehCategoriaNaoSolo(valorBruto: string): boolean {
  const norm = normalizarSemAcento(valorBruto);
  if (!norm) return false;
  return (
    norm.includes("AREA URBANA") ||
    norm.includes("CORPO D'AGUA") ||
    norm.includes("CORPO DAGUA") ||
    norm.includes("CORPOS D'AGUA") ||
    norm.includes("CORPOS DAGUA") ||
    norm === "AGUA" ||
    norm === "AGUA_EXTERNA" ||
    norm.includes("AFLORAMENTO DE ROCHA") ||
    norm.includes("AFLORAMENTOS DE ROCHA") ||
    norm === "DUNAS" ||
    norm === "PRAIAS"
  );
}

/**
 * Extrai a ordem taxonômica do SiBCS a partir de uma legenda textual de componente
 * (`legenda_c1..legenda_c4` de `geonode:bra_erodibilidade_2024_sirgas2000` ou `ordem_1..ordem_3`).
 */
export function extrairOrdemSibcsDeLegenda(legenda: string): string {
  const norm = normalizarSemAcento(legenda);
  if (!norm || ehCategoriaNaoSolo(norm)) return "";
  for (const ordem of ORDENS_SIBCS_CANONICAS) {
    if (norm.includes(ordem)) {
      return ordem;
    }
  }
  return "";
}

/**
 * Monta a URL de GetFeatureInfo para as três camadas em uma única requisição:
 * 1. `geonode:parana_solos_20201105` (carta estadual de solos do Paraná)
 * 2. `geonode:brasil_erodibilidade_solo` (corroborante independente de classe única no ponto)
 * 3. `geonode:bra_erodibilidade_2024_sirgas2000` (classes `erod_c1..erod_c4` e `legenda_c1..legenda_c4` do Documentos 246)
 *
 * `feature_count` é fixado em 10 (`FEATURE_COUNT_PADRAO`) para acomodar as três camadas sem truncamento.
 */
export function buildGetFeatureInfoUrl(lat: number, lng: number): string {
  const d = BBOX_HALF_DEG;
  const layers = `${LAYER_SOLOS_PR},${LAYER_ERODIBILIDADE_BR},${LAYER_ERODIBILIDADE_2024}`;
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
    feature_count: String(FEATURE_COUNT_PADRAO),
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
  if (!ordem || ehCategoriaNaoSolo(ordem)) return null;
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
 * Classifica o nível de estrato de erodibilidade K (Decisão D09: 1 = K <= 0,0285 [classes 1–3];
 * 2 = K >= 0,0300 [classes 4–6]) de um componente taxonômico de solo para fins da marcação
 * `kAmbiguoAssociacao` (Decisão D08), retornando `Proveniencia<1 | 2>` (T3.2).
 *
 * Proveniência documental e correção dos achados F1–F5 (28/09/2026):
 * - Achado F1 corrigido: a camada estadual de solos (`geonode:parana_solos_20201105`, 38 atributos)
 *   NÃO possui campos `erod_c1..erod_c4`. Ler `props["erod_c1"]` da feição de solos fazia o ramo
 *   oficial ser código morto. Agora `erod_c1..erod_c4` são lidos da feição de 2024
 *   (`geonode:bra_erodibilidade_2024_sirgas2000`, 20 atributos, confirmados por `DescribeFeatureType`
 *   em `docs/verificacoes/fontes/wfs_erodibilidade/describe_feature_type_bra_erodibilidade_2024.xml`),
 *   condicionados à verificação de correspondência entre `legenda_c1..legenda_c4` e `ordem_1..ordem_3` (T2).
 * - Achado F5 corrigido: o cliente WMS/WFS ativo já consultava `geonode:brasil_erodibilidade_solo`
 *   (e não `geonode:brasil_solos_5m_20201104`), e agora consulta as 3 camadas simultaneamente:
 *   `geonode:parana_solos_20201105`, `geonode:brasil_erodibilidade_solo` e `geonode:bra_erodibilidade_2024_sirgas2000`.
 * - Tratamento de não-solo (T3 / P12): valores como `"Area urbana"`, `"Área urbana"`, `"Corpo d'água"` e
 *   `"Corpos dagua"` retornam `indisponivel("fora-do-dominio", [...])` e jamais são convertidos em `1 | 2`.
 * - Quando a camada de 2024 correspondente fornece `erod_cN`, o retorno é `tabelado(nivel, tabela, chave)`.
 * - Quando a camada de 2024 não cobre o ponto, opera a heurística taxonômica de fallback, cujo enquadramento
 *   para ordens multi-classe da Figura 1 (`NITOSSOLO`, `ORGANOSSOLO`, `ARGISSOLO`, `CAMBISSOLO`, `GLEISSOLO`
 *   não-sálico, `PLINTOSSOLO` não-pétrico, `NEOSSOLO LITOLICO`/`FLUVICO`) permanece declarado como
 *   regra operacional NÃO CONFERIDA contra a tabela de atributos 1:250.000 (T4.3).
 */
export function classificarNivelEstratoKComponente(
  comp: SoilComponent,
  erodAtributoExplicito?: string,
  opcoesProveniencia?: {
    tabela?: string;
    chave?: string;
  }
): Proveniencia<1 | 2> {
  if (erodAtributoExplicito && ehCategoriaNaoSolo(erodAtributoExplicito)) {
    return indisponivel("fora-do-dominio", [
      `Categoria não-pedológica em erod_cN fora do domínio de K: '${erodAtributoExplicito}'`,
    ]);
  }
  if (ehCategoriaNaoSolo(comp.ordem)) {
    return indisponivel("fora-do-dominio", [
      `Ordem não-pedológica fora do domínio de K: '${comp.ordem}'`,
    ]);
  }

  if (erodAtributoExplicito) {
    const norm = erodAtributoExplicito
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const tabela = opcoesProveniencia?.tabela ?? LAYER_ERODIBILIDADE_2024;
    const chave = opcoesProveniencia?.chave ?? "erod_cN";
    if (norm === "muito baixa" || norm === "baixa" || norm === "media") {
      return tabelado(1, tabela, chave);
    }
    if (norm === "alta" || norm === "muito alta" || norm === "extremamente alta") {
      return tabelado(2, tabela, chave);
    }
  }

  const ordem = normalizarSemAcento(comp.ordem);
  const subOrdem = normalizarSemAcento(comp.subOrdem);
  const grandeGrupo = normalizarSemAcento(comp.grandeGrupo);
  const subGrupo = normalizarSemAcento(comp.subGrupo);
  const familiaTexto = normalizarSemAcento(comp.familia.join(" "));
  const tabelaFallback = "heuristica-taxonomica-fallback-nao-conferida";

  if (ordem.includes("LATOSSOLO")) {
    return tabelado(familiaTexto.includes("ERODID") ? 2 : 1, tabelaFallback, comp.ordem);
  }
  if (ordem.includes("NITOSSOLO")) {
    return tabelado(1, tabelaFallback, comp.ordem);
  }
  if (ordem.includes("PLINTOSSOLO")) {
    return tabelado(subOrdem.includes("PETRICO") ? 1 : 2, tabelaFallback, comp.ordem);
  }
  if (ordem.includes("ORGANOSSOLO")) {
    return tabelado(1, tabelaFallback, comp.ordem);
  }
  if (ordem.includes("ARGISSOLO")) {
    const abrupticoOuArenoso =
      grandeGrupo.includes("ABRUPTIC") ||
      subGrupo.includes("ABRUPTIC") ||
      familiaTexto.includes("ABRUPTIC") ||
      familiaTexto.includes("ARENOS");
    return tabelado(abrupticoOuArenoso ? 2 : 1, tabelaFallback, comp.ordem);
  }

  // NEOSSOLO, CHERNOSSOLO, PLANOSSOLO, LUVISSOLO, VERTISSOLO, ESPODOSSOLO, CAMBISSOLO, GLEISSOLO
  return tabelado(2, tabelaFallback, comp.ordem);
}

/**
 * Converte as propriedades brutas da camada `geonode:bra_erodibilidade_2024_sirgas2000`.
 */
export function parseErodibility2024Feature(
  props: Record<string, unknown>
): EmbrapaErodibility2024 | null {
  const codUm = texto(props["cod_um"]);
  const codUm2 = texto(props["cod_um2"]);
  const legenda = texto(props["legenda"]);
  const erodUm = texto(props["erod_um"]);
  if (!codUm && !codUm2 && !legenda && !erodUm) return null;

  const legendasComponentes = ["legenda_c1", "legenda_c2", "legenda_c3", "legenda_c4"]
    .map((k) => texto(props[k]))
    .filter((s) => s.length > 0);
  const ordensExtraidas = legendasComponentes
    .map((l) => extrairOrdemSibcsDeLegenda(l))
    .filter((s) => s.length > 0);
  const erodComponentes = ["erod_c1", "erod_c2", "erod_c3", "erod_c4"]
    .map((k) => texto(props[k]))
    .filter((s) => s.length > 0);

  // PROIBIÇÃO CRÍTICA D14 (U3): É VEDADO ler k_solos numericamente sem antes verificar erod_um.
  // Para categorias não-pedológicas ("Área urbana", "Corpo d'água"), a camada devolve k_solos = 0.
  const naoSolo =
    ehCategoriaNaoSolo(erodUm) ||
    ehCategoriaNaoSolo(erodComponentes[0] ?? "") ||
    ehCategoriaNaoSolo(legenda);
  const kSolosBruto = numeroOuNulo(props["k_solos"]);
  const kSolosValido = !naoSolo && kSolosBruto !== null && kSolosBruto > 0 ? kSolosBruto : null;

  return {
    ogcFid: numeroOuNulo(props["ogc_fid"]),
    codUm: codUm || codUm2,
    codUm2,
    legenda,
    legendasComponentes,
    ordensExtraidas,
    erodComponentes,
    erodUm,
    fatorKUm: texto(props["fator_k_um"]),
    kSolos: kSolosValido,
    kSolosBruto,
  };
}

/**
 * Converte as propriedades brutas da camada de solos na estrutura tipada, alimentando
 * `erod_c1..erod_c4` a partir da feição `geonode:bra_erodibilidade_2024_sirgas2000`
 * com verificação obrigatória de correspondência entre `legenda_c1..legenda_c4` e `ordem_1..ordem_3` (T2).
 */
export function parseSoilFeature(
  props: Record<string, unknown>,
  erod2024Props?: Record<string, unknown> | null
): EmbrapaSoilUnit | null {
  const sbcs = texto(props["sbcs"]);
  const legenda = texto(props["legenda"]);
  if (ehCategoriaNaoSolo(sbcs) || ehCategoriaNaoSolo(legenda)) {
    return null;
  }

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
  const ehAssociacao =
    tipoUnidade.toLowerCase() === "associacao" ||
    tipoUnidade.toLowerCase() === "associação" ||
    componentes.length > 1;

  const confianca: "alta" | "media" =
    tipoUnidade.toLowerCase() === "simples" && componentes.length === 1 ? "alta" : "media";

  const ordensPr = componentes.map((c) => extrairOrdemSibcsDeLegenda(c.ordem));
  const fonte2024 =
    erod2024Props ??
    (texto(props["erod_c1"]) || texto(props["legenda_c1"]) ? props : null);

  let kAmbiguoAssociacao = false;
  let correspondenciaCartas2024: "correspondente" | "divergente" | "sem-camada-2024" =
    "sem-camada-2024";
  let divergenciaEntreCartas2024 = false;
  let provenienciaK:
    | "tabelado"
    | "divergencia-entre-cartas"
    | "heuristica-fallback-nao-conferida"
    | "fora-do-dominio" = "heuristica-fallback-nao-conferida";
  let chaveProvenienciaK: string | null = null;
  let foraDoDominioSolo = false;

  if (fonte2024) {
    const erodUm2024 = texto(fonte2024["erod_um"]);
    const erodC1_2024 = texto(fonte2024["erod_c1"]);
    const leg2024 = texto(fonte2024["legenda"]);

    if (
      ehCategoriaNaoSolo(erodUm2024) ||
      ehCategoriaNaoSolo(erodC1_2024) ||
      ehCategoriaNaoSolo(leg2024)
    ) {
      foraDoDominioSolo = true;
      correspondenciaCartas2024 = "divergente";
      divergenciaEntreCartas2024 = true;
      provenienciaK = "fora-do-dominio";
      kAmbiguoAssociacao = true;
    } else {
      const legs2024 = ["legenda_c1", "legenda_c2", "legenda_c3", "legenda_c4"]
        .map((k) => texto(fonte2024[k]))
        .filter((s) => s.length > 0);
      const ordens2024 = legs2024
        .map((l) => extrairOrdemSibcsDeLegenda(l))
        .filter((s) => s.length > 0);

      const sequenciasCorrespondem =
        ordens2024.length === ordensPr.length &&
        ordensPr.every((ord, idx) => ord === ordens2024[idx]);

      if (sequenciasCorrespondem) {
        correspondenciaCartas2024 = "correspondente";
        divergenciaEntreCartas2024 = false;
        provenienciaK = "tabelado";
        const idUnidade2024 =
          texto(fonte2024["cod_um"]) ||
          texto(fonte2024["cod_um2"]) ||
          (fonte2024["ogc_fid"] !== undefined && fonte2024["ogc_fid"] !== null
            ? String(fonte2024["ogc_fid"])
            : LAYER_ERODIBILIDADE_2024);
        chaveProvenienciaK = erodC1_2024
          ? `${idUnidade2024}:erod_c1=${erodC1_2024}`
          : idUnidade2024;

        for (let i = 0; i < componentes.length; i++) {
          const chaveErod = `erod_c${componentes[i].posicao}`;
          componentes[i].erodibilidadeComponente2024 = texto(fonte2024[chaveErod]) || null;
        }

        const provDominante = classificarNivelEstratoKComponente(
          componentes[0],
          erodC1_2024 || undefined,
          { tabela: LAYER_ERODIBILIDADE_2024, chave: chaveProvenienciaK }
        );

        if (provDominante.estado === "indisponivel") {
          foraDoDominioSolo = true;
          provenienciaK = "fora-do-dominio";
          kAmbiguoAssociacao = true;
        } else if (ehAssociacao && componentes.length > 1) {
          for (let i = 1; i < componentes.length; i++) {
            const chaveErod = `erod_c${componentes[i].posicao}`;
            const erodSub = texto(fonte2024[chaveErod]);
            const provSub = classificarNivelEstratoKComponente(
              componentes[i],
              erodSub || undefined,
              { tabela: LAYER_ERODIBILIDADE_2024, chave: chaveProvenienciaK }
            );
            if (provSub.estado === "indisponivel") {
              foraDoDominioSolo = true;
              provenienciaK = "fora-do-dominio";
              kAmbiguoAssociacao = true;
              break;
            }
            if (provSub.valor !== provDominante.valor) {
              kAmbiguoAssociacao = true;
              break;
            }
          }
        }
      } else {
        // T2.3: As sequências de componentes entre a carta estadual e a carta nacional 2024 NÃO correspondem.
        // Não pareia por posição: marca kAmbiguoAssociacao = true de forma conservadora e registra divergência entre cartas.
        for (const comp of componentes) {
          comp.erodibilidadeComponente2024 = null;
        }
        correspondenciaCartas2024 = "divergente";
        divergenciaEntreCartas2024 = true;
        provenienciaK = "divergencia-entre-cartas";
        kAmbiguoAssociacao = true;
      }
    }
  } else {
    // Fallback declarado: quando a camada de 2024 não cobre o ponto ou não foi fornecida
    for (const comp of componentes) {
      comp.erodibilidadeComponente2024 = null;
    }
    correspondenciaCartas2024 = "sem-camada-2024";
    divergenciaEntreCartas2024 = false;
    provenienciaK = "heuristica-fallback-nao-conferida";

    const provDominante = classificarNivelEstratoKComponente(componentes[0]);
    if (provDominante.estado === "indisponivel") {
      foraDoDominioSolo = true;
      provenienciaK = "fora-do-dominio";
    } else if (ehAssociacao && componentes.length > 1) {
      for (let i = 1; i < componentes.length; i++) {
        const provSub = classificarNivelEstratoKComponente(componentes[i]);
        if (provSub.estado === "indisponivel") {
          foraDoDominioSolo = true;
          provenienciaK = "fora-do-dominio";
          kAmbiguoAssociacao = true;
          break;
        }
        if (provSub.valor !== provDominante.valor) {
          kAmbiguoAssociacao = true;
          break;
        }
      }
    }
  }

  return {
    sbcs,
    legenda,
    tipoUnidade,
    componentes,
    areaKm2: numeroOuNulo(props["area_km2"]),
    confianca,
    kAmbiguoAssociacao,
    correspondenciaCartas2024,
    divergenciaEntreCartas2024,
    provenienciaK,
    chaveProvenienciaK,
    foraDoDominioSolo,
  };
}

/** Converte as propriedades brutas da camada de erodibilidade (`geonode:brasil_erodibilidade_solo`). */
export function parseErodibilityFeature(
  props: Record<string, unknown>
): EmbrapaErodibility | null {
  const classe = texto(props["classe"]);
  if (!classe) return null;
  return { classe, codnum: numeroOuNulo(props["codnum"]) };
}

function feicaoSoloPrTemSoloMapeado(props: Record<string, unknown>): boolean {
  const sbcs = texto(props["sbcs"]);
  const legenda = texto(props["legenda"]);
  const ordem1 = texto(props["ordem_1"]);
  if (!ordem1) return false;
  if (ehCategoriaNaoSolo(sbcs) || ehCategoriaNaoSolo(legenda) || ehCategoriaNaoSolo(ordem1)) {
    return false;
  }
  return true;
}

function feicaoErod2024TemSoloMapeado(props: Record<string, unknown>): boolean {
  const erodUm = texto(props["erod_um"]);
  const erodC1 = texto(props["erod_c1"]);
  const legenda = texto(props["legenda"]);
  const legendaC1 = texto(props["legenda_c1"]);
  if (
    ehCategoriaNaoSolo(erodUm) ||
    ehCategoriaNaoSolo(erodC1) ||
    ehCategoriaNaoSolo(legenda) ||
    ehCategoriaNaoSolo(legendaC1)
  ) {
    return false;
  }
  return Boolean(legendaC1 || erodC1 || erodUm);
}

function feicaoErodBrTemSoloMapeado(props: Record<string, unknown>): boolean {
  const classe = texto(props["classe"]);
  if (!classe || ehCategoriaNaoSolo(classe)) return false;
  return true;
}

function resultadoBase(lat: number, lng: number): EmbrapaSoilQueryResult {
  return {
    statusSolo: "servico-indisponivel",
    statusErodibilidade: "servico-indisponivel",
    statusErodibilidade2024: "servico-indisponivel",
    motivo: null,
    solo: null,
    erodibilidade: null,
    erodibilidade2024: null,
    foraDoDominioSolo: false,
    motivoForaDoDominioSolo: null,
    pontoEmFronteiraPedologica: false,
    totalFeicoesSoloRetornadas: 0,
    indiceFeicaoSoloEscolhida: null,
    feicaoSoloEscolhidaId: null,
    totalFeicoesErod2024Retornadas: 0,
    indiceFeicaoErod2024Escolhida: null,
    feicaoErod2024EscolhidaId: null,
    proveniencia: {
      servico: EMBRAPA_OWS_URL,
      camadaSolo: LAYER_SOLOS_PR,
      camadaErodibilidade: LAYER_ERODIBILIDADE_BR,
      camadaErodibilidade2024: LAYER_ERODIBILIDADE_2024,
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
 * Consulta a classe pedológica e as duas camadas de erodibilidade de uma coordenada.
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

  resultado.statusSolo = "sem-cobertura";
  resultado.statusErodibilidade = "sem-cobertura";
  resultado.statusErodibilidade2024 = "sem-cobertura";

  // U1.1: Coleta TODAS as feições de cada camada devolvidas na resposta
  const feicoesSoloPr: Array<{ id: string; props: Record<string, unknown> }> = [];
  const feicoesErodBr: Array<{ id: string; props: Record<string, unknown> }> = [];
  const feicoesErod2024: Array<{ id: string; props: Record<string, unknown> }> = [];

  for (const f of features) {
    const id = typeof f?.id === "string" ? f.id : "";
    const props = (f?.properties ?? {}) as Record<string, unknown>;

    if (id.startsWith("parana_solos_")) {
      feicoesSoloPr.push({ id, props });
    } else if (id.startsWith("brasil_erodibilidade_solo")) {
      feicoesErodBr.push({ id, props });
    } else if (id.startsWith("bra_erodibilidade_2024")) {
      feicoesErod2024.push({ id, props });
    }
  }

  // U1.3 e U1.5: Registra total de feições e marcador de ponto em fronteira cartográfica
  resultado.totalFeicoesSoloRetornadas = feicoesSoloPr.length;
  resultado.pontoEmFronteiraPedologica = feicoesSoloPr.length > 1;
  resultado.totalFeicoesErod2024Retornadas = feicoesErod2024.length;

  let propsSoloPr: Record<string, unknown> | null = null;
  let propsErod2024: Record<string, unknown> | null = null;
  const motivosNaoSolo: string[] = [];

  // U1.2 e U1.4: Preferência pela feição com solo mapeado em parana_solos_20201105
  if (feicoesSoloPr.length > 0) {
    const idxComSolo = feicoesSoloPr.findIndex((f) => feicaoSoloPrTemSoloMapeado(f.props));
    const idxEscolhido = idxComSolo >= 0 ? idxComSolo : 0;
    const escolhida = feicoesSoloPr[idxEscolhido];
    propsSoloPr = escolhida.props;
    resultado.indiceFeicaoSoloEscolhida = idxEscolhido;
    resultado.feicaoSoloEscolhidaId = escolhida.id || texto(escolhida.props["sbcs"]);

    if (idxComSolo < 0) {
      // NENHUMA das feições de parana_solos_ tem solo mapeado
      const sbcsBruto = texto(escolhida.props["sbcs"]) || "sem-ordem_1";
      motivosNaoSolo.push(`parana_solos_20201105 reportou '${sbcsBruto}' em todas as feições`);
    }
  }

  // U1.2 e U1.4: Preferência pela feição com solo mapeado em brasil_erodibilidade_solo
  if (feicoesErodBr.length > 0) {
    const idxComSolo = feicoesErodBr.findIndex((f) => feicaoErodBrTemSoloMapeado(f.props));
    const idxEscolhido = idxComSolo >= 0 ? idxComSolo : 0;
    const escolhida = feicoesErodBr[idxEscolhido];
    const ero = parseErodibilityFeature(escolhida.props);
    if (ero) {
      resultado.erodibilidade = ero;
      resultado.statusErodibilidade = "encontrado";
      if (idxComSolo < 0 && ehCategoriaNaoSolo(ero.classe)) {
        motivosNaoSolo.push(`brasil_erodibilidade_solo reportou '${ero.classe}' em todas as feições`);
      }
    }
  }

  // U1.2 e U1.4: Preferência pela feição com solo mapeado em bra_erodibilidade_2024_sirgas2000
  if (feicoesErod2024.length > 0) {
    const idxComSolo = feicoesErod2024.findIndex((f) => feicaoErod2024TemSoloMapeado(f.props));
    const idxEscolhido = idxComSolo >= 0 ? idxComSolo : 0;
    const escolhida = feicoesErod2024[idxEscolhido];
    propsErod2024 = escolhida.props;
    resultado.indiceFeicaoErod2024Escolhida = idxEscolhido;
    resultado.feicaoErod2024EscolhidaId =
      texto(escolhida.props["cod_um"]) ||
      texto(escolhida.props["cod_um2"]) ||
      escolhida.id;

    const ero24 = parseErodibility2024Feature(escolhida.props);
    if (ero24) {
      resultado.erodibilidade2024 = ero24;
      resultado.statusErodibilidade2024 = "encontrado";
      if (
        idxComSolo < 0 &&
        (ehCategoriaNaoSolo(ero24.erodUm) || ehCategoriaNaoSolo(ero24.erodComponentes[0] ?? ""))
      ) {
        motivosNaoSolo.push(
          `bra_erodibilidade_2024_sirgas2000 reportou '${ero24.erodUm || ero24.erodComponentes[0]}' em todas as feições`
        );
      }
    }
  }

  if (propsSoloPr) {
    const solo = parseSoilFeature(propsSoloPr, propsErod2024);
    if (solo) {
      resultado.solo = solo;
      resultado.statusSolo = "encontrado";
      if (solo.foraDoDominioSolo) {
        motivosNaoSolo.push("Unidade classificada fora do domínio pedológico de K");
      }
    }
  }

  if (motivosNaoSolo.length > 0) {
    resultado.foraDoDominioSolo = true;
    resultado.motivoForaDoDominioSolo = motivosNaoSolo.join("; ");
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
