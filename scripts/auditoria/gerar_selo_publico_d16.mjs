#!/usr/bin/env node
/**
 * scripts/auditoria/gerar_selo_publico_d16.mjs
 *
 * SAREL v2.0 — Gerador de Selo Público Redigido do Sorteio D16 (Prompt L)
 *
 * Separa os dois papéis do selo:
 * 1. Selo completo (docs/verificacoes/sorteio/sorteio_d16_*.json):
 *    contém as coordenadas, geometrias, identificadores e a tabela reversa do
 *    cegamento (VANT-BLIND-*). Fica sob .gitignore por força da guarda K2.
 * 2. Selo público redigido (docs/verificacoes/selo_publico_d16_*.json):
 *    versionado no Git, agrega os 18 estratos, preserva todos os totais,
 *    limiares, invariantes e o hash SHA-256 do arquivo do selo completo,
 *    sem identificar qualquer polígono individual.
 *
 * REGRAS METODOLÓGICAS:
 * - Recusa compulsoriamente se não houver selo completo, se houver múltiplos selos,
 *   ou se o selo completo não validar nos 8 invariantes de integridade (Prompt I).
 * - Assegura via 'git check-ignore' que o destino NÃO está ignorado pelo Git.
 * - É 100% idempotente (não gera timestamps novos, usa geradoEm do selo completo).
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "../..");
export const DIR_SORTEIO = path.join(REPO_ROOT, "docs", "verificacoes", "sorteio");
export const DIR_VERIFICACOES = path.join(REPO_ROOT, "docs", "verificacoes");

export const TODOS_ESTRATOS_D12 = [
  "E_1_1_1", "E_1_1_2", "E_1_2_1", "E_1_2_2", "E_1_3_1", "E_1_3_2",
  "E_2_1_1", "E_2_1_2", "E_2_2_1", "E_2_2_2", "E_2_3_1", "E_2_3_2",
  "E_3_1_1", "E_3_1_2", "E_3_2_1", "E_3_2_2", "E_3_3_1", "E_3_3_2",
];

export const DECLARACAO_NATUREZA =
  "Este e um documento DERIVADO, redigido, do selo de sorteio D16. NAO e um sorteio, NAO confere probabilidades de inclusao e NAO substitui o selo completo para fins de execucao. O selo completo permanece fora do controle de versao pela guarda K2 (cegamento duplo da campanha de campo) e pode ser liberado apos o encerramento da campanha.";

export const CHAVES_PROIBIDAS_CEGAMENTO = [
  "idPoligono",
  "idCandidatoOrigem",
  "codigoOpacoVant",
  "centroide",
  "geometria",
  "declividadePct",
  "frequenciaSoloNu",
  "nivelK",
  "kAmbiguoAssociacao",
  "unidadeDeterminanteK2024",
  "poligonos",
  "tabelaCorrespondenciaOpaca",
  "pontoEmFronteiraPedologica",
  "classeWorldCover2020",
  "classeWorldCover2021",
];

/**
 * Validação rigorosa dos oito invariantes sobre o objeto de selo completo.
 */
export function validarInvariantesSeloCompleto(selo) {
  if (!selo || typeof selo !== "object") {
    throw new Error("[SELO_INVALIDO] Objeto de selo nulo ou inválido.");
  }

  // 1. totalTreino + totalHeldOut === totalPoligonosSorteados
  if (selo.totalTreino + selo.totalHeldOut !== selo.totalPoligonosSorteados) {
    throw new Error(
      `[SELO_INVALIDO:INV_1_TOTAL_TREINO_HELDOUT] Invariante 1 violado: totalTreino (${selo.totalTreino}) + totalHeldOut (${selo.totalHeldOut}) != totalPoligonosSorteados (${selo.totalPoligonosSorteados}).`
    );
  }

  // 2. areaTotalHectares === Number((totalPoligonosSorteados * 5.02).toFixed(2))
  const areaEsperada = Number((selo.totalPoligonosSorteados * 5.02).toFixed(2));
  if (selo.areaTotalHectares !== areaEsperada) {
    throw new Error(
      `[SELO_INVALIDO:INV_2_AREA_TOTAL] Invariante 2 violado: areaTotalHectares (${selo.areaTotalHectares}) != esperado (${areaEsperada}).`
    );
  }

  // 3. totalPoligonosSorteados === Σ_h n_h
  const nPorEstrato = {};
  for (const idEstrato of TODOS_ESTRATOS_D12) {
    nPorEstrato[idEstrato] = 0;
  }
  for (const p of Array.isArray(selo.poligonos) ? selo.poligonos : []) {
    const contagemAtual = typeof nPorEstrato[p.estratoId] === "number" ? nPorEstrato[p.estratoId] : 0;
    nPorEstrato[p.estratoId] = contagemAtual + 1;
  }
  const somaNhAlocados = Object.values(nPorEstrato).reduce((a, b) => a + b, 0);
  if (selo.totalPoligonosSorteados !== somaNhAlocados) {
    throw new Error(
      `[SELO_INVALIDO:INV_3_SOMA_POLIGONOS_POR_ESTRATO] Invariante 3 violado: totalPoligonosSorteados (${selo.totalPoligonosSorteados}) != soma dos polígonos alocados (${somaNhAlocados}).`
    );
  }

  // 4. totalCandidatosEntrada === Σ_h N_h
  const somaNhPopulacao = Object.values(selo.contagemCandidatosPorEstrato || {}).reduce((a, b) => a + b, 0);
  if (selo.totalCandidatosEntrada !== somaNhPopulacao) {
    throw new Error(
      `[SELO_INVALIDO:INV_4_PARTICAO_CANDIDATOS] Invariante 4 violado: totalCandidatosEntrada (${selo.totalCandidatosEntrada}) != soma de N_h (${somaNhPopulacao}).`
    );
  }

  // 5. nenhum idPoligono duplicado
  const idsVistos = new Set();
  for (const p of selo.poligonos || []) {
    if (idsVistos.has(p.idPoligono)) {
      throw new Error(
        `[SELO_INVALIDO:INV_5_POLIGONOS_UNICOS] Invariante 5 violado: id duplicado '${p.idPoligono}'.`
      );
    }
    idsVistos.add(p.idPoligono);
  }

  // 6. estratosCenso tem pi_i === 1 em todos os polígonos
  const estratosCenso = Array.isArray(selo.estratosCenso) ? selo.estratosCenso : [];
  for (const idEstrato of estratosCenso) {
    const polis = (selo.poligonos || []).filter((p) => p.estratoId === idEstrato);
    if (polis.length === 0) {
      throw new Error(
        `[SELO_INVALIDO:INV_6_CENSO_PI_1] Invariante 6 violado: estrato censo '${idEstrato}' sem polígonos.`
      );
    }
    for (const p of polis) {
      if (p.pi_i !== 1) {
        throw new Error(
          `[SELO_INVALIDO:INV_6_CENSO_PI_1] Invariante 6 violado: estrato censo '${idEstrato}' com pi_i=${p.pi_i} != 1.`
        );
      }
    }
  }

  // 7. estratosVazios tem N_h === 0 e zero polígonos
  const estratosVazios = Array.isArray(selo.estratosVazios) ? selo.estratosVazios : [];
  for (const idEstrato of estratosVazios) {
    const nh =
      selo.contagemCandidatosPorEstrato && typeof selo.contagemCandidatosPorEstrato[idEstrato] === "number"
        ? selo.contagemCandidatosPorEstrato[idEstrato]
        : 0;
    const polis = (selo.poligonos || []).filter((p) => p.estratoId === idEstrato);
    if (nh !== 0 || polis.length !== 0) {
      throw new Error(
        `[SELO_INVALIDO:INV_7_ESTRATO_VAZIO] Invariante 7 violado: estrato vazio '${idEstrato}' com Nh=${nh}, n=${polis.length}.`
      );
    }
  }

  // 8. identidade de Horvitz-Thompson: pi_i in (0, 1] e |pi_i * w_i - 1| <= 1e-9
  for (const p of selo.poligonos || []) {
    if (p.pi_i <= 0 || p.pi_i > 1 || Math.abs(p.pi_i * p.w_i - 1) > 1e-9) {
      throw new Error(
        `[SELO_INVALIDO:INV_8_HORVITZ_THOMPSON] Invariante 8 violado: polígono '${p.idPoligono}' com pi_i=${p.pi_i}, w_i=${p.w_i}.`
      );
    }
  }
}

/**
 * Constrói o selo público redigido a partir do selo completo e de seu hash de arquivo.
 */
export function construirSeloPublico(seloCompleto, sha256SeloCompleto) {
  validarInvariantesSeloCompleto(seloCompleto);

  const estratosPublicos = TODOS_ESTRATOS_D12.map((estratoId) => {
    const nCandidatos =
      seloCompleto.contagemCandidatosPorEstrato &&
      typeof seloCompleto.contagemCandidatosPorEstrato[estratoId] === "number"
        ? seloCompleto.contagemCandidatosPorEstrato[estratoId]
        : 0;
    const polsEstrato = (seloCompleto.poligonos || []).filter((p) => p.estratoId === estratoId);
    const nSorteados = polsEstrato.length;
    const nTreino = polsEstrato.filter((p) => p.papelConjunto === "treino").length;
    const nHeldOut = polsEstrato.filter((p) => p.papelConjunto === "held-out").length;

    const pi_i = nSorteados > 0 ? polsEstrato[0].pi_i : null;
    const w_i = nSorteados > 0 ? polsEstrato[0].w_i : null;

    let regime;
    if (nSorteados === 0 || nCandidatos === 0 || (seloCompleto.estratosVazios || []).includes(estratoId)) {
      regime = "vazio";
    } else if (nCandidatos <= 4 || (seloCompleto.estratosCenso || []).includes(estratoId)) {
      regime = "censo";
    } else {
      regime = "amostra";
    }

    const areaHectares = Number((nSorteados * 5.02).toFixed(2));

    return {
      estratoId,
      nCandidatos,
      nSorteados,
      pi_i,
      w_i,
      regime,
      nTreino,
      nHeldOut,
      areaHectares,
    };
  });

  return {
    versaoEsquema: seloCompleto.versaoEsquema,
    geradoEm: seloCompleto.geradoEm,
    semente: seloCompleto.semente,
    politicaSemente: seloCompleto.politicaSemente,
    gitCommit: seloCompleto.gitCommit,
    sha256ConjuntoCandidatos: seloCompleto.sha256ConjuntoCandidatos,
    hashIntegridade: seloCompleto.hashIntegridade,
    totalCandidatosEntrada: seloCompleto.totalCandidatosEntrada,
    totalPoligonosSorteados: seloCompleto.totalPoligonosSorteados,
    totalTreino: seloCompleto.totalTreino,
    totalHeldOut: seloCompleto.totalHeldOut,
    areaTotalHectares: seloCompleto.areaTotalHectares,
    limiaresS: seloCompleto.limiaresS,
    limiaresE: seloCompleto.limiaresE,
    contagemCandidatosPorEstrato: seloCompleto.contagemCandidatosPorEstrato,
    estratosCenso: Array.isArray(seloCompleto.estratosCenso) ? seloCompleto.estratosCenso : [],
    estratosVazios: Array.isArray(seloCompleto.estratosVazios) ? seloCompleto.estratosVazios : [],
    invariantesVerificados: Array.isArray(seloCompleto.invariantesVerificados)
      ? seloCompleto.invariantesVerificados
      : [],
    decisoesVigentes: seloCompleto.decisoesVigentes,
    sha256SeloCompleto,
    declaracaoNatureza: DECLARACAO_NATUREZA,
    estratos: estratosPublicos,
  };
}

/**
 * Localiza o selo completo em docs/verificacoes/sorteio/
 */
export function localizarSeloCompleto(dirSorteio = DIR_SORTEIO) {
  if (!fs.existsSync(dirSorteio)) {
    return { arquivos: [] };
  }
  const arquivos = fs
    .readdirSync(dirSorteio)
    .filter((f) => f.startsWith("sorteio_d16_") && f.endsWith(".json"))
    .map((f) => path.join(dirSorteio, f));
  return { arquivos };
}

/**
 * Assevera que um arquivo NÃO está ignorado pelo Git (regra K2 inversa).
 */
export function verificarCaminhoNaoIgnoradoGit(caminhoArquivo, repoRoot = REPO_ROOT) {
  const caminhoRelativo = path.relative(repoRoot, caminhoArquivo).replace(/\\/g, "/");
  try {
    execSync(`git check-ignore -q "${caminhoRelativo}"`, {
      cwd: repoRoot,
      stdio: "ignore",
    });
    // Se o comando saiu com 0, o arquivo ESTÁ ignorado!
    return false;
  } catch {
    // Se saiu com != 0 (normalmente 1), o arquivo NÃO está ignorado!
    return true;
  }
}

/**
 * Ponto de entrada CLI
 */
export async function principal() {
  const args = process.argv.slice(2);
  let caminhoSeloCustom = null;
  let caminhoSaidaCustom = null;
  let apenasVerificar = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--selo" && i + 1 < args.length) {
      caminhoSeloCustom = args[++i];
    } else if (args[i] === "--saida" && i + 1 < args.length) {
      caminhoSaidaCustom = args[++i];
    } else if (args[i] === "--verificar") {
      apenasVerificar = true;
    }
  }

  let caminhoSeloCompleto = caminhoSeloCustom;
  if (!caminhoSeloCompleto) {
    const loc = localizarSeloCompleto(DIR_SORTEIO);
    if (loc.arquivos.length === 0) {
      console.error("[ERRO:SELO_AUSENTE] Nenhum selo de sorteio D16 encontrado em docs/verificacoes/sorteio/.");
      process.exit(1);
    }
    if (loc.arquivos.length > 1) {
      console.error(
        `[ERRO:SELO_MULTIPLO] Múltiplos selos encontrados em docs/verificacoes/sorteio/: ${loc.arquivos
          .map((f) => path.basename(f))
          .join(", ")}.`
      );
      process.exit(1);
    }
    caminhoSeloCompleto = loc.arquivos[0];
  }

  const caminhoAbsSelo = path.isAbsolute(caminhoSeloCompleto)
    ? caminhoSeloCompleto
    : path.resolve(REPO_ROOT, caminhoSeloCompleto);

  if (!fs.existsSync(caminhoAbsSelo)) {
    console.error(`[ERRO:ARQUIVO_INEXISTENTE] Selo completo não encontrado: ${caminhoAbsSelo}`);
    process.exit(1);
  }

  const rawSeloCompleto = fs.readFileSync(caminhoAbsSelo);
  let seloCompleto;
  try {
    seloCompleto = JSON.parse(rawSeloCompleto.toString("utf8"));
  } catch (err) {
    console.error(`[ERRO:JSON_CORROMPIDO] Falha ao fazer parse do selo completo: ${err.message}`);
    process.exit(1);
  }

  // Validação dos 8 invariantes sobre o selo completo
  try {
    validarInvariantesSeloCompleto(seloCompleto);
  } catch (err) {
    console.error(`[ERRO:SELO_INVALIDO] Selo completo reprovado na validação de invariantes: ${err.message}`);
    process.exit(1);
  }

  const sha256SeloCompleto = crypto.createHash("sha256").update(rawSeloCompleto).digest("hex");

  // Determina caminho de saída
  let caminhoSaida = caminhoSaidaCustom;
  if (!caminhoSaida) {
    const nomeBase = path.basename(caminhoAbsSelo);
    const matchData = nomeBase.match(/sorteio_d16_(\d{4}-\d{2}-\d{2})\.json/);
    const sufixoData = matchData ? matchData[1] : "redigido";
    caminhoSaida = path.join(DIR_VERIFICACOES, `selo_publico_d16_${sufixoData}.json`);
  }

  const caminhoAbsSaida = path.isAbsolute(caminhoSaida)
    ? caminhoSaida
    : path.resolve(REPO_ROOT, caminhoSaida);

  // Confere que o caminho de destino NÃO é ignorado pelo Git
  const ehVersionavel = verificarCaminhoNaoIgnoradoGit(caminhoAbsSaida, REPO_ROOT);
  if (!ehVersionavel) {
    console.error(
      `[ERRO:DESTINO_IGNORADO] O caminho de destino do selo público está ignorado pelo .gitignore (K2): ${caminhoAbsSaida}`
    );
    process.exit(1);
  }

  const seloPublico = construirSeloPublico(seloCompleto, sha256SeloCompleto);
  const jsonSerializado = JSON.stringify(seloPublico, null, 2) + "\n";

  const relSeloCompleto = path.relative(REPO_ROOT, caminhoAbsSelo).replace(/\\/g, "/");
  const relSaida = path.relative(REPO_ROOT, caminhoAbsSaida).replace(/\\/g, "/");

  if (apenasVerificar) {
    if (!fs.existsSync(caminhoAbsSaida)) {
      console.error(`[ERRO:PUBLICO_INEXISTENTE] Selo público não encontrado em ${relSaida}`);
      process.exit(1);
    }
    const conteudoAtual = fs.readFileSync(caminhoAbsSaida, "utf8");
    if (conteudoAtual !== jsonSerializado) {
      console.error(`[ERRO:DIVERGENCIA] O selo público em ${relSaida} diverge do gerado a partir do selo completo.`);
      process.exit(1);
    }
    console.log(`FONTE_DOS_DADOS\t${relSeloCompleto}`);
    console.log(`[OK:VERIFICADO] Selo público em ${relSaida} está estritamente sincronizado com o selo completo.`);
    process.exit(0);
  }

  fs.writeFileSync(caminhoAbsSaida, jsonSerializado, "utf8");

  // Primeira linha com FONTE_DOS_DADOS para conformidade com a auditoria comportamental (§18)
  console.log(`FONTE_DOS_DADOS\t${relSeloCompleto}`);
  console.log(`[OK:SELO_PUBLICO_GERADO] Selo público gravado em: ${relSaida}`);
  console.log(`  - SHA-256 do selo completo: ${sha256SeloCompleto}`);
  console.log(`  - Versão do esquema: ${seloPublico.versaoEsquema}`);
  console.log(`  - Total polígonos: ${seloPublico.totalPoligonosSorteados} (${seloPublico.totalTreino} treino / ${seloPublico.totalHeldOut} held-out)`);
  console.log(`  - Área total: ${seloPublico.areaTotalHectares} ha`);
  console.log(`  - Estratos agregados: ${seloPublico.estratos.length} estratos`);
}

// Execução direta via CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  principal().catch((err) => {
    console.error(`[FATAL] ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
