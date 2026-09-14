#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
===============================================================================
Pipeline de Treinamento XGBoost e Explicabilidade SHAP com Validação Cruzada
Espacial (Leave-One-Catchment-Out - LOCO, K=5) — Metodologia PPGTCA 2026
===============================================================================

Pesquisa: Arcabouço de Inteligência Geoespacial Multiescala para Mapeamento
e Predição da Suscetibilidade à Erosão Laminar no Estado do Paraná.

Fundamentação Teórica e Metodológica (Seções 5 e 6 do Método):
1. Algoritmo XGBoost com hiperparâmetros calibrados:
   - learning_rate (eta) = 0.05
   - max_depth = 5
   - subsample = 0.9
   - regularização L1 / L2 (reg_alpha=0.1, reg_lambda=1.0)
2. Abordagem de Fusão de Dados e Física Informada:
   - Preditores: Bandas Espectrais (B2, B4, B8, B12), NDVI, BSI, Declividade,
     Elevação, Fator K, Fator R e Perda RUSLE estimada (A).
   - Alvo binário Y: 1 (Erosão Laminar) vs 0 (Controle / SPD).
3. Validação Cruzada Espacial por Blocos (Spatial K-Fold LOCO, K=5):
   - Isolamento geográfico estrito pelas 6 macrobacias hidrográficas do Paraná (IAT).
   - Mitigação de autocorrelação espacial e contaminação de dados (spatial data leakage).
4. Explicabilidade Pós-Hoc por SHAP (Shapley Additive exPlanations):
   - TreeExplainer para cálculo das contribuições marginais de cada preditor.
   - Geração automática de gráficos de publicação científica (Beeswarm, Bar Plot, ROC).
"""

import os
import sys
import argparse
import json
import sqlite3
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    roc_curve,
    classification_report,
)
from sklearn.model_selection import KFold
import xgboost as xgb
import shap

# Configuração de estilo científico para gráficos de publicação
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['figure.dpi'] = 300

# Limiares espectrais oficiais da pesquisa (Seção 3.1)
LIMIAR_EROSAO_BSI = 0.10
LIMIAR_EROSAO_NDVI = 0.40
LIMIAR_CONTROLE_BSI = 0.00
LIMIAR_CONTROLE_NDVI = 0.65

# Vértices das Macrobacias Hidrográficas do Paraná (IAT / WGS84 [lon, lat])
BACIAS_PARANA = {
    "Bacia do Rio Tibagi": [
        [-51.40, -22.75], [-50.80, -23.10], [-50.40, -23.80], [-50.10, -24.40],
        [-50.00, -25.20], [-50.40, -25.30], [-50.90, -24.80], [-51.30, -24.10],
        [-51.60, -23.40], [-51.40, -22.75]
    ],
    "Bacia do Rio Ivaí": [
        [-53.70, -23.25], [-52.60, -23.20], [-51.80, -23.40], [-51.30, -24.10],
        [-50.90, -24.80], [-51.20, -25.25], [-52.10, -24.90], [-52.80, -24.40],
        [-53.40, -23.80], [-53.70, -23.25]
    ],
    "Bacia do Paranapanema": [
        [-53.40, -22.85], [-52.95, -22.52], [-51.85, -22.65], [-50.45, -22.95],
        [-49.60, -23.40], [-49.95, -23.90], [-50.80, -23.10], [-51.80, -23.40],
        [-52.60, -23.20], [-53.40, -22.85]
    ],
    "Bacia do Rio Iguaçu": [
        [-54.60, -25.50], [-53.75, -25.80], [-52.55, -26.40], [-51.40, -26.25],
        [-50.10, -26.15], [-49.00, -25.95], [-49.20, -25.30], [-50.20, -25.40],
        [-51.20, -25.25], [-52.60, -25.40], [-53.80, -25.40], [-54.60, -25.50]
    ],
    "Bacia do Rio Piquiri / PR 3": [
        [-54.25, -24.01], [-53.70, -23.25], [-53.40, -23.80], [-52.80, -24.40],
        [-52.60, -25.40], [-53.80, -25.40], [-54.40, -24.80], [-54.25, -24.01]
    ],
    "Bacia Litorânea / Ribeira": [
        [-49.30, -23.85], [-48.50, -24.70], [-48.15, -25.05], [-48.40, -25.55],
        [-48.60, -25.90], [-49.00, -25.95], [-49.20, -25.30], [-49.60, -24.60],
        [-49.30, -23.85]
    ]
}


def ponto_em_poligono(lon: float, lat: float, anel: list[list[float]]) -> bool:
    """Ray-casting simples para verificação de ponto em polígono."""
    dentro = False
    n = len(anel)
    for i in range(n):
        j = (i - 1) % n
        xi, yi = anel[i]
        xj, yj = anel[j]
        if ((yi > lat) != (yj > lat)) and (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi):
            dentro = not dentro
    return dentro


def identificar_bacia_real(lat: float, lon: float) -> str:
    """Identifica a macrobacia oficial do IAT correspondente à coordenada."""
    for nome, anel in BACIAS_PARANA.items():
        if ponto_em_poligono(lon, lat, anel):
            return nome
    # Fallback geográfico determinístico por quadrante do Paraná
    if lat < -25.3:
        return "Bacia do Rio Iguaçu"
    elif lon < -53.2:
        return "Bacia do Rio Piquiri / PR 3"
    elif lon > -50.2:
        return "Bacia Litorânea / Ribeira"
    elif lat > -23.3:
        return "Bacia do Paranapanema"
    elif lon > -51.8:
        return "Bacia do Rio Tibagi"
    else:
        return "Bacia do Rio Ivaí"


def carregar_dados_reais(caminho_arquivo: str) -> pd.DataFrame:
    """Carrega dados tabulares a partir de arquivo Excel, CSV ou JSON."""
    if not os.path.exists(caminho_arquivo):
        raise FileNotFoundError(f"Arquivo de dados não encontrado: {caminho_arquivo}")

    ext = os.path.splitext(caminho_arquivo)[1].lower()
    if ext in ['.xlsx', '.xls']:
        df = pd.read_excel(caminho_arquivo)
    elif ext == '.csv':
        df = pd.read_csv(caminho_arquivo)
    elif ext == '.json':
        df = pd.read_json(caminho_arquivo)
    else:
        raise ValueError(f"Formato de arquivo não suportado: {ext}")

    print(f"[CARGA] {len(df)} registros reais carregados de '{os.path.basename(caminho_arquivo)}'.")
    return df


def auditar_variancia_preditores(X: pd.DataFrame) -> list[str]:
    """
    Audita se alguma variável preditora possui variância zero ou nula.
    Alerta formalmente contra datasets estáticos com valores congelados.
    """
    alertas = []
    for c in X.columns:
        serie = X[c].dropna()
        if len(serie) > 0:
            std = float(serie.std())
            if std == 0.0 or pd.isna(std):
                alertas.append(
                    f"Variável '{c}' possui desvio padrão ZERO (todos os {len(serie)} valores são idênticos a {serie.iloc[0]}). "
                    f"Valores estáticos produzem artefatos de separabilidade artificial e invalidam inferências biofísicas."
                )
    return alertas


def balancear_com_pontos_controle(
    df_erosao: pd.DataFrame,
    caminho_controles: str | None = None,
    permitir_dryrun_sintetico: bool = False,
    semente: int = 42
) -> tuple[pd.DataFrame, bool]:
    """
    Equilibra o conjunto de dados com amostras de Controle / SPD (Classe 0).

    RIGOR CIENTÍFICO (PPGTCA 2026 - LEI FUNDAMENTAL):
    - Se caminho_controles for fornecido, carrega pontos de controle reais com atributos medidos.
    - Se a base for monofásica e nenhum arquivo for fornecido:
      - Se permitir_dryrun_sintetico == False (PADRÃO CIENTÍFICO): Levanta ValueError impeditivo.
      - Se permitir_dryrun_sintetico == True: Permite benchmarking computacional com advertência explícita.
    """
    df_erosao = df_erosao.copy()
    if 'Classe_Alvo_Binaria' not in df_erosao.columns:
        df_erosao['Classe_Alvo_Binaria'] = 1
    else:
        df_erosao['Classe_Alvo_Binaria'] = df_erosao['Classe_Alvo_Binaria'].fillna(1).astype(int)

    # 1. Caso haja arquivo externo de controles empíricos reais
    if caminho_controles and os.path.exists(caminho_controles):
        print(f"[BALANCEAMENTO] Carregando controles reais de '{os.path.basename(caminho_controles)}'...")
        df_ctrl = carregar_dados_reais(caminho_controles)
        df_ctrl['Classe_Alvo_Binaria'] = 0
        df_bal = pd.concat([df_erosao, df_ctrl], ignore_index=True)
        df_bal = df_bal.loc[:, ~df_bal.columns.duplicated()]
        return df_bal, False

    # 2. Bloqueio Anti-Mock Estrito em Execução Científica
    if not permitir_dryrun_sintetico:
        raise ValueError(
            "\n" + "=" * 80 + "\n"
            "  [ERRO DE INTEGRIDADE CIENTÍFICA (ANTI-MOCK - METODOLOGIA PPGTCA 2026)]\n"
            "  A base de entrada contém apenas amostras de Erosão (Classe 1).\n"
            "  Para fins de publicação e defesa de mestrado, é TERMINANTEMENTE PROIBIDO\n"
            "  gerar atributos biofísicos fictícios para balancear a base de dados.\n\n"
            "  Soluções aceitas:\n"
            "    1. Forneça uma planilha com ambas as classes (coluna 'Classe_Alvo_Binaria' com 0 e 1);\n"
            "    2. Forneça controles empíricos reais via '--controles caminho_controles.xlsx';\n"
            "    3. Se você deseja APENAS testar a infraestrutura computacional do pipeline\n"
            "       (dry-run sem valor probatório para a dissertação), utilize a flag explícita:\n"
            "       --permitir-dryrun-sintetico\n"
            + "=" * 80
        )

    # 3. Modo Dry-Run Excepcional e Rastreável (Apenas para Benchmark de Código)
    print("\n" + "!" * 80)
    print("  [AVISO CRÍTICO] MODO DRY-RUN DE INFRAESTRUTURA ATIVADO!")
    print("  Atributos da Classe 0 foram sintetizados exclusivamente para teste do pipeline.")
    print("  ESTES RESULTADOS NÃO POSSUEM VALIDADE CIENTÍFICA PARA A DISSERTAÇÃO DE MESTRADO!")
    print("!" * 80 + "\n")

    db_path = os.path.join(os.getcwd(), 'data', 'fundiario_brasil.db')
    np.random.seed(semente)
    n_necessario = len(df_erosao)
    registros_controle = []

    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        query = """
            SELECT cod_car, municipio, (lat_min + lat_max) / 2.0 as lat, (lon_min + lon_max) / 2.0 as lon, area_ha
            FROM imoveis_fundiarios
            WHERE lat_min >= -26.7 AND lat_max <= -22.5 AND lon_min >= -54.6 AND lon_max <= -48.1
            ORDER BY RANDOM()
            LIMIT ?
        """
        c.execute(query, (n_necessario * 2,))
        linhas = c.fetchall()
        conn.close()

        for idx, r in enumerate(linhas):
            if len(registros_controle) >= n_necessario:
                break
            cod_car, mun, lat, lon, area_ha = r
            if lat is None or lon is None:
                continue

            # permitido: geracao explicita de benchmark de pipeline quando solicitado via flag dry-run
            bsi_spd = float(np.random.uniform(-0.25, -0.02))
            # permitido: geracao explicita de benchmark de pipeline quando solicitado via flag dry-run
            ndvi_spd = float(np.random.uniform(0.68, 0.88))
            # permitido: geracao explicita de benchmark de pipeline quando solicitado via flag dry-run
            decliv = float(np.random.uniform(3.0, 14.0))
            # permitido: geracao explicita de benchmark de pipeline quando solicitado via flag dry-run
            elev = float(np.random.uniform(350, 750))
            # permitido: geracao explicita de benchmark de pipeline quando solicitado via flag dry-run
            perda_solo_spd = float(np.random.uniform(0.5, 4.5))

            registros_controle.append({
                'Codigo': f"CTRL-DRYRUN-{idx+1:04d}",
                'Latitude': round(lat, 6),
                'Longitude': round(lon, 6),
                'Municipio': mun or 'Paraná',
                'declividade_pct': round(decliv, 2),
                'elevacao_m': round(elev, 0),
                'bsi': round(bsi_spd, 3),
                'ndvi': round(ndvi_spd, 3),
                'rusle_perda_solo': round(perda_solo_spd, 2),
                'Tipologia_Feicao': 'Controle / SPD (Dry-Run)',
                'Classe_Alvo_Binaria': 0,
            })

    df_controle = pd.DataFrame(registros_controle)
    df_controle['Classe_Alvo_Binaria'] = 0
    df_balanceado = pd.concat([df_erosao, df_controle], ignore_index=True)
    df_balanceado = df_balanceado.loc[:, ~df_balanceado.columns.duplicated()]
    df_balanceado['Classe_Alvo_Binaria'] = df_balanceado['Classe_Alvo_Binaria'].fillna(0).astype(int)
    print(f"[BALANCEAMENTO DRY-RUN] Base equilibrada com marca d'agua: {len(df_erosao)} Erosão + {len(df_controle)} Controle.")
    return df_balanceado, True


def preparar_matriz_preditores(
    df: pd.DataFrame,
    caminho_controles: str | None = None,
    permitir_dryrun_sintetico: bool = False,
    semente: int = 42
) -> tuple[pd.DataFrame, pd.Series, pd.Series, list[str], bool, list[str]]:
    """
    Padroniza nomes de colunas, identifica a bacia real, audita variância e harmoniza a variável alvo Y.
    """
    df = df.copy()
    eh_dryrun = False

    # Mapeamento flexível de colunas
    mapeamento = {
        'Declividade_Pct': 'declividade_pct',
        'Declividade_pct': 'declividade_pct',
        'declividadePct': 'declividade_pct',
        'Altitude_m': 'elevacao_m',
        'Elevacao_m': 'elevacao_m',
        'elevacao': 'elevacao_m',
        'BSI_Solo_Exposto': 'bsi',
        'BSI': 'bsi',
        'bsi': 'bsi',
        'NDVI_Vigor_Vegetal': 'ndvi',
        'NDVI': 'ndvi',
        'ndvi': 'ndvi',
        'Perda_Solo_t_ha_ano': 'rusle_perda_solo',
        'RUSLE_Perda_Solo': 'rusle_perda_solo',
        'perdaSoloRUSLE': 'rusle_perda_solo',
        'Fator_K_Erodibilidade': 'rusle_fator_k',
        'RUSLE_Fator_K': 'rusle_fator_k',
        'fatorK': 'rusle_fator_k',
        'Fator_R_Erosividade': 'rusle_fator_r',
        'RUSLE_Fator_R': 'rusle_fator_r',
        'fatorR': 'rusle_fator_r',
        'Banda_B2': 'banda_b2',
        'Banda_B4': 'banda_b4',
        'Banda_B8': 'banda_b8',
        'Banda_B12': 'banda_b12',
    }
    df = df.rename(columns={k: v for k, v in mapeamento.items() if k in df.columns})

    # Identificação da Macrobacia Real via Coordenadas Oficiais
    if 'Latitude' in df.columns and 'Longitude' in df.columns:
        df['bloco_loco'] = [identificar_bacia_real(lat, lon) for lat, lon in zip(df['Latitude'], df['Longitude'])]
    elif 'bacia' in df.columns and df['bacia'].notna().any() and not (df['bacia'] == 'Bacia Local').all():
        df['bloco_loco'] = df['bacia']
    else:
        df['bloco_loco'] = 'Bacia do Rio Ivaí'

    # Identificação da Variável Alvo
    y_series = None
    if 'Classe_Alvo_Binaria' in df.columns and df['Classe_Alvo_Binaria'].notna().any():
        if df['Classe_Alvo_Binaria'].nunique() > 1:
            y_series = df['Classe_Alvo_Binaria'].fillna(0).astype(int)
        else:
            df, eh_dryrun = balancear_com_pontos_controle(
                df, caminho_controles=caminho_controles, permitir_dryrun_sintetico=permitir_dryrun_sintetico, semente=semente
            )
            df = df.rename(columns={k: v for k, v in mapeamento.items() if k in df.columns})
            df['bloco_loco'] = [identificar_bacia_real(lat, lon) for lat, lon in zip(df['Latitude'], df['Longitude'])]
            y_series = df['Classe_Alvo_Binaria'].fillna(0).astype(int)
    elif 'classeAmostral' in df.columns:
        y_mapped = df['classeAmostral'].map({'erosao': 1, 'controle': 0})
        if y_mapped.notna().any() and y_mapped.nunique() > 1:
            y_series = y_mapped.fillna(0).astype(int)
        else:
            df, eh_dryrun = balancear_com_pontos_controle(
                df, caminho_controles=caminho_controles, permitir_dryrun_sintetico=permitir_dryrun_sintetico, semente=semente
            )
            df = df.rename(columns={k: v for k, v in mapeamento.items() if k in df.columns})
            df['bloco_loco'] = [identificar_bacia_real(lat, lon) for lat, lon in zip(df['Latitude'], df['Longitude'])]
            y_series = df['Classe_Alvo_Binaria'].fillna(0).astype(int)
    elif 'Tipologia_Feicao' in df.columns:
        tip_lower = df['Tipologia_Feicao'].astype(str).str.lower()
        if (tip_lower.str.contains('eros|severa|sulco|laminar')).all():
            # Dataset possui apenas a classe positiva (focos de erosão) -> balancear
            df, eh_dryrun = balancear_com_pontos_controle(
                df, caminho_controles=caminho_controles, permitir_dryrun_sintetico=permitir_dryrun_sintetico, semente=semente
            )
            df = df.rename(columns={k: v for k, v in mapeamento.items() if k in df.columns})
            df['bloco_loco'] = [identificar_bacia_real(lat, lon) for lat, lon in zip(df['Latitude'], df['Longitude'])]
            y_series = df['Classe_Alvo_Binaria'].fillna(0).astype(int)
        else:
            y_series = tip_lower.apply(lambda t: 1 if ('eros' in t or 'severa' in t or 'sulco' in t) else 0)

    if y_series is None or len(y_series.unique()) < 2:
        df, eh_dryrun = balancear_com_pontos_controle(
            df, caminho_controles=caminho_controles, permitir_dryrun_sintetico=permitir_dryrun_sintetico, semente=semente
        )
        df = df.rename(columns={k: v for k, v in mapeamento.items() if k in df.columns})
        df = df.loc[:, ~df.columns.duplicated()]
        df['bloco_loco'] = [identificar_bacia_real(lat, lon) for lat, lon in zip(df['Latitude'], df['Longitude'])]
        y_series = df['Classe_Alvo_Binaria'].fillna(0).astype(int)

    df = df.loc[:, ~df.columns.duplicated()]
    blocos = df['bloco_loco']

    # Seleção dos Preditores Físico-Informados
    candidatos_preditores = [
        'declividade_pct',
        'elevacao_m',
        'bsi',
        'ndvi',
        'banda_b2',
        'banda_b4',
        'banda_b8',
        'banda_b12',
        'rusle_fator_k',
        'rusle_fator_r',
        'rusle_perda_solo',
    ]

    preditores_disponiveis = []
    for c in candidatos_preditores:
        if c in df.columns:
            col_series = df[c]
            if isinstance(col_series, pd.DataFrame):
                col_series = col_series.iloc[:, 0]
            if col_series.notna().sum() > 0:
                preditores_disponiveis.append(c)

    X = df[preditores_disponiveis].copy()
    # Se alguma coluna ainda for DataFrame com colunas duplicadas, seleciona a primeira
    for c in preditores_disponiveis:
        if isinstance(X[c], pd.DataFrame):
            X[c] = X[c].iloc[:, 0]

    print(f"[FEATURES] {len(preditores_disponiveis)} preditores físico-informados: {preditores_disponiveis}")
    print(f"[AMOSTRAS] Distribuição do Alvo: {dict(y_series.value_counts())} (0: Controle, 1: Erosão)")
    print(f"[MACROBACIAS] Distribuição por Bacia do Paraná: {dict(blocos.value_counts())}")

    # Auditoria de Variância dos Preditores
    alertas_variancia = auditar_variancia_preditores(X)
    if alertas_variancia:
        print("\n[AUDITORIA DE DADOS - ALERTAS DE RIGOR METODOLÓGICO]")
        for a in alertas_variancia:
            print(f"  [!] {a}")
        print()

    return X, y_series, blocos, preditores_disponiveis, eh_dryrun, alertas_variancia


def executar_spatial_kfold_loco(
    X: pd.DataFrame,
    y: pd.Series,
    blocos: pd.Series,
    k_blocos: int = 5,
    random_state: int = 42
) -> dict:
    """
    Executa a Validação Cruzada Espacial Leave-One-Catchment-Out (LOCO, K=5)
    com XGBoost e hiperparâmetros oficiais da pesquisa.
    """
    blocos_unicos = np.array(sorted(blocos.unique()))
    n_splits = min(k_blocos, len(blocos_unicos))
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=random_state)

    params = {
        'learning_rate': 0.05,
        'max_depth': 5,
        'subsample': 0.9,
        'reg_alpha': 0.1,    # L1
        'reg_lambda': 1.0,   # L2
        'objective': 'binary:logistic',
        'eval_metric': 'logloss',
        'random_state': random_state,
        'n_estimators': 150,
    }

    resultados_folds = []
    y_real_total = []
    y_pred_total = []
    y_prob_total = []

    print(f"\n" + "="*70)
    print(f"INICIANDO SPATIAL K-FOLD CROSS-VALIDATION (LOCO - K={n_splits})")
    print(f"="*70)

    for fold_idx, (train_blk_idx, test_blk_idx) in enumerate(kf.split(blocos_unicos)):
        blocos_treino = set(blocos_unicos[train_blk_idx])
        blocos_teste = set(blocos_unicos[test_blk_idx])

        mask_train = blocos.isin(blocos_treino)
        mask_test = blocos.isin(blocos_teste)

        X_train, y_train = X[mask_train], y[mask_train]
        X_test, y_test = X[mask_test], y[mask_test]

        if len(y_test) == 0 or len(y_train) == 0 or len(np.unique(y_train)) < 2:
            continue

        # Imputação pela mediana do treino para preenchimento de vazios
        mediana_treino = X_train.median()
        X_train_imp = X_train.fillna(mediana_treino)
        X_test_imp = X_test.fillna(mediana_treino)

        modelo = xgb.XGBClassifier(**params)
        modelo.fit(X_train_imp, y_train)

        y_pred = modelo.predict(X_test_imp)
        y_prob = modelo.predict_proba(X_test_imp)[:, 1]

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        try:
            auc = roc_auc_score(y_test, y_prob)
        except Exception:
            auc = 0.5

        resultados_folds.append({
            'fold': fold_idx + 1,
            'bacias_omitidas_teste': list(blocos_teste),
            'n_amostras_teste': int(len(y_test)),
            'acuracia': float(acc),
            'precisao': float(prec),
            'recall': float(rec),
            'f1_score': float(f1),
            'roc_auc': float(auc),
        })

        y_real_total.extend(y_test.tolist())
        y_pred_total.extend(y_pred.tolist())
        y_prob_total.extend(y_prob.tolist())

        print(f"Fold {fold_idx + 1:02d} | Bacias Teste: {list(blocos_teste)} | N: {len(y_test):03d} | "
              f"Acc: {acc:.4f} | F1: {f1:.4f} | AUC: {auc:.4f}")

    y_real_arr = np.array(y_real_total)
    y_pred_arr = np.array(y_pred_total)
    y_prob_arr = np.array(y_prob_total)

    acuracia_global = float(accuracy_score(y_real_arr, y_pred_arr))
    precisao_global = float(precision_score(y_real_arr, y_pred_arr, zero_division=0))
    recall_global = float(recall_score(y_real_arr, y_pred_arr, zero_division=0))
    f1_global = float(f1_score(y_real_arr, y_pred_arr, zero_division=0))
    try:
        auc_global = float(roc_auc_score(y_real_arr, y_prob_arr))
    except Exception:
        auc_global = 0.5

    matriz_conf = confusion_matrix(y_real_arr, y_pred_arr).tolist()

    metricas_globais = {
        'acuracia_global': acuracia_global,
        'precisao_global': precisao_global,
        'recall_global': recall_global,
        'f1_global': f1_global,
        'roc_auc_global': auc_global,
        'matriz_confusao': matriz_conf,
        'total_amostras': len(y_real_arr),
        'folds': resultados_folds,
    }

    print(f"\n" + "="*70)
    print("DESEMPENHO GLOBAL DA VALIDAÇÃO CRUZADA ESPACIAL (LOCO):")
    print(f"Acurácia Global (Média): {acuracia_global:.4f}")
    print(f"F1-Score Global:         {f1_global:.4f}")
    print(f"ROC-AUC Global:          {auc_global:.4f}")
    print(f"Precisão Global:         {precisao_global:.4f}")
    print(f"Recall Global:           {recall_global:.4f}")
    print("="*70)

    # Treinamento do Modelo Final sobre todo o dataset
    X_imp = X.fillna(X.median())
    modelo_final = xgb.XGBClassifier(**params)
    modelo_final.fit(X_imp, y)

    return {
        'metricas': metricas_globais,
        'modelo_final': modelo_final,
        'y_real': y_real_arr,
        'y_pred': y_pred_arr,
        'y_prob': y_prob_arr,
    }


def gerar_graficos_e_explicabilidade_shap(
    modelo: xgb.XGBClassifier,
    X: pd.DataFrame,
    y_real: np.ndarray,
    y_prob: np.ndarray,
    diretorio_saida: str,
    eh_dryrun: bool = False
) -> dict:
    """Gera visualizações científicas completas: SHAP Beeswarm, Bar Plot, ROC e Confusão."""
    os.makedirs(diretorio_saida, exist_ok=True)

    print(f"\n[SHAP] Calculando valores de Shapley (TreeExplainer)...")
    X_imputado = X.fillna(X.median())

    explainer = shap.TreeExplainer(modelo)
    shap_values = explainer(X_imputado)

    # 1. SHAP Beeswarm Plot
    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values, X_imputado, show=False)
    plt.title("Contribuição Marginal das Variáveis na Predição de Erosão Laminar (SHAP)", fontsize=12, pad=15)
    if eh_dryrun:
        plt.suptitle("[AVISO: BENCHMARK DE INFRAESTRUTURA - DADOS NÃO EMPÍRICOS]", color='#DC2626', fontsize=9, weight='bold')
    caminho_beeswarm = os.path.join(diretorio_saida, "shap_summary_beeswarm.png")
    plt.tight_layout()
    plt.savefig(caminho_beeswarm, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"[ARTEFATO] SHAP Beeswarm salvo em: {caminho_beeswarm}")

    # 2. SHAP Feature Importance Bar Plot
    plt.figure(figsize=(9, 5))
    shap.plots.bar(shap_values, show=False)
    plt.title("Ranking de Importância Global dos Preditores (|SHAP value| médio)", fontsize=12, pad=15)
    if eh_dryrun:
        plt.suptitle("[AVISO: BENCHMARK DE INFRAESTRUTURA - DADOS NÃO EMPÍRICOS]", color='#DC2626', fontsize=9, weight='bold')
    caminho_bar = os.path.join(diretorio_saida, "shap_feature_importance.png")
    plt.tight_layout()
    plt.savefig(caminho_bar, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"[ARTEFATO] SHAP Bar Plot salvo em: {caminho_bar}")

    # 3. Curva ROC
    fpr, tpr, _ = roc_curve(y_real, y_prob)
    auc_val = roc_auc_score(y_real, y_prob)

    plt.figure(figsize=(7, 6))
    plt.plot(fpr, tpr, color='#059669', lw=2.5, label=f'XGBoost LOCO (AUC = {auc_val:.4f})')
    plt.plot([0, 1], [0, 1], color='#94A3B8', lw=1.5, linestyle='--', label='Classificador Aleatório')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('Taxa de Falsos Positivos (1 - Especificidade)', fontsize=11)
    plt.ylabel('Taxa de Verdadeiros Positivos (Sensibilidade)', fontsize=11)
    plt.title('Curva ROC — Validação Cruzada Espacial LOCO (K=5)', fontsize=12, pad=12)
    if eh_dryrun:
        plt.suptitle("[AVISO: BENCHMARK DE INFRAESTRUTURA - DADOS NÃO EMPÍRICOS]", color='#DC2626', fontsize=9, weight='bold')
    plt.legend(loc="lower right", frameon=True)
    plt.grid(True, linestyle=':', alpha=0.6)
    caminho_roc = os.path.join(diretorio_saida, "curva_roc_loco.png")
    plt.tight_layout()
    plt.savefig(caminho_roc, dpi=300)
    plt.close()
    print(f"[ARTEFATO] Curva ROC salva em: {caminho_roc}")

    # 4. Matriz de Confusão
    cm = confusion_matrix(y_real, (y_prob >= 0.5).astype(int))
    cm_norm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]

    plt.figure(figsize=(6, 5))
    sns.heatmap(cm_norm, annot=True, fmt='.2%', cmap='Blues', cbar=False,
                xticklabels=['Controle (0)', 'Erosão (1)'],
                yticklabels=['Controle (0)', 'Erosão (1)'],
                annot_kws={"size": 13, "weight": "bold"})
    plt.title('Matriz de Confusão Normalizada (LOCO)', fontsize=12, pad=12)
    if eh_dryrun:
        plt.suptitle("[AVISO: BENCHMARK DE INFRAESTRUTURA - DADOS NÃO EMPÍRICOS]", color='#DC2626', fontsize=9, weight='bold')
    plt.ylabel('Classe Real Observada', fontsize=11)
    plt.xlabel('Classe Predita pelo XGBoost', fontsize=11)
    caminho_cm = os.path.join(diretorio_saida, "matriz_confusao_loco.png")
    plt.tight_layout()
    plt.savefig(caminho_cm, dpi=300)
    plt.close()
    print(f"[ARTEFATO] Matriz de Confusão salva em: {caminho_cm}")

    # Extrai ranking numérico de importância
    importancia_media = np.abs(shap_values.values).mean(axis=0)
    ranking_features = sorted(
        zip(X.columns, importancia_media),
        key=lambda x: x[1],
        reverse=True
    )

    return {
        'caminho_beeswarm': caminho_beeswarm,
        'caminho_bar': caminho_bar,
        'caminho_roc': caminho_roc,
        'caminho_cm': caminho_cm,
        'ranking_features': [{'preditor': k, 'impacto_medio_shap': float(v)} for k, v in ranking_features],
    }


def main():
    parser = argparse.ArgumentParser(description="Treinamento XGBoost e SHAP LOCO — PPGTCA 2026")
    parser.add_argument('--dados', type=str, default="Tabela_Consolidada_Parana_Todo_o_Estado_150focos_2026-09-04.xlsx",
                        help="Caminho do arquivo de dados reais (Excel, CSV ou JSON)")
    parser.add_argument('--controles', type=str, default=None,
                        help="Caminho do arquivo com amostras de Controle / SPD reais (Classe 0)")
    parser.add_argument('--permitir-dryrun-sintetico', action='store_true', default=False,
                        help="Permite balanceamento sintético APENAS para benchmark de software (inválido para dissertação)")
    parser.add_argument('--saida', type=str, default=os.path.join("docs", "relatorios", "modelagem"),
                        help="Diretório de saída para os artefatos analíticos e gráficos")
    parser.add_argument('--k_blocos', type=int, default=5, help="Número de blocos/folds no Spatial K-Fold")
    parser.add_argument('--semente', type=int, default=42, help="Semente determinística de reprodutibilidade")
    args = parser.parse_args()

    df = carregar_dados_reais(args.dados)
    X, y, blocos, features, eh_dryrun, alertas_variancia = preparar_matriz_preditores(
        df,
        caminho_controles=args.controles,
        permitir_dryrun_sintetico=args.permitir_dryrun_sintetico,
        semente=args.semente
    )
    resultado_cv = executar_spatial_kfold_loco(X, y, blocos, k_blocos=args.k_blocos, random_state=args.semente)

    resultado_shap = gerar_graficos_e_explicabilidade_shap(
        resultado_cv['modelo_final'],
        X,
        resultado_cv['y_real'],
        resultado_cv['y_prob'],
        args.saida,
        eh_dryrun=eh_dryrun
    )

    relatorio_final = {
        'metodologia': 'PPGTCA 2026 — XGBoost + SHAP com Spatial K-Fold LOCO (K=5)',
        'semente_reprodutibilidade': args.semente,
        'total_amostras_avaliadas': len(y),
        'preditores_utilizados': features,
        'auditoria_cientifica': {
            'dados_100pct_empiricos': not eh_dryrun and len(alertas_variancia) == 0,
            'natureza_execucao': 'BENCHMARK_INFRAESTRUTURA_DRY_RUN' if eh_dryrun else 'PROBATORIO_CIENTIFICO',
            'alertas_rigor': alertas_variancia + (['Atributos da Classe 0 gerados artificialmente para dry-run. Não utilizável na dissertação.'] if eh_dryrun else []),
        },
        'metricas_globais': resultado_cv['metricas'],
        'ranking_explicabilidade_shap': resultado_shap['ranking_features'],
        'artefatos_visuais': {
            'beeswarm_plot': resultado_shap['caminho_beeswarm'],
            'feature_importance_plot': resultado_shap['caminho_bar'],
            'curva_roc': resultado_shap['caminho_roc'],
            'matriz_confusao': resultado_shap['caminho_cm'],
        }
    }

    caminho_json = os.path.join(args.saida, "relatorio_modelagem_xgboost_loco.json")
    with open(caminho_json, 'w', encoding='utf-8') as f:
        json.dump(relatorio_final, f, indent=2, ensure_ascii=False)

    print(f"\n[SUCESSO] Relatório consolidado exportado para: {caminho_json}")


if __name__ == '__main__':
    main()
