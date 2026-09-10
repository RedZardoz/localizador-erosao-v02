import { describe, it, expect } from "vitest";
import { execFile } from "child_process";
import path from "path";

describe("Serviço de Consulta Fundiária (SICAR / SNCR)", () => {
  const scriptPath = path.join(
    process.cwd(),
    "src",
    "lib",
    "fundiario",
    "cadastre_service.py"
  );

  it("recusa UF diferente do Paraná com base-nao-disponivel", async () => {
    const res = await new Promise<any>((resolve) => {
      execFile("python", [scriptPath, "-27.0", "-50.0", "SC"], (err, stdout) => {
        resolve(JSON.parse(stdout.trim()));
      });
    });

    expect(res.status).toBe("base-nao-disponivel");
  });

  it("encontra imóvel cadastrado no SICAR PR com código CAR oficial e titular mascarado (LGPD)", async () => {
    // Coordenadas conhecidas em Abatiá (PR)
    const res = await new Promise<any>((resolve) => {
      execFile("python", [scriptPath, "-23.338", "-50.325", "PR"], (err, stdout) => {
        resolve(JSON.parse(stdout.trim()));
      });
    });

    expect(["encontrado", "aproximado"]).toContain(res.status);
    expect(res.codigoCar).toMatch(/^PR-\d+/);
    expect(res.uf).toBe("PR");
    expect(res.areaImovelHa).toBeGreaterThan(0);
    // Titular deve estar sob LGPD (mascarado com '*') se indexado, ou nulo se não disponível
    if (res.titularMascarado) {
      expect(res.titularMascarado).toContain("*");
    } else {
      expect(res.titularMascarado).toBeNull();
    }
    // Deve conter o polígono vetorial GeoJSON
    expect(res.poligonoGeoJson).toBeDefined();
    expect(res.poligonoGeoJson.type).toBe("Feature");
    expect(res.poligonoGeoJson.geometry.type).toBe("Polygon");
  });
});
