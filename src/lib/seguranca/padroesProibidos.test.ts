import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Varredor de padrões proibidos (Regra 1 e 5).
 * Detecta:
 * 1. .unmask( com número
 * 2. || seguido de número
 * 3. ?? seguido de número
 * 4. parâmetros numéricos com default na assinatura (: number = 123)
 * 5. Math.max / Math.min com literais numéricos (cortes ou pisos disfarçados)
 * 6. adquiridoEm atribuído a partir de new Date
 */
export interface ViolacaoPadrao {
  arquivo: string;
  linha: number;
  padrao: string;
  trecho: string;
}

export interface ExcecaoAutorizada {
  id: string;
  arquivo: string;
  trecho: string;
  justificativa: string;
  autorizadoPor: string;
  padrao?: string;
}

export const LISTA_EXCECOES_AUTORIZADAS: ExcecaoAutorizada[] = [
  // Scripts - Geração sintética controlada para benchmark de pipeline
  {
    id: "EXC-DRYRUN-SINTETICO-XGBOOST",
    arquivo: "scripts/treinar_xgboost_loco.py",
    trecho: "bsi_spd = float(np.random.uniform",
    justificativa: "Geração explícita de benchmark sintético de pipeline no modo dry-run com flag declarada",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-DRYRUN-SINTETICO-XGBOOST",
    arquivo: "scripts/treinar_xgboost_loco.py",
    trecho: "ndvi_spd = float(np.random.uniform",
    justificativa: "Geração explícita de benchmark sintético de pipeline no modo dry-run com flag declarada",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-DRYRUN-SINTETICO-XGBOOST",
    arquivo: "scripts/treinar_xgboost_loco.py",
    trecho: "decliv = float(np.random.uniform",
    justificativa: "Geração explícita de benchmark sintético de pipeline no modo dry-run com flag declarada",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-DRYRUN-SINTETICO-XGBOOST",
    arquivo: "scripts/treinar_xgboost_loco.py",
    trecho: "elev = float(np.random.uniform",
    justificativa: "Geração explícita de benchmark sintético de pipeline no modo dry-run com flag declarada",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-DRYRUN-SINTETICO-XGBOOST",
    arquivo: "scripts/treinar_xgboost_loco.py",
    trecho: "perda_solo_spd = float(np.random.uniform",
    justificativa: "Geração explícita de benchmark sintético de pipeline no modo dry-run com flag declarada",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },

  // Componentes de UI - Coalescência com número permitida exclusivamente para controles visuais/câmera
  {
    id: "EXC-UI-MAPVIEWER-ZOOM",
    arquivo: "src/components/map/MapViewer.tsx",
    trecho: "zoom: zoom ?? 14",
    justificativa: "Fallback de nível de zoom padrão da câmera do Mapbox na interface do usuário",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
    padrao: "coalescencia-com-numero",
  },
  {
    id: "EXC-UI-MAPVIEWER-PITCH",
    arquivo: "src/components/map/MapViewer.tsx",
    trecho: "pitch: pitch ?? 50",
    justificativa: "Fallback de inclinação de perspectiva (pitch) da câmera 3D na interface do usuário",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
    padrao: "coalescencia-com-numero",
  },
  {
    id: "EXC-UI-MAPVIEWER-BEARING",
    arquivo: "src/components/map/MapViewer.tsx",
    trecho: "bearing: bearing ?? 0",
    justificativa: "Fallback de rotação azimutal (bearing) da câmera do mapa na interface do usuário",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
    padrao: "coalescencia-com-numero",
  },
  {
    id: "EXC-UI-FILTERSPANEL-DECLIVIDADE",
    arquivo: "src/components/sidebar/FiltersPanel.tsx",
    trecho: "value={filtros.declividadeMin ?? 0}",
    justificativa: "Piso numérico inicial do controle deslizante (slider) de filtro de declividade mínima na UI",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
    padrao: "coalescencia-com-numero",
  },

  // Código Ativo - Exceções auditadas com comentário explícito
  {
    id: "EXC-API-SELECT-CANDIDATES-LIMITE",
    arquivo: "src/app/api/gee/select-candidates/route.ts",
    trecho: "limite computacional de busca inicial de centroides no indice SQLite",
    justificativa: "Limite computacional de busca inicial de centroides no índice SQLite",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-API-SELECT-CANDIDATES-NORMALIZACAO",
    arquivo: "src/app/api/gee/select-candidates/route.ts",
    trecho: "normalizacao de percentual de alocacao de subamostra da interface [0, 100]",
    justificativa: "Normalização de percentual de alocação de subamostra da interface [0, 100]",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-API-SELECT-CANDIDATES-POOL",
    arquivo: "src/app/api/gee/select-candidates/route.ts",
    trecho: "criterio minimo de tamanho de pool elegivel para selecao de candidatos",
    justificativa: "Critério mínimo de tamanho de pool elegível para seleção de candidatos",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-API-SELECT-CANDIDATES-COTA",
    arquivo: "src/app/api/gee/select-candidates/route.ts",
    trecho: "subtracao aritmetica de cota amostral inteira nao negativa entre subconjuntos",
    justificativa: "Subtração aritmética de cota amostral inteira não negativa entre subconjuntos",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-LIB-AMOSTRAGEM-CLAMP-SOLO-NU",
    arquivo: "src/lib/gee/amostragemSoloNuLote.ts",
    trecho: "clamp de seguranca numerica para fracao normalizada de satelite no intervalo 0 a 1",
    justificativa: "Clamp de segurança numérica para fração normalizada de satélite no intervalo 0 a 1",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-LIB-AMOSTRAGEM-TIMEOUT-REDE",
    arquivo: "src/lib/gee/amostragemSoloNuLote.ts",
    trecho: "timeout de rede de requisicao http em milissegundos para conexao gee",
    justificativa: "Timeout de rede de requisição HTTP em milissegundos para conexão GEE",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-LIB-AMOSTRAGEM-REQUISICOES-EVITADAS",
    arquivo: "src/lib/gee/amostragemSoloNuLote.ts",
    trecho: "metrica contavel de requisicoes http poupadas no processamento em lote",
    justificativa: "Métrica contável de requisições HTTP poupadas no processamento em lote",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-LIB-AUTH-SEGUNDOS-VALIDADE",
    arquivo: "src/lib/gee/auth.ts",
    trecho: "fallback de protocolo oauth2 rfc6749 para token expiravel",
    justificativa: "Fallback de protocolo OAuth2 RFC6749 para token expirável",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-LIB-PLANET-QUOTA-TIMESTAMP",
    arquivo: "src/lib/planet/quota.ts",
    trecho: "auditoria de timestamp do livro-razao local",
    justificativa: "Auditoria de timestamp do livro-razao local",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-LIB-RUSLE-FATOR-LS-DIVISOR",
    arquivo: "src/lib/rusle/fatorLS.ts",
    trecho: "divisor de aguas no topo da vertente sem area de montante afluente (A_in = 0)",
    justificativa: "Divisor de águas no topo da vertente sem área de montante afluente (A_in = 0)",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-STORE-PAGINACAO-TOUR",
    arquivo: "src/store/useSarelStore.ts",
    trecho: "controle de indice de paginacao de interface do tour metodologico (>= 0)",
    justificativa: "Controle de índice de paginação de interface do tour metodológico (>= 0)",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
  {
    id: "EXC-TESTE-UNMASK-JRC",
    arquivo: "teste.ts",
    trecho: "const water = jrc.unmask(0);",
    justificativa: "Camada de exclusão booleana JRC sem dado no teste unitário",
    autorizadoPor: "Auditoria 2026-10-05 / C06",
  },
];

const REGEX_PADROES = [
  { id: "unmask-numerico", regex: /\.unmask\s*\(\s*\d+(\.\d+)?\s*\)/ },
  { id: "ou-logico-com-numero", regex: /\|\|\s*\d+(\.\d+)?\b/ },
  { id: "coalescencia-com-numero", regex: /\?\?\s*\d+(\.\d+)?\b/ },
  { id: "coalescencia-com-numero-entre-aspas", regex: /\?\?\s*["'`]\s*[0-9]/ },
  { id: "ou-logico-com-numero-entre-aspas", regex: /\|\|\s*["'`]\s*[0-9]/ },
  { id: "parametro-com-default-numerico", regex: /:\s*number\s*=\s*\d+(\.\d+)?\b/ },
  { id: "corte-math-max-min-com-literal", regex: /Math\.(max|min)\s*\([^)]*\b\d+(\.\d+)?\b[^)]*\)/ },
  { id: "adquiridoEm-com-new-date", regex: /adquiridoEm\s*:\s*(new\s+Date|Date\.now)/ },
  { id: "adquiridoEm-com-literal-data", regex: /adquiridoEm\s*:\s*["'`]\d{4}-\d{2}-\d{2}/ },
  {
    id: "sintese-aleatoria-atributos-fisicos",
    regex: /(=\s*|:\s*)(float\()?(np\.)?random\.[a-zA-Z0-9_]+/,
  },
  { id: "credencial-begin-private-key", regex: /-----BEGIN\s+((RSA|EC|DSA|OPENSSH)\s+)?PRIVATE\s+KEY-----/i },
  { id: "credencial-literal-private-key", regex: /"private_key"\s*:\s*["'][A-Za-z0-9+/=\s-]{20,}/ },
  { id: "credencial-planet-plak", regex: /\bPLAK[0-9a-zA-Z]{10,}\b/ },
  { id: "credencial-google-aizasy", regex: /\bAIzaSy[0-9a-zA-Z_-]{20,}\b/ },
  { id: "credencial-mapbox-pkey", regex: /\bpk\.eyJ[0-9a-zA-Z_-]{15,}\b/ },
  { id: "credencial-jev-ts", regex: /\bts_[0-9a-fA-F]{20,}\b/ },
  { id: "credencial-bearer-jwt", regex: /Bearer\s+eyJ[0-9a-zA-Z_-]{20,}\b/ },
];

export function isLinhaIsentaPorListaFechada(
  arquivo: string,
  linha: string,
  motivoComentario: string | null,
  padraoId: string
): boolean {
  const arqNorm = arquivo.replace(/\\/g, "/");

  for (const exc of LISTA_EXCECOES_AUTORIZADAS) {
    const excArqNorm = exc.arquivo.replace(/\\/g, "/");
    const arquivoBate = arqNorm.endsWith(excArqNorm) || excArqNorm.endsWith(arqNorm);
    if (!arquivoBate) continue;

    if (motivoComentario !== null) {
      const bateComentario =
        motivoComentario.includes(exc.id) || (exc.trecho && motivoComentario.includes(exc.trecho));
      if (bateComentario) {
        return true;
      }
    } else {
      const trechoBate = linha.includes(exc.trecho) || exc.trecho.includes(linha.trim());
      if (trechoBate) {
        if (exc.padrao && exc.padrao !== padraoId) continue;
        if (arqNorm.includes("src/components/")) {
          return true;
        }
      }
    }
  }

  return false;
}

export function varrerLinha(
  linha: string,
  numeroLinha: number,
  arquivo: string,
  motivoExterno?: string | null
): ViolacaoPadrao[] {
  const marcadorTs = "// permitido:";
  const marcadorPy = "# permitido:";
  const idxTs = linha.indexOf(marcadorTs);
  const idxPy = linha.indexOf(marcadorPy);
  const idxMarcador = idxTs !== -1 ? idxTs : idxPy;
  const tamMarcador = idxTs !== -1 ? marcadorTs.length : marcadorPy.length;

  let motivo: string | null = null;
  if (idxMarcador !== -1 && idxMarcador + tamMarcador < linha.length) {
    motivo = linha.slice(idxMarcador + tamMarcador).trim();
  } else if (motivoExterno) {
    motivo = motivoExterno;
  }

  const violacoes: ViolacaoPadrao[] = [];
  for (const { id, regex } of REGEX_PADROES) {
    if (regex.test(linha)) {
      if (!isLinhaIsentaPorListaFechada(arquivo, linha, motivo, id)) {
        violacoes.push({
          arquivo,
          linha: numeroLinha,
          padrao: id,
          trecho: linha.trim(),
        });
      }
    }
  }
  return violacoes;
}

export function varrerCodigo(codigo: string, nomeArquivo: string): ViolacaoPadrao[] {
  const linhas = codigo.split("\n");
  const violacoes: ViolacaoPadrao[] = [];
  linhas.forEach((linha, idx) => {
    const linhaAnterior = idx > 0 ? linhas[idx - 1] : "";
    const idxAntTs = linhaAnterior.indexOf("// permitido:");
    const idxAntPy = linhaAnterior.indexOf("# permitido:");
    const idxAnt = idxAntTs !== -1 ? idxAntTs : idxAntPy;
    const tamAnt = idxAntTs !== -1 ? 14 : 13;
    let motivoAnt: string | null = null;
    if (idxAnt !== -1 && idxAnt + tamAnt < linhaAnterior.length) {
      motivoAnt = linhaAnterior.slice(idxAnt + tamAnt).trim();
    }

    violacoes.push(...varrerLinha(linha, idx + 1, nomeArquivo, motivoAnt));
  });
  return violacoes;
}

export function listarArquivosCodigo(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const arquivos: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".next") {
      arquivos.push(...listarArquivosCodigo(fullPath));
    } else if (
      entry.isFile() &&
      (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) &&
      !fullPath.endsWith(".test.ts") &&
      !fullPath.endsWith(".test.tsx") &&
      // 2026-10-17 (Bloco B / R17): Exclusão EXATA: apenas o script D25 embutido,
      // cujo código byte-exato do pesquisador contém RNG legítimo para bootstrap estatístico (D25).
      // Nenhum outro *.generated.ts é isento (ex.: verificadorIntegridade.generated.ts é examinado).
      relPath !== "src/lib/export/scriptAvaliacaoD25.generated.ts"
    ) {
      arquivos.push(fullPath);
    }
  }
  return arquivos;
}

export function listarArquivosScripts(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const arquivos: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relDir = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");
    // 2026-10-17 (Bloco B / R17): Exclusão EXATA: apenas o diretório scripts/d25 relativo à raiz do repositório,
    // onde reside o código byte-exato do pesquisador com RNG legítimo para bootstrap estatístico.
    // Qualquer outro diretório com nome 'd25' fora deste caminho exato é varrido.
    if (
      entry.isDirectory() &&
      entry.name !== "__pycache__" &&
      entry.name !== ".git" &&
      relDir !== "scripts/d25"
    ) {
      arquivos.push(...listarArquivosScripts(fullPath));
    } else if (
      entry.isFile() &&
      (fullPath.endsWith(".py") || fullPath.endsWith(".mjs") || fullPath.endsWith(".ts"))
    ) {
      arquivos.push(fullPath);
    }
  }
  return arquivos;
}

describe("Varredor de Padrões Proibidos (Regra 1 e 5)", () => {
  describe("Meta-testes (confirma que o detector NÃO é vacuoso)", () => {
    it("detecta .unmask(0.0)", () => {
      const code = `const bsi = expressao.unmask(0.0).rename("BSI");`;
      const v = varrerCodigo(code, "teste.ts");
      expect(v.some((x) => x.padrao === "unmask-numerico")).toBe(true);
    });

    it("detecta || seguido de número", () => {
      const code = `const slope = parseFloat(props.slope || 16);`;
      const v = varrerCodigo(code, "teste.ts");
      expect(v.some((x) => x.padrao === "ou-logico-com-numero")).toBe(true);
    });

    it("detecta ?? seguido de número", () => {
      const code = `const ndvi = (frequenciaSoloNu ?? 0.3) * 0.7;`;
      const v = varrerCodigo(code, "teste.ts");
      expect(v.some((x) => x.padrao === "coalescencia-com-numero")).toBe(true);
    });

    it("detecta ?? e || seguidos de numeral entre aspas", () => {
      const v1 = varrerLinha('x: a ?? "7500",', 1, "f.ts");
      expect(v1.some((x) => x.padrao === "coalescencia-com-numero-entre-aspas")).toBe(true);
      const v2 = varrerLinha('y: b || "2026-01-01",', 2, "f.ts");
      expect(v2.some((x) => x.padrao === "ou-logico-com-numero-entre-aspas")).toBe(true);
    });

    it("detecta parâmetro com default numérico na assinatura", () => {
      const code = `export function calcular(limiar: number = 0.25) {}`;
      const v = varrerCodigo(code, "teste.ts");
      expect(v.some((x) => x.padrao === "parametro-com-default-numerico")).toBe(true);
    });

    it("detecta cortes e pisos com Math.max/min e literal", () => {
      const code1 = `const c = Math.max(0, Math.min(1, fatorC));`;
      const code2 = `const acumulo = Math.max(1, fluxo);`;
      expect(varrerCodigo(code1, "teste.ts").some((x) => x.padrao === "corte-math-max-min-com-literal")).toBe(true);
      expect(varrerCodigo(code2, "teste.ts").some((x) => x.padrao === "corte-math-max-min-com-literal")).toBe(true);
    });

    it("detecta adquiridoEm atribuído a partir de new Date", () => {
      const code = `const p = { adquiridoEm: new Date().toISOString() };`;
      const v = varrerCodigo(code, "teste.ts");
      expect(v.some((x) => x.padrao === "adquiridoEm-com-new-date")).toBe(true);
    });

    it("permite exceção com justificativa válida registrada na lista fechada", () => {
      const code = `const water = jrc.unmask(0); // permitido: EXC-TESTE-UNMASK-JRC`;
      const v = varrerCodigo(code, "teste.ts");
      expect(v.length).toBe(0);
    });

    it("rejeita exceção sem justificativa suficiente (< 20 caracteres) ou sem registro na lista fechada", () => {
      const code = `const water = jrc.unmask(0); // permitido: curto`;
      const v = varrerCodigo(code, "teste.ts");
      expect(v.length).toBeGreaterThan(0);
    });

    it("detecta síntese aleatória de atributos físicos em Python sem comentário permitido (Caso A)", () => {
      const code = `decliv = float(np.random.uniform(3.0, 14.0))`;
      const v = varrerCodigo(code, "teste.py");
      expect(v.some((x) => x.padrao === "sintese-aleatoria-atributos-fisicos")).toBe(true);
    });

    it("detecta síntese aleatória com atribuição em qualquer nome em scripts (Caso B)", () => {
      const code = `amostra = np.random.uniform(0.0, 1.0)`;
      const v = varrerCodigo(code, "scripts/exemplo.py");
      expect(v.some((x) => x.padrao === "sintese-aleatoria-atributos-fisicos")).toBe(true);
    });

    it("detecta síntese aleatória em literais de dicionário em scripts (Caso C)", () => {
      const code = `dados = {"declividade": np.random.normal(0, 1)}`;
      const v = varrerCodigo(code, "scripts/exemplo.py");
      expect(v.some((x) => x.padrao === "sintese-aleatoria-atributos-fisicos")).toBe(true);
    });

    it("rejeita isenção por texto livre longo sem registro na lista fechada (Caso D)", () => {
      const code = `decliv = float(np.random.uniform(3.0, 14.0)) # permitido: este e um comentario longo sem id na lista fechada`;
      const v = varrerCodigo(code, "scripts/treinar_xgboost_loco.py");
      expect(v.length).toBeGreaterThan(0);
    });

    it("detecta coalescencia com numero em componente .tsx sem autorizacao na lista fechada", () => {
      const code = `const valor = props.declividade ?? 0;`;
      const v = varrerCodigo(code, "src/components/exemplo/NovoComponente.tsx");
      expect(v.some((x) => x.padrao === "coalescencia-com-numero")).toBe(true);
    });

    it("detecta literais com formato de credenciais secretas no código (Regra C1)", () => {
      expect(varrerCodigo('const key = "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBA...";', "teste.ts").some((x) => x.padrao === "credencial-begin-private-key")).toBe(true);
      expect(varrerCodigo('const json = { "private_key": "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC..." };', "teste.ts").some((x) => x.padrao === "credencial-literal-private-key")).toBe(true);
      expect(varrerCodigo('const plak = "PLAK1234567890abcdef";', "teste.ts").some((x) => x.padrao === "credencial-planet-plak")).toBe(true);
      expect(varrerCodigo('const gmKey = "AIzaSyAbcdef1234567890_-ABCDEF";', "teste.ts").some((x) => x.padrao === "credencial-google-aizasy")).toBe(true);
      expect(varrerCodigo('const mbToken = "pk.eyJ1234567890abcdef12345";', "teste.ts").some((x) => x.padrao === "credencial-mapbox-pkey")).toBe(true);
      expect(varrerCodigo('const jev = "ts_0123456789abcdef0123456789abcdef";', "teste.ts").some((x) => x.padrao === "credencial-jev-ts")).toBe(true);
      expect(varrerCodigo('const h = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";', "teste.ts").some((x) => x.padrao === "credencial-bearer-jwt")).toBe(true);
    });

    it("meta-teste: varredura em diretório vazio deve falhar compulsoriamente por piso mínimo", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "meta_test_padroes_vazio_"));
      try {
        const arquivosTmp = listarArquivosCodigo(tmpDir);
        const PISO_MINIMO = 60;
        expect(() => {
          expect(
            arquivosTmp.length,
            `Varredura de padrões proibidos em código ativo examinou apenas ${arquivosTmp.length} arquivos (esperado >= ${PISO_MINIMO}). Possível diretório ausente ou renomeado: ${tmpDir}`
          ).toBeGreaterThanOrEqual(PISO_MINIMO);
        }).toThrow(/Possível diretório ausente ou renomeado/);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it("B3: prova que *.generated.ts fora da lista exata e diretório d25 fora de scripts/d25 ainda são listados e detectados", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sarel-padroes-b3-"));
      try {
        // 1. Arquivo .generated.ts fora da lista exata
        const fakeGen = path.join(tmpDir, "outroModulo.generated.ts");
        fs.writeFileSync(fakeGen, "const x = np.random.uniform(0, 1);\n");

        const arquivosCodigo = listarArquivosCodigo(tmpDir);
        expect(arquivosCodigo).toContain(fakeGen);
        const violacoesGen = varrerCodigo(fs.readFileSync(fakeGen, "utf-8"), path.relative(process.cwd(), fakeGen));
        expect(violacoesGen.some((v) => v.padrao === "sintese-aleatoria-atributos-fisicos")).toBe(true);

        // 2. Diretório d25 fora de scripts/d25 (ex: outro/d25)
        const subDirD25 = path.join(tmpDir, "outro", "d25");
        fs.mkdirSync(subDirD25, { recursive: true });
        const scriptOutroD25 = path.join(subDirD25, "simulacao.py");
        fs.writeFileSync(scriptOutroD25, "val = np.random.uniform(0, 1)\n");

        const arquivosScripts = listarArquivosScripts(tmpDir);
        expect(arquivosScripts).toContain(scriptOutroD25);
        const violacoesScript = varrerCodigo(fs.readFileSync(scriptOutroD25, "utf-8"), path.relative(process.cwd(), scriptOutroD25));
        expect(violacoesScript.some((v) => v.padrao === "sintese-aleatoria-atributos-fisicos")).toBe(true);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe("Varredura no código científico e de estado em src/lib, src/app/api, src/store e src/config (Q2.ii)", () => {
    it("nenhum arquivo em src/lib, src/app/api, src/store ou src/config deve conter padrões proibidos", () => {
      const diretoriosAlvo = ["src/lib", "src/app/api", "src/store", "src/config"].map((d) =>
        path.resolve(process.cwd(), d)
      );
      const arquivos = diretoriosAlvo.flatMap((dir) => listarArquivosCodigo(dir));

      // Piso mínimo de arquivos examinados (medido hoje: 81 arquivos; folga de ~74% => piso 60)
      const PISO_MINIMO_CODIGO = 60;
      expect(
        arquivos.length,
        `Varredura de padrões proibidos em código ativo examinou apenas ${arquivos.length} arquivos (esperado >= ${PISO_MINIMO_CODIGO}). Possível diretório ausente ou renomeado.`
      ).toBeGreaterThanOrEqual(PISO_MINIMO_CODIGO);

      const todasViolacoes: ViolacaoPadrao[] = [];

      for (const arq of arquivos) {
        const conteudo = fs.readFileSync(arq, "utf-8");
        const v = varrerCodigo(conteudo, path.relative(process.cwd(), arq));
        todasViolacoes.push(...v);
      }

      if (todasViolacoes.length > 0) {
        const msg = todasViolacoes
          .map((v) => `  ${v.arquivo}:${v.linha} [${v.padrao}] -> ${v.trecho}`)
          .join("\n");
        expect.fail(`Violações de padrões proibidos encontradas em código ativo:\n${msg}`);
      }
      expect(todasViolacoes).toHaveLength(0);
    });

    it("nenhum componente em src/components/**/*.tsx deve conter literais de data/código entre aspas ou adquiridoEm fabricado", () => {
      const raizComponents = path.resolve(process.cwd(), "src/components");
      const arquivos = listarArquivosCodigo(raizComponents);

      // Piso mínimo de componentes examinados (medido hoje: 33 arquivos; folga de ~72% => piso 24)
      const PISO_MINIMO_COMPONENTS = 24;
      expect(
        arquivos.length,
        `Varredura de padrões proibidos em src/components examinou apenas ${arquivos.length} arquivos (esperado >= ${PISO_MINIMO_COMPONENTS}). Diretório components ausente ou vazio.`
      ).toBeGreaterThanOrEqual(PISO_MINIMO_COMPONENTS);

      const padroesRestritosComponentes = new Set([
        "coalescencia-com-numero",
        "coalescencia-com-numero-entre-aspas",
        "ou-logico-com-numero-entre-aspas",
        "adquiridoEm-com-new-date",
        "adquiridoEm-com-literal-data",
        "sintese-aleatoria-atributos-fisicos",
      ]);
      const todasViolacoes: ViolacaoPadrao[] = [];

      for (const arq of arquivos) {
        const conteudo = fs.readFileSync(arq, "utf-8");
        const v = varrerCodigo(conteudo, path.relative(process.cwd(), arq)).filter((viol) =>
          padroesRestritosComponentes.has(viol.padrao)
        );
        todasViolacoes.push(...v);
      }

      if (todasViolacoes.length > 0) {
        const msg = todasViolacoes
          .map((v) => `  ${v.arquivo}:${v.linha} [${v.padrao}] -> ${v.trecho}`)
          .join("\n");
        expect.fail(`Violações de padrões proibidos em src/components:\n${msg}`);
      }
      expect(todasViolacoes).toHaveLength(0);
    });
  });

  describe("Varredura no código científico em scripts/ (Python e Node)", () => {
    it("nenhum script em scripts/ deve conter geração sintética não documentada ou padrões proibidos", () => {
      const raizScripts = path.resolve(process.cwd(), "scripts");
      const arquivos = listarArquivosScripts(raizScripts);

      // Piso mínimo de scripts examinados (medido hoje: 39 arquivos; folga de ~72% => piso 28)
      const PISO_MINIMO_SCRIPTS = 28;
      expect(
        arquivos.length,
        `Varredura de scripts examinou apenas ${arquivos.length} arquivos (esperado >= ${PISO_MINIMO_SCRIPTS}). Diretório scripts ausente ou renomeado.`
      ).toBeGreaterThanOrEqual(PISO_MINIMO_SCRIPTS);

      const todasViolacoes: ViolacaoPadrao[] = [];

      for (const arq of arquivos) {
        const conteudo = fs.readFileSync(arq, "utf-8");
        const v = varrerCodigo(conteudo, path.relative(process.cwd(), arq));
        todasViolacoes.push(...v);
      }

      if (todasViolacoes.length > 0) {
        const msg = todasViolacoes
          .map((v) => `  ${v.arquivo}:${v.linha} [${v.padrao}] -> ${v.trecho}`)
          .join("\n");
        expect.fail(`Violações de padrões proibidos encontradas em scripts/:\n${msg}`);
      }
      expect(todasViolacoes).toHaveLength(0);
    }, 20000);
  });

  describe("FASE 0 — Identidade de Banda B11/B12 (F0.1), Proveniência adquiridoEm (F0.3) e Guarda D11 (F0.4)", () => {
    it("separa B11 (SWIR-1) de B12 (SWIR-2), preserva B11 no BSI e deriva adquiridoEm real de PRODUCT_ID (F0.1, F0.3)", async () => {
      const { processarRespostaGeeSentinel2 } = await import("@/lib/gee/copernicusGeeClient");
      const { calcularBsi } = await import("@/lib/gee/serieTemporal");

      const medicao = processarRespostaGeeSentinel2(
        {
          Map: 40,
          B2_p50: 850,
          B4_p50: 1200,
          B8_p50: 3100,
          B11_p50: 2750, // SWIR-1 = 0.2750
          B12_p50: 1920, // SWIR-2 = 0.1920
          B4_count: 14,
        },
        ["S2B_MSIL2A_20240815T134209_N0511_R124_T21JYM_20240815T171822"]
      );

      expect(medicao).not.toBeNull();
      expect(medicao!.b11).toBeCloseTo(0.275, 4);
      expect(medicao!.b12).toBeCloseTo(0.192, 4);
      expect(medicao!.b11).not.toBe(medicao!.b12);
      expect(medicao!.bsi).toBeCloseTo(calcularBsi(0.275, 0.12, 0.31, 0.085)!, 4);
      expect(medicao!.adquiridoEm).toBe("2024-08-15");
      expect(medicao!.insuficienteD11).toBe(false);
    });

    it("marca insuficienteD11 = true e retém frequenciaSoloNu quando nObservacoesValidas < 6 (F0.4, Decisão D11)", async () => {
      const { processarRespostaGeeSentinel2, avaliarSuficienciaAmostralD11 } = await import(
        "@/lib/gee/copernicusGeeClient"
      );

      const d11Falha = avaliarSuficienciaAmostralD11(4);
      expect(d11Falha.suficiente).toBe(false);
      expect(d11Falha.causa).toBe("insuficiente");
      expect(d11Falha.motivo).toContain("D11");

      const medicaoInsuf = processarRespostaGeeSentinel2({
        Map: 40,
        B2_p50: 850,
        B4_p50: 1200,
        B8_p50: 3100,
        B11_p50: 2750,
        B12_p50: 1920,
        B4_count: 4,
      });

      expect(medicaoInsuf).not.toBeNull();
      expect(medicaoInsuf!.nObservacoesValidas).toBe(4);
      expect(medicaoInsuf!.insuficienteD11).toBe(true);
      expect(medicaoInsuf!.frequenciaSoloNu).toBeNull();
    });
  });

  describe("FASE 2 / F5 — Detector de Sequência Monotônica e Correlação Espúria com Índice (|r| > 0.95)", () => {
    it("assevera que nenhum artefato JSON de medição em docs/verificacoes/ contém séries numéricas correlacionadas com a ordem do arquivo", async () => {
      const { varrerDiretorioParaSequencias } = await import("./detectorSequencia");
      const pastaVerificacoes = path.resolve(process.cwd(), "docs/verificacoes");
      const violacoes = varrerDiretorioParaSequencias(pastaVerificacoes, 0.95);

      if (violacoes.length > 0) {
        const msg = violacoes
          .map((v) => `  ${v.arquivo} [${v.propriedade}] -> |r| = ${v.correlacao} (${v.motivo})`)
          .join("\n");
        expect.fail(`Violação de sequência monotônica artificial detectada em artefato:\n${msg}`);
      }
      expect(violacoes).toHaveLength(0);
    }, 30000);
  });
});

