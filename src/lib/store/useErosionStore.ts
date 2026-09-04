import { useMemo } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  AOIPolygon,
  DrawnPolygon,
  ErosionPoint,
  FilterState,
  GcpCredentials,
  NewRegionRequest,
  RegionPreset,
  SavedPointDataset,
  SeverityLevel,
  SystemLog,
} from "@/types/erosion";
import { regionPresets } from "@/data/regionsData";
import { isPointInGeoJSON } from "../utils/geoUtils";

export type ModalType =
  | "settings"
  | "region"
  | "export"
  | "candidates"
  | "saved-datasets"
  | "polygons"
  | "data-manager"
  | "diagnostics"
  | "audit-dossier"
  | null;
export type BasemapType = "satellite" | "mapbox-hd" | "topo" | "dark" | "hybrid" | "voyager";

interface MapViewState {
  basemap: BasemapType;
  terrain3d: boolean;
  terrainExaggeration: number;
  showBasins: boolean;
  showBoundary: boolean;
  showHeatmap: boolean;
  flyToTarget: {
    lat: number;
    lng: number;
    zoom?: number;
    pitch?: number;
    bearing?: number;
    elevation?: number;
  } | null;
}

interface ErosionStoreState {
  // Data
  allPoints: ErosionPoint[];
  customPoints: ErosionPoint[];
  selectedPoint: ErosionPoint | null;
  activeRegion: RegionPreset;
  activeAOIPolygon: AOIPolygon | null;
  regionRequests: NewRegionRequest[];

  // Saved Datasets / Projetos Salvos
  savedDatasets: SavedPointDataset[];

  // Drawn Polygons & Talhões Delimitados
  drawnPolygons: DrawnPolygon[];
  selectedPolygon: DrawnPolygon | null;
  activeDrawingMode: boolean;
  drawingPoints: [number, number][];

  // Polígono CAR Oficial do Imóvel para visualização no mapa
  activeCarPolygon: any | null;
  setActiveCarPolygon: (feature: any | null) => void;

  // Logs e Diagnósticos do Sistema
  systemLogs: SystemLog[];

  // Filters
  filters: FilterState;

  // Map & Visualization
  mapState: MapViewState;

  // Credentials
  gcpCredentials: GcpCredentials | null;
  mapboxToken: string;
  googleMapsKey: string;
  cartoApiKey: string;
  credentialPersistMode: "session" | "local";
  // Sessão do Earth Engine no SERVIDOR (cookie httpOnly) — fonte de verdade de
  // se os cálculos reais estão disponíveis, não a presença de private_key no
  // cliente (que nunca mais é reenviada após a sessão ser criada).
  geeSessionActive: boolean;

  // UI Modals & Theme
  activeModal: ModalType;
  auditDossierPoint: ErosionPoint | null;
  sidebarCollapsed: boolean;
  theme: "dark" | "light";

  // Actions
  setCustomPoints: (points: ErosionPoint[]) => void;
  applyCandidatePoints: (candidates: ErosionPoint[], replace?: boolean) => void;
  setSelectedPoint: (point: ErosionPoint | null) => void;
  updatePointWithRealData: (pointId: string, patch: Partial<ErosionPoint>) => void;
  replacePoint: (oldPointId: string, newPoint: ErosionPoint) => void;
  removePoint: (pointId: string) => void;
  clearMap: () => void;
  setActiveRegion: (regionId: string) => void;
  setActiveAOIPolygon: (polygon: AOIPolygon | null) => void;
  addRegionRequest: (request: NewRegionRequest) => void;

  // Saved Datasets actions
  saveDataset: (name: string, description?: string) => string;
  loadDataset: (datasetId: string) => void;
  deleteDataset: (datasetId: string) => void;
  importDataset: (dataset: SavedPointDataset) => void;

  // Drawn Polygons & Talhões actions
  addDrawnPolygon: (polygon: DrawnPolygon) => void;
  updateDrawnPolygon: (id: string, patch: Partial<DrawnPolygon>) => void;
  removeDrawnPolygon: (id: string) => void;
  clearDrawnPolygons: () => void;
  setSelectedPolygon: (polygon: DrawnPolygon | null) => void;
  setDrawingMode: (active: boolean) => void;
  setDrawingPoints: (points: [number, number][]) => void;
  addDrawingPoint: (point: [number, number]) => void;

  // System Logs actions
  addSystemLog: (log: Omit<SystemLog, "id" | "timestamp">) => void;
  clearSystemLogs: () => void;

  // Theme actions
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;

  // Filter actions
  setSearchQuery: (query: string) => void;
  setSlopeRange: (min: number, max: number) => void;
  setBsiRange: (min: number, max: number) => void;
  toggleSeverity: (severity: SeverityLevel) => void;
  toggleWatershed: (watershed: string) => void;
  setTopN: (topN: number) => void;
  setSorting: (sortBy: FilterState["sortBy"], order?: FilterState["sortOrder"]) => void;
  resetFilters: () => void;

  // Map actions
  setBasemap: (basemap: BasemapType) => void;
  toggleTerrain3D: () => void;
  setTerrainExaggeration: (exaggeration: number) => void;
  toggleLayer: (layer: "showBasins" | "showBoundary" | "showHeatmap") => void;
  flyToLocation: (target: MapViewState["flyToTarget"]) => void;
  flyToPoint: (point: ErosionPoint) => void;

  // Credentials actions
  setGcpCredentials: (creds: GcpCredentials | null) => void;
  setMapboxToken: (token: string) => void;
  setGoogleMapsKey: (key: string) => void;
  setCartoApiKey: (key: string) => void;
  setCredentialPersistMode: (mode: "session" | "local") => void;
  setGeeSessionActive: (active: boolean) => void;

  // UI actions
  setActiveModal: (modal: ModalType) => void;
  openAuditDossier: (point: ErosionPoint) => void;
  closeAuditDossier: () => void;
  toggleSidebar: () => void;

  // Computed helper
  getFilteredPoints: () => ErosionPoint[];
}

const initialFilters: FilterState = {
  searchQuery: "",
  minSlope: 0,
  maxSlope: 500, // Permite escarpas e declividades acentuadas (>100%) sem ocultar pontos
  minBsi: -1.0,
  maxBsi: 1.0,
  selectedSeverities: ["Moderada", "Alta", "Crítica"],
  selectedWatersheds: [],
  selectedSoilTypes: [],
  selectedFeatureTypes: [],
  topN: 150, // Default to top 150 / all
  sortBy: "priority",
  sortOrder: "desc",
};

export const useErosionStore = create<ErosionStoreState>()(
  persist(
    (set, get) => ({
      // Data state (mapa abre vazio conforme auditoria — nunca preencher com dados inventados)
      allPoints: [],
      customPoints: [],
      selectedPoint: null,
      activeRegion: regionPresets[0],
      activeAOIPolygon: null,
      regionRequests: [],
      savedDatasets: [],

      // Drawn Polygons & Talhões Delimitados
      drawnPolygons: [],
      selectedPolygon: null,
      activeDrawingMode: false,
      drawingPoints: [],
      activeCarPolygon: null,

      // System Logs & Diagnóstico
      systemLogs: [
        {
          id: "log-system-init",
          timestamp: new Date().toISOString(),
          severity: "info",
          category: "Sistema",
          message: "Localizador de Erosão inicializado com sucesso.",
        },
      ],

      // Filters
      filters: initialFilters,

      // Map View
      mapState: {
        basemap: "satellite",
        terrain3d: true,
        terrainExaggeration: 1.5,
        showBasins: true,
        showBoundary: true,
        showHeatmap: false,
        flyToTarget: null,
      },

      // Credentials
      gcpCredentials: null,
      mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "",
      googleMapsKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
      cartoApiKey: process.env.NEXT_PUBLIC_CARTO_API_KEY || "",
      credentialPersistMode: "local",
      geeSessionActive: false,

      // UI
      activeModal: null,
      auditDossierPoint: null,
      sidebarCollapsed: false,
      theme: "dark",

      // Actions
      setCustomPoints: (points) =>
        set({
          customPoints: points,
          allPoints: points,
          selectedPoint: null,
        }),

      applyCandidatePoints: (candidates, replace = true) =>
        set((state) => {
          let nextPoints: ErosionPoint[] = [];

          if (replace) {
            nextPoints = candidates;
          } else {
            // Encontra o maior número sequencial existente para dar continuidade exata à numeração
            let maxSeq = 0;
            const existingCodes = new Set<string>();
            const existingCoordKeys = new Set<string>();

            for (const p of state.customPoints) {
              existingCodes.add(p.code);
              // Chave de coordenadas com 4 casas decimais (~11m) para evitar sobreposição duplicada idêntica
              existingCoordKeys.add(`${p.latitude.toFixed(4)},${p.longitude.toFixed(4)}`);

              const match = p.code.match(/(\d+)$/);
              if (match) {
                const n = parseInt(match[1], 10);
                if (!isNaN(n) && n > maxSeq) {
                  maxSeq = n;
                }
              }
            }

            if (maxSeq === 0) {
              maxSeq = state.customPoints.length;
            }

            // Sequencia os novos pontos garantindo códigos e IDs únicos
            let currentSeq = maxSeq;
            const resequenced: ErosionPoint[] = [];

            for (let i = 0; i < candidates.length; i++) {
              const cand = candidates[i];
              const coordKey = `${cand.latitude.toFixed(4)},${cand.longitude.toFixed(4)}`;
              // Se já existir exatamente neste ponto geográfico, pula para não duplicar
              if (existingCoordKeys.has(coordKey)) {
                continue;
              }
              existingCoordKeys.add(coordKey);

              currentSeq += 1;
              const paddedNum = String(currentSeq).padStart(3, "0");
              const statePrefix = cand.state || "PR";
              let newCode = `${statePrefix}-CAND-${paddedNum}`;

              while (existingCodes.has(newCode)) {
                currentSeq += 1;
                newCode = `${statePrefix}-CAND-${String(currentSeq).padStart(3, "0")}`;
              }
              existingCodes.add(newCode);

              const newId = `CAND-${statePrefix}-${Date.now()}-${i}-${paddedNum}`;
              const municipalityName = cand.municipality || "Paraná";

              resequenced.push({
                ...cand,
                id: newId,
                code: newCode,
                name: `Candidato ${paddedNum} - ${municipalityName}`,
              });
            }

            nextPoints = [...state.customPoints, ...resequenced];
          }

          return {
            customPoints: nextPoints,
            allPoints: nextPoints,
            dataSource: "custom",
            selectedPoint: null,
            filters: {
              ...state.filters,
              searchQuery: "",
              selectedWatersheds: [],
              minSlope: 0,
              maxSlope: 100,
              minBsi: -1.0,
              maxBsi: 1.0,
              selectedSeverities: ["Moderada", "Alta", "Crítica"],
              topN: Math.max(state.filters.topN, nextPoints.length, 500),
            },
          };
        }),

      setSelectedPoint: (point) => set({ selectedPoint: point, activeCarPolygon: null }),
      setActiveCarPolygon: (feature) => set({ activeCarPolygon: feature }),

      updatePointWithRealData: (pointId, patch) =>
        set((state) => {
          const applyPatch = (points: ErosionPoint[]) =>
            points.map((pt) => (pt.id === pointId ? { ...pt, ...patch } : pt));

          const nextAllPoints = applyPatch(state.allPoints);
          const nextCustomPoints = applyPatch(state.customPoints);

          return {
            allPoints: nextAllPoints,
            customPoints: nextCustomPoints,
            selectedPoint:
              state.selectedPoint?.id === pointId ? { ...state.selectedPoint, ...patch } : state.selectedPoint,
            auditDossierPoint:
              state.auditDossierPoint?.id === pointId ? { ...state.auditDossierPoint, ...patch } : state.auditDossierPoint,
          };
        }),

      // Substitui um ponto individual
      replacePoint: (oldPointId, newPoint) =>
        set((state) => {
          const replaceInArray = (list: ErosionPoint[]) =>
            list.map((p) =>
              p.id === oldPointId || p.code === newPoint.code ? newPoint : p
            );

          const nextAllPoints = replaceInArray(state.allPoints);
          const nextCustomPoints = replaceInArray(state.customPoints);

          return {
            allPoints: nextAllPoints,
            customPoints: nextCustomPoints,
            selectedPoint: newPoint,
          };
        }),

      // Remove um ponto individual
      removePoint: (pointId) =>
        set((state) => ({
          allPoints: state.allPoints.filter((p) => p.id !== pointId),
          customPoints: state.customPoints.filter((p) => p.id !== pointId),
          selectedPoint: state.selectedPoint?.id === pointId ? null : state.selectedPoint,
        })),

      // "Zerar Mapa": remove todos os pontos, talhões/polígonos e AOIs ativas da tela,
      // resetando os filtros e a seleção para deixar a área de trabalho totalmente limpa.
      clearMap: () =>
        set((state) => {
          const logEntry: SystemLog = {
            id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toISOString(),
            severity: "info",
            category: "Aplicação",
            message: "Mapa zerado pelo usuário (focos e talhões removidos da tela).",
          };
          return {
            allPoints: [],
            customPoints: [],
            selectedPoint: null,
            drawnPolygons: [],
            selectedPolygon: null,
            activeAOIPolygon: null,
            drawingMode: false,
            drawingPoints: [],
            filters: initialFilters,
            systemLogs: [logEntry, ...state.systemLogs],
          };
        }),

      setActiveRegion: (regionId) => {
        const found = regionPresets.find((r) => r.id === regionId);
        if (found) {
          set((state) => ({
            activeRegion: found,
            mapState: {
              ...state.mapState,
              flyToTarget: {
                lng: found.center[0],
                lat: found.center[1],
                zoom: found.zoom,
                pitch: found.pitch ?? 45,
                bearing: found.bearing ?? 0,
              },
            },
          }));
        }
      },

      setActiveAOIPolygon: (polygon) => set({ activeAOIPolygon: polygon }),

      addRegionRequest: (request) =>
        set((state) => ({
          regionRequests: [request, ...state.regionRequests],
        })),

      // Saved Datasets actions
      saveDataset: (name, description) => {
        const state = get();
        const currentPoints = state.allPoints.length > 0 ? state.allPoints : state.getFilteredPoints();
        const id = `dataset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newDataset: SavedPointDataset = {
          id,
          name: name.trim() || `Coleção de Focos - ${new Date().toLocaleDateString("pt-BR")}`,
          description: description?.trim() || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pointsCount: currentPoints.length,
          points: JSON.parse(JSON.stringify(currentPoints)),
          regionName: state.activeAOIPolygon?.name || state.activeRegion.name,
          aoiPolygon: state.activeAOIPolygon,
          filtersSnapshot: state.filters,
          source: currentPoints[0]?.dataProvenance || "custom",
        };

        set((prev) => ({
          savedDatasets: [newDataset, ...prev.savedDatasets.filter((d) => d.id !== newDataset.id)],
        }));

        return id;
      },

      loadDataset: (datasetId) => {
        const state = get();
        const target = state.savedDatasets.find((d) => d.id === datasetId);
        if (!target || !target.points || target.points.length === 0) return;

        // Sanitiza todos os pontos para garantir números reais, integridade e ausência de NaNs
        const points: ErosionPoint[] = target.points
          .filter((p) => p && typeof p.latitude !== "undefined" && typeof p.longitude !== "undefined")
          .map((p, idx) => ({
            ...p,
            id: p.id || `POINT-${idx + 1}`,
            code: p.code || `PR-PONT-${String(idx + 1).padStart(3, "0")}`,
            name: p.name || `Ponto ${idx + 1}`,
            latitude: Number(p.latitude),
            longitude: Number(p.longitude),
            elevation: Number(p.elevation ?? 500),
            slopePercent: Number(p.slopePercent ?? 15),
            slopeDegrees: Number(p.slopeDegrees ?? 8.5),
            bsi: Number(p.bsi ?? 0.3),
            ndvi: Number(p.ndvi ?? 0.35),
            severity: (p.severity || "Alta") as SeverityLevel,
            priorityScore: Number(p.priorityScore ?? 60),
            estimatedSoilLoss: Number(p.estimatedSoilLoss ?? 20),
            municipality: p.municipality || target.regionName || "Paraná",
            state: p.state || "PR",
            macroRegion: p.macroRegion || "Paraná",
            watershed: p.watershed || "Bacia Local",
            soilType: p.soilType || "Latossolo Vermelho",
            featureType: p.featureType || "Erosão Laminar",
            detectionDate: p.detectionDate || new Date().toISOString().slice(0, 10),
          }));

        if (points.length === 0) return;

        // Determina a região associada se houver correspondência
        let matchedRegion = state.activeRegion;
        if (target.regionName) {
          const found = regionPresets.find(
            (r) =>
              r.name.toLowerCase() === target.regionName?.toLowerCase() ||
              r.id.toLowerCase() === target.regionName?.toLowerCase()
          );
          if (found) matchedRegion = found;
        }

        set({
          allPoints: points,
          customPoints: points,
          activeRegion: matchedRegion,
          activeAOIPolygon: target.aoiPolygon || null,
          selectedPoint: null,
          activeModal: null,
          filters: {
            ...initialFilters,
            searchQuery: "",
            selectedWatersheds: [],
            minSlope: 0,
            maxSlope: 500,
            minBsi: -1.0,
            maxBsi: 1.0,
            selectedSeverities: ["Moderada", "Alta", "Crítica"],
            topN: Math.max(initialFilters.topN, points.length, 500),
          },
        });

        // Auto-fly seguro para enquadrar os pontos no mapa
        let minLat = 90;
        let maxLat = -90;
        let minLng = 180;
        let maxLng = -180;
        for (const p of points) {
          if (isFinite(p.latitude) && isFinite(p.longitude)) {
            if (p.latitude < minLat) minLat = p.latitude;
            if (p.latitude > maxLat) maxLat = p.latitude;
            if (p.longitude < minLng) minLng = p.longitude;
            if (p.longitude > maxLng) maxLng = p.longitude;
          }
        }

        if (minLat <= maxLat && minLng <= maxLng && minLat < 90) {
          get().flyToLocation({
            lat: (minLat + maxLat) / 2,
            lng: (minLng + maxLng) / 2,
            zoom: points.length > 50 ? 7.5 : 11,
            pitch: 45,
          });
        }

        get().addSystemLog({
          severity: "info",
          category: "Aplicação",
          message: `Coleção "${target.name}" (${points.length} focos) carregada no mapa com sucesso.`,
        });
      },

      deleteDataset: (datasetId) => {
        set((state) => ({
          savedDatasets: state.savedDatasets.filter((d) => d.id !== datasetId),
        }));
      },

      importDataset: (dataset) => {
        if (!dataset || !Array.isArray(dataset.points) || dataset.points.length === 0) {
          throw new Error("Arquivo de dataset inválido ou sem pontos de erosão.");
        }
        const id = dataset.id || `dataset-${Date.now()}`;
        const imported: SavedPointDataset = {
          ...dataset,
          id,
          pointsCount: dataset.points.length,
          updatedAt: new Date().toISOString(),
        };

        set((prev) => ({
          savedDatasets: [imported, ...prev.savedDatasets.filter((d) => d.id !== id)],
        }));

        // Carrega imediatamente a coleção importada no mapa
        get().loadDataset(id);
      },

      // Drawn Polygons & Talhões actions
      addDrawnPolygon: (poly) =>
        set((state) => ({
          drawnPolygons: [poly, ...state.drawnPolygons],
          selectedPolygon: poly,
          activeDrawingMode: false,
          drawingPoints: [],
        })),
      updateDrawnPolygon: (id, patch) =>
        set((state) => ({
          drawnPolygons: state.drawnPolygons.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          selectedPolygon:
            state.selectedPolygon?.id === id ? { ...state.selectedPolygon, ...patch } : state.selectedPolygon,
        })),
      removeDrawnPolygon: (id) =>
        set((state) => ({
          drawnPolygons: state.drawnPolygons.filter((p) => p.id !== id),
          selectedPolygon: state.selectedPolygon?.id === id ? null : state.selectedPolygon,
        })),
      clearDrawnPolygons: () =>
        set(() => ({
          drawnPolygons: [],
          selectedPolygon: null,
          activeDrawingMode: false,
          drawingPoints: [],
        })),
      setSelectedPolygon: (polygon) => set({ selectedPolygon: polygon }),
      setDrawingMode: (active) =>
        set({ activeDrawingMode: active, drawingPoints: [] }),
      setDrawingPoints: (points) => set({ drawingPoints: points }),
      addDrawingPoint: (point) =>
        set((state) => ({ drawingPoints: [...state.drawingPoints, point] })),

      // System Logs actions
      addSystemLog: (log) =>
        set((state) => ({
          systemLogs: [
            {
              ...log,
              id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              timestamp: new Date().toISOString(),
            },
            ...state.systemLogs.slice(0, 149), // Mantém até 150 registros mais recentes
          ],
        })),
      clearSystemLogs: () => set({ systemLogs: [] }),

      // Filter actions
      setSearchQuery: (query) =>
        set((state) => ({
          filters: { ...state.filters, searchQuery: query },
        })),

      setSlopeRange: (min, max) =>
        set((state) => ({
          filters: { ...state.filters, minSlope: min, maxSlope: max },
        })),

      setBsiRange: (min, max) =>
        set((state) => ({
          filters: { ...state.filters, minBsi: min, maxBsi: max },
        })),

      toggleSeverity: (sev) =>
        set((state) => {
          const current = state.filters.selectedSeverities;
          const updated = current.includes(sev)
            ? current.filter((s) => s !== sev)
            : [...current, sev];
          return {
            filters: { ...state.filters, selectedSeverities: updated },
          };
        }),

      toggleWatershed: (w) =>
        set((state) => {
          const current = state.filters.selectedWatersheds;
          const updated = current.includes(w)
            ? current.filter((item) => item !== w)
            : [...current, w];
          return {
            filters: { ...state.filters, selectedWatersheds: updated },
          };
        }),

      setTopN: (topN) =>
        set((state) => ({
          filters: { ...state.filters, topN },
        })),

      setSorting: (sortBy, order) =>
        set((state) => ({
          filters: {
            ...state.filters,
            sortBy,
            sortOrder: order || (state.filters.sortBy === sortBy && state.filters.sortOrder === "desc" ? "asc" : "desc"),
          },
        })),

      resetFilters: () =>
        set({
          filters: initialFilters,
          activeAOIPolygon: null,
        }),

      // Map actions
      setBasemap: (basemap) =>
        set((state) => ({
          mapState: { ...state.mapState, basemap },
        })),

      toggleTerrain3D: () =>
        set((state) => ({
          mapState: { ...state.mapState, terrain3d: !state.mapState.terrain3d },
        })),

      setTerrainExaggeration: (exaggeration) =>
        set((state) => ({
          mapState: { ...state.mapState, terrainExaggeration: exaggeration },
        })),

      toggleLayer: (layer) =>
        set((state) => ({
          mapState: { ...state.mapState, [layer]: !state.mapState[layer] },
        })),

      flyToLocation: (target) =>
        set((state) => ({
          mapState: { ...state.mapState, flyToTarget: target },
        })),

      flyToPoint: (point) =>
        set((state) => ({
          selectedPoint: point,
          mapState: {
            ...state.mapState,
            flyToTarget: {
              lng: point.longitude,
              lat: point.latitude,
              zoom: 15.5,
              pitch: 62,
              bearing: -20,
              elevation: point.elevation,
            },
          },
        })),

      // Credentials
      setGcpCredentials: (creds) => set({ gcpCredentials: creds }),
      setMapboxToken: (token) => set({ mapboxToken: token }),
      setGoogleMapsKey: (key) => set({ googleMapsKey: key }),
      setCartoApiKey: (key) => set({ cartoApiKey: key }),
      setCredentialPersistMode: (mode) => set({ credentialPersistMode: mode }),
      setGeeSessionActive: (active) => set({ geeSessionActive: active }),

      // UI
      setActiveModal: (modal) => set({ activeModal: modal }),
      openAuditDossier: (point) => set({ auditDossierPoint: point, activeModal: "audit-dossier" }),
      closeAuditDossier: () => set({ activeModal: null, auditDossierPoint: null }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),

      // Filtering logic
      getFilteredPoints: () => {
        const { allPoints, filters } = get();

        let result = allPoints.filter((pt) => {
          if (!pt) return false;

          // Search query (id, name, municipality, watershed, soil)
          if (filters.searchQuery && filters.searchQuery.trim()) {
            const q = filters.searchQuery.toLowerCase();
            const match =
              (pt.name || "").toLowerCase().includes(q) ||
              (pt.code || "").toLowerCase().includes(q) ||
              (pt.municipality || "").toLowerCase().includes(q) ||
              (pt.watershed || "").toLowerCase().includes(q) ||
              (pt.soilType || "").toLowerCase().includes(q) ||
              (pt.featureType || "").toLowerCase().includes(q);
            if (!match) return false;
          }

          // Slope (%) - tolera declividades acentuadas e ausentes
          if (typeof pt.slopePercent === "number" && !isNaN(pt.slopePercent)) {
            if (pt.slopePercent < filters.minSlope || pt.slopePercent > filters.maxSlope) {
              return false;
            }
          }

          // BSI (-1 to 1)
          if (typeof pt.bsi === "number" && !isNaN(pt.bsi)) {
            if (pt.bsi < filters.minBsi || pt.bsi > filters.maxBsi) {
              return false;
            }
          }

          // Severity (Tolerância a acentos, minúsculo ou Baixa)
          if (filters.selectedSeverities && filters.selectedSeverities.length > 0) {
            const s = (pt.severity || "").toLowerCase().trim();
            const matchesSeverity = filters.selectedSeverities.some((sel) => {
              const selLower = sel.toLowerCase();
              return selLower === s || (selLower === "crítica" && s === "critica");
            });
            // Se o ponto tiver severidade categorizada nos 3 níveis e não bater com as selecionadas, filtra
            if (pt.severity && !matchesSeverity && ["moderada", "alta", "crítica", "critica"].includes(s)) {
              return false;
            }
          }

          // Watershed
          if (filters.selectedWatersheds && filters.selectedWatersheds.length > 0) {
            if (pt.watershed && !filters.selectedWatersheds.includes(pt.watershed)) {
              return false;
            }
          }

          return true;
        });

        // Sorting seguro sem exceções
        result.sort((a, b) => {
          let comparison = 0;
          switch (filters.sortBy) {
            case "priority":
              comparison = (a.priorityScore ?? 0) - (b.priorityScore ?? 0);
              break;
            case "bsi":
              comparison = (a.bsi ?? 0) - (b.bsi ?? 0);
              break;
            case "slope":
              comparison = (a.slopePercent ?? 0) - (b.slopePercent ?? 0);
              break;
            case "soilLoss":
              comparison = (a.estimatedSoilLoss ?? 0) - (b.estimatedSoilLoss ?? 0);
              break;
            case "municipality":
              comparison = (a.municipality || "").localeCompare(b.municipality || "");
              break;
            default:
              comparison = (a.priorityScore ?? 0) - (b.priorityScore ?? 0);
          }
          return filters.sortOrder === "desc" ? -comparison : comparison;
        });

        // Limit to Top N if set (> 0)
        if (filters.topN > 0 && result.length > filters.topN) {
          result = result.slice(0, filters.topN);
        }

        return result;
      },
    }),
    {
      name: "localizador-erosao-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // IMPORTANTE (segurança): a private_key RSA da Service Account NUNCA é
        // persistida em localStorage, mesmo no modo "local" — ficaria em texto
        // plano, acessível a qualquer script (XSS) e sobrevivendo indefinidamente
        // no disco do usuário. Persistimos apenas metadados não sensíveis; a
        // chave em si vive somente em memória (estado não persistido) e precisa
        // ser recarregada a cada nova sessão do navegador. Ver
        // PROMPT_IMPLEMENTACAO_SENIOR.md, item "Sessão de credenciais no servidor",
        // para a solução definitiva (sessão httpOnly no servidor).
        gcpCredentials:
          state.credentialPersistMode === "local" && state.gcpCredentials
            ? { ...state.gcpCredentials, private_key: "" }
            : null,
        mapboxToken: state.credentialPersistMode === "local" ? state.mapboxToken : "",
        googleMapsKey: state.credentialPersistMode === "local" ? state.googleMapsKey : "",
        cartoApiKey: state.credentialPersistMode === "local" ? state.cartoApiKey : "",
        credentialPersistMode: state.credentialPersistMode,
        savedDatasets: state.savedDatasets,
        drawnPolygons: state.drawnPolygons,
        allPoints: state.allPoints,
        customPoints: state.customPoints,
        activeAOIPolygon: state.activeAOIPolygon,
        regionRequests: state.regionRequests,
        theme: state.theme,
        mapState: {
          basemap: state.mapState.basemap,
          terrain3d: state.mapState.terrain3d,
          terrainExaggeration: state.mapState.terrainExaggeration,
          showBasins: state.mapState.showBasins,
          showBoundary: state.mapState.showBoundary,
          showHeatmap: state.mapState.showHeatmap,
          flyToTarget: null,
        },
      }),
      version: 2,
      migrate: (persisted: any, fromVersion: number) => {
        if (!persisted || fromVersion >= 2) return persisted;

        // Identifica resíduo sintético da v1: proveniência "mock" ou o padrão de ID do gerador
        // removido (ERO-PR-001 … ERO-PR-150, com code PR-2026-NNN).
        const isSynthetic = (p: any) =>
          p?.dataProvenance === "mock" ||
          (typeof p?.id === "string" && /^ERO-PR-\d{3}$/.test(p.id));

        const purge = (arr: any) => (Array.isArray(arr) ? arr.filter((p) => !isSynthetic(p)) : []);

        const cleaned = {
          ...persisted,
          allPoints: purge(persisted.allPoints),
          customPoints: purge(persisted.customPoints),
          savedDatasets: Array.isArray(persisted.savedDatasets)
            ? persisted.savedDatasets
                .filter((d: any) => d?.source !== "mock")
                .map((d: any) => ({ ...d, points: purge(d.points) }))
                .filter((d: any) => !Array.isArray(d.points) || d.points.length > 0)
            : [],
        };

        // Remove chaves da v1 que não existem mais no estado
        delete cleaned.currentMockPoints;
        delete cleaned.dataSource;

        return cleaned;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Se o mapa está vazio mas existe uma coleção salva pelo usuário, recarrega a mais recente.
        // Nunca preencher o mapa com dados que o usuário não produziu ou importou.
        if (state.allPoints.length === 0 && state.savedDatasets?.length > 0) {
          state.loadDataset(state.savedDatasets[0].id);
        }
      },
    }
  )
);

/**
 * Hook reativo seguro e memoizado para obter os pontos filtrados
 * sem causar re-renderizações circulares no Zustand / React.
 */
export function useFilteredPoints(): ErosionPoint[] {
  const allPoints = useErosionStore((s) => s.allPoints);
  const filters = useErosionStore((s) => s.filters);
  const activeAOIPolygon = useErosionStore((s) => s.activeAOIPolygon);
  const getFilteredPoints = useErosionStore((s) => s.getFilteredPoints);

  return useMemo(() => {
    return getFilteredPoints();
  }, [allPoints, filters, activeAOIPolygon, getFilteredPoints]);
}

