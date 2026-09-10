"use client";

import React from "react";
import {
  Activity,
  TrendingUp,
  Percent,
  Layers,
  AlertTriangle,
  Flame,
  ShieldAlert,
} from "lucide-react";
import { useErosionStore, useFilteredPoints } from "@/lib/store/useErosionStore";

export const StatsOverview: React.FC = () => {
  const { toggleSeverity, filters } = useErosionStore();
  const points = useFilteredPoints();

  const total = points.length;

  // Computations
  const avgSlopePct =
    total > 0 ? (points.reduce((acc, p) => acc + p.slopePercent, 0) / total).toFixed(1) : "0.0";
  const avgSlopeDeg =
    total > 0 ? (points.reduce((acc, p) => acc + p.slopeDegrees, 0) / total).toFixed(1) : "0.0";
  const avgBsi =
    total > 0 ? (points.reduce((acc, p) => acc + p.bsi, 0) / total).toFixed(2) : "0.00";
  const avgSoilLoss =
    total > 0 ? (points.reduce((acc, p) => acc + p.estimatedSoilLoss, 0) / total).toFixed(1) : "0.0";

  const criticalCount = points.filter((p) => p.severity === "Crítica").length;
  const highCount = points.filter((p) => p.severity === "Alta").length;
  const moderateCount = points.filter((p) => p.severity === "Moderada").length;

  return (
    <div className="space-y-2.5">
      {/* 2x2 Grid of KPIs */}
      <div className="grid grid-cols-2 gap-2">
        {/* Active Points */}
        <div className="p-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Focos Ativos</span>
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">{total}</div>
          <p className="text-[10px] text-slate-500 truncate">Áreas em triagem</p>
        </div>

        {/* Avg Slope */}
        <div className="p-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Declividade Méd.</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono">
            {avgSlopePct}%
          </div>
          <p className="text-[10px] text-slate-500 font-mono">~ {avgSlopeDeg}° de inclinação</p>
        </div>

        {/* Avg BSI */}
        <div className="p-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-medium">BSI Médio</span>
            <Percent className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono">
            {Number(avgBsi) > 0 ? `+${avgBsi}` : avgBsi}
          </div>
          <p className="text-[10px] text-slate-500 truncate">Índice solo exposto</p>
        </div>

        {/* Avg Soil Loss */}
        <div className="p-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Perda de Solo</span>
            <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400 font-mono">
            {avgSoilLoss}
          </div>
          <p className="text-[10px] text-slate-500 truncate">t/ha/ano (RUSLE)</p>
        </div>
      </div>

      {/* Severity Breakdown Strip with Interactive click */}
      <div className="p-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            Distribuição de Severidade
          </span>
          <span className="text-[10px] text-slate-500">Clique para filtrar</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {/* Crítica */}
          <button
            onClick={() => toggleSeverity("Crítica")}
            className={`p-1.5 rounded-lg border text-left transition-all ${
              filters.selectedSeverities.includes("Crítica")
                ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-600/50 text-rose-800 dark:text-rose-300"
                : "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60"
            }`}
          >
            <div className="text-[10px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Crítica
            </div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">{criticalCount}</div>
          </button>

          {/* Alta */}
          <button
            onClick={() => toggleSeverity("Alta")}
            className={`p-1.5 rounded-lg border text-left transition-all ${
              filters.selectedSeverities.includes("Alta")
                ? "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-600/50 text-amber-800 dark:text-amber-300"
                : "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60"
            }`}
          >
            <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Alta
            </div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">{highCount}</div>
          </button>

          {/* Moderada */}
          <button
            onClick={() => toggleSeverity("Moderada")}
            className={`p-1.5 rounded-lg border text-left transition-all ${
              filters.selectedSeverities.includes("Moderada")
                ? "bg-yellow-50 dark:bg-yellow-950/60 border-yellow-300 dark:border-yellow-600/50 text-yellow-800 dark:text-yellow-300"
                : "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60"
            }`}
          >
            <div className="text-[10px] font-medium text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              Moderada
            </div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">{moderateCount}</div>
          </button>
        </div>
      </div>
    </div>
  );
};
