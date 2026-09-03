"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SettingsModal } from "@/components/config/SettingsModal";
import { RegionRequestModal } from "@/components/region/RegionRequestModal";
import { CandidateSelectionModal } from "@/components/region/CandidateSelectionModal";
import { DataManagerModal } from "@/components/data/DataManagerModal";
import { SystemLogsModal } from "@/components/diagnostics/SystemLogsModal";
import { SystemLogCapture } from "@/components/diagnostics/SystemLogCapture";
import { AuditDossierModal } from "@/components/audit/AuditDossierModal";
import { Mountain } from "lucide-react";

import { useErosionStore } from "@/lib/store/useErosionStore";

// Dynamic import of MapViewer to guarantee WebGL / window availability in browser
const MapViewer = dynamic(
  () => import("@/components/map/MapViewer").then((mod) => mod.MapViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <span className="text-sm font-medium">Inicializando WebGL Canvas 3D...</span>
      </div>
    ),
  }
);

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useErosionStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }
    }
  }, [theme]);

  if (!mounted) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-300 gap-3">
        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
          <Mountain className="w-10 h-10 animate-pulse" />
        </div>
        <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Localizador de Erosão &amp; Propriedade | Brasil
        </h1>
        <div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mt-2" />
      </div>
    );
  }

  return (
    <main className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Global Background Log Capture (silent) */}
      <SystemLogCapture />

      {/* Top Header */}
      <Header />

      {/* Main Workspace Layout: Sidebar + 3D Map */}
      <div className="flex-1 flex relative overflow-hidden">
        <Sidebar />
        <MapViewer />
      </div>

      {/* Modals & Dialogs */}
      <SettingsModal />
      <RegionRequestModal />
      <CandidateSelectionModal />
      <DataManagerModal />
      <SystemLogsModal />
      <AuditDossierModal />
    </main>
  );
}
