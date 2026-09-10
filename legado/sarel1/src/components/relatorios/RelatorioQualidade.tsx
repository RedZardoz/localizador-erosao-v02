"use client";

import React, { useMemo } from "react";
import { useSarelStore } from "@/store/useSarelStore";
import { validarInvariantes } from "@/lib/matriz/invariantes";
import { CheckCircle2, AlertTriangle, ShieldCheck, FileText } from "lucide-react";

export function RelatorioQualidade() {
  const { pontos, rotulosConsolidados } = useSarelStore();

  const validacao = useMemo(() => validarInvariantes(pontos), [pontos]);

  // Contagem geral de proveniência em todo o dataset
  const contagemProveniencia = useMemo(() => {
    let medido = 0;
    let modelado = 0;
    let tabelado = 0;
    let indisponivel = 0;

    function contar(prov?: any) {
      if (!prov) {
        indisponivel++;
        return;
      }
      switch (prov.estado) {
        case "medido": medido++; break;
        case "modelado": modelado++; break;
        case "tabelado": tabelado++; break;
        case "indisponivel": indisponivel++; break;
      }
    }

    pontos.forEach((p) => {
      contar(p.terreno.elevacao);
      contar(p.terreno.declividadePct);
      contar(p.terreno.declividadeGraus);
      contar(p.terreno.curvaturaPerfil);
      contar(p.terreno.curvaturaPlana);
      contar(p.terreno.acumuloFluxo);
      contar(p.terreno.twi);

      contar(p.solo.ordem);
      contar(p.solo.subOrdem);
      contar(p.solo.grandeGrupo);
      contar(p.solo.erodibilidadeClasse);

      contar(p.serie.frequenciaSoloNu);
      contar(p.chuva.precipAcum30d);
      contar(p.chuva.precipAcum90d);
      contar(p.chuva.i30Max);
      contar(p.chuva.nEventosErosivos);
      contar(p.chuva.indiceMecanismo);
    });

    const total = medido + modelado + tabelado + indisponivel;
    return {
      medido,
      modelado,
      tabelado,
      indisponivel,
      total,
      pctMedido: total > 0 ? Number(((medido / total) * 100).toFixed(1)) : 0,
      pctModelado: total > 0 ? Number(((modelado / total) * 100).toFixed(1)) : 0,
      pctTabelado: total > 0 ? Number(((tabelado / total) * 100).toFixed(1)) : 0,
      pctIndisponivel: total > 0 ? Number(((indisponivel / total) * 100).toFixed(1)) : 0,
    };
  }, [pontos]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-800">
              Relatório de Qualidade do Dado e Rastreabilidade Científica (§12.6)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">SAREL v1.0 · PPGTCA 2026</span>
        </div>

        {/* Resumo de Proveniência Global */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
              <span>● MEDIDO (Sensores / Campo)</span>
              <span>{contagemProveniencia.pctMedido}%</span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-emerald-900">{contagemProveniencia.medido}</p>
            <p className="mt-1 text-[11px] text-emerald-700">Copernicus DEM, Sentinel-2, CHIRPS, GPM</p>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex items-center justify-between text-xs font-bold text-blue-800">
              <span>◊ MODELADO (Regressão / Físico)</span>
              <span>{contagemProveniencia.pctModelado}%</span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-blue-900">{contagemProveniencia.modelado}</p>
            <p className="mt-1 text-[11px] text-blue-700">Harmônicos OLS, Índice de Mecanismo</p>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-center justify-between text-xs font-bold text-amber-800">
              <span>□ TABELADO (Cartas Oficiais)</span>
              <span>{contagemProveniencia.pctTabelado}%</span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-amber-900">{contagemProveniencia.tabelado}</p>
            <p className="mt-1 text-[11px] text-amber-700">Embrapa Solos PR, Erodibilidade K</p>
          </div>

          <div className="rounded-lg bg-slate-100 border border-slate-200 p-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>○ INDISPONÍVEL (Ausência Declarada)</span>
              <span>{contagemProveniencia.pctIndisponivel}%</span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-800">{contagemProveniencia.indisponivel}</p>
            <p className="mt-1 text-[11px] text-slate-500">Lacunas preservadas sem preenchimento falso</p>
          </div>
        </div>
      </div>

      {/* Auditoria dos 7 Invariantes de Exportação */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Status dos 7 Invariantes de Exportação</h3>
          </div>
          <span
            className={`rounded px-2.5 py-0.5 text-xs font-bold ${
              validacao.valido
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-rose-100 text-rose-800 border border-rose-300"
            }`}
          >
            {validacao.valido ? "TODOS OS INVARIANTES APROVADOS" : "VIOLAÇÃO DETECTADA"}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {[
            { id: 1, nome: "Coerência RUSLE", desc: "perdaSolo preenchida <=> 5 fatores preenchidos <=> memória de cálculo da equação" },
            { id: 2, nome: "Escala / Faixa Interna", desc: "Φ ∈ [0, 1] e preservado apenas como critério interno de amostragem" },
            { id: 3, nome: "Conformidade de Estimados", desc: "Campos_Estimados deriva com precisão matemática da proveniência" },
            { id: 4, nome: "Coerência de Origem", desc: "Origem satélite requer identificação auditável de produto/cena Sentinel-2" },
            { id: 5, nome: "Afirmação Negativa Fundiária", desc: "'Sem correspondência' só é emitido após consulta realizada sem match espacial" },
            { id: 6, nome: "Lista Negra de Literais Geográficos", desc: "Proibição de 'custom', 'área amostral gee' ou nomes inventados" },
            { id: 7, nome: "Detector de Constante Disfarçada", desc: "Nenhuma coluna numérica com valor idêntico em 100% das linhas para n > 20" },
          ].map((inv) => {
            const violado = validacao.violacoes.some((v) => v.invariante === inv.id);
            return (
              <div
                key={inv.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border ${
                  violado
                    ? "bg-rose-50/70 border-rose-200 text-rose-900"
                    : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {violado ? (
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">Invariante {inv.id}: {inv.nome}</span>
                    <p className="text-[11px] text-slate-500">{inv.desc}</p>
                  </div>
                </div>
                <span className={`font-mono text-xs font-bold ${violado ? "text-rose-700" : "text-emerald-700"}`}>
                  {violado ? "REPROVADO" : "APROVADO"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
