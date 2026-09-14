#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Helper para consulta e amostragem de imóveis reais da base fundiária nacional (SICAR/SNCR).
Retorna GeoJSON FeatureCollection ou JSON estruturado com dados territoriais reais.
"""
import sys
import os
import json
import sqlite3

def query_real_properties(min_lng, min_lat, max_lng, max_lat, limit):
    db_path = os.path.join(os.getcwd(), 'data', 'fundiario_brasil.db')
    if not os.path.exists(db_path):
        print(json.dumps([]))
        return

    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    query = """
      SELECT cod_car, municipio, (lat_min + lat_max) / 2.0 as lat, (lon_min + lon_max) / 2.0 as lng, area_ha
      FROM imoveis_fundiarios
      WHERE lat_min >= ? AND lat_max <= ? AND lon_min >= ? AND lon_max <= ?
      LIMIT ?
    """
    c.execute(query, (min_lat, max_lat, min_lng, max_lng, limit))
    rows = []
    for r in c.fetchall():
        if r[2] is not None and r[3] is not None:
            rows.append({
                'cod_car': r[0],
                'municipio': r[1] or 'Paraná',
                'lat': round(float(r[2]), 6),
                'lng': round(float(r[3]), 6),
                'area_ha': round(float(r[4] or 0), 2)
            })
    conn.close()
    print(json.dumps(rows))

if __name__ == '__main__':
    if len(sys.argv) >= 6:
        min_lng = float(sys.argv[1])
        min_lat = float(sys.argv[2])
        max_lng = float(sys.argv[3])
        max_lat = float(sys.argv[4])
        limit = int(sys.argv[5])
        query_real_properties(min_lng, min_lat, max_lng, max_lat, limit)
    else:
        print(json.dumps([]))
