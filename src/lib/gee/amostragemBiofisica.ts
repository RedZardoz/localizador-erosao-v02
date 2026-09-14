/**
 * ============================================================================
 * Classificação e Limiares Biofísicos Espectrais — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * O QUÊ ESTE MÓDULO REALIZA:
 * - Realiza a separação objetiva, determinística e reprodutível de candidatos amostrais
 *   no espaço biofísico bidimensional composto pelo Índice de Vegetação por Diferença
 *   Normalizada (NDVI) e pelo Índice de Solo Exposto (BSI).
 * - Categoriza o pixel orbital em três estados disjuntos:
 *   1. Classe 1 (Erosão Laminar Ativa): BSI > 0.10 e NDVI < 0.40
 *   2. Classe 0 (Controle / SPD Pleno): BSI < 0.00 e NDVI > 0.65
 *   3. Classe Indefinida (Zona de Transição / Mista): Retida fora do conjunto de treino.
 *
 * POR QUÊ ESTE PROCEDIMENTO É EXIGIDO NA METODOLOGIA (SEÇÃO 3.1 & DECISÕES D02, D10):
 * 1. Eliminação de Viés e Subjetividade: A vetorização manual sobre tela introduz
 *    inconsistências cognitivas entre intérpretes. O isolamento espectral automatizado
 *    estabelece critérios matemáticos auditáveis e universais para toda a Bacia do Paraná 3.
 * 2. Física da Degradação do Solo Paranaense: Na entressafra agrícola, a erosão laminar
 *    decapita o horizonte A (rico em matéria orgânica), expondo o horizonte B textural
 *    ou latossólico com acúmulo relativo de quartzo e óxidos de ferro (hematita/goethita).
 *    Isso provoca elevação anômala da reflectância nas bandas do Vermelho (B4) e SWIR (B12),
 *    deslocando o BSI para valores positivos (> 0.10) e mantendo o NDVI estagnado (< 0.40).
 * 3. Física do Controle no Sistema Plantio Direto (SPD): Talhões com cobertura vegetal
 *    intacta ou alta densidade de palhada residual seca mitigam a reflectância do solo nu
 *    e garantem alta absorção fotossintética, posicionando o BSI em faixa negativa (< 0.00)
 *    e o NDVI acima de 0.65.
 * 4. Barreira de Proteção contra "Mixed Pixels": Manter pixels da faixa intermediária
 *    como "indefinido" evita contaminar os algoritmos de aprendizado de máquina com
 *    amostras espúrias de borda de talhão, estradas rurais ou terraços agrícolas.
 */

import type { ClasseAmostral } from "@/types/ponto";

export const CRITERIOS_ESPECTRAIS = {
  EROSAO: {
    BSI_MIN: 0.10,
    NDVI_MAX: 0.40,
    rotulo: "Erosão Laminar (Classe 1)",
    descricao: "Solo exposto e mineralizado sem cobertura vegetal ativa (Horizonte B exposto)",
  },
  CONTROLE: {
    BSI_MAX: 0.00,
    NDVI_MIN: 0.65,
    rotulo: "Controle / SPD (Classe 0)",
    descricao: "Solo protegido por biomassa ativa ou palhada residual densa no Sistema Plantio Direto",
  },
} as const;

/**
 * Classifica um ponto amostral estritamente segundo os limiares espectrais da pesquisa.
 *
 * O QUÊ: Mapeia o par (BSI, NDVI) medido pelo Sentinel-2 para a classe supervisionada.
 * POR QUÊ: Garante que apenas amostras de alta certeza biofísica alimentem a matriz
 * de treinamento do XGBoost, resguardando a integridade estatística da dissertação.
 */
export function classificarPontoEspectral(
  bsi: number | null | undefined,
  ndvi: number | null | undefined
): ClasseAmostral {
  if (
    bsi === null ||
    bsi === undefined ||
    !Number.isFinite(bsi) ||
    ndvi === null ||
    ndvi === undefined ||
    !Number.isFinite(ndvi)
  ) {
    return "indefinido";
  }

  // Classe 1: Erosão Laminar (BSI > 0.10 e NDVI < 0.40)
  if (bsi > CRITERIOS_ESPECTRAIS.EROSAO.BSI_MIN && ndvi < CRITERIOS_ESPECTRAIS.EROSAO.NDVI_MAX) {
    return "erosao";
  }

  // Classe 0: Controle / SPD (BSI < 0.00 e NDVI > 0.65)
  if (bsi < CRITERIOS_ESPECTRAIS.CONTROLE.BSI_MAX && ndvi > CRITERIOS_ESPECTRAIS.CONTROLE.NDVI_MIN) {
    return "controle";
  }

  return "indefinido";
}
