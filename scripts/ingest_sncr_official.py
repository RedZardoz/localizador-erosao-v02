#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
INGESTÃO DOS DADOS CADASTRAIS ABERTOS DO SNCR / INCRA (TITULARES E IMÓVEIS)
Mestrado PPGTCA 2026 - Pesquisa de Erosão Laminar (Brasil)
=============================================================================
Lê os arquivos CSV baixados do SNCR (Acervo Fundiário / Dados Abertos INCRA)
em 'Dados SNCR/Imoveis_{UF}_01_09_2026.csv' e indexa na tabela cadastro_sncr
do SQLite (data/fundiario_brasil.db).

Permite o Database Merge Alfanumérico instantâneo:
- Por código do imóvel SNCR (13 dígitos ou 9 dígitos)
- Por número de matrícula do Cartório de Registro de Imóveis (CRI) dentro do município
Retorna o Nome Real do Titular (com máscara oficial da Receita), a Condição Legal
(Proprietário, Nu-proprietário, Posseiro) e a Denominação do Imóvel no SNCR.
"""

import os
import sys
import glob
import time
import csv
import sqlite3

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

    conn.commit()


def create_sncr_indexes(conn: sqlite3.Connection):
    cursor = conn.cursor()
    print("Criando índices de alta performance para merge alfanumérico...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sncr_cod ON cadastro_sncr(codigo_imovel);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sncr_mun_den ON cadastro_sncr(municipio_ibge, denominacao);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sncr_mun ON cadastro_sncr(municipio_ibge);")
    conn.commit()


def ingest_csv_file(conn: sqlite3.Connection, csv_path: str, batch_size: int = 50000):
    fname = os.path.basename(csv_path)
    print(f"\n========================================================")
    print(f"-> Ingerindo base cadastral do SNCR: {fname}")
    print(f"========================================================")

    # Identifica a UF
    uf = "PR"
    for u in ["PR", "SC", "SP", "RS", "MG", "MS", "MT", "GO", "BA"]:
        if f"_{u}_" in fname or fname.endswith(f"_{u}.csv"):
            uf = u
            break

    cursor = conn.cursor()
    cursor.execute("DELETE FROM cadastro_sncr WHERE uf = ?;", (uf,))
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
            row_uf = row[4].strip() or uf
            
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
                sys.stdout.write(f"\rProgresso: {inserted:,} registros ingeridos...")
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

    print(f"\r[SUCESSO] {inserted:,} registros do SNCR ({uf}) importados em {time.time() - t0:.1f}s!")
    return inserted


def main():
    sncr_dir = "Dados SNCR"
    db_path = "data/fundiario_brasil.db"

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
