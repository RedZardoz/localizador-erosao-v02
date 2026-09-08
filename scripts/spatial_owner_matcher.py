#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
CRUZAMENTO ESPACIAL OTIMIZADO DE IMÓVEIS RURAIS E TITULARIDADE (CAR/SNCR)
Mestrado PPGTCA 2026 - Pesquisa de Erosão Laminar (Brasil)
=============================================================================
Consulta a base fundiária oficial SQLite local (data/fundiario_brasil.db).
Regras de integridade pericial:
1. Filtro estrito: somente registros oficiais com 'fonte IS NOT NULL'.
2. Detecção de cobertura territorial: informa explicitamente quando a UF
   não estiver presente na base local, sem fabricar aproximações.
3. Titularidade estrita: apenas o nome publicado pelo SNCR/INCRA é exibido,
   mantendo a máscara original intacta (LGPD art. 7º, IV).
4. Denominação estrita: nome real da área (SIGEF/SNCR) ou ausente.

Saída exclusiva em STDOUT: Objeto JSON único estruturado.
"""

import sqlite3
import json
import sys
import argparse
import os
from datetime import datetime

# Garante I/O em UTF-8 mesmo em consoles Windows cp1252
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stdin, "reconfigure"):
    sys.stdin.reconfigure(encoding="utf-8")


# Import defensivo de bibliotecas geoespaciais
try:
    import shapefile
except ImportError:
    shapefile = None

try:
    import shapely.geometry
except ImportError:
    shapely = None

UF_BBOXES = {
    "AC": (-11.15, -73.99, -7.11, -66.62),
    "AL": (-10.50, -38.24, -8.81, -35.15),
    "AM": (-9.82, -73.80, 2.25, -56.10),
    "AP": (-1.24, -54.88, 4.44, -49.87),
    "BA": (-18.35, -46.62, -8.53, -37.34),
    "CE": (-7.86, -41.42, -2.78, -37.25),
    "DF": (-16.05, -48.29, -15.50, -47.31),
    "ES": (-21.31, -41.88, -17.89, -39.66),
    "GO": (-19.50, -53.25, -12.39, -45.91),
    "MA": (-10.26, -48.76, -1.04, -41.79),
    "MG": (-22.92, -51.05, -14.23, -39.86),
    "MS": (-24.07, -58.17, -17.17, -50.92),
    "MT": (-18.04, -61.63, -7.35, -50.22),
    "PA": (-9.84, -58.90, 2.59, -46.06),
    "PB": (-8.30, -38.77, -6.02, -34.79),
    "PE": (-9.48, -41.36, -7.15, -34.79),
    "PI": (-10.93, -45.99, -2.75, -40.37),
    "PR": (-26.72, -54.62, -22.52, -48.02),
    "RJ": (-23.37, -44.89, -20.76, -40.96),
    "RN": (-6.98, -38.58, -4.83, -34.97),
    "RO": (-13.69, -66.62, -7.97, -59.77),
    "RR": (-1.58, -64.83, 5.27, -58.89),
    "RS": (-33.75, -57.65, -27.08, -49.69),
    "SC": (-29.36, -53.84, -25.96, -48.36),
    "SE": (-11.57, -38.25, -9.51, -36.39),
    "SP": (-25.31, -53.11, -19.78, -44.16),
    "TO": (-13.47, -50.74, -5.17, -45.69),
}


def detectar_uf(lat: float, lon: float, uf_hint: str = None) -> str:
    if uf_hint and uf_hint.strip().upper() in UF_BBOXES:
        return uf_hint.strip().upper()
    for uf, (min_lat, min_lon, max_lat, max_lon) in UF_BBOXES.items():
        if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
            return uf
    return None


def ufs_com_cobertura(conn: sqlite3.Connection) -> set:
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT uf FROM imoveis_fundiarios WHERE fonte IS NOT NULL AND uf IS NOT NULL;")
        return {r[0].upper() for r in cursor.fetchall() if r[0]}
    except Exception:
        return set()


def carregar_fontes_dados(conn: sqlite3.Connection, uf: str) -> dict:
    info = {
        "sicarArquivoOrigem": None,
        "sicarDataBase": None,
        "sigefArquivoOrigem": None,
        "sigefDataBase": None,
        "sncrArquivoOrigem": None,
        "sncrDataBase": None,
    }
    if not uf:
        return info
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT sistema, arquivo_origem, data_base
            FROM fontes_dados
            WHERE uf = ?;
        """, (uf.upper(),))
        for base, arq, dt in cursor.fetchall():
            b = (base or "").upper()
            if b == "SICAR":
                info["sicarArquivoOrigem"] = arq
                info["sicarDataBase"] = dt
            elif b == "SIGEF":
                info["sigefArquivoOrigem"] = arq
                info["sigefDataBase"] = dt
            elif b == "SNCR":
                info["sncrArquivoOrigem"] = arq
                info["sncrDataBase"] = dt
    except Exception:
        pass
    return info


# Cache global de leitores de Shapefile para reaproveitamento em lote sem reabrir arquivos
GLOBAL_SHP_READERS = {}
TABLE_EXISTENCE_CACHE = {}


def table_exists(conn: sqlite3.Connection, table_name: str) -> bool:
    if table_name not in TABLE_EXISTENCE_CACHE:
        try:
            cur = conn.cursor()
            cur.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?;", (table_name,))
            TABLE_EXISTENCE_CACHE[table_name] = bool(cur.fetchone())
        except Exception:
            return False
    return TABLE_EXISTENCE_CACHE[table_name]


def get_shapefile_reader(uf: str):
    if not uf or not shapefile:
        return None
    uf_upper = uf.upper()
    if uf_upper not in GLOBAL_SHP_READERS:
        shp_cache = os.path.join("data", "sicar_cache", f"{uf_upper}.shp")
        if os.path.exists(shp_cache):
            try:
                # Passa explicitamente o arquivo .shp para evitar que o pyshp abra o .dbf de 1.45 GB
                GLOBAL_SHP_READERS[uf_upper] = shapefile.Reader(shp_cache)
            except Exception:
                GLOBAL_SHP_READERS[uf_upper] = None
        else:
            GLOBAL_SHP_READERS[uf_upper] = None
    return GLOBAL_SHP_READERS.get(uf_upper)


def query_property_rtree(conn: sqlite3.Connection, lat: float, lon: float, uf_detectada: str = None) -> dict:
    """
    Consulta utilizando a Virtual Table R*Tree do SQLite (minX, maxX, minY, maxY)
    com validação topológica precisa via Shapely e verificação estrita de fonte oficial.
    """
    cursor = conn.cursor()

    if not table_exists(conn, "imoveis_fundiarios_rtree"):
        return {}

    is_approximate = False

    # 1. Busca estrita no R*Tree
    cursor.execute("""
        SELECT id FROM imoveis_fundiarios_rtree
        WHERE minX <= ? AND maxX >= ? AND minY <= ? AND maxY >= ?
        LIMIT 15;
    """, (lon, lon, lat, lat))
    cand_ids = [r[0] for r in cursor.fetchall()]

    # 2. Se não encontrou estrito, tenta margem de tolerância (~300m)
    if not cand_ids:
        cursor.execute("""
            SELECT id FROM imoveis_fundiarios_rtree
            WHERE minX <= (? + 0.003) AND maxX >= (? - 0.003)
              AND minY <= (? + 0.003) AND maxY >= (? - 0.003)
            LIMIT 10;
        """, (lon, lon, lat, lat))
        cand_ids = [r[0] for r in cursor.fetchall()]
        if cand_ids:
            is_approximate = True

    if not cand_ids:
        return {}

    placeholders = ",".join("?" * len(cand_ids))
    cursor.execute(f"""
        SELECT id, cod_car, nome_imovel, proprietario_nome, registro_incra, area_ha,
               documento, uf, municipio, lat_min, lat_max, lon_min, lon_max, state_zip, shape_index
        FROM imoveis_fundiarios
        WHERE id IN ({placeholders}) AND fonte IS NOT NULL;
    """, cand_ids)
    candidates = cursor.fetchall()

    if not candidates:
        return {}

    winner = None
    contained_strictly = False

    pt = None
    if shapely and hasattr(shapely, "geometry"):
        try:
            pt = shapely.geometry.Point(lon, lat)
        except Exception:
            pt = None

    if pt and shapefile:
        for c in candidates:
            c_uf = c[7]
            s_idx = c[14]
            if s_idx is not None:
                sf = get_shapefile_reader(c_uf)
                if sf:
                    try:
                        sh = sf.shape(s_idx)
                        geom = shapely.geometry.shape(sh)
                        if geom.contains(pt):
                            winner = c
                            contained_strictly = True
                            break
                    except Exception:
                        pass

    if not winner:
        if len(candidates) == 1 and not is_approximate:
            winner = candidates[0]
            contained_strictly = False
        else:
            candidates.sort(key=lambda c: (abs((c[9] + c[10]) / 2.0 - lat) + abs((c[11] + c[12]) / 2.0 - lon)))
            winner = candidates[0]
            contained_strictly = False

    status = "encontrado" if contained_strictly else "aproximado"

    matched_result = {
        "status": status,
        "carCode": winner[1] or None,
        "propertyName": None,  # Nunca inventar denominação
        "ownerName": None,     # Apenas titular com máscara do SNCR
        "incraRegistry": winner[4] or None,
        "propertyAreaHa": float(winner[5]) if winner[5] is not None else None,
        "ownerDocumentMasked": None,
        "uf": winner[7] or uf_detectada,
        "municipio": winner[8] or None,
    }

    # 3. Consulta complementar ao SIGEF/INCRA (se disponível) para obter nome real da área
    try:
        if table_exists(conn, "imoveis_sigef_rtree"):
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
                    if s_nome and s_nome.strip():
                        matched_result["propertyName"] = s_nome.strip()
                    if s_incra or s_matr:
                        matr_text = f" (Matrícula CRI {s_matr})" if s_matr else ""
                        matched_result["incraRegistry"] = f"SNCR {s_incra}{matr_text}"
                    # NUNCA atribuir ownerName a partir de s_art (Regra 1-B.7)

                    # 4. Etapa Alfanumérica (Database Merge) com o cadastro oficial do SNCR
                    try:
                        if table_exists(conn, "cadastro_sncr"):
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

                                # A máscara do SNCR é mantida byte a byte (LGPD)
                                if titular and titular.strip():
                                    t_clean = titular.strip()
                                    if len(sncr_rows) > 1:
                                        matched_result["ownerName"] = f"{t_clean} e outros"
                                    else:
                                        matched_result["ownerName"] = t_clean

                                if denominacao and denominacao.strip() and not matched_result.get("propertyName"):
                                    matched_result["propertyName"] = denominacao.strip()

                                if len(primary) > 4 and primary[4]:
                                    matched_result["incraRegistry"] = f"SNCR {primary[4]}" + (f" (Matrícula CRI {target_matr})" if target_matr else "")
                    except Exception as e_sncr:
                        sys.stderr.write(f"Aviso no Database Merge SNCR: {str(e_sncr)}\n")
    except Exception as e:
        sys.stderr.write(f"Aviso na consulta complementar SIGEF: {str(e)}\n")

    return matched_result


def query_property_with_conn(conn: sqlite3.Connection, cobertas: set, fontes_cache: dict, lat: float, lon: float, uf_hint: str = None) -> dict:
    """
    Executa a consulta fundiária para um único ponto reutilizando a conexão e cache de fontes.
    """
    uf_detectada = detectar_uf(lat, lon, uf_hint)

    # Se detectou a UF e ela NÃO tem cobertura ingerida
    if uf_detectada and uf_detectada not in cobertas:
        if uf_detectada not in fontes_cache:
            fontes_cache[uf_detectada] = carregar_fontes_dados(conn, uf_detectada)
        fontes_info = dict(fontes_cache[uf_detectada])
        res = {
            "status": "base-nao-disponivel",
            "uf": uf_detectada,
            "mensagem": f"Base fundiária não disponível para {uf_detectada}. A base SQLite local contém apenas imóveis de {', '.join(sorted(cobertas))}. Para consultar esta UF, ingira a base oficial do SICAR/SNCR via ingest_data.py.",
            "dataConsulta": datetime.now().strftime("%d/%m/%Y"),
            "criterioAssociacao": "Base territorial não carregada",
        }
        res.update(fontes_info)
        return res

    res = query_property_rtree(conn, lat, lon, uf_detectada)
    target_uf = (res.get("uf") if res else None) or uf_detectada

    if not res or not res.get("carCode"):
        # Coordenada em UF com base presente, mas sem imóvel sobreposto
        if target_uf and target_uf not in fontes_cache:
            fontes_cache[target_uf] = carregar_fontes_dados(conn, target_uf)
        fontes_info = dict(fontes_cache.get(target_uf, {}))
        no_match = {
            "status": "sem-correspondencia",
            "uf": target_uf,
            "mensagem": "Nenhum imóvel rural cadastrado nas bases oficiais sobrepõe esta coordenada.",
            "dataConsulta": datetime.now().strftime("%d/%m/%Y"),
            "criterioAssociacao": "Nenhum perímetro compatível na base consultada",
        }
        no_match.update(fontes_info)
        return no_match

    # Imóvel encontrado ou aproximado
    if target_uf and target_uf not in fontes_cache:
        fontes_cache[target_uf] = carregar_fontes_dados(conn, target_uf)
    fontes_info = dict(fontes_cache.get(target_uf, {}))
    res.update(fontes_info)
    res["dataConsulta"] = datetime.now().strftime("%d/%m/%Y")
    res["criterioAssociacao"] = (
        "Contenção topológica estrita via polígono vetorial (Shapely)"
        if res.get("status") == "encontrado"
        else "Interseção de Bounding Box / centroide com tolerância"
    )
    return res


def query_property(db_path: str, lat: float, lon: float, uf_hint: str = None) -> dict:
    """
    Roteador de busca cadastral fundiária para ponto único.
    """
    uf_detectada = detectar_uf(lat, lon, uf_hint)

    if not os.path.exists(db_path):
        return {
            "status": "base-nao-disponivel",
            "uf": uf_detectada,
            "mensagem": f"Base fundiária SQLite não encontrada em {db_path}.",
            "dataConsulta": datetime.now().strftime("%d/%m/%Y"),
            "criterioAssociacao": "Base territorial não carregada",
        }

    conn = None
    try:
        conn = sqlite3.connect(db_path, timeout=5.0)
        cobertas = ufs_com_cobertura(conn)
        fontes_cache = {}
        return query_property_with_conn(conn, cobertas, fontes_cache, lat, lon, uf_hint)
    except Exception as e:
        sys.stderr.write(f"Erro na consulta fundiária: {str(e)}\n")
        return {
            "status": "sem-correspondencia",
            "uf": uf_detectada,
            "mensagem": f"Erro interno ao consultar base fundiária: {str(e)}",
            "dataConsulta": datetime.now().strftime("%d/%m/%Y"),
            "criterioAssociacao": "Erro na execução da consulta",
        }
    finally:
        if conn:
            conn.close()


def query_properties_batch(db_path: str, items: list) -> dict:
    """
    Executa a busca cadastral fundiária para uma lista de pontos em lote.
    items: list of dict com [{"id": "...", "lat": float, "lon": float, "uf": str?}, ...]
    Retorna: dict { item_id: match_result }
    """
    if not os.path.exists(db_path):
        return {
            it["id"]: {
                "status": "base-nao-disponivel",
                "uf": it.get("uf"),
                "mensagem": f"Base fundiária SQLite não encontrada em {db_path}.",
                "dataConsulta": datetime.now().strftime("%d/%m/%Y"),
                "criterioAssociacao": "Base territorial não carregada",
            }
            for it in items if "id" in it
        }

    results = {}
    conn = None
    try:
        conn = sqlite3.connect(db_path, timeout=10.0)
        cobertas = ufs_com_cobertura(conn)
        fontes_cache = {}

        for it in items:
            item_id = it.get("id")
            if not item_id:
                continue
            lat = it.get("lat") or it.get("latitude")
            lon = it.get("lon") or it.get("longitude")
            uf = it.get("uf")
            if lat is None or lon is None:
                results[item_id] = {
                    "status": "sem-correspondencia",
                    "mensagem": "Coordenadas ausentes ou inválidas.",
                }
                continue

            try:
                match = query_property_with_conn(conn, cobertas, fontes_cache, float(lat), float(lon), uf)
                results[item_id] = match
            except Exception as item_err:
                results[item_id] = {
                    "status": "sem-correspondencia",
                    "mensagem": f"Erro ao processar coordenada: {str(item_err)}",
                }

        return results
    except Exception as e:
        sys.stderr.write(f"Erro no processamento em lote da base fundiária: {str(e)}\n")
        return {
            it["id"]: {
                "status": "sem-correspondencia",
                "mensagem": f"Erro no processamento em lote: {str(e)}",
            }
            for it in items if "id" in it
        }
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Match spatial coordinates to official properties and owners across Brazil."
    )
    parser.add_argument("--lat", type=float, default=None, help="Latitude of the query point")
    parser.add_argument("--lon", type=float, default=None, help="Longitude of the query point")
    parser.add_argument("--uf", type=str, default=None, help="Optional UF hint (2 letters)")
    parser.add_argument("--batch", action="store_true", help="Run in batch mode reading JSON from stdin")
    parser.add_argument("--input", type=str, default=None, help="Path to input JSON file for batch mode")
    parser.add_argument(
        "--db",
        type=str,
        default="data/fundiario_brasil.db",
        help="Path to SQLite database (default: data/fundiario_brasil.db)",
    )
    args = parser.parse_args()

    if args.batch:
        try:
            if args.input:
                with open(args.input, "r", encoding="utf-8") as f:
                    batch_data = json.load(f)
            else:
                batch_data = json.load(sys.stdin)

            results = query_properties_batch(args.db, batch_data)
            print(json.dumps(results, ensure_ascii=False))
        except Exception as e:
            sys.stderr.write(f"Erro no modo lote: {str(e)}\n")
            print(json.dumps({"error": str(e)}, ensure_ascii=False))
    else:
        if args.lat is None or args.lon is None:
            sys.stderr.write("Parâmetros --lat e --lon são obrigatórios quando não executado com --batch.\n")
            sys.exit(1)

        try:
            match = query_property(args.db, args.lat, args.lon, args.uf)
        except Exception as e:
            sys.stderr.write(f"Erro no processador de cruzamento espacial: {str(e)}\n")
            match = {
                "status": "sem-correspondencia",
                "mensagem": f"Erro interno: {str(e)}",
            }

        print(json.dumps(match, ensure_ascii=False))
