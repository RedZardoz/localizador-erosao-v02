#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
GERADOR DA APRESENTAÇÃO OFICIAL EM PDF (16:9 WIDESCREEN) — SAREL v2.0
Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
PPGTCA 2026 - Universidade Tecnológica Federal do Paraná (UTFPR)
Pesquisa de Mestrado: Amostragem e Predição de Erosão Laminar no Paraná
Autor: Luis Alfredo
=============================================================================
Gera slides em formato PDF (960 x 540 pt) com sobriedade científica,
eliminando retórica inflada e refletindo a realidade funcional do sistema.
"""

import os
import sys
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

PAGE_WIDTH = 960
PAGE_HEIGHT = 540

C_NAVY = colors.HexColor("#0F172A")       # Slate 900
C_NAVY_CARD = colors.HexColor("#1E293B")  # Slate 800
C_BG_LIGHT = colors.HexColor("#F8FAFC")   # Slate 50
C_WHITE = colors.HexColor("#FFFFFF")
C_BORDER = colors.HexColor("#E2E8F0")     # Slate 200

C_EMERALD = colors.HexColor("#059669")    # Emerald 600
C_EMERALD_LIGHT = colors.HexColor("#10B981") # Emerald 500
C_EMERALD_BG = colors.HexColor("#ECFDF5") # Emerald 50
C_CYAN = colors.HexColor("#0284C7")       # Sky 600
C_CYAN_BG = colors.HexColor("#F0F9FF")    # Sky 50
C_AMBER = colors.HexColor("#D97706")      # Amber 600
C_AMBER_BG = colors.HexColor("#FFFBEB")   # Amber 50
C_ROSE = colors.HexColor("#E11D48")       # Rose 600
C_ROSE_BG = colors.HexColor("#FFF1F2")    # Rose 50
C_TEXT_DARK = colors.HexColor("#0F172A")
C_TEXT_MUTED = colors.HexColor("#475569") # Slate 600
C_TEXT_LIGHT = colors.HexColor("#64748B") # Slate 500


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, total_pages):
        page_num = self._pageNumber
        self.saveState()
        self.setFillColor(C_BG_LIGHT)
        self.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

        if page_num == 1:
            self.setFillColor(C_NAVY)
            self.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
            self.setFillColor(C_EMERALD)
            self.rect(0, 0, 16, PAGE_HEIGHT, fill=1, stroke=0)
            self.setFillColor(C_EMERALD_LIGHT)
            self.rect(0, 32, PAGE_WIDTH, 2, fill=1, stroke=0)
            self.setFont("Helvetica", 9)
            self.setFillColor(C_TEXT_LIGHT)
            self.drawString(50, 16, "PPGTCA / UTFPR • Tecnologias Computacionais para o Agronegócio • 2026")
            self.drawRightString(PAGE_WIDTH - 50, 16, "Luis Alfredo • Mestrando")
            self.restoreState()
            return

        # Barra superior
        self.setFillColor(C_NAVY)
        self.rect(0, PAGE_HEIGHT - 64, PAGE_WIDTH, 64, fill=1, stroke=0)
        self.setFillColor(C_EMERALD)
        self.rect(0, PAGE_HEIGHT - 68, PAGE_WIDTH, 4, fill=1, stroke=0)

        # Rodapé
        self.setFillColor(C_WHITE)
        self.rect(0, 0, PAGE_WIDTH, 28, fill=1, stroke=0)
        self.setFillColor(C_BORDER)
        self.rect(0, 27, PAGE_WIDTH, 1, fill=1, stroke=0)

        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(C_EMERALD)
        self.drawString(40, 10, "SAREL v2.0")

        self.setFont("Helvetica", 8)
        self.setFillColor(C_TEXT_MUTED)
        self.drawString(100, 10, "•   Sistema de Amostragem, Sensoriamento e Rotulagem para Predição de Erosão Laminar no Paraná")

        page_str = f"{page_num} / {total_pages}"
        self.drawRightString(PAGE_WIDTH - 40, 10, page_str)
        self.restoreState()


def criar_apresentacao_pdf(caminho_saida):
    doc = SimpleDocTemplate(
        caminho_saida,
        pagesize=(PAGE_WIDTH, PAGE_HEIGHT),
        leftMargin=40,
        rightMargin=40,
        topMargin=80,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    s_capa_badge = ParagraphStyle(
        "CapaBadge",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=C_EMERALD_LIGHT,
        spaceAfter=12,
    )
    s_capa_titulo = ParagraphStyle(
        "CapaTitulo",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=26,
        leading=32,
        textColor=C_WHITE,
        spaceAfter=14,
    )
    s_capa_sub = ParagraphStyle(
        "CapaSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=13,
        leading=18,
        textColor=colors.HexColor("#CBD5E1"),
        spaceAfter=24,
    )
    s_capa_autor = ParagraphStyle(
        "CapaAutor",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=16,
        textColor=C_WHITE,
    )

    s_slide_cat = ParagraphStyle(
        "SlideCat",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=C_EMERALD_LIGHT,
    )
    s_slide_tit = ParagraphStyle(
        "SlideTit",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=C_WHITE,
    )

    s_card_tit = ParagraphStyle(
        "CardTit",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11.5,
        leading=15,
        textColor=C_NAVY,
        spaceAfter=6,
    )
    s_card_tit_emerald = ParagraphStyle("CardTitEmerald", parent=s_card_tit, textColor=C_EMERALD)
    s_card_tit_cyan = ParagraphStyle("CardTitCyan", parent=s_card_tit, textColor=C_CYAN)
    s_card_tit_amber = ParagraphStyle("CardTitAmber", parent=s_card_tit, textColor=C_AMBER)
    s_card_tit_rose = ParagraphStyle("CardTitRose", parent=s_card_tit, textColor=C_ROSE)

    s_body = ParagraphStyle(
        "CardBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=C_TEXT_DARK,
        spaceAfter=4,
    )

    def card_box(titulo, paragrafos, cor_tit="navy", cor_borda=C_BORDER, cor_fundo=C_WHITE, largura=425):
        style_tit = s_card_tit
        if cor_tit == "emerald": style_tit = s_card_tit_emerald
        elif cor_tit == "cyan": style_tit = s_card_tit_cyan
        elif cor_tit == "amber": style_tit = s_card_tit_amber
        elif cor_tit == "rose": style_tit = s_card_tit_rose

        flow = [Paragraph(titulo, style_tit)]
        for p in paragrafos:
            if isinstance(p, str):
                flow.append(Paragraph(p, s_body))
            else:
                flow.append(p)

        t = Table([[flow]], colWidths=[largura])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), cor_fundo),
            ("BOX", (0, 0), (-1, -1), 1.2, cor_borda),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        return t

    story = []

    # =========================================================================
    # SLIDE 1: CAPA
    # =========================================================================
    story.append(Spacer(1, 40))
    story.append(Paragraph("PROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO (PPGTCA / UTFPR)", s_capa_badge))
    story.append(Paragraph("SAREL: Sistema de Amostragem, Sensoriamento e Rotulagem para Predição de Erosão Laminar", s_capa_titulo))
    story.append(Paragraph("Um Instrumento Computacional Auditável para Amostragem Estratificada, Curadoria Temporal Orbital e Gestão de Rotulagem Cega no Paraná", s_capa_sub))
    story.append(Spacer(1, 25))

    capa_info = [
        [
            Paragraph("<b>Mestrando:</b> Luis Alfredo<br/><b>Programa:</b> PPGTCA / UTFPR", s_capa_autor),
            Paragraph("<b>Área de Concentração:</b> Tecnologias Computacionais para o Agronegócio<br/><b>Recorte Territorial:</b> Macrobacias Hidrográficas do Paraná", s_capa_autor),
            Paragraph("<b>Natureza:</b> Instrumento de Apoio Metodológico<br/><b>Finalidade:</b> Suporte à Pesquisa de Mestrado", s_capa_autor),
        ]
    ]
    t_capa = Table(capa_info, colWidths=[260, 360, 260])
    t_capa.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBEFORE", (1, 0), (1, 0), 1, colors.HexColor("#334155")),
        ("LINEBEFORE", (2, 0), (2, 0), 1, colors.HexColor("#334155")),
        ("LEFTPADDING", (1, 0), (-1, -1), 15),
    ]))
    story.append(t_capa)
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 2: O DESAFIO DA EROSÃO LAMINAR & SENSORIAMENTO REMOTO
    # =========================================================================
    c1 = card_box(
        "A Natureza Difusa do Fenômeno",
        [
            "<b>Remoção Contínua e Silenciosa:</b> A erosão laminar remove lâminas delgadas de solo fértil de maneira distribuída, sem a formação imediata de incisões ou sulcos visíveis na superfície cultivada.",
            "<b>O Limite da Vistoria Tradicional:</b> Vistorias presenciais convencionais sofrem com viés de proximidade a rodovias, subjetividade do operador, ausência de rastreabilidade temporal e cobertura restrita a frações mínimas do território.",
            "<b>Tensão Metodológica Real:</b> Se a erosão laminar é um processo de dano cumulativo difuso, a fotointerpretação remota instantânea é desafiadora. O sensoriamento remoto não substitui a física de campo, mas captura seus efeitos acumulados na série histórica.",
        ],
        cor_tit="rose", cor_borda=colors.HexColor("#FECDD3"), cor_fundo=C_ROSE_BG, largura=425
    )

    c2 = card_box(
        "A Resposta do SAREL: Detecção por Indicadores",
        [
            "<b>Assinaturas Espectrais Indiretas:</b> O sistema rastreia na série Sentinel-2 os indicativos biofísicos consolidados na literatura internacional:",
            "• <b>Decapitação do Horizonte A:</b> Exposição de solo mineral com maior reflectância no SWIR e elevação do BSI (Bare Soil Index);",
            "• <b>Persistência de Exposição (Ê):</b> Frequência multitemporal de solo descoberto na entressafra e rotação de culturas;",
            "• <b>Perda Fenológica:</b> Depressão anômala nos picos sazonais de NDVI modelados por análise harmônica (OLS).",
            "<b>Validação Concorrente Obrigatória:</b> O rótulo orbital é auditado por amostragem presencial de marcadores diretos (pedestais, crostas e descalçamento radicular) com RTK.",
        ],
        cor_tit="emerald", cor_borda=colors.HexColor("#A7F3D0"), cor_fundo=C_EMERALD_BG, largura=425
    )

    story.append(Table([[c1, c2]], colWidths=[440, 440]))
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 3: DESENHO AMOSTRAL HÍBRIDO & ORÇAMENTO
    # =========================================================================
    c1 = card_box(
        "Comparação entre Estratégias Amostrais",
        [
            "<b>Cenário A (100% Presencial em Campo):</b>",
            "• Exigiria 250 a 300 pontos visitados por equipe com GNSS RTK;",
            "• Custo orçado entre <b>R$ 75 mil e R$ 120 mil</b> (deslocamento, diárias, combustível, equipe e dispersão geográfica no PR).",
            "<b>Cenário B (100% Sintético / RUSLE):</b>",
            "• <b>Rejeitado por vício metodológico estrito:</b> Treinar ML sobre dados gerados pela própria equação RUSLE levaria o algoritmo a meramente reaprender a equação, gerando resultados ilusórios sem validade empírica.",
            "<b>Cenário C (Híbrido Proposto pelo SAREL):</b>",
            "• Amostragem remota estratificada de alta resolução (~80%) conjugada à validação presencial em subamostra de controle (~20%).",
        ],
        cor_tit="cyan", cor_borda=colors.HexColor("#BAE6FD"), cor_fundo=C_CYAN_BG, largura=425
    )

    c2 = card_box(
        "Memória de Cálculo & Considerações Estatísticas",
        [
            "<b>Potencial de Redução de Custo:</b>",
            "• A estimativa orçamentária aponta redução de até ~80% nos custos de amostragem perante o cenário puramente presencial. Trata-se de <i>estimativa operacional</i>, e não economia contabilmente comprovada a priori.",
            "<b>Tamanho Amostral & Risco de Sobreajuste:</b>",
            "• Em algoritmos de árvores com gradiente (XGBoost), amostras pequenas geram risco clássico de <b>alta variância e sobreajuste (overfitting)</b>, exigindo controle de hiperparâmetros e validação espacial cruzada.",
            "• O dimensionamento para 250–300 pontos visa manter representatividade mínima dentro dos 18 estratos biofísicos e assegurar suporte estatístico robusto na partição LOCO por bacias.",
        ],
        cor_tit="amber", cor_borda=colors.HexColor("#FDE68A"), cor_fundo=C_AMBER_BG, largura=425
    )

    story.append(Table([[c1, c2]], colWidths=[440, 440]))
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 4: ESCOPO DO SAREL: AS TRÊS FUNÇÕES
    # =========================================================================
    c1 = card_box(
        "1. Propor Onde Observar",
        [
            "• Particionamento do Paraná em <b>18 estratos biofísicos</b> cruzando relevo, solo e histórico de exposição;",
            "• <b>Rarefação espacial determinística (d ≥ 1 km)</b> com semente pública para mitigar agrupamento excessivo;",
            "• Amostragem representativa cobrindo encostas críticas e áreas sob Sistema Plantio Direto consolidado.",
        ],
        cor_tit="emerald", cor_borda=colors.HexColor("#A7F3D0"), cor_fundo=C_EMERALD_BG, largura=280
    )

    c2 = card_box(
        "2. Extrair com Rastreabilidade",
        [
            "• Extração de preditores em SIRGAS 2000 / UTM 22S a partir do <b>Copernicus DEM (30m)</b> e <b>Sentinel-2 (10/20m)</b>;",
            "• Decomposição harmônica OLS de 10 anos e métricas de solo exposto com proveniência por valor;",
            "• Consulta pedológica oficial via WFS OGC do GeoServer da <b>Embrapa Solos</b>.",
        ],
        cor_tit="cyan", cor_borda=colors.HexColor("#BAE6FD"), cor_fundo=C_CYAN_BG, largura=280
    )

    c3 = card_box(
        "3. Gerenciar Rotulagem Cega",
        [
            "• Geração de <b>cadernos de rotulagem cegos</b> (sem acesso a previsões, declividade ou escores internos);",
            "• Avaliação de validade concorrente via <b>Kappa de Cohen com IC 95%</b>;",
            "• <b>Princípio de Demarcação:</b> O treino do modelo preditivo é externo; o SAREL prepara a matriz e gerencia os dados.",
        ],
        cor_tit="navy", cor_borda=C_BORDER, cor_fundo=C_WHITE, largura=280
    )

    story.append(Table([[c1, c2, c3]], colWidths=[293, 293, 293]))
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 5: GOVERNANÇA METODOLÓGICA: REGRAS FUNDAMENTAIS
    # =========================================================================
    c1 = card_box(
        "Regras 1, 5 & 4: Dado Real & Demarcação",
        [
            "<b>Regra 1 & 5 — Proibição de Constantes:</b>",
            "• Terminantemente vedado preencher lacunas de satélite com médias arbitrárias ou funções unmask com valores fixos;",
            "• Nulos são preservados com a causa da ausência e tratados nativamente pelo XGBoost;",
            "• Zero é valor físico legítimo (ex.: declividade 0% ou Ê = 0) e nunca é colapsado para ausente.",
            "<b>Regra 4 — Princípio de Demarcação:</b>",
            "• Nada calculado pelo software vira rótulo de treino;",
            "• A perda estimada pela RUSLE e escores internos são excluídos da matriz de treinamento do XGBoost.",
        ],
        cor_tit="rose", cor_borda=colors.HexColor("#FECDD3"), cor_fundo=C_ROSE_BG, largura=425
    )

    c2 = card_box(
        "Regras 3 & 9: Proveniência & Registro",
        [
            "<b>Regra 3 — Tríade de Metadados por Valor:</b>",
            "• Cada número carregado no sistema é acompanhado por: estado, fonte primária oficial e data de aquisição;",
            "• <b>Quatro Selos Formais:</b> medido (sensor primário), modelado (equação física), tabelado (literatura de referência) ou indisponível (com causa formal declarada).",
            "<b>Regra 9 — Transparência Decisória:</b>",
            "• Todo limiar científico é registrado formalmente no arquivo <code>DECISOES.md</code> com autor, data e fundamentação bibliográfica;",
            "• Parâmetros ainda não homologados pelo pesquisador permanecem bloqueados como 'indisponível'.",
        ],
        cor_tit="navy", cor_borda=C_BORDER, cor_fundo=C_WHITE, largura=425
    )

    story.append(Table([[c1, c2]], colWidths=[440, 440]))
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 6: DESENHO AMOSTRAL & ESTRATIFICAÇÃO FÍSICA
    # =========================================================================
    c1 = card_box(
        "Particionamento em 18 Estratos Físicos",
        [
            "<b>Estrutura do Espaço Amostral:</b>",
            "• <b>Ŝ (Terreno):</b> 3 tercis empíricos de declividade calculados sobre a área de estudo;",
            "• <b>Ê (Exposição):</b> 3 tercis de frequência multitemporal de solo descoberto na série Sentinel-2;",
            "• <b>K̂ (Erodibilidade):</b> 2 níveis derivados do levantamento pedológico 1:250.000 da Embrapa Solos (Nível 1: baixa/média erodibilidade; Nível 2: alta/muito alta erodibilidade).",
            "• <b>Total:</b> 3 (Ŝ) × 3 (Ê) × 2 (K̂) = 18 estratos independentes para distribuição balanceada dos pontos candidatos.",
        ],
        cor_tit="emerald", cor_borda=colors.HexColor("#A7F3D0"), cor_fundo=C_EMERALD_BG, largura=425
    )

    c2 = card_box(
        "Rarefação Espacial & Blindagem contra Circularidade",
        [
            "<b>Rarefação Espacial Gulosa (Thinning):</b>",
            "• Impõe espaçamento mínimo de d ≥ 1,0 km (distância esférica de grande círculo via Haversine) para evitar agrupamentos sobre a mesma vertente ou talhão;",
            "• Ordenação pseudo-aleatória determinística por <b>Fisher-Yates</b> com semente registrada (P07), garantindo reprodutibilidade estrita.",
            "<b>Enfrentamento da Circularidade Seleção × Preditores:</b>",
            "• A estratificação define <i>onde observar</i> para cobrir todo o espectro de relevo e solo do Paraná;",
            "• A atribuição de Classe 1 (erosão) ou Classe 0 (controle) decorre exclusivamente do rótulo humano independente, sem pré-classificação algorítmica forçada na matriz.",
        ],
        cor_tit="cyan", cor_borda=colors.HexColor("#BAE6FD"), cor_fundo=C_CYAN_BG, largura=425
    )

    story.append(Table([[c1, c2]], colWidths=[440, 440]))
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 7: SENSORES ORBITAIS & DECOMPOSIÇÃO TEMPORAL
    # =========================================================================
    c1 = card_box(
        "Insumos de Terreno e Espectrais",
        [
            "<b>Modelo Digital de Elevação (Copernicus DEM GLO-30):</b>",
            "• Reprojetado para SIRGAS 2000 / UTM 22S (EPSG:31982), eliminando o erro de distorção de escala sec(φ) do Web Mercator que subestima declividades no Paraná em até ~10%;",
            "• Derivação de curvatura de perfil, curvatura plana e acúmulo de fluxo.",
            "<b>Série Multiespectral Sentinel-2 L2A (BOA):</b>",
            "• Bandas B2, B4, B8 (10m) e B11, B12 (20m com reamostragem bilinear para alinhamento na grade de 10m);",
            "• Máscara de nuvem e sombra via Scene Classification Layer (SCL), preservando lacunas sem reposição artificial.",
        ],
        cor_tit="cyan", cor_borda=colors.HexColor("#BAE6FD"), cor_fundo=C_CYAN_BG, largura=425
    )

    c2 = card_box(
        "Decomposição Harmônica & Discriminação de Solo Nu",
        [
            "<b>Modelo Harmônico OLS (Zhu & Woodcock, 2014):</b>",
            "• Regressão por mínimos quadrados de 1 e 2 ciclos anuais sobre a série histórica, modelando tendência, amplitudes sazonais e fases para cada banda;",
            "• Métricas de qualidade: número de observações válidas, erro-padrão e coeficiente de determinação R².",
            "<b>Discriminação Solo Nu × Palhada Seca em SPD:</b>",
            "• Em Sistema Plantio Direto, palhada residual seca apresenta baixo NDVI. O SAREL conjuga NDVI com BSI e bandas SWIR para evitar que talhões bem cobertos com palhada morta sejam falsamente computados como solo exposto degradado.",
        ],
        cor_tit="emerald", cor_borda=colors.HexColor("#A7F3D0"), cor_fundo=C_EMERALD_BG, largura=425
    )

    story.append(Table([[c1, c2]], colWidths=[440, 440]))
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 8: LINHA DE BASE RUSLE (STATUS REAL & HONESTIDADE ACADÊMICA)
    # =========================================================================
    c1 = card_box(
        "RUSLE como Comparador Externo",
        [
            "<b>Papel na Pesquisa:</b>",
            "• A equação empírica RUSLE (A = R · K · LS · C · P) atua exclusivamente como <b>linha de base comparativa</b>;",
            "• Não fornece rótulos supervisionados e sua perda estimada não integra os preditores da matriz de treinamento do XGBoost.",
            "<b>Fator C Decidido (D01):</b>",
            "• C = (1 − NDVI)/2 (Durigon et al., 2014). Equação sem parâmetros livres ajustada para bacia tropical;",
            "• Limitação conhecida: resposta linear comprime a faixa de C em dossel fechado; análise de sensibilidade com van der Knijff et al. (2000) prevista no plano.",
        ],
        cor_tit="navy", cor_borda=C_BORDER, cor_fundo=C_WHITE, largura=425
    )

    c2 = card_box(
        "Fatores Pendentes & Invariante 1",
        [
            "<b>Fator P Tabelado:</b>",
            "• P = 1,0 (práticas conservacionistas desconhecidas, Renard et al., 1997). Ajustável exclusivamente se houver comprovação documental de terraços em campo.",
            "<b>Fatores R, K e LS em Decisão (D13, D14, D15):</b>",
            "• <b>Status Sincero:</b> Os fatores R (erosividade pluviométrica), K (erodibilidade numérica em Mg·h·MJ⁻¹·mm⁻¹) e LS (topografia bidimensional) estão em calibração;",
            "• <b>Invariante 1 Ativo:</b> O cálculo de perda de solo é formalmente mantido como <b>'indisponível'</b> pelo sistema até que todas as decisões sejam homologadas pelo pesquisador.",
        ],
        cor_tit="amber", cor_borda=colors.HexColor("#FDE68A"), cor_fundo=C_AMBER_BG, largura=425
    )

    story.append(Table([[c1, c2]], colWidths=[440, 440]))
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 9: BASE FUNDIÁRIA & CONFORMIDADE COM A LGPD
    # =========================================================================
    c1 = card_box(
        "Identificação Institucional das Bases",
        [
            "<b>Distinção e Origem dos Cadastros:</b>",
            "• <b>SICAR:</b> Cadastro Ambiental Rural (559.899 polígonos no Paraná, base autodeclaratória pública);",
            "• <b>SIGEF:</b> Parcelas georreferenciadas certificadas pelo <b>INCRA</b> (Lei nº 10.267/2001);",
            "• <b>SNCR:</b> Sistema Nacional de Cadastro Rural, instituído pela Lei nº 5.868/1972 e administrado pelo <b>INCRA</b> (não pela Receita Federal, cujo cadastro fiscal é o CAFIR).",
            "<b>Finalidade Exclusiva:</b>",
            "• Logística e autorização de entrada prévia da equipe de vistoria de campo junto aos proprietários.",
        ],
        cor_tit="cyan", cor_borda=colors.HexColor("#BAE6FD"), cor_fundo=C_CYAN_BG, largura=425
    )

    c2 = card_box(
        "Conformidade Jurídica & Proteção de Dados",
        [
            "<b>Base Legal Invocada:</b>",
            "• Tratamento fundamentado no <b>Art. 7º, IV da Lei nº 13.709/2018 (LGPD)</b>: realização de estudos por órgão de pesquisa (UTFPR), com controladoria e finalidade delimitadas.",
            "<b>Medidas de Segurança Operacional:</b>",
            "• Nomes e documentos são pseudonimizados/mascarados byte a byte em consultas de tela e perfis exportados;",
            "• O acesso a contatos de titulares para autorização de entrada em campo é restrito a sessões autenticadas do pesquisador;",
            "• O sistema substitui retórica de 'imunidade total' por conformidade técnica estrita e mitigação de riscos sob a LGPD.",
        ],
        cor_tit="emerald", cor_borda=colors.HexColor("#A7F3D0"), cor_fundo=C_EMERALD_BG, largura=425
    )

    story.append(Table([[c1, c2]], colWidths=[440, 440]))
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 10: PROTOCOLO DE ROTULAGEM & VALIDAÇÃO CONCORRENTE
    # =========================================================================
    c1 = card_box(
        "Fases de Rotulagem Cega e Campo",
        [
            "<b>Fase A — Interpretação Cega (VHR / PlanetScope 3m / Ortofoto):</b>",
            "• Fotointérpretes avaliam sinais de superfície (decapitação, carreadores, falhas de plantio) sem acesso a previsões de modelos, declividade ou escores.",
            "<b>Fase B — Vistoria de Campo Concorrente (Subamostra ~20%):</b>",
            "• Equipe com GNSS RTK e KoboToolbox avalia marcadores biofísicos diretos de campo (pedestais, crostas superficiais e descalçamento radicular).",
            "• <b>Cegueira Cruzada:</b> A equipe de campo desconhece o rótulo atribuído na Fase A.",
            "<b>Fase D — Conjunto Held-Out de Alta Resolução:</b>",
            "• Ortomosaicos de drone em sítios de referência isolados estritamente para teste.",
        ],
        cor_tit="navy", cor_borda=C_BORDER, cor_fundo=C_WHITE, largura=425
    )

    c2 = card_box(
        "Auditoria de Concordância Kappa com IC 95%",
        [
            "<b>Significado Científico do Kappa:</b>",
            "• Mede a <b>validade concorrente</b> entre a rotulagem orbital remota (Fase A) e a verdade de campo (Fase B);",
            "• O sistema calcula o Erro-Padrão assintótico e o <b>Intervalo de Confiança de 95%</b> (IC 95%), fornecendo suporte estatístico robusto contra variações amostrais.",
            "<b>Patamar de Bloqueio (Landis & Koch, 1977):</b>",
            "• Trava operacional exige κ ≥ 0,61 (patamar substancial).",
            "<b>Tratamento de Divergências:</b>",
            "• Casos divergentes são arbitrados por perito sênior ou mantidos com marcação de incerteza, evitando o expurgo cego de instâncias de fronteira difícil.",
        ],
        cor_tit="emerald", cor_borda=colors.HexColor("#A7F3D0"), cor_fundo=C_EMERALD_BG, largura=425
    )

    story.append(Table([[c1, c2]], colWidths=[440, 440]))
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 11: MODELAGEM PREDITIVA & VALIDAÇÃO ESPACIAL LOCO
    # =========================================================================
    c1 = card_box(
        "Validação Espacial por Macrobacias (LOCO)",
        [
            "<b>Quebra da Autocorrelação Espacial:</b>",
            "• A Primeira Lei de Tobler (pontos próximos são mais parecidos entre si) inviabiliza a validação K-Fold aleatória tradicional em dados espaciais;",
            "• O particionamento Leave-One-Cluster/Basin-Out (LOCO) treina o XGBoost em 4 bacias hidrográficas e testa na 5ª bacia omitida, avaliando a capacidade de generalização territorial real do modelo preditivo.",
            "<b>Remoção de Coordenadas da Matriz:</b>",
            "• Latitude e longitude são terminantemente excluídas das variáveis de treino para impedir sobreajuste por memorização espacial geográfica.",
        ],
        cor_tit="cyan", cor_borda=colors.HexColor("#BAE6FD"), cor_fundo=C_CYAN_BG, largura=425
    )

    c2 = card_box(
        "Métricas de Avaliação & Explicabilidade Física",
        [
            "<b>Discriminação vs Calibração Probabilística:</b>",
            "• <b>ROC-AUC</b> mede exclusivamente a capacidade de ordenação (discriminação) entre classes;",
            "• A confiabilidade das probabilidades preditas é avaliada por métricas formais de calibração (Curvas de Calibração e <i>Brier Score</i>).",
            "<b>Auditoria de Coerência via SHAP:</b>",
            "• Gráficos Beeswarm e Dependência Parcial (valores de Shapley) explicam a contribuição biofísica das árvores do XGBoost;",
            "• Permite auditar se o modelo fundamenta suas decisões em declividade e cobertura ou se está capturando artefatos indesejados.",
        ],
        cor_tit="emerald", cor_borda=colors.HexColor("#A7F3D0"), cor_fundo=C_EMERALD_BG, largura=425
    )

    story.append(Table([[c1, c2]], colWidths=[440, 440]))
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 12: GOVERNANÇA: OS 7 INVARIANTES DE EXPORTAÇÃO
    # =========================================================================
    inv_itens = [
        "<b>Invariante 1 — Coerência RUSLE:</b> Perda de solo só é exportada se todos os 5 fatores e a memória de cálculo existirem. Caso contrário, permanece bloqueada.",
        "<b>Invariante 2 — Lista de Permissão por Perfil:</b> Bloqueia colunas não autorizadas e impede o vazamento de escores internos e variáveis sensíveis.",
        "<b>Invariante 3 — Rastreabilidade de Campos Não Medidos:</b> Registra a lista explícita de campos cujo estado não seja 'medido' por sensor primário.",
        "<b>Invariante 4 — Metadados de Rastreio Orbital:</b> Toda exportação registra identificador da cena Sentinel-2, versão do motor e timestamp.",
        "<b>Invariante 5 — Afirmação Negativa Fundiária:</b> O status 'sem correspondência' só pode ser declarado após consulta bem-sucedida sem match.",
        "<b>Invariante 6 — Lista Negra de Literais Geográficos:</b> Bloqueia nomes de UF no campo de município ou descrições provisórias de programa ('Custom', 'Bacia Local').",
        "<b>Invariante 7 — Detector de Constante Disfarçada:</b> Bloqueia colunas com valor idêntico em 100% das linhas quando N ≥ 21, com <b>exceção explícita auditada para colunas tabeladas legítimas (ex.: Fator P = 1,0)</b>.",
    ]
    t_inv = card_box("As Sete Travas Formais de Integridade do SAREL", inv_itens, cor_tit="navy", cor_borda=C_BORDER, cor_fundo=C_WHITE, largura=880)
    story.append(t_inv)
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 13: LIMITAÇÕES METODOLÓGICAS & SOLUÇÕES COMPENSATÓRIAS
    # =========================================================================
    c1 = card_box(
        "Limitações & Desafios Metodológicos",
        [
            "<b>1. Resolução do MDE (30m):</b> O Copernicus DEM suaviza microtopografia, terraços de contenção (2–6m) e microcanais, podendo subestimar localmente a declividade em talvegues acentuados.",
            "<b>2. Persistência de Nuvens:</b> Elevada nebulosidade convectiva no Paraná durante as safras de primavera/verão limita o número de passagens ópticas úteis do Sentinel-2 (ciclo de 5 dias).",
            "<b>3. Viés de Consentimento:</b> A validação presencial (20%) exige anuência formal do proprietário (CAR/SIGEF), com risco de priorizar produtores mais receptivos e com manejo conservacionista superior.",
            "<b>4. Descasamento Temporal:</b> Eventos de chuva erosiva ocorrem fora da passagem orbital; o rápido crescimento da cultura pode mascarar feições efêmeras de erosão laminar.",
        ],
        cor_tit="amber", cor_borda=colors.HexColor("#FDE68A"), cor_fundo=C_AMBER_BG, largura=425
    )

    c2 = card_box(
        "Soluções Compensatórias & Mitigações Implantadas",
        [
            "<b>1. Abordagem Multiescala:</b> Macro-triagem no GEE (30m/10m) combinada com <b>PlanetScope (3m)</b> na fotointerpretação cega e <b>ortomosaicos de drone (< 5cm)</b> no campo presencial.",
            "<b>2. Revisita Diária & Radar:</b> Constelação Planet diária para brechas de céu claro, radar <b>Sentinel-1 C-band</b> (penetra nuvens em T0) e máscara <b>UDM2 avaliada na AOI</b> do ponto (≥80%).",
            "<b>3. Dupla Cegueira & Kappa:</b> A Fase A (PlanetScope 3m) cobre <b>100% da amostra sem viés fundiário</b>; a auditoria estatística por <b>Kappa de Cohen (κ ≥ 0,61, IC 95%)</b> isola divergências.",
            "<b>4. Pares de Eventos & Frequência Ê:</b> Módulo de trios temporais (T-, T0, T+) disparado por anomalias CHIRPS/IMERG + análise da <b>persistência histórica de solo exposto (Ê)</b>.",
        ],
        cor_tit="emerald", cor_borda=colors.HexColor("#A7F3D0"), cor_fundo=C_EMERALD_BG, largura=425
    )

    story.append(Table([[c1, c2]], colWidths=[440, 440]))
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 14: REFERÊNCIAS BIBLIOGRÁFICAS
    # =========================================================================
    ref_itens = [
        "<b>Cohen, J. (1960).</b> A coefficient of agreement for nominal scales. <i>Educational and Psychological Measurement</i>, 20(1), 37-46.",
        "<b>Demattê, J. A. M. et al. (2018).</b> Geospatial Soil Sensing System (GEOS3): A tool for soil mapping and environmental assessment. <i>Geoderma</i>, 325, 1-20.",
        "<b>Durigon, V. T. et al. (2014).</b> NDVI time series for monitoring RUSLE cover management factor in a tropical watershed. <i>Int. J. of Remote Sensing</i>, 35(2), 441-453.",
        "<b>Fleiss, J. L., Cohen, J., & Everitt, B. S. (1969).</b> Large sample standard errors of kappa and weighted kappa. <i>Psychological Bulletin</i>, 72(5), 323-327.",
        "<b>Landis, J. R., & Koch, G. G. (1977).</b> The measurement of observer agreement for categorical data. <i>Biometrics</i>, 33(1), 159-174.",
        "<b>Renard, K. G. et al. (1997).</b> <i>Predicting soil erosion by water: a guide to conservation planning with the Revised Universal Soil Loss Equation (RUSLE)</i>. USDA Agriculture Handbook 703.",
        "<b>Roberts, D. R. et al. (2017).</b> Cross-validation strategies for data with temporal, spatial, hierarchical or phylogenetic structure. <i>Ecography</i>, 40(8), 913-929.",
        "<b>Tobler, W. R. (1970).</b> A computer movie simulating urban growth in the Detroit region. <i>Economic Geography</i>, 46, 234-240.",
        "<b>Zhu, Z., & Woodcock, C. E. (2014).</b> Continuous change detection and classification of land cover using all available Landsat data. <i>Remote Sensing of Environment</i>, 144, 152-171.",
    ]
    t_ref = card_box("Fundamentação Teórica da Metodologia e dos Algoritmos", ref_itens, cor_tit="navy", cor_borda=C_BORDER, cor_fundo=C_WHITE, largura=880)
    story.append(t_ref)

    # Construir PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCESSO] PDF da Apresentação SAREL v2 gerado com sucesso!")
    print(f"Arquivo gerado: {caminho_saida}")
    print(f"Total de slides: 14")


if __name__ == "__main__":
    caminho_pdf = os.path.join(os.getcwd(), "Apresentacao_SAREL_PPGTCA_2026.pdf")
    criar_apresentacao_pdf(caminho_pdf)
