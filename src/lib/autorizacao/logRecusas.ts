/**
 * ============================================================================
 * Log de Autorizações e Recusas de Acesso — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * O QUÊ ESTE MÓDULO FAZ:
 * - Registra o desfecho de cada pedido de autorização de acesso a imóvel sorteado,
 *   com estrato (D12), data e motivo, e recusa gravar registro incompleto.
 * - Produz a prestação de contas da amostra por estrato: planejados, autorizados,
 *   recusados, sem resposta, pendentes, substituições e taxa de recusa.
 *
 * POR QUÊ ESTE MÓDULO EXISTE (viés de atrito):
 *   A recusa de autorização NÃO é aleatória. É plausível que o proprietário de área
 *   degradada recuse mais do que o de área conservada — receio de fiscalização, de
 *   embargo ou do uso dos dados. Se as recusas não forem registradas por estrato, a
 *   amostra efetivamente visitada fica enviesada para a terra conservada, atenuando
 *   exatamente o sinal que o modelo deveria aprender, e esse viés desaparece sem
 *   deixar rastro. Registrar a recusa é o que torna o atrito mensurável e declarável.
 *
 * POR QUÊ ELE NÃO CONTÉM NENHUM DADO PESSOAL:
 *   O log chaveia por `codigoPonto` (o código cego do sorteio) e `estratoId`. Não há
 *   CAR, titular, documento nem coordenada. A associação entre código e imóvel vive
 *   apenas com quem solicita as autorizações, na tabela reversa de cegamento. Por
 *   isso este log pode entrar na prestação de contas da amostra, e ser publicado com
 *   a dissertação, sem expor o proprietário (LGPD, Art. 7º IV).
 *
 * CONFORMIDADE:
 * - Regra 1: nenhum campo recebe valor por omissão. Registro sem motivo, sem data ou
 *   sem desfecho é REJEITADO com causa, nunca preenchido.
 * - Regra 2: taxa de recusa sem denominador é `null`, nunca 0 — mesma convenção do
 *   Kappa sem pares (Achado S1-13).
 * - Regra 4: nada aqui é rótulo nem preditor. É contabilidade de acesso.
 */

import { TODOS_ESTRATOS_D12 } from "@/lib/gee/estratificacao";

/** Desfecho do pedido de autorização. "pendente" é pedido feito ainda sem resposta. */
export type DesfechoAutorizacao =
  | "autorizada"
  | "recusada"
  | "sem-resposta"
  | "contato-nao-localizado"
  | "imovel-inacessivel"
  | "pendente";

/**
 * Motivo declarado da recusa. "sem-motivo-declarado" (o proprietário recusou e não
 * disse por quê) é categoria distinta de "outro" (disse, e não cabe nas demais).
 * Confundir as duas apagaria informação sobre o atrito.
 */
export type MotivoRecusa =
  | "receio-fiscalizacao"
  | "receio-uso-dos-dados"
  | "nao-e-o-proprietario"
  | "arrendatario-sem-poderes"
  | "indisponibilidade-de-agenda"
  | "sem-motivo-declarado"
  | "outro";

export interface RegistroAutorizacao {
  /** Código cego do ponto/polígono sorteado. NUNCA o código CAR. */
  codigoPonto: string;
  /** Estrato de D12 ao qual o ponto pertence (ex.: "E_2_3_1"). */
  estratoId: string;
  /** AAAA-MM-DD do pedido. */
  solicitadoEm: string;
  /** AAAA-MM-DD da resposta; null somente quando o desfecho é "pendente". */
  respondidoEm: string | null;
  desfecho: DesfechoAutorizacao;
  /** Obrigatório quando o desfecho é "recusada"; proibido nos demais. */
  motivoRecusa: MotivoRecusa | null;
  /** Obrigatório quando o motivo é "outro"; texto livre do que foi declarado. */
  motivoLivre: string | null;
  /** Quem registrou (bolsista responsável pelas autorizações). */
  registradoPor: string;
  /** Token da autorização concedida. Obrigatório quando o desfecho é "autorizada". */
  autorizacaoId: string | null;
  /** Código cego do ponto que entrou no lugar deste, quando houve substituição. */
  substituidoPor: string | null;
}

export interface RegistroRejeitado {
  registro: Partial<RegistroAutorizacao>;
  causa: string;
}

export interface ResultadoIngestaoAutorizacoes {
  aceitos: RegistroAutorizacao[];
  rejeitados: RegistroRejeitado[];
}

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

const DESFECHOS_VALIDOS: readonly DesfechoAutorizacao[] = [
  "autorizada",
  "recusada",
  "sem-resposta",
  "contato-nao-localizado",
  "imovel-inacessivel",
  "pendente",
];

const MOTIVOS_VALIDOS: readonly MotivoRecusa[] = [
  "receio-fiscalizacao",
  "receio-uso-dos-dados",
  "nao-e-o-proprietario",
  "arrendatario-sem-poderes",
  "indisponibilidade-de-agenda",
  "sem-motivo-declarado",
  "outro",
];

function textoPreenchido(valor: unknown): valor is string {
  return typeof valor === "string" && valor.trim().length > 0;
}

/**
 * Valida um registro isolado. Devolve a causa da rejeição, ou null se o registro
 * estiver íntegro. Nenhuma lacuna é preenchida: lacuna é rejeição (Regra 1).
 */
export function validarRegistroAutorizacao(
  r: Partial<RegistroAutorizacao>
): string | null {
  if (!textoPreenchido(r.codigoPonto)) {
    return "codigoPonto ausente: o registro não pode ser associado a um ponto sorteado.";
  }
  if (!textoPreenchido(r.estratoId)) {
    return "estratoId ausente: sem estrato não há como medir atrito diferencial.";
  }
  if (!TODOS_ESTRATOS_D12.includes(r.estratoId)) {
    return `estratoId "${r.estratoId}" não pertence aos 18 estratos de D12.`;
  }
  if (!textoPreenchido(r.registradoPor)) {
    return "registradoPor ausente: a prestação de contas exige autoria do registro.";
  }
  if (!textoPreenchido(r.solicitadoEm) || !FORMATO_DATA.test(r.solicitadoEm)) {
    return "solicitadoEm ausente ou fora do formato AAAA-MM-DD.";
  }
  if (!r.desfecho || !DESFECHOS_VALIDOS.includes(r.desfecho)) {
    return `desfecho ausente ou desconhecido: "${String(r.desfecho)}".`;
  }

  const pendente = r.desfecho === "pendente";
  if (pendente) {
    if (r.respondidoEm !== null && r.respondidoEm !== undefined) {
      return "desfecho 'pendente' não admite respondidoEm.";
    }
  } else {
    if (!textoPreenchido(r.respondidoEm) || !FORMATO_DATA.test(r.respondidoEm)) {
      return `desfecho "${r.desfecho}" exige respondidoEm em AAAA-MM-DD.`;
    }
    if (r.respondidoEm < r.solicitadoEm) {
      return "respondidoEm anterior a solicitadoEm.";
    }
  }

  if (r.desfecho === "recusada") {
    if (!r.motivoRecusa || !MOTIVOS_VALIDOS.includes(r.motivoRecusa)) {
      return "recusa sem motivo categorizado: use 'sem-motivo-declarado' quando o proprietário não declarar.";
    }
    if (r.motivoRecusa === "outro" && !textoPreenchido(r.motivoLivre)) {
      return "motivoRecusa 'outro' exige motivoLivre com o que foi declarado.";
    }
  } else if (r.motivoRecusa !== null && r.motivoRecusa !== undefined) {
    return `motivoRecusa só se aplica a recusa; desfecho é "${r.desfecho}".`;
  }

  if (r.desfecho === "autorizada" && !textoPreenchido(r.autorizacaoId)) {
    return "autorização concedida exige autorizacaoId (o token que a equipe de campo leva).";
  }
  if (r.desfecho !== "autorizada" && textoPreenchido(r.autorizacaoId)) {
    return `autorizacaoId só se aplica a autorização concedida; desfecho é "${r.desfecho}".`;
  }

  // Política de substituição (decidida pelo pesquisador em 20/10/2026): o ponto perdido
  // é reposto DENTRO DO MESMO ESTRATO. Logo, substituir só faz sentido onde o ponto foi
  // perdido — nunca em autorização concedida, nunca em pedido ainda pendente.
  if (textoPreenchido(r.substituidoPor)) {
    if (r.desfecho === "autorizada" || r.desfecho === "pendente") {
      return `substituidoPor não se aplica ao desfecho "${r.desfecho}": não há ponto perdido a repor.`;
    }
    if (r.substituidoPor === r.codigoPonto) {
      return "substituidoPor não pode apontar para o próprio ponto.";
    }
  }

  return null;
}

/** Ingere um lote, separando aceitos de rejeitados. Nunca corrige um registro. */
export function ingestarRegistrosAutorizacao(
  registros: Partial<RegistroAutorizacao>[]
): ResultadoIngestaoAutorizacoes {
  const aceitos: RegistroAutorizacao[] = [];
  const rejeitados: RegistroRejeitado[] = [];
  const codigosVistos = new Set<string>();

  for (const registro of registros) {
    const causa = validarRegistroAutorizacao(registro);
    if (causa !== null) {
      rejeitados.push({ registro, causa });
      continue;
    }
    const pronto = registro as RegistroAutorizacao;
    if (codigosVistos.has(pronto.codigoPonto)) {
      rejeitados.push({
        registro,
        causa: `codigoPonto "${pronto.codigoPonto}" duplicado no lote: um ponto tem um desfecho.`,
      });
      continue;
    }
    codigosVistos.add(pronto.codigoPonto);
    aceitos.push(pronto);
  }

  // Verificação de lote: a reposição tem de vir do MESMO estrato, senão a substituição
  // desequilibra o desenho de D12 em silêncio. Só é verificável quando o substituto
  // também está no lote; ausente, fica para a prestação de contas.
  const estratoPorCodigo = new Map(aceitos.map((a) => [a.codigoPonto, a.estratoId]));
  for (let i = aceitos.length - 1; i >= 0; i--) {
    const a = aceitos[i];
    if (!textoPreenchido(a.substituidoPor)) continue;
    const estratoSubstituto = estratoPorCodigo.get(a.substituidoPor);
    if (estratoSubstituto !== undefined && estratoSubstituto !== a.estratoId) {
      aceitos.splice(i, 1);
      rejeitados.push({
        registro: a,
        causa:
          `substituto "${a.substituidoPor}" está no estrato ${estratoSubstituto}, ` +
          `mas o ponto perdido está em ${a.estratoId}: a reposição deve ocorrer no mesmo estrato.`,
      });
    }
  }

  return { aceitos, rejeitados };
}

export interface PrestacaoContasEstrato {
  estratoId: string;
  planejados: number;
  autorizados: number;
  recusados: number;
  semResposta: number;
  contatoNaoLocalizado: number;
  imovelInacessivel: number;
  pendentes: number;
  substituicoes: number;
  /** recusados / (pedidos concluídos). `null` quando não há pedido concluído. */
  taxaRecusa: number | null;
}

export interface PrestacaoContasAmostra {
  porEstrato: PrestacaoContasEstrato[];
  totalPlanejado: number;
  totalAutorizado: number;
  /** Menor e maior taxa de recusa entre os estratos COM pedido concluído. */
  taxaRecusaMinima: number | null;
  taxaRecusaMaxima: number | null;
  /** Amplitude entre as duas. É o indício de atrito diferencial entre estratos. */
  amplitudeTaxaRecusa: number | null;
  /** Estratos planejados que ainda não têm nenhum pedido registrado. */
  estratosSemRegistro: string[];
}

/**
 * Prestação de contas da amostra por estrato.
 *
 * `planejadosPorEstrato` vem do desenho amostral (quantos pontos foram sorteados em
 * cada estrato). Estrato planejado sem nenhum registro aparece em `estratosSemRegistro`
 * em vez de ser contado como zero recusa — ausência de registro não é ausência de recusa.
 *
 * NÃO existe aqui limiar de alerta para a amplitude da taxa de recusa. Qual diferença
 * entre estratos passa a ser preocupante é decisão metodológica do pesquisador, não
 * constante de código (Regra 1). O módulo mede; quem julga é a pessoa.
 */
export function prestarContasAmostra(
  registros: RegistroAutorizacao[],
  planejadosPorEstrato: Record<string, number>
): PrestacaoContasAmostra {
  const estratos = new Set<string>([
    ...Object.keys(planejadosPorEstrato),
    ...registros.map((r) => r.estratoId),
  ]);

  const porEstrato: PrestacaoContasEstrato[] = [];
  const estratosSemRegistro: string[] = [];

  for (const estratoId of [...estratos].sort()) {
    const doEstrato = registros.filter((r) => r.estratoId === estratoId);
    const planejados = Object.prototype.hasOwnProperty.call(planejadosPorEstrato, estratoId)
      ? planejadosPorEstrato[estratoId]
      : 0;

    if (doEstrato.length === 0 && planejados > 0) {
      estratosSemRegistro.push(estratoId);
    }

    const conta = (d: DesfechoAutorizacao) => doEstrato.filter((r) => r.desfecho === d).length;
    const autorizados = conta("autorizada");
    const recusados = conta("recusada");
    const semResposta = conta("sem-resposta");
    const contatoNaoLocalizado = conta("contato-nao-localizado");
    const imovelInacessivel = conta("imovel-inacessivel");
    const pendentes = conta("pendente");
    const substituicoes = doEstrato.filter((r) => textoPreenchido(r.substituidoPor)).length;

    const concluidos = doEstrato.length - pendentes;
    const taxaRecusa = concluidos === 0 ? null : recusados / concluidos;

    porEstrato.push({
      estratoId,
      planejados,
      autorizados,
      recusados,
      semResposta,
      contatoNaoLocalizado,
      imovelInacessivel,
      pendentes,
      substituicoes,
      taxaRecusa,
    });
  }

  const taxas = porEstrato
    .map((e) => e.taxaRecusa)
    .filter((t): t is number => t !== null);

  const temTaxa = taxas.length > 0;
  const minima = temTaxa ? taxas.reduce((a, b) => (b < a ? b : a)) : null;
  const maxima = temTaxa ? taxas.reduce((a, b) => (b > a ? b : a)) : null;

  return {
    porEstrato,
    totalPlanejado: porEstrato.reduce((s, e) => s + e.planejados, 0),
    totalAutorizado: porEstrato.reduce((s, e) => s + e.autorizados, 0),
    taxaRecusaMinima: minima,
    taxaRecusaMaxima: maxima,
    amplitudeTaxaRecusa: minima !== null && maxima !== null ? maxima - minima : null,
    estratosSemRegistro,
  };
}
