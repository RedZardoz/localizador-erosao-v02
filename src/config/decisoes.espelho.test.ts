import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  ARQUIVO_MD,
  gerarMarkdownDecisoes,
  compararEspelho,
} from "../../scripts/gerar_decisoes_md.mjs";

describe("TAREFA 0.3 — Espelho fiel de DECISOES.md a partir de src/config/decisoes.ts", () => {
  it("DECISOES.md no disco deve ser estritamente idêntico ao gerado em memória a partir de decisoes.ts", () => {
    expect(fs.existsSync(ARQUIVO_MD), `Arquivo não encontrado: ${ARQUIVO_MD}`).toBe(true);

    const conteudoDisco = fs.readFileSync(ARQUIVO_MD, "utf8");
    const conteudoGerado = gerarMarkdownDecisoes();

    const resultado = compararEspelho(conteudoGerado, conteudoDisco);

    expect(
      resultado.identicos,
      `DECISOES.md no disco divergiu de src/config/decisoes.ts. Execute 'npm run decisoes:md' para regenerar.\nPrimeiras divergências:\n${resultado.diferencas.join("\n")}`
    ).toBe(true);
  });

  describe("Meta-testes: robustez da detecção de divergências", () => {
    it("deve detectar divergência plantada de estado textual", () => {
      const conteudoOriginal = fs.readFileSync(ARQUIVO_MD, "utf8");
      // Simula alteração indevida de estado no disco
      const conteudoPlantado = conteudoOriginal.replace("✅ Decidida", "⏳ Pendente");
      expect(conteudoPlantado).not.toEqual(conteudoOriginal);

      const resultado = compararEspelho(conteudoOriginal, conteudoPlantado);
      expect(resultado.identicos).toBe(false);
      expect(resultado.diferencas.length).toBeGreaterThan(0);
      expect(resultado.diferencas[0]).toContain("Pendente");
    });

    it("deve detectar divergência plantada por truncamento de conteúdo", () => {
      const conteudoOriginal = fs.readFileSync(ARQUIVO_MD, "utf8");
      const conteudoTruncado = conteudoOriginal.split("\n").slice(0, 30).join("\n");

      const resultado = compararEspelho(conteudoOriginal, conteudoTruncado);
      expect(resultado.identicos).toBe(false);
      expect(resultado.diferencas.length).toBeGreaterThan(0);
    });

    it("deve retornar identicos=true quando dois conteúdos normalizados forem idênticos", () => {
      const texto = "# Titulo\r\n\r\n| A | B |\r\n";
      const textoLf = "# Titulo\n\n| A | B |\n";
      const resultado = compararEspelho(texto, textoLf);
      expect(resultado.identicos).toBe(true);
      expect(resultado.diferencas).toEqual([]);
    });
  });
});
