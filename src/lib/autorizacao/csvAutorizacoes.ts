/**
 * ============================================================================
 * Ingestão do log de autorizações a partir de planilha CSV — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * O QUÊ: lê o CSV preenchido por quem solicita as autorizações, converte cada linha
 * em `RegistroAutorizacao` e delega a validação a `logRecusas.ts`. Linha incompleta é
 * REJEITADA com causa legível; nenhuma lacuna é preenchida (Regra 1).
 *
 * POR QUÊ CSV: o pedido de autorização acontece por telefone, por aplicativo de
 * mensagem e em visita. A planilha funciona sem rede, aceita transcrição posterior de
 * anotação em papel e não depende de publicar formulário antes de começar a registrar.
 *
 * CAMPO VAZIO É AUSÊNCIA, NÃO VALOR: célula em branco vira `null` e segue para a
 * validação, que a rejeita onde o campo for obrigatório. Em nenhum ponto o vazio é
 * convertido em zero, em data de hoje ou em categoria padrão.
 */

import {
  RegistroAutorizacao,
  ResultadoIngestaoAutorizacoes,
  DesfechoAutorizacao,
  MotivoRecusa,
  ingestarRegistrosAutorizacao,
} from "./logRecusas";

/** Cabeçalho exigido, nesta ordem. O modelo preenchível vive em docs/modelos/. */
export const COLUNAS_CSV_AUTORIZACAO: readonly string[] = [
  "codigo_ponto",
  "estrato_id",
  "solicitado_em",
  "respondido_em",
  "desfecho",
  "motivo_recusa",
  "motivo_livre",
  "registrado_por",
  "autorizacao_id",
  "substituido_por",
] as const;

export class ErroCabecalhoCsv extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroCabecalhoCsv";
  }
}

/**
 * Divide uma linha de CSV respeitando aspas (RFC 4180): vírgula dentro de campo entre
 * aspas é conteúdo, e `""` dentro de campo entre aspas é uma aspa literal. Sem isso,
 * um motivo livre com vírgula desalinharia a linha inteira em silêncio.
 */
export function dividirLinhaCsv(linha: string): string[] {
  const campos: string[] = [];
  let atual = "";
  let entreAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (entreAspas) {
      if (c === '"') {
        if (linha[i + 1] === '"') {
          atual += '"';
          i++;
        } else {
          entreAspas = false;
        }
      } else {
        atual += c;
      }
    } else if (c === '"') {
      entreAspas = true;
    } else if (c === ",") {
      campos.push(atual);
      atual = "";
    } else {
      atual += c;
    }
  }
  campos.push(atual);
  return campos;
}

function ouNulo(valor: string | undefined): string | null {
  if (valor === undefined) return null;
  const limpo = valor.trim();
  return limpo.length === 0 ? null : limpo;
}

/**
 * Converte o conteúdo de um CSV em registros e os ingere.
 *
 * Lança `ErroCabecalhoCsv` quando o cabeçalho não confere — falha de cabeçalho é erro
 * do arquivo inteiro, não de uma linha, e seguir adiante produziria rejeição em massa
 * com causa enganosa.
 */
export function ingestarCsvAutorizacoes(conteudo: string): ResultadoIngestaoAutorizacoes {
  const linhas = conteudo
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  if (linhas.length === 0) {
    throw new ErroCabecalhoCsv("CSV vazio: nenhuma linha encontrada.");
  }

  const cabecalho = dividirLinhaCsv(linhas[0]).map((c) => c.trim().toLowerCase());
  const esperado = COLUNAS_CSV_AUTORIZACAO.join(",");
  if (cabecalho.join(",") !== esperado) {
    throw new ErroCabecalhoCsv(
      `Cabeçalho inesperado.\n  esperado: ${esperado}\n  recebido: ${cabecalho.join(",")}`
    );
  }

  const registros: Partial<RegistroAutorizacao>[] = [];
  for (const linha of linhas.slice(1)) {
    const c = dividirLinhaCsv(linha);
    const desfecho = ouNulo(c[4]);
    const motivo = ouNulo(c[5]);
    registros.push({
      codigoPonto: ouNulo(c[0]) ?? undefined,
      estratoId: ouNulo(c[1]) ?? undefined,
      solicitadoEm: ouNulo(c[2]) ?? undefined,
      respondidoEm: ouNulo(c[3]),
      desfecho: (desfecho ?? undefined) as DesfechoAutorizacao | undefined,
      motivoRecusa: (motivo ?? null) as MotivoRecusa | null,
      motivoLivre: ouNulo(c[6]),
      registradoPor: ouNulo(c[7]) ?? undefined,
      autorizacaoId: ouNulo(c[8]),
      substituidoPor: ouNulo(c[9]),
    });
  }

  return ingestarRegistrosAutorizacao(registros);
}
