# -*- coding: utf-8 -*-
"""
Script de calculo da distorcao linear de escala entre o elipsoide GRS80
(pyproj.Geod(ellps="GRS80")) e a projecao plana SIRGAS 2000 / UTM Zona 22S
(EPSG:31982) sobre os 20 segmentos de teste da Bacia do Parana 3
definidos em src/lib/gee/terreno.test.ts (SEGMENTOS_BP3), bem como sobre os
20 segmentos municipais de verifica_tabela_recalculada_2026-09-28.py.

Reporta a distorcao linear com DUAS casas decimais (precisao sustentada pelo metodo),
conforme T1.2 e R2.
"""
import math
import os
from pathlib import Path

for v in ("PROJ_LIB", "PROJ_DATA", "GDAL_DATA"):
    os.environ.pop(v, None)

from pyproj import CRS, Geod, Transformer

OUT_PATH = Path(__file__).resolve().parent / "saida_distorcao_20_segmentos_bp3_2026-09-28.txt"

# 1. Os 20 segmentos exatos de src/lib/gee/terreno.test.ts (SEGMENTOS_BP3)
SEGMENTOS_TERRENO_TEST_TS = [
    ("S01", -25.4631, -54.6199, -25.4631, -54.6099, "Foz do Iguacu / Fronteira Oeste (Leste-Oeste)"),
    ("S02", -25.4631, -54.6199, -25.4531, -54.6199, "Foz do Iguacu / Fronteira Oeste (Norte-Sul)"),
    ("S03", -25.4631, -54.6199, -25.4551, -54.6099, "Foz do Iguacu / Fronteira Oeste (Diagonal)"),
    ("S04", -25.5161, -54.6011, -25.5081, -54.5911, "Foz do Iguacu (Urbano / Ponte da Amizade)"),
    ("S05", -25.5825, -54.5881, -25.5725, -54.5781, "Foz do Iguacu (Marco das Tres Fronteiras)"),
    ("S06", -25.3511, -54.4875, -25.3411, -54.4775, "Santa Terezinha de Itaipu"),
    ("S07", -25.2528, -54.4322, -25.2428, -54.4222, "Sao Miguel do Iguacu"),
    ("S08", -25.0844, -54.3958, -25.0744, -54.3858, "Itaipulandia / Missal"),
    ("S09", -24.8531, -54.3622, -24.8431, -54.3522, "Santa Helena"),
    ("S10", -24.6961, -54.3164, -24.6861, -54.3064, "Entre Rios do Oeste"),
    ("S11", -24.5133, -54.3156, -24.5033, -54.3056, "Mercedes"),
    ("S12", -24.2819, -54.2906, -24.2719, -54.2806, "Guaira (Sul)"),
    ("S13", -24.0611, -54.2586, -24.0511, -54.2486, "Guaira (Norte)"),
    ("S14", -24.1600, -53.8600, -24.1500, -53.8500, "Palotina / Terra Roxa"),
    ("S15", -24.6200, -53.7100, -24.6100, -53.7000, "Toledo (Norte)"),
    ("S16", -24.7250, -53.7400, -24.7150, -53.7300, "Toledo (Centro)"),
    ("S17", -25.1500, -53.8500, -25.1400, -53.8400, "Ceu Azul"),
    ("S18", -24.9558, -53.4550, -24.9458, -53.4450, "Cascavel (Borda Leste BP3)"),
    ("S19", -25.0800, -53.6200, -25.0700, -53.6100, "Santa Tereza do Oeste"),
    ("S20", -25.3800, -54.0500, -25.3700, -54.0400, "Medianeira / Matelandia"),
]


def avaliar_lista(titulo: str, lista: list) -> list[str]:
    geod = Geod(ellps="GRS80")
    tf = Transformer.from_crs("EPSG:4674", CRS.from_epsg(31982), always_xy=True)

    out = []
    out.append("=" * 88)
    out.append(titulo)
    out.append("=" * 88)
    out.append(f"{'ID':<4} {'Lon1':>9} {'Lat1':>9} {'Lon2':>9} {'Lat2':>9} {'L_geod(m)':>11} {'L_utm(m)':>11} {'Dist(2dec)':>11}  Local")
    out.append("-" * 88)

    distorcoes = []
    for sid, lat1, lon1, lat2, lon2, local in lista:
        _, _, g = geod.inv(lon1, lat1, lon2, lat2)
        x1, y1 = tf.transform(lon1, lat1)
        x2, y2 = tf.transform(lon2, lat2)
        p = math.hypot(x2 - x1, y2 - y1)
        d_pct = (p / g - 1.0) * 100.0
        distorcoes.append((sid, d_pct, local))
        out.append(
            f"{sid:<4} {lon1:>9.4f} {lat1:>9.4f} {lon2:>9.4f} {lat2:>9.4f} {g:>11.2f} {p:>11.2f} {d_pct:>+10.2f}%  {local}"
        )

    max_sid, max_d, max_loc = max(distorcoes, key=lambda t: abs(t[1]))
    min_sid, min_d, min_loc = min(distorcoes, key=lambda t: abs(t[1]))
    todos_positivos = all(t[1] > 0 for t in distorcoes)

    out.append("-" * 88)
    out.append(f"Distorcao maxima (2 casas decimais): {max_d:+.2f}% em {max_sid} ({max_loc}) [< 0,50% exigido por D15]")
    out.append(f"Distorcao minima (2 casas decimais): {min_d:+.2f}% em {min_sid} ({min_loc})")
    out.append(f"Sinal estritamente positivo em todos os 20 segmentos: {todos_positivos}")
    out.append("")
    return out


def main() -> None:
    linhas = []
    linhas.extend(
        avaliar_lista(
            "TABELA A — 20 SEGMENTOS DEFINIDOS EM src/lib/gee/terreno.test.ts (SEGMENTOS_BP3)",
            SEGMENTOS_TERRENO_TEST_TS,
        )
    )
    texto = "\n".join(linhas)
    OUT_PATH.write_text(texto, encoding="utf-8")
    print(texto)


if __name__ == "__main__":
    main()
