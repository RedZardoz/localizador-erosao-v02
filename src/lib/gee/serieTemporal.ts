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
 * DECISÃO D04 (MODELO D vs MODELO P):
 * - Modelo D (Detecção): série observada no ano/ciclo da detecção do rótulo.
 * - Modelo P (Predição): série histórica anterior ao evento com intervalo de guarda
 *   (proposta: 2 anos antes), impedindo contaminação por vazamento temporal.
 */

export interface ObservacaoCena {
  data: string;          // YYYY-MM-DD
  tAnos: number;         // Tempo fracionário em anos decimais (ex: 2024.35)
  productId: string;     // Identificador da cena no repositório oficial (PRODUCT_ID)
  nuvemSombra: boolean;  // True se mascarado por nuvem ou sombra (P09)
  // Reflectância de superfície normalizada [0.0, 1.0] ou null se mascarado/ausente
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
}

export type NomeBandaEspectral = "b2" | "b3" | "b4" | "b5" | "b6" | "b7" | "b8" | "b8a" | "b11" | "b12";

export const TODAS_BANDAS_ESPECTRAIS: NomeBandaEspectral[] = [
  "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b8a", "b11", "b12"
];

/**
 * Calcula o Índice de Vegetação por Diferença Normalizada (NDVI):
 * NDVI = (B8 - B4) / (B8 + B4)
 * Retorna null se qualquer uma das bandas estiver mascarada ou ausente.
 */
export function calcularNdvi(b8: number | null, b4: number | null): number | null {
  if (b8 === null || b4 === null || !Number.isFinite(b8) || !Number.isFinite(b4)) {
    return null;
  }
  const soma = b8 + b4;
  if (Math.abs(soma) < 1e-6) return 0;
  const val = (b8 - b4) / soma;
  if (val > 1) return 1;
  if (val < -1) return -1;
  return Number(val.toFixed(4));
}

/**
 * Calcula o Índice de Solo Nu (Bare Soil Index - BSI):
 * BSI = ((B11 + B4) - (B8 + B2)) / ((B11 + B4) + (B8 + B2))
 * Retorna null se qualquer uma das 4 bandas estiver mascarada.
 */
export function calcularBsi(
  b11: number | null,
  b4: number | null,
  b8: number | null,
  b2: number | null
): number | null {
  if (
    b11 === null || b4 === null || b8 === null || b2 === null ||
    !Number.isFinite(b11) || !Number.isFinite(b4) || !Number.isFinite(b8) || !Number.isFinite(b2)
  ) {
    return null;
  }
  const termo1 = b11 + b4;
  const termo2 = b8 + b2;
  const denominador = termo1 + termo2;
  if (Math.abs(denominador) < 1e-6) return 0;
  const val = (termo1 - termo2) / denominador;
  if (val > 1) return 1;
  if (val < -1) return -1;
  return Number(val.toFixed(4));
}

export interface JanelaTemporal {
  inicio: string; // YYYY-MM-DD
  fim: string;    // YYYY-MM-DD
}

/**
 * Define as janelas de observação distintas para o Modelo D e o Modelo P (Decisão D04).
 * @param dataRotulo Data do evento ou validação de campo (YYYY-MM-DD)
 * @param intervaloGuardaAnos Intervalo de guarda para o modelo preditivo P (ex: 2 anos)
 * @param duracaoJanelaAnos Duração da janela histórica de amostragem (ex: 3 anos)
 */
export function definirJanelasModelo(
  dataRotulo: string,
  intervaloGuardaAnos: number,
  duracaoJanelaAnos: number
): {
  modeloD: JanelaTemporal;
  modeloP: JanelaTemporal;
} {
  const dRef = new Date(dataRotulo);
  if (isNaN(dRef.getTime())) {
    throw new Error(`Data de referência inválida: ${dataRotulo}`);
  }

  // Modelo D: termina na data do rótulo
  const fimD = new Date(dRef);
  const inicioD = new Date(dRef);
  inicioD.setFullYear(fimD.getFullYear() - duracaoJanelaAnos);

  // Modelo P: termina antes do evento respeitando o intervalo de guarda
  const fimP = new Date(dRef);
  fimP.setFullYear(fimP.getFullYear() - intervaloGuardaAnos);
  const inicioP = new Date(fimP);
  inicioP.setFullYear(fimP.getFullYear() - duracaoJanelaAnos);

  return {
    modeloD: {
      inicio: inicioD.toISOString().split("T")[0],
      fim: fimD.toISOString().split("T")[0],
    },
    modeloP: {
      inicio: inicioP.toISOString().split("T")[0],
      fim: fimP.toISOString().split("T")[0],
    },
  };
}

/**
 * Filtra a série cronológica de cenas para os limites de uma janela temporal.
 */
export function filtrarSeriePorJanela(
  cenas: ObservacaoCena[],
  janela: JanelaTemporal
): ObservacaoCena[] {
  return cenas.filter(c => c.data >= janela.inicio && c.data <= janela.fim);
}

/**
 * Conta o número de observações válidas (sem nuvem e com valor numérico) por banda física.
 */
export function contarObservacoesValidas(
  cenas: ObservacaoCena[]
): Record<string, number> {
  const contagens: Record<string, number> = {};

  for (const b of TODAS_BANDAS_ESPECTRAIS) {
    const validos = cenas.filter(c => !c.nuvemSombra && c[b] !== null && Number.isFinite(c[b])).length;
    contagens[b.toUpperCase()] = validos;
  }

  return contagens;
}
