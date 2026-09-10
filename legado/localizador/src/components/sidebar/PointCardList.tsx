"use client";

import React from "react";
import {
  MapPin,
  ExternalLink,
  Compass,
  TrendingUp,
  Percent,
  Layers,
  ChevronRight,
  Flame,
  Sparkles,
  Bookmark,
  RefreshCw,
} from "lucide-react";
import { useErosionStore, useFilteredPoints } from "@/lib/store/useErosionStore";
import { ErosionPoint } from "@/types/erosion";
import { getGoogleEarthWebUrl } from "@/lib/utils/geoUtils";
import {
  inferPedologyClass,
  classifyFeatureType,
  getStratumInfo,
} from "@/lib/gee/stratificationConstants";
import {
  calculateCFactor,
  calculateLSFactor,
  calculatePriorityScore,
  calculateSeverity,
  calculateSoilLossRUSLE,
} from "@/lib/rusle/rusleCalculator";
import { getKFactor } from "@/lib/rusle/soilErodibility";
import { getRegionalRFactorParana } from "@/lib/rusle/rainfallErosivity";

export const PointCardList: React.FC = () => {
  const {
    selectedPoint,
    flyToPoint,
    setActiveModal,
    savedDatasets,
    loadDataset,
    updateMultiplePoints,
    setHasUnsavedPoints,
  } = useErosionStore();
  const points = useFilteredPoints();

  if (points.length === 0) {
    return (
      <div className="p-6 text-center bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
        <MapPin className="w-7 h-7 text-slate-400 dark:text-slate-600 mx-auto" />
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Mapa limpo (0 focos)</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
            Selecione uma área e processe os candidatos via Earth Engine, importe um arquivo CSV/GeoJSON/KML, ou recarregue uma coleção salva.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {savedDatasets.length > 0 && (
            <button
              onClick={() => loadDataset(savedDatasets[0].id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors shadow-sm cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Carregar: {savedDatasets[0].name.slice(0, 18)}
            </button>
          )}
          <button
            onClick={() => setActiveModal("candidates")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Candidatos GEE
          </button>
        </div>
      </div>
    );
  }

  const handleRecalculateAll = () => {
    if (!points || points.length === 0) return;

    const updated = points.map((pt) => {
      let stratumCode = 4;
      if (pt.stratumId) {
        const match = pt.stratumId.match(/([AB])(\d)/);
        if (match) {
          const isA = match[1].toUpperCase() === "A";
          const num = parseInt(match[2], 10);
          stratumCode = isA ? num : 3 + num;
        }
      } else {
        const slopeCls = pt.slopePercent < 6 ? 0 : pt.slopePercent <= 12 ? 1 : 2;
        stratumCode = (pt.bsi > 0.25 ? 1 : 4) + slopeCls;
      }

      const soilType = inferPedologyClass(stratumCode, pt.slopePercent);
      const { severity } = calculateSeverity(pt.slopePercent, pt.bsi, soilType);
      const featureType = classifyFeatureType(severity, pt.slopePercent, pt.bsi);
      const priorityScore = calculatePriorityScore(severity, pt.bsi, pt.slopeDegrees, 0);

      const kEntry = getKFactor(soilType);
      const kFactor = kEntry.mean;
      const lsFactor = pt.rusleFactors?.ls ?? calculateLSFactor(10.0, pt.slopeDegrees);
      const cFactor = pt.rusleFactors?.c ?? calculateCFactor(pt.ndvi, pt.bsi);
      const rFactor = getRegionalRFactorParana(pt.latitude, pt.longitude);
      const pFactor = pt.rusleFactors?.p ?? 1.0;
      const estimatedSoilLoss = calculateSoilLossRUSLE(rFactor, kFactor, lsFactor, cFactor, pFactor);

      const stratumInfo = getStratumInfo(stratumCode);
      const stratumId = stratumInfo?.id || (stratumCode <= 3 ? `A${stratumCode}` : `B${stratumCode - 3}`);

      return {
        ...pt,
        soilType,
        featureType,
        severity,
        priorityScore,
        estimatedSoilLoss,
        stratumId,
        stratumName: stratumInfo
          ? `Sub-estrato ${stratumId} (Declividade ${pt.slopePercent.toFixed(1)}% × ${stratumInfo.erodibilityCategory})`
          : pt.stratumName,
        rusleFactors: {
          ...pt.rusleFactors,
          k: kFactor,
          ls: lsFactor,
          c: cFactor,
          r: rFactor,
          p: pFactor,
        },
      };
    });

    updateMultiplePoints(updated);
    setHasUnsavedPoints(true);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Focos ({points.length})
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRecalculateAll}
            className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline cursor-pointer"
            title="Recalcular Tipo de Solo SiBCS, Severidade e Tipologia com a metodologia atualizada para os pontos em tela"
          >
            <RefreshCw className="w-3 h-3" />
            Recalcular
          </button>
          <button
            onClick={() => setActiveModal("saved-datasets")}
            className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 hover:underline cursor-pointer"
            title="Salvar esta seleção de focos ou carregar coleções salvas"
          >
            <Bookmark className="w-3 h-3" />
            Salvar
          </button>
        </div>
      </div>

      <div className="space-y-1.5 max-h-[calc(100vh-490px)] min-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
        {points.map((pt, idx) => {
          const isSelected = selectedPoint?.id === pt.id;

          const severityBadgeClass =
            pt.severity === "Crítica"
              ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40"
              : pt.severity === "Alta"
              ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
              : "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/40";

          return (
            <div
              key={pt.id}
              onClick={() => flyToPoint(pt)}
              className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                isSelected
                  ? "bg-emerald-50/70 dark:bg-slate-800/95 border-emerald-500 shadow-md ring-1 ring-emerald-500"
                  : "bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
              }`}
            >
              {/* Card Top Row: Code, Name & Priority Score */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-mono font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/80 shrink-0">
                    {pt.code}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                    {pt.name || pt.municipality}
                  </h4>
                </div>

                {/* Priority Score badge */}
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${severityBadgeClass}`}
                  >
                    {pt.severity}
                  </span>
                  <span
                    className="text-[10px] font-mono font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 px-1.5 py-0.5 rounded shadow-sm"
                    title={`#${idx + 1} no ranking de prioridade (${pt.priorityScore}/100 pts)`}
                  >
                    {pt.priorityScore} pts
                  </span>
                </div>
              </div>

              {/* Feature type & Watershed */}
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mb-2 truncate flex items-center gap-1.5">
                <span className="text-slate-800 dark:text-slate-300 font-medium">{pt.featureType}</span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="text-slate-600 dark:text-slate-400 truncate">{pt.watershed}</span>
              </div>

              {/* Stats pill row */}
              <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-mono">
                <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300/90 bg-amber-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-transparent">
                  <TrendingUp className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
                  <span>{pt.slopePercent}%</span>
                </div>
                <div className="flex items-center gap-1 text-rose-700 dark:text-rose-300/90 bg-rose-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-rose-200/50 dark:border-transparent">
                  <Percent className="w-2.5 h-2.5 text-rose-500 dark:text-rose-400" />
                  <span>BSI {pt.bsi > 0 ? `+${pt.bsi}` : pt.bsi}</span>
                </div>
                <div className="flex items-center gap-1 text-cyan-700 dark:text-cyan-300/90 bg-cyan-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-cyan-200/50 dark:border-transparent">
                  <Layers className="w-2.5 h-2.5 text-cyan-500 dark:text-cyan-400" />
                  <span>{pt.estimatedSoilLoss} t/ha</span>
                </div>
              </div>

              {/* Floating Action Button for Google Earth */}
              <div className="absolute right-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={getGoogleEarthWebUrl(pt.latitude, pt.longitude, pt.elevation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1 text-[10px] shadow-sm"
                  title="Abrir no Google Earth Web 3D"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
