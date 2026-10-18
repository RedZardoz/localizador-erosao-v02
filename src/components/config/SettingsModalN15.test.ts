import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("SettingsModal — integridade de textos e sem fabricação de zero (N15-fix)", () => {
  const filePath = path.resolve(process.cwd(), "src/components/config/SettingsModal.tsx");
  const content = fs.readFileSync(filePath, "utf8");

  it("não deve aplicar '|| 0' à propriedade tabelas", () => {
    // Proíbe 'tabelas || 0' ou 'tabelas: ... || 0'
    const padraoTabelasZero = /tabelas\s*(?::\s*[^,\n]+)?\s*\|\|\s*0/;
    expect(content).not.toMatch(padraoTabelasZero);
  });

  it("deve conter os textos obrigatórios de diferenciação de status", () => {
    // 1. "base local presente (N tabelas)" (com interpolação ou menção a TABELAS)
    expect(content.toLowerCase()).toMatch(/base local presente.*tabelas/i);

    // 2. "base local presente, tabelas não lidas" quando tabelas for null
    expect(content.toLowerCase()).toContain("base local presente, tabelas não lidas");

    // 3. "base local ausente"
    expect(content.toLowerCase()).toContain("base local ausente");

    // 4. "status não verificado nesta sessão"
    expect(content.toLowerCase()).toContain("status não verificado nesta sessão");
  });
});
