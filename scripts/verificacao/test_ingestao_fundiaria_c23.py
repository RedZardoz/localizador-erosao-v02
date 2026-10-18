#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
===============================================================================
Bateria de Testes da Ingestão Fundiária — SAREL v2.0
Verificação do bloco C23: tratamento de ausência e erro na ingestão fundiária.
Valor ausente ou ilegível vira NULL, nunca 0.0 ou 100.0 por padrão.
Os dados utilizados são 100% sintéticos (SINTETICO_TESTE_ENCANAMENTO);
nenhum número produzido constitui evidência científica.
===============================================================================
"""

import os
import sys
import tempfile
import sqlite3
import subprocess
import json
import unittest

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

caminho_scripts = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if caminho_scripts not in sys.path:
    sys.path.insert(0, caminho_scripts)

from ingest_sncr_official import init_sncr_table, ingest_csv_file


class TestIngestaoFundiariaC23(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, "test_fundiario.db")
        self.conn = sqlite3.connect(self.db_path)
        init_sncr_table(self.conn)

    def tearDown(self):
        self.conn.close()
        self.temp_dir.cleanup()

    def test_sncr_ausencia_e_erro_viram_null(self):
        csv_path = os.path.join(self.temp_dir.name, "sncr_sintetico_PR_01_01_2026.csv")
        # Linha 1: Válida completa
        # Linha 2: Área ausente (""), perc_det ausente ("") -> devem virar NULL
        # Linha 3: Área ilegível ("INVALIDO"), perc_det ilegível ("XYZ") -> devem virar NULL
        # Linha 4: Linha curta com menos de 7 colunas -> deve ser rejeitada
        linhas = [
            "codigo_imovel;denominacao;municipio_ibge;municipio;uf;area_total;titular;natureza_juridica;condicao;percentual_detencao",
            "SINTETICO_TESTE_ENCANAMENTO_01;Fazenda Teste 1;4104808;Cascavel;PR;123,45;Titular Teste 1;Pessoa Fisica;Proprietario;80,5",
            "SINTETICO_TESTE_ENCANAMENTO_02;Fazenda Teste 2;4104808;Cascavel;PR;;Titular Teste 2;Pessoa Fisica;Proprietario;",
            "SINTETICO_TESTE_ENCANAMENTO_03;Fazenda Teste 3;4104808;Cascavel;PR;INVALIDO;Titular Teste 3;Pessoa Fisica;Proprietario;XYZ",
            "LINHA_CURTA_REJEITADA;Incompleta;4104808",
        ]
        with open(csv_path, "w", encoding="utf-8") as f:
            f.write("\n".join(linhas) + "\n")

        ingest_csv_file(self.conn, csv_path, batch_size=10)

        cursor = self.conn.cursor()
        cursor.execute("SELECT codigo_imovel, area_total, percentual_detencao FROM cadastro_sncr ORDER BY codigo_imovel;")
        registros = cursor.fetchall()

        # Linha curta foi rejeitada: restam exatamente 3 registros
        self.assertEqual(len(registros), 3)

        # Registro 1: valores parseados com sucesso
        self.assertEqual(registros[0][0], "SINTETICO_TESTE_ENCANAMENTO_01")
        self.assertAlmostEqual(registros[0][1], 123.45)
        self.assertAlmostEqual(registros[0][2], 80.5)

        # Registro 2: campo vazio DEVE virar NULL (None), nunca 0.0 nem 100.0
        self.assertEqual(registros[1][0], "SINTETICO_TESTE_ENCANAMENTO_02")
        self.assertIsNone(registros[1][1], "area_total ausente deve ser NULL, nunca 0.0")
        self.assertIsNone(registros[1][2], "percentual_detencao ausente deve ser NULL, nunca 100.0")

        # Registro 3: campo ilegível DEVE virar NULL (None), nunca 0.0 nem 100.0
        self.assertEqual(registros[2][0], "SINTETICO_TESTE_ENCANAMENTO_03")
        self.assertIsNone(registros[2][1], "area_total ilegivel deve ser NULL, nunca 0.0")
        self.assertIsNone(registros[2][2], "percentual_detencao ilegivel deve ser NULL, nunca 100.0")

    def test_get_fontes_dados_devolve_erro_estruturado_quando_inexistente(self):
        script_path = os.path.join(caminho_scripts, "get_fontes_dados.py")
        db_fantasma = os.path.join(self.temp_dir.name, "banco_inexistente.db")

        proc = subprocess.run(
            [sys.executable, script_path, "--db", db_fantasma],
            capture_output=True,
            text=True,
        )
        self.assertEqual(proc.returncode, 0)
        saida = json.loads(proc.stdout.strip())

        # Não pode ser lista vazia []
        self.assertIsInstance(saida, dict)
        self.assertIn("erro", saida)
        self.assertIn("nao encontrado", saida["erro"])


if __name__ == "__main__":
    unittest.main()
