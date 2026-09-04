import { AOIPolygon, ErosionPoint } from "@/types/erosion";
import { formatToDMS } from "./geoUtils";

/**
 * ============================================================================
 * Módulo de Exportação e Interoperabilidade SIG (GeoJSON, KML, CSV, ML Dataset)
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * Suporta interoperabilidade direta com softwares SIG profissionais e pipelines de ML:
 * - QGIS (Quantum GIS) / ArcGIS Pro (GeoJSON RFC 7946 / Shapefile)
 * - Google Earth Pro / Google Earth 3D Web (.kml com balões estilizados)
 * - Planilhas eletrônicas e KoboToolbox (.csv em UTF-8 com BOM para Excel)
 * - Dataset de Treinamento tabular para XGBoost com interpretabilidade SHAP (README §1)
 */

/**
 * Exporta os pontos amostrais e polígono de AOI no formato padronizado GeoJSON (RFC 7946).
 *
 * @param points - Conjunto de pontos filtrados ou triados
 * @param aoiPolygon - Polígono de Área de Interesse opcional
 * @returns String JSON formatada do FeatureCollection.
 */
export function exportToGeoJSON(points: ErosionPoint[], aoiPolygon?: AOIPolygon | null): string {
  const features: GeoJSON.Feature[] = points.map((p) => ({
    type: "Feature",
    id: p.id,
    properties: {
      code: p.code,
      name: p.name,
      municipality: p.municipality,
      state: p.state,
      macroRegion: p.macroRegion,
      watershed: p.watershed,
      slopePercent: p.slopePercent,
      slopeDegrees: p.slopeDegrees,
      bsi: p.bsi,
      ndvi: p.ndvi,
      soilType: p.soilType,
      featureType: p.featureType,
      severity: p.severity,
      estimatedSoilLoss_t_ha_ano: p.estimatedSoilLoss,
      priorityScore: p.priorityScore,
      elevation_m: p.elevation,
      detectionDate: p.detectionDate,
      notes: p.notes,
    },
    geometry: {
      type: "Point",
      coordinates: [p.longitude, p.latitude, p.elevation],
    },
  }));

  if (aoiPolygon) {
    features.unshift({
      type: "Feature",
      id: aoiPolygon.id,
      properties: {
        name: aoiPolygon.name,
        type: "Area_of_Interest_AOI",
        importedAt: aoiPolygon.importedAt,
      },
      geometry: aoiPolygon.geometry,
    });
  }

  const collection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features,
  };

  return JSON.stringify(collection, null, 2);
}

/**
 * Exporta os pontos para o formato KML 2.2 do Google Earth com ícones coloridos por severidade e balões HTML.
 *
 * @param points - Conjunto de pontos
 * @param aoiOrTitle - Polígono opcional de AOI ou título da camada
 * @returns Documento XML KML completo.
 */
export function exportToKML(points: ErosionPoint[], aoiOrTitle?: AOIPolygon | string | null): string {
  const getKmlColor = (severity: string) => {
    switch (severity) {
      case "Crítica":
        return "ff0000ff"; // Red
      case "Alta":
        return "ff00a5ff"; // Orange
      default:
        return "ff00ffff"; // Yellow
    }
  };

  let placemarks = points
    .map((p) => {
      const color = getKmlColor(p.severity);
      const dmsLat = formatToDMS(p.latitude, true);
      const dmsLng = formatToDMS(p.longitude, false);

      return `
    <Placemark>
      <name>${escapeXml(p.code || "")} - ${escapeXml(p.municipality || "")}</name>
      <description><![CDATA[
        <h2>${escapeXml(p.name || "")}</h2>
        <p><b>Severidade:</b> ${escapeXml(p.severity || "")}</p>
        <p><b>Score de Prioridade:</b> ${p.priorityScore} / 100</p>
        <p><b>Perda Estimada:</b> ${p.estimatedSoilLoss} t/ha·ano</p>
        <hr/>
        <p><b>Município:</b> ${escapeXml(p.municipality || "")} (${escapeXml(p.state || "")})</p>
        <p><b>Bacia Hidrográfica:</b> ${escapeXml(p.watershed || "")}</p>
        <p><b>Tipo de Solo:</b> ${escapeXml(p.soilType || "")}</p>
        <p><b>Declividade:</b> ${p.slopePercent}% (${p.slopeDegrees}°)</p>
        <p><b>BSI (Solo Exposto):</b> ${p.bsi > 0 ? "+" : ""}${p.bsi}</p>
        <p><b>NDVI:</b> ${p.ndvi}</p>
        <p><b>Altitude DEM:</b> ${p.elevation} m</p>
        <p><b>Coordenadas DMS:</b> ${dmsLat}, ${dmsLng}</p>
        <p><b>Observações:</b> <i>${escapeXml(p.notes || "")}</i></p>
      ]]></description>
      <Style>
        <IconStyle>
          <color>${color}</color>
          <scale>1.2</scale>
          <Icon>
            <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
          </Icon>
        </IconStyle>
        <LabelStyle>
          <scale>0.8</scale>
        </LabelStyle>
      </Style>
      <Point>
        <altitudeMode>clampToGround</altitudeMode>
        <coordinates>${p.longitude},${p.latitude},${p.elevation}</coordinates>
      </Point>
    </Placemark>`;
    })
    .join("\n");

  let aoiKml = "";
  if (aoiOrTitle && typeof aoiOrTitle === "object" && aoiOrTitle.geometry) {
    const coordsStr =
      aoiOrTitle.geometry.type === "Polygon"
        ? aoiOrTitle.geometry.coordinates[0].map((c: any) => `${c[0]},${c[1]},0`).join(" ")
        : "";

    if (coordsStr) {
      aoiKml = `
    <Placemark>
      <name>AOI: ${escapeXml(aoiOrTitle.name || "Área de Interesse")}</name>
      <Style>
        <LineStyle>
          <color>ffffaa00</color>
          <width>3</width>
        </LineStyle>
        <PolyStyle>
          <color>33ffaa00</color>
        </PolyStyle>
      </Style>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coordsStr}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
    }
  }

  const docTitle = typeof aoiOrTitle === "string" ? aoiOrTitle : "Focos de Erosao Laminar - Parana";

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(docTitle)}</name>
    <description>Dataset de Triagem Geoespacial e Monitoramento - PPGTCA 2026</description>
    ${aoiKml}
    ${placemarks}
  </Document>
</kml>`;
}

/**
 * Exporta a tabela tabular completa de variáveis físicas e pedológicas no formato CSV (padrão Excel com BOM).
 *
 * @param points - Conjunto de pontos
 * @returns Texto CSV codificado pronto para download.
 */
export function exportToCSV(points: ErosionPoint[]): string {
  const headers = [
    "Codigo",
    "Nome",
    "Latitude",
    "Longitude",
    "Latitude_DMS",
    "Longitude_DMS",
    "Altitude_m",
    "Municipio",
    "Estado",
    "Macrorregiao",
    "Bacia_Hidrografica",
    "Tipo_Solo",
    "Tipologia_Feicao",
    "Severidade",
    "Score_Prioridade",
    "Perda_Solo_Estimada_t_ha_ano",
    "Declividade_Percentual",
    "Declividade_Graus",
    "BSI_Solo_Exposto",
    "NDVI_Vigor_Vegetal",
    "Data_Deteccao",
    "Observacoes",
  ];

  const rows = points.map((p) => [
    `"${p.code || ""}"`,
    `"${(p.name || "").replace(/"/g, '""')}"`,
    p.latitude.toFixed(6),
    p.longitude.toFixed(6),
    `"${formatToDMS(p.latitude, true)}"`,
    `"${formatToDMS(p.longitude, false)}"`,
    p.elevation,
    `"${p.municipality || ""}"`,
    `"${p.state || ""}"`,
    `"${p.macroRegion || ""}"`,
    `"${p.watershed || ""}"`,
    `"${p.soilType || ""}"`,
    `"${p.featureType || ""}"`,
    `"${p.severity || ""}"`,
    p.priorityScore,
    p.estimatedSoilLoss,
    p.slopePercent,
    p.slopeDegrees,
    p.bsi,
    p.ndvi,
    `"${p.detectionDate || ""}"`,
    `"${(p.notes || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
  return "\uFEFF" + csvContent;
}

/**
 * Exporta dataset tabular rotulado para treinamento de Aprendizado de Máquina (XGBoost / SHAP) — README §1.
 *
 * @param points - Pontos com variáveis reais e/ou observações de campo Kobo
 * @returns CSV formatado com features de satélite/DEM e target rotulado.
 */
export function exportTrainingDatasetCSV(points: ErosionPoint[]): string {
  const headers = [
    "point_id",
    "code",
    "latitude",
    "longitude",
    "elevation_m",
    "slope_degrees",
    "slope_percent",
    "bsi",
    "ndvi",
    "soil_type",
    "stratum_id",
    "rusle_r",
    "rusle_k",
    "rusle_ls",
    "rusle_c",
    "rusle_p",
    "rusle_soil_loss_t_ha_yr",
    "priority_score",
    "severity_label",
    "data_provenance",
    "is_field_validated",
  ];

  const rows = points.map((p) => [
    `"${p.id}"`,
    `"${p.code}"`,
    p.latitude.toFixed(6),
    p.longitude.toFixed(6),
    p.elevation,
    p.slopeDegrees,
    p.slopePercent,
    p.bsi,
    p.ndvi,
    `"${p.soilType}"`,
    `"${p.stratumId || ""}"`,
    p.rusleFactors?.r ?? "",
    p.rusleFactors?.k ?? "",
    p.rusleFactors?.ls ?? "",
    p.rusleFactors?.c ?? "",
    p.rusleFactors?.p ?? "",
    p.estimatedSoilLoss,
    p.priorityScore,
    `"${p.severity}"`,
    `"${p.dataProvenance || ""}"`,
    p.dataProvenance === "field-validated" ? 1 : 0,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  return "\uFEFF" + csvContent;
}

/**
 * Dispara o download de um Blob binário (ex: XLSX) no navegador do usuário.
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Dispara o download de um arquivo de texto no navegador do usuário.
 */
export function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  downloadBlob(blob, fileName);
}

export function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}
