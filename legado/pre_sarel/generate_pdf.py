import os
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def create_pdf(output_pdf_path):
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=landscape(letter),
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    C_DARK = colors.HexColor("#0F172A")
    C_CARD = colors.HexColor("#1E293B")
    C_BORDER = colors.HexColor("#334155")
    C_EMERALD = colors.HexColor("#10B981")
    C_CYAN = colors.HexColor("#06B6D4")
    C_INDIGO = colors.HexColor("#6366F1")
    C_AMBER = colors.HexColor("#F59E0B")
    C_ROSE = colors.HexColor("#F43F5E")
    C_WHITE = colors.HexColor("#F8FAFC")
    C_LIGHT = colors.HexColor("#CBD5E1")
    C_MUTED = colors.HexColor("#94A3B8")

    # Typography Styles
    style_category = ParagraphStyle(
        "Category",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        textColor=C_EMERALD,
        spaceAfter=4,
    )
    style_title = ParagraphStyle(
        "SlideTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        textColor=C_WHITE,
        spaceAfter=12,
    )
    style_card_title = ParagraphStyle(
        "CardTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=C_EMERALD,
        spaceAfter=6,
    )
    style_card_title_cyan = ParagraphStyle(
        "CardTitleCyan",
        parent=style_card_title,
        textColor=C_CYAN,
    )
    style_card_title_indigo = ParagraphStyle(
        "CardTitleIndigo",
        parent=style_card_title,
        textColor=C_INDIGO,
    )
    style_card_title_amber = ParagraphStyle(
        "CardTitleAmber",
        parent=style_card_title,
        textColor=C_AMBER,
    )
    style_card_title_rose = ParagraphStyle(
        "CardTitleRose",
        parent=style_card_title,
        textColor=C_ROSE,
    )
    style_body = ParagraphStyle(
        "CardBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        textColor=C_LIGHT,
        leading=13,
        spaceAfter=4,
    )
    style_cover_badge = ParagraphStyle(
        "CoverBadge",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=C_EMERALD,
        alignment=1,
        spaceAfter=15,
    )
    style_cover_title = ParagraphStyle(
        "CoverTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        textColor=C_WHITE,
        alignment=1,
        leading=28,
        spaceAfter=15,
    )
    style_cover_sub = ParagraphStyle(
        "CoverSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=13,
        textColor=C_CYAN,
        alignment=1,
        leading=17,
        spaceAfter=25,
    )

    story = []

    def make_card_table(title_para, body_paras, width=345, height=350, border_color=C_BORDER):
        card_content = [title_para] + body_paras
        t = Table([[card_content]], colWidths=[width])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), C_CARD),
            ("BOX", (0, 0), (-1, -1), 1.2, border_color),
            ("PADDING", (0, 0), (-1, -1), 12),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        return t

    def add_two_column_slide(cat, title, card1_title, card1_lines, card2_title, card2_lines, c1_color="emerald", c2_color="emerald"):
        story.append(Paragraph(cat.upper(), style_category))
        story.append(Paragraph(title, style_title))

        title1_style = style_card_title if c1_color == "emerald" else (style_card_title_cyan if c1_color == "cyan" else (style_card_title_indigo if c1_color == "indigo" else (style_card_title_amber if c1_color == "amber" else style_card_title_rose)))
        title2_style = style_card_title if c2_color == "emerald" else (style_card_title_cyan if c2_color == "cyan" else (style_card_title_indigo if c2_color == "indigo" else (style_card_title_amber if c2_color == "amber" else style_card_title_rose)))

        b1_paras = [Paragraph(line, style_body) for line in card1_lines]
        b2_paras = [Paragraph(line, style_body) for line in card2_lines]

        card1 = make_card_table(Paragraph(card1_title, title1_style), b1_paras, width=355)
        card2 = make_card_table(Paragraph(card2_title, title2_style), b2_paras, width=355)

        two_col_table = Table([[card1, card2]], colWidths=[360, 360])
        two_col_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))

        story.append(two_col_table)
        story.append(PageBreak())

    # =========================================================================
    # SLIDE 1: Capa
    # =========================================================================
    story.append(Spacer(1, 40))
    story.append(Paragraph("PROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO (PPGTCA - 2026)", style_cover_badge))
    story.append(Paragraph("Metodologia Geoespacial de Detecção, Triagem e Priorização de Focos de Erosão Laminar", style_cover_title))
    story.append(Paragraph("Pipeline Algorítmico no Google Earth Engine, Estratificação Físico-Pedológica e Amostragem para Coletas de Campo no Paraná", style_cover_sub))

    cover_card_content = [
        Paragraph("<b>Linha de Pesquisa:</b> Sensoriamento Remoto, Inteligência Geoespacial e Conservação de Solos", style_body),
        Paragraph("<b>Objetivo da Apresentação:</b> Detalhamento minucioso do fluxo metodológico e procedimentos algorítmicos no Earth Engine para averiguação e orientação científica.", style_body),
        Paragraph("<b>Aplicação:</b> Plataforma Web 2D/3D Integrada ao GEE com Validação de Campo (GNSS RTK / KoboToolbox).", style_body),
    ]
    t_cover = Table([[cover_card_content]], colWidths=[700])
    t_cover.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), C_CARD),
        ("BOX", (0, 0), (-1, -1), 1.2, C_CYAN),
        ("PADDING", (0, 0), (-1, -1), 14),
    ]))
    story.append(t_cover)
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 2: Problema Científico
    # =========================================================================
    add_two_column_slide(
        "1. Contextualização Científica",
        "O Desafio da Erosão Laminar e a Motivação da Pesquisa",
        "O Fenômeno da Erosão Laminar (Sheet Erosion)",
        [
            "<b>• Processo Difuso:</b> Desprendimento e arraste uniforme da camada superficial (horizonte A) pela ação do salpicamento (splash) e escoamento difuso.",
            "<b>• Ausência de Incisões Iniciais:</b> Ao contrário de voçorocas e ravinas, a erosão laminar não produz cicatrizes visíveis imediatas no relevo nos primeiros anos.",
            "<b>• Impacto Silencioso:</b> Perda severa de fertilidade, matéria orgânica e assoreamento/contaminação de mananciais hídricos no Paraná.",
            "<b>• Desafio de Escala:</b> O estado possui ~200.000 km²; é inviável varrer presencialmente todas as microbacias agrícolas sem um método de pré-triagem geoespacial.",
        ],
        "A Proposta Metodológica da Pesquisa",
        [
            "<b>• Pipeline Determinístico no GEE:</b> Filtrar o território paranaense combinando satélites multiespectrais, modelos digitais de elevação e regras agronômicas.",
            "<b>• Seleção de Alvos de Campo:</b> Gerar candidatos preliminares com máxima representatividade pedoclimática para orientar as equipes de solo.",
            "<b>• Base para Inteligência Artificial:</b> O objetivo da triagem é obter os talhões-piloto onde as campanhas presenciais rotularão os dados reais para treinar modelos preditivos (XGBoost / SHAP).",
            "<b>• Rastreabilidade Aberta:</b> Auditoria matemática completa de cada fator biofísico.",
        ],
        c1_color="amber",
        c2_color="emerald",
    )

    # =========================================================================
    # SLIDE 3: Arquitetura Geral
    # =========================================================================
    story.append(Paragraph("2. Arquitetura Metodológica", style_category))
    story.append(Paragraph("Visão Geral das 5 Fases do Processamento Espacial", style_title))

    flow_headers = [
        Paragraph("<b>1. Definição AOI</b>", style_card_title_cyan),
        Paragraph("<b>2. Elegibilidade 10m</b>", style_card_title),
        Paragraph("<b>3. Estrato 2x3</b>", style_card_title_indigo),
        Paragraph("<b>4. Thinning</b>", style_card_title_amber),
        Paragraph("<b>5. Validação</b>", style_card_title_rose),
    ]
    flow_content = [
        [
            Paragraph("• Limite IBGE oficial<br/>• Polígono customizado<br/>• Gradeamento em tiles se área > 0.5°", style_body),
            Paragraph("• WorldCover (30,40,60)<br/>• Declividade 3% a 20%<br/>• Buffer 30m de corpos d'água", style_body),
            Paragraph("• Relevo (≤6%, 6-12%, >12%)<br/>• Pedologia (K Grupo A / B)<br/>• Amostragem estratificada", style_body),
            Paragraph("• Raio Haversine (1.0 km)<br/>• Ranking PriorityScore<br/>• Eliminação de redundância", style_body),
            Paragraph("• Cálculo RUSLE (R,K,LS)<br/>• Pareamento KoboToolbox<br/>• Dataset IA para treino", style_body),
        ]
    ]
    t_flow = Table([[flow_headers[0], flow_headers[1], flow_headers[2], flow_headers[3], flow_headers[4]], flow_content[0]], colWidths=[140, 145, 145, 145, 145])
    t_flow.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), C_CARD),
        ("BOX", (0, 0), (-1, -1), 1.2, C_BORDER),
        ("GRID", (0, 0), (-1, -1), 0.8, C_BORDER),
        ("PADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(t_flow)
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 4: Critério 1 - Uso da Terra
    # =========================================================================
    add_two_column_slide(
        "3. Máscara de Elegibilidade",
        "Critério 1 — Uso do Solo e Cobertura Vegetal (ESA WorldCover 10m)",
        "Base de Dados e Classes Selecionadas",
        [
            "<b>• Coleção GEE:</b> 'ESA/WorldCover/v200/2021'",
            "<b>• Resolução Espacial:</b> 10 metros nativa",
            "<b>• Sensor:</b> Fusão multiespectral Sentinel-1 SAR + Sentinel-2 MSI",
            "<b>• Classes Agronômicas Selecionadas:</b>",
            "  - <i>Cropland (40):</i> Lavouras anuais e perenes sob manejo agrícola;",
            "  - <i>Grassland (30):</i> Pastagens cultivadas e campos limpos;",
            "  - <i>Bare / sparse (60):</i> Solo exposto e vegetação esparsa.",
        ],
        "Exclusões Rigorosas e Justificativa",
        [
            "<b>• Classes Excluídas:</b>",
            "  - <i>Tree cover (10):</i> Florestas e matas ciliares (alta cobertura e interceptação foliar);",
            "  - <i>Built-up (50):</i> Áreas urbanizadas e rodovias;",
            "  - <i>Permanent water (80):</i> Corpos d'água permanentes.",
            "<b>• Operação GEE:</b>",
            "  lcMask = image.remap([30, 40, 60], [1, 1, 1], 0)",
            "<b>• Benefício:</b> Garante que 100% dos pixels amostrados pertençam a áreas sob risco real de escoamento e manejo agrícola.",
        ],
        c1_color="cyan",
        c2_color="emerald",
    )

    # =========================================================================
    # SLIDE 5: Critério 2 - Declividade
    # =========================================================================
    add_two_column_slide(
        "4. Máscara de Elegibilidade",
        "Critério 2 — Declividade e Relevo (Copernicus DEM GLO-30)",
        "Equação e Projeção Métrica",
        [
            "<b>• Coleção:</b> 'COPERNICUS/DEM/GLO30' (Resolução 30m)",
            "<b>• Reprojeção Métrica Explícita:</b>",
            "  .setDefaultProjection('EPSG:3857', null, 30)",
            "  <i>Garante que tanto a elevação z quanto a grade horizontal x,y estejam cotadas em metros.</i>",
            "<b>• Cálculo da Declividade:</b>",
            "  θ = ee.Terrain.slope(DEM_metrico)  [graus]",
            "  S% = tan(θ · π / 180) × 100  [porcentagem]",
            "<b>• Faixa Ativa:</b> 3.0% ≤ S% ≤ 20.0%",
        ],
        "Fundamentação Agronômica e Normativa",
        [
            "<b>• Por que excluir declividades < 3%?</b>",
            "  Áreas extremamente planas têm predomínio de escoamento muito lento e deposição/infiltração, sem energia cinética para arraste difuso severo.",
            "<b>• Por que limitar em 20%?</b>",
            "  Declividades > 20% no SiBCS (relevo forte-ondulado a montanhoso) favorecem rápida concentração em sulcos e ravinas, saindo do escopo estrito de erosão laminar.",
            "<b>• Referência:</b> Bertoni & Lombardi Neto (2017) e Critérios de Aptidão Agrícola das Terras (Embrapa/SiBCS).",
        ],
        c1_color="emerald",
        c2_color="amber",
    )

    # =========================================================================
    # SLIDE 6: Critério 3 - Exclusão Hídrica
    # =========================================================================
    add_two_column_slide(
        "5. Máscara de Elegibilidade",
        "Critério 3 — Corpos d'Água e Buffer Morfológico de 30 metros",
        "Base de Dados e Processamento",
        [
            "<b>• Coleção GEE:</b> 'JRC/GSW1_4/GlobalSurfaceWater'",
            "<b>• Banda de Análise:</b> 'occurrence' (0 a 100% de persistência hídrica histórica).",
            "<b>• Limiar de Identificação de Água:</b> occurrence > 10%",
            "<b>• Buffer Morfológico de Segurança:</b>",
            "  waterMask = occurrence.gt(10)",
            "  waterBuffered = waterMask.focalMax(30, 'circle', 'meters')",
            "  waterEligible = waterBuffered.unmask(0).not()",
        ],
        "Prevenção de Falsos Positivos",
        [
            "<b>• Eliminação de Assinaturas Espectrais Úmidas:</b> Várzeas e banhados possuem alta umidade e matéria orgânica acumulada que podem falsear índices de solo.",
            "<b>• Respeito às APPs:</b> Conformidade com as faixas marginais de proteção de cursos d'água da Lei 12.651/2012.",
            "<b>• Isolamento Hidrológico:</b> Garante que os candidatos amostrados reflitam vertentes agrícolas de lavoura e não processos de erosão marginal de rios.",
        ],
        c1_color="cyan",
        c2_color="indigo",
    )

    # =========================================================================
    # SLIDE 7: Interseção e Diagnóstico
    # =========================================================================
    add_two_column_slide(
        "6. Interseção Lógica & Diagnóstico",
        "Interseção da Máscara e Instrumentação Empírica de Pixels",
        "Interseção Booleana Raster",
        [
            "<b>• Equação de Elegibilidade Total:</b>",
            "  Eligibility = lcMask ∧ slopeEligible ∧ waterEligible",
            "<b>• Recorte Vetorial:</b>",
            "  EligibilityMasked = Eligibility.updateMask(Eligibility.eq(1)).clip(AOI)",
            "<b>• Propagação no Grafo:</b>",
            "  Todas as bandas biofísicas herdam a máscara antes de qualquer amostragem.",
        ],
        "Instrumentação Diagnóstica Empírica (Passo 0)",
        [
            "<b>• Reducer de Auditoria (reduceRegion 30m):</b>",
            "  Contagem precisa de pixels para cada filtro isolado e combinado.",
            "<b>• Evidência Empírica em Céu Azul (PR):</b>",
            "  - Uso do Solo (Classes 30/40/60): <b>288.829 pixels</b>",
            "  - Fora de Corpos d'Água (JRC): <b>1.441.895 pixels</b>",
            "  - Declividade Física (Copernicus DEM): <b>Aprovada</b>",
            "<b>• Total Transparência:</b> Exposta diretamente na interface web.",
        ],
        c1_color="emerald",
        c2_color="cyan",
    )

    # =========================================================================
    # SLIDE 8: Estratificação Cruzada
    # =========================================================================
    add_two_column_slide(
        "7. Fase 2 — Estratificação Cruzada",
        "Matriz 2 x 3: Relevo × Pedologia (Sub-Estratos A1 a B3)",
        "A Matriz Estruturada de 6 Sub-Estratos",
        [
            "<b>• Eixo Topográfico:</b>",
            "  - Classe 1: Suave (Declividade ≤ 6%)",
            "  - Classe 2: Moderada (6% < Declividade ≤ 12%)",
            "  - Classe 3: Forte (Declividade > 12%)",
            "<b>• Eixo Pedológico de Erodibilidade (K):</b>",
            "  - <i>Grupo A (Alta Erodibilidade):</i> Argissolos Vermelho-Amarelos, Neossolos (K ≈ 0.045)",
            "  - <i>Grupo B (Média/Baixa Erodibilidade):</i> Latossolos Vermelhos, Nitossolos (K ≈ 0.020)",
            "<b>• Banda Raster 'STRATUM':</b> Códigos 1 a 6 (A1 a B3).",
        ],
        "Amostragem Estratificada no GEE",
        [
            "<b>• Execução no Earth Engine:</b>",
            "  image.stratifiedSample({<br/>"
            "    numPoints: ceil(targetCount / 6) * 3,<br/>"
            "    classBand: 'STRATUM',<br/>"
            "    region: AOI, scale: 30, dropNulls: true<br/>"
            "  })",
            "<b>• Vantagem Estatística:</b> Elimina o viés de superamostrar topos planos homogêneos e assegura que terrenos de alta suscetibilidade entrem na cota amostral.",
        ],
        c1_color="indigo",
        c2_color="emerald",
    )

    # =========================================================================
    # SLIDE 9: Thinning Espacial
    # =========================================================================
    add_two_column_slide(
        "8. Fase 3 — Thinning Espacial",
        "Desaglomeração Geodésica de Haversine & Priority Score",
        "O Problema da Autocorrelação Espacial",
        [
            "<b>• Primeira Lei da Geografia (Tobler):</b> Pixels vizinhos tendem a ter valores biofísicos muito semelhantes.",
            "<b>• Risco de Aglomeração:</b> Se 5 pontos forem sorteados no mesmo talhão agrícola a 50m de distância, haverá desperdício de recursos na campanha de campo.",
            "<b>• Solução:</b> Algoritmo de Thinning Espacial Geodésico com distância mínima configurável (ex: 1.0 km).",
        ],
        "Algoritmo Guloso de Seleção",
        [
            "1. <b>Ordenação por Prioridade:</b> Os pontos são ordenados pelo <i>PriorityScore</i> decrescente.",
            "2. <b>Filtro Geodésico:</b> Para cada candidato P<sub>i</sub>, verifica se a distância de Haversine para todos os pontos já aceitos é ≥ minSpacingKm.",
            "3. <b>Decisão:</b> Se houver sobreposição na vizinhança, o ponto de maior score vence e os redundantes são descartados.",
            "4. <b>Resultado:</b> Malha amostral ampla, homogênea e com máxima cobertura territorial.",
        ],
        c1_color="amber",
        c2_color="emerald",
    )

    # =========================================================================
    # SLIDE 10: Modelagem RUSLE
    # =========================================================================
    add_two_column_slide(
        "9. Modelagem Físico-Matemática",
        "Equação Universal de Perda de Solo (RUSLE) & Fator R Climatológico",
        "Equação Universal de Perda de Solo (RUSLE)",
        [
            "<b>A = R × K × LS × C × P</b>",
            "• <b>A:</b> Perda média anual de solo estimada (t/ha/ano);",
            "• <b>R:</b> Fator erosividade da chuva (MJ·mm / ha·h·ano);",
            "• <b>K:</b> Fator erodibilidade do solo (t·h / ha·MJ·mm);",
            "• <b>LS:</b> Fator topográfico comprimento-declividade;",
            "• <b>C:</b> Fator de uso, cobertura e manejo do solo;",
            "• <b>P:</b> Fator de práticas conservacionistas de suporte (default 1.0).",
        ],
        "Fator R — Climatologia Real NASA POWER",
        [
            "<b>• Fonte:</b> Reanálise MERRA-2 (NASA POWER API, série 2001-2020).",
            "<b>• Equação de Lombardi Neto & Moldenhauer (1992):</b>",
            "  R = 68.730 × (p² / P)<sup>0.841</sup>",
            "  <i>p: precipitação média do mês mais chuvoso (mm);</i><br/>"
            "  <i>P: precipitação média anual acumulada (mm).</i>",
            "<b>• Rigor Científico:</b> Climatologia real do ponto sem valores estáticos arbitrados.",
        ],
        c1_color="cyan",
        c2_color="emerald",
    )

    # =========================================================================
    # SLIDE 11: Índices Espectrais e Severidade
    # =========================================================================
    add_two_column_slide(
        "10. Índices Espectrais e Severidade",
        "Bare Soil Index (BSI Sentinel-2) & Score de Prioridade",
        "Bare Soil Index (BSI) & NDVI",
        [
            "<b>• Satélite:</b> Copernicus Sentinel-2 MSI Harmonized L2A.",
            "<b>• Bare Soil Index (BSI):</b>",
            "  BSI = [(B12 + B4) - (B8 + B2)] / [(B12 + B4) + (B8 + B2)]",
            "• <b>BSI > +0.35:</b> Solo totalmente exposto e pulverizado;",
            "• <b>+0.05 ≤ BSI ≤ +0.35:</b> Palhada esparsa ou lavoura jovem;",
            "• <b>NDVI = (B8 - B4) / (B8 + B4):</b> Vigor vegetal e derivação do Fator C.",
        ],
        "Severidade e Score de Prioridade (0 a 100)",
        [
            "<b>• Matriz de Severidade:</b>",
            "  Cruza Declividade (S%), BSI e Erodibilidade Pedológica (K) para classificar em: <i>Moderada</i>, <i>Alta</i> ou <i>Crítica</i>.",
            "<b>• Score de Prioridade Numérico (0 a 100):</b>",
            "  Ponderação multivariada: Severidade (50%) + BSI (25%) + Declividade (25%).",
            "<b>• Finalidade:</b> Ordenação objetiva para o Thinning e planejamento de rotas de campo.",
        ],
        c1_color="cyan",
        c2_color="indigo",
    )

    # =========================================================================
    # SLIDE 12: Arquitetura & Segurança
    # =========================================================================
    add_two_column_slide(
        "11. Arquitetura de Software & Segurança",
        "Plataforma Web 3D & Sessão Criptografada no Servidor",
        "Stack de Tecnologias & Performance",
        [
            "<b>• Framework:</b> Next.js 14 (App Router) + React 18 + TypeScript estrito.",
            "<b>• Motor 3D:</b> MapLibre GL JS v4+ acelerado por WebGL.",
            "<b>• Relevo Tridimensional:</b> Malha DEM Terrarium AWS com inclinação (pitch 62°) e iluminação em tempo real.",
            "<b>• Estado Reativo:</b> Zustand com hooks memoizados para renderização em 60 FPS.",
        ],
        "Segurança de Credenciais da Service Account",
        [
            "<b>• Autenticação Google OAuth2 Real:</b> Assinatura de JWT RS256 via módulo nativo crypto do Node.js.",
            "<b>• Sessão Segura httpOnly:</b> A chave privada NUNCA é salva em localStorage. Ela vive na memória do servidor associada a um cookie seguro de 12 horas.",
            "<b>• Zero Vazamento:</b> Nenhuma chave embutida no repositório ou exposta ao cliente.",
        ],
        c1_color="cyan",
        c2_color="emerald",
    )

    # =========================================================================
    # SLIDE 13: Validação de Campo (KoboToolbox)
    # =========================================================================
    add_two_column_slide(
        "12. Ciclo de Validação de Campo",
        "KoboToolbox → Pareamento Automático → Dataset de Treinamento",
        "Protocolo de Coleta em Campo",
        [
            "<b>• Equipamentos:</b> GNSS Geodésico RTK e VANT Multiespectral.",
            "<b>• Formulário Digital:</b> KoboToolbox / ODK Collect.",
            "<b>• Indicadores de Campo:</b>",
            "  - Altura de pedestais de erosão (mm);",
            "  - Descalçamento radicular de plantas;",
            "  - Espessura de crosta de selamento superficial;",
            "  - Depósitos de arraste nos baixios.",
        ],
        "Pareamento e Dataset para IA",
        [
            "<b>• Parser de Validação (koboParser.ts):</b>",
            "  Lê o export CSV do Kobo e casa cada ponto de campo com o foco pré-triado mais próximo (< 150m).",
            "<b>• Atualização de Proveniência:</b> Status passa para <i>field-validated</i>.",
            "<b>• Exportação para IA:</b> Gera o dataset rotulado para futuro treino do XGBoost e interpretabilidade SHAP.",
        ],
        c1_color="amber",
        c2_color="emerald",
    )

    # =========================================================================
    # SLIDE 14: Coleções Salvas
    # =========================================================================
    add_two_column_slide(
        "13. Projetos & Coleções Salvas",
        "Persistência no Navegador e Interoperabilidade Científica",
        "Persistência e Recarregamento Local",
        [
            "<b>• Histórico de Campanhas:</b> O pesquisador pode salvar a seleção de candidatos no navegador com nome e observações.",
            "<b>• Recarregamento com 1 Clique:</b> Restaura os pontos, a AOI delimitada e os filtros, acionando o enquadramento suave da câmera 3D.",
            "<b>• Portabilidade:</b> Exportação e importação de arquivos de projeto .json entre diferentes computadores.",
        ],
        "Interoperabilidade Científica Multiformato",
        [
            "<b>• GeoJSON:</b> Camadas com geometria e atributos para SIGs desktop (QGIS, ArcGIS Pro);",
            "<b>• KML 3D:</b> Visualização imersiva no Google Earth Pro com popups formatados;",
            "<b>• CSV Científico:</b> Coordenadas em DD e DMS, fatores RUSLE e variáveis para R/Python;",
            "<b>• Dataset XGBoost:</b> Apenas pontos validados em campo.",
        ],
        c1_color="cyan",
        c2_color="indigo",
    )

    # =========================================================================
    # SLIDE 15: Rigor e Testes
    # =========================================================================
    add_two_column_slide(
        "14. Rigor Metodológico & Testes",
        "Suíte Automatizada com 99 Testes Unitários e Tipagem Estrita",
        "Suíte de Testes Automatizados (Vitest)",
        [
            "<b>• 14 Arquivos de Teste | 99 Testes Unitários Aprovados:</b>",
            "  - Equações RUSLE e limites de severidade;",
            "  - Assinatura criptográfica de tokens RSA JWT;",
            "  - Algoritmo de Thinning de Haversine;",
            "  - Estratificação cruzada e máscara de elegibilidade;",
            "  - Pareamento de formulários KoboToolbox;",
            "  - Persistência e restauração de coleções de focos.",
        ],
        "Garantias de Confiabilidade e Reprodutibilidade",
        [
            "<b>• Tipagem Estrita TypeScript:</b> npx tsc --noEmit (0 erros).",
            "<b>• Build de Produção Validado:</b> Next.js 14 compilado e otimizado com sucesso.",
            "<b>• Reprodutibilidade Total:</b> Qualquer pesquisador pode reproduzir os passos no GEE e obter exatamente os mesmos alvos.",
        ],
        c1_color="emerald",
        c2_color="cyan",
    )

    # =========================================================================
    # SLIDE 16: Conclusões e Próximos Passos
    # =========================================================================
    add_two_column_slide(
        "15. Conclusões e Próximos Passos",
        "Contribuições da Metodologia e Continuidade do Mestrado",
        "Contribuições Científicas Alcançadas",
        [
            "<b>1. Pipeline Determinístico:</b> Substituição de triagens manuais subjetivas por um fluxo GEE estruturado.",
            "<b>2. Amostragem Balanceada:</b> Estratificação cruzada A1..B3 que evita viés espacial e geológico.",
            "<b>3. Otimização Logística:</b> Desaglomeração por thinning que maximiza a cobertura das saídas de campo.",
            "<b>4. Conformidade Científica:</b> Rastreabilidade aberta dos fatores biofísicos da RUSLE.",
        ],
        "Cronograma dos Próximos Passos (PPGTCA)",
        [
            "<b>• Etapa 1:</b> Execução das coletas de campo nas áreas pré-triadas (Céu Azul, Paranavaí) com formulário KoboToolbox.",
            "<b>• Etapa 2:</b> Ingestão dos dados de campo e consolidação do dataset rotulado.",
            "<b>• Etapa 3:</b> Treinamento dos modelos de Machine Learning (XGBoost / Random Forest).",
            "<b>• Etapa 4:</b> Interpretação dos fatores biofísicos via valores SHAP (*SHapley Additive exPlanations*).",
        ],
        c1_color="emerald",
        c2_color="cyan",
    )

    def draw_bg(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(C_DARK)
        canvas.rect(0, 0, doc.pagesize[0], doc.pagesize[1], fill=True, stroke=False)
        canvas.restoreState()

    doc.build(story, onFirstPage=draw_bg, onLaterPages=draw_bg)
    print(f"PDF presentation saved successfully to: {output_pdf_path}")

if __name__ == "__main__":
    output_path = os.path.abspath("Apresentacao_Metodologia_Erosao_PPGTCA.pdf")
    create_pdf(output_path)
