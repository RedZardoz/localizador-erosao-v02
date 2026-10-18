import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

describe("GET /api/fundiario/status (N15)", () => {
  it("deve retornar 403 para requisições com host não-local", async () => {
    const req = new NextRequest("http://evil.com/api/fundiario/status", {
      headers: {
        host: "evil.com",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.erro).toMatch(/restrito/i);
  });

  it("deve responder status { existe, tabelas } para requisição local", async () => {
    const req = new NextRequest("http://localhost:3000/api/fundiario/status", {
      headers: {
        host: "localhost:3000",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.existe).toBe("boolean");
    expect(typeof json.tabelas).toBe("number");
    if (json.existe) {
      expect(json.tabelas).toBeGreaterThanOrEqual(1);
    } else {
      expect(json.tabelas).toBe(0);
    }
  });
});
