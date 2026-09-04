#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
INGESTÃO DA BASE OFICIAL DO SNCR/INCRA (BRASIL - 27 UFs)
Mestrado PPGTCA 2026 - Pesquisa de Erosão Laminar (Brasil)
=============================================================================
Lê os arquivos CSV de Dados Abertos do INCRA (Sistema Nacional de Cadastro Rural),
extrai os dados cadastrais alfanuméricos com os nomes dos titulares já oficialmente
pseudonimizados pelo órgão público (LGPD art. 7º, IV) e indexa na tabela cadastro_sncr.
Identifica dinamicamente as UFs a partir do conteúdo do CSV, garantindo que UFs
não presentes no arquivo jamais sejam acidentalmente excluídas.
"""

import os
import sys
import time
import csv
import glob
import re
import sqlite3

ALL_UFS = {
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
}


def init_sncr_table(conn: sqlite3.Connection):
    cursor = conn.cursor()
    conn.execute("PRAGMA synchronous = OFF;")
    conn.execute("PRAGMA journal_mode = WAL;")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cadastro_sncr (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_imovel TEXT,
            denominacao TEXT,
            municipio_ibge TEXT,
            municipio TEXT,
            uf TEXT,
            area_total REAL,
            titular TEXT,
            natureza_juridica TEXT,
            condicao_pessoa TEXT,
            percentual_detencao REAL
        );
    """)

    cursor.execute("""
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
    conn.commit()


def create_sncr_indexes(conn: sqlite3.Connection):
    cursor = conn.cursor()
    print("Criando índices de alta performance para merge alfanumérico...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sncr_cod ON cadastro_sncr(codigo_imovel);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sncr_mun_den ON cadastro_sncr(municipio_ibge, denominacao);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sncr_mun ON cadastro_sncr(municipio_ibge);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sncr_uf ON cadastro_sncr(uf);")
    conn.commit()


def data_base_from_filename(fname: str) -> str:
    m = re.search(r"(\d{2})_(\d{2})_(\d{4})", fname)
    if m:
        d, mth, y = m.groups()
        return f"{y}-{mth}-{d}"
    return None


def ingest_csv_file(conn: sqlite3.Connection, csv_path: str, batch_size: int = 50000):
    fname = os.path.basename(csv_path)
    print(f"\n========================================================")
    print(f"-> Ingerindo base cadastral do SNCR: {fname}")
    print(f"========================================================")

    # 1. Pré-leitura rigorosa para identificar as UFs reais presentes na coluna 5 (row[4])
    ufs_no_csv = set()
    with open(csv_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f, delimiter=";")
        header = next(reader, None)
        sample_count = 0
        for row in reader:
            if len(row) > 4:
                u = row[4].strip().upper()
                if u:
                    ufs_no_csv.add(u)
            sample_count += 1
            if sample_count > 5000 and len(ufs_no_csv) > 0:
                # Otimização: arquivos por estado contém uma única UF
                break

    if not ufs_no_csv:
        # Se não detectou no topo, faz leitura completa para garantir
        with open(csv_path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.reader(f, delimiter=";")
            header = next(reader, None)
            for row in reader:
                if len(row) > 4:
                    u = row[4].strip().upper()
                    if u:
                        ufs_no_csv.add(u)

    if not ufs_no_csv:
        raise ValueError(f"Nenhuma UF válida identificada no CSV {fname}. Abortando sem alterar o banco.")

    for u in ufs_no_csv:
        if u not in ALL_UFS:
            raise ValueError(f"UF inválida '{u}' identificada no CSV {fname}. Abortando sem alterar o banco.")

    print(f"UFs identificadas no arquivo {fname}: {', '.join(sorted(ufs_no_csv))}")

    # Remove do banco APENAS as UFs que constam no arquivo a ser ingerido
    cursor = conn.cursor()
    for u in ufs_no_csv:
        cursor.execute("DELETE FROM cadastro_sncr WHERE uf = ?;", (u,))
    conn.commit()

    t0 = time.time()
    batch = []
    inserted = 0

    with open(csv_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f, delimiter=";")
        header = next(reader, None)

        for row in reader:
            if len(row) < 7:
                continue

            cod_imovel = row[0].strip()
            denominacao = row[1].strip()
            mun_ibge = row[2].strip()
            municipio = row[3].strip()
            row_uf = row[4].strip().upper()
            if not row_uf and len(ufs_no_csv) == 1:
                row_uf = list(ufs_no_csv)[0]

            try:
                area_total = float(row[5].replace(".", "").replace(",", "."))
            except Exception:
                area_total = 0.0

            titular = row[6].strip()
            nat_jur = row[7].strip() if len(row) > 7 else ""
            condicao = row[8].strip() if len(row) > 8 else ""

            try:
                perc_det = float(row[9].replace(",", ".")) if len(row) > 9 and row[9].strip() else 100.0
            except Exception:
                perc_det = 100.0

            batch.append((
                cod_imovel, denominacao, mun_ibge, municipio, row_uf,
                area_total, titular, nat_jur, condicao, perc_det
            ))

            if len(batch) >= batch_size:
                cursor.executemany("""
                    INSERT INTO cadastro_sncr (
                        codigo_imovel, denominacao, municipio_ibge, municipio, uf,
                        area_total, titular, natureza_juridica, condicao_pessoa, percentual_detencao
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, batch)
                conn.commit()
                inserted += len(batch)
                batch.clear()
                sys.stdout.write(f"\rInseridos: {inserted:,} registros...")
                sys.stdout.flush()

        if batch:
            cursor.executemany("""
                INSERT INTO cadastro_sncr (
                    codigo_imovel, denominacao, municipio_ibge, municipio, uf,
                    area_total, titular, natureza_juridica, condicao_pessoa, percentual_detencao
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, batch)
            conn.commit()
            inserted += len(batch)

    # Registra metadados oficiais com contagens reais
    hoje = time.strftime("%Y-%m-%d")
    dt_base = data_base_from_filename(fname)

    for u in ufs_no_csv:
        cursor.execute("SELECT COUNT(*) FROM cadastro_sncr WHERE uf = ?;", (u,))
        real_count = cursor.fetchone()[0]
        cursor.execute("DELETE FROM fontes_dados WHERE sistema = 'SNCR' AND uf = ?;", (u,))
        cursor.execute("""
            INSERT INTO fontes_dados (
                orgao, sistema, uf, arquivo_origem, data_base, data_download, total_registros, criterio_associacao, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, ("INCRA/SNCR", "SNCR", u, fname, dt_base, hoje, real_count, None, None))
    conn.commit()

    print(f"\r[SUCESSO] {inserted:,} cadastros SNCR ({', '.join(sorted(ufs_no_csv))}) indexados em {time.time() - t0:.1f}s!")
    return inserted


def main():
    sncr_dir = "Dados SNCR"
    db_path = "data/fundiario_brasil.db"

    print("=============================================================================")
    print("INICIANDO INGESTÃO DA BASE OFICIAL DO SNCR/INCRA (BRASIL - 27 UFs)")
    print("=============================================================================")

    if not os.path.exists(sncr_dir):
        print(f"[ERRO] Diretório '{sncr_dir}' não encontrado.")
        return

    csv_files = sorted(glob.glob(os.path.join(sncr_dir, "*.csv")))
    if not csv_files:
        print(f"[ERRO] Nenhum arquivo CSV encontrado em '{sncr_dir}'.")
        return

    conn = sqlite3.connect(db_path)
    init_sncr_table(conn)

    total_all = 0
    for cf in csv_files:
        total_all += ingest_csv_file(conn, cf)

    create_sncr_indexes(conn)

    print("\nOtimizando índices e estatísticas (PRAGMA optimize)...")
    conn.execute("PRAGMA optimize;")
    conn.commit()

    cursor = conn.cursor()
    cursor.execute("SELECT count(*), count(distinct uf), count(distinct codigo_imovel) FROM cadastro_sncr;")
    tot_rows, tot_ufs, tot_cods = cursor.fetchone()
    conn.close()

    print("\n=============================================================================")
    print("INGESTÃO SNCR / CADASTRO CONCLUÍDA COM SUCESSO!")
    print(f"Total de registros de titularidade no banco: {tot_rows:,}")
    print(f"Imóveis rurais únicos no SNCR: {tot_cods:,}")
    print(f"Estados cobertos: {tot_ufs}")
    print(f"Banco de dados: {os.path.abspath(db_path)}")
    print("=============================================================================")


if __name__ == "__main__":
    main()
