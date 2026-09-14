"use client";

import React from "react";
import {
  Globe,
  MapPin,
  Sun,
  Moon,
  Mountain,
  Sparkles,
  Settings,
  Activity,
  FileSpreadsheet,
  Table,
  ClipboardList,
  BookOpen,
} from "lucide-react";
import { useSarelStore, usePontosVisiveis } from "@/store/useSarelStore";
import { DECISOES } from "@/config/decisoes";

export const Header: React.FC = () => {
  const {
    tema,
    toggleTema,
    mapState,
    setMapState,
    setModalAtiva,
    areas,
    pontos,
    pontosProvisorios,
    credenciais,
    systemLogs,
  } = useSarelStore();

  const pontosVisiveis = usePontosVisiveis();
  const totalDecisoes = Object.keys(DECISOES).length;

  // Identificação da AOI ativa
  const areasAtivas = areas.filter((a) => a.ativa);
  let rotuloAoi = "Paraná (IBGE)";
  if (areasAtivas.length === 1) {
    rotuloAoi = areasAtivas[0].nome;
  } else if (areasAtivas.length > 1) {
    rotuloAoi = `${areasAtivas[0].nome} (+${areasAtivas.length - 1})`;
  } else {
    rotuloAoi = "Nenhuma área ativa";
  }

  const toggleTerreno3d = () => {
    setMapState((prev) => ({ terreno3d: !prev.terreno3d }));
  };

  const temErrosLogs = systemLogs.some((l) => l.severity === "error");

  return (
    <header className="h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-30 shrink-0 transition-colors shadow-sm">
      {/* Esquerda: Identidade do Sistema SAREL */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-black text-white shadow-md shadow-emerald-600/30 shrink-0">
          S
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
              SAREL
            </h1>
            <span className="rounded bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              v2.0
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
              Rigor Metodológico
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[280px] lg:max-w-none">
            Sistema de Amostragem e Rotulagem para Erosão Laminar — PPGTCA 2026
          </p>
        </div>
      </div>

      {/* Centro / Direita: Controles e Disparadores de Centrais */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {/* 1. Seletor de AOI / Região Ativa */}
        <button
          onClick={() => setModalAtiva("region")}
          className="h-9 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
          title="Clique para selecionar município, bacia, estado ou gerenciar polígonos ativos"
        >
          <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="max-w-[140px] truncate text-slate-800 dark:text-slate-100 font-medium">
            {rotuloAoi}
          </span>
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 font-mono font-bold">
            {areasAtivas.length}
          </span>
        </button>

        {/* 2. Contador de Pontos Reais e Provisórios */}
        <div className="h-9 px-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-600/40 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong className="text-slate-900 dark:text-white font-bold">
              {pontosVisiveis.length}
            </strong>{" "}
            Amostras
            {pontosProvisorios.length > 0 && (
              <span className="ml-1 text-amber-600 dark:text-amber-400 font-mono text-[10px]">
                ({pontosProvisorios.length} provisórias)
              </span>
            )}
          </span>
        </div>

        {/* 3. Relevo 3D / 2D Toggle */}
        <button
          onClick={toggleTerreno3d}
          className={`h-9 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
            mapState.terreno3d
              ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30"
              : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
          }`}
          title="Alternar relevo 3D DEM Copernicus"
        >
          <Mountain className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">
            {mapState.terreno3d ? "Relevo 3D" : "Modo 2D"}
          </span>
        </button>

        {/* 4. Alternador de Tema */}
        <button
          onClick={toggleTema}
          className="h-9 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center shrink-0 cursor-pointer"
          title={tema === "dark" ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
        >
          {tema === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Divisor Vertical */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 shrink-0" />

        {/* 5. Central de Amostragem GEE */}
        <button
          onClick={() => setModalAtiva("candidates")}
          className="h-9 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/70 dark:text-indigo-300 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
          title="Triagem Amostral no Google Earth Engine (Elegibilidade, Estratificação e Thinning)"
        >
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="hidden md:inline">Amostragem GEE</span>
        </button>

        {/* 6. Central de Campanha & Rótulos */}
        <button
          onClick={() => setModalAtiva("campanha")}
          className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
          title="Central de Campanha & Ingestão de Rótulos (Kobo, Drone, Kappa)"
        >
          <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="hidden lg:inline">Campanha &amp; Rótulos</span>
        </button>

        {/* 7. Central da Matriz de Treino */}
        <button
          onClick={() => setModalAtiva("matriz")}
          className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
          title="Montagem da Matriz de Treino e Invariantes Matemáticos"
        >
          <Table className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="hidden xl:inline">Matriz de Treino</span>
        </button>

        {/* 8. Decisões Metodológicas (D01 a D19) */}
        <button
          onClick={() => setModalAtiva("decisoes")}
          className="h-9 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer"
          title="Registro Oficial de Decisões Metodológicas da Dissertação"
        >
          <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="hidden 2xl:inline">Decisões</span>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1 py-0.2 rounded font-mono">
            {totalDecisoes}
          </span>
        </button>

        {/* 9. Configurações & Chaves API */}
        <button
          onClick={() => setModalAtiva("settings")}
          className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap relative cursor-pointer"
          title="Configurações de Conexão com GEE, Planet, Mapbox e Embrapa"
        >
          <Settings className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Conexão &amp; Chaves</span>
          {credenciais.geeSessionActive && (
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"
              title="GEE Conectado e Ativo"
            />
          )}
        </button>

        {/* 10. Diagnóstico e Auditoria */}
        <button
          onClick={() => setModalAtiva("diagnostics")}
          className="h-9 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center shrink-0 relative cursor-pointer"
          title="Relatório de Diagnóstico e Integridade Científica"
        >
          <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          {temErrosLogs && (
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"
              title="Erros no diagnóstico"
            />
          )}
        </button>

        {/* 11. Central de Exportação */}
        <button
          onClick={() => setModalAtiva("export")}
          className="h-9 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
          title="Exportar dados: Planilha Oficial XLSX, CSV, GeoJSON e Shapefile"
        >
          <FileSpreadsheet className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>
    </header>
  );
};
