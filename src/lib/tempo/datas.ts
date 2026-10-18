/**
 * Utilitário canônico de data e hora para o SAREL (PPGTCA 2026).
 *
 * dataCivilSaoPaulo: Retorna a data no formato AAAA-MM-DD no fuso horário
 * civil da área de estudo e do pesquisador ("America/Sao_Paulo", UTC-3),
 * evitando deslocamento de 1 dia para a frente em consultas realizadas
 * após as 21:00 BRT (00:00 UTC).
 *
 * instanteUtc: Retorna o instante exato em formato ISO-8601 em UTC.
 */

export function dataCivilSaoPaulo(d: Date = new Date()): string {
  // en-CA produz nativamente o padrão ISO YYYY-MM-DD no fuso solicitado
  const formatador = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatador.format(d);
}

export function instanteUtc(d: Date = new Date()): string {
  return d.toISOString();
}
