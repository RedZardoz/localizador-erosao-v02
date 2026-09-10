/**
 * ============================================================================
 * Thinning Espacial Geodésico Determinístico — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * FUNDAMENTAÇÃO (PLANEJAMENTO V3, §7.2; PROMPT §10.3):
 * - Garante que os pontos candidatos mantenham espaçamento geodésico mínimo (P02 = 1.0 km),
 *   evitando agrupamento (clustering) excessivo sobre a mesma vertente ou talhão.
 * - Elimina formalmente a ordenação por "priorityScore" ou severidade do legado.
 * - Ordenação interna: embaralhamento determinístico baseado na semente da amostragem (P07),
 *   garantindo amostragem aleatória estratificada pura e reprodutibilidade estrita.
 */

export interface CandidatoEspacial {
  id: string;
  latitude: number;
  longitude: number;
}

const RAIO_TERRA_METROS = 6371000;

/**
 * Calcula a distância geodésica entre duas coordenadas pelo método de Haversine (em metros).
 */
export function distanciaHaversineMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return RAIO_TERRA_METROS * c;
}

/**
 * Gerador pseudo-aleatório determinístico Linear Congruential Generator (LCG)
 * derivado da semente P07. Retorna número em [0, 1).
 */
export function criarGeradorPseudoAleatorio(semente: number): () => number {
  let s = Math.abs(Math.floor(semente)) % 2147483647;
  if (s === 0) s = 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Embaralha um array de forma determinística utilizando Fisher-Yates com a semente registrada (P07).
 */
export function embaralharDeterminista<T>(itens: T[], semente: number): T[] {
  const copia = [...itens];
  const rng = criarGeradorPseudoAleatorio(semente);
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = copia[i];
    copia[i] = copia[j];
    copia[j] = temp;
  }
  return copia;
}

/**
 * Executa o thinning espacial determinístico garantindo distância mínima geodésica.
 * @param candidatos Lista de candidatos do estrato
 * @param espacamentoMinimoMetros Distância mínima em metros (P02, padrão 1000m = 1km)
 * @param semente Semente aleatória registrada da amostragem (P07)
 * @param metaPontos Quantidade máxima de pontos a aceitar
 */
export function aplicarThinningDeterminista<T extends CandidatoEspacial>(
  candidatos: T[],
  espacamentoMinimoMetros: number,
  semente: number,
  metaPontos?: number
): T[] {
  if (!candidatos || candidatos.length === 0) {
    return [];
  }

  if (espacamentoMinimoMetros <= 0) {
    const ordenados = embaralharDeterminista(candidatos, semente);
    return metaPontos !== undefined ? ordenados.slice(0, metaPontos) : ordenados;
  }

  // Embaralha com semente P07 para garantir amostragem aleatória imparcial dentro do estrato
  const candidatosEmbaralhados = embaralharDeterminista(candidatos, semente);
  const aceitos: T[] = [];

  for (const c of candidatosEmbaralhados) {
    if (!Number.isFinite(c.latitude) || !Number.isFinite(c.longitude)) {
      continue;
    }

    let espacamentoRespeitado = true;
    for (const aceito of aceitos) {
      const dist = distanciaHaversineMetros(
        c.latitude,
        c.longitude,
        aceito.latitude,
        aceito.longitude
      );

      if (dist < espacamentoMinimoMetros) {
        espacamentoRespeitado = false;
        break;
      }
    }

    if (espacamentoRespeitado) {
      aceitos.push(c);
      if (metaPontos !== undefined && aceitos.length >= metaPontos) {
        break;
      }
    }
  }

  return aceitos;
}
