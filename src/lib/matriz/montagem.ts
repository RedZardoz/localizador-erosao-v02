/**
 * ============================================================================
 * Montagem da Matriz de Treino — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * ESPECIFICAÇÃO MANDATÓRIA (D16 / D26 / DEC-3c, DEC-4a, DEC-1, DEC-5):
 * - Rótulo de VANT contínuo por célula de 10 m, treino e held-out por polígono.
 * - Modalidade 'drone': vai para 'linhas' (treino) se papelConjunto === 'treino',
 *   vai para 'heldOutDrone' se papelConjunto === 'held-out',
 *   ou exclusão registrada se 'indisponivel'.
 * - Modalidade 'campo' (D03): NUNCA vai ao treino do modelo D26 (apenas âncora prospectiva).
 * - Binarização única e canônica via src/lib/rotulos/binarizacao.ts (D26 e D03).
 * - Segregação espacial obrigatória entre treino e held-out por poligonoId.
 */

import { PontoAmostral } from "@/types/ponto";
import { RotuloConsolidado } from "@/types/rotulo";
import { valorOuNulo } from "@/types/proveniencia";
import { assegurarSegregacaoTreino } from "@/lib/rotulos/ingestaoDrone";
import { assegurarApenasPontosReais } from "@/lib/seguranca/guardaSintetico";
import { CAMPOS_PROIBIDOS_MATRIZ_TREINO } from "./invariantes";
import { binarizarFracao, binarizarOrdinal } from "@/lib/rotulos/binarizacao";
import { validarRotulo } from "@/lib/rotulos/concordancia";

export interface LinhaMatrizTreino {
  pontoId: string;
  celulaId: string;
  poligonoId: string;
  papelConjunto: "treino" | "held-out";
  estratoId: string;
  fracaoErodida: number | null;
  alvoBinario25: 0 | 1 | null;
  rotuloNObservadores: number | null;

  blocoEspacial: string;

  // Terreno
  elevacao: number | null;
  declividadePct: number | null;
  declividadeGraus: number | null;
  curvaturaPerfil: number | null;
  curvaturaPlana: number | null;
  acumuloFluxo: number | null;
  twi: number | null;

  // Solo
  ordemSolo: string | null;
  subOrdemSolo: string | null;
  grandeGrupoSolo: string | null;
  erodibilidadeClasse: string | null;

  // Série Temporal e Chuva (especificada por modelo: D ou P)
  frequenciaSoloNu: number | null;
  precipAcum30d: number | null;
  precipAcum90d: number | null;
  i30Max: number | null;
  nEventosErosivos: number | null;
  indiceMecanismo: number | null;

  // Bandas e Índices Espectrais (Metodologia Mestrado PPGTCA 2026, Seção 5)
  bandaB2: number | null;
  bandaB4: number | null;
  bandaB8: number | null;
  bandaB12: number | null;
  ndvi: number | null;
  bsi: number | null;

  // Métricas de Série do Pré-Registro Proposto (N02d)
  compostoSoloNuB12: number | null;
  compostoSoloNuRazaoB4B2: number | null;
  taxaDegradacaoSwirAnual: number | null;
  ndviP90Serie: number | null;

  // Preditores Físicos da RUSLE (Física Informada / Data Fusion)
  fatorK: number | null;
  fatorR: number | null;
  fatorLS: number | null;

  // Alvo Supervisionado
  classeAlvoBinaria: 0 | 1;
  rotuloClasse: string;
  rotuloModalidade: string;
}

export interface ChaveCoordenadasPonto {
  pontoId: string;
  codigo: string;
  latitude: number;
  longitude: number;
}

export interface ResultadoMontagemMatriz {
  linhas: LinhaMatrizTreino[];
  chavesCoordenadas: ChaveCoordenadasPonto[];
  heldOutDrone: LinhaMatrizTreino[];
  totalPontosAvaliados: number;
  totalAmostrasTreino: number;
  distribuicaoClasses: Record<string, number>;
  distribuicaoBlocos: Record<string, number>;
  exclusoes: { codigo: string; motivo: string }[];
}

export interface OpcoesMontagemMatriz {
  modeloJanela?: "D" | "P"; // Janela Modelo D (detecção) vs Modelo P (predição com guarda temporal D04)
}

export function montarMatrizTreino(
  pontos: PontoAmostral[],
  rotulosConsolidados: Record<string, RotuloConsolidado>,
  opcoes: OpcoesMontagemMatriz = {}
): ResultadoMontagemMatriz {
  // 1. Guarda antissintético universal
  assegurarApenasPontosReais(pontos);

  const modeloJanela = opcoes.modeloJanela ?? "D";

  const linhas: LinhaMatrizTreino[] = [];
  const chaves: ChaveCoordenadasPonto[] = [];
  const heldOutDrone: LinhaMatrizTreino[] = [];
  const exclusoes: { codigo: string; motivo: string }[] = [];

  const distribuicaoClasses: Record<string, number> = {};
  const distribuicaoBlocos: Record<string, number> = {};

  for (const ponto of pontos) {
    const rotuloCons = rotulosConsolidados[ponto.codigo] ?? (ponto.rotulo as RotuloConsolidado | undefined);

    if (!rotuloCons) {
      exclusoes.push({ codigo: ponto.codigo, motivo: "Ponto sem rotulagem." });
      continue;
    }

    if (rotuloCons.divergencia === "pendente" || !rotuloCons.final) {
      exclusoes.push({
        codigo: ponto.codigo,
        motivo: "Divergência entre observadores sem desempate (final: null).",
      });
      continue;
    }

    const rotulo = rotuloCons.final;

    // Validação estrita do rótulo
    const validacaoRotulo = validarRotulo(rotulo);
    if (!validacaoRotulo.valido) {
      exclusoes.push({
        codigo: ponto.codigo,
        motivo: validacaoRotulo.motivo || "Rótulo com atributos inválidos.",
      });
      continue;
    }

    // Modalidade "campo" NUNCA vai ao treino do modelo D26 (D16: campo é âncora/confirmação)
    if (rotulo.modalidade === "campo") {
      exclusoes.push({
        codigo: ponto.codigo,
        motivo: "Modalidade 'campo' não integra o treino do modelo D26 (D16 / D03).",
      });
      continue;
    }

    if (rotulo.modalidade !== "drone") {
      exclusoes.push({
        codigo: ponto.codigo,
        motivo: "modalidade não prevista no treino D26",
      });
      continue;
    }

    // Modalidade "drone" exige papelConjunto definido pelo sorteio D16
    if (
      rotuloCons.papelConjunto !== "treino" &&
      rotuloCons.papelConjunto !== "held-out"
    ) {
      exclusoes.push({
        codigo: ponto.codigo,
        motivo: "Rótulo de drone com papelConjunto 'indisponivel' ou ausente no sorteio D16.",
      });
      continue;
    }

    const poligonoIdCandidato = ponto.poligonoId ?? (rotuloCons as any).poligonoId;
    if (
      !poligonoIdCandidato ||
      typeof poligonoIdCandidato !== "string" ||
      poligonoIdCandidato.trim() === ""
    ) {
      exclusoes.push({
        codigo: ponto.codigo,
        motivo: "Rótulo de drone sem poligonoId (código opaco do sorteio D16)",
      });
      continue;
    }
    const poligonoId = poligonoIdCandidato.trim();
    const papelConjunto: "treino" | "held-out" = rotuloCons.papelConjunto;

    // Binarização única e canônica (N02a e C09)
    let fracaoErodida: number | null = null;
    let alvoBinario25: 0 | 1 | null = null;
    let classeAlvoBinaria: 0 | 1 = 0;

    if (typeof rotulo.fracaoErodida === "number" && !isNaN(rotulo.fracaoErodida)) {
      try {
        fracaoErodida = rotulo.fracaoErodida;
        alvoBinario25 = binarizarFracao(fracaoErodida);
        classeAlvoBinaria = alvoBinario25;
      } catch (err: any) {
        exclusoes.push({ codigo: ponto.codigo, motivo: err.message });
        continue;
      }
    } else {
      try {
        classeAlvoBinaria = binarizarOrdinal(rotulo.classe);
        alvoBinario25 = classeAlvoBinaria;
      } catch (err: any) {
        exclusoes.push({ codigo: ponto.codigo, motivo: err.message });
        continue;
      }
    }

    // Isolar chaves de coordenadas fora da matriz de features
    chaves.push({
      pontoId: ponto.id,
      codigo: ponto.codigo,
      latitude: ponto.latitude,
      longitude: ponto.longitude,
    });

    const janelaTemporal = ponto.temporal?.[modeloJanela];

    const celulaId = ponto.celulaId ?? ponto.codigo ?? ponto.id;
    const estratoId = ponto.estratoId ?? "ESTRATO_INDEFINIDO";

    const rotuloNObservadores =
      rotuloCons.origens && rotuloCons.origens.length > 0
        ? rotuloCons.origens.length
        : rotuloCons.final
        ? 1
        : null;

    // Métricas de Composto de Solo Nu e Série Temporal (N02d)
    const compB12 =
      janelaTemporal?.serie?.compostoSoloNuB12 !== undefined
        ? valorOuNulo(janelaTemporal.serie.compostoSoloNuB12)
        : janelaTemporal?.serie?.compostoSoloNu?.["B12"] !== undefined
        ? valorOuNulo(janelaTemporal.serie.compostoSoloNu["B12"])
        : valorOuNulo(ponto.espectral?.b12);

    const compB4 =
      janelaTemporal?.serie?.compostoSoloNu?.["B4"] !== undefined
        ? valorOuNulo(janelaTemporal.serie.compostoSoloNu["B4"])
        : valorOuNulo(ponto.espectral?.b4);

    const compB2 =
      janelaTemporal?.serie?.compostoSoloNu?.["B2"] !== undefined
        ? valorOuNulo(janelaTemporal.serie.compostoSoloNu["B2"])
        : valorOuNulo(ponto.espectral?.b2);

    let compRazaoB4B2: number | null = null;
    if (janelaTemporal?.serie?.compostoSoloNuRazaoB4B2 !== undefined) {
      compRazaoB4B2 = valorOuNulo(janelaTemporal.serie.compostoSoloNuRazaoB4B2);
    } else if (typeof compB4 === "number" && typeof compB2 === "number" && compB2 > 0) {
      compRazaoB4B2 = Number((compB4 / compB2).toFixed(4));
    }

    const taxaDegradacaoSwirAnual = valorOuNulo(janelaTemporal?.serie?.taxaDegradacaoSwirAnual);
    const ndviP90Serie = valorOuNulo(janelaTemporal?.serie?.ndviP90Serie);
    const fatorLS = valorOuNulo(ponto.linhaDeBase?.fatorLS);

    const linha: LinhaMatrizTreino = {
      pontoId: ponto.id,
      celulaId,
      poligonoId,
      papelConjunto,
      estratoId,
      fracaoErodida,
      alvoBinario25,
      rotuloNObservadores,

      blocoEspacial: ponto.blocoEspacial ?? "BLOCO_INDEFINIDO",

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

      // Série Temporal e Chuva
      frequenciaSoloNu: valorOuNulo(janelaTemporal?.serie?.frequenciaSoloNu),
      precipAcum30d: valorOuNulo(janelaTemporal?.chuva?.precipAcum30d),
      precipAcum90d: valorOuNulo(janelaTemporal?.chuva?.precipAcum90d),
      i30Max: valorOuNulo(janelaTemporal?.chuva?.i30Max),
      nEventosErosivos: valorOuNulo(janelaTemporal?.chuva?.nEventosErosivos),
      indiceMecanismo: valorOuNulo(janelaTemporal?.chuva?.indiceMecanismo),

      // Bandas e Índices Espectrais (Mestrado PPGTCA 2026, Seção 5)
      bandaB2: valorOuNulo(ponto.espectral?.b2),
      bandaB4: valorOuNulo(ponto.espectral?.b4),
      bandaB8: valorOuNulo(ponto.espectral?.b8),
      bandaB12: valorOuNulo(ponto.espectral?.b12),
      ndvi: valorOuNulo(ponto.espectral?.ndvi),
      bsi: valorOuNulo(ponto.espectral?.bsi),

      // Métricas de Série do Pré-Registro Proposto (N02d)
      compostoSoloNuB12: compB12,
      compostoSoloNuRazaoB4B2: compRazaoB4B2,
      taxaDegradacaoSwirAnual,
      ndviP90Serie,

      // Preditores Físicos da RUSLE (Física Informada / Data Fusion)
      fatorK: valorOuNulo(ponto.linhaDeBase?.fatorK),
      fatorR: valorOuNulo(ponto.linhaDeBase?.fatorR),
      fatorLS,

      // Rótulo e Alvo
      classeAlvoBinaria,
      rotuloClasse: rotulo.classe,
      rotuloModalidade: rotulo.modalidade,
    };

    // Segregação D16: rótulo de drone vai para heldOutDrone se papelConjunto === "held-out"
    if (rotulo.modalidade === "drone" && papelConjunto === "held-out") {
      heldOutDrone.push(linha);
      continue;
    }

    linhas.push(linha);
    const contagemClasse = distribuicaoClasses[rotulo.classe];
    distribuicaoClasses[rotulo.classe] = typeof contagemClasse === "number" ? contagemClasse + 1 : 1;

    const idBloco = ponto.blocoEspacial ?? "BLOCO_INDEFINIDO";
    const contagemBloco = distribuicaoBlocos[idBloco];
    distribuicaoBlocos[idBloco] = typeof contagemBloco === "number" ? contagemBloco + 1 : 1;
  }

  // Pós-condição de segregação espacial entre treino e held-out por poligonoId (D16 / Regra 4)
  assegurarSegregacaoTreino(linhas, heldOutDrone);

  // Verificação de segurança: checar se algum campo proibido vazou
  for (const l of linhas) {
    for (const proibido of CAMPOS_PROIBIDOS_MATRIZ_TREINO) {
      if (proibido in l) {
        throw new Error(
          `VIOLAÇÃO DE INVARIANTE: O campo proibido '${proibido}' vazou na matriz de treino!`
        );
      }
    }
  }

  return {
    linhas,
    chavesCoordenadas: chaves,
    heldOutDrone,
    totalPontosAvaliados: pontos.length,
    totalAmostrasTreino: linhas.length,
    distribuicaoClasses,
    distribuicaoBlocos,
    exclusoes,
  };
}
