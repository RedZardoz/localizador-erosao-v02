/**
 * ============================================================================
 * CLI de Sorteio dos 72 Polígonos de 5,02 ha (~361 ha) — FASE A1 (Decisões D16 e D23)
 * Executável via: `npm run sortear:d16 -- --dry-run`
 * ============================================================================
 *
 * REGRAS DE SEGURANÇA E IDEMPOTÊNCIA:
 * - `--dry-run` é obrigatório na primeira invocação (e é o modo padrão se `--confirmar` não for passado):
 *   verifica todas as 7 pré-condições, exibe a contagem de candidatos por estrato sobre os 18 estratos
 *   de D12 e NÃO executa o sorteio nem grava selo em disco.
 * - O sorteio real exige `--confirmar` explícito + conjunto de candidatos reais e grava uma única vez
 *   `docs/verificacoes/sorteio/sorteio_d16_<AAAA-MM-DD>.json`.
 * - Se já existir qualquer selo `sorteio_d16_*.json` em `docs/verificacoes/sorteio/`, recusa imediatamente
 *   e aponta o arquivo existente (D23 proíbe descartar `pi_i` registrado).
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import {
  CandidatoSorteioD16,
  verificarPreCondicoesSorteioD16,
  sortear72PoligonosD16,
} from "@/lib/gee/sorteioPoligonos";
import { dataCivilSaoPaulo } from "@/lib/tempo/datas";
import { TODOS_ESTRATOS_D12 } from "@/lib/gee/estratificacao";

const DIRETORIO_SELOS = path.join(process.cwd(), "docs", "verificacoes", "sorteio");

export function localizarSeloExistente(diretorio = DIRETORIO_SELOS): string | null {
  if (!fs.existsSync(diretorio)) return null;
  const arquivos = fs
    .readdirSync(diretorio)
    .filter((f) => /^sorteio_d16_\d{4}-\d{2}-\d{2}\.json$/i.test(f))
    .sort();
  if (arquivos.length === 0) return null;
  return path.relative(process.cwd(), path.join(diretorio, arquivos[0])).replace(/\\/g, "/");
}

function obterGitCommitAtual(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "indisponivel";
  }
}

/**
 * Gera um conjunto de verificação estrutural para o modo `--dry-run` quando nenhum arquivo
 * `--candidatos <caminho>` externo é informado, permitindo inspecionar a partição nos 18 estratos
 * e validar todas as 7 pré-condições sem executar nem selar sorteio.
 * Jamais pode ser usado com `--confirmar`.
 */
function gerarConjuntoInspecaoDryRun(): CandidatoSorteioD16[] {
  const sTercis = [4.2, 9.5, 15.8];
  const eTercis = [0.12, 0.38, 0.72];
  const kNiveis: Array<1 | 2> = [1, 2];
  const pool: CandidatoSorteioD16[] = [];
  let seq = 1;

  for (let sIdx = 0; sIdx < sTercis.length; sIdx++) {
    for (let eIdx = 0; eIdx < eTercis.length; eIdx++) {
      for (const k of kNiveis) {
        const nNoEstrato = 6; // 6 candidatos por estrato (total 108) para garantir >= 4 por estrato conforme emenda D16 (72 polígonos)
        for (let i = 0; i < nNoEstrato; i++) {
          pool.push({
            id: `DRYRUN-BP3-${String(seq).padStart(4, "0")}`,
            latitude: Number((-24.75 - seq * 0.0012).toFixed(6)),
            longitude: Number((-53.78 - seq * 0.0012).toFixed(6)),
            declividadePct: Number((sTercis[sIdx] + i * 0.04 + (eIdx * 2 + k) * 0.001).toFixed(4)),
            frequenciaSoloNu: Number((eTercis[eIdx] + i * 0.004 + (sIdx * 2 + k) * 0.0001).toFixed(4)),
            nivelK: k,
            classeWorldCover2020: i % 2 === 0 ? 40 : 30,
            classeWorldCover2021: 40,
            kAmbiguoAssociacao: k === 2 && i === 0,
          });
          seq++;
        }
      }
    }
  }
  return pool;
}

export const MENSAGEM_BLOQUEIO_D11_2 =
  `[BLOQUEIO PRE-REGISTRADO D11.2] O sorteio de D16 esta travado.\n` +
  `A guarda que veda E-hat sob suficiencia insuficiente (6 <= n < 12, SE ~ 0,20) de entrar nos\n` +
  `tercis de D12 nao esta ativa no caminho de producao. Ver:\n` +
  `  - docs/auditorias/DeepSeek/AUDITORIA_FUNCIONAL_METODOLOGICA_2026-11-09.md, achado S1-1\n` +
  `  - docs/planejamento/prompts/PROMPT_EXECUTOR_... (Prompt H), que a reativa\n` +
  `Enquanto esta trava existir, nenhum sorteio pode ser executado. Remove-la e tarefa do Prompt H,\n` +
  `junto com o conserto, e nao antes.`;

export const TRAVA_D11_2_ATIVA = true;

function executarCli(): void {
  const travaAtiva: boolean = TRAVA_D11_2_ATIVA;
  if (travaAtiva) {
    console.error(MENSAGEM_BLOQUEIO_D11_2);
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const flagDryRun = args.includes("--dry-run");
  const flagConfirmar = args.includes("--confirmar");

  const idxCand = args.indexOf("--candidatos");
  const caminhoCandidatos = idxCand >= 0 && args[idxCand + 1] ? args[idxCand + 1] : null;

  const idxSemente = args.indexOf("--semente");
  const sementeInformada =
    idxSemente >= 0 && args[idxSemente + 1] ? Number(args[idxSemente + 1]) : null;

  // P07 ("dinamica-registrada"): nao existe semente padrao. O sorteio real e irreversivel, de modo
  // que a semente tem de ser uma escolha explicita e registrada do pesquisador, nunca uma constante
  // embutida no script. No dry-run, uma semente criptografica e gerada e impressa.
  if (sementeInformada !== null && (!Number.isInteger(sementeInformada) || sementeInformada < 1)) {
    console.error(
      `[ERRO_PARAMETRO] --semente deve ser inteiro >= 1; recebido: ${args[idxSemente + 1]}`
    );
    process.exit(1);
  }
  if (flagConfirmar && sementeInformada === null) {
    console.error(
      "[ERRO_PARAMETRO] O argumento --semente <N> e obrigatorio com --confirmar: o sorteio de D16 e"
    );
    console.error(
      "irreversivel e a semente precisa ser escolhida e registrada pelo pesquisador (P07), nao herdada"
    );
    console.error("de uma constante do script.");
    process.exit(1);
  }
  const sementeArg: number =
    sementeInformada !== null ? sementeInformada : crypto.randomInt(1, 2 ** 31 - 1);
  if (sementeInformada === null) {
    console.log(
      `[P07] Semente nao informada: gerada para esta execucao de dry-run -> ${sementeArg} (registre-a para reproduzir).`
    );
  }

  const seloExistente = localizarSeloExistente();

  console.log("========================================================================");
  console.log("SAREL — COMANDO DE SORTEIO DOS 72 POLÍGONOS DE 5,02 ha (~361 ha) (FASE A1 — D16/D23)");
  console.log("========================================================================");

  if (seloExistente) {
    console.error(
      `[RECUSA IDEMPOTENTE — D23] Selo de sorteio anterior detectado em: ${seloExistente}`
    );
    console.error(
      "A Decisão D23 proíbe descartar, sobrescrever ou versionar (_v2) probabilidades de inclusão (pi_i) já registradas."
    );
    process.exit(1);
  }

  let candidatos: CandidatoSorteioD16[];
  let origemCandidatos: string;
  let origemSintetica = false;

  if (caminhoCandidatos) {
    const absPath = path.resolve(process.cwd(), caminhoCandidatos);
    if (!fs.existsSync(absPath)) {
      console.error(`[ERRO] Arquivo de candidatos não encontrado: ${absPath}`);
      process.exit(1);
    }
    const bruto = JSON.parse(fs.readFileSync(absPath, "utf-8"));
    if (Array.isArray(bruto)) {
      if (bruto.length === 0) {
        console.error(
          "[ERRO_ARQUIVO] A lista de candidatos está vazia (0 candidatos encontrados no array raiz)."
        );
        process.exit(1);
      }
      candidatos = bruto as CandidatoSorteioD16[];
    } else if (typeof bruto === "object" && bruto !== null) {
      const obj = bruto as Record<string, unknown>;
      if (!("candidatos" in obj) || !Array.isArray(obj.candidatos)) {
        const chaves = Object.keys(obj);
        const listaChaves = chaves.length > 0 ? chaves.join(", ") : "(nenhuma chave)";
        console.error(
          `[ERRO_ARQUIVO] O arquivo JSON não contém uma lista de candidatos (esperado array na raiz ou propriedade 'candidatos' do tipo array). Chaves encontradas no objeto raiz: ${listaChaves}.`
        );
        process.exit(1);
      }
      if (obj.candidatos.length === 0) {
        console.error(
          "[ERRO_ARQUIVO] A lista de candidatos está vazia (0 candidatos encontrados na propriedade 'candidatos')."
        );
        process.exit(1);
      }
      candidatos = obj.candidatos as CandidatoSorteioD16[];
    } else {
      console.error(
        `[ERRO_ARQUIVO] O conteúdo de ${absPath} não é um JSON válido de candidatos (esperado objeto com chave 'candidatos' ou array na raiz).`
      );
      process.exit(1);
    }
    origemCandidatos = absPath;
    if (
      bruto?.origemSintetica === true ||
      candidatos.some(
        (c) =>
          String(c.id).startsWith("DRY-CAND-") ||
          c.isSynthetic === true ||
          c.origemSintetica === true
      )
    ) {
      origemSintetica = true;
    }
  } else {
    candidatos = gerarConjuntoInspecaoDryRun();
    origemCandidatos = "inspecao-estrutural-dry-run (sem arquivo --candidatos informado)";
    origemSintetica = true;
  }

  // Garantia de código (T4.3): o selo de D23 jamais pode nascer de candidato sintético, mesmo com --confirmar
  if (origemSintetica && flagConfirmar) {
    console.error(
      "[RECUSA — ORIGEM SINTÉTICA] O selo de D23 jamais pode ser gravado a partir de candidatos sintéticos/fabricados, mesmo com --confirmar. Informe um arquivo real de candidatos da Bacia do Paraná 3 via --candidatos <caminho.json>."
    );
    process.exit(1);
  }

  const relatorio = verificarPreCondicoesSorteioD16(candidatos, {
    seloExistenteCaminho: seloExistente,
    lancarErro: false,
  });

  const prefixoNum = origemSintetica ? "[SINTETICO] " : "";

  console.log(`Modo de operação: ${flagConfirmar && !flagDryRun ? "CONFIRMAR (REAL)" : "DRY-RUN (SIMULAÇÃO SEGURA — NENHUM SORTEIO EXECUTADO)"}`);
  console.log(`Origem do conjunto: ${origemCandidatos}`);

  if (origemSintetica) {
    console.log(
      "\n[AVISO — DADOS SINTÉTICOS DE EXERCÍCIO ESTRUTURAL] Os limiares empíricos e as contagens abaixo NÃO descrevem a Bacia do Paraná 3; são 108 candidatos fabricados exclusivamente para exercitar a estrutura das 7 pré-condições no modo --dry-run."
    );
  }

  console.log(`${prefixoNum}Total de candidatos avaliados: ${relatorio.totalCandidatos}`);
  console.log(`${prefixoNum}Limiares empíricos S (declividade %): t1=${relatorio.limiaresS.t1.toFixed(4)}%, t2=${relatorio.limiaresS.t2.toFixed(4)}%`);
  console.log(`${prefixoNum}Limiares empíricos E (freq. solo nu): t1=${relatorio.limiaresE.t1.toFixed(4)}, t2=${relatorio.limiaresE.t2.toFixed(4)}`);
  console.log(`\n${prefixoNum}Contagem de candidatos por estrato (18 estratos de D12):`);

  for (const idEstrato of TODOS_ESTRATOS_D12) {
    const n = relatorio.contagemCandidatosPorEstrato[idEstrato];
    const piPreview = n >= 4 ? (4 / n).toFixed(4) : "INVIÁVEL (<4)";
    console.log(`${prefixoNum}  - ${idEstrato}: ${String(n).padStart(3, " ")} candidatos | pi_i previsto = 4/${n} (${piPreview})`);
  }

  if (origemSintetica) {
    console.log(
      "[FIM DO BLOCO SINTÉTICO] Aviso reiterado: os limiares e as contagens acima NÃO descrevem a Bacia do Paraná 3 e servem apenas para exercitar a estrutura.\n"
    );
  }

  if (!relatorio.aprovado) {
    console.error(`\n[PRÉ-CONDIÇÃO REPROVADA: ${relatorio.condicaoFalha}]`);
    console.error(`Motivo: ${relatorio.motivoFalha}`);
    process.exit(1);
  }

  console.log("\n[OK] Todas as 7 pré-condições de D07, D08, D12, D16 e D23 foram aprovadas.");

  if (flagDryRun || !flagConfirmar || origemSintetica) {
    console.log(
      "\n[DRY-RUN CONCLUÍDO] Nenhum sorteio foi executado e nenhum selo foi gravado em docs/verificacoes/sorteio/."
    );
    console.log(
      "Para executar o sorteio real irreversível (72 polígonos de 5,02 ha (~361 ha), 36 treino + 36 held-out), invoque com --confirmar --candidatos <caminho.json>."
    );
    process.exit(0);
  }

  const sha256 = crypto
    .createHash("sha256")
    .update(JSON.stringify(candidatos))
    .digest("hex");
  const gitCommit = obterGitCommitAtual();
  const dataHoje = dataCivilSaoPaulo();
  const caminhoSelo = path.join(DIRETORIO_SELOS, `sorteio_d16_${dataHoje}.json`);

  if (fs.existsSync(caminhoSelo)) {
    console.error(`[RECUSA IDEMPOTENTE — D23] O arquivo de selo já existe: ${caminhoSelo}`);
    process.exit(1);
  }

  const selo = sortear72PoligonosD16(candidatos, {
    semente: sementeArg,
    gitCommit,
    sha256ConjuntoCandidatos: sha256,
    seloExistenteCaminho: seloExistente,
  });

  fs.mkdirSync(DIRETORIO_SELOS, { recursive: true });
  fs.writeFileSync(caminhoSelo, JSON.stringify(selo, null, 2), "utf-8");
  console.log(`\n[SORTEIO SELADO COM SUCESSO] Arquivo gravado em: ${caminhoSelo}`);
}

executarCli();
