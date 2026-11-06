import fs from "node:fs";
const t = fs.readFileSync("src/lib/seguranca/padroesProibidos.ts", "utf8").split("\n");
const i0 = t.findIndex((l) => l.includes("LISTA_EXCECOES_AUTORIZADAS"));
let cur = null;
const out = [];
for (let i = i0 + 1; i < t.length; i++) {
  const l = t[i];
  if (/^\];/.test(l)) break;
  if (/^\s*\{\s*$/.test(l)) {
    cur = { linha: i + 1, id: "", arquivo: "", trecho: "", justificativa: "", autorizadoPor: "", padrao: "" };
    continue;
  }
  if (/^\s*\},?\s*$/.test(l) && cur) { out.push(cur); cur = null; continue; }
  if (!cur) continue;
  const m = l.match(/^\s*(id|arquivo|trecho|justificativa|autorizadoPor|padrao):\s*"(.*)",?\s*$/);
  if (m) cur[m[1]] = m[2];
}
console.log("TOTAL_DE_EXCECOES\t" + out.length);
console.log(["#", "linha", "id", "arquivo", "padrao", "trecho", "justificativa", "autorizadoPor"].join("\t"));
out.forEach((e, k) =>
  console.log([k + 1, e.linha, e.id, e.arquivo, e.padrao || "(sem tag)", e.trecho, e.justificativa, e.autorizadoPor].join("\t"))
);
const porTag = {};
for (const e of out) { const k = e.padrao || "(sem tag)"; porTag[k] = (porTag[k] || 0) + 1; }
console.log("\nCONTAGEM_POR_TAG");
Object.entries(porTag).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(v + "\t" + k));
