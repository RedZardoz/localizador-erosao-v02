import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("C19 — Selo de demonstração nas métricas fictícias do painel da campanha", () => {
  const caminhoPainel = path.resolve(
    process.cwd(),
    "src/components/campanha/PainelCampanha.tsx"
  );
  const conteudoPainel = fs.readFileSync(caminhoPainel, "utf8");

  it("não deve conter o texto 'Calcular Métricas' no arquivo", () => {
    expect(conteudoPainel).not.toMatch(/Calcular M[ée]tricas/);
  });

  it("o botão deve indicar execução de demonstração com pixels fictícios", () => {
    expect(conteudoPainel).toContain("Executar demonstração com pixels fictícios");
  });

  it("cada um dos 6 cartões de métrica do demo deve conter o selo 'DEMONSTRAÇÃO — pixels fictícios, não é validação'", () => {
    const seloEsperado = "DEMONSTRAÇÃO — pixels fictícios, não é validação";

    // Extrai o bloco de cartões de metricasSimuladas
    const matchMetricas = conteudoPainel.match(
      /\{metricasSimuladas\s*&&[\s\S]*?<div className="grid grid-cols-2[\s\S]*?<\/div>\s*<\/div>\s*\)\}/
    );
    expect(matchMetricas, "bloco de cartões de metricasSimuladas deve existir").not.toBeNull();

    const blocoCartoes = matchMetricas![0];

    const metricas = [
      "Acurácia Global (OA)",
      "Kappa (κ)",
      "F1-Score",
      "Precisão",
      "IoU (Jaccard)",
      "Confronto Radiom.",
    ];

    for (const metrica of metricas) {
      const idxMetrica = blocoCartoes.indexOf(metrica);
      expect(idxMetrica, `métrica ${metrica} deve estar presente`).toBeGreaterThan(-1);

      // O cartão correspondente (janela de 300 caracteres ao redor) deve conter o selo
      const trechoCartao = blocoCartoes.slice(
        Math.max(0, idxMetrica - 100),
        idxMetrica + 500
      );
      expect(
        trechoCartao,
        `cartão da métrica '${metrica}' deve conter o selo de demonstração`
      ).toContain(seloEsperado);
    }
  });
});
