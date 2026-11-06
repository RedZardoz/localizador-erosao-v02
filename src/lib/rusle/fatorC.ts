/**
 * ============================================================================
 * Fator C de Uso e Manejo do Solo — SAREL (PPGTCA 2026)
 * Decisão D01 — Durigon et al. (2014)
 * ============================================================================
 *
 * O QUÊ ESTE MÓDULO CALCULA:
 * - Calcula o Fator C da Equação Universal de Perda de Solo Revisada (RUSLE)
 *   utilizando estritamente o modelo de Durigon et al. (2014):
 *   C = (1 - NDVI) / 2
 * - Mapeia a atenuação das perdas de solo pela cobertura vegetal em escala contínua,
 *   derivada da série temporal Sentinel-2 L2A.
 *
 * FUNDAMENTAÇÃO METODOLÓGICA (DECISÃO D01):
 * - Adotada pelo pesquisador em 2026-09-08 e reafirmada em 2026-11-06.
 * - Validade regional para bacia hidrográfica tropical brasileira.
 * - Formulação direta sem parâmetros livres e sem corte artificial.
 * - Variantes exploratórias (ex.: modulação espectral por BSI ou formulação exponencial
 *   de Van der Knijff et al., 2000) são mantidas estritamente como funções de
 *   análise de sensibilidade fora do caminho analítico oficial (§12 e §18).
 *
 * Referências:
 * - Durigon, V. L. et al. (2014). NDVI time series for monitoring RUSLE cover
 *   management factor in a tropical watershed. Int. J. Remote Sensing, 35(2), 441-453.
 */

import { Proveniencia } from "@/types/proveniencia";
import { DECISOES, exigirDecisao, ErroDecisaoPendente } from "@/config/decisoes";

export class ErroForaDoDominio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroForaDoDominio";
  }
}

/**
 * Calcula o Fator C a partir do NDVI pela formulação de Durigon et al. (2014): C = (1 - NDVI) / 2.
 *
 * O QUÊ: Retorna o valor numérico adimensional do Fator C em [0, 1].
 * POR QUÊ: Fornece a linha de base física de cobertura do solo conforme a Decisão D01.
 *
 * AVALIAÇÃO DE DOMÍNIO DE C (§23.8):
 * Com NDVI rigorosamente validado no domínio biofísico [-1, 1], a função linear C = (1 - NDVI) / 2
 * mapeia bijectionalmente [-1, 1] no intervalo físico fechado [0, 1]:
 *   NDVI = -1.0 -> C = 1.0 (exposição / suscetibilidade máxima)
 *   NDVI =  0.0 -> C = 0.5 (solo desnudo de referência)
 *   NDVI =  1.0 -> C = 0.0 (cobertura vegetal total)
 * Portanto, para entradas válidas, C pertence a [0, 1] por construção matemática, não necessitando
 * de cortes ou pisos em tempo de execução.
 */
export function calcularFatorC(ndvi: number): number {
  if (!Number.isFinite(ndvi) || ndvi < -1 || ndvi > 1) {
    throw new ErroForaDoDominio(`NDVI ${ndvi} fora do domínio biofísico [-1, 1].`);
  }

  // Consulta mandatória ao Registro de Decisões (Decisão D01) (§8, Regra 9)
  exigirDecisao(DECISOES.D01);

  return (1 - ndvi) / 2;
}

/**
 * Formulação exploratória para análise de sensibilidade com modulação espectral por BSI (NÃO integra o caminho analítico oficial).
 */
export function calcularFatorCSensibilidadeBsi(ndvi: number, bsi: number): number {
  if (!Number.isFinite(ndvi) || ndvi < -1 || ndvi > 1) {
    throw new ErroForaDoDominio(`NDVI ${ndvi} fora do domínio biofísico [-1, 1].`);
  }
  if (!Number.isFinite(bsi) || bsi < -1 || bsi > 1) {
    throw new ErroForaDoDominio(`BSI ${bsi} fora do domínio biofísico [-1, 1].`);
  }

  const c = ((1 - ndvi) / 2) * (1 + bsi);
  if (!Number.isFinite(c) || c < 0 || c > 1) {
    throw new ErroForaDoDominio(
      `Fator C de sensibilidade (${c.toFixed(4)}) fora do domínio físico [0, 1] da RUSLE para os insumos NDVI=${ndvi} e BSI=${bsi}.`
    );
  }
  return c;
}

/**
 * Fator C alternativo para análise de sensibilidade segundo van der Knijff et al. (2000):
 * C = exp(-alpha * (NDVI / (beta - NDVI)))
 * com parâmetros típicos alpha = 2 e beta = 1 (van der Knijff et al., 2000).
 */
export function calcularFatorCVanDerKnijff(ndvi: number, alpha: number, beta: number): number {
  if (!Number.isFinite(ndvi) || ndvi < -1 || ndvi > 1) {
    throw new ErroForaDoDominio(`NDVI ${ndvi} fora do domínio biofísico [-1, 1].`);
  }
  if (ndvi >= beta) {
    return 0.0;
  }
  if (ndvi <= 0) {
    return 1.0;
  }
  const expoente = -alpha * (ndvi / (beta - ndvi));
  return Math.exp(expoente);
}

/**
 * Encapsulador com Proveniência Científica para o Fator C (Decisão D01 / Durigon et al., 2014).
 */
export function obterFatorCComProveniencia(
  ndviProveniencia: Proveniencia<number> | null | undefined
): Proveniencia<number> {
  if (!ndviProveniencia || ndviProveniencia.estado === "indisponivel") {
    return {
      estado: "indisponivel",
      causa: ndviProveniencia?.causa ?? "sem-cobertura",
      motivo: "NDVI indisponível na série temporal para derivação do Fator C.",
    };
  }

  try {
    const c = calcularFatorC(ndviProveniencia.valor);
    return {
      estado: "modelado",
      valor: Number(c.toFixed(4)),
      modelo: "Durigon et al. (2014): C = (1 - NDVI) / 2",
      insumos: ["NDVI Sentinel-2 L2A"],
      decisoes: ["D01"],
    };
  } catch (err: unknown) {
    if (err instanceof ErroDecisaoPendente) {
      return {
        estado: "indisponivel",
        causa: "decisao-pendente",
        motivo: `Fator C aguarda definição metodológica da Decisão ${err.decisaoId}.`,
      };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return {
      estado: "indisponivel",
      causa: "fora-do-dominio",
      motivo: msg,
    };
  }
}
