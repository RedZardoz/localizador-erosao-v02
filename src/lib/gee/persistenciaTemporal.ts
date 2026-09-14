/**
 * ============================================================================
 * Discriminacao de Persistencia Temporal (Pousio vs Degradacao Cronica) ? SAREL
 * PPGTCA 2026 ? Pesquisa de Mestrado em Erosao Laminar
 * ============================================================================
 *
 * FUNDAMENTACAO METODOLOGICA (SECAO 6.1 DO PROJETO DE PESQUISA):
 * - Uma cena isolada NAO separa solo recem-gradeado de solo erodido: ambos
 *   apresentam alta reflectancia e BSI elevado (> 0.10).
 * - A serie temporal multianual (Sentinel-2 2016-2026) separa com rigor fisico:
 *   1. POUSIO AGRICOLA / GRADEADO (Transitorio):
 *      Ocorre por 30 a 60 dias durante a dessecacao ou preparo do solo (NDVI < 0.40).
 *      Em seguida, ha rapido fechamento do dossel vegetal (NDVI > 0.65).
 *      Apresenta padrao fenologico ciclico sazonal regular.
 *   2. EROSAO LAMINAR SEVERA / DEGRADACAO CRONICA (Persistente):
 *      Horizonte B exposto com perda de materia organica e enriquecimento em oxidos
 *      de ferro (razao B4/B2 e B12 elevados).
 *      Mesmo com cultura implantada, o vigor e cronicamente atrofiado (NDVI_max < 0.55),
 *      com frequencia de solo descoberto persistente safra apos safra (E > 0.25)
 *      e tendencia linear positiva no infravermelho de ondas curtas (SWIR B12).
 *
 * BASE CIENTIFICA:
 * - Zhu & Woodcock (2014) ? Continuous Change Detection and Classification (CCDC).
 * - Dematte et al. (2018) ? GEOS3 (Geotechnologies in Soil Science).
 */

import { ObservacaoCena, calcularNdvi, calcularBsi } from "./serieTemporal";

export type RegimeFenologico =
  | "degradacao_persistente" // Erosao laminar ativa / cronica (Classe 1)
  | "pousio_transitorio"     // Manejo agricola regular / plantio direto (Classe 0)
  | "vegetacao_estavel"      // Cobertura vegetal densa permanente / pastagem bem manejada
  | "inconclusivo";          // Cobertura temporal insuficiente ou ruido de nuvens

export interface DiagnosticoPersistencia {
  regime: RegimeFenologico;
  confianca: "alta" | "media" | "baixa";
  frequenciaExposicao: number;          // Fracao de cenas validas com solo nu (0.0 a 1.0)
  maxSequenciaExposicaoDias: number;    // Duracao maxima continua de solo exposto em dias
  recuperouDossel: boolean;             // Teve recuperacao com NDVI > 0.65 apos exposicao
  ndviMaximoMediano: number;            // Vigor vegetativo de pico historico mediano
  taxaDegradacaoSwirAnual: number;      // Tendencia de aumento no SWIR (B12) em % ao ano
  nObservacoesValidas: number;
  motivoCientifico: string;
}

export interface OpcoesPersistencia {
  limiarNdviSoloNu: number;        // Padrao do metodo: 0.40 (D10)
  limiarNdviDosselFechado: number; // Padrao: 0.65 (Controle SPD)
  limiarFreqDegradacao: number;    // Padrao: 0.25 (mais de 25% do tempo com solo nu)
}

/**
 * Analisa a trajetoria multitemporal de um ponto para separar formalmente
 * pousio agricola transitorio de erosao laminar severa persistente.
 *
 * O QUÊ FAZ:
 * Examina a trajetória fenológico-espectral multianual de um ponto amostral (série Sentinel-2 2016-2026),
 * calculando a frequência de exposição de solo nu (E >= 0.25), a duração máxima contínua de episódios de
 * solo exposto em dias, a taxa de recuperação do dossel vegetal (NDVI >= 0.65), o vigor vegetativo de
 * pico histórico (percentil 90 de NDVI) e a taxa de declive temporal no infravermelho SWIR (Banda B12).
 *
 * POR QUE FAZ:
 * Uma imagem de satélite isolada é biofisicamente incapaz de separar solo recém-gradeado ou em dessecação
 * pré-plantio de uma feição erodida: ambos exibem forte reflectância em superfície e BSI elevado (> 0.10).
 * A análise de persistência temporal contínua (CCDC) desfaz essa ambiguidade espectral:
 * 1. O pousio agrícola é um estado efêmero e cíclico (<= 120 dias) com rápida recuperação do vigor
 *    vegetativo subsequente (NDVI >= 0.65);
 * 2. A erosão laminar crônica expõe o horizonte subsuperficial B, causando atrofia perene do dossel
 *    (NDVI_max < 0.55), alta frequência temporal de solo nu safra após safra (E >= 0.25) e tendência
 *    de aumento na reflectância do SWIR B12 (enriquecimento relativo em óxidos de ferro e perda de água do solo).
 */
export function analisarPersistenciaTemporal(
  cenas: ObservacaoCena[],
  opcoes: OpcoesPersistencia
): DiagnosticoPersistencia {
  const { limiarNdviSoloNu, limiarNdviDosselFechado, limiarFreqDegradacao } = opcoes;

  // 1. Filtrar e ordenar cronologicamente observacoes sem nuvem
  const validas = cenas
    .filter((c) => !c.nuvemSombra && c.b4 !== null && c.b8 !== null)
    .sort((a, b) => a.data.localeCompare(b.data));

  const nValidas = validas.length;

  if (nValidas < 6) {
    return {
      regime: "inconclusivo",
      confianca: "baixa",
      frequenciaExposicao: 0,
      maxSequenciaExposicaoDias: 0,
      recuperouDossel: false,
      ndviMaximoMediano: 0,
      taxaDegradacaoSwirAnual: 0,
      nObservacoesValidas: nValidas,
      motivoCientifico: `Serie com apenas ${nValidas} observacoes validas (minimo de 6 exigido para discriminacao temporal).`,
    };
  }

  // 2. Extracao de perfis temporais de NDVI, BSI e B12
  const serieProcessada = validas.map((c) => {
    const ndvi = calcularNdvi(c.b8, c.b4)!;
    const bsi = calcularBsi(c.b11, c.b4, c.b8, c.b2);
    const dataMs = new Date(c.data).getTime();
    return {
      data: c.data,
      dataMs,
      tAnos: c.tAnos,
      ndvi,
      bsi,
      b12: c.b12,
      ehSoloNu: ndvi < limiarNdviSoloNu,
      ehDosselFechado: ndvi >= limiarNdviDosselFechado,
    };
  });

  const nSoloNu = serieProcessada.filter((p) => p.ehSoloNu).length;
  const frequenciaExposicao = Number((nSoloNu / nValidas).toFixed(4));

  // 3. Avaliacao de Duracao Continua e Recuperacao de Dossel
  let maxDiasExposicao = 0;
  let recuperouDossel = false;
  let inicioExposicaoMs: number | null = null;

  for (let i = 0; i < serieProcessada.length; i++) {
    const p = serieProcessada[i];

    if (p.ehSoloNu) {
      if (inicioExposicaoMs === null) {
        inicioExposicaoMs = p.dataMs;
      }
    } else {
      if (inicioExposicaoMs !== null) {
        const dias = Math.round((p.dataMs - inicioExposicaoMs) / (1000 * 60 * 60 * 24));
        if (dias > maxDiasExposicao) {
          maxDiasExposicao = dias;
        }
        inicioExposicaoMs = null;
      }
      if (p.ehDosselFechado) {
        recuperouDossel = true;
      }
    }
  }

  if (inicioExposicaoMs !== null) {
    const ultP = serieProcessada[serieProcessada.length - 1];
    const dias = Math.round((ultP.dataMs - inicioExposicaoMs) / (1000 * 60 * 60 * 24));
    if (dias > maxDiasExposicao) maxDiasExposicao = dias;
  }

  // 4. Estimativa do Vigor Vegetativo Maximo (Percentil 90 de NDVI)
  const ndvisOrdenados = [...serieProcessada.map((p) => p.ndvi)].sort((a, b) => a - b);
  const idxP90 = Math.floor(ndvisOrdenados.length * 0.9);
  const ndviMaximo = Number(ndvisOrdenados[idxP90].toFixed(3));

  // 5. Tendencia Linear do SWIR (B12) ao longo do tempo (declive beta1 da regressao)
  let taxaDegradacaoSwirAnual = 0;
  const pontosComB12 = serieProcessada.filter((p) => p.b12 !== null && Number.isFinite(p.b12));

  if (pontosComB12.length >= 6) {
    const tMedio = pontosComB12.reduce((acc, p) => acc + p.tAnos, 0) / pontosComB12.length;
    const b12Medio = pontosComB12.reduce((acc, p) => acc + p.b12!, 0) / pontosComB12.length;

    let num = 0;
    let den = 0;
    for (const p of pontosComB12) {
      const dt = p.tAnos - tMedio;
      num += dt * (p.b12! - b12Medio);
      den += dt * dt;
    }
    if (den > 1e-6) {
      taxaDegradacaoSwirAnual = Number((num / den).toFixed(4));
    }
  }

  // 6. Matriz de Decisao Biofisica (CCDC / PPGTCA 2026)
  if (frequenciaExposicao === 0 && ndviMaximo >= limiarNdviDosselFechado) {
    return {
      regime: "vegetacao_estavel",
      confianca: "alta",
      frequenciaExposicao,
      maxSequenciaExposicaoDias: 0,
      recuperouDossel: true,
      ndviMaximoMediano: ndviMaximo,
      taxaDegradacaoSwirAnual,
      nObservacoesValidas: nValidas,
      motivoCientifico:
        "Serie com cobertura vegetal continua (zero exposicoes de solo) e NDVI robusto.",
    };
  }

  // Se o solo esteve exposto, mas teve recuperacao com dossel fechado (NDVI >= 0.65) e a duracao foi transitoria:
  if (recuperouDossel && ndviMaximo >= limiarNdviDosselFechado && maxDiasExposicao <= 120) {
    return {
      regime: "pousio_transitorio",
      confianca: "alta",
      frequenciaExposicao,
      maxSequenciaExposicaoDias: maxDiasExposicao,
      recuperouDossel: true,
      ndviMaximoMediano: ndviMaximo,
      taxaDegradacaoSwirAnual,
      nObservacoesValidas: nValidas,
      motivoCientifico: `Pousio agricola transitorio: preparo de solo temporario (${maxDiasExposicao} dias) com plena recuperacao ciclica do dossel (NDVI max = ${ndviMaximo}).`,
    };
  }

  // Se o solo permanece frequentemente exposto ou o vigor historico e atrofiado safra apos safra:
  if (
    frequenciaExposicao >= limiarFreqDegradacao ||
    (frequenciaExposicao > 0.15 && ndviMaximo < 0.55) ||
    taxaDegradacaoSwirAnual > 0.015
  ) {
    const confianca: "alta" | "media" =
      frequenciaExposicao >= 0.35 || taxaDegradacaoSwirAnual > 0.02 ? "alta" : "media";

    return {
      regime: "degradacao_persistente",
      confianca,
      frequenciaExposicao,
      maxSequenciaExposicaoDias: maxDiasExposicao,
      recuperouDossel,
      ndviMaximoMediano: ndviMaximo,
      taxaDegradacaoSwirAnual,
      nObservacoesValidas: nValidas,
      motivoCientifico: `Degradacao cronica / erosao ativa persistente: alta frequencia de exposicao (${(
        frequenciaExposicao * 100
      ).toFixed(1)}%), vigor fenologico atrofiado (NDVI max = ${ndviMaximo}) e persistencia multianual.`,
    };
  }

  return {
    regime: "inconclusivo",
    confianca: "baixa",
    frequenciaExposicao,
    maxSequenciaExposicaoDias: maxDiasExposicao,
    recuperouDossel,
    ndviMaximoMediano: ndviMaximo,
    taxaDegradacaoSwirAnual,
    nObservacoesValidas: nValidas,
    motivoCientifico:
      "Serie com padrao fenologico intermediario nao conclusivo entre manejo e degradacao.",
  };
}
