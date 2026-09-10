"use client";

import React, { useState } from "react";
import { useSarelStore } from "@/store/useSarelStore";
import { gerarPlanilhaCSV, gerarPlanilhaXLSX } from "@/lib/export/planilha";
import { pontosParaGeoJSON } from "@/lib/export/geoConversao";
import { assegurarApenasPontosReais } from "@/lib/seguranca/guardaSintetico";
import { Download, FileSpreadsheet, FileText, Globe, EyeOff, X, Check, ShieldCheck } from "lucide-react";

export function ExportModal() {
  const { pontos, rotulosConsolidados, aoiAtiva, fecharModal } = useSarelStore();
  const [baixando, setBaixando] = useState<string | null>(null);

  async function exportarXlsx() {
    try {
      setBaixando("xlsx");
      const buffer = await gerarPlanilhaXLSX(pontos, {
        modoCego: false,
        responsavelEmissao: "Pesquisa PPGTCA 2026 — SAREL 1",
      });

      const blob = new Blob([new Uint8Array(buffer)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tabela_Consolidada_SAREL_${aoiAtiva.nome.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => setBaixando(null), 800);
    } catch (err) {
      alert("Erro ao gerar XLSX: " + (err instanceof Error ? err.message : String(err)));
      setBaixando(null);
    }
  }

  function exportarCsv(modoCego: boolean = false) {
    try {
      setBaixando(modoCego ? "csv-cego" : "csv");
      const csvStr = gerarPlanilhaCSV(pontos, {
        modoCego,
        responsavelEmissao: "Pesquisa PPGTCA 2026 — SAREL 1",
      });

      const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = modoCego
        ? `Plano_Campo_Cego_${Date.now()}.csv`
        : `Planilha_Cientifica_SAREL_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => setBaixando(null), 800);
    } catch (err) {
      alert("Erro ao gerar CSV: " + (err instanceof Error ? err.message : String(err)));
      setBaixando(null);
    }
  }

  function exportarGeoJson() {
    try {
      setBaixando("geojson");
      assegurarApenasPontosReais(pontos, "exportação GeoJSON");
      const geojson = pontosParaGeoJSON(pontos);
      const str = JSON.stringify(geojson, null, 2);
      const blob = new Blob([str], { type: "application/geo+json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Pontos_Amostrais_SAREL_${Date.now()}.geojson`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => setBaixando(null), 800);
    } catch (err) {
      alert("Erro ao gerar GeoJSON: " + (err instanceof Error ? err.message : String(err)));
      setBaixando(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex w-full max-w-xl flex-col rounded-2xl border border-slate-700/60 bg-slate-900 text-slate-100 shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Central de Exportação Científica</h2>
              <p className="text-xs text-slate-400">
                Exportação direta dos {pontos.length} pontos amostrais sem necessidade de recálculo
              </p>
            </div>
          </div>
          <button
            onClick={fecharModal}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Opções de Exportação */}
        <div className="p-6 space-y-3">
          {pontos.length === 0 && (
            <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-3.5 text-xs text-amber-300 flex items-start gap-2.5">
              <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Exportação bloqueada (Regra 1 — Ausência Declarada):</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Não existem pontos amostrais carregados para esta AOI ({aoiAtiva.nome}). Conecte a API do Google Earth Engine ou importe pontos reais para exportar.
                </p>
              </div>
            </div>
          )}

          {/* Option 1: XLSX 3 abas */}
          <button
            onClick={exportarXlsx}
            disabled={baixando !== null || pontos.length === 0}
            className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800/40 p-4 text-left transition-all hover:border-emerald-500 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Tabela Consolidada Oficial (.xlsx)</span>
                  <span className="rounded bg-emerald-900/60 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    3 Abas
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Aba 1: Dados completos · Aba 2: Metadados/Origem · Aba 3: Qualidade por Variável
                </p>
              </div>
            </div>
            {baixando === "xlsx" ? <Check className="h-5 w-5 text-emerald-400 animate-pulse" /> : <Download className="h-4 w-4 text-slate-400" />}
          </button>

          {/* Option 2: CSV Científico */}
          <button
            onClick={() => exportarCsv(false)}
            disabled={baixando !== null || pontos.length === 0}
            className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800/40 p-4 text-left transition-all hover:border-emerald-500 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-950 text-blue-400 border border-blue-800/50">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white">Planilha Tabular CSV (.csv)</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Estrutura com delimitador ponto-e-vírgula, UTF-8 BOM e bloco de fundamentação LGPD
                </p>
              </div>
            </div>
            {baixando === "csv" ? <Check className="h-5 w-5 text-blue-400 animate-pulse" /> : <Download className="h-4 w-4 text-slate-400" />}
          </button>

          {/* Option 3: GeoJSON */}
          <button
            onClick={exportarGeoJson}
            disabled={baixando !== null || pontos.length === 0}
            className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800/40 p-4 text-left transition-all hover:border-emerald-500 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white">Camada Vetorial GeoJSON (.geojson)</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pontos geodésicos para abertura direta no QGIS, ArcGIS ou Google Earth Pro
                </p>
              </div>
            </div>
            {baixando === "geojson" ? <Check className="h-5 w-5 text-cyan-400 animate-pulse" /> : <Download className="h-4 w-4 text-slate-400" />}
          </button>

          {/* Option 4: Plano Cego de Campo */}
          <button
            onClick={() => exportarCsv(true)}
            disabled={baixando !== null || pontos.length === 0}
            className="flex w-full items-center justify-between rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 text-left transition-all hover:border-amber-600 hover:bg-amber-950/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-950 text-amber-400 border border-amber-800/50">
                <EyeOff className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-300">Plano de Campo em Modo Cego (.csv)</span>
                  <span className="rounded bg-amber-900/60 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    Fase 6
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Omite critérios de amostragem e estratos para evitar indução do técnico avaliador
                </p>
              </div>
            </div>
            {baixando === "csv-cego" ? <Check className="h-5 w-5 text-amber-400 animate-pulse" /> : <Download className="h-4 w-4 text-amber-400" />}
          </button>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3.5 bg-slate-900/90 rounded-b-2xl">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Guarda antissintético e 7 invariantes verificados</span>
          </div>
          <button
            onClick={fecharModal}
            className="rounded-xl px-4 py-1.5 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
