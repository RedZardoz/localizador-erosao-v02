"use client";

import React from "react";
import {
  Globe,
  Layers,
  Sliders,
  Filter,
  Flame,
  PlusCircle,
  FileUp,
  ChevronDown,
  Sparkles,
  Bookmark,
} from "lucide-react";
import { useErosionStore } from "@/lib/store/useErosionStore";
import { regionPresets } from "@/data/regionsData";

export const RegionAndTopNSelector: React.FC = () => {
  const {
    activeRegion,
    filters,
    allPoints,
    activeAOIPolygon,
    savedDatasets,
    loadDataset,
    setActiveRegion,
    setTopN,
    setActiveModal,
    setActiveAOIPolygon,
  } = useErosionStore();

  const totalAvailable = allPoints.length;
  const topNOptions = [10, 25, 50, 100, totalAvailable];

  return (
    <div className="p-3.5 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-sm transition-colors">
      {/* Region Selector Header */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Região & Território
          </label>
          <button
            onClick={() => setActiveModal("region")}
            className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1 transition-colors"
            title="Subir polígono ou solicitar nova região"
          >
            <PlusCircle className="w-3 h-3" />
            Novo Pedido / AOI
          </button>
        </div>

        <div className="relative">
          <select
            value={activeRegion.id}
            onChange={(e) => setActiveRegion(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-2 pr-8 appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors cursor-pointer"
          >
            <optgroup label="Estado do Paraná">
              {regionPresets
                .filter((r) => r.state === "PR")
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Outros Estados / Brasil">
              {regionPresets
                .filter((r) => r.state !== "PR")
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </optgroup>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Active AOI polygon banner if active */}
        {activeAOIPolygon && (
          <div className="mt-2 p-2 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-500/30 rounded-lg flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-cyan-800 dark:text-cyan-300 truncate">
              <FileUp className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span className="truncate">Polígono: {activeAOIPolygon.name}</span>
            </div>
            <button
              onClick={() => setActiveAOIPolygon(null)}
              className="text-slate-500 dark:text-slate-400 hover:text-rose-500 text-[10px] underline ml-2 shrink-0"
            >
              Remover
            </button>
          </div>
        )}
      </div>

      {/* Top N Erosion Areas Selector */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        {totalAvailable === 0 ? (
          <div className="text-center py-2 space-y-2">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Nenhum ponto carregado no momento.
            </p>
            {savedDatasets.length > 0 && (
              <button
                onClick={() => loadDataset(savedDatasets[0].id)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                title={`Carregar "${savedDatasets[0].name}"`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Carregar Salvos: {savedDatasets[0].name.slice(0, 20)} ({savedDatasets[0].pointsCount || savedDatasets[0].points?.length || 0})</span>
              </button>
            )}
            <button
              onClick={() => setActiveModal("candidates")}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Candidatos GEE
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Quantidade de Áreas a Triar (Top N)
              </label>
              <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-500/30">
                {filters.topN >= totalAvailable || filters.topN === 0 ? `Todas (${totalAvailable})` : `Top ${filters.topN}`}
              </span>
            </div>

            {/* Quick pill selectors */}
            <div className="grid grid-cols-5 gap-1.5 mb-2.5">
              {topNOptions.map((opt) => {
                const isSelected =
                  opt === totalAvailable
                    ? filters.topN >= totalAvailable || filters.topN === 0
                    : filters.topN === opt;

                return (
                  <button
                    key={opt}
                    onClick={() => setTopN(opt === totalAvailable ? totalAvailable : opt)}
                    className={`py-1 rounded text-[11px] font-medium transition-all ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/60"
                    }`}
                  >
                    {opt === totalAvailable ? "Todas" : `${opt}`}
                  </button>
                );
              })}
            </div>

            {/* Continuous Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min={Math.min(5, totalAvailable)}
                max={Math.max(totalAvailable, 1)}
                step={5}
                value={filters.topN >= totalAvailable || filters.topN === 0 ? totalAvailable : filters.topN}
                onChange={(e) => setTopN(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>{Math.min(5, totalAvailable)} mais críticas</span>
                <span>{Math.round(totalAvailable / 2)} áreas</span>
                <span>{totalAvailable} focos</span>
              </div>
            </div>

            {/* Custom exact count input */}
            <div className="flex items-center gap-2 pt-2.5">
              <label className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">Quantidade exata:</label>
              <input
                type="number"
                min={1}
                max={totalAvailable}
                value={filters.topN >= totalAvailable || filters.topN === 0 ? totalAvailable : filters.topN}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  if (Number.isNaN(raw)) return;
                  const clamped = Math.max(1, Math.min(totalAvailable, raw));
                  setTopN(clamped);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2 py-1.5 font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">de {totalAvailable}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
