"use client";

import React, { useState } from "react";
import {
  X,
  Layers,
  MapPin,
  Download,
  Trash2,
  Edit2,
  Plus,
  Eye,
  FileSpreadsheet,
  Globe,
  Sparkles,
  CheckCircle2,
  Maximize2,
} from "lucide-react";
import { useErosionStore } from "@/lib/store/useErosionStore";
import { DrawnPolygon, PolygonCategory, SeverityLevel } from "@/types/erosion";
import {
  exportPolygonsToShapefileZip,
  exportPolygonsToKML,
  exportPolygonsToGeoJSON,
} from "@/lib/utils/shapefileExport";

export const PolygonManagerModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    drawnPolygons,
    removeDrawnPolygon,
    updateDrawnPolygon,
    setDrawingMode,
    flyToLocation,
    clearDrawnPolygons,
  } = useErosionStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<PolygonCategory>("Talhão Agrícola");
  const [editSeverity, setEditSeverity] = useState<SeverityLevel | "Nenhuma">("Nenhuma");
  const [editNotes, setEditNotes] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (activeModal !== "polygons") return null;

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
      for (const [lng, lat] of coords) {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      }
      flyToLocation({
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2,
        zoom: 16,
        pitch: 45,
      });
      setActiveModal(null);
    }
  };

  const handleStartEdit = (p: DrawnPolygon) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditCategory(p.category);
    setEditSeverity(p.severity || "Nenhuma");
    setEditNotes(p.notes || "");
  };

  const handleSaveEdit = (id: string) => {
    updateDrawnPolygon(id, {
      name: editName.trim() || "Talhão Sem Nome",
      category: editCategory,
      severity: editSeverity === "Nenhuma" ? undefined : editSeverity,
      notes: editNotes.trim(),
    });
    setEditingId(null);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadText = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    downloadBlob(blob, filename);
  };

  const handleExportBulkShapefile = async () => {
    if (drawnPolygons.length === 0) return;
    setExporting(true);
    try {
      const zipBlob = await exportPolygonsToShapefileZip(
        drawnPolygons,
        `talhoes_erosao_${new Date().toISOString().split("T")[0]}`
      );
      downloadBlob(zipBlob, `talhoes_shapefile_qgis_${Date.now()}.zip`);
      setExportSuccess("Shapefile ZIP gerado com sucesso para o QGIS!");
      setTimeout(() => setExportSuccess(null), 4000);
    } finally {
      setExporting(false);
    }
  };

  const handleExportSingleShapefile = async (poly: DrawnPolygon) => {
    setExporting(true);
    try {
      const baseName = poly.name.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase() || "talhao";
      const zipBlob = await exportPolygonsToShapefileZip([poly], baseName);
      downloadBlob(zipBlob, `${baseName}_shapefile.zip`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportBulkKML = () => {
    if (drawnPolygons.length === 0) return;
    const kml = exportPolygonsToKML(drawnPolygons, "Talhões e Polígonos de Erosão");
    downloadText(kml, `talhoes_google_earth_${Date.now()}.kml`, "application/vnd.google-earth.kml+xml");
    setExportSuccess("Arquivo KML gerado com sucesso para o Google Earth!");
    setTimeout(() => setExportSuccess(null), 4000);
  };

  const handleExportSingleKML = (poly: DrawnPolygon) => {
    const kml = exportPolygonsToKML([poly], poly.name);
    const baseName = poly.name.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase() || "talhao";
    downloadText(kml, `${baseName}_ge.kml`, "application/vnd.google-earth.kml+xml");
  };

  const handleExportBulkGeoJSON = () => {
    if (drawnPolygons.length === 0) return;
    const geojson = exportPolygonsToGeoJSON(drawnPolygons);
    downloadText(geojson, `talhoes_geojson_${Date.now()}.geojson`, "application/geo+json");
    setExportSuccess("GeoJSON exportado com sucesso!");
    setTimeout(() => setExportSuccess(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-700/50">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Gerenciador de Polígonos &amp; Talhões Delimitados
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  {drawnPolygons.length} {drawnPolygons.length === 1 ? "polígono" : "polígonos"}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Delimite feições de erosão e talhões no mapa e exporte diretamente para o <b>QGIS (Shapefile)</b> e <b>Google Earth (KML)</b>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartDraw}
              className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 rounded-xl shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Desenhar Novo Polígono
            </button>
            <button
              onClick={() => setActiveModal(null)}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {exportSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 rounded-xl flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {exportSuccess}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Total de Polígonos
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {drawnPolygons.length}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Área Total Delimitada
              </span>
              <div className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">
                {totalAreaHa.toFixed(2)} ha{" "}
                <span className="text-xs text-slate-400 font-normal">
                  ({totalAreaM2.toLocaleString("pt-BR")} m²)
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Exportação em Grupo
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={handleExportBulkShapefile}
                  disabled={drawnPolygons.length === 0 || exporting}
                  className="px-2.5 py-1 bg-slate-900 dark:bg-slate-750 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-[11px] font-bold rounded-lg border border-slate-700 transition-colors flex items-center gap-1 disabled:opacity-40"
                  title="Exportar todos os polígonos em Shapefile ZIP (com .shp, .shx, .dbf e .prj) para o QGIS"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                  Shapefile (.ZIP)
                </button>
                <button
                  onClick={handleExportBulkKML}
                  disabled={drawnPolygons.length === 0 || exporting}
                  className="px-2.5 py-1 bg-slate-900 dark:bg-slate-750 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-[11px] font-bold rounded-lg border border-slate-700 transition-colors flex items-center gap-1 disabled:opacity-40"
                  title="Exportar todos os polígonos em KML 3D para o Google Earth"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  KML (GE)
                </button>
                <button
                  onClick={handleExportBulkGeoJSON}
                  disabled={drawnPolygons.length === 0 || exporting}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1 disabled:opacity-40"
                  title="Exportar em GeoJSON universal"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  GeoJSON
                </button>
              </div>
            </div>
          </div>

          {/* Polygons List */}
          {drawnPolygons.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <Layers className="w-9 h-9 text-slate-400 dark:text-slate-600 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Nenhum polígono desenhado ainda
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                  Você pode usar a ferramenta de desenho para delimitar talhões agrícolas, manchas de erosão laminar ou ravinas com alta precisão sobre as imagens de satélite.
                </p>
              </div>
              <button
                onClick={handleStartDraw}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Iniciar Desenho no Mapa
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <span>Polígonos Registrados</span>
                <button
                  onClick={() => {
                    if (confirm("Tem certeza que deseja apagar todos os polígonos desenhados?")) {
                      clearDrawnPolygons();
                    }
                  }}
                  className="text-rose-600 hover:text-rose-500 text-[11px] flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Limpar Todos
                </button>
              </div>

              {drawnPolygons.map((p, idx) => {
                const isEditing = editingId === p.id;

                if (isEditing) {
                  return (
                    <div
                      key={p.id}
                      className="p-4 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-cyan-400 dark:border-cyan-600 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">
                            Nome do Talhão / Polígono
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">
                            Categoria
                          </label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as PolygonCategory)}
                            className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                          >
                            <option value="Talhão Agrícola">Talhão Agrícola</option>
                            <option value="Mancha de Erosão Laminar">Mancha de Erosão Laminar</option>
                            <option value="Sulcos / Ravina">Sulcos / Ravina</option>
                            <option value="Área de Preservação / Palhada">Área de Preservação / Palhada</option>
                            <option value="Outro">Outro</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">
                            Severidade de Risco
                          </label>
                          <select
                            value={editSeverity}
                            onChange={(e) => setEditSeverity(e.target.value as any)}
                            className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                          >
                            <option value="Nenhuma">Nenhuma</option>
                            <option value="Moderada">Moderada</option>
                            <option value="Alta">Alta</option>
                            <option value="Crítica">Crítica</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">
                          Observações &amp; Notas de Campo
                        </label>
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Ex: Solo avermelhado decapitado em topo de morro sem terraço..."
                          className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded-lg"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEdit(p.id)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={p.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          #{idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {p.name}
                        </h4>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {p.category}
                        </span>
                        {p.severity && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              p.severity === "Crítica"
                                ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700"
                                : p.severity === "Alta"
                                ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700"
                                : "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-700"
                            }`}
                          >
                            {p.severity}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>
                          Área: <b>{p.areaHa} ha</b> ({p.areaM2.toLocaleString("pt-BR")} m²)
                        </span>
                        <span>•</span>
                        <span>Perímetro: {p.perimeterM.toLocaleString("pt-BR")} m</span>
                        {p.notes && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600 dark:text-slate-300 italic truncate max-w-xs">
                              &ldquo;{p.notes}&rdquo;
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleFlyToPolygon(p)}
                        className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Ver este polígono no mapa 3D"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleExportSingleShapefile(p)}
                        className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Exportar individualmente em Shapefile (.ZIP) para o QGIS"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleExportSingleKML(p)}
                        className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Exportar individualmente em KML para o Google Earth"
                      >
                        <Globe className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleStartEdit(p)}
                        className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Editar nome e atributos"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => removeDrawnPolygon(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Excluir polígono"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            Formatos suportados: <b>Shapefile (.shp/.shx/.dbf/.prj)</b>, <b>Google Earth (.kml)</b> e <b>GeoJSON (.geojson)</b>.
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
