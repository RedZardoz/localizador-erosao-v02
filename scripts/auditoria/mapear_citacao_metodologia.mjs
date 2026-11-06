import fs from "node:fs";
import { execSync } from "node:child_process";

const ALVO = "Metodologia PPGTCA 2026";
const ARQUIVO_REGISTRO = "src/config/decisoes.ts";
const JANELA_TITULO = 6;

const bruto = fs.readFileSync(ARQUIVO_REGISTRO, "utf8");
const t = bruto.split("\n");
const titulos = new Map();
let idAtual = "(fora de entrada)";

console.log("OCORRENCIAS_EM_decisoes.ts");
console.log(["linha", "id", "titulo"].join("\t"));

for (let i = 0; i < t.length; i++) {
  const m = t[i].match(/^\s{2}([DP]\d+):\s*\{/);
  if (m) {
    idAtual = m[1];
    let tit = "(titulo nao lido)";
    const fim = i + JANELA_TITULO < t.length ? i + JANELA_TITULO : t.length;
    for (let j = i + 1; j < fim; j++) {
      const g = t[j].match(/^\s*titulo:\s*"(.*?)",?\s*$/);
      if (g) {
        tit = g[1];
        break;
      }
    }
    titulos.set(idAtual, tit);
  }
  if (t[i].includes(ALVO)) {
    const tit = titulos.has(idAtual) ? titulos.get(idAtual) : "(titulo nao lido)";
    console.log([i + 1, idAtual, tit].join("\t"));
  }
}

const ids = [...bruto.matchAll(/^\s{2}D(\d+):\s*\{/gm)].map((m) => Number(m[1]));
console.log("");
console.log("MAIOR_ID_D_NO_REGISTRO\tD" + Math.max(...ids));

function escopoDe(caminho) {
  if (caminho.startsWith("src/") || caminho.startsWith("scripts/")) return "A_CODIGO";
  if (caminho.startsWith("docs/auditorias/")) return "C_TEXTO_ARQUIVADO";
  if (caminho.includes("/prompts/")) return "C_TEXTO_ARQUIVADO";
  return "B_DOCUMENTACAO_ATIVA";
}

const saida = execSync('git grep -n "' + ALVO + '" -- src scripts docs', { encoding: "utf8" });
const linhas = [];
for (const l of saida.split("\n")) {
  if (l.trim() === "") continue;
  const p = l.split(":");
  if (p[0] === ARQUIVO_REGISTRO) continue;
  linhas.push({ escopo: escopoDe(p[0]), arquivo: p[0], linha: p[1] });
}

console.log("");
console.log("OCORRENCIAS_NO_RESTO_DO_REPOSITORIO");
console.log(["escopo", "arquivo", "linha"].join("\t"));
linhas
  .sort((a, b) => (a.escopo + a.arquivo).localeCompare(b.escopo + b.arquivo))
  .forEach((r) => console.log([r.escopo, r.arquivo, r.linha].join("\t")));

const porEscopo = new Map();
const arquivosPorEscopo = new Map();
for (const r of linhas) {
  const n = porEscopo.has(r.escopo) ? porEscopo.get(r.escopo) : 0;
  porEscopo.set(r.escopo, n + 1);
  if (!arquivosPorEscopo.has(r.escopo)) arquivosPorEscopo.set(r.escopo, new Set());
  arquivosPorEscopo.get(r.escopo).add(r.arquivo);
}
console.log("");
console.log("RESUMO_POR_ESCOPO");
console.log(["escopo", "ocorrencias", "arquivos"].join("\t"));
[...porEscopo.entries()].sort().forEach(([k, v]) => console.log([k, v, arquivosPorEscopo.get(k).size].join("\t")));
