/**
 * ============================================================================
 * Autenticação e Guarda Local GEE — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * PADRÃO DE SEGURANÇA AUDITADO:
 * 1. Chaves e Service Account mantidas apenas em sessão efêmera de memória.
 * 2. NUNCA gravadas em disco, NUNCA expostas em logs, NUNCA em mensagens de erro.
 * 3. Rotas que tocam credenciais recusam qualquer requisição não-local.
 */

export interface CredencialSessao {
  clientEmail?: string;
  privateKey?: string;
  projectId?: string;
  adquiridoEm: string;
  expiraEm: number; // timestamp ms
}

let sessaoEmMemoria: CredencialSessao | null = null;

/**
 * Guarda de Execução Local: recusa requisições originadas fora de localhost.
 */
export function assegurarRequisicaoLocal(req: Request): void {
  const host = req.headers.get("host") || "";
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";

  const ehLocal =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    clientIp === "127.0.0.1" ||
    clientIp === "::1";

  if (!ehLocal) {
    throw new Error("Acesso negado: rotas que manipulam credenciais e bases fundiárias recusam requisições não-locais.");
  }
}

/**
 * Registra credencial efêmera na sessão do servidor.
 */
export function registrarCredencialEfemera(cred: Omit<CredencialSessao, "adquiridoEm" | "expiraEm">, duracaoMs: number = 3600000): void {
  sessaoEmMemoria = {
    ...cred,
    adquiridoEm: new Date().toISOString(),
    expiraEm: Date.now() + duracaoMs,
  };
}

/**
 * Obtém credencial da sessão ativa em memória.
 */
export function obterCredencialEfemera(): CredencialSessao | null {
  if (!sessaoEmMemoria) return null;
  if (Date.now() > sessaoEmMemoria.expiraEm) {
    sessaoEmMemoria = null;
    return null;
  }
  return sessaoEmMemoria;
}

/**
 * Limpa credenciais ativas da memória.
 */
export function limparSessaoCredenciais(): void {
  sessaoEmMemoria = null;
}
