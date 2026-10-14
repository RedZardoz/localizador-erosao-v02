#!/usr/bin/env node
// Verificador de SHA-256 portatil (Windows, Linux, macOS) para os manifestos do prompt do executor.
// Uso: node verificar_sha256.mjs <manifesto> [--base <pasta>]
//   manifesto: linhas "<sha256>  <caminho relativo a --base>" (formato do sha256sum).
//   --base: pasta de referencia dos caminhos (padrao: pasta atual).
// Arquivos de TEXTO (.md .py .ts .tsx .cjs .mjs .js .json .csv .txt .sha256 .gitignore) sao normalizados
// (CRLF -> LF) antes do hash: um clone no Windows com core.autocrlf=true muda os bytes, nao o conteudo.
// Binarios (.png .pdf .pptx .xls ...) sao lidos como estao. Saida: "OK|FALHOU  caminho"; exit 1 se algum falhar.
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname, basename } from "node:path";

const args = process.argv.slice(2);
const TEXTO = new Set([".md", ".py", ".ts", ".tsx", ".cjs", ".mjs", ".js", ".json", ".csv", ".txt", ".sha256", ".mts"]);
function hashNormalizado(caminho, rel) {
  let buf = readFileSync(caminho);
  if (TEXTO.has(extname(rel).toLowerCase()) || basename(rel).startsWith(".")) {
    buf = Buffer.from(buf.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
  }
  return createHash("sha256").update(buf).digest("hex");
}
// Modo gerador: node verificar_sha256.mjs --gerar arq1 arq2 ...  (imprime o manifesto com a MESMA normalizacao)
if (args[0] === "--gerar") {
  for (const f of args.slice(1)) console.log(`${hashNormalizado(resolve(f), f)}  ${f}`);
  process.exit(0);
}
const iBase = args.indexOf("--base");
const base = resolve(iBase >= 0 ? args[iBase + 1] : ".");
const manifesto = args.find((a, i) => !a.startsWith("--") && !(iBase >= 0 && i === iBase + 1));
if (!manifesto) { console.error("uso: node verificar_sha256.mjs <manifesto> [--base <pasta>]"); process.exit(2); }

let falhas = 0, total = 0;
for (const linha of readFileSync(manifesto, "utf8").split(/\r?\n/)) {
  const m = linha.match(/^([0-9a-fA-F]{64})\s+\*?(.+?)\s*$/);
  if (!m) continue;
  total++;
  const [, esperado, rel] = m;
  const caminho = resolve(base, rel);
  if (!existsSync(caminho)) { console.log(`FALHOU  ${rel}  (arquivo ausente)`); falhas++; continue; }
  const obtido = hashNormalizado(caminho, rel);
  if (obtido.toLowerCase() === esperado.toLowerCase()) console.log(`OK      ${rel}`);
  else { console.log(`FALHOU  ${rel}\n        esperado ${esperado}\n        obtido   ${obtido}`); falhas++; }
}
if (total === 0) { console.error("manifesto sem linhas validas"); process.exit(2); }
console.log(falhas === 0 ? `\n${total}/${total} OK` : `\n${falhas} de ${total} FALHARAM`);
process.exit(falhas === 0 ? 0 : 1);
