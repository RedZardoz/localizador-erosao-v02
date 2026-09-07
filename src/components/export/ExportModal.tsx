"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  FileCode,
  Globe,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  GraduationCap,
  Table2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Zap,
  Loader2,
  Database,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useErosionStore, useFilteredPoints } from "@/lib/store/useErosionStore";
import {
  downloadBlob,
  downloadFile,
  exportToCSV,
  exportToGeoJSON,
  exportToKML,
  exportTrainingDatasetCSV,
} from "@/lib/utils/exportUtils";
import {
  exportAuditTableCSV,
  exportAuditTableXLSX,
  generateAuditTableFileName,
  AuditTableMetadata,
  FonteDadosItem,
} from "@/lib/utils/auditTableExport";
import { enrichPointsBatch } from "@/lib/utils/batchEnrichment";

export const ExportModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    allPoints,
    activeAOIPolygon,
    activeRegion,
    filters,
    updateMultiplePoints,
  } = useErosionStore();

  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);
  const [consolidatedSelection, setConsolidatedSelection] = useState<"filtered" | "all">("filtered");
  const [isExportingConsolidated, setIsExportingConsolidated] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [autoCalculateRusle, setAutoCalculateRusle] = useState(true);
  const [autoQueryTenure, setAutoQueryTenure] = useState(true);
  const [forceRecalculate, setForceRecalculate] = useState(false);
  const [processSuccessMessage, setProcessSuccessMessage] = useState<string | null>(null);
  const [processErrorMessage, setProcessErrorMessage] = useState<string | null>(null);
  const [enrichmentProgress, setEnrichmentProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);

  const points = useFilteredPoints();
  const validatedCount = allPoints.filter((p) => p.dataProvenance === "field-validated").length;

  if (activeModal !== "export") return null;

  const targetPoints = consolidatedSelection === "filtered" ? points : allPoints;
  const hasPoints = allPoints.length > 0;
  const hasTargetPoints = targetPoints.length > 0;

  const rusleCalculatedCount = targetPoints.filter(
    (p) => p.rusleFactors && typeof p.rusleFactors.r === "number" && typeof p.estimatedSoilLoss === "number"
  ).length;

  const tenureConsultedCount = targetPoints.filter(
    (p) => p.tenureStatus !== undefined && p.tenureStatus !== null
  ).length;

  const tenureMatchedCount = targetPoints.filter(
    (p) => p.carCode || (p.tenureStatus && p.tenureStatus !== "sem-correspondencia")
  ).length;

  const handleProcessBatch = async () => {
    if (!hasTargetPoints || isProcessingBatch || isExportingConsolidated) return;
    setIsProcessingBatch(true);
    setProcessSuccessMessage(null);
    setProcessErrorMessage(null);
    setEnrichmentProgress({
      current: 0,
      total: targetPoints.length,
      message: "Iniciando processamento em lote...",
    });

    try {
      const updatedPoints = await enrichPointsBatch(
        targetPoints,
        {
          calculateRusle: true,
          queryTenure: true,
          forceRefresh: forceRecalculate,
        },
        (curr, total, msg) => {
          setEnrichmentProgress({ current: curr, total, message: msg });
        }
      );

      updateMultiplePoints(updatedPoints);

      const newRusleCount = updatedPoints.filter(
        (p) => p.rusleFactors && typeof p.rusleFactors.r === "number"
      ).length;
      const newMatchedCount = updatedPoints.filter(
        (p) => p.carCode || (p.tenureStatus && p.tenureStatus !== "sem-correspondencia")
      ).length;

      setProcessSuccessMessage(
        `Processamento concluído com sucesso! ${updatedPoints.length} focos enriquecidos (${newRusleCount} com RUSLE calculada, ${newMatchedCount} associados a imóveis rurais CAR/INCRA).`
      );
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => setProcessSuccessMessage(null), 8000);
    } catch (err: any) {
      console.error("[ExportModal] Erro ao processar dados em lote:", err);
      setProcessErrorMessage(
        err?.message || "Ocorreu uma falha no processamento dos cálculos em lote. Verifique se o servidor local está ativo."
      );
    } finally {
      setIsProcessingBatch(false);
      setEnrichmentProgress(null);
    }
  };

  const handleExportConsolidated = async (format: "xlsx" | "csv") => {
    if (!hasTargetPoints) return;
    setIsExportingConsolidated(true);
    setProcessSuccessMessage(null);
    setProcessErrorMessage(null);
    setEnrichmentProgress(null);

    try {
      let finalPoints = targetPoints;

      if (autoCalculateRusle || autoQueryTenure) {
        setEnrichmentProgress({
          current: 0,
          total: targetPoints.length,
          message: "Verificando dados e aplicando cálculos pré-exportação...",
        });

        finalPoints = await enrichPointsBatch(
          targetPoints,
          {
            calculateRusle: autoCalculateRusle,
            queryTenure: autoQueryTenure,
            forceRefresh: forceRecalculate,
          },
          (curr, total, msg) => {
            setEnrichmentProgress({ current: curr, total, message: msg });
          }
        );

        // Atualiza os pontos no estado global do mapa/aplicação
        updateMultiplePoints(finalPoints);
      }

      if (format === "xlsx") {
        let fontesDados: FonteDadosItem[] | null = null;
        try {
          const res = await fetch("/api/fundiario/fontes");
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
              fontesDados = json.data;
            }
          }
        } catch (e) {
          console.warn("[Export] Falha ao consultar /api/fundiario/fontes:", e);
        }

        const meta: AuditTableMetadata = {
          isFiltered: consolidatedSelection === "filtered",
          totalLoaded: allPoints.length,
          exportedCount: finalPoints.length,
          activeRegion: activeRegion.name,
          activeSeverities: filters.selectedSeverities,
          topN: filters.topN,
          aoiName: activeAOIPolygon ? (activeAOIPolygon.name || activeAOIPolygon.fileName) : null,
          fontesDados,
        };

        const blob = await exportAuditTableXLSX(finalPoints, meta);
        const fileName = generateAuditTableFileName(activeRegion.name, finalPoints.length, "xlsx");
        downloadBlob(blob, fileName);
        setDownloadedFormat("TABELA CONSOLIDADA (XLSX)");
      } else {
        const content = exportAuditTableCSV(finalPoints);
        const fileName = generateAuditTableFileName(activeRegion.name, finalPoints.length, "csv");
        downloadFile(content, fileName, "text/csv;charset=utf-8;");
        setDownloadedFormat("TABELA CONSOLIDADA (CSV)");
      }

      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      setTimeout(() => setDownloadedFormat(null), 3500);
    } catch (err: any) {
      console.error("[ExportModal] Erro ao exportar tabela consolidada:", err);
      setProcessErrorMessage(
        `Erro na exportação: ${err?.message || "Falha inesperada ao gerar arquivo. Tente novamente."}`
      );
    } finally {
      setIsExportingConsolidated(false);
      setEnrichmentProgress(null);
    }
  };

  const handleExport = (format: "geojson" | "kml" | "csv" | "print" | "training") => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const baseName = `triagem_erosao_${activeRegion.state.toLowerCase()}_${points.length}_focos_${timestamp}`;

    if (format === "geojson") {
      const content = exportToGeoJSON(points, activeAOIPolygon);
      downloadFile(content, `${baseName}.geojson`, "application/geo+json");
    } else if (format === "kml") {
      const content = exportToKML(points, `Triagem Erosão - ${activeRegion.name}`);
      downloadFile(content, `${baseName}.kml`, "application/vnd.google-earth.kml+xml");
    } else if (format === "csv") {
      const content = exportToCSV(points);
      downloadFile(content, `${baseName}.csv`, "text/csv;charset=utf-8;");
    } else if (format === "training") {
      const content = exportTrainingDatasetCSV(allPoints);
      downloadFile(content, `dataset_treinamento_xgboost_${timestamp}.csv`, "text/csv;charset=utf-8;");
    } else if (format === "print") {
      window.print();
      return;
    }

    setDownloadedFormat(format.toUpperCase());
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });

    setTimeout(() => setDownloadedFormat(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in transition-colors overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Exportação de Dados Geoespaciais</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {points.length} feições de erosão ativas de {allPoints.length} carregadas
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Card Principal de Destaque Acadêmico: Tabela Consolidada */}
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-500/50 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                  <Table2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Tabela Consolidada
                    <span className="text-[10px] uppercase tracking-wider font-semibold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      Padrão Pericial
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Uma linha por foco, com todos os dados do laudo pericial: variáveis biofísicas, fatores RUSLE, identificação fundiária e cadeia de consulta.
                  </p>
                </div>
              </div>
            </div>

            {/* Seletor de Escopo: Focos Selecionados vs Todos */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Conjunto:</span>
              <div className="flex rounded-lg bg-slate-200/80 dark:bg-slate-800 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setConsolidatedSelection("filtered")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    consolidatedSelection === "filtered"
                      ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Focos filtrados ({points.length})
                </button>
                <button
                  type="button"
                  onClick={() => setConsolidatedSelection("all")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    consolidatedSelection === "all"
                      ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Todos os focos ({allPoints.length})
                </button>
              </div>
            </div>

            {/* Painel de Diagnóstico do Estado dos Dados no Escopo */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Badge RUSLE */}
              <div
                className={`p-2.5 rounded-xl border flex flex-col justify-between transition-colors ${
                  rusleCalculatedCount === targetPoints.length && targetPoints.length > 0
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[11px] uppercase tracking-wide">Equação RUSLE</span>
                  {rusleCalculatedCount === targetPoints.length && targetPoints.length > 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                </div>
                <div className="text-sm font-black">
                  {rusleCalculatedCount} / {targetPoints.length}
                  <span className="text-[10px] font-normal ml-1">
                    ({targetPoints.length > 0 ? Math.round((rusleCalculatedCount / targetPoints.length) * 100) : 0}%)
                  </span>
                </div>
                <span className="text-[10px] opacity-80 mt-0.5">
                  {rusleCalculatedCount === targetPoints.length && targetPoints.length > 0
                    ? "Fatores R, K, LS, C, P calculados"
                    : "Fatores pendentes de cálculo"}
                </span>
              </div>

              {/* Badge Fundiário */}
              <div
                className={`p-2.5 rounded-xl border flex flex-col justify-between transition-colors ${
                  tenureConsultedCount === targetPoints.length && targetPoints.length > 0
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[11px] uppercase tracking-wide">Base Fundiária</span>
                  {tenureConsultedCount === targetPoints.length && targetPoints.length > 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </div>
                <div className="text-sm font-black">
                  {tenureConsultedCount} / {targetPoints.length}
                  <span className="text-[10px] font-normal ml-1">
                    ({tenureMatchedCount} com CAR)
                  </span>
                </div>
                <span className="text-[10px] opacity-80 mt-0.5">
                  {tenureConsultedCount === targetPoints.length && targetPoints.length > 0
                    ? "Cruzamento CAR/SIGEF/SNCR concluído"
                    : "Consulta fundiária pendente"}
                </span>
              </div>
            </div>

            {/* SEÇÃO DO BOTÃO OPCIONAL DE CÁLCULO EXPLÍCITO */}
            <div className="p-3 bg-white/90 dark:bg-slate-900/90 border-2 border-emerald-400/80 dark:border-emerald-600/70 rounded-xl space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Cálculo & Cruzamento Fundiário dos Focos (Opcional):
                </span>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={forceRecalculate}
                    onChange={(e) => setForceRecalculate(e.target.checked)}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Forçar recálculo</span>
                </label>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Calcule os fatores biofísicos da RUSLE e identifique os imóveis/proprietários no CAR e INCRA para todos os {targetPoints.length} focos agora mesmo, antes da exportação.
              </p>

              <button
                type="button"
                onClick={handleProcessBatch}
                disabled={!hasTargetPoints || isProcessingBatch || isExportingConsolidated}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isProcessingBatch ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Processando {enrichmentProgress?.current || 0} de {enrichmentProgress?.total || targetPoints.length}...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>⚡ Processar e Calcular Dados dos {targetPoints.length} Focos Agora</span>
                  </>
                )}
              </button>
            </div>

            {/* Mensagem de Sucesso */}
            {processSuccessMessage && (
              <div className="p-3 bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{processSuccessMessage}</div>
              </div>
            )}

            {/* Mensagem de Erro */}
            {processErrorMessage && (
              <div className="p-3 bg-red-100/90 dark:bg-red-950/80 border border-red-400 dark:border-red-700 text-red-900 dark:text-red-100 text-xs rounded-xl flex items-start justify-between gap-2 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <span className="font-medium">{processErrorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setProcessErrorMessage(null)}
                  className="text-red-600 hover:text-red-800 dark:text-red-300 text-xs font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Opções de Enriquecimento Automático Pré-Exportação */}
            <div className="p-3 bg-white/70 dark:bg-slate-900/70 border border-emerald-300/70 dark:border-emerald-800/60 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Ao Clicar em Exportar (Executar Automaticamente se Pendente):
              </span>
              <div className="space-y-1.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  <input
                    type="checkbox"
                    checked={autoCalculateRusle}
                    onChange={(e) => setAutoCalculateRusle(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>
                    Calcular fatores e perda de solo da RUSLE (R, K, LS, C, P)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  <input
                    type="checkbox"
                    checked={autoQueryTenure}
                    onChange={(e) => setAutoQueryTenure(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>
                    Executar cruzamento fundiário em lote (CAR, SIGEF, INCRA/SNCR)
                  </span>
                </label>
              </div>
            </div>

            {/* Feedback Visual / Barra de Progresso durante processamento */}
            {enrichmentProgress && (
              <div className="p-3 bg-emerald-100/90 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-700 rounded-xl space-y-1.5 animate-in fade-in">
                <div className="flex justify-between items-center text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  <span className="truncate">{enrichmentProgress.message}</span>
                  <span className="shrink-0 ml-2 font-mono">
                    {Math.round((enrichmentProgress.current / (enrichmentProgress.total || 1)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-emerald-200 dark:bg-emerald-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(
                        5,
                        Math.min(100, Math.round((enrichmentProgress.current / (enrichmentProgress.total || 1)) * 100))
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {!hasPoints ? (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/60 rounded-xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Nenhum foco carregado. Carregue pontos via GEE ou importe um arquivo antes de exportar.</span>
              </div>
            ) : (
              <>
                {/* Botões de Ação XLSX e CSV */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleExportConsolidated("xlsx")}
                    disabled={!hasTargetPoints || isExportingConsolidated}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>XLSX (recomendado)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportConsolidated("csv")}
                    disabled={!hasTargetPoints || isExportingConsolidated}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 active:bg-slate-200 border border-slate-300 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>CSV</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  O CSV não inclui a folha de procedência e conformidade. Para anexar à dissertação, prefira o XLSX.
                </p>
              </>
            )}
          </div>

          {/* Formatos SIG e Ferramentas Especializadas */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              Outros Formatos SIG e Aprendizado de Máquina
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* GeoJSON */}
              <button
                onClick={() => handleExport("geojson")}
                disabled={!hasPoints}
                className="p-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 rounded-xl text-left transition-all group flex flex-col justify-between space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <FileCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                    .GEOJSON
                  </span>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">GeoJSON Padronizado</h5>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Ideal para QGIS, ArcGIS, MapLibre e WebGIS.
                  </p>
                </div>
              </button>

              {/* KML */}
              <button
                onClick={() => handleExport("kml")}
                disabled={!hasPoints}
                className="p-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 rounded-xl text-left transition-all group flex flex-col justify-between space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                    .KML
                  </span>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Google Earth KML</h5>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Com estilos e ícones de severidade em 3D.
                  </p>
                </div>
              </button>

              {/* CSV Tradicional */}
              <button
                onClick={() => handleExport("csv")}
                disabled={!hasPoints}
                className="p-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-800 hover:border-amber-500/60 rounded-xl text-left transition-all group flex flex-col justify-between space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <FileSpreadsheet className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                    .CSV
                  </span>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Tabela CSV Básica</h5>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Variáveis biofísicas sem dados fundiários.
                  </p>
                </div>
              </button>

              {/* Print / Report */}
              <button
                onClick={() => handleExport("print")}
                disabled={!hasPoints}
                className="p-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 rounded-xl text-left transition-all group flex flex-col justify-between space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <Printer className="w-4 h-4 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                    IMPRIMIR
                  </span>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Relatório de Triagem</h5>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Sumário executivo para impressão direta.
                  </p>
                </div>
              </button>

              {/* Training Dataset (field-validated only) */}
              <button
                onClick={() => handleExport("training")}
                disabled={validatedCount === 0}
                className="p-3 sm:col-span-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-800 hover:border-violet-500/60 rounded-xl text-left transition-all group flex flex-col justify-between space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <GraduationCap className="w-4 h-4 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                    ML / XGBOOST
                  </span>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Dataset de Treinamento (XGBoost)</h5>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Apenas os {validatedCount} ponto(s) validados em campo, com fatores RUSLE e observações.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {downloadedFormat && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/50 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Arquivo <strong>{downloadedFormat}</strong> gerado e baixado com sucesso!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Região: <strong className="text-slate-700 dark:text-slate-300">{activeRegion.name}</strong>
          </span>
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs rounded-lg transition-colors border border-slate-200 dark:border-transparent"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
