/**
 * ============================================================================
 * Diário de Requisições de Rede para Artefatos de Medição (Guarda Estrutural F5)
 * SAREL v2.0 — Disciplina Pericial PPGTCA 2026
 * ============================================================================
 *
 * REGRA INVIOLÁVEL:
 * Toda medição que dependa de serviço externo (Google Earth Engine, Embrapa WFS,
 * Planet NICFI, etc.) deve registrar, ao lado do artefato produzido, um diário
 * com as chamadas de rede efetivamente realizadas:
 * - timestamp ISO
 * - endpoint acessado (sem parâmetros sensíveis de chave)
 * - método HTTP (GET/POST)
 * - quantidade de itens/candidatos solicitados na chamada
 * - tamanho em bytes da resposta recebida
 * - código de status HTTP retornado (ex: 200)
 * - duração em milissegundos
 *
 * ARTEFATO DE MEDIÇÃO EXTERNA SEM DIÁRIO CORRESPONDENTE É COMPULSORIAMENTE INVÁLIDO.
 * O diário NÃO deve conter credenciais, tokens, chaves nem respostas brutas.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface EntradaDiarioRequisicao {
  timestampIso: string;
  servico: "GEE" | "EMBRAPA_WFS" | "COPERNICUS" | "PLANET" | "CHIRPS_UCSB" | "OUTRO";
  endpoint: string;
  metodoHttp: "GET" | "POST";
  quantidadeItens: number;
  tamanhoRespostaBytes: number;
  codigoHttp: number;
  duracaoMs: number;
  detalhe?: string;
}

export interface DiarioRequisicoes {
  versao: "1.0";
  artefatoAlvo: string;
  criadoEm: string;
  atualizadoEm: string;
  totalChamadas: number;
  totalItensProcessados: number;
  totalBytesRecebidos: number;
  chamadas: EntradaDiarioRequisicao[];
}

export interface ResultadoValidacaoDiario {
  valido: boolean;
  artefato: string;
  diarioEncontrado: boolean;
  totalItensArtefato: number;
  totalItensDiario: number;
  inconsistencias: string[];
}

/**
 * Cria uma nova estrutura em memória de diário de requisições vinculada a um artefato.
 */
export function criarDiarioRequisicoes(artefatoAlvo: string): DiarioRequisicoes {
  const agora = new Date().toISOString();
  return {
    versao: "1.0",
    artefatoAlvo,
    criadoEm: agora,
    atualizadoEm: agora,
    totalChamadas: 0,
    totalItensProcessados: 0,
    totalBytesRecebidos: 0,
    chamadas: [],
  };
}

/**
 * Registra uma chamada de rede no diário, sanitizando eventuais tokens no endpoint.
 */
export function registrarChamadaDiario(
  diario: DiarioRequisicoes,
  entrada: EntradaDiarioRequisicao
): void {
  // Higieniza endpoint removendo credenciais em query string se houver
  const endpointSanitizado = entrada.endpoint
    .replace(/(api_key|token|key|keyId|secret)=[^&]+/gi, "$1=REDACTED");

  diario.chamadas.push({
    ...entrada,
    endpoint: endpointSanitizado,
  });

  diario.totalChamadas = diario.chamadas.length;
  diario.totalItensProcessados += entrada.quantidadeItens;
  diario.totalBytesRecebidos += entrada.tamanhoRespostaBytes;
  diario.atualizadoEm = new Date().toISOString();
}

/**
 * Salva o diário de requisições no disco em formato JSON auditável.
 */
export function salvarDiarioRequisicoes(
  diario: DiarioRequisicoes,
  caminhoArquivo: string
): void {
  const dir = path.dirname(caminhoArquivo);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(caminhoArquivo, JSON.stringify(diario, null, 2), "utf8");
}

/**
 * Carrega um diário de requisições do disco. Retorna null se não existir ou for inválido.
 */
export function carregarDiarioRequisicoes(caminhoArquivo: string): DiarioRequisicoes | null {
  if (!fs.existsSync(caminhoArquivo)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(caminhoArquivo, "utf8");
    const parsed = JSON.parse(raw) as DiarioRequisicoes;
    if (parsed.versao !== "1.0" || !Array.isArray(parsed.chamadas)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Obtém o caminho padrão esperado para o diário de um determinado artefato.
 * Ex: `docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json`
 *  -> `docs/verificacoes/diario_requisicoes_remedicao_bp3_2026-09-30.json`
 */
export function obterCaminhoDiarioParaArtefato(caminhoArtefato: string): string {
  const dir = path.dirname(caminhoArtefato);
  const base = path.basename(caminhoArtefato, path.extname(caminhoArtefato));
  return path.join(dir, `diario_${base}.json`);
}

/**
 * Valida a compatibilidade formal entre um artefato de medição e seu diário de requisições.
 *
 * Regras:
 * 1. Se o artefato declara medição externa ativa (ex: GEE ou WFS medido com N itens),
 *    o diário DEVE existir.
 * 2. O total de itens requisitados nas chamadas com código HTTP 200 no diário
 *    deve ser maior ou igual ao total de itens que o artefato afirma ter medido via rede.
 * 3. O diário não pode conter tokens ou chaves privadas nos endpoints.
 */
export function validarArtefatoComDiario(
  caminhoArtefato: string,
  caminhoDiarioPersonalizado?: string
): ResultadoValidacaoDiario {
  const inconsistencias: string[] = [];

  if (!fs.existsSync(caminhoArtefato)) {
    return {
      valido: false,
      artefato: caminhoArtefato,
      diarioEncontrado: false,
      totalItensArtefato: 0,
      totalItensDiario: 0,
      inconsistencias: [`Artefato não encontrado: ${caminhoArtefato}`],
    };
  }

  let conteudoArtefato: any;
  try {
    conteudoArtefato = JSON.parse(fs.readFileSync(caminhoArtefato, "utf8"));
  } catch (err: any) {
    return {
      valido: false,
      artefato: caminhoArtefato,
      diarioEncontrado: false,
      totalItensArtefato: 0,
      totalItensDiario: 0,
      inconsistencias: [`Falha ao ler JSON do artefato: ${err.message}`],
    };
  }

  // Identifica se o artefato afirma ter medições externas reais
  // e quantos itens afirma ter medido via rede externa
  let exigeDiario = false;
  let itensMedidosExternamente = 0;
  let caminhoDiarioReferenciado: string | undefined = conteudoArtefato.diarioRequisicoes;

  // Checa declarações de dimensões medidas
  if (conteudoArtefato.dimensoesMedidas) {
    for (const [dim, info] of Object.entries<any>(conteudoArtefato.dimensoesMedidas)) {
      if (info?.estado === "medido" && info?.fonteExterna === true) {
        exigeDiario = true;
        const total = typeof info.totalItens === "number" ? info.totalItens : 0;
        itensMedidosExternamente += total;
      }
    }
  }

  // Checa se o artefato possui métricas GEE com requisições HTTP declaradas > 0
  if (conteudoArtefato.metricasGeeLote && typeof conteudoArtefato.metricasGeeLote.requisicoesHttp === "number") {
    if (conteudoArtefato.metricasGeeLote.requisicoesHttp > 0) {
      exigeDiario = true;
      const nPed = conteudoArtefato.funilContagem?.candidatosValidosPedologia;
      const nTer = conteudoArtefato.funilContagem?.candidatosComTerrenoD07;
      const nEstimado = typeof nPed === "number" ? nPed : (typeof nTer === "number" ? nTer : 0);
      itensMedidosExternamente = Math.max(itensMedidosExternamente, nEstimado);
    }
  }

  // Se o artefato declara Ê medido mas sem requisições HTTP, é anomalia estrutural
  if (
    conteudoArtefato.estratosK2Medidos &&
    Object.keys(conteudoArtefato.estratosK2Medidos).length > 0 &&
    (!conteudoArtefato.metricasGeeLote || conteudoArtefato.metricasGeeLote.requisicoesHttp === 0) &&
    conteudoArtefato.dimensoesMedidas?.E?.estado === "medido"
  ) {
    inconsistencias.push(
      "O artefato afirma possuir estratos K2 com Ê medido, mas registra 0 requisições HTTP e nenhum diário de rede."
    );
  }

  // Se o artefato não exige diário (ex: medição declarada como indisponível ou 100% local), validação concluída
  if (!exigeDiario && !caminhoDiarioReferenciado && !caminhoDiarioPersonalizado) {
    return {
      valido: inconsistencias.length === 0,
      artefato: caminhoArtefato,
      diarioEncontrado: false,
      totalItensArtefato: 0,
      totalItensDiario: 0,
      inconsistencias,
    };
  }

  const caminhoDiarioFinal =
    caminhoDiarioPersonalizado ||
    (caminhoDiarioReferenciado ? path.resolve(process.cwd(), caminhoDiarioReferenciado) : null) ||
    obterCaminhoDiarioParaArtefato(caminhoArtefato);

  const diario = carregarDiarioRequisicoes(caminhoDiarioFinal);
  if (!diario) {
    inconsistencias.push(
      `Artefato requer diário de rede comprobatório, mas o arquivo de diário não foi encontrado em: ${caminhoDiarioFinal}`
    );
    return {
      valido: false,
      artefato: caminhoArtefato,
      diarioEncontrado: false,
      totalItensArtefato: itensMedidosExternamente,
      totalItensDiario: 0,
      inconsistencias,
    };
  }

  // Verifica chamadas com sucesso HTTP 200
  const chamadasOk = diario.chamadas.filter((ch) => ch.codigoHttp >= 200 && ch.codigoHttp < 300);
  const totalItensDiario = chamadasOk.reduce((acc, ch) => acc + ch.quantidadeItens, 0);

  if (totalItensDiario < itensMedidosExternamente) {
    inconsistencias.push(
      `Incompatibilidade de itens: o artefato afirma medir ${itensMedidosExternamente} itens via rede externa, mas o diário registra apenas ${totalItensDiario} itens em chamadas com status 2xx.`
    );
  }

  // Checa vazamento de credenciais no diário
  for (const ch of diario.chamadas) {
    if (/AIzaSy|Bearer\s+ey|PLAK|-----BEGIN/i.test(ch.endpoint)) {
      inconsistencias.push(`Credencial detectada no endpoint registrado no diário: ${ch.endpoint}`);
    }
  }

  return {
    valido: inconsistencias.length === 0,
    artefato: caminhoArtefato,
    diarioEncontrado: true,
    totalItensArtefato: itensMedidosExternamente,
    totalItensDiario,
    inconsistencias,
  };
}
