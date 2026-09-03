#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
INGESTÃO DOS DADOS DO SIGEF/INCRA (PARCELAS CERTIFICADAS - LEI 10.267/2001)
Mestrado PPGTCA 2026 - Pesquisa de Erosão Laminar (Brasil)
=============================================================================
Lê os shapefiles oficiais baixados do Acervo Fundiário do INCRA (SIGEF)
em 'Dados INCRA/' (ou 'Dados SIGEF/'), indexa espacialmente com R*Tree e popula
a tabela imoveis_sigef no banco SQLite local (data/fundiario_brasil.db).
Fornece nomes reais de fazendas (nome_area), código SNCR e matrícula no Cartório (CRI).
"""

import zipfile
import io
import os
import sys
import glob
import time
import sqlite3

try:
    import shapefile
except ImportError:
    print("[ERRO] Biblioteca pyshp (shapefile) não instalada.")
    sys.exit(1)


UF_IBGE_MAP = {
    41: "PR",
    42: "SC",
    35: "SP",
    43: "RS",
    31: "MG",
    50: "MS",
    51: "MT",
    52: "GO",
    29: "BA"
}


def init_sigef_tables(conn: sqlite3.Connection):
    cursor = conn.cursor()
    conn.execute("PRAGMA synchronous = OFF;")
    conn.execute("PRAGMA journal_mode = WAL;")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS imoveis_sigef (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cod_parcela TEXT,
            nome_area TEXT,
            codigo_imo TEXT,
            registro_matricula TEXT,
            art_crea TEXT,
            situacao TEXT,
            status TEXT,
            data_aprov TEXT,
            municipio_ibge INTEGER,
            uf TEXT,
            lat_min REAL NOT NULL,
            lat_max REAL NOT NULL,
            lon_min REAL NOT NULL,
            lon_max REAL NOT NULL,
            fonte TEXT,
            state_zip TEXT,
            shape_index INTEGER
        );
    """)

    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS imoveis_sigef_rtree USING rtree(
            id,
            minX, maxX,
            minY, maxY
        );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sigef_nome_area ON imoveis_sigef(nome_area);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sigef_codigo_imo ON imoveis_sigef(codigo_imo);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sigef_uf ON imoveis_sigef(uf);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sigef_matr ON imoveis_sigef(registro_matricula);")
    conn.commit()


def ingest_zip_file(conn: sqlite3.Connection, zip_path: str, batch_size: int = 10000):
    rel_path = os.path.relpath(zip_path).replace("\\", "/")
    print(f"\n========================================================")
    print(f"-> Processando base oficial SIGEF/INCRA: {os.path.basename(zip_path)}")
    print(f"========================================================")

    # Descobre a UF pelo nome do arquivo
    fname = os.path.basename(zip_path).upper()
    uf_hint = ""
    for uf in ["PR", "SC", "SP", "RS", "MG", "MS", "MT", "GO", "BA"]:
        if f"_{uf}" in fname or f"-{uf}" in fname or fname.endswith(f"{uf}.ZIP"):
            uf_hint = uf
            break

    # Também descompacta para cache de geometrias rápidas
    cache_dir = os.path.join("data", "sigef_cache")
    os.makedirs(cache_dir, exist_ok=True)
    if uf_hint:
        cache_shp = os.path.join(cache_dir, f"{uf_hint}.shp")
        if not os.path.exists(cache_shp):
            print(f"Extraindo camadas vetoriais para cache local ({uf_hint})...")
            with zipfile.ZipFile(zip_path) as z:
                for ext in ['shp', 'shx', 'dbf', 'prj']:
                    try:
                        n = next(x for x in z.namelist() if x.lower().endswith('.' + ext))
                        with open(os.path.join(cache_dir, f"{uf_hint}.{ext}"), 'wb') as f:
                            f.write(z.read(n))
                    except Exception:
                        pass

    t0 = time.time()
    with zipfile.ZipFile(zip_path) as z:
        shp_name = next((n for n in z.namelist() if n.lower().endswith('.shp')), None)
        dbf_name = next((n for n in z.namelist() if n.lower().endswith('.dbf')), None)
        shx_name = next((n for n in z.namelist() if n.lower().endswith('.shx')), None)

        if not shp_name or not dbf_name:
            print(f"[ERRO] Formato inválido no zip: {zip_path}")
            return 0

        shp_io = io.BytesIO(z.read(shp_name))
        dbf_io = io.BytesIO(z.read(dbf_name))
        shx_io = io.BytesIO(z.read(shx_name)) if shx_name else None

        sf = shapefile.Reader(shp=shp_io, dbf=dbf_io, shx=shx_io, encoding='latin1')
        total_shapes = len(sf)
        print(f"Total de parcelas certificadas no arquivo: {total_shapes:,}")

        # Remove dados antigos dessa UF para atualização limpa
        cursor = conn.cursor()
        if uf_hint:
            cursor.execute("SELECT id FROM imoveis_sigef WHERE uf = ?", (uf_hint,))
            old_ids = [r[0] for r in cursor.fetchall()]
            if old_ids:
                print(f"Substituindo {len(old_ids):,} registros antigos da UF {uf_hint}...")
                cursor.execute("DELETE FROM imoveis_sigef WHERE uf = ?", (uf_hint,))
                cursor.executemany("DELETE FROM imoveis_sigef_rtree WHERE id = ?", [(oid,) for oid in old_ids])
                conn.commit()

        cursor.execute("SELECT coalesce(max(id), 0) FROM imoveis_sigef")
        curr_id = cursor.fetchone()[0]

        batch_props = []
        batch_rtree = []
        inserted = 0

        for i in range(total_shapes):
            curr_id += 1
            sh = sf.shape(i)
            rec = sf.record(i).as_dict()

            xmin, ymin, xmax, ymax = sh.bbox

            cod_parcela = str(rec.get('parcela_co') or '').strip()
            nome_area = str(rec.get('nome_area') or 'Imóvel Rural Certificado').strip()
            codigo_imo = str(rec.get('codigo_imo') or '').strip()
            registro_m = str(rec.get('registro_m') or '').strip()
            art = str(rec.get('art') or '').strip()
            situacao = str(rec.get('situacao_i') or '').strip()
            st = str(rec.get('status') or 'CERTIFICADA').strip()
            dt_aprov = str(rec.get('data_aprov') or '').strip()

            mun_ibge = 0
            try:
                mun_ibge = int(rec.get('municipio_') or 0)
            except Exception:
                mun_ibge = 0

            uf_ibge = rec.get('uf_id')
            uf = UF_IBGE_MAP.get(uf_ibge, uf_hint) or uf_hint

            fonte = "SIGEF/INCRA Oficial (Lei 10.267/2001)"

            batch_props.append((
                curr_id, cod_parcela, nome_area, codigo_imo, registro_m,
                art, situacao, st, dt_aprov, mun_ibge, uf,
                ymin, ymax, xmin, xmax, fonte, rel_path, i
            ))

            batch_rtree.append((curr_id, xmin, xmax, ymin, ymax))

            if len(batch_props) >= batch_size:
                cursor.executemany("""
                    INSERT INTO imoveis_sigef (
                        id, cod_parcela, nome_area, codigo_imo, registro_matricula,
                        art_crea, situacao, status, data_aprov, municipio_ibge, uf,
                        lat_min, lat_max, lon_min, lon_max, fonte, state_zip, shape_index
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);
                """, batch_props)

                cursor.executemany("""
                    INSERT INTO imoveis_sigef_rtree (id, minX, maxX, minY, maxY)
                    VALUES (?, ?, ?, ?, ?);
                """, batch_rtree)

                conn.commit()
                inserted += len(batch_props)
                batch_props.clear()
                batch_rtree.clear()
                sys.stdout.write(f"\rProgresso: {inserted:,} / {total_shapes:,} ({inserted*100//total_shapes}%)")
                sys.stdout.flush()

        if batch_props:
            cursor.executemany("""
                INSERT INTO imoveis_sigef (
                    id, cod_parcela, nome_area, codigo_imo, registro_matricula,
                    art_crea, situacao, status, data_aprov, municipio_ibge, uf,
                    lat_min, lat_max, lon_min, lon_max, fonte, state_zip, shape_index
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);
            """, batch_props)

            cursor.executemany("""
                INSERT INTO imoveis_sigef_rtree (id, minX, maxX, minY, maxY)
                VALUES (?, ?, ?, ?, ?);
            """, batch_rtree)

            conn.commit()
            inserted += len(batch_props)

        print(f"\r[SUCESSO] {inserted:,} parcelas do SIGEF ({uf_hint}) indexadas em {time.time() - t0:.1f}s!")
        return inserted


def main():
    incra_dirs = ["Dados INCRA", "Dados SIGEF"]
    target_dir = next((d for d in incra_dirs if os.path.exists(d) and (glob.glob(os.path.join(d, "*.zip")) or glob.glob(os.path.join(d, "*.shp")))), None)
    db_path = "data/fundiario_brasil.db"

    print("=============================================================================")
    print("INICIANDO INGESTÃO DOS DADOS DO SIGEF/INCRA (PR, SC, SP)")
    print("=============================================================================")

    if not target_dir:
        print(f"[ERRO] Nenhum arquivo .zip encontrado em 'Dados INCRA/' nem 'Dados SIGEF/'.")
        return

    conn = sqlite3.connect(db_path)
    init_sigef_tables(conn)

    zip_files = sorted(glob.glob(os.path.join(target_dir, "*.zip")))
    total_all = 0
    for zf in zip_files:
        total_all += ingest_zip_file(conn, zf)

    print("\nOtimizando índices e estatísticas do SQLite (PRAGMA optimize)...")
    conn.execute("PRAGMA optimize;")
    conn.commit()

    cursor = conn.cursor()
    cursor.execute("SELECT count(*), count(distinct uf), count(distinct codigo_imo) FROM imoveis_sigef;")
    tot_parc, tot_ufs, tot_imos = cursor.fetchone()
    conn.close()

    print("\n=============================================================================")
    print(f"CARGA SIGEF CONCLUÍDA COM SUCESSO!")
    print(f"Total de parcelas certificadas no banco: {tot_parc:,}")
    print(f"Imóveis rurais únicos certificados: {tot_imos:,}")
    print(f"Estados cobertos: {tot_ufs}")
    print(f"Banco de dados: {os.path.abspath(db_path)}")
    print("=============================================================================")


if __name__ == "__main__":
    main()
