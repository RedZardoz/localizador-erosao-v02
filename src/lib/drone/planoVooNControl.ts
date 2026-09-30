/**
 * ============================================================================
 * Exportador de Planos de Voo QGroundControl (.plan v1) para o NControl
 * SAREL v2.0 — Decisões D06, D16, D21, D23 e D26 (PPGTCA 2026)
 * ============================================================================
 *
 * Implementa os requisitos Y1 a Y6 do Planejamento e as correções periciais Z1 a Z6
 * (Prompt de Correção de 30/09/2026):
 *
 * - Z1: Amostrador real do Copernicus DEM GLO-30 (30 m) via `criarAmostradorCopernicusGLO30Real`,
 *   reaproveitando o pipeline unificado de `scripts/reduzir_terreno_copernicus.py` com isolamento
 *   completo de `PROJ_LIB`/`PROJ_DATA` no Windows 11 / PostGIS e recusa explícita de NoData/fora
 *   de cobertura (P12).
 * - Z2: Renomeação explícita de todos os fixtures sintéticos para `amostradorSinteticoParaTeste`,
 *   com proveniência formal `"sintetico"`.
 * - Z3: Guarda rígida em código (`ErroEmissaoPlanoSinteticoRecusada`): o exportador RECUSA
 *   por padrão emitir `.plan` com terreno sintético ou polígonos não selados de D16.
 *   Sob o sinalizador de demonstração (`permitirPlanoSinteticoDemonstracao: true`), os arquivos
 *   são obrigatoriamente carimbados com o prefixo `SINTETICO_NAO_VOAR_`.
 * - Z4: Artefatos sintéticos renomeados no repositório com o prefixo `SINTETICO_NAO_VOAR_`.
 * - Z5: Cegamento do intérprete não reproduzível a partir do repositório sozinho:
 *   sem chave externa fornecida pelo selo de sorteio, gera identificadores estocásticos
 *   aleatórios (`crypto.randomBytes`), sem chave padrão literal no código.
 * - Z6: Faixas de voo (transectos) em CURVA DE NÍVEL (`anguloFaixasGraus = (aspectoMedidoGraus + 90°) % 360`),
 *   preservando o eixo maior do polígono orientado no sentido do declive (D16) e registrando
 *   os três ângulos separadamente no roteiro.
 */

import crypto from "crypto";
import path from "path";
import { execFileSync } from "child_process";
import { CAMPOS_PROIBIDOS_MATRIZ_TREINO } from "@/lib/matriz/invariantes";

/** Raio médio esférico adotado pelo QGroundControl em `QGCGeo.cc` (`CONSTANTS_RADIUS_OF_EARTH`). */
export const QGC_EARTH_RADIUS_METERS = 6371000.0;

/** Especificação óptica imutável da câmera Micasense Altum extraída de `MissaoCalculoMica.plan`. */
export const CAMERA_MICASENSE_ALTUM_ESPEC = {
  CameraName: "Micasense Altum" as const,
  FocalLength: 8, // mm
  SensorWidth: 7.12, // mm
  SensorHeight: 5.33, // mm
  ImageWidth: 2064, // px
  ImageHeight: 1544, // px
  FrontalOverlap: 80, // %
  SideOverlap: 60, // %
  Landscape: true,
  FixedOrientation: false,
  MinTriggerInterval: 0,
  ValueSetIsDistance: true,
  DistanceToSurfaceRelative: true,
  version: 1,
} as const;

/** GSD alvo para delineação de feições erosivas (D16 / D26): 4,0 cm/px. */
export const GSD_ALVO_CAMPANHA_CM = 4.0;

/**
 * Ressalvas metodológicas obrigatórias sobre o uso do Copernicus DEM GLO-30
 * para cálculo das altitudes relativas por waypoint (Y2).
 */
export const RESSALVAS_TERRENO_GLO30 = [
  "1. Modelo Digital de Superfície (DSM), não de terreno nu (DTM): onde houver mata ciliar, quebra-vento ou reflorestamento, a cota do GLO-30 reflete o topo do dossel e não o solo.",
  "2. Resolução espacial de 30 m (suavização intra-célula): ravinas estreitas, terraços agrícolas ou quebras abruptas de vertente menores que 30 m são suavizados pela grade.",
  "3. Obstáculos pontuais ausentes: torres de transmissão, postes, fios, silos e árvores isoladas crescidas após a aquisição radar não constam no modelo; a conferência visual do horizonte de voo e a segurança contra colisão permanecem responsabilidade indelegável do piloto em campo.",
] as const;

export interface QGCCameraCalc {
  AdjustedFootprintFrontal: number;
  AdjustedFootprintSide: number;
  CameraName: string;
  DistanceToSurface: number;
  DistanceToSurfaceRelative: boolean;
  FixedOrientation: boolean;
  FocalLength: number;
  FrontalOverlap: number;
  ImageDensity: number;
  ImageHeight: number;
  ImageWidth: number;
  Landscape: boolean;
  MinTriggerInterval: number;
  SensorHeight: number;
  SensorWidth: number;
  SideOverlap: number;
  ValueSetIsDistance: boolean;
  version: number;
}

export interface QGCSimpleItem {
  autoContinue: boolean;
  command: 16 | 20 | 22 | 206;
  doJumpId: number;
  frame: 2 | 3;
  params: [
    number,
    number,
    number,
    number | null,
    number,
    number,
    number,
  ];
  type: "SimpleItem";
}

export interface QGCSurveyComplexItem {
  TransectStyleComplexItem: {
    CameraCalc: QGCCameraCalc;
    CameraShots: number;
    CameraTriggerInTurnAround: boolean;
    FollowTerrain: boolean;
    HoverAndCapture: boolean;
    Items: QGCSimpleItem[];
    Refly90Degrees: boolean;
    TurnAroundDistance: number;
    VisualTransectPoints: [number, number][];
    version: 2;
  };
  angle: number;
  complexItemType: "survey";
  entryLocation: number;
  flyAlternateTransects: boolean;
  polygon: [number, number][];
  splitConcavePolygons: boolean;
  type: "ComplexItem";
  version: 5;
}

export interface QGCPlanFile {
  fileType: "Plan";
  geoFence: {
    circles: unknown[];
    polygons: unknown[];
    version: 2;
  };
  groundStation: "QGroundControl";
  mission: {
    cruiseSpeed: 15;
    firmwareType: 12;
    globalPlanAltitudeMode: 1;
    hoverSpeed: 5;
    items: (QGCSimpleItem | QGCSurveyComplexItem)[];
    plannedHomePosition: [number, number, number];
    vehicleType: 2;
    version: 2;
  };
  rallyPoints: {
    points: unknown[];
    version: 2;
  };
  version: 1;
}

// ============================================================================
// Z1 e Z3 — Proveniência Formal de Terreno e Amostradores
// ============================================================================

export type ProvenienciaAmostradorTerreno = "copernicus-glo30" | "sintetico";

export interface AmostradorElevacaoGLO30Objeto {
  amostrar: (latitude: number, longitude: number) => number;
  preCarregarCoordenadas?: (coordenadas: [number, number][]) => void;
  proveniencia: ProvenienciaAmostradorTerreno;
  descricaoFonte: string;
}

export type AmostradorElevacaoGLO30 =
  | AmostradorElevacaoGLO30Objeto
  | ((latitude: number, longitude: number) => number);

export class ErroEmissaoPlanoSinteticoRecusada extends Error {
  constructor(mensagem: string) {
    super(`[SEGURANCA_PLANO_VOO_RECUSADO] ${mensagem}`);
    this.name = "ErroEmissaoPlanoSinteticoRecusada";
  }
}

export class ErroTerrenoForaDeCoberturaGLO30 extends Error {
  constructor(mensagem: string) {
    super(`[ERRO_TERRENO_GLO30] ${mensagem}`);
    this.name = "ErroTerrenoForaDeCoberturaGLO30";
  }
}

export function normalizarAmostradorTerreno(
  amostrador: AmostradorElevacaoGLO30
): AmostradorElevacaoGLO30Objeto {
  if (typeof amostrador === "function") {
    return {
      amostrar: amostrador,
      proveniencia: "sintetico",
      descricaoFonte:
        "Função avulsa sem proveniência declarada (tratada como sintética por segurança)",
    };
  }
  return amostrador;
}

export function criarAmostradorSinteticoParaTeste(
  fn: (latitude: number, longitude: number) => number,
  descricaoFonte: string = "Amostrador sintético para testes unitários"
): AmostradorElevacaoGLO30Objeto {
  return {
    amostrar: fn,
    proveniencia: "sintetico",
    descricaoFonte,
  };
}

/**
 * Cria o amostrador real sobre os tiles do Copernicus DEM GLO-30 (30 m) da ESA,
 * invocando o pipeline unificado de `scripts/reduzir_terreno_copernicus.py` com
 * isolamento prévio de `PROJ_LIB`/`PROJ_DATA` no ambiente Windows/PostGIS (Z1).
 *
 * Lança `ErroTerrenoForaDeCoberturaGLO30` se qualquer coordenada estiver fora da
 * cobertura oficial ou possuir valor NoData (P12).
 */
export function criarAmostradorCopernicusGLO30Real(opcoes?: {
  pastaCache?: string;
  pythonCmd?: string;
}): AmostradorElevacaoGLO30Objeto {
  const pastaCache = opcoes?.pastaCache || path.resolve(process.cwd(), "data/dem_cache");
  const pythonCmd = opcoes?.pythonCmd || process.env.PYTHON_PATH || "python";
  const scriptPath = path.resolve(process.cwd(), "scripts/reduzir_terreno_copernicus.py");

  const cacheMemoria = new Map<string, number>();

  function chaveCoord(lat: number, lon: number): string {
    return `${lat.toFixed(6)},${lon.toFixed(6)}`;
  }

  function preCarregarCoordenadas(coordenadas: [number, number][]): void {
    const pendentes: [number, number][] = [];
    for (const [lat, lon] of coordenadas) {
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        throw new ErroTerrenoForaDeCoberturaGLO30(
          `Coordenada não numérica inválida: lat=${lat}, lon=${lon}`
        );
      }
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new ErroTerrenoForaDeCoberturaGLO30(
          `Coordenada fora do globo terrestre: lat=${lat}, lon=${lon}`
        );
      }
      const ch = chaveCoord(lat, lon);
      if (!cacheMemoria.has(ch)) {
        pendentes.push([lat, lon]);
      }
    }
    if (pendentes.length === 0) return;

    try {
      const payloadStr = JSON.stringify(pendentes);
      const out = execFileSync(
        pythonCmd,
        [scriptPath, "--amostrar-altitudes", payloadStr, "--cache", pastaCache],
        { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
      );
      const res = JSON.parse(out.trim());
      if (res.status !== "sucesso" || !Array.isArray(res.altitudes)) {
        throw new ErroTerrenoForaDeCoberturaGLO30(
          res.motivo || "Falha desconhecida na amostragem do Copernicus DEM GLO-30."
        );
      }
      for (let i = 0; i < pendentes.length; i++) {
        const [lat, lon] = pendentes[i];
        cacheMemoria.set(chaveCoord(lat, lon), res.altitudes[i]);
      }
    } catch (err: any) {
      if (err instanceof ErroTerrenoForaDeCoberturaGLO30) {
        throw err;
      }
      throw new ErroTerrenoForaDeCoberturaGLO30(
        `Falha ao executar amostragem do Copernicus DEM GLO-30 via Python: ${err.message}`
      );
    }
  }

  function amostrar(latitude: number, longitude: number): number {
    const ch = chaveCoord(latitude, longitude);
    const emCache = cacheMemoria.get(ch);
    if (emCache !== undefined) {
      return emCache;
    }
    preCarregarCoordenadas([[latitude, longitude]]);
    const val = cacheMemoria.get(ch);
    if (val === undefined) {
      throw new ErroTerrenoForaDeCoberturaGLO30(
        `Coordenada (${latitude}, ${longitude}) sem dado de elevação no Copernicus DEM GLO-30.`
      );
    }
    return val;
  }

  return {
    amostrar,
    preCarregarCoordenadas,
    proveniencia: "copernicus-glo30",
    descricaoFonte: "COPERNICUS/DEM/GLO30 (ESA 30m / AWS S3 Open Data / EPSG:31982)",
  };
}

/**
 * Deriva a altura de voo sobre o solo (`DistanceToSurface` / `AGL_desejada`, em metros)
 * a partir do GSD desejado (em cm/px) e dos parâmetros físicos da Micasense Altum:
 *
 * `AGL = (GSD_cm / 100) * FocalLength_mm / (SensorWidth_mm / ImageWidth_px)`
 *
 * Para `GSD = 4,0 cm` na Micasense Altum:
 * - `pixelPitch = 7,12 / 2064 = 0,003449612403100775 mm` (`3,4496 µm`)
 * - `AGL_desejada = 0,04 * 8 / (7,12 / 2064) = 92,76404494382022 m` (`~92,8 m`)
 */
export function calcularAglParaGsdMicasenseAltum(gsdCm: number = GSD_ALVO_CAMPANHA_CM): number {
  const { FocalLength, SensorWidth, ImageWidth } = CAMERA_MICASENSE_ALTUM_ESPEC;
  const pixelPitchMm = SensorWidth / ImageWidth;
  return ((gsdCm / 100.0) * FocalLength) / pixelPitchMm;
}

/**
 * Constrói o objeto `CameraCalc` do QGroundControl para a Micasense Altum
 * dada uma distância à superfície (`DistanceToSurface`, ex.: `80 m` ou `92.764045 m`).
 */
export function construirCameraCalcMicasenseAltum(
  distanceToSurfaceMeters: number,
  opcoes: {
    frontalOverlapPct?: number;
    sideOverlapPct?: number;
    valueSetIsDistance?: boolean;
  } = {}
): QGCCameraCalc {
  const {
    FocalLength,
    SensorWidth,
    SensorHeight,
    ImageWidth,
    ImageHeight,
    Landscape,
    FixedOrientation,
    MinTriggerInterval,
    DistanceToSurfaceRelative,
    CameraName,
    version,
  } = CAMERA_MICASENSE_ALTUM_ESPEC;

  const frontalOverlap = opcoes.frontalOverlapPct ?? CAMERA_MICASENSE_ALTUM_ESPEC.FrontalOverlap;
  const sideOverlap = opcoes.sideOverlapPct ?? CAMERA_MICASENSE_ALTUM_ESPEC.SideOverlap;
  const valueSetIsDistance = opcoes.valueSetIsDistance ?? CAMERA_MICASENSE_ALTUM_ESPEC.ValueSetIsDistance;

  const pixelPitchMm = SensorWidth / ImageWidth;
  const imageDensityCm = (distanceToSurfaceMeters * 100.0 * pixelPitchMm) / FocalLength;

  // Em CameraCalc::_recalcTriggerDistance (QGroundControl), o footprint lateral e frontal
  // deriva de (imageWidth * imageDensity) / 100 e (imageHeight * imageDensity) / 100
  const imageFootprintWidthM = (ImageWidth * imageDensityCm) / 100.0;
  const imageFootprintHeightM = (ImageHeight * imageDensityCm) / 100.0;

  const footprintSideMeters = Landscape ? imageFootprintWidthM : imageFootprintHeightM;
  const footprintFrontalMeters = Landscape ? imageFootprintHeightM : imageFootprintWidthM;

  const adjustedFootprintSide = footprintSideMeters * (1.0 - sideOverlap / 100.0);
  const adjustedFootprintFrontal = footprintFrontalMeters * (1.0 - frontalOverlap / 100.0);

  return {
    AdjustedFootprintFrontal: adjustedFootprintFrontal,
    AdjustedFootprintSide: adjustedFootprintSide,
    CameraName,
    DistanceToSurface: distanceToSurfaceMeters,
    DistanceToSurfaceRelative,
    FixedOrientation,
    FocalLength,
    FrontalOverlap: frontalOverlap,
    ImageDensity: imageDensityCm,
    ImageHeight,
    ImageWidth,
    Landscape,
    MinTriggerInterval,
    SensorHeight,
    SensorWidth,
    SideOverlap: sideOverlap,
    ValueSetIsDistance: valueSetIsDistance,
    version,
  };
}

/**
 * Projeção Azimutal Equidistante idêntica a `convertGeoToNed` em `QGCGeo.cc` do QGroundControl.
 * Retorna `{ x: East_m, y: North_m }` em relação a `(origLat, origLon)`.
 */
export function qgcGeoToPlanoLocal(
  lat: number,
  lon: number,
  origLat: number,
  origLon: number
): { x: number; y: number } {
  const latRad = (lat * Math.PI) / 180.0;
  const lonRad = (lon * Math.PI) / 180.0;
  const oLatRad = (origLat * Math.PI) / 180.0;
  const oLonRad = (origLon * Math.PI) / 180.0;

  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinOLat = Math.sin(oLatRad);
  const cosOLat = Math.cos(oLatRad);
  const cosDLon = Math.cos(lonRad - oLonRad);

  let arg = sinOLat * sinLat + cosOLat * cosLat * cosDLon;
  if (arg > 1.0) arg = 1.0;
  if (arg < -1.0) arg = -1.0;

  const c = Math.acos(arg);
  const k = Math.abs(c) < 1e-12 ? 1.0 : c / Math.sin(c);

  const northM = k * (cosOLat * sinLat - sinOLat * cosLat * cosDLon) * QGC_EARTH_RADIUS_METERS;
  const eastM = k * cosLat * Math.sin(lonRad - oLonRad) * QGC_EARTH_RADIUS_METERS;

  return { x: eastM, y: northM };
}

/**
 * Transformação inversa idêntica a `convertNedToGeo` em `QGCGeo.cc` do QGroundControl.
 * Recebe `{ x: East_m, y: North_m }` e retorna `[lat, lon]`.
 */
export function qgcPlanoLocalToGeo(
  eastM: number,
  northM: number,
  origLat: number,
  origLon: number
): [number, number] {
  const xRad = northM / QGC_EARTH_RADIUS_METERS;
  const yRad = eastM / QGC_EARTH_RADIUS_METERS;
  const c = Math.hypot(xRad, yRad);

  if (Math.abs(c) < 1e-12) {
    return [origLat, origLon];
  }

  const oLatRad = (origLat * Math.PI) / 180.0;
  const oLonRad = (origLon * Math.PI) / 180.0;
  const sinOLat = Math.sin(oLatRad);
  const cosOLat = Math.cos(oLatRad);
  const sinC = Math.sin(c);
  const cosC = Math.cos(c);

  const latRad = Math.asin(cosC * sinOLat + (xRad * sinC * cosOLat) / c);
  const lonRad =
    oLonRad + Math.atan2(yRad * sinC, c * cosOLat * cosC - xRad * sinOLat * sinC);

  return [(latRad * 180.0) / Math.PI, (lonRad * 180.0) / Math.PI];
}

/**
 * Distância geodésica em metros (fórmula de Haversine sobre raio WGS84/QGC).
 */
export function calcularDistanciaGeodesicaMetros(
  coordA: [number, number],
  coordB: [number, number]
): number {
  const [lat1, lon1] = coordA;
  const [lat2, lon2] = coordB;
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const rLat1 = (lat1 * Math.PI) / 180.0;
  const rLat2 = (lat2 * Math.PI) / 180.0;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return QGC_EARTH_RADIUS_METERS * c;
}

/**
 * Rotaciona um ponto 2D em torno de `origin` exatamente como `SurveyComplexItem::_rotatePoint`
 * no QGroundControl (`radians = (M_PI / 180.0) * -angle`).
 */
function rotatePointQGC(
  point: { x: number; y: number },
  origin: { x: number; y: number },
  angleDeg: number
): { x: number; y: number } {
  const radians = (Math.PI / 180.0) * -angleDeg;
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  return {
    x: dx * Math.cos(radians) - dy * Math.sin(radians) + origin.x,
    y: dx * Math.sin(radians) + dy * Math.cos(radians) + origin.y,
  };
}

export interface OpcoesGerarSurveyMicasenseAltum {
  polygon: [number, number][];
  angle: number;
  distanceToSurfaceMeters?: number;
  gsdCm?: number;
  turnAroundDistanceMeters?: number;
  cameraTriggerInTurnAround?: boolean;
  followTerrain?: boolean;
  hoverAndCapture?: boolean;
  refly90Degrees?: boolean;
  entryLocation?: number;
  flyAlternateTransects?: boolean;
  splitConcavePolygons?: boolean;
  startDoJumpId?: number;
  amostradorElevacaoGLO30?: AmostradorElevacaoGLO30;
  pontoDecolagem?: [number, number];
}

export interface ResultadoSurveyComDiagnostico {
  surveyItem: QGCSurveyComplexItem;
  nextDoJumpId: number;
  diagnosticoTerreno: {
    aglDesejadaMetros: number;
    cotaTerrenoDecolagemMetros: number | null;
    cotaMinPoligonoMetros: number | null;
    cotaMaxPoligonoMetros: number | null;
    desnivelMetros: number;
    altitudeRelativaMinMetros: number;
    altitudeRelativaMaxMetros: number;
  };
  comprimentoTotalVooMetros: number;
  numeroTransectos: number;
}

/**
 * Gera um `ComplexItem` do tipo `"survey"` (`TransectStyleComplexItem`) para a Micasense Altum
 * reproduzindo exatamente a geometria de transectos e os gatilhos `MAV_CMD_DO_SET_CAM_TRIGG_DIST`
 * (`command: 206`) do QGroundControl (Y1 e Y2).
 */
export function gerarSurveyMicasenseAltum(
  opcoes: OpcoesGerarSurveyMicasenseAltum
): ResultadoSurveyComDiagnostico {
  const {
    polygon,
    angle,
    turnAroundDistanceMeters = 10,
    cameraTriggerInTurnAround = true,
    followTerrain = false,
    hoverAndCapture = false,
    refly90Degrees = false,
    entryLocation = 0,
    flyAlternateTransects = false,
    splitConcavePolygons = false,
    startDoJumpId = 2,
    amostradorElevacaoGLO30,
    pontoDecolagem,
  } = opcoes;

  if (!polygon || polygon.length < 3) {
    throw new Error("O polígono do survey deve possuir ao menos 3 vértices [lat, lon].");
  }

  // Remove vértice duplicado de fechamento se presente
  const vertices =
    polygon.length > 3 &&
    Math.abs(polygon[0][0] - polygon[polygon.length - 1][0]) < 1e-12 &&
    Math.abs(polygon[0][1] - polygon[polygon.length - 1][1]) < 1e-12
      ? polygon.slice(0, -1)
      : [...polygon];

  const aglDesejadaMetros =
    opcoes.distanceToSurfaceMeters ??
    calcularAglParaGsdMicasenseAltum(opcoes.gsdCm ?? GSD_ALVO_CAMPANHA_CM);

  const cameraCalc = construirCameraCalcMicasenseAltum(aglDesejadaMetros, {
    valueSetIsDistance: opcoes.distanceToSurfaceMeters !== undefined,
  });

  const origLat = vertices[0][0];
  const origLon = vertices[0][1];

  const ptsLocal = vertices.map(([lat, lon]) =>
    qgcGeoToPlanoLocal(lat, lon, origLat, origLon)
  );

  const minX = Math.min(...ptsLocal.map((p) => p.x));
  const maxX = Math.max(...ptsLocal.map((p) => p.x));
  const minY = Math.min(...ptsLocal.map((p) => p.y));
  const maxY = Math.max(...ptsLocal.map((p) => p.y));

  const center = {
    x: (minX + maxX) / 2.0,
    y: (minY + maxY) / 2.0,
  };
  const maxWidth = Math.max(maxX - minX, maxY - minY) + 2000.0;
  const halfWidth = maxWidth / 2.0;

  // Rotaciona o polígono por -angle em torno do centro do boundingRect
  const rotPoly = ptsLocal.map((pt) => rotatePointQGC(pt, center, -angle));

  const gridSpacing = cameraCalc.AdjustedFootprintSide;
  const triggerDistance = cameraCalc.AdjustedFootprintFrontal;

  // Gera as linhas verticais x = center.x - halfWidth + k * gridSpacing
  const transectSegmentsRot: {
    x: number;
    yMin: number;
    yMax: number;
  }[] = [];

  for (
    let x = center.x - halfWidth;
    x < center.x + halfWidth;
    x += gridSpacing
  ) {
    const yIntersections: number[] = [];
    const n = rotPoly.length;
    for (let i = 0; i < n; i++) {
      const p1 = rotPoly[i];
      const p2 = rotPoly[(i + 1) % n];
      if ((p1.x <= x && p2.x > x) || (p2.x <= x && p1.x > x)) {
        const t = (x - p1.x) / (p2.x - p1.x);
        const yInt = p1.y + t * (p2.y - p1.y);
        yIntersections.push(yInt);
      }
    }
    if (yIntersections.length >= 2) {
      yIntersections.sort((a, b) => a - b);
      transectSegmentsRot.push({
        x,
        yMin: yIntersections[0],
        yMax: yIntersections[yIntersections.length - 1],
      });
    }
  }

  // Constrói os 4 pontos de cada transecto alternando o sentido (boustrophedon)
  const reverseFirst = entryLocation === 0 || entryLocation === 1;
  const visualTransectPoints: [number, number][] = [];
  const transectGeoQuads: [number, number][][] = [];
  let cameraShotsTotal = 0;

  for (let idx = 0; idx < transectSegmentsRot.length; idx++) {
    const seg = transectSegmentsRot[idx];
    const goingDown = reverseFirst ? idx % 2 === 0 : idx % 2 === 1;

    const ptsRot4 = goingDown
      ? [
          { x: seg.x, y: seg.yMax + turnAroundDistanceMeters },
          { x: seg.x, y: seg.yMax },
          { x: seg.x, y: seg.yMin },
          { x: seg.x, y: seg.yMin - turnAroundDistanceMeters },
        ]
      : [
          { x: seg.x, y: seg.yMin - turnAroundDistanceMeters },
          { x: seg.x, y: seg.yMin },
          { x: seg.x, y: seg.yMax },
          { x: seg.x, y: seg.yMax + turnAroundDistanceMeters },
        ];

    const ptsGeo4: [number, number][] = ptsRot4.map((ptR) => {
      const ptLocal = rotatePointQGC(ptR, center, angle);
      return qgcPlanoLocalToGeo(ptLocal.x, ptLocal.y, origLat, origLon);
    });

    transectGeoQuads.push(ptsGeo4);
    for (const coord of ptsGeo4) {
      visualTransectPoints.push(coord);
    }

    const activeTriggerLen =
      seg.yMax -
      seg.yMin +
      (cameraTriggerInTurnAround ? 2.0 * turnAroundDistanceMeters : 0.0);
    cameraShotsTotal += Math.ceil(activeTriggerLen / triggerDistance);
  }

  // Comprimento total da trajetória dentro do survey
  let comprimentoTotalVooMetros = 0;
  for (let i = 1; i < visualTransectPoints.length; i++) {
    comprimentoTotalVooMetros += calcularDistanciaGeodesicaMetros(
      visualTransectPoints[i - 1],
      visualTransectPoints[i]
    );
  }

  if (cameraTriggerInTurnAround && triggerDistance > 0) {
    cameraShotsTotal = Math.ceil(comprimentoTotalVooMetros / triggerDistance);
  }

  // Normaliza o amostrador de terreno
  const amostradorObj = amostradorElevacaoGLO30
    ? normalizarAmostradorTerreno(amostradorElevacaoGLO30)
    : undefined;

  const homeCoord: [number, number] = pontoDecolagem ?? vertices[0];

  if (amostradorObj?.preCarregarCoordenadas) {
    amostradorObj.preCarregarCoordenadas([homeCoord, ...visualTransectPoints]);
  }

  const cotaTerrenoDecolagemMetros = amostradorObj
    ? amostradorObj.amostrar(homeCoord[0], homeCoord[1])
    : null;

  const cotasTerrenoWps: number[] = [];
  const altitudesRelativasWps: number[] = [];

  for (const coord of visualTransectPoints) {
    if (amostradorObj && cotaTerrenoDecolagemMetros !== null) {
      const cotaWp = amostradorObj.amostrar(coord[0], coord[1]);
      cotasTerrenoWps.push(cotaWp);
      const altRel = aglDesejadaMetros + (cotaWp - cotaTerrenoDecolagemMetros);
      altitudesRelativasWps.push(Number(altRel.toFixed(4)));
    } else {
      altitudesRelativasWps.push(
        Number.isInteger(aglDesejadaMetros)
          ? aglDesejadaMetros
          : Number(aglDesejadaMetros.toFixed(6))
      );
    }
  }

  // Monta a lista de Items (command 16 e command 206) idêntica ao QGC
  const items: QGCSimpleItem[] = [];
  let currentDoJumpId = startDoJumpId;

  for (let t = 0; t < transectGeoQuads.length; t++) {
    const quad = transectGeoQuads[t];
    const baseWpIdx = t * 4;

    // Waypoint 0 do transecto (início do turnaround)
    items.push({
      autoContinue: true,
      command: 16,
      doJumpId: currentDoJumpId++,
      frame: 3,
      params: [
        0,
        0,
        0,
        null,
        quad[0][0],
        quad[0][1],
        altitudesRelativasWps[baseWpIdx],
      ],
      type: "SimpleItem",
    });

    // No primeiro transecto, quando CameraTriggerInTurnAround = true, QGC emite command 206 após o WP0
    if (t === 0 && cameraTriggerInTurnAround) {
      items.push({
        autoContinue: true,
        command: 206,
        doJumpId: currentDoJumpId++,
        frame: 2,
        params: [triggerDistance, 0, 1, 0, 0, 0, 0],
        type: "SimpleItem",
      });
    }

    // Waypoint 1 do transecto (entrada no polígono)
    items.push({
      autoContinue: true,
      command: 16,
      doJumpId: currentDoJumpId++,
      frame: 3,
      params: [
        0,
        0,
        0,
        null,
        quad[1][0],
        quad[1][1],
        altitudesRelativasWps[baseWpIdx + 1],
      ],
      type: "SimpleItem",
    });

    // Em todo transecto, QGC emite command 206 imediatamente após o waypoint de entrada no polígono
    items.push({
      autoContinue: true,
      command: 206,
      doJumpId: currentDoJumpId++,
      frame: 2,
      params: [triggerDistance, 0, 1, 0, 0, 0, 0],
      type: "SimpleItem",
    });

    // Waypoint 2 do transecto (saída do polígono)
    items.push({
      autoContinue: true,
      command: 16,
      doJumpId: currentDoJumpId++,
      frame: 3,
      params: [
        0,
        0,
        0,
        null,
        quad[2][0],
        quad[2][1],
        altitudesRelativasWps[baseWpIdx + 2],
      ],
      type: "SimpleItem",
    });

    // Waypoint 3 do transecto (fim do turnaround)
    items.push({
      autoContinue: true,
      command: 16,
      doJumpId: currentDoJumpId++,
      frame: 3,
      params: [
        0,
        0,
        0,
        null,
        quad[3][0],
        quad[3][1],
        altitudesRelativasWps[baseWpIdx + 3],
      ],
      type: "SimpleItem",
    });
  }

  // Após o último waypoint do último transecto, QGC emite command 206 com distância 0 para desligar o disparo
  if (transectGeoQuads.length > 0) {
    items.push({
      autoContinue: true,
      command: 206,
      doJumpId: currentDoJumpId++,
      frame: 2,
      params: [0, 0, 0, 0, 0, 0, 0],
      type: "SimpleItem",
    });
  }

  const cotaMinPoligonoMetros =
    cotasTerrenoWps.length > 0 ? Math.min(...cotasTerrenoWps) : null;
  const cotaMaxPoligonoMetros =
    cotasTerrenoWps.length > 0 ? Math.max(...cotasTerrenoWps) : null;
  const desnivelMetros =
    cotaMinPoligonoMetros !== null && cotaMaxPoligonoMetros !== null
      ? Number((cotaMaxPoligonoMetros - cotaMinPoligonoMetros).toFixed(2))
      : 0;

  const altitudeRelativaMinMetros =
    altitudesRelativasWps.length > 0
      ? Math.min(...altitudesRelativasWps)
      : aglDesejadaMetros;
  const altitudeRelativaMaxMetros =
    altitudesRelativasWps.length > 0
      ? Math.max(...altitudesRelativasWps)
      : aglDesejadaMetros;

  const surveyItem: QGCSurveyComplexItem = {
    TransectStyleComplexItem: {
      CameraCalc: cameraCalc,
      CameraShots: cameraShotsTotal,
      CameraTriggerInTurnAround: cameraTriggerInTurnAround,
      FollowTerrain: followTerrain,
      HoverAndCapture: hoverAndCapture,
      Items: items,
      Refly90Degrees: refly90Degrees,
      TurnAroundDistance: turnAroundDistanceMeters,
      VisualTransectPoints: visualTransectPoints,
      version: 2,
    },
    angle,
    complexItemType: "survey",
    entryLocation,
    flyAlternateTransects,
    polygon: vertices,
    splitConcavePolygons,
    type: "ComplexItem",
    version: 5,
  };

  return {
    surveyItem,
    nextDoJumpId: currentDoJumpId,
    diagnosticoTerreno: {
      aglDesejadaMetros: Number(aglDesejadaMetros.toFixed(4)),
      cotaTerrenoDecolagemMetros:
        cotaTerrenoDecolagemMetros !== null
          ? Number(cotaTerrenoDecolagemMetros.toFixed(2))
          : null,
      cotaMinPoligonoMetros:
        cotaMinPoligonoMetros !== null
          ? Number(cotaMinPoligonoMetros.toFixed(2))
          : null,
      cotaMaxPoligonoMetros:
        cotaMaxPoligonoMetros !== null
          ? Number(cotaMaxPoligonoMetros.toFixed(2))
          : null,
      desnivelMetros,
      altitudeRelativaMinMetros,
      altitudeRelativaMaxMetros,
    },
    comprimentoTotalVooMetros: Number(comprimentoTotalVooMetros.toFixed(2)),
    numeroTransectos: transectGeoQuads.length,
  };
}

/**
 * ============================================================================
 * Y3 & Z6 — Cálculo do Aspecto do Terreno e Geometria do Polígono
 * ============================================================================
 */

export interface ResultadoAspectoEGeometriaPoligono {
  anguloOrientacaoEcoado: number;
  orientacaoPoligonoGraus: number;
  formaPoligono: "quadrado_224x224m" | "retangulo_158x317m";
  razaoAspecto: number;
  areaHectares: 5.02;
  conflitoOrientacaoImovel: boolean;
  motivoConflitoOrientacao: string | null;
  verticesPoligono: [number, number][];
}

/**
 * Calcula o aspecto médio do terreno (azimute de maior descida, 0°..360° a partir do Norte)
 * sobre uma janela 3×3 com passo de 30 m (grade nativa do Copernicus DEM GLO-30) centrada
 * no polígono via operador de Horn (1981).
 */
export function calcularAspectoMedioGLO30Graus(
  centroLat: number,
  centroLon: number,
  amostradorElevacaoGLO30: AmostradorElevacaoGLO30
): number {
  const amostrador = normalizarAmostradorTerreno(amostradorElevacaoGLO30);
  const PASSO_METROS = 30.0;
  const [latN] = qgcPlanoLocalToGeo(0, PASSO_METROS, centroLat, centroLon);
  const [latS] = qgcPlanoLocalToGeo(0, -PASSO_METROS, centroLat, centroLon);
  const [, lonE] = qgcPlanoLocalToGeo(PASSO_METROS, 0, centroLat, centroLon);
  const [, lonW] = qgcPlanoLocalToGeo(-PASSO_METROS, 0, centroLat, centroLon);

  amostrador.preCarregarCoordenadas?.([
    [latN, lonW],
    [latN, centroLon],
    [latN, lonE],
    [centroLat, lonW],
    [centroLat, lonE],
    [latS, lonW],
    [latS, centroLon],
    [latS, lonE],
  ]);

  const zNW = amostrador.amostrar(latN, lonW);
  const zN = amostrador.amostrar(latN, centroLon);
  const zNE = amostrador.amostrar(latN, lonE);
  const zW = amostrador.amostrar(centroLat, lonW);
  const zE = amostrador.amostrar(centroLat, lonE);
  const zSW = amostrador.amostrar(latS, lonW);
  const zS = amostrador.amostrar(latS, centroLon);
  const zSE = amostrador.amostrar(latS, lonE);

  // Operador de Horn (1981) para derivadas topográficas dz/dx (Leste) e dz/dy (Norte)
  const dzDx = ((zNE + 2 * zE + zSE) - (zNW + 2 * zW + zSW)) / (8 * PASSO_METROS);
  const dzDy = ((zNW + 2 * zN + zNE) - (zSW + 2 * zS + zSE)) / (8 * PASSO_METROS);

  // Sentido de maior descida (downslope vector = [-dzDx, -dzDy])
  const downEast = -dzDx;
  const downNorth = -dzDy;

  if (Math.hypot(downEast, downNorth) < 1e-9) {
    return 0;
  }

  const azimuteRad = Math.atan2(downEast, downNorth);
  const azimuteGraus = ((azimuteRad * 180.0) / Math.PI + 360.0) % 360.0;
  return Number(azimuteGraus.toFixed(2));
}

/**
 * Constrói os 4 vértices `[lat, lon]` de um polígono de 5,02 ha (`50.200 m²`) centrado em
 * `(centroLat, centroLon)`, orientado segundo `anguloOrientacaoGraus` (azimute do eixo maior).
 *
 * - Para `razaoAspecto = 1` (quadrado): lado = `sqrt(50200) = 224,053565 m`.
 * - Para `razaoAspecto = 2` (retângulo 1:2): largura = `158,429795 m`, comprimento = `316,859590 m`.
 *
 * Em conformidade com Z6, o campo retornado ecoa `anguloOrientacaoEcoado` e informa
 * `orientacaoPoligonoGraus` (sem rotular como "medido").
 */
export function construirVerticesPoligono502Ha(
  centroLat: number,
  centroLon: number,
  opcoes: {
    razaoAspecto?: number;
    anguloOrientacaoGraus?: number;
    envelopeImovelMetros?: { larguraLesteOesteM: number; alturaNorteSulM: number };
  } = {}
): ResultadoAspectoEGeometriaPoligono {
  const AREA_M2 = 50_200.0; // 5,02 ha exatos
  const RAZAO_MIN = 1.0;
  const RAZAO_MAX = 2.0;
  const razaoBruta =
    typeof opcoes.razaoAspecto === "number" ? opcoes.razaoAspecto : RAZAO_MIN;
  const razaoSolicitada =
    razaoBruta < RAZAO_MIN
      ? RAZAO_MIN
      : razaoBruta > RAZAO_MAX
        ? RAZAO_MAX
        : razaoBruta;
  const anguloEntrada =
    typeof opcoes.anguloOrientacaoGraus === "number"
      ? opcoes.anguloOrientacaoGraus
      : 0;
  const anguloOrientacaoEcoado = Number(((anguloEntrada % 360) + 360) % 360);

  const comprimentoLongoM = Math.sqrt(AREA_M2 * razaoSolicitada);
  const larguraCurtaM = Math.sqrt(AREA_M2 / razaoSolicitada);

  let orientacaoPoligonoGraus = anguloOrientacaoEcoado;
  let conflitoOrientacaoImovel = false;
  let motivoConflitoOrientacao: string | null = null;

  // Verifica se o envelope do imóvel comporta o polígono orientado no sentido solicitado
  if (opcoes.envelopeImovelMetros) {
    const rad = (anguloOrientacaoEcoado * Math.PI) / 180.0;
    const projEast =
      Math.abs(comprimentoLongoM * Math.sin(rad)) +
      Math.abs(larguraCurtaM * Math.cos(rad));
    const projNorth =
      Math.abs(comprimentoLongoM * Math.cos(rad)) +
      Math.abs(larguraCurtaM * Math.sin(rad));

    const { larguraLesteOesteM, alturaNorteSulM } = opcoes.envelopeImovelMetros;
    if (projEast > larguraLesteOesteM || projNorth > alturaNorteSulM) {
      conflitoOrientacaoImovel = true;
      // Orienta o lado mais longo segundo o maior eixo do envelope do imóvel
      orientacaoPoligonoGraus = larguraLesteOesteM >= alturaNorteSulM ? 90 : 0;
      motivoConflitoOrientacao =
        `Geometria do imóvel (${larguraLesteOesteM.toFixed(0)} m E-W × ${alturaNorteSulM.toFixed(0)} m N-S) ` +
        `não comporta polígono de 5,02 ha orientado em ${anguloOrientacaoEcoado.toFixed(1)}°; ` +
        `adotado ângulo ${orientacaoPoligonoGraus}° alinhado ao eixo maior do imóvel.`;
    }
  }

  const radAdotado = (orientacaoPoligonoGraus * Math.PI) / 180.0;
  const uEast = Math.sin(radAdotado);
  const uNorth = Math.cos(radAdotado);
  const pEast = Math.sin(radAdotado + Math.PI / 2.0);
  const pNorth = Math.cos(radAdotado + Math.PI / 2.0);

  const halfL = comprimentoLongoM / 2.0;
  const halfW = larguraCurtaM / 2.0;

  const cantosLocal = [
    { e: -halfW * pEast + halfL * uEast, n: -halfW * pNorth + halfL * uNorth },
    { e: halfW * pEast + halfL * uEast, n: halfW * pNorth + halfL * uNorth },
    { e: halfW * pEast - halfL * uEast, n: halfW * pNorth - halfL * uNorth },
    { e: -halfW * pEast - halfL * uEast, n: -halfW * pNorth - halfL * uNorth },
  ];

  const verticesPoligono: [number, number][] = cantosLocal.map((c) =>
    qgcPlanoLocalToGeo(c.e, c.n, centroLat, centroLon)
  );

  return {
    anguloOrientacaoEcoado: Number(anguloOrientacaoEcoado.toFixed(2)),
    orientacaoPoligonoGraus: Number(orientacaoPoligonoGraus.toFixed(2)),
    formaPoligono:
      razaoSolicitada > 1.05 ? "retangulo_158x317m" : "quadrado_224x224m",
    razaoAspecto: Number(razaoSolicitada.toFixed(2)),
    areaHectares: 5.02,
    conflitoOrientacaoImovel,
    motivoConflitoOrientacao,
    verticesPoligono,
  };
}

/**
 * ============================================================================
 * Y4, Y5, Y6 e Z5, Z6 — Agrupamento por Jornada, Protocolo Cego Real e Roteiro
 * ============================================================================
 */

export interface EntradaPoligonoCampanhaNControl {
  idPoligono: string;
  estratoId: string;
  papelConjunto: "treino" | "held-out";
  centroide: { latitude: number; longitude: number };
  verticesPoligono?: [number, number][];
  razaoAspecto?: number;
  envelopeImovelMetros?: { larguraLesteOesteM: number; alturaNorteSulM: number };
  imovelCar: {
    codigoCar: string;
    nomeProprietario: string;
    municipio: string;
    areaImovelHa: number;
  };
}

export interface ItemRoteiroJornadaPoligono {
  ordemNaJornada: number;
  idJornada: string;
  idPoligono: string;
  codigoOpacoInterprete: string;
  estratoId: string;
  papelConjunto: "treino" | "held-out";
  municipio: string;
  codigoCar: string;
  centroideLat: number;
  centroideLon: number;
  areaPoligonoHa: 5.02;
  formaPoligono: "quadrado_224x224m" | "retangulo_158x317m";
  aspectoMedidoGraus: number;
  orientacaoPoligonoGraus: number;
  anguloFaixasGraus: number;
  anguloAdotadoGraus: number;
  conflitoOrientacaoImovel: boolean;
  motivoConflitoOrientacao: string | null;
  desnivelMetros: number;
  aglDesejadaMetros: number;
  altitudeRelativaMinMetros: number;
  altitudeRelativaMaxMetros: number;
  distanciaDesdeAnteriorKm: number;
  comprimentoVooMetros: number;
  tempoVooEstimadoMinutosMin: number;
  tempoVooEstimadoMinutosMax: number;
  numeroTransectos: number;
  cameraShots: number;
}

export interface PacoteJornadaNControl {
  idJornada: string;
  indiceJornada: number;
  pontoDecolagemSugerido: {
    latitude: number;
    longitude: number;
    altitudeRelativaMetros: number;
    statusConfirmacao: "sugestao_a_confirmar_em_campo";
    observacao: string;
  };
  nomeArquivoTerrainFollow: string;
  nomeArquivoAltFixa: string;
  planTerrainFollow: QGCPlanFile;
  planAltFixa: QGCPlanFile;
  poligonosRoteiro: ItemRoteiroJornadaPoligono[];
  distanciaTotalDeslocamentoKm: number;
  tempoVooTotalEstimadoMinutos: { min: number; max: number };
}

export interface LinhaAutorizacaoProprietario {
  codigoPoligono: string;
  idJornada: string;
  ordemNaJornada: number;
  codigoCar: string;
  nomeProprietario: string;
  municipio: string;
  areaImovelHa: number;
  areaPoligonoHa: 5.02;
  dataAutorizacao: "";
  formaAutorizacao: "";
}

/**
 * Registro estritamente cego destinado ao intérprete do ortomosaico (Y5).
 * Proibido conter `estratoId`, `nivelK`, `papelConjunto`, `pi_i`, `w_i` ou qualquer
 * item de `CAMPOS_PROIBIDOS_MATRIZ_TREINO`.
 */
export interface RegistroExportacaoInterpreteCego {
  codigoOpacoInterprete: string;
  cameraName: "Micasense Altum";
  gsdAlvoCm: number;
  aglNominalMetros: number;
  areaPoligonoHa: 5.02;
  formatoEntregaOrtomosaico: "GeoTIFF_5Bandas_Refletancia_Calibrada";
  protocoloDelineacao: "D26_FracaoAreaErodida_Cego";
  dataColetaCampo: "";
}

export interface PacoteExportacaoCompletoNControl {
  metadadosCampanha: {
    versaoExportador: "1.0.0";
    geradoEm: string;
    totalPoligonos: number;
    areaUnitariaHa: 5.02;
    areaTotalHa: number;
    totalJornadas: number;
    maxPoligonosPorJornada: number;
    camera: "Micasense Altum";
    gsdAlvoCm: 4.0;
    aglDesejadaMetros: number;
    velocidadeCruzeiroPlanMs: 15;
    velocidadeEfetivaMedidaMs: [8.7, 9.2];
    ressalvasTerrenoGLO30: readonly string[];
    ehPlanoSinteticoDemonstracao: boolean;
  };
  exportacaoPiloto: {
    jornadas: PacoteJornadaNControl[];
    tabelaAutorizacaoProprietarios: LinhaAutorizacaoProprietario[];
    roteiroCsv: string;
    tabelaAutorizacaoCsv: string;
    roteiroPdfBytes: Buffer;
    mapaChaveSecretaPilotoInterprete: Array<{
      idPoligono: string;
      codigoOpacoInterprete: string;
      estratoId: string;
      papelConjunto: "treino" | "held-out";
      idJornada: string;
    }>;
  };
  exportacaoInterprete: {
    registrosCegos: RegistroExportacaoInterpreteCego[];
    manifestoInterpreteCsv: string;
  };
}

/**
 * Gera um código opaco para o intérprete sob protocolo cego (Y5 & Z5).
 *
 * REGRAS CRÍTICAS DE SEGURANÇA (Z5):
 * - Jamais utiliza chave padrão literal no código.
 * - Se `segredoSeloSorteio` for fornecido (chave única gerada e guardada no selo D16 do pesquisador),
 *   produz HMAC determinístico para aquele selo.
 * - Se `segredoSeloSorteio` NÃO for fornecido, gera um identificador criptograficamente aleatório
 *   não reproduzível a partir do repositório sozinho (`crypto.randomBytes`).
 */
export function gerarCodigoOpacoInterprete(
  idPoligono: string,
  segredoSeloSorteio?: string
): string {
  if (segredoSeloSorteio) {
    if (typeof segredoSeloSorteio !== "string" || segredoSeloSorteio.trim().length === 0) {
      throw new Error(
        "[CEGAMENTO_INVALIDO] Segredo do selo de sorteio deve ser string não vazia."
      );
    }
    const digest = crypto
      .createHmac("sha256", segredoSeloSorteio)
      .update(idPoligono)
      .digest("hex")
      .slice(0, 10)
      .toUpperCase();
    return `VANT-BLIND-${digest}`;
  }

  // Geração aleatória independente e não derivável a partir do repositório sozinho
  const randomHex = crypto
    .randomBytes(6)
    .toString("hex")
    .slice(0, 10)
    .toUpperCase();
  return `VANT-BLIND-${randomHex}`;
}

/**
 * Guarda de segurança contra vazamento no pacote do intérprete (Y5).
 * Lança erro se encontrar qualquer chave proibida de `CAMPOS_PROIBIDOS_MATRIZ_TREINO`,
 * `estratoId`, `papelConjunto`, `nivelK`, `declividadePct`, `frequenciaSoloNu`, `pi_i`, `w_i`,
 * `idPoligono`, `codigoCar` ou coordenadas geográficas.
 */
export function validarIsolamentoCegoInterprete(
  pacoteInterprete: unknown
): { aprovado: true; totalRegistrosVerificados: number } {
  const CHAVES_PROIBIDAS_INTERPRETE = new Set<string>([
    ...CAMPOS_PROIBIDOS_MATRIZ_TREINO,
    "estratoId",
    "estrato",
    "papelConjunto",
    "papel",
    "treino",
    "held-out",
    "heldOut",
    "nivelK",
    "declividadePct",
    "frequenciaSoloNu",
    "pi_i",
    "w_i",
    "idPoligono",
    "codigoPoligono",
    "codigoCar",
    "nomeProprietario",
    "latitude",
    "longitude",
    "centroide",
    "polygon",
    "verticesPoligono",
  ]);

  let visitados = 0;

  function inspecionarRecursivo(valor: unknown, caminho: string): void {
    if (valor === null || valor === undefined) return;
    if (typeof valor === "string") {
      if (/S[123]_E[123]_K[12]/i.test(valor)) {
        throw new Error(
          `[VIOLACAO_PROTOCOLO_CEGO_Y5] Valor em '${caminho}' vaza identificador de estrato D12: '${valor}'.`
        );
      }
      if (/\b(treino|held-out|held_out)\b/i.test(valor)) {
        throw new Error(
          `[VIOLACAO_PROTOCOLO_CEGO_Y5] Valor em '${caminho}' vaza papel amostral (treino/held-out): '${valor}'.`
        );
      }
      return;
    }
    if (Array.isArray(valor)) {
      valor.forEach((item, idx) => inspecionarRecursivo(item, `${caminho}[${idx}]`));
      return;
    }
    if (typeof valor === "object") {
      visitados++;
      for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
        if (CHAVES_PROIBIDAS_INTERPRETE.has(k)) {
          throw new Error(
            `[VIOLACAO_PROTOCOLO_CEGO_Y5] Chave proibida '${k}' encontrada em '${caminho}.${k}'.`
          );
        }
        inspecionarRecursivo(v, `${caminho}.${k}`);
      }
    }
  }

  inspecionarRecursivo(pacoteInterprete, "exportacaoInterprete");
  return { aprovado: true, totalRegistrosVerificados: visitados };
}

export const MAX_POLIGONOS_JORNADA_PADRAO = 6;

export function agruparPoligonosPorProximidade(
  poligonos: EntradaPoligonoCampanhaNControl[],
  maxPoligonosPorJornada: number = MAX_POLIGONOS_JORNADA_PADRAO
): EntradaPoligonoCampanhaNControl[][] {
  if (maxPoligonosPorJornada < 1) {
    throw new Error("maxPoligonosPorJornada deve ser >= 1.");
  }

  const restantes = [...poligonos].sort((a, b) => {
    const diffLat = b.centroide.latitude - a.centroide.latitude;
    if (Math.abs(diffLat) > 1e-7) return diffLat;
    return a.centroide.longitude - b.centroide.longitude;
  });

  const grupos: EntradaPoligonoCampanhaNControl[][] = [];

  while (restantes.length > 0) {
    const semente = restantes.shift()!;
    const grupoAtual: EntradaPoligonoCampanhaNControl[] = [semente];

    while (grupoAtual.length < maxPoligonosPorJornada && restantes.length > 0) {
      const ultimo = grupoAtual[grupoAtual.length - 1];
      let melhorIdx = 0;
      let menorDist = Infinity;

      for (let i = 0; i < restantes.length; i++) {
        const cand = restantes[i];
        const d = calcularDistanciaGeodesicaMetros(
          [ultimo.centroide.latitude, ultimo.centroide.longitude],
          [cand.centroide.latitude, cand.centroide.longitude]
        );
        if (d < menorDist) {
          menorDist = d;
          melhorIdx = i;
        }
      }

      grupoAtual.push(restantes.splice(melhorIdx, 1)[0]);
    }

    grupos.push(grupoAtual);
  }

  return grupos;
}

export function gerarPdfRoteiroJornadas(
  linhasTexto: string[]
): Buffer {
  const sanitizarAscii = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[()\\]/g, " ")
      .replace(/[^\x20-\x7E]/g, " ");

  const LINHAS_POR_PAGINA = 48;
  const paginas: string[][] = [];
  for (let i = 0; i < linhasTexto.length; i += LINHAS_POR_PAGINA) {
    paginas.push(linhasTexto.slice(i, i + LINHAS_POR_PAGINA));
  }
  if (paginas.length === 0) {
    paginas.push(["Roteiro de Voo NControl - SAREL v2.0"]);
  }

  const objetos: string[] = [];
  const kidsRefs: string[] = [];

  objetos.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  objetos.push("");
  objetos.push(
    "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj"
  );

  let nextObjId = 4;
  for (const linhasPag of paginas) {
    const pageObjId = nextObjId++;
    const contentObjId = nextObjId++;
    kidsRefs.push(`${pageObjId} 0 R`);

    const comandosTexto = [
      "BT",
      "/F1 8 Tf",
      "36 800 Td",
      "11 TL",
      ...linhasPag.map((l) => `(${sanitizarAscii(l)}) '`),
      "ET",
    ].join("\n");

    objetos.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj`
    );
    objetos.push(
      `${contentObjId} 0 obj\n<< /Length ${Buffer.byteLength(comandosTexto, "ascii")} >>\nstream\n${comandosTexto}\nendstream\nendobj`
    );
  }

  objetos[1] = `2 0 obj\n<< /Type /Pages /Kids [${kidsRefs.join(" ")}] /Count ${paginas.length} >>\nendobj`;

  let corpo = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objetos) {
    offsets.push(Buffer.byteLength(corpo, "ascii"));
    corpo += obj + "\n";
  }

  const xrefOffset = Buffer.byteLength(corpo, "ascii");
  corpo += `xref\n0 ${objetos.length + 1}\n`;
  corpo += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    corpo += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  corpo += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(corpo, "ascii");
}

export function montarPlanJornadaQGC(opcoes: {
  surveys: QGCSurveyComplexItem[];
  pontoDecolagem: [number, number];
  altitudeInicialMetros: number;
  lastDoJumpId: number;
}): QGCPlanFile {
  const { surveys, pontoDecolagem, altitudeInicialMetros, lastDoJumpId } = opcoes;
  const altRounded = Number(altitudeInicialMetros.toFixed(2));

  const itemTakeoff: QGCSimpleItem = {
    autoContinue: true,
    command: 22,
    doJumpId: 1,
    frame: 3,
    params: [15, 0, 0, null, pontoDecolagem[0], pontoDecolagem[1], altRounded],
    type: "SimpleItem",
  };

  const itemRtl: QGCSimpleItem = {
    autoContinue: true,
    command: 20,
    doJumpId: lastDoJumpId,
    frame: 2,
    params: [0, 0, 0, 0, 0, 0, 0],
    type: "SimpleItem",
  };

  return {
    fileType: "Plan",
    geoFence: {
      circles: [],
      polygons: [],
      version: 2,
    },
    groundStation: "QGroundControl",
    mission: {
      cruiseSpeed: 15,
      firmwareType: 12,
      globalPlanAltitudeMode: 1,
      hoverSpeed: 5,
      items: [itemTakeoff, ...surveys, itemRtl],
      plannedHomePosition: [pontoDecolagem[0], pontoDecolagem[1], altRounded],
      vehicleType: 2,
      version: 2,
    },
    rallyPoints: {
      points: [],
      version: 2,
    },
    version: 1,
  };
}

export interface OpcoesExportarCampanhaVooNControl {
  poligonos: EntradaPoligonoCampanhaNControl[];
  amostradorElevacaoGLO30: AmostradorElevacaoGLO30;
  poligonosAuditadosD16?: boolean;
  permitirPlanoSinteticoDemonstracao?: boolean;
  maxPoligonosPorJornada?: number;
  gsdCm?: number;
  segredoSeloSorteio?: string;
  geradoEm?: string;
}

/**
 * Função mestra de exportação dos planos de voo para o NControl (Y1–Y6 e Z1–Z6).
 *
 * GUARDA OBRIGATÓRIA DE SEGURANÇA FÍSICA (Z3):
 * - Recusa terminantemente emitir planos voáveis com terreno sintético ou polígonos
 *   sem selo de sorteio real auditado de D16.
 * - Sob o sinalizador explícito `permitirPlanoSinteticoDemonstracao: true`, os nomes
 *   dos arquivos são obrigatoriamente prefixados com `SINTETICO_NAO_VOAR_`.
 *
 * ORIENTAÇÃO DE FAIXAS (Z6):
 * - Transectos voam em CURVA DE NÍVEL (`anguloFaixasGraus = (aspectoMedidoGraus + 90°) % 360`),
 *   com o polígono mantido orientado ao longo do declive (D16).
 */
export function exportarCampanhaVooNControl(
  opcoes: OpcoesExportarCampanhaVooNControl
): PacoteExportacaoCompletoNControl {
  const {
    poligonos,
    amostradorElevacaoGLO30,
    poligonosAuditadosD16 = false,
    permitirPlanoSinteticoDemonstracao = false,
    maxPoligonosPorJornada = MAX_POLIGONOS_JORNADA_PADRAO,
    gsdCm = GSD_ALVO_CAMPANHA_CM,
    segredoSeloSorteio,
    geradoEm = new Date().toISOString(),
  } = opcoes;

  const amostradorObj = normalizarAmostradorTerreno(amostradorElevacaoGLO30);
  const ehTerrenoReal = amostradorObj.proveniencia === "copernicus-glo30";
  const ehPoligonosReais = poligonosAuditadosD16 === true;
  const ehPlanoVoavel = ehTerrenoReal && ehPoligonosReais;

  if (!ehPlanoVoavel && permitirPlanoSinteticoDemonstracao !== true) {
    const motivos: string[] = [];
    if (!ehTerrenoReal) {
      motivos.push(
        `terreno com proveniência '${amostradorObj.proveniencia}' (não é Copernicus DEM GLO-30 real)`
      );
    }
    if (!ehPoligonosReais) {
      motivos.push("polígonos sintéticos sem selo auditado de D16");
    }
    throw new ErroEmissaoPlanoSinteticoRecusada(
      `Recusada a emissão de plano de voo .plan voável com ${motivos.join(" e ")}. ` +
      "Planos voáveis exigem obrigatoriamente Copernicus DEM GLO-30 real (D21) e sorteio selado de D16. " +
      "Para fins exclusivos de teste ou demonstração em bancada, forneça explicitamente a opção 'permitirPlanoSinteticoDemonstracao: true'."
    );
  }

  const prefixoNomeArquivo = ehPlanoVoavel ? "" : "SINTETICO_NAO_VOAR_";

  const aglDesejadaMetros = Number(
    calcularAglParaGsdMicasenseAltum(gsdCm).toFixed(4)
  );
  const gruposJornada = agruparPoligonosPorProximidade(
    poligonos,
    maxPoligonosPorJornada
  );

  const jornadas: PacoteJornadaNControl[] = [];
  const tabelaAutorizacaoProprietarios: LinhaAutorizacaoProprietario[] = [];
  const mapaChaveSecretaPilotoInterprete: PacoteExportacaoCompletoNControl["exportacaoPiloto"]["mapaChaveSecretaPilotoInterprete"] =
    [];
  const registrosCegos: RegistroExportacaoInterpreteCego[] = [];

  for (let jIdx = 0; jIdx < gruposJornada.length; jIdx++) {
    const grupo = gruposJornada[jIdx];
    const idJornada = `JORNADA_${String(jIdx + 1).padStart(2, "0")}`;
    const primeiroPoligono = grupo[0];
    const pontoDecolagem: [number, number] = [
      primeiroPoligono.centroide.latitude,
      primeiroPoligono.centroide.longitude,
    ];

    const surveysTerrainFollow: QGCSurveyComplexItem[] = [];
    const surveysAltFixa: QGCSurveyComplexItem[] = [];
    const poligonosRoteiro: ItemRoteiroJornadaPoligono[] = [];

    let doJumpIdTf = 2;
    let doJumpIdAf = 2;
    let distanciaTotalDeslocamentoKm = 0;
    let tempoTotalMin = 0;
    let tempoTotalMax = 0;

    for (let pIdx = 0; pIdx < grupo.length; pIdx++) {
      const item = grupo[pIdx];
      const ordemNaJornada = pIdx + 1;

      // Z5: Código opaco do intérprete gerado com segredo do selo ou aleatório estocástico
      const codigoOpaco = gerarCodigoOpacoInterprete(
        item.idPoligono,
        segredoSeloSorteio
      );

      // Z6: Aspecto medido do terreno (Horn, 1981)
      const aspectoGraus = calcularAspectoMedioGLO30Graus(
        item.centroide.latitude,
        item.centroide.longitude,
        amostradorObj
      );

      // O eixo maior do polígono é orientado no sentido do declive (D16)
      const geomInfo = construirVerticesPoligono502Ha(
        item.centroide.latitude,
        item.centroide.longitude,
        {
          razaoAspecto: item.razaoAspecto,
          anguloOrientacaoGraus: aspectoGraus,
          envelopeImovelMetros: item.envelopeImovelMetros,
        }
      );

      // Z6: As faixas de voo correm em CURVA DE NÍVEL (perpendicular ao declive)
      const anguloFaixasGraus = Number(
        (((geomInfo.orientacaoPoligonoGraus + 90.0) % 360.0 + 360.0) % 360.0).toFixed(2)
      );

      const vertices = item.verticesPoligono ?? geomInfo.verticesPoligono;

      // Variante 1: FollowTerrain = true
      const resTf = gerarSurveyMicasenseAltum({
        polygon: vertices,
        angle: anguloFaixasGraus,
        gsdCm,
        followTerrain: true,
        startDoJumpId: doJumpIdTf,
        amostradorElevacaoGLO30: amostradorObj,
        pontoDecolagem,
      });
      doJumpIdTf = resTf.nextDoJumpId;
      surveysTerrainFollow.push(resTf.surveyItem);

      // Variante 2: FollowTerrain = false
      const resAf = gerarSurveyMicasenseAltum({
        polygon: vertices,
        angle: anguloFaixasGraus,
        gsdCm,
        followTerrain: false,
        startDoJumpId: doJumpIdAf,
        amostradorElevacaoGLO30: amostradorObj,
        pontoDecolagem,
      });
      doJumpIdAf = resAf.nextDoJumpId;
      surveysAltFixa.push(resAf.surveyItem);

      const distAnteriorKm =
        pIdx === 0
          ? 0
          : Number(
              (
                calcularDistanciaGeodesicaMetros(
                  [grupo[pIdx - 1].centroide.latitude, grupo[pIdx - 1].centroide.longitude],
                  [item.centroide.latitude, item.centroide.longitude]
                ) / 1000.0
              ).toFixed(3)
            );
      distanciaTotalDeslocamentoKm = Number(
        (distanciaTotalDeslocamentoKm + distAnteriorKm).toFixed(3)
      );

      const tMin = Number((resTf.comprimentoTotalVooMetros / 9.2 / 60.0).toFixed(2));
      const tMax = Number((resTf.comprimentoTotalVooMetros / 8.7 / 60.0).toFixed(2));
      tempoTotalMin = Number((tempoTotalMin + tMin).toFixed(2));
      tempoTotalMax = Number((tempoTotalMax + tMax).toFixed(2));

      poligonosRoteiro.push({
        ordemNaJornada,
        idJornada,
        idPoligono: item.idPoligono,
        codigoOpacoInterprete: codigoOpaco,
        estratoId: item.estratoId,
        papelConjunto: item.papelConjunto,
        municipio: item.imovelCar.municipio,
        codigoCar: item.imovelCar.codigoCar,
        centroideLat: item.centroide.latitude,
        centroideLon: item.centroide.longitude,
        areaPoligonoHa: 5.02,
        formaPoligono: geomInfo.formaPoligono,
        aspectoMedidoGraus: aspectoGraus,
        orientacaoPoligonoGraus: geomInfo.orientacaoPoligonoGraus,
        anguloFaixasGraus,
        anguloAdotadoGraus: anguloFaixasGraus,
        conflitoOrientacaoImovel: geomInfo.conflitoOrientacaoImovel,
        motivoConflitoOrientacao: geomInfo.motivoConflitoOrientacao,
        desnivelMetros: resTf.diagnosticoTerreno.desnivelMetros,
        aglDesejadaMetros: resTf.diagnosticoTerreno.aglDesejadaMetros,
        altitudeRelativaMinMetros: resTf.diagnosticoTerreno.altitudeRelativaMinMetros,
        altitudeRelativaMaxMetros: resTf.diagnosticoTerreno.altitudeRelativaMaxMetros,
        distanciaDesdeAnteriorKm: distAnteriorKm,
        comprimentoVooMetros: resTf.comprimentoTotalVooMetros,
        tempoVooEstimadoMinutosMin: tMin,
        tempoVooEstimadoMinutosMax: tMax,
        numeroTransectos: resTf.numeroTransectos,
        cameraShots: resTf.surveyItem.TransectStyleComplexItem.CameraShots,
      });

      tabelaAutorizacaoProprietarios.push({
        codigoPoligono: item.idPoligono,
        idJornada,
        ordemNaJornada,
        codigoCar: item.imovelCar.codigoCar,
        nomeProprietario: item.imovelCar.nomeProprietario,
        municipio: item.imovelCar.municipio,
        areaImovelHa: item.imovelCar.areaImovelHa,
        areaPoligonoHa: 5.02,
        dataAutorizacao: "",
        formaAutorizacao: "",
      });

      mapaChaveSecretaPilotoInterprete.push({
        idPoligono: item.idPoligono,
        codigoOpacoInterprete: codigoOpaco,
        estratoId: item.estratoId,
        papelConjunto: item.papelConjunto,
        idJornada,
      });

      registrosCegos.push({
        codigoOpacoInterprete: codigoOpaco,
        cameraName: "Micasense Altum",
        gsdAlvoCm: gsdCm,
        aglNominalMetros: aglDesejadaMetros,
        areaPoligonoHa: 5.02,
        formatoEntregaOrtomosaico: "GeoTIFF_5Bandas_Refletancia_Calibrada",
        protocoloDelineacao: "D26_FracaoAreaErodida_Cego",
        dataColetaCampo: "",
      });
    }

    const planTerrainFollow = montarPlanJornadaQGC({
      surveys: surveysTerrainFollow,
      pontoDecolagem,
      altitudeInicialMetros: aglDesejadaMetros,
      lastDoJumpId: doJumpIdTf,
    });

    const planAltFixa = montarPlanJornadaQGC({
      surveys: surveysAltFixa,
      pontoDecolagem,
      altitudeInicialMetros: aglDesejadaMetros,
      lastDoJumpId: doJumpIdAf,
    });

    jornadas.push({
      idJornada,
      indiceJornada: jIdx + 1,
      pontoDecolagemSugerido: {
        latitude: pontoDecolagem[0],
        longitude: pontoDecolagem[1],
        altitudeRelativaMetros: aglDesejadaMetros,
        statusConfirmacao: "sugestao_a_confirmar_em_campo",
        observacao:
          "Centro do primeiro polígono do grupo sugerido como ponto de decolagem inicial; " +
          "DEVE ser confirmado e ajustado em campo pelo piloto conforme acesso viário e horizonte livre.",
      },
      nomeArquivoTerrainFollow: `${prefixoNomeArquivo}${idJornada.toLowerCase()}_terrainfollow.plan`,
      nomeArquivoAltFixa: `${prefixoNomeArquivo}${idJornada.toLowerCase()}_altfixa.plan`,
      planTerrainFollow,
      planAltFixa,
      poligonosRoteiro,
      distanciaTotalDeslocamentoKm,
      tempoVooTotalEstimadoMinutos: { min: tempoTotalMin, max: tempoTotalMax },
    });
  }

  // Z5: Ordena os registros cegos do intérprete alfabeticamente pelo código opaco
  registrosCegos.sort((a, b) =>
    a.codigoOpacoInterprete.localeCompare(b.codigoOpacoInterprete)
  );

  // Gera CSV do roteiro do piloto
  const cabecalhoRoteiroCsv = [
    "idJornada",
    "ordemNaJornada",
    "idPoligono",
    "codigoOpacoInterprete",
    "estratoId",
    "papelConjunto",
    "municipio",
    "codigoCar",
    "centroideLat",
    "centroideLon",
    "areaPoligonoHa",
    "formaPoligono",
    "aspectoMedidoGraus",
    "orientacaoPoligonoGraus",
    "anguloFaixasGraus",
    "anguloAdotadoGraus",
    "conflitoOrientacaoImovel",
    "desnivelMetros",
    "aglDesejadaMetros",
    "altitudeRelativaMinMetros",
    "altitudeRelativaMaxMetros",
    "distanciaDesdeAnteriorKm",
    "comprimentoVooMetros",
    "tempoVooEstimadoMinutosMin",
    "tempoVooEstimadoMinutosMax",
    "numeroTransectos",
    "cameraShots",
  ].join(",");

  const linhasRoteiroCsv = jornadas.flatMap((j) =>
    j.poligonosRoteiro.map((r) =>
      [
        r.idJornada,
        r.ordemNaJornada,
        r.idPoligono,
        r.codigoOpacoInterprete,
        r.estratoId,
        r.papelConjunto,
        `"${r.municipio}"`,
        r.codigoCar,
        r.centroideLat.toFixed(6),
        r.centroideLon.toFixed(6),
        r.areaPoligonoHa.toFixed(2),
        r.formaPoligono,
        r.aspectoMedidoGraus.toFixed(2),
        r.orientacaoPoligonoGraus.toFixed(2),
        r.anguloFaixasGraus.toFixed(2),
        r.anguloAdotadoGraus.toFixed(2),
        r.conflitoOrientacaoImovel,
        r.desnivelMetros.toFixed(2),
        r.aglDesejadaMetros.toFixed(2),
        r.altitudeRelativaMinMetros.toFixed(2),
        r.altitudeRelativaMaxMetros.toFixed(2),
        r.distanciaDesdeAnteriorKm.toFixed(3),
        r.comprimentoVooMetros.toFixed(1),
        r.tempoVooEstimadoMinutosMin.toFixed(2),
        r.tempoVooEstimadoMinutosMax.toFixed(2),
        r.numeroTransectos,
        r.cameraShots,
      ].join(",")
    )
  );
  const roteiroCsv = [cabecalhoRoteiroCsv, ...linhasRoteiroCsv].join("\n");

  // Gera CSV da tabela de autorização de proprietários (Y6)
  const cabecalhoAutorizacaoCsv = [
    "codigoPoligono",
    "idJornada",
    "ordemNaJornada",
    "codigoCar",
    "nomeProprietario",
    "municipio",
    "areaImovelHa",
    "areaPoligonoHa",
    "dataAutorizacao",
    "formaAutorizacao",
  ].join(",");

  const linhasAutorizacaoCsv = tabelaAutorizacaoProprietarios.map((a) =>
    [
      a.codigoPoligono,
      a.idJornada,
      a.ordemNaJornada,
      a.codigoCar,
      `"${a.nomeProprietario}"`,
      `"${a.municipio}"`,
      a.areaImovelHa.toFixed(2),
      a.areaPoligonoHa.toFixed(2),
      a.dataAutorizacao,
      a.formaAutorizacao,
    ].join(",")
  );
  const tabelaAutorizacaoCsv = [
    cabecalhoAutorizacaoCsv,
    ...linhasAutorizacaoCsv,
  ].join("\n");

  // Gera CSV cego do intérprete (Y5)
  const cabecalhoInterpreteCsv = [
    "codigoOpacoInterprete",
    "cameraName",
    "gsdAlvoCm",
    "aglNominalMetros",
    "areaPoligonoHa",
    "formatoEntregaOrtomosaico",
    "protocoloDelineacao",
    "dataColetaCampo",
  ].join(",");

  const linhasInterpreteCsv = registrosCegos.map((c) =>
    [
      c.codigoOpacoInterprete,
      c.cameraName,
      c.gsdAlvoCm.toFixed(1),
      c.aglNominalMetros.toFixed(2),
      c.areaPoligonoHa.toFixed(2),
      c.formatoEntregaOrtomosaico,
      c.protocoloDelineacao,
      c.dataColetaCampo,
    ].join(",")
  );
  const manifestoInterpreteCsv = [
    cabecalhoInterpreteCsv,
    ...linhasInterpreteCsv,
  ].join("\n");

  const linhasPdf: string[] = [
    "SAREL v2.0 - ROTEIRO DE CAMPO E PLANOS DE VOO NCONTROL (D16 / D21 / D26)",
    `Gerado em: ${geradoEm} | Camera: Micasense Altum | GSD alvo: ${gsdCm.toFixed(1)} cm | AGL nominal: ${aglDesejadaMetros.toFixed(2)} m`,
    `Total de poligonos: ${poligonos.length} (${(poligonos.length * 5.02).toFixed(2)} ha) | Total de jornadas: ${jornadas.length}`,
    `Status dos planos: ${ehPlanoVoavel ? "OFICIAL_VOAVEL" : "SINTETICO_NAO_VOAR (Demonstracao em bancada)"}`,
    "AVISO DE DECOLAGEM: plannedHomePosition = sugestao_a_confirmar_em_campo (ajustar conforme acesso viario).",
    "----------------------------------------------------------------------------------------------------",
  ];

  for (const j of jornadas) {
    linhasPdf.push(
      `[${j.idJornada}] Decolagem sugerida: (${j.pontoDecolagemSugerido.latitude.toFixed(5)}, ${j.pontoDecolagemSugerido.longitude.toFixed(5)}) | Deslocamento: ${j.distanciaTotalDeslocamentoKm.toFixed(2)} km | Voo: ${j.tempoVooTotalEstimadoMinutos.min.toFixed(1)}-${j.tempoVooTotalEstimadoMinutos.max.toFixed(1)} min`
    );
    for (const r of j.poligonosRoteiro) {
      linhasPdf.push(
        `  #${r.ordemNaJornada} ${r.idPoligono} (${r.estratoId}/${r.papelConjunto}) | Mun: ${r.municipio} | CAR: ${r.codigoCar.slice(0, 22)}... | Asp: ${r.aspectoMedidoGraus.toFixed(0)}g | Pol: ${r.orientacaoPoligonoGraus.toFixed(0)}g | Faixas: ${r.anguloFaixasGraus.toFixed(0)}g (curva de nivel) | Desnivel: ${r.desnivelMetros.toFixed(1)}m | T: ${r.tempoVooEstimadoMinutosMin.toFixed(1)}-${r.tempoVooEstimadoMinutosMax.toFixed(1)}m`
      );
    }
    linhasPdf.push("");
  }

  const roteiroPdfBytes = gerarPdfRoteiroJornadas(linhasPdf);

  const exportacaoInterprete = {
    registrosCegos,
    manifestoInterpreteCsv,
  };

  validarIsolamentoCegoInterprete(exportacaoInterprete);

  return {
    metadadosCampanha: {
      versaoExportador: "1.0.0",
      geradoEm,
      totalPoligonos: poligonos.length,
      areaUnitariaHa: 5.02,
      areaTotalHa: Number((poligonos.length * 5.02).toFixed(2)),
      totalJornadas: jornadas.length,
      maxPoligonosPorJornada,
      camera: "Micasense Altum",
      gsdAlvoCm: 4.0,
      aglDesejadaMetros,
      velocidadeCruzeiroPlanMs: 15,
      velocidadeEfetivaMedidaMs: [8.7, 9.2],
      ressalvasTerrenoGLO30: RESSALVAS_TERRENO_GLO30,
      ehPlanoSinteticoDemonstracao: !ehPlanoVoavel,
    },
    exportacaoPiloto: {
      jornadas,
      tabelaAutorizacaoProprietarios,
      roteiroCsv,
      tabelaAutorizacaoCsv,
      roteiroPdfBytes,
      mapaChaveSecretaPilotoInterprete,
    },
    exportacaoInterprete,
  };
}
