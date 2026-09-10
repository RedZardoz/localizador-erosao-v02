/**
 * ============================================================================
 * Municípios Estratégicos do Paraná (IBGE) — SAREL (PPGTCA 2026)
 * ============================================================================
 */

export interface MunicipioPredefinido {
  nome: string;
  codigoIbge: string;
  areaKm2: number;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  regiao: string;
}

export const MUNICIPIOS_PARANA: MunicipioPredefinido[] = [
  { nome: 'Tibagi', codigoIbge: '4127007', areaKm2: 2951, bbox: [-50.75, -24.85, -50.15, -24.25], regiao: 'Campos Gerais / Bacia do Tibagi' },
  { nome: 'Londrina', codigoIbge: '4113700', areaKm2: 1650, bbox: [-51.35, -23.55, -50.95, -23.15], regiao: 'Norte Central' },
  { nome: 'Maringá', codigoIbge: '4115200', areaKm2: 487, bbox: [-52.08, -23.52, -51.82, -23.32], regiao: 'Norte / Noroeste' },
  { nome: 'Cascavel', codigoIbge: '4104808', areaKm2: 2101, bbox: [-53.75, -25.25, -53.25, -24.75], regiao: 'Oeste Paranaense' },
  { nome: 'Ponta Grossa', codigoIbge: '4119905', areaKm2: 2054, bbox: [-50.45, -25.35, -49.85, -24.85], regiao: 'Campos Gerais' },
  { nome: 'Castro', codigoIbge: '4104907', areaKm2: 2531, bbox: [-50.35, -25.05, -49.65, -24.55], regiao: 'Campos Gerais' },
  { nome: 'Curitiba', codigoIbge: '4106902', areaKm2: 435, bbox: [-49.40, -25.55, -49.15, -25.32], regiao: 'Região Metropolitana' },
  { nome: 'Campo Largo', codigoIbge: '4104204', areaKm2: 1243, bbox: [-49.75, -25.60, -49.40, -25.25], regiao: 'Região Metropolitana' },
  { nome: 'Guarapuava', codigoIbge: '4109401', areaKm2: 3168, bbox: [-51.85, -25.65, -51.15, -25.15], regiao: 'Centro-Sul' },
  { nome: 'Toledo', codigoIbge: '4127700', areaKm2: 1197, bbox: [-53.95, -24.85, -53.55, -24.55], regiao: 'Oeste' },
  { nome: 'Pato Branco', codigoIbge: '4118501', areaKm2: 539, bbox: [-52.85, -26.35, -52.55, -26.05], regiao: 'Sudoeste' },
  { nome: 'Foz do Iguaçu', codigoIbge: '4108304', areaKm2: 618, bbox: [-54.65, -25.65, -54.45, -25.40], regiao: 'Extremo Oeste' },
  { nome: 'Umuarama', codigoIbge: '4128104', areaKm2: 1234, bbox: [-53.45, -23.95, -53.15, -23.65], regiao: 'Noroeste / Arenito Caiuá' },
  { nome: 'Paranavaí', codigoIbge: '4118402', areaKm2: 1450, bbox: [-52.65, -23.25, -52.25, -22.85], regiao: 'Noroeste' },
  { nome: 'Abatiá', codigoIbge: '4100103', areaKm2: 229, bbox: [-50.42, -23.38, -50.25, -23.25], regiao: 'Norte Pioneiro' },
];
