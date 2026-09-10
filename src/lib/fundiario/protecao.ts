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
 * Retorna null se documento for nulo ou vazio.
 */
export function mascararDocumentoPessoal(documento: string | null | undefined): string | null {
  if (!documento || documento.trim().length === 0) {
    return null;
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
  // Se já for uma máscara (contendo '*')
  if (documento.includes("*")) {
    return documento.trim();
  }
  return "***.***.***-**";
}

/**
 * Valida e preserva a máscara de titular do SNCR fornecida pelo INCRA byte a byte.
 * Se o nome estiver em claro, mascara os sobrenomes com asteriscos.
 * Retorna null se ausente.
 */
export function validarMascaraTitularSncr(titular: string | null | undefined): string | null {
  if (!titular || titular.trim().length === 0) {
    return null;
  }
  const trimmed = titular.trim();
  if (trimmed.includes("*")) {
    return trimmed;
  }
  // Caso venha em claro acidentalmente, preserva primeiro nome e mascara o restante
  const partes = trimmed.split(/\s+/);
  if (partes.length <= 1) {
    return `${partes[0].slice(0, 3)}*******`;
  }
  const primeiroNome = partes[0];
  const restoTamanho = trimmed.length - primeiroNome.length - 1;
  const tamanhoMascara = restoTamanho > 10 ? restoTamanho : 10;
  return `${primeiroNome} ${"*".repeat(tamanhoMascara)}`;
}
