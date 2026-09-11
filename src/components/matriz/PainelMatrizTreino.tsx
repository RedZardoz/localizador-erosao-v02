"use client";

import React from "react";
import { useSarelStore } from "@/store/useSarelStore";
import { montarMatrizTreino } from "@/lib/matriz/montagem";

/**
 * Painel da Matriz de Treino — SAREL (§19 e §12.4)
 *
 * Apresenta:
 * - Estatísticas de completude por feature.
 * - Balanço de classes de erosão com prevalência explícita.
 * - Distribuição por bloco espacial (Spatial CV).
 * - Tabela de amostras projetada pelo perfil 'matriz-treino' (sem coordenadas, sem vazamento).
 */
export function PainelMatrizTreino() {
  const { pontos, rotulosConsolidados } = useSarelStore();

  const resultadoMatriz = React.useMemo(() => {
    try {
      return montarMatrizTreino(pontos, rotulosConsolidados, { modeloJanela: "D" });
    } catch {
      return null;
    }
  }, [pontos, rotulosConsolidados]);

  if (!resultadoMatriz || resultadoMatriz.totalAmostrasTreino === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h3 className="text-base font-semibold text-slate-700">Matriz de Treino Vazia</h3>
        <p className="mt-1 max-w-md text-xs text-slate-500">
          Para compor a matriz supervisionada, é necessário carregar pontos amostrais e registrar rótulos
          consolidados de observação humana (Fase A ou Fase B). Divergências pendentes são excluídas.
        </p>
      </div>
    );
  }

  const { linhas, distribuicaoClasses, distribuicaoBlocos, heldOutDrone, totalAmostrasTreino } = resultadoMatriz;

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-slate-500 font-medium">Amostras de Treino:</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalAmostrasTreino}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Projetadas pelo perfil matriz-treino</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-slate-500 font-medium">Validação Held-Out (Drone):</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{heldOutDrone.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Segregados do treino (Invariável)</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-slate-500 font-medium">Balanço de Classes:</span>
          <div className="mt-1 space-y-0.5">
            {Object.entries(distribuicaoClasses).map(([classe, qtd]) => (
              <div key={classe} className="flex justify-between">
                <span className="capitalize text-slate-600">{classe}:</span>
                <span className="font-bold text-slate-900">{qtd} ({((qtd / totalAmostrasTreino) * 100).toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-slate-500 font-medium">Blocos Espaciais (Spatial CV):</span>
          <p className="text-2xl font-bold text-purple-600 mt-1">{Object.keys(distribuicaoBlocos).length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Particionamento para evitar autocorrelação</p>
        </div>
      </div>

      {/* Visualização Tabular da Matriz */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Prévia da Matriz Tabular de Treino</h3>
            <p className="text-xs text-slate-500">
              Coordenadas isoladas no arquivo de chaves · Sem variáveis de score ou vazamento
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 font-semibold text-slate-900 border-b border-slate-200">
              <tr>
                <th className="p-2.5">Ponto_ID</th>
                <th className="p-2.5">Bloco</th>
                <th className="p-2.5">Declividade (%)</th>
                <th className="p-2.5">Elevação (m)</th>
                <th className="p-2.5">Solo (Ordem)</th>
                <th className="p-2.5">Freq. Solo Nu (Ê)</th>
                <th className="p-2.5">Precip 90d (mm)</th>
                <th className="p-2.5">Rótulo (Alvo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {linhas.slice(0, 10).map((l) => (
                <tr key={l.pontoId} className="hover:bg-slate-50/80">
                  <td className="p-2.5 font-sans font-bold text-slate-900">{l.pontoId.slice(0, 8)}...</td>
                  <td className="p-2.5 text-purple-700">{l.blocoEspacial}</td>
                  <td className="p-2.5">{l.declividadePct !== null ? `${l.declividadePct.toFixed(1)}%` : "null"}</td>
                  <td className="p-2.5">{l.elevacao !== null ? `${l.elevacao.toFixed(0)} m` : "null"}</td>
                  <td className="p-2.5 font-sans">{l.ordemSolo ?? "null"}</td>
                  <td className="p-2.5">{l.frequenciaSoloNu !== null ? l.frequenciaSoloNu.toFixed(3) : "null"}</td>
                  <td className="p-2.5">{l.precipAcum90d !== null ? `${l.precipAcum90d.toFixed(1)} mm` : "null"}</td>
                  <td className="p-2.5 font-sans font-bold uppercase text-emerald-800">{l.rotuloClasse}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {linhas.length > 10 && (
            <p className="mt-3 text-center text-[11px] text-slate-400">
              Exibindo as primeiras 10 amostras de {linhas.length} disponíveis na matriz.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
