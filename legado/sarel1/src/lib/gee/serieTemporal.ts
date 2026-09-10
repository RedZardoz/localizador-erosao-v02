/**
 * ============================================================================
 * Séries Temporais Multiespectrais (Sentinel-2 / Landsat) — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * REGRA 7 DA LEI FUNDAMENTAL:
 * "Preservar o mascaramento do Earth Engine. Máscara de nuvem existe para
 * remover pixel inválido. Não a desfaça. Nunca invente dado de satélite,
 * nem use .unmask() com constante sobre banda física."
 *
 * BANDAS SELECIONADAS (PLANEJAMENTO V3, §6.1):
 * - B2, B3, B4: Visível (cor e hematita/goethita no solo)
 * - B5, B6, B7: Red Edge (estresse e vigor vegetal)
 * - B8, B8A: NIR (dossel e biomassa)
 * - B11, B12: SWIR (mineralogia de argila e umidade — eixos da degradação)
 * Descartadas: B1 (aerossol 60m) e B9 (vapor d'água 60m).
 */

export interface ObservacaoEspectral {
  data: string; // ISO YYYY-MM-DD
  tAnos: number; // Fração de ano para análise harmônica
  nuvemSombra: boolean; // Se true, o pixel foi mascarado por nuvem ou sombra
  // Bandas de reflectância de superfície (0.0 a 1.0) ou null se mascarado
  b2: number | null;
  b3: number | null;
  b4: number | null;
  b5: number | null;
  b6: number | null;
  b7: number | null;
  b8: number | null;
  b8a: number | null;
  b11: number | null;
  b12: number | null;
  // Índices derivados
  ndvi: number | null;
  bsi: number | null;
}

/**
 * Calcula o NDVI: (B8 - B4) / (B8 + B4).
 * Se qualquer banda for nula/mascarada, o resultado é estritamente null.
 */
export function calcularNdvi(b8: number | null, b4: number | null): number | null {
  if (b8 === null || b4 === null || isNaN(b8) || isNaN(b4)) {
    return null;
  }
  const soma = b8 + b4;
  if (Math.abs(soma) < 1e-6) return 0;
  const ndvi = (b8 - b4) / soma;
  return Number(Math.max(-1, Math.min(1, ndvi)).toFixed(4));
}

/**
 * Calcula o BSI (Bare Soil Index):
 * BSI = ((B11 + B4) - (B8 + B2)) / ((B11 + B4) + (B8 + B2))
 * Referência: Rikimaru, Roy & Miyatake (2002).
 */
export function calcularBsi(
  b11: number | null,
  b4: number | null,
  b8: number | null,
  b2: number | null
): number | null {
  if (b11 === null || b4 === null || b8 === null || b2 === null ||
      isNaN(b11) || isNaN(b4) || isNaN(b8) || isNaN(b2)) {
    return null;
  }
  const parte1 = b11 + b4;
  const parte2 = b8 + b2;
  const denominador = parte1 + parte2;
  if (Math.abs(denominador) < 1e-6) return 0;
  const bsi = (parte1 - parte2) / denominador;
  return Number(Math.max(-1, Math.min(1, bsi)).toFixed(4));
}

/**
 * Filtra e processa uma série temporal de observações espectrais.
 * REGRA 7: Píxels mascarados por nuvem NUNCA recebem unmask(0.0) ou unmask(0.5).
 */
export function processarSerieTemporal(observacoesBrutas: ObservacaoEspectral[]): {
  totalObservacoes: number;
  observacoesValidas: ObservacaoEspectral[];
  nObservacoesValidas: number;
  taxaNuvemPct: number;
} {
  const total = observacoesBrutas.length;
  if (total === 0) {
    return {
      totalObservacoes: 0,
      observacoesValidas: [],
      nObservacoesValidas: 0,
      taxaNuvemPct: 0,
    };
  }

  // Apenas observações sem nuvem e com bandas físicas válidas
  const validas = observacoesBrutas.filter(obs => !obs.nuvemSombra && obs.b4 !== null && obs.b8 !== null);
  const mascaradas = total - validas.length;
  const taxaNuvem = Number(((mascaradas / total) * 100).toFixed(1));

  return {
    totalObservacoes: total,
    observacoesValidas: validas,
    nObservacoesValidas: validas.length,
    taxaNuvemPct: taxaNuvem,
  };
}
