"use client";

import React, { useState } from "react";
import {
  Layers,
  Mountain,
  Eye,
  Maximize2,
  Compass,
  Map,
} from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import type { BasemapType } from "@/types/ui";

export const MapControls: React.FC = () => {
  const { mapState, setMapState } = useSarelStore();
  const [menuCamadasAberto, setMenuCamadasAberto] = useState(false);
  const [menuBasemapAberto, setMenuBasemapAberto] = useState(false);

  const basemaps: { id: BasemapType; label: string }[] = [
    { id: "google-earth", label: "Google Earth (Satélite)" },
    { id: "google-hybrid", label: "Google Earth (Híbrido)" },
    { id: "satellite", label: "Satélite Esri" },
    { id: "mapbox-hd", label: "Mapbox HD" },
    { id: "topo", label: "Topográfico OSM" },
    { id: "dark", label: "Dark Carto" },
    { id: "voyager", label: "Voyager Carto" },
  ];

  const resetarVisaoParana = () => {
    setMapState((prev) => ({
      ...prev,
      flyToTarget: {
        lng: -51.5,
        lat: -24.8,
        zoom: 7,
        pitch: 35,
        bearing: 0,
      },
    }));
  };

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
      {/* 1. Menu de Basemaps */}
      <div className="relative">
        <button
          onClick={() => {
            setMenuBasemapAberto(!menuBasemapAberto);
            setMenuCamadasAberto(false);
          }}
          className="h-9 px-3 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl shadow-lg backdrop-blur-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Map className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="capitalize">
            {basemaps.find((b) => b.id === mapState.basemap)?.label || "Mapa Base"}
          </span>
        </button>

        {menuBasemapAberto && (
          <div className="light-popup absolute top-11 left-0 w-48 bg-white border-2 border-slate-300 ring-2 ring-black/15 rounded-xl shadow-2xl p-1.5 space-y-1 z-30 animate-in fade-in text-slate-900">
            {basemaps.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setMapState({ basemap: b.id });
                  setMenuBasemapAberto(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mapState.basemap === b.id
                    ? "bg-emerald-600 text-white font-bold shadow-xs"
                    : "text-slate-800 hover:bg-slate-100"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Menu de Camadas Vetoriais */}
      <div className="relative">
        <button
          onClick={() => {
            setMenuCamadasAberto(!menuCamadasAberto);
            setMenuBasemapAberto(false);
          }}
          className="h-9 px-3 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl shadow-lg backdrop-blur-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Camadas</span>
        </button>

        {menuCamadasAberto && (
          <div className="light-popup absolute top-11 left-0 w-60 bg-white border-2 border-slate-300 ring-2 ring-black/15 rounded-xl shadow-2xl p-3 space-y-2 z-30 animate-in fade-in text-xs text-slate-900">
            <span className="font-black text-slate-950 block border-b border-slate-200 pb-1.5">
              Camadas Visíveis
            </span>

            <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
              <input
                type="checkbox"
                checked={mapState.mostrarLimites}
                onChange={(e) =>
                  setMapState({ mostrarLimites: e.target.checked })
                }
                className="accent-emerald-600 rounded"
              />
              <span>Fronteira Paraná (IBGE)</span>
            </label>

            <label
              data-metodologia="aoi-selector"
              className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300"
            >
              <input
                type="checkbox"
                checked={mapState.mostrarBacias}
                onChange={(e) =>
                  setMapState({ mostrarBacias: e.target.checked })
                }
                className="accent-emerald-600 rounded"
              />
              <span>Macrobacias Hidrográficas</span>
            </label>

            <label
              data-metodologia="fator-k-pedologia"
              className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300"
            >
              <input
                type="checkbox"
                checked={mapState.mostrarSolosEmbrapa}
                onChange={(e) =>
                  setMapState({ mostrarSolosEmbrapa: e.target.checked })
                }
                className="accent-emerald-600 rounded"
              />
              <span>Solos Embrapa (WMS Oficial)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={mapState.mostrarSitiosPadraoOuro !== false}
                onChange={(e) =>
                  setMapState({ mostrarSitiosPadraoOuro: e.target.checked })
                }
                className="accent-cyan-600 rounded"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block" />
                Sítios Padrão-Ouro (Céu Azul / Medianeira)
              </span>
            </label>
          </div>
        )}
      </div>

      {/* 3. Relevo 3D / 2D Flutuante sobre o Mapa */}
      <button
        data-metodologia="terreno-3d"
        onClick={() => setMapState((prev) => ({ terreno3d: !prev.terreno3d }))}
        className={`h-9 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-lg backdrop-blur-md cursor-pointer ${
          mapState.terreno3d
            ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40"
            : "bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700"
        }`}
        title="Alternar relevo 3D DEM Copernicus (Botão direito: Ver fórmula do Fator LS e Declividade)"
      >
        <Mountain
          className={`w-3.5 h-3.5 ${
            mapState.terreno3d
              ? "text-white"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        />
        <span>{mapState.terreno3d ? "Relevo 3D" : "Modo 2D"}</span>
      </button>

      {/* 4. Exagero DEM 3D (apenas ativo se terreno3d estiver ligado) */}
      {mapState.terreno3d && (
        <div className="h-9 px-2 bg-white/95 dark:bg-slate-900/95 border border-slate-300 dark:border-slate-700 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-1 text-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase pl-1">DEM:</span>
          {[1.0, 1.5, 2.5].map((factor) => (
            <button
              key={factor}
              onClick={() => setMapState({ exageracao3d: factor })}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                mapState.exageracao3d === factor
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {factor}x
            </button>
          ))}
        </div>
      )}

      {/* 4. Visão Geral Paraná */}
      <button
        onClick={resetarVisaoParana}
        className="h-9 px-3 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl shadow-lg backdrop-blur-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        title="Enquadrar visão completa do Paraná"
      >
        <Maximize2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
        <span>Visão Geral</span>
      </button>
    </div>
  );
};
