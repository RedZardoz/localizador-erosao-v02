export interface CredenciaisServiceAccount {
  type?: string;
  project_id: string;
  private_key_id?: string;
  private_key: string;
  client_email: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
  universe_domain?: string;
}

export interface SessaoTokens {
  gee?: CredenciaisServiceAccount;
  planetApiKey?: string;
  mapLibreToken?: string;
}

interface SessionEntry {
  tokens: SessaoTokens;
  expiresAt: number;
}

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h
export const SAREL_SESSION_COOKIE = "sarel_session_id";

const globalForSessions = global as unknown as { __sarelSessionStore?: Map<string, SessionEntry> };

const store: Map<string, SessionEntry> = globalForSessions.__sarelSessionStore ?? new Map();
globalForSessions.__sarelSessionStore = store;

export function criarSessao(tokens: SessaoTokens = {}): string {
  const sessionId = crypto.randomUUID();
  store.set(sessionId, { tokens, expiresAt: Date.now() + SESSION_TTL_MS });
  return sessionId;
}

export function obterSessao(sessionId: string | undefined | null): SessaoTokens | null {
  if (!sessionId) return null;
  const entry = store.get(sessionId);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(sessionId);
    return null;
  }
  return entry.tokens;
}

export function atualizarSessao(sessionId: string | undefined | null, tokens: Partial<SessaoTokens>): boolean {
  if (!sessionId) return false;
  const atual = obterSessao(sessionId);
  if (!atual) return false;
  store.set(sessionId, {
    tokens: { ...atual, ...tokens },
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return true;
}

export function destruirSessao(sessionId: string | undefined | null): void {
  if (sessionId) store.delete(sessionId);
}
