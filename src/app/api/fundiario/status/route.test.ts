import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import fs from "fs";
import { execFile } from "child_process";
import { GET } from "./route";

vi.mock("child_process", () => ({
  execFile: vi.fn(),
}));

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  const existsSyncMock = vi.fn();
  const statSyncMock = vi.fn();
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: existsSyncMock,
      statSync: statSyncMock,
    },
    existsSync: existsSyncMock,
    statSync: statSyncMock,
  };
});

describe("GET /api/fundiario/status (N15-fix)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar 403 para requisições com host não-local", async () => {
    const req = new NextRequest("http://evil.com/api/fundiario/status", {
      headers: { host: "evil.com" },
    });

    const res = await GET(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.erro).toMatch(/restrito/i);
  });

  it("deve retornar existe:false, tabelas:null quando banco estiver ausente", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const req = new NextRequest("http://localhost:3000/api/fundiario/status", {
      headers: { host: "localhost:3000" },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ existe: false, tabelas: null });
  });

  it("deve retornar existe:true, tabelas:null e erro quando execFile falhar", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ isFile: () => true } as any);
    vi.mocked(execFile).mockImplementation((_cmd: any, _args: any, _opts: any, callback?: any) => {
      const cb = typeof _opts === "function" ? _opts : callback;
      cb(new Error("Python indisponível"), "", "");
      return {} as any;
    });

    const req = new NextRequest("http://localhost:3000/api/fundiario/status", {
      headers: { host: "localhost:3000" },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.existe).toBe(true);
    expect(json.tabelas).toBeNull();
    expect(json.erro).toBeDefined();
    expect(json.tabelas).not.toBe(0);
  });

  it("deve retornar existe:true, tabelas:null e erro quando stdout for JSON inválido", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ isFile: () => true } as any);
    vi.mocked(execFile).mockImplementation((_cmd: any, _args: any, _opts: any, callback?: any) => {
      const cb = typeof _opts === "function" ? _opts : callback;
      cb(null, "saida nao json corrompida", "");
      return {} as any;
    });

    const req = new NextRequest("http://localhost:3000/api/fundiario/status", {
      headers: { host: "localhost:3000" },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.existe).toBe(true);
    expect(json.tabelas).toBeNull();
    expect(json.erro).toBeDefined();
    expect(json.tabelas).not.toBe(0);
  });

  it("deve retornar tabelas:3 quando contagem for válida", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ isFile: () => true } as any);
    vi.mocked(execFile).mockImplementation((_cmd: any, _args: any, _opts: any, callback?: any) => {
      const cb = typeof _opts === "function" ? _opts : callback;
      cb(null, JSON.stringify({ existe: true, tabelas: 3 }), "");
      return {} as any;
    });

    const req = new NextRequest("http://localhost:3000/api/fundiario/status", {
      headers: { host: "localhost:3000" },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ existe: true, tabelas: 3 });
  });
});
