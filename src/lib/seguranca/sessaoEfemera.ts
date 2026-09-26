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
  jevApiKey?: string;
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
  if (sessionId) {
    const entry = store.get(sessionId);
    if (entry) {
      if (entry.expiresAt < Date.now()) {
        store.delete(sessionId);
      } else {
        return entry.tokens;
      }
    }
  }
  // Fallback para a sessão ativa mais recente em memória local (single-user desktop/localhost)
  for (const [k, entry] of store.entries()) {
    if (entry.expiresAt < Date.now()) {
      store.delete(k);
    } else if (entry.tokens?.gee) {
      return entry.tokens;
    }
  }
  return null;
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
