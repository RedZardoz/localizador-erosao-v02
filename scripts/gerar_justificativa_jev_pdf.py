# -*- coding: utf-8 -*-
"""
=============================================================================
GERADOR DA JUSTIFICATIVA DE USO E ALTERNATIVAS AO JEV (PDF)
Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
PPGTCA 2026 - Universidade Tecnológica Federal do Paraná (UTFPR - Medianeira)
Pesquisa de Mestrado: Validação e Predição de Erosão Laminar no Paraná (SAREL)
Mestrando: Luis Alfredo
=============================================================================
Documento formal detalhando a justificativa técnica para o uso do modelo
'System One' (Jev / TypeSafe AI), a análise de risco de vendor lock-in
e a arquitetura de dupla camada com fallback determinístico (RUSLE/Embrapa).
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

C_PURPLE_DARK = colors.HexColor("#6D28D9")  # Purple 700
C_PURPLE_BG = colors.HexColor("#F5F3FF")    # Purple 50

C_WHITE = colors.HexColor("#FFFFFF")
C_BG_PAGE = colors.HexColor("#F8FAFC")

# =============================================================================
# CANVAS COM NUMERAÇÃO DE PÁGINAS E DECORAÇÃO
# =============================================================================
class JevJustificativaCanvas(canvas.Canvas):
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
            self.drawString(18 * mm, page_h - 11 * mm, "PPGTCA / UTFPR (CAMPUS MEDIANEIRA) • DISSERTAÇÃO DE MESTRADO • 2026")
            self.setFont("Helvetica", 7.5)
            self.setFillColor(C_SLATE_MUTED)
            self.drawRightString(page_w - 18 * mm, page_h - 11 * mm, "SAREL v2.0 • ARQUITETURA DE DECISÃO & RESILIÊNCIA")

            # Linha Divisória Superior
            self.setStrokeColor(C_BORDER_LIGHT)
            self.setLineWidth(0.6)
            self.line(18 * mm, page_h - 13 * mm, page_w - 18 * mm, page_h - 13 * mm)

            # Linha Divisória Inferior
            self.line(18 * mm, 13 * mm, page_w - 18 * mm, 13 * mm)

            # Rodapé
            self.setFont("Helvetica", 7.8)
            self.setFillColor(C_SLATE_MUTED)
            self.drawString(18 * mm, 9 * mm, "Pesquisa: Predição de Erosão Laminar • Mestrando: Luis Alfredo • Decisão & Fallback")
            self.drawRightString(page_w - 18 * mm, 9 * mm, f"Página {self._pageNumber} de {page_count}")
            self.restoreState()

# =============================================================================
# ESTILOS TIPOGRÁFICOS
# =============================================================================
def get_jev_styles():
    base = getSampleStyleSheet()
    styles = {}

    styles["DocTitle"] = ParagraphStyle(
        "DocTitle",
        fontName="Helvetica-Bold",
        fontSize=15.0,
        leading=19.0,
        textColor=C_NAVY_DARK,
        alignment=TA_LEFT,
        spaceAfter=3
    )
    styles["DocSubtitle"] = ParagraphStyle(
        "DocSubtitle",
        fontName="Helvetica",
        fontSize=9.2,
        leading=13.0,
        textColor=C_SLATE_TEXT,
        alignment=TA_LEFT,
        spaceAfter=5
    )
    styles["AuthorMeta"] = ParagraphStyle(
        "AuthorMeta",
        fontName="Helvetica-Bold",
        fontSize=7.8,
        leading=11.2,
        textColor=C_EMERALD_DARK,
        alignment=TA_LEFT
    )
    styles["SectionHeader"] = ParagraphStyle(
        "SectionHeader",
        fontName="Helvetica-Bold",
        fontSize=10.0,
        leading=13.5,
        textColor=C_NAVY_DARK,
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )
    styles["SubSectionHeader"] = ParagraphStyle(
        "SubSectionHeader",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11.2,
        textColor=C_EMERALD_DARK,
        spaceBefore=5,
        spaceAfter=2,
        keepWithNext=True
    )
    styles["Body"] = ParagraphStyle(
        "Body",
        fontName="Helvetica",
        fontSize=7.6,
        leading=10.6,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY,
        spaceAfter=3
    )
    styles["Bullet"] = ParagraphStyle(
        "Bullet",
        fontName="Helvetica",
        fontSize=7.6,
        leading=10.6,
        textColor=C_SLATE_TEXT,
        alignment=TA_LEFT,
        leftIndent=9,
        firstLineIndent=-6,
        spaceAfter=2
    )
    styles["TableHead"] = ParagraphStyle(
        "TableHead",
        fontName="Helvetica-Bold",
        fontSize=7.0,
        leading=8.8,
        textColor=C_WHITE,
        alignment=TA_CENTER
    )
    styles["TableCell"] = ParagraphStyle(
        "TableCell",
        fontName="Helvetica",
        fontSize=6.9,
        leading=8.9,
        textColor=C_SLATE_TEXT,
        alignment=TA_LEFT
    )
    styles["TableCellBold"] = ParagraphStyle(
        "TableCellBold",
        fontName="Helvetica-Bold",
        fontSize=6.9,
        leading=8.9,
        textColor=C_NAVY_DARK,
        alignment=TA_LEFT
    )
    styles["CalloutTitle"] = ParagraphStyle(
        "CalloutTitle",
        fontName="Helvetica-Bold",
        fontSize=7.8,
        leading=10.2,
        textColor=C_NAVY_DARK,
        spaceAfter=2
    )
    styles["CalloutBody"] = ParagraphStyle(
        "CalloutBody",
        fontName="Helvetica",
        fontSize=7.3,
        leading=9.9,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY
    )
    styles["BiblioItem"] = ParagraphStyle(
        "BiblioItem",
        fontName="Helvetica",
        fontSize=6.6,
        leading=8.9,
        textColor=C_SLATE_TEXT,
        alignment=TA_LEFT,
        leftIndent=10,
        firstLineIndent=-10,
        spaceAfter=2.5
    )

    return styles

def build_callout(title, text, styles, bg_color=C_MINT_BG, border_color=C_EMERALD_MID, title_color=C_EMERALD_DARK):
    c_title = ParagraphStyle(
        "CTitle",
        parent=styles["CalloutTitle"],
        textColor=title_color
    )
    content = [
        Paragraph(f"<b>{title}</b>", c_title),
        Spacer(1, 1.2 * mm),
        Paragraph(text, styles["CalloutBody"])
    ]
    t = Table([[content]], colWidths=[174 * mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg_color),
        ('LEFTPADDING', (0, 0), (-1, -1), 3.5 * mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3.5 * mm),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5 * mm),
        ('LINELEFT', (0, 0), (0, -1), 2.2 * mm, border_color),
        ('BOX', (0, 0), (-1, -1), 0.4, C_BORDER),
    ]))
    return t

def gerar_pdf_justificativa_jev(output_path="Justificativa_Uso_e_Alternativa_Jev_SAREL.pdf"):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm
    )

    styles = get_jev_styles()
    story = []

    # =========================================================================
    # PÁGINA 1: CABEÇALHO, DILEMA DA PESQUISA & JUSTIFICATIVA TÉCNICA DO JEV
    # =========================================================================
    meta_box = [
        Paragraph("UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ • CAMPUS MEDIANEIRA", styles["AuthorMeta"]),
        Paragraph("PROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO (PPGTCA - 2026)", styles["AuthorMeta"]),
        Paragraph("PESQUISA DE MESTRADO • SISTEMA DE AMOSTRAGEM E ROTULAGEM PARA EROSÃO LAMINAR (SAREL v2.0)", styles["AuthorMeta"]),
    ]
    t_meta = Table([[meta_box]], colWidths=[174 * mm])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_MINT_BG),
        ('LEFTPADDING', (0, 0), (-1, -1), 3.5 * mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3.5 * mm),
        ('TOPPADDING', (0, 0), (-1, -1), 2.2 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2 * mm),
        ('BOX', (0, 0), (-1, -1), 0.5, C_EMERALD_MID),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 3.5 * mm))

    story.append(Paragraph("ARQUITETURA DE DECISÃO RÁPIDA E RESILIÊNCIA COMPUTACIONAL", styles["DocTitle"]))
    story.append(Paragraph(
        "Justificativa Técnica do Uso de Modelos 'System One' (API Jev / TypeSafe AI), Gestão do Risco de "
        "<i>Vendor Lock-In</i> e Arquitetura Desacoplada com Fallback Determinístico (RUSLE / Embrapa)",
        styles["DocSubtitle"]
    ))
    story.append(Paragraph("<b>Mestrando:</b> Luis Alfredo &nbsp;|&nbsp; <b>Orientação Acadêmica:</b> PPGTCA / UTFPR &nbsp;|&nbsp; <b>Data:</b> Setembro de 2026", styles["Body"]))
    story.append(HRFlowable(width="100%", thickness=1.0, color=C_EMERALD_MID, spaceBefore=2, spaceAfter=4))

    story.append(Paragraph("1. Contexto Operacional e o Dilema da Pesquisa Aplicada", styles["SectionHeader"]))
    story.append(Paragraph(
        "No desenvolvimento de plataformas computacionais voltadas ao suporte à decisão no agronegócio — em especial "
        "na detecção remota de processos erosivos sutis como a <b>erosão laminar</b> —, o engenheiro de software e pesquisador "
        "depara-se com um dilema metodológico clássico: como aproveitar o poder analítico das mais recentes inovações em "
        "<b>Inteligência Artificial (IA)</b> sem comprometer a perenidade do sistema, a reprodutibilidade científica e a sua "
        "autonomia operacional caso serviços comerciais externos sejam modificados, tarifados ou descontinuados?",
        styles["Body"]
    ))
    story.append(Paragraph(
        "A presente especificação documenta formalmente a estratégia adotada no <b>SAREL v2.0</b>: a utilização do modelo "
        "<b>Jev (desenvolvido pela TypeSafe AI)</b> como um microsserviço acelerador de triagem e auditoria lógica de altíssima "
        "velocidade, combinada com uma arquitetura estritamente desacoplada segundo o padrão <i>Strategy</i>. Essa arquitetura "
        "assegura que a plataforma disponha de um <b>motor determinístico local (RUSLE/Embrapa)</b> 100% autônomo, eliminando "
        "qualquer risco de dependência tecnológica (<i>vendor lock-in</i>).",
        styles["Body"]
    ))

    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph("2. Justificativa Técnica do Uso do Modelo Jev (TypeSafe AI)", styles["SectionHeader"]))
    story.append(Paragraph(
        "O <b>Jev</b> inaugura uma categoria recente de modelos de inteligência artificial denominada <b>'System One'</b>, "
        "inspirada na clássica teoria dos processos duplos de Daniel Kahneman (<i>Thinking, Fast and Slow</i>). Enquanto os "
        "Grandes Modelos de Linguagem (LLMs) convencionais (GPT-4, Claude, Gemini) operam de forma autoregressiva lenta "
        "('System Two'), gerando texto token a token com latências entre 2 e 8 segundos, o Jev foi desenhado especificamente "
        "para <b>tomada de decisão estruturada em tempo real</b> em uma única passada paralela.",
        styles["Body"]
    ))

    story.append(Paragraph("<b>2.1. As Três Primitivas Tipadas Nativas</b>", styles["SubSectionHeader"]))
    story.append(Paragraph(
        "O Jev não emite texto livre. Sua interface de programação (API) é fundamentada em três primitivas formais que "
        "conectam diretamente com o código TypeScript/Python do SAREL sem risco de alucinação sintática:",
        styles["Body"]
    ))
    story.append(Paragraph("• <b>Noul (Julgamento Booleano Calibrado):</b> Avalia se uma asserção de campo é verdadeira ou falsa com uma probabilidade calibrada (0.0 a 1.0). Exemplo: <i>'Há incoerência física entre o relevo declarado (plano) e a declividade calculada via MDE (18%)?'</i>.", styles["Bullet"]))
    story.append(Paragraph("• <b>Choice (Classificação Categórica Discreta):</b> Seleciona exatamente uma classe dentro de uma taxonomia fechada. Exemplo: Classificação do manejo observado em <i>['Plantio Direto Consolidado', 'Preparo Reduzido', 'Solo Exposto']</i>.", styles["Bullet"]))
    story.append(Paragraph("• <b>Score (Escala Ordinal Ordenada):</b> Atribui um valor em uma escala ordenada (rubrica). Exemplo: Nota de suscetibilidade à erosão laminar de 0 (Nula) a 4 (Crítica).", styles["Bullet"]))

    story.append(Paragraph("<b>2.2. Aplicações Práticas no Pipeline do SAREL</b>", styles["SubSectionHeader"]))
    story.append(Paragraph("1. <b>Portão de Auditoria de Dados (Data QA Gate):</b> Atua na triagem de entrada de amostras provenientes do aplicativo móvel de campo (SAREL Field Collector) ou da amostragem orbital, detectando anomalias antes da gravação no banco de treinamento oficial.", styles["Bullet"]))
    story.append(Paragraph("2. <b>Triagem de Prioridade para Voos de Drone:</b> Avalia em 100 ms as variáveis de precipitação radar, declividade e histórico espectral de centenas de candidatos, ranqueando quais sítios em Medianeira e Céu Azul devem receber sobrevoo de alta resolução (&lt;5 cm).", styles["Bullet"]))
    story.append(Paragraph("3. <b>Validação Semântica Concorrente no App Mobile:</b> Fornece feedback imediato ao técnico no talhão agrícola, apontando divergências antes que a equipe deixe a coordenada amostral.", styles["Bullet"]))

    # =========================================================================
    # PÁGINA 2: COMPARAÇÃO TÉCNICA & GESTÃO DO RISCO DE VENDOR LOCK-IN
    # =========================================================================
    story.append(PageBreak())

    story.append(Paragraph("3. Matriz Comparativa de Tecnologias de Decisão", styles["SectionHeader"]))
    story.append(Paragraph(
        "A tabela a seguir sintetiza as características computacionais e metodológicas entre o uso de LLMs de conversação, "
        "o modelo System One (Jev) e o motor determinístico nativo do SAREL:",
        styles["Body"]
    ))

    t1_data = [
        [
            Paragraph("<b>Critério de Avaliação</b>", styles["TableHead"]),
            Paragraph("<b>LLMs de Chat<br/>(GPT-4 / Claude)</b>", styles["TableHead"]),
            Paragraph("<b>System One<br/>(Jev / TypeSafe)</b>", styles["TableHead"]),
            Paragraph("<b>Motor Nativo Local<br/>(RUSLE / Embrapa)</b>", styles["TableHead"]),
            Paragraph("<b>Impacto Metodológico<br/>no SAREL v2.0</b>", styles["TableHead"]),
        ],
        [
            Paragraph("<b>Latência de Resposta</b>", styles["TableCellBold"]),
            Paragraph("2.000 a 8.000 ms<br/>(Lenta, geração token)", styles["TableCell"]),
            Paragraph("70 a 350 ms<br/>(Não-autoregressivo)", styles["TableCell"]),
            Paragraph("&lt; 5 ms<br/>(Execução em CPU local)", styles["TableCell"]),
            Paragraph("Jev viabiliza checagens interativas no mobile; local garante execução instantânea em lote.", styles["TableCell"]),
        ],
        [
            Paragraph("<b>Integridade Estrutural</b>", styles["TableCellBold"]),
            Paragraph("Risco de quebra de JSON,<br/>markdown invasivo", styles["TableCell"]),
            Paragraph("100% tipado (Type-Safe);<br/>zero parsing de texto", styles["TableCell"]),
            Paragraph("100% determinístico;<br/>funções puras em código", styles["TableCell"]),
            Paragraph("Elimina falhas de execução e necessidade de re-tentativas de chamada na API.", styles["TableCell"]),
        ],
        [
            Paragraph("<b>Calibração Estatística</b>", styles["TableCellBold"]),
            Paragraph("Inconsistente;<br/>propenso a alucinação", styles["TableCell"]),
            Paragraph("Probabilidade calibrada<br/>(0.00 a 1.00) por classe", styles["TableCell"]),
            Paragraph("Baseada em equações<br/>físicas validadas", styles["TableCell"]),
            Paragraph("Permite usar a probabilidade como peso amostral em modelos supervisionados.", styles["TableCell"]),
        ],
        [
            Paragraph("<b>Dependência de Nuvem</b>", styles["TableCellBold"]),
            Paragraph("Obrigatória (Internet ativa)", styles["TableCell"]),
            Paragraph("Obrigatória (API Cloud)", styles["TableCell"]),
            Paragraph("Zero dependência;<br/>100% offline", styles["TableCell"]),
            Paragraph("O motor nativo assegura operação contínua do coletor mesmo em áreas sem sinal 4G.", styles["TableCell"]),
        ],
        [
            Paragraph("<b>Custo Operacional</b>", styles["TableCellBold"]),
            Paragraph("Alto ($5 a $30 por milhão de tokens)", styles["TableCell"]),
            Paragraph("Baixo ($0,04 por milhão de tokens)", styles["TableCell"]),
            Paragraph("Zero (Código aberto e infraestrutura local)", styles["TableCell"]),
            Paragraph("A pesquisa mantém custo computacional marginal zero caso expire o plano do Jev.", styles["TableCell"]),
        ],
    ]

    t1 = Table(t1_data, colWidths=[34 * mm, 35 * mm, 35 * mm, 35 * mm, 35 * mm])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_NAVY_DARK),
        ('GRID', (0, 0), (-1, -1), 0.4, C_BORDER),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.0 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.0 * mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 2.0 * mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2.0 * mm),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [C_WHITE, C_BG_PAGE]),
    ]))
    story.append(t1)

    story.append(Spacer(1, 3.5 * mm))
    story.append(Paragraph("4. Análise de Risco de Dependência (Vendor Lock-In)", styles["SectionHeader"]))
    story.append(Paragraph(
        "A utilização de APIs de terceiros — em particular provenientes de startups em estágio inicial ou de planos "
        "promocionais/gratuitos com prazo determinado — impõe riscos estratégicos que não podem ser ignorados em uma "
        "dissertação de mestrado orientada ao meio acadêmico e científico:",
        styles["Body"]
    ))

    c_risco = (
        "<b>Princípio de Integridade Científica do PPGTCA:</b> Uma dissertação acadêmica não pode ter sua operabilidade, "
        "auditabilidade ou reprodutibilidade condicionada à manutenção de um plano gratuito privado. Se a API do Jev for "
        "descontinuada, sofrer reajuste de preços ou tiver suas cotas encerradas, o SAREL v2.0 <b>não pode parar</b> nem "
        "apresentar falhas perante a banca examinadora ou usuários no campo."
    )
    story.append(build_callout("ALERTA METODOLÓGICO: PREVENÇÃO CONTRA VENDOR LOCK-IN", c_risco, styles, C_AMBER_BG, C_AMBER_DARK, C_AMBER_DARK))

    story.append(Spacer(1, 2.5 * mm))
    story.append(Paragraph(
        "Para anular integralmente esse risco, aplicou-se o <b>Padrão de Projeto Strategy (GoF)</b> com o mecanismo de "
        "<b>Degradação Graciosa (Graceful Degradation)</b>. A aplicação trata o Jev unicamente como um <i>plugin opcional</i>. "
        "A ausência da chave ou a perda de conexão com a TypeSafe AI nunca resulta em erro, travamento ou interrupção: o sistema "
        "comuta instantaneamente para a camada nativa de decisão sem que o usuário perceba qualquer fricção.",
        styles["Body"]
    ))

    # =========================================================================
    # PÁGINA 3: A ALTERNATIVA ENCONTRADA - ARQUITETURA DUAL-ENGINE
    # =========================================================================
    story.append(PageBreak())

    story.append(Paragraph("5. A Alternativa Encontrada: Arquitetura de Dupla Camada (Dual-Engine)", styles["SectionHeader"]))
    story.append(Paragraph(
        "A alternativa desenhada e implementada no SAREL baseia-se na coexistência harmoniosa de duas camadas de decisão, "
        "onde o motor determinístico local atua como o fundamento perene da pesquisa:",
        styles["Body"]
    ))

    story.append(Paragraph("<b>Camada 2 (Motor Local Determinístico — O Alicerce Permanente)</b>", styles["SubSectionHeader"]))
    story.append(Paragraph(
        "Constituída por algoritmos nativos escritos em Python e TypeScript, embutidos diretamente no código-fonte do SAREL "
        "e executados localmente sem depender de nenhuma chamada de rede externa:",
        styles["Body"]
    ))
    story.append(Paragraph("• <b>Equação Universal de Perdas de Solo Revisada (RUSLE / EUPS):</b> Cálculo analítico da perda estimada de solo (<i>A = R · K · LS · C · P</i>) com fatores calibrados para a Bacia do Paraná 3.", styles["Bullet"]))
    story.append(Paragraph("• <b>Matriz de Erodibilidade do Solo (Fator K):</b> Integração com os dados oficiais do Sistema Brasileiro de Classificação de Solos (SiBCS / Embrapa Solos), mapeando Latossolos Vermelhos Eutróficos (K ~ 0,015 t·h·MJ⁻¹·mm⁻¹) e Nitossolos.", styles["Bullet"]))
    story.append(Paragraph("• <b>Fator Topográfico (LS):</b> Extraído da declividade e comprimento de rampa gerados a partir do Modelo Digital de Elevação Copernicus DEM 30m.", styles["Bullet"]))
    story.append(Paragraph("• <b>Fator de Cobertura e Manejo (C):</b> Estimado via índice NDVI do Sentinel-2 e registros de palhada.", styles["Bullet"]))
    story.append(Paragraph("• <b>Modelo de Aprendizado de Máquina Local:</b> O classificador XGBoost pré-treinado pelo SAREL com validação espacial LOCO (Leave-One-Cluster-Out), armazenado localmente em formato binário, capaz de gerar predições em microssegundos.", styles["Bullet"]))

    story.append(Spacer(1, 1.5 * mm))
    story.append(Paragraph("<b>Camada 1 (Acelerador Plug-and-Play — Opcional)</b>", styles["SubSectionHeader"]))
    story.append(Paragraph(
        "O Jev atua como um <i>auditor avançado</i>. Se a chave <code>TYPESAFE_API_KEY</code> estiver presente e válida no painel "
        "de configurações ou arquivo local, ele é acionado em paralelo para enriquecer o laudo com probabilidades calibradas. "
        "Caso contrário, a Camada 1 é simplesmente ignorada.",
        styles["Body"]
    ))

    story.append(Spacer(1, 1.5 * mm))
    story.append(Paragraph("<b>Alternativas Gratuitas de Longo Prazo para IA Estruturada</b>", styles["SubSectionHeader"]))
    story.append(Paragraph(
        "Se no futuro o pesquisador desejar manter um componente de inteligência artificial sem custo algum, o sistema suporta "
        "duas rotas comprovadas:",
        styles["Body"]
    ))
    story.append(Paragraph("1. <b>Google AI Studio (Gemini 1.5/2.0 Flash API):</b> Acesso permanente com cota gratuita generosa fornecida pelo Google para desenvolvedores e pesquisadores acadêmicos. Suporta saídas estritamente tipadas via <i>Structured Outputs (JSON Schema)</i>, permitindo replicar as três primitivas (Noul, Choice, Score) com zero custo de assinatura.", styles["Bullet"]))
    story.append(Paragraph("2. <b>Modelos Locais Open-Source (ONNX / Ollama):</b> Modelos abertos de inferência rápida (como Phi-3 Mini ou Qwen 2.5) rodando localmente no hardware da UTFPR, assegurando total soberania de dados.", styles["Bullet"]))

    story.append(Spacer(1, 2.5 * mm))
    t2_data = [
        [
            Paragraph("<b>Camada</b>", styles["TableHead"]),
            Paragraph("<b>Tecnologia Empregada</b>", styles["TableHead"]),
            Paragraph("<b>Função no SAREL v2.0</b>", styles["TableHead"]),
            Paragraph("<b>Custo &amp; Dependência</b>", styles["TableHead"]),
        ],
        [
            Paragraph("<b>Camada 1<br/>(Opcional)</b>", styles["TableCellBold"]),
            Paragraph("Jev (TypeSafe AI)<br/><i>System One Decision</i>", styles["TableCell"]),
            Paragraph("Auditoria lógica rápida (~100ms), validação cruzada no app mobile e priorização de voos.", styles["TableCell"]),
            Paragraph("Gratuito no trial; API Cloud proprietária. Pode ser desativada sem qualquer impacto.", styles["TableCell"]),
        ],
        [
            Paragraph("<b>Camada 2<br/>(Nativa)</b>", styles["TableCellBold"]),
            Paragraph("Motor RUSLE/Embrapa +<br/>XGBoost Local (LOCO)", styles["TableCell"]),
            Paragraph("Cálculo formal de perda de solo, validações lógicas booleanas e predição estatística oficial.", styles["TableCell"]),
            Paragraph("<b>100% Gratuito, Local e Offline.</b> Não expira nunca. Sustenta a dissertação.", styles["TableCell"]),
        ],
        [
            Paragraph("<b>Alternativa<br/>Futura</b>", styles["TableCellBold"]),
            Paragraph("Google AI Studio (Gemini Flash)<br/>ou ONNX Local", styles["TableCell"]),
            Paragraph("Validação semântica e auditoria assistida por IA caso se deseje manter suporte generativo.", styles["TableCell"]),
            Paragraph("Cota gratuita permanente (Google) ou modelo open-source em servidor da UTFPR.", styles["TableCell"]),
        ],
    ]

    t2 = Table(t2_data, colWidths=[28 * mm, 46 * mm, 55 * mm, 45 * mm])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_EMERALD_DARK),
        ('GRID', (0, 0), (-1, -1), 0.4, C_BORDER),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.2 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2 * mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 2.5 * mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2.5 * mm),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [C_WHITE, C_MINT_BG]),
    ]))
    story.append(t2)

    # =========================================================================
    # PÁGINA 4: FLUXO DE DEGRADAÇÃO, RASTREABILIDADE & MINUTA METODOLÓGICA
    # =========================================================================
    story.append(PageBreak())

    story.append(Paragraph("6. Fluxo de Degradação Graciosa e Selo de Proveniência", styles["SectionHeader"]))
    story.append(Paragraph(
        "Para assegurar o rigor exigido em pesquisas de pós-graduação, cada registro processado pelo SAREL é carimbado "
        "com o seu respectivo <b>Selo de Proveniência de Dados</b>. Dessa forma, a banca examinadora e os revisores de artigos "
        "científicos podem auditar com precisão cirúrgica a origem de cada decisão:",
        styles["Body"]
    ))

    c_fluxo = (
        "<b>Algoritmo de Resiliência Computacional do SAREL:</b><br/>"
        "1. <code>SE</code> chave <code>jevApiKey</code> configurada <b>E</b> conexão de rede ativa:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;→ Dispara requisição com timeout estrito de 2.000 ms.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;→ Se resposta HTTP 200 OK: Adota score Jev e grava <code>auditoria_metodo = 'JEV_SYSTEM_ONE'</code>.<br/>"
        "2. <code>SE</code> timeout, erro de autenticação, ausência de chave ou dispositivo offline:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;→ Comuta automaticamente para o motor local.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;→ Executa equações RUSLE e modelo XGBoost local.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;→ Grava <code>auditoria_metodo = 'MOTOR_LOCAL_RUSLE'</code> e emite log informativo no sistema.<br/>"
        "3. <b>Resultado:</b> Zero falhas de tela, zero bloqueios de formulário e dados 100% auditáveis."
    )
    story.append(build_callout("FLUXO DE EXECUÇÃO RESILIENTE", c_fluxo, styles, C_CYAN_BG, C_CYAN_DARK, C_CYAN_DARK))

    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("7. Minuta Metodológica para Inserção na Dissertação de Mestrado", styles["SectionHeader"]))
    story.append(Paragraph(
        "O texto a seguir foi redigido em conformidade com o padrão ABNT e pode ser diretamente incorporado à seção "
        "de <i>Metodologia e Arquitetura de Software</i> da dissertação:",
        styles["Body"]
    ))

    c_tese = (
        "<i>'A arquitetura computacional da plataforma SAREL v2.0 foi concebida sob os preceitos de modularidade e independência "
        "de fornecedores tecnológicos (vendor-agnostic software architecture), adotando o padrão de projeto Strategy. O núcleo "
        "analítico do sistema é integralmente determinístico, fundamentado nos parâmetros biofísicos da Equação Universal de "
        "Perdas de Solo Revisada (RUSLE; Renard et al., 1997) e nas matrizes pedológicas do Sistema Brasileiro de Classificação "
        "de Solos (Embrapa, 2018), associado a um modelo de aprendizado supervisionado XGBoost com validação espacial por agrupamento "
        "(Leave-One-Cluster-Out). Como contribuição de engenharia voltada à redução de latência operacional na coleta in-situ, "
        "incorporou-se uma interface adaptativa opcional para microsserviços de decisão System One (TypeSafe Jev). Essa camada "
        "opera exclusivamente sob o regime de degradação graciosa (graceful degradation): na indisponibilidade de conexão ou "
        "de credenciais ativas, o sistema garante a continuidade plena da classificação através do seu motor heurístico local, "
        "preservando a reprodutibilidade científica e a autonomia perene da ferramenta.'</i>"
    )
    story.append(build_callout("TEXTO SUGERIDO PARA A DISSERTAÇÃO (CAPÍTULO 3)", c_tese, styles, C_PURPLE_BG, C_PURPLE_DARK, C_PURPLE_DARK))

    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("8. Conclusão e Parecer Consolidado", styles["SectionHeader"]))
    story.append(Paragraph(
        "<b>Parecer Final:</b> O uso da API do Jev durante o seu período de gratuidade é <b>plenamente recomendado e seguro</b>. "
        "Ele permite explorar a vanguarda dos modelos não-autoregressivos de ultra-baixa latência para agilizar a validação de "
        "campo e a triagem logística na Bacia do Paraná 3. Concomitantemente, a presença do motor determinístico nativo assegura "
        "que o mestrando Luis Alfredo e o PPGTCA mantenham controle absoluto, custo zero e independência total do projeto.",
        styles["Body"]
    ))

    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph("<b>Referências Normativas e Científicas:</b>", styles["SubSectionHeader"]))
    story.append(Paragraph("1. GAMMA, E. et al. <i>Design Patterns: Elements of Reusable Object-Oriented Software</i>. Boston: Addison-Wesley, 1994.", styles["BiblioItem"]))
    story.append(Paragraph("2. KAHNEMAN, D. <i>Thinking, Fast and Slow</i>. New York: Farrar, Straus and Giroux, 2011.", styles["BiblioItem"]))
    story.append(Paragraph("3. RENARD, K. G. et al. <i>Predicting Soil Erosion by Water: A Guide to Conservation Planning With the Revised Universal Soil Loss Equation (RUSLE)</i>. Washington: USDA, 1997.", styles["BiblioItem"]))
    story.append(Paragraph("4. SANTOS, H. G. et al. <i>Sistema Brasileiro de Classificação de Solos (SiBCS)</i>. 5. ed. Brasília: Embrapa Solos, 2018.", styles["BiblioItem"]))

    doc.build(story, canvasmaker=JevJustificativaCanvas)
    print(f"PDF gerado com sucesso em: {output_path}")

if __name__ == "__main__":
    gerar_pdf_justificativa_jev()
