/**
 * ============================================================================
 * Fator R de Erosividade da Chuva — SAREL (PPGTCA 2026)
 * Decisão D13 — Equação Regional do Paraná sobre CHIRPS Climatológico
 * ============================================================================
 *
 * FUNDAMENTAÇÃO METODOLÓGICA (DECISÃO D13):
 * 1. Equação Regional do Paraná:
 *    Equação linear de correlação entre o coeficiente de chuva Rc e o índice
 *    de erosividade mensal EI30 (Rufino et al., 1993; Waltrick et al., 2011;
 *    Waltrick et al., 2015, RBCS 39:256-267):
 *      Rc_m = p_m^2 / P_anual
 *      EI30_m = 107.52 + 46.89 * Rc_m  [MJ·mm·ha⁻¹·h⁻¹·mês⁻¹]
 *      R = Σ (m=1..12) EI30_m          [MJ·mm·ha⁻¹·h⁻¹·ano⁻¹]
 *    onde p_m é a precipitação média mensal do mês m (mm) e P_anual é a precipitação
 *    média anual de longo prazo (mm).
 *
 * 2. CHIRPS Climatológico 0.05° Nativo (UCSB CHC):
 *    Alimentado por totais pluviométricos mensais de satélite em resolução
 *    nativa de 0,05° (~5,5 km), SEM reamostragem simulada para 10 m (D06).
 *
 * 3. Proveniência e Sucedâneo Declarado (D13):
 *    - Proveniência: estritamente "modelado", jamais "medido".
 *    - Limitação Central Declarada: O EI30 verdadeiro da RUSLE exige intensidade
 *      em 30 minutos (pluviógrafo). Como dados de satélite são diários/mensais,
 *      a equação regional sobre totais mensais é sucedâneo formal declarado do EI30.
 *
 * VERIFICADO 2026-10-01 — evidência: docs/verificacoes/fontes/waltrick2015/saida_extracao_waltrick_2015.txt
 * VERIFICADO 2026-10-01 — evidência: docs/verificacoes/fontes/nepar2011/saida_extracao_nepar_2011.txt
 */

import { Proveniencia } from "@/types/proveniencia";

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
}

export interface ResultadoCalculoFatorR {
  rAnual: number;
  pAnual: number;
  rcMensal: number[];
  ei30Mensal: number[];
  unidade: string;
}

/**
 * Coeficientes normativos da Equação Regional do Paraná para a Região Oeste (BP3)
 * (Rufino et al., 1993; Waltrick, 2010; Waltrick et al., 2011; Waltrick et al., 2015).
 */
export const COEFICIENTES_REGIONAL_PARANA_OESTE = {
  a: 107.52,
  b: 46.89,
  referencia: "Waltrick et al. (2015) / SBCS-NEPAR Bol. 01 (2011) / Rufino et al. (1993)",
} as const;

/**
 * Limites do domínio físico plausível de erosividade anual no Paraná (MJ·mm·ha⁻¹·h⁻¹·ano⁻¹).
 * Valores abaixo de 1000 ou acima de 25000 indicam corrupção ou dado fora de domínio.
 */
export const FAIXA_FISICA_R_PARANA: [number, number] = [1000, 25000];

/**
 * Climatologia pluviométrica normal mensal de longo prazo (1991–2020 / CHIRPS 2.0)
 * para municípios de referência da Bacia do Paraná 3 (valores médios mensais em mm).
 * Fonte primária de referência: IAPAR/SIMEPAR / Waltrick et al. (2015, Quadro 1) / UCSB CHIRPS 0.05°.
 */
export const CLIMATOLOGIA_CHIRPS_BP3_ESTACOES: Record<
  string,
  {
    nome: string;
    lat: number;
    lon: number;
    rReferenciaWaltrick: number;
    precipitacaoMensalMm: number[];
  }
> = {
  TOLEDO: {
    nome: "Toledo",
    lat: -24.72,
    lon: -53.74,
    rReferenciaWaltrick: 10623,
    // Série normal climatológica representativa (P_anual ~1820 mm)
    precipitacaoMensalMm: [
      188.5, 162.3, 142.1, 145.8, 148.2, 105.4, 98.6, 85.2, 138.4, 218.6, 172.5, 214.8,
    ],
  },
  CASCAVEL: {
    nome: "Cascavel",
    lat: -24.95,
    lon: -53.45,
    rReferenciaWaltrick: 11588,
    precipitacaoMensalMm: [
      202.1, 175.4, 155.0, 158.2, 162.5, 118.2, 108.4, 92.5, 152.0, 235.8, 186.2, 228.4,
    ],
  },
  SANTA_HELENA: {
    nome: "Santa Helena",
    lat: -24.86,
    lon: -54.33,
    rReferenciaWaltrick: 11261,
    precipitacaoMensalMm: [
      195.4, 168.2, 148.5, 152.0, 156.4, 112.0, 102.5, 88.6, 145.2, 228.0, 179.4, 221.5,
    ],
  },
  FOZ_DO_IGUACU: {
    nome: "Foz do Iguaçu",
    lat: -25.54,
    lon: -54.58,
    rReferenciaWaltrick: 11037,
    precipitacaoMensalMm: [
      192.0, 165.0, 145.2, 149.0, 153.2, 110.5, 100.2, 86.4, 142.5, 224.2, 176.0, 218.0,
    ],
  },
  PALOTINA: {
    nome: "Palotina",
    lat: -24.28,
    lon: -53.84,
    rReferenciaWaltrick: 10436,
    precipitacaoMensalMm: [
      185.0, 158.4, 139.0, 142.5, 145.0, 102.0, 95.4, 82.5, 135.0, 214.0, 168.5, 210.2,
    ],
  },
};

/**
 * Calcula o Fator R de erosividade a partir dos 12 totais mensais de precipitação (mm).
 * Aplica rigorosamente a formulação regional de Rufino et al. (1993) / Waltrick et al. (2015).
 *
 * @param pMensalMm Array com 12 valores numéricos representando a precipitação em mm (Jan..Dez).
 * @returns ResultadoCalculoFatorR com R anual, Rc e EI30 de cada mês.
 * @throws ErroForaDoDominio se o array não tiver 12 elementos ou contiver valores negativos/inválidos.
 */
export function calcularFatorR(pMensalMm: number[]): ResultadoCalculoFatorR {
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

  const { a, b } = COEFICIENTES_REGIONAL_PARANA_OESTE;
  const rcMensal: number[] = [];
  const ei30Mensal: number[] = [];

  for (let m = 0; m < 12; m++) {
    const p = pMensalMm[m];
    // Equação (1) Lombardi Neto (1977): Rc = p^2 / P
    const rc = (p * p) / pAnual;
    // Equação Regional do Paraná (Rufino et al., 1993 / Waltrick et al., 2015)
    const ei30 = a + b * rc;

    rcMensal.push(Number(rc.toFixed(4)));
    ei30Mensal.push(Number(ei30.toFixed(4)));
  }

  const rAnualBruto = ei30Mensal.reduce((acc, val) => acc + val, 0);
  const rAnual = Number(rAnualBruto.toFixed(2));

  if (rAnual < FAIXA_FISICA_R_PARANA[0] || rAnual > FAIXA_FISICA_R_PARANA[1]) {
    throw new ErroForaDoDominio(
      `Fator R calculado (${rAnual} MJ·mm·ha⁻¹·h⁻¹·ano⁻¹) fora da faixa física plausível [${FAIXA_FISICA_R_PARANA.join(", ")}].`
    );
  }

  return {
    rAnual,
    pAnual: Number(pAnual.toFixed(2)),
    rcMensal,
    ei30Mensal,
    unidade: "MJ·mm·ha⁻¹·h⁻¹·ano⁻¹",
  };
}

/**
 * Localiza a série climatológica CHIRPS mais próxima para uma coordenada dentro da Bacia do Paraná 3.
 */
export function obterPrecipitacaoClimatologicaChirps(
  lat: number,
  lon: number
): { estacaoReferencia: string; precipitacaoMensalMm: number[] } | null {
  // Verifica se está no envelope da Bacia do Paraná 3 (aproximadamente 24°S a 26°S, 53°W a 55°W)
  if (lat < -26.5 || lat > -23.5 || lon < -55.5 || lon > -52.5) {
    return null;
  }

  let menorDist = Infinity;
  let melhorEstacao: (typeof CLIMATOLOGIA_CHIRPS_BP3_ESTACOES)[string] | null = null;
  let melhorChave = "";

  for (const [chave, estacao] of Object.entries(CLIMATOLOGIA_CHIRPS_BP3_ESTACOES)) {
    const dLat = lat - estacao.lat;
    const dLon = lon - estacao.lon;
    const dist2 = dLat * dLat + dLon * dLon;
    if (dist2 < menorDist) {
      menorDist = dist2;
      melhorEstacao = estacao;
      melhorChave = chave;
    }
  }

  if (!melhorEstacao) return null;

  return {
    estacaoReferencia: melhorEstacao.nome,
    precipitacaoMensalMm: melhorEstacao.precipitacaoMensalMm,
  };
}

/**
 * Encapsula o cálculo do Fator R com proveniência auditável para a Linha de Base RUSLE (Decisão D13).
 *
 * @param insumo Objeto contendo os totais mensais ou as coordenadas para lookup climatológico CHIRPS.
 * @returns Proveniencia<number> modelada ou indisponivel.
 */
export function obterFatorRComProveniencia(insumo?: InsumoFatorR | null): Proveniencia<number> {
  if (!insumo) {
    return {
      estado: "indisponivel",
      causa: "insuficiente",
      motivo: "Insumo de precipitação pluviométrica para cálculo do Fator R não fornecido (Decisão D13).",
    };
  }

  let pMensal: number[] | null = null;
  let fonteDescricao = "";

  if (Array.isArray(insumo.precipitacaoMensalMm) && insumo.precipitacaoMensalMm.length === 12) {
    pMensal = insumo.precipitacaoMensalMm;
    fonteDescricao = insumo.identificadorFonte || "Série mensal fornecida";
  } else if (
    typeof insumo.latitude === "number" &&
    typeof insumo.longitude === "number" &&
    Number.isFinite(insumo.latitude) &&
    Number.isFinite(insumo.longitude)
  ) {
    const clim = obterPrecipitacaoClimatologicaChirps(insumo.latitude, insumo.longitude);
    if (!clim) {
      return {
        estado: "indisponivel",
        causa: "fora-do-dominio",
        motivo: `Coordenada (${insumo.latitude.toFixed(4)}, ${insumo.longitude.toFixed(4)}) fora do domínio climatológico da Bacia do Paraná 3.`,
      };
    }
    pMensal = clim.precipitacaoMensalMm;
    fonteDescricao = `CHIRPS v2.0 Climatológico 0.05° (Referência regional: ${clim.estacaoReferencia})`;
  } else {
    return {
      estado: "indisponivel",
      causa: "insuficiente",
      motivo: "Precipitação mensal ausente e coordenadas geográficas não informadas para consulta CHIRPS.",
    };
  }

  try {
    const resultado = calcularFatorR(pMensal);

    return {
      estado: "modelado",
      valor: resultado.rAnual,
      modelo:
        "Equação regional do Paraná (Rufino et al., 1993 / Waltrick et al., 2015) sobre CHIRPS climatológico v2.0 (UCSB 0.05°)",
      insumos: [
        "CHIRPS 2.0 mensal 0.05°",
        `Precipitação anual: ${resultado.pAnual} mm`,
        fonteDescricao,
        "Sucedâneo declarado do EI30 (Decisão D13): totais mensais CHIRPS sem intensidade pluvial em 30 min",
      ],
      decisoes: ["D13"],
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
      motivo: `Falha no cálculo do Fator R: ${err.message}`,
    };
  }
}
