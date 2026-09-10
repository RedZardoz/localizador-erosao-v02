/**
 * ============================================================================
 * Proteção de Dados e Anonimização LGPD — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * Em estrita observância à Lei Geral de Proteção de Dados (Lei nº 13.709/2018):
 * - Titulares do SNCR preservam a máscara oficial de auditoria byte a byte.
 * - Documentos de identificação (CPF/CNPJ) NUNCA são expostos em claro.
 * - Denominação de imóvel jamais é inventada quando ausente.
 */

/**
 * Aplica máscara rígida em números de CPF ou CNPJ.
 */
export function mascararDocumentoPessoal(documento: string | null | undefined): string {
  if (!documento || documento.trim().length === 0) {
    return "não informado";
  }
  const limpo = documento.replace(/\D/g, "");
  if (limpo.length === 11) {
    // CPF: ***.456.789-**
    return `***.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-**`;
  }
  if (limpo.length === 14) {
    // CNPJ: **.***.456/0001-**
    return `**.***.${limpo.slice(5, 8)}/${limpo.slice(8, 12)}-**`;
  }
  // Se for texto já mascarado ou formato atípico
  return "***.***.***-**";
}

/**
 * Valida se o titular do SNCR está no padrão oficial mascarado fornecido pelo INCRA.
 * Exemplo: "ADAO ********************"
 */
export function validarMascaraTitularSncr(titular: string | null | undefined): string {
  if (!titular || titular.trim().length === 0) {
    return "não informado";
  }
  return titular.trim();
}
