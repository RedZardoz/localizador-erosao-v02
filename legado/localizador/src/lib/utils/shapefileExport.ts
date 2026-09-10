import JSZip from "jszip";
import { DrawnPolygon, isSyntheticPoint } from "@/types/erosion";

/**
 * Calculates geodesic/planar area (m² and ha) and perimeter (m) for a polygon ring [lng, lat][]
 */
export function calculatePolygonMetrics(coordinates: [number, number][]): {
  areaM2: number;
  areaHa: number;
  perimeterM: number;
} {
  if (!coordinates || coordinates.length < 3) {
    return { areaM2: 0, areaHa: 0, perimeterM: 0 };
  }

  // Ensure ring is closed
  const ring = [...coordinates];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }

  const R = 6378137.0; // Earth radius in meters
  const toRad = Math.PI / 180;

  // Spherical excess area calculation (accurate for small to regional polygons)
  let area = 0;
  if (ring.length > 2) {
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      area += (p2[0] - p1[0]) * toRad * (2 + Math.sin(p1[1] * toRad) + Math.sin(p2[1] * toRad));
    }
    area = Math.abs((area * R * R) / 2.0);
  }

  // Perimeter calculation using Haversine distance
  let perimeter = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    perimeter += R * c;
  }

  const areaM2 = Math.round(area * 100) / 100;
  const areaHa = Math.round((area / 10000) * 1000) / 1000;
  const perimeterM = Math.round(perimeter * 100) / 100;

  return { areaM2, areaHa, perimeterM };
}

/**
 * Ensures ring coordinates are in clockwise orientation (standard for Shapefile exterior rings)
 */
function ensureClockwise(ring: [number, number][]): [number, number][] {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    sum += (x2 - x1) * (y2 + y1);
  }
  // If sum < 0, it is counter-clockwise -> reverse it
  if (sum < 0) {
    return [...ring].reverse();
  }
  return [...ring];
}

/**
 * Generates an ESRI Shapefile Polygon (.shp, .shx, .dbf, .prj) packaged into a ZIP buffer
 */
export function generateShapefileBuffers(polygons: DrawnPolygon[]): {
  shp: Uint8Array;
  shx: Uint8Array;
  dbf: Uint8Array;
  prj: string;
} {
  const prj =
    'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]';

  if (polygons.length === 0) {
    // Return minimal valid empty shapefile
    const emptyHeader = new Uint8Array(100);
    const view = new DataView(emptyHeader.buffer);
    view.setInt32(0, 9994, false); // File Code
    view.setInt32(24, 50, false); // File length in 16-bit words (100 bytes / 2)
    view.setInt32(28, 1000, true); // Version
    view.setInt32(32, 5, true); // ShapeType: Polygon
    return {
      shp: emptyHeader,
      shx: emptyHeader,
      dbf: new Uint8Array([0x03, 26, 8, 30, 0, 0, 0, 0, 33, 0, 1, 0, 0x0d, 0x1a]),
      prj,
    };
  }

  // Calculate overall Bounding Box
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  const preparedRings: [number, number][][] = [];

  for (const poly of polygons) {
    const rawCoords = poly.geometry.coordinates[0] as [number, number][];
    let ring = [...rawCoords];
    // Ensure closed
    if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
      ring.push([ring[0][0], ring[0][1]]);
    }
    ring = ensureClockwise(ring);
    preparedRings.push(ring);

    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  // -------------------------------------------------------------
  // 1. Build .shp and .shx Binary Buffers
  // -------------------------------------------------------------
  // Calculate total byte size for .shp
  // Header: 100 bytes
  // For each record:
  //   Record Header: 8 bytes
  //   Shape Type: 4 bytes
  //   Box: 32 bytes (4 doubles)
  //   NumParts: 4 bytes (int32 = 1)
  //   NumPoints: 4 bytes (int32 = N)
  //   Parts: 4 bytes (int32 = 0)
  //   Points: N * 16 bytes (2 doubles each)
  // Total record content = 48 + N * 16 bytes
  let totalShpBytes = 100;
  const recordOffsets: number[] = [];
  const recordContentLengths: number[] = [];

  for (const ring of preparedRings) {
    recordOffsets.push(totalShpBytes);
    const contentLengthBytes = 48 + ring.length * 16;
    recordContentLengths.push(contentLengthBytes / 2); // length in 16-bit words
    totalShpBytes += 8 + contentLengthBytes;
  }

  const shpBuffer = new ArrayBuffer(totalShpBytes);
  const shpView = new DataView(shpBuffer);

  // Write SHP Header (100 bytes)
  shpView.setInt32(0, 9994, false); // File Code (big-endian)
  shpView.setInt32(24, totalShpBytes / 2, false); // File length in 16-bit words (big-endian)
  shpView.setInt32(28, 1000, true); // Version (little-endian)
  shpView.setInt32(32, 5, true); // ShapeType: 5 (Polygon, little-endian)
  shpView.setFloat64(36, minX, true); // Xmin
  shpView.setFloat64(44, minY, true); // Ymin
  shpView.setFloat64(52, maxX, true); // Xmax
  shpView.setFloat64(60, maxY, true); // Ymax
  shpView.setFloat64(68, 0.0, true); // Zmin
  shpView.setFloat64(76, 0.0, true); // Zmax
  shpView.setFloat64(84, 0.0, true); // Mmin
  shpView.setFloat64(92, 0.0, true); // Mmax

  // Write SHP Records
  let shpOffset = 100;
  preparedRings.forEach((ring, idx) => {
    const recordNum = idx + 1;
    const contentLenWords = recordContentLengths[idx];

    // Record Header (8 bytes, big-endian)
    shpView.setInt32(shpOffset, recordNum, false);
    shpView.setInt32(shpOffset + 4, contentLenWords, false);
    shpOffset += 8;

    // Record Content
    shpView.setInt32(shpOffset, 5, true); // ShapeType: Polygon (little-endian)

    // Calculate ring bbox
    let rMinX = Infinity,
      rMinY = Infinity,
      rMaxX = -Infinity,
      rMaxY = -Infinity;
    for (const [x, y] of ring) {
      if (x < rMinX) rMinX = x;
      if (y < rMinY) rMinY = y;
      if (x > rMaxX) rMaxX = x;
      if (y > rMaxY) rMaxY = y;
    }

    shpView.setFloat64(shpOffset + 4, rMinX, true);
    shpView.setFloat64(shpOffset + 12, rMinY, true);
    shpView.setFloat64(shpOffset + 20, rMaxX, true);
    shpView.setFloat64(shpOffset + 28, rMaxY, true);
    shpView.setInt32(shpOffset + 36, 1, true); // NumParts = 1
    shpView.setInt32(shpOffset + 40, ring.length, true); // NumPoints
    shpView.setInt32(shpOffset + 44, 0, true); // Part 0 index = 0

    let pointOffset = shpOffset + 48;
    for (const [x, y] of ring) {
      shpView.setFloat64(pointOffset, x, true);
      shpView.setFloat64(pointOffset + 8, y, true);
      pointOffset += 16;
    }

    shpOffset = pointOffset;
  });

  // -------------------------------------------------------------
  // 2. Build .shx Index Buffer (100 bytes header + 8 bytes per record)
  // -------------------------------------------------------------
  const totalShxBytes = 100 + polygons.length * 8;
  const shxBuffer = new ArrayBuffer(totalShxBytes);
  const shxView = new DataView(shxBuffer);

  // Write SHX Header
  shxView.setInt32(0, 9994, false);
  shxView.setInt32(24, totalShxBytes / 2, false);
  shxView.setInt32(28, 1000, true);
  shxView.setInt32(32, 5, true);
  shxView.setFloat64(36, minX, true);
  shxView.setFloat64(44, minY, true);
  shxView.setFloat64(52, maxX, true);
  shxView.setFloat64(60, maxY, true);

  // Write SHX Index Records
  let shxOffset = 100;
  for (let i = 0; i < polygons.length; i++) {
    shxView.setInt32(shxOffset, recordOffsets[i] / 2, false); // Offset in 16-bit words
    shxView.setInt32(shxOffset + 4, recordContentLengths[i], false);
    shxOffset += 8;
  }

  // -------------------------------------------------------------
  // 3. Build .dbf Table Buffer (dBase III)
  // -------------------------------------------------------------
  // Define fields:
  // ID (C, 24)
  // NOME (C, 50)
  // CATEGORIA (C, 40)
  // SEVERIDADE (C, 15)
  // AREA_HA (N, 12, 4)
  // AREA_M2 (N, 14, 2)
  // PERIM_M (N, 12, 2)
  // CRIADO_EM (C, 20)
  const fields = [
    { name: "ID", type: "C", len: 24, dec: 0 },
    { name: "NOME", type: "C", len: 50, dec: 0 },
    { name: "CATEGORIA", type: "C", len: 40, dec: 0 },
    { name: "SEVERIDADE", type: "C", len: 15, dec: 0 },
    { name: "AREA_HA", type: "N", len: 12, dec: 4 },
    { name: "AREA_M2", type: "N", len: 14, dec: 2 },
    { name: "PERIM_M", type: "N", len: 12, dec: 2 },
    { name: "CRIADO_EM", type: "C", len: 20, dec: 0 },
  ];

  const headerLength = 32 + fields.length * 32 + 1; // 32 header + 32*numFields + 0x0D terminator
  const recordLength = 1 + fields.reduce((acc, f) => acc + f.len, 0); // 1 delete flag + field lengths
  const totalDbfBytes = headerLength + polygons.length * recordLength + 1; // + 0x1A EOF

  const dbfBuffer = new ArrayBuffer(totalDbfBytes);
  const dbfView = new DataView(dbfBuffer);
  const dbfU8 = new Uint8Array(dbfBuffer);

  const now = new Date();
  dbfU8[0] = 0x03; // dBase III version
  dbfU8[1] = now.getFullYear() - 1900;
  dbfU8[2] = now.getMonth() + 1;
  dbfU8[3] = now.getDate();
  dbfView.setInt32(4, polygons.length, true); // Number of records (little-endian)
  dbfView.setInt16(8, headerLength, true); // Header length
  dbfView.setInt16(10, recordLength, true); // Record length

  // Write field descriptors
  let fieldDescOffset = 32;
  for (const f of fields) {
    // Field name (up to 10 bytes ASCII)
    const nameBytes = new TextEncoder().encode(f.name.slice(0, 10));
    for (let i = 0; i < 11; i++) {
      dbfU8[fieldDescOffset + i] = i < nameBytes.length ? nameBytes[i] : 0;
    }
    dbfU8[fieldDescOffset + 11] = f.type.charCodeAt(0);
    dbfU8[fieldDescOffset + 16] = f.len;
    dbfU8[fieldDescOffset + 17] = f.dec;
    fieldDescOffset += 32;
  }
  dbfU8[fieldDescOffset] = 0x0d; // Header terminator

  // Write DBF records
  let recordOffset = headerLength;
  for (const poly of polygons) {
    dbfU8[recordOffset] = 0x20; // 0x20 = Valid record flag (space)
    let currentFieldOffset = recordOffset + 1;

    const rowData: Record<string, string> = {
      ID: poly.id || "",
      NOME: poly.name || "Talhao sem nome",
      CATEGORIA: poly.category || "Talhão Agrícola",
      SEVERIDADE: poly.severity || "Nao informada",
      AREA_HA: (poly.areaHa || 0).toFixed(4),
      AREA_M2: (poly.areaM2 || 0).toFixed(2),
      PERIM_M: (poly.perimeterM || 0).toFixed(2),
      CRIADO_EM: poly.createdAt ? poly.createdAt.split("T")[0] : "",
    };

    for (const f of fields) {
      const valStr = rowData[f.name] || "";
      const valBytes = new TextEncoder().encode(valStr);
      for (let i = 0; i < f.len; i++) {
        // Pad strings with spaces
        dbfU8[currentFieldOffset + i] = i < valBytes.length ? valBytes[i] : 0x20;
      }
      currentFieldOffset += f.len;
    }

    recordOffset += recordLength;
  }
  dbfU8[recordOffset] = 0x1a; // File EOF terminator

  return {
    shp: new Uint8Array(shpBuffer),
    shx: new Uint8Array(shxBuffer),
    dbf: new Uint8Array(dbfBuffer),
    prj,
  };
}

/**
 * Creates a Shapefile .ZIP archive ready for download
 */
export async function exportPolygonsToShapefileZip(
  polygons: DrawnPolygon[],
  zipBaseName: string = "talhoes_erosao_parana"
): Promise<Blob> {
  const zip = new JSZip();
  const { shp, shx, dbf, prj } = generateShapefileBuffers(polygons);

  zip.file(`${zipBaseName}.shp`, shp);
  zip.file(`${zipBaseName}.shx`, shx);
  zip.file(`${zipBaseName}.dbf`, dbf);
  zip.file(`${zipBaseName}.prj`, prj);

  // Readme for QGIS/Google Earth instructions
  zip.file(
    "LEIAME_QGIS.txt",
    `Exportação de Polígonos de Erosão / Talhões — Paraná (PPGTCA 2026)\r\n` +
      `Total de Polígonos: ${polygons.length}\r\n` +
      `Sistema de Coordenadas: WGS84 (EPSG:4326)\r\n\r\n` +
      `Como abrir no QGIS:\r\n` +
      `1. Abra o QGIS.\r\n` +
      `2. Arraste o arquivo '${zipBaseName}.shp' (ou extraia a pasta) para a tela do QGIS.\r\n` +
      `3. A tabela de atributos trará a Área (ha), Perímetro (m), Categoria e Severidade.\r\n`
  );

  return await zip.generateAsync({ type: "blob" });
}

/**
 * Exports polygons to Styled KML for Google Earth 3D
 */
export function exportPolygonsToKML(
  polygons: DrawnPolygon[],
  title: string = "Talhoes e Focos de Erosao - Parana"
): string {
  const placemarks = polygons
    .map((p) => {
      const coords = p.geometry.coordinates[0] as [number, number][];
      const kmlCoordStr = coords.map(([lng, lat]) => `${lng},${lat},0`).join(" ");

      const colorHex =
        p.severity === "Crítica"
          ? "7f0000ff" // Red semi-transparent
          : p.severity === "Alta"
          ? "7f00a5ff" // Orange
          : p.severity === "Moderada"
          ? "7f00ffff" // Yellow
          : "7f10b981"; // Emerald green

      return `
    <Placemark id="${p.id}">
      <name>${escapeXml(p.name)}</name>
      <description><![CDATA[
        <h3>${escapeXml(p.name)}</h3>
        <p><b>Categoria:</b> ${escapeXml(p.category)}</p>
        <p><b>Severidade:</b> ${escapeXml(p.severity || "Não informada")}</p>
        <p><b>Área:</b> ${p.areaHa} ha (${p.areaM2.toLocaleString("pt-BR")} m²)</p>
        <p><b>Perímetro:</b> ${p.perimeterM.toLocaleString("pt-BR")} m</p>
        <p><b>Data:</b> ${p.createdAt ? p.createdAt.split("T")[0] : "-"}</p>
        <p><i>${escapeXml(p.notes || "")}</i></p>
      ]]></description>
      <Style>
        <LineStyle>
          <color>ff${colorHex.slice(2)}</color>
          <width>2.5</width>
        </LineStyle>
        <PolyStyle>
          <color>${colorHex}</color>
          <fill>1</fill>
          <outline>1</outline>
        </PolyStyle>
      </Style>
      <Polygon>
        <extrude>1</extrude>
        <altitudeMode>clampToGround</altitudeMode>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${kmlCoordStr}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(title)}</name>
    <open>1</open>
    <Folder>
      <name>Polígonos Delimitados (Talhões &amp; Erosão)</name>
      ${placemarks}
    </Folder>
  </Document>
</kml>`;
}

/**
 * Exports polygons to GeoJSON FeatureCollection
 */
export function exportPolygonsToGeoJSON(polygons: DrawnPolygon[]): string {
  const collection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: polygons.map((p) => ({
      type: "Feature",
      id: p.id,
      properties: {
        id: p.id,
        name: p.name,
        category: p.category,
        severity: p.severity,
        areaM2: p.areaM2,
        areaHa: p.areaHa,
        perimeterM: p.perimeterM,
        notes: p.notes,
        createdAt: p.createdAt,
      },
      geometry: p.geometry,
    })),
  };

  return JSON.stringify(collection, null, 2);
}

/**
 * Generates an ESRI Shapefile Point (.shp, .shx, .dbf, .prj) packaged into a ZIP buffer
 */
export function generatePointShapefileBuffers(points: any[]): {
  shp: Uint8Array;
  shx: Uint8Array;
  dbf: Uint8Array;
  prj: string;
} {
  const prj =
    'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]';

  if (points.length === 0) {
    const emptyHeader = new Uint8Array(100);
    const view = new DataView(emptyHeader.buffer);
    view.setInt32(0, 9994, false);
    view.setInt32(24, 50, false);
    view.setInt32(28, 1000, true);
    view.setInt32(32, 1, true); // ShapeType: Point
    return {
      shp: emptyHeader,
      shx: emptyHeader,
      dbf: new Uint8Array([0x03, 26, 8, 30, 0, 0, 0, 0, 33, 0, 1, 0, 0x0d, 0x1a]),
      prj,
    };
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const pt of points) {
    if (pt.longitude < minX) minX = pt.longitude;
    if (pt.latitude < minY) minY = pt.latitude;
    if (pt.longitude > maxX) maxX = pt.longitude;
    if (pt.latitude > maxY) maxY = pt.latitude;
  }

  const totalShpBytes = 100 + points.length * 28;
  const shpBuffer = new ArrayBuffer(totalShpBytes);
  const shpView = new DataView(shpBuffer);

  const totalShxBytes = 100 + points.length * 8;
  const shxBuffer = new ArrayBuffer(totalShxBytes);
  const shxView = new DataView(shxBuffer);

  for (const view of [shpView, shxView]) {
    view.setInt32(0, 9994, false);
    view.setInt32(28, 1000, true);
    view.setInt32(32, 1, true); // Shape Type 1
    view.setFloat64(36, minX, true);
    view.setFloat64(44, minY, true);
    view.setFloat64(52, maxX, true);
    view.setFloat64(60, maxY, true);
    view.setFloat64(68, 0.0, true);
    view.setFloat64(76, 0.0, true);
    view.setFloat64(84, 0.0, true);
    view.setFloat64(92, 0.0, true);
  }
  shpView.setInt32(24, totalShpBytes / 2, false);
  shxView.setInt32(24, totalShxBytes / 2, false);

  let shpOffset = 100;
  let shxOffset = 100;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const recordNumber = i + 1;
    const contentLengthWords = 10;

    shxView.setInt32(shxOffset, shpOffset / 2, false);
    shxView.setInt32(shxOffset + 4, contentLengthWords, false);
    shxOffset += 8;

    shpView.setInt32(shpOffset, recordNumber, false);
    shpView.setInt32(shpOffset + 4, contentLengthWords, false);
    shpOffset += 8;

    shpView.setInt32(shpOffset, 1, true);
    shpView.setFloat64(shpOffset + 4, pt.longitude, true);
    shpView.setFloat64(shpOffset + 12, pt.latitude, true);
    shpOffset += 20;
  }

  const fields = [
    { name: "CODE", type: "C", len: 20, dec: 0 },
    { name: "NAME", type: "C", len: 50, dec: 0 },
    { name: "MUNICIP", type: "C", len: 40, dec: 0 },
    { name: "ESTADO", type: "C", len: 4, dec: 0 },
    { name: "SEVERID", type: "C", len: 15, dec: 0 },
    { name: "SCORE", type: "N", len: 5, dec: 0 },
    { name: "ELEV_M", type: "N", len: 6, dec: 0 },
    { name: "DECL_PCT", type: "N", len: 6, dec: 2 },
    { name: "BSI", type: "N", len: 6, dec: 2 },
    { name: "NDVI", type: "N", len: 6, dec: 2 },
    { name: "PERDA_T", type: "N", len: 8, dec: 2 },
    { name: "SOLO", type: "C", len: 35, dec: 0 },
  ];

  const headerLength = 32 + fields.length * 32 + 1;
  const recordLength = 1 + fields.reduce((sum, f) => sum + f.len, 0);
  const totalDbfBytes = headerLength + points.length * recordLength + 1;

  const dbfBuffer = new ArrayBuffer(totalDbfBytes);
  const dbfView = new DataView(dbfBuffer);
  const dbfU8 = new Uint8Array(dbfBuffer);

  const now = new Date();
  dbfU8[0] = 0x03;
  dbfU8[1] = now.getFullYear() - 1900;
  dbfU8[2] = now.getMonth() + 1;
  dbfU8[3] = now.getDate();
  dbfView.setUint32(4, points.length, true);
  dbfView.setUint16(8, headerLength, true);
  dbfView.setUint16(10, recordLength, true);

  let fieldDescriptorOffset = 32;
  for (const f of fields) {
    const nameBytes = new TextEncoder().encode(f.name);
    for (let i = 0; i < 11; i++) {
      dbfU8[fieldDescriptorOffset + i] = i < nameBytes.length ? nameBytes[i] : 0;
    }
    dbfU8[fieldDescriptorOffset + 11] = f.type.charCodeAt(0);
    dbfU8[fieldDescriptorOffset + 16] = f.len;
    dbfU8[fieldDescriptorOffset + 17] = f.dec;
    fieldDescriptorOffset += 32;
  }
  dbfU8[headerLength - 1] = 0x0d;

  let recordOffset = headerLength;
  for (const pt of points) {
    dbfU8[recordOffset] = 0x20;
    let currentFieldOffset = recordOffset + 1;

    const rowData: Record<string, string> = {
      CODE: pt.code || "",
      NAME: pt.name || "",
      MUNICIP: pt.municipality || "",
      ESTADO: pt.state || "PR",
      SEVERID: pt.severity || "",
      SCORE: String(pt.priorityScore ?? 0),
      ELEV_M: String(pt.elevation ?? 0),
      DECL_PCT: (pt.slopePercent ?? 0).toFixed(2),
      BSI: (pt.bsi ?? 0).toFixed(2),
      NDVI: (pt.ndvi ?? 0).toFixed(2),
      PERDA_T: (pt.estimatedSoilLoss ?? 0).toFixed(2),
      SOLO: pt.soilType || "",
    };

    for (const f of fields) {
      const valStr = rowData[f.name] || "";
      const valBytes = new TextEncoder().encode(valStr);
      for (let i = 0; i < f.len; i++) {
        dbfU8[currentFieldOffset + i] = i < valBytes.length ? valBytes[i] : 0x20;
      }
      currentFieldOffset += f.len;
    }
    recordOffset += recordLength;
  }
  dbfU8[recordOffset] = 0x1a;

  return {
    shp: new Uint8Array(shpBuffer),
    shx: new Uint8Array(shxBuffer),
    dbf: new Uint8Array(dbfBuffer),
    prj,
  };
}

export async function exportPointsToShapefileZip(
  points: any[],
  zipBaseName: string = "pontos_erosao_parana"
): Promise<Blob> {
  const validPoints = points.filter((p) => !isSyntheticPoint(p));
  if (validPoints.length === 0 && points.length > 0) {
    throw new Error(
      "Recusa de exportação: todos os pontos selecionados possuem proveniência sintética (mock)."
    );
  }

  const zip = new JSZip();
  const { shp, shx, dbf, prj } = generatePointShapefileBuffers(validPoints);

  zip.file(`${zipBaseName}.shp`, shp);
  zip.file(`${zipBaseName}.shx`, shx);
  zip.file(`${zipBaseName}.dbf`, dbf);
  zip.file(`${zipBaseName}.prj`, prj);

  zip.file(
    "LEIAME_QGIS.txt",
    `Exportação de Focos de Erosão Laminar — Paraná (PPGTCA 2026)\r\n` +
      `Total de Focos: ${validPoints.length}\r\n` +
      `Sistema de Coordenadas: WGS84 (EPSG:4326)\r\n\r\n` +
      `Como abrir no QGIS:\r\n` +
      `1. Abra o QGIS.\r\n` +
      `2. Arraste o arquivo '${zipBaseName}.shp' (ou extraia a pasta) para a tela do QGIS.\r\n` +
      `3. A tabela de atributos traz CODE, Severidade, Score de Prioridade, BSI, NDVI, Perda de Solo (t/ha.ano) e Solo.\r\n`
  );

  return await zip.generateAsync({ type: "blob" });
}

function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
