/**
 * ============================================================================
 * Gravador de Evidências da Regra 8 para o Google Earth Engine (GEE)
 * SAREL v2.0 — Metodologia PPGTCA 2026 (Regra 8, Regra C1 e §6)
 * ============================================================================
 *
 * PROPÓSITO:
 * - Grava respostas brutas de consultas ao GEE em docs/verificacoes/ sob demanda explícita.
 * - Elimina compulsoriamente tokens, chaves privadas e credenciais antes da gravação.
 * - Verifica a ausência estrita de dados pessoais (CPF, CNPJ, titulares).
 * - Gera hashes SHA-256 e metadados de proveniência orbital (coleção, coordenadas, datas).
 * - É ESTRITAMENTE VEDADO gravar em src/ ou em scripts/. O destino é exclusivamente docs/verificacoes/.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { JANELA_TEMPORAL_D05 } from "@/lib/matriz/perfis";
import { dataCivilSaoPaulo } from "@/lib/tempo/datas";

export const COLECAO_SENTINEL2_PADRAO = "COPERNICUS/S2_SR_HARMONIZED";

export interface ParametrosGravacaoEvidenciaGee {
  coordenadas: {
    latitude: number;
    longitude: number;
  };
  respostaBruta: unknown;
  operacao?: string; // padrão: "inspecao_ponto"
  colecao?: string; // padrão: "COPERNICUS/S2_SR_HARMONIZED"
  janelaTemporal?: { inicio: string; fim: string };
  dataConsulta?: string; // data em YYYY-MM-DD ou ISO
  diretorioDestino?: string; // default: docs/verificacoes
}

export interface ResultadoGravacaoEvidenciaGee {
  sucesso: true;
  nomeArquivo: string;
  caminhoRelativo: string;
  caminhoAbsoluto: string;
  hashSha256Resposta: string;
  dataVerificacao: string;
  totalObservacoes?: number;
}

export interface PontoEvidenciaLote {
  id?: string;
  coordenadas: {
    latitude: number;
    longitude: number;
  };
  observacoes: Array<unknown>;
  nObservacoesValidasPorBanda: Record<string, number>;
  nObservacoesValidas: number;
  insuficienteD11: boolean;
}

export interface CustoMedidoExecucao {
  requisicoesEmitidas: number;
  tempoTotalMs: number;
  tempoPorPontoMs: number;
}

export interface ParametrosGravacaoEvidenciaLoteGee {
  pontos: PontoEvidenciaLote[];
  custoMedido: CustoMedidoExecucao;
  operacao?: string; // padrão: "serie_s2_lote"
  colecao?: string; // padrão: "COPERNICUS/S2_SR_HARMONIZED"
  janelaTemporal?: { inicio: string; fim: string };
  dataConsulta?: string; // data em YYYY-MM-DD ou ISO
  diretorioDestino?: string; // default: docs/verificacoes
}

export interface ResultadoGravacaoEvidenciaLoteGee {
  sucesso: true;
  nomeArquivo: string;
  caminhoRelativo: string;
  caminhoAbsoluto: string;
  hashSha256Resposta: string;
  dataVerificacao: string;
  numeroPontos: number;
  custoMedido: CustoMedidoExecucao;
}

const CHAVES_SENSIVEIS_PROIBIDAS = [
  "token",
  "access_token",
  "accesstoken",
  "id_token",
  "refresh_token",
  "refreshtoken",
  "private_key",
  "privatekey",
  "client_secret",
  "clientsecret",
  "client_email",
  "clientemail",
  "service_account",
  "serviceaccount",
  "authorization",
  "bearer",
  "auth",
  "secret",
  "senha",
  "password",
  "key",
  "apikey",
  "api_key",
  "cpf",
  "cnpj",
  "titular",
  "documento",
  "jwt",
];

const REGEX_CHAVE_SENSIVEL = new RegExp(`^(${CHAVES_SENSIVEIS_PROIBIDAS.join("|")})$`, "i");

const REGEX_VALOR_SENSIVEL = [
  /-----BEGIN [A-Z\s]*PRIVATE KEY-----/i,
  /^Bearer\s+[A-Za-z0-9_-]+/i,
  /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, // JWT
  /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/, // CPF
  /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/, // CNPJ
];

/**
 * Sanitiza recursivamente qualquer payload removendo campos de credenciais
 * e verificando ausência de chaves privadas ou dados pessoais.
 *
 * Lança erro explícito se uma chave privada ou token em formato bruto for detectado.
 */
export function sanitizarRespostaBrutaGee(valor: unknown): unknown {
  if (valor === null || valor === undefined) return valor;

  if (typeof valor === "string") {
    for (const regex of REGEX_VALOR_SENSIVEL) {
      if (regex.test(valor)) {
        throw new Error(
          "VIOLACAO_REGRA_8_CREDENCIAL_DETECTADA: Valor sensível (chave privada, token JWT ou dado pessoal) detectado no payload."
        );
      }
    }
    return valor;
  }

  if (typeof valor !== "object") {
    return valor;
  }

  if (Array.isArray(valor)) {
    return valor.map((item) => sanitizarRespostaBrutaGee(item));
  }

  const objetoLimpo: Record<string, unknown> = {};
  for (const [chave, val] of Object.entries(valor as Record<string, unknown>)) {
    // 1. Remove qualquer chave de credencial, segredo ou dado pessoal
    if (REGEX_CHAVE_SENSIVEL.test(chave) || /token|secret|password|private_key|client_email|bearer/i.test(chave)) {
      continue;
    }
    objetoLimpo[chave] = sanitizarRespostaBrutaGee(val);
  }

  return objetoLimpo;
}

/**
 * Validação rigorosa do texto serializado antes da gravação em disco.
 * Garante que nenhum campo de credencial atravessou o filtro.
 */
export function assegurarAusenciaTotalCredenciais(jsonString: string): void {
  if (/-----BEGIN\s+[A-Z\s]*PRIVATE KEY/i.test(jsonString)) {
    throw new Error("VIOLACAO_REGRA_8_CREDENCIAL_DETECTADA: Chave privada detectada no documento serializado.");
  }

  const camposProibidos = [
    "access_token",
    "private_key",
    "client_secret",
    "client_email",
    "refresh_token",
    "service_account",
    "authorization",
  ];

  for (const campo of camposProibidos) {
    const regex = new RegExp(`"${campo}"\\s*:`, "i");
    if (regex.test(jsonString)) {
      throw new Error(`VIOLACAO_REGRA_8_CREDENCIAL_DETECTADA: Campo proibido '${campo}' atravessou a sanitização.`);
    }
  }
}

/**
 * Grava a evidência da Regra 8 em docs/verificacoes/AAAA-MM-DD_gee_serie_s2_<operacao>.json
 * de forma explícita e sob demanda.
 */
export function gravarEvidenciaGeeSerieS2(
  params: ParametrosGravacaoEvidenciaGee
): ResultadoGravacaoEvidenciaGee {
  const { coordenadas, respostaBruta } = params;

  if (
    !coordenadas ||
    typeof coordenadas.latitude !== "number" ||
    typeof coordenadas.longitude !== "number" ||
    !Number.isFinite(coordenadas.latitude) ||
    !Number.isFinite(coordenadas.longitude)
  ) {
    throw new Error("Coordenadas geográficas inválidas para gravação de evidência GEE.");
  }

  if (respostaBruta === undefined || respostaBruta === null) {
    throw new Error("Resposta bruta do GEE ausente para gravação de evidência.");
  }

  const operacaoBruta = params.operacao || "inspecao_ponto";
  const operacao = operacaoBruta.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();

  const dataHoje = params.dataConsulta
    ? params.dataConsulta.slice(0, 10)
    : dataCivilSaoPaulo();

  const nomeArquivo = `${dataHoje}_gee_serie_s2_${operacao}.json`;

  // Validação estrita de destino (Regra 8: destino é docs/verificacoes, VEDADO gravar em src/ ou scripts/)
  const pastaBaseDocs = path.resolve(process.cwd(), "docs", "verificacoes");
  const pastaDestino = params.diretorioDestino
    ? path.resolve(params.diretorioDestino)
    : pastaBaseDocs;

  const caminhoNormalizado = pastaDestino.replace(/\\/g, "/");
  if (caminhoNormalizado.includes("/src/") || caminhoNormalizado.includes("/scripts/")) {
    throw new Error(`Destino proibido: ${pastaDestino}. É VEDADO gravar evidências em src/ ou em scripts/.`);
  }

  if (!fs.existsSync(pastaDestino)) {
    fs.mkdirSync(pastaDestino, { recursive: true });
  }

  const caminhoAbsoluto = path.join(pastaDestino, nomeArquivo);

  // 1. Sanitização de credenciais e dados pessoais
  const respostaSanitizada = sanitizarRespostaBrutaGee(respostaBruta);

  // 2. Hash SHA-256 da resposta bruta sanitizada
  const stringResposta = JSON.stringify(respostaSanitizada);
  const hashSha256 = crypto.createHash("sha256").update(stringResposta).digest("hex");

  // 3. Montagem do artefato de evidência da Regra 8
  const documentoEvidencia = {
    tipo: "REGRA_8_EVIDENCIA_GEE" as const,
    fonte: "Google Earth Engine REST API v1 (value:compute)",
    colecao: params.colecao || COLECAO_SENTINEL2_PADRAO,
    janelaTemporal: params.janelaTemporal || {
      inicio: JANELA_TEMPORAL_D05.inicio,
      fim: JANELA_TEMPORAL_D05.fim,
    },
    coordenadas: {
      latitude: coordenadas.latitude,
      longitude: coordenadas.longitude,
    },
    operacao,
    dataConsulta: params.dataConsulta || new Date().toISOString(),
    dataVerificacao: dataHoje,
    hashSha256Resposta: hashSha256,
    respostaBruta: respostaSanitizada,
  };

  const jsonFinal = JSON.stringify(documentoEvidencia, null, 2);

  // 4. Verificação de segurança estrita final (falha se credencial vazar)
  assegurarAusenciaTotalCredenciais(jsonFinal);

  // 5. Escrita atômica em disco
  fs.writeFileSync(caminhoAbsoluto, jsonFinal, "utf8");

  const totalObs = Array.isArray(respostaSanitizada)
    ? respostaSanitizada.length
    : Array.isArray((respostaSanitizada as any)?.observacoes)
      ? (respostaSanitizada as any).observacoes.length
      : Array.isArray((respostaSanitizada as any)?.features)
        ? (respostaSanitizada as any).features.length
        : undefined;

  const caminhoRelativo = path.relative(process.cwd(), caminhoAbsoluto).replace(/\\/g, "/");

  return {
    sucesso: true,
    nomeArquivo,
    caminhoRelativo,
    caminhoAbsoluto,
    hashSha256Resposta: hashSha256,
    dataVerificacao: dataHoje,
    totalObservacoes: totalObs,
  };
}

/**
 * Grava a evidência de medição de série temporal em lote da Regra 8
 * em docs/verificacoes/AAAA-MM-DD_gee_serie_s2_<operacao>.json
 * de forma explícita e sob demanda para múltiplos pontos amostrais.
 */
export function gravarEvidenciaLoteGeeSerieS2(
  params: ParametrosGravacaoEvidenciaLoteGee
): ResultadoGravacaoEvidenciaLoteGee {
  const { pontos, custoMedido } = params;

  if (!Array.isArray(pontos) || pontos.length === 0) {
    throw new Error("Lista de pontos vazia ou inválida para gravação de evidência em lote.");
  }

  for (let i = 0; i < pontos.length; i++) {
    const p = pontos[i];
    if (
      !p.coordenadas ||
      typeof p.coordenadas.latitude !== "number" ||
      typeof p.coordenadas.longitude !== "number" ||
      !Number.isFinite(p.coordenadas.latitude) ||
      !Number.isFinite(p.coordenadas.longitude)
    ) {
      throw new Error(`Coordenadas inválidas para o ponto no índice ${i}.`);
    }
  }

  if (
    !custoMedido ||
    typeof custoMedido.requisicoesEmitidas !== "number" ||
    typeof custoMedido.tempoTotalMs !== "number" ||
    typeof custoMedido.tempoPorPontoMs !== "number" ||
    !Number.isFinite(custoMedido.requisicoesEmitidas) ||
    !Number.isFinite(custoMedido.tempoTotalMs) ||
    !Number.isFinite(custoMedido.tempoPorPontoMs)
  ) {
    throw new Error("Custo medido inválido ou ausente para gravação de evidência.");
  }

  const operacaoBruta = params.operacao || "serie_s2_lote";
  const operacao = operacaoBruta.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();

  const dataHoje = params.dataConsulta
    ? params.dataConsulta.slice(0, 10)
    : dataCivilSaoPaulo();

  const nomeArquivo = `${dataHoje}_gee_serie_s2_${operacao}.json`;

  const pastaBaseDocs = path.resolve(process.cwd(), "docs", "verificacoes");
  const pastaDestino = params.diretorioDestino
    ? path.resolve(params.diretorioDestino)
    : pastaBaseDocs;

  const caminhoNormalizado = pastaDestino.replace(/\\/g, "/");
  if (caminhoNormalizado.includes("/src/") || caminhoNormalizado.includes("/scripts/")) {
    throw new Error(`Destino proibido: ${pastaDestino}. É VEDADO gravar evidências em src/ ou em scripts/.`);
  }

  if (!fs.existsSync(pastaDestino)) {
    fs.mkdirSync(pastaDestino, { recursive: true });
  }

  const caminhoAbsoluto = path.join(pastaDestino, nomeArquivo);

  // 1. Sanitização profunda de credenciais e dados pessoais em cada ponto
  const pontosSanitizados = sanitizarRespostaBrutaGee(pontos) as PontoEvidenciaLote[];

  // 2. Hash SHA-256 do payload sanitizado
  const stringResposta = JSON.stringify(pontosSanitizados);
  const hashSha256 = crypto.createHash("sha256").update(stringResposta).digest("hex");

  // 3. Montagem do documento de lote
  const documentoEvidencia = {
    tipo: "REGRA_8_EVIDENCIA_GEE_LOTE" as const,
    fonte: "Google Earth Engine REST API v1 (value:compute)",
    colecao: params.colecao || COLECAO_SENTINEL2_PADRAO,
    janelaTemporal: params.janelaTemporal || {
      inicio: JANELA_TEMPORAL_D05.inicio,
      fim: JANELA_TEMPORAL_D05.fim,
    },
    numeroPontos: pontos.length,
    operacao,
    dataConsulta: params.dataConsulta || new Date().toISOString(),
    dataVerificacao: dataHoje,
    custoMedido: {
      requisicoesEmitidas: custoMedido.requisicoesEmitidas,
      tempoTotalMs: custoMedido.tempoTotalMs,
      tempoPorPontoMs: custoMedido.tempoPorPontoMs,
    },
    hashSha256Resposta: hashSha256,
    pontos: pontosSanitizados,
  };

  const jsonFinal = JSON.stringify(documentoEvidencia, null, 2);

  // 4. Verificação de segurança estrita (garante ausência total de chaves ou tokens)
  assegurarAusenciaTotalCredenciais(jsonFinal);

  // 5. Escrita atômica em disco
  fs.writeFileSync(caminhoAbsoluto, jsonFinal, "utf8");

  const caminhoRelativo = path.relative(process.cwd(), caminhoAbsoluto).replace(/\\/g, "/");

  return {
    sucesso: true,
    nomeArquivo,
    caminhoRelativo,
    caminhoAbsoluto,
    hashSha256Resposta: hashSha256,
    dataVerificacao: dataHoje,
    numeroPontos: pontos.length,
    custoMedido: {
      requisicoesEmitidas: custoMedido.requisicoesEmitidas,
      tempoTotalMs: custoMedido.tempoTotalMs,
      tempoPorPontoMs: custoMedido.tempoPorPontoMs,
    },
  };
}
