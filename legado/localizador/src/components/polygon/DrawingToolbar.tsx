"use client";

import React, { useState } from "react";
import { Check, X, Undo2, Layers, Sparkles, MapPin } from "lucide-react";
import { useErosionStore } from "@/lib/store/useErosionStore";
import { calculatePolygonMetrics } from "@/lib/utils/shapefileExport";
import { PolygonCategory, SeverityLevel } from "@/types/erosion";

export const DrawingToolbar: React.FC = () => {
  const {
    activeDrawingMode,
    setDrawingMode,
    drawingPoints,
    setDrawingPoints,
    addDrawnPolygon,
    drawnPolygons,
  } = useErosionStore();

  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PolygonCategory>("Talhão Agrícola");
  const [severity, setSeverity] = useState<SeverityLevel | "Nenhuma">("Nenhuma");
  const [notes, setNotes] = useState("");

  if (!activeDrawingMode) return null;

  const count = drawingPoints.length;
  const metrics = calculatePolygonMetrics(drawingPoints);

  const handleUndo = () => {
    if (drawingPoints.length > 0) {
      setDrawingPoints(drawingPoints.slice(0, -1));
    }
  };

  const handleCancel = () => {
    setDrawingMode(false);
    setIsSaving(false);
  };

  const handleOpenSaveDialog = () => {
    if (count < 3) return;
    const defaultNum = String(drawnPolygons.length + 1).padStart(2, "0");
    setName(`Talhão ${defaultNum} - Delimitação`);
    setIsSaving(true);
  };

  const handleConfirmSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (count < 3) return;

    // Ensure ring is closed
    const ring = [...drawingPoints];
    if (
      ring[0][0] !== ring[ring.length - 1][0] ||
      ring[0][1] !== ring[ring.length - 1][1]
    ) {
      ring.push([ring[0][0], ring[0][1]]);
    }

    const newPolygon = {
      id: `POLY-${Date.now()}`,
      name: name.trim() || `Talhão ${drawnPolygons.length + 1}`,
      category,
      severity: severity === "Nenhuma" ? undefined : severity,
      notes: notes.trim(),
      areaM2: metrics.areaM2,
      areaHa: metrics.areaHa,
      perimeterM: metrics.perimeterM,
      createdAt: new Date().toISOString(),
      geometry: {
        type: "Polygon" as const,
        coordinates: [ring],
      },
    };

    addDrawnPolygon(newPolygon);
    setIsSaving(false);
    setDrawingMode(false);
  };

  return (
    <>
      {/* Floating Toolbar on Top Center of Map */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 p-2 px-4 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-cyan-500/80 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-bold text-white whitespace-nowrap">
            Desenhando Talhão / Polígono
          </span>
        </div>

        <div className="text-xs text-slate-300 font-mono flex items-center gap-2">
          <span>
            Vértices: <b className="text-cyan-400">{count}</b>/3+
          </span>
          {count >= 3 && (
            <span className="text-emerald-400 font-semibold">
              ({metrics.areaHa} ha)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
          <button
            onClick={handleUndo}
            disabled={count === 0}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Desfazer último vértice"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleCancel}
            className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleOpenSaveDialog}
            disabled={count < 3}
            className="px-3.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-md transition-all flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Concluir &amp; Salvar
          </button>
        </div>
      </div>

      {/* Save Modal Dialog */}
      {isSaving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-500" />
                Salvar Polígono / Talhão
              </h3>
              <button
                onClick={() => setIsSaving(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSave} className="p-5 space-y-4">
              {/* Computed Geometry Preview */}
              <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 rounded-xl border border-cyan-200 dark:border-cyan-800/80 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Área Calculada:</span>
                  <span className="text-cyan-700 dark:text-cyan-300 font-bold text-sm">
                    {metrics.areaHa} hectares
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1">
                    ({metrics.areaM2.toLocaleString("pt-BR")} m²)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Perímetro:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">
                    {metrics.perimeterM.toLocaleString("pt-BR")} m
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome do Talhão / Área
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Talhão 01 - Céu Azul (Área com Erosão)"
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PolygonCategory)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Talhão Agrícola">Talhão Agrícola</option>
                    <option value="Mancha de Erosão Laminar">Mancha de Erosão Laminar</option>
                    <option value="Sulcos / Ravina">Sulcos / Ravina</option>
                    <option value="Área de Preservação / Palhada">Área de Preservação / Palhada</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Severidade (Opcional)
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Nenhuma">Nenhuma</option>
                    <option value="Moderada">Moderada</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Notas / Observações
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Talhão preparado para plantio com declividade acentuada e perda de horizonte superficial visível."
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaving(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Continuar Desenhando
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar Talhão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
