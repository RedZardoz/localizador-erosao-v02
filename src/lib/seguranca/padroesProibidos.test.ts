import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

import {
  ViolacaoPadrao,
  ExcecaoAutorizada,
  LISTA_EXCECOES_AUTORIZADAS,
  REGEX_PADROES,
  isLinhaIsentaPorListaFechada,
  varrerLinha,
  varrerCodigo,
  listarArquivosCodigo,
  listarArquivosScripts,
  varrerPadroesProibidos,
  varrerIntegridadeJson,
  varrerIntegridadeJsonDiretorios,
  listarArquivosJson,
} from "./padroesProibidos";

export type { ViolacaoPadrao, ExcecaoAutorizada };
export {
  LISTA_EXCECOES_AUTORIZADAS,
  isLinhaIsentaPorListaFechada,
  varrerLinha,
  varrerCodigo,
  listarArquivosCodigo,
  listarArquivosScripts,
};

describe("Varredor de Padrões Proibidos (Regra 1 e 5)", () => {
  describe("Meta-testes (confirma que o detector NÃO é vacuoso)", () => {
    it("detecta grade-cientifica-fabricada em arrays 2D numéricos", () => {
      const codePositivo = `const grid = [[1.2, 2.5, 3.8, 4.1], [5.0, 6.2, 7.1, 8.4]];`;
      const vPos = varrerCodigo(codePositivo, "teste.ts");
      expect(vPos.some((x) => x.padrao === "grade-cientifica-fabricada")).toBe(true);

      const codeNegativo = `const bbox = [[-53.8, -25.2], [-53.7, -25.2]];`;
      const vNeg = varrerCodigo(codeNegativo, "teste.ts");
      expect(vNeg.some((x) => x.padrao === "grade-cientifica-fabricada")).toBe(false);
    });

    it("detecta preditor-cientifico-de-limiar-ou-zero", () => {
      const codePos1 = `coluna.declividade = 0;`;
      const codePos2 = `ponto.ndvi = limiarSoloNu;`;
      const v1 = varrerCodigo(codePos1, "teste.ts");
      const v2 = varrerCodigo(codePos2, "teste.ts");
      expect(v1.some((x) => x.padrao === "preditor-cientifico-de-limiar-ou-zero")).toBe(true);
      expect(v2.some((x) => x.padrao === "preditor-cientifico-de-limiar-ou-zero")).toBe(true);

      const codeNeg = `ponto.ndvi = 0.25;`;
      const vNeg = varrerCodigo(codeNeg, "teste.ts");
      expect(vNeg.some((x) => x.padrao === "preditor-cientifico-de-limiar-ou-zero")).toBe(false);
    });

    it("detecta identificador-admite-simulacao e filtra linhas de comentário", () => {
      const codePos1 = `const mockData = { id: 1 };`;
      const codePos2 = `const simularCenario = true;`;
      const v1 = varrerCodigo(codePos1, "teste.ts");
      const v2 = varrerCodigo(codePos2, "teste.ts");
      expect(v1.some((x) => x.padrao === "identificador-admite-simulacao")).toBe(true);
      expect(v2.some((x) => x.padrao === "identificador-admite-simulacao")).toBe(true);

      const codeNegComentario = `// permitido: EXC-DEMO-PAINEL demonstracao de interface com dados ilustrativos mock`;
      const vNeg1 = varrerCodigo(codeNegComentario, "teste.ts");
      expect(vNeg1.some((x) => x.padrao === "identificador-admite-simulacao")).toBe(false);

      const codeNegCondicional = `if (reg.mock === true) { return false; }`;
      const vNeg2 = varrerCodigo(codeNegCondicional, "teste.ts");
      expect(vNeg2.some((x) => x.padrao === "identificador-admite-simulacao")).toBe(false);
    });

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

    it("detecta coalescencia-com-colecao-vazia (?? [] e ?? {})", () => {
      const codePos1 = "const c = bruto?.candidatos ?? [];";
      const codePos2 = "const m = dados?.metricas ?? {};";
      const v1 = varrerCodigo(codePos1, "teste.ts");
      const v2 = varrerCodigo(codePos2, "teste.ts");
      expect(v1.some((x) => x.padrao === "coalescencia-com-colecao-vazia")).toBe(true);
      expect(v2.some((x) => x.padrao === "coalescencia-com-colecao-vazia")).toBe(true);

      const codeNeg1 = "const c = Array.isArray(bruto) ? bruto : [];";
      const codeNeg2 = "const m = dados ? dados.metricas : {};";
      const vNeg1 = varrerCodigo(codeNeg1, "teste.ts");
      const vNeg2 = varrerCodigo(codeNeg2, "teste.ts");
      expect(vNeg1.some((x) => x.padrao === "coalescencia-com-colecao-vazia")).toBe(false);
      expect(vNeg2.some((x) => x.padrao === "coalescencia-com-colecao-vazia")).toBe(false);
    });

    it("detecta literal-em-proveniencia-medida com selo medido e número cravado", () => {
      const codePos1 = 'const p = { estado: "medido", valor: 0.0285 };';
      const codePos2 = "const q = { estado: 'medido', extra: 'x', valor: -12.34 };";
      const v1 = varrerCodigo(codePos1, "teste.ts");
      const v2 = varrerCodigo(codePos2, "teste.ts");
      expect(v1.some((x) => x.padrao === "literal-em-proveniencia-medida")).toBe(true);
      expect(v2.some((x) => x.padrao === "literal-em-proveniencia-medida")).toBe(true);

      const codeNeg1 = 'const p = { estado: "medido", valor: valorMedido };';
      const codeNeg2 = 'const q = { estado: "indisponivel", motivo: "sem cobertura", valor: 0.0285 };';
      const vNeg1 = varrerCodigo(codeNeg1, "teste.ts");
      const vNeg2 = varrerCodigo(codeNeg2, "teste.ts");
      expect(vNeg1.some((x) => x.padrao === "literal-em-proveniencia-medida")).toBe(false);
      expect(vNeg2.some((x) => x.padrao === "literal-em-proveniencia-medida")).toBe(false);
    });

    it("detecta constante-cientifica-py em scripts Python (topo de módulo ou indentada)", () => {
      const codePos1 = "declividade = 16.0";
      const codePos2 = "    declividade = 16.0";
      const codePos3 = "ndvi = 0.32";
      const codePos4 = "fatorK = 0.0285";
      const codePos5 = "erodibilidade = 0.030 # referencia";
      const v1 = varrerCodigo(codePos1, "scripts/treinar.py");
      const v2 = varrerCodigo(codePos2, "scripts/treinar.py");
      const v3 = varrerCodigo(codePos3, "scripts/treinar.py");
      const v4 = varrerCodigo(codePos4, "scripts/treinar.py");
      const v5 = varrerCodigo(codePos5, "scripts/treinar.py");
      expect(v1.some((x) => x.padrao === "constante-cientifica-py")).toBe(true);
      expect(v2.some((x) => x.padrao === "constante-cientifica-py")).toBe(true);
      expect(v3.some((x) => x.padrao === "constante-cientifica-py")).toBe(true);
      expect(v4.some((x) => x.padrao === "constante-cientifica-py")).toBe(true);
      expect(v5.some((x) => x.padrao === "constante-cientifica-py")).toBe(true);

      const codeNeg1 = "declividade = calcular_declividade()";
      const codeNeg2 = "x = 16.0";
      const codeNeg3 = "valor = 0.32";
      const vNeg1 = varrerCodigo(codeNeg1, "scripts/treinar.py");
      const vNeg2 = varrerCodigo(codeNeg2, "scripts/treinar.py");
      const vNeg3 = varrerCodigo(codeNeg3, "scripts/treinar.py");
      expect(vNeg1.some((x) => x.padrao === "constante-cientifica-py")).toBe(false);
      expect(vNeg2.some((x) => x.padrao === "constante-cientifica-py")).toBe(false);
      expect(vNeg3.some((x) => x.padrao === "constante-cientifica-py")).toBe(false);
    });

    it("detecta hash-implausivel (fixture pericial) e timestamp-suspeito na varredura de JSON", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "meta_test_json_"));
      try {
        const fakeHashFile = path.join(tmpDir, "fake_hash.json");
        fs.writeFileSync(
          fakeHashFile,
          JSON.stringify({
            nome: "manifesto",
            banco_sha256: "4b9e4a3b1d2e8f9a0c3d5e7f1b2a4c6e8d0f2a4b6c8e0d2f4a6b8c0e2d4f6a8b",
          })
        );
        const vHash = varrerIntegridadeJson(fakeHashFile);
        expect(vHash.some((x) => x.padrao === "hash-implausivel")).toBe(true);
        expect(vHash[0].motivo).toContain("repete-se 3 ou mais vezes");

        const suspTimeFile = path.join(tmpDir, "susp_time.json");
        fs.writeFileSync(
          suspTimeFile,
          JSON.stringify({
            nome: "relatorio",
            geradoEm: "2026-10-31T14:00:00.000Z",
          })
        );
        const vTime = varrerIntegridadeJson(suspTimeFile);
        expect(vTime.some((x) => x.padrao === "timestamp-suspeito")).toBe(true);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
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

    it("detecta default numérico por desestruturação e ignora atribuição regular (GOV-5)", () => {
      const codePega = `  const {\n    limiar = 0.25,\n  } = opcoes;`;
      const vPega = varrerCodigo(codePega, "teste.ts");
      expect(vPega.some((x) => x.padrao === "default-numerico-desestruturacao")).toBe(true);

      const codeIgnora = `const x = 10;\nconst y = 20.5;`;
      const vIgnora = varrerCodigo(codeIgnora, "teste.ts");
      expect(vIgnora.some((x) => x.padrao === "default-numerico-desestruturacao")).toBe(false);
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

  describe("Varredura no código em src/lib, src/app/api, src/store, src/config e src/components (Q2.ii e Item 3c)", () => {
    it("nenhum arquivo em src/lib, src/app/api, src/store, src/config ou src/components deve conter padrões proibidos", () => {
      const diretoriosAlvo = ["src/lib", "src/app/api", "src/store", "src/config", "src/components"].map((d) =>
        path.resolve(process.cwd(), d)
      );
      const arquivos = diretoriosAlvo.flatMap((dir) => listarArquivosCodigo(dir));

      // Piso mínimo de arquivos examinados (medido hoje: > 115 arquivos => piso 85)
      const PISO_MINIMO_CODIGO = 85;
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

  describe("Varredura de Integridade em Arquivos JSON (data/ e docs/) (Auditoria 2026-10-31)", () => {
    it("assevera que nenhum JSON versionado em data/ e docs/ contém hash implausível ou timestamp suspeito", () => {
      const arquivosData = listarArquivosJson(path.resolve(process.cwd(), "data"));
      const arquivosDocs = listarArquivosJson(path.resolve(process.cwd(), "docs"));
      const totalArquivos = arquivosData.length + arquivosDocs.length;

      // Piso mínimo de integridade: pelo menos 20 JSONs devem ser examinados
      const PISO_MINIMO_JSON = 20;
      expect(
        totalArquivos,
        `Varredura de JSONs examinou apenas ${totalArquivos} arquivos (esperado >= ${PISO_MINIMO_JSON}).`
      ).toBeGreaterThanOrEqual(PISO_MINIMO_JSON);

      const violacoes = varrerIntegridadeJsonDiretorios(["data", "docs"]);

      if (violacoes.length > 0) {
        const msg = violacoes
          .map((v) => `  ${v.arquivo} [${v.propriedade}] (${v.padrao}) -> ${v.motivo}`)
          .join("\n");
        expect.fail(`Violações de integridade encontradas em arquivos JSON versionados:\n${msg}`);
      }
      expect(violacoes).toHaveLength(0);
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

  describe("A-03 / P07 — nenhuma semente de sorteio constante no codigo", () => {
    /**
     * P07 decidiu "dinamica-registrada": a reprodutibilidade exige que a semente seja REGISTRADA,
     * nao que seja FIXA. Uma constante embutida torna todas as execucoes identicas e retira do
     * sorteio o carater probabilistico que D23 descreve. Este teste impede a reincidencia, que
     * ocorreu duas vezes: `const semente = 42` na rota de candidatos e um default `20260928` no CLI.
     */
    const ARQUIVOS_DE_SORTEIO = [
      "src/app/api/gee/select-candidates/route.ts",
      "scripts/sortear_poligonos_d16.ts",
    ];

    it("nao atribui semente a um literal numerico em nenhum arquivo que sorteia", () => {
      const violacoes: string[] = [];
      for (const rel of ARQUIVOS_DE_SORTEIO) {
        const abs = path.resolve(process.cwd(), rel);
        if (!fs.existsSync(abs)) {
          expect.fail(`Arquivo de sorteio esperado nao existe: ${rel}`);
        }
        const conteudo = fs.readFileSync(abs, "utf-8");
        conteudo.split("\n").forEach((linha, i) => {
          const t = linha.trim();
          if (t.startsWith("*") || t.startsWith("//") || t.startsWith("/*")) return;
          if (/\b(const|let|var)\s+semente\w*\s*(:\s*number\s*)?=\s*\d/.test(linha)) {
            violacoes.push(`${rel}:${i + 1} -> ${t}`);
          }
        });
      }
      if (violacoes.length > 0) {
        expect.fail(
          `Semente constante detectada (P07 exige semente dinamica e registrada):\n${violacoes.join("\n")}`
        );
      }
      expect(violacoes).toHaveLength(0);
    });

    it("gera a semente por execucao e a registra, em vez de herdar constante", () => {
      const rota = fs.readFileSync(
        path.resolve(process.cwd(), "src/app/api/gee/select-candidates/route.ts"),
        "utf-8"
      );
      expect(rota).toContain("randomInt");
      expect(rota).toContain("semente_origem");

      const cli = fs.readFileSync(
        path.resolve(process.cwd(), "scripts/sortear_poligonos_d16.ts"),
        "utf-8"
      );
      // O sorteio real e irreversivel: --confirmar sem --semente tem de falhar.
      expect(cli).toContain("obrigatorio com --confirmar");
      expect(cli).toContain("randomInt");
    });
  });
});

