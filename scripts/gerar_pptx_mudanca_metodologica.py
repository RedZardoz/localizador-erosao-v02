# -*- coding: utf-8 -*-
"""
=============================================================================
GERADOR DE APRESENTAÇÃO EXECUTIVA DA MUDANÇA METODOLÓGICA RADICAL (PPTX)
Mestrado PPGTCA 2026 — Universidade Tecnológica Federal do Paraná (UTFPR)
Câmpus Medianeira • Apoio: Itaipu Parquetec
Autor: Luís Alfredo Ferreira da Silva (RedZardoz)
=============================================================================
"""

import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

# =============================================================================
# PALETA DE CORES INSTITUCIONAL MODERNA (16:9 Widescreen)
# =============================================================================
C_NAVY_DARK   = RGBColor(15, 23, 42)     # #0F172A (Slate 900)
C_NAVY_CARD   = RGBColor(30, 41, 59)     # #1E293B (Slate 800)
C_NAVY_LIGHT  = RGBColor(51, 65, 85)     # #334155 (Slate 700)
C_BG_LIGHT    = RGBColor(248, 250, 252)  # #F8FAFC (Slate 50)
C_WHITE       = RGBColor(255, 255, 255)  # #FFFFFF
C_BORDER      = RGBColor(203, 213, 225)  # #CBD5E1 (Slate 300)

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
C_ROSE_BG     = RGBColor(255, 241, 242)  # #FFF1F2

C_TEXT_DARK   = RGBColor(15, 23, 42)     # #0F172A
C_TEXT_BODY   = RGBColor(51, 65, 85)     # #334155
C_TEXT_MUTED  = RGBColor(100, 116, 139)  # #64748B
C_TEXT_LIGHT  = RGBColor(226, 232, 240)  # #E2E8F0

# Aliases de compatibilidade
C_CYAN_DARK    = C_CYAN_DK
C_EMERALD_DARK = C_EMERALD_DK
C_AMBER_DARK   = C_AMBER_DK
C_ROSE_DARK    = C_ROSE_DK


def criar_apresentacao_mudanca_metodologica(caminho_pptx):
    os.makedirs(os.path.dirname(os.path.abspath(caminho_pptx)), exist_ok=True)
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]
    TOTAL_SLIDES = 16

    def set_bg(slide, cor=C_BG_LIGHT):
        bg = slide.background
        fill = bg.fill
        fill.solid()
        fill.fore_color.rgb = cor

    def add_notes(slide, texto_roteiro):
        notes_slide = slide.notes_slide
        tf = notes_slide.notes_text_frame
        tf.text = texto_roteiro

    def add_header(slide, titulo, categoria="REFORMULAÇÃO METODOLÓGICA • SAREL v2.0 • PPGTCA 2026 / UTFPR"):
        bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.10))
        bar.fill.solid()
        bar.fill.fore_color.rgb = C_NAVY_DARK
        bar.line.color.rgb = C_NAVY_DARK

        tb_cat = slide.shapes.add_textbox(Inches(0.6), Inches(0.10), Inches(11.0), Inches(0.28))
        p_cat = tb_cat.text_frame.paragraphs[0]
        p_cat.text = categoria
        p_cat.font.size = Pt(9.5)
        p_cat.font.bold = True
        p_cat.font.color.rgb = C_EMERALD_LT

        tb_tit = slide.shapes.add_textbox(Inches(0.6), Inches(0.38), Inches(12.0), Inches(0.62))
        p_tit = tb_tit.text_frame.paragraphs[0]
        p_tit.text = titulo
        p_tit.font.size = Pt(19.0)
        p_tit.font.bold = True
        p_tit.font.color.rgb = C_WHITE

        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(1.08), Inches(13.333), Inches(0.04))
        line.fill.solid()
        line.fill.fore_color.rgb = C_EMERALD_MID
        line.line.color.rgb = C_EMERALD_MID

    def add_footer(slide, num_slide):
        tb_foot = slide.shapes.add_textbox(Inches(0.6), Inches(7.12), Inches(10.5), Inches(0.30))
        p_f = tb_foot.text_frame.paragraphs[0]
        p_f.text = "Pesquisa: Predição de Erosão Laminar na BP3 • Autor: Luís Alfredo Ferreira da Silva • Mestrado PPGTCA / UTFPR"
        p_f.font.size = Pt(8.5)
        p_f.font.color.rgb = C_TEXT_MUTED

        tb_num = slide.shapes.add_textbox(Inches(11.5), Inches(7.12), Inches(1.2), Inches(0.30))
        p_n = tb_num.text_frame.paragraphs[0]
        p_n.alignment = PP_ALIGN.RIGHT
        p_n.text = f"{num_slide} / {TOTAL_SLIDES}"
        p_n.font.size = Pt(8.5)
        p_n.font.bold = True
        p_n.font.color.rgb = C_EMERALD_DK

    def add_card(slide, left, top, width, height, titulo, itens, cor_borda=C_EMERALD_MID, cor_bg=C_WHITE, cor_titulo=C_NAVY_DARK):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = cor_bg
        card.line.color.rgb = cor_borda
        card.line.width = Pt(1.2)

        strip = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, Inches(0.40))
        strip.fill.solid()
        strip.fill.fore_color.rgb = cor_borda
        strip.line.color.rgb = cor_borda
        p_st = strip.text_frame.paragraphs[0]
        p_st.alignment = PP_ALIGN.CENTER
        p_st.text = titulo
        p_st.font.size = Pt(10.5)
        p_st.font.bold = True
        p_st.font.color.rgb = C_WHITE

        tb = slide.shapes.add_textbox(left + Inches(0.15), top + Inches(0.45), width - Inches(0.30), height - Inches(0.50))
        tf = tb.text_frame
        tf.word_wrap = True

        for idx, it in enumerate(itens):
            p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
            p.text = f"• {it}" if not it.startswith("►") and not it.startswith("✓") else it
            p.font.size = Pt(9.0)
            p.font.color.rgb = C_TEXT_BODY
            p.space_after = Pt(3)

    # -------------------------------------------------------------------------
    # SLIDE 1: CAPA PRINCIPAL
    # -------------------------------------------------------------------------
    s1 = prs.slides.add_slide(blank_layout)
    set_bg(s1, C_NAVY_DARK)

    # Faixa lateral decorativa
    side_strip = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.35), Inches(7.5))
    side_strip.fill.solid()
    side_strip.fill.fore_color.rgb = C_EMERALD_MID
    side_strip.line.color.rgb = C_EMERALD_MID

    tb_meta = s1.shapes.add_textbox(Inches(1.0), Inches(1.2), Inches(11.0), Inches(0.5))
    p_meta = tb_meta.text_frame.paragraphs[0]
    p_meta.text = "UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ • PPGTCA 2026 • APOIO: ITAIPU PARQUETEC"
    p_meta.font.size = Pt(11)
    p_meta.font.bold = True
    p_meta.font.color.rgb = C_EMERALD_LT

    tb_t = s1.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11.5), Inches(2.2))
    p_t = tb_t.text_frame.paragraphs[0]
    p_t.text = "REFORMULAÇÃO METODOLÓGICA RADICAL DO SAREL (v2.0)"
    p_t.font.size = Pt(28)
    p_t.font.bold = True
    p_t.font.color.rgb = C_WHITE

    p_sub = tb_t.text_frame.add_paragraph()
    p_sub.text = "Da Amostragem Heurística ao Padrão Ouro de Sensoriamento Remoto Multiescala, Desenho Fatorial e Blindagem Anti-Viés na Bacia do Paraná 3"
    p_sub.font.size = Pt(14)
    p_sub.font.color.rgb = C_BORDER
    p_sub.space_before = Pt(8)

    # Linha separadora
    sep = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.0), Inches(4.3), Inches(11.0), Inches(0.04))
    sep.fill.solid()
    sep.fill.fore_color.rgb = C_EMERALD_MID
    sep.line.color.rgb = C_EMERALD_MID

    tb_autor = s1.shapes.add_textbox(Inches(1.0), Inches(4.6), Inches(11.0), Inches(1.8))
    tf_a = tb_autor.text_frame
    p_a1 = tf_a.paragraphs[0]
    p_a1.text = "Autor: Luís Alfredo Ferreira da Silva (RedZardoz)"
    p_a1.font.size = Pt(12)
    p_a1.font.bold = True
    p_a1.font.color.rgb = C_WHITE

    p_a2 = tf_a.add_paragraph()
    p_a2.text = "Pesquisa: Metodologia Híbrida de Localização e Predição de Erosão Laminar em Lavouras de Plantio Direto"
    p_a2.font.size = Pt(10.5)
    p_a2.font.color.rgb = C_TEXT_LIGHT

    p_a3 = tf_a.add_paragraph()
    p_a3.text = "Auditoria Formal: Setembro/Outubro de 2026 • 54 Suítes de Testes Automatizados • Versão Canônica v2.0"
    p_a3.font.size = Pt(9.5)
    p_a3.font.color.rgb = C_EMERALD_LT
    p_a3.space_before = Pt(6)

    add_notes(s1, "Apresentação formal da reestruturação metodológica e epistemológica do SAREL v2.0. "
                  "Explique a transição entre o paradigma v1 (baseado em amostragem ad-hoc e fotointerpretação a 10m) "
                  "e o paradigma v2 (amostragem probabilística estratificada em 18 estratos biofísicos com VANT como Padrão Ouro).")

    # -------------------------------------------------------------------------
    # SLIDE 2: RESUMO EXECUTIVO DA MUDANÇA
    # -------------------------------------------------------------------------
    s2 = prs.slides.add_slide(blank_layout)
    set_bg(s2)
    add_header(s2, "Resumo Executivo da Mudança Radical: Por Que a Metodologia Mudou?")
    add_footer(s2, 2)

    add_card(s2, Inches(0.6), Inches(1.4), Inches(5.8), Inches(5.4),
             "PARADIGMA ANTERIOR (v1.0) — VULNERÁVEL",
             [
                 "Amostragem Intencional: Coleta focada onde havia suspeita visual de erosão (BSI alto).",
                 "Rótulo por Fotointerpretação: Observador humano tentava identificar erosão laminar no pixel de 10 m do Sentinel-2.",
                 "GPS Sem Aferição: Coletas de campo com GPS de celular (CE90 de 3 a 8 m; acerto posicional < 37%).",
                 "Confusão de Suporte Espacial: Pixels de 30m do DEM e manchas 1:250k de solo replicados como células de 10m.",
                 "Imputação Numérica Silenciosa: Desmascaramento com zero nulo, cortes artificiais com max/min e defaults arbitrários.",
                 "Risco Iminente: Reprovação em banca de qualificação por circularidade amostral e viés de confirmação."
             ], C_ROSE_DK, C_ROSE_BG)

    add_card(s2, Inches(6.8), Inches(1.4), Inches(5.8), Inches(5.4),
             "PARADIGMA ATUAL (v2.0) — RIGOR CIENTÍFICO",
             [
                 "Padrão Ouro Centimétrico: VANT Multiespectral (GSD ~3,8 cm, CE90 = 1,47 m) como massa de treino e teste.",
                 "Estratificação Fatorial: 18 estratos biofísicos canônicos (Ŝ relevo x Ê exposição x K̂ solo) com pi_i conhecido.",
                 "Desenho Fundiário Real: 72 polígonos de 5,02 ha ajustados aos minifúndios da BP3 (71,8% de elegibilidade).",
                 "Suporte Nativo Declarado: Preditores respeitam sua resolução nativa; tetos estritos por bloco contra overfitting (EPV >= 20).",
                 "Guarda Temporal Estrita: Modelo D (detecção t0) segregado do Modelo P (predição prospectiva com 2 anos de guarda).",
                 "Linha de Base RUSLE Desbloqueada: Equações completas conferidas na fonte primária (D01, D13, D14, D15) sob Invariante 1."
             ], C_EMERALD_DK, C_MINT_BG)

    add_notes(s2, "Destaque o contraste claro entre a vulnerabilidade do modelo v1 e a solidez do modelo v2. "
                  "A mudança não foi um ajuste estético, mas uma refundação científica para eliminar qualquer risco de "
                  "circularidade, pseudorreplicação e ruído de rotulagem.")

    # -------------------------------------------------------------------------
    # SLIDE 3: AS QUATRO FRAGILIDADES ESTRUTURAIS DA v1
    # -------------------------------------------------------------------------
    s3 = prs.slides.add_slide(blank_layout)
    set_bg(s3)
    add_header(s3, "Diagnóstico da Auditoria: As Quatro Falhas Estruturais da v1")
    add_footer(s3, 3)

    add_card(s3, Inches(0.6), Inches(1.4), Inches(5.8), Inches(2.6),
             "1. CIRCULARIDADE E VIÉS DE CONFIRMAÇÃO",
             [
                 "A amostragem selecionava pontos onde índices espectrais (BSI/NDVI) já indicavam solo degradado.",
                 "O modelo aprendia a imitar a regra de seleção do pesquisador, e não o fenômeno biofísico de erosão.",
                 "Totalmente indefensável perante banca examinadora de estatística ou sensoriamento remoto."
             ], C_ROSE_DK, C_WHITE)

    add_card(s3, Inches(6.8), Inches(1.4), Inches(5.8), Inches(2.6),
             "2. A FALÁCIA DO PIXEL ORBITAL DE 10 METROS",
             [
                 "Erosão laminar manifesta-se como microrrelevo métrico e decapagem difusa do horizonte superficial.",
                 "Em 100 m² (célula Sentinel-2), o sinal mistura palhada, solo e biomassa vizinha.",
                 "Fotointerpretação humana a 10m injetava ruído massivo de rotulagem e alta discordância."
             ], C_ROSE_DK, C_WHITE)

    add_card(s3, Inches(0.6), Inches(4.2), Inches(5.8), Inches(2.6),
             "3. CONFUSÃO DE SUPORTE ESPACIAL (MAUP)",
             [
                 "DEM de 30m e polígonos de solo 1:250k eram injetados como se fossem 36.000 medições a 10m.",
                 "Pseudorreplicação grave: inflava artificialmente graus de liberdade no treinamento de ensembles.",
                 "Tratar dados de resoluções discrepantes como idênticos viola o princípio fundamental do suporte espacial."
             ], C_AMBER_DK, C_WHITE)

    add_card(s3, Inches(6.8), Inches(4.2), Inches(5.8), Inches(2.6),
             "4. PRÁTICAS DE IMPUTAÇÃO E PISOS ARTIFICIAIS",
             [
                 "Desmascaramento forçado transformava ausência de dado em 'sem erosão', criando falsos negativos.",
                 "Cortes arbitrários com funções de piso e teto mascaravam inconsistências das fórmulas.",
                 "Falta de rastreabilidade de proveniência impedia saber a origem real de cada número no banco."
             ], C_AMBER_DK, C_WHITE)

    add_notes(s3, "Explique detalhadamente cada uma das quatro falhas. Mostre que o autor teve a coragem acadêmica de auditar "
                  "seu próprio trabalho com honestidade brutal antes que a banca o fizesse.")

    # -------------------------------------------------------------------------
    # SLIDE 4: A GRANDE INVERSÃO DE PAPÉIS (D16)
    # -------------------------------------------------------------------------
    s4 = prs.slides.add_slide(blank_layout)
    set_bg(s4)
    add_header(s4, "A Grande Inversão Epistemológica: VANT Promovido a Padrão Ouro (D16)")
    add_footer(s4, 4)

    add_card(s4, Inches(0.6), Inches(1.4), Inches(3.8), Inches(5.4),
             "VANT MULTIESPECTRAL",
             [
                 "► PAPEL ANTERIOR:",
                 "Held-out secundário de validação.",
                 "",
                 "► NOVO PAPEL CANÔNICO:",
                 "<b>MASSA PRINCIPAL DE TREINO E TESTE INDEPENDENTE</b>.",
                 "",
                 "► POR QUE?",
                 "Única fonte com resolução centimétrica capaz de delinear manchas reais de erosão laminar.",
                 "Elimina a subjetividade humana da fotointerpretação orbital.",
                 "Acurácia posicional CE90 = 1,47 m garante acerto de 78% na célula de 10m."
             ], C_EMERALD_DK, C_MINT_BG)

    add_card(s4, Inches(4.7), Inches(1.4), Inches(3.8), Inches(5.4),
             "PONTOS DE CAMPO (APP)",
             [
                 "► PAPEL ANTERIOR:",
                 "Massa de treino principal dispersa.",
                 "",
                 "► NOVO PAPEL CANÔNICO:",
                 "<b>ÂNCORA DE PREVALÊNCIA E CALIBRAÇÃO PROSPECTIVA</b>.",
                 "",
                 "► POR QUE?",
                 "GPS de smartphone tem erro de 3 a 8 m (acerto < 37% na célula de 10m).",
                 "Usar campo para treinar injetaria erro de deslocalização espacial no modelo.",
                 "Campo passa a calibrar a prevalência real sob protocolo cego duplo."
             ], C_CYAN_DARK, C_CYAN_BG)

    add_card(s4, Inches(8.8), Inches(1.4), Inches(3.8), Inches(5.4),
             "FOTOINTERPRETAÇÃO 10m",
             [
                 "► PAPEL ANTERIOR:",
                 "Rótulo de verdade terrestre na Fase A.",
                 "",
                 "► NOVO PAPEL CANÔNICO:",
                 "<b>APOSENTADA DEFINITIVAMENTE</b>.",
                 "",
                 "► POR QUE?",
                 "Resolução de 10m não permite discernir erosão incipiente de variação espectral de solo.",
                 "Custaria dois intérpretes e maquinário de concordância para gerar rótulo inferior.",
                 "O sorteio dos 72 polígonos de VANT cobre todo o espaço de covariáveis."
             ], C_ROSE_DK, C_ROSE_BG)

    add_notes(s4, "Este é o slide central da inversão metodológica. Explique como a Decisão D16 inverteu os papéis "
                  "para colocar a melhor tecnologia de observação (o VANT centimétrico) no núcleo do treinamento e teste.")

    # -------------------------------------------------------------------------
    # SLIDE 5: ESPECIFICAÇÕES DO VANT MULTIESPECTRAL
    # -------------------------------------------------------------------------
    s5 = prs.slides.add_slide(blank_layout)
    set_bg(s5)
    add_header(s5, "O Padrão Ouro Centimétrico: VANT Nuvem UAV Spectral 2")
    add_footer(s5, 5)

    add_card(s5, Inches(0.6), Inches(1.4), Inches(5.8), Inches(5.4),
             "PARÂMETROS TÉCNICOS MEDIDOS EM VOO",
             [
                 "► Aeronave: VANT Asa Fixa Nuvem UAV Spectral 2 com RTK pós-processado.",
                 "► Sensor Multiespectral: Micasense Altum com 5 bandas óticas calibradas:",
                 "   • Azul (475 nm), Verde (560 nm), Vermelho (668 nm)",
                 "   • RedEdge (717 nm) e Infravermelho Próximo NIR (842 nm)",
                 "► Resolução Espacial no Terreno (GSD Medido):",
                 "   • 3,59 cm/pixel (Missão 009 - Céu Azul)",
                 "   • 3,96 cm/pixel (Missão 010 - Medianeira)",
                 "► Acurácia Posicional Horizontal (CE90):",
                 "   • <b>1,47 metros</b> medidos contra pontos de controle terrestres.",
                 "► Produtividade de Mapeamento:",
                 "   • 2,3 ha/minuto a 120 metros de altitude de voo AGL.",
                 "   • Tempo de voo por polígono de 5,02 ha: ~2,2 minutos."
             ], C_NAVY_DARK, C_WHITE)

    add_card(s5, Inches(6.8), Inches(1.4), Inches(5.8), Inches(5.4),
             "IMPACTO NA QUALIDADE DO RÓTULO SUPERVISIONADO",
             [
                 "► Resolução Centimétrica vs Decamétrica:",
                 "   • A 4 cm, microrravinas, canais de erosão laminar e crostas de solo são visíveis diretamente sem inferência.",
                 "   • A máscara de erosão é delineada com polígonos vetoriais contínuos de alta precisão.",
                 "",
                 "► Mitigação do Erro de Deslocalização Espacial:",
                 "   • GPS de smartphone (erro 3-8m) => Acerto na célula de 10m: <b>~37%</b>.",
                 "   • Ortomosaico VANT (erro 1,47m) => Acerto na célula de 10m: <b>~78%</b>.",
                 "   • O salto de qualidade viabiliza pela primeira vez um classificador verdadeiramente supervisionado.",
                 "",
                 "► Rastreabilidade Fotogramétrica:",
                 "   • Calibração radiométrica com painel refletivo antes e após cada voo.",
                 "   • Sensor de irradiância solar (DLS 2) para correção de variações de luminosidade."
             ], C_EMERALD_DK, C_MINT_BG)

    add_notes(s5, "Apresente as especificações empíricas do VANT. Os números de GSD, CE90 e produtividade não são teóricos, "
                  "mas saíram das missões de voo reais já executadas em Céu Azul e Medianeira e arquivadas no repositório.")

    # -------------------------------------------------------------------------
    # SLIDE 6: ESTRATIFICAÇÃO BIOFÍSICA EM 18 ESTRATOS
    # -------------------------------------------------------------------------
    s6 = prs.slides.add_slide(blank_layout)
    set_bg(s6)
    add_header(s6, "Desenho Amostral: Matriz Fatorial em 18 Estratos Canônicos (D12)")
    add_footer(s6, 6)

    add_card(s6, Inches(0.6), Inches(1.4), Inches(3.8), Inches(5.4),
             "EIXO Ŝ — ENERGIA TOPOGRÁFICA",
             [
                 "Fonte: Copernicus DEM GLO-30 a 30m nativo.",
                 "Partição: 3 tercis empíricos de declividade (%):",
                 "",
                 "► Ŝ1 (Suave Ondulado):",
                 "   Declividade < 5% (baixa energia potencial de fluxo).",
                 "",
                 "► Ŝ2 (Ondulado Médio):",
                 "   5% <= Declividade < 10% (faixa de transição do Sistema Plantio Direto).",
                 "",
                 "► Ŝ3 (Ondulado Forte):",
                 "   Declividade >= 10% (alta suscetibilidade a escoamento superficial concentrado)."
             ], C_CYAN_DARK, C_CYAN_BG)

    add_card(s6, Inches(4.7), Inches(1.4), Inches(3.8), Inches(5.4),
             "EIXO Ê — EXPOSIÇÃO DO SOLO",
             [
                 "Fonte: Frequência de solo nu Sentinel-2 L2A (2018-2023).",
                 "Critério: Mínimo 6 observações válidas/ano (D11).",
                 "",
                 "► Ê1 (Baixa Exposição):",
                 "   Frequência < 15% de solo nu (lavouras com excelente cobertura permanente e palhada).",
                 "",
                 "► Ê2 (Média Exposição):",
                 "   15% <= Frequência < 30% (janela típica de dessecação entre safras).",
                 "",
                 "► Ê3 (Alta Exposição):",
                 "   Frequência >= 30% (manejo inadequado ou solos frequentemente descobertos)."
             ], C_AMBER_DK, C_AMBER_BG)

    add_card(s6, Inches(8.8), Inches(1.4), Inches(3.8), Inches(5.4),
             "EIXO K̂ — ERODIBILIDADE DO SOLO",
             [
                 "Fonte: Campo k_solos da Carta de Erodibilidade Embrapa 2024 (D14).",
                 "Partição: 2 níveis canônicos (D09):",
                 "",
                 "► K̂1 (Baixa / Muito Baixa):",
                 "   k_solos <= 0,015 t.h/(MJ.mm) (Latossolos Vermelhos argilosos e muito argilosos).",
                 "",
                 "► K̂2 (Média / Alta):",
                 "   k_solos > 0,015 t.h/(MJ.mm) (Nitossolos, Neossolos Regolíticos e solos com textura média).",
                 "",
                 "TOTAL: 3 x 3 x 2 = <b>18 ESTRATOS CANÔNICOS</b>."
             ], C_EMERALD_DK, C_MINT_BG)

    add_notes(s6, "Explique a partição biofísica tridimensional. Mostre que os 18 estratos cobrem todo o espaço "
                  "ortogonal de relevo, manejo/tempo de exposição e tipo de solo da Bacia do Paraná 3.")

    # -------------------------------------------------------------------------
    # SLIDE 7: DESENHO FUNDIÁRIO E ELEGIBAILIDADE (72 POLÍGONOS)
    # -------------------------------------------------------------------------
    s7 = prs.slides.add_slide(blank_layout)
    set_bg(s7)
    add_header(s7, "Ajuste Fundiário aos Minifúndios: 72 Polígonos de 5,02 ha (D16)")
    add_footer(s7, 7)

    add_card(s7, Inches(0.6), Inches(1.4), Inches(5.8), Inches(5.4),
             "O DILEMA FUNDIÁRIO DA BACIA DO PARANÁ 3",
             [
                 "► Estrutura Fundiária da BP3 (73.643 Imóveis no CAR):",
                 "   • Mediana de área dos imóveis rurais: <b>11,7 hectares</b>.",
                 "   • Perfil típico de minifúndio e agricultura familiar.",
                 "",
                 "► A Proposta Original (10 ha em Quadrado de 316 x 316 m):",
                 "   • Exigia que o polígono coubesse num único imóvel (para permitir autorização de voo).",
                 "   • Medição sobre banco fundiário revelou: apenas <b>43,4%</b> dos imóveis eram elegíveis.",
                 "   • Exclusão de 57% da bacia gerava viés grave em direção a grandes proprietários.",
                 "",
                 "► A Solução Técnica (Polígonos de 5,02 ha):",
                 "   • Quadrado de 224 x 224 m ou retângulos até 1:2 (ex.: 160 x 314 m).",
                 "   • A elegibilidade salta para <b>71,8%</b> dos imóveis rurais da bacia.",
                 "   • Redução drástica da exclusão amostral de 57% para 28%."
             ], C_AMBER_DK, C_AMBER_BG)

    add_card(s7, Inches(6.8), Inches(1.4), Inches(5.8), Inches(5.4),
             "ALOCAÇÃO AMOSTRAL E BALANCEAMENTO TREINO/TESTE",
             [
                 "► Distribuição da Amostra:",
                 "   • <b>4 polígonos por estrato</b> sobre os 18 estratos biofísicos.",
                 "   • Total de <b>72 polígonos de VANT</b> mapeados na bacia.",
                 "   • Área total: 361 hectares (idêntica à proposta original de 360 ha).",
                 "",
                 "► Balanceamento Rigoroso Treino / Teste (Held-out):",
                 "   • De cada quarteto de estrato, <b>2 vão para Treino</b> e <b>2 para Teste</b>.",
                 "   • Garante que tanto o treino quanto o teste tenham réplicas dentro de TODOS os 18 estratos.",
                 "   • Permite calcular a variância entre paisagens dentro do mesmo estrato.",
                 "",
                 "► Probabilidade de Inclusão pi_i Registrada:",
                 "   • Cada polígono sorteado carrega pi_i conhecido (Cochran, 1977).",
                 "   • Garante estimativas populacionais não viciadas (Horvitz-Thompson)."
             ], C_EMERALD_DK, C_MINT_BG)

    add_notes(s7, "Mostre como a matemática resolveu um problema logístico e ético real: o tamanho de 5,02 ha permitiu "
                  "que pequenos produtores pudessem participar do sorteio, evitando o viés elitista de só amostrar grandes fazendas.")

    # -------------------------------------------------------------------------
    # SLIDE 8: SUPORTE ESPACIAL NATIVO E AUTOCORRELAÇÃO
    # -------------------------------------------------------------------------
    s8 = prs.slides.add_slide(blank_layout)
    set_bg(s8)
    add_header(s8, "Suporte Espacial Nativo e Autocorrelação (D06 & D24)")
    add_footer(s8, 8)

    add_card(s8, Inches(0.6), Inches(1.4), Inches(5.8), Inches(5.4),
             "AUTOCORRELAÇÃO ESPACIAL E UNIDADES EFETIVAS",
             [
                 "► O Problema da Dependência Espacial:",
                 "   • Pixels contíguos de 10m não são observações estatisticamente independentes.",
                 "   • Em 5,02 ha existem ~500 células de 10m, mas elas apresentam autocorrelação.",
                 "",
                 "► Alcance de Autocorrelação Medido:",
                 "   • Variogramas empíricos na BP3 indicam alcance prático de <b>50 metros</b>.",
                 "   • Células separadas por menos de 50m compartilham sinal de vertente e solo.",
                 "",
                 "► Unidades Espacialmente Independentes por Polígono:",
                 "   • Bloco Espectro-Temporal (10m): <b>~51 unidades efetivas</b> por polígono.",
                 "   • Bloco de Terreno (30m): <b>~11 unidades efetivas</b> por polígono.",
                 "   • Bloco Pedológico (Carta 1:250k): <b>~1 unidade efetiva</b> por polígono.",
                 "",
                 "► Total Populacional da Campanha:",
                 "   • 72 polígonos x 51 unidades = <b>~1.845 unidades independentes</b> no conjunto todo."
             ], C_CYAN_DARK, C_CYAN_BG)

    add_card(s8, Inches(6.8), Inches(1.4), Inches(5.8), Inches(5.4),
             "DECLARAÇÃO MANDATÓRIA DO SUPORTE NATIVO",
             [
                 "► Fim da Reamostragem Simulada (D06):",
                 "   • A unidade de predição é a célula de 10m do Sentinel-2.",
                 "   • Porém, É VEDADO reamostrar MDE de 30m para fingir resolução de 10m.",
                 "   • Cada covariável carrega no metadado o suporte espacial de sua fonte.",
                 "",
                 "► Consequência Estatística Decisiva:",
                 "   • Reconhecer que há apenas 11 unidades de terreno por polígono impede inflar artificialmente o peso do relevo.",
                 "   • Evita que o algoritmo aprenda relações espúrias baseadas em pseudorreplicação.",
                 "",
                 "► Alinhamento com a Teoria da Amostragem Espacial:",
                 "   • Conforme Cressie (1993) e Legendre (1993), a inferência estatística sobre dados espaciais só é válida se a estrutura de covariância for respeitada."
             ], C_NAVY_DARK, C_WHITE)

    add_notes(s8, "Explique o conceito de unidades espacialmente independentes. Mostre que o SAREL v2.0 não comete o erro ingênuo "
                  "de tratar 36.000 pixels como 36.000 amostras independentes.")

    # -------------------------------------------------------------------------
    # SLIDE 9: CONTROLE DE OVERFITTING E TETO POR BLOCO (D24)
    # -------------------------------------------------------------------------
    s9 = prs.slides.add_slide(blank_layout)
    set_bg(s9)
    add_header(s9, "Controle de Overfitting: Tetos por Bloco e Regra EPV >= 20 (D24)")
    add_footer(s9, 9)

    add_card(s9, Inches(0.6), Inches(1.4), Inches(5.8), Inches(5.4),
             "CRITÉRIO EPV DE VAN DER PLOEG ET AL. (2014)",
             [
                 "► Regra de Ouro da Modelagem Preditiva:",
                 "   • <i>Events Per Variable (EPV)</i> >= 20 para modelos de árvore (XGBoost / Random Forest).",
                 "   • Para cada preditor inserido no modelo, exige-se no mínimo 20 eventos positivos independentes.",
                 "",
                 "► Orçamento Amostral da Pesquisa:",
                 "   • Com ~1.845 unidades independentes e prevalência esperada de 10% a 15%:",
                 "   • Número de positivos independentes esperados: <b>~200 eventos</b>.",
                 "   • Dividido por 2 (treino held-out 50/50): <b>~100 eventos de treino</b>.",
                 "",
                 "► Teto Máximo Global de Preditores:",
                 "   • 100 eventos / 20 EPV = <b>Máximo de 5 a 8 preditores principais</b>.",
                 "   • Tentar ajustar modelos com 30 ou 40 preditores geraria memorização espúria e colapso na generalização."
             ], C_ROSE_DK, C_ROSE_BG)

    add_card(s9, Inches(6.8), Inches(1.4), Inches(5.8), Inches(5.4),
             "TETOS NORMATIVOS POR BLOCO (DECISÃO D24)",
             [
                 "► Bloco Espectro-Temporal (Sentinel-2 L2A):",
                 "   • <b>TETO MÁXIMO: 8 PREDITORES</b>",
                 "   • Variáveis autorizadas: B12 (SWIR-2), B11 (SWIR-1), B4 (Red), B8 (NIR), BSI, NDVI, Frequência Nu e Persistência.",
                 "",
                 "► Bloco de Terreno (Copernicus DEM 30m):",
                 "   • <b>TETO MÁXIMO: 4 PREDITORES</b>",
                 "   • Variáveis autorizadas: Declividade, Índice de Umidade Topográfica (TWI), Curvatura e Elevação.",
                 "",
                 "► Bloco de Solo e Clima:",
                 "   • <b>1 preditor de erodibilidade (k_solos)</b> e <b>1 regional de chuva (R)</b>.",
                 "",
                 "► Garantia de Generalização:",
                 "   • O teto normativo blinda o mestrado contra o clássico erro de 'pesca de correlações' (p-hacking)."
             ], C_EMERALD_DK, C_MINT_BG)

    add_notes(s9, "A regra EPV >= 20 e o teto por bloco da Decisão D24 são proteções técnicas contra o vício comum "
                  "em IA agrícola de colocar 50 variáveis em um XGBoost e achar que obteve 99% de acurácia.")

    # -------------------------------------------------------------------------
    # SLIDE 10: SEPARAÇÃO FUNCIONAL MODELO D VS MODELO P (D04)
    # -------------------------------------------------------------------------
    s10 = prs.slides.add_slide(blank_layout)
    set_bg(s10)
    add_header(s10, "Separação Funcional: Modelo D vs Modelo P com Guarda Temporal (D04)")
    add_footer(s10, 10)

    add_card(s10, Inches(0.6), Inches(1.4), Inches(5.8), Inches(5.4),
             "MODELO D — DETECÇÃO CONTEMPORÂNEA (t0)",
             [
                 "► Objetivo Científico e Prático:",
                 "   • Mapear feições ativas e cicatrizes de erosão presentes no momento do voo.",
                 "",
                 "► Janela Temporal dos Preditores:",
                 "   • Imagens e índices contemporâneos à data do sobrevoo de VANT ($t_0$).",
                 "   • Combina bandas espectrais de curto prazo (SWIR B12, BSI, NDVI contemporâneo).",
                 "",
                 "► Utilidade Agronômica:",
                 "   • Fiscalização ambiental, auditoria de conservação de estradas rurais e mapeamento pós-chuva crítica.",
                 "",
                 "► Relação Causal:",
                 "   • O sinal reflete o dano físico já consumado no solo."
             ], C_CYAN_DARK, C_CYAN_BG)

    add_card(s10, Inches(6.8), Inches(1.4), Inches(5.8), Inches(5.4),
             "MODELO P — PREDIÇÃO PROSPECTIVA COM GUARDA (t0 - 24m)",
             [
                 "► Objetivo Científico e Prático:",
                 "   • Predizer a suscetibilidade a erosão ANTES que as ravinas se formem.",
                 "",
                 "► INTERVALO DE GUARDA TEMPORAL ESTRITO (2 ANOS):",
                 "   • Todos os preditores são encerrados <b>24 meses antes</b> da data de avaliação ($t_0 - 24\\text{ meses}$).",
                 "   • Elimina vazamento temporal de dados (<i>temporal data leakage</i>, Kaufman et al., 2012).",
                 "",
                 "► Coincidência com a Rotação Bienal do SPD:",
                 "   • 24 meses cobrem o ciclo completo Soja/Milho Safrinha/Trigo/Adubação Verde (Franchini et al., 2011).",
                 "   • Avalia se o histórico acumulado de manejo explica a ocorrência de erosão futura."
             ], C_EMERALD_DK, C_MINT_BG)

    add_notes(s10, "Explique a genialidade da guarda temporal de 2 anos: impede que uma imagem tirada 2 dias antes do evento "
                  "vaze a informação da terra já mexida, forçando o Modelo P a ser uma ferramenta real de prevenção agronômica.")

    # -------------------------------------------------------------------------
    # SLIDE 11: A LINHA DE BASE FÍSICA RUSLE DESBLOQUEADA
    # -------------------------------------------------------------------------
    s11 = prs.slides.add_slide(blank_layout)
    set_bg(s11)
    add_header(s11, "A Linha de Base Física RUSLE Desbloqueada (D01, D13, D14, D15)")
    add_footer(s11, 11)

    add_card(s11, Inches(0.6), Inches(1.4), Inches(12.0), Inches(5.4),
             "EQUAÇÃO UNIVERSAL DE PERDA DE SOLO REVISADA: A = R · K · LS · C · P [t/ha/ano]",
             [
                 "► FATOR C (USO E MANEJO) — Decisão D01 (Durigon et al., 2014):",
                 "   • Fórmula linear canônica: C = (1 - NDVI) / 2, concebida para séries temporais tropicais sem corte artificial.",
                 "   • Modulação híbrida por BSI para discriminar solo mineral exposto de palhada protetora do Plantio Direto.",
                 "",
                 "► FATOR P (PRÁTICAS CONSERVACIONISTAS) — Renard et al. (1997, USDA AH 703):",
                 "   • Valor padrão conservador: P = 1,0 (tabelado) para ausência de terraço cadastrado. NUNCA medido.",
                 "",
                 "► FATOR K (ERODIBILIDADE) — Decisão D14 emendada (Embrapa Solos 2024, Doc. 246):",
                 "   • Leitura contínua do campo k_solos oficial da carta geonode:bra_erodibilidade_2024_sirgas2000.",
                 "   • Proibição estrita de k_solos = 0 (áreas urbanas/água forçam status 'fora-do-dominio', e não K=0).",
                 "",
                 "► FATOR R (EROSIVIDADE DA CHUVA) — Decisão D13 (Rufino et al., 1993; Waltrick et al., 2015):",
                 "   • Equação regional do Paraná: EI30_m = 107,52 + 46,89 * (p_m^2 / P_anual) sobre CHIRPS 0,05° climatológico.",
                 "   • Sucedâneo formal declarado do EI30 contínuo de 30 minutos (limitação metodológica expressa).",
                 "",
                 "► FATOR LS (TOPOGRÁFICO 2D) — Decisão D15 (Desmet & Govers, 1996; Renard et al., 1997 AH 703):",
                 "   • Algoritmo bidimensional de área de contribuição específica sobre Copernicus DEM GLO-30 nativo de 30 m.",
                 "   • Expoente m dependente da declividade e fator de rampa S analítico (Eqs. [4-2] a [4-5], pp. 105-107).",
                 "   • Distorção de escala linear da projeção UTM 22S medida no extremo oeste da BP3: 0,11% (< 0,5% tolerância)."
             ], C_NAVY_DARK, C_WHITE)

    add_notes(s11, "Apresente os cinco fatores da RUSLE. Destaque que todos foram extraídos de suas obras primárias "
                  "(todas arquivadas em docs/verificacoes/fontes) e integrados nativamente no código sem mocks.")

    # -------------------------------------------------------------------------
    # SLIDE 12: INVARIANTE 1 E BLINDAGEM DE CÁLCULO
    # -------------------------------------------------------------------------
    s12 = prs.slides.add_slide(blank_layout)
    set_bg(s12)
    add_header(s12, "Invariante 1: Perda de Solo Sem Imputação ou Corte Artificial")
    add_footer(s12, 12)

    add_card(s12, Inches(0.6), Inches(1.4), Inches(5.8), Inches(5.4),
             "A REGRA INVIOLÁVEL DO INVARIANTE 1",
             [
                 "► Definição Formal da Lei Fundamental:",
                 "   • 'perdaSolo só existe se TODOS os cinco fatores (R, K, LS, C, P) e a memória de cálculo existirem simultaneamente com valores finitos positivos.'",
                 "",
                 "► Comportamento com Todos os Fatores Providos:",
                 "   • perdaSolo recebe proveniência 'modelado'.",
                 "   • Registra as decisões ativas: ['D01', 'D13', 'D14', 'D15'].",
                 "   • Gera memória de cálculo auditável: 'RUSLE A = R * K * LS * C * P = ... t/ha/ano'.",
                 "",
                 "► Comportamento na Falha de Qualquer Fator:",
                 "   • perdaSolo é obrigatoriamente <b>indisponivel</b>.",
                 "   • Agrega e reporta honestamente as causas pendentes: 'insuficiente', 'fora-do-dominio' ou 'decisao-pendente'.",
                 "   • Proibição de preenchimento artificial com zeros ou médias."
             ], C_EMERALD_DK, C_MINT_BG)

    add_card(s12, Inches(6.8), Inches(1.4), Inches(5.8), Inches(5.4),
             "AUDITORIA CONTRA EFEITOS DE BORDA E PITS TOPOGRÁFICOS",
             [
                 "► Tratamento de Células de Borda Truncada (D15 / P12):",
                 "   • Células localizadas no limite do tile DEM ou da bacia hidrográfica não possuem bacia de drenagem a montante integrável.",
                 "   • O sistema recusa calcular LS e devolve status 'indisponivel' com causa 'fora-do-dominio'.",
                 "",
                 "► Tratamento de Depressões Sem Saída (Pit Cells):",
                 "   • Células de afundamento topográfico onde o fluxo superficial é interrompido.",
                 "   • O SAREL v2.0 proíbe o 'preenchimento artificial cego' (fill sinks) sem justificativa.",
                 "   • Retém o cálculo e alerta o usuário no dossiê de auditoria.",
                 "",
                 "► Conformidade Matemática com a Fonte:",
                 "   • Eliminação de 'pisos' artificiais (Math.max) que mascaravam falhas numéricas no algoritmo."
             ], C_NAVY_DARK, C_WHITE)

    add_notes(s12, "O Invariante 1 é o selo de honestidade científica do SAREL v2.0: se o dado não existe, o sistema assume "
                  "que não existe, em vez de inventar um número que pareça plausível.")

    # -------------------------------------------------------------------------
    # SLIDE 13: AS SETE TRAVAS FORMAIS DE INTEGRIDADE
    # -------------------------------------------------------------------------
    s13 = prs.slides.add_slide(blank_layout)
    set_bg(s13)
    add_header(s13, "Blindagem Ética e Estatística: As Sete Travas de Integridade")
    add_footer(s13, 13)

    add_card(s13, Inches(0.6), Inches(1.4), Inches(12.0), Inches(5.4),
             "SISTEMA DE TRAVAS FORMAIS DA ARQUITETURA SAREL v2.0",
             [
                 "► <b>Invariante 1 — Completude da Linha de Base:</b> perdaSolo bloqueada a menos que todos os cinco fatores existam com memória de cálculo.",
                 "",
                 "► <b>Invariante 2 — Blindagem Epistêmica da Matriz:</b> Metadados administrativos (código, proprietário, datas de visita) são estritamente excluídos do treinamento do XGBoost.",
                 "",
                 "► <b>Invariante 3 — Segregação Treino / Held-Out:</b> Polígonos sorteados para teste jamais entram no ajuste de hiperparâmetros ou validação cruzada interna.",
                 "",
                 "► <b>Invariante 4 — Rastreabilidade Total de Proveniência:</b> Todo número possui estado tipado ('medido', 'modelado', 'tabelado' ou 'indisponivel') com data, sensor e método.",
                 "",
                 "► <b>Invariante 5 — Proibição Absoluta de Fabricação Numérica (Regra P12):</b> Tolerância zero com dados sintéticos gerados aleatoriamente sem conexão física real.",
                 "",
                 "► <b>Invariante 6 — Protocolo Cego com Cegamento Duplo:</b> Intérpretes de VANT rotulam polígonos através de hashes anônimos (ex.: VANT-BLIND-15840AA020) sem conhecer localização ou estrato.",
                 "",
                 "► <b>Invariante 7 — Preservação do Suporte Espacial Nativo (D06):</b> Proibição de reamostragem simulada para resolução que o sensor não entregou fisicamente."
             ], C_NAVY_DARK, C_WHITE)

    add_notes(s13, "Apresente as Sete Travas. Elas garantem que a pesquisa não seja apenas robusta em código, mas "
                  "completamente blindada contra fraudes científicas e erros metodológicos clássicos.")

    # -------------------------------------------------------------------------
    # SLIDE 14: SUÍTE DE TESTES E AUDITORIA CONTÍNUA
    # -------------------------------------------------------------------------
    s14 = prs.slides.add_slide(blank_layout)
    set_bg(s14)
    add_header(s14, "Verificação Mecânica Contínua: 54 Suítes de Testes (409 Aprovados)")
    add_footer(s14, 14)

    add_card(s14, Inches(0.6), Inches(1.4), Inches(5.8), Inches(5.4),
             "ESTATÍSTICAS DA SUÍTE DE TESTES (CI/CD)",
             [
                 "► Verificação Estática de Tipagem:",
                 "   • <code>npx tsc --noEmit</code>: <b>Zero erros de tipagem</b> em todo o repositório.",
                 "",
                 "► Cobertura de Testes Automatizados (Vitest):",
                 "   • <b>54 arquivos de teste aprovados (54/54)</b>.",
                 "   • <b>409 testes unitários e de integração aprovados (409/409)</b>.",
                 "   • Duração da suíte completa: ~15 a 18 segundos.",
                 "",
                 "► Módulos Específicos da Fase 8 e 9:",
                 "   • Fator C (Durigon 2014 / BSI): 16 testes passando.",
                 "   • Fator K (Embrapa 2024 / k_solos): 16 testes passando.",
                 "   • Fator R (CHIRPS regional): 9 testes passando.",
                 "   • Fator LS (Desmet & Govers 2D): 11 testes passando.",
                 "   • Linha de Base RUSLE e Invariante 1: 16 testes passando."
             ], C_EMERALD_DK, C_MINT_BG)

    add_card(s14, Inches(6.8), Inches(1.4), Inches(5.8), Inches(5.4),
             "VARREDOR DE PADRÕES PROIBIDOS (ANTI-FABRICAÇÃO)",
             [
                 "► Teste Automatizado padroesProibidos.test.ts:",
                 "   • Varre estaticamente todos os arquivos em <code>src/lib</code>, <code>src/app/api</code> e <code>src/store</code>.",
                 "",
                 "► Padrões Estritamente Impedidos no Código:",
                 "   • Desmascaramento com valor nulo: Proibido mascaramento com literal.",
                 "   • Coalescência silenciosa: Proibida coalescência de fallbacks com números literais.",
                 "   • Pisos e cortes arbitrários: Proibidas funções min/max com literais disfarçados.",
                 "   • Data de aquisição forjada: Proibida data gerada em tempo de execução dinâmico.",
                 "   • Síntese aleatória em Python: Proibida geração aleatória sem justificativa documental.",
                 "",
                 "► Relatório Pericial Automatizado:",
                 "   • Script <code>gerar_relatorio_fase.ts</code> audita hashes SHA-256 e gera laudo pericial mecânico a cada fase."
             ], C_NAVY_DARK, C_WHITE)

    add_notes(s14, "Mostre o nível de rigor da engenharia de software da pesquisa: o código possui linters personalizados "
                  "que impedem o próprio pesquisador de cometer erros de imputação.")

    # -------------------------------------------------------------------------
    # SLIDE 15: SÍNTESE COMPARATIVA DA EVOLUÇÃO METODOLÓGICA
    # -------------------------------------------------------------------------
    s15 = prs.slides.add_slide(blank_layout)
    set_bg(s15)
    add_header(s15, "Síntese da Evolução: Paradigma v1 vs Paradigma v2")
    add_footer(s15, 15)

    # Tabela comparativa nativa de slides
    rows, cols = 8, 3
    left, top, width, height = Inches(0.6), Inches(1.4), Inches(12.133), Inches(5.4)
    table_shape = s15.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table
    table.columns[0].width = Inches(3.0)
    table.columns[1].width = Inches(4.5)
    table.columns[2].width = Inches(4.633)

    dados_tabela = [
        ("Dimensão Metodológica", "Paradigma v1.0 (Superado)", "Paradigma v2.0 (Canônico Atual)"),
        ("Estratégia Amostral", "Intencional por suspeita visual (viés alto).", "Probabilística em 18 estratos biofísicos com pi_i conhecido."),
        ("Fonte Primária do Rótulo", "Fotointerpretação humana no pixel de 10m.", "Delineação centimétrica sobre VANT (GSD ~3,8 cm, CE90 1,47m)."),
        ("Função dos Pontos de Campo", "Treinamento primário (com erro de GPS 3-8m).", "Âncora de prevalência e teste confirmatório sob protocolo cego."),
        ("Controle de Overfitting", "Dezenas de preditores sem checagem de suporte.", "Tetos estritos por bloco baseados na regra EPV >= 20."),
        ("Guarda Temporal", "Janelas sobrepostas com risco de data leakage.", "Intervalo de guarda estrito de 2 anos (24 meses) no Modelo P."),
        ("Linha de Base Física RUSLE", "Incompleta, com valores pendentes ou mockados.", "100% integrada e conferida na fonte primária (D01, D13, D14, D15)."),
        ("Auditoria e Verificação", "Inspeção manual pontual sem travas no CI.", "54 suítes de teste (409 aprovados) e varredor anti-fabricação.")
    ]

    for r_idx, row in enumerate(dados_tabela):
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx, c_idx)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.font.size = Pt(8.5) if r_idx > 0 else Pt(9.5)
            p.font.bold = (r_idx == 0 or c_idx == 0 or c_idx == 2)
            if r_idx == 0:
                p.alignment = PP_ALIGN.CENTER
                p.font.color.rgb = C_WHITE
                cell.fill.solid()
                cell.fill.fore_color.rgb = C_NAVY_DARK
            else:
                p.alignment = PP_ALIGN.LEFT
                cell.fill.solid()
                if c_idx == 1:
                    cell.fill.fore_color.rgb = C_ROSE_BG
                    p.font.color.rgb = C_ROSE_DK
                elif c_idx == 2:
                    cell.fill.fore_color.rgb = C_MINT_BG
                    p.font.color.rgb = C_EMERALD_DK
                else:
                    cell.fill.fore_color.rgb = C_WHITE
                    p.font.color.rgb = C_TEXT_DARK

    add_notes(s15, "Esta tabela resume toda a defesa metodológica do mestrado. Ela demonstra à banca que a pesquisa "
                  "evoluiu de uma abordagem exploratória preliminar para um padrão pericial de excelência.")

    # -------------------------------------------------------------------------
    # SLIDE 16: REFERÊNCIAS BIBLIOGRÁFICAS FUNDAMENTAIS
    # -------------------------------------------------------------------------
    s16 = prs.slides.add_slide(blank_layout)
    set_bg(s16)
    add_header(s16, "Referências Bibliográficas Primárias Auditadas")
    add_footer(s16, 16)

    add_card(s16, Inches(0.6), Inches(1.4), Inches(12.0), Inches(5.4),
             "OBRAS NORMATIVAS COM LOCALIZAÇÃO CONFERIDA NA FONTE",
             [
                 "► <b>Amostragem e Estatística Espacial:</b>",
                 "   • COCHRAN, W. G. <i>Sampling Techniques</i>. 3. ed. New York: John Wiley & Sons, 1977. 428 p.",
                 "   • VAN DER PLOEG, T.; AUSTIN, P. C.; STEYERBERG, E. W. Modern modelling techniques are data hungry: a simulation study for predicting dichotomous endpoints. <i>BMC Med. Res. Methodol.</i>, v. 14, p. 137, 2014.",
                 "   • KAUFMAN, S. et al. Leakage in data mining: Formulation, detection, and avoidance. <i>ACM TKDD</i>, v. 6, n. 4, p. 15:1-15:21, 2012.",
                 "",
                 "► <b>Sensoriamento Remoto e VANT:</b>",
                 "   • DRUSCH, M. et al. Sentinel-2: ESA's optical high-resolution mission for GMES operational services. <i>RSE</i>, v. 120, p. 25-36, 2012.",
                 "   • NUVEM UAV. Relatórios de Aferição Fotogramétrica e Calibração Espectral — VANT Spectral 2. 2024.",
                 "",
                 "► <b>Modelagem Física RUSLE (Linha de Base):</b>",
                 "   • RENARD, K. G. et al. <i>Predicting soil erosion by water (RUSLE)</i>. Washington: USDA-ARS, 1997. 404 p. (AH 703).",
                 "   • DESMET, P. J. J.; GOVERS, G. A GIS procedure for automatically calculating USLE LS factor. <i>J. Soil Water Conserv.</i>, v. 51, n. 5, p. 427-433, 1996.",
                 "   • DURIGON, V. L. et al. NDVI time series for monitoring RUSLE cover management factor. <i>IJRS</i>, v. 35, n. 2, p. 441-453, 2014.",
                 "   • COELHO, M. R. et al. <i>Erodibilidade dos solos do Brasil</i>. Rio de Janeiro: Embrapa Solos, 2024. 40 p. (Documentos 246).",
                 "   • WALTRICK, P. C. et al. Estimativa do potencial erosivo das chuvas no Estado do Paraná. <i>RBCS</i>, v. 39, n. 1, p. 256-267, 2015.",
                 "   • RUFINO, R. L. et al. Determinação do potencial erosivo da chuva para o Paraná. <i>RBCS</i>, v. 17, n. 3, p. 439-444, 1993."
             ], C_NAVY_DARK, C_WHITE)

    add_notes(s16, "Encerre destacando que todas as obras citadas possuem PDFs originais, scripts de extração automatizados "
                  "e saídas brutas arquivados na pasta docs/verificacoes/fontes/, garantindo reproducibilidade total e auditabilidade.")

    prs.save(caminho_pptx)
    print(f"Apresentação PPTX gerada com sucesso: {caminho_pptx}")


if __name__ == "__main__":
    caminho_saida = os.path.join("docs", "apresentacoes", "Mudanca_Radical_Metodologia_SAREL_v2.pptx")
    criar_apresentacao_mudanca_metodologica(caminho_saida)
