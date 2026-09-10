/**
 * ============================================================================
 * Estratificação Multivariada e Amostragem por Quantis — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * MUDANÇA CONCEITUAL CENTRAL (PLANO V2, §3.3):
 * 1. Abandono do Top-N: Amostrar apenas os maiores scores produzia um conjunto sem
 *    variação na variável de interesse, destruindo a fronteira de decisão do XGBoost.
 * 2. Estratificação por Terços Cruzados de 3 Dimensões Físicas:
 *    - S^ (Terreno): declividade em % (Copernicus DEM em EPSG:31982) -> 3 terços
 *    - E^ (Exposição): frequência de solo nu na série histórica -> 3 terços
 *    - K^ (Erodibilidade): classe Embrapa agrupada em 2 níveis -> 2 níveis
 *    Total: 3 x 3 x 2 = 18 estratos independentes.
 * 3. Phi_diag rebaixado a diagnóstico interno (Regra 4):
 *    Phi_diag = (S^_norm + E^_norm + K^_norm) / 3
 *    NUNCA sai como resultado, NUNCA entra na matriz de treino.
 * 4. Reprodutibilidade (Achado M3): Semente aleatória explicitamente registrada.
 */

export interface CandidatoEstratificacao {
  id: string;
  latitude: number;
  longitude: number;
  declividadePct: number;    // Dimensão S^
  frequenciaSoloNu: number;  // Dimensão E^ [0, 1]
  nivelK: 1 | 2;             // Dimensão K^ (1 = Baixa/Média, 2 = Alta/Muito Alta)
}

export interface PontoAmostrado {
  id: string;
  codigo: string;
  latitude: number;
  longitude: number;
  declividadePct: number;
  frequenciaSoloNu: number;
  nivelK: 1 | 2;
  estratoId: string;
  tercilS: number;
  tercilE: number;
  phiDiag: number; // Critério interno de diagnóstico [0, 1]
}

export interface RelatorioEstratificacao {
  totalCandidatosAvaliados: number;
  totalPontosAmostrados: number;
  sementeAleatoria: number;
  limiaresS: { t1: number; t2: number };
  limiaresE: { t1: number; t2: number };
  estratosOcupados: Record<string, { totalDisponivel: number; totalAmostrado: number }>;
  estratosVazios: string[];
}

/**
 * Gerador de números pseudo-aleatórios determinístico baseado em semente (PRNG LCG).
 * Garante 100% de reprodutibilidade por terceiros (Achado M3).
 */
export function criarPrng(semente: number) {
  let s = Math.abs(semente) % 2147483647;
  if (s === 0) s = 12345;
  return function proximoAleatorio(): number {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Calcula os percentis empíricos 33.3% e 66.7% para particionamento em terços.
 */
export function calcularLimiaresTercis(valores: number[]): { t1: number; t2: number } {
  if (valores.length === 0) return { t1: 0, t2: 0 };
  const ordenados = [...valores].sort((a, b) => a - b);
  const n = ordenados.length;
  const idx1 = Math.floor(n * 0.3333);
  const idx2 = Math.floor(n * 0.6667);
  return {
    t1: Number(ordenados[idx1].toFixed(4)),
    t2: Number(ordenados[idx2].toFixed(4)),
  };
}

/**
 * Atribui o terço (1, 2 ou 3) com base nos limiares empíricos da AOI.
 */
export function classificarTercil(valor: number, limiares: { t1: number; t2: number }): 1 | 2 | 3 {
  if (valor <= limiares.t1) return 1;
  if (valor <= limiares.t2) return 2;
  return 3;
}

/**
 * Executa a amostragem estratificada multivariada por quantis.
 */
export function executarAmostragemEstratificada(
  candidatos: CandidatoEstratificacao[],
  metaAmostras: number = 300,
  semente: number = 20260908
): { pontos: PontoAmostrado[]; relatorio: RelatorioEstratificacao } {
  if (candidatos.length === 0) {
    return {
      pontos: [],
      relatorio: {
        totalCandidatosAvaliados: 0,
        totalPontosAmostrados: 0,
        sementeAleatoria: semente,
        limiaresS: { t1: 0, t2: 0 },
        limiaresE: { t1: 0, t2: 0 },
        estratosOcupados: {},
        estratosVazios: [],
      },
    };
  }

  // 1. Limiares empíricos de terços dentro do frame da AOI
  const limiaresS = calcularLimiaresTercis(candidatos.map(c => c.declividadePct));
  const limiaresE = calcularLimiaresTercis(candidatos.map(c => c.frequenciaSoloNu));

  // Faixas extremas para normalização do Phi_diag interno
  const sMin = Math.min(...candidatos.map(c => c.declividadePct));
  const sMax = Math.max(...candidatos.map(c => c.declividadePct));
  const eMin = Math.min(...candidatos.map(c => c.frequenciaSoloNu));
  const eMax = Math.max(...candidatos.map(c => c.frequenciaSoloNu));

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

  // 3. Alocação uniforme entre estratos ocupados
  const estratosOcupadosIds = todosPossiveisEstratos.filter(id => estratosMap[id].length > 0);
  const estratosVazios = todosPossiveisEstratos.filter(id => estratosMap[id].length === 0);

  const nEstratosAtivos = estratosOcupadosIds.length;
  const cotaPorEstrato = nEstratosAtivos > 0 ? Math.ceil(metaAmostras / nEstratosAtivos) : 0;

  const prng = criarPrng(semente);
  const pontosAmostrados: PontoAmostrado[] = [];
  const resumoOcupacao: Record<string, { totalDisponivel: number; totalAmostrado: number }> = {};

  let seqCodigo = 1;

  for (const id of estratosOcupadosIds) {
    const lista = estratosMap[id];
    resumoOcupacao[id] = { totalDisponivel: lista.length, totalAmostrado: 0 };

    // Embaralhamento determinístico de Fisher-Yates
    const embaralhado = [...lista];
    for (let i = embaralhado.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      const temp = embaralhado[i];
      embaralhado[i] = embaralhado[j];
      embaralhado[j] = temp;
    }

    const selecionados = embaralhado.slice(0, cotaPorEstrato);
    resumoOcupacao[id].totalAmostrado = selecionados.length;

    for (const item of selecionados) {
      const tS = classificarTercil(item.declividadePct, limiaresS);
      const tE = classificarTercil(item.frequenciaSoloNu, limiaresE);

      // Normalização [0, 1] para Phi_diag interno
      const sNorm = sMax > sMin ? (item.declividadePct - sMin) / (sMax - sMin) : 0.5;
      const eNorm = eMax > eMin ? (item.frequenciaSoloNu - eMin) / (eMax - eMin) : 0.5;
      const kNorm = item.nivelK === 2 ? 1.0 : 0.0;
      const phiDiag = Number(((sNorm + eNorm + kNorm) / 3).toFixed(4));

      pontosAmostrados.push({
        id: item.id,
        codigo: `PR-2026-${String(seqCodigo++).padStart(4, "0")}`,
        latitude: item.latitude,
        longitude: item.longitude,
        declividadePct: item.declividadePct,
        frequenciaSoloNu: item.frequenciaSoloNu,
        nivelK: item.nivelK,
        estratoId: id,
        tercilS: tS,
        tercilE: tE,
        phiDiag,
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
      estratosOcupados: resumoOcupacao,
      estratosVazios,
    },
  };
}
