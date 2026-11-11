import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { CRITERIOS_ESPECTRAIS } from "@/lib/gee/amostragemBiofisica";

describe("C20 — Classe amostral exibida como candidato espectral, não rótulo (Emenda D02)", () => {
  const dirComponents = path.resolve(process.cwd(), "src/components");

  function listarArquivosRecursivo(dir: string): string[] {
    const entradas = fs.readdirSync(dir, { withFileTypes: true });
    const arquivos: string[] = [];
    for (const entrada of entradas) {
      const res = path.resolve(dir, entrada.name);
      if (entrada.isDirectory()) {
        arquivos.push(...listarArquivosRecursivo(res));
      } else if (
        (entrada.name.endsWith(".ts") || entrada.name.endsWith(".tsx")) &&
        !entrada.name.includes(".test.")
      ) {
        arquivos.push(res);
      }
    }
    return arquivos;
  }

  it("nenhum dos textos antigos permanece em src/components", () => {
    const arquivos = listarArquivosRecursivo(dirComponents);
    const textosProibidos = [
      "Erosão Laminar (Classe 1)",
      "Controle / SPD (Classe 0)",
      "Erosão (Classe 1)",
      "Classe 1 (Erosão",
      "Classe 0 (Controle",
    ];

    const violacoes: string[] = [];
    for (const arq of arquivos) {
      const conteudo = fs.readFileSync(arq, "utf8");
      const rel = path.relative(process.cwd(), arq).replace(/\\/g, "/");
      for (const proibido of textosProibidos) {
        if (conteudo.includes(proibido)) {
          violacoes.push(`${rel} contém '${proibido}'`);
        }
      }
    }

    expect(violacoes).toEqual([]);
  });

  it("proíbe 'Classe 1' e 'Classe 0' como rótulo de ponto biofísico em amostragemBiofisica.ts", () => {
    expect(CRITERIOS_ESPECTRAIS.EROSAO.rotulo).not.toContain("Classe 1");
    expect(CRITERIOS_ESPECTRAIS.EROSAO.rotulo).not.toContain("Classe 0");
    expect(CRITERIOS_ESPECTRAIS.CONTROLE.rotulo).not.toContain("Classe 1");
    expect(CRITERIOS_ESPECTRAIS.CONTROLE.rotulo).not.toContain("Classe 0");

    expect(CRITERIOS_ESPECTRAIS.EROSAO.rotulo).toBe("Candidato espectral a erosão");
    expect(CRITERIOS_ESPECTRAIS.CONTROLE.rotulo).toBe("Candidato espectral a controle");

    const caminhoAmostragem = path.resolve(
      process.cwd(),
      "src/lib/gee/amostragemBiofisica.ts"
    );
    const conteudo = fs.readFileSync(caminhoAmostragem, "utf8");
    expect(conteudo).not.toContain("Classe 1 (Erosão Laminar Ativa)");
    expect(conteudo).not.toContain("Classe 0 (Controle / SPD Pleno)");
    expect(conteudo).not.toContain('rotulo: "Erosão Laminar (Classe 1)"');
    expect(conteudo).not.toContain('rotulo: "Controle / SPD (Classe 0)"');
  });

  it("presença de 'candidato espectral' e 'não é rótulo' em MapViewer.tsx e PointPopup.tsx", () => {
    const caminhoMap = path.resolve(process.cwd(), "src/components/map/MapViewer.tsx");
    const caminhoPopup = path.resolve(process.cwd(), "src/components/map/PointPopup.tsx");

    const conteudoMap = fs.readFileSync(caminhoMap, "utf8");
    const conteudoPopup = fs.readFileSync(caminhoPopup, "utf8");

    const textoErosao =
      "Candidato espectral a erosão (limiar BSI/NDVI) — não é rótulo";
    const textoControle =
      "Candidato espectral a controle (limiar BSI/NDVI) — não é rótulo";

    expect(conteudoMap, "MapViewer deve conter texto de erosão reformulado").toContain(
      textoErosao
    );
    expect(conteudoMap, "MapViewer deve conter texto de controle reformulado").toContain(
      textoControle
    );

    expect(conteudoPopup, "PointPopup deve conter texto de erosão reformulado").toContain(
      textoErosao
    );
    expect(conteudoPopup, "PointPopup deve conter texto de controle reformulado").toContain(
      textoControle
    );
  });
});
