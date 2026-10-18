#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// 1. Script de Avaliação D25 de Referência (scripts/d25)
const AVALIADOR_PY = path.join(ROOT, "scripts", "d25", "avaliacao_d25_referencia.py");
const REQS_TXT = path.join(ROOT, "scripts", "d25", "requirements.txt");
const TARGET_AVALIADOR_TS = path.join(ROOT, "src", "lib", "export", "scriptAvaliacaoD25.generated.ts");

if (!fs.existsSync(AVALIADOR_PY)) {
  console.error("Arquivo não encontrado:", AVALIADOR_PY);
  process.exit(1);
}

const pyContent = fs.readFileSync(AVALIADOR_PY, "utf8").replace(/\r\n/g, "\n");
const reqsContent = fs.existsSync(REQS_TXT)
  ? fs.readFileSync(REQS_TXT, "utf8").replace(/\r\n/g, "\n")
  : "";
const sha256Avaliador = crypto.createHash("sha256").update(pyContent, "utf8").digest("hex");

const outputAvaliador = `// Arquivo gerado automaticamente por scripts/gerar_script_pacote.mjs — NÃO EDITE MANUALMENTE
export const SCRIPT_AVALIACAO_D25 = ${JSON.stringify(pyContent)};

export const SCRIPT_AVALIACAO_D25_SHA256 = ${JSON.stringify(sha256Avaliador)};

export const REQUIREMENTS_D25 = ${JSON.stringify(reqsContent)};
`;

fs.writeFileSync(TARGET_AVALIADOR_TS, outputAvaliador, "utf8");
console.log(`[OK] Gerado ${TARGET_AVALIADOR_TS} (SHA-256: ${sha256Avaliador})`);

// 2. Script de Verificação de Integridade (scripts/verificar_integridade_pacote.py)
const VERIFICADOR_PY = path.join(ROOT, "scripts", "verificar_integridade_pacote.py");
const TARGET_VERIFICADOR_TS = path.join(ROOT, "src", "lib", "export", "verificadorIntegridade.generated.ts");

if (!fs.existsSync(VERIFICADOR_PY)) {
  console.error("Arquivo não encontrado:", VERIFICADOR_PY);
  process.exit(1);
}

const verifContent = fs.readFileSync(VERIFICADOR_PY, "utf8").replace(/\r\n/g, "\n");
const sha256Verificador = crypto.createHash("sha256").update(verifContent, "utf8").digest("hex");

const outputVerificador = `// Arquivo gerado automaticamente por scripts/gerar_script_pacote.mjs — NÃO EDITE MANUALMENTE
export const VERIFICADOR_INTEGRIDADE = ${JSON.stringify(verifContent)};

export const VERIFICADOR_INTEGRIDADE_SHA256 = ${JSON.stringify(sha256Verificador)};
`;

fs.writeFileSync(TARGET_VERIFICADOR_TS, outputVerificador, "utf8");
console.log(`[OK] Gerado ${TARGET_VERIFICADOR_TS} (SHA-256: ${sha256Verificador})`);
