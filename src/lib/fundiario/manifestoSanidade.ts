/**
 * ============================================================================
 * Trava Anti-Reincidência de Sanidade e Plausibilidade Estatística de SHA-256
 * SAREL v2.0 — Disciplina de Integridade Epistemológica (Regra 1 / R-L1)
 * ============================================================================
 *
 * Detecta hashes de resumo criptográfico fabricados manualmente (placeholders,
 * sequências repetitivas, progressões aritméticas).
 *
 * Critérios auditados:
 * 1. O valor é null com sha256Estado: "indisponivel", OU é string de exatamente
 *    64 caracteres hexadecimais [0-9a-f].
 * 2. Nenhum k-grama de 4+ caracteres se repete 3 ou mais vezes consecutivas na
 *    cadeia completa, nem na cadeia dos dígitos de baixa ordem de cada byte (nibbles).
 * 3. Menos de 25% das diferenças entre pares de bytes consecutivos assumem um
 *    mesmo valor (proteção contra progressões aritméticas geradas por script).
 * 4. Os 16 dígitos hexadecimais possuem distribuição compatível com aleatoriedade
 *    (calibrado para falso positivo nulo: exige pelo menos 13 caracteres distintos).
 */

export interface ResultadoSanidadeHash {
  valido: boolean;
  motivo?: string;
  detalhes?: {
    tamanho?: number;
    kGramaRepetido?: string;
    freqMaxDiff?: number;
    caracteresDistintos?: number;
  };
}

/**
 * Valida a plausibilidade estatística de um hash SHA-256 ou declaração de indisponibilidade.
 */
export function verificarSanidadeHashSha256(
  sha256: string | null | undefined,
  sha256Estado?: string
): ResultadoSanidadeHash {
  // 1. Caso nulo / honestamente indisponível (Caso 2)
  if (sha256 === null || sha256 === undefined) {
    if (sha256Estado === "indisponivel") {
      return { valido: true };
    }
    return {
      valido: false,
      motivo: "Hash SHA-256 é nulo, mas sha256Estado não é 'indisponivel'.",
    };
  }

  // 1b. Validação estrita de formato (64 caracteres hexadecimais)
  const h = sha256.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(h)) {
    return {
      valido: false,
      motivo: `Formato inválido para SHA-256 (esperado exatamente 64 caracteres hexadecimais [0-9a-f], recebido ${h.length}).`,
      detalhes: { tamanho: h.length },
    };
  }

  // 2a. Nenhum k-grama de 4+ caracteres se repete 3 ou mais vezes consecutivas na cadeia completa
  for (let k = 4; k <= 16; k++) {
    for (let i = 0; i <= h.length - 3 * k; i++) {
      const pat = h.slice(i, i + k);
      const rep = pat + pat + pat;
      if (h.includes(rep)) {
        return {
          valido: false,
          motivo: `K-grama fabricado '${pat}' (tamanho ${k}) repete-se 3 ou mais vezes consecutivas na cadeia hexadecimal.`,
          detalhes: { kGramaRepetido: pat },
        };
      }
    }
  }

  // 2b. Nenhum k-grama de 4+ caracteres se repete 3 ou mais vezes consecutivas nos dígitos de baixa ordem
  let ult = "";
  for (let i = 0; i < 64; i += 2) {
    ult += h[i + 1];
  }
  for (let k = 4; k <= 10; k++) {
    for (let i = 0; i <= ult.length - 3 * k; i++) {
      const pat = ult.slice(i, i + k);
      const rep = pat + pat + pat;
      if (ult.includes(rep)) {
        return {
          valido: false,
          motivo: `K-grama fabricado '${pat}' (tamanho ${k}) repete-se 3 ou mais vezes consecutivas nos dígitos de baixa ordem de cada byte.`,
          detalhes: { kGramaRepetido: pat },
        };
      }
    }
  }

  // 3. Menos de 25% das diferenças entre pares de bytes consecutivos assumem um mesmo valor
  const bytes: number[] = [];
  for (let i = 0; i < 64; i += 2) {
    bytes.push(parseInt(h.slice(i, i + 2), 16));
  }
  const totalDiffs = bytes.length - 1; // 31
  const diffCounts = new Map<number, number>();
  for (let i = 0; i < totalDiffs; i++) {
    const diff = (bytes[i + 1] - bytes[i] + 256) % 256;
    const contagemAtual = diffCounts.get(diff);
    diffCounts.set(diff, contagemAtual !== undefined ? contagemAtual + 1 : 1);
  }
  let maxDiffCount = 0;
  for (const count of diffCounts.values()) {
    if (count > maxDiffCount) maxDiffCount = count;
  }
  const diffFreq = maxDiffCount / totalDiffs;
  if (diffFreq >= 0.25) {
    return {
      valido: false,
      motivo: `Assinatura de progressão aritmética artificial: diferença entre bytes consecutivos ocorre ${maxDiffCount}/${totalDiffs} vezes (${(diffFreq * 100).toFixed(1)}% >= 25% máximo tolerado).`,
      detalhes: { freqMaxDiff: diffFreq },
    };
  }

  // 4. Distribuição dos caracteres hexadecimais (falso positivo praticamente nulo: >= 13 distintos)
  const distinctChars = new Set(h.split(""));
  if (distinctChars.size < 13) {
    return {
      valido: false,
      motivo: `Distribuição de entropia insuficiente: apenas ${distinctChars.size} caracteres hexadecimais distintos presentes em 64 posições.`,
      detalhes: { caracteresDistintos: distinctChars.size },
    };
  }

  return { valido: true };
}
