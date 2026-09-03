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


def create_demo_database(db_path: str):
    """
    Gera um banco de dados demonstrativo completo com propriedades rurais cadastradas
    para TODOS os 26 estados brasileiros e o Distrito Federal (todas as 5 macrorregiões).
    Permite validação e cruzamento espacial em qualquer polo agropecuário ou área de estudo do Brasil.
    """
    print(f"-> Criando banco de dados SQLite demonstrativo nacional (Brasil) em: {db_path}...")
    conn = init_database(db_path)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM imoveis_fundiarios;")

    # Malha de polos agrícolas, municípios e bacias cobrindo os 26 estados + Distrito Federal
    brasil_mun_data = [
        # ==========================================
        # REGIÃO SUL (PR, SC, RS)
        # ==========================================
        # Paraná (52 municípios)
        {"uf": "PR", "mun": "Paranavaí", "lat": -23.081, "lng": -52.464, "ibge": "4118402", "reg": "Sul"},
        {"uf": "PR", "mun": "Umuarama", "lat": -23.766, "lng": -53.325, "ibge": "4128104", "reg": "Sul"},
        {"uf": "PR", "mun": "Cianorte", "lat": -23.663, "lng": -52.605, "ibge": "4105508", "reg": "Sul"},
        {"uf": "PR", "mun": "Cruzeiro do Oeste", "lat": -23.784, "lng": -53.075, "ibge": "4106605", "reg": "Sul"},
        {"uf": "PR", "mun": "Alto Paraná", "lat": -23.129, "lng": -52.318, "ibge": "4100603", "reg": "Sul"},
        {"uf": "PR", "mun": "Loanda", "lat": -22.923, "lng": -52.987, "ibge": "4113502", "reg": "Sul"},
        {"uf": "PR", "mun": "Cidade Gaúcha", "lat": -23.362, "lng": -52.944, "ibge": "4105607", "reg": "Sul"},
        {"uf": "PR", "mun": "Terra Roxa", "lat": -24.159, "lng": -54.098, "ibge": "4127403", "reg": "Sul"},
        {"uf": "PR", "mun": "Nova Londrina", "lat": -22.765, "lng": -52.986, "ibge": "4117107", "reg": "Sul"},
        {"uf": "PR", "mun": "Paraíso do Norte", "lat": -23.280, "lng": -52.603, "ibge": "4117909", "reg": "Sul"},
        {"uf": "PR", "mun": "Maringá", "lat": -23.420, "lng": -51.933, "ibge": "4115200", "reg": "Sul"},
        {"uf": "PR", "mun": "Londrina", "lat": -23.304, "lng": -51.169, "ibge": "4113700", "reg": "Sul"},
        {"uf": "PR", "mun": "Arapongas", "lat": -23.414, "lng": -51.424, "ibge": "4101502", "reg": "Sul"},
        {"uf": "PR", "mun": "Apucarana", "lat": -23.551, "lng": -51.461, "ibge": "4101403", "reg": "Sul"},
        {"uf": "PR", "mun": "Rolândia", "lat": -23.310, "lng": -51.368, "ibge": "4122404", "reg": "Sul"},
        {"uf": "PR", "mun": "Cambé", "lat": -23.276, "lng": -51.278, "ibge": "4103701", "reg": "Sul"},
        {"uf": "PR", "mun": "Astorga", "lat": -23.232, "lng": -51.665, "ibge": "4102104", "reg": "Sul"},
        {"uf": "PR", "mun": "Mandaguari", "lat": -23.528, "lng": -51.772, "ibge": "4114401", "reg": "Sul"},
        {"uf": "PR", "mun": "Jandaia do Sul", "lat": -23.601, "lng": -51.644, "ibge": "4112108", "reg": "Sul"},
        {"uf": "PR", "mun": "Colorado", "lat": -22.837, "lng": -51.973, "ibge": "4105904", "reg": "Sul"},
        {"uf": "PR", "mun": "Cornélio Procópio", "lat": -23.181, "lng": -50.646, "ibge": "4106407", "reg": "Sul"},
        {"uf": "PR", "mun": "Santo Antônio da Platina", "lat": -23.295, "lng": -50.082, "ibge": "4124103", "reg": "Sul"},
        {"uf": "PR", "mun": "Jacarezinho", "lat": -23.160, "lng": -49.970, "ibge": "4111803", "reg": "Sul"},
        {"uf": "PR", "mun": "Bandeirantes", "lat": -23.107, "lng": -50.367, "ibge": "4102401", "reg": "Sul"},
        {"uf": "PR", "mun": "Ibaiti", "lat": -23.848, "lng": -50.187, "ibge": "4109703", "reg": "Sul"},
        {"uf": "PR", "mun": "Wenceslau Braz", "lat": -23.874, "lng": -49.803, "ibge": "4128500", "reg": "Sul"},
        {"uf": "PR", "mun": "Siqueira Campos", "lat": -23.689, "lng": -49.833, "ibge": "4126603", "reg": "Sul"},
        {"uf": "PR", "mun": "Campo Mourão", "lat": -24.045, "lng": -52.381, "ibge": "4104308", "reg": "Sul"},
        {"uf": "PR", "mun": "Goioerê", "lat": -24.184, "lng": -53.027, "ibge": "4108606", "reg": "Sul"},
        {"uf": "PR", "mun": "Ubiratã", "lat": -24.545, "lng": -52.990, "ibge": "4128005", "reg": "Sul"},
        {"uf": "PR", "mun": "Mamborê", "lat": -24.318, "lng": -52.529, "ibge": "4114005", "reg": "Sul"},
        {"uf": "PR", "mun": "Engenheiro Beltrão", "lat": -23.797, "lng": -52.269, "ibge": "4107504", "reg": "Sul"},
        {"uf": "PR", "mun": "Campina da Lagoa", "lat": -24.590, "lng": -52.799, "ibge": "4103909", "reg": "Sul"},
        {"uf": "PR", "mun": "Cascavel", "lat": -24.957, "lng": -53.459, "ibge": "4104803", "reg": "Sul"},
        {"uf": "PR", "mun": "Toledo", "lat": -24.724, "lng": -53.743, "ibge": "4127700", "reg": "Sul"},
        {"uf": "PR", "mun": "Palotina", "lat": -24.283, "lng": -53.840, "ibge": "4117800", "reg": "Sul"},
        {"uf": "PR", "mun": "Marechal Cândido Rondon", "lat": -24.556, "lng": -54.057, "ibge": "4114609", "reg": "Sul"},
        {"uf": "PR", "mun": "Medianeira", "lat": -25.297, "lng": -54.094, "ibge": "4115804", "reg": "Sul"},
        {"uf": "PR", "mun": "Foz do Iguaçu", "lat": -25.516, "lng": -54.585, "ibge": "4108304", "reg": "Sul"},
        {"uf": "PR", "mun": "Assis Chateaubriand", "lat": -24.417, "lng": -53.521, "ibge": "4102005", "reg": "Sul"},
        {"uf": "PR", "mun": "Santa Helena", "lat": -24.858, "lng": -54.332, "ibge": "4123501", "reg": "Sul"},
        {"uf": "PR", "mun": "Pato Branco", "lat": -26.228, "lng": -52.671, "ibge": "4118501", "reg": "Sul"},
        {"uf": "PR", "mun": "Francisco Beltrão", "lat": -26.081, "lng": -53.055, "ibge": "4108403", "reg": "Sul"},
        {"uf": "PR", "mun": "Dois Vizinhos", "lat": -25.750, "lng": -53.056, "ibge": "4107207", "reg": "Sul"},
        {"uf": "PR", "mun": "Chopinzinho", "lat": -25.856, "lng": -52.523, "ibge": "4105409", "reg": "Sul"},
        {"uf": "PR", "mun": "Coronel Vivida", "lat": -25.978, "lng": -52.568, "ibge": "4106456", "reg": "Sul"},
        {"uf": "PR", "mun": "Palmas", "lat": -26.483, "lng": -51.989, "ibge": "4117602", "reg": "Sul"},
        {"uf": "PR", "mun": "Capanema", "lat": -25.669, "lng": -53.799, "ibge": "4104506", "reg": "Sul"},
        {"uf": "PR", "mun": "Guarapuava", "lat": -25.395, "lng": -51.458, "ibge": "4109406", "reg": "Sul"},
        {"uf": "PR", "mun": "Ponta Grossa", "lat": -25.095, "lng": -50.161, "ibge": "4119905", "reg": "Sul"},
        {"uf": "PR", "mun": "Castro", "lat": -24.791, "lng": -50.012, "ibge": "4104902", "reg": "Sul"},
        {"uf": "PR", "mun": "Telêmaco Borba", "lat": -24.323, "lng": -50.615, "ibge": "4127106", "reg": "Sul"},
        {"uf": "PR", "mun": "Tibagi", "lat": -24.512, "lng": -50.413, "ibge": "4127502", "reg": "Sul"},
        {"uf": "PR", "mun": "Prudentópolis", "lat": -25.213, "lng": -50.978, "ibge": "4120606", "reg": "Sul"},
        {"uf": "PR", "mun": "Irati", "lat": -25.467, "lng": -50.651, "ibge": "4110701", "reg": "Sul"},
        {"uf": "PR", "mun": "União da Vitória", "lat": -26.225, "lng": -51.085, "ibge": "4128203", "reg": "Sul"},
        {"uf": "PR", "mun": "São Mateus do Sul", "lat": -25.873, "lng": -50.383, "ibge": "4125605", "reg": "Sul"},
        {"uf": "PR", "mun": "Laranjeiras do Sul", "lat": -25.408, "lng": -52.415, "ibge": "4113304", "reg": "Sul"},
        {"uf": "PR", "mun": "Pitanga", "lat": -24.757, "lng": -51.761, "ibge": "4119608", "reg": "Sul"},
        {"uf": "PR", "mun": "Ivaiporã", "lat": -24.248, "lng": -51.684, "ibge": "4111506", "reg": "Sul"},
        {"uf": "PR", "mun": "Curitiba", "lat": -25.428, "lng": -49.273, "ibge": "4106902", "reg": "Sul"},
        {"uf": "PR", "mun": "Lapa", "lat": -25.769, "lng": -49.716, "ibge": "4113205", "reg": "Sul"},
        {"uf": "PR", "mun": "Rio Negro", "lat": -26.103, "lng": -49.797, "ibge": "4122305", "reg": "Sul"},
        {"uf": "PR", "mun": "Cerro Azul", "lat": -24.825, "lng": -49.260, "ibge": "4105300", "reg": "Sul"},
        {"uf": "PR", "mun": "Morretes", "lat": -25.476, "lng": -48.834, "ibge": "4116208", "reg": "Sul"},
        {"uf": "PR", "mun": "Antonina", "lat": -25.429, "lng": -48.712, "ibge": "4101205", "reg": "Sul"},
        {"uf": "PR", "mun": "Paranaguá", "lat": -25.520, "lng": -48.509, "ibge": "4118204", "reg": "Sul"},
        {"uf": "PR", "mun": "Guaratuba", "lat": -25.883, "lng": -48.575, "ibge": "4109604", "reg": "Sul"},

        # Rio Grande do Sul (RS)
        {"uf": "RS", "mun": "Passo Fundo", "lat": -28.262, "lng": -52.408, "ibge": "4314100", "reg": "Sul"},
        {"uf": "RS", "mun": "Cruz Alta", "lat": -28.638, "lng": -53.606, "ibge": "4306106", "reg": "Sul"},
        {"uf": "RS", "mun": "Santa Maria", "lat": -29.684, "lng": -53.807, "ibge": "4316907", "reg": "Sul"},
        {"uf": "RS", "mun": "Ijuí", "lat": -28.388, "lng": -53.915, "ibge": "4310207", "reg": "Sul"},
        {"uf": "RS", "mun": "Santo Ângelo", "lat": -28.299, "lng": -54.263, "ibge": "4317509", "reg": "Sul"},
        {"uf": "RS", "mun": "Pelotas", "lat": -31.765, "lng": -52.338, "ibge": "4314407", "reg": "Sul"},
        {"uf": "RS", "mun": "Bagé", "lat": -31.331, "lng": -54.107, "ibge": "4301602", "reg": "Sul"},
        {"uf": "RS", "mun": "Uruguaiana", "lat": -29.754, "lng": -57.088, "ibge": "4322400", "reg": "Sul"},
        {"uf": "RS", "mun": "Alegrete", "lat": -29.784, "lng": -55.792, "ibge": "4300406", "reg": "Sul"},
        {"uf": "RS", "mun": "Vacaria", "lat": -28.512, "lng": -50.934, "ibge": "4322509", "reg": "Sul"},
        {"uf": "RS", "mun": "Carazinho", "lat": -28.284, "lng": -52.786, "ibge": "4304705", "reg": "Sul"},
        {"uf": "RS", "mun": "São Borja", "lat": -28.660, "lng": -56.004, "ibge": "4318002", "reg": "Sul"},
        {"uf": "RS", "mun": "Caxias do Sul", "lat": -29.168, "lng": -51.179, "ibge": "4305108", "reg": "Sul"},
        {"uf": "RS", "mun": "Erechim", "lat": -27.634, "lng": -52.274, "ibge": "4307005", "reg": "Sul"},

        # Santa Catarina (SC)
        {"uf": "SC", "mun": "Chapecó", "lat": -27.100, "lng": -52.615, "ibge": "4204202", "reg": "Sul"},
        {"uf": "SC", "mun": "Concórdia", "lat": -27.234, "lng": -52.026, "ibge": "4204301", "reg": "Sul"},
        {"uf": "SC", "mun": "Xanxerê", "lat": -26.875, "lng": -52.404, "ibge": "4219507", "reg": "Sul"},
        {"uf": "SC", "mun": "Campos Novos", "lat": -27.402, "lng": -51.226, "ibge": "4203600", "reg": "Sul"},
        {"uf": "SC", "mun": "Lages", "lat": -27.816, "lng": -50.326, "ibge": "4209300", "reg": "Sul"},
        {"uf": "SC", "mun": "Joaçaba", "lat": -27.177, "lng": -51.503, "ibge": "4209003", "reg": "Sul"},
        {"uf": "SC", "mun": "Canoinhas", "lat": -26.177, "lng": -50.390, "ibge": "4203808", "reg": "Sul"},
        {"uf": "SC", "mun": "São Miguel do Oeste", "lat": -26.727, "lng": -53.518, "ibge": "4217204", "reg": "Sul"},
        {"uf": "SC", "mun": "Curitibanos", "lat": -27.283, "lng": -50.584, "ibge": "4204806", "reg": "Sul"},
        {"uf": "SC", "mun": "Rio do Sul", "lat": -27.214, "lng": -49.643, "ibge": "4214805", "reg": "Sul"},

        # ==========================================
        # REGIÃO SUDESTE (SP, MG, ES, RJ)
        # ==========================================
        # São Paulo (SP)
        {"uf": "SP", "mun": "Ribeirão Preto", "lat": -21.177, "lng": -47.810, "ibge": "3543402", "reg": "Sudeste"},
        {"uf": "SP", "mun": "Presidente Prudente", "lat": -22.125, "lng": -51.389, "ibge": "3541406", "reg": "Sudeste"},
        {"uf": "SP", "mun": "Araçatuba", "lat": -21.209, "lng": -50.433, "ibge": "3502804", "reg": "Sudeste"},
        {"uf": "SP", "mun": "São José do Rio Preto", "lat": -20.811, "lng": -49.376, "ibge": "3549805", "reg": "Sudeste"},
        {"uf": "SP", "mun": "Franca", "lat": -20.539, "lng": -47.401, "ibge": "3516200", "reg": "Sudeste"},
        {"uf": "SP", "mun": "Barretos", "lat": -20.557, "lng": -48.568, "ibge": "3505500", "reg": "Sudeste"},
        {"uf": "SP", "mun": "Piracicaba", "lat": -22.725, "lng": -47.649, "ibge": "3538709", "reg": "Sudeste"},
        {"uf": "SP", "mun": "Campinas", "lat": -22.905, "lng": -47.061, "ibge": "3509502", "reg": "Sudeste"},
        {"uf": "SP", "mun": "Bauru", "lat": -22.315, "lng": -49.061, "ibge": "3506003", "reg": "Sudeste"},
        {"uf": "SP", "mun": "Marília", "lat": -22.214, "lng": -49.946, "ibge": "3529005", "reg": "Sudeste"},
        {"uf": "SP", "mun": "Assis", "lat": -22.662, "lng": -50.418, "ibge": "3504008", "reg": "Sudeste"},
        {"uf": "SP", "mun": "Itapetininga", "lat": -23.592, "lng": -48.053, "ibge": "3522307", "reg": "Sudeste"},
        {"uf": "SP", "mun": "Botucatu", "lat": -22.886, "lng": -48.445, "ibge": "3507506", "reg": "Sudeste"},
        {"uf": "SP", "mun": "Araraquara", "lat": -21.794, "lng": -48.176, "ibge": "3503208", "reg": "Sudeste"},
        {"uf": "SP", "mun": "Andradina", "lat": -20.896, "lng": -51.379, "ibge": "3502101", "reg": "Sudeste"},
        {"uf": "SP", "mun": "Ourinhos", "lat": -22.979, "lng": -49.871, "ibge": "3534708", "reg": "Sudeste"},
        {"uf": "SP", "mun": "Avaré", "lat": -23.099, "lng": -48.926, "ibge": "3504503", "reg": "Sudeste"},

        # Minas Gerais (MG)
        {"uf": "MG", "mun": "Uberlândia", "lat": -18.918, "lng": -48.277, "ibge": "3170206", "reg": "Sudeste"},
        {"uf": "MG", "mun": "Uberaba", "lat": -19.748, "lng": -47.932, "ibge": "3170107", "reg": "Sudeste"},
        {"uf": "MG", "mun": "Patos de Minas", "lat": -18.579, "lng": -46.518, "ibge": "3148004", "reg": "Sudeste"},
        {"uf": "MG", "mun": "Paracatu", "lat": -17.222, "lng": -46.874, "ibge": "3147006", "reg": "Sudeste"},
        {"uf": "MG", "mun": "Unaí", "lat": -16.357, "lng": -46.906, "ibge": "3170404", "reg": "Sudeste"},
        {"uf": "MG", "mun": "Montes Claros", "lat": -16.735, "lng": -43.862, "ibge": "3143302", "reg": "Sudeste"},
        {"uf": "MG", "mun": "Alfenas", "lat": -21.428, "lng": -45.946, "ibge": "3101607", "reg": "Sudeste"},
        {"uf": "MG", "mun": "Passos", "lat": -20.719, "lng": -46.609, "ibge": "3147907", "reg": "Sudeste"},
        {"uf": "MG", "mun": "Lavras", "lat": -21.246, "lng": -45.000, "ibge": "3138203", "reg": "Sudeste"},
        {"uf": "MG", "mun": "Patrocínio", "lat": -18.944, "lng": -46.993, "ibge": "3148103", "reg": "Sudeste"},
        {"uf": "MG", "mun": "Araguari", "lat": -18.648, "lng": -48.187, "ibge": "3103504", "reg": "Sudeste"},
        {"uf": "MG", "mun": "João Pinheiro", "lat": -17.743, "lng": -46.173, "ibge": "3136306", "reg": "Sudeste"},
        {"uf": "MG", "mun": "Juiz de Fora", "lat": -21.764, "lng": -43.350, "ibge": "3136702", "reg": "Sudeste"},

        # Espírito Santo (ES)
        {"uf": "ES", "mun": "Linhares", "lat": -19.391, "lng": -40.072, "ibge": "3203205", "reg": "Sudeste"},
        {"uf": "ES", "mun": "Colatina", "lat": -19.539, "lng": -40.630, "ibge": "3201506", "reg": "Sudeste"},
        {"uf": "ES", "mun": "Cachoeiro de Itapemirim", "lat": -20.849, "lng": -41.113, "ibge": "3201209", "reg": "Sudeste"},
        {"uf": "ES", "mun": "São Mateus", "lat": -18.716, "lng": -39.859, "ibge": "3204906", "reg": "Sudeste"},

        # Rio de Janeiro (RJ)
        {"uf": "RJ", "mun": "Campos dos Goytacazes", "lat": -21.754, "lng": -41.324, "ibge": "3301009", "reg": "Sudeste"},
        {"uf": "RJ", "mun": "Resende", "lat": -22.469, "lng": -44.447, "ibge": "3304201", "reg": "Sudeste"},
        {"uf": "RJ", "mun": "Itaperuna", "lat": -21.206, "lng": -41.888, "ibge": "3302205", "reg": "Sudeste"},

        # ==========================================
        # REGIÃO CENTRO-OESTE (MT, MS, GO, DF)
        # ==========================================
        # Mato Grosso (MT)
        {"uf": "MT", "mun": "Sorriso", "lat": -12.542, "lng": -55.721, "ibge": "5107925", "reg": "Centro-Oeste"},
        {"uf": "MT", "mun": "Sinop", "lat": -11.860, "lng": -55.509, "ibge": "5107909", "reg": "Centro-Oeste"},
        {"uf": "MT", "mun": "Rondonópolis", "lat": -16.467, "lng": -54.636, "ibge": "5107602", "reg": "Centro-Oeste"},
        {"uf": "MT", "mun": "Lucas do Rio Verde", "lat": -13.053, "lng": -55.911, "ibge": "5105259", "reg": "Centro-Oeste"},
        {"uf": "MT", "mun": "Nova Mutum", "lat": -13.830, "lng": -56.082, "ibge": "5106224", "reg": "Centro-Oeste"},
        {"uf": "MT", "mun": "Campo Novo do Parecis", "lat": -13.675, "lng": -57.892, "ibge": "5102637", "reg": "Centro-Oeste"},
        {"uf": "MT", "mun": "Tangará da Serra", "lat": -14.623, "lng": -57.485, "ibge": "5107958", "reg": "Centro-Oeste"},
        {"uf": "MT", "mun": "Primavera do Leste", "lat": -15.559, "lng": -54.296, "ibge": "5107040", "reg": "Centro-Oeste"},
        {"uf": "MT", "mun": "Barra do Garças", "lat": -15.893, "lng": -52.257, "ibge": "5101803", "reg": "Centro-Oeste"},
        {"uf": "MT", "mun": "Sapezal", "lat": -13.545, "lng": -58.814, "ibge": "5107875", "reg": "Centro-Oeste"},
        {"uf": "MT", "mun": "Diamantino", "lat": -14.404, "lng": -56.446, "ibge": "5103502", "reg": "Centro-Oeste"},
        {"uf": "MT", "mun": "Querência", "lat": -12.607, "lng": -52.193, "ibge": "5107065", "reg": "Centro-Oeste"},
        {"uf": "MT", "mun": "Canarana", "lat": -13.551, "lng": -52.271, "ibge": "5102702", "reg": "Centro-Oeste"},
        {"uf": "MT", "mun": "Confresa", "lat": -10.643, "lng": -51.569, "ibge": "5103361", "reg": "Centro-Oeste"},

        # Mato Grosso do Sul (MS)
        {"uf": "MS", "mun": "Dourados", "lat": -22.221, "lng": -54.806, "ibge": "5003702", "reg": "Centro-Oeste"},
        {"uf": "MS", "mun": "Maracaju", "lat": -21.614, "lng": -55.168, "ibge": "5005400", "reg": "Centro-Oeste"},
        {"uf": "MS", "mun": "Campo Grande", "lat": -20.443, "lng": -54.646, "ibge": "5002704", "reg": "Centro-Oeste"},
        {"uf": "MS", "mun": "Ponta Porã", "lat": -22.536, "lng": -55.726, "ibge": "5006606", "reg": "Centro-Oeste"},
        {"uf": "MS", "mun": "Sidrolândia", "lat": -20.932, "lng": -54.961, "ibge": "5007901", "reg": "Centro-Oeste"},
        {"uf": "MS", "mun": "São Gabriel do Oeste", "lat": -19.393, "lng": -54.581, "ibge": "5007695", "reg": "Centro-Oeste"},
        {"uf": "MS", "mun": "Naviraí", "lat": -23.065, "lng": -54.191, "ibge": "5005707", "reg": "Centro-Oeste"},
        {"uf": "MS", "mun": "Três Lagoas", "lat": -20.785, "lng": -51.706, "ibge": "5008305", "reg": "Centro-Oeste"},
        {"uf": "MS", "mun": "Rio Brilhante", "lat": -21.802, "lng": -54.546, "ibge": "5007208", "reg": "Centro-Oeste"},
        {"uf": "MS", "mun": "Chapadão do Sul", "lat": -18.793, "lng": -52.619, "ibge": "5002951", "reg": "Centro-Oeste"},
        {"uf": "MS", "mun": "Costa Rica", "lat": -18.543, "lng": -53.129, "ibge": "5003207", "reg": "Centro-Oeste"},
        {"uf": "MS", "mun": "Nova Andradina", "lat": -22.239, "lng": -53.344, "ibge": "5006200", "reg": "Centro-Oeste"},

        # Goiás (GO)
        {"uf": "GO", "mun": "Rio Verde", "lat": -17.792, "lng": -50.919, "ibge": "5218805", "reg": "Centro-Oeste"},
        {"uf": "GO", "mun": "Jataí", "lat": -17.881, "lng": -51.714, "ibge": "5211909", "reg": "Centro-Oeste"},
        {"uf": "GO", "mun": "Cristalina", "lat": -16.769, "lng": -47.614, "ibge": "5206206", "reg": "Centro-Oeste"},
        {"uf": "GO", "mun": "Itumbiara", "lat": -18.419, "lng": -49.215, "ibge": "5211503", "reg": "Centro-Oeste"},
        {"uf": "GO", "mun": "Morrinhos", "lat": -17.731, "lng": -49.100, "ibge": "5213806", "reg": "Centro-Oeste"},
        {"uf": "GO", "mun": "Catalão", "lat": -18.166, "lng": -47.946, "ibge": "5205109", "reg": "Centro-Oeste"},
        {"uf": "GO", "mun": "Mineiros", "lat": -17.569, "lng": -52.551, "ibge": "5213103", "reg": "Centro-Oeste"},
        {"uf": "GO", "mun": "Anápolis", "lat": -16.327, "lng": -48.953, "ibge": "5201108", "reg": "Centro-Oeste"},
        {"uf": "GO", "mun": "Goiânia", "lat": -16.686, "lng": -49.264, "ibge": "5208707", "reg": "Centro-Oeste"},
        {"uf": "GO", "mun": "Formosa", "lat": -15.539, "lng": -47.337, "ibge": "5208004", "reg": "Centro-Oeste"},
        {"uf": "GO", "mun": "Luziânia", "lat": -16.252, "lng": -47.950, "ibge": "5212501", "reg": "Centro-Oeste"},
        {"uf": "GO", "mun": "Quirinópolis", "lat": -18.448, "lng": -50.452, "ibge": "5218508", "reg": "Centro-Oeste"},
        {"uf": "GO", "mun": "Porangatu", "lat": -13.441, "lng": -49.149, "ibge": "5218003", "reg": "Centro-Oeste"},

        # Distrito Federal (DF)
        {"uf": "DF", "mun": "Brasília", "lat": -15.794, "lng": -47.882, "ibge": "5300108", "reg": "Centro-Oeste"},
        {"uf": "DF", "mun": "Planaltina", "lat": -15.617, "lng": -47.650, "ibge": "5300108", "reg": "Centro-Oeste"},
        {"uf": "DF", "mun": "Gama", "lat": -16.017, "lng": -48.064, "ibge": "5300108", "reg": "Centro-Oeste"},
        {"uf": "DF", "mun": "Brazlândia", "lat": -15.679, "lng": -48.201, "ibge": "5300108", "reg": "Centro-Oeste"},

        # ==========================================
        # REGIÃO NORDESTE & MATOPIBA (BA, MA, PI, TO, CE, PE, PB, RN, AL, SE)
        # ==========================================
        # Bahia (BA)
        {"uf": "BA", "mun": "Luís Eduardo Magalhães", "lat": -12.096, "lng": -45.797, "ibge": "2919553", "reg": "Matopiba"},
        {"uf": "BA", "mun": "Barreiras", "lat": -12.145, "lng": -44.996, "ibge": "2903201", "reg": "Matopiba"},
        {"uf": "BA", "mun": "São Desidério", "lat": -12.363, "lng": -44.973, "ibge": "2928901", "reg": "Matopiba"},
        {"uf": "BA", "mun": "Correntina", "lat": -13.343, "lng": -44.637, "ibge": "2909307", "reg": "Matopiba"},
        {"uf": "BA", "mun": "Formosa do Rio Preto", "lat": -11.048, "lng": -45.193, "ibge": "2911105", "reg": "Matopiba"},
        {"uf": "BA", "mun": "Riachão das Neves", "lat": -11.746, "lng": -44.910, "ibge": "2926202", "reg": "Matopiba"},
        {"uf": "BA", "mun": "Feira de Santana", "lat": -12.266, "lng": -38.966, "ibge": "2910800", "reg": "Nordeste"},
        {"uf": "BA", "mun": "Vitória da Conquista", "lat": -14.866, "lng": -40.839, "ibge": "2933307", "reg": "Nordeste"},
        {"uf": "BA", "mun": "Juazeiro", "lat": -9.414, "lng": -40.503, "ibge": "2918407", "reg": "Nordeste"},
        {"uf": "BA", "mun": "Ilhéus", "lat": -14.793, "lng": -39.049, "ibge": "2913606", "reg": "Nordeste"},

        # Maranhão (MA)
        {"uf": "MA", "mun": "Balsas", "lat": -7.532, "lng": -46.036, "ibge": "2101608", "reg": "Matopiba"},
        {"uf": "MA", "mun": "Imperatriz", "lat": -5.526, "lng": -47.491, "ibge": "2105302", "reg": "Nordeste"},
        {"uf": "MA", "mun": "Tasso Fragoso", "lat": -8.476, "lng": -45.743, "ibge": "2112100", "reg": "Matopiba"},
        {"uf": "MA", "mun": "Sambaíba", "lat": -7.142, "lng": -45.347, "ibge": "2110203", "reg": "Matopiba"},
        {"uf": "MA", "mun": "Chapadinha", "lat": -3.742, "lng": -43.359, "ibge": "2103208", "reg": "Nordeste"},

        # Piauí (PI)
        {"uf": "PI", "mun": "Uruçuí", "lat": -7.229, "lng": -44.556, "ibge": "2211209", "reg": "Matopiba"},
        {"uf": "PI", "mun": "Bom Jesus", "lat": -9.074, "lng": -44.358, "ibge": "2201903", "reg": "Matopiba"},
        {"uf": "PI", "mun": "Ribeiro Gonçalves", "lat": -7.558, "lng": -45.247, "ibge": "2208809", "reg": "Matopiba"},
        {"uf": "PI", "mun": "Corrente", "lat": -10.443, "lng": -45.161, "ibge": "2202901", "reg": "Matopiba"},
        {"uf": "PI", "mun": "Baixa Grande do Ribeiro", "lat": -7.850, "lng": -45.215, "ibge": "2201176", "reg": "Matopiba"},

        # Tocantins (TO)
        {"uf": "TO", "mun": "Palmas", "lat": -10.249, "lng": -48.324, "ibge": "1721000", "reg": "Matopiba"},
        {"uf": "TO", "mun": "Porto Nacional", "lat": -10.708, "lng": -48.417, "ibge": "1718204", "reg": "Matopiba"},
        {"uf": "TO", "mun": "Gurupi", "lat": -11.729, "lng": -49.068, "ibge": "1709500", "reg": "Matopiba"},
        {"uf": "TO", "mun": "Araguaína", "lat": -7.192, "lng": -48.204, "ibge": "1702109", "reg": "Matopiba"},
        {"uf": "TO", "mun": "Pedro Afonso", "lat": -8.968, "lng": -48.175, "ibge": "1716505", "reg": "Matopiba"},
        {"uf": "TO", "mun": "Paraíso do Tocantins", "lat": -10.175, "lng": -48.882, "ibge": "1716109", "reg": "Matopiba"},
        {"uf": "TO", "mun": "Lagoa da Confusão", "lat": -10.793, "lng": -49.624, "ibge": "1711902", "reg": "Matopiba"},
        {"uf": "TO", "mun": "Campos Lindos", "lat": -7.994, "lng": -47.665, "ibge": "1703867", "reg": "Matopiba"},

        # Ceará (CE)
        {"uf": "CE", "mun": "Limoeiro do Norte", "lat": -5.145, "lng": -38.098, "ibge": "2307601", "reg": "Nordeste"},
        {"uf": "CE", "mun": "Quixadá", "lat": -4.971, "lng": -39.015, "ibge": "2311306", "reg": "Nordeste"},
        {"uf": "CE", "mun": "Sobral", "lat": -3.689, "lng": -40.349, "ibge": "2312908", "reg": "Nordeste"},

        # Pernambuco (PE)
        {"uf": "PE", "mun": "Petrolina", "lat": -9.398, "lng": -40.500, "ibge": "2611101", "reg": "Nordeste"},
        {"uf": "PE", "mun": "Garanhuns", "lat": -8.890, "lng": -36.492, "ibge": "2606002", "reg": "Nordeste"},
        {"uf": "PE", "mun": "Serra Talhada", "lat": -7.992, "lng": -38.298, "ibge": "2614600", "reg": "Nordeste"},

        # Paraíba (PB)
        {"uf": "PB", "mun": "Campina Grande", "lat": -7.224, "lng": -35.881, "ibge": "2504009", "reg": "Nordeste"},
        {"uf": "PB", "mun": "Sousa", "lat": -6.761, "lng": -38.228, "ibge": "2516201", "reg": "Nordeste"},
        {"uf": "PB", "mun": "Patos", "lat": -7.024, "lng": -37.280, "ibge": "2510808", "reg": "Nordeste"},

        # Rio Grande do Norte (RN)
        {"uf": "RN", "mun": "Mossoró", "lat": -5.187, "lng": -37.344, "ibge": "2408003", "reg": "Nordeste"},
        {"uf": "RN", "mun": "Caicó", "lat": -6.458, "lng": -37.098, "ibge": "2402006", "reg": "Nordeste"},
        {"uf": "RN", "mun": "Assú", "lat": -5.576, "lng": -36.911, "ibge": "2400208", "reg": "Nordeste"},

        # Alagoas (AL)
        {"uf": "AL", "mun": "Arapiraca", "lat": -9.754, "lng": -36.661, "ibge": "2700300", "reg": "Nordeste"},
        {"uf": "AL", "mun": "Coruripe", "lat": -10.125, "lng": -36.175, "ibge": "2702306", "reg": "Nordeste"},
        {"uf": "AL", "mun": "Penedo", "lat": -10.289, "lng": -36.586, "ibge": "2706703", "reg": "Nordeste"},

        # Sergipe (SE)
        {"uf": "SE", "mun": "Lagarto", "lat": -10.917, "lng": -37.650, "ibge": "2803500", "reg": "Nordeste"},
        {"uf": "SE", "mun": "Itabaiana", "lat": -10.685, "lng": -37.425, "ibge": "2802908", "reg": "Nordeste"},
        {"uf": "SE", "mun": "Propriá", "lat": -10.211, "lng": -36.840, "ibge": "2805703", "reg": "Nordeste"},

        # ==========================================
        # REGIÃO NORTE (PA, RO, AC, RR, AP, AM)
        # ==========================================
        # Pará (PA)
        {"uf": "PA", "mun": "Paragominas", "lat": -2.996, "lng": -47.352, "ibge": "1505502", "reg": "Norte"},
        {"uf": "PA", "mun": "Santarém", "lat": -2.443, "lng": -54.708, "ibge": "1506807", "reg": "Norte"},
        {"uf": "PA", "mun": "Altamira", "lat": -3.203, "lng": -52.206, "ibge": "1500602", "reg": "Norte"},
        {"uf": "PA", "mun": "Marabá", "lat": -5.368, "lng": -49.117, "ibge": "1504208", "reg": "Norte"},
        {"uf": "PA", "mun": "Redenção", "lat": -8.026, "lng": -50.032, "ibge": "1506138", "reg": "Norte"},
        {"uf": "PA", "mun": "Novo Progresso", "lat": -7.148, "lng": -55.378, "ibge": "1505031", "reg": "Norte"},
        {"uf": "PA", "mun": "São Félix do Xingu", "lat": -6.644, "lng": -51.993, "ibge": "1507300", "reg": "Norte"},
        {"uf": "PA", "mun": "Tomé-Açu", "lat": -2.417, "lng": -48.151, "ibge": "1508001", "reg": "Norte"},

        # Rondônia (RO)
        {"uf": "RO", "mun": "Vilhena", "lat": -12.740, "lng": -60.145, "ibge": "1100304", "reg": "Norte"},
        {"uf": "RO", "mun": "Ariquemes", "lat": -9.913, "lng": -63.040, "ibge": "1100023", "reg": "Norte"},
        {"uf": "RO", "mun": "Ji-Paraná", "lat": -10.884, "lng": -61.951, "ibge": "1100122", "reg": "Norte"},
        {"uf": "RO", "mun": "Cacoal", "lat": -11.438, "lng": -61.447, "ibge": "1100049", "reg": "Norte"},
        {"uf": "RO", "mun": "Rolim de Moura", "lat": -11.727, "lng": -61.771, "ibge": "1100288", "reg": "Norte"},
        {"uf": "RO", "mun": "Porto Velho", "lat": -8.761, "lng": -63.903, "ibge": "1100205", "reg": "Norte"},

        # Acre (AC)
        {"uf": "AC", "mun": "Rio Branco", "lat": -9.975, "lng": -67.824, "ibge": "1200401", "reg": "Norte"},
        {"uf": "AC", "mun": "Cruzeiro do Sul", "lat": -7.631, "lng": -72.670, "ibge": "1200203", "reg": "Norte"},
        {"uf": "AC", "mun": "Brasiléia", "lat": -11.016, "lng": -68.748, "ibge": "1200104", "reg": "Norte"},

        # Roraima (RR)
        {"uf": "RR", "mun": "Boa Vista", "lat": 2.823, "lng": -60.675, "ibge": "1400100", "reg": "Norte"},
        {"uf": "RR", "mun": "Rorainópolis", "lat": 0.945, "lng": -60.439, "ibge": "1400472", "reg": "Norte"},
        {"uf": "RR", "mun": "Cantá", "lat": 2.610, "lng": -60.601, "ibge": "1400175", "reg": "Norte"},

        # Amapá (AP)
        {"uf": "AP", "mun": "Macapá", "lat": 0.035, "lng": -51.070, "ibge": "1600303", "reg": "Norte"},
        {"uf": "AP", "mun": "Santana", "lat": -0.058, "lng": -51.181, "ibge": "1600600", "reg": "Norte"},
        {"uf": "AP", "mun": "Tartarugalzinho", "lat": 1.514, "lng": -50.912, "ibge": "1600709", "reg": "Norte"},

        # Amazonas (AM)
        {"uf": "AM", "mun": "Humaitá", "lat": -7.506, "lng": -63.020, "ibge": "1301704", "reg": "Norte"},
        {"uf": "AM", "mun": "Boca do Acre", "lat": -8.752, "lng": -67.397, "ibge": "1300706", "reg": "Norte"},
        {"uf": "AM", "mun": "Manacapuru", "lat": -3.299, "lng": -60.620, "ibge": "1302504", "reg": "Norte"},
        {"uf": "AM", "mun": "Parintins", "lat": -2.628, "lng": -56.735, "ibge": "1303403", "reg": "Norte"},
    ]

    farm_types = ["Fazenda", "Estância", "Sítio", "Agropecuária", "Gleba"]
    farm_names = [
        "Santa Maria", "Boa Esperança", "São José", "Primavera", "Três Rios",
        "Sol Nascente", "Santo Antônio", "Bela Vista", "Capão Rico", "Pinheiro Bravo",
        "Três Corações", "Alvorada", "Santa Cruz", "Recanto Verde", "Vale do Cerrado",
        "Água Clara", "Monte Castelo", "São Francisco", "Santa Helena", "Pioneira",
        "Ouro Branco", "Terra Fértil", "Campo Belo", "Novo Horizonte", "Rancho Grande"
    ]
    owner_names = [
        "Maria Silva de Oliveira", "João Carlos Silveira", "Marcos Vinicius Cordeiro",
        "Helena Maria Guimarães", "Antônio Marcos Ferreira", "Sérgio Murilo Albuquerque",
        "Agrícola Campos Gerais S/A", "Beatriz Fontes Fagundes", "Fernando Barreto Prado",
        "Paulo Rogério Baptistão", "Antônia Lúcia Silveira", "Carlos Eduardo Meneghetti",
        "José Roberto Alencar", "Maurício Ribeiro Vianna", "Luiz Fernando Camargo",
        "Agropecuária Vale do Cerrado Ltda", "Rogério Cândido Rezende", "Juliana Martins Peixoto"
    ]
    doc_templates = [
        "***.482.919-**", "***.109.839-**", "***.219.849-**", "***.391.229-**",
        "***.891.229-**", "**.419.822/0001-**", "**.392.110/0001-**", "***.981.339-**",
        "***.664.129-**", "***.502.779-**", "***.112.989-**", "***.841.009-**",
        "***.734.919-**", "***.789.049-**", "***.440.189-**", "***.324.779-**"
    ]

    demo_farms = []
    prop_counter = 1

    for idx, item in enumerate(brasil_mun_data):
        lat = item["lat"]
        lng = item["lng"]
        mun = item["mun"]
        ibge = item["ibge"]
        uf = item["uf"]
        reg = item.get("reg", "Brasil")

        # Ajuste de escala fundiária: Cerrado/Centro-Oeste/Norte/Matopiba possuem módulos fiscais maiores
        is_large_scale = reg in ["Centro-Oeste", "Matopiba", "Norte"]
        base_area = 850.0 if is_large_scale else 90.0
        area_mult = 2800.0 if is_large_scale else 420.0

        # Propriedade 1: Setor Norte / Leste do município (±0.18° ≈ 20 km)
        f_type1 = "Agropecuária" if is_large_scale and idx % 2 == 0 else farm_types[(idx * 2) % len(farm_types)]
        f_name1 = farm_names[(idx * 3) % len(farm_names)]
        owner1 = owner_names[(idx * 2) % len(owner_names)]
        doc1 = doc_templates[(idx * 2) % len(doc_templates)]
        car1 = f"BR-{uf}-{ibge}-{str(prop_counter).zfill(6)}-A"
        incra1 = f"950.{ibge[2:5]}.{str(prop_counter).zfill(3)}.104-1"
        area1 = round(base_area + (idx * 29.3) % area_mult, 1)

        # BBox com margem ampla cobrindo a malha rural
        lat_min1 = round(lat - 0.03, 4)
        lat_max1 = round(lat + 0.18, 4)
        lon_min1 = round(lng - 0.18, 4)
        lon_max1 = round(lng + 0.18, 4)

        demo_farms.append((
            car1, f"{f_type1} {f_name1}", owner1, incra1, area1, doc1, uf, mun,
            lat_min1, lat_max1, lon_min1, lon_max1
        ))
        prop_counter += 1

        # Propriedade 2: Setor Sul / Oeste do município (±0.18° ≈ 20 km)
        f_type2 = farm_types[(idx * 2 + 1) % len(farm_types)]
        f_name2 = farm_names[(idx * 3 + 1) % len(farm_names)]
        owner2 = owner_names[(idx * 2 + 1) % len(owner_names)]
        doc2 = doc_templates[(idx * 2 + 1) % len(doc_templates)]
        car2 = f"BR-{uf}-{ibge}-{str(prop_counter).zfill(6)}-B"
        incra2 = f"950.{ibge[2:5]}.{str(prop_counter).zfill(3)}.205-8"
        area2 = round(base_area * 0.75 + (idx * 37.1) % area_mult, 1)

        lat_min2 = round(lat - 0.18, 4)
        lat_max2 = round(lat + 0.03, 4)
        lon_min2 = round(lng - 0.18, 4)
        lon_max2 = round(lng + 0.18, 4)

        demo_farms.append((
            car2, f"{f_type2} {f_name2}", owner2, incra2, area2, doc2, uf, mun,
            lat_min2, lat_max2, lon_min2, lon_max2
        ))
        prop_counter += 1

    cursor.executemany("""
        INSERT INTO imoveis_fundiarios (
            cod_car, nome_imovel, proprietario_nome, registro_incra,
            area_ha, documento, uf, municipio, lat_min, lat_max, lon_min, lon_max
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, demo_farms)

    conn.commit()
    cursor.execute("SELECT COUNT(*), COUNT(DISTINCT uf), COUNT(DISTINCT municipio) FROM imoveis_fundiarios;")
    row = cursor.fetchone()
    total_props, total_ufs, total_muns = row[0], row[1], row[2]
    conn.close()

    print(f"[SUCESSO] Base demonstrativa nacional SQLite criada com {total_props} imóveis rurais indexados!")
    print(f"-> Cobertura: {total_ufs} Unidades Federativas (UFs) e {total_muns} polos municipais do Brasil.")
    print(f"Arquivo gerado: {os.path.abspath(db_path)}")


def main():
    parser = argparse.ArgumentParser(
        description="Ingestão de polígonos rurais (CAR/SICAR) e associação SNCR/CNIR para SQLite indexado por Bounding Box."
    )
    parser.add_argument("--shapes", type=str, help="Caminho para arquivo Shapefile (.shp), GeoJSON (.geojson) ou pasta com arquivos")
    parser.add_argument("--sncr", "--csv", type=str, help="Caminho para CSV do SNCR com dados de titulares/proprietários")
    parser.add_argument("--db", type=str, default="data/fundiario_brasil.db", help="Caminho para o banco de dados SQLite (padrão: data/fundiario_brasil.db)")
    parser.add_argument("--create-demo", action="store_true", help="Gera um banco SQLite demonstrativo com fazendas do Paraná para testes imediatos")
    parser.add_argument("--batch-size", type=int, default=5000, help="Tamanho do lote de inserção por transação (padrão: 5000)")
    args = parser.parse_args()

    if args.create_demo:
        create_demo_database(args.db)
        return

    if not args.shapes:
        print("[AVISO] Nenhum arquivo fornecido. Use --create-demo para gerar banco de testes ou especifique --shapes.")
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
