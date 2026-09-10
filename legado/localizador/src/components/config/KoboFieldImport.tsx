"use client";

import React, { useState } from "react";
import { UploadCloud, ClipboardCheck, CheckCircle2, AlertCircle, MapPinOff } from "lucide-react";
import { useErosionStore } from "@/lib/store/useErosionStore";
import { parseAndMatchKoboExport, KoboImportSummary, KoboMatchResult, MATCH_DISTANCE_METERS } from "@/lib/utils/koboParser";

/**
 * Fecha o ciclo triagem -> campo -> validação (README §4): importa o export
 * CSV do KoboToolbox, casa cada registro com o ponto de triagem mais próximo
 * e marca `dataProvenance: "field-validated"`. Estes pontos passam a compor
 * o dataset rotulado para o futuro treinamento do XGBoost (ver
 * PROMPT_IMPLEMENTACAO_SENIOR.md, item 6).
 */
export const KoboFieldImport: React.FC = () => {
  const { allPoints, updatePointWithRealData } = useErosionStore();
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<KoboImportSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setLoading(true);
    setErrorMsg(null);
    setSummary(null);
    try {
      const text = await file.text();
      const result = parseAndMatchKoboExport(text, allPoints);

      result.matched.forEach((m: KoboMatchResult) => {
        updatePointWithRealData(m.matchedPointId, {
          dataProvenance: "field-validated",
          fieldObservations: m.fieldObservations,
          fieldValidatedAt: new Date().toISOString(),
        });
      });

      setSummary(result);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao processar o export do KoboToolbox.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-3 transition-colors">
        <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-600 dark:text-cyan-400 shrink-0">
          <ClipboardCheck className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-300">
          <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">Validação de Campo (KoboToolbox)</h4>
          <p className="text-slate-500 dark:text-slate-400">
            Envie o export CSV do formulário de auditoria de campo (README §4.1). Cada registro é casado com o ponto
            de triagem existente mais próximo (raio de {MATCH_DISTANCE_METERS}m) e marcado como{" "}
            <span className="font-semibold text-cyan-600 dark:text-cyan-400">validado em campo</span>.
          </p>
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
        }}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
          dragOver
            ? "border-cyan-500 bg-cyan-500/10"
            : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900/40"
        }`}
      >
        <input
          type="file"
          id="kobo-file-input"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          className="hidden"
        />
        <UploadCloud className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
          Arraste o export <span className="text-cyan-600 dark:text-cyan-400">CSV do KoboToolbox</span> aqui
        </p>
        <label
          htmlFor="kobo-file-input"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
        >
          Selecionar Arquivo CSV
        </label>
      </div>

      {loading && <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Casando registros de campo com os pontos existentes...</p>}

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {errorMsg}
        </div>
      )}

      {summary && (
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            {summary.matched.length} de {summary.totalRows} registro(s) casado(s) e marcado(s) como validados em campo
          </div>
          {summary.unmatchedRows > 0 && (
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <MapPinOff className="w-4 h-4" />
              {summary.unmatchedRows} registro(s) sem GPS reconhecido ou sem ponto de triagem a menos de{" "}
              {MATCH_DISTANCE_METERS}m — não foram vinculados.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
