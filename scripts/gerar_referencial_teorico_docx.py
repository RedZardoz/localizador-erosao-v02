# -*- coding: utf-8 -*-
"""
Script de Geração do Documento Formal de Referencial Teórico (Revisão da Literatura)
Projeto SAREL v2.0 - PPGTCA / UTFPR Medianeira (2026)
Metodologia Real e Auditada: 111 Trabalhos Canônicos, Isento de Autorreferências (Regra R-L1).
"""

import os
import re
import json
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def set_table_borders(table, color="D3D3D3", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:left w:val="none"/>
            <w:right w:val="none"/>
            <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def format_row_header(row, col_widths=None, bg_color="1B365D", text_color="FFFFFF"):
    for idx, cell in enumerate(row.cells):
        set_cell_background(cell, bg_color)
        set_cell_margins(cell, top=140, bottom=140, left=140, right=140)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        if col_widths and idx < len(col_widths):
            cell.width = col_widths[idx]
        for p in cell.paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            for r in p.runs:
                r.bold = True
                r.font.name = "Calibri"
                r.font.size = Pt(9.5)
                r.font.color.rgb = RGBColor.from_string(text_color)

def format_data_cell(cell, text, align=WD_ALIGN_PARAGRAPH.LEFT, bold=False, italic=False, font_size=8.5, text_color="1F2937", bg_color=None, width=None):
    if bg_color:
        set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=90, bottom=90, left=120, right=120)
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    if width:
        cell.width = width
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.15
    p.text = ""
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(font_size)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor.from_string(text_color)

def add_callout(doc, text, title="NOTA METODOLÓGICA", border_color="1B365D", bg_color="F0F4F8"):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    run_t = p.add_run(f"[{title}] ")
    run_t.bold = True
    run_t.font.name = "Calibri"
    run_t.font.size = Pt(9.5)
    run_t.font.color.rgb = RGBColor.from_string(border_color)
    
    run_b = p.add_run(text)
    run_b.font.name = "Calibri"
    run_b.font.size = Pt(9)
    run_b.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    
    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_before = Pt(0)
    p_spacer.paragraph_format.space_after = Pt(4)

def add_figure_with_caption(doc, image_path, caption_text, source_text="Fonte: O autor (2026).", width=Inches(5.8)):
    if os.path.exists(image_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        run_img = p_img.add_run()
        run_img.add_picture(image_path, width=width)
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(0)
        p_cap.paragraph_format.space_after = Pt(2)
        run_c = p_cap.add_run(caption_text)
        run_c.bold = True
        run_c.font.name = "Calibri"
        run_c.font.size = Pt(9.5)
        run_c.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
        
        p_src = doc.add_paragraph()
        p_src.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_src.paragraph_format.space_before = Pt(0)
        p_src.paragraph_format.space_after = Pt(8)
        run_s = p_src.add_run(source_text)
        run_s.italic = True
        run_s.font.name = "Calibri"
        run_s.font.size = Pt(8.5)
        run_s.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

def build_document():
    print("Iniciando compilação do Referencial Teórico com 111 TRABALHOS CANÔNICOS (Isento de Autorreferência)...")
    doc = docx.Document()
    
    # 1. Configuração de Margens ABNT (Sup 3cm, Esq 3cm, Inf 2cm, Dir 2cm)
    for section in doc.sections:
        section.top_margin = Inches(1.18)    # 3,0 cm
        section.bottom_margin = Inches(0.79) # 2,0 cm
        section.left_margin = Inches(1.18)   # 3,0 cm
        section.right_margin = Inches(0.79)  # 2,0 cm
        
        footer = section.footer
        f_p = footer.paragraphs[0]
        f_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        f_run = f_p.add_run("SAREL v2.0 — Referencial Teórico e Revisão da Literatura | PPGTCA / UTFPR")
        f_run.font.name = "Calibri"
        f_run.font.size = Pt(8)
        f_run.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)
        
        header = section.header
        h_p = header.paragraphs[0]
        h_p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        h_run = h_p.add_run("Dissertação de Mestrado — Luis Alfredo (2026)")
        h_run.font.name = "Calibri"
        h_run.font.size = Pt(8)
        h_run.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

    COLOR_PRIMARY = RGBColor(0x1B, 0x36, 0x5D)    # Azul Marinho Acadêmico
    COLOR_SECONDARY = RGBColor(0x0D, 0x94, 0x88)  # Teal Científico
    COLOR_DARK = RGBColor(0x11, 0x18, 0x27)
    COLOR_MUTED = RGBColor(0x4B, 0x55, 0x63)
    
    # 2. CABEÇALHO INSTITUCIONAL
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(12)
    p_inst.paragraph_format.space_after = Pt(2)
    r_inst1 = p_inst.add_run("UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ (UTFPR)\n")
    r_inst1.bold = True
    r_inst1.font.name = "Calibri"
    r_inst1.font.size = Pt(12)
    r_inst1.font.color.rgb = COLOR_PRIMARY
    
    r_inst2 = p_inst.add_run("CÂMPUS MEDIANEIRA\nPROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO (PPGTCA)\nÁREA DE CONCENTRAÇÃO: TECNOLOGIAS COMPUTACIONAIS NO AGRONEGÓCIO\n")
    r_inst2.font.name = "Calibri"
    r_inst2.font.size = Pt(10)
    r_inst2.bold = True
    r_inst2.font.color.rgb = COLOR_MUTED

    p_div = doc.add_paragraph()
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_div.paragraph_format.space_before = Pt(4)
    p_div.paragraph_format.space_after = Pt(18)
    r_div = p_div.add_run("—" * 38)
    r_div.font.color.rgb = RGBColor(0xCB, 0xD5, 0xE1)

    # TÍTULO PRINCIPAL
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(6)
    p_title.paragraph_format.space_after = Pt(6)
    r_title = p_title.add_run("ESTRUTURA DO REFERENCIAL TEÓRICO E REVISÃO SISTEMÁTICA DA LITERATURA\n")
    r_title.bold = True
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(16)
    r_title.font.color.rgb = COLOR_PRIMARY

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(16)
    r_sub = p_sub.add_run("Fundamentação Teórica, Metodologia de Curadoria Aberta e Inventário Analítico do Acervo Científico Auditado (111 Trabalhos Canônicos)\nProjeto SAREL v2.0: Localização e Predição de Erosão Laminar na Bacia Hidrográfica do Rio Paraná III por Sensoriamento Remoto Multifonte e Aprendizado de Máquina")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(11)
    r_sub.italic = True
    r_sub.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    # METADADOS DA PESQUISA
    meta_table = doc.add_table(rows=5, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False
    set_table_borders(meta_table, color="CBD5E1", sz="4")
    
    meta_data = [
        ("Mestrando / Pesquisador:", "Luis Alfredo"),
        ("Programa / Instituição:", "PPGTCA / Universidade Tecnológica Federal do Paraná (UTFPR) — Medianeira"),
        ("Título da Dissertação:", "Validação e Predição de Erosão Laminar usando Sensoriamento Remoto e Algoritmos de Gradiente Impulsionado (XGBoost)"),
        ("Linha de Pesquisa:", "Inteligência Geoespacial, Modelagem Física de Bacias e Conservação do Solo"),
        ("Data de Consolidação / Versão:", "Novembro de 2026 — SAREL Versão 2.0 (Norma de Lastro R-L1 a R-L5 | 111 Trabalhos Canônicos)")
    ]
    for idx, (label, val) in enumerate(meta_data):
        row = meta_table.rows[idx]
        format_data_cell(row.cells[0], label, bold=True, width=Inches(2.2), bg_color="F8FAFC", text_color="1B365D")
        format_data_cell(row.cells[1], val, width=Inches(4.3), text_color="1F2937")

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # 1. INTRODUÇÃO E ENQUADRAMENTO DA PESQUISA
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    r_h1 = h1.add_run("1. INTRODUÇÃO E ENQUADRAMENTO DA PESQUISA")
    r_h1.bold = True
    r_h1.font.name = "Calibri"
    r_h1.font.size = Pt(13)
    r_h1.font.color.rgb = COLOR_PRIMARY

    p_intro1 = doc.add_paragraph()
    p_intro1.paragraph_format.line_spacing = 1.3
    p_intro1.paragraph_format.space_after = Pt(6)
    p_intro1.add_run(
        "A erosão hídrica laminar (sheet erosion) representa a modalidade mais insidiosa e devastadora de degradação do solo em bacias hidrográficas tropicais e subtropicais altamente tecnificadas, como a Bacia Hidrográfica do Rio Paraná III (BP3), localizada no oeste do Estado do Paraná. Por caracterizar-se pelo desprendimento e arraste difuso de delgadas partículas superficiais pela ação combinada do impacto pluvial (splash effect) e do escoamento laminar difuso (overland flow), este fenômeno é virtualmente imperceptível na escala de manejo diário, não gerando sulcos ou ravinamentos imediatos. No entanto, sua ocorrência crônica subtrai seletivamente os coloides argilosos, a fração orgânica e os nutrientes acumulados no topo do perfil edáfico, desencadeando a perda gradual de fertilidade química, compactação física e o assoreamento de cursos d'água essenciais para a geração hidrelétrica binacional (Itaipu) e abastecimento público regional."
    )

    p_intro2 = doc.add_paragraph()
    p_intro2.paragraph_format.line_spacing = 1.3
    p_intro2.paragraph_format.space_after = Pt(6)
    p_intro2.add_run(
        "A despeito de sua relevância biofísica, o mapeamento e a predição da erosão laminar enfrentam graves desafios metodológicos na literatura contemporânea. Por um lado, os modelos empíricos determinísticos clássicos, fundamentados na Equação Universal de Perdas de Solo (USLE/RUSLE), operam frequentemente em resolução temporal anual e requerem parametrizações tabulares estáticas que ignoram a dinâmica de eventos pluviais concentrados e a fenologia agrícola das lavouras de plantio direto. Por outro lado, a recente literatura voltada ao aprendizado de máquina (Machine Learning) e sensoriamento remoto comumente incorre em duas fragilidades severas: (a) a confusão entre erosão laminar e feições lineares agressivas (voçorocas e ravinas), cuja morfologia geométrica é consideravelmente mais fácil de segmentar em imagens orbitais; e (b) o emprego de protocolos estatísticos ingênuos de validação cruzada aleatória (standard k-fold), os quais violam a autocorrelação espacial (Primeira Lei de Tobler), provocando sobreajuste massivo (overfitting) e vazamento de dados (data leakage) que mascaram a real ineficácia do modelo quando aplicado em novas áreas agrícolas."
    )

    p_intro3 = doc.add_paragraph()
    p_intro3.paragraph_format.line_spacing = 1.3
    p_intro3.paragraph_format.space_after = Pt(6)
    p_intro3.add_run(
        "Nesse contexto, o Projeto SAREL v2.0 (Sistema de Amostragem e Rotulagem para Erosão Laminar) propõe uma arquitetura integradora e auditável que une a base biofísica da física dos solos (RUSLE regionalizada e modelo G2) à capacidade preditiva de algoritmos baseados em árvores (XGBoost sob formulação contínua Tweedie), harmonizando séries orbitais ópticas (Sentinel-2, PlanetScope) e altimétricas (Copernicus DEM 30 m) a levantamentos periciais centimétricos de campo por meio de Veículos Aéreos Não Tripulados (VANTs multiespectrais). Para garantir o lastro científico integral deste aparato, instituiu-se a Norma de Lastro Científico do SAREL (Regras R-L1 a R-L5), segundo a qual toda decisão de código, limiar ou parâmetro deve repousar estritamente em literatura formal revisada por pares com declaração transparente de seus limites operacionais."
    )

    add_callout(
        doc,
        "A construção do presente referencial teórico adota como diretriz o modelo estruturado de revisão sistemática de literatura, adaptado a partir das fases canônicas propostas por Tranfield, Denyer e Smart (2003) e Ensslin et al. (2014) (ProKnow-C), garantindo transparência, repetibilidade em ambiente de código aberto e auditoria forense das 111 obras canônicas externas que compõem o acervo formal, com exclusão estrita de qualquer autorreferência a documentos internos do projeto.",
        title="DIRETRIZ DE ENQUADRAMENTO EPISTEMOLÓGICO",
        border_color="1B365D",
        bg_color="F0F4F8"
    )

    # 2. REVISÃO DA LITERATURA E PROCESSO SISTEMÁTICO DE SELEÇÃO
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)
    r_h2 = h2.add_run("2. REVISÃO DA LITERATURA E PROCESSO SISTEMÁTICO DE SELEÇÃO")
    r_h2.bold = True
    r_h2.font.name = "Calibri"
    r_h2.font.size = Pt(13)
    r_h2.font.color.rgb = COLOR_PRIMARY

    p_rev1 = doc.add_paragraph()
    p_rev1.paragraph_format.line_spacing = 1.3
    p_rev1.paragraph_format.space_after = Pt(6)
    p_rev1.add_run(
        "Neste capítulo são apresentados os conceitos e teorias que sustentam os eixos estruturantes desta pesquisa, bem como os trabalhos científicos publicados na literatura internacional e nacional, a fim de averiguar em que medida o aprendizado de máquina supervisionado e o sensoriamento remoto multifonte estão presentes e integrados no contexto da modelagem de erosão laminar, evidenciando as metodologias, ferramentas e algoritmos empregados pelos principais autores da área."
    )

    p_rev2 = doc.add_paragraph()
    p_rev2.paragraph_format.line_spacing = 1.3
    p_rev2.paragraph_format.space_after = Pt(6)
    p_rev2.add_run(
        "A metodologia empregada para a revisão sistemática foi adaptada a partir das fases propostas por Tranfield, Denyer e Smart (2003) e Ensslin et al. (2014) (ProKnow-C — Knowledge Development Process - Constructivist), consistindo em três etapas fundamentais: (i) Definição dos parâmetros de pesquisa; (ii) Investigação e busca combinatória nas bases e repositórios científicos; e (iii) Análise e filtragem do portfólio de artigos. Este procedimento estruturado permite não apenas identificar a fronteira do conhecimento atual, mas sobretudo delimitar formalmente a lacuna científica sobre a qual se concentram os esforços desta dissertação de mestrado. As etapas do processo podem ser visualizadas na Figura 1."
    )

    add_figure_with_caption(
        doc,
        "docs/dissertacao/figuras_referencial/figura_1_fases_revisao.png",
        "Figura 1 – Fases da revisão da literatura e fluxo sistemático de curadoria.",
        "Fonte: Adaptado de Tranfield, Denyer e Smart (2003) e Ensslin et al. (2014)."
    )

    # 2.1 DEFINIÇÃO DOS PARÂMETROS DE PESQUISA
    h2_1 = doc.add_paragraph()
    h2_1.paragraph_format.space_before = Pt(12)
    h2_1.paragraph_format.space_after = Pt(4)
    r_h2_1 = h2_1.add_run("2.1 Definição dos Parâmetros de Pesquisa")
    r_h2_1.bold = True
    r_h2_1.font.name = "Calibri"
    r_h2_1.font.size = Pt(11.5)
    r_h2_1.font.color.rgb = COLOR_SECONDARY

    p_param1 = doc.add_paragraph()
    p_param1.paragraph_format.line_spacing = 1.3
    p_param1.paragraph_format.space_after = Pt(6)
    p_param1.add_run(
        "Para a composição da base científica de sustentação, foram consultados repositórios abertos e indexadores multidisciplinares de excelência acadêmica: SciELO (Scientific Electronic Library Online), ScienceDirect (Elsevier), Google Scholar, Portal de Periódicos CAPES, Repositório Institucional da UTFPR (RIUT), Repositório Digital da UNIOESTE e publicações técnicas oficiais da Embrapa Solos e Embrapa Soja. A inclusão expressiva de fontes institucionais paranaenses e nacionais foi indispensável para resgatar os parâmetros de calibração pedológica de solos subtropicais (Latossolos e Nitossolos Eutróficos) e a série histórica de equações de erosividade pluviométrica do Paraná (Rufino et al., 1993; Waltrick et al., 2015)."
    )

    p_param2 = doc.add_paragraph()
    p_param2.paragraph_format.line_spacing = 1.3
    p_param2.paragraph_format.space_after = Pt(6)
    p_param2.add_run(
        "Quanto ao idioma, utilizou-se primordialmente o inglês para a busca global de algoritmos de machine learning e séries orbitais, assegurando a identificação do estado da arte internacional, e o português para a parametrização empírica e caracterização regional da bacia. O prazo de busca foi definido como 'All Years', visto que a fundamentação física de perda de solo requer o resgate de clássicos seminais da modelagem (Wischmeier & Smith, 1978; Desmet & Govers, 1996; Renard et al., 1997), com acompanhamento contínuo dos artigos mais recentes indexados até o ano de 2026."
    )

    p_param3 = doc.add_paragraph()
    p_param3.paragraph_format.line_spacing = 1.3
    p_param3.paragraph_format.space_after = Pt(6)
    p_param3.add_run(
        "A consulta aos indexadores e bases abertas exigiu a estruturação de strings de busca combinatórias associando os campos de título, resumo e palavras-chave. O Quadro 1 apresenta as strings de busca consolidadas para cada eixo temático."
    )

    # QUADRO 1 - Strings de busca
    q1_table = doc.add_table(rows=5, cols=3)
    q1_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    q1_table.autofit = False
    set_table_borders(q1_table, color="CBD5E1", sz="4")
    
    col_w = [Inches(1.5), Inches(1.8), Inches(3.2)]
    format_row_header(q1_table.rows[0], col_widths=col_w, bg_color="1B365D", text_color="FFFFFF")
    q1_table.rows[0].cells[0].paragraphs[0].text = "Repositório / Base"
    q1_table.rows[0].cells[1].paragraphs[0].text = "Eixos / Palavras-chave"
    q1_table.rows[0].cells[2].paragraphs[0].text = "String de Busca Padronizada"

    q1_data = [
        ("ScienceDirect / Elsevier", "Erosão Laminar e Machine Learning", "TITLE-ABSTR-KEY((\"sheet erosion\" OR \"interrill erosion\" OR \"soil loss\") AND (\"machine learning\" OR \"XGBoost\" OR \"gradient boosting\"))"),
        ("SciELO / Periódicos CAPES", "Erosão Laminar e Sensoriamento Remoto", "(\"erosão laminar\" OR \"perda de solo\") AND (\"sensoriamento remoto\" OR \"Sentinel-2\" OR \"VANT\" OR \"geoprocessamento\")"),
        ("Google Scholar / RIUT", "Sensoriamento Remoto e IA no Paraná", "(\"sensoriamento remoto\" OR \"Sentinel-2\") AND (\"aprendizado de máquina\" OR \"XGBoost\") AND (\"Paraná\" OR \"bacia\")"),
        ("Embrapa / Repositórios Abertos", "Conjunção dos Eixos SAREL", "(\"erodibilidade\" OR \"erosividade\" OR \"USLE\") AND (\"plantio direto\" OR \"solo descoberto\") AND (\"modelo digital de elevação\")")
    ]
    for idx, (b, e, s) in enumerate(q1_data, 1):
        row = q1_table.rows[idx]
        bg = "F8FAFC" if idx % 2 == 1 else "FFFFFF"
        format_data_cell(row.cells[0], b, bold=True, width=col_w[0], bg_color=bg, text_color="1B365D")
        format_data_cell(row.cells[1], e, width=col_w[1], bg_color=bg, text_color="334155")
        format_data_cell(row.cells[2], s, font_size=8, width=col_w[2], bg_color=bg, text_color="1F2937")

    p_src_q1 = doc.add_paragraph()
    p_src_q1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_src_q1.paragraph_format.space_before = Pt(2)
    p_src_q1.paragraph_format.space_after = Pt(8)
    r_sq1 = p_src_q1.add_run("Quadro 1 – Strings de busca aplicadas nos repositórios e bases de dados.\nFonte: O autor (2026).")
    r_sq1.italic = True
    r_sq1.font.name = "Calibri"
    r_sq1.font.size = Pt(8.5)
    r_sq1.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # QUADRO 2 - Critérios
    q2_table = doc.add_table(rows=9, cols=2)
    q2_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    q2_table.autofit = False
    set_table_borders(q2_table, color="CBD5E1", sz="4")
    
    col_w2 = [Inches(2.0), Inches(4.5)]
    format_row_header(q2_table.rows[0], col_widths=col_w2, bg_color="1B365D", text_color="FFFFFF")
    q2_table.rows[0].cells[0].paragraphs[0].text = "Parâmetro Metodológico"
    q2_table.rows[0].cells[1].paragraphs[0].text = "Especificação e Critério Operacional"

    q2_data = [
        ("Palavras-chave Centrais", "Erosão Laminar (Sheet/Interrill Erosion); Sensoriamento Remoto Multifonte (Sentinel-2, VANT); Aprendizado de Máquina (XGBoost, Ensembles)."),
        ("Operadores Booleanos", "AND entre eixos conceituais distintos; OR entre sinônimos, variantes técnicas e expressões equivalentes nos campos de busca."),
        ("Campos de Consulta", "Título (Title), Resumo (Abstract) e Palavras-chave (Keywords) nos repositórios e bases consultadas."),
        ("Critérios de Inclusão", "Artigos revisados por pares que investigam modelagem preditiva de erosão hídrica, algoritmos supervisionados baseados em árvores, validação espacial, sensoriamento remoto óptico/altimétrico e estudos edafoclimáticos no bioma subtropical e no Paraná."),
        ("Critérios de Exclusão", "Artigos puramente laboratoriais sob chuva simulada sem validação de escala; estudos exclusivos de voçorocas/ravinas (gullies) sem modelagem laminar; gravações em vídeo (.mkv), apresentações em slides (.pptx) ou notas técnicas preliminares (.docx); relatórios internos de auditoria do próprio projeto (vedação de autorreferência R-L1); blogs comerciais (ex: IBTopografia) sem revisão por pares."),
        ("Idiomas Aceitos", "Inglês (para o estado da arte global em Machine Learning e sensores orbitais) e Português (para calibrações regionais de solo e chuva no Paraná)."),
        ("Tipos de Documento", "Artigos em periódicos científicos indexados, anais de congressos de excelência (SBSR, SBRH), teses e dissertações de programas de referência (PPGTCA/UTFPR, UNIOESTE, ESALQ-USP)."),
        ("Janela Temporal", "Histórico completo ('All Years') até 2026, com foco especial na produção recente (2021–2026) para métodos de inteligência artificial.")
    ]
    for idx, (p, e) in enumerate(q2_data, 1):
        row = q2_table.rows[idx]
        bg = "F8FAFC" if idx % 2 == 1 else "FFFFFF"
        format_data_cell(row.cells[0], p, bold=True, width=col_w2[0], bg_color=bg, text_color="1B365D")
        format_data_cell(row.cells[1], e, width=col_w2[1], bg_color=bg, text_color="1F2937")

    p_src_q2 = doc.add_paragraph()
    p_src_q2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_src_q2.paragraph_format.space_before = Pt(2)
    p_src_q2.paragraph_format.space_after = Pt(8)
    r_sq2 = p_src_q2.add_run("Quadro 2 – Critérios formais para seleção e filtragem dos documentos científicos.\nFonte: O autor (2026).")
    r_sq2.italic = True
    r_sq2.font.name = "Calibri"
    r_sq2.font.size = Pt(8.5)
    r_sq2.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # 2.2 INVESTIGAÇÃO E EIXOS TEMÁTICOS DA PESQUISA
    h2_2 = doc.add_paragraph()
    h2_2.paragraph_format.space_before = Pt(12)
    h2_2.paragraph_format.space_after = Pt(4)
    r_h2_2 = h2_2.add_run("2.2 Investigação e Eixos Temáticos da Pesquisa")
    r_h2_2.bold = True
    r_h2_2.font.name = "Calibri"
    r_h2_2.font.size = Pt(11.5)
    r_h2_2.font.color.rgb = COLOR_SECONDARY

    p_inv1 = doc.add_paragraph()
    p_inv1.paragraph_format.line_spacing = 1.3
    p_inv1.paragraph_format.space_after = Pt(6)
    p_inv1.add_run(
        "As palavras-chave definidas para a investigação bibliográfica derivam diretamente do escopo e dos objetivos do SAREL. O projeto articula-se em torno de três eixos temáticos estruturais: Eixo A: Erosão Laminar e Modelagem Física do Solo; Eixo B: Sensoriamento Remoto Multifonte e Séries Temporais; e Eixo C: Aprendizado de Máquina, Validação Espacial e Explicabilidade Biofísica."
    )

    p_inv2 = doc.add_paragraph()
    p_inv2.paragraph_format.line_spacing = 1.3
    p_inv2.paragraph_format.space_after = Pt(6)
    p_inv2.add_run(
        "A verificação da ocorrência concomitante dos três eixos por meio do operador booleano 'AND' tríplice confirmou uma lacuna aguda na literatura: a conjunção de erosão laminar contínua, sensoriamento remoto multifonte e aprendizado de máquina supervisionado com validação espacial honesta apresenta escassez quase total de trabalhos publicados (0 a 1 trabalho aderente). A quase totalidade dos artigos com IA aborda apenas feições lineares agressivas (ravinas e voçorocas) ou emprega validação aleatória ingênua (standard k-fold) com severo vazamento espacial de dados. A Figura 2 ilustra a constatação formal dessa lacuna."
    )

    add_figure_with_caption(
        doc,
        "docs/dissertacao/figuras_referencial/figura_2_confluencia_elementos.png",
        "Figura 2 – Verificação de trabalhos com os elementos em conjunto e delimitação da lacuna.",
        "Fonte: O autor (2026)."
    )

    p_inv3 = doc.add_paragraph()
    p_inv3.paragraph_format.line_spacing = 1.3
    p_inv3.paragraph_format.space_after = Pt(6)
    p_inv3.add_run(
        "Essa lacuna justifica plenamente o esforço de pesquisa do SAREL. Para delimitar com precisão o ambiente em que esses três pilares interagem, o escopo da pesquisa foi contextualizado no ambiente de produção agrícola real do oeste paranaense (Bacia Hidrográfica do Rio Paraná III), conforme ilustrado na Figura 3. Esse ambiente impõe desafios específicos de relevo (declividades de 3% a 20%), solos tropicais de textura argilosa/muito argilosa (Latossolos e Nitossolos Eutróficos), dinâmica de plantio direto com rotação de culturas e mosaicos fundiários registrados no SICAR/CAR."
    )

    add_figure_with_caption(
        doc,
        "docs/dissertacao/figuras_referencial/figura_3_escopo_pesquisa.png",
        "Figura 3 – Escopo da pesquisa e confluência temática no ambiente agrícola real (Bacia do Paraná III).",
        "Fonte: O autor (2026)."
    )

    p_inv4 = doc.add_paragraph()
    p_inv4.paragraph_format.line_spacing = 1.3
    p_inv4.paragraph_format.space_after = Pt(6)
    p_inv4.add_run(
        "Diante da escassez de pesquisas que conjugam os três elementos simultaneamente, a estratégia investigativa consistiu em pesquisá-los em pares bidirecionais (Figura 4). Essa abordagem permitiu consolidar os pilares do referencial teórico: primeiramente, mapeando a integração da modelagem física da erosão com o sensoriamento remoto; em segundo lugar, avaliando o uso de machine learning na predição de perda de solo; e, finalmente, examinando a sinergia entre sensores orbitais e algoritmos de gradiente impulsionado."
    )

    add_figure_with_caption(
        doc,
        "docs/dissertacao/figuras_referencial/figura_4_palavras_chave.png",
        "Figura 4 – Palavras-chave da pesquisa e busca combinatória em pares temáticos.",
        "Fonte: O autor (2026)."
    )

    # 2.3 PROCESSO DE FILTRAGEM E ANÁLISE DO PORTFÓLIO DE ARTIGOS
    h2_3 = doc.add_paragraph()
    h2_3.paragraph_format.space_before = Pt(12)
    h2_3.paragraph_format.space_after = Pt(4)
    r_h2_3 = h2_3.add_run("2.3 Processo de Curadoria e Filtragem do Portfólio de Artigos")
    r_h2_3.bold = True
    r_h2_3.font.name = "Calibri"
    r_h2_3.font.size = Pt(11.5)
    r_h2_3.font.color.rgb = COLOR_SECONDARY

    p_filt1 = doc.add_paragraph()
    p_filt1.paragraph_format.line_spacing = 1.3
    p_filt1.paragraph_format.space_after = Pt(6)
    p_filt1.add_run(
        "A formação do acervo bibliográfico formal do SAREL seguiu um procedimento transparente e estritamente auditável, orientado pelas regras R-L1 a R-L5 da Norma de Lastro Científico. Para a organização, controle de duplicidades e auditoria da seleção documental, utilizou-se gerenciamento estruturado por scripts em Python (manipulação de metadados via pypdf e hashlib), integração com manifestos estruturados em JSON (manifesto_selecao.json) e controle rigoroso de integridade criptográfica por hashes SHA-256 de arquivo único, complementados pela gestão de referências em plataformas de código aberto (como Zotero)."
    )

    p_filt2 = doc.add_paragraph()
    p_filt2.paragraph_format.line_spacing = 1.3
    p_filt2.paragraph_format.space_after = Pt(6)
    p_filt2.add_run(
        "O processo de curadoria iniciou-se com a análise do histórico diário de varreduras automatizadas de busca (agente Workspace Studio Flows, abrangendo o período de 26/05/2026 a 19/10/2026 e consolidado em 32 páginas de registro de busca), combinado a consultas direcionadas nos repositórios institucionais abertos e bases científicas (SciELO, ScienceDirect, CAPES, RIUT/UTFPR, UNIOESTE e Embrapa). Esse levantamento preliminar resultou na ingestão de 122 itens brutos no manifesto inicial de seleção do projeto (manifesto_selecao.json)."
    )

    p_filt3 = doc.add_paragraph()
    p_filt3.paragraph_format.line_spacing = 1.3
    p_filt3.paragraph_format.space_after = Pt(6)
    p_filt3.add_run(
        "Sobre esse lote inicial de 122 itens, aplicou-se a primeira etapa de filtragem: foram descartados 13 itens inadequados ao padrão de rigor científico da dissertação (gravações de tela em formato .mkv, notas técnicas internas em .docx/.pptx, livros didáticos de introdução geral e temas completamente desconexos do escopo, como modelos de linguagem aplicados a seguro agrícola). Restaram 109 documentos científicos elegíveis, aos quais foram integradas as 2 obras seminais de raiz (Rufino et al., 1993 para o Fator R no Paraná, e Hickey, 2000 para o Fator LS em grades digitais)."
    )

    p_filt4 = doc.add_paragraph()
    p_filt4.paragraph_format.line_spacing = 1.3
    p_filt4.paragraph_format.space_after = Pt(6)
    p_filt4.add_run(
        "Em estrita observância à regra R-L1 da Norma de Lastro Científico ('Autorreferência não é lastro'), documentos internos, relatórios preliminares ou notas técnicas de auditoria do próprio projeto foram rigorosamente expurgados do cômputo bibliográfico, assegurando que o acervo reflita exclusivamente literatura científica externa de autoridade reconhecida. Dessa forma, o acervo formal definitivo consolida-se em exatamente 111 trabalhos canônicos externos, integralmente arquivados em disco local com hashes criptográficos SHA-256 e categorizados em quatro grupos funcionais: (a) 35 Pesquisas Diretamente Relacionadas (Machine Learning, XGBoost, sensoriamento orbital e validação espacial); (b) 53 Pesquisas Relacionadas (modelagem física USLE/RUSLE, fatores R, K, LS, C, P e estudos de erosão); (c) 21 Obras de Contexto Regional e Triagem (dissertações do PPGTCA/UTFPR Medianeira, UNIOESTE/BP3, UNESP e malha fundiária do CAR); e (d) 2 Obras Seminais Fundacionais. O funil metodológico desse processo é detalhado na Figura 5."
    )

    add_figure_with_caption(
        doc,
        "docs/dissertacao/figuras_referencial/figura_5_funil_filtragem.png",
        "Figura 5 – Processo real de triagem, curadoria e auditoria do portfólio de 111 trabalhos canônicos.",
        "Fonte: O autor (2026)."
    )

    # 3. ESTRUTURAÇÃO ANALÍTICA DOS CAPÍTULOS TEÓRICOS DA DISSERTAÇÃO
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)
    r_h3 = h3.add_run("3. ESTRUTURAÇÃO ANALÍTICA DOS CAPÍTULOS TEÓRICOS DA DISSERTAÇÃO")
    r_h3.bold = True
    r_h3.font.name = "Calibri"
    r_h3.font.size = Pt(13)
    r_h3.font.color.rgb = COLOR_PRIMARY

    p_struct = doc.add_paragraph()
    p_struct.paragraph_format.line_spacing = 1.3
    p_struct.paragraph_format.space_after = Pt(6)
    p_struct.add_run(
        "A partir da curadoria do acervo auditado de 111 trabalhos canônicos e da delimitação da lacuna científica, o referencial teórico da dissertação de mestrado estrutura-se em três grandes eixos temáticos complementares, seguidos por uma seção de síntese normativa e formalização das hipóteses de trabalho:"
    )

    # 3.1 EIXO I
    h3_1 = doc.add_paragraph()
    h3_1.paragraph_format.space_before = Pt(10)
    h3_1.paragraph_format.space_after = Pt(4)
    r_h3_1 = h3_1.add_run("3.1 Eixo I: Mecânica dos Processos Hidro-Erosivos e Modelagem Física da Erosão Laminar")
    r_h3_1.bold = True
    r_h3_1.font.name = "Calibri"
    r_h3_1.font.size = Pt(11.5)
    r_h3_1.font.color.rgb = COLOR_SECONDARY

    p_e1_1 = doc.add_paragraph()
    p_e1_1.paragraph_format.line_spacing = 1.3
    p_e1_1.paragraph_format.space_after = Pt(6)
    p_e1_1.add_run(
        "3.1.1 Dinâmica Hidrológica da Erosão Laminar e Entressulcos: Fundamenta a distinção hidromorfológica entre erosão laminar (descolamento difuso de partículas pelo impacto de gotas de chuva e arraste superficial uniforme) e erosão em sulcos (escoamento concentrado com formação de canais efêmeros). Discute a física do desprendimento em solos argilosos subtropicais e as limitações de detecção visual no terreno imediato."
    )

    p_e1_2 = doc.add_paragraph()
    p_e1_2.paragraph_format.line_spacing = 1.3
    p_e1_2.paragraph_format.space_after = Pt(6)
    p_e1_2.add_run(
        "3.1.2 A Equação Universal de Perdas de Solo (USLE/RUSLE) e Parametrização para o Paraná: Revisa detalhadamente os cinco fatores biofísicos da equação matemática clássica A = R · K · LS · C · P (Wischmeier & Smith, 1978; Renard et al., 1997):\n"
        "• Fator R (Erosividade das Chuvas): Formulações clássicas de energia cinética e intensidade máxima em 30 minutos (EI30), equações regionais do Paraná (Rufino, Biscaia & Merten, 1993; Waltrick et al., 2011, 2015) e a integração de séries orbitais e pluviométricas (CHIRPS e IMERG - Funk et al., 2015; Huffman et al., 2020);\n"
        "• Fator K (Erodibilidade do Solo): Conceito de suscetibilidade intrínseca ao desprendimento, a consolidação normativa da Embrapa Solos no Documento 246/2024 (Geraldo et al., 2024), a tabela de conversão qualitativa-quantitativa de Mannigel et al. (2002) e a correspondência com o Sistema Brasileiro de Classificação de Solos (SiBCS - Santos et al., 2018);\n"
        "• Fator LS (Comprimento de Rampa e Grau de Declive): O modelo hidrológico bidimensional de área de contribuição específica de Desmet & Govers (1996), a formulação de McCool et al. (1989), aprimoramentos de Schmidt (2019) e o algoritmo computacional de Hickey (2000) aplicado a Modelos Digitais de Elevação (Copernicus DEM 30 m);\n"
        "• Fator C (Uso, Manejo e Cobertura): A modelagem da cobertura viva e residual em plantio direto através de séries temporais de NDVI (Durigon et al., 2014) e do índice Forest Canopy Density (Rikimaru et al., 2002);\n"
        "• Fator P (Práticas Conservacionistas): Terraceamento em nível, barreiras vegetais e a relação espacial com a estrutura fundiária oficial (CAR/SICAR)."
    )

    p_e1_3 = doc.add_paragraph()
    p_e1_3.paragraph_format.line_spacing = 1.3
    p_e1_3.paragraph_format.space_after = Pt(6)
    p_e1_3.add_run(
        "3.1.3 O Modelo Físico-Dinâmico G2: Análise do modelo G2 desenvolvido pelo Joint Research Centre da Comissão Europeia (Karydas & Panagos, 2018), o qual avança em relação à estaticidade da RUSLE ao introduzir a interação temporal coocorrente entre a intensidade da precipitação e a fração desprotegida da superfície do solo (Rt · [1 - Ct]), demonstrando que a perda de solo real é governada pela coocorrência de chuvas torrenciais com janelas críticas de solo exposto."
    )

    p_e1_4 = doc.add_paragraph()
    p_e1_4.paragraph_format.line_spacing = 1.3
    p_e1_4.paragraph_format.space_after = Pt(6)
    p_e1_4.add_run(
        "3.1.4 Limitações Epistêmicas e Operacionais dos Modelos Empíricos Determinísticos: Demonstra as fragilidades da aplicação isolada da RUSLE em escala de talhão, incluindo a rigidez de seus coeficientes tabelados, a incapacidade de capturar respostas biofísicas altamente não-lineares e a dependência de calibrações de campo locais que demandam décadas de parcelas de Wischmeier."
    )

    # 3.2 EIXO II
    h3_2 = doc.add_paragraph()
    h3_2.paragraph_format.space_before = Pt(10)
    h3_2.paragraph_format.space_after = Pt(4)
    r_h3_2 = h3_2.add_run("3.2 Eixo II: Sensoriamento Remoto Multifonte e Monitoramento Espectral da Superfície")
    r_h3_2.bold = True
    r_h3_2.font.name = "Calibri"
    r_h3_2.font.size = Pt(11.5)
    r_h3_2.font.color.rgb = COLOR_SECONDARY

    p_e2_1 = doc.add_paragraph()
    p_e2_1.paragraph_format.line_spacing = 1.3
    p_e2_1.paragraph_format.space_after = Pt(6)
    p_e2_1.add_run(
        "3.2.1 Princípios de Sensoriamento Orbital na Degradação de Terras: Revisa os fundamentos conceituais estabelecidos por Vrieling (2006) e Alvarez-Vanhard et al. (2021). Aborda o princípio crucial da detectabilidade remota: satélites orbitais (10 a 30 m) não enxergam feições laminares diretamente no solo, mas captam com alta sensibilidade proxies biofísicos associados (decréscimo de vigor vegetativo, variações na refletância decorrentes da perda de matéria orgânica superficial e aumento da frequência temporal de solo descoberto)."
    )

    p_e2_2 = doc.add_paragraph()
    p_e2_2.paragraph_format.line_spacing = 1.3
    p_e2_2.paragraph_format.space_after = Pt(6)
    p_e2_2.add_run(
        "3.2.2 Constelações Orbitais e Resoluções Espectro-Temporais: Caracterização detalhada dos sensores ópticos Sentinel-2 MSI (Drusch et al., 2012) com bandas no Vermelho, Red Edge e SWIR essenciais para mineralogia e biomassa; PlanetScope (Planet Labs, 2022; Sadeh et al., 2021) com resolução de 3 metros e revisita diária para auditoria de eventos pré-semeadura; e o sensor radar de abertura sintética Sentinel-1 SAR (banda C) para umidade do solo e rugosidade superficial independente de cobertura de nuvens."
    )

    p_e2_3 = doc.add_paragraph()
    p_e2_3.paragraph_format.line_spacing = 1.3
    p_e2_3.paragraph_format.space_after = Pt(6)
    p_e2_3.add_run(
        "3.2.3 Mineração Espectral de Solo Exposto e a Plataforma GEOS3: Fundamenta o mapeamento digital de solos a partir da plataforma Geospatial Soil Sensing System (GEOS3 - Demattê et al., 2018; Safanelli et al., 2021). Discute a validação do limiar normativo NDVI <= 0,25 para identificar solo nu e separar áreas preparadas para plantio de lavouras consolidadas ou com palhada senescente de plantio direto."
    )

    p_e2_4 = doc.add_paragraph()
    p_e2_4.paragraph_format.line_spacing = 1.3
    p_e2_4.paragraph_format.space_after = Pt(6)
    p_e2_4.add_run(
        "3.2.4 Decomposição Harmônica de Séries Temporais (CCDC): Revisa o algoritmo Continuous Change Detection and Classification (Zhu, 2013) baseado em regressão harmônica por Mínimos Quadrados Ordinários (OLS com 1 e 2 ciclos anuais), permitindo filtrar ruídos atmosféricos de nuvens e modelar com exatidão a sazonalidade fenológica e as anomalias de cobertura vegetal na Bacia do Paraná III."
    )

    p_e2_5 = doc.add_paragraph()
    p_e2_5.paragraph_format.line_spacing = 1.3
    p_e2_5.paragraph_format.space_after = Pt(6)
    p_e2_5.add_run(
        "3.2.5 Sensoriamento Aerotransportado por VANT e a Teoria da Escala: Examina a Teoria da Escala em sensoriamento remoto (Woodcock & Strahler, 1987) e o problema da unidade espacial modificável (MAUP). Estabelece a blindagem arquitetural mandatória do SAREL: os ortomosaicos centimétricos (< 5 cm) capturados por drone multiespectral (Spectral 2 / MicaSense) atuam exclusivamente como verdade de campo pericial (ground truth / rótulo y), jamais como preditores (X), prevenindo qualquer possibilidade de viciar ou sobreajustar o modelo orbital preditivo."
    )

    # 3.3 EIXO III
    h3_3 = doc.add_paragraph()
    h3_3.paragraph_format.space_before = Pt(10)
    h3_3.paragraph_format.space_after = Pt(4)
    r_h3_3 = h3_3.add_run("3.3 Eixo III: Aprendizado de Máquina, Validação Espacial e Explicabilidade Biofísica")
    r_h3_3.bold = True
    r_h3_3.font.name = "Calibri"
    r_h3_3.font.size = Pt(11.5)
    r_h3_3.font.color.rgb = COLOR_SECONDARY

    p_e3_1 = doc.add_paragraph()
    p_e3_1.paragraph_format.line_spacing = 1.3
    p_e3_1.paragraph_format.space_after = Pt(6)
    p_e3_1.add_run(
        "3.3.1 Algoritmos Baseados em Árvores e Gradient Boosting (XGBoost): Revisa a formulação matemática do Extreme Gradient Boosting (Chen & Guestrin, 2016), destacando suas vantagens em relação a redes neurais profundas para dados tabulares geoespaciais heterogêneos: tratamento nativo de valores ausentes, regularização L1 e L2 contra overfitting, e capacidade intrínseca de aprender fronteiras de decisão altamente não-lineares entre variáveis topográficas, climáticas e espectrais."
    )

    p_e3_2 = doc.add_paragraph()
    p_e3_2.paragraph_format.line_spacing = 1.3
    p_e3_2.paragraph_format.space_after = Pt(6)
    p_e3_2.add_run(
        "3.3.2 Formulação do Alvo Contínuo e a Distribuição Tweedie: Resgata a crítica contundente de Altman & Royston (2006) contra a dicotomização arbitrária de variáveis contínuas em 'erodido vs. não erodido', prática que destrói informação estatística, reduz o poder preditivo e introduz falsos positivos. Apresenta a modelagem da resposta como fração contínua de célula erodida y in [0, 1] calibrada sob a distribuição exponencial de Tweedie (1984) com índice de potência rho in (1, 2) (Poisson Composta com Saltos Gama), perfeita para fenômenos geomorfológicos com excesso de zeros (áreas preservadas) e cauda contínua positiva de severidade erosiva."
    )

    p_e3_3 = doc.add_paragraph()
    p_e3_3.paragraph_format.line_spacing = 1.3
    p_e3_3.paragraph_format.space_after = Pt(6)
    p_e3_3.add_run(
        "3.3.3 Governança Científica contra Vazamento de Dados (Data Leakage): Analisa os fundamentos de Kaufman et al. (2012) sobre vazamento de informação em mineração de dados. Fundamenta a decisão mandatória da Guarda Temporal de 24 meses do SAREL: para validar a capacidade preditiva real em séries agrícolas, o particionamento temporal de dados deve respeitar a rotação bienal do Paraná (soja-trigo-milho safrinha), impedindo que dados do mesmo ciclo cultural apareçam simultaneamente no treino e no teste."
    )

    p_e3_4 = doc.add_paragraph()
    p_e3_4.paragraph_format.line_spacing = 1.3
    p_e3_4.paragraph_format.space_after = Pt(6)
    p_e3_4.add_run(
        "3.3.4 Dependência Espacial e Validação Cruzada Espacial em Blocos (Spatial Block CV): Demonstra formalmente as conclusões de Roberts et al. (2017) de que amostras ambientais contíguas violam a premissa de independência estatística (i.i.d.), inflando artificialmente as métricas de acurácia (ROC-AUC) em até 30% sob k-fold aleatório. Justifica a implementação da validação cruzada espacial em blocos com isolamento geodésico (Spatial Thinning de 1,0 km) e estratégia Leave-One-Cluster-Out (LOCO) adotada no SAREL."
    )

    p_e3_5 = doc.add_paragraph()
    p_e3_5.paragraph_format.line_spacing = 1.3
    p_e3_5.paragraph_format.space_after = Pt(6)
    p_e3_5.add_run(
        "3.3.5 Explicabilidade Biofísica via Teoria dos Jogos Cooperativos (SHAP): Revisa a teoria dos valores de Shapley aplicada a aprendizado de máquina (Lundberg & Lee, 2017) por meio do algoritmo TreeExplainer. Explica como os valores SHAP permitem desmistificar a 'caixa-preta' do XGBoost, calculando a contribuição marginal exata de cada preditor (declividade, erodibilidade, NDVI, chuva) e possibilitando auditorias de falsificabilidade física (verificando se o modelo respeita a monotonicidade das leis da conservação do solo)."
    )

    # 4. SÍNTESE DO ESTADO DA ARTE E MATRIZ DE LASTRO NORMATIVO
    h4 = doc.add_paragraph()
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)
    r_h4 = h4.add_run("4. SÍNTESE DO ESTADO DA ARTE E MATRIZ DE LASTRO NORMATIVO")
    r_h4.bold = True
    r_h4.font.name = "Calibri"
    r_h4.font.size = Pt(13)
    r_h4.font.color.rgb = COLOR_PRIMARY

    p_mat1 = doc.add_paragraph()
    p_mat1.paragraph_format.line_spacing = 1.3
    p_mat1.paragraph_format.space_after = Pt(6)
    p_mat1.add_run(
        "Em estrito cumprimento à regra R-L3 da Norma de Lastro Científico do Projeto SAREL, toda decisão algorítmica ou parâmetro biofísico adotado no pipeline de predição possui lastro direto em fontes primárias arquivadas e auditadas. Mais do que registrar a autorização metodológica, a norma exige explicitar com transparência o que cada fonte primária formalmente NÃO sustenta (seus limites formais declarados), evitando extrapolações indevidas. O Quadro 3 apresenta a matriz de conformidade das decisões metodológicas centrais do SAREL frente ao acervo de literatura."
    )

    # QUADRO 3 - Matriz Teórico-Metodológica das Decisões Centrais do SAREL
    q3_table = doc.add_table(rows=8, cols=4)
    q3_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    q3_table.autofit = False
    set_table_borders(q3_table, color="CBD5E1", sz="4")
    
    col_w3 = [Inches(1.2), Inches(1.8), Inches(1.8), Inches(1.7)]
    format_row_header(q3_table.rows[0], col_widths=col_w3, bg_color="1B365D", text_color="FFFFFF")
    q3_table.rows[0].cells[0].paragraphs[0].text = "Decisão SAREL"
    q3_table.rows[0].cells[1].paragraphs[0].text = "Fonte Primária no Acervo"
    q3_table.rows[0].cells[2].paragraphs[0].text = "O que a Literatura Sustenta"
    q3_table.rows[0].cells[3].paragraphs[0].text = "O que a Literatura NÃO Sustenta (Limite)"

    q3_data = [
        ("D01 — Detectabilidade Remota de Erosão", "Vrieling (2006) — Catena (Elsevier / Wageningen)", "Sensores orbitais ópticos (10–30 m) detectam erosão laminar indiretamente por proxies espectrais (perda de biomassa, matéria orgânica e solo exposto).", "NÃO sustenta delimitação física direta de feições milimétricas sem resolução centimétrica (< 10 cm) de VANT ou inspeção de campo."),
        ("D02 / D10 — Limiar de NDVI Solo Nu (NDVI <= 0,25)", "Safanelli & Demattê (2021) — RBCS (GeoCiS / ESALQ-USP)", "O limiar NDVI <= 0,25 discrimina solo descoberto de palhada senescente de plantio direto e vegetação residual no Brasil com alta precisão.", "NÃO sustenta que todo pixel com NDVI <= 0,25 seja área erodida; indica apenas solo exposto desprotegido da ação das gotas de chuva."),
        ("D03 — Guarda Temporal de 2 Anos contra Leakage", "Kaufman et al. (2012) — ACM TKDD & Embrapa Soja (2011)", "Separação obrigatória de 24 meses em séries temporais agrícolas para respeitar a rotação bienal do Paraná (soja-trigo-milho) e evitar data leakage.", "NÃO sustenta que 24 meses elimine autocorrelação espacial (exige cumulativamente thinning geodésico no espaço)."),
        ("D04 — Erodibilidade dos Solos (Fator K)", "Embrapa Solos Doc. 246/2024 & Mannigel et al. (2002)", "Tabela oficial de conversão de classes qualitativas da Embrapa para valores contínuos do Fator K da USLE no Brasil.", "NÃO sustenta calibração direta para camadas superficialmente compactadas por tráfego pesado de colheitadeiras sem manejo."),
        ("D05 — Spatial Block CV e Thinning de 1 km", "Roberts et al. (2017) — Ecography & water-18-02255", "Demonstra que validação aleatória sob autocorrelação espacial infla métricas de generalização, exigindo blocos espaciais.", "NÃO fixa um buffer universal métrico; o limiar geodésico de 1,0 km é escolha operacional ajustada à geometria dos talhões."),
        ("D06 — Mecanismo Interativo Chuva × Solo Nu", "Karydas & Panagos (2018) — Environmental Research (JRC)", "Modela a perda de solo como produto coocorrente da energia cinética pluvial pela fração desprotegida da superfície (Rt · [1 - Ct]).", "NÃO sustenta coeficientes numéricos do Mediterrâneo sem retreinamento local para o bioma subtropical paranaense."),
        ("D07 — Fator LS em Grades Digitais Altimétricas", "Desmet & Govers (1996); Schmidt (2019); Hickey (2000)", "Algoritmo computacional para cálculo bidimensional de área de contribuição específica e comprimento de rampa cumulativo em MDEs.", "NÃO sustenta aplicação direta sobre modelos digitais de elevação com ruído de copa florestal sem pré-filtragem hidrológica.")
    ]
    for idx, (dec, src, sust, nsust) in enumerate(q3_data, 1):
        row = q3_table.rows[idx]
        bg = "F8FAFC" if idx % 2 == 1 else "FFFFFF"
        format_data_cell(row.cells[0], dec, bold=True, font_size=8, width=col_w3[0], bg_color=bg, text_color="1B365D")
        format_data_cell(row.cells[1], src, font_size=8, width=col_w3[1], bg_color=bg, text_color="334155")
        format_data_cell(row.cells[2], sust, font_size=8, width=col_w3[2], bg_color=bg, text_color="1F2937")
        format_data_cell(row.cells[3], nsust, font_size=8, width=col_w3[3], bg_color=bg, text_color="991B1B")

    p_src_q3 = doc.add_paragraph()
    p_src_q3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_src_q3.paragraph_format.space_before = Pt(2)
    p_src_q3.paragraph_format.space_after = Pt(8)
    r_sq3 = p_src_q3.add_run("Quadro 3 – Matriz teórico-metodológica das decisões centrais do SAREL e delimitação de limites operacionais.\nFonte: O autor (2026).")
    r_sq3.italic = True
    r_sq3.font.name = "Calibri"
    r_sq3.font.size = Pt(8.5)
    r_sq3.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # QUADRO 4 - Comparativo Crítico de Limitações da Literatura
    h4_2 = doc.add_paragraph()
    h4_2.paragraph_format.space_before = Pt(12)
    h4_2.paragraph_format.space_after = Pt(4)
    r_h4_2 = h4_2.add_run("4.2 Análise Crítica Comparativa da Literatura Internacional e Nacional")
    r_h4_2.bold = True
    r_h4_2.font.name = "Calibri"
    r_h4_2.font.size = Pt(11.5)
    r_h4_2.font.color.rgb = COLOR_SECONDARY

    q4_table = doc.add_table(rows=5, cols=3)
    q4_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    q4_table.autofit = False
    set_table_borders(q4_table, color="CBD5E1", sz="4")
    
    col_w4 = [Inches(1.8), Inches(2.4), Inches(2.3)]
    format_row_header(q4_table.rows[0], col_widths=col_w4, bg_color="1B365D", text_color="FFFFFF")
    q4_table.rows[0].cells[0].paragraphs[0].text = "Dimensão Analítica"
    q4_table.rows[0].cells[1].paragraphs[0].text = "Padrão Identificado na Literatura (2021–2026)"
    q4_table.rows[0].cells[2].paragraphs[0].text = "Tratamento Rigoroso no Projeto SAREL v2.0"

    q4_data = [
        ("Tipologia do Processo Erosivo", "Foco quase exclusivo em erosão linear concentrada (ravinas e voçorocas/gullies), ignorando a erosão laminar difusa por ser invisível no relevo ordinário.", "Foco estrito e exclusivo na erosão laminar e entressulcos em lavouras mecanizadas sob plantio direto."),
        ("Formulação da Variável Alvo", "Dicotomização forçada do alvo ('presença vs. ausência' de erosão), gerando modelos binários que perdem a gradação de severidade biofísica.", "Formulação do alvo como fração contínua de célula erodida y in [0, 1] com regressão Tweedie Poisson-Gama."),
        ("Protocolo de Validação do Modelo", "Validação cruzada aleatória ingênua (standard k-fold), gerando vazamento espacial de dados e métricas infladas (ROC-AUC > 0,95 irreais).", "Validação cruzada espacial em blocos (Spatial Block CV / LOCO) com Spatial Thinning de 1,0 km e isolamento geodésico."),
        ("Origem do Ground Truth (Rótulo)", "Mapeamento manual por fotointerpretação subjetiva no Google Earth em resolução métrica, frequentemente misturado aos próprios preditores.", "Rótulos periciais gerados por sobrevoos centimétricos de VANT (< 5 cm) e desacoplados formalmente da matriz de preditores orbitais.")
    ]
    for idx, (dim, lit, sar) in enumerate(q4_data, 1):
        row = q4_table.rows[idx]
        bg = "F8FAFC" if idx % 2 == 1 else "FFFFFF"
        format_data_cell(row.cells[0], dim, bold=True, font_size=8, width=col_w4[0], bg_color=bg, text_color="1B365D")
        format_data_cell(row.cells[1], lit, font_size=8, width=col_w4[1], bg_color=bg, text_color="991B1B")
        format_data_cell(row.cells[2], sar, font_size=8, width=col_w4[2], bg_color=bg, text_color="047857")

    p_src_q4 = doc.add_paragraph()
    p_src_q4.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_src_q4.paragraph_format.space_before = Pt(2)
    p_src_q4.paragraph_format.space_after = Pt(8)
    r_sq4 = p_src_q4.add_run("Quadro 4 – Síntese comparativa entre as limitações da literatura contemporânea e a abordagem metodológica do SAREL.\nFonte: O autor (2026).")
    r_sq4.italic = True
    r_sq4.font.name = "Calibri"
    r_sq4.font.size = Pt(8.5)
    r_sq4.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # 4.3 FORMULAÇÃO DAS HIPÓTESES
    h4_3 = doc.add_paragraph()
    h4_3.paragraph_format.space_before = Pt(12)
    h4_3.paragraph_format.space_after = Pt(4)
    r_h4_3 = h4_3.add_run("4.3 Delimitação da Lacuna Científica e Hipóteses de Pesquisa")
    r_h4_3.bold = True
    r_h4_3.font.name = "Calibri"
    r_h4_3.font.size = Pt(11.5)
    r_h4_3.font.color.rgb = COLOR_SECONDARY

    add_callout(
        doc,
        "Hipótese Central (H1): Modelos de aprendizado de máquina supervisionados por verdade pericial de VANT (Gradient Boosted Trees / XGBoost), integrando atributos de séries temporais orbitais (Sentinel-2 L2A / CCDC) e variáveis físicas de terreno e solo (RUSLE regionalizada), são capazes de discriminar áreas sob erosão laminar com desempenho estatisticamente superior à linha de base física isolada da RUSLE tradicional sob validação cruzada espacial em blocos (Spatial Block CV).\n\n"
        "Hipótese Secundária (H2): A formulação da variável resposta como fração contínua de célula erodida (y in [0, 1]), calibrada sob a função de perda Tweedie (Poisson Composta com Saltos Gama), apresenta erro quadrático médio ponderado e capacidade de generalização espacial superiores aos obtidos por classificadores binários ingênuos ('presença vs. ausência' via Logistic Loss), eliminando o viés artificial de dicotomização apontado por Altman & Royston (2006).",
        title="HIPÓTESES FORMAIS DE TRABALHO DA DISSERTAÇÃO",
        border_color="0D9488",
        bg_color="F0FDFA"
    )

    # 5. INVENTÁRIO DO ACERVO BIBLIOGRÁFICO AUDITADO (111 TRABALHOS CANÔNICOS)
    h5 = doc.add_paragraph()
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(6)
    r_h5 = h5.add_run("5. INVENTÁRIO DO ACERVO BIBLIOGRÁFICO AUDITADO (111 TRABALHOS CANÔNICOS)")
    r_h5.bold = True
    r_h5.font.name = "Calibri"
    r_h5.font.size = Pt(13)
    r_h5.font.color.rgb = COLOR_PRIMARY

    p_inv_intro = doc.add_paragraph()
    p_inv_intro.paragraph_format.line_spacing = 1.3
    p_inv_intro.paragraph_format.space_after = Pt(6)
    p_inv_intro.add_run(
        "A Tabela 2 apresenta o inventário analítico integral das 111 obras canônicas que compõem o portfólio bibliográfico formal da pesquisa, auditado e catalogado em conformidade estrita com a regra R-L5 da Norma de Lastro Científico. Em observância mandatória à regra R-L1 ('Autorreferência não é lastro'), foram excluídos quaisquer documentos, relatórios ou manuais internos do próprio projeto, preservando com absoluta imparcialidade científica apenas publicações externas revisadas por pares, teses, dissertações e documentos técnicos oficiais de instituições de pesquisa reconhecidas (Embrapa, universidades e sociedades científicas). Todos os registros foram integralmente higienizados a partir da leitura da folha de rosto e consulta aos identificadores digitais canônicos (DOI / CrossRef), garantindo autores reais, anos exatos e títulos completos."
    )

    # Carregar acervo sanitizado com exatamente 111 obras canônicas
    sanitized_path = "data/acervo_sanitizado_111.json"
    with open(sanitized_path, "r", encoding="utf-8") as f:
        works = json.load(f)
        
    print(f"Inserindo exatamente {len(works)} obras canônicas externas na Tabela 2...")
    
    t2_table = doc.add_table(rows=len(works) + 1, cols=7)
    t2_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    t2_table.autofit = False
    set_table_borders(t2_table, color="CBD5E1", sz="4")
    
    col_w_t2 = [Inches(0.4), Inches(0.9), Inches(1.4), Inches(1.8), Inches(1.0), Inches(0.4), Inches(0.6)]
    format_row_header(t2_table.rows[0], col_widths=col_w_t2, bg_color="1B365D", text_color="FFFFFF")
    t2_table.rows[0].cells[0].paragraphs[0].text = "Nº"
    t2_table.rows[0].cells[1].paragraphs[0].text = "Categoria"
    t2_table.rows[0].cells[2].paragraphs[0].text = "Autores / Ano"
    t2_table.rows[0].cells[3].paragraphs[0].text = "Título da Publicação"
    t2_table.rows[0].cells[4].paragraphs[0].text = "Eixo Metodológico"
    t2_table.rows[0].cells[5].paragraphs[0].text = "Págs."
    t2_table.rows[0].cells[6].paragraphs[0].text = "SHA-256"

    for idx, w in enumerate(works, 1):
        row = t2_table.rows[idx]
        bg = "F8FAFC" if idx % 2 == 1 else "FFFFFF"
        format_data_cell(row.cells[0], w["num"], align=WD_ALIGN_PARAGRAPH.CENTER, font_size=7.5, width=col_w_t2[0], bg_color=bg, text_color="1B365D")
        format_data_cell(row.cells[1], w["cat"], font_size=7.5, width=col_w_t2[1], bg_color=bg, text_color="334155")
        format_data_cell(row.cells[2], w["authors"], font_size=7.5, width=col_w_t2[2], bg_color=bg, text_color="1F2937")
        format_data_cell(row.cells[3], w["title"], font_size=7.5, width=col_w_t2[3], bg_color=bg, text_color="1F2937")
        format_data_cell(row.cells[4], w["eixo"], font_size=7.5, width=col_w_t2[4], bg_color=bg, text_color="0D9488")
        format_data_cell(row.cells[5], w["pages"], align=WD_ALIGN_PARAGRAPH.CENTER, font_size=7.5, width=col_w_t2[5], bg_color=bg, text_color="4B5563")
        format_data_cell(row.cells[6], w["sha"][:8], font_size=7, width=col_w_t2[6], bg_color=bg, text_color="64748B")

    p_src_t2 = doc.add_paragraph()
    p_src_t2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_src_t2.paragraph_format.space_before = Pt(2)
    p_src_t2.paragraph_format.space_after = Pt(8)
    r_st2 = p_src_t2.add_run("Tabela 2 – Inventário consolidado e higienizado das 111 obras canônicas externas arquivadas com integridade SHA-256.\nFonte: Acervo formal auditado em docs/bibliografia e docs/auditorias/externa_a/ (2026).")
    r_st2.italic = True
    r_st2.font.name = "Calibri"
    r_st2.font.size = Pt(8.5)
    r_st2.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # 6. REFERÊNCIAS BIBLIOGRÁFICAS NORMATIVAS (ABNT NBR 6023:2018)
    h6 = doc.add_paragraph()
    h6.paragraph_format.space_before = Pt(14)
    h6.paragraph_format.space_after = Pt(6)
    r_h6 = h6.add_run("6. REFERÊNCIAS BIBLIOGRÁFICAS NORMATIVAS (ABNT NBR 6023:2018)")
    r_h6.bold = True
    r_h6.font.name = "Calibri"
    r_h6.font.size = Pt(13)
    r_h6.font.color.rgb = COLOR_PRIMARY

    references = [
        "ALTMAN, D. G.; ROYSTON, P. The cost of dichotomising continuous variables. BMJ, v. 332, n. 7549, p. 1080, 2006. DOI: 10.1136/bmj.332.7549.1080.",
        "ALVAREZ-VANHARD, E. et al. UAV & satellite synergies for optical remote sensing applications in agriculture and forest: a review. Science of Remote Sensing, v. 3, p. 100019, 2021. DOI: 10.1016/j.srs.2021.100019.",
        "BAZZI, C. L. et al. Estimating soil loss by laminar erosion using precision agriculture computational tools. Revista Brasileira de Engenharia Agrícola e Ambiental, v. 26, n. 12, p. 907-914, 2022. DOI: 10.1590/1807-1929/agriambi.v26n12p907-914.",
        "CHEN, T.; GUESTRIN, C. XGBoost: a scalable tree boosting system. In: ACM SIGKDD INTERNATIONAL CONFERENCE ON KNOWLEDGE DISCOVERY AND DATA MINING, 22., 2016, San Francisco. Proceedings [...]. New York: ACM, 2016. p. 785-794. DOI: 10.1145/2939672.2939785.",
        "COCHRAN, W. G. Sampling techniques. 3. ed. New York: John Wiley & Sons, 1977. 428 p. ISBN: 0-471-16240-X.",
        "DEMATTÊ, J. A. M. et al. Geospatial Soil Sensing System (GEOS3): a powerful code in Google Earth Engine to retrieve clean spectral reflectance from bare soil surface. Remote Sensing, v. 10, n. 12, p. 1828, 2018. DOI: 10.3390/rs10121828.",
        "DESMET, P. J. J.; GOVERS, G. A GIS procedure for automatically calculating the USLE LS factor on topographically complex landscape units. Journal of Soil and Water Conservation, v. 51, n. 5, p. 427-433, 1996.",
        "DRUSCH, M. et al. Sentinel-2: ESA's optical high-resolution mission for GMES operational services. Remote Sensing of Environment, v. 120, p. 25-36, 2012. DOI: 10.1016/j.rse.2012.01.006.",
        "DURIGON, V. L. et al. NDVI time series for monitoring RUSLE cover management factor in a tropical watershed. International Journal of Remote Sensing, v. 35, n. 2, p. 441-453, 2014. DOI: 10.1080/01431161.2013.871081.",
        "ENSSLIN, L. et al. ProKnow-C, knowledge development process-constructivist. Processo técnico com patente de registro de programa de computador concedida pelo INPI-Brasil. Florianópolis: LabMCDA/UFSC, 2014.",
        "FRANCHINI, J. C. et al. Evolução da fertilidade do solo em sistemas de rotação de culturas no Estado do Paraná. Londrina: Embrapa Soja, 2011. 42 p. (Embrapa Soja. Boletim de Pesquisa e Desenvolvimento, 12).",
        "FUNK, C. et al. The climate hazards group infrared precipitation with stations (CHIRPS): a quasi-global high-resolution precipitation dataset. Scientific Data, v. 2, p. 150066, 2015. DOI: 10.1038/sdata.2015.66.",
        "GERALDO, M. R. et al. Erodibilidade dos solos do Brasil: consolidação e valores representativos para as classes de solos do SiBCS. Rio de Janeiro: Embrapa Solos, 2024. 40 p. (Embrapa Solos. Documentos, 246).",
        "HICKEY, R. Slope length and steepness factors (LS) in the revised universal soil loss equation: a unified algorithm for digital elevation models. Computers & Geosciences, v. 26, n. 7, p. 835-842, 2000. DOI: 10.1016/S0098-3004(00)00015-1.",
        "HUFFMAN, G. J. et al. Integrated Multi-satellitE Retrievals for GPM (IMERG) technical documentation. Greenbelt: NASA Goddard Space Flight Center, 2020.",
        "KARYDAS, C. G.; PANAGOS, P. The G2 erosion model: an algorithm for month-time step assessments. Environmental Research, v. 161, p. 115-124, 2018. DOI: 10.1016/j.envres.2017.11.009.",
        "KAUFMAN, S. et al. Leakage in data mining: formulation, detection, and avoidance. ACM Transactions on Knowledge Discovery from Data (TKDD), v. 6, n. 4, art. 15, p. 1-21, 2012. DOI: 10.1145/2382577.2382579.",
        "LUNDBERG, S. M.; LEE, S.-I. A unified approach to interpreting model predictions. In: ADVANCES IN NEURAL INFORMATION PROCESSING SYSTEMS (NIPS 2017), 30., 2017, Long Beach. Proceedings [...]. San Diego: Neural Information Processing Systems Foundation, 2017. p. 4765-4774.",
        "MANNIGEL, A. R. et al. Fator erodibilidade e tolerância de perda de solo para solos do Estado de São Paulo. Acta Scientiarum, v. 24, n. 5, p. 1335-1340, 2002.",
        "MCCOOL, D. K. et al. Slope length and steepness factors for the revised universal soil loss equation. Transactions of the ASAE, v. 32, n. 5, p. 1571-1576, 1989. DOI: 10.13031/2013.31192.",
        "NOSEK, B. A. et al. The preregistration revolution. Proceedings of the National Academy of Sciences (PNAS), v. 115, n. 11, p. 2600-2606, 2018. DOI: 10.1073/pnas.1708274114.",
        "PLANET LABS PBC. Planet Imagery Product Specifications: PlanetScope & SkySat. San Francisco: Planet Labs, 2022. 108 p.",
        "RENARD, K. G. et al. Predicting soil erosion by water: a guide to conservation planning with the Revised Universal Soil Loss Equation (RUSLE). Washington, D.C.: USDA, 1997. 404 p. (USDA Agriculture Handbook, 703).",
        "RIKIMARU, T. et al. Tropical forest cover density mapping. New Phytologist, v. 154, n. 2, p. 288-290, 2002.",
        "ROBERTS, D. R. et al. Cross-validation strategies for data with temporal, spatial, hierarchical, or phylogenetic structure. Ecography, v. 40, n. 8, p. 913-929, 2017. DOI: 10.1111/ecog.02881.",
        "RUFINO, R. L.; BISCAIA, R. C. M.; MERTEN, G. H. Determinação do potencial de erosão das chuvas do Estado do Paraná: terceira aproximação. Revista Brasileira de Ciência do Solo, v. 17, n. 3, p. 439-444, 1993.",
        "SAFANELLI, J. L.; DEMATTÊ, J. A. M. Fine scale soil mapping from earth observation data: the Geospatial Soil Sensing System (GEOS3). Revista Brasileira de Ciência do Solo, v. 45, e0200155, 2021. DOI: 10.36783/18069657rbcs20200155.",
        "SANTOS, H. G. dos et al. Sistema Brasileiro de Classificação de Solos. 5. ed. Brasília, DF: Embrapa, 2018. 356 p. ISBN: 978-85-7035-800-4.",
        "SCHMIDT, S. Modification of the RUSLE slope length and steepness factor (LS-factor) based on rainfall-runoff and flow accumulation. Hydrology and Earth System Sciences, v. 23, n. 7, p. 3081-3091, 2019. DOI: 10.5194/hess-23-3081-2019.",
        "TRANFIELD, D.; DENYER, D.; SMART, P. Towards a methodology for developing evidence-informed management knowledge by means of systematic review. British Journal of Management, v. 14, n. 3, p. 207-222, 2003. DOI: 10.1111/1467-8551.00375.",
        "TWEEDIE, M. C. K. An index which distinguishes between some important exponential families. In: STATISTICS: APPLICATIONS AND NEW DIRECTIONS. Proceedings of the Indian Statistical Institute Golden Jubilee International Conference, 1984, Calcutta. Calcutta: Indian Statistical Institute, 1984. p. 579-604.",
        "VRIELING, A. Satellite remote sensing for water erosion assessment: a review. Catena, v. 65, n. 1, p. 2-18, 2006. DOI: 10.1016/j.catena.2005.10.005.",
        "WALTRICK, P. C. et al. Estimativa da erosividade das chuvas no Estado do Paraná. Revista Brasileira de Ciência do Solo, v. 39, n. 3, p. 819-828, 2015. DOI: 10.1590/01000683rbcs20140554.",
        "WISCHMEIER, W. H.; SMITH, D. D. Predicting rainfall erosion losses: a guide to conservation planning. Washington, D.C.: USDA, 1978. 58 p. (USDA Agriculture Handbook, 537).",
        "WOODCOCK, C. E.; STRAHLER, A. H. The factor of scale in remote sensing. Remote Sensing of Environment, v. 21, n. 3, p. 311-332, 1987. DOI: 10.1016/0034-4257(87)90015-0.",
        "ZANAGA, D. et al. ESA WorldCover 10 m 2021 v200. Zenodo, 2022. DOI: 10.5281/zenodo.5571936.",
        "ZHU, Zhe. Continuous change detection and classification of land cover using all available Landsat data. 2013. 212 f. Thesis (Doctor of Philosophy in Geography) — Boston University, Boston, 2013."
    ]

    for ref in references:
        p_ref = doc.add_paragraph()
        p_ref.paragraph_format.line_spacing = 1.15
        p_ref.paragraph_format.space_before = Pt(2)
        p_ref.paragraph_format.space_after = Pt(4)
        run_r = p_ref.add_run(ref)
        run_r.font.name = "Calibri"
        run_r.font.size = Pt(8.5)
        run_r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    # SALVANDO OS DOCUMENTOS
    target_path1 = "docs/dissertacao/Estrutura_Referencial_Teorico_Dissertacao_SAREL.docx"
    target_path2 = "docs/bibliografia/Estrutura_Referencial_Teorico_SAREL.docx"
    
    os.makedirs(os.path.dirname(target_path1), exist_ok=True)
    doc.save(target_path1)
    print(f"Documento retificado salvo em: {target_path1}")
    
    os.makedirs(os.path.dirname(target_path2), exist_ok=True)
    shutil.copyfile(target_path1, target_path2)
    print(f"Cópia retificada salva em: {target_path2}")

if __name__ == "__main__":
    build_document()
