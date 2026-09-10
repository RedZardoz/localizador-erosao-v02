/**
 * ============================================================================
 * Montagem da Matriz de Treino — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * Conforme §11.5 do Plano de Implementação v2 e Lei Fundamental:
 * Compõe a matriz tabular de dados para o modelo preditivo XGBoost.
 *
 * REGRA 4 DA LEI FUNDAMENTAL & AUDITORIA B3:
 * EXCLUSÕES OBRIGATÓRIAS VERIFICADAS EM EXECUÇÃO:
 * - phiDiag / quantilPhi / phi (critério interno de amostragem)
 * - estratoId (critério interno de estratificação)
 * - Qualquer score ou índice determinístico composto
 * - perdaSolo e tipologia
 * - Todos os 5 fatores da RUSLE (R, K, LS, C, P)
 * - Dados cadastrais/fundiários (LGPD e não-biofísicos)
 * - Rótulos de drone ou com papel held-out (restritos à validação final da Fase D)
 * - Pontos com flag sintético
 */

import { PontoAmostral } from "@/types/ponto";
import { ClasseRotulo, ModalidadeRotulo, RotuloConsolidado } from "@/types/rotulo";
import { valorOuNulo } from "@/types/proveniencia";
import { assegurarSegregacaoTreino } from "@/lib/rotulos/ingestaoDrone";
import { assegurarApenasPontosReais } from "@/lib/seguranca/guardaSintetico";

/** Lista de campos terminantemente proibidos na matriz de treino (Regra 4). */
export const CAMPOS_PROIBIDOS_MATRIZ_TREINO = [
  "phiDiag",
  "quantilPhi",
  "phi",
  "estratoId",
  "tercilS",
  "tercilE",
  "nivelK",
  "scorePrioridade",
  "severidade",
  "tipologia",
  "perdaSolo",
  "rusle_perdaSolo",
  "rusle_fatorR",
  "rusle_fatorK",
  "rusle_fatorLS",
  "rusle_fatorC",
  "rusle_fatorP",
  "fatorR",
  "fatorK",
  "fatorLS",
  "fatorC",
  "fatorP",
  "memoriaCalculo",
  "codigoCar",
  "titularMascarado",
  "documentoMascarado",
  "registroIncra",
  "areaImovelHa",
  "statusFundiario",
] as const;

export interface LinhaMatrizTreino {
  // Identificadores de validação e particionamento espacial
  pontoId: string;
  codigo: string;
  blocoEspacial: string; // Validação cruzada espacial independente (Roberts et al., 2017)

  // Variáveis Biofísicas de Terreno
  elevacao: number | null;
  declividadePct: number | null;
  declividadeGraus: number | null;
  curvaturaPerfil: number | null;
  curvaturaPlana: number | null;
  acumuloFluxo: number | null;
  twi: number | null;

  // Variáveis Pedológicas (Embrapa)
  ordemSolo: string | null;
  subOrdemSolo: string | null;
  grandeGrupoSolo: string | null;
  erodibilidadeClasse: string | null;

  // Variáveis da Série Temporal e Cobertura (Sentinel-2 GEE)
  frequenciaSoloNu: number | null;
  [key: `harmonico_${string}`]: number | null | undefined;
  [key: `compostoSoloNu_${string}`]: number | null | undefined;

  // Variáveis Pluviométricas (CHIRPS / GPM IMERG)
  precipAcum30d: number | null;
  precipAcum90d: number | null;
  i30Max: number | null;
  nEventosErosivos: number | null;
  indiceMecanismo: number | null;

  // Variáveis Alvo (Rotulagem de Observação Humana — Regra 4)
  rotuloClasse: ClasseRotulo;
  rotuloBinario: number; // 0 = sem erosão relevante, 1 = com erosão
  rotuloModalidade: ModalidadeRotulo;
  rotuloObservador: string;
  rotuloObservadoEm: string;
}

export interface OpcoesMontagemMatriz {
  modo?: "D" | "P"; // D = detecção, P = predição
  excluirAmbigua?: boolean; // se true, exclui "incipiente" para afiar fronteira binária
  mapeamentoBinario?: (classe: ClasseRotulo) => number;
  excluirDivergenciasPendentes?: boolean;
}

export interface MetadadosMatrizTreino {
  totalAmostras: number;
  modo: "D" | "P";
  distribuicaoClasses: Record<ClasseRotulo, number>;
  prevalenciaPositivaPct: number;
  distribuicaoBlocosEspaciais: Record<string, number>;
  colunasFeatures: string[];
  colunasProibidasVerificadasAusentes: string[];
  avisos: string[];
}

export interface ResultadoMontagemMatriz {
  linhas: LinhaMatrizTreino[];
  metadados: MetadadosMatrizTreino;
}

/** Mapeamento padrão binário: ausente/incipiente -> 0, moderada/severa -> 1. */
export function mapeamentoBinarioPadrao(classe: ClasseRotulo): number {
  switch (classe) {
    case "ausente":
    case "incipiente":
      return 0;
    case "moderada":
    case "severa":
      return 1;
  }
}

/**
 * Monta a matriz tabular de treino supervisionado a partir de pontos amostrais
 * e seus rótulos observados consolidados.
 */
export function montarMatrizTreino(
  pontos: PontoAmostral[],
  rotulosConsolidados?: Record<string, RotuloConsolidado>,
  opcoes: OpcoesMontagemMatriz = {}
): ResultadoMontagemMatriz {
  const {
    modo = "D",
    excluirAmbigua = false,
    mapeamentoBinario = mapeamentoBinarioPadrao,
    excluirDivergenciasPendentes = true,
  } = opcoes;

  const avisos: string[] = [];

  // 1. Guarda antissintético absoluto (corrige I2)
  assegurarApenasPontosReais(pontos, "montagem da matriz de treino");

  // 2. Guarda de segregação da validação por Drone (Fase D / Held-out)
  assegurarSegregacaoTreino(pontos);

  const linhas: LinhaMatrizTreino[] = [];
  const distribuicaoClasses: Record<ClasseRotulo, number> = {
    ausente: 0,
    incipiente: 0,
    moderada: 0,
    severa: 0,
  };
  const distribuicaoBlocos: Record<string, number> = {};

  for (const ponto of pontos) {
    // Determinar o rótulo válido
    const rotuloConsolidado = rotulosConsolidados?.[ponto.codigo] ?? (ponto.rotulo ? { final: ponto.rotulo, origens: [ponto.rotulo] } : null);

    if (!rotuloConsolidado) {
      // Ponto ainda não rotulado não entra no treino
      continue;
    }

    if (excluirDivergenciasPendentes && rotuloConsolidado.divergencia === "pendente") {
      avisos.push(`Ponto ${ponto.codigo} excluído do treino por divergência pendente entre observadores.`);
      continue;
    }

    const rotulo = rotuloConsolidado.final;

    // Guarda contra rótulo de drone no treino
    if (rotulo.modalidade === "drone") {
      throw new Error(
        `VIOLAÇÃO: O ponto ${ponto.codigo} possui rótulo da modalidade 'drone' (held-out) e não pode integrar o conjunto de treino.`
      );
    }

    // Exclusão metodológica da classe ambígua se configurada (§3 da Etapa 0)
    if (excluirAmbigua && rotulo.classe === "incipiente") {
      avisos.push(`Ponto ${ponto.codigo} excluído do treino por ser classe intermediária ("incipiente").`);
      continue;
    }

    const linha: LinhaMatrizTreino = {
      pontoId: ponto.id,
      codigo: ponto.codigo,
      blocoEspacial: ponto.blocoEspacial,

      // Terreno
      elevacao: valorOuNulo(ponto.terreno?.elevacao),
      declividadePct: valorOuNulo(ponto.terreno?.declividadePct),
      declividadeGraus: valorOuNulo(ponto.terreno?.declividadeGraus),
      curvaturaPerfil: valorOuNulo(ponto.terreno?.curvaturaPerfil),
      curvaturaPlana: valorOuNulo(ponto.terreno?.curvaturaPlana),
      acumuloFluxo: valorOuNulo(ponto.terreno?.acumuloFluxo),
      twi: valorOuNulo(ponto.terreno?.twi),

      // Solo
      ordemSolo: valorOuNulo(ponto.solo?.ordem),
      subOrdemSolo: valorOuNulo(ponto.solo?.subOrdem),
      grandeGrupoSolo: valorOuNulo(ponto.solo?.grandeGrupo),
      erodibilidadeClasse: valorOuNulo(ponto.solo?.erodibilidadeClasse),

      // Série Temporal
      frequenciaSoloNu: valorOuNulo(ponto.serie?.frequenciaSoloNu),

      // Pluviometria
      precipAcum30d: valorOuNulo(ponto.chuva?.precipAcum30d),
      precipAcum90d: valorOuNulo(ponto.chuva?.precipAcum90d),
      i30Max: valorOuNulo(ponto.chuva?.i30Max),
      nEventosErosivos: valorOuNulo(ponto.chuva?.nEventosErosivos),
      indiceMecanismo: valorOuNulo(ponto.chuva?.indiceMecanismo),

      // Rótulo
      rotuloClasse: rotulo.classe,
      rotuloBinario: mapeamentoBinario(rotulo.classe),
      rotuloModalidade: rotulo.modalidade,
      rotuloObservador: rotulo.observador,
      rotuloObservadoEm: rotulo.observadoEm,
    };

    // Incorporar harmônicos e bandas de solo nu com prefixo explícito
    if (ponto.serie?.harmonicos) {
      for (const [k, v] of Object.entries(ponto.serie.harmonicos)) {
        linha[`harmonico_${k}`] = valorOuNulo(v);
      }
    }
    if (ponto.serie?.compostoSoloNu) {
      for (const [k, v] of Object.entries(ponto.serie.compostoSoloNu)) {
        linha[`compostoSoloNu_${k}`] = valorOuNulo(v);
      }
    }

    linhas.push(linha);
    distribuicaoClasses[rotulo.classe]++;
    distribuicaoBlocos[ponto.blocoEspacial] = (distribuicaoBlocos[ponto.blocoEspacial] || 0) + 1;
  }

  // 3. Auditoria estrita em tempo de execução: checar se algum campo proibido vazou
  verificarCamposProibidos(linhas);

  const totalAmostras = linhas.length;
  const positivas = (distribuicaoClasses.moderada || 0) + (distribuicaoClasses.severa || 0);
  const prevalenciaPositivaPct = totalAmostras > 0 ? Number(((positivas / totalAmostras) * 100).toFixed(2)) : 0;

  // Extrair nomes das features dinâmicas
  const colunasFeatures: string[] = [];
  if (linhas.length > 0) {
    const chaves = Object.keys(linhas[0]);
    for (const c of chaves) {
      if (!["pontoId", "codigo", "blocoEspacial", "rotuloClasse", "rotuloBinario", "rotuloModalidade", "rotuloObservador", "rotuloObservadoEm"].includes(c)) {
        colunasFeatures.push(c);
      }
    }
  }

  return {
    linhas,
    metadados: {
      totalAmostras,
      modo,
      distribuicaoClasses,
      prevalenciaPositivaPct,
      distribuicaoBlocosEspaciais: distribuicaoBlocos,
      colunasFeatures,
      colunasProibidasVerificadasAusentes: [...CAMPOS_PROIBIDOS_MATRIZ_TREINO],
      avisos,
    },
  };
}

/**
 * Auditoria de execução que garante a conformidade com a Regra 4.
 * @throws Error se qualquer coluna proibida existir na estrutura montada.
 */
export function verificarCamposProibidos(linhas: LinhaMatrizTreino[]): void {
  if (linhas.length === 0) return;

  for (const linha of linhas) {
    const chaves = Object.keys(linha);
    for (const proibido of CAMPOS_PROIBIDOS_MATRIZ_TREINO) {
      if (chaves.includes(proibido)) {
        throw new Error(
          `VIOLAÇÃO DA REGRA 4 DA LEI FUNDAMENTAL: O campo proibido '${proibido}' vazou para a matriz de treino!`
        );
      }
    }
  }
}
