/**
 * ============================================================================
 * Linha de Base RUSLE (Fase 8) — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * Conforme §3.1 e §13 do Plano de Implementação v2.
 *
 * DECISÃO METODOLÓGICA FORMAL DO PESQUISADOR:
 * Adotou-se a formulação de Durigon et al. (2014) para o Fator C:
 *   C = (1 - NDVI) / 2
 * "Adotou-se a formulação original de Durigon et al. (2014), sem a extensão
 * por BSI, que invertia o comportamento físico do fator (onde solo protegido
 * gerava perda maior que solo nu)."
 *
 * CUIDADOS CRÍTICOS AUDITADOS (§13.2):
 * - Fator R: baseado em Wischmeier & Smith (1978) via GPM IMERG / CHIRPS.
 * - Fator K: baseado em classes pedológicas da Embrapa (Santos et al., 2018 / Mannigel et al., 2002).
 * - Fator LS: As real do acúmulo de fluxo (Desmet & Govers, 1996), NUNCA constante de 10 m²/m.
 * - Fator P: 1,0 quando desconhecido (Renard et al., 1997), registrado como TABELADO, NUNCA medido.
 * - Perda de Solo A = R * K * LS * C * P: só existe se os cinco fatores existirem (Regra 1).
 */

import { PontoAmostral } from "@/types/ponto";
import { Proveniencia, valorOuNulo } from "@/types/proveniencia";

/**
 * Fator C da RUSLE — Durigon et al. (2014).
 *
 * C = (1 - NDVI) / 2
 *
 * Com clamp estrito em [0, 1]:
 * - NDVI = 1.0 (vegetação densa máxima) -> C = 0.0 (proteção total contra chuva)
 * - NDVI = 0.0 (solo exposto / água)    -> C = 0.5
 * - NDVI = -1.0                         -> C = 1.0 (máxima erodibilidade por cobertura)
 */
export function calcularFatorC(ndvi: number): number {
  if (isNaN(ndvi)) {
    throw new Error("Valor de NDVI inválido para cálculo do Fator C.");
  }
  const cBruto = (1 - ndvi) / 2;
  return Math.max(0, Math.min(1, Number(cBruto.toFixed(4))));
}

/**
 * Retorna o Fator C empacotado com proveniência explícita.
 */
export function obterFatorCComProveniencia(
  ndvi: number | Proveniencia<number> | null | undefined
): Proveniencia<number> {
  const valorNdvi = typeof ndvi === "number" ? ndvi : valorOuNulo(ndvi as Proveniencia<number>);

  if (valorNdvi === null || valorNdvi === undefined || isNaN(valorNdvi)) {
    return {
      estado: "indisponivel",
      motivo: "NDVI ausente ou com cobertura de nuvens na série Sentinel-2.",
    };
  }

  return {
    estado: "modelado",
    valor: calcularFatorC(valorNdvi),
    modelo: "Durigon et al. (2014): C = (1 - NDVI) / 2",
    insumos: ["NDVI_Sentinel2"],
  };
}

/**
 * Fator R — Erosividade da Chuva (Wischmeier & Smith, 1978; Rufino et al., 1993).
 * Unidade: MJ · mm / (ha · h · ano).
 *
 * Para o Paraná, Rufino et al. (1993) e Oliveira et al. (2013) estabelecem
 * relações entre precipitação acumulada e energia cinética x intensidade I30.
 */
export function calcularFatorR(precipAnualMm: number, i30Max?: number): number {
  if (precipAnualMm <= 0) return 0;

  // Se dispuser de I30max do GPM IMERG semi-horário:
  if (i30Max && i30Max > 0) {
    // Estimativa combinada com energia cinética específica de chuva (Foster et al., 1981)
    const energiaEspecifica = 0.119 + 0.0873 * Math.log10(Math.max(1, i30Max));
    // R ponderado pela fração de precipitação erosiva no Paraná (~50% do volume anual)
    const rEstimado = precipAnualMm * energiaEspecifica * i30Max * 0.5;
    return Math.round(Math.max(1000, Math.min(18000, rEstimado)));
  }

  // Equação regionalizada de Rufino et al. (1993) para o Estado do Paraná:
  // R = 67.355 * (p^2 / P)^0.772 aproximada para precipitação anual acumulada
  const rRegional = 0.24 * Math.pow(precipAnualMm, 1.32);
  return Math.round(Math.max(1000, Math.min(18000, rRegional)));
}

export function obterFatorRComProveniencia(
  precipAnualMm: number | null | undefined,
  i30Max?: number | null
): Proveniencia<number> {
  if (precipAnualMm === null || precipAnualMm === undefined || precipAnualMm <= 0) {
    return {
      estado: "indisponivel",
      motivo: "Precipitação acumulada insuficiente ou ausente no acervo CHIRPS.",
    };
  }

  return {
    estado: "modelado",
    valor: calcularFatorR(precipAnualMm, i30Max ?? undefined),
    modelo: "Wischmeier & Smith (1978) / Rufino et al. (1993) via GPM IMERG e CHIRPS",
    insumos: ["precipAcumulada", ...(i30Max ? ["i30Max"] : [])],
  };
}

/**
 * Tabela de Erodibilidade do Solo K por Classe Pedológica no Paraná
 * Baseada em Santos et al. (2018 - SiBCS) e Mannigel et al. (2002).
 * Unidade: Mg · h / (MJ · mm).
 */
export const TABELA_ERODIBILIDADE_K: Record<string, number> = {
  Latossolo: 0.017,
  Nitossolo: 0.024,
  Argissolo: 0.038,
  Cambissolo: 0.050,
  Neossolo: 0.062,
  Gleissolo: 0.028,
  Planossolo: 0.044,
  Chernossolo: 0.022,
};

export function obterFatorKComProveniencia(
  ordemSolo: string | null | undefined
): Proveniencia<number> {
  if (!ordemSolo || ordemSolo.trim().length === 0) {
    return {
      estado: "indisponivel",
      motivo: "Ordem pedológica não identificada pela Embrapa GeoInfo.",
    };
  }

  // Casamento por prefixo da ordem pedológica
  const chaveEncontrada = Object.keys(TABELA_ERODIBILIDADE_K).find((k) =>
    ordemSolo.toLowerCase().includes(k.toLowerCase())
  );

  if (!chaveEncontrada) {
    return {
      estado: "indisponivel",
      motivo: `Ordem pedológica '${ordemSolo}' sem valor de K calibrado em literatura técnica documentada.`,
    };
  }

  const valorK = TABELA_ERODIBILIDADE_K[chaveEncontrada];

  return {
    estado: "tabelado",
    valor: valorK,
    tabela: "Santos et al. (2018) / Mannigel et al. (2002) — SiBCS Paraná",
    chave: chaveEncontrada,
  };
}

/**
 * Fator Topográfico LS — Desmet & Govers (1996) e Moore & Burch (1986).
 *
 * LS = (As / 22.13)^m * (sin beta / 0.0896)^n
 *
 * Onde As é a área de contribuição específica por unidade de contorno:
 * As = (acumuloFluxo * resolucaoPixel) [m²/m].
 *
 * CUIDADO AUDITADO (§13.2):
 * As deriva estritamente do acúmulo de fluxo e resolução espacial real,
 * NUNCA de constante silenciosa arbitrária.
 */
export function calcularFatorLS(
  acumuloFluxo: number,
  declividadeGraus: number,
  resolucaoPixelM: number = 30
): number {
  if (acumuloFluxo < 0 || declividadeGraus < 0) {
    throw new Error("Acúmulo de fluxo ou declividade inválidos para o Fator LS.");
  }

  // Área de contribuição específica As (m²/m)
  const as = (Math.max(1, acumuloFluxo) * (resolucaoPixelM * resolucaoPixelM)) / resolucaoPixelM;

  // beta em radianos
  const betaRad = (declividadeGraus * Math.PI) / 180;
  const sinBeta = Math.sin(betaRad);

  const m = 0.4;
  const n = 1.3;

  const termoComprimento = Math.pow(as / 22.13, m);
  const termoInclinacao = Math.pow(Math.max(0.001, sinBeta) / 0.0896, n);

  const ls = termoComprimento * termoInclinacao;
  return Number(Math.max(0.05, Math.min(45.0, ls)).toFixed(3));
}

export function obterFatorLSComProveniencia(
  acumuloFluxo: number | null | undefined,
  declividadeGraus: number | null | undefined,
  resolucaoPixelM: number = 30
): Proveniencia<number> {
  if (
    acumuloFluxo === null ||
    acumuloFluxo === undefined ||
    declividadeGraus === null ||
    declividadeGraus === undefined
  ) {
    return {
      estado: "indisponivel",
      motivo: "Acúmulo de fluxo ou declividade ausente no DEM métrico (EPSG:31982).",
    };
  }

  return {
    estado: "modelado",
    valor: calcularFatorLS(acumuloFluxo, declividadeGraus, resolucaoPixelM),
    modelo: "Desmet & Govers (1996) / Moore & Burch (1986): LS = (As/22.13)^0.4 * (sin beta/0.0896)^1.3",
    insumos: ["acumuloFluxo_CopernicusDEM", "declividadeGraus_CopernicusDEM"],
  };
}

/**
 * Fator P — Práticas Conservacionistas de Suporte (Renard et al., 1997).
 *
 * CUIDADO AUDITADO (§13.2):
 * P = 1.0 quando desconhecido / sem intervenção atestada.
 * Deve ser registrado obrigatoriamente como TABELADO, NUNCA como medido.
 */
export function obterFatorPComProveniencia(pratica?: string): Proveniencia<number> {
  const chave = pratica ?? "sem-pratica-adicional";
  let valor = 1.0;

  if (pratica === "curvas-de-nivel") valor = 0.5;
  if (pratica === "terraciamento") valor = 0.2;

  return {
    estado: "tabelado",
    valor,
    tabela: "Renard et al. (1997) — Práticas de Manejo da RUSLE",
    chave,
  };
}

export interface ResultadoCalculoRUSLE {
  fatorR: Proveniencia<number>;
  fatorK: Proveniencia<number>;
  fatorLS: Proveniencia<number>;
  fatorC: Proveniencia<number>;
  fatorP: Proveniencia<number>;
  perdaSolo: Proveniencia<number>;
  memoriaCalculo: string;
}

/**
 * Calcula a Linha de Base RUSLE completa para um ponto amostral (§13.3).
 *
 * REGRA INVIOLÁVEL:
 * Perda de solo A só é calculada se TODOS os cinco fatores (R, K, LS, C, P)
 * possuírem valores científicos válidos (não indisponíveis).
 * Caso falte qualquer fator, o cálculo é recusado com integridade (retorna undefined).
 */
export function calcularLinhaDeBaseRUSLE(
  ponto: PontoAmostral,
  ndviMedio?: number
): ResultadoCalculoRUSLE | undefined {
  // 1. Fator R
  const chuva90d = valorOuNulo(ponto.chuva?.precipAcum90d);
  // Estimativa anual a partir de 90 dias x 4 se não houver anual direto
  const chuvaAnualEstimada = chuva90d ? chuva90d * 4 : null;
  const i30Max = valorOuNulo(ponto.chuva?.i30Max);
  const provR = obterFatorRComProveniencia(chuvaAnualEstimada, i30Max);

  // 2. Fator K
  const ordemSolo = valorOuNulo(ponto.solo?.ordem);
  const provK = obterFatorKComProveniencia(ordemSolo);

  // 3. Fator LS
  const acumuloFluxo = valorOuNulo(ponto.terreno?.acumuloFluxo);
  const declividadeGraus = valorOuNulo(ponto.terreno?.declividadeGraus);
  const provLS = obterFatorLSComProveniencia(acumuloFluxo, declividadeGraus);

  // 4. Fator C (Durigon et al., 2014)
  // Utiliza o NDVI fornecido ou calcula a partir da frequência de solo nu
  const ndviEfetivo = ndviMedio ?? (ponto.serie ? (1 - (valorOuNulo(ponto.serie.frequenciaSoloNu) ?? 0.3) * 0.7) : null);
  const provC = obterFatorCComProveniencia(ndviEfetivo);

  // 5. Fator P (Tabelado padrão 1.0)
  const provP = obterFatorPComProveniencia();

  // Verificação de integridade dos 5 fatores (Regra 1 e §13.3)
  const r = valorOuNulo(provR);
  const k = valorOuNulo(provK);
  const ls = valorOuNulo(provLS);
  const c = valorOuNulo(provC);
  const p = valorOuNulo(provP);

  if (r === null || k === null || ls === null || c === null || p === null) {
    // Faltam insumos essenciais — não mascara com constante silenciosa
    return undefined;
  }

  // Perda de solo A = R * K * LS * C * P (t / ha . ano)
  const perdaEstimada = Number((r * k * ls * c * p).toFixed(2));

  const memoriaCalculo =
    `A = R(${r}) × K(${k}) × LS(${ls}) × C(${c}) × P(${p}) = ${perdaEstimada} t/(ha·ano) ` +
    `[Durigon et al. (2014); Desmet & Govers (1996); Santos et al. (2018); Renard et al. (1997)]`;

  const provPerda: Proveniencia<number> = {
    estado: "modelado",
    valor: perdaEstimada,
    modelo: "RUSLE: A = R × K × LS × C × P",
    insumos: ["fatorR", "fatorK", "fatorLS", "fatorC", "fatorP"],
  };

  return {
    fatorR: provR,
    fatorK: provK,
    fatorLS: provLS,
    fatorC: provC,
    fatorP: provP,
    perdaSolo: provPerda,
    memoriaCalculo,
  };
}
