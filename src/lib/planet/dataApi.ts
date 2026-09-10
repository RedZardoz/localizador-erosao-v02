/**
 * ============================================================================
 * Busca no Catálogo PlanetScope (Data API) e Avaliação UDM2 — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * ESPECIFICAÇÃO DE BUSCA (PLANO V3, §11.1-11.6):
 * - Item Type: PSScene
 * - Assets principais: ortho_analytic_8b_sr (SuperDove 8 bandas SR) e udm2 (Usable Data Mask).
 * - Filtro UDM2 por AOI: Avalia a fração limpa (clear - nuvem - sombra) estritamente
 *   sobre a janela de recorte do alvo (limiar P06).
 *
 * REGRAS DA LEI FUNDAMENTAL:
 * - Regra 1: Sem parâmetros numéricos com default na assinatura; sem cortes silenciosos.
 * - Regra 2: Status fechado ("encontrado", "sem-cena-limpa", "cota-esgotada", "servico-indisponivel").
 * - Regra 3: Proveniência com data de aquisição da cena (nunca data da consulta).
 */

export interface MetadadosCenaPlanet {
  id: string; // Ex: 20260605_131520_82_2456
  dataAdquisicao: string; // ISO 8601 da cena na fonte
  itemType: "PSScene";
  sensor: "SuperDove" | "Dove-R" | "Dove-Classic";
  coberturaNuvemGlobalPct: number;
  fracaoLimpaAoiPct: number; // Avaliada na AOI do ponto (UDM2)
  anguloZenital: number;     // Em graus
  assetsDisponiveis: string[];
}

export type StatusBuscaPlanet =
  | "encontrado"
  | "sem-cena-limpa"
  | "cota-esgotada"
  | "servico-indisponivel";

export interface ResultadoBuscaCatalogo {
  status: StatusBuscaPlanet;
  cenas: MetadadosCenaPlanet[];
  motivo?: string;
  consultadoEm: string;
}

export interface FiltrosBuscaPlanet {
  latitude: number;
  longitude: number;
  raioBufferMetros: number; // P04 / D18 (ex.: 250m)
  dataInicio: string;        // ISO YYYY-MM-DD
  dataFim: string;           // ISO YYYY-MM-DD
  minFracaoLimpaAoiPct: number; // P06 (ex.: 80.0%)
}

/**
 * Avalia a qualidade de uma cena sobre a AOI com base na máscara UDM2.
 * Fração limpa = pixels sem nuvem nem sombra na janela do alvo.
 */
export function avaliarQualidadeUdm2NaAoi(
  pixelsTotaisAoi: number,
  pixelsClear: number,
  pixelsSombra: number,
  pixelsNuvem: number,
  limiarMinimoPct: number // P06
): { fracaoLimpaPct: number; aprovado: boolean } {
  if (pixelsTotaisAoi <= 0) {
    return { fracaoLimpaPct: 0, aprovado: false };
  }

  const pixelsComprometidos = pixelsSombra + pixelsNuvem;
  const pixelsLimpos = pixelsClear > pixelsComprometidos ? pixelsClear - pixelsComprometidos : 0;
  const fracao = Number(((pixelsLimpos / pixelsTotaisAoi) * 100).toFixed(1));

  return {
    fracaoLimpaPct: fracao,
    aprovado: fracao >= limiarMinimoPct,
  };
}

/**
 * Executa busca no catálogo PlanetScope com filtragem UDM2 por AOI.
 */
export async function buscarCenasPlanet(
  filtros: FiltrosBuscaPlanet,
  consultadoEm: string,
  provedorBuscaApi?: (f: FiltrosBuscaPlanet) => Promise<MetadadosCenaPlanet[]>
): Promise<ResultadoBuscaCatalogo> {
  const minLimpo = filtros.minFracaoLimpaAoiPct;

  try {
    if (!provedorBuscaApi) {
      return {
        status: "servico-indisponivel",
        cenas: [],
        motivo: "Provedor da Planet Data API não configurado nesta sessão.",
        consultadoEm,
      };
    }

    const cenasBrutas = await provedorBuscaApi(filtros);

    // Filtra cenas que satisfazem a fração limpa na AOI
    const cenasAprovadas = cenasBrutas.filter((c) => c.fracaoLimpaAoiPct >= minLimpo);

    if (cenasAprovadas.length === 0) {
      return {
        status: "sem-cena-limpa",
        cenas: [],
        motivo: `Nenhuma cena PSScene com fração limpa >= ${minLimpo}% encontrada na janela temporal ${filtros.dataInicio} a ${filtros.dataFim}.`,
        consultadoEm,
      };
    }

    return {
      status: "encontrado",
      cenas: cenasAprovadas,
      consultadoEm,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("cota") || msg.includes("quota") || msg.includes("OVERAGE")) {
      return {
        status: "cota-esgotada",
        cenas: [],
        motivo: `Operação recusada pela Planet API por limite de cota: ${msg}`,
        consultadoEm,
      };
    }

    return {
      status: "servico-indisponivel",
      cenas: [],
      motivo: `Falha na consulta ao catálogo Planet: ${msg}. Nada se afirma sobre a cobertura.`,
      consultadoEm,
    };
  }
}
