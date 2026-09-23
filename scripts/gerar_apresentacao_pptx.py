# -*- coding: utf-8 -*-
"""
=============================================================================
GERADOR DA APRESENTAÇÃO SAREL v2.0 (POWERPOINT .PPTX)
Mestrado PPGTCA 2026 — Tecnologias Computacionais para o Agronegócio (UTFPR)
Pesquisa: Validação e Predição de Erosão Laminar com Sensoriamento Remoto e XGBoost
Pesquisador: Luis Alfredo
=============================================================================
"""

import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

# Paleta de Cores Institucional
C_NAVY_DARK = RGBColor(15, 23, 42)        # Slate 900
C_NAVY_CARD = RGBColor(30, 41, 59)        # Slate 800
C_BORDER_DARK = RGBColor(51, 65, 85)      # Slate 700

C_BG_LIGHT = RGBColor(248, 250, 252)      # Slate 50
C_CARD_LIGHT = RGBColor(255, 255, 255)    # Branco puro
C_BORDER_LIGHT = RGBColor(226, 232, 240)  # Slate 200

C_EMERALD_DARK = RGBColor(6, 95, 70)      # Emerald 800
C_EMERALD_MID = RGBColor(5, 150, 105)     # Emerald 600
C_EMERALD_LIGHT = RGBColor(16, 185, 129)  # Emerald 500
C_MINT_BG = RGBColor(236, 253, 245)       # Mint 50

C_CYAN_DARK = RGBColor(3, 105, 161)       # Sky 700
C_CYAN_LIGHT = RGBColor(14, 165, 233)     # Sky 500
C_AMBER_DARK = RGBColor(180, 83, 9)       # Amber 700
C_ROSE_DARK = RGBColor(190, 18, 60)       # Rose 700

C_TEXT_DARK = RGBColor(15, 23, 42)        # Slate 900
C_TEXT_MUTED = RGBColor(71, 85, 105)      # Slate 600
C_TEXT_LIGHT = RGBColor(203, 213, 225)    # Slate 300
C_WHITE = RGBColor(255, 255, 255)

def criar_apresentacao(caminho_saida):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    def set_bg(slide, cor=C_BG_LIGHT):
        bg = slide.background
        fill = bg.fill
        fill.solid()
        fill.fore_color.rgb = cor

    def add_header(slide, titulo, categoria="PPGTCA 2026 • PESQUISA DE MESTRADO EM EROSÃO LAMINAR (UTFPR)"):
        top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.15))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = C_NAVY_DARK
        top_bar.line.color.rgb = C_NAVY_DARK

        tb_cat = slide.shapes.add_textbox(Inches(0.8), Inches(0.12), Inches(11.7), Inches(0.3))
        p_cat = tb_cat.text_frame.paragraphs[0]
        p_cat.text = categoria.upper()
        p_cat.font.size = Pt(9.5)
        p_cat.font.bold = True
        p_cat.font.color.rgb = C_EMERALD_LIGHT

        tb_tit = slide.shapes.add_textbox(Inches(0.8), Inches(0.40), Inches(11.7), Inches(0.6))
        p_tit = tb_tit.text_frame.paragraphs[0]
        p_tit.text = titulo
        p_tit.font.size = Pt(20)
        p_tit.font.bold = True
        p_tit.font.color.rgb = C_WHITE

        # Linha inferior do header
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(1.13), Inches(13.333), Inches(0.04))
        line.fill.solid()
        line.fill.fore_color.rgb = C_EMERALD_MID
        line.line.color.rgb = C_EMERALD_MID

    def add_footer(slide, num_slide, total_slides=17):
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(7.1), Inches(11.733), Inches(0.3))
        p = tb.text_frame.paragraphs[0]
        p.text = f"SAREL v2.0 • Sistema de Amostragem e Rotulagem para Erosão Laminar | UTFPR Medianeira | Slide {num_slide} de {total_slides}"
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_TEXT_MUTED

    # =========================================================================
    # SLIDE 1: CAPA INSTITUCIONAL
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_bg(s1, C_NAVY_DARK)

    # Faixa lateral decorativa
    side_strip = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.35), Inches(7.5))
    side_strip.fill.solid()
    side_strip.fill.fore_color.rgb = C_EMERALD_LIGHT
    side_strip.line.color.rgb = C_EMERALD_LIGHT

    tb_c = s1.shapes.add_textbox(Inches(1.0), Inches(1.2), Inches(11.3), Inches(5.0))
    tf_c = tb_c.text_frame
    tf_c.word_wrap = True

    p0 = tf_c.paragraphs[0]
    p0.text = "PROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO (PPGTCA - 2026)"
    p0.font.size = Pt(11)
    p0.font.bold = True
    p0.font.color.rgb = C_EMERALD_LIGHT
    p0.space_after = Pt(14)

    p1 = tf_c.add_paragraph()
    p1.text = "SAREL: Sistema de Amostragem e\nRotulagem para Erosão Laminar"
    p1.font.size = Pt(32)
    p1.font.bold = True
    p1.font.color.rgb = C_WHITE
    p1.space_after = Pt(14)

    p2 = tf_c.add_paragraph()
    p2.text = "Validação e Predição de Erosão Laminar Utilizando Sensoriamento Remoto Multitemporal e Gradient Boosting (XGBoost)"
    p2.font.size = Pt(16)
    p2.font.color.rgb = C_TEXT_LIGHT
    p2.space_after = Pt(26)

    p3 = tf_c.add_paragraph()
    p3.text = "Pesquisador: Luis Alfredo  •  Universidade Tecnológica Federal do Paraná (UTFPR) — Campus Medianeira\nÁrea de Estudo: Bacia Hidrográfica do Paraná 3 (BP3), Paraná, Brasil  •  Versão: 2.0 (Setembro/2026)"
    p3.font.size = Pt(11.5)
    p3.font.color.rgb = C_EMERALD_LIGHT

    # =========================================================================
    # SLIDE 2: O PROBLEMA CIENTÍFICO E AS LACUNAS DA LITERATURA
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_bg(s2)
    add_header(s2, "1. O Problema Científico e as Lacunas Metodológicas")
    add_footer(s2, 2)

    boxes_s2 = [
        ("O Fenômeno Físico Difuso", "A erosão laminar desagrega finas camadas superficiais por impacto de gotas (splash) e escoamento raso. Diferente de voçorocas, é visualmente sutil e quase invisível ao olho destreinado em imagens isoladas.", C_NAVY_DARK),
        ("A Falácia Espectral Direta (Vrieling, 2006)", "Sensores orbitais de média resolução (Sentinel-2, 10 m) NÃO detectam a lâmina de solo perdida diretamente, mas sim proxies biofísicos: solo exposto, palhada em dessecação e atrofia crônica de biomassa.", C_EMERALD_DARK),
        ("Vazamento Temporal / Data Leakage (Kaufman et al., 2012)", "Treinar modelos com dados contemporâneos ou posteriores ao dano causa vazamento de informação. Para prognóstico preventivo real (Modelo P), é mandatório isolar a série temporal com guarda de 2 anos.", C_AMBER_DARK),
        ("Autocorrelação Espacial Inflada (Roberts et al., 2017)", "A validação cruzada aleatória tradicional (Random k-fold) gera métricas ilusoriamente altas por proximidade espacial (Primeira Lei de Tobler). O SAREL exige Spatial Block Cross-Validation.", C_ROSE_DARK),
    ]

    for idx, (tit, txt, cor_topo) in enumerate(boxes_s2):
        col = idx % 2
        row = idx // 2
        x = Inches(0.8 + col * 5.95)
        y = Inches(1.5 + row * 2.7)
        card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.75), Inches(2.45))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        top_line = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, Inches(5.75), Inches(0.12))
        top_line.fill.solid()
        top_line.fill.fore_color.rgb = cor_topo
        top_line.line.color.rgb = cor_topo

        tb = s2.shapes.add_textbox(x + Inches(0.2), y + Inches(0.2), Inches(5.35), Inches(2.1))
        tf = tb.text_frame
        tf.word_wrap = True
        p_t = tf.paragraphs[0]
        p_t.text = tit
        p_t.font.bold = True
        p_t.font.size = Pt(13)
        p_t.font.color.rgb = cor_topo
        p_t.space_after = Pt(6)

        p_d = tf.add_paragraph()
        p_d.text = txt
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = C_TEXT_DARK

    # =========================================================================
    # SLIDE 3: ARQUITETURA EM CAMADAS E FLUXO GERAL
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_bg(s3)
    add_header(s3, "2. Arquitetura de Software e Distribuição de Responsabilidades")
    add_footer(s3, 3)

    camadas = [
        ("Nuvem / Google Earth Engine", "Ingestão e pré-processamento orbital massivo de Sentinel-2 L2A (2016-2026), MDE Copernicus GLO-30 e grades de chuva CHIRPS/IMERG. Aplicação de máscaras de nuvem/sombra (QA60/SCL) e redução zonal.", C_CYAN_LIGHT),
        ("Motor Local do SAREL (TypeScript / Node.js)", "Estratificação multivariada (18 estratos), rarefação espacial geodésica (1 km), decomposição harmônica OLS, cálculo de persistência temporal (NDVI <= 0.25), Linha de Base RUSLE (A = R·K·LS·C·P) e cruzamento fundiário SQLite (SICAR/SIGEF).", C_EMERALD_MID),
        ("Alta Resolução PlanetScope API", "Extração de trios de cenas de altíssima resolução espacial (3 m) em pares antes/depois de eventos pluviométricos erosivos. Subsidia a fotointerpretação cega independente por dois auditores humanos.", C_AMBER_DARK),
        ("Auditoria Cognitiva Jev (TypeSafe AI)", "Motor de julgamento tipado estritamente para triagem rápida, auditoria física de plausibilidade e apoio logístico de campo. Opera em arquitetura Dual-Engine com degradação graciosa para o Motor Local.", C_NAVY_CARD),
        ("Ambiente de IA Supervisionada (Python / XGBoost)", "Treinamento preditivo externo sobre matriz desidentificada (sem coordenadas), validação cruzada espacial em blocos (Spatial Block CV com buffer) e explicabilidade com valores SHAP.", C_ROSE_DARK),
    ]

    for idx, (cam_tit, cam_desc, cor_badge) in enumerate(camadas):
        y = Inches(1.4 + idx * 1.08)
        card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y, Inches(11.733), Inches(0.96))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        badge = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.95), y + Inches(0.12), Inches(3.2), Inches(0.72))
        badge.fill.solid()
        badge.fill.fore_color.rgb = cor_badge
        badge.line.color.rgb = cor_badge

        tb_b = s3.shapes.add_textbox(Inches(1.0), y + Inches(0.15), Inches(3.1), Inches(0.65))
        tf_b = tb_b.text_frame
        tf_b.word_wrap = True
        p_b = tf_b.paragraphs[0]
        p_b.text = cam_tit
        p_b.font.bold = True
        p_b.font.size = Pt(11)
        p_b.font.color.rgb = C_WHITE

        tb_d = s3.shapes.add_textbox(Inches(4.3), y + Inches(0.12), Inches(8.1), Inches(0.75))
        tf_d = tb_d.text_frame
        tf_d.word_wrap = True
        p_d = tf_d.paragraphs[0]
        p_d.text = cam_desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = C_TEXT_DARK

    # =========================================================================
    # SLIDE 4: ONDE OS CÁLCULOS SÃO EXECUTADOS?
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_bg(s4)
    add_header(s4, "3. Mapeamento de Onde os Cálculos são Executados")
    add_footer(s4, 4)

    card_left = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.4), Inches(5.75), Inches(5.4))
    card_left.fill.solid()
    card_left.fill.fore_color.rgb = C_CARD_LIGHT
    card_left.line.color.rgb = C_CYAN_LIGHT

    top_l = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.4), Inches(5.75), Inches(0.45))
    top_l.fill.solid()
    top_l.fill.fore_color.rgb = C_CYAN_LIGHT
    top_l.line.color.rgb = C_CYAN_LIGHT
    p_tl = top_l.text_frame.paragraphs[0]
    p_tl.text = "CÁLCULOS NO GOOGLE EARTH ENGINE (NUVEM)"
    p_tl.font.bold = True
    p_tl.font.size = Pt(11)
    p_tl.font.color.rgb = C_WHITE

    tb_l = s4.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.35), Inches(4.6))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True
    itens_gee = [
        ("Filtragem de Nuvem e Sombra:", "Processamento orbital por pixel via SCL e QA60."),
        ("Extração Espectral Zonal:", "Amostragem das bandas B2, B4, B8, B11, B12 em mais de 100 cenas por ponto na série 2016-2026."),
        ("Derivação Topográfica MDE:", "Cálculo de declividade contínua (%) e elevação a partir do Copernicus GLO-30."),
        ("Redução Zonal Pluviométrica:", "Cruzamento geoespacial de grades diárias CHIRPS e semi-horárias IMERG GPM."),
        ("Máscaras de Elegibilidade:", "Aplicação das classes agrícolas da ESA WorldCover e buffers de corpos d'água e malha urbana.")
    ]
    for tit, dsc in itens_gee:
        p = tf_l.add_paragraph() if tf_l.paragraphs[0].text else tf_l.paragraphs[0]
        r1 = p.add_run(); r1.text = f"• {tit} "; r1.font.bold = True; r1.font.size = Pt(10); r1.font.color.rgb = C_CYAN_DARK
        r2 = p.add_run(); r2.text = dsc; r2.font.size = Pt(9.5); r2.font.color.rgb = C_TEXT_DARK
        p.space_after = Pt(8)

    card_right = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.4), Inches(5.75), Inches(5.4))
    card_right.fill.solid()
    card_right.fill.fore_color.rgb = C_CARD_LIGHT
    card_right.line.color.rgb = C_EMERALD_MID

    top_r = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.8), Inches(1.4), Inches(5.75), Inches(0.45))
    top_r.fill.solid()
    top_r.fill.fore_color.rgb = C_EMERALD_MID
    top_r.line.color.rgb = C_EMERALD_MID
    p_tr = top_r.text_frame.paragraphs[0]
    p_tr.text = "CÁLCULOS NO MOTOR LOCAL DO SAREL (EDGE / ON-PREMISE)"
    p_tr.font.bold = True
    p_tr.font.size = Pt(11)
    p_tr.font.color.rgb = C_WHITE

    tb_r = s4.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.35), Inches(4.6))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    itens_local = [
        ("Estratificação e Thinning Geodésico:", "Particionamento em 18 estratos (S^ x E^ x K^) e rarefação de 1 km por Fisher-Yates."),
        ("Time-Series Stacking e Lags:", "Cálculo de percentis (p10, p50, p90), lags temporais (t0, t-3m, t-6m, t-12m) e harmônicos OLS."),
        ("Persistência Temporal (GEOS3):", "Cálculo da frequência de solo nu com limiar estrito NDVI <= 0.25 (Decisão D10)."),
        ("Linha de Base RUSLE (A = R·K·LS·C·P):", "Fator C (Durigon et al., 2014) e Fator K numérico da Tabela 5 da Embrapa Solos (Doc. 246/2024 / Mannigel et al., 2002)."),
        ("Concordância Inter-intérpretes:", "Cálculo do Kappa de Cohen e validação dos 7 Invariantes."),
        ("Cruzamento Fundiário Offline:", "Auditoria geoespacial de polígonos SICAR, SIGEF e SNCR em SQLite local.")
    ]
    for tit, dsc in itens_local:
        p = tf_r.add_paragraph() if tf_r.paragraphs[0].text else tf_r.paragraphs[0]
        r1 = p.add_run(); r1.text = f"• {tit} "; r1.font.bold = True; r1.font.size = Pt(10); r1.font.color.rgb = C_EMERALD_DARK
        r2 = p.add_run(); r2.text = dsc; r2.font.size = Pt(9.5); r2.font.color.rgb = C_TEXT_DARK
        p.space_after = Pt(6)

    # =========================================================================
    # SLIDE 5: O USO DO JEV (SYSTEM ONE / TYPESAFE AI)
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_bg(s5)
    add_header(s5, "4. O Uso do Jev: Auditoria Cognitiva e Degradação Graciosa")
    add_footer(s5, 5)

    boxes_jev = [
        ("O que é o Jev?", "Subsistema baseado em Inteligência Artificial Tipo-Segura (TypeSafe AI) que emite respostas rigorosamente tipadas: Noul (booleano calibrado), Choice (classificação em taxonomia fechada) e Score (escala ordinal 0 a 4).", C_NAVY_DARK),
        ("Quando é Optado pelo Pesquisador?", "Ativado opcionalmente para triagem rápida em lote, detecção prévia de anomalias nos dados espectrais e apoio na priorização de rotas logísticas para as equipes de campo.", C_CYAN_DARK),
        ("Degradação Graciosa (Dual-Engine)", "Caso a chave de API não esteja presente, ocorra timeout ou falha de conectividade, o sistema comuta instantaneamente para o MOTOR_LOCAL_RUSLE determinístico, garantindo 100% de disponibilidade.", C_EMERALD_DARK),
        ("REGRA DE OURO 4 (Blindagem contra Circularidade)", "O Jev NUNCA define o rótulo da matriz de treinamento! Os rótulos de verdade terrestre provêm unicamente de observadores humanos (interpretação cega PlanetScope, campo e drone).", C_ROSE_DARK),
    ]

    for idx, (tit, txt, cor_topo) in enumerate(boxes_jev):
        col = idx % 2
        row = idx // 2
        x = Inches(0.8 + col * 5.95)
        y = Inches(1.5 + row * 2.7)
        card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.75), Inches(2.45))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        top_line = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, Inches(5.75), Inches(0.12))
        top_line.fill.solid()
        top_line.fill.fore_color.rgb = cor_topo
        top_line.line.color.rgb = cor_topo

        tb = s5.shapes.add_textbox(x + Inches(0.2), y + Inches(0.2), Inches(5.35), Inches(2.1))
        tf = tb.text_frame
        tf.word_wrap = True
        p_t = tf.paragraphs[0]
        p_t.text = tit
        p_t.font.bold = True
        p_t.font.size = Pt(13)
        p_t.font.color.rgb = cor_topo
        p_t.space_after = Pt(6)

        p_d = tf.add_paragraph()
        p_d.text = txt
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = C_TEXT_DARK

    # =========================================================================
    # SLIDE 6: PASSO A PASSO (1 A 3) - ELEGIBILIDADE E ESTRATIFICAÇÃO
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_bg(s6)
    add_header(s6, "5. Passo a Passo do Aplicativo: Amostragem e Estratificação")
    add_footer(s6, 6)

    passos_1_3 = [
        ("Passo 1: Delimitação da AOI e Elegibilidade Agrícola", [
            "Definição do polígono da Área de Interesse (Bacia Hidrográfica do Paraná 3 - BP3).",
            "Filtragem por máscara ESA WorldCover: classes elegíveis 30 (lavouras), 40 (mosaicos agrícolas) e 60 (pastagens).",
            "Exclusão espacial preventiva: buffer de 30 metros ao longo de corpos d'água e 150 metros em torno de perímetros urbanos.",
            "Domínio agrícola estrito: exclusão de dunas, afloramentos rochosos e áreas de mineração."
        ]),
        ("Passo 2: Estratificação Geoespacial Multivariada (18 Estratos)", [
            "Combinação ortogonal de 3 eixos biofísicos disjuntos (3 x 3 x 2 = 18 estratos):",
            "• Eixo Declividade (S^): 3 tercis obtidos do MDE Copernicus GLO-30 (Plano/Suave, Moderado, Forte).",
            "• Eixo Exposição de Solo Nu (E^): 3 tercis calculados sobre a série histórica Sentinel-2 (Baixa, Média, Alta exposição).",
            "• Eixo Erodibilidade (K^): 2 níveis pedológicos (Nível 1: Baixa/Média K <= 0.0285; Nível 2: Alta/Muito Alta K >= 0.0300 — Decisão D09)."
        ]),
        ("Passo 3: Rarefação Espacial Geodésica (Spatial Thinning)", [
            "Aplicação do algoritmo determinístico de Fisher-Yates com semente pseudoaleatória auditável registrada a cada execução (P07).",
            "Espaçamento euclidiano/geodésico mínimo de 1,0 km entre quaisquer pares de pontos amostrais candidatos.",
            "Eliminação da autocorrelação espacial redundante em microescala e garantia de dispersão uniforme pela bacia hidrográfica."
        ])
    ]

    for idx, (p_tit, p_itens) in enumerate(passos_1_3):
        y = Inches(1.4 + idx * 1.82)
        card = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y, Inches(11.733), Inches(1.68))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        left_strip = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), y, Inches(0.15), Inches(1.68))
        left_strip.fill.solid()
        left_strip.fill.fore_color.rgb = C_EMERALD_MID
        left_strip.line.color.rgb = C_EMERALD_MID

        tb = s6.shapes.add_textbox(Inches(1.1), y + Inches(0.1), Inches(11.2), Inches(1.48))
        tf = tb.text_frame
        tf.word_wrap = True
        p_head = tf.paragraphs[0]
        p_head.text = p_tit
        p_head.font.bold = True
        p_head.font.size = Pt(12)
        p_head.font.color.rgb = C_NAVY_DARK
        p_head.space_after = Pt(4)

        for item in p_itens:
            p_i = tf.add_paragraph()
            p_i.text = f"• {item}"
            p_i.font.size = Pt(9.5)
            p_i.font.color.rgb = C_TEXT_DARK
            p_i.space_after = Pt(1)

    # =========================================================================
    # SLIDE 7: PASSO A PASSO (4 A 6) - SÉRIES E PERSISTÊNCIA TEMPORAL
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_bg(s7)
    add_header(s7, "6. Passo a Passo do Aplicativo: Séries Temporais e Fenologia")
    add_footer(s7, 7)

    passos_4_6 = [
        ("Passo 4: Agrupamento em Blocos Espaciais (Spatial Blocks)", [
            "Particionamento do domínio geográfico em blocos poligonais com aresta de 20 km (derivada do semivariograma empírico).",
            "Isolamento dos blocos para viabilizar a Validação Cruzada Espacial em Blocos (Spatial Block CV com buffer de 1 km).",
            "Garante que amostras de treino e teste pertençam a unidades morfoestruturais distintas (Roberts et al., 2017)."
        ]),
        ("Passo 5: Extração Multitemporal e Índices Biofísicos", [
            "Coleta de trajetórias temporais Sentinel-2 L2A (2016-2026) sem nuvem/sombra (bandas B2, B4, B8, B11, B12).",
            "Cálculo contínuo de índices biofísicos: NDVI (Índice de Vegetação) e BSI (Índice de Solo Exposto).",
            "Mínimo rigoroso de 6 observações válidas por janela temporal exigido para análise válida (Decisão D11)."
        ]),
        ("Passo 6: Decomposição Harmônica e Persistência de Solo Nu (GEOS3)", [
            "Ajuste harmônico OLS com 1 e 2 ciclos anuais (Zhu & Woodcock, 2014 / CCDC) para modelar fenologia cíclica.",
            "Cálculo da tendência linear no SWIR B12: aumento positivo sinaliza exposição mineral do horizonte B do solo.",
            "Discriminação de Pousio vs Degradação Crônica com o limiar estrito NDVI <= 0.25 (Safanelli et al., 2021 — Decisão D10)."
        ])
    ]

    for idx, (p_tit, p_itens) in enumerate(passos_4_6):
        y = Inches(1.4 + idx * 1.82)
        card = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y, Inches(11.733), Inches(1.68))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        left_strip = s7.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), y, Inches(0.15), Inches(1.68))
        left_strip.fill.solid()
        left_strip.fill.fore_color.rgb = C_CYAN_LIGHT
        left_strip.line.color.rgb = C_CYAN_LIGHT

        tb = s7.shapes.add_textbox(Inches(1.1), y + Inches(0.1), Inches(11.2), Inches(1.48))
        tf = tb.text_frame
        tf.word_wrap = True
        p_head = tf.paragraphs[0]
        p_head.text = p_tit
        p_head.font.bold = True
        p_head.font.size = Pt(12)
        p_head.font.color.rgb = C_NAVY_DARK
        p_head.space_after = Pt(4)

        for item in p_itens:
            p_i = tf.add_paragraph()
            p_i.text = f"• {item}"
            p_i.font.size = Pt(9.5)
            p_i.font.color.rgb = C_TEXT_DARK
            p_i.space_after = Pt(1)

    # =========================================================================
    # SLIDE 8: PASSO A PASSO (7 A 8) - RUSLE E CURADORIA CEGA
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_bg(s8)
    add_header(s8, "7. Passo a Passo do Aplicativo: RUSLE e Curadoria de Rótulos")
    add_footer(s8, 8)

    passos_7_8 = [
        ("Passo 7: Montagem da Linha de Base RUSLE (A = R · K · LS · C · P)", [
            "Fator C: Função regionalizada de Durigon et al. (2014) baseada em NDVI: C = [(1 - NDVI)/2]^(1 + NDVI) — Decisão D01.",
            "Fator K: Conversão oficial da Tabela 5 da Embrapa Solos (Doc. 246/2024 / Mannigel et al., 2002 — Decisão D14).",
            "Fator P: Práticas conservacionistas (Renard et al., 1997; valor tabelado P = 1.0 na ausência de terraceamento).",
            "Invariante 1 de Integridade: Perda de solo (A) só é calculada se os 5 fatores estiverem simultaneamente disponíveis com valores finitos."
        ]),
        ("Passo 8: Protocolos Cegos de Coleta e Validação Multicamada", [
            "Fase A (PlanetScope 3 m): 2 fotointérpretes humanos independentes; pares antes/depois de chuva; validação por Kappa de Cohen (k >= 0.60).",
            "Fase B (Auditoria em Campo): Ficha KoboToolbox com tolerância geodésica P03 de 15 m nominal (até 25 m sob aviso) e cruzamento fundiário (SICAR/SIGEF).",
            "Fase D (VANT Spectral 2 - Nuvem UAV): Sensor multiespectral 5 bandas (B, G, R, RedEdge, NIR), PPK/RTK e GSD 3 a 7,5 cm em 4 sítios de 10 a 50 ha.",
            "Confronto Radiométrico: Correlação de Pearson r entre NDVI Sentinel-2 e drone, mantido estritamente como held-out (Regra 4)."
        ])
    ]

    for idx, (p_tit, p_itens) in enumerate(passos_7_8):
        y = Inches(1.5 + idx * 2.7)
        card = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y, Inches(11.733), Inches(2.45))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        left_strip = s8.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), y, Inches(0.15), Inches(2.45))
        left_strip.fill.solid()
        left_strip.fill.fore_color.rgb = C_AMBER_DARK
        left_strip.line.color.rgb = C_AMBER_DARK

        tb = s8.shapes.add_textbox(Inches(1.1), y + Inches(0.15), Inches(11.2), Inches(2.15))
        tf = tb.text_frame
        tf.word_wrap = True
        p_head = tf.paragraphs[0]
        p_head.text = p_tit
        p_head.font.bold = True
        p_head.font.size = Pt(13)
        p_head.font.color.rgb = C_NAVY_DARK
        p_head.space_after = Pt(6)

        for item in p_itens:
            p_i = tf.add_paragraph()
            p_i.text = f"• {item}"
            p_i.font.size = Pt(10.5)
            p_i.font.color.rgb = C_TEXT_DARK
            p_i.space_after = Pt(3)

    # =========================================================================
    # SLIDE 9: PASSO A PASSO (9 A 10) - XGBOOST E VALIDAÇÃO ESPAÇO-TEMPORAL
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_bg(s9)
    add_header(s9, "8. Passo a Passo do Aplicativo: Treinamento XGBoost e SHAP")
    add_footer(s9, 9)

    passos_9_10 = [
        ("Passo 9: Modelagem Preditiva com Gradient Tree Boosting (XGBoost)", [
            "Treinamento supervisionado a partir da matriz tabular limpa e desidentificada (sem coordenadas).",
            "Otimização da função objetivo com regularização L1 (alpha) e L2 (lambda) e penalidade por número de folhas (gamma) (Chen & Guestrin, 2016).",
            "Tratamento formal do desbalanceamento severo de classes da erosão laminar via parâmetro scale_pos_weight.",
            "Time-Series Stacking: inclusão de lags multitemporais (t0, t-3m, t-6m, t-12m) de NDVI e BSI."
        ]),
        ("Passo 10: Avaliação Espaço-Temporal e Explicabilidade Física", [
            "Segregação Modelo D (Detecção contemporânea até t0) vs. Modelo P (Prognóstico antecipado).",
            "Modelo P: Janela de guarda temporal bienal de 24 meses antes do evento (Kaufman et al., 2012 — Decisão D04) contra data leakage.",
            "Validação Cruzada Espacial em Blocos (Spatial Block CV com buffer de 1 km) para neutralizar a autocorrelação espacial (Roberts et al., 2017).",
            "Explicabilidade biofísica com valores SHAP (Lundberg & Lee, 2017): abertura da caixa-preta e confronto com a teoria pedológica."
        ])
    ]

    for idx, (p_tit, p_itens) in enumerate(passos_9_10):
        y = Inches(1.5 + idx * 2.7)
        card = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y, Inches(11.733), Inches(2.45))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        left_strip = s9.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), y, Inches(0.15), Inches(2.45))
        left_strip.fill.solid()
        left_strip.fill.fore_color.rgb = C_ROSE_DARK
        left_strip.line.color.rgb = C_ROSE_DARK

        tb = s9.shapes.add_textbox(Inches(1.1), y + Inches(0.15), Inches(11.2), Inches(2.15))
        tf = tb.text_frame
        tf.word_wrap = True
        p_head = tf.paragraphs[0]
        p_head.text = p_tit
        p_head.font.bold = True
        p_head.font.size = Pt(13)
        p_head.font.color.rgb = C_NAVY_DARK
        p_head.space_after = Pt(6)

        for item in p_itens:
            p_i = tf.add_paragraph()
            p_i.text = f"• {item}"
            p_i.font.size = Pt(10.5)
            p_i.font.color.rgb = C_TEXT_DARK
            p_i.space_after = Pt(3)

    # =========================================================================
    # SLIDE 10: QUADRO SÍNTESE DAS 12 FORMULAÇÕES MATEMÁTICAS CANÔNICAS
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_bg(s10)
    add_header(s10, "9. Síntese Visual das Formulações Matemáticas Canônicas do SAREL")
    add_footer(s10, 10)

    # Imagem do Quadro Completo em Alta Resolução (300 DPI)
    quadro_path = os.path.join("docs", "figuras_formulas", "quadro_completo_formulas.png")
    if os.path.exists(quadro_path):
        s10.shapes.add_picture(quadro_path, Inches(0.95), Inches(1.35), width=Inches(11.433))

    # =========================================================================
    # SLIDE 11: CÁLCULOS MATEMÁTICOS - PARTE 1: ÍNDICES E DECOMPOSIÇÃO
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_bg(s11)
    add_header(s11, "10. Cálculos Matemáticos: Índices Espectrais e Fenologia")
    add_footer(s11, 11)

    eqs_1 = [
        ("1. Índice de Vegetação por Diferença Normalizada (NDVI)", "formula_01_ndvi.png", "Mede o vigor fotossintético da biomassa vegetal ativa. Varia de -1 a +1. Banda B8 (NIR) e Banda B4 (Vermelho). Base seminal: Rouse et al. (1974)."),
        ("2. Índice de Solo Exposto (Bare Soil Index - BSI)", "formula_02_bsi.png", "Discrimina solo mineralizado desnudo de cobertura vegetal densa. Valores positivos (> 0.10) associam-se a solo descoberto ou horizonte B exposto (Rikimaru et al., 2002)."),
        ("3. Decomposição Harmônica OLS (Zhu & Woodcock, 2014)", "formula_03_harmonicos.png", "Modela a sazonalidade fenológica regular e estima a taxa de degradação linear (c1) no SWIR B12, separando ciclos agrícolas de erosão progressiva."),
        ("4. Frequência de Solo Nu (E^) — Decisão D10 (GEOS3)", "formula_04_solo_nu.png", "Fração temporal em que o solo permanece exposto ao impacto de chuva torrencial. Calibrado pelo sistema GEOS3 (Demattê et al., 2018; Safanelli et al., 2021)."),
    ]

    for idx, (tit, img_name, expl) in enumerate(eqs_1):
        col = idx % 2
        row = idx // 2
        x = Inches(0.8 + col * 5.95)
        y = Inches(1.4 + row * 2.8)
        card = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.75), Inches(2.65))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        tb = s11.shapes.add_textbox(x + Inches(0.2), y + Inches(0.12), Inches(5.35), Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        p_t = tf.paragraphs[0]
        p_t.text = tit
        p_t.font.bold = True
        p_t.font.size = Pt(11)
        p_t.font.color.rgb = C_NAVY_DARK

        img_path = os.path.join("docs", "figuras_formulas", img_name)
        if os.path.exists(img_path):
            s11.shapes.add_picture(img_path, x + Inches(0.25), y + Inches(0.55), height=Inches(0.50))

        tb_e = s11.shapes.add_textbox(x + Inches(0.2), y + Inches(1.15), Inches(5.35), Inches(1.4))
        tf_e = tb_e.text_frame
        tf_e.word_wrap = True
        p_e = tf_e.paragraphs[0]
        p_e.text = expl
        p_e.font.size = Pt(9.2)
        p_e.font.color.rgb = C_TEXT_DARK

    # =========================================================================
    # SLIDE 12: CÁLCULOS MATEMÁTICOS - PARTE 2: RUSLE E MECANISMO G2
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_bg(s12)
    add_header(s12, "11. Cálculos Matemáticos: Fatores RUSLE e Dinâmica G2")
    add_footer(s12, 12)

    eqs_2 = [
        ("5. Fator C da RUSLE Regional Tropical (Decisão D01)", "formula_05_fator_c.png", "Modelo calibrado para bacias brasileiras por Durigon et al. (2014). Para solo nu (NDVI = 0.0), C = 0.50; para vegetação densa (NDVI = 0.80), C = 0.026. Evita subestimação."),
        ("6. Fator K Numérico (Tabela 5 Embrapa Solos / D14)", "formula_06_fator_k.png", "Conversão oficial da carta pedológica para valores numéricos contínuos (Doc. 246/2024 / Mannigel et al., 2002). Estratificação K^: Nível 1 <= 0.0285; Nível 2 >= 0.0300 (D09)."),
        ("7. Equação de Perda de Solo (RUSLE)", "formula_07_rusle.png", "Equação Universal de Perda de Solo Revisada (Renard et al., 1997). Invariante 1: só calculada se os 5 fatores e a memória de cálculo existirem simultaneamente."),
        ("8. Índice Dinâmico Chuva-Solo Nu (Modelo G2)", "formula_08_g2.png", "Acoplamento físico-temporal: quantifica a ocorrência simultânea de chuva erosiva com solo exposto desprotegido (Karydas & Panagos, 2018)."),
    ]

    for idx, (tit, img_name, expl) in enumerate(eqs_2):
        col = idx % 2
        row = idx // 2
        x = Inches(0.8 + col * 5.95)
        y = Inches(1.4 + row * 2.8)
        card = s12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.75), Inches(2.65))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        tb = s12.shapes.add_textbox(x + Inches(0.2), y + Inches(0.12), Inches(5.35), Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        p_t = tf.paragraphs[0]
        p_t.text = tit
        p_t.font.bold = True
        p_t.font.size = Pt(11)
        p_t.font.color.rgb = C_NAVY_DARK

        img_path = os.path.join("docs", "figuras_formulas", img_name)
        if os.path.exists(img_path):
            s12.shapes.add_picture(img_path, x + Inches(0.25), y + Inches(0.55), height=Inches(0.50))

        tb_e = s12.shapes.add_textbox(x + Inches(0.2), y + Inches(1.15), Inches(5.35), Inches(1.4))
        tf_e = tb_e.text_frame
        tf_e.word_wrap = True
        p_e = tf_e.paragraphs[0]
        p_e.text = expl
        p_e.font.size = Pt(9.2)
        p_e.font.color.rgb = C_TEXT_DARK

    # =========================================================================
    # SLIDE 13: CÁLCULOS MATEMÁTICOS - PARTE 3: XGBOOST, KAPPA E SHAP
    # =========================================================================
    s13 = prs.slides.add_slide(blank_layout)
    set_bg(s13)
    add_header(s13, "12. Cálculos Matemáticos: Otimização XGBoost e SHAP")
    add_footer(s13, 13)

    eqs_3 = [
        ("9. Função Objetivo do XGBoost (Chen & Guestrin, 2016)", "formula_09_xgboost.png", "Aproximação de Taylor de 2ª ordem da perda com gradientes gi e hessianas hi. Regularização L2 (lambda) e penalidade por número de folhas T (gamma) contra overfitting."),
        ("10. Critério de Ganho de Divisão de Árvore (Split Gain)", "formula_10_split_gain.png", "Avalia se a divisão de um nó folha produz melhoria marginal superior ao custo de complexidade gamma da árvore."),
        ("11. Concordância Inter-intérpretes (Kappa de Cohen)", "formula_11_kappa.png", "Mede a concordância real Po descontada a concordância puramente casual Pe entre os dois fotointérpretes humanos independentes (Landis & Koch, 1977)."),
        ("12. Valores SHAP de Explicabilidade Aditiva (Lundberg & Lee, 2017)", "formula_12_shap.png", "Distribui o crédito marginal exato de cada preditor na probabilidade final de erosão, garantindo consistência teórica via teoria dos jogos."),
    ]

    for idx, (tit, img_name, expl) in enumerate(eqs_3):
        col = idx % 2
        row = idx // 2
        x = Inches(0.8 + col * 5.95)
        y = Inches(1.4 + row * 2.8)
        card = s13.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.75), Inches(2.65))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        tb = s13.shapes.add_textbox(x + Inches(0.2), y + Inches(0.12), Inches(5.35), Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        p_t = tf.paragraphs[0]
        p_t.text = tit
        p_t.font.bold = True
        p_t.font.size = Pt(11)
        p_t.font.color.rgb = C_NAVY_DARK

        img_path = os.path.join("docs", "figuras_formulas", img_name)
        if os.path.exists(img_path):
            s13.shapes.add_picture(img_path, x + Inches(0.25), y + Inches(0.55), height=Inches(0.50))

        tb_e = s13.shapes.add_textbox(x + Inches(0.2), y + Inches(1.15), Inches(5.35), Inches(1.4))
        tf_e = tb_e.text_frame
        tf_e.word_wrap = True
        p_e = tf_e.paragraphs[0]
        p_e.text = expl
        p_e.font.size = Pt(9.2)
        p_e.font.color.rgb = C_TEXT_DARK

    # =========================================================================
    # SLIDE 14: AS 9 REGRAS INVIOLÁVEIS E 7 INVARIANTES
    # =========================================================================
    s14 = prs.slides.add_slide(blank_layout)
    set_bg(s14)
    add_header(s14, "13. Governança e Blindagem: 9 Regras e 7 Invariantes")
    add_footer(s14, 14)

    card_r = s14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.4), Inches(5.75), Inches(5.4))
    card_r.fill.solid()
    card_r.fill.fore_color.rgb = C_CARD_LIGHT
    card_r.line.color.rgb = C_ROSE_DARK

    tb_r = s14.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(5.35), Inches(5.1))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    p_rt = tf_r.paragraphs[0]
    p_rt.text = "AS 9 REGRAS INVIOLÁVEIS DO SAREL"
    p_rt.font.bold = True
    p_rt.font.size = Pt(12)
    p_rt.font.color.rgb = C_ROSE_DARK
    p_rt.space_after = Pt(6)

    regras = [
        ("R1 — Sem Valores Fabricados:", "Ausência de dado permanece estritamente indisponivel."),
        ("R2 — Sem Cortes Silenciosos:", "Proibição de Math.max/min arbitrários; domínio estrito."),
        ("R3 — Rastreabilidade Total:", "Encapsulamento em Proveniencia<T>."),
        ("R4 — Nada Calculado Vira Rótulo:", "Modelos ou IA jamais viram verdade terrestre."),
        ("R5 — Guarda Antissintética:", "Proibição universal de pontos com origemSintetica: true."),
        ("R6 — Segregação Cega:", "Coordenadas não entram na matriz de treino tabular."),
        ("R7 — Preservação de Máscaras:", "Nuvens e sombras mantidas como lacunas reais."),
        ("R8 — Evidência de Verificação:", "Asserções exigem arquivos físicos de prova."),
        ("R9 — Preservação Histórica:", "Rastreabilidade e integridade via branch sarel/v2.")
    ]
    for r_tit, r_dsc in regras:
        p = tf_r.add_paragraph()
        r1 = p.add_run(); r1.text = f"{r_tit} "; r1.font.bold = True; r1.font.size = Pt(9.5); r1.font.color.rgb = C_ROSE_DARK
        r2 = p.add_run(); r2.text = r_dsc; r2.font.size = Pt(9); r2.font.color.rgb = C_TEXT_DARK
        p.space_after = Pt(2)

    card_i = s14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.4), Inches(5.75), Inches(5.4))
    card_i.fill.solid()
    card_i.fill.fore_color.rgb = C_CARD_LIGHT
    card_i.line.color.rgb = C_EMERALD_DARK

    tb_i = s14.shapes.add_textbox(Inches(7.0), Inches(1.5), Inches(5.35), Inches(5.1))
    tf_i = tb_i.text_frame
    tf_i.word_wrap = True
    p_it = tf_i.paragraphs[0]
    p_it.text = "OS 7 INVARIANTES DE INTEGRIDADE COMPUTACIONAL"
    p_it.font.bold = True
    p_it.font.size = Pt(12)
    p_it.font.color.rgb = C_EMERALD_DARK
    p_it.space_after = Pt(6)

    invariantes = [
        ("Invariante 1:", "RUSLE completa: perdaSolo <=> 5 fatores presentes <=> memória cálculo."),
        ("Invariante 2:", "Lista de permissão estrita: bloqueia vazamento de Phi_diag ou coordenadas."),
        ("Invariante 3:", "Campos estimados derivados rigorosamente de estados não medidos."),
        ("Invariante 4:", "Rastreabilidade orbital: exigência de PRODUCT_ID, motor e timestamp."),
        ("Invariante 5:", "Afirmação negativa fundiária: exige histórico sem match geográfico."),
        ("Invariante 6:", "Proibição de literais espúrios ('Custom', 'Bacia Local', etc.)."),
        ("Invariante 7:", "Detector de constante disfarçada: recusa colunas numéricas estáticas.")
    ]
    for i_tit, i_dsc in invariantes:
        p = tf_i.add_paragraph()
        r1 = p.add_run(); r1.text = f"{i_tit} "; r1.font.bold = True; r1.font.size = Pt(9.5); r1.font.color.rgb = C_EMERALD_DARK
        r2 = p.add_run(); r2.text = i_dsc; r2.font.size = Pt(9); r2.font.color.rgb = C_TEXT_DARK
        p.space_after = Pt(4)

    # =========================================================================
    # SLIDE 15: MODELO D VS MODELO P (DECISÃO D04)
    # =========================================================================
    s15 = prs.slides.add_slide(blank_layout)
    set_bg(s15)
    add_header(s15, "14. Segregação Temporal: Modelo D vs. Modelo P")
    add_footer(s15, 15)

    card_d = s15.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.75), Inches(5.3))
    card_d.fill.solid()
    card_d.fill.fore_color.rgb = C_CARD_LIGHT
    card_d.line.color.rgb = C_CYAN_LIGHT

    tb_d = s15.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(5.35), Inches(5.0))
    tf_d = tb_d.text_frame
    tf_d.word_wrap = True
    p_dt = tf_d.paragraphs[0]
    p_dt.text = "MODELO D — DETECÇÃO CONTEMPORÂNEA"
    p_dt.font.bold = True
    p_dt.font.size = Pt(13)
    p_dt.font.color.rgb = C_CYAN_DARK
    p_dt.space_after = Pt(8)

    pts_d = [
        ("Finalidade Operacional:", "Mapear feições de erosão laminar que JÁ se manifestaram visualmente no terreno (diagnóstico pericial contemporâneo)."),
        ("Extensão da Janela Temporal:", "Série temporal orbitando continuamente até a data exata do evento ou inspeção pericial (t0)."),
        ("Assinatura Biofísica:", "Detecta horizonte B exposto, BSI > 0.10, redução drástica de biomassa e empobrecimento em carbono orgânico."),
        ("Aplicação Prática:", "Perícia judicial ambiental, fiscalização agropecuária, apuração de responsabilidade por degradação e autuações.")
    ]
    for tit, dsc in pts_d:
        p = tf_d.add_paragraph()
        r1 = p.add_run(); r1.text = f"• {tit} "; r1.font.bold = True; r1.font.size = Pt(10); r1.font.color.rgb = C_CYAN_DARK
        r2 = p.add_run(); r2.text = dsc; r2.font.size = Pt(9.5); r2.font.color.rgb = C_TEXT_DARK
        p.space_after = Pt(8)

    card_p = s15.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.5), Inches(5.75), Inches(5.3))
    card_p.fill.solid()
    card_p.fill.fore_color.rgb = C_CARD_LIGHT
    card_p.line.color.rgb = C_EMERALD_MID

    tb_p = s15.shapes.add_textbox(Inches(7.0), Inches(1.6), Inches(5.35), Inches(5.0))
    tf_p = tb_p.text_frame
    tf_p.word_wrap = True
    p_pt = tf_p.paragraphs[0]
    p_pt.text = "MODELO P — PROGNÓSTICO PREDITIVO PREVENTIVO"
    p_pt.font.bold = True
    p_pt.font.size = Pt(13)
    p_pt.font.color.rgb = C_EMERALD_DARK
    p_pt.space_after = Pt(8)

    pts_p = [
        ("Finalidade Operacional:", "Prever o RISCO FUTURO de surgimento de erosão laminar antes que a feição física se manifeste em superfície."),
        ("Guarda Temporal Bienal (D04):", "Janela de guarda mandatória de 24 meses (2 anos) antes de t0 (Kaufman et al., 2012 / Embrapa Soja), eliminando data leakage."),
        ("Assinatura Biofísica:", "Identifica fraquezas estruturais de manejo histórico (ausência de rotação, baixa biomassa prévia, alta frequência de solo nu)."),
        ("Aplicação Prática:", "Planejamento conservacionista preditivo, crédito rural sustentável, subsídio para apólices de seguro agrícola e manejo preventivo de bacias.")
    ]
    for tit, dsc in pts_p:
        p = tf_p.add_paragraph()
        r1 = p.add_run(); r1.text = f"• {tit} "; r1.font.bold = True; r1.font.size = Pt(10); r1.font.color.rgb = C_EMERALD_DARK
        r2 = p.add_run(); r2.text = dsc; r2.font.size = Pt(9.5); r2.font.color.rgb = C_TEXT_DARK
        p.space_after = Pt(8)

    # =========================================================================
    # SLIDE 16: REFERÊNCIAS BIBLIOGRÁFICAS (ABNT PARTE 1)
    # =========================================================================
    s16 = prs.slides.add_slide(blank_layout)
    set_bg(s16)
    add_header(s16, "15. Referências Bibliográficas (Normas ABNT NBR 6023:2018) — Parte 1")
    add_footer(s16, 16)

    card_abnt1 = s16.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.4), Inches(11.733), Inches(5.4))
    card_abnt1.fill.solid()
    card_abnt1.fill.fore_color.rgb = C_CARD_LIGHT
    card_abnt1.line.color.rgb = C_BORDER_LIGHT

    tb_ab1 = s16.shapes.add_textbox(Inches(1.1), Inches(1.5), Inches(11.1), Inches(5.1))
    tf_ab1 = tb_ab1.text_frame
    tf_ab1.word_wrap = True

    refs_p1 = [
        "COELHO, M. R. et al. Erodibilidade dos solos do Brasil. Rio de Janeiro: Embrapa Solos, 2024. 38 p. (Documentos / Embrapa Solos, n. 246). Disponível em: http://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/1170044.",
        "CHEN, T.; GUESTRIN, C. XGBoost: A Scalable Tree Boosting System. In: ACM SIGKDD INTERNATIONAL CONFERENCE ON KNOWLEDGE DISCOVERY AND DATA MINING, 22., 2016, San Francisco. Proceedings [...]. New York: ACM, 2016. p. 785–794.",
        "DEMATTÊ, J. A. M. et al. Geospatial Soil Sensing System (GEOS3): A powerful data mining procedure to retrieve soil spectral reflectance from satellite images. Remote Sensing of Environment, v. 212, p. 161–175, 2018.",
        "DURIGON, V. L. et al. NDVI-based C-factor estimation for RUSLE in Brazilian watersheds. Revista Brasileira de Ciência do Solo, v. 38, n. 3, p. 726–734, 2014.",
        "KARYDAS, C. G.; PANAGOS, P. The G2 erosion model: month-time step assessments at regional scale. Environmental Research, v. 161, p. 115–124, 2018.",
        "KAUFMAN, S. et al. Leakage in data mining: formulation, detection, and avoidance. ACM Transactions on Knowledge Discovery from Data (TKDD), v. 6, n. 4, p. 1–21, 2012.",
        "LANDIS, J. R.; KOCH, G. G. The measurement of observer agreement for categorical data. Biometrics, v. 33, n. 1, p. 159–174, 1977."
    ]

    for ref in refs_p1:
        p = tf_ab1.add_paragraph() if tf_ab1.paragraphs[0].text else tf_ab1.paragraphs[0]
        p.text = f"• {ref}"
        p.font.size = Pt(10)
        p.font.color.rgb = C_TEXT_DARK
        p.space_after = Pt(10)

    # =========================================================================
    # SLIDE 17: REFERÊNCIAS BIBLIOGRÁFICAS (ABNT PARTE 2) E CONCLUSÕES
    # =========================================================================
    s17 = prs.slides.add_slide(blank_layout)
    set_bg(s17)
    add_header(s17, "16. Referências Bibliográficas (Normas ABNT NBR 6023:2018) — Parte 2")
    add_footer(s17, 17)

    card_abnt2 = s17.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.4), Inches(11.733), Inches(5.4))
    card_abnt2.fill.solid()
    card_abnt2.fill.fore_color.rgb = C_CARD_LIGHT
    card_abnt2.line.color.rgb = C_BORDER_LIGHT

    tb_ab2 = s17.shapes.add_textbox(Inches(1.1), Inches(1.5), Inches(11.1), Inches(5.1))
    tf_ab2 = tb_ab2.text_frame
    tf_ab2.word_wrap = True

    refs_p2 = [
        "CONGALTON, R. G.; GREEN, K. Assessing the accuracy of remotely sensed data: principles and practices. 3. ed. Boca Raton: CRC Press, 2019. 348 p.",
        "LUNDBERG, S. M.; LEE, S.-I. A Unified Approach to Interpreting Model Predictions. In: ADVANCES IN NEURAL INFORMATION PROCESSING SYSTEMS (NEURIPS 2017), 30., 2017, Long Beach. Proceedings [...]. Red Hook: Curran Associates, 2017. p. 4765–4774.",
        "MANNIGEL, E. et al. Fator erodibilidade de solos do estado de São Paulo. Revista Brasileira de Ciência do Solo, v. 26, n. 4, p. 1039–1049, 2002.",
        "RENARD, K. G. et al. Predicting soil erosion by water: a guide to conservation planning with the Revised Universal Soil Loss Equation (RUSLE). Washington, D.C.: United States Department of Agriculture, 1997. 404 p. (Agriculture Handbook, n. 703).",
        "ROBERTS, D. R. et al. Cross-validation strategies for data with temporal, spatial, or hierarchical structure. Ecography, v. 40, n. 8, p. 913–929, 2017.",
        "SAFANELLI, J. L.; DEMATTÊ, J. A. M. et al. Fine-scale soil mapping with Earth Observation data: a multiple geographic level comparison. Revista Brasileira de Ciência do Solo, v. 45, e0210080, p. 1–20, 2021.",
        "VRIELING, A. Satellite remote sensing for water erosion assessment: A review. Catena, v. 65, n. 1, p. 2–18, 2006.",
        "ZHU, Z.; WOODCOCK, C. E. Continuous change detection and classification of land cover using all available Landsat data. Remote Sensing of Environment, v. 144, p. 152–171, 2014."
    ]

    for ref in refs_p2:
        p = tf_ab2.add_paragraph() if tf_ab2.paragraphs[0].text else tf_ab2.paragraphs[0]
        p.text = f"• {ref}"
        p.font.size = Pt(10)
        p.font.color.rgb = C_TEXT_DARK
        p.space_after = Pt(10)

    # Salvar
    prs.save(caminho_saida)
    print(f"[OK] Apresentação PPTX salva com sucesso em: {caminho_saida}")

if __name__ == "__main__":
    caminho = "docs/Apresentacao_SAREL_PPGTCA_2026.pptx"
    if len(sys.argv) > 1:
        caminho = sys.argv[1]
    criar_apresentacao(caminho)
