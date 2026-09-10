/**
 * ============================================================================
 * Utilitários Geográficos e Conversão Decimal / DMS — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * CORRIGE OS ACHADOS M3 E M4 DA AUDITORIA:
 * 1. Ambas as representações (decimal e DMS) derivam do MESMO número arredondado (6 casas decimais).
 * 2. Tratamento estrito de rollover de 60.0" nos segundos e minutos.
 */

import { PontoAmostral } from "@/types/ponto";
import { assegurarApenasPontosReais } from "@/lib/seguranca/guardaSintetico";
import { valorOuNulo } from "@/types/proveniencia";

export interface CoordenadaSincronizada {
  decimal: number;
  dms: string;
}

/**
 * Converte um valor decimal em graus para string DMS formatada com rollover rigoroso.
 */
export function converterParaDMS(grausDecimais: number, tipo: "lat" | "lng"): string {
  // 1. Ambas representações devem derivar do número arredondado a 6 casas decimais
  const coordArredondada = Number(grausDecimais.toFixed(6));
  const hemisferio = tipo === "lat" ? (coordArredondada >= 0 ? "N" : "S") : (coordArredondada >= 0 ? "E" : "W");
  const absCoord = Math.abs(coordArredondada);

  let graus = Math.floor(absCoord);
  const restoMinutos = (absCoord - graus) * 60;
  let minutos = Math.floor(restoMinutos);
  let segundos = Number(((restoMinutos - minutos) * 60).toFixed(1));

  // Tratamento de rollover de 60.0"
  if (segundos >= 59.95) {
    segundos = 0;
    minutos += 1;
  }
  if (minutos >= 60) {
    minutos = 0;
    graus += 1;
  }

  const segFormatado = segundos.toFixed(1);
  return `${graus}° ${minutos}' ${segFormatado}" ${hemisferio}`;
}

/**
 * Cria par de coordenadas estritamente sincronizadas (decimal e DMS).
 */
export function sincronizarCoordenada(valorOriginal: number, tipo: "lat" | "lng"): CoordenadaSincronizada {
  const decimal = Number(valorOriginal.toFixed(6));
  const dms = converterParaDMS(decimal, tipo);
  return { decimal, dms };
}

/**
 * Converte a lista de pontos amostrais em FeatureCollection GeoJSON válida.
 * Aciona obrigatoriamente a Guarda Antissintético antes da conversão.
 */
export function pontosParaGeoJSON(pontos: PontoAmostral[]) {
  assegurarApenasPontosReais(pontos, "geração de GeoJSON");
  return {
    type: "FeatureCollection",
    features: pontos.map((p) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [p.longitude, p.latitude],
      },
      properties: {
        codigo: p.codigo,
        estratoId: p.estratoId,
        blocoEspacial: p.blocoEspacial,
        elevacao: valorOuNulo(p.terreno?.elevacao),
        declividadePct: valorOuNulo(p.terreno?.declividadePct),
        soloOrdem: valorOuNulo(p.solo?.ordem),
        frequenciaSoloNu: valorOuNulo(p.serie?.frequenciaSoloNu),
        precipAcum30d: valorOuNulo(p.chuva?.precipAcum30d),
        codigoCar: p.fundiario?.codigoCar,
        denominacao: p.fundiario?.denominacao,
        titularMascarado: p.fundiario?.titularMascarado,
        areaImovelHa: p.fundiario?.areaImovelHa,
      },
    })),
  };
}

