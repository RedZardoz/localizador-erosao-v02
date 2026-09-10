import Papa from "papaparse";
import JSZip from "jszip";
import { kml as kmlToGeoJSON } from "@tmcw/togeojson";
import { AOIPolygon, ErosionPoint, SeverityLevel, SoilType } from "@/types/erosion";
import { countPointsOutsideParana } from "./geoUtils";

export interface ParsedDataResult {
  points?: ErosionPoint[];
  polygons?: AOIPolygon[];
  summary: {
    totalFeatures: number;
    detectedColumns: string[];
    geometryType: "Point" | "Polygon" | "MultiPolygon" | "Mixed";
    bounds?: [[number, number], [number, number]];
    pointsOutsideParana?: number;
  };
}

/**
 * Finds latitude and longitude key names in any arbitrary row object
 */
function findCoordKeys(row: Record<string, any>): { latKey?: string; lngKey?: string } {
  const keys = Object.keys(row);
  const latPatterns = /^(lat|latitude|lat_dec|y|ycoord|lat_dd|northing)$/i;
  const lngPatterns = /^(lon|lng|long|longitude|lon_dec|x|xcoord|lon_dd|easting)$/i;

  const latKey = keys.find((k) => latPatterns.test(k.trim().toLowerCase()));
  const lngKey = keys.find((k) => lngPatterns.test(k.trim().toLowerCase()));

  return { latKey, lngKey };
}

/**
 * Parses uploaded CSV files with automatic delimiter and column detection
 */
export async function parseCSV(fileContent: string, fileName: string): Promise<ParsedDataResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          return reject(new Error("O arquivo CSV está vazio ou com formato inválido."));
        }

        const firstRow = results.data[0] as Record<string, any>;
        const { latKey, lngKey } = findCoordKeys(firstRow);

        if (!latKey || !lngKey) {
          return reject(
            new Error(
              `Colunas de coordenadas não identificadas no CSV. Certifique-se de incluir cabeçalhos como 'latitude'/'longitude' ou 'lat'/'lng'. Colunas detectadas: [${Object.keys(
                firstRow
              ).join(", ")}]`
            )
          );
        }

        const points: ErosionPoint[] = [];
        let minLat = Infinity,
          maxLat = -Infinity,
          minLng = Infinity,
          maxLng = -Infinity;

        results.data.forEach((rowRaw, index) => {
          const row = rowRaw as Record<string, any>;
          const lat = parseFloat(String(row[latKey]).replace(",", "."));
          const lng = parseFloat(String(row[lngKey]).replace(",", "."));

          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return; // Skip invalid row
          }

          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;

          // Rastreia quais campos NÃO vieram do arquivo original e tiveram que
          // ser preenchidos com um valor padrão — evita que um ponto pareça
          // "medido" quando na verdade é uma suposição do parser.
          const estimatedFields: string[] = [];
          const hasCol = (...names: string[]) => names.some((n) => row[n] !== undefined && row[n] !== null && row[n] !== "");

          if (!hasCol("slope", "declividade", "decliv")) estimatedFields.push("slopePercent");
          if (!hasCol("bsi", "indice_solo")) estimatedFields.push("bsi");
          if (!hasCol("severity", "severidade")) estimatedFields.push("severity");
          if (!hasCol("priority", "score")) estimatedFields.push("priorityScore");
          if (!hasCol("soil_loss", "perda_solo")) estimatedFields.push("estimatedSoilLoss");

          const slope = parseFloat(row.slope || row.declividade || row.decliv || 15);
          const bsi = parseFloat(row.bsi || row.indice_solo || 0.4);
          const severityRaw = String(row.severity || row.severidade || "Alta");
          const severity: SeverityLevel = severityRaw.includes("Crit") || severityRaw.includes("Crít")
            ? "Crítica"
            : severityRaw.includes("Mod")
            ? "Moderada"
            : "Alta";

          const id = String(row.id || row.codigo || `CUST-${String(index + 1).padStart(3, "0")}`);
          const name = String(row.name || row.nome || row.local || `Ponto ${id}`);
          const municipality = String(row.municipality || row.municipio || row.cidade || "Paraná");
          const watershed = String(row.watershed || row.bacia || row.bacia_hidrografica || "Bacia Local");
          const soilType = (row.soil || row.solo || row.tipo_solo || "Latossolo Vermelho") as SoilType;

          points.push({
            id,
            code: id,
            name,
            latitude: lat,
            longitude: lng,
            elevation: parseFloat(row.elevation || row.altitude || row.alt || 500),
            slopePercent: Number(slope.toFixed(1)),
            slopeDegrees: Number(((Math.atan(slope / 100) * 180) / Math.PI).toFixed(1)),
            bsi: Number(bsi.toFixed(2)),
            ndvi: parseFloat(row.ndvi || 0.35),
            municipality,
            state: String(row.state || row.estado || row.uf || "PR"),
            macroRegion: String(row.region || row.regiao || "Personalizada"),
            watershed,
            soilType,
            featureType: String(row.feature_type || row.tipo_erosao || row.tipo || "Erosão Laminar Severa"),
            severity,
            estimatedSoilLoss: parseFloat(row.soil_loss || row.perda_solo || (slope * 2.1).toFixed(1)),
            priorityScore: Math.min(100, Math.max(10, Math.round(parseFloat(row.priority || row.score || 65)))),
            detectionDate: String(row.date || row.data || new Date().toISOString().slice(0, 10)),
            notes: String(row.notes || row.observacao || "Importado via arquivo CSV"),
            isCustom: true,
            dataProvenance: "user-upload",
            estimatedFields: estimatedFields.length > 0 ? estimatedFields : undefined,
          });
        });

        if (points.length === 0) {
          return reject(new Error("Nenhum ponto com coordenadas válidas (EPSG:4326 WGS84) foi extraído do CSV."));
        }

        resolve({
          points,
          summary: {
            totalFeatures: points.length,
            detectedColumns: Object.keys(firstRow),
            geometryType: "Point",
            bounds: minLat !== Infinity ? [[minLng, minLat], [maxLng, maxLat]] : undefined,
            pointsOutsideParana: countPointsOutsideParana(points),
          },
        });
      },
      error: (err: any) => reject(new Error(`Falha ao ler CSV: ${err?.message || err}`)),
    });
  });
}

/**
 * Parses GeoJSON files supporting both Points (Erosion points) and Polygons (AOI / Watersheds)
 */
export function parseGeoJSON(geojsonRaw: string | object, fileName: string): ParsedDataResult {
  let geojson: GeoJSON.FeatureCollection | GeoJSON.Feature;
  try {
    geojson = typeof geojsonRaw === "string" ? JSON.parse(geojsonRaw) : geojsonRaw;
  } catch {
    throw new Error("Arquivo GeoJSON corrompido ou formato JSON inválido.");
  }

  const features: GeoJSON.Feature[] =
    geojson.type === "FeatureCollection" ? (geojson as GeoJSON.FeatureCollection).features : [geojson as GeoJSON.Feature];

  if (!features || features.length === 0) {
    throw new Error("O GeoJSON não contém feições válidas.");
  }

  const points: ErosionPoint[] = [];
  const polygons: AOIPolygon[] = [];
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;

  features.forEach((feat, index) => {
    if (!feat.geometry) return;

    if (feat.geometry.type === "Point") {
      const [lng, lat, elev] = feat.geometry.coordinates;
      if (typeof lng !== "number" || typeof lat !== "number") return;

      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;

      const props = feat.properties || {};
      const id = String(props.id || props.code || `GEO-${String(index + 1).padStart(3, "0")}`);
      const slope = parseFloat(props.slope || props.slopePercent || props.declividade || 16);
      const bsi = parseFloat(props.bsi || props.indice_solo || 0.45);

      const estimatedFields: string[] = [];
      const hasProp = (...names: string[]) => names.some((n) => props[n] !== undefined && props[n] !== null && props[n] !== "");
      if (!hasProp("slope", "slopePercent", "declividade")) estimatedFields.push("slopePercent");
      if (!hasProp("bsi", "indice_solo")) estimatedFields.push("bsi");
      if (!hasProp("severity")) estimatedFields.push("severity");
      if (!hasProp("priorityScore")) estimatedFields.push("priorityScore");
      if (!hasProp("estimatedSoilLoss")) estimatedFields.push("estimatedSoilLoss");

      points.push({
        id,
        code: id,
        name: String(props.name || props.nome || `Ponto ${id}`),
        latitude: lat,
        longitude: lng,
        elevation: elev || parseFloat(props.elevation || props.altitude || 520),
        slopePercent: slope,
        slopeDegrees: Number(((Math.atan(slope / 100) * 180) / Math.PI).toFixed(1)),
        bsi,
        ndvi: parseFloat(props.ndvi || 0.32),
        municipality: String(props.municipality || props.municipio || "Paraná"),
        state: String(props.state || props.uf || "PR"),
        macroRegion: String(props.macroRegion || props.regiao || "Custom"),
        watershed: String(props.watershed || props.bacia || "Bacia Local"),
        soilType: (props.soilType || props.solo || "Latossolo Vermelho") as SoilType,
        featureType: String(props.featureType || props.tipo || "Erosão Laminar Severa"),
        severity: (props.severity || "Alta") as SeverityLevel,
        estimatedSoilLoss: parseFloat(props.estimatedSoilLoss || (slope * 2.2).toFixed(1)),
        priorityScore: parseFloat(props.priorityScore || 70),
        detectionDate: String(props.detectionDate || new Date().toISOString().slice(0, 10)),
        notes: String(props.notes || "Importado via GeoJSON"),
        isCustom: true,
        dataProvenance: "user-upload",
        estimatedFields: estimatedFields.length > 0 ? estimatedFields : undefined,
      });
    } else if (feat.geometry.type === "Polygon" || feat.geometry.type === "MultiPolygon") {
      polygons.push({
        id: String(feat.id || `AOI-${index + 1}`),
        name: String(feat.properties?.name || feat.properties?.nome || `Polígono AOI ${index + 1}`),
        fileName,
        geometry: feat.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
        areaKm2: feat.properties?.area_km2 || undefined,
        importedAt: new Date().toISOString(),
      });
    }
  });

  const geometryType: "Point" | "Polygon" | "MultiPolygon" | "Mixed" =
    points.length > 0 && polygons.length > 0
      ? "Mixed"
      : points.length > 0
      ? "Point"
      : polygons.length > 0
      ? "Polygon"
      : "Point";

  return {
    points: points.length > 0 ? points : undefined,
    polygons: polygons.length > 0 ? polygons : undefined,
    summary: {
      totalFeatures: points.length + polygons.length,
      detectedColumns: features[0]?.properties ? Object.keys(features[0].properties) : [],
      geometryType,
      bounds: minLat !== Infinity ? [[minLng, minLat], [maxLng, maxLat]] : undefined,
      pointsOutsideParana: points.length > 0 ? countPointsOutsideParana(points) : undefined,
    },
  };
}

/**
 * Parses KML text into GeoJSON and extracts features
 */
export function parseKML(kmlContent: string, fileName: string): ParsedDataResult {
  const parser = new DOMParser();
  const kmlDoc = parser.parseFromString(kmlContent, "text/xml");

  const parseError = kmlDoc.querySelector("parsererror");
  if (parseError) {
    throw new Error(`KML XML malformado: ${parseError.textContent}`);
  }

  const geojson = kmlToGeoJSON(kmlDoc);
  return parseGeoJSON(geojson, fileName);
}

/**
 * Parses compressed KMZ files using JSZip
 */
export async function parseKMZ(buffer: ArrayBuffer, fileName: string): Promise<ParsedDataResult> {
  const zip = await JSZip.loadAsync(buffer);
  
  // Look for doc.kml or any .kml file
  let kmlFile = zip.file("doc.kml");
  if (!kmlFile) {
    const kmlEntries = zip.file(/\.kml$/i);
    if (kmlEntries.length > 0) {
      kmlFile = kmlEntries[0];
    }
  }

  if (!kmlFile) {
    throw new Error("Nenhum arquivo KML encontrado no pacote compactado KMZ.");
  }

  const kmlText = await kmlFile.async("string");
  return parseKML(kmlText, fileName);
}
