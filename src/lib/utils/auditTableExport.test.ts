import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { ErosionPoint } from "@/types/erosion";
import {
  AUDIT_TABLE_HEADERS,
  resolveBlockF,
  translateDataProvenance,
  formatRusleMemory,
  exportAuditTableCSV,
  exportAuditTableXLSX,
  generateAuditTableFileName,
  AuditTableMetadata,
} from "./auditTableExport";

const samplePoint: ErosionPoint = {
  id: "point-001",
  code: "FOC-001",
  name: "Fazenda Santa Maria",
  latitude: -23.55052,
  longitude: -51.46083,
  elevation: 620,
  slopePercent: 12.5,
  slopeDegrees: 7.1,
  bsi: 0.3542,
  ndvi: 0.1823,
  municipality: "Apucarana",
  state: "PR",
  macroRegion: "Norte Central",
  watershed: "Rio Ivaí",
  soilType: "Latossolo Vermelho Distroférrico",
  featureType: "Erosão Laminar Severa",
  severity: "Crítica",
  estimatedSoilLoss: 107.7,
  priorityScore: 92,
  detectionDate: "2026-08-30",
  notes: "Observação inicial; risco de assoreamento",
  dataProvenance: "gee-screened",
  calcEngineVersion: "2026-08-30-slope-fix",
  geeSourceImageId: "COPERNICUS/S2_SR/20260830T132231",
  geeComputedAt: "2026-08-30T15:00:00Z",
  stratumId: "A1",
  stratumName: "Declividade > 10% x Solo Frágil",
  rusleFactors: {
    r: 5487.2,
    k: 0.032,
    ls: 3.41,
    c: 0.18,
    p: 1.0,
  },
  carCode: "PR-4101403-000123",
  propertyName: "Fazenda Santa Maria",
  ownerName: "ATAYDE ********************",
  ownerDocumentMasked: "***.456.789-**",
  incraRegistry: "950.041.054.123-1",
  propertyAreaHa: 245.8,
  tenureStatus: "encontrado",
  tenureUf: "PR",
  tenureQueryDate: "2026-09-03",
  tenureAssociationCriterion: "ponto-contido",
  sicarSourceFile: "AREA_IMOVEL_PR.zip",
  sicarBaseDate: "2026-09-02",
  sigefSourceFile: "Sigef Brasil_PR.zip",
  sigefBaseDate: "2026-09-03",
  sncrSourceFile: "Imoveis_PR_01_09_2026.csv",
  sncrBaseDate: "2026-09-01",
};

const dummyMeta: AuditTableMetadata = {
  isFiltered: true,
  totalLoaded: 150,
  exportedCount: 1,
  activeRegion: "PR - Norte Central",
  activeSeverities: ["Crítica", "Alta"],
  topN: 50,
  aoiName: "talhoes_fazenda_sm.geojson",
  fontesDados: [
    {
      sistema: "SICAR",
      uf: "PR",
      arquivo_origem: "AREA_IMOVEL_PR.zip",
      data_base: "2026-09-02",
      total_registros: 559899,
    },
    {
      sistema: "SIGEF",
      uf: "PR",
      arquivo_origem: "Sigef Brasil_PR.zip",
      data_base: "2026-09-03",
      total_registros: 170046,
    },
    {
      sistema: "SNCR",
      uf: "PR",
      arquivo_origem: "Imoveis_PR_01_09_2026.csv",
      data_base: "2026-09-01",
      total_registros: 957183,
    },
  ],
};

describe("Exportação da Tabela Consolidada de Laudos (CSV & XLSX)", () => {
  // Teste 1: Cabeçalho estável
  it("1. deve manter o cabeçalho estável com 54 colunas na ordem exata dos blocos A a H", () => {
    const expectedHeaders = [
      // A. Identificação
      "Codigo",
      "Nome",
      "ID_Interno",
      "Data_Deteccao",
      "Estrato_ID",
      "Estrato_Descricao",
      // B. Localização
      "Latitude",
      "Longitude",
      "Latitude_DMS",
      "Longitude_DMS",
      "Altitude_m",
      "Municipio",
      "UF",
      "Macrorregiao",
      "Bacia_Hidrografica",
      // C. Terreno e assinatura espectral
      "Declividade_Pct",
      "Declividade_Graus",
      "BSI_Solo_Exposto",
      "NDVI_Vigor_Vegetal",
      // D. Classificação e resultado
      "Tipo_Solo",
      "Tipologia_Feicao",
      "Severidade",
      "Score_Prioridade",
      "Perda_Solo_t_ha_ano",
      // E. Fatores RUSLE
      "Fator_R_Erosividade",
      "Fator_K_Erodibilidade",
      "Fator_LS_Topografico",
      "Fator_C_Cobertura",
      "Fator_P_Praticas",
      "RUSLE_Memoria_Calculo",
      // F. Identificação fundiária
      "Status_Consulta_Fundiaria",
      "Denominacao_Imovel",
      "Codigo_CAR",
      "Titular_SNCR",
      "Documento_Mascarado",
      "Registro_INCRA_SNCR",
      "Area_Imovel_ha",
      // G. Proveniência e cadeia de consulta
      "Origem_Dado",
      "Cena_Sentinel2",
      "Data_Calculo_GEE",
      "Versao_Motor_Calculo",
      "Campos_Estimados",
      "Criterio_Associacao_Fundiaria",
      "UF_Consultada",
      "Data_Consulta_Fundiaria",
      "SICAR_Arquivo",
      "SICAR_Data_Base",
      "SIGEF_Arquivo",
      "SIGEF_Data_Base",
      "SNCR_Arquivo",
      "SNCR_Data_Base",
      // H. Validação de campo e notas
      "Validado_Campo_Em",
      "Observacoes_Campo",
      "Observacoes",
    ];

    expect(AUDIT_TABLE_HEADERS.length).toBe(54);
    expect(AUDIT_TABLE_HEADERS).toEqual(expectedHeaders);
  });

  // Teste 2: Nenhuma célula vazia no bloco fundiário para todos os 5 status
  it("2. não deve deixar nenhuma célula textual em branco no bloco fundiário para os 5 valores de tenureStatus", () => {
    const statuses: Array<ErosionPoint["tenureStatus"]> = [
      "encontrado",
      "aproximado",
      "sem-correspondencia",
      "base-nao-disponivel",
      undefined,
    ];

    for (const status of statuses) {
      const pt: ErosionPoint = {
        ...samplePoint,
        tenureStatus: status,
        propertyName: undefined,
        carCode: undefined,
        ownerName: undefined,
        ownerDocumentMasked: undefined,
        incraRegistry: undefined,
        propertyAreaHa: undefined,
        tenureUf: status === "base-nao-disponivel" ? "MT" : undefined,
      };

      const res = resolveBlockF(pt);

      expect(res.statusConsulta.trim().length).toBeGreaterThan(0);
      expect(res.denominacao.trim().length).toBeGreaterThan(0);
      expect(res.codigoCar.trim().length).toBeGreaterThan(0);
      expect(res.titularSncr.trim().length).toBeGreaterThan(0);
      expect(res.documentoMascarado.trim().length).toBeGreaterThan(0);
      expect(res.registroIncra.trim().length).toBeGreaterThan(0);

      // Verificação dos tokens periciais específicos
      if (status === "sem-correspondencia") {
        expect(res.statusConsulta).toBe("Sem correspondência — nenhum imóvel nesta coordenada");
        expect(res.denominacao).toBe("Sem correspondência");
        expect(res.codigoCar).toBe("Sem correspondência");
        expect(res.titularSncr).toBe("Sem correspondência");
      } else if (status === "base-nao-disponivel") {
        expect(res.statusConsulta).toBe("Base de MT não disponível nesta instalação");
        expect(res.denominacao).toBe("Base não consultada");
        expect(res.codigoCar).toBe("Base não consultada");
        expect(res.titularSncr).toBe("Base não consultada");
      } else if (!status) {
        expect(res.statusConsulta).toBe("Consulta não realizada");
        expect(res.denominacao).toBe("Consulta não realizada");
        expect(res.codigoCar).toBe("Consulta não realizada");
        expect(res.titularSncr).toBe("Consulta não realizada");
      }
    }
  });

  // Teste 3: Titular preservado byte a byte
  it("3. deve preservar o titular do SNCR byte a byte com a máscara oficial intacta", () => {
    const mascaraOficial = "ATAYDE ********************";
    const pt: ErosionPoint = {
      ...samplePoint,
      ownerName: mascaraOficial,
      tenureStatus: "encontrado",
    };

    const blockF = resolveBlockF(pt);
    expect(blockF.titularSncr).toBe(mascaraOficial);

    const csv = exportAuditTableCSV([pt]);
    expect(csv).toContain(mascaraOficial);
  });

  // Teste 4: Ausente não vira zero
  it("4. nunca deve produzir 0 em Area_Imovel_ha quando o imóvel não tiver área informada", () => {
    const ptSemArea: ErosionPoint = {
      ...samplePoint,
      propertyAreaHa: undefined,
      tenureStatus: "encontrado",
    };

    const blockF = resolveBlockF(ptSemArea);
    expect(blockF.areaImovelHa).toBeNull();

    const csv = exportAuditTableCSV([ptSemArea]);
    const lines = csv.split("\r\n");
    const dataCols = lines[1].split(";");
    const idxArea = AUDIT_TABLE_HEADERS.indexOf("Area_Imovel_ha");

    // A célula deve ser vazia, NUNCA '0' ou '0,00'
    expect(dataCols[idxArea]).toBe("");
    expect(dataCols[idxArea]).not.toBe("0");
    expect(dataCols[idxArea]).not.toBe("0,00");
  });

  // Teste 5: PROVENIÊNCIA NÃO DECLARADA quando dataProvenance for ausente
  it("5. deve produzir 'PROVENIÊNCIA NÃO DECLARADA' quando dataProvenance for undefined", () => {
    expect(translateDataProvenance(undefined)).toBe("PROVENIÊNCIA NÃO DECLARADA");
    expect(translateDataProvenance("satellite-derived")).toBe("Calculado via satélite / DEM (Google Earth Engine)");
    expect(translateDataProvenance("gee-screened")).toBe("Candidato triado no Earth Engine (variáveis físicas reais)");
    expect(translateDataProvenance("field-validated")).toBe("Validado em campo (GNSS RTK / VANT)");
    expect(translateDataProvenance("user-upload")).toBe("Importado pelo usuário — valores conforme arquivo de origem");

    const ptSemProv: ErosionPoint = {
      ...samplePoint,
      dataProvenance: undefined,
    };
    const csv = exportAuditTableCSV([ptSemProv]);
    expect(csv).toContain("PROVENIÊNCIA NÃO DECLARADA");
  });

  // Teste 6: Escape de XML gera XLSX válido e sem erros de parse
  it("6. deve escapar caracteres XML especiais gerando um XLSX válido com duas abas", async () => {
    const ptEspecial: ErosionPoint = {
      ...samplePoint,
      name: "Fazenda A & B <teste>",
      propertyName: 'Estância do "Sol" & Água',
      notes: "Caracteres perigosos: < > & ' \"",
    };

    const blob = await exportAuditTableXLSX([ptEspecial], dummyMeta);
    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(1000);

    const arrayBuffer = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const sheet1Xml = await zip.file("xl/worksheets/sheet1.xml")?.async("string");
    const sheet2Xml = await zip.file("xl/worksheets/sheet2.xml")?.async("string");
    const workbookXml = await zip.file("xl/workbook.xml")?.async("string");

    expect(sheet1Xml).toBeDefined();
    expect(sheet2Xml).toBeDefined();
    expect(workbookXml).toBeDefined();

    // Verifica que as entidades XML foram devidamente escapadas
    expect(sheet1Xml).toContain("Fazenda A &amp; B &lt;teste&gt;");
    expect(sheet1Xml).toContain("Estância do &quot;Sol&quot; &amp; Água");

    // Verifica que ambas as abas existem no workbook
    expect(workbookXml).toContain('name="Dados"');
    expect(workbookXml).toContain('name="Procedência e Conformidade"');

    // Verifica que o painel de congelamento e autofiltro estão presentes
    expect(sheet1Xml).toContain('state="frozen"');
    expect(sheet1Xml).toContain('<autoFilter ref="A1:BB1"/>');
  });

  // Teste 7: BOM no CSV
  it("7. deve incluir o caractere UTF-8 BOM no início da string CSV para o Excel em português", () => {
    const csv = exportAuditTableCSV([samplePoint]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  // Teste 8: Delimitador e formato decimal
  it("8. deve usar ponto e vírgula como delimitador, vírgula decimal e aspas em campos com delimitador", () => {
    const pt: ErosionPoint = {
      ...samplePoint,
      latitude: -25.4372,
      estimatedSoilLoss: 107.7,
      notes: "Foco A; Foco B",
    };

    const csv = exportAuditTableCSV([pt]);
    const lines = csv.split("\r\n");
    expect(lines.length).toBe(2);

    const row = lines[1];
    // O campo com ';' deve estar citado com aspas
    expect(row).toContain('"Foco A; Foco B"');

    // As coordenadas e perda de solo devem estar com vírgula decimal
    expect(row).toContain("-25,437200");
    expect(row).toContain("107,70");

    // Memória de cálculo da RUSLE no padrão oficial
    const rusleMem = formatRusleMemory(pt, ",");
    expect(rusleMem).toBe("A = 5487,2 × 0,0320 × 3,41 × 0,180 × 1,00 = 107,7");
    expect(row).toContain(rusleMem);
  });

  // Teste extra: Nome do arquivo normalizado
  it("deve gerar o nome do arquivo sanitizado conforme especificação", () => {
    const fileNameXlsx = generateAuditTableFileName("PR - Noroeste (Arenito Caiuá)", 47, "xlsx");
    expect(fileNameXlsx).toMatch(/^Tabela_Consolidada_PR_Noroeste_Arenito_Caiua_47focos_\d{4}-\d{2}-\d{2}\.xlsx$/);

    const fileNameCsv = generateAuditTableFileName("São Paulo / Vale do Paraíba", 12, "csv");
    expect(fileNameCsv).toMatch(/^Tabela_Consolidada_Sao_Paulo_Vale_do_Paraiba_12focos_\d{4}-\d{2}-\d{2}\.csv$/);
  });

  // Teste extra: Grava fixture CSV para conferência com Pandas
  it("deve gerar arquivo CSV válido para conferência com pandas", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const csvContent = exportAuditTableCSV([samplePoint], dummyMeta);
    const scratchDir = path.resolve(process.cwd(), "scratch");
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
    fs.writeFileSync(path.join(scratchDir, "teste_laudos_pandas.csv"), csvContent, "utf-8");
    expect(fs.existsSync(path.join(scratchDir, "teste_laudos_pandas.csv"))).toBe(true);
  });
});
