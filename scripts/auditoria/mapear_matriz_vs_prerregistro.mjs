import fs from "node:fs";

const ARQ_PERFIS = "src/lib/matriz/perfis.ts";
const ARQ_CONFIG = "scripts/d25/config_pre_registro_PROPOSTA.json";

const linhas = fs.readFileSync(ARQ_PERFIS, "utf8").split("\n");
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

console.log("PERFIS_E_CONTAGENS");
console.log(["perfil", "n_colunas"].join("\t"));
for (const [nome, cols] of perfis) console.log([nome, cols.length].join("\t"));

const cfg = JSON.parse(fs.readFileSync(ARQ_CONFIG, "utf8"));
const preditores = new Map();
for (const [bloco, lista] of Object.entries(cfg.blocos)) {
  for (const c of lista) preditores.set(c, bloco);
}

console.log("");
console.log("PRERREGISTRO");
console.log(["campo", "valor"].join("\t"));
console.log(["alvo", cfg.alvo].join("\t"));
console.log(["grupo", cfg.grupo].join("\t"));
console.log(["rusle_A", cfg.rusle.A].join("\t"));
console.log(["n_preditores", preditores.size].join("\t"));
for (const [bloco, lista] of Object.entries(cfg.blocos)) {
  console.log(["bloco:" + bloco, lista.join(", ")].join("\t"));
}

const ALVOS_CONHECIDOS = ["Fracao_Erodida", "Alvo_Binario_25", "Classe_Alvo_Binaria", "Rotulo_Classe"];
const universo = new Set();
for (const cols of perfis.values()) for (const c of cols) universo.add(c);
for (const c of preditores.keys()) universo.add(c);
universo.add(cfg.rusle.A);

const PERFIS_MATRIZ = ["matriz-treino", "matriz-heldout"];
console.log("");
console.log("PARIDADE_PERFIS_x_PRERREGISTRO");
console.log(["coluna", "matriz-treino", "matriz-heldout", "planilha", "bloco_prerregistro", "e_alvo"].join("\t"));
[...universo].sort().forEach((c) => {
  const emT = perfis.has("matriz-treino") && perfis.get("matriz-treino").includes(c) ? "SIM" : "nao";
  const emH = perfis.has("matriz-heldout") && perfis.get("matriz-heldout").includes(c) ? "SIM" : "nao";
  const emP = perfis.has("planilha") && perfis.get("planilha").includes(c) ? "SIM" : "nao";
  const bl = preditores.has(c) ? preditores.get(c) : "(nao declarado)";
  const alvo = ALVOS_CONHECIDOS.includes(c) ? "ALVO" : "";
  console.log([c, emT, emH, emP, bl, alvo].join("\t"));
});

console.log("");
console.log("RESUMO");
for (const p of PERFIS_MATRIZ) {
  if (!perfis.has(p)) continue;
  const cols = perfis.get(p);
  const declarados = cols.filter((c) => preditores.has(c)).length;
  const alvos = cols.filter((c) => ALVOS_CONHECIDOS.includes(c));
  console.log([p, "colunas=" + cols.length, "preditores_declarados=" + declarados, "colunas_de_alvo=" + alvos.length + " (" + alvos.join(", ") + ")"].join("\t"));
}
const semColuna = [...preditores.keys()].filter((c) => !perfis.get("matriz-treino").includes(c));
console.log(["preditores_declarados_SEM_coluna_em_matriz-treino", semColuna.join(", ") || "(nenhum)"].join("\t"));
console.log(["coluna_rusle_A_em_matriz-treino", perfis.get("matriz-treino").includes(cfg.rusle.A) ? "SIM" : "NAO"].join("\t"));
