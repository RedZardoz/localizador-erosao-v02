/**
 * ============================================================================
 * CLI de Verificação do Pool de Candidatos por Estrato — DP-20 (Somente Leitura)
 * Executável via:
 *   node --import ./scripts/ts-loader.mjs scripts/verificar_pool_estratos.ts \
 *     --candidatos <caminho.json> --reservas <N> --n-minimo <N> --taxas <0.1,0.25,...>
 * ============================================================================
 *
 * REGRAS METODOLÓGICAS ESTITAS:
 * 1. Somente leitura: NUNCA gera selo nem grava em docs/verificacoes/sorteio.
 * 2. Recusa candidatos sintéticos com a mesma mensagem do sorteio D23.
 * 3. Reaproveita a contagem por estrato de `verificarPreCondicoesSorteioD16`
 *    (src/lib/gee/sorteioPoligonosTipos.ts).
 * 4. Não imprime coordenadas (latitude/longitude) nem códigos de CAR.
 * 5. Declara aviso metodológico no topo de que cenários são ilustrativos.
 */

import fs from "node:fs";
import path from "node:path";
import {
  CandidatoSorteioD16,
  verificarPreCondicoesSorteioD16,
} from "../src/lib/gee/sorteioPoligonosTipos";
import { TODOS_ESTRATOS_D12 } from "../src/lib/gee/estratificacao";
import {
  analisarPoolPorEstrato,
  SIMPLIFICACAO_METODOLOGICA_RECUSAS,
} from "../src/lib/gee/poolEstratos";

const AVISO_TOPO_ILUSTRATIVO =
  "Cenários de taxa de recusa são ILUSTRATIVOS; não são estimativa. " +
  "O pool só é confiável depois de fixadas as decisões DP-1, DP-3 e DP-6 (mudam N_h).";

function parseArgs(args: string[]): {
  caminhoCandidatos: string | null;
  reservas: number | null;
  nMinimo: number | null;
  taxas: number[] | null;
  caminhoSaida: string | null;
} {
  let caminhoCandidatos: string | null = null;
  let reservas: number | null = null;
  let nMinimo: number | null = null;
  let taxas: number[] | null = null;
  let caminhoSaida: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--candidatos" && i + 1 < args.length) {
      caminhoCandidatos = args[i + 1];
      i++;
    } else if (arg === "--reservas" && i + 1 < args.length) {
      const v = Number(args[i + 1]);
      if (Number.isInteger(v) && v >= 0) {
        reservas = v;
      }
      i++;
    } else if (arg === "--n-minimo" && i + 1 < args.length) {
      const v = Number(args[i + 1]);
      if (Number.isInteger(v) && v >= 1 && v <= 4) {
        nMinimo = v;
      }
      i++;
    } else if (arg === "--taxas" && i + 1 < args.length) {
      const pedacos = args[i + 1].split(",").map((s) => Number(s.trim()));
      const validas = pedacos.every(
        (p) => typeof p === "number" && !Number.isNaN(p) && p >= 0 && p <= 1
      );
      if (validas && pedacos.length > 0) {
        taxas = pedacos;
      }
      i++;
    } else if (arg === "--saida" && i + 1 < args.length) {
      caminhoSaida = args[i + 1];
      i++;
    }
  }

  return { caminhoCandidatos, reservas, nMinimo, taxas, caminhoSaida };
}

export function executarVerificacaoPool(): void {
  const args = process.argv.slice(2);
  const { caminhoCandidatos, reservas, nMinimo, taxas, caminhoSaida } = parseArgs(args);

  // Proibir expressamente escrita em docs/verificacoes/sorteio
  if (caminhoSaida) {
    const absSaida = path.resolve(process.cwd(), caminhoSaida).replace(/\\/g, "/");
    const dirSorteioAbs = path.resolve(process.cwd(), "docs", "verificacoes", "sorteio").replace(/\\/g, "/");
    if (absSaida.startsWith(dirSorteioAbs)) {
      console.error(
        `[ERRO_SEGURANCA] O argumento --saida não pode apontar para '${dirSorteioAbs}'. ` +
        "A pasta docs/verificacoes/sorteio é de uso exclusivo de selos D23 auditados."
      );
      process.exit(1);
    }
  }

  if (!caminhoCandidatos) {
    console.error(
      "[ERRO_PARAMETRO] O argumento --candidatos <caminho.json> é obrigatório. " +
      "Esta CLI recusa rodar sem candidatos reais informados."
    );
    process.exit(1);
  }

  if (reservas === null) {
    console.error(
      "[ERRO_PARAMETRO] O argumento --reservas <N> é obrigatório (inteiro >= 0)."
    );
    process.exit(1);
  }

  if (nMinimo === null) {
    console.error(
      "[ERRO_PARAMETRO] O argumento --n-minimo <N> é obrigatório (inteiro entre 1 e 4)."
    );
    process.exit(1);
  }

  if (!taxas || taxas.length === 0) {
    console.error(
      "[ERRO_PARAMETRO] O argumento --taxas <0.1,0.25,...> é obrigatório (números em [0, 1])."
    );
    process.exit(1);
  }

  const absPath = path.resolve(process.cwd(), caminhoCandidatos);
  if (!fs.existsSync(absPath)) {
    console.error(`[ERRO_ARQUIVO] Arquivo de candidatos não encontrado: ${absPath}`);
    process.exit(1);
  }

  let bruto: unknown;
  try {
    bruto = JSON.parse(fs.readFileSync(absPath, "utf-8"));
  } catch (err) {
    console.error(`[ERRO_JSON] Falha ao analisar JSON em ${absPath}: ${(err as Error).message}`);
    process.exit(1);
  }

  const candidatos: CandidatoSorteioD16[] = Array.isArray(bruto)
    ? bruto
    : (bruto as { candidatos?: CandidatoSorteioD16[] })?.candidatos ?? [];

  // Regra (a): Recusa de candidato sintético com a mesma mensagem do sorteio D23
  const possuiOrigemSintetica =
    (bruto as { origemSintetica?: boolean })?.origemSintetica === true;
  const possuiCandidatoSintetico = candidatos.some(
    (c) =>
      String(c.id).startsWith("DRY-CAND-") ||
      c.isSynthetic === true ||
      c.origemSintetica === true
  );

  if (possuiOrigemSintetica || possuiCandidatoSintetico) {
    console.error(
      "Recusa de sorteio D23 (T4.3): o selo de sorteio jamais pode ser gerado a partir de candidatos sintéticos/fabricados (DRY-CAND- / isSynthetic)."
    );
    process.exit(1);
  }

  // Contagem por estrato reaproveitada diretamente da função canônica do sorteio
  // (verificarPreCondicoesSorteioD16 de src/lib/gee/sorteioPoligonosTipos.ts)
  const relatorioPre = verificarPreCondicoesSorteioD16(candidatos, {
    lancarErro: false,
  });

  const analise = analisarPoolPorEstrato(relatorioPre.contagemCandidatosPorEstrato, {
    reservasPorEstrato: reservas,
    nMinimoPorEstrato: nMinimo,
    taxasRecusa: taxas,
  });

  // Montagem da tabela textual formatada (sem coordenadas nem CAR)
  const linhasSaida: string[] = [];
  linhasSaida.push("================================================================================");
  linhasSaida.push("SAREL v2.0 — VERIFICAÇÃO DO POOL DE CANDIDATOS POR ESTRATO (DP-20 / SOMENTE LEITURA)");
  linhasSaida.push("================================================================================");
  linhasSaida.push(`AVISO: ${AVISO_TOPO_ILUSTRATIVO}`);
  linhasSaida.push(`NOTA METODOLÓGICA: ${SIMPLIFICACAO_METODOLOGICA_RECUSAS}`);
  linhasSaida.push(`Contagem obtida via: verificarPreCondicoesSorteioD16 (src/lib/gee/sorteioPoligonosTipos.ts)`);
  linhasSaida.push(`Arquivo de candidatos: ${path.relative(process.cwd(), absPath).replace(/\\/g, "/")}`);
  linhasSaida.push(`Parâmetros: reservasPorEstrato=${reservas}, nMinimoPorEstrato=${nMinimo}, taxas=[${taxas.join(", ")}]`);
  linhasSaida.push("--------------------------------------------------------------------------------");

  // Cabeçalho da tabela
  const cabecalhoTaxas = taxas.map((t) => `P(rec=${t})`).join(" | ");
  linhasSaida.push(
    `Estrato      | N_h | Tit | ResPoss | ResEfet | Status     | ${cabecalhoTaxas}`
  );
  linhasSaida.push("--------------------------------------------------------------------------------");

  for (const idEstrato of TODOS_ESTRATOS_D12) {
    const item = analise.estratos[idEstrato];
    if (!item) continue;

    let statusStr = "OK";
    if (item.inviavel) {
      statusStr = "INVIÁVEL(<4)";
    } else if (!item.ok) {
      statusStr = "DEFICIENTE";
    }

    const colunasProb = taxas
      .map((t) => {
        const val = item.probabilidadesPorTaxa[t];
        return typeof val === "number" ? (val * 100).toFixed(1) + "%" : "N/D";
      })
      .map((s) => s.padStart(11, " "))
      .join(" | ");

    const linha =
      `${idEstrato.padEnd(12, " ")} | ` +
      `${String(item.Nh).padStart(3, " ")} | ` +
      `${String(item.titularesExigidos).padStart(3, " ")} | ` +
      `${String(item.reservasPossiveis).padStart(7, " ")} | ` +
      `${String(item.reservasEfetivas).padStart(7, " ")} | ` +
      `${statusStr.padEnd(10, " ")} | ` +
      `${colunasProb}`;

    linhasSaida.push(linha);
  }

  linhasSaida.push("--------------------------------------------------------------------------------");
  linhasSaida.push(
    `RESUMO: Total Candidatos = ${analise.resumo.totalCandidatos} | ` +
    `Estratos OK = ${analise.resumo.estratosOk}/${analise.resumo.totalEstratos} | ` +
    `Deficientes = ${analise.resumo.estratosDeficientes} | ` +
    `Inviáveis = ${analise.resumo.estratosInviaveis}`
  );
  linhasSaida.push("================================================================================");

  const textoFinal = linhasSaida.join("\n");
  console.log(textoFinal);

  if (caminhoSaida) {
    const absSaida = path.resolve(process.cwd(), caminhoSaida);
    const pastaPai = path.dirname(absSaida);
    if (!fs.existsSync(pastaPai)) {
      fs.mkdirSync(pastaPai, { recursive: true });
    }
    fs.writeFileSync(absSaida, textoFinal, "utf-8");
  }
}

// Execução direta via Node
const ehExecucaoDireta =
  process.argv[1] &&
  (path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url)) ||
   process.argv[1].endsWith("verificar_pool_estratos.ts"));

if (ehExecucaoDireta) {
  executarVerificacaoPool();
}

function fileURLToPath(url: string): string {
  return url.startsWith("file:") ? path.resolve(new URL(url).pathname.replace(/^\/([A-Za-z]:)/, "$1")) : url;
}
