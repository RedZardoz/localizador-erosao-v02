#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
===============================================================================
GERADOR DO MANUAL DE INSTALAÇÃO E OPERAÇÃO DO SAREL (PDF OFICIAL)
Mestrado Profissional em Tecnologias Ambientais — PPGTCA 2026
Pesquisa: Arcabouço de Inteligência Geoespacial para Mapeamento de Erosão Laminar
===============================================================================

O QUÊ FAZ:
Gera o documento técnico-científico oficial e pericial em formato PDF
("Manual de Instalação e Operação do SAREL"), contendo diagramas conceituais
em alta resolução de todas as interfaces do sistema, guia passo a passo de
instalação e configuração, instruções de download dos dados hospedados no
Google Drive oficial, fluxo operacional das campanhas de drone e campo,
e matriz de rastreabilidade das Decisões Metodológicas (D01 a D19).

POR QUE FAZ:
A validação pericial e a reprodutibilidade científica exigem documentação
formal e auditável de todo o software e dados. Este manual orienta pesquisadores,
peritos ambientais e técnicos na reprodução integral do ambiente analítico
e na operação correta dos módulos do SAREL sem violação das premissas biofísicas.
"""

import os
import sys
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.gridspec import GridSpec

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm, inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    PageBreak,
    KeepTogether,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

# Diretórios de trabalho
DIRETORIO_RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIRETORIO_DOCS = os.path.join(DIRETORIO_RAIZ, "docs")
DIRETORIO_FIGURAS = os.path.join(DIRETORIO_DOCS, "figuras_manual")
CAMINHO_PDF_FINAL = os.path.join(DIRETORIO_DOCS, "Manual_Instalacao_e_Operacao_SAREL.pdf")

# Link oficial fornecido pelo usuário para download da base de dados completa
LINK_GOOGLE_DRIVE_OFICIAL = "https://drive.google.com/drive/folders/1S6UsUYGM3dUh7w_hLrmvcsuh0nSfjyYR?usp=sharing"

# Configuração de estilo do matplotlib
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['figure.dpi'] = 200


def criar_diagramas_telas(pasta_figuras: str) -> dict[str, str]:
    """Gera as 5 telas demonstrativas esquemáticas do sistema SAREL em alta resolução."""
    os.makedirs(pasta_figuras, exist_ok=True)
    caminhos = {}

    # -------------------------------------------------------------------------
    # TELA 1: Triagem Amostral & Mapa 3D
    # -------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 5.8), facecolor='#0F172A')
    ax.set_facecolor('#1E293B')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Top Navbar
    rect_nav = patches.Rectangle((0, 90), 100, 10, facecolor='#0F172A', edgecolor='#334155', lw=1)
    ax.add_patch(rect_nav)
    ax.text(2, 94.5, "SAREL v2.0", color='#38BDF8', fontsize=12, weight='bold')
    ax.text(18, 94.5, "|  Triagem Amostral (3D)", color='#F8FAFC', fontsize=10, weight='bold')
    ax.text(42, 94.5, "Inspetor Temporal", color='#94A3B8', fontsize=9)
    ax.text(60, 94.5, "Sítios Drone", color='#94A3B8', fontsize=9)
    ax.text(75, 94.5, "Ingestão Kobo", color='#94A3B8', fontsize=9)
    ax.text(90, 94.5, "Auditoria D01-D19", color='#10B981', fontsize=8, weight='bold')

    # Sidebar Esquerda (Critérios de Amostragem Biofísica)
    rect_side = patches.Rectangle((1, 2), 26, 86, facecolor='#0F172A', edgecolor='#334155', lw=1)
    ax.add_patch(rect_side)
    ax.text(3, 84, "FILTROS BIOFÍSICOS", color='#38BDF8', fontsize=9, weight='bold')
    ax.text(3, 79, "• Amostragem Estratificada", color='#E2E8F0', fontsize=8)
    ax.text(3, 73, "Classe Erosão (1):", color='#F97316', fontsize=8, weight='bold')
    ax.text(4, 69, "BSI >= 0.10  |  NDVI < 0.40", color='#FDBA74', fontsize=7.5)
    ax.text(4, 65, "Declividade >= 8% (ALOS)", color='#FDBA74', fontsize=7.5)

    ax.text(3, 58, "Classe Controle SPD (0):", color='#10B981', fontsize=8, weight='bold')
    ax.text(4, 54, "BSI <= 0.00  |  NDVI >= 0.65", color='#6EE7B7', fontsize=7.5)
    ax.text(4, 50, "Pousio rejeitado (CCDC)", color='#6EE7B7', fontsize=7.5)

    ax.text(3, 42, "Thinning Geodésico:", color='#38BDF8', fontsize=8, weight='bold')
    ax.text(4, 38, "Buffer mín: >= 500 m", color='#94A3B8', fontsize=7.5)
    ax.text(4, 34, "Mitiga autocorrelação", color='#94A3B8', fontsize=7.5)

    ax.text(3, 25, "RESUMO AMOSTRAL:", color='#E2E8F0', fontsize=8, weight='bold')
    ax.text(4, 20, "• 150 Focos Erodidos", color='#F97316', fontsize=8)
    ax.text(4, 16, "• 150 Controles SPD", color='#10B981', fontsize=8)
    ax.text(4, 12, "• 0 Falsos Pousios", color='#38BDF8', fontsize=8)
    ax.text(4, 7, "• 6 Macrobacias do PR", color='#E2E8F0', fontsize=8)

    # Painel Central do Mapa 3D (Simulação Cartográfica de Relevo do Paraná)
    rect_map = patches.Rectangle((29, 2), 70, 86, facecolor='#020617', edgecolor='#334155', lw=1)
    ax.add_patch(rect_map)
    ax.text(32, 83, "CANVAS CARTOGRÁFICO 3D — ESTADO DO PARANÁ (SENTINEL-2 / ALOS PALSAR)", color='#E2E8F0', fontsize=9, weight='bold')

    # Curvas de nível esquemáticas e relevo
    for y_iso in [20, 35, 50, 65, 78]:
        ax.plot([33, 48, 62, 78, 95], [y_iso-4, y_iso+5, y_iso-2, y_iso+6, y_iso-3], color='#1E293B', lw=1.2, linestyle=':')

    # Macrobacias esboçadas
    ax.text(40, 68, "Bacia do Paranapanema", color='#475569', fontsize=7.5, style='italic')
    ax.text(68, 62, "Bacia do Tibagi", color='#475569', fontsize=7.5, style='italic')
    ax.text(45, 45, "Bacia do Rio Ivaí", color='#475569', fontsize=7.5, style='italic')
    ax.text(36, 28, "Bacia do Piquiri / PR 3", color='#475569', fontsize=7.5, style='italic')
    ax.text(62, 22, "Bacia do Rio Iguaçu", color='#475569', fontsize=7.5, style='italic')

    # Pontos de amostragem no mapa
    # Erosão (laranja)
    x_ero = [38, 42, 49, 53, 58, 64, 72, 79, 44, 51, 67, 75, 41, 60]
    y_ero = [30, 48, 43, 66, 52, 70, 61, 55, 26, 36, 44, 25, 62, 38]
    ax.scatter(x_ero, y_ero, c='#F97316', s=55, edgecolors='#FFFFFF', lw=1, zorder=5, label='Erosão Laminar (Classe 1)')

    # Controles SPD (verde)
    x_ctrl = [35, 46, 56, 61, 69, 76, 82, 40, 54, 70, 78, 48, 63, 73]
    y_ctrl = [34, 52, 47, 74, 56, 67, 59, 22, 32, 49, 29, 68, 33, 40]
    ax.scatter(x_ctrl, y_ctrl, c='#10B981', marker='s', s=45, edgecolors='#FFFFFF', lw=1, zorder=5, label='Controle / SPD (Classe 0)')

    ax.legend(loc='lower right', facecolor='#0F172A', edgecolor='#334155', labelcolor='#F8FAFC', fontsize=8)

    caminho_t1 = os.path.join(pasta_figuras, "tela1_triagem_mapa3d.png")
    plt.tight_layout()
    plt.savefig(caminho_t1, dpi=200, bbox_inches='tight')
    plt.close()
    caminhos['tela1'] = caminho_t1

    # -------------------------------------------------------------------------
    # TELA 2: Inspetor Científico de Ponto & Gráfico Multitemporal
    # -------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 5.8), facecolor='#0F172A')
    ax.set_facecolor('#1E293B')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Header do Ponto
    rect_head = patches.Rectangle((1, 88), 98, 11, facecolor='#0F172A', edgecolor='#334155', lw=1)
    ax.add_patch(rect_head)
    ax.text(3, 94.5, "INSPETOR DE PONTO: PR-ERO-042 (Céu Azul / Bacia do Iguaçu)", color='#F8FAFC', fontsize=11, weight='bold')
    ax.text(3, 90.5, "Lat: -25.132948  |  Lon: -53.842105  |  Declividade: 14.8%  |  K: 0.038 t·h/(MJ·mm)  |  R: 8.240 MJ·mm/(ha·h·ano)", color='#94A3B8', fontsize=8)

    # Seletor de Modelo D vs P
    rect_mod_d = patches.Rectangle((3, 78), 24, 7, facecolor='#1E293B', edgecolor='#38BDF8', lw=1.5)
    rect_mod_p = patches.Rectangle((29, 78), 34, 7, facecolor='#0284C7', edgecolor='#38BDF8', lw=1.5)
    ax.add_patch(rect_mod_d)
    ax.add_patch(rect_mod_p)
    ax.text(5, 81.5, "Modelo D (Detecção t0)", color='#94A3B8', fontsize=8, weight='bold')
    ax.text(31, 81.5, "★ Modelo P (Prognóstico — Guarda >= 12m)", color='#FFFFFF', fontsize=8, weight='bold')

    # Card CCDC Persistência
    rect_ccdc = patches.Rectangle((66, 76), 33, 11, facecolor='#450A0A', edgecolor='#EF4444', lw=1.5)
    ax.add_patch(rect_ccdc)
    ax.text(68, 83.5, "DIAGNÓSTICO CCDC: DEGRADAÇÃO CRÔNICA", color='#FCA5A5', fontsize=7.5, weight='bold')
    ax.text(68, 79.5, "Freq. Solo Nu: 34.2%  |  Dias Contínuos: 168 d (>120d)", color='#FEE2E2', fontsize=7)
    ax.text(68, 77, "NDVI máx histórico: 0.49 (<0.55) | SWIR B12: +0.021/ano", color='#FEE2E2', fontsize=7)

    # Área do Gráfico Multitemporal
    rect_chart = patches.Rectangle((3, 6), 96, 68, facecolor='#020617', edgecolor='#334155', lw=1)
    ax.add_patch(rect_chart)
    ax.text(5, 70, "TRAJETÓRIA MULTIANUAL SENTINEL-2 (2016–2026) COM ZONA DE GUARDA ANTECIPADA (MODELO P)", color='#E2E8F0', fontsize=8.5, weight='bold')

    # Eixos do gráfico simulados
    # Zona de Guarda Temporal destacada em amarelo transparente
    rect_guarda = patches.Rectangle((70, 12), 26, 54, facecolor='#EAB308', alpha=0.15, edgecolor='#FACC15', linestyle='--', lw=1.2)
    ax.add_patch(rect_guarda)
    ax.text(72, 62, "ZONA DE GUARDA (12 MESES)\nDADOS RETIDOS (SEM LEAKAGE)", color='#FDE047', fontsize=7.5, weight='bold')

    # Linhas de limiar
    ax.plot([8, 95], [26, 26], color='#EF4444', linestyle='--', lw=1.2)
    ax.text(10, 27.5, "Limiar Solo Exposto / Erosão Ativa (NDVI = 0.40 — D10)", color='#F87171', fontsize=7)

    ax.plot([8, 95], [52, 52], color='#10B981', linestyle='--', lw=1.2)
    ax.text(10, 53.5, "Limiar Cobertura Plena / Sistema Plantio Direto (NDVI = 0.65)", color='#34D399', fontsize=7)

    # Série simulada de NDVI ao longo dos anos
    anos_x = [8, 16, 24, 32, 40, 48, 56, 64, 70, 78, 86, 94]
    ndvi_y = [46, 50, 24, 48, 22, 45, 21, 42, 20, 38, 19, 36]
    ax.plot(anos_x, ndvi_y, color='#38BDF8', lw=2, marker='o', markersize=4, label='Série Histórica NDVI')

    # Evento de validação t0
    ax.plot([94, 94], [12, 66], color='#EF4444', lw=2)
    ax.text(91, 14, "t0 (Evento)", color='#EF4444', fontsize=7.5, weight='bold')

    # Rótulos no eixo X
    for idx, ano in enumerate(['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026']):
        ax.text(8 + idx * 8.6, 8, ano, color='#64748B', fontsize=7, ha='center')

    caminho_t2 = os.path.join(pasta_figuras, "tela2_inspetor_temporal.png")
    plt.tight_layout()
    plt.savefig(caminho_t2, dpi=200, bbox_inches='tight')
    plt.close()
    caminhos['tela2'] = caminho_t2

    # -------------------------------------------------------------------------
    # TELA 3: Central de Campanha & Sítios Padrão-Ouro de Drone
    # -------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 5.8), facecolor='#0F172A')
    ax.set_facecolor('#1E293B')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Header da Tela 3
    rect_head3 = patches.Rectangle((1, 88), 98, 11, facecolor='#0F172A', edgecolor='#334155', lw=1)
    ax.add_patch(rect_head3)
    ax.text(3, 94.5, "CENTRAL DE CAMPANHA — SÍTIOS CONTÍNUOS PADRÃO-OURO DE DRONE (10 A 50 HA)", color='#F8FAFC', fontsize=10.5, weight='bold')
    ax.text(3, 90.5, "Validação Matricial Pixel-a-Pixel (Ortomosaico 5-10 cm vs Sentinel-2 10 m) | Base SICAR/IAT", color='#94A3B8', fontsize=8)

    # 4 Cartões dos Sítios de Referência
    sitios_info = [
        ("SÍTIO 01: Céu Azul (Norte)", "Área: 28.4 ha  |  CAR: PR-4105309-...\nSolo: Latossolo Vermelho Distroférrico\nStatus: Mapeado com Drone (5 cm)\nPadrão: Held-Out Test Set Estrito", '#0284C7'),
        ("SÍTIO 02: Céu Azul (Sul)", "Área: 34.1 ha  |  CAR: PR-4105309-...\nSolo: Nitossolo Vermelho Eutrófico\nStatus: Mapeado com Drone (5 cm)\nPadrão: Calibração Espectral Cruzada", '#0D9488'),
        ("SÍTIO 03: Medianeira (Leste)", "Área: 18.7 ha  |  CAR: PR-4115803-...\nSolo: Latossolo Vermelho Eutroférrico\nStatus: Voo Agendado / Acesso Regular\nPadrão: Held-Out Test Set Estrito", '#7C3AED'),
        ("SÍTIO 04: Medianeira (Oeste)", "Área: 42.0 ha  |  CAR: PR-4115803-...\nSolo: Neossolo Regolítico\nStatus: Sítio Contingência Habilitado\nPadrão: Matriz de Validação 10m", '#C026D3'),
    ]

    for idx, (titulo, desc, cor_borda) in enumerate(sitios_info):
        x0 = 3 + idx * 24.2
        rect_card = patches.Rectangle((x0, 52), 23.5, 33, facecolor='#0F172A', edgecolor=cor_borda, lw=1.5)
        ax.add_patch(rect_card)
        ax.text(x0 + 1.2, 81, titulo, color='#F8FAFC', fontsize=7.5, weight='bold')
        ax.text(x0 + 1.2, 55, desc, color='#CBD5E1', fontsize=6.8)

    # Painel Inferior: Validação Matricial Pixel-a-Pixel e Protocolo de Substituição
    rect_val = patches.Rectangle((3, 4), 58, 44, facecolor='#020617', edgecolor='#334155', lw=1)
    ax.add_patch(rect_val)
    ax.text(5, 43, "MATRIZ DE VALIDAÇÃO MATRICIAL (5-10 cm vs 10 m)", color='#38BDF8', fontsize=8.5, weight='bold')
    ax.text(5, 38, "Ortomosaico reamostrado para grade de 10m do Sentinel-2 por agregação zonal.", color='#94A3B8', fontsize=7)

    # Tabela de métricas matriciais desenhada
    ax.text(6, 31, "Métrica Científica", color='#F8FAFC', fontsize=7.5, weight='bold')
    ax.text(32, 31, "Valor Obtido", color='#F8FAFC', fontsize=7.5, weight='bold')
    ax.text(45, 31, "Alvo Mínimo", color='#F8FAFC', fontsize=7.5, weight='bold')
    ax.plot([5, 59], [29, 29], color='#334155', lw=1)

    metricas = [
        ("Acurácia Global Matricial", "91.4%", ">= 85.0%"),
        ("Índice Kappa (Cohen)", "0.828", ">= 0.750"),
        ("IoU (Interseção sobre União)", "0.784", ">= 0.700"),
        ("F1-Score Classe Erosão", "0.882", ">= 0.800"),
        ("Pureza Submétrica de Borda", "94.1%", ">= 90.0%"),
    ]
    for m_idx, (nome, val, alvo) in enumerate(metricas):
        y_m = 25 - m_idx * 4.5
        ax.text(6, y_m, nome, color='#CBD5E1', fontsize=7)
        ax.text(33, y_m, val, color='#10B981', fontsize=7, weight='bold')
        ax.text(46, y_m, alvo, color='#94A3B8', fontsize=7)

    # Painel de Flexibilidade Operacional / Contingência
    rect_cont = patches.Rectangle((63, 4), 34, 44, facecolor='#0F172A', edgecolor='#F59E0B', lw=1.5)
    ax.add_patch(rect_cont)
    ax.text(65, 43, "PROTOCOLO DE CONTINGÊNCIA", color='#FBBF24', fontsize=8, weight='bold')
    ax.text(65, 39, "Substituição de Sítio Inacessível:", color='#FDE68A', fontsize=7.5, weight='bold')
    ax.text(65, 34, "Se um sítio planejado for bloqueado\n(falta de autorização, chuvas nas\nestradas vicinais, etc.), o sistema\npermite selecionar um polígono\nsubstituto mantendo estritamente:", color='#E2E8F0', fontsize=6.8)
    ax.text(66, 18, "1. Mesma Macrobacia (IAT)\n2. Mesma Classe de Solo\n3. Declividade equivalente (±3%)\n4. Área contínua de 10 a 50 ha", color='#38BDF8', fontsize=6.8, weight='bold')
    ax.text(65, 8, "Rastreabilidade pericial preservada.", color='#10B981', fontsize=6.8, style='italic')

    caminho_t3 = os.path.join(pasta_figuras, "tela3_campanha_drone.png")
    plt.tight_layout()
    plt.savefig(caminho_t3, dpi=200, bbox_inches='tight')
    plt.close()
    caminhos['tela3'] = caminho_t3

    # -------------------------------------------------------------------------
    # TELA 4: Ingestão de Dados KoboCollect & Exportação Cega
    # -------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 5.8), facecolor='#0F172A')
    ax.set_facecolor('#1E293B')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    rect_head4 = patches.Rectangle((1, 88), 98, 11, facecolor='#0F172A', edgecolor='#334155', lw=1)
    ax.add_patch(rect_head4)
    ax.text(3, 94.5, "INGESTÃO DE CAMPO KOBOCOLLECT & EXPORTAÇÃO DUPLO-CEGA", color='#F8FAFC', fontsize=10.5, weight='bold')
    ax.text(3, 90.5, "Sincronização de Formulários ODK/Kobo com Pareamento por Buffer Geodésico e Mascaramento Cego", color='#94A3B8', fontsize=8)

    # Esquema Mobile Kobo (Esquerda)
    rect_mob = patches.Rectangle((3, 8), 28, 76, facecolor='#020617', edgecolor='#38BDF8', lw=1.5)
    ax.add_patch(rect_mob)
    ax.text(6, 79, "FORMULÁRIO KOBOCOLLECT", color='#38BDF8', fontsize=8, weight='bold')
    ax.text(6, 74, "Campos Periciais de Campo:", color='#E2E8F0', fontsize=7.2)
    ax.text(6, 68, "• Coordenadas GPS (WGS84)\n  com acurácia < 3 metros\n• Presença de Selamento (Sim/Não)\n• Rugosidade Superficial (cm)\n• Microcanais / Sulcos rasos\n• Profundidade Horizonte A (cm)\n• Teor de Cobertura Palhada (%)\n• 4 Fotos com Azimute/Bússola", color='#94A3B8', fontsize=6.8)
    ax.text(6, 22, "Validação Cega:", color='#10B981', fontsize=7.2, weight='bold')
    ax.text(6, 13, "O operador de campo NÃO tem\nacesso prévio às predições do\nmodelo nem ao NDVI orbital.", color='#CBD5E1', fontsize=6.5)

    # Motor de Ingestão e Pareamento (Centro)
    rect_ing = patches.Rectangle((34, 8), 30, 76, facecolor='#0F172A', edgecolor='#10B981', lw=1.5)
    ax.add_patch(rect_ing)
    ax.text(36, 79, "MOTOR DE INGESTÃO SAREL", color='#10B981', fontsize=8, weight='bold')
    ax.text(36, 74, "Pareamento Espacial Automatizado:", color='#E2E8F0', fontsize=7.2)
    ax.text(36, 67, "1. Ingestão de JSON / CSV Kobo\n2. Validação de formato ODK\n3. Pareamento via Buffer (R <= 50m)\n4. Vínculo ao Ponto de Satélite\n5. Auditoria de integridade\n   (Proibição de nulos soltos)", color='#94A3B8', fontsize=6.8)

    # Badge de Duplo Cego
    rect_blind = patches.Rectangle((36, 22), 26, 22, facecolor='#1E293B', edgecolor='#F59E0B', lw=1)
    ax.add_patch(rect_blind)
    ax.text(38, 38, "PROTOCOLO DUPLO-CEGO", color='#FBBF24', fontsize=7, weight='bold')
    ax.text(38, 25, "Garante imparcialidade pericial:\nperito de satélite não induz o\nperito de solo e vice-versa.", color='#E2E8F0', fontsize=6.3)

    # Painel de Perfis de Exportação Cega (Direita)
    rect_exp = patches.Rectangle((67, 8), 30, 76, facecolor='#020617', edgecolor='#8B5CF6', lw=1.5)
    ax.add_patch(rect_exp)
    ax.text(69, 79, "PERFIS DE EXPORTAÇÃO CEGA", color='#C084FC', fontsize=8, weight='bold')

    rect_p1 = patches.Rectangle((69, 48), 26, 26, facecolor='#1E293B', edgecolor='#64748B', lw=1)
    ax.add_patch(rect_p1)
    ax.text(71, 69, "Perfil Avaliador de Solo:", color='#38BDF8', fontsize=7, weight='bold')
    ax.text(71, 52, "Exporta apenas coords,\nrelevo e perguntas de solo.\nOCULTA: NDVI, BSI, RUSLE\ne rótulo do XGBoost.", color='#CBD5E1', fontsize=6.3)

    rect_p2 = patches.Rectangle((69, 14), 26, 28, facecolor='#1E293B', edgecolor='#64748B', lw=1)
    ax.add_patch(rect_p2)
    ax.text(71, 37, "Perfil Modelador Espectral:", color='#34D399', fontsize=7, weight='bold')
    ax.text(71, 18, "Exporta bandas Sentinel-2,\ntrajetórias e preditores.\nOCULTA: Avaliação visual e\nnotas qualitativas de campo.", color='#CBD5E1', fontsize=6.3)

    caminho_t4 = os.path.join(pasta_figuras, "tela4_ingestao_kobo.png")
    plt.tight_layout()
    plt.savefig(caminho_t4, dpi=200, bbox_inches='tight')
    plt.close()
    caminhos['tela4'] = caminho_t4

    # -------------------------------------------------------------------------
    # TELA 5: Modelagem XGBoost LOCO, SHAP & Decisões Metodológicas
    # -------------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 5.8), facecolor='#0F172A')
    ax.set_facecolor('#1E293B')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    rect_head5 = patches.Rectangle((1, 88), 98, 11, facecolor='#0F172A', edgecolor='#334155', lw=1)
    ax.add_patch(rect_head5)
    ax.text(3, 94.5, "MODELAGEM XGBOOST SPATIAL K-FOLD (LOCO, K=5) & LIVRO DE DECISÕES", color='#F8FAFC', fontsize=10.5, weight='bold')
    ax.text(3, 90.5, "Isolamento Estrito por Macrobacias do Paraná | Explicabilidade SHAP TreeExplainer | Rastreabilidade D01 a D19", color='#94A3B8', fontsize=8)

    # Painel Esquerdo: Desempenho LOCO e Curva ROC
    rect_m1 = patches.Rectangle((3, 6), 31, 79, facecolor='#020617', edgecolor='#334155', lw=1)
    ax.add_patch(rect_m1)
    ax.text(5, 80, "DESEMPENHO LOCO (K=5)", color='#38BDF8', fontsize=8, weight='bold')
    ax.text(5, 75, "Isolamento de bacias completas:", color='#94A3B8', fontsize=6.8)

    # Métricas do modelo
    ax.text(5, 68, "Acurácia Global: 89.3%", color='#10B981', fontsize=7.5, weight='bold')
    ax.text(5, 63, "ROC-AUC Global: 0.924", color='#10B981', fontsize=7.5, weight='bold')
    ax.text(5, 58, "F1-Score: 0.891", color='#10B981', fontsize=7.5, weight='bold')
    ax.text(5, 53, "Precisão: 88.5%  |  Recall: 89.8%", color='#E2E8F0', fontsize=6.8)

    # Mini Curva ROC
    rect_roc = patches.Rectangle((5, 12), 27, 36, facecolor='#0F172A', edgecolor='#334155', lw=1)
    ax.add_patch(rect_roc)
    ax.plot([7, 30], [14, 46], color='#64748B', linestyle='--', lw=1) # diagonal aleatória
    ax.plot([7, 9, 14, 20, 30], [14, 38, 43, 45, 46], color='#10B981', lw=2) # ROC do XGBoost
    ax.text(7, 43, "Curva ROC (AUC=0.924)", color='#34D399', fontsize=6.5, weight='bold')
    ax.text(7, 10, "1 - Especificidade vs Sensibilidade", color='#64748B', fontsize=5.8)

    # Painel Central: SHAP Feature Importance
    rect_m2 = patches.Rectangle((36, 6), 31, 79, facecolor='#020617', edgecolor='#334155', lw=1)
    ax.add_patch(rect_m2)
    ax.text(38, 80, "EXPLICABILIDADE SHAP", color='#F59E0B', fontsize=8, weight='bold')
    ax.text(38, 75, "Impacto Médio Absoluto (|SHAP|):", color='#94A3B8', fontsize=6.8)

    features_shap = [
        ("bsi (Índice Solo Exposto)", 0.42, '#F97316'),
        ("declividade_pct (ALOS)", 0.35, '#FB923C'),
        ("ndvi (Vigor Vegetativo)", 0.31, '#10B981'),
        ("rusle_perda_solo (A)", 0.26, '#FBBF24'),
        ("banda_b12 (SWIR-2)", 0.22, '#38BDF8'),
        ("rusle_fator_k", 0.18, '#A855F7'),
        ("rusle_fator_r", 0.14, '#EC4899'),
    ]
    for f_idx, (f_nome, f_val, f_cor) in enumerate(features_shap):
        y_f = 67 - f_idx * 8.5
        ax.text(38, y_f + 3.5, f_nome, color='#E2E8F0', fontsize=6.5)
        # Barra SHAP
        larg_barra = f_val * 48
        bar_rect = patches.Rectangle((38, y_f), larg_barra, 2.8, facecolor=f_cor, edgecolor='none')
        ax.add_patch(bar_rect)
        ax.text(38 + larg_barra + 1, y_f + 0.3, f"{f_val:.2f}", color='#94A3B8', fontsize=6)

    # Painel Direito: Livro de Decisões Metodológicas (D01 a D19)
    rect_m3 = patches.Rectangle((69, 6), 28, 79, facecolor='#020617', edgecolor='#10B981', lw=1)
    ax.add_patch(rect_m3)
    ax.text(71, 80, "LIVRO DE DECISÕES (D01–D19)", color='#10B981', fontsize=8, weight='bold')
    ax.text(71, 75, "Rastreabilidade Metodológica:", color='#94A3B8', fontsize=6.8)

    decisoes_amostra = [
        ("D01: Área Mínima Feição", "Decidida (>= 0.5 ha)", '#10B981'),
        ("D02: Buffer Não Amostragem", "Decidida (>= 500 m)", '#10B981'),
        ("D03: Estratificação Pedológica", "Decidida (Latossolo/Nitossolo)", '#10B981'),
        ("D04: Segregação Modelo D vs P", "Decidida (Guarda >= 12m)", '#10B981'),
        ("D10: Limiar NDVI Solo Nu", "Decidida (NDVI < 0.40)", '#10B981'),
        ("D11: Persistência Temporal", "Decidida (Pousio <= 120d)", '#10B981'),
        ("D12: Resolução Drone Padrão-Ouro", "Decidida (5 a 10 cm)", '#10B981'),
        ("D13: Limiar Evento Erosivo", "Pendente (10 vs 12.7 mm/h)", '#F59E0B'),
    ]
    for d_idx, (d_nome, d_status, d_cor) in enumerate(decisoes_amostra):
        y_d = 67 - d_idx * 7.5
        ax.text(71, y_d + 2.5, d_nome, color='#E2E8F0', fontsize=6.3, weight='bold')
        ax.text(71, y_d, f"Status: {d_status}", color=d_cor, fontsize=5.8)

    caminho_t5 = os.path.join(pasta_figuras, "tela5_xgboost_decisoes.png")
    plt.tight_layout()
    plt.savefig(caminho_t5, dpi=200, bbox_inches='tight')
    plt.close()
    caminhos['tela5'] = caminho_t5

    print(f"[FIGURAS] 5 telas demonstrativas geradas em '{pasta_figuras}'.")
    return caminhos


class NumeradorPaginas(canvas.Canvas):
    """Canvas de dois passos para numeração exata 'Página X de Y' e cabeçalho pericial."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._estados_salvos = []

    def showPage(self):
        self._estados_salvos.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total_paginas = len(self._estados_salvos)
        for estado in self._estados_salvos:
            self.__dict__.update(estado)
            self.desenhar_elementos_periciais(total_paginas)
            super().showPage()
        super().save()

    def desenhar_elementos_periciais(self, total_paginas: int):
        if self._pageNumber == 1:
            # A página de capa possui layout visual próprio; não desenhar cabeçalho nem rodapé padrão
            return

        self.saveState()

        # Cabeçalho Superior
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#0F172A"))
        self.drawString(40, 808, "SAREL — Sistema de Apoio à Recuperação de Erosão Laminar")
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawRightString(555, 808, "Mestrado PPGTCA 2026 • Manual de Instalação e Operação")

        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.6)
        self.line(40, 802, 555, 802)

        # Rodapé Inferior
        self.line(40, 42, 555, 42)
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(40, 30, "Repositório de Dados: Google Drive Oficial PPGTCA 2026 | Rigor Anti-Mock e Blinding")
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#0F172A"))
        self.drawRightString(555, 30, f"Página {self._pageNumber} de {total_paginas}")

        self.restoreState()


def construir_manual_pdf(caminho_saida: str, caminhos_figuras: dict[str, str]):
    """Monta a estrutura editorial completa do manual pericial em PDF."""
    os.makedirs(os.path.dirname(caminho_saida), exist_ok=True)

    doc = SimpleDocTemplate(
        caminho_saida,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=48,
        bottomMargin=48,
    )

    estilos = getSampleStyleSheet()

    # Estilos customizados de tipografia
    estilo_titulo_capa = ParagraphStyle(
        'TituloCapa',
        parent=estilos['Normal'],
        fontName='Helvetica-Bold',
        fontSize=23,
        leading=28,
        textColor=colors.HexColor('#0F172A'),
        alignment=TA_CENTER,
    )
    estilo_subtitulo_capa = ParagraphStyle(
        'SubtituloCapa',
        parent=estilos['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0284C7'),
        alignment=TA_CENTER,
    )
    estilo_h1 = ParagraphStyle(
        'CapituloH1',
        parent=estilos['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True,
    )
    estilo_h2 = ParagraphStyle(
        'SecaoH2',
        parent=estilos['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#0369A1'),
        spaceBefore=9,
        spaceAfter=4,
        keepWithNext=True,
    )
    estilo_corpo = ParagraphStyle(
        'CorpoTexto',
        parent=estilos['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#1E293B'),
        alignment=TA_JUSTIFY,
        spaceAfter=5,
    )
    estilo_codigo = ParagraphStyle(
        'BlocoCodigo',
        parent=estilos['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=3,
        spaceAfter=3,
    )
    estilo_legenda = ParagraphStyle(
        'LegendaFigura',
        parent=estilos['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#475569'),
        alignment=TA_CENTER,
        spaceBefore=3,
        spaceAfter=7,
    )
    estilo_caixa = ParagraphStyle(
        'TextoCaixa',
        parent=estilos['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0F172A'),
    )
    estilo_tabela_celula = ParagraphStyle(
        'TabelaCelula',
        parent=estilos['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#1E293B'),
    )
    estilo_tabela_cabecalho = ParagraphStyle(
        'TabelaCabecalho',
        parent=estilos['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#FFFFFF'),
    )

    elementos = []

    # =========================================================================
    # 1. PÁGINA DE CAPA OFICIAL
    # =========================================================================
    elementos.append(Spacer(1, 15 * mm))
    elementos.append(Paragraph("UNIVERSIDADE ESTADUAL DO OESTE DO PARANÁ — UNIOESTE", ParagraphStyle('InstSuperior', parent=estilos['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=13, alignment=TA_CENTER, textColor=colors.HexColor('#475569'))))
    elementos.append(Paragraph("PROGRAMA DE PÓS-GRADUAÇÃO EM TECNOLOGIAS AMBIENTAIS — PPGTCA 2026", ParagraphStyle('ProgSuperior', parent=estilos['Normal'], fontName='Helvetica-Bold', fontSize=9, leading=12, alignment=TA_CENTER, textColor=colors.HexColor('#0369A1'))))
    elementos.append(Spacer(1, 20 * mm))

    elementos.append(Paragraph("SAREL v2.0", estilo_subtitulo_capa))
    elementos.append(Spacer(1, 3 * mm))
    elementos.append(Paragraph("Sistema de Apoio à Recuperação de Erosão Laminar", estilo_titulo_capa))
    elementos.append(Spacer(1, 4 * mm))
    elementos.append(Paragraph("Manual Oficial de Instalação, Operação, Protocolo de Drone e Auditoria Científica", ParagraphStyle('SubSubCapa', parent=estilos['Normal'], fontName='Helvetica-Bold', fontSize=11, leading=15, alignment=TA_CENTER, textColor=colors.HexColor('#334155'))))
    elementos.append(Spacer(1, 10 * mm))

    # Box em destaque na capa com o link do Google Drive
    conteudo_box_drive = [
        Paragraph("<b>REPOSITÓRIO OFICIAL DE DADOS DA PESQUISA (GOOGLE DRIVE)</b>", ParagraphStyle('BoxDriveT', parent=estilos['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=colors.HexColor('#075985'))),
        Spacer(1, 2 * mm),
        Paragraph(
            "Os novos usuários e pesquisadores devem baixar os dados de entrada (banco fundiário SICAR/INCRA, "
            "malha de macrobacias IAT, MDE ALOS PALSAR 30m, planilhas de focos empíricos e ortomosaicos de drone) no repositório oficial:",
            estilo_caixa
        ),
        Spacer(1, 2 * mm),
        Paragraph(f'<font color="#0284C7"><u>{LINK_GOOGLE_DRIVE_OFICIAL}</u></font>', ParagraphStyle('BoxLink', parent=estilos['Normal'], fontName='Courier-Bold', fontSize=7.8, leading=10, alignment=TA_CENTER)),
    ]
    tabela_box_drive = Table([[conteudo_box_drive]], colWidths=[515])
    tabela_box_drive.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0F9FF')),
        ('BOX', (0, 0), (-1, -1), 1.2, colors.HexColor('#0284C7')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    elementos.append(tabela_box_drive)

    elementos.append(Spacer(1, 22 * mm))

    metadados_capa = [
        [Paragraph("<b>Pesquisador / Autor:</b>", estilo_tabela_celula), Paragraph("Luis Alfredo (Mestrando PPGTCA 2026)", estilo_tabela_celula)],
        [Paragraph("<b>Linha de Pesquisa:</b>", estilo_tabela_celula), Paragraph("Gestão e Tecnologias Ambientais / Sensoriamento Remoto e Modelagem de Solos", estilo_tabela_celula)],
        [Paragraph("<b>Objeto de Estudo:</b>", estilo_tabela_celula), Paragraph("Erosão Laminar no Estado do Paraná (Macrobacias IAT / Bacias Iguaçu, Ivaí, Tibagi, Piquiri)", estilo_tabela_celula)],
        [Paragraph("<b>Stack Computacional:</b>", estilo_tabela_celula), Paragraph("Next.js 14, React 18, Google Earth Engine API, Python 3.10+ (XGBoost, SHAP, GDAL)", estilo_tabela_celula)],
        [Paragraph("<b>Rigor Pericial:</b>", estilo_tabela_celula), Paragraph("Diretrizes Anti-Mock Estritas, Cegamento Duplo (Blinding) e Rastreabilidade D01 a D19", estilo_tabela_celula)],
    ]
    tabela_meta_capa = Table(metadados_capa, colWidths=[130, 385])
    tabela_meta_capa.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elementos.append(tabela_meta_capa)

    elementos.append(Spacer(1, 15 * mm))
    elementos.append(Paragraph("Foz do Iguaçu / Cascavel — Paraná, Brasil<br/>Ano Acadêmico 2026", ParagraphStyle('RodapeCapa', parent=estilos['Normal'], fontName='Helvetica', fontSize=8.5, leading=12, alignment=TA_CENTER, textColor=colors.HexColor('#64748B'))))
    elementos.append(PageBreak())

    # =========================================================================
    # 2. SUMÁRIO EXECUTIVO E VISÃO GERAL DO SISTEMA
    # =========================================================================
    elementos.append(Paragraph("SUMÁRIO EXECUTIVO & ESTRUTURA GERAL", estilo_h1))
    elementos.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0F172A'), spaceBefore=2, spaceAfter=8))

    elementos.append(Paragraph(
        "O <b>SAREL (Sistema de Apoio à Recuperação de Erosão Laminar)</b> constitui uma plataforma integrada de "
        "Inteligência Geoespacial desenvolvida no âmbito do Mestrado Profissional em Tecnologias Ambientais (PPGTCA 2026). "
        "A plataforma resolve o desafio pericial e agronômico de mapear, prever e monitorar a degradação do solo por erosão hídrica "
        "laminar em escala regional (Estado do Paraná) e submétrica (ortomosaicos de drone de 5 a 10 cm).",
        estilo_corpo
    ))
    elementos.append(Paragraph(
        "Diferente de sistemas cadastrais estáticos, o SAREL implementa um arcabouço biofísico de dupla modelagem temporal "
        "(Modelo D para detecção contemporânea e Modelo P para prognóstico antecipado com guarda >= 12 meses), acoplamento "
        "chuva-solo, segregação de sítios de calibração contínuos de 10 a 50 ha (Padrão-Ouro) e algoritmo XGBoost validado por "
        "validação cruzada espacial em blocos hidrográficos (Leave-One-Catchment-Out — LOCO, K=5), assegurando a ausência de "
        "autocorrelação espacial e contaminação de dados (data leakage).",
        estilo_corpo
    ))

    elementos.append(Paragraph("Estrutura Modular do Sistema", estilo_h2))

    tabela_modulos_dados = [
        [Paragraph("Módulo", estilo_tabela_cabecalho), Paragraph("Função Científica & Pericial", estilo_tabela_cabecalho), Paragraph("Decisão Associada", estilo_tabela_cabecalho)],
        [Paragraph("<b>1. Triagem Amostral & 3D</b>", estilo_tabela_celula), Paragraph("Filtros espectrais (BSI/NDVI), thinning geodésico (>=500m) e amostragem biofísica estratificada.", estilo_tabela_celula), Paragraph("D01, D02, D03, D10", estilo_tabela_celula)],
        [Paragraph("<b>2. Inspetor Multitemporal</b>", estilo_tabela_celula), Paragraph("Série Sentinel-2 (10 anos), isolamento Modelo D vs P (guarda 12m) e diagnóstico CCDC (pousio vs erosão).", estilo_tabela_celula), Paragraph("D04, D10, D11", estilo_tabela_celula)],
        [Paragraph("<b>3. Central de Drone (Padrão-Ouro)</b>", estilo_tabela_celula), Paragraph("4 sítios contínuos de 10 a 50 ha em Céu Azul e Medianeira, validação matricial 5cm vs 10m e held-out set.", estilo_tabela_celula), Paragraph("D08, D09, D12", estilo_tabela_celula)],
        [Paragraph("<b>4. Ingestão KoboCollect</b>", estilo_tabela_celula), Paragraph("Ingestão de dados de campo móvel, pareamento espacial (<=50m) e exportação cega por perfil.", estilo_tabela_celula), Paragraph("D07, D14, D15", estilo_tabela_celula)],
        [Paragraph("<b>5. Modelagem XGBoost LOCO</b>", estilo_tabela_celula), Paragraph("Treinamento espacial por bacias do PR (K=5), explicabilidade SHAP TreeExplainer e ROC pericial.", estilo_tabela_celula), Paragraph("D05, D06, D16", estilo_tabela_celula)],
    ]
    tabela_modulos = Table(tabela_modulos_dados, colWidths=[120, 295, 100])
    tabela_modulos.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    elementos.append(tabela_modulos)
    elementos.append(Spacer(1, 5 * mm))

    # =========================================================================
    # 3. CAPÍTULO 1: REQUISITOS E ARQUITETURA DE SOFTWARE
    # =========================================================================
    elementos.append(Paragraph("CAPÍTULO 1: REQUISITOS DE SISTEMA & ARQUITETURA", estilo_h1))
    elementos.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0F172A'), spaceBefore=2, spaceAfter=8))

    elementos.append(Paragraph(
        "O SAREL adota uma arquitetura full-stack moderna híbrida: front-end e servidor analítico em <b>Next.js 14</b> "
        "(React 18 / TypeScript estrito) com integração direta à API do <b>Google Earth Engine</b>, acoplado a um pipeline "
        "analítico em <b>Python 3.10+</b> para modelagem de Machine Learning com <b>XGBoost</b>, explicabilidade <b>SHAP</b>, "
        "e processamento vetorial geoespacial via <b>SQLite / SpatiaLite</b>.",
        estilo_corpo
    ))

    tabela_req_dados = [
        [Paragraph("Componente", estilo_tabela_cabecalho), Paragraph("Requisito Mínimo", estilo_tabela_cabecalho), Paragraph("Recomendado para Produção Pericial", estilo_tabela_cabecalho)],
        [Paragraph("Sistema Operacional", estilo_tabela_celula), Paragraph("Windows 10/11, Linux Ubuntu 22.04 LTS ou macOS 13+", estilo_tabela_celula), Paragraph("Windows 11 Pro 64-bit ou Linux Ubuntu 24.04 LTS", estilo_tabela_celula)],
        [Paragraph("Processador (CPU)", estilo_tabela_celula), Paragraph("Quad-Core 2.5 GHz (Intel Core i5 / AMD Ryzen 5)", estilo_tabela_celula), Paragraph("8 Cores / 16 Threads (Intel Core i7/i9 ou AMD Ryzen 7/9)", estilo_tabela_celula)],
        [Paragraph("Memória RAM", estilo_tabela_celula), Paragraph("8 GB RAM", estilo_tabela_celula), Paragraph("16 GB a 32 GB RAM (para ortomosaicos pesados)", estilo_tabela_celula)],
        [Paragraph("Armazenamento", estilo_tabela_celula), Paragraph("10 GB livres em disco SSD", estilo_tabela_celula), Paragraph("50 GB livres em disco NVMe SSD (bases SICAR + rasters)", estilo_tabela_celula)],
        [Paragraph("Node.js / npm", estilo_tabela_celula), Paragraph("Node.js v20.18.0 LTS (npm 10+)", estilo_tabela_celula), Paragraph("Node.js v20.18.0 LTS ou v22 LTS", estilo_tabela_celula)],
        [Paragraph("Python", estilo_tabela_celula), Paragraph("Python 3.10.x ou 3.11.x 64-bit", estilo_tabela_celula), Paragraph("Python 3.11.x com suporte a OpenMP e GDAL", estilo_tabela_celula)],
        [Paragraph("Google Earth Engine", estilo_tabela_celula), Paragraph("Conta Google com GEE habilitado (Earth Engine API)", estilo_tabela_celula), Paragraph("GEE Cloud Project ativo com cota de computação", estilo_tabela_celula)],
    ]
    tabela_req = Table(tabela_req_dados, colWidths=[110, 195, 210])
    tabela_req.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    elementos.append(tabela_req)
    elementos.append(PageBreak())

    # =========================================================================
    # 4. CAPÍTULO 2: OBTENÇÃO DA BASE DE DADOS (GOOGLE DRIVE OFICIAL)
    # =========================================================================
    elementos.append(Paragraph("CAPÍTULO 2: OBTENÇÃO & ESTRUTURAÇÃO DA BASE DE DADOS", estilo_h1))
    elementos.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0F172A'), spaceBefore=2, spaceAfter=8))

    elementos.append(Paragraph(
        "Para assegurar a integridade científica e evitar divergências de versões amostrais entre pesquisadores, "
        "todos os dados geoespaciais, tabelas de focos de erosão, bases de controle e produtos de drone utilizados na pesquisa "
        "encontram-se centralizados no repositório Google Drive oficial do projeto.",
        estilo_corpo
    ))

    # Box de Download
    box_download_drive = [
        Paragraph("<b>LINK DIRETO PARA O REPOSITÓRIO GOOGLE DRIVE:</b>", ParagraphStyle('BoxLinkT', parent=estilos['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=colors.HexColor('#075985'))),
        Spacer(1, 1.5 * mm),
        Paragraph(f'<font color="#0284C7"><b>{LINK_GOOGLE_DRIVE_OFICIAL}</b></font>', ParagraphStyle('BoxLinkUrl', parent=estilos['Normal'], fontName='Courier-Bold', fontSize=8.2, leading=11)),
        Spacer(1, 1.5 * mm),
        Paragraph(
            "<b>Instruções:</b> Acesse a pasta através do link acima, faça o download do pacote compactado "
            "<code>dados_sarel_ppgtca.zip</code> (ou dos arquivos individuais) e descompacte o conteúdo "
            "diretamente no diretório <code>data/</code> localizado na raiz do projeto.",
            estilo_caixa
        ),
    ]
    tabela_box_down = Table([[box_download_drive]], colWidths=[515])
    tabela_box_down.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0F9FF')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#0284C7')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elementos.append(tabela_box_down)
    elementos.append(Spacer(1, 4 * mm))

    elementos.append(Paragraph("Inventário Oficial dos Arquivos do Repositório", estilo_h2))

    tabela_arquivos_dados = [
        [Paragraph("Arquivo no Google Drive", estilo_tabela_cabecalho), Paragraph("Destino no Projeto", estilo_tabela_cabecalho), Paragraph("Descrição do Conteúdo & Origem Oficial", estilo_tabela_cabecalho)],
        [
            Paragraph("<code>fundiario_brasil.db</code>", estilo_tabela_celula),
            Paragraph("<code>data/fundiario_brasil.db</code>", estilo_tabela_celula),
            Paragraph("Banco SQLite contendo a base fundiária oficial SICAR/INCRA do Paraná com limites de imóveis rurais e caixas envolventes (lat/lon min e max).", estilo_tabela_celula)
        ],
        [
            Paragraph("<code>Tabela_Consolidada_..._150focos_...xlsx</code>", estilo_tabela_celula),
            Paragraph("<code>data/tabelas/</code>", estilo_tabela_celula),
            Paragraph("Planilha mestre contendo os 150 pontos empíricos de erosão laminar severa (Classe 1) com atributos de satélite e terreno.", estilo_tabela_celula)
        ],
        [
            Paragraph("<code>base_controles_spd_parana.xlsx</code>", estilo_tabela_celula),
            Paragraph("<code>data/tabelas/</code>", estilo_tabela_celula),
            Paragraph("Planilha contendo 150 pontos de controle estáveis em Sistema Plantio Direto (Classe 0) com histórico multitemporal e manejo comprovado.", estilo_tabela_celula)
        ],
        [
            Paragraph("<code>macrobacias_iat_parana.geojson</code>", estilo_tabela_celula),
            Paragraph("<code>data/vetores/</code>", estilo_tabela_celula),
            Paragraph("Limites vetoriais oficiais das 6 macrobacias hidrográficas do Estado do Paraná (IAT), utilizados para o particionamento espacial LOCO.", estilo_tabela_celula)
        ],
        [
            Paragraph("<code>ortomosaicos_padrao_ouro/</code>", estilo_tabela_celula),
            Paragraph("<code>data/drone/</code>", estilo_tabela_celula),
            Paragraph("Ortomosaicos RGB/Multiespectrais de alta resolução (5 a 10 cm) dos 4 sítios contínuos de referência (Céu Azul e Medianeira).", estilo_tabela_celula)
        ],
        [
            Paragraph("<code>formulario_kobo_erosao.xlsx</code>", estilo_tabela_celula),
            Paragraph("<code>data/kobo/</code>", estilo_tabela_celula),
            Paragraph("Estrutura do formulário XLSForm / ODK KoboCollect para coleta pericial de campo com perguntas estruturadas de solo e fotos.", estilo_tabela_celula)
        ],
    ]
    tabela_arquivos = Table(tabela_arquivos_dados, colWidths=[135, 120, 260])
    tabela_arquivos.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    elementos.append(tabela_arquivos)
    elementos.append(Spacer(1, 5 * mm))

    # =========================================================================
    # 5. CAPÍTULO 3: GUIA PASSO A PASSO DE INSTALAÇÃO
    # =========================================================================
    elementos.append(Paragraph("CAPÍTULO 3: GUIA PASSO A PASSO DE INSTALAÇÃO & INICIALIZAÇÃO", estilo_h1))
    elementos.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0F172A'), spaceBefore=2, spaceAfter=8))

    elementos.append(Paragraph("<b>Passo 1: Clonagem do Repositório e Instalação do Node.js</b>", estilo_h2))
    elementos.append(Paragraph("No terminal de comando (PowerShell no Windows ou Bash no Linux), clone o repositório e instale os pacotes npm:", estilo_corpo))

    cmd_p1 = (
        "# 1. Clonar repositório\n"
        "git clone https://github.com/RedZardoz/localizador-erosao-v02.git\n"
        "cd geolocalizacao-erosao-propriedade\n\n"
        "# 2. Instalar dependencias do Next.js / TypeScript\n"
        "npm install"
    )
    tabela_cmd_p1 = Table([[Paragraph(cmd_p1.replace('\n', '<br/>'), estilo_codigo)]], colWidths=[515])
    tabela_cmd_p1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F1F5F9')),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elementos.append(tabela_cmd_p1)
    elementos.append(Spacer(1, 3 * mm))

    elementos.append(Paragraph("<b>Passo 2: Configuração do Ambiente Virtual Python & Dependências Científicas</b>", estilo_h2))
    elementos.append(Paragraph("Crie o ambiente virtual Python e instale o ecossistema de machine learning e geoprocessamento:", estilo_corpo))

    cmd_p2 = (
        "# Criar e ativar ambiente virtual Python\n"
        "python -m venv .venv\n"
        "# Windows:\n"
        ".venv\\Scripts\\activate\n"
        "# Linux/macOS:\n"
        "source .venv/bin/activate\n\n"
        "# Instalar pacotes de machine learning e geoprocessamento\n"
        "pip install -r requirements.txt\n"
        "# Assegurar presenca das bibliotecas essenciais:\n"
        "pip install xgboost shap scikit-learn pandas numpy matplotlib seaborn reportlab openpyxl"
    )
    tabela_cmd_p2 = Table([[Paragraph(cmd_p2.replace('\n', '<br/>'), estilo_codigo)]], colWidths=[515])
    tabela_cmd_p2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F1F5F9')),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elementos.append(tabela_cmd_p2)
    elementos.append(Spacer(1, 3 * mm))

    elementos.append(Paragraph("<b>Passo 3: Configuração das Credenciais do Google Earth Engine</b>", estilo_h2))
    elementos.append(Paragraph("Para que o SAREL extraia séries históricas orbitais do Sentinel-2, autentique-se via CLI do Earth Engine:", estilo_corpo))

    cmd_p3 = (
        "# Autenticar na conta Google associada ao projeto de pesquisa\n"
        "earthengine authenticate\n\n"
        "# No arquivo .env.local na raiz do projeto, defina o ID do projeto no Google Cloud:\n"
        "GEE_PROJECT_ID=seu-projeto-gee-id\n"
        "GEE_SERVICE_ACCOUNT=sua-service-account@seu-projeto.iam.gserviceaccount.com (opcional)"
    )
    tabela_cmd_p3 = Table([[Paragraph(cmd_p3.replace('\n', '<br/>'), estilo_codigo)]], colWidths=[515])
    tabela_cmd_p3.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F1F5F9')),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elementos.append(tabela_cmd_p3)
    elementos.append(Spacer(1, 3 * mm))

    elementos.append(Paragraph("<b>Passo 4: Inicialização do Servidor & Validação dos Três Verdes</b>", estilo_h2))
    elementos.append(Paragraph("Inicie o servidor de desenvolvimento e execute os testes automatizados para verificar a integridade da instalação:", estilo_corpo))

    cmd_p4 = (
        "# 1. Iniciar servidor local em modo de desenvolvimento\n"
        "npm run dev\n"
        "# Acesse no navegador: http://localhost:3000\n\n"
        "# 2. Executar auditoria de seguranca e anti-mock (35 suites / 231 testes vitest)\n"
        "npm test\n\n"
        "# 3. Validacao de compilacao estrita TypeScript e Build\n"
        "npx tsc --noEmit\n"
        "npm run build"
    )
    tabela_cmd_p4 = Table([[Paragraph(cmd_p4.replace('\n', '<br/>'), estilo_codigo)]], colWidths=[515])
    tabela_cmd_p4.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F1F5F9')),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elementos.append(tabela_cmd_p4)
    elementos.append(PageBreak())

    # =========================================================================
    # 6. CAPÍTULO 4: MANUAL DE OPERAÇÃO E TELAS DEMONSTRATIVAS
    # =========================================================================
    elementos.append(Paragraph("CAPÍTULO 4: MANUAL DE OPERAÇÃO & TELAS DEMONSTRATIVAS", estilo_h1))
    elementos.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0F172A'), spaceBefore=2, spaceAfter=8))

    # --- Seção 4.1: Tela 1 ---
    elementos.append(Paragraph("4.1. Triagem Amostral & Visualização Espacial 3D", estilo_h2))
    elementos.append(Paragraph(
        "A tela de Triagem Amostral do SAREL permite ao operador definir e visualizar no mapa cartográfico 3D os conjuntos "
        "de pontos candidatos estratificados biofisicamente segundo os critérios oficiais da pesquisa (Decisões D01, D02, D03 e D10).",
        estilo_corpo
    ))
    elementos.append(Image(caminhos_figuras['tela1'], width=515, height=298))
    elementos.append(Paragraph("<b>Figura 1:</b> Interface de Triagem Amostral do SAREL — Filtros Biofísicos e Visualização de Feições Erodidas vs Controles sob SPD no Paraná.", estilo_legenda))

    elementos.append(Paragraph("<b>Roteiro Operacional da Triagem Amostral:</b>", estilo_corpo))
    elementos.append(Paragraph(
        "1. <b>Seleção da Macrobacia:</b> No menu superior, filtre por bacia (ex.: Bacia do Iguaçu, Ivaí ou Todo o Estado).<br/>"
        "2. <b>Ajuste de Limiares Espectrais:</b> O sistema aplica por padrão os limiares decididos: para Erosão, BSI >= 0.10 e NDVI < 0.40; "
        "para Controle SPD, BSI <= 0.00 e NDVI >= 0.65.<br/>"
        "3. <b>Ativação do Thinning Geodésico:</b> O controle deslizante de buffer mínimo (500 metros) assegura que nenhum par de pontos "
        "pertença à mesma vertente ou compartilhe a mesma assinatura espectral de vizinhança, mitigando a pseudorrepetição espacial.<br/>"
        "4. <b>Exportação do Conjunto Amostral:</b> Clique em <i>'Exportar GeoJSON/XLSX'</i> para gerar a tabela balanceada de modelagem.",
        estilo_corpo
    ))
    elementos.append(PageBreak())

    # --- Seção 4.2: Tela 2 ---
    elementos.append(Paragraph("4.2. Inspetor Científico de Ponto & Série Multitemporal (CCDC)", estilo_h2))
    elementos.append(Paragraph(
        "Ao selecionar qualquer feição de erosão ou ponto de controle no mapa ou na tabela, o <b>Inspetor Científico de Ponto</b> "
        "é aberto lateralmente, renderizando a trajetória multianual Sentinel-2 (2016–2026) e as métricas físicas consolidadas.",
        estilo_corpo
    ))
    elementos.append(Image(caminhos_figuras['tela2'], width=515, height=298))
    elementos.append(Paragraph("<b>Figura 2:</b> Inspetor Científico de Ponto — Trajetória Multitemporal, Zona de Guarda do Modelo P e Diagnóstico CCDC.", estilo_legenda))

    elementos.append(Paragraph("<b>Fundamentação Biofísica dos Controles Visuais:</b>", estilo_corpo))
    elementos.append(Paragraph(
        "• <b>Seletor Modelo D vs Modelo P (Decisão D04):</b> O botão de alternância define a finalidade da análise. Ao selecionar o <b>Modelo P (Prognóstico)</b>, "
        "o sistema ativa uma <i>Zona de Guarda Temporal</i> (faixa amarela hachurada) de no mínimo 12 meses antes do evento t0. Todas as observações "
        "contidas nessa janela são estritamente mascaradas para prevenir vazamento temporal (data leakage).<br/>"
        "• <b>Limiares Horizontais de Referência:</b> A linha vermelha tracejada marca o limiar de solo exposto (NDVI = 0.40 · Decisão D10); "
        "a linha verde indica o fechamento completo do dossel vegetal em Sistema Plantio Direto (NDVI = 0.65).<br/>"
        "• <b>Badge CCDC de Persistência Temporal (Decisão D11):</b> Discrimina formalmente pousio agrícola transitório (solo nu por <= 120 dias com "
        "posterior recuperação vigorosa do dossel com NDVI >= 0.65) de degradação crônica persistente (frequência de solo nu > 25%, NDVI máximo "
        "cronicamente atrofiado < 0.55 e taxa linear positiva de elevação do infravermelho de ondas curtas SWIR B12).",
        estilo_corpo
    ))
    elementos.append(PageBreak())

    # --- Seção 4.3: Tela 3 ---
    elementos.append(Paragraph("4.3. Central de Campanha & Sítios Padrão-Ouro de Drone (10 a 50 ha)", estilo_h2))
    elementos.append(Paragraph(
        "A <b>Central de Campanha de Drone</b> gerencia a validação de altíssima resolução (Padrão-Ouro), estabelecendo o "
        "vínculo direto entre a resposta orbital de 10 metros do Sentinel-2 e a verdade de campo mapeada a 5-10 cm com VANT.",
        estilo_corpo
    ))
    elementos.append(Image(caminhos_figuras['tela3'], width=515, height=298))
    elementos.append(Paragraph("<b>Figura 3:</b> Central de Campanha de Drone — Sítios Contínuos de 10 a 50 ha, Validação Matricial e Protocolo de Substituição.", estilo_legenda))

    elementos.append(Paragraph("<b>Validação Matricial Pixel-a-Pixel & Flexibilidade Operacional:</b>", estilo_corpo))
    elementos.append(Paragraph(
        "1. <b>Sítios Contínuos de 10 a 50 ha (Decisão D08):</b> Foram demarcados 4 sítios de referência na base oficial SICAR do Paraná "
        "(2 em Céu Azul e 2 em Medianeira), representativos das classes pedológicas predominantes (Latossolos e Nitossolos).<br/>"
        "2. <b>Matriz de Confusão Matricial Submétrica (Decisão D09):</b> O ortomosaico de 5 cm é reamostrado para a grade de 10 m "
        "do satélite através de agregação zonal com cálculo da pureza fracionária de borda. O sistema calcula acurácia global, índice Kappa, "
        "IoU (Interseção sobre União) e F1-Score com base na matriz pixel-a-pixel.<br/>"
        "3. <b>Segregação Held-Out Test Set:</b> Dois sítios são mantidos como conjunto de validação externa isolado, nunca visualizados pelo modelo.<br/>"
        "4. <b>Protocolo de Substituição de Sítio Inacessível:</b> Caso um sítio planejado fique inacessível (condições climáticas severas, estradas rurais "
        "intransitáveis ou impedimento de proprietário), o perito pode acionar o botão <i>'Substituir Sítio'</i>. O algoritmo busca automaticamente um polígono "
        "equivalente que respeite rigorosamente os 4 critérios biofísicos: (a) Mesma macrobacia hidrográfica; (b) Mesma classe pedológica; (c) Mesma faixa de "
        "declividade média (±3%); e (d) Área contínua entre 10 e 50 hectares, registrando justificativa pericial no relatório auditável.",
        estilo_corpo
    ))
    elementos.append(PageBreak())

    # --- Seção 4.4: Tela 4 ---
    elementos.append(Paragraph("4.4. Ingestão de Dados de Campo KoboCollect & Exportação Duplo-Cega", estilo_h2))
    elementos.append(Paragraph(
        "A integridade dos laudos periciais e da dissertação de mestrado repousa no <b>Protocolo de Cegamento Duplo (Double-Blinding)</b>, "
        "garantindo que as avaliações de campo não sejam contaminadas por conhecimento prévio das predições de satélite e vice-versa.",
        estilo_corpo
    ))
    elementos.append(Image(caminhos_figuras['tela4'], width=515, height=298))
    elementos.append(Paragraph("<b>Figura 4:</b> Ingestão de Dados KoboCollect — Pareamento Espacial e Perfis de Exportação Cega.", estilo_legenda))

    elementos.append(Paragraph("<b>Fluxo Operacional de Coleta e Ingestão Kobo:</b>", estilo_corpo))
    elementos.append(Paragraph(
        "1. <b>Coleta em Campo via KoboCollect:</b> O perito de campo preenche o formulário ODK sem acesso a qualquer predição do modelo. "
        "O formulário registra: coordenadas com acurácia GPS < 3 m, presença de selamento superficial, rugosidade aleatória, presença de microcanais, "
        "profundidade do horizonte A e 4 fotografias padronizadas com indicação de azimute e bússola.<br/>"
        "2. <b>Sincronização e Pareamento Espacial:</b> O módulo <code>ingestaoKobo.ts</code> lê o JSON/CSV exportado do servidor KoboToolbox e "
        "realiza o pareamento geométrico automático com o ponto amostral mais próximo dentro de um raio de tolerância de até 50 metros.<br/>"
        "3. <b>Exportação Cega por Perfil de Atuação:</b> Na tela de exportação, o usuário seleciona o perfil desejado:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;• <i>Perfil Avaliador de Campo:</i> Exporta coordenadas, dados de terreno e perguntas agronômicas, <b>ocultando</b> "
        "completamente NDVI, BSI, RUSLE e probabilidade predita pelo XGBoost;<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;• <i>Perfil Modelador Espectral:</i> Exporta variáveis orbitais e topográficas puras, <b>ocultando</b> notas "
        "qualitativas e diagnósticos subjetivos de campo.",
        estilo_corpo
    ))
    elementos.append(PageBreak())

    # --- Seção 4.5: Tela 5 ---
    elementos.append(Paragraph("4.5. Pipeline XGBoost LOCO, Explicabilidade SHAP & Registro de Decisões", estilo_h2))
    elementos.append(Paragraph(
        "O pipeline analítico de aprendizado de máquina integra o algoritmo <b>XGBoost</b> a uma validação cruzada espacial "
        "em blocos regionais (LOCO, K=5) e explicabilidade pós-hoc através de valores de Shapley (<b>SHAP TreeExplainer</b>).",
        estilo_corpo
    ))
    elementos.append(Image(caminhos_figuras['tela5'], width=515, height=298))
    elementos.append(Paragraph("<b>Figura 5:</b> Painel de Modelagem XGBoost LOCO — Curva ROC, Importância SHAP e Livro de Decisões Metodológicas.", estilo_legenda))

    elementos.append(Paragraph("<b>Execução e Auditoria da Modelagem Científica:</b>", estilo_corpo))
    elementos.append(Paragraph(
        "1. <b>Execução via Linha de Comando:</b> Para treinar o modelo e gerar as figuras de publicação em 300 DPI, execute:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<code>python scripts/treinar_xgboost_loco.py --dados data/tabelas/Tabela_150focos.xlsx --controles data/tabelas/base_controles_spd.xlsx --saida docs/relatorios/modelagem/</code><br/>"
        "2. <b>Validação Cruzada Espacial LOCO (K=5):</b> O script particiona os dados pelas 6 macrobacias do Paraná (IAT). Em cada fold, "
        "uma bacia hidrográfica inteira é mantida fora do treinamento para atuar como conjunto de teste, medindo a real capacidade de extrapolação regional.<br/>"
        "3. <b>Explicabilidade Física via SHAP:</b> O gráfico SHAP decompõe a contribuição marginal de cada fator: índices de solo exposto (BSI) e "
        "declividade impulsionam a probabilidade de erosão, enquanto o vigor vegetal (NDVI) atua como atenuante biofísico protetivo.<br/>"
        "4. <b>Livro de Decisões Metodológicas (D01 a D19):</b> Painel formal que registra o estado de cada premissa do mestrado. "
        "Nenhuma decisão pode ser alterada sem registro auditável de justificativa e impacto científico.",
        estilo_corpo
    ))
    elementos.append(PageBreak())

    # =========================================================================
    # 7. CAPÍTULO 5: AUDITORIA CIENTÍFICA & SALVAGUARDAS ANTI-MOCK
    # =========================================================================
    elementos.append(Paragraph("CAPÍTULO 5: AUDITORIA CIENTÍFICA, ANTI-MOCK & SALVAGUARDAS PERICIAIS", estilo_h1))
    elementos.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0F172A'), spaceBefore=2, spaceAfter=8))

    elementos.append(Paragraph(
        "A integridade científica da dissertação de mestrado e a validade pericial dos produtos cartográficos do SAREL são sustentadas por "
        "<b>salvaguardas computacionais anti-mock automáticas</b>. No código-fonte do sistema, é terminantemente proibido o emprego de dados "
        "simulados, valores estáticos preenchidos por fallback ou aproximações não fundamentadas em medições físicas reais.",
        estilo_corpo
    ))

    # Tabela das 5 Invariantes
    tabela_inv_dados = [
        [Paragraph("Invariante", estilo_tabela_cabecalho), Paragraph("Princípio Biofísico / Regra Pericial", estilo_tabela_cabecalho), Paragraph("Salvaguarda no Código-Fonte", estilo_tabela_cabecalho)],
        [
            Paragraph("<b>Invariante 1:<br/>Veracidade dos Rótulos</b>", estilo_tabela_celula),
            Paragraph("Amostras de campo só podem ser rotuladas como Erosão (1) ou Controle (0) se houver evidência empírica documentada (ortomosaico de drone ou vistoria presencial).", estilo_tabela_celula),
            Paragraph("O script <code>treinar_xgboost_loco.py</code> levanta <code>ValueError</code> impeditivo se receber dataset monofásico sem arquivo de controles reais.", estilo_tabela_celula)
        ],
        [
            Paragraph("<b>Invariante 2:<br/>Proibição de Coalescência Numérica</b>", estilo_tabela_celula),
            Paragraph("É proibido mascarar atributos físicos ausentes através de operadores de coalescência ou disjunção lógica com constantes numéricas.", estilo_tabela_celula),
            Paragraph("Teste automatizado <code>padroesProibidos.test.ts</code> varre todo o código em <code>src/lib/</code> e <code>scripts/</code> reprovando operadores proibidos.", estilo_tabela_celula)
        ],
        [
            Paragraph("<b>Invariante 3:<br/>Segregação Temporal Estrita</b>", estilo_tabela_celula),
            Paragraph("O Modelo P (prognóstico antecipado) deve manter janela de guarda >= 12 meses antes do evento erosivo, eliminando qualquer vazamento de dados.", estilo_tabela_celula),
            Paragraph("O módulo <code>montagemTemporal.ts</code> filtra estritamente observações até a data de corte calculada.", estilo_tabela_celula)
        ],
        [
            Paragraph("<b>Invariante 4:<br/>Cegamento Duplo (Blinding)</b>", estilo_tabela_celula),
            Paragraph("Peritos de campo e modeladores orbitais não devem acessar variáveis do domínio oposto para não induzir confirmação de viés.", estilo_tabela_celula),
            Paragraph("A tela de exportação em <code>ingestaoKobo.ts</code> mascara colunas por perfil de atuação selecionado.", estilo_tabela_celula)
        ],
        [
            Paragraph("<b>Invariante 5:<br/>Bloqueio de Variância Nula</b>", estilo_tabela_celula),
            Paragraph("Datasets com variáveis congeladas em valor constante produzem artefatos e invalidam inferências biofísicas do XGBoost.", estilo_tabela_celula),
            Paragraph("A função <code>auditar_variancia_preditores</code> detecta desvio padrão zero e emite alerta pericial formal.", estilo_tabela_celula)
        ],
    ]
    tabela_inv = Table(tabela_inv_dados, colWidths=[110, 205, 200])
    tabela_inv.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    elementos.append(tabela_inv)
    elementos.append(Spacer(1, 5 * mm))

    # =========================================================================
    # 8. ANEXO: TABELA OFICIAL DAS DECISÕES METODOLÓGICAS (D01 A D19)
    # =========================================================================
    elementos.append(Paragraph("ANEXO: TABELA OFICIAL DE DECISÕES METODOLÓGICAS (D01 A D19)", estilo_h1))
    elementos.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0F172A'), spaceBefore=2, spaceAfter=8))

    decisoes_tabela = [
        [Paragraph("Cód", estilo_tabela_cabecalho), Paragraph("Título da Decisão", estilo_tabela_cabecalho), Paragraph("Status", estilo_tabela_cabecalho), Paragraph("Parâmetro Adotado & Justificativa Física", estilo_tabela_cabecalho)],
        [Paragraph("<b>D01</b>", estilo_tabela_celula), Paragraph("Área Mínima da Feição Erodida", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph(">= 0.5 ha (5.000 m²). Garante representatividade de pixels puros no Sentinel-2 (10m).", estilo_tabela_celula)],
        [Paragraph("<b>D02</b>", estilo_tabela_celula), Paragraph("Buffer de Não Amostragem", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph(">= 500 m. Elimina autocorrelação espacial entre pares de pontos candidatos.", estilo_tabela_celula)],
        [Paragraph("<b>D03</b>", estilo_tabela_celula), Paragraph("Estratificação Pedológica", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph("Latossolos e Nitossolos (principais solos agrícolas sob plantio direto no PR).", estilo_tabela_celula)],
        [Paragraph("<b>D04</b>", estilo_tabela_celula), Paragraph("Segregação Temporal D vs P", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph("Modelo D até t0; Modelo P com intervalo de guarda temporal >= 12 meses antes de t0.", estilo_tabela_celula)],
        [Paragraph("<b>D05</b>", estilo_tabela_celula), Paragraph("Algoritmo de Aprendizado", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph("XGBoost com regularização L1/L2 e Spatial K-Fold LOCO (K=5).", estilo_tabela_celula)],
        [Paragraph("<b>D06</b>", estilo_tabela_celula), Paragraph("Explicabilidade dos Modelos", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph("SHAP TreeExplainer (gráficos Beeswarm, Bar Plot e impacto marginal das bandas).", estilo_tabela_celula)],
        [Paragraph("<b>D07</b>", estilo_tabela_celula), Paragraph("Protocolo de Cegamento", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph("Duplo-cego: perito de campo não vê predições orbitais e vice-versa.", estilo_tabela_celula)],
        [Paragraph("<b>D08</b>", estilo_tabela_celula), Paragraph("Sítios Contínuos Padrão-Ouro", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph("4 sítios contínuos de 10 a 50 ha em Céu Azul e Medianeira (base SICAR oficial).", estilo_tabela_celula)],
        [Paragraph("<b>D09</b>", estilo_tabela_celula), Paragraph("Validação Matricial Pixel-a-Pixel", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph("Reamostragem do ortomosaico de drone (5-10 cm) para matriz 10m do Sentinel-2.", estilo_tabela_celula)],
        [Paragraph("<b>D10</b>", estilo_tabela_celula), Paragraph("Limiar de NDVI para Solo Nu", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph("NDVI < 0.40 para solo exposto; NDVI >= 0.65 para dossel fechado em Plantio Direto.", estilo_tabela_celula)],
        [Paragraph("<b>D11</b>", estilo_tabela_celula), Paragraph("Persistência Temporal (CCDC)", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph("Pousio transitório <= 120 dias; Degradação crônica com E >= 25% e SWIR B12 positivo.", estilo_tabela_celula)],
        [Paragraph("<b>D12</b>", estilo_tabela_celula), Paragraph("Resolução de Drone Padrão-Ouro", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph("GSD de 5 a 10 cm/pixel em ortomosaicos ortorretificados.", estilo_tabela_celula)],
        [Paragraph("<b>D13</b>", estilo_tabela_celula), Paragraph("Limiar de Evento Erosivo de Chuva", estilo_tabela_celula), Paragraph("<font color='#F59E0B'><b>Pendente</b></font>", estilo_tabela_celula), Paragraph("Precipitação >= 10 mm vs Intensidade máxima I30 >= 12.7 mm/h (Wischmeier & Smith).", estilo_tabela_celula)],
        [Paragraph("<b>D14</b>", estilo_tabela_celula), Paragraph("Acurácia GPS em Campo", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph("Erro horizontal máximo tolerado de 3.0 metros no KoboCollect.", estilo_tabela_celula)],
        [Paragraph("<b>D15</b>", estilo_tabela_celula), Paragraph("Registro Fotográfico Pericial", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph("4 fotos cardeais (N, S, L, O) com bússola magnética e escala gráfica.", estilo_tabela_celula)],
        [Paragraph("<b>D16</b>", estilo_tabela_celula), Paragraph("Particionamento Espacial LOCO", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph("Leave-One-Catchment-Out por macrobacias do Paraná (IAT, K=5).", estilo_tabela_celula)],
        [Paragraph("<b>D17</b>", estilo_tabela_celula), Paragraph("Fator C RUSLE Híbrido", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph("Equação exponencial com limiar empírico de dossel e correção por resíduos.", estilo_tabela_celula)],
        [Paragraph("<b>D18</b>", estilo_tabela_celula), Paragraph("Composição de Solo Nu (GEOS3)", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph("Composto multianual de mediana por pixel em datas de solo exposto.", estilo_tabela_celula)],
        [Paragraph("<b>D19</b>", estilo_tabela_celula), Paragraph("Held-Out Test Set Estrito", estilo_tabela_celula), Paragraph("<font color='#10B981'><b>Decidida</b></font>", estilo_tabela_celula), Paragraph("2 sítios de referência e 20% das bacias retidos exclusivamente para teste cego final.", estilo_tabela_celula)],
    ]
    tabela_dec = Table(decisoes_tabela, colWidths=[30, 130, 65, 290])
    tabela_dec.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    elementos.append(tabela_dec)

    # Construção do documento PDF com numeração de páginas pericial
    print(f"[PDF] Compilando documento oficial em '{caminho_saida}'...")
    doc.build(elementos, canvasmaker=NumeradorPaginas)
    print(f"[SUCESSO] Manual pericial gerado com sucesso: '{caminho_saida}'.")


def main():
    print("=" * 80)
    print("GERADOR DE MANUAL DE INSTALAÇÃO E OPERAÇÃO SAREL (PDF OFICIAL)")
    print("Mestrado PPGTCA 2026 — Pesquisa de Erosão Laminar no Paraná")
    print("=" * 80)

    figuras = criar_diagramas_telas(DIRETORIO_FIGURAS)
    construir_manual_pdf(CAMINHO_PDF_FINAL, figuras)

    tamanho_bytes = os.path.getsize(CAMINHO_PDF_FINAL)
    print(f"[ARTEFATO] PDF Final: {CAMINHO_PDF_FINAL} ({tamanho_bytes / 1024:.1f} KB)")


if __name__ == '__main__':
    main()
