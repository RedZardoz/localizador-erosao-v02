/**
 * Converte coordenadas decimais em formato DMS (Graus, Minutos e Segundos com hemisfério),
 * tratando com precisão o rollover de 60.0" e derivando do mesmo número arredondado a 6 casas.
 */
export function formatToDMS(coordinate: number, isLatitude: boolean): string {
  // Arredonda primeiro na mesma precisão decimal (6 casas)
  const rounded = Number(coordinate.toFixed(6));
  const absolute = Math.abs(rounded);

  let degrees = Math.floor(absolute);
  const minutesTotal = (absolute - degrees) * 60;
  let minutes = Math.floor(minutesTotal);
  let seconds = Number(((minutesTotal - minutes) * 60).toFixed(1));

  // Tratar rollover: 59.95" -> toFixed(1) = 60.0"
  if (seconds >= 60.0) {
    seconds = 0.0;
    minutes += 1;
  }
  if (minutes >= 60) {
    minutes = 0;
    degrees += 1;
  }

  const direction = isLatitude ? (rounded >= 0 ? "N" : "S") : rounded >= 0 ? "E" : "W";

  return `${degrees}° ${minutes}' ${seconds.toFixed(1)}" ${direction}`;
}
