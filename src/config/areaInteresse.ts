/**
 * ============================================================================
 * Configuração Paramétrica de Área de Interesse e Separação de Parâmetros (J4)
 * SAREL v2.0 — Disciplina Pericial PPGTCA 2026
 * ============================================================================
 *
 * Separação formal entre:
 * 1. O MÉTODO (Invariante): Validação por RUSLE, protocolo cego, amostragem balanceada
 *    por matriz fatorial S^ x E^ x K^, restrições EPV >= 20, guarda anti-leakage de 2 anos.
 * 2. OS PARÂMETROS DO ESTUDO: Recorte geográfico, limiares de tercil, cartas pedológicas locais,
 *    e envelope de coordenadas da Bacia Hidrográfica do Rio Paraná 3 (BP3).
 */

export interface ParametrosAreaInteresse {
  id: string;
  nome: string;
  sigla: string;
  descricao: string;
  rotuloEstudo: string; // Rótulo visual que explicita que o valor é específico deste estudo
  centro: { lat: number; lng: number };
  zoomPadrao: number;
  pitchPadrao: number;
  bearingPadrao: number;
  envelope: {
    latMin: number;
    latMax: number;
    lonMin: number;
    lonMax: number;
  };
  totalMunicipios: number;
  distorcaoProjecaoUtmMaxPct: number;
  areaAproximadaKm2: number;
  codigoBaciaIat: string;
  municipioReferenciaVant: string;
  coordenadasReferenciaDemonstracao: {
    lat: number;
    lng: number;
  };
}

/**
 * Instância Canônica do Estudo: Bacia do Rio Paraná 3 (BP3 - Oeste do Paraná)
 */
export const AREA_INTERESSE_BP3: ParametrosAreaInteresse = {
  id: "BP3",
  nome: "Bacia Hidrográfica do Rio Paraná 3",
  sigla: "BP3",
  descricao: "Bacia Hidrográfica do Rio Paraná 3 — Região Oeste do Paraná (Estudo PPGTCA 2026)",
  rotuloEstudo: "Parâmetro específico desta bacia (BP3 / Oeste do Paraná)",
  centro: { lat: -24.85, lng: -54.05 },
  zoomPadrao: 8.1,
  pitchPadrao: 35,
  bearingPadrao: 0,
  envelope: {
    latMin: -25.65,
    latMax: -24.00,
    lonMin: -54.65,
    lonMax: -53.35,
  },
  totalMunicipios: 28,
  distorcaoProjecaoUtmMaxPct: 0.11, // Extremo oeste UTM 22S medido em 0,11% (< 0,5% tolerância D15)
  areaAproximadaKm2: 8000,
  codigoBaciaIat: "BP3",
  municipioReferenciaVant: "Céu Azul / Medianeira",
  coordenadasReferenciaDemonstracao: {
    lat: -25.2985,
    lng: -54.0208,
  },
};

/**
 * Área ativa configurada para a aplicação (BP3 como padrão canônico)
 */
export const AREA_INTERESSE_PADRAO: ParametrosAreaInteresse = AREA_INTERESSE_BP3;
