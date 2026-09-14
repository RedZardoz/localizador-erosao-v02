import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

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

const REGEX_PADROES = [
  { id: "unmask-numerico", regex: /\.unmask\s*\(\s*\d+(\.\d+)?\s*\)/ },
  { id: "ou-logico-com-numero", regex: /\|\|\s*\d+(\.\d+)?\b/ },
  { id: "coalescencia-com-numero", regex: /\?\?\s*\d+(\.\d+)?\b/ },
  { id: "parametro-com-default-numerico", regex: /:\s*number\s*=\s*\d+(\.\d+)?\b/ },
  { id: "corte-math-max-min-com-literal", regex: /Math\.(max|min)\s*\([^)]*\b\d+(\.\d+)?\b[^)]*\)/ },
  { id: "adquiridoEm-com-new-date", regex: /adquiridoEm\s*:\s*(new\s+Date|Date\.now)/ },
  {
    id: "sintese-aleatoria-atributos-fisicos",
    regex: /(bsi|ndvi|decliv|slope|elev|perda|fator)[a-z_0-9]*\s*=\s*(float\()?((np\.)?random\.(uniform|normal|random|choice)|random\.(uniform|random|choice))/i,
  },
];

export function varrerLinha(linha: string, numeroLinha: number, arquivo: string): ViolacaoPadrao[] {
  // Exceção permitida somente com comentário explícito (TS // permitido: ou Python # permitido:)
  const marcadorTs = "// permitido:";
  const marcadorPy = "# permitido:";
  const idxTs = linha.indexOf(marcadorTs);
  const idxPy = linha.indexOf(marcadorPy);
  const idxMarcador = idxTs !== -1 ? idxTs : idxPy;
  const tamMarcador = idxTs !== -1 ? marcadorTs.length : marcadorPy.length;

  if (idxMarcador !== -1 && idxMarcador + tamMarcador < linha.length) {
    const motivo = linha.slice(idxMarcador + tamMarcador).trim();
    if (motivo.length >= 20) {
      return [];
    }
  }

  const violacoes: ViolacaoPadrao[] = [];
  for (const { id, regex } of REGEX_PADROES) {
    if (regex.test(linha)) {
      violacoes.push({
        arquivo,
        linha: numeroLinha,
        padrao: id,
        trecho: linha.trim(),
      });
    }
  }
  return violacoes;
}

export function varrerCodigo(codigo: string, nomeArquivo: string): ViolacaoPadrao[] {
  const linhas = codigo.split("\n");
  const violacoes: ViolacaoPadrao[] = [];
  linhas.forEach((linha, idx) => {
    // Verifica se a linha anterior continha autorização explícita com justificativa >= 20 caracteres
    const linhaAnterior = idx > 0 ? linhas[idx - 1] : "";
    const idxAntTs = linhaAnterior.indexOf("// permitido:");
    const idxAntPy = linhaAnterior.indexOf("# permitido:");
    const idxAnt = idxAntTs !== -1 ? idxAntTs : idxAntPy;
    const tamAnt = idxAntTs !== -1 ? 14 : 13;
    if (idxAnt !== -1 && idxAnt + tamAnt < linhaAnterior.length) {
      const motivo = linhaAnterior.slice(idxAnt + tamAnt).trim();
      if (motivo.length >= 20) {
        return;
      }
    }

    violacoes.push(...varrerLinha(linha, idx + 1, nomeArquivo));
  });
  return violacoes;
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

    it("permite exceção com justificativa válida (>= 20 caracteres)", () => {
      const code = `const water = jrc.unmask(0); // permitido: camada de exclusao booleana jrc sem dado`;
      const v = varrerCodigo(code, "teste.ts");
      expect(v.length).toBe(0);
    });

    it("rejeita exceção sem justificativa suficiente (< 20 caracteres)", () => {
      const code = `const water = jrc.unmask(0); // permitido: curto`;
      const v = varrerCodigo(code, "teste.ts");
      expect(v.length).toBeGreaterThan(0);
    });

    it("detecta síntese aleatória de atributos físicos em Python sem comentário permitido", () => {
      const code = `decliv = float(np.random.uniform(3.0, 14.0))`;
      const v = varrerCodigo(code, "teste.py");
      expect(v.some((x) => x.padrao === "sintese-aleatoria-atributos-fisicos")).toBe(true);
    });

    it("permite síntese em Python quando acompanhada de justificativa >= 20 chars com # permitido:", () => {
      const code = `decliv = float(np.random.uniform(3.0, 14.0)) # permitido: geracao explicita de benchmark de pipeline quando solicitado via flag dry-run`;
      const v = varrerCodigo(code, "teste.py");
      expect(v.length).toBe(0);
    });
  });

  describe("Varredura no código científico ativo em src/lib/", () => {
    function listarArquivosTs(dir: string): string[] {
      if (!fs.existsSync(dir)) return [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const arquivos: string[] = [];
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          arquivos.push(...listarArquivosTs(fullPath));
        } else if (entry.isFile() && fullPath.endsWith(".ts") && !fullPath.endsWith(".test.ts")) {
          arquivos.push(fullPath);
        }
      }
      return arquivos;
    }

    it("nenhum arquivo científico ativo deve conter padrões proibidos", () => {
      const raizLib = path.resolve(__dirname, "..");
      const arquivos = listarArquivosTs(raizLib);
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
  });

  describe("Varredura no código científico em scripts/ (Python e Node)", () => {
    function listarArquivosScripts(dir: string): string[] {
      if (!fs.existsSync(dir)) return [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const arquivos: string[] = [];
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== "__pycache__" && entry.name !== ".git") {
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

    it("nenhum script em scripts/ deve conter geração sintética não documentada ou padrões proibidos", () => {
      const raizScripts = path.resolve(process.cwd(), "scripts");
      const arquivos = listarArquivosScripts(raizScripts);
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
    });
  });
});
