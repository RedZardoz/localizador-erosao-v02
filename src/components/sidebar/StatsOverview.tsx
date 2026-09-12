"use client";

import React from "react";
import { TrendingUp, Mountain, Percent, Layers, ShieldCheck } from "lucide-react";
import { usePontosVisiveis, useSarelStore } from "@/store/useSarelStore";
import { valorOuNulo } from "@/types/proveniencia";

export const StatsOverview: React.FC = () => {
  const pontosVisiveis = usePontosVisiveis();
  const { pontosProvisorios } = useSarelStore();

  if (pontosVisiveis.length === 0) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
        <ShieldCheck className="w-6 h-6 text-slate-400 mx-auto" />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Nenhuma amostra na tela
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Gere uma amostra em <strong>Amostragem GEE</strong> (com APIs ativas) ou carregue um dataset verificado.
        </p>
      </div>
    );
  }

  // Estatísticas calculadas exclusivamente de dados reais
  let somaDeclividade = 0;
  let pontosComDecliv = 0;
  let somaElevacao = 0;
  let pontosComElev = 0;
  let somaFrequenciaSolo = 0;
  let pontosComSoloNu = 0;
  let pontosComRusle = 0;
  let somaRusle = 0;

  for (const p of pontosVisiveis) {
    const decliv = valorOuNulo(p.terreno?.declividadePct);
    if (decliv !== null) {
      somaDeclividade += decliv;
      pontosComDecliv++;
    }

    const elev = valorOuNulo(p.terreno?.elevacao);
    if (elev !== null) {
      somaElevacao += elev;
      pontosComElev++;
    }

    const freq = valorOuNulo(p.temporal.D?.serie?.frequenciaSoloNu);
    if (typeof freq === "number" && !isNaN(freq)) {
      somaFrequenciaSolo += freq;
      pontosComSoloNu++;
    }

    const perda = valorOuNulo(p.linhaDeBase?.perdaSolo);
    if (typeof perda === "number" && !isNaN(perda)) {
      somaRusle += perda;
      pontosComRusle++;
    }
  }

  const mediaDeclividade =
    pontosComDecliv > 0 ? (somaDeclividade / pontosComDecliv).toFixed(1) : "—";
  const mediaElevacao =
    pontosComElev > 0 ? Math.round(somaElevacao / pontosComElev) : "—";
  const mediaSoloNu =
    pontosComSoloNu > 0
      ? (somaFrequenciaSolo / pontosComSoloNu).toFixed(2)
      : "—";
  const mediaRusle =
    pontosComRusle > 0
      ? `${(somaRusle / pontosComRusle).toFixed(1)} t/ha·ano`
      : "Pendente (D07)";

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Métricas Reais ({pontosVisiveis.length} Focos)
        </span>
        {pontosProvisorios.length > 0 && (
          <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            Memória Provisória
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Declividade Média DEM */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
            <TrendingUp className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Declividade Méd.</span>
          </div>
          <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
            {mediaDeclividade}%
          </div>
        </div>

        {/* Altitude Média DEM */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
            <Mountain className="w-3 h-3 text-emerald-500 shrink-0" />
            <span>Altitude Média</span>
          </div>
          <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
            {mediaElevacao} m
          </div>
        </div>

        {/* Frequência de Solo Nu */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
            <Percent className="w-3 h-3 text-rose-500 shrink-0" />
            <span>Solo Nu Médio</span>
          </div>
          <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
            {mediaSoloNu}
          </div>
        </div>

        {/* RUSLE Linha de Base */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
            <Layers className="w-3 h-3 text-cyan-500 shrink-0" />
            <span>RUSLE (Durigon C)</span>
          </div>
          <div className="text-xs font-bold font-mono text-slate-900 dark:text-white mt-1 truncate">
            {mediaRusle}
          </div>
        </div>
      </div>
    </div>
  );
};
