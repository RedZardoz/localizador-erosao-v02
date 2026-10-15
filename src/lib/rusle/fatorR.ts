/**
 * ============================================================================
 * Fator R de Erosividade da Chuva — SAREL (PPGTCA 2026)
 * Decisão D13 — Equação Regional do Paraná sobre CHIRPS Climatológico
 * ============================================================================
 *
 * FUNDAMENTAÇÃO METODOLÓGICA (DECISÃO D13):
 * 1. Equação Regional do Paraná (Rufino et al., 1993):
 *    Formulações de correlação entre o coeficiente de chuva Rc e o índice
 *    de erosividade mensal EI30 citadas na literatura paranaense (Waltrick et al., 2015;
 *    SBCS-NEPAR Bol. 01, 2011; Rufino et al., 1993, Quadro 2, p. 443):
 *      Rc_m = p_m^2 / P_anual
 *      EI30_m = a + b * Rc_m
 *      R = FATOR_UNIDADE_RUFINO * Σ (m=1..12) EI30_m
 *    Para a Região 1 (Bacia do Paraná 3 / Oeste do PR): a = 18,64 e b = 5,73.
 *
 * 2. Fator de Unidade de Rufino (9,81):
 *    REPRODUZIDO nos dados (pluviômetros IAT 1986-2008 reproduzem Waltrick 2015, Quadro 1,
 *    a <0,3% em 12 estações); origem física (g, kgf.m -> J) é hipótese, não consta de
 *    fonte lida; a equação impressa com p e P em mm dá ≈ 1/9,81 do R (D13).
 *
 * 3. Proposta Metodológica P24 (mínimo de anos de série climática):
 *    Exige série pluviométrica longa (mínimo MIN_ANOS_SERIE_R = 20 anos) com médias mensais
 *    climatológicas (Waltrick utilizou 23 anos; a base CHIRPS v2.0 possui 45 anos).
 *
 * 4. Envelope Geográfico:
 *    Restrito estritamente ao envelope da BP3 definido em src/config/areaInteresse.ts.
 *
 * VERIFICADO 2026-10-01 — evidência: docs/verificacoes/fontes/waltrick2015/saida_extracao_waltrick_2015.txt
 * VERIFICADO 2026-10-01 — evidência: docs/verificacoes/fontes/nepar2011/saida_extracao_nepar_2011.txt
 * VERIFICADO 2026-10-02 — evidência: docs/verificacoes/climatologia_chirps_bp3.json
 * VERIFICADO 2026-10-02 — evidência: docs/verificacoes/diario_climatologia_chirps_bp3.json
 */

import { Proveniencia } from "@/types/proveniencia";
import { AREA_INTERESSE_BP3 } from "@/config/areaInteresse";

export class ErroForaDoDominio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroForaDoDominio";
  }
}

export interface InsumoFatorR {
  /** Array com exatamente 12 valores de precipitação média mensal [mm] (Janeiro a Dezembro). */
  precipitacaoMensalMm?: number[] | null;
  /** Latitude geográfica do ponto (WGS 84 / SIRGAS 2000). */
  latitude?: number | null;
  /** Longitude geográfica do ponto (WGS 84 / SIRGAS 2000). */
  longitude?: number | null;
  /** Identificação da estação ou célula de grade. */
  identificadorFonte?: string | null;
  /** Início do período da série temporal (ex.: '1981-01'). */
  periodoInicio?: string | null;
  /** Fim do período da série temporal (ex.: '2025-12'). */
  periodoFim?: string | null;
  /** Número de anos completos que compõem a série histórica (mínimo 20). */
  nAnosSerie?: number | null;
  /** Região pluviométrica de Rufino et al. (1993). Padrão = 1 (Região 1). */
  regiao?: number | null;
}

export interface ResultadoCalculoFatorR {
  rAnual: number;
  pAnual: number;
  rcMensal: number[];
  ei30Mensal: number[];
  unidade: string;
}

export interface CoeficientesRufinoRegiao {
  a: number;
  b: number;
  referencia: string;
}

/**
 * Tabela de Coeficientes de Rufino et al. (1993), Quadro 2, p. 443.
 * Apenas a Região 1 está parametrizada; regiões 2 a 8 não entram (retornam indisponível com causa 'regiao-nao-implementada').
 */
export const COEFICIENTES_RUFINO_1993: Record<number, CoeficientesRufinoRegiao> = {
  1: {
    a: 18.64,
    b: 5.73,
    referencia: "Rufino et al. (1993), Quadro 2, p. 443 (Região 1)",
  },
};

/**
 * REPRODUZIDO nos dados (pluviômetros IAT 1986-2008 reproduzem Waltrick 2015, Quadro 1, a <0,3% em 12 estações);
 * origem física (g, kgf.m -> J) é hipótese, não consta de fonte lida; a equação impressa com p e P em mm dá ≈ 1/9,81 do R (D13).
 */
export const FATOR_UNIDADE_RUFINO = 9.81;

/**
 * Proposta metodológica P24 (Waltrick usou 23 anos 1986-2008; série de referência CHIRPS tem 45 anos).
 */
export const MIN_ANOS_SERIE_R = 20;

/**
 * Faixa física plausível de erosividade anual no Paraná (sem fonte; não barra nada).
 */
export const FAIXA_FISICA_R_PARANA: [number, number] = [1000, 25000];

/**
 * Calcula o Fator R de erosividade a partir dos 12 totais mensais médios de precipitação (mm).
 * R = FATOR_UNIDADE_RUFINO × Σ_{m=1..12} (a + b · p_m² / P), onde P = Σ p_m.
 *
 * @param pMensalMm Array com 12 valores numéricos de precipitação em mm (médias da série).
 * @param regiao Número da região pluviométrica de Rufino et al. (1993). Padrão = 1.
 * @returns ResultadoCalculoFatorR com R anual, P anual, Rc e EI30 de cada mês.
 * @throws ErroForaDoDominio se a região não estiver implementada ou dados forem inválidos.
 */
export function calcularFatorR(
  pMensalMm: number[],
  regiao?: number
): ResultadoCalculoFatorR {
  const reg = typeof regiao === "number" ? regiao : 1;
  const coefs = COEFICIENTES_RUFINO_1993[reg];
  if (!coefs) {
    throw new ErroForaDoDominio(
      `Região ${reg} de Rufino et al. (1993) não implementada. Apenas Região 1 está parametrizada no escopo BP3.`
    );
  }

  if (!Array.isArray(pMensalMm) || pMensalMm.length !== 12) {
    const qtdRecebida = Array.isArray(pMensalMm) ? String(pMensalMm.length) : "ausente";
    throw new ErroForaDoDominio(
      `Fator R requer exatamente 12 totais pluviométricos mensais (recebido: ${qtdRecebida}).`
    );
  }

  for (let m = 0; m < 12; m++) {
    const val = pMensalMm[m];
    if (typeof val !== "number" || !Number.isFinite(val) || Number.isNaN(val)) {
      throw new ErroForaDoDominio(
        `Precipitação do mês ${m + 1} inválida (não numérica ou NaN): ${val}`
      );
    }
    if (val < 0) {
      throw new ErroForaDoDominio(
        `Precipitação do mês ${m + 1} negativa (${val} mm); domínio físico exige p >= 0.`
      );
    }
  }

  const pAnual = pMensalMm.reduce((acc, p) => acc + p, 0);
  if (pAnual <= 0) {
    throw new ErroForaDoDominio(
      `Precipitação total anual nula ou insuficiente (${pAnual} mm); impossível calcular erosividade.`
    );
  }

  const { a, b } = coefs;
  const rcMensal: number[] = [];
  const ei30Mensal: number[] = [];
  let somaEi30SemFator = 0;

  for (let m = 0; m < 12; m++) {
    const p = pMensalMm[m];
    const rc = (p * p) / pAnual;
    const ei30SemFator = a + b * rc;
    const ei30ComFator = FATOR_UNIDADE_RUFINO * ei30SemFator;

    somaEi30SemFator += ei30SemFator;
    rcMensal.push(Number(rc.toFixed(4)));
    ei30Mensal.push(Number(ei30ComFator.toFixed(4)));
  }

  const rAnual = Number((FATOR_UNIDADE_RUFINO * somaEi30SemFator).toFixed(2));

  return {
    rAnual,
    pAnual: Number(pAnual.toFixed(2)),
    rcMensal,
    ei30Mensal,
    unidade: "MJ·mm·ha⁻¹·h⁻¹·ano⁻¹",
  };
}

/**
 * Encapsula a emissão do Fator R com proveniência auditável para a Linha de Base RUSLE (Decisão D13).
 *
 * @param insumo Objeto contendo os totais mensais, metadados da série climatológica e coordenadas.
 * @returns Proveniencia<number> com estado modelado ou indisponivel.
 */
export function obterFatorRComProveniencia(insumo?: InsumoFatorR | null): Proveniencia<number> {
  // 1. Verificação de presença do insumo
  if (!insumo) {
    return {
      estado: "indisponivel",
      causa: "insuficiente",
      motivo: "Insumo de precipitação pluviométrica para cálculo do Fator R não fornecido (Decisão D13).",
    };
  }

  // 2. Verificação de domínio espacial estrito (Envelope da BP3 em areaInteresse.ts)
  const { latMin, latMax, lonMin, lonMax } = AREA_INTERESSE_BP3.envelope;
  if (
    typeof insumo.latitude !== "number" ||
    typeof insumo.longitude !== "number" ||
    insumo.latitude < latMin ||
    insumo.latitude > latMax ||
    insumo.longitude < lonMin ||
    insumo.longitude > lonMax
  ) {
    const latStr = typeof insumo.latitude === "number" ? insumo.latitude.toFixed(4) : "ausente";
    const lonStr = typeof insumo.longitude === "number" ? insumo.longitude.toFixed(4) : "ausente";
    return {
      estado: "indisponivel",
      causa: "fora-do-dominio",
      motivo: `Coordenada (${latStr}, ${lonStr}) fora do envelope da Bacia do Paraná 3 (${latMin}° a ${latMax}°, ${lonMin}° a ${lonMax}°).`,
    };
  }

  // 3. Verificação de metadados da série temporal climatológica (Diretriz H1 / Proposta P24)
  if (
    !insumo.periodoInicio ||
    !insumo.periodoFim ||
    typeof insumo.nAnosSerie !== "number" ||
    insumo.nAnosSerie < MIN_ANOS_SERIE_R
  ) {
    return {
      estado: "indisponivel",
      causa: "insuficiente",
      motivo: `Série temporal de precipitação insuficiente ou metadados incompletos (Diretriz H1 / Proposta P24: mínimo exigido de ${MIN_ANOS_SERIE_R} anos de série climatológica, recebido: ${insumo.nAnosSerie ?? "ausente"}).`,
    };
  }

  // 4. Verificação dos valores mensais
  if (
    !insumo.precipitacaoMensalMm ||
    !Array.isArray(insumo.precipitacaoMensalMm) ||
    insumo.precipitacaoMensalMm.length !== 12 ||
    insumo.precipitacaoMensalMm.some((v) => typeof v !== "number" || !Number.isFinite(v) || v < 0)
  ) {
    return {
      estado: "indisponivel",
      causa: "insuficiente",
      motivo: "Precipitação mensal inválida ou incompleta (exige exatamente 12 médias mensais finitas e não-negativas).",
    };
  }

  const pAnual = insumo.precipitacaoMensalMm.reduce((acc, p) => acc + p, 0);
  if (pAnual <= 0) {
    return {
      estado: "indisponivel",
      causa: "insuficiente",
      motivo: "Precipitação total anual nula ou insuficiente (P = 0 mm).",
    };
  }

  // 5. Verificação da região
  const regiao = typeof insumo.regiao === "number" ? insumo.regiao : 1;
  if (!COEFICIENTES_RUFINO_1993[regiao]) {
    return {
      estado: "indisponivel",
      causa: "fora-do-dominio",
      motivo: `Região ${regiao} de Rufino et al. (1993) não implementada. Apenas Região 1 está parametrizada.`,
    };
  }

  // 6. Cálculo e emissão de proveniência
  try {
    const res = calcularFatorR(insumo.precipitacaoMensalMm, regiao);
    return {
      estado: "modelado",
      valor: res.rAnual,
      modelo: "Equação Regional do Paraná (Rufino et al., 1993) sobre CHIRPS Climatológico",
      insumos: [
        `Precipitação média anual CHIRPS: ${res.pAnual} mm`,
        `Fator de unidade Rufino: ${FATOR_UNIDADE_RUFINO}`,
        `Série temporal: ${insumo.nAnosSerie} anos (${insumo.periodoInicio} a ${insumo.periodoFim})`,
        "Rufino et al. (1993), Quadro 2, Região 1 (a=18,64, b=5,73)",
      ],
      decisoes: ["D13"],
      tabela: "Rufino et al. (1993), Q2, Região 1, x 9,81 (unidade reproduzida em pluviômetros IAT)",
      pendenteVerificacao: true,
    } as unknown as Proveniencia<number>;
  } catch (err: any) {
    return {
      estado: "indisponivel",
      causa: "fora-do-dominio",
      motivo: err instanceof Error ? err.message : String(err),
    };
  }
}
