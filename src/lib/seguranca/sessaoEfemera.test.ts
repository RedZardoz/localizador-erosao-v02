import { describe, it, expect, beforeEach } from "vitest";
import { criarSessao, obterSessao, atualizarSessao, destruirSessao, SAREL_SESSION_COOKIE } from "./sessaoEfemera";

describe("sessaoEfemera", () => {
  const fakeCreds = {
    project_id: "test-proj",
    client_email: "test@example.com",
    private_key: "-----BEGIN RSA PRIVATE KEY-----\nMIIEogIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----",
  };

  it("deve criar e recuperar tokens de sessão", () => {
    const id = criarSessao({ gee: fakeCreds });
    expect(id).toBeDefined();

    const sessao = obterSessao(id);
    expect(sessao?.gee?.project_id).toBe("test-proj");
    expect(sessao?.gee?.client_email).toBe("test@example.com");
  });

  it("deve permitir atualizar tokens na sessão ativa", () => {
    const id = criarSessao({ gee: fakeCreds });
    const atualizou = atualizarSessao(id, { planetApiKey: "planet-12345" });
    expect(atualizou).toBe(true);

    const sessao = obterSessao(id);
    expect(sessao?.planetApiKey).toBe("planet-12345");
    expect(sessao?.gee?.project_id).toBe("test-proj");
  });

  it("deve destruir a sessão", () => {
    const id = criarSessao({ planetApiKey: "key-xyz" });
    destruirSessao(id);
    expect(obterSessao(id)).toBeNull();
  });

  it("deve retornar null para IDs indefinidos ou inexistentes", () => {
    expect(obterSessao(undefined)).toBeNull();
    expect(obterSessao(null)).toBeNull();
    expect(obterSessao("id-inexistente")).toBeNull();
  });
});
