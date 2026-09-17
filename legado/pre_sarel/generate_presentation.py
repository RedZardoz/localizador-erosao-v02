#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
GERADOR DA APRESENTAÇÃO EXECUTIVA E ACADÊMICA (PPTX)
Mestrado PPGTCA 2026 - Pesquisa de Erosão Laminar (Brasil)
Sistema Geodesic AI de Localização de Erosão & Identificação Fundiária
=============================================================================
Cria uma apresentação de slides de altíssimo nível (16:9 Widescreen)
com layout moderno, paleta de cores institucional, diagramas e tabelas.
"""

import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

# Paleta de Cores Institucional
C_EMERALD_DARK = RGBColor(6, 95, 70)     # #065F46
C_EMERALD_LIGHT = RGBColor(16, 185, 129) # #10B981
C_NAVY_DARK = RGBColor(15, 23, 42)       # #0F172A
C_NAVY_CARD = RGBColor(30, 41, 59)       # #1E293B
C_SLATE_TEXT = RGBColor(71, 85, 105)     # #475569
C_SLATE_MUTED = RGBColor(148, 163, 184)  # #94A3B8
C_WHITE = RGBColor(255, 255, 255)
C_AMBER = RGBColor(217, 119, 6)          # #D97706
C_CYAN = RGBColor(14, 165, 233)          # #0EA5E9
C_BG_LIGHT = RGBColor(248, 250, 252)     # #F8FAFC
C_BORDER_LIGHT = RGBColor(226, 232, 240) # #E2E8F0
C_ACCENT_BG = RGBColor(236, 253, 245)    # #ECFDF5


def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    def add_header(slide, title_text, category_text="MESTRADO PPGTCA 2026 • GESTÃO & TECNOLOGIA AMBIENTAL"):
        # Top banner background
        top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.15))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = C_NAVY_DARK
        top_bar.line.color.rgb = C_NAVY_DARK

        # Category subtitle
        tb_cat = slide.shapes.add_textbox(Inches(0.8), Inches(0.12), Inches(11.7), Inches(0.3))
        tf_cat = tb_cat.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.size = Pt(9)
        p_cat.font.bold = True
        p_cat.font.color.rgb = C_EMERALD_LIGHT

        # Main slide title
        tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.38), Inches(11.7), Inches(0.65))
        tf_title = tb_title.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = C_WHITE

        # Accent thin line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(1.15), Inches(13.333), Inches(0.05))
        line.fill.solid()
        line.fill.fore_color.rgb = C_EMERALD_LIGHT
        line.line.color.rgb = C_EMERALD_LIGHT

        # Footer
        ft = slide.shapes.add_textbox(Inches(0.8), Inches(7.1), Inches(11.7), Inches(0.3))
        p_ft = ft.text_frame.paragraphs[0]
        p_ft.text = "Geodesic AI • Sistema Integrado de Detecção de Erosão Laminar e Auditoria Fundiária"
        p_ft.font.size = Pt(8.5)
        p_ft.font.color.rgb = C_SLATE_MUTED

    # =========================================================================
    # SLIDE 1: CAPA
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = C_NAVY_DARK
    bg1.line.color.rgb = C_NAVY_DARK

    # Decorative emerald card on right
    card_right = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.5), Inches(1.2), Inches(4.0), Inches(5.1))
    card_right.fill.solid()
    card_right.fill.fore_color.rgb = C_NAVY_CARD
    card_right.line.color.rgb = C_EMERALD_DARK

    tb_cr = s1.shapes.add_textbox(Inches(8.8), Inches(1.5), Inches(3.4), Inches(4.5))
    tf_cr = tb_cr.text_frame
    tf_cr.word_wrap = True
    
    p = tf_cr.paragraphs[0]
    p.text = "DESTAQUES DA INOVAÇÃO"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_EMERALD_LIGHT
    
    bullets_cr = [
        ("Satélites Copernicus L2A", "Sentinel-2 MSI a 10m com correção atmosférica BOA"),
        ("Big Data Fundiário", "2,46M de titulares SNCR + 1,46M imóveis SICAR + 501K SIGEF"),
        ("Modelagem RUSLE/MMF", "Erosividade R, Erodibilidade K e Fator Topográfico LS métrico"),
        ("Rastreabilidade Pericial", "Geração de laudos com hash criptográfico SHA-256 e PDF"),
    ]
    for title, desc in bullets_cr:
        p1 = tf_cr.add_paragraph()
        p1.text = f"• {title}"
        p1.font.size = Pt(10)
        p1.font.bold = True
        p1.font.color.rgb = C_WHITE
        p1.space_before = Pt(8)
        
        p2 = tf_cr.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = C_SLATE_MUTED

    # Title on left
    tb_main = s1.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(7.2), Inches(4.5))
    tf_main = tb_main.text_frame
    tf_main.word_wrap = True

    p0 = tf_main.paragraphs[0]
    p0.text = "PROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIA E GESTÃO AMBIENTAL (PPGTCA 2026)"
    p0.font.size = Pt(10)
    p0.font.bold = True
    p0.font.color.rgb = C_EMERALD_LIGHT

    p1 = tf_main.add_paragraph()
    p1.text = "Plataforma Geodesic AI para Identificação de Erosão Laminar & Auditoria Fundiária"
    p1.font.size = Pt(28)
    p1.font.bold = True
    p1.font.color.rgb = C_WHITE
    p1.space_before = Pt(14)

    p2 = tf_main.add_paragraph()
    p2.text = "Sensoriamento Remoto Orbital (Copernicus/GEE), Modelagem RUSLE Geodésica e Fusão de Dados SICAR, SIGEF e SNCR/Receita Federal"
    p2.font.size = Pt(13)
    p2.font.color.rgb = C_SLATE_MUTED
    p2.space_before = Pt(12)

    p3 = tf_main.add_paragraph()
    p3.text = "Pesquisador: Luis Alfredo | Mestrando PPGTCA 2026\nLinha de Pesquisa: Geotecnologias Aplicadas à Conservação do Solo e Recursos Hídricos"
    p3.font.size = Pt(11)
    p3.font.bold = True
    p3.font.color.rgb = C_EMERALD_LIGHT
    p3.space_before = Pt(24)

    # =========================================================================
    # SLIDE 2: O PROBLEMA & A MOTIVAÇÃO CIENTÍFICA
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "Contexto da Pesquisa & O Desafio da Erosão Laminar")

    cols_s2 = [
        ("O Problema Invisível", "A erosão laminar remove uniformemente os horizontes superficiais férteis do solo agrícola sem abrir sulcos visíveis de imediato. Quando as voçorocas aparecem, toneladas de carbono orgânico e nutrientes já foram carreados para os rios.", C_AMBER),
        ("Gargalo da Amostragem", "Vistorias de campo convencionais são lentas, caras e cobrem áreas restritas. Faltam ferramentas computacionais que unam sensoriamento remoto de alta frequência temporal com a malha cadastral das propriedades rurais.", C_CYAN),
        ("A Solução Desenvolvida", "Um sistema que automatiza a triagem satelital com Google Earth Engine (Sentinel-2), quantifica a perda de solo por RUSLE/MMF e cruza espacialmente com quase 4,5M de registros oficiais fundiários em milissegundos.", C_EMERALD_LIGHT),
    ]

    for idx, (head, text, color) in enumerate(cols_s2):
        bx = Inches(0.8 + idx * 4.0)
        box = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bx, Inches(1.6), Inches(3.7), Inches(5.0))
        box.fill.solid()
        box.fill.fore_color.rgb = C_BG_LIGHT
        box.line.color.rgb = color
        box.line.width = Pt(1.5)

        tb = s2.shapes.add_textbox(bx + Inches(0.25), Inches(1.85), Inches(3.2), Inches(4.5))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = head
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = C_NAVY_DARK

        p_desc = tf.add_paragraph()
        p_desc.text = text
        p_desc.font.size = Pt(11)
        p_desc.font.color.rgb = C_SLATE_TEXT
        p_desc.space_before = Pt(12)

    # =========================================================================
    # SLIDE 3: ARQUITETURA DE SISTEMAS HÍBRIDA
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "Arquitetura Tecnológica da Plataforma (Full-Stack)")

    arch_layers = [
        ("1. Interface do Usuário (Frontend)", "Next.js 14 (App Router) • React 18 • TypeScript • Tailwind CSS • Lucide Icons • MapLibre GL / Mapbox para visualização de ortomosaicos satelitais e perímetros vetoriais com alta taxa de quadros (60 FPS)."),
        ("2. Camada de API & Orquestração", "API Routes serverless (/api/gee/* e /api/fundiario/*) com sanitização rigorosa de parâmetros, execução assíncrona com timeout de resiliência e controle de sessão OAuth2 com o Google Cloud Platform."),
        ("3. Motor Geodésico & Processamento", "Google Earth Engine Python API (Serverless Cloud Processing) integrado com scripts locais em Python (Shapely, PyShp, NumPy) para análise espectral, cálculo de declividade corrigida e point-in-polygon."),
        ("4. Banco de Dados Espacial Local", "SQLite com extensão virtual R*Tree indexando 1,46M de propriedades SICAR, 501K parcelas certificadas SIGEF e 2,46M de cadastros alfanuméricos SNCR/Receita Federal com tempos de resposta < 5ms."),
    ]

    for idx, (title, desc) in enumerate(arch_layers):
        by = Inches(1.55 + idx * 1.35)
        box = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), by, Inches(11.7), Inches(1.18))
        box.fill.solid()
        box.fill.fore_color.rgb = C_BG_LIGHT
        box.line.color.rgb = C_BORDER_LIGHT

        # Left tag
        tag = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), by, Inches(0.15), Inches(1.18))
        tag.fill.solid()
        tag.fill.fore_color.rgb = C_EMERALD_LIGHT
        tag.line.color.rgb = C_EMERALD_LIGHT

        tb = s3.shapes.add_textbox(Inches(1.15), by + Inches(0.12), Inches(11.2), Inches(0.95))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = C_NAVY_DARK

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(10)
        p2.font.color.rgb = C_SLATE_TEXT
        p2.space_before = Pt(4)

    # =========================================================================
    # SLIDE 4: ORIGEM DOS DADOS DE SENSIORAMENTO REMOTO & PEDOLOGIA
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "Origem dos Dados: Satélites, Relevo, Cobertura e Pedologia")

    ds_items = [
        ("Sentinel-2 MSI (Copernicus)", "Agência Espacial Europeia (ESA)", "Bandas B2, B3, B4, B8, B11, B12 a 10m/20m. Refletância de Superfície Nível 2A (BOA). Mosaicos sem nuvens dos últimos 120 dias filtrando aerossóis e cirrus."),
        ("SRTM 30m / DEM HydroSHEDS", "NASA / USGS / WWF", "Modelo Digital de Elevação corrigido para análise hidrológica. Extração de direção de escoamento superficial, acúmulo de fluxo e gradiente de rampa."),
        ("MapBiomas Brasil (Coleção 8/9)", "Rede MapBiomas / Observatório do Clima", "Classificação de uso e cobertura da terra a 30m anual. Permite filtrar lavouras temporárias e pastagens, excluindo florestas primárias e massas d'água de falsos positivos."),
        ("Base Pedológica Nacional", "Embrapa Solos / IBGE", "Classes taxonômicas do SiBCS (Latossolos, Nitossolos, Neossolos, Cambissolos) para determinação empírica do Fator K de erodibilidade dos solos brasileiros."),
    ]

    for idx, (name, agency, details) in enumerate(ds_items):
        col = idx % 2
        row = idx // 2
        bx = Inches(0.8 + col * 6.0)
        by = Inches(1.6 + row * 2.6)

        card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bx, by, Inches(5.7), Inches(2.35))
        card.fill.solid()
        card.fill.fore_color.rgb = C_BG_LIGHT
        card.line.color.rgb = C_EMERALD_DARK
        card.line.width = Pt(1)

        tb = s4.shapes.add_textbox(bx + Inches(0.2), by + Inches(0.15), Inches(5.3), Inches(2.0))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = name
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = C_NAVY_DARK

        p2 = tf.add_paragraph()
        p2.text = f"Fonte Oficial: {agency}"
        p2.font.size = Pt(9.5)
        p2.font.bold = True
        p2.font.color.rgb = C_EMERALD_DARK
        p2.space_before = Pt(2)

        p3 = tf.add_paragraph()
        p3.text = details
        p3.font.size = Pt(10)
        p3.font.color.rgb = C_SLATE_TEXT
        p3.space_before = Pt(6)

    # =========================================================================
    # SLIDE 5: MODELAGEM MATEMÁTICA RUSLE & CORREÇÃO GEODÉSICA
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "Cálculo da Perda de Solo: Equação Universal Revisada (RUSLE)")

    # Formula Box
    f_box = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.7), Inches(1.0))
    f_box.fill.solid()
    f_box.fill.fore_color.rgb = C_ACCENT_BG
    f_box.line.color.rgb = C_EMERALD_LIGHT

    tb_f = s5.shapes.add_textbox(Inches(1.0), Inches(1.55), Inches(11.3), Inches(0.9))
    tf_f = tb_f.text_frame
    tf_f.word_wrap = True
    p_f = tf_f.paragraphs[0]
    p_f.text = "A = R × K × LS × C × P   [Estimativa de Perda de Solo em t / (ha · ano)]"
    p_f.font.size = Pt(18)
    p_f.font.bold = True
    p_f.font.color.rgb = C_EMERALD_DARK
    p_f.alignment = PP_ALIGN.CENTER

    rusle_factors = [
        ("R (Erosividade)", "Energia cinética e intensidade pluvial anual (MJ·mm/ha·h·ano), calibrada para os regimes tropicais e subtropicais do Sul e Sudeste."),
        ("K (Erodibilidade)", "Suscetibilidade intrínseca da ordem de solo: Latossolos (0.015-0.025), Nitossolos (0.025-0.035), Argissolos/Neossolos (0.040-0.060 t·h/MJ·mm)."),
        ("LS (Topografia)", "Comprimento e gradiente de rampa com Correção Geodésica em Projeção EPSG:3857 a 10m, eliminando distorções de coordenadas esféricas."),
        ("C (Uso e Cobertura)", "Fator de proteção do dossel vegetal calculado dinamicamente através de NDVI e NDRE do Sentinel-2 no período crítico de solo descoberto."),
        ("P (Práticas de Manejo)", "Ponderação de terraceamento, curvas de nível e plantio direto vs. preparo convencional e solo sem contenção mecânica."),
    ]

    for idx, (fname, fdesc) in enumerate(rusle_factors):
        bx = Inches(0.8 + (idx % 3) * 3.95) if idx < 3 else Inches(2.75 + (idx - 3) * 3.95)
        by = Inches(2.7) if idx < 3 else Inches(4.9)

        fbox = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bx, by, Inches(3.8), Inches(1.95))
        fbox.fill.solid()
        fbox.fill.fore_color.rgb = C_BG_LIGHT
        fbox.line.color.rgb = C_BORDER_LIGHT

        tb = s5.shapes.add_textbox(bx + Inches(0.15), by + Inches(0.15), Inches(3.5), Inches(1.65))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = fname
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = C_NAVY_DARK

        p2 = tf.add_paragraph()
        p2.text = fdesc
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = C_SLATE_TEXT
        p2.space_before = Pt(6)

    # =========================================================================
    # SLIDE 6: TRIAGEM ESPACIAL & SCORE DE PRIORIDADE
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "Algoritmo de Seleção Automática dos Top-N Focos Críticos")

    steps_triagem = [
        ("Etapa 1: Filtragem por Máscara", "O algoritmo recorta o polígono da bacia hidrográfica e aplica máscara de exclusão sobre água, florestas nativas e áreas urbanas, focando estritamente em áreas agrícolas e pastagens suscetíveis."),
        ("Etapa 2: Análise Multiespectral", "Varredura na cena Sentinel-2 calculando NDVI (vigor vegetal), NBR2 (umidade/matéria orgânica) e índice de solo exposto BSI (Bare Soil Index) para detectar talhões com exposição crítica pré-plantio."),
        ("Etapa 3: Cálculo do Risco Integrado", "Composição do Priority Score (0 a 100): 40% Perda de Solo Estimada (RUSLE) + 25% Declividade e Fator LS + 20% Exposição de Solo + 15% Proximidade a Cursos D'água (risco de assoreamento)."),
        ("Etapa 4: Re-eleição Dinâmica", "Caso o agrônomo ou perito descarte um candidato em campo (ex: falso positivo por terraplanagem), o sistema executa a re-eleição imediata do próximo foco mais crítico na bacia com 1 clique."),
    ]

    for idx, (stitle, sdesc) in enumerate(steps_triagem):
        by = Inches(1.6 + idx * 1.35)
        box = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), by, Inches(11.7), Inches(1.18))
        box.fill.solid()
        box.fill.fore_color.rgb = C_BG_LIGHT
        box.line.color.rgb = C_BORDER_LIGHT

        circ = s6.shapes.add_shape(MSO_SHAPE.OVAL, Inches(1.0), by + Inches(0.24), Inches(0.7), Inches(0.7))
        circ.fill.solid()
        circ.fill.fore_color.rgb = C_EMERALD_LIGHT
        circ.line.color.rgb = C_EMERALD_LIGHT

        tb_c = s6.shapes.add_textbox(Inches(1.0), by + Inches(0.24), Inches(0.7), Inches(0.7))
        p_c = tb_c.text_frame.paragraphs[0]
        p_c.text = str(idx + 1)
        p_c.font.size = Pt(16)
        p_c.font.bold = True
        p_c.font.color.rgb = C_WHITE
        p_c.alignment = PP_ALIGN.CENTER

        tb = s6.shapes.add_textbox(Inches(1.9), by + Inches(0.12), Inches(10.4), Inches(0.95))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = stitle
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = C_NAVY_DARK

        p2 = tf.add_paragraph()
        p2.text = sdesc
        p2.font.size = Pt(10)
        p2.font.color.rgb = C_SLATE_TEXT
        p2.space_before = Pt(3)

    # =========================================================================
    # SLIDE 7: O NOVO PIPELINE FUNDIÁRIO (ESPACIAL + ALFANUMÉRICO)
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "O Novo Pipeline Fundiário: Cruzamento Espacial + Alfanumérico")

    tb_flow = s7.shapes.add_textbox(Inches(0.8), Inches(1.45), Inches(11.7), Inches(0.7))
    tf_flow = tb_flow.text_frame
    tf_flow.word_wrap = True
    p_flow = tf_flow.paragraphs[0]
    p_flow.text = "Inovação para superar as restrições da LGPD e identificar o produtor rural legalmente:"
    p_flow.font.size = Pt(12)
    p_flow.font.bold = True
    p_flow.font.color.rgb = C_NAVY_DARK

    pipeline_cards = [
        ("1. Coordenada Orbital", "Foco de erosão detectado via satélite no talhão (Latitude, Longitude em WGS84).", C_CYAN),
        ("2. R*Tree Espacial (SICAR)", "Identifica o Código CAR Oficial do Ministério do Meio Ambiente e a área total (ha).", C_EMERALD_LIGHT),
        ("3. R*Tree Espacial (SIGEF)", "Resgata a Gleba Certificada pelo INCRA, Matrícula no Cartório (CRI) e ART do CREA.", C_AMBER),
        ("4. Database Merge (SNCR)", "Fusão alfanumérica por código do imóvel e matrícula na base de dados abertos da Receita Federal.", C_EMERALD_DARK),
    ]

    for idx, (pname, pdesc, pcol) in enumerate(pipeline_cards):
        bx = Inches(0.8 + idx * 3.0)
        cbox = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bx, Inches(2.2), Inches(2.75), Inches(4.5))
        cbox.fill.solid()
        cbox.fill.fore_color.rgb = C_BG_LIGHT
        cbox.line.color.rgb = pcol
        cbox.line.width = Pt(1.5)

        tb = s7.shapes.add_textbox(bx + Inches(0.15), Inches(2.4), Inches(2.45), Inches(4.1))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = pname
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = C_NAVY_DARK

        p2 = tf.add_paragraph()
        p2.text = pdesc
        p2.font.size = Pt(10)
        p2.font.color.rgb = C_SLATE_TEXT
        p2.space_before = Pt(10)

    # =========================================================================
    # SLIDE 8: OS TRÊS PILARES DA BASE FUNDIÁRIA (SICAR, SIGEF E SNCR)
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "As Três Fontes Oficiais Integradas no Banco Local (Quase 4,5M Registros)")

    bases_info = [
        ("SICAR / MMA", "1.462.268 Imóveis Rurais", "Paraná: 559.899 | SC: 422.385 | SP: 479.984", "• Fornece o Código CAR oficial federal\n• Módulos Fiscais e Área Declarada\n• Situação Cadastral (Ativo/Pendente)\n• Polígono Vetorial do Perímetro da Fazenda"),
        ("SIGEF / INCRA", "501.183 Parcelas Certificadas", "Paraná: 170.046 | SC: 111.747 | SP: 219.390", "• Lei Federal do Georreferenciamento (10.267)\n• Denominação oficial da fazenda/gleba\n• Número da Matrícula no Cartório (CRI)\n• ART do CREA do engenheiro agrimensor"),
        ("SNCR / Receita Federal", "2.464.653 Cadastros de Titulares", "Paraná: 957.183 | SC: 625.516 | SP: 881.954", "• Dados Cadastrais Abertos do INCRA / RFB\n• Nome do Titular / Proprietário\n• Natureza Jurídica e Condição da Pessoa\n• Percentual de Detenção da Propriedade"),
    ]

    for idx, (bname, bvol, bdetail, bfeats) in enumerate(bases_info):
        bx = Inches(0.8 + idx * 4.0)
        box = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bx, Inches(1.6), Inches(3.7), Inches(5.0))
        box.fill.solid()
        box.fill.fore_color.rgb = C_BG_LIGHT
        box.line.color.rgb = C_BORDER_LIGHT

        tb = s8.shapes.add_textbox(bx + Inches(0.2), Inches(1.8), Inches(3.3), Inches(4.6))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = bname
        p1.font.size = Pt(16)
        p1.font.bold = True
        p1.font.color.rgb = C_NAVY_DARK

        p2 = tf.add_paragraph()
        p2.text = bvol
        p2.font.size = Pt(11)
        p2.font.bold = True
        p2.font.color.rgb = C_EMERALD_DARK
        p2.space_before = Pt(2)

        p3 = tf.add_paragraph()
        p3.text = bdetail
        p3.font.size = Pt(8.5)
        p3.font.color.rgb = C_SLATE_MUTED
        p3.space_before = Pt(2)

        p4 = tf.add_paragraph()
        p4.text = bfeats
        p4.font.size = Pt(10)
        p4.font.color.rgb = C_SLATE_TEXT
        p4.space_before = Pt(14)

    # =========================================================================
    # SLIDE 9: PERFORMANCE ESPACIAL R*TREE & POLÍGONO INTERATIVO
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "Performance Espacial: Indexação R*Tree e Visualização Vetorial")

    p_items = [
        ("Indexação R*Tree no SQLite", "Em vez de percorrer milhões de linhas por força bruta, criamos árvores R*Tree multidimensionais no SQLite. A busca da coordenada em PR, SC ou SP é resolvida em menos de 5 milissegundos."),
        ("Verificação Topológica Point-in-Polygon", "Quando ocorrem sobreposições na Bounding Box, o motor invoca algoritmos de topologia computacional via Shapely com os arquivos vetoriais em cache, confirmando a inclusão geométrica exata."),
        ("Projeção do Perímetro sob Demanda", "O botão 'Visualizar Perímetro no Mapa' busca as coordenadas vetoriais do CAR, projeta uma camada GeoJSON semitransparente em verde-esmeralda e ajusta o zoom da câmera automaticamente (fitBounds)."),
        ("Resiliência para Divisas e Carreadores", "Caso o ponto de erosão laminar caia exatamente na borda de um carreador ou cerca, o motor possui buffer de proximidade geodésica para associar ao imóvel confrontante correto."),
    ]

    for idx, (title, desc) in enumerate(p_items):
        col = idx % 2
        row = idx // 2
        bx = Inches(0.8 + col * 6.0)
        by = Inches(1.6 + row * 2.6)

        card = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bx, by, Inches(5.7), Inches(2.35))
        card.fill.solid()
        card.fill.fore_color.rgb = C_BG_LIGHT
        card.line.color.rgb = C_BORDER_LIGHT

        tb = s9.shapes.add_textbox(bx + Inches(0.2), by + Inches(0.18), Inches(5.3), Inches(2.0))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = C_NAVY_DARK

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(10)
        p2.font.color.rgb = C_SLATE_TEXT
        p2.space_before = Pt(8)

    # =========================================================================
    # SLIDE 10: LAUDO TÉCNICO PERICIAL & AUDITORIA
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    add_header(s10, "Dossiê de Auditoria & Laudo Pericial em PDF")

    rep_features = [
        ("Metodologia Científica Passo a Passo", "O laudo descreve detalhadamente cada etapa pericial: aquisição orbital Sentinel-2, índices espectrais (NDVI/NBR2), correção topográfica DEM e classificação pedológica SiBCS."),
        ("Rastreabilidade & Integridade Criptográfica", "Cada documento gerado inclui a data/hora exata UTC da amostragem e um Hash SHA-256 de validação pericial, garantindo autenticidade jurídica e reprodutibilidade acadêmica."),
        ("Dados Fundiários Completos", "Quadro estruturado com Nome da Fazenda, Matrícula no Cartório (CRI), Código CAR, Titularidade SNCR e área total em hectares, com layout dinâmico imune a sobreposição de textos."),
        ("Opção de Edição Manual", "Permite ao pesquisador completar o sobrenome de produtores ou inserir anotações de entrevistas de campo caso o registro possua proteção ou máscara fiscal."),
    ]

    for idx, (ftitle, fdesc) in enumerate(rep_features):
        by = Inches(1.6 + idx * 1.35)
        box = s10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), by, Inches(11.7), Inches(1.18))
        box.fill.solid()
        box.fill.fore_color.rgb = C_BG_LIGHT
        box.line.color.rgb = C_BORDER_LIGHT

        tb = s10.shapes.add_textbox(Inches(1.1), by + Inches(0.12), Inches(11.2), Inches(0.95))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = ftitle
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = C_NAVY_DARK

        p2 = tf.add_paragraph()
        p2.text = fdesc
        p2.font.size = Pt(10)
        p2.font.color.rgb = C_SLATE_TEXT
        p2.space_before = Pt(4)

    # =========================================================================
    # SLIDE 11: EXPORTAÇÃO & INTEROPERABILIDADE
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    add_header(s11, "Exportação Versátil de Dados e Interoperabilidade")

    formats = [
        ("PDF Pericial", "Documento formal de auditoria com diagramação vetorial precisa, tabelas estruturadas, coordenadas DMS e assinatura metodológica."),
        ("GeoJSON Oficial", "Formato aberto padrão para sistemas SIG modernos, com atributos de perda de solo, fatores RUSLE e dados do CAR embutidos."),
        ("KML (Google Earth)", "Arquivo de visualização 3D para navegação imersiva no Google Earth Web ou Desktop, permitindo sobrevoo sobre os focos."),
        ("CSV para Machine Learning", "Dataset formatado com atributos de sensoriamento remoto, elevação, solo e alvos de erosão para treinamento de redes neurais."),
    ]

    for idx, (fmt, fdesc) in enumerate(formats):
        bx = Inches(0.8 + idx * 3.0)
        box = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bx, Inches(1.8), Inches(2.75), Inches(4.8))
        box.fill.solid()
        box.fill.fore_color.rgb = C_BG_LIGHT
        box.line.color.rgb = C_EMERALD_LIGHT

        tb = s11.shapes.add_textbox(bx + Inches(0.15), Inches(2.1), Inches(2.45), Inches(4.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = fmt
        p1.font.size = Pt(14)
        p1.font.bold = True
        p1.font.color.rgb = C_NAVY_DARK

        p2 = tf.add_paragraph()
        p2.text = fdesc
        p2.font.size = Pt(10)
        p2.font.color.rgb = C_SLATE_TEXT
        p2.space_before = Pt(12)

    # =========================================================================
    # SLIDE 12: CONCLUSÃO & IMPACTO NO MESTRADO PPGTCA
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    bg12 = s12.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg12.fill.solid()
    bg12.fill.fore_color.rgb = C_NAVY_DARK
    bg12.line.color.rgb = C_NAVY_DARK

    tb_c = s12.shapes.add_textbox(Inches(1.0), Inches(1.2), Inches(11.3), Inches(5.5))
    tf_c = tb_c.text_frame
    tf_c.word_wrap = True

    p0 = tf_c.paragraphs[0]
    p0.text = "CONCLUSÃO & CONTRIBUIÇÃO CIENTÍFICA"
    p0.font.size = Pt(12)
    p0.font.bold = True
    p0.font.color.rgb = C_EMERALD_LIGHT

    p1 = tf_c.add_paragraph()
    p1.text = "Inovação Tecnológica Aplicada à Conservação de Solos e Gestão Ambiental"
    p1.font.size = Pt(24)
    p1.font.bold = True
    p1.font.color.rgb = C_WHITE
    p1.space_before = Pt(10)

    p2 = tf_c.add_paragraph()
    p2.text = (
        "• Transição do monitoramento pontual passivo para a triagem orbital proativa e automatizada.\n"
        "• Solução inédita de fusão espacial e alfanumérica (SICAR + SIGEF + SNCR) com conformidade à LGPD.\n"
        "• Rigor metodológico embasado na Equação Universal de Perda de Solo com correção geodésica.\n"
        "• Plataforma aberta e pronta para replicação em qualquer bacia hidrográfica do território nacional.\n\n"
        "Mestrado Profissional em Tecnologia e Gestão Ambiental (PPGTCA 2026)\n"
        "Autor: Luis Alfredo • Contato: PPGTCA / UFPR"
    )
    p2.font.size = Pt(13)
    p2.font.color.rgb = C_SLATE_MUTED
    p2.space_before = Pt(18)

    out_path = "Apresentacao_Localizador_Erosao_PPGTCA.pptx"
    prs.save(out_path)
    print(f"[SUCESSO] Apresentação PPTX gerada com sucesso em: {os.path.abspath(out_path)}")
    print(f"Total de slides criados: {len(prs.slides)}")


if __name__ == "__main__":
    create_deck()
