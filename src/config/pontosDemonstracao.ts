/**
 * ============================================================================
 * Leitor Estático de Pontos Sintéticos para Vitrine Demonstrativa (Prompt T)
 * ============================================================================
 *
 * Contém exclusivamente pontos declaradamente sintéticos (prefixo SINTETICO_NAO_VOAR_),
 * com coordenadas deslocadas no envelope da Bacia Paraná 3 (> 3,5 km de qualquer
 * ponto real) e sem códigos CAR nem proprietários reais.
 */

import demonstracaoRaw from "@/data/demonstracao_sintetica.json";
import type { PontoAmostral } from "@/types/ponto";

export const PONTOS_DEMONSTRACAO_VITRINE: PontoAmostral[] =
  demonstracaoRaw.pontos as unknown as PontoAmostral[];
