import { describe, it, expect } from "vitest";
import { BLOCOS_PREDITORES_D24 } from "./PainelCriterioRefutacaoD25";

describe("PainelCriterioRefutacaoD25 e Regime D24 / D26", () => {
  it("deve definir exatamente os 4 blocos físicos com teto total de 14 preditores", () => {
    expect(BLOCOS_PREDITORES_D24).toHaveLength(4);

    const somaTetos = BLOCOS_PREDITORES_D24.reduce((acc, b) => acc + b.tetoPreditores, 0);
    expect(somaTetos).toBe(14);

    const blocoEspectro = BLOCOS_PREDITORES_D24.find((b) => b.bloco === "Espectro-Temporal");
    expect(blocoEspectro?.tetoPreditores).toBe(8);
    expect(blocoEspectro?.statusRegime).toBe("adequado");

    const blocoTerreno = BLOCOS_PREDITORES_D24.find((b) => b.bloco === "Terreno");
    expect(blocoTerreno?.tetoPreditores).toBe(4);
    expect(blocoTerreno?.statusRegime).toBe("abaixo_regime_fisico");

    const blocoSolo = BLOCOS_PREDITORES_D24.find((b) => b.bloco === "Solo");
    expect(blocoSolo?.tetoPreditores).toBe(1);
    expect(blocoSolo?.statusRegime).toBe("abaixo_regime_fisico");

    const blocoChuva = BLOCOS_PREDITORES_D24.find((b) => b.bloco === "Chuva");
    expect(blocoChuva?.tetoPreditores).toBe(1);
    expect(blocoChuva?.statusRegime).toBe("abaixo_regime_fisico");
  });

  it("deve registrar que 3 dos 4 blocos operam abaixo do regime estatístico recomendado", () => {
    const blocosAbaixo = BLOCOS_PREDITORES_D24.filter((b) => b.statusRegime === "abaixo_regime_fisico");
    expect(blocosAbaixo).toHaveLength(3);
  });
});
