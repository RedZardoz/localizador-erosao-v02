"use client";

import React from "react";
import { X, ClipboardList } from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import { PainelCampanha } from "./PainelCampanha";

export const PainelCampanhaModal: React.FC = () => {
  const { modalAtiva, setModalAtiva } = useSarelStore();

  if (modalAtiva !== "campanha") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Central de Campanha, Ingestão de Rótulos &amp; Concordância Kappa
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Planilhas KoboToolbox, voos de Drone, fotointerpretação e validação inter-avaliadores
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

        {/* Conteúdo */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
          <PainelCampanha />
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
