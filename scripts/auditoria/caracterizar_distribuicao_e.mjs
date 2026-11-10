/**
 * scripts/auditoria/caracterizar_distribuicao_e.mjs
 *
 * SAREL v2.0 — Auditoria Metodológica e Estatística da Distribuição de Ê (Solo Nu)
 * PPGTCA 2026 — Prompt G (Tarefa 3)
 *
 * REGRAS METODOLÓGICAS:
 * 1. Script estritamente de leitura (read-only). Não modifica arquivos de cache nem universo.
 * 2. Emite FONTE_DOS_DADOS na primeira linha com caminho e hash SHA-256.
 * 3. Cruza o universo oficial de 677 candidatos de BP3 (D16) com as medições no cache.
 * 4. Reporta contagens, quantis, massa em zero com IC Wilson a 95%, empates,
 *    erro-padrão binomial, histograma ASCII (passo 0,01) e o comportamento dos tercis empíricos.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function calcularSha256(conteudo) {
  return crypto.createHash("sha256").update(conteudo).digest("hex");
}

function calcularPercentilOrdenado(ordenados, percentil) {
  if (ordenados.length === 0) return 0;
  if (percentil <= 0) return ordenados[0];
  if (percentil >= 100) return ordenados[ordenados.length - 1];
  const rank = (percentil / 100) * (ordenados.length - 1);
  const baixo = Math.floor(rank);
  const alto = Math.ceil(rank);
  const peso = rank - baixo;
  return Number((ordenados[baixo] * (1 - peso) + ordenados[alto] * peso).toFixed(4));
}

export function calcularLimiaresTercis(valores) {
  const nNaoFinitos = valores.filter((v) => typeof v !== "number" || !Number.isFinite(v) || Number.isNaN(v)).length;
  const finitos = valores.filter((v) => typeof v === "number" && Number.isFinite(v) && !Number.isNaN(v));
  const nValidos = finitos.length;
  if (nValidos === 0) {
    return { t1: 0, t2: 0, nValidos: 0, nNaoFinitos, nEmpatesEmT1: 0, nEmpatesEmT2: 0 };
  }
  const ordenados = [...finitos].sort((a, b) => a - b);
  const c1 = Math.ceil(nValidos / 3) - 1;
  const idx1 = c1 < 0 ? 0 : c1;
  const c2 = Math.ceil((2 * nValidos) / 3) - 1;
  const idx2 = c2 < 0 ? 0 : c2;
  const t1 = ordenados[idx1];
  const t2 = ordenados[idx2];
  const nEmpatesEmT1 = ordenados.filter((x) => x === t1).length;
  const nEmpatesEmT2 = ordenados.filter((x) => x === t2).length;
  return { t1, t2, nValidos, nNaoFinitos, nEmpatesEmT1, nEmpatesEmT2 };
}

export function classificarTercil(valor, limiares) {
  if (typeof valor !== "number" || !Number.isFinite(valor) || Number.isNaN(valor)) {
    throw new Error(`Valor não finito fornecido a classificarTercil: ${valor}`);
  }
  if (valor <= limiares.t1) return 1;
  if (valor <= limiares.t2) return 2;
  return 3;
}

/**
 * Intervalo de Confiança de Wilson a 95% para proporção binomial p = x / n
 * z = 1.95996398454
 */
function calcularIcWilson95(x, n) {
  if (n <= 0) return { inferior: 0, superior: 0, centro: 0 };
  const p = x / n;
  const z = 1.95996398454;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const centro = (p + z2 / (2 * n)) / denom;
  const margem = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  const infBruto = centro - margem;
  const inferior = infBruto < 0 ? 0 : infBruto;
  const supBruto = centro + margem;
  const superior = supBruto > 1 ? 1 : supBruto;
  return {
    p,
    centro,
    inferior,
    superior,
  };
}

async function principal() {
  const args = process.argv.slice(2);
  let caminhoCache = "docs/verificacoes/cache_frequencia_solo_nu_bp3.json";
  let caminhoCandidatos = "docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--cache" && i + 1 < args.length) {
      caminhoCache = args[++i];
    } else if (args[i] === "--candidatos" && i + 1 < args.length) {
      caminhoCandidatos = args[++i];
    }
  }

  const resCache = path.resolve(process.cwd(), caminhoCache);
  const resCandidatos = path.resolve(process.cwd(), caminhoCandidatos);

  if (!fs.existsSync(resCache)) {
    console.error(`ERRO: Arquivo de cache não encontrado: ${resCache}`);
    process.exit(1);
  }
  if (!fs.existsSync(resCandidatos)) {
    console.error(`ERRO: Arquivo de candidatos não encontrado: ${resCandidatos}`);
    process.exit(1);
  }

  const rawCache = fs.readFileSync(resCache, "utf8");
  const rawCandidatos = fs.readFileSync(resCandidatos, "utf8");

  const hashCache = calcularSha256(rawCache);
  const hashCandidatos = calcularSha256(rawCandidatos);

  console.log(`FONTE_DOS_DADOS\t${caminhoCache}\t${caminhoCandidatos}`);
  console.log(`# HASH_CACHE: ${hashCache} | HASH_CANDIDATOS: ${hashCandidatos}`);
  console.log("===============================================================================");
  console.log("SAREL v2.0 — CARACTERIZAÇÃO COMPLETA DA DISTRIBUIÇÃO DE Ê (SOLO NU)");
  console.log("===============================================================================\n");

  const dadosCache = JSON.parse(rawCache);
  const dadosCandidatos = JSON.parse(rawCandidatos);

  const listaCandidatos = dadosCandidatos.candidatos || [];
  const totalUniverso = listaCandidatos.length;

  console.log(`[1] UNIVERSO E CONTAGENS GERAIS:`);
  console.log(`  - Candidatos no universo com pedologia válida: ${totalUniverso}`);

  // Mapeia itens de cache por id
  const mapaPorPontoId = new Map();
  for (const [chave, item] of Object.entries(dadosCache.itens || {})) {
    if (item && item.id) {
      mapaPorPontoId.set(item.id, item);
    }
  }

  let totalMedidos = 0;
  let totalIndisponiveis = 0;
  let totalNaoNoCache = 0;
  const falhasPorCausa = {};

  const valoresE = [];
  const observacoes = [];
  const errosPadraoBinomial = [];
  const pontosComNMenor12 = [];

  for (const cand of listaCandidatos) {
    const item = mapaPorPontoId.get(cand.id);
    if (!item) {
      totalNaoNoCache++;
      continue;
    }

    const freq = item.frequenciaSoloNu;
    if (freq && freq.estado === "medido" && typeof freq.valor === "number") {
      totalMedidos++;
      valoresE.push(freq.valor);
      const nObs = typeof item.nObservacoes === "number" ? item.nObservacoes : 0;
      observacoes.push(nObs);
      if (nObs < 12) {
        pontosComNMenor12.push({ id: cand.id, nObs });
      }

      // Erro-padrão binomial por ponto: sqrt(p * (1 - p) / n)
      if (nObs > 0) {
        const se = Math.sqrt((freq.valor * (1 - freq.valor)) / nObs);
        errosPadraoBinomial.push(se);
      } else {
        errosPadraoBinomial.push(0);
      }
    } else {
      totalIndisponiveis++;
      const causa = freq?.causa || "desconhecida";
      const contAtualCausa = falhasPorCausa[causa];
      falhasPorCausa[causa] = (typeof contAtualCausa === "number" ? contAtualCausa : 0) + 1;
    }
  }

  console.log(`  - Candidatos com medição válida (estado='medido'): ${totalMedidos} (${((totalMedidos / totalUniverso) * 100).toFixed(2)}%)`);
  console.log(`  - Candidatos indisponíveis (estado='indisponivel'): ${totalIndisponiveis} (${((totalIndisponiveis / totalUniverso) * 100).toFixed(2)}%)`);
  if (totalIndisponiveis > 0) {
    console.log(`    Causas de indisponibilidade: ${JSON.stringify(falhasPorCausa)}`);
  }
  if (totalNaoNoCache > 0) {
    console.log(`  - Candidatos pendentes (ainda não presentes no cache): ${totalNaoNoCache}`);
  }

  if (totalMedidos === 0) {
    console.log("\nAVISO: Nenhuma medição válida encontrada para caracterização estatística.");
    return;
  }

  // [2] Quantis
  const ordenadosE = [...valoresE].sort((a, b) => a - b);
  const minE = ordenadosE[0];
  const p10E = calcularPercentilOrdenado(ordenadosE, 10);
  const t1E_pct = calcularPercentilOrdenado(ordenadosE, 33.3333);
  const medianaE = calcularPercentilOrdenado(ordenadosE, 50);
  const t2E_pct = calcularPercentilOrdenado(ordenadosE, 66.6667);
  const p90E = calcularPercentilOrdenado(ordenadosE, 90);
  const maxE = ordenadosE[ordenadosE.length - 1];

  console.log(`\n[2] QUANTIS DA DISTRIBUIÇÃO DE Ê (${totalMedidos} pontos):`);
  console.log(`  - Mínimo (p0):   ${minE.toFixed(4)}`);
  console.log(`  - p10:           ${p10E.toFixed(4)}`);
  console.log(`  - t1 (33,3%):    ${t1E_pct.toFixed(4)}`);
  console.log(`  - Mediana (p50): ${medianaE.toFixed(4)}`);
  console.log(`  - t2 (66,7%):    ${t2E_pct.toFixed(4)}`);
  console.log(`  - p90:           ${p90E.toFixed(4)}`);
  console.log(`  - Máximo (p100): ${maxE.toFixed(4)}`);

  // [3] Massa em Zero e IC de Wilson
  const pontosZero = ordenadosE.filter((v) => v === 0).length;
  const propZero = pontosZero / totalMedidos;
  const icWilsonZero = calcularIcWilson95(pontosZero, totalMedidos);

  console.log(`\n[3] MASSA EM ZERO (Ê == 0,0000):`);
  console.log(`  - Pontos com Ê == 0: ${pontosZero} de ${totalMedidos}`);
  console.log(`  - Proporção observada: ${(propZero * 100).toFixed(2)}% (${propZero.toFixed(4)})`);
  console.log(
    `  - Intervalo de Confiança de Wilson a 95%: [${(icWilsonZero.inferior * 100).toFixed(2)}% ; ${(icWilsonZero.superior * 100).toFixed(2)}%] (valores absolutos: [${icWilsonZero.inferior.toFixed(4)} ; ${icWilsonZero.superior.toFixed(4)}])`
  );

  // [4] Empates e Valores Distintos
  const mapaFrequencias = new Map();
  for (const v of ordenadosE) {
    const chave = v.toFixed(4);
    const contAtualChave = mapaFrequencias.get(chave);
    mapaFrequencias.set(chave, (typeof contAtualChave === "number" ? contAtualChave : 0) + 1);
  }
  const valoresDistintos = mapaFrequencias.size;
  let maiorGrupoValor = "";
  let maiorGrupoContagem = 0;
  for (const [vStr, cont] of mapaFrequencias.entries()) {
    if (cont > maiorGrupoContagem) {
      maiorGrupoContagem = cont;
      maiorGrupoValor = vStr;
    }
  }

  console.log(`\n[4] EMPATES E VALORES DISTINTOS:`);
  console.log(`  - Quantidade de valores distintos entre os ${totalMedidos} pontos: ${valoresDistintos}`);
  console.log(`  - Maior grupo de valores idênticos: ${maiorGrupoContagem} pontos com Ê = ${maiorGrupoValor} (${((maiorGrupoContagem / totalMedidos) * 100).toFixed(2)}%)`);

  // [5] Precisão e Erro-Padrão Binomial
  const seOrdenados = [...errosPadraoBinomial].sort((a, b) => a - b);
  const medianaSe = calcularPercentilOrdenado(seOrdenados, 50);
  const maxSe = seOrdenados[seOrdenados.length - 1];
  const p90Se = calcularPercentilOrdenado(seOrdenados, 90);

  // Limiares via calcularLimiaresTercis oficial
  const limiaresOficiais = calcularLimiaresTercis(valoresE);
  const difTercil = limiaresOficiais.t2 - limiaresOficiais.t1;
  const larguraTercilCentral = difTercil < 0 ? 0 : difTercil;
  const razaoSeLargura = larguraTercilCentral > 0 ? medianaSe / larguraTercilCentral : null;

  console.log(`\n[5] PRECISÃO E ERRO-PADRÃO BINOMIAL POR PONTO (SE = sqrt(p(1-p)/n)):`);
  console.log(`  - SE Mediana: ${medianaSe.toFixed(5)}`);
  console.log(`  - SE p90:     ${p90Se.toFixed(5)}`);
  console.log(`  - SE Máximo:  ${maxSe.toFixed(5)}`);
  console.log(`  - Largura do tercil central (t2 - t1): ${larguraTercilCentral.toFixed(4)}`);
  if (razaoSeLargura !== null) {
    console.log(`  - Razão SE Mediana / Largura Tercil Central: ${(razaoSeLargura * 100).toFixed(2)}% (${razaoSeLargura.toFixed(4)})`);
  } else {
    console.log(`  - Razão SE Mediana / Largura Tercil Central: Indeterminada (largura = 0)`);
  }

  // [6] Histograma em texto (faixas de 0,01)
  console.log(`\n[6] HISTOGRAMA ASCII (Faixas de 0,01):`);
  const nFaixas = 100; // 0.00 a 1.00
  const contagensFaixas = new Array(nFaixas).fill(0);
  for (const v of ordenadosE) {
    let idx = Math.floor(v * 100);
    if (idx >= nFaixas) idx = nFaixas - 1;
    contagensFaixas[idx]++;
  }

  const maxFreqFaixa = Math.max(...contagensFaixas);
  const escalaBarra = maxFreqFaixa > 0 ? 50 / maxFreqFaixa : 1;

  for (let b = 0; b < nFaixas; b++) {
    const ini = (b / 100).toFixed(2);
    const fim = ((b + 1) / 100).toFixed(2);
    const cont = contagensFaixas[b];
    if (cont > 0 || b < 10) { // Mostra as primeiras faixas mesmo vazias para evidenciar a cauda
      const barra = "█".repeat(Math.round(cont * escalaBarra));
      const pct = ((cont / totalMedidos) * 100).toFixed(1).padStart(5);
      console.log(`  [${ini} - ${fim}[: ${cont.toString().padStart(4)} (${pct}%) ${barra}`);
    }
  }

  // [7] O que calcularLimiaresTercis de fato retorna e ocupação dos tercis
  console.log(`\n[7] COMPORTAMENTO DOS TERCIS EMPÍRICOS (função calcularLimiaresTercis):`);
  console.log(`  - Limiares retornados: t1 = ${limiaresOficiais.t1.toFixed(4)} | t2 = ${limiaresOficiais.t2.toFixed(4)}`);
  console.log(`  - Empates em t1: ${limiaresOficiais.nEmpatesEmT1}`);
  console.log(`  - Empates em t2: ${limiaresOficiais.nEmpatesEmT2}`);

  let emT1 = 0;
  let emT2 = 0;
  let emT3 = 0;
  for (const v of valoresE) {
    const t = classificarTercil(v, limiaresOficiais);
    if (t === 1) emT1++;
    else if (t === 2) emT2++;
    else emT3++;
  }

  const alvoTercil = totalMedidos / 3;
  console.log(`  - Alocação observada nos tercis (Alvo ideal teórico: ~${alvoTercil.toFixed(1)} pontos por tercil):`);
  console.log(`    * Tercil 1 (Ê <= ${limiaresOficiais.t1.toFixed(4)}): ${emT1} pontos (${((emT1 / totalMedidos) * 100).toFixed(2)}%) [Desvio: ${(emT1 - alvoTercil).toFixed(1)}]`);
  console.log(`    * Tercil 2 (Ê > ${limiaresOficiais.t1.toFixed(4)} e Ê <= ${limiaresOficiais.t2.toFixed(4)}): ${emT2} pontos (${((emT2 / totalMedidos) * 100).toFixed(2)}%) [Desvio: ${(emT2 - alvoTercil).toFixed(1)}]`);
  console.log(`    * Tercil 3 (Ê > ${limiaresOficiais.t2.toFixed(4)}): ${emT3} pontos (${((emT3 / totalMedidos) * 100).toFixed(2)}%) [Desvio: ${(emT3 - alvoTercil).toFixed(1)}]`);

  // [8] Verificação da Guarda de D11.2 (nObservações >= 12)
  console.log(`\n[8] VERIFICAÇÃO DA GUARDA DE D11.2 (nObservações >= 12):`);
  const obsOrdenadas = [...observacoes].sort((a, b) => a - b);
  const minObs = obsOrdenadas[0];
  const medianaObs = calcularPercentilOrdenado(obsOrdenadas, 50);
  const maxObs = obsOrdenadas[obsOrdenadas.length - 1];
  console.log(`  - nObservações por ponto: Mínimo = ${minObs} | Mediana = ${medianaObs} | Máximo = ${maxObs}`);
  console.log(`  - Pontos com nObservações < 12: ${pontosComNMenor12.length}`);
  if (pontosComNMenor12.length > 0) {
    console.log(`    ATENÇÃO: Pontos violando D11.2: ${JSON.stringify(pontosComNMenor12)}`);
  } else {
    console.log(`    Conforme esperado: ZERO pontos abaixo de 12 observações.`);
  }

  console.log("\n===============================================================================");
  console.log("FIM DA CARACTERIZAÇÃO");
  console.log("===============================================================================");
}

principal().catch((err) => {
  console.error("ERRO FATAL:", err);
  process.exit(1);
});
