#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
CRUZAMENTO ESPACIAL OTIMIZADO DE IMÓVEIS RURAIS E TITULARIDADE (CAR/SNCR)
Mestrado PPGTCA 2026 - Pesquisa de Erosão Laminar (Brasil)
=============================================================================
Consulta o banco de dados fundiário SQLite local (data/fundiario_brasil.db)
utilizando filtragem matemática de Bounding Box (lat_min, lat_max, lon_min, lon_max).
Garante latência sub-segundo para todo o território nacional sem estourar a memória RAM.

Saída exclusiva em STDOUT: Objeto JSON único estruturado.
"""

import sqlite3
import json
import sys
import argparse
import os
import glob


def query_property_rtree(conn: sqlite3.Connection, lat: float, lon: float) -> dict:
    """
    Consulta ultraveloz utilizando a Virtual Table R*Tree do SQLite (minX, maxX, minY, maxY)
    e refinamento com Shapely se houver múltiplos candidatos com sobreposição de Bounding Box.
    """
    cursor = conn.cursor()

    # 1. Verifica se a tabela R*Tree existe
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='imoveis_fundiarios_rtree';")
    if not cursor.fetchone():
        return {}

    # 2. Busca estrita no R*Tree
    cursor.execute("""
        SELECT id FROM imoveis_fundiarios_rtree
        WHERE minX <= ? AND maxX >= ? AND minY <= ? AND maxY >= ?
        LIMIT 15;
    """, (lon, lon, lat, lat))
    cand_ids = [r[0] for r in cursor.fetchall()]

    # 2.1 Se não encontrou estrito, tenta uma margem de tolerância (~200m a 500m)
    if not cand_ids:
        cursor.execute("""
            SELECT id FROM imoveis_fundiarios_rtree
            WHERE minX <= (? + 0.003) AND maxX >= (? - 0.003)
              AND minY <= (? + 0.003) AND maxY >= (? - 0.003)
            LIMIT 10;
        """, (lon, lon, lat, lat))
        cand_ids = [r[0] for r in cursor.fetchall()]

    if not cand_ids:
        return {}

    placeholders = ",".join("?" * len(cand_ids))
    cursor.execute(f"""
        SELECT id, cod_car, nome_imovel, proprietario_nome, registro_incra, area_ha,
               documento, uf, municipio, lat_min, lat_max, lon_min, lon_max, state_zip, shape_index
        FROM imoveis_fundiarios
        WHERE id IN ({placeholders});
    """, cand_ids)
    candidates = cursor.fetchall()

    if not candidates:
        return {}

    winner = None

    # Se há apenas 1 candidato, ele é o imóvel
    if len(candidates) == 1:
        winner = candidates[0]
    else:
        # Tenta validação topológica precisa com Shapely se o arquivo shapefile estiver disponível
        pt = None
        try:
            import shapely.geometry
            import shapefile
            pt = shapely.geometry.Point(lon, lat)
        except Exception:
            pass

        if pt:
            readers = {}
            for c in candidates:
                uf = c[7]
                s_idx = c[14]
                shp_cache = os.path.join("data", "sicar_cache", f"{uf}.shp")
                if s_idx is not None and os.path.exists(shp_cache):
                    if uf not in readers:
                        try:
                            readers[uf] = shapefile.Reader(os.path.join("data", "sicar_cache", uf))
                        except Exception:
                            readers[uf] = None
                    sf = readers.get(uf)
                    if sf:
                        try:
                            sh = sf.shape(s_idx)
                            geom = shapely.geometry.shape(sh)
                            if geom.contains(pt):
                                winner = c
                                break
                        except Exception:
                            pass

        # Se nenhum polígono conteve estritamente ou Shapely indisponível, seleciona pelo centroide mais próximo
        if not winner:
            candidates.sort(key=lambda c: (abs((c[9] + c[10]) / 2.0 - lat) + abs((c[11] + c[12]) / 2.0 - lon)))
            winner = candidates[0]

    matched_result = {
        "carCode": winner[1] or None,
        "propertyName": winner[2] or None,
        "ownerName": winner[3] or None,
        "incraRegistry": winner[4] or None,
        "propertyAreaHa": float(winner[5]) if winner[5] is not None else None,
        "ownerDocumentMasked": winner[6] or None,
    }

    # 3. Consulta complementar ao SIGEF/INCRA (se disponível) para obter o detentor e nome real da fazenda
    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='imoveis_sigef_rtree';")
        if cursor.fetchone():
            cursor.execute("""
                SELECT id FROM imoveis_sigef_rtree
                WHERE minX <= ? AND maxX >= ? AND minY <= ? AND maxY >= ?
                LIMIT 5;
            """, (lon, lon, lat, lat))
            sigef_ids = [r[0] for r in cursor.fetchall()]

            if not sigef_ids:
                cursor.execute("""
                    SELECT id FROM imoveis_sigef_rtree
                    WHERE minX <= (? + 0.005) AND maxX >= (? - 0.005)
                      AND minY <= (? + 0.005) AND maxY >= (? - 0.005)
                    LIMIT 5;
                """, (lon, lon, lat, lat))
                sigef_ids = [r[0] for r in cursor.fetchall()]

            if sigef_ids:
                p_sigef = ",".join("?" * len(sigef_ids))
                cursor.execute(f"""
                    SELECT nome_area, codigo_imo, registro_matricula, art_crea, situacao, status, uf, municipio_ibge
                    FROM imoveis_sigef
                    WHERE id IN ({p_sigef})
                    ORDER BY id ASC LIMIT 1;
                """, sigef_ids)
                s_row = cursor.fetchone()
                if s_row:
                    s_nome, s_incra, s_matr, s_art, s_sit, s_st, s_uf, s_mun_ibge = s_row
                    if s_nome:
                        matched_result["propertyName"] = s_nome
                    if s_incra or s_matr:
                        matr_text = f" (Matrícula CRI {s_matr})" if s_matr else ""
                        matched_result["incraRegistry"] = f"SNCR {s_incra}{matr_text}"
                    if s_art:
                        matched_result["ownerName"] = f"Titular Certificado no SIGEF/INCRA (ART {s_art})"

                    # 4. Etapa Alfanumérica (Database Merge) com o cadastro oficial do SNCR / Receita Federal
                    try:
                        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='cadastro_sncr';")
                        if cursor.fetchone():
                            target_cod = (s_incra or "").strip()
                            target_matr = (s_matr or "").strip()
                            target_mun = str(s_mun_ibge or "").strip()

                            sncr_rows = []
                            if target_cod:
                                cursor.execute("""
                                    SELECT titular, condicao_pessoa, denominacao, percentual_detencao
                                    FROM cadastro_sncr
                                    WHERE codigo_imovel = ?
                                    ORDER BY percentual_detencao DESC
                                    LIMIT 3;
                                """, (target_cod,))
                                sncr_rows = cursor.fetchall()

                            if not sncr_rows and target_matr and target_mun:
                                cursor.execute("""
                                    SELECT titular, condicao_pessoa, denominacao, percentual_detencao, codigo_imovel
                                    FROM cadastro_sncr
                                    WHERE municipio_ibge = ? AND denominacao LIKE ?
                                    ORDER BY percentual_detencao DESC
                                    LIMIT 3;
                                """, (target_mun, f"%{target_matr}%"))
                                sncr_rows = cursor.fetchall()

                            if sncr_rows:
                                primary = sncr_rows[0]
                                titular = primary[0]
                                condicao = primary[1]
                                denominacao = primary[2]
                                
                                if len(sncr_rows) > 1:
                                    matched_result["ownerName"] = f"{titular} e outros ({condicao})"
                                else:
                                    matched_result["ownerName"] = f"{titular} ({condicao})" if condicao else titular

                                if denominacao and (not matched_result.get("propertyName") or "Imóvel Rural" in matched_result.get("propertyName", "")):
                                    matched_result["propertyName"] = denominacao

                                if len(primary) > 4 and primary[4]:
                                    matched_result["incraRegistry"] = f"SNCR {primary[4]}" + (f" (Matrícula CRI {target_matr})" if target_matr else "")
                    except Exception as e_sncr:
                        sys.stderr.write(f"Aviso no Database Merge SNCR: {str(e_sncr)}\n")
    except Exception as e:
        sys.stderr.write(f"Aviso na consulta complementar SIGEF: {str(e)}\n")

    return matched_result


def query_property_sqlite(db_path: str, lat: float, lon: float) -> dict:
    """
    Consulta o banco de dados SQLite local utilizando indexação por Bounding Box e R*Tree.
    """
    if not os.path.exists(db_path):
        return {}

    conn = None
    try:
        conn = sqlite3.connect(db_path, timeout=5.0)

        # 1. Tenta consulta R*Tree de alta performance
        try:
            rtree_match = query_property_rtree(conn, lat, lon)
            if rtree_match and any(rtree_match.values()):
                return rtree_match
        except Exception as e:
            sys.stderr.write(f"Aviso RTree fallback: {str(e)}\n")

        cursor = conn.cursor()

        # 2. Consulta estrita por Bounding Box indexada por B-Tree (para bases legadas)
        query_strict = """
            SELECT cod_car, nome_imovel, proprietario_nome, registro_incra, area_ha, documento
            FROM imoveis_fundiarios
            WHERE ? BETWEEN lon_min AND lon_max
              AND ? BETWEEN lat_min AND lat_max
            LIMIT 1;
        """

        cursor.execute(query_strict, (lon, lat))
        row = cursor.fetchone()

        # 3. Tolerância espacial para borda de talhão/perímetro rural (~3 a 5 km) se o ponto cair adjacente
        if not row:
            query_buffered = """
                SELECT cod_car, nome_imovel, proprietario_nome, registro_incra, area_ha, documento
                FROM imoveis_fundiarios
                WHERE ? BETWEEN (lon_min - 0.05) AND (lon_max + 0.05)
                  AND ? BETWEEN (lat_min - 0.05) AND (lat_max + 0.05)
                ORDER BY (abs((lat_min + lat_max) / 2.0 - ?) + abs((lon_min + lon_max) / 2.0 - ?)) ASC
                LIMIT 1;
            """
            cursor.execute(query_buffered, (lon, lat, lat, lon))
            row = cursor.fetchone()

        # 4. Fallback regional para pontos recém-amostrados via satélite no mesmo polo/município (~50 km)
        if not row:
            query_regional = """
                SELECT cod_car, nome_imovel, proprietario_nome, registro_incra, area_ha, documento
                FROM imoveis_fundiarios
                WHERE ? BETWEEN (lon_min - 0.50) AND (lon_max + 0.50)
                  AND ? BETWEEN (lat_min - 0.50) AND (lat_max + 0.50)
                ORDER BY (abs((lat_min + lat_max) / 2.0 - ?) + abs((lon_min + lon_max) / 2.0 - ?)) ASC
                LIMIT 1;
            """
            cursor.execute(query_regional, (lon, lat, lat, lon))
            row = cursor.fetchone()

        if row:
            return {
                "carCode": row[0] or None,
                "propertyName": row[1] or None,
                "ownerName": row[2] or None,
                "incraRegistry": row[3] or None,
                "propertyAreaHa": float(row[4]) if row[4] is not None else None,
                "ownerDocumentMasked": row[5] or None,
            }

    except Exception as e:
        sys.stderr.write(f"Aviso na query SQL SQLite: {str(e)}\n")
    finally:
        if conn:
            conn.close()

    return {}


def query_property_geojson_fallback(shapes_dir: str, lat: float, lon: float) -> dict:
    """
    Tratamento de fallback: caso data/fundiario_brasil.db não exista, tenta
    ler arquivos GeoJSON particionados em data/shapes/*.geojson.
    """
    if not os.path.exists(shapes_dir):
        return {}

    geojson_files = glob.glob(os.path.join(shapes_dir, "*.geojson")) + glob.glob(
        os.path.join(shapes_dir, "*.json")
    )
    if not geojson_files:
        return {}

    try:
        from shapely.geometry import Point, shape  # type: ignore
        pt = Point(lon, lat)
    except Exception:
        pt = None

    for fpath in geojson_files:
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                data = json.load(f)

            features = data.get("features", [])
            for feat in features:
                props = feat.get("properties", {})
                bbox = feat.get("bbox")
                geom_data = feat.get("geometry")

                # Se houver bbox pré-calculado: [min_lon, min_lat, max_lon, max_lat]
                if bbox and len(bbox) >= 4:
                    if not (bbox[0] <= lon <= bbox[2] and bbox[1] <= lat <= bbox[3]):
                        continue

                # Teste topológico preciso se shapely estiver presente
                if pt and geom_data:
                    try:
                        poly = shape(geom_data)
                        if not poly.contains(pt):
                            continue
                    except Exception:
                        pass

                # Mapeamento flexível de propriedades
                car_code = (
                    props.get("cod_car")
                    or props.get("carCode")
                    or props.get("COD_IMOVEL")
                    or props.get("num_car")
                )
                prop_name = (
                    props.get("nome_imovel")
                    or props.get("propertyName")
                    or props.get("NOM_IMOVEL")
                    or props.get("imovel")
                )
                owner_name = (
                    props.get("proprietario_nome")
                    or props.get("ownerName")
                    or props.get("PROPRIETARIO")
                    or props.get("titular")
                )
                incra_reg = (
                    props.get("registro_incra")
                    or props.get("incraRegistry")
                    or props.get("NUM_INCRA")
                    or props.get("incra")
                )
                area_ha = (
                    props.get("area_ha")
                    or props.get("propertyAreaHa")
                    or props.get("NUM_AREA")
                    or props.get("area")
                )
                doc = (
                    props.get("documento")
                    or props.get("ownerDocumentMasked")
                    or props.get("CPF_CNPJ")
                )

                if car_code or prop_name or owner_name:
                    return {
                        "carCode": car_code or None,
                        "propertyName": prop_name or None,
                        "ownerName": owner_name or None,
                        "incraRegistry": incra_reg or None,
                        "propertyAreaHa": float(area_ha) if area_ha is not None else None,
                        "ownerDocumentMasked": doc or None,
                    }
        except Exception as e:
            sys.stderr.write(f"Aviso lendo fallback GeoJSON {fpath}: {str(e)}\n")
            continue

    return {}


def query_property(db_path: str, lat: float, lon: float) -> dict:
    """
    Roteador de busca: tenta primeiramente o banco SQLite com índice B-Tree BBox;
    se inexistente ou vazio, recorre ao diretório de fallback GeoJSON.
    """
    result = query_property_sqlite(db_path, lat, lon)
    if result:
        return result

    # Fallback: pasta data/shapes relativa ao diretório do projeto ou do db
    db_dir = os.path.dirname(os.path.abspath(db_path))
    shapes_dir = os.path.join(db_dir, "shapes")
    if not os.path.exists(shapes_dir):
        # Tenta data/shapes relativo ao cwd
        shapes_dir = os.path.join("data", "shapes")

    fallback_result = query_property_geojson_fallback(shapes_dir, lat, lon)
    return fallback_result or {}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Match spatial coordinates to properties and owners across Brazil."
    )
    parser.add_argument("--lat", type=float, required=True, help="Latitude of the query point")
    parser.add_argument("--lon", type=float, required=True, help="Longitude of the query point")
    parser.add_argument(
        "--db",
        type=str,
        default="data/fundiario_brasil.db",
        help="Path to SQLite database (default: data/fundiario_brasil.db)",
    )
    args = parser.parse_args()

    try:
        match = query_property(args.db, args.lat, args.lon)
    except Exception as e:
        sys.stderr.write(f"Erro no processador de cruzamento espacial: {str(e)}\n")
        match = {}

    print(json.dumps(match, ensure_ascii=False))
