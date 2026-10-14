/**
 * ============================================================================
 * Guarda de Segurança e Carregador de Credenciais de Lote (Regra C1)
 * SAREL v2.0 — Disciplina Pericial PPGTCA 2026
 * ============================================================================
 *
 * REGRAS INVIOLÁVEIS (C1):
 * 1. Nenhuma credencial toca o repositório — nem em commit, nem na árvore local,
 *    mesmo que coberta por .gitignore.
 * 2. Duas vias, e só duas:
 *    - Via interativa: Painel -> sessão efêmera em memória (sessaoEfemera.ts).
 *    - Via de lote: Variável de ambiente SAREL_GEE_SERVICE_ACCOUNT_FILE contendo
 *      o CAMINHO de um arquivo JSON fora da árvore do projeto.
 * 3. Guarda canônica: Qualquer caminho que resolva dentro da árvore do projeto
 *    é RECUSADO compulsoriamente com erro explícito nomeando a Regra C1.
 */

import fs from "fs";
import path from "path";
import type { CredenciaisServiceAccount } from "./sessaoEfemera";

export const NOME_VAR_ENV_GEE_SERVICE_ACCOUNT = "SAREL_GEE_SERVICE_ACCOUNT_FILE";

/**
 * Valida se um caminho de arquivo de credencial está estritamente FORA da árvore do repositório.
 * Lança erro explícito nomeando a Regra C1 caso resolva dentro de `raizRepositorio` (padrão: process.cwd()).
 */
export function validarCaminhoArquivoCredencial(
  caminhoArquivo: string,
  raizRepositorio?: string
): string {
  if (!caminhoArquivo || typeof caminhoArquivo !== "string" || !caminhoArquivo.trim()) {
    throw new Error(
      "[VIOLAÇÃO REGRA C1] Caminho de arquivo de credencial não fornecido ou vazio."
    );
  }

  const caminhoTrim = caminhoArquivo.trim();

  // Rejeita tentativas de colar o conteúdo JSON diretamente na variável de caminho
  if (caminhoTrim.startsWith("{") || caminhoTrim.includes('"private_key"')) {
    throw new Error(
      "[VIOLAÇÃO REGRA C1] A variável de ambiente de credencial deve conter exclusivamente o CAMINHO para o arquivo, nunca o segredo ou conteúdo JSON diretamente."
    );
  }

  const raiz = path.resolve(raizRepositorio || process.cwd());
  const caminhoAbsoluto = path.resolve(caminhoTrim);

  // Normalização case-insensitive para compatibilidade com Windows e case-preserving em Unix
  const normCaminho = path.normalize(caminhoAbsoluto).toLowerCase();
  const normRaiz = path.normalize(raiz).toLowerCase();
  const sep = path.sep.toLowerCase();

  const estaDentroDoRepo =
    normCaminho === normRaiz ||
    normCaminho.startsWith(normRaiz + sep);

  if (estaDentroDoRepo) {
    throw new Error(
      `[VIOLAÇÃO REGRA C1] O caminho de credencial '${caminhoTrim}' resolve dentro da árvore do repositório (${caminhoAbsoluto}). É estritamente proibido armazenar arquivos de credenciais dentro da raiz do projeto, mesmo que cobertos por .gitignore.`
    );
  }

  return caminhoAbsoluto;
}

/**
 * Obtém o caminho do arquivo de Service Account do GEE para operações de lote,
 * aplicando a guarda estrita de exclusão da árvore do repositório.
 */
export function obterCaminhoCredencialServiceAccountLote(
  raizRepositorio?: string
): string | null {
  const envVal = process.env[NOME_VAR_ENV_GEE_SERVICE_ACCOUNT];
  if (!envVal || !envVal.trim()) {
    return null;
  }
  return validarCaminhoArquivoCredencial(envVal, raizRepositorio);
}

/**
 * Carrega e valida o arquivo JSON de Service Account apontado por SAREL_GEE_SERVICE_ACCOUNT_FILE.
 * Retorna null se a variável de ambiente não estiver definida.
 * Lança erro se o caminho violar C1, se o arquivo não existir ou se o JSON estiver incompleto.
 */
export function carregarCredenciaisServiceAccountLote(
  raizRepositorio?: string
): CredenciaisServiceAccount | null {
  const caminhoAbsoluto = obterCaminhoCredencialServiceAccountLote(raizRepositorio);
  if (!caminhoAbsoluto) {
    return null;
  }

  if (!fs.existsSync(caminhoAbsoluto)) {
    throw new Error(
      `[REGRA C1] Arquivo de Service Account indicado em ${NOME_VAR_ENV_GEE_SERVICE_ACCOUNT} não foi encontrado no disco: '${caminhoAbsoluto}'.`
    );
  }

  let conteudoJson: any;
  try {
    const raw = fs.readFileSync(caminhoAbsoluto, "utf-8");
    conteudoJson = JSON.parse(raw);
  } catch (err: any) {
    throw new Error(
      `[REGRA C1] Falha ao analisar o arquivo JSON de Service Account em '${caminhoAbsoluto}': ${err?.message || "JSON inválido"}.`
    );
  }

  if (!conteudoJson || typeof conteudoJson !== "object") {
    throw new Error(
      `[REGRA C1] Arquivo em '${caminhoAbsoluto}' não contém um objeto JSON válido.`
    );
  }

  const { project_id, client_email, private_key } = conteudoJson;
  if (!project_id || typeof project_id !== "string") {
    throw new Error(
      `[REGRA C1] Service Account em '${caminhoAbsoluto}' não possui o campo obrigatório 'project_id'.`
    );
  }
  if (!client_email || typeof client_email !== "string") {
    throw new Error(
      `[REGRA C1] Service Account em '${caminhoAbsoluto}' não possui o campo obrigatório 'client_email'.`
    );
  }
  if (!private_key || typeof private_key !== "string") {
    throw new Error(
      `[REGRA C1] Service Account em '${caminhoAbsoluto}' não possui o campo obrigatório 'private_key'.`
    );
  }

  return {
    type: conteudoJson.type,
    project_id,
    private_key_id: conteudoJson.private_key_id,
    private_key,
    client_email,
    client_id: conteudoJson.client_id,
    auth_uri: conteudoJson.auth_uri,
    token_uri: conteudoJson.token_uri,
    auth_provider_x509_cert_url: conteudoJson.auth_provider_x509_cert_url,
    client_x509_cert_url: conteudoJson.client_x509_cert_url,
    universe_domain: conteudoJson.universe_domain,
  };
}
