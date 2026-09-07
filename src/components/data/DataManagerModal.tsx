"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  MapPin,
  Pentagon,
  Download,
  Bookmark,
  Save,
  Trash2,
  Upload,
  Layers,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus,
  Eye,
  Edit2,
  Globe,
  Archive,
  ArrowRight,
  Eraser,
  Info,
  Table2,
  Zap,
  Loader2,
  AlertTriangle,
  Database,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useErosionStore, useFilteredPoints } from "@/lib/store/useErosionStore";
import { DrawnPolygon, PolygonCategory, SavedPointDataset, SeverityLevel } from "@/types/erosion";
import {
  downloadBlob,
  downloadFile,
  exportToCSV,
  exportToGeoJSON,
  exportToKML,
  exportTrainingDatasetCSV,
} from "@/lib/utils/exportUtils";
import {
  exportAuditTableCSV,
  exportAuditTableXLSX,
  generateAuditTableFileName,
  AuditTableMetadata,
  FonteDadosItem,
} from "@/lib/utils/auditTableExport";
import { enrichPointsBatch } from "@/lib/utils/batchEnrichment";
import {
  exportPolygonsToGeoJSON,
  exportPolygonsToKML,
  exportPolygonsToShapefileZip,
  exportPointsToShapefileZip,
} from "@/lib/utils/shapefileExport";
import { parseAndMatchKoboExport, KoboMatchResult } from "@/lib/utils/koboParser";
import { parseCSV, parseGeoJSON, parseKML, parseKMZ } from "@/lib/utils/parsers";

export type DataManagerTab = "points" | "polygons" | "export";

export const DataManagerModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    allPoints,
    customPoints,
    savedDatasets,
    saveDataset,
    loadDataset,
    deleteDataset,
    importDataset,
    drawnPolygons,
    selectedPolygon,
    setSelectedPolygon,
    addDrawnPolygon,
    removeDrawnPolygon,
    updateDrawnPolygon,
    setDrawingMode,
    flyToLocation,
    clearDrawnPolygons,
    activeAOIPolygon,
    setActiveAOIPolygon,
    setCustomPoints,
    activeRegion,
    updatePointWithRealData,
    updateMultiplePoints,
    applyCandidatePoints,
    clearMap,
    filters,
  } = useErosionStore();

  const [activeTab, setActiveTab] = useState<DataManagerTab>("points");

  useEffect(() => {
    if (activeModal === "polygons") setActiveTab("polygons");
    else if (activeModal === "export") setActiveTab("export");
    else if (activeModal === "saved-datasets" || activeModal === "data-manager") setActiveTab("points");
  }, [activeModal]);

  const currentPoints = useFilteredPoints();
  const [collectionName, setCollectionName] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingPolyId, setEditingPolyId] = useState<string | null>(null);
  const [editPolyName, setEditPolyName] = useState("");
  const [editPolyCategory, setEditPolyCategory] = useState<PolygonCategory>("Talhão Agrícola");
  const [editPolySeverity, setEditPolySeverity] = useState<SeverityLevel | "Nenhuma">("Nenhuma");
  const [exportingPoly, setExportingPoly] = useState(false);

  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);
  const [consolidatedSelection, setConsolidatedSelection] = useState<"filtered" | "all">("filtered");
  const [isExportingConsolidated, setIsExportingConsolidated] = useState(false);
  const [isProcessingConsolidatedBatch, setIsProcessingConsolidatedBatch] = useState(false);
  const [autoCalculateRusle, setAutoCalculateRusle] = useState(true);
  const [autoQueryTenure, setAutoQueryTenure] = useState(true);
  const [forceRecalculateConsolidated, setForceRecalculateConsolidated] = useState(false);
  const [processConsolidatedSuccess, setProcessConsolidatedSuccess] = useState<string | null>(null);
  const [processConsolidatedError, setProcessConsolidatedError] = useState<string | null>(null);
  const [enrichmentProgress, setEnrichmentProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);

  const targetConsolidatedPoints = consolidatedSelection === "filtered" ? currentPoints : allPoints;
  const hasConsolidatedTarget = targetConsolidatedPoints.length > 0;

  const rusleCalculatedCount = targetConsolidatedPoints.filter(
    (p) => p.rusleFactors && typeof p.rusleFactors.r === "number" && typeof p.estimatedSoilLoss === "number"
  ).length;

  const tenureConsultedCount = targetConsolidatedPoints.filter(
    (p) => p.tenureStatus !== undefined && p.tenureStatus !== null
  ).length;

  const tenureMatchedCount = targetConsolidatedPoints.filter(
    (p) => p.carCode || (p.tenureStatus && p.tenureStatus !== "sem-correspondencia")
  ).length;

  const handleProcessConsolidatedBatch = async () => {
    if (!hasConsolidatedTarget || isProcessingConsolidatedBatch || isExportingConsolidated) return;
    setIsProcessingConsolidatedBatch(true);
    setProcessConsolidatedSuccess(null);
    setProcessConsolidatedError(null);
    setEnrichmentProgress({
      current: 0,
      total: targetConsolidatedPoints.length,
      message: "Iniciando processamento em lote...",
    });

    try {
      const updatedPoints = await enrichPointsBatch(
        targetConsolidatedPoints,
        {
          calculateRusle: true,
          queryTenure: true,
          forceRefresh: forceRecalculateConsolidated,
        },
        (curr, total, msg) => {
          setEnrichmentProgress({ current: curr, total, message: msg });
        }
      );

      updateMultiplePoints(updatedPoints);

      const newRusleCount = updatedPoints.filter(
        (p) => p.rusleFactors && typeof p.rusleFactors.r === "number"
      ).length;
      const newMatchedCount = updatedPoints.filter(
        (p) => p.carCode || (p.tenureStatus && p.tenureStatus !== "sem-correspondencia")
      ).length;

      setProcessConsolidatedSuccess(
        `Processamento concluído com sucesso! ${updatedPoints.length} focos enriquecidos (${newRusleCount} com RUSLE calculada, ${newMatchedCount} associados a imóveis rurais CAR/INCRA).`
      );
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => setProcessConsolidatedSuccess(null), 8000);
    } catch (err: any) {
      console.error("[DataManagerModal] Erro ao processar dados em lote:", err);
      setProcessConsolidatedError(
        err?.message || "Ocorreu uma falha no processamento dos cálculos em lote. Verifique se o servidor local está ativo."
      );
    } finally {
      setIsProcessingConsolidatedBatch(false);
      setEnrichmentProgress(null);
    }
  };

  const handleExportConsolidated = async (format: "xlsx" | "csv") => {
    if (!hasConsolidatedTarget) return;
    setIsExportingConsolidated(true);
    setProcessConsolidatedSuccess(null);
    setProcessConsolidatedError(null);
    setEnrichmentProgress(null);

    try {
      let finalPoints = targetConsolidatedPoints;

      if (autoCalculateRusle || autoQueryTenure) {
        setEnrichmentProgress({
          current: 0,
          total: targetConsolidatedPoints.length,
          message: "Verificando dados e aplicando cálculos pré-exportação...",
        });

        finalPoints = await enrichPointsBatch(
          targetConsolidatedPoints,
          {
            calculateRusle: autoCalculateRusle,
            queryTenure: autoQueryTenure,
            forceRefresh: forceRecalculateConsolidated,
          },
          (curr, total, msg) => {
            setEnrichmentProgress({ current: curr, total, message: msg });
          }
        );

        // Atualiza os pontos no estado global do mapa/aplicação
        updateMultiplePoints(finalPoints);
      }

      if (format === "xlsx") {
        let fontesDados: FonteDadosItem[] | null = null;
        try {
          const res = await fetch("/api/fundiario/fontes");
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
              fontesDados = json.data;
            }
          }
        } catch (e) {
          console.warn("[Export] Falha ao consultar /api/fundiario/fontes:", e);
        }

        const meta: AuditTableMetadata = {
          isFiltered: consolidatedSelection === "filtered",
          totalLoaded: allPoints.length,
          exportedCount: finalPoints.length,
          activeRegion: activeRegion.name,
          activeSeverities: filters.selectedSeverities,
          topN: filters.topN,
          aoiName: activeAOIPolygon ? (activeAOIPolygon.name || activeAOIPolygon.fileName) : null,
          fontesDados,
        };

        const blob = await exportAuditTableXLSX(finalPoints, meta);
        const fileName = generateAuditTableFileName(activeRegion.name, finalPoints.length, "xlsx");
        downloadBlob(blob, fileName);
        setDownloadedFormat("TABELA CONSOLIDADA (XLSX)");
      } else {
        const content = exportAuditTableCSV(finalPoints);
        const fileName = generateAuditTableFileName(activeRegion.name, finalPoints.length, "csv");
        downloadFile(content, fileName, "text/csv;charset=utf-8;");
        setDownloadedFormat("TABELA CONSOLIDADA (CSV)");
      }

      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      setTimeout(() => setDownloadedFormat(null), 3500);
    } catch (err: any) {
      console.error("[DataManagerModal] Erro ao exportar tabela consolidada:", err);
      setProcessConsolidatedError(
        `Erro na exportação: ${err?.message || "Falha inesperada ao gerar arquivo. Tente novamente."}`
      );
    } finally {
      setIsExportingConsolidated(false);
      setEnrichmentProgress(null);
    }
  };

  const isModalOpen =
    activeModal === "data-manager" ||
    activeModal === "saved-datasets" ||
    activeModal === "polygons" ||
    activeModal === "export";

  if (!isModalOpen) return null;

  const handleClearMap = () => {
    const totalItems = currentPoints.length + drawnPolygons.length;
    const msg =
      totalItems > 0
        ? `Deseja realmente zerar o mapa em tela? Isso removerá ${currentPoints.length} foco(s) e ${drawnPolygons.length} talhão(ões) visíveis no mapa.

(Seus projetos salvos no navegador continuarão preservados).`
        : "Deseja resetar a visualização e filtros do mapa?";

    if (confirm(msg)) {
      clearMap();
      setImportSuccess("Mapa zerado com sucesso! Área de trabalho limpa para nova amostragem ou projeto.");
      setTimeout(() => setImportSuccess(null), 4000);
    }
  };

  const handleSaveCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPoints.length === 0) return;

    const defaultName = `Coleção ${activeAOIPolygon?.name || activeRegion.name} (${currentPoints.length} focos) - ${new Date().toLocaleDateString("pt-BR")}`;
    const finalName = collectionName.trim() || defaultName;

    saveDataset(finalName, collectionDescription);
    setSaveSuccessMsg(`Coleção "${finalName}" salva com sucesso!`);
    setCollectionName("");
    setCollectionDescription("");
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleExportJSON = (dataset: SavedPointDataset) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataset, null, 2));
    downloadFile(dataStr, `projeto_erosao_${dataset.name.toLowerCase().replace(/\s+/g, "_")}.json`, "application/json");
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    try {
      const fileNameLower = file.name.toLowerCase();

      if (fileNameLower.endsWith(".json") || fileNameLower.endsWith(".geojson")) {
        const text = await file.text();
        const json = JSON.parse(text);

        if (json.points && Array.isArray(json.points)) {
          // Arquivo de coleção/projeto do Localizador de Erosão
          importDataset(json);
          setImportSuccess(`Coleção "${json.name || file.name}" (${json.points.length} focos) importada e carregada no mapa!`);
          setTimeout(() => setActiveModal(null), 1400);
          return;
        }

        // Se for GeoJSON com features
        const parsed = parseGeoJSON(json, file.name);
        if (parsed.points && parsed.points.length > 0) {
          setCustomPoints(parsed.points);
          saveDataset(`Importação GeoJSON - ${file.name}`, `Importado em ${new Date().toLocaleDateString("pt-BR")}`);
          if (parsed.polygons && parsed.polygons.length > 0) {
            setActiveAOIPolygon(parsed.polygons[0]);
          }
          if (parsed.summary.bounds) {
            const [[minLng, minLat], [maxLng, maxLat]] = parsed.summary.bounds;
            flyToLocation({
              lat: (minLat + maxLat) / 2,
              lng: (minLng + maxLng) / 2,
              zoom: parsed.points.length > 50 ? 7.5 : 11,
              pitch: 45,
            });
          }
          setImportSuccess(`${parsed.points.length} focos importados do GeoJSON e exibidos no mapa!`);
          setTimeout(() => setActiveModal(null), 1400);
          return;
        } else if (parsed.polygons && parsed.polygons.length > 0) {
          setActiveAOIPolygon(parsed.polygons[0]);
          setImportSuccess(`Polígono AOI "${parsed.polygons[0].name}" carregado com sucesso!`);
          return;
        } else {
          throw new Error("Nenhum ponto ou polígono válido encontrado no arquivo GeoJSON.");
        }
      } else if (fileNameLower.endsWith(".csv")) {
        const text = await file.text();

        // Tenta primeiro importar como CSV de pontos de erosão
        try {
          const parsedCsv = await parseCSV(text, file.name);
          if (parsedCsv.points && parsedCsv.points.length > 0) {
            setCustomPoints(parsedCsv.points);
            saveDataset(`Importação CSV - ${file.name}`, `Importado em ${new Date().toLocaleDateString("pt-BR")}`);
            if (parsedCsv.summary.bounds) {
              const [[minLng, minLat], [maxLng, maxLat]] = parsedCsv.summary.bounds;
              flyToLocation({
                lat: (minLat + maxLat) / 2,
                lng: (minLng + maxLng) / 2,
                zoom: parsedCsv.points.length > 50 ? 7.5 : 11,
                pitch: 45,
              });
            }
            setImportSuccess(`${parsedCsv.points.length} focos importados do CSV e exibidos no mapa!`);
            setTimeout(() => setActiveModal(null), 1400);
            return;
          }
        } catch {
          // Se não tiver colunas de coordenadas de pontos, tenta compatibilização com KoboToolbox
        }

        // Fallback: pareamento de campo KoboToolbox
        const koboRes = parseAndMatchKoboExport(text, allPoints);
        if (koboRes.matched.length > 0) {
          koboRes.matched.forEach((m: KoboMatchResult) => {
            updatePointWithRealData(m.matchedPointId, {
              dataProvenance: "field-validated",
              fieldObservations: m.fieldObservations,
              fieldValidatedAt: new Date().toISOString(),
            });
          });
          setImportSuccess(`${koboRes.matched.length} pontos casados e validados com observações do KoboToolbox!`);
        } else {
          setImportError("Planilha CSV processada, mas não contém colunas de coordenadas (lat/lng) nem coincidiu com focos existentes via KoboToolbox.");
        }
      } else if (fileNameLower.endsWith(".kml")) {
        const text = await file.text();
        const parsedKml = parseKML(text, file.name);
        if (parsedKml.points && parsedKml.points.length > 0) {
          setCustomPoints(parsedKml.points);
          saveDataset(`Importação KML - ${file.name}`, `Importado em ${new Date().toLocaleDateString("pt-BR")}`);
          if (parsedKml.summary.bounds) {
            const [[minLng, minLat], [maxLng, maxLat]] = parsedKml.summary.bounds;
            flyToLocation({
              lat: (minLat + maxLat) / 2,
              lng: (minLng + maxLng) / 2,
              zoom: parsedKml.points.length > 50 ? 7.5 : 11,
              pitch: 45,
            });
          }
          setImportSuccess(`${parsedKml.points.length} focos importados do KML e exibidos no mapa!`);
          setTimeout(() => setActiveModal(null), 1400);
        } else if (parsedKml.polygons && parsedKml.polygons.length > 0) {
          setActiveAOIPolygon(parsedKml.polygons[0]);
          setImportSuccess(`Polígono AOI "${parsedKml.polygons[0].name}" carregado com sucesso!`);
        }
      } else if (fileNameLower.endsWith(".kmz")) {
        const buffer = await file.arrayBuffer();
        const parsedKmz = await parseKMZ(buffer, file.name);
        if (parsedKmz.points && parsedKmz.points.length > 0) {
          setCustomPoints(parsedKmz.points);
          saveDataset(`Importação KMZ - ${file.name}`, `Importado em ${new Date().toLocaleDateString("pt-BR")}`);
          if (parsedKmz.summary.bounds) {
            const [[minLng, minLat], [maxLng, maxLat]] = parsedKmz.summary.bounds;
            flyToLocation({
              lat: (minLat + maxLat) / 2,
              lng: (minLng + maxLng) / 2,
              zoom: parsedKmz.points.length > 50 ? 7.5 : 11,
              pitch: 45,
            });
          }
          setImportSuccess(`${parsedKmz.points.length} focos importados do KMZ e exibidos no mapa!`);
          setTimeout(() => setActiveModal(null), 1400);
        } else if (parsedKmz.polygons && parsedKmz.polygons.length > 0) {
          setActiveAOIPolygon(parsedKmz.polygons[0]);
          setImportSuccess(`Polígono AOI "${parsedKmz.polygons[0].name}" carregado com sucesso!`);
        }
      }
    } catch (err: any) {
      setImportError(`Falha ao importar arquivo: ${err.message || err}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const totalAreaHa = drawnPolygons.reduce((acc, p) => acc + (p.areaHa || 0), 0);
  const totalAreaM2 = drawnPolygons.reduce((acc, p) => acc + (p.areaM2 || 0), 0);

  const handleStartDraw = () => {
    setActiveModal(null);
    setDrawingMode(true);
  };

  const handleFlyToPolygon = (poly: DrawnPolygon) => {
    const coords = poly.geometry.coordinates[0] as [number, number][];
    if (coords && coords.length > 0) {
      let minLat = 90,
        maxLat = -90,
        minLng = 180,
        maxLng = -180;
      coords.forEach(([lng, lat]) => {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      });
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;

      setActiveModal(null);
      flyToLocation({
        lat: centerLat,
        lng: centerLng,
        zoom: 17.5,
        pitch: 50,
      });
    }
  };

  const handleExportPolygonShapefile = async (poly?: DrawnPolygon) => {
    setExportingPoly(true);
    try {
      const targets = poly ? [poly] : drawnPolygons;
      const name = poly ? `talhao_${poly.name.toLowerCase().replace(/\s+/g, "_")}` : `talhoes_grupo_${drawnPolygons.length}`;
      const blob = await exportPolygonsToShapefileZip(targets, name);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name}_shp.zip`;
      link.click();
      URL.revokeObjectURL(url);
      setImportSuccess(`Shapefile (.zip) gerado com sucesso para ${targets.length} talhão(ões)!`);
      setTimeout(() => setImportSuccess(null), 4000);
    } catch (err: any) {
      setImportError(`Erro ao gerar Shapefile: ${err.message || err}`);
    } finally {
      setExportingPoly(false);
    }
  };

  const handleExportPolygonKML = (poly?: DrawnPolygon) => {
    const targets = poly ? [poly] : drawnPolygons;
    const name = poly ? `talhao_${poly.name.toLowerCase().replace(/\s+/g, "_")}` : `talhoes_grupo_${drawnPolygons.length}`;
    const kml = exportPolygonsToKML(targets, `Talhões - ${activeRegion.name}`);
    downloadFile(kml, `${name}.kml`, "application/vnd.google-earth.kml+xml");
  };

  const handleExportPolygonGeoJSON = (poly?: DrawnPolygon) => {
    const targets = poly ? [poly] : drawnPolygons;
    const name = poly ? `talhao_${poly.name.toLowerCase().replace(/\s+/g, "_")}` : `talhoes_grupo_${drawnPolygons.length}`;
    const geojson = exportPolygonsToGeoJSON(targets);
    downloadFile(geojson, `${name}.geojson`, "application/geo+json");
  };

  const handleExportPoints = async (format: "shapefile" | "geojson" | "kml" | "csv" | "training") => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const baseName = `triagem_erosao_${activeRegion.state.toLowerCase()}_${currentPoints.length}_focos_${timestamp}`;

    if (format === "shapefile") {
      const blob = await exportPointsToShapefileZip(currentPoints, baseName);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${baseName}_shp.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === "geojson") {
      const content = exportToGeoJSON(currentPoints, activeAOIPolygon);
      downloadFile(content, `${baseName}.geojson`, "application/geo+json");
    } else if (format === "kml") {
      const content = exportToKML(currentPoints, `Triagem Erosão - ${activeRegion.name}`);
      downloadFile(content, `${baseName}.kml`, "application/vnd.google-earth.kml+xml");
    } else if (format === "csv") {
      const content = exportToCSV(currentPoints);
      downloadFile(content, `${baseName}.csv`, "text/csv;charset=utf-8;");
    } else if (format === "training") {
      const content = exportTrainingDatasetCSV(allPoints);
      downloadFile(content, `dataset_treinamento_xgboost_${timestamp}.csv`, "text/csv;charset=utf-8;");
    }

    confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
    setDownloadedFormat(format);
    setTimeout(() => setDownloadedFormat(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 ring-1 ring-emerald-400/30">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Gestor de Dados Espaciais &amp; Projetos
                <span className="text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                  Pontos • Talhões • SIG
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Centralize o salvamento, carregamento, delimitação e exportação em Shapefile, KML, GeoJSON e CSV.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/30 flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => setActiveTab("points")}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "points"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Focos &amp; Pontos</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-black/20 rounded-full">
                {currentPoints.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("polygons")}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "polygons"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <Pentagon className="w-4 h-4" />
              <span>Polígonos &amp; Talhões</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-black/20 rounded-full">
                {drawnPolygons.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("export")}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "export"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Central de Exportação SIG</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Zerar Mapa em Tela */}
            <button
              onClick={handleClearMap}
              className="h-8 px-3 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Zerar todos os focos amostrais e talhões visíveis no mapa em tela"
            >
              <Eraser className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Zerar Mapa</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json,.geojson,.csv,.kml,.kmz"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-8 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Importar projeto (.json), pontos (GeoJSON/KML/CSV) ou dados de campo (Kobo)"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Importar Arquivo</span>
            </button>
          </div>
        </div>

        {importSuccess && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {importSuccess}
          </div>
        )}
        {importError && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800 dark:text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            {importError}
          </div>
        )}

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {activeTab === "points" && (
            <div className="space-y-5">
              {currentPoints.length === 0 && (
                <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-center gap-2.5">
                  <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      O mapa está limpo / zerado no momento
                    </h4>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                      Nenhum foco está sendo exibido na tela. Carregue uma coleção salva abaixo ou importe um arquivo de dados.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Save className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Salvar Seleção Atual de Pontos ({currentPoints.length} focos)
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {activeAOIPolygon ? `AOI: ${activeAOIPolygon.name}` : activeRegion.name} ({activeRegion.state})
                  </span>
                </div>

                <form onSubmit={handleSaveCollection} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Nome do Projeto / Coleção:
                      </label>
                      <input
                        type="text"
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                        placeholder={`Ex: Triagem ${activeRegion.name} - Campanha 2026`}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Observações / Finalidade:
                      </label>
                      <input
                        type="text"
                        value={collectionDescription}
                        onChange={(e) => setCollectionDescription(e.target.value)}
                        placeholder="Ex: Pontos prioritários com declividade > 12% para coleta RTK"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {saveSuccessMsg ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        {saveSuccessMsg}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        O projeto será salvo no navegador e poderá ser exportado em .json.
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={currentPoints.length === 0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      Salvar Coleção
                    </button>
                  </div>
                </form>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Projetos &amp; Coleções Salvas no Navegador ({savedDatasets.length})
                  </h3>
                </div>

                {savedDatasets.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <Bookmark className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                    <p className="font-semibold">Nenhuma coleção salva no navegador ainda.</p>
                    <p className="text-[11px]">Use o formulário acima para salvar a seleção ativa de pontos.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedDatasets.map((ds) => (
                      <div
                        key={ds.id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 hover:border-emerald-500/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{ds.name}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {ds.description || "Sem observações"}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded shrink-0">
                            {ds.points?.length ?? ds.pointsCount ?? 0} focos
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200 dark:border-slate-800">
                          <span>{new Date(ds.createdAt || ds.updatedAt || Date.now()).toLocaleDateString("pt-BR")}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                loadDataset(ds.id);
                                setActiveModal(null);
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-sans font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Carregar pontos no mapa e enquadrar"
                            >
                              <ArrowRight className="w-3 h-3" />
                              Carregar
                            </button>
                            <button
                              onClick={() => handleExportJSON(ds)}
                              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Exportar arquivo .json do projeto"
                            >
                              <FileJson className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja excluir a coleção "${ds.name}"?`)) {
                                  deleteDataset(ds.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Excluir coleção"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Exportar Focos Ativos ({currentPoints.length} pontos) para SIG:
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleExportPoints("shapefile")}
                    className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all group cursor-pointer"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      Shapefile (.zip)
                      <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">SHP, SHX, DBF e PRJ para QGIS</p>
                  </button>

                  <button
                    onClick={() => handleExportPoints("kml")}
                    className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all group cursor-pointer"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      KML (Google Earth)
                      <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Balões 3D e cores por severidade</p>
                  </button>

                  <button
                    onClick={() => handleExportPoints("geojson")}
                    className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all group cursor-pointer"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      GeoJSON (RFC 7946)
                      <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">FeatureCollection universal</p>
                  </button>

                  <button
                    onClick={() => handleExportPoints("csv")}
                    className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all group cursor-pointer"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      Planilha CSV
                      <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">UTF-8 BOM para Excel</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "polygons" && (
            <div className="space-y-5">
              <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Pentagon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Gestão de Talhões &amp; Áreas Poligonais
                  </h3>
                  <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
                    Total de {drawnPolygons.length} talhão(ões) • Área Acumulada: <b>{totalAreaHa.toFixed(2)} ha</b> ({totalAreaM2.toLocaleString("pt-BR")} m²)
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleStartDraw}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Delimitar Novo Talhão no Mapa
                  </button>

                  {drawnPolygons.length > 0 && (
                    <button
                      onClick={() => handleExportPolygonShapefile()}
                      disabled={exportingPoly}
                      className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Exportar todos os talhões em um único Shapefile .ZIP"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Shapefile Grupo ({drawnPolygons.length})
                    </button>
                  )}
                </div>
              </div>

              {drawnPolygons.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-500 dark:text-slate-400 space-y-2">
                  <Pentagon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                  <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                    Nenhum talhão delimitado no mapa ainda.
                  </p>
                  <p className="text-[11px] max-w-md mx-auto">
                    Clique em <b>&quot;Delimitar Novo Talhão no Mapa&quot;</b> para desenhar polígonos sobre imagens de alta definição (Zoom 19) com cálculo instantâneo de hectares e perímetro.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Talhões Cadastrados ({drawnPolygons.length}):
                    </span>
                    <button
                      onClick={() => {
                        if (confirm("Deseja apagar todos os talhões delimitados?")) clearDrawnPolygons();
                      }}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Limpar Todos os Talhões
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {drawnPolygons.map((poly) => {
                      const isEditing = editingPolyId === poly.id;

                      return (
                        <div
                          key={poly.id}
                          className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 hover:border-indigo-500/40 transition-colors"
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editPolyName}
                                onChange={(e) => setEditPolyName(e.target.value)}
                                className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  value={editPolyCategory}
                                  onChange={(e) => setEditPolyCategory(e.target.value as any)}
                                  className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                                >
                                  <option value="Talhão Agrícola">Talhão Agrícola</option>
                                  <option value="Área de Preservação / RL">Preservação / RL</option>
                                  <option value="Solo Exposto">Solo Exposto</option>
                                  <option value="Bacia / Microbacia">Microbacia</option>
                                  <option value="Área Crítica">Área Crítica</option>
                                </select>
                                <select
                                  value={editPolySeverity}
                                  onChange={(e) => setEditPolySeverity(e.target.value as any)}
                                  className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                                >
                                  <option value="Nenhuma">Sem Severidade</option>
                                  <option value="Moderada">Moderada</option>
                                  <option value="Alta">Alta</option>
                                  <option value="Crítica">Crítica</option>
                                </select>
                              </div>
                              <div className="flex justify-end gap-1.5 pt-1">
                                <button
                                  onClick={() => setEditingPolyId(null)}
                                  className="px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => {
                                    updateDrawnPolygon(poly.id, {
                                      name: editPolyName,
                                      category: editPolyCategory,
                                      severity: editPolySeverity === "Nenhuma" ? undefined : editPolySeverity,
                                    });
                                    setEditingPolyId(null);
                                  }}
                                  className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded"
                                >
                                  Salvar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {poly.name}
                                  </h4>
                                  <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">
                                    {poly.category} {poly.severity ? `• ${poly.severity}` : ""}
                                  </span>
                                </div>
                                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
                                  {poly.areaHa} ha
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200 dark:border-slate-800">
                                <span>Perímetro: {poly.perimeterM?.toLocaleString("pt-BR")} m</span>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleFlyToPolygon(poly)}
                                    className="p-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                                    title="Localizar e voar para este talhão no mapa (Z19)"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleExportPolygonShapefile(poly)}
                                    className="p-1 text-slate-600 dark:text-slate-300 hover:text-emerald-600 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                                    title="Exportar Shapefile (.zip) deste talhão"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingPolyId(poly.id);
                                      setEditPolyName(poly.name);
                                      setEditPolyCategory(poly.category);
                                      setEditPolySeverity(poly.severity || "Nenhuma");
                                    }}
                                    className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Editar nome e categoria"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Deseja excluir o talhão "${poly.name}"?`)) removeDrawnPolygon(poly.id);
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title="Excluir talhão"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "export" && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Interoperabilidade com Softwares SIG Profissionais
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Exportação instantânea de focos amostrais ({currentPoints.length} pts) e talhões ({drawnPolygons.length} polígonos) para QGIS, ArcGIS e Google Earth.
                  </p>
                </div>
                {downloadedFormat && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Exportado com sucesso!
                  </span>
                )}
              </div>

              {/* Card de Destaque Pericial: Tabela Consolidada */}
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border-2 border-emerald-500/40 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                      <Table2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Tabela Consolidada
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-semibold">
                          Pericial • PPGTCA 2026
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Exportação tabular completa com 54 colunas, rastreabilidade do laudo pericial, máscara oficial do SNCR e aba de metadados das fontes.
                      </p>
                    </div>
                  </div>

                  {/* Seletor de Escopo: Filtrados vs Todos */}
                  <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setConsolidatedSelection("filtered")}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                        consolidatedSelection === "filtered"
                          ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      Focos Atuais ({currentPoints.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setConsolidatedSelection("all")}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                        consolidatedSelection === "all"
                          ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      Todos Carregados ({allPoints.length})
                    </button>
                  </div>
                </div>

                {/* Painel de Diagnóstico do Estado dos Dados no Escopo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Badge RUSLE */}
                  <div
                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition-colors ${
                      rusleCalculatedCount === targetConsolidatedPoints.length && targetConsolidatedPoints.length > 0
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[11px] uppercase tracking-wide">Equação RUSLE</span>
                      {rusleCalculatedCount === targetConsolidatedPoints.length && targetConsolidatedPoints.length > 0 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-sm font-black">
                      {rusleCalculatedCount} / {targetConsolidatedPoints.length}
                      <span className="text-[10px] font-normal ml-1">
                        ({targetConsolidatedPoints.length > 0 ? Math.round((rusleCalculatedCount / targetConsolidatedPoints.length) * 100) : 0}%)
                      </span>
                    </div>
                    <span className="text-[10px] opacity-80 mt-0.5">
                      {rusleCalculatedCount === targetConsolidatedPoints.length && targetConsolidatedPoints.length > 0
                        ? "Fatores R, K, LS, C, P calculados"
                        : "Fatores pendentes de cálculo"}
                    </span>
                  </div>

                  {/* Badge Fundiário */}
                  <div
                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition-colors ${
                      tenureConsultedCount === targetConsolidatedPoints.length && targetConsolidatedPoints.length > 0
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                        : "bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[11px] uppercase tracking-wide">Base Fundiária</span>
                      {tenureConsultedCount === targetConsolidatedPoints.length && targetConsolidatedPoints.length > 0 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-sm font-black">
                      {tenureConsultedCount} / {targetConsolidatedPoints.length}
                      <span className="text-[10px] font-normal ml-1">
                        ({tenureMatchedCount} com CAR)
                      </span>
                    </div>
                    <span className="text-[10px] opacity-80 mt-0.5">
                      {tenureConsultedCount === targetConsolidatedPoints.length && targetConsolidatedPoints.length > 0
                        ? "Cruzamento CAR/SIGEF/SNCR concluído"
                        : "Consulta fundiária pendente"}
                    </span>
                  </div>
                </div>

                {/* SEÇÃO DO BOTÃO OPCIONAL DE CÁLCULO EXPLÍCITO */}
                <div className="p-3 bg-white/90 dark:bg-slate-900/90 border-2 border-emerald-400/80 dark:border-emerald-600/70 rounded-xl space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                      Cálculo & Cruzamento Fundiário dos Focos (Opcional):
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={forceRecalculateConsolidated}
                        onChange={(e) => setForceRecalculateConsolidated(e.target.checked)}
                        className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span>Forçar recálculo</span>
                    </label>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Calcule os fatores biofísicos da RUSLE e identifique os imóveis/proprietários no CAR e INCRA para todos os {targetConsolidatedPoints.length} focos agora mesmo, antes da exportação.
                  </p>

                  <button
                    type="button"
                    onClick={handleProcessConsolidatedBatch}
                    disabled={!hasConsolidatedTarget || isProcessingConsolidatedBatch || isExportingConsolidated}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isProcessingConsolidatedBatch ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                        <span>Processando {enrichmentProgress?.current || 0} de {enrichmentProgress?.total || targetConsolidatedPoints.length}...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                        <span>⚡ Processar e Calcular Dados dos {targetConsolidatedPoints.length} Focos Agora</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Mensagem de Sucesso */}
                {processConsolidatedSuccess && (
                  <div className="p-3 bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1 font-medium">{processConsolidatedSuccess}</div>
                  </div>
                )}

                {/* Mensagem de Erro */}
                {processConsolidatedError && (
                  <div className="p-3 bg-red-100/90 dark:bg-red-950/80 border border-red-400 dark:border-red-700 text-red-900 dark:text-red-100 text-xs rounded-xl flex items-start justify-between gap-2 animate-in fade-in">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <span className="font-medium">{processConsolidatedError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProcessConsolidatedError(null)}
                      className="text-red-600 hover:text-red-800 dark:text-red-300 text-xs font-bold ml-2 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Opções de Enriquecimento Automático Pré-Exportação */}
                <div className="p-3 bg-white/70 dark:bg-slate-900/70 border border-emerald-300/70 dark:border-emerald-800/60 rounded-xl space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Ao Clicar em Exportar (Executar Automaticamente se Pendente):
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={autoCalculateRusle}
                        onChange={(e) => setAutoCalculateRusle(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span>
                        Calcular fatores e perda de solo da RUSLE (R, K, LS, C, P)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={autoQueryTenure}
                        onChange={(e) => setAutoQueryTenure(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span>
                        Executar cruzamento fundiário em lote (CAR, SIGEF, INCRA/SNCR)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Feedback Visual / Barra de Progresso durante processamento */}
                {enrichmentProgress && (
                  <div className="p-3 bg-emerald-100/90 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-700 rounded-xl space-y-1.5 animate-in fade-in">
                    <div className="flex justify-between items-center text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                      <span className="truncate">{enrichmentProgress.message}</span>
                      <span className="shrink-0 ml-2 font-mono">
                        {Math.round((enrichmentProgress.current / (enrichmentProgress.total || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-emerald-200 dark:bg-emerald-900 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(
                            5,
                            Math.min(100, Math.round((enrichmentProgress.current / (enrichmentProgress.total || 1)) * 100))
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {!hasConsolidatedTarget && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Nenhum foco disponível no escopo selecionado para exportação da Tabela Consolidada.</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={!hasConsolidatedTarget || isExportingConsolidated}
                    onClick={() => handleExportConsolidated("xlsx")}
                    className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                      hasConsolidatedTarget && !isExportingConsolidated
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-95"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                    }`}
                    title="Exportar pasta de trabalho Excel (.xlsx) com aba de dados e aba de procedência/conformidade técnica"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    {isExportingConsolidated ? "Gerando..." : "XLSX (Planilha Formatada)"}
                  </button>

                  <button
                    type="button"
                    disabled={!hasConsolidatedTarget || isExportingConsolidated}
                    onClick={() => handleExportConsolidated("csv")}
                    className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      hasConsolidatedTarget && !isExportingConsolidated
                        ? "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 active:scale-95"
                        : "bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed"
                    }`}
                    title="Exportar CSV em UTF-8 com BOM e ponto-e-vírgula (compatível nativamente com Excel e R)"
                  >
                    <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    CSV (Separador &quot;;&quot;, UTF-8 BOM)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 hover:border-emerald-500/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-xs">
                        SHP
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">ESRI Shapefile (.zip)</h4>
                        <span className="text-[10px] text-slate-400">Padrão para QGIS &amp; ArcGIS</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pacote ZIP contendo os arquivos <code>.shp</code>, <code>.shx</code>, <code>.dbf</code> e <code>.prj</code> com atributos físicos e perda de solo.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleExportPoints("shapefile")}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Pontos ({currentPoints.length})
                    </button>
                    {drawnPolygons.length > 0 && (
                      <button
                        onClick={() => handleExportPolygonShapefile()}
                        className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Pentagon className="w-3.5 h-3.5" />
                        Talhões ({drawnPolygons.length})
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 hover:border-emerald-500/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-mono font-bold text-xs">
                        KML
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Google Earth 3D (.kml)</h4>
                        <span className="text-[10px] text-slate-400">Google Earth Pro &amp; Web</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Balões descritivos completos com declividade, BSI, perda de solo RUSLE e estilização cromática por severidade.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleExportPoints("kml")}
                      className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Pontos KML
                    </button>
                    {drawnPolygons.length > 0 && (
                      <button
                        onClick={() => handleExportPolygonKML()}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Pentagon className="w-3.5 h-3.5" />
                        Talhões KML
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 hover:border-emerald-500/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-mono font-bold text-xs">
                        JSON
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">GeoJSON (RFC 7946)</h4>
                        <span className="text-[10px] text-slate-400">Formato vetorial aberto</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    FeatureCollection com geometrias de pontos e polígonos de AOI, integrável com WebGIS, Leaflet e Mapbox.
                  </p>
                  <button
                    onClick={() => handleExportPoints("geojson")}
                    className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar GeoJSON
                  </button>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 hover:border-emerald-500/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-mono font-bold text-xs">
                        CSV
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">CSV &amp; Dataset XGBoost</h4>
                        <span className="text-[10px] text-slate-400">Excel, R &amp; Python ML</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Planilha tabular detalhada e dataset formatado com labels para modelagem preditiva no XGBoost com SHAP.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleExportPoints("csv")}
                      className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      CSV Excel
                    </button>
                    <button
                      onClick={() => handleExportPoints("training")}
                      className="py-1.5 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      ML Dataset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>
            {currentPoints.length} pontos • {drawnPolygons.length} talhões ({totalAreaHa.toFixed(2)} ha)
          </span>
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
