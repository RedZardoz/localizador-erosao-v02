"use client";

import React from "react";
import { useSarelStore } from "@/store/useSarelStore";
import { MapaAmostral } from "@/components/mapa/MapaAmostral";
import { InspetorPonto } from "@/components/inspetor/InspetorPonto";
import { PainelMatrizTreino } from "@/components/matriz/PainelMatrizTreino";
import { PainelCampanha } from "@/components/campanha/PainelCampanha";
import { DECISOES, PARAMETROS, Decisao } from "@/config/decisoes";

export default function HomePage() {
  const { abaAtiva, setAbaAtiva } = useSarelStore();

  const totalDecisoes = Object.keys(DECISOES).length;
  const listaDecisoes = Object.values(DECISOES) as Decisao<unknown>[];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Barra de Navegação Superior */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 font-black text-white shadow-sm">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-slate-900">SAREL</h1>
                <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Sistema de Amostragem e Rotulagem para Erosão Laminar — PPGTCA 2026
              </p>
            </div>
          </div>

          {/* Abas do Sistema */}
          <nav className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setAbaAtiva("mapa")}
              className={`rounded-md px-3 py-1.5 transition-all ${
                abaAtiva === "mapa"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Mapa Amostral
            </button>
            <button
              onClick={() => setAbaAtiva("inspetor")}
              className={`rounded-md px-3 py-1.5 transition-all ${
                abaAtiva === "inspetor"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Inspetor de Ponto
            </button>
            <button
              onClick={() => setAbaAtiva("matriz")}
              className={`rounded-md px-3 py-1.5 transition-all ${
                abaAtiva === "matriz"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Matriz de Treino
            </button>
            <button
              onClick={() => setAbaAtiva("campanha")}
              className={`rounded-md px-3 py-1.5 transition-all ${
                abaAtiva === "campanha"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Campanha & Perfis
            </button>
            <button
              onClick={() => setAbaAtiva("decisoes")}
              className={`rounded-md px-3 py-1.5 transition-all ${
                abaAtiva === "decisoes"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Decisões ({totalDecisoes})
            </button>
          </nav>
        </div>
      </header>

      {/* Conteúdo Dinâmico */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        {abaAtiva === "mapa" && <MapaAmostral />}
        {abaAtiva === "inspetor" && <InspetorPonto />}
        {abaAtiva === "matriz" && <PainelMatrizTreino />}
        {abaAtiva === "campanha" && <PainelCampanha />}
        {abaAtiva === "decisoes" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                Registro Oficial de Decisões Metodológicas (Regra 9)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Todo parâmetro tem dono, referência e estado registrado. Decisões pendentes geram estado indisponível no sistema.
              </p>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {listaDecisoes.map((dec) => (
                  <div
                    key={dec.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{dec.id}</span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                          dec.estado === "decidida"
                            ? "bg-emerald-100 text-emerald-800"
                            : dec.estado === "proposta"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {dec.estado}
                      </span>
                    </div>
                    <p className="mt-1.5 font-medium text-slate-800">{dec.titulo}</p>
                    {dec.justificativa && (
                      <p className="mt-1 text-[11px] text-slate-500">{dec.justificativa}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
