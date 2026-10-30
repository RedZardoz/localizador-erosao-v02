import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { verificarManifestoFundiario } from "./verificadorManifesto";

describe("Verificador de Manifesto Fundiário (verificadorManifesto.ts)", () => {
  it("relata erro quando o caminho do manifesto é inexistente", () => {
    const res = verificarManifestoFundiario("data/fundiario_brasil.db", "data/manifesto_fantasma.json");
    expect(res.valido).toBe(false);
    expect(res.manifestoPresente).toBe(false);
    expect(res.mensagem).toContain("Manifesto fundiário não encontrado");
  });

  it("reconhece o manifesto oficial data/MANIFESTO_FUNDIARIO.json mesmo quando o banco não está provisionado", () => {
    const res = verificarManifestoFundiario("data/banco_inexistente_temporario.db", "data/MANIFESTO_FUNDIARIO.json");
    expect(res.manifestoPresente).toBe(true);
    expect(res.bancoPresente).toBe(false);
    expect(res.valido).toBe(false);
    expect(res.manifesto?.versaoEsquema).toBe("2.0.0");
    expect(res.manifesto?.banco.totalPropriedades).toBe(559899);
  });

  it("valida integridade física perfeitamente quando banco e manifesto coincidem", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sarel-manifesto-test-"));
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
        totalPropriedades: 10,
      },
      geradoEm: new Date().toISOString(),
    };
    fs.writeFileSync(tmpManifesto, JSON.stringify(manifestoData));

    const res = verificarManifestoFundiario(tmpDb, tmpManifesto);
    expect(res.valido).toBe(true);
    expect(res.bancoPresente).toBe(true);
    expect(res.divergencias).toBeUndefined();

    // Limpeza
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("detecta divergência e corrupção se o hash SHA-256 diferir do manifesto", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sarel-manifesto-test-"));
    const tmpDb = path.join(tmpDir, "teste.db");
    const tmpManifesto = path.join(tmpDir, "MANIFESTO.json");

    const content = Buffer.from("CONTEUDO_ORIGINAL");
    fs.writeFileSync(tmpDb, content);

    const manifestoData = {
      versaoEsquema: "2.0.0",
      descricao: "Teste",
      banco: {
        arquivo: "teste.db",
        caminhoRelativo: "teste.db",
        tamanhoBytes: content.length,
        sha256: "0000000000000000000000000000000000000000000000000000000000000000",
        totalPropriedades: 10,
      },
      geradoEm: new Date().toISOString(),
    };
    fs.writeFileSync(tmpManifesto, JSON.stringify(manifestoData));

    const res = verificarManifestoFundiario(tmpDb, tmpManifesto);
    expect(res.valido).toBe(false);
    expect(res.bancoPresente).toBe(true);
    expect(res.divergencias).toBeDefined();
    expect(res.divergencias?.[0]).toContain("SHA-256 divergente");

    // Limpeza
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
