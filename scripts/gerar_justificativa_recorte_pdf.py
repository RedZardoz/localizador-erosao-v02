# -*- coding: utf-8 -*-
"""
=============================================================================
GERADOR DA JUSTIFICATIVA METODOLÓGICA DO RECORTE ESPACIAL (PDF)
Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
PPGTCA 2026 - Universidade Tecnológica Federal do Paraná (UTFPR - Medianeira)
Pesquisa de Mestrado: Amostragem e Predição de Erosão Laminar no Paraná
Mestrando: Luis Alfredo
=============================================================================
Documento formal em PDF estruturado para inserção direta na dissertação
de mestrado, justificando a delimitação na Bacia Hidrográfica do Paraná 3.
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
# PALETA DE CORES INSTITUCIONAL
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
# CANVAS COM NUMERAÇÃO DE PÁGINAS E DECORAÇÃO
# =============================================================================
class JustificativaNumberedCanvas(canvas.Canvas):
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

            # Cabeçalho Superior
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(C_EMERALD_DARK)
            self.drawString(20 * mm, page_h - 12 * mm, "PPGTCA / UTFPR (CAMPUS MEDIANEIRA) • DISSERTAÇÃO DE MESTRADO • 2026")
            self.setFont("Helvetica", 7.5)
            self.setFillColor(C_SLATE_MUTED)
            self.drawRightString(page_w - 20 * mm, page_h - 12 * mm, "JUSTIFICATIVA DO RECORTE ESPACIAL: BACIA DO PARANÁ 3")

            # Linha Divisória Superior
            self.setStrokeColor(C_BORDER_LIGHT)
            self.setLineWidth(0.6)
            self.line(20 * mm, page_h - 14 * mm, page_w - 20 * mm, page_h - 14 * mm)

            # Linha Divisória Inferior
            self.line(20 * mm, 14 * mm, page_w - 20 * mm, 14 * mm)

            # Rodapé
            self.setFont("Helvetica", 8)
            self.setFillColor(C_SLATE_MUTED)
            self.drawString(20 * mm, 9.5 * mm, "Pesquisa de Mestrado: Predição de Erosão Laminar • Mestrando: Luis Alfredo")
            self.drawRightString(page_w - 20 * mm, 9.5 * mm, f"Página {self._pageNumber} de {page_count}")
            self.restoreState()

# =============================================================================
# ESTILOS TIPOGRÁFICOS
# =============================================================================
def get_justificativa_styles():
    base = getSampleStyleSheet()
    styles = {}

    styles["DocTitle"] = ParagraphStyle(
        "DocTitle",
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=C_NAVY_DARK,
        alignment=TA_LEFT,
        spaceAfter=4
    )
    styles["DocSubtitle"] = ParagraphStyle(
        "DocSubtitle",
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=C_SLATE_TEXT,
        alignment=TA_LEFT,
        spaceAfter=6
    )
    styles["AuthorMeta"] = ParagraphStyle(
        "AuthorMeta",
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=11.5,
        textColor=C_EMERALD_DARK,
        alignment=TA_LEFT
    )
    styles["SectionHeader"] = ParagraphStyle(
        "SectionHeader",
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=C_NAVY_DARK,
        spaceBefore=7,
        spaceAfter=3.5,
        keepWithNext=True
    )
    styles["SubSectionHeader"] = ParagraphStyle(
        "SubSectionHeader",
        fontName="Helvetica-Bold",
        fontSize=8.8,
        leading=11.5,
        textColor=C_EMERALD_DARK,
        spaceBefore=5,
        spaceAfter=2,
        keepWithNext=True
    )
    styles["Body"] = ParagraphStyle(
        "Body",
        fontName="Helvetica",
        fontSize=7.8,
        leading=11,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY,
        spaceAfter=3
    )
    styles["Bullet"] = ParagraphStyle(
        "Bullet",
        fontName="Helvetica",
        fontSize=7.8,
        leading=11,
        textColor=C_SLATE_TEXT,
        alignment=TA_LEFT,
        leftIndent=10,
        firstLineIndent=-7,
        spaceAfter=2
    )
    styles["TableHead"] = ParagraphStyle(
        "TableHead",
        fontName="Helvetica-Bold",
        fontSize=7.2,
        leading=9,
        textColor=C_WHITE,
        alignment=TA_CENTER
    )
    styles["TableCell"] = ParagraphStyle(
        "TableCell",
        fontName="Helvetica",
        fontSize=7.2,
        leading=9.2,
        textColor=C_SLATE_TEXT,
        alignment=TA_LEFT
    )
    styles["TableCellBold"] = ParagraphStyle(
        "TableCellBold",
        fontName="Helvetica-Bold",
        fontSize=7.2,
        leading=9.2,
        textColor=C_NAVY_DARK,
        alignment=TA_LEFT
    )
    styles["CalloutTitle"] = ParagraphStyle(
        "CalloutTitle",
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10.5,
        textColor=C_NAVY_DARK,
        spaceAfter=2
    )
    styles["CalloutBody"] = ParagraphStyle(
        "CalloutBody",
        fontName="Helvetica",
        fontSize=7.4,
        leading=10.2,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY
    )
    styles["BiblioItem"] = ParagraphStyle(
        "BiblioItem",
        fontName="Helvetica",
        fontSize=6.8,
        leading=9.2,
        textColor=C_SLATE_TEXT,
        leftIndent=10,
        firstLineIndent=-10,
        spaceAfter=2.5
    )
    return styles

def callout_box(title, text, styles, bg_color=C_MINT_BG, border_color=C_EMERALD_MID, title_color=C_EMERALD_DARK):
    p_title = Paragraph(f"<font color='{title_color.hexval()}'><b>{title}</b></font>", styles["CalloutTitle"])
    p_text = Paragraph(text, styles["CalloutBody"])
    t = Table([[p_title], [p_text]], colWidths=[170 * mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg_color),
        ('BOX', (0, 0), (-1, -1), 0.8, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6.5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6.5),
    ]))
    return t

# =============================================================================
# CONSTRUÇÃO DO DOCUMENTO
# =============================================================================
def gerar_documento_justificativa_pdf(output_path="Justificativa_Recorte_Espacial_Parana3_SAREL.pdf"):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm
    )

    styles = get_justificativa_styles()
    story = []

    # =========================================================================
    # PÁGINA 1: CONTEXTO & FUNDAMENTAÇÃO FISIOGRÁFICA DA BP3
    # =========================================================================
    meta_box = [
        [Paragraph("<b>UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ (UTFPR)</b> • CAMPUS MEDIANEIRA<br/>"
                   "PROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO (PPGTCA 2026)<br/>"
                   "<b>Pesquisa de Mestrado:</b> Amostragem e Predição de Erosão Laminar no Paraná • <b>Autor:</b> Luis Alfredo", styles["AuthorMeta"])]
    ]
    t_meta = Table(meta_box, colWidths=[170 * mm])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_BG_PAGE),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 5))

    story.append(Paragraph("Justificativa Metodológica do Recorte Espacial Experimental", styles["DocTitle"]))
    story.append(Paragraph("Delimitação Amostral na Bacia Hidrográfica do Paraná 3 (Foz do Iguaçu a Céu Azul): Fundamentação Agroecológica, Fisiográfica, Isenção Estatística e Integração Multi-Sensor no SAREL v2.0", styles["DocSubtitle"]))
    story.append(HRFlowable(width="100%", thickness=1.2, color=C_EMERALD_MID, spaceBefore=1, spaceAfter=5))

    story.append(Paragraph("1. Contextualização e Delimitação da População Amostral", styles["SectionHeader"]))
    story.append(Paragraph(
        "Na concepção de projetos de modelagem preditiva e sensoriamento remoto aplicado às ciências agrárias, a definição da <b>população amostral (<i>sampling frame</i>)</b> constitui uma das decisões de maior impacto na validade científica dos resultados. A literatura de conservação de solo e água (Wischmeier & Smith, 1978; Renard et al., 1997) estabelece que a <b>bacia hidrográfica</b> é a unidade física, ecológica e hidrológica fundamental para a análise de processos erosivos, suplantando delimitações puramente político-administrativas.",
        styles["Body"]
    ))
    story.append(Paragraph(
        "Neste projeto de mestrado, o sistema <b>SAREL v2.0</b> foi arquitetado com capacidade algorítmica de varredura estadual via Google Earth Engine; contudo, a <b>área de estudo e validação experimental presencial</b> é formalmente circunscrita à <b>Bacia Hidrográfica do Paraná 3 (BP3)</b>, com foco no corredor agroecológico que interliga os municípios de <b>Foz do Iguaçu, Santa Terezinha de Itaipu, São Miguel do Iguaçu, Medianeira, Matelândia e Céu Azul</b>. A presente seção detalha as razões científicas, fisiográficas e estatísticas que respaldam essa escolha perante a banca examinadora.",
        styles["Body"]
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("2. Por que a Bacia do Paraná 3 (Foz a Céu Azul) é Cientificamente Perfeita?", styles["SectionHeader"]))
    story.append(Paragraph(
        "Longe de representar uma escolha de conveniência simplista, o corredor entre Foz do Iguaçu e Céu Azul constitui um dos mais expressivos <b>laboratórios naturais de conservação de solo do Brasil</b>, reunindo em menos de 80 km uma variabilidade biofísica raramente encontrada em outras regiões:",
        styles["Body"]
    ))

    fisiografia_pontos = [
        ("Excelente Gradiente Topo-Sequencial (Amplitude de Relevo):",
         "O perfil longitudinal do corredor parte de cotas de ~180 a 250 m nas margens do Reservatório de Itaipu (Foz do Iguaçu), estende-se por colinas suaves a suave-onduladas em Medianeira (250 a 450 m, declividades de 4% a 10%) e ascende ao rebordo do Terceiro Planalto Paranaense em Matelândia e Céu Azul (600 a 750 m de altitude, com vertentes onduladas e forte-onduladas de 8% a 20%). Essa conformação garante a representação física de todos os terços de declividade (S (declividade)) exigidos pelo modelo."),
        ("Transição Pedológica Expressiva (Latossolos e Nitossolos):",
         "A região assenta-se sobre derrames basálticos da Formação Serra Geral, apresentando transições nítidas entre Latossolos Vermelhos Distroférricos (profundos e permeáveis) e Nitossolos Vermelhos Eutróficos (estruturados, com gradiente textural e suscetíveis a escoamento superficial em relevos mais declivosos), contemplando os dois níveis de erodibilidade (K (erodibilidade)) da Embrapa."),
        ("Polo Histórico de Gestão de Bacias e Conservação de Solo:",
         "A Bacia do Paraná 3 abriga os programas agroambientais da Itaipu Binacional (como o <i>Cultivando Água Boa</i>), onde coexistem lavouras sob Sistema Plantio Direto (SPD) consolidado de altíssima palhada (controles negativos) e áreas sob manejo vulnerável com carreadores erodidos e terraços assoreados."),
        ("Vínculo Institucional e Viabilidade de Execução:",
         "A sede do programa de pós-graduação (PPGTCA) localiza-se na <b>UTFPR - Campus Medianeira</b>, no epicentro geográfico da bacia, viabilizando o deslocamento imediato de equipes após tempestades erosivas para validação in-situ sem as distorções temporais causadas por viagens interestaduais longas."),
    ]
    for tit, desc in fisiografia_pontos:
        story.append(Paragraph(f"• <b>{tit}</b> {desc}", styles["Bullet"]))

    story.append(Spacer(1, 3))

    gradiente_data = [
        [Paragraph("<b>Compartimento / Município</b>", styles["TableHead"]),
         Paragraph("<b>Altitude & Relevo Típico</b>", styles["TableHead"]),
         Paragraph("<b>Declividade (S (declividade))</b>", styles["TableHead"]),
         Paragraph("<b>Solo Predominante (K (erodibilidade))</b>", styles["TableHead"]),
         Paragraph("<b>Dinâmica Erosiva na Pesquisa</b>", styles["TableHead"])],
        [Paragraph("<b>Céu Azul / Matelândia</b><br/>(Rebordo do Planalto)", styles["TableCellBold"]),
         Paragraph("600 a 750 m<br/>Ondulado a Forte", styles["TableCell"]),
         Paragraph("8% a 20%<br/>(Terço Forte)", styles["TableCell"]),
         Paragraph("Nitossolo Vermelho /<br/>Latossolo Distroférrico", styles["TableCell"]),
         Paragraph("Zona crítica de desprendimento laminar, alta energia cinética e ruptura de rampa.", styles["TableCell"])],
        [Paragraph("<b>Medianeira / São Miguel</b><br/>(Planalto Intermediário)", styles["TableCellBold"]),
         Paragraph("250 a 450 m<br/>Suave-Ondulado", styles["TableCell"]),
         Paragraph("4% a 10%<br/>(Terço Moderado)", styles["TableCell"]),
         Paragraph("Latossolo Vermelho<br/>Eutroférrico", styles["TableCell"]),
         Paragraph("Agricultura intensiva de grãos; contraste nítido entre SPD de ponta e manejo deficiente.", styles["TableCell"])],
        [Paragraph("<b>Foz do Iguaçu / Sta Terezinha</b><br/>(Calha do Lago de Itaipu)", styles["TableCellBold"]),
         Paragraph("180 a 250 m<br/>Plano a Suave", styles["TableCell"]),
         Paragraph("2% a 6%<br/>(Terço Suave)", styles["TableCell"]),
         Paragraph("Latossolo Vermelho /<br/>Gleissolos de baixada", styles["TableCell"]),
         Paragraph("Sopé deposicional, desaceleração do fluxo, controles estáveis e borda de mata ciliar.", styles["TableCell"])],
    ]
    t_grad = Table(gradiente_data, colWidths=[36 * mm, 32 * mm, 24 * mm, 34 * mm, 44 * mm])
    t_grad.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_NAVY_DARK),
        ('GRID', (0, 0), (-1, -1), 0.35, C_BORDER_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 3.5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [C_WHITE, C_BG_PAGE])
    ]))
    story.append(t_grad)

    # =========================================================================
    # PÁGINA 2: FUNDAMENTAÇÃO ESTATÍSTICA E DESENHO EM TRE (solo nu)S ESCALAS
    # =========================================================================
    story.append(PageBreak())

    story.append(Paragraph("3. Fundamentação Estatística e Isenção de Viés", styles["SectionHeader"]))
    story.append(Paragraph(
        "Um questionamento frequente em bancas de pós-graduação refere-se ao risco de <b>viés de autosseleção ou conveniência</b> quando a área de estudo é restrita à proximidade da sede acadêmica. No desenho experimental do SAREL v2.0, demonstra-se formalmente que <b>não ocorre qualquer prejuízo estatístico</b>, respaldando-se na teoria clássica de amostragem geoespacial (Cochran, 1977; Brus, 2019):",
        styles["Body"]
    ))

    estatistica_pontos = [
        ("Delimitação da População 'A Priori' (Sampling Frame):",
         "O viés estatístico surge unicamente quando o pesquisador gera uma amostra probabilística em uma escala ampla (ex.: Paraná todo) e, <i>a posteriori</i>, descarta arbitrariamente os pontos distantes, mantendo apenas os convenientes. No SAREL, a delimitação é definida <b>a priori</b>: a população estatística declarada da pesquisa é a Bacia Hidrográfica do Paraná 3. Dentro desse universo circunscrito, o sorteio é 100% probabilístico, garantindo que todo ponto elegível da bacia possua probabilidade não-nula e conhecida de seleção."),
        ("Preservação da Ortogonalidade dos 18 Estratos (S (declividade) x E (solo nu) x K (erodibilidade)):",
         "Mesmo circunscrito à BP3, o algoritmo de amostragem estratificada do SAREL obriga o preenchimento balanceado de todas as classes biofísicas cruzadas: declividades suaves, médias e fortes sob diferentes frequências históricas de solo exposto. Nenhum estrato é omitido ou super-representado."),
        ("Mitigação da Dependência Espacial via Thinning Geodésico (P02 ≥ 1,0 km):",
         "Para honrar a Primeira Lei da Geografia de Tobler (1970) e evitar pseudorrepetição amostral, o algoritmo guloso determinístico impõe raio mínimo de 1,0 km entre centróides vizinhos, impedindo que a facilidade de acesso induza aglomerações amostrais em uma mesma propriedade."),
    ]
    for tit, desc in estatistica_pontos:
        story.append(Paragraph(f"• <b>{tit}</b> {desc}", styles["Bullet"]))

    story.append(Spacer(1, 3))

    callout_estat = callout_box(
        "BLINDAGEM CONTRA O VIÉS DE CONFIRMAÇÃO: PROTOCOLO DUPLO-CEGO (REGRA 4)",
        "A integridade estatística da Fase B (campo) é garantida pelo perfil de exportação <code>campo-cego</code>. Ao visitar os pontos da subamostra na BP3, o técnico de campo tem acesso unicamente às coordenadas e aos dados fundiários de identificação. Ele <b>desconhece integralmente</b> o estrato biofísico, os índices espectrais da série histórica, os fatores da RUSLE e as predições do modelo de machine learning. O rótulo presencial constitui observação humana empírica pura, impedindo que a proximidade logística influencie o julgamento técnico.",
        styles, bg_color=C_MINT_BG, border_color=C_EMERALD_MID, title_color=C_EMERALD_DARK
    )
    story.append(callout_estat)
    story.append(Spacer(1, 5))

    story.append(Paragraph("4. Desenho Experimental em Três Escalas Integradas", styles["SectionHeader"]))
    story.append(Paragraph(
        "A adoção da Bacia do Paraná 3 como recorte territorial viabiliza a perfeita convergência entre as <b>três escalas complementares de observação</b> concebidas na arquitetura do SAREL, superando as limitações operacionais da literatura convencional:",
        styles["Body"]
    ))

    escalas_data = [
        [Paragraph("<b>Escala / Modalidade</b>", styles["TableHead"]),
         Paragraph("<b>Sensor & Resolução Espacial</b>", styles["TableHead"]),
         Paragraph("<b>Volume Amostral na BP3</b>", styles["TableHead"]),
         Paragraph("<b>Papel no Experimento da Dissertação</b>", styles["TableHead"])],
        [Paragraph("<b>Escala 1: Orbital Macro</b><br/>(Fase A — Triagem e Séries)", styles["TableCellBold"]),
         Paragraph("Sentinel-2 MSI (10m) +<br/>PlanetScope NICFI (3m) +<br/>Copernicus DEM (30m)", styles["TableCell"]),
         Paragraph("300 a 500 pontos<br/>estratificados", styles["TableCell"]),
         Paragraph("Treinamento e validação cruzada LOCO (Leave-One-Catchment-Out) de algoritmos supervisionados (XGBoost); caracterização espectro-temporal histórica de 10 anos.", styles["TableCell"])],
        [Paragraph("<b>Escala 2: Campo in-situ</b><br/>(Fase B — Verdade Terrestre)", styles["TableCellBold"]),
         Paragraph("GNSS Submétrico +<br/>App SAREL Field Collector +<br/>Fotos Nadir / Panorâmica", styles["TableCell"]),
         Paragraph("45 a 60 pontos<br/>(~15% a 20% da Fase A)", styles["TableCell"]),
         Paragraph("Auditoria presencial de marcadores físicos (espessura horizonte A, pedestais, crosta, terraços); cálculo formal do Coeficiente Kappa de Cohen (κ ≥ 0,61, IC 95%).", styles["TableCell"])],
        [Paragraph("<b>Escala 3: VANT / Drone</b><br/>(Fase D — Sítios Padrão-Ouro)", styles["TableCellBold"]),
         Paragraph("Câmera RGB / Multiespectral<br/>Ortomosaico GSD &lt; 5 a 10 cm +<br/>Modelo Digital de Terreno (MDT)", styles["TableCell"]),
         Paragraph("4 sítios contínuos<br/>(10 a 50 ha cada)<br/>Céu Azul e Medianeira", styles["TableCell"]),
         Paragraph("<b>Held-out test set estrito</b> (nunca treina o modelo); validação matricial pixel-a-pixel da catena completa (topo → encosta → baixada) e superação da falácia da microparcela.", styles["TableCell"])],
    ]
    t_esc = Table(escalas_data, colWidths=[38 * mm, 42 * mm, 32 * mm, 58 * mm])
    t_esc.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_NAVY_DARK),
        ('GRID', (0, 0), (-1, -1), 0.35, C_BORDER_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 3.5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [C_WHITE, C_BG_PAGE])
    ]))
    story.append(t_esc)

    # =========================================================================
    # PÁGINA 3: OPERACIONALIZAÇÃO NO SAREL & RASTREABILIDADE
    # =========================================================================
    story.append(PageBreak())

    story.append(Paragraph("5. Operacionalização no SAREL: O Ecossistema Unificado", styles["SectionHeader"]))
    story.append(Paragraph(
        "A integração entre o laboratório computacional, o aplicativo móvel de campo e a plataforma aérea de drone ocorre sem atritos no SAREL através de quatro fluxos operacionais padronizados:",
        styles["Body"]
    ))

    fluxos_operacionais = [
        ("1. Delimitação Regional no Painel GEE (RegionRequestModal):",
         "O pesquisador acessa o modal de Áreas de Amostragem (AOI) e ativa a Bacia do Paraná 3 ou a lista dos seis municípios da microrregião (Foz a Céu Azul). O backend orquestra a chamada ao GEE (<code>src/app/api/gee/select-candidates/route.ts</code>) confinando os cálculos de elegibilidade matricial, extração harmônica e estratificação estritamente a essa malha vetorial."),
        ("2. Exportação Blindada para o Aplicativo Móvel (Perfil campo-cego):",
         "A partir dos pontos selecionados na BP3, o SAREL realiza o sorteio estratificado da subamostra de campo (~20%) e exporta a planilha no perfil <code>campo-cego</code>. Esse arquivo é carregado offline no smartphone (SAREL Field Collector), fornecendo a rota de navegação e as coordenadas esperadas sem qualquer contaminação preditiva."),
        ("3. Auditoria de Concordância e Ingestão Automática (Kappa de Cohen):",
         "Após a vistoria física com registro de espessura de horizonte A, descalçamento de raízes e fotos obrigatórias, o aplicativo gera o arquivo JSON de retorno. O módulo de ingestão do SAREL (<code>src/lib/rotulos/ingestaoKobo.ts</code>) processa o lote, valida a tolerância geodésica P03 (raio de 150m) e computa a matriz de confusão concorrente entre o olhar de campo e a fotointerpretação orbital."),
        ("4. Sítios de Drone Pré-Cadastrados em Céu Azul e Medianeira:",
         "A Central de Campanha do SAREL (<code>src/lib/padraoOuro/sitiosReferencia.ts</code>) já possui cadastrados os 4 polígonos reais do SICAR nos municípios de Céu Azul e Medianeira, com áreas de 10 a 50 ha. O usuário executa os voos de drone nesses perímetros e ingere os ortomosaicos classificados, confrontando a predição orbital com o mapa de altíssima resolução centimétrica."),
    ]
    for tit, desc in fluxos_operacionais:
        story.append(Paragraph(f"• <b>{tit}</b> {desc}", styles["Bullet"]))

    story.append(Spacer(1, 4))

    story.append(Paragraph("Cadeia de Custódia e Governança de Metadados (Regra 3)", styles["SubSectionHeader"]))
    story.append(Paragraph(
        "A credibilidade perante a banca examinadora reside no fato de que o SAREL <b>nunca mescla ou confunde</b> as fontes de dados. A tabela abaixo ilustra como cada registro da Bacia do Paraná 3 é formalmente etiquetado e auditado:",
        styles["Body"]
    ))

    tabela_rastreabilidade = [
        [Paragraph("<b>Atributo Científico</b>", styles["TableHead"]),
         Paragraph("<b>Origem Registrada</b>", styles["TableHead"]),
         Paragraph("<b>Modalidade</b>", styles["TableHead"]),
         Paragraph("<b>Selo Formal de Proveniência</b>", styles["TableHead"]),
         Paragraph("<b>Papel no Pipeline</b>", styles["TableHead"])],
        [Paragraph("Reflectância B2, B4, B8, B12", styles["TableCellBold"]),
         Paragraph("Sentinel-2 L2A (BOA Harmonized)", styles["TableCell"]),
         Paragraph("orbital-historico", styles["TableCell"]),
         Paragraph("● medido (GEE / ESA)", styles["TableCell"]),
         Paragraph("Feature contínua de entrada no XGBoost", styles["TableCell"])],
        [Paragraph("Declividade e Curvatura", styles["TableCellBold"]),
         Paragraph("Copernicus DEM GLO-30 (UTM 22S)", styles["TableCell"]),
         Paragraph("topografia-terreno", styles["TableCell"]),
         Paragraph("● medido (SIRGAS 2000)", styles["TableCell"]),
         Paragraph("Estrato S (declividade) e Fator LS da RUSLE", styles["TableCell"])],
        [Paragraph("Rótulo de Fotointerpretação", styles["TableCellBold"]),
         Paragraph("PlanetScope NICFI (3m) — Fase A", styles["TableCell"]),
         Paragraph("interpretacao-visual", styles["TableCell"]),
         Paragraph("● medido (protocolo cego)", styles["TableCell"]),
         Paragraph("Target categórico da amostra geral", styles["TableCell"])],
        [Paragraph("Rótulo de Verdade Terrestre", styles["TableCellBold"]),
         Paragraph("Inspeção in-situ — Fase B", styles["TableCell"]),
         Paragraph("campo", styles["TableCell"]),
         Paragraph("● medido (Field Collector)", styles["TableCell"]),
         Paragraph("Gabarito de calibração e auditoria Kappa", styles["TableCell"])],
        [Paragraph("Rótulo de Microparcela Contínua", styles["TableCellBold"]),
         Paragraph("VANT GSD &lt; 5cm — Fase D", styles["TableCell"]),
         Paragraph("drone", styles["TableCell"]),
         Paragraph("● medido (ortomosaico RGB)", styles["TableCell"]),
         Paragraph("Teste held-out de gradiente na encosta", styles["TableCell"])],
    ]
    t_rast = Table(tabela_rastreabilidade, colWidths=[34 * mm, 40 * mm, 26 * mm, 34 * mm, 36 * mm])
    t_rast.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_NAVY_DARK),
        ('GRID', (0, 0), (-1, -1), 0.35, C_BORDER_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 3.5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [C_WHITE, C_BG_PAGE])
    ]))
    story.append(t_rast)

    # =========================================================================
    # PÁGINA 4: TEXTO CANÔNICO PARA A DISSERTAÇÃO & CONCLUSÃO
    # =========================================================================
    story.append(PageBreak())

    story.append(Paragraph("6. Síntese Conclusiva da Decisão Metodológica", styles["SectionHeader"]))
    story.append(Paragraph(
        "A convergência de todos os fatores fisiográficos, estatísticos e operacionais culmina na consolidação do desenho metodológico da dissertação. O pesquisador declara e fundamenta a seguinte decisão de projeto:",
        styles["Body"]
    ))

    texto_canonico = (
        "<b>DECLARAÇÃO METODOLÓGICA FORMAL PARA INSERÇÃO NA DISSERTAÇÃO DE MESTRADO:</b><br/><br/>"
        "<i>'A delimitação da área experimental desta pesquisa estabelece-se na <b>Bacia Hidrográfica do Paraná 3 (BP3)</b>, "
        "abrangendo o transecto agroecológico compreendido entre os municípios de <b>Foz do Iguaçu, Santa Terezinha de Itaipu, "
        "São Miguel do Iguaçu, Medianeira, Matelândia e Céu Azul</b>.<br/><br/>"
        "A opção metodológica por essa circunscrição territorial apoia-se em cinco compromissos estruturais:<br/>"
        "<b>1. Delimitação Regional a Priori:</b> A Bacia do Paraná 3 atua como população amostral formal (sampling frame), "
        "eliminando qualquer descarte discricionário ou amostragem de conveniência pós-sorteio.<br/>"
        "<b>2. Mineração Algorítmica Isenta:</b> O sistema computacional SAREL v2.0 é o responsável soberano por gerar a malha amostral "
        "de satélite (300 a 500 pontos) no Google Earth Engine, assegurando a proporcionalidade matemática dos 18 estratos "
        "biofísicos (S (declividade) x E (solo nu) x K (erodibilidade)) e o espaçamento geodésico mínimo (thinning d ≥ 1,0 km).<br/>"
        "<b>3. Validação Concorrente in-situ:</b> A subamostra presencial de campo (Fase B, n = 45 a 60) é sorteada pelo SAREL "
        "dentro da mesma malha da bacia e exportada no perfil campo-cego para o aplicativo móvel SAREL Field Collector, viabilizando "
        "a comprovação da validade dos rótulos pelo Coeficiente Kappa de Cohen com IC 95%.<br/>"
        "<b>4. Padrão-Ouro em Vertente Contínua:</b> As missões com VANT/Drone (Fase D, GSD &lt; 5 cm) são concentradas nos sítios "
        "de referência territorial pré-cadastrados em Céu Azul e Medianeira (10 a 50 ha em base SICAR oficial), cumprindo "
        "papel estritamente held-out para aferição pericial do gradiente topo-sequencial completo (topo → encosta → baixada).<br/>"
        "<b>5. Coerência Sistêmica Absoluta:</b> Dados de satélite orbital, auditoria de campo presencial e imageamento centimétrico "
        "de drone ancoram-se na mesma unidade fisiográfica, garantindo dados 100% auditáveis, rastreabilidade forense e "
        "isenção de viés estatístico.'</i>"
    )

    callout_canonico = callout_box(
        "TEXTO CANÔNICO DA DISSERTAÇÃO (CAPÍTULO DE MATERIAL E MÉTODOS)",
        texto_canonico,
        styles, bg_color=C_MINT_BG, border_color=C_EMERALD_DARK, title_color=C_EMERALD_DARK
    )
    story.append(callout_canonico)
    story.append(Spacer(1, 6))

    story.append(Paragraph("7. Referências Bibliográficas Canônicas de Suporte", styles["SectionHeader"]))
    referencias = [
        "<b>Bertoni, J., & Lombardi Neto, F. (2012).</b> <i>Conservação do solo</i>. 8. ed. São Paulo: Ícone.",
        "<b>Brus, D. J. (2019).</b> Sampling for digital soil mapping: A tutorial. <i>Geoderma</i>, 338, 464-473.",
        "<b>Cochran, W. G. (1977).</b> <i>Sampling techniques</i>. 3. ed. New York: John Wiley & Sons.",
        "<b>Cohen, J. (1960).</b> A coefficient of agreement for nominal scales. <i>Educational and Psychological Measurement</i>, 20(1), 37-46.",
        "<b>Landis, J. R., & Koch, G. G. (1977).</b> The measurement of observer agreement for categorical data. <i>Biometrics</i>, 33(1), 159-174.",
        "<b>Renard, K. G. et al. (1997).</b> <i>Predicting soil erosion by water: a guide to conservation planning with the Revised Universal Soil Loss Equation (RUSLE)</i>. USDA Agriculture Handbook 703.",
        "<b>Roberts, D. R. et al. (2017).</b> Cross-validation strategies for data with temporal, spatial, hierarchical or phylogenetic structure. <i>Ecography</i>, 40(8), 913-929.",
        "<b>Tobler, W. R. (1970).</b> A computer movie simulating urban growth in the Detroit region. <i>Economic Geography</i>, 46, 234-240.",
        "<b>Wischmeier, W. H., & Smith, D. D. (1978).</b> <i>Predicting rainfall erosion losses: a guide to conservation planning</i>. USDA Agriculture Handbook 537.",
    ]
    for ref in referencias:
        story.append(Paragraph(f"• {ref}", styles["BiblioItem"]))

    # Construir PDF
    doc.build(story, canvasmaker=JustificativaNumberedCanvas)
    print(f"[SUCESSO] PDF da Justificativa do Recorte Espacial gerado com sucesso!")
    print(f"Arquivo: {output_path}")


if __name__ == "__main__":
    caminho_pdf = os.path.join(os.getcwd(), "Justificativa_Recorte_Espacial_Parana3_SAREL.pdf")
    gerar_documento_justificativa_pdf(caminho_pdf)
