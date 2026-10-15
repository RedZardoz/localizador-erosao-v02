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

import crypto from "node:crypto";
import { execSync } from "node:child_process";
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
import { Proveniencia, indisponivel } from "@/types/proveniencia";
import { diagnosticarFronteiraPedologicaBbox } from "@/lib/embrapa/embrapaSoilClient";

export * from "./sorteioPoligonosTipos";
import {
  CandidatoSorteioD16,
  PoligonoSorteadoD16,
  SeloSorteioD16,
  RelatorioPreCondicoesD16,
  IdPreCondicaoSorteioD16,
  ErroPreCondicaoSorteioD16,
  CAMPOS_ESTRUTURAIS_PERMITIDOS_CANDIDATO,
  CAMPOS_RASTREIO_PROIBIDOS_SORTEIO,
  construirPoligono10Ha,
  verificarPreCondicoesSorteioD16,
} from "./sorteioPoligonosTipos";

export class ErroSeloNaoIgnoradoGit extends Error {
  constructor(caminho: string) {
    super(
      `[GRAVACAO_SELO_RECUSADA] O caminho '${caminho}' não está coberto pelo .gitignore. ` +
      "Gravar o selo D16 sem cobertura estrita do .gitignore exporia a tabela reversa de cegamento " +
      "no repositório (K2). A escrita do selo foi compulsoriamente abortada."
    );
    this.name = "ErroSeloNaoIgnoradoGit";
  }
}

/**
 * Verifica se um caminho de arquivo ou diretório está coberto pelo .gitignore do Git (K2).
 */
export function verificarCaminhoIgnoradoGit(caminhoArquivoOuDiretorio: string): boolean {
  try {
    const caminhoNormalizado = caminhoArquivoOuDiretorio.replace(/\\/g, "/");
    execSync(`git check-ignore -q "${caminhoNormalizado}"`, {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Assevera que o caminho de persistência do selo D16 está categoricamente ignorado pelo Git (K2).
 * Lança ErroSeloNaoIgnoradoGit caso o caminho não esteja coberto pelo .gitignore.
 */
export function asseverarCaminhoSeloIgnoradoGit(caminhoArquivoOuDiretorio: string): void {
  if (!verificarCaminhoIgnoradoGit(caminhoArquivoOuDiretorio)) {
    throw new ErroSeloNaoIgnoradoGit(caminhoArquivoOuDiretorio);
  }
}

/**
 * Gera um código opaco com entropia criptográfica segura (Z5/K1).
 */
export function gerarCodigoOpacoSorteio(): string {
  const bytes = crypto.randomBytes(5).toString("hex").toUpperCase();
  return `VANT-BLIND-${bytes}`;
}


/**
 * @deprecated Desenho antigo (36 polígonos de 10 ha). O desenho vigente de D16 emendada é de 72 polígonos de 5,02 ha (usar `sortear72PoligonosD16`).
 * Mantido para compatibilidade e testes existentes.
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
    geradorCodigoOpaco?: (idPoligono: string) => string;
  }
): SeloSorteioD16 {
  const {
    semente,
    gitCommit,
    sha256ConjuntoCandidatos,
    seloExistenteCaminho = null,
    geradoEm = new Date().toISOString(),
    geradorCodigoOpaco,
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

  const candidatosValidos = candidatos.filter(
    (c): c is CandidatoSorteioD16 & { declividadePct: number; frequenciaSoloNu: number } =>
      typeof c.declividadePct === "number" &&
      Number.isFinite(c.declividadePct) &&
      typeof c.frequenciaSoloNu === "number" &&
      Number.isFinite(c.frequenciaSoloNu)
  );
  const { limiaresS, limiaresE, estratosMap } = particionarCandidatosEm18Estratos(candidatosValidos);
  const prng = criarPrng(semente);

  const poligonos: PoligonoSorteadoD16[] = [];
  const tabelaCorrespondenciaOpaca: Record<string, string> = {};
  let seqPoligono = 1;

  for (const idEstrato of TODOS_ESTRATOS_D12) {
    // Ordena inicialmente por ID apenas para garantir independência da ordem de chegada na rede,
    // e em seguida aplica embaralhamento Fisher-Yates completo com a semente registrada
    const poolEstrato = [...estratosMap[idEstrato]].sort((a, b) =>
      String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0
    );
    const nCandidatosEstrato = poolEstrato.length;

    // Defesa em profundidade: guarda de sanidade no próprio sorteio
    if (nCandidatosEstrato < 4) {
      throw new Error(
        `[SORTEIO_D16_INVALIDO] Estrato '${idEstrato}' possui apenas ${nCandidatosEstrato} candidato(s) (mínimo absoluto exigido: 4 conforme D16 emendada).`
      );
    }

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

    if (pi_i <= 0 || pi_i > 1) {
      throw new Error(
        `[SORTEIO_D16_INVALIDO] Probabilidade de inclusão inválida pi_i=${pi_i} no estrato '${idEstrato}' (deve satisfazer 0 < pi_i <= 1).`
      );
    }

    for (let idxPar = 0; idxPar < 2; idxPar++) {
      const cand = parSorteado[idxPar];
      const papelConjunto = papeisPar[idxPar];
      const idPoligono = `D16-${String(seqPoligono).padStart(2, "0")}-${idEstrato}`;
      seqPoligono++;

      const codigoOpacoVant = geradorCodigoOpaco
        ? geradorCodigoOpaco(idPoligono)
        : gerarCodigoOpacoSorteio();
      tabelaCorrespondenciaOpaca[idPoligono] = codigoOpacoVant;

      poligonos.push({
        idPoligono,
        idCandidatoOrigem: cand.id,
        codigoOpacoVant,
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
        declividadePct: cand.declividadePct as number,
        frequenciaSoloNu: cand.frequenciaSoloNu as number,
        nivelK: cand.nivelK,
        kAmbiguoAssociacao: cand.kAmbiguoAssociacao as true | false | "indisponivel",
        ...(cand.kAmbiguoAssociacaoProveniencia
          ? { kAmbiguoAssociacaoProveniencia: cand.kAmbiguoAssociacaoProveniencia }
          : {}),
        unidadeDeterminanteK2024:
          cand.unidadeDeterminanteK2024 !== undefined ? cand.unidadeDeterminanteK2024 : null,
        classeWorldCover2020: cand.classeWorldCover2020 as number,
        classeWorldCover2021: cand.classeWorldCover2021 as number,
        pontoEmFronteiraPedologica:
          cand.pontoEmFronteiraPedologica ??
          indisponivel(
            "nao-calculado",
            "Diagnóstico de fronteira por bbox aguarda enriquecimento via diagnosticarFronteiraPoligonosSorteadosD16 (V2.1/V2.2)."
          ),
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
    versaoEsquema: "1.2.0",
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
    tabelaCorrespondenciaOpaca,
  };
}

/**
 * Computa o marcador `pontoEmFronteiraPedologica` por consulta com bbox (`WMS GetFeatureInfo` ~110 m)
 * especificamente para os 36 polígonos sorteados (PARTE III / V2.2).
 */
export async function diagnosticarFronteiraPoligonosSorteadosD16(
  poligonos: PoligonoSorteadoD16[],
  options: { timeoutMs?: number } = {}
): Promise<PoligonoSorteadoD16[]> {
  return Promise.all(
    poligonos.map(async (p) => {
      if (p.pontoEmFronteiraPedologica.estado !== "indisponivel") {
        return p;
      }
      const diag = await diagnosticarFronteiraPedologicaBbox(
        p.centroide.latitude,
        p.centroide.longitude,
        options
      );
      return {
        ...p,
        pontoEmFronteiraPedologica: diag.pontoEmFronteiraPedologica,
      };
    })
  );
}

/**
 * Constrói um polígono quadrado de 5,02 ha (lado = sqrt(50.200 m²) ≈ 224,053565 m)
 * centrado em `(latitude, longitude)`, conforme a emenda de D16 (29/09/2026, commit f5be525).
 */
export function construirPoligono502Ha(latitude: number, longitude: number): GeoJSON.Polygon {
  const LADO_METROS = Math.sqrt(50_200); // 224.05356502408078 m
  const MEIO_LADO_M = LADO_METROS / 2;
  const latRad = (latitude * Math.PI) / 180;
  const metrosPorGrauLat =
    111132.92 - 559.82 * Math.cos(2 * latRad) + 1.175 * Math.cos(4 * latRad);
  const metrosPorGrauLon =
    111412.84 * Math.cos(latRad) - 93.5 * Math.cos(3 * latRad);

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
 * Sorteia os 72 polígonos de 5,02 ha (4 por estrato sobre os 18 estratos de D12:
 * 2 `"treino"` e 2 `"held-out"` por estrato, com `pi_i = 4 / N_h` e `w_i = N_h / 4`),
 * conforme a emenda de D16 de 29/09/2026 (commit f5be525).
 */
export function sortear72PoligonosD16(
  candidatos: CandidatoSorteioD16[],
  opcoes: {
    semente: number;
    gitCommit: string;
    sha256ConjuntoCandidatos: string;
    seloExistenteCaminho?: string | null;
    geradoEm?: string;
    geradorCodigoOpaco?: (idPoligono: string) => string;
  }
): SeloSorteioD16 {
  const {
    semente,
    gitCommit,
    sha256ConjuntoCandidatos,
    seloExistenteCaminho = null,
    geradoEm = new Date().toISOString(),
    geradorCodigoOpaco,
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

  if (!gitCommit || typeof gitCommit !== "string" || gitCommit.trim() === "") {
    throw new Error("Opção 'gitCommit' é obrigatória no sorteio D16.");
  }

  if (
    !sha256ConjuntoCandidatos ||
    typeof sha256ConjuntoCandidatos !== "string" ||
    sha256ConjuntoCandidatos.trim() === ""
  ) {
    throw new Error("Opção 'sha256ConjuntoCandidatos' é obrigatória no sorteio D16.");
  }

  const relatorio = verificarPreCondicoesSorteioD16(candidatos, {
    seloExistenteCaminho,
    lancarErro: true,
  });

  for (const idEstrato of TODOS_ESTRATOS_D12) {
    const nEstrato = relatorio.contagemCandidatosPorEstrato[idEstrato];
    if (typeof nEstrato !== "number" || nEstrato < 4) {
      throw new ErroPreCondicaoSorteioD16(
        "minimo_4_candidatos_por_estrato",
        `O estrato '${idEstrato}' possui apenas ${nEstrato} candidato(s); a emenda de D16 (72 polígonos de 5,02 ha) exige mínimo de 4 candidatos por estrato.`
      );
    }
  }

  const candidatosValidos = candidatos.filter(
    (c): c is CandidatoSorteioD16 & { declividadePct: number; frequenciaSoloNu: number } =>
      typeof c.declividadePct === "number" &&
      Number.isFinite(c.declividadePct) &&
      typeof c.frequenciaSoloNu === "number" &&
      Number.isFinite(c.frequenciaSoloNu)
  );
  const particao = particionarCandidatosEm18Estratos(candidatosValidos);
  const prng = criarPrng(semente);
  const poligonos: PoligonoSorteadoD16[] = [];
  const tabelaCorrespondenciaOpaca: Record<string, string> = {};

  for (const idEstrato of TODOS_ESTRATOS_D12) {
    const listaOriginal = [...particao.estratosMap[idEstrato]].sort((a, b) =>
      String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0
    );
    const nH = listaOriginal.length;

    // Defesa em profundidade: guarda de sanidade no próprio sorteio independente da pré-condição
    if (nH < 4) {
      throw new Error(
        `[SORTEIO_72_INVALIDO] Estrato '${idEstrato}' possui apenas ${nH} candidato(s) no pool (mínimo absoluto exigido: 4 para amostragem 2+2 sem reposição).`
      );
    }

    const pi_i = 4 / nH;
    const w_i = nH / 4;

    // Asseverar 0 < pi_i <= 1 (invariante de amostragem)
    if (pi_i <= 0 || pi_i > 1) {
      throw new Error(
        `[SORTEIO_72_INVALIDO] Probabilidade de inclusão inválida pi_i=${pi_i} no estrato '${idEstrato}' (deve satisfazer 0 < pi_i <= 1).`
      );
    }

    // Fisher-Yates parcial para sortear 4 candidatos distintos sem reposição
    const pool = [...listaOriginal];
    if (pool.length < 4) {
      throw new Error(
        `[SORTEIO_72_INVALIDO] Pool insuficiente no estrato '${idEstrato}' para Fisher-Yates (${pool.length} < 4).`
      );
    }
    for (let i = 0; i < 4; i++) {
      const j = i + Math.floor(prng() * (pool.length - i));
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    const quarteto = pool.slice(0, 4);

    // Sorteia a designação de 2 "treino" e 2 "held-out" usando o próprio PRNG
    const papeis: Array<"treino" | "held-out"> = [
      "treino",
      "treino",
      "held-out",
      "held-out",
    ];
    for (let i = papeis.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      const tmp = papeis[i];
      papeis[i] = papeis[j];
      papeis[j] = tmp;
    }

    for (let k = 0; k < 4; k++) {
      const c = quarteto[k] as CandidatoSorteioD16 | undefined;
      if (!c) {
        throw new Error(
          `[SORTEIO_72_INVALIDO] Candidato sorteado no índice ${k} do estrato '${idEstrato}' é indefinido.`
        );
      }
      if (pi_i <= 0 || pi_i > 1) {
        throw new Error(`[SORTEIO_72_INVALIDO] pi_i fora do intervalo (0, 1]: ${pi_i}`);
      }
      const papel = papeis[k];
      const sufixoOrdem = String(k + 1).padStart(2, "0");
      const idPoligono = `D16_${idEstrato}_Q${sufixoOrdem}`;

      const codigoOpacoVant = geradorCodigoOpaco
        ? geradorCodigoOpaco(idPoligono)
        : gerarCodigoOpacoSorteio();
      tabelaCorrespondenciaOpaca[idPoligono] = codigoOpacoVant;

      poligonos.push({
        idPoligono,
        idCandidatoOrigem: String(c.id),
        codigoOpacoVant,
        estratoId: idEstrato,
        papelConjunto: papel,
        pi_i,
        w_i,
        nCandidatosEstrato: nH,
        centroide: {
          latitude: c.latitude,
          longitude: c.longitude,
        },
        areaHectares: 5.02,
        geometria: construirPoligono502Ha(c.latitude, c.longitude),
        declividadePct: c.declividadePct as number,
        frequenciaSoloNu: c.frequenciaSoloNu as number,
        nivelK: c.nivelK,
        kAmbiguoAssociacao: c.kAmbiguoAssociacao as true | false | "indisponivel",
        kAmbiguoAssociacaoProveniencia: c.kAmbiguoAssociacaoProveniencia,
        unidadeDeterminanteK2024: c.unidadeDeterminanteK2024 ?? null,
        classeWorldCover2020: Number(c.classeWorldCover2020),
        classeWorldCover2021: Number(c.classeWorldCover2021),
        pontoEmFronteiraPedologica:
          c.pontoEmFronteiraPedologica ??
          indisponivel(
            "sem-cobertura",
            "Marcador pontoEmFronteiraPedologica aguardando consulta WMS GetFeatureInfo com bbox (~110 m)."
          ),
      });
    }
  }

  // Hash determinístico estável sobre a lista ordenada de polígonos sorteados com seus pi_i e w_i
  // (rotina de 64 bits em JS puro com dois acumuladores de 32 bits; NÃO é criptográfica)
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
    versaoEsquema: "1.2.0",
    geradoEm,
    semente,
    politicaSemente: String(PARAMETROS.P07?.valor ?? "dinamica-registrada"),
    gitCommit,
    sha256ConjuntoCandidatos,
    hashIntegridade,
    totalCandidatosEntrada: candidatos.length,
    totalPoligonosSorteados: 72,
    totalTreino: 36,
    totalHeldOut: 36,
    areaTotalHectares: 361.44,
    limiaresS: relatorio.limiaresS,
    limiaresE: relatorio.limiaresE,
    contagemCandidatosPorEstrato: relatorio.contagemCandidatosPorEstrato,
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
    tabelaCorrespondenciaOpaca,
  };
}

