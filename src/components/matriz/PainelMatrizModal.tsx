"use client";

import React, { useRef } from "react";
import { X, Table } from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import { PainelMatrizTreino } from "./PainelMatrizTreino";
import { useModalA11y } from "@/hooks/useModalA11y";

export const PainelMatrizModal: React.FC = () => {
  const { modalAtiva, setModalAtiva } = useSarelStore();
  const modalRef = useRef<HTMLDivElement>(null);

  useModalA11y({
    aberto: modalAtiva === "matriz",
    fechar: () => setModalAtiva(null),
    containerRef: modalRef,
  });

  if (modalAtiva !== "matriz") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-matriz"
        className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 id="titulo-modal-matriz" className="text-sm font-bold text-slate-900 dark:text-white">
                Central da Matriz de Treino (Supervisionado) &amp; Invariantes
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Montagem de features multi-sensores, verificação dos 7 invariantes matemáticos e perfis
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalAtiva(null)}
            aria-label="Fechar painel da matriz de treino"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
          <PainelMatrizTreino />
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
