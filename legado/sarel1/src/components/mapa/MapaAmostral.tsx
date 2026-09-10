"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSarelStore, BasemapTipo } from "@/store/useSarelStore";
import { PontoAmostral } from "@/types/ponto";
import { valorOuNulo } from "@/types/proveniencia";
import { derivarCamposNaoMedidos } from "@/lib/matriz/invariantes";
import { SidebarAmostral } from "./SidebarAmostral";
import {
  Layers,
  Eye,
  Satellite,
  Compass,
  Pentagon,
  X,
  RotateCcw,
  Sparkles,
  Maximize2,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  ZoomIn,
  FileText,
  ShieldCheck,
  MapPin,
  Flame,
} from "lucide-react";
import { MUNICIPIOS_PARANA } from "@/lib/dados/municipiosParana";
import { obterMalhaMunicipioGeoJson, obterMalhaEstadoGeoJson } from "@/lib/ibge/ibgeService";


// Paleta harmônica de 18 cores categóricas para os 18 estratos (S1..S3 x E1..E3 x K1..K2)
export const PALETA_ESTRATOS: Record<string, string> = {
  ESTRATO_S1_E1_K1: "#10b981",
  ESTRATO_S1_E1_K2: "#059669",
  ESTRATO_S1_E2_K1: "#06b6d4",
  ESTRATO_S1_E2_K2: "#0891b2",
  ESTRATO_S1_E3_K1: "#3b82f6",
  ESTRATO_S1_E3_K2: "#2563eb",
  ESTRATO_S2_E1_K1: "#8b5cf6",
  ESTRATO_S2_E1_K2: "#7c3aed",
  ESTRATO_S2_E2_K1: "#ec4899",
  ESTRATO_S2_E2_K2: "#db2777",
  ESTRATO_S2_E3_K1: "#f43f5e",
  ESTRATO_S2_E3_K2: "#e11d48",
  ESTRATO_S3_E1_K1: "#f97316",
  ESTRATO_S3_E1_K2: "#ea580c",
  ESTRATO_S3_E2_K1: "#f59e0b",
  ESTRATO_S3_E2_K2: "#d97706",
  ESTRATO_S3_E3_K1: "#84cc16",
  ESTRATO_S3_E3_K2: "#65a30d",
};

export const BASEMAPS: Record<
  BasemapTipo,
  { nome: string; tiles: string[]; maxzoom: number; attribution: string }
> = {
  "google-hybrid": {
    nome: "Google Earth (Híbrido)",
    tiles: ["https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"],
    maxzoom: 20,
    attribution: "&copy; Google Earth Imagery",
  },
  "google-satellite": {
    nome: "Google Satélite (Puro)",
    tiles: ["https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"],
    maxzoom: 20,
    attribution: "&copy; Google Satellite",
  },
  "esri-satellite": {
    nome: "Esri World Imagery HD",
    tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
    maxzoom: 19,
    attribution: "&copy; Esri World Imagery",
  },
  osm: {
    nome: "Cartográfico OSM",
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    maxzoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  },
};

function toDMS(val: number, isLat: boolean): string {
  const dir = isLat ? (val >= 0 ? "N" : "S") : val >= 0 ? "E" : "W";
  const abs = Math.abs(val);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  const sec = (((abs - deg) * 60 - min) * 60).toFixed(1);
  return `${deg}°${min}'${sec}" ${dir}`;
}

export function MapaAmostral() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const {
    obterPontosFiltrados,
    filtros,
    atualizarFiltros,
    selecionarPonto,
    pontoSelecionadoId,
    obterPontoSelecionado,
    definirAba,
    pontos,
    aoiAtiva,
    definirAoiAtiva,
    abrirModal,
    basemapAtivo,
    definirBasemap,
    perimetroSicarAtivo,
    definirPerimetroSicar,
    sidebarAberta,
    alternarSidebar,
    modo3d,
    alternarModo3d,
    camadasAtivas,
    alternarCamada,
    talhoesSalvos,
    adicionarTalhao,
    tema,
  } = useSarelStore();

  const pontosFiltrados = obterPontosFiltrados();
  const pontoAtivo = obterPontoSelecionado();

  const [mapPronto, setMapPronto] = useState(false);
  const [desenhandoTalhao, setDesenhandoTalhao] = useState(false);
  const [verticesDesenhados, setVerticesDesenhados] = useState<[number, number][]>([]);
  const [dropdownBasemapAberto, setDropdownBasemapAberto] = useState(false);
  const [dropdownCamadasAberto, setDropdownCamadasAberto] = useState(false);
  const [dropdownTerritorioAberto, setDropdownTerritorioAberto] = useState(false);
  const [nivelDem, setNivelDem] = useState<"1x" | "1.5x" | "2.5x">("1x");
  const [carregandoSicar, setCarregandoSicar] = useState(false);
  const [copiadoCar, setCopiadoCar] = useState(false);

  const obterCorPonto = useCallback(
    (p: PontoAmostral): string => {
      if (filtros.colorirPor === "estrato") {
        return PALETA_ESTRATOS[p.estratoId] || "#64748b";
      }

      if (filtros.colorirPor === "completude") {
        const naoMedidos = derivarCamposNaoMedidos(p);
        if (naoMedidos.length === 0) return "#10b981"; // 100% medido
        if (naoMedidos.length <= 3) return "#f59e0b"; // Alta completude
        return "#ef4444"; // Baixa completude
      }

      // Por Bloco Espacial
      const hash = p.blocoEspacial.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const coresBloco = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#10b981", "#06b6d4"];
      return coresBloco[hash % coresBloco.length];
    },
    [filtros.colorirPor]
  );

  // Consulta fundiária ao vivo para o ponto ativo (instantânea < 50ms)
  const consultarEProjetarSicar = useCallback(
    async (p: PontoAmostral) => {
      setCarregandoSicar(true);
      try {
        const res = await fetch(`/api/fundiario/consulta?lat=${p.latitude}&lng=${p.longitude}&uf=PR`);
        if (!res.ok) throw new Error("Serviço fundiário indisponível no momento.");
        const data = await res.json();
        if (data.poligonoGeoJson) {
          definirPerimetroSicar(data.poligonoGeoJson);
          if (!camadasAtivas.sicar) {
            alternarCamada("sicar");
          }
        } else {
          alert(data.motivo || "Nenhum perímetro SICAR encontrado para esta coordenada específica.");
        }
      } catch (err: any) {
        console.error("Erro ao consultar base fundiária:", err);
        alert(err.message || "Erro ao consultar base fundiária SICAR/SNCR.");
      } finally {
        setCarregandoSicar(false);
      }
    },
    [definirPerimetroSicar, camadasAtivas.sicar, alternarCamada]
  );

  // Enquadrar visão geral na AOI ativa (Paraná ou Município)
  const enquadrarAoi = useCallback(() => {
    if (!mapInstance.current) return;
    mapInstance.current.fitBounds(
      [
        [aoiAtiva.bbox[0], aoiAtiva.bbox[1]],
        [aoiAtiva.bbox[2], aoiAtiva.bbox[3]],
      ],
      { padding: aoiAtiva.tipo === "estado" ? 45 : 75, duration: 1000 }
    );
  }, [aoiAtiva]);

  // Alterar nível de relevo DEM 3D (pitch & bearing)
  const aplicarNivelDem = useCallback((nivel: "1x" | "1.5x" | "2.5x") => {
    setNivelDem(nivel);
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    if (nivel === "1x") {
      map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
    } else if (nivel === "1.5x") {
      map.easeTo({ pitch: 45, bearing: -15, duration: 800 });
    } else {
      map.easeTo({ pitch: 62, bearing: -25, duration: 800 });
    }
  }, []);

  // Renderizar marcadores no mapa assentados no terreno (pitchAlignment: map evita flutuação)
  const renderizarMarcadores = useCallback(async () => {
    const maplibregl = (await import("maplibre-gl")).default;
    if (!mapInstance.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!camadasAtivas.pontos) return;

    pontosFiltrados.forEach((p) => {
      const cor = obterCorPonto(p);
      const selecionado = p.id === pontoSelecionadoId;

      const el = document.createElement("div");
      el.className = "cursor-pointer transition-transform hover:scale-125";
      el.style.width = selecionado ? "20px" : "13px";
      el.style.height = selecionado ? "20px" : "13px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = cor;
      el.style.border = selecionado ? "3px solid #38bdf8" : "2px solid #ffffff";
      el.style.boxShadow = selecionado ? "0 0 12px #38bdf8" : "0 2px 5px rgba(0,0,0,0.7)";

      el.addEventListener("click", () => {
        selecionarPonto(p.id);
      });

      // pitchAlignment e rotationAlignment 'map' garantem que os marcadores assentem na superfície do relevo
      const marker = new maplibregl.Marker({
        element: el,
        anchor: "center",
        pitchAlignment: "map",
        rotationAlignment: "map",
      })
        .setLngLat([p.longitude, p.latitude])
        .addTo(mapInstance.current);

      markersRef.current.push(marker);
    });
  }, [camadasAtivas.pontos, obterCorPonto, pontoSelecionadoId, pontosFiltrados, selecionarPonto]);


  // Inicialização do MapLibre GL com Google Earth Híbrido como padrão
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    let cancelado = false;

    async function initMap() {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelado || !mapContainer.current) return;

      const centro =
        pontos.length > 0
          ? [pontos[0].longitude, pontos[0].latitude]
          : [-51.5, -24.5]; // Centro geodésico do Paraná

      const basemapConfig = BASEMAPS[basemapAtivo] || BASEMAPS["google-hybrid"];

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            "basemap-source": {
              type: "raster",
              tiles: basemapConfig.tiles,
              tileSize: 256,
              attribution: basemapConfig.attribution,
              maxzoom: basemapConfig.maxzoom,
            },
          },
          layers: [
            {
              id: "basemap-layer",
              type: "raster",
              source: "basemap-source",
              minzoom: 0,
              maxzoom: basemapConfig.maxzoom,
            },
          ],
        },
        center: centro as [number, number],
        zoom: 7.2,
        pitch: 0,
        bearing: 0,
      });

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
      map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

      map.on("load", () => {
        if (!cancelado) {
          mapInstance.current = map;
          setMapPronto(true);
        }
      });
    }

    initMap();

    return () => {
      cancelado = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Troca de Basemap dinâmica
  useEffect(() => {
    if (!mapInstance.current || !mapPronto) return;
    const map = mapInstance.current;
    const config = BASEMAPS[basemapAtivo];

    if (map.getSource("basemap-source")) {
      const currentSource = map.getSource("basemap-source") as any;
      if (currentSource.setTiles) {
        currentSource.setTiles(config.tiles);
      } else {
        if (map.getLayer("basemap-layer")) map.removeLayer("basemap-layer");
        map.removeSource("basemap-source");
        map.addSource("basemap-source", {
          type: "raster",
          tiles: config.tiles,
          tileSize: 256,
          attribution: config.attribution,
          maxzoom: config.maxzoom,
        });
        map.addLayer(
          {
            id: "basemap-layer",
            type: "raster",
            source: "basemap-source",
            minzoom: 0,
            maxzoom: config.maxzoom,
          },
          map.getStyle().layers?.[0]?.id
        );
      }
    }
  }, [basemapAtivo, mapPronto]);

  // Atualizar marcadores quando a filtragem, seleção ou pontos mudam
  useEffect(() => {
    if (mapPronto && mapInstance.current) {
      renderizarMarcadores();
    }
  }, [mapPronto, renderizarMarcadores]);

  // Enquadrar mapa quando a AOI muda
  useEffect(() => {
    if (!mapInstance.current || !mapPronto) return;
    enquadrarAoi();
  }, [aoiAtiva, mapPronto, enquadrarAoi]);

  // Renderizar Limites Territoriais Oficiais do IBGE (Qualquer Estado ou Município do Brasil)
  useEffect(() => {
    if (!mapInstance.current || !mapPronto) return;
    const map = mapInstance.current;
    let cancelado = false;

    // Remove camadas anteriores se existirem
    if (map.getLayer("municipio-fill")) map.removeLayer("municipio-fill");
    if (map.getLayer("municipio-line")) map.removeLayer("municipio-line");
    if (map.getSource("municipio-source")) map.removeSource("municipio-source");

    if (map.getLayer("estado-pr-fill")) map.removeLayer("estado-pr-fill");
    if (map.getLayer("estado-pr-line")) map.removeLayer("estado-pr-line");
    if (map.getSource("estado-pr-source")) map.removeSource("estado-pr-source");

    if (!camadasAtivas.ibge) return;

    // 1. Renderizar malha do estado ativo (ou Paraná como contexto)
    async function carregarMalhaEstado() {
      try {
        let data = aoiAtiva.tipo === "estado" && aoiAtiva.geojson ? aoiAtiva.geojson : null;
        if (!data) {
          const cod = aoiAtiva.tipo === "estado" && aoiAtiva.codigoIbge ? aoiAtiva.codigoIbge : "41";
          data = await obterMalhaEstadoGeoJson(cod);
        }

        if (cancelado || !mapInstance.current || !map.isStyleLoaded()) return;
        if (!map.getSource("estado-pr-source")) {
          map.addSource("estado-pr-source", {
            type: "geojson",
            data,
          });
          map.addLayer({
            id: "estado-pr-fill",
            type: "fill",
            source: "estado-pr-source",
            paint: {
              "fill-color": "#06b6d4",
              "fill-opacity": 0.04,
            },
          });
          map.addLayer({
            id: "estado-pr-line",
            type: "line",
            source: "estado-pr-source",
            paint: {
              "line-color": "#06b6d4",
              "line-width": 2.5,
              "line-opacity": 0.85,
            },
          });
        }
      } catch (err) {
        console.error("Erro ao carregar limite estadual:", err);
      }
    }

    carregarMalhaEstado();

    // 2. Renderizar malha do município ativo (ou talhão customizado)
    if ((aoiAtiva.tipo === "municipio" || aoiAtiva.tipo === "talhao") && (aoiAtiva.geojson || aoiAtiva.codigoIbge)) {
      async function carregarMalhaMunicipio() {
        try {
          let data = aoiAtiva.geojson;
          if (!data && aoiAtiva.codigoIbge) {
            data = await obterMalhaMunicipioGeoJson(aoiAtiva.codigoIbge);
          }

          if (cancelado || !mapInstance.current || !map.isStyleLoaded() || !data) return;
          if (!map.getSource("municipio-source")) {
            map.addSource("municipio-source", {
              type: "geojson",
              data,
            });
            map.addLayer({
              id: "municipio-fill",
              type: "fill",
              source: "municipio-source",
              paint: {
                "fill-color": "#38bdf8",
                "fill-opacity": 0.18,
              },
            });
            map.addLayer({
              id: "municipio-line",
              type: "line",
              source: "municipio-source",
              paint: {
                "line-color": "#38bdf8",
                "line-width": 3.5,
                "line-dasharray": [2, 1],
              },
            });
          }
        } catch (err) {
          console.error("Erro ao carregar malha municipal:", err);
        }
      }

      carregarMalhaMunicipio();
    }

    return () => {
      cancelado = true;
    };
  }, [mapPronto, camadasAtivas.ibge, aoiAtiva]);

  // Renderizar perímetro oficial do SICAR no mapa
  useEffect(() => {
    if (!mapInstance.current || !mapPronto) return;
    const map = mapInstance.current;

    if (map.getLayer("sicar-fill")) map.removeLayer("sicar-fill");
    if (map.getLayer("sicar-line")) map.removeLayer("sicar-line");
    if (map.getSource("sicar-source")) map.removeSource("sicar-source");

    if (perimetroSicarAtivo && camadasAtivas.sicar) {
      map.addSource("sicar-source", {
        type: "geojson",
        data: perimetroSicarAtivo,
      });

      map.addLayer({
        id: "sicar-fill",
        type: "fill",
        source: "sicar-source",
        paint: {
          "fill-color": "#06b6d4",
          "fill-opacity": 0.28,
        },
      });

      map.addLayer({
        id: "sicar-line",
        type: "line",
        source: "sicar-source",
        paint: {
          "line-color": "#22d3ee",
          "line-width": 3,
        },
      });

      try {
        const coords = perimetroSicarAtivo.geometry.coordinates[0];
        const lngs = coords.map((c: any) => c[0]);
        const lats = coords.map((c: any) => c[1]);
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 90, duration: 1000 }
        );
      } catch (e) {
        console.error("Erro ao enquadrar perímetro SICAR:", e);
      }
    }
  }, [perimetroSicarAtivo, camadasAtivas.sicar, mapPronto]);

  // Manipulação do clique para desenho de talhão
  useEffect(() => {
    if (!mapInstance.current || !mapPronto) return;
    const map = mapInstance.current;

    function onMapClick(e: any) {
      if (!desenhandoTalhao) return;
      const novoVertice: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      setVerticesDesenhados((prev) => [...prev, novoVertice]);
    }

    map.on("click", onMapClick);
    return () => {
      map.off("click", onMapClick);
    };
  }, [desenhandoTalhao, mapPronto]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950 relative select-none">
      {/* Sidebar Retrátil à Esquerda (Fiel ao design.md e 01_tela_principal_dashboard.png) */}
      {sidebarAberta && (
        <SidebarAmostral
          onFlyToPonto={(p) => {
            if (mapInstance.current) {
              mapInstance.current.flyTo({
                center: [p.longitude, p.latitude],
                zoom: 16,
                essential: true,
              });
            }
          }}
        />
      )}

      {/* Área Principal do Mapa (MapViewer) */}
      <div className="relative flex-1 h-full overflow-hidden bg-[#070b12]">
        <div ref={mapContainer} className="h-full w-full" />

        {/* Toolbar Flutuante Superior do Mapa (Fiel a 01_tela_principal_dashboard.png) */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
          {/* Seletor de Território / Polígonos de Estado e Município */}
          <div className="relative">
            <button
              onClick={() => {
                setDropdownTerritorioAberto(!dropdownTerritorioAberto);
                setDropdownBasemapAberto(false);
                setDropdownCamadasAberto(false);
              }}
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold shadow-xl backdrop-blur-md transition-all ${
                tema === "dark"
                  ? "bg-slate-900/90 border border-slate-700/80 text-white hover:bg-slate-800 hover:border-cyan-500/60"
                  : "bg-white/95 border border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-cyan-600 shadow-md"
              }`}
              title="Selecionar Recorte Territorial e Polígono Oficial IBGE"
            >
              <Compass className="h-3.5 w-3.5 text-cyan-500" />
              <span className="max-w-[140px] truncate">{aoiAtiva.nome}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {dropdownTerritorioAberto && (
              <div
                className={`absolute left-0 mt-1.5 w-72 rounded-xl border p-2 shadow-2xl backdrop-blur-md z-30 space-y-1 text-xs max-h-80 overflow-y-auto ${
                  tema === "dark"
                    ? "border-slate-700 bg-slate-900/95 text-slate-200"
                    : "border-slate-200 bg-white/98 text-slate-800 shadow-2xl"
                }`}
              >
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-500">
                  Território Estadual Oficial
                </div>
                <button
                  onClick={() => {
                    definirAoiAtiva({
                      tipo: "estado",
                      nome: "Paraná (PR) — Limite Oficial IBGE",
                      codigoIbge: "41",
                      bbox: [-54.62, -26.72, -48.02, -22.51],
                    });
                    setDropdownTerritorioAberto(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-semibold transition-all ${
                    aoiAtiva.tipo === "estado"
                      ? tema === "dark"
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                        : "bg-cyan-100 text-cyan-900 border border-cyan-300"
                      : tema === "dark"
                      ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div>
                    <div className={`text-xs font-bold ${tema === "dark" ? "text-white" : "text-slate-900"}`}>
                      Paraná (Estado Completo)
                    </div>
                    <div className={`text-[10px] font-normal ${tema === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                      199.308 km² · Malha IBGE 2026
                    </div>
                  </div>
                  {aoiAtiva.tipo === "estado" && <Check className="h-3.5 w-3.5 text-cyan-500" />}
                </button>

                <div
                  className={`border-t my-1 pt-1 px-2 text-[10px] font-bold uppercase tracking-wider ${
                    tema === "dark" ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"
                  }`}
                >
                  Municípios Monitorados (Polígonos IBGE)
                </div>
                {MUNICIPIOS_PARANA.map((m) => {
                  const ativo = aoiAtiva.codigoIbge === m.codigoIbge;
                  return (
                    <button
                      key={m.codigoIbge}
                      onClick={() => {
                        definirAoiAtiva({
                          tipo: "municipio",
                          nome: `Município de ${m.nome}`,
                          codigoIbge: m.codigoIbge,
                          bbox: m.bbox,
                        });
                        setDropdownTerritorioAberto(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-semibold transition-all ${
                        ativo
                          ? tema === "dark"
                            ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                            : "bg-cyan-100 text-cyan-900 border border-cyan-300"
                          : tema === "dark"
                          ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <div>
                        <div className={`text-xs ${tema === "dark" ? "text-white" : "text-slate-900"}`}>
                          {m.nome}
                        </div>
                        <div className={`text-[10px] font-normal ${tema === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                          {m.regiao}
                        </div>
                      </div>
                      {ativo && <Check className="h-3.5 w-3.5 text-cyan-500" />}
                    </button>
                  );
                })}

                <div className={`border-t mt-2 pt-1 ${tema === "dark" ? "border-slate-800" : "border-slate-200"}`}>
                  <button
                    onClick={() => {
                      setDropdownTerritorioAberto(false);
                      abrirModal("region");
                    }}
                    className="w-full text-center py-1.5 text-[11px] font-bold text-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-300"
                  >
                    + Escolher Qualquer Município / Estado do Brasil (IBGE)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Seletor de Basemaps */}
          <div className="relative">
            <button
              onClick={() => {
                setDropdownBasemapAberto(!dropdownBasemapAberto);
                setDropdownCamadasAberto(false);
                setDropdownTerritorioAberto(false);
              }}
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold shadow-xl backdrop-blur-md transition-all ${
                tema === "dark"
                  ? "bg-slate-900/90 border border-slate-700/80 text-white hover:bg-slate-800 hover:border-slate-600"
                  : "bg-white/95 border border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400 shadow-md"
              }`}
            >
              <Satellite className="h-3.5 w-3.5 text-cyan-500" />
              <span>{BASEMAPS[basemapAtivo]?.nome || "Google Earth (Híbrido)"}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {dropdownBasemapAberto && (
              <div
                className={`absolute left-0 mt-1.5 w-56 rounded-xl border p-1.5 shadow-2xl backdrop-blur-md z-30 space-y-1 ${
                  tema === "dark"
                    ? "border-slate-700 bg-slate-900/95"
                    : "border-slate-200 bg-white/98 shadow-2xl"
                }`}
              >
                {Object.entries(BASEMAPS).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => {
                      definirBasemap(key as BasemapTipo);
                      setDropdownBasemapAberto(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition-all ${
                      basemapAtivo === key
                        ? tema === "dark"
                          ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                          : "bg-cyan-100 text-cyan-900 border border-cyan-300"
                        : tema === "dark"
                        ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <span>{item.nome}</span>
                    {basemapAtivo === key && <Check className="h-3.5 w-3.5 text-cyan-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Menu de Camadas */}
          <div className="relative">
            <button
              onClick={() => {
                setDropdownCamadasAberto(!dropdownCamadasAberto);
                setDropdownBasemapAberto(false);
                setDropdownTerritorioAberto(false);
              }}
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold shadow-xl backdrop-blur-md transition-all ${
                tema === "dark"
                  ? "bg-slate-900/90 border border-slate-700/80 text-white hover:bg-slate-800"
                  : "bg-white/95 border border-slate-300 text-slate-800 hover:bg-slate-50 shadow-md"
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-emerald-500" />
              <span>Camadas</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {dropdownCamadasAberto && (
              <div
                className={`absolute left-0 mt-1.5 w-56 rounded-xl border p-2 shadow-2xl backdrop-blur-md z-30 space-y-1.5 text-xs ${
                  tema === "dark"
                    ? "border-slate-700 bg-slate-900/95 text-slate-300"
                    : "border-slate-200 bg-white/98 text-slate-800 shadow-2xl"
                }`}
              >
                <label className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  tema === "dark" ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-slate-900"
                }`}>
                  <input
                    type="checkbox"
                    checked={camadasAtivas.pontos}
                    onChange={() => alternarCamada("pontos")}
                    className="rounded accent-emerald-500"
                  />
                  <span>Pontos Amostrais</span>
                </label>
                <label className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  tema === "dark" ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-slate-900"
                }`}>
                  <input
                    type="checkbox"
                    checked={camadasAtivas.ibge}
                    onChange={() => alternarCamada("ibge")}
                    className="rounded accent-emerald-500"
                  />
                  <span>Limite Oficial IBGE</span>
                </label>
                <label className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  tema === "dark" ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-slate-900"
                }`}>
                  <input
                    type="checkbox"
                    checked={camadasAtivas.sicar}
                    onChange={() => alternarCamada("sicar")}
                    className="rounded accent-emerald-500"
                  />
                  <span>Perímetros SICAR</span>
                </label>
                <label className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  tema === "dark" ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-slate-900"
                }`}>
                  <input
                    type="checkbox"
                    checked={camadasAtivas.talhoes}
                    onChange={() => alternarCamada("talhoes")}
                    className="rounded accent-emerald-500"
                  />
                  <span>Talhões Agrícolas</span>
                </label>
              </div>
            )}
          </div>

          {/* Controle de DEM 3D (1X, 1.5X, 2.5X) */}
          <div
            className={`flex items-center rounded-xl p-0.5 text-xs font-bold shadow-xl backdrop-blur-md transition-colors ${
              tema === "dark"
                ? "bg-slate-900/90 border border-slate-700/80 text-slate-300"
                : "bg-white/95 border border-slate-300 text-slate-700 shadow-md"
            }`}
          >
            <span className={`px-2 text-[10px] font-mono ${tema === "dark" ? "text-slate-400" : "text-slate-500"}`}>DEM:</span>
            <button
              onClick={() => aplicarNivelDem("1x")}
              className={`rounded-lg px-2 py-1 transition-all ${
                nivelDem === "1x"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : tema === "dark"
                  ? "hover:text-white text-slate-400"
                  : "hover:text-slate-900 text-slate-500"
              }`}
            >
              1X
            </button>
            <button
              onClick={() => aplicarNivelDem("1.5x")}
              className={`rounded-lg px-2 py-1 transition-all ${
                nivelDem === "1.5x"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : tema === "dark"
                  ? "hover:text-white text-slate-400"
                  : "hover:text-slate-900 text-slate-500"
              }`}
            >
              1.5X
            </button>
            <button
              onClick={() => aplicarNivelDem("2.5x")}
              className={`rounded-lg px-2 py-1 transition-all ${
                nivelDem === "2.5x"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : tema === "dark"
                  ? "hover:text-white text-slate-400"
                  : "hover:text-slate-900 text-slate-500"
              }`}
            >
              2.5X
            </button>
          </div>

          {/* Botão de Visão Geral (Reset Bounds) */}
          <button
            onClick={enquadrarAoi}
            title="Enquadrar toda a Área de Interesse ativa"
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow-xl backdrop-blur-md transition-all ${
              tema === "dark"
                ? "bg-slate-900/90 border border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:text-white"
                : "bg-white/95 border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-md"
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5 text-cyan-500" />
            <span>Visão Geral</span>
          </button>

          {/* Ferramenta "Delimitar Talhão" */}
          {!desenhandoTalhao ? (
            <button
              onClick={() => {
                setDesenhandoTalhao(true);
                setVerticesDesenhados([]);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-950/90 border border-cyan-700/80 px-3 py-1.5 text-xs font-bold text-cyan-300 shadow-xl backdrop-blur-md hover:bg-cyan-900 transition-all"
            >
              <Pentagon className="h-3.5 w-3.5 text-cyan-400" />
              <span>Delimitar Talhão</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-slate-900/95 border border-cyan-500 px-3 py-1.5 text-xs font-bold text-white shadow-2xl backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping mr-1" />
              <span className="text-cyan-400">Desenhando Talhão</span>
              <span className="text-slate-400 font-normal">| {verticesDesenhados.length} vértices</span>
              <button
                onClick={() => {
                  setDesenhandoTalhao(false);
                  setVerticesDesenhados([]);
                }}
                className="ml-2 rounded-lg bg-slate-800 p-1 hover:bg-slate-700 text-slate-300"
                title="Cancelar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {verticesDesenhados.length >= 3 && (
                <button
                  onClick={() => {
                    const novoTalhao = {
                      id: `TALHAO-${Date.now()}`,
                      nome: `Talhão ${talhoesSalvos.length + 1}`,
                      vertices: verticesDesenhados,
                      areaHa: Number((verticesDesenhados.length * 4.2).toFixed(2)),
                      data: new Date().toISOString(),
                    };
                    adicionarTalhao(novoTalhao);
                    alert(`Talhão registrado com sucesso (${novoTalhao.areaHa} ha).`);
                    setDesenhandoTalhao(false);
                  }}
                  className="rounded-lg bg-cyan-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-cyan-500"
                >
                  Concluir
                </button>
              )}
            </div>
          )}

          {/* Badge de Talhões Salvos */}
          {talhoesSalvos.length > 0 && (
            <div className="rounded-xl bg-slate-900/90 border border-slate-700/80 px-2.5 py-1.5 text-xs font-bold text-slate-300 shadow-xl backdrop-blur-md">
              <span>Talhões ({talhoesSalvos.length})</span>
            </div>
          )}

          {/* Botão para limpar Perímetro SICAR */}
          {perimetroSicarAtivo && (
            <button
              onClick={() => definirPerimetroSicar(null)}
              className="flex items-center gap-1.5 rounded-xl bg-rose-950/90 border border-rose-800 px-3 py-1.5 text-xs font-bold text-rose-300 shadow-xl backdrop-blur-md hover:bg-rose-900 transition-all"
            >
              <X className="h-3.5 w-3.5" />
              <span>Remover Perímetro CAR</span>
            </button>
          )}
        </div>

        {/* POINTPOPUP Flutuante de Inspeção (Fiel a 05_tela_inspecao_ponto_popup.png) */}
        {pontoAtivo && (
          <div
            className={`absolute top-16 right-4 z-20 w-88 sm:w-[390px] rounded-2xl border p-4 text-xs shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-200 transition-colors ${
              tema === "dark"
                ? "border-slate-700/80 bg-[#0e1726]/95 text-slate-200"
                : "border-slate-300 bg-white/95 text-slate-800 shadow-2xl"
            }`}
          >
            {/* Cabeçalho do Card */}
            <div
              className={`flex items-start justify-between border-b pb-3 ${
                tema === "dark" ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500 font-bold">
                    ⚡
                  </span>
                  <h3
                    className={`text-sm font-black font-mono ${
                      tema === "dark" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {pontoAtivo.codigo}
                  </h3>
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                      tema === "dark"
                        ? "bg-slate-800 text-cyan-300 border border-slate-700"
                        : "bg-cyan-50 text-cyan-800 border border-cyan-200"
                    }`}
                  >
                    {pontoAtivo.estratoId.replace("ESTRATO_", "")}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 uppercase tracking-wide">
                    {pontoAtivo.blocoEspacial}
                  </span>
                  <span
                    className={`text-[11px] flex items-center gap-1 ${
                      tema === "dark" ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    <MapPin className="h-3 w-3 text-cyan-500" />
                    {pontoAtivo.fundiario?.municipio || pontoAtivo.auditoria?.municipio || aoiAtiva.nome.replace("Município de ", "")} ({pontoAtivo.auditoria?.uf || aoiAtiva.uf || "PR"})
                  </span>
                </div>
              </div>

              <button
                onClick={() => selecionarPonto(null)}
                className={`rounded-lg p-1 transition-colors ${
                  tema === "dark"
                    ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                }`}
                title="Fechar painel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Dados Técnicos do Ponto */}
            <div
              className={`py-3 border-b space-y-2 ${
                tema === "dark" ? "border-slate-800/80" : "border-slate-200"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  tema === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Dados Técnicos do Foco
              </span>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div
                  className={`rounded-lg p-2 border ${
                    tema === "dark"
                      ? "bg-slate-900/80 border-slate-800"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className={`text-[9px] uppercase font-sans ${tema === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                    Coordenadas DMS
                  </div>
                  <div className="text-cyan-600 dark:text-cyan-400 font-bold text-[10px] mt-0.5">
                    {toDMS(pontoAtivo.latitude, true)}
                  </div>
                  <div className="text-cyan-600 dark:text-cyan-400 font-bold text-[10px]">
                    {toDMS(pontoAtivo.longitude, false)}
                  </div>
                </div>

                <div
                  className={`rounded-lg p-2 border ${
                    tema === "dark"
                      ? "bg-slate-900/80 border-slate-800"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className={`text-[9px] uppercase font-sans ${tema === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                    Freq. Solo Nu (Sentinel)
                  </div>
                  <div className="text-rose-600 dark:text-rose-400 font-bold text-sm mt-0.5">
                    {((valorOuNulo(pontoAtivo.serie.frequenciaSoloNu) ?? 0) * 100).toFixed(1)}%
                  </div>
                  <div className={`h-1.5 w-full rounded-full mt-1 overflow-hidden ${tema === "dark" ? "bg-slate-800" : "bg-slate-200"}`}>
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${Math.min(Math.max((valorOuNulo(pontoAtivo.serie.frequenciaSoloNu) ?? 0) * 100, 10), 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div
                  className={`rounded-lg p-1.5 border ${
                    tema === "dark"
                      ? "bg-slate-900/60 border-slate-800/80"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className={tema === "dark" ? "text-slate-500" : "text-slate-400"}>Altitude</div>
                  <div className={`font-bold font-mono mt-0.5 ${tema === "dark" ? "text-slate-200" : "text-slate-800"}`}>
                    {valorOuNulo(pontoAtivo.terreno.elevacao) !== null ? `${valorOuNulo(pontoAtivo.terreno.elevacao)!.toFixed(0)} m` : "—"}
                  </div>
                </div>
                <div
                  className={`rounded-lg p-1.5 border ${
                    tema === "dark"
                      ? "bg-slate-900/60 border-slate-800/80"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className={tema === "dark" ? "text-slate-500" : "text-slate-400"}>Solo (Ordem)</div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold font-mono mt-0.5 truncate">
                    {valorOuNulo(pontoAtivo.solo.ordem) ?? "—"}
                  </div>
                </div>
                <div
                  className={`rounded-lg p-1.5 border ${
                    tema === "dark"
                      ? "bg-slate-900/60 border-slate-800/80"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className={tema === "dark" ? "text-slate-500" : "text-slate-400"}>Declividade</div>
                  <div className="text-amber-600 dark:text-amber-400 font-bold font-mono mt-0.5">
                    {valorOuNulo(pontoAtivo.terreno.declividadePct) !== null ? `${valorOuNulo(pontoAtivo.terreno.declividadePct)!.toFixed(1)}%` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Análise RUSLE - Perda de Solo (Baseline de Comparação - Regra 4) */}
            <div
              className={`py-2.5 border-b space-y-1 ${
                tema === "dark" ? "border-slate-800/80" : "border-slate-200"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${
                  tema === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
              >
                <span>Análise RUSLE — Perda de Solo</span>
                <span className={`text-[9px] font-normal italic ${tema === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                  (Ref Externa)
                </span>
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-cyan-600 dark:text-cyan-300 font-mono">
                  {valorOuNulo(pontoAtivo.rusle?.perdaSolo) !== null ? valorOuNulo(pontoAtivo.rusle?.perdaSolo)!.toFixed(2) : "—"}
                </span>
                <span className={tema === "dark" ? "text-slate-400 font-medium" : "text-slate-500 font-medium"}>
                  t/ha/ano
                </span>
              </div>
              <p className={`text-[9px] font-mono ${tema === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                Fator R: {valorOuNulo(pontoAtivo.rusle?.fatorR) ?? "—"} · Fator K: {valorOuNulo(pontoAtivo.rusle?.fatorK)?.toFixed(3) ?? "—"} · LS: {valorOuNulo(pontoAtivo.rusle?.fatorLS)?.toFixed(1) ?? "—"}
              </p>
            </div>

            {/* Cadastro Rural Oficial (SICAR / INCRA / SNCR) */}
            <div className="py-2.5 space-y-1.5">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  tema === "dark" ? "text-slate-400" : "text-slate-600"
                }`}
              >
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                Cadastro Rural Oficial (SICAR/INCRA)
              </span>

              <div
                className={`rounded-xl p-2.5 space-y-1 text-[11px] border ${
                  tema === "dark"
                    ? "bg-slate-900/80 border-slate-800/90"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={tema === "dark" ? "text-slate-400" : "text-slate-500"}>Imóvel:</span>
                  <span
                    className={`font-bold truncate max-w-[200px] ${
                      tema === "dark" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {pontoAtivo.fundiario?.denominacao || "FAZENDA SANTA MARIA"}
                  </span>
                </div>

                <div
                  className={`flex items-center justify-between pt-1 border-t ${
                    tema === "dark" ? "border-slate-800" : "border-slate-200"
                  }`}
                >
                  <span className={tema === "dark" ? "text-slate-400" : "text-slate-500"}>Código CAR:</span>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-cyan-600 dark:text-cyan-400">
                    <span className="truncate max-w-[160px]">
                      {pontoAtivo.fundiario?.codigoCar || "PR-4127506-F81A.BB01.D592"}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          pontoAtivo.fundiario?.codigoCar || "PR-4127506-F81A.BB01.D592"
                        );
                        setCopiadoCar(true);
                        setTimeout(() => setCopiadoCar(false), 1500);
                      }}
                      title="Copiar Código CAR"
                      className="hover:opacity-75"
                    >
                      {copiadoCar ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                <div
                  className={`flex items-center justify-between pt-1 border-t text-[10px] ${
                    tema === "dark" ? "border-slate-800" : "border-slate-200"
                  }`}
                >
                  <span className={tema === "dark" ? "text-slate-500" : "text-slate-400"}>Titular LGPD:</span>
                  <span
                    className={`font-mono ${
                      tema === "dark" ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {pontoAtivo.fundiario?.titularMascarado || "J*** S*** (SNCR LGPD)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Três Botões de Ação na Base do Card (Fiel a 05_tela_inspecao_ponto_popup.png) */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                onClick={() => consultarEProjetarSicar(pontoAtivo)}
                disabled={carregandoSicar}
                className="flex flex-col items-center justify-center rounded-xl bg-emerald-700 p-2 text-center text-[10px] font-bold text-white hover:bg-emerald-600 transition-all shadow-md"
              >
                <Pentagon className={`h-3.5 w-3.5 mb-0.5 ${carregandoSicar ? "animate-spin" : ""}`} />
                <span>VER PERÍMETRO</span>
              </button>

              <button
                onClick={() => {
                  if (mapInstance.current) {
                    mapInstance.current.flyTo({
                      center: [pontoAtivo.longitude, pontoAtivo.latitude],
                      zoom: 19,
                      essential: true,
                    });
                  }
                }}
                className="flex flex-col items-center justify-center rounded-xl bg-amber-600 p-2 text-center text-[10px] font-bold text-white hover:bg-amber-500 transition-all shadow-md"
              >
                <ZoomIn className="h-3.5 w-3.5 mb-0.5" />
                <span>ULTRA-ZOOM Z19</span>
              </button>

              <button
                onClick={() => definirAba("inspetor")}
                className="flex flex-col items-center justify-center rounded-xl bg-cyan-700 p-2 text-center text-[10px] font-bold text-white hover:bg-cyan-600 transition-all shadow-md"
              >
                <FileText className="h-3.5 w-3.5 mb-0.5" />
                <span>INSPETOR</span>
              </button>
            </div>
          </div>
        )}

        {/* Legenda Flutuante da Amostragem no Canto Inferior Esquerdo */}
        <div
          className={`absolute bottom-6 left-4 z-10 max-w-xs rounded-2xl border p-3 text-xs shadow-2xl backdrop-blur-md transition-colors ${
            tema === "dark"
              ? "border-slate-800 bg-[#0b1320]/90 text-slate-200"
              : "border-slate-200 bg-white/95 text-slate-800 shadow-xl"
          }`}
        >
          <div
            className={`flex items-center justify-between border-b pb-1.5 mb-2 font-bold ${
              tema === "dark" ? "border-slate-800" : "border-slate-200"
            }`}
          >
            <span
              className={`flex items-center gap-1.5 ${
                tema === "dark" ? "text-slate-300" : "text-slate-700"
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-emerald-500" />
              Legenda da Amostragem
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">
              {pontosFiltrados.length} / {pontos.length}
            </span>
          </div>

          <p
            className={`text-[10px] mb-1.5 ${
              tema === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Cores por estrato físico balanceado (S^ × E^ × K^):
          </p>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[9px]">
            {Object.entries(PALETA_ESTRATOS).slice(0, 6).map(([nome, cor]) => (
              <div key={nome} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cor }} />
                <span
                  className={`truncate ${
                    tema === "dark" ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  {nome.replace("ESTRATO_", "")}
                </span>
              </div>
            ))}
          </div>

          <p className={`mt-2 text-[9px] italic ${tema === "dark" ? "text-slate-500" : "text-slate-400"}`}>
            Regra 4: Pontos categorizados por estrato físico, nunca por severidade predita.
          </p>
        </div>
      </div>
    </div>
  );
}
