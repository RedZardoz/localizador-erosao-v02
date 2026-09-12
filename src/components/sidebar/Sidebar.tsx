"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Activity, ListFilter } from "lucide-react";
import { useSarelStore, usePontosVisiveis } from "@/store/useSarelStore";
import { RegionAndTopNSelector } from "./RegionAndTopNSelector";
import { StatsOverview } from "./StatsOverview";
import { FiltersPanel } from "./FiltersPanel";
import { PointCardList } from "./PointCardList";

export const Sidebar: React.FC = () => {
  const {
    sidebarRecolhida,
    toggleSidebar,
    abaSidebar,
    setAbaSidebar,
    pontos,
    pontosProvisorios,
  } = useSarelStore();

  const pontosVisiveis = usePontosVisiveis();
  const totalPontos = pontos.length + pontosProvisorios.length;

  const countLabel =
    pontosVisiveis.length < totalPontos
      ? `${pontosVisiveis.length}/${totalPontos}`
      : `${totalPontos}`;

  return (
    <>
      {/* Botão flutuante para expandir quando a barra está recolhida */}
      {sidebarRecolhida && (
        <button
          onClick={toggleSidebar}
          className="fixed top-1/2 -translate-y-1/2 left-0 z-30 py-3 px-2 bg-white/95 dark:bg-slate-900/95 hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-700 hover:text-emerald-600 dark:text-slate-200 dark:hover:text-emerald-400 rounded-r-2xl border-y border-r border-slate-300 dark:border-slate-700 shadow-2xl backdrop-blur-md flex flex-col items-center gap-1.5 text-xs font-bold transition-all duration-200 cursor-pointer group"
          title="Expandir Painel Lateral"
        >
          <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          <span className="text-[10px] font-mono [writing-mode:vertical-lr] tracking-wide py-1 text-slate-800 dark:text-slate-200">
            Painel ({countLabel})
          </span>
        </button>
      )}

      {/* Painel Lateral Principal */}
      <aside
        className={`fixed lg:static top-16 bottom-0 left-0 z-20 w-80 sm:w-96 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-r border-slate-200 dark:border-slate-800/90 flex flex-col transition-all duration-300 shadow-xl dark:shadow-2xl ${
          sidebarRecolhida
            ? "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:border-none lg:p-0"
            : "translate-x-0"
        }`}
      >
        {/* Header e Abas da Barra Lateral */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-slate-50/80 dark:bg-slate-900/60 transition-colors">
          <div className="grid grid-cols-2 gap-1 bg-slate-200/70 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 w-full">
            <button
              onClick={() => setAbaSidebar("triagem")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                abaSidebar === "triagem"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Amostras ({pontosVisiveis.length})
            </button>

            <button
              onClick={() => setAbaSidebar("filtros")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                abaSidebar === "filtros"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              Filtros
            </button>
          </div>

          {/* Botão de recolher */}
          <button
            onClick={toggleSidebar}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
            title="Recolher Painel Lateral"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3.5 custom-scrollbar">
          <RegionAndTopNSelector />

          {abaSidebar === "triagem" ? (
            <>
              <StatsOverview />
              <PointCardList />
            </>
          ) : (
            <>
              <FiltersPanel />
              <StatsOverview />
            </>
          )}
        </div>
      </aside>
    </>
  );
};
