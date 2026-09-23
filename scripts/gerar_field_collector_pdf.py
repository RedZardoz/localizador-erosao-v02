# -*- coding: utf-8 -*-
"""
=============================================================================
GERADOR DA ESPECIFICAÇÃO TÉCNICA DO SAREL FIELD COLLECTOR (PDF)
Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
PPGTCA 2026 - Universidade Tecnológica Federal do Paraná (UTFPR)
Pesquisa de Mestrado: Validação de Predição de Erosão Laminar no Paraná
Mestrando: Luis Alfredo
=============================================================================
Documento formal detalhando a arquitetura, seleção amostral no GEE,
perfil de exportação 'campo-cego', fluxo integrado e ficha biofísica in-situ.
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
class FieldCollectorNumberedCanvas(canvas.Canvas):
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
            self.drawString(20 * mm, page_h - 12 * mm, "PPGTCA / UTFPR • TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO • 2026")
            self.setFont("Helvetica", 7.5)
            self.setFillColor(C_SLATE_MUTED)
            self.drawRightString(page_w - 20 * mm, page_h - 12 * mm, "SAREL FIELD COLLECTOR • ESPECIFICAÇÃO TÉCNICA")

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
def get_field_collector_styles():
    base = getSampleStyleSheet()
    styles = {}

    styles["DocTitle"] = ParagraphStyle(
        "DocTitle",
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=21,
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
        spaceAfter=7
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
        fontSize=11,
        leading=14.5,
        textColor=C_NAVY_DARK,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    styles["SubSectionHeader"] = ParagraphStyle(
        "SubSectionHeader",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=C_EMERALD_DARK,
        spaceBefore=6,
        spaceAfter=2.5,
        keepWithNext=True
    )
    styles["Body"] = ParagraphStyle(
        "Body",
        fontName="Helvetica",
        fontSize=7.8,
        leading=11,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY,
        spaceAfter=3.5
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
def gerar_documento_field_collector_pdf(output_path="SAREL_Field_Collector_Especificacao_Tecnica.pdf"):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm
    )

    styles = get_field_collector_styles()
    story = []

    # =========================================================================
    # PÁGINA 1: VISÃO GERAL & SELEÇÃO DE PONTOS NO GEE
    # =========================================================================
    meta_box = [
        [Paragraph("<b>UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ (UTFPR)</b> • PPGTCA 2026<br/>"
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
    story.append(Spacer(1, 6))

    story.append(Paragraph("SAREL Field Collector", styles["DocTitle"]))
    story.append(Paragraph("Especificação Técnica do Aplicativo Móvel de Validação de Campo (Fase B): Mineração Amostral no GEE, Protocolo de Cegueira 'campo-cego' e Fluxo de Ingestão de Dados Biofísicos", styles["DocSubtitle"]))
    story.append(HRFlowable(width="100%", thickness=1.2, color=C_EMERALD_MID, spaceBefore=1, spaceAfter=6))

    # 1. VISÃO GERAL
    story.append(Paragraph("1. Visão Geral e Motivação Científica", styles["SectionHeader"]))
    story.append(Paragraph(
        "No desenho metodológico do <b>SAREL v2.0</b>, a <b>Fase B (Validação Presencial de Campo)</b> constitui o padrão-ouro de verdade terrestre (<i>ground-truth</i>). Enquanto a estratégia híbrida mitiga em ~80% os custos logísticos de vistoria exaustiva, a visita presencial a uma subamostra estratificada (~20% dos pontos, <i>n</i> = 45 a 60) é cientificamente mandatória para auditar os rótulos orbitais e calcular o <b>Coeficiente Kappa de Cohen</b> com intervalo de confiança de 95% (Cohen, 1960; Landis & Koch, 1977).",
        styles["Body"]
    ))
    story.append(Paragraph(
        "O <b>SAREL Field Collector</b> é um aplicativo móvel complementar concebido para substituir formulários genéricos (KoboToolbox / ODK) por quatro razões determinantes:",
        styles["Body"]
    ))

    vantagens = [
        ("Auditoria Geodésica in-situ (Parâmetro P03):", "Monitora a distância Haversine em tempo real entre o GPS e o centróide teórico, assegurando a tolerância nominal de 15 metros (com tolerância ampliada de até 25 metros sob aviso de qualidade)."),
        ("Blindagem do Protocolo Cego (Regra 4):", "Omite compulsoriamente predições de IA, scores de satélite e fatores RUSLE, prevenindo o viés de confirmação do observador."),
        ("Ingestão Direta sem Pós-Processamento:", "Gera arquivos JSON e CSV estruturados no formato exato consumido pelo módulo <code>src/lib/rotulos/ingestaoKobo.ts</code>."),
        ("Operação 100% Offline-First:", "Persiste os dados localmente no IndexedDB do celular para áreas rurais do Paraná sem sinal 4G/5G."),
    ]
    for tit, desc in vantagens:
        story.append(Paragraph(f"• <b>{tit}</b> {desc}", styles["Bullet"]))

    story.append(Spacer(1, 4))

    # 2. SELEÇÃO NO GEE
    story.append(Paragraph("2. Como o SAREL Seleciona os Pontos de Coleta (Mineração Amostral no GEE)", styles["SectionHeader"]))
    story.append(Paragraph(
        "O SAREL <b>elimina qualquer escolha manual ou subjetiva de alvos</b>. A seleção dos locais de inspeção é executada no Google Earth Engine (GEE) em cinco etapas estritas:",
        styles["Body"]
    ))

    etapas_selecao = [
        ("1. Máscara de Elegibilidade 10m (GEE)",
         "Filtra a bacia hidrográfica combinando: (a) <b>ESA WorldCover v200</b> em lavouras (30 e 40) e pastagens (60); (b) <b>JRC Global Surface Water</b> com buffer hídrico de 30 m; e (c) <b>Copernicus DEM GLO-30</b> na faixa de 3% a 20% de declividade (máxima propensão à erosão laminar difusa segundo a Embrapa)."),
        ("2. Estratificação Multivariada (18 Estratos)",
         "Particiona o território em 18 estratos ortogonais: <b>3 terços de declividade Ŝ</b> (Suave 3–8%, Moderada 8–13%, Forte 13–20% em UTM 22S / SIRGAS 2000) × <b>3 terços de solo nu Ê</b> (frequência histórica via BSI/Sentinel-2) × <b>2 classes de erodibilidade K̂</b> (solos de alta vs moderada/baixa erodibilidade segundo cartas Embrapa Solos)."),
        ("3. Rarefação Geodésica (Thinning d ≥ 1,0 km)",
         "Para mitigar a autocorrelação espacial (1ª Lei de Tobler) que infla artificialmente métricas de acurácia, aplica algoritmo determinístico (Fisher-Yates) assegurando que nenhum ponto diste menos de 1,0 km de outro (Parâmetro P02), forçando a dispersão regional na bacia."),
        ("4. Amarração Fundiária Pericial (SICAR/CAR)",
         "Cruza cada coordenada sobrevivente com o banco SQLite local do SAREL (índice espacial R*Tree). O ponto é obrigatoriamente vinculado ao polígono de um imóvel rural cadastrado (Código CAR), eliminando faixas rodoviárias e áreas urbanas."),
        ("5. Sorteio da Subamostra Presencial (~20%)",
         "Seleciona de 45 a 60 pontos para vistoria in-situ, equilibrando candidatos com alto risco biofísico e controles negativos estáveis (lavouras consolidadas sob Sistema Plantio Direto)."),
    ]

    t_etapas_data = [[Paragraph(f"<b>{e[0]}</b>", styles["TableCellBold"]), Paragraph(e[1], styles["TableCell"])] for e in etapas_selecao]
    t_etapas = Table(t_etapas_data, colWidths=[48 * mm, 122 * mm])
    t_etapas.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.35, C_BORDER_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 4.5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4.5),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [C_WHITE, C_BG_PAGE])
    ]))
    story.append(t_etapas)

    # =========================================================================
    # PÁGINA 2: PERFIL CAMPO-CEGO & FLUXO INTEGRADO
    # =========================================================================
    story.append(PageBreak())

    story.append(Paragraph("3. O Perfil de Exportação 'campo-cego' e a Blindagem Metodológica", styles["SectionHeader"]))
    story.append(Paragraph(
        "A exportação de alvos para o smartphone obedece estritamente ao perfil <b><code>campo-cego</code></b> (definido em <code>src/lib/matriz/perfis.ts</code>). Essa segregação impede que o operador seja influenciado por predições computacionais:",
        styles["Body"]
    ))

    cols_desc = [
        ("Codigo", "Identificador unívoco do alvo na malha amostral (ex.: PR-CAS-001)."),
        ("Latitude / Longitude", "Coordenadas geodésicas centrais em graus decimais (WGS84 / SIRGAS 2000)."),
        ("Latitude_DMS / Longitude_DMS", "Coordenadas em Graus-Minutos-Segundos para inserção em receptores GNSS avulsos."),
        ("Municipio / Bacia_Hidrografica", "Localização político-administrativa e fisiográfica para planejamento de rotas."),
        ("Codigo_CAR", "Identificador do Cadastro Ambiental Rural para localização e anuência do imóvel."),
        ("Status_Fundiario", "Situação registral no SICAR/SIGEF (Ativo, Pendente, etc.)."),
        ("Titular_Mascarado", "Nome anonimizado do produtor rural em conformidade com o Art. 7º da LGPD."),
        ("Rota_Acesso", "Referência de acesso vicinal ou carreador principal mais próximo."),
    ]
    t_cols_data = [[Paragraph(f"<b>{c[0]}</b>", styles["TableCellBold"]), Paragraph(c[1], styles["TableCell"])] for c in cols_desc]
    t_cols = Table(t_cols_data, colWidths=[48 * mm, 122 * mm])
    t_cols.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.35, C_BORDER_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 4.5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4.5),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [C_WHITE, C_BG_PAGE])
    ]))
    story.append(t_cols)
    story.append(Spacer(1, 4))

    callout_blind = callout_box(
        "TRAVA INVIOLÁVEL: O QUE É ESTRITAMENTE PROIBIDO CONSTAR NO ARQUIVO DE CAMPO",
        "O perfil <code>campo-cego</code> <b>bloqueia compulsoriamente</b> a exportação dos fatores da RUSLE (R, K, LS, C, P), estimativas de perda de solo (t/ha/ano), valores de declividade em %, frequência de solo exposto (Ê), índices espectrais (NDVI/BSI), classificação do estrato e qualquer predição probabilística prévia do XGBoost. Se o avaliador de campo souber que o modelo prevê 'erosão severa', seu julgamento visual in-situ estará contaminado. O Invariante 4 do SAREL barra a emissão do plano se qualquer uma dessas colunas estiver presente.",
        styles, bg_color=C_ROSE_BG, border_color=C_ROSE_DARK, title_color=C_ROSE_DARK
    )
    story.append(callout_blind)
    story.append(Spacer(1, 6))

    # 4. FLUXO INTEGRADO
    story.append(Paragraph("4. Fluxo de Trabalho Integrado (SAREL Web ↔ Field Collector)", styles["SectionHeader"]))
    story.append(Paragraph(
        "A dinâmica operacional entre o laboratório computacional e a expedição de campo funciona em um ciclo fechado, seguro e auditável:",
        styles["Body"]
    ))

    ciclo_etapas = [
        ("1. Exportação do Plano no SAREL", "No painel web, o pesquisador conclui a amostragem estratificada e clica em 'Exportar Plano de Campo (Perfil campo-cego)'. O sistema gera o arquivo <code>sarel_pontos_campo.json</code> (ou <code>.csv</code>)."),
        ("2. Carga no Smartphone", "No aplicativo móvel, o operador clica em 'Carregar Pontos SAREL' e seleciona o arquivo exportado. Os pontos são persistidos no IndexedDB local com seus polígonos CAR associados."),
        ("3. Navegação Geodésica Offline", "O Field Collector calcula em tempo real a distância Haversine e o azimute entre a posição GPS do celular e os alvos, ordenando os pontos por proximidade geográfica para otimizar o deslocamento vicinal."),
        ("4. Chegada ao Ponto & Trava P03", "Ao se aproximar da coordenada planejada, o app aciona o selo verde quando a distância é ≤ 15 m (Tolerância Geodésica Nominal P03). Se houver obstáculo físico (ex.: cerca ou terraço), admite-se registro até 25 m com aviso formal de qualidade; distâncias acima de 25 m são bloqueadas para evitar descaracterização da feição."),
        ("5. Inspeção Biofísica Padronizada", "O operador preenche os campos estruturados da ficha de campo, avaliando morfologia do solo, espessura do horizonte A, pedestais e práticas conservacionistas."),
        ("6. Registro Fotográfico Obrigatório", "Captura de duas fotografias vinculadas ao código do ponto: (a) Foto Nadir vertical a 1,20 m do solo; (b) Foto Panorâmica da vertente."),
        ("7. Exportação do Pacote de Campo", "Ao final do dia, o aplicativo gera um pacote unificado <code>sarel_coleta_campo_[DATA].json</code> e compartilha via Drive, USB ou WhatsApp."),
        ("8. Ingestão e Cálculo do Kappa no SAREL", "O pesquisador sobe o arquivo na aba de Ingestão de Rótulos do SAREL (<code>src/lib/rotulos/ingestaoKobo.ts</code>). O sistema realiza o pareamento automático, valida os invariantes de proveniência e calcula o Coeficiente Kappa de Cohen."),
    ]

    t_ciclo_data = [[Paragraph(f"<b>{c[0]}</b>", styles["TableCellBold"]), Paragraph(c[1], styles["TableCell"])] for c in ciclo_etapas]
    t_ciclo = Table(t_ciclo_data, colWidths=[48 * mm, 122 * mm])
    t_ciclo.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.35, C_BORDER_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 4.5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4.5),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [C_WHITE, C_BG_PAGE])
    ]))
    story.append(t_ciclo)

    # =========================================================================
    # PÁGINA 3: FICHA BIOFÍSICA DE CAMPO & EVIDÊNCIAS
    # =========================================================================
    story.append(PageBreak())

    story.append(Paragraph("5. Ficha Biofísica de Campo: Variáveis e Indicadores Diagnósticos", styles["SectionHeader"]))
    story.append(Paragraph(
        "Para transformar a observação qualitativa em dados estruturados reprodutíveis, o SAREL Field Collector implementa uma ficha de campo baseada na literatura clássica de conservação do solo (Bertoni & Lombardi Neto, 2012; Renard et al., 1997; Wischmeier & Smith, 1978):",
        styles["Body"]
    ))

    vars_bio = [
        ("Rótulo Primário (Classe)", "Escala graduada de 4 níveis: <b>ausente</b> (solo perfeitamente estável em SPD consolidado), <b>incipiente</b> (selamento superficial ou leve exposição radicular), <b>moderada</b> (nítida decapitação do horizonte A ou microssulcos difusos) e <b>severa</b> (forte remoção de topo, exposição de horizonte B e deposição expressiva)."),
        ("Espessura do Horizonte A", "Valor numérico em centímetros (cm) medido com trado de rosca ou pá de corte, confrontado com a mata testemunha mais próxima para aferir a taxa de rebaixamento superficial."),
        ("Exposição do Horizonte B", "Booleano [Sim / Não]. Evidência inequívoca de erosão laminar severa, diagnosticada pela mudança brusca de coloração do solo (revelando óxidos de ferro subsuperficiais e perda drástica de matéria orgânica)."),
        ("Pedestais e Raízes Expostas", "Grau [Ausente / Leve / Acentuado]. Presença de pequenas colunas de solo protegidas sob seixos, nós de raízes ou restos culturais, indicando a cota original do terreno."),
        ("Selamento / Crosta Superficial", "Classificação [Sem crosta / Fina < 2mm / Espessa > 2mm]. Formação de película impermeável compactada pelo impacto das gotas de chuva (<i>splash erosion</i>), reduzindo a taxa de infiltração."),
        ("Início de Microssulcos", "Frequência [Ausente / Isolados / Frequentes]. Fase de transição geomorfológica crítica entre o fluxo laminar difuso e a erosão concentrada em canais decamétricos."),
        ("Deposição em Sopé / Terraço", "Booleano [Sim / Não]. Acúmulo coluvionar de sedimentos finos e matéria orgânica nas cotas inferiores da vertente ou no canal de retenção dos terraços agrícolas."),
        ("Manejo & Cobertura (Fator C)", "Classificação do preparo: Plantio Direto Consolidado, Plantio Direto Recente (< 3 anos), Cultivo Convencional (com aração/gradagem) ou Pastagem. Estimativa percentual de cobertura do solo (0 a 100%)."),
        ("Práticas Mecânicas (Fator P)", "Presença e tipologia de terraços (Em Nível, Em Gradiente ou Inexistente), estado de conservação (Bem Conservado, Assoreado, Rompido) e sentido do plantio (Em Nível ou Morro Abaixo)."),
    ]

    t_vars_data = [[Paragraph(f"<b>{v[0]}</b>", styles["TableCellBold"]), Paragraph(v[1], styles["TableCell"])] for v in vars_bio]
    t_vars = Table(t_vars_data, colWidths=[48 * mm, 122 * mm])
    t_vars.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.35, C_BORDER_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 4.5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4.5),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [C_WHITE, C_BG_PAGE])
    ]))
    story.append(t_vars)
    story.append(Spacer(1, 5))

    story.append(Paragraph("Evidência Fotográfica Georreferenciada Obrigatória", styles["SubSectionHeader"]))
    story.append(Paragraph(
        "O Field Collector integra a câmera nativa do dispositivo para registrar compulsoriamente duas imagens vinculadas ao código do ponto:",
        styles["Body"]
    ))
    fotos_itens = [
        ("Foto Nadir (Solo / Microrelevo):", "Tomada vertical perpendicular ao solo a 1,20 m de altura, capturando a rugosidade do preparo, espessura da palhada, selamento de crosta e pedestais milimétricos."),
        ("Foto Panorâmica da Vertente:", "Tomada horizontal ou semi-oblíqua em direção ao topo da pendente, registrando o comprimento de rampa, a conformação dos terraços de retenção e o sentido da semeadura."),
    ]
    for tit, desc in fotos_itens:
        story.append(Paragraph(f"• <b>{tit}</b> {desc}", styles["Bullet"]))

    story.append(Spacer(1, 4))

    callout_p03 = callout_box(
        "TOLERÂNCIA GEODÉSICA DE CAMPO READEQUADA (PARÂMETRO P03: 15 M NOMINAL, ATÉ 25 M SOB AVISO)",
        "Na escala do pixel de 10 m do Sentinel-2 (100 m²), a tolerância geodésica P03 foi readequada de 150 m para 15 metros nominais (1,5 pixel), compatível com a precisão dos receptores GPS/GNSS móveis (3 a 8 m) e a integridade física da erosão laminar. Quando barreiras físicas impedirem o acesso ao centróide exato, o app aceita registros de até 25 metros com aviso formal de qualidade gravado no log; registros acima de 25 metros são bloqueados para evitar atribuição errônea a células vizinhas (Congalton & Green, 2019).",
        styles, bg_color=C_AMBER_BG, border_color=C_AMBER_DARK, title_color=C_AMBER_DARK
    )
    story.append(callout_p03)

    # =========================================================================
    # PÁGINA 4: ESQUEMA DE RETORNO & GOOGLE AI STUDIO
    # =========================================================================
    story.append(PageBreak())

    story.append(Paragraph("6. Esquema Estruturado de Retorno (JSON & CSV)", styles["SectionHeader"]))
    story.append(Paragraph(
        "O arquivo exportado pelo aplicativo móvel é ingerido diretamente pelo módulo <code>src/lib/rotulos/ingestaoKobo.ts</code> do SAREL sem conversão intermediária. O exemplo abaixo demonstra a estrutura de submissão padronizada:",
        styles["Body"]
    ))

    json_exemplo = (
        "[\n"
        "  {\n"
        '    "codigoPonto": "PR-CAS-001",\n'
        '    "classe": "moderada",\n'
        '    "modalidade": "campo",\n'
        '    "observador": "Eng. Agr. Luis Alfredo",\n'
        '    "observadoEm": "2026-10-15",\n'
        '    "latitude": -25.123456,\n'
        '    "longitude": -53.654321,\n'
        '    "acuraciaGps": 3.2,\n'
        '    "distanciaPlanejadaMetros": 24.5,\n'
        '    "cego": true,\n'
        '    "confianca": "alta",\n'
        '    "biofisico": {\n'
        '      "espessura_horizonte_a_cm": 12.0,\n'
        '      "exposicao_horizonte_b": true,\n'
        '      "pedestais_raizes": "leve",\n'
        '      "crosta_selamento": "fina",\n'
        '      "microssulcos": "isolados",\n'
        '      "sedimentacao_sope": true\n'
        "    },\n"
        '    "manejo_conservacao": {\n'
        '      "sistema": "plantio_direto_recente",\n'
        '      "cobertura_vegetal_pct": 45,\n'
        '      "terraco_tipo": "nivel",\n'
        '      "terraco_estado": "bem_conservado",\n'
        '      "plantio_em_nivel": true\n'
        "    },\n"
        '    "observacoes": "Ponto próximo ao carreador secundário. Palhada de milho desuniforme."\n'
        "  }\n"
        "]"
    )

    t_json = Table([[Paragraph(f"<font name='Courier' size='6.2'>{json_exemplo.replace(chr(10), '<br/>').replace(' ', '&nbsp;')}</font>", styles["TableCell"])]], colWidths=[170 * mm])
    t_json.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#1E293B")),
        ('BOX', (0, 0), (-1, -1), 0.8, C_NAVY_DARK),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
    ]))
    story.append(t_json)
    story.append(Spacer(1, 5))

    # 7. DIRETRIZES TÉCNICAS GOOGLE AI STUDIO
    story.append(Paragraph("7. Diretrizes para Desenvolvimento no Google AI Studio", styles["SectionHeader"]))
    story.append(Paragraph(
        "Ao utilizar o modelo Gemini 1.5 Pro no Google AI Studio para a geração do código do SAREL Field Collector, as seguintes premissas arquiteturais devem ser instruídas:",
        styles["Body"]
    ))

    dev_guidelines = [
        ("Arquitetura PWA Offline-First:", "Construção em HTML5, TailwindCSS, TypeScript/Vanilla JS, biblioteca Leaflet.js para exibição cartográfica e IndexedDB para persistência local irrestrita."),
        ("Interface Tátil de Alto Contraste (Sol Pleno):", "Telas com contraste acentuado (fundo branco, texto grafite escuro), tipografia grande e botões de toque com altura mínima de 48px para facilitar o uso sob sol direto com luvas ou mãos úmidas."),
        ("Indicador Dinâmico de Proximidade:", "Painel em destaque exibindo a distância restante e bússola de orientação até o centróide do alvo, com mudança cromática instantânea (Verde ≤ 150 m / Vermelho > 150 m)."),
        ("Exportador Multi-Formato:", "Rotina de serialização gerando simultaneamente o arquivo <code>.json</code> estruturado e a tabela <code>.csv</code> plana, com acionamento da API nativa de compartilhamento móvel (<i>Web Share API</i>)."),
    ]
    for tit, desc in dev_guidelines:
        story.append(Paragraph(f"• <b>{tit}</b> {desc}", styles["Bullet"]))

    story.append(Spacer(1, 5))

    # CONCLUSÃO
    callout_final = callout_box(
        "CONCLUSÃO: PRONTIDÃO OPERACIONAL E INTEGRAÇÃO CIENTÍFICA",
        "A especificação do SAREL Field Collector fecha o elo entre a mineração analítica em escala petabyte do Google Earth Engine e a inspeção empírica presencial no Paraná. Ao substituir ferramentas generalistas por um coletor estruturado sob medida, a pesquisa de mestrado assegura dados de verdade terrestre rastreáveis, protegidos contra viés de confirmação e perfeitamente compatíveis com os rigorosos critérios da banca examinadora.",
        styles, bg_color=C_MINT_BG, border_color=C_EMERALD_MID, title_color=C_EMERALD_DARK
    )
    story.append(callout_final)

    # Construir PDF
    doc.build(story, canvasmaker=FieldCollectorNumberedCanvas)
    print(f"[SUCESSO] PDF da Especificação Técnica do Field Collector gerado com sucesso!")
    print(f"Arquivo: {output_path}")


if __name__ == "__main__":
    caminho_pdf = os.path.join(os.getcwd(), "SAREL_Field_Collector_Especificacao_Tecnica.pdf")
    gerar_documento_field_collector_pdf(caminho_pdf)
