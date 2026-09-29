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
   * Marcação de ambiguidade do estrato de erodibilidade K em três estados (Decisões D08 emendada, D09 e W3 — 28/09/2026):
   * - `true`: Ramo (a) de D08 — a carta de 2024 traz >= 2 componentes (`erod_c1..erod_c4`) cujos níveis de D09
   *   atravessam a fronteira (algum em nível 1 [K <= 0,0285] e algum em nível 2 [K >= 0,0300]).
   * - `false`: Ramo (a) de D08 em que todos os >= 2 componentes da carta de 2024 caem do mesmo lado da fronteira,
   *   OU unidade simples (`tipo_unida = 'simples'`) com 1 componente válido na carta de 2024.
   * - `"indisponivel"`: Ramo (b) de D08 — a carta de 2024 traz 1 único componente enquanto a carta estadual
   *   (`parana_solos_20201105`) declara `tipo_unida = 'associacao'` (composição não resolvida na fonte,
   *   causa `insuficiente`), ou ponto fora do domínio / sem camada de 2024. JAMAIS é convertido em `false` (P12).
   * Nunca entra na matriz X de preditores (protegido em CAMPOS_PROIBIDOS_MATRIZ_TREINO).
   */
  kAmbiguoAssociacao: MarcadorKAmbiguoD08;
  /** Proveniência formal (`Proveniencia<boolean>`) do marcador de ambiguidade D08 (`tabelado(true/false)` no Ramo (a); `indisponivel('insuficiente')` no Ramo (b)). */
  kAmbiguoAssociacaoProveniencia: Proveniencia<boolean>;
  /** Ramo de D08 emendada que governou a avaliação (`ramo-a-tabelado-multiplos-componentes`, `ramo-b-indisponivel-generalizacao-1-componente`, `unidade-simples-1-componente`, `fora-do-dominio`, `sem-camada-2024`). */
  ramoAmbiguidadeD08: RamoAmbiguidadeD08;
  /** Estado informativo de correspondência da sequência de ordens entre `parana_solos_20201105` e `bra_erodibilidade_2024_sirgas2000` (declarado irrelevante para D08 na emenda de 28/09/2026). */
  correspondenciaCartas2024: "correspondente" | "divergente" | "sem-camada-2024";
  /** Marcador informativo de divergência de sequência ou número de componentes entre as duas cartas. */
  divergenciaEntreCartas2024: boolean;
  /** Proveniência efetiva usada para avaliar `kAmbiguoAssociacao` na unidade. */
  provenienciaK:
    | "tabelado"
    | "indisponivel-ramo-b-generalizacao"
    | "indisponivel-sem-camada-2024"
    | "fora-do-dominio";
  /** Identificador (`cod_um` ou `ogc_fid`) da feição `bra_erodibilidade_2024_sirgas2000` quando avaliada na fonte. */
  chaveProvenienciaK: string | null;
  /** Indica se a coordenada caiu em classe não-pedológica ("Area urbana", "Corpos dagua", etc.) em qualquer camada (T3). */
  foraDoDominioSolo: boolean;
}

/**
 * Marcador em três estados exigido por D08 emendada (W1) e pela sensibilidade de D25 (W3):
 * - `true`: ambiguidade confirmada na fonte (`>= 2` componentes em `erod_c1..erod_c4` atravessando a fronteira de D09)
 * - `false`: ausência de ambiguidade confirmada na fonte
 * - `"indisponivel"`: composição não resolvida na fonte (Ramo (b): 1 componente em 2024 com `tipo_unida = 'associacao'` no PR) ou fora do domínio
 */
export type MarcadorKAmbiguoD08 = true | false | "indisponivel";

export type RamoAmbiguidadeD08 =
  | "ramo-a-tabelado-multiplos-componentes"
  | "ramo-b-indisponivel-generalizacao-1-componente"
  | "unidade-simples-1-componente"
  | "fora-do-dominio"
  | "sem-camada-2024";

/**
 * Registro auditável da unidade de 2024 (`geonode:bra_erodibilidade_2024_sirgas2000`)
 * que determinou o nível de K̂ na estratificação de D12 (W2.3 — 28/09/2026).
 */
export interface UnidadeDeterminanteK2024 {
  codUm: string;
  codUm2: string;
  ogcFid: number | null;
  erodUm: string;
  kSolos: number | null;
  kSolosBruto: number | null;
  nivelK: 1 | 2 | null;
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
  /** Nível de K̂ (1 | 2) derivado de `erod_um` / `k_solos` da unidade que contém o ponto na carta de 2024 (D12 emendada / W2). */
  nivelK2024?: Proveniencia<1 | 2>;
  /** Unidade de 2024 (`cod_um`, `cod_um2`, `ogc_fid`, `erod_um`, `k_solos`) que determinou o nível de K̂ (W2.3). */
  unidadeDeterminanteK2024?: UnidadeDeterminanteK2024 | null;
  /** Indica se a coordenada caiu em categoria não-solo, lacuna ou água (V3.1 / T3 / W2.2). */
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
 * APOSENTADORIA DA HEURÍSTICA TAXONÔMICA (Decisões D08 e D12 emendadas em `f629451` — 28/09/2026 / W1 e W2):
 * A função `classificarNivelEstratoKComponente` (que aplicava regras taxonômicas não conferidas por
 * ordem/subordem/família do SiBCS quando a camada de 2024 divergia ou faltava) foi REMOVIDA deste módulo.
 * Antes da remoção, seus únicos chamadores em todo o repositório eram `parseSoilFeature` (neste arquivo)
 * e os testes unitários em `src/lib/embrapa/embrapaSoilClient.test.ts`.
 *
 * A partir de W1 e W2:
 * 1. O nível de K̂ (`1 | 2`) da estratificação de D12 é derivado exclusivamente de `erod_um` (ou da faixa
 *    de `k_solos`) da unidade que CONTÉM o ponto em `geonode:bra_erodibilidade_2024_sirgas2000` (`derivarNivelKDaCarta2024`).
 * 2. A ambiguidade `kAmbiguoAssociacao` de D08 é avaliada exclusivamente na fonte em dois ramos (`avaliarAmbiguidadeKAssociacaoD08`):
 *    - Ramo (a): `>= 2` componentes em `erod_c1..erod_c4` -> `tabelado(true | false)` conforme atravessem ou não a fronteira de D09;
 *    - Ramo (b): `1` componente na carta de 2024 com `tipo_unida = 'associacao'` na carta estadual -> `indisponivel("insuficiente")`
 *      (marcador `"indisponivel"`, JAMAIS `false`).
 */
export function classificarNivelKDaCarta2024(
  classeErod: string | null | undefined,
  opcoesProveniencia?: {
    tabela?: string;
    chave?: string;
    decisao?: string;
  }
): Proveniencia<1 | 2> {
  const bruto = texto(classeErod);
  if (!bruto) {
    return indisponivel("insuficiente", [
      "Classe de erodibilidade ausente na feição de geonode:bra_erodibilidade_2024_sirgas2000",
    ]);
  }
  if (ehCategoriaNaoSolo(bruto)) {
    return indisponivel("fora-do-dominio", [
      `Categoria não-pedológica fora do domínio de K̂: '${bruto}'`,
    ]);
  }

  const norm = bruto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const tabela = opcoesProveniencia?.tabela ? opcoesProveniencia.tabela : LAYER_ERODIBILIDADE_2024;
  const chave = opcoesProveniencia?.chave ? opcoesProveniencia.chave : bruto;
  const decisao = opcoesProveniencia?.decisao ? opcoesProveniencia.decisao : "D09/D12";

  if (norm === "muito baixa" || norm === "baixa" || norm === "media") {
    return tabelado(1, tabela, chave, decisao);
  }
  if (norm === "alta" || norm === "muito alta" || norm === "extremamente alta") {
    return tabelado(2, tabela, chave, decisao);
  }

  return indisponivel("insuficiente", [
    `Classe de erodibilidade não reconhecida na escala de D09: '${bruto}'`,
  ]);
}

/**
 * Deriva o nível de K̂ (`1 | 2`) e o registro da unidade determinante a partir da feição que contém
 * o ponto na carta `geonode:bra_erodibilidade_2024_sirgas2000` (Decisão D12 emendada / PARTE II — W2).
 *
 * REGRAS NORMATIVAS (W2.1 a W2.3):
 * - O nível de K̂ vem de `erod_um` (ou equivalentemente da faixa de `k_solos`: `0 < k_solos <= 0,0285` -> 1;
 *   `k_solos >= 0,0300` -> 2) da unidade de 2024 que contém o ponto por ponto-em-polígono.
 * - Categoria não-pedológica (`Área urbana`, `Corpo d'água`, `k_solos = 0`) NÃO tem nível de K̂ e retira
 *   o ponto do domínio (`indisponivel("fora-do-dominio")`, `nivelK: null`), sem cair em fallback algum.
 * - Registra `cod_um`, `cod_um2`, `ogc_fid`, `erod_um` e `k_solos` em `unidadeDeterminante2024`.
 */
export function derivarNivelKDaCarta2024(
  erod2024: EmbrapaErodibility2024 | Record<string, unknown> | null | undefined
): {
  nivelK: 1 | 2 | null;
  provenienciaNivelK: Proveniencia<1 | 2>;
  unidadeDeterminante2024: UnidadeDeterminanteK2024 | null;
} {
  if (!erod2024) {
    return {
      nivelK: null,
      provenienciaNivelK: indisponivel(
        "sem-cobertura",
        "Feição de geonode:bra_erodibilidade_2024_sirgas2000 ausente no ponto (W2)."
      ),
      unidadeDeterminante2024: null,
    };
  }

  const parsed: EmbrapaErodibility2024 | null =
    "erodComponentes" in erod2024 && Array.isArray(erod2024.erodComponentes)
      ? (erod2024 as EmbrapaErodibility2024)
      : parseErodibility2024Feature(erod2024 as Record<string, unknown>);

  if (!parsed) {
    return {
      nivelK: null,
      provenienciaNivelK: indisponivel(
        "sem-cobertura",
        "Propriedades de geonode:bra_erodibilidade_2024_sirgas2000 vazias no ponto (W2)."
      ),
      unidadeDeterminante2024: null,
    };
  }

  const codUm = parsed.codUm || "";
  const codUm2 = parsed.codUm2 ? parsed.codUm2 : codUm;
  const ogcFid = parsed.ogcFid;
  const erodUm = parsed.erodUm || "";
  const kSolosBruto = parsed.kSolosBruto !== undefined ? parsed.kSolosBruto : parsed.kSolos;
  const chaveUnidade = `${codUm || codUm2 || "sem-cod_um"}:ogc_fid=${ogcFid !== null ? ogcFid : "null"}`;

  // W2.2: Categoria não-pedológica (Área urbana, Corpo d'água, k_solos = 0) retira o ponto do domínio
  if (
    ehCategoriaNaoSolo(erodUm) ||
    ehCategoriaNaoSolo(parsed.legenda) ||
    ehCategoriaNaoSolo(parsed.erodComponentes[0] ? parsed.erodComponentes[0] : "") ||
    kSolosBruto === 0
  ) {
    return {
      nivelK: null,
      provenienciaNivelK: indisponivel(
        "fora-do-dominio",
        `Categoria não-pedológica na carta de 2024 ('${erodUm || parsed.legenda || "k_solos=0"}', ${chaveUnidade}) retira o ponto do domínio de K̂ (D07, D12 e D14).`
      ),
      unidadeDeterminante2024: {
        codUm,
        codUm2,
        ogcFid,
        erodUm,
        kSolos: null,
        kSolosBruto,
        nivelK: null,
      },
    };
  }

  const classifPorErodUm = classificarNivelKDaCarta2024(erodUm, {
    tabela: LAYER_ERODIBILIDADE_2024,
    chave: `${chaveUnidade}:erod_um=${erodUm}`,
    decisao: "D12",
  });

  if (classifPorErodUm.estado !== "indisponivel") {
    return {
      nivelK: classifPorErodUm.valor,
      provenienciaNivelK: classifPorErodUm,
      unidadeDeterminante2024: {
        codUm,
        codUm2,
        ogcFid,
        erodUm,
        kSolos: parsed.kSolos,
        kSolosBruto,
        nivelK: classifPorErodUm.valor,
      },
    };
  }

  // Equivalência pela faixa de k_solos de D09 quando erod_um não estiver preenchido e k_solos > 0
  if (parsed.kSolos !== null && parsed.kSolos > 0) {
    if (parsed.kSolos <= 0.0285) {
      const prov1 = tabelado<1 | 2>(
        1,
        LAYER_ERODIBILIDADE_2024,
        `${chaveUnidade}:k_solos=${parsed.kSolos}`,
        "D12"
      );
      return {
        nivelK: 1,
        provenienciaNivelK: prov1,
        unidadeDeterminante2024: {
          codUm,
          codUm2,
          ogcFid,
          erodUm,
          kSolos: parsed.kSolos,
          kSolosBruto,
          nivelK: 1,
        },
      };
    }
    if (parsed.kSolos >= 0.03) {
      const prov2 = tabelado<1 | 2>(
        2,
        LAYER_ERODIBILIDADE_2024,
        `${chaveUnidade}:k_solos=${parsed.kSolos}`,
        "D12"
      );
      return {
        nivelK: 2,
        provenienciaNivelK: prov2,
        unidadeDeterminante2024: {
          codUm,
          codUm2,
          ogcFid,
          erodUm,
          kSolos: parsed.kSolos,
          kSolosBruto,
          nivelK: 2,
        },
      };
    }
  }

  return {
    nivelK: null,
    provenienciaNivelK: indisponivel(
      "insuficiente",
      `Unidade ${chaveUnidade} sem erod_um e sem k_solos enquadrável nos níveis 1 ou 2 de D09.`
    ),
    unidadeDeterminante2024: {
      codUm,
      codUm2,
      ogcFid,
      erodUm,
      kSolos: parsed.kSolos,
      kSolosBruto,
      nivelK: null,
    },
  };
}

/**
 * Avalia `kAmbiguoAssociacao` na fonte oficial em dois ramos, sem heurística taxonômica
 * (Decisão D08 emendada em `f629451` — PARTE I / W1 e PARTE III / W3):
 *
 * - **Ramo (a) — dois ou mais componentes em `erod_c1..erod_c4`:**
 *   Converte cada classe ao nível de D09 (`{Muito baixa, Baixa, Média}` -> 1; `{Alta, Muito alta, Extremamente alta}` -> 2).
 *   Se os níveis atravessarem a fronteira (algum 1 e algum 2), retorna `kAmbiguoAssociacao = true` com
 *   `tabelado(true, tabela, chave, "D08")`. Se todos caírem do mesmo lado, retorna `kAmbiguoAssociacao = false`
 *   com `tabelado(false, tabela, chave, "D08")`. Sem heurística em nenhum dos dois desfechos.
 *
 * - **Ramo (b) — um único componente na carta de 2024, com `tipo_unida = 'associacao'` na carta estadual:**
 *   A composição NÃO está resolvida na fonte. Retorna `kAmbiguoAssociacao = "indisponivel"` e
 *   `indisponivel("insuficiente", ...)`. **É estritamente proibido devolver `false` no ramo (b)** (P12).
 *
 * - **Unidade simples (`tipo_unida = 'simples'` na carta estadual e 1 componente válido na carta de 2024):**
 *   Retorna `kAmbiguoAssociacao = false` com `tabelado(false, tabela, chave, "D08")`.
 */
export function avaliarAmbiguidadeKAssociacaoD08(
  tipoUnidadeEstadual: string,
  numComponentesEstaduais: number,
  fonte2024?: Record<string, unknown> | null
): {
  kAmbiguoAssociacao: MarcadorKAmbiguoD08;
  kAmbiguoAssociacaoProveniencia: Proveniencia<boolean>;
  ramoAmbiguidadeD08: RamoAmbiguidadeD08;
  niveisComponentes2024: Array<1 | 2>;
  chaveProvenienciaK: string | null;
  foraDoDominioSolo: boolean;
} {
  const tipoNorm = normalizarSemAcento(tipoUnidadeEstadual).toLowerCase();
  const ehAssociacaoEstadual =
    tipoNorm === "associacao" || numComponentesEstaduais > 1;

  if (!fonte2024) {
    return {
      kAmbiguoAssociacao: "indisponivel",
      kAmbiguoAssociacaoProveniencia: indisponivel(
        "insuficiente",
        "Camada geonode:bra_erodibilidade_2024_sirgas2000 ausente no ponto; vedado inferir ambiguidade de D08 por heurística taxonômica (W1 / P12)."
      ),
      ramoAmbiguidadeD08: "sem-camada-2024",
      niveisComponentes2024: [],
      chaveProvenienciaK: null,
      foraDoDominioSolo: false,
    };
  }

  const codUm = texto(fonte2024["cod_um"]);
  const codUm2 = texto(fonte2024["cod_um2"]);
  const ogcFid = fonte2024["ogc_fid"];
  const idUnidade2024 =
    codUm ||
    codUm2 ||
    (ogcFid !== undefined && ogcFid !== null ? `ogc_fid:${String(ogcFid)}` : LAYER_ERODIBILIDADE_2024);

  const erodUm2024 = texto(fonte2024["erod_um"]);
  const leg2024 = texto(fonte2024["legenda"]);
  const kSolosBruto = numeroOuNulo(fonte2024["k_solos"]);
  const erodsBrutos = ["erod_c1", "erod_c2", "erod_c3", "erod_c4"]
    .map((k) => texto(fonte2024[k]))
    .filter((s) => s.length > 0);

  if (
    ehCategoriaNaoSolo(erodUm2024) ||
    ehCategoriaNaoSolo(leg2024) ||
    erodsBrutos.some((e) => ehCategoriaNaoSolo(e)) ||
    kSolosBruto === 0
  ) {
    return {
      kAmbiguoAssociacao: "indisponivel",
      kAmbiguoAssociacaoProveniencia: indisponivel(
        "fora-do-dominio",
        `Categoria não-pedológica na feição ${idUnidade2024} ('${erodUm2024 || leg2024 || "k_solos=0"}'); fora do domínio de D08/D09.`
      ),
      ramoAmbiguidadeD08: "fora-do-dominio",
      niveisComponentes2024: [],
      chaveProvenienciaK: idUnidade2024,
      foraDoDominioSolo: true,
    };
  }

  const niveisComponentes2024: Array<1 | 2> = [];
  for (const erodC of erodsBrutos) {
    const classif = classificarNivelKDaCarta2024(erodC, {
      tabela: LAYER_ERODIBILIDADE_2024,
      chave: idUnidade2024,
      decisao: "D08",
    });
    if (classif.estado === "indisponivel") {
      return {
        kAmbiguoAssociacao: "indisponivel",
        kAmbiguoAssociacaoProveniencia: indisponivel(
          classif.causa,
          `Componente '${erodC}' na feição ${idUnidade2024} não pôde ser enquadrado em D09: ${classif.motivo}`
        ),
        ramoAmbiguidadeD08:
          classif.causa === "fora-do-dominio" ? "fora-do-dominio" : "sem-camada-2024",
        niveisComponentes2024: [],
        chaveProvenienciaK: idUnidade2024,
        foraDoDominioSolo: classif.causa === "fora-do-dominio",
      };
    }
    niveisComponentes2024.push(classif.valor);
  }

  const chaveDetalhada = `${idUnidade2024}:erod_c=[${erodsBrutos.join(",")}]`;

  // RAMO (a) — dois ou mais componentes em erod_c1..erod_c4 na carta de 2024
  if (niveisComponentes2024.length >= 2) {
    const temNivel1 = niveisComponentes2024.includes(1);
    const temNivel2 = niveisComponentes2024.includes(2);
    const atravessaFronteiraD09 = temNivel1 && temNivel2;
    return {
      kAmbiguoAssociacao: atravessaFronteiraD09,
      kAmbiguoAssociacaoProveniencia: tabelado(
        atravessaFronteiraD09,
        LAYER_ERODIBILIDADE_2024,
        chaveDetalhada,
        "D08"
      ),
      ramoAmbiguidadeD08: "ramo-a-tabelado-multiplos-componentes",
      niveisComponentes2024,
      chaveProvenienciaK: chaveDetalhada,
      foraDoDominioSolo: false,
    };
  }

  // RAMO (b) — um único componente na carta de 2024, com tipo_unida = 'associacao' na carta estadual
  if (niveisComponentes2024.length === 1 && ehAssociacaoEstadual) {
    return {
      kAmbiguoAssociacao: "indisponivel",
      kAmbiguoAssociacaoProveniencia: indisponivel(
        "insuficiente",
        `Ramo (b) de D08: a carta de 2024 (${idUnidade2024}) traz 1 único componente (${erodsBrutos[0]}) onde a carta estadual declara tipo_unida='${tipoUnidadeEstadual || "associacao"}'; composição não resolvida na fonte oficial (vedado devolver false por P12).`
      ),
      ramoAmbiguidadeD08: "ramo-b-indisponivel-generalizacao-1-componente",
      niveisComponentes2024,
      chaveProvenienciaK: chaveDetalhada,
      foraDoDominioSolo: false,
    };
  }

  // Unidade simples (tipo_unida = 'simples' e 1 componente válido na carta de 2024)
  if (niveisComponentes2024.length === 1 && !ehAssociacaoEstadual) {
    return {
      kAmbiguoAssociacao: false,
      kAmbiguoAssociacaoProveniencia: tabelado(
        false,
        LAYER_ERODIBILIDADE_2024,
        chaveDetalhada,
        "D08"
      ),
      ramoAmbiguidadeD08: "unidade-simples-1-componente",
      niveisComponentes2024,
      chaveProvenienciaK: chaveDetalhada,
      foraDoDominioSolo: false,
    };
  }

  return {
    kAmbiguoAssociacao: "indisponivel",
    kAmbiguoAssociacaoProveniencia: indisponivel(
      "insuficiente",
      `Feição ${idUnidade2024} não possui componentes erod_c1..erod_c4 preenchidos para avaliação de D08.`
    ),
    ramoAmbiguidadeD08: "sem-camada-2024",
    niveisComponentes2024: [],
    chaveProvenienciaK: idUnidade2024,
    foraDoDominioSolo: false,
  };
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
    ehCategoriaNaoSolo(erodComponentes[0] ? erodComponentes[0] : "") ||
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
 * Converte as propriedades brutas da camada de solos na estrutura tipada, avaliando
 * `kAmbiguoAssociacao` exclusivamente pelos dois ramos da fonte oficial `geonode:bra_erodibilidade_2024_sirgas2000`
 * conforme a Decisão D08 emendada (`f629451` — PARTE I / W1), sem heurística taxonômica.
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
  const confianca: "alta" | "media" =
    tipoUnidade.toLowerCase() === "simples" && componentes.length === 1 ? "alta" : "media";

  const ordensPr = componentes.map((c) => extrairOrdemSibcsDeLegenda(c.ordem));
  const fonte2024 =
    erod2024Props !== undefined && erod2024Props !== null
      ? erod2024Props
      : texto(props["erod_c1"]) || texto(props["legenda_c1"]) || texto(props["erod_um"])
      ? props
      : null;

  let correspondenciaCartas2024: "correspondente" | "divergente" | "sem-camada-2024" =
    "sem-camada-2024";
  let divergenciaEntreCartas2024 = false;

  if (fonte2024) {
    const legs2024 = ["legenda_c1", "legenda_c2", "legenda_c3", "legenda_c4"]
      .map((k) => texto(fonte2024[k]))
      .filter((s) => s.length > 0);
    const ordens2024 = legs2024
      .map((l) => extrairOrdemSibcsDeLegenda(l))
      .filter((s) => s.length > 0);
    const sequenciasCorrespondem =
      ordens2024.length > 0 &&
      ordens2024.length === ordensPr.length &&
      ordensPr.every((ord, idx) => ord === ordens2024[idx]);

    correspondenciaCartas2024 = sequenciasCorrespondem ? "correspondente" : "divergente";
    divergenciaEntreCartas2024 = !sequenciasCorrespondem;

    for (let i = 0; i < componentes.length; i++) {
      const chaveErod = `erod_c${componentes[i].posicao}`;
      const valErod = texto(fonte2024[chaveErod]);
      componentes[i].erodibilidadeComponente2024 = valErod ? valErod : null;
    }
  } else {
    for (const comp of componentes) {
      comp.erodibilidadeComponente2024 = null;
    }
  }

  // Avaliação de D08 emendada (W1) nos dois ramos, sem heurística taxonômica
  const avalD08 = avaliarAmbiguidadeKAssociacaoD08(
    tipoUnidade,
    componentes.length,
    fonte2024
  );

  let provenienciaK: EmbrapaSoilUnit["provenienciaK"] = "tabelado";
  if (avalD08.foraDoDominioSolo) {
    provenienciaK = "fora-do-dominio";
  } else if (avalD08.ramoAmbiguidadeD08 === "ramo-b-indisponivel-generalizacao-1-componente") {
    provenienciaK = "indisponivel-ramo-b-generalizacao";
  } else if (avalD08.ramoAmbiguidadeD08 === "sem-camada-2024") {
    provenienciaK = "indisponivel-sem-camada-2024";
  }

  return {
    sbcs,
    legenda,
    tipoUnidade,
    componentes,
    areaKm2: numeroOuNulo(props["area_km2"]),
    confianca,
    kAmbiguoAssociacao: avalD08.kAmbiguoAssociacao,
    kAmbiguoAssociacaoProveniencia: avalD08.kAmbiguoAssociacaoProveniencia,
    ramoAmbiguidadeD08: avalD08.ramoAmbiguidadeD08,
    correspondenciaCartas2024,
    divergenciaEntreCartas2024,
    provenienciaK,
    chaveProvenienciaK: avalD08.chaveProvenienciaK,
    foraDoDominioSolo: avalD08.foraDoDominioSolo,
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
      const derivK2024 = derivarNivelKDaCarta2024(ero24);
      resultado.nivelK2024 = derivK2024.provenienciaNivelK;
      resultado.unidadeDeterminanteK2024 = derivK2024.unidadeDeterminante2024;
      if (
        ehCategoriaNaoSolo(ero24.erodUm) ||
        ehCategoriaNaoSolo(ero24.erodComponentes[0] ? ero24.erodComponentes[0] : "") ||
        ero24.kSolosBruto === 0
      ) {
        motivosNaoSolo.push(
          `bra_erodibilidade_2024_sirgas2000 reportou categoria não-solo '${ero24.erodUm || "k_solos=0"}'`
        );
      }
    }
  } else {
    resultado.nivelK2024 = indisponivel(
      "sem-cobertura",
      "Camada geonode:bra_erodibilidade_2024_sirgas2000 sem feição no ponto."
    );
    resultado.unidadeDeterminanteK2024 = null;
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
    public readonly limiarMaximo: number,
    public readonly camadaAfetada: string = "todas-as-tres-camadas"
  ) {
    super(
      `[GUARDA DE SANIDADE WFS 1.1.0 EMBRAPA — V3.4] Abortando lote (${camadaAfetada}): ${totalZeroFeicoes} de ${totalConsultados} ` +
        `candidatos (${(fracaoZeroFeicoes * 100).toFixed(1)}%) devolveram ZERO feições, ` +
        `excedendo o limiar máximo de ${(limiarMaximo * 100).toFixed(1)}%. ` +
        `Suspeita crítica de inversão de eixos na consulta WFS 1.1.0 (verifique se CQL_FILTER usa POINT(<lat> <lon>) e não POINT(<lon> <lat>)).`
    );
    this.name = "ErroSanidadeEixosWfsEmbrapa";
  }
}

/**
 * Verifica a sanidade de um lote de consultas `queryEmbrapaSoil` contra esvaziamento silencioso
 * por inversão da ordem dos eixos na WFS 1.1.0 (`V3.4`), tanto globalmente quanto **por camada individual**
 * (conforme ressalva registrada em `5706595`, para capturar eventual inversão em apenas uma das 3 camadas).
 */
export function verificarSanidadeZeroFeicoesLoteEmbrapa(
  resultados: EmbrapaSoilQueryResult[],
  limiarMaximo: number = LIMIAR_MAXIMO_FRACAO_ZERO_FEICOES_LOTE,
  minimoPontos: number = MINIMO_PONTOS_GUARDA_SANIDADE_WFS
): {
  totalRespondidos: number;
  totalZeroFeicoesNasTresCamadas: number;
  fracaoZeroFeicoes: number;
  fracoesPorCamada: {
    paranaSolos: number;
    erodibilidade2024: number;
    erodibilidadeBr: number;
  };
} {
  const respondidos = resultados.filter((r) => r.statusSolo !== "servico-indisponivel");
  const totalRespondidos = respondidos.length;
  const totalZeroFeicoesNasTresCamadas = respondidos.filter(
    (r) =>
      !r.totalFeicoesSoloRetornadas &&
      !r.totalFeicoesErod2024Retornadas &&
      !r.totalFeicoesErodBrRetornadas
  ).length;
  const zeroSoloPr = respondidos.filter((r) => !r.totalFeicoesSoloRetornadas).length;
  const zeroErod2024 = respondidos.filter((r) => !r.totalFeicoesErod2024Retornadas).length;
  const zeroErodBr = respondidos.filter((r) => !r.totalFeicoesErodBrRetornadas).length;

  const fracaoZeroFeicoes =
    totalRespondidos > 0 ? totalZeroFeicoesNasTresCamadas / totalRespondidos : 0;
  const fracaoSoloPr = totalRespondidos > 0 ? zeroSoloPr / totalRespondidos : 0;
  const fracaoErod2024 = totalRespondidos > 0 ? zeroErod2024 / totalRespondidos : 0;
  const fracaoErodBr = totalRespondidos > 0 ? zeroErodBr / totalRespondidos : 0;

  if (totalRespondidos >= minimoPontos) {
    if (fracaoZeroFeicoes > limiarMaximo) {
      throw new ErroSanidadeEixosWfsEmbrapa(
        totalRespondidos,
        totalZeroFeicoesNasTresCamadas,
        fracaoZeroFeicoes,
        limiarMaximo,
        "todas-as-tres-camadas"
      );
    }
    if (fracaoSoloPr > limiarMaximo) {
      throw new ErroSanidadeEixosWfsEmbrapa(
        totalRespondidos,
        zeroSoloPr,
        fracaoSoloPr,
        limiarMaximo,
        LAYER_SOLOS_PR
      );
    }
    if (fracaoErod2024 > limiarMaximo) {
      throw new ErroSanidadeEixosWfsEmbrapa(
        totalRespondidos,
        zeroErod2024,
        fracaoErod2024,
        limiarMaximo,
        LAYER_ERODIBILIDADE_2024
      );
    }
    if (fracaoErodBr > limiarMaximo) {
      throw new ErroSanidadeEixosWfsEmbrapa(
        totalRespondidos,
        zeroErodBr,
        fracaoErodBr,
        limiarMaximo,
        LAYER_ERODIBILIDADE_BR
      );
    }
  }

  return {
    totalRespondidos,
    totalZeroFeicoesNasTresCamadas,
    fracaoZeroFeicoes,
    fracoesPorCamada: {
      paranaSolos: fracaoSoloPr,
      erodibilidade2024: fracaoErod2024,
      erodibilidadeBr: fracaoErodBr,
    },
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
