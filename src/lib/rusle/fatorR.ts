/**
 * ============================================================================
 * Fator R de Erosividade da Chuva — SAREL (PPGTCA 2026)
 * Decisão D13 — Equação Regional do Paraná sobre CHIRPS Climatológico
 * ============================================================================
 *
 * FUNDAMENTAÇÃO METODOLÓGICA (DECISÃO D13):
 * 1. Equação Regional do Paraná:
 *    Formulações de correlação entre o coeficiente de chuva Rc e o índice
 *    de erosividade mensal EI30 citadas na literatura paranaense (Waltrick et al., 2015;
 *    SBCS-NEPAR Bol. 01, 2011; ambas citando Rufino et al., 1993):
 *      Rc_m = p_m^2 / P_anual
 *      EI30_m = a + b * Rc_m
 *      R = Σ (m=1..12) EI30_m
 *
 * 2. DIRETRIZ H1 (02/10/2026) — AUDITORIA ESTREITA DE FONTES PRIMÁRIAS:
 *    Os coeficientes a = 107,52 e b = 46,89 não constam no texto extraído das obras
 *    primárias arquivadas no repositório (Waltrick et al., 2015 e NEPAR, 2011).
 *    Rufino et al. (1993) é obra impressa antiga não arquivada com extração primária.
 *    Por força da regra P12 e da Diretriz H1, na ausência de comprovação documental
 *    do par numérico em fonte primária arquivada, OS COEFICIENTES FORAM RETIRADOS e
 *    o Fator R retorna estritamente 'indisponivel' com causa nominal 'insuficiente'.
 *
 * 3. CHIRPS Climatológico 0.05° Nativo (UCSB CHC — Diretriz H2):
 *    Baixado diretamente dos servidores UCSB CHC (HTTP 200 direto sem credencial)
 *    com diário de requisições emitido (docs/verificacoes/diario_climatologia_chirps_bp3.json)
 *    e artefato de medição em docs/verificacoes/climatologia_chirps_bp3.json.
 *    Suporte espacial nativo de 0,05° (~5,5 km), SEM reamostragem simulada para 10 m (D06).
 *
 * 4. Tabela de Conferência Cruzada Declarada (Diretriz H2):
 *    A tabela histórica municipal é mantida estritamente como conferência cruzada
 *    (Waltrick et al., 2015, Quadro 1) e JAMAIS como fonte primária dos totais CHIRPS.
 *
 * VERIFICADO 2026-10-01 — evidência: docs/verificacoes/fontes/waltrick2015/saida_extracao_waltrick_2015.txt
 * VERIFICADO 2026-10-01 — evidência: docs/verificacoes/fontes/nepar2011/saida_extracao_nepar_2011.txt
 * VERIFICADO 2026-10-02 — evidência: docs/verificacoes/climatologia_chirps_bp3.json
 * VERIFICADO 2026-10-02 — evidência: docs/verificacoes/diario_climatologia_chirps_bp3.json
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

export interface CoeficientesRegressaoR {
  a: number;
  b: number;
  referencia: string;
}

/**
 * Registro de estado dos coeficientes da Equação Regional do Paraná (Diretriz H1).
 * Por ausência de fonte primária arquivada contendo o par (107.52, 46.89), os coeficientes
 * numéricos foram desativados do cálculo ativo e o Fator R retorna 'indisponivel'.
 * A referência cita exclusivamente as obras arquivadas no repositório.
 */
export const COEFICIENTES_REGIONAL_PARANA_OESTE = {
  a: null as number | null,
  b: null as number | null,
  estado: "indisponivel" as const,
  causa: "insuficiente" as const,
  motivo:
    "Coeficientes regionais de erosividade pendentes de comprovação textual em fonte primária arquivada (Diretriz H1 - 02/10/2026).",
  referencia: "Waltrick et al. (2015) / SBCS-NEPAR Bol. 01 (2011)",
} as const;

/**
 * Coeficientes paramétricos para testes de calibração / análise de sensibilidade controlada.
 * NÃO utilizados em produção sem comprovação formal em fonte primária arquivada.
 */
export const COEFICIENTES_TESTE_CALIBRACAO: CoeficientesRegressaoR = {
  a: 107.52,
  b: 46.89,
  referencia: "Waltrick et al. (2015) / SBCS-NEPAR Bol. 01 (2011) [Série histórica regional não conferida no texto primário]",
};

/**
 * Limites do domínio físico plausível de erosividade anual no Paraná (MJ·mm·ha⁻¹·h⁻¹·ano⁻¹).
 * Valores abaixo de 1000 ou acima de 25000 indicam corrupção ou dado fora de domínio.
 */
export const FAIXA_FISICA_R_PARANA: [number, number] = [1000, 25000];

/**
 * TABELA DE CONFERÊNCIA CRUZADA (Diretriz H2):
 * Valores pluviométricos e de erosividade de referência municipal (Waltrick et al., 2015, Quadro 1).
 * DECLARADA ESTRITAMENTE COMO CONFERÊNCIA CRUZADA E NÃO COMO FONTE PRIMÁRIA DOS TOTAIS CHIRPS.
 */
export const TABELA_CONFERENCIA_CRUZADA_BP3: Record<
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

/** Alias mantido para compatibilidade retroativa com código existente, com papel declarado de conferência cruzada. */
export const CLIMATOLOGIA_CHIRPS_BP3_ESTACOES = TABELA_CONFERENCIA_CRUZADA_BP3;

/**
 * Calcula o Fator R de erosividade a partir dos 12 totais mensais de precipitação (mm).
 *
 * Sob a Diretriz H1 (02/10/2026), se os coeficientes a e b não forem explicitamente fornecidos
 * através do parâmetro opcional (ex: em testes de sensibilidade controlada), a função lança
 * ErroForaDoDominio informando a indisponibilidade formal dos coeficientes por ausência de fonte arquivada.
 *
 * @param pMensalMm Array com 12 valores numéricos de precipitação em mm (Jan..Dez).
 * @param coeficientesParana Coeficientes opcionais (a, b) para simulação paramétrica explícita.
 * @returns ResultadoCalculoFatorR com R anual, Rc e EI30 de cada mês.
 * @throws ErroForaDoDominio se coeficientes não informados ou dados inválidos.
 */
export function calcularFatorR(
  pMensalMm: number[],
  coeficientesParana?: { a: number; b: number } | null
): ResultadoCalculoFatorR {
  if (!coeficientesParana || typeof coeficientesParana.a !== "number" || typeof coeficientesParana.b !== "number") {
    throw new ErroForaDoDominio(
      "Cálculo do Fator R suspenso por força da Diretriz H1 (02/10/2026): coeficientes da equação regional do Paraná pendentes de comprovação em fonte primária arquivada. O fator R permanece indisponível."
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

  const { a, b } = coeficientesParana;
  const rcMensal: number[] = [];
  const ei30Mensal: number[] = [];

  for (let m = 0; m < 12; m++) {
    const p = pMensalMm[m];
    // Equação (1) Lombardi Neto (1977): Rc = p^2 / P
    const rc = (p * p) / pAnual;
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
 * Localiza a série pluviométrica de referência CHIRPS para uma coordenada dentro da BP3.
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
  let melhorEstacao: (typeof TABELA_CONFERENCIA_CRUZADA_BP3)[string] | null = null;

  for (const [, estacao] of Object.entries(TABELA_CONFERENCIA_CRUZADA_BP3)) {
    const dLat = lat - estacao.lat;
    const dLon = lon - estacao.lon;
    const dist2 = dLat * dLat + dLon * dLon;
    if (dist2 < menorDist) {
      menorDist = dist2;
      melhorEstacao = estacao;
    }
  }

  if (!melhorEstacao) return null;

  return {
    estacaoReferencia: melhorEstacao.nome,
    precipitacaoMensalMm: melhorEstacao.precipitacaoMensalMm,
  };
}

/**
 * Encapsula a emissão do Fator R com proveniência auditável para a Linha de Base RUSLE (Decisão D13).
 *
 * Conforme Diretriz H1 (02/10/2026), na ausência de comprovação do par de coeficientes em fonte
 * primária arquivada, o Fator R retorna compulsoriamente 'indisponivel' com causa 'insuficiente'.
 *
 * @param insumo Objeto contendo os totais mensais ou coordenadas para consulta.
 * @returns Proveniencia<number> indisponivel com motivo pericial detalhado.
 */
export function obterFatorRComProveniencia(insumo?: InsumoFatorR | null): Proveniencia<number> {
  // 1. Verificação prévia de parâmetros físicos
  if (!insumo) {
    return {
      estado: "indisponivel",
      causa: "insuficiente",
      motivo: "Insumo de precipitação pluviométrica para cálculo do Fator R não fornecido (Decisão D13).",
    };
  }

  // 2. Verificação de domínio espacial
  if (
    typeof insumo.latitude === "number" &&
    typeof insumo.longitude === "number" &&
    (insumo.latitude < -26.5 || insumo.latitude > -23.5 || insumo.longitude < -55.5 || insumo.longitude > -52.5)
  ) {
    return {
      estado: "indisponivel",
      causa: "fora-do-dominio",
      motivo: `Coordenada (${insumo.latitude.toFixed(4)}, ${insumo.longitude.toFixed(4)}) fora do domínio da Bacia do Paraná 3.`,
    };
  }

  // 3. DIRETRIZ H1 (BLOQUEANTE): Fator R retorna compulsoriamente 'indisponivel'
  // até que fonte primária arquivada comprove textualmente os coeficientes da regressão regional.
  return {
    estado: "indisponivel",
    causa: "insuficiente",
    motivo:
      "Fator R indisponível (Diretriz H1): Coeficientes da equação regional do Paraná pendentes de comprovação textual em fonte primária arquivada. Obras arquivadas (Waltrick et al., 2015; NEPAR, 2011) citam Rufino et al. (1993), mas não contêm a transcrição dos coeficientes numéricos em seu texto extraído.",
  };
}
