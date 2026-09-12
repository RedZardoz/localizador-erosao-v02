"use client";

import React from "react";
import { Search, RotateCcw, Filter } from "lucide-react";
import { useSarelStore } from "@/store/useSarelStore";
import { PARANA_BASINS_GEOJSON } from "@/lib/localizacao/bacias";

const ORDENS_SOLO_EMBRAPA = [
  "LATOSSOLO",
  "ARGISSOLO",
  "NITOSSOLO",
  "NEOSSOLO",
  "CAMBISSOLO",
  "GLEISSOLO",
  "ORGANOSSOLO",
];

export const FiltersPanel: React.FC = () => {
  const { filtros, setFiltros, limparFiltros } = useSarelStore();

  const bacias = PARANA_BASINS_GEOJSON.features.map((f) => f.properties.name);

  return (
    <div className="space-y-3.5 p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Filtros Detalhados
        </span>
        <button
          onClick={limparFiltros}
          className="text-[11px] text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 font-medium cursor-pointer"
          title="Limpar todos os filtros"
        >
          <RotateCcw className="w-3 h-3" />
          Limpar
        </button>
      </div>

      {/* Busca textual */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={filtros.buscaTexto}
          onChange={(e) => setFiltros({ buscaTexto: e.target.value })}
          placeholder="Buscar código, município ou CAR..."
          className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
        />
      </div>

      {/* Bacia Hidrográfica */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          Macrobacia Hidrográfica
        </label>
        <select
          value={filtros.bacia || ""}
          onChange={(e) => setFiltros({ bacia: e.target.value || null })}
          className="w-full py-1.5 px-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
        >
          <option value="">Todas as macrobacias</option>
          {bacias.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Tipo de Solo Embrapa */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          Ordem de Solo (Embrapa SiBCS)
        </label>
        <select
          value={filtros.solo || ""}
          onChange={(e) => setFiltros({ solo: e.target.value || null })}
          className="w-full py-1.5 px-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
        >
          <option value="">Todos os solos</option>
          {ORDENS_SOLO_EMBRAPA.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Situação Fundiária */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          Situação Fundiária (SICAR / SNCR)
        </label>
        <select
          value={filtros.situacaoFundiaria}
          onChange={(e) =>
            setFiltros({
              situacaoFundiaria: e.target.value as "todas" | "com-car" | "sem-car",
            })
          }
          className="w-full py-1.5 px-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
        >
          <option value="todas">Todas as situações</option>
          <option value="com-car">Com Imóvel CAR Identificado</option>
          <option value="sem-car">Sem CAR (Área Não Cadastrada)</option>
        </select>
      </div>

      {/* Status de Rotulagem */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          Status de Rotulagem
        </label>
        <select
          value={filtros.rotulado}
          onChange={(e) =>
            setFiltros({
              rotulado: e.target.value as "todos" | "rotulado" | "nao-rotulado",
            })
          }
          className="w-full py-1.5 px-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
        >
          <option value="todos">Todos os pontos</option>
          <option value="rotulado">Rotulados (Campo / Fotointerpretação)</option>
          <option value="nao-rotulado">Ainda Não Rotulados</option>
        </select>
      </div>

      {/* Declividade Mínima */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
          <span>Declividade Mínima DEM</span>
          <span className="font-mono">
            {filtros.declividadeMin !== null ? `${filtros.declividadeMin}%` : "Livre"}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="30"
          step="1"
          value={filtros.declividadeMin ?? 0}
          onChange={(e) => {
            const val = Number(e.target.value);
            setFiltros({ declividadeMin: val > 0 ? val : null });
          }}
          className="w-full accent-emerald-600 cursor-pointer"
        />
      </div>
    </div>
  );
};
