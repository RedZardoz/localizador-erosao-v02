#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Confere cada linha de fontes_dados contra a contagem real da tabela correspondente."""
import sqlite3, sys

TABELA = {"SICAR": "imoveis_fundiarios", "SIGEF": "imoveis_sigef", "SNCR": "cadastro_sncr"}

con = sqlite3.connect("file:data/fundiario_brasil.db?mode=ro", uri=True)
cur = con.cursor()
cur.execute("SELECT sistema, uf, total_registros FROM fontes_dados ORDER BY sistema, uf")

divergem = 0
print(f"{'sistema':<7} {'uf':<3} {'declarado':>10} {'real':>10}  confere")
print("-" * 46)
for sistema, uf, declarado in cur.fetchall():
    tabela = TABELA.get(sistema)
    if not tabela:
        print(f"{sistema:<7} {uf:<3} {'?':>10} {'?':>10}  SISTEMA DESCONHECIDO")
        divergem += 1
        continue
    cur.execute(f"SELECT COUNT(*) FROM {tabela} WHERE uf = ?", (uf,))
    real = cur.fetchone()[0]
    ok = (declarado == real)
    divergem += (not ok)
    print(f"{sistema:<7} {uf:<3} {declarado:>10,} {real:>10,}  {'sim' if ok else 'NAO'}")

con.close()
print(f"\ndivergencias: {divergem}")
sys.exit(1 if divergem else 0)
