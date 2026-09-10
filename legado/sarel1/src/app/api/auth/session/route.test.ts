import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, DELETE } from "./route";

describe("API /api/auth/session (Autenticação e Teste de APIs)", () => {
  it("retorna sessaoAtiva: false quando não há credenciais ativas em memória", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "GET",
      headers: { host: "localhost:3000" },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sessaoAtiva).toBe(false);
  });

  it("recusa requisição externa não-local com HTTP 403", async () => {
    const req = new NextRequest("http://192.168.1.100:3000/api/auth/session", {
      method: "GET",
      headers: { host: "192.168.1.100:3000", "x-forwarded-for": "200.150.10.5" },
    });

    const res = await GET(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.erro).toContain("Acesso negado");
  });

  it("testa token Mapbox e valida formato com sucesso", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "POST",
      body: JSON.stringify({
        tipo: "testar_token",
        servico: "mapbox",
        token: "pk.eyJ1IjoiZXhhbXBsZXVzZXIiLCJhIjoiY2x5eHhhIn0.example",
      }),
      headers: { host: "localhost:3000" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.servico).toBe("mapbox");
  });

  it("testa token Embrapa AgroAPI e valida formato", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "POST",
      body: JSON.stringify({
        tipo: "testar_token",
        servico: "embrapa",
        token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token",
      }),
      headers: { host: "localhost:3000" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.mensagem).toContain("Embrapa AgroAPI");
  });

  it("encerra sessão com sucesso via DELETE", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "DELETE",
      headers: { host: "localhost:3000" },
    });

    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.sessaoAtiva).toBe(false);
  });
});
