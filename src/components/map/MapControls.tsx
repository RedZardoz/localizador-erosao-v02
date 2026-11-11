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
import {
  IS_VITRINE_DEMONSTRACAO,
  AVISO_OPERACAO_DESABILITADA,
} from "@/config/vitrineDemonstracao";

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
            {IS_VITRINE_DEMONSTRACAO
              ? "Vetor Offline (Vitrine)"
              : basemaps.find((b) => b.id === mapState.basemap)?.label || "Mapa Base"}
          </span>
        </button>

        {menuBasemapAberto && (
          <div className="light-popup absolute top-11 left-0 w-56 bg-white border-2 border-slate-300 ring-2 ring-black/15 rounded-xl shadow-2xl p-1.5 space-y-1 z-30 animate-in fade-in text-slate-900">
            {IS_VITRINE_DEMONSTRACAO && (
              <div className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-[10px] text-amber-950 font-semibold">
                Vetor offline ativo no mockup (tiles externos desabilitados).
              </div>
            )}
            {basemaps.map((b) => (
              <button
                key={b.id}
                type="button"
                disabled={IS_VITRINE_DEMONSTRACAO}
                title={IS_VITRINE_DEMONSTRACAO ? AVISO_OPERACAO_DESABILITADA : undefined}
                onClick={() => {
                  if (IS_VITRINE_DEMONSTRACAO) return;
                  setMapState({ basemap: b.id });
                  setMenuBasemapAberto(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  IS_VITRINE_DEMONSTRACAO
                    ? "text-slate-400 bg-slate-50 cursor-not-allowed opacity-70"
                    : mapState.basemap === b.id
                    ? "bg-emerald-600 text-white font-bold shadow-xs cursor-pointer"
                    : "text-slate-800 hover:bg-slate-100 cursor-pointer"
                }`}
              >
                {b.label} {IS_VITRINE_DEMONSTRACAO ? "(Desab.)" : ""}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Menu de Camadas Vetoriais */}
      <div className="relative">
        <button
          id="btn-camadas-mapa"
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
              title={IS_VITRINE_DEMONSTRACAO ? AVISO_OPERACAO_DESABILITADA : undefined}
              className={`flex items-center gap-2 text-slate-700 dark:text-slate-300 ${
                IS_VITRINE_DEMONSTRACAO ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <input
                type="checkbox"
                disabled={IS_VITRINE_DEMONSTRACAO}
                checked={IS_VITRINE_DEMONSTRACAO ? false : mapState.mostrarSolosEmbrapa}
                onChange={(e) => {
                  if (!IS_VITRINE_DEMONSTRACAO) {
                    setMapState({ mostrarSolosEmbrapa: e.target.checked });
                  }
                }}
                className="accent-emerald-600 rounded"
              />
              <span>
                Solos Embrapa (WMS Oficial){" "}
                {IS_VITRINE_DEMONSTRACAO ? "(Desab. Offline)" : ""}
              </span>
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
        disabled={IS_VITRINE_DEMONSTRACAO}
        onClick={() => {
          if (!IS_VITRINE_DEMONSTRACAO) {
            setMapState((prev) => ({ terreno3d: !prev.terreno3d }));
          }
        }}
        className={`h-9 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-lg backdrop-blur-md ${
          IS_VITRINE_DEMONSTRACAO
            ? "bg-white/95 text-slate-500 border-slate-300 opacity-70 cursor-not-allowed"
            : mapState.terreno3d
            ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40 cursor-pointer"
            : "bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 cursor-pointer"
        }`}
        title={
          IS_VITRINE_DEMONSTRACAO
            ? AVISO_OPERACAO_DESABILITADA
            : "Alternar relevo 3D DEM Copernicus (Botão direito: Ver fórmula do Fator LS e Declividade)"
        }
      >
        <Mountain
          className={`w-3.5 h-3.5 ${
            !IS_VITRINE_DEMONSTRACAO && mapState.terreno3d
              ? "text-white"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        />
        <span>
          {IS_VITRINE_DEMONSTRACAO
            ? "Modo 2D (DEM Desab.)"
            : mapState.terreno3d
            ? "Relevo 3D"
            : "Modo 2D"}
        </span>
      </button>

      {/* 4. Exagero DEM 3D (apenas ativo se terreno3d estiver ligado) */}
      {!IS_VITRINE_DEMONSTRACAO && mapState.terreno3d && (
        <div className="h-9 px-2 bg-white/95 dark:bg-slate-900/95 border border-slate-300 dark:border-slate-700 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-1 text-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase pl-1">DEM:</span>
          {[1.0, 1.5, 2.5].map((factor) => (
            <button
              key={factor}
              onClick={() => setMapState({ exageracao3d: factor })}
              className={`min-w-[24px] min-h-[24px] px-1.5 py-0.5 rounded text-[11px] font-mono font-bold transition-all flex items-center justify-center ${
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
