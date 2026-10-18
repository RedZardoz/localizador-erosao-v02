#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Teste de Verificação C18 — Relatório de Mudanças Sem Métricas/Contagens Inventadas
Garante que scripts/gerar_relatorio_mudancas_pdf.py não contenha intervalo de AUC inventado
(como 'AUC 0,82-0,91') nem contagens de testes literais fabricadas (como '35 passed', '235 passed').
"""

import re
import unittest
from pathlib import Path

RAIZ_REPOSITORIO = Path(__file__).resolve().parents[2]
CAMINHO_GERADOR = RAIZ_REPOSITORIO / "scripts" / "gerar_relatorio_mudancas_pdf.py"


class TestRelatorioMudancasC18(unittest.TestCase):
    def setUp(self):
        self.assertTrue(CAMINHO_GERADOR.exists(), f"Gerador não encontrado: {CAMINHO_GERADOR}")
        with open(CAMINHO_GERADOR, "r", encoding="utf-8") as f:
            self.conteudo = f.read()

    def test_gerador_sem_intervalo_auc_inventado(self):
        """Verifica que o gerador não contém intervalo fixo de AUC sem embasamento empírico."""
        self.assertNotIn(
            "AUC 0,",
            self.conteudo,
            "Gerador ainda contém menção a 'AUC 0,' (ex.: AUC 0,82-0,91)."
        )

    def test_gerador_sem_contagens_testes_literais(self):
        """Verifica que o gerador não fixa número de testes com '<n> passed)'."""
        match_passed = re.findall(r"\d+\s*passed\)", self.conteudo)
        self.assertEqual(
            match_passed,
            [],
            f"Gerador ainda contém contagens numéricas literais de testes: {match_passed}"
        )


if __name__ == "__main__":
    unittest.main()
