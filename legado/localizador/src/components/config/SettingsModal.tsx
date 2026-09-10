"use client";

import React, { useState } from "react";
import {
  X,
  Key,
  Database,
  Shield,
  Layers,
  Settings,
  HelpCircle,
  FileCode,
  ClipboardCheck,
} from "lucide-react";
import { useErosionStore } from "@/lib/store/useErosionStore";
import { GcpCredentialsManager } from "./GcpCredentialsManager";
import { ApiTokensManager } from "./ApiTokensManager";
import { DataIngestionDropzone } from "./DataIngestionDropzone";
import { KoboFieldImport } from "./KoboFieldImport";

export const SettingsModal: React.FC = () => {
  const { activeModal, setActiveModal } = useErosionStore();
  const [tab, setTab] = useState<"credentials" | "ingestion" | "tokens" | "kobo">("credentials");

  if (activeModal !== "settings") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in transition-colors">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Configurações & Gestão de Dados</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Credenciais da nuvem (GEE), tokens de mapas e ingestão de vetores
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 px-4 pt-2 gap-2">
          <button
            onClick={() => setTab("credentials")}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              tab === "credentials"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Key className="w-4 h-4" />
            GEE Service Account
          </button>

          <button
            onClick={() => setTab("ingestion")}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              tab === "ingestion"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Database className="w-4 h-4" />
            Ingestão de Dados Vetoriais
          </button>

          <button
            onClick={() => setTab("tokens")}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              tab === "tokens"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FileCode className="w-4 h-4" />
            Tokens de Mapas
          </button>

          <button
            onClick={() => setTab("kobo")}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              tab === "kobo"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Validação de Campo
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          {tab === "credentials" && <GcpCredentialsManager />}
          {tab === "ingestion" && <DataIngestionDropzone />}
          {tab === "tokens" && <ApiTokensManager />}
          {tab === "kobo" && <KoboFieldImport />}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            Suas credenciais são processadas de forma segura e não compartilhadas.
          </span>
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
