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
  celulaId: string | null; // produtor pendente (DP-18)
  poligonoId: string;
  papelConjunto: "treino" | "held-out";
  estratoId: string | null; // populado de ponto.estratoId; a COLUNA passou a existir em A-05

  /**
   * A-05 — chaves de desenho vindas do selo D16, por junção em `poligonoId`.
   *
   * São `null` quando a montagem roda sem selo. Isso é estado declarado, não preenchimento: a
   * exigência estrita destas chaves pertence ao modo probatório do D25 (A-06), não ao esquema.
   *
   * `pi_i` é probabilidade de inclusão do POLÍGONO no seu estrato, `n_h/N_h`, com `N_h` em número
   * de CANDIDATOS — não em hectares. NÃO é peso de área (achado D-02).
   */
  pi_i: number | null;
  w_i: number | null;
  nCandidatosEstrato: number | null;

  // A-05 / T-02 — cobertura e identidade de pixel, do CSV de D26
  incluida: boolean | null;
  coberturaCelula: number | null;
  areaDelineadaM2: number | null;
  pixelId: string | null;

  // A-05 / V-01 — qual modelo e qual janela produziram esta linha
  modelo: "D" | "P";
  dataReferencia: string | null;
  fimJanela: string | null;

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

  /**
   * A-05 — selo de sorteio D16, fonte AUTORITATIVA de `Estrato_ID`, `Pi_i`, `W_i` e
   * `N_Candidatos_Estrato`. A junção é por `idPoligono`.
   *
   * Por que junção e não campo do ponto: `pi_i` é produto do ato probabilístico e o selo é
   * irreversível por construção (D23). Lê-lo do selo impede que um campo editável no ponto
   * divirja da probabilidade efetivamente selada.
   *
   * Opcional porque nenhum voo foi selado ainda. Quando fornecido, polígono ausente do selo é
   * EXCLUÍDO com motivo — não recebe `pi_i` inventado (Regra 1).
   *
   * NOTA DE DESENHO (A-05): nada aqui conhece o número de estratos, de polígonos ou de held-out.
   * Essa cardinalidade é do selo e da verificação de A-06; o contrato valida estrutura, não contagem.
   */
  seloD16?: {
    poligonos: Array<{
      idPoligono: string;
      estratoId: string;
      pi_i: number;
      w_i: number;
      nCandidatosEstrato: number;
    }>;
  };

  /** Data de referência do modelo (t0). Sem ela, deriva-se de `rotulo.observadoEm`. */
  dataReferencia?: string;

  /**
   * A-05 / T-02 — exige a delineação de D26 em toda célula, excluindo as que não a têm.
   *
   * Default `false` porque nenhum voo foi selado: com `true` hoje, a matriz sairia vazia. A
   * exigência estrita pertence ao modo probatório do D25 (A-06), que é onde a matriz incompleta
   * tem de deixar de ser aceita. Aqui ela é opção declarada, para que a campanha possa ativá-la
   * assim que o primeiro CSV de D26 existir.
   *
   * O filtro de COBERTURA (P11) não é aplicado nem aqui nem na exportação: `Incluida` viaja como
   * coluna e o filtro é do D25, porque o limiar é decisão pendente (G-06).
   */
  exigirDelineacaoD26?: boolean;
}

export function montarMatrizTreino(
  pontos: PontoAmostral[],
  rotulosConsolidados: Record<string, RotuloConsolidado>,
  opcoes: OpcoesMontagemMatriz = {}
): ResultadoMontagemMatriz {
  // 1. Guarda antissintético universal
  assegurarApenasPontosReais(pontos);

  const modeloJanela = opcoes.modeloJanela ?? "D";

  // A-05: indice do selo D16 por idPoligono. Fonte autoritativa de pi_i, w_i e N_h.
  const indiceSelo = opcoes.seloD16
    ? new Map(opcoes.seloD16.poligonos.map((p) => [p.idPoligono, p]))
    : null;

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

    // A-08 / Regra 1: ponto sem bloco espacial NAO entra na matriz. O sentinela
    // "BLOCO_INDEFINIDO" que aqui existia virava um grupo real no GroupKFold de D24, misturando
    // pontos sem relacao espacial num mesmo agrupamento de validacao. Ausencia e exclusao, nao rotulo.
    const blocoEspacialCandidato = ponto.blocoEspacial;
    if (
      !blocoEspacialCandidato ||
      typeof blocoEspacialCandidato !== "string" ||
      blocoEspacialCandidato.trim() === ""
    ) {
      exclusoes.push({
        codigo: ponto.codigo,
        motivo:
          "Ponto sem bloco espacial definido: nao pode entrar na matriz, porque o bloco e a unidade de agrupamento da validacao (D24).",
      });
      continue;
    }
    const blocoEspacial = blocoEspacialCandidato.trim();

    // A-05: junção com o selo D16. Quando o selo é fornecido, polígono ausente dele é EXCLUÍDO:
    // uma linha sem pi_i não pode receber um valor inventado nem herdar o de outro estrato.
    const registroSelo = indiceSelo ? indiceSelo.get(poligonoId) ?? null : null;
    if (indiceSelo && !registroSelo) {
      exclusoes.push({
        codigo: ponto.codigo,
        motivo: `Polígono '${poligonoId}' não consta do selo D16 fornecido: sem probabilidade de inclusão selada, a linha não entra na matriz (D23 / Regra 1).`,
      });
      continue;
    }


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

    const celulaId = ponto.celulaId ?? null;
    const estratoId = ponto.estratoId ?? null;
    // A-05: quando o selo traz o estrato, ele prevalece sobre o campo do ponto, que é editável.
    const estratoIdEfetivo = registroSelo ? registroSelo.estratoId : estratoId;
    const delineacao = ponto.delineacaoD26 ?? null;
    if (opcoes.exigirDelineacaoD26 && !delineacao) {
      exclusoes.push({
        codigo: ponto.codigo,
        motivo:
          "Célula sem correspondência no CSV de delineação de D26: sem cobertura e sem Pixel_ID, " +
          "as guardas de cobertura e de pixel disjunto do D25 não têm insumo (T-02).",
      });
      continue;
    }
    const dataReferenciaEfetiva = opcoes.dataReferencia ?? rotulo.observadoEm ?? null;

    const rotuloNObservadores =
      rotuloCons.origens && rotuloCons.origens.length > 0
        ? rotuloCons.origens.length
        : rotuloCons.final
        ? 1
        : null;

    // Métricas de Composto de Solo Nu e Série Temporal (N02d / N02-fix2)
    // As métricas de composto de solo nu vêm SOMENTE do composto multitemporal de série.
    // Sem composto -> null. NUNCA utilizar bandas espectrais de data única como fallback.
    const compB12 =
      janelaTemporal?.serie?.compostoSoloNuB12 !== undefined
        ? valorOuNulo(janelaTemporal.serie.compostoSoloNuB12)
        : janelaTemporal?.serie?.compostoSoloNu?.["B12"] !== undefined
        ? valorOuNulo(janelaTemporal.serie.compostoSoloNu["B12"])
        : null;

    const compB4 =
      janelaTemporal?.serie?.compostoSoloNu?.["B4"] !== undefined
        ? valorOuNulo(janelaTemporal.serie.compostoSoloNu["B4"])
        : null;

    const compB2 =
      janelaTemporal?.serie?.compostoSoloNu?.["B2"] !== undefined
        ? valorOuNulo(janelaTemporal.serie.compostoSoloNu["B2"])
        : null;

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
      estratoId: estratoIdEfetivo,

      // A-05 — chaves do desenho (selo D16)
      pi_i: registroSelo ? registroSelo.pi_i : null,
      w_i: registroSelo ? registroSelo.w_i : null,
      nCandidatosEstrato: registroSelo ? registroSelo.nCandidatosEstrato : null,

      // A-05 / T-02 — cobertura e pixel (CSV de D26)
      incluida: delineacao ? delineacao.incluida : null,
      coberturaCelula: delineacao ? delineacao.coberturaCelula : null,
      areaDelineadaM2: delineacao ? delineacao.areaDelineadaM2 : null,
      pixelId: delineacao ? delineacao.pixelId : null,

      // A-05 / V-01 — modelo e janela
      modelo: modeloJanela,
      dataReferencia: dataReferenciaEfetiva,
      fimJanela: janelaTemporal?.janela?.fim ?? null,
      fracaoErodida,
      alvoBinario25,
      rotuloNObservadores,

      blocoEspacial,

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

    const idBloco = blocoEspacial;
    const contagemBloco = distribuicaoBlocos[idBloco];
    distribuicaoBlocos[idBloco] = typeof contagemBloco === "number" ? contagemBloco + 1 : 1;
  }

  // Pós-condição de segregação espacial entre treino e held-out por poligonoId (D16 / Regra 4)
  assegurarSegregacaoTreino(linhas, heldOutDrone);

  // Verificação de segurança: checar se algum campo proibido vazou
  for (const l of [...linhas, ...heldOutDrone]) {
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
