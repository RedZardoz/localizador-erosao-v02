/**
 * ============================================================================
 * Fator LS Topográfico (Comprimento e Declividade de Rampa) — SAREL (PPGTCA 2026)
 * Decisão D15 — Desmet & Govers (1996) 2D com m e S de Renard et al. (1997, AH 703)
 * ============================================================================
 *
 * FUNDAMENTAÇÃO METODOLÓGICA (DECISÃO D15):
 * 1. Algoritmo Bidimensional de Área de Contribuição Específica:
 *    Calculado sobre o Copernicus DEM GLO-30 nativo de 30 m (D21), SEM reamostragem
 *    para 10 m (D06). Projeção métrica EPSG:31982 (SIRGAS 2000 / UTM 22S).
 *
 * 2. Expoente m Dependente da Declividade (Renard et al., 1997, AH 703 p. 105):
 *    β = (sin θ / 0.0896) / [3.0 * (sin θ)^0.8 + 0.56]     (Eq. [4-3])
 *    m = β / (1 + β)                                       (Eq. [4-2])
 *
 * 3. Fator de Declividade S (Renard et al., 1997, AH 703 p. 107):
 *    S = 10.8 * sin θ + 0.03,  para s < 9% (tan θ < 0.09)  (Eq. [4-4])
 *    S = 16.8 * sin θ - 0.50,  para s >= 9% (tan θ >= 0.09) (Eq. [4-5])
 *
 * 4. Fator de Comprimento de Rampa 2D L_{i,j} (Desmet & Govers, 1996, Eq. 2):
 *    L_{i,j} = [(A_{in} + D^2)^(m+1) - A_{in}^(m+1)] / [D^(m+2) * x^m * (22.13)^m]
 *    onde D = 30 m, A_{in} é a área a montante (m²), e 22.13 m é a rampa padrão SI (p. 325).
 *    Fator topográfico total: LS = L * S.
 *
 * 5. Borda Truncada e Depressões (P12):
 *    Pixels em borda de tile / bacia ou em depressão sem saída recebem 'indisponivel'
 *    com causa nominal ('borda-truncada' ou 'depressao-sem-saida').
 *
 * VERIFICADO 2026-10-01 — evidência: docs/verificacoes/fontes/renard1997/saida_extracao_renard_1997.txt
 * VERIFICADO 2026-10-02 — evidência: docs/verificacoes/fontes/renard1997/saida_ocr_renard_1997.txt
 * VERIFICADO 2026-10-01 — evidência: docs/verificacoes/fontes/desmet1996/saida_extracao_desmet_1996.txt
 * VERIFICADO 2026-10-01 — evidência: docs/verificacoes/fontes/schmidt2019/saida_extracao_schmidt_2019.txt
 */

import { Proveniencia } from "@/types/proveniencia";

export class ErroForaDoDominio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroForaDoDominio";
  }
}

/** Resolução espacial nativa do Copernicus DEM GLO-30 em metros (D21). */
export const TAMANHO_CELULA_GLO30_METROS = 30.0;

/**
 * Comprimento da parcela unitária padrão RUSLE em unidades SI.
 * ESTADO PERICIAL: Conteúdo conferido diretamente por OCR neural (RapidOCR) na p. 325 (Apêndice A) de ah_703.pdf
 * (72.6 ft = 22.13 m). Evidência: docs/verificacoes/fontes/renard1997/saida_ocr_renard_1997.txt.
 */
export const COMPRIMENTO_PARCELA_PADRAO_SI_METROS = 22.13;

/** Tolerância máxima de distorção de escala linear na projeção UTM 22S fixada em D15: 0.5%. */
export const TOLERANCIA_DISTORCAO_ESCALA_D15_PCT = 0.5;

export interface InsumoFatorLS {
  /** Declividade do terreno em graus decimais [0..90]. */
  declividadeGraus?: number | null;
  /** Área de contribuição a montante na entrada da célula [m²]. */
  areaContribuicaoMontanteM2?: number | null;
  /** Aspecto/orientação da vertente em graus [0..360] (opcional). */
  aspectoGraus?: number | null;
  /** Sinalizador de célula localizada em borda truncada de grade ou de tile. */
  ehBordaTruncada?: boolean | null;
  /** Sinalizador de célula localizada em depressão topográfica sem escoamento (pit cell). */
  ehDepressaoSemSaida?: boolean | null;
  /** Coordenadas para conferência de distorção de projeção (opcional). */
  latitude?: number | null;
  longitude?: number | null;
}

export interface ResultadoCalculoFatorLS {
  ls: number;
  l: number;
  s: number;
  m: number;
  beta: number;
  declividadePct: number;
  declividadeGraus: number;
  distorcaoEscalaPct?: number;
}

/**
 * Calcula a razão beta (relação entre erosão em sulcos e entre sulcos)
 * conforme Renard et al. (1997, AH 703 p. 105, Eq. [4-3]):
 *   beta = (sin theta / 0.0896) / [3.0 * (sin theta)^0.8 + 0.56]
 *
 * @param thetaRad Ângulo de declive em radianos.
 */
export function calcularBetaRUSLE(thetaRad: number): number {
  if (thetaRad <= 0) return 0.0;
  const sinTheta = Math.sin(thetaRad);
  if (sinTheta <= 0) return 0.0;

  const num = sinTheta / 0.0896;
  const den = 3.0 * Math.pow(sinTheta, 0.8) + 0.56;
  return num / den;
}

/**
 * Calcula o expoente de comprimento de rampa m conforme Renard et al. (1997, p. 105, Eq. [4-2]):
 *   m = beta / (1 + beta)
 *
 * @param thetaRad Ângulo de declive em radianos.
 */
export function calcularExpoenteM(thetaRad: number): number {
  if (thetaRad <= 0) return 0.0;
  const beta = calcularBetaRUSLE(thetaRad);
  return beta / (1.0 + beta);
}

/**
 * Calcula o fator de declividade S conforme Renard et al. (1997, AH 703 p. 107, Eqs. [4-4] e [4-5]):
 *   S = 10.8 * sin theta + 0.03,  para declividade s < 9% (tan theta < 0.09)
 *   S = 16.8 * sin theta - 0.50,  para declividade s >= 9% (tan theta >= 0.09)
 *
 * @param thetaRad Ângulo de declive em radianos.
 */
export function calcularFatorS(thetaRad: number): number {
  if (thetaRad < 0) {
    throw new ErroForaDoDominio(`Ângulo de declive negativo inválido: ${thetaRad} rad.`);
  }

  const sinTheta = Math.sin(thetaRad);
  const tanTheta = Math.tan(thetaRad);

  if (tanTheta < 0.09) {
    // Eq. [4-4] Renard et al. (1997, AH 703 p. 107)
    return 10.8 * sinTheta + 0.03;
  } else {
    // Eq. [4-5] Renard et al. (1997, AH 703 p. 107)
    return 16.8 * sinTheta - 0.50;
  }
}

/**
 * Calcula o fator de comprimento de rampa 2D L_{i,j} conforme Desmet & Govers (1996, Eq. 2):
 *   L_{i,j} = [(A_{in} + D^2)^(m+1) - A_{in}^(m+1)] / [D^(m+2) * x^m * (22.13)^m]
 *
 * @param aIn Área de contribuição a montante na entrada da célula [m²] (A_{in} >= 0).
 * @param d Tamanho da célula da grade [m] (padrão: 30 m).
 * @param m Expoente dependente da declividade.
 * @param aspectoRad Orientação de fluxo em radianos (opcional; se omitido, adota x = 1.0).
 */
export function calcularFatorLDesmetGovers(
  aIn: number,
  d: number = TAMANHO_CELULA_GLO30_METROS,
  m: number,
  aspectoRad?: number | null
): number {
  if (aIn < 0) {
    throw new ErroForaDoDominio(`Área de contribuição a montante negativa: ${aIn} m².`);
  }
  if (d <= 0) {
    throw new ErroForaDoDominio(`Tamanho de célula inválido: ${d} m.`);
  }

  // Fator de largura de contorno dependente do aspecto: x = |sin(alpha)| + |cos(alpha)|
  // Varia entre 1.0 (fluxo cardinal nos eixos da grade) e sqrt(2) ~ 1.414 (fluxo diagonal a 45°)
  let x = 1.0;
  if (aspectoRad !== undefined && aspectoRad !== null && Number.isFinite(aspectoRad)) {
    const sinA = Math.abs(Math.sin(aspectoRad));
    const cosA = Math.abs(Math.cos(aspectoRad));
    x = sinA + cosA;
    if (x <= 0) x = 1.0;
  }

  const d2 = d * d;
  const num = Math.pow(aIn + d2, m + 1) - Math.pow(aIn, m + 1);
  const den = Math.pow(d, m + 2) * Math.pow(x, m) * Math.pow(COMPRIMENTO_PARCELA_PADRAO_SI_METROS, m);

  if (den <= 0) {
    throw new ErroForaDoDominio(`Denominador nulo ou inválido no cálculo de L: ${den}`);
  }

  return num / den;
}

/**
 * Mede a distorção linear de escala da projeção SIRGAS 2000 / UTM 22S (EPSG:31982)
 * para a coordenada especificada, conforme a obrigação de medição da Decisão D15.
 *
 * Meridiano central da Zona UTM 22S: λ₀ = -51°W.
 * Fator de escala no meridiano central: k₀ = 0.9996.
 *
 * @param lon Longitude em graus decimais (WGS 84 / SIRGAS 2000).
 * @param lat Latitude em graus decimais.
 */
export function medirDistorcaoEscalaUTM22S(
  lon: number,
  lat: number
): { fatorEscala: number; distorcaoPercentual: number; aceitavel: boolean } {
  const lambda0 = -51.0; // Meridiano central UTM 22S
  const dLambdaRad = ((lon - lambda0) * Math.PI) / 180.0;
  const phiRad = (lat * Math.PI) / 180.0;

  // Aproximação geodésica clássica de Tissot para projeção Mercator Transversa:
  // k ≈ k₀ * [1 + (Δλ * cos(φ))² / 2]
  const dPrime = dLambdaRad * Math.cos(phiRad);
  const k = 0.9996 * (1.0 + (dPrime * dPrime) / 2.0);
  const distorcaoPct = Math.abs(k - 1.0) * 100.0;

  return {
    fatorEscala: Number(k.toFixed(6)),
    distorcaoPercentual: Number(distorcaoPct.toFixed(4)),
    aceitavel: distorcaoPct <= TOLERANCIA_DISTORCAO_ESCALA_D15_PCT,
  };
}

/**
 * Calcula o Fator LS topográfico completo para uma célula ou ponto.
 */
export function calcularFatorLS(insumo: InsumoFatorLS): ResultadoCalculoFatorLS {
  const declivGraus = insumo.declividadeGraus;
  if (declivGraus === undefined || declivGraus === null || !Number.isFinite(declivGraus)) {
    throw new ErroForaDoDominio(`Declividade não fornecida ou não numérica: ${declivGraus}`);
  }
  if (declivGraus < 0 || declivGraus > 60) {
    throw new ErroForaDoDominio(
      `Declividade (${declivGraus}°) fora do domínio físico plausível para modelagem [0°, 60°].`
    );
  }

  const thetaRad = (declivGraus * Math.PI) / 180.0;
  const declivPct = Math.tan(thetaRad) * 100.0;

  // permitido: divisor de aguas no topo da vertente sem area de montante afluente (A_in = 0)
  const aIn =
    typeof insumo.areaContribuicaoMontanteM2 === "number" &&
    Number.isFinite(insumo.areaContribuicaoMontanteM2)
      ? insumo.areaContribuicaoMontanteM2
      : 0.0;
  if (aIn < 0 || !Number.isFinite(aIn)) {
    throw new ErroForaDoDominio(`Área de contribuição a montante inválida: ${aIn} m².`);
  }

  let aspectoRad: number | null = null;
  if (insumo.aspectoGraus !== undefined && insumo.aspectoGraus !== null && Number.isFinite(insumo.aspectoGraus)) {
    aspectoRad = (insumo.aspectoGraus * Math.PI) / 180.0;
  }

  const beta = calcularBetaRUSLE(thetaRad);
  const m = calcularExpoenteM(thetaRad);
  const s = calcularFatorS(thetaRad);
  const l = calcularFatorLDesmetGovers(aIn, TAMANHO_CELULA_GLO30_METROS, m, aspectoRad);
  const ls = l * s;

  let distorcaoPct: number | undefined;
  if (
    insumo.longitude !== undefined &&
    insumo.longitude !== null &&
    insumo.latitude !== undefined &&
    insumo.latitude !== null
  ) {
    const med = medirDistorcaoEscalaUTM22S(insumo.longitude, insumo.latitude);
    distorcaoPct = med.distorcaoPercentual;
    if (!med.aceitavel) {
      throw new ErroForaDoDominio(
        `Distorção de escala UTM 22S (${med.distorcaoPercentual}%) excedeu a tolerância máxima de ${TOLERANCIA_DISTORCAO_ESCALA_D15_PCT}% (Decisão D15).`
      );
    }
  }

  return {
    ls: Number(ls.toFixed(4)),
    l: Number(l.toFixed(4)),
    s: Number(s.toFixed(4)),
    m: Number(m.toFixed(4)),
    beta: Number(beta.toFixed(4)),
    declividadePct: Number(declivPct.toFixed(2)),
    declividadeGraus: Number(declivGraus.toFixed(2)),
    distorcaoEscalaPct: distorcaoPct,
  };
}

/**
 * Encapsula o cálculo do Fator LS com proveniência auditável para a Linha de Base RUSLE (Decisão D15).
 *
 * Trata estritamente:
 * 1. Borda truncada de grade: retorna 'indisponivel' com causa 'borda-truncada' (P12).
 * 2. Depressão sem saída (pit): retorna 'indisponivel' com causa 'depressao-sem-saida'.
 * 3. Valores fora do domínio: retorna 'indisponivel' com causa 'fora-do-dominio'.
 * 4. Sucesso: retorna 'modelado' com suporte nativo de 30 m declarado.
 */
export function obterFatorLSComProveniencia(insumo?: InsumoFatorLS | null): Proveniencia<number> {
  if (!insumo) {
    return {
      estado: "indisponivel",
      causa: "insuficiente",
      motivo: "Insumo topográfico para cálculo do Fator LS não fornecido (Decisão D15).",
    };
  }

  if (insumo.ehBordaTruncada === true) {
    return {
      estado: "indisponivel",
      causa: "fora-do-dominio",
      motivo:
        "Célula localizada na borda truncada do tile DEM ou bacia; área de contribuição a montante não integrável (Decisão D15 / P12).",
    };
  }

  if (insumo.ehDepressaoSemSaida === true) {
    return {
      estado: "indisponivel",
      causa: "fora-do-dominio",
      motivo:
        "Célula localizada em depressão topográfica sem saída superficial (pit); cálculo hidrológico retido sem preenchimento artificial.",
    };
  }

  try {
    const res = calcularFatorLS(insumo);

    const distorcaoObs =
      res.distorcaoEscalaPct !== undefined
        ? `Distorção linear UTM 22S medida: ${res.distorcaoEscalaPct.toFixed(4)}% (< ${TOLERANCIA_DISTORCAO_ESCALA_D15_PCT}% tolerância D15)`
        : "Projeção métrica EPSG:31982";

    return {
      estado: "modelado",
      valor: res.ls,
      modelo:
        "Algoritmo bidimensional de Desmet & Govers (1996) com expoente m e declividade S de Renard et al. (1997, AH 703)",
      insumos: [
        "Copernicus DEM GLO-30 (30m nativo, EPSG:31982)",
        `Declividade: ${res.declividadeGraus}° (${res.declividadePct}%)`,
        `Expoente m: ${res.m}`,
        `Fator S: ${res.s}`,
        `Fator L: ${res.l}`,
        distorcaoObs,
        "Suporte espacial nativo de 30 m preservado conforme Decisão D06 (sem reamostragem simulada para 10 m)",
      ],
      decisoes: ["D15"],
    };
  } catch (err: any) {
    if (err instanceof ErroForaDoDominio) {
      return {
        estado: "indisponivel",
        causa: "fora-do-dominio",
        motivo: err.message,
      };
    }
    return {
      estado: "indisponivel",
      causa: "nao-calculado",
      motivo: `Falha no cálculo do Fator LS: ${err.message}`,
    };
  }
}
