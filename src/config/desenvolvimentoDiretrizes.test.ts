import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("TAREFA 4 — Integridade do ponteiro CLAUDE.md e de docs/DESENVOLVIMENTO.md", () => {
  const repoRoot = process.cwd();
  const caminhoClaude = path.join(repoRoot, "CLAUDE.md");
  const caminhoDesenvolvimento = path.join(repoRoot, "docs", "DESENVOLVIMENTO.md");

  it("CLAUDE.md deve existir na raiz do repositório", () => {
    expect(fs.existsSync(caminhoClaude), `Arquivo CLAUDE.md ausente na raiz: ${caminhoClaude}`).toBe(true);
  });

  it("CLAUDE.md deve referenciar docs/DESENVOLVIMENTO.md e o arquivo referenciado deve existir no disco", () => {
    const conteudo = fs.readFileSync(caminhoClaude, "utf8");
    expect(
      conteudo,
      "CLAUDE.md não referencia docs/DESENVOLVIMENTO.md. O ponteiro de inicialização está quebrado."
    ).toContain("docs/DESENVOLVIMENTO.md");

    expect(
      fs.existsSync(caminhoDesenvolvimento),
      `Arquivo referenciado docs/DESENVOLVIMENTO.md não foi encontrado no disco: ${caminhoDesenvolvimento}`
    ).toBe(true);
  });

  it("CLAUDE.md deve ser um ponteiro enxuto de no máximo 8 linhas", () => {
    const conteudo = fs.readFileSync(caminhoClaude, "utf8");
    const linhas = conteudo.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    expect(
      linhas.length,
      `CLAUDE.md possui ${linhas.length} linhas; o limite estrito para o ponteiro é de no máximo 8 linhas.`
    ).toBeLessThanOrEqual(8);
  });

  it("CLAUDE.md deve citar os dois arquivos de leitura obrigatória no início de sessão", () => {
    const conteudo = fs.readFileSync(caminhoClaude, "utf8");
    expect(conteudo).toContain("docs/planejamento/ESTADO.md");
    expect(conteudo).toContain("docs/planejamento/DECISOES_DE_CONVERSA.md");
  });

  it("docs/DESENVOLVIMENTO.md deve conter as seções essenciais de governança, leitura obrigatória e armadilhas de ambiente", () => {
    const conteudo = fs.readFileSync(caminhoDesenvolvimento, "utf8");
    expect(conteudo).toContain("Leitura Obrigatória no Início de Toda Sessão");
    expect(conteudo).toContain("docs/planejamento/ESTADO.md");
    expect(conteudo).toContain("docs/planejamento/DECISOES_DE_CONVERSA.md");
    // Trava não-vácua (Tarefa 6.1): exige 'npm run estado' isolado fora de 'estado:verificar'
    expect(conteudo).toMatch(/npm run estado(?!:)/);
    expect(conteudo).toContain("npm run estado:verificar");
    expect(conteudo).toContain("As 9 Regras Invioláveis da Lei Fundamental");
    expect(conteudo).toContain("Três Verdes Obrigatórios");
    expect(conteudo).toContain("Ambiente de Desenvolvimento — Armadilhas Críticas");
    expect(conteudo).toContain("npm ci");
    expect(conteudo).toContain("next start");
  });

  it("meta-teste (Tarefa 6.1): prova que a asserção de 'npm run estado' não é vácua frente a 'estado:verificar'", () => {
    // Texto simulado contendo apenas o comando de verificação:
    const textoApenasVerificar = "Para auditar o painel, execute exclusivamente npm run estado:verificar.";

    // A asserção ingênua anterior (.toContain) passava erroneamente por ser vácua:
    expect(textoApenasVerificar.includes("npm run estado")).toBe(true);

    // A nova asserção com fronteira negativa (/npm run estado(?!:)/) falha rigorosamente:
    const regexGeracao = /npm run estado(?!:)/;
    expect(regexGeracao.test(textoApenasVerificar)).toBe(false);

    // E é satisfeita quando o comando de geração legítimo está presente:
    const textoComAmbos = "Geração: npm run estado | Verificação: npm run estado:verificar";
    expect(regexGeracao.test(textoComAmbos)).toBe(true);
  });
});
