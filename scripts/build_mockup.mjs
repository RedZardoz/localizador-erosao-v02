import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const RAIZ = process.cwd();
const CONFIG_PRODUCAO = path.join(RAIZ, "next.config.mjs");
const CONFIG_VITRINE = path.join(RAIZ, "next.config.mockup.mjs");
const DIR_API = path.join(RAIZ, "src", "app", "api");
const DIR_OUT = path.join(RAIZ, "out");
const DIR_NEXT = path.join(RAIZ, ".next");
const DIR_DESTINO = path.join(RAIZ, "docs", "apresentacoes", "mockup");

function copiarRecursivo(origem, destino) {
  const stat = fs.statSync(origem);
  if (stat.isDirectory()) {
    fs.mkdirSync(destino, { recursive: true });
    for (const entrada of fs.readdirSync(origem, { withFileTypes: true })) {
      copiarRecursivo(
        path.join(origem, entrada.name),
        path.join(destino, entrada.name)
      );
    }
    return;
  }
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.copyFileSync(origem, destino);
}

function moverComFallbackExdev(origem, destino) {
  try {
    fs.renameSync(origem, destino);
  } catch (err) {
    if (err && err.code === "EXDEV") {
      copiarRecursivo(origem, destino);
      fs.rmSync(origem, { recursive: true, force: true });
    } else {
      throw err;
    }
  }
}

function calcularTotaisDiretorio(dir) {
  let bytesTotais = 0;
  let arquivosTotais = 0;
  if (!fs.existsSync(dir)) return { bytesTotais, arquivosTotais };

  const entradas = fs.readdirSync(dir, { withFileTypes: true });
  for (const entrada of entradas) {
    const caminhoCompleto = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      const sub = calcularTotaisDiretorio(caminhoCompleto);
      bytesTotais += sub.bytesTotais;
      arquivosTotais += sub.arquivosTotais;
    } else if (entrada.isFile()) {
      bytesTotais += fs.statSync(caminhoCompleto).size;
      arquivosTotais += 1;
    }
  }
  return { bytesTotais, arquivosTotais };
}

function escreverReadmeVitrine(bytesTotais, arquivosTotais) {
  const tamanhoMb = (bytesTotais / (1024 * 1024)).toFixed(2);
  const conteudo = `# [MOCKUP DEMONSTRATIVO] SAREL v2.0 — Demonstração Estática Offline

**Data do estado retratado:** 11/11/2026  
**Branch de origem:** Pesquisa de Mestrado PPGTCA 2026 — Erosão Laminar (BP3 / Paraná)  
**Tamanho aproximado do pacote:** ${tamanhoMb} MB (${arquivosTotais} arquivos)

## O que é este pacote

Este diretório contém uma **exportação estática e autossuficiente** (\`output: "export"\`) da interface web do **SAREL v2.0** em modo de demonstração para navegador, destinada a orientadores, avaliadores e financiadores conhecerem toda a arquitetura metodológica do projeto **sem necessidade de backend, servidor de banco ou credenciais**.

## Como abrir

Porque o Next.js App Router referencia ativos sob \`/_next/static/\`, a abertura direta via \`file://\` pode falhar ao resolver caminhos absolutos no sistema de arquivos. Sirva a pasta em um servidor HTTP estático local (sem acesso externo):

\`\`\`bash
# Opção 1 (Node.js / npx):
npx serve docs/apresentacoes/mockup -l 4173

# Opção 2 (Python 3):
python -m http.server -d docs/apresentacoes/mockup 4173
\`\`\`

Depois acesse no navegador: \`http://127.0.0.1:4173/\`

## O que mostra

- **Todas as 8 etapas da casca operacional** (\`BarraFluxoOperacional\`) e todos os modais do fluxo científico (Região, Candidatos, Medição Biofísica, Sorteio Estratificado D16, Calculadora Desenho Amostral, Campanha VANT & Coletor, Matriz de Treino D16/D26, Decisões D01–D26, Dossiê de Auditoria, Diagnóstico e Configurações).
- **Tour Metodológico completo (17 etapas)** com holofote (\`ApresentacaoSpotlight\`) guiando cada decisão do pipeline.
- **Mapa em grade local offline** com **12 pontos declaradamente sintéticos** (\`SINTETICO_NAO_VOAR_01\` a \`SINTETICO_NAO_VOAR_12\`, marcados com \`__SAREL_AVISO__: "SINTETICO_NAO_VOAR"\`), deslocados dentro da Bacia do Paraná 3 sem coincidir com os 677 imóveis reais.
- **Selo Público D16 redigido** (\`selo_publico_d16\`) mantendo apenas agregados por estrato e o hash criptográfico de integridade.

## O que NÃO faz (por construção e marcação de interface)

- **Zero rotas de API no pacote:** as 13 rotas \`/api/*\` de servidor foram omitidas na exportação estática; não há comunicação com Google Earth Engine, Embrapa, Mapbox remoto, Jev AI ou SQLite local.
- **Zero dados reais restritos ou segredos:** não contém coordenadas dos 677 candidatos reais, não contém códigos CAR, não contém nomes de proprietários e não embute chaves privadas ou tokens de acesso.
- **Botões operacionais preservados porém desabilitados:** todas as ações de gravação de rótulo, disparo de sorteio, medição no GEE, upload de planilhas, alteração de credenciais e exportação CSV/XLSX/KML/GPX permanecem visíveis para fins expositivos, desabilitadas com aviso explícito de que pertencem apenas ao ambiente operacional autenticado.
`;
  fs.writeFileSync(path.join(DIR_DESTINO, "README.md"), conteudo, "utf-8");
}

function executarConstrucaoVitrine() {
  if (!fs.existsSync(CONFIG_VITRINE)) {
    throw new Error(`Arquivo de configuração estática não encontrado: ${CONFIG_VITRINE}`);
  }

  const tempWorkDir = fs.mkdtempSync(path.join(os.tmpdir(), "sarel-vitrine-build-"));
  const configTempBackup = path.join(tempWorkDir, "next.config.mjs.bak");
  const apiTempBackup = path.join(tempWorkDir, "api");

  let configMovido = false;
  let apiMovida = false;

  try {
    console.log("[vitrine-build] 1/5 Preparando configuração estática isolada (sem alterar produção)...");
    moverComFallbackExdev(CONFIG_PRODUCAO, configTempBackup);
    configMovido = true;
    fs.copyFileSync(CONFIG_VITRINE, CONFIG_PRODUCAO);

    if (fs.existsSync(DIR_API)) {
      console.log("[vitrine-build] 2/5 Isolando rotas dinâmicas src/app/api fora do bundle estático...");
      moverComFallbackExdev(DIR_API, apiTempBackup);
      apiMovida = true;
    }

    fs.rmSync(DIR_NEXT, { recursive: true, force: true });
    fs.rmSync(DIR_OUT, { recursive: true, force: true });

    console.log("[vitrine-build] 3/5 Executando Next.js build com NEXT_PUBLIC_SAREL_MOCKUP=true...");
    const nextBinLocal = path.join(RAIZ, "node_modules", "next", "dist", "bin", "next");
    const envVitrine = {
      ...process.env,
      NEXT_PUBLIC_SAREL_MOCKUP: "true",
    };

    const res = fs.existsSync(nextBinLocal)
      ? spawnSync(process.execPath, [nextBinLocal, "build"], {
          cwd: RAIZ,
          stdio: "inherit",
          env: envVitrine,
        })
      : spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "build"], {
          cwd: RAIZ,
          stdio: "inherit",
          shell: process.platform === "win32",
          env: envVitrine,
        });

    if (res.status !== 0) {
      throw new Error(`next build falhou com código de saída ${String(res.status)}`);
    }
    if (!fs.existsSync(DIR_OUT)) {
      throw new Error(`Diretório de saída estática 'out/' não foi gerado.`);
    }

    console.log(`[vitrine-build] 4/5 Publicando pacote estático em ${path.relative(RAIZ, DIR_DESTINO)}...`);
    fs.rmSync(DIR_DESTINO, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(DIR_DESTINO), { recursive: true });
    copiarRecursivo(DIR_OUT, DIR_DESTINO);

    escreverReadmeVitrine(0, 0);
    let finais = calcularTotaisDiretorio(DIR_DESTINO);
    for (let passo = 0; passo < 3; passo += 1) {
      escreverReadmeVitrine(finais.bytesTotais, finais.arquivosTotais);
      const aposEscrita = calcularTotaisDiretorio(DIR_DESTINO);
      if (
        aposEscrita.bytesTotais === finais.bytesTotais &&
        aposEscrita.arquivosTotais === finais.arquivosTotais
      ) {
        finais = aposEscrita;
        break;
      }
      finais = aposEscrita;
    }
    console.log("[vitrine-build] 5/5 Limpando artefatos temporários (.next / out)...");
    fs.rmSync(DIR_OUT, { recursive: true, force: true });
    fs.rmSync(DIR_NEXT, { recursive: true, force: true });

    const mb = (finais.bytesTotais / (1024 * 1024)).toFixed(2);
    console.log(
      `[vitrine-build] CONCLUIDO: ${finais.arquivosTotais} arquivos (${mb} MB / ${finais.bytesTotais} bytes) em docs/apresentacoes/mockup`
    );
  } finally {
    if (apiMovida && fs.existsSync(apiTempBackup)) {
      moverComFallbackExdev(apiTempBackup, DIR_API);
    }
    if (configMovido && fs.existsSync(configTempBackup)) {
      fs.rmSync(CONFIG_PRODUCAO, { force: true });
      moverComFallbackExdev(configTempBackup, CONFIG_PRODUCAO);
    }
    fs.rmSync(tempWorkDir, { recursive: true, force: true });
  }
}

executarConstrucaoVitrine();
