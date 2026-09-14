/**
 * ============================================================================
 * Protocolo de Validação Matricial Pixel-a-Pixel (VANT vs Satélite) — SAREL
 * PPGTCA 2026 — Pesquisa de Mestrado em Erosão Laminar
 * ============================================================================
 *
 * O QUÊ ESTE MÓDULO EXECUTA:
 * - Realiza a validação cruzada espacial de altíssima resolução espacial, confrontando
 *   a classificação predita pelo modelo orbital (Sentinel-2 / XGBoost na grade de 10 m)
 *   contra a verdade terrestre de alta fidelidade gerada por aerolevantamento com VANT/Drone
 *   (GSD de 5 a 10 cm) em sítios contínuos de 10 a 50 hectares (Céu Azul e Medianeira).
 * - Calcula as métricas de concordância espacial e pericial:
 *   1. Matriz de Confusão Pixel-a-Pixel (TP, FP, FN, TN)
 *   2. Acurácia Global (Overall Accuracy - OA)
 *   3. Coeficiente Kappa de Cohen (κ)
 *   4. F1-Score, Precisão e Sensibilidade (Recall)
 *   5. Índice de Jaccard / Intersection over Union (IoU) para manchas ativas
 *   6. Estratificação por compartimento topo-sequencial (topo, encosta, baixada)
 *
 * POR QUÊ ESTE PROTOCOLO É OBRIGATÓRIO NA DISSERTAÇÃO (SEÇÃO 3.2 DO MÉTODO):
 * 1. O Problema da Agregação Espacial e Resolução Mista (10 m vs 5-10 cm):
 *    Um pixel orbital do Sentinel-2 cobre 100 m² (10 x 10 m). Feições iniciais de
 *    erosão laminar e microrravinas possuem largura de 20 a 80 cm, ocupando apenas
 *    uma fração do pixel. O VANT (GSD 5 a 10 cm) produz de 10.000 a 40.000 sub-pixels
 *    dentro de uma única célula orbital, permitindo integrar a fração contínua real
 *    de solo erodido e auditar rigorosamente o comportamento da IA.
 * 2. Inviolabilidade do Conjunto Held-Out (Regra 4 do SAREL):
 *    Os dados de drone e os sítios de Céu Azul/Medianeira são estritamente mantidos
 *    como teste cego held-out. Eles NUNCA entram na matriz de treino do XGBoost,
 *    garantindo que o desempenho reportado represente a capacidade real de generalização
 *    do modelo em bacias agrícolas sem vazamento de dados.
 * 3. Por que o Índice de Jaccard / IoU é Indispensável:
 *    Em bacias hidrográficas sob plantio direto, feições de erosão severa ocupam tipicamente
 *    menos de 15% da área cultivada. A métrica de Acurácia Global pode apresentar um falso
 *    otimismo (ex.: 85% de acerto prevendo apenas controle). O IoU [TP / (TP + FP + FN)]
 *    mede a sobreposição geométrica estrita da mancha degradada, punindo qualquer falso positivo.
 */

export interface PixelValidacao {
  idPixel: string;
  latitude: number;
  longitude: number;
  referenciaDrone: 0 | 1;
  predicaoSatelite: 0 | 1;
  fracaoErosaoDronePct?: number; // 0.0% a 100.0% dentro do pixel de 100 m²
  probabilidadeSatelite?: number; // 0.0 a 1.0 gerada pelo XGBoost
  compartimento?: "topo_estavel" | "encosta_escoamento" | "baixada_deposicao";
}

export interface MatrizConfusaoPixel {
  tp: number; // Satélite = 1, Drone = 1
  fp: number; // Satélite = 1, Drone = 0
  fn: number; // Satélite = 0, Drone = 1
  tn: number; // Satélite = 0, Drone = 0
  total: number;
}

export interface MetricasCompartimento {
  totalPixels: number;
  acuracia: number;
  kappa: number;
  sensibilidade: number;
  precisao: number;
}

export interface MetricasValidacaoMatricial {
  totalPixelsAvaliados: number;
  gsdDroneCm: number;
  gradeSateliteM: number;
  razaoEscalaSubpixel: number; // (10m / GSD)² -> ex.: (10 / 0.075)² ≈ 17.777 sub-pixels de drone por pixel de satélite
  matrizConfusao: MatrizConfusaoPixel;
  acuraciaGlobal: number; // OA
  kappaCohen: number; // κ
  precisao: number;
  sensibilidade: number; // Recall
  especificidade: number;
  f1Score: number;
  iouErosao: number; // Jaccard Index
  porCompartimento: Partial<Record<"topo_estavel" | "encosta_escoamento" | "baixada_deposicao", MetricasCompartimento>>;
  papelConjunto: "held-out";
}

export interface OpcoesValidacaoMatricial {
  gsdDroneCm: number;
  gradeSateliteM: number;
}

/**
 * Converte a fração contínua de solo exposto degradado observada pelo drone (GSD 5-10 cm)
 * no rótulo binário do pixel de 10m de acordo com o limiar de consenso.
 */
export function converterFracaoDroneParaBinario(
  fracaoErosaoPct: number,
  limiarCortePct: number
): 0 | 1 {
  if (fracaoErosaoPct < 0 || fracaoErosaoPct > 100) {
    throw new Error(
      `Fração de erosão inválida: ${fracaoErosaoPct}%. Deve situar-se entre 0% e 100%.`
    );
  }
  return fracaoErosaoPct >= limiarCortePct ? 1 : 0;
}

/**
 * Calcula a Matriz de Confusão a partir dos pares observados (Drone vs Satélite).
 */
export function calcularMatrizConfusao(pixels: PixelValidacao[]): MatrizConfusaoPixel {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;

  for (const p of pixels) {
    if (p.predicaoSatelite === 1 && p.referenciaDrone === 1) {
      tp++;
    } else if (p.predicaoSatelite === 1 && p.referenciaDrone === 0) {
      fp++;
    } else if (p.predicaoSatelite === 0 && p.referenciaDrone === 1) {
      fn++;
    } else {
      tn++;
    }
  }

  return {
    tp,
    fp,
    fn,
    tn,
    total: pixels.length,
  };
}

/**
 * Calcula o Coeficiente Kappa de Cohen (κ) para avaliação inter-sensores.
 */
export function calcularKappaCohen(tp: number, fp: number, fn: number, tn: number): number {
  const n = tp + fp + fn + tn;
  if (n === 0) return 0;

  // Concordância observada
  const p0 = (tp + tn) / n;

  // Concordância esperada por acaso
  const pSim = ((tp + fp) * (tp + fn)) / (n * n);
  const pNao = ((tn + fn) * (tn + fp)) / (n * n);
  const pe = pSim + pNao;

  if (pe >= 1) return 1;
  const kappa = (p0 - pe) / (1 - pe);
  if (kappa > 1) return 1;
  if (kappa < -1) return -1;
  return Number(kappa.toFixed(4));
}

/**
 * Executa o protocolo completo de validação matricial de alta resolução.
 */
export function executarValidacaoMatricial(
  pixels: PixelValidacao[],
  opcoes: OpcoesValidacaoMatricial
): MetricasValidacaoMatricial {
  if (!pixels || pixels.length === 0) {
    throw new Error("O conjunto de pixels de validação não pode estar vazio.");
  }

  const gsdCm = opcoes.gsdDroneCm;
  const gradeM = opcoes.gradeSateliteM;
  const razaoSubpixel = Math.round(Math.pow((gradeM * 100) / gsdCm, 2));

  const matriz = calcularMatrizConfusao(pixels);
  const { tp, fp, fn, tn, total } = matriz;

  const acuraciaGlobal = total > 0 ? Number(((tp + tn) / total).toFixed(4)) : 0;
  const precisao = tp + fp > 0 ? Number((tp / (tp + fp)).toFixed(4)) : 0;
  const sensibilidade = tp + fn > 0 ? Number((tp / (tp + fn)).toFixed(4)) : 0;
  const especificidade = tn + fp > 0 ? Number((tn / (tn + fp)).toFixed(4)) : 0;

  const f1Score =
    precisao + sensibilidade > 0
      ? Number(((2 * precisao * sensibilidade) / (precisao + sensibilidade)).toFixed(4))
      : 0;

  const iouErosao =
    tp + fp + fn > 0 ? Number((tp / (tp + fp + fn)).toFixed(4)) : 0;

  const kappa = calcularKappaCohen(tp, fp, fn, tn);

  // Quebra por compartimento topo-sequencial
  const porCompartimento: MetricasValidacaoMatricial["porCompartimento"] = {};
  const grupos = ["topo_estavel", "encosta_escoamento", "baixada_deposicao"] as const;

  for (const g of grupos) {
    const pixelsGrupo = pixels.filter((p) => p.compartimento === g);
    if (pixelsGrupo.length > 0) {
      const mG = calcularMatrizConfusao(pixelsGrupo);
      const accG = (mG.tp + mG.tn) / mG.total;
      const kapG = calcularKappaCohen(mG.tp, mG.fp, mG.fn, mG.tn);
      const sensG = mG.tp + mG.fn > 0 ? mG.tp / (mG.tp + mG.fn) : 0;
      const precG = mG.tp + mG.fp > 0 ? mG.tp / (mG.tp + mG.fp) : 0;

      porCompartimento[g] = {
        totalPixels: pixelsGrupo.length,
        acuracia: Number(accG.toFixed(4)),
        kappa: kapG,
        sensibilidade: Number(sensG.toFixed(4)),
        precisao: Number(precG.toFixed(4)),
      };
    }
  }

  return {
    totalPixelsAvaliados: total,
    gsdDroneCm: gsdCm,
    gradeSateliteM: gradeM,
    razaoEscalaSubpixel: razaoSubpixel,
    matrizConfusao: matriz,
    acuraciaGlobal,
    kappaCohen: kappa,
    precisao,
    sensibilidade,
    especificidade,
    f1Score,
    iouErosao,
    porCompartimento,
    papelConjunto: "held-out",
  };
}

/**
 * Guarda Inviolável: Assegura que nenhum dado de validação padrão-ouro (VANT)
 * seja integrado à base de treino do modelo supervisionado.
 */
export function assegurarSegregacaoHeldOut(dados: { papelConjunto: string }): void {
  if (dados.papelConjunto !== "held-out") {
    throw new Error(
      "VIOLAÇÃO DA LEI FUNDAMENTAL DO SAREL (Regra 4 e Metodologia §3.2): Os dados de validação por VANT/Drone devem possuir papel estritamente 'held-out'."
    );
  }
}
