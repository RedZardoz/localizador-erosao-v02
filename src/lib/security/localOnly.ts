import { NextRequest } from "next/server";

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

