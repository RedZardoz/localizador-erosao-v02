import { describe, it, expect } from "vitest";
import path from "path";
import {
  gerarRelatorioFasePericial,
  inspecionarArtefatos,
  calcularSha256Arquivo,
} from "../../../scripts/gerar_relatorio_fase";

describe("Gerador Mecânico de Relatório de Fase (W5)", () => {
  it("marca FALHA no topo quando a suíte de testes ou tipagem falha", () => {
    const relatorioFalha = gerarRelatorioFasePericial({
      artefatosParaInspecionar: ["package.json"],
      mockResultadoTsc: {
        comando: "npx tsc --noEmit",
        codigoSaida: 1,
        sucesso: false,
        saida: "error TS2304: Cannot find name 'foo'.",
      },
      mockResultadoVitest: {
        comando: "npx vitest run",
        codigoSaida: 0,
        sucesso: true,
        saida: "336 passed",
      },
    });

    expect(relatorioFalha.statusGeral).toBe("FALHA");
    expect(relatorioFalha.conteudoMarkdown).toContain("# 🚨 [FALHA NA SUÍTE DE TESTES]");
    expect(relatorioFalha.conteudoMarkdown).toContain("error TS2304");
  });

  it("marca SUCESSO quando a suíte passa e inclui SHA-256 e tamanho de cada artefato", () => {
    const relatorioSucesso = gerarRelatorioFasePericial({
      artefatosParaInspecionar: ["package.json", "tsconfig.json"],
      mockResultadoTsc: {
        comando: "npx tsc --noEmit",
        codigoSaida: 0,
        sucesso: true,
        saida: "",
      },
      mockResultadoVitest: {
        comando: "npx vitest run",
        codigoSaida: 0,
        sucesso: true,
        saida: "Test Files 45 passed (45)\nTests 338 passed (338)",
      },
    });

    expect(relatorioSucesso.statusGeral).toBe("SUCESSO");
    expect(relatorioSucesso.conteudoMarkdown).toContain("# ✅ [SUCESSO - SUÍTE 100% APROVADA]");

    // SHA-256 e tamanho dos artefatos listados
    const shaPkg = calcularSha256Arquivo(path.resolve(process.cwd(), "package.json"));
    expect(relatorioSucesso.conteudoMarkdown).toContain(shaPkg);
    expect(relatorioSucesso.conteudoMarkdown).toContain("`package.json`");
  });

  it("inspeciona artefatos e calcula SHA-256 real", () => {
    const itens = inspecionarArtefatos(["package.json"]);
    expect(itens).toHaveLength(1);
    expect(itens[0].existe).toBe(true);
    expect(itens[0].tamanhoBytes).toBeGreaterThan(0);
    expect(itens[0].sha256).toMatch(/^[0-9a-f]{64}$/);
  });
});
