#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
INGESTÃO DOS DADOS OFICIAIS DO SICAR (BRASIL - 27 UFs) COM INDEXAÇÃO R*TREE
Mestrado PPGTCA 2026 - Pesquisa de Erosão Laminar (Brasil)
=============================================================================
Lê os arquivos oficiais AREA_IMOVEL_*.zip do SICAR (Ministério do Meio Ambiente),
extrai os limites geográficos (Bounding Box) e atributos cadastrais e popula o
banco SQLite local (data/fundiario_brasil.db) com índice espacial R*Tree para buscas
sub-milissegundo em imóveis rurais de qualquer UF brasileira.
Gera também o cache geométrico vetorial em data/sicar_cache/{UF}.* para cruzamentos topológicos.
"""

import zipfile
import io
import os
import sys
import time
import re
import shutil
import sqlite3
import shapefile

ALL_UFS = {
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
}


def init_db(db_path: str) -> sqlite3.Connection:
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA synchronous = OFF;")
    conn.execute("PRAGMA journal_mode = WAL;")

    conn.execute("""
        CREATE TABLE IF NOT EXISTS imoveis_fundiarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cod_car TEXT NOT NULL,
            nome_imovel TEXT,
            proprietario_nome TEXT,
            registro_incra TEXT,
            area_ha REAL,
            mod_fiscal REAL,
            status TEXT,
            condicao TEXT,
            tipo TEXT,
            documento TEXT,
            uf TEXT,
            municipio TEXT,
            lat_min REAL NOT NULL,
            lat_max REAL NOT NULL,
            lon_min REAL NOT NULL,
            lon_max REAL NOT NULL,
            fonte TEXT,
            state_zip TEXT,
            shape_index INTEGER
        );
    """)

    # Virtual Table R*Tree para indexação espacial ultraveloz
    conn.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS imoveis_fundiarios_rtree USING rtree(
            id,
            minX, maxX,
            minY, maxY
        );
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS fontes_dados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            orgao TEXT NOT NULL,
            sistema TEXT NOT NULL,
            uf TEXT NOT NULL,
            arquivo_origem TEXT,
            data_base TEXT,
            data_download TEXT NOT NULL,
            total_registros INTEGER,
            criterio_associacao TEXT,
            observacoes TEXT
        );
    """)

    # Adiciona colunas se a tabela já existia sem elas
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(imoveis_fundiarios);")
    existing_cols = {row[1] for row in cursor.fetchall()}
    for col_name, col_type in [
        ("mod_fiscal", "REAL"),
        ("status", "TEXT"),
        ("condicao", "TEXT"),
        ("tipo", "TEXT"),
        ("fonte", "TEXT"),
        ("state_zip", "TEXT"),
        ("shape_index", "INTEGER"),
    ]:
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE imoveis_fundiarios ADD COLUMN {col_name} {col_type};")

    conn.execute("CREATE INDEX IF NOT EXISTS idx_fundiario_cod_car ON imoveis_fundiarios(cod_car);")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_fundiario_uf ON imoveis_fundiarios(uf);")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_fundiario_mun ON imoveis_fundiarios(municipio);")

    conn.commit()
    return conn


def ingest_zip(conn: sqlite3.Connection, zip_path: str, uf_expected: str, batch_size: int = 10000):
    if not os.path.exists(zip_path):
        print(f"[PULADO] Arquivo não encontrado: {zip_path}")
        return 0

    print("\n========================================================")
    print(f"-> Processando base oficial SICAR ({uf_expected}): {os.path.basename(zip_path)}")
    print("========================================================")

    # Extrai para cache de geometrias rápidas data/sicar_cache/{UF}.* (A-7.4)
    cache_dir = os.path.join("data", "sicar_cache")
    os.makedirs(cache_dir, exist_ok=True)
    cache_shp = os.path.join(cache_dir, f"{uf_expected}.shp")

    with zipfile.ZipFile(zip_path) as z:
        if not os.path.exists(cache_shp):
            total_uncompressed = sum(zinfo.file_size for zinfo in z.infolist())
            try:
                stat = shutil.disk_usage(cache_dir)
                if stat.free < total_uncompressed * 1.2:
                    print(f"[AVISO] Espaço em disco insuficiente para cache SICAR de {uf_expected} (requer {total_uncompressed/(1024**2):.1f}MB, livre: {stat.free/(1024**2):.1f}MB). Pulando extração de cache.")
                else:
                    print(f"Extraindo camadas vetoriais para cache local SICAR ({uf_expected})...")
                    for ext in ['shp', 'shx', 'dbf', 'prj']:
                        try:
                            n = next(x for x in z.namelist() if x.lower().endswith('.' + ext))
                            with open(os.path.join(cache_dir, f"{uf_expected}.{ext}"), 'wb') as f:
                                f.write(z.read(n))
                        except Exception:
                            pass
            except Exception as e:
                print(f"[AVISO] Falha ao extrair cache SICAR: {e}")

        t0 = time.time()
        shp_name = next((n for n in z.namelist() if n.lower().endswith('.shp')), None)
        dbf_name = next((n for n in z.namelist() if n.lower().endswith('.dbf')), None)
        shx_name = next((n for n in z.namelist() if n.lower().endswith('.shx')), None)

        if not shp_name or not dbf_name:
            print(f"[ERRO] Formato inválido no zip: {zip_path}")
            return 0

        shp_io = io.BytesIO(z.read(shp_name))
        dbf_io = io.BytesIO(z.read(dbf_name))
        shx_io = io.BytesIO(z.read(shx_name)) if shx_name else None

        sf = shapefile.Reader(shp=shp_io, dbf=dbf_io, shx=shx_io)
        total_shapes = len(sf)
        print(f"Total de imóveis rurais no arquivo: {total_shapes:,}")

        # Validação cruzada prévia da primeira feição contra cod_estado do DBF
        if total_shapes > 0:
            first_rec = sf.record(0).as_dict()
            first_uf = (first_rec.get('cod_estado') or '').strip().upper()
            if first_uf and first_uf != uf_expected:
                raise ValueError(
                    f"Divergência cadastral crítica: arquivo {os.path.basename(zip_path)} esperado para '{uf_expected}', "
                    f"mas o DBF contém cod_estado '{first_uf}'. Abortando ingestão da UF."
                )

        # Remove dados anteriores desta UF para substituição limpa
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM imoveis_fundiarios WHERE uf = ?", (uf_expected,))
        old_ids = [r[0] for r in cursor.fetchall()]
        if old_ids:
            print(f"Removendo {len(old_ids):,} registros antigos da UF {uf_expected}...")
            cursor.execute("DELETE FROM imoveis_fundiarios WHERE uf = ?", (uf_expected,))
            # Remove do R*Tree
            cursor.executemany("DELETE FROM imoveis_fundiarios_rtree WHERE id = ?", [(oid,) for oid in old_ids])
            conn.commit()

        # Obter próximo ID autoincremental
        cursor.execute("SELECT coalesce(max(id), 0) FROM imoveis_fundiarios")
        curr_id = cursor.fetchone()[0]

        rel_zip_path = os.path.relpath(zip_path).replace("\\", "/")
        prop_batch = []
        rtree_batch = []
        inserted_count = 0

        for i in range(total_shapes):
            curr_id += 1
            sh = sf.shape(i)
            rec = sf.record(i).as_dict()

            xmin, ymin, xmax, ymax = sh.bbox
            car = rec['cod_imovel']
            mun = rec.get('municipio') or None
            uf_row = (rec.get('cod_estado') or uf_expected).strip().upper()

            if uf_row != uf_expected:
                raise ValueError(
                    f"Divergência cadastral no registro {i} de {os.path.basename(zip_path)}: "
                    f"cod_estado '{uf_row}' diverge do esperado '{uf_expected}'."
                )

            area = float(rec.get('num_area') or 0.0)
            mod = float(rec.get('mod_fiscal') or 0.0)
            st = rec.get('ind_status', 'AT') or 'AT'
            cond = rec.get('des_condic', 'Cadastrado') or 'Cadastrado'
            tipo = rec.get('ind_tipo', 'IRU') or 'IRU'

            status_map = {
                'AT': 'Ativo',
                'PE': 'Pendente',
                'SU': 'Suspenso',
                'CA': 'Cancelado'
            }
            status_desc = status_map.get(st, st)

            nome_imovel = f"Imóvel Rural em {mun} ({uf_expected})" if mun else f"Imóvel Rural ({uf_expected})"
            proprietario = "Titular Declarado no CAR (SICAR/MMA)"
            doc = "***.***.***-** (Protegido por Sigilo Fiscal/LGPD)"
            incra = f"SICAR-{uf_expected} ({car.split('-')[1] if '-' in car else car[:8]})"
            fonte = "SICAR Oficial (MMA/SFB)"

            prop_batch.append((
                curr_id, car, nome_imovel, proprietario, incra,
                area, mod, status_desc, cond, tipo, doc,
                uf_expected, mun, ymin, ymax, xmin, xmax, fonte,
                rel_zip_path, i
            ))

            rtree_batch.append((curr_id, xmin, xmax, ymin, ymax))

            if len(prop_batch) >= batch_size:
                cursor.executemany("""
                    INSERT INTO imoveis_fundiarios (
                        id, cod_car, nome_imovel, proprietario_nome, registro_incra,
                        area_ha, mod_fiscal, status, condicao, tipo, documento,
                        uf, municipio, lat_min, lat_max, lon_min, lon_max, fonte,
                        state_zip, shape_index
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);
                """, prop_batch)

                cursor.executemany("""
                    INSERT INTO imoveis_fundiarios_rtree (id, minX, maxX, minY, maxY)
                    VALUES (?, ?, ?, ?, ?);
                """, rtree_batch)

                conn.commit()
                inserted_count += len(prop_batch)
                prop_batch.clear()
                rtree_batch.clear()
                sys.stdout.write(f"\rProgresso: {inserted_count:,} / {total_shapes:,} imóveis ({inserted_count*100//total_shapes}%)")
                sys.stdout.flush()

        if prop_batch:
            cursor.executemany("""
                INSERT INTO imoveis_fundiarios (
                    id, cod_car, nome_imovel, proprietario_nome, registro_incra,
                    area_ha, mod_fiscal, status, condicao, tipo, documento,
                    uf, municipio, lat_min, lat_max, lon_min, lon_max, fonte,
                    state_zip, shape_index
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);
            """, prop_batch)

            cursor.executemany("""
                INSERT INTO imoveis_fundiarios_rtree (id, minX, maxX, minY, maxY)
                VALUES (?, ?, ?, ?, ?);
            """, rtree_batch)

            conn.commit()
            inserted_count += len(prop_batch)

        # Atualiza tabela de metadados oficiais com contagem real
        hoje = time.strftime("%Y-%m-%d")
        cursor.execute("SELECT COUNT(*) FROM imoveis_fundiarios WHERE uf = ?;", (uf_expected,))
        real_count = cursor.fetchone()[0]

        cursor.execute("DELETE FROM fontes_dados WHERE sistema = 'SICAR' AND uf = ?;", (uf_expected,))
        cursor.execute("""
            INSERT INTO fontes_dados (
                orgao, sistema, uf, arquivo_origem, data_base, data_download, total_registros, criterio_associacao, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, ("MMA/SFB", "SICAR", uf_expected, os.path.basename(zip_path), None, hoje, real_count, None, None))
        conn.commit()

        print(f"\r[SUCESSO] {inserted_count:,} imóveis de {uf_expected} indexados em {time.time() - t0:.1f}s!")
        return inserted_count


def discover_sicar_zips(sicar_dir: str = "Dados SICAR") -> list[tuple[str, str]]:
    """
    Descobre dinamicamente arquivos AREA_IMOVEL_{UF}.zip para todas as 27 UFs.
    Retorna lista de tuplas (UF, caminho_completo).
    """
    if not os.path.exists(sicar_dir):
        return []

    found_states = []
    for fname in sorted(os.listdir(sicar_dir)):
        if not fname.lower().endswith(".zip"):
            continue
        m = re.search(r"([A-Z]{2})\.zip$", fname, re.IGNORECASE)
        if m:
            uf = m.group(1).upper()
            if uf in ALL_UFS:
                found_states.append((uf, os.path.join(sicar_dir, fname)))
            else:
                print(f"[AVISO] Arquivo '{fname}' ignorado: '{uf}' não é uma UF válida.")
        else:
            print(f"[AVISO] Arquivo '{fname}' ignorado: nome não segue o padrão AREA_IMOVEL_{{UF}}.zip.")

    return found_states


def main():
    db_path = "data/fundiario_brasil.db"
    sicar_dir = "Dados SICAR"

    print("=============================================================================")
    print("INICIANDO INGESTÃO DOS SHAPEFILES OFICIAIS DO SICAR (BRASIL - 27 UFs)")
    print("=============================================================================")

    if not os.path.exists(sicar_dir):
        print(f"[ERRO] Diretório '{sicar_dir}' não encontrado.")
        return

    found_states = discover_sicar_zips(sicar_dir)
    if not found_states:
        print(f"[AVISO] Nenhum arquivo AREA_IMOVEL_{{UF}}.zip válido encontrado em '{sicar_dir}'.")
        return

    print(f"UFs identificadas para ingestão: {', '.join(uf for uf, _ in found_states)}")

    conn = init_db(db_path)

    total_all = 0
    for uf, fpath in found_states:
        total_all += ingest_zip(conn, fpath, uf)

    # Otimização final do banco
    print("\nOtimizando índices e estatísticas do SQLite (PRAGMA optimize)...")
    conn.execute("PRAGMA optimize;")
    conn.commit()

    cursor = conn.cursor()
    cursor.execute("SELECT count(*), count(distinct uf), count(distinct municipio) FROM imoveis_fundiarios;")
    total_db, total_ufs, total_muns = cursor.fetchone()
    conn.close()

    print("\n=============================================================================")
    print(f"CARGA SICAR CONCLUÍDA COM SUCESSO!")
    print(f"Total de imóveis indexados no banco: {total_db:,}")
    print(f"Estados cobertos: {total_ufs} | Polos municipais: {total_muns:,}")
    print(f"Banco de dados: {os.path.abspath(db_path)}")
    print("=============================================================================")


if __name__ == "__main__":
    main()
