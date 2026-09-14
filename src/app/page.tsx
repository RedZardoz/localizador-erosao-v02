"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SettingsModal } from "@/components/config/SettingsModal";
import { RegionRequestModal } from "@/components/region/RegionRequestModal";
import { CandidateSelectionModal } from "@/components/region/CandidateSelectionModal";
import { AuditDossierModal } from "@/components/audit/AuditDossierModal";
import { PainelCampanhaModal } from "@/components/campanha/PainelCampanhaModal";
import { PainelMatrizModal } from "@/components/matriz/PainelMatrizModal";
import { DecisoesModal } from "@/components/decisoes/DecisoesModal";
import { ExportModal } from "@/components/export/ExportModal";
import { SystemLogsModal } from "@/components/diagnostics/SystemLogsModal";
import { useSarelStore } from "@/store/useSarelStore";

// Carregamento dinâmico do MapViewer com WebGL desabilitando SSR
const MapViewer = dynamic(
  () => import("@/components/map/MapViewer").then((mod) => mod.MapViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <span className="text-xs font-semibold">Inicializando Canvas WebGL 3D do SAREL...</span>
      </div>
    ),
  }
);

export default function HomePage() {
  const [montado, setMontado] = useState(false);
  const { tema } = useSarelStore();

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (tema === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }
    }
  }, [tema]);

  if (!montado) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 font-black text-white text-xl shadow-lg shadow-emerald-600/40 animate-pulse">
          S
        </div>
        <h1 className="text-sm font-bold tracking-tight">
          SAREL v2.0 — Sistema de Amostragem e Rotulagem para Erosão Laminar
        </h1>
        <div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mt-1" />
      </div>
    );
  }

  return (
    <main className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* 1. Header Superior com Identidade, AOI e Centrais */}
      <Header />

      {/* 2. Workspace Principal: Sidebar Lateral + Visualizador 3D */}
      <div className="flex-1 flex relative overflow-hidden">
        <Sidebar />
        <MapViewer />
      </div>

      {/* 3. Modais e Centrais de Trabalho */}
      <SettingsModal />
      <RegionRequestModal />
      <CandidateSelectionModal />
      <AuditDossierModal />
      <PainelCampanhaModal />
      <PainelMatrizModal />
      <DecisoesModal />
      <ExportModal />
      <SystemLogsModal />
    </main>
  );
}
