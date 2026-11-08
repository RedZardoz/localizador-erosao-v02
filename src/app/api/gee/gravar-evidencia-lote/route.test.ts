import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

describe("POST /api/gee/gravar-evidencia-lote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recusa requisição não local com 403", async () => {
    const req = new NextRequest("http://evil.com/api/gee/gravar-evidencia-lote", {
      method: "POST",
      headers: {
        host: "evil.com",
        "content-type": "application/json",
      },
      body: JSON.stringify({ pontos: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("retorna 400 se nenhuma coordenada for fornecida", async () => {
    const req = new NextRequest("http://localhost:3000/api/gee/gravar-evidencia-lote", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({ pontos: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/Nenhuma coordenada fornecida/);
  });

  it("retorna 400 se coordenadas contiverem valores inválidos ou não finitos", async () => {
    const req = new NextRequest("http://localhost:3000/api/gee/gravar-evidencia-lote", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        pontos: [{ latitude: "invalido", longitude: -54.05 }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/Coordenadas inválidas/);
  });

  it("retorna 401 se sessão efêmera do GEE não estiver ativa no cookie", async () => {
    const req = new NextRequest("http://localhost:3000/api/gee/gravar-evidencia-lote", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        pontos: [{ latitude: -24.85, longitude: -54.05 }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/Sessão Google Earth Engine não configurada/);
  });
});
