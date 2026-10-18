import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ApiTokensManager } from "./ApiTokensManager";
import { useSarelStore } from "@/store/useSarelStore";
import fs from "fs";
import path from "path";

describe("N15: ApiTokensManager não afirma o que não foi verificado", () => {
  beforeEach(() => {
    useSarelStore.setState({
      credenciais: {
        geeSessionActive: false,
        gcpCredentials: null,
        mapboxToken: "pk.test-fake-token",
        planetApiKey: "planet-api-key-test-123456",
        cartoApiKey: "carto-key-test",
        googleMapsKey: "AIzaTestFakeKey",
        embrapaToken: "",
        jevApiKey: "jev-test-key",
      },
    });
  });

  it("renderização estática (sem validação de rede) não deve conter 'ATIVADA'", () => {
    useSarelStore.getState().setCredenciais({
      planetApiKey: "planet-api-key-test-123456",
      cartoApiKey: "carto-key-test",
      googleMapsKey: "AIzaTestFakeKey",
      jevApiKey: "jev-test-key",
      mapboxToken: "pk.test-fake-token",
    });
    Object.assign(useSarelStore.getInitialState(), useSarelStore.getState());
    const html = renderToStaticMarkup(React.createElement(ApiTokensManager));

    expect(html).not.toContain(">ATIVADA<");
    expect(html).toContain("CONFIGURADA, NÃO VERIFICADA");
  });

  it("garante que 'validada' em src/components/config ocorre exclusivamente em ramos que dependem de rede", () => {
    const configDir = path.resolve(process.cwd(), "src/components/config");
    const files = fs.readdirSync(configDir).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));

    const matches: { file: string; line: number; text: string }[] = [];
    for (const file of files) {
      if (file.includes(".test.")) continue;
      const content = fs.readFileSync(path.join(configDir, file), "utf-8");
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        if (/\bvalidada\b/i.test(line)) {
          matches.push({ file, line: index + 1, text: line.trim() });
        }
      });
    }

    // Apenas ramos com resposta de rede comprovada são autorizados
    for (const m of matches) {
      expect(m.file).toBe("ApiTokensManager.tsx");
    }
    expect(matches.length).toBe(3);
  });
});
