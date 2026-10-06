#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SAREL v2 - D26: fracao erodida por celula de 10 m (IMPLEMENTACAO DE REFERENCIA).

Entrada
  --voo        GeoJSON (WGS84) com os poligonos de voo; cada feicao tem properties.Poligono_ID
  --delineacao GeoJSON (WGS84) com as feicoes de erosao delineadas sobre o ortomosaico;
               properties.Poligono_ID e opcional (se ausente, atribui-se por interseccao)
  --grade      JSON {"crs": "EPSG:327xx|EPSG:319xx", "origem_x": n, "origem_y": n, "tamanho_m": 10}
               = grade NATIVA do produto Sentinel-2 L2A do tile (D06). NUNCA assumir EPSG:31982:
               leia o CRS e o transform da banda B4 do tile no GEE (image.projection()) e registre.
Saida
  CSV com Poligono_ID, Celula_ID, X/Y da grade, Lon/Lat, Cobertura_Celula, Fracao_Erodida,
  Area_Delineada_m2, Incluida; e um JSON de conferencia (conservacao de area, area fora do voo).

Nada aqui e evidencia cientifica: o dado de entrada e que determina o resultado.
"""
from __future__ import annotations

import argparse
import json
import math
import sys

import pandas as pd
from pyproj import Proj, Transformer
from shapely import make_valid
from shapely.geometry import box, shape
from shapely.ops import transform as shp_transform, unary_union

COBERTURA_MIN = 0.95   # PROPOSTA (P11), nao decidida: fracao minima da celula dentro do voo


class ErroGrade(Exception):
    pass


def _validar_grade(g: dict) -> dict:
    for k in ("crs", "origem_x", "origem_y", "tamanho_m"):
        if k not in g or g[k] in (None, ""):
            raise ErroGrade(f"grade sem '{k}' (nao ha padrao: leia da banda B4 do tile no GEE)")
    if float(g["tamanho_m"]) != 10.0:
        raise ErroGrade("D06: a unidade de analise e a celula de 10 m")
    return g


def fator_escala_utm(lon: float, lat: float, crs: str) -> float:
    """Fator de escala local k da projecao (D15: tolerancia de 0,5 %)."""
    f = Proj(crs).get_factors(lon, lat)
    return float(f.parallel_scale)


def _para_grade(geom, crs_grade: str):
    t = Transformer.from_crs("EPSG:4326", crs_grade, always_xy=True).transform
    return shp_transform(t, geom)


def calcular_celulas(voo_fc: dict, delin_fc: dict, grade: dict, cobertura_min: float = COBERTURA_MIN):
    grade = _validar_grade(grade)
    crs, ox, oy, s = grade["crs"], float(grade["origem_x"]), float(grade["origem_y"]), 10.0
    para_wgs = Transformer.from_crs(crs, "EPSG:4326", always_xy=True).transform
    delin = []
    for f in delin_fc["features"]:
        g = make_valid(_para_grade(shape(f["geometry"]), crs))
        if not g.is_empty:
            delin.append((f.get("properties", {}).get("Poligono_ID"), g))
    linhas, conf = [], []
    for f in voo_fc["features"]:
        pid = f["properties"]["Poligono_ID"]
        voo = make_valid(_para_grade(shape(f["geometry"]), crs))
        mine = [g for (p, g) in delin if p == pid or (p is None and g.intersects(voo))]
        uni = unary_union(mine) if mine else None          # uniao: sem dupla contagem
        dentro = uni.intersection(voo) if uni is not None else None
        a_total = float(uni.area) if uni is not None else 0.0
        a_dentro = float(dentro.area) if dentro is not None else 0.0
        minx, miny, maxx, maxy = voo.bounds
        i0, i1 = math.floor((minx - ox) / s), math.ceil((maxx - ox) / s)
        j0, j1 = math.floor((miny - oy) / s), math.ceil((maxy - oy) / s)
        soma_incl = soma_excl = 0.0
        for i in range(i0, i1):
            for j in range(j0, j1):
                cel = box(ox + i * s, oy + j * s, ox + (i + 1) * s, oy + (j + 1) * s)
                parte = cel.intersection(voo)
                if parte.is_empty:
                    continue
                cob = parte.area / cel.area
                if cob < 1e-6:        # fiapo numerico da ida-e-volta WGS84<->grade (< 1e-4 m2), nao e celula
                    continue
                a_del = float(parte.intersection(dentro).area) if dentro is not None and not dentro.is_empty else 0.0
                frac = a_del / parte.area            # fracao da porcao OBSERVADA da celula
                incl = cob >= cobertura_min - 1e-12
                if incl:
                    soma_incl += a_del
                else:
                    soma_excl += a_del
                lon, lat = para_wgs(*cel.centroid.coords[0])
                linhas.append(dict(Poligono_ID=pid, Celula_ID=f"{pid}_{i}_{j}", Grade_X=cel.centroid.x,
                                   Grade_Y=cel.centroid.y, Lon=lon, Lat=lat, Cobertura_Celula=round(cob, 6),
                                   Fracao_Erodida=min(1.0, max(0.0, frac)), Area_Delineada_m2=a_del, Incluida=bool(incl)))
        conf.append(dict(Poligono_ID=pid, area_delineada_total_m2=a_total, area_delineada_dentro_voo_m2=a_dentro,
                         area_delineada_fora_voo_m2=a_total - a_dentro, soma_celulas_incluidas_m2=soma_incl,
                         soma_celulas_excluidas_m2=soma_excl,
                         residuo_conservacao_m2=a_dentro - soma_incl - soma_excl))
    return pd.DataFrame(linhas), conf


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Fracao erodida por celula de 10 m (D26)")
    ap.add_argument("--voo", required=True)
    ap.add_argument("--delineacao", required=True)
    ap.add_argument("--grade", required=True)
    ap.add_argument("--saida-csv", required=True)
    ap.add_argument("--saida-conferencia", required=True)
    ap.add_argument("--cobertura-min", type=float, default=COBERTURA_MIN)
    a = ap.parse_args(argv)
    load = lambda p: json.load(open(p, encoding="utf-8"))
    df, conf = calcular_celulas(load(a.voo), load(a.delineacao), load(a.grade), a.cobertura_min)
    df.to_csv(a.saida_csv, index=False, encoding="utf-8")
    json.dump({"cobertura_min": a.cobertura_min, "poligonos": conf, "n_celulas": int(len(df)),
               "n_incluidas": int(df["Incluida"].sum())}, open(a.saida_conferencia, "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except ErroGrade as e:
        print(f"[ERRO] {e}", file=sys.stderr)
        sys.exit(2)
