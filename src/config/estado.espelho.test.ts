import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  ARQUIVO_ESTADO_MD,
  gerarEstadoMarkdown,
  compararEspelho,
} from "../../scripts/auditoria/estado_do_projeto.mjs";

describe("TAREFA 2 — Espelho fiel de ESTADO.md a partir de medições do repositório", () => {
  it("ESTADO.md no disco deve ser estritamente idêntico ao gerado em memória pelo script de auditoria", async () => {
    expect(fs.existsSync(ARQUIVO_ESTADO_MD), `Arquivo não encontrado: ${ARQUIVO_ESTADO_MD}`).toBe(true);

    const conteudoDisco = fs.readFileSync(ARQUIVO_ESTADO_MD, "utf8");
    const conteudoGerado = await gerarEstadoMarkdown();

    const resultado = compararEspelho(conteudoGerado, conteudoDisco);

    expect(
      resultado.identicos,
      `ESTADO.md no disco divergiu do estado medido do repositório. Execute 'npm run estado' para regenerar.\nPrimeiras divergências:\n${resultado.diferencas.join("\n")}`
    ).toBe(true);
  }, 30000);

  describe("Meta-testes: robustez da detecção de divergências em ESTADO.md", () => {
    it("deve detectar divergência plantada de commit ou metadado", () => {
      const conteudoOriginal = fs.readFileSync(ARQUIVO_ESTADO_MD, "utf8");
      const conteudoPlantado = conteudoOriginal.replace(
        "## 1. Controle de Versão (Git)",
        "## 1. Controle de Versão (Git)\n- Commit adulterado: `fake-commit-12345`"
      );
      expect(conteudoPlantado).not.toEqual(conteudoOriginal);

      const resultado = compararEspelho(conteudoOriginal, conteudoPlantado);
      expect(resultado.identicos).toBe(false);
      expect(resultado.diferencas.length).toBeGreaterThan(0);
      expect(resultado.diferencas[0]).toContain("fake-commit-12345");
    });

    it("deve detectar divergência plantada por truncamento de conteúdo", () => {
      const conteudoOriginal = fs.readFileSync(ARQUIVO_ESTADO_MD, "utf8");
      const conteudoTruncado = conteudoOriginal.split("\n").slice(0, 15).join("\n");

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
