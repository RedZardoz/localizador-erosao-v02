import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const BUILD_ID_PATH = path.join(projectRoot, '.next', 'BUILD_ID');

const CONFIG_FILES = [
  'package.json',
  'next.config.mjs',
  'tailwind.config.ts',
  'postcss.config.mjs',
];

function getFilesRecursively(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFilesRecursively(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkBuildFreshness() {
  if (!fs.existsSync(BUILD_ID_PATH)) {
    console.log('[AVISO] Build ausente (.next/BUILD_ID não encontrado).');
    process.exit(1);
  }

  let buildMtime;
  try {
    const buildStat = fs.statSync(BUILD_ID_PATH);
    buildMtime = buildStat.mtimeMs;
  } catch (err) {
    console.log(`[AVISO] Erro ao ler .next/BUILD_ID: ${err.message}`);
    process.exit(1);
  }

  const targetFiles = [];

  for (const relConfig of CONFIG_FILES) {
    const fullConfig = path.join(projectRoot, relConfig);
    if (fs.existsSync(fullConfig)) {
      targetFiles.push(fullConfig);
    }
  }

  const srcDir = path.join(projectRoot, 'src');
  targetFiles.push(...getFilesRecursively(srcDir));

  let newestFile = null;
  let newestMtime = -1;

  for (const file of targetFiles) {
    try {
      const stat = fs.statSync(file);
      if (stat.mtimeMs > newestMtime) {
        newestMtime = stat.mtimeMs;
        newestFile = file;
      }
    } catch {
      // Ignora arquivos inacessíveis temporariamente
    }
  }

  if (newestMtime > buildMtime && newestFile) {
    const relativePath = path.relative(projectRoot, newestFile).replace(/\\/g, '/');
    console.log(`[AVISO] Build defasado: ${relativePath} foi modificado após o último build.`);
    process.exit(1);
  }

  console.log('[OK] Build atualizado (.next/BUILD_ID é mais recente que os fontes).');
  process.exit(0);
}

checkBuildFreshness();
