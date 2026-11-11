#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Geração do Documento em Microsoft Word (.docx):
Metodologia Geral, Fundamentação Epistemológica de Replicabilidade, Prevenção de Viés Espectral,
Especificação Experimental, Fundamentação sob a Norma de Lastro e Glossário Normativo para a Dissertação de Mestrado (Sistema SAREL v2.0).

Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA)
Universidade Tecnológica Federal do Paraná (UTFPR) - Câmpus Medianeira
Mestrando: Luis Alfredo Ferreira da Silva
Orientador: Prof. Dr. Claudio Leones Bazzi
"""

import os
import sys
import docx
import json

def carregar_parametros_deflacao():
    caminho = os.path.join(os.path.dirname(__file__), "..", "data", "PARAMETROS_DEFLACAO.json")
    if not os.path.exists(caminho):
        caminho = "data/PARAMETROS_DEFLACAO.json"
    with open(caminho, "r", encoding="utf-8") as f:
        return json.load(f)

PARAM_DEFLACAO = carregar_parametros_deflacao()

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
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.7)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)

    tblPr = tbl._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        f'<w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>'
        f'<w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        f'<w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        f'<w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

    p0 = cell.paragraphs[0]
    p0.paragraph_format.space_before = Pt(0)
    p0.paragraph_format.space_after = Pt(2)
    r0 = p0.add_run(title.upper())
    r0.bold = True
    r0.font.size = Pt(8.5)
    r0.font.color.rgb = RGBColor(5, 150, 105)

    p1 = cell.add_paragraph()
    p1.paragraph_format.space_before = Pt(2)
    p1.paragraph_format.space_after = Pt(2)
    r1 = p1.add_run(formula)
    r1.bold = True
    r1.font.size = Pt(10.5)
    r1.font.color.rgb = RGBColor(15, 23, 42)

    if note:
        p2 = cell.add_paragraph()
        p2.paragraph_format.space_before = Pt(2)
        p2.paragraph_format.space_after = Pt(0)
        r2 = p2.add_run(note)
        r2.font.size = Pt(8.0)
        r2.italic = True
        r2.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def build_docx(caminho_saida="docs/dissertacao/Metodologia_Integrada_Dissertacao_SAREL.docx"):
    os.makedirs(os.path.dirname(caminho_saida), exist_ok=True)
    doc = docx.Document()

    # Configuração de Margens Estritas ABNT (3 cm superior/esquerda, 2 cm inferior/direita)
    for section in doc.sections:
        section.top_margin = Inches(1.18)      # 3.0 cm
        section.left_margin = Inches(1.18)     # 3.0 cm
        section.bottom_margin = Inches(0.79)   # 2.0 cm
        section.right_margin = Inches(0.79)    # 2.0 cm
        section.header_distance = Inches(0.5)
        section.footer_distance = Inches(0.5)

    # Estilos de Cor Institucionais
    COLOR_NAVY = RGBColor(15, 23, 42)       # Slate 900
    COLOR_EMERALD = RGBColor(5, 150, 105)   # Emerald 600
    COLOR_SLATE = RGBColor(71, 85, 105)     # Slate 600
    COLOR_ROSE = RGBColor(190, 18, 60)      # Rose 700

    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = COLOR_NAVY
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.bold = True
        r.font.size = Pt(13)
        r.font.color.rgb = COLOR_NAVY
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.bold = True
        r.font.size = Pt(11.5)
        r.font.color.rgb = COLOR_EMERALD
        return p

    def add_body(text, bold_prefix=None):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.color.rgb = COLOR_NAVY
        r = p.add_run(text)
        r.font.color.rgb = COLOR_NAVY
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.color.rgb = COLOR_NAVY
        r = p.add_run(text)
        r.font.color.rgb = COLOR_NAVY
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
    r_t = p_title.add_run("DETECÇÃO CONTEMPORÂNEA DE EROSÃO LAMINAR NA BACIA HIDROGRÁFICA DO PARANÁ III POR SENSORIAMENTO REMOTO MULTIFONTE E APRENDIZADO DE MÁQUINA SUPERVISIONADO POR VANT")
    r_t.bold = True
    r_t.font.size = Pt(13.5)
    r_t.font.color.rgb = COLOR_NAVY

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(8)
    r_s = p_sub.add_run("Metodologia Integrada, Fundamentação Epistemológica de Reprodutibilidade, Prevenção de Viés Espectral, Especificação Experimental, Fundamentação sob a Norma de Lastro e Glossário Normativo para a Dissertação de Mestrado")
    r_s.italic = True
    r_s.font.size = Pt(9.5)
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
        "Pilares Epistemológicos: Reprodutibilidade de IA, Norma de Lastro e Ausência de Vazamento (D16, D24, D25)"
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
        "Por não formar ravinamentos imediatos nem cicatrizes topográficas profundas, sua ocorrência mascara a severa e progressiva degradação "
        "dos horizontes superficiais agricultáveis, que concentram a maior fração de matéria orgânica, fósforo e nutrientes essenciais."
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
        "apresentam capacidade de detecção contemporânea e discriminação de feições de erosão laminar significativamente superior à linha de base da RUSLE regional na BP3 "
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
    # SEÇÃO 2: FUNDAMENTAÇÃO EPISTEMOLÓGICA E AUSÊNCIA DE VIÉS
    # =========================================================================
    add_h1("2. Introdução Metodológica: Fundamentação Epistemológica de Replicabilidade e Prevenção de Viés Espectral")
    add_body(
        "A aplicação de inteligência artificial em geociências e ciências agrárias enfrenta com frequência dois questionamentos metodológicos centrais: "
        "(1) Como garantir a replicabilidade científica de um modelo se os algoritmos de aprendizado de máquina operam sob rotinas probabilísticas?; e "
        "(2) Não existe o risco de o treinamento ficar 'viciado' nos dados de altíssima precisão obtidos pelo sensor multiespectral do drone (VANT)? "
        "Esta seção estabelece as bases epistemológicas e matemáticas adotadas no SAREL para neutralizar ambos os riscos antes de detalhar o protocolo experimental."
    )
    
    add_h2("2.1 Eixo I: A Replicabilidade Científica em Modelos Probabilísticos de Aprendizado de Máquina")
    add_body(
        "Na ciência da computação e na inferência estatística moderna, algoritmos de aprendizado de máquina baseados em árvores (como o XGBoost; CHEN; GUESTRIN, 2016) "
        "são funções matemáticas determinísticas alimentadas por Geradores de Números Pseudoaleatórios (PRNG). O SAREL ancora sua replicabilidade em três pilares epistemológicos "
        "estabelecidos pela literatura de ponta (PINEAU et al., 2021; NOSEK et al., 2018):"
    )
    add_bullet(
        "Todo componente estocástico do sistema — desde a inicialização dos nós das árvores, a subamostragem de linhas e colunas (subsample e colsample_bytree) "
        "até a partição de dobras de validação cruzada e o sorteio amostral D16 — opera sob sementes criptograficamente registradas e imutáveis (seed registry; Decisão P01). "
        "O repositório encapsula o ambiente computacional exato via arquivos de bloqueio de dependências determinísticos (package-lock.json / pyproject), "
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
        "o tamanho amostral realizado de 67 polígonos de 5,02 ha (D16 com semente pré-registrada 20261110), os tetos de preditores por bloco físico (máx. 14; D24), a métrica primária contínua (Spearman; D26) "
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
        "As imagens de 2 cm capturadas pelo VANT são utilizadas EXCLUSIVAMENTE pelo fotointérprete humano pericial para inspecionar e delimitar vetorialmente as feições "
        "de erosão laminar no terreno. Essas feições são então rasterizadas para calcular a fração contínua erodida (y_i in [0, 1]) de cada célula Sentinel-2 de 10 m. "
        "Portanto, os dados brutos do VANT NUNCA entram como variáveis de entrada (X) do modelo preditivo. O modelo recebe apenas preditores orbitais e de terreno públicos e gratuitos (Sentinel-2, Copernicus DEM, Embrapa Solos e CHIRPS).",
        bold_prefix="Desacoplamento Arquitetural Rígido: O VANT é Rótulo Pericial (Y), Jamais Variável Preditora (X) (D06, D16 e D26): "
    )
    add_bullet(
        "O modelo XGBoost treinado pelo SAREL aprenderá a reconhecer as assinaturas espectro-temporais e geomorfológicas associadas à erosão laminar diretamente "
        "nos dados do satélite Sentinel-2 (10 m). Uma vez concluído e validado, o modelo poderá ser aplicado a qualquer fazenda ou microbacia da BP3 "
        "apenas baixando as imagens gratuitas de satélite, sem necessidade de sobrevoar a área com drone.",
        bold_prefix="Independência Operacional Pós-Treinamento (Generalização Orbital Autônoma): "
    )
    add_bullet(
        "Para eliminar qualquer risco de sobreajuste local, o SAREL adota duas barreiras de contenção: (a) a validação cruzada espacial em blocos (Spatial Block Cross-Validation; Roberts et al., 2017), "
        "que agrupa pixels do mesmo polígono de VANT na mesma dobra para impedir que pixels vizinhos dividam treino e teste; "
        "e (b) a reserva estrita de 33 polígonos amostrais inteiros de 5,02 ha mantidos em held-out lacrado sob cegamento duplo (D16). "
        "Esses 33 polígonos de teste nunca são apresentados ao modelo durante o ajuste de hiperparâmetros, servindo exclusivamente para a avaliação final cega e honesta contra a RUSLE.",
        bold_prefix="Prevenção de Vazamento Espacial de Dados (Data Leakage) e Isolamento de 33 Polígonos de Teste (D16 e D25): "
    )

    # =========================================================================
    # SEÇÃO 3: ESPECIFICAÇÃO METODOLÓGICA DETALHADA E MODELAGEM
    # =========================================================================
    add_h1("3. Especificação Metodológica Detalhada e Modelagem Matemática (SAREL v2.0)")
    
    add_h2("3.1 Recorte Espacial e Máscara Territorial de Elegibilidade (Decisão D07)")
    add_body(
        "A área de estudo compreende a Bacia Hidrográfica do Rio Paraná III (BP3), localizada no oeste do Estado do Paraná. Para assegurar que o modelo "
        "incida estritamente sobre as áreas agrícolas onde a erosão laminar é o processo atuante, aplica-se a Máscara Territorial de Elegibilidade (Decisão D07), "
        "gerada pelo cruzamento espacial de três camadas cartográficas estritas:"
    )
    add_bullet(
        "Polígono hidrológico oficial disponibilizado pelo Instituto Água e Terra do Paraná (IAT/SEMA), definindo a área de contribuição direta do reservatório de Itaipu.",
        bold_prefix="Delimitação Hidrográfica Canônica da BP3: "
    )
    add_bullet(
        "Extração das classes 30 (Lavouras / Herbaceous wetland / Cropland) e 40 (Culturas Anuais / Moss and lichen / Shrubland) do produto ESA WorldCover 10 m, "
        "exigindo concordância temporal entre as versões v100 (2020) e v200 (2021) para garantir estabilidade do uso agrícola e excluir conversões florestais ou urbanas recentes.",
        bold_prefix="Máscara de Uso Agrícola Consolidado (ESA WorldCover): "
    )
    add_bullet(
        "Filtragem estrita pelo Modelo Digital de Elevação Copernicus DEM 30 m (Decisão D21). Áreas com declividade inferior a 3,0% são excluídas por "
        "dominância de processos de deposição e sedimentação em várzeas planas; áreas com declividade superior a 20,0% são excluídas por incompatibilidade com a agricultura mecanizada "
        "consolidada e prevalência de processos gravitacionais de encosta e ravinamentos profundos (SiBCS; SANTOS et al., 2018).",
        bold_prefix="Janela Física de Declividade (Decisão D07): "
    )

    add_h2("3.2 Desenho Amostral e Estratificação Multivariada em 18 Estratos Canônicos (Decisões D12 e D16)")
    add_body(
        "Amostragens aleatórias simples ou dirigidas por conveniência logística enviesam o aprendizado de máquina em sensoriamento remoto, pois sub-representam "
        "combinações biofísicas raras na paisagem. O SAREL implementa uma partição multivariada determinística em 18 estratos biofísicos canônicos, "
        "estruturados pela matriz fatorial Ŝ × Ê × K̂ dentro do domínio de elegibilidade de 3,0% a 20,0%:"
    )
    add_bullet(
        "3 tercis empíricos de declividade derivados do Copernicus DEM 30 m (D21) dentro da faixa válida de 3,0% a 20,0%: "
        "Tercil 1 (Ŝ1: 3,00% a 5,12%; relevo suave), Tercil 2 (Ŝ2: 5,12% a 8,46%; relevo moderado) e Tercil 3 (Ŝ3: 8,46% a 20,00%; relevo ondulado forte).",
        bold_prefix="Declividade do Terreno (Ŝ; Decisão D07): "
    )
    add_bullet(
        "3 tercis empíricos da frequência decenal de exposição do solo no intervalo [0, 1], calculada via série Sentinel-2 L2A (2016–2026) sob a máscara estrita "
        "de 5 testes biofísicos de Demattê et al. (2018): Tercil 1 (Ê1 ≤ 0,0116; 1,16% das datas com solo exposto), Tercil 2 (Ê2: 0,0116 a 0,0490; 4,90% das datas) "
        "e Tercil 3 (Ê3 > 0,0490; alta exposição crônica).",
        bold_prefix="Frequência Histórica de Solo Nu (Ê; Decisão D10): "
    )
    add_bullet(
        "2 níveis numéricos derivados da carta oficial de erodibilidade da Embrapa Solos (Doc. 246/2024; D14): "
        "Nível 1 = Baixa/Média erodibilidade (K̂1 ≤ 0,0285 Mg h MJ⁻¹ mm⁻¹; compreendendo Latossolos e Nitossolos Vermelhos, que representam 82,4% da bacia e 76,3% dos candidatos) "
        "e Nível 2 = Alta/Muito Alta erodibilidade (K̂2 ≥ 0,0300 Mg h MJ⁻¹ mm⁻¹; compreendendo Neossolos Regolíticos RLm e Argissolos Vermelho-Amarelos PVAe/PVe, que representam 17,6% da bacia e 23,7% dos candidatos elegíveis).",
        bold_prefix="Erodibilidade Pedológica do Solo (K̂; Decisão D09): "
    )
    add_body(
        "Totalizam-se exatamente 3 × 3 × 2 = 18 estratos canônicos. No universo investigado de 677 candidatos espectrais válidos da BP3, "
        "o sorteio pré-registrado sob semente pública 20261110 (Decisão D16) resultou na alocação de 67 polígonos sorteados (336,34 ha no total), "
        "distribuídos em 34 polígonos para treino e 33 polígonos para held-out de validação cega. "
        "Quatro estratos com solo frágil (K̂2) foram alocados em regime de censo exaustivo por escassez física de área no terreno: "
        "E_1_2_2 (Nh = 3, nh = 3), E_2_2_2 (Nh = 4, nh = 4), E_2_3_2 (Nh = 4, nh = 4) e E_3_2_2 (Nh = 4, nh = 4). "
        "O estrato E_1_3_2 (Ŝ1 × Ê3 × K̂2) foi formalmente diagnosticado como VAZIO (Nh = 0, nh = 0): em toda a bacia existem apenas 9 candidatos na combinação de relevo plano com solo frágil, "
        "e a frequência máxima medida entre eles foi de apenas Ê = 0,0331 < 0,0490. Trata-se de um achado biofísico autêntico da BP3, decorrente do manejo conservacionista exemplar "
        "sob Sistema Plantio Direto contínuo, e não de uma deficiência metodológica."
    )

    add_h2("3.3 Unidade de Análise e Invariante de Suporte Espacial Nativo Declarado (Decisão D06)")
    add_body(
        "A unidade básica de predição e inferência do sistema é a célula de 10 x 10 m do sensor Sentinel-2 MSI Nível-2A em sua grade orbital nativa. "
        "Em estrito cumprimento ao Invariante de Suporte Espacial (D06 e D24), nenhum preditor de resolução mais grossa é artificialmente reamostrado para fingir "
        "suporte centimétrico. O relevo opera no suporte nativo de 30 m do Copernicus DEM (D21), a erodibilidade K opera no suporte do polígono cartográfico oficial da Embrapa Solos (D14), "
        "e a chuva opera na grade regional de 5 km do CHIRPS (D13), eliminando a pseudorreplicação estatística."
    )

    add_h2("3.4 A Máscara de Solo Exposto e o Papel Físico do NBR2 no SWIR (Decisão D10)")
    add_body(
        "A identificação de solo exposto no SAREL não adota limiares univariados arbitrários de NDVI (como o obsoleto NDVI ≤ 0,25 isolado). "
        "Em estrita consonância com a arquitetura GEOS3 (Demattê et al., 2018), adota-se a CONJUNÇÃO DE CINCO TESTES biofísicos simultâneos transpostos para o sensor Sentinel-2 MSI L2A:"
    )
    add_bullet("0,00 ≤ NDVI ≤ 0,25: exclui vegetação fotossinteticamente ativa e corpos hídricos / sombras profundas;", bold_prefix="1. Faixa de NDVI: ")
    add_bullet("0,00 ≤ NBR2 ≤ 0,075: filtro espectral indispensável no infravermelho de ondas curtas (SWIR) para exclusão de palhada seca em Sistema Plantio Direto;", bold_prefix="2. Faixa de NBR2: ")
    add_bullet("B4 - B3 ≥ 0 (Vermelho - Verde ≥ 0): confirma inclinação espectral positiva contínua típica de solos minerais tropicais;", bold_prefix="3. Inclinação no Visível 1: ")
    add_bullet("B3 - B2 ≥ 0 (Verde - Azul ≥ 0): confirma gradiente positivo ascendente no visível;", bold_prefix="4. Inclinação no Visível 2: ")
    add_bullet("SCL ∈ {4, 5, 7}: máscara de classificação da cena do produto L2A, eliminando nuvens, cirrus e sombras.", bold_prefix="5. Qualidade Atmosférica: ")
    add_body(
        "Por que o NBR2 importa: O NDVI quantifica a absorção de clorofila ativa no visível e espalhamento foliar no NIR. A palhada seca de resíduos culturais (milho, trigo, aveia) "
        "não possui clorofila viva, fazendo com que seu NDVI caia frequentemente para valores inferiores a 0,25. Um classificador ingênuo baseado somente em NDVI classificaria lavouras "
        "cobertas e protegidas por palhada densa como 'solo exposto'. A diferenciação física reside no SWIR: celulose e lignina exibem bandas diagnósticas de absorção em torno de 2.100 a 2.300 nm "
        "(Banda B12 do Sentinel-2), elevando o índice NBR2 = (B11 - B12) / (B11 + B12) acima de 0,075 (DAUGHTRY et al., 2001, 2004; HIVELY et al., 2021). "
        "O solo mineral desnudo apresenta reflectância equilibrada no SWIR, situando-se estritamente na faixa de 0,00 a 0,075. O NBR2 é, portanto, o componente biofísico que blinda o SAREL contra falsos positivos sob Plantio Direto."
    )

    add_h2("3.5 Sensoriamento Aerotransportado (VANT) e Definição do Alvo Contínuo (Decisões D16 e D26)")
    add_body(
        "Conforme a Decisão D16, a campanha de campo contemplará o sobrevoo aerofotogramétrico com VANT sobre os 67 polígonos amostrais sorteados (raio de 126,4 m; 5,02 ha cada). "
        "A resolução espacial centimétrica (GSD ≤ 2 cm) viabiliza a identificação pericial direta de feições de desagregação laminar, microrravinamentos e acúmulo de sedimentos. "
        "Múltiplos fotointérpretes independentes realizarão a anotação vetorial dessas feições com auditoria formal de concordância via Kappa de Cohen (Decisão D02). "
        "A camada vetorial é rasterizada sobre a grade Sentinel-2 de 10 m, definindo o alvo primário contínuo da modelagem (Decisão D26):"
    )
    make_callout_box(
        doc,
        title="Equação 1. Alvo Primário Contínuo — Fração de Célula Erodida (Decisão D26)",
        formula="y_i = Área da Feição Erodida no Interior da Célula / Área Total da Célula de 10 m     (y_i ∈ [0, 1])",
        note="onde y_i representa a fração contínua de degradação da célula i, preservando informação quantitativa sem dicotomização artificial."
    )

    add_h2("3.6 A Linha de Base Analítica RUSLE Parametrizada para o Paraná")
    add_body(
        "Como competidor de referência analítico, o SAREL implementa a Equação Universal de Perda de Solo Revisada (RUSLE; RENARD et al., 1997): "
        "A = R · K · LS · C · P (perda anual estimada em Mg ha⁻¹ ano⁻¹), auditada e parametrizada com coeficientes científicos específicos do Paraná:"
    )
    add_bullet(
        "Calculado a partir de totais pluviométricos mensais do CHIRPS v2.0 (proveniência modelado, sucedâneo do EI30 com tolerância regional de +-10%), "
        "aplicando-se a equação regional de erosividade do Paraná estabelecida por Rufino, Biscaia e Merten (1993) e atualizada por Waltrick et al. (2010):",
        bold_prefix="Fator R — Erosividade da Chuva (Decisão D13): "
    )
    make_callout_box(
        doc,
        title="Equação 2. Equação Regional de Erosividade do Paraná (Rufino et al., 1993; Waltrick et al., 2010)",
        formula="EI₃₀, mês = 67,355 · ( p² / P )^0,8522     ⇒     R = ∑ₘ₌₁¹² EI₃₀, mês",
        note="onde p representa a precipitação média mensal histórica (mm) e P a precipitação média anual histórica (mm) da célula regional."
    )
    add_bullet(
        "Extraído diretamente do campo numérico k_solos da camada GeoServer oficial da Embrapa Solos (Doc. 246/2024; proveniência tabelado), "
        "que mapeia os solos brasileiros segundo o SiBCS. Na Bacia do Paraná III, os Latossolos Vermelhos apresentam erodibilidade K na faixa de 0,0130 a 0,0170 Mg h MJ⁻¹ mm⁻¹ "
        "e os Nitossolos Vermelhos variam entre 0,0240 e 0,0280 Mg h MJ⁻¹ mm⁻¹ (ambos alocados no Nível 1 de erodibilidade, K ≤ 0,0285). "
        "O Nível 2 de erodibilidade (K ≥ 0,0300 Mg h MJ⁻¹ mm⁻¹) contempla os Neossolos Regolíticos (RLm; K entre 0,0315 e 0,0345) "
        "e os Argissolos Vermelho-Amarelos (PVAe, PVe; K entre 0,0465 e 0,0525), perfazendo 17,6% da bacia e 23,7% dos candidatos elegíveis.",
        bold_prefix="Fator K — Erodibilidade Pedológica do Solo (Decisões D14 e D09): "
    )
    add_bullet(
        "Calculado pelo algoritmo bidimensional de área de contribuição específica de Desmet e Govers (1996) sobre o Modelo Digital de Elevação "
        "Copernicus DEM 30 m (D21), projetado em SIRGAS 2000 UTM 22S (EPSG:31982) com distorção cartográfica corrigida.",
        bold_prefix="Fator LS — Relação Comprimento e Grau de Declive Bidimensional (Decisão D15): "
    )
    add_bullet(
        "A fórmula analítica canônica vigente do Fator C no SAREL é estritamente a equação tropical de Durigon et al. (2014, IJRS): C = (1 - NDVI) / 2 (Decisão D01). "
        "A Decisão D20 (modulação por BSI via C_hibrido = ((1 - NDVI)/2) · (1 + BSI)) constitui exclusivamente uma análise de sensibilidade metodológica pré-registrada, "
        "não substituindo a fórmula analítica canônica ativa de D01.",
        bold_prefix="Fator C — Uso e Manejo da Terra (Decisões D01 e D20): "
    )
    add_bullet(
        "Fixado na constante 1,0 para a avaliação regional sem cadastro fundiário de terraços (linha de base conservadora; RENARD et al., 1997), "
        "sendo refinado nos pontos com verificação presencial em campo por meio de estratificação por classe de declividade e práticas registradas no SAREL Coletor.",
        bold_prefix="Fator P — Práticas Conservacionistas de Suporte (Decisão D22): "
    )

    add_h2("3.7 Modelagem Preditiva XGBoost Tweedie, Teto por Bloco e Falsificabilidade (D24 e D25)")
    add_body(
        "Em vertentes agrícolas manejadas sob conservação, a maioria das células de 10 m não apresenta erosão ativa (massa concentrada em zero). "
        "Para modelar a inflação de zeros sem descartar a variabilidade contínua da fração erodida (y_i in [0, 1]), o SAREL adota o algoritmo XGBoost "
        "com a função de perda da distribuição Tweedie (reg:tweedie) (CHEN; GUESTRIN, 2016), que modela conjuntamente a probabilidade de zero "
        "e a cauda contínua gama não-negativa."
    )
    add_body(
        "A deflação estatística por autocorrelação espacial adota a área do bloco circular de correlação A_bloco = π · (a/2)². "
        "Com o alcance prático pré-registrado a ≈ 50 m (ROBERTS et al., 2017), cada bloco ocupa ≈ 1.963,5 m² (0,19635 ha). "
        "A área total amostrada de 67 polígonos de 5,02 ha (336,34 ha) rende n_ef ≈ 1.713 unidades espacialmente independentes. "
        "Para o conjunto de teste lacrado de 33 polígonos held-out (165,66 ha), resultam n_ef ≈ 844 unidades efetivas independentes (D16, D24, D25). "
        "Para o terreno (Copernicus DEM 30 m nativo com alcance a ≈ 100 m), resultam ~428 unidades independentes (~211 no held-out). "
        "Para prevenir overfitting, o SAREL estabelece um teto rígido de até 14 variáveis preditoras (máx. 8 do bloco espectro-temporal, 4 do bloco de terreno, 1 de solo e 1 de chuva; D24), "
        "com restrições de monotonicidade física positiva impostas a declividade, erodibilidade e solo exposto."
    )
    add_body(
        "A avaliação honesta final ocorre exclusivamente uma única vez sobre os 33 polígonos mantidos em held-out lacrado sob cegamento duplo. "
        "Em cumprimento ao pré-registro (NOSEK et al., 2018), fixam-se três desfechos epistemológicos formais avaliados sob correlação de Spearman e Bootstrap agrupado (CAMERON et al., 2008):\n"
        "1. Corroboração: rho_XGBoost >= 0,40 E Delta rho = (rho_XGBoost - rho_RUSLE) >= 0,10 com p < 0,05 (ganho substancial comprovado).\n"
        "2. Refutação: rho_XGBoost < 0,40 OU limite inferior do IC 95% de Delta rho <= 0 (modelo não supera o RUSLE ou não discrimina).\n"
        "3. Inconclusiva pela Margem: rho_XGBoost >= 0,40 e rho_XGBoost > rho_RUSLE, mas Delta rho < 0,10 (utilidade sem superioridade expressiva demonstrada).",
        bold_prefix="Critério Pré-Registrado de Falsificabilidade e Desfechos (D25): "
    )

    add_h2("3.8 Fundamentação Bibliográfica sob a Norma de Lastro: O Que Cada Fonte Primária Sustenta e Não Sustenta")
    add_body(
        "A governança metodológica do SAREL exige a disciplina da Norma de Lastro: para cada decisão técnica fundamental, "
        "o projeto declara com absoluta transparência o que a fonte primária consultada sustenta e, com igual rigor, o que ela NÃO sustenta, "
        "impedindo interpolações epistemológicas indevidas:"
    )
    fontes_lastro = [
        ("Demattê et al. (2018, RSE) — Máscara de Solo Exposto GEOS3 (Decisão D10):",
         "O que sustenta: A formulação da máscara GEOS3 para recuperação da reflectância espectral de solo mineral a partir de dados orbitais via conjunção estrita de múltiplos filtros: NDVI em [0,00; 0,25], NBR2 em [0,00; 0,075] (escolhido por correlação canônica de 0,93 entre seis faixas testadas) e gradientes espectrais positivos no visível (B4-B3 >= 0 e B3-B2 >= 0).\n"
         "O que NÃO sustenta: Não foi calibrada para o sensor Sentinel-2 MSI (foi calibrada exclusivamente para Landsat 5 TM no Estado de São Paulo); não utiliza o índice VNSIR (que pertence a Demattê et al., 2020); não adota faixas com limites negativos no NDVI ou NBR2; e o limiar de 0,25 de NDVI não é corte univariado isolado. A transposição para Sentinel-2 MSI L2A é hipótese de pesquisa formal declarada pelo SAREL."),
        ("Durigon et al. (2014, IJRS) — Fator C da RUSLE Regional Tropical (Decisão D01):",
         "O que sustenta: A formulação analítica contínua C = (1 - NDVI) / 2 para bacias hidrográficas tropicais brasileiras, sem parâmetros livres e sem cortes artificiais em [0, 1].\n"
         "O que NÃO sustenta: Não sustenta a fórmula exponencial C = [(-NDVI+1)/2]^(1+NDVI) (atribuída a van der Knijff / De Jong), nem foi calibrada para imagens centimétricas de drone, nem substitui a medição direta de cobertura morta em campo."),
        ("Daughtry et al. (2001, 2004) e Hively et al. (2021, RSE) — Discriminação de Palhada no SWIR (Decisão D10):",
         "O que sustenta: Que o NDVI isolado é ineficaz para discriminar resíduo vegetal seco (celulose e lignina) de solo mineral desnudo sob Sistema Plantio Direto, pois ambos exibem baixos valores de NDVI; e que a diferenciação física ocorre exclusivamente no infravermelho de ondas curtas (SWIR), onde o NBR2 captura as feições diagnósticas de absorção da celulose e lignina.\n"
         "O que NÃO sustenta: Não propõem o limiar numérico exato de 0,075 para a máscara GEOS3 (otimizado empiricamente por Demattê et al. em São Paulo), nem foram testados diretamente na Bacia do Paraná 3."),
        ("Embrapa Solos (Doc. 246/2024) e Mannigel et al. (2002) — Fator K de Erodibilidade (Decisões D09 e D14):",
         "O que sustenta: A conversão tabular oficial das classes pedológicas do SiBCS no Estado do Paraná para valores contínuos de erodibilidade pedológica (K em Mg h MJ⁻¹ mm⁻¹), fornecendo lastro para a estratificação K̂1 <= 0,0285 e K̂2 >= 0,0300.\n"
         "O que NÃO sustenta: Não resolvem ambiguidades de solos mapeados em associação policonceitual sem separação cartográfica no mapa estadual 1:250.000, exigindo a regra de conservadorismo pedológico oficial de D08."),
        ("Renard et al. (1997, USDA AH-703) — Linha de Base RUSLE (Decisão D01):",
         "O que sustenta: A estrutura física multiplicativa canônica A = R · K · LS · C · P para estimativa de perda anual de solo em parcelas experimentais homogêneas.\n"
         "O que NÃO sustenta: Não foi concebida para predição pontual instantânea em células raster individuais de 10 m, nem para validação cruzada contra dados de altíssima resolução espacial de VANT sem calibração regional."),
        ("Cochran (1977) e Horvitz & Thompson (1952) — Amostragem Estratificada e Estimadores (Decisão D16 e D23):",
         "O que sustenta: A teoria matemática da amostragem estratificada desproporcional sem reposição e a correção analítica de não-tendenciosidade dos estimadores populacionais através do inverso das probabilidades de inclusão (wi = 1/π_i), com π_i × wi = 1 garantido em todos os estratos.\n"
         "O que NÃO sustenta: Não estabelece a definição das fronteiras biofísicas específicas dos estratos ambientais da BP3, que constituem decisões empíricas do desenho de pesquisa (Decisões D07, D09, D10 e D12).")
    ]
    for tit, txt in fontes_lastro:
        add_bullet(txt, bold_prefix=f"{tit} ")

    add_body(
        "Para a documentação completa dos testes de software, auditoria automatizada do selo de sorteio e verificação contínua do pipeline, "
        "remete-se o leitor ao documento complementar 'Verificação e Validação SAREL' (docs/dissertacao/Verificacao_e_Validacao_SAREL_2026-11-11.docx).",
        bold_prefix="Remissão ao Caderno de Verificação e Validação: "
    )

    # =========================================================================
    # SEÇÃO 4: TABELAS SÍNTESE DA METODOLOGIA E DESENHO EXPERIMENTAL
    # =========================================================================
    add_h1("4. Tabelas Síntese da Metodologia e Desenho Experimental")
    
    # TABELA 1: MATRIZ DE ESTRATIFICAÇÃO (18 ESTRATOS)
    p_t1 = doc.add_paragraph()
    r_t1 = p_t1.add_run("Tabela 1. Matriz de Estratificação Biofísica Amostral da Bacia do Paraná III (18 Estratos Canônicos — Selo Público D16 de 10/11/2026)")
    r_t1.bold = True
    r_t1.font.size = Pt(9.5)
    
    t_est = doc.add_table(rows=19, cols=7)
    t_est.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_est, color="CBD5E1", sz="4")
    
    headers_t1 = ["Estrato ID", "Declividade (Ŝ)", "Freq. Solo Nu (Ê)", "Erodibilidade (K̂)", "Candidatos (Nh)", "Sorteados (nh)", "Regime Amostral & Alocação"]
    widths_t1 = [Inches(0.9), Inches(1.1), Inches(1.1), Inches(1.1), Inches(0.8), Inches(0.8), Inches(1.7)]
    
    for j, h in enumerate(headers_t1):
        cell = t_est.cell(0, j)
        cell.width = widths_t1[j]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=80, bottom=80, left=90, right=90)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(8.0)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    estratos_dados = [
        ("E_1_1_1", "Ŝ1 (3,00%–5,12%)", "Ê1 (≤ 0,0116)", "K̂1 (≤ 0,0285)", "41", "4", "Amostrado (2 Treino / 2 Held-out)"),
        ("E_1_1_2", "Ŝ1 (3,00%–5,12%)", "Ê1 (≤ 0,0116)", "K̂2 (≥ 0,0300)", "6", "4", "Amostrado (2 Treino / 2 Held-out)"),
        ("E_1_2_1", "Ŝ1 (3,00%–5,12%)", "Ê2 (0,0116–0,0490)", "K̂1 (≤ 0,0285)", "86", "4", "Amostrado (2 Treino / 2 Held-out)"),
        ("E_1_2_2", "Ŝ1 (3,00%–5,12%)", "Ê2 (0,0116–0,0490)", "K̂2 (≥ 0,0300)", "3", "3", "CENSO EXAUSTIVO (2 Treino / 1 Held-out; π_i = 1)"),
        ("E_1_3_1", "Ŝ1 (3,00%–5,12%)", "Ê3 (> 0,0490)", "K̂1 (≤ 0,0285)", "91", "4", "Amostrado (2 Treino / 2 Held-out)"),
        ("E_1_3_2", "Ŝ1 (3,00%–5,12%)", "Ê3 (> 0,0490)", "K̂2 (≥ 0,0300)", "0", "0", "ESTRATO VAZIO DECLARADO (Achado Biofísico da BP3)"),
        ("E_2_1_1", "Ŝ2 (5,12%–8,46%)", "Ê1 (≤ 0,0116)", "K̂1 (≤ 0,0285)", "43", "4", "Amostrado (2 Treino / 2 Held-out)"),
        ("E_2_1_2", "Ŝ2 (5,12%–8,46%)", "Ê1 (≤ 0,0116)", "K̂2 (≥ 0,0300)", "6", "4", "Amostrado (2 Treino / 2 Held-out)"),
        ("E_2_2_1", "Ŝ2 (5,12%–8,46%)", "Ê2 (0,0116–0,0490)", "K̂1 (≤ 0,0285)", "80", "4", "Amostrado (2 Treino / 2 Held-out)"),
        ("E_2_2_2", "Ŝ2 (5,12%–8,46%)", "Ê2 (0,0116–0,0490)", "K̂2 (≥ 0,0300)", "4", "4", "CENSO EXAUSTIVO (2 Treino / 2 Held-out; π_i = 1)"),
        ("E_2_3_1", "Ŝ2 (5,12%–8,46%)", "Ê3 (> 0,0490)", "K̂1 (≤ 0,0285)", "88", "4", "Amostrado (2 Treino / 2 Held-out)"),
        ("E_2_3_2", "Ŝ2 (5,12%–8,46%)", "Ê3 (> 0,0490)", "K̂2 (≥ 0,0300)", "4", "4", "CENSO EXAUSTIVO (2 Treino / 2 Held-out; π_i = 1)"),
        ("E_3_1_1", "Ŝ3 (8,46%–20,00%)", "Ê1 (≤ 0,0116)", "K̂1 (≤ 0,0285)", "79", "4", "Amostrado (2 Treino / 2 Held-out)"),
        ("E_3_1_2", "Ŝ3 (8,46%–20,00%)", "Ê1 (≤ 0,0116)", "K̂2 (≥ 0,0300)", "51", "4", "Amostrado (2 Treino / 2 Held-out)"),
        ("E_3_2_1", "Ŝ3 (8,46%–20,00%)", "Ê2 (0,0116–0,0490)", "K̂1 (≤ 0,0285)", "50", "4", "Amostrado (2 Treino / 2 Held-out)"),
        ("E_3_2_2", "Ŝ3 (8,46%–20,00%)", "Ê2 (0,0116–0,0490)", "K̂2 (≥ 0,0300)", "4", "4", "CENSO EXAUSTIVO (2 Treino / 2 Held-out; π_i = 1)"),
        ("E_3_3_1", "Ŝ3 (8,46%–20,00%)", "Ê3 (> 0,0490)", "K̂1 (≤ 0,0285)", "35", "4", "Amostrado (2 Treino / 2 Held-out)"),
        ("E_3_3_2", "Ŝ3 (8,46%–20,00%)", "Ê3 (> 0,0490)", "K̂2 (≥ 0,0300)", "6", "4", "Amostrado (2 Treino / 2 Held-out)")
    ]
    
    for i, row in enumerate(estratos_dados, 1):
        bg = "FFFFFF" if i % 2 == 1 else "F8FAFC"
        if row[0] == "E_1_3_2":
            bg = "FEF3C7"  # Destaque âmbar para o estrato vazio
        elif "CENSO" in row[6]:
            bg = "ECFDF5"  # Destaque verde suave para censos
        for j, val in enumerate(row):
            cell = t_est.cell(i, j)
            cell.width = widths_t1[j]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(7.5)
            if j == 0:
                r.bold = True
                r.font.color.rgb = COLOR_NAVY
            elif "CENSO" in val or "VAZIO" in val:
                r.bold = True
                r.font.color.rgb = COLOR_ROSE if "VAZIO" in val else COLOR_EMERALD
            else:
                r.font.color.rgb = COLOR_SLATE

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # TABELA 2: POOL DE PREDITORES
    p_t2 = doc.add_paragraph()
    r_t2 = p_t2.add_run("Tabela 2. Pool de Candidatos de Preditores, Resolução Nativa e Proveniência (Decisões D06, D21, D24)")
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
        ("Espectro-Temporal (Orbital)", "Bandas Sentinel-2 MSI L2A (B2, B3, B4, B8, B11, B12); Índices NDVI, BSI, NBR2; Frequência decenal de solo exposto Ê; Coeficientes harmônicos OLS (c0, c1, a1, b1; máx. 8 preditores).", "ESA / Copernicus Open Access Hub", "10 m e 20 m (MSI L2A)", "Auditado"),
        ("Geomorfologia de Terreno", "Declividade contínua (graus e %), Fator LS bidimensional (Desmet & Govers, 1996), Aspecto, Curvatura de plano e perfil, Índice de Umidade Topográfica (TWI; máx. 4 preditores).", "ESA Copernicus DEM GLO-30", "30 m (GLO-30)", "Auditado"),
        ("Edafologia Pedológica", "Erodibilidade pedológica contínua k_solos e classe do SiBCS (máx. 1 preditor contínuo).", "Embrapa Solos (Doc. 246/2024)", "Polígonos 1:250.000", "Tabelado"),
        ("Climatologia Regional", "Erosividade da chuva anual R e mensal EI30 via equações regionais do Paraná (Rufino et al., 1993; Waltrick et al., 2010; máx. 1 preditor).", "CHIRPS v2.0 (UCSB/USGS)", "0,05° (~5,3 km)", "Modelado"),
        ("Teto Total da Matriz", "No máximo 14 variáveis preditoras selecionadas simultaneamente na matriz final de treino (Decisão D24), com restrições de monotonicidade física positiva.", "Matriz Multissensor SAREL", "Célula 10 m (D06)", "Consolidado")
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
    # SEÇÃO 5: GLOSSÁRIO NORMATIVO DE DECISÕES METODOLÓGICAS
    # =========================================================================
    add_h1("5. Glossário Normativo de Decisões Metodológicas e Regras do Sistema SAREL v2.0")
    add_body(
        "A governança do projeto SAREL fundamenta-se em um conjunto estrito de Decisões Metodológicas Pré-Registradas (D01 a D26), "
        "regras epistemológicas imutáveis e invariantes matemáticos verificados por testes de unidade determinísticos:"
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
        ("D01", "Fator C Tropical", "C = (1 - NDVI) / 2 (Durigon et al., 2014, IJRS); fórmula analítica canônica ativa mapeada dinamicamente a partir do NDVI da série Sentinel-2 L2A."),
        ("D02", "Triagem de Candidatos", "Critérios observacionais de presente/ausente e negativo explícito para triagem visual; candidatos espectrais de Classe 1 e Classe 0 não constituem rótulo de treino."),
        ("D03", "Escala do Rótulo de Campo", "Coleta ordinal com binarização declarada para compatibilidade de anotação presencial em campo."),
        ("D04", "Modelos D e P", "Distinção formal entre Modelo D (detecção contemporânea pós-evento) e Modelo P (predição prospectiva bienal). Emenda D04 pausa execução do Modelo P para foco estrito na detecção contemporânea."),
        ("D05", "Série Sentinel-2", "Treino exclusivo em Sentinel-2 MSI L2A (2016–2026); Landsat reservado exclusivamente a contexto histórico de longo prazo."),
        ("D06", "Suporte Espacial Nativo", "Unidade de análise fixada na célula de 10 m do Sentinel-2; proibição estrita de reamostragem espúria de insumos mais grossos."),
        ("D07", "Domínio de Validade Físico", "Declividade estritamente entre 3,0% e 20,0% (SiBCS); WorldCover classes 30 e 40 com concordância entre épocas v100 e v200."),
        ("D08", "Associações de Solo", "Ambiguidade de K em unidades de associação resolvida na fonte oficial (Embrapa Solos 2024); heurística taxonômica aposentada."),
        ("D09", "Corte Ordinal de K̂", "Partição em 2 níveis de K̂: Nível 1 (K <= 0,0285; Latossolos e Nitossolos) e Nível 2 (K >= 0,0300 Mg h MJ⁻¹ mm⁻¹; Neossolos Regolíticos RLm e Argissolos PVAe/PVe, 17,6% da BP3)."),
        ("D10", "Máscara de Solo Exposto", "Conjunção estrita de 5 testes de Demattê et al. (2018): NDVI em [0; 0,25], NBR2 em [0; 0,075], B4-B3 >= 0, B3-B2 >= 0 e SCL válido. NBR2 no SWIR desacopla palhada seca de solo mineral."),
        ("D11", "Cobertura Temporal Mínima", "Guarda D11.2: proibição de classificar candidatos sob regime curto (n < 12 observações orbitais válidas), assegurando erro padrão mínimo na estimativa de Ê."),
        ("D12", "Estratificação Multivariada", "18 estratos canônicos pelo produto fatorial Ŝ (3 tercis: 5,12% e 8,46%) x Ê (3 tercis: 0,0116 e 0,0490) x K̂ (2 níveis), com Spatial Thinning r >= 1,0 km."),
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
        ("D16", "Desenho Amostral VANT", "67 polígonos sorteados de 5,02 ha (34 treino / 33 held-out lacrado de teste) sob semente pré-registrada 20261110, 4 estratos em censo e estrato E_1_3_2 vazio declarado."),
        ("D17", "Alocação Cota PlanetScope", "Gestão racional de quotas PlanetScope entre download de mosaicos de evento e visualização de tiles."),
        ("D18", "Buffer PlanetScope", "Área de amortecimento padronizada ao redor dos sítios amostrais para contextualização de vizinhança."),
        ("D19", "Pares de Evento de Chuva", "Reescrita do evento de chuva extrema em escala de polígono para análise secundária de gatilhos hidrológicos."),
        ("D20", "Fator C Híbrido SPD", "Análise de sensibilidade metodológica pré-registrada modulada pelo BSI: C_hibrido = ((1 - NDVI)/2) * (1 + BSI); não substitui o analítico D01."),
        ("D21", "Modelo Digital Elevação", "Copernicus DEM GLO-30 (ESA) na resolução nativa de 30 m em projeção métrica conforme SIRGAS 2000 UTM 22S."),
        ("D22", "Fator P Estratificado", "Fator P fixado em 1,0 na escala de bacia; refinado por observação de práticas conservacionistas estratificadas por declividade em campo."),
        ("D23", "Regime Amostral com π_i", "Estratificação desproporcional com probabilidade de inclusão π_i registrada e invariante de Horvitz-Thompson (π_i * wi = 1)."),
        ("D24", "Teto de Preditores Bloco", "Teto máximo de 14 preditores na matriz: Espectro <= 8, Terreno <= 4, Solo = 1, Chuva = 1; restrições de monotonicidade física positiva."),
        ("D25", "Critério de Refutação", "Avaliação exclusiva nos 33 polígonos held-out lacrados; Spearman rho >= 0,40, Delta rho >= 0,10 (p < 0,05); 3 desfechos formais pré-registrados."),
        ("D26", "Alvo Contínuo Tweedie", "Alvo primário y_i in [0, 1] (fração contínua de célula erodida) ajustada por reg:tweedie; alvo secundário binário derivado a 25%.")
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

    # TABELA 4: REGRAS E INVARIANTES
    p_t4 = doc.add_paragraph()
    r_t4 = p_t4.add_run("Tabela 4. Regras Metodológicas Epistemológicas e Invariantes do Selo de Sorteio (SAREL v2.0)")
    r_t4.bold = True
    r_t4.font.size = Pt(9.5)
    
    t_reg = doc.add_table(rows=11, cols=3)
    t_reg.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_reg, color="CBD5E1", sz="4")
    
    headers_r = ["Identificador", "Enunciado da Regra / Invariante", "Mecanismo de Verificação e Garantia no Código"]
    widths_r = [Inches(1.2), Inches(2.2), Inches(3.3)]
    
    for j, h in enumerate(headers_r):
        cell = t_reg.cell(0, j)
        cell.width = widths_r[j]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    regras_invariantes = [
        ("INV_1_TOTAL_TREINO_HELDOUT", "Conservação Amostral: n_treino + n_heldout = total_sorteados (34 + 33 = 67).", "Verificação booleana exata no carregamento do selo."),
        ("INV_2_AREA_TOTAL", "Conservação de Área: total_poligonos * 5,02 ha = 336,34 ha exatos.", "Tolerância flutuante estrita |area - 336.34| < 0.01 ha."),
        ("INV_3_SOMA_ESTRATOS", "Aditividade de Estratos: soma dos polígonos sorteados em todos os estratos = 67.", "Verificação de integridade no reducer do selo."),
        ("INV_4_PARTICAO_CANDIDATOS", "Integridade da Base: soma dos candidatos Nh nos 18 estratos = 677.", "Conferência contra o hash SHA-256 do arquivo de candidatos."),
        ("INV_5_POLIGONOS_UNICOS", "Não-Sobreposição: todos os 67 polígonos sorteados são geometricamente únicos.", "Verificação via Set() de identificadores de candidato."),
        ("INV_6_CENSO_PI_1", "Regime de Censo: todo estrato com Nh <= 4 possui π_i = 1 e wi = 1.", "Garantia estrita nos 4 estratos em censo exaustivo."),
        ("INV_7_ESTRATO_VAZIO", "Declaração de Vazio: todo estrato vazio declarado possui Nh = 0 e nh = 0.", "Verificação estrita na célula E_1_3_2."),
        ("INV_8_HORVITZ_THOMPSON", "Não-Tendenciosidade: π_i * wi = 1 para todo polígono sorteado.", "Tolerância analítica |π_i * wi - 1| < 1e-9."),
        ("REGRA_CEGAMENTO_D16", "Cegamento por Distribuição (Opções B+D): campo e fotointerpretação sem estrato.", "Exportação limpa de coordenadas sem metadados indutores."),
        ("REGRA_LASTRO_FONTE", "Norma de Lastro: proibição de extrapolar o que a fonte primária não sustenta.", "Auditoria documental em docs/verificacoes/fontes/*/.")
    ]
    
    for i, (cod, tit, desc) in enumerate(regras_invariantes, 1):
        bg = "FFFFFF" if i % 2 == 1 else "F8FAFC"
        for j, val in enumerate([cod, tit, desc]):
            cell = t_reg.cell(i, j)
            cell.width = widths_r[j]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=90, right=90)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.0)
            if j == 0:
                r.bold = True
                r.font.color.rgb = COLOR_NAVY
            elif j == 1:
                r.bold = True
                r.font.color.rgb = COLOR_EMERALD
            else:
                r.font.color.rgb = COLOR_SLATE

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # =========================================================================
    # SEÇÃO 6: REFERÊNCIAS BIBLIOGRÁFICAS
    # =========================================================================
    add_h1("6. Referências Bibliográficas (Norma ABNT NBR 6023)")
    
    referencias_abnt = [
        "ALTMAN, D. G.; ROYSTON, P. The cost of dichotomising continuous variables. BMJ, London, v. 332, n. 7549, p. 1080, 2006.",
        "BAZZI, C. L. et al. Spatial variability of soil loss and USLE factors in Western Paraná. Revista Brasileira de Ciência do Solo, Viçosa, v. 46, e0210150, 2022.",
        "CAMERON, A. C.; GELBACH, J. B.; MILLER, D. L. Bootstrap-based improvements for inference with clustered errors. The Review of Economics and Statistics, Cambridge, v. 90, n. 3, p. 414–427, 2008.",
        "CHEN, T.; GUESTRIN, C. XGBoost: A scalable tree boosting system. In: ACM SIGKDD INTERNATIONAL CONFERENCE ON KNOWLEDGE DISCOVERY AND DATA MINING, 22., 2016, San Francisco. Proceedings [...]. New York: ACM, 2016. p. 785–794.",
        "COCHRAN, W. G. Sampling Techniques. 3. ed. New York: John Wiley & Sons, 1977. 428 p.",
        "CONGALTON, R. G.; GREEN, K. Assessing the accuracy of remotely sensed data: principles and practices. 3. ed. Boca Raton: CRC Press, 2019. 348 p.",
        "DAUGHTRY, C. S. T. et al. Estimating crop residue cover using advanced airborne hyperspectral images. Remote Sensing of Environment, v. 90, n. 1, p. 126–136, 2004.",
        "DEMATTÊ, J. A. M. et al. A powerful data mining procedure to retrieve soil spectral reflectance from satellite images. Remote Sensing of Environment, v. 212, p. 161–175, 2018.",
        "DESMET, P. J. J.; GOVERS, G. A GIS procedure for automatically calculating the USLE LS factor on topographically complex landscape units. Journal of Soil and Water Conservation, Ankeny, v. 51, n. 5, p. 427–433, 1996.",
        "DURIGON, V. L. et al. NDVI time series for monitoring RUSLE cover management factor in a tropical watershed. International Journal of Remote Sensing, London, v. 35, n. 2, p. 441–453, 2014.",
        "EMBRAPA SOLOS. Erodibilidade dos solos do Estado do Paraná. Rio de Janeiro: Embrapa Solos, 2024. 38 p. (Documentos, 246).",
        "HIVELY, W. D. et al. Performance of satellite-derived crop residue cover metrics. Remote Sensing of Environment, v. 257, 112349, 2021.",
        "HORVITZ, D. G.; THOMPSON, D. J. A generalization of sampling without replacement from a finite universe. Journal of the American Statistical Association, v. 47, n. 260, p. 663–685, 1952.",
        "KRUG, E. Cenários conservacionistas na estimativa de perda de solo na Bacia do Rio Paraná III. 2024. 110 f. Dissertação (Mestrado em Tecnologias Computacionais para o Agronegócio) — Universidade Tecnológica Federal do Paraná, Medianeira, 2024.",
        "LUCAS, M. Modelagem da erosão hídrica sob variabilidade pluviométrica na Bacia do Rio Paraná III. 2024. 125 f. Dissertação (Mestrado em Tecnologias Computacionais para o Agronegócio) — Universidade Tecnológica Federal do Paraná, Medianeira, 2024.",
        "LUNDBERG, S. M.; LEE, S.-I. A unified approach to interpreting model predictions. In: ADVANCES IN NEURAL INFORMATION PROCESSING SYSTEMS (NEURIPS 2017), 30., 2017, Long Beach. Proceedings [...]. Red Hook: Curran Associates, 2017. p. 4765–4774.",
        "MANNIGEL, E. et al. Fator erodibilidade de solos do estado de São Paulo. Revista Brasileira de Ciência do Solo, v. 26, n. 4, p. 1039–1049, 2002.",
        "NOSEK, B. A. et al. The preregistration revolution. Proceedings of the National Academy of Sciences, Washington, D.C., v. 115, n. 11, p. 2600–2606, 2018.",
        "PINEAU, J. et al. Improving reproducibility in machine learning research. Journal of Machine Learning Research, Cambridge, v. 22, n. 164, p. 1–20, 2021.",
        "RENARD, K. G. et al. Predicting soil erosion by water: a guide to conservation planning with the Revised Universal Soil Loss Equation (RUSLE). Washington, D.C.: United States Department of Agriculture, 1997. 404 p. (Agriculture Handbook, n. 703).",
        "ROBERTS, D. R. et al. Cross-validation strategies for data with temporal, spatial, or hierarchical structure. Ecography, Copenhagen, v. 40, n. 8, p. 913–929, 2017.",
        "RUFINO, R. L.; BISCAIA, R. C. M.; MERTEN, G. H. Determinação do potencial erosivo da chuva para o estado do Paraná através da pluviometria: terceira aproximação. Revista Brasileira de Ciência do Solo, Campinas, v. 17, n. 3, p. 439–444, 1993.",
        "SANTOS, H. G. et al. Sistema Brasileiro de Classificação de Solos. 5. ed. Brasília, DF: Embrapa, 2018. 356 p.",
        "WALTRICK, P. C. et al. Potencial erosivo das chuvas em cidades do Estado do Paraná: estimativa por meio de coeficientes de correlação. Revista Brasileira de Ciência do Solo, Viçosa, v. 34, n. 5, p. 1713–1721, 2010.",
        "WISCHMEIER, W. H.; SMITH, D. D. Predicting rainfall erosion losses: a guide to conservation planning. Washington, D.C.: United States Department of Agriculture, 1978. 58 p. (Agriculture Handbook, n. 537)."
    ]
    
    for ref in referencias_abnt:
        p_ref = doc.add_paragraph()
        p_ref.paragraph_format.space_after = Pt(5)
        p_ref.paragraph_format.line_spacing = 1.0
        p_ref.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r = p_ref.add_run(ref)
        r.font.size = Pt(8.5)
        r.font.color.rgb = COLOR_NAVY

    doc.save(caminho_saida)
    print(f"[OK] Documento DOCX salvo com sucesso em: {caminho_saida}")

if __name__ == "__main__":
    caminho = "docs/dissertacao/Metodologia_Integrada_Dissertacao_SAREL.docx"
    if len(sys.argv) > 1:
        caminho = sys.argv[1]
    build_docx(caminho)
