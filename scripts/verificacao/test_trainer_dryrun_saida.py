#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Teste de Verificação C12 (A05, A54) — Trainer XGBoost:
Garante que --dados é obrigatório e que o modo dry-run isola
estritamente seus artefatos na subpasta DRYRUN_SINTETICO/ com o
prefixo DRYRUN_SINTETICO_ e registra origem_dados no JSON de saída.
"""

import os
import sys
import json
import hashlib
import unittest
import tempfile
import subprocess
from pathlib import Path

RAIZ_REPOSITORIO = Path(__file__).resolve().parents[2]


def calcular_sha256(caminho: str) -> str:
    h = hashlib.sha256()
    with open(caminho, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


class TestTrainerDryrunSaida(unittest.TestCase):
    def test_invocacao_sem_dados_falha(self):
        """Testa que invocar scripts/treinar_xgboost_loco.py sem --dados falha com exit != 0."""
        cmd = [sys.executable, "scripts/treinar_xgboost_loco.py"]
        proc = subprocess.run(
            cmd,
            cwd=str(RAIZ_REPOSITORIO),
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(
            proc.returncode,
            0,
            f"Esperado retorno diferente de zero ao omitir --dados. Retornou {proc.returncode}.\nSaída:\n{proc.stdout}\n{proc.stderr}",
        )
        # O argparse reporta erro contendo a indicação de argumento obrigatório --dados
        saida_combinada = f"{proc.stdout}\n{proc.stderr}"
        self.assertIn(
            "--dados",
            saida_combinada,
            f"Mensagem de erro deveria mencionar '--dados'. Saída:\n{saida_combinada}",
        )

    def test_invocacao_dryrun_gera_em_subpasta_com_prefixo_e_origem_dados(self):
        """Testa que invocar com --dry-run gera arquivos estritamente na subpasta DRYRUN_SINTETICO/ com prefixo e origem_dados."""
        with tempfile.TemporaryDirectory() as tmpdir:
            caminho_dados = os.path.join(tmpdir, "dados_teste.csv")
            diretorio_saida = os.path.join(tmpdir, "saida_teste")

            conteudo_csv = (
                "declividade_pct,elevacao_m,bsi,ndvi,Bloco_Espacial,Classe_Alvo_Binaria\n"
                "10.5,450.0,0.15,0.35,Bacia Tibagi,1\n"
                "5.1,380.0,-0.10,0.75,Bacia Tibagi,0\n"
                "15.2,520.0,0.22,0.28,Macrobacia Ivai (IAT),1\n"
                "4.8,390.0,-0.08,0.72,Macrobacia Ivai (IAT),0\n"
                "12.0,480.0,0.18,0.30,Bacia do Paranapanema,1\n"
                "6.0,410.0,-0.12,0.80,Bacia do Paranapanema,0\n"
            )
            with open(caminho_dados, "w", encoding="utf-8") as f:
                f.write(conteudo_csv)

            hash_esperado = calcular_sha256(caminho_dados)

            cmd = [
                sys.executable,
                "scripts/treinar_xgboost_loco.py",
                "--dados",
                caminho_dados,
                "--dry-run",
                "--saida",
                diretorio_saida,
                "--k_blocos",
                "2",
                "--semente",
                "42",
            ]
            proc = subprocess.run(
                cmd,
                cwd=str(RAIZ_REPOSITORIO),
                capture_output=True,
                text=True,
            )
            self.assertEqual(
                proc.returncode,
                0,
                f"Falha na execução do trainer em modo dry-run (exit code {proc.returncode}).\nStdout:\n{proc.stdout}\nStderr:\n{proc.stderr}",
            )

            # 1. Verifica se a pasta DRYRUN_SINTETICO foi criada dentro de diretorio_saida
            pasta_dryrun = os.path.join(diretorio_saida, "DRYRUN_SINTETICO")
            self.assertTrue(
                os.path.isdir(pasta_dryrun),
                f"Subpasta {pasta_dryrun} não foi criada.",
            )

            # 2. Verifica se a raiz de diretorio_saida NÃO contém arquivos soltos (apenas a subpasta DRYRUN_SINTETICO)
            itens_raiz_saida = os.listdir(diretorio_saida)
            self.assertEqual(
                itens_raiz_saida,
                ["DRYRUN_SINTETICO"],
                f"Diretório de saída contém arquivos fora de DRYRUN_SINTETICO: {itens_raiz_saida}",
            )

            # 3. Verifica se todos os artefatos dentro de DRYRUN_SINTETICO possuem o prefixo DRYRUN_SINTETICO_
            arquivos_dryrun = os.listdir(pasta_dryrun)
            self.assertGreater(
                len(arquivos_dryrun),
                0,
                "Nenhum arquivo encontrado em DRYRUN_SINTETICO/",
            )
            for nome_arq in arquivos_dryrun:
                self.assertTrue(
                    nome_arq.startswith("DRYRUN_SINTETICO_"),
                    f"Arquivo {nome_arq} em DRYRUN_SINTETICO/ não possui o prefixo obrigatório 'DRYRUN_SINTETICO_'.",
                )

            # 4. Verifica o JSON e a chave origem_dados
            caminho_json = os.path.join(
                pasta_dryrun, "DRYRUN_SINTETICO_relatorio_modelagem_xgboost_loco.json"
            )
            self.assertTrue(
                os.path.isfile(caminho_json),
                f"Relatório JSON não encontrado em {caminho_json}",
            )

            with open(caminho_json, "r", encoding="utf-8") as f:
                dados_relatorio = json.load(f)

            self.assertIn("origem_dados", dados_relatorio)
            self.assertEqual(dados_relatorio["origem_dados"]["caminho"], caminho_dados)
            self.assertEqual(dados_relatorio["origem_dados"]["sha256"], hash_esperado)

    def test_invocacao_sem_dryrun_recusa_modo_probatorio_com_exit_2(self):
        """Testa que execução em modo probatório (sem --dry-run) é recusada com código 2 (DEC-14c, DEC-15c)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            caminho_dados = os.path.join(tmpdir, "dados_teste.csv")
            diretorio_saida = os.path.join(tmpdir, "saida_teste")

            conteudo_csv = (
                "declividade_pct,elevacao_m,bsi,ndvi,Bloco_Espacial,Classe_Alvo_Binaria\n"
                "10.5,450.0,0.15,0.35,Bacia Tibagi,1\n"
                "5.1,380.0,-0.10,0.75,Bacia Tibagi,0\n"
                "15.2,520.0,0.22,0.28,Macrobacia Ivai (IAT),1\n"
                "4.8,390.0,-0.08,0.72,Macrobacia Ivai (IAT),0\n"
            )
            with open(caminho_dados, "w", encoding="utf-8") as f:
                f.write(conteudo_csv)

            cmd = [
                sys.executable,
                "scripts/treinar_xgboost_loco.py",
                "--dados",
                caminho_dados,
                "--saida",
                diretorio_saida,
            ]
            import time
            inicio = time.time()
            proc = subprocess.run(
                cmd,
                cwd=str(RAIZ_REPOSITORIO),
                capture_output=True,
                text=True,
            )
            duracao = time.time() - inicio

            self.assertEqual(
                proc.returncode,
                2,
                f"Esperado retorno 2 para recusa de modo probatório. Retornou {proc.returncode}.\nStderr: {proc.stderr}",
            )
            self.assertIn("scripts/d25/", proc.stderr)
            self.assertLess(
                duracao,
                5.0,
                f"Recusa do modo probatório demorou {duracao:.2f}s (esperado < 5.0s porque deve recusar antes de carregar dados e treinar).",
            )
            # Não deve ter executado treino nem imprimido progresso de modelagem na stdout
            self.assertEqual(
                proc.stdout.strip(),
                "",
                f"Stdout deveria estar vazia (recusa prévia antes de qualquer processamento), mas continha:\n{proc.stdout}",
            )
            # Diretório de saída não deve conter arquivos
            if os.path.exists(diretorio_saida):
                self.assertEqual(os.listdir(diretorio_saida), [])


if __name__ == "__main__":
    unittest.main()

