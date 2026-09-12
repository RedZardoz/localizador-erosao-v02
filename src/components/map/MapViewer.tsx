"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useSarelStore, usePontosVisiveis } from "@/store/useSarelStore";
import { MapControls } from "./MapControls";
import { DrawingToolbar } from "@/components/polygon/DrawingToolbar";
import { PointPopup } from "./PointPopup";
import { PARANA_BASINS_GEOJSON } from "@/lib/localizacao/bacias";

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
            id: "esri-satellite-layer",
            type: "raster",
            source: "esri-satellite",
            paint: { "raster-opacity": 1.0 },
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
            9,
            6,
          ],
          "circle-color": [
            "case",
            ["==", ["get", "rotulado"], true],
            "#059669",
            "#F59E0B",
          ],
          "circle-stroke-width": 2,
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
  }, []);

  // Alternador de Basemap Opacity
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    const satOpacity = mapState.basemap === "satellite" ? 1.0 : 0.0;
    const topoOpacity = mapState.basemap === "topo" ? 1.0 : 0.0;
    const darkOpacity = mapState.basemap === "dark" ? 1.0 : 0.0;

    if (map.getLayer("esri-satellite-layer")) {
      map.setPaintProperty("esri-satellite-layer", "raster-opacity", satOpacity);
    }
    if (map.getLayer("osm-topo-layer")) {
      map.setPaintProperty("osm-topo-layer", "raster-opacity", topoOpacity);
    }
    if (map.getLayer("carto-dark-layer")) {
      map.setPaintProperty("carto-dark-layer", "raster-opacity", darkOpacity);
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
