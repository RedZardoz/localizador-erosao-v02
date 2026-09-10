import crypto from "crypto";
import { GcpCredentials } from "@/types/erosion";

/**
 * Autenticação OAuth2 "Service Account" (RFC 7523 JWT Bearer) implementada com
 * o módulo nativo `crypto` do Node — sem dependências externas — para trocar a
 * chave privada da Service Account por um access_token real do Google.
 *
 * Isto é usado tanto para o teste de credenciais (/api/auth/gee-test, que hoje
 * apenas validava o FORMATO do JSON) quanto para autorizar chamadas à API REST
 * do Earth Engine. Uma falha aqui é sempre um erro real vindo do Google
 * (chave inválida, projeto sem Earth Engine habilitado, relógio do servidor
 * dessincronizado, etc.), nunca uma simulação.
 */

const GOOGLE_TOKEN_URI = "https://oauth2.googleapis.com/token";

export interface GoogleAccessToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function signJwtRS256(payload: Record<string, unknown>, header: Record<string, unknown>, privateKeyPem: string): string {
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();

  let signature: Buffer;
  try {
    signature = signer.sign(privateKeyPem);
  } catch (err: any) {
    throw new Error(
      `Não foi possível assinar o JWT com a chave privada fornecida. A chave está corrompida, truncada ou não é uma RSA PEM válida. Detalhe: ${err.message}`
    );
  }

  return `${signingInput}.${base64url(signature)}`;
}

/**
 * Troca a Service Account (client_email + private_key) por um access_token
 * OAuth2 válido, seguindo o fluxo "JWT Bearer" descrito em
 * https://developers.google.com/identity/protocols/oauth2/service-account
 */
export async function getGoogleAccessToken(
  credentials: Pick<GcpCredentials, "client_email" | "private_key" | "token_uri">,
  scopes: string[]
): Promise<GoogleAccessToken> {
  const nowSec = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: credentials.client_email,
    scope: scopes.join(" "),
    aud: credentials.token_uri || GOOGLE_TOKEN_URI,
    iat: nowSec,
    exp: nowSec + 3600,
  };

  // A chave privada do JSON baixado do GCP costuma vir com "\n" literais quando
  // colada/serializada; normaliza para quebras de linha reais antes de assinar.
  const normalizedKey = credentials.private_key.includes("\\n")
    ? credentials.private_key.replace(/\\n/g, "\n")
    : credentials.private_key;

  const assertion = signJwtRS256(payload, header, normalizedKey);

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const res = await fetch(credentials.token_uri || GOOGLE_TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.access_token) {
    const googleError = data?.error_description || data?.error || `HTTP ${res.status}`;
    throw new Error(`Google recusou a autenticação da Service Account: ${googleError}`);
  }

  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}

export const EARTH_ENGINE_SCOPES = [
  "https://www.googleapis.com/auth/earthengine",
  "https://www.googleapis.com/auth/devstorage.read_only",
  "https://www.googleapis.com/auth/cloud-platform",
];
