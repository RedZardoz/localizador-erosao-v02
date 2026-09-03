#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
INGESTÃO E CÁLCULO DE BOUNDING BOX FUNDIÁRIO (CAR / SICAR & SNCR / CNIR)
Mestrado PPGTCA 2026 - Pesquisa de Erosão Laminar (Brasil)
=============================================================================
Pipeline oficial de ingestão para todas as 27 UFs brasileiras.
Processa bases oficiais do SICAR (MMA/SFB), SIGEF (INCRA) e SNCR (INCRA),
calcula limites geográficos mínimos e máximos (Bounding Box) via Shapely / PyShp,
registra metadados na tabela fontes_dados e armazena em SQLite indexado.

Uso:
  python scripts/ingest_data.py --uf PR
  python scripts/ingest_data.py --todas-ufs
  python scripts/ingest_data.py --shapes Dados_SICAR/AREA_IMOVEL_PR.zip --sncr Dados_SNCR/Imoveis_PR.csv
"""

import sqlite3
import argparse
import os
import sys
import json
import csv
import glob
import zipfile
import tempfile
import time
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple

try:
    from shapely.geometry import shape as shapely_shape, box as shapely_box
    from shapely.wkt import loads as wkt_loads
except ImportError:
    shapely_shape = None
    shapely_box = None
    wkt_loads = None

ALL_UFS = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]


def init_database(db_path: str) -> sqlite3.Connection:
    """
    Inicializa o banco de dados SQLite e garante estrutura de tabelas, índices e metadados.
    """
    db_dir = os.path.dirname(os.path.abspath(db_path))
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("PRAGMA journal_mode = WAL;")
    cursor.execute("PRAGMA synchronous = NORMAL;")

    # 1. Tabela principal de imóveis fundiários
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS imoveis_fundiarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cod_car TEXT,
            nome_imovel TEXT,
            proprietario_nome TEXT,
            registro_incra TEXT,
            area_ha REAL,
            documento TEXT,
            uf TEXT,
            municipio TEXT,
            lat_min REAL NOT NULL,
            lat_max REAL NOT NULL,
            lon_min REAL NOT NULL,
            lon_max REAL NOT NULL,
            mod_fiscal REAL,
            status TEXT,
            condicao TEXT,
            tipo TEXT,
            fonte TEXT,
            state_zip TEXT,
            shape_index INTEGER
        );
    """)

    # 2. Índices B-Tree
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fundiario_bbox_lon ON imoveis_fundiarios(lon_min, lon_max);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fundiario_bbox_lat ON imoveis_fundiarios(lat_min, lat_max);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fundiario_cod_car ON imoveis_fundiarios(cod_car);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fundiario_uf ON imoveis_fundiarios(uf);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fundiario_mun ON imoveis_fundiarios(municipio);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fundiario_fonte ON imoveis_fundiarios(fonte);")

    # 3. Tabela de Metadados Oficiais (fontes_dados)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fontes_dados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            orgao TEXT NOT NULL,
            sistema TEXT NOT NULL,
            uf TEXT NOT NULL,
            arquivo_origem TEXT NOT NULL,
            data_base TEXT NOT NULL,
            data_download TEXT NOT NULL,
            total_registros INTEGER,
            criterio_associacao TEXT,
            observacoes TEXT
        );
    """)

    # 4. Criação de R-Tree se suportado
    try:
        cursor.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS imoveis_fundiarios_rtree USING rtree(
                id,
                minX, maxX,
                minY, maxY
            );
        """)
    except Exception:
        pass

    conn.commit()
    return conn


def mask_document(doc: Optional[str]) -> str:
    """
    Mascaramento de CPF/CNPJ (LGPD art. 7º, IV).
    """
    if not doc:
        return ""
    clean = "".join(ch for ch in str(doc) if ch.isalnum())
    if len(clean) == 11:
        return f"***.{clean[3:6]}.{clean[6:9]}-**"
    elif len(clean) == 14:
        return f"**.{clean[2:5]}.{clean[5:8]}/{clean[8:12]}-**"
    return "***"


def load_sncr_csv(csv_path: Optional[str]) -> Dict[str, Dict[str, Any]]:
    """
    Carrega CSV do SNCR para enriquecimento alfanumérico.
    """
    if not csv_path or not os.path.exists(csv_path):
        return {}

    mapping = {}
    print(f"-> Lendo dados do SNCR em: {csv_path}...")
    try:
        with open(csv_path, mode="r", encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            for row in reader:
                key = (
                    row.get("cod_car")
                    or row.get("COD_CAR")
                    or row.get("NUM_CAR")
                    or row.get("codigo_imovel")
                    or row.get("registro_incra")
                    or row.get("NUM_INCRA")
                )
                if key:
                    mapping[key.strip().upper()] = {
                        "proprietario_nome": row.get("proprietario") or row.get("titular") or row.get("NOME_TITULAR") or row.get("proprietario_nome"),
                        "documento": mask_document(row.get("documento") or row.get("CPF_CNPJ")),
                        "registro_incra": row.get("codigo_imovel") or row.get("registro_incra") or row.get("NUM_INCRA"),
                        "nome_imovel": row.get("denominacao") or row.get("nome_imovel") or row.get("DENOMINACAO"),
                    }
    except Exception as e:
        print(f"[AVISO] Não foi possível ler todo o CSV do SNCR: {e}", file=sys.stderr)

    return mapping


def find_uf_files(uf: str, base_dir: str = ".") -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Localiza os arquivos oficiais padronizados para a UF nas pastas:
      - Dados SICAR/AREA_IMOVEL_{UF}.zip (ou .shp)
      - Dados SIGEF/Sigef Brasil_{UF}.zip (ou .shp)
      - Dados SNCR/Imoveis_{UF}_*.csv (ou .csv)
    """
    uf_upper = uf.upper()

    # 1. Busca SICAR
    sicar_file = None
    sicar_candidates = [
        os.path.join(base_dir, "Dados SICAR", f"AREA_IMOVEL_{uf_upper}.zip"),
        os.path.join(base_dir, "Dados SICAR", f"AREA_IMOVEL_{uf_upper}.shp"),
        os.path.join(base_dir, "Dados SICAR", uf_upper, f"AREA_IMOVEL_{uf_upper}.shp"),
    ]
    for cand in sicar_candidates:
        if os.path.exists(cand):
            sicar_file = cand
            break
    if not sicar_file:
        pattern = os.path.join(base_dir, "Dados SICAR", f"*{uf_upper}*.zip")
        matches = glob.glob(pattern)
        if matches:
            sicar_file = matches[0]

    # 2. Busca SIGEF
    sigef_file = None
    sigef_candidates = [
        os.path.join(base_dir, "Dados SIGEF", f"Sigef Brasil_{uf_upper}.zip"),
        os.path.join(base_dir, "Dados SIGEF", f"Sigef Brasil_{uf_upper}.shp"),
        os.path.join(base_dir, "Dados SIGEF", uf_upper, f"Sigef Brasil_{uf_upper}.shp"),
    ]
    for cand in sigef_candidates:
        if os.path.exists(cand):
            sigef_file = cand
            break
    if not sigef_file:
        pattern = os.path.join(base_dir, "Dados SIGEF", f"*{uf_upper}*.zip")
        matches = glob.glob(pattern)
        if matches:
            sigef_file = matches[0]

    # 3. Busca SNCR
    sncr_file = None
    sncr_pattern = os.path.join(base_dir, "Dados SNCR", f"*{uf_upper}*.csv")
    sncr_matches = glob.glob(sncr_pattern)
    if sncr_matches:
        sncr_file = sncr_matches[0]

    return sicar_file, sigef_file, sncr_file


def extract_zip_to_temp(zip_path: str, temp_dir: str) -> Optional[str]:
    """
    Extrai arquivo ZIP e retorna o caminho do primeiro .shp encontrado.
    """
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(temp_dir)
        for root, _, files in os.walk(temp_dir):
            for file in files:
                if file.lower().endswith(".shp"):
                    return os.path.join(root, file)
    except Exception as e:
        print(f"[ERRO] Falha ao descompactar {zip_path}: {e}", file=sys.stderr)
    return None


def ingest_shapefile(
    conn: sqlite3.Connection,
    shp_path: str,
    uf_default: str,
    fonte_label: str,
    sncr_map: Dict[str, Dict[str, Any]],
    batch_size: int = 5000
) -> int:
    """
    Ingere Shapefile oficial calculando os limites Bounding Box.
    """
    print(f"-> Ingerindo Shapefile: {shp_path} (UF: {uf_default})...")
    cursor = conn.cursor()
    inserted_count = 0

    # Tenta geopandas / fiona
    try:
        import geopandas as gpd
        gdf = gpd.read_file(shp_path)
        records: List[tuple] = []

        for idx, row in gdf.iterrows():
            geom = row.geometry
            if geom is None or geom.is_empty:
                continue

            minx, miny, maxx, maxy = geom.bounds
            cod_car = str(row.get("cod_car") or row.get("COD_IMOVEL") or row.get("num_car") or "").strip()
            nome_imovel = row.get("nome_imovel") or row.get("NOM_IMOVEL") or row.get("nom_imovel")
            prop_nome = row.get("proprietario_nome") or row.get("PROPRIETARIO")
            incra = row.get("registro_incra") or row.get("NUM_INCRA") or row.get("num_incra")
            doc = mask_document(row.get("documento") or row.get("CPF_CNPJ"))
            area_ha = row.get("area_ha") or row.get("NUM_AREA") or row.get("num_area")
            uf = row.get("uf") or row.get("ESTADO") or uf_default
            municipio = row.get("municipio") or row.get("MUNICIPIO") or row.get("nom_munici")

            sncr_info = sncr_map.get(cod_car.upper(), {})
            if sncr_info:
                prop_nome = sncr_info.get("proprietario_nome") or prop_nome
                doc = sncr_info.get("documento") or doc
                incra = sncr_info.get("registro_incra") or incra
                nome_imovel = sncr_info.get("nome_imovel") or nome_imovel

            records.append((
                cod_car,
                str(nome_imovel) if nome_imovel else None,
                str(prop_nome) if prop_nome else None,
                str(incra) if incra else None,
                float(area_ha) if area_ha is not None else None,
                doc,
                str(uf),
                str(municipio) if municipio else None,
                float(miny),
                float(maxy),
                float(minx),
                float(maxx),
                fonte_label,
            ))

            if len(records) >= batch_size:
                cursor.executemany("""
                    INSERT INTO imoveis_fundiarios (
                        cod_car, nome_imovel, proprietario_nome, registro_incra,
                        area_ha, documento, uf, municipio, lat_min, lat_max, lon_min, lon_max, fonte
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, records)
                conn.commit()
                inserted_count += len(records)
                records.clear()

        if records:
            cursor.executemany("""
                INSERT INTO imoveis_fundiarios (
                    cod_car, nome_imovel, proprietario_nome, registro_incra,
                    area_ha, documento, uf, municipio, lat_min, lat_max, lon_min, lon_max, fonte
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, records)
            conn.commit()
            inserted_count += len(records)

        print(f"[OK] Ingestão GeoPandas concluída: {inserted_count} registros inseridos.")
        return inserted_count

    except ImportError:
        pass

    # Fallback para pyshp (shapefile)
    try:
        import shapefile
        with shapefile.Reader(shp_path) as sf:
            fields = [f[0] for f in sf.fields[1:]]
            records = []
            for shape_rec in sf.iterShapeRecords():
                bbox = shape_rec.shape.bbox
                if not bbox or len(bbox) < 4:
                    continue
                minx, miny, maxx, maxy = bbox[0], bbox[1], bbox[2], bbox[3]
                rec_dict = dict(zip(fields, shape_rec.record))

                cod_car = str(rec_dict.get("cod_car") or rec_dict.get("COD_IMOVEL") or rec_dict.get("num_car") or "").strip()
                nome_imovel = rec_dict.get("nome_imovel") or rec_dict.get("NOM_IMOVEL") or rec_dict.get("nom_imovel")
                prop_nome = rec_dict.get("proprietario_nome") or rec_dict.get("PROPRIETARIO")
                incra = rec_dict.get("registro_incra") or rec_dict.get("NUM_INCRA")
                doc = mask_document(rec_dict.get("documento") or rec_dict.get("CPF_CNPJ"))
                area_ha = rec_dict.get("area_ha") or rec_dict.get("NUM_AREA") or rec_dict.get("num_area")
                uf = rec_dict.get("uf") or rec_dict.get("ESTADO") or uf_default
                municipio = rec_dict.get("municipio") or rec_dict.get("MUNICIPIO") or rec_dict.get("nom_munici")

                sncr_info = sncr_map.get(cod_car.upper(), {})
                if sncr_info:
                    prop_nome = sncr_info.get("proprietario_nome") or prop_nome
                    doc = sncr_info.get("documento") or doc
                    incra = sncr_info.get("registro_incra") or incra
                    nome_imovel = sncr_info.get("nome_imovel") or nome_imovel

                records.append((
                    cod_car,
                    str(nome_imovel) if nome_imovel else None,
                    str(prop_nome) if prop_nome else None,
                    str(incra) if incra else None,
                    float(area_ha) if area_ha is not None else None,
                    doc,
                    str(uf),
                    str(municipio) if municipio else None,
                    float(miny),
                    float(maxy),
                    float(minx),
                    float(maxx),
                    fonte_label,
                ))

                if len(records) >= batch_size:
                    cursor.executemany("""
                        INSERT INTO imoveis_fundiarios (
                            cod_car, nome_imovel, proprietario_nome, registro_incra,
                            area_ha, documento, uf, municipio, lat_min, lat_max, lon_min, lon_max, fonte
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                    """, records)
                    conn.commit()
                    inserted_count += len(records)
                    records.clear()

            if records:
                cursor.executemany("""
                    INSERT INTO imoveis_fundiarios (
                        cod_car, nome_imovel, proprietario_nome, registro_incra,
                        area_ha, documento, uf, municipio, lat_min, lat_max, lon_min, lon_max, fonte
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, records)
                conn.commit()
                inserted_count += len(records)

            print(f"[OK] Ingestão pyshp concluída: {inserted_count} registros inseridos.")
            return inserted_count
    except Exception as e:
        print(f"[ERRO] Falha ao ingerir Shapefile {shp_path}: {e}", file=sys.stderr)
        return 0


def record_fonte_dados(
    conn: sqlite3.Connection,
    orgao: str,
    sistema: str,
    uf: str,
    arquivo_origem: str,
    total_registros: int,
    data_base: Optional[str] = None
):
    """
    Registra metadados oficiais da ingestão na tabela fontes_dados.
    """
    cursor = conn.cursor()
    hoje = datetime.now().strftime("%Y-%m-%d")
    base_date = data_base or hoje

    # Remove registro prévio da mesma fonte e UF se houver
    cursor.execute("""
        DELETE FROM fontes_dados WHERE sistema = ? AND uf = ?;
    """, (sistema, uf))

    cursor.execute("""
        INSERT INTO fontes_dados (
            orgao, sistema, uf, arquivo_origem, data_base, data_download, total_registros, criterio_associacao, observacoes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        orgao,
        sistema,
        uf,
        os.path.basename(arquivo_origem),
        base_date,
        hoje,
        total_registros,
        "Contenção topológica estrita via Bounding Box / Shapely",
        "Ingestão automatizada oficial"
    ))
    conn.commit()


def process_uf(conn: sqlite3.Connection, uf: str, batch_size: int = 5000, base_dir: str = ".") -> int:
    """
    Processa a ingestão completa de uma UF.
    """
    sicar_file, sigef_file, sncr_file = find_uf_files(uf, base_dir)

    if not sicar_file and not sigef_file:
        print(f"[INFO] Arquivos da UF {uf} não encontrados em Dados SICAR/ ou Dados SIGEF/. Pulando.")
        return 0

    sncr_map = load_sncr_csv(sncr_file) if sncr_file else {}
    if sncr_file:
        print(f"[INFO] Arquivo SNCR localizado para {uf}: {os.path.basename(sncr_file)}")
        record_fonte_dados(
            conn,
            orgao="INCRA/SNCR",
            sistema="SNCR",
            uf=uf,
            arquivo_origem=sncr_file,
            total_registros=len(sncr_map)
        )

    total_uf_inserted = 0

    # Ingestão SICAR
    if sicar_file:
        print(f"\n--- Ingerindo SICAR para UF {uf}: {os.path.basename(sicar_file)} ---")
        if sicar_file.lower().endswith(".zip"):
            with tempfile.TemporaryDirectory() as tmp_dir:
                shp = extract_zip_to_temp(sicar_file, tmp_dir)
                if shp:
                    count = ingest_shapefile(conn, shp, uf, "SICAR Oficial (MMA/SFB)", sncr_map, batch_size)
                    total_uf_inserted += count
                    record_fonte_dados(conn, "MMA/SFB", "SICAR", uf, sicar_file, count)
        elif sicar_file.lower().endswith(".shp"):
            count = ingest_shapefile(conn, sicar_file, uf, "SICAR Oficial (MMA/SFB)", sncr_map, batch_size)
            total_uf_inserted += count
            record_fonte_dados(conn, "MMA/SFB", "SICAR", uf, sicar_file, count)

    # Ingestão SIGEF
    if sigef_file:
        print(f"\n--- Ingerindo SIGEF para UF {uf}: {os.path.basename(sigef_file)} ---")
        if sigef_file.lower().endswith(".zip"):
            with tempfile.TemporaryDirectory() as tmp_dir:
                shp = extract_zip_to_temp(sigef_file, tmp_dir)
                if shp:
                    count = ingest_shapefile(conn, shp, uf, "SIGEF Oficial (INCRA)", sncr_map, batch_size)
                    total_uf_inserted += count
                    record_fonte_dados(conn, "INCRA/SIGEF", "SIGEF", uf, sigef_file, count)
        elif sigef_file.lower().endswith(".shp"):
            count = ingest_shapefile(conn, sigef_file, uf, "SIGEF Oficial (INCRA)", sncr_map, batch_size)
            total_uf_inserted += count
            record_fonte_dados(conn, "INCRA/SIGEF", "SIGEF", uf, sigef_file, count)

    return total_uf_inserted


def main():
    parser = argparse.ArgumentParser(
        description="Ingestão de dados fundiários oficiais (SICAR / SIGEF / SNCR) para SQLite indexado por Bounding Box."
    )
    parser.add_argument("--uf", type=str, help="Sigla da UF para ingestão (ex: PR, SC, SP, MS, BA)")
    parser.add_argument("--todas-ufs", action="store_true", help="Itera sobre todas as 27 UFs do Brasil")
    parser.add_argument("--shapes", type=str, help="Caminho para arquivo Shapefile (.shp), GeoJSON ou pasta com arquivos")
    parser.add_argument("--sncr", "--csv", type=str, help="Caminho para CSV do SNCR")
    parser.add_argument("--db", type=str, default="data/fundiario_brasil.db", help="Caminho para o banco SQLite")
    parser.add_argument("--batch-size", type=int, default=5000, help="Tamanho do lote de inserção (padrão: 5000)")
    args = parser.parse_args()

    if not args.uf and not args.todas_ufs and not args.shapes:
        print("[AVISO] Especifique --uf <UF>, --todas-ufs ou --shapes <caminho>.")
        parser.print_help()
        sys.exit(1)

    conn = init_database(args.db)

    if args.uf:
        uf_target = args.uf.upper().strip()
        if uf_target not in ALL_UFS:
            print(f"[ERRO] UF '{uf_target}' inválida. Use uma das 27 UFs: {', '.join(ALL_UFS)}")
            conn.close()
            sys.exit(1)
        print("===========================================================")
        print(f"INICIANDO INGESTÃO OFICIAL PARA A UF: {uf_target}")
        print("===========================================================")
        count = process_uf(conn, uf_target, args.batch_size)
        print(f"\n[SUCESSO] Ingestão para UF {uf_target} finalizada: {count} registros adicionados.")

    elif args.todas_ufs:
        print("===========================================================")
        print("INICIANDO INGESTÃO OFICIAL EM LOTE PARA AS 27 UFs BRASILEIRAS")
        print("===========================================================")
        total_all = 0
        for uf in ALL_UFS:
            print(f"\n>> Verificando UF: {uf}...")
            count = process_uf(conn, uf, args.batch_size)
            total_all += count
        print(f"\n[CONCLUÍDO] Processamento de todas as UFs finalizado. Total inserido: {total_all} registros.")

    elif args.shapes:
        sncr_map = load_sncr_csv(args.sncr)
        target = args.shapes
        if target.lower().endswith(".shp"):
            ingest_shapefile(conn, target, "BR", "Oficial", sncr_map, args.batch_size)
        else:
            print(f"[ERRO] Formato de arquivo não suportado: {target}")

    conn.close()
    print(f"\n[FIM] Base fundiária SQLite atualizada em: {args.db}")


if __name__ == "__main__":
    main()
