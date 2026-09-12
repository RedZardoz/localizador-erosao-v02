"use client";

import React from "react";
import {
  MapPin,
  Mountain,
  TrendingUp,
  FileCheck,
  Building,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useSarelStore, usePontosVisiveis } from "@/store/useSarelStore";
import type { PontoAmostral } from "@/types/ponto";
import { valorOuNulo } from "@/types/proveniencia";

export const PointCardList: React.FC = () => {
  const pontosVisiveis = usePontosVisiveis();
  const { pontoSelecionadoId, selecionarPonto, setMapState } = useSarelStore();

  if (pontosVisiveis.length === 0) {
    return null;
  }

  const handleCardClick = (ponto: PontoAmostral) => {
    selecionarPonto(ponto.id);
    setMapState((prev) => ({
      ...prev,
      flyToTarget: {
        lat: ponto.latitude,
        lng: ponto.longitude,
        zoom: 16,
        pitch: 55,
      },
    }));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Lista de Amostras ({pontosVisiveis.length})
        </span>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto pr-1 custom-scrollbar">
        {pontosVisiveis.map((p) => {
          const isSelected = p.id === pontoSelecionadoId;
          const temCar = !!p.fundiario?.codigoCar;
          const rotulado = !!p.rotulo;

          return (
            <div
              key={p.id}
              onClick={() => handleCardClick(p)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/50"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                    {p.codigo}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    {p.estratoId}
                  </span>
                </div>

                {/* Badge de Rotulagem */}
                {p.rotulo?.final ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    {p.rotulo.final.classe}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    <Clock className="w-3 h-3" />
                    Amostra
                  </span>
                )}
              </div>

              {/* Localização */}
              <div className="mt-1 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">
                  {valorOuNulo(p.localizacao?.municipio) || "—"} — {valorOuNulo(p.localizacao?.bacia) || "—"}
                </span>
              </div>

              {/* Métricas do Ponto */}
              <div className="mt-2 grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono">
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <TrendingUp className="w-3 h-3 text-amber-500" />
                  <span>
                    {valorOuNulo(p.terreno?.declividadePct) !== null
                      ? `${valorOuNulo(p.terreno?.declividadePct)?.toFixed(1)}%`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <Mountain className="w-3 h-3 text-emerald-500" />
                  <span>
                    {valorOuNulo(p.terreno?.elevacao) !== null
                      ? `${Math.round(valorOuNulo(p.terreno?.elevacao)!)}m`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 truncate">
                  <Building className="w-3 h-3 text-cyan-500" />
                  <span className="truncate">{temCar ? "CAR ✓" : "S/ CAR"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
