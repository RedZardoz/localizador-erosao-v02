# -*- coding: utf-8 -*-
"""
=============================================================================
GERADOR DE IMAGENS DE FÓRMULAS MATEMÁTICAS DO SAREL (LATEX / MATHTEXT)
Mestrado PPGTCA 2026 — Universidade Tecnológica Federal do Paraná (UTFPR)
Renderiza as 12 formulações canônicas em alta resolução (300 DPI) para
inserção na Apresentação (PPTX / MD) e no Manual Metodológico (PDF).
=============================================================================
"""

import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import rcParams

# Configurações de tipografia matemática limpa
rcParams['mathtext.fontset'] = 'cm'  # Computer Modern (padrão LaTeX canônico)
rcParams['font.family'] = 'serif'

PASTA_SAIDA = "docs/figuras_formulas"
os.makedirs(PASTA_SAIDA, exist_ok=True)

# Definição das 12 formulações individuais
FORMULAS_INDIVIDUAIS = [
    (
        "formula_01_ndvi",
        r"$\mathrm{NDVI} = \frac{B8 - B4}{B8 + B4}$",
        "#0F172A", 16, 5.0, 0.9
    ),
    (
        "formula_02_bsi",
        r"$\mathrm{BSI} = \frac{(B11 + B4) - (B8 + B2)}{(B11 + B4) + (B8 + B2)}$",
        "#0F172A", 15, 6.2, 0.95
    ),
    (
        "formula_03_harmonicos",
        r"$\hat{y}(t) = c_0 + c_1 t + \sum_{k=1}^m \left[ a_k \cos\left(\frac{2\pi k t}{T}\right) + b_k \sin\left(\frac{2\pi k t}{T}\right) \right]$",
        "#0F172A", 14, 7.8, 1.05
    ),
    (
        "formula_04_solo_nu",
        r"$\hat{E} = \frac{1}{N} \sum_{i=1}^N \mathbb{I}(\mathrm{NDVI}_i \leq 0{,}25)$",
        "#0F172A", 16, 5.5, 0.95
    ),
    (
        "formula_05_fator_c",
        r"$C = \left[ \frac{1 - \mathrm{NDVI}}{2} \right]^{(1 + \mathrm{NDVI})}$",
        "#0F172A", 16, 5.2, 1.0
    ),
    (
        "formula_06_fator_k",
        r"$K \in \{0{,}0052;\ 0{,}0117;\ 0{,}0218;\ 0{,}0360;\ 0{,}0518\}\ \mathrm{t}\cdot\mathrm{h}\cdot\mathrm{MJ}^{-1}\cdot\mathrm{mm}^{-1}$",
        "#0F172A", 13.5, 8.2, 0.85
    ),
    (
        "formula_07_rusle",
        r"$A = R \times K \times LS \times C \times P$",
        "#0F172A", 17, 5.5, 0.85
    ),
    (
        "formula_08_g2",
        r"$I_{\mathrm{mecanismo}} = \sum_{t=1}^T \left( R_t \times \mathbb{I}(\mathrm{NDVI}_t \leq 0{,}25) \right)$",
        "#0F172A", 15, 6.2, 0.95
    ),
    (
        "formula_09_xgboost",
        r"$\mathcal{L}^{(t)} \approx \sum_{i=1}^n \left[ g_i f_t(x_i) + \frac{1}{2} h_i f_t^2(x_i) \right] + \gamma T + \frac{1}{2} \lambda \sum_{j=1}^T w_j^2$",
        "#0F172A", 14, 8.2, 1.05
    ),
    (
        "formula_10_split_gain",
        r"$\mathcal{L}_{\mathrm{split}} = \frac{1}{2} \left[ \frac{G_L^2}{H_L + \lambda} + \frac{G_R^2}{H_R + \lambda} - \frac{(G_L + G_R)^2}{H_L + H_R + \lambda} \right] - \gamma$",
        "#0F172A", 14, 7.8, 1.05
    ),
    (
        "formula_11_kappa",
        r"$\kappa = \frac{P_o - P_e}{1 - P_e}$",
        "#0F172A", 17, 3.8, 0.9
    ),
    (
        "formula_12_shap",
        r"$\phi_i(f, x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|! (|F| - |S| - 1)!}{|F|!} \left[ f_x(S \cup \{i\}) - f_x(S) \right]$",
        "#0F172A", 13.5, 8.5, 1.05
    ),
]

def renderizar_formulas_individuais():
    """Gera arquivos PNG individuais para cada uma das 12 fórmulas."""
    for nome, tex, cor, font_size, w, h in FORMULAS_INDIVIDUAIS:
        fig = plt.figure(figsize=(w, h), dpi=300)
        fig.patch.set_facecolor("white")
        ax = plt.subplot(111)
        ax.axis("off")
        ax.text(0.5, 0.5, tex, fontsize=font_size, ha="center", va="center", color=cor)
        caminho = os.path.join(PASTA_SAIDA, f"{nome}.png")
        plt.savefig(caminho, bbox_inches="tight", pad_inches=0.06, dpi=300, facecolor="white")
        plt.close(fig)
        print(f"[OK] Fórmula individual gerada: {caminho}")

def renderizar_quadro_completo(tema_escuro=False):
    """
    Renderiza o quadro consolidado com as 12 fórmulas exatamente como na imagem
    anexada pelo usuário, com títulos, equações e citações.
    """
    nome_arquivo = "quadro_completo_formulas_dark.png" if tema_escuro else "quadro_completo_formulas.png"
    caminho = os.path.join(PASTA_SAIDA, nome_arquivo)

    cor_bg = "#0B0F19" if tema_escuro else "#FFFFFF"
    cor_texto = "#E2E8F0" if tema_escuro else "#0F172A"
    cor_citacao = "#94A3B8" if tema_escuro else "#475569"
    cor_num = "#10B981" if tema_escuro else "#065F46"

    # 12 itens com título, expressão e citação
    itens = [
        ("1. NDVI:", r"$\mathrm{NDVI} = \frac{B8 - B4}{B8 + B4}$", "(Rouse et al., 1974)."),
        ("2. BSI:", r"$\mathrm{BSI} = \frac{(B11 + B4) - (B8 + B2)}{(B11 + B4) + (B8 + B2)}$", "(Rikimaru et al., 2002)."),
        ("3. Decomposição Harmônica OLS:", r"$\hat{y}(t) = c_0 + c_1 t + \sum_{k=1}^m \left[ a_k \cos\left(\frac{2\pi k t}{T}\right) + b_k \sin\left(\frac{2\pi k t}{T}\right) \right]$", "(Zhu & Woodcock, 2014)."),
        ("4. Frequência de Solo Nu $(\hat{E})$:", r"$\hat{E} = \frac{1}{N} \sum_{i=1}^N \mathbb{I}(\mathrm{NDVI}_i \leq 0{,}25)$", "(GEOS3 / Demattê et al., 2018; Safanelli et al., 2021 — Decisão D10)."),
        ("5. Fator C da RUSLE:", r"$C = \left[ \frac{1 - \mathrm{NDVI}}{2} \right]^{(1 + \mathrm{NDVI})}$", "(Durigon et al., 2014 — Decisão D01)."),
        ("6. Fator K Numérico:", r"$\mathrm{Tabela\ 5\ da\ Embrapa\ Solos\ (Coelho\ et\ al.,\ 2024\ /\ Mannigel\ et\ al.,\ 2002\ —\ Decisões\ D09\ e\ D14):}$", ""),
        ("   • Muito baixa (0,0052), Baixa (0,0117), Média (0,0218), Alta (0,0360) e Muito alta (0,0518)", r"$\mathrm{t} \cdot \mathrm{h} \cdot \mathrm{MJ}^{-1} \cdot \mathrm{mm}^{-1}$", "."),
        ("7. RUSLE Consolidada:", r"$A = R \times K \times LS \times C \times P$", "(Renard et al., 1997 / Invariante 1)."),
        ("8. Índice de Mecanismo Dinâmico:", r"$I_{\mathrm{mecanismo}} = \sum_{t=1}^T \left( R_t \times \mathbb{I}(\mathrm{NDVI}_t \leq 0{,}25) \right)$", "(Modelo G2 / Karydas & Panagos, 2018)."),
        ("9. Função Objetivo do XGBoost:", r"$\mathcal{L}^{(t)} \approx \sum_{i=1}^n \left[ g_i f_t(x_i) + \frac{1}{2} h_i f_t^2(x_i) \right] + \gamma T + \frac{1}{2} \lambda \sum_{j=1}^T w_j^2$", "(Chen & Guestrin, 2016)."),
        ("10. Ganho de Divisão em Árvore:", r"$\mathcal{L}_{\mathrm{split}} = \frac{1}{2} \left[ \frac{G_L^2}{H_L + \lambda} + \frac{G_R^2}{H_R + \lambda} - \frac{(G_L + G_R)^2}{H_L + H_R + \lambda} \right] - \gamma$", "."),
        ("11. Kappa de Cohen:", r"$\kappa = \frac{P_o - P_e}{1 - P_e}$", "(Landis & Koch, 1977)."),
        ("12. Valores SHAP:", r"$\phi_i(f, x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|! (|F| - |S| - 1)!}{|F|!} \left[ f_x(S \cup \{i\}) - f_x(S) \right]$", "(Lundberg & Lee, 2017).")
    ]

    fig = plt.figure(figsize=(13.5, 7.6), dpi=300)
    fig.patch.set_facecolor(cor_bg)
    ax = plt.subplot(111)
    ax.axis("off")

    n_itens = len(itens)
    y_step = 1.0 / (n_itens + 0.5)
    y_start = 0.96

    for i, (titulo, formula, citacao) in enumerate(itens):
        y_pos = y_start - i * y_step

        # Determina o recuo e estilo se for o subitem de K
        if titulo.startswith("   •"):
            x_tit = 0.05
            fs_tit = 10
            fs_form = 10
        else:
            x_tit = 0.02
            fs_tit = 10.5
            fs_form = 11.5

        # 1. Título em negrito
        t_obj = ax.text(x_tit, y_pos, titulo, fontsize=fs_tit, fontweight="bold",
                        color=cor_num if x_tit == 0.02 else cor_texto, va="center")

        # Pega a largura aproximada para posicionar a fórmula
        fig.canvas.draw()
        renderer = fig.canvas.get_renderer()
        bbox = t_obj.get_window_extent(renderer=renderer)
        bbox_data = ax.transData.inverted().transform(bbox)
        x_form = bbox_data[1][0] + 0.015

        # 2. Fórmula matemática
        f_obj = ax.text(x_form, y_pos, formula, fontsize=fs_form, color=cor_texto, va="center")

        # 3. Citação bibliográfica
        if citacao:
            fig.canvas.draw()
            bbox_f = f_obj.get_window_extent(renderer=renderer)
            bbox_f_data = ax.transData.inverted().transform(bbox_f)
            x_cit = bbox_f_data[1][0] + 0.015
            ax.text(x_cit, y_pos, citacao, fontsize=fs_tit - 0.5, color=cor_citacao, va="center")

    plt.savefig(caminho, bbox_inches="tight", pad_inches=0.15, dpi=300, facecolor=cor_bg)
    plt.close(fig)
    print(f"[OK] Quadro consolidado gerado: {caminho}")

if __name__ == "__main__":
    print("Iniciando renderização gráfica das fórmulas do SAREL...")
    renderizar_formulas_individuais()
    renderizar_quadro_completo(tema_escuro=False)
    renderizar_quadro_completo(tema_escuro=True)
    print("Processo de renderização concluído com êxito!")
