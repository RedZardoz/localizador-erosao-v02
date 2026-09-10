"use client";

import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Percent,
  TrendingUp,
  Map,
  ArrowUpDown,
  ChevronDown,
  Layers,
} from "lucide-react";
import { useErosionStore } from "@/lib/store/useErosionStore";

const paranaWatersheds = [
  "Rio Tibagi",
  "Rio Ivaí",
  "Rio Paranapanema",
  "Rio Iguaçu",
  "Rio Piquiri",
  "Rio Pirapó",
  "Rio Paraná",
  "Litoral",
];

export const FiltersPanel: React.FC = () => {
  const {
    filters,
    setSearchQuery,
    setSlopeRange,
    setBsiRange,
    toggleWatershed,
    setSorting,
    resetFilters,
  } = useErosionStore();

  const [expanded, setExpanded] = useState(true);

  return (
    <div className="p-3.5 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-sm transition-colors">
      {/* Header & Reset */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Filtros Geoespaciais
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>

        <button
          onClick={resetFilters}
          className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors"
          title="Resetar todos os filtros para os valores iniciais"
        >
          <RotateCcw className="w-3 h-3" />
          Resetar
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por ID, município, solo..."
          className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs rounded-lg pl-8 pr-3 py-2 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
        />
        {filters.searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs"
          >
            ×
          </button>
        )}
      </div>

      {expanded && (
        <div className="space-y-3 pt-1">
          {/* Slope Slider (%) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 text-[11px]">
                <TrendingUp className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                Declividade Mínima (%)
              </span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold text-xs">
                ≥ {filters.minSlope}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              step={1}
              value={filters.minSlope}
              onChange={(e) => setSlopeRange(Number(e.target.value), filters.maxSlope)}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0% (Plano)</span>
              <span>20% (Ondulado)</span>
              <span>≥ 60% (Montanhoso)</span>
            </div>
          </div>

          {/* Bare Soil Index (BSI) Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 text-[11px]">
                <Percent className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                BSI Mínimo (Solo Exposto)
              </span>
              <span className="font-mono text-rose-600 dark:text-rose-400 font-bold text-xs">
                ≥ {filters.minBsi > 0 ? `+${filters.minBsi.toFixed(2)}` : filters.minBsi.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={-0.8}
              max={0.8}
              step={0.05}
              value={filters.minBsi}
              onChange={(e) => setBsiRange(Number(e.target.value), filters.maxBsi)}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-0.8 (Veg. Densa)</span>
              <span>0.0 (Misto)</span>
              <span>+0.8 (Exposto Total)</span>
            </div>
          </div>

          {/* Watershed (Bacia Hidrográfica) Filter Pills */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
              <Map className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
              Filtrar por Bacia Hidrográfica
            </label>
            <div className="flex flex-wrap gap-1">
              {paranaWatersheds.map((basin) => {
                const isSelected = filters.selectedWatersheds.includes(basin);
                return (
                  <button
                    key={basin}
                    onClick={() => toggleWatershed(basin)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                      isSelected
                        ? "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/50"
                        : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    {basin}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 shrink-0">
              <ArrowUpDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Ordenar:
            </span>
            <div className="flex items-center gap-1.5 w-full">
              <select
                value={filters.sortBy}
                onChange={(e) => setSorting(e.target.value as any, filters.sortOrder)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="priority">Score de Prioridade</option>
                <option value="bsi">Índice BSI (Solo Exposto)</option>
                <option value="slope">Declividade (%)</option>
                <option value="soilLoss">Perda de Solo (t/ha)</option>
                <option value="municipality">Município (A-Z)</option>
              </select>

              <button
                onClick={() => setSorting(filters.sortBy, filters.sortOrder === "asc" ? "desc" : "asc")}
                className="p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-mono px-2"
                title="Inverter Ordem (Crescente / Decrescente)"
              >
                {filters.sortOrder === "desc" ? "DESC" : "ASC"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
