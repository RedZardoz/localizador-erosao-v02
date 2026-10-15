import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1", "0.0.0.0"]);

/**
 * Defesa em profundidade para rotas que servem dados pessoais da base fundiaria
 * (CAR/SICAR, SIGEF, SNCR). Complementa - nao substitui - o bind em loopback
 * configurado nos scripts do package.json.
 *
 * NOTA DE SEGURANÇA: Se algum dia o sistema for exposto deliberadamente
 * (servidor de laboratório, VPS), a guarda de host NÃO é autenticação e
 * precisará ser substituída por controle de acesso real com registro de
 * quem consultou o quê (trilha de auditoria).
 */
export function isLocalRequest(req: NextRequest): boolean {
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const clientIp = xForwardedFor.split(",")[0].trim();
    if (!ALLOWED_HOSTS.has(clientIp)) {
      return false;
    }
  }

  const host = req.headers.get("host") ?? "";
  const hostname = host.replace(/:\d+$/, "").toLowerCase();
  return ALLOWED_HOSTS.has(hostname);
}

/**
 * Mitigação de CSRF / SSRF e escrita não confiável (N16 / M5):
 * Exige:
 * 1. isLocalRequest(req)
 * 2. Origin ausente OU Origin com hostname local permitido
 * 3. Para métodos de escrita (POST, PUT, PATCH, DELETE), Content-Type deve conter application/json
 */
export function ehRequisicaoLocalConfiavel(req: NextRequest): boolean {
  if (!isLocalRequest(req)) {
    return false;
  }

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      const url = new URL(origin);
      if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
        return false;
      }
    } catch {
      return false;
    }
  }

  const metodo = req.method.toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(metodo)) {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return false;
    }
  }

  return true;
}

export function exigirRequisicaoLocalConfiavel(req: NextRequest): NextResponse | null {
  if (!ehRequisicaoLocalConfiavel(req)) {
    return NextResponse.json(
      { erro: "Acesso restrito: requisição deve ser originada localmente com formato confiável." },
      { status: 403 }
    );
  }
  return null;
}
