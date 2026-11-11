"use client";

import React, { useRef } from "react";
import { X, Sparkles } from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import { PainelMedicaoDimensoes } from "./PainelMedicaoDimensoes";
import { useModalA11y } from "@/hooks/useModalA11y";

export const PainelMedicaoModal: React.FC = () => {
  const { modalAtiva, setModalAtiva } = useSarelStore();
  const modalRef = useRef<HTMLDivElement>(null);

  useModalA11y({
    aberto: modalAtiva === "medicao",
    fechar: () => setModalAtiva(null),
    containerRef: modalRef,
  });

  if (modalAtiva !== "medicao") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-medicao"
        className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 id="titulo-modal-medicao" className="text-sm font-bold text-slate-900 dark:text-white">
                Superfície de Medição das Dimensões Biofísicas (Ŝ × Ê × K̂)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Parâmetros e tercis medidos por sensoriamento remoto e pedologia oficial
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalAtiva(null)}
            aria-label="Fechar painel de medição de dimensões"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Painel */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
          <PainelMedicaoDimensoes />
        </div>
      </div>
    </div>
  );
};
