"use client";

import React, { useState } from "react";
import {
  X,
  Activity,
  AlertCircle,
  CheckCircle2,
  Info,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";

export const SystemLogsModal: React.FC = () => {
  const { modalAtiva, setModalAtiva, systemLogs, credenciais } = useSarelStore();
  const [filtroSeveridade, setFiltroSeveridade] = useState<string>("todas");

  if (modalAtiva !== "diagnostics") return null;

  const logsFiltrados = systemLogs.filter((l) =>
    filtroSeveridade === "todas" ? true : l.severity === filtroSeveridade
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Diagnóstico &amp; Auditoria de Integridade do Sistema
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Monitoramento em tempo real de conexões oficiais e guardas antissintéticos
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalAtiva(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo de Estado */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950 grid grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                credenciais.geeSessionActive ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Sessão GEE</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {credenciais.geeSessionActive ? "Ativa" : "Inativa"}
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Guarda Antissintético</span>
              <span className="font-bold text-slate-900 dark:text-white">Ativo (Regra 5)</span>
            </div>
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Base Fundiária</span>
              <span className="font-bold text-slate-900 dark:text-white">Local (SQLite)</span>
            </div>
          </div>
        </div>

        {/* Filtros de Severidade */}
        <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-400">
            Eventos Registrados ({logsFiltrados.length})
          </span>
          <div className="flex gap-1">
            {["todas", "info", "warning", "error"].map((sev) => (
              <button
                key={sev}
                onClick={() => setFiltroSeveridade(sev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  filtroSeveridade === sev
                    ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Logs */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-2 font-mono text-xs">
          {logsFiltrados.map((l) => (
            <div
              key={l.id}
              className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                l.severity === "error"
                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200"
                  : l.severity === "warning"
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200"
                  : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
              }`}
            >
              {l.severity === "error" ? (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              ) : l.severity === "warning" ? (
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-bold uppercase tracking-wider">{l.component}</span>
                  <span>{new Date(l.timestamp).toLocaleTimeString("pt-BR")}</span>
                </div>
                <p className="leading-snug">{l.message}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900/80">
          <button
            onClick={() => setModalAtiva(null)}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
