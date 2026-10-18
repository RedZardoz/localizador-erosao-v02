#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Teste de Verificação C21 — Atribuição Espacial no Treinador Legado (LOCO)
Verifica que o fallback por quadrantes devolve nomes distintos de macrobacias IAT,
que a contagem de pontos em polígono vs fallback é impressa,
e que [MACROBACIAS] não afirma 'Bacia do Paraná' quando derivado de Bloco_Espacial.

Dados 100% sintéticos (SINTETICO_TESTE_ENCANAMENTO); nenhum número constitui evidência científica.
"""

import io
import os
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path
import pandas as pd

RAIZ_REPOSITORIO = Path(__file__).resolve().parents[2]
if str(RAIZ_REPOSITORIO / "scripts") not in sys.path:
    sys.path.insert(0, str(RAIZ_REPOSITORIO / "scripts"))

import treinar_xgboost_loco as t


class TestAtribuicaoMacrobaciaC21(unittest.TestCase):
    def test_nomes_distintos_poligono_vs_fallback(self):
        """Ponto dentro de polígono recebe nome oficial IAT; ponto no fallback recebe prefixo distinto."""
        # Ponto 1: dentro do polígono do Tibagi
        lat_in, lon_in = -24.0, -51.0
        bacia_in = t.identificar_bacia_real(lat_in, lon_in)
        self.assertEqual(bacia_in, "Bacia do Rio Tibagi")
        self.assertFalse(bacia_in.startswith("Bloco-quadrante (não-IAT):"))

        # Ponto 2: dentro do Paraná, mas fora de todos os polígonos simplificados
        lat_out, lon_out = -22.6, -54.5
        bacia_out = t.identificar_bacia_real(lat_out, lon_out)
        self.assertIsNotNone(bacia_out)
        self.assertTrue(
            bacia_out.startswith("Bloco-quadrante (não-IAT):"),
            f"Esperado prefixo 'Bloco-quadrante (não-IAT):', obteve: {bacia_out}"
        )
        self.assertNotEqual(bacia_in, bacia_out)

    def test_contagem_poligono_vs_fallback_impressa(self):
        """Ao atribuir blocos por coordenadas, o trainer imprime a contagem em polígonos vs fallback."""
        df_teste = pd.DataFrame([
            {
                "Ponto_ID": "SINTETICO_TESTE_ENCANAMENTO_01",
                "Latitude": -24.0,
                "Longitude": -51.0,
                "Classe_Alvo_Binaria": 1,
                "declividade_pct": 12.0,
                "elevacao_m": 500.0,
            },
            {
                "Ponto_ID": "SINTETICO_TESTE_ENCANAMENTO_02",
                "Latitude": -22.6,
                "Longitude": -54.5,
                "Classe_Alvo_Binaria": 0,
                "declividade_pct": 5.0,
                "elevacao_m": 400.0,
            },
        ])

        buffer = io.StringIO()
        with redirect_stdout(buffer):
            t.preparar_matriz_preditores(
                df_teste,
                origem_dados="SINTETICO_TESTE_ENCANAMENTO",
                permitir_dryrun_sintetico=True,
            )
        saida = buffer.getvalue()

        # Deve conter indicação de contagem de pontos em polígono e fallback
        self.assertIn("polígonos simplificados IAT", saida)
        self.assertIn("blocos-quadrantes (não-IAT)", saida)
        self.assertIn("1 pontos em polígonos simplificados IAT, 1 em blocos-quadrantes", saida)

    def test_log_macrobacias_sem_bacia_parana_para_bloco_espacial(self):
        """Quando o bloco vem de Bloco_Espacial (app), [MACROBACIAS] não afirma 'Bacia do Paraná'."""
        df_com_bloco_app = pd.DataFrame([
            {
                "Ponto_ID": "SINTETICO_TESTE_ENCANAMENTO_01",
                "Bloco_Espacial": "Cluster_App_Alpha",
                "Classe_Alvo_Binaria": 1,
                "declividade_pct": 10.0,
                "elevacao_m": 500.0,
            },
            {
                "Ponto_ID": "SINTETICO_TESTE_ENCANAMENTO_02",
                "Bloco_Espacial": "Cluster_App_Beta",
                "Classe_Alvo_Binaria": 0,
                "declividade_pct": 5.0,
                "elevacao_m": 450.0,
            },
        ])

        buffer = io.StringIO()
        with redirect_stdout(buffer):
            t.preparar_matriz_preditores(
                df_com_bloco_app,
                origem_dados="SINTETICO_TESTE_ENCANAMENTO",
                permitir_dryrun_sintetico=True,
            )
        saida = buffer.getvalue()

        # Confirma que [MACROBACIAS] está presente, mas NÃO diz 'Bacia do Paraná'
        self.assertIn("[MACROBACIAS]", saida)
        self.assertNotIn("Distribuição por Bacia do Paraná", saida)
        self.assertIn("Distribuição por Bloco Espacial", saida)


if __name__ == "__main__":
    unittest.main()
