/**
 * ============================================================================
 * Montagem da Matriz de Treino — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * ESPECIFICAÇÃO MANDATÓRIA (PLANO V3, §12.4):
 * - Projeção estrita pelo perfil "matriz-treino" (§7.8) e conformidade com Invariante 2.
 * - Exclusões invioláveis em tempo de execução:
 *   1. phiDiag, quantilPhi, phi (critérios internos de ordenação amostral).
 *   2. estratoId (critério de estratificação).
 *   3. Fatores da RUSLE (R, K, LS, C, P) e perdaSolo.
 *   4. Coordenadas geográficas (isoladas no arquivo de chaves para evitar vazamento espacial).
 *   5. Dados fundiários/cadastrais (LGPD).
 *   6. Modalidade 'drone' (estritamente 'held-out', segregada em arquivo próprio).
 *   7. Divergências de rotulagem pendentes (final: null).
 * - Ausente = célula vazia / null (XGBoost trata nativamente ausência por direção de split).
 */

import { PontoAmostral } from "@/types/ponto";
import { RotuloConsolidado } from "@/types/rotulo";
import { valorOuNulo } from "@/types/proveniencia";
import { assegurarSegregacaoTreino } from "@/lib/rotulos/ingestaoDrone";
import { assegurarApenasPontosReais } from "@/lib/seguranca/guardaSintetico";
import { CAMPOS_PROIBIDOS_MATRIZ_TREINO } from "./invariantes";

export interface LinhaMatrizTreino {
  pontoId: string;
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

  // Rótulo Humano
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
  modeloJanela: "D" | "P"; // Janela Modelo D (detecção) vs Modelo P (predição com guarda temporal D04)
}

export function montarMatrizTreino(
  pontos: PontoAmostral[],
  rotulosConsolidados: Record<string, RotuloConsolidado>,
  opcoes: OpcoesMontagemMatriz
): ResultadoMontagemMatriz {
  // 1. Guarda antissintético universal
  assegurarApenasPontosReais(pontos);

  const linhas: LinhaMatrizTreino[] = [];
  const chaves: ChaveCoordenadasPonto[] = [];
  const heldOutDrone: LinhaMatrizTreino[] = [];
  const exclusoes: { codigo: string; motivo: string }[] = [];

  const distribuicaoClasses: Record<string, number> = {};
  const distribuicaoBlocos: Record<string, number> = {};

  for (const ponto of pontos) {
    const rotuloCons = rotulosConsolidados[ponto.codigo];

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

    // Isolar chaves de coordenadas fora da matriz de features
    chaves.push({
      pontoId: ponto.id,
      codigo: ponto.codigo,
      latitude: ponto.latitude,
      longitude: ponto.longitude,
    });

    const janelaTemporal = ponto.temporal?.[opcoes.modeloJanela];

    const linha: LinhaMatrizTreino = {
      pontoId: ponto.id,
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

      // Rótulo
      rotuloClasse: rotulo.classe,
      rotuloModalidade: rotulo.modalidade,
    };

    // Segregação estrita de Drone (held-out)
    if (rotulo.modalidade === "drone") {
      heldOutDrone.push(linha);
      continue;
    }

    // Garante que não é drone
    assegurarSegregacaoTreino(rotulo.modalidade);

    linhas.push(linha);
    const contagemClasse = distribuicaoClasses[rotulo.classe];
    distribuicaoClasses[rotulo.classe] = typeof contagemClasse === "number" ? contagemClasse + 1 : 1;

    const idBloco = ponto.blocoEspacial ?? "BLOCO_INDEFINIDO";
    const contagemBloco = distribuicaoBlocos[idBloco];
    distribuicaoBlocos[idBloco] = typeof contagemBloco === "number" ? contagemBloco + 1 : 1;
  }

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
