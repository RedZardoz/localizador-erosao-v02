# -*- coding: utf-8 -*-
"""
Empacota o banco consolidado (data/fundiario_brasil.db) junto com as geometrias
essenciais de polígono (data/sicar_cache/*.shp, *.shx, *.prj — ignorando os .dbf
de 3.6 GB já ingeridos no SQLite) em um único arquivo ZIP otimizado para upload
no Google Drive (dist/Banco_Consolidado_SAREL_GoogleDrive.zip).
"""

import os
import sys
import zipfile


def main() -> int:
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    data_dir = os.path.join(root_dir, "data")
    dist_dir = os.path.join(root_dir, "dist")
    os.makedirs(dist_dir, exist_ok=True)

    zip_destino = os.path.join(dist_dir, "Banco_Consolidado_SAREL_GoogleDrive.zip")
    db_path = os.path.join(data_dir, "fundiario_brasil.db")

    if not os.path.exists(db_path):
        print(f"[ERRO] Arquivo {db_path} nao encontrado.")
        return 1

    print("===============================================================================")
    print(" GERANDO ARQUIVO UNICO PARA UPLOAD NO GOOGLE DRIVE")
    print(" Destino: dist\\Banco_Consolidado_SAREL_GoogleDrive.zip")
    print("===============================================================================")

    arquivos_para_incluir = [
        (db_path, "fundiario_brasil.db"),
    ]

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
    print("===============================================================================")
    print(f"[SUCESSO] Arquivo gerado: {zip_destino} ({tam_zip_mb:.1f} MB)")
    print("Suba este arquivo .ZIP na sua pasta do Google Drive e coloque o link dele no")
    print("Instalador_SAREL.exe! Quando o usuario baixar, ele ja extrai tudo em data\\!")
    print("===============================================================================")
    return 0


if __name__ == "__main__":
    sys.exit(main())
