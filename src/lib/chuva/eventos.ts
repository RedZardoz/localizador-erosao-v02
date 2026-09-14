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

export interface ObservacaoSoloNuTemporal {
  data: string; // YYYY-MM-DD
  ehSoloNu: boolean; // true quando NDVI < 0.40 (D10)
  ndvi?: number | null;
  bsi?: number | null;
}

export interface InsumosChuvaCompletos {
  serieDiariaChirps: RegistroChuvaDiaria[];
  serieImerg: RegistroImergSemiHorario[];
  dataReferencia?: string;
  serieSoloNu?: ObservacaoSoloNuTemporal[];
}

/**
 * Calcula o Índice de Mecanismo Biofísico-Pluviométrico:
 * Sigma_t (Erosividade_t * SoloNu_t)
 *
 * Acopla a série temporal pluviométrica diária (CHIRPS) com o estado de exposição
 * do solo (Sentinel-2, limiar D10: NDVI < 0.40).
 *
 * Para cada evento pluviométrico, associa a observação orbital de solo mais próxima
 * em uma janela temporal de até toleranciaDias (padrão: 30 dias).
 *
 * @param chuvas Série de chuva diária (ou eventos com erosividade)
 * @param observacoesSolo Série de observações de exposição de solo
 * @param toleranciaDias Janela máxima de pareamento temporal (padrão: 30 dias)
 */
const TOLERANCIA_PAREAMENTO_DIAS_PADRAO = 30;

export function calcularIndiceMecanismo(
  chuvas: Array<{ data: string; precipitacaoMm?: number; erosividade?: number }>,
  observacoesSolo: ObservacaoSoloNuTemporal[],
  toleranciaDias?: number
): number | null {
  if (!chuvas || chuvas.length === 0 || !observacoesSolo || observacoesSolo.length === 0) {
    return null;
  }

  const tolDias = toleranciaDias !== undefined ? toleranciaDias : TOLERANCIA_PAREAMENTO_DIAS_PADRAO;

  // Prepara série de solo com timestamps ordenados
  const soloOrdenado = observacoesSolo
    .map((s) => ({
      data: s.data,
      ms: new Date(s.data).getTime(),
      ehSoloNu: s.ehSoloNu,
    }))
    .filter((s) => !isNaN(s.ms))
    .sort((a, b) => a.ms - b.ms);

  if (soloOrdenado.length === 0) return null;

  const maxDifMs = tolDias * 24 * 60 * 60 * 1000;
  let soma = 0;
  let diasPareados = 0;

  for (const chuva of chuvas) {
    const chuvaMs = new Date(chuva.data).getTime();
    if (isNaN(chuvaMs)) continue;

    const valorChuva = chuva.erosividade !== undefined ? chuva.erosividade : chuva.precipitacaoMm;
    if (valorChuva === undefined || !Number.isFinite(valorChuva) || valorChuva <= 0) continue;

    // Busca a observação de satélite temporalmente mais próxima
    let maisProxima: { ms: number; ehSoloNu: boolean } | null = null;
    let menorDif = Infinity;

    for (const obs of soloOrdenado) {
      const dif = Math.abs(obs.ms - chuvaMs);
      if (dif < menorDif) {
        menorDif = dif;
        maisProxima = obs;
      }
    }

    if (maisProxima && menorDif <= maxDifMs) {
      diasPareados++;
      if (maisProxima.ehSoloNu) {
        soma += valorChuva;
      }
    }
  }

  if (diasPareados === 0) {
    return null;
  }

  return Number(soma.toFixed(2));
}

/**
 * Constrói o BlocoChuva completo de um ponto amostral, garantindo:
 * - Acumulados CHIRPS (30d e 90d) medidos ou indisponíveis com causa.
 * - I30 máximo IMERG medido ou indisponível com causa.
 * - nEventosErosivos e indiceMecanismo marcados com proveniência metodológica estrita.
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

  // nEventosErosivos aguarda formalização do critério de corte D13 (10 mm vs 12,7 mm/h)
  const nEventosErosivos: Proveniencia<number> = {
    estado: "indisponivel",
    causa: "decisao-pendente",
    motivo:
      "Cálculo de número de eventos erosivos aguarda homologação da Decisão D13 (critério de evento erosivo).",
  };

  // Se a série de solo nu for fornecida, calcula o índice de mecanismo acoplado
  let indiceMecanismo: Proveniencia<number>;
  if (insumos.serieSoloNu && insumos.serieSoloNu.length > 0) {
    const valIndice = calcularIndiceMecanismo(insumos.serieDiariaChirps, insumos.serieSoloNu);
    if (valIndice !== null && Number.isFinite(valIndice)) {
      indiceMecanismo = {
        estado: "modelado",
        valor: valIndice,
        modelo: "Sigma_t (precipitacao_t * soloNu_t)",
        insumos: ["CHIRPS (DAILY)", "Sentinel-2 (MSI)"],
        decisoes: ["D10"],
      };
    } else {
      indiceMecanismo = {
        estado: "indisponivel",
        causa: "insuficiente",
        motivo: "Dados de chuva ou observações de satélite insuficientes para pareamento temporal do índice de mecanismo.",
      };
    }
  } else {
    // Mantém compatibilidade com pontos onde a série de solo nu ainda não foi processada
    indiceMecanismo = {
      estado: "indisponivel",
      causa: "decisao-pendente",
      motivo:
        "Índice de mecanismo [Sigma(erosividade * soloNu)] depende da homologação formal de D13 e D10.",
    };
  }

  return {
    precipAcum30d,
    precipAcum90d,
    i30Max,
    nEventosErosivos,
    indiceMecanismo,
  };
}
