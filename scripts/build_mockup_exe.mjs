import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const RAIZ = process.cwd();
const DIR_VITRINE = path.join(RAIZ, "docs", "apresentacoes", "mockup");
const ARQUIVO_CS = path.join(RAIZ, "scripts", "installer", "VitrineMockupLauncher.cs");
const ARQUIVO_ICONE = path.join(RAIZ, "assets", "icon.ico");
const ARQUIVO_EXE = path.join(
  RAIZ,
  "docs",
  "apresentacoes",
  "SAREL_Mockup_Demonstrativo_2026-11-11.exe"
);
const ARQUIVO_ZIP = path.join(
  RAIZ,
  "docs",
  "apresentacoes",
  "SAREL_Mockup_Demonstrativo_2026-11-11.zip"
);
const COMPILADOR_CSC =
  process.env.SAREL_CSC_EXE ||
  "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe";

const TABELA_CRC32 = (() => {
  const tabela = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tabela[n] = c >>> 0;
  }
  return tabela;
})();

function calcularCrc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc = TABELA_CRC32[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function listarArquivosRecursivo(dir, baseDir) {
  const resultado = [];
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const caminhoAbs = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      resultado.push(...listarArquivosRecursivo(caminhoAbs, baseDir));
    } else if (entrada.isFile()) {
      const rel = path.relative(baseDir, caminhoAbs).replace(/\\/g, "/");
      resultado.push({ caminhoRelativo: rel, caminhoAbsoluto: caminhoAbs });
    }
  }
  return resultado.sort((a, b) => a.caminhoRelativo.localeCompare(b.caminhoRelativo));
}

function criarZipBuffer(entradas) {
  const partesLocais = [];
  const partesCentrais = [];
  let deslocamento = 0;

  // Timestamp fixo reproduzível: 2026-11-11 12:00:00
  const dosTempo = (12 << 11) | (0 << 5) | 0;
  const dosData = ((2026 - 1980) << 9) | (11 << 5) | 11;

  for (const ent of entradas) {
    const nomeBytes = Buffer.from(ent.nome, "utf-8");
    const dadosRaw = ent.dados;
    const dadosComprimidos = zlib.deflateRawSync(dadosRaw, { level: 9 });
    const crc = calcularCrc32(dadosRaw);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(dosTempo, 10);
    localHeader.writeUInt16LE(dosData, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(dadosComprimidos.length, 18);
    localHeader.writeUInt32LE(dadosRaw.length, 22);
    localHeader.writeUInt16LE(nomeBytes.length, 26);
    localHeader.writeUInt16LE(0, 28);

    partesLocais.push(localHeader, nomeBytes, dadosComprimidos);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(dosTempo, 12);
    centralHeader.writeUInt16LE(dosData, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(dadosComprimidos.length, 20);
    centralHeader.writeUInt32LE(dadosRaw.length, 24);
    centralHeader.writeUInt16LE(nomeBytes.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(deslocamento, 42);

    partesCentrais.push(centralHeader, nomeBytes);
    deslocamento += localHeader.length + nomeBytes.length + dadosComprimidos.length;
  }

  const centralDirBuf = Buffer.concat(partesCentrais);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entradas.length, 8);
  eocd.writeUInt16LE(entradas.length, 10);
  eocd.writeUInt32LE(centralDirBuf.length, 12);
  eocd.writeUInt32LE(deslocamento, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...partesLocais, centralDirBuf, eocd]);
}

function textoLeiaMePacoteZip(tamanhoExeMb) {
  return `SAREL v2.0 — MOCKUP DEMONSTRATIVO PARA NAVEGADOR (WINDOWS)
Data do estado retratado: 11/11/2026
Tamanho do executável: ${tamanhoExeMb} MB

COMO ABRIR (WINDOWS 10 / WINDOWS 11):
1. Extraia o conteúdo deste .zip para uma pasta qualquer (ex.: Área de Trabalho).
2. Dê dois cliques em SAREL_Mockup_Demonstrativo_2026-11-11.exe.
   - Se o Windows Defender SmartScreen exibir aviso por ser um executável sem certificado comercial:
     clique em "Mais informações" -> "Executar assim mesmo".
3. O aplicativo abrirá o mockup automaticamente no seu navegador padrão em http://127.0.0.1:<porta>/,
   sem exigir Node.js, Python, instalação ou acesso à internet.
4. Mantenha a janela pequena do lançador aberta enquanto navega; ao fechá-la, o servidor local é encerrado.

O QUE É E O QUE NÃO FAZ:
- Interface estática somente demonstração do projeto SAREL (PPGTCA/UTFPR 2026).
- Dados 100% sintéticos (SINTETICO_NAO_VOAR_), sem coordenadas reais dos 677 imóveis, sem CAR,
  sem nomes de proprietários, sem credenciais e sem rotas de API ou chamadas externas.
- Botões operacionais e de exportação permanecem visíveis, desabilitados e explicados.
`;
}

function executar() {
  if (!fs.existsSync(path.join(DIR_VITRINE, "index.html"))) {
    throw new Error(
      "Pacote estático não encontrado em docs/apresentacoes/mockup/. Execute 'npm run mockup:build' primeiro."
    );
  }
  if (!fs.existsSync(ARQUIVO_CS)) {
    throw new Error(`Código do lançador não encontrado: ${ARQUIVO_CS}`);
  }
  if (!fs.existsSync(COMPILADOR_CSC)) {
    throw new Error(
      `Compilador .NET Framework (csc.exe) não encontrado em: ${COMPILADOR_CSC}`
    );
  }

  const arquivos = listarArquivosRecursivo(DIR_VITRINE, DIR_VITRINE);
  const dirTemp = fs.mkdtempSync(path.join(os.tmpdir(), "sarel-vitrine-exe-"));
  const caminhoPayloadZip = path.join(dirTemp, "VitrinePayload.zip");

  try {
    console.log(
      `[vitrine-exe] 1/3 Empacotando ${arquivos.length} ativos estáticos de docs/apresentacoes/mockup...`
    );
    const entradasPayload = arquivos.map((a) => ({
      nome: a.caminhoRelativo,
      dados: fs.readFileSync(a.caminhoAbsoluto),
    }));
    const payloadBuf = criarZipBuffer(entradasPayload);
    fs.writeFileSync(caminhoPayloadZip, payloadBuf);
    console.log(
      `[vitrine-exe]     Payload comprimido: ${(payloadBuf.length / (1024 * 1024)).toFixed(2)} MB`
    );

    console.log("[vitrine-exe] 2/3 Compilando executável único autônomo (.NET WinExe)...");
    const argsCompilacao = [
      "/nologo",
      "/optimize+",
      "/target:winexe",
      `/out:${ARQUIVO_EXE}`,
      `/resource:${caminhoPayloadZip},VitrinePayload.zip`,
      "/r:System.dll",
      "/r:System.Windows.Forms.dll",
      "/r:System.Drawing.dll",
      "/r:System.IO.Compression.dll",
      ...(fs.existsSync(ARQUIVO_ICONE) ? [`/win32icon:${ARQUIVO_ICONE}`] : []),
      ARQUIVO_CS,
    ];

    const res = spawnSync(COMPILADOR_CSC, argsCompilacao, {
      cwd: RAIZ,
      encoding: "utf-8",
    });
    if (res.status !== 0) {
      throw new Error(
        `Falha na compilação csc.exe (exit ${String(res.status)}):\n${res.stdout}\n${res.stderr}`
      );
    }

    const bytesExe = fs.statSync(ARQUIVO_EXE).size;
    const mbExe = (bytesExe / (1024 * 1024)).toFixed(2);
    console.log(
      `[vitrine-exe] 3/3 Gerando pacote .zip complementar para envio por e-mail (${mbExe} MB EXE)...`
    );

    const exeBuf = fs.readFileSync(ARQUIVO_EXE);
    const readmeBuf = Buffer.from(textoLeiaMePacoteZip(mbExe), "utf-8");
    const zipEntregaBuf = criarZipBuffer([
      { nome: "SAREL_Mockup_Demonstrativo_2026-11-11.exe", dados: exeBuf },
      { nome: "LEIA-ME_MOCKUP_EXE.txt", dados: readmeBuf },
    ]);
    fs.writeFileSync(ARQUIVO_ZIP, zipEntregaBuf);

    const bytesZip = fs.statSync(ARQUIVO_ZIP).size;
    const mbZip = (bytesZip / (1024 * 1024)).toFixed(2);
    console.log(
      `[vitrine-exe] CONCLUIDO:\n  - ${path.relative(RAIZ, ARQUIVO_EXE)} (${mbExe} MB / ${bytesExe} bytes)\n  - ${path.relative(RAIZ, ARQUIVO_ZIP)} (${mbZip} MB / ${bytesZip} bytes)`
    );
  } finally {
    fs.rmSync(dirTemp, { recursive: true, force: true });
  }
}

executar();
