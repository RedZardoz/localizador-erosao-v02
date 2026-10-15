import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { isLocalRequest, exigirRequisicaoLocalConfiavel } from "./localOnly";

describe("isLocalRequest security guard", () => {
  it("deve autorizar requisições com host localhost", () => {
    const req = new NextRequest("http://localhost:3000/api/fundiario/match", {
      headers: { host: "localhost:3000" },
    });
    expect(isLocalRequest(req)).toBe(true);
  });

  it("deve autorizar requisições com host 127.0.0.1", () => {
    const req = new NextRequest("http://127.0.0.1:3000/api/fundiario/match", {
      headers: { host: "127.0.0.1:3000" },
    });
    expect(isLocalRequest(req)).toBe(true);
  });

  it("deve autorizar requisições com IPv6 loopback ::1", () => {
    const req = new NextRequest("http://[::1]:3000/api/fundiario/match", {
      headers: { host: "[::1]:3000" },
    });
    expect(isLocalRequest(req)).toBe(true);
  });

  it("deve bloquear requisições com Host de atacante externo", () => {
    const req = new NextRequest("http://localhost:3000/api/fundiario/match", {
      headers: { host: "atacante.com" },
    });
    expect(isLocalRequest(req)).toBe(false);
  });

  it("deve bloquear requisições com IP de rede externa", () => {
    const req = new NextRequest("http://localhost:3000/api/fundiario/match", {
      headers: { host: "192.168.1.100:3000" },
    });
    expect(isLocalRequest(req)).toBe(false);
  });

  it("deve bloquear requisições com cabeçalho X-Forwarded-For externo (10.0.0.1)", () => {
    const req = new NextRequest("http://localhost:3000/api/fundiario/match", {
      headers: {
        host: "localhost:3000",
        "x-forwarded-for": "10.0.0.1",
      },
    });
    expect(isLocalRequest(req)).toBe(false);
  });
});

describe("exigirRequisicaoLocalConfiavel security guard (N16)", () => {
  it("deve bloquear Origin externo (https://exemplo.com) com 403", () => {
    const req = new NextRequest("http://localhost:3000/api/gee/sorteio-d16", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "https://exemplo.com",
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const res = exigirRequisicaoLocalConfiavel(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(403);
  });

  it("deve bloquear Content-Type nao-json em metodos de escrita com 403", () => {
    const req = new NextRequest("http://localhost:3000/api/gee/sorteio-d16", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "content-type": "text/plain",
      },
      body: "{}",
    });
    const res = exigirRequisicaoLocalConfiavel(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(403);
  });

  it("deve autorizar Origin local com Content-Type application/json", () => {
    const req = new NextRequest("http://localhost:3000/api/gee/sorteio-d16", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const res = exigirRequisicaoLocalConfiavel(req);
    expect(res).toBeNull();
  });
});
