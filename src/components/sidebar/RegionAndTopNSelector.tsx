"use client";

import React from "react";
import { Globe, Layers, Sliders } from "lucide-react";
import { useSarelStore, usePontosVisiveis } from "@/store/useSarelStore";

export const RegionAndTopNSelector: React.FC = () => {
  const { areas, setModalAtiva, topN, setTopN, pontos, pontosProvisorios } =
    useSarelStore();
  const pontosVisiveis = usePontosVisiveis();

  const totalPontos = pontos.length + pontosProvisorios.length;
  const areasAtivas = areas.filter((a) => a.ativa);

  return (
    <div className="space-y-3">
      {/* Bloco de Região & AOI Ativa */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Áreas de Amostragem (AOI)
          </span>
          <button
            onClick={() => setModalAtiva("region")}
            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
          >
            Gerenciar Áreas
          </button>
        </div>

        {/* Resumo das Áreas Ativas */}
        <div className="space-y-1">
          {areasAtivas.length === 0 ? (
            <p className="text-xs text-amber-600 dark:text-amber-400 italic">
              Nenhuma área ativada. Ative ao menos uma área em &ldquo;Gerenciar Áreas&rdquo;.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {areasAtivas.map((area) => (
                <span
                  key={area.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: area.cor || "#10B981" }}
                  />
                  {area.nome}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Seletor de Quantidade Top-N */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Quantidade a Exibir
          </span>
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
            {topN === "todas" ? `Todas (${totalPontos})` : `Top ${topN}`}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1 pt-1">
          {[10, 25, 50, 100].map((num) => (
            <button
              key={num}
              onClick={() => setTopN(num)}
              className={`py-1 rounded-lg text-xs font-semibold transition-all ${
                topN === num
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setTopN("todas")}
            className={`py-1 rounded-lg text-xs font-semibold transition-all ${
              topN === "todas"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            Todas
          </button>
        </div>
      </div>
    </div>
  );
};
