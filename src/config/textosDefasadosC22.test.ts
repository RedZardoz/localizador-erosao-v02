import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { validarInvariantesArtefato } from "@/lib/matriz/invariantes";

describe("C22 — Textos defasados corrigidos", () => {
  it("o número de invariantes citado em PainelMatrizModal.tsx é igual ao do código", () => {
    const caminhoModal = path.resolve(
      process.cwd(),
      "src/components/matriz/PainelMatrizModal.tsx"
    );
    const conteudoModal = fs.readFileSync(caminhoModal, "utf8");

    // Extrai o número de invariantes mencionado
    const match = conteudoModal.match(/verificação dos (\d+) invariantes/);
    expect(match, "deve mencionar 'verificação dos N invariantes'").not.toBeNull();
    const numModal = parseInt(match![1], 10);

    // O código de invariantes valida os invariantes 1 a 7
    // Verifica que numModal é exatamente 7
    expect(numModal).toBe(7);
  });

  it("gerar_manual_pdf.py não deve conter '231 testes' nem '35 suites'", () => {
    const caminhoScript = path.resolve(
      process.cwd(),
      "scripts/gerar_manual_pdf.py"
    );
    const conteudoScript = fs.readFileSync(caminhoScript, "utf8");

    expect(conteudoScript).not.toContain("231 testes");
    expect(conteudoScript).not.toContain("35 suites");
  });

  it("LEIA-ME_NAO_VOAR.md não deve conter 'Não existe leitor real do GLO-30 no repositório'", () => {
    const caminhoLeiaMe = path.resolve(
      process.cwd(),
      "docs/verificacoes/voo_ncontrol/LEIA-ME_NAO_VOAR.md"
    );
    const conteudoLeiaMe = fs.readFileSync(caminhoLeiaMe, "utf8");

    expect(conteudoLeiaMe).not.toContain(
      "Não existe leitor real do GLO-30 no repositório"
    );
    expect(conteudoLeiaMe).toMatch(
      /amostrador real.*GLO-30|criarAmostradorCopernicusGLO30Real|reduzir_terreno_copernicus/
    );
  });
});
