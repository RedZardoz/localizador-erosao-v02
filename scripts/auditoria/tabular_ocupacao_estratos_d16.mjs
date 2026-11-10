/**
 * scripts/auditoria/tabular_ocupacao_estratos_d16.mjs
 *
 * SAREL v2.0 — Tabulação Cruzada dos 18 Estratos Tridimensionais (Ŝ × Ê × K̂)
 * PPGTCA 2026 — Prompt G (Tarefa 4)
 *
 * REGRAS METODOLÓGICAS:
 * 1. Script estritamente de leitura (read-only).
 * 2. Emite FONTE_DOS_DADOS na primeira linha com caminho e hash SHA-256.
 * 3. Cruza os 677 candidatos de BP3 (D16) com as medições de Ê no cache.
 * 4. Tabula a ocupação dos 18 estratos tridimensionais (Ŝ × Ê × K̂).
 * 5. Avalia compulsoriamente as 9 células de K̂=2 frente ao piso de >= 4 candidatos (D16).
 * 6. Lista todas as células deficientes (se houver) com suas contagens exatas.
 * 7. NÃO roda sorteio e NÃO remove a trava de scripts/sortear_poligonos_d16.ts.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { calcularLimiaresTercis, classificarTercil } from "./caracterizar_distribuicao_e.mjs";

function calcularSha256(conteudo) {
  return crypto.createHash("sha256").update(conteudo).digest("hex");
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

  if (!fs.existsSync(resCache) || !fs.existsSync(resCandidatos)) {
    console.error("ERRO: Arquivos de entrada ausentes no disco.");
    process.exit(1);
  }

  const rawCache = fs.readFileSync(resCache, "utf8");
  const rawCandidatos = fs.readFileSync(resCandidatos, "utf8");

  const hashCache = calcularSha256(rawCache);
  const hashCandidatos = calcularSha256(rawCandidatos);

  console.log(`FONTE_DOS_DADOS\t${caminhoCache}\t${caminhoCandidatos}`);
  console.log(`# HASH_CACHE: ${hashCache} | HASH_CANDIDATOS: ${hashCandidatos}`);
  console.log("===============================================================================");
  console.log("SAREL v2.0 — TABULAÇÃO CRUZADA DOS 18 ESTRATOS TRIDIMENSIONAIS (Ŝ × Ê × K̂)");
  console.log("===============================================================================\n");

  const dadosCache = JSON.parse(rawCache);
  const dadosCandidatos = JSON.parse(rawCandidatos);

  const listaCandidatos = dadosCandidatos.candidatos || [];
  const totalUniverso = listaCandidatos.length;

  // Indexa medições do cache por ID de ponto
  const mapaPorPontoId = new Map();
  for (const [chave, item] of Object.entries(dadosCache.itens || {})) {
    if (item && item.id) {
      mapaPorPontoId.set(item.id, item);
    }
  }

  const candidatosAptos = [];
  let pendentesOuIndisponiveis = 0;
  const pontosComNMenor12 = [];

  for (const cand of listaCandidatos) {
    const med = mapaPorPontoId.get(cand.id);
    if (!med || !med.frequenciaSoloNu || med.frequenciaSoloNu.estado !== "medido" || typeof med.frequenciaSoloNu.valor !== "number") {
      pendentesOuIndisponiveis++;
      continue;
    }

    const nObs = typeof med.nObservacoes === "number" ? med.nObservacoes : 0;
    if (nObs < 12) {
      pontosComNMenor12.push({ id: cand.id, nObs });
    }

    candidatosAptos.push({
      id: cand.id,
      declividadePct: cand.declividadePct,
      frequenciaSoloNu: med.frequenciaSoloNu.valor,
      nivelK: cand.nivelK,
      nObservacoes: nObs,
    });
  }

  console.log(`[1] STATUS DA BASE PARA ESTRATIFICAÇÃO:`);
  console.log(`  - Total no Universo de Candidatos com Pedologia: ${totalUniverso}`);
  console.log(`  - Candidatos Aptos (com Ŝ, Ê medido e K̂ válido): ${candidatosAptos.length}`);
  console.log(`  - Pendentes ou Indisponíveis: ${pendentesOuIndisponiveis}`);

  if (candidatosAptos.length === 0) {
    console.log("\nAVISO: Nenhum candidato apto com medição de Ê para tabulação.");
    return;
  }

  // Limiares empíricos de Ŝ e Ê
  const valoresS = candidatosAptos.map((c) => c.declividadePct);
  const valoresE = candidatosAptos.map((c) => c.frequenciaSoloNu);

  const limiaresS = calcularLimiaresTercis(valoresS);
  const limiaresE = calcularLimiaresTercis(valoresE);

  console.log(`\n[2] LIMIARES EMPÍRICOS DE TERCIS:`);
  console.log(`  - Dimensão Ŝ (Declividade %):`);
  console.log(`      t1 = ${limiaresS.t1.toFixed(2)}% | t2 = ${limiaresS.t2.toFixed(2)}% (Empates: t1=${limiaresS.nEmpatesEmT1}, t2=${limiaresS.nEmpatesEmT2})`);
  console.log(`  - Dimensão Ê (Frequência de Solo Nu):`);
  console.log(`      t1 = ${limiaresE.t1.toFixed(4)} | t2 = ${limiaresE.t2.toFixed(4)} (Empates: t1=${limiaresE.nEmpatesEmT1}, t2=${limiaresE.nEmpatesEmT2})`);

  // Alocação nos 18 estratos
  const contagemEstratos = {};
  for (let s = 1; s <= 3; s++) {
    for (let e = 1; e <= 3; e++) {
      for (let k = 1; k <= 2; k++) {
        contagemEstratos[`E_${s}_${e}_${k}`] = 0;
      }
    }
  }

  for (const cand of candidatosAptos) {
    const tercilS = classificarTercil(cand.declividadePct, limiaresS);
    const tercilE = classificarTercil(cand.frequenciaSoloNu, limiaresE);
    const k = cand.nivelK;
    const estratoId = `E_${tercilS}_${tercilE}_${k}`;
    const contAtual = contagemEstratos[estratoId];
    contagemEstratos[estratoId] = (typeof contAtual === "number" ? contAtual : 0) + 1;
  }

  console.log(`\n[3] TABULAÇÃO DOS 18 ESTRATOS TRIDIMENSIONAIS (Ŝ × Ê × K̂):`);
  console.log(`---------------------------------------------------------------------------------`);
  console.log(` Estrato     Ŝ (Terreno)       Ê (Solo Nu)       K̂ (Erodibilidade)    Candidatos`);
  console.log(`---------------------------------------------------------------------------------`);
  for (let s = 1; s <= 3; s++) {
    for (let e = 1; e <= 3; e++) {
      for (let k = 1; k <= 2; k++) {
        const id = `E_${s}_${e}_${k}`;
        const contVal = contagemEstratos[id];
        const cont = typeof contVal === "number" ? contVal : 0;
        const descS = s === 1 ? `Baixa (<= ${limiaresS.t1.toFixed(1)}%)` : s === 2 ? `Média (${limiaresS.t1.toFixed(1)}-${limiaresS.t2.toFixed(1)}%)` : `Alta (> ${limiaresS.t2.toFixed(1)}%)`;
        const descE = e === 1 ? `Baixa (<= ${limiaresE.t1.toFixed(4)})` : e === 2 ? `Média (${limiaresE.t1.toFixed(4)}-${limiaresE.t2.toFixed(4)})` : `Alta (> ${limiaresE.t2.toFixed(4)})`;
        const descK = k === 1 ? "1 (Baixa/Média)" : "2 (Alta/M.Alta) [D16]";
        console.log(` ${id.padEnd(11)} ${descS.padEnd(17)} ${descE.padEnd(17)} ${descK.padEnd(20)} ${cont.toString().padStart(6)}`);
      }
    }
  }
  console.log(`---------------------------------------------------------------------------------`);

  // [4] Avaliação das 9 células de K̂=2 frente ao piso de D16 (>= 4 candidatos)
  console.log(`\n[4] OCUPAÇÃO DAS 9 CÉLULAS CRÍTICAS DE K̂=2 (Alta/Muito Alta Erodibilidade — D16):`);
  console.log(`  Piso obrigatório de D16: >= 4 candidatos em cada célula para permitir alocação integral.`);
  console.log(`---------------------------------------------------------------------------------`);
  console.log(` Célula K̂=2    Ŝ (Terreno)    Ê (Solo Nu)    Candidatos    Status D16`);
  console.log(`---------------------------------------------------------------------------------`);

  let celulasK2ComAoMenos4 = 0;
  const celulasDeficientes = [];

  for (let s = 1; s <= 3; s++) {
    for (let e = 1; e <= 3; e++) {
      const id = `E_${s}_${e}_2`;
      const contVal = contagemEstratos[id];
      const cont = typeof contVal === "number" ? contVal : 0;
      const status = cont >= 4 ? "OK (>= 4)" : `DEFICIT (${cont} < 4)`;
      if (cont >= 4) {
        celulasK2ComAoMenos4++;
      } else {
        celulasDeficientes.push({ celula: id, candidatos: cont, deficit: 4 - cont });
      }
      console.log(` ${id.padEnd(14)} S${s}            E${e}            ${cont.toString().padStart(6)}        ${status}`);
    }
  }
  console.log(`---------------------------------------------------------------------------------`);
  console.log(`  - Células de K̂=2 com >= 4 candidatos: ${celulasK2ComAoMenos4} de 9 (${((celulasK2ComAoMenos4 / 9) * 100).toFixed(1)}%)`);
  console.log(`  - Células deficientes de K̂=2 (< 4 candidatos): ${celulasDeficientes.length} de 9`);
  if (celulasDeficientes.length > 0) {
    console.log(`    Lista de células deficientes com contagens exatas:`);
    for (const def of celulasDeficientes) {
      console.log(`      * ${def.celula}: ${def.candidatos} candidato(s) (déficit de ${def.deficit})`);
    }
  } else {
    console.log(`    NENHUMA célula deficiente! Todas as 9 células de K̂=2 atendem ao piso de 4 candidatos.`);
  }

  // [5] Verificação da Guarda D11.2 (nObservações < 12)
  console.log(`\n[5] VERIFICAÇÃO DA GUARDA D11.2 (nObservações < 12):`);
  console.log(`  - Total de candidatos avaliados: ${candidatosAptos.length}`);
  console.log(`  - Pontos com nObservações < 12: ${pontosComNMenor12.length}`);
  if (pontosComNMenor12.length > 0) {
    console.log(`    ATENÇÃO: Pontos violando D11.2: ${JSON.stringify(pontosComNMenor12)}`);
  } else {
    console.log(`    Conforme esperado: ZERO pontos com n < 12 na amostra avaliada.`);
  }

  console.log("\n===============================================================================");
  console.log("TRAVA DE SEGURANÇA D16 PRESERVADA: O sorteio NÃO foi executado.");
  console.log("===============================================================================");
}

principal().catch((err) => {
  console.error("ERRO FATAL:", err);
  process.exit(1);
});
