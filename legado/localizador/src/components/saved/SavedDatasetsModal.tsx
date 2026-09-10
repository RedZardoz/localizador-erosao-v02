"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Bookmark,
  Save,
  FolderOpen,
  Download,
  Trash2,
  Upload,
  Calendar,
  MapPin,
  FileJson,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { useErosionStore, useFilteredPoints } from "@/lib/store/useErosionStore";
import { SavedPointDataset } from "@/types/erosion";
import { isPointSlopeOutdated } from "@/lib/gee/calcEngineVersion";

export const SavedDatasetsModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    savedDatasets,
    saveDataset,
    loadDataset,
    deleteDataset,
    importDataset,
    activeAOIPolygon,
    activeRegion,
    addSystemLog,
  } = useErosionStore();

  const currentPoints = useFilteredPoints();
  const [collectionName, setCollectionName] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (activeModal !== "saved-datasets") return null;

  const defaultName = `Coleção ${activeAOIPolygon?.name || activeRegion.name} (${currentPoints.length} focos) - ${new Date().toLocaleDateString("pt-BR")}`;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPoints.length === 0) return;

    const finalName = collectionName.trim() || defaultName;
    saveDataset(finalName, collectionDescription);
    setSaveSuccessMsg(`Coleção "${finalName}" salva com sucesso!`);
    setCollectionName("");
    setCollectionDescription("");
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleExportJSON = (dataset: SavedPointDataset) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataset, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    const sanitizedName = dataset.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    downloadAnchor.setAttribute("download", `projeto_erosao_${sanitizedName}_${dataset.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (!parsed.points || !Array.isArray(parsed.points)) {
          throw new Error("O arquivo JSON não possui o formato de dataset do Localizador de Erosão.");
        }
        importDataset(parsed);
        setSaveSuccessMsg(`Coleção "${parsed.name || file.name}" importada com sucesso!`);
        setTimeout(() => setSaveSuccessMsg(null), 3500);
      } catch (err: any) {
        setImportError(err?.message || "Erro ao ler e processar arquivo JSON.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLoadDataset = (dataset: SavedPointDataset) => {
    const outdatedCount = dataset.points.filter((p) => isPointSlopeOutdated(p)).length;
    if (outdatedCount > 0) {
      addSystemLog({
        severity: "warning",
        category: "GEE",
        message: `${outdatedCount} de ${dataset.pointsCount} pontos da coleção "${dataset.name}" foram calculados antes da correção da declividade — recomenda-se recalcular antes de usar para decisões de campo.`,
      });
    }
    loadDataset(dataset.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Coleções & Projetos Salvos
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {savedDatasets.length} {savedDatasets.length === 1 ? "coleção" : "coleções"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Salve seleções de campo ativas para recarregar a qualquer momento ou exporte arquivos de projeto.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              className="hidden"
              onChange={handleFileImport}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              title="Importar projeto salvo em arquivo JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              Importar JSON
            </button>
            <button
              onClick={() => setActiveModal(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {saveSuccessMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs font-medium text-emerald-800 dark:text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {importError && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs font-medium text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{importError}</span>
            </div>
          )}

          {/* Section 1: Salvar Seleção Atual */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Salvar Seleção Ativa no Mapa
              </span>
              <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {currentPoints.length} focos no mapa
              </span>
            </div>

            {currentPoints.length > 0 ? (
              <form onSubmit={handleSave} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Nome da Coleção
                    </label>
                    <input
                      type="text"
                      value={collectionName}
                      onChange={(e) => setCollectionName(e.target.value)}
                      placeholder={defaultName}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Descrição / Observações (opcional)
                    </label>
                    <input
                      type="text"
                      value={collectionDescription}
                      onChange={(e) => setCollectionDescription(e.target.value)}
                      placeholder="Ex: Candidatos triados via GEE para campanha de solo em Céu Azul"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Salvar Esta Coleção
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-1">
                Não há pontos ativos no mapa no momento. Use o botão <strong>&ldquo;Candidatos GEE&rdquo;</strong> ou <strong>&ldquo;Conexão &amp; Dados&rdquo;</strong> para gerar ou carregar pontos antes de salvar.
              </p>
            )}
          </div>

          {/* Section 2: Lista de Coleções Salvas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                Histórico de Coleções ({savedDatasets.length})
              </span>
            </div>

            {savedDatasets.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <FileJson className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Nenhuma coleção salva ainda
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Suas seleções salvas ficarão guardadas permanentemente neste navegador e poderão ser recarregadas a qualquer momento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {savedDatasets.map((dataset) => {
                  const critCount = dataset.points.filter((p) => p.severity === "Crítica").length;
                  const altaCount = dataset.points.filter((p) => p.severity === "Alta").length;
                  const modCount = dataset.points.filter((p) => p.severity === "Moderada").length;
                  const outdatedCount = dataset.points.filter((p) => isPointSlopeOutdated(p)).length;

                  return (
                    <div
                      key={dataset.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:border-emerald-500/40 transition-all flex flex-col justify-between group space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {dataset.name}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-slate-700">
                            {dataset.pointsCount} focos
                          </span>
                        </div>

                        {dataset.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {dataset.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            {dataset.regionName || "Paraná"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(dataset.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>

                        {/* Severities Breakdown */}
                        <div className="flex items-center gap-1.5 mt-2.5">
                          {critCount > 0 && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                              {critCount} Crítica
                            </span>
                          )}
                          {altaCount > 0 && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              {altaCount} Alta
                            </span>
                          )}
                          {modCount > 0 && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300">
                              {modCount} Mod
                            </span>
                          )}
                        </div>

                        {/* Outdated Slope Calculation Warning */}
                        {outdatedCount > 0 && (
                          <div className="flex items-start gap-1.5 p-2 mt-2.5 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-lg text-[10.5px] text-amber-800 dark:text-amber-300 leading-tight">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <span>
                              {outdatedCount} de {dataset.pointsCount} pontos desta coleção foram calculados antes da correção da declividade — recomenda-se recalcular antes de usar para decisões de campo.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleExportJSON(dataset)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Baixar arquivo JSON do projeto"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Excluir permanentemente a coleção "${dataset.name}"?`)) {
                                deleteDataset(dataset.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Excluir coleção salva"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleLoadDataset(dataset)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          Carregar no Mapa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-500">
          <span>Armazenamento local permanente no navegador</span>
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
