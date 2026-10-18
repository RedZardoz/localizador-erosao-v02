import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("U03 — Rótulos acessíveis e alvos mínimos de 24 px (WCAG 2.5.8 / 4.1.2)", () => {
  const srcDir = path.resolve(__dirname, "../../");

  it("garante que o botão 'Gerenciar Áreas' no seletor lateral possui altura mínima de 24 px", () => {
    const conteudo = fs.readFileSync(
      path.join(srcDir, "components/sidebar/RegionAndTopNSelector.tsx"),
      "utf-8"
    );
    expect(conteudo).toMatch(/min-h-\[24px\]/);
  });

  it("garante que os botões de exagero vertical DEM 3D possuem alvo mínimo de 24x24 px", () => {
    const conteudo = fs.readFileSync(
      path.join(srcDir, "components/map/MapControls.tsx"),
      "utf-8"
    );
    expect(conteudo).toMatch(/min-w-\[24px\]/);
    expect(conteudo).toMatch(/min-h-\[24px\]/);
  });

  it("garante que os links de atribuição do MapLibre possuem alvo mínimo de 24x24 px em globals.css", () => {
    const conteudo = fs.readFileSync(
      path.join(srcDir, "app/globals.css"),
      "utf-8"
    );
    expect(conteudo).toMatch(/\.maplibregl-ctrl-attrib a/);
    expect(conteudo).toMatch(/min-height:\s*24px/);
    expect(conteudo).toMatch(/min-width:\s*24px/);
  });

  it("garante que os modais possuem botões de fechar com aria-label acessível", () => {
    const arquivosModais = [
      "components/region/CandidateSelectionModal.tsx",
      "components/campanha/PainelCampanhaModal.tsx",
      "components/matriz/PainelMatrizModal.tsx",
      "components/export/ExportModal.tsx",
      "components/audit/AuditDossierModal.tsx",
      "components/diagnostics/SystemLogsModal.tsx",
      "components/decisoes/DecisoesModal.tsx",
      "components/region/RegionRequestModal.tsx",
    ];

    for (const relPath of arquivosModais) {
      const conteudo = fs.readFileSync(path.join(srcDir, relPath), "utf-8");
      expect(conteudo, `Modal ${relPath} sem aria-label de fechar`).toMatch(
        /aria-label=["']Fechar[^"']*["']/
      );
    }
  });

  it("garante que os campos numéricos em CandidateSelectionModal possuem rótulo com htmlFor e id associados", () => {
    const conteudo = fs.readFileSync(
      path.join(srcDir, "components/region/CandidateSelectionModal.tsx"),
      "utf-8"
    );
    expect(conteudo).toMatch(/htmlFor="qtd-candidatos"/);
    expect(conteudo).toMatch(/id="qtd-candidatos"/);
    expect(conteudo).toMatch(/htmlFor="raio-thinning"/);
    expect(conteudo).toMatch(/id="raio-thinning"/);
    expect(conteudo).toMatch(/htmlFor="freq-solo-nu-min"/);
    expect(conteudo).toMatch(/id="freq-solo-nu-min"/);
    expect(conteudo).toMatch(/htmlFor="decliv-min"/);
    expect(conteudo).toMatch(/id="decliv-min"/);
    expect(conteudo).toMatch(/htmlFor="decliv-max"/);
    expect(conteudo).toMatch(/id="decliv-max"/);
    expect(conteudo).toMatch(/htmlFor="subamostra-in-loco"/);
    expect(conteudo).toMatch(/id="subamostra-in-loco"/);
  });

  it("garante que o campo de busca em DecisoesModal possui aria-label acessível", () => {
    const conteudo = fs.readFileSync(
      path.join(srcDir, "components/decisoes/DecisoesModal.tsx"),
      "utf-8"
    );
    expect(conteudo).toMatch(/aria-label="Buscar decisão por ID, título, autor ou referência"/);
  });
});
