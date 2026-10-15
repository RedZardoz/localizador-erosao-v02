import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { GET } from "./route";

// Dado SINTETICO_TESTE_ENCANAMENTO: nenhum código CAR real aqui.
function requisicao(host: string, extra: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/sitios-referencia", { headers: { host, ...extra } });
}

describe("GET /api/sitios-referencia: restrita a chamadas locais", () => {
  const original = process.env.SAREL_DATA_DIR;
  afterEach(() => {
    if (original === undefined) delete process.env.SAREL_DATA_DIR;
    else process.env.SAREL_DATA_DIR = original;
  });

  it("host não local → 403, sem sítios", async () => {
    const res = await GET(requisicao("exemplo.com"));
    expect(res.status).toBe(403);
    const corpo = await res.json();
    expect(corpo.sitios).toEqual([]);
  });

  it("x-forwarded-for não local → 403", async () => {
    const res = await GET(requisicao("localhost:3000", { "x-forwarded-for": "203.0.113.9" }));
    expect(res.status).toBe(403);
  });

  it("local, sem arquivo → 200 indisponivel (dado-local-ausente)", async () => {
    process.env.SAREL_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "sarel-sitios-"));
    const res = await GET(requisicao("localhost:3000"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ estado: "indisponivel", causa: "dado-local-ausente" });
  });

  it("local, com fixture sintética íntegra → 200 disponivel", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sarel-sitios-"));
    const conteudo = JSON.stringify({
      sitios: [{ id: "sitio-ouro-01", codigoCar: "CAR-SINTETICO-01",
        geometry: { type: "Polygon", coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] } }],
    });
    const arquivo = path.join(dir, "sitios_referencia_local.json");
    fs.writeFileSync(arquivo, conteudo);
    fs.writeFileSync(arquivo + ".sha256", crypto.createHash("sha256").update(conteudo).digest("hex") + "\n");
    process.env.SAREL_DATA_DIR = dir;
    const res = await GET(requisicao("127.0.0.1:3000"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ estado: "disponivel" });
  });
});
