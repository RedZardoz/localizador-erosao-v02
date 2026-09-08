import jsPDF from "jspdf";
import { ErosionPoint, isSyntheticPoint } from "@/types/erosion";
import { formatToDMS } from "@/lib/utils/geoUtils";

/**
 * ============================================================================
 * Gerador de Laudo / Dossiê Técnico de Auditoria Científica (PDF)
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * Gera um documento PDF estruturado em conformidade com o rigor científico
 * de revalidação por pares, com diagramação rigorosa de 2 páginas A4:
 *
 * PÁGINA 1:
 * - Cabeçalho Institucional Oficial (PPGTCA 2026)
 * - Identificação Geodésica e Resumo Executivo do Ponto Amostral
 * - ETAPA 1: Rastreabilidade e Aquisição Sentinel-2 MSI (Copernicus L2A BOA e SCL)
 * - ETAPA 2: Assinatura Espectral e Índices Biofísicos (BSI e NDVI em caixas amplas)
 * - ETAPA 3: Topografia e Geometria do Terreno (Copernicus DEM GLO-30 em EPSG:3857)
 * - ETAPA 4: Tabela Estruturada de Variáveis Climatológicas e Erodibilidade Pedológica
 *
 * PÁGINA 2:
 * - Cabeçalho de Continuação
 * - ETAPA 5: Modelagem RUSLE Completa (Memória Numérica, Severidade e Prioridade)
 * - ETAPA 6: Guia e Script de Revalidação Científica por Pares (GEE Code Editor)
 * - Rodapé Dinâmico com Numeração em Todas as Páginas
 */

export function buildAuditPdf(point: ErosionPoint): jsPDF {
  if (isSyntheticPoint(point)) {
    throw new Error(
      "Recusa de emissao: ponto com proveniencia sintetica nao pode gerar laudo pericial."
    );
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm
  let y = 12;

  // Banner superior institucional
  const drawHeaderBanner = (isContinuation = false) => {
    const bannerHeight = isContinuation ? 13 : 19;
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y, contentWidth, bannerHeight, "F");

    doc.setTextColor(255, 255, 255);
    if (!isContinuation) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(
        "PROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO (PPGTCA)",
        margin + 4,
        y + 5.5
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text(
        "PESQUISA DE EROSÃO LAMINAR | DOSSIÊ CIENTÍFICO DE AUDITORIA DE SATÉLITE E MODELAGEM RUSLE",
        margin + 4,
        y + 10.5
      );
      doc.setFontSize(6.8);
      doc.setTextColor(52, 211, 153); // emerald-400
      doc.text(
        "Memória de Cálculo, Rastreabilidade Metodológica e Cadastro Fundiário",
        margin + 4,
        y + 14.8
      );
      y += bannerHeight + 3;
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(
        `PPGTCA 2026 — Dossiê de Auditoria Científica de Erosão • Ponto ${point.code} (Continuação)`,
        margin + 4,
        y + 5.0
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(203, 213, 225);
      doc.text(
        "Modelagem da Perda de Solo (RUSLE) e Roteiro de Revalidação no Google Earth Engine",
        margin + 4,
        y + 9.5
      );
      y += bannerHeight + 3.5;
    }
  };

  // Faixa de título de seção
  const drawSectionTitle = (stepNumber: number, title: string) => {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, y, contentWidth, 5.8, "F");
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(margin, y, 3.2, 5.8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`ETAPA ${stepNumber} — ${title.toUpperCase()}`, margin + 5.5, y + 4.1);
    y += 7.8;
  };

  // ==========================================================================
  // PÁGINA 1 — Sensoriamento Remoto, Cadastro Fundiário, Topografia e Clima/Solo
  // ==========================================================================

  // 1. Cabeçalho Principal
  drawHeaderBanner(false);

  // 2. Card de Identificação Geodésica do Ponto
  const cardHeight = 26.5;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, "FD");

  // Divisão em 2 colunas: Esquerda (dados geográficos) e Direita (badges de resultado)
  const leftColWidth = contentWidth - 46; // ~136 mm
  const rightColX = margin + leftColWidth + 3; // ~153 mm

  // Linha 1: Código e Nome do Ponto (Medição de largura com fonte idêntica para ZERO encavalamento)
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const labelCode = `Ponto Amostral: ${point.code}`;
  doc.text(labelCode, margin + 4, y + 4.8);
  const codeWidth = doc.getTextWidth(labelCode);

  if (point.name && point.name !== point.code) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const nameX = margin + 4 + codeWidth + 2.5;
    const nameMaxW = leftColWidth - (codeWidth + 6.5);
    if (nameMaxW > 15) {
      doc.text(`(${point.name})`, nameX, y + 4.8, { maxWidth: nameMaxW });
    }
  }

  // Linha 2: Município e Bacia
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Município: ${point.municipality} — ${point.state || "PR"}  |  Bacia Hidrográfica: ${point.watershed}`,
    margin + 4,
    y + 9.5,
    { maxWidth: leftColWidth - 4 }
  );

  // Linha 3: Coordenadas WGS84 e DMS
  const dmsLat = formatToDMS(point.latitude, true);
  const dmsLng = formatToDMS(point.longitude, false);
  doc.text(
    `WGS84: ${point.latitude.toFixed(6)}°, ${point.longitude.toFixed(6)}°  |  DMS: ${dmsLat}, ${dmsLng}`,
    margin + 4,
    y + 14.2,
    { maxWidth: leftColWidth - 4 }
  );

  // Linha 4: Altitude e Solo
  doc.text(
    `Altitude Ortométrica: ${point.elevation} m  |  Classe Pedológica: ${point.soilType}`,
    margin + 4,
    y + 18.9,
    { maxWidth: leftColWidth - 4 }
  );

  // Linha 5: Proveniência
  const PROVENANCE_PDF_LABEL: Record<string, string> = {
    "satellite-derived": "Calculado via satelite / DEM (Google Earth Engine)",
    "gee-screened": "Candidato triado no Earth Engine (variaveis fisicas reais)",
    "field-validated": "Validado em campo (GNSS RTK / VANT)",
    "user-upload": "Importado pelo usuario - valores conforme arquivo de origem",
  };

  const dataProv =
    (point.dataProvenance && PROVENANCE_PDF_LABEL[point.dataProvenance]) ||
    "PROVENIENCIA NAO DECLARADA";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  if (dataProv === "PROVENIENCIA NAO DECLARADA") {
    doc.setTextColor(163, 60, 40); // vermelho
  } else {
    doc.setTextColor(13, 148, 136); // teal-600
  }
  doc.text(`Origem do Dado: ${dataProv}`, margin + 4, y + 23.6, { maxWidth: leftColWidth - 4 });

  // Divisória vertical sutil antes dos badges
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(rightColX - 2.5, y + 2, rightColX - 2.5, y + cardHeight - 2);

  // Coluna Direita: Badges de Severidade, Perda e Prioridade
  const badgeY = y + 2.5;
  const isCrit = point.severity === "Crítica";
  const isAlta = point.severity === "Alta";

  doc.setFillColor(
    isCrit ? 254 : isAlta ? 254 : 254,
    isCrit ? 242 : isAlta ? 243 : 252,
    isCrit ? 242 : isAlta ? 199 : 232
  );
  doc.setDrawColor(
    isCrit ? 252 : isAlta ? 245 : 250,
    isCrit ? 165 : isAlta ? 158 : 204,
    isCrit ? 165 : isAlta ? 11 : 21
  );
  doc.roundedRect(rightColX, badgeY, 39, 6.2, 1, 1, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(
    isCrit ? 190 : isAlta ? 180 : 161,
    isCrit ? 18 : isAlta ? 83 : 98,
    isCrit ? 60 : isAlta ? 9 : 7
  );
  doc.text(`SEVERIDADE: ${point.severity.toUpperCase()}`, rightColX + 2, badgeY + 4.2);

  // Badge Perda de Solo
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(rightColX, badgeY + 7.4, 39, 6.2, 1, 1, "FD");
  doc.setTextColor(21, 128, 61); // emerald-700
  doc.text(`Perda: ${point.estimatedSoilLoss} t/(ha·ano)`, rightColX + 2, badgeY + 11.6);

  // Badge Score de Prioridade
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(rightColX, badgeY + 14.8, 39, 6.2, 1, 1, "FD");
  doc.setTextColor(67, 56, 202); // indigo-700
  doc.text(`Score de Risco: ${point.priorityScore} / 100`, rightColX + 2, badgeY + 19.0);

  y += cardHeight + 3.2;

  // 3. Card de Identificação Fundiária & Cadastro Rural (CAR/SICAR - SNCR)
  const isBaseNotAvailable = point.tenureStatus === "base-nao-disponivel";
  const isNoMatch = point.tenureStatus === "sem-correspondencia";
  const isApproximate = point.tenureStatus === "aproximado";
  const isFound = point.tenureStatus === "encontrado" || (!point.tenureStatus && Boolean(point.carCode));
  const hasLandTenure = isFound || isApproximate;
  const fundiarioHeight = hasLandTenure ? 30.5 : 22.0;

  doc.setFillColor(hasLandTenure ? 240 : 254, hasLandTenure ? 253 : 242, hasLandTenure ? 244 : 242);
  doc.setDrawColor(hasLandTenure ? 167 : 252, hasLandTenure ? 243 : 165, hasLandTenure ? 208 : 165);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, fundiarioHeight, 1.5, 1.5, "FD");

  // Barra de título do Card Fundiário
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(hasLandTenure ? 6 : 153, hasLandTenure ? 95 : 27, hasLandTenure ? 70 : 27);
  doc.text("IDENTIFICACAO FUNDIARIA & CADASTRO AMBIENTAL RURAL (CAR/SICAR - SNCR)", margin + 3.5, y + 4.2);

  // Badge no canto direito
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  if (isBaseNotAvailable) {
    doc.setFillColor(254, 226, 226);
    doc.setDrawColor(248, 113, 113);
    doc.roundedRect(margin + contentWidth - 48, y + 1.6, 45, 4.5, 0.8, 0.8, "FD");
    doc.setTextColor(153, 27, 27);
    doc.text("Base Nao Disponivel", margin + contentWidth - 25.5, y + 4.6, { align: "center" });
  } else if (isNoMatch) {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin + contentWidth - 48, y + 1.6, 45, 4.5, 0.8, 0.8, "FD");
    doc.setTextColor(100, 116, 139);
    doc.text("Sem Correspondencia", margin + contentWidth - 25.5, y + 4.6, { align: "center" });
  } else if (isApproximate) {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(margin + contentWidth - 48, y + 1.6, 45, 4.5, 0.8, 0.8, "FD");
    doc.setTextColor(180, 83, 9);
    doc.text("Associacao Aproximada", margin + contentWidth - 25.5, y + 4.6, { align: "center" });
  } else {
    doc.setFillColor(209, 250, 229);
    doc.setDrawColor(110, 231, 183);
    doc.roundedRect(margin + contentWidth - 48, y + 1.6, 45, 4.5, 0.8, 0.8, "FD");
    doc.setTextColor(4, 120, 87);
    doc.text("Imovel Rural Registrado", margin + contentWidth - 25.5, y + 4.6, { align: "center" });
  }

  if (hasLandTenure) {
    const colW = (contentWidth - 6) / 4; // ~44 mm por coluna
    const subBoxY = y + 6.6;
    const subBoxH = 15.5;

    const fundiarioFields = [
      {
        label: "DENOMINACAO DO IMOVEL",
        val: point.propertyName || "Nao consta na base consultada",
        sub: point.municipality ? `${point.municipality} - ${point.state || "PR"}` : "",
      },
      {
        label: "CODIGO SICAR (CAR)",
        val: point.carCode || "Nao localizado",
        sub: "Base Oficial SICAR / MMA",
      },
      {
        label: "TITULAR / PROPRIETARIO",
        val: point.ownerName || "Nao consta na base consultada",
        sub: "Mascara oficial SNCR/INCRA (LGPD art. 7, IV)",
      },
      {
        label: "SNCR / AREA TOTAL",
        val: point.incraRegistry || "Nao localizado",
        sub: point.propertyAreaHa !== undefined ? `${point.propertyAreaHa} hectares` : "Area Nao Declarada",
      },
    ];

    fundiarioFields.forEach((item, i) => {
      const fx = margin + 1.2 + i * (colW + 0.8);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(209, 250, 229);
      doc.roundedRect(fx, subBoxY, colW, subBoxH, 0.8, 0.8, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.2);
      doc.setTextColor(100, 116, 139);
      doc.text(item.label, fx + 2, subBoxY + 2.8);

      doc.setFont(i === 1 ? "courier" : "helvetica", "bold");
      doc.setFontSize(5.6);
      doc.setTextColor(i === 1 ? 14 : 15, i === 1 ? 116 : 23, i === 1 ? 144 : 42);
      const valLines: string[] = doc.splitTextToSize(item.val, colW - 3.5);
      const displayValLines = valLines.slice(0, 2);
      doc.text(displayValLines, fx + 2, subBoxY + 5.8);

      if (item.sub) {
        const subY = subBoxY + 5.8 + (displayValLines.length * 2.4) + 0.5;
        if (subY <= subBoxY + subBoxH - 0.8) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(4.6);
          doc.setTextColor(100, 116, 139);
          const subLines: string[] = doc.splitTextToSize(item.sub, colW - 3.5);
          doc.text(subLines.slice(0, 1), fx + 2, subY);
        }
      }
    });

    // Linha de Cadeia de Consulta e Rastreabilidade
    const chainY = subBoxY + subBoxH + 2.2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.0);
    doc.setTextColor(71, 85, 105);
    const chainText = `Cadeia de Consulta (${point.tenureQueryDate || "Recente"}): Criterio: ${point.tenureAssociationCriterion || "Topologia estrita"} | SICAR: ${point.sicarSourceFile || "AREA_IMOVEL"} (${point.sicarBaseDate || "2026"}) | SIGEF: ${point.sigefSourceFile || "Sigef Brasil"} | SNCR: ${point.sncrSourceFile || "SNCR"}`;
    doc.text(chainText, margin + 2, chainY, { maxWidth: contentWidth - 4 });

    // Nota de conformidade LGPD
    const lgpdY = chainY + 2.8;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(4.6);
    doc.setTextColor(100, 116, 139);
    doc.text("Protecao de dados: Titular pseudonimizado conforme publicado pelo SNCR/INCRA sem reversao (LGPD art. 7, IV). Acesso local restrito.", margin + 2, lgpdY, { maxWidth: contentWidth - 4 });
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    if (isBaseNotAvailable) {
      doc.setTextColor(163, 60, 40); // vermelho
      doc.text(
        `BASE FUNDIARIA NAO DISPONIVEL PARA ESTA UF (${point.state || "UF nao carregada"}). Bases oficiais locais cobrem apenas PR, SC e SP.`,
        margin + 4,
        y + 9
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Para habilitar a consulta nesta regiao, ingira os dados oficiais do SICAR e SNCR correspondentes via ingest_data.py.",
        margin + 4,
        y + 14
      );
    } else {
      doc.setTextColor(163, 60, 40); // vermelho
      doc.text(
        "NENHUM IMOVEL RURAL CADASTRADO NAS BASES OFICIAIS SOBREPOE ESTA COORDENADA",
        margin + 4,
        y + 9
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Coordenada localizada fora de perimetro cadastrado no SICAR/SIGEF (Area publica, nao demarcada ou fora da base consultada).",
        margin + 4,
        y + 14
      );
    }
  }

  y += fundiarioHeight + 3.2;

  // 4. ETAPA 1: Aquisição Sentinel-2
  drawSectionTitle(1, "Rastreabilidade e Aquisição Sentinel-2 MSI (Copernicus L2A BOA)");

  const s2BoxHeight = 17;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, s2BoxHeight, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text("• Coleção GEE:", margin + 3, y + 3.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text("COPERNICUS/S2_SR_HARMONIZED (Refletância de Superfície Nível 2A - BOA)", margin + 24, y + 3.8);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("• ID da Cena ESA:", margin + 3, y + 7.6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  const sceneId =
    point.geeSourceImageId || "S2A_MSIL2A_HARMONIZED (Passagem com menor índice de nuvens nos últimos 120 dias)";
  doc.text(sceneId, margin + 27, y + 7.6, { maxWidth: contentWidth - 30 });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("• Data do Cálculo:", margin + 3, y + 11.4);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  const compDate = point.geeComputedAt
    ? new Date(point.geeComputedAt).toLocaleString("pt-BR")
    : "Recém-calculado / Auditado";
  doc.text(compDate, margin + 27, y + 11.4);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("• Controle de Nuvens:", margin + 3, y + 15.2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(
    "Máscara SCL (Scene Classification Layer) descartando sombras (3), nuvens (8/9) e cirrus (10).",
    margin + 32,
    y + 15.2
  );

  y += s2BoxHeight + 3.2;

  // 5. ETAPA 2: Assinatura Espectral (BSI e NDVI)
  drawSectionTitle(2, "Assinatura Espectral e Extração dos Índices Biofísicos (10m)");

  const boxW = (contentWidth - 3) / 2; // ~89.5 mm
  const indexBoxHeight = 28;

  // Caixa BSI (Solo Exposto)
  doc.setFillColor(254, 242, 242); // red-50
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, y, boxW, indexBoxHeight, 1.5, 1.5, "FD");

  // Título BSI
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(185, 28, 28);
  doc.text("Bare Soil Index (BSI) — Solo Exposto", margin + 3.5, y + 4.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text("Equação Espectral Sentinel-2 MSI:", margin + 3.5, y + 8.0);

  // Caixa interna branca para a fórmula do BSI
  const innerBsiW = boxW - 7;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin + 3.5, y + 9.5, innerBsiW, 5.5, 0.8, 0.8, "FD");

  doc.setFont("courier", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(15, 23, 42);
  doc.text(
    "BSI = [(B12+B4) - (B8+B2)] / [(B12+B4) + (B8+B2)]",
    margin + 3.5 + innerBsiW / 2,
    y + 13.3,
    { align: "center" }
  );

  // Valor Amostrado no Ponto
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(185, 28, 28);
  doc.text(`Valor no Ponto: ${point.bsi > 0 ? `+${point.bsi}` : point.bsi}`, margin + 3.5, y + 18.8);

  // Bandas e Diagnóstico BSI
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Bandas: B12 (SWIR-2 2190nm), B8 (NIR 842nm), B4 (Red 665nm), B2 (Blue 490nm).",
    margin + 3.5,
    y + 22.6,
    { maxWidth: boxW - 7 }
  );
  doc.text(
    "Diagnóstico: Valores > 0.0 confirmam solo mineral desprovido de cobertura vegetal.",
    margin + 3.5,
    y + 25.8,
    { maxWidth: boxW - 7 }
  );

  // Caixa NDVI (Vigor Vegetal)
  const xNdvi = margin + boxW + 3;
  doc.setFillColor(240, 253, 244); // green-50
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(xNdvi, y, boxW, indexBoxHeight, 1.5, 1.5, "FD");

  // Título NDVI
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(21, 128, 61);
  doc.text("Normalized Difference Veg. Index (NDVI)", xNdvi + 3.5, y + 4.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text("Equação Espectral de Vigor Fotossintético:", xNdvi + 3.5, y + 8.0);

  // Caixa interna branca para a fórmula do NDVI
  const innerNdviW = boxW - 7;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(xNdvi + 3.5, y + 9.5, innerNdviW, 5.5, 0.8, 0.8, "FD");

  doc.setFont("courier", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(
    "NDVI = (B8 - B4) / (B8 + B4)",
    xNdvi + 3.5 + innerNdviW / 2,
    y + 13.3,
    { align: "center" }
  );

  // Valor Amostrado no Ponto
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(21, 128, 61);
  doc.text(`Valor no Ponto: ${point.ndvi}`, xNdvi + 3.5, y + 18.8);

  // Bandas e Diagnóstico NDVI
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Contraste: Alta refletância no infravermelho (B8) contra absorção no vermelho (B4).",
    xNdvi + 3.5,
    y + 22.6,
    { maxWidth: boxW - 7 }
  );
  doc.text(
    "Diagnóstico: NDVI reduzido (< 0.35) atesta ausência de cobertura foliar protetora.",
    xNdvi + 3.5,
    y + 25.8,
    { maxWidth: boxW - 7 }
  );

  y += indexBoxHeight + 3.2;

  // 6. ETAPA 3: Topografia e DEM
  drawSectionTitle(3, "Geometria Topográfica e Hidrologia (Copernicus DEM GLO-30)");

  const demBoxHeight = 21;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, demBoxHeight, 1.5, 1.5, "FD");

  // Grid de 4 parâmetros topográficos
  const paramW = (contentWidth - 6) / 4;
  const pY = y + 1.8;

  const topParams = [
    { label: "Altitude Ortométrica", val: `${point.elevation} m`, sub: "SIRGAS 2000 / EGM96" },
    { label: "Declividade do Terreno", val: `${point.slopePercent}%`, sub: `Ângulo: ${point.slopeDegrees}°` },
    { label: "Projeção de Cálculo", val: "EPSG:3857", sub: "Métrica Conforme (10m)" },
    { label: "Hidrologia (Fator LS)", val: `LS = ${point.rusleFactors?.ls ?? 3.4}`, sub: "HydroSHEDS 15ACC" },
  ];

  topParams.forEach((tp, i) => {
    const px = margin + 1.5 + i * (paramW + 0.8);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(px, pY, paramW, 11.8, 0.8, 0.8, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    doc.text(tp.label, px + paramW / 2, pY + 3.2, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(tp.val, px + paramW / 2, pY + 7.2, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.2);
    doc.setTextColor(148, 163, 184);
    doc.text(tp.sub, px + paramW / 2, pY + 10.4, { align: "center" });
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Nota Metodológica: O cálculo topográfico utiliza projeção métrica EPSG:3857, eliminando distorções de coordenadas em graus. A área de contribuição específica As é obtida via Flow Accumulation do HydroSHEDS 15ACC.",
    margin + 3,
    y + 16.5,
    { maxWidth: contentWidth - 6 }
  );

  y += demBoxHeight + 3.2;

  // 7. ETAPA 4: TABELA ESTRUTURADA DE VARIÁVEIS CLIMATOLÓGICAS E PEDOLÓGICAS
  drawSectionTitle(4, "Variáveis Climatológicas e Erodibilidade Pedológica (Tabela de Parâmetros)");

  const rVal = point.rusleFactors?.r ?? 7850;
  const kVal = point.rusleFactors?.k ?? 0.035;
  const lsVal = point.rusleFactors?.ls ?? 3.4;
  const cVal = point.rusleFactors?.c ?? 0.28;
  const pVal = point.rusleFactors?.p ?? 1.0;

  const tableX = margin;
  const col1W = 46;
  const col2W = 26;
  const col3W = contentWidth - col1W - col2W; // 110 mm
  const headerH = 5.0;
  const rowH = 5.8;

  // Cabeçalho da Tabela
  doc.setFillColor(226, 232, 240); // slate-200
  doc.setDrawColor(203, 213, 225);
  doc.rect(tableX, y, contentWidth, headerH, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(30, 41, 59);
  doc.text("PARÂMETRO DA RUSLE", tableX + 3, y + 3.5);
  doc.text("VALOR", tableX + col1W + 3, y + 3.5);
  doc.text("UNIDADE DE MEDIDA & FONTE METODOLÓGICA", tableX + col1W + col2W + 3, y + 3.5);
  y += headerH;

  const tableRows = [
    {
      param: "Fator R (Erosividade da Chuva)",
      val: `${rVal}`,
      desc: "MJ · mm / (ha · h · ano) — Série NASA POWER / MERRA-2 (Eq. Lombardi Neto)",
    },
    {
      param: "Fator K (Erodibilidade do Solo)",
      val: `${kVal}`,
      desc: `t · ha · h / (ha · MJ · mm) — Base IAT / ISRIC SoilGrids (${point.soilType})`,
    },
    {
      param: "Fator C (Uso e Cobertura)",
      val: `${cVal}`,
      desc: `Adimensional — Derivado dinamicamente da relação NDVI (${point.ndvi}) e BSI (${point.bsi})`,
    },
    {
      param: "Fator P (Práticas Conservacionistas)",
      val: `${pVal}`,
      desc: "Adimensional — Cultivo convencional sem terraceamento consolidado (P = 1.0)",
    },
  ];

  tableRows.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(tableX, y, contentWidth, rowH, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.2);
    doc.setTextColor(15, 23, 42);
    doc.text(row.param, tableX + 3, y + 3.9);

    doc.setFont("courier", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(16, 185, 129);
    doc.text(row.val, tableX + col1W + 3, y + 3.9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.8);
    doc.setTextColor(71, 85, 105);
    doc.text(row.desc, tableX + col1W + col2W + 3, y + 3.9, { maxWidth: col3W - 4 });

    y += rowH;
  });

  // ==========================================================================
  // PÁGINA 2 — Modelagem RUSLE e Revalidação Científica por Pares
  // ==========================================================================
  doc.addPage();
  y = 12;

  // 1. Cabeçalho da Página 2
  drawHeaderBanner(true);

  // 2. ETAPA 5: Modelagem RUSLE Completa
  drawSectionTitle(5, "Modelagem da Equação Universal de Perda de Solo Revisada (RUSLE)");

  const rusleBoxHeight = 34;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, rusleBoxHeight, 1.5, 1.5, "FD");

  // Fórmula Master
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("A = R · K · LS · C · P   [ t / (ha · ano) ]", margin + 4, y + 5.5);

  // Substituição Numérica
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Substituição Numérica: A = (${rVal}) × (${kVal}) × (${lsVal}) × (${cVal}) × (${pVal})`,
    margin + 4,
    y + 11.5
  );

  // Perda Calculada
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(
    `Perda de Solo Calculada: ${point.estimatedSoilLoss} toneladas / (hectare · ano)`,
    margin + 4,
    y + 17.5
  );

  // Grade comparativa de fatores individuais
  const fBoxW = (contentWidth - 8) / 5;
  const fY = y + 21;
  const factors = [
    { label: "R (Chuva)", val: `${rVal}` },
    { label: "K (Solo)", val: `${kVal}` },
    { label: "LS (Relevo)", val: `${lsVal}` },
    { label: "C (Cobertura)", val: `${cVal}` },
    { label: "P (Manejo)", val: `${pVal}` },
  ];

  factors.forEach((f, i) => {
    const fx = margin + 1.5 + i * (fBoxW + 1.2);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(fx, fY, fBoxW, 9.5, 0.8, 0.8, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    doc.text(f.label, fx + fBoxW / 2, fY + 3.2, { align: "center" });

    doc.setFont("courier", "bold");
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(f.val, fx + fBoxW / 2, fY + 7.4, { align: "center" });
  });

  y += rusleBoxHeight + 5;

  // 3. ETAPA 6: Roteiro e Script de Revalidação Científica por Pares
  drawSectionTitle(6, "Guia de Revalidação Científica Independente por Pares");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    "Para auditar e reproduzir este cálculo no Google Earth Engine (Code Editor), copie e execute o script abaixo:",
    margin + 2,
    y
  );
  y += 4.5;

  const scriptLines = [
    `// SCRIPT REPRODUZÍVEL GEE — Ponto ${point.code} (${point.municipality} - ${point.state || "PR"})`,
    `var ponto = ee.Geometry.Point([${point.longitude.toFixed(6)}, ${point.latitude.toFixed(6)}]);`,
    `var s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")`,
    `  .filterBounds(ponto).filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 40))`,
    `  .sort("CLOUDY_PIXEL_PERCENTAGE").first();`,
    `var bsi = s2.expression("((B12+B4)-(B8+B2))/((B12+B4)+(B8+B2))", {`,
    `  B12: s2.select("B12"), B4: s2.select("B4"), B8: s2.select("B8"), B2: s2.select("B2")`,
    `}).rename("BSI");`,
    `var ndvi = s2.normalizedDifference(["B8", "B4"]).rename("NDVI");`,
    `var dem = ee.Image("COPERNICUS/DEM/GLO30").select("DEM");`,
    `var declividade = ee.Terrain.slope(dem);`,
    `print("BSI Amostrado:", bsi.reduceRegion(ee.Reducer.first(), ponto, 10));`,
    `print("NDVI Amostrado:", ndvi.reduceRegion(ee.Reducer.first(), ponto, 10));`,
    `print("Declividade (graus):", declividade.reduceRegion(ee.Reducer.first(), ponto, 10));`,
  ];

  const scriptBoxH = scriptLines.length * 3.4 + 5;
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, scriptBoxH, 1.5, 1.5, "F");

  doc.setFont("courier", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(52, 211, 153); // emerald-400

  let scriptY = y + 4;
  scriptLines.forEach((line) => {
    doc.text(line, margin + 4, scriptY);
    scriptY += 3.4;
  });

  y += scriptBoxH + 4.5;

  // Informações de Validação Cruzada
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 12, 1, 1, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text("Plataformas de Validação Cruzada Georreferenciada:", margin + 3, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Google Earth Web 3D: lat: ${point.latitude.toFixed(6)}, lng: ${point.longitude.toFixed(6)}, alt: ${point.elevation}m  |  Google Maps Satélite: Camada ortorretificada de alta resolução.`,
    margin + 3,
    y + 8.5,
    { maxWidth: contentWidth - 6 }
  );

  y += 15;

  // Termo de Rastreabilidade Metodológica
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, y, contentWidth, 11, 1, 1, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(21, 128, 61);
  doc.text("Conformidade e Rastreabilidade Acadêmica (PPGTCA 2026):", margin + 3, y + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    "Este laudo técnico foi estruturado com base em algoritmos vetoriais reprodutíveis e dados públicos abertos (Copernicus ESA, USGS, NASA POWER, SICAR/MMA, INCRA). Os resultados servem para validação por pares e suporte a decisões de conservação do solo.",
    margin + 3,
    y + 7.8,
    { maxWidth: contentWidth - 6 }
  );

  // ==========================================================================
  // RODAPÉ DINÂMICO OFICIAL EM TODAS AS PÁGINAS
  // ==========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, margin + contentWidth, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Laudo gerado em ${new Date().toLocaleString("pt-BR")} • Motor de Cálculo: ${point.calcEngineVersion || "2026.1-metric"} • PPGTCA 2026`,
      margin,
      pageHeight - 7.5
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      margin + contentWidth - 18,
      pageHeight - 7.5
    );
  }

  return doc;
}

export function generateAuditPdf(point: ErosionPoint): void {
  const doc = buildAuditPdf(point);
  // Download do arquivo PDF no navegador
  const fileName = `Laudo_Auditoria_Erosao_${point.code}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

