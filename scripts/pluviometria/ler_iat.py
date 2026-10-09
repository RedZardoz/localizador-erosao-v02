"""Leitor dos relatorios do SIH/AGUASPARANA (IAT) em docs/pluviometria.

Le TotaisMensaisPrecipitacao.xls (valores) e AlturasMensaisPrecipitacao.xls
(metadados da estacao: lat/lon/altitude/entidade). Nao preenche falhas:
mes '-' vira vazio e a flag fica em 'situacao'. '*' = valor consistido.
Saidas (CSV, ';' e ponto decimal):
  docs/verificacoes/pluviometria_iat_mensal.csv
  docs/verificacoes/pluviometria_iat_estacoes.csv
"""
import csv, glob, os, re, sys
import xlrd

RAIZ = os.path.join(os.path.dirname(__file__), "..", "..")
BASE = os.path.join(RAIZ, "docs", "pluviometria")
SAIDA = os.path.join(RAIZ, "docs", "verificacoes")
MESES = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"]

def num(s):
    """('12,3*') -> (12.3, 'consistido'); '-' -> (None,'sem_leitura')."""
    s = str(s).strip()
    if s in ("", "-"): return None, "sem_leitura"
    flag = "consistido" if s.endswith("*") else "bruto"
    try: return float(s.rstrip("*").replace(",", ".")), flag
    except ValueError: return None, "ilegivel:" + s

def dms(s):
    m = re.match(r"\s*(-?\d+)[°º]\s*(\d+)'\s*(\d+)''", s)
    if not m: return None
    g, mi, se = (int(x) for x in m.groups())
    return -(abs(g) + mi/60 + se/3600)  # lat/lon do Parana: hemisferio S / W

def meta_estacoes(arq):
    out = {}
    wb = xlrd.open_workbook(arq)
    for sh in wb.sheets():
        for r in range(sh.nrows):
            v = [c for c in sh.row_values(r) if c != ""]
            if v[:1] == ["Estação:"]:
                nome, cod, ent = v[1], int(v[3]), v[5] if len(v) > 5 else ""
                v2 = [c for c in sh.row_values(r+1) if c != ""]
                v4 = [c for c in sh.row_values(r+3) if c != ""]
                out[cod] = dict(codigo=cod, nome=nome, entidade=ent,
                    municipio=v2[1], instalacao=v2[3], extincao=v2[5] if len(v2) > 5 else "",
                    altitude_m=float(v4[1].split()[0].replace(",", ".")),
                    lat=dms(v4[3]), lon=dms(v4[5]))
    return out

def valores(arq, municipio):
    wb = xlrd.open_workbook(arq)
    for sh in wb.sheets():
        for r in range(sh.nrows):
            v = sh.row_values(r)
            if len(v) >= 17 and v[2] == "": v = v[:2] + v[3:]  # coluna mesclada vazia
            if len(v) >= 15 and isinstance(v[0], float) and isinstance(v[2], float) and v[0] > 1e6:
                for i, mes in enumerate(MESES):
                    val, flag = num(v[3+i])
                    yield dict(codigo=int(v[0]), estacao=v[1], ano=int(v[2]), mes=i+1,
                               chuva_mm=val, situacao=flag, consulta_municipio=municipio)

def main():
    est, linhas = {}, {}
    for d in sorted(glob.glob(os.path.join(BASE, "*"))):
        mun = os.path.basename(d)
        f_tot = os.path.join(d, "TotaisMensaisPrecipitacao.xls")
        f_alt = os.path.join(d, "AlturasMensaisPrecipitacao.xls")
        if not os.path.exists(f_tot): print("SEM Totais:", mun, file=sys.stderr); continue
        if os.path.exists(f_alt): est.update(meta_estacoes(f_alt))
        for l in valores(f_tot, mun):
            linhas.setdefault((l["codigo"], l["ano"], l["mes"]), l)  # dedup entre consultas
    os.makedirs(SAIDA, exist_ok=True)
    with open(os.path.join(SAIDA, "pluviometria_iat_mensal.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, ["codigo","estacao","ano","mes","chuva_mm","situacao","consulta_municipio"], delimiter=";")
        w.writeheader()
        for k in sorted(linhas): w.writerow(linhas[k])
    cods = sorted({k[0] for k in linhas})
    with open(os.path.join(SAIDA, "pluviometria_iat_estacoes.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["codigo","nome","municipio","entidade","lat","lon","altitude_m","instalacao","extincao","meses_com_dado","meses_sem_leitura","ano_min","ano_max"])
        for c in cods:
            L = [v for k, v in linhas.items() if k[0] == c]
            m = est.get(c, {})
            w.writerow([c, L[0]["estacao"], m.get("municipio",""), m.get("entidade",""), m.get("lat",""), m.get("lon",""),
                        m.get("altitude_m",""), m.get("instalacao",""), m.get("extincao",""),
                        sum(1 for x in L if x["chuva_mm"] is not None), sum(1 for x in L if x["chuva_mm"] is None),
                        min(x["ano"] for x in L), max(x["ano"] for x in L)])
    print(len(cods), "estacoes;", len(linhas), "estacao-mes")

if __name__ == "__main__": main()
