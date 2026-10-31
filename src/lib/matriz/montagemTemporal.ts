/**
 * ============================================================================
 * Montagem de Preditores Multitemporais (Time-Series Stacking) — SAREL
 * PPGTCA 2026 — Pesquisa de Mestrado em Erosão Laminar
 * ============================================================================
 *
 * ESPECIFICAÇÃO METODOLÓGICA (SEÇÃO 4 E 6 DO PROJETO DE PESQUISA):
 * 1. Segregação Temporal Modelo D vs Modelo P (Decisão D04):
 *    - MODELO D (Detecção contemporânea):
 *      Série temporal até a data do evento / validação (t0).
 *      Mapeia o estado contemporâneo de degradação da feição.
 *    - MODELO P (Prognóstico Preditivo / Suscetibilidade Antecipada 6 a 12 meses):
 *      Série temporal encerrada antes da data do evento com Intervalo de Guarda (>= 12 meses).
 *      Elimina o vazamento temporal (data leakage), garantindo que o modelo prediga
 *      o risco futuro com base no histórico de manejo e vulnerabilidade física prévia.
 * 2. Time-Series Stacking com Lags Multitemporais:
 *    - Lags temporais de NDVI e BSI: t-12m (mesma safra no ano anterior), t-6m, t-3m.
 * 3. Estatísticas Robustas e Harmônicos:
 *    - Percentis (p10, p50, p90) de NDVI e BSI.
 *    - Tendência de degradação linear no SWIR (B12).
 *    - Frequência multianual de solo exposto (E^).
 */

import { ObservacaoCena, calcularNdvi, calcularBsi, definirJanelasModelo, filtrarSeriePorJanela } from "../gee/serieTemporal";
import { analisarPersistenciaTemporal, DiagnosticoPersistencia } from "../gee/persistenciaTemporal";
import { ajustarHarmonicosBanda } from "../gee/harmonicos";
import { DECISOES, exigirParametro } from "@/config/decisoes";
import { Proveniencia, indisponivel, modelado, valorOuNulo } from "@/types/proveniencia";

/**
 * Piso mínimo de observações válidas para percentis de cauda (p10 e p90),
 * conforme DP-24 e Hyndman & Fan (1996, Definição 6, The American Statistician 50(4):361-365).
 * Para p = 0,10, Pr(X < X(1)) = 1/(n+1) <= 0,10 => n >= 9.
 */
export const N_MINIMO_PERCENTIS_CAUDA_DP24 = 9;

/**
 * Piso mínimo de observações válidas para frequência de solo nu (Ê) em janelas plurianuais
 * (D04/D05: bienal e decenal), conforme Decisão D11.2 e lastro estatístico binomial
 * (Agresti & Coull 1998; Brown, Cai & DasGupta 2001).
 * Para n >= 12, o erro-padrão assintótico no ponto de máxima variância (p = 0,5)
 * é SE(Ê) = 0,5 / sqrt(12) <= 0,1443 (SE <= 14,4%), fornecendo 13 níveis discretos
 * e suporte estável para a discriminação dos tercis da dimensão Ê de D12.
 */
export const N_MINIMO_OBSERVACOES_SOLO_NU_D11_2 = 12;

/**
 * Piso mínimo excepcional de fallback para frequência de solo nu (Ê) admitido
 * exclusivamente em janelas sazonais curtas (< 120 dias / 4 meses), conforme Decisão D11.2.
 * Produz SE(Ê) = 0,5 / sqrt(6) ≈ 0,2041 (SE ≈ 20,4%).
 * O valor gerado carrega proveniência com regime explicitamente marcado e erro-padrão declarado.
 * ATENÇÃO: Conforme D11.2 e D12, valores obtidos sob regime de fallback possuem incerteza
 * da ordem da largura de um tercil inteiro (~0,25) e NÃO são elegíveis para o cálculo dos
 * tercis nem para a classificação nos 18 estratos de D12.
 */
export const N_MINIMO_OBSERVACOES_SOLO_NU_FALLBACK_D11_2 = 6;

/**
 * Limiar de duração máxima de janela (em dias) para admissibilidade do regime de fallback
 * de janela curta (D11.2). Janelas com duração igual ou superior a 120 dias exigem
 * obrigatoriamente o piso padrão pleno de 12 observações.
 */
export const LIMIAR_DIAS_JANELA_CURTA_FALLBACK_D11_2 = 120;

/**
 * Avalia se uma medição de frequência de solo nu (Ê) é elegível para participar
 * do cálculo dos tercis empíricos e da alocação nos 18 estratos de D12.
 *
 * REGRA METODOLÓGICA (D11.2 / D12):
 * Apenas medições sob regime padrão pleno (n >= 12, SE <= 0,144) são admitidas para
 * definir os tercis empíricos de Ê em D12.
 * Valores sob regime de fallback (6 <= n < 12, SE ≈ 0,20) carregam erro-padrão da ordem
 * da largura de um tercil inteiro (~0,25) e são EXPRESSAMENTE VEDADOS de participar
 * do cálculo de D12.
 */
export function podeEntrarEstratificacaoD12(prov: Proveniencia<number>): boolean {
  if (prov.estado !== "medido" && prov.estado !== "modelado") return false;
  if (prov.estado === "modelado") {
    if (prov.qualidade?.elegivelD12 === false) return false;
    if (prov.qualidade?.regime === "fallback_janela_curta") return false;
    if (
      prov.qualidade?.nObservacoes !== undefined &&
      prov.qualidade.nObservacoes < N_MINIMO_OBSERVACOES_SOLO_NU_D11_2
    ) {
      return false;
    }
  }
  return true;
}

export interface PreditoresTemporaisPonto {
  tipoModelo: "D" | "P";
  janelaInicio: string;
  janelaFim: string;
  nObservacoesValidas: number;
  // Estatísticas agregadas
  ndvi_p10: number | null;
  ndvi_p50: number | null;
  ndvi_p90: number | null;
  bsi_p50: number | null;
  frequenciaSoloNu: Proveniencia<number>;
  frequenciaSoloNuValor: number | null;
  // Harmônicos e tendências
  tendenciaSwirB12: number | null;
  amplitudeAnualNdvi: number | null;
  // Lags temporais (Time-Series Stacking)
  lag_ndvi_t0: number | null;
  lag_ndvi_t3m: number | null;
  lag_ndvi_t6m: number | null;
  lag_ndvi_t12m: number | null;
  lag_bsi_t0: number | null;
  lag_bsi_t12m: number | null;
  // Regime fenológico derivado
  regimePersistencia: string;
}

export interface OpcoesMontagemTemporal {
  dataReferencia: string; // Data t0 (YYYY-MM-DD)
  intervaloGuardaMeses?: number; // Para Modelo P (Padrão: 24 meses / 2 anos - Decisão D04)
  duracaoJanelaAnos?: number;   // Padrão: 3 anos
  duracaoJanelaDias?: number;   // Opcional: duração explícita em dias (ex: janelas sazonais curtas < 120 dias)
  limiarNdviSoloNu?: number;    // Padrão: 0.25 (Decisão D10: GEOS3 / Demattê et al., 2018)
}

const TOLERANCIA_BUSCA_CENA_DIAS = 45;

function buscarCenaMaisProxima(
  cenasValidas: Array<{ data: string; dataMs: number; ndvi: number; bsi: number | null }>,
  alvoMs: number,
  toleranciaDias: number
): { ndvi: number; bsi: number | null } | null {
  let maisProxima: { ndvi: number; bsi: number | null } | null = null;
  let menorDif = toleranciaDias * 24 * 60 * 60 * 1000;

  for (const c of cenasValidas) {
    const dif = Math.abs(c.dataMs - alvoMs);
    if (dif < menorDif) {
      menorDif = dif;
      maisProxima = { ndvi: c.ndvi, bsi: c.bsi };
    }
  }

  return maisProxima;
}

/**
 * Monta o vetor completo de preditores temporais e lags para um ponto,
 * respeitando o isolamento entre Modelo D e Modelo P.
 *
 * O QUÊ FAZ:
 * Constrói o vetor estruturado de características multitemporais (Time-Series Stacking)
 * agregando percentis espectrais (p10, p50, p90 de NDVI e BSI), frequência multianual de solo nu,
 * componentes harmônicos sazonais, taxa linear de variação do SWIR B12 e lags retrospectivos
 * (t0, t-3m, t-6m, t-12m) a partir da trajetória de reflectância do satélite Sentinel-2.
 *
 * POR QUE FAZ:
 * A predição e detecção de erosão dependem criticamente do histórico de uso e cobertura do solo.
 * Sob o Modelo D (Detecção contemporânea), mapeia-se a feição no momento t0 da observação.
 * Sob o Modelo P (Prognóstico preventivo), é mandatório isolar a série temporal através de uma
 * janela de guarda rigorosa (24 meses / 2 anos antes do evento erosivo — Decisão D04). Esse isolamento
 * impede o vazamento temporal de informação (data leakage), garantindo que o algoritmo preveja o surgimento
 * de erosão exclusivamente a partir de fraquezas históricas de manejo e vulnerabilidades físicas
 * antecedentes à manifestação do dano pericial (Kaufman et al., 2012; Roberts et al., 2017).
 */
export function montarPreditoresTemporais(
  cenas: ObservacaoCena[],
  tipoModelo: "D" | "P",
  opcoes: OpcoesMontagemTemporal
): PreditoresTemporaisPonto {
  const {
    dataReferencia,
    // permitido: GOV-5-DESTRUTURACAO-PROVISORIA intervaloGuardaMeses janela de guarda do modelo P
    intervaloGuardaMeses = 24,
    // permitido: GOV-5-DESTRUTURACAO-PROVISORIA duracaoJanelaAnos janela retrospectiva em anos
    duracaoJanelaAnos = 3,
    limiarNdviSoloNu = exigirParametro(DECISOES.D10, "ndviSoloNu").valor,
  } = opcoes;

  const guardaAnos = intervaloGuardaMeses / 12;
  const janelas = definirJanelasModelo(dataReferencia, guardaAnos, duracaoJanelaAnos);
  let janelaAtiva = tipoModelo === "D" ? janelas.modeloD : janelas.modeloP;

  // Se especificado em dias ou fração de ano, ajusta a janela ativa
  if (opcoes.duracaoJanelaDias !== undefined && opcoes.duracaoJanelaDias > 0) {
    const fimMs = new Date(janelaAtiva.fim).getTime();
    const dInicio = new Date(fimMs - opcoes.duracaoJanelaDias * 24 * 60 * 60 * 1000);
    const ano = dInicio.getUTCFullYear();
    const mes = String(dInicio.getUTCMonth() + 1).padStart(2, "0");
    const dia = String(dInicio.getUTCDate()).padStart(2, "0");
    janelaAtiva = {
      inicio: `${ano}-${mes}-${dia}`,
      fim: janelaAtiva.fim,
    };
  } else if (duracaoJanelaAnos % 1 !== 0) {
    const fimMs = new Date(janelaAtiva.fim).getTime();
    const dInicio = new Date(fimMs - Math.round(duracaoJanelaAnos * 365.25 * 24 * 60 * 60 * 1000));
    const ano = dInicio.getUTCFullYear();
    const mes = String(dInicio.getUTCMonth() + 1).padStart(2, "0");
    const dia = String(dInicio.getUTCDate()).padStart(2, "0");
    janelaAtiva = {
      inicio: `${ano}-${mes}-${dia}`,
      fim: janelaAtiva.fim,
    };
  }

  // Filtrar cenas estritamente pertencentes à janela permitida
  const cenasJanela = filtrarSeriePorJanela(cenas, janelaAtiva);
  const validas = cenasJanela
    .filter((c) => !c.nuvemSombra && c.b4 !== null && c.b8 !== null)
    .sort((a, b) => a.data.localeCompare(b.data));

  const nValidas = validas.length;

  const inicioMs = new Date(janelaAtiva.inicio).getTime();
  const fimMs = new Date(janelaAtiva.fim).getTime();
  const difMs = fimMs - inicioMs;
  const duracaoDias = difMs > 0 ? Math.round(difMs / (1000 * 60 * 60 * 24)) : 0;
  const ehJanelaCurta = duracaoDias < LIMIAR_DIAS_JANELA_CURTA_FALLBACK_D11_2;

  if (nValidas === 0) {
    const provVazia = indisponivel<number>(
      "insuficiente",
      "Sem observações orbitais válidas na janela temporal."
    );
    return {
      tipoModelo,
      janelaInicio: janelaAtiva.inicio,
      janelaFim: janelaAtiva.fim,
      nObservacoesValidas: 0,
      ndvi_p10: null,
      ndvi_p50: null,
      ndvi_p90: null,
      bsi_p50: null,
      frequenciaSoloNu: provVazia,
      frequenciaSoloNuValor: null,
      tendenciaSwirB12: null,
      amplitudeAnualNdvi: null,
      lag_ndvi_t0: null,
      lag_ndvi_t3m: null,
      lag_ndvi_t6m: null,
      lag_ndvi_t12m: null,
      lag_bsi_t0: null,
      lag_bsi_t12m: null,
      regimePersistencia: "inconclusivo",
    };
  }

  // Estatísticas agregadas de NDVI e BSI
  const serieProcessada = validas.map((c) => ({
    data: c.data,
    dataMs: new Date(c.data).getTime(),
    ndvi: calcularNdvi(c.b8, c.b4)!,
    bsi: calcularBsi(c.b11, c.b4, c.b8, c.b2),
  }));

  const ndvis = serieProcessada.map((p) => p.ndvi).sort((a, b) => a - b);
  const bsis = serieProcessada
    .map((p) => p.bsi)
    .filter((v): v is number => v !== null && Number.isFinite(v))
    .sort((a, b) => a - b);

  // Percentis de cauda exigem n >= 9 por DP-24 / Hyndman & Fan (1996)
  const temNValidasPercentisCauda = nValidas >= N_MINIMO_PERCENTIS_CAUDA_DP24;
  const p10Idx = Math.floor(nValidas * 0.1);
  const p50Idx = Math.floor(nValidas * 0.5);
  const p90Idx = Math.floor(nValidas * 0.9);

  const ndvi_p10 = temNValidasPercentisCauda ? Number(ndvis[p10Idx].toFixed(4)) : null;
  const ndvi_p50 = Number(ndvis[p50Idx].toFixed(4));
  const ndvi_p90 = temNValidasPercentisCauda ? Number(ndvis[p90Idx].toFixed(4)) : null;
  const bsi_p50 = bsis.length > 0 ? Number(bsis[Math.floor(bsis.length * 0.5)].toFixed(4)) : null;

  // Frequência de solo nu (E^) — Decomposição D11.2 e limiar D10 (NDVI <= 0.25)
  let frequenciaSoloNu: Proveniencia<number>;

  if (nValidas < N_MINIMO_OBSERVACOES_SOLO_NU_FALLBACK_D11_2) {
    // Abaixo do piso absoluto de 6 cenas (D11.1 / D11.2)
    frequenciaSoloNu = indisponivel(
      "insuficiente",
      `Série temporal com ${nValidas} observações válidas (abaixo do piso absoluto de ${N_MINIMO_OBSERVACOES_SOLO_NU_FALLBACK_D11_2} cenas exigido por D11.1/D11.2).`
    );
  } else if (nValidas < N_MINIMO_OBSERVACOES_SOLO_NU_D11_2) {
    // 6 <= n < 12: admite fallback APENAS em janelas sazonais curtas (< 120 dias)
    if (ehJanelaCurta) {
      const nSoloNu = ndvis.filter((v) => v <= limiarNdviSoloNu).length;
      const valorFreq = Number((nSoloNu / nValidas).toFixed(4));
      const seFallback = Number((0.5 / Math.sqrt(nValidas)).toFixed(4));
      frequenciaSoloNu = modelado(
        valorFreq,
        "Proporção binomial de solo exposto sob regime de fallback de janela curta (D11.2)",
        ["Sentinel-2 MSI L2A", `NDVI <= ${limiarNdviSoloNu} (D10)`],
        ["D10", "D11.2"],
        {
          nObservacoes: nValidas,
          erroPadrao: seFallback,
          regime: "fallback_janela_curta",
          elegivelD12: false,
        }
      );
    } else {
      frequenciaSoloNu = indisponivel(
        "insuficiente",
        `Série temporal em janela plurianual (${duracaoDias} dias) possui ${nValidas} observações válidas (mínimo exigido: ${N_MINIMO_OBSERVACOES_SOLO_NU_D11_2} cenas por D11.2 para SE <= 0,144; Agresti & Coull 1998; Brown et al. 2001).`
      );
    }
  } else {
    // n >= 12: regime padrão pleno com SE <= 0,144
    const nSoloNu = ndvis.filter((v) => v <= limiarNdviSoloNu).length;
    const valorFreq = Number((nSoloNu / nValidas).toFixed(4));
    const sePadrao = Number((0.5 / Math.sqrt(nValidas)).toFixed(4));
    frequenciaSoloNu = modelado(
      valorFreq,
      "Proporção binomial de solo exposto (D11.2)",
      ["Sentinel-2 MSI L2A", `NDVI <= ${limiarNdviSoloNu} (D10)`],
      ["D10", "D11.2", "D12"],
      {
        nObservacoes: nValidas,
        erroPadrao: sePadrao,
        regime: "padrao",
        elegivelD12: true,
      }
    );
  }

  // Harmônicos do SWIR B12 (tendência de degradação)
  let tendenciaSwirB12: number | null = null;
  const coefSwir = ajustarHarmonicosBanda(cenasJanela, "b12");
  if (coefSwir.tendencia.estado === "modelado") {
    tendenciaSwirB12 = coefSwir.tendencia.valor;
  }

  // Harmônicos do NDVI (amplitude sazonal de biomassa)
  let amplitudeAnualNdvi: number | null = null;
  const coefB8 = ajustarHarmonicosBanda(cenasJanela, "b8");
  if (coefB8.amplitudeAnual.estado === "modelado") {
    amplitudeAnualNdvi = coefB8.amplitudeAnual.valor;
  }

  // Time-Series Stacking: Lags a partir da data de corte da janela
  const dataCorteMs = new Date(janelaAtiva.fim).getTime();
  const ms3m = 90 * 24 * 60 * 60 * 1000;
  const ms6m = 180 * 24 * 60 * 60 * 1000;
  const ms12m = 365 * 24 * 60 * 60 * 1000;

  const obsT0 = buscarCenaMaisProxima(serieProcessada, dataCorteMs, TOLERANCIA_BUSCA_CENA_DIAS);
  const obsT3m = buscarCenaMaisProxima(serieProcessada, dataCorteMs - ms3m, TOLERANCIA_BUSCA_CENA_DIAS);
  const obsT6m = buscarCenaMaisProxima(serieProcessada, dataCorteMs - ms6m, TOLERANCIA_BUSCA_CENA_DIAS);
  const obsT12m = buscarCenaMaisProxima(serieProcessada, dataCorteMs - ms12m, TOLERANCIA_BUSCA_CENA_DIAS);

  // Diagnóstico de Persistência Temporal
  const diag = analisarPersistenciaTemporal(cenasJanela, {
    limiarNdviSoloNu,
    limiarNdviDosselFechado: 0.65,
    limiarFreqDegradacao: 0.25,
  });

  return {
    tipoModelo,
    janelaInicio: janelaAtiva.inicio,
    janelaFim: janelaAtiva.fim,
    nObservacoesValidas: nValidas,
    ndvi_p10,
    ndvi_p50,
    ndvi_p90,
    bsi_p50,
    frequenciaSoloNu,
    frequenciaSoloNuValor: valorOuNulo(frequenciaSoloNu),
    tendenciaSwirB12,
    amplitudeAnualNdvi,
    lag_ndvi_t0: obsT0 ? obsT0.ndvi : null,
    lag_ndvi_t3m: obsT3m ? obsT3m.ndvi : null,
    lag_ndvi_t6m: obsT6m ? obsT6m.ndvi : null,
    lag_ndvi_t12m: obsT12m ? obsT12m.ndvi : null,
    lag_bsi_t0: obsT0 ? obsT0.bsi : null,
    lag_bsi_t12m: obsT12m ? obsT12m.bsi : null,
    regimePersistencia: diag.regime,
  };
}
