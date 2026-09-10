import { describe, expect, it, vi } from "vitest";
import { createGeeSession, destroyGeeSession, getGeeSession, getGeeSessionMeta } from "./sessionStore";
import { GcpCredentials } from "@/types/erosion";

const creds: GcpCredentials = {
  type: "service_account",
  project_id: "projeto-teste",
  client_email: "a@b.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----",
};

describe("sessionStore", () => {
  it("cria uma sessão e recupera a credencial completa pelo ID", () => {
    const id = createGeeSession(creds);
    const recovered = getGeeSession(id);
    expect(recovered).toEqual(creds);
  });

  it("retorna null para um ID de sessão inexistente", () => {
    expect(getGeeSession("id-que-nao-existe")).toBeNull();
  });

  it("getGeeSessionMeta nunca expõe a private_key", () => {
    const id = createGeeSession(creds);
    const meta = getGeeSessionMeta(id);
    expect(meta).toEqual({ projectId: "projeto-teste", clientEmail: "a@b.iam.gserviceaccount.com" });
    expect(JSON.stringify(meta)).not.toContain("BEGIN PRIVATE KEY");
  });

  it("destroyGeeSession invalida a sessão imediatamente", () => {
    const id = createGeeSession(creds);
    destroyGeeSession(id);
    expect(getGeeSession(id)).toBeNull();
  });

  it("expira a sessão automaticamente após o TTL", () => {
    vi.useFakeTimers();
    const id = createGeeSession(creds);
    expect(getGeeSession(id)).not.toBeNull();

    vi.advanceTimersByTime(13 * 60 * 60 * 1000); // 13h > TTL de 12h
    expect(getGeeSession(id)).toBeNull();
    vi.useRealTimers();
  });
});
