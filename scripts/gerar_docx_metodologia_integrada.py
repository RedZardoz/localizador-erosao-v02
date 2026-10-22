#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Geração do Documento em Microsoft Word (.docx):
Metodologia Geral, Fundamentação Epistemológica de Reprodutibilidade, Prevenção de Viés Espectral,
Especificação Experimental e Glossário Normativo para a Dissertação de Mestrado (Sistema SAREL v2.0).

Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA)
Universidade Tecnológica Federal do Paraná (UTFPR) - Câmpus Medianeira
Mestrando: Luis Alfredo Ferreira da Silva
Orientador: Prof. Dr. Claudio Leones Bazzi
"""

import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def make_callout_box(doc, title, formula, note=None, bg_color="F8FAFC", border_color="059669"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.69) # 170 mm
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    # Borda destacada
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="6" w:space="0" w:color="{border_color}"/>'
        f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="{border_color}"/>'
        f'<w:left w:val="single" w:sz="18" w:space="0" w:color="{border_color}"/>'
        f'<w:right w:val="single" w:sz="6" w:space="0" w:color="{border_color}"/>'
        f'</w:tcBorders>'
    )
    cell._tc.get_or_add_tcPr().append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p.add_run(title + "\n")
    r_title.bold = True
    r_title.font.size = Pt(9.5)
    r_title.font.color.rgb = RGBColor(15, 23, 42)
    
    r_form = p.add_run(formula)
    r_form.bold = True
    r_form.font.size = Pt(11)
    r_form.font.color.rgb = RGBColor(6, 95, 70)
    
    if note:
        p2 = cell.add_paragraph()
        p2.paragraph_format.space_before = Pt(2)
        p2.paragraph_format.space_after = Pt(2)
        p2.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_note = p2.add_run(note)
        r_note.italic = True
        r_note.font.size = Pt(8.5)
        r_note.font.color.rgb = RGBColor(100, 116, 139)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def build_docx():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    out_dir = os.path.join(project_root, "docs", "BASES PARA A DISSERTAÇÃO")
    os.makedirs(out_dir, exist_ok=True)
    docx_path = os.path.join(out_dir, "Metodologia_Integrada_Dissertacao_SAREL.docx")
    
    doc = docx.Document()
    
    # Configuração de Margens da Página: 20 mm laterais, 22 mm topo, 20 mm base
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.866)    # 22 mm
        section.bottom_margin = Inches(0.787) # 20 mm
        section.left_margin = Inches(0.787)   # 20 mm
        section.right_margin = Inches(0.787)  # 20 mm
        
        # Cabeçalho Superior
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("PPGTCA / UTFPR — METODOLOGIA INTEGRADA & GLOSSÁRIO • SAREL v2.0")
        hrun.font.size = Pt(8)
        hrun.font.bold = True
        hrun.font.color.rgb = RGBColor(6, 95, 70)
        
        # Rodapé
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("Dissertação de Mestrado: Predição de Erosão Laminar na BP3 • Luis Alfredo (Orientador: Prof. Dr. Claudio L. Bazzi)")
        frun.font.size = Pt(8)
        frun.font.color.rgb = RGBColor(100, 116, 139)

    # Cores
    COLOR_NAVY = RGBColor(15, 23, 42)
    COLOR_EMERALD = RGBColor(6, 95, 70)
    COLOR_SLATE = RGBColor(51, 65, 85)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(13)
        run.font.color.rgb = COLOR_NAVY
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(11)
        run.font.color.rgb = COLOR_EMERALD
        return p

    def add_body(text, bold_prefix=None):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4.5)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        if bold_prefix:
            r_b = p.add_run(bold_prefix)
            r_b.bold = True
            r_b.font.size = Pt(10)
            r_b.font.color.rgb = COLOR_NAVY
        r_t = p.add_run(text)
        r_t.font.size = Pt(10)
        r_t.font.color.rgb = COLOR_SLATE
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        if bold_prefix:
            r_b = p.add_run(bold_prefix)
            r_b.bold = True
            r_b.font.size = Pt(9.5)
            r_b.font.color.rgb = COLOR_NAVY
        r_t = p.add_run(text)
        r_t.font.size = Pt(9.5)
        r_t.font.color.rgb = COLOR_SLATE
        return p

    # =========================================================================
    # CABEÇALHO INSTITUCIONAL & TÍTULO
    # =========================================================================
    p_inst = doc.add_paragraph()
    p_inst.paragraph_format.space_after = Pt(2)
    r_i = p_inst.add_run("UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ (UTFPR) — CÂMPUS MEDIANEIRA\nPROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO (PPGTCA)")
    r_i.bold = True
    r_i.font.size = Pt(9.5)
    r_i.font.color.rgb = COLOR_EMERALD

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(3)
    r_t = p_title.add_run("LOCALIZAÇÃO E PREDIÇÃO DE EROSÃO LAMINAR NA BACIA HIDROGRÁFICA DO PARANÁ III POR SENSORIAMENTO REMOTO MULTIFONTE E APRENDIZADO DE MÁQUINA SUPERVISIONADO POR VANT")
    r_t.bold = True
    r_t.font.size = Pt(14)
    r_t.font.color.rgb = COLOR_NAVY

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(8)
    r_s = p_sub.add_run("Metodologia Integrada, Fundamentação Epistemológica de Reprodutibilidade, Prevenção de Viés Espectral, Especificação Experimental e Glossário Normativo para a Dissertação de Mestrado")
    r_s.italic = True
    r_s.font.size = Pt(10)
    r_s.font.color.rgb = COLOR_SLATE

    # TABELA DE METADADOS
    t_meta = doc.add_table(rows=1, cols=2)
    t_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_meta, color="CBD5E1", sz="4")
    
    c0 = t_meta.cell(0, 0)
    c1 = t_meta.cell(0, 1)
    c0.width = Inches(3.34)
    c1.width = Inches(3.35)
    set_cell_background(c0, "F8FAFC")
    set_cell_background(c1, "F8FAFC")
    set_cell_margins(c0, top=100, bottom=100, left=140, right=140)
    set_cell_margins(c1, top=100, bottom=100, left=140, right=140)
    
    p_m0 = c0.paragraphs[0]
    p_m0.paragraph_format.space_after = Pt(0)
    p_m0.paragraph_format.line_spacing = 1.15
    r_m0 = p_m0.add_run(
        "Mestrando: Luis Alfredo Ferreira da Silva\n"
        "Orientador: Prof. Dr. Claudio Leones Bazzi\n"
        "Área de Concentração: Tecnologias Computacionais no Agronegócio\n"
        "Linha de Pesquisa: Geotecnologias Aplicadas e Modelagem Computacional"
    )
    r_m0.font.size = Pt(8.5)
    r_m0.font.color.rgb = COLOR_SLATE
    
    p_m1 = c1.paragraphs[0]
    p_m1.paragraph_format.space_after = Pt(0)
    p_m1.paragraph_format.line_spacing = 1.15
    r_m1 = p_m1.add_run(
        "Sistema Computacional: SAREL v2.0 (Amostragem e Rotulagem)\n"
        "Recorte Territorial: Bacia do Paraná III (7.979 km² hidrológicos; 28 municípios)\n"
        "Domínio Físico: Declividade 3,0% a 20,0% (SiBCS; Decisão D07)\n"
        "Pilares Epistemológicos: Reprodutibilidade de IA e Ausência de Vazamento (D16, D24, D25)"
    )
    r_m1.font.size = Pt(8.5)
    r_m1.font.color.rgb = COLOR_SLATE

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # =========================================================================
    # SEÇÃO 1: INTRODUÇÃO E HIPÓTESES
    # =========================================================================
    add_h1("1. Introdução, Estado da Arte Regional e Definição do Problema")
    add_body(
        "A erosão hídrica laminar (sheet erosion) consiste no desprendimento e transporte difuso de delgadas camadas superficiais do solo "
        "pelo impacto cinético das gotas de chuva (splash detachment) e deflúvio superficial não concentrado (sheet runoff). "
        "Por não formar ravinamentos imediatos, sua ocorrência mascara a severa e progressiva degradação dos solos agricultáveis."
    )
    add_body(
        "Na Bacia Hidrográfica do Rio Paraná III (BP3), recorte territorial deste estudo abrangendo aproximadamente 7.979 km² "
        "de drenagem estrita (base oficial IAT/SEMA/ANA) e 28 municípios do oeste paranaense (19 integrais e 9 parciais; IBGE/ITCG), "
        "a intensa exploração agrícola sobre Latossolos e Nitossolos Vermelhos distroférricos basálticos deságua diretamente na margem "
        "esquerda do Reservatório da Usina Hidrelétrica de Itaipu Binacional, onde o aporte de sedimentos finos compromete a qualidade da água e a vida útil do empreendimento."
    )
    add_body(
        "Investigações pioneiras desenvolvidas no âmbito do PPGTCA/UTFPR sob coordenação do Prof. Dr. Claudio Leones Bazzi (BAZZI et al., 2022; KRUG, 2024; LUCAS, 2024) "
        "evidenciaram tanto o potencial quanto as restrições dos modelos analítico-empíricos lineares clássicos na região oeste do Paraná. Em Bazzi et al. (2022), "
        "demonstrou-se que a variabilidade espacial dos fatores da Equação Universal de Perda de Solo (USLE) exige parametrizações locais detalhadas para orientar a conservação do solo. "
        "Nas dissertações de Lucas (2024) e Krug (2024), avaliou-se o impacto de cenários conservacionistas e variações pluviométricas na bacia. "
        "Entretanto, a literatura manteve-se restrita à formulação empírica da USLE/RUSLE (WISCHMEIER; SMITH, 1978; RENARD et al., 1997), que parte de "
        "parcelas experimentais homogêneas de 22,1 metros e gera distorções em escala de bacia por desconsiderar complexas não-linearidades de terreno e manejo. "
        "O presente projeto preenche essa lacuna com a concepção do SAREL (Sistema de Amostragem e Rotulagem para Erosão Laminar).",
        bold_prefix="O Estado da Arte no PPGTCA e a Lacuna Regional: "
    )
    add_body(
        "Modelos de aprendizado de máquina supervisionados por VANT (Gradient Boosted Trees / XGBoost), integrando "
        "preditores espectro-temporais decenais do satélite Sentinel-2, variáveis morfométricas de terreno do Copernicus DEM 30 m e dados edafoclimáticos, "
        "apresentam capacidade preditiva e discriminatória da erosão laminar significativamente superior à linha de base da RUSLE regional na BP3 "
        "(definida como ganho de correlação de Spearman Delta rho >= 0,10 com p < 0,05; Decisão D25).",
        bold_prefix="Hipótese Central (H1): "
    )
    add_body(
        "A formulação do alvo como variável contínua (fração de célula erodida y in [0, 1]; Decisão D26) "
        "ajustada por distribuição Tweedie (reg:tweedie) preserva informação biofísica real e supera abordagens binarizadas convencionais sujeitas "
        "à perda amostral por dicotomização artificial (ALTMAN; ROYSTON, 2006).",
        bold_prefix="Hipótese Secundária (H2): "
    )

    # =========================================================================
    # SEÇÃO 2: INTRODUÇÃO METODOLÓGICA — REPLICABILIDADE E AUSÊNCIA DE VIÉS
    # =========================================================================
    add_h1("2. Introdução da Parte Metodológica: Fundamentação Epistemológica de Replicabilidade e Prevenção de Viés Espectral")
    add_body(
        "A aplicação de inteligência artificial em geociências e ciências agrárias enfrenta com frequência dois questionamentos metodológicos centrais: "
        "(1) Como garantir a replicabilidade científica de um modelo se os algoritmos de aprendizado de máquina são intrinsecamente probabilísticos?; e "
        "(2) Não existe o risco de o treinamento ficar 'viciado' nos dados de altíssima precisão obtidos pelo sensor multiespectral do drone (VANT)? "
        "Esta seção estabelece as bases epistemológicas e matemáticas adotadas no SAREL para neutralizar ambos os riscos antes de detalhar o protocolo experimental."
    )
    
    add_h2("2.1 Eixo I: A Replicabilidade Científica em Modelos Probabilísticos de Aprendizado de Máquina")
    add_body(
        "Na ciência da computação e na inferência estatística moderna, algoritmos de aprendizado de máquina baseados em árvores (como o XGBoost; CHEN; GUESTRIN, 2016) "
        "ou descida de gradiente estocástica não são 'mágicos' ou aleatórios no sentido caótico. Eles são funções matemáticas determinísticas "
        "alimentadas por Geradores de Números Pseudoaleatórios (PRNG). O SAREL ancora sua replicabilidade em três pilares epistemológicos "
        "estabelecidos pela literatura de ponta (PINEAU et al., 2021; NOSEK et al., 2018):"
    )
    add_bullet(
        "Todo componente estocástico do sistema — desde a inicialização dos nós das árvores, a subamostragem de linhas e colunas (subsample e colsample_bytree) "
        "até a partição de dobras de validação cruzada — opera sob sementes criptograficamente registradas e imutáveis (seed registry; Decisão P01). "
        "O repositório encapsula o ambiente computacional exato via arquivos de bloqueio de dependências determinísticos (uv.lock / package-lock.json), "
        "garantindo que qualquer pesquisador que execute o pipeline sobre a mesma massa de dados obterá matrizes de pesos e predições com identidade binária bit a bit (PINEAU et al., 2021).",
        bold_prefix="Pilar 1 — Determinismo Numérico e Reprodutibilidade Exata do Código: "
    )
    add_bullet(
        "Um achado científico não pode depender da semente aleatória escolhida (ex.: se a hipótese for corroborada na semente 42, mas refutada na 43, o achado é artefato espúrio). "
        "Para comprovar estabilidade assintótica, o SAREL adota validação por distribuições amostrais completas via 1.000 iterações de Bootstrap agrupado por polígono (clustered bootstrap) "
        "(CAMERON; GELBACH; MILLER, 2008). O ganho do XGBoost sobre a linha de base analítica RUSLE é declarado estatisticamente demonstrado apenas se o limite inferior "
        "do intervalo de confiança de 95% do ganho Delta rho for estritamente superior a zero (Delta rho >= 0,10 com p < 0,05; ROBERTS et al., 2017; Decisões D24 e D25).",
        bold_prefix="Pilar 2 — Reprodutibilidade Estatística e Invariância à Semente Amostral: "
    )
    add_bullet(
        "A maior causa de não-replicabilidade em aprendizado de máquina aplicado não decorre do algoritmo, mas da flexibilidade analítica retrospectiva do pesquisador "
        "(testar centenas de hiperparâmetros ou métricas após observar os dados até que um resultado conveniente surja; NOSEK et al., 2018). "
        "O SAREL adota o paradigma de Pré-Registro Científico (Open Science): o domínio físico de declividade (3,0% a 20,0%; D07), a estratificação em 18 estratos (D12), "
        "o tamanho amostral de 72 polígonos de 5,02 ha (D16), os tetos de preditores por bloco físico (máx. 14; D24), a métrica primária contínua (Spearman; D26) "
        "e o piso de refutação (D25) foram fixados no repositório antes da coleta e do ajuste do modelo, eliminando o HARKing (Hypothesizing After Results are Known).",
        bold_prefix="Pilar 3 — Reprodutibilidade Experimental e Pré-Registro Científico Open Science: "
    )

    add_h2("2.2 Eixo II: Neutralização do Risco de 'Viciar' o Modelo nos Dados Centimétricos do VANT")
    add_body(
        "A preocupação de que o modelo possa ficar 'viciado' (sobreajustado) na altíssima resolução do sensor multiespectral embarcado no VANT decorre "
        "de uma confusão comum entre dado de entrada (variável preditora ou feature) e dado de referência pericial (rótulo ou ground truth target). "
        "O projeto SAREL resolve essa questão por meio de três salvaguardas metodológicas rigorosas:"
    )
    add_bullet(
        "O modelo XGBoost JAMAIS recebe em sua matriz de treino a refletância multiespectral de 4 cm do sensor Spectral 2. "
        "O ortomosaico centimétrico gerado pelo VANT serve unicamente aos peritos humanos em solo para realizar a fotointerpretação e vetorização manual "
        "das feições diagnósticas de erosão ativa (pedestais, raízes expostas, microssulcos e leques coluviais). Essa máscara vetorial é rasterizada "
        "para a célula de 10 m do Sentinel-2, definindo a fração de área erodida (y_i in [0, 1]). "
        "As variáveis preditoras alimentadas no modelo continuam sendo exclusivamente os dados orbitais do Sentinel-2 (10 m), o Copernicus DEM (30 m) e as cartas oficiais de solo e chuva. "
        "Portanto, o sistema não aprende feições espectrais do sensor do drone; ele aprende como os pixels do satélite orbital Sentinel-2 respondem à erosão real confirmada em campo.",
        bold_prefix="Desacoplamento Arquitetural Rígido: O VANT é Rótulo Pericial (Y), Jamais Variável Preditora (X) (D06, D16 e D26): "
    )
    add_bullet(
        "O uso do VANT resolve o maior gargalo histórico do sensoriamento remoto de erosão: a contaminação do rótulo por erro de agregação subpixel (point-to-pixel misalignment). "
        "Em levantamentos convencionais com GPS de navegação em ponto único (erro de 3 a 8 m), o ponto cai frequentemente na borda ou fora da célula de 10 m. "
        "Com o ortomosaico de 4 cm do VANT Spectral 2 e precisão posicional CE90 de 1,47 m, cada célula orbital de 10 x 10 m (100 m²) contém cerca de 62.500 micropixels "
        "de observação contínua, permitindo calcular a fração erodida real com fidelidade matemática e sem ruído de borda.",
        bold_prefix="A Teoria da Escala em Sensoriamento Remoto e a Validade Ecológica (WOODCOCK; STRAHLER, 1987; ALVAREZ-VANHARD et al., 2021): "
    )
    add_bullet(
        "O risco real de viés reside na autocorrelação espacial (células vizinhas do mesmo sobrevoo partilharem feições idênticas; PLOTON et al., 2020; KAPOOR; NARAYANAN, 2023). "
        "Para neutralizar esse vazamento, o SAREL implementa: (a) Spatial Block Cross-Validation baseada no alcance prático do variograma (a ≈ 50 m; ROBERTS et al., 2017); "
        "e (b) a reserva estrita de 36 polígonos amostrais inteiros de 5,02 ha mantidos em held-out lacrado (2 polígonos por estrato de D12; D16). "
        "A avaliação da performance final ocorre exclusivamente sobre essas áreas lacradas, onde o algoritmo jamais viu qualquer dado de treino ou de voo.",
        bold_prefix="Prevenção de Vazamento Espacial de Dados (Data Leakage) e Isolamento de 36 Polígonos de Teste (D16 e D25): "
    )

    add_h2("2.3 Roteiro Sintético de Defesa e Arguição em Seminários e Bancas")
    add_body(
        "\"A replicabilidade do nosso trabalho não depende de 'sorte' estocástica: o código é 100% determinístico com sementes e dependências auditáveis (P01; Pineau et al., 2021). "
        "Para garantir que o resultado não seja refém da semente, validamos a hipótese por intervalos de confiança empíricos de 95% derivados de 1.000 reamostragens de Bootstrap agrupado "
        "em 36 polígonos independentes (Cameron et al., 2008), sob pré-registro metodológico aberto (Nosek et al., 2018). "
        "Quanto ao risco de 'viciar' no VANT, não há essa possibilidade porque o sensor multiespectral Spectral 2 NUNCA entra na matriz de preditores do modelo (D24). "
        "O drone atua como verdade de campo pericial para rotulagem (Y), enquanto as variáveis preditoras (X) vêm estritamente do satélite Sentinel-2 (10 m), do DEM Copernicus (30 m) e do solo regional. "
        "O VANT calibra a verdade; a predição em escala de bacia opera exclusivamente por satélite orbital.\"",
        bold_prefix="Síntese Verbal de Defesa em Bancas Examinadoras: "
    )

    # =========================================================================
    # SEÇÃO 3: ESPECIFICAÇÃO METODOLÓGICA DETALHADA E MODELAGEM MATEMÁTICA
    # =========================================================================
    add_h1("3. Especificação Metodológica Detalhada e Modelagem Matemática (SAREL v2.0)")
    
    add_h2("3.1 Recorte Espacial e Máscara Territorial de Elegibilidade (Decisão D07)")
    add_body(
        "O domínio geográfico da pesquisa compreende a Bacia Hidrográfica do Rio Paraná III (BP3), abrangendo 28 municípios do oeste paranaense "
        "e aproximadamente 7.979 km² de drenagem estrita (base oficial IAT/SEMA/ANA). Para assegurar a validade ecológica dos modelos e garantir que a predição "
        "incida estritamente sobre as áreas agrícolas onde a erosão laminar é o processo atuante, aplica-se a Máscara Territorial de Elegibilidade (Decisão D07), "
        "composta pelos seguintes critérios físicos cumulativos:"
    )
    add_bullet(
        "Admitem-se exclusivamente as classes 30 (pastagem cultivada) e 40 (lavouras anuais de grãos). A classe 60 (solo exposto e vegetação esparsa) é expressamente excluída da entrada para evitar circularidade com a dimensão Ê da estratificação (frequência histórica de solo nu). Exige-se concordância estrita entre as versões v100 (2020) e v200 (2021) do produto.",
        bold_prefix="Uso e Cobertura da Terra (ESA WorldCover 10 m): "
    )
    add_bullet(
        "Remoção de massas d'água permanentes (JRC Global Surface Water com buffer de exclusão de 30 m) e malhas urbanas/antrópicas consolidadas (buffer de 150 m; regra P04).",
        bold_prefix="Exclusão Hidrográfica e Urbana: "
    )
    add_bullet(
        "Recorte restrito rigorosamente ao intervalo de 3,0% a 20,0% (classes de relevo suave-ondulado a ondulado do Sistema Brasileiro de Classificação de Solos — SiBCS; EMBRAPA SOLOS, 2018), calculada em projeção métrica SIRGAS 2000 / UTM fuso 22S (EPSG:31982). Áreas planas (< 3,0%) são excluídas por ausência de energia cinética no deflúvio difuso para transporte laminar (predomínio de deposição); encostas íngremes (> 20,0%) são excluídas pois o escoamento converge rapidamente em sulcos estruturais e voçorocas, fenômenos morfodinâmicos distintos da erosão laminar que este projeto visa modelar.",
        bold_prefix="Janela Física de Declividade (Decisão D07 e P04): "
    )
    add_bullet(
        "Fora dos limites de 3,0% a 20,0% de declividade e fora das classes agrícolas 30 e 40, nenhuma predição é declarada válida e nenhuma métrica de avaliação é computada (Decisão D25).",
        bold_prefix="Vedação de Extrapolação: "
    )

    add_h2("3.2 Desenho Amostral e Estratificação Multivariada em 18 Estratos Canônicos (Decisão D12)")
    add_body(
        "Amostragens aleatórias simples ou dirigidas por conveniência logística enviesam o aprendizado de máquina em sensoriamento remoto, pois sub-representam "
        "combinações biofísicas raras na paisagem. O SAREL implementa uma partição multivariada determinística em 18 estratos biofísicos canônicos, "
        "estruturados pela matriz fatorial Ŝ × Ê × K̂ dentro do domínio de elegibilidade de 3,0% a 20,0%:"
    )
    add_bullet(
        "3 tercis empíricos de declividade derivados do Copernicus DEM 30 m (D21) dentro da faixa válida de 3,0% a 20,0% (Tercil Suave: 3,0% a ≈7%; Tercil Médio: ≈7% a ≈13%; Tercil Forte: ≈13% a 20,0%).",
        bold_prefix="Declividade do Terreno (Ŝ): "
    )
    add_bullet(
        "3 tercis empíricos da frequência decenal de exposição do solo no intervalo [0, 1], definida como a fração de cenas orbitais válidas com índice NDVI <= 0,25 da série Sentinel-2 L2A (Decisão D10; calibrado pelo sistema GEOS3/GeoCiS/ESALQ-USP para solos agrícolas tropicais).",
        bold_prefix="Frequência Histórica de Solo Nu (Ê): "
    )
    add_bullet(
        "2 níveis numéricos derivados da carta oficial de erodibilidade da Embrapa Solos (Doc. 246/2024; D14): Nível 1 = Baixa/Média erodibilidade (classes 1 a 3 do SiBCS, K <= 0,0285 Mg h MJ^-1 mm^-1; predomínio de Latossolos) e Nível 2 = Alta/Muito Alta erodibilidade (classes 4 e 5, K >= 0,0300 Mg h MJ^-1 mm^-1; predomínio de Nitossolos e Neossolos). Totalizando exatamente 3 × 3 × 2 = 18 estratos canônicos.",
        bold_prefix="Erodibilidade Pedológica do Solo (K̂; Decisão D09): "
    )
    add_body(
        "Para neutralizar a dependência espacial dentro do mesmo estrato, aplica-se o algoritmo de Spatial Thinning geodésico determinístico "
        "(Fisher-Yates com semente fixa P01 e raio mínimo de exclusão euclidiana r >= 1,0 km; regra P02), garantindo a dispersão territorial da amostragem."
    )

    add_h2("3.3 Unidade de Análise e Invariante de Suporte Espacial Nativo Declarado (Decisão D06)")
    add_body(
        "A unidade básica de predição e inferência do sistema é a célula de 10 x 10 m do sensor Sentinel-2 MSI Nível-2A em sua grade orbital nativa. "
        "Em estrito cumprimento ao Invariante de Suporte Espacial (D06 e D24), nenhum preditor de resolução mais grossa é artificialmente reamostrado para fingir "
        "suporte centimétrico. O relevo opera no suporte nativo de 30 m do Copernicus DEM (D21), a erodibilidade K opera no suporte do polígono cartográfico oficial da Embrapa Solos (D14), "
        "e a chuva opera na grade regional de 5 km do CHIRPS (D13), eliminando a pseudorreplicação estatística."
    )

    add_h2("3.4 Sensoriamento Orbital e Decomposição Harmônica Temporal OLS")
    add_body(
        "A partir da coleção decenal Sentinel-2 L2A (BOA Harmonized), aplicando a máscara de qualidade SCL para exclusão estrita de nuvens e sombras, "
        "ajusta-se para cada pixel a Decomposição Harmônica Multivariada por Mínimos Quadrados Ordinários (OLS) (ZHU; WOODCOCK, 2014):"
    )
    make_callout_box(
        doc,
        title="Equação 1. Decomposição Harmônica Temporal OLS (Zhu & Woodcock, 2014)",
        formula="ρ̂(t) = c₀ + c₁·t + ∑ᵢ₌₁² [ aᵢ·cos(2π·i·t / T) + bᵢ·sin(2π·i·t / T) ]",
        note="onde t é o tempo decimal, T = 365,25 dias, c₀ é a refletância média histórica, c₁ a tendência decenal, e (aᵢ, bᵢ) são coeficientes harmônicos sazonais de 1º e 2º harmônicos."
    )

    add_h2("3.5 Sensoriamento Aerotransportado (VANT) e Definição do Alvo Contínuo (Decisões D16 e D26)")
    add_body(
        "A campanha aerotransportada opera o VANT de asa fixa Spectral 2 (Nuvem UAV), equipado com sensor multiespectral de 5 bandas calibradas "
        "(Azul 475 nm, Verde 560 nm, Vermelho 668 nm, RedEdge 717 nm e NIR 840 nm), sensor de irradiância incidente (downwelling light sensor) "
        "e posicionamento geodésico GNSS PPK (L1/L2), com GSD médio medido de 3,8 cm e acurácia posicional CE90 de 1,47 m. "
        "Conforme a Decisão D16 (emendada em 29/09/2026), planejaram-se 72 polígonos amostrais de 5,02 ha (4 por estrato de D12). "
        "A adoção de 5,02 ha (quadrado de 224 x 224 m ou retângulo até 1:2) ajusta a amostragem ao padrão fundiário de minifúndios da BP3 (mediana de 11,7 ha), "
        "elevando a elegibilidade dos imóveis de 43,4% para 71,8% e mitigando o viés de recusa de proprietários rurais. "
        "Em cada quarteto de estrato, 2 polígonos são sorteados para treino e 2 polígonos são lacrados como teste independente (held-out)."
    )
    add_body(
        "Sobre o ortomosaico de 4 cm, peritos realizam a vetorização manual das feições ativas de erosão laminar. "
        "A camada vetorial é rasterizada sobre a grade Sentinel-2 de 10 m, definindo o alvo primário contínuo (Decisão D26):"
    )
    make_callout_box(
        doc,
        title="Equação 2. Alvo Primário Contínuo de Erosão Laminar por Célula Orbital (Decisão D26)",
        formula="yᵢ = ( Área Delineada como Erodida no VANT dentro da célula 10x10 m ) / ( 100 m² )  ∈  [0, 1]",
        note="Alvo secundário derivado para reporte de métricas clássicas (AUC): célula erodida se yᵢ >= 0,25 (25 m² de erosão ativa na célula de 100 m²)."
    )

    add_h2("3.6 A Linha de Base Analítica RUSLE Parametrizada para o Paraná")
    add_body(
        "Como competidor de referência analítico, o SAREL implementa a Equação Universal de Perda de Solo Revisada (RUSLE; RENARD et al., 1997): "
        "A = R · K · LS · C · P (perda anual estimada em Mg ha^-1 ano^-1), auditada e parametrizada com coeficientes científicos específicos do Paraná:"
    )
    add_bullet(
        "Calculado a partir de totais pluviométricos mensais do CHIRPS v2.0 (proveniência modelado, sucedâneo do EI30 com tolerância regional de +-10%), "
        "aplicando-se a equação regional de erosividade do Paraná estabelecida por Rufino, Biscaia e Merten (1993) e atualizada por Waltrick et al. (2010):",
        bold_prefix="Fator R — Erosividade da Chuva (Decisão D13): "
    )
    make_callout_box(
        doc,
        title="Equação 3. Equação Regional de Erosividade do Paraná (Rufino et al., 1993; Waltrick et al., 2010)",
        formula="EI₃₀, mês = 67,355 · ( p² / P )^0,8522     ⇒     R = ∑ₘ₌₁¹² EI₃₀, mês",
        note="onde p representa a precipitação média mensal histórica (mm) e P a precipitação média anual histórica (mm) da célula regional."
    )
    add_bullet(
        "Extraído diretamente do campo numérico k_solos da camada GeoServer oficial da Embrapa Solos (Doc. 246/2024; proveniência tabelado), "
        "que mapeia os solos brasileiros segundo o SiBCS. Na Bacia do Paraná III, os Latossolos Vermelhos apresentam erodibilidade K na faixa de 0,0130 a 0,0170 Mg h MJ^-1 mm^-1, "
        "enquanto os Nitossolos Vermelhos variam entre 0,0240 e 0,0280 Mg h MJ^-1 mm^-1. Por D08, a heurística taxonômica foi aposentada, utilizando-se a proveniência oficial tabelada.",
        bold_prefix="Fator K — Erodibilidade Pedológica do Solo (Decisão D14): "
    )
    add_bullet(
        "Calculado pelo algoritmo bidimensional de área de contribuição específica de Desmet e Govers (1996) sobre o Modelo Digital de Elevação "
        "Copernicus DEM 30 m (D21), projetado em SIRGAS 2000 UTM 22S (EPSG:31982) com distorção cartográfica corrigida. Os expoentes de declividade "
        "adotam as equações padrão da RUSLE (RENARD et al., 1997), com o expoente m dependente da razão entre a erosão em sulco e entresulcos.",
        bold_prefix="Fator LS — Relação Comprimento e Grau de Declive Bidimensional (Decisão D15): "
    )
    add_bullet(
        "Calculado dinamicamente para cada época a partir do NDVI orbital pela equação tropical calibrada para biomas brasileiros por Durigon et al. (2014): "
        "C = (1 - NDVI) / 2. Sob o regime de Sistema Plantio Direto (SPD; Decisão D20), o índice é modulado pelo Bare Soil Index (BSI) "
        "segundo C_hibrido = ((1 - NDVI) / 2) · (1 + BSI), restrito ao domínio biofísico fechado [0, 1].",
        bold_prefix="Fator C — Uso e Manejo da Terra (Decisões D01 e D20): "
    )
    add_bullet(
        "Fixado na constante 1,0 para a avaliação regional sem cadastro fundiário de terraços (linha de base conservadora; RENARD et al., 1997), "
        "sendo refinado nos pontos com verificação presencial em campo por meio de estratificação por classe de declividade e práticas de manejo registradas no SAREL Coletor.",
        bold_prefix="Fator P — Práticas Conservacionistas de Suporte (Decisão D22): "
    )

    add_h2("3.7 Modelagem Preditiva XGBoost Tweedie, Teto por Bloco e Falsificabilidade (D24 e D25)")
    add_body(
        "Em vertentes agrícolas manejadas sob conservação, a maioria das células de 10 m não apresenta erosão ativa (massa concentrada em zero). "
        "Para modelar a inflação de zeros sem descartar a variabilidade contínua da fração erodida (y_i in [0, 1]), o SAREL adota o algoritmo XGBoost "
        "com a função de perda da distribuição Tweedie (reg:tweedie) (CHEN; GUESTRIN, 2016), que modela conjuntamente a componente de probabilidade de zero "
        "e a cauda contínua gama não-negativa.",
        bold_prefix="Tratamento de Excesso de Zeros: "
    )
    add_body(
        "O desenho por polígonos de D16 elevou o regime amostral de forma assimétrica entre os blocos. Considerando o alcance de autocorrelação espacial "
        "de 50 m (que deflaciona os micropixels para unidades independentes), o SAREL estabelece tetos rígidos para impedir o sobreajuste e a pseudorreplicação estatística:",
        bold_prefix="Regime de Dados e Teto de Preditores por Bloco Físico (Decisão D24): "
    )
    add_bullet("Teto de até 8 preditores (~1.845 unidades espacialmente independentes nos 72 polígonos; regime estatístico plenamente adequado).", bold_prefix="Bloco Espectro-Temporal (Sentinel-2): ")
    add_bullet("Teto de até 4 preditores (~396 unidades independentes a 30 m; admitido por necessidade física com restrições de monotonicidade).", bold_prefix="Bloco de Terreno (Copernicus DEM 30 m): ")
    add_bullet("Teto de exatamente 1 preditor (a erodibilidade K oficial k_solos; ordem pedológica aposentada por D08).", bold_prefix="Bloco de Solo (Embrapa Solos): ")
    add_bullet("Teto de exatamente 1 preditor (o fator R de erosividade anual).", bold_prefix="Bloco de Chuva (CHIRPS Regional): ")
    add_bullet("No máximo 14 variáveis preditoras (8 + 4 + 1 + 1 = 14; Decisão D24), com restrições físicas de monotonicidade positiva (monotone_constraints) impostas para declividade, erodibilidade e solo exposto.", bold_prefix="Teto Total na Matriz Preditora: ")
    add_body(
        "Em conformidade com as diretrizes de reprodutibilidade em machine learning (PINEAU et al., 2021) e combate a vazamento de dados (PLOTON et al., 2020; KAPOOR; NARAYANAN, 2023), "
        "o treinamento adota Spatial Block Cross-Validation agrupada por polígono (GroupKFold). "
        "A avaliação honesta final ocorre exclusivamente uma única vez sobre os 36 polígonos mantidos em held-out lacrado (cerca de 936 unidades efetivas independentes; D16). "
        "Em cumprimento ao pré-registro (NOSEK et al., 2018), fixam-se três desfechos epistemológicos formais avaliados sob correlação de postos de Spearman e Bootstrap agrupado (CAMERON; GELBACH; MILLER, 2008):\n"
        "1. Corroboração: rho_XGBoost >= 0,40 E Delta rho = (rho_XGBoost - rho_RUSLE) >= 0,10 com p < 0,05 (ganho substancial comprovado).\n"
        "2. Refutação: rho_XGBoost < 0,40 OU limite inferior do IC 95% de Delta rho <= 0 (modelo não supera o RUSLE ou não discrimina).\n"
        "3. Inconclusiva pela Margem: rho_XGBoost >= 0,40 e rho_XGBoost > rho_RUSLE, mas Delta rho < 0,10 (utilidade sem superioridade expressiva demonstrada).",
        bold_prefix="Prevenção de Vazamento Espacial e Critério Pré-Registrado de Falsificabilidade (D25): "
    )

    # =========================================================================
    # SEÇÃO 4: TABELAS SÍNTESE
    # =========================================================================
    add_h1("4. Tabelas Síntese da Metodologia e Desenho Experimental")
    
    # TABELA 1
    p_t1 = doc.add_paragraph()
    r_t1 = p_t1.add_run("Tabela 1. Matriz de Estratificação Biofísica Amostral da Bacia do Paraná III (18 Estratos Canônicos — Decisões D07, D09, D12, D16)")
    r_t1.bold = True
    r_t1.font.size = Pt(9.5)
    
    t_est = doc.add_table(rows=10, cols=5)
    t_est.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_est, color="CBD5E1", sz="4")
    
    headers_t1 = ["Estratos ID (D12)", "Declividade (Ŝ; D07)", "Freq. Solo Nu (Ê; D10)", "Erodibilidade K (K̂; D09)", "Alocação VANT (D16)"]
    widths_t1 = [Inches(1.0), Inches(1.5), Inches(1.3), Inches(1.6), Inches(1.29)]
    
    for j, h in enumerate(headers_t1):
        cell = t_est.cell(0, j)
        cell.width = widths_t1[j]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    rows_t1 = [
        ("E_1_1_1 & E_1_1_2", "Tercil Suave (3,0% a ≈7%)", "Tercil 1: Baixa Exposição", "Nível 1 (K <= 0,0285) / Nível 2 (K >= 0,0300)", "4 polígonos / estrato (2 treino + 2 teste)"),
        ("E_1_2_1 & E_1_2_2", "Tercil Suave (3,0% a ≈7%)", "Tercil 2: Média Exposição", "Nível 1 (K <= 0,0285) / Nível 2 (K >= 0,0300)", "4 polígonos / estrato (2 treino + 2 teste)"),
        ("E_1_3_1 & E_1_3_2", "Tercil Suave (3,0% a ≈7%)", "Tercil 3: Alta Exposição", "Nível 1 (K <= 0,0285) / Nível 2 (K >= 0,0300)", "4 polígonos / estrato (2 treino + 2 teste)"),
        ("E_2_1_1 & E_2_1_2", "Tercil Médio (≈7% a ≈13%)", "Tercil 1: Baixa Exposição", "Nível 1 (K <= 0,0285) / Nível 2 (K >= 0,0300)", "4 polígonos / estrato (2 treino + 2 teste)"),
        ("E_2_2_1 & E_2_2_2", "Tercil Médio (≈7% a ≈13%)", "Tercil 2: Média Exposição", "Nível 1 (K <= 0,0285) / Nível 2 (K >= 0,0300)", "4 polígonos / estrato (2 treino + 2 teste)"),
        ("E_2_3_1 & E_2_3_2", "Tercil Médio (≈7% a ≈13%)", "Tercil 3: Alta Exposição", "Nível 1 (K <= 0,0285) / Nível 2 (K >= 0,0300)", "4 polígonos / estrato (2 treino + 2 teste)"),
        ("E_3_1_1 & E_3_1_2", "Tercil Forte (≈13% a 20,0%)", "Tercil 1: Baixa Exposição", "Nível 1 (K <= 0,0285) / Nível 2 (K >= 0,0300)", "4 polígonos / estrato (2 treino + 2 teste)"),
        ("E_3_2_1 & E_3_2_2", "Tercil Forte (≈13% a 20,0%)", "Tercil 2: Média Exposição", "Nível 1 (K <= 0,0285) / Nível 2 (K >= 0,0300)", "4 polígonos / estrato (2 treino + 2 teste)"),
        ("E_3_3_1 & E_3_3_2", "Tercil Forte (≈13% a 20,0%)", "Tercil 3: Alta Exposição", "Nível 1 (K <= 0,0285) / Nível 2 (K >= 0,0300)", "4 polígonos / estrato (2 treino + 2 teste)")
    ]
    
    for i, row in enumerate(rows_t1, 1):
        bg = "FFFFFF" if i % 2 == 1 else "F8FAFC"
        for j, val in enumerate(row):
            cell = t_est.cell(i, j)
            cell.width = widths_t1[j]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.0)
            if j == 0:
                r.bold = True
                r.font.color.rgb = COLOR_NAVY
            else:
                r.font.color.rgb = COLOR_SLATE

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # TABELA 2
    p_t2 = doc.add_paragraph()
    r_t2 = p_t2.add_run("Tabela 2. Especificação do Vetor de Preditores, Resolução Nativa e Proveniência (Decisões D06, D21, D24)")
    r_t2.bold = True
    r_t2.font.size = Pt(9.5)
    
    t_pred = doc.add_table(rows=6, cols=5)
    t_pred.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_pred, color="CBD5E1", sz="4")
    
    headers_t2 = ["Bloco Temático", "Variáveis Preditoras / Features (Teto D24)", "Fonte Primária", "Suporte Nativo", "Selo Proveniência"]
    widths_t2 = [Inches(1.2), Inches(2.3), Inches(1.5), Inches(0.9), Inches(0.79)]
    
    for j, h in enumerate(headers_t2):
        cell = t_pred.cell(0, j)
        cell.width = widths_t2[j]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    rows_t2 = [
        ("Espectro-Temporal (Máx. 8 variáveis)", "Bandas B2, B3, B4, B8, B11, B12; NDVI, BSI; Coeficientes harmônicos OLS (c0, c1, a1, b1); Frequência de solo nu (Ê).", "Sentinel-2 MSI L2A (BOA)", "10 m e 20 m", "[P-1] Medido"),
        ("Morfometria Relevo (Máx. 4 variáveis)", "Declividade (3,0% a 20,0%), Orientação (Aspect), Curvatura de Perfil e Plano, Fator LS bidimensional.", "Copernicus DEM GLO-30 (D21)", "30 m nativo", "[P-2] Modelado"),
        ("Pedologia / Solo (Exatamente 1 variável)", "Erodibilidade K oficial (k_solos da carta Embrapa Solos Doc. 246/2024; D14; ordem pedológica aposentada por D08).", "Embrapa Solos (Doc. 246/2024)", "Polígono Cartográfico", "[P-3] Tabelado"),
        ("Climatologia / Chuva (Exatamente 1 variável)", "Fator R de erosividade anual da chuva (equação regional Rufino et al. / Waltrick et al. sobre CHIRPS mensal; D13).", "CHIRPS v2.0 + IAT-PR", "Grade Regional ~5 km", "[P-2] Modelado"),
        ("Alvo Supervisionado (Verdade de Campo / VANT)", "Fração contínua da área da célula de 10 m erodida (y_i in [0, 1]) por vetorização pericial de ortomosaico. Binário derivado: y_i >= 0,25.", "VANT Spectral 2 (Nuvem UAV)", "GSD ~3,8 cm (CE90 1,47 m)", "[P-1] Medido (Campo/Voo)")
    ]
    
    for i, row in enumerate(rows_t2, 1):
        bg = "FFFFFF" if i % 2 == 1 else "F8FAFC"
        for j, val in enumerate(row):
            cell = t_pred.cell(i, j)
            cell.width = widths_t2[j]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.0)
            if j == 0:
                r.bold = True
                r.font.color.rgb = COLOR_NAVY
            else:
                r.font.color.rgb = COLOR_SLATE

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # =========================================================================
    # SEÇÃO 5: GLOSSÁRIO NORMATIVO DE DECISÕES E REGRAS
    # =========================================================================
    add_h1("5. Glossário Normativo de Decisões Metodológicas e Regras do Sistema SAREL v2.0")
    add_body(
        "Este glossário sintetiza o registro canônico das 26 Decisões Metodológicas (D01 a D26), dos 5 Parâmetros Operacionais (P01 a P05) "
        "e dos Invariantes da Lei Fundamental implementados no código-fonte do SAREL, assegurando rastreabilidade irrestrita entre a teoria e o software."
    )
    
    # TABELA 3A: D01 A D14
    p_t3a = doc.add_paragraph()
    r_t3a = p_t3a.add_run("Tabela 3A. Glossário das Decisões Metodológicas e Arquiteturais (D01 a D14 — Decisões Pré-Registradas)")
    r_t3a.bold = True
    r_t3a.font.size = Pt(9.5)
    
    t_d1 = doc.add_table(rows=15, cols=3)
    t_d1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_d1, color="CBD5E1", sz="4")
    
    headers_g = ["Código", "Título & Parâmetro", "Resumo Normativo e Função Metodológica no SAREL"]
    widths_g = [Inches(0.8), Inches(1.8), Inches(4.09)]
    
    for j, h in enumerate(headers_g):
        cell = t_d1.cell(0, j)
        cell.width = widths_g[j]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    decisoes_d01_d14 = [
        ("D01", "Fator C Tropical", "C = (1 - NDVI) / 2 (Durigon et al., 2014) mapeado dinamicamente a partir do NDVI da série Sentinel-2 L2A."),
        ("D02", "Triagem de Candidatos", "Critérios observacionais de presente/ausente e negativo explícito para triagem visual; não constitui rótulo de treino."),
        ("D03", "Escala do Rótulo de Campo", "Coleta ordinal com binarização declarada para compatibilidade de anotação presencial."),
        ("D04", "Modelos D e P", "Distinção formal entre Modelo D (detecção pós-evento) e Modelo P (predição prospectiva de suscetibilidade)."),
        ("D05", "Série Sentinel-2", "Treino exclusivo em Sentinel-2 (2016-2026); Landsat reservado exclusivamente a contexto histórico de longo prazo."),
        ("D06", "Suporte Espacial Nativo", "Unidade de análise fixada na célula de 10 m do Sentinel-2; proibição de reamostragem espúria de insumos mais grossos."),
        ("D07", "Domínio de Validade Físico", "Declividade estritamente entre 3,0% e 20,0% (SiBCS); WorldCover classes 30 e 40 com concordância entre v100 e v200."),
        ("D08", "Associações de Solo", "Ambiguidade de K em unidades de associação resolvida na fonte oficial (Embrapa Solos 2024); heurística taxonômica aposentada."),
        ("D09", "Corte Ordinal de K̂", "Partição em 2 níveis de K̂: Nível 1 (K <= 0,0285) e Nível 2 (K >= 0,0300 Mg h MJ^-1 mm^-1)."),
        ("D10", "Limiar de Solo Exposto", "NDVI <= 0,25 para classificação de solo nu em solos agrícolas tropicais (calibração GEOS3/ESALQ-USP)."),
        ("D11", "Cobertura Temporal Mínima", "Número mínimo de observações orbitais válidas para validação de métricas de série temporal decenal."),
        ("D12", "Estratificação Multivariada", "18 estratos canônicos pelo produto fatorial Ŝ (3 tercis) x Ê (3 tercis) x K̂ (2 níveis), com Spatial Thinning r >= 1,0 km."),
        ("D13", "Fator R Regionalizado", "Equação regional do Paraná por Rufino et al. (1993) e Waltrick et al. (2010) sobre totais mensais CHIRPS v2.0."),
        ("D14", "Fator K Numérico", "Extraído diretamente do campo numérico k_solos da carta oficial da Embrapa Solos (Doc. 246/2024; proveniência tabelado).")
    ]
    
    for i, (cod, tit, desc) in enumerate(decisoes_d01_d14, 1):
        bg = "FFFFFF" if i % 2 == 1 else "F8FAFC"
        for j, val in enumerate([cod, tit, desc]):
            cell = t_d1.cell(i, j)
            cell.width = widths_g[j]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=90, right=90)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.0)
            if j == 0:
                r.bold = True
                r.font.color.rgb = COLOR_EMERALD
            elif j == 1:
                r.bold = True
                r.font.color.rgb = COLOR_NAVY
            else:
                r.font.color.rgb = COLOR_SLATE

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # TABELA 3B: D15 A D26
    p_t3b = doc.add_paragraph()
    r_t3b = p_t3b.add_run("Tabela 3B. Glossário das Decisões Metodológicas e Arquiteturais (D15 a D26 — Modelagem e Validação)")
    r_t3b.bold = True
    r_t3b.font.size = Pt(9.5)
    
    t_d2 = doc.add_table(rows=13, cols=3)
    t_d2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_d2, color="CBD5E1", sz="4")
    
    for j, h in enumerate(headers_g):
        cell = t_d2.cell(0, j)
        cell.width = widths_g[j]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    decisoes_d15_d26 = [
        ("D15", "Fator LS Bidimensional", "Algoritmo de fluxo acumulado de Desmet & Govers (1996) sobre Copernicus DEM 30 m em SIRGAS 2000 UTM 22S."),
        ("D16", "Desenho Amostral VANT", "72 polígonos de 5,02 ha (4 por estrato: 2 treino + 2 held-out lacrado de teste independente; total 361 ha; 36 mantidos em teste)."),
        ("D17", "Alocação Cota PlanetScope", "Gestão racional de quotas PlanetScope entre download de mosaicos de evento e visualização de tiles."),
        ("D18", "Buffer PlanetScope", "Área de amortecimento padronizada ao redor dos sítios amostrais para contextualização de vizinhança."),
        ("D19", "Pares de Evento de Chuva", "Reescrita do evento de chuva extrema em escala de polígono para análise secundária de gatilhos hidrológicos."),
        ("D20", "Fator C Híbrido SPD", "Equação de Durigon et al. (2014) modulada pelo BSI sob Sistema Plantio Direto: C = ((1 - NDVI)/2) * (1 + BSI)."),
        ("D21", "Modelo Digital Elevação", "Copernicus DEM GLO-30 (ESA) na resolução nativa de 30 m em projeção métrica conforme SIRGAS 2000 UTM 22S."),
        ("D22", "Fator P Estratificado", "Fator P fixado em 1,0 na escala de bacia; refinado por observação de práticas conservacionistas estratificadas por declividade em campo."),
        ("D23", "Regime Amostral com π_i", "Estratificação desproporcional com probabilidade de inclusão π_i registrada para viabilizar inferência de Olofsson et al. (2014)."),
        ("D24", "Teto de Preditores Bloco", "Teto máximo de 14 preditores na matriz: Espectro <= 8, Terreno <= 4, Solo = 1, Chuva = 1; restrições de monotonicidade física."),
        ("D25", "Critério de Refutação", "Avaliação exclusiva nos 36 polígonos held-out lacrados; Spearman rho >= 0,40, Delta rho >= 0,10 (p < 0,05); 3 desfechos formais."),
        ("D26", "Alvo Contínuo Tweedie", "Alvo primário y_i in [0, 1] (fração de célula erodida) ajustada por reg:tweedie; alvo secundário binário derivado a 25%.")
    ]
    
    for i, (cod, tit, desc) in enumerate(decisoes_d15_d26, 1):
        bg = "FFFFFF" if i % 2 == 1 else "F8FAFC"
        for j, val in enumerate([cod, tit, desc]):
            cell = t_d2.cell(i, j)
            cell.width = widths_g[j]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=90, right=90)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.0)
            if j == 0:
                r.bold = True
                r.font.color.rgb = COLOR_EMERALD
            elif j == 1:
                r.bold = True
                r.font.color.rgb = COLOR_NAVY
            else:
                r.font.color.rgb = COLOR_SLATE

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # TABELA 4: PARÂMETROS E REGRAS
    p_t4 = doc.add_paragraph()
    r_t4 = p_t4.add_run("Tabela 4. Parâmetros Operacionais (P01 a P05), Invariantes e Regras da Lei Fundamental do SAREL")
    r_t4.bold = True
    r_t4.font.size = Pt(9.5)
    
    t_reg = doc.add_table(rows=16, cols=3)
    t_reg.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_reg, color="CBD5E1", sz="4")
    
    headers_reg = ["Código", "Nome do Mecanismo", "Definição Técnica e Salvaguarda Metodológica no Sistema"]
    widths_reg = [Inches(0.9), Inches(1.8), Inches(3.99)]
    
    for j, h in enumerate(headers_reg):
        cell = t_reg.cell(0, j)
        cell.width = widths_reg[j]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    regras_dados = [
        ("P01", "Bloco de CV Espacial", "Aresta da dobra espacial derivada do alcance prático do variograma (a ≈ 50 m; Roberts et al., 2017) ou 20 km regional."),
        ("P02", "Raio de Spatial Thinning", "Distância euclidiana geodésica mínima de 1.000 m (1,0 km) entre candidatos do mesmo estrato para neutralizar clustering."),
        ("P03", "Casamento Geodésico", "Teto de erro grosseiro de 30 m entre coordenada visitada e ponto planejado; raio de tolerância do GNSS."),
        ("P04", "Buffers de Exclusão", "Buffer hídrico de 30 m (JRC Water), buffer urbano de 150 m e exclusão de corpos com ocorrência hídrica > 10%."),
        ("P05", "Classes WorldCover", "Classes elegíveis restritas a [30, 40] (pastagem cultivada e lavoura); classe 60 excluída por D07."),
        ("Regra 1", "Sem Valores Fabricados", "Variáveis sem resposta da fonte oficial recebem estritamente `indisponivel` com causa; proibição de números mágicos."),
        ("Regra 2", "Sem Cortes Silenciosos", "Proibição de pisos ou limites artificiais (`Math.max`/`min`) que mascarem valores fora do domínio físico ou biofísico."),
        ("Regra 3", "Rastreabilidade", "Toda grandeza científica é encapsulada em tipo discriminado `Proveniencia<T>` (`medido`, `modelado`, `tabelado`, `indisponivel`)."),
        ("Regra 4", "Nada Calculado Vira Rótulo", "Modelos matemáticos jamais viram gabarito de treino; o rótulo de erosão provém unicamente da observação pericial primária."),
        ("Regra 5", "Guarda Antissintético", "Validação contínua e recursiva de que nenhum ponto amostral possua a flag `origemSintetica: true`."),
        ("Regra 6", "Segregação Cega", "Coordenadas geográficas não entram na matriz de treino tabular, impedindo o modelo de memorizar localização geográfica."),
        ("Regra 7", "Preservação de Máscaras", "Nuvens, sombras e dados inválidos de satélite são preservados como máscaras reais e descontinuidades temporais."),
        ("Invariante 1", "Coerência RUSLE", "perdaSolo <=> 5 fatores presentes (R, K, LS, C, P) <=> memória de cálculo completa e auditável."),
        ("Invariante 2", "Lista de Permissão Cega", "Bloqueia vazamento de variáveis internas de amostragem (como Phi_diag ou semente) para a matriz de predição."),
        ("Invariante Suporte", "Suporte Nativo Declarado", "Cada dado opera em sua resolução nativa declarada, proibindo reamostragem espúria (D06, D21, D24).")
    ]
    
    for i, (cod, tit, desc) in enumerate(regras_dados, 1):
        bg = "FFFFFF" if i % 2 == 1 else "F8FAFC"
        for j, val in enumerate([cod, tit, desc]):
            cell = t_reg.cell(i, j)
            cell.width = widths_reg[j]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=90, right=90)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.0)
            if j == 0:
                r.bold = True
                r.font.color.rgb = COLOR_EMERALD
            elif j == 1:
                r.bold = True
                r.font.color.rgb = COLOR_NAVY
            else:
                r.font.color.rgb = COLOR_SLATE

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # =========================================================================
    # SEÇÃO 6: REFERÊNCIAS BIBLIOGRÁFICAS
    # =========================================================================
    add_h1("6. Referências Bibliográficas (Norma ABNT NBR 6023)")
    add_body(
        "Todas as obras fundamentais abaixo estão arquivadas fisicamente na base bibliográfica local do repositório "
        "(diretórios docs/Selecao Bibliografica/Pesquisas Machine Learning/, docs/Selecao Bibliografica/Para Revisar/ e docs/verificacoes/fontes/).",
        bold_prefix="Nota sobre Proveniência Bibliográfica: "
    )
    
    refs = [
        "ALTMAN, D. G.; ROYSTON, P. The cost of dichotomising continuous variables. BMJ, London, v. 332, n. 7549, p. 1080, 2006. DOI: 10.1136/bmj.332.7549.1080. [Arquivo local: `1080.1.full.pdf`]",
        "ALVAREZ-VANHARD, E. et al. UAV & satellite synergies for optical remote sensing applications: a literature review. Science of Remote Sensing, Amsterdam, v. 3, 100019, 2021. DOI: 10.1016/j.srs.2021.100019. [Arquivo local: `UAV--amp--satellite-synergies...pdf`]",
        "BAZZI, C. L. et al. Spatial variability of soil loss factors in western Paraná: precision conservation agriculture perspectives. Engenharia Agrícola, Jaboticabal, v. 42, n. spe, e20210189, 2022. DOI: 10.1590/1809-4430-Eng.Agric.v42nepe20210189/2022.",
        "CAMERON, A. C.; GELBACH, J. B.; MILLER, D. L. Bootstrap-based improvements for inference with clustered errors. The Review of Economics and Statistics, Cambridge, v. 90, n. 3, p. 414-427, 2008. DOI: 10.1162/rest.90.3.414.",
        "CHEN, T.; GUESTRIN, C. XGBoost: A scalable tree boosting system. In: ACM SIGKDD INTERNATIONAL CONFERENCE ON KNOWLEDGE DISCOVERY AND DATA MINING, 22., 2016, San Francisco. Proceedings... New York: ACM, 2016. p. 785-794. DOI: 10.1145/2939672.2939785. [Arquivo local: `1603.02754v3.pdf`]",
        "DESMET, P. J. J.; GOVERS, G. A GIS procedure for automatically calculating the USLE LS factor on topographically complex landscape units. Journal of Soil and Water Conservation, Ankeny, v. 51, n. 5, p. 427-433, 1996. [Arquivo local: `desmet_govers_1996_jswc.pdf`]",
        "DURIGON, C. A.; CARVALHO JÚNIOR, O. A. de; ANTUNES, M. A. H.; OLIVEIRA, S. N. de; MARTINS, E. S. Índices de vegetação derivados do sensor MODIS para o cálculo do fator C da Equação Universal de Perdas de Solo em biomas brasileiros. Revista Brasileira de Ciência do Solo, Viçosa, v. 38, n. 6, p. 1814-1824, 2014. DOI: 10.1590/S0100-06832014000600016.",
        "EMBRAPA SOLOS. Sistema brasileiro de classificação de solos. 5. ed. Brasília, DF: Embrapa, 2018. 356 p. [SiBCS Oficial: Classes de Relevo Suave-Ondulado e Ondulado].",
        "EMBRAPA SOLOS. Fatores de erodibilidade (Fator K) para solos brasileiros segundo o Sistema Brasileiro de Classificação de Solos (SiBCS). Rio de Janeiro: Embrapa Solos, 2024. 42 p. (Documentos / Embrapa Solos, 246). [Arquivo local: `CNPS-DOC-246-2024.pdf`]",
        "KAPOOR, S.; NARAYANAN, A. Leakage and the reproducibility crisis in machine-learning-based science. Patterns (Cell Press), Cambridge, v. 4, n. 9, 100804, 2023. DOI: 10.1016/j.patter.2023.100804. [Arquivo local: `mmc2.pdf`]",
        "KRUG, E. T. S. Estimativa de perda de solo por erosão laminar em função de suas características e diferentes níveis de precipitação. 2024. 88 f. Dissertação (Mestrado em Tecnologias Computacionais para o Agronegócio) — Universidade Tecnológica Federal do Paraná, Câmpus Medianeira, 2024. (Orientador: Prof. Dr. Claudio Leones Bazzi). [Arquivo local: `estimativaerosaolaminar.pdf`]",
        "LUCAS, T. D. M. Estimativa da perda de solo na Bacia Hidrográfica do Paraná III: influência de diferentes cenários de conservação do solo. 2024. 94 f. Dissertação (Mestrado em Tecnologias Computacionais para o Agronegócio) — Universidade Tecnológica Federal do Paraná, Câmpus Medianeira, 2024. (Orientadora: Profa. Dra. Giovana Clarice Poggere). [Arquivo local: `perdasolobaciahidrografica.pdf`]",
        "NOSEK, B. A.; EBERSOLE, C. R.; DEHAVEN, A. C.; MELLOR, D. T. The preregistration revolution. Proceedings of the National Academy of Sciences (PNAS), Washington, v. 115, n. 11, p. 2600-2606, 2018. DOI: 10.1073/pnas.1708274114. [Arquivo local: `nosek-et-al-2018...pdf`]",
        "PINEAU, J. et al. Improving reproducibility in machine learning research (A report from the NeurIPS 2019 reproducibility program). Journal of Machine Learning Research (JMLR), Cambridge, v. 22, n. 164, p. 1-20, 2021. [Arquivo local: `20-303.pdf`]",
        "PLOTON, P. et al. Spatial validation reveals poor predictive performance of large-scale ecological mapping models. Nature Communications, London, v. 11, n. 1, 4540, 2020. DOI: 10.1038/s41467-020-18321-y. [Arquivo local: `s41467-020-18321-y.pdf`]",
        "RENARD, K. G.; FOSTER, G. R.; WEESIES, G. A.; MCCOOL, D. K.; YODER, D. C. Predicting soil erosion by water: a guide to conservation planning with the Revised Universal Soil Loss Equation (RUSLE). Washington: USDA, 1997. 384 p. (Agriculture Handbook, 703). [Arquivo local: `ah_703.pdf`]",
        "ROBERTS, D. R. et al. Cross-validation strategies for data with temporal, spatial or phylogenetic structure. Ecography, Copenhagen, v. 40, n. 8, p. 913-929, 2017. DOI: 10.1111/ecog.02881. [Arquivo local: `Ecography - 2016 - Roberts...pdf`]",
        "RUFINO, R. L.; BISCAIA, R. C. M.; MERTEN, G. H. Determinação do potencial erosivo da chuva para o estado do Paraná, através de pluviometria: terceira aproximação. Revista Brasileira de Ciência do Solo, Campinas, v. 17, n. 3, p. 439-444, 1993. [Arquivo local: `rufino_biscaia_merten_1993...pdf`]",
        "WALTRICK, P. C.; ROCHA, M. C.; MERTEN, G. H.; CUNHA, C. A. da. Estimativa da erosividade das chuvas no Estado do Paraná a partir de séries sintéticas e dados de satélite. Revista Brasileira de Recursos Hídricos, Porto Alegre, v. 15, n. 3, p. 115-125, 2010. [Arquivo local: `2010_04_20_waltrick.pdf`]",
        "WISCHMEIER, W. H.; SMITH, D. D. Predicting rainfall erosion losses: a guide to conservation planning. Washington: USDA, 1978. 58 p. (Agriculture Handbook, 537).",
        "WOODCOCK, C. E.; STRAHLER, A. H. The factor of scale in remote sensing. Remote Sensing of Environment, New York, v. 21, n. 3, p. 311-332, 1987. DOI: 10.1016/0034-4257(87)90015-0. [Arquivo local: `The_factor_of_scale_in_remote_sensing.pdf`]",
        "ZHU, Z.; WOODCOCK, C. E. Continuous change detection and classification of land cover using all available Landsat data. Remote Sensing of Environment, New York, v. 144, p. 152-171, 2014. DOI: 10.1016/j.rse.2014.01.011."
    ]
    
    for r in refs:
        p_ref = doc.add_paragraph()
        p_ref.paragraph_format.space_before = Pt(0)
        p_ref.paragraph_format.space_after = Pt(4)
        p_ref.paragraph_format.line_spacing = 1.15
        p_ref.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r_rf = p_ref.add_run(r)
        r_rf.font.size = Pt(8.5)
        r_rf.font.color.rgb = COLOR_SLATE
        
    doc.save(docx_path)
    print(f"Documento Microsoft Word (.docx) gerado com sucesso: {docx_path} ({os.path.getsize(docx_path)} bytes)")

if __name__ == "__main__":
    build_docx()
