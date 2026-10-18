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
  MoreHorizontal,
} from "lucide-react";
import { useSarelStore, usePontosVisiveis } from "@/store/useSarelStore";
import { DECISOES } from "@/config/decisoes";
import { obterDistribuicaoAcoes } from "./acoesCabecalho";

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

  const [larguraJanela, setLarguraJanela] = useState(1440);
  const [menuConfigAberto, setMenuConfigAberto] = useState(false);
  const [menuMaisAcoesAberto, setMenuMaisAcoesAberto] = useState(false);

  const configRef = useRef<HTMLDivElement>(null);
  const maisAcoesRef = useRef<HTMLDivElement>(null);
  const btnMaisAcoesRef = useRef<HTMLButtonElement>(null);

  // Monitora largura da janela de forma reativa
  useEffect(() => {
    if (typeof window === "undefined") return;
    const atualizarLargura = () => setLarguraJanela(window.innerWidth);
    atualizarLargura();
    window.addEventListener("resize", atualizarLargura);
    return () => window.removeEventListener("resize", atualizarLargura);
  }, []);

  const distribuicao = obterDistribuicaoAcoes(larguraJanela);

  // Fecha os dropdowns ao clicar fora
  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      const target = e.target as Node;
      if (configRef.current && !configRef.current.contains(target)) {
        setMenuConfigAberto(false);
      }
      if (maisAcoesRef.current && !maisAcoesRef.current.contains(target)) {
        setMenuMaisAcoesAberto(false);
      }
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  // Fecha menu Mais Ações no Escape e devolve foco ao botão (A11y U01)
  useEffect(() => {
    if (!menuMaisAcoesAberto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuMaisAcoesAberto(false);
        btnMaisAcoesRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuMaisAcoesAberto]);

  // Fecha menu Configurações no Escape
  useEffect(() => {
    if (!menuConfigAberto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuConfigAberto(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuConfigAberto]);

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
    <header className="h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 flex items-center justify-between relative z-30 shrink-0 transition-colors shadow-sm overflow-visible max-w-full">
      {/* Esquerda: Identidade do Sistema SAREL */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-600 font-black text-white shadow-md shadow-emerald-600/30 shrink-0">
          S
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white">
              SAREL
            </h1>
            <span className="rounded bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              v2.0
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden lg:inline">
              Rigor Metodológico
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] 2xl:max-w-none hidden 2xl:block">
            Sistema de Amostragem e Rotulagem para Erosão Laminar — PPGTCA 2026
          </p>
        </div>
      </div>

      {/* Centro / Direita: Controles e Disparadores de Centrais */}
      <div className="flex items-center gap-1 sm:gap-1.5 xl:gap-2 py-1 overflow-visible shrink-0 max-w-[calc(100vw-140px)] justify-end">
        {/* 0. Botão de Modo Defesa / Apresentação Científica */}
        {distribuicao.noCabecalho.includes("defesa") && (
          <button
            onClick={toggleModoApresentacao}
            aria-label="Modo de Defesa e Tour Metodológico"
            className={`h-9 px-2 sm:px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer shadow-sm ${
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
              {modoApresentacaoAtivo ? "Defesa Ativa" : "Defesa / Tour"}
            </span>
            {modoApresentacaoAtivo && (
              <span className="w-2 h-2 rounded-full bg-white animate-ping ml-0.5" />
            )}
          </button>
        )}

        {/* 1. Seletor de AOI / Região Ativa */}
        {distribuicao.noCabecalho.includes("aoi") && (
          <button
            data-metodologia="aoi-selector"
            onClick={() => setModalAtiva("region")}
            aria-label="Seletor de Área de Interesse"
            className="h-9 px-2 sm:px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
            title="Clique para selecionar município, bacia, estado ou gerenciar polígonos ativos (Botão direito: Ver cálculo geodésico)"
          >
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="max-w-[90px] sm:max-w-[120px] truncate text-slate-800 dark:text-slate-100 font-medium">
              {rotuloAoi}
            </span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 font-mono font-bold">
              {areasAtivas.length}
            </span>
          </button>
        )}

        {/* 2. Contador de Pontos Reais e Provisórios */}
        {distribuicao.noCabecalho.includes("amostras") && (
          <div
            data-metodologia="thinning-espacial"
            className="h-9 px-2 sm:px-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-600/40 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            title="Amostras ativas pós-thinning espacial (Botão direito: Ver fórmula de descorrelação espacial)"
          >
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong className="text-slate-900 dark:text-white font-bold">
                {pontosVisiveis.length}
              </strong>{" "}
              <span className="hidden sm:inline">Amostras</span>
              {pontosProvisorios.length > 0 && (
                <span className="ml-1 text-amber-600 dark:text-amber-400 font-mono text-[10px] hidden md:inline">
                  ({pontosProvisorios.length})
                </span>
              )}
            </span>
          </div>
        )}

        {/* 3. Alternador de Tema */}
        {distribuicao.noCabecalho.includes("tema") && (
          <button
            onClick={toggleTema}
            aria-label="Alternar tema claro e escuro"
            className="h-9 w-9 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center shrink-0 cursor-pointer min-w-[24px] min-h-[24px]"
            title={tema === "dark" ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
          >
            {tema === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        )}

        {/* Divisor Vertical */}
        {distribuicao.noCabecalho.includes("candidatos") && (
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />
        )}

        {/* 4. Central de Amostragem GEE */}
        {distribuicao.noCabecalho.includes("candidatos") && (
          <button
            data-metodologia="amostragem-gee"
            onClick={() => setModalAtiva("candidates")}
            aria-label="Amostragem GEE"
            className="h-9 px-2 sm:px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/70 dark:text-indigo-300 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
            title="Triagem Amostral no Google Earth Engine (Botão direito: Ver scripts e fórmulas NDVI/BSI)"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="hidden sm:inline">Amostragem GEE</span>
          </button>
        )}

        {/* 5. Central de Campanha & Rótulos */}
        {distribuicao.noCabecalho.includes("campanha") && (
          <button
            data-metodologia="campanha-rotulos"
            onClick={() => setModalAtiva("campanha")}
            aria-label="Campanha e Rótulos"
            className="h-9 px-2 sm:px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
            title="Central de Campanha & Ingestão de Rótulos (Botão direito: Ver cálculo do Índice Kappa de Cohen)"
          >
            <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="hidden md:inline">Campanha &amp; Rótulos</span>
          </button>
        )}

        {/* 6. Central da Matriz de Treino */}
        {distribuicao.noCabecalho.includes("matriz") && (
          <button
            data-metodologia="matriz-treino"
            onClick={() => setModalAtiva("matriz")}
            aria-label="Montagem da Matriz de Treino"
            className="h-9 px-2 sm:px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
            title="Montagem da Matriz de Treino (Botão direito: Ver cálculo do VIF e Spatial Block CV)"
          >
            <Table className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="hidden md:inline">Matriz de Treino</span>
          </button>
        )}

        {/* Divisor Vertical */}
        {distribuicao.noCabecalho.includes("config") && (
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />
        )}

        {/* 7. Menu de Configurações, Decisões e Diagnóstico (Engrenagem) */}
        {distribuicao.noCabecalho.includes("config") && (
          <div className="relative" ref={configRef}>
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-sm overflow-hidden h-9">
              <button
                data-metodologia="menu-configuracoes"
                onClick={() => setModalAtiva("settings")}
                aria-label="Configurações"
                className="h-full px-2 sm:px-2.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1 shrink-0 relative cursor-pointer min-w-[24px] min-h-[24px]"
                title="Configurações de Conexão com GEE, Planet, Mapbox e Embrapa"
              >
                <Settings className="w-4 h-4 text-slate-600 dark:text-slate-300" />
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

              <button
                onClick={() => setMenuConfigAberto(!menuConfigAberto)}
                aria-label="Governança, Decisões e Diagnóstico"
                aria-expanded={menuConfigAberto}
                aria-controls="menu-config-dropdown"
                className="h-full px-1.5 border-l border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all flex items-center justify-center cursor-pointer min-w-[24px] min-h-[24px]"
                title="Governança, Decisões e Diagnóstico"
              >
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                    menuConfigAberto ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {/* Dropdown Menu com Governança e Configurações */}
            {menuConfigAberto && (
              <div
                id="menu-config-dropdown"
                role="menu"
                className="light-popup absolute right-0 top-full mt-2 w-64 bg-white border-2 border-slate-300 ring-2 ring-black/15 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 space-y-1 text-slate-900"
              >
                <div className="px-3 py-1.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                    Governança &amp; Sistema
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono font-bold">SAREL v2.0</span>
                </div>

                {/* 7.1. Conexão & Chaves API */}
                <button
                  data-metodologia="config-api"
                  role="menuitem"
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
                  role="menuitem"
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

                {/* 7.3. Relatório de Erros & Diagnóstico */}
                <button
                  data-metodologia="diagnostico"
                  role="menuitem"
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
        )}

        {/* 8. Central de Exportação */}
        {distribuicao.noCabecalho.includes("export") && (
          <button
            data-metodologia="exportacao-oficial"
            onClick={() => setModalAtiva("export")}
            aria-label="Exportar dados oficiais"
            className="h-9 px-2 sm:px-2.5 xl:px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
            title="Exportar dados: Planilha Oficial XLSX, CSV, GeoJSON e Shapefile (Botão direito: Ver integridade SHA-256)"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        )}

        {/* 9. Menu "Mais Ações" Responsivo (U01) */}
        {distribuicao.noMenu.length > 0 && (
          <div className="relative" ref={maisAcoesRef}>
            <button
              id="btn-mais-acoes"
              ref={btnMaisAcoesRef}
              onClick={() => setMenuMaisAcoesAberto(!menuMaisAcoesAberto)}
              aria-label="Mais ações do cabeçalho"
              aria-expanded={menuMaisAcoesAberto}
              aria-controls="menu-mais-acoes-dropdown"
              className={`h-9 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 shrink-0 relative cursor-pointer shadow-sm min-w-[24px] min-h-[24px] ${
                menuMaisAcoesAberto
                  ? "bg-slate-200 dark:bg-slate-700 border-slate-400 text-slate-900 dark:text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 hover:border-emerald-500/50"
              }`}
              title="Mais ações e ferramentas"
            >
              <MoreHorizontal className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {menuMaisAcoesAberto && (
              <div
                id="menu-mais-acoes-dropdown"
                role="menu"
                className="light-popup absolute right-0 top-full mt-2 w-56 bg-white border-2 border-slate-300 ring-2 ring-black/15 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 space-y-1 text-slate-900"
              >
                <div className="px-3 py-1.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                    Mais Ações
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">SAREL v2</span>
                </div>

                {distribuicao.noMenu.includes("defesa") && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      toggleModoApresentacao();
                      setMenuMaisAcoesAberto(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span>{modoApresentacaoAtivo ? "Desativar Defesa" : "Modo Defesa / Tour"}</span>
                  </button>
                )}

                {distribuicao.noMenu.includes("tema") && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      toggleTema();
                      setMenuMaisAcoesAberto(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    {tema === "dark" ? (
                      <>
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span>Mudar para Modo Claro</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4 text-indigo-600" />
                        <span>Mudar para Modo Escuro</span>
                      </>
                    )}
                  </button>
                )}

                {distribuicao.noMenu.includes("candidatos") && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setModalAtiva("candidates");
                      setMenuMaisAcoesAberto(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Amostragem GEE</span>
                  </button>
                )}

                {distribuicao.noMenu.includes("campanha") && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setModalAtiva("campanha");
                      setMenuMaisAcoesAberto(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    <span>Campanha &amp; Rótulos</span>
                  </button>
                )}

                {distribuicao.noMenu.includes("matriz") && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setModalAtiva("matriz");
                      setMenuMaisAcoesAberto(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Table className="w-4 h-4 text-emerald-600" />
                    <span>Matriz de Treino</span>
                  </button>
                )}

                {distribuicao.noMenu.includes("config") && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setModalAtiva("settings");
                      setMenuMaisAcoesAberto(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-600" />
                    <span>Configurações &amp; Chaves</span>
                  </button>
                )}

                {distribuicao.noMenu.includes("export") && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setModalAtiva("export");
                      setMenuMaisAcoesAberto(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Exportar Dados</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
