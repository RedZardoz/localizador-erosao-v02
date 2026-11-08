import fs from "node:fs";

const t = fs.readFileSync("src/lib/seguranca/padroesProibidos.ts", "utf8").split("\n");
const i0 = t.findIndex((l) => l.includes("LISTA_EXCECOES_AUTORIZADAS"));
const CAMPOS = ["id", "arquivo", "trecho", "justificativa", "autorizadoPor", "padrao"];
const SEM_TAG = "(sem tag)";
let cur = null;
const out = [];

for (let i = i0 + 1; i < t.length; i++) {
  const l = t[i];
  if (/^\];/.test(l)) break;
  if (/^\s*\{\s*$/.test(l)) {
    cur = { linha: i + 1 };
    for (const c of CAMPOS) cur[c] = "";
    continue;
  }
  if (/^\s*\},?\s*$/.test(l) && cur) {
    out.push(cur);
    cur = null;
    continue;
  }
  if (cur === null) continue;
  const m = l.match(/^\s*(id|arquivo|trecho|justificativa|autorizadoPor|padrao):\s*"(.*)",?\s*$/);
  if (m) cur[m[1]] = m[2];
}

function tagDe(e) {
  return e.padrao === "" ? SEM_TAG : e.padrao;
}

console.log("FONTE_DOS_DADOS\tsrc/lib/seguranca/padroesProibidos.ts");
console.log("TOTAL_DE_EXCECOES\t" + out.length);
console.log(["#", "linha", "id", "arquivo", "padrao", "trecho", "justificativa", "autorizadoPor"].join("\t"));
out.forEach((e, k) =>
  console.log([k + 1, e.linha, e.id, e.arquivo, tagDe(e), e.trecho, e.justificativa, e.autorizadoPor].join("\t"))
);

const porTag = new Map();
for (const e of out) {
  const k = tagDe(e);
  const atual = porTag.has(k) ? porTag.get(k) : 0;
  porTag.set(k, atual + 1);
}
console.log("");
console.log("CONTAGEM_POR_TAG");
[...porTag.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(v + "\t" + k));
