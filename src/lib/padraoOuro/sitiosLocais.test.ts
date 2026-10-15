import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { carregarSitiosLocais } from "./sitiosLocais";
import { SITIOS_PADRAO_OURO } from "./sitiosReferencia";

describe("Sítios Locais (DEC-10, Opção C — Isolamento LGPD)", () => {
  let tmpDir: string;
  const originalDataDir = process.env.SAREL_DATA_DIR;
  const originalShaEnv = process.env.SAREL_SITIOS_SHA256;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sarel-sitios-test-"));
    process.env.SAREL_DATA_DIR = tmpDir;
    delete process.env.SAREL_SITIOS_SHA256;
  });

  afterEach(() => {
    if (originalDataDir !== undefined) {
      process.env.SAREL_DATA_DIR = originalDataDir;
    } else {
      delete process.env.SAREL_DATA_DIR;
    }
    if (originalShaEnv !== undefined) {
      process.env.SAREL_SITIOS_SHA256 = originalShaEnv;
    } else {
      delete process.env.SAREL_SITIOS_SHA256;
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const FIXTURE_SINTETICA = {
    versao: 1,
    aviso: "SINTETICO_TESTE_ENCANAMENTO",
    gerado_em: new Date().toISOString(),
    sitios: [
      {
        id: "sitio-ouro-01",
        codigoCar: "CAR-SINTETICO-01",
        nomeIdentificador: "Sitio Sintetico Alfa",
        municipio: "Medianeira",
        bbox: [-54.02, -25.30, -54.01, -25.29] as [number, number, number, number],
        geometry: {
          type: "Polygon" as const,
          coordinates: [
            [
              [-54.02, -25.30],
              [-54.01, -25.30],
              [-54.01, -25.29],
              [-54.02, -25.29],
              [-54.02, -25.30],
            ],
          ],
        },
      },
    ],
  };

  it("deve retornar indisponivel com causa 'dado-local-ausente' quando arquivo local não existe", () => {
    const res = carregarSitiosLocais();
    expect(res.estado).toBe("indisponivel");
    expect(res.causa).toBe("dado-local-ausente");
    expect(res.sitios).toEqual([]);
  });

  it("deve retornar indisponivel com causa 'integridade' quando .sha256 está ausente", () => {
    const jsonPath = path.join(tmpDir, "sitios_referencia_local.json");
    fs.writeFileSync(jsonPath, JSON.stringify(FIXTURE_SINTETICA), "utf8");

    const res = carregarSitiosLocais();
    expect(res.estado).toBe("indisponivel");
    expect(res.causa).toBe("integridade");
    expect(res.sitios).toEqual([]);
  });

  it("deve retornar indisponivel com causa 'integridade' quando .sha256 diverge do conteúdo", () => {
    const jsonPath = path.join(tmpDir, "sitios_referencia_local.json");
    fs.writeFileSync(jsonPath, JSON.stringify(FIXTURE_SINTETICA), "utf8");
    fs.writeFileSync(
      jsonPath + ".sha256",
      "0000000000000000000000000000000000000000000000000000000000000000  sitios_referencia_local.json\n",
      "utf8"
    );

    const res = carregarSitiosLocais();
    expect(res.estado).toBe("indisponivel");
    expect(res.causa).toBe("integridade");
    expect(res.sitios).toEqual([]);
  });

  it("deve carregar com sucesso quando fixture sintética e arquivo .sha256 são válidos", () => {
    const jsonPath = path.join(tmpDir, "sitios_referencia_local.json");
    const conteudo = JSON.stringify(FIXTURE_SINTETICA, null, 2);
    fs.writeFileSync(jsonPath, conteudo, "utf8");
    const sha = crypto.createHash("sha256").update(conteudo).digest("hex");
    fs.writeFileSync(jsonPath + ".sha256", `${sha}  sitios_referencia_local.json\n`, "utf8");

    const res = carregarSitiosLocais();
    expect(res.estado).toBe("disponivel");
    expect(res.sitios).toHaveLength(1);
    expect(res.sitios[0].id).toBe("sitio-ouro-01");
    expect(res.sitios[0].codigoCar).toBe("CAR-SINTETICO-01");
    expect(res.sitios[0].geometry.type).toBe("Polygon");
    expect(res.sitios[0].geometry.coordinates[0]).toHaveLength(5);
  });

  it("deve aceitar conferência de hash via SAREL_SITIOS_SHA256", () => {
    const jsonPath = path.join(tmpDir, "sitios_referencia_local.json");
    const conteudo = JSON.stringify(FIXTURE_SINTETICA, null, 2);
    fs.writeFileSync(jsonPath, conteudo, "utf8");
    const sha = crypto.createHash("sha256").update(conteudo).digest("hex");
    process.env.SAREL_SITIOS_SHA256 = sha;

    const res = carregarSitiosLocais();
    expect(res.estado).toBe("disponivel");
    expect(res.sitios).toHaveLength(1);
  });

  it("deve rejeitar com causa 'integridade' quando geometria do polígono tiver menos de 4 pontos", () => {
    const fixtureInvalida = {
      ...FIXTURE_SINTETICA,
      sitios: [
        {
          ...FIXTURE_SINTETICA.sitios[0],
          geometry: {
            type: "Polygon" as const,
            coordinates: [
              [
                [-54.02, -25.30],
                [-54.01, -25.30],
                [-54.02, -25.30],
              ],
            ],
          },
        },
      ],
    };

    const jsonPath = path.join(tmpDir, "sitios_referencia_local.json");
    const conteudo = JSON.stringify(fixtureInvalida);
    fs.writeFileSync(jsonPath, conteudo, "utf8");
    const sha = crypto.createHash("sha256").update(conteudo).digest("hex");
    fs.writeFileSync(jsonPath + ".sha256", `${sha}  sitios_referencia_local.json\n`, "utf8");

    const res = carregarSitiosLocais();
    expect(res.estado).toBe("indisponivel");
    expect(res.causa).toBe("integridade");
  });

  it("nunca deve lançar exceção em caso de JSON corrompido", () => {
    const jsonPath = path.join(tmpDir, "sitios_referencia_local.json");
    fs.writeFileSync(jsonPath, "{ json invalido e quebrado ...", "utf8");
    fs.writeFileSync(jsonPath + ".sha256", "abc  sitios_referencia_local.json\n", "utf8");

    expect(() => {
      const res = carregarSitiosLocais();
      expect(res.estado).toBe("indisponivel");
      expect(res.causa).toBe("integridade");
    }).not.toThrow();
  });

  it("módulo versionado SITIOS_PADRAO_OURO deve conter apenas identificadores opacos e nenhum código CAR de 43 caracteres", () => {
    expect(SITIOS_PADRAO_OURO).toHaveLength(4);
    const carRegex = /^[A-Z]{2}-[0-9]{7}-[0-9A-F]{32}$/;

    for (const sitio of SITIOS_PADRAO_OURO) {
      expect(sitio.identificadorOpaco).toMatch(/^CAR-OPACO-0[1-4]$/);
      expect((sitio as any).codigoCar).toBeUndefined();
      expect((sitio as any).geometry).toBeUndefined();
      expect((sitio as any).bbox).toBeUndefined();
      expect(carRegex.test(sitio.identificadorOpaco)).toBe(false);
    }
  });
});
