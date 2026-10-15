# -*- coding: utf-8 -*-
"""
Teste de verificacao do gerador de ZIP do Google Drive (N07, Passo 8).
Valida em diretorio temporario sintetico a inclusao dos sitios locais e hash SHA-256.
"""

import os
import sys
import tempfile
import zipfile

# Adiciona raiz do projeto ao sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, root_dir)

from scripts.gerar_zip_banco_gdrive import empacotar_banco_gdrive, calcular_sha256_arquivo


def test_gerar_zip_sintetico():
    with tempfile.TemporaryDirectory() as tmpdir:
        data_dir = os.path.join(tmpdir, "data")
        dist_dir = os.path.join(tmpdir, "dist")
        os.makedirs(data_dir, exist_ok=True)
        os.makedirs(dist_dir, exist_ok=True)

        # 1. Cria arquivos sintéticos
        db_path = os.path.join(data_dir, "fundiario_brasil.db")
        with open(db_path, "wb") as f:
            f.write(b"SQLITE_SYNTHETIC_TEST_HEADER")

        sitios_path = os.path.join(data_dir, "sitios_referencia_local.json")
        with open(sitios_path, "w", encoding="utf-8") as f:
            f.write('{"versao": 1, "sitios": []}')

        sha_path = sitios_path + ".sha256"
        with open(sha_path, "w", encoding="utf-8") as f:
            f.write("abcd1234ef5678  sitios_referencia_local.json\n")

        # 2. Executa empacotamento
        status, zip_path, zip_sha = empacotar_banco_gdrive(
            data_dir, dist_dir, "test_banco.zip"
        )
        assert status == 0, f"Status esperado 0, obteve {status}"
        assert os.path.exists(zip_path), f"Arquivo ZIP nao encontrado: {zip_path}"

        # 3. Confere hash SHA-256
        sha_real = calcular_sha256_arquivo(zip_path)
        assert zip_sha == sha_real, f"SHA divergente: {zip_sha} != {sha_real}"

        # 4. Confere conteudo interno do ZIP
        with zipfile.ZipFile(zip_path, "r") as zf:
            nomes = zf.namelist()
            assert "fundiario_brasil.db" in nomes, "fundiario_brasil.db ausente no ZIP"
            assert (
                "sitios_referencia_local.json" in nomes
            ), "sitios_referencia_local.json ausente no ZIP"
            assert (
                "sitios_referencia_local.json.sha256" in nomes
            ), "sitios_referencia_local.json.sha256 ausente no ZIP"

        print("[OK] test_gerar_zip_sintetico passou com sucesso.")


if __name__ == "__main__":
    test_gerar_zip_sintetico()
