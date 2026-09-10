/**
 * ============================================================================
 * Base Territorial Oficial das Unidades Federativas do Brasil (IBGE)
 * SAREL — PPGTCA 2026
 * ============================================================================
 */

export interface EstadoBrasil {
  id: number;
  sigla: string;
  nome: string;
  regiao: string;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

export const ESTADOS_BRASIL: EstadoBrasil[] = [
  { id: 12, sigla: "AC", nome: "Acre", regiao: "Norte", bbox: [-73.99, -11.14, -66.62, -7.11] },
  { id: 27, sigla: "AL", nome: "Alagoas", regiao: "Nordeste", bbox: [-38.24, -10.50, -35.15, -8.81] },
  { id: 16, sigla: "AP", nome: "Amapá", regiao: "Norte", bbox: [-54.88, -1.24, -49.88, 4.44] },
  { id: 13, sigla: "AM", nome: "Amazonas", regiao: "Norte", bbox: [-73.80, -9.82, -56.10, 2.25] },
  { id: 29, sigla: "BA", nome: "Bahia", regiao: "Nordeste", bbox: [-46.62, -18.35, -37.34, -8.53] },
  { id: 23, sigla: "CE", nome: "Ceará", regiao: "Nordeste", bbox: [-41.42, -7.86, -37.25, -2.78] },
  { id: 53, sigla: "DF", nome: "Distrito Federal", regiao: "Centro-Oeste", bbox: [-48.29, -16.05, -47.31, -15.50] },
  { id: 32, sigla: "ES", nome: "Espírito Santo", regiao: "Sudeste", bbox: [-41.88, -21.31, -39.67, -17.89] },
  { id: 52, sigla: "GO", nome: "Goiás", regiao: "Centro-Oeste", bbox: [-53.25, -19.50, -45.91, -12.40] },
  { id: 21, sigla: "MA", nome: "Maranhão", regiao: "Nordeste", bbox: [-48.76, -10.26, -41.80, -1.05] },
  { id: 51, sigla: "MT", nome: "Mato Grosso", regiao: "Centro-Oeste", bbox: [-61.63, -17.89, -50.22, -7.35] },
  { id: 50, sigla: "MS", nome: "Mato Grosso do Sul", regiao: "Centro-Oeste", bbox: [-58.17, -24.07, -50.92, -17.17] },
  { id: 31, sigla: "MG", nome: "Minas Gerais", regiao: "Sudeste", bbox: [-51.05, -22.92, -39.86, -14.23] },
  { id: 15, sigla: "PA", nome: "Pará", regiao: "Norte", bbox: [-58.90, -9.84, -46.06, 2.59] },
  { id: 25, sigla: "PB", nome: "Paraíba", regiao: "Nordeste", bbox: [-38.77, -8.30, -34.79, -6.03] },
  { id: 41, sigla: "PR", nome: "Paraná", regiao: "Sul", bbox: [-54.62, -26.72, -48.02, -22.51] },
  { id: 26, sigla: "PE", nome: "Pernambuco", regiao: "Nordeste", bbox: [-41.36, -9.48, -34.82, -7.14] },
  { id: 22, sigla: "PI", nome: "Piauí", regiao: "Nordeste", bbox: [-45.99, -10.93, -40.37, -2.75] },
  { id: 33, sigla: "RJ", nome: "Rio de Janeiro", regiao: "Sudeste", bbox: [-44.89, -23.37, -40.96, -20.76] },
  { id: 24, sigla: "RN", nome: "Rio Grande do Norte", regiao: "Nordeste", bbox: [-38.58, -6.98, -34.97, -4.83] },
  { id: 43, sigla: "RS", nome: "Rio Grande do Sul", regiao: "Sul", bbox: [-57.65, -33.75, -49.69, -27.08] },
  { id: 11, sigla: "RO", nome: "Rondônia", regiao: "Norte", bbox: [-66.62, -13.69, -59.77, -7.97] },
  { id: 14, sigla: "RR", nome: "Roraima", regiao: "Norte", bbox: [-64.83, -1.58, -58.89, 5.27] },
  { id: 42, sigla: "SC", nome: "Santa Catarina", regiao: "Sul", bbox: [-53.84, -29.35, -48.36, -25.96] },
  { id: 35, sigla: "SP", nome: "São Paulo", regiao: "Sudeste", bbox: [-53.11, -25.31, -44.16, -19.78] },
  { id: 28, sigla: "SE", nome: "Sergipe", regiao: "Nordeste", bbox: [-38.25, -11.57, -36.39, -9.52] },
  { id: 17, sigla: "TO", nome: "Tocantins", regiao: "Norte", bbox: [-50.74, -13.47, -45.69, -5.17] },
];

export function obterEstadoPorSigla(sigla: string): EstadoBrasil | undefined {
  return ESTADOS_BRASIL.find((e) => e.sigla.toUpperCase() === sigla.toUpperCase());
}

export function obterEstadoPorId(id: number | string): EstadoBrasil | undefined {
  return ESTADOS_BRASIL.find((e) => e.id === Number(id));
}
