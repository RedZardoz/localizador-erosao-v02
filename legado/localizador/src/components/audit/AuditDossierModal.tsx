"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Printer,
  Satellite,
  Layers,
  TrendingUp,
  Mountain,
  Compass,
  FileCheck2,
  Copy,
  Check,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Building2,
  ShieldCheck,
  User,
  Hash,
  Edit3,
  Save,
  Info,
} from "lucide-react";
import { useErosionStore } from "@/lib/store/useErosionStore";
import { formatToDMS, getGoogleEarthWebUrl, getGoogleMapsUrl } from "@/lib/utils/geoUtils";
import { generateAuditPdf } from "@/lib/pdf/auditPdfGenerator";
import { ErosionPoint } from "@/types/erosion";
import { RuralPropertyMatch } from "@/lib/fundiario/spatialMatcher";

export const AuditDossierModal: React.FC = () => {
  const { activeModal, closeAuditDossier, auditDossierPoint, allPoints, updatePointWithRealData } = useErosionStore();
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [localFundiario, setLocalFundiario] = useState<RuralPropertyMatch | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Edição manual dos dados fundiários no Dossiê
  const [editingTenure, setEditingTenure] = useState(false);
  const [editOwner, setEditOwner] = useState("");
  const [editProperty, setEditProperty] = useState("");
  const [editDoc, setEditDoc] = useState("");
  const [editIncra, setEditIncra] = useState("");

  const rawPoint = auditDossierPoint;
  const storePoint = allPoints.find((p) => p.id === rawPoint?.id);
  const point: ErosionPoint | null = rawPoint
    ? {
        ...rawPoint,
        ...(storePoint || {}),
        ...(localFundiario
          ? {
              carCode: localFundiario.carCode,
              propertyName: localFundiario.propertyName,
              ownerName: localFundiario.ownerName,
              incraRegistry: localFundiario.incraRegistry,
              propertyAreaHa: localFundiario.propertyAreaHa,
              ownerDocumentMasked: localFundiario.ownerDocumentMasked,
              tenureStatus: localFundiario.status,
              tenureUf: localFundiario.uf,
              tenureQueryDate: localFundiario.dataConsulta,
              tenureAssociationCriterion: localFundiario.criterioAssociacao,
              sicarSourceFile: localFundiario.sicarArquivoOrigem,
              sicarBaseDate: localFundiario.sicarDataBase,
              sigefSourceFile: localFundiario.sigefArquivoOrigem,
              sigefBaseDate: localFundiario.sigefDataBase,
              sncrSourceFile: localFundiario.sncrArquivoOrigem,
              sncrBaseDate: localFundiario.sncrDataBase,
            }
          : {}),
      }
    : null;

  const handleSaveTenure = () => {
    if (!point) return;
    const patch: Partial<ErosionPoint> = {
      ownerName: editOwner.trim() || undefined,
      propertyName: editProperty.trim() || undefined,
      ownerDocumentMasked: editDoc.trim() || undefined,
      incraRegistry: editIncra.trim() || undefined,
    };
    updatePointWithRealData(point.id, patch);
    setLocalFundiario((prev) => ({ ...prev, ...patch }));
    setEditingTenure(false);
  };

  const isOwnerLocated = Boolean(
    point?.ownerName &&
    !point.ownerName.includes("Declarado no CAR") &&
    !point.ownerName.includes("Protegido") &&
    !point.ownerName.includes("Não Informado") &&
    !point.ownerName.includes("Não Identificado") &&
    !point.ownerName.includes("Titular Certificado no SIGEF/INCRA (ART")
  );

  useEffect(() => {
    let isMounted = true;
    if (point && !point.propertyName && !point.carCode) {
      fetch("/api/fundiario/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: point.latitude,
          longitude: point.longitude,
          uf: point.state,
        }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (isMounted && json.success && json.data) {
            const d = json.data;
            setLocalFundiario(d);
            updatePointWithRealData(point.id, {
              carCode: d.carCode,
              propertyName: d.propertyName,
              ownerName: d.ownerName,
              incraRegistry: d.incraRegistry,
              propertyAreaHa: d.propertyAreaHa,
              ownerDocumentMasked: d.ownerDocumentMasked,
              tenureStatus: d.status,
              tenureUf: d.uf,
              tenureQueryDate: d.dataConsulta,
              tenureAssociationCriterion: d.criterioAssociacao,
              sicarSourceFile: d.sicarArquivoOrigem,
              sicarBaseDate: d.sicarDataBase,
              sigefSourceFile: d.sigefArquivoOrigem,
              sigefBaseDate: d.sigefDataBase,
              sncrSourceFile: d.sncrArquivoOrigem,
              sncrBaseDate: d.sncrDataBase,
            });
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [point?.id, point?.latitude, point?.longitude, point?.propertyName, point?.carCode, updatePointWithRealData]);

  if (activeModal !== "audit-dossier" || !point) {
    return null;
  }

  const dmsLat = formatToDMS(point.latitude, true);
  const dmsLng = formatToDMS(point.longitude, false);

  const rVal = point.rusleFactors?.r ?? 7850;
  const kVal = point.rusleFactors?.k ?? 0.035;
  const lsVal = point.rusleFactors?.ls ?? 3.4;
  const cVal = point.rusleFactors?.c ?? 0.28;
  const pVal = point.rusleFactors?.p ?? 1.0;

  const geeScript = `// =======================================================================
// SCRIPT DE REVALIDAÇÃO CIENTÍFICA INDEPENDENTE - PPGTCA 2026
// Ponto Amostral: ${point.code} (${point.municipality} - ${point.state || "PR"})
// Coordenadas WGS84: ${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}
// =======================================================================

var ponto = ee.Geometry.Point([${point.longitude}, ${point.latitude}]);
Map.centerObject(ponto, 17);
Map.addLayer(ponto, {color: 'red'}, 'Ponto ${point.code}');

// 1. Coleção Sentinel-2 Harmonized L2A (Refletância de Superfície BOA)
var s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterBounds(ponto)
  .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 40))
  .sort("CLOUDY_PIXEL_PERCENTAGE")
  .first();

// 2. Extração de Índices Biofísicos a 10m
// BSI: ((B12 + B4) - (B8 + B2)) / ((B12 + B4) + (B8 + B2))
var bsi = s2.expression(
  "((SWIR2 + RED) - (NIR + BLUE)) / ((SWIR2 + RED) + (NIR + BLUE))",
  {
    SWIR2: s2.select("B12"),
    RED: s2.select("B4"),
    NIR: s2.select("B8"),
    BLUE: s2.select("B2")
  }
).rename("BSI");

// NDVI: (B8 - B4) / (B8 + B4)
var ndvi = s2.normalizedDifference(["B8", "B4"]).rename("NDVI");

// 3. Topografia Copernicus DEM GLO-30 reprojetado em projeção métrica EPSG:3857
var dem = ee.ImageCollection("COPERNICUS/DEM/GLO30")
  .select("DEM")
  .mosaic()
  .setDefaultProjection("EPSG:3857", null, 30);
var declividadeDeg = ee.Terrain.slope(dem);

// 4. Amostragem Pontual
var amostra = ee.Image.cat([bsi, ndvi, dem.rename("ELEV"), declividadeDeg.rename("SLOPE_DEG")])
  .reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: ponto,
    scale: 10
  });

print("=== RESULTADOS DA AUDITORIA PARA O PONTO ${point.code} ===");
print("Metadados da Cena Sentinel-2:", s2.get("PRODUCT_ID"), s2.get("system:time_start"));
print("Valores Amostrados:", amostra);
Map.addLayer(s2, {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000}, 'Sentinel-2 RGB');
Map.addLayer(bsi, {min: -0.2, max: 0.5, palette: ['blue', 'yellow', 'orange', 'red']}, 'BSI (Solo Exposto)');
`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(geeScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2500);
  };

  const handleDownloadPdf = () => {
    setPdfError(null);
    try {
      generateAuditPdf(point);
    } catch (err: any) {
      setPdfError(err?.message || "Erro ao emitir laudo pericial em PDF.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 dark:bg-slate-950/85 backdrop-blur-md animate-in fade-in transition-colors overflow-y-auto printable-modal">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col my-auto printable-modal-content">
        {pdfError && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl flex items-center justify-between text-xs text-rose-800 dark:text-rose-200 no-print">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{pdfError}</span>
            </div>
            <button
              onClick={() => setPdfError(null)}
              className="text-rose-600 hover:text-rose-800 dark:hover:text-rose-100 font-bold ml-2 text-xs"
            >
              Fechar
            </button>
          </div>
        )}
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Dossiê &amp; Laudo de Auditoria Científica
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {point.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA - 2026)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 no-print">
            <button
              onClick={handlePrint}
              title="Imprimir laudo ou salvar via caixa de diálogo do navegador"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              title="Gerar e baixar arquivo PDF completo com o laudo de auditoria"
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Laudo PDF</span>
            </button>

            <button
              onClick={closeAuditDossier}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Fechar Dossiê"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-slate-800 dark:text-slate-200 printable-modal-body">
          {/* Identificação Geral e Resumo Executivo */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 print-avoid-break">
            <div className="md:col-span-2 space-y-1.5">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Alvo Georreferenciado
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{point.name || `Ponto ${point.code}`}</span>
                <span className="text-slate-400 font-normal">•</span>
                <span className="font-normal text-slate-600 dark:text-slate-300">
                  {point.municipality} — {point.state || "PR"} ({point.watershed})
                </span>
              </div>
              <div className="text-xs font-mono text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-2 pt-0.5">
                <span>
                  WGS84: {point.latitude.toFixed(6)}°, {point.longitude.toFixed(6)}°
                </span>
                <button
                  onClick={handleCopyCoords}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  title="Copiar coordenadas decimais"
                >
                  {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span>
                  DMS: {dmsLat}, {dmsLng}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-1">
                <span>Altitude: <b className="text-slate-700 dark:text-slate-300">{point.elevation} m</b></span>
                <span>•</span>
                <span>Solo: <b className="text-slate-700 dark:text-slate-300">{point.soilType}</b></span>
                <span>•</span>
                <span>
                  Motor: <b className="text-slate-700 dark:text-slate-300">{point.calcEngineVersion || "2026.1-metric"}</b>
                </span>
              </div>
            </div>

            {/* Badges de Resultado */}
            <div className="flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-3 md:pt-0 md:pl-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Severidade:</span>
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-lg border ${
                    point.severity === "Crítica"
                      ? "bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/40"
                      : point.severity === "Alta"
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40"
                      : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/40"
                  }`}
                >
                  {point.severity}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Perda Estimada:</span>
                <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                  {point.estimatedSoilLoss} t/ha·ano
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Score de Prioridade:</span>
                <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {point.priorityScore} / 100
                </span>
              </div>
            </div>
          </div>

          {/* Identificação Fundiária & Cadastro Rural (CAR / SICAR / SNCR) */}
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-800/80 space-y-3 print-avoid-break">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Identificação Fundiária &amp; Cadastro Ambiental Rural (CAR/SICAR - SNCR)
              </h3>
              <div className="flex items-center gap-2">
                {!isOwnerLocated && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingTenure && point) {
                        setEditOwner(point.ownerName || "");
                        setEditProperty(point.propertyName || "");
                        setEditDoc(point.ownerDocumentMasked || "");
                        setEditIncra(point.incraRegistry || "");
                      }
                      setEditingTenure(!editingTenure);
                    }}
                    className="no-print text-[10px] font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/70 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Titular não localizado no SNCR - Informar manualmente"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>{editingTenure ? "Cancelar" : "Informar Titular"}</span>
                  </button>
                )}
                {isOwnerLocated && (
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/80 rounded border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                    Titular Oficial (SNCR / INCRA)
                  </span>
                )}
              </div>
            </div>

            {editingTenure ? (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-400 dark:border-emerald-600 space-y-2.5 shadow-sm animate-in fade-in duration-150">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Editar Informações do Produtor / Imóvel no Laudo</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-semibold block">Nome do Titular / Produtor Rural:</label>
                    <input
                      type="text"
                      value={editOwner}
                      onChange={(e) => setEditOwner(e.target.value)}
                      placeholder="Ex: João Carlos Fontana / Agropecuária Moreira Sales"
                      className="w-full text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-semibold block">Denominação do Imóvel / Fazenda:</label>
                    <input
                      type="text"
                      value={editProperty}
                      onChange={(e) => setEditProperty(e.target.value)}
                      placeholder="Ex: Fazenda Boa Esperança / Lote 07"
                      className="w-full text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-semibold block">Doc (CPF/CNPJ):</label>
                    <input
                      type="text"
                      value={editDoc}
                      onChange={(e) => setEditDoc(e.target.value)}
                      placeholder="Ex: 000.000.000-00"
                      className="w-full text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-semibold block">SNCR / Matrícula CRI:</label>
                    <input
                      type="text"
                      value={editIncra}
                      onChange={(e) => setEditIncra(e.target.value)}
                      placeholder="Ex: Matrícula 36868 CRI"
                      className="w-full text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingTenure(false)}
                    className="px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTenure}
                    className="px-4 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar no Laudo</span>
                  </button>
                </div>
              </div>
            ) : point.tenureStatus === "base-nao-disponivel" ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Base territorial não disponível para {point.state || "esta UF"}</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  A base SQLite local possui apenas dados oficiais de PR, SC e SP. Para consultar esta UF, ingira a base oficial do SICAR/SNCR via ingest_data.py.
                </p>
              </div>
            ) : point.tenureStatus === "sem-correspondencia" ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <Info className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Nenhum imóvel rural cadastrado sobreposto</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Nenhum imóvel rural cadastrado nas bases oficiais do SICAR/SIGEF sobrepõe esta coordenada (área pública, não demarcada ou fora da base consultada).
                </p>
              </div>
            ) : point.propertyName || point.carCode || point.ownerName ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1 mb-1">
                        <Building2 className="w-3 h-3 text-emerald-500" />
                        Denominação do Imóvel
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs break-words leading-snug" title={point.propertyName}>
                        {point.propertyName || "Denominação não consta na base pública consultada"}
                      </div>
                    </div>
                    {point.municipality && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        {point.municipality} - {point.state || "PR"}
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1 mb-1">
                        <ShieldCheck className="w-3 h-3 text-cyan-500" />
                        Código SICAR (CAR)
                      </div>
                      <div className="font-mono font-bold text-cyan-700 dark:text-cyan-300 text-[11px] break-all leading-tight" title={point.carCode}>
                        {point.carCode || "Não localizado"}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                      Base Oficial SICAR / MMA
                    </div>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between gap-1 mb-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-indigo-500" />
                          Titular / Proprietário
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditOwner(point.ownerName || "");
                            setEditProperty(point.propertyName || "");
                            setEditDoc(point.ownerDocumentMasked || "");
                            setEditIncra(point.incraRegistry || "");
                            setEditingTenure(true);
                          }}
                          className="text-[9px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 no-print cursor-pointer"
                          title="Editar ou completar nome do titular"
                        >
                          <Edit3 className="w-2.5 h-2.5" /> Editar
                        </button>
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-white text-xs break-words leading-snug" title={point.ownerName}>
                        {point.ownerName || "Titular não consta na base pública consultada (CAR/SICAR e SIGEF não publicam identidade do proprietário)"}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                      Máscara oficial SNCR/INCRA mantida (LGPD)
                    </div>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1 mb-1">
                        <Hash className="w-3 h-3 text-amber-500" />
                        SNCR / Cartório (CRI)
                      </div>
                      <div className="font-mono font-semibold text-slate-900 dark:text-white text-[11px] break-words leading-tight">
                        {point.incraRegistry || "Não localizado"}
                      </div>
                    </div>
                    {point.propertyAreaHa !== undefined && (
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        Área: {point.propertyAreaHa} hectares
                      </div>
                    )}
                  </div>
                </div>

                {/* Cadeia de Consulta e Rastreabilidade */}
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Cadeia de Consulta Oficial:
                  </div>
                  <div className="text-[11px]"><b>Critério de Associação:</b> {point.tenureAssociationCriterion || "Contenção topológica estrita (Shapely)"}</div>
                  <div className="text-[11px]"><b>Data da Consulta:</b> {point.tenureQueryDate || new Date().toLocaleDateString("pt-BR")}</div>
                  <div className="text-[11px]"><b>SICAR:</b> {point.sicarSourceFile || "AREA_IMOVEL"} ({point.sicarBaseDate || "2026"}) | <b>SIGEF:</b> {point.sigefSourceFile || "Sigef Brasil"} | <b>SNCR:</b> {point.sncrSourceFile || "SNCR"}</div>
                </div>

                {/* Nota de conformidade LGPD */}
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed italic border-t border-slate-200 dark:border-slate-800 pt-2">
                  <b>Proteção de dados pessoais:</b> O nome do titular é reproduzido exatamente na forma mascarada (pseudonimização) em que é publicado pelo Sistema Nacional de Cadastro Rural (SNCR/INCRA), sem qualquer tentativa de reversão, complementação ou cruzamento com outras bases para reidentificação. O número de CPF/CNPJ não é divulgado. O tratamento observa a Lei nº 13.709/2018 (LGPD), art. 7º, IV, que autoriza o tratamento de dados pessoais para a realização de estudos por órgão de pesquisa. O acesso à base é restrito à execução local desta aplicação.
                </p>
              </div>
            ) : (
              <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-dashed border-slate-300 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 italic">
                Coordenada localizada fora de perímetro cadastrado no SICAR/SIGEF
              </div>
            )}
          </div>

          {/* Linha do Tempo / Sequência Metodológica */}
          <div className="space-y-4">
            {/* ETAPA 1 */}
            <div className="p-4 bg-white dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 print-avoid-break">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800 flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Satellite className="w-4 h-4 text-cyan-500" />
                    Aquisição e Rastreabilidade Sentinel-2 (Copernicus L2A BOA)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                  Resolução 10m
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                A imagem multiespectral utilizada para a caracterização espectral do ponto provém da constelação
                Sentinel-2 da Agência Espacial Europeia (ESA), processada no nível <b>Bottom-Of-Atmosphere (BOA)</b> com
                correção atmosférica via algoritmo Sen2Cor.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-900/90 p-3 rounded-lg border border-slate-200 dark:border-slate-800/80">
                <div>
                  <span className="text-slate-400 text-[11px] block">Coleção Oficial GEE:</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    COPERNICUS/S2_SR_HARMONIZED
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Identificador Oficial da Cena (PRODUCT_ID):</span>
                  <span className="font-mono font-semibold text-cyan-700 dark:text-cyan-300 break-all">
                    {point.geeSourceImageId || "Sentinel-2 MSI (S2_SR_HARMONIZED)"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Data de Amostragem / Cálculo:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {point.geeComputedAt ? new Date(point.geeComputedAt).toLocaleString("pt-BR") : "Recém-processado"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Controle de Qualidade Atmosférica:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Máscara SCL ativa (sem nuvens ou sombras no pixel)
                  </span>
                </div>
              </div>
            </div>

            {/* ETAPA 2 */}
            <div className="p-4 bg-white dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 print-avoid-break">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-rose-500" />
                    Assinatura Espectral e Índices Biofísicos Amostrados
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-semibold">
                  Bandas B12, B8, B4, B2
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* BSI */}
                <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                      Bare Soil Index (BSI) — Solo Exposto
                    </span>
                    <span className="text-sm font-bold font-mono text-rose-700 dark:text-rose-400">
                      {point.bsi > 0 ? `+${point.bsi}` : point.bsi}
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-rose-200 dark:border-rose-900 font-mono text-[11px] text-center text-slate-800 dark:text-slate-200">
                    BSI = ((B12 + B4) - (B8 + B2)) / ((B12 + B4) + (B8 + B2))
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Combina o infravermelho de ondas curtas (B12 a 2190nm) e vermelho (B4 a 665nm) contra o NIR (B8) e
                    azul (B2). Valores positivos indicam <b>forte exposição de solo mineral</b> desprovido de palhada.
                  </p>
                </div>

                {/* NDVI */}
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Normalized Difference Veg. Index (NDVI)
                    </span>
                    <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
                      {point.ndvi}
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-900 font-mono text-[11px] text-center text-slate-800 dark:text-slate-200">
                    NDVI = (B8 - B4) / (B8 + B4)
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Mede o vigor fotossintético através do contraste entre a alta refletância no infravermelho próximo (B8)
                    e absorção no vermelho (B4). O valor de <b>{point.ndvi}</b> atesta ausência de vegetação densa.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-900/70 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <b>Congruência Espectral Validada:</b> A combinação de BSI elevado ({point.bsi}) e NDVI reduzido ({point.ndvi}) comprova empiricamente a condição de solo desprotegido, suscetível à desagregação por impacto direto de gotas de chuva (efeito splash).
                </span>
              </div>
            </div>

            {/* ETAPA 3 */}
            <div className="p-4 bg-white dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 print-avoid-break">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    Geometria Topográfica e Hidrologia (Copernicus DEM GLO-30)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                  EPSG:3857 Métrico
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Altitude DEM</span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                    {point.elevation} m
                  </span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Declividade (%)</span>
                  <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                    {point.slopePercent}%
                  </span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Declividade (°)</span>
                  <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                    {point.slopeDegrees}°
                  </span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Fator Topográfico (LS)</span>
                  <span className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                    {lsVal}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                <b>Correção Geodésica:</b> O cálculo do gradiente altimétrico é executado em projeção conforme métrica
                (Web Mercator EPSG:3857) a 10 metros, eliminando a distorção gerada por razões entre metros de elevação e
                graus decimais de coordenadas geográficas. A área de contribuição a montante (As) é obtida via HydroSHEDS 15ACC.
              </p>
            </div>

            {/* ETAPA 4 */}
            <div className="p-4 bg-white dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 print-avoid-break">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-800 flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Mountain className="w-4 h-4 text-indigo-500" />
                    Parâmetros Climatológicos e Pedológicos
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                  NASA POWER &amp; SoilGrids
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    Fator R — Erosividade da Chuva: <b className="font-mono text-indigo-600 dark:text-indigo-400">{rVal}</b>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Unidade: MJ·mm·ha⁻¹·h⁻¹·ano⁻¹. Derivado da série climatológica MERRA-2 (NASA POWER) utilizando a
                    equação empírica regional de Lombardi Neto &amp; Moldenhauer.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    Fator K — Erodibilidade do Solo: <b className="font-mono text-cyan-600 dark:text-cyan-400">{kVal}</b>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Unidade: t·ha·h·ha⁻¹·MJ⁻¹·mm⁻¹. Mapeamento pedológico para a classe <b>{point.soilType}</b>, calibrado
                    pelo teor de frações granulométricas (areia, silte, argila) e matéria orgânica.
                  </p>
                </div>
              </div>
            </div>

            {/* ETAPA 5 */}
            <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-300 dark:border-emerald-800/80 shadow-sm space-y-3 print-avoid-break">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center justify-center text-xs font-bold">
                    5
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Modelagem da Equação Universal de Perda de Solo (RUSLE)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {point.estimatedSoilLoss} t/ha·ano
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 font-mono text-center space-y-1">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  A = R · K · LS · C · P
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  A = ({rVal}) × ({kVal}) × ({lsVal}) × ({cVal}) × ({pVal}) ={" "}
                  <b className="text-emerald-600 dark:text-emerald-400">{point.estimatedSoilLoss} t·ha⁻¹·ano⁻¹</b>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1 text-center font-mono text-xs">
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">R (Chuva)</span>
                  <span className="font-bold">{rVal}</span>
                </div>
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">K (Solo)</span>
                  <span className="font-bold">{kVal}</span>
                </div>
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">LS (Relevo)</span>
                  <span className="font-bold">{lsVal}</span>
                </div>
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">C (Manejo)</span>
                  <span className="font-bold">{cVal}</span>
                </div>
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">P (Práticas)</span>
                  <span className="font-bold">{pVal}</span>
                </div>
              </div>
            </div>

            {/* ETAPA 6 */}
            <div className="p-4 bg-white dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 print-avoid-break">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center text-xs font-bold">
                    6
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-emerald-500" />
                    Roteiro e Script de Revalidação Científica Independente
                  </h3>
                </div>

                <button
                  onClick={handleCopyScript}
                  className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar Script GEE
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Qualquer pesquisador ou revisor técnico pode reproduzir os valores espectrais e topográficos deste ponto.
                Basta copiar o script abaixo e colá-lo no{" "}
                <a
                  href="https://code.earthengine.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 dark:text-cyan-400 underline font-semibold"
                >
                  Google Earth Engine Code Editor
                </a>
                :
              </p>

              <div className="relative">
                <pre className="p-3.5 bg-slate-950 text-emerald-400 text-[11px] font-mono rounded-xl overflow-x-auto max-h-56 custom-scrollbar leading-relaxed border border-slate-800">
                  {geeScript}
                </pre>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <a
                  href={getGoogleEarthWebUrl(point.latitude, point.longitude, point.elevation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Conferir no Google Earth 3D Web
                </a>
                <span className="text-slate-400">•</span>
                <a
                  href={getGoogleMapsUrl(point.latitude, point.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Visualizar no Google Maps Satélite
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 text-xs no-print">
          <span className="text-slate-500 dark:text-slate-400 hidden sm:inline text-[11px]">
            Laudo para validação acadêmica e decisões agronômicas de manejo de solo.
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={closeAuditDossier}
              className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Fechar
            </button>

            <button
              onClick={handleDownloadPdf}
              className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Baixar PDF (.pdf)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
