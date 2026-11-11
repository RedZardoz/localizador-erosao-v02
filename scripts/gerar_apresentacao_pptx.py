# -*- coding: utf-8 -*-
"""
=============================================================================
GERADOR DA APRESENTAÇÃO SAREL v2.0 (POWERPOINT .PPTX)
Mestrado PPGTCA 2026 — Tecnologias Computacionais para o Agronegócio (UTFPR)
Pesquisa: Detecção Contemporânea de Erosão Laminar com Sensoriamento Remoto e XGBoost
Pesquisador: Luis Alfredo | Orientador: Prof. Dr. Claudio Leones Bazzi
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
C_AMBER_BG = RGBColor(254, 243, 199)      # Amber 100
C_ROSE_DARK = RGBColor(190, 18, 60)       # Rose 700
C_ROSE_BG = RGBColor(255, 228, 230)       # Rose 100

C_TEXT_DARK = RGBColor(15, 23, 42)        # Slate 900
C_TEXT_MUTED = RGBColor(71, 85, 105)      # Slate 600
C_TEXT_LIGHT = RGBColor(203, 213, 225)    # Slate 300
C_WHITE = RGBColor(255, 255, 255)

TOTAL_SLIDES = 14

def criar_apresentacao(caminho_saida):
    os.makedirs(os.path.dirname(caminho_saida), exist_ok=True)
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
        p_tit.font.size = Pt(19)
        p_tit.font.bold = True
        p_tit.font.color.rgb = C_WHITE

        # Linha inferior do header
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(1.13), Inches(13.333), Inches(0.04))
        line.fill.solid()
        line.fill.fore_color.rgb = C_EMERALD_MID
        line.line.color.rgb = C_EMERALD_MID

    def add_footer(slide, num_slide):
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(7.12), Inches(11.733), Inches(0.3))
        p = tb.text_frame.paragraphs[0]
        p.text = f"SAREL v2.0 • Sistema de Amostragem e Rotulagem para Erosão Laminar | UTFPR Medianeira | Slide {num_slide} de {TOTAL_SLIDES}"
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

    tb_c = s1.shapes.add_textbox(Inches(1.0), Inches(1.1), Inches(11.3), Inches(5.3))
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
    p2.text = "Detecção Contemporânea de Erosão Laminar na Bacia Hidrográfica do Paraná 3: Da Fundamentação Biofísica ao Desenho Amostral Selado"
    p2.font.size = Pt(16)
    p2.font.color.rgb = C_TEXT_LIGHT
    p2.space_after = Pt(28)

    p3 = tf_c.add_paragraph()
    p3.text = "Mestrando: Luis Alfredo Ferreira da Silva  •  Orientador: Prof. Dr. Claudio Leones Bazzi\nUniversidade Tecnológica Federal do Paraná (UTFPR) — Câmpus Medianeira\nÁrea de Estudo: Bacia do Paraná 3 (BP3), PR  •  Data: Novembro/2026"
    p3.font.size = Pt(11.5)
    p3.font.color.rgb = C_EMERALD_LIGHT

    # =========================================================================
    # SLIDE 2: BLOCO (1) - O PROBLEMA CIENTÍFICO E O CONTEXTO DA BP3
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_bg(s2)
    add_header(s2, "1. O Problema: Erosão Laminar Difusa e Subdetectada na Bacia do Paraná 3")
    add_footer(s2, 2)

    boxes_s2 = [
        ("O Fenômeno Difuso e Silencioso",
         "A erosão laminar desagrega partículas superficiais por impacto de gotas (splash) e as transporta por escoamento laminar raso. Ao contrário de voçorocas e ravinas, NÃO produz incisões topográficas evidentes em passagens orbitais isoladas, constituindo um processo sutil, contínuo e cronicamente subdetectado.",
         C_NAVY_DARK),
        ("A Degradação dos Horizontes Superficiais",
         "A lâmina superficial removida silenciosamente é exatamente a fração mais fértil do solo, rica em matéria orgânica, fósforo e nutrientes. A subdetecção mascara a perda gradual da capacidade produtiva da terra, levando a correções químicas paliativas que não estancam o empobrecimento pedológico.",
         C_EMERALD_DARK),
        ("O Mosaico Agrícola e Pedológico da BP3",
         "A Bacia do Paraná 3 combina agricultura intensiva altamente tecnificada (soja, milho e trigo) com um mosaico pedológico contrastante: solos basálticos estruturados (Latossolos/Nitossolos, 82,4% da área) intercalados com solos areníticos de extrema erodibilidade e fragilidade (Neossolos/Argissolos, 17,6% da área).",
         C_AMBER_DARK),
        ("Impacto Ambiental no Reservatório de Itaipu",
         "A erosão laminar na BP3 gera aporte constante de sedimentos finos e turbidez que assoreiam os tributários diretos do reservatório de Itaipu Binacional. Monitorar e detectar essas áreas antes da formação de ravinas é um imperativo econômico, agronômico e de segurança hídrica regional.",
         C_ROSE_DARK),
    ]

    for idx, (tit, txt, cor_topo) in enumerate(boxes_s2):
        col = idx % 2
        row = idx // 2
        x = Inches(0.8 + col * 5.95)
        y = Inches(1.45 + row * 2.7)
        card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.75), Inches(2.45))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        topo = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, Inches(5.75), Inches(0.42))
        topo.fill.solid()
        topo.fill.fore_color.rgb = cor_topo
        topo.line.color.rgb = cor_topo
        p_t = topo.text_frame.paragraphs[0]
        p_t.text = tit
        p_t.font.size = Pt(11.5)
        p_t.font.bold = True
        p_t.font.color.rgb = C_WHITE

        tb = s2.shapes.add_textbox(x + Inches(0.2), y + Inches(0.52), Inches(5.35), Inches(1.8))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = txt
        p.font.size = Pt(10)
        p.font.color.rgb = C_TEXT_DARK

    # =========================================================================
    # SLIDE 3: BLOCO (2) - POR QUE O SAREL EXISTE: A PERGUNTA DE PESQUISA
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_bg(s3)
    add_header(s3, "2. Por Que o SAREL Existe: Pergunta de Pesquisa e Três Requisitos Essenciais")
    add_footer(s3, 3)

    # Banner superior com a pergunta de pesquisa
    banner = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.35), Inches(11.733), Inches(1.15))
    banner.fill.solid()
    banner.fill.fore_color.rgb = C_MINT_BG
    banner.line.color.rgb = C_EMERALD_MID
    tb_b = s3.shapes.add_textbox(Inches(0.95), Inches(1.42), Inches(11.4), Inches(1.0))
    tf_b = tb_b.text_frame
    tf_b.word_wrap = True
    p_b0 = tf_b.paragraphs[0]
    p_b0.text = "A PERGUNTA CIENTÍFICA CENTRAL DA DISSERTAÇÃO:"
    p_b0.font.size = Pt(10)
    p_b0.font.bold = True
    p_b0.font.color.rgb = C_EMERALD_DARK
    p_b1 = tf_b.add_paragraph()
    p_b1.text = "“Um modelo supervisionado baseado em sensoriamento remoto orbital e aprendizado de máquina (XGBoost) é capaz de detectar feições de erosão laminar contemporânea com acurácia estatisticamente superior à linha de base física clássica da RUSLE?”"
    p_b1.font.size = Pt(12)
    p_b1.font.bold = True
    p_b1.font.color.rgb = C_NAVY_DARK

    # Três pilares essenciais que a literatura normalmente negligencia
    pilares = [
        ("1. Amostra Probabilística Rigorosa",
         "O que falta na literatura:",
         "Estudos comumente selecionam pontos de campo por conveniência, beira de estradas ou intuição subjetiva, gerando viés amostral severo e impossibilidade de generalização estatística.",
         "A solução no SAREL:",
         "Estratificação biofísica tridimensional em 18 estratos canônicos com sorteio formal e registro das probabilidades de inclusão (π_i) e pesos de Horvitz-Thompson (w_i = 1/π_i).",
         C_CYAN_DARK),
        ("2. Rótulo Humano Independente",
         "O que falta na literatura:",
         "Uso de índices orbitais para definir 'verdade de campo' de forma circular (ex.: usar NDVI para rotular e treinar modelo sobre NDVI), criando tautologias metodológicas.",
         "A solução no SAREL:",
         "Inspeção pericial centimétrica com ortofotos de VANT (2 cm) por múltiplos fotointérpretes independentes com aferição formal de concordância via Kappa de Cohen.",
         C_EMERALD_DARK),
        ("3. Avaliação Única em Held-Out Selado",
         "O que falta na literatura:",
         "Vazamento de dados (data leakage) e overfitting exploratório decorrentes de testes repetidos na mesma base de validação para 'garantir' métricas favoráveis (p-hacking).",
         "A solução no SAREL:",
         "Partição de teste com 33 polígonos mantida em cofre criptográfico sob cegamento duplo; aberta uma única vez para o confronto decisivo contra a RUSLE.",
         C_ROSE_DARK),
    ]

    for idx, (tit, l_sub1, l_txt1, l_sub2, l_txt2, cor) in enumerate(pilares):
        x = Inches(0.8 + idx * 3.98)
        y = Inches(2.65)
        card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(3.78), Inches(4.3))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        top_p = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, Inches(3.78), Inches(0.42))
        top_p.fill.solid()
        top_p.fill.fore_color.rgb = cor
        top_p.line.color.rgb = cor
        p_pt = top_p.text_frame.paragraphs[0]
        p_pt.text = tit
        p_pt.font.size = Pt(11)
        p_pt.font.bold = True
        p_pt.font.color.rgb = C_WHITE

        tb = s3.shapes.add_textbox(x + Inches(0.15), y + Inches(0.50), Inches(3.48), Inches(3.65))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = l_sub1
        p1.font.size = Pt(9.5)
        p1.font.bold = True
        p1.font.color.rgb = C_ROSE_DARK

        p2 = tf.add_paragraph()
        p2.text = l_txt1
        p2.font.size = Pt(9)
        p2.font.color.rgb = C_TEXT_DARK
        p2.space_after = Pt(10)

        p3 = tf.add_paragraph()
        p3.text = l_sub2
        p3.font.size = Pt(9.5)
        p3.font.bold = True
        p3.font.color.rgb = C_EMERALD_DARK

        p4 = tf.add_paragraph()
        p4.text = l_txt2
        p4.font.size = Pt(9)
        p4.font.color.rgb = C_TEXT_DARK

    # =========================================================================
    # SLIDE 4: BLOCO (3) - O MÉTODO EM QUATRO PASSOS DIDÁTICOS
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_bg(s4)
    add_header(s4, "3. O Método SAREL em Quatro Passos: Do Espaço Orbital à Validação em Campo")
    add_footer(s4, 4)

    passos = [
        ("Passo 1", "Delimitação e Elegibilidade Territorial",
         [
             "Recorte espacial exclusivo da Bacia do Paraná 3 (BP3, ~8.000 km²);",
             "Máscara agrícola ESA WorldCover (classes 30 e 40 com concordância entre anos);",
             "Domínio físico estrito de declividade: 3,0% a 20,0% (faixa onde a erosão laminar é o mecanismo físico dominante, excluindo várzeas planas e escarpamentos);",
             "Exclusão de áreas urbanas, corpos hídricos e vegetação nativa permanente."
         ], C_NAVY_DARK),
        ("Passo 2", "Medição das Três Dimensões Biofísicas",
         [
             "Declividade (Ŝ): calculada em resolução nativa de 30 m a partir do Copernicus DEM GLO-30;",
             "Frequência de Solo Nu (Ê): estimada via série temporal decenal Sentinel-2 L2A (2016–2026) sob máscara estrita de 5 testes biofísicos;",
             "Erodibilidade Pedológica (K̂): derivada da carta oficial de solos da Embrapa Solos (Doc. 246/2024 / Mannigel et al., 2002), particionada em 2 níveis de suscetibilidade."
         ], C_CYAN_DARK),
        ("Passo 3", "Estratificação e Sorteio Selado",
         [
             "Partição do espaço biofísico em 18 estratos canônicos (3 declividades × 3 frequências de solo nu × 2 erodibilidades pedológicas);",
             "Sorteio amostral pré-registrado com semente pública (20261110) e garantia formal de 8 invariantes matemáticos;",
             "Alocação balanceada de 67 polígonos de 5,02 ha (34 para treino e 33 para held-out de validação cega);",
             "Preservação rigorosa da não-tendenciosidade via pesos de Horvitz-Thompson."
         ], C_EMERALD_DARK),
        ("Passo 4", "Âncora de Campo e Treinamento Supervisionado",
         [
             "Levantamento aerofotogramétrico de alta resolução centimétrica com VANT (GSD ≤ 2 cm) sobre os polígonos sorteados;",
             "Fotointerpretação pericial independente de feições laminares e cálculo de concordância inter-intérpretes (Kappa);",
             "Treinamento do modelo supervisionado contemporâneo (Modelo D via XGBoost) com validação cruzada em blocos espaciais;",
             "Confronto cego definitivo contra a Linha de Base física analítica RUSLE."
         ], C_AMBER_DARK),
    ]

    for idx, (p_num, p_tit, p_itens, cor) in enumerate(passos):
        x = Inches(0.8 + idx * 2.98)
        y = Inches(1.5)
        card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(2.82), Inches(5.4))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        topo = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, Inches(2.82), Inches(0.7))
        topo.fill.solid()
        topo.fill.fore_color.rgb = cor
        topo.line.color.rgb = cor
        p_t0 = topo.text_frame.paragraphs[0]
        p_t0.text = p_num.upper()
        p_t0.font.size = Pt(9)
        p_t0.font.bold = True
        p_t0.font.color.rgb = C_EMERALD_LIGHT
        p_t1 = topo.text_frame.add_paragraph()
        p_t1.text = p_tit
        p_t1.font.size = Pt(10.5)
        p_t1.font.bold = True
        p_t1.font.color.rgb = C_WHITE

        tb = s4.shapes.add_textbox(x + Inches(0.12), y + Inches(0.8), Inches(2.58), Inches(4.4))
        tf = tb.text_frame
        tf.word_wrap = True
        for i_item, item in enumerate(p_itens):
            p = tf.add_paragraph() if i_item > 0 else tf.paragraphs[0]
            p.text = f"• {item}"
            p.font.size = Pt(9)
            p.font.color.rgb = C_TEXT_DARK
            p.space_after = Pt(8)

    # =========================================================================
    # SLIDE 5: BLOCO (4) - A MÁSCARA DE SOLO EXPOSTO (DEMATTÊ ET AL., 2018)
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_bg(s5)
    add_header(s5, "4. A Máscara de Solo Exposto: Conjunção de Cinco Testes (Demattê et al., 2018)")
    add_footer(s5, 5)

    # Alerta didático: Não é limiar univariado ingênuo
    alerta_card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.35), Inches(11.733), Inches(0.95))
    alerta_card.fill.solid()
    alerta_card.fill.fore_color.rgb = C_MINT_BG
    alerta_card.line.color.rgb = C_EMERALD_MID
    tb_ac = s5.shapes.add_textbox(Inches(0.95), Inches(1.42), Inches(11.4), Inches(0.8))
    tf_ac = tb_ac.text_frame
    tf_ac.word_wrap = True
    p_ac0 = tf_ac.paragraphs[0]
    p_ac0.text = "RIGOR METODOLÓGICO: PROIBIÇÃO DE LIMIAR UNIVARIADO ISOLADO (NDVI ≤ 0,25)"
    p_ac0.font.size = Pt(10)
    p_ac0.font.bold = True
    p_ac0.font.color.rgb = C_EMERALD_DARK
    p_ac1 = tf_ac.add_paragraph()
    p_ac1.text = "O SAREL não adota NDVI ≤ 0,25 isolado. A identificação de solo exposto decorre da CONJUNÇÃO ESTRITA DE CINCO TESTES simultâneos baseados na arquitetura GEOS3 (Demattê et al., 2018, RSE), transposta de Landsat 5 TM para o sensor Sentinel-2 MSI L2A."
    p_ac1.font.size = Pt(10)
    p_ac1.font.color.rgb = C_NAVY_DARK

    testes_mascara = [
        ("Teste 1: Faixa de NDVI", "0,00 ≤ NDVI ≤ 0,25", "Exclui vegetação viva ativa (NDVI > 0,25) e corpos hídricos ou sombras profundas (NDVI < 0,00). Banda B8 (NIR) e Banda B4 (Vermelho).", C_NAVY_DARK),
        ("Teste 2: Faixa de NBR2", "0,00 ≤ NBR2 ≤ 0,075", "O FILTRO CRÍTICO NO SWIR: separa solo mineral exposto de palhada seca (SPD). Selecionado por correlação canônica de 0,93 em Demattê et al. (2018).", C_EMERALD_DARK),
        ("Teste 3: Inclinação Visível 1", "B4 - B3 ≥ 0 (Vermelho ≥ Verde)", "Confirma assinatura espectral típica de solos minerais oxidados (aumento característico da reflectância do verde ao vermelho).", C_CYAN_DARK),
        ("Teste 4: Inclinação Visível 2", "B3 - B2 ≥ 0 (Verde ≥ Azul)", "Garante gradiente positivo contínuo no visível, eliminando alvos artificiais, asfalto ou artefatos de nuvem residual.", C_CYAN_DARK),
        ("Teste 5: Qualidade da Cena (SCL)", "SCL ∈ {4, 5, 7}", "Máscara de qualidade atmosférica L2A: rejeita rigorosamente nuvens densas, cirrus translúcidos, sombras e bordas corrompidas.", C_ROSE_DARK),
    ]

    for idx, (t_nom, t_form, t_desc, cor) in enumerate(testes_mascara):
        x = Inches(0.8 + idx * 2.38)
        y = Inches(2.45)
        card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(2.25), Inches(3.2))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        top_t = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, Inches(2.25), Inches(0.55))
        top_t.fill.solid()
        top_t.fill.fore_color.rgb = cor
        top_t.line.color.rgb = cor
        p_tt = top_t.text_frame.paragraphs[0]
        p_tt.text = t_nom
        p_tt.font.size = Pt(9.5)
        p_tt.font.bold = True
        p_tt.font.color.rgb = C_WHITE

        tb = s5.shapes.add_textbox(x + Inches(0.1), y + Inches(0.65), Inches(2.05), Inches(2.4))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = t_form
        p1.font.size = Pt(10)
        p1.font.bold = True
        p1.font.color.rgb = cor
        p1.space_after = Pt(8)

        p2 = tf.add_paragraph()
        p2.text = t_desc
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = C_TEXT_DARK

    # Nota de Lastro Epistemológico (o que sustenta e não sustenta)
    nota_card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.8), Inches(11.733), Inches(1.15))
    nota_card.fill.solid()
    nota_card.fill.fore_color.rgb = C_CARD_LIGHT
    nota_card.line.color.rgb = C_BORDER_LIGHT
    tb_n = s5.shapes.add_textbox(Inches(0.95), Inches(5.85), Inches(11.4), Inches(1.0))
    tf_n = tb_n.text_frame
    tf_n.word_wrap = True
    pn0 = tf_n.paragraphs[0]
    pn0.text = "DECLARAÇÃO DA NORMA DE LASTRO (Demattê et al., 2018):"
    pn0.font.size = Pt(9.5)
    pn0.font.bold = True
    pn0.font.color.rgb = C_NAVY_DARK
    pn1 = tf_n.add_paragraph()
    pn1.text = "• O que sustenta: A formulação da máscara de solo exposto GEOS3 com NDVI [0; 0,25], NBR2 [0; 0,075] e gradientes visuais positivos.\n• O que NÃO sustenta: Não foi calibrada sobre Sentinel-2 MSI (mas sim Landsat 5 TM em SP); não contém o índice VNSIR (pertence a Demattê et al., 2020); o valor 0,25 não é corte isolado. A transposição para Sentinel-2 MSI L2A é hipótese de pesquisa formal declarada pelo SAREL."
    pn1.font.size = Pt(8.5)
    pn1.font.color.rgb = C_TEXT_MUTED

    # =========================================================================
    # SLIDE 6: BLOCO (4) DIDÁTICO - POR QUE O NBR2 IMPORTA (SWIR VS PALHADA)
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_bg(s6)
    add_header(s6, "5. Por Que o NBR2 Importa: A Separação Espectral Entre Palhada e Solo Mineral")
    add_footer(s6, 6)

    # Subtítulo explicativo
    tb_sub = s6.shapes.add_textbox(Inches(0.8), Inches(1.25), Inches(11.733), Inches(0.5))
    p_sub = tb_sub.text_frame.paragraphs[0]
    p_sub.text = "O NDVI sozinho confunde resíduo agrícola (palhada de Plantio Direto) com solo exposto; a diferenciação física reside nas bandas de SWIR."
    p_sub.font.size = Pt(11)
    p_sub.font.bold = True
    p_sub.font.color.rgb = C_EMERALD_DARK

    # Painel da Esquerda: A Falácia do NDVI
    p_esq = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.75), Inches(5.1))
    p_esq.fill.solid()
    p_esq.fill.fore_color.rgb = C_CARD_LIGHT
    p_esq.line.color.rgb = C_ROSE_DARK

    topo_e = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.75), Inches(0.5))
    topo_e.fill.solid()
    topo_e.fill.fore_color.rgb = C_ROSE_DARK
    topo_e.line.color.rgb = C_ROSE_DARK
    pe_t = topo_e.text_frame.paragraphs[0]
    pe_t.text = "A FALÁCIA DO NDVI ISOLADO (Vermelho + NIR)"
    pe_t.font.size = Pt(11.5)
    pe_t.font.bold = True
    pe_t.font.color.rgb = C_WHITE

    tb_e = s6.shapes.add_textbox(Inches(1.0), Inches(2.4), Inches(5.35), Inches(4.3))
    tfe = tb_e.text_frame
    tfe.word_wrap = True

    itens_e = [
        ("O que o NDVI mede:", "O contraste entre absorção pela clorofila ativa (B4 Vermelho, ~665 nm) e espalhamento pelo mesofilo foliar (B8 NIR, ~842 nm)."),
        ("O comportamento da palhada seca:", "Resíduos culturais de colheitas anteriores em Sistema Plantio Direto (palhada de soja, milho ou trigo) NÃO possuem atividade fotossintética nem clorofila viva."),
        ("A queda do NDVI na palhada:", "Com a senescência e dessecação celular, o NDVI da palhada despenca para a faixa de 0,10 a 0,25 — exatamente a mesma faixa espectral do solo mineral descoberto!"),
        ("O ERRO GRAVE decorrente:", "Se o modelo utilizar 'NDVI ≤ 0,25' isolado, lavouras perfeitamente protegidas por densa cobertura morta serão computadas erroneamente como 'solo exposto degradado', explodindo a taxa de falsos positivos de erosão!")
    ]
    for i, (tit, txt) in enumerate(itens_e):
        p = tfe.add_paragraph() if i > 0 else tfe.paragraphs[0]
        p.text = f"• {tit} "
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = C_ROSE_DARK
        r = p.add_run()
        r.text = txt
        r.font.bold = False
        r.font.color.rgb = C_TEXT_DARK
        p.space_after = Pt(10)

    # Painel da Direita: A Solução Física via NBR2
    p_dir = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.78), Inches(1.8), Inches(5.75), Inches(5.1))
    p_dir.fill.solid()
    p_dir.fill.fore_color.rgb = C_CARD_LIGHT
    p_dir.line.color.rgb = C_EMERALD_DARK

    topo_d = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.78), Inches(1.8), Inches(5.75), Inches(0.5))
    topo_d.fill.solid()
    topo_d.fill.fore_color.rgb = C_EMERALD_DARK
    topo_d.line.color.rgb = C_EMERALD_DARK
    pd_t = topo_d.text_frame.paragraphs[0]
    pd_t.text = "A SOLUÇÃO FÍSICA VIA NBR2 NO SWIR (Demattê; Daughtry; Hively)"
    pd_t.font.size = Pt(11.5)
    pd_t.font.bold = True
    pd_t.font.color.rgb = C_WHITE

    tb_d = s6.shapes.add_textbox(Inches(6.98), Inches(2.4), Inches(5.35), Inches(4.3))
    tfd = tb_d.text_frame
    tfd.word_wrap = True

    itens_d = [
        ("A absorção de celulose e lignina:", "Resíduos vegetais secos exibem feições de absorção diagnósticas características na faixa do infravermelho de ondas curtas (SWIR2, ~2.100 a 2.300 nm; Banda B12 do Sentinel-2; Daughtry et al., 2001, 2004)."),
        ("A assinatura do solo mineral:", "O solo mineral desnudo apresenta curva espectral suavemente ascendente e reflectância equilibrada entre SWIR1 (B11, ~1.610 nm) e SWIR2 (B12, ~2.190 nm)."),
        ("A formulação do NBR2:", "NBR2 = (B11 - B12) / (B11 + B12). A presença de resíduos celulósicos eleva expressivamente o valor de NBR2 para patamares superiores a 0,075 (Hively et al., 2021)."),
        ("O filtro de exclusão no SAREL:", "O limiar estrito 0,00 ≤ NBR2 ≤ 0,075 rejeita toda a palhada seca e retém com altíssima fidelidade biofísica exclusivamente o solo mineral desprotegido, garantindo robustez incomparável à frequência Ê!")
    ]
    for i, (tit, txt) in enumerate(itens_d):
        p = tfd.add_paragraph() if i > 0 else tfd.paragraphs[0]
        p.text = f"• {tit} "
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = C_EMERALD_DARK
        r = p.add_run()
        r.text = txt
        r.font.bold = False
        r.font.color.rgb = C_TEXT_DARK
        p.space_after = Pt(10)

    # =========================================================================
    # SLIDE 7: BLOCO (5) - O QUE FOI MEDIDO: 677 CANDIDATOS E DISTRIBUIÇÃO DE E
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_bg(s7)
    add_header(s7, "6. O Que Foi Medido: 677 Candidatos, 148 a 1.011 Observações e Tercis da Bacia")
    add_footer(s7, 7)

    cards_s7 = [
        ("O Universo de Candidatos na BP3",
         "677", "candidatos espectrais válidos",
         [
             "Candidatos identificados após filtragem de elegibilidade territorial (uso agrícola WorldCover 30/40 e declividade 3% a 20%);",
             "Série histórica decenal completa do Sentinel-2 L2A (2016–2026);",
             "Densidade temporal robusta: 148 a 1.011 observações válidas por ponto (média de 246 passagens limpas de nuvem);",
             "Guarda D11.2 estritamente cumprida: ZERO pontos sob regime curto (n < 12), assegurando erro padrão mínimo na frequência Ê."
         ], C_NAVY_DARK),
        ("Distribuição Empírica da Frequência de Solo Nu (Ê)",
         "T1 = 0,0116 | T2 = 0,0490", "tercis medidos na bacia",
         [
             "Ê mede a fração temporal em que o solo passa na máscara de 5 testes (solo mineral verdadeiramente exposto);",
             "Tercil 1 (t1 = 0,0116): 1,16% do tempo com solo nu (baixa frequência de exposição; solo protegido por SPD consolidado);",
             "Tercil 2 (t2 = 0,0490): 4,90% do tempo com solo nu (média frequência de exposição);",
             "Classes biofísicas: Ê1 ≤ 0,0116; 0,0116 < Ê2 ≤ 0,0490; Ê3 > 0,0490."
         ], C_EMERALD_DARK),
        ("Declividade (Ŝ) e Erodibilidade (K̂)",
         "18 Estratos Canônicos", "espaço amostral tridimensional",
         [
             "Declividade (Ŝ): Tercil 1 = 5,12%; Tercil 2 = 8,46% dentro do domínio de 3,0% a 20,0% (Ŝ1 ≤ 5,12%; Ŝ2: 5,12% a 8,46%; Ŝ3 > 8,46%);",
             "Erodibilidade (K̂): Nível 1 ≤ 0,0285 (Latossolos/Nitossolos, 82,4% da bacia); Nível 2 ≥ 0,0300 Mg h MJ⁻¹ mm⁻¹ (Neossolos/Argissolos, 17,6% da bacia, 23,7% da área elegível);",
             "Espaço fatorial completo: 3 classes de Ŝ × 3 classes de Ê × 2 classes de K̂ = 18 estratos biofísicos representativos."
         ], C_CYAN_DARK),
    ]

    for idx, (tit, grande, sub_g, itens, cor) in enumerate(cards_s7):
        x = Inches(0.8 + idx * 3.98)
        y = Inches(1.45)
        card = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(3.78), Inches(5.5))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        top_c = s7.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, Inches(3.78), Inches(0.55))
        top_c.fill.solid()
        top_c.fill.fore_color.rgb = cor
        top_c.line.color.rgb = cor
        p_ct = top_c.text_frame.paragraphs[0]
        p_ct.text = tit
        p_ct.font.size = Pt(10.5)
        p_ct.font.bold = True
        p_ct.font.color.rgb = C_WHITE

        # Destaque numérico
        tb_g = s7.shapes.add_textbox(x + Inches(0.15), y + Inches(0.65), Inches(3.48), Inches(1.1))
        tfg = tb_g.text_frame
        tfg.word_wrap = True
        pg0 = tfg.paragraphs[0]
        pg0.text = grande
        pg0.font.size = Pt(17 if len(grande) > 10 else 24)
        pg0.font.bold = True
        pg0.font.color.rgb = cor
        pg1 = tfg.add_paragraph()
        pg1.text = sub_g.upper()
        pg1.font.size = Pt(8.5)
        pg1.font.bold = True
        pg1.font.color.rgb = C_TEXT_MUTED

        tb = s7.shapes.add_textbox(x + Inches(0.15), y + Inches(1.8), Inches(3.48), Inches(3.5))
        tf = tb.text_frame
        tf.word_wrap = True
        for i_item, item in enumerate(itens):
            p = tf.add_paragraph() if i_item > 0 else tf.paragraphs[0]
            p.text = f"• {item}"
            p.font.size = Pt(8.8)
            p.font.color.rgb = C_TEXT_DARK
            p.space_after = Pt(8)

    # =========================================================================
    # SLIDE 8: BLOCO (6) - O DESENHO AMOSTRAL (67 POLÍGONOS DE 72 NOMINAIS)
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_bg(s8)
    add_header(s8, "7. O Desenho Amostral: 67 Polígonos de Alta Resolução e Partição Selada")
    add_footer(s8, 8)

    cards_s8 = [
        ("Dimensões do Sorteio Amostral",
         [
             "Meta nominal teórica: 72 polígonos (18 estratos × 4 candidatos/estrato);",
             "Alocação realizada definitiva: 67 polígonos sorteados cobrindo 336,34 ha na Bacia do Paraná 3;",
             "Suporte espacial nativo: raio de 126,4 m por sítio (área unitária de 5,02 ha, compatível com o plano padrão de voo de VANT);",
             "Segregação pré-registrada: 34 polígonos para Treino e 33 polígonos para Held-Out (validação cega e independente)."
         ], C_NAVY_DARK),
        ("Os Quatro Estratos em Regime de Censo",
         [
             "Por limitação física de área nos solos frágeis (K̂ = 2), 4 estratos não possuem candidatos suficientes para seleção com reservas e foram alocados em censo exaustivo (nh = Nh, π_i = 1):",
             "• E_1_2_2 (Ŝ1 × Ê2 × K̂2): Nh = 3, nh = 3 (2 treino / 1 teste)",
             "• E_2_2_2 (Ŝ2 × Ê2 × K̂2): Nh = 4, nh = 4 (2 treino / 2 teste)",
             "• E_2_3_2 (Ŝ2 × Ê3 × K̂2): Nh = 4, nh = 4 (2 treino / 2 teste)",
             "• E_3_2_2 (Ŝ3 × Ê2 × K̂2): Nh = 4, nh = 4 (2 treino / 2 teste)",
             "Nesses estratos, não há suplentes; todos os candidatos existentes foram integrados à amostra."
         ], C_AMBER_DARK),
        ("Garantia de Horvitz-Thompson",
         [
             "Amostragem estratificada desproporcional sem reposição;",
             "Probabilidade de inclusão registrada formalmente para cada sítio: π_i = nh / Nh nos estratos amostrados; π_i = 1 nos estratos em censo;",
             "Peso de expansão populacional associado: wi = 1 / π_i;",
             "Invariante formal de Horvitz-Thompson: π_i × wi = 1 rigorosamente satisfeito para todos os 67 polígonos;",
             "Garante que estimadores de acurácia populacional na bacia sejam estritamente não-tendenciosos (Cochran, 1977)."
         ], C_EMERALD_DARK),
    ]

    for idx, (tit, itens, cor) in enumerate(cards_s8):
        x = Inches(0.8 + idx * 3.98)
        y = Inches(1.45)
        card = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(3.78), Inches(5.5))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        top_c = s8.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, Inches(3.78), Inches(0.55))
        top_c.fill.solid()
        top_c.fill.fore_color.rgb = cor
        top_c.line.color.rgb = cor
        p_ct = top_c.text_frame.paragraphs[0]
        p_ct.text = tit
        p_ct.font.size = Pt(10.5)
        p_ct.font.bold = True
        p_ct.font.color.rgb = C_WHITE

        tb = s8.shapes.add_textbox(x + Inches(0.15), y + Inches(0.7), Inches(3.48), Inches(4.6))
        tf = tb.text_frame
        tf.word_wrap = True
        for i_item, item in enumerate(itens):
            p = tf.add_paragraph() if i_item > 0 else tf.paragraphs[0]
            p.text = item if item.startswith("•") else f"• {item}"
            p.font.size = Pt(9.2)
            p.font.color.rgb = C_TEXT_DARK
            p.space_after = Pt(8)

    # =========================================================================
    # SLIDE 9: BLOCO (6) DIDÁTICO - O ESTRATO VAZIO COMO ACHADO BIOFÍSICO
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_bg(s9)
    add_header(s9, "8. O Estrato Vazio (E_1_3_2): Achado Biofísico da Bacia, Não Falha Metodológica")
    add_footer(s9, 9)

    # Banner superior
    top_b = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.35), Inches(11.733), Inches(0.95))
    top_b.fill.solid()
    top_b.fill.fore_color.rgb = C_MINT_BG
    top_b.line.color.rgb = C_EMERALD_MID
    tb_tb = s9.shapes.add_textbox(Inches(0.95), Inches(1.42), Inches(11.4), Inches(0.8))
    tf_tb = tb_tb.text_frame
    tf_tb.word_wrap = True
    ptb0 = tf_tb.paragraphs[0]
    ptb0.text = "O DESENHO AMOSTRAL ENCONTROU UM LIMITE REAL DA PAISAGEM E O DECLAROU COM TRANSPARÊNCIA"
    ptb0.font.size = Pt(10)
    ptb0.font.bold = True
    ptb0.font.color.rgb = C_EMERALD_DARK
    ptb1 = tf_tb.add_paragraph()
    ptb1.text = "A célula E_1_3_2 (Relevo Suave × Alta Exposição de Solo × Alta Erodibilidade Pedológica) possui ZERO polígonos sorteados (Nh = 0). Longe de representar uma falha, isso revela um padrão biofísico autêntico da agricultura na Bacia do Paraná 3."
    ptb1.font.size = Pt(10)
    ptb1.font.color.rgb = C_NAVY_DARK

    # Painel Esquerdo: A Evidência Numérica
    p_num = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(2.45), Inches(5.75), Inches(4.5))
    p_num.fill.solid()
    p_num.fill.fore_color.rgb = C_CARD_LIGHT
    p_num.line.color.rgb = C_BORDER_LIGHT

    top_pn = s9.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(2.45), Inches(5.75), Inches(0.45))
    top_pn.fill.solid()
    top_pn.fill.fore_color.rgb = C_CYAN_DARK
    top_pn.line.color.rgb = C_CYAN_DARK
    ppn_t = top_pn.text_frame.paragraphs[0]
    ppn_t.text = "A EVIDÊNCIA QUANTITATIVA DO TERRENO"
    ppn_t.font.size = Pt(11)
    ppn_t.font.bold = True
    ppn_t.font.color.rgb = C_WHITE

    tb_pn = s9.shapes.add_textbox(Inches(1.0), Inches(3.05), Inches(5.35), Inches(3.7))
    tf_pn = tb_pn.text_frame
    tf_pn.word_wrap = True
    itens_evidencia = [
        ("A combinação teórica do estrato:", "Declividade suave (Ŝ1 ≤ 5,12%) combinada com solo arenítico frágil (K̂2 ≥ 0,0300) e alta frequência decenal de solo exposto (Ê3 > 0,0490)."),
        ("A raridade territorial na bacia:", "Em todo o recorte geográfico da BP3, existem apenas NOVE candidatos na combinação conjunta de relevo plano e solo de alta erodibilidade (Ŝ1 × K̂2)."),
        ("O valor máximo medido de Ê:", "Entre todos os 9 candidatos existentes, a maior frequência temporal de solo exposto registrada ao longo dos 10 anos de série orbital foi de apenas Ê = 0,0331."),
        ("O diagnóstico irrefutável:", "Como 0,0331 < 0,0490, NENHUM candidato dessa classe alcança o limiar do tercil superior Ê3. Portanto, o estrato E_1_3_2 é genuinamente vazio na natureza (Nh = 0, nh = 0)!")
    ]
    for i, (t, c) in enumerate(itens_evidencia):
        p = tf_pn.add_paragraph() if i > 0 else tf_pn.paragraphs[0]
        p.text = f"• {t} "
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = C_CYAN_DARK
        r = p.add_run()
        r.text = c
        r.font.bold = False
        r.font.color.rgb = C_TEXT_DARK
        p.space_after = Pt(10)

    # Painel Direito: A Explicação Agronômica e Epistemológica
    p_agro = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.78), Inches(2.45), Inches(5.75), Inches(4.5))
    p_agro.fill.solid()
    p_agro.fill.fore_color.rgb = C_CARD_LIGHT
    p_agro.line.color.rgb = C_BORDER_LIGHT

    top_pa = s9.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.78), Inches(2.45), Inches(5.75), Inches(0.45))
    top_pa.fill.solid()
    top_pa.fill.fore_color.rgb = C_EMERALD_DARK
    top_pa.line.color.rgb = C_EMERALD_DARK
    ppa_t = top_pa.text_frame.paragraphs[0]
    ppa_t.text = "A JUSTIFICATIVA AGRONÔMICA E O VALOR DO RIGOR"
    ppa_t.font.size = Pt(11)
    ppa_t.font.bold = True
    ppa_t.font.color.rgb = C_WHITE

    tb_pa = s9.shapes.add_textbox(Inches(6.98), Inches(3.05), Inches(5.35), Inches(3.7))
    tf_pa = tb_pa.text_frame
    tf_pa.word_wrap = True
    itens_agro = [
        ("Manejo conservacionista em solo frágil:", "Em terrenos planos sobre solos de extrema suscetibilidade à erosão (Neossolos/Argissolos), os produtores da BP3 mantêm Sistema Plantio Direto permanente e cobertura morta ininterrupta para viabilizar a agricultura."),
        ("Proteção mecânica contínua:", "O solo mineral simplesmente não permanece descoberto por períodos prolongados; a palhada protetora está presente durante todo o ano, refletida na ausência de observações sob a máscara de solo exposto."),
        ("O valor epistemológico da honestidade:", "Uma abordagem ingênua tentaria 'forçar' a ocupação da célula com aproximações ad-hoc ou pontos fabricados. O SAREL declara o estrato vazio formalmente, honrando a realidade biofísica da bacia."),
        ("Conclusão para a Banca:", "O método funcionou perfeitamente: diagnosticou com fidelidade que na BP3 não há lavouras planas em solo frágil sujeitas a exposição crônica. Isso é ciência, não falha!")
    ]
    for i, (t, c) in enumerate(itens_agro):
        p = tf_pa.add_paragraph() if i > 0 else tf_pa.paragraphs[0]
        p.text = f"• {t} "
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = C_EMERALD_DARK
        r = p.add_run()
        r.text = c
        r.font.bold = False
        r.font.color.rgb = C_TEXT_DARK
        p.space_after = Pt(10)

    # =========================================================================
    # SLIDE 10: BLOCO (7) - COMO SE GARANTE QUE O RESULTADO É HONESTO
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_bg(s10)
    add_header(s10, "9. Governança e Blindagem: Como se Garante a Honestidade dos Resultados")
    add_footer(s10, 10)

    blindagens = [
        ("Semente Pré-registrada (20261110)",
         "A semente do gerador pseudo-aleatório foi definida formalmente e registrada antes do sorteio. Impede qualquer tentativa de 'resortear' a amostra até encontrar polígonos convenientes ou próximos a áreas conhecidas.",
         C_NAVY_DARK),
        ("Os 8 Invariantes Formais do Selo",
         "O sorteio é travado por 8 testes automáticos de integridade (INV_1 a INV_8): hashes SHA-256 dos candidatos de entrada e saída, unicidade dos polígonos, contagem exata por estrato e invariante de Horvitz-Thompson.",
         C_CYAN_DARK),
        ("Cegamento por Distribuição (D16 / B+D)",
         "A equipe de campo que operará o drone e os peritos que farão a fotointerpretação recebem apenas as coordenadas de voo, SEM qualquer identificação do estrato biofísico e SEM saber quais polígonos pertencem ao treino e quais ao teste.",
         C_EMERALD_DARK),
        ("Avaliação Única em Held-Out Selado",
         "Os 33 polígonos da partição de teste estão lacrados em cofre criptográfico; serão abertos uma única vez para confronto final contra a RUSLE, eliminando data leakage e mineração exploratória de hiperparâmetros.",
         C_ROSE_DARK),
    ]

    for idx, (tit, txt, cor) in enumerate(blindagens):
        col = idx % 2
        row = idx // 2
        x = Inches(0.8 + col * 5.95)
        y = Inches(1.45 + row * 2.7)
        card = s10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.75), Inches(2.45))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        topo = s10.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, Inches(5.75), Inches(0.42))
        topo.fill.solid()
        topo.fill.fore_color.rgb = cor
        topo.line.color.rgb = cor
        p_t = topo.text_frame.paragraphs[0]
        p_t.text = tit
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = C_WHITE

        tb = s10.shapes.add_textbox(x + Inches(0.2), y + Inches(0.55), Inches(5.35), Inches(1.75))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = txt
        p.font.size = Pt(10)
        p.font.color.rgb = C_TEXT_DARK

    # =========================================================================
    # SLIDE 11: BLOCO (8) - O QUE AINDA NÃO FOI FEITO (TRANSPARÊNCIA TOTAL)
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_bg(s11)
    add_header(s11, "10. Transparência Científica: O Que Já Foi Realizado e O Que Falta Fazer")
    add_footer(s11, 11)

    # Banner superior
    top_banner = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.35), Inches(11.733), Inches(0.85))
    top_banner.fill.solid()
    top_banner.fill.fore_color.rgb = C_MINT_BG
    top_banner.line.color.rgb = C_EMERALD_MID
    tb_tb11 = s11.shapes.add_textbox(Inches(0.95), Inches(1.42), Inches(11.4), Inches(0.7))
    tf_tb11 = tb_tb11.text_frame
    tf_tb11.word_wrap = True
    ptb0_11 = tf_tb11.paragraphs[0]
    ptb0_11.text = "DECLARAR COM EXATIDÃO O QUE FALTA É DEMONSTRAÇÃO DE FORÇA E MATURIDADE METODOLÓGICA"
    ptb0_11.font.size = Pt(10)
    ptb0_11.font.bold = True
    ptb0_11.font.color.rgb = C_EMERALD_DARK
    ptb1_11 = tf_tb11.add_paragraph()
    ptb1_11.text = "O projeto encontra-se na fase de conclusão do arcabouço preparatório, governança amostral e auditoria pré-registrada. NENHUM DADO DE CAMPO OU RESULTADO DE MODELO EXISTE AINDA."
    ptb1_11.font.size = Pt(9.5)
    ptb1_11.font.color.rgb = C_NAVY_DARK

    # Painel Esquerdo: Concluído
    p_ok = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(2.35), Inches(5.75), Inches(4.6))
    p_ok.fill.solid()
    p_ok.fill.fore_color.rgb = C_CARD_LIGHT
    p_ok.line.color.rgb = C_BORDER_LIGHT

    top_ok = s11.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(2.35), Inches(5.75), Inches(0.45))
    top_ok.fill.solid()
    top_ok.fill.fore_color.rgb = C_EMERALD_DARK
    top_ok.line.color.rgb = C_EMERALD_DARK
    pok_t = top_ok.text_frame.paragraphs[0]
    pok_t.text = "O QUE JÁ ESTÁ CONCLUÍDO E AUDITADO"
    pok_t.font.size = Pt(11)
    pok_t.font.bold = True
    pok_t.font.color.rgb = C_WHITE

    tb_ok = s11.shapes.add_textbox(Inches(1.0), Inches(2.95), Inches(5.35), Inches(3.8))
    tf_ok = tb_ok.text_frame
    tf_ok.word_wrap = True
    itens_ok = [
        "Fundamentação epistemológica completa e conformidade com a Norma de Lastro;",
        "Ingestão e processamento de série temporal decenal Sentinel-2 L2A (677 candidatos na BP3);",
        "Implementação da máscara de solo exposto de 5 testes (GEOS3 / Demattê et al., 2018);",
        "Estratificação biofísica 3D em 18 estratos com tercis empíricos da bacia;",
        "Sorteio amostral selado com semente pública (20261110) e integridade criptográfica verificada;",
        "Definição formal dos 67 polígonos amostrais e segregação cega de 34 treino / 33 teste."
    ]
    for i, it in enumerate(itens_ok):
        p = tf_ok.add_paragraph() if i > 0 else tf_ok.paragraphs[0]
        p.text = f"✓ {it}"
        p.font.size = Pt(9.5)
        p.font.color.rgb = C_TEXT_DARK
        p.space_after = Pt(8)

    # Painel Direito: O Que Falta
    p_pend = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.78), Inches(2.35), Inches(5.75), Inches(4.6))
    p_pend.fill.solid()
    p_pend.fill.fore_color.rgb = C_CARD_LIGHT
    p_pend.line.color.rgb = C_BORDER_LIGHT

    top_pend = s11.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.78), Inches(2.35), Inches(5.75), Inches(0.45))
    top_pend.fill.solid()
    top_pend.fill.fore_color.rgb = C_AMBER_DARK
    top_pend.line.color.rgb = C_AMBER_DARK
    ppend_t = top_pend.text_frame.paragraphs[0]
    ppend_t.text = "O QUE AINDA NÃO FOI FEITO (TRABALHO FUTURO)"
    ppend_t.font.size = Pt(11)
    ppend_t.font.bold = True
    ppend_t.font.color.rgb = C_WHITE

    tb_pend = s11.shapes.add_textbox(Inches(6.98), Inches(2.95), Inches(5.35), Inches(3.8))
    tf_pend = tb_pend.text_frame
    tf_pend.word_wrap = True
    itens_pend = [
        "Campanha de Campo com VANT: sobrevoos centimétricos sobre os 67 polígonos;",
        "Fotointerpretação Pericial Independente: rotulação pericial com cálculo de concordância Kappa de Cohen;",
        "Treinamento do Modelo Supervisionado Contemporâneo (Modelo D via XGBoost);",
        "Avaliação Única contra a Linha de Base RUSLE no held-out selado (33 polígonos);",
        "Modelo P (Predição Bienal): o modelo prospectivo com corte de 24 meses foi especificado formalmente, mas encontra-se pausado por emenda formal (Emenda D04), priorizando a detecção contemporânea (Modelo D)."
    ]
    for i, it in enumerate(itens_pend):
        p = tf_pend.add_paragraph() if i > 0 else tf_pend.paragraphs[0]
        p.text = f"⏳ {it}"
        p.font.size = Pt(9.5)
        p.font.color.rgb = C_TEXT_DARK
        p.space_after = Pt(8)

    # =========================================================================
    # SLIDE 12: SÍNTESE DAS FORMULAÇÕES MATEMÁTICAS CANÔNICAS DO SAREL
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_bg(s12)
    add_header(s12, "11. Síntese das Formulações Matemáticas Canônicas do SAREL")
    add_footer(s12, 12)

    quadro_path = os.path.join("docs", "figuras", "formulas", "quadro_completo_formulas.png")
    if os.path.exists(quadro_path):
        s12.shapes.add_picture(quadro_path, Inches(0.95), Inches(1.35), width=Inches(11.433))
    else:
        # Fallback textual com cards caso a imagem não esteja disponível
        tb_fb = s12.shapes.add_textbox(Inches(0.95), Inches(1.4), Inches(11.4), Inches(5.0))
        tf_fb = tb_fb.text_frame
        p = tf_fb.paragraphs[0]
        p.text = "Quadro de fórmulas disponível em docs/figuras/formulas/quadro_completo_formulas.png"

    # =========================================================================
    # SLIDE 13: BLOCO (9) - REFERÊNCIAS BIBLIOGRÁFICAS CANÔNICAS (PARTE 1)
    # =========================================================================
    s13 = prs.slides.add_slide(blank_layout)
    set_bg(s13)
    add_header(s13, "12. Referências Bibliográficas Canônicas (Norma ABNT NBR 6023:2018)")
    add_footer(s13, 13)

    card_ref = s13.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.4), Inches(11.733), Inches(5.4))
    card_ref.fill.solid()
    card_ref.fill.fore_color.rgb = C_CARD_LIGHT
    card_ref.line.color.rgb = C_BORDER_LIGHT

    tb_ref = s13.shapes.add_textbox(Inches(1.1), Inches(1.5), Inches(11.1), Inches(5.1))
    tf_ref = tb_ref.text_frame
    tf_ref.word_wrap = True

    referencias = [
        "CHEN, T.; GUESTRIN, C. XGBoost: A Scalable Tree Boosting System. In: ACM SIGKDD INTERNATIONAL CONFERENCE ON KNOWLEDGE DISCOVERY AND DATA MINING, 22., 2016, San Francisco. Proceedings [...]. New York: ACM, 2016. p. 785–794.",
        "COCHRAN, W. G. Sampling Techniques. 3. ed. New York: John Wiley & Sons, 1977. 428 p.",
        "DAUGHTRY, C. S. T. et al. Estimating crop residue cover using advanced airborne hyperspectral images. Remote Sensing of Environment, v. 90, n. 1, p. 126–136, 2004.",
        "DEMATTÊ, J. A. M. et al. A powerful data mining procedure to retrieve soil spectral reflectance from satellite images. Remote Sensing of Environment, v. 212, p. 161–175, 2018.",
        "DURIGON, V. L. et al. NDVI time series for monitoring RUSLE cover management factor in a tropical watershed. International Journal of Remote Sensing, v. 35, n. 2, p. 441–453, 2014.",
        "EMBRAPA SOLOS. Erodibilidade dos solos do Estado do Paraná. Rio de Janeiro: Embrapa Solos, 2024. 38 p. (Documentos, 246).",
        "HIVELY, W. D. et al. Performance of satellite-derived crop residue cover metrics. Remote Sensing of Environment, v. 257, 112349, 2021.",
        "HORVITZ, D. G.; THOMPSON, D. J. A generalization of sampling without replacement from a finite universe. Journal of the American Statistical Association, v. 47, n. 260, p. 663–685, 1952.",
        "LUNDBERG, S. M.; LEE, S.-I. A Unified Approach to Interpreting Model Predictions. In: ADVANCES IN NEURAL INFORMATION PROCESSING SYSTEMS (NEURIPS 2017), 30., 2017, Long Beach. Proceedings [...]. Red Hook: Curran Associates, 2017. p. 4765–4774.",
        "MANNIGEL, E. et al. Fator erodibilidade de solos do estado de São Paulo. Revista Brasileira de Ciência do Solo, v. 26, n. 4, p. 1039–1049, 2002.",
        "RENARD, K. G. et al. Predicting soil erosion by water: a guide to conservation planning with the Revised Universal Soil Loss Equation (RUSLE). Washington, D.C.: United States Department of Agriculture, 1997. 404 p. (Agriculture Handbook, n. 703)."
    ]

    for ref in referencias:
        p = tf_ref.add_paragraph() if tf_ref.paragraphs[0].text else tf_ref.paragraphs[0]
        p.text = f"• {ref}"
        p.font.size = Pt(9.5)
        p.font.color.rgb = C_TEXT_DARK
        p.space_after = Pt(7)

    # =========================================================================
    # SLIDE 14: CONCLUSÃO E AGRADECIMENTOS
    # =========================================================================
    s14 = prs.slides.add_slide(blank_layout)
    set_bg(s14, C_NAVY_DARK)

    # Faixa lateral decorativa
    side_strip14 = s14.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.35), Inches(7.5))
    side_strip14.fill.solid()
    side_strip14.fill.fore_color.rgb = C_EMERALD_LIGHT
    side_strip14.line.color.rgb = C_EMERALD_LIGHT

    tb_end = s14.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(11.3), Inches(4.8))
    tf_end = tb_end.text_frame
    tf_end.word_wrap = True

    pe0 = tf_end.paragraphs[0]
    pe0.text = "SAREL: DA FUNDAMENTAÇÃO BIOFÍSICA AO RIGOR AMOSTRAL"
    pe0.font.size = Pt(12)
    pe0.font.bold = True
    pe0.font.color.rgb = C_EMERALD_LIGHT
    pe0.space_after = Pt(16)

    pe1 = tf_end.add_paragraph()
    pe1.text = "Obrigado pela atenção!"
    pe1.font.size = Pt(36)
    pe1.font.bold = True
    pe1.font.color.rgb = C_WHITE
    pe1.space_after = Pt(20)

    pe2 = tf_end.add_paragraph()
    pe2.text = "Pesquisa de Mestrado em Tecnologias Computacionais para o Agronegócio (PPGTCA)\nUniversidade Tecnológica Federal do Paraná (UTFPR) — Câmpus Medianeira\n\nMestrando: Luis Alfredo Ferreira da Silva  •  E-mail: luisalfredo@alunos.utfpr.edu.br\nOrientador: Prof. Dr. Claudio Leones Bazzi  •  E-mail: bazzi@utfpr.edu.br"
    pe2.font.size = Pt(13)
    pe2.font.color.rgb = C_TEXT_LIGHT

    # Salvar apresentação
    prs.save(caminho_saida)
    print(f"[OK] Apresentação PPTX salva com sucesso em: {caminho_saida}")

if __name__ == "__main__":
    caminho = os.path.join("docs", "apresentacoes", "Apresentacao_SAREL_PPGTCA_2026.pptx")
    if len(sys.argv) > 1:
        caminho = sys.argv[1]
    criar_apresentacao(caminho)
