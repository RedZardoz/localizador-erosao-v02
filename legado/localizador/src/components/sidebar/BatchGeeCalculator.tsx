"use client";

import React, { useRef, useState } from "react";
import { Satellite, RefreshCw, StopCircle, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { useErosionStore, useFilteredPoints } from "@/lib/store/useErosionStore";
import { ErosionPoint } from "@/types/erosion";
import { isPointSlopeOutdated, GEE_CALC_ENGINE_VERSION } from "@/lib/gee/calcEngineVersion";

const MAX_CONCURRENT = 3; // limite de chamadas simultâneas ao Earth Engine por Service Account
const MAX_BATCH_SIZE = 60; // trava de segurança contra estourar cota da API pública/GEE

/**
 * Calcula variáveis reais (Earth Engine + NASA POWER) para vários pontos de
 * uma vez, com concorrência limitada e progresso por ponto — cada chamada
 * reaproveita a MESMA rota /api/gee/analyze-point já testada individualmente
 * no popup de cada ponto, apenas orquestrada em fila no cliente. Uma falha
 * isolada (ex.: ponto sem cena Sentinel-2 disponível) não derruba o lote.
 */
export const BatchGeeCalculator: React.FC = () => {
  const { geeSessionActive, updatePointWithRealData, addSystemLog } = useErosionStore();
  const points = useFilteredPoints();
  const outdated = points.filter((p) => isPointSlopeOutdated(p));
  const uncalculated = points.filter((p) => p.dataProvenance !== "satellite-derived" && p.dataProvenance !== "gee-screened");
  const eligible = points.filter((p) => p.dataProvenance !== "satellite-derived" || isPointSlopeOutdated(p));

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState(0);
  const [total, setTotal] = useState(0);
  const cancelRef = useRef(false);

  if (!geeSessionActive) {
    return (
      <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Configure uma Service Account do GEE em Configurações para calcular variáveis reais em lote para os pontos
        filtrados.
      </div>
    );
  }

  const runBatch = async () => {
    const targets = eligible.slice(0, MAX_BATCH_SIZE);
    if (targets.length === 0) return;

    cancelRef.current = false;
    setRunning(true);
    setDone(0);
    setFailed(0);
    setTotal(targets.length);

    addSystemLog({
      severity: "info",
      category: "GEE",
      message: `Iniciando cálculo em lote via Google Earth Engine para ${targets.length} pontos amostrais.`,
    });

    let cursor = 0;
    let failedCount = 0;
    let doneCount = 0;

    const worker = async () => {
      while (cursor < targets.length && !cancelRef.current) {
        const point = targets[cursor++];
        await computeOne(point);
      }
    };

    const computeOne = async (point: ErosionPoint) => {
      try {
        const res = await fetch("/api/gee/analyze-point", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: point.latitude, longitude: point.longitude, soilType: point.soilType }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Falha na resposta do servidor");
        updatePointWithRealData(point.id, {
          ...json.data,
          calcEngineVersion: json.data.calcEngineVersion || GEE_CALC_ENGINE_VERSION,
        });

        const rf = json.data?.rusleFactors;
        const lossVal = rf?.r && rf?.k && rf?.ls && rf?.c ? (rf.r * rf.k * rf.ls * rf.c * (rf.p ?? 1)).toFixed(2) : undefined;
        addSystemLog({
          severity: "success",
          category: "GEE",
          message: `Ponto ${point.code} recalculado com sucesso via GEE.${lossVal ? ` Perda: ${lossVal} t/ha·ano.` : ""}`,
        });
      } catch (err: any) {
        failedCount++;
        setFailed(failedCount);
        addSystemLog({
          severity: "error",
          category: "GEE",
          message: `Falha ao calcular ponto ${point.code} via GEE: ${err?.message || "Erro desconhecido"}`,
        });
      } finally {
        doneCount++;
        setDone(doneCount);
      }
    };

    const workers = Array.from({ length: Math.min(MAX_CONCURRENT, targets.length) }, () => worker());
    await Promise.all(workers);

    addSystemLog({
      severity: "info",
      category: "GEE",
      message: `Cálculo em lote finalizado: ${targets.length - failedCount} sucessos, ${failedCount} falhas.`,
    });

    setRunning(false);
  };

  const cancel = () => {
    cancelRef.current = true;
  };

  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Satellite className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Cálculo de Satélite em Lote (GEE)
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
          {eligible.length} elegível(is)
          {outdated.length > 0 ? ` (${outdated.length} desatualizado(s))` : ""}
        </span>
      </div>

      <p className="text-[10px] text-slate-500 dark:text-slate-400">
        Calcula ou recalcula BSI/NDVI/declividade/RUSLE reais para até {MAX_BATCH_SIZE} pontos filtrados (não calculados ou com motor desatualizado),
        {MAX_CONCURRENT} por vez, para não estourar a cota da sua Service Account.
      </p>

      {running ? (
        <div className="space-y-1.5">
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span>
              {done}/{total} processado(s){failed > 0 ? ` • ${failed} falha(s)` : ""}
            </span>
            <button
              onClick={cancel}
              className="flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold"
            >
              <StopCircle className="w-3 h-3" />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={runBatch}
          disabled={eligible.length === 0}
          className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Calcular {Math.min(eligible.length, MAX_BATCH_SIZE)} ponto(s) reais
        </button>
      )}

      {!running && total > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
          {failed === 0 ? (
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          )}
          Último lote: {done - failed} sucesso(s), {failed} falha(s).
        </div>
      )}
    </div>
  );
};
