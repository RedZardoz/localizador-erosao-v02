#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Teste de Verificação C17 — Selo Fictício nas Figuras Esquemáticas do Manual
Garante que todas as 5 figuras esquemáticas geradas em scripts/gerar_manual_pdf.py
contenham a faixa visível 'ILUSTRAÇÃO ESQUEMÁTICA — VALORES FICTÍCIOS, NÃO SÃO RESULTADO'
e que a tela5 não contenha métricas de desempenho numéricas sem rotulação fictícia.
"""

import os
import re
import unittest
from pathlib import Path

RAIZ_REPOSITORIO = Path(__file__).resolve().parents[2]
CAMINHO_GERADOR = RAIZ_REPOSITORIO / "scripts" / "gerar_manual_pdf.py"

TEXTO_SELO_ESPERADO = "ILUSTRAÇÃO ESQUEMÁTICA — VALORES FICTÍCIOS, NÃO SÃO RESULTADO"


class TestSeloFigurasManualC17(unittest.TestCase):
    def setUp(self):
        self.assertTrue(CAMINHO_GERADOR.exists(), f"Gerador não encontrado: {CAMINHO_GERADOR}")
        with open(CAMINHO_GERADOR, "r", encoding="utf-8") as f:
            self.conteudo = f.read()

    def test_todas_as_cinco_telas_desenham_selo(self):
        """Verifica que as 5 seções de telas (tela1..5) aplicam o selo esquemático."""
        # Localiza o bloco da função criar_diagramas_telas
        match_func = re.search(r"def criar_diagramas_telas\(.*?\).*?:.*?(?=\ndef [a-zA-Z0-9_]+|\nclass |\Z)", self.conteudo, re.DOTALL)
        self.assertIsNotNone(match_func, "Função criar_diagramas_telas não encontrada")
        corpo_func = match_func.group(0)

        # O texto do selo deve aparecer no gerador
        self.assertIn(TEXTO_SELO_ESPERADO, self.conteudo)

        for tela_idx in range(1, 6):
            # Procura pela geração de cada tela
            padrao_tela = rf"# TELA {tela_idx}:.*?(?=plt\.savefig\(caminho_t{tela_idx})"
            match_tela = re.search(padrao_tela, corpo_func, re.DOTALL)
            self.assertIsNotNone(match_tela, f"Bloco da TELA {tela_idx} não encontrado")
            bloco_tela = match_tela.group(0)
            self.assertTrue(
                TEXTO_SELO_ESPERADO in bloco_tela or "adicionar_faixa_esquematica" in bloco_tela or "desenhar_faixa_ficticia" in bloco_tela or "FAIXA_FICTICIA" in bloco_tela,
                f"TELA {tela_idx} não inclui o selo de ilustração fictícia"
            )

    def test_tela5_sem_metricas_reais_inventadas(self):
        """Na tela5, números de desempenho (AUC 0.924, 89.3%) não devem aparecer como se fossem reais."""
        match_func = re.search(r"def criar_diagramas_telas\(.*?\).*?:.*?(?=\ndef [a-zA-Z0-9_]+|\nclass |\Z)", self.conteudo, re.DOTALL)
        self.assertIsNotNone(match_func, "Função criar_diagramas_telas não encontrada")
        corpo_func = match_func.group(0)

        match_t5 = re.search(r"# TELA 5:.*?(?=plt\.savefig\(caminho_t5)", corpo_func, re.DOTALL)
        self.assertIsNotNone(match_t5, "Bloco da TELA 5 não encontrado")
        bloco_t5 = match_t5.group(0)

        # Não deve afirmar Acurácia Global: 89.3% nem ROC-AUC Global: 0.924
        self.assertNotIn("Acurácia Global: 89.3%", bloco_t5)
        self.assertNotIn("ROC-AUC Global: 0.924", bloco_t5)
        self.assertNotIn("F1-Score: 0.891", bloco_t5)
        self.assertNotIn("Curva ROC (AUC=0.924)", bloco_t5)


if __name__ == "__main__":
    unittest.main()
