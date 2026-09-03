#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
INGESTÃO EM LOTE DE TODAS AS UFs BRASILEIRAS (SICAR / SIGEF / SNCR)
Mestrado PPGTCA 2026 - Pesquisa de Erosão Laminar (Brasil)
=============================================================================
Utilitário para automatizar a ingestão em lote das 27 Unidades da Federação.
Identifica arquivos presentes nas pastas oficiais (Dados SICAR, Dados SIGEF, Dados SNCR),
executa o processamento cumulativo e exibe relatório de cobertura e volumetria.

Uso:
  python scripts/batch_ingest_all_ufs.py
  python scripts/batch_ingest_all_ufs.py --db data/fundiario_brasil.db
"""

import sqlite3
import argparse
import os
import sys
import time
from datetime import datetime
from typing import Dict, List

# Importa módulos do ingest_data
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ingest_data import ALL_UFS, init_database, process_uf, find_uf_files


def format_bytes(size: int) -> str:
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size < 1024.0:
            return f"{size:.2f} {unit}"
        size /= 1024.0
    return f"{size:.2f} PB"


def main():
    parser = argparse.ArgumentParser(
        description="Ingestão automatizada em lote de dados fundiários para as 27 UFs."
    )
    parser.add_argument("--db", type=str, default="data/fundiario_brasil.db", help="Caminho do banco SQLite")
    parser.add_argument("--batch-size", type=int, default=5000, help="Tamanho do lote de inserção")
    args = parser.parse_args()

    print("=" * 70)
    print("PIPELINE DE INGESTÃO FUNDIÁRIA EM LOTE — TODAS AS 27 UFs DO BRASIL")
    print("Mestrado PPGTCA 2026 — Pesquisa de Erosão Laminar")
    print("=" * 70)
    print(f"Data e Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"Banco Alvo:  {args.db}\n")

    conn = init_database(args.db)

    # Identifica status prévio no banco
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM imoveis_fundiarios WHERE fonte IS NOT NULL;")
    total_inicial = cursor.fetchone()[0]

    cursor.execute("SELECT DISTINCT uf FROM imoveis_fundiarios WHERE fonte IS NOT NULL ORDER BY uf;")
    ufs_iniciais = [r[0] for r in cursor.fetchall()]

    print(f"Estado Atual do Banco:")
    print(f" - Total de Imóveis Oficiais: {total_inicial:,}")
    print(f" - UFs já presentes: {', '.join(ufs_iniciais) if ufs_iniciais else 'Nenhuma'}")
    print("-" * 70)

    sucessos: Dict[str, int] = {}
    pulados: List[str] = []
    erros: Dict[str, str] = {}

    start_total = time.time()

    for i, uf in enumerate(ALL_UFS, 1):
        sicar, sigef, sncr = find_uf_files(uf)
        has_files = bool(sicar or sigef)

        print(f"[{i:02d}/27] UF: {uf} ... ", end="", flush=True)

        if not has_files:
            print("[AUSENTE] Arquivos não encontrados em Dados SICAR/ ou Dados SIGEF/.")
            pulados.append(uf)
            continue

        print("[ENCONTRADO] Iniciando processamento...")
        t0 = time.time()
        try:
            inseridos = process_uf(conn, uf, batch_size=args.batch_size)
            duracao = time.time() - t0
            sucessos[uf] = inseridos
            print(f"  -> UF {uf} concluída em {duracao:.1f}s ({inseridos:,} registros inseridos).")
        except Exception as e:
            duracao = time.time() - t0
            erros[uf] = str(e)
            print(f"  -> [FALHA] Erro na UF {uf} ({duracao:.1f}s): {e}", file=sys.stderr)

    total_tempo = time.time() - start_total

    # Estatísticas finais
    cursor.execute("SELECT COUNT(*) FROM imoveis_fundiarios WHERE fonte IS NOT NULL;")
    total_final = cursor.fetchone()[0]

    cursor.execute("SELECT uf, COUNT(*) FROM imoveis_fundiarios WHERE fonte IS NOT NULL GROUP BY uf ORDER BY uf;")
    contagem_por_uf = dict(cursor.fetchall())

    conn.close()

    tamanho_db = os.path.getsize(args.db) if os.path.exists(args.db) else 0

    print("\n" + "=" * 70)
    print("RELATÓRIO RESUMO DA INGESTÃO EM LOTE")
    print("=" * 70)
    print(f"Tempo Total Decorrido: {total_tempo:.1f} segundos ({total_tempo / 60.0:.2f} minutos)")
    print(f"UFs Processadas com Sucesso: {len(sucessos)} de 27")
    print(f"UFs com Arquivos Ausentes:   {len(pulados)} de 27")
    print(f"UFs com Erro:                {len(erros)} de 27")
    print("-" * 70)

    print("Contagem de Imóveis por UF na Base SQLite:")
    for uf, count in contagem_por_uf.items():
        print(f"  - {uf}: {count:>9,} imóveis")

    if pulados:
        print("\nUFs com Arquivos Ausentes (aguardando download):")
        print("  " + ", ".join(pulados))

    if erros:
        print("\nErros ocorridos durante a execução:")
        for uf, err in erros.items():
            print(f"  - {uf}: {err}")

    print("-" * 70)
    print(f"Total Geral de Imóveis Oficiais na Base: {total_final:,} (+{total_final - total_inicial:,})")
    print(f"Espaço Ocupado pelo Banco de Dados:     {format_bytes(tamanho_db)}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
