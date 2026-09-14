"use client";

import React, { useState } from "react";
import { X, BookOpen, Search, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import { DECISOES, Decisao } from "@/config/decisoes";

export const DecisoesModal: React.FC = () => {
  const { modalAtiva, setModalAtiva } = useSarelStore();
  const [busca, setBusca] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  if (modalAtiva !== "decisoes") return null;

  const listaDecisoes = Object.values(DECISOES) as Decisao<unknown>[];

  const decisoesFiltradas = listaDecisoes.filter((d) => {
    if (filtroEstado !== "todos" && d.estado !== filtroEstado) return false;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      const matchId = d.id.toLowerCase().includes(q);
      const matchTit = d.titulo.toLowerCase().includes(q);
      const matchRef = d.referencia?.toLowerCase().includes(q) || false;
      const matchDono = d.decididoPor?.toLowerCase().includes(q) || false;
      if (!matchId && !matchTit && !matchRef && !matchDono) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Registro Oficial de Decisões Metodológicas (Regra 9 — D01 a D19)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Todo parâmetro tem dono, referência e estado registrado. Decisões pendentes geram estado indisponível no sistema.
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

        {/* Filtros da Barra Superior */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar decisão por ID, título, autor ou referência..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex gap-1 text-xs">
            {["todos", "decidida", "proposta", "pendente"].map((est) => (
              <button
                key={est}
                onClick={() => setFiltroEstado(est)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                  filtroEstado === est
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                }`}
              >
                {est}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Decisões */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {decisoesFiltradas.map((dec) => (
              <div
                key={dec.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                    {dec.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      dec.estado === "decidida"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : dec.estado === "proposta"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {dec.estado}
                  </span>
                </div>

                <p className="font-bold text-slate-800 dark:text-slate-200 leading-snug">
                  {dec.titulo}
                </p>

                {dec.justificativa && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                    &ldquo;{dec.justificativa}&rdquo;
                  </p>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Responsável: {dec.decididoPor || "PPGTCA"}</span>
                  <span className="truncate max-w-[200px] text-right">
                    Ref: {dec.referencia || "Dissertação"}
                  </span>
                </div>
              </div>
            ))}
          </div>
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
