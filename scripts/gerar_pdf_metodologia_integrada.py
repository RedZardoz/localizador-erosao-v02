#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Geração do Documento Integrado:
Metodologia Geral, Fundamentação Epistemológica de Reprodutibilidade, Prevenção de Viés Espectral,
Especificação Experimental e Glossário Normativo para a Dissertação de Mestrado (Sistema SAREL v2.0).

Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA)
Universidade Tecnológica Federal do Paraná (UTFPR) - Câmpus Medianeira
Mestrando: Luis Alfredo Ferreira da Silva
Orientador: Prof. Dr. Claudio Leones Bazzi
"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

# =============================================================================
# PALETA DE CORES INSTITUCIONAL SAREL v2.0
# =============================================================================
C_NAVY_DARK = colors.HexColor("#0F172A")    # Slate 900
C_NAVY_CARD = colors.HexColor("#1E293B")    # Slate 800
C_SLATE_TEXT = colors.HexColor("#334155")   # Slate 700
C_SLATE_MUTED = colors.HexColor("#64748B")  # Slate 500
C_BORDER = colors.HexColor("#CBD5E1")       # Slate 300
C_BORDER_LIGHT = colors.HexColor("#E2E8F0") # Slate 200

C_EMERALD_DARK = colors.HexColor("#065F46") # Emerald 800
C_EMERALD_MID = colors.HexColor("#059669")  # Emerald 600
C_MINT_BG = colors.HexColor("#ECFDF5")      # Mint 50

C_CYAN_DARK = colors.HexColor("#0369A1")    # Sky 700
C_CYAN_BG = colors.HexColor("#F0F9FF")      # Sky 50

C_AMBER_DARK = colors.HexColor("#B45309")   # Amber 700
C_AMBER_BG = colors.HexColor("#FFFBEB")     # Amber 50

C_WHITE = colors.HexColor("#FFFFFF")
C_BG_PAGE = colors.HexColor("#F8FAFC")

# =============================================================================
# CANVAS PERSONALIZADO COM NUMERAÇÃO "PÁGINA X DE Y" E CABEÇALHOS ACADÊMICOS
# =============================================================================
class SarelMasterCanvas(canvas.Canvas):
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
            
            # Cabeçalho Superior (Margens laterais de 20 mm)
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(C_EMERALD_DARK)
            self.drawString(20 * mm, page_h - 11 * mm, "PPGTCA / UTFPR — PROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO")
            self.setFont("Helvetica", 7.5)
            self.setFillColor(C_SLATE_MUTED)
            self.drawRightString(page_w - 20 * mm, page_h - 11 * mm, "METODOLOGIA INTEGRADA & GLOSSÁRIO • SAREL")
            
            # Linha divisória superior (a 14 mm do topo; texto começa em 22 mm -> 8 mm livres)
            self.setStrokeColor(C_BORDER_LIGHT)
            self.setLineWidth(0.6)
            self.line(20 * mm, page_h - 14 * mm, page_w - 20 * mm, page_h - 14 * mm)
            
            # Linha divisória inferior (a 15 mm da base; texto termina em 20 mm -> 5 mm livres)
            self.line(20 * mm, 15 * mm, page_w - 20 * mm, 15 * mm)
            
            # Rodapé Inferior
            self.setFont("Helvetica", 8)
            self.setFillColor(C_SLATE_MUTED)
            self.drawString(20 * mm, 10 * mm, "Dissertação de Mestrado: Predição de Erosão Laminar na BP3 • Luis Alfredo (Orientador: Prof. Dr. Claudio L. Bazzi)")
            self.drawRightString(page_w - 20 * mm, 10 * mm, f"Página {self._pageNumber} de {page_count}")
            self.restoreState()

# =============================================================================
# ESTILOS TIPOGRÁFICOS DO DOCUMENTO
# =============================================================================
def get_custom_styles():
    base = getSampleStyleSheet()
    styles = {}
    
    styles["DocTitle"] = ParagraphStyle(
        "DocTitle",
        fontName="Helvetica-Bold",
        fontSize=13.5,
        leading=17.5,
        textColor=C_NAVY_DARK,
        alignment=TA_LEFT,
        spaceAfter=3
    )
    styles["DocSubtitle"] = ParagraphStyle(
        "DocSubtitle",
        fontName="Helvetica",
        fontSize=8.6,
        leading=12.0,
        textColor=C_SLATE_TEXT,
        alignment=TA_LEFT,
        spaceAfter=5
    )
    styles["InstitutionHeader"] = ParagraphStyle(
        "InstitutionHeader",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11.5,
        textColor=C_EMERALD_DARK,
        alignment=TA_LEFT,
        spaceAfter=1.5
    )
    styles["MetadataBox"] = ParagraphStyle(
        "MetadataBox",
        fontName="Helvetica",
        fontSize=7.3,
        leading=10.2,
        textColor=C_SLATE_TEXT
    )
    styles["H1"] = ParagraphStyle(
        "H1",
        fontName="Helvetica-Bold",
        fontSize=10.0,
        leading=13.0,
        textColor=C_NAVY_DARK,
        spaceBefore=5.5,
        spaceAfter=2.5,
        keepWithNext=True
    )
    styles["H2"] = ParagraphStyle(
        "H2",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11.2,
        textColor=C_EMERALD_DARK,
        spaceBefore=4.0,
        spaceAfter=1.8,
        keepWithNext=True
    )
    styles["Body"] = ParagraphStyle(
        "Body",
        fontName="Helvetica",
        fontSize=7.7,
        leading=11.0,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY,
        spaceAfter=2.5
    )
    styles["BodyBold"] = ParagraphStyle(
        "BodyBold",
        fontName="Helvetica-Bold",
        fontSize=7.7,
        leading=11.0,
        textColor=C_NAVY_DARK,
        spaceAfter=2
    )
    styles["BulletText"] = ParagraphStyle(
        "BulletText",
        fontName="Helvetica",
        fontSize=7.5,
        leading=10.6,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY,
        spaceAfter=1.6
    )
    styles["FormulaBox"] = ParagraphStyle(
        "FormulaBox",
        fontName="Helvetica-Bold",
        fontSize=8.0,
        leading=10.8,
        textColor=C_EMERALD_DARK,
        alignment=TA_CENTER
    )
    styles["FormulaNote"] = ParagraphStyle(
        "FormulaNote",
        fontName="Helvetica-Oblique",
        fontSize=6.9,
        leading=9.0,
        textColor=C_SLATE_MUTED,
        alignment=TA_CENTER
    )
    styles["ScriptBox"] = ParagraphStyle(
        "ScriptBox",
        fontName="Helvetica",
        fontSize=7.2,
        leading=10.2,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY
    )
    styles["TableHeader"] = ParagraphStyle(
        "TableHeader",
        fontName="Helvetica-Bold",
        fontSize=6.6,
        leading=8.6,
        textColor=C_WHITE,
        alignment=TA_LEFT
    )
    styles["TableCell"] = ParagraphStyle(
        "TableCell",
        fontName="Helvetica",
        fontSize=6.5,
        leading=8.5,
        textColor=C_SLATE_TEXT
    )
    styles["TableCellBold"] = ParagraphStyle(
        "TableCellBold",
        fontName="Helvetica-Bold",
        fontSize=6.5,
        leading=8.5,
        textColor=C_NAVY_DARK
    )
    styles["GlossaryCode"] = ParagraphStyle(
        "GlossaryCode",
        fontName="Helvetica-Bold",
        fontSize=6.8,
        leading=8.8,
        textColor=C_EMERALD_DARK,
        alignment=TA_CENTER
    )
    styles["ReferenceItem"] = ParagraphStyle(
        "ReferenceItem",
        fontName="Helvetica",
        fontSize=6.7,
        leading=9.2,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY,
        spaceAfter=2.6
    )
    return styles

def build_pdf():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    out_dir = os.path.join(project_root, "docs", "BASES PARA A DISSERTAÇÃO")
    os.makedirs(out_dir, exist_ok=True)
    pdf_path = os.path.join(out_dir, "Metodologia_Integrada_Dissertacao_SAREL.pdf")
    alt_path = os.path.join(out_dir, "Metodologia_Integrada_Dissertacao_SAREL_Revisado.pdf")
    
    # Verifica se o arquivo principal está travado por leitor de PDF (ex: Acrobat / PDF Editor)
    target_path = pdf_path
    if os.path.exists(pdf_path):
        try:
            with open(pdf_path, "r+b"):
                pass
        except Exception:
            target_path = alt_path
            print(f"[AVISO] O arquivo {pdf_path} está aberto no leitor de PDF. Compilando em: {alt_path}")
    
    # Margens acadêmicas estritas: 20 mm laterais, 22 mm topo, 20 mm base
    doc = SimpleDocTemplate(
        target_path,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=22 * mm,
        bottomMargin=20 * mm
    )
    
    styles = get_custom_styles()
    story = []
    
    # =========================================================================
    # PÁGINA 1: CABEÇALHO INSTITUCIONAL, METADADOS E SEÇÃO 1 (CONTEXTO E HIPÓTESES)
    # =========================================================================
    story.append(Paragraph("UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ (UTFPR) — CÂMPUS MEDIANEIRA", styles["InstitutionHeader"]))
    story.append(Paragraph("PROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO (PPGTCA)", styles["InstitutionHeader"]))
    story.append(Spacer(1, 1.2 * mm))
    
    story.append(Paragraph("LOCALIZAÇÃO E PREDIÇÃO DE EROSÃO LAMINAR NA BACIA HIDROGRÁFICA DO PARANÁ III POR SENSORIAMENTO REMOTO MULTIFONTE E APRENDIZADO DE MÁQUINA SUPERVISIONADO POR VANT", styles["DocTitle"]))
    story.append(Paragraph(
        "Metodologia Integrada, Fundamentação Epistemológica de Reprodutibilidade, Prevenção de Viés Espectral, Especificação Experimental e Glossário Normativo para a Dissertação de Mestrado",
        styles["DocSubtitle"]
    ))
    
    meta_table_data = [
        [
            Paragraph("<b>Mestrando:</b> Luis Alfredo Ferreira da Silva<br/>"
                      "<b>Orientador:</b> Prof. Dr. Claudio Leones Bazzi<br/>"
                      "<b>Área de Concentração:</b> Tecnologias Computacionais no Agronegócio<br/>"
                      "<b>Linha de Pesquisa:</b> Geotecnologias Aplicadas e Modelagem Computacional", styles["MetadataBox"]),
            Paragraph("<b>Sistema Computacional:</b> SAREL v2.0 (Amostragem e Rotulagem)<br/>"
                      "<b>Recorte Territorial:</b> Bacia do Paraná III (7.979 km² hidrológicos; 28 municípios)<br/>"
                      "<b>Domínio Físico:</b> Declividade 3,0% a 20,0% (SiBCS; Decisão D07)<br/>"
                      "<b>Pilares Epistemológicos:</b> Reprodutibilidade de IA e Ausência de Vazamento (D16, D24, D25)", styles["MetadataBox"])
        ]
    ]
    t_meta = Table(meta_table_data, colWidths=[85 * mm, 85 * mm])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_BG_PAGE),
        ('BOX', (0,0), (-1,-1), 0.6, C_BORDER),
        ('PADDING', (0,0), (-1,-1), 2.8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 1.8 * mm))
    
    story.append(Paragraph("1. Introdução, Estado da Arte Regional e Definição do Problema", styles["H1"]))
    story.append(Paragraph(
        "A erosão hídrica laminar (<i>sheet erosion</i>) consiste no desprendimento e transporte difuso de delgadas camadas superficiais do solo "
        "pelo impacto cinético das gotas de chuva (<i>splash detachment</i>) e deflúvio superficial não concentrado (<i>sheet runoff</i>). "
        "Por não formar ravinamentos imediatos, sua ocorrência mascara a severa e progressiva degradação dos solos agricultáveis.",
        styles["Body"]
    ))
    story.append(Paragraph(
        "Na <b>Bacia Hidrográfica do Rio Paraná III (BP3)</b>, recorte territorial deste estudo abrangendo aproximadamente 7.979 km² "
        "de drenagem estrita (base oficial IAT/SEMA/ANA) e 28 municípios do oeste paranaense (19 integrais e 9 parciais; IBGE/ITCG), "
        "a intensa exploração agrícola sobre Latossolos e Nitossolos Vermelhos distroférricos basálticos deságua diretamente na margem "
        "esquerda do Reservatório da Usina Hidrelétrica de Itaipu Binacional, onde o aporte de sedimentos finos compromete a qualidade da água e a vida útil do empreendimento.",
        styles["Body"]
    ))
    story.append(Paragraph(
        "<b>O Estado da Arte no PPGTCA e a Lacuna Regional:</b> Investigações pioneiras desenvolvidas no âmbito do PPGTCA/UTFPR sob coordenação "
        "do Prof. Dr. Claudio Leones Bazzi (BAZZI et al., 2022; KRUG, 2024; LUCAS, 2024) evidenciaram tanto o potencial quanto as restrições "
        "dos modelos analítico-empíricos lineares clássicos na região oeste do Paraná. Em <b>Bazzi et al. (2022)</b>, demonstrou-se que a variabilidade "
        "espacial dos fatores da Equação Universal de Perda de Solo (USLE) exige parametrizações locais detalhadas para orientar a conservação do solo. "
        "Nas dissertações de <b>Lucas (2024)</b> e <b>Krug (2024)</b>, avaliou-se o impacto de cenários conservacionistas e variações pluviométricas na bacia. "
        "Entretanto, a literatura manteve-se restrita à formulação empírica da USLE/RUSLE (WISCHMEIER; SMITH, 1978; RENARD et al., 1997), que parte de "
        "parcelas experimentais homogêneas de 22,1 metros e gera distorções em escala de bacia por desconsiderar complexas não-linearidades de terreno e manejo. "
        "O presente projeto preenche essa lacuna com a concepção do <b>SAREL (Sistema de Amostragem e Rotulagem para Erosão Laminar)</b>.",
        styles["Body"]
    ))
    story.append(Paragraph(
        "<b>Hipóteses Científicas Norteadoras:</b><br/>"
        "• <b>Hipótese Central (H1):</b> Modelos de aprendizado de máquina supervisionados por VANT (Gradient Boosted Trees / XGBoost), integrando "
        "preditores espectro-temporais decenais do satélite Sentinel-2, variáveis morfométricas de terreno do Copernicus DEM 30 m e dados edafoclimáticos, "
        "apresentam capacidade preditiva e discriminatória da erosão laminar significativamente superior à linha de base da RUSLE regional na BP3 "
        "(definida como ganho de correlação de Spearman Delta rho &ge; 0,10 com p &lt; 0,05; Decisão D25).<br/>"
        "• <b>Hipótese Secundária (H2):</b> A formulação do alvo como variável contínua (fração de célula erodida y &isin; [0, 1]; Decisão D26) "
        "ajustada por distribuição Tweedie (`reg:tweedie`) preserva informação biofísica real e supera abordagens binarizadas convencionais sujeitas "
        "à perda amostral por dicotomização artificial (ALTMAN; ROYSTON, 2006).",
        styles["Body"]
    ))
    
    # Quebra limpa para a Página 2: Introdução Metodológica (Replicabilidade em IA)
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 2: SEÇÃO 2 (INTRODUÇÃO DA PARTE METODOLÓGICA — PILARES DE REPLICABILIDADE)
    # =========================================================================
    story.append(Paragraph("2. Introdução da Parte Metodológica: Fundamentação Epistemológica de Replicabilidade e Prevenção de Viés Espectral", styles["H1"]))
    story.append(Paragraph(
        "A aplicação de inteligência artificial em geociências e ciências agrárias enfrenta com frequência dois questionamentos metodológicos centrais: "
        "<i>(1) Como garantir a replicabilidade científica de um modelo se os algoritmos de aprendizado de máquina são intrinsecamente probabilísticos?</i>; e "
        "<i>(2) Não existe o risco de o treinamento ficar 'viciado' nos dados de altíssima precisão obtidos pelo sensor multiespectral do drone (VANT)?</i> "
        "Esta seção estabelece as bases epistemológicas e matemáticas adotadas no SAREL para neutralizar ambos os riscos antes de detalhar o protocolo experimental.",
        styles["Body"]
    ))
    story.append(Paragraph("2.1 Eixo I: A Replicabilidade Científica em Modelos Probabilísticos de Aprendizado de Máquina", styles["H2"]))
    story.append(Paragraph(
        "Na ciência da computação e na inferência estatística moderna, algoritmos de aprendizado de máquina baseados em árvores (como o XGBoost; CHEN; GUESTRIN, 2016) "
        "ou descida de gradiente estocástica não são 'mágicos' ou aleatórios no sentido caótico. Eles são <b>funções matemáticas determinísticas "
        "alimentadas por Geradores de Números Pseudoaleatórios (PRNG)</b>. O SAREL ancora sua replicabilidade em <b>três pilares epistemológicos</b> "
        "estabelecidos pela literatura de ponta (PINEAU et al., 2021; NOSEK et al., 2018):",
        styles["Body"]
    ))
    story.append(Paragraph(
        "• <b>Pilar 1 — Determinismo Numérico e Reprodutibilidade Exata do Código (Decisão P01):</b><br/>"
        "Todo componente estocástico do sistema — desde a inicialização dos nós das árvores, a subamostragem de linhas e colunas (<i>subsample</i> e <i>colsample_bytree</i>) "
        "até a partição de dobras de validação cruzada — opera sob <b>sementes criptograficamente registradas e imutáveis (*seed registry*)</b>. "
        "O repositório encapsula o ambiente computacional exato via arquivos de bloqueio de dependências determinísticos (`uv.lock` / `package-lock.json`), "
        "garantindo que qualquer pesquisador que execute o pipeline sobre a mesma massa de dados obterá matrizes de pesos e predições com identidade binária bit a bit (PINEAU et al., 2021).",
        styles["BulletText"]
    ))
    story.append(Paragraph(
        "• <b>Pilar 2 — Reprodutibilidade Estatística e Invariância à Semente Amostral (Decisões D24 e D25):</b><br/>"
        "Um achado científico não pode depender da semente aleatória escolhida (ex.: se a hipótese for corroborada na semente 42, mas refutada na 43, o achado é artefato espúrio). "
        "Para comprovar estabilidade assintótica, o SAREL adota validação por distribuições amostrais completas via <b>1.000 iterações de Bootstrap agrupado por polígono (*clustered bootstrap*)</b> "
        "(CAMERON; GELBACH; MILLER, 2008). O ganho do XGBoost sobre a linha de base analítica RUSLE é declarado estatisticamente demonstrado apenas se o limite inferior "
        "do intervalo de confiança de 95% do ganho Delta rho for estritamente superior a zero (Delta rho &ge; 0,10 com p &lt; 0,05; ROBERTS et al., 2017).",
        styles["BulletText"]
    ))
    story.append(Paragraph(
        "• <b>Pilar 3 — Reprodutibilidade Experimental e Pré-Registro Científico Open Science (Decisões D07 a D26):</b><br/>"
        "A maior causa de não-replicabilidade em aprendizado de máquina aplicado não decorre do algoritmo, mas da flexibilidade analítica retrospectiva do pesquisador "
        "(testar centenas de hiperparâmetros ou métricas após observar os dados até que um resultado conveniente surja; NOSEK et al., 2018). "
        "O SAREL adota o paradigma de <b>Pré-Registro Científico (Open Science)</b>: o domínio físico de declividade (3,0% a 20,0%; D07), a estratificação em 18 estratos (D12), "
        "o tamanho amostral de 72 polígonos de 5,02 ha (D16), os tetos de preditores por bloco físico (máx. 14; D24), a métrica primária contínua (Spearman; D26) "
        "e o piso de refutação (D25) foram fixados no repositório antes da coleta e do ajuste do modelo, eliminando o <i>HARKing</i> (<i>Hypothesizing After Results are Known</i>).",
        styles["BulletText"]
    ))
    
    # Quebra limpa para a Página 3: Neutralização do Viés Espectral do VANT e Scripts
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 3: SEÇÃO 2.2 (NEUTRALIZAÇÃO DO VIÉS ESPECTRAL) E SEÇÃO 2.3 (SCRIPTS)
    # =========================================================================
    story.append(Paragraph("2.2 Eixo II: Neutralização do Risco de 'Viciar' o Modelo nos Dados Centimétricos do VANT", styles["H2"]))
    story.append(Paragraph(
        "A preocupação de que o modelo possa ficar 'viciado' (sobreajustado) na altíssima resolução do sensor multiespectral embarcado no VANT decorre "
        "de uma confusão comum entre <b>dado de entrada (variável preditora ou *feature*)</b> e <b>dado de referência pericial (rótulo ou *ground truth target*)</b>. "
        "O projeto SAREL resolve essa questão por meio de três salvaguardas metodológicas rigorosas:",
        styles["Body"]
    ))
    story.append(Paragraph(
        "• <b>Desacoplamento Arquitetural Rígido: O VANT é Rótulo Pericial (Y), Jamais Variável Preditora (X) (Decisões D06, D16 e D26):</b><br/>"
        "O modelo XGBoost <b>JAMAIS recebe em sua matriz de treino a refletância multiespectral de 4 cm do sensor Spectral 2</b>. "
        "O ortomosaico centimétrico gerado pelo VANT serve unicamente aos peritos humanos em solo para realizar a fotointerpretação e vetorização manual "
        "das feições diagnósticas de erosão ativa (pedestais, raízes expostas, microssulcos e leques coluviais). Essa máscara vetorial é rasterizada "
        "para a célula de 10 m do Sentinel-2, definindo a fração de área erodida (y_i &isin; [0, 1]). "
        "<b>As variáveis preditoras alimentadas no modelo continuam sendo exclusivamente os dados orbitais do Sentinel-2 (10 m), o Copernicus DEM (30 m) e as cartas oficiais de solo e chuva</b>. "
        "Portanto, o sistema não aprende feições espectrais do sensor do drone; ele aprende como os pixels do satélite orbital Sentinel-2 respondem à erosão real confirmada em campo.",
        styles["BulletText"]
    ))
    story.append(Paragraph(
        "• <b>A Teoria da Escala em Sensoriamento Remoto e a Validade Ecológica (WOODCOCK; STRAHLER, 1987; ALVAREZ-VANHARD et al., 2021):</b><br/>"
        "O uso do VANT resolve o maior gargalo histórico do sensoriamento remoto de erosão: a contaminação do rótulo por erro de agregação subpixel (<i>point-to-pixel misalignment</i>). "
        "Em levantamentos convencionais com GPS de navegação em ponto único (erro de 3 a 8 m), o ponto cai frequentemente na borda ou fora da célula de 10 m. "
        "Com o ortomosaico de 4 cm do VANT Spectral 2 e precisão posicional CE90 de 1,47 m, cada célula orbital de 10 x 10 m (100 m²) contém cerca de 62.500 micropixels "
        "de observação contínua, permitindo calcular a fração erodida real com fidelidade matemática e sem ruído de borda.",
        styles["BulletText"]
    ))
    story.append(Paragraph(
        "• <b>Prevenção de Vazamento Espacial de Dados (*Data Leakage*) e Isolamento de 36 Polígonos de Teste (D16 e D25):</b><br/>"
        "O risco real de viés reside na autocorrelação espacial (células vizinhas do mesmo sobrevoo partilharem feições idênticas; PLOTON et al., 2020; KAPOOR; NARAYANAN, 2023). "
        "Para neutralizar esse vazamento, o SAREL implementa: (a) <i>Spatial Block Cross-Validation</i> baseada no alcance prático do variograma (a &approx; 50 m; ROBERTS et al., 2017); "
        "e (b) a <b>reserva estrita de 36 polígonos amostrais inteiros de 5,02 ha mantidos em *held-out* lacrado</b> (2 polígonos por estrato de D12; D16). "
        "A avaliação da performance final ocorre exclusivamente sobre essas áreas lacradas, onde o algoritmo jamais viu qualquer dado de treino ou de voo.",
        styles["BulletText"]
    ))
    story.append(Spacer(1, 1.0 * mm))
    
    story.append(Paragraph("2.3 Roteiro Sintético de Defesa e Arguição em Seminários e Bancas", styles["H2"]))
    
    script_box_data = [
        [
            Paragraph(
                "<b>Síntese de Arguição em Bancas (Roteiro Verbal para Defesa do Mestrando):</b><br/>"
                "<i>\"A replicabilidade do nosso trabalho não depende de 'sorte' estocástica: o código é 100% determinístico com sementes e dependências auditáveis (P01; Pineau et al., 2021). "
                "Para garantir que o resultado não seja refém da semente, validamos a hipótese por intervalos de confiança empíricos de 95% derivados de 1.000 reamostragens de Bootstrap agrupado "
                "em 36 polígonos independentes (Cameron et al., 2008), sob pré-registro metodológico aberto (Nosek et al., 2018). "
                "Quanto ao risco de 'viciar' no VANT, não há essa possibilidade porque o sensor multiespectral Spectral 2 NUNCA entra na matriz de preditores do modelo (D24). "
                "O drone atua como verdade de campo pericial para rotulagem (Y), enquanto as variáveis preditoras (X) vêm estritamente do satélite Sentinel-2 (10 m), do DEM Copernicus (30 m) e do solo regional. "
                "O VANT calibra a verdade; a predição em escala de bacia opera exclusivamente por satélite orbital.\"</i>",
                styles["ScriptBox"]
            )
        ]
    ]
    t_script = Table(script_box_data, colWidths=[170 * mm])
    t_script.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_CYAN_BG),
        ('BOX', (0,0), (-1,-1), 0.8, C_CYAN_DARK),
        ('PADDING', (0,0), (-1,-1), 2.8),
    ]))
    story.append(t_script)
    
    # Quebra limpa para a Página 4: Metodologia Detalhada (Recorte e Amostragem)
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 4: SEÇÃO 3 (METODOLOGIA DETALHADA — 3.1 E 3.2)
    # =========================================================================
    story.append(Paragraph("3. Especificação Metodológica Detalhada e Modelagem Matemática (SAREL v2.0)", styles["H1"]))
    story.append(Paragraph("3.1 Recorte Espacial e Máscara Territorial de Elegibilidade (Decisão D07)", styles["H2"]))
    story.append(Paragraph(
        "O domínio geográfico da pesquisa compreende a Bacia Hidrográfica do Rio Paraná III (BP3), abrangendo 28 municípios do oeste paranaense "
        "e aproximadamente 7.979 km² de drenagem estrita (base oficial IAT/SEMA/ANA). Para assegurar a validade ecológica dos modelos e garantir que a predição "
        "incida estritamente sobre as áreas agrícolas onde a erosão laminar é o processo atuante, aplica-se a <b>Máscara Territorial de Elegibilidade (Decisão D07)</b>, "
        "composta pelos seguintes critérios físicos cumulativos:",
        styles["Body"]
    ))
    story.append(Paragraph("• <b>Uso e Cobertura da Terra (ESA WorldCover 10 m):</b> Admitem-se exclusivamente as classes 30 (pastagem cultivada) e 40 (lavouras anuais de grãos). A classe 60 (solo exposto e vegetação esparsa) é expressamente excluída da entrada para evitar circularidade com a dimensão Ê da estratificação (frequência histórica de solo nu). Exige-se concordância estrita entre as versões v100 (2020) e v200 (2021) do produto.", styles["BulletText"]))
    story.append(Paragraph("• <b>Exclusão Hidrográfica e Urbana:</b> Remoção de massas d'água permanentes (JRC Global Surface Water com buffer de exclusão de 30 m) e malhas urbanas/antrópicas consolidadas.", styles["BulletText"]))
    story.append(Paragraph("• <b>Janela Física de Declividade (Decisão D07 e P04):</b> Recorte restrito rigorosamente ao intervalo de <b>3,0% a 20,0%</b> (classes de relevo suave-ondulado a ondulado do Sistema Brasileiro de Classificação de Solos — SiBCS; EMBRAPA SOLOS, 2018), calculada em projeção métrica SIRGAS 2000 / UTM fuso 22S (EPSG:31982). Áreas planas (&lt; 3,0%) são excluídas por ausência de energia cinética no deflúvio difuso para transporte laminar (predomínio de deposição); encostas íngremes (&gt; 20,0%) são excluídas pois o escoamento converge rapidamente em sulcos estruturais e voçorocas, fenômenos morfodinâmicos distintos da erosão laminar que este projeto visa modelar.", styles["BulletText"]))
    story.append(Paragraph("• <b>Vedação de Extrapolação:</b> Fora dos limites de 3,0% a 20,0% de declividade e fora das classes agrícolas 30 e 40, nenhuma predição é declarada válida e nenhuma métrica de avaliação é computada (Decisão D25).", styles["BulletText"]))
    story.append(Spacer(1, 1.5 * mm))
    
    story.append(Paragraph("3.2 Desenho Amostral e Estratificação Multivariada em 18 Estratos Canônicos (Decisão D12)", styles["H2"]))
    story.append(Paragraph(
        "Amostragens aleatórias simples ou dirigidas por conveniência logística enviesam o aprendizado de máquina em sensoriamento remoto, pois sub-representam "
        "combinações biofísicas raras na paisagem. O SAREL implementa uma partição multivariada determinística em <b>18 estratos biofísicos canônicos</b>, "
        "estruturados pela matriz fatorial <b>Ŝ &times; Ê &times; K̂</b> dentro do domínio de elegibilidade de 3,0% a 20,0%:",
        styles["Body"]
    ))
    story.append(Paragraph("• <b>Declividade do Terreno (Ŝ):</b> 3 tercis empíricos de declividade derivados do Copernicus DEM 30 m (D21) dentro da faixa válida de 3,0% a 20,0% (Tercil Suave: 3,0% a &approx;7%; Tercil Médio: &approx;7% a &approx;13%; Tercil Forte: &approx;13% a 20,0%).", styles["BulletText"]))
    story.append(Paragraph("• <b>Frequência Histórica de Solo Nu (Ê):</b> 3 tercis empíricos da frequência decenal de exposição do solo no intervalo [0, 1], definida como a fração de cenas orbitais válidas com índice NDVI &le; 0,25 da série Sentinel-2 L2A (Decisão D10; calibrado pelo sistema GEOS3/GeoCiS/ESALQ-USP para solos agrícolas tropicais).", styles["BulletText"]))
    story.append(Paragraph("• <b>Erodibilidade Pedológica do Solo (K̂; Decisão D09):</b> 2 níveis numéricos derivados da carta oficial de erodibilidade da Embrapa Solos (Doc. 246/2024; D14): Nível 1 = Baixa/Média erodibilidade (classes 1 a 3 do SiBCS, K &le; 0,0285 Mg h MJ^-1 mm^-1; predomínio de Latossolos) e Nível 2 = Alta/Muito Alta erodibilidade (classes 4 e 5, K &ge; 0,0300 Mg h MJ^-1 mm^-1; predomínio de Nitossolos e Neossolos). Totalizando exatamente 3 &times; 3 &times; 2 = 18 estratos canônicos.", styles["BulletText"]))
    story.append(Paragraph(
        "Para neutralizar a dependência espacial dentro do mesmo estrato, aplica-se o algoritmo de <i>Spatial Thinning</i> geodésico determinístico "
        "(Fisher-Yates com semente fixa P01 e raio mínimo de exclusão euclidiana r &ge; 1,0 km; regra P02), garantindo a dispersão territorial da amostragem.",
        styles["Body"]
    ))
    
    # Quebra limpa para a Página 5: Suporte Espacial, OLS Harmônico e VANT (COM CAIXAS CORRIGIDAS)
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 5: SEÇÃO 3.3 (SUPORTE NATIVO), 3.4 (OLS HARMÔNICO) E 3.5 (VANT E ALVO)
    # =========================================================================
    story.append(Paragraph("3.3 Unidade de Análise e Invariante de Suporte Espacial Nativo Declarado (Decisão D06)", styles["H2"]))
    story.append(Paragraph(
        "A unidade básica de predição e inferência do sistema é a <b>célula de 10 x 10 m do sensor Sentinel-2 MSI Nível-2A</b> em sua grade orbital nativa. "
        "Em estrito cumprimento ao Invariante de Suporte Espacial (D06 e D24), nenhum preditor de resolução mais grossa é artificialmente reamostrado para fingir "
        "suporte centimétrico. O relevo opera no suporte nativo de 30 m do Copernicus DEM (D21), a erodibilidade K opera no suporte do polígono cartográfico oficial da Embrapa Solos (D14), "
        "e a chuva opera na grade regional de 5 km do CHIRPS (D13), eliminando a pseudorreplicação estatística.",
        styles["Body"]
    ))
    story.append(Spacer(1, 1.0 * mm))
    
    story.append(Paragraph("3.4 Sensoriamento Orbital e Decomposição Harmônica Temporal OLS", styles["H2"]))
    story.append(Paragraph(
        "A partir da coleção decenal Sentinel-2 L2A (BOA Harmonized), aplicando a máscara de qualidade SCL para exclusão estrita de nuvens e sombras, "
        "ajusta-se para cada pixel a <b>Decomposição Harmônica Multivariada por Mínimos Quadrados Ordinários (OLS)</b> (ZHU; WOODCOCK, 2014):",
        styles["Body"]
    ))
    
    # CAIXA 1 CORRIGIDA: 1 COLUNA DE 170 mm E 2 LINHAS VERTICAIS (SEM ESTOURO DE MARGEM)
    f1_box = [
        [Paragraph("<b>&rho;^(t) = c<sub>0</sub> + c<sub>1</sub>·t + &sum;<sub>i=1</sub><sup>2</sup> [ a<sub>i</sub>·cos(2&pi;·i·t / T) + b<sub>i</sub>·sin(2&pi;·i·t / T) ]</b>", styles["FormulaBox"])],
        [Paragraph("onde t é o tempo decimal, T = 365,25 dias, c0 é a refletância média histórica, c1 a tendência decenal, e (ai, bi) são coeficientes harmônicos sazonais de 1º e 2º harmônicos.", styles["FormulaNote"])]
    ]
    t_f1 = Table(f1_box, colWidths=[170 * mm])
    t_f1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_BG_PAGE),
        ('BOX', (0,0), (-1,-1), 0.6, C_BORDER),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t_f1)
    story.append(Spacer(1, 1.2 * mm))
    
    story.append(Paragraph("3.5 Sensoriamento Aerotransportado (VANT) e Definição do Alvo Contínuo (Decisões D16 e D26)", styles["H2"]))
    story.append(Paragraph(
        "A campanha aerotransportada opera o VANT de asa fixa <b>Spectral 2 (Nuvem UAV)</b>, equipado com sensor multiespectral de 5 bandas calibradas "
        "(Azul 475 nm, Verde 560 nm, Vermelho 668 nm, RedEdge 717 nm e NIR 840 nm), sensor de irradiância incidente (downwelling light sensor) "
        "e posicionamento geodésico GNSS PPK (L1/L2), com GSD médio medido de 3,8 cm e acurácia posicional CE90 de 1,47 m. "
        "Conforme a Decisão D16 (emendada em 29/09/2026), planejaram-se <b>72 polígonos amostrais de 5,02 ha</b> (4 por estrato de D12). "
        "A adoção de 5,02 ha (quadrado de 224 x 224 m ou retângulo até 1:2) ajusta a amostragem ao padrão fundiário de minifúndios da BP3 (mediana de 11,7 ha), "
        "elevando a elegibilidade dos imóveis de 43,4% para 71,8% e mitigando o viés de recusa de proprietários rurais. "
        "Em cada quarteto de estrato, <b>2 polígonos são sorteados para treino e 2 polígonos são lacrados como teste independente (*held-out*)</b>.",
        styles["Body"]
    ))
    story.append(Paragraph(
        "Sobre o ortomosaico de 4 cm, peritos realizam a vetorização manual das feições ativas de erosão laminar. "
        "A camada vetorial é rasterizada sobre a grade Sentinel-2 de 10 m, definindo o <b>alvo primário contínuo</b> (Decisão D26):",
        styles["Body"]
    ))
    
    # CAIXA 2 CORRIGIDA: 1 COLUNA DE 170 mm E 2 LINHAS VERTICAIS (SEM ESTOURO DE MARGEM)
    f2_box = [
        [Paragraph("<b>y<sub>i</sub> = ( Área Delineada como Erodida no VANT dentro da célula 10x10 m ) / ( 100 m² ) &isin; [0, 1]</b>", styles["FormulaBox"])],
        [Paragraph("Alvo secundário derivado para reporte de métricas clássicas (AUC): célula erodida se y_i &ge; 0,25 (25 m² de erosão ativa na célula de 100 m²).", styles["FormulaNote"])]
    ]
    t_f2 = Table(f2_box, colWidths=[170 * mm])
    t_f2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_MINT_BG),
        ('BOX', (0,0), (-1,-1), 0.8, C_EMERALD_MID),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t_f2)
    
    # Quebra limpa para a Página 6: Linha de Base RUSLE Regionalizada (COM CAIXA CORRIGIDA)
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 6: SEÇÃO 3.6 (A LINHA DE BASE ANALÍTICA RUSLE REGIONALIZADA)
    # =========================================================================
    story.append(Paragraph("3.6 A Linha de Base Analítica RUSLE Parametrizada para o Paraná", styles["H2"]))
    story.append(Paragraph(
        "Como competidor de referência analítico, o SAREL implementa a <b>Equação Universal de Perda de Solo Revisada (RUSLE; RENARD et al., 1997)</b>: "
        "<b>A = R · K · LS · C · P</b> (perda anual estimada em Mg ha^-1 ano^-1), auditada e parametrizada com coeficientes científicos específicos do Paraná:",
        styles["Body"]
    ))
    story.append(Paragraph(
        "• <b>Fator R — Erosividade da Chuva (Decisão D13):</b><br/>"
        "Calculado a partir de totais pluviométricos mensais do CHIRPS v2.0 (proveniência `modelado`, sucedâneo do EI30 com tolerância regional de +-10%), "
        "aplicando-se a equação regional de erosividade do Paraná estabelecida por Rufino, Biscaia e Merten (1993) e atualizada por Waltrick et al. (2010):",
        styles["BulletText"]
    ))
    
    # CAIXA 3 CORRIGIDA: 1 COLUNA DE 170 mm E 2 LINHAS VERTICAIS (SEM ESTOURO DE MARGEM)
    f_r_box = [
        [Paragraph("<b>EI<sub>30, mês</sub> = 67,355 · ( p² / P )<sup>0,8522</sup></b> &nbsp;&nbsp;&nbsp;&rArr;&nbsp;&nbsp;&nbsp; <b>R = &sum;<sub>mês=1</sub><sup>12</sup> EI<sub>30, mês</sub></b>", styles["FormulaBox"])],
        [Paragraph("onde p representa a precipitação média mensal histórica (mm) e P a precipitação média anual histórica (mm) da célula regional.", styles["FormulaNote"])]
    ]
    t_fr = Table(f_r_box, colWidths=[170 * mm])
    t_fr.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_BG_PAGE),
        ('BOX', (0,0), (-1,-1), 0.6, C_BORDER),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t_fr)
    story.append(Spacer(1, 1.2 * mm))
    
    story.append(Paragraph(
        "• <b>Fator K — Erodibilidade Pedológica do Solo (Decisão D14):</b><br/>"
        "Extraído diretamente do campo numérico `k_solos` da camada GeoServer oficial da Embrapa Solos (Doc. 246/2024; proveniência `tabelado`), "
        "que mapeia os solos brasileiros segundo o SiBCS. Na Bacia do Paraná III, os Latossolos Vermelhos apresentam erodibilidade K na faixa de 0,0130 a 0,0170 Mg h MJ^-1 mm^-1, "
        "enquanto os Nitossolos Vermelhos variam entre 0,0240 e 0,0280 Mg h MJ^-1 mm^-1. Por D08, a heurística taxonômica foi aposentada, utilizando-se a proveniência oficial tabelada.",
        styles["BulletText"]
    ))
    story.append(Paragraph(
        "• <b>Fator LS — Relação Comprimento e Grau de Declive Bidimensional (Decisão D15):</b><br/>"
        "Calculado pelo algoritmo bidimensional de área de contribuição específica de <b>Desmet e Govers (1996)</b> sobre o Modelo Digital de Elevação "
        "Copernicus DEM 30 m (D21), projetado em SIRGAS 2000 UTM 22S (EPSG:31982) com distorção cartográfica corrigida. Os expoentes de declividade "
        "adotam as equações padrão da RUSLE (RENARD et al., 1997), com o expoente m dependente da razão entre a erosão em sulco e entresulcos.",
        styles["BulletText"]
    ))
    story.append(Paragraph(
        "• <b>Fator C — Uso e Manejo da Terra (Decisões D01 e D20):</b><br/>"
        "Calculado dinamicamente para cada época a partir do NDVI orbital pela equação tropical calibrada para biomas brasileiros por <b>Durigon et al. (2014)</b>: "
        "<b>C = (1 - NDVI) / 2</b>. Sob o regime de Sistema Plantio Direto (SPD; Decisão D20), o índice é modulado pelo Bare Soil Index (BSI) "
        "segundo C_hibrido = ((1 - NDVI) / 2) · (1 + BSI), restrito ao domínio biofísico fechado [0, 1].",
        styles["BulletText"]
    ))
    story.append(Paragraph(
        "• <b>Fator P — Práticas Conservacionistas de Suporte (Decisão D22):</b><br/>"
        "Fixado na constante 1,0 para a avaliação regional sem cadastro fundiário de terraços (linha de base conservadora; RENARD et al., 1997), "
        "sendo refinado nos pontos com verificação presencial em campo por meio de estratificação por classe de declividade e práticas de manejo registradas no SAREL Coletor.",
        styles["BulletText"]
    ))
    
    # Quebra limpa para a Página 7: XGBoost Tweedie, Teto D24 e Falsificabilidade D25
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 7: SEÇÃO 3.7 (XGBOOST TWEEDIE, TETO DE PREDITORES E FALSIFICABILIDADE)
    # =========================================================================
    story.append(Paragraph("3.7 Modelagem Preditiva XGBoost Tweedie, Teto por Bloco e Falsificabilidade (D24 e D25)", styles["H2"]))
    story.append(Paragraph(
        "<b>Tratamento de Excesso de Zeros:</b> Em vertentes agrícolas manejadas sob conservação, a maioria das células de 10 m não apresenta erosão ativa (massa concentrada em zero). "
        "Para modelar a inflação de zeros sem descartar a variabilidade contínua da fração erodida (y_i &isin; [0, 1]), o SAREL adota o algoritmo XGBoost "
        "com a função de perda da distribuição <b>Tweedie (`reg:tweedie`)</b> (CHEN; GUESTRIN, 2016), que modela conjuntamente a componente de probabilidade de zero "
        "e a cauda contínua gama não-negativa.",
        styles["Body"]
    ))
    story.append(Paragraph(
        "<b>Regime de Dados e Teto de Preditores por Bloco Físico (Decisão D24):</b> O desenho por polígonos de D16 elevou o regime amostral de forma "
        "assimétrica entre os blocos. Considerando o alcance de autocorrelação espacial de 50 m (que deflaciona os micropixels para unidades independentes), "
        "o SAREL estabelece tetos rígidos para impedir o sobreajuste e a pseudorreplicação estatística:",
        styles["Body"]
    ))
    story.append(Paragraph("• <b>Bloco Espectro-Temporal (Sentinel-2):</b> Teto de até <b>8 preditores</b> (~1.845 unidades espacialmente independentes nos 72 polígonos; regime estatístico plenamente adequado).", styles["BulletText"]))
    story.append(Paragraph("• <b>Bloco de Terreno (Copernicus DEM 30 m):</b> Teto de até <b>4 preditores</b> (~396 unidades independentes a 30 m; admitido por necessidade física com restrições de monotonicidade).", styles["BulletText"]))
    story.append(Paragraph("• <b>Bloco de Solo (Embrapa Solos):</b> Teto de exatamente <b>1 preditor</b> (a erodibilidade K oficial `k_solos`; ordem pedológica aposentada por D08).", styles["BulletText"]))
    story.append(Paragraph("• <b>Bloco de Chuva (CHIRPS Regional):</b> Teto de exatamente <b>1 preditor</b> (o fator R de erosividade anual).", styles["BulletText"]))
    story.append(Paragraph("• <b>Teto Total na Matriz Preditora:</b> <b>No máximo 14 variáveis preditoras</b> (8 + 4 + 1 + 1 = 14; Decisão D24), com restrições físicas de monotonicidade positiva (`monotone_constraints`) impostas para declividade, erodibilidade e solo exposto.", styles["BulletText"]))
    story.append(Spacer(1, 1.0 * mm))
    story.append(Paragraph(
        "<b>Prevenção de Vazamento Espacial e Critério Pré-Registrado de Falsificabilidade (D25):</b><br/>"
        "Em conformidade com as diretrizes de reprodutibilidade em machine learning (PINEAU et al., 2021) e combate a vazamento de dados (PLOTON et al., 2020; KAPOOR; NARAYANAN, 2023), "
        "o treinamento adota <i>Spatial Block Cross-Validation</i> agrupada por polígono (<i>GroupKFold</i>). "
        "A avaliação honesta final ocorre <b>exclusivamente uma única vez sobre os 36 polígonos mantidos em *held-out* lacrado</b> (cerca de 936 unidades efetivas independentes; D16). "
        "Em cumprimento ao pré-registro (NOSEK et al., 2018), fixam-se <b>três desfechos epistemológicos formais</b> avaliados sob correlação de postos de Spearman e Bootstrap agrupado (CAMERON; GELBACH; MILLER, 2008):<br/>"
        "1. <b>Corroboração:</b> rho_XGBoost &ge; 0,40 E Delta rho = (rho_XGBoost - rho_RUSLE) &ge; 0,10 com p &lt; 0,05 (ganho substancial comprovado).<br/>"
        "2. <b>Refutação:</b> rho_XGBoost &lt; 0,40 OU limite inferior do IC 95% de Delta rho &le; 0 (modelo não supera o RUSLE ou não discrimina).<br/>"
        "3. <b>Inconclusiva pela Margem:</b> rho_XGBoost &ge; 0,40 e rho_XGBoost &gt; rho_RUSLE, mas Delta rho &lt; 0,10 (utilidade sem superioridade expressiva demonstrada).",
        styles["Body"]
    ))
    
    # Quebra limpa para a Página 8: Tabelas Síntese da Metodologia
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 8: SEÇÃO 4 (TABELAS SÍNTESE DA METODOLOGIA E DESENHO EXPERIMENTAL)
    # =========================================================================
    story.append(Paragraph("4. Tabelas Síntese da Metodologia e Desenho Experimental", styles["H1"]))
    
    tab1_elements = [
        Paragraph("<b>Tabela 1.</b> Matriz de Estratificação Biofísica Amostral da Bacia do Paraná III (18 Estratos Canônicos — Decisões D07, D09, D12, D16)", styles["BodyBold"]),
        Spacer(1, 0.8 * mm)
    ]
    estratos_data = [
        [
            Paragraph("<b>Estratos ID (D12)</b>", styles["TableHeader"]),
            Paragraph("<b>Declividade (&circ;S; D07)</b>", styles["TableHeader"]),
            Paragraph("<b>Freq. Solo Nu (&circ;E; D10)</b>", styles["TableHeader"]),
            Paragraph("<b>Erodibilidade K (&circ;K; D09)</b>", styles["TableHeader"]),
            Paragraph("<b>Alocação VANT (D16)</b>", styles["TableHeader"])
        ],
        [
            Paragraph("<b>E_1_1_1 &amp; E_1_1_2</b>", styles["TableCellBold"]),
            Paragraph("Tercil Suave (3,0% a &approx;7%)", styles["TableCell"]),
            Paragraph("Tercil 1: Baixa Exposição", styles["TableCell"]),
            Paragraph("Nível 1 (K &le; 0,0285) / Nível 2 (K &ge; 0,0300)", styles["TableCell"]),
            Paragraph("4 polígonos / estrato (2 treino + 2 teste)", styles["TableCell"])
        ],
        [
            Paragraph("<b>E_1_2_1 &amp; E_1_2_2</b>", styles["TableCellBold"]),
            Paragraph("Tercil Suave (3,0% a &approx;7%)", styles["TableCell"]),
            Paragraph("Tercil 2: Média Exposição", styles["TableCell"]),
            Paragraph("Nível 1 (K &le; 0,0285) / Nível 2 (K &ge; 0,0300)", styles["TableCell"]),
            Paragraph("4 polígonos / estrato (2 treino + 2 teste)", styles["TableCell"])
        ],
        [
            Paragraph("<b>E_1_3_1 &amp; E_1_3_2</b>", styles["TableCellBold"]),
            Paragraph("Tercil Suave (3,0% a &approx;7%)", styles["TableCell"]),
            Paragraph("Tercil 3: Alta Exposição", styles["TableCell"]),
            Paragraph("Nível 1 (K &le; 0,0285) / Nível 2 (K &ge; 0,0300)", styles["TableCell"]),
            Paragraph("4 polígonos / estrato (2 treino + 2 teste)", styles["TableCell"])
        ],
        [
            Paragraph("<b>E_2_1_1 &amp; E_2_1_2</b>", styles["TableCellBold"]),
            Paragraph("Tercil Médio (&approx;7% a &approx;13%)", styles["TableCell"]),
            Paragraph("Tercil 1: Baixa Exposição", styles["TableCell"]),
            Paragraph("Nível 1 (K &le; 0,0285) / Nível 2 (K &ge; 0,0300)", styles["TableCell"]),
            Paragraph("4 polígonos / estrato (2 treino + 2 teste)", styles["TableCell"])
        ],
        [
            Paragraph("<b>E_2_2_1 &amp; E_2_2_2</b>", styles["TableCellBold"]),
            Paragraph("Tercil Médio (&approx;7% a &approx;13%)", styles["TableCell"]),
            Paragraph("Tercil 2: Média Exposição", styles["TableCell"]),
            Paragraph("Nível 1 (K &le; 0,0285) / Nível 2 (K &ge; 0,0300)", styles["TableCell"]),
            Paragraph("4 polígonos / estrato (2 treino + 2 teste)", styles["TableCell"])
        ],
        [
            Paragraph("<b>E_2_3_1 &amp; E_2_3_2</b>", styles["TableCellBold"]),
            Paragraph("Tercil Médio (&approx;7% a &approx;13%)", styles["TableCell"]),
            Paragraph("Tercil 3: Alta Exposição", styles["TableCell"]),
            Paragraph("Nível 1 (K &le; 0,0285) / Nível 2 (K &ge; 0,0300)", styles["TableCell"]),
            Paragraph("4 polígonos / estrato (2 treino + 2 teste)", styles["TableCell"])
        ],
        [
            Paragraph("<b>E_3_1_1 &amp; E_3_1_2</b>", styles["TableCellBold"]),
            Paragraph("Tercil Forte (&approx;13% a 20,0%)", styles["TableCell"]),
            Paragraph("Tercil 1: Baixa Exposição", styles["TableCell"]),
            Paragraph("Nível 1 (K &le; 0,0285) / Nível 2 (K &ge; 0,0300)", styles["TableCell"]),
            Paragraph("4 polígonos / estrato (2 treino + 2 teste)", styles["TableCell"])
        ],
        [
            Paragraph("<b>E_3_2_1 &amp; E_3_2_2</b>", styles["TableCellBold"]),
            Paragraph("Tercil Forte (&approx;13% a 20,0%)", styles["TableCell"]),
            Paragraph("Tercil 2: Média Exposição", styles["TableCell"]),
            Paragraph("Nível 1 (K &le; 0,0285) / Nível 2 (K &ge; 0,0300)", styles["TableCell"]),
            Paragraph("4 polígonos / estrato (2 treino + 2 teste)", styles["TableCell"])
        ],
        [
            Paragraph("<b>E_3_3_1 &amp; E_3_3_2</b>", styles["TableCellBold"]),
            Paragraph("Tercil Forte (&approx;13% a 20,0%)", styles["TableCell"]),
            Paragraph("Tercil 3: Alta Exposição", styles["TableCell"]),
            Paragraph("Nível 1 (K &le; 0,0285) / Nível 2 (K &ge; 0,0300)", styles["TableCell"]),
            Paragraph("4 polígonos / estrato (2 treino + 2 teste)", styles["TableCell"])
        ],
    ]
    t_est = Table(estratos_data, colWidths=[24 * mm, 38 * mm, 32 * mm, 42 * mm, 34 * mm])
    t_est.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_NAVY_DARK),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [C_WHITE, C_BG_PAGE]),
        ('PADDING', (0,0), (-1,-1), 1.6),
    ]))
    tab1_elements.append(t_est)
    story.append(KeepTogether(tab1_elements))
    story.append(Spacer(1, 1.2 * mm))
    
    tab2_elements = [
        Paragraph("<b>Tabela 2.</b> Especificação do Vetor de Preditores, Resolução Nativa e Proveniência (Decisões D06, D21, D24)", styles["BodyBold"]),
        Spacer(1, 0.8 * mm)
    ]
    pred_data = [
        [
            Paragraph("<b>Bloco Temático</b>", styles["TableHeader"]),
            Paragraph("<b>Variáveis Preditoras / Features (Teto D24)</b>", styles["TableHeader"]),
            Paragraph("<b>Fonte Primária</b>", styles["TableHeader"]),
            Paragraph("<b>Suporte Nativo</b>", styles["TableHeader"]),
            Paragraph("<b>Selo Proveniência</b>", styles["TableHeader"])
        ],
        [
            Paragraph("<b>Espectro-Temporal</b><br/>(Máx. 8 variáveis)", styles["TableCellBold"]),
            Paragraph("Bandas B2, B3, B4, B8, B11, B12; NDVI, BSI; Coeficientes harmônicos OLS (c0, c1, a1, b1); Frequência de solo nu (E_hat).", styles["TableCell"]),
            Paragraph("Sentinel-2 MSI L2A (BOA)", styles["TableCell"]),
            Paragraph("10 m e 20 m", styles["TableCell"]),
            Paragraph("[P-1] Medido", styles["TableCell"])
        ],
        [
            Paragraph("<b>Morfometria Relevo</b><br/>(Máx. 4 variáveis)", styles["TableCellBold"]),
            Paragraph("Declividade (3,0% a 20,0%), Orientação (Aspect), Curvatura de Perfil e Plano, Fator LS bidimensional.", styles["TableCell"]),
            Paragraph("Copernicus DEM GLO-30 (D21)", styles["TableCell"]),
            Paragraph("30 m nativo", styles["TableCell"]),
            Paragraph("[P-2] Modelado", styles["TableCell"])
        ],
        [
            Paragraph("<b>Pedologia / Solo</b><br/>(Exatamente 1 variável)", styles["TableCellBold"]),
            Paragraph("Erodibilidade K oficial (`k_solos` da carta Embrapa Solos Doc. 246/2024; D14; ordem pedológica aposentada por D08).", styles["TableCell"]),
            Paragraph("Embrapa Solos (Doc. 246/2024)", styles["TableCell"]),
            Paragraph("Polígono Cartográfico", styles["TableCell"]),
            Paragraph("[P-3] Tabelado", styles["TableCell"])
        ],
        [
            Paragraph("<b>Climatologia / Chuva</b><br/>(Exatamente 1 variável)", styles["TableCellBold"]),
            Paragraph("Fator R de erosividade anual da chuva (equação regional Rufino et al. / Waltrick et al. sobre CHIRPS mensal; D13).", styles["TableCell"]),
            Paragraph("CHIRPS v2.0 + IAT-PR", styles["TableCell"]),
            Paragraph("Grade Regional ~5 km", styles["TableCell"]),
            Paragraph("[P-2] Modelado", styles["TableCell"])
        ],
        [
            Paragraph("<b>Alvo Supervisionado</b><br/>(Verdade de Campo / VANT)", styles["TableCellBold"]),
            Paragraph("Fração contínua da área da célula de 10 m erodida (y_i &isin; [0, 1]) por vetorização pericial de ortomosaico. Binário derivado: y_i &ge; 0,25.", styles["TableCell"]),
            Paragraph("VANT Spectral 2 (Nuvem UAV)", styles["TableCell"]),
            Paragraph("GSD ~3,8 cm (CE90 1,47 m)", styles["TableCell"]),
            Paragraph("[P-1] Medido (Campo/Voo)", styles["TableCell"])
        ]
    ]
    t_pred = Table(pred_data, colWidths=[28 * mm, 58 * mm, 38 * mm, 23 * mm, 23 * mm])
    t_pred.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_NAVY_DARK),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [C_WHITE, C_BG_PAGE]),
        ('PADDING', (0,0), (-1,-1), 1.6),
    ]))
    tab2_elements.append(t_pred)
    story.append(KeepTogether(tab2_elements))
    
    # Quebra limpa para a Página 9: Glossário Normativo Parte I (Decisões D01 a D14)
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 9: SEÇÃO 5 (GLOSSÁRIO NORMATIVO DE DECISÕES — D01 A D14)
    # =========================================================================
    story.append(Paragraph("5. Glossário Normativo de Decisões Metodológicas e Regras do Sistema SAREL v2.0", styles["H1"]))
    story.append(Paragraph(
        "Este glossário sintetiza o registro canônico das <b>26 Decisões Metodológicas (D01 a D26)</b>, dos <b>5 Parâmetros Operacionais (P01 a P05)</b> "
        "e dos <b>Invariantes da Lei Fundamental</b> implementados no código-fonte do SAREL, assegurando rastreabilidade irrestrita entre a teoria e o software.",
        styles["Body"]
    ))
    story.append(Spacer(1, 0.8 * mm))
    
    story.append(Paragraph("<b>Tabela 3A.</b> Glossário das Decisões Metodológicas e Arquiteturais (D01 a D14 — Decisões Pré-Registradas)", styles["BodyBold"]))
    story.append(Spacer(1, 0.6 * mm))
    
    decisoes_d01_d14 = [
        [Paragraph("<b>Código</b>", styles["TableHeader"]), Paragraph("<b>Título &amp; Parâmetro</b>", styles["TableHeader"]), Paragraph("<b>Resumo Normativo e Função Metodológica no SAREL</b>", styles["TableHeader"])],
        [Paragraph("<b>D01</b>", styles["GlossaryCode"]), Paragraph("Fator C Tropical", styles["TableCellBold"]), Paragraph("C = (1 - NDVI) / 2 (Durigon et al., 2014) mapeado dinamicamente a partir do NDVI da série Sentinel-2 L2A.", styles["TableCell"])],
        [Paragraph("<b>D02</b>", styles["GlossaryCode"]), Paragraph("Triagem de Candidatos", styles["TableCellBold"]), Paragraph("Critérios observacionais de presente/ausente e negativo explícito para triagem visual; não constitui rótulo de treino.", styles["TableCell"])],
        [Paragraph("<b>D03</b>", styles["GlossaryCode"]), Paragraph("Escala do Rótulo de Campo", styles["TableCellBold"]), Paragraph("Coleta ordinal com binarização declarada para compatibilidade de anotação presencial.", styles["TableCell"])],
        [Paragraph("<b>D04</b>", styles["GlossaryCode"]), Paragraph("Modelos D e P", styles["TableCellBold"]), Paragraph("Distinção formal entre Modelo D (detecção pós-evento) e Modelo P (predição prospectiva de suscetibilidade).", styles["TableCell"])],
        [Paragraph("<b>D05</b>", styles["GlossaryCode"]), Paragraph("Série Sentinel-2", styles["TableCellBold"]), Paragraph("Treino exclusivo em Sentinel-2 (2016-2026); Landsat reservado exclusivamente a contexto histórico de longo prazo.", styles["TableCell"])],
        [Paragraph("<b>D06</b>", styles["GlossaryCode"]), Paragraph("Suporte Espacial Nativo", styles["TableCellBold"]), Paragraph("Unidade de análise fixada na célula de 10 m do Sentinel-2; proibição de reamostragem espúria de insumos mais grossos.", styles["TableCell"])],
        [Paragraph("<b>D07</b>", styles["GlossaryCode"]), Paragraph("Domínio de Validade Físico", styles["TableCellBold"]), Paragraph("Declividade estritamente entre 3,0% e 20,0% (SiBCS); WorldCover classes 30 e 40 com concordância entre v100 e v200.", styles["TableCell"])],
        [Paragraph("<b>D08</b>", styles["GlossaryCode"]), Paragraph("Associações de Solo", styles["TableCellBold"]), Paragraph("Ambiguidade de K em unidades de associação resolvida na fonte oficial (Embrapa Solos 2024); heurística taxonômica aposentada.", styles["TableCell"])],
        [Paragraph("<b>D09</b>", styles["GlossaryCode"]), Paragraph("Corte Ordinal de K̂", styles["TableCellBold"]), Paragraph("Partição em 2 níveis de K̂: Nível 1 (K <= 0,0285) e Nível 2 (K >= 0,0300 Mg h MJ^-1 mm^-1).", styles["TableCell"])],
        [Paragraph("<b>D10</b>", styles["GlossaryCode"]), Paragraph("Limiar de Solo Exposto", styles["TableCellBold"]), Paragraph("NDVI <= 0,25 para classificação de solo nu em solos agrícolas tropicais (calibração GEOS3/ESALQ-USP).", styles["TableCell"])],
        [Paragraph("<b>D11</b>", styles["GlossaryCode"]), Paragraph("Cobertura Temporal Mínima", styles["TableCellBold"]), Paragraph("Número mínimo de observações orbitais válidas para validação de métricas de série temporal decenal.", styles["TableCell"])],
        [Paragraph("<b>D12</b>", styles["GlossaryCode"]), Paragraph("Estratificação Multivariada", styles["TableCellBold"]), Paragraph("18 estratos canônicos pelo produto fatorial Ŝ (3 tercis) x Ê (3 tercis) x K̂ (2 níveis), com Spatial Thinning r >= 1,0 km.", styles["TableCell"])],
        [Paragraph("<b>D13</b>", styles["GlossaryCode"]), Paragraph("Fator R Regionalizado", styles["TableCellBold"]), Paragraph("Equação regional do Paraná por Rufino et al. (1993) e Waltrick et al. (2010) sobre totais mensais CHIRPS v2.0.", styles["TableCell"])],
        [Paragraph("<b>D14</b>", styles["GlossaryCode"]), Paragraph("Fator K Numérico", styles["TableCellBold"]), Paragraph("Extraído diretamente do campo numérico k_solos da carta oficial da Embrapa Solos (Doc. 246/2024; proveniência tabelado).", styles["TableCell"])],
    ]
    t_d1 = Table(decisoes_d01_d14, colWidths=[16 * mm, 42 * mm, 112 * mm])
    t_d1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_NAVY_DARK),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [C_WHITE, C_BG_PAGE]),
        ('PADDING', (0,0), (-1,-1), 1.8),
    ]))
    story.append(t_d1)
    
    # Quebra limpa para a Página 10: Glossário Normativo Parte II (Decisões D15 a D26)
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 10: SEÇÃO 5 (GLOSSÁRIO NORMATIVO DE DECISÕES — D15 A D26)
    # =========================================================================
    story.append(Paragraph("<b>Tabela 3B.</b> Glossário das Decisões Metodológicas e Arquiteturais (D15 a D26 — Modelagem e Validação)", styles["BodyBold"]))
    story.append(Spacer(1, 0.6 * mm))
    
    decisoes_d15_d26 = [
        [Paragraph("<b>Código</b>", styles["TableHeader"]), Paragraph("<b>Título &amp; Parâmetro</b>", styles["TableHeader"]), Paragraph("<b>Resumo Normativo e Função Metodológica no SAREL</b>", styles["TableHeader"])],
        [Paragraph("<b>D15</b>", styles["GlossaryCode"]), Paragraph("Fator LS Bidimensional", styles["TableCellBold"]), Paragraph("Algoritmo de fluxo acumulado de Desmet & Govers (1996) sobre Copernicus DEM 30 m em SIRGAS 2000 UTM 22S.", styles["TableCell"])],
        [Paragraph("<b>D16</b>", styles["GlossaryCode"]), Paragraph("Desenho Amostral VANT", styles["TableCellBold"]), Paragraph("72 polígonos de 5,02 ha (4 por estrato: 2 treino + 2 held-out lacrado de teste independente; total 361 ha; 36 mantidos em teste).", styles["TableCell"])],
        [Paragraph("<b>D17</b>", styles["GlossaryCode"]), Paragraph("Alocação Cota PlanetScope", styles["TableCellBold"]), Paragraph("Gestão racional de quotas PlanetScope entre download de mosaicos de evento e visualização de tiles.", styles["TableCell"])],
        [Paragraph("<b>D18</b>", styles["GlossaryCode"]), Paragraph("Buffer PlanetScope", styles["TableCellBold"]), Paragraph("Área de amortecimento padronizada ao redor dos sítios amostrais para contextualização de vizinhança.", styles["TableCell"])],
        [Paragraph("<b>D19</b>", styles["GlossaryCode"]), Paragraph("Pares de Evento de Chuva", styles["TableCellBold"]), Paragraph("Reescrita do evento de chuva extrema em escala de polígono para análise secundária de gatilhos hidrológicos.", styles["TableCell"])],
        [Paragraph("<b>D20</b>", styles["GlossaryCode"]), Paragraph("Fator C Híbrido SPD", styles["TableCellBold"]), Paragraph("Equação de Durigon et al. (2014) modulada pelo BSI sob Sistema Plantio Direto: C = ((1 - NDVI)/2) * (1 + BSI).", styles["TableCell"])],
        [Paragraph("<b>D21</b>", styles["GlossaryCode"]), Paragraph("Modelo Digital Elevação", styles["TableCellBold"]), Paragraph("Copernicus DEM GLO-30 (ESA) na resolução nativa de 30 m em projeção métrica conforme SIRGAS 2000 UTM 22S.", styles["TableCell"])],
        [Paragraph("<b>D22</b>", styles["GlossaryCode"]), Paragraph("Fator P Estratificado", styles["TableCellBold"]), Paragraph("Fator P fixado em 1,0 na escala de bacia; refinado por observação de práticas conservacionistas estratificadas por declividade em campo.", styles["TableCell"])],
        [Paragraph("<b>D23</b>", styles["GlossaryCode"]), Paragraph("Regime Amostral com π_i", styles["TableCellBold"]), Paragraph("Estratificação desproporcional com probabilidade de inclusão π_i registrada para viabilizar inferência de Olofsson et al. (2014).", styles["TableCell"])],
        [Paragraph("<b>D24</b>", styles["GlossaryCode"]), Paragraph("Teto de Preditores Bloco", styles["TableCellBold"]), Paragraph("Teto máximo de 14 preditores na matriz: Espectro <= 8, Terreno <= 4, Solo = 1, Chuva = 1; restrições de monotonicidade física.", styles["TableCell"])],
        [Paragraph("<b>D25</b>", styles["GlossaryCode"]), Paragraph("Critério de Refutação", styles["TableCellBold"]), Paragraph("Avaliação exclusiva nos 36 polígonos held-out lacrados; Spearman rho >= 0,40, Delta rho >= 0,10 (p < 0,05); 3 desfechos formais.", styles["TableCell"])],
        [Paragraph("<b>D26</b>", styles["GlossaryCode"]), Paragraph("Alvo Contínuo Tweedie", styles["TableCellBold"]), Paragraph("Alvo primário y_i in [0, 1] (fração de célula erodida) ajustada por reg:tweedie; alvo secundário binário derivado a 25%.", styles["TableCell"])],
    ]
    t_d2 = Table(decisoes_d15_d26, colWidths=[16 * mm, 42 * mm, 112 * mm])
    t_d2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_NAVY_DARK),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [C_WHITE, C_BG_PAGE]),
        ('PADDING', (0,0), (-1,-1), 1.8),
    ]))
    story.append(t_d2)
    
    # Quebra limpa para a Página 11: Parâmetros Operacionais e Regras da Lei Fundamental
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 11: SEÇÃO 5 (PARÂMETROS P01-P05 E REGRAS DA LEI FUNDAMENTAL)
    # =========================================================================
    story.append(Paragraph("<b>Tabela 4.</b> Parâmetros Operacionais (P01 a P05), Invariantes e Regras da Lei Fundamental do SAREL", styles["BodyBold"]))
    story.append(Spacer(1, 0.8 * mm))
    
    regras_dados = [
        [Paragraph("<b>Código</b>", styles["TableHeader"]), Paragraph("<b>Nome do Mecanismo</b>", styles["TableHeader"]), Paragraph("<b>Definição Técnica e Salvaguarda Metodológica no Sistema</b>", styles["TableHeader"])],
        [Paragraph("<b>P01</b>", styles["GlossaryCode"]), Paragraph("Bloco de CV Espacial", styles["TableCellBold"]), Paragraph("Aresta da dobra espacial derivada do alcance prático do variograma (a ≈ 50 m; Roberts et al., 2017) ou 20 km regional.", styles["TableCell"])],
        [Paragraph("<b>P02</b>", styles["GlossaryCode"]), Paragraph("Raio de Spatial Thinning", styles["TableCellBold"]), Paragraph("Distância euclidiana geodésica mínima de 1.000 m (1,0 km) entre candidatos do mesmo estrato para neutralizar clustering.", styles["TableCell"])],
        [Paragraph("<b>P03</b>", styles["GlossaryCode"]), Paragraph("Casamento Geodésico", styles["TableCellBold"]), Paragraph("Teto de erro grosseiro de 30 m entre coordenada visitada e ponto planejado; raio de tolerância do GNSS.", styles["TableCell"])],
        [Paragraph("<b>P04</b>", styles["GlossaryCode"]), Paragraph("Buffers de Exclusão", styles["TableCellBold"]), Paragraph("Buffer hídrico de 30 m (JRC Water), buffer urbano de 150 m e exclusão de corpos com ocorrência hídrica > 10%.", styles["TableCell"])],
        [Paragraph("<b>P05</b>", styles["GlossaryCode"]), Paragraph("Classes WorldCover", styles["TableCellBold"]), Paragraph("Classes elegíveis restritas a [30, 40] (pastagem cultivada e lavoura); classe 60 excluída por D07.", styles["TableCell"])],
        [Paragraph("<b>Regra 1</b>", styles["GlossaryCode"]), Paragraph("Sem Valores Fabricados", styles["TableCellBold"]), Paragraph("Variáveis sem resposta da fonte oficial recebem estritamente `indisponivel` com causa; proibição de números mágicos.", styles["TableCell"])],
        [Paragraph("<b>Regra 2</b>", styles["GlossaryCode"]), Paragraph("Sem Cortes Silenciosos", styles["TableCellBold"]), Paragraph("Proibição de pisos ou limites artificiais (`Math.max`/`min`) que mascarem valores fora do domínio físico ou biofísico.", styles["TableCell"])],
        [Paragraph("<b>Regra 3</b>", styles["GlossaryCode"]), Paragraph("Rastreabilidade", styles["TableCellBold"]), Paragraph("Toda grandeza científica é encapsulada em tipo discriminado `Proveniencia<T>` (`medido`, `modelado`, `tabelado`, `indisponivel`).", styles["TableCell"])],
        [Paragraph("<b>Regra 4</b>", styles["GlossaryCode"]), Paragraph("Nada Calculado Vira Rótulo", styles["TableCellBold"]), Paragraph("Modelos matemáticos jamais viram gabarito de treino; o rótulo de erosão provém unicamente da observação pericial primária.", styles["TableCell"])],
        [Paragraph("<b>Regra 5</b>", styles["GlossaryCode"]), Paragraph("Guarda Antissintético", styles["TableCellBold"]), Paragraph("Validação contínua e recursiva de que nenhum ponto amostral possua a flag `origemSintetica: true`.", styles["TableCell"])],
        [Paragraph("<b>Regra 6</b>", styles["GlossaryCode"]), Paragraph("Segregação Cega", styles["TableCellBold"]), Paragraph("Coordenadas geográficas não entram na matriz de treino tabular, impedindo o modelo de memorizar localização geográfica.", styles["TableCell"])],
        [Paragraph("<b>Regra 7</b>", styles["GlossaryCode"]), Paragraph("Preservação de Máscaras", styles["TableCellBold"]), Paragraph("Nuvens, sombras e dados inválidos de satélite são preservados como máscaras reais e descontinuidades temporais.", styles["TableCell"])],
        [Paragraph("<b>Invariante 1</b>", styles["GlossaryCode"]), Paragraph("Coerência RUSLE", styles["TableCellBold"]), Paragraph("perdaSolo <=> 5 fatores presentes (R, K, LS, C, P) <=> memória de cálculo completa e auditável.", styles["TableCell"])],
        [Paragraph("<b>Invariante 2</b>", styles["GlossaryCode"]), Paragraph("Lista de Permissão Cega", styles["TableCellBold"]), Paragraph("Bloqueia vazamento de variáveis internas de amostragem (como Phi_diag ou semente) para a matriz de predição.", styles["TableCell"])],
    ]
    t_reg = Table(regras_dados, colWidths=[18 * mm, 42 * mm, 110 * mm])
    t_reg.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_NAVY_DARK),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [C_WHITE, C_BG_PAGE]),
        ('PADDING', (0,0), (-1,-1), 1.8),
    ]))
    story.append(t_reg)
    
    # Quebra limpa para a Página 12: Referências Bibliográficas ABNT
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 12: SEÇÃO 6 (REFERÊNCIAS BIBLIOGRÁFICAS — NORMA ABNT NBR 6023)
    # =========================================================================
    story.append(Paragraph("6. Referências Bibliográficas (Norma ABNT NBR 6023)", styles["H1"]))
    story.append(Paragraph(
        "<i>Todas as obras fundamentais abaixo estão arquivadas fisicamente na base bibliográfica local do repositório "
        "(diretórios `docs/Selecao Bibliografica/Pesquisas Machine Learning/`, `docs/Selecao Bibliografica/Para Revisar/` e `docs/verificacoes/fontes/`).</i>",
        styles["Body"]
    ))
    story.append(Spacer(1, 1.5 * mm))
    
    refs = [
        "ALTMAN, D. G.; ROYSTON, P. The cost of dichotomising continuous variables. <b>BMJ</b>, London, v. 332, n. 7549, p. 1080, 2006. DOI: 10.1136/bmj.332.7549.1080. [Arquivo local: `1080.1.full.pdf`]",
        "ALVAREZ-VANHARD, E. et al. UAV & satellite synergies for optical remote sensing applications: a literature review. <b>Science of Remote Sensing</b>, Amsterdam, v. 3, 100019, 2021. DOI: 10.1016/j.srs.2021.100019. [Arquivo local: `UAV--amp--satellite-synergies...pdf`]",
        "BAZZI, C. L. et al. Spatial variability of soil loss factors in western Paraná: precision conservation agriculture perspectives. <b>Engenharia Agrícola</b>, Jaboticabal, v. 42, n. spe, e20210189, 2022. DOI: 10.1590/1809-4430-Eng.Agric.v42nepe20210189/2022.",
        "CAMERON, A. C.; GELBACH, J. B.; MILLER, D. L. Bootstrap-based improvements for inference with clustered errors. <b>The Review of Economics and Statistics</b>, Cambridge, v. 90, n. 3, p. 414-427, 2008. DOI: 10.1162/rest.90.3.414.",
        "CHEN, T.; GUESTRIN, C. XGBoost: A scalable tree boosting system. In: ACM SIGKDD INTERNATIONAL CONFERENCE ON KNOWLEDGE DISCOVERY AND DATA MINING, 22., 2016, San Francisco. <b>Proceedings...</b> New York: ACM, 2016. p. 785-794. DOI: 10.1145/2939672.2939785. [Arquivo local: `1603.02754v3.pdf`]",
        "DESMET, P. J. J.; GOVERS, G. A GIS procedure for automatically calculating the USLE LS factor on topographically complex landscape units. <b>Journal of Soil and Water Conservation</b>, Ankeny, v. 51, n. 5, p. 427-433, 1996. [Arquivo local: `desmet_govers_1996_jswc.pdf`]",
        "DURIGON, C. A.; CARVALHO JÚNIOR, O. A. de; ANTUNES, M. A. H.; OLIVEIRA, S. N. de; MARTINS, E. S. Índices de vegetação derivados do sensor MODIS para o cálculo do fator C da Equação Universal de Perdas de Solo em biomas brasileiros. <b>Revista Brasileira de Ciência do Solo</b>, Viçosa, v. 38, n. 6, p. 1814-1824, 2014. DOI: 10.1590/S0100-06832014000600016.",
        "EMBRAPA SOLOS. <b>Sistema brasileiro de classificação de solos</b>. 5. ed. Brasília, DF: Embrapa, 2018. 356 p. [SiBCS Oficial: Classes de Relevo Suave-Ondulado e Ondulado].",
        "EMBRAPA SOLOS. <b>Fatores de erodibilidade (Fator K) para solos brasileiros segundo o Sistema Brasileiro de Classificação de Solos (SiBCS)</b>. Rio de Janeiro: Embrapa Solos, 2024. 42 p. (Documentos / Embrapa Solos, 246). [Arquivo local: `CNPS-DOC-246-2024.pdf`]",
        "KAPOOR, S.; NARAYANAN, A. Leakage and the reproducibility crisis in machine-learning-based science. <b>Patterns (Cell Press)</b>, Cambridge, v. 4, n. 9, 100804, 2023. DOI: 10.1016/j.patter.2023.100804. [Arquivo local: `mmc2.pdf`]",
        "KRUG, E. T. S. <b>Estimativa de perda de solo por erosão laminar em função de suas características e diferentes níveis de precipitação</b>. 2024. 88 f. Dissertação (Mestrado em Tecnologias Computacionais para o Agronegócio) — Universidade Tecnológica Federal do Paraná, Câmpus Medianeira, 2024. (Orientador: Prof. Dr. Claudio Leones Bazzi). [Arquivo local: `estimativaerosaolaminar.pdf`]",
        "LUCAS, T. D. M. <b>Estimativa da perda de solo na Bacia Hidrográfica do Paraná III: influência de diferentes cenários de conservação do solo</b>. 2024. 94 f. Dissertação (Mestrado em Tecnologias Computacionais para o Agronegócio) — Universidade Tecnológica Federal do Paraná, Câmpus Medianeira, 2024. (Orientadora: Profa. Dra. Giovana Clarice Poggere). [Arquivo local: `perdasolobaciahidrografica.pdf`]",
        "NOSEK, B. A.; EBERSOLE, C. R.; DEHAVEN, A. C.; MELLOR, D. T. The preregistration revolution. <b>Proceedings of the National Academy of Sciences (PNAS)</b>, Washington, v. 115, n. 11, p. 2600-2606, 2018. DOI: 10.1073/pnas.1708274114. [Arquivo local: `nosek-et-al-2018...pdf`]",
        "PINEAU, J. et al. Improving reproducibility in machine learning research (A report from the NeurIPS 2019 reproducibility program). <b>Journal of Machine Learning Research (JMLR)</b>, Cambridge, v. 22, n. 164, p. 1-20, 2021. [Arquivo local: `20-303.pdf`]",
        "PLOTON, P. et al. Spatial validation reveals poor predictive performance of large-scale ecological mapping models. <b>Nature Communications</b>, London, v. 11, n. 1, 4540, 2020. DOI: 10.1038/s41467-020-18321-y. [Arquivo local: `s41467-020-18321-y.pdf`]",
        "RENARD, K. G.; FOSTER, G. R.; WEESIES, G. A.; MCCOOL, D. K.; YODER, D. C. <b>Predicting soil erosion by water: a guide to conservation planning with the Revised Universal Soil Loss Equation (RUSLE)</b>. Washington: USDA, 1997. 384 p. (Agriculture Handbook, 703). [Arquivo local: `ah_703.pdf`]",
        "ROBERTS, D. R. et al. Cross-validation strategies for data with temporal, spatial or phylogenetic structure. <b>Ecography</b>, Copenhagen, v. 40, n. 8, p. 913-929, 2017. DOI: 10.1111/ecog.02881. [Arquivo local: `Ecography - 2016 - Roberts...pdf`]",
        "RUFINO, R. L.; BISCAIA, R. C. M.; MERTEN, G. H. Determinação do potencial erosivo da chuva para o estado do Paraná, através de pluviometria: terceira aproximação. <b>Revista Brasileira de Ciência do Solo</b>, Campinas, v. 17, n. 3, p. 439-444, 1993. [Arquivo local: `rufino_biscaia_merten_1993...pdf`]",
        "WALTRICK, P. C.; ROCHA, M. C.; MERTEN, G. H.; CUNHA, C. A. da. Estimativa da erosividade das chuvas no Estado do Paraná a partir de séries sintéticas e dados de satélite. <b>Revista Brasileira de Recursos Hídricos</b>, Porto Alegre, v. 15, n. 3, p. 115-125, 2010. [Arquivo local: `2010_04_20_waltrick.pdf`]",
        "WISCHMEIER, W. H.; SMITH, D. D. <b>Predicting rainfall erosion losses: a guide to conservation planning</b>. Washington: USDA, 1978. 58 p. (Agriculture Handbook, 537).",
        "WOODCOCK, C. E.; STRAHLER, A. H. The factor of scale in remote sensing. <b>Remote Sensing of Environment</b>, New York, v. 21, n. 3, p. 311-332, 1987. DOI: 10.1016/0034-4257(87)90015-0. [Arquivo local: `The_factor_of_scale_in_remote_sensing.pdf`]",
        "ZHU, Z.; WOODCOCK, C. E. Continuous change detection and classification of land cover using all available Landsat data. <b>Remote Sensing of Environment</b>, New York, v. 144, p. 152-171, 2014. DOI: 10.1016/j.rse.2014.01.011."
    ]
    
    for r in refs:
        story.append(Paragraph(r, styles["ReferenceItem"]))
        
    doc.build(story, canvasmaker=SarelMasterCanvas)
    print(f"PDF Integrado com Glossário compilado com sucesso: {target_path} ({os.path.getsize(target_path)} bytes)")

if __name__ == "__main__":
    build_pdf()
