"use client";

import React, { useState } from "react";
import {
  Layers,
  Mountain,
  Compass,
  Maximize2,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Satellite,
  Flame,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Pentagon,
  FileSpreadsheet,
  Plus,
} from "lucide-react";
import { BasemapType, useErosionStore } from "@/lib/store/useErosionStore";

export const MapControls: React.FC = () => {
  const {
    mapState,
    setBasemap,
    toggleTerrain3D,
    setTerrainExaggeration,
    toggleLayer,
    flyToLocation,
    activeRegion,
    mapboxToken,
    drawnPolygons,
    setDrawingMode,
    setActiveModal,
  } = useErosionStore();

  const [basemapOpen, setBasemapOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);

  const basemapOptions: { id: BasemapType; label: string; icon: any; badge?: string }[] = [
    ...(mapboxToken
      ? [
          {
            id: "mapbox-hd" as BasemapType,
            label: "Mapbox HD (Ultra-Resolução)",
            icon: Sparkles,
            badge: "Ultra HD",
          },
        ]
      : []),
    { id: "satellite", label: "Satélite Esri (Clarity)", icon: Satellite },
    { id: "voyager", label: "CARTO Voyager", icon: Compass, badge: "CARTO" },
    { id: "dark", label: "CARTO Dark GIS", icon: Moon, badge: "CARTO" },
    { id: "topo", label: "Relevo Topográfico", icon: Mountain },
  ];

  const resetToRegion = () => {
    flyToLocation({
      lng: activeRegion.center[0],
      lat: activeRegion.center[1],
      zoom: activeRegion.zoom,
      pitch: mapState.terrain3d ? 45 : 0,
      bearing: 0,
    });
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto">
      {/* Row 1: Basemap Selector, Layers Toggle & Overview Reset */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Basemap Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setBasemapOpen(!basemapOpen);
              setLayersOpen(false);
            }}
            className="p-2.5 bg-white/95 dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 backdrop-blur-md text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-lg flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer"
            title="Alternar Basemap de Alta Resolução"
          >
            <Satellite className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">
              {basemapOptions.find((b) => b.id === mapState.basemap)?.label || "Satélite HD"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {basemapOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden py-1 z-30 animate-in fade-in zoom-in-95">
              {basemapOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = mapState.basemap === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setBasemap(opt.id);
                      setBasemapOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      {opt.label}
                    </div>
                    {opt.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                        {opt.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Layer Toggles Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setLayersOpen(!layersOpen);
              setBasemapOpen(false);
            }}
            className="p-2.5 bg-white/95 dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 backdrop-blur-md text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-lg flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer"
            title="Camadas e Sobreposições"
          >
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Camadas</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {layersOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden p-2 z-30 space-y-1 animate-in fade-in zoom-in-95">
              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  Bacias Hidrográficas
                </span>
                <input
                  type="checkbox"
                  checked={mapState.showBasins}
                  onChange={() => toggleLayer("showBasins")}
                  className="rounded bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Limite Territorial
                </span>
                <input
                  type="checkbox"
                  checked={mapState.showBoundary}
                  onChange={() => toggleLayer("showBoundary")}
                  className="rounded bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Mancha / Heatmap
                </span>
                <input
                  type="checkbox"
                  checked={mapState.showHeatmap}
                  onChange={() => toggleLayer("showHeatmap")}
                  className="rounded bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <div className="pt-1 mt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Geosserviços Embrapa
                </span>
              </div>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-700" />
                  Solos PR (PronaSolos Embrapa)
                </span>
                <input
                  type="checkbox"
                  checked={mapState.showEmbrapaSolos}
                  onChange={() => toggleLayer("showEmbrapaSolos")}
                  className="rounded bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  Erodibilidade (Embrapa RUSLE)
                </span>
                <input
                  type="checkbox"
                  checked={mapState.showEmbrapaErodibilidade}
                  onChange={() => toggleLayer("showEmbrapaErodibilidade")}
                  className="rounded bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          )}
        </div>

        {/* 3D Terrain & Exaggeration Pill */}
        {mapState.terrain3d && (
          <div className="p-1.5 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-lg flex items-center gap-1 text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 px-1 text-[10px] font-mono">DEM:</span>
            {[1.0, 1.5, 2.5].map((ex) => (
              <button
                key={ex}
                onClick={() => setTerrainExaggeration(ex)}
                className={`px-2 py-1 rounded font-mono font-bold transition-colors cursor-pointer ${
                  mapState.terrainExaggeration === ex
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                }`}
              >
                {ex}x
              </button>
            ))}
          </div>
        )}

        {/* Reset view to region */}
        <button
          onClick={resetToRegion}
          className="p-2.5 bg-white/95 dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 backdrop-blur-md text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-lg flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
          title="Centralizar Câmera na Região Selecionada"
        >
          <RotateCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">Visão Geral</span>
        </button>
      </div>

      {/* Row 2: Polygon Drawing & Management Tools */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setDrawingMode(true)}
          className="py-2 px-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl shadow-lg shadow-cyan-600/20 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
          title="Desenhar novo polígono / talhão sobre a foto aérea"
        >
          <Pentagon className="w-4 h-4" />
          <span>Delimitar Talhão</span>
        </button>

        <button
          onClick={() => setActiveModal("polygons")}
          className="py-2 px-3 bg-white/95 dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 backdrop-blur-md text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-lg flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
          title="Ver todos os polígonos delimitados e exportar para QGIS (Shapefile) ou Google Earth (KML)"
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-500" />
          <span>Talhões ({drawnPolygons.length})</span>
        </button>
      </div>
    </div>
  );
};
