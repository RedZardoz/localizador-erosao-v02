import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

export interface ViolacaoCegamentoArtefato {
  arquivo: string;
  motivo: string;
  trechoInfrator: string;
}

const PADRAO_CODIGO_CEGO = /VANT-BLIND-[0-9A-Fa-f]{6,}/;

const PADROES_PROIBIDOS_COM_CODIGO_CEGO: Array<{ nome: string; regex: RegExp }> = [
  { nome: "estratoId", regex: /\b(estratoId|estrato)\b|E_\d_\d_\d|S[123]_E[123]_K[12]/i },
  { nome: "papelConjunto", regex: /\b(papelConjunto|treino|held-out|held_out)\b/i },
  { nome: "nivelK", regex: /\b(nivelK|k_solos|erodibilidade)\b/i },
  { nome: "idPoligono", regex: /\b(idPoligono|codigoPoligono)\b|D16_[A-Za-z0-9_]+/i },
  { nome: "coordenadas", regex: /\b(centroideLat|centroideLon|latitude|longitude)\b/i },
];

/**
 * Inspeciona o conteúdo de um artefato emitido para garantir que NENHUM documento
 * contenha, simultaneamente, um código opaco de intérprete (VANT-BLIND-*) e qualquer
 * atributo de desenho amostral (estratoId, papelConjunto, nivelK, idPoligono ou coordenada).
 * Disciplina pericial W2 / Y5 / Z5 / X5.
 */
export function verificarCegamentoArtefato(
  conteudo: string,
  nomeArquivo: string
): ViolacaoCegamentoArtefato[] {
  const violacoes: ViolacaoCegamentoArtefato[] = [];

  const temCodigoCego = PADRAO_CODIGO_CEGO.test(conteudo);
  if (!temCodigoCego) {
    return violacoes;
  }

  for (const { nome, regex } of PADROES_PROIBIDOS_COM_CODIGO_CEGO) {
    const match = regex.exec(conteudo);
    if (match) {
      violacoes.push({
        arquivo: nomeArquivo,
        motivo: `Artefato contém simultaneamente código opaco VANT-BLIND e atributo de desenho '${nome}'.`,
        trechoInfrator: match[0],
      });
    }
  }

  return violacoes;
}

export function coletarArquivosDeDiretorios(diretorios: string[]): string[] {
  const arquivos: string[] = [];
  for (const dir of diretorios) {
    if (!fs.existsSync(dir)) continue;
    const entradas = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entradas) {
      const caminho = path.join(dir, e.name);
      if (e.isDirectory()) {
        arquivos.push(...coletarArquivosDeDiretorios([caminho]));
      } else if (e.isFile()) {
        arquivos.push(caminho);
      }
    }
  }
  return arquivos;
}

describe("Auditoria Pericial de Cegamento nos Artefatos Emitidos (W2 / Y5 / Z5 / X5)", () => {
  it("meta-teste: detector deve sinalizar vazamento quando código cego e atributos coexistirem", () => {
    const docComVazamento = "codigoOpacoInterprete,estratoId\nVANT-BLIND-A1B2C3D4E5,E_1_1_1";
    const violacoes = verificarCegamentoArtefato(docComVazamento, "teste_vazamento.csv");
    expect(violacoes.length).toBeGreaterThan(0);
    expect(violacoes[0].motivo).toContain("estratoId");

    const docInterpreteValido = "codigoOpacoInterprete,cameraName\nVANT-BLIND-A1B2C3D4E5,Micasense Altum";
    expect(verificarCegamentoArtefato(docInterpreteValido, "manifesto_valido.csv")).toHaveLength(0);

    const docPilotoValido = "idPoligono,estratoId,papelConjunto\nD16_01,E_1_1_1,treino";
    expect(verificarCegamentoArtefato(docPilotoValido, "roteiro_valido.csv")).toHaveLength(0);
  });

  it("meta-teste: varredura de artefatos de voo em diretório vazio falha compulsoriamente por piso mínimo", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "meta_test_cegamento_vazio_"));
    try {
      const arquivosTmp = coletarArquivosDeDiretorios([tmpDir]);
      const PISO_MINIMO = 6;
      expect(() => {
        expect(
          arquivosTmp.length,
          `Varredura de artefatos de voo e calculadora examinou apenas ${arquivosTmp.length} arquivos (esperado >= ${PISO_MINIMO}). Diretório vazio ou inexistente: ${tmpDir}`
        ).toBeGreaterThanOrEqual(PISO_MINIMO);
      }).toThrow(/Diretório vazio ou inexistente/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("meta-teste K2: detector falha compulsoriamente se git ls-files retornar vazio ou abaixo do piso", () => {
    const rawGitSimuladoVazio: string = "";
    expect(() => {
      const temConteudo = rawGitSimuladoVazio.trim().length > 0;
      expect(
        temConteudo,
        "Comando 'git ls-files' retornou saída vazia. Ambiente git indisponível ou repositório corrompido."
      ).toBe(true);
    }).toThrow(/Ambiente git indisponível ou repositório corrompido/);

    const arquivosFiltradosSimulados: string[] = [];
    const PISO_MINIMO = 220;
    expect(() => {
      expect(
        arquivosFiltradosSimulados.length,
        `Varredura de cegamento K2 examinou apenas ${arquivosFiltradosSimulados.length} arquivos versionados (esperado >= ${PISO_MINIMO}).`
      ).toBeGreaterThanOrEqual(PISO_MINIMO);
    }).toThrow(/Varredura de cegamento K2 examinou apenas 0 arquivos/);
  });

  it("nenhum artefato emitido em docs/verificacoes/voo_ncontrol/ e docs/verificacoes/calculadora/ deve conter código opaco e atributos de desenho", () => {
    const dirsAlvo = [
      path.resolve(process.cwd(), "docs/verificacoes/voo_ncontrol"),
      path.resolve(process.cwd(), "docs/verificacoes/calculadora"),
    ];

    const arquivos = coletarArquivosDeDiretorios(dirsAlvo);

    // Piso mínimo de artefatos examinados (medido hoje: 9 arquivos; folga de ~67% => piso 6)
    const PISO_MINIMO_ARTEFATOS_VOO = 6;
    expect(
      arquivos.length,
      `Varredura de artefatos de voo e calculadora examinou apenas ${arquivos.length} arquivos (esperado >= ${PISO_MINIMO_ARTEFATOS_VOO}). Verifique se as pastas docs/verificacoes/voo_ncontrol e calculadora foram renomeadas ou apagadas.`
    ).toBeGreaterThanOrEqual(PISO_MINIMO_ARTEFATOS_VOO);

    const todasViolacoes: ViolacaoCegamentoArtefato[] = [];

    for (const caminhoCompleto of arquivos) {
      if (caminhoCompleto.endsWith(".tif") || caminhoCompleto.endsWith(".db")) continue;

      const conteudo = fs.readFileSync(caminhoCompleto, "utf-8");
      const nomeRelativo = path.relative(process.cwd(), caminhoCompleto);
      const v = verificarCegamentoArtefato(conteudo, nomeRelativo);
      todasViolacoes.push(...v);
    }

    expect(
      todasViolacoes,
      `Vazamento de correspondência cega detectado nos seguintes artefatos:\n${todasViolacoes
        .map((x) => `  - ${x.arquivo}: ${x.motivo} (trecho: '${x.trechoInfrator}')`)
        .join("\n")}`
    ).toEqual([]);
  });

  it("nenhum arquivo sob controle de versão (git) deve conter simultaneamente código opaco VANT-BLIND-* e identificador de polígono D16_E_* (K2)", () => {
    let rawGitFiles: string;
    try {
      rawGitFiles = execSync("git ls-files", { encoding: "utf-8" });
    } catch (err) {
      expect.fail(
        `Falha ao executar 'git ls-files' para inspeção de cegamento K2: ${
          err instanceof Error ? err.message : String(err)
        }. Verifique se o git está instalado e acessível no ambiente.`
      );
    }

    expect(
      rawGitFiles && rawGitFiles.trim().length > 0,
      "Comando 'git ls-files' retornou saída vazia. Ambiente git indisponível ou repositório corrompido."
    ).toBe(true);

    const arquivosVersionados = rawGitFiles
      .split(/\r?\n/)
      .map((f) => f.trim())
      .filter((f) => {
        if (!f || !fs.existsSync(f)) return false;
        // Binários não textuais ou arquivos grandes
        if (
          f.endsWith(".png") ||
          f.endsWith(".pdf") ||
          f.endsWith(".tif") ||
          f.endsWith(".db") ||
          f.endsWith(".zip") ||
          f.endsWith(".tar") ||
          f.endsWith(".gz")
        ) {
          return false;
        }
        // Exclui arquivos de teste e prompts documentais em docs/planejamento/ (contêm literais ilustrativos de asserção)
        if (f.includes(".test.") || f.startsWith("docs/planejamento/")) {
          return false;
        }
        const stat = fs.statSync(f);
        if (stat.size > 1024 * 1024) {
          return false;
        }
        return true;
      });

    // Piso mínimo de arquivos versionados filtrados (medido hoje: 311 arquivos filtrados; folga ~71% => piso 220)
    const PISO_MINIMO_ARQUIVOS_GIT = 220;
    expect(
      arquivosVersionados.length,
      `Varredura de cegamento K2 examinou apenas ${arquivosVersionados.length} arquivos versionados (esperado >= ${PISO_MINIMO_ARQUIVOS_GIT}). Possível falha na listagem do git ou filtros excessivamente restritivos.`
    ).toBeGreaterThanOrEqual(PISO_MINIMO_ARQUIVOS_GIT);

    const PADRAO_VANT_BLIND_HEX = /VANT-BLIND-[0-9A-Fa-f]{6,}/;
    const PADRAO_ID_D16_E = /D16_E_[0-9A-Za-z_]+/;

    const violacoesVersionadas: Array<{ arquivo: string; motivo: string }> = [];

    for (const relPath of arquivosVersionados) {
      const absPath = path.resolve(process.cwd(), relPath);
      const conteudo = fs.readFileSync(absPath, "utf-8");

      const temVantBlind = PADRAO_VANT_BLIND_HEX.test(conteudo);
      const temIdPoligono = PADRAO_ID_D16_E.test(conteudo);

      if (temVantBlind && temIdPoligono) {
        violacoesVersionadas.push({
          arquivo: relPath,
          motivo:
            "Arquivo versionado contém simultaneamente código VANT-BLIND-* e identificador de polígono D16_E_* (quebra do isolamento cego K2).",
        });
      }
    }

    expect(
      violacoesVersionadas,
      `Vazamento em arquivos sob controle de versão:\n${violacoesVersionadas
        .map((x) => `  - ${x.arquivo}: ${x.motivo}`)
        .join("\n")}`
    ).toEqual([]);
  }, 20000);
});
