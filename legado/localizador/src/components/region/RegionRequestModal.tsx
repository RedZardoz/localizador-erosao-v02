"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Globe,
  UploadCloud,
  FilePlus,
  Send,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Mountain,
  PlusCircle,
  Layers,
  Sparkles,
  Landmark,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useErosionStore } from "@/lib/store/useErosionStore";
import { regionPresets } from "@/data/regionsData";
import { AOIPolygon, NewRegionRequest } from "@/types/erosion";
import { parseGeoJSON, parseKML } from "@/lib/utils/parsers";
import {
  IbgeEstado,
  IbgeMunicipio,
  boundaryBBox,
  fetchEstadoBoundary,
  fetchEstados,
  fetchMunicipioBoundary,
  fetchMunicipios,
} from "@/lib/api/ibgeClient";

export const RegionRequestModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    activeRegion,
    setActiveRegion,
    activeAOIPolygon,
    setActiveAOIPolygon,
    regionRequests,
    addRegionRequest,
    flyToLocation,
  } = useErosionStore();

  const [tab, setTab] = useState<"boundary" | "presets" | "upload-aoi" | "new-request">("boundary");

  // Estado / Município (limite territorial oficial via IBGE)
  const [boundaryMode, setBoundaryMode] = useState<"estado" | "municipio">("estado");
  const [estados, setEstados] = useState<IbgeEstado[]>([]);
  const [municipios, setMunicipios] = useState<IbgeMunicipio[]>([]);
  const [selectedEstadoSigla, setSelectedEstadoSigla] = useState("");
  const [selectedMunicipioId, setSelectedMunicipioId] = useState<number | "">("");
  const [loadingEstados, setLoadingEstados] = useState(false);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [loadingBoundary, setLoadingBoundary] = useState(false);
  const [boundaryError, setBoundaryError] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== "boundary" || estados.length > 0) return;
    setLoadingEstados(true);
    fetchEstados()
      .then(setEstados)
      .catch((err) => setBoundaryError(err.message))
      .finally(() => setLoadingEstados(false));
  }, [tab, estados.length]);

  useEffect(() => {
    if (!selectedEstadoSigla) {
      setMunicipios([]);
      return;
    }
    setLoadingMunicipios(true);
    setSelectedMunicipioId("");
    fetchMunicipios(selectedEstadoSigla)
      .then(setMunicipios)
      .catch((err) => setBoundaryError(err.message))
      .finally(() => setLoadingMunicipios(false));
  }, [selectedEstadoSigla]);

  const handleApplyEstadoBoundary = async () => {
    const estado = estados.find((e) => e.sigla === selectedEstadoSigla);
    if (!estado) return;

    setBoundaryError(null);
    setLoadingBoundary(true);
    try {
      const geometry = await fetchEstadoBoundary(estado.id);
      const polygon: AOIPolygon = {
        id: `IBGE-UF-${estado.sigla}`,
        name: `${estado.nome} (${estado.sigla}) — limite oficial IBGE`,
        fileName: "IBGE malhas territoriais",
        geometry,
        importedAt: new Date().toISOString(),
      };
      setActiveAOIPolygon(polygon);

      const [[minLng, minLat], [maxLng, maxLat]] = boundaryBBox(geometry);
      flyToLocation({ lng: (minLng + maxLng) / 2, lat: (minLat + maxLat) / 2, zoom: 6.5, pitch: 40 });

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setActiveModal(null);
    } catch (err: any) {
      setBoundaryError(err.message || "Falha ao carregar o limite do estado.");
    } finally {
      setLoadingBoundary(false);
    }
  };

  const handleApplyMunicipioBoundary = async () => {
    if (selectedMunicipioId === "") return;
    const municipio = municipios.find((m) => m.id === selectedMunicipioId);
    if (!municipio) return;

    setBoundaryError(null);
    setLoadingBoundary(true);
    try {
      const geometry = await fetchMunicipioBoundary(municipio.id);
      const polygon: AOIPolygon = {
        id: `IBGE-MUN-${municipio.id}`,
        name: `${municipio.nome} (${selectedEstadoSigla}) — limite oficial IBGE`,
        fileName: "IBGE malhas territoriais",
        geometry,
        importedAt: new Date().toISOString(),
      };
      setActiveAOIPolygon(polygon);

      const [[minLng, minLat], [maxLng, maxLat]] = boundaryBBox(geometry);
      flyToLocation({ lng: (minLng + maxLng) / 2, lat: (minLat + maxLat) / 2, zoom: 10, pitch: 50 });

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setActiveModal(null);
    } catch (err: any) {
      setBoundaryError(err.message || "Falha ao carregar o limite do município.");
    } finally {
      setLoadingBoundary(false);
    }
  };

  // Form State for new region request
  const [formData, setFormData] = useState({
    regionName: "",
    stateOrCountry: "PR",
    reason: "",
    requesterEmail: "",
    sensorPreference: "Sentinel-2" as const,
    minLat: -25.5,
    maxLat: -24.5,
    minLng: -52.0,
    maxLng: -50.0,
  });

  const [aoiDragOver, setAoiDragOver] = useState(false);
  const [aoiError, setAoiError] = useState<string | null>(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  if (activeModal !== "region") return null;

  const handleAOIUpload = async (file: File) => {
    setAoiError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();

    try {
      let result;
      if (ext === "geojson" || ext === "json") {
        const text = await file.text();
        result = parseGeoJSON(text, file.name);
      } else if (ext === "kml") {
        const text = await file.text();
        result = parseKML(text, file.name);
      } else {
        throw new Error("Envie um polígono em formato .geojson ou .kml.");
      }

      if (!result.polygons || result.polygons.length === 0) {
        throw new Error(
          "Nenhum polígono (Polygon/MultiPolygon) foi encontrado no arquivo enviado. Verifique a geometria."
        );
      }

      const polygon = result.polygons[0];
      setActiveAOIPolygon(polygon);

      if (result.summary.bounds) {
        const [[minLng, minLat], [maxLng, maxLat]] = result.summary.bounds;
        flyToLocation({
          lng: (minLng + maxLng) / 2,
          lat: (minLat + maxLat) / 2,
          zoom: 10,
          pitch: 50,
        });
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (err: any) {
      setAoiError(err.message || "Falha ao importar polígono de área de interesse.");
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.regionName || !formData.requesterEmail || !formData.reason) {
      return;
    }

    const newRequest: NewRegionRequest = {
      id: `REQ-${Date.now()}`,
      regionName: formData.regionName,
      stateOrCountry: formData.stateOrCountry,
      reason: formData.reason,
      requesterEmail: formData.requesterEmail,
      dateRange: { start: "2025-01-01", end: "2026-08-25" },
      sensorPreference: formData.sensorPreference,
      coordinatesBbox: {
        minLat: formData.minLat,
        maxLat: formData.maxLat,
        minLng: formData.minLng,
        maxLng: formData.maxLng,
      },
      status: "Processando GEE",
      createdAt: new Date().toISOString(),
    };

    addRegionRequest(newRequest);
    setRequestSubmitted(true);
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });

    // Reset after delay
    setTimeout(() => {
      setRequestSubmitted(false);
      setFormData({
        regionName: "",
        stateOrCountry: "PR",
        reason: "",
        requesterEmail: "",
        sensorPreference: "Sentinel-2",
        minLat: -25.5,
        maxLat: -24.5,
        minLng: -52.0,
        maxLng: -50.0,
      });
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in transition-colors">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-600 dark:text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Seleção de Regiões & Área de Interesse (AOI)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Delimite por estado, município, polígono próprio ou regiões predefinidas em todo o Brasil
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

        {/* Tabs */}
        <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 px-4 pt-2 gap-2">
          <button
            onClick={() => setTab("boundary")}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              tab === "boundary"
                ? "border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Landmark className="w-4 h-4" />
            Estado / Município
          </button>

          <button
            onClick={() => setTab("presets")}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              tab === "presets"
                ? "border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Globe className="w-4 h-4" />
            Regiões Predefinidas
          </button>

          <button
            onClick={() => setTab("upload-aoi")}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              tab === "upload-aoi"
                ? "border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Subir Polígono (AOI)
          </button>

          <button
            onClick={() => setTab("new-request")}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              tab === "new-request"
                ? "border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Adicionar Pedido de Região
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          {/* TAB 0: ESTADO / MUNICÍPIO (limite oficial via IBGE) */}
          {tab === "boundary" && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-3 transition-colors">
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-600 dark:text-cyan-400 shrink-0">
                  <Landmark className="w-5 h-5" />
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">Limite Territorial Oficial (IBGE)</h4>
                  <p className="text-slate-500 dark:text-slate-400">
                    Escolha um estado ou município brasileiro — o limite geográfico oficial (malha territorial do
                    IBGE) é usado para recortar quais focos entram na triagem, da mesma forma que um polígono próprio.
                  </p>
                </div>
              </div>

              {/* Estado vs Município toggle */}
              <div className="grid grid-cols-2 gap-1 bg-slate-200/70 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setBoundaryMode("estado")}
                  className={`py-1.5 rounded-md text-xs font-semibold transition-all ${
                    boundaryMode === "estado"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Por Estado
                </button>
                <button
                  onClick={() => setBoundaryMode("municipio")}
                  className={`py-1.5 rounded-md text-xs font-semibold transition-all ${
                    boundaryMode === "municipio"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Por Município
                </button>
              </div>

              {/* Estado select (usado nos dois modos) */}
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Estado (UF)</label>
                <div className="relative">
                  <select
                    value={selectedEstadoSigla}
                    onChange={(e) => setSelectedEstadoSigla(e.target.value)}
                    disabled={loadingEstados}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg p-2.5 pr-8 appearance-none focus:outline-none focus:border-cyan-500 cursor-pointer disabled:opacity-50"
                  >
                    <option value="">{loadingEstados ? "Carregando estados..." : "Selecione um estado"}</option>
                    {estados.map((e) => (
                      <option key={e.sigla} value={e.sigla}>
                        {e.nome} ({e.sigla})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {boundaryMode === "estado" ? (
                <button
                  onClick={handleApplyEstadoBoundary}
                  disabled={!selectedEstadoSigla || loadingBoundary}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-600/20"
                >
                  {loadingBoundary ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Landmark className="w-4 h-4" />
                  )}
                  Usar limite do estado selecionado
                </button>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Município</label>
                    <div className="relative">
                      <select
                        value={selectedMunicipioId}
                        onChange={(e) => setSelectedMunicipioId(e.target.value ? Number(e.target.value) : "")}
                        disabled={!selectedEstadoSigla || loadingMunicipios}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg p-2.5 pr-8 appearance-none focus:outline-none focus:border-cyan-500 cursor-pointer disabled:opacity-50"
                      >
                        <option value="">
                          {!selectedEstadoSigla
                            ? "Selecione um estado primeiro"
                            : loadingMunicipios
                            ? "Carregando municípios..."
                            : "Selecione um município"}
                        </option>
                        {municipios.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nome}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    onClick={handleApplyMunicipioBoundary}
                    disabled={selectedMunicipioId === "" || loadingBoundary}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-600/20"
                  >
                    {loadingBoundary ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Landmark className="w-4 h-4" />
                    )}
                    Usar limite do município selecionado
                  </button>
                </>
              )}

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-indigo-900 dark:text-indigo-200">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Deseja gerar candidatos reais de visita de campo para este limite via GEE?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal("candidates")}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-lg shrink-0 transition-colors"
                >
                  Triar Candidatos GEE
                </button>
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Fonte: malhas territoriais oficiais do IBGE (servicodados.ibge.gov.br). O recorte se aplica sobre os
                pontos carregados e delimita a Área de Interesse para amostragem no Earth Engine.
              </p>

              {boundaryError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/50 rounded-xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{boundaryError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: PRESETS */}
          {tab === "presets" && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Selecione uma macrorregião ou bacia hidrográfica com curadoria própria para posicionamento automático da câmera 3D:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {regionPresets.map((reg) => {
                  const isSelected = activeRegion.id === reg.id;
                  return (
                    <div
                      key={reg.id}
                      onClick={() => {
                        setActiveRegion(reg.id);
                        setActiveModal(null);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500 shadow-md"
                          : "bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {reg.name}
                        </h4>
                        <span className="text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                          {reg.state}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                        {reg.description}
                      </p>
                      <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-1.5">
                        <span className="truncate max-w-[170px]">
                          Bacias: {reg.watersheds.slice(0, 2).join(", ")}...
                        </span>
                        <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Visualizar →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD AOI POLYGON */}
          {tab === "upload-aoi" && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-3 transition-colors">
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-600 dark:text-cyan-400 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">Área de Interesse Personalizada (AOI)</h4>
                  <p className="text-slate-500 dark:text-slate-400">
                    Faça o upload do seu polígono de bacia hidrográfica, fazenda ou limite municipal (GeoJSON/KML).
                    O mapa recortará automaticamente os focos de erosão para exibir apenas as feições dentro da sua área.
                  </p>
                </div>
              </div>

              {/* Active polygon card if loaded */}
              {activeAOIPolygon ? (
                <div className="p-4 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-300 dark:border-cyan-500/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Polígono AOI Ativo no Mapa</h4>
                    </div>
                    <button
                      onClick={() => setActiveAOIPolygon(null)}
                      className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
                    >
                      Remover Polígono
                    </button>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
                    <div className="text-cyan-700 dark:text-cyan-300 font-bold">{activeAOIPolygon.name}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Arquivo: {activeAOIPolygon.fileName} • Tipo: {activeAOIPolygon.geometry.type}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setAoiDragOver(true);
                  }}
                  onDragLeave={() => setAoiDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setAoiDragOver(false);
                    if (e.dataTransfer.files?.[0]) handleAOIUpload(e.dataTransfer.files[0]);
                  }}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                    aoiDragOver
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900/40"
                  }`}
                >
                  <input
                    type="file"
                    id="aoi-file-input"
                    accept=".geojson,.json,.kml"
                    onChange={(e) => e.target.files?.[0] && handleAOIUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <UploadCloud className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Arraste seu arquivo de polígono <span className="text-cyan-600 dark:text-cyan-400">GeoJSON ou KML</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Compatível com coordenadas geográficas WGS84 EPSG:4326
                  </p>
                  <label
                    htmlFor="aoi-file-input"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    <FilePlus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    Selecionar Polígono AOI
                  </label>
                </div>
              )}

              {aoiError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/50 rounded-xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{aoiError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NEW REGION REQUEST FORM */}
          {tab === "new-request" && (
            <div className="space-y-4">
              {requestSubmitted ? (
                <div className="p-6 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/50 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pedido de Nova Região Registrado!</h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-md mx-auto">
                    Sua solicitação de processamento de erosão com o Google Earth Engine foi adicionada à fila de
                    execução. Uma notificação será enviada ao seu e-mail quando o raster de BSI e declividade estiver pronto.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                        Nome da Região / Bacia *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.regionName}
                        onChange={(e) => setFormData({ ...formData, regionName: e.target.value })}
                        placeholder="Ex: Bacia do Rio Piracicaba"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                        Estado ou País *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.stateOrCountry}
                        onChange={(e) => setFormData({ ...formData, stateOrCountry: e.target.value })}
                        placeholder="Ex: SP, MG, MS ou Brasil"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      E-mail para Recebimento dos Resultados *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.requesterEmail}
                      onChange={(e) => setFormData({ ...formData, requesterEmail: e.target.value })}
                      placeholder="pesquisador@universidade.br"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Finalidade da Pesquisa / Justificativa *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Descreva brevemente o objetivo da triagem de erosão nesta nova área..."
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Sensor / Satélite Preferencial
                    </label>
                    <select
                      value={formData.sensorPreference}
                      onChange={(e) =>
                        setFormData({ ...formData, sensorPreference: e.target.value as any })
                      }
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="Sentinel-2">Sentinel-2 (MSI - 10m com BSI e NDVI multiespectral)</option>
                      <option value="Landsat-8/9">Landsat 8/9 (OLI/TIRS - 30m séries temporais)</option>
                      <option value="Planet-NICFI">Planet NICFI (Alta Resolução 4.77m)</option>
                      <option value="SRTM-30m">SRTM DEM 30m (Topografia e Declividade)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-600/20"
                  >
                    <Send className="w-4 h-4" />
                    Enviar Pedido de Mapeamento GEE
                  </button>
                </form>
              )}

              {/* History of Submitted Requests */}
              {regionRequests.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-300">
                    Pedidos Registrados Recentemente ({regionRequests.length})
                  </h4>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {regionRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="text-slate-800 dark:text-slate-300 font-bold">
                          {req.regionName} ({req.stateOrCountry})
                        </div>
                        <span className="text-[10px] bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-500/30">
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
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
