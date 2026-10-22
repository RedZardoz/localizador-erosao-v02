#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Geração do Documento 1:
Defesa Metodológica: Replicabilidade em IA e Controle de Viés de Sensores em VANT.
Projeto SAREL - Mestrado PPGTCA / UTFPR Medianeira
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
    PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

# =============================================================================
# CORES INSTITUCIONAIS SAREL v2.0
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
# CANVAS PERSONALIZADO COM NUMERAÇÃO E MARGENS ACADÊMICAS ESTITAS
# =============================================================================
class SarelNumberedCanvas(canvas.Canvas):
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
            
            # Cabeçalho Superior (respeitando margem de 20 mm)
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(C_EMERALD_DARK)
            self.drawString(20 * mm, page_h - 11 * mm, "PPGTCA / UTFPR — TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO")
            self.setFont("Helvetica", 7.5)
            self.setFillColor(C_SLATE_MUTED)
            self.drawRightString(page_w - 20 * mm, page_h - 11 * mm, "DEFESA METODOLÓGICA: IA E SENSORES VANT")
            
            # Linha divisória superior (a 14 mm do topo; texto começa em 22 mm -> 8 mm livres)
            self.setStrokeColor(C_BORDER_LIGHT)
            self.setLineWidth(0.6)
            self.line(20 * mm, page_h - 14 * mm, page_w - 20 * mm, page_h - 14 * mm)
            
            # Linha divisória inferior (a 15 mm da base; texto termina em 20 mm -> 5 mm livres)
            self.line(20 * mm, 15 * mm, page_w - 20 * mm, 15 * mm)
            
            # Rodapé Inferior
            self.setFont("Helvetica", 8)
            self.setFillColor(C_SLATE_MUTED)
            self.drawString(20 * mm, 10 * mm, "Mestrado: Predição de Erosão Laminar no Paraná • Luis Alfredo (Orientador: Dr. Claudio L. Bazzi)")
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
        fontSize=16,
        leading=20,
        textColor=C_NAVY_DARK,
        alignment=TA_LEFT,
        spaceAfter=4
    )
    styles["DocSubtitle"] = ParagraphStyle(
        "DocSubtitle",
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=C_SLATE_TEXT,
        alignment=TA_LEFT,
        spaceAfter=8
    )
    styles["InstitutionHeader"] = ParagraphStyle(
        "InstitutionHeader",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11.5,
        textColor=C_EMERALD_DARK,
        alignment=TA_LEFT,
        spaceAfter=2
    )
    styles["MetadataBox"] = ParagraphStyle(
        "MetadataBox",
        fontName="Helvetica",
        fontSize=7.8,
        leading=11,
        textColor=C_SLATE_TEXT
    )
    styles["H1"] = ParagraphStyle(
        "H1",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=C_NAVY_DARK,
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )
    styles["H2"] = ParagraphStyle(
        "H2",
        fontName="Helvetica-Bold",
        fontSize=9.2,
        leading=12.2,
        textColor=C_EMERALD_DARK,
        spaceBefore=6,
        spaceAfter=2.5,
        keepWithNext=True
    )
    styles["H3"] = ParagraphStyle(
        "H3",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11.5,
        textColor=C_NAVY_DARK,
        spaceBefore=4,
        spaceAfter=2,
        keepWithNext=True
    )
    styles["Body"] = ParagraphStyle(
        "Body",
        fontName="Helvetica",
        fontSize=8.2,
        leading=11.8,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY,
        spaceAfter=3.5
    )
    styles["BodyBold"] = ParagraphStyle(
        "BodyBold",
        fontName="Helvetica-Bold",
        fontSize=8.2,
        leading=11.8,
        textColor=C_NAVY_DARK,
        spaceAfter=2.5
    )
    styles["BulletText"] = ParagraphStyle(
        "BulletText",
        fontName="Helvetica",
        fontSize=8.0,
        leading=11.4,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY,
        spaceAfter=2
    )
    styles["ScriptBoxTitle"] = ParagraphStyle(
        "ScriptBoxTitle",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11.5,
        textColor=C_CYAN_DARK,
        spaceAfter=2.5
    )
    styles["ScriptText"] = ParagraphStyle(
        "ScriptText",
        fontName="Helvetica-Oblique",
        fontSize=7.8,
        leading=11.2,
        textColor=C_NAVY_DARK,
        alignment=TA_JUSTIFY
    )
    styles["TableHeader"] = ParagraphStyle(
        "TableHeader",
        fontName="Helvetica-Bold",
        fontSize=7.2,
        leading=9.2,
        textColor=C_WHITE,
        alignment=TA_LEFT
    )
    styles["TableCell"] = ParagraphStyle(
        "TableCell",
        fontName="Helvetica",
        fontSize=6.9,
        leading=9.0,
        textColor=C_SLATE_TEXT
    )
    styles["TableCellBold"] = ParagraphStyle(
        "TableCellBold",
        fontName="Helvetica-Bold",
        fontSize=6.9,
        leading=9.0,
        textColor=C_NAVY_DARK
    )
    styles["ReferenceItem"] = ParagraphStyle(
        "ReferenceItem",
        fontName="Helvetica",
        fontSize=7.2,
        leading=10.2,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY,
        spaceAfter=3.8
    )
    return styles

def build_pdf():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    out_dir = os.path.join(project_root, "docs", "BASES PARA A DISSERTAÇÃO")
    os.makedirs(out_dir, exist_ok=True)
    pdf_path = os.path.join(out_dir, "Defesa_Metodologica_Replicabilidade_e_Vies_Espectral.pdf")
    
    # Margens acadêmicas: 20 mm laterais, 22 mm topo, 20 mm base
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=22 * mm,
        bottomMargin=20 * mm
    )
    
    styles = get_custom_styles()
    story = []
    
    # =========================================================================
    # PÁGINA 1: CABEÇALHO, SEÇÃO 1 E SEÇÃO 2.1 (DETERMINISMO NUMÉRICO)
    # =========================================================================
    story.append(Paragraph("UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ (UTFPR) — CÂMPUS MEDIANEIRA", styles["InstitutionHeader"]))
    story.append(Paragraph("PROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO (PPGTCA)", styles["InstitutionHeader"]))
    story.append(Spacer(1, 2 * mm))
    
    story.append(Paragraph("FUNDAMENTAÇÃO CIENTÍFICA E DEFESA METODOLÓGICA", styles["DocTitle"]))
    story.append(Paragraph(
        "Replicabilidade em Inteligência Artificial e Controle Estrutural de Viés no Uso de Sensores Aerotransportados (VANT): "
        "Subsídios Epistemológicos, Evidências da Literatura e Roteiro de Arguição para a Dissertação de Mestrado",
        styles["DocSubtitle"]
    ))
    
    # Caixa de Metadados
    meta_data = [
        [
            Paragraph("<b>Mestrando:</b> Luis Alfredo Ferreira da Silva<br/>"
                      "<b>Orientador:</b> Prof. Dr. Claudio Leones Bazzi<br/>"
                      "<b>Linha de Pesquisa:</b> Geotecnologias Aplicadas e Modelagem Computacional no Agronegócio", styles["MetadataBox"]),
            Paragraph("<b>Projeto:</b> SAREL v2.0 (Validação e Predição de Erosão Laminar)<br/>"
                      "<b>Recorte Territorial:</b> Bacia Hidrográfica do Rio Paraná III (BP3)<br/>"
                      "<b>Finalidade:</b> Suporte à Qualificação e Defesa de Dissertação", styles["MetadataBox"])
        ]
    ]
    t_meta = Table(meta_data, colWidths=[85 * mm, 85 * mm])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_BG_PAGE),
        ('BOX', (0,0), (-1,-1), 0.6, C_BORDER),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 3.5 * mm))
    
    story.append(Paragraph("1. Introdução e Contexto Epistemológico da Arguição", styles["H1"]))
    story.append(Paragraph(
        "Durante apresentações em seminários acadêmicos e bancas examinadoras na área de Geociências, Agronomia e Engenharia "
        "Agrícola, é recorrente o surgimento de duas indagações centrais direcionadas ao uso de Inteligência Artificial (IA) "
        "e veículos aéreos não tripulados (VANTs) no mapeamento de perdas de solo por erosão laminar:",
        styles["Body"]
    ))
    
    q_box = [
        [
            Paragraph("<b>Pergunta 1 (Natureza das IAs):</b> <i>'Como tornar o trabalho replicável, uma vez que as IAs são probabilísticas?'</i><br/><br/>"
                      "<b>Pergunta 2 (Sensores de Alta Resolução):</b> <i>'Corre-se o risco do treinamento \"VICIAR\" o sistema em dados tão precisos quanto os que iremos obter com o Spectro (VANT)?'</i>",
                      styles["BodyBold"])
        ]
    ]
    t_q = Table(q_box, colWidths=[170 * mm])
    t_q.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_AMBER_BG),
        ('BOX', (0,0), (-1,-1), 1, C_AMBER_DARK),
        ('PADDING', (0,0), (-1,-1), 4.5),
    ]))
    story.append(t_q)
    story.append(Spacer(1, 2.5 * mm))
    
    story.append(Paragraph(
        "Essas questões expressam preocupações legítimas de pesquisadores habituados a modelos matemáticos analíticos fechados "
        "(como a USLE e RUSLE; WISCHMEIER; SMITH, 1978; RENARD et al., 1997). No entanto, ambas encerram premissas conceituais que "
        "precisam ser desfeitas e enquadradas sob as diretrizes de reprodutibilidade computacional internacional em IA (PINEAU et al., 2021) "
        "e sensoriamento remoto multiescala (ALVAREZ-VANHARD et al., 2021; WOODCOCK; STRAHLER, 1987). "
        "Este documento sistematiza a fundamentação teórica, as equações estatísticas e o lastro científico arquivado na base local do projeto, "
        "demonstrando que o Sistema de Amostragem e Rotulagem para Erosão Laminar (SAREL) foi concebido exatamente para neutralizar esses riscos.",
        styles["Body"]
    ))
    story.append(Spacer(1, 2 * mm))
    
    story.append(Paragraph("2. Eixo I: A Replicabilidade Científica Diante da Natureza Probabilística das IAs", styles["H1"]))
    story.append(Paragraph(
        "A premissa da primeira pergunta confunde três conceitos epistemológicos distintos: <b>(i) modelagem probabilística</b>, "
        "<b>(ii) estocasticidade algorítmica</b> e <b>(iii) irreprodutibilidade computacional</b>. "
        "Um sistema computacional probabilístico não é equivalente a um sistema caótico, arbitrário ou irreprodutível. "
        "Na ciência da computação contemporânea, a replicabilidade em modelos de aprendizado de máquina é sustentada por três pilares inegociáveis:",
        styles["Body"]
    ))
    
    story.append(Paragraph("2.1 Pilar 1: Determinismo Numérico e Reprodutibilidade Computacional Estrita", styles["H2"]))
    story.append(Paragraph(
        "Os algoritmos de aprendizado supervisionado utilizados em sensoriamento remoto (como <i>Gradient Boosted Decision Trees</i> / XGBoost, "
        "<i>Random Forests</i> ou Regressões Regularizadas Lasso/ElasticNet; CHEN; GUESTRIN, 2016) operam estritamente sobre "
        "<b>Geradores de Números Pseudoaleatórios (PRNG)</b>. Toda a aleatoriedade aparente (sorteio de amostras, seleção de variáveis por split "
        "ou particionamento de dobras) é uma função matemática determinística a partir de uma semente (<i>seed</i>).",
        styles["Body"]
    ))
    story.append(Paragraph(
        "Conforme estabelecido pelo programa de reprodutibilidade da <i>NeurIPS</i> (PINEAU et al., 2021), a reprodutibilidade de código é assegurada no SAREL por:",
        styles["Body"]
    ))
    story.append(Paragraph("• <b>Fixação Universal de Sementes:</b> Todos os geradores de números aleatórios (`random_state`) são pré-fixados e declarados no pacote de reprodutibilidade científica (Decisões D24 e D25).", styles["BulletText"]))
    story.append(Paragraph("• <b>Congelamento de Ambiente e Dependências:</b> Versões de bibliotecas numéricas e compiladores são fixadas via arquivos de trava (`package-lock.json`, contêineres e hashes SHA-256), impedindo variações de ponto flutuante entre ambientes.", styles["BulletText"]))
    story.append(Paragraph("• <b>Persistência de Artefatos Treinados:</b> O produto final da pesquisa inclui os pesos e estruturas de decisão do modelo serializados em disco (formato JSON/ONNX), permitindo que qualquer avaliador replique exatamente a mesma inferência sobre dados novos sem precisar retreinar o algoritmo.", styles["BulletText"]))
    
    # Quebra limpa para a Página 2: Pilares 2 e 3
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 2: PILAR 2 (REPRODUTIBILIDADE ESTATÍSTICA) E PILAR 3 (DATA LEAKAGE)
    # =========================================================================
    story.append(Paragraph("2.2 Pilar 2: Reprodutibilidade Estatística e Invariância à Semente (Anti-Seed Hacking)", styles["H2"]))
    story.append(Paragraph(
        "A exigência científica fundamental não é apenas que 'o código rode com o mesmo resultado fixando uma semente específica' "
        "(o que caracterizaria <i>seed hacking</i>, isto é, a escolha oportunista de uma semente favorável). "
        "A questão crucial é: <b>a hipótese científica se sustenta independente da estocasticidade da amostragem?</b>",
        styles["Body"]
    ))
    story.append(Paragraph(
        "Em sensoriamento remoto ambiental, o recente estudo publicado na <b>Nature Communications por Ploton et al. (2020)</b> "
        "demonstrou que a validação aleatória convencional (*random k-fold*) produz acurácias ilusórias e espúrias devido à "
        "autocorrelação espacial entre amostras próximas. Quando submetidos à validação espacial rigorosa, modelos sem lastro biofísico colapsam. "
        "Para garantir robustez estatística genuína, o SAREL adota:",
        styles["Body"]
    ))
    story.append(Paragraph("• <b>Validação Cruzada Espacial em Blocos (Spatial Block Cross-Validation):</b> O espaço é particionado em blocos independentes baseados no alcance do variograma empírico (a &approx; 50 m; ROBERTS et al., 2017), eliminando o vazamento de dependência espacial (Primeira Lei de Tobler).", styles["BulletText"]))
    story.append(Paragraph("• <b>Inferência por Bootstrap Agrupado em Nível de Polígono (Decisão D25):</b> O desempenho preditivo e a comparação pareada com a RUSLE são calculados via 1.000 iterações de <i>bootstrap</i> reamostradas na unidade de agrupamento dos 36 polígonos independentes (CAMERON; GELBACH; MILLER, 2008).", styles["BulletText"]))
    story.append(Paragraph("• <b>Reporte Mandatório de Intervalos de Confiança (IC 95%):</b> O critério de confirmação da hipótese exige que o limite inferior do IC 95% do ganho (Delta rho = rho_XGBoost - rho_RUSLE) seja estritamente superior a 0,10, provando que o ganho é estrutural e não estocástico.", styles["BulletText"]))
    story.append(Spacer(1, 2 * mm))
    
    story.append(Paragraph("2.3 Pilar 3: Ciência Aberta, Prevenção de Data Leakage e Pré-Registro Metodológico", styles["H2"]))
    story.append(Paragraph(
        "Como documentado por <b>Kapoor e Narayanan (2023, Cell Press / Patterns)</b> em uma revisão abrangendo 17 campos científicos, "
        "o vazamento de dados (*data leakage*) é a causa primária da crise de reprodutibilidade em ciência guiada por aprendizado de máquina. "
        "O SAREL blinda o processo científico operando sob as <b>9 Regras Invioláveis da Lei Fundamental</b> e os <b>7 Invariantes de Integridade</b>. "
        "Seguindo o movimento de pré-registro científico (NOSEK et al., 2018), os 18 estratos biofísicos (D12), as regras de segregação cega e "
        "os critérios de refutação (D25) foram registrados formalmente no repositório antes do processamento dos dados de voo, "
        "tornando impossível o *p-hacking* ou a formulação de hipóteses a posteriori (*HARKing*).",
        styles["Body"]
    ))
    story.append(Paragraph(
        "Dessa forma, o projeto estabelece uma linha clara entre variabilidade estocástica inevitável do treinamento e a invariância da "
        "conclusão científica, garantindo que qualquer pesquisador independente chegue às mesmas inferências sobre a Bacia do Paraná III.",
        styles["Body"]
    ))
    
    # Quebra limpa para a Página 3: Eixo II (Viés Espectral e VANT)
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 3: EIXO II (CONTROLE DE VIÉS DE VANT/SPECTRO) E TABELA DE VIESES
    # =========================================================================
    story.append(Paragraph("3. Eixo II: O Risco de 'Viciar' o Sistema com Dados do VANT (Sensor Spectral 2)", styles["H1"]))
    story.append(Paragraph(
        "A segunda pergunta indaga se o treinamento do sistema corre o risco de ser 'viciado' (sobreajustado ou enviesado) "
        "pela altíssima resolução dos dados obtidos pelo drone multiespectral (VANT Spectral 2, Nuvem UAV, 5 bandas calibradas: "
        "Azul, Verde, Vermelho, RedEdge e NIR, com GSD de 3,59 a 3,96 cm e acurácia posicional CE90 de 1,47 m).",
        styles["Body"]
    ))
    story.append(Paragraph(
        "<b>A resposta científica é direta:</b> Esse vício existiria se o projeto cometesse o erro metodológico clássico de misturar suportes espaciais. "
        "No SAREL, esse risco é formalmente eliminado por uma decisão arquitetural fundamental: "
        "<b>o dado de VANT NÃO é preditor (feature de entrada) do modelo preditivo; ele é estritamente o instrumento de rotulagem (ground truth).</b>",
        styles["Body"]
    ))
    
    story.append(Paragraph("3.1 O Problema da Incompatibilidade de Suporte Espacial e o Fator de Escala", styles["H2"]))
    story.append(Paragraph(
        "O receio da banca reflete o problema clássico de escala teorizado por <b>Woodcock e Strahler (1987)</b> no *Remote Sensing of Environment*: "
        "quando o elemento físico observado (ex.: microssulco de erosão de 20 cm) é maior que o pixel (GSD de 4 cm do VANT), ele opera em "
        "<i>Resolução-H</i> (feição discreta diretamente detectável); quando projetado na célula de 10 m do satélite Sentinel-2, ele opera em "
        "<i>Resolução-L</i> (mistura espectral sub-pixel onde cada célula integra a radiança de 62.500 micropixels de VANT). "
        "Tentar alimentar um modelo com texturas de 4 cm para prever em satélite geraria o clássico <i>Modifiable Areal Unit Problem</i> (MAUP; OPENSHAW, 1984) "
        "e falha preditiva total.",
        styles["Body"]
    ))
    
    story.append(Paragraph("3.2 A Sinergia VANT-Satélite no SAREL: O Drone como Calibrador (Decisões D06 e D26)", styles["H2"]))
    story.append(Paragraph(
        "Em sua revisão sistemática sobre sinergias entre VANT e satélites, <b>Alvarez-Vanhard, Corpetti e Houet (2021)</b> classificam o "
        "acoplamento metodológico ideal em quatro estratégias, destacando a <b>Calibração de Modelos (*Model Calibration*)</b>: "
        "o VANT não substitui os dados orbitais, mas fornece o gabarito pericial de alta precisão necessário para calibrar o satélite.",
        styles["Body"]
    ))
    story.append(Paragraph("• <b>Vetor de Preditores Orbitais (Entrada X):</b> O modelo consome exclusivamente variáveis contínuas em escala de bacia: Sentinel-2 MSI Nível-2A a 10 m/20 m, Copernicus DEM GLO-30 a 30 m (D21), pedologia oficial Embrapa Solos (D14) e climatologia CHIRPS (D13). O modelo nunca consome os micropixels do drone como entrada.", styles["BulletText"]))
    story.append(Paragraph("• <b>Alvo Contínuo e Não-Binarizado (Saída Y):</b> Como alertam <b>Altman e Royston (2006, BMJ)</b>, dicotomizar variáveis contínuas descarta um terço do poder estatístico da amostra. Por isso, a vetorização pericial humana sobre o ortomosaico de 4 cm é rasterizada na célula de 10 m como uma fração contínua de área erodida y &isin; [0, 1], ajustada via XGBoost Tweedie (`reg:tweedie`; CHEN; GUESTRIN, 2016).", styles["BulletText"]))
    
    story.append(Spacer(1, 1.5 * mm))
    eq_box = [
        [
            Paragraph("<font size=8.2 color='#065F46'><b>f( Sentinel-2 10m/20m, MDE Copernicus 30m, Chuva CHIRPS, Pedologia )  &rarr;  Fração Erodida Observada pelo VANT (y &isin; [0, 1])</b></font>", styles["BodyBold"])
        ]
    ]
    t_eq = Table(eq_box, colWidths=[170 * mm])
    t_eq.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_MINT_BG),
        ('BOX', (0,0), (-1,-1), 0.8, C_EMERALD_MID),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(t_eq)
    story.append(Spacer(1, 2 * mm))
    
    story.append(Paragraph("3.3 Vieses Residuais Reais e Mecanismos de Neutralização no SAREL", styles["H2"]))
    
    vies_table_data = [
        [
            Paragraph("<b>Tipo de Viés Potencial</b>", styles["TableHeader"]),
            Paragraph("<b>Mecanismo do Risco</b>", styles["TableHeader"]),
            Paragraph("<b>Solução e Controle Estrutural no SAREL</b>", styles["TableHeader"])
        ],
        [
            Paragraph("<b>Vazamento Espacial (Spatial Leakage)</b>", styles["TableCellBold"]),
            Paragraph("Células contíguas do mesmo voo compartilham solo e relevo. Se divididas aleatoriamente entre treino e teste, o modelo 'decora' a fazenda.", styles["TableCell"]),
            Paragraph("<b>Segregação Mandatória por Polígono (D16):</b> De 4 polígonos sorteados por estrato, 2 vão para treino e 2 são lacrados como <i>held-out</i> de teste independente. Células do mesmo voo nunca se misturam.", styles["TableCell"])
        ],
        [
            Paragraph("<b>Deslocamento Posicional e Borda</b>", styles["TableCellBold"]),
            Paragraph("Sentinel-2 possui incerteza orbital (2 a 8 m); o VANT possui CE90 de 1,47 m. Um desalinhamento pode atribuir erosão à célula vizinha.", styles["TableCell"]),
            Paragraph("<b>Alvo Contínuo Tweedie (D26):</b> O alvo contínuo [0, 1] absorve suavemente incertezas de fronteira, ao contrário de classificadores binários rígidos que sofrem com ruído de rotulagem.", styles["TableCell"])
        ],
        [
            Paragraph("<b>Viés Amostral de Voo e Clima</b>", styles["TableCellBold"]),
            Paragraph("VANTs só voam sob tempo bom e propriedades autorizadas, enviesando a amostra para fazendas maiores e manejadas.", styles["TableCell"]),
            Paragraph("<b>Estratificação Biofísica Prévia (D12):</b> Sorteio probabilístico estrito em 18 estratos cobrindo toda a variação da BP3, impedindo seleção por conveniência.", styles["TableCell"])
        ]
    ]
    t_vies = Table(vies_table_data, colWidths=[40 * mm, 64 * mm, 66 * mm])
    t_vies.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_NAVY_DARK),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [C_WHITE, C_BG_PAGE]),
        ('PADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(KeepTogether(t_vies))
    
    # Quebra limpa para a Página 4: Os 4 Roteiros de Arguição
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 4: ROTEIRO ESTRATÉGICO DE ARGUIÇÃO (SCRIPTS 1, 2, 3 E 4 JUNTOS)
    # =========================================================================
    story.append(Paragraph("4. Roteiro Estratégico de Arguição (Scripts de Apresentação e Banca)", styles["H1"]))
    story.append(Paragraph(
        "Apresentam-se a seguir modelos estruturados de resposta para uso em seminários, qualificações e na defesa final da dissertação. "
        "As respostas equilibram fundamentação bibliográfica exata, precisão terminológica e firmeza metodológica.",
        styles["Body"]
    ))
    story.append(Spacer(1, 1.5 * mm))
    
    # Script 1
    s1_data = [
        [
            Paragraph("<b>ROTEIRO 1: RESPOSTA EXECUTIVA RÁPIDA (Seminários Gerais — Tempo: 45 segundos)</b>", styles["ScriptBoxTitle"])
        ],
        [
            Paragraph(
                "<i>\"Agradeço a pergunta, professor(a). Em relação à <b>replicabilidade</b>, a natureza probabilística da IA refere-se à inferência matemática e não à aleatoriedade descontrolada. "
                "Conforme as diretrizes internacionais de reprodutibilidade em aprendizado de máquina (Pineau et al., 2021), nosso sistema opera com sementes pseudoaleatórias congeladas, "
                "ambiente versionado e, crucialmente, validação cruzada espacial em blocos para mitigar a dependência espacial (Roberts et al., 2017). "
                "Avaliamos o modelo por distribuições de Bootstrap em 36 polígonos independentes (Cameron et al., 2008), exigindo que o ganho sobre a RUSLE seja comprovado no intervalo de confiança de 95%.<br/><br/>"
                "Quanto ao <b>risco de viciar nos dados do drone</b>, esse problema ocorreria se usássemos o ortomosaico de 4 cm como preditor do modelo para tentar prever em satélite de 10 m, "
                "o que geraria o erro clássico de quebra de suporte espacial (Woodcock & Strahler, 1987). "
                "No SAREL, o drone <b>não é preditor</b>; ele atua na estratégia de 'calibração de modelos' (Alvarez-Vanhard et al., 2021), servindo exclusivamente como verdade de solo. "
                "O algoritmo é alimentado apenas por preditores orbitais Sentinel-2 a 10 metros, relevo a 30 metros e variáveis ambientais da bacia. "
                "Ele aprende a estimar a fração de área erodida a partir do satélite, sem jamais depender do hiperdetalhe do drone para operar.\"</i>",
                styles["ScriptText"]
            )
        ]
    ]
    t_s1 = Table(s1_data, colWidths=[170 * mm])
    t_s1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_CYAN_BG),
        ('BOX', (0,0), (-1,-1), 1, C_CYAN_DARK),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_s1)
    story.append(Spacer(1, 2.5 * mm))
    
    # Script 2
    s2_data = [
        [
            Paragraph("<b>ROTEIRO 2: RESPOSTA APROFUNDADA PARA BANCA EXAMINADORA (Qualificação / Defesa — Tempo: 2 minutos)</b>", styles["ScriptBoxTitle"])
        ],
        [
            Paragraph(
                "<i>\"Excelente colocação da banca. Gostaria de responder em dois níveis metodológicos estruturados no SAREL:<br/><br/>"
                "<b>1. Sobre a Replicabilidade e o Não-Determinismo:</b> Diferenciamos o não-determinismo não controlado da modelagem probabilística reproduzível. "
                "Nosso protocolo implementa o tripé de reprodutibilidade científica (Pineau et al., 2021): "
                "(a) no nível computacional, os PRNGs são pré-registrados e os artefatos serializados em disco; "
                "(b) no nível estatístico, respondemos ao clássico estudo da Nature Communications de Ploton et al. (2020), que provou que modelos ambientais avaliados "
                "por validação aleatória comum exibem desempenho ilusório. Adotamos Spatial Block Cross-Validation pelo variograma (Roberts et al., 2017) e Bootstrap agrupado em 36 polígonos independentes (Cameron et al., 2008), "
                "reportando sempre o IC 95% da correlação de Spearman; e (c) no nível metodológico, prevenimos o vazamento de dados (data leakage; Kapoor & Narayanan, 2023) "
                "e o p-hacking por meio do pré-registro público de regras e critérios de refutação antes da observação dos voos (Nosek et al., 2018).<br/><br/>"
                "<b>2. Sobre o Vício de Resolução do VANT:</b> A literatura alerta com razão para o problema da quebra de suporte espacial (Woodcock & Strahler, 1987). "
                "Se extraíssemos texturas de 4 cm do Spectral 2 para tentar aplicar na bacia com satélite de 10 m, haveria colapso por MAUP (Openshaw, 1984). "
                "Por isso, a arquitetura do SAREL separa rigidamente a <b>unidade de predição</b> do <b>instrumento de rotulagem</b> (Decisões D06 e D26). "
                "A unidade de predição é a célula de 10 m do Sentinel-2. O drone atua exclusivamente na estratégia de model calibration (Alvarez-Vanhard et al., 2021): "
                "o especialista delineia a feição sobre o mosaico de 4 cm, e essa feição é convertida na fração contínua [0, 1] dentro da célula de 10 m. "
                "Como demonstram Altman e Royston (2006), manter a variável contínua via regressão Tweedie (Chen & Guestrin, 2016) preserva o poder estatístico e absorve erros de borda. "
                "Por fim, para neutralizar a dependência espacial entre células do mesmo voo, isolamos 36 polígonos completos como held-out lacrado de teste (Decisão D16), "
                "garantindo que o modelo seja testado em áreas onde nunca viu nenhum dado do sensor.\"</i>",
                styles["ScriptText"]
            )
        ]
    ]
    t_s2 = Table(s2_data, colWidths=[170 * mm])
    t_s2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_MINT_BG),
        ('BOX', (0,0), (-1,-1), 1, C_EMERALD_DARK),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_s2)
    story.append(Spacer(1, 2.5 * mm))
    
    # Script 3 & 4: Específicos por Perfil de Banca
    s34_data = [
        [
            Paragraph("<b>ROTEIRO 3: PARA BANCA DE COMPUTAÇÃO / CIÊNCIA DE DADOS</b>", styles["ScriptBoxTitle"]),
            Paragraph("<b>ROTEIRO 4: PARA BANCA DE SOLOS / AGRONOMIA / MANEJO</b>", styles["ScriptBoxTitle"])
        ],
        [
            Paragraph(
                "<i>\"Nosso pipeline trata a modelagem estocástica como processo estritamente auditável sob os padrões NeurIPS (Pineau et al., 2021). "
                "Não reportamos acurácias pontuais que poderiam ser fruto de viés de seleção de sementes (seed hacking). "
                "Para evitar data leakage geoespacial (Kapoor & Narayanan, 2023), isolamos 36 polígonos inteiros em held-out lacrado e empregamos "
                "Spatial Block Cross-Validation guiada por variograma. O modelo XGBoost é formulado com perda Tweedie e restrições de monotonicidade "
                "física, garantindo generalização consistente e convergência reprodutível.\"</i>",
                styles["ScriptText"]
            ),
            Paragraph(
                "<i>\"A erosão laminar não se distribui aleatoriamente; ela segue a hidrodinâmica da vertente e a catena topográfica. "
                "O VANT Spectral 2 opera como instrumento de validação pericial de alta precisão (Alvarez-Vanhard et al., 2021), "
                "substituindo a subjetividade de estacas pontuais por mapeamento contínuo de microssulcos e colúvios. "
                "Ao projetar a área erodida na célula de 10 m do Sentinel-2 como fração contínua, conectamos o detalhe do manejo do solo "
                "à escala regional da Bacia do Paraná III, sem distorcer o modelo físico da vertente.\"</i>",
                styles["ScriptText"]
            )
        ]
    ]
    t_s34 = Table(s34_data, colWidths=[83 * mm, 83 * mm])
    t_s34.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), C_CYAN_BG),
        ('BACKGROUND', (1,0), (1,-1), C_MINT_BG),
        ('BOX', (0,0), (0,-1), 0.8, C_CYAN_DARK),
        ('BOX', (1,0), (1,-1), 0.8, C_EMERALD_MID),
        ('PADDING', (0,0), (-1,-1), 3.5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_s34)
    
    # Quebra limpa para a Página 5: Referências Bibliográficas ABNT
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 5: REFERÊNCIAS BIBLIOGRÁFICAS (PADRÃO ABNT NBR 6023)
    # =========================================================================
    story.append(Paragraph("5. Referências Bibliográficas (Norma ABNT NBR 6023)", styles["H1"]))
    story.append(Paragraph(
        "<i>Todas as obras fundamentais abaixo estão arquivadas fisicamente na base bibliográfica local do repositório "
        "(diretórios `docs/Selecao Bibliografica/Pesquisas Machine Learning/`, `docs/Selecao Bibliografica/Para Revisar/` e `docs/verificacoes/fontes/`).</i>",
        styles["Body"]
    ))
    story.append(Spacer(1, 2 * mm))
    
    refs = [
        "ALTMAN, D. G.; ROYSTON, P. The cost of dichotomising continuous variables. <b>BMJ (British Medical Journal)</b>, London, v. 332, n. 7549, p. 1080, 2006. DOI: 10.1136/bmj.332.7549.1080. [Arquivo local: `1080.1.full.pdf`]",
        "ALVAREZ-VANHARD, E.; CORPETTI, T.; HOUET, T. UAV & satellite synergies for optical remote sensing applications: A literature review. <b>Science of Remote Sensing</b>, Amsterdam, v. 3, 100019, 2021. DOI: 10.1016/j.srs.2021.100019. [Arquivo local: `UAV--amp--satellite-synergies...pdf`]",
        "BAZZI, C. L.; KRUG, E. T. S.; GOMES, G. J.; SOUZA, E. G. de; GEBLER, L.; SOBJAK, R. Estimating soil loss by laminar erosion using precision agriculture computational tools. <b>Revista Brasileira de Engenharia Agrícola e Ambiental</b>, Campina Grande, v. 26, n. 12, p. 907-914, 2022. DOI: 10.1590/1807-1929/agriambi.v26n12p907-914. [Arquivo local: `Estimativa da perda de solo...pdf`]",
        "CAMERON, A. C.; GELBACH, J. B.; MILLER, D. L. Bootstrap-based improvements for inference with clustered errors. <b>The Review of Economics and Statistics</b>, Cambridge, v. 90, n. 3, p. 414-427, 2008. DOI: 10.1162/rest.90.3.414.",
        "CHEN, T.; GUESTRIN, C. XGBoost: A scalable tree boosting system. In: ACM SIGKDD INTERNATIONAL CONFERENCE ON KNOWLEDGE DISCOVERY AND DATA MINING, 22., 2016, San Francisco. <b>Proceedings...</b> New York: ACM, 2016. p. 785-794. DOI: 10.1145/2939672.2939785. [Arquivo local: `1603.02754v3.pdf`]",
        "KAPOOR, S.; NARAYANAN, A. Leakage and the reproducibility crisis in machine-learning-based science. <b>Patterns (Cell Press)</b>, Cambridge, v. 4, n. 9, 100804, 2023. DOI: 10.1016/j.patter.2023.100804. [Arquivo local: `mmc2.pdf`]",
        "KRUG, E. T. S. <b>Estimativa de perda de solo por erosão laminar em função de suas características e diferentes níveis de precipitação</b>. 2024. 88 f. Dissertação (Mestrado em Tecnologias Computacionais para o Agronegócio) — Universidade Tecnológica Federal do Paraná, Câmpus Medianeira, 2024. (Orientador: Prof. Dr. Claudio Leones Bazzi). [Arquivo local: `estimativaerosaolaminar.pdf`]",
        "NOSEK, B. A.; EBERSOLE, C. R.; DEHAVEN, A. C.; MELLOR, D. T. The preregistration revolution. <b>Proceedings of the National Academy of Sciences (PNAS)</b>, Washington, v. 115, n. 11, p. 2600-2606, 2018. DOI: 10.1073/pnas.1708274114. [Arquivo local: `nosek-et-al-2018...pdf`]",
        "OPENSHAW, S. <b>The modifiable areal unit problem</b>. Norwich: Geo Books, 1984. 41 p. (Concepts and Techniques in Modern Geography, 38).",
        "PINEAU, J.; VINCENT-LAMARRE, P.; SINHA, K.; LARIVIÈRE, V.; BEYGELZIMER, A.; D'ALCHÉ-BUC, F.; FOX, E.; LAROCHELLE, H. Improving reproducibility in machine learning research (A report from the NeurIPS 2019 reproducibility program). <b>Journal of Machine Learning Research (JMLR)</b>, Cambridge, v. 22, n. 164, p. 1-20, 2021. [Arquivo local: `20-303.pdf`]",
        "PLOTON, P.; MORTIER, F.; RÉJOU-MÉCHAIN, M.; BARBIER, N.; PICARD, N.; PLOTON, S.; BÉNÉDET, F.; COUTERON, P. Spatial validation reveals poor predictive performance of large-scale ecological mapping models. <b>Nature Communications</b>, London, v. 11, n. 1, 4540, 2020. DOI: 10.1038/s41467-020-18321-y. [Arquivo local: `s41467-020-18321-y.pdf`]",
        "RENARD, K. G.; FOSTER, G. R.; WEESIES, G. A.; MCCOOL, D. K.; YODER, D. C. <b>Predicting soil erosion by water: a guide to conservation planning with the Revised Universal Soil Loss Equation (RUSLE)</b>. Washington: USDA, 1997. 384 p. (Agriculture Handbook, 703). [Arquivo local: `ah_703.pdf`]",
        "ROBERTS, D. R.; BAHN, V.; CIUTI, S.; BOYCE, M. S.; ELITH, J.; GUILLERA-ARROITA, G.; HAUCH, S.; BLANCHET, F. G.; DORMANN, C. F. Cross-validation strategies for data with temporal, spatial or phylogenetic structure. <b>Ecography</b>, Copenhagen, v. 40, n. 8, p. 913-929, 2017. DOI: 10.1111/ecog.02881. [Arquivo local: `Ecography - 2016 - Roberts...pdf`]",
        "WISCHMEIER, W. H.; SMITH, D. D. <b>Predicting rainfall erosion losses: a guide to conservation planning</b>. Washington: USDA, 1978. 58 p. (Agriculture Handbook, 537).",
        "WOODCOCK, C. E.; STRAHLER, A. H. The factor of scale in remote sensing. <b>Remote Sensing of Environment</b>, New York, v. 21, n. 3, p. 311-332, 1987. DOI: 10.1016/0034-4257(87)90015-0. [Arquivo local: `The_factor_of_scale_in_remote_sensing.pdf`]"
    ]
    
    for r in refs:
        story.append(Paragraph(r, styles["ReferenceItem"]))
        
    doc.build(story, canvasmaker=SarelNumberedCanvas)
    print(f"PDF 1 recompilado com sucesso: {pdf_path} ({os.path.getsize(pdf_path)} bytes)")

if __name__ == "__main__":
    build_pdf()
