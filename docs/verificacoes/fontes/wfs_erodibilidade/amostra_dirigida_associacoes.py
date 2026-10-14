# -*- coding: utf-8 -*-
"""Amostra DIRIGIDA a unidades pedologicas em ASSOCIACAO na Bacia do Parana 3.

Mede a concordancia entre `geonode:parana_solos_20201105` (carta estadual) e
`geonode:bra_erodibilidade_2024_sirgas2000` (carta nacional de erodibilidade) nas
unidades do tipo associacao, que e o caso governado por D08 e onde as duas medicoes
anteriores tinham base probatoria fraca (0 de 3, depois 0 de 2 pontos incidentais).

Desenho: estratificado pelas unidades de mapeamento de associacao existentes na bacia,
ate N_POR_UNIDADE poligonos por unidade, com ponto interior garantido por
shapely.representative_point(). Atribuicao por ponto-em-poligono (WFS 1.1.0, POINT(lat lon)),
conforme F9 do reconhecimento.

Saida: JSON com um registro por ponto e agregados por unidade e global.
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from collections import Counter, defaultdict

for _v in ("PROJ_LIB", "PROJ_DATA", "GDAL_DATA"):
    os.environ.pop(_v, None)

from shapely.geometry import shape

OWS = "https://geoinfo.dados.embrapa.br/geoserver/ows"
L_PR = "geonode:parana_solos_20201105"
L_24 = "geonode:bra_erodibilidade_2024_sirgas2000"

# Envelope aproximado da Bacia do Parana 3 (BBOX em WFS 1.1.0 = lat_min,lon_min,lat_max,lon_max)
BBOX_BP3 = "-25.65,-54.65,-24.00,-53.35"
N_POR_UNIDADE = 5
TIMEOUT = 90

# D09: niveis do estrato de erodibilidade
NIVEL_1 = {"muito baixa", "baixa", "media"}
NIVEL_2 = {"alta", "muito alta", "extremamente alta"}


def norm(s):
    if s is None:
        return ""
    s = str(s).strip().lower()
    for a, b in (("á", "a"), ("â", "a"), ("ã", "a"), ("é", "e"), ("ê", "e"),
                 ("í", "i"), ("ó", "o"), ("ô", "o"), ("õ", "o"), ("ú", "u"), ("ç", "c")):
        s = s.replace(a, b)
    return s


def nivel_k(classe):
    n = norm(classe)
    if n in NIVEL_1:
        return 1
    if n in NIVEL_2:
        return 2
    return None  # nao-solo ou desconhecido -> fora do dominio


def get(params):
    url = OWS + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=TIMEOUT) as r:
        return json.loads(r.read().decode("utf8", "replace"))


def listar_associacoes():
    return get({
        "service": "WFS", "version": "1.1.0", "request": "GetFeature",
        "typeName": L_PR, "outputFormat": "application/json",
        "CQL_FILTER": "tipo_unida='associacao' AND BBOX(geometry,%s)" % BBOX_BP3,
        "propertyName": "sbcs,tipo_unida,ordem_1,ordem_2,ordem_3,area_km2",
        "maxFeatures": "500",
    }).get("features", [])


def geometria_de(ogc_fids):
    """Busca geometria de um lote de feicoes por ogc_fid."""
    alvo = ",".join("'%s'" % f for f in ogc_fids)
    return get({
        "service": "WFS", "version": "1.1.0", "request": "GetFeature",
        "typeName": L_PR, "outputFormat": "application/json",
        "CQL_FILTER": "ogc_fid IN (%s)" % alvo,
        "maxFeatures": str(len(ogc_fids) + 5),
    }).get("features", [])


def pip(lat, lon):
    pt = "POINT(%.6f %.6f)" % (lat, lon)
    fs = get({
        "service": "WFS", "version": "1.1.0", "request": "GetFeature",
        "typeName": "%s,%s" % (L_PR, L_24), "outputFormat": "application/json",
        "CQL_FILTER": "INTERSECTS(geometry, %s);INTERSECTS(geometry, %s)" % (pt, pt),
    }).get("features", [])
    pr = [f for f in fs if f["id"].startswith("parana_solos_")]
    c24 = [f for f in fs if f["id"].startswith("bra_erodibilidade_2024")]
    return pr, c24


def ordens_pr(props):
    return [norm(props.get("ordem_%d" % i)).upper()
            for i in (1, 2, 3) if props.get("ordem_%d" % i)]


def ordens_2024(props):
    """Extrai a ORDEM taxonomica de cada legenda_cN (primeira palavra que seja ordem do SiBCS)."""
    ORDENS = ("LATOSSOLO", "NITOSSOLO", "ARGISSOLO", "NEOSSOLO", "CHERNOSSOLO",
              "CAMBISSOLO", "GLEISSOLO", "PLANOSSOLO", "LUVISSOLO", "VERTISSOLO",
              "ESPODOSSOLO", "PLINTOSSOLO", "ORGANOSSOLO")
    out = []
    for i in (1, 2, 3, 4):
        leg = norm(props.get("legenda_c%d" % i)).upper()
        if not leg:
            continue
        achou = next((o for o in ORDENS if o in leg), None)
        out.append(achou or "?")
    return out


def main():
    print("== 1. listando associacoes na BP3 ==")
    todas = listar_associacoes()
    print("   %d poligonos de associacao" % len(todas))

    por_unidade = defaultdict(list)
    for f in todas:
        p = f["properties"]
        por_unidade[p.get("sbcs")].append((f["id"].split(".")[-1], p))
    print("   %d unidades: %s" % (len(por_unidade),
          ", ".join("%s(%d)" % (k, len(v)) for k, v in sorted(por_unidade.items()))))

    # amostra estratificada: os N maiores em area por unidade (proxy de dispersao geografica)
    selecao = []
    for sbcs, lst in sorted(por_unidade.items()):
        lst2 = sorted(lst, key=lambda t: -(t[1].get("area_km2") or 0))
        passo = max(1, len(lst2) // N_POR_UNIDADE)
        escolhidos = lst2[::passo][:N_POR_UNIDADE]
        for fid, props in escolhidos:
            selecao.append((sbcs, fid, props))
    print("   selecionados %d poligonos (ate %d por unidade)" % (len(selecao), N_POR_UNIDADE))

    print("== 2. buscando geometrias e calculando ponto interior ==")
    pontos = []
    fids = [fid for _, fid, _ in selecao]
    for i in range(0, len(fids), 20):
        lote = fids[i:i + 20]
        for f in geometria_de(lote):
            fid = f["id"].split(".")[-1]
            g = shape(f["geometry"])
            rp = g.representative_point()
            pontos.append({"ogc_fid": fid, "sbcs": f["properties"].get("sbcs"),
                           "ordens_pr_declaradas": ordens_pr(f["properties"]),
                           "lat": round(rp.y, 6), "lon": round(rp.x, 6)})
        time.sleep(0.4)
    print("   %d pontos interiores calculados" % len(pontos))

    print("== 3. consultando ponto-em-poligono nas duas cartas ==")
    res = []
    for k, pt in enumerate(pontos, 1):
        try:
            pr, c24 = pip(pt["lat"], pt["lon"])
        except Exception as e:
            pt["erro"] = "%s: %s" % (type(e).__name__, e)
            res.append(pt)
            continue
        r = dict(pt)
        r["n_pr"] = len(pr)
        r["n_24"] = len(c24)
        if pr:
            pp = pr[0]["properties"]
            r["id_pr"] = pr[0]["id"]
            r["sbcs_pip"] = pp.get("sbcs")
            r["tipo_pip"] = pp.get("tipo_unida")
            r["ordens_pr"] = ordens_pr(pp)
        if c24:
            p24 = c24[0]["properties"]
            r["id_24"] = c24[0]["id"]
            r["cod_um2"] = p24.get("cod_um2")
            r["erod_um"] = p24.get("erod_um")
            r["k_solos"] = p24.get("k_solos")
            r["ordens_24"] = ordens_2024(p24)
            r["erods_24"] = [p24.get("erod_c%d" % i) for i in (1, 2, 3, 4)
                             if p24.get("erod_c%d" % i)]
            niveis = [nivel_k(c) for c in r["erods_24"]]
            r["niveis_24"] = niveis
            validos = [n for n in niveis if n is not None]
            r["n_componentes_24"] = len(r["erods_24"])
            # D08: ambiguidade = componentes atravessam a fronteira de D09
            r["k_ambiguo_oficial"] = (len(set(validos)) > 1) if len(validos) > 1 else False
        if pr and c24:
            a, b = r.get("ordens_pr", []), r.get("ordens_24", [])
            r["match_estrito"] = (a == b)
            r["match_dominante"] = bool(a and b and a[0] == b[0])
            r["tipo_eh_associacao_pip"] = (r.get("tipo_pip") == "associacao")
        res.append(r)
        if k % 5 == 0:
            print("   %d/%d" % (k, len(pontos)))
        time.sleep(0.4)

    # ---- agregados
    usaveis = [r for r in res if r.get("tipo_eh_associacao_pip") and r.get("n_pr") and r.get("n_24")]
    ag = {
        "pontos_consultados": len(res),
        "pontos_usaveis_associacao": len(usaveis),
        "match_estrito_n": sum(1 for r in usaveis if r["match_estrito"]),
        "match_dominante_n": sum(1 for r in usaveis if r["match_dominante"]),
        "k_ambiguo_oficial_n": sum(1 for r in usaveis if r.get("k_ambiguo_oficial")),
        "com_mais_de_1_componente_24": sum(1 for r in usaveis if (r.get("n_componentes_24") or 0) > 1),
    }
    for chave in ("match_estrito_n", "match_dominante_n", "k_ambiguo_oficial_n"):
        ag[chave.replace("_n", "_pct")] = (round(100.0 * ag[chave] / len(usaveis), 1)
                                           if usaveis else None)

    por_u = {}
    for r in usaveis:
        u = r["sbcs"]
        d = por_u.setdefault(u, {"n": 0, "estrito": 0, "dominante": 0, "ambiguo": 0})
        d["n"] += 1
        d["estrito"] += 1 if r["match_estrito"] else 0
        d["dominante"] += 1 if r["match_dominante"] else 0
        d["ambiguo"] += 1 if r.get("k_ambiguo_oficial") else 0

    saida = {
        "gerado_em_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "endpoint": OWS,
        "desenho": {
            "alvo": "unidades pedologicas em associacao na Bacia do Parana 3",
            "bbox_bp3": BBOX_BP3,
            "total_poligonos_associacao_na_bacia": len(todas),
            "unidades_de_associacao_existentes": {k: len(v) for k, v in sorted(por_unidade.items())},
            "n_por_unidade_alvo": N_POR_UNIDADE,
            "atribuicao": "ponto-em-poligono WFS 1.1.0, POINT(lat lon), ponto interior por shapely.representative_point()",
        },
        "agregado": ag,
        "por_unidade": por_u,
        "resultados": res,
    }
    dest = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        "amostra_dirigida_associacoes_2026-09-28.json")
    with open(dest, "w", encoding="utf8") as fh:
        json.dump(saida, fh, ensure_ascii=False, indent=1)

    print()
    print("== AGREGADO ==")
    for k, v in ag.items():
        print("  %-34s %s" % (k, v))
    print()
    print("== POR UNIDADE ==")
    print("  %-10s %4s %8s %10s %8s" % ("unidade", "n", "estrito", "dominante", "ambiguo"))
    for u, d in sorted(por_u.items()):
        print("  %-10s %4d %8d %10d %8d" % (u, d["n"], d["estrito"], d["dominante"], d["ambiguo"]))
    print()
    print("gravado em", dest)


if __name__ == "__main__":
    sys.exit(main())
