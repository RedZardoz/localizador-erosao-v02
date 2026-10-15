/**
 * Tipos e funções puras (isentos de dependências node:*) para o sorteio de polígonos D16.
 * Seguro para importação em componentes React ("use client").
 */

import {
  exigirDecisao,
  DECISOES,
  PARAMETROS,
} from "@/config/decisoes";
import { OPCOES_ELEGIBILIDADE_PADRAO } from "./elegibilidade";
import {
  CandidatoEstratificacao,
  TODOS_ESTRATOS_D12,
  particionarCandidatosEm18Estratos,
} from "./estratificacao";
import { CAMPOS_PROIBIDOS_MATRIZ_TREINO } from "@/lib/matriz/invariantes";
import { Proveniencia } from "@/types/proveniencia";

export type IdPreCondicaoSorteioD16 =
  | "decisoes_fechadas"
  | "p05_estrito_30_40"
  | "worldcover_duas_epocas"
  | "k_ambiguo_associacao_booleano"
  | "minimo_4_candidatos_por_estrato"
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

export interface CandidatoSorteioD16
  extends Omit<CandidatoEstratificacao, "declividadePct" | "frequenciaSoloNu"> {
  declividadePct: number | null;
  frequenciaSoloNu: number | null;
  classeWorldCover2020: number | null | undefined;
  classeWorldCover2021: number | null | undefined;
  kAmbiguoAssociacao: true | false | "indisponivel" | undefined;
  kAmbiguoAssociacaoProveniencia?: Proveniencia<boolean>;
  unidadeDeterminanteK2024?: {
    codUm: string;
    codUm2: string;
    ogcFid: number | null;
    erodUm: string;
    kSolos: number | null;
    kSolosBruto: number | null;
    nivelK: 1 | 2 | null;
  } | null;
  pontoEmFronteiraPedologica?: Proveniencia<boolean>;
  [chaveAdicional: string]: unknown;
}

export interface PoligonoSorteadoD16 {
  idPoligono: string;
  idCandidatoOrigem: string;
  codigoOpacoVant: string;
  estratoId: string;
  papelConjunto: "treino" | "held-out";
  pi_i: number;
  w_i: number;
  nCandidatosEstrato: number;
  centroide: {
    latitude: number;
    longitude: number;
  };
  areaHectares: 10 | 5.02;
  geometria: GeoJSON.Polygon;
  declividadePct: number;
  frequenciaSoloNu: number;
  nivelK: 1 | 2;
  kAmbiguoAssociacao: true | false | "indisponivel";
  kAmbiguoAssociacaoProveniencia?: Proveniencia<boolean>;
  unidadeDeterminanteK2024?: {
    codUm: string;
    codUm2: string;
    ogcFid: number | null;
    erodUm: string;
    kSolos: number | null;
    kSolosBruto: number | null;
    nivelK: 1 | 2 | null;
  } | null;
  classeWorldCover2020: number;
  classeWorldCover2021: number;
  pontoEmFronteiraPedologica: Proveniencia<boolean>;
}

export interface SeloSorteioD16 {
  versaoEsquema: "1.0.0" | "1.1.0" | "1.2.0";
  geradoEm: string;
  semente: number;
  politicaSemente: string;
  gitCommit: string;
  sha256ConjuntoCandidatos: string;
  hashIntegridade: string;
  totalCandidatosEntrada: number;
  totalPoligonosSorteados: 36 | 72;
  totalTreino: 18 | 36;
  totalHeldOut: 18 | 36;
  areaTotalHectares: 360 | 361.44;
  limiaresS: { t1: number; t2: number };
  limiaresE: { t1: number; t2: number };
  contagemCandidatosPorEstrato: Record<string, number>;
  decisoesVigentes: Record<
    "D07" | "D08" | "D12" | "D16" | "D23",
    { titulo: string; status: string; decididaEm?: string }
  >;
  poligonos: PoligonoSorteadoD16[];
  tabelaCorrespondenciaOpaca: Record<string, string>;
}

export interface RelatorioPreCondicoesD16 {
  aprovado: boolean;
  condicaoFalha: IdPreCondicaoSorteioD16 | null;
  motivoFalha: string | null;
  seloExistenteCaminho: string | null;
  totalCandidatos: number;
  candidatosExcluidosMedidaAusente: number;
  limiaresS: { t1: number; t2: number };
  limiaresE: { t1: number; t2: number };
  contagemCandidatosPorEstrato: Record<string, number>;
  estratosDeficientes: string[];
}

export const CAMPOS_ESTRUTURAIS_PERMITIDOS_CANDIDATO = new Set<string>([
  "id",
  "latitude",
  "longitude",
  "declividadePct",
  "frequenciaSoloNu",
  "nivelK",
  "classeWorldCover2020",
  "classeWorldCover2021",
  "kAmbiguoAssociacao",
  "kAmbiguoAssociacaoProveniencia",
  "ramoAmbiguidadeD08",
  "unidadeDeterminanteK2024",
]);

export const CAMPOS_RASTREIO_PROIBIDOS_SORTEIO = new Set<string>([
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

export function verificarPreCondicoesSorteioD16(
  candidatos: CandidatoSorteioD16[],
  opcoes: {
    seloExistenteCaminho?: string | null;
    lancarErro?: boolean;
  } = {}
): RelatorioPreCondicoesD16 {
  const { seloExistenteCaminho = null, lancarErro = true } = opcoes;

  const candidatosValidos = candidatos.filter(
    (c): c is CandidatoSorteioD16 & { declividadePct: number; frequenciaSoloNu: number } =>
      typeof c.declividadePct === "number" &&
      Number.isFinite(c.declividadePct) &&
      typeof c.frequenciaSoloNu === "number" &&
      Number.isFinite(c.frequenciaSoloNu)
  );
  const candidatosExcluidosMedidaAusente = candidatos.length - candidatosValidos.length;

  const particao =
    candidatosValidos.length > 0
      ? particionarCandidatosEm18Estratos(candidatosValidos)
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
    (idEstrato) => contagemCandidatosPorEstrato[idEstrato] < 4
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
      totalCandidatos: candidatosValidos.length,
      candidatosExcluidosMedidaAusente,
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
      return falhar(
        "decisoes_fechadas",
        err instanceof Error ? err.message : String(err)
      );
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
  for (const cand of candidatosValidos) {
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
  for (const cand of candidatosValidos) {
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

  // Pré-condição 4: todo candidato traz kAmbiguoAssociacao nos três estados de D08 emendada (true, false ou "indisponivel"), nunca undefined
  for (const cand of candidatosValidos) {
    const valKAmbiguo = cand.kAmbiguoAssociacao;
    const ehEstadoValidoD08 =
      valKAmbiguo === true ||
      valKAmbiguo === false ||
      valKAmbiguo === "indisponivel";
    if (!ehEstadoValidoD08) {
      return falhar(
        "k_ambiguo_associacao_booleano",
        `Candidato '${cand.id}' possui kAmbiguoAssociacao=${String(
          cand.kAmbiguoAssociacao
        )} (deve ser estritamente um dos três estados de D08/W3: true, false ou 'indisponivel').`
      );
    }
  }

  // Pré-condição 5: os 18 estratos têm ao menos 4 candidatos cada
  if (estratosDeficientes.length > 0) {
    const detalhe = estratosDeficientes
      .map((e) => `${e} (${contagemCandidatosPorEstrato[e]} candidato(s))`)
      .join(", ");
    return falhar(
      "minimo_4_candidatos_por_estrato",
      `Os 18 estratos de D12 exigem ao menos 4 candidatos cada para formar dois de treino e dois de held-out de D16. Estratos deficientes (${estratosDeficientes.length}/18): ${detalhe}.`
    );
  }

  return {
    aprovado: true,
    condicaoFalha: null,
    motivoFalha: null,
    seloExistenteCaminho: null,
    totalCandidatos: candidatosValidos.length,
    candidatosExcluidosMedidaAusente,
    limiaresS: particao.limiaresS,
    limiaresE: particao.limiaresE,
    contagemCandidatosPorEstrato,
    estratosDeficientes: [],
  };
}
