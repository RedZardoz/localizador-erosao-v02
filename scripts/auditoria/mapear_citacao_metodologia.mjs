import fs from "node:fs";
import { execSync } from "node:child_process";
const ALVO = "Metodologia PPGTCA 2026";
const t = fs.readFileSync("src/config/decisoes.ts", "utf8").split("\n");
const titulos = {};
let idAtual = "(fora de entrada)";
console.log("OCORRENCIAS_EM_decisoes.ts");
console.log(["linha", "id", "titulo"].join("\t"));
for (let i = 0; i < t.length; i++) {
  const m = t[i].match(/^\s{2}([DP]\d+):\s*\{/);
  if (m) {
    idAtual = m[1];
    let tit = "(titulo nao lido)";
    for (let j = i + 1; j < Math.min(i + 6, t.length); j++) {
      const g = t[j].match(/^\s*titulo:\s*"(.*?)",?\s*$/);
      if (g) { tit = g[1]; break; }
    }
    titulos[idAtual] = tit;
  }
  if (t[i].includes(ALVO)) console.log([i + 1, idAtual, titulos[idAtual] || "(titulo nao lido)"].join("\t"));
}
const ids = [...fs.readFileSync("src/config/decisoes.ts", "utf8").matchAll(/^\s{2}D(\d+):\s*\{/gm)].map((m) => Number(m[1]));
console.log("\nMAIOR_ID_D_NO_REGISTRO\tD" + Math.max(...ids));
console.log("\nOCORRENCIAS_NO_RESTO_DO_REPOSITORIO");
const saida = execSync('git grep -n "' + ALVO + '" -- src scripts docs', { encoding: "utf8" });
for (const l of saida.split("\n")) {
  if (!l.trim()) continue;
  if (l.startsWith("src/config/decisoes.ts:")) continue;
  const p = l.split(":");
  console.log(p[0] + "\t" + p[1]);
}
