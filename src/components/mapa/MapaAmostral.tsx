"use client";

import React from "react";
import { useSarelStore } from "@/store/useSarelStore";

/**
 * Mapa Amostral — SAREL (§19 e Regra 4)
 *
 * REGRAS METODOLÓGICAS:
 * 1. Pontos coloridos EXCLUSIVAMENTE por ESTRATO (ou completude), NUNCA por severidade.
 * 2. Sem mapa de calor de "risco" nem Top-N fabricado.
 * 3. Permite selecionar ponto para inspeção e filtrar por estrato e bloco espacial.
 */
export function MapaAmostral() {
  const { pontos, pontoSelecionadoId, selecionarPonto, filtroEstrato, setFiltroEstrato, filtroBloco, setFiltroBloco } =
    useSarelStore();

  const pontosFiltrados = pontos.filter((p) => {
    if (filtroEstrato && p.estratoId !== filtroEstrato) return false;
    if (filtroBloco && p.blocoEspacial !== filtroBloco) return false;
    return true;
  });

  const estratosDisponiveis = Array.from(new Set(pontos.map((p) => p.estratoId))).sort();
  const blocosDisponiveis = Array.from(new Set(pontos.map((p) => p.blocoEspacial).filter(Boolean))).sort();

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <label className="font-semibold text-slate-700">Filtrar por Estrato:</label>
            <select
              value={filtroEstrato ?? ""}
              onChange={(e) => setFiltroEstrato(e.target.value || null)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 font-medium text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Todos os estratos ({pontos.length})</option>
              {estratosDisponiveis.map((est) => (
                <option key={est} value={est}>
                  {est}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="font-semibold text-slate-700">Filtrar por Bloco:</label>
            <select
              value={filtroBloco ?? ""}
              onChange={(e) => setFiltroBloco(e.target.value || null)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 font-medium text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Todos os blocos</option>
              {blocosDisponiveis.map((blk) => (
                <option key={blk} value={blk!}>
                  {blk}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-slate-500 font-medium">
          Exibindo <span className="font-bold text-slate-900">{pontosFiltrados.length}</span> de{" "}
          <span className="font-bold text-slate-900">{pontos.length}</span> pontos amostrais
        </div>
      </div>

      {/* Grade / Visualizador Amostral */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Painel de Visualização Espacial Simulada / MapLibre Container */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">Distribuição Espacial dos Pontos</h3>
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-200">
              Coloração por Estrato (Sem Severidade)
            </span>
          </div>

          {/* Área de Plotagem Cartográfica */}
          <div className="relative flex h-[420px] w-full items-center justify-center rounded-lg border border-slate-100 bg-slate-950/5 p-4 overflow-hidden">
            {pontosFiltrados.length === 0 ? (
              <div className="text-center text-xs text-slate-400">
                Nenhum ponto amostral carregado nesta sessão.
              </div>
            ) : (
              <div className="relative h-full w-full">
                {/* Marcadores posicionados */}
                {pontosFiltrados.map((p) => {
                  const isSelected = p.id === pontoSelecionadoId;
                  // Cálculo de posição relativa aproximada no Paraná (-26.5 a -23.5 lat, -54.5 a -49.5 lng)
                  const topPct = ((p.latitude - (-23.5)) / (-26.5 - (-23.5))) * 80 + 10;
                  const leftPct = ((p.longitude - (-54.5)) / (-49.5 - (-54.5))) * 80 + 10;

                  return (
                    <button
                      key={p.id}
                      onClick={() => selecionarPonto(p.id)}
                      style={{
                        top: `${Math.min(90, Math.max(10, topPct))}%`,
                        left: `${Math.min(90, Math.max(10, leftPct))}%`,
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all focus:outline-none ${
                        isSelected
                          ? "h-6 w-6 bg-emerald-600 ring-4 ring-emerald-300 z-20 shadow-md"
                          : "h-3.5 w-3.5 bg-indigo-600 hover:scale-150 z-10 opacity-85"
                      }`}
                      title={`${p.codigo} (${p.estratoId}) — ${p.blocoEspacial ?? "Sem bloco"}`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Listagem Lateral de Pontos */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
            Pontos Candidatos
          </h3>
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1 text-xs">
            {pontosFiltrados.length === 0 ? (
              <p className="text-slate-400 italic">Nenhum ponto para exibir.</p>
            ) : (
              pontosFiltrados.map((p) => {
                const isSelected = p.id === pontoSelecionadoId;
                return (
                  <div
                    key={p.id}
                    onClick={() => selecionarPonto(p.id)}
                    className={`cursor-pointer rounded-lg border p-2.5 transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{p.codigo}</span>
                      <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-800">
                        {p.estratoId}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                      <span>{p.blocoEspacial ?? "Bloco pendente"}</span>
                      <span>{p.latitude.toFixed(4)}°, {p.longitude.toFixed(4)}°</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
