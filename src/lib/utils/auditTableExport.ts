import { ErosionPoint, DataProvenance } from "@/types/erosion";
import { formatToDMS } from "./geoUtils";
import { buildXlsxBlob, XlsxSheet, XlsxRowValue } from "./xlsxWriter";

export interface FonteDadosItem {
  sistema: string;
  uf: string;
  arquivo_origem: string | null;
  data_base: string | null;
  total_registros: number;
}

export interface AuditTableMetadata {
  isFiltered?: boolean;
  totalLoaded: number;
  exportedCount: number;
  activeRegion: string;
  activeSeverities?: string[];
  topN?: number;
  aoiName?: string | null;
  fontesDados?: FonteDadosItem[] | null;
  generatedAt?: string;
}

export const AUDIT_TABLE_HEADERS = [
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
] as const;

export interface BlockFResult {
  statusConsulta: string;
  denominacao: string;
  codigoCar: string;
  titularSncr: string;
  documentoMascarado: string;
  registroIncra: string;
  areaImovelHa: number | null;
}

/**
 * Resolve os campos do Bloco F conforme as regras estritas da auditoria.
 * Nenhuma célula textual fica em branco; valores numéricos nunca recebem 0 quando ausentes.
 */
export function resolveBlockF(point: ErosionPoint): BlockFResult {
  const status = point.tenureStatus;
  const ufConsultada = point.tenureUf || point.state || "UF";

  if (status === "encontrado") {
    return {
      statusConsulta: "Encontrado — ponto contido no perímetro",
      denominacao: point.propertyName?.trim() || "Não consta na base",
      codigoCar: point.carCode?.trim() || "Não consta na base",
      titularSncr: point.ownerName?.trim() || "Titular não divulgado na base pública",
      documentoMascarado: point.ownerDocumentMasked?.trim() || "Não consta na base",
      registroIncra: point.incraRegistry?.trim() || "Não consta na base",
      areaImovelHa:
        typeof point.propertyAreaHa === "number" && !isNaN(point.propertyAreaHa)
          ? point.propertyAreaHa
          : null,
    };
  }

  if (status === "aproximado") {
    return {
      statusConsulta: "ATENÇÃO — associação aproximada, não usar para responsabilização",
      denominacao: point.propertyName?.trim() || "Não consta na base",
      codigoCar: point.carCode?.trim() || "Não consta na base",
      titularSncr: point.ownerName?.trim() || "Titular não divulgado na base pública",
      documentoMascarado: point.ownerDocumentMasked?.trim() || "Não consta na base",
      registroIncra: point.incraRegistry?.trim() || "Não consta na base",
      areaImovelHa:
        typeof point.propertyAreaHa === "number" && !isNaN(point.propertyAreaHa)
          ? point.propertyAreaHa
          : null,
    };
  }

  if (status === "sem-correspondencia") {
    return {
      statusConsulta: "Sem correspondência — nenhum imóvel nesta coordenada",
      denominacao: "Sem correspondência",
      codigoCar: "Sem correspondência",
      titularSncr: "Sem correspondência",
      documentoMascarado: "Sem correspondência",
      registroIncra: "Sem correspondência",
      areaImovelHa: null,
    };
  }

  if (status === "base-nao-disponivel") {
    return {
      statusConsulta: `Base de ${ufConsultada} não disponível nesta instalação`,
      denominacao: "Base não consultada",
      codigoCar: "Base não consultada",
      titularSncr: "Base não consultada",
      documentoMascarado: "Base não consultada",
      registroIncra: "Base não consultada",
      areaImovelHa: null,
    };
  }

  // ausente ou indefinido
  return {
    statusConsulta: "Consulta não realizada",
    denominacao: "Consulta não realizada",
    codigoCar: "Consulta não realizada",
    titularSncr: "Consulta não realizada",
    documentoMascarado: "Consulta não realizada",
    registroIncra: "Consulta não realizada",
    areaImovelHa: null,
  };
}

/**
 * Traduz dataProvenance para os rótulos idênticos aos do laudo em PDF.
 */
export function translateDataProvenance(provenance?: DataProvenance): string {
  switch (provenance) {
    case "satellite-derived":
      return "Calculado via satélite / DEM (Google Earth Engine)";
    case "gee-screened":
      return "Candidato triado no Earth Engine (variáveis físicas reais)";
    case "field-validated":
      return "Validado em campo (GNSS RTK / VANT)";
    case "user-upload":
      return "Importado pelo usuário — valores conforme arquivo de origem";
    default:
      return "PROVENIÊNCIA NÃO DECLARADA";
  }
}

/**
 * Formata a memória de cálculo da equação RUSLE no formato oficial.
 */
export function formatRusleMemory(point: ErosionPoint, decimalSeparator: "," | "." = ","): string {
  const r = point.rusleFactors?.r;
  const k = point.rusleFactors?.k;
  const ls = point.rusleFactors?.ls;
  const c = point.rusleFactors?.c;
  const p = point.rusleFactors?.p;
  const a = point.estimatedSoilLoss;

  if (r === undefined && k === undefined && ls === undefined && c === undefined && p === undefined) {
    return "Cálculo RUSLE não executado";
  }

  const fmt = (val: number | undefined, decimals: number) => {
    if (val === undefined || isNaN(val)) return "N/D";
    const str = val.toFixed(decimals);
    return decimalSeparator === "," ? str.replace(".", ",") : str;
  };

  const rStr = fmt(r, 1);
  const kStr = fmt(k, 4);
  const lsStr = fmt(ls, 2);
  const cStr = fmt(c, 3);
  const pStr = fmt(p, 2);
  const aStr = fmt(a, 1);

  return `A = ${rStr} × ${kStr} × ${lsStr} × ${cStr} × ${pStr} = ${aStr}`;
}

/**
 * Extrai os valores de um ponto erosivo alinhados com AUDIT_TABLE_HEADERS.
 */
function extractPointValues(point: ErosionPoint, isCsv: boolean) {
  const f = resolveBlockF(point);
  const decSep: "," | "." = isCsv ? "," : ".";

  const fmtDec = (val: number | undefined, decimals?: number) => {
    if (val === undefined || val === null || isNaN(val)) return "";
    const str = typeof decimals === "number" ? val.toFixed(decimals) : String(val);
    return isCsv ? str.replace(".", ",") : Number(str);
  };

  const obsCampo = point.fieldObservations
    ? Object.entries(point.fieldObservations)
        .map(([k, v]) => `${k}: ${v}`)
        .join("; ")
    : "";

  const camposEstimados = point.estimatedFields?.join(", ") || "";

  return [
    // A. Identificação
    point.code || "",
    point.name || "",
    point.id || "",
    point.detectionDate || "",
    point.stratumId || "",
    point.stratumName || "",

    // B. Localização
    fmtDec(point.latitude, 6),
    fmtDec(point.longitude, 6),
    formatToDMS(point.latitude, true),
    formatToDMS(point.longitude, false),
    typeof point.elevation === "number" && !isNaN(point.elevation) ? (isCsv ? fmtDec(point.elevation) : point.elevation) : "",
    point.municipality || "",
    point.state || "",
    point.macroRegion || "",
    point.watershed || "",

    // C. Terreno e assinatura espectral
    typeof point.slopePercent === "number" && !isNaN(point.slopePercent) ? (isCsv ? fmtDec(point.slopePercent) : point.slopePercent) : "",
    typeof point.slopeDegrees === "number" && !isNaN(point.slopeDegrees) ? (isCsv ? fmtDec(point.slopeDegrees) : point.slopeDegrees) : "",
    typeof point.bsi === "number" && !isNaN(point.bsi) ? (isCsv ? fmtDec(point.bsi, 4) : point.bsi) : "",
    typeof point.ndvi === "number" && !isNaN(point.ndvi) ? (isCsv ? fmtDec(point.ndvi, 4) : point.ndvi) : "",

    // D. Classificação e resultado
    point.soilType || "",
    point.featureType || "",
    point.severity || "",
    typeof point.priorityScore === "number" && !isNaN(point.priorityScore) ? (isCsv ? fmtDec(point.priorityScore) : point.priorityScore) : "",
    typeof point.estimatedSoilLoss === "number" && !isNaN(point.estimatedSoilLoss) ? (isCsv ? fmtDec(point.estimatedSoilLoss, 2) : point.estimatedSoilLoss) : "",

    // E. Fatores RUSLE
    typeof point.rusleFactors?.r === "number" && !isNaN(point.rusleFactors.r) ? (isCsv ? fmtDec(point.rusleFactors.r, 2) : point.rusleFactors.r) : "",
    typeof point.rusleFactors?.k === "number" && !isNaN(point.rusleFactors.k) ? (isCsv ? fmtDec(point.rusleFactors.k, 4) : point.rusleFactors.k) : "",
    typeof point.rusleFactors?.ls === "number" && !isNaN(point.rusleFactors.ls) ? (isCsv ? fmtDec(point.rusleFactors.ls, 3) : point.rusleFactors.ls) : "",
    typeof point.rusleFactors?.c === "number" && !isNaN(point.rusleFactors.c) ? (isCsv ? fmtDec(point.rusleFactors.c, 4) : point.rusleFactors.c) : "",
    typeof point.rusleFactors?.p === "number" && !isNaN(point.rusleFactors.p) ? (isCsv ? fmtDec(point.rusleFactors.p, 2) : point.rusleFactors.p) : "",
    formatRusleMemory(point, decSep),

    // F. Identificação fundiária
    f.statusConsulta,
    f.denominacao,
    f.codigoCar,
    f.titularSncr,
    f.documentoMascarado,
    f.registroIncra,
    f.areaImovelHa !== null ? (isCsv ? fmtDec(f.areaImovelHa, 2) : f.areaImovelHa) : "",

    // G. Proveniência e cadeia de consulta
    translateDataProvenance(point.dataProvenance),
    point.geeSourceImageId || "",
    point.geeComputedAt || "",
    point.calcEngineVersion || "",
    camposEstimados,
    point.tenureAssociationCriterion || "",
    point.tenureUf || "",
    point.tenureQueryDate || "",
    point.sicarSourceFile || "",
    point.sicarBaseDate || "",
    point.sigefSourceFile || "",
    point.sigefBaseDate || "",
    point.sncrSourceFile || "",
    point.sncrBaseDate || "",

    // H. Validação de campo e notas
    point.fieldValidatedAt || "",
    obsCampo,
    point.notes || "",
  ];
}

/**
 * Escapa uma célula individual para CSV com delimitador ponto e vírgula (;).
 */
function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) {
    return "";
  }
  const str = String(val);
  if (str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exporta os pontos em formato CSV com UTF-8 BOM, delimitador ';' e vírgula decimal.
 */
export function exportAuditTableCSV(points: ErosionPoint[], _meta?: AuditTableMetadata): string {
  const headerLine = AUDIT_TABLE_HEADERS.map(escapeCsvCell).join(";");
  const dataLines = points.map((p) => {
    const vals = extractPointValues(p, true);
    return vals.map(escapeCsvCell).join(";");
  });

  const fullContent = [headerLine, ...dataLines].join("\r\n");
  return "\uFEFF" + fullContent;
}

/**
 * Formata data no padrão brasileiro DD/MM/AAAA.
 */
function formatDateBr(dtStr: string | null | undefined): string {
  if (!dtStr) return "data não informada";
  const m = dtStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return `${m[3]}/${m[2]}/${m[1]}`;
  }
  return dtStr;
}

/**
 * Constrói a folha 'Procedência e Conformidade' (Sheet 2) do XLSX.
 */
function buildProvenanceSheet(meta: AuditTableMetadata): XlsxSheet {
  const now = new Date();
  const dataEmissao =
    meta.generatedAt ||
    `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(
      now.getHours()
    ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const rows: XlsxRowValue[][] = [
    [{ value: "Campo", bold: true }, { value: "Valor", bold: true }],
    ["Documento", "Tabela Consolidada"],
    ["Aplicação", "Localizador de Erosão Laminar — PPGTCA 2026"],
    ["Data de emissão", dataEmissao],
    ["Focos exportados", `${meta.exportedCount} de ${meta.totalLoaded} carregados`],
    ["Conjunto", meta.isFiltered ? "Focos selecionados (filtro ativo)" : "Todos os focos carregados"],
    [],
    [{ value: "FILTROS ATIVOS NA SELEÇÃO", bold: true }, ""],
    ["Região", meta.activeRegion || "Todas as regiões"],
    [
      "Severidade",
      meta.activeSeverities && meta.activeSeverities.length > 0
        ? meta.activeSeverities.join(", ")
        : "Todas as severidades",
    ],
    ["Top N", meta.topN && meta.topN > 0 ? String(meta.topN) : "Sem limite (todos)"],
    ["Polígono AOI", meta.aoiName || "Nenhum (análise regional ampla)"],
    [],
    [{ value: "BASES FUNDIÁRIAS CONSULTADAS", bold: true }, ""],
  ];

  if (meta.fontesDados && meta.fontesDados.length > 0) {
    const ufs = Array.from(new Set(meta.fontesDados.map((f) => f.uf))).sort();
    for (const f of meta.fontesDados) {
      const orgao = f.sistema === "SICAR" ? "MMA/SFB" : "INCRA";
      const dtBase = f.data_base ? ` — base de ${formatDateBr(f.data_base)}` : "";
      const arq = f.arquivo_origem || "Arquivo de dados abertos";
      rows.push([
        `${f.sistema} (${orgao}) - ${f.uf}`,
        `${arq}${dtBase} — ${f.total_registros.toLocaleString("pt-BR")} registros`,
      ]);
    }
    rows.push(["UFs com base disponível", ufs.join(", ")]);
  } else {
    rows.push(["Metadados de fonte", "Metadados de fonte indisponíveis"]);
  }

  rows.push(
    [],
    [{ value: "PROTEÇÃO DE DADOS PESSOAIS", bold: true }, ""],
    [
      "Fundamentação LGPD",
      "O nome do titular é reproduzido exatamente na forma mascarada em que é publicado pelo Sistema Nacional de Cadastro Rural (SNCR/INCRA), sem qualquer tentativa de reversão, complementação ou cruzamento com outras bases para reidentificação. O número de CPF/CNPJ não é divulgado. O tratamento observa a Lei nº 13.709/2018 (LGPD), art. 7º, IV, que autoriza o tratamento de dados pessoais para a realização de estudos por órgão de pesquisa. O acesso à base é restrito à execução local desta aplicação.",
    ],
    [
      "Nota sobre Titularidade",
      "Titular pseudonimizado, não anonimizado: um primeiro nome associado a imóvel georreferenciado permanece dado pessoal na acepção da LGPD.",
    ]
  );

  return {
    name: "Procedência e Conformidade",
    rows,
    cols: [
      { colIndex: 1, width: 34 },
      { colIndex: 2, width: 88 },
    ],
    freezeHeader: false,
  };
}

/**
 * Exporta a tabela consolidada no formato XLSX (duas abas: Dados e Procedência e Conformidade).
 */
export async function exportAuditTableXLSX(
  points: ErosionPoint[],
  meta: AuditTableMetadata
): Promise<Blob> {
  const dataHeaderRow: XlsxRowValue[] = AUDIT_TABLE_HEADERS.map((h) => ({
    value: h,
    bold: true,
  }));

  const dataRows: XlsxRowValue[][] = [
    dataHeaderRow,
    ...points.map((p) => extractPointValues(p, false)),
  ];

  const sheetDados: XlsxSheet = {
    name: "Dados",
    rows: dataRows,
    freezeHeader: true,
    autoFilterRef: `A1:BB1`,
  };

  const sheetProcedencia = buildProvenanceSheet(meta);

  return await buildXlsxBlob([sheetDados, sheetProcedencia]);
}

/**
 * Gera o nome de arquivo normalizado para a exportação da Tabela Consolidada.
 */
export function generateAuditTableFileName(
  regionName: string,
  count: number,
  extension: "csv" | "xlsx"
): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const normalizedRegion = regionName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `Tabela_Consolidada_${normalizedRegion}_${count}focos_${timestamp}.${extension}`;
}
