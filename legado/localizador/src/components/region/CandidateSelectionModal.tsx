"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Layers,
  MapPin,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Compass,
  Download,
  Eye,
  Satellite,
  ShieldAlert,
  Bookmark,
  FileSpreadsheet,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useErosionStore } from "@/lib/store/useErosionStore";
import { ErosionPoint } from "@/types/erosion";
import { WORLDCOVER_CLASSES } from "@/lib/gee/eligibilityConstants";
import { STRATA_DEFINITIONS } from "@/lib/gee/stratification";
import { exportToGeoJSON, exportToCSV, downloadFile, downloadBlob } from "@/lib/utils/exportUtils";
import { exportAuditTableXLSX, generateAuditTableFileName } from "@/lib/utils/auditTableExport";

export const CandidateSelectionModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    activeAOIPolygon,
    activeRegion,
    geeSessionActive,
    applyCandidatePoints,
    saveDataset,
    setHasUnsavedPoints,
    flyToPoint,
    flyToLocation,
  } = useErosionStore();

  const [savedCollection, setSavedCollection] = useState(false);

  // Configuração dos parâmetros
  const [targetCount, setTargetCount] = useState<number>(40);
  const [minSpacingKm, setMinSpacingKm] = useState<number>(1.0);
  const [minSlope, setMinSlope] = useState<number>(3.0);
  const [maxSlope, setMaxSlope] = useState<number>(20.0);
  const [waterBuffer, setWaterBuffer] = useState<number>(30);
  const [urbanBuffer, setUrbanBuffer] = useState<number>(150);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([30, 40, 60]);

  // Estado de execução
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultCandidates, setResultCandidates] = useState<ErosionPoint[] | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);

  if (activeModal !== "candidates") return null;

  // AOI ativa ou fallback de região
  const currentAOI = activeAOIPolygon?.geometry || {
    type: "Polygon",
    coordinates: [
      [
        [activeRegion.bounds[0][0], activeRegion.bounds[0][1]],
        [activeRegion.bounds[0][0], activeRegion.bounds[1][1]],
        [activeRegion.bounds[1][0], activeRegion.bounds[1][1]],
        [activeRegion.bounds[1][0], activeRegion.bounds[0][1]],
        [activeRegion.bounds[0][0], activeRegion.bounds[0][1]],
      ],
    ],
  };

  const aoiName = activeAOIPolygon?.name || `${activeRegion.name} (Bbox)`;

  const toggleClass = (code: number) => {
    if (selectedClasses.includes(code)) {
      if (selectedClasses.length === 1) return; // Não permitir desmarcar todas
      setSelectedClasses(selectedClasses.filter((c) => c !== code));
    } else {
      setSelectedClasses([...selectedClasses, code]);
    }
  };

  const handleRunSelection = async () => {
    if (!geeSessionActive) {
      setError("É necessário ativar uma sessão com Service Account do GEE em Configurações.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/gee/select-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aoi: currentAOI,
          targetCount,
          minSpacingKm,
          municipalityName: aoiName,
          stateName: activeRegion.state || "PR",
          eligibilityOptions: {
            allowedLandCoverClasses: selectedClasses,
            minSlopePercent: minSlope,
            maxSlopePercent: maxSlope,
            waterBufferMeters: waterBuffer,
            urbanBufferMeters: urbanBuffer,
            waterOccurrenceThreshold: 10,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Falha na requisição ao Earth Engine (HTTP ${res.status})`);
      }

      if (!json.data?.candidates || json.data.candidates.length === 0) {
        throw new Error(
          "Nenhum candidato elegível foi gerado pelo Earth Engine para os parâmetros configurados nesta AOI. Tente relaxar o espaçamento mínimo (ex: 0.5 km) ou incluir mais classes de uso da terra."
        );
      }

      setResultCandidates(json.data.candidates);
      setSummaryData(json.data.summary);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      setError(err.message || "Erro desconhecido ao processar seleção no GEE.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToMap = (replace: boolean) => {
    if (!resultCandidates || resultCandidates.length === 0) return;
    applyCandidatePoints(resultCandidates, replace);

    // Salva automaticamente a coleção no banco local para blindar contra qualquer perda acidental
    const aoiLabel = activeAOIPolygon?.name || activeRegion.name;
    const autoProjectName = `Eleição GEE ${aoiLabel} (${resultCandidates.length} focos) - ${new Date().toLocaleDateString("pt-BR")}`;
    saveDataset(
      autoProjectName,
      `Amostragem estratificada GEE com resolução 10m, dados físicos reais (Copernicus DEM, Sentinel-2, RUSLE) e cruzamento fundiário oficial (CAR/SNCR/SIGEF).`
    );
    setHasUnsavedPoints(false);

    if (resultCandidates.length > 0) {
      let minLat = 90;
      let maxLat = -90;
      let minLng = 180;
      let maxLng = -180;
      for (const p of resultCandidates) {
        if (p.latitude < minLat) minLat = p.latitude;
        if (p.latitude > maxLat) maxLat = p.latitude;
        if (p.longitude < minLng) minLng = p.longitude;
        if (p.longitude > maxLng) maxLng = p.longitude;
      }
      flyToLocation({
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2,
        zoom: resultCandidates.length > 50 ? 7.2 : 9.5,
        pitch: 45,
      });
    }

    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Seleção de Candidatos via Earth Engine
                <span className="text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  GEE Screened
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Máscara de Elegibilidade (10m) • Estratificação Cruzada (A1..B3) • Thinning Espacial
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

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          {/* AOI Context Card */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <span className="text-slate-500 dark:text-slate-400">Área de Interesse Ativa: </span>
                <span className="font-semibold text-slate-900 dark:text-white">{aoiName}</span>
              </div>
            </div>
            {!activeAOIPolygon && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                Dica: selecione um município na aba Região
              </span>
            )}
          </div>

          {/* Earth Engine Session Alert */}
          {!geeSessionActive && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-semibold">Sessão do Earth Engine não detectada no servidor</p>
                <p className="text-amber-700 dark:text-amber-300">
                  Para processar os dados satelitais reais (WorldCover, Copernicus DEM, JRC Water),
                  é necessário carregar o JSON da Service Account em{" "}
                  <button
                    onClick={() => setActiveModal("settings")}
                    className="underline font-bold hover:text-amber-900 dark:hover:text-amber-100"
                  >
                    Configurações → GEE Service Account
                  </button>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Configuration Form (quando não há resultado ainda) */}
          {!resultCandidates && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Quantidade de Candidatos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Quantidade Alvo de Candidatos
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="5"
                        max="500"
                        value={targetCount}
                        onChange={(e) => setTargetCount(Math.max(5, Math.min(500, Number(e.target.value) || 10)))}
                        className="w-16 px-1.5 py-0.5 text-right font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs text-slate-500 font-medium">pts</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={targetCount}
                    onChange={(e) => setTargetCount(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex items-center justify-between gap-1">
                    {[25, 50, 100, 150, 250, 500].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTargetCount(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors ${
                          targetCount === preset
                            ? "bg-indigo-600 text-white font-bold"
                            : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Espaçamento Mínimo (Thinning) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Espaçamento Mínimo (Thinning)</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{minSpacingKm.toFixed(1)} km</span>
                  </label>
                  <input
                    type="range"
                    min="0.2"
                    max="5.0"
                    step="0.2"
                    value={minSpacingKm}
                    onChange={(e) => setMinSpacingKm(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0.2 km</span>
                    <span>1.0 km</span>
                    <span>5.0 km</span>
                  </div>
                </div>
              </div>

              {/* Declividade e Buffers de Proteção (Água e Urbano) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Declividade Mín. (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={minSlope}
                    onChange={(e) => setMinSlope(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Declividade Máx. (%)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={maxSlope}
                    onChange={(e) => setMaxSlope(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Buffer Água (m)</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={waterBuffer}
                    onChange={(e) => setWaterBuffer(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1" title="Buffer morfológico ao redor de áreas urbanizadas e edificações (ESA WorldCover classe 50)">
                    Buffer Urbano (m)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="50"
                    value={urbanBuffer}
                    onChange={(e) => setUrbanBuffer(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium text-indigo-600 dark:text-indigo-400"
                  />
                </div>
              </div>

              {/* Classes Permitidas de Uso do Solo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Uso do Solo Elegível (ESA WorldCover 10m):
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Áreas urbanas (50) e água (80) são excluídas via buffer
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.values(WORLDCOVER_CLASSES)
                    .filter((cls) => [30, 40, 60, 10].includes(cls.code))
                    .map((cls) => {
                      const isSelected = selectedClasses.includes(cls.code);
                      return (
                        <button
                          key={cls.code}
                          type="button"
                          onClick={() => toggleClass(cls.code)}
                          className={`p-2 rounded-lg border text-left text-xs transition-all ${
                            isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 font-semibold"
                              : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{cls.name}</span>
                            <span className="text-[10px] font-mono opacity-70">({cls.code})</span>
                          </div>
                          <span className="text-[10px] block opacity-70">{cls.description}</span>
                        </button>
                      );
                    })}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Blindagem Perimetral:</span> O buffer urbano de {urbanBuffer}m conecta quadras urbanas e elimina lotes baldios, terraplenagens e praças intraurbanas. Candidatos em imóveis rurais (CAR) recebem prioridade estrita de seleção.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Results View */}
          {resultCandidates && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      {resultCandidates.length} Candidatos Elegíveis Selecionados
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      Amostragem estratificada com sucesso no GEE (espaçamento mín.: {minSpacingKm} km).
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setResultCandidates(null)}
                  className="text-xs font-semibold px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-emerald-300 dark:border-emerald-700 transition-colors"
                >
                  Nova Seleção
                </button>
              </div>

              {/* Strata Distribution Badges */}
              {summaryData?.strataDistribution && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Distribuição Amostral por Sub-Estrato (README §3):
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {["A1", "A2", "A3", "B1", "B2", "B3"].map((stId) => {
                      const count = summaryData.strataDistribution[stId] || 0;
                      return (
                        <div
                          key={stId}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center"
                        >
                          <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 block">
                            Estrato {stId}
                          </span>
                          <span className="text-lg font-bold text-slate-900 dark:text-white">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lista Prévia dos Candidatos */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Amostra dos Candidatos Selecionados:
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-950/40">
                  {resultCandidates.slice(0, 15).map((cand) => (
                    <div
                      key={cand.id}
                      className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{cand.code}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          Estrato {cand.stratumId}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {cand.slopePercent.toFixed(1)}% decl. • BSI {cand.bsi.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            cand.severity === "Crítica"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                              : cand.severity === "Alta"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400"
                          }`}
                        >
                          Score {cand.priorityScore}
                        </span>
                      </div>
                    </div>
                  ))}
                  {resultCandidates.length > 15 && (
                    <p className="text-center text-[10px] text-slate-400 py-1">
                      ... e mais {resultCandidates.length - 15} candidatos selecionados
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between gap-3">
          {!resultCandidates ? (
            <>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRunSelection}
                disabled={loading || !geeSessionActive}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processando no Earth Engine...
                  </>
                ) : (
                  <>
                    <Satellite className="w-4 h-4" />
                    Executar Seleção GEE
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const meta = {
                      isFiltered: false,
                      totalLoaded: resultCandidates.length,
                      exportedCount: resultCandidates.length,
                      activeRegion: activeRegion.name,
                      aoiName: activeAOIPolygon?.name || activeRegion.name,
                    };
                    const blob = await exportAuditTableXLSX(resultCandidates, meta);
                    const fileName = generateAuditTableFileName(activeAOIPolygon?.name || activeRegion.name, resultCandidates.length, "xlsx");
                    downloadBlob(blob, fileName);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl border border-emerald-300 dark:border-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Baixar Planilha Consolidada com Memória de Cálculo Completa (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Planilha (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const content = exportToGeoJSON(resultCandidates, activeAOIPolygon);
                    downloadFile(content, `candidatos_gee_${Date.now()}.geojson`, "application/geo+json");
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  GeoJSON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const content = exportToCSV(resultCandidates);
                    downloadFile(content, `candidatos_gee_${Date.now()}.csv`, "text/csv;charset=utf-8;");
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    applyCandidatePoints(resultCandidates, true);
                    const name = `Candidatos GEE ${activeAOIPolygon?.name || activeRegion.name} (${resultCandidates.length} focos)`;
                    saveDataset(name, `Amostragem estratificada GEE com espaçamento de ${minSpacingKm} km.`);
                    setSavedCollection(true);
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all ${
                    savedCollection
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                      : "text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {savedCollection ? "Coleção Salva!" : "Salvar Coleção"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyToMap(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Adicionar ao Mapa
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyToMap(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Substituir Pontos do Mapa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
