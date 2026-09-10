"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSarelStore, AbaNavegacao } from "@/store/useSarelStore";

const MapaAmostral = dynamic(
  () => import("@/components/mapa/MapaAmostral").then((mod) => mod.MapaAmostral),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#070b12] text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span className="text-xs font-mono">Carregando visualizador cartográfico...</span>
        </div>
      </div>
    ),
  }
);
import { InspetorPonto } from "@/components/inspetor/InspetorPonto";
import { PainelMatrizTreino } from "@/components/matriz/PainelMatrizTreino";
import { PainelCampanha } from "@/components/campanha/PainelCampanha";
import { ComparadorEvento } from "@/components/comparador/ComparadorEvento";
import { RelatorioQualidade } from "@/components/relatorios/RelatorioQualidade";
import { RelatorioReprodutibilidade } from "@/components/relatorios/RelatorioReprodutibilidade";

// Modais do Design System
import { RegionRequestModal } from "@/components/modais/RegionRequestModal";
import { CandidateSelectionModal } from "@/components/modais/CandidateSelectionModal";
import { SettingsModal } from "@/components/modais/SettingsModal";
import { ExportModal } from "@/components/modais/ExportModal";
import { SavedDatasetsModal } from "@/components/modais/SavedDatasetsModal";
import { SystemLogsModal } from "@/components/modais/SystemLogsModal";

import {
  Map,
  Compass,
  Table,
  ClipboardCheck,
  SplitSquareVertical,
  FileCheck2,
  ShieldCheck,
  MapPin,
  Sparkles,
  Key,
  FolderArchive,
  Download,
  Terminal,
  Menu,
  Sun,
  Moon,
  Mountain,
  Activity,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  const {
    abaAtiva,
    definirAba,
    pontos,
    aoiAtiva,
    modalAtivo,
    abrirModal,
    sidebarAberta,
    alternarSidebar,
    modo3d,
    alternarModo3d,
    tema,
    alternarTema,
  } = useSarelStore();

  const [subAbaRelatorio, setSubAbaRelatorio] = useState<"qualidade" | "reprodutibilidade">("qualidade");

  // Sincroniza classe HTML 'dark' e 'light' para compatibilidade total com Tailwind e CSS
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (tema === "light") {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      }
    }
  }, [tema]);

  const abas: { id: AbaNavegacao; label: string; icone: React.ComponentType<{ className?: string }> }[] = [
    { id: "mapa", label: "Mapa Amostral", icone: Map },
    { id: "inspetor", label: "Inspetor de Ponto", icone: Compass },
    { id: "matriz", label: "Matriz de Treino", icone: Table },
    { id: "campanha", label: "Campanha & Rótulos", icone: ClipboardCheck },
    { id: "comparador", label: "Comparador de Evento", icone: SplitSquareVertical },
    { id: "relatorios", label: "Relatórios Científicos", icone: FileCheck2 },
  ];

  return (
    <main
      className={`h-screen flex flex-col overflow-hidden select-none transition-colors duration-200 ${
        tema === "dark" ? "bg-[#080e1a] text-slate-100" : "bg-slate-100 text-slate-900"
      }`}
    >
      {/* 1. TOP HEADER INSTITUCIONAL (Fiel a 01_tela_principal_dashboard.png) */}
      <header
        className={`shrink-0 h-14 border-b px-3 sm:px-4 flex items-center justify-between z-30 shadow-md transition-colors duration-200 ${
          tema === "dark"
            ? "border-slate-800/90 bg-[#0a1222] text-white"
            : "border-slate-200 bg-white text-slate-900"
        }`}
      >
        {/* Identificação Esquerda */}
        <div className="flex items-center gap-2.5">
          {/* Botão Hamburger para Sidebar */}
          <button
            onClick={alternarSidebar}
            title={sidebarAberta ? "Recolher painel" : "Expandir painel lateral"}
            className={`rounded-lg p-1.5 transition-colors ${
              tema === "dark"
                ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Insígnia da Aplicação */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-black text-base shadow-md shadow-emerald-950">
            <Mountain className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`text-xs sm:text-sm font-black tracking-tight flex items-center gap-1.5 ${
                  tema === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                <span>SAREL</span>
                <span
                  className={`font-medium hidden md:inline ${
                    tema === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  · Localizador de Erosão &amp; Amostragem
                </span>
              </h1>
              <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-800/80 uppercase">
                2D / 3D
              </span>
            </div>
            <p
              className={`text-[10px] hidden sm:block truncate max-w-md ${
                tema === "dark" ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Mestrado PPGTCA 2026 · Pesquisa de Erosão Laminar (Paraná / Brasil)
            </p>
          </div>
        </div>

        {/* Ações e Controles Centrais / Direita */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
          {/* Pílula de Região / AOI Ativa */}
          <button
            onClick={() => abrirModal("region")}
            title="Clique para alterar a Área de Interesse (AOI)"
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-xs transition-all ${
              tema === "dark"
                ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400"
                : "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
            }`}
          >
            <MapPin className="h-3.5 w-3.5 text-cyan-500" />
            <span className="max-w-[130px] sm:max-w-[200px] truncate">{aoiAtiva.nome}</span>
            <span
              className={`rounded px-1 py-0.2 text-[9px] font-mono ${
                tema === "dark" ? "bg-cyan-900/80 text-cyan-300" : "bg-cyan-200 text-cyan-900"
              }`}
            >
              {aoiAtiva.uf || "PR"}
            </span>
          </button>

          {/* Contador de Focos / Pontos Amostrais */}
          <div
            className={`hidden md:flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${
              tema === "dark"
                ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                : "border-emerald-300 bg-emerald-50 text-emerald-800"
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            <span>{pontos.length} Focos Triados</span>
          </div>

          {/* Botão Alternar Tema - SEMPRE VISÍVEL */}
          <button
            onClick={alternarTema}
            title="Alternar entre tema claro e escuro"
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer ${
              tema === "dark"
                ? "border-amber-500/40 bg-slate-800/90 text-amber-300 hover:bg-slate-700 hover:border-amber-400"
                : "border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 shadow-sm"
            }`}
          >
            {tema === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400 animate-pulse" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-600" />
            )}
            <span className="font-semibold">{tema === "dark" ? "Tema Claro" : "Tema Escuro"}</span>
          </button>

          {/* Botão Relevo 3D */}
          <button
            onClick={alternarModo3d}
            title="Alternar modo de relevo tridimensional (DEM)"
            className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all ${
              modo3d
                ? "border-emerald-500 bg-emerald-700 text-white shadow-md shadow-emerald-950"
                : tema === "dark"
                ? "border-slate-700/80 bg-slate-800/70 text-slate-300 hover:bg-slate-700 hover:text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Mountain className="h-3.5 w-3.5 text-emerald-400" />
            <span>Relevo 3D</span>
          </button>

          {/* Botão Candidatos GEE / Amostragem */}
          <button
            onClick={() => abrirModal("candidate")}
            title="Amostragem estratificada e triagem de candidatos GEE"
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all ${
              tema === "dark"
                ? "border-indigo-500/40 bg-indigo-950/50 text-indigo-300 hover:bg-indigo-900/60"
                : "border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Candidatos GEE</span>
          </button>

          {/* Botão Conexão & Chaves */}
          <button
            onClick={() => abrirModal("settings")}
            title="Configurar credenciais da nuvem (GEE, Planet, Mapbox)"
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all ${
              tema === "dark"
                ? "border-slate-700/80 bg-slate-800/70 text-slate-300 hover:bg-slate-700 hover:text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Key className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden xl:inline">Conexão &amp; Dados</span>
          </button>

          {/* Botão Diagnóstico & Logs */}
          <button
            onClick={() => abrirModal("logs")}
            title="Ver logs do sistema e conformidade científica"
            className={`hidden lg:flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all ${
              tema === "dark"
                ? "border-slate-700/80 bg-slate-800/70 text-slate-300 hover:bg-slate-700 hover:text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-cyan-500" />
            <span>Diagnóstico</span>
          </button>

          {/* Botão Projetos & Exportação */}
          <button
            onClick={() => abrirModal("export")}
            title="Central de exportação científica (XLSX, CSV, GeoJSON)"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-600 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </header>

      {/* 2. SUBHEADER DE NAVEGAÇÃO ENTRE OS 6 MÓDULOS CIENTÍFICOS DO SAREL */}
      <nav
        className={`shrink-0 h-10 border-b px-4 flex items-center justify-between z-20 transition-colors duration-200 ${
          tema === "dark"
            ? "border-slate-800/80 bg-[#0b1424]"
            : "border-slate-200 bg-slate-100 text-slate-800"
        }`}
      >
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar">
          {abas.map((aba) => {
            const Icone = aba.icone;
            const ativa = abaAtiva === aba.id;
            return (
              <button
                key={aba.id}
                onClick={() => definirAba(aba.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  ativa
                    ? "bg-emerald-600 text-white shadow-sm"
                    : tema === "dark"
                    ? "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <Icone className="h-3.5 w-3.5" />
                <span>{aba.label}</span>
              </button>
            );
          })}
        </div>

        {/* Indicador de Conformidade Científica */}
        <div
          className={`hidden md:flex items-center gap-1.5 text-[11px] ${
            tema === "dark" ? "text-slate-400" : "text-slate-600"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Auditado &amp; Verificado · Regra 4 Inviolável</span>
        </div>
      </nav>

      {/* 3. ÁREA PRINCIPAL DE CONTEÚDO */}
      <div className="flex-1 w-full overflow-hidden relative">
        {/* MÓDULO 1: MAPA AMOSTRAL (Full Screen Split View com Sidebar e MapViewer) */}
        {abaAtiva === "mapa" && <MapaAmostral />}

        {/* DEMAIS MÓDULOS CIENTÍFICOS */}
        {abaAtiva === "inspetor" && (
          <div
            className={`h-full overflow-y-auto p-4 sm:p-6 custom-scrollbar transition-colors ${
              tema === "dark" ? "bg-[#090f1a] text-slate-100" : "bg-slate-100 text-slate-900"
            }`}
          >
            <div className="max-w-7xl mx-auto">
              <InspetorPonto />
            </div>
          </div>
        )}

        {abaAtiva === "matriz" && (
          <div
            className={`h-full overflow-y-auto p-4 sm:p-6 custom-scrollbar transition-colors ${
              tema === "dark" ? "bg-[#090f1a] text-slate-100" : "bg-slate-100 text-slate-900"
            }`}
          >
            <div className="max-w-7xl mx-auto">
              <PainelMatrizTreino />
            </div>
          </div>
        )}

        {abaAtiva === "campanha" && (
          <div
            className={`h-full overflow-y-auto p-4 sm:p-6 custom-scrollbar transition-colors ${
              tema === "dark" ? "bg-[#090f1a] text-slate-100" : "bg-slate-100 text-slate-900"
            }`}
          >
            <div className="max-w-7xl mx-auto">
              <PainelCampanha />
            </div>
          </div>
        )}

        {abaAtiva === "comparador" && (
          <div
            className={`h-full overflow-y-auto p-4 sm:p-6 custom-scrollbar transition-colors ${
              tema === "dark" ? "bg-[#090f1a] text-slate-100" : "bg-slate-100 text-slate-900"
            }`}
          >
            <div className="max-w-7xl mx-auto">
              <ComparadorEvento />
            </div>
          </div>
        )}

        {abaAtiva === "relatorios" && (
          <div
            className={`h-full overflow-y-auto p-4 sm:p-6 custom-scrollbar transition-colors ${
              tema === "dark" ? "bg-[#090f1a] text-slate-100" : "bg-slate-100 text-slate-900"
            }`}
          >
            <div className="max-w-7xl mx-auto space-y-4">
              <div
                className={`flex gap-2 border-b pb-2 ${
                  tema === "dark" ? "border-slate-800" : "border-slate-300"
                }`}
              >
                <button
                  onClick={() => setSubAbaRelatorio("qualidade")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    subAbaRelatorio === "qualidade"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : tema === "dark"
                      ? "text-slate-400 hover:bg-slate-800"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Laudo de Qualidade Amostral
                </button>
                <button
                  onClick={() => setSubAbaRelatorio("reprodutibilidade")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    subAbaRelatorio === "reprodutibilidade"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : tema === "dark"
                      ? "text-slate-400 hover:bg-slate-800"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Dossiê de Reprodutibilidade
                </button>
              </div>
              {subAbaRelatorio === "qualidade" ? <RelatorioQualidade /> : <RelatorioReprodutibilidade />}
            </div>
          </div>
        )}
      </div>

      {/* 4. MODAIS DO SISTEMA */}
      {modalAtivo === "region" && <RegionRequestModal />}
      {modalAtivo === "candidate" && <CandidateSelectionModal />}
      {modalAtivo === "settings" && <SettingsModal />}
      {modalAtivo === "export" && <ExportModal />}
      {modalAtivo === "saved" && <SavedDatasetsModal />}
      {modalAtivo === "logs" && <SystemLogsModal />}
    </main>
  );
}
