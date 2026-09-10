import { z } from "zod";

export type SeverityLevel = "Moderada" | "Alta" | "Crítica";

export type SoilType =
  | "Latossolo Vermelho Distroférrico"
  | "Latossolo Vermelho Eutroférrico"
  | "Nitossolo Vermelho"
  | "Neossolo Regolítico"
  | "Neossolo Litólico"
  | "Argissolo Vermelho-Amarelo"
  | "Cambissolo Háplico";

export type ErosionFeatureType =
  | "Erosão Laminar Incipiente"
  | "Erosão Laminar Moderada"
  | "Erosão Laminar Severa"
  | "Sulcos de Erosão Acentuados"
  | "Ravina Ativa"
  | "Voçoroca em Expansão"
  | "Depressão com Escoamento Concentrado";

// Origem do dado: deixa explícito, em cada ponto, o quanto se pode confiar nele.
export type DataProvenance =
  | "user-upload" // importado de CSV/GeoJSON/KML fornecido pelo usuário (valores como digitados no arquivo)
  | "satellite-derived" // BSI/NDVI/declividade/RUSLE calculados sob demanda via Google Earth Engine + fontes públicas
  | "gee-screened" // candidato triado pelo pipeline GEE (máscara de elegibilidade + estratificação + thinning)
  | "field-validated"; // confirmado em campo (GNSS RTK / VANT / KoboToolbox)

/**
 * Validação pericial estrita: identifica registros sintéticos ou legados de testes
 * para blindar o mestrado contra contaminação por dados não-reais.
 */
export function isSyntheticPoint(p: any): boolean {
  if (!p || typeof p !== "object") return true;
  if (p.dataProvenance === "mock" || p.dataProvenance === "synthetic") return true;
  if (typeof p.id === "string" && /^ERO-PR-\d{3}$/.test(p.id)) return true;
  if (typeof p.code === "string" && /^PR-2026-\d{3}$/.test(p.code)) return true;
  if (p.dataSource === "mock" || p.source === "mock") return true;
  return false;
}

export interface RusleFactors {
  r?: number; // Erosividade da chuva (MJ.mm/ha.h.ano) — estimada via NASA POWER + eq. Lombardi Neto
  k?: number; // Erodibilidade do solo (t.h/ha.MJ.mm) — aproximada pela ordem pedológica (SiBCS)
  ls?: number; // Fator topográfico comprimento-declividade (Moore & Burch / Desmet & Govers)
  c?: number; // Fator de cobertura e manejo — derivado do NDVI/BSI
  p?: number; // Fator de práticas conservacionistas (0.2–1.0), default 1.0 (desconhecido)
}

export interface ErosionPoint {
  id: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number; // meters
  slopePercent: number; // %
  slopeDegrees: number; // °
  bsi: number; // Bare Soil Index (-1.0 to 1.0)
  ndvi: number; // Vegetation index (-1.0 to 1.0)
  municipality: string;
  state: string;
  macroRegion: string;
  watershed: string; // Bacia Hidrográfica
  soilType: SoilType | string;
  featureType: ErosionFeatureType | string;
  severity: SeverityLevel;
  estimatedSoilLoss: number; // t/ha/ano (RUSLE)
  priorityScore: number; // 0 to 100
  detectionDate: string;
  notes?: string;
  isCustom?: boolean;

  // Rastreabilidade de origem e qualidade do dado
  dataProvenance?: DataProvenance;
  estimatedFields?: string[]; // campos preenchidos com valor padrão/estimado (não vieram da fonte original)
  rusleFactors?: RusleFactors;
  geeSourceImageId?: string; // ID da cena Sentinel-2 usada no cálculo real (auditabilidade)
  geeComputedAt?: string; // timestamp ISO do último cálculo real via GEE
  calcEngineVersion?: string; // Versão do motor de cálculo GEE (ex: 2026-08-30-slope-projection-fix)

  // Estrato amostral (README §3) quando selecionado por amostragem estratificada
  stratumId?: string; // Ex: "A1", "A2", "A3", "B1", "B2", "B3"
  stratumName?: string; // Descrição do estrato (ex: "Declividade 6-12% × Alta Erodibilidade")

  // Preenchido quando dataProvenance === "field-validated": observações reais
  // de campo (KoboToolbox), guardadas como vieram do formulário — README §4.1
  fieldObservations?: Record<string, string>;
  fieldValidatedAt?: string;

  // Atributos Fundiários e Cadastro Rural (CAR / SICAR / SNCR / CNIR)
  carCode?: string;             // Código do CAR (ex: BR-PR-4105404-000123-A)
  propertyName?: string;        // Nome da propriedade (ex: Fazenda Santa Maria)
  ownerName?: string;           // Nome completo do proprietário/titular principal (máscara oficial SNCR)
  incraRegistry?: string;       // Registro numérico do INCRA (ex: 950.041.054.123-1)
  propertyAreaHa?: number;      // Área total do imóvel em hectares (ha)
  ownerDocumentMasked?: string; // CPF/CNPJ mascarado do proprietário
  tenureStatus?: "encontrado" | "aproximado" | "sem-correspondencia" | "base-nao-disponivel";
  tenureUf?: string;
  tenureQueryDate?: string;
  tenureAssociationCriterion?: string;
  sicarSourceFile?: string;
  sicarBaseDate?: string;
  sigefSourceFile?: string;
  sigefBaseDate?: string;
  sncrSourceFile?: string;
  sncrBaseDate?: string;
}

export interface RegionPreset {
  id: string;
  name: string;
  state: string;
  country: string;
  description: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  pitch?: number;
  bearing?: number;
  bounds: [[number, number], [number, number]]; // [[minLng, minLat], [maxLng, maxLat]]
  watersheds: string[];
  isCustom?: boolean;
}

export interface AOIPolygon {
  id: string;
  name: string;
  fileName: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  areaKm2?: number;
  importedAt: string;
}

export type PolygonCategory =
  | "Talhão Agrícola"
  | "Mancha de Erosão Laminar"
  | "Sulcos / Ravina"
  | "Área de Preservação / Palhada"
  | "Outro";

export interface DrawnPolygon {
  id: string;
  name: string;
  category: PolygonCategory;
  severity?: SeverityLevel;
  notes?: string;
  areaM2: number;
  areaHa: number;
  perimeterM: number;
  geometry: GeoJSON.Polygon;
  createdAt: string;
  color?: string;
}

export interface SavedPointDataset {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  pointsCount: number;
  points: ErosionPoint[];
  regionName?: string;
  aoiPolygon?: AOIPolygon | null;
  filtersSnapshot?: FilterState;
  source?: DataProvenance | "custom";
}

export interface NewRegionRequest {
  id: string;
  regionName: string;
  stateOrCountry: string;
  reason: string;
  requesterEmail: string;
  dateRange: { start: string; end: string };
  sensorPreference: "Sentinel-2" | "Landsat-8/9" | "Planet-NICFI" | "SRTM-30m";
  coordinatesBbox?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  customPolygon?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  status: "Pendente" | "Processando GEE" | "Concluído";
  createdAt: string;
}

export interface GcpCredentials {
  type: string;
  project_id: string;
  private_key_id?: string;
  private_key: string;
  client_email: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  isValid?: boolean;
  validatedAt?: string;
}

export interface FilterState {
  searchQuery: string;
  minSlope: number;
  maxSlope: number;
  minBsi: number;
  maxBsi: number;
  selectedSeverities: SeverityLevel[];
  selectedWatersheds: string[];
  selectedSoilTypes: string[];
  selectedFeatureTypes: string[];
  topN: number; // Limit to Top N most critical points (0 = all)
  sortBy: "priority" | "bsi" | "slope" | "soilLoss" | "municipality";
  sortOrder: "asc" | "desc";
}

// Zod schemas for backend validation
export const GcpCredentialsSchema = z.object({
  type: z.literal("service_account"),
  project_id: z.string().min(3),
  client_email: z.string().email(),
  private_key: z.string().includes("BEGIN PRIVATE KEY"),
});

export const RegionRequestSchema = z.object({
  regionName: z.string().min(3, "Nome da região é obrigatório"),
  stateOrCountry: z.string().min(2, "Estado ou país é obrigatório"),
  reason: z.string().min(5, "Justificativa é obrigatória"),
  requesterEmail: z.string().email("E-mail inválido"),
  sensorPreference: z.enum(["Sentinel-2", "Landsat-8/9", "Planet-NICFI", "SRTM-30m"]),
});

export type LogSeverity = "error" | "warning" | "info" | "success";
export type LogCategory = "GEE" | "MapLibre" | "Autenticação" | "Camadas" | "Aplicação" | "Rede" | "Sistema";

export interface SystemLog {
  id: string;
  timestamp: string;
  severity: LogSeverity;
  category: LogCategory;
  message: string;
  details?: string;
}
