/**
 * ============================================================================
 * Seleção de Ponto na Parte Elegível do Imóvel Rural — X3 (D16 / P07)
 * SAREL v2.0 — PPGTCA 2026
 * ============================================================================
 *
 * REGRAS METODOLÓGICAS:
 * 1. O universo é o imóvel rural por necessidade de identificação de proprietário e
 *    autorização de visita e sobrevoo (D16 / Y6).
 * 2. O ponto amostral NÃO precisa coincidir com o centroide arbitrário do imóvel:
 *    pode ser selecionado dentro da porção elegível do imóvel (declividade de 3 a 20%,
 *    cobertura agrícola WorldCover 30/40 com concordância entre épocas, fora de água e urbano).
 * 3. GUARDA ANTICIRCULARIDADE ESTRITA:
 *    A escolha dentro do imóvel é estritamente estocástica entre as células elegíveis,
 *    governada pelo PRNG determinístico da semente registrada (P07).
 *    É expressamente proibido escolher ou influenciar a escolha por score de suscetibilidade,
 *    JEV, severidade, prioridade ou qualquer indicador de detecção/suspeita de erosão (D16).
 *    Qualquer tentativa de passar campos de predição/espectro proibidos dispara aborto imediato.
 */

import { CAMPOS_PROIBIDOS_MATRIZ_TREINO } from "@/lib/matriz/invariantes";
import { criarPrng } from "@/lib/gee/estratificacao";

const CAMPOS_PERMITIDOS_COORDENADA = new Set([
  "latitude",
  "longitude",
  "codigoCar",
  "declividadePct",
  "classeWorldCover2020",
  "classeWorldCover2021",
  "kDefinido",
  "foraAguaEUrbano",
]);

export const CAMPOS_PROIBIDOS_ANTICIRCULARIDADE = new Set<string>([
  ...CAMPOS_PROIBIDOS_MATRIZ_TREINO.filter((c) => !CAMPOS_PERMITIDOS_COORDENADA.has(c)),
  "scoreSuscetibilidade",
  "scoreJev",
  "laudoJev",
  "severidade",
  "scorePrioridade",
  "classeAmostral",
  "tipologia",
  "fracaoErodida",
  "fraçãoErodida",
  "densidadeErosao",
  "riscoErosao",
]);

export class ErroGuardaAnticircularidade extends Error {
  public readonly campoDetectado: string;

  constructor(campoDetectado: string, mensagem: string) {
    super(`[GUARDA_ANTICIRCULARIDADE_VIOLADA:${campoDetectado}] ${mensagem}`);
    this.name = "ErroGuardaAnticircularidade";
    this.campoDetectado = campoDetectado;
  }
}

export interface CelulaCandidataImovel {
  latitude: number;
  longitude: number;
  declividadePct: number;
  classeWorldCover2020?: number | null;
  classeWorldCover2021?: number | null;
  kDefinido?: boolean;
  foraAguaEUrbano?: boolean;
  [chave: string]: unknown;
}

export interface OpcoesSelecaoPontoElegivel {
  semente: number;
  declividadeMin?: number;
  declividadeMax?: number;
}

/**
 * Valida que o objeto avaliado não contém campos proibidos de predição/rastreio espectral.
 * Lança ErroGuardaAnticircularidade caso qualquer campo proibido esteja presente.
 */
export function validarAusenciaCamposProibidos(registro: Record<string, unknown>): void {
  for (const chave of Object.keys(registro)) {
    if (CAMPOS_PROIBIDOS_ANTICIRCULARIDADE.has(chave) && registro[chave] !== undefined) {
      throw new ErroGuardaAnticircularidade(
        chave,
        `Campo proibido '${chave}' detectado durante a seleção de ponto no imóvel. A escolha do ponto elegível jamais pode considerar suspeita de erosão (D16 / P07).`
      );
    }
  }
}

/**
 * Seleciona ao acaso determinístico (semente registrada P07) uma célula elegível dentro do imóvel rural.
 * Garante que a escolha independa integralmente de suspeita de erosão (anticircularidade).
 */
export function selecionarPontoElegivelImovel(
  celulas: CelulaCandidataImovel[],
  opcoes: OpcoesSelecaoPontoElegivel
): CelulaCandidataImovel | null {
  const decMin = typeof opcoes.declividadeMin === "number" ? opcoes.declividadeMin : 3.0;
  const decMax = typeof opcoes.declividadeMax === "number" ? opcoes.declividadeMax : 20.0;

  // 1. Auditoria anticircularidade estrita sobre todas as células fornecidas
  for (const c of celulas) {
    validarAusenciaCamposProibidos(c);
  }

  // 2. Filtro estrito de elegibilidade física e biofísica de D07
  const elegiveis = celulas.filter((c) => {
    if (typeof c.declividadePct !== "number" || isNaN(c.declividadePct)) return false;
    if (c.declividadePct < decMin || c.declividadePct > decMax) return false;

    if (typeof c.classeWorldCover2020 === "number" && ![30, 40].includes(c.classeWorldCover2020)) {
      return false;
    }
    if (typeof c.classeWorldCover2021 === "number" && ![30, 40].includes(c.classeWorldCover2021)) {
      return false;
    }
    if (c.kDefinido === false) return false;
    if (c.foraAguaEUrbano === false) return false;

    return true;
  });

  if (elegiveis.length === 0) {
    return null;
  }

  // 3. Ordenação canônica determinística independente da ordem de chegada
  const ordenadas = [...elegiveis].sort((a, b) => {
    if (a.latitude !== b.latitude) return a.latitude - b.latitude;
    return a.longitude - b.longitude;
  });

  // 4. Sorteio aleatório uniforme com a semente registrada P07 (com warm-up para evitar viés de sementes pequenas no LCG)
  const prng = criarPrng(opcoes.semente);
  for (let w = 0; w < 3; w++) prng();
  const indiceSorteado = Math.floor(prng() * ordenadas.length);

  return ordenadas[indiceSorteado];
}

/**
 * Gera uma grade de células candidatas no polígono/envelope do imóvel para permitir amostragem interna.
 */
export function gerarMalhaCelulasImovel(
  imovel: {
    latMin: number;
    latMax: number;
    lonMin: number;
    lonMax: number;
    lat: number;
    lng: number;
  },
  amostradorTerreno?: (lat: number, lon: number) => { declividadePct: number; elevacaoMetros?: number }
): CelulaCandidataImovel[] {
  const dLat = imovel.latMax - imovel.latMin;
  const dLon = imovel.lonMax - imovel.lonMin;

  // Grade de 9 pontos (frações 0.25, 0.50, 0.75 em lat e lon cobrindo o interior do envelope)
  const fracoes = [0.25, 0.5, 0.75];
  const celulas: CelulaCandidataImovel[] = [];

  for (const fLat of fracoes) {
    for (const fLon of fracoes) {
      const lat = Number((imovel.latMin + fLat * dLat).toFixed(6));
      const lon = Number((imovel.lonMin + fLon * dLon).toFixed(6));
      const terreno = amostradorTerreno ? amostradorTerreno(lat, lon) : { declividadePct: 0 };
      celulas.push({
        latitude: lat,
        longitude: lon,
        declividadePct: terreno.declividadePct,
      });
    }
  }

  // Inclui também o centroide como 10º candidato
  const terrenoCentroide = amostradorTerreno
    ? amostradorTerreno(imovel.lat, imovel.lng)
    : { declividadePct: 0 };
  celulas.push({
    latitude: Number(imovel.lat.toFixed(6)),
    longitude: Number(imovel.lng.toFixed(6)),
    declividadePct: terrenoCentroide.declividadePct,
  });

  return celulas;
}
