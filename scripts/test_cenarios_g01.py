#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Testes de aceite para scripts/cenarios_g01.py conforme PROMPT_EXECUTOR_CENARIO_12X6_2026-11-03.md.
"""

from __future__ import annotations

import unittest
from pathlib import Path

from scripts.cenarios_g01 import (
    CENARIOS,
    Cenario,
    ler_ocupacao,
    p_preenche_titulares,
)


class TestCenariosG01(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ocupacao = ler_ocupacao()

    def test_01_conferencia_leitura_tabela(self):
        """Conferência obrigatória: total antes=677, pos-thinning=453."""
        soma_antes = sum(a for a, _ in self.ocupacao.values())
        soma_pos = sum(p for _, p in self.ocupacao.values())
        self.assertEqual(soma_antes, 677)
        self.assertEqual(soma_pos, 453)
        self.assertEqual(len(self.ocupacao), 18)

    def test_02_neutralidade_cenarios_originais(self):
        """Os sete cenários originais devem produzir exatamente os mesmos números de antes."""
        # Valores de referência obtidos antes da introdução de poligonos_por_estrato
        baseline_esperado = [
            # (nome_prefix, estratos, poligonos, heldout, min_nh, em4, guarda)
            ("Pre-registrado", 18, 72, 36, 0, 1, False),
            ("Op.1 — colapsar E em S1xK2 e no S2xK2 deficie", 15, 60, 30, 4, 1, True),
            ("Op.1-v — colapsar E em TODO S1xK2 e TODO S2xK", 14, 56, 28, 7, 0, True),
            ("Op.2 pura — excluir S1xK2 do dominio de D07", 15, 60, 30, 2, 0, False),
            ("Op.2 + colapso do S2xK2 deficiente", 14, 56, 28, 4, 1, True),
            ("Op.3 — K agregado somente em S1", 15, 60, 30, 2, 0, False),
            ("Op.3 — K agregado em S1 e S2", 12, 48, 24, 12, 0, True),
        ]

        resultados = [c.avaliar(self.ocupacao) for c in CENARIOS[:7]]
        self.assertEqual(len(resultados), 7)

        for res, (prefix, estr, pol, hout, mnh, em4, guarda) in zip(resultados, baseline_esperado):
            self.assertTrue(res["nome"].startswith(prefix), f"Nome divergente: {res['nome']}")
            self.assertEqual(res["estratos"], estr)
            self.assertEqual(res["poligonos"], pol)
            self.assertEqual(res["heldout"], hout)
            self.assertAlmostEqual(res["area_ha"], pol * 5.02, places=2)
            self.assertEqual(res["min_nh"], mnh)
            self.assertEqual(res["em_exatamente_4"], em4)
            self.assertEqual(res["satisfaz_guarda"], guarda)

        # Probabilidades do estrato mais frágil sob 25% de recusa (exibidas com 1 casa decimal no script)
        # Op.1: 31.6%, Op.1-v: 92.9%, Op.2+: 31.6%, Op.3: 100.0%
        self.assertAlmostEqual(resultados[0]["p_mais_fragil_25"], 0.0, places=4)
        self.assertAlmostEqual(resultados[1]["p_mais_fragil_25"] * 100, 31.64, delta=0.1)
        self.assertAlmostEqual(resultados[2]["p_mais_fragil_25"] * 100, 92.94, delta=0.1)
        self.assertAlmostEqual(resultados[3]["p_mais_fragil_25"], 0.0, places=4)
        self.assertAlmostEqual(resultados[4]["p_mais_fragil_25"] * 100, 31.64, delta=0.1)
        self.assertAlmostEqual(resultados[5]["p_mais_fragil_25"], 0.0, places=4)
        self.assertAlmostEqual(resultados[6]["p_mais_fragil_25"] * 100, 100.0, delta=0.1)

    def test_03_cenario_12x6(self):
        """O cenário 12x6 reporta 12 estratos, 72 polígonos, 36 held-out, 361.4 ha, min=12, viável, 98.6%."""
        cenario_12x6 = CENARIOS[7]
        res = cenario_12x6.avaliar(self.ocupacao)

        self.assertEqual(res["estratos"], 12)
        self.assertEqual(res["poligonos"], 72)
        self.assertEqual(res["heldout"], 36)
        self.assertAlmostEqual(res["area_ha"], 361.44, places=2)
        self.assertEqual(res["min_nh"], 12)
        self.assertEqual(res["em_exatamente_titulares"], 0)
        self.assertTrue(res["satisfaz_guarda"])
        self.assertAlmostEqual(res["p_mais_fragil_25"] * 100, 98.6, delta=0.1)
        self.assertAlmostEqual(res["p_mais_fragil_10"] * 100, 100.0, delta=0.1)

    def test_04_guarda_dinamica_alocacao(self):
        """Um cenário hipotético com poligonos_por_estrato > min(N_h) é reportado como não viável."""
        # Sobre os 12 estratos agregados, min(N_h) = 12.
        # Com poligonos_por_estrato = 13, deve falhar a guarda (12 < 13).
        cenario_inviavel = Cenario(
            "Hipotetico 12 x 13",
            colapsos=CENARIOS[7].colapsos,
            poligonos_por_estrato=13,
        )
        res_inviavel = cenario_inviavel.avaliar(self.ocupacao)
        self.assertFalse(res_inviavel["satisfaz_guarda"])
        self.assertEqual(res_inviavel["min_nh"], 12)
        self.assertEqual(res_inviavel["poligonos_por_estrato"], 13)

        # Com poligonos_por_estrato = 12, satisfaz no limite exato
        cenario_limite = Cenario(
            "Hipotetico 12 x 12",
            colapsos=CENARIOS[7].colapsos,
            poligonos_por_estrato=12,
        )
        res_limite = cenario_limite.avaliar(self.ocupacao)
        self.assertTrue(res_limite["satisfaz_guarda"])
        self.assertEqual(res_limite["em_exatamente_titulares"], 1)


if __name__ == "__main__":
    unittest.main()
