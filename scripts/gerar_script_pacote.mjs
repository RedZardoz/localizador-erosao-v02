#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const AVALIADOR_PY = path.join(ROOT, "scripts", "d25", "avaliacao_d25_referencia.py");
const REQS_TXT = path.join(ROOT, "scripts", "d25", "requirements.txt");
const TARGET_TS = path.join(ROOT, "src", "lib", "export", "scriptAvaliacaoD25.generated.ts");

if (!fs.existsSync(AVALIADOR_PY)) {
  console.error("Arquivo não encontrado:", AVALIADOR_PY);
  process.exit(1);
}

// Normaliza quebras de linha para LF para consistência cross-platform
const pyContent = fs.readFileSync(AVALIADOR_PY, "utf8").replace(/\r\n/g, "\n");
const reqsContent = fs.existsSync(REQS_TXT)
  ? fs.readFileSync(REQS_TXT, "utf8").replace(/\r\n/g, "\n")
  : "";

const sha256 = crypto.createHash("sha256").update(pyContent, "utf8").digest("hex");

const outputContent = `// Arquivo gerado automaticamente por scripts/gerar_script_pacote.mjs — NÃO EDITE MANUALMENTE
export const SCRIPT_AVALIACAO_D25 = ${JSON.stringify(pyContent)};

export const SCRIPT_AVALIACAO_D25_SHA256 = ${JSON.stringify(sha256)};

export const REQUIREMENTS_D25 = ${JSON.stringify(reqsContent)};
`;

fs.writeFileSync(TARGET_TS, outputContent, "utf8");
console.log(`[OK] Gerado ${TARGET_TS} (SHA-256: ${sha256})`);
