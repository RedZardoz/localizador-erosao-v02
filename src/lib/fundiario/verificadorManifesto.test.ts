import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { verificarManifestoFundiario } from "./verificadorManifesto";

describe("Verificador de Manifesto Fundiário (verificadorManifesto.ts)", () => {
  it("relata erro quando o caminho do manifesto é inexistente", () => {
    const res = verificarManifestoFundiario(
      "data/fundiario_brasil.db",
      "data/manifesto_fantasma.json"
    );
    expect(res.valido).toBe(false);
    expect(res.manifestoPresente).toBe(false);
    expect(res.statusHash).toBe("nao_verificado");
    expect(res.mensagem).toContain("Manifesto fundiário não encontrado");
  });

  it("reconhece o manifesto oficial data/MANIFESTO_FUNDIARIO.json sob Caso 2 (sha256Estado: indisponivel)", () => {
    const res = verificarManifestoFundiario(
      "data/banco_inexistente_temporario.db",
      "data/MANIFESTO_FUNDIARIO.json"
    );
    expect(res.manifestoPresente).toBe(true);
    expect(res.bancoPresente).toBe(false);
    expect(res.valido).toBe(false);
    expect(res.statusHash).toBe("indisponivel");
    expect(res.manifesto?.versaoEsquema).toBe("2.0.0");
    expect(res.manifesto?.banco.totalPropriedades).toBe(559899);
    expect(res.manifesto?.banco.sha256).toBeNull();
    expect(res.manifesto?.banco.sha256Estado).toBe("indisponivel");
  });

  it("valida integridade física perfeitamente quando banco e manifesto coincidem (Caso 1: conferido)", () => {
    const tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "sarel-manifesto-test-")
    );
    const tmpDb = path.join(tmpDir, "teste.db");
    const tmpManifesto = path.join(tmpDir, "MANIFESTO.json");

    const content = Buffer.from("DADOS_FUNDIARIOS_TESTE_INTEGRIDADE_SAREL_2026");
    fs.writeFileSync(tmpDb, content);
    const hash = crypto.createHash("sha256").update(content).digest("hex");

    const manifestoData = {
      versaoEsquema: "2.0.0",
      descricao: "Teste",
      banco: {
        arquivo: "teste.db",
        caminhoRelativo: "teste.db",
        tamanhoBytes: content.length,
        sha256: hash,
        sha256Estado: "conferido",
        totalPropriedades: 10,
      },
      geradoEm: new Date().toISOString(),
    };
    fs.writeFileSync(tmpManifesto, JSON.stringify(manifestoData));

    const res = verificarManifestoFundiario(tmpDb, tmpManifesto);
    expect(res.valido).toBe(true);
    expect(res.bancoPresente).toBe(true);
    expect(res.statusHash).toBe("conferido");
    expect(res.divergencias).toBeUndefined();

    // Limpeza
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("detecta divergência física se o hash SHA-256 diferir do manifesto (Caso 3: divergente)", () => {
    const tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "sarel-manifesto-test-")
    );
    const tmpDb = path.join(tmpDir, "teste.db");
    const tmpManifesto = path.join(tmpDir, "MANIFESTO.json");

    const content = Buffer.from("CONTEUDO_ORIGINAL");
    fs.writeFileSync(tmpDb, content);

    // Hash legítimo de outro arquivo (para passar na sanidade, mas divergir do banco)
    const outroHash = crypto
      .createHash("sha256")
      .update(Buffer.from("OUTRO_CONTEUDO_TOTALMENTE_DIFERENTE"))
      .digest("hex");

    const manifestoData = {
      versaoEsquema: "2.0.0",
      descricao: "Teste",
      banco: {
        arquivo: "teste.db",
        caminhoRelativo: "teste.db",
        tamanhoBytes: content.length,
        sha256: outroHash,
        sha256Estado: "conferido",
        totalPropriedades: 10,
      },
      geradoEm: new Date().toISOString(),
    };
    fs.writeFileSync(tmpManifesto, JSON.stringify(manifestoData));

    const res = verificarManifestoFundiario(tmpDb, tmpManifesto);
    expect(res.valido).toBe(false);
    expect(res.bancoPresente).toBe(true);
    expect(res.statusHash).toBe("divergente");
    expect(res.divergencias).toBeDefined();
    expect(res.divergencias?.[0]).toContain("SHA-256 divergente");

    // Limpeza
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("reprova o manifesto na trava de sanidade se o hash for fabricado (placeholder)", () => {
    const tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "sarel-manifesto-test-")
    );
    const tmpDb = path.join(tmpDir, "teste.db");
    const tmpManifesto = path.join(tmpDir, "MANIFESTO.json");

    fs.writeFileSync(tmpDb, Buffer.from("qualquer_coisa"));

    const manifestoData = {
      versaoEsquema: "2.0.0",
      descricao: "Teste",
      banco: {
        arquivo: "teste.db",
        caminhoRelativo: "teste.db",
        tamanhoBytes: 1234,
        sha256:
          "4b9e4a3b1d2e8f9a0c3d5e7f1b2a4c6e8d0f2a4b6c8e0d2f4a6b8c0e2d4f6a8b",
        sha256Estado: "conferido",
        totalPropriedades: 10,
      },
      geradoEm: new Date().toISOString(),
    };
    fs.writeFileSync(tmpManifesto, JSON.stringify(manifestoData));

    const res = verificarManifestoFundiario(tmpDb, tmpManifesto);
    expect(res.valido).toBe(false);
    expect(res.statusHash).toBe("divergente");
    expect(res.mensagem).toContain("rejeitado pela trava de sanidade");

    // Limpeza
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
