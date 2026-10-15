#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
===============================================================================
Bateria de Testes de Carga de Dados no Treinador XGBoost — SAREL v2.0
Verificação do bloco C04 (A28): leitura de CSV com metadados, linha em branco e BOM.
Os dados utilizados são 100% sintéticos (SINTETICO_TESTE_ENCANAMENTO);
nenhum número produzido constitui evidência científica.
===============================================================================
"""

import os
import sys
import tempfile
import unittest
import pandas as pd

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

caminho_scripts = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if caminho_scripts not in sys.path:
    sys.path.insert(0, caminho_scripts)

from treinar_xgboost_loco import carregar_dados_reais

COLUNAS_MATRIZ_TREINO = [
    "Ponto_ID", "Bloco_Espacial", "Elevacao_m", "Declividade_pct", "Declividade_graus",
    "Curvatura_Perfil", "Curvatura_Plana", "Acumulo_Fluxo", "TWI", "Ordem_Solo",
    "Subordem_Solo", "Grande_Grupo_Solo", "Erodibilidade_Classe", "Frequencia_Solo_Nu",
    "Banda_B2", "Banda_B4", "Banda_B8", "Banda_B12", "NDVI", "BSI",
    "RUSLE_Fator_K", "RUSLE_Fator_R", "Precip_Acum_30d_mm", "Precip_Acum_90d_mm",
    "I30_Max_mm_h", "N_Eventos_Erosivos", "Indice_Mecanismo", "Classe_Alvo_Binaria",
    "Rotulo_Classe", "Rotulo_Modalidade"
]


def _gerar_linhas_artificiais(n=4):
    linhas = []
    for i in range(1, n + 1):
        bloco = chr(ord('A') + (i - 1) % 4)
        linhas.append({
            "Ponto_ID": f"SINTETICO_TESTE_ENCANAMENTO_ID_{i}",
            "Bloco_Espacial": bloco,
            "Elevacao_m": 500.0 + i,
            "Declividade_pct": 5.0 + i,
            "Declividade_graus": 3.0 + i,
            "Curvatura_Perfil": 0.01 * i,
            "Curvatura_Plana": 0.02 * i,
            "Acumulo_Fluxo": 100.0 * i,
            "TWI": 8.0 + i,
            "Ordem_Solo": "Latossolo",
            "Subordem_Solo": "Vermelho",
            "Grande_Grupo_Solo": "Distrofico",
            "Erodibilidade_Classe": "Media",
            "Frequencia_Solo_Nu": 0.1 * i,
            "Banda_B2": 0.05 * i,
            "Banda_B4": 0.08 * i,
            "Banda_B8": 0.35 * i,
            "Banda_B12": 0.15 * i,
            "NDVI": 0.60 + 0.05 * i,
            "BSI": -0.20 + 0.05 * i,
            "RUSLE_Fator_K": 0.025,
            "RUSLE_Fator_R": 10000.0,
            "Precip_Acum_30d_mm": 120.0,
            "Precip_Acum_90d_mm": 350.0,
            "I30_Max_mm_h": 45.0,
            "N_Eventos_Erosivos": 3,
            "Indice_Mecanismo": 1.2,
            "Classe_Alvo_Binaria": i % 2,
            "Rotulo_Classe": "ausente" if (i % 2 == 0) else "incipiente",
            "Rotulo_Modalidade": "campo"
        })
    return pd.DataFrame(linhas, columns=COLUNAS_MATRIZ_TREINO)


def _formatar_conteudo_csv(df: pd.DataFrame, com_bom: bool = True, incluir_alvo: bool = True) -> bytes:
    colunas = [c for c in df.columns if (incluir_alvo or c != "Classe_Alvo_Binaria")]
    df_export = df[colunas]

    linhas_meta = [
        "# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar",
        "# Emissão: 2026-10-09T00:00:00.000Z",
        f"# Total de registros recebidos: {len(df_export)} | Emitidos no perfil: matriz-treino",
        "# Perfil: matriz-treino",
        "# BASE LEGAL (LGPD, Art. 7, IV): Tratamento estritamente acadêmico",
        "",
        ",".join(colunas),
    ]

    for _, row in df_export.iterrows():
        valores = [str(row[c]) for c in colunas]
        linhas_meta.append(",".join(valores))

    texto = "\r\n".join(linhas_meta) + "\r\n"
    if com_bom:
        return ("\ufeff" + texto).encode("utf-8-sig")
    return texto.encode("utf-8")


class TestCargaCsvTrainer(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.df_base = _gerar_linhas_artificiais(4)

        # 1. Gera XLSX equivalente
        self.caminho_xlsx = os.path.join(self.tmp_dir.name, "SINTETICO_TESTE_ENCANAMENTO.xlsx")
        self.df_base.to_excel(self.caminho_xlsx, index=False)

        # 2. Gera CSV com formato exato do app (metadados #, linha em branco, BOM)
        self.caminho_csv_com_bom = os.path.join(self.tmp_dir.name, "SINTETICO_TESTE_ENCANAMENTO_bom.csv")
        with open(self.caminho_csv_com_bom, "wb") as f:
            f.write(_formatar_conteudo_csv(self.df_base, com_bom=True, incluir_alvo=True))

        # 3. Gera CSV sem BOM (metadados #, linha em branco)
        self.caminho_csv_sem_bom = os.path.join(self.tmp_dir.name, "SINTETICO_TESTE_ENCANAMENTO_nobom.csv")
        with open(self.caminho_csv_sem_bom, "wb") as f:
            f.write(_formatar_conteudo_csv(self.df_base, com_bom=False, incluir_alvo=True))

        # 4. Gera CSV sem a coluna do alvo
        self.caminho_csv_sem_alvo = os.path.join(self.tmp_dir.name, "SINTETICO_TESTE_ENCANAMENTO_sem_alvo.csv")
        with open(self.caminho_csv_sem_alvo, "wb") as f:
            f.write(_formatar_conteudo_csv(self.df_base, com_bom=True, incluir_alvo=False))

    def tearDown(self):
        self.tmp_dir.cleanup()

    def test_carga_csv_com_bom_igual_xlsx(self):
        """CSV do app com BOM e metadados # deve carregar (4, 30) idêntico ao XLSX."""
        df_csv = carregar_dados_reais(self.caminho_csv_com_bom)
        df_xlsx = carregar_dados_reais(self.caminho_xlsx)

        self.assertEqual(df_csv.shape, (4, 30))
        self.assertEqual(df_xlsx.shape, (4, 30))
        self.assertEqual(list(df_csv.columns), list(df_xlsx.columns))

    def test_carga_csv_sem_bom(self):
        """CSV sem BOM com metadados # deve carregar (4, 30) com colunas idênticas."""
        df_csv = carregar_dados_reais(self.caminho_csv_sem_bom)
        self.assertEqual(df_csv.shape, (4, 30))
        self.assertEqual(list(df_csv.columns), COLUNAS_MATRIZ_TREINO)

    def test_falha_explicita_se_faltar_alvo(self):
        """Se faltar a coluna do alvo Classe_Alvo_Binaria, deve falhar com mensagem explícita."""
        with self.assertRaises(ValueError) as ctx:
            carregar_dados_reais(self.caminho_csv_sem_alvo)
        self.assertIn("Classe_Alvo_Binaria", str(ctx.exception))
        self.assertIn("ausente", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
