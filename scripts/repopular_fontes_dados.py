#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Repopula fontes_dados a partir de contagens reais. Nenhum numero literal."""
import sqlite3, os, re, glob
from datetime import date

DB = "data/fundiario_brasil.db"
con = sqlite3.connect(DB); cur = con.cursor()

def contar(tabela, uf):
    cur.execute(f"SELECT COUNT(*) FROM {tabela} WHERE uf = ?", (uf,))
    return cur.fetchone()[0]

def data_base_arquivo(caminho):
    """Data-base declarada pela fonte. Para o SNCR vem do nome do arquivo
    (Imoveis_PR_01_09_2026.csv). Nao havendo padrao reconhecivel, retorna None —
    nunca presuma a data de hoje."""
    if not caminho or not os.path.exists(caminho):
        return None
    m = re.search(r"(\d{2})_(\d{2})_(\d{4})", os.path.basename(caminho))
    if m:
        d, mth, y = m.groups()
        return f"{y}-{mth}-{d}"
    return None

FONTES = [
    ("MMA/SFB",     "SICAR", "imoveis_fundiarios", ["Dados SICAR/AREA_IMOVEL_{uf}.zip"]),
    ("INCRA/SIGEF", "SIGEF", "imoveis_sigef",      ["Dados INCRA/Sigef Brasil_{uf}.zip", "Dados SIGEF/Sigef Brasil_{uf}.zip"]),
    ("INCRA/SNCR",  "SNCR",  "cadastro_sncr",      ["Dados SNCR/Imoveis_{uf}_*.csv", "Dados SNCR/Imoveis_{uf}.csv"]),
]

cur.execute("DROP TABLE IF EXISTS fontes_dados;")
cur.execute("""
    CREATE TABLE fontes_dados (
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
hoje = date.today().isoformat()

for orgao, sistema, tabela, padroes in FONTES:
    cur.execute(f"SELECT DISTINCT uf FROM {tabela} WHERE uf IS NOT NULL ORDER BY uf")
    for (uf,) in cur.fetchall():
        candidatos = []
        for p in padroes:
            candidatos.extend(glob.glob(p.format(uf=uf)))
        arquivo = os.path.basename(candidatos[0]) if candidatos else None
        dt_base = data_base_arquivo(candidatos[0] if candidatos else None)
        total_real = contar(tabela, uf)

        cur.execute("""
            INSERT INTO fontes_dados
              (orgao, sistema, uf, arquivo_origem, data_base, data_download,
               total_registros, criterio_associacao, observacoes)
            VALUES (?,?,?,?,?,?,?,?,?)
        """, (
            orgao, sistema, uf,
            arquivo,                                   # None se o arquivo nao estiver mais presente
            dt_base,
            hoje,
            total_real,                                # <- contagem real, sempre
            None,                                      # criterio e por consulta, nao por fonte
            None,
        ))
        print(f"[{sistema}] UF {uf}: {total_real:,} registros (Arquivo: {arquivo}, Data-Base: {dt_base})")

con.commit(); con.close()
print("fontes_dados repopulada com contagens reais com sucesso!")
