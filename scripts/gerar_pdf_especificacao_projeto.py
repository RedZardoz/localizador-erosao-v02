#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Geração do Documento 2:
Especificação Metodológica do Projeto de Dissertação de Mestrado (Sistema SAREL).
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
# CANVAS PERSONALIZADO COM NUMERAÇÃO "PÁGINA X DE Y" E CABEÇALHO COM MARGENS RIGOROSAS
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
            self.drawRightString(page_w - 20 * mm, page_h - 11 * mm, "ESPECIFICAÇÃO METODOLÓGICA • SAREL")
            
            # Linha divisória superior (a 14 mm do topo; texto começa em 22 mm -> 8 mm livres de respiro)
            self.setStrokeColor(C_BORDER_LIGHT)
            self.setLineWidth(0.6)
            self.line(20 * mm, page_h - 14 * mm, page_w - 20 * mm, page_h - 14 * mm)
            
            # Linha divisória inferior (a 15 mm da base; texto termina em 20 mm -> 5 mm livres de respiro)
            self.line(20 * mm, 15 * mm, page_w - 20 * mm, 15 * mm)
            
            # Rodapé Inferior
            self.setFont("Helvetica", 8)
            self.setFillColor(C_SLATE_MUTED)
            self.drawString(20 * mm, 10 * mm, "Projeto de Dissertação: Predição de Erosão Laminar na BP3 • Luis Alfredo (Orientador: Dr. Claudio L. Bazzi)")
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
        fontSize=14.5,
        leading=18.5,
        textColor=C_NAVY_DARK,
        alignment=TA_LEFT,
        spaceAfter=3
    )
    styles["DocSubtitle"] = ParagraphStyle(
        "DocSubtitle",
        fontName="Helvetica",
        fontSize=9.0,
        leading=12.8,
        textColor=C_SLATE_TEXT,
        alignment=TA_LEFT,
        spaceAfter=6
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
        fontSize=7.5,
        leading=10.6,
        textColor=C_SLATE_TEXT
    )
    styles["H1"] = ParagraphStyle(
        "H1",
        fontName="Helvetica-Bold",
        fontSize=10.2,
        leading=13.2,
        textColor=C_NAVY_DARK,
        spaceBefore=6,
        spaceAfter=2.5,
        keepWithNext=True
    )
    styles["H2"] = ParagraphStyle(
        "H2",
        fontName="Helvetica-Bold",
        fontSize=8.6,
        leading=11.5,
        textColor=C_EMERALD_DARK,
        spaceBefore=4.5,
        spaceAfter=2,
        keepWithNext=True
    )
    styles["Body"] = ParagraphStyle(
        "Body",
        fontName="Helvetica",
        fontSize=7.8,
        leading=11.2,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY,
        spaceAfter=2.8
    )
    styles["BodyBold"] = ParagraphStyle(
        "BodyBold",
        fontName="Helvetica-Bold",
        fontSize=7.8,
        leading=11.2,
        textColor=C_NAVY_DARK,
        spaceAfter=2
    )
    styles["BulletText"] = ParagraphStyle(
        "BulletText",
        fontName="Helvetica",
        fontSize=7.6,
        leading=10.8,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY,
        spaceAfter=1.8
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
        fontSize=7.0,
        leading=9.2,
        textColor=C_SLATE_MUTED,
        alignment=TA_CENTER
    )
    styles["TableHeader"] = ParagraphStyle(
        "TableHeader",
        fontName="Helvetica-Bold",
        fontSize=6.8,
        leading=8.8,
        textColor=C_WHITE,
        alignment=TA_LEFT
    )
    styles["TableCell"] = ParagraphStyle(
        "TableCell",
        fontName="Helvetica",
        fontSize=6.6,
        leading=8.6,
        textColor=C_SLATE_TEXT
    )
    styles["TableCellBold"] = ParagraphStyle(
        "TableCellBold",
        fontName="Helvetica-Bold",
        fontSize=6.6,
        leading=8.6,
        textColor=C_NAVY_DARK
    )
    styles["ReferenceItem"] = ParagraphStyle(
        "ReferenceItem",
        fontName="Helvetica",
        fontSize=6.8,
        leading=9.4,
        textColor=C_SLATE_TEXT,
        alignment=TA_JUSTIFY,
        spaceAfter=2.8
    )
    return styles

def build_pdf():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    out_dir = os.path.join(project_root, "docs", "BASES PARA A DISSERTAÇÃO")
    os.makedirs(out_dir, exist_ok=True)
    pdf_path = os.path.join(out_dir, "Especificacao_Metodologica_Projeto_Dissertacao_SAREL.pdf")
    
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
    # PÁGINA 1: IDENTIFICAÇÃO INSTITUCIONAL E SEÇÃO 1 (CONTEXTO E ESTADO DA ARTE)
    # =========================================================================
    story.append(Paragraph("UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ (UTFPR) — CÂMPUS MEDIANEIRA", styles["InstitutionHeader"]))
    story.append(Paragraph("PROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO (PPGTCA)", styles["InstitutionHeader"]))
    story.append(Spacer(1, 1.2 * mm))
    
    story.append(Paragraph("LOCALIZAÇÃO E PREDIÇÃO DE EROSÃO LAMINAR NA BACIA HIDROGRÁFICA DO PARANÁ III POR SENSORIAMENTO REMOTO MULTIFONTE E APRENDIZADO DE MÁQUINA SUPERVISIONADO POR VANT", styles["DocTitle"]))
    story.append(Paragraph(
        "Especificação Metodológica, Modelagem Matemática e Estrutura Conceitual para a Dissertação de Mestrado",
        styles["DocSubtitle"]
    ))
    
    # Tabela de Metadados
    meta_table_data = [
        [
            Paragraph("<b>Mestrando:</b> Luis Alfredo Ferreira da Silva<br/>"
                      "<b>Orientador:</b> Prof. Dr. Claudio Leones Bazzi<br/>"
                      "<b>Área de Concentração:</b> Tecnologias Computacionais no Agronegócio<br/>"
                      "<b>Linha de Pesquisa:</b> Geotecnologias Aplicadas e Modelagem Computacional", styles["MetadataBox"]),
            Paragraph("<b>Sistema Computacional:</b> SAREL v2.0 (Amostragem e Rotulagem)<br/>"
                      "<b>Recorte Territorial:</b> Bacia Hidrográfica do Paraná III (7.979 km² estritos; 28 municípios)<br/>"
                      "<b>Domínio de Declividade:</b> 3,0% a 20,0% (Suave-Ondulado a Ondulado; Decisão D07)<br/>"
                      "<b>Linha de Base Analítica:</b> RUSLE Parametrizada para o Paraná (D01, D13, D14, D15)", styles["MetadataBox"])
        ]
    ]
    t_meta = Table(meta_table_data, colWidths=[85 * mm, 85 * mm])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_BG_PAGE),
        ('BOX', (0,0), (-1,-1), 0.6, C_BORDER),
        ('PADDING', (0,0), (-1,-1), 3.0),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 2.0 * mm))
    
    story.append(Paragraph("1. Introdução e Formulação do Problema", styles["H1"]))
    story.append(Paragraph(
        "A erosão hídrica laminar (<i>sheet erosion</i>) consiste no desprendimento e arraste uniforme de delgadas camadas superficiais "
        "do solo sob a ação conjugada do impacto cinético das gotas de chuva (<i>splash detachment</i>) e do deflúvio superficial difuso não concentrado (<i>sheet runoff</i>). "
        "Ao contrário da erosão em sulcos (<i>rill</i>) ou voçorocas (<i>gully</i>), a erosão laminar não produz incisões topográficas imediatamente evidentes, "
        "o que mascara a progressiva decapitação dos horizontes férteis, a redução da capacidade de infiltração e o carreamento difuso de sedimentos "
        "e agroquímicos em direção à rede de drenagem.",
        styles["Body"]
    ))
    story.append(Paragraph(
        "Na <b>Bacia Hidrográfica do Rio Paraná III (BP3)</b>, recorte territorial deste estudo abrangendo aproximadamente 7.979 km² de drenagem estrita "
        "(base oficial IAT/SEMA/ANA) e 28 municípios do oeste paranaense (19 integrais e 9 parciais; IBGE/ITCG), a intensa exploração agropecuária "
        "sobre solos de origem basáltica (predomínio de Latossolos e Nitossolos Vermelhos distroférricos) sob cultivo contínuo de grãos torna a preservação "
        "do solo uma prioridade crítica. A BP3 deságua diretamente na margem esquerda do Reservatório da Usina Hidrelétrica de Itaipu Binacional, "
        "onde o aporte de sedimentos finos e a turbidez hídrica geram severos impactos sobre a vida útil da barragem, a qualidade das águas e os custos operacionais.",
        styles["Body"]
    ))
    story.append(Paragraph(
        "<b>O Estado da Arte no PPGTCA e a Lacuna Regional:</b> Estudos precursores desenvolvidos no âmbito do PPGTCA/UTFPR sob coordenação "
        "do Prof. Dr. Claudio Leones Bazzi (BAZZI et al., 2022; KRUG, 2024; LUCAS, 2024) demonstraram pioneiramente o potencial e os limites "
        "da estimativa da perda de solo por erosão laminar com ferramentas computacionais na agricultura de precisão e na Bacia do Paraná III. "
        "Em <b>Bazzi et al. (2022)</b>, constatou-se que a variabilidade espacial dos fatores da Equação Universal de Perda de Solo (USLE) no oeste paranaense "
        "exige parametrizações refinadas e métodos computacionais para apoiar o manejo localizado. Já as dissertações de <b>Lucas (2024)</b> e <b>Krug (2024)</b> "
        "avaliaram cenários de conservação do solo e sensibilidade a regimes pluviométricos na BP3. "
        "Contudo, a literatura regional permaneceu circunscrita a modelos analítico-empíricos lineares (USLE/RUSLE; WISCHMEIER; SMITH, 1978; RENARD et al., 1997), "
        "que foram calibrados em parcelas experimentais homogêneas de 22,1 metros e sofrem de severas distorções ao serem extrapolados para escala de bacia "
        "sem calibração empírica por sensoriamento remoto de alta resolução.",
        styles["Body"]
    ))
    story.append(Paragraph(
        "O presente projeto preenche essa lacuna científica ao conceber o <b>SAREL (Sistema de Amostragem e Rotulagem para Erosão Laminar)</b>, "
        "integrando sensoriamento remoto orbital multitemporal (Sentinel-2), morfometria de alta precisão (Copernicus DEM 30 m), verdade de solo pericial "
        "por Veículo Aéreo Não Tripulado (VANT com sensor multiespectral Spectral 2) e aprendizado de máquina supervisionado robusto.",
        styles["Body"]
    ))
    
    # Quebra limpa para a Página 2: Objetivos e Metodologia Inicial
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 2: SEÇÃO 2 (HIPÓTESES E OBJETIVOS) E SEÇÃO 3 (3.1 E 3.2)
    # =========================================================================
    story.append(Paragraph("2. Hipóteses Científicas e Objetivos", styles["H1"]))
    story.append(Paragraph(
        "<b>Hipótese Central (H1):</b> Modelos de aprendizado de máquina baseados em <i>Gradient Boosted Trees</i> (XGBoost), integrando "
        "preditores espectro-temporais do satélite Sentinel-2, variáveis morfométricas de terreno do Copernicus DEM e dados edafoclimáticos, "
        "supervisionados por feições periciais de campo em alta resolução obtidas por VANT, apresentam capacidade discriminatória e de ordenação "
        "da perda de solo por erosão laminar significativamente superior à linha de base tradicional da RUSLE na Bacia do Paraná III "
        "(definida formalmente como ganho de correlação de postos de Spearman Delta rho &ge; 0,10 com p &lt; 0,05; Decisão D25).",
        styles["Body"]
    ))
    story.append(Paragraph(
        "<b>Hipótese Secundária (H2):</b> A representação do alvo como variável contínua (fração de área da célula de 10 m erodida, y &isin; [0, 1]; "
        "Decisão D26) ajustada por função de perda Tweedie (`reg:tweedie`) preserva informação biofísica crítica e é superior a classificadores "
        "binários tradicionais sujeitos a ruído de borda e perda amostral por dicotomização artificial (ALTMAN; ROYSTON, 2006).",
        styles["Body"]
    ))
    story.append(Paragraph("<b>Objetivos Específicos:</b>", styles["BodyBold"]))
    story.append(Paragraph("1. Estruturar o frame amostral regional da BP3 por estratificação multivariada biofísica (18 estratos) e <i>spatial thinning</i> geodésico (D12).", styles["BulletText"]))
    story.append(Paragraph("2. Executar campanhas de mapeamento aerotransportado com VANT multiespectral Spectral 2 em 72 polígonos de 5,02 ha distribuídos nos estratos, realizando vetorização pericial da erosão laminar (D16).", styles["BulletText"]))
    story.append(Paragraph("3. Desenvolver o cubo de preditores orbitais decenal (2016-2026) a partir da constelação Sentinel-2 MSI Nível-2A, extraindo parâmetros de decomposição harmônica OLS, frequência de solo nu e índices biofísicos (D05, D10).", styles["BulletText"]))
    story.append(Paragraph("4. Parametrizar a linha de base analítica regional da RUSLE para a bacia (fatores R, K, LS, C e P com lastro científico verificado: D01, D13, D14, D15).", styles["BulletText"]))
    story.append(Paragraph("5. Treinar e comparar os competidores preditivos (XGBoost com restrição de teto por bloco, Regressão Penalizada ElasticNet e RUSLE) sob validação espacial em blocos e conjunto de teste independente (held-out lacrado de 36 polígonos) via Bootstrap agrupado (D24, D25).", styles["BulletText"]))
    story.append(Spacer(1, 1.5 * mm))
    
    story.append(Paragraph("3. Metodologia Detalhada e Formulação Matemática", styles["H1"]))
    story.append(Paragraph("3.1 Recorte Espacial e Máscara Territorial de Elegibilidade (Decisão D07)", styles["H2"]))
    story.append(Paragraph(
        "O domínio geográfico compreende a Bacia Hidrográfica do Rio Paraná III (BP3), abrangendo 28 municípios do oeste do Paraná. "
        "Para assegurar que a modelagem capture estritamente as áreas agrícolas onde a erosão laminar é o processo físico atuante, "
        "o território é filtrado pela <b>Máscara Territorial de Elegibilidade (Decisão D07)</b> composta por restrições cumulativas:",
        styles["Body"]
    ))
    story.append(Paragraph("• <b>Uso e Cobertura da Terra (ESA WorldCover 10 m):</b> Exclusivamente as classes 30 (pastagem cultivada) e 40 (lavouras anuais). A classe 60 (solo exposto permanente) é expressamente excluída para evitar circularidade com a frequência temporal de solo nu. Exige-se concordância estrita entre as épocas v100 (2020) e v200 (2021).", styles["BulletText"]))
    story.append(Paragraph("• <b>Exclusão Hidrográfica e Urbana:</b> Remoção de corpos d'água permanentes (JRC Surface Water com raio de amortecimento de 30 m) e áreas antropizadas não agrícolas.", styles["BulletText"]))
    story.append(Paragraph("• <b>Janela de Declividade Física (Decisão D07 e P04):</b> Recorte restrito estritamente ao intervalo de <b>3,0% a 20,0%</b> (relevo suave ondulado a ondulado do SiBCS; EMBRAPA SOLOS, 2018), calculada em projeção métrica conforme SIRGAS 2000 UTM 22S (EPSG:31982). Áreas planas (&lt; 3%) são excluídas pois o deflúvio difuso raramente adquire tensão de cisalhamento para transporte laminar (predomínio de deposição); encostas acentuadas (&gt; 20%) são excluídas pois o escoamento converge rapidamente em microrrelevos, tornando o sulco e a voçoroca os processos dominantes.", styles["BulletText"]))
    story.append(Spacer(1, 1.5 * mm))
    
    story.append(Paragraph("3.2 Desenho Amostral e Estratificação Multivariada (Decisão D12)", styles["H2"]))
    story.append(Paragraph(
        "A amostragem puramente aleatória ou por conveniência é inadequada em sensoriamento remoto por subamostrar combinações relevantes do terreno. "
        "O SAREL implementa uma estratificação multivariada em <b>18 estratos biofísicos canônicos</b> definidos pelo produto fatorial "
        "<b>S_hat &times; E_hat &times; K_hat</b> dentro do domínio de validade de 3,0% a 20,0%:",
        styles["Body"]
    ))
    story.append(Paragraph("• <b>Declividade do Terreno (S_hat):</b> 3 tercis empíricos de declividade dentro do domínio de 3,0% a 20,0% derivados do Copernicus DEM 30 m (Tercil Suave: 3% a &approx;7%; Tercil Médio: &approx;7% a &approx;13%; Tercil Forte: &approx;13% a 20,0%).", styles["BulletText"]))
    story.append(Paragraph("• <b>Frequência Histórica de Solo Exposto (E_hat):</b> 3 tercis empíricos de frequência de solo nu no intervalo [0, 1] (fração de cenas válidas com NDVI &le; 0,25 da série Sentinel-2; D10).", styles["BulletText"]))
    story.append(Paragraph("• <b>Erodibilidade Pedológica do Solo (K_hat; Decisão D09):</b> 2 níveis derivados da carta oficial da Embrapa Solos (Doc. 246/2024; D14): Nível 1 = Baixa/Média (classes 1 a 3, K <= 0,0285) e Nível 2 = Alta/Muito Alta (classes 4 e 5, K >= 0,0300 Mg h MJ^-1 mm^-1). Total: 3 x 3 x 2 = 18 estratos canônicos.", styles["BulletText"]))
    story.append(Paragraph(
        "Para controlar a autocorrelação espacial entre candidatos do mesmo estrato, aplica-se o <i>Spatial Thinning</i> geodésico "
        "determinístico (algoritmo de Fisher-Yates com raio mínimo de exclusão r &ge; 1,0 km; regra P02).",
        styles["Body"]
    ))
    
    # Quebra limpa para a Página 3: Formulações Matemáticas e VANT
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 3: SUPORTE NATIVO, SENSORES, FÓRMULAS HARMONICA, ALVO E RUSLE
    # =========================================================================
    story.append(Paragraph("3.3 Unidade de Análise e Suporte Espacial Nativo Declarado (Decisão D06)", styles["H2"]))
    story.append(Paragraph(
        "A unidade de predição e análise do sistema é a <b>célula de 10 x 10 m do produto Sentinel-2 MSI Nível-2A</b> em sua grade nativa. "
        "Em estrito cumprimento ao Invariante de Suporte Espacial (D06 e D24), nenhum preditor de resolução mais grossa é reamostrado para "
        "fingir suporte centimétrico. O relevo retém o suporte nativo de 30 m (Copernicus DEM, D21), a erodibilidade K retém o suporte do "
        "polígono cartográfico da Embrapa Solos (D14), e a chuva retém a grade regional CHIRPS de 5 km (D13), eliminando a pseudorreplicação.",
        styles["Body"]
    ))
    
    story.append(Paragraph("3.4 Sensoriamento Orbital e Preditores Espectro-Temporais", styles["H2"]))
    story.append(Paragraph(
        "A partir da coleção Sentinel-2 L2A (BOA Harmonized), preservando a máscara SCL de nuvens e sombras (Regra 7), "
        "ajusta-se para cada pixel o modelo de <b>Decomposição Harmônica Multivariada OLS</b> (ZHU; WOODCOCK, 2014):",
        styles["Body"]
    ))
    
    f1_box = [
        [
            Paragraph("<b>&rho;^(t) = c<sub>0</sub> + c<sub>1</sub>·t + &sum;<sub>i=1</sub><sup>2</sup> [ a<sub>i</sub>·cos(2&pi;·i·t / T) + b<sub>i</sub>·sin(2&pi;·i·t / T) ]</b>", styles["FormulaBox"]),
            Paragraph("onde t é o tempo, T = 365,25 dias, c0 é a refletância média, c1 a tendência linear, e (ai, bi) são coeficientes harmônicos sazonais.", styles["FormulaNote"])
        ]
    ]
    t_f1 = Table(f1_box, colWidths=[170 * mm])
    t_f1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_BG_PAGE),
        ('BOX', (0,0), (-1,-1), 0.6, C_BORDER),
        ('PADDING', (0,0), (-1,-1), 2.8),
    ]))
    story.append(t_f1)
    story.append(Spacer(1, 1.2 * mm))
    
    story.append(Paragraph("3.5 Sensoriamento Aerotransportado (VANT) e Definição do Alvo Contínuo (Decisões D16 e D26)", styles["H2"]))
    story.append(Paragraph(
        "A sinergia multiescala entre sensoriamento orbital e imageamento centimétrico por VANT é referencial metodológico moderno "
        "para calibração de modelos biofísicos de superfície (ALVAREZ-VANHARD et al., 2021; WOODCOCK; STRAHLER, 1987). "
        "A campanha opera o VANT <b>Spectral 2 (Nuvem UAV)</b>, com 5 bandas calibradas (Azul, Verde, Vermelho, RedEdge 717 nm e NIR 840 nm), "
        "sensor de irradiância descendente, GSD médio medido de 3,8 cm e acurácia posicional CE90 de 1,47 m. "
        "Conforme a Decisão D16, foram planejados <b>72 polígonos amostrais de 5,02 ha</b> (4 por estrato biofísico). "
        "A adoção de 5,02 ha ajusta o desenho à malha fundiária da BP3 (mediana de 11,7 ha), elevando a elegibilidade de propriedades de 43,4% para até 71,8%. "
        "Em cada quarteto de estrato, <b>2 polígonos vão para treino e 2 polígonos são lacrados como teste independente (*held-out*)</b>.",
        styles["Body"]
    ))
    story.append(Paragraph(
        "Sobre o ortomosaico centimétrico, especialistas executam a vetorização pericial das feições diagnósticas (pedestais, raízes expostas, "
        "microssulcos e leques coluviais). A máscara é rasterizada para a célula de 10 m, definindo o <b>alvo primário contínuo</b> (D26):",
        styles["Body"]
    ))
    
    f2_box = [
        [
            Paragraph("<b>y<sub>i</sub> = ( Área Delineada como Erodida no VANT dentro da célula 10x10 m ) / ( 100 m² ) &isin; [0, 1]</b>", styles["FormulaBox"]),
            Paragraph("Alvo secundário derivado para reporte de métricas clássicas (AUC): célula positiva se y_i &ge; 0,25 (25 m² de erosão ativa).", styles["FormulaNote"])
        ]
    ]
    t_f2 = Table(f2_box, colWidths=[170 * mm])
    t_f2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_MINT_BG),
        ('BOX', (0,0), (-1,-1), 0.8, C_EMERALD_MID),
        ('PADDING', (0,0), (-1,-1), 2.8),
    ]))
    story.append(t_f2)
    story.append(Spacer(1, 1.2 * mm))
    
    story.append(Paragraph("3.6 A Linha de Base Analítica RUSLE Regionalizada", styles["H2"]))
    story.append(Paragraph(
        "A linha de base analítica implementa a Equação Universal de Perda de Solo Revisada (RUSLE; RENARD et al., 1997): "
        "<b>A = R · K · LS · C · P</b> (Mg ha^-1 ano^-1), parametrizada com equações regionais auditadas do Paraná:",
        styles["Body"]
    ))
    story.append(Paragraph("• <b>Fator R (Erosividade da Chuva; D13):</b> Calculado via climatologia CHIRPS mensal usando a equação regional do Paraná por Rufino et al. (1993) e Waltrick et al. (2010/2015), com proveniência estritamente `modelado` e tolerância de +-10% para a BP3:", styles["BulletText"]))
    
    f_r_box = [
        [
            Paragraph("<b>EI<sub>30</sub> = 67,355 · ( p² / P )<sup>0,8522</sup></b> &nbsp;&nbsp;&nbsp;&rArr;&nbsp;&nbsp;&nbsp; <b>R = &sum;<sub>mês=1</sub><sup>12</sup> EI<sub>30, mês</sub></b>", styles["FormulaBox"]),
            Paragraph("onde p é a precipitação média mensal (mm) e P é a precipitação média anual (mm).", styles["FormulaNote"])
        ]
    ]
    t_fr = Table(f_r_box, colWidths=[170 * mm])
    t_fr.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_BG_PAGE),
        ('BOX', (0,0), (-1,-1), 0.6, C_BORDER),
        ('PADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t_fr)
    story.append(Spacer(1, 1.0 * mm))
    
    story.append(Paragraph("• <b>Fator K (Erodibilidade; D14):</b> Campo numérico `k_solos` da camada GeoServer oficial da Embrapa Solos (Doc. 246/2024; Latossolos: 0,0130 a 0,0170; Nitossolos: 0,0240 a 0,0280 Mg h MJ^-1 mm^-1), com proveniência `tabelado`.", styles["BulletText"]))
    story.append(Paragraph("• <b>Fator LS Bidimensional (D15):</b> Fluxo acumulado de Desmet & Govers (1996) com expoentes m e S da RUSLE (RENARD et al., 1997) sobre Copernicus DEM 30 m (D21) em SIRGAS 2000 UTM 22S (EPSG:31982).", styles["BulletText"]))
    story.append(Paragraph("• <b>Fator C Regional Tropical (D01, D20):</b> Mapeado dinamicamente via NDVI pela equação tropical de Durigon et al. (2014): <b>C = (1 - NDVI) / 2</b>, modulada por BSI sob Plantio Direto.", styles["BulletText"]))
    story.append(Paragraph("• <b>Fator P (Práticas Conservacionistas; D22):</b> Fixado em 1,0 na bacia (linha de base conservadora; RENARD et al., 1997) e derivado por observação estratificada por declividade nos sítios visitados.", styles["BulletText"]))
    
    # Quebra limpa para a Página 4: XGBoost e Tabelas Síntese
    story.append(PageBreak())
    
    # =========================================================================
    # PÁGINA 4: XGBOOST TWEEDIE, TETO POR BLOCO, FALSIFICABILIDADE E TABELAS SÍNTESE
    # =========================================================================
    story.append(Paragraph("3.7 Modelagem Preditiva XGBoost Tweedie, Teto por Bloco e Falsificabilidade (D24 e D25)", styles["H2"]))
    story.append(Paragraph(
        "<b>Tratamento de Excesso de Zeros:</b> Devido à predominância de células agrícolas sem erosão ativa, o ajuste contínuo y &isin; [0, 1] "
        "emprega o algoritmo XGBoost com a distribuição <b>Tweedie (`reg:tweedie`)</b> (CHEN; GUESTRIN, 2016), que modela conjuntamente a "
        "massa em zero e a cauda contínua positiva, respeitando restrições físicas de monotonicidade em declividade e solo exposto.",
        styles["Body"]
    ))
    story.append(Paragraph(
        "<b>Regime de Dados e Teto de Preditores por Bloco (Decisão D24):</b> Para evitar sobreajuste decorrente da assimetria de suporte "
        "espacial e unidades efetivas independentes a alcance de 50 m, o SAREL estabelece tetos rígidos por bloco físico: "
        "<b>Bloco Espectro-Temporal:</b> máx. 8 preditores (~1.845 unidades efetivas); <b>Bloco de Terreno:</b> máx. 4 preditores (~396 unidades efetivas); "
        "<b>Bloco de Solo:</b> exatamente 1 preditor (a erodibilidade K oficial `k_solos`); e <b>Bloco de Chuva:</b> exatamente 1 preditor "
        "(o fator R de erosividade). <b>Totalizando no máximo 14 variáveis na matriz preditora (Decisão D24)</b>.",
        styles["Body"]
    ))
    story.append(Paragraph(
        "<b>Prevenção de Vazamento Espacial e Falsificabilidade Pré-Registrada (D25):</b> Seguindo os preceitos de reprodutibilidade "
        "(PINEAU et al., 2021) e combate a vazamento de dados em ecologia espacial (PLOTON et al., 2020), o modelo adota <i>Spatial Block "
        "Cross-Validation</i> guiada pelo alcance do variograma (a &approx; 50 m; ROBERTS et al., 2017). "
        "Em estrito cumprimento ao protocolo de pré-registro científico (NOSEK et al., 2018), a avaliação final ocorre <b>exclusivamente uma única vez "
        "sobre os 36 polígonos lacrados de teste independente (held-out de D16)</b>. A hipótese é corroborada se rho_XGBoost &ge; 0,40 "
        "E Delta rho = (rho_XGBoost - rho_RUSLE) &ge; 0,10, avaliados sobre o IC 95% derivado de 1.000 iterações de Bootstrap agrupado "
        "por polígono (CAMERON; GELBACH; MILLER, 2008). Três desfechos são formalizados: Corroboração, Refutação e Inconclusiva pela Margem.",
        styles["Body"]
    ))
    story.append(Spacer(1, 1.2 * mm))
    
    story.append(Paragraph("4. Tabelas Síntese da Metodologia e Desenho Experimental", styles["H1"]))
    
    # Tabela 1 em KeepTogether para impedir título órfão
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
        ('PADDING', (0,0), (-1,-1), 1.8),
    ]))
    tab1_elements.append(t_est)
    story.append(KeepTogether(tab1_elements))
    story.append(Spacer(1, 1.5 * mm))
    
    # Tabela 2 em KeepTogether para impedir divisão espúria
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
        ('PADDING', (0,0), (-1,-1), 1.8),
    ]))
    tab2_elements.append(t_pred)
    story.append(KeepTogether(tab2_elements))
    
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
        
    doc.build(story, canvasmaker=SarelNumberedCanvas)
    print(f"PDF 2 recompilado com sucesso: {pdf_path} ({os.path.getsize(pdf_path)} bytes)")

if __name__ == "__main__":
    build_pdf()
