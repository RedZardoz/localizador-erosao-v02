/**
 * ============================================================================
 * Busca no Catálogo PlanetScope (Data API) e Leitura UDM2 — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * ESPECIFICAÇÃO DE BUSCA (PLANEJAMENTO V3, §5.4 E PLANO V2, §10.1):
 * - Item Type: PSScene
 * - Assets principais: ortho_analytic_8b_sr (SuperDove 8 bandas SR) e udm2 (máscara).
 * - Filtro UDM2 por AOI: Avalia a fração limpa na geometria específica do alvo.
 *   Uma cena com 60% de nuvens no mosaico geral pode estar 100% desanuviada
 *   sobre o talhão de estudo.
 */

export interface MetadadosCenaPlanet {
  id: string; // Ex: 20260605_131520_82_2456
  dataAdquisicao: string; // ISO 8601
  itemType: "PSScene";
  sensor: "SuperDove" | "Dove-R" | "Dove-Classic";
  coberturaNuvemGlobalPct: number;
  fracaoLimpaAoiPct: number; // Derivado da máscara UDM2 na AOI do alvo
  anguloZenital: number;     // Em graus (para verificação de geometria comparável)
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
  raioBufferMetros?: number; // Padrão: 250m
  dataInicio: string;        // ISO YYYY-MM-DD
  dataFim: string;           // ISO YYYY-MM-DD
  minFracaoLimpaAoiPct?: number; // Padrão: 80%
}

/**
 * Avalia a qualidade de uma cena sobre a AOI com base no UDM2.
 */
export function avaliarQualidadeUdm2NaAoi(
  pixelsTotaisAoi: number,
  pixelsClear: number,
  pixelsSombra: number,
  pixelsNuvem: number
): { fracaoLimpaPct: number; aprovado: boolean } {
  if (pixelsTotaisAoi <= 0) return { fracaoLimpaPct: 0, aprovado: false };
  // Fração limpa = pixels sem nuvem nem sombra na janela
  const pixelsLimpos = Math.max(0, pixelsClear - pixelsSombra - pixelsNuvem);
  const fracao = Number(((pixelsLimpos / pixelsTotaisAoi) * 100).toFixed(1));
  return {
    fracaoLimpaPct: fracao,
    aprovado: fracao >= 80.0,
  };
}

/**
 * Executa busca no catálogo PlanetScope com filtragem UDM2 por AOI.
 */
export async function buscarCenasPlanet(
  filtros: FiltrosBuscaPlanet,
  provedorBuscaApi?: (f: FiltrosBuscaPlanet) => Promise<MetadadosCenaPlanet[]>
): Promise<ResultadoBuscaCatalogo> {
  const agora = new Date().toISOString();
  const minLimpo = filtros.minFracaoLimpaAoiPct ?? 80.0;

  try {
    if (!provedorBuscaApi) {
      // Mock controlado de catálogo para testes locais / offline
      return {
        status: "servico-indisponivel",
        cenas: [],
        motivo: "Chave ou cliente da Planet Data API não inicializado nesta sessão.",
        consultadoEm: agora,
      };
    }

    const cenasBrutas = await provedorBuscaApi(filtros);

    // Filtra cenas que satisfazem a fração limpa na AOI
    const cenasAprovadas = cenasBrutas.filter(c => c.fracaoLimpaAoiPct >= minLimpo);

    if (cenasAprovadas.length === 0) {
      return {
        status: "sem-cena-limpa",
        cenas: [],
        motivo: `Nenhuma cena PSScene com fração limpa >= ${minLimpo}% encontrada na janela temporal ${filtros.dataInicio} a ${filtros.dataFim}.`,
        consultadoEm: agora,
      };
    }

    // Ordena da mais limpa para a menos limpa
    cenasAprovadas.sort((a, b) => b.fracaoLimpaAoiPct - a.fracaoLimpaAoiPct);

    return {
      status: "encontrado",
      cenas: cenasAprovadas,
      consultadoEm: agora,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("cota")) {
      return {
        status: "cota-esgotada",
        cenas: [],
        motivo: `Limite de requisições ou cota da conta Planet atingido: ${msg}.`,
        consultadoEm: agora,
      };
    }
    return {
      status: "servico-indisponivel",
      cenas: [],
      motivo: `Falha na consulta à Planet Data API: ${msg}.`,
      consultadoEm: agora,
    };
  }
}
