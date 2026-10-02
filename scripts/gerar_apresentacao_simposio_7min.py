# -*- coding: utf-8 -*-
"""
=============================================================================
GERADOR DE APRESENTAÇÃO PARA VÍDEO DE SIMPÓSIO ESTUDANTIL (~7 MINUTOS)
Mestrado PPGTCA 2026 — UTFPR Campus Medianeira
Escopo: Da motivação e recorte da Bacia do Paraná 3 até a Seleção de Pontos
        de Erosão Laminar Provável (sem revelar detalhes internos dos modelos),
        com quadros dedicados (placeholders 16:9) para inserir prints do App.
=============================================================================
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

# Paleta Institucional Moderna (Dark Navy + Emerald + Amber + Slate)
C_NAVY_DARK   = RGBColor(15, 23, 42)     # #0F172A
C_NAVY_CARD   = RGBColor(30, 41, 59)     # #1E293B
C_BG_LIGHT    = RGBColor(248, 250, 252)  # #F8FAFC
C_WHITE       = RGBColor(255, 255, 255)  # #FFFFFF
C_BORDER      = RGBColor(203, 213, 225)  # #CBD5E1

C_EMERALD_DK  = RGBColor(6, 95, 70)      # #065F46
C_EMERALD_MID = RGBColor(5, 150, 105)    # #059669
C_EMERALD_LT  = RGBColor(16, 185, 129)   # #10B981
C_MINT_BG     = RGBColor(236, 253, 245)  # #ECFDF5

C_AMBER_DK    = RGBColor(180, 83, 9)     # #B45309
C_AMBER_LT    = RGBColor(245, 158, 11)   # #F59E0B
C_AMBER_BG    = RGBColor(255, 251, 235)  # #FFFBEB

C_CYAN_DK     = RGBColor(3, 105, 161)    # #0369A1
C_CYAN_BG     = RGBColor(240, 249, 255)  # #F0F9FF

C_ROSE_DK     = RGBColor(190, 18, 60)    # #BE123C
C_TEXT_DARK   = RGBColor(15, 23, 42)     # #0F172A
C_TEXT_BODY   = RGBColor(51, 65, 85)     # #334155
C_TEXT_MUTED  = RGBColor(100, 116, 139)  # #64748B
C_TEXT_LIGHT  = RGBColor(226, 232, 240)  # #E2E8F0


def criar_apresentacao_simposio(output_paths):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]
    TOTAL_SLIDES = 8

    def set_bg(slide, cor=C_BG_LIGHT):
        bg = slide.background
        fill = bg.fill
        fill.solid()
        fill.fore_color.rgb = cor

    def add_notes(slide, texto_roteiro):
        notes_slide = slide.notes_slide
        tf = notes_slide.notes_text_frame
        tf.text = texto_roteiro

    def add_header(slide, titulo, subt_tempo, categoria="SIMPÓSIO ESTUDANTIL • PPGTCA / UTFPR MEDIANEIRA • APOIO ITAIPU PARQUETEC"):
        bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.12))
        bar.fill.solid()
        bar.fill.fore_color.rgb = C_NAVY_DARK
        bar.line.color.rgb = C_NAVY_DARK

        tb_cat = slide.shapes.add_textbox(Inches(0.6), Inches(0.10), Inches(9.5), Inches(0.28))
        p_cat = tb_cat.text_frame.paragraphs[0]
        p_cat.text = categoria
        p_cat.font.size = Pt(9.5)
        p_cat.font.bold = True
        p_cat.font.color.rgb = C_EMERALD_LT

        # Badge de tempo sugerido no canto direito do cabeçalho
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(10.55), Inches(0.18), Inches(2.2), Inches(0.36))
        badge.fill.solid()
        badge.fill.fore_color.rgb = C_NAVY_CARD
        badge.line.color.rgb = C_EMERALD_MID
        p_b = badge.text_frame.paragraphs[0]
        p_b.alignment = PP_ALIGN.CENTER
        p_b.text = f"⏱ {subt_tempo}"
        p_b.font.size = Pt(9.5)
        p_b.font.bold = True
        p_b.font.color.rgb = C_EMERALD_LT

        tb_tit = slide.shapes.add_textbox(Inches(0.6), Inches(0.38), Inches(10.0), Inches(0.62))
        p_tit = tb_tit.text_frame.paragraphs[0]
        p_tit.text = titulo
        p_tit.font.size = Pt(19.5)
        p_tit.font.bold = True
        p_tit.font.color.rgb = C_WHITE

        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(1.10), Inches(13.333), Inches(0.04))
        line.fill.solid()
        line.fill.fore_color.rgb = C_EMERALD_MID
        line.line.color.rgb = C_EMERALD_MID

    def add_footer(slide, num_slide):
        tb = slide.shapes.add_textbox(Inches(0.6), Inches(7.12), Inches(12.1), Inches(0.28))
        p = tb.text_frame.paragraphs[0]
        p.text = f"Luis Alfredo da Silva • PPGTCA / UTFPR (Campus Medianeira) • Projeto SAREL (Bacia do Paraná 3)   |   Slide {num_slide} de {TOTAL_SLIDES}"
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_TEXT_MUTED

    def add_card(slide, left, top, width, height, titulo, itens, cor_borda=C_EMERALD_MID, cor_bg=C_WHITE, cor_titulo=C_NAVY_DARK):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = cor_bg
        card.line.color.rgb = cor_borda
        card.line.width = Pt(1.25)

        # Barra de destaque lateral esquerda do card
        strip = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(left), Inches(top + 0.08), Inches(0.09), Inches(height - 0.16))
        strip.fill.solid()
        strip.fill.fore_color.rgb = cor_borda
        strip.line.color.rgb = cor_borda

        tb = slide.shapes.add_textbox(Inches(left + 0.22), Inches(top + 0.10), Inches(width - 0.34), Inches(height - 0.20))
        tf = tb.text_frame
        tf.word_wrap = True

        p0 = tf.paragraphs[0]
        p0.text = titulo
        p0.font.size = Pt(13)
        p0.font.bold = True
        p0.font.color.rgb = cor_titulo
        p0.space_after = Pt(6)

        for item in itens:
            p = tf.add_paragraph()
            p.text = f"• {item}"
            p.font.size = Pt(11)
            p.font.color.rgb = C_TEXT_BODY
            p.space_after = Pt(4)

    def add_app_placeholder(slide, left, top, width, height, num_print, titulo_print, instrucao_captura, legenda_rodape):
        """
        Cria uma moldura estilo janela de aplicativo (Mockup 16:9) pronta para o usuário
        colar (Ctrl+V) um print ou gravação de tela do App SAREL.
        """
        # Sombra externa suave
        shadow = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left + 0.05), Inches(top + 0.05), Inches(width), Inches(height))
        shadow.fill.solid()
        shadow.fill.fore_color.rgb = RGBColor(203, 213, 225)
        shadow.line.color.rgb = RGBColor(203, 213, 225)

        # Janela Principal
        frame = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        frame.fill.solid()
        frame.fill.fore_color.rgb = C_NAVY_DARK
        frame.line.color.rgb = C_EMERALD_LT
        frame.line.width = Pt(2.0)

        # Barra superior estilo navegador / App Desktop
        topbar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(0.42))
        topbar.fill.solid()
        topbar.fill.fore_color.rgb = C_NAVY_CARD
        topbar.line.color.rgb = C_EMERALD_LT

        tb_top = slide.shapes.add_textbox(Inches(left + 0.15), Inches(top + 0.06), Inches(width - 0.3), Inches(0.3))
        p_top = tb_top.text_frame.paragraphs[0]
        p_top.text = f"🟢 🟡 🔴   SAREL v2.0 — ESPAÇO PARA TELA DO APP #{num_print}: {titulo_print}"
        p_top.font.size = Pt(9.5)
        p_top.font.bold = True
        p_top.font.color.rgb = C_EMERALD_LT

        # Área central tracejada onde entra a imagem (Dropzone)
        drop = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE,
            Inches(left + 0.18),
            Inches(top + 0.56),
            Inches(width - 0.36),
            Inches(height - 1.12)
        )
        drop.fill.solid()
        drop.fill.fore_color.rgb = RGBColor(22, 33, 56)
        drop.line.color.rgb = C_AMBER_LT
        drop.line.width = Pt(1.5)

        tb_mid = slide.shapes.add_textbox(
            Inches(left + 0.40),
            Inches(top + (height / 2.0) - 0.85),
            Inches(width - 0.80),
            Inches(1.7)
        )
        tf_mid = tb_mid.text_frame
        tf_mid.word_wrap = True

        pm0 = tf_mid.paragraphs[0]
        pm0.alignment = PP_ALIGN.CENTER
        pm0.text = f"[ COLE AQUI O PRINT / VÍDEO DA TELA #{num_print} DO APP ]"
        pm0.font.size = Pt(14)
        pm0.font.bold = True
        pm0.font.color.rgb = C_AMBER_LT
        pm0.space_after = Pt(8)

        pm1 = tf_mid.add_paragraph()
        pm1.alignment = PP_ALIGN.CENTER
        pm1.text = instrucao_captura
        pm1.font.size = Pt(10.5)
        pm1.font.color.rgb = C_TEXT_LIGHT

        # Barra de legenda na base do mockup
        tb_bot = slide.shapes.add_textbox(Inches(left + 0.18), Inches(top + height - 0.48), Inches(width - 0.36), Inches(0.38))
        p_bot = tb_bot.text_frame.paragraphs[0]
        p_bot.alignment = PP_ALIGN.CENTER
        p_bot.text = legenda_rodape
        p_bot.font.size = Pt(9)
        p_bot.font.italic = True
        p_bot.font.color.rgb = C_EMERALD_LT

    # =========================================================================
    # SLIDE 1: CAPA INSTITUCIONAL (0:00 - 0:45 | 45s)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_bg(s1, C_NAVY_DARK)

    strip1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.32), Inches(7.5))
    strip1.fill.solid()
    strip1.fill.fore_color.rgb = C_EMERALD_LT
    strip1.line.color.rgb = C_EMERALD_LT

    tb1 = s1.shapes.add_textbox(Inches(0.95), Inches(0.85), Inches(11.5), Inches(5.8))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ (UTFPR) • CAMPUS MEDIANEIRA\nPROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO (PPGTCA)"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_EMERALD_LT
    p.space_after = Pt(18)

    p = tf1.add_paragraph()
    p.text = "Arcabouço Computacional Auditável para Amostragem Estratificada e Localização de Focos Prováveis de Erosão Laminar em Bacia Agrícola"
    p.font.size = Pt(26)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    p.space_after = Pt(14)

    p = tf1.add_paragraph()
    p.text = "Integração Multi-Sensor (Sentinel-2, Copernicus DEM e Bases Oficiais) para Triagem Territorial na Bacia Hidrográfica do Paraná 3"
    p.font.size = Pt(15)
    p.font.color.rgb = C_TEXT_LIGHT
    p.space_after = Pt(24)

    p = tf1.add_paragraph()
    p.text = "Autor: Luis Alfredo da Silva¹  |  Coautor²  |  Orientador³\n¹Mestrando PPGTCA/UTFPR  •  ²Coautor  •  ³Docente Orientador PPGTCA/UTFPR"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_AMBER_LT
    p.space_after = Pt(18)

    p = tf1.add_paragraph()
    p.text = "Apoio Institucional e Financiamento: PPGTCA / UTFPR  •  Itaipu Parquetec"
    p.font.size = Pt(10.5)
    p.font.color.rgb = C_TEXT_MUTED

    add_notes(s1, (
        "[TEMPO: 0:00 a 0:45 — 45 segundos]\n"
        "Olá a todos. Meu nome é Luis Alfredo da Silva, sou mestrando do Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA) da UTFPR Campus Medianeira.\n"
        "Neste vídeo de cerca de 7 minutos, vou apresentar o desenvolvimento do nosso projeto de pesquisa: um arcabouço computacional auditável — batizado de SAREL — projetado para realizar a amostragem estratificada e localizar focos prováveis de erosão hídrica laminar na Bacia Hidrográfica do Paraná 3, combinando sensoriamento remoto orbital e bases territoriais oficiais."
    ))

    # =========================================================================
    # SLIDE 2: O PROBLEMA DA EROSÃO LAMINAR SILENCIOSA (0:45 - 1:40 | 55s)
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_bg(s2)
    add_header(s2, "1. Contextualização: O Desafio da Erosão Laminar na Bacia do Paraná 3", "0:45 – 1:40 (55s)")
    add_footer(s2, 2)

    add_card(
        s2, 0.6, 1.40, 5.9, 2.65,
        "A Erosão Silenciosa sob Sistema Plantio Direto (SPD)",
        [
            "Mesmo em lavouras tecnificadas sob Plantio Direto no Oeste do Paraná, eventos extremos de precipitação causam escoamento superficial concentrado (Dieckow et al., 2009).",
            "A erosão laminar remove seletivamente a fração coloidal mais fértil (argila, matéria orgânica e fósforo) sem formar crateras óbvias de imediato.",
            "Impacto direto: perda de produtividade agrícola e assoreamento/eutrofização dos tributários do Reservatório de Itaipu."
        ],
        cor_borda=C_ROSE_DK, cor_bg=C_WHITE, cor_titulo=C_ROSE_DK
    )

    add_card(
        s2, 6.8, 1.40, 5.9, 2.65,
        "Limitação das Abordagens Cartográficas Clássicas",
        [
            "Modelos empíricos tradicionais (como a RUSLE aplicada em escala macro) apoiam-se em médias generalizadas que suavizam feições locais.",
            "Vistorias presenciais às cegas em uma bacia de mais de 8.000 km² têm custo logístico proibitivo.",
            "Pergunta da Pesquisa: Como filtrar milhões de pixels orbitais para apontar, com precisão métrica (10 m) e lastro jurídico, onde estão os pontos de erosão provável?"
        ],
        cor_borda=C_NAVY_DARK, cor_bg=C_WHITE, cor_titulo=C_NAVY_DARK
    )

    add_card(
        s2, 0.6, 4.30, 12.1, 2.55,
        "A Solução Proposta: Plataforma Computacional SAREL (Triagem Multi-Sensor Auditável)",
        [
            "Integração em nuvem via Google Earth Engine (GEE): varredura histórica de 10 anos da constelação Sentinel-2 MSI (10 m) combinada ao relevo Copernicus DEM (30 m).",
            "Ancoragem Oficial: cruzamento automático com imóveis rurais do SICAR/CAR, malhas legais do IBGE/ITCG e erodibilidade pedológica da Embrapa Solos (Coelho et al., 2024).",
            "Objetivo desta etapa: apresentar a arquitetura territorial e o motor matemático de seleção dos pontos candidatos de erosão laminar provável."
        ],
        cor_borda=C_EMERALD_MID, cor_bg=C_MINT_BG, cor_titulo=C_EMERALD_DK
    )

    add_notes(s2, (
        "[TEMPO: 0:45 a 1:40 — 55 segundos]\n"
        "Por que estudar erosão laminar na Bacia do Paraná 3? Mesmo sendo uma região referência em Sistema Plantio Direto, o relevo ondulado e as chuvas intensas provocam escoamento superficial que decapita lentamente o horizonte superficial do solo.\n"
        "Diferente de uma voçoroca, a erosão laminar é difusa e silenciosa. E os mapas tradicionais baseados em médias regionais não conseguem dizer ao pesquisador ou ao gestor exatamente em qual talhão ou encosta o problema está acontecendo.\n"
        "Por isso nós desenvolvemos o SAREL: para usar 10 anos de imagens de satélite de 10 metros de resolução e apontar automaticamente os pontos de erosão provável antes de ir a campo."
    ))

    # =========================================================================
    # SLIDE 3: VISÃO GERAL DO SISTEMA SAREL + ESPAÇO TELA #1 (1:40 - 2:35 | 55s)
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_bg(s3)
    add_header(s3, "2. O Arcabouço Computacional SAREL: Visão Geral da Plataforma", "1:40 – 2:35 (55s)")
    add_footer(s3, 3)

    add_card(
        s3, 0.6, 1.40, 5.2, 5.45,
        "Arquitetura WebGIS 3D & Motor Científico",
        [
            "Ambiente Interativo Tridimensional: renderização topográfica exagerada (DEM 3D) sobre imagens orbitais de alta definição.",
            "Conexão Direta com Serviços Oficiais:",
            "  1. Google Earth Engine (GEE) para redução de séries temporais Sentinel-2 L2A;",
            "  2. API Oficial de Malhas do IBGE e Instituto Água e Terra (IAT-PR);",
            "  3. Banco geoespacial local com milhares de polígonos reais do SICAR/CAR e SIGEF;",
            "  4. Integração com parâmetros pedológicos da Embrapa (SiBCS).",
            "Fluxo de Trabalho Guiado: Delimitação da Área (AOI) → Eleição Estratificada de Candidatos → Inspeção Multi-Sensor → Exportação para Campo."
        ],
        cor_borda=C_EMERALD_MID, cor_bg=C_WHITE, cor_titulo=C_NAVY_DARK
    )

    add_app_placeholder(
        s3, 6.05, 1.40, 6.68, 5.45,
        num_print=1,
        titulo_print="Visão Geral do SAREL e Mapa 3D",
        instrucao_captura="Sugestão de print: Tela inicial do SAREL mostrando o Mapa 3D (Google Earth + Relevo 3D ativado), a Sidebar esquerda com os controles e os indicadores superiores.",
        legenda_rodape="Figura 1: Interface principal do sistema SAREL v2.0 com renderização topográfica 3D."
    )

    add_notes(s3, (
        "[TEMPO: 1:40 a 2:35 — 55 segundos]\n"
        "Aqui na tela vocês veem a interface principal do aplicativo SAREL que desenvolvemos no mestrado.\n"
        "À esquerda temos o painel de controle de áreas de amostragem, filtros biofísicos e conexão autenticada com as APIs científicas.\n"
        "À direita, o visualizador cartográfico 3D permite inspecionar o relevo real das vertentes agrícolas da Bacia do Paraná 3. Toda a plataforma foi construída para transformar dados brutos de satélite em candidatos auditáveis de erosão."
    ))

    # =========================================================================
    # SLIDE 4: RECORTE HÍBRIDO DA BACIA DO PARANÁ 3 + TELA #2 (2:35 - 3:35 | 60s)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_bg(s4)
    add_header(s4, "3. Recorte Espacial Híbrido: Bacia Hidrográfica do Paraná 3", "2:35 – 3:35 (60s)")
    add_footer(s4, 4)

    add_card(
        s4, 0.6, 1.40, 5.2, 5.45,
        "Solução Cartográfica em 3 Camadas Oficiais",
        [
            "Superamos polígonos simplificados unindo a hidrografia física aos limites legais municipais (SIRGAS 2000):",
            "1. Divisor Hidrológico Oficial (IAT — 7.979 km²): área exata de drenagem direta ao Reservatório de Itaipu.",
            "2. Limite Legal dos 28 Municípios (IBGE/ITCG — 13.350 km²): de Guaíra (06) e Cascavel (01) até Medianeira (24) e Foz do Iguaçu (28).",
            "3. Corredor Experimental Foz do Iguaçu – Céu Azul (6 Municípios — 2.920 km²): eixo que captura o gradiente completo de altitude (180 m a 750 m), declividade (2% a 20%) e transição Latossolo/Nitossolo para verificação presencial."
        ],
        cor_borda=C_CYAN_DK, cor_bg=C_WHITE, cor_titulo=C_CYAN_DK
    )

    add_app_placeholder(
        s4, 6.05, 1.40, 6.68, 5.45,
        num_print=2,
        titulo_print="Recorte Híbrido da Bacia do Paraná 3 no App",
        instrucao_captura="Sugestão de print: Janela 'Gerenciar Áreas (AOI)' na aba Microbacias Hidrográficas (mostrando o Combo Híbrido BP3 e os 28 municípios) OU o mapa com o Divisor IAT (rosa), os 28 municípios (verde/tracejado) e o Corredor Foz–Céu Azul (âmbar).",
        legenda_rodape="Figura 2: Sobreposição oficial do Divisor Hidrológico (IAT), 28 Municípios (IBGE) e Corredor Foz–Céu Azul."
    )

    add_notes(s4, (
        "[TEMPO: 2:35 a 3:35 — 60 segundos]\n"
        "Um ponto crucial que resolvemos no sistema é a exatidão territorial da Bacia Hidrográfica do Paraná 3.\n"
        "Como mostra a tela do aplicativo, o SAREL implementa uma solução híbrida inédita que sobrepõe três recortes oficiais:\n"
        "Primeiro, o divisor hidrológico estrito do Instituto Água e Terra, de quase 8 mil km², que drena para o Lago de Itaipu.\n"
        "Segundo, a malha legal oficial do IBGE dos 28 municípios que integram a bacia.\n"
        "E terceiro, o destaque para o Corredor Experimental de 6 municípios entre Foz do Iguaçu, Medianeira e Céu Azul, onde saímos de 180 metros de altitude na beira do lago até 750 metros no rebordo do Terceiro Planalto."
    ))

    # =========================================================================
    # SLIDE 5: COMO DETECTAMOS EROSÃO PROVÁVEL? + TELA #3 (3:35 - 4:40 | 65s)
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_bg(s5)
    add_header(s5, "4. Critérios Biofísicos: Como Localizar um Ponto de Erosão Provável?", "3:35 – 4:40 (65s)")
    add_footer(s5, 5)

    add_card(
        s5, 0.6, 1.40, 5.2, 5.45,
        "Fusão de Evidências Físicas e Espectrais",
        [
            "O satélite não vê a 'lâmina de terra' isolada, mas sim a assinatura física deixada pela erosão ao longo do tempo:",
            "• Critério 1 — Energia Topográfica (Copernicus DEM 30 m): seleção de rampas agrícolas com declividade entre 3% e 20% (projeção métrica UTM 22S).",
            "• Critério 2 — Frequência Histórica de Solo Exposto (Sentinel-2, 10 m): cálculo multitemporal do Bare Soil Index (BSI) e queda crônica do NDVI (Fator C de Durigon et al., 2014) onde a enxurrada expõe o horizonte subsuperficial.",
            "• Critério 3 — Erodibilidade Pedológica (Fator K — Embrapa) + Restrição SICAR/CAR: garante que todo ponto candidato caia dentro de uma lavoura real cadastrada."
        ],
        cor_borda=C_AMBER_DK, cor_bg=C_AMBER_BG, cor_titulo=C_AMBER_DK
    )

    add_app_placeholder(
        s5, 6.05, 1.40, 6.68, 5.45,
        num_print=3,
        titulo_print="Inspetor de Ponto e Série Temporal Espectral",
        instrucao_captura="Sugestão de print: Aba 'Inspetor de Ponto' ou 'Popup de Ponto no Mapa' exibindo as métricas topográficas (declividade, altitude), o código do imóvel CAR/SICAR, o solo da Embrapa e o Gráfico da Série Temporal NDVI / BSI.",
        legenda_rodape="Figura 3: Inspeção biofísica e série temporal multiespectral de um ponto candidato a erosão laminar."
    )

    add_notes(s5, (
        "[TEMPO: 3:35 a 4:40 — 65 segundos]\n"
        "Mas como o software decide que um determinado ponto da bacia tem alta probabilidade de erosão laminar?\n"
        "O SAREL cruza três evidências físicas reais:\n"
        "Primeiro, a declividade medida pelo modelo digital de elevação Copernicus de 30 metros, focando nas rampas críticas de 3% a 20%.\n"
        "Segundo, a série histórica do satélite Sentinel-2 a 10 metros: locais que sofrem erosão laminar apresentam exposição recorrente de solo nu — medida pelo índice BSI — e cicatrizes de baixo vigor vegetativo no índice NDVI.\n"
        "E terceiro, o sistema cruza essa coordenada com o mapa de erodibilidade de solos da Embrapa e com o polígono oficial do imóvel no Cadastro Ambiental Rural (SICAR), garantindo que cada ponto candidato pertença a uma área agrícola real."
    ))

    # =========================================================================
    # SLIDE 6: SELEÇÃO AMOSTRAL ESTRATIFICADA + TELA #4 (4:40 - 5:45 | 65s)
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_bg(s6)
    add_header(s6, "5. Eleição Amostral no GEE: 18 Estratos, Thinning e Partição In-Loco", "4:40 – 5:45 (65s)")
    add_footer(s6, 6)

    add_card(
        s6, 0.6, 1.40, 5.2, 5.45,
        "Amostragem Sem Viés e Sem Autocorrelação",
        [
            "1. Grade de 18 Estratos Biofísicos Ortogonais:",
            "   • 3 classes de Declividade (S) × 3 faixas de Frequência de Solo Nu (E) × 2 classes de Erodibilidade (K).",
            "   • Garante seleção equilibrada tanto de focos críticos de erosão provável quanto de áreas estáveis de controle.",
            "2. Thinning Geodésico Haversine (1 a 5 km):",
            "   • Aplica a 1ª Lei da Geografia (Tobler, 1970), exigindo distância mínima entre candidatos para não repetir o mesmo talhão.",
            "3. Partição Proporcional Acoplada (80% / 20%):",
            "   • Do total de pontos sorteados na bacia (Fase A), 20% já são automaticamente alocados no Corredor Foz–Céu Azul para vistoria presencial (Fase B)."
        ],
        cor_borda=C_EMERALD_MID, cor_bg=C_WHITE, cor_titulo=C_EMERALD_DK
    )

    add_app_placeholder(
        s6, 6.05, 1.40, 6.68, 5.45,
        num_print=4,
        titulo_print="Modal de Eleição Amostral GEE e Pontos Eleitos",
        instrucao_captura="Sugestão de print: Modal 'Eleição Amostral no Google Earth Engine (GEE)' mostrando os parâmetros (Quantidade, Raio de Thinning, Subamostra In-Loco 20% no Corredor Foz–Céu Azul) e os pontos distribuídos no mapa.",
        legenda_rodape="Figura 4: Motor de eleição amostral estratificada no GEE com partição automática Bacia (80%) + Corredor In-Loco (20%)."
    )

    add_notes(s6, (
        "[TEMPO: 4:40 a 5:45 — 65 segundos]\n"
        "Para que a seleção desses pontos de erosão provável seja cientificamente válida e sem viés, implementamos esta janela de Eleição Amostral no Google Earth Engine.\n"
        "Primeiro, o algoritmo divide a bacia em 18 estratos ortogonais combinando declividade, frequência de solo exposto e erodibilidade.\n"
        "Segundo, aplicamos o Thinning Geodésico de Haversine: o sistema impõe um raio mínimo de 1 a 5 quilômetros entre um ponto e outro, evitando selecionar pixels vizinhos no mesmo talhão.\n"
        "E terceiro, veja no painel inferior do modal: ao pedir o sorteio na Bacia do Paraná 3, o sistema já reserva automaticamente uma proporção — por padrão 20% da amostra — dentro do corredor entre Foz do Iguaçu e Céu Azul para a verificação presencial em campo."
    ))

    # =========================================================================
    # SLIDE 7: AUDITORIA, PROVENIÊNCIA E PRÓXIMOS PASSOS + TELA #5 (5:45 - 6:30 | 45s)
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_bg(s7)
    add_header(s7, "6. Rastreabilidade Pericial e Próximas Etapas de Validação", "5:45 – 6:30 (45s)")
    add_footer(s7, 7)

    add_card(
        s7, 0.6, 1.40, 5.2, 5.45,
        "Infraestrutura Auditável & Validação Multiescala",
        [
            "Rigor de Engenharia de Software Científica:",
            "  • 270 testes automatizados validando a integridade geométrica, geodésica e radiométrica do pipeline;",
            "  • Regra Estrita Anti-Sintético: todo atributo carrega selo de proveniência (fonte oficial, satélite e data); ausência de dado nunca é inventada.",
            "Próximos Passos sobre os Pontos Selecionados:",
            "  • Campanha Duplo-Cega em Campo: exportação da planilha cega para vistoria presencial dos pontos do corredor Foz–Céu Azul;",
            "  • Sítios Padrão-Ouro com VANT/Drone: 4 polígonos contínuos (~50 ha cada) em Medianeira e Céu Azul com câmera multiespectral de 5 bandas (GSD 3 a 7,5 cm, RTK/PPK) para aferição final."
        ],
        cor_borda=C_NAVY_DARK, cor_bg=C_WHITE, cor_titulo=C_NAVY_DARK
    )

    add_app_placeholder(
        s7, 6.05, 1.40, 6.68, 5.45,
        num_print=5,
        titulo_print="Sítios de Voo de Drone (Padrão-Ouro) ou Dossiê de Auditoria",
        instrucao_captura="Sugestão de print: Mapa aproximado nos polígonos cianos dos Sítios Padrão-Ouro de Drone (Medianeira / Céu Azul ~50 ha) OU tela de Exportação da Planilha de Campo Cega / Selo de Proveniência.",
        legenda_rodape="Figura 5: Polígonos contínuos de referência para sobrevoo VANT/Drone e exportação auditável para campo."
    )

    add_notes(s7, (
        "[TEMPO: 5:45 a 6:30 — 45 segundos]\n"
        "Todo esse processo de seleção conta com 270 testes automatizados no código e um bloqueio estrito contra dados sintéticos: cada ponto selecionado gera um dossiê auditável com a data da imagem e a matrícula do CAR.\n"
        "Com os pontos de erosão provável já selecionados pelo sistema, nossas próximas etapas na pesquisa são a campanha presencial duplo-cega no corredor Foz–Céu Azul e o sobrevoo com drone multiespectral de precisão centimétrica em quatro sítios de referência de 50 hectares em Medianeira e Céu Azul."
    ))

    # =========================================================================
    # SLIDE 8: CONSIDERAÇÕES FINAIS & REFERÊNCIAS (6:30 - 7:00 | 30s)
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_bg(s8, C_NAVY_DARK)

    strip8 = s8.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.32), Inches(7.5))
    strip8.fill.solid()
    strip8.fill.fore_color.rgb = C_EMERALD_LT
    strip8.line.color.rgb = C_EMERALD_LT

    add_card(
        s8, 0.8, 0.65, 11.8, 2.75,
        "Considerações Finais & Contribuições do Projeto SAREL",
        [
            "Reprodutibilidade e Governança de Bacias: O SAREL entrega uma ferramenta pronta e transparente para localizar focos prováveis de erosão laminar na Bacia Hidrográfica do Paraná 3 com amparo nos limites legais do IBGE e hidrográficos do IAT.",
            "Redução de Custos de Campo: A triagem estratificada (18 estratos + Thinning Haversine) direciona o esforço de equipes técnicas e drones exatamente para as rampas agrícolas de maior risco.",
            "Impacto Regional: Apoio direto a programas de conservação de solo e água no Oeste do Paraná e proteção da vida útil do Reservatório de Itaipu."
        ],
        cor_borda=C_EMERALD_LT, cor_bg=C_NAVY_CARD, cor_titulo=C_EMERALD_LT
    )

    add_card(
        s8, 0.8, 3.65, 11.8, 2.35,
        "Referências Principais (Normas APA 7ª Edição)",
        [
            "Coelho, M. R., et al. (2024). Erodibilidade dos solos do Brasil (Documentos 246). Embrapa Solos.",
            "Dieckow, J., et al. (2009). Land use, tillage, texture and organic matter stock in Brazilian soils. European Journal of Soil Science, 60(2), 240–249.",
            "Durigon, V. L., et al. (2014). NDVI time series for monitoring RUSLE cover management factor. Int. Journal of Remote Sensing, 35(2), 441–453.",
            "Roberts, D. R., et al. (2017). Cross-validation strategies for data with spatial or temporal structure. Ecography, 40(8), 913–929.",
            "Tobler, W. R. (1970). A computer movie simulating urban growth in the Detroit region. Economic Geography, 46, 234–240."
        ],
        cor_borda=C_AMBER_LT, cor_bg=C_NAVY_CARD, cor_titulo=C_AMBER_LT
    )

    tb_ack = s8.shapes.add_textbox(Inches(0.8), Inches(6.20), Inches(11.8), Inches(0.9))
    p_ack = tb_ack.text_frame.paragraphs[0]
    p_ack.alignment = PP_ALIGN.CENTER
    p_ack.text = (
        "Agradecimentos: Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA — UTFPR Campus Medianeira) "
        "e Itaipu Parquetec pelo financiamento e apoio ao desenvolvimento tecnológico.\n"
        "Obrigado pela atenção!  •  Luis Alfredo da Silva (PPGTCA / UTFPR)"
    )
    p_ack.font.size = Pt(10.5)
    p_ack.font.bold = True
    p_ack.font.color.rgb = C_WHITE

    add_notes(s8, (
        "[TEMPO: 6:30 a 7:00 — 30 segundos]\n"
        "Concluindo, o arcabouço SAREL demonstra que é possível unir rigor estatístico, sensoriamento remoto gratuito e bases oficiais brasileiras para guiar a conservação de solos na Bacia do Paraná 3 com total rastreabilidade.\n"
        "Agradeço ao PPGTCA da UTFPR Campus Medianeira, ao meu orientador, ao Itaipu Parquetec pelo financiamento e apoio à pesquisa, e a todos vocês pela atenção. Muito obrigado!"
    ))

    for path in output_paths:
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        prs.save(path)
        print(f"Apresentação salva com sucesso em: {path}")


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out1 = os.path.join(base_dir, "docs", "Apresentacao_Simposio_7min_SAREL.pptx")
    out2 = os.path.join(base_dir, "Apresentacao_Simposio_7min_SAREL.pptx")
    criar_apresentacao_simposio([out1, out2])
