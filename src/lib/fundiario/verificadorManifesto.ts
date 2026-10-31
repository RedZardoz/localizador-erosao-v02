/**
 * ============================================================================
 * Verificador de Integridade e Autenticidade do Banco Fundiário (SAREL)
 * ============================================================================
 *
 * Confere data/fundiario_brasil.db contra data/MANIFESTO_FUNDIARIO.json:
 * - Checa presença do manifesto e do banco de dados local.
 * - Recalcula tamanho em bytes e hash criptográfico SHA-256 (quando provisionado).
 * - Distingue três estados formais de hash:
 *     1. "indisponivel" (Caso 2: banco físico ausente no ambiente, declarado honestamente);
 *     2. "conferido"   (Caso 1: banco físico presente, tamanho e SHA-256 conferem);
 *     3. "divergente"   (tamanho ou SHA-256 diverge do manifesto oficial).
 * - Aplica auditoria de sanidade e plausibilidade estatística contra placeholders fabricados.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { verificarSanidadeHashSha256 } from "./manifestoSanidade";

export interface ManifestoFundiario {
  versaoEsquema: string;
  descricao: string;
  banco: {
    arquivo: string;
    caminhoRelativo: string;
    tamanhoBytes: number;
    sha256: string | null;
    sha256Estado?: "conferido" | "indisponivel" | "divergente";
    sha256Motivo?: string;
    totalPropriedades: number;
    ufDominante?: string;
    tabelas?: Record<string, number>;
  };
  fontesOficiais?: Array<{
    sigla: string;
    orgao: string;
    urlOficial: string;
    dataDownload: string;
    escopo: string;
    registros?: number;
  }>;
  scriptsIngestao?: string[];
  geradoPor?: string;
  geradoEm: string;
  gitCommit?: string;
}

export type StatusHashManifesto =
  | "conferido"
  | "indisponivel"
  | "divergente"
  | "nao_verificado";

export interface ResultadoVerificacaoManifesto {
  valido: boolean;
  bancoPresente: boolean;
  manifestoPresente: boolean;
  statusHash: StatusHashManifesto;
  mensagem: string;
  divergencias?: string[];
  manifesto?: ManifestoFundiario;
}

/**
 * Verifica a autenticidade e integridade física da base SQLite fundiária.
 */
export function verificarManifestoFundiario(
  caminhoDbRelativo = "data/fundiario_brasil.db",
  caminhoManifestoRelativo = "data/MANIFESTO_FUNDIARIO.json"
): ResultadoVerificacaoManifesto {
  const projectRoot = process.cwd();
  const dbPath = path.isAbsolute(caminhoDbRelativo)
    ? caminhoDbRelativo
    : path.join(projectRoot, caminhoDbRelativo);
  const manifestoPath = path.isAbsolute(caminhoManifestoRelativo)
    ? caminhoManifestoRelativo
    : path.join(projectRoot, caminhoManifestoRelativo);

  const bancoPresente = fs.existsSync(dbPath);
  const manifestoPresente = fs.existsSync(manifestoPath);

  if (!manifestoPresente) {
    return {
      valido: false,
      bancoPresente,
      manifestoPresente: false,
      statusHash: "nao_verificado",
      mensagem: `Manifesto fundiário não encontrado em: ${manifestoPath}`,
    };
  }

  let manifesto: ManifestoFundiario;
  try {
    const raw = fs.readFileSync(manifestoPath, "utf-8");
    manifesto = JSON.parse(raw);
  } catch (err) {
    return {
      valido: false,
      bancoPresente,
      manifestoPresente: true,
      statusHash: "nao_verificado",
      mensagem: `Erro ao analisar manifesto fundiário JSON: ${err}`,
    };
  }

  // Trava de sanidade do hash do manifesto (previne hashes fabricados manualmente)
  const sanidade = verificarSanidadeHashSha256(
    manifesto.banco.sha256,
    manifesto.banco.sha256Estado
  );
  if (!sanidade.valido) {
    return {
      valido: false,
      bancoPresente,
      manifestoPresente: true,
      statusHash: "divergente",
      mensagem: `Manifesto fundiário rejeitado pela trava de sanidade criptográfica: ${sanidade.motivo}`,
      divergencias: [sanidade.motivo || "Hash estatisticamente inválido ou fabricado"],
      manifesto,
    };
  }

  // Situação 1: Banco ausente no host
  if (!bancoPresente) {
    if (
      manifesto.banco.sha256 === null ||
      manifesto.banco.sha256Estado === "indisponivel"
    ) {
      return {
        valido: false,
        bancoPresente: false,
        manifestoPresente: true,
        statusHash: "indisponivel",
        mensagem: `Banco fundiário não provisionado em: ${dbPath} (Caso 2: hash SHA-256 declarado como indisponível: ${manifesto.banco.sha256Motivo || "base externa"}).`,
        manifesto,
      };
    }

    return {
      valido: false,
      bancoPresente: false,
      manifestoPresente: true,
      statusHash: "nao_verificado",
      mensagem: `Banco fundiário não provisionado em: ${dbPath}. Execute o download conforme manifesto.`,
      manifesto,
    };
  }

  // Banco físico presente em disco: auditar integridade física
  const divergencias: string[] = [];
  const stats = fs.statSync(dbPath);
  if (
    manifesto.banco.tamanhoBytes &&
    stats.size !== manifesto.banco.tamanhoBytes
  ) {
    divergencias.push(
      `Tamanho em bytes divergente: esperado ${manifesto.banco.tamanhoBytes}, encontrado ${stats.size}.`
    );
  }

  // Situação onde o banco existe mas o manifesto ainda registrava como indisponível
  if (
    manifesto.banco.sha256 === null ||
    manifesto.banco.sha256Estado === "indisponivel"
  ) {
    return {
      valido: false,
      bancoPresente: true,
      manifestoPresente: true,
      statusHash: "indisponivel",
      mensagem: `Banco fundiário presente no host, mas o manifesto ainda registra 'sha256Estado: indisponivel'. Execute 'python scripts/gerar_manifesto_fundiario.py' para registrar o hash conferido.`,
      divergencias: [
        "Manifesto fundiário requer recálculo de hash para a base local presente.",
      ],
      manifesto,
    };
  }

  // Recalcula SHA-256
  const fileBuffer = fs.readFileSync(dbPath);
  const hashCalculado = crypto
    .createHash("sha256")
    .update(fileBuffer)
    .digest("hex");

  if (
    manifesto.banco.sha256 &&
    hashCalculado.toLowerCase() !== manifesto.banco.sha256.toLowerCase()
  ) {
    divergencias.push(
      `SHA-256 divergente: esperado ${manifesto.banco.sha256}, calculado ${hashCalculado}.`
    );
  }

  // Situação 3: Divergência detectada
  if (divergencias.length > 0) {
    return {
      valido: false,
      bancoPresente: true,
      manifestoPresente: true,
      statusHash: "divergente",
      mensagem: `Banco fundiário local corrompido ou divergente do manifesto oficial (${divergencias.length} divergência(s)).`,
      divergencias,
      manifesto,
    };
  }

  // Situação 2: Integridade física conferida e confirmada
  return {
    valido: true,
    bancoPresente: true,
    manifestoPresente: true,
    statusHash: "conferido",
    mensagem:
      "Banco fundiário validado com sucesso contra o manifesto oficial de integridade.",
    manifesto,
  };
}
