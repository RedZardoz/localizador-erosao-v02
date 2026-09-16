import os
import sys
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

    # Custom Color Palette (Academic / Geospatial Dark Theme)
    C_DARK = colors.HexColor("#0F172A")       # Slate 900
    C_CARD = colors.HexColor("#1E293B")       # Slate 800
    C_BORDER = colors.HexColor("#334155")     # Slate 700
    C_EMERALD = colors.HexColor("#10B981")    # Emerald 500
    C_CYAN = colors.HexColor("#06B6D4")       # Cyan 500
    C_INDIGO = colors.HexColor("#6366F1")     # Indigo 500
    C_AMBER = colors.HexColor("#F59E0B")      # Amber 500
    C_ROSE = colors.HexColor("#F43F5E")       # Rose 500
    C_BLUE = colors.HexColor("#3B82F6")       # Blue 500
    C_WHITE = colors.HexColor("#F8FAFC")      # Slate 50
    C_LIGHT = colors.HexColor("#CBD5E1")      # Slate 300
    C_MUTED = colors.HexColor("#94A3B8")      # Slate 400

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
    style_card_title_cyan = ParagraphStyle("CardTitleCyan", parent=style_card_title, textColor=C_CYAN)
    style_card_title_indigo = ParagraphStyle("CardTitleIndigo", parent=style_card_title, textColor=C_INDIGO)
    style_card_title_amber = ParagraphStyle("CardTitleAmber", parent=style_card_title, textColor=C_AMBER)
    style_card_title_rose = ParagraphStyle("CardTitleRose", parent=style_card_title, textColor=C_ROSE)
    style_card_title_blue = ParagraphStyle("CardTitleBlue", parent=style_card_title, textColor=C_BLUE)

    style_body = ParagraphStyle(
        "CardBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=C_LIGHT,
        leading=12.5,
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
        fontSize=23,
        textColor=C_WHITE,
        alignment=1,
        leading=27,
        spaceAfter=12,
    )
    style_cover_sub = ParagraphStyle(
        "CoverSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12.5,
        textColor=C_CYAN,
        alignment=1,
        leading=16,
        spaceAfter=20,
    )

    story = []

    def make_card_table(title_para, body_paras, width=355, border_color=C_BORDER):
        card_content = [title_para] + body_paras if title_para else body_paras
        t = Table([[card_content]], colWidths=[width])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), C_CARD),
            ("BOX", (0, 0), (-1, -1), 1.2, border_color),
            ("PADDING", (0, 0), (-1, -1), 10),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        return t

    def add_two_column_slide(cat, title, card1_title, card1_lines, card2_title, card2_lines, c1_color="emerald", c2_color="emerald"):
        story.append(Paragraph(cat.upper(), style_category))
        story.append(Paragraph(title, style_title))

        title_styles = {
            "emerald": style_card_title,
            "cyan": style_card_title_cyan,
            "indigo": style_card_title_indigo,
            "amber": style_card_title_amber,
            "rose": style_card_title_rose,
            "blue": style_card_title_blue,
        }
        t1_style = title_styles.get(c1_color, style_card_title)
        t2_style = title_styles.get(c2_color, style_card_title)

        border_colors = {
            "emerald": C_EMERALD,
            "cyan": C_CYAN,
            "indigo": C_INDIGO,
            "amber": C_AMBER,
            "rose": C_ROSE,
            "blue": C_BLUE,
        }

        b1_paras = [Paragraph(line, style_body) for line in card1_lines]
        b2_paras = [Paragraph(line, style_body) for line in card2_lines]

        card1 = make_card_table(Paragraph(card1_title, t1_style) if card1_title else None, b1_paras, width=355, border_color=border_colors.get(c1_color, C_BORDER))
        card2 = make_card_table(Paragraph(card2_title, t2_style) if card2_title else None, b2_paras, width=355, border_color=border_colors.get(c2_color, C_BORDER))

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
    story.append(Spacer(1, 30))
    story.append(Paragraph("PROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS COMPUTACIONAIS PARA O AGRONEGÓCIO (PPGTCA - 2026)", style_cover_badge))
    story.append(Paragraph("Estratégia Híbrida de Amostragem e Rotulagem para Treinamento do Modelo Preditivo XGBoost", style_cover_title))
    story.append(Paragraph("Integração entre Triagem GEE, Fotointerpretação em Alta Resolução (VHR) e Subamostra de Calibração Presencial (GNSS RTK / VANT)", style_cover_sub))

    cover_card_content = [
        Paragraph("<b>Linha de Pesquisa:</b> Sensoriamento Remoto, Inteligência Geoespacial e Predição de Erosão Laminar", style_body),
        Paragraph("<b>Objetivo Metodológico:</b> Viabilizar dataset supervisionado estatisticamente robusto (N = 250 a 300 instâncias) com rigor científico auditável perante a banca de mestrado através de validação cruzada híbrida.", style_body),
        Paragraph("<b>Quantitativos de Referência:</b> N = 250-300 candidatos (GEE/VHR) | n = 45 pontos presenciais (RTK/VANT) | Particionamento 70/15/15.", style_body),
    ]
    t_cover = Table([[cover_card_content]], colWidths=[700])
    t_cover.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), C_CARD),
        ("BOX", (0, 0), (-1, -1), 1.2, C_CYAN),
        ("PADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(t_cover)
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 2: O Dilema Amostral
    # =========================================================================
    add_two_column_slide(
        "1. Contexto Metodológico",
        "O Dilema Amostral no Aprendizado de Máquina Geoespacial",
        "Limitações das Abordagens Extremas",
        [
            "<b>• Abordagem 100% Campo (N = 300):</b> Visitar 300 pontos com receptor GNSS RTK e drone VANT exigiria meses contínuos de viagem e custos operacionais inviáveis para um mestrado.",
            "<b>• Risco de Amostra Pequena (N < 50):</b> Poucos dados de campo levam a subajuste (underfitting) e incapacidade de generalização do XGBoost.",
            "<b>• Abordagem 100% Sintética / RUSLE:</b> Treinar o modelo apenas sobre os fatores calculados da RUSLE cria um modelo circular que apenas memoriza equações matemáticas já conhecidas.",
            "<b>• Exigência da Banca:</b> É indispensável comprovar a validade empírica e o controle de qualidade dos rótulos usados no treino.",
        ],
        "A Solução: Estratégia Híbrida de Amostragem",
        [
            "<b>• Fotointerpretação VHR (80% da Amostra):</b> Uso de imagens de satélite submétricas (30cm-3m) e Google Earth 3D para rotular 100% dos candidatos triados.",
            "<b>• Subamostra de Calibração (20% da Amostra):</b> Coleta presencial de n = 45 pontos com GNSS RTK e KoboToolbox como verdade-de-campo (Ground-Truth).",
            "<b>• Matriz de Confusão & Índice Kappa:</b> Aferição estatística da concordância entre o especialista e o campo antes do treinamento do algoritmo.",
            "<b>• Volume Ideal para o XGBoost:</b> N = 250 a 300 instâncias tabulares garantem convergência robusta dos gradientes.",
        ],
        c1_color="rose",
        c2_color="emerald",
    )

    # =========================================================================
    # SLIDE 3: O Fluxo Amostral Consolidado
    # =========================================================================
    story.append(Paragraph("2. ARQUITETURA DO FLUXO AMORSTRAL & QUANTITATIVOS".upper(), style_category))
    story.append(Paragraph("Síntese dos Quantitativos e Transições em Cada Etapa", style_title))

    # Metric Badges Table
    badges_data = [[
        Paragraph("<b>ETAPA 1: TRIAGEM GEE</b><br/><font size='13' color='#6366F1'><b>250 a 300</b></font><br/><font size='7' color='#94A3B8'>Candidatos Elegíveis</font>", style_body),
        Paragraph("<b>ETAPA 2: FOTOINTERP.</b><br/><font size='13' color='#06B6D4'><b>100% (250-300)</b></font><br/><font size='7' color='#94A3B8'>Rótulos Visuais VHR</font>", style_body),
        Paragraph("<b>ETAPA 3: CAMPO RTK</b><br/><font size='13' color='#10B981'><b>45 pontos</b></font><br/><font size='7' color='#94A3B8'>Subamostra (15-20%)</font>", style_body),
        Paragraph("<b>ETAPA 4: CALIBRAÇÃO</b><br/><font size='13' color='#F59E0B'><b>Kappa ≥ 0.75</b></font><br/><font size='7' color='#94A3B8'>Acurácia ≥ 85%</font>", style_body),
        Paragraph("<b>ETAPA 5: XGBOOST</b><br/><font size='13' color='#3B82F6'><b>250 a 300</b></font><br/><font size='7' color='#94A3B8'>Instâncias (70/15/15)</font>", style_body),
    ]]
    t_badges = Table(badges_data, colWidths=[140, 140, 140, 140, 140])
    t_badges.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), C_CARD),
        ("BOX", (0, 0), (-1, -1), 1, C_BORDER),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t_badges)
    story.append(Spacer(1, 10))

    flow_table_content = [
        Paragraph("<b>• ETAPA 1 (Triagem GEE):</b> N = 250 a 300 candidatos gerados por máscara de elegibilidade + estratificação de relevo/solo + thinning de 500m.", style_body),
        Paragraph("<b>• ETAPA 2 (Fotointerpretação VHR):</b> 100% dos candidatos inspecionados em imagens de satélite submétricas (Mapbox/Google 3D) com chave visual padronizada.", style_body),
        Paragraph("<b>• ETAPA 3 (Subamostra Presencial):</b> n = 45 pontos (15% a 20%) sorteados de forma estratificada para visita física (GNSS RTK, VANT e KoboToolbox).", style_body),
        Paragraph("<b>• ETAPA 4 (Matriz de Concordância):</b> Cálculo de Acurácia Global e Índice Kappa de Cohen entre fotointerpretação e medição real de campo.", style_body),
        Paragraph("<b>• ETAPA 5 (Treinamento do XGBoost):</b> Particionamento 70% Treino (190 pts), 15% Validação (45 pts) e 15% Teste Cego Independente (45 pts).", style_body),
    ]
    t_flow = Table([[flow_table_content]], colWidths=[700])
    t_flow.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), C_CARD),
        ("BOX", (0, 0), (-1, -1), 1.2, C_CYAN),
        ("PADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(t_flow)
    story.append(PageBreak())

    # =========================================================================
    # SLIDE 4: Etapa 1 - Triagem GEE
    # =========================================================================
    add_two_column_slide(
        "3. Detalhamento Metodológico",
        "Etapa 1: Triagem Estratificada no GEE (N = 250 a 300)",
        "Filtros de Elegibilidade e Estratificação",
        [
            "<b>1. Máscara de Elegibilidade no Earth Engine:</b>",
            "   • Cobertura da Terra: ESA WorldCover v200 (10m) — focado em Cropland(40), Grassland(30) e Solo Exposto(60). Exclusão de cidades, floresta e água.",
            "   • Declividade: Copernicus DEM GLO-30 na faixa de 3% a 20% (faixa crítica de erosão laminar segundo a Embrapa).",
            "   • Hidrografia: JRC Global Surface Water com buffer protetivo de exclusão.",
            "<b>2. Estratificação Pedotopográfica:</b>",
            "   • Cruzamento de 3 classes de declividade × 2 ordens de erodibilidade (SiBCS), formando 6 estratos representativos (A1 a B3).",
        ],
        "Amostragem e Thinning Espacial",
        [
            "<b>3. Amostragem Estratificada Balanceada:</b>",
            "   • Sorteio uniforme de ~50 pontos por estrato sobre a máscara de elegibilidade.",
            "<b>4. Thinning Espacial (d_min ≥ 500 metros):</b>",
            "   • Filtro guloso por distância haversine para evitar agrupamento de pontos (clusters) e assegurar cobertura territorial da bacia.",
            "<b>5. Extração Biofísica em Request Único:</b>",
            "   • Índices espectrais Sentinel-2 (BSI, NDVI), elevação e fatores RUSLE aproximados anexados aos pontos.",
            "<b>• Status Gerado:</b> 250 a 300 pontos candidatos com status <i>'gee-screened'</i>.",
        ],
        c1_color="indigo",
        c2_color="cyan",
    )

    # =========================================================================
    # SLIDE 5: Etapa 2 - Fotointerpretação VHR
    # =========================================================================
    add_two_column_slide(
        "4. Detalhamento Metodológico",
        "Etapa 2: Fotointerpretação em Alta Resolução VHR (N = 250 a 300)",
        "Chave Padronizada de Decisão Visual",
        [
            "<b>• Classe 0 (Estável / Baixo Risco):</b> Solo com cobertura vegetal contínua ou plantio direto consolidado com palhada abundante e terraços íntegros.",
            "<b>• Classe 1 (Risco Moderado):</b> Solo exposto em preparo agrícola sobre relevo suave (< 6%), sem marcas de enxurrada ou quebra de terraço.",
            "<b>• Classe 2 (Erosão Laminar Severa):</b> Decapitação nítida do horizonte A (manchas claras/avermelhadas no topo da vertente), ausência ou rompimento de terraços.",
            "<b>• Classe 3 (Erosão Crítica com Enxurrada):</b> Manchas de erosão conectadas a linhas de fluxo concentrado e assoreamento arenoso nas baixadas.",
        ],
        "Operação no App & Rastreabilidade",
        [
            "<b>• Ambiente de Inspeção:</b> Visualização direta no app em Zoom Z18-Z19 (Mapbox Satélite) e abertura em 1 clique no Google Earth Web 3D (pitch 45°).",
            "<b>• Registro de Evidências:</b> Checklist objetivo de feições visuais (Solo exposto, decapitação, linhas de fluxo, falha de terraço, palhada).",
            "<b>• Grau de Certeza:</b> Atribuição de confiança ('Alta' vs 'Média') para cada ponto analisado.",
            "<b>• Promoção de Status:</b> O candidato é promovido para <i>'vhr-photointerpreted'</i>.",
            "<b>• Amostras Concluídas:</b> 100% dos candidatos (250 a 300 pontos).",
        ],
        c1_color="cyan",
        c2_color="emerald",
    )

    # =========================================================================
    # SLIDE 6: Etapa 3 - Subamostra Presencial
    # =========================================================================
    add_two_column_slide(
        "5. Detalhamento Metodológico",
        "Etapa 3: Subamostra Presencial de Calibração (n = 45 Pontos)",
        "Dimensionamento e Sorteio Estratificado",
        [
            "<b>• Tamanho Amostral:</b> n = 45 pontos (15% a 20% do universo amostral).",
            "<b>• Critério de Seleção Balanceada:</b>",
            "   - Distribuição proporcional entre os 6 estratos pedotopográficos (A1 a B3).",
            "   - Cobertura equilibrada das classes de severidade atribuídas na fotointerpretação.",
            "<b>• Geração dos Arquivos de Missão de Campo:</b>",
            "   - Formulário digital padronizado no KoboToolbox.",
            "   - Arquivo GPX/KML de waypoints para carregar no receptor GNSS RTK e controladora do VANT.",
        ],
        "Protocolo Físico de Diagnóstico em Campo",
        [
            "<b>1. Pedestais de Erosão:</b> Medição milimétrica da altura do solo protegido sob pedregulhos/palhada para estimativa da lâmina perdida.",
            "<b>2. Descalçamento Radicular:</b> Verificação de raízes de plântulas ou soqueiras expostas pelo escoamento superficial difuso.",
            "<b>3. Selamento Superficial (Soil Crust):</b> Identificação de crosta compactada gerada pelo impacto das gotas de chuva.",
            "<b>4. Registro Fotográfico:</b> Fotos em ângulo nadir (1.5m) para índice de palhada e fotos panorâmicas do talhão.",
            "<b>• Status no Sistema:</b> Promovido a <i>'field-validated'</i> (Ground-Truth).",
        ],
        c1_color="emerald",
        c2_color="amber",
    )

    # =========================================================================
    # SLIDE 7: Etapa 4 - Matriz de Confusão
    # =========================================================================
    add_two_column_slide(
        "6. Detalhamento Metodológico",
        "Etapa 4: Matriz de Confusão & Calibração Metodológica",
        "Cruzamento Fotointerpretação x Campo",
        [
            "<b>• Pareamento dos 45 Pontos Visitados:</b> Comparação 1-para-1 entre o rótulo atribuído por imagem de satélite VHR e o diagnóstico físico medido em campo.",
            "<b>• Matriz de Confusão 3x3:</b> Quantificação de acertos, falso-positivos e falso-negativos para as classes Moderada, Alta e Crítica.",
            "<b>• Métricas Estatísticas Obrigatórias:</b>",
            "   - Acurácia Global (Meta estabelecida: ≥ 85%).",
            "   - Índice Kappa de Cohen (Meta: κ ≥ 0.75 — concordância substancial).",
            "   - Sensibilidade e Especificidade por classe de severidade.",
        ],
        "Defesa perante a Banca de Mestrado",
        [
            "<b>• Resposta à Pergunta Central da Banca:</b> 'Quão confiável é a rotulagem remota em alta resolução para treinar o algoritmo preditivo?'",
            "<b>• Blindagem Científica:</b> Apresentação de dados estatísticos concretos comprovando a correlação entre feições espectrais e processos físicos de campo.",
            "<b>• Calibração de Limiares:</b> Se o Kappa indicar viés sistemático (e.g. subestimação em Latossolos), os limiares restantes são reajustados antes do treino do XGBoost.",
        ],
        c1_color="amber",
        c2_color="indigo",
    )

    # =========================================================================
    # SLIDE 8: Etapa 5 - XGBoost & SHAP
    # =========================================================================
    add_two_column_slide(
        "7. Detalhamento Metodológico",
        "Etapa 5: Modelagem Preditiva XGBoost & Interpretabilidade SHAP",
        "Particionamento e Treinamento do Modelo",
        [
            "<b>• Volume Total do Dataset:</b> N = 250 a 300 instâncias tabulares.",
            "<b>• Particionamento Estratificado:</b>",
            "   - Treinamento (70% ≈ 190 instâncias): Ajuste dos pesos das árvores de decisão gradiente (Gradient Boosted Trees).",
            "   - Validação (15% ≈ 45 instâncias): Ajuste fino de hiperparâmetros (max_depth, learning_rate, subsample).",
            "   - Teste Cego (15% ≈ 45 instâncias): Avaliação final com amostras reservadas de campo (Ground-Truth).",
            "<b>• Variáveis Preditoras (X):</b> BSI, NDVI, Declividade (%), Elevação (m), Fatores RUSLE (K, LS, R, C).",
        ],
        "Interpretabilidade e Diagnóstico via SHAP",
        [
            "<b>• Algoritmo SHAP (SHapley Additive exPlanations):</b> Calcula o impacto marginal de cada variável biofísica na predição de risco de erosão para cada talhão.",
            "<b>• Entregáveis da Modelagem:</b>",
            "   - Gráfico SHAP Summary Plot: Ranking de importância das variáveis no Paraná.",
            "   - Gráficos de Dependência Parcial: Limiares críticos de declividade e BSI onde a perda de solo dispara.",
            "   - Métricas Finais: Acurácia, F1-Score, Curva ROC-AUC e Erro RMSE.",
        ],
        c1_color="blue",
        c2_color="emerald",
    )

    # =========================================================================
    # SLIDE 9: Implementação no App
    # =========================================================================
    add_two_column_slide(
        "8. Implementação de Software",
        "Adaptações Técnicas na Plataforma Web",
        "Novos Tipos e Interface de Rotulagem",
        [
            "<b>1. Tipagem e Proveniência (src/types/erosion.ts):</b> Novo status <i>'vhr-photointerpreted'</i> e interface <i>PhotoInterpretationRecord</i> com evidências visuais.",
            "<b>2. Gaveta de Fotointerpretação Assistida:</b> Formulário rápido acoplado ao popup do ponto com atalhos de classificação, zoom automático e integração Google Earth 3D.",
            "<b>3. Seletor da Subamostra de Campo:</b> Sorteio estratificado dos 45 pontos com exportação direta para KoboToolbox / GPX.",
        ],
        "Módulo de Calibração e Exportador",
        [
            "<b>4. Painel de Matriz de Confusão (KoboFieldImport.tsx):</b> Cálculo automático de Acurácia Global e Índice Kappa na importação dos dados de campo.",
            "<b>5. Exportação Dedicada para IA (ExportModal.tsx):</b> Geração do arquivo <i>'dataset_treinamento_xgboost.csv'</i> consolidando variáveis biofísicas, fatores RUSLE e coluna de origem do rótulo.",
            "<b>6. Testes Automatizados:</b> Cobertura Vitest garantindo integridade dos cálculos de concordância e transições de status.",
        ],
        c1_color="cyan",
        c2_color="indigo",
    )

    # =========================================================================
    # SLIDE 10: Conclusão
    # =========================================================================
    story.append(Paragraph("9. SÍNTESE EXECUTIVA & CRONOGRAMA".upper(), style_category))
    story.append(Paragraph("Resumo Executivo da Estratégia Híbrida para o Mestrado", style_title))

    conclusion_content = [
        Paragraph("<b>• Redução de Custo & Tempo:</b> Reduz a necessidade de deslocamento em 80% mantendo representatividade espacial no território paranaense.", style_body),
        Paragraph("<b>• Rigor Metodológico Auditável:</b> A subamostra de 45 pontos com RTK/Drone e a Matriz de Confusão fornecem a comprovação científica necessária para a defesa da dissertação.", style_body),
        Paragraph("<b>• Volume Amostral Adequado:</b> N = 250 a 300 instâncias garantem convergência estável e generalização confiável para o XGBoost.", style_body),
        Paragraph("<b>• Cronograma Sugerido:</b> Etapa 1 e 2 (Semanas 1-2) | Etapa 3 (Semanas 3-4) | Etapas 4 e 5 (Semanas 5-6).", style_body),
        Paragraph("<b>• Status do Projeto:</b> Plano metodológico aprovado e pronto para implantação no código da aplicação web.", style_body),
    ]
    t_concl = Table([[conclusion_content]], colWidths=[700])
    t_concl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), C_CARD),
        ("BOX", (0, 0), (-1, -1), 1.2, C_EMERALD),
        ("PADDING", (0, 0), (-1, -1), 14),
    ]))
    story.append(t_concl)

    def draw_bg(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(C_DARK)
        canvas.rect(0, 0, doc.pagesize[0], doc.pagesize[1], fill=True, stroke=False)
        canvas.restoreState()

    doc.build(story, onFirstPage=draw_bg, onLaterPages=draw_bg)
    print(f"PDF document saved successfully to: {output_pdf_path}")

if __name__ == "__main__":
    output_path = os.path.abspath("Plano_Estrategia_Hibrida_XGBoost_PPGTCA.pdf")
    create_pdf(output_path)
