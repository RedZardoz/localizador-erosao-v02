# -*- coding: utf-8 -*-
"""
Empacota o banco consolidado (data/fundiario_brasil.db) junto com as geometrias
essenciais de polígono (data/sicar_cache/*.shp, *.shx, *.prj) e os sítios locais
de aferição (data/sitios_referencia_local.json e .sha256) em um único arquivo ZIP
otimizado para upload no Google Drive (dist/Banco_Consolidado_SAREL_GoogleDrive.zip).
"""

import hashlib
import os
import sys
import zipfile


def calcular_sha256_arquivo(caminho: str) -> str:
    h = hashlib.sha256()
    with open(caminho, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def empacotar_banco_gdrive(
    data_dir: str,
    dist_dir: str,
    zip_nome: str = "Banco_Consolidado_SAREL_GoogleDrive.zip",
) -> tuple[int, str, str]:
    os.makedirs(dist_dir, exist_ok=True)
    zip_destino = os.path.join(dist_dir, zip_nome)
    db_path = os.path.join(data_dir, "fundiario_brasil.db")

    if not os.path.exists(db_path):
        print(f"[ERRO] Arquivo {db_path} nao encontrado.")
        return 1, "", ""

    print("===============================================================================")
    print(" GERANDO ARQUIVO UNICO PARA UPLOAD NO GOOGLE DRIVE")
    print(f" Destino: {zip_destino}")
    print("===============================================================================")

    arquivos_para_incluir = [
        (db_path, "fundiario_brasil.db"),
    ]

    # Inclui sítios de aferição locais se existirem (DEC-10, Opção C)
    sitios_json = os.path.join(data_dir, "sitios_referencia_local.json")
    if os.path.exists(sitios_json):
        arquivos_para_incluir.append((sitios_json, "sitios_referencia_local.json"))
    sitios_sha = os.path.join(data_dir, "sitios_referencia_local.json.sha256")
    if os.path.exists(sitios_sha):
        arquivos_para_incluir.append((sitios_sha, "sitios_referencia_local.json.sha256"))

    # Inclui apenas .shp, .shx e .prj do sicar_cache (necessários para o contorno exato
    # do imóvel em spatial_owner_matcher.py e get_property_polygon.py), pulando os .dbf de 3.6 GB
    sicar_cache_dir = os.path.join(data_dir, "sicar_cache")
    if os.path.exists(sicar_cache_dir):
        for nome in sorted(os.listdir(sicar_cache_dir)):
            if nome.lower().endswith((".shp", ".shx", ".prj")):
                caminho_abs = os.path.join(sicar_cache_dir, nome)
                arquivos_para_incluir.append((caminho_abs, f"sicar_cache/{nome}"))

    with zipfile.ZipFile(zip_destino, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for caminho_abs, nome_interno in arquivos_para_incluir:
            tam_mb = os.path.getsize(caminho_abs) / (1024 * 1024)
            print(f" -> Compactando {nome_interno} ({tam_mb:.1f} MB)...")
            zf.write(caminho_abs, arcname=nome_interno)

    tam_zip_mb = os.path.getsize(zip_destino) / (1024 * 1024)
    sha256_zip = calcular_sha256_arquivo(zip_destino)

    print("===============================================================================")
    print(f"[SUCESSO] Arquivo gerado: {zip_destino} ({tam_zip_mb:.1f} MB)")
    print(f"SHA-256 do ZIP: {sha256_zip}")
    print("Suba este arquivo .ZIP na sua pasta do Google Drive e coloque o link dele no")
    print("Instalador_SAREL.exe! Quando o usuario baixar, ele ja extrai tudo em data\\!")
    print("===============================================================================")
    print("AVISO DE SEGURANCA:")
    print("NÃO suba este ZIP a uma pasta com link público (R-H, DP-15): restrinja a pasta a pessoas específicas antes")
    print("===============================================================================")
    return 0, zip_destino, sha256_zip


def main() -> int:
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    data_dir = os.path.join(root_dir, "data")
    dist_dir = os.path.join(root_dir, "dist")
    status, _, _ = empacotar_banco_gdrive(data_dir, dist_dir)
    return status


if __name__ == "__main__":
    sys.exit(main())
