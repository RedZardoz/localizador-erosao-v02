import JSZip from "jszip";
import { escapeXml } from "./exportUtils";

export interface XlsxCell {
  value: string | number | null | undefined;
  type?: "string" | "number";
  bold?: boolean;
}

export type XlsxRowValue = XlsxCell | string | number | null | undefined;

export interface XlsxColWidth {
  colIndex: number; // 1-based (1 = A, 2 = B...)
  width: number;
}

export interface XlsxSheet {
  name: string;
  rows: XlsxRowValue[][];
  cols?: XlsxColWidth[];
  freezeHeader?: boolean;
  autoFilterRef?: string; // e.g. "A1:BB1"
}

/**
 * Converte um índice de coluna numérico 1-based (1=A, 26=Z, 27=AA, 54=BB)
 * para a notação de letras de colunas do Excel.
 */
export function colToLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = "";
  while (temp > 0) {
    const rem = (temp - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    temp = Math.floor((temp - 1) / 26);
  }
  return letter;
}

/**
 * Gera o XML de uma planilha OpenXML.
 */
export function buildSheetXml(sheet: XlsxSheet): string {
  let xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;
  xml += `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n`;

  if (sheet.freezeHeader) {
    xml += `  <sheetViews>\n`;
    xml += `    <sheetView tabSelected="1" workbookViewId="0">\n`;
    xml += `      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>\n`;
    xml += `    </sheetView>\n`;
    xml += `  </sheetViews>\n`;
  } else {
    xml += `  <sheetViews>\n`;
    xml += `    <sheetView workbookViewId="0"/>\n`;
    xml += `  </sheetViews>\n`;
  }

  if (sheet.cols && sheet.cols.length > 0) {
    xml += `  <cols>\n`;
    for (const c of sheet.cols) {
      xml += `    <col min="${c.colIndex}" max="${c.colIndex}" width="${c.width}" customWidth="1"/>\n`;
    }
    xml += `  </cols>\n`;
  }

  xml += `  <sheetData>\n`;
  for (let rIdx = 0; rIdx < sheet.rows.length; rIdx++) {
    const rowNum = rIdx + 1;
    const row = sheet.rows[rIdx];
    let rowXml = `    <row r="${rowNum}">\n`;
    let hasCells = false;

    for (let cIdx = 0; cIdx < row.length; cIdx++) {
      const colNum = cIdx + 1;
      const cellRef = `${colToLetter(colNum)}${rowNum}`;
      const cellData = row[cIdx];

      if (cellData === null || cellData === undefined) {
        continue;
      }

      let val: string | number | null | undefined;
      let isBold = false;
      let explicitType: "string" | "number" | undefined;

      if (typeof cellData === "object" && "value" in cellData) {
        val = cellData.value;
        isBold = Boolean(cellData.bold);
        explicitType = cellData.type;
      } else {
        val = cellData;
      }

      if (val === null || val === undefined || val === "") {
        continue;
      }

      const styleId = isBold ? 1 : 0;
      hasCells = true;

      const isNumeric =
        explicitType === "number" ||
        (explicitType !== "string" && typeof val === "number" && !isNaN(val));

      if (isNumeric) {
        const numVal = typeof val === "number" ? val : parseFloat(String(val));
        rowXml += `      <c r="${cellRef}" s="${styleId}"><v>${numVal}</v></c>\n`;
      } else {
        const strVal = String(val);
        rowXml += `      <c r="${cellRef}" s="${styleId}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(strVal)}</t></is></c>\n`;
      }
    }

    rowXml += `    </row>\n`;
    if (hasCells) {
      xml += rowXml;
    } else {
      xml += `    <row r="${rowNum}"/>\n`;
    }
  }
  xml += `  </sheetData>\n`;

  if (sheet.autoFilterRef) {
    xml += `  <autoFilter ref="${sheet.autoFilterRef}"/>\n`;
  }

  xml += `</worksheet>`;
  return xml;
}

/**
 * Gera o XML de estilos (styles.xml) com fonte normal e negrito.
 */
function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font>
      <sz val="10"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
    <font>
      <b/>
      <sz val="10"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>`;
}

/**
 * Constrói um arquivo .xlsx completo em memória e retorna como Blob.
 *
 * Implementação nativa via JSZip em conformidade com ISO/IEC 29500 (OpenXML).
 * Não utiliza a biblioteca 'xlsx' (SheetJS) para evitar riscos de segurança (A-2).
 */
export async function buildXlsxBlob(sheets: XlsxSheet[]): Promise<Blob> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;
  contentTypesXml += `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n`;
  contentTypesXml += `  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n`;
  contentTypesXml += `  <Default Extension="xml" ContentType="application/xml"/>\n`;
  contentTypesXml += `  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>\n`;
  contentTypesXml += `  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>\n`;
  sheets.forEach((_, idx) => {
    contentTypesXml += `  <Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n`;
  });
  contentTypesXml += `</Types>`;
  zip.file("[Content_Types].xml", contentTypesXml);

  // 2. _rels/.rels
  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
  zip.file("_rels/.rels", rootRelsXml);

  // 3. xl/workbook.xml
  let workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;
  workbookXml += `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\n`;
  workbookXml += `  <sheets>\n`;
  sheets.forEach((sheet, idx) => {
    workbookXml += `    <sheet name="${escapeXml(sheet.name)}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>\n`;
  });
  workbookXml += `  </sheets>\n`;
  workbookXml += `</workbook>`;
  zip.file("xl/workbook.xml", workbookXml);

  // 4. xl/_rels/workbook.xml.rels
  let workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;
  workbookRelsXml += `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n`;
  sheets.forEach((_, idx) => {
    workbookRelsXml += `  <Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>\n`;
  });
  workbookRelsXml += `  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>\n`;
  workbookRelsXml += `</Relationships>`;
  zip.file("xl/_rels/workbook.xml.rels", workbookRelsXml);

  // 5. xl/styles.xml
  zip.file("xl/styles.xml", buildStylesXml());

  // 6. xl/worksheets/sheet{N}.xml
  sheets.forEach((sheet, idx) => {
    zip.file(`xl/worksheets/sheet${idx + 1}.xml`, buildSheetXml(sheet));
  });

  return await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
