"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Globe,
  MapPin,
  Sun,
  Moon,
  Sparkles,
  Settings,
  Activity,
  FileSpreadsheet,
  Table,
  ClipboardList,
  BookOpen,
  GraduationCap,
  ChevronDown,
  Key,
} from "lucide-react";
import { useSarelStore, usePontosVisiveis } from "@/store/useSarelStore";
import { DECISOES } from "@/config/decisoes";

export const Header: React.FC = () => {
  const {
    tema,
    toggleTema,
    setModalAtiva,
    areas,
    pontosProvisorios,
    credenciais,
    systemLogs,
    modoApresentacaoAtivo,
    toggleModoApresentacao,
    itemMetodologicoAtivoId,
  } = useSarelStore();

  const [menuConfigAberto, setMenuConfigAberto] = useState(false);
  const configRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      if (configRef.current && !configRef.current.contains(e.target as Node)) {
        setMenuConfigAberto(false);
      }
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  // Abre automaticamente a engrenagem se o item em foco na Tour estiver dentro dela,
  // ou fecha caso o foco mude para outro elemento fora da engrenagem
  useEffect(() => {
    if (
      itemMetodologicoAtivoId === "config-api" ||
      itemMetodologicoAtivoId === "decisoes-metodologicas" ||
      itemMetodologicoAtivoId === "diagnostico"
    ) {
      setMenuConfigAberto(true);
    } else if (modoApresentacaoAtivo) {
      setMenuConfigAberto(false);
    }
  }, [itemMetodologicoAtivoId, modoApresentacaoAtivo]);

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

  const qtdErrosLogs = systemLogs.filter((l) => l.severity === "error").length;
  const temErrosLogs = qtdErrosLogs > 0;

  return (
    <header className="h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between relative z-30 shrink-0 transition-colors shadow-sm overflow-visible">
      {/* Esquerda: Identidade do Sistema SAREL */}
      <div className="flex items-center gap-3 shrink-0">
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
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] xl:max-w-[320px] 2xl:max-w-none hidden md:block">
            Sistema de Amostragem e Rotulagem para Erosão Laminar — PPGTCA 2026
          </p>
        </div>
      </div>

      {/* Centro / Direita: Controles e Disparadores de Centrais */}
      <div className="flex items-center gap-1.5 sm:gap-2 py-1 overflow-visible shrink-0">
        {/* 0. Botão de Modo Defesa / Apresentação Científica */}
        <button
          onClick={toggleModoApresentacao}
          className={`h-9 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer shadow-sm ${
            modoApresentacaoAtivo
              ? "bg-gradient-to-r from-amber-600 via-emerald-600 to-teal-600 text-white border-amber-400 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 hover:border-emerald-500/50"
          }`}
          title="Ativar/Desativar Modo de Apresentação e Tour Metodológico (Clique direito em qualquer botão para ver os cálculos)"
        >
          <GraduationCap
            className={`w-4 h-4 shrink-0 ${
              modoApresentacaoAtivo
                ? "text-white animate-bounce"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          />
          <span className="hidden sm:inline">
            {modoApresentacaoAtivo ? "Defesa Ativa" : "Modo Defesa / Tour"}
          </span>
          {modoApresentacaoAtivo && (
            <span className="w-2 h-2 rounded-full bg-white animate-ping ml-0.5" />
          )}
        </button>

        {/* 1. Seletor de AOI / Região Ativa */}
        <button
          data-metodologia="aoi-selector"
          onClick={() => setModalAtiva("region")}
          className="h-9 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
          title="Clique para selecionar município, bacia, estado ou gerenciar polígonos ativos (Botão direito: Ver cálculo geodésico)"
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
        <div
          data-metodologia="thinning-espacial"
          className="h-9 px-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-600/40 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 shrink-0 whitespace-nowrap"
          title="Amostras ativas pós-thinning espacial (Botão direito: Ver fórmula de descorrelação espacial)"
        >
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

        {/* 3. Alternador de Tema */}
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

        {/* 4. Central de Amostragem GEE */}
        <button
          data-metodologia="amostragem-gee"
          onClick={() => setModalAtiva("candidates")}
          className="h-9 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/70 dark:text-indigo-300 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
          title="Triagem Amostral no Google Earth Engine (Botão direito: Ver scripts e fórmulas NDVI/BSI)"
        >
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="hidden md:inline">Amostragem GEE</span>
        </button>

        {/* 5. Central de Campanha & Rótulos */}
        <button
          data-metodologia="campanha-rotulos"
          onClick={() => setModalAtiva("campanha")}
          className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
          title="Central de Campanha & Ingestão de Rótulos (Botão direito: Ver cálculo do Índice Kappa de Cohen)"
        >
          <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="hidden lg:inline">Campanha &amp; Rótulos</span>
        </button>

        {/* 6. Central da Matriz de Treino */}
        <button
          data-metodologia="matriz-treino"
          onClick={() => setModalAtiva("matriz")}
          className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
          title="Montagem da Matriz de Treino (Botão direito: Ver cálculo do VIF e Spatial Block CV)"
        >
          <Table className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="hidden xl:inline">Matriz de Treino</span>
        </button>

        {/* Divisor Vertical */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 shrink-0" />

        {/* 7. Menu de Configurações, Decisões e Diagnóstico (Engrenagem) */}
        <div className="relative" ref={configRef}>
          <button
            data-metodologia="menu-configuracoes"
            onClick={() => setMenuConfigAberto(!menuConfigAberto)}
            className={`h-9 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 shrink-0 relative cursor-pointer shadow-sm ${
              menuConfigAberto
                ? "bg-slate-200 dark:bg-slate-700 border-slate-400 text-slate-900 dark:text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 hover:border-emerald-500/50"
            }`}
            title="Configurações, Governança, Decisões e Diagnóstico"
          >
            <Settings
              className={`w-4 h-4 text-slate-600 dark:text-slate-300 transition-transform duration-200 ${
                menuConfigAberto ? "rotate-45" : ""
              }`}
            />
            <ChevronDown className="w-3 h-3 text-slate-400" />

            {/* Indicador de Status Combinado */}
            {credenciais.geeSessionActive && !temErrosLogs && (
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"
                title="GEE Conectado e Ativo"
              />
            )}
            {temErrosLogs && (
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"
                title="Erros no diagnóstico"
              />
            )}
          </button>

          {/* Dropdown Menu com Governança e Configurações (Modo Claro de Alto Contraste) */}
          {menuConfigAberto && (
            <div className="light-popup absolute right-0 top-full mt-2 w-64 bg-white border-2 border-slate-300 ring-2 ring-black/15 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 space-y-1 text-slate-900">
              <div className="px-3 py-1.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                  Governança &amp; Sistema
                </span>
                <span className="text-[10px] text-slate-600 font-mono font-bold">SAREL v2.0</span>
              </div>

              {/* 7.1. Conexão & Chaves API */}
              <button
                data-metodologia="config-api"
                onClick={() => {
                  setModalAtiva("settings");
                  setMenuConfigAberto(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-between group cursor-pointer"
                title="Configurações de Conexão com GEE, Planet, Mapbox e Embrapa (Botão direito: Ver governança de credenciais)"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-300 shrink-0">
                    <Key className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block font-extrabold text-slate-950">Conexão &amp; Chaves</span>
                    <span className="text-[10px] text-slate-600 block font-medium">GEE, PlanetScope, Mapbox</span>
                  </div>
                </div>
                {credenciais.geeSessionActive ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 font-extrabold px-1.5 py-0.5 rounded border border-emerald-400">
                    Ativo
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded border border-slate-300">
                    Offline
                  </span>
                )}
              </button>

              {/* 7.2. Decisões Metodológicas */}
              <button
                data-metodologia="decisoes-metodologicas"
                onClick={() => {
                  setModalAtiva("decisoes");
                  setMenuConfigAberto(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-between group cursor-pointer"
                title="Registro Oficial de Decisões Metodológicas da Dissertação (Botão direito: Ver rastreabilidade D01 a D19)"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-300 shrink-0">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block font-extrabold text-slate-950">Decisões da Pesquisa</span>
                    <span className="text-[10px] text-slate-600 block font-medium">Compêndio Epistemológico</span>
                  </div>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-900 font-extrabold px-1.5 py-0.5 rounded border border-indigo-300 font-mono">
                  {totalDecisoes}
                </span>
              </button>

              {/* 7.3. Relatório de Erros & Diagnóstico (Governança & Sistema) */}
              <button
                data-metodologia="diagnostico"
                onClick={() => {
                  setModalAtiva("diagnostics");
                  setMenuConfigAberto(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-between group cursor-pointer"
                title="Relatório de Erros, Diagnóstico e Integridade Científica em Governança & Sistema"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center border border-cyan-300 shrink-0">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block font-extrabold text-slate-950">Relatório de Erros &amp; Logs</span>
                    <span className="text-[10px] text-slate-600 block font-medium">Diagnóstico e Invariantes</span>
                  </div>
                </div>
                {temErrosLogs ? (
                  <span className="text-[10px] bg-rose-100 text-rose-900 font-extrabold px-1.5 py-0.5 rounded border border-rose-400">
                    {qtdErrosLogs} {qtdErrosLogs === 1 ? "Erro" : "Erros"}
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 font-extrabold px-1.5 py-0.5 rounded border border-emerald-400">
                    0 Erros
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* 8. Central de Exportação */}
        <button
          data-metodologia="exportacao-oficial"
          onClick={() => setModalAtiva("export")}
          className="h-9 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
          title="Exportar dados: Planilha Oficial XLSX, CSV, GeoJSON e Shapefile (Botão direito: Ver integridade SHA-256)"
        >
          <FileSpreadsheet className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>
    </header>
  );
};
