#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DECISOES, PARAMETROS } from "../src/config/decisoes.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ARQUIVO_MD = path.join(ROOT, "docs", "planejamento", "DECISOES.md");

const args = process.argv.slice(2);
const modoVerificar = args.includes("--verificar");
const modoGerar = args.includes("--gerar");

/**
 * Extrai mapa de id -> estado do arquivo DECISOES.md existente.
 */
export function extrairDecisoesDoMd(conteudoMd) {
  const mapa = new Map();
  const linhas = conteudoMd.split(/\r?\n/);
  let secaoAtual = "";

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i].trim();
    if (l.startsWith("## ")) {
      secaoAtual = l;
    }

    // 1. Linhas de tabela markdown: | **D01** | ... | Estado | ...
    const matchTabela = l.match(/^\|\s*\*\*([DP]\d{2})\*\*\s*\|([^|]+)\|([^|]+)\|/);
    if (matchTabela) {
      const id = matchTabela[1];
      const col3 = matchTabela[3].trim();
      let estado = null;
      if (/decidid/i.test(col3)) estado = "decidida";
      else if (/propost/i.test(col3)) estado = "proposta";
      else if (/pendent/i.test(col3)) estado = "pendente";
      else if (/propost/i.test(secaoAtual)) estado = "proposta";
      else if (/decidid/i.test(secaoAtual)) estado = "decidida";

      if (estado && !mapa.has(id)) {
        mapa.set(id, estado);
      }
    }

    // 2. Seções detalhadas ### D01 — ...
    const matchSecao = l.match(/^###\s*([DP]\d{2})\b/);
    if (matchSecao) {
      const id = matchSecao[1];
      for (let j = i + 1; j < linhas.length && j < i + 20; j++) {
        const lj = linhas[j].trim();
        if (lj.startsWith("### ")) break;
        if (/estado/i.test(lj)) {
          if (/decidid/i.test(lj)) {
            mapa.set(id, "decidida");
            break;
          } else if (/propost/i.test(lj)) {
            mapa.set(id, "proposta");
            break;
          } else if (/pendent/i.test(lj)) {
            mapa.set(id, "pendente");
            break;
          }
        }
      }
    }
  }

  return mapa;
}

function formatarEstadoBadge(estado) {
  switch (estado) {
    case "decidida":
      return "✅ **Decidida**";
    case "proposta":
      return "🛑 **Proposta**";
    case "pendente":
      return "⏳ **Pendente**";
    default:
      return estado;
  }
}

function formatarEstadoTabela(estado) {
  switch (estado) {
    case "decidida":
      return "✅ Decidida";
    case "proposta":
      return "🛑 Proposta";
    case "pendente":
      return "⏳ Pendente";
    default:
      return estado;
  }
}

function formatarValorTabela(valor) {
  if (valor === undefined || valor === null) return "—";
  if (typeof valor === "object") {
    return JSON.stringify(valor).replace(/\|/g, "\\|");
  }
  const str = String(valor).replace(/\r?\n/g, " ").replace(/\|/g, "\\|");
  return str.length > 120 ? str.slice(0, 117) + "..." : str;
}

function formatarValorDetalhe(valor) {
  if (valor === undefined || valor === null) return "—";
  if (typeof valor === "object") {
    return JSON.stringify(valor);
  }
  return String(valor).replace(/\r?\n/g, "<br/>").replace(/\|/g, "\\|");
}

export function gerarMarkdownDecisoes() {
  const listaDecisoes = Object.values(DECISOES).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const listaParametros = Object.values(PARAMETROS).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const partes = [];

  partes.push("# Registro de Decisões Metodológicas — SAREL");
  partes.push("");
  partes.push("**Espelho legível e auditável de `src/config/decisoes.ts`.**  ");
  partes.push(`Gerado automaticamente via \`npm run decisoes:md\` em ${new Date().toISOString().slice(0, 10)}.`);
  partes.push("");
  partes.push("> **Regra 9 do SAREL (Governança Metodológica):**  ");
  partes.push("> Todo parâmetro metodológico tem dono e registro. Decisão pendente gera estado `indisponivel` com causa `\"decisao-pendente\"` e o respectivo ID. **Somente o pesquisador tem autoridade para mudar uma decisão para `\"decidida\"`.**");
  partes.push("");
  partes.push("---");
  partes.push("");
  partes.push("## 1. Quadro Resumo de Decisões Metodológicas");
  partes.push("");
  partes.push("| ID | Título da Decisão | Estado | Valor / Diretriz Adotada | Decidido Em |");
  partes.push("|:---|:---|:---:|:---|:---:|");

  for (const d of listaDecisoes) {
    const decididoEm = d.decididoEm || "—";
    partes.push(`| **${d.id}** | ${d.titulo.replace(/\|/g, "\\|")} | ${formatarEstadoTabela(d.estado)} | ${formatarValorTabela(d.valor)} | ${decididoEm} |`);
  }

  partes.push("");
  partes.push("---");
  partes.push("");
  partes.push("## 2. Quadro Resumo de Parâmetros Operacionais");
  partes.push("");
  partes.push("| ID | Parâmetro | Estado | Valor / Diretriz | Decidido Em |");
  partes.push("|:---|:---|:---:|:---|:---:|");

  for (const p of listaParametros) {
    const decididoEm = p.decididoEm || "—";
    partes.push(`| **${p.id}** | ${p.titulo.replace(/\|/g, "\\|")} | ${formatarEstadoTabela(p.estado)} | ${formatarValorTabela(p.valor)} | ${decididoEm} |`);
  }

  partes.push("");
  partes.push("---");
  partes.push("");
  partes.push("## 3. Detalhamento das Decisões Metodológicas");
  partes.push("");

  for (const d of listaDecisoes) {
    partes.push(`### ${d.id} — ${d.titulo}`);
    partes.push("");
    partes.push("| Campo | Valor |");
    partes.push("|---|---|");
    partes.push(`| **Estado** | ${formatarEstadoBadge(d.estado)} |`);
    if (d.valor !== undefined) {
      partes.push(`| **Valor Adotado** | ${formatarValorDetalhe(d.valor)} |`);
    }
    if (d.referencia) {
      partes.push(`| **Referência** | ${d.referencia.replace(/\r?\n/g, "<br/>").replace(/\|/g, "\\|")} |`);
    }
    if (d.justificativa) {
      partes.push(`| **Justificativa** | ${d.justificativa.replace(/\r?\n/g, "<br/>").replace(/\|/g, "\\|")} |`);
    }
    partes.push(`| **Decidido por** | ${d.decididoPor || "—"} |`);
    partes.push(`| **Decidido em** | ${d.decididoEm || "—"} |`);
    partes.push("");
    partes.push("---");
    partes.push("");
  }

  partes.push("## 4. Detalhamento dos Parâmetros Operacionais");
  partes.push("");

  for (const p of listaParametros) {
    partes.push(`### ${p.id} — ${p.titulo}`);
    partes.push("");
    partes.push("| Campo | Valor |");
    partes.push("|---|---|");
    partes.push(`| **Estado** | ${formatarEstadoBadge(p.estado)} |`);
    if (p.valor !== undefined) {
      partes.push(`| **Valor Adotado** | ${formatarValorDetalhe(p.valor)} |`);
    }
    if (p.referencia) {
      partes.push(`| **Referência** | ${p.referencia.replace(/\r?\n/g, "<br/>").replace(/\|/g, "\\|")} |`);
    }
    if (p.justificativa) {
      partes.push(`| **Justificativa** | ${p.justificativa.replace(/\r?\n/g, "<br/>").replace(/\|/g, "\\|")} |`);
    }
    partes.push(`| **Decidido por** | ${p.decididoPor || "—"} |`);
    partes.push(`| **Decidido em** | ${p.decididoEm || "—"} |`);
    partes.push("");
    partes.push("---");
    partes.push("");
  }

  return partes.join("\n") + "\n";
}

function executarCli() {
  if (!modoVerificar && !modoGerar) {
    console.error("Uso: node --import ./scripts/ts-loader.mjs scripts/gerar_decisoes_md.mjs [--verificar | --gerar]");
    process.exit(2);
  }

  const mdExistente = fs.existsSync(ARQUIVO_MD) ? fs.readFileSync(ARQUIVO_MD, "utf8") : "";
  const mapaMd = extrairDecisoesDoMd(mdExistente);

  const mapaTs = new Map();
  for (const [id, d] of Object.entries(DECISOES)) mapaTs.set(id, d.estado);
  for (const [id, p] of Object.entries(PARAMETROS)) mapaTs.set(id, p.estado);

  const divergentes = [];
  const soNoTs = [];
  const soNoMd = [];

  for (const [id, estadoTs] of mapaTs.entries()) {
    if (!mapaMd.has(id)) {
      soNoTs.push(id);
    } else {
      const estadoMd = mapaMd.get(id);
      if (estadoMd !== estadoTs) {
        divergentes.push({ id, estadoTs, estadoMd });
      }
    }
  }

  for (const id of mapaMd.keys()) {
    if (!mapaTs.has(id)) {
      soNoMd.push(id);
    }
  }

  if (modoVerificar) {
    console.log("=== VERIFICAÇÃO DE PARIDADE: DECISOES.md <-> src/config/decisoes.ts ===");
    console.log(`Total no TS: ${mapaTs.size} | Total no MD: ${mapaMd.size}`);

    if (divergentes.length > 0 || soNoTs.length > 0 || soNoMd.length > 0) {
      if (divergentes.length > 0) {
        console.log(`\nIDs com Estado DIVERGENTE (${divergentes.length}):`);
        for (const d of divergentes) {
          console.log(`  - ${d.id}: TS = '${d.estadoTs}', MD = '${d.estadoMd}'`);
        }
      }
      if (soNoTs.length > 0) {
        console.log(`\nIDs presentes SÓ NO TS (${soNoTs.length}):`);
        console.log(`  ${soNoTs.join(", ")}`);
      }
      if (soNoMd.length > 0) {
        console.log(`\nIDs presentes SÓ NO MD (${soNoMd.length}):`);
        console.log(`  ${soNoMd.join(", ")}`);
      }
      console.log("\nFALHA: divergência detectada entre DECISOES.md e src/config/decisoes.ts.");
      process.exit(1);
    } else {
      console.log("\nOK: Paridade total confirmada entre DECISOES.md e src/config/decisoes.ts.");
      process.exit(0);
    }
  }

  if (modoGerar) {
    const novoConteudo = gerarMarkdownDecisoes();
    fs.writeFileSync(ARQUIVO_MD, novoConteudo, "utf8");
    console.log(`DECISOES.md gerado com sucesso a partir de src/config/decisoes.ts (${mapaTs.size} itens).`);
    process.exit(0);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  executarCli();
}
