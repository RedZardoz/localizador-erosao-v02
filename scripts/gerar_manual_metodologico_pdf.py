# -*- coding: utf-8 -*-
"""
=============================================================================
GERADOR DO MANUAL METODOLÓGICO E DE CÁLCULOS DO SAREL (PDF / REPORTLAB)
Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
PPGTCA 2026 — Universidade Tecnológica Federal do Paraná (UTFPR)
Pesquisa: Validação e Predição de Erosão Laminar com Sensoriamento Remoto e XGBoost
Pesquisador: Luis Alfredo
=============================================================================
Normatizado segundo as normas da ABNT (NBR 6023:2018 e NBR 10520:2023).
"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

# =============================================================================
# CORES INSTITUCIONAIS SAREL v2.0
# =============================================================================
C_NAVY_DARK = colors.HexColor("#0F172A")    # Slate 900
C_NAVY_CARD = colors.HexColor("#1E293B")    # Slate 800
C_SLATE_TEXT = colors.HexColor("#334155")   # Slate 700
C_SLATE_MUTED = colors.HexColor("#64748B")  # Slate 500
C_BORDER = colors.HexColor("#CBD5E1")       # Slate 300
C_BORDER_LIGHT = colors.HexColor("#E2E8F0") # Slate 200

C_EMERALD_DARK = colors.HexColor("#065F46") # Emerald 800
C_EMERALD_MID = colors.HexColor("#059669")  # Emerald 600
C_EMERALD_LIGHT = colors.HexColor("#10B981")# Emerald 500
C_MINT_BG = colors.HexColor("#ECFDF5")      # Mint 50

C_CYAN_DARK = colors.HexColor("#0369A1")    # Sky 700
C_CYAN_BG = colors.HexColor("#F0F9FF")      # Sky 50

C_AMBER_DARK = colors.HexColor("#B45309")   # Amber 700
C_AMBER_BG = colors.HexColor("#FFFBEB")     # Amber 50

C_ROSE_DARK = colors.HexColor("#BE123C")    # Rose 700
C_ROSE_BG = colors.HexColor("#FFF1F2")      # Rose 50

C_WHITE = colors.HexColor("#FFFFFF")
C_BG_PAGE = colors.HexColor("#F8FAFC")

# =============================================================================
# CANVAS PERSONALIZADO COM NUMERAÇÃO "PÁGINA X DE Y" E CABEÇALHO
# =============================================================================
class SarelNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        if self._pageNumber > 1:
            self.saveState()
            page_w, page_h = A4

            # Cabeçalho Institucional
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(C_EMERALD_DARK)
            self.drawString(18 * mm, page_h - 12 * mm, "PPGTCA 2026 • TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO (UTFPR)")
            self.setFont("Helvetica", 7.5)
            self.setFillColor(C_SLATE_MUTED)
            self.drawRightString(page_w - 18 * mm, page_h - 12 * mm, "MANUAL METODOLÓGICO E DE CÁLCULOS — SAREL v2.0")

            # Linha divisória superior
            self.setStrokeColor(C_BORDER_LIGHT)
            self.setLineWidth(0.6)
            self.line(18 * mm, page_h - 14 * mm, page_w - 18 * mm, page_h - 14 * mm)

            # Linha divisória inferior
            self.line(18 * mm, 14 * mm, page_w - 18 * mm, 14 * mm)

            # Rodapé Institucional
            self.setFont("Helvetica", 7.5)
            self.setFillColor(C_SLATE_MUTED)
            self.drawString(18 * mm, 9.5 * mm, "Pesquisa de Mestrado: Validação e Predição de Erosão Laminar com Sensoriamento Remoto e XGBoost • Luis Alfredo")
            self.drawRightString(page_w - 18 * mm, 9.5 * mm, f"Página {self._pageNumber} de {page_count}")
            self.restoreState()

# =============================================================================
# CONFIGURAÇÃO DE ESTILOS TIPOGRÁFICOS
# =============================================================================
def get_sarel_styles():
    base = getSampleStyleSheet()
    styles = {}

    styles["DocTitle"] = ParagraphStyle(
        "DocTitle",
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=C_NAVY_DARK,
        alignment=TA_LEFT,
        spaceAfter=6
    )
    styles["DocSubtitle"] = ParagraphStyle(
        "DocSubtitle",
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        textColor=C_SLATE_TEXT,
        alignment=TA_LEFT,
        spaceAfter=12
    )
    styles["AuthorInfo"] = ParagraphStyle(
        "AuthorInfo",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=C_EMERALD_DARK,
        alignment=TA_LEFT
    )
    styles["ChapterTitle"] = ParagraphStyle(
        "ChapterTitle",
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=C_NAVY_DARK,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    styles["SectionTitle"] = ParagraphStyle(
        "SectionTitle",
        fontName="Helvetica-Bold",
        fontSize=11.5,
        leading=15,
        textColor=C_EMERALD_DARK,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    styles["SubSectionTitle"] = ParagraphStyle(
        "SubSectionTitle",
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=13,
        textColor=C_SLATE_TEXT,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )
    styles["Body"] = ParagraphStyle(
        "Body",
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY,
        spaceAfter=5
    )
    styles["BodyBold"] = ParagraphStyle(
        "BodyBold",
        parent=styles["Body"],
        fontName="Helvetica-Bold"
    )
    styles["Bullet"] = ParagraphStyle(
        "Bullet",
        parent=styles["Body"],
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3
    )
    styles["FormulaBox"] = ParagraphStyle(
        "FormulaBox",
        fontName="Courier-Bold",
        fontSize=9.5,
        leading=13.5,
        textColor=C_NAVY_DARK,
        alignment=TA_CENTER
    )
    styles["CalloutText"] = ParagraphStyle(
        "CalloutText",
        fontName="Helvetica",
        fontSize=8.5,
        leading=12.5,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY
    )
    styles["CalloutTitle"] = ParagraphStyle(
        "CalloutTitle",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12.5,
        textColor=C_EMERALD_DARK,
        spaceAfter=3
    )
    styles["TableHeader"] = ParagraphStyle(
        "TableHeader",
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10.5,
        textColor=C_WHITE,
        alignment=TA_CENTER
    )
    styles["TableCell"] = ParagraphStyle(
        "TableCell",
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=C_SLATE_TEXT,
        alignment=TA_LEFT
    )
    styles["TableCellBold"] = ParagraphStyle(
        "TableCellBold",
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=10,
        textColor=C_NAVY_DARK,
        alignment=TA_LEFT
    )
    styles["TableCellCenter"] = ParagraphStyle(
        "TableCellCenter",
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=C_SLATE_TEXT,
        alignment=TA_CENTER
    )
    styles["RefABNT"] = ParagraphStyle(
        "RefABNT",
        fontName="Helvetica",
        fontSize=8,
        leading=11.5,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY,
        leftIndent=14,
        firstLineIndent=-14,
        spaceAfter=6
    )

    return styles

# =============================================================================
# BLOCOS VISUAIS CUSTOMIZADOS
# =============================================================================
def make_callout(titulo, texto, cor_borda=C_EMERALD_MID, cor_fundo=C_MINT_BG, largura=174*mm):
    styles = get_sarel_styles()
    conteudo = [
        Paragraph(titulo, ParagraphStyle("CT", parent=styles["CalloutTitle"], textColor=cor_borda)),
        Paragraph(texto, styles["CalloutText"])
    ]
    t = Table([[conteudo]], colWidths=[largura])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), cor_fundo),
        ('BOX', (0, 0), (-1, -1), 0.8, cor_borda),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    return t

def make_formula_card(titulo_formula, formula_str, explicacao_str, largura=174*mm):
    styles = get_sarel_styles()
    conteudo = [
        Paragraph(f"<b>{titulo_formula}</b>", styles["CalloutTitle"]),
        Spacer(1, 2*mm),
        Paragraph(formula_str, styles["FormulaBox"]),
        Spacer(1, 2*mm),
        Paragraph(f"<i>Explicação física:</i> {explicacao_str}", styles["CalloutText"])
    ]
    t = Table([[conteudo]], colWidths=[largura])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ('BOX', (0, 0), (-1, -1), 0.8, C_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    return t

# =============================================================================
# CONSTRUÇÃO DO DOCUMENTO
# =============================================================================
def construir_manual_pdf(caminho_saida):
    doc = SimpleDocTemplate(
        caminho_saida,
        pagesize=A4,
        leftMargin=18*mm,
        rightMargin=18*mm,
        topMargin=20*mm,
        bottomMargin=20*mm
    )
    styles = get_sarel_styles()
    story = []

    largura_util = 174 * mm

    # -------------------------------------------------------------------------
    # CAPA DO MANUAL TÉCNICO
    # -------------------------------------------------------------------------
    story.append(Spacer(1, 10*mm))
    story.append(Paragraph("UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ (UTFPR)", ParagraphStyle("CabecInst", fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=C_EMERALD_DARK, alignment=TA_CENTER)))
    story.append(Paragraph("CAMPUS MEDIANEIRA — PROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO (PPGTCA)", ParagraphStyle("SubInst", fontName="Helvetica", fontSize=9, leading=12, textColor=C_SLATE_MUTED, alignment=TA_CENTER)))
    story.append(Spacer(1, 15*mm))

    story.append(HRFlowable(width="100%", thickness=2.5, color=C_EMERALD_MID, spaceBefore=0, spaceAfter=8*mm))

    story.append(Paragraph("SISTEMA SAREL v2.0", ParagraphStyle("TitleTop", fontName="Helvetica-Bold", fontSize=26, leading=30, textColor=C_NAVY_DARK, alignment=TA_CENTER)))
    story.append(Paragraph("Manual Metodológico, Passo a Passo Operacional e Formulações Matemáticas", ParagraphStyle("TitleMid", fontName="Helvetica-Bold", fontSize=14, leading=18, textColor=C_EMERALD_DARK, alignment=TA_CENTER)))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph("Validação e Predição de Erosão Laminar com Sensoriamento Remoto Multitemporal e Gradient Tree Boosting (XGBoost) na Bacia Hidrográfica do Paraná 3 (BP3)", ParagraphStyle("TitleDesc", fontName="Helvetica", fontSize=10.5, leading=14, textColor=C_SLATE_TEXT, alignment=TA_CENTER)))

    story.append(HRFlowable(width="100%", thickness=1, color=C_BORDER_LIGHT, spaceBefore=8*mm, spaceAfter=15*mm))

    # Box de identificação
    info_box = [
        Paragraph("<b>Pesquisador:</b> Luis Alfredo (Mestrando PPGTCA 2026)", styles["CalloutText"]),
        Paragraph("<b>Área de Concentração:</b> Tecnologias Computacionais Aplicadas ao Agronegócio e Recursos Hídricos", styles["CalloutText"]),
        Paragraph("<b>Linha de Pesquisa:</b> Sensoriamento Remoto, Ciência de Dados e Modelagem Espaço-Temporal", styles["CalloutText"]),
        Paragraph("<b>Área de Estudo:</b> Bacia Hidrográfica do Paraná 3 (BP3) — Estado do Paraná, Brasil", styles["CalloutText"]),
        Paragraph("<b>Versão do Sistema:</b> 2.0.0 (Homologada em Setembro de 2026)", styles["CalloutText"]),
        Paragraph("<b>Normatização:</b> ABNT NBR 6023:2018 (Referências) e NBR 10520:2023 (Citações)", styles["CalloutText"]),
    ]
    t_info = Table([[info_box]], colWidths=[largura_util])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('BOX', (0, 0), (-1, -1), 1, C_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(t_info)

    story.append(Spacer(1, 20*mm))
    story.append(Paragraph("MEDIANEIRA — PARANÁ<br/>2026", ParagraphStyle("LocalData", fontName="Helvetica-Bold", fontSize=9.5, leading=13, textColor=C_SLATE_MUTED, alignment=TA_CENTER)))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # SUMÁRIO ANALÍTICO
    # -------------------------------------------------------------------------
    story.append(Paragraph("SUMÁRIO ANALÍTICO", styles["ChapterTitle"]))
    story.append(HRFlowable(width="100%", thickness=1, color=C_EMERALD_MID, spaceBefore=1*mm, spaceAfter=4*mm))

    sumario_itens = [
        ("1.", "Contexto Científico, Hipótese de Pesquisa e Limitações Espectrais"),
        ("2.", "Arquitetura Computacional e Distribuição dos Cálculos (GEE vs. Local vs. Planet vs. Jev vs. Treinamento)"),
        ("3.", "O Subsistema Cognitivo Jev (TypeSafe AI): Propósito, Degradação Graciosa e Blindagem contra Circularidade"),
        ("4.", "Passo a Passo Operacional do Aplicativo SAREL (Workflow de 10 Etapas)"),
        ("5.", "Cálculos e Modelos Matemáticos Detalhados (12 Formulações Fundamentais)"),
        ("6.", "Validação Espaço-Temporal: Modelo D (Detecção) vs. Modelo P (Prognóstico com Guarda Bienal de 24 Meses)"),
        ("7.", "Governança Científica do Sistema: As 9 Regras Invioláveis e os 7 Invariantes de Integridade"),
        ("8.", "Referências Bibliográficas Completas segundo as Normas da ABNT (NBR 6023:2018 e NBR 10520:2023)"),
    ]

    for num, tit in sumario_itens:
        p_s = Paragraph(f"<b>{num}</b> {tit}", styles["Body"])
        story.append(p_s)
        story.append(Spacer(1, 1.5*mm))

    story.append(Spacer(1, 6*mm))

    # -------------------------------------------------------------------------
    # SEÇÃO 1: CONTEXTO CIENTÍFICO E HIPÓTESE
    # -------------------------------------------------------------------------
    story.append(Paragraph("1. Contexto Científico, Hipótese de Pesquisa e Limitações Espectrais", styles["ChapterTitle"]))
    story.append(HRFlowable(width="100%", thickness=0.8, color=C_EMERALD_MID, spaceBefore=1*mm, spaceAfter=3*mm))

    story.append(Paragraph(
        "A erosão laminar é o processo erosivo de maior magnitude em perdas volumétricas de solo na agricultura tropical, "
        "consistindo no desprendimento e arraste uniforme e sub-milimétrico das partículas mais férteis dos horizontes "
        "superficiais do solo pelo impacto de gotas de chuva (<i>splash</i>) e pelo escoamento superficial difuso. "
        "No entanto, sua detecção remota via satélite enfrenta um desafio epistemológico e físico seminal apontado na literatura "
        "(VRIELING, 2006): <b>sensores orbitais de média resolução espacial (como o Sentinel-2, com pixel de 10 a 20 metros) "
        "não são biofisicamente capazes de mensurar a lâmina de solo perdida diretamente</b>. "
        "O que os sensores registram são <i>proxies espectrais</i> da degradação, tais como: (a) o empobrecimento em matéria orgânica; "
        "(b) a exposição de horizontes subsuperficiais com enriquecimento de óxidos de ferro; (c) a redução crônica de biomassa vegetal; "
        "e (d) a alternância persistente entre solo exposto e palhada residual desprotegida.",
        styles["Body"]
    ))

    story.append(Paragraph(
        "A pesquisa de mestrado do PPGTCA/UTFPR tem como objetivo científico central: <b>validar ou não a localização e predição "
        "de erosão laminar utilizando sensoriamento remoto multitemporal e o algoritmo de aprendizado de máquina supervisionado XGBoost "
        "(Extreme Gradient Boosting)</b> na Bacia Hidrográfica do Paraná 3. "
        "Para atingir esse objetivo com validade científica reprodutível, o SAREL foi construído para sanar as quatro grandes lacunas "
        "críticas identificadas na literatura recente de Machine Learning aplicado a geociências: "
        "(1) a suposição ingênua de que resolução espacial de 10 m enxerga diretamente erosão laminar; "
        "(2) o vazamento de dados temporal (<i>data leakage</i>) provocado pelo treinamento com dados contemporâneos ao dano (KAUFMAN et al., 2012); "
        "(3) o viés inflacionário nas métricas de acurácia induzido por validação cruzada aleatória simples na presença de autocorrelação espacial (ROBERTS et al., 2017); e "
        "(4) a circularidade metodológica decorrente da utilização de estimativas da RUSLE como rótulos de aprendizado.",
        styles["Body"]
    ))

    story.append(Spacer(1, 3*mm))

    # -------------------------------------------------------------------------
    # SEÇÃO 2: ARQUITETURA COMPUTACIONAL E ONDE OS CÁLCULOS SÃO FEITOS
    # -------------------------------------------------------------------------
    story.append(Paragraph("2. Arquitetura Computacional e Distribuição dos Cálculos", styles["ChapterTitle"]))
    story.append(HRFlowable(width="100%", thickness=0.8, color=C_EMERALD_MID, spaceBefore=1*mm, spaceAfter=3*mm))

    story.append(Paragraph(
        "Para garantir escalabilidade para bacias hidrográficas com milhões de hectares e, simultaneamente, preservar "
        "o determinismo físico e a segurança contra vazamento de dados, o SAREL divide suas operações em cinco camadas computacionais bem demarcadas. "
        "A tabela a seguir esclarece exaustivamente onde cada cálculo é executado no sistema:",
        styles["Body"]
    ))

    tabela_onde = [
        [
            Paragraph("Ambiente / Motor", styles["TableHeader"]),
            Paragraph("Tecnologia Subjacente", styles["TableHeader"]),
            Paragraph("Cálculos e Procedimentos Realizados", styles["TableHeader"]),
            Paragraph("Fundamentação / Propósito", styles["TableHeader"])
        ],
        [
            Paragraph("<b>Google Earth Engine (GEE)</b>", styles["TableCellBold"]),
            Paragraph("API Cloud Python / Earth Engine Service", styles["TableCell"]),
            Paragraph("• Filtragem por máscara QA60/SCL (nuvem/sombra)<br/>• Extração de reflectâncias Sentinel-2 L2A (2016-2026)<br/>• Declividade contínua (%) do Copernicus DEM 30m<br/>• Redução zonal diária CHIRPS e semi-horária IMERG GPM<br/>• Máscara agrícola ESA WorldCover e buffers de corpos d'água", styles["TableCell"]),
            Paragraph("Processamento massivo em nuvem sobre petabytes de imagens, sem sobrecarregar a máquina local.", styles["TableCell"])
        ],
        [
            Paragraph("<b>Motor Local SAREL</b>", styles["TableCellBold"]),
            Paragraph("TypeScript / Node.js (Edge / On-Premise)", styles["TableCell"]),
            Paragraph("• Estratificação 3D (18 estratos: S^ x E^ x K^)<br/>• Spatial Thinning geodésico determinístico (1 km)<br/>• Lags multitemporais (t0, t-3m, t-6m, t-12m)<br/>• Ajuste harmônico OLS e persistência CCDC<br/>• Fator C (Durigon) e Fator K (Embrapa Doc. 246)<br/>• Cálculo do Kappa de Cohen e validação dos 7 Invariantes<br/>• Cruzamento espacial fundiário com bases SQLite locais", styles["TableCell"]),
            Paragraph("Execução 100% determinística, auditável e reprodutível; não depende de conectividade externa para auditar.", styles["TableCell"])
        ],
        [
            Paragraph("<b>PlanetScope API</b>", styles["TableCellBold"]),
            Paragraph("API REST Planet (Cenas PSScene 8B)", styles["TableCell"]),
            Paragraph("• Recortes de altíssima resolução espacial (3 metros)<br/>• Trios de eventos pluviométricos (T-, T0, T+)<br/>• Restrições angulares de visada (Delta zenital <= 10 graus)<br/>• Insumo visual para interpretação cega da Fase A", styles["TableCell"]),
            Paragraph("Permite identificar feições erosivas sub-pixel Sentinel-2 (microrravinas e incisões laminares severas).", styles["TableCell"])
        ],
        [
            Paragraph("<b>Auditoria Cognitiva Jev</b>", styles["TableCellBold"]),
            Paragraph("TypeSafe AI Client (System One)", styles["TableCell"]),
            Paragraph("• Julgamento booleano calibrado (Noul)<br/>• Classificação de manejo em taxonomia fechada (Choice)<br/>• Score ordinal estruturado de suscetibilidade (0 a 4)<br/>• Detecção de anomalias espectrais pré-campo", styles["TableCell"]),
            Paragraph("Acelera triagem em lote. Em falhas, comuta automaticamente para o Motor Local RUSLE (Degradação Graciosa).", styles["TableCell"])
        ],
        [
            Paragraph("<b>Ambiente de IA Supervisionada</b>", styles["TableCellBold"]),
            Paragraph("Python / XGBoost / Scikit-Learn / SHAP", styles["TableCell"]),
            Paragraph("• Treinamento de árvores de gradiente impulsionado<br/>• Otimização com regularizações L1/L2 e scale_pos_weight<br/>• Spatial Block Cross-Validation com buffer de 1 km<br/>• Janela de guarda temporal bienal de 24 meses (Modelo P)<br/>• Atribuição de importância física via valores SHAP", styles["TableCell"]),
            Paragraph("Modelagem preditiva externa alimentada exclusivamente por matriz desidentificada e rótulos humanos auditados.", styles["TableCell"])
        ]
    ]

    t_onde = Table(tabela_onde, colWidths=[32*mm, 30*mm, 72*mm, 40*mm])
    t_onde.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_NAVY_DARK),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_onde)
    story.append(Spacer(1, 4*mm))

    # -------------------------------------------------------------------------
    # SEÇÃO 3: O USO DO JEV
    # -------------------------------------------------------------------------
    story.append(Paragraph("3. O Subsistema Cognitivo Jev (TypeSafe AI): Propósito, Degradação Graciosa e Blindagem contra Circularidade", styles["ChapterTitle"]))
    story.append(HRFlowable(width="100%", thickness=0.8, color=C_EMERALD_MID, spaceBefore=1*mm, spaceAfter=3*mm))

    story.append(Paragraph(
        "O <b>Jev</b> opera no SAREL como um auditor auxiliar inteligente ('System One'). "
        "Ele foi projetado especificamente para superar as fragilidades dos modelos de linguagem gerais, "
        "operando sob contratos estritos de tipos (<i>TypeSafe AI</i>) que impedem alucinações e garantem respostas em três formatos primitivos:",
        styles["Body"]
    ))

    story.append(Paragraph("• <b>Noul (Julgamento Booleano Calibrado):</b> Avalia asserções físicas (ex: 'Há indício biofísico de solo exposto sob declive moderado?') retornando <code>true/false</code> associado a uma estimativa de probabilidade/confiança (0.0 a 1.0) e justificativa formal.", styles["Bullet"]))
    story.append(Paragraph("• <b>Choice (Classificação Categórica):</b> Enquadra a condição observada em uma taxonomia fechada de uso e cobertura do solo ('Plantio Direto Consolidado', 'Solo Exposto Degradado', 'Preparo Reduzido / Vegetação em Desenvolvimento').", styles["Bullet"]))
    story.append(Paragraph("• <b>Score (Escala Ordinal Estruturada):</b> Avalia o grau ordinal de suscetibilidade em escala de 0 a 4 (0: Nula, 1: Baixa, 2: Moderada, 3: Alta, 4: Crítica).", styles["Bullet"]))

    story.append(Spacer(1, 2*mm))

    box_jev_deg = make_callout(
        "Mecanismo de Degradação Graciosa (Dual-Engine: Jev vs. Motor Local RUSLE)",
        "O SAREL adota uma arquitetura resiliente de tolerância a falhas. O uso do Jev é uma opção do pesquisador para acelerar "
        "a inspeção preliminar de grandes lotes de candidatos e priorizar rotas de campo. "
        "Caso a chave de API do Jev não seja configurada, ocorra perda de conectividade de rede, timeout ou quota esgotada, "
        "o sistema aciona de forma 100% automática o <b>MOTOR_LOCAL_RUSLE</b> determinístico (implementado em <code>src/lib/jev/fallbackLocal.ts</code>). "
        "O laudo gerado registra a proveniência exata da auditoria e o motivo técnico da comutação (ex: 'Chave do Jev não configurada'), "
        "assegurando que o fluxo de trabalho nunca seja interrompido.",
        cor_borda=C_CYAN_DARK, cor_fundo=C_CYAN_BG
    )
    story.append(box_jev_deg)
    story.append(Spacer(1, 2.5*mm))

    box_jev_regra = make_callout(
        "A REGRA INVIOLÁVEL 4: Blindagem contra Circularidade Metodológica",
        "É terminantemente proibido utilizar o julgamento, a probabilidade ou o score do Jev como rótulo (target) na matriz de treino do XGBoost! "
        "Se um modelo de aprendizado de máquina fosse treinado com predições geradas por outro modelo de IA ou por equações da RUSLE, "
        "ocorreria uma falácia circular destrutiva: a IA aprenderia a imitar aproximações matemáticas pré-existentes, e não a realidade biofísica do terreno. "
        "No SAREL, o rótulo da verdade terrestre provém EXCLUSIVAMENTE de observações primárias humanas blindadas (Fase A PlanetScope, Fase B Campo e Fase D Drone).",
        cor_borda=C_ROSE_DARK, cor_fundo=C_ROSE_BG
    )
    story.append(box_jev_regra)
    story.append(Spacer(1, 4*mm))

    # -------------------------------------------------------------------------
    # SEÇÃO 4: PASSO A PASSO OPERACIONAL DO APLICATIVO SAREL
    # -------------------------------------------------------------------------
    story.append(Paragraph("4. Passo a Passo Operacional do Aplicativo SAREL (Workflow de 10 Etapas)", styles["ChapterTitle"]))
    story.append(HRFlowable(width="100%", thickness=0.8, color=C_EMERALD_MID, spaceBefore=1*mm, spaceAfter=3*mm))

    passos_detalhados = [
        ("Passo 1: Delimitação da AOI e Filtragem de Elegibilidade Agrícola",
         "O pesquisador seleciona o limite hidrográfico da Área de Interesse (Bacia do Paraná 3). "
         "O sistema consulta a coleção do ESA WorldCover (10 m) e retém exclusivamente as classes agrícolas: 30 (lavouras), 40 (mosaicos agrícolas) e 60 (pastagens manejadas). "
         "São aplicadas zonas de exclusão física obrigatórias: faixa de proteção de 30 metros ao longo de corpos d'água e buffer de 150 metros em torno de manchas urbanas e rodovias."),

        ("Passo 2: Estratificação Geoespacial Multivariada (18 Estratos Disjuntos)",
         "Para garantir representatividade amostral e mitigar o viés de seleção espacial, a AOI é particionada em 18 estratos tridimensionais (3 x 3 x 2): "
         "(a) Tercis de declividade S^ extraídos do Copernicus DEM GLO-30 (Plano/Suave, Moderado, Forte); "
         "(b) Tercis de frequência histórica de solo exposto E^ extraídos da série multianual Sentinel-2; e "
         "(c) 2 níveis de erodibilidade pedológica K^ calibrados pela Decisão D09 (Nível 1: K <= 0.0285 t·h/(MJ·mm); Nível 2: K >= 0.0300 t·h/(MJ·mm))."),

        ("Passo 3: Rarefação Espacial Geodésica (Spatial Thinning)",
         "Aplica-se o algoritmo determinístico de Fisher-Yates com semente pseudoaleatória controlada e registrada (P07). "
         "O thinning impõe uma restrição de distância euclidiana mínima de 1,0 km entre quaisquer pares de pontos selecionados. "
         "Isso neutraliza a autocorrelação espacial local redundante (ROBERTS et al., 2017) e impede a concentração viciada de amostras em um único talhão."),

        ("Passo 4: Agrupamento em Blocos Espaciais (Spatial Blocks)",
         "Os pontos são agregados em macroblocos poligonais com aresta média de 20 km (P01), dimensão ancorada no alcance de continuidade espacial do semivariograma empírico. "
         "Essa partição viabiliza a Validação Cruzada Espacial em Blocos (Spatial Block CV), garantindo que dados de treino e teste pertençam a zonas pedológicas e climáticas distintas."),

        ("Passo 5: Extração Multitemporal e Índices Biofísicos Orbitais",
         "Para cada ponto amostral elegível, o SAREL extrai a série histórica completa de reflectâncias de superfície Sentinel-2 L2A (2016 a 2026), "
         "filtrando pixels contaminados por nuvem ou sombra via máscara QA60/SCL. "
         "São computados os índices NDVI e BSI para cada cena orbital sem nuvem. Exige-se um mínimo de 6 observações válidas por janela temporal (Decisão D11)."),

        ("Passo 6: Decomposição Harmônica e Discriminação de Persistência Temporal",
         "O motor local ajusta modelos de regressão linear por Mínimos Quadrados Ordinários (OLS) com 1 e 2 ciclos anuais (Zhu & Woodcock, 2014) sobre o NDVI e o SWIR B12. "
         "Calcula-se a frequência temporal de solo nu com o limiar estrito NDVI <= 0.25 (calibrado no sistema GEOS3 por Demattê et al., 2018 e Safanelli et al., 2021 — Decisão D10). "
         "Isso separa com rigor físico o pousio agrícola transitório (preparo do solo com rápida recuperação de dossel) da degradação crônica por erosão laminar."),

        ("Passo 7: Montagem da Linha de Base RUSLE (A = R · K · LS · C · P)",
         "Calcula-se a perda de solo empírica de referência integrando: Fator C (Durigon et al., 2014 / Decisão D01); "
         "Fator K numérico contínuo derivado da Tabela 5 da Embrapa Solos (Doc. 246/2024 / Mannigel et al., 2002 — Decisão D14); "
         "Fator P conservador (Renard et al., 1997); Fatores R e LS. "
         "O Invariante 1 valida rigorosamente que a perda de solo e sua memória de cálculo só existem se os 5 fatores estiverem preenchidos numericamente."),

        ("Passo 8: Protocolos Cegos de Rotulagem Multicamada (Fases A, B e D)",
         "Curadoria humana estrita de verdade terrestre: "
         "• Fase A (PlanetScope 3 m): Recortes de alta resolução temporal e espacial analisados por dois intérpretes humanos em teste cego, validados via Kappa de Cohen (k >= 0.60); "
         "• Fase B (Campo): Vistorias presenciais orientadas por formulário KoboToolbox com cruzamento cadastral fundiário em bases do SICAR, SIGEF e SNCR; "
         "• Fase D (Drone): Ortomosaicos centimétricos (2 cm/pixel) isolados como conjunto held-out independente (Regra 6)."),

        ("Passo 9: Modelagem Preditiva com Gradient Tree Boosting (XGBoost)",
         "A matriz tabular consolidada (contendo variáveis topográficas, climáticas, biofísicas, lags multitemporais e persistência espectral) é exportada "
         "com coordenadas desidentificadas e submetida ao treinamento do XGBoost (Chen & Guestrin, 2016). "
         "Otimizam-se os hiperparâmetros de regularização (gamma, lambda, alpha) e compensa-se o desbalanceamento amostral severo com scale_pos_weight."),

        ("Passo 10: Avaliação Espaço-Temporal e Explicabilidade Biofísica via SHAP",
         "O modelo é submetido a duas modalidades de validação: "
         "(a) Modelo D (Detecção contemporânea até t0); e "
         "(b) Modelo P (Prognóstico antecipado), isolado por janela de guarda temporal de 24 meses (2 anos) antes do dano (KAUFMAN et al., 2012 — Decisão D04). "
         "Os valores SHAP (Lundberg & Lee, 2017) são computados para desvendar a importância marginal de cada preditor e confrontar os resultados com os processos pedológicos da RUSLE.")
    ]

    for p_tit, p_desc in passos_detalhados:
        story.append(Paragraph(p_tit, styles["SectionTitle"]))
        story.append(Paragraph(p_desc, styles["Body"]))
        story.append(Spacer(1, 1.5*mm))

    story.append(Spacer(1, 3*mm))

    # -------------------------------------------------------------------------
    # SEÇÃO 5: CÁLCULOS E MODELOS MATEMÁTICOS DETALHADOS
    # -------------------------------------------------------------------------
    story.append(Paragraph("5. Cálculos e Modelos Matemáticos Detalhados", styles["ChapterTitle"]))
    story.append(HRFlowable(width="100%", thickness=0.8, color=C_EMERALD_MID, spaceBefore=1*mm, spaceAfter=3*mm))

    # Equação 1: NDVI
    story.append(make_formula_card(
        "1. Índice de Vegetação por Diferença Normalizada (NDVI — ROUSE et al., 1974)",
        "NDVI = (B8 - B4) / (B8 + B4)",
        "Mede o contraste entre a forte absorção fotossintética da clorofila na banda do Vermelho (B4: 665 nm) e a alta espalhabilidade celular no Infravermelho Próximo (B8: 842 nm). Varia no domínio biofísico [-1.0, +1.0]. Valores > 0.65 caracterizam cobertura vegetal densa e consolidada (Sistema Plantio Direto); valores <= 0.25 caracterizam solo mineralizado exposto."
    ))
    story.append(Spacer(1, 2.5*mm))

    # Equação 2: BSI
    story.append(make_formula_card(
        "2. Índice de Solo Exposto (Bare Soil Index — BSI — RIKIMARU et al., 2002)",
        "BSI = [(B11 + B4) - (B8 + B2)] / [(B11 + B4) + (B8 + B2)]",
        "Combina as bandas do SWIR-1 (B11: 1610 nm) e Vermelho (B4) contra o NIR (B8) e Azul (B2: 490 nm). O solo seco e erodido apresenta forte reflectância no SWIR e absorção no visível, elevando o BSI para valores positivos (> 0.10). Vegetação vigorosa empurra o BSI para valores fortemente negativos (< 0.00)."
    ))
    story.append(Spacer(1, 2.5*mm))

    # Equação 3: Decomposição Harmônica OLS
    story.append(make_formula_card(
        "3. Decomposição Harmônica e Taxa de Degradação OLS (ZHU & WOODCOCK, 2014)",
        "y^(t) = c0 + c1·t + SUM_{k=1..m} [ ak·cos(2·pi·k·t / T) + bk·sen(2·pi·k·t / T) ]",
        "Regressão linear por Mínimos Quadrados Ordinários ajustando componentes sazonais cíclicos (harmônicos anuais e semestrais) e uma componente de tendência linear (c1). O coeficiente c1 na banda SWIR B12 atua como indicador de degradação: declives positivos persistentes safra após safra evidenciam perda de horizonte A orgânico e exposição crônica de horizonte B textural rico em ferro."
    ))
    story.append(Spacer(1, 2.5*mm))

    # Equação 4: Frequência de Solo Nu
    story.append(make_formula_card(
        "4. Frequência Multianual de Solo Exposto (E^ — Decisão D10 / GEOS3)",
        "E^ = (1 / N_valido) * SUM_{i=1..N_valido} I(NDVI_i <= 0.25)",
        "Fração temporal em que o solo permaneceu descoberto durante a série histórica. Fundamentada nos trabalhos do sistema GEOS3 (DEMATTÊ et al., 2018; SAFANELLI et al., 2021), a adoção do limiar estrito NDVI <= 0.25 elimina falsos positivos decorrentes de resíduos secos de palhada de Plantio Direto (que apresentam NDVI entre 0.28 e 0.38)."
    ))
    story.append(Spacer(1, 2.5*mm))

    # Equação 5: Fator C da RUSLE
    story.append(make_formula_card(
        "5. Fator C de Cobertura e Manejo da RUSLE Regional Tropical (DURIGON et al., 2014 — Decisão D01)",
        "C = [ (1 - NDVI) / 2 ]^(1 + NDVI)",
        "Modela a atenuação das perdas de solo pela cobertura vegetal sob condições edafoclimáticas brasileiras. Para solo completamente desnudo (NDVI = 0.0), C = 0.50; para cobertura vegetal em desenvolvimento (NDVI = 0.50), C = 0.088; para dossel fechado (NDVI = 0.80), C = 0.026. Supera a formulação exponencial europeia de Van der Knijff et al. (2000), que subestima severamente o Fator C em áreas agrícolas tropicais."
    ))
    story.append(Spacer(1, 2.5*mm))

    # Equação 6: Fator K
    story.append(make_formula_card(
        "6. Fator K de Erodibilidade do Solo Numérico (Tabela 5 Embrapa Solos / MANNIGEL et al., 2002 — Decisão D14)",
        "K = [ 0.0052; 0.0117; 0.0218; 0.0360; 0.0518 ] t·h·MJ⁻¹·mm⁻¹",
        "Converte as 5 classes ordinais qualitativas da carta pedológica oficial da Embrapa Solos (Doc. 246/2024) para grandezas contínuas oficiais. Estratificação K^ (Decisão D09): Nível 1 = Baixa/Média erodibilidade (K <= 0.0285 t·h/(MJ·mm)); Nível 2 = Alta/Muito Alta erodibilidade (K >= 0.0300 t·h/(MJ·mm)). Feições não-agrícolas retornam 'fora-do-dominio'."
    ))
    story.append(Spacer(1, 2.5*mm))

    # Tabela 5 da Embrapa Solos
    story.append(Paragraph("Tabela 5 da Embrapa Solos (Doc. 246/2024 / Mannigel et al., 2002 / IBGE, 2018):", styles["SubSectionTitle"]))
    tab_k = [
        [Paragraph("Classe Pedológica", styles["TableHeader"]), Paragraph("Ordinal", styles["TableHeader"]), Paragraph("Faixa Oficial de K [t·h·MJ⁻¹·mm⁻¹]", styles["TableHeader"]), Paragraph("K Médio Adotado", styles["TableHeader"]), Paragraph("Estrato K^ (D09)", styles["TableHeader"])],
        [Paragraph("Muito baixa", styles["TableCellBold"]), Paragraph("1", styles["TableCellCenter"]), Paragraph("0,0020 a 0,0084", styles["TableCellCenter"]), Paragraph("0,0052", styles["TableCellCenter"]), Paragraph("Nível 1 (Baixa/Média)", styles["TableCellCenter"])],
        [Paragraph("Baixa", styles["TableCellBold"]), Paragraph("2", styles["TableCellCenter"]), Paragraph("0,0090 a 0,0144", styles["TableCellCenter"]), Paragraph("0,0117", styles["TableCellCenter"]), Paragraph("Nível 1 (Baixa/Média)", styles["TableCellCenter"])],
        [Paragraph("Média", styles["TableCellBold"]), Paragraph("3", styles["TableCellCenter"]), Paragraph("0,0150 a 0,0285", styles["TableCellCenter"]), Paragraph("0,0218", styles["TableCellCenter"]), Paragraph("Nível 1 (Baixa/Média)", styles["TableCellCenter"])],
        [Paragraph("Alta", styles["TableCellBold"]), Paragraph("4", styles["TableCellCenter"]), Paragraph("0,0300 a 0,0420", styles["TableCellCenter"]), Paragraph("0,0360", styles["TableCellCenter"]), Paragraph("Nível 2 (Alta/M. Alta)", styles["TableCellCenter"])],
        [Paragraph("Muito alta", styles["TableCellBold"]), Paragraph("5", styles["TableCellCenter"]), Paragraph("0,0450 a 0,0585", styles["TableCellCenter"]), Paragraph("0,0518", styles["TableCellCenter"]), Paragraph("Nível 2 (Alta/M. Alta)", styles["TableCellCenter"])],
    ]
    t_k = Table(tab_k, colWidths=[38*mm, 18*mm, 50*mm, 30*mm, 38*mm])
    t_k.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_NAVY_DARK),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_k)
    story.append(Spacer(1, 2.5*mm))

    # Equação 7: RUSLE
    story.append(make_formula_card(
        "7. Equação Universal de Perda de Solo Revisada (RUSLE — RENARD et al., 1997)",
        "A = R * K * LS * C * P   [t / (ha · ano)]",
        "Onde: A é a perda média anual de solo estimada; R é a erosividade da chuva (MJ·mm/(ha·h·ano)); K é a erodibilidade do solo (t·ha·h/(ha·MJ·mm)); LS é o fator topográfico adimensional de comprimento e declive da rampa; C é o fator de uso e cobertura vegetal; e P é o fator de práticas conservacionistas de suporte. Invariante 1: O SAREL impede o cálculo de A se qualquer um dos cinco fatores estiver ausente ou indefinido."
    ))
    story.append(Spacer(1, 2.5*mm))

    # Equação 8: Modelo G2
    story.append(make_formula_card(
        "8. Índice de Mecanismo Dinâmico Pluviometria-Exposição (Modelo G2 — KARYDAS & PANAGOS, 2018)",
        "I_mecanismo = SUM_{t=1..T} [ R_t * I(NDVI_t <= 0.25) ]",
        "Acopla temporalmente a série de precipitação diária com a condição fenológica do solo. Captura a essência física da erosão hídrica: o impacto de temporais severos de chuva (elevado R_t) incidentes exatamente nos dias em que o terreno agrícola encontrava-se desprotegido de vegetação ou palhada residual (NDVI_t <= 0.25)."
    ))
    story.append(Spacer(1, 2.5*mm))

    # Equação 9 e 10: XGBoost
    story.append(make_formula_card(
        "9. Função Objetivo Regularizada do XGBoost (CHEN & GUESTRIN, 2016)",
        "L^(t) ~ SUM_{i=1..n} [ gi · ft(xi) + 0.5 · hi · ft^2(xi) ] + gamma · T + 0.5 · lambda · SUM_{j=1..T} wj^2",
        "Otimização em cada iteração de boosting t baseada na expansão em série de Taylor de segunda ordem da função de perda l(yi, y^i). gi e hi representam, respectivamente, o gradiente de primeira ordem e a hessiana de segunda ordem. A penalidade gamma controla o número de folhas T (complexidade da árvore) e lambda controla a regularização L2 sobre os pesos das folhas wj, evitando sobreajuste (overfitting)."
    ))
    story.append(Spacer(1, 2.5*mm))

    story.append(make_formula_card(
        "10. Critério de Ganho de Divisão de Árvore no XGBoost (Split Gain)",
        "Gain = 0.5 * [ (GL)^2 / (HL + lambda) + (GR)^2 / (HR + lambda) - (GL + GR)^2 / (HL + HR + lambda) ] - gamma",
        "Determina de forma exata se a divisão de um nó pai nos nós filhos esquerdo (L) e direito (R) resulta em redução de perda estatística suficiente para compensar o custo de regularização gamma da árvore. Se Gain <= 0, o algoritmo realiza a poda (pruning) do ramo."
    ))
    story.append(Spacer(1, 2.5*mm))

    # Equação 11: Kappa
    story.append(make_formula_card(
        "11. Concordância Inter-intérpretes (Índice Kappa de Cohen — LANDIS & KOCH, 1977)",
        "kappa = (Po - Pe) / (1 - Pe)",
        "Calcula a concordância observada (Po) corrigida pelo efeito puramente casual do acaso (Pe) entre dois fotointérpretes humanos independentes que avaliaram cegamente a presença de erosão laminar nas imagens de alta resolução PlanetScope (Fase A). Valores de kappa >= 0.60 asseguram concordância substancial e aprovam o ponto amostral para a matriz de treino."
    ))
    story.append(Spacer(1, 2.5*mm))

    # Equação 12: SHAP
    story.append(make_formula_card(
        "12. Valores SHAP de Explicabilidade Aditiva (LUNDBERG & LEE, 2017)",
        "phi_i(f, x) = SUM_{S subseteq F \\ {i}} [ |S|! · (|F| - |S| - 1)! / |F|! ] * [ fx(S U {i}) - fx(S) ]",
        "Calcula a contribuição marginal de cada preditor i na probabilidade final de erosão predita pelo XGBoost, ancorado na teoria dos jogos cooperativos de Shapley. Permite responder com rigor científico: 'Quais variáveis biofísicas foram determinantes para classificar este ponto como erodido?' — abrindo integralmente a 'caixa-preta' do algoritmo."
    ))
    story.append(Spacer(1, 4*mm))

    # -------------------------------------------------------------------------
    # SEÇÃO 6: VALIDAÇÃO ESPAÇO-TEMPORAL (MODELO D VS. MODELO P)
    # -------------------------------------------------------------------------
    story.append(Paragraph("6. Validação Espaço-Temporal: Modelo D (Detecção) vs. Modelo P (Prognóstico com Guarda Bienal)", styles["ChapterTitle"]))
    story.append(HRFlowable(width="100%", thickness=0.8, color=C_EMERALD_MID, spaceBefore=1*mm, spaceAfter=3*mm))

    story.append(Paragraph(
        "Uma das inovações metodológicas cruciais do SAREL reside na <b>segregação formal entre o problema de detecção contemporânea e o problema de prognóstico preventivo</b>. "
        "Na literatura comum, modelos frequentemente utilizam imagens da mesma safra do dano para 'prever' erosão, "
        "o que incorre em vazamento severo de informação (<i>data leakage</i> — KAUFMAN et al., 2012): o algoritmo não aprende a prever o risco futuro, "
        "mas apenas a identificar que o solo já está destruído.",
        styles["Body"]
    ))

    tabela_dp = [
        [
            Paragraph("Critério Metodológico", styles["TableHeader"]),
            Paragraph("Modelo D (Detecção Contemporânea)", styles["TableHeader"]),
            Paragraph("Modelo P (Prognóstico Preventivo)", styles["TableHeader"])
        ],
        [
            Paragraph("<b>Objetivo Científico</b>", styles["TableCellBold"]),
            Paragraph("Mapear a ocorrência contemporânea da feição erosiva que já se consolidou no terreno.", styles["TableCell"]),
            Paragraph("Estimar a suscetibilidade e probabilidade futura de ocorrência de erosão ANTES que o dano ocorra.", styles["TableCell"])
        ],
        [
            Paragraph("<b>Janela Temporal Permitida</b>", styles["TableCellBold"]),
            Paragraph("Série temporal orbitando continuamente até a data exata da observação (t0).", styles["TableCell"]),
            Paragraph("Série temporal truncada com <b>janela de guarda obrigatória de 24 meses (2 anos)</b> antes de t0 (Decisão D04).", styles["TableCell"])
        ],
        [
            Paragraph("<b>Fundamentação da Guarda</b>", styles["TableCellBold"]),
            Paragraph("Não se aplica (cenário pericial contemporâneo).", styles["TableCell"]),
            Paragraph("Kaufman et al. (2012) e ciclo de rotação de culturas bienal soja-milho safrinha da Embrapa Soja.", styles["TableCell"])
        ],
        [
            Paragraph("<b>Sinais Biofísicos Chave</b>", styles["TableCellBold"]),
            Paragraph("Horizonte B exposto, BSI > 0.10, ausência drástica de biomassa verde.", styles["TableCell"]),
            Paragraph("Histórico de manejo, baixa rotação de palhada, persistência de solo nu em safras passadas, declividade e erodibilidade.", styles["TableCell"])
        ],
        [
            Paragraph("<b>Estratégia de Validação Cruzada</b>", styles["TableCellBold"]),
            Paragraph("Spatial Block Cross-Validation (ROBERTS et al., 2017) com buffer geodésico de 1 km.", styles["TableCell"]),
            Paragraph("Spatial Block Cross-Validation combinado com Particionamento Temporal Estrito (Roberts et al., 2017).", styles["TableCell"])
        ],
        [
            Paragraph("<b>Utilidade Prática no Agronegócio</b>", styles["TableCellBold"]),
            Paragraph("Perícia judicial de crimes ambientais, quantificação de passivos, fiscalização de órgãos de controle.", styles["TableCell"]),
            Paragraph("Planejamento conservacionista preditivo, concessão de crédito rural sustentável, precificação de seguro agrícola.", styles["TableCell"])
        ]
    ]

    t_dp = Table(tabela_dp, colWidths=[42*mm, 66*mm, 66*mm])
    t_dp.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_NAVY_DARK),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_dp)
    story.append(Spacer(1, 4*mm))

    # -------------------------------------------------------------------------
    # SEÇÃO 7: GOVERNANÇA, REGRAS E INVARIANTES
    # -------------------------------------------------------------------------
    story.append(Paragraph("7. Governança Científica do Sistema: As 9 Regras Invioláveis e os 7 Invariantes de Integridade", styles["ChapterTitle"]))
    story.append(HRFlowable(width="100%", thickness=0.8, color=C_EMERALD_MID, spaceBefore=1*mm, spaceAfter=3*mm))

    story.append(Paragraph(
        "A integridade computacional do SAREL é garantida por testes automatizados contínuos que bloqueiam "
        "qualquer desvio metodológico ou inserção de dados artificiais. O sistema é regido por <b>9 Regras Invioláveis</b> e <b>7 Invariantes</b>:",
        styles["Body"]
    ))

    regras_desc = [
        ("Regra 1 — Sem Valores Fabricados:", "É terminantemente proibido o uso de valores padrão artificiais ou operadores de coalescência com fallbacks numéricos. Se a fonte não responde, o dado é estritamente encapsulado como <code>indisponivel</code>."),
        ("Regra 2 — Sem Cortes Silenciosos:", "Proibição de truncamentos artificiais com funções de mínimo ou máximo para mascarar dados anômalos. Violações de domínio físico geram exceções formais ou <code>fora-do-dominio</code>."),
        ("Regra 3 — Rastreabilidade e Proveniência Universal:", "Toda grandeza científica manipulada implementa o tipo discriminado <code>Proveniencia<T></code> (medido, modelado, tabelado, indisponível) com registro de fonte, instrumento e timestamp."),
        ("Regra 4 — Nada Calculado Vira Rótulo (Anti-Circularidade):", "Modelos matemáticos (RUSLE) ou motores de IA (Jev) JAMAIS definem a verdade terrestre da matriz de treinamento."),
        ("Regra 5 — Guarda Antissintética Universal:", "O sistema bloqueia recursivamente qualquer ponto amostral que possua a flag <code>origemSintetica: true</code>."),
        ("Regra 6 — Segregação Cega de Exportação:", "As equipes de interpretação e a matriz de treino recebem artefatos desidentificados (sem coordenadas geográficas), impedindo que o algoritmo aprenda localização espacial em vez de processos físicos."),
        ("Regra 7 — Preservação de Máscaras Orbitais:", "Pixels afetados por nuvens ou sombras não são preenchidos por interpolação artificial; são preservados como descontinuidades reais na série temporal."),
        ("Regra 8 — Evidência Física de Verificação:", "Comentários no código alegando verificação de fontes exigem arquivamento de prova auditável no diretório <code>docs/verificacoes/</code>."),
        ("Regra 9 — Preservação Histórica e Reprodutibilidade:", "Versionamento contínuo em Git (branch <code>sarel/v2</code>) com sementes pseudoaleatórias registradas a cada execução.")
    ]

    for r_tit, r_txt in regras_desc:
        story.append(Paragraph(f"<b>{r_tit}</b> {r_txt}", styles["Bullet"]))

    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("Os 7 Invariantes de Integridade Computacional (validados em <code>invariantes.ts</code>):", styles["SubSectionTitle"]))
    invar_desc = [
        ("Invariante 1 (Coerência RUSLE):", "A perda de solo só existe se, e somente se, os cinco fatores (R, K, LS, C, P) e a memória de cálculo existirem simultaneamente com valores finitos."),
        ("Invariante 2 (Lista de Permissão Estrita):", "Bloqueia o vazamento de variáveis internas protegidas (como phi_diag ou coordenadas em matrizes de treino)."),
        ("Invariante 3 (Derivação Fidedigna):", "Campos_Estimados são computados estritamente a partir de variáveis com estado diferente de 'medido'."),
        ("Invariante 4 (Rastreabilidade Orbital):", "Dados orbitais exigem lista explícita de PRODUCT_ID, versão do motor de processamento e timestamp de consulta."),
        ("Invariante 5 (Afirmação Negativa Fundiária):", "A atribuição de 'sem-correspondencia' fundiária exige evidência de consulta válida aos bancos do SICAR/SIGEF sem sobreposição espacial."),
        ("Invariante 6 (Proibição de Literais Espúrios):", "Rejeita termos fictícios nos atributos territoriais (como 'Custom' ou 'Bacia Local')."),
        ("Invariante 7 (Detector de Constante Disfarçada):", "Recusa a exportação se qualquer coluna numérica apresentar variância zero (mesmo valor em todas as linhas para n >= 21).")
    ]

    for i_tit, i_txt in invar_desc:
        story.append(Paragraph(f"• <b>{i_tit}</b> {i_txt}", styles["Bullet"]))

    story.append(Spacer(1, 4*mm))

    # -------------------------------------------------------------------------
    # SEÇÃO 8: REFERÊNCIAS BIBLIOGRÁFICAS (ABNT NBR 6023:2018)
    # -------------------------------------------------------------------------
    story.append(Paragraph("8. Referências Bibliográficas (Normas ABNT NBR 6023:2018 e NBR 10520:2023)", styles["ChapterTitle"]))
    story.append(HRFlowable(width="100%", thickness=0.8, color=C_EMERALD_MID, spaceBefore=1*mm, spaceAfter=4*mm))

    story.append(Paragraph(
        "A seguir relacionam-se todas as publicações técnico-científicas canônicas que fundamentam os pilares teóricos, "
        "algorítmicos e pedológicos do SAREL, formatadas rigorosamente de acordo com a ABNT NBR 6023:2018:",
        styles["Body"]
    ))
    story.append(Spacer(1, 2*mm))

    referencias_abnt = [
        "BHERING, S. B. et al. <b>Erodibilidade dos solos do Brasil</b>. Rio de Janeiro: Embrapa Solos, 2024. 40 p. (Documentos / Embrapa Solos, n. 246).",
        "CHEN, T.; GUESTRIN, C. XGBoost: A Scalable Tree Boosting System. In: ACM SIGKDD INTERNATIONAL CONFERENCE ON KNOWLEDGE DISCOVERY AND DATA MINING, 22., 2016, San Francisco. <b>Proceedings [...]</b>. New York: ACM, 2016. p. 785–794. DOI: 10.1145/2939672.2939785.",
        "DEMATTÊ, J. A. M. et al. Geospatial Soil Sensing System (GEOS3): A powerful data mining procedure to retrieve soil spectral reflectance from satellite images. <b>Remote Sensing of Environment</b>, v. 212, p. 161–175, 2018. DOI: 10.1016/j.rse.2018.04.047.",
        "DURIGON, V. L. et al. NDVI-based C-factor estimation for RUSLE in Brazilian watersheds. <b>Revista Brasileira de Ciência do Solo</b>, Viçosa, v. 38, n. 3, p. 726–734, 2014. DOI: 10.1590/S0100-06832014000300003.",
        "IBGE — INSTITUTO BRASILEIRO DE GEOGRAFIA E ESTATÍSTICA. <b>Manual Técnico de Pedologia</b>. 3. ed. Rio de Janeiro: IBGE, 2018. 142 p. (Manuais Técnicos em Geociências, n. 4).",
        "KARYDAS, C. G.; PANAGOS, P. The G2 erosion model: month-time step assessments at regional scale. <b>Environmental Research</b>, v. 161, p. 115–124, 2018. DOI: 10.1016/j.envres.2017.11.002.",
        "KAUFMAN, S. et al. Leakage in data mining: formulation, detection, and avoidance. <b>ACM Transactions on Knowledge Discovery from Data (TKDD)</b>, v. 6, n. 4, p. 1–21, 2012. DOI: 10.1145/2382577.2382579.",
        "LANDIS, J. R.; KOCH, G. G. The measurement of observer agreement for categorical data. <b>Biometrics</b>, v. 33, n. 1, p. 159–174, 1977. DOI: 10.2307/2529310.",
        "LUNDBERG, S. M.; LEE, S.-I. A Unified Approach to Interpreting Model Predictions. In: ADVANCES IN NEURAL INFORMATION PROCESSING SYSTEMS (NEURIPS 2017), 30., 2017, Long Beach. <b>Proceedings [...]</b>. Red Hook: Curran Associates, 2017. p. 4765–4774.",
        "MANNIGEL, E. et al. Fator erodibilidade de solos do estado de São Paulo. <b>Revista Brasileira de Ciência do Solo</b>, Viçosa, v. 26, n. 4, p. 1039–1049, 2002. DOI: 10.1590/S0100-06832002000400024.",
        "RENARD, K. G. et al. <b>Predicting soil erosion by water: a guide to conservation planning with the Revised Universal Soil Loss Equation (RUSLE)</b>. Washington, D.C.: United States Department of Agriculture, 1997. 404 p. (Agriculture Handbook, n. 703).",
        "RIKIMARU, A.; ROY, P. S.; MIYATAKE, S. Tropical forest cover density mapping. <b>Tropical Ecology</b>, v. 43, n. 1, p. 39–47, 2002.",
        "ROBERTS, D. R. et al. Cross-validation strategies for data with temporal, spatial, or hierarchical structure. <b>Ecography</b>, v. 40, n. 8, p. 913–929, 2017. DOI: 10.1111/ecog.02881.",
        "ROUSE, J. W. et al. Monitoring the vernal advancement and retrogradation (Greenwave effect) of natural vegetation. <b>NASA/GSFC Type III Final Report</b>, Greenbelt, p. 1–371, 1974.",
        "SAFANELLI, J. L.; DEMATTÊ, J. A. M. et al. Fine-scale soil mapping with Earth Observation data: a multiple geographic level comparison. <b>Revista Brasileira de Ciência do Solo</b>, Viçosa, v. 45, e0210080, p. 1–20, 2021. DOI: 10.36783/18069657rbcs20210080.",
        "TOBLER, W. R. A computer movie simulating urban growth in the Detroit region. <b>Economic Geography</b>, v. 46, sup. 1, p. 234–240, 1970. DOI: 10.2307/143141.",
        "VAN DER KNIJFF, J. M.; JONES, R. J. A.; MONTANARELLA, L. <b>Soil erosion risk assessment in Italy</b>. Ispra: European Soil Bureau, Joint Research Centre (JRC), European Commission, 2000. 52 p. (EUR 19022 EN).",
        "VRIELING, A. Satellite remote sensing for water erosion assessment: A review. <b>Catena</b>, v. 65, n. 1, p. 2–18, 2006. DOI: 10.1016/j.catena.2005.10.005.",
        "ZHU, Z.; WOODCOCK, C. E. Continuous change detection and classification of land cover using all available Landsat data. <b>Remote Sensing of Environment</b>, v. 144, p. 152–171, 2014. DOI: 10.1016/j.rse.2014.01.011."
    ]

    for ref in referencias_abnt:
        story.append(Paragraph(ref, styles["RefABNT"]))

    # Construção do PDF
    doc.build(story, canvasmaker=SarelNumberedCanvas)
    print(f"[OK] Manual Metodológico em PDF gerado com sucesso em: {caminho_saida}")

if __name__ == "__main__":
    caminho = "docs/Manual_Metodologico_e_Calculos_SAREL.pdf"
    if len(sys.argv) > 1:
        caminho = sys.argv[1]
    construir_manual_pdf(caminho)
