# -*- coding: utf-8 -*-
"""Verificacao independente da Tarefa 1 do relatorio do executor.

Recomputa, para cada um dos 20 segmentos declarados, a razao
comprimento_projetado / comprimento_geodesico em EPSG:31982, e compara
com o valor que o relatorio afirma.
"""
import os
# Isolar PROJ_LIB do PostgreSQL/PostGIS (colisao conhecida neste ambiente)
for v in ("PROJ_LIB", "PROJ_DATA", "GDAL_DATA"):
    os.environ.pop(v, None)

from pyproj import Geod, CRS, Transformer
import math

geod = Geod(ellps="GRS80")
crs = CRS.from_epsg(31982)
tf = Transformer.from_crs("EPSG:4674", crs, always_xy=True)

# (id, lat1, lon1, lat2, lon2, geod_relatado, proj_relatado, dif_rel_relatada_pct)
SEG = [
 ("S01", -25.4631, -54.6199, -25.4631, -54.6099, 1005.689, 1006.929, +0.1233),
 ("S02", -25.4631, -54.6199, -25.4531, -54.6199, 1107.800, 1109.166, +0.1233),
 ("S03", -25.4631, -54.6199, -25.4551, -54.6099, 1340.342, 1341.994, +0.1233),
 ("S04", -25.5161, -54.6011, -25.5081, -54.5911, 1339.969, 1341.585, +0.1206),
 ("S05", -25.5825, -54.5881, -25.5725, -54.5781, 1494.640, 1496.413, +0.1186),
 ("S06", -25.3511, -54.4875, -25.3411, -54.4775, 1496.269, 1497.832, +0.1045),
 ("S07", -25.2528, -54.4322, -25.2428, -54.4222, 1496.958, 1498.409, +0.0969),
 ("S08", -25.0844, -54.3958, -25.0744, -54.3858, 1498.134, 1499.514, +0.0921),
 ("S09", -24.8531, -54.3622, -24.8431, -54.3522, 1499.740, 1501.059, +0.0880),
 ("S10", -24.6961, -54.3164, -24.6861, -54.3064, 1500.822, 1502.054, +0.0821),
 ("S11", -24.5133, -54.3156, -24.5033, -54.3056, 1502.075, 1503.311, +0.0823),
 ("S12", -24.2819, -54.2906, -24.2719, -54.2806, 1503.650, 1504.844, +0.0794),
 ("S13", -24.0611, -54.2586, -24.0511, -54.2486, 1505.143, 1506.280, +0.0755),
 ("S14", -24.1600, -53.8600, -24.1500, -53.8500, 1504.476, 1504.909, +0.0288),
 ("S15", -24.6200, -53.7100, -24.6100, -53.7000, 1501.345, 1501.529, +0.0123),
 ("S16", -24.7250, -53.7400, -24.7150, -53.7300, 1500.623, 1500.855, +0.0155),
 ("S17", -25.1500, -53.8500, -25.1400, -53.8400, 1497.677, 1498.075, +0.0266),
 ("S18", -24.9558, -53.4550, -24.9458, -53.4450, 1499.029, 1498.495, -0.0356),
 ("S19", -25.0800, -53.6200, -25.0700, -53.6100, 1498.165, 1498.203, +0.0026),
 ("S20", -25.3800, -54.0500, -25.3700, -54.0400, 1496.067, 1496.794, +0.0486),
]

print("%-5s %10s %10s %9s %9s %8s %s" % (
    "id", "geod_m", "proj_m", "dif_%", "relat_%", "erro_pp", "veredito"))
maxdif = 0.0
maxid = None
divergentes = []
for sid, la1, lo1, la2, lo2, g_rel, p_rel, d_rel in SEG:
    _, _, g = geod.inv(lo1, la1, lo2, la2)
    x1, y1 = tf.transform(lo1, la1)
    x2, y2 = tf.transform(lo2, la2)
    p = math.hypot(x2 - x1, y2 - y1)
    d = (p / g - 1.0) * 100.0
    if abs(d) > maxdif:
        maxdif, maxid = abs(d), sid
    erro = d - d_rel
    ok = abs(erro) < 0.005          # 0,005 pp de tolerancia
    if not ok:
        divergentes.append((sid, d, d_rel, erro))
    print("%-5s %10.3f %10.3f %+9.4f %+9.4f %+8.4f %s" % (
        sid, g, p, d, d_rel, erro, "ok" if ok else "DIVERGE"))

print()
print("Distorcao relativa maxima recomputada: %+.4f%% em %s" % (maxdif, maxid))
print("Tolerancia de D15: 0,5%%  ->  %s" % ("CONFIRMA EPSG:31982" if maxdif < 0.5 else "REPROVA"))
print()
print("Segmentos divergentes do relatorio: %d de %d" % (len(divergentes), len(SEG)))
for sid, d, d_rel, erro in divergentes:
    print("  %s: recomputado %+.4f%%, relatado %+.4f%% (erro %+.4f pp)" % (sid, d, d_rel, erro))
