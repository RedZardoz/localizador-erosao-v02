#!/usr/bin/env node
/**
 * PRINCÍPIO FUNDAMENTAL DO PAINEL DE ESTADO:
 * O painel só pode derivar do que o GIT ARMAZENA. Permitido: git ls-files,
 * git cat-file, git log, e leitura de conteúdo de arquivos versionados.
 * VEDADO: fs.stat (tamanho, mtime, permissões), fs.readdir para inventariar,
 * relógio de parede, branch, caminho absoluto, e qualquer coisa da árvore de
 * trabalho que o git não defina.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../..");
export const ARQUIVO_ESTADO_MD = path.join(ROOT, "docs", "planejamento", "ESTADO.md");

/**
 * Normaliza quebras de linha e compara dois textos markdown
 */
export function compararEspelho(mdGerado, mdDisco) {
  const normGerado = mdGerado.replace(/\r\n/g, "\n").trim();
  const normDisco = mdDisco.replace(/\r\n/g, "\n").trim();

  if (normGerado === normDisco) {
    return { identicos: true, diferencas: [] };
  }

  const linhasGerado = normGerado.split("\n");
  const linhasDisco = normDisco.split("\n");
  const diferencas = [];

  const maxLinhas = Math.max(linhasGerado.length, linhasDisco.length);
  for (let i = 0; i < maxLinhas; i++) {
    const lG = linhasGerado[i];
    const lD = linhasDisco[i];
    if (lG !== lD) {
      diferencas.push(`Linha ${i + 1}: gerado='${lG ?? "<fim>"}' vs disco='${lD ?? "<fim>"}'`);
      if (diferencas.length >= 10) {
        diferencas.push(`... e mais ${maxLinhas - i - 1} linhas divergentes.`);
        break;
      }
    }
  }

  return { identicos: false, diferencas };
}

/**
 * Agrupa itens por estado e determina o maior ID
 */
function agruparPorEstado(objeto, prefixo) {
  const grupos = { decidida: [], proposta: [], pendente: [] };
  let maiorNumero = 0;

  for (const [chave, item] of Object.entries(objeto || {})) {
    const id = item?.id || chave;
    const estado = item?.estado || "pendente";
    if (!grupos[estado]) grupos[estado] = [];
    grupos[estado].push(id);

    const matchNum = id.match(/\d+/);
    if (matchNum) {
      const num = parseInt(matchNum[0], 10);
      if (num > maiorNumero) maiorNumero = num;
    }
  }

  for (const est of Object.keys(grupos)) {
    grupos[est].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  const maiorId = maiorNumero > 0 ? `${prefixo}${String(maiorNumero).padStart(2, "0")}` : "AUSENTE";
  return { grupos, maiorId, total: Object.keys(objeto || {}).length };
}

/**
 * Extrai colunas por perfil a partir de src/lib/matriz/perfis.ts
 */
function extrairPerfis(caminhoPerfis) {
  if (!fs.existsSync(caminhoPerfis)) return null;
  const linhas = fs.readFileSync(caminhoPerfis, "utf8").split(/\r?\n/);
  const perfis = new Map();
  let nomeAtual = null;

  for (let i = 0; i < linhas.length; i++) {
    const abre = linhas[i].match(/^\s{2}"?([a-z0-9-]+)"?:\s*\{\s*$/);
    if (abre !== null) {
      nomeAtual = abre[1];
      perfis.set(nomeAtual, []);
      continue;
    }
    if (nomeAtual === null) continue;
    const col = linhas[i].match(/^\s*"([A-Za-z0-9_]+)",?\s*$/);
    if (col !== null) perfis.get(nomeAtual).push(col[1]);
  }

  return perfis;
}

/**
 * Lista arquivos de evidência versionados em docs/verificacoes com tamanho do blob Git
 */
function listarArquivosVerificacoes(repoRoot, lsFiles, commitBase = "HEAD") {
  const arquivos = lsFiles
    ? lsFiles.filter((f) => f.startsWith("docs/verificacoes/"))
    : execSync("git ls-files docs/verificacoes", { cwd: repoRoot, encoding: "utf8" })
        .trim()
        .split(/\r?\n/)
        .map((f) => f.trim())
        .filter(Boolean);

  if (!arquivos || arquivos.length === 0) return null;

  // Obter tamanhos dos blobs versionados via git cat-file (imune a CRLF/LF da árvore de trabalho)
  const mapaTamanhos = new Map();
  try {
    const input = arquivos.map((f) => `${commitBase}:${f}`).join("\n");
    const saida = execSync("git cat-file --batch-check", {
      cwd: repoRoot,
      input,
      encoding: "utf8",
    })
      .trim()
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    for (let i = 0; i < arquivos.length; i++) {
      const linha = saida[i];
      if (linha && !linha.includes("missing")) {
        const partes = linha.split(" ");
        const tamanho = parseInt(partes[2], 10);
        if (!isNaN(tamanho)) {
          mapaTamanhos.set(arquivos[i], tamanho);
        }
      }
    }
  } catch {
    // Fallback item a item com git cat-file -s
    for (const f of arquivos) {
      try {
        const t = parseInt(
          execSync(`git cat-file -s ${commitBase}:${f}`, { cwd: repoRoot, encoding: "utf8" }).trim(),
          10
        );
        if (!isNaN(t)) mapaTamanhos.set(f, t);
      } catch {}
    }
  }

  const lista = [];
  for (const relRepo of arquivos) {
    const rel = relRepo.replace(/^docs\/verificacoes\//, "");
    let tamanhoBytes = mapaTamanhos.get(relRepo);

    // Fallback se faltou no lote
    if (tamanhoBytes === undefined) {
      try {
        const t = parseInt(
          execSync(`git cat-file -s ${commitBase}:${relRepo}`, { cwd: repoRoot, encoding: "utf8" }).trim(),
          10
        );
        if (!isNaN(t)) tamanhoBytes = t;
      } catch {}
    }

    if (tamanhoBytes !== undefined) {
      const nome = path.basename(rel);
      const matchData = nome.match(/(\d{4}-\d{2}-\d{2})/);
      const dataStr = matchData ? matchData[1] : "sem data no nome";
      lista.push({ caminho: rel, data: dataStr, tamanhoBytes });
    }
  }

  lista.sort((a, b) => a.caminho.localeCompare(b.caminho));
  return lista;
}

/**
 * Gera o texto markdown do estado atual do projeto por medição estrita
 */
export async function gerarEstadoMarkdown(opcoes = {}) {
  const repoRoot = opcoes.repoRoot || ROOT;
  const caminhoDecisoes = path.join(repoRoot, "src", "config", "decisoes.ts");
  const caminhoVitestConfig = path.join(repoRoot, "vitest.config.mts");
  const caminhoVitestVivoConfig = path.join(repoRoot, "vitest.vivo.config.mts");
  const caminhoRemedicao = path.join(repoRoot, "docs", "verificacoes", "remedicao_candidatos_bp3_d16_2026-09-30.json");
  const caminhoPreRegistro = path.join(repoRoot, "scripts", "d25", "config_pre_registro_PROPOSTA.json");
  const caminhoPerfis = path.join(repoRoot, "src", "lib", "matriz", "perfis.ts");
  const dirVerificacoes = path.join(repoRoot, "docs", "verificacoes");
  const caminhoGitHead = path.join(repoRoot, ".git", "HEAD");

  // Lista de fontes que existem no disco para a primeira linha
  const fontesExistentes = [];
  const candidatas = [
    caminhoGitHead,
    caminhoDecisoes,
    caminhoVitestConfig,
    caminhoVitestVivoConfig,
    caminhoRemedicao,
    caminhoPreRegistro,
    caminhoPerfis,
    dirVerificacoes,
  ];

  for (const c of candidatas) {
    if (fs.existsSync(c)) {
      fontesExistentes.push(path.relative(repoRoot, c).replace(/\\/g, "/"));
    }
  }

  const linhas = [];

  // Resolução do commit base para estabilidade pós-commit
  let commitBase = "HEAD";
  if (!opcoes.forcarNovoHead && fs.existsSync(ARQUIVO_ESTADO_MD)) {
    try {
      const conteudoDisco = fs.readFileSync(ARQUIVO_ESTADO_MD, "utf8");
      const matchHead = conteudoDisco.match(/Commit HEAD:\s*`([a-f0-9]+)`/);
      if (matchHead && matchHead[1]) {
        commitBase = matchHead[1];
      }
    } catch {}
  }

  // Linha 1 obrigatória de rastreabilidade
  linhas.push("FONTE_DOS_DADOS\t" + fontesExistentes.join("\t"));
  linhas.push("");
  linhas.push("# Painel de Estado Atual do Projeto — SAREL");
  linhas.push("");

  // SEÇÃO 1: Controle de Versão (Git)
  linhas.push("## 1. Controle de Versão (Git)");
  try {
    const saidaGit = execSync(`git log -5 --format="%H|%ci|%h %s" ${commitBase}`, { cwd: repoRoot, encoding: "utf8" })
      .trim()
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (saidaGit.length > 0) {
      const [headHash, headData, primeiroCommit] = saidaGit[0].split("|");
      const ultimosCommits = [primeiroCommit, ...saidaGit.slice(1).map((l) => l.split("|")[2])];

      linhas.push(`- Commit HEAD: \`${headHash}\``);
      linhas.push(`- Data do HEAD: ${headData}`);
      linhas.push("- Últimos 5 commits:");
      for (let i = 0; i < ultimosCommits.length; i++) {
        linhas.push(`  ${i + 1}. \`${ultimosCommits[i]}\``);
      }
    } else {
      linhas.push("AUSENTE (nenhum commit retornado)");
    }
  } catch {
    linhas.push("AUSENTE (falha na leitura de dados do Git)");
  }
  linhas.push("");

  // SEÇÃO 2: Testes
  linhas.push("## 2. Testes Automatizados");
  let lsFiles = null;
  try {
    lsFiles = execSync("git ls-files", { cwd: repoRoot, encoding: "utf8" })
      .trim()
      .split(/\r?\n/)
      .map((f) => f.trim())
      .filter(Boolean);

    const tsHermeticos = lsFiles.filter((f) => f.startsWith("src/") && f.endsWith(".test.ts") && !f.endsWith(".vivo.test.ts"));
    const tsVivos = lsFiles.filter((f) => f.startsWith("src/") && f.endsWith(".vivo.test.ts"));
    const pyTestes = lsFiles.filter((f) => f.endsWith(".py") && (path.basename(f).startsWith("test_") || f.includes("/test_")));
    const totalVersionados = tsHermeticos.length + tsVivos.length + pyTestes.length;

    linhas.push(`- Arquivos de teste versionados no repositório: ${totalVersionados}`);
    linhas.push(`  - TypeScript herméticos (\`src/**/*.test.ts\`): ${tsHermeticos.length}`);
    linhas.push(`  - TypeScript vivos (\`src/**/*.vivo.test.ts\`): ${tsVivos.length}`);
    linhas.push(`  - Python (\`test_*.py\` em \`scripts/\` e \`docs/\`): ${pyTestes.length}`);
    linhas.push(`- Arquivos de teste executados na suíte padrão hermética (\`npm run test\`): ${tsHermeticos.length}`);
    linhas.push("- Diferença explicada pelas configurações do Vitest:");
    linhas.push(`  - \`vitest.config.mts\`: seleciona exclusivamente \`src/**/*.test.ts\` (${tsHermeticos.length} arquivos) e exclui \`src/**/*.vivo.test.ts\`.`);
    linhas.push(`  - \`vitest.vivo.config.mts\`: seleciona exclusivamente os ${tsVivos.length} testes vivos (\`src/**/*.vivo.test.ts\`), executados via \`npm run test:vivo\` por dependerem de infraestrutura pesada local fora do Git (\`data/fundiario_brasil.db\` e DEM Copernicus GLO-30 em \`data/dem_cache/\`).`);
    linhas.push(`  - Testes em Python (${pyTestes.length} arquivos): executados no ambiente Python (\`pytest\` / runners em \`scripts/\`), desacoplados da suíte Vitest.`);
  } catch {
    linhas.push("AUSENTE (falha ao inventariar arquivos de teste)");
  }
  linhas.push("");

  // SEÇÃO 3: Decisões (src/config/decisoes.ts)
  linhas.push("## 3. Decisões Metodológicas (`src/config/decisoes.ts`)");
  let decisoesObj = null;
  let parametrosObj = null;
  if (fs.existsSync(caminhoDecisoes)) {
    try {
      const urlDecisoes = pathToFileURL(caminhoDecisoes).href;
      const mod = await import(urlDecisoes);
      decisoesObj = mod.DECISOES;
      parametrosObj = mod.PARAMETROS;
    } catch {
      decisoesObj = null;
      parametrosObj = null;
    }
  }

  if (decisoesObj) {
    const agrup = agruparPorEstado(decisoesObj, "D");
    linhas.push(`- Maior ID existente: \`${agrup.maiorId}\``);
    linhas.push(`- Total de decisões registradas: ${agrup.total}`);
    linhas.push("- Decisões agrupadas por estado:");
    linhas.push(`  - Decididas (${agrup.grupos.decidida.length}): ${agrup.grupos.decidida.length > 0 ? agrup.grupos.decidida.join(", ") : "(nenhuma)"}`);
    linhas.push(`  - Propostas (${agrup.grupos.proposta.length}): ${agrup.grupos.proposta.length > 0 ? agrup.grupos.proposta.join(", ") : "(nenhuma)"}`);
    linhas.push(`  - Pendentes (${agrup.grupos.pendente.length}): ${agrup.grupos.pendente.length > 0 ? agrup.grupos.pendente.join(", ") : "(nenhuma)"}`);
  } else {
    linhas.push("AUSENTE");
  }
  linhas.push("");

  // SEÇÃO 4: Parâmetros Operacionais (PARAMETROS)
  linhas.push("## 4. Parâmetros Operacionais (`PARAMETROS`)");
  if (parametrosObj) {
    const agrupP = agruparPorEstado(parametrosObj, "P");
    linhas.push(`- Maior ID existente: \`${agrupP.maiorId}\``);
    linhas.push(`- Total de parâmetros registrados: ${agrupP.total}`);
    linhas.push("- Parâmetros agrupados por estado:");
    linhas.push(`  - Decididos (${agrupP.grupos.decidida.length}): ${agrupP.grupos.decidida.length > 0 ? agrupP.grupos.decidida.join(", ") : "(nenhum)"}`);
    linhas.push(`  - Propostos (${agrupP.grupos.proposta.length}): ${agrupP.grupos.proposta.length > 0 ? agrupP.grupos.proposta.join(", ") : "(nenhum)"}`);
    linhas.push(`  - Pendentes (${agrupP.grupos.pendente.length}): ${agrupP.grupos.pendente.length > 0 ? agrupP.grupos.pendente.join(", ") : "(nenhum)"}`);
  } else {
    linhas.push("AUSENTE");
  }
  linhas.push("");

  // SEÇÃO 5: Sorteio D16 e Funil de Candidatos
  linhas.push("## 5. Sorteio D16 e Funil de Candidatos (`docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json`)");
  if (fs.existsSync(caminhoRemedicao)) {
    try {
      const remedicao = JSON.parse(fs.readFileSync(caminhoRemedicao, "utf8"));
      linhas.push(`- \`statusSorteio\`: ${remedicao.statusSorteio ?? "AUSENTE"}`);
      linhas.push("- \`funilContagem\`:");
      linhas.push("  | Etapa do Funil | Contagem Medida |");
      linhas.push("  |---|---|");
      const funil = remedicao.funilContagem || {};
      for (const [etapa, contagem] of Object.entries(funil)) {
        linhas.push(`  | ${etapa} | ${contagem} |`);
      }
    } catch {
      linhas.push("AUSENTE (falha no parse do arquivo)");
    }
  } else {
    linhas.push("AUSENTE");
  }
  linhas.push("");

  // SEÇÃO 6: Preditores Pré-Registrados vs Perfis de Matriz
  linhas.push("## 6. Preditores Pré-Registrados vs Perfis de Matriz");
  const existeConfig = fs.existsSync(caminhoPreRegistro);
  const existePerfis = fs.existsSync(caminhoPerfis);

  if (existeConfig && existePerfis) {
    try {
      const cfg = JSON.parse(fs.readFileSync(caminhoPreRegistro, "utf8"));
      const perfis = extrairPerfis(caminhoPerfis);

      const listaTreino = perfis?.get("matriz-treino") || [];
      const listaHeldout = perfis?.get("matriz-heldout") || [];
      const listaPlanilha = perfis?.get("planilha") || [];

      linhas.push(`- Configuração de pré-registro: \`scripts/d25/config_pre_registro_PROPOSTA.json\``);
      linhas.push(`- Definição de perfis: \`src/lib/matriz/perfis.ts\``);
      linhas.push("");
      linhas.push("| Bloco | Preditor Declarado | Coluna em `matriz-treino` | Coluna em `matriz-heldout` | Coluna em `planilha` |");
      linhas.push("|---|---|:---:|:---:|:---:|");

      const blocos = cfg.blocos || {};
      for (const [bloco, preditores] of Object.entries(blocos)) {
        for (const pred of preditores) {
          const emTreino = listaTreino.includes(pred) ? "SIM" : "NÃO";
          const emHeldout = listaHeldout.includes(pred) ? "SIM" : "NÃO";
          const emPlanilha = listaPlanilha.includes(pred) ? "SIM" : "NÃO";
          linhas.push(`| ${bloco} | \`${pred}\` | ${emTreino} | ${emHeldout} | ${emPlanilha} |`);
        }
      }
    } catch {
      linhas.push("AUSENTE (falha ao cruzar preditores e perfis)");
    }
  } else {
    linhas.push("AUSENTE");
  }
  linhas.push("");

  // SEÇÃO 7: Arquivos de Evidência em docs/verificacoes/
  linhas.push("## 7. Arquivos de Evidência em `docs/verificacoes/`");
  const evidencias = listarArquivosVerificacoes(repoRoot, lsFiles, commitBase);
  if (evidencias && evidencias.length > 0) {
    linhas.push(`- Total de arquivos de evidência medidos: ${evidencias.length}`);
    linhas.push("");
    linhas.push("| Arquivo de Evidência | Data no Nome | Tamanho (bytes) |");
    linhas.push("|---|:---:|---:|");
    for (const ev of evidencias) {
      linhas.push(`| \`${ev.caminho}\` | ${ev.data} | ${ev.tamanhoBytes} |`);
    }
  } else {
    linhas.push("AUSENTE");
  }
  linhas.push("");

  return linhas.join("\n");
}

// Execução como script CLI direto
const args = process.argv.slice(2);
const modoGerar = args.includes("--gerar");
const modoVerificar = args.includes("--verificar");

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  if (modoVerificar) {
    if (!fs.existsSync(ARQUIVO_ESTADO_MD)) {
      console.error(`ERRO: Arquivo não encontrado: ${ARQUIVO_ESTADO_MD}`);
      process.exit(1);
    }
    const conteudoDisco = fs.readFileSync(ARQUIVO_ESTADO_MD, "utf8");
    const conteudoGerado = await gerarEstadoMarkdown();
    const res = compararEspelho(conteudoGerado, conteudoDisco);
    if (!res.identicos) {
      console.error("ESTADO.md no disco divergiu do estado medido do repositório.");
      console.error("Execute 'npm run estado' para sincronizar.");
      console.error(res.diferencas.join("\n"));
      process.exit(1);
    } else {
      console.log("OK: ESTADO.md está perfeitamente sincronizado com o repositório.");
      process.exit(0);
    }
  } else if (modoGerar) {
    const conteudo = await gerarEstadoMarkdown({ forcarNovoHead: true });
    fs.mkdirSync(path.dirname(ARQUIVO_ESTADO_MD), { recursive: true });
    fs.writeFileSync(ARQUIVO_ESTADO_MD, conteudo, "utf8");
    console.log(conteudo);
    console.error(`\n[OK] Estado atualizado com sucesso em ${path.relative(ROOT, ARQUIVO_ESTADO_MD)}.`);
  } else {
    // Sem argumentos: gera e imprime no stdout
    const conteudo = await gerarEstadoMarkdown();
    console.log(conteudo);
  }
}
