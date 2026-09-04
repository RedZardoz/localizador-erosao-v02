#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
AUDITORIA DE COBERTURA E INTEGRIDADE DA BASE FUNDIÁRIA (BRASIL - 27 UFs)
Mestrado PPGTCA 2026 - Pesquisa de Erosão Laminar (Brasil)
=============================================================================
Consulta e reporta o status de ingestão para todas as 27 UFs brasileiras
nas camadas SICAR, SIGEF e SNCR, verificando a existência dos caches
geométricos e a integridade espacial dos índices R*Tree.
"""

import os
import sys
import sqlite3

ALL_UFS = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]


def format_bytes(size_bytes: int) -> str:
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} PB"


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    db_path = os.environ.get("FUNDIARIO_DB_PATH", "data/fundiario_brasil.db")
    sicar_cache_dir = "data/sicar_cache"
    sigef_cache_dir = "data/sigef_cache"

    print("=" * 88)
    print("RELATÓRIO DE COBERTURA E INTEGRIDADE DA BASE FUNDIÁRIA NACIONAL")
    print(f"Banco de dados: {os.path.abspath(db_path)}")
    print("=" * 88)

    if not os.path.exists(db_path):
        print(f"[ERRO CRÍTICO] Banco de dados '{db_path}' não encontrado!")
        sys.exit(1)

    db_size = os.path.getsize(db_path)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Coleta contagens por UF
    cursor.execute("SELECT uf, COUNT(*) FROM imoveis_fundiarios GROUP BY uf;")
    sicar_counts = {row[0]: row[1] for row in cursor.fetchall() if row[0]}

    cursor.execute("SELECT uf, COUNT(*) FROM imoveis_sigef GROUP BY uf;")
    sigef_counts = {row[0]: row[1] for row in cursor.fetchall() if row[0]}

    cursor.execute("SELECT uf, COUNT(*) FROM cadastro_sncr GROUP BY uf;")
    sncr_counts = {row[0]: row[1] for row in cursor.fetchall() if row[0]}

    # Cabeçalho da tabela
    header_fmt = "{:<4} | {:>10} | {:>10} | {:>10} | {:^11} | {:^11} | {:<10}"
    row_fmt    = "{:<4} | {:>10} | {:>10} | {:>10} | {:^11} | {:^11} | {:<10}"
    separator  = "-" * 88

    print("\n" + separator)
    print(header_fmt.format("UF", "SICAR", "SIGEF", "SNCR", "Cache SICAR", "Cache SIGEF", "Status"))
    print(separator)

    tot_sicar = 0
    tot_sigef = 0
    tot_sncr = 0
    completas = 0
    parciais = 0
    ausentes = 0

    for uf in ALL_UFS:
        c_sicar = sicar_counts.get(uf, 0)
        c_sigef = sigef_counts.get(uf, 0)
        c_sncr = sncr_counts.get(uf, 0)
        tot_sicar += c_sicar
        tot_sigef += c_sigef
        tot_sncr += c_sncr

        has_cache_sicar = os.path.exists(os.path.join(sicar_cache_dir, f"{uf}.shp"))
        has_cache_sigef = os.path.exists(os.path.join(sigef_cache_dir, f"{uf}.shp"))

        str_cache_sicar = "SIM" if has_cache_sicar else "NÃO"
        str_cache_sigef = "SIM" if has_cache_sigef else "NÃO"

        has_any = (c_sicar > 0) or (c_sigef > 0) or (c_sncr > 0) or has_cache_sicar or has_cache_sigef
        # Status COMPLETO exige dados nas 3 bases e os dois caches
        is_complete = (c_sicar > 0) and (c_sigef > 0) and (c_sncr > 0) and has_cache_sicar and has_cache_sigef

        if not has_any:
            status = "AUSENTE"
            ausentes += 1
        elif is_complete:
            status = "COMPLETO"
            completas += 1
        else:
            status = "PARCIAL"
            parciais += 1

        print(row_fmt.format(
            uf,
            f"{c_sicar:,}" if c_sicar else "-",
            f"{c_sigef:,}" if c_sigef else "-",
            f"{c_sncr:,}" if c_sncr else "-",
            str_cache_sicar,
            str_cache_sigef,
            status
        ))

    print(separator)

    # Verificações de integridade
    print("\n" + "=" * 88)
    print("VERIFICAÇÕES DE INTEGRIDADE E RESUMO DO SISTEMA")
    print("=" * 88)
    print(f"Tamanho do arquivo de banco em disco: {format_bytes(db_size)}")
    print(f"Total de registros SICAR (imoveis_fundiarios): {tot_sicar:,}")
    print(f"Total de registros SIGEF (imoveis_sigef):      {tot_sigef:,}")
    print(f"Total de registros SNCR (cadastro_sncr):       {tot_sncr:,}")
    print(f"Total de registros consolidados:               {tot_sicar + tot_sigef + tot_sncr:,}")
    print(f"UFs: {completas} completas, {parciais} parciais, {ausentes} ausentes (Total: {len(ALL_UFS)})")

    inconsistencias = 0

    # 1. Checagem R*Tree SICAR (imoveis_fundiarios_rtree)
    cursor.execute("SELECT COUNT(*) FROM imoveis_fundiarios_rtree;")
    rtree_sicar_count = cursor.fetchone()[0]
    print(f"Registros no índice espacial R*Tree SICAR (imoveis_fundiarios_rtree): {rtree_sicar_count:,}")

    if rtree_sicar_count != tot_sicar:
        print(f"[ALERTA CRÍTICO] Contagem R*Tree SICAR ({rtree_sicar_count:,}) diverge de imoveis_fundiarios ({tot_sicar:,})!")
        inconsistencias += 1

    cursor.execute("SELECT COUNT(*) FROM imoveis_fundiarios f LEFT JOIN imoveis_fundiarios_rtree r ON f.id = r.id WHERE r.id IS NULL;")
    sem_rtree_sicar = cursor.fetchone()[0]
    if sem_rtree_sicar > 0:
        print(f"[ALERTA CRÍTICO] {sem_rtree_sicar:,} registros em imoveis_fundiarios sem entrada no R*Tree!")
        inconsistencias += 1
    else:
        print("  [OK] SICAR: Todos os registros de imoveis_fundiarios possuem entrada correspondente no R*Tree.")

    cursor.execute("SELECT COUNT(*) FROM imoveis_fundiarios_rtree r LEFT JOIN imoveis_fundiarios f ON r.id = f.id WHERE f.id IS NULL;")
    orfaos_rtree_sicar = cursor.fetchone()[0]
    if orfaos_rtree_sicar > 0:
        print(f"[ALERTA CRÍTICO] {orfaos_rtree_sicar:,} órfãos encontrados no R*Tree SICAR sem registro correspondente!")
        inconsistencias += 1
    else:
        print("  [OK] SICAR: Zero órfãos no R*Tree.")

    # Checagem R*Tree SIGEF (imoveis_sigef_rtree)
    cursor.execute("SELECT COUNT(*) FROM imoveis_sigef_rtree;")
    rtree_sigef_count = cursor.fetchone()[0]
    print(f"Registros no índice espacial R*Tree SIGEF (imoveis_sigef_rtree): {rtree_sigef_count:,}")

    if rtree_sigef_count != tot_sigef:
        print(f"[ALERTA CRÍTICO] Contagem R*Tree SIGEF ({rtree_sigef_count:,}) diverge de imoveis_sigef ({tot_sigef:,})!")
        inconsistencias += 1

    cursor.execute("SELECT COUNT(*) FROM imoveis_sigef s LEFT JOIN imoveis_sigef_rtree r ON s.id = r.id WHERE r.id IS NULL;")
    sem_rtree_sigef = cursor.fetchone()[0]
    if sem_rtree_sigef > 0:
        print(f"[ALERTA CRÍTICO] {sem_rtree_sigef:,} registros em imoveis_sigef sem entrada no R*Tree!")
        inconsistencias += 1
    else:
        print("  [OK] SIGEF: Todos os registros de imoveis_sigef possuem entrada correspondente no R*Tree.")

    cursor.execute("SELECT COUNT(*) FROM imoveis_sigef_rtree r LEFT JOIN imoveis_sigef s ON r.id = s.id WHERE s.id IS NULL;")
    orfaos_rtree_sigef = cursor.fetchone()[0]
    if orfaos_rtree_sigef > 0:
        print(f"[ALERTA CRÍTICO] {orfaos_rtree_sigef:,} órfãos encontrados no R*Tree SIGEF sem registro correspondente!")
        inconsistencias += 1
    else:
        print("  [OK] SIGEF: Zero órfãos no R*Tree.")

    # 2. Checagem de integridade de colunas mandatórias
    cursor.execute("SELECT COUNT(*) FROM imoveis_fundiarios WHERE fonte IS NULL;")
    nulos_fonte = cursor.fetchone()[0]
    if nulos_fonte > 0:
        print(f"[ALERTA CRÍTICO] {nulos_fonte:,} registros com fonte IS NULL em imoveis_fundiarios!")
        inconsistencias += 1
    else:
        print("  [OK] Zero registros com fonte IS NULL.")

    cursor.execute("SELECT COUNT(*) FROM imoveis_fundiarios WHERE uf IS NULL OR TRIM(uf) = '';")
    nulos_uf = cursor.fetchone()[0]
    if nulos_uf > 0:
        print(f"[ALERTA CRÍTICO] {nulos_uf:,} registros com UF inválida/nula em imoveis_fundiarios!")
        inconsistencias += 1
    else:
        print("  [OK] Zero registros com UF nula ou vazia.")

    # 3. Metadados de fontes
    cursor.execute("SELECT COUNT(*) FROM fontes_dados;")
    n_fontes = cursor.fetchone()[0]
    print(f"Registros na tabela de auditoria de fontes (fontes_dados): {n_fontes}")

    conn.close()

    print("=" * 88)
    if inconsistencias == 0:
        print("[SUCESSO] Base de dados íntegra. Nenhuma inconsistência detectada.")
        print("=" * 88)
        sys.exit(0)
    else:
        print(f"[FALHA] Encontradas {inconsistencias} inconsistência(s) na base de dados.")
        print("=" * 88)
        sys.exit(1)


if __name__ == "__main__":
    main()
