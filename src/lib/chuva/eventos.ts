/**
 * ============================================================================
 * Detecção de Eventos Erosivos e Bloco de Chuva — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * REGRAS METODOLÓGICAS:
 * - nEventosErosivos: Retorna rigorosamente "indisponivel" com causa "decisao-pendente"
 *   enquanto a Decisão D13 (limiar de evento erosivo: 10 mm vs 12,7 mm/h I30) não for
 *   formalmente tomada pelo pesquisador.
 * - indiceMecanismo: Retorna rigorosamente "indisponivel" com causa "decisao-pendente"
 *   enquanto D13 e D10 (limiar de solo exposto) estiverem pendentes.
 * - Invariante 5: NUNCA preencher variáveis pendentes com 0, null solto ou valores inventados.
 */

import { BlocoChuva } from "@/types/ponto";
import { Proveniencia } from "@/types/proveniencia";
import { RegistroChuvaDiaria, calcularAcumuladosChuva, criarProvenienciaChirps } from "./chirps";
import { RegistroImergSemiHorario, extrairI30Maximo, criarProvenienciaImerg } from "./imerg";

export interface InsumosChuvaCompletos {
  serieDiariaChirps: RegistroChuvaDiaria[];
  serieImerg: RegistroImergSemiHorario[];
  dataReferencia?: string;
}

/**
 * Constrói o BlocoChuva completo de um ponto amostral, garantindo:
 * - Acumulados CHIRPS (30d e 90d) medidos ou indisponíveis com causa.
 * - I30 máximo IMERG medido ou indisponível com causa.
 * - nEventosErosivos e indiceMecanismo marcados explicitamente com causa "decisao-pendente" (D13/D10).
 */
export function construirBlocoChuva(insumos: InsumosChuvaCompletos): BlocoChuva {
  const acumulados = calcularAcumuladosChuva(insumos.serieDiariaChirps);
  const i30 = extrairI30Maximo(insumos.serieImerg);
  const dataRef = insumos.dataReferencia || new Date().toISOString().split("T")[0];

  const precipAcum30d = criarProvenienciaChirps(
    acumulados.acum30d,
    "Acumulado móvel de 30 dias na janela de amostragem",
    dataRef
  );

  const precipAcum90d = criarProvenienciaChirps(
    acumulados.acum90d,
    "Acumulado móvel de 90 dias na janela de amostragem",
    dataRef
  );

  const i30Max = criarProvenienciaImerg(
    i30,
    "Intensidade máxima sub-horária (taxa em janela de 30 min)",
    dataRef
  );

  // nEventosErosivos aguarda D13
  const nEventosErosivos: Proveniencia<number> = {
    estado: "indisponivel",
    causa: "decisao-pendente",
    motivo:
      "Cálculo de número de eventos erosivos aguarda homologação da Decisão D13 (critério de evento erosivo).",
  };

  // indiceMecanismo aguarda D13 e D10
  const indiceMecanismo: Proveniencia<number> = {
    estado: "indisponivel",
    causa: "decisao-pendente",
    motivo:
      "Índice de mecanismo [Sigma(erosividade * soloNu)] depende da homologação formal de D13 e D10.",
  };

  return {
    precipAcum30d,
    precipAcum90d,
    i30Max,
    nEventosErosivos,
    indiceMecanismo,
  };
}
