import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

describe("API /api/rotulos/importar (App Router)", () => {
  it("recusa requisição sem tipo ou dados válidos (HTTP 400)", async () => {
    const req = new NextRequest("http://localhost:3000/api/rotulos/importar", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { host: "localhost:3000" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.sucesso).toBe(false);
    expect(json.erro).toContain("Requisição inválida");
  });

  it("processa importação de formulários KoboToolbox com sucesso", async () => {
    const payload = {
      tipo: "kobo",
      dados: [
        {
          codigoPonto: "PR-2026-0001",
          classe: "moderada",
          observador: "Técnico Silva",
          observadoEm: "2026-05-15",
          cego: true,
        },
      ],
    };

    const req = new NextRequest("http://localhost:3000/api/rotulos/importar", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { host: "localhost:3000" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.tipo).toBe("kobo");
    expect(json.resultado.aceitos.length).toBe(1);
  });

  it("processa importação de interpretação visual com cálculo de concordância", async () => {
    const payload = {
      tipo: "interpretacao",
      dados: [
        {
          codigoPonto: "PR-2026-0001",
          classe: "severa",
          observador: "Intérprete 1",
          observadoEm: "2026-05-10",
          cego: true,
        },
        {
          codigoPonto: "PR-2026-0001",
          classe: "severa",
          observador: "Intérprete 2",
          observadoEm: "2026-05-10",
          cego: true,
        },
      ],
    };

    const req = new NextRequest("http://localhost:3000/api/rotulos/importar", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { host: "localhost:3000" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.tipo).toBe("interpretacao");
    expect(json.resultado.pontosProcessados).toBe(1);
    expect(json.resultado.concordancia.kappa).toBe(1.0);
  });

  it("processa importação de drone e mantém papelConjunto held-out", async () => {
    const payload = {
      tipo: "drone",
      dados: [
        {
          codigoPonto: "PR-2026-0001",
          classe: "moderada",
          observador: "Piloto Operador",
          observadoEm: "2026-05-20",
          papelConjunto: "held-out",
        },
      ],
    };

    const req = new NextRequest("http://localhost:3000/api/rotulos/importar", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { host: "localhost:3000" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.tipo).toBe("drone");
    expect(json.resultado.aceitos[0].papelConjunto).toBe("held-out");
  });

  it("recusa requisição externa não-local por segurança (HTTP 403)", async () => {
    const payload = { tipo: "kobo", dados: [] };
    const req = new NextRequest("http://api.sarel.externo.com/api/rotulos/importar", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        host: "api.sarel.externo.com",
        "x-forwarded-for": "203.0.113.195",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.sucesso).toBe(false);
    expect(json.erro).toContain("Acesso negado");
  });
});
