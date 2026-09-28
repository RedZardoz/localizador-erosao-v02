/**
 * ============================================================================
 * Motor Determinístico de Sorteio dos 36 Polígonos de Drone (10 ha) — FASE A1
 * SAREL v2.0 — Decisões D07, D08, D12, D16 e D23 (PPGTCA 2026)
 * ============================================================================
 *
 * REGRAS E GARANTIAS METODOLÓGICAS:
 * 1. Reaproveita a partição canônica de `src/lib/gee/estratificacao.ts` (`particionarCandidatosEm18Estratos`
 *    e `criarPrng`), sem reimplementar tercis nem estratos.
 * 2. Sorteia exatamente 2 polígonos de 10 ha por estrato sobre os 18 estratos (3 × 3 × 2) de D12,
 *    totalizando 36 polígonos (360 ha).
 * 3. De cada par em um estrato `h` com `N_h` candidatos:
 *    - A probabilidade de inclusão de cada polígono sorteado é registrada exatamente como `pi_i = 2 / N_h` (D23).
 *    - Um polígono é designado para `"treino"` (18 polígonos) e o outro para `"held-out"` (18 polígonos),
 *      sendo essa designação ela própria sorteada com o PRNG da semente registrada, NUNCA pela ordem
 *      em que os candidatos apareceram.
 * 4. Verifica rigorosamente as 7 pré-condições antes de qualquer sorteio e recusa com erro tipado
 *    nomeando a pré-condição violada.
 * 5. Idempotência estrita (D23): se qualquer selo anterior existir, recusa imediatamente sem sobrescrever
 *    nem versionar (`_v2`), protegendo os `pi_i` já selados.
 */

import {
  exigirDecisao,
  DECISOES,
  PARAMETROS,
  REGISTRO_DECISOES,
} from "@/config/decisoes";
import { OPCOES_ELEGIBILIDADE_PADRAO } from "./elegibilidade";
import {
  CandidatoEstratificacao,
  TODOS_ESTRATOS_D12,
  particionarCandidatosEm18Estratos,
  criarPrng,
} from "./estratificacao";
import { CAMPOS_PROIBIDOS_MATRIZ_TREINO } from "@/lib/matriz/invariantes";

export type IdPreCondicaoSorteioD16 =
  | "decisoes_fechadas"
  | "p05_estrito_30_40"
  | "worldcover_duas_epocas"
  | "k_ambiguo_associacao_booleano"
  | "minimo_2_candidatos_por_estrato"
  | "nenhum_selo_anterior"
  | "guarda_anticircularidade_d16";

export class ErroPreCondicaoSorteioD16 extends Error {
  public readonly condicaoFalha: IdPreCondicaoSorteioD16;

  constructor(condicaoFalha: IdPreCondicaoSorteioD16, mensagem: string) {
    super(`[SORTEIO_D16_RECUSADO:${condicaoFalha}] ${mensagem}`);
    this.name = "ErroPreCondicaoSorteioD16";
    this.condicaoFalha = condicaoFalha;
  }
}

export interface CandidatoSorteioD16 extends CandidatoEstratificacao {
  classeWorldCover2020: number | null | undefined;
  classeWorldCover2021: number | null | undefined;
  kAmbiguoAssociacao: boolean | undefined;
  [chaveAdicional: string]: unknown;
}

export interface PoligonoSorteadoD16 {
  idPoligono: string;
  idCandidatoOrigem: string;
  estratoId: string;
  papelConjunto: "treino" | "held-out";
  pi_i: number;
  w_i: number;
  nCandidatosEstrato: number;
  centroide: {
    latitude: number;
    longitude: number;
  };
  areaHectares: 10;
  geometria: GeoJSON.Polygon;
  declividadePct: number;
  frequenciaSoloNu: number;
  nivelK: 1 | 2;
  kAmbiguoAssociacao: boolean;
  classeWorldCover2020: number;
  classeWorldCover2021: number;
}

export interface SeloSorteioD16 {
  versaoEsquema: "1.0.0";
  geradoEm: string;
  semente: number;
  politicaSemente: string;
  gitCommit: string;
  sha256ConjuntoCandidatos: string;
  hashIntegridade: string;
  totalCandidatosEntrada: number;
  totalPoligonosSorteados: 36;
  totalTreino: 18;
  totalHeldOut: 18;
  areaTotalHectares: 360;
  limiaresS: { t1: number; t2: number };
  limiaresE: { t1: number; t2: number };
  contagemCandidatosPorEstrato: Record<string, number>;
  decisoesVigentes: Record<
    "D07" | "D08" | "D12" | "D16" | "D23",
    { titulo: string; status: string; decididaEm?: string }
  >;
  poligonos: PoligonoSorteadoD16[];
}

export interface RelatorioPreCondicoesD16 {
  aprovado: boolean;
  condicaoFalha: IdPreCondicaoSorteioD16 | null;
  motivoFalha: string | null;
  seloExistenteCaminho: string | null;
  totalCandidatos: number;
  limiaresS: { t1: number; t2: number };
  limiaresE: { t1: number; t2: number };
  contagemCandidatosPorEstrato: Record<string, number>;
  estratosDeficientes: string[];
}

/**
 * Campos de entrada legítimos para estratificação espacial e metadados de elegibilidade.
 * Todos os demais itens de `CAMPOS_PROIBIDOS_MATRIZ_TREINO` (como `scoreSuscetibilidade`,
 * `scoreJev`, `severidade`, `scorePrioridade`, `phiDiag`, `laudoJev`, `perdaSoloRUSLE`)
 * são estritamente proibidos nos candidatos de sorteio (Guarda Anticircularidade de D16).
 */
const CAMPOS_ESTRUTURAIS_PERMITIDOS_CANDIDATO = new Set<string>([
  "id",
  "latitude",
  "longitude",
  "declividadePct",
  "frequenciaSoloNu",
  "nivelK",
  "classeWorldCover2020",
  "classeWorldCover2021",
  "kAmbiguoAssociacao",
]);

const CAMPOS_RASTREIO_PROIBIDOS_SORTEIO = new Set<string>([
  ...CAMPOS_PROIBIDOS_MATRIZ_TREINO.filter(
    (c) => !CAMPOS_ESTRUTURAIS_PERMITIDOS_CANDIDATO.has(c)
  ),
  "scoreSuscetibilidade",
  "scoreJev",
  "severidade",
  "scorePrioridade",
  "escoreRastreioD02",
  "suscetibilidade",
]);

/**
 * Constrói um polígono quadrado de exatamente 10 ha (lado = sqrt(100.000 m²) ≈ 316,227766 m)
 * centrado no centroide `(latitude, longitude)` usando conversão métrica local compatível com SIRGAS 2000.
 */
export function construirPoligono10Ha(latitude: number, longitude: number): GeoJSON.Polygon {
  const LADO_METROS = Math.sqrt(100_000); // 316.22776601683796 m
  const MEIO_LADO_M = LADO_METROS / 2;
  const latRad = (latitude * Math.PI) / 180;
  const metrosPorGrauLat = 111132.92 - 559.82 * Math.cos(2 * latRad) + 1.175 * Math.cos(4 * latRad);
  const metrosPorGrauLon = 111412.84 * Math.cos(latRad) - 93.5 * Math.cos(3 * latRad);

  const dLat = MEIO_LADO_M / metrosPorGrauLat;
  const dLon = MEIO_LADO_M / metrosPorGrauLon;

  const minLon = Number((longitude - dLon).toFixed(7));
  const maxLon = Number((longitude + dLon).toFixed(7));
  const minLat = Number((latitude - dLat).toFixed(7));
  const maxLat = Number((latitude + dLat).toFixed(7));

  return {
    type: "Polygon",
    coordinates: [
      [
        [minLon, minLat],
        [maxLon, minLat],
        [maxLon, maxLat],
        [minLon, maxLat],
        [minLon, minLat],
      ],
    ],
  };
}

/**
 * Avalia todas as 7 pré-condições obrigatórias da FASE A1.
 * Se `lancarErro === true`, propaga `ErroDecisaoPendente` (pré-condição 1) ou `ErroPreCondicaoSorteioD16`.
 */
export function verificarPreCondicoesSorteioD16(
  candidatos: CandidatoSorteioD16[],
  opcoes: {
    seloExistenteCaminho?: string | null;
    lancarErro?: boolean;
  } = {}
): RelatorioPreCondicoesD16 {
  const { seloExistenteCaminho = null, lancarErro = true } = opcoes;

  const particao =
    candidatos.length > 0
      ? particionarCandidatosEm18Estratos(candidatos)
      : {
          limiaresS: { t1: 0, t2: 0 },
          limiaresE: { t1: 0, t2: 0 },
          todosPossiveisEstratos: [...TODOS_ESTRATOS_D12],
          estratosMap: Object.fromEntries(TODOS_ESTRATOS_D12.map((e) => [e, []])),
        };

  const contagemCandidatosPorEstrato: Record<string, number> = {};
  for (const idEstrato of TODOS_ESTRATOS_D12) {
    const lista = particao.estratosMap[idEstrato];
    contagemCandidatosPorEstrato[idEstrato] = Array.isArray(lista) ? lista.length : [].length;
  }
  const estratosDeficientes = TODOS_ESTRATOS_D12.filter(
    (idEstrato) => contagemCandidatosPorEstrato[idEstrato] < 2
  );

  const falhar = (
    condicaoFalha: IdPreCondicaoSorteioD16,
    motivoFalha: string
  ): RelatorioPreCondicoesD16 => {
    if (lancarErro) {
      throw new ErroPreCondicaoSorteioD16(condicaoFalha, motivoFalha);
    }
    return {
      aprovado: false,
      condicaoFalha,
      motivoFalha,
      seloExistenteCaminho,
      totalCandidatos: candidatos.length,
      limiaresS: particao.limiaresS,
      limiaresE: particao.limiaresE,
      contagemCandidatosPorEstrato,
      estratosDeficientes,
    };
  };

  // Pré-condição 1: exigirDecisao passa para D07, D08, D12, D16, D23 (propaga ErroDecisaoPendente)
  const decisoesExigidas = ["D07", "D08", "D12", "D16", "D23"] as const;
  for (const idDecisao of decisoesExigidas) {
    try {
      exigirDecisao(DECISOES[idDecisao]);
    } catch (err) {
      if (lancarErro) throw err;
      return {
        aprovado: false,
        condicaoFalha: "decisoes_fechadas",
        motivoFalha: err instanceof Error ? err.message : String(err),
        seloExistenteCaminho,
        totalCandidatos: candidatos.length,
        limiaresS: particao.limiaresS,
        limiaresE: particao.limiaresE,
        contagemCandidatosPorEstrato,
        estratosDeficientes,
      };
    }
  }

  // Pré-condição 6 (Idempotência D23): nenhum selo de sorteio anterior existe
  if (seloExistenteCaminho && seloExistenteCaminho.trim().length > 0) {
    return falhar(
      "nenhum_selo_anterior",
      `Já existe um selo de sorteio D16 registrado em '${seloExistenteCaminho}'. A Decisão D23 proíbe descartar ou sobrescrever probabilidades de inclusão (pi_i) já registradas.`
    );
  }

  // Pré-condição 2: P05 resolve exatamente para [30, 40]
  const p05Classes = Array.isArray(PARAMETROS.P05?.valor)
    ? (PARAMETROS.P05.valor as number[])
    : [];
  const elegibilidadeClasses = OPCOES_ELEGIBILIDADE_PADRAO.allowedLandCoverClasses;
  const p05Exato =
    PARAMETROS.P05?.estado === "decidida" &&
    p05Classes.length === 2 &&
    p05Classes[0] === 30 &&
    p05Classes[1] === 40 &&
    elegibilidadeClasses.length === 2 &&
    elegibilidadeClasses[0] === 30 &&
    elegibilidadeClasses[1] === 40;
  if (!p05Exato) {
    return falhar(
      "p05_estrito_30_40",
      `Parâmetro P05 ou OPCOES_ELEGIBILIDADE_PADRAO diverge de [30, 40] (P05=${JSON.stringify(
        p05Classes
      )}, elegibilidade=${JSON.stringify(elegibilidadeClasses)}).`
    );
  }

  // Pré-condição 7 (Guarda anticircularidade de D16): nenhum insumo do rastreio espectral de D02
  for (const cand of candidatos) {
    for (const chave of Object.keys(cand)) {
      if (CAMPOS_RASTREIO_PROIBIDOS_SORTEIO.has(chave) && cand[chave] !== undefined) {
        return falhar(
          "guarda_anticircularidade_d16",
          `Guarda anticircularidade D16 violada: candidato '${cand.id}' contém o campo proibido '${chave}' oriundo de rastreio espectral/predição.`
        );
      }
    }
  }

  // Pré-condição 3: todo candidato traz as duas épocas do WorldCover, e ambas em [30, 40]
  for (const cand of candidatos) {
    const wc2020 = cand.classeWorldCover2020;
    const wc2021 = cand.classeWorldCover2021;
    if (
      typeof wc2020 !== "number" ||
      typeof wc2021 !== "number" ||
      ![30, 40].includes(wc2020) ||
      ![30, 40].includes(wc2021)
    ) {
      return falhar(
        "worldcover_duas_epocas",
        `Candidato '${cand.id}' possui WorldCover inválido ou época ausente (2020=${String(
          wc2020
        )}, 2021=${String(wc2021)}). Ambas as épocas 2020 (v100) e 2021 (v200) devem estar em [30, 40] (D07).`
      );
    }
  }

  // Pré-condição 4: todo candidato traz kAmbiguoAssociacao como booleano, nunca undefined
  for (const cand of candidatos) {
    if (typeof cand.kAmbiguoAssociacao !== "boolean") {
      return falhar(
        "k_ambiguo_associacao_booleano",
        `Candidato '${cand.id}' possui kAmbiguoAssociacao=${String(
          cand.kAmbiguoAssociacao
        )} (deve ser booleano estrito conforme Tarefa 4 / D08).`
      );
    }
  }

  // Pré-condição 5: os 18 estratos têm ao menos 2 candidatos cada
  if (estratosDeficientes.length > 0) {
    const detalhe = estratosDeficientes
      .map((e) => `${e} (${contagemCandidatosPorEstrato[e]} candidato(s))`)
      .join(", ");
    return falhar(
      "minimo_2_candidatos_por_estrato",
      `Os 18 estratos de D12 exigem ao menos 2 candidatos cada para formar o par treino/held-out de D16. Estratos deficientes (${estratosDeficientes.length}/18): ${detalhe}.`
    );
  }

  return {
    aprovado: true,
    condicaoFalha: null,
    motivoFalha: null,
    seloExistenteCaminho: null,
    totalCandidatos: candidatos.length,
    limiaresS: particao.limiaresS,
    limiaresE: particao.limiaresE,
    contagemCandidatosPorEstrato,
    estratosDeficientes: [],
  };
}

/**
 * Executa o sorteio determinístico dos 36 polígonos de 10 ha (2 por estrato sobre os 18 estratos de D12),
 * designando aleatoriamente 1 para treino e 1 para held-out em cada estrato com a semente registrada,
 * e registrando a probabilidade de inclusão exata `pi_i = 2 / N_h` (D23).
 */
export function sortearPoligonosDroneD16(
  candidatos: CandidatoSorteioD16[],
  opcoes: {
    semente: number;
    gitCommit: string;
    sha256ConjuntoCandidatos: string;
    seloExistenteCaminho?: string | null;
    geradoEm?: string;
  }
): SeloSorteioD16 {
  const {
    semente,
    gitCommit,
    sha256ConjuntoCandidatos,
    seloExistenteCaminho = null,
    geradoEm = new Date().toISOString(),
  } = opcoes;

  if (!Number.isFinite(semente) || !Number.isInteger(semente) || semente <= 0) {
    throw new Error(`Semente de sorteio inválida (${semente}). Deve ser inteiro positivo registrado (P07).`);
  }

  const possuiCandidatoSintetico = candidatos.some(
    (c) =>
      String(c.id).startsWith("DRY-CAND-") ||
      c.isSynthetic === true ||
      c.origemSintetica === true
  );
  if (possuiCandidatoSintetico) {
    throw new Error(
      "Recusa de sorteio D23 (T4.3): o selo de sorteio jamais pode ser gerado a partir de candidatos sintéticos/fabricados (DRY-CAND- / isSynthetic)."
    );
  }

  // Verifica rigorosamente as 7 pré-condições (lança erro se qualquer uma falhar)
  const relatorioPre = verificarPreCondicoesSorteioD16(candidatos, {
    seloExistenteCaminho,
    lancarErro: true,
  });

  const { limiaresS, limiaresE, estratosMap } = particionarCandidatosEm18Estratos(candidatos);
  const prng = criarPrng(semente);

  const poligonos: PoligonoSorteadoD16[] = [];
  let seqPoligono = 1;

  for (const idEstrato of TODOS_ESTRATOS_D12) {
    // Ordena inicialmente por ID apenas para garantir independência da ordem de chegada na rede,
    // e em seguida aplica embaralhamento Fisher-Yates completo com a semente registrada
    const poolEstrato = [...estratosMap[idEstrato]].sort((a, b) => a.id.localeCompare(b.id));
    const nCandidatosEstrato = poolEstrato.length;

    for (let i = poolEstrato.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      const temp = poolEstrato[i];
      poolEstrato[i] = poolEstrato[j];
      poolEstrato[j] = temp;
    }

    const parSorteado = [poolEstrato[0], poolEstrato[1]];

    // A designação treino / held-out dentro do par é ela mesma sorteada com a semente registrada,
    // NUNCA pela ordem em que os candidatos apareceram
    const primeiroVaiParaTreino = prng() < 0.5;
    const papeisPar: ["treino" | "held-out", "treino" | "held-out"] = primeiroVaiParaTreino
      ? ["treino", "held-out"]
      : ["held-out", "treino"];

    // Probabilidade de inclusão exata em amostragem aleatória simples sem reposição de tamanho 2 no estrato h (D23)
    // e peso de Horvitz-Thompson w_i = N_h / 2 tal que pi_i * w_i = 1
    const pi_i = Number((2 / nCandidatosEstrato).toFixed(8));
    const w_i = Number((nCandidatosEstrato / 2).toFixed(8));

    for (let idxPar = 0; idxPar < 2; idxPar++) {
      const cand = parSorteado[idxPar];
      const papelConjunto = papeisPar[idxPar];
      const idPoligono = `D16-${String(seqPoligono).padStart(2, "0")}-${idEstrato}`;
      seqPoligono++;

      poligonos.push({
        idPoligono,
        idCandidatoOrigem: cand.id,
        estratoId: idEstrato,
        papelConjunto,
        pi_i,
        w_i,
        nCandidatosEstrato,
        centroide: {
          latitude: cand.latitude,
          longitude: cand.longitude,
        },
        areaHectares: 10,
        geometria: construirPoligono10Ha(cand.latitude, cand.longitude),
        declividadePct: cand.declividadePct,
        frequenciaSoloNu: cand.frequenciaSoloNu,
        nivelK: cand.nivelK,
        kAmbiguoAssociacao: cand.kAmbiguoAssociacao as boolean,
        classeWorldCover2020: cand.classeWorldCover2020 as number,
        classeWorldCover2021: cand.classeWorldCover2021 as number,
      });
    }
  }

  // Hash determinístico estável sobre a lista ordenada de polígonos sorteados com seus pi_i e w_i
  const stringCanonica = poligonos
    .map(
      (p) =>
        `${p.idPoligono}|${p.idCandidatoOrigem}|${p.estratoId}|${p.papelConjunto}|${p.pi_i.toFixed(8)}|${p.w_i.toFixed(8)}`
    )
    .join(";");
  let h1 = 0xdeadbeef ^ semente;
  let h2 = 0x41c6ce57 ^ semente;
  for (let i = 0; i < stringCanonica.length; i++) {
    const ch = stringCanonica.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hashIntegridade = `${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0).toString(16).padStart(8, "0")}`;

  return {
    versaoEsquema: "1.0.0",
    geradoEm,
    semente,
    politicaSemente: String(PARAMETROS.P07?.valor ?? "dinamica-registrada"),
    gitCommit,
    sha256ConjuntoCandidatos,
    hashIntegridade,
    totalCandidatosEntrada: candidatos.length,
    totalPoligonosSorteados: 36,
    totalTreino: 18,
    totalHeldOut: 18,
    areaTotalHectares: 360,
    limiaresS: relatorioPre.limiaresS,
    limiaresE: relatorioPre.limiaresE,
    contagemCandidatosPorEstrato: relatorioPre.contagemCandidatosPorEstrato,
    decisoesVigentes: {
      D07: {
        titulo: REGISTRO_DECISOES.D07.titulo,
        status: REGISTRO_DECISOES.D07.estado,
        decididaEm: REGISTRO_DECISOES.D07.decididoEm,
      },
      D08: {
        titulo: REGISTRO_DECISOES.D08.titulo,
        status: REGISTRO_DECISOES.D08.estado,
        decididaEm: REGISTRO_DECISOES.D08.decididoEm,
      },
      D12: {
        titulo: REGISTRO_DECISOES.D12.titulo,
        status: REGISTRO_DECISOES.D12.estado,
        decididaEm: REGISTRO_DECISOES.D12.decididoEm,
      },
      D16: {
        titulo: REGISTRO_DECISOES.D16.titulo,
        status: REGISTRO_DECISOES.D16.estado,
        decididaEm: REGISTRO_DECISOES.D16.decididoEm,
      },
      D23: {
        titulo: REGISTRO_DECISOES.D23.titulo,
        status: REGISTRO_DECISOES.D23.estado,
        decididaEm: REGISTRO_DECISOES.D23.decididoEm,
      },
    },
    poligonos,
  };
}
