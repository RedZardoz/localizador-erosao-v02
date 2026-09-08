import { describe, it, expect, beforeEach } from "vitest";
import { useErosionStore } from "./useErosionStore";
import { ErosionPoint, SavedPointDataset } from "@/types/erosion";

const mockSamplePoints: ErosionPoint[] = [
  {
    id: "sample-1",
    code: "PR-2026-TEST-001",
    name: "Ponto Teste 1",
    latitude: -25.4284,
    longitude: -49.2733,
    slopePercent: 12.5,
    slopeDegrees: 7.1,
    bsi: 0.25,
    ndvi: 0.35,
    elevation: 910,
    municipality: "Curitiba",
    state: "PR",
    macroRegion: "Primeiro Planalto",
    watershed: "Rio Iguaçu",
    soilType: "Latossolo Vermelho Distroférrico",
    featureType: "Erosão Laminar Severa",
    severity: "Alta",
    estimatedSoilLoss: 85.4,
    priorityScore: 78,
    detectionDate: "2026-08-30",
    dataProvenance: "gee-screened",
  },
  {
    id: "sample-2",
    code: "PR-2026-TEST-002",
    name: "Ponto Teste 2",
    latitude: -25.25,
    longitude: -53.84,
    slopePercent: 18.0,
    slopeDegrees: 10.2,
    bsi: 0.42,
    ndvi: 0.2,
    elevation: 620,
    municipality: "Céu Azul",
    state: "PR",
    macroRegion: "Terceiro Planalto",
    watershed: "Rio Paraná",
    soilType: "Argissolo Vermelho-Amarelo",
    featureType: "Erosão Laminar Severa",
    severity: "Crítica",
    estimatedSoilLoss: 210.0,
    priorityScore: 92,
    detectionDate: "2026-08-30",
    dataProvenance: "gee-screened",
  },
];

describe("useErosionStore - SavedPointDataset (Salvar e Recarregar Focos)", () => {
  beforeEach(() => {
    useErosionStore.setState({
      allPoints: [],
      customPoints: [],
      savedDatasets: [],
      activeAOIPolygon: null,
      selectedPoint: null,
    });
  });

  it("salva a coleção de pontos atual no histórico de datasets com metadados", () => {
    useErosionStore.getState().setCustomPoints(mockSamplePoints);

    const datasetId = useErosionStore
      .getState()
      .saveDataset("Campanha Céu Azul - Teste", "Observação sobre 2 pontos de campo");

    const { savedDatasets } = useErosionStore.getState();
    expect(savedDatasets.length).toBe(1);
    expect(savedDatasets[0].id).toBe(datasetId);
    expect(savedDatasets[0].name).toBe("Campanha Céu Azul - Teste");
    expect(savedDatasets[0].description).toBe("Observação sobre 2 pontos de campo");
    expect(savedDatasets[0].pointsCount).toBe(2);
    expect(savedDatasets[0].points[0].code).toBe("PR-2026-TEST-001");
  });

  it("recarrega a coleção salva de volta no mapa e restaura os pontos ativos", () => {
    // 1. Cria e salva o dataset
    useErosionStore.getState().setCustomPoints(mockSamplePoints);
    const datasetId = useErosionStore.getState().saveDataset("Coleção Salva 1");

    // 2. Limpa o mapa
    useErosionStore.getState().setCustomPoints([]);
    expect(useErosionStore.getState().allPoints.length).toBe(0);

    // 3. Recarrega a coleção pelo ID
    useErosionStore.getState().loadDataset(datasetId);

    const { allPoints, customPoints } = useErosionStore.getState();
    expect(allPoints.length).toBe(2);
    expect(customPoints.length).toBe(2);
    expect(allPoints[1].municipality).toBe("Céu Azul");
  });

  it("exclui uma coleção salva pelo ID", () => {
    useErosionStore.getState().setCustomPoints(mockSamplePoints);
    const id1 = useErosionStore.getState().saveDataset("Coleção A");
    const id2 = useErosionStore.getState().saveDataset("Coleção B");

    expect(useErosionStore.getState().savedDatasets.length).toBe(2);

    useErosionStore.getState().deleteDataset(id1);
    const { savedDatasets } = useErosionStore.getState();
    expect(savedDatasets.length).toBe(1);
    expect(savedDatasets[0].id).toBe(id2);
  });

  it("importa um arquivo de projeto JSON válido e rejeita formato inválido", () => {
    const validDataset: SavedPointDataset = {
      id: "imported-001",
      name: "Coleção Importada Externa",
      description: "Importada de arquivo JSON",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pointsCount: 2,
      points: mockSamplePoints,
      source: "gee-screened",
    };

    useErosionStore.getState().importDataset(validDataset);
    expect(useErosionStore.getState().savedDatasets.length).toBe(1);
    expect(useErosionStore.getState().savedDatasets[0].name).toBe("Coleção Importada Externa");

    // Rejeição de arquivo mal formatado
    expect(() => {
      useErosionStore.getState().importDataset({} as any);
    }).toThrow();
  });

  it("re-sequencia novos pontos adicionados à seleção anterior com numeração contínua e códigos únicos", () => {
    // 1. Primeira triagem (Paraná: pontos 1 a 3)
    const initialBatch: ErosionPoint[] = [
      { ...mockSamplePoints[0], id: "CAND-1", code: "PR-CAND-001", name: "Candidato 001 - Curitiba" },
      { ...mockSamplePoints[0], id: "CAND-2", code: "PR-CAND-002", name: "Candidato 002 - Curitiba", latitude: -25.5 },
      { ...mockSamplePoints[0], id: "CAND-3", code: "PR-CAND-003", name: "Candidato 003 - Curitiba", latitude: -25.6 },
    ];
    useErosionStore.getState().applyCandidatePoints(initialBatch, true);
    expect(useErosionStore.getState().allPoints.length).toBe(3);

    // 2. Segunda triagem (Céu Azul: pontos gerados inicialmente como 001 e 002)
    const secondBatch: ErosionPoint[] = [
      { ...mockSamplePoints[1], id: "CAND-1", code: "PR-CAND-001", name: "Candidato 001 - Céu Azul", latitude: -25.25, longitude: -53.84 },
      { ...mockSamplePoints[1], id: "CAND-2", code: "PR-CAND-002", name: "Candidato 002 - Céu Azul", latitude: -25.26, longitude: -53.85 },
    ];

    // 3. Adiciona à seleção anterior (replace = false)
    useErosionStore.getState().applyCandidatePoints(secondBatch, false);

    const { allPoints } = useErosionStore.getState();
    expect(allPoints.length).toBe(5);

    // Verifica que os pontos de Céu Azul foram renumerados sequencialmente para 004 e 005
    expect(allPoints[0].code).toBe("PR-CAND-001");
    expect(allPoints[1].code).toBe("PR-CAND-002");
    expect(allPoints[2].code).toBe("PR-CAND-003");
    expect(allPoints[3].code).toBe("PR-CAND-004");
    expect(allPoints[3].name).toContain("Candidato 004 - Céu Azul");
    expect(allPoints[4].code).toBe("PR-CAND-005");
    expect(allPoints[4].name).toContain("Candidato 005 - Céu Azul");

    // Garante que todos os códigos e IDs são 100% únicos
    const codes = allPoints.map((p) => p.code);
    const ids = allPoints.map((p) => p.id);
    expect(new Set(codes).size).toBe(5);
    expect(new Set(ids).size).toBe(5);
  });

  it("substitui um ponto anulado (ex: caiu em floresta) garantindo que o novo herde exatamente o código e numeração", () => {
    const initialBatch: ErosionPoint[] = [
      { ...mockSamplePoints[0], id: "CAND-1", code: "PR-CAND-001", name: "Candidato 001 - Curitiba" },
      { ...mockSamplePoints[0], id: "CAND-2", code: "PR-CAND-002", name: "Candidato 002 - Curitiba", latitude: -25.5 },
      { ...mockSamplePoints[0], id: "CAND-3", code: "PR-CAND-003", name: "Candidato 003 - Curitiba", latitude: -25.6 },
    ];
    useErosionStore.getState().setCustomPoints(initialBatch);

    // Cria ponto substituto para o CAND-2 (PR-CAND-002) que caiu em floresta
    const replacementPoint: ErosionPoint = {
      ...initialBatch[1],
      id: "CAND-PR-NEW-002",
      code: "PR-CAND-002", // REGRA DE OURO
      name: "Candidato 002 - Curitiba",
      latitude: -25.75, // Novas coordenadas
      longitude: -49.5,
      bsi: 0.35,
      notes: "Ponto re-eleito em substituição ao alvo que caiu em floresta.",
    };

    useErosionStore.getState().replacePoint("CAND-2", replacementPoint);

    const { allPoints, selectedPoint } = useErosionStore.getState();
    expect(allPoints.length).toBe(3);
    expect(allPoints[1].id).toBe("CAND-PR-NEW-002");
    expect(allPoints[1].code).toBe("PR-CAND-002");
    expect(allPoints[1].latitude).toBe(-25.75);
    expect(allPoints[1].notes).toContain("Ponto re-eleito");
    expect(selectedPoint?.id).toBe("CAND-PR-NEW-002");
  });

  it("zera o mapa em tela removendo pontos, talhões e polígonos ativos com registro em log", () => {
    useErosionStore.getState().setCustomPoints(mockSamplePoints);
    useErosionStore.getState().setSelectedPoint(mockSamplePoints[0]);
    useErosionStore.getState().addDrawnPolygon({
      id: "POLY-1",
      name: "Talhão Teste",
      category: "Talhão Agrícola",
      areaHa: 10,
      areaM2: 100000,
      perimeterM: 1400,
      createdAt: new Date().toISOString(),
      geometry: { type: "Polygon", coordinates: [[[-53.84, -25.25], [-53.83, -25.25], [-53.83, -25.26], [-53.84, -25.25]]] },
    });

    expect(useErosionStore.getState().allPoints.length).toBe(2);
    expect(useErosionStore.getState().drawnPolygons.length).toBe(1);
    expect(useErosionStore.getState().selectedPoint).not.toBeNull();

    // Executa ação de zerar mapa
    useErosionStore.getState().clearMap();

    const state = useErosionStore.getState();
    expect(state.allPoints).toHaveLength(0);
    expect(state.customPoints).toHaveLength(0);
    expect(state.drawnPolygons).toHaveLength(0);
    expect(state.selectedPoint).toBeNull();
    expect(state.selectedPolygon).toBeNull();
    expect(state.activeAOIPolygon).toBeNull();
    expect(state.systemLogs.some((l) => l.message.includes("Mapa zerado"))).toBe(true);
  });

  it("abre e fecha o dossiê de auditoria científica atualizando activeModal e auditDossierPoint", () => {
    const point = mockSamplePoints[0];
    useErosionStore.getState().openAuditDossier(point);

    let state = useErosionStore.getState();
    expect(state.activeModal).toBe("audit-dossier");
    expect(state.auditDossierPoint).toEqual(point);
    expect(state.auditDossierPoint?.code).toBe("PR-2026-TEST-001");

    useErosionStore.getState().closeAuditDossier();
    state = useErosionStore.getState();
    expect(state.activeModal).toBeNull();
    expect(state.auditDossierPoint).toBeNull();
  });

  it("nao repovoa o mapa com dados sinteticos apos clearMap", () => {
    useErosionStore.getState().clearMap();
    const state = useErosionStore.getState();
    expect(state.allPoints).toHaveLength(0);
    expect(state.getFilteredPoints()).toHaveLength(0);
  });

  it("estado inicial nao contem nenhum ponto pre-carregado", () => {
    // Garante que o app nunca volte a abrir com dados que o usuario nao produziu
    expect(useErosionStore.getInitialState().allPoints).toHaveLength(0);
  });

  it("importDataset adiciona à lista e imediatamente carrega os pontos no mapa", () => {
    useErosionStore.getState().clearMap();
    expect(useErosionStore.getState().allPoints).toHaveLength(0);

    const datasetToImport: SavedPointDataset = {
      id: "import-auto-load",
      name: "Coleção Teste Imediata",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pointsCount: 2,
      points: mockSamplePoints,
    };

    useErosionStore.getState().importDataset(datasetToImport);

    const state = useErosionStore.getState();
    expect(state.savedDatasets.some((d) => d.id === "import-auto-load")).toBe(true);
    expect(state.allPoints).toHaveLength(2);
    expect(state.getFilteredPoints()).toHaveLength(2);
  });

  it("loadDataset sanitiza coordenadas em formato string e declividade > 100% sem filtrar pontos", () => {
    const rawPointsWithStringsAndHighSlope: any[] = [
      {
        id: "P-STR-1",
        code: "PR-STR-001",
        name: "Ponto Coordenada String",
        latitude: "-24.9555", // String ao invés de number
        longitude: "-53.4555",
        elevation: "650",
        slopePercent: 125.5, // > 100% (escarpa rochosa)
        bsi: 0.42,
        severity: "Crítica",
        municipality: "Cascavel",
      },
    ];

    useErosionStore.setState({
      savedDatasets: [
        {
          id: "ds-raw-strings",
          name: "Dados Brutos",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pointsCount: 1,
          points: rawPointsWithStringsAndHighSlope as any,
        },
      ],
    });

    useErosionStore.getState().loadDataset("ds-raw-strings");

    const state = useErosionStore.getState();
    expect(state.allPoints).toHaveLength(1);
    expect(typeof state.allPoints[0].latitude).toBe("number");
    expect(state.allPoints[0].latitude).toBe(-24.9555);
    expect(state.allPoints[0].slopePercent).toBe(125.5);

    // Garante que o filtro não descarta pontos com slope > 100%
    const filtered = state.getFilteredPoints();
    expect(filtered).toHaveLength(1);
  });

  it("armazena e atualiza a chave da CARTO Basemaps API", () => {
    expect(useErosionStore.getState().cartoApiKey).toBeDefined();

    useErosionStore.getState().setCartoApiKey("cb1_2x3h_1_2ea5f3dd6101b19d45d96074");
    expect(useErosionStore.getState().cartoApiKey).toBe("cb1_2x3h_1_2ea5f3dd6101b19d45d96074");

    useErosionStore.getState().setCartoApiKey("");
    expect(useErosionStore.getState().cartoApiKey).toBe("");
  });

  it("armazena e atualiza o token da Embrapa AgroAPI e alterna camadas Embrapa", () => {
    expect(useErosionStore.getState().embrapaToken).toBeDefined();

    useErosionStore.getState().setEmbrapaToken("Bearer eyJhbGciOi...");
    expect(useErosionStore.getState().embrapaToken).toBe("Bearer eyJhbGciOi...");

    // Alternar camadas Embrapa
    expect(useErosionStore.getState().mapState.showEmbrapaSolos).toBe(false);
    useErosionStore.getState().toggleLayer("showEmbrapaSolos");
    expect(useErosionStore.getState().mapState.showEmbrapaSolos).toBe(true);

    expect(useErosionStore.getState().mapState.showEmbrapaErodibilidade).toBe(false);
    useErosionStore.getState().toggleLayer("showEmbrapaErodibilidade");
    expect(useErosionStore.getState().mapState.showEmbrapaErodibilidade).toBe(true);
  });

  it("rastreia corretamente o estado de dados não salvos (hasUnsavedPoints)", () => {
    // 1. Inicialmente limpo
    useErosionStore.getState().clearMap();
    expect(useErosionStore.getState().hasUnsavedPoints).toBe(false);

    // 2. Ao carregar pontos customizados ou candidatos, hasUnsavedPoints vira true
    useErosionStore.getState().setCustomPoints(mockSamplePoints);
    expect(useErosionStore.getState().hasUnsavedPoints).toBe(true);

    // 3. Ao salvar no histórico de datasets, hasUnsavedPoints vira false
    useErosionStore.getState().saveDataset("Coleção Teste Salva");
    expect(useErosionStore.getState().hasUnsavedPoints).toBe(false);

    // 4. Ao aplicar candidatos de eleição, hasUnsavedPoints vira true
    useErosionStore.getState().applyCandidatePoints(mockSamplePoints, true);
    expect(useErosionStore.getState().hasUnsavedPoints).toBe(true);

    // 5. Ao zerar o mapa, hasUnsavedPoints é resetado para false
    useErosionStore.getState().clearMap();
    expect(useErosionStore.getState().hasUnsavedPoints).toBe(false);
  });

  it("identifica e bloqueia pontos sintéticos ou legados de testes", () => {
    const syntheticPoints: any[] = [
      { ...mockSamplePoints[0], dataProvenance: "mock" },
      { ...mockSamplePoints[0], dataProvenance: "synthetic" },
      { ...mockSamplePoints[0], id: "ERO-PR-042" },
      { ...mockSamplePoints[0], code: "PR-2026-042" },
      { ...mockSamplePoints[0], dataSource: "mock" },
    ];

    // setCustomPoints deve purgar todos os pontos sintéticos e manter apenas pontos reais
    useErosionStore.getState().setCustomPoints([...syntheticPoints, mockSamplePoints[0]]);
    const current = useErosionStore.getState().allPoints;
    expect(current).toHaveLength(1);
    expect(current[0].code).toBe(mockSamplePoints[0].code);

    // loadDataset recusa coleções compostas exclusivamente por pontos sintéticos
    useErosionStore.setState({
      savedDatasets: [
        {
          id: "ds-mock-legacy",
          name: "Coleção Legada de Testes",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          pointsCount: 2,
          points: syntheticPoints,
        },
      ],
      allPoints: [],
    });

    useErosionStore.getState().loadDataset("ds-mock-legacy");
    expect(useErosionStore.getState().allPoints).toHaveLength(0);
  });
});

