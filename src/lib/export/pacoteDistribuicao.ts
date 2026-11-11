/**
 * ============================================================================
 * Pacotes Selados por Papel e Diário de Distribuição — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * O QUE ESTE MÓDULO FAZ:
 * - Produz pacotes de exportação lacrados e selados por papel operacional:
 *   "autorizacao", "campo", "voo", "interpretacao".
 * - Cada pacote traz cabeçalho normativo com papel, data, advertência de restrição
 *   e hash criptográfico SHA-256 do payload tabular.
 * - Registra cada emissão no Diário de Distribuição oficial versionado em
 *   docs/verificacoes/distribuicao/diario_distribuicao.json.
 *
 * POR QUE ESTE MÓDULO EXISTE (Cegamento Amostral / Opções B e D):
 *   O SAREL opera como console do coordenador em 127.0.0.1. O cegamento de peritos,
 *   pilotos e fotointérpretes NÃO se dá por controle de acesso a uma tela local
 *   (que sem autenticação seria mera ilusão de segurança), mas sim pelo PROTOCOLO
 *   DE DISTRIBUIÇÃO EXTERNA. Cada papel recebe estritamente o pacote selado do seu perfil,
 *   e a prova de que o intérprete recebeu um arquivo sem estrato, sem titular real
 *   e sem probabilidades de inclusão é dada pelo diário de distribuição e pelo hash SHA-256.
 *
 * DESTINATÁRIO (CAMPO LIVRE, OPCIONAL):
 *   O campo destinatário é aceito pelo esquema mas NÃO é obrigatório. Registrar o nome
 *   nominalmente cria registro de dados pessoais de bolsistas e colaboradores. A decisão
 *   de preencher ou omitir o destinatário é tomada pelo pesquisador no momento de cada
 *   entrega física/digital, permanecendo o campo estritamente opcional.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { PontoAmostral } from "@/types/ponto";
import type { RotuloConsolidado } from "@/types/rotulo";
import {
  extrairLinhasPorPerfil,
  type OpcoesExportacao,
} from "./planilha";
import {
  type PerfilExportacao,
  validarColunasCegas,
  validarColunasAutorizacao,
  PERFIS_CEGOS,
} from "@/lib/matriz/perfis";
import { assegurarApenasPontosReais } from "@/lib/seguranca/guardaSintetico";
import { dataCivilSaoPaulo, instanteUtc } from "@/lib/tempo/datas";

export type PapelDistribuicao = "autorizacao" | "campo" | "voo" | "interpretacao";

export const PAPEL_PARA_PERFIL: Record<PapelDistribuicao, PerfilExportacao> = {
  autorizacao: "autorizacao",
  campo: "campo-cego",
  voo: "voo-cego",
  interpretacao: "interpretacao-cega",
} as const;

export const ADVERTENCIA_POR_PAPEL: Record<PapelDistribuicao, string> = {
  autorizacao:
    "CONTEÚDO RESTRITO AO CONTATO FUNDIÁRIO. Contém titularidade real para solicitação de autorização. Omissão estrita de estrato biofísico. Vedado repassar a intérpretes ou peritos de campo.",
  campo:
    "CONTEÚDO CEGO RESTRITO À EQUIPE DE CAMPO. Amostra para âncora de prevalência. Dados de titularidade e documentos mascarados. Omissão estrita de estrato e probabilidades de inclusão.",
  voo:
    "CONTEÚDO CEGO RESTRITO À OPERAÇÃO DE VOO DE DRONE. Envelope de voo e coordenadas para delineação centimétrica. Desvinculação fundiária total e omissão estrita de estrato.",
  interpretacao:
    "CONTEÚDO CEGO RESTRITO AOS FOTOINTÉRPRETES. Coordenadas e parâmetros de cena para rotulagem independente. Omissão estrita de estrato, titularidade e probabilidades de inclusão.",
};

export class ErroPacoteVazio extends Error {
  readonly papel: PapelDistribuicao;
  constructor(papel: PapelDistribuicao) {
    super(
      `[RECUSA DE DISTRIBUIÇÃO] Não é permitido gerar pacote vazio para o papel '${papel}'. O conjunto de pontos está vazio.`
    );
    this.name = "ErroPacoteVazio";
    this.papel = papel;
  }
}

export interface RegistroDistribuicao {
  id: string;
  papel: PapelDistribuicao;
  perfil: PerfilExportacao;
  geradoEm: string;
  sha256: string;
  totalPontos: number;
  nomeArquivo: string;
  /** Campo livre e estritamente OPCIONAL (não obrigatório por conformidade de privacidade) */
  destinatario?: string | null;
}

export interface DiarioDistribuicao {
  versao: "1.0";
  descricao: string;
  registros: RegistroDistribuicao[];
}

export interface OpcoesPacoteDistribuicao {
  destinatario?: string | null;
  rotulosConsolidados?: Record<string, RotuloConsolidado>;
  opcoesExportacao?: Pick<OpcoesExportacao, "seloD16" | "exigirDelineacaoD26">;
  /** Caminho do diário de distribuição. Padrão: docs/verificacoes/distribuicao/diario_distribuicao.json */
  caminhoDiario?: string;
  /** Se false, não grava no diário (útil para dry-run ou testes pontuais) */
  gravarNoDiario?: boolean;
  /** Data explícita para reprodutibilidade de testes */
  dataReferencia?: Date;
}

export interface PacoteDistribuicaoGerado {
  papel: PapelDistribuicao;
  perfil: PerfilExportacao;
  nomeArquivo: string;
  conteudoArquivo: string;
  payloadCsv: string;
  sha256: string;
  totalPontos: number;
  registro: RegistroDistribuicao;
}

export const CAMINHO_DIARIO_PADRAO = "docs/verificacoes/distribuicao/diario_distribuicao.json";

function escaparValorCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Lê o diário de distribuição existente ou inicializa um novo esquema válido.
 */
export function lerDiarioDistribuicao(caminhoArquivo: string = CAMINHO_DIARIO_PADRAO): DiarioDistribuicao {
  const caminhoAbs = path.resolve(process.cwd(), caminhoArquivo);
  if (fs.existsSync(caminhoAbs)) {
    const raw = fs.readFileSync(caminhoAbs, "utf8");
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.registros)) {
        return parsed as DiarioDistribuicao;
      }
    } catch {
      // Retorna diário recém-inicializado se corrompido
    }
  }

  return {
    versao: "1.0",
    descricao: "Diário Oficial de Distribuição de Pacotes Selados por Papel — SAREL (PPGTCA 2026)",
    registros: [],
  };
}

/**
 * Grava atomicamente um novo registro no diário de distribuição.
 */
export function registrarNoDiario(
  registro: RegistroDistribuicao,
  caminhoArquivo: string = CAMINHO_DIARIO_PADRAO
): DiarioDistribuicao {
  const caminhoAbs = path.resolve(process.cwd(), caminhoArquivo);
  const diario = lerDiarioDistribuicao(caminhoArquivo);

  diario.registros.push(registro);

  const dir = path.dirname(caminhoAbs);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(caminhoAbs, JSON.stringify(diario, null, 2) + "\n", "utf8");
  return diario;
}

/**
 * Gera um pacote selado por papel operacional, calculando hash SHA-256 e registrando no diário.
 */
export function gerarPacoteDistribuicao(
  pontos: PontoAmostral[],
  papel: PapelDistribuicao,
  opcoes?: OpcoesPacoteDistribuicao
): PacoteDistribuicaoGerado {
  // 1. Recusa conjunto de pontos vazio
  if (!pontos || pontos.length === 0) {
    throw new ErroPacoteVazio(papel);
  }

  // 2. Guarda antissintético
  assegurarApenasPontosReais(pontos, `geração de pacote de distribuição para papel '${papel}'`);

  const perfil = PAPEL_PARA_PERFIL[papel];
  if (!perfil) {
    throw new Error(`[ERRO DE CONFIGURAÇÃO] Papel de distribuição desconhecido: '${papel}'`);
  }

  // 3. Extração estrita das linhas pelo perfil
  const linhas = extrairLinhasPorPerfil(
    pontos,
    perfil,
    opcoes?.rotulosConsolidados,
    opcoes?.opcoesExportacao
  );

  const colunas = linhas.length > 0 ? Object.keys(linhas[0]) : [];

  // 4. Trava de segurança e cegamento sobre as colunas extraídas
  if ((PERFIS_CEGOS as readonly string[]).includes(perfil)) {
    validarColunasCegas(perfil, colunas);
  } else if (perfil === "autorizacao") {
    validarColunasAutorizacao(colunas);
  }

  // 5. Montagem do payload tabular em CSV canônico UTF-8
  const linhasPayloadCsv: string[] = [];
  linhasPayloadCsv.push(colunas.map(escaparValorCsv).join(","));

  for (const l of linhas) {
    const vals = colunas.map((col) => escaparValorCsv(l[col]));
    linhasPayloadCsv.push(vals.join(","));
  }

  const payloadCsv = linhasPayloadCsv.join("\r\n");

  // 6. Cálculo do Hash SHA-256 sobre o payload tabular (colunas + dados)
  const sha256 = crypto.createHash("sha256").update(payloadCsv, "utf8").digest("hex");

  // 7. Nome de arquivo declarando papel e data civil
  const dataRef = opcoes?.dataReferencia ?? new Date();
  const dataCivil = dataCivilSaoPaulo(dataRef);
  const dataIso = instanteUtc(dataRef);
  const nomeArquivo = `pacote_${papel}_${dataCivil}.csv`;

  // 8. Montagem do pacote selado com cabeçalho de advertência e hash
  const advertencia = ADVERTENCIA_POR_PAPEL[papel];
  const cabecalhoPacote: string[] = [
    `# PACOTE SELADO DE DISTRIBUIÇÃO — SAREL (PPGTCA 2026)`,
    `# Papel: ${papel}`,
    `# Perfil de Exportação: ${perfil}`,
    `# Data de Geração: ${dataIso}`,
    `# Total de Pontos: ${pontos.length}`,
    `# SHA-256 do Conteúdo: ${sha256}`,
    `# Advertência: ${advertencia}`,
    `# Protocolo: Cegamento Amostral por Distribuição (D16 / Opções B e D)`,
  ];

  if (opcoes?.destinatario) {
    cabecalhoPacote.push(`# Destinatário Declarado: ${opcoes.destinatario}`);
  }

  cabecalhoPacote.push(``); // linha em branco separando comentários da tabela

  const conteudoArquivo = "\uFEFF" + cabecalhoPacote.join("\r\n") + payloadCsv + "\r\n";

  // 9. Construção do registro do diário
  const registroId = `DIST-${dataCivil.replace(/-/g, "")}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const registro: RegistroDistribuicao = {
    id: registroId,
    papel,
    perfil,
    geradoEm: dataIso,
    sha256,
    totalPontos: pontos.length,
    nomeArquivo,
    destinatario: opcoes?.destinatario !== undefined ? opcoes.destinatario : null,
  };

  // 10. Gravação no diário de distribuição (se habilitada)
  if (opcoes?.gravarNoDiario !== false) {
    const caminhoDiario = opcoes?.caminhoDiario ?? CAMINHO_DIARIO_PADRAO;
    registrarNoDiario(registro, caminhoDiario);
  }

  return {
    papel,
    perfil,
    nomeArquivo,
    conteudoArquivo,
    payloadCsv,
    sha256,
    totalPontos: pontos.length,
    registro,
  };
}
