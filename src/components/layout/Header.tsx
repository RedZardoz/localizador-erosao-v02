"use client";

import React from "react";
import {
  Layers,
  Settings,
  Download,
  MapPin,
  Mountain,
  Globe,
  Sliders,
  ShieldCheck,
  FileSpreadsheet,
  PlusCircle,
  Menu,
  Sun,
  Moon,
  Sparkles,
  Bookmark,
  Activity,
  FolderArchive,
} from "lucide-react";
import { useErosionStore, useFilteredPoints } from "@/lib/store/useErosionStore";

/**
 * ============================================================================
 * Cabeçalho Principal da Aplicação (Header Bar)
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * Apresenta navegação harmonizada com altura uniforme (h-9 / 36px) e
 * espaçamento equidistante em todos os controles:
 * - Seletor de Região/AOI e Contador de Focos Triados
 * - Alternância de Tema Claro / Escuro
 * - Modo Relevo 3D DEM / 2D
 * - Seleção de Candidatos no GEE
 * - Hub Unificado de Projetos & Dados Espaciais (Pontos, Talhões e Exportação SIG)
 * - Central de Diagnóstico de Integridade
 * - Conexão GEE & Ingestão de Dados
 */
export const Header: React.FC = () => {
  const {
    allPoints,
    activeRegion,
    filters,
    gcpCredentials,
    activeAOIPolygon,
    dataSource,
    mapState,
    sidebarCollapsed,
    theme,
    savedDatasets,
    drawnPolygons,
    systemLogs,
    toggleTheme,
    setActiveModal,
    toggleTerrain3D,
    toggleSidebar,
  } = useErosionStore();

  const filteredPoints = useFilteredPoints();
  const filteredCount = filteredPoints.length;

  return (
    <header className="h-16 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-30 sticky top-0 shadow-sm dark:shadow-lg transition-colors duration-200">
      {/* Left section: Logo, Title & Sidebar Toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={toggleSidebar}
          className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
            sidebarCollapsed
              ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/70 dark:border-emerald-700 dark:text-emerald-300 shadow-sm"
              : "text-slate-600 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200 border-slate-200 dark:text-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:border-slate-700"
          }`}
          title={sidebarCollapsed ? "Expandir Painel Lateral (Focos e Filtros)" : "Recolher Painel Lateral"}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/30 shrink-0">
            <Mountain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                Localizador de Erosão &amp; Propriedade
                <span className="text-[9px] font-bold uppercase bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  2D / 3D
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden xl:block whitespace-nowrap">
              Mestrado PPGTCA • Pesquisa de Erosão Laminar (Brasil)
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls Container: Todos com exatamente a mesma altura (h-9 / 36px) e espaçamento equidistante (gap-2) */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-1">
        {/* 1. Active Region / AOI Selector */}
        <button
          onClick={() => setActiveModal("region")}
          className="h-9 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap group cursor-pointer"
          title="Clique para trocar de região, selecionar município ou carregar polígono de AOI"
        >
          <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
          <span className="max-w-[160px] truncate text-slate-800 dark:text-slate-100">
            {activeAOIPolygon ? `AOI: ${activeAOIPolygon.name}` : activeRegion.name}
          </span>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 font-mono">
            {activeRegion.state}
          </span>
        </button>

        {/* 2. Active Points Counter Pill */}
        <div className="h-9 px-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-600/40 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {filteredCount < allPoints.length ? (
              <>
                <strong className="text-slate-900 dark:text-white font-bold">{filteredCount}</strong> de {allPoints.length} Focos
              </>
            ) : (
              <>
                <strong className="text-slate-900 dark:text-white font-bold">{allPoints.length}</strong> Focos Triados
              </>
            )}
          </span>
        </div>

        {/* 3. Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap group cursor-pointer"
          title={theme === "dark" ? "Mudar para interface clara (Modo Claro)" : "Mudar para interface escura (Modo Escuro)"}
          aria-label="Alternar interface clara ou escura"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform shrink-0" />
              <span className="hidden sm:inline">Tema Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform shrink-0" />
              <span className="hidden sm:inline">Tema Escuro</span>
            </>
          )}
        </button>

        {/* 4. 3D Relevo / 2D Toggle */}
        <button
          onClick={toggleTerrain3D}
          className={`h-9 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
            mapState.terrain3d
              ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30"
              : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
          }`}
          title="Ativar / Desativar Terreno 3D DEM"
        >
          <Mountain className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">{mapState.terrain3d ? "Relevo 3D" : "Modo 2D"}</span>
        </button>

        {/* 5. Candidatos GEE Modal Trigger */}
        <button
          onClick={() => setActiveModal("candidates")}
          className="h-9 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 hover:border-indigo-300 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/70 dark:text-indigo-300 dark:border-indigo-800 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap group cursor-pointer"
          title="Selecionar candidatos reais de campo via Earth Engine (Elegibilidade + Estratificação + Thinning)"
        >
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
          <span className="hidden lg:inline">Candidatos GEE</span>
        </button>

        {/* 6. Settings & Credentials Trigger */}
        <button
          onClick={() => setActiveModal("settings")}
          className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 dark:hover:border-slate-600 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap relative cursor-pointer"
          title="Configurações de Credenciais GEE e Ingestão de Dados"
        >
          <Settings className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Conexão &amp; Dados</span>
          {gcpCredentials && (
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"
              title="GEE Conectado"
            />
          )}
        </button>

        {/* 7. Diagnostics & Logs Trigger */}
        <button
          onClick={() => setActiveModal("diagnostics")}
          className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 dark:hover:border-slate-600 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap relative group cursor-pointer"
          title="Relatório de Diagnóstico e Integridade do Sistema"
        >
          <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
          <span className="hidden xl:inline">Diagnóstico</span>
          {systemLogs.some((l) => l.severity === "error") && (
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"
              title="Erros registrados no diagnóstico"
            />
          )}
        </button>

        {/* 8. Hub Unificado de Projetos & Dados Espaciais (Pontos, Talhões e Exportação SIG) */}
        <button
          onClick={() => setActiveModal("data-manager")}
          className="h-9 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 hover:border-emerald-300 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/70 dark:text-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap relative group cursor-pointer"
          title="Gestor de Dados Espaciais & Projetos: Salvar/carregar pontos, delimitar talhões e exportar em Shapefile, KML, GeoJSON e CSV"
        >
          <FolderArchive className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
          <span className="hidden sm:inline">Projetos &amp; Dados</span>
          {(savedDatasets.length > 0 || drawnPolygons.length > 0) && (
            <span className="text-[10px] bg-emerald-600 text-white font-mono font-bold px-1.5 py-0.2 rounded-full">
              {savedDatasets.length + drawnPolygons.length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
