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
  FileText,
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

export const ExportModal: React.FC = () => {
  const { activeModal, setActiveModal, allPoints, activeAOIPolygon, activeRegion, filters } =
    useErosionStore();

  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);
  const [consolidatedSelection, setConsolidatedSelection] = useState<"filtered" | "all">("filtered");
  const [isExportingConsolidated, setIsExportingConsolidated] = useState(false);

  const points = useFilteredPoints();
  const validatedCount = allPoints.filter((p) => p.dataProvenance === "field-validated").length;

  if (activeModal !== "export") return null;

  const targetPoints = consolidatedSelection === "filtered" ? points : allPoints;
  const hasPoints = allPoints.length > 0;
  const hasTargetPoints = targetPoints.length > 0;

  const handleExportConsolidated = async (format: "xlsx" | "csv") => {
    if (!hasTargetPoints) return;
    setIsExportingConsolidated(true);

    try {
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
          exportedCount: targetPoints.length,
          activeRegion: activeRegion.name,
          activeSeverities: filters.selectedSeverities,
          topN: filters.topN,
          aoiName: activeAOIPolygon ? (activeAOIPolygon.name || activeAOIPolygon.fileName) : null,
          fontesDados,
        };

        const blob = await exportAuditTableXLSX(targetPoints, meta);
        const fileName = generateAuditTableFileName(activeRegion.name, targetPoints.length, "xlsx");
        downloadBlob(blob, fileName);
        setDownloadedFormat("TABELA CONSOLIDADA (XLSX)");
      } else {
        const content = exportAuditTableCSV(targetPoints);
        const fileName = generateAuditTableFileName(activeRegion.name, targetPoints.length, "csv");
        downloadFile(content, fileName, "text/csv;charset=utf-8;");
        setDownloadedFormat("TABELA CONSOLIDADA (CSV)");
      }

      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      setTimeout(() => setDownloadedFormat(null), 3500);
    } catch (err) {
      console.error("[ExportModal] Erro ao exportar tabela consolidada:", err);
    } finally {
      setIsExportingConsolidated(false);
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
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Conjunto:</span>
              <div className="flex rounded-lg bg-slate-200/80 dark:bg-slate-800 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setConsolidatedSelection("filtered")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    consolidatedSelection === "filtered"
                      ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Focos selecionados ({points.length})
                </button>
                <button
                  type="button"
                  onClick={() => setConsolidatedSelection("all")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    consolidatedSelection === "all"
                      ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Todos os focos ({allPoints.length})
                </button>
              </div>
            </div>

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
