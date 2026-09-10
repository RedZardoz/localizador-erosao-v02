import crypto from "crypto";
import { GcpCredentials } from "@/types/erosion";

/**
 * Armazenamento de sessão da Service Account no SERVIDOR — a private_key
 * trafega do navegador para o servidor uma única vez (na criação da sessão) e
 * nunca mais. As chamadas seguintes (`/api/gee/analyze-point`, etc.) só
 * enviam o cookie de sessão; o servidor resolve a credencial internamente.
 *
 * LIMITAÇÃO CONHECIDA (documentada, não escondida): isto é um Map em memória
 * do processo Node. Funciona corretamente para o uso atual (dev local / um
 * único servidor). Não sobrevive a reinício do processo nem funciona em um
 * deployment com múltiplas instâncias sem sticky sessions — ver
 * PROMPT_IMPLEMENTACAO_SENIOR.md, item "Sessão de credenciais", para a
 * evolução com um store compartilhado (Redis) quando isso importar.
 *
 * O Map é pendurado em `globalThis` para sobreviver ao Hot Module Reload do
 * `next dev` (que, do contrário, recriaria o módulo — e o Map — a cada
 * alteração de arquivo, invalidando sessões ativas durante o desenvolvimento).
 */

interface SessionEntry {
  credentials: GcpCredentials;
  expiresAt: number;
}

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h
export const GEE_SESSION_COOKIE = "gee_session_id";

const globalForSessions = global as unknown as { __geeSessionStore?: Map<string, SessionEntry> };

const store: Map<string, SessionEntry> = globalForSessions.__geeSessionStore ?? new Map();
globalForSessions.__geeSessionStore = store;

export function createGeeSession(credentials: GcpCredentials): string {
  const sessionId = crypto.randomBytes(32).toString("hex");
  store.set(sessionId, { credentials, expiresAt: Date.now() + SESSION_TTL_MS });
  return sessionId;
}

export function getGeeSession(sessionId: string | undefined | null): GcpCredentials | null {
  if (!sessionId) return null;
  const entry = store.get(sessionId);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(sessionId);
    return null;
  }
  return entry.credentials;
}

export function getGeeSessionMeta(sessionId: string | undefined | null): { projectId: string; clientEmail: string } | null {
  const creds = getGeeSession(sessionId);
  if (!creds) return null;
  return { projectId: creds.project_id, clientEmail: creds.client_email };
}

export function destroyGeeSession(sessionId: string | undefined | null): void {
  if (sessionId) store.delete(sessionId);
}
