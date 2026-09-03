#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
INGESTÃO E CÁLCULO DE BOUNDING BOX FUNDIÁRIO (CAR / SICAR & SNCR / CNIR)
Mestrado PPGTCA 2026 - Pesquisa de Erosão Laminar (Brasil)
=============================================================================
Processa camadas espaciais (Shapefile, GeoJSON) e tabelas alfanuméricas (CSV)
de propriedades rurais de qualquer estado do Brasil, calcula os limites geográficos
mínimos e máximos (Bounding Box) via Shapely e armazena em SQLite local indexado.

Uso:
  python scripts/ingest_data.py --create-demo
  python scripts/ingest_data.py --shapes caminho/imoveis_PR.shp --sncr caminho/sncr_PR.csv
  python scripts/ingest_data.py --shapes caminho/imoveis.geojson --db data/fundiario_brasil.db
"""

import sqlite3
import argparse
import os
import sys
import json
import csv
from typing import Optional, Dict, Any, List

try:
    from shapely.geometry import shape as shapely_shape, box as shapely_box
    from shapely.wkt import loads as wkt_loads
except ImportError:
    shapely_shape = None
    shapely_box = None
    wkt_loads = None


def init_database(db_path: str) -> sqlite3.Connection:
    """
    Inicializa o banco de dados SQLite e cria a estrutura de tabelas e índices B-Tree.
    """
    db_dir = os.path.dirname(os.path.abspath(db_path))
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Otimizações de performance SQLite para ingestão em lote
    cursor.execute("PRAGMA journal_mode = WAL;")
    cursor.execute("PRAGMA synchronous = NORMAL;")

    # 1. Criação da tabela com colunas fundamentais e Bounding Box
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
            lon_max REAL NOT NULL
        );
    """)

    # 2. Criação de índices B-Tree para consultas espaciais sub-segundo
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fundiario_bbox_lon ON imoveis_fundiarios(lon_min, lon_max);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fundiario_bbox_lat ON imoveis_fundiarios(lat_min, lat_max);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fundiario_cod_car ON imoveis_fundiarios(cod_car);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fundiario_uf ON imoveis_fundiarios(uf);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fundiario_mun ON imoveis_fundiarios(municipio);")

    conn.commit()
    return conn


def mask_document(doc: Optional[str]) -> str:
    """
    Mascaramento seguro de CPF/CNPJ para conformidade LGPD em auditorias.
    Ex: 123.456.789-00 -> ***.456.789-**
    """
    if not doc:
        return ""
    clean = "".join(ch for ch in str(doc) if ch.isalnum())
    if len(clean) == 11:
        # CPF: 12345678901 -> ***.456.789-**
        return f"***.{clean[3:6]}.{clean[6:9]}-**"
    elif len(clean) == 14:
        # CNPJ: 12345678000195 -> **.345.678/0001-**
        return f"**.{clean[2:5]}.{clean[5:8]}/{clean[8:12]}-**"
    return "***"


def load_sncr_csv(csv_path: Optional[str]) -> Dict[str, Dict[str, Any]]:
    """
    Carrega tabela alfanumérica do SNCR/CNIR para enriquecimento de proprietários por código CAR/imóvel.
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
                    or row.get("registro_incra")
                    or row.get("NUM_INCRA")
                )
                if key:
                    mapping[key.strip().upper()] = {
                        "proprietario_nome": row.get("proprietario") or row.get("NOME_TITULAR") or row.get("proprietario_nome"),
                        "documento": mask_document(row.get("documento") or row.get("CPF_CNPJ")),
                        "registro_incra": row.get("registro_incra") or row.get("NUM_INCRA"),
                        "nome_imovel": row.get("nome_imovel") or row.get("DENOMINACAO"),
                    }
    except Exception as e:
        print(f"[Aviso] Não foi possível ler todo o CSV do SNCR: {e}", file=sys.stderr)

    return mapping


def ingest_geojson(conn: sqlite3.Connection, geojson_path: str, sncr_map: Dict[str, Dict[str, Any]], batch_size: int = 5000):
    """
    Ingere arquivo GeoJSON, computando limites geográficos Bounding Box via Shapely.
    """
    print(f"-> Ingerindo GeoJSON: {geojson_path}...")
    cursor = conn.cursor()

    with open(geojson_path, "r", encoding="utf-8", errors="ignore") as f:
        data = json.load(f)

    features = data.get("features", [])
    records: List[tuple] = []
    inserted_count = 0

    for feat in features:
        props = feat.get("properties", {})
        geom = feat.get("geometry")
        if not geom:
            continue

        bbox = feat.get("bbox")
        lon_min, lat_min, lon_max, lat_max = None, None, None, None

        if bbox and len(bbox) >= 4:
            lon_min, lat_min, lon_max, lat_max = float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])
        elif shapely_shape:
            try:
                poly = shapely_shape(geom)
                minx, miny, maxx, maxy = poly.bounds
                lon_min, lat_min, lon_max, lat_max = float(minx), float(miny), float(maxx), float(maxy)
            except Exception:
                continue

        if lon_min is None:
            continue

        cod_car = (props.get("cod_car") or props.get("COD_IMOVEL") or props.get("carCode") or "").strip()
        nome_imovel = props.get("nome_imovel") or props.get("NOM_IMOVEL") or props.get("propertyName")
        prop_nome = props.get("proprietario_nome") or props.get("PROPRIETARIO") or props.get("ownerName")
        incra = props.get("registro_incra") or props.get("NUM_INCRA") or props.get("incraRegistry")
        doc = mask_document(props.get("documento") or props.get("CPF_CNPJ") or props.get("ownerDocumentMasked"))
        area_ha = props.get("area_ha") or props.get("NUM_AREA") or props.get("propertyAreaHa")
        uf = props.get("uf") or props.get("ESTADO") or "BR"
        municipio = props.get("municipio") or props.get("MUNICIPIO")

        # Cruzamento SNCR se disponível
        sncr_info = sncr_map.get(cod_car.upper(), {})
        if sncr_info:
            prop_nome = sncr_info.get("proprietario_nome") or prop_nome
            doc = sncr_info.get("documento") or doc
            incra = sncr_info.get("registro_incra") or incra
            nome_imovel = sncr_info.get("nome_imovel") or nome_imovel

        records.append((
            cod_car,
            nome_imovel,
            prop_nome,
            incra,
            float(area_ha) if area_ha is not None else None,
            doc,
            uf,
            municipio,
            lat_min,
            lat_max,
            lon_min,
            lon_max,
        ))

        if len(records) >= batch_size:
            cursor.executemany("""
                INSERT INTO imoveis_fundiarios (
                    cod_car, nome_imovel, proprietario_nome, registro_incra,
                    area_ha, documento, uf, municipio, lat_min, lat_max, lon_min, lon_max
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, records)
            conn.commit()
            inserted_count += len(records)
            records.clear()
            print(f"   Processados {inserted_count} imóveis rurais...")

    if records:
        cursor.executemany("""
            INSERT INTO imoveis_fundiarios (
                cod_car, nome_imovel, proprietario_nome, registro_incra,
                area_ha, documento, uf, municipio, lat_min, lat_max, lon_min, lon_max
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, records)
        conn.commit()
        inserted_count += len(records)

    print(f"[OK] Ingestão concluída: {inserted_count} registros inseridos a partir de {geojson_path}")


def ingest_shapefile(conn: sqlite3.Connection, shp_path: str, sncr_map: Dict[str, Dict[str, Any]], batch_size: int = 5000):
    """
    Ingere ESRI Shapefile utilizando geopandas ou pyshp.
    """
    print(f"-> Ingerindo Shapefile: {shp_path}...")
    cursor = conn.cursor()
    inserted_count = 0

    try:
        import geopandas as gpd
        gdf = gpd.read_file(shp_path)
        # Garante projeção geográfica WGS84 EPSG:4326
        if gdf.crs and gdf.crs.to_epsg() != 4326:
            gdf = gdf.to_crs(epsg=4326)

        records = []
        for _, row in gdf.iterrows():
            geom = row.geometry
            if geom is None or geom.is_empty:
                continue
            minx, miny, maxx, maxy = geom.bounds

            cod_car = str(row.get("cod_car", "") or row.get("COD_IMOVEL", "") or "").strip()
            nome_imovel = row.get("nome_imovel") or row.get("NOM_IMOVEL")
            prop_nome = row.get("proprietario_nome") or row.get("PROPRIETARIO")
            incra = row.get("registro_incra") or row.get("NUM_INCRA")
            doc = mask_document(row.get("documento") or row.get("CPF_CNPJ"))
            area_ha = row.get("area_ha") or row.get("NUM_AREA")
            uf = row.get("uf") or row.get("ESTADO") or "BR"
            municipio = row.get("municipio") or row.get("MUNICIPIO")

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
            ))

            if len(records) >= batch_size:
                cursor.executemany("""
                    INSERT INTO imoveis_fundiarios (
                        cod_car, nome_imovel, proprietario_nome, registro_incra,
                        area_ha, documento, uf, municipio, lat_min, lat_max, lon_min, lon_max
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, records)
                conn.commit()
                inserted_count += len(records)
                records.clear()

        if records:
            cursor.executemany("""
                INSERT INTO imoveis_fundiarios (
                    cod_car, nome_imovel, proprietario_nome, registro_incra,
                    area_ha, documento, uf, municipio, lat_min, lat_max, lon_min, lon_max
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, records)
            conn.commit()
            inserted_count += len(records)

        print(f"[OK] Ingestão Shapefile concluída: {inserted_count} registros inseridos.")
        return

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

                cod_car = str(rec_dict.get("cod_car") or rec_dict.get("COD_IMOVEL") or "").strip()
                nome_imovel = rec_dict.get("nome_imovel") or rec_dict.get("NOM_IMOVEL")
                prop_nome = rec_dict.get("proprietario_nome") or rec_dict.get("PROPRIETARIO")
                incra = rec_dict.get("registro_incra") or rec_dict.get("NUM_INCRA")
                doc = mask_document(rec_dict.get("documento") or rec_dict.get("CPF_CNPJ"))
                area_ha = rec_dict.get("area_ha") or rec_dict.get("NUM_AREA")
                uf = rec_dict.get("uf") or "BR"
                municipio = rec_dict.get("municipio")

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
                ))

                if len(records) >= batch_size:
                    cursor.executemany("""
                        INSERT INTO imoveis_fundiarios (
                            cod_car, nome_imovel, proprietario_nome, registro_incra,
                            area_ha, documento, uf, municipio, lat_min, lat_max, lon_min, lon_max
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                    """, records)
                    conn.commit()
                    inserted_count += len(records)
                    records.clear()

            if records:
                cursor.executemany("""
                    INSERT INTO imoveis_fundiarios (
                        cod_car, nome_imovel, proprietario_nome, registro_incra,
                        area_ha, documento, uf, municipio, lat_min, lat_max, lon_min, lon_max
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, records)
                conn.commit()
                inserted_count += len(records)

            print(f"[OK] Ingestão pyshp concluída: {inserted_count} registros inseridos.")
    except Exception as e:
        print(f"[ERRO] Falha ao ingerir Shapefile: {e}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(
        description="Ingestão de polígonos rurais (CAR/SICAR) e associação SNCR/CNIR para SQLite indexado por Bounding Box."
    )
    parser.add_argument("--shapes", type=str, help="Caminho para arquivo Shapefile (.shp), GeoJSON (.geojson) ou pasta com arquivos")
    parser.add_argument("--sncr", "--csv", type=str, help="Caminho para CSV do SNCR com dados de titulares/proprietários")
    parser.add_argument("--db", type=str, default="data/fundiario_brasil.db", help="Caminho para o banco de dados SQLite (padrão: data/fundiario_brasil.db)")
    parser.add_argument("--batch-size", type=int, default=5000, help="Tamanho do lote de inserção por transação (padrão: 5000)")
    args = parser.parse_args()

    if not args.shapes:
        print("[AVISO] Nenhum arquivo fornecido. Especifique --shapes.")
        parser.print_help()
        sys.exit(1)

    sncr_map = load_sncr_csv(args.sncr)
    conn = init_database(args.db)

    target = args.shapes
    if os.path.isdir(target):
        for root, _, files in os.walk(target):
            for file in files:
                fpath = os.path.join(root, file)
                if file.endswith((".geojson", ".json")):
                    ingest_geojson(conn, fpath, sncr_map, args.batch_size)
                elif file.endswith(".shp"):
                    ingest_shapefile(conn, fpath, sncr_map, args.batch_size)
    elif target.endswith((".geojson", ".json")):
        ingest_geojson(conn, target, sncr_map, args.batch_size)
    elif target.endswith(".shp"):
        ingest_shapefile(conn, target, sncr_map, args.batch_size)
    else:
        print(f"[ERRO] Formato não suportado para: {target}", file=sys.stderr)
        conn.close()
        sys.exit(1)

    conn.close()
    print(f"[CONCLUÍDO] Base fundiária atualizada com sucesso em: {args.db}")


if __name__ == "__main__":
    main()
