/**
 * ============================================================================
 * Estratificação Multivariada no Espaço Ŝ × Ê × K̂ — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * FUNDAMENTAÇÃO (PLANEJAMENTO V3, §7.2; PROMPT §10.2):
 * - Espaço tridimensional particionado em 18 estratos independentes:
 *   - Ŝ (Terreno): 3 terços de declividade (%)
 *   - Ê (Exposição): 3 terços de frequência de solo nu
 *   - K̂ (Erodibilidade): 2 níveis (1 = Baixa/Média, 2 = Alta/Muito Alta — D09)
 *   Total: 3 × 3 × 2 = 18 estratos.
 *
 * REGRAS DA LEI FUNDAMENTAL:
 * - Regra 1 e 5: Parâmetros metaAmostras e semente são obrigatórios (sem defaults).
 * - Regra 2 (Invariante 2): phiDiag e criterioSelecao são metadados internos de
 *   amostragem; NUNCA entram na matriz de treino, NUNCA em perfil cego.
 * - Regra 1: Quando qualquer dimensão tiver amplitude zero (max == min), phiDiag
 *   é estritamente null (nunca 0.5 inventado).
 */

export interface CandidatoEstratificacao {
  id: string;
  latitude: number;
  longitude: number;
  declividadePct: number;    // Dimensão Ŝ
  frequenciaSoloNu: number;  // Dimensão Ê [0, 1]
  nivelK: 1 | 2;             // Dimensão K̂ (1 ou 2)
}

export interface PontoEstratificado {
  id: string;
  codigo: string;            // PR-2026-XXXX
  latitude: number;
  longitude: number;
  declividadePct: number;
  frequenciaSoloNu: number;
  nivelK: 1 | 2;
  estratoId: string;
  criterioSelecao: {
    tercilS: 1 | 2 | 3;
    tercilE: 1 | 2 | 3;
    nivelK: 1 | 2;
    phiDiag: number | null;  // null quando amplitude de S ou E for zero
    semente: number;
  };
}

export interface RelatorioEstratificacao {
  totalCandidatosAvaliados: number;
  totalPontosAmostrados: number;
  sementeAleatoria: number;
  limiaresS: { t1: number; t2: number };
  limiaresE: { t1: number; t2: number };
  deficitTotal: number;
  estratosOcupados: Record<
    string,
    { totalDisponivel: number; cotaAlocada: number; totalAmostrado: number; deficit: number }
  >;
  estratosVazios: string[];
}

/**
 * Gerador de números pseudo-aleatórios determinístico Linear Congruential Generator (LCG).
 */
export function criarPrng(semente: number): () => number {
  let s = Math.abs(Math.floor(semente)) % 2147483647;
  if (s === 0) s = 12345;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Calcula os percentis empíricos de 33.33% e 66.67% para divisão em 3 terços.
 */
export function calcularLimiaresTercis(valores: number[]): { t1: number; t2: number } {
  if (valores.length === 0) return { t1: 0, t2: 0 };
  const ordenados = [...valores].sort((a, b) => a - b);
  const n = ordenados.length;
  const idx1 = Math.floor(n * 0.3333);
  const idx2 = Math.floor(n * 0.6667);
  return {
    t1: ordenados[idx1],
    t2: ordenados[idx2],
  };
}

/**
 * Atribui o tercil (1, 2 ou 3) com base nos limiares empíricos da AOI.
 */
export function classificarTercil(valor: number, limiares: { t1: number; t2: number }): 1 | 2 | 3 {
  if (valor <= limiares.t1) return 1;
  if (valor <= limiares.t2) return 2;
  return 3;
}

/**
 * Executa a amostragem estratificada multivariada sobre os 18 estratos físicos.
 */
export function executarAmostragemEstratificada(
  candidatos: CandidatoEstratificacao[],
  metaAmostras: number,
  semente: number
): { pontos: PontoEstratificado[]; relatorio: RelatorioEstratificacao } {
  if (!Number.isFinite(metaAmostras) || metaAmostras <= 0) {
    throw new Error(`Meta de amostras inválida: ${metaAmostras}`);
  }
  if (!Number.isFinite(semente)) {
    throw new Error(`Semente aleatória inválida: ${semente}`);
  }

  if (candidatos.length === 0) {
    return {
      pontos: [],
      relatorio: {
        totalCandidatosAvaliados: 0,
        totalPontosAmostrados: 0,
        sementeAleatoria: semente,
        limiaresS: { t1: 0, t2: 0 },
        limiaresE: { t1: 0, t2: 0 },
        deficitTotal: metaAmostras,
        estratosOcupados: {},
        estratosVazios: [],
      },
    };
  }

  // 1. Limiares empíricos de terços dentro da AOI
  const sVals = candidatos.map(c => c.declividadePct);
  const eVals = candidatos.map(c => c.frequenciaSoloNu);

  const limiaresS = calcularLimiaresTercis(sVals);
  const limiaresE = calcularLimiaresTercis(eVals);

  // Amplitudes para cálculo do Phi_diag
  let sMin = sVals[0];
  let sMax = sVals[0];
  for (const v of sVals) {
    if (v < sMin) sMin = v;
    if (v > sMax) sMax = v;
  }

  let eMin = eVals[0];
  let eMax = eVals[0];
  for (const v of eVals) {
    if (v < eMin) eMin = v;
    if (v > eMax) eMax = v;
  }

  const amplitudeSValida = sMax > sMin;
  const amplitudeEValida = eMax > eMin;
  const podeCalcularPhi = amplitudeSValida && amplitudeEValida;

  // 2. Agrupamento dos candidatos nos 18 estratos
  const estratosMap: Record<string, CandidatoEstratificacao[]> = {};
  const todosPossiveisEstratos: string[] = [];

  for (let s = 1; s <= 3; s++) {
    for (let e = 1; e <= 3; e++) {
      for (const k of [1, 2] as const) {
        const idEstrato = `E_${s}_${e}_${k}`;
        todosPossiveisEstratos.push(idEstrato);
        estratosMap[idEstrato] = [];
      }
    }
  }

  for (const c of candidatos) {
    const tercilS = classificarTercil(c.declividadePct, limiaresS);
    const tercilE = classificarTercil(c.frequenciaSoloNu, limiaresE);
    const id = `E_${tercilS}_${tercilE}_${c.nivelK}`;
    estratosMap[id].push(c);
  }

  // 3. Identificação de ocupação dos estratos
  const estratosOcupadosIds = todosPossiveisEstratos.filter(id => estratosMap[id].length > 0);
  const estratosVazios = todosPossiveisEstratos.filter(id => estratosMap[id].length === 0);

  const nEstratosAtivos = estratosOcupadosIds.length;
  // Cota uniforme base
  const cotaBase = nEstratosAtivos > 0 ? Math.floor(metaAmostras / nEstratosAtivos) : 0;
  let sobra = nEstratosAtivos > 0 ? metaAmostras % nEstratosAtivos : 0;

  const prng = criarPrng(semente);
  const pontosAmostrados: PontoEstratificado[] = [];
  const resumoOcupacao: RelatorioEstratificacao["estratosOcupados"] = {};
  let totalDeficit = 0;
  let seqCodigo = 1;

  for (const id of estratosOcupadosIds) {
    const lista = estratosMap[id];
    let cota = cotaBase;
    if (sobra > 0) {
      cota += 1;
      sobra -= 1;
    }

    // Embaralhamento determinístico Fisher-Yates com PRNG da semente
    const embaralhado = [...lista];
    for (let i = embaralhado.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      const temp = embaralhado[i];
      embaralhado[i] = embaralhado[j];
      embaralhado[j] = temp;
    }

    const qtdAmostrada = Math.min(cota, embaralhado.length);
    const deficit = cota > embaralhado.length ? cota - embaralhado.length : 0;
    totalDeficit += deficit;

    resumoOcupacao[id] = {
      totalDisponivel: lista.length,
      cotaAlocada: cota,
      totalAmostrado: qtdAmostrada,
      deficit,
    };

    const selecionados = embaralhado.slice(0, qtdAmostrada);

    for (const item of selecionados) {
      const tS = classificarTercil(item.declividadePct, limiaresS);
      const tE = classificarTercil(item.frequenciaSoloNu, limiaresE);

      // Cálculo de Phi_diag interno (null se amplitude de qualquer dimensão for zero)
      let phiDiag: number | null = null;
      if (podeCalcularPhi) {
        const sNorm = (item.declividadePct - sMin) / (sMax - sMin);
        const eNorm = (item.frequenciaSoloNu - eMin) / (eMax - eMin);
        const kNorm = item.nivelK === 2 ? 1.0 : 0.0;
        phiDiag = Number(((sNorm + eNorm + kNorm) / 3).toFixed(4));
      }

      pontosAmostrados.push({
        id: item.id,
        codigo: `PR-2026-${String(seqCodigo++).padStart(4, "0")}`,
        latitude: item.latitude,
        longitude: item.longitude,
        declividadePct: item.declividadePct,
        frequenciaSoloNu: item.frequenciaSoloNu,
        nivelK: item.nivelK,
        estratoId: id,
        criterioSelecao: {
          tercilS: tS,
          tercilE: tE,
          nivelK: item.nivelK,
          phiDiag,
          semente,
        },
      });
    }
  }

  return {
    pontos: pontosAmostrados,
    relatorio: {
      totalCandidatosAvaliados: candidatos.length,
      totalPontosAmostrados: pontosAmostrados.length,
      sementeAleatoria: semente,
      limiaresS,
      limiaresE,
      deficitTotal: totalDeficit,
      estratosOcupados: resumoOcupacao,
      estratosVazios,
    },
  };
}
