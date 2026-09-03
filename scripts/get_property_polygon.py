#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
EXTRAÇÃO DE GEOMETRIA GEOJSON DO IMÓVEL RURAL (SICAR)
Mestrado PPGTCA 2026 - Pesquisa de Erosão Laminar (Brasil)
=============================================================================
Localiza o polígono oficial no banco SQLite e nos shapefiles em data/sicar_cache/
e retorna um objeto GeoJSON Feature com geometria (Polygon/MultiPolygon) e propriedades.
"""

import sys
import os
import json
import sqlite3
import argparse

try:
    import shapefile
except ImportError:
    shapefile = None

try:
    import shapely.geometry
except ImportError:
    shapely = None


def get_polygon_by_coords_or_car(db_path: str, lat: float = None, lon: float = None, car_code: str = None) -> dict:
    if not os.path.exists(db_path):
        return {}

    conn = sqlite3.connect(db_path, timeout=5.0)
    cursor = conn.cursor()

    row = None
    if car_code:
        cursor.execute("""
            SELECT id, cod_car, nome_imovel, proprietario_nome, registro_incra,
                   area_ha, mod_fiscal, status, condicao, uf, municipio,
                   lat_min, lat_max, lon_min, lon_max, state_zip, shape_index
            FROM imoveis_fundiarios
            WHERE cod_car = ? AND fonte IS NOT NULL
            LIMIT 1;
        """, (car_code,))
        row = cursor.fetchone()

    if not row and lat is not None and lon is not None:
        # Busca no R*Tree
        cursor.execute("""
            SELECT id FROM imoveis_fundiarios_rtree
            WHERE minX <= ? AND maxX >= ? AND minY <= ? AND maxY >= ?
            LIMIT 10;
        """, (lon, lon, lat, lat))
        cand_ids = [r[0] for r in cursor.fetchall()]

        if not cand_ids:
            cursor.execute("""
                SELECT id FROM imoveis_fundiarios_rtree
                WHERE minX <= (? + 0.003) AND maxX >= (? - 0.003)
                  AND minY <= (? + 0.003) AND maxY >= (? - 0.003)
                LIMIT 10;
            """, (lon, lon, lat, lat))
            cand_ids = [r[0] for r in cursor.fetchall()]

        if cand_ids:
            placeholders = ",".join("?" * len(cand_ids))
            cursor.execute(f"""
                SELECT id, cod_car, nome_imovel, proprietario_nome, registro_incra,
                       area_ha, mod_fiscal, status, condicao, uf, municipio,
                       lat_min, lat_max, lon_min, lon_max, state_zip, shape_index
                FROM imoveis_fundiarios
                WHERE id IN ({placeholders}) AND fonte IS NOT NULL;
            """, cand_ids)
            candidates = cursor.fetchall()

            if len(candidates) == 1:
                row = candidates[0]
            elif len(candidates) > 1 and shapely and hasattr(shapely, "geometry"):
                pt = shapely.geometry.Point(lon, lat)
                for c in candidates:
                    uf_c = c[9]
                    s_idx = c[16]
                    shp_path = os.path.join("data", "sicar_cache", f"{uf_c}.shp")
                    if s_idx is not None and os.path.exists(shp_path) and shapefile:
                        try:
                            sf = shapefile.Reader(os.path.join("data", "sicar_cache", uf_c))
                            sh = sf.shape(s_idx)
                            geom = shapely.geometry.shape(sh)
                            if geom.contains(pt):
                                row = c
                                break
                        except Exception:
                            pass
                if not row:
                    candidates.sort(key=lambda c: (abs((c[11] + c[12]) / 2.0 - lat) + abs((c[13] + c[14]) / 2.0 - lon)))
                    row = candidates[0]

    conn.close()

    if not row:
        return {}

    (
        p_id, cod_car, nome_imovel, prop_nome, incra,
        area_ha, mod_fiscal, status, condicao, uf, mun,
        lat_min, lat_max, lon_min, lon_max, state_zip, shape_index
    ) = row

    bbox = [lon_min, lat_min, lon_max, lat_max]

    # Extrai a geometria do shapefile em data/sicar_cache
    geometry = None
    shp_cache = os.path.join("data", "sicar_cache", f"{uf}.shp")
    if shape_index is not None and os.path.exists(shp_cache) and shapefile and shapely and hasattr(shapely, "geometry"):
        try:
            sf = shapefile.Reader(os.path.join("data", "sicar_cache", uf))
            sh = sf.shape(shape_index)
            geom = shapely.geometry.shape(sh)
            geometry = shapely.geometry.mapping(geom)
            if sh.bbox and len(sh.bbox) >= 4:
                bbox = [float(sh.bbox[0]), float(sh.bbox[1]), float(sh.bbox[2]), float(sh.bbox[3])]
        except Exception as e:
            sys.stderr.write(f"Aviso extraindo geometria: {str(e)}\n")

    # Fallback se não conseguiu ler geometria: cria retângulo do bounding box
    if not geometry:
        geometry = {
            "type": "Polygon",
            "coordinates": [[
                [lon_min, lat_min],
                [lon_max, lat_min],
                [lon_max, lat_max],
                [lon_min, lat_max],
                [lon_min, lat_min]
            ]]
        }

    feature = {
        "type": "Feature",
        "id": cod_car,
        "bbox": bbox,
        "properties": {
            "carCode": cod_car,
            "propertyName": nome_imovel,
            "ownerName": prop_nome,
            "municipality": mun,
            "state": uf,
            "areaHa": area_ha,
            "fiscalModules": mod_fiscal,
            "status": status,
            "condition": condicao,
        },
        "geometry": geometry
    }

    return feature


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Retorna o polígono GeoJSON do imóvel rural pelo CAR ou coordenadas.")
    parser.add_argument("--car", type=str, help="Código do CAR")
    parser.add_argument("--lat", type=float, help="Latitude")
    parser.add_argument("--lon", type=float, help="Longitude")
    parser.add_argument("--db", type=str, default="data/fundiario_brasil.db", help="Banco de dados SQLite")
    args = parser.parse_args()

    feat = get_polygon_by_coords_or_car(args.db, lat=args.lat, lon=args.lon, car_code=args.car)
    print(json.dumps(feat, ensure_ascii=False))
