/**
 * ============================================================================
 * Motor Determinístico de Sorteio dos 72 Polígonos de VANT (5,02 ha) — D16 emendada
 * SAREL v2.0 — Decisões D07, D08, D12, D16 e D23 (PPGTCA 2026)
 * ============================================================================
 *
 * ROTINA VIGENTE: `sortear72PoligonosD16`. É a única rotina de sorteio deste módulo.
 * A rotina anterior (`sortearPoligonosDroneD16`, 36 polígonos de 10 ha com `pi_i = 2 / N_h`) foi
 * REMOVIDA em 02/11/2026 (achado N-02): mantida como código exportado, ela podia selar uma
 * probabilidade de inclusão incompatível com o desenho vigente, e o selo de D16 é irreversível por
 * construção. Sua cobertura de teste — idempotência do selo, estados de `kAmbiguoAssociacao`,
 * determinismo bit-a-bit e identidade de Horvitz-Thompson — foi portada para a rotina vigente.
 *
 * REGRAS E GARANTIAS METODOLÓGICAS:
 * 1. Reaproveita a partição canônica de `src/lib/gee/estratificacao.ts` (`particionarCandidatosEm18Estratos`
 *    e `criarPrng`), sem reimplementar tercis nem estratos.
 * 2. Sorteia exatamente 4 polígonos de 5,02 ha por estrato sobre os estratos de D12,
 *    totalizando 72 polígonos quando há 18 estratos ocupados.
 * 3. De cada quarteto em um estrato `h` com `N_h` candidatos:
 *    - A probabilidade de inclusão de cada polígono sorteado é registrada exatamente como `pi_i = 4 / N_h`,
 *      com peso de Horvitz-Thompson `w_i = N_h / 4`, tal que `pi_i * w_i = 1` (D23).
 *    - `N_h` é contagem de CANDIDATOS do estrato, não de hectares: `pi_i` NÃO é peso de área (ver D-02).
 *    - Dois polígonos são designados para `"treino"` e dois para `"held-out"`, sendo essa designação ela
 *      própria sorteada com o PRNG da semente registrada, NUNCA pela ordem em que os candidatos apareceram.
 * 4. Verifica rigorosamente as pré-condições antes de qualquer sorteio e recusa com erro tipado
 *    nomeando a pré-condição violada, inclusive `N_h >= 4` em todos os estratos.
 * 5. Idempotência estrita (D23): se qualquer selo anterior existir, recusa imediatamente sem sobrescrever
 *    nem versionar (`_v2`), protegendo os `pi_i` já selados.
 */

import fs from "node:fs";
import path from "node:path";
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
import { calcularHashDefinicao, CacheFrequenciaSoloNuArquivo } from "./amostragemSoloNuLote";

export * from "./sorteioPoligonosTipos";
import {
  CandidatoSorteioD16,
  PoligonoSorteadoD16,
  SeloSorteioD16,
  INVARIANTES_SELO_D16,
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
 * Computa o marcador `pontoEmFronteiraPedologica` por consulta com bbox (`WMS GetFeatureInfo` ~110 m)
 * especificamente para os polígonos sorteados por `sortear72PoligonosD16` (PARTE III / V2.2).
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

  const candidatosValidos = candidatos.filter(
    (c): c is CandidatoSorteioD16 & { declividadePct: number; frequenciaSoloNu: number } =>
      typeof c.declividadePct === "number" &&
      Number.isFinite(c.declividadePct) &&
      typeof c.frequenciaSoloNu === "number" &&
      Number.isFinite(c.frequenciaSoloNu)
  );
  const particao = particionarCandidatosEm18Estratos(
    candidatosValidos as unknown as (CandidatoSorteioD16 & CandidatoEstratificacao)[]
  );
  const prng = criarPrng(semente);
  const poligonos: PoligonoSorteadoD16[] = [];
  const tabelaCorrespondenciaOpaca: Record<string, string> = {};
  const estratosCenso: string[] = [];
  const estratosVazios: string[] = [];

  for (const idEstrato of TODOS_ESTRATOS_D12) {
    const listaOriginal = [...particao.estratosMap[idEstrato]].sort((a, b) =>
      String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0
    );
    const nH = listaOriginal.length;

    // Situação 1: N_h = 0 -> estrato vazio declarado; não contribui; registrado no selo com N_h = 0
    if (nH === 0) {
      estratosVazios.push(idEstrato);
      continue;
    }

    // Situação 2 e 3: N_h > 0
    let nAmostrados: number;
    let pi_i: number;
    let w_i: number;

    if (nH >= 4) {
      // N_h >= 4: sorteia 4; pi_i = 4 / N_h; w_i = N_h / 4
      nAmostrados = 4;
      pi_i = 4 / nH;
      w_i = nH / 4;
      if (nH === 4) {
        // Quando N_h = 4 e se sorteiam 4, pi_i = 1: estrato é censo, não amostra!
        estratosCenso.push(idEstrato);
      }
    } else {
      // 0 < N_h < 4: censo do estrato: toma todos os N_h; pi_i = 1; w_i = 1
      nAmostrados = nH;
      pi_i = 1;
      w_i = 1;
      estratosCenso.push(idEstrato);
    }

    // Asseverar preservação estrita de Horvitz-Thompson: pi_i * w_i = 1 (D23)
    const produto = pi_i * w_i;
    if (Math.abs(produto - 1) > 1e-9) {
      throw new Error(
        `[SORTEIO_INVALIDO] Violação de Horvitz-Thompson: pi_i * w_i = ${produto} != 1 no estrato '${idEstrato}'.`
      );
    }

    // Seleção dos candidatos
    let selecionados: CandidatoSorteioD16[];
    if (nH >= 4) {
      // Fisher-Yates parcial para sortear 4 candidatos distintos sem reposição
      const pool = [...listaOriginal];
      for (let i = 0; i < 4; i++) {
        const j = i + Math.floor(prng() * (pool.length - i));
        const tmp = pool[i];
        pool[i] = pool[j];
        pool[j] = tmp;
      }
      selecionados = pool.slice(0, 4);
    } else {
      // Censo: toma todos os nH candidatos disponíveis
      selecionados = [...listaOriginal];
    }

    // Sorteia a designação de papéis "treino" e "held-out" usando o próprio PRNG
    const nTreino = Math.ceil(nAmostrados / 2);
    const nHeldOut = nAmostrados - nTreino;
    const papeis: Array<"treino" | "held-out"> = [
      ...Array(nTreino).fill("treino"),
      ...Array(nHeldOut).fill("held-out"),
    ];
    for (let i = papeis.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      const tmp = papeis[i];
      papeis[i] = papeis[j];
      papeis[j] = tmp;
    }

    for (let k = 0; k < nAmostrados; k++) {
      const c = selecionados[k] as CandidatoSorteioD16;
      if (!c) {
        throw new Error(
          `[SORTEIO_INVALIDO] Candidato sorteado no índice ${k} do estrato '${idEstrato}' é indefinido.`
        );
      }
      if (pi_i <= 0 || pi_i > 1) {
        throw new Error(`[SORTEIO_INVALIDO] pi_i fora do intervalo (0, 1]: ${pi_i}`);
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
          latitude: c.latitude!,
          longitude: c.longitude!,
        },
        areaHectares: 5.02,
        geometria: construirPoligono502Ha(c.latitude!, c.longitude!),
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

  const totalSorteados = poligonos.length;
  const totalTreino = poligonos.filter((p) => p.papelConjunto === "treino").length;
  const totalHeldOut = poligonos.filter((p) => p.papelConjunto === "held-out").length;
  const areaTotalHectares = Number((totalSorteados * 5.02).toFixed(2));

  const invariantesVerificados = [...INVARIANTES_SELO_D16];

  const selo: SeloSorteioD16 = {
    versaoEsquema: "1.4.0",
    geradoEm,
    semente,
    politicaSemente: String(PARAMETROS.P07?.valor ?? "dinamica-registrada"),
    gitCommit,
    sha256ConjuntoCandidatos,
    hashIntegridade,
    totalCandidatosEntrada: candidatos.length,
    totalPoligonosSorteados: totalSorteados,
    totalTreino,
    totalHeldOut,
    areaTotalHectares,
    limiaresS: relatorio.limiaresS,
    limiaresE: relatorio.limiaresE,
    contagemCandidatosPorEstrato: relatorio.contagemCandidatosPorEstrato,
    estratosCenso,
    estratosVazios,
    invariantesVerificados,
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

  validarInvariantesSeloD16(selo);

  return selo;
}

/**
 * Validação rigorosa dos oito invariantes de integridade do selo de sorteio D16 (Prompt I).
 * Lança erro com prefixo [SELO_INVALIDO:<ID_INVARIANTE>] nomeando o invariante violado
 * e os valores observados.
 */
export function validarInvariantesSeloD16(selo: SeloSorteioD16): void {
  // 1. totalTreino + totalHeldOut === totalPoligonosSorteados
  if (selo.totalTreino + selo.totalHeldOut !== selo.totalPoligonosSorteados) {
    throw new Error(
      `[SELO_INVALIDO:INV_1_TOTAL_TREINO_HELDOUT] Invariante 1 violado: totalTreino (${selo.totalTreino}) + totalHeldOut (${selo.totalHeldOut}) = ${selo.totalTreino + selo.totalHeldOut} != totalPoligonosSorteados (${selo.totalPoligonosSorteados}).`
    );
  }

  // 2. areaTotalHectares === Number((totalPoligonosSorteados * 5.02).toFixed(2))
  const areaEsperada = Number((selo.totalPoligonosSorteados * 5.02).toFixed(2));
  if (selo.areaTotalHectares !== areaEsperada) {
    throw new Error(
      `[SELO_INVALIDO:INV_2_AREA_TOTAL] Invariante 2 violado: areaTotalHectares (${selo.areaTotalHectares}) != esperado (${areaEsperada}).`
    );
  }

  // 3. totalPoligonosSorteados === Σ_h n_h, somando os polígonos efetivamente alocados por estrato
  const nPorEstrato: Record<string, number> = {};
  for (const idEstrato of TODOS_ESTRATOS_D12) {
    nPorEstrato[idEstrato] = 0;
  }
  for (const p of selo.poligonos) {
    const atual = typeof nPorEstrato[p.estratoId] === "number" ? nPorEstrato[p.estratoId] : 0;
    nPorEstrato[p.estratoId] = atual + 1;
  }
  const somaNhAlocados = Object.values(nPorEstrato).reduce((a, b) => a + b, 0);
  if (selo.totalPoligonosSorteados !== somaNhAlocados) {
    throw new Error(
      `[SELO_INVALIDO:INV_3_SOMA_POLIGONOS_POR_ESTRATO] Invariante 3 violado: totalPoligonosSorteados (${selo.totalPoligonosSorteados}) != soma dos polígonos alocados por estrato (${somaNhAlocados}).`
    );
  }

  // 4. totalCandidatosEntrada === Σ_h N_h — os estratos particionam a entrada, sem perder nem duplicar candidato
  const somaNhPopulacao = Object.values(selo.contagemCandidatosPorEstrato).reduce((a, b) => a + b, 0);
  if (selo.totalCandidatosEntrada !== somaNhPopulacao) {
    throw new Error(
      `[SELO_INVALIDO:INV_4_PARTICAO_CANDIDATOS] Invariante 4 violado: totalCandidatosEntrada (${selo.totalCandidatosEntrada}) != soma de N_h por estrato (${somaNhPopulacao}).`
    );
  }

  // 5. nenhum Pixel_ID/identificador de polígono repetido no selo
  const idsPoligonoVistos = new Set<string>();
  for (const p of selo.poligonos) {
    if (idsPoligonoVistos.has(p.idPoligono)) {
      throw new Error(
        `[SELO_INVALIDO:INV_5_POLIGONOS_UNICOS] Invariante 5 violado: identificador de polígono duplicado no selo: '${p.idPoligono}'.`
      );
    }
    idsPoligonoVistos.add(p.idPoligono);
  }

  // 6. todo estrato listado em estratosCenso tem π_i === 1 em todos os seus polígonos
  const estratosCenso = Array.isArray(selo.estratosCenso) ? selo.estratosCenso : [];
  for (const idEstrato of estratosCenso) {
    const polis = selo.poligonos.filter((p) => p.estratoId === idEstrato);
    if (polis.length === 0) {
      throw new Error(
        `[SELO_INVALIDO:INV_6_CENSO_PI_1] Invariante 6 violado: estrato de censo '${idEstrato}' não possui polígonos alocados no selo.`
      );
    }
    for (const p of polis) {
      if (p.pi_i !== 1) {
        throw new Error(
          `[SELO_INVALIDO:INV_6_CENSO_PI_1] Invariante 6 violado: estrato de censo '${idEstrato}' possui polígono '${p.idPoligono}' com pi_i = ${p.pi_i} != 1.`
        );
      }
    }
  }

  // 7. todo estrato listado em estratosVazios tem N_h === 0 e zero polígonos alocados
  const estratosVazios = Array.isArray(selo.estratosVazios) ? selo.estratosVazios : [];
  for (const idEstrato of estratosVazios) {
    const nh =
      typeof selo.contagemCandidatosPorEstrato[idEstrato] === "number"
        ? selo.contagemCandidatosPorEstrato[idEstrato]
        : 0;
    const polis = selo.poligonos.filter((p) => p.estratoId === idEstrato);
    if (nh !== 0 || polis.length !== 0) {
      throw new Error(
        `[SELO_INVALIDO:INV_7_ESTRATO_VAZIO] Invariante 7 violado: estrato vazio '${idEstrato}' possui N_h = ${nh} (esperado: 0) e ${polis.length} polígonos alocados (esperado: 0).`
      );
    }
  }

  // 8. para todo polígono, π_i ∈ (0, 1] e π_i × w_i === 1 (com tolerância 1e-9)
  for (const p of selo.poligonos) {
    if (typeof p.pi_i !== "number" || p.pi_i <= 0 || p.pi_i > 1) {
      throw new Error(
        `[SELO_INVALIDO:INV_8_HORVITZ_THOMPSON] Invariante 8 violado: polígono '${p.idPoligono}' possui pi_i = ${p.pi_i} fora do domínio (0, 1].`
      );
    }
    const produto = p.pi_i * p.w_i;
    if (Math.abs(produto - 1) > 1e-9) {
      throw new Error(
        `[SELO_INVALIDO:INV_8_HORVITZ_THOMPSON] Invariante 8 violado: polígono '${p.idPoligono}' possui pi_i * w_i = ${produto} != 1 (tolerância 1e-9).`
      );
    }
  }
}

export interface OpcoesJuncaoCacheSoloNu {
  hashEsperado?: string;
}

/**
 * Realiza a junção fail-closed entre candidatos e as medições de frequência de solo nu (Ê)
 * persistidas no cache da máscara GEOS3 (Prompt K).
 *
 * Compartilhada estritamente entre a execução do CLI e a suíte de testes.
 */
export function juntarCandidatosComCacheSoloNu(
  candidatos: unknown[],
  cacheOuCaminho: string | CacheFrequenciaSoloNuArquivo | any,
  opcoes: OpcoesJuncaoCacheSoloNu = {}
): CandidatoSorteioD16[] {
  let cacheObj: any;

  if (typeof cacheOuCaminho === "string") {
    const absPath = path.isAbsolute(cacheOuCaminho)
      ? cacheOuCaminho
      : path.resolve(process.cwd(), cacheOuCaminho);
    if (!fs.existsSync(absPath)) {
      throw new Error(
        `[ERRO_JUNCAO_E] Arquivo de cache de frequência de solo nu não encontrado: ${absPath}`
      );
    }
    try {
      cacheObj = JSON.parse(fs.readFileSync(absPath, "utf-8"));
    } catch (err: any) {
      throw new Error(
        `[ERRO_JUNCAO_E] Falha ao ler ou parsear o arquivo de cache '${absPath}': ${err.message}`
      );
    }
  } else if (typeof cacheOuCaminho === "object" && cacheOuCaminho !== null) {
    cacheObj = cacheOuCaminho;
  } else {
    throw new Error(
      "[ERRO_JUNCAO_E] Argumento de cache inválido (esperado caminho em string ou objeto de cache)."
    );
  }

  if (!cacheObj || typeof cacheObj !== "object" || !cacheObj.itens || typeof cacheObj.itens !== "object") {
    throw new Error(
      "[ERRO_JUNCAO_E] Arquivo de cache inválido ou sem a propriedade 'itens'."
    );
  }

  const hashEsperado = opcoes.hashEsperado !== undefined ? opcoes.hashEsperado : calcularHashDefinicao();
  const hashCache = typeof cacheObj.hashDefinicao === "string" ? cacheObj.hashDefinicao : "";
  if (hashCache !== hashEsperado) {
    throw new Error(
      `[ERRO_JUNCAO_E] O hash da definição da máscara GEOS3 no cache ('${hashCache}') diverge do hash corrente ('${hashEsperado}'). Cache de outra definição não pode alimentar o sorteio.`
    );
  }

  if (!Array.isArray(candidatos) || candidatos.length === 0) {
    throw new Error(
      "[ERRO_JUNCAO_E] Lista de candidatos de entrada inválida ou vazia (0 candidatos recebidos para junção)."
    );
  }

  const mapaCache = new Map<string, any>();
  for (const item of Object.values(cacheObj.itens) as any[]) {
    if (item && item.id) {
      mapaCache.set(String(item.id), item);
    }
  }

  const faltantes: string[] = [];
  for (const cand of candidatos as any[]) {
    const idStr = String(cand.id);
    const med = mapaCache.get(idStr);
    if (!med || !med.frequenciaSoloNu || typeof med.frequenciaSoloNu.valor !== "number") {
      faltantes.push(idStr);
    }
  }

  if (faltantes.length > 0) {
    const exemplos = faltantes.slice(0, 5).join(", ");
    throw new Error(
      `[ERRO_JUNCAO_E] ${faltantes.length} de ${candidatos.length} candidato(s) não possuem medição válida de frequência de solo nu no cache. Primeiros IDs ausentes: ${exemplos}.`
    );
  }

  const poolReal: CandidatoSorteioD16[] = [];
  for (const cand of candidatos as any[]) {
    const med = mapaCache.get(String(cand.id))!;
    const wc2020 =
      typeof cand.classeWorldCover2020 === "number" && [30, 40].includes(cand.classeWorldCover2020)
        ? cand.classeWorldCover2020
        : 40;
    const wc2021 =
      typeof cand.classeWorldCover2021 === "number" && [30, 40].includes(cand.classeWorldCover2021)
        ? cand.classeWorldCover2021
        : 40;
    const kAmbiguo =
      typeof cand.kAmbiguoAssociacao === "boolean"
        ? cand.kAmbiguoAssociacao
        : false;

    poolReal.push({
      id: cand.id,
      latitude: cand.latitude,
      longitude: cand.longitude,
      declividadePct: cand.declividadePct,
      frequenciaSoloNu: med.frequenciaSoloNu.valor,
      nivelK: cand.nivelK,
      classeWorldCover2020: wc2020,
      classeWorldCover2021: wc2021,
      kAmbiguoAssociacao: kAmbiguo,
      provenienciaE: med.frequenciaSoloNu,
    });
  }

  if (poolReal.length === 0) {
    throw new Error(
      "[ERRO_JUNCAO_E] A contagem total de candidatos válidos com Ê após a junção é zero."
    );
  }

  return poolReal;
}


