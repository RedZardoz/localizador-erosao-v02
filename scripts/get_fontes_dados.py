#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Consulta os metadados de fontes oficiais da tabela fontes_dados em data/fundiario_brasil.db
e retorna JSON estruturado para a rota /api/fundiario/fontes.
"""

import sys
import json
import sqlite3
import argparse
import os

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default="data/fundiario_brasil.db", help="Caminho para o banco SQLite")
    args = parser.parse_args()

    if not os.path.exists(args.db):
        print(json.dumps([]))
        return

    try:
        conn = sqlite3.connect(args.db)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT sistema, uf, arquivo_origem, data_base, total_registros
            FROM fontes_dados
            ORDER BY sistema, uf;
        """)
        rows = cursor.fetchall()
        conn.close()

        result = []
        for r in rows:
            result.append({
                "sistema": r[0],
                "uf": r[1],
                "arquivo_origem": r[2],
                "data_base": r[3],
                "total_registros": r[4]
            })

        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        sys.stderr.write(f"Erro ao consultar fontes_dados: {e}\n")
        print(json.dumps([]))

if __name__ == "__main__":
    main()
