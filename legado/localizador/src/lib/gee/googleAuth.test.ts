import { generateKeyPairSync, verify } from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getGoogleAccessToken, EARTH_ENGINE_SCOPES } from "./googleAuth";

// Gera um par de chaves de teste (não é uma credencial real do Google) só
// para provar que a assinatura RS256 do JWT é criptograficamente válida —
// ver RELATORIO_IMPLEMENTACAO.md para a verificação end-to-end feita contra
// o servidor OAuth2 real do Google com uma chave sintética equivalente.
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

describe("getGoogleAccessToken", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("assina um JWT RS256 verificável com a chave pública correspondente e o envia ao endpoint de token", async () => {
    let capturedBody = "";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (_url: string, init: any) => {
        capturedBody = init.body;
        return { ok: true, json: async () => ({ access_token: "fake-token", expires_in: 3600 }) };
      })
    );

    const token = await getGoogleAccessToken(
      { client_email: "test@example.iam.gserviceaccount.com", private_key: privateKey },
      EARTH_ENGINE_SCOPES
    );

    expect(token.accessToken).toBe("fake-token");

    const assertion = new URLSearchParams(capturedBody).get("assertion")!;
    const [headerB64, payloadB64, sigB64] = assertion.split(".");
    const signingInput = `${headerB64}.${payloadB64}`;
    const signature = Buffer.from(sigB64.replace(/-/g, "+").replace(/_/g, "/"), "base64");

    const isValid = verify("RSA-SHA256", Buffer.from(signingInput), publicKey, signature);
    expect(isValid).toBe(true);

    const payload = JSON.parse(Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    expect(payload.iss).toBe("test@example.iam.gserviceaccount.com");
    expect(payload.scope).toContain("earthengine");
  });

  it("propaga a mensagem de erro real do Google quando a troca de token falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "invalid_grant", error_description: "Invalid grant: account not found" }),
      })
    );

    await expect(
      getGoogleAccessToken({ client_email: "x@y.iam.gserviceaccount.com", private_key: privateKey }, EARTH_ENGINE_SCOPES)
    ).rejects.toThrow(/account not found/);
  });

  it("normaliza chaves privadas com '\\n' literais (formato comum de .env)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ access_token: "ok", expires_in: 3600 }) }));

    const withLiteralNewlines = privateKey.replace(/\n/g, "\\n");
    const token = await getGoogleAccessToken(
      { client_email: "test@example.iam.gserviceaccount.com", private_key: withLiteralNewlines },
      EARTH_ENGINE_SCOPES
    );
    expect(token.accessToken).toBe("ok");
  });
});
