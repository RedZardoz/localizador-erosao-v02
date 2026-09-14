"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useSarelStore, usePontosVisiveis } from "@/store/useSarelStore";
import { MapControls } from "./MapControls";
import { DrawingToolbar } from "@/components/polygon/DrawingToolbar";
import { PointPopup } from "./PointPopup";
import { PARANA_BASINS_GEOJSON } from "@/lib/localizacao/bacias";
import { SITIOS_PADRAO_OURO_GEOJSON } from "@/lib/padraoOuro/sitiosReferencia";

export const MapViewer: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const {
    mapState,
    areas,
    modoDesenhoAtivo,
    poligonoDesenhando,
    adicionarVerticeDesenho,
    pontoSelecionadoId,
    selecionarPonto,
    obterPontoSelecionado,
    credenciais,
  } = useSarelStore();

  const pontosVisiveis = usePontosVisiveis();
  const pontoSelecionado = obterPontoSelecionado();

  // Inicialização do MapLibre GL
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "google-earth": {
            type: "raster",
            tiles: [
              "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
            ],
            tileSize: 256,
            attribution: "Google Earth / Google Maps",
          },
          "google-hybrid": {
            type: "raster",
            tiles: [
              "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
            ],
            tileSize: 256,
            attribution: "Google Earth / Google Maps",
          },
          "esri-satellite": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "Esri, Maxar, Earthstar Geographics",
          },
          "osm-topo": {
            type: "raster",
            tiles: ["https://a.tile.opentopomap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "OpenTopoMap",
          },
          "carto-dark": {
            type: "raster",
            tiles: ["https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"],
            tileSize: 256,
            attribution: "CARTO",
          },
          "terrain-dem": {
            type: "raster-dem",
            tiles: [
              "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
            ],
            encoding: "terrarium",
            tileSize: 256,
            maxzoom: 15,
          },
        },
        layers: [
          {
            id: "google-earth-layer",
            type: "raster",
            source: "google-earth",
            paint: { "raster-opacity": 1.0 },
          },
          {
            id: "google-hybrid-layer",
            type: "raster",
            source: "google-hybrid",
            paint: { "raster-opacity": 0.0 },
          },
          {
            id: "esri-satellite-layer",
            type: "raster",
            source: "esri-satellite",
            paint: { "raster-opacity": 0.0 },
          },
          {
            id: "osm-topo-layer",
            type: "raster",
            source: "osm-topo",
            paint: { "raster-opacity": 0.0 },
          },
          {
            id: "carto-dark-layer",
            type: "raster",
            source: "carto-dark",
            paint: { "raster-opacity": 0.0 },
          },
        ],
      },
      center: [-51.5, -24.8], // Centro geográfico do Paraná
      zoom: 7.2,
      pitch: 35,
      maxPitch: 85,
    });

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "bottom-right"
    );
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    map.on("load", () => {
      // 1. Fonte e camadas de Macrobacias Hidrográficas do Paraná
      map.addSource("parana-basins-source", {
        type: "geojson",
        data: PARANA_BASINS_GEOJSON as any,
      });

      map.addLayer({
        id: "parana-basins-fill",
        type: "fill",
        source: "parana-basins-source",
        layout: {
          visibility: mapState.mostrarBacias ? "visible" : "none",
        },
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.08,
        },
      });

      map.addLayer({
        id: "parana-basins-line",
        type: "line",
        source: "parana-basins-source",
        layout: {
          visibility: mapState.mostrarBacias ? "visible" : "none",
        },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 1.5,
          "line-dasharray": [3, 2],
        },
      });

      // 1.1 Sítios de Referência Padrão-Ouro (Céu Azul e Medianeira — 10 a 50 ha)
      map.addSource("sitios-padrao-ouro-source", {
        type: "geojson",
        data: SITIOS_PADRAO_OURO_GEOJSON,
      });

      map.addLayer({
        id: "sitios-padrao-ouro-fill",
        type: "fill",
        source: "sitios-padrao-ouro-source",
        layout: {
          visibility: mapState.mostrarSitiosPadraoOuro !== false ? "visible" : "none",
        },
        paint: {
          "fill-color": "#06B6D4",
          "fill-opacity": 0.2,
        },
      });

      map.addLayer({
        id: "sitios-padrao-ouro-line",
        type: "line",
        source: "sitios-padrao-ouro-source",
        layout: {
          visibility: mapState.mostrarSitiosPadraoOuro !== false ? "visible" : "none",
        },
        paint: {
          "line-color": "#0891B2",
          "line-width": 2.5,
        },
      });

      // 2. Fonte de Áreas Ativas e Polígonos de Amostragem Persistentes
      map.addSource("areas-estudo-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "areas-estudo-fill",
        type: "fill",
        source: "areas-estudo-source",
        paint: {
          "fill-color": ["get", "cor"],
          "fill-opacity": 0.15,
        },
      });

      map.addLayer({
        id: "areas-estudo-line",
        type: "line",
        source: "areas-estudo-source",
        paint: {
          "line-color": ["get", "cor"],
          "line-width": 2.5,
        },
      });

      // 3. Desenho em Progresso (linhas e vértices)
      map.addSource("desenho-progresso-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "desenho-progresso-line",
        type: "line",
        source: "desenho-progresso-source",
        paint: {
          "line-color": "#10B981",
          "line-width": 2.5,
          "line-dasharray": [2, 1],
        },
      });

      map.addLayer({
        id: "desenho-progresso-points",
        type: "circle",
        source: "desenho-progresso-source",
        paint: {
          "circle-radius": 5,
          "circle-color": "#10B981",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
        filter: ["==", "$type", "Point"],
      });

      // 4. Pontos Amostrais Reais
      map.addSource("pontos-amostrais-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "pontos-amostrais-circle",
        type: "circle",
        source: "pontos-amostrais-source",
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "selecionado"], true],
            10,
            6.5,
          ],
          "circle-color": [
            "match",
            ["get", "classeAmostral"],
            "erosao",
            "#EF4444",
            "controle",
            "#10B981",
            /* fallback */
            [
              "case",
              ["==", ["get", "rotulado"], true],
              "#059669",
              "#F59E0B",
            ],
          ],
          "circle-stroke-width": [
            "case",
            ["==", ["get", "selecionado"], true],
            3,
            1.5,
          ],
          "circle-stroke-color": "#ffffff",
        },
      });

      // Interação de clique no ponto
      map.on("click", "pontos-amostrais-circle", (e) => {
        if (!e.features || e.features.length === 0) return;
        const id = e.features[0].properties?.id;
        if (id) {
          selecionarPonto(id);
        }
      });

      map.on("mouseenter", "pontos-amostrais-circle", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "pontos-amostrais-circle", () => {
        map.getCanvas().style.cursor = "";
      });

      // Ativa terreno 3D se habilitado
      if (mapState.terreno3d) {
        map.setTerrain({
          source: "terrain-dem",
          exaggeration: mapState.exageracao3d,
        });
      }

      setMapLoaded(true);
    });

    // Clique no mapa para desenhar vértices de talhões
    map.on("click", (e) => {
      const state = useSarelStore.getState();
      if (state.modoDesenhoAtivo) {
        state.adicionarVerticeDesenho([e.lngLat.lng, e.lngLat.lat]);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Alternador de Basemap Opacity
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    const isGoogleEarth = mapState.basemap === "google-earth";
    const isGoogleHybrid = mapState.basemap === "google-hybrid";
    const isEsriSat = mapState.basemap === "satellite" || mapState.basemap === "mapbox-hd";
    const isTopo = mapState.basemap === "topo";
    const isDark = mapState.basemap === "dark" || mapState.basemap === "voyager";

    if (map.getLayer("google-earth-layer")) {
      map.setPaintProperty(
        "google-earth-layer",
        "raster-opacity",
        isGoogleEarth ? 1.0 : 0.0
      );
    }
    if (map.getLayer("google-hybrid-layer")) {
      map.setPaintProperty(
        "google-hybrid-layer",
        "raster-opacity",
        isGoogleHybrid ? 1.0 : 0.0
      );
    }
    if (map.getLayer("esri-satellite-layer")) {
      map.setPaintProperty(
        "esri-satellite-layer",
        "raster-opacity",
        isEsriSat ? 1.0 : 0.0
      );
    }
    if (map.getLayer("osm-topo-layer")) {
      map.setPaintProperty(
        "osm-topo-layer",
        "raster-opacity",
        isTopo ? 1.0 : 0.0
      );
    }
    if (map.getLayer("carto-dark-layer")) {
      map.setPaintProperty(
        "carto-dark-layer",
        "raster-opacity",
        isDark ? 1.0 : 0.0
      );
    }
  }, [mapState.basemap, mapLoaded]);

  // Atualização do Relevo DEM 3D
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (mapState.terreno3d) {
      map.setTerrain({
        source: "terrain-dem",
        exaggeration: mapState.exageracao3d,
      });
    } else {
      map.setTerrain(null as any);
    }
  }, [mapState.terreno3d, mapState.exageracao3d, mapLoaded]);

  // Visibilidade de Camadas (Macrobacias)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (map.getLayer("parana-basins-fill")) {
      map.setLayoutProperty(
        "parana-basins-fill",
        "visibility",
        mapState.mostrarBacias ? "visible" : "none"
      );
    }
    if (map.getLayer("parana-basins-line")) {
      map.setLayoutProperty(
        "parana-basins-line",
        "visibility",
        mapState.mostrarBacias ? "visible" : "none"
      );
    }
  }, [mapState.mostrarBacias, mapLoaded]);

  // Visibilidade de Camadas (Sítios Padrão-Ouro — Céu Azul e Medianeira)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    const vis = mapState.mostrarSitiosPadraoOuro !== false ? "visible" : "none";

    if (map.getLayer("sitios-padrao-ouro-fill")) {
      map.setLayoutProperty("sitios-padrao-ouro-fill", "visibility", vis);
    }
    if (map.getLayer("sitios-padrao-ouro-line")) {
      map.setLayoutProperty("sitios-padrao-ouro-line", "visibility", vis);
    }
  }, [mapState.mostrarSitiosPadraoOuro, mapLoaded]);

  // Atualização de Áreas e Polígonos de Amostragem Persistentes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource(
      "areas-estudo-source"
    ) as maplibregl.GeoJSONSource;
    if (!source) return;

    // Filtra apenas áreas marcadas como ATIVAS
    const areasAtivas = areas.filter((a) => a.ativa);

    const features: GeoJSON.Feature[] = areasAtivas.map((a) => ({
      type: "Feature",
      id: a.id,
      properties: {
        id: a.id,
        nome: a.nome,
        tipo: a.tipo,
        cor: a.cor || "#10B981",
      },
      geometry: a.geometry,
    }));

    source.setData({
      type: "FeatureCollection",
      features,
    });
  }, [areas, mapLoaded]);

  // Atualização do Desenho em Progresso
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource(
      "desenho-progresso-source"
    ) as maplibregl.GeoJSONSource;
    if (!source) return;

    const features: GeoJSON.Feature[] = [];

    poligonoDesenhando.forEach((pt) => {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: pt },
        properties: {},
      });
    });

    if (poligonoDesenhando.length >= 2) {
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: poligonoDesenhando,
        },
        properties: {},
      });
    }

    source.setData({
      type: "FeatureCollection",
      features,
    });
  }, [poligonoDesenhando, mapLoaded]);

  // Atualização dos Pontos Amostrais no Mapa
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource(
      "pontos-amostrais-source"
    ) as maplibregl.GeoJSONSource;
    if (!source) return;

    const features: GeoJSON.Feature[] = pontosVisiveis.map((p) => ({
      type: "Feature",
      id: p.id,
      properties: {
        id: p.id,
        codigo: p.codigo,
        estratoId: p.estratoId,
        classeAmostral: p.classeAmostral ?? "indefinido",
        rotulado: !!p.rotulo,
        selecionado: p.id === pontoSelecionadoId,
      },
      geometry: {
        type: "Point",
        coordinates: [p.longitude, p.latitude],
      },
    }));

    source.setData({
      type: "FeatureCollection",
      features,
    });
  }, [pontosVisiveis, pontoSelecionadoId, mapLoaded]);

  // Animação de Câmera Fly-To
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !mapState.flyToTarget) return;

    const { lng, lat, zoom, pitch, bearing } = mapState.flyToTarget;

    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: zoom ?? 14,
      pitch: pitch ?? 50,
      bearing: bearing ?? 0,
      speed: 1.2,
      essential: true,
    });
  }, [mapState.flyToTarget, mapLoaded]);

  return (
    <div className="relative w-full h-full flex-1 bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {/* Contêiner WebGL MapLibre */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Barra de Ferramentas de Desenho Superior */}
      <DrawingToolbar />

      {/* Controles Flutuantes de Mapa */}
      <MapControls />

      {/* Legenda Metodológica de Classes Biofísicas (PPGTCA 2026) */}
      <div className="absolute bottom-6 left-6 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-1.5 pointer-events-auto select-none">
        <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
          Classes da Pesquisa (PPGTCA 2026)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm shrink-0" />
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Erosão (Classe 1)</span>
            <span className="text-[9px] text-slate-400 font-mono">BSI &gt; 0.10 | NDVI &lt; 0.40</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm shrink-0" />
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Controle / SPD (Classe 0)</span>
            <span className="text-[9px] text-slate-400 font-mono">BSI &lt; 0.00 | NDVI &gt; 0.65</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-sm shrink-0" />
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-600 dark:text-slate-400 text-[11px]">Em Avaliação</span>
            <span className="text-[9px] text-slate-400 font-mono">Transição / Sem dados</span>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800">
          <span className="w-3.5 h-2 rounded bg-cyan-500/30 border border-cyan-500 shrink-0" />
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-cyan-700 dark:text-cyan-400 text-[11px]">Sítios Padrão-Ouro</span>
            <span className="text-[9px] text-slate-400 font-mono">10-50 ha (VANT/Drone)</span>
          </div>
        </div>
      </div>

      {/* Pop-up Flutuante de Inspeção quando um Ponto está Selecionado */}
      {pontoSelecionado && (
        <PointPopup
          key={pontoSelecionado.id}
          point={pontoSelecionado}
          onClose={() => selecionarPonto(null)}
        />
      )}
    </div>
  );
};
