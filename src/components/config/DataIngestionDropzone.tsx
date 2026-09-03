"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Layers,
  Database,
  RefreshCw,
  Eye,
  Download,
  Info,
} from "lucide-react";
import { useErosionStore } from "@/lib/store/useErosionStore";
import { parseCSV, parseGeoJSON, parseKML, parseKMZ, ParsedDataResult } from "@/lib/utils/parsers";
import { downloadFile, exportToCSV } from "@/lib/utils/exportUtils";

export const DataIngestionDropzone: React.FC = () => {
  const {
    customPoints,
    setCustomPoints,
    setActiveAOIPolygon,
    flyToLocation,
  } = useErosionStore();

  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<ParsedDataResult | null>(null);

  const processFile = async (file: File) => {
    setLoading(true);
    setErrorMsg(null);
    setPreviewResult(null);

    const ext = file.name.split(".").pop()?.toLowerCase();

    try {
      let result: ParsedDataResult;

      if (ext === "csv") {
        const text = await file.text();
        result = await parseCSV(text, file.name);
      } else if (ext === "geojson" || ext === "json") {
        const text = await file.text();
        result = parseGeoJSON(text, file.name);
      } else if (ext === "kml") {
        const text = await file.text();
        result = parseKML(text, file.name);
      } else if (ext === "kmz") {
        const buffer = await file.arrayBuffer();
        result = await parseKMZ(buffer, file.name);
      } else {
        throw new Error("Formato não suportado. Utilize arquivos .csv, .geojson, .kml ou .kmz.");
      }

      setPreviewResult(result);

      // If points were extracted, update custom points
      if (result.points && result.points.length > 0) {
        setCustomPoints(result.points);
      }

      // If polygon was extracted, update active AOI
      if (result.polygons && result.polygons.length > 0) {
        setActiveAOIPolygon(result.polygons[0]);
      }

      // Fly map to the center of loaded data if bounds exist
      if (result.summary.bounds) {
        const [[minLng, minLat], [maxLng, maxLat]] = result.summary.bounds;
        flyToLocation({
          lng: (minLng + maxLng) / 2,
          lat: (minLat + maxLat) / 2,
          zoom: 9,
          pitch: 50,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro desconhecido ao processar arquivo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSampleCSV = () => {
    const csvContent = exportToCSV([]);
    downloadFile(csvContent, "modelo_amostra_pontos_erosao.csv", "text/csv;charset=utf-8;");
  };

  return (
    <div className="space-y-4">

      {/* Dropzone */}
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
            ? "border-emerald-500 bg-emerald-500/10"
            : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900/40"
        }`}
      >
        <input
          type="file"
          id="vector-file-input"
          accept=".csv,.geojson,.json,.kml,.kmz"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          className="hidden"
        />
        {loading ? (
          <div className="py-4 space-y-2">
            <RefreshCw className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-700 dark:text-slate-300">Processando e validando geometrias...</p>
          </div>
        ) : (
          <>
            <UploadCloud className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Arraste arquivos <span className="text-emerald-600 dark:text-emerald-400">GeoJSON, KML, KMZ ou CSV</span>
            </p>
            <p className="text-[11px] text-slate-500 mb-3">
              Detecção automática de colunas <code className="text-slate-600 dark:text-slate-400 font-mono">lat/lng</code> e
              polígonos de bacias / AOI.
            </p>
            <label
              htmlFor="vector-file-input"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Selecionar Arquivo do Computador
            </label>
          </>
        )}
      </div>

      {/* Sample Download Button */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span className="flex items-center gap-1 text-[11px]">
          <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          Precisa de um modelo compatível?
        </span>
        <button
          onClick={handleDownloadSampleCSV}
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
        >
          <Download className="w-3 h-3" />
          Baixar Modelo CSV Exemplo
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Falha na ingestão dos dados:</span>
            {errorMsg}
          </div>
        </div>
      )}

      {/* Preview Table of Ingested Data */}
      {previewResult && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Dados Ingeridos com Sucesso</h4>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30">
              {previewResult.summary.totalFeatures} feições
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-850">
              <span className="text-[10px] text-slate-500 block">Tipo Geométrico:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {previewResult.summary.geometryType} (EPSG:4326 WGS84)
              </span>
            </div>
            <div className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-850">
              <span className="text-[10px] text-slate-500 block">Colunas / Atributos:</span>
              <span className="text-slate-700 dark:text-slate-300 truncate block font-mono text-[11px]">
                {previewResult.summary.detectedColumns.slice(0, 4).join(", ")}...
              </span>
            </div>
          </div>

          {!!previewResult.summary.pointsOutsideParana && previewResult.summary.pointsOutsideParana > 0 && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                {previewResult.summary.pointsOutsideParana} de {previewResult.summary.totalFeatures} ponto(s) caem fora
                do limite territorial do Paraná — a importação prosseguiu normalmente, mas confira se as coordenadas
                estão corretas (o app também aceita dados de outros estados via Configurações → Regiões).
              </span>
            </div>
          )}

          {previewResult.points && previewResult.points.length > 0 && (
            <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-mono custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 sticky top-0">
                  <tr>
                    <th className="p-2">ID</th>
                    <th className="p-2">Município</th>
                    <th className="p-2">Lat</th>
                    <th className="p-2">Lng</th>
                    <th className="p-2">Decliv (%)</th>
                    <th className="p-2">BSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-850 text-slate-800 dark:text-slate-300">
                  {previewResult.points.slice(0, 5).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-850/50">
                      <td className="p-2 font-bold text-emerald-600 dark:text-emerald-400">{p.id}</td>
                      <td className="p-2">{p.municipality}</td>
                      <td className="p-2">{p.latitude.toFixed(4)}</td>
                      <td className="p-2">{p.longitude.toFixed(4)}</td>
                      <td className="p-2 text-amber-600 dark:text-amber-400">{p.slopePercent}%</td>
                      <td className="p-2 text-rose-600 dark:text-rose-400">{p.bsi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
