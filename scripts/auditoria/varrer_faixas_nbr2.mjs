#!/usr/bin/env node
/**
 * ============================================================================
 * Instrumentação de Varredura das Seis Faixas de NBR2 (Demattê et al., 2018)
 * SAREL v2.0 — Disciplina Pericial PPGTCA 2026 (Decisão D10 / Tarefa 4)
 * ============================================================================
 *
 * FUNDAMENTAÇÃO:
 * - Demattê et al. (2018), p. 7 testou seis faixas de NBR2 sobre Landsat 5 TM em SP:
 *   [0.025, 0.075, 0.150, 0.225, 0.300, 0.350].
 * - O limiar 0.075 foi escolhido por avaliação multicritério regional (correlação
 *   canônica 0.93) para aquele conjunto de sensores/solos paulistas.
 * - Este script instrumenta a replicação sistemática dessa varredura para o
 *   recorte de solos do Paraná sobre Sentinel-2 MSI L2A.
 *
 * REGRAS INVIOLÁVEIS:
 * - Regra 1 / Anti-fabricação: RECUSA-SE a rodar sem dados reais.
 * - Jamais emite número simulado em produção.
 * - Primeira linha obrigatória: FONTE_DOS_DADOS.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ehSoloExpostoGeos3, FAIXAS_NBR2_DEMATTE_2018 } from "../../src/lib/gee/mascaraSoloNuGeos3.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../..");

/**
 * Calcula Ê para uma série de cenas sob cada uma das faixas de NBR2.
 * Função pura para uso analítico e testes de monotonicidade.
 *
 * @param {Array<{b2: number, b3: number, b4: number, b8: number, b11: number, b12: number}>} cenas
 * @param {readonly number[]} faixas
 * @returns {Record<number, { nSoloNu: number, nValidas: number, frequencia: number }>}
 */
export function calcularFrequenciasVarreduraNbr2(cenas, faixas = FAIXAS_NBR2_DEMATTE_2018) {
  if (!Array.isArray(cenas) || cenas.length === 0) {
    throw new Error("Série de cenas vazia ou inválida.");
  }

  const resultados = {};

  for (const faixa of faixas) {
    const avaliacoes = cenas
      .map(c => ehSoloExpostoGeos3(c.b2, c.b3, c.b4, c.b8, c.b11, c.b12, { nbr2Max: faixa }))
      .filter(res => res !== null);

    const nValidas = avaliacoes.length;
    const nSoloNu = avaliacoes.filter(res => res === true).length;
    const frequencia = nValidas > 0 ? Number((nSoloNu / nValidas).toFixed(4)) : 0;

    resultados[faixa] = {
      nSoloNu,
      nValidas,
      frequencia,
    };
  }

  return resultados;
}

/**
 * Execução CLI com fail-closed estrito na ausência de dados reais.
 */
export function executarVarreduraCli(caminhoDadosInformado = process.argv[2]) {
  const fonteArquivo = caminhoDadosInformado ? path.resolve(process.cwd(), caminhoDadosInformado) : null;

  if (!fonteArquivo || !fs.existsSync(fonteArquivo)) {
    console.log("FONTE_DOS_DADOS: AUSENTE (candidatosComSoloNuMedido: 0 no repositório)");
    console.error("ERRO: Nenhuma série temporal medida disponível para processamento.");
    console.error("A varredura das seis faixas de NBR2 recusa-se a rodar sem dados reais (Regra 1 / Anti-fabricação).");
    console.error("A ingestão está bloqueada (candidatosComSoloNuMedido: 0).");
    console.error("Instrumentação pronta para execução assim que a ingestão de dados reais do GEE for desbloqueada.");
    return { sucesso: false, motivo: "sem_dados_reais" };
  }

  const conteudo = fs.readFileSync(fonteArquivo, "utf-8");
  let dados;
  try {
    dados = JSON.parse(conteudo);
  } catch (err) {
    console.log(`FONTE_DOS_DADOS: ${fonteArquivo} (CORROMPIDO)`);
    console.error("ERRO: Falha ao interpretar arquivo JSON de entrada.");
    return { sucesso: false, motivo: "json_invalido" };
  }

  // Verifica se há dados de série temporal reais
  const series = dados.series || dados.cenas || (Array.isArray(dados) ? dados : null);
  if (!series || !Array.isArray(series) || series.length === 0) {
    console.log(`FONTE_DOS_DADOS: ${fonteArquivo} (SEM SÉRIES TEMPORAIS)`);
    console.error("ERRO: O arquivo informado não contém séries temporais válidas de observações espectrais.");
    return { sucesso: false, motivo: "estrutura_invalida" };
  }

  console.log(`FONTE_DOS_DADOS: ${path.relative(ROOT, fonteArquivo)}`);
  console.log("================================================================================");
  console.log("VARREDURA DAS SEIS FAIXAS DE NBR2 (Demattê et al., 2018) — SAREL v2.0");
  console.log("================================================================================");
  console.log("Faixa NBR2 Max | N Cenas Solo Nu | N Cenas Válidas | Frequência Ê");
  console.log("---------------|-----------------|-----------------|--------------");

  const resultados = calcularFrequenciasVarreduraNbr2(series);
  for (const [faixa, res] of Object.entries(resultados)) {
    console.log(
      `${String(faixa).padEnd(14)} | ${String(res.nSoloNu).padEnd(15)} | ${String(res.nValidas).padEnd(15)} | ${res.frequencia.toFixed(4)}`
    );
  }

  return { sucesso: true, resultados };
}

// Executa automaticamente quando invocado como script principal
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const res = executarVarreduraCli();
  if (!res.sucesso) {
    process.exit(1);
  }
}
