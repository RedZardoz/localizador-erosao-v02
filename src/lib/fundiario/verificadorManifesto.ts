/**
 * ============================================================================
 * Verificador de Integridade e Autenticidade do Banco Fundiário (SAREL)
 * ============================================================================
 *
 * Confere data/fundiario_brasil.db contra data/MANIFESTO_FUNDIARIO.json:
 * - Checa presença do manifesto e do banco de dados local.
 * - Recalcula tamanho em bytes e hash criptográfico SHA-256.
 * - Identifica e relata qualquer divergência ou corrupção de dados.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface ManifestoFundiario {
  versaoEsquema: string;
  descricao: string;
  banco: {
    arquivo: string;
    caminhoRelativo: string;
    tamanhoBytes: number;
    sha256: string;
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

export interface ResultadoVerificacaoManifesto {
  valido: boolean;
  bancoPresente: boolean;
  manifestoPresente: boolean;
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
      mensagem: `Erro ao analisar manifesto fundiário JSON: ${err}`,
    };
  }

  if (!bancoPresente) {
    return {
      valido: false,
      bancoPresente: false,
      manifestoPresente: true,
      mensagem: `Banco fundiário não provisionado em: ${dbPath}. Execute o download conforme manifesto.`,
      manifesto,
    };
  }

  // Se o banco está presente, verifica integridade física
  const divergencias: string[] = [];
  const stats = fs.statSync(dbPath);
  if (manifesto.banco.tamanhoBytes && stats.size !== manifesto.banco.tamanhoBytes) {
    divergencias.push(
      `Tamanho em bytes divergente: esperado ${manifesto.banco.tamanhoBytes}, encontrado ${stats.size}.`
    );
  }

  // Recalcula SHA-256
  const fileBuffer = fs.readFileSync(dbPath);
  const hashCalculado = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  if (
    manifesto.banco.sha256 &&
    hashCalculado.toLowerCase() !== manifesto.banco.sha256.toLowerCase()
  ) {
    divergencias.push(
      `SHA-256 divergente: esperado ${manifesto.banco.sha256}, calculado ${hashCalculado}.`
    );
  }

  if (divergencias.length > 0) {
    return {
      valido: false,
      bancoPresente: true,
      manifestoPresente: true,
      mensagem: `Banco fundiário local corrompido ou divergente do manifesto oficial (${divergencias.length} divergência(s)).`,
      divergencias,
      manifesto,
    };
  }

  return {
    valido: true,
    bancoPresente: true,
    manifestoPresente: true,
    mensagem: "Banco fundiário validado com sucesso contra o manifesto oficial de integridade.",
    manifesto,
  };
}
