/**
 * ============================================================================
 * Tipos de Interface de Usuário e Áreas Espaciais — SAREL v2 (PPGTCA 2026)
 * ============================================================================
 *
 * REGRAS METODOLÓGICAS:
 * - Regra 1: Dados geográficos e de auditoria são estritamente reais e verificáveis.
 * - Regra 5: Zero dados sintéticos ou simulados em qualquer estrutura de dados.
 */

import type { PontoAmostral } from "./ponto";

export type ModalType =
  | "settings"
  | "region"
  | "candidates"
  | "polygons"
  | "data-manager"
  | "diagnostics"
  | "audit-dossier"
  | "campanha"
  | "matriz"
  | "decisoes"
  | "export"
  | null;

export type BasemapType =
  | "google-earth"
  | "google-hybrid"
  | "satellite"
  | "mapbox-hd"
  | "topo"
  | "dark"
  | "hybrid"
  | "voyager";

export interface AreaEstudo {
  id: string;
  nome: string;
  tipo: "estado" | "municipio" | "bacia" | "talhao" | "customizado";
  codigoIbge?: string;
  areaKm2?: number;
  areaHa?: number;
  perimetroM?: number;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  ativa: boolean;
  cor?: string;
  categoria?: string;
}

export interface MapViewState {
  basemap: BasemapType;
  terreno3d: boolean;
  exageracao3d: number;
  mostrarBacias: boolean;
  mostrarLimites: boolean;
  mostrarSolosEmbrapa: boolean;
  mostrarErodibilidade: boolean;
  mostrarSitiosPadraoOuro?: boolean;
  flyToTarget?: {
    lat: number;
    lng: number;
    zoom?: number;
    pitch?: number;
    bearing?: number;
  } | null;
}

export interface GcpCredentialsInfo {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  client_email?: string;
  client_id?: string;
}

export interface CredenciaisState {
  geeSessionActive: boolean;
  gcpCredentials: GcpCredentialsInfo | null;
  mapboxToken: string;
  googleMapsKey: string;
  cartoApiKey: string;
  planetApiKey: string;
  embrapaToken: string;
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  severity: "info" | "warning" | "error";
  component: string;
  message: string;
  details?: Record<string, unknown>;
}
