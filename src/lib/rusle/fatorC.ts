/**
 * ============================================================================
 * Fator C de Uso e Manejo do Solo — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * O QUÊ ESTE MÓDULO CALCULA:
 * - Calcula o Fator C da Equação Universal de Perda de Solo Revisada (RUSLE)
 *   utilizando a formulação híbrida multiplicativa:
 *   C = ((1 - NDVI) / 2) * (1 + BSI)
 * - Mapeia a suscetibilidade erosiva decorrente da cobertura do solo em escala contínua,
 *   integrando tanto o vigor vegetal verde quanto a presença de palhada residual seca.
 *
 * POR QUÊ ESTA EQUAÇÃO FOI ADOTADA NA PESQUISA (SEÇÃO 2.1 & DECISÃO D01):
 * 1. O Paradoxo do Sistema Plantio Direto (SPD):
 *    Modelos clássicos baseados puramente em NDVI (como Durigon et al., 2014) assumem
 *    que qualquer redução no vigor vegetativo implica exposição e perda de solo.
 *    Na entressafra paranaense, contudo, talhões em SPD de alta performance apresentam
 *    baixa biomassa verde fotossintética (NDVI baixo, ~0.20 a 0.35), mas permanecem
 *    com 100% da superfície protegida por espessa camada de palhada residual de milho,
 *    trigo ou aveia (3 a 6 t/ha de matéria seca).
 *    A fórmula puramente linear superestimaria o Fator C (C ~ 0.40), classificando
 *    falsamente uma área conservacionista como degradada.
 * 2. Discriminação Óptica pelo Bare Soil Index (BSI):
 *    A palhada residual de gramíneas possui alta reflectância no infravermelho de
 *    ondas curtas (SWIR B11/B12) e absorção diagnóstica de celulose/lignina,
 *    diferindo sensivelmente da curva espectral de latossolos ricos em óxidos de ferro.
 *    O BSI capta essa diferença: solo mineral exposto e lavado apresenta BSI > 0.10,
 *    enquanto solo coberto com palhada mantém BSI < 0.00.
 * 3. Síntese Biofísica Multiplicativa:
 *    A multiplicação por (1 + BSI) atua como um modulador físico sem parâmetros livres:
 *    - Se o solo estiver lavado e erodido (BSI > 0.10), o fator amplifica a perda de solo.
 *    - Se o solo estiver protegido por palhada (BSI < 0.00), o fator reduz o Fator C,
 *      reproduzindo com fidelidade a proteção mecânica contra o impacto das gotas de chuva
 *      (efeito splash) e a desaceleração do escoamento superficial laminar.
 *
 * Referências:
 * - Durigon, V. L. et al. (2014). NDVI time series for monitoring RUSLE cover
 *   management factor in a tropical watershed. Int. J. Remote Sensing, 35(2), 441-453.
 * - Metodologia PPGTCA 2026, Seção 2.1 e Tabela 1.
 */

import { Proveniencia, valorOuNulo } from "@/types/proveniencia";

export class ErroForaDoDominio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroForaDoDominio";
  }
}

/**
 * Calcula o Fator C a partir do NDVI e BSI pela formulação híbrida SPD.
 *
 * O QUÊ: Retorna o valor numérico adimensional do Fator C [0 a 1].
 * POR QUÊ: Fornece um preditor físico-informado essencial para a matriz de treino
 * do XGBoost e para a estimativa teórica de perda de solo (Linha de Base RUSLE).
 */
export function calcularFatorC(ndvi: number, bsi?: number): number {
  if (!Number.isFinite(ndvi) || ndvi < -1 || ndvi > 1) {
    throw new ErroForaDoDominio(`NDVI ${ndvi} fora do domínio biofísico [-1, 1].`);
  }
  if (bsi !== undefined) {
    if (!Number.isFinite(bsi) || bsi < -1 || bsi > 1) {
      throw new ErroForaDoDominio(`BSI ${bsi} fora do domínio biofísico [-1, 1].`);
    }
  }
  const bsiNum = bsi !== undefined ? bsi : 0;
  return ((1 - ndvi) / 2) * (1 + bsiNum);
}

/**
 * Formulação híbrida explícita adaptada ao Sistema Plantio Direto (SPD).
 */
export function calcularFatorCHibrido(ndvi: number, bsi: number): number {
  return calcularFatorC(ndvi, bsi);
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
 * Encapsulador com Proveniência Científica para o Fator C (Decisão D01 / Método Mestrado 2026).
 */
export function obterFatorCComProveniencia(
  ndviProveniencia: Proveniencia<number> | null | undefined,
  bsiProveniencia?: Proveniencia<number> | null | undefined
): Proveniencia<number> {
  if (!ndviProveniencia || ndviProveniencia.estado === "indisponivel") {
    return {
      estado: "indisponivel",
      causa: ndviProveniencia?.causa ?? "sem-cobertura",
      motivo: "NDVI indisponível na série temporal para derivação do Fator C.",
    };
  }

  const bsiVal = valorOuNulo(bsiProveniencia);
  const temBsi = bsiVal !== null && Number.isFinite(bsiVal);

  try {
    const c = calcularFatorC(ndviProveniencia.valor, temBsi ? bsiVal : 0);
    return {
      estado: "modelado",
      valor: Number(c.toFixed(4)),
      modelo: temBsi
        ? "Híbrido SPD: C = ((1 - NDVI) / 2) * (1 + BSI) (Durigon et al., 2014 modulado por BSI)"
        : "Durigon et al. (2014): C = (1 - NDVI) / 2",
      insumos: temBsi
        ? ["NDVI Sentinel-2 L2A", "BSI Sentinel-2 L2A"]
        : ["NDVI Sentinel-2 L2A"],
      decisoes: ["D01"],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      estado: "indisponivel",
      causa: "fora-do-dominio",
      motivo: msg,
    };
  }
}
