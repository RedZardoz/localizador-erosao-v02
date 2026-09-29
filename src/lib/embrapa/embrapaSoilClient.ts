/**
 * ============================================================================
 * Cliente de Consulta Pedológica e de Erodibilidade — Embrapa GeoInfo
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * DIVISÃO DE RESPONSABILIDADES ENTRE OPERAÇÕES OGC (V1 e V2 — 28/09/2026)
 * 1. ATRIBUIÇÃO PEDOLÓGICA DETERMINÍSTICA POR PONTO-EM-POLÍGONO (V1):
 *    - Operação: OGC WFS 1.1.0 `GetFeature` (`buildGetFeaturePointInPolygonUrl`)
 *    - Filtro espacial: `CQL_FILTER=INTERSECTS(geometry, POINT(<lat> <lon>))` para cada
 *      uma das 3 camadas (`parana_solos_20201105`, `bra_erodibilidade_2024_sirgas2000`,
 *      `brasil_erodibilidade_solo`), separados por `;`.
 *    - Ordem de eixos travada na WFS 1.1.0: `POINT(<lat> <lon>)` (inverter para `POINT(<lon> <lat>)`
 *      devolve zero feições silenciosamente).
 *    - Autoridade de atribuição: devolve exatamente o polígono que contém a coordenada (<= 1 feição
 *      por camada). Se retornar > 1 feição na mesma camada, a coordenada está exatamente sobre a
 *      fronteira compartilhada entre polígonos e recebe `indisponivel("insuficiente", ...)` sem desempate.
 *
 * 2. DIAGNÓSTICO DE PROXIMIDADE DE FRONTEIRA CARTOGRÁFICA POR BBOX (V2):
 *    - Operação: OGC WMS 1.1.1 `GetFeatureInfo` com caixa `bbox` de ~110 m (`buildGetFeatureInfoUrl` /
 *      `diagnosticarFronteiraPedologicaBbox`).
 *    - Computa `pontoEmFronteiraPedologica: Proveniencia<boolean>` para os candidatos que chegam
 *      ao sorteio e para os 36 polígonos sorteados. Quando não computado, permanece obrigatoriamente
 *      `indisponivel("nao-calculado", ...)` — nunca `false`.
 *
 * PRINCÍPIO DE PROJETO — DADO VERDADEIRO OU AUSÊNCIA DECLARADA
 * Este módulo NUNCA inventa, estima ou infere um valor. Em qualquer situação
 * em que o dado não puder ser obtido, o retorno traz `status` explícito e o
 * motivo textual. Não existe valor padrão. Ausência de cobertura, falha de
 * rede e resposta malformada são estados DISTINTOS e nunca são colapsados.
 */

import { Proveniencia, medido, tabelado, indisponivel } from "@/types/proveniencia";

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

/** Causas distintas e nomeadas para zero feições ou rejeição na atribuição por ponto-em-polígono (V1.3 / V3.1). */
export type CausaZeroFeicoesEmbrapa =
  | "fora-cobertura-camada-estadual"
  | "dentro-cobertura-lacuna-ou-agua"
  | "dentro-cobertura-categoria-nao-solo"
  | "fronteira-compartilhada-exata";

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
  /** Indica se a coordenada caiu em categoria não-solo, lacuna ou água (V3.1 / T3). */
  foraDoDominioSolo?: boolean;
  motivoForaDoDominioSolo?: string | null;
  /** Indica se o ponto caiu exatamente sobre a fronteira compartilhada de >=2 polígonos na mesma camada no WFS 1.1.0 INTERSECTS (V1.3). */
  fronteiraCompartilhadaExata?: boolean;
  /** Causa nomeada quando o ponto devolve zero feições de solo, categoria não-solo ou fronteira exata (V1.3 / V3.1). */
  causaZeroFeicoes?: CausaZeroFeicoesEmbrapa | null;
  /** Proveniência formal da atribuição pedológica pontual (medido quando 1 polígono de solo válido; indisponivel caso contrário). */
  provenienciaAtribuicao?: Proveniencia<string>;
  /**
   * Marcador de fronteira cartográfica (V2.1 e V2.2):
   * - `medido(true/false, ...)` quando conferido por consulta bbox (`WMS GetFeatureInfo` ~110 m) ou fronteira exata (`>1` feição no PIP).
   * - `indisponivel("nao-calculado", ...)` quando não computado. NUNCA é `false` por indisponibilidade.
   */
  pontoEmFronteiraPedologica: Proveniencia<boolean>;
  /** Quantidade total de feições retornadas pela camada parana_solos_20201105 na consulta de atribuição. */
  totalFeicoesSoloRetornadas?: number;
  /** Índice (0-based) da feição escolhida em parana_solos_20201105 (0 quando há 1 feição; null se 0 ou >1). */
  indiceFeicaoSoloEscolhida?: number | null;
  /** Identificador (id ou sbcs) da feição escolhida em parana_solos_20201105. */
  feicaoSoloEscolhidaId?: string | null;
  /** Quantidade total de feições retornadas pela camada bra_erodibilidade_2024_sirgas2000 na consulta de atribuição. */
  totalFeicoesErod2024Retornadas?: number;
  /** Índice (0-based) da feição escolhida em bra_erodibilidade_2024_sirgas2000. */
  indiceFeicaoErod2024Escolhida?: number | null;
  /** Identificador (cod_um / cod_um2 / id) da feição escolhida em bra_erodibilidade_2024_sirgas2000. */
  feicaoErod2024EscolhidaId?: string | null;
  /** Quantidade total de feições retornadas pela camada brasil_erodibilidade_solo na consulta de atribuição. */
  totalFeicoesErodBrRetornadas?: number;
  /** Proveniência: o que foi consultado, onde e quando. */
  proveniencia: {
    servico: string;
    operacaoAtribuicao?: string;
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

function cacheKey(lat: number, lng: number, computarFronteiraBbox: boolean): string {
  return `${lat.toFixed(CACHE_GRID_DECIMALS)},${lng.toFixed(CACHE_GRID_DECIMALS)},bbox=${computarFronteiraBbox ? 1 : 0}`;
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
 * Monta a URL determinística de atribuição por ponto-em-polígono (V1.1 / PARTE I):
 * Operação OGC WFS 1.1.0 `GetFeature` nas três camadas em uma única requisição,
 * usando três filtros `INTERSECTS(geometry, POINT(<lat> <lon>))` separados por `;`
 * na mesma ordem de `typeName`:
 *   1. `geonode:parana_solos_20201105`
 *   2. `geonode:bra_erodibilidade_2024_sirgas2000`
 *   3. `geonode:brasil_erodibilidade_solo`
 *
 * ATENÇÃO CRÍTICA À ORDEM DOS EIXOS (PARTE I / V3.2):
 * Na versão WFS `1.1.0`, a ordem exigida pelo GeoServer da Embrapa é `POINT(<lat> <lon>)`.
 * Adotar `POINT(<lon> <lat>)` na WFS 1.1.0 devolve zero feições silenciosamente sem erro HTTP.
 */
export function buildGetFeaturePointInPolygonUrl(lat: number, lng: number): string {
  const typeName = `${LAYER_SOLOS_PR},${LAYER_ERODIBILIDADE_2024},${LAYER_ERODIBILIDADE_BR}`;
  const cqlSingle = `INTERSECTS(geometry, POINT(${lat} ${lng}))`;
  const cqlFilter = `${cqlSingle};${cqlSingle};${cqlSingle}`;
  const params = new URLSearchParams({
    service: "WFS",
    version: "1.1.0",
    request: "GetFeature",
    typeName,
    outputFormat: "application/json",
    CQL_FILTER: cqlFilter,
  });
  return `${EMBRAPA_OWS_URL}?${params.toString()}`;
}

/**
 * Monta a URL de GetFeatureInfo com caixa de consulta (`bbox` de ~110 m) para as três camadas.
 *
 * PAPEL METODOLÓGICO APÓS V1/V2 (28/09/2026):
 * Não governa mais a atribuição pedológica (que é feita por `buildGetFeaturePointInPolygonUrl`).
 * Mantida especificamente para o diagnóstico de proximidade de fronteira cartográfica
 * (`diagnosticarFronteiraPedologicaBbox` — PARTE III / V2) nos candidatos que chegam ao sorteio
 * e nos 36 polígonos sorteados.
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

/**
 * Auxiliar mantido EXCLUSIVAMENTE para o diagnóstico de fronteira por bbox (`diagnosticarFronteiraPedologicaBbox` — PARTE III / V2.2).
 *
 * PAPEL APÓS V1.4 (28/09/2026):
 * Deixou de governar a atribuição em `queryEmbrapaSoil`, pois a atribuição é agora determinística
 * por ponto-em-polígono (`WFS 1.1.0 GetFeature INTERSECTS(geometry, POINT(lat lon))`), que retorna
 * o único polígono que contém a coordenada. Serve apenas para distinguir no bbox de ~110 m se a
 * fronteira vizinha ocorre entre duas unidades de solo ou entre solo e corpo d'água/área urbana.
 */
export function feicaoSoloPrTemSoloMapeado(props: Record<string, unknown>): boolean {
  const sbcs = texto(props["sbcs"]);
  const legenda = texto(props["legenda"]);
  const ordem1 = texto(props["ordem_1"]);
  if (!ordem1) return false;
  if (ehCategoriaNaoSolo(sbcs) || ehCategoriaNaoSolo(legenda) || ehCategoriaNaoSolo(ordem1)) {
    return false;
  }
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
    fronteiraCompartilhadaExata: false,
    causaZeroFeicoes: null,
    provenienciaAtribuicao: indisponivel(
      "nao-calculado",
      "Atribuição pedológica ainda não realizada."
    ),
    pontoEmFronteiraPedologica: indisponivel(
      "nao-calculado",
      "Diagnóstico de fronteira por bbox restrito aos candidatos que chegam ao sorteio e aos 36 polígonos sorteados (V2.1/V2.2); atribuição realizada por ponto-em-polígono WFS 1.1.0."
    ),
    totalFeicoesSoloRetornadas: 0,
    indiceFeicaoSoloEscolhida: null,
    feicaoSoloEscolhidaId: null,
    totalFeicoesErod2024Retornadas: 0,
    indiceFeicaoErod2024Escolhida: null,
    feicaoErod2024EscolhidaId: null,
    totalFeicoesErodBrRetornadas: 0,
    proveniencia: {
      servico: EMBRAPA_OWS_URL,
      operacaoAtribuicao: "WFS 1.1.0 GetFeature INTERSECTS(geometry, POINT(lat lon))",
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
  /**
   * Quando `true`, executa também a consulta WMS 1.1.1 GetFeatureInfo com bbox (~110 m)
   * para computar `pontoEmFronteiraPedologica: medido(true/false, ...)` (PARTE III / V2.2).
   * Restrito aos candidatos que chegam ao sorteio e aos 36 polígonos sorteados.
   * Quando omitido ou `false`, `pontoEmFronteiraPedologica` permanece `indisponivel("nao-calculado", ...)` — nunca `false`.
   */
  computarFronteiraBbox?: boolean;
}

export interface DiagnosticoFronteiraBboxResult {
  pontoEmFronteiraPedologica: Proveniencia<boolean>;
  totalFeicoesSoloBbox: number;
  totalFeicoesErod2024Bbox: number;
  fronteiraComNaoSoloBbox: boolean;
  fronteiraEntreSolosBbox: boolean;
}

/**
 * Executa a consulta com caixa de vizinhança (`WMS 1.1.1 GetFeatureInfo`, bbox ~110 m)
 * exclusivamente para diagnosticar proximidade de fronteira cartográfica (`V2.1` e `V2.2`).
 *
 * - `medido(true, ...)` quando o bbox intercepta >1 feição em `parana_solos_20201105` ou `bra_erodibilidade_2024_sirgas2000`.
 * - `medido(false, ...)` quando o bbox foi conferido e intercepta no máximo 1 feição por camada.
 * - `indisponivel("erro-de-consulta", ...)` quando a requisição falha (nunca retorna `false` por indisponibilidade).
 */
export async function diagnosticarFronteiraPedologicaBbox(
  lat: number,
  lng: number,
  options: { timeoutMs?: number } = {}
): Promise<DiagnosticoFronteiraBboxResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  try {
    const res = await fetch(buildGetFeatureInfoUrl(lat, lng), {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return {
        pontoEmFronteiraPedologica: indisponivel(
          "servico-indisponivel",
          `Diagnóstico de fronteira via WMS GetFeatureInfo retornou HTTP ${res.status}.`
        ),
        totalFeicoesSoloBbox: 0,
        totalFeicoesErod2024Bbox: 0,
        fronteiraComNaoSoloBbox: false,
        fronteiraEntreSolosBbox: false,
      };
    }
    const payload = (await res.json()) as { features?: GeoJsonFeature[] };
    const features = Array.isArray(payload?.features) ? payload.features : [];
    const feicoesSoloPrBbox: Array<Record<string, unknown>> = [];
    const feicoesErod2024Bbox: Array<Record<string, unknown>> = [];

    for (const f of features) {
      const id = typeof f?.id === "string" ? f.id : "";
      const props = (f?.properties ?? {}) as Record<string, unknown>;
      if (id.startsWith("parana_solos_")) {
        feicoesSoloPrBbox.push(props);
      } else if (id.startsWith("bra_erodibilidade_2024")) {
        feicoesErod2024Bbox.push(props);
      }
    }

    const emFronteira = feicoesSoloPrBbox.length > 1 || feicoesErod2024Bbox.length > 1;
    const qtdComSoloPr = feicoesSoloPrBbox.filter((p) => feicaoSoloPrTemSoloMapeado(p)).length;
    const fronteiraComNaoSoloBbox =
      feicoesSoloPrBbox.length > 1 && qtdComSoloPr > 0 && qtdComSoloPr < feicoesSoloPrBbox.length;
    const fronteiraEntreSolosBbox = feicoesSoloPrBbox.length > 1 && qtdComSoloPr >= 2;

    return {
      pontoEmFronteiraPedologica: medido(
        emFronteira,
        `WMS 1.1.1 GetFeatureInfo bbox ~110m (n_pr=${feicoesSoloPrBbox.length}, n_2024=${feicoesErod2024Bbox.length})`
      ),
      totalFeicoesSoloBbox: feicoesSoloPrBbox.length,
      totalFeicoesErod2024Bbox: feicoesErod2024Bbox.length,
      fronteiraComNaoSoloBbox,
      fronteiraEntreSolosBbox,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      pontoEmFronteiraPedologica: indisponivel(
        "servico-indisponivel",
        `Falha ao consultar bbox WMS GetFeatureInfo para diagnóstico de fronteira: ${msg}`
      ),
      totalFeicoesSoloBbox: 0,
      totalFeicoesErod2024Bbox: 0,
      fronteiraComNaoSoloBbox: false,
      fronteiraEntreSolosBbox: false,
    };
  }
}

/**
 * Consulta determinística da unidade pedológica e das duas camadas de erodibilidade
 * por ponto-em-polígono (`WFS 1.1.0 GetFeature INTERSECTS(geometry, POINT(lat lon))` — PARTE II / V1).
 */
export async function queryEmbrapaSoil(
  lat: number,
  lng: number,
  options: EmbrapaQueryOptions = {}
): Promise<EmbrapaSoilQueryResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    const r = resultadoBase(lat, lng);
    r.motivo = `Coordenada inválida (${lat}, ${lng}). Nenhuma consulta foi realizada.`;
    r.provenienciaAtribuicao = indisponivel("servico-indisponivel", r.motivo);
    return r;
  }

  const computarFronteiraBbox = Boolean(options.computarFronteiraBbox);
  const key = cacheKey(lat, lng, computarFronteiraBbox);
  if (!options.forceRefresh) {
    const hit = cache.get(key);
    if (hit) return hit;
  }

  const resultado = resultadoBase(lat, lng);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let payload: { features?: GeoJsonFeature[] };
  try {
    const res = await fetch(buildGetFeaturePointInPolygonUrl(lat, lng), {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      resultado.motivo = `Serviço GeoInfo da Embrapa (WFS 1.1.0 GetFeature) retornou HTTP ${res.status}. Nada se afirma sobre esta coordenada.`;
      resultado.provenienciaAtribuicao = indisponivel("servico-indisponivel", resultado.motivo);
      return resultado;
    }
    payload = await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    resultado.motivo = `Falha ao consultar o serviço GeoInfo da Embrapa (WFS 1.1.0 GetFeature): ${msg}. Nada se afirma sobre esta coordenada.`;
    resultado.provenienciaAtribuicao = indisponivel("servico-indisponivel", resultado.motivo);
    return resultado;
  }

  const features = Array.isArray(payload?.features) ? payload.features : [];

  resultado.statusSolo = "sem-cobertura";
  resultado.statusErodibilidade = "sem-cobertura";
  resultado.statusErodibilidade2024 = "sem-cobertura";

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

  resultado.totalFeicoesSoloRetornadas = feicoesSoloPr.length;
  resultado.totalFeicoesErod2024Retornadas = feicoesErod2024.length;
  resultado.totalFeicoesErodBrRetornadas = feicoesErodBr.length;

  // V1.3: Mais de uma feição na mesma camada significa que a coordenada caiu EXATAMENTE
  // sobre a fronteira compartilhada de dois polígonos (INTERSECTS inclui o contorno).
  // Vedado escolher por ordem de retorno: trata-se como indisponivel("insuficiente", ...).
  if (feicoesSoloPr.length > 1 || feicoesErod2024.length > 1 || feicoesErodBr.length > 1) {
    const msgFronteiraExata =
      `Coordenada (${lat}, ${lng}) está exatamente sobre a fronteira compartilhada entre polígonos ` +
      `(WFS 1.1.0 INTERSECTS retornou n_pr=${feicoesSoloPr.length}, n_2024=${feicoesErod2024.length}, n_br=${feicoesErodBr.length}); ` +
      `vedado desempate por ordem de retorno (V1.3).`;
    resultado.fronteiraCompartilhadaExata = true;
    resultado.causaZeroFeicoes = "fronteira-compartilhada-exata";
    resultado.motivo = msgFronteiraExata;
    resultado.provenienciaAtribuicao = indisponivel("insuficiente", msgFronteiraExata);
    resultado.pontoEmFronteiraPedologica = medido(
      true,
      `WFS 1.1.0 GetFeature INTERSECTS (>1 feição na mesma camada: n_pr=${feicoesSoloPr.length}, n_2024=${feicoesErod2024.length}, n_br=${feicoesErodBr.length})`
    );
    cache.set(key, resultado);
    return resultado;
  }

  let propsSoloPr: Record<string, unknown> | null = null;
  let propsErod2024: Record<string, unknown> | null = null;
  const motivosNaoSolo: string[] = [];

  if (feicoesSoloPr.length === 1) {
    const unica = feicoesSoloPr[0];
    propsSoloPr = unica.props;
    resultado.indiceFeicaoSoloEscolhida = 0;
    resultado.feicaoSoloEscolhidaId = unica.id || texto(unica.props["sbcs"]);

    const sbcsBruto = texto(unica.props["sbcs"]);
    const legendaBruta = texto(unica.props["legenda"]);
    const ordem1Bruta = texto(unica.props["ordem_1"]);
    if (!ordem1Bruta || ehCategoriaNaoSolo(sbcsBruto) || ehCategoriaNaoSolo(legendaBruta) || ehCategoriaNaoSolo(ordem1Bruta)) {
      motivosNaoSolo.push(
        `parana_solos_20201105 reportou categoria não-solo '${sbcsBruto || legendaBruta || "sem-ordem_1"}'`
      );
    }
  }

  if (feicoesErodBr.length === 1) {
    const unica = feicoesErodBr[0];
    const ero = parseErodibilityFeature(unica.props);
    if (ero) {
      resultado.erodibilidade = ero;
      resultado.statusErodibilidade = "encontrado";
      if (ehCategoriaNaoSolo(ero.classe)) {
        motivosNaoSolo.push(`brasil_erodibilidade_solo reportou categoria não-solo '${ero.classe}'`);
      }
    }
  }

  if (feicoesErod2024.length === 1) {
    const unica = feicoesErod2024[0];
    propsErod2024 = unica.props;
    resultado.indiceFeicaoErod2024Escolhida = 0;
    resultado.feicaoErod2024EscolhidaId =
      texto(unica.props["cod_um"]) ||
      texto(unica.props["cod_um2"]) ||
      unica.id;

    const ero24 = parseErodibility2024Feature(unica.props);
    if (ero24) {
      resultado.erodibilidade2024 = ero24;
      resultado.statusErodibilidade2024 = "encontrado";
      if (
        ehCategoriaNaoSolo(ero24.erodUm) ||
        ehCategoriaNaoSolo(ero24.erodComponentes[0] ?? "") ||
        ero24.kSolosBruto === 0
      ) {
        motivosNaoSolo.push(
          `bra_erodibilidade_2024_sirgas2000 reportou categoria não-solo '${ero24.erodUm || "k_solos=0"}'`
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

  // V3.1: Tratamento de zero feições e categorias não-solo com causas distintas e nomeadas
  if (feicoesSoloPr.length === 0) {
    const dentroRetanguloParana =
      lat >= -26.75 && lat <= -22.5 && lng >= -54.65 && lng <= -48.0;
    const nacionalTemSolo =
      (resultado.erodibilidade2024 !== null &&
        resultado.erodibilidade2024 !== undefined &&
        resultado.erodibilidade2024.kSolos !== null &&
        resultado.erodibilidade2024.kSolos > 0) ||
      (resultado.erodibilidade !== null && !ehCategoriaNaoSolo(resultado.erodibilidade.classe));

    if (nacionalTemSolo || !dentroRetanguloParana) {
      resultado.causaZeroFeicoes = "fora-cobertura-camada-estadual";
      resultado.provenienciaAtribuicao = indisponivel(
        "sem-cobertura",
        "Zero feições na carta estadual geonode:parana_solos_20201105 (coordenada fora da cobertura da camada estadual do Paraná — V3.1)."
      );
    } else {
      resultado.causaZeroFeicoes = "dentro-cobertura-lacuna-ou-agua";
      resultado.foraDoDominioSolo = true;
      resultado.motivoForaDoDominioSolo =
        motivosNaoSolo.length > 0
          ? motivosNaoSolo.join("; ")
          : "Zero feições de solo nas três camadas dentro do domínio do Paraná (coordenada sobre lâmina d'água ou lacuna do mapeamento cartográfico — V3.1).";
      resultado.provenienciaAtribuicao = indisponivel(
        "fora-do-dominio",
        resultado.motivoForaDoDominioSolo
      );
    }
  } else if (motivosNaoSolo.length > 0 || !resultado.solo) {
    resultado.causaZeroFeicoes = "dentro-cobertura-categoria-nao-solo";
    resultado.foraDoDominioSolo = true;
    resultado.motivoForaDoDominioSolo = motivosNaoSolo.join("; ");
    resultado.provenienciaAtribuicao = indisponivel(
      "fora-do-dominio",
      resultado.motivoForaDoDominioSolo
    );
  } else {
    resultado.provenienciaAtribuicao = medido(
      resultado.solo.sbcs,
      `WFS 1.1.0 GetFeature INTERSECTS(geometry, POINT(${lat} ${lng})) -> ${resultado.feicaoSoloEscolhidaId}`
    );
  }

  if (computarFronteiraBbox) {
    const diagBbox = await diagnosticarFronteiraPedologicaBbox(lat, lng, { timeoutMs });
    resultado.pontoEmFronteiraPedologica = diagBbox.pontoEmFronteiraPedologica;
  }

  const pendencias: string[] = [];
  if (resultado.statusSolo === "sem-cobertura") {
    if (resultado.causaZeroFeicoes === "dentro-cobertura-lacuna-ou-agua") {
      pendencias.push(
        "Zero feições de solo mapeado na coordenada na carta do Estado do Paraná (lâmina d'água ou lacuna do mapeamento cartográfico)."
      );
    } else {
      pendencias.push(
        "Carta de solos sem cobertura nesta coordenada (a camada abrange apenas o Estado do Paraná)."
      );
    }
  }
  if (resultado.statusErodibilidade === "sem-cobertura") {
    pendencias.push("Carta de erodibilidade sem cobertura nesta coordenada.");
  }
  resultado.motivo = pendencias.length > 0 ? pendencias.join(" ") : null;

  cache.set(key, resultado);
  return resultado;
}

/**
 * Limiar máximo permitido para a fração de candidatos que devolvem zero feições
 * nas três camadas num lote de consulta ao GeoServer da Embrapa (`V3.4`).
 *
 * JUSTIFICATIVA:
 * No domínio terrestre da Bacia Hidrográfica do Paraná 3 (quadro amostral já filtrado
 * por cobertura agrícola/pastagem `WorldCover v100 ∩ v200 ∈ {30, 40}`), as três camadas
 * da Embrapa cobrem quase 100% das coordenadas terrestres (0/20 pontos rurais com zero
 * feições na campanha medida). Uma fração de zero feições superior a 50% (`0.50`) em um
 * lote com ao menos 5 pontos é fisicamente incompatível com a cobertura cartográfica da
 * bacia e constitui a assinatura inequívoca de inversão da ordem dos eixos (`POINT(lon lat)`
 * em vez de `POINT(lat lon)` na WFS 1.1.0).
 */
export const LIMIAR_MAXIMO_FRACAO_ZERO_FEICOES_LOTE = 0.5;
export const MINIMO_PONTOS_GUARDA_SANIDADE_WFS = 5;

export class ErroSanidadeEixosWfsEmbrapa extends Error {
  constructor(
    public readonly totalConsultados: number,
    public readonly totalZeroFeicoes: number,
    public readonly fracaoZeroFeicoes: number,
    public readonly limiarMaximo: number
  ) {
    super(
      `[GUARDA DE SANIDADE WFS 1.1.0 EMBRAPA — V3.4] Abortando lote: ${totalZeroFeicoes} de ${totalConsultados} ` +
        `candidatos (${(fracaoZeroFeicoes * 100).toFixed(1)}%) devolveram ZERO feições nas três camadas, ` +
        `excedendo o limiar máximo de ${(limiarMaximo * 100).toFixed(1)}%. ` +
        `Suspeita crítica de inversão de eixos na consulta WFS 1.1.0 (verifique se CQL_FILTER usa POINT(<lat> <lon>) e não POINT(<lon> <lat>)).`
    );
    this.name = "ErroSanidadeEixosWfsEmbrapa";
  }
}

/**
 * Verifica a sanidade de um lote de consultas `queryEmbrapaSoil` contra esvaziamento silencioso
 * por inversão da ordem dos eixos na WFS 1.1.0 (`V3.4`).
 *
 * Se o lote tiver ao menos `minimoPontos` consultas respondidas pelo serviço e a fração de
 * coordenadas com zero feições nas três camadas (`!r.totalFeicoesSoloRetornadas && !r.totalFeicoesErod2024Retornadas && !r.totalFeicoesErodBrRetornadas`)
 * exceder `limiarMaximo` (padrão `0.50`), lança `ErroSanidadeEixosWfsEmbrapa`.
 */
export function verificarSanidadeZeroFeicoesLoteEmbrapa(
  resultados: EmbrapaSoilQueryResult[],
  limiarMaximo: number = LIMIAR_MAXIMO_FRACAO_ZERO_FEICOES_LOTE,
  minimoPontos: number = MINIMO_PONTOS_GUARDA_SANIDADE_WFS
): {
  totalRespondidos: number;
  totalZeroFeicoesNasTresCamadas: number;
  fracaoZeroFeicoes: number;
} {
  const respondidos = resultados.filter((r) => r.statusSolo !== "servico-indisponivel");
  const totalRespondidos = respondidos.length;
  const totalZeroFeicoesNasTresCamadas = respondidos.filter(
    (r) =>
      !r.totalFeicoesSoloRetornadas &&
      !r.totalFeicoesErod2024Retornadas &&
      !r.totalFeicoesErodBrRetornadas
  ).length;

  const fracaoZeroFeicoes =
    totalRespondidos > 0 ? totalZeroFeicoesNasTresCamadas / totalRespondidos : 0;

  if (totalRespondidos >= minimoPontos && fracaoZeroFeicoes > limiarMaximo) {
    throw new ErroSanidadeEixosWfsEmbrapa(
      totalRespondidos,
      totalZeroFeicoesNasTresCamadas,
      fracaoZeroFeicoes,
      limiarMaximo
    );
  }

  return {
    totalRespondidos,
    totalZeroFeicoesNasTresCamadas,
    fracaoZeroFeicoes,
  };
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
