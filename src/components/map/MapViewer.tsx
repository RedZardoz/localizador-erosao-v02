"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useErosionStore, useFilteredPoints } from "@/lib/store/useErosionStore";
import { paranaBoundaryGeoJSON } from "@/data/paranaBoundary";
import { paranaBasinsGeoJSON } from "@/data/paranaBasins";
import { PointPopup } from "./PointPopup";
import { MapControls } from "./MapControls";
import { DrawingToolbar } from "../polygon/DrawingToolbar";
import { ErosionPoint } from "@/types/erosion";

export const MapViewer: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const {
    selectedPoint,
    setSelectedPoint,
    activeAOIPolygon,
    mapState,
    activeRegion,
    mapboxToken,
    drawnPolygons,
    activeDrawingMode,
    drawingPoints,
    addDrawingPoint,
    setSelectedPolygon,
    setActiveModal,
    activeCarPolygon,
  } = useErosionStore();

  const filteredPoints = useFilteredPoints();

  // Initialize MapLibre with Ultra-High Resolution (Zoom up to 22) and Global 3D DEM
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const sourcesConfig: any = {
      "esri-satellite": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 22,
        attribution: "Esri, Maxar, Earthstar Geographics",
      },
      "osm-topo": {
        type: "raster",
        tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        maxzoom: 18,
        attribution: "OpenTopoMap, OpenStreetMap",
      },
      "carto-dark": {
        type: "raster",
        tiles: ["https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"],
        tileSize: 256,
        maxzoom: 20,
        attribution: "CARTO, OpenStreetMap",
      },
      "terrain-dem": {
        type: "raster-dem",
        tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: 15,
      },
    };

    if (mapboxToken) {
      sourcesConfig["mapbox-satellite-hd"] = {
        type: "raster",
        tiles: [
          `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg90?access_token=${mapboxToken.trim()}`,
        ],
        tileSize: 512,
        maxzoom: 22,
        attribution: "© Mapbox, © Maxar",
      };
    }

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: sourcesConfig,
        layers: [
          {
            id: "esri-satellite-layer",
            type: "raster",
            source: "esri-satellite",
            paint: { "raster-opacity": 1.0 },
          },
          ...(mapboxToken
            ? [
                {
                  id: "mapbox-satellite-hd-layer",
                  type: "raster" as const,
                  source: "mapbox-satellite-hd",
                  paint: { "raster-opacity": 0.0 },
                },
              ]
            : []),
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
        sky: {
          "sky-color": "#0B0F17",
          "horizon-color": "#1E293B",
          "fog-color": "#0F172A",
        },
      },
      center: activeRegion.center,
      zoom: activeRegion.zoom,
      pitch: mapState.terrain3d ? 45 : 0,
      bearing: 0,
      maxPitch: 85,
      maxZoom: 22, // Permite aproximação ultra-profunda para visualização detalhada de sulcos e talhões
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    map.on("load", () => {
      mapRef.current = map;

      // Enable 3D Terrain
      if (mapState.terrain3d) {
        map.setTerrain({
          source: "terrain-dem",
          exaggeration: mapState.terrainExaggeration,
        });
      }

      // Add Boundary and Basins layers
      map.addSource("parana-boundary", {
        type: "geojson",
        data: paranaBoundaryGeoJSON,
      });

      map.addLayer({
        id: "parana-boundary-line",
        type: "line",
        source: "parana-boundary",
        paint: {
          "line-color": "#10B981",
          "line-width": 2.5,
          "line-dasharray": [2, 1],
          "line-opacity": 0.8,
        },
      });

      map.addSource("parana-basins", {
        type: "geojson",
        data: paranaBasinsGeoJSON,
      });

      map.addLayer({
        id: "parana-basins-fill",
        type: "fill",
        source: "parana-basins",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.15,
        },
      });

      map.addLayer({
        id: "parana-basins-line",
        type: "line",
        source: "parana-basins",
        paint: {
          "line-color": ["get", "color"],
          "line-width": 1.5,
          "line-opacity": 0.6,
        },
      });

      // Add custom AOI Polygon source
      map.addSource("custom-aoi", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "custom-aoi-fill",
        type: "fill",
        source: "custom-aoi",
        paint: { "fill-color": "#06B6D4", "fill-opacity": 0.25 },
      });

      map.addLayer({
        id: "custom-aoi-line",
        type: "line",
        source: "custom-aoi",
        paint: {
          "line-color": "#22D3EE",
          "line-width": 3,
          "line-dasharray": [3, 1],
        },
      });

      // Add Drawn Polygons Source & Layers
      map.addSource("drawn-polygons", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "drawn-polygons-fill",
        type: "fill",
        source: "drawn-polygons",
        paint: {
          "fill-color": [
            "match",
            ["get", "severity"],
            "Crítica",
            "#F43F5E",
            "Alta",
            "#F59E0B",
            "Moderada",
            "#EAB308",
            "#06B6D4",
          ],
          "fill-opacity": 0.35,
        },
      });

      map.addLayer({
        id: "drawn-polygons-line",
        type: "line",
        source: "drawn-polygons",
        paint: {
          "line-color": [
            "match",
            ["get", "severity"],
            "Crítica",
            "#FB7185",
            "Alta",
            "#FBBF24",
            "Moderada",
            "#FDE047",
            "#22D3EE",
          ],
          "line-width": 2.5,
        },
      });

      // Add CAR Official Property Polygon Source & Layers
      map.addSource("car-property-polygon", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "car-property-polygon-fill",
        type: "fill",
        source: "car-property-polygon",
        paint: {
          "fill-color": "#10B981", // Emerald-500
          "fill-opacity": 0.22,
        },
      });

      map.addLayer({
        id: "car-property-polygon-line",
        type: "line",
        source: "car-property-polygon",
        paint: {
          "line-color": "#34D399", // Emerald-400
          "line-width": 2.8,
          "line-opacity": 0.95,
        },
      });

      // Add Drawing in Progress Source & Layers
      map.addSource("drawing-in-progress", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "drawing-polygon-fill",
        type: "fill",
        source: "drawing-in-progress",
        paint: { "fill-color": "#22D3EE", "fill-opacity": 0.25 },
      });

      map.addLayer({
        id: "drawing-polygon-line",
        type: "line",
        source: "drawing-in-progress",
        paint: {
          "line-color": "#06B6D4",
          "line-width": 2.5,
          "line-dasharray": [2, 1],
        },
      });

      map.addLayer({
        id: "drawing-polygon-points",
        type: "circle",
        source: "drawing-in-progress",
        paint: {
          "circle-radius": 5,
          "circle-color": "#06B6D4",
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 2,
        },
      });

      // Add Points GeoJSON Source
      map.addSource("erosion-points", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // Heatmap Layer
      map.addLayer({
        id: "erosion-heatmap",
        type: "heatmap",
        source: "erosion-points",
        layout: {
          visibility: mapState.showHeatmap ? "visible" : "none",
        },
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "priorityScore"], 0, 0, 100, 1],
          "heatmap-intensity": 1.2,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0,0,0,0)",
            0.2,
            "#38BDF8",
            0.5,
            "#FACC15",
            0.8,
            "#F97316",
            1,
            "#EF4444",
          ],
          "heatmap-radius": 35,
          "heatmap-opacity": 0.8,
        },
      });

      // Point Glow Layer
      map.addLayer({
        id: "erosion-points-glow",
        type: "circle",
        source: "erosion-points",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            7,
            12,
            14,
            16,
            24,
          ],
          "circle-color": [
            "match",
            ["get", "severity"],
            "Crítica",
            "#F43F5E",
            "Alta",
            "#F59E0B",
            "#EAB308",
          ],
          "circle-opacity": 0.35,
          "circle-blur": 0.6,
        },
      });

      // Point Core Layer
      map.addLayer({
        id: "erosion-points-core",
        type: "circle",
        source: "erosion-points",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            3.5,
            12,
            6,
            16,
            9,
          ],
          "circle-color": [
            "match",
            ["get", "severity"],
            "Crítica",
            "#EF4444",
            "Alta",
            "#F97316",
            "#FACC15",
          ],
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 1.8,
          "circle-opacity": 1.0,
        },
      });

      // Click event on points
      const handlePointClick = (
        e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }
      ) => {
        if (useErosionStore.getState().activeDrawingMode) return;
        if (!e.features || e.features.length === 0) return;
        const feat = e.features[0];
        const pointProps = (feat.properties || {}) as any;
        const targetId = String(feat.id || pointProps.id || "");

        const livePoints = useErosionStore.getState().allPoints;
        // 1. Busca estrita por ID único do ponto
        let foundPoint = livePoints.find((p) => String(p.id) === targetId);

        // 2. Se não encontrar por ID, busca por proximidade geográfica exata das coordenadas do clique
        if (!foundPoint && feat.geometry && feat.geometry.type === "Point") {
          const coords = (feat.geometry as any).coordinates as [number, number];
          const [lng, lat] = coords;
          foundPoint = livePoints.find(
            (p) => Math.abs(p.latitude - lat) < 0.0001 && Math.abs(p.longitude - lng) < 0.0001
          );
        }

        if (foundPoint) {
          useErosionStore.getState().setSelectedPoint(foundPoint);
          useErosionStore.getState().flyToPoint(foundPoint);
        }
      };

      map.on("click", "erosion-points-core", handlePointClick);
      map.on("click", "erosion-points-glow", handlePointClick);

      // Click event on Drawn Polygons
      map.on("click", "drawn-polygons-fill", (e) => {
        if (useErosionStore.getState().activeDrawingMode) return;
        if (!e.features || e.features.length === 0) return;
        const polyId = e.features[0].id || e.features[0].properties?.id;
        const poly = useErosionStore.getState().drawnPolygons.find((p) => p.id === polyId);
        if (poly) {
          useErosionStore.getState().setSelectedPolygon(poly);
          useErosionStore.getState().setActiveModal("polygons");
        }
      });

      // Global Map Click handler (for polygon drawing)
      map.on("click", (e) => {
        const store = useErosionStore.getState();
        if (store.activeDrawingMode) {
          store.addDrawingPoint([e.lngLat.lng, e.lngLat.lat]);
        }
      });

      // Hover cursor
      map.on("mouseenter", "erosion-points-core", () => {
        if (!useErosionStore.getState().activeDrawingMode) map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "erosion-points-core", () => {
        if (!useErosionStore.getState().activeDrawingMode) map.getCanvas().style.cursor = "";
      });

      map.on("mouseenter", "drawn-polygons-fill", () => {
        if (!useErosionStore.getState().activeDrawingMode) map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "drawn-polygons-fill", () => {
        if (!useErosionStore.getState().activeDrawingMode) map.getCanvas().style.cursor = "";
      });

      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update cursor when drawing mode changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.getCanvas().style.cursor = activeDrawingMode ? "crosshair" : "";
  }, [activeDrawingMode]);

  // Update Points GeoJSON Source
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource("erosion-points") as maplibregl.GeoJSONSource;
    if (!source) return;

    source.setData({
      type: "FeatureCollection",
      features: filteredPoints
        .filter((p) => p && isFinite(Number(p.longitude)) && isFinite(Number(p.latitude)))
        .map((p) => ({
          type: "Feature",
          id: p.id,
          properties: {
            id: p.id,
            code: p.code,
            name: p.name,
            municipality: p.municipality,
            severity: p.severity,
            slopePercent: p.slopePercent,
            bsi: p.bsi,
            priorityScore: p.priorityScore,
            elevation: Number(p.elevation ?? 500),
          },
          geometry: {
            type: "Point",
            coordinates: [Number(p.longitude), Number(p.latitude)],
          },
        })),
    });
  }, [filteredPoints, mapLoaded]);

  // Update Drawn Polygons GeoJSON Source
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource("drawn-polygons") as maplibregl.GeoJSONSource;
    if (!source) return;

    source.setData({
      type: "FeatureCollection",
      features: drawnPolygons.map((p) => ({
        type: "Feature",
        id: p.id,
        properties: {
          id: p.id,
          name: p.name,
          category: p.category,
          severity: p.severity || "Nenhuma",
          areaHa: p.areaHa,
        },
        geometry: p.geometry,
      })),
    });
  }, [drawnPolygons, mapLoaded]);

  // Update CAR Official Property Polygon GeoJSON Source & Fit Bounds
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource("car-property-polygon") as maplibregl.GeoJSONSource;
    if (!source) return;

    if (activeCarPolygon) {
      source.setData({
        type: "FeatureCollection",
        features: [activeCarPolygon],
      });

      // Se houver bbox [minX, minY, maxX, maxY], ajusta suavemente o enquadramento da câmera
      if (activeCarPolygon.bbox && activeCarPolygon.bbox.length === 4) {
        const [minX, minY, maxX, maxY] = activeCarPolygon.bbox;
        mapRef.current.fitBounds(
          [
            [minX, minY],
            [maxX, maxY],
          ],
          { padding: 75, maxZoom: 16.5, duration: 1200 }
        );
      }
    } else {
      source.setData({ type: "FeatureCollection", features: [] });
    }
  }, [activeCarPolygon, mapLoaded]);

  // Update Drawing in Progress GeoJSON Source
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource("drawing-in-progress") as maplibregl.GeoJSONSource;
    if (!source) return;

    const features: GeoJSON.Feature[] = [];

    // Points vertices
    drawingPoints.forEach((pt) => {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: pt },
        properties: {},
      });
    });

    // Polygon line / fill if >= 2 points
    if (drawingPoints.length >= 2) {
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: drawingPoints,
        },
        properties: {},
      });
    }

    if (drawingPoints.length >= 3) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[...drawingPoints, drawingPoints[0]]],
        },
        properties: {},
      });
    }

    source.setData({ type: "FeatureCollection", features });
  }, [drawingPoints, mapLoaded]);

  // Update AOI Polygon source
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource("custom-aoi") as maplibregl.GeoJSONSource;
    if (!source) return;

    if (activeAOIPolygon) {
      source.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: activeAOIPolygon.id,
            properties: { name: activeAOIPolygon.name },
            geometry: activeAOIPolygon.geometry,
          },
        ],
      });
    } else {
      source.setData({ type: "FeatureCollection", features: [] });
    }
  }, [activeAOIPolygon, mapLoaded]);

  // Update Basemap Opacity (with Mapbox HD support)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    const isMapboxHd = mapState.basemap === "mapbox-hd";
    const satOpacity =
      mapState.basemap === "satellite" || mapState.basemap === "hybrid" ? 1.0 : 0.0;
    const mapboxHdOpacity = isMapboxHd ? 1.0 : 0.0;
    const topoOpacity = mapState.basemap === "topo" ? 1.0 : 0.0;
    const darkOpacity = mapState.basemap === "dark" ? 1.0 : 0.0;

    if (map.getLayer("esri-satellite-layer")) {
      map.setPaintProperty("esri-satellite-layer", "raster-opacity", satOpacity);
    }
    if (map.getLayer("mapbox-satellite-hd-layer")) {
      map.setPaintProperty("mapbox-satellite-hd-layer", "raster-opacity", mapboxHdOpacity);
    }
    if (map.getLayer("osm-topo-layer")) {
      map.setPaintProperty("osm-topo-layer", "raster-opacity", topoOpacity);
    }
    if (map.getLayer("carto-dark-layer")) {
      map.setPaintProperty("carto-dark-layer", "raster-opacity", darkOpacity);
    }
  }, [mapState.basemap, mapLoaded]);

  // Update Layers Visibility
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (map.getLayer("parana-boundary-line")) {
      map.setLayoutProperty(
        "parana-boundary-line",
        "visibility",
        mapState.showBoundary ? "visible" : "none"
      );
    }
    if (map.getLayer("parana-basins-fill")) {
      map.setLayoutProperty(
        "parana-basins-fill",
        "visibility",
        mapState.showBasins ? "visible" : "none"
      );
      map.setLayoutProperty(
        "parana-basins-line",
        "visibility",
        mapState.showBasins ? "visible" : "none"
      );
    }
    if (map.getLayer("erosion-heatmap")) {
      map.setLayoutProperty(
        "erosion-heatmap",
        "visibility",
        mapState.showHeatmap ? "visible" : "none"
      );
    }
  }, [mapState.showBoundary, mapState.showBasins, mapState.showHeatmap, mapLoaded]);

  // Update 3D Terrain & Exaggeration
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (mapState.terrain3d) {
      map.setTerrain({
        source: "terrain-dem",
        exaggeration: mapState.terrainExaggeration,
      });
    } else {
      map.setTerrain(null as any);
    }
  }, [mapState.terrain3d, mapState.terrainExaggeration, mapLoaded]);

  // Handle Fly-To camera movements
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !mapState.flyToTarget) return;

    const { lng, lat, zoom, pitch, bearing } = mapState.flyToTarget;

    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: zoom ?? 14,
      pitch: pitch ?? 60,
      bearing: bearing ?? 0,
      speed: 1.2,
      curve: 1.4,
      essential: true,
    });
  }, [mapState.flyToTarget, mapLoaded]);

  return (
    <div className="relative w-full h-full flex-1 bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {/* MapLibre WebGL Canvas Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Drawing Toolbar on Top */}
      <DrawingToolbar />

      {/* Map Overlays & Controls */}
      <MapControls />

      {/* Floating Inspector Popup when point is selected */}
      {selectedPoint && (
        <PointPopup key={selectedPoint.id} point={selectedPoint} onClose={() => setSelectedPoint(null)} />
      )}
    </div>
  );
};
