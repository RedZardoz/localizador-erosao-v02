/**
 * ============================================================================
 * Blocos Espaciais e Variograma Empírico — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * FUNDAMENTAÇÃO CIENTÍFICA (PLANO V2, §3.4 E CORREÇÃO DO ACHADO I4):
 * Dados geoespaciais violam a hipótese de independência (IID). Validação cruzada
 * aleatória coloca vizinhos autocorrelacionados em treino e teste ao mesmo tempo,
 * inflando drasticamente as métricas de acurácia (Roberts et al., 2017; Ploton et al., 2020).
 *
 * PROCEDIMENTO RIGOROSO:
 * 1. O tamanho do bloco espacial NÃO é arbitrado; ele é derivado do alcance do
 *    variograma empírico das features primárias (declividade, solo nu).
 * 2. Se o variograma for inconclusivo (poucos pares), adota-se 20 km com registro
 *    explícito de que é provisório.
 */

export interface PontoGeo {
  latitude: number;
  longitude: number;
  valor: number;
}

export interface SemivariogramaBin {
  distanciaMediaKm: number;
  semivariancia: number;
  numPares: number;
}

export interface ResultadoVariograma {
  bins: SemivariogramaBin[];
  alcanceEstimadoKm: number;
  patamarEstimado: number;
  efeitoPepitaEstimado: number;
  ehConclusivo: boolean;
  arestaBlocoAdotadaKm: number;
  justificativaAresta: string;
}

/**
 * Distância Haversine entre duas coordenadas geográficas em km.
 */
export function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio médio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calcula o semivariograma empírico experimental:
 * gamma(h) = (1 / (2 * N(h))) * Sum ( (z(xi) - z(xj))^2 )
 */
export function calcularSemivariogramaEmpirico(
  pontos: PontoGeo[],
  tamanhoPassoKm: number = 2.0,
  distanciaMaximaKm: number = 40.0
): ResultadoVariograma {
  const n = pontos.length;
  if (n < 15) {
    return {
      bins: [],
      alcanceEstimadoKm: 20.0,
      patamarEstimado: 0,
      efeitoPepitaEstimado: 0,
      ehConclusivo: false,
      arestaBlocoAdotadaKm: 20.0,
      justificativaAresta: `Amostra insuficiente (n = ${n} < 15) para ajuste de variograma empírico. Adotado bloco padrão de 20 km provisório (Roberts et al., 2017).`,
    };
  }

  // Variância total da amostra
  const media = pontos.reduce((acc, p) => acc + p.valor, 0) / n;
  const varianciaTotal = pontos.reduce((acc, p) => acc + Math.pow(p.valor - media, 2), 0) / (n - 1);

  const numBins = Math.floor(distanciaMaximaKm / tamanhoPassoKm);
  const somaDiferencas: number[] = Array(numBins).fill(0);
  const contagemPares: number[] = Array(numBins).fill(0);
  const somaDistancias: number[] = Array(numBins).fill(0);

  // Varredura de todos os pares únicos
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = calcularDistanciaKm(pontos[i].latitude, pontos[i].longitude, pontos[j].latitude, pontos[j].longitude);
      if (d <= distanciaMaximaKm) {
        const binIdx = Math.floor(d / tamanhoPassoKm);
        if (binIdx < numBins) {
          const diffQuadrada = Math.pow(pontos[i].valor - pontos[j].valor, 2);
          somaDiferencas[binIdx] += diffQuadrada;
          contagemPares[binIdx] += 1;
          somaDistancias[binIdx] += d;
        }
      }
    }
  }

  const bins: SemivariogramaBin[] = [];
  let alcanceEstimado = 20.0;
  let concluiu = false;

  for (let b = 0; b < numBins; b++) {
    if (contagemPares[b] >= 5) {
      const semivar = somaDiferencas[b] / (2 * contagemPares[b]);
      const distMedia = Number((somaDistancias[b] / contagemPares[b]).toFixed(2));
      bins.push({
        distanciaMediaKm: distMedia,
        semivariancia: Number(semivar.toFixed(4)),
        numPares: contagemPares[b],
      });

      // Identifica alcance onde semivariância atinge ~95% da variância total
      if (!concluiu && semivar >= 0.95 * varianciaTotal) {
        alcanceEstimado = Math.max(10, Math.ceil(distMedia));
        concluiu = true;
      }
    }
  }

  const arestaAdotada = concluiu ? alcanceEstimado : 20.0;
  const justificativa = concluiu
    ? `Aresta de ${arestaAdotada} km adotada com base no alcance em que o semivariograma atinge o patamar (95% da variância total).`
    : `Semivariograma empírico sem patamar nítido (efeito pepita ou alcance superior a ${distanciaMaximaKm} km). Adotado bloco conservador de 20 km provisório.`;

  return {
    bins,
    alcanceEstimadoKm: arestaAdotada,
    patamarEstimado: Number(varianciaTotal.toFixed(4)),
    efeitoPepitaEstimado: bins.length > 0 ? bins[0].semivariancia : 0,
    ehConclusivo: concluiu,
    arestaBlocoAdotadaKm: arestaAdotada,
    justificativaAresta: justificativa,
  };
}

/**
 * Atribui o identificador de bloco espacial regular (ex.: "BLOCO_R03_C05")
 * a um ponto geográfico, garantindo separação espacial rigorosa para validação cruzada.
 */
export function atribuirBlocoEspacial(
  lat: number,
  lng: number,
  arestaKm: number = 20.0,
  origemLat: number = -26.5, // Sul do Paraná como âncora
  origemLng: number = -54.5  // Oeste do Paraná como âncora
): string {
  // 1 grau de latitude ≈ 111.13 km
  const kmPorGrauLat = 111.13;
  // 1 grau de longitude no Paraná (~25°S) ≈ 111.13 * cos(25°) ≈ 100.7 km
  const kmPorGrauLng = 111.13 * Math.cos((-25.5 * Math.PI) / 180);

  const deltaLatKm = (lat - origemLat) * kmPorGrauLat;
  const deltaLngKm = (lng - origemLng) * kmPorGrauLng;

  const row = Math.floor(Math.abs(deltaLatKm) / arestaKm);
  const col = Math.floor(Math.abs(deltaLngKm) / arestaKm);

  return `BLOCO_R${String(row).padStart(2, "0")}_C${String(col).padStart(2, "0")}`;
}
