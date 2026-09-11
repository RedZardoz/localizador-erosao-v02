"use client";

import React from "react";
import { useSarelStore } from "@/store/useSarelStore";
import { PERFIS_EXPORTACAO, PerfilExportacao } from "@/lib/matriz/perfis";

/**
 * Painel de Campanha e Exportação Cega — SAREL (§19 e §9)
 *
 * Oferece botões dedicados de exportação por perfil com lista de permissão estrita:
 * - 'planilha': Pesquisador / Dissertação
 * - 'interpretacao-cega': Fase A (sem rótulo de outros, sem score, sem features)
 * - 'campo-cego': Fase B (sem rótulos de satélite, sem features)
 * - 'voo-cego': Fase D (drone)
 * - 'matriz-treino': Supervisionado (sem coordenadas)
 */
export function PainelCampanha() {
  const { pontos } = useSarelStore();

  const perfis: PerfilExportacao[] = [
    "planilha",
    "interpretacao-cega",
    "campo-cego",
    "voo-cego",
    "matriz-treino",
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
          Gestão de Campanha e Exportação por Perfil Cego
        </h3>
        <p className="text-xs text-slate-500">
          Garante que equipes de campo e fotointérpretes recebam planilhas cegas sem vazamento de
          features, escores ou rótulos de outras modalidades (Invariante 2).
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {perfis.map((perfil) => {
            const config = PERFIS_EXPORTACAO[perfil];
            return (
              <div
                key={perfil}
                className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-4 shadow-sm"
              >
                <div>
                  <span className="rounded bg-indigo-100 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-800 uppercase">
                    {perfil}
                  </span>
                  <h4 className="mt-2 text-xs font-bold text-slate-900">{config.descricao}</h4>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Permite {config.colunasPermitidas.length} colunas pré-aprovadas.
                  </p>
                </div>

                <button
                  disabled={pontos.length === 0}
                  className="mt-4 w-full rounded-md bg-white border border-slate-300 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Exportar CSV / XLSX ({perfil})
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
