#!/usr/bin/env python3
"""
Script de conferência ao vivo da ordem dos eixos no WFS 1.1.0 GetFeature (V3.3).

Consulta um conjunto de coordenadas agrícolas conhecidas na Bacia do Paraná 3 via:
  service=WFS & version=1.1.0 & request=GetFeature
  typeName=geonode:parana_solos_20201105,geonode:bra_erodibilidade_2024_sirgas2000,geonode:brasil_erodibilidade_solo
  CQL_FILTER=INTERSECTS(geometry, POINT(<lat> <lon>));INTERSECTS(geometry, POINT(<lat> <lon>));INTERSECTS(geometry, POINT(<lat> <lon>))

FALHA (exit code 1) se qualquer coordenada agrícola conhecida devolver ZERO feições
nas três camadas (assinatura clássica de inversão de eixos POINT(lon lat) na WFS 1.1.0)
ou se faltar qualquer uma das três camadas esperadas.
"""

import json
import sys
import urllib.parse
import urllib.request

OWS_URL = "https://geoinfo.dados.embrapa.br/geoserver/ows"
TYPE_NAMES = (
    "geonode:parana_solos_20201105,"
    "geonode:bra_erodibilidade_2024_sirgas2000,"
    "geonode:brasil_erodibilidade_solo"
)

COORDENADAS_AGRICOLAS_CONHECIDAS = [
    ("R01_Toledo_Rural_Norte", -24.6200, -53.7100),
    ("R05_MarechalCandidoRondon_Rural_Leste", -24.5300, -53.9800),
    ("R08_NovaSantaRosa_Rural_Norte", -24.4300, -53.9200),
    ("R13_SantaHelena_Rural_Leste", -24.8800, -54.2600),
    ("R20_SantaTerezinhaItaipu_Rural_Norte", -25.3800, -54.4200),
]


def build_get_feature_pip_url(lat: float, lon: float) -> str:
    cql_single = f"INTERSECTS(geometry, POINT({lat} {lon}))"
    cql_filter = f"{cql_single};{cql_single};{cql_single}"
    params = {
        "service": "WFS",
        "version": "1.1.0",
        "request": "GetFeature",
        "typeName": TYPE_NAMES,
        "outputFormat": "application/json",
        "CQL_FILTER": cql_filter,
    }
    return f"{OWS_URL}?{urllib.parse.urlencode(params)}"


def main() -> int:
    erros = []
    for pid, lat, lon in COORDENADAS_AGRICOLAS_CONHECIDAS:
        url = build_get_feature_pip_url(lat, lon)
        req = urllib.request.Request(url, headers={"User-Agent": "SAREL-PPGTCA-2026-AxisCheck/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = json.loads(resp.read().decode("utf-8"))

        features = payload.get("features", [])
        n_pr = sum(1 for f in features if str(f.get("id", "")).startswith("parana_solos_"))
        n_24 = sum(1 for f in features if str(f.get("id", "")).startswith("bra_erodibilidade_2024"))
        n_br = sum(1 for f in features if str(f.get("id", "")).startswith("brasil_erodibilidade_solo"))

        print(
            f"[CONFERENCIA WFS 1.1.0] {pid} ({lat}, {lon}) -> total={len(features)} "
            f"(parana_solos={n_pr}, bra_erodibilidade_2024={n_24}, brasil_erodibilidade_solo={n_br})"
        )

        if len(features) == 0:
            erros.append(
                f"ERRO CRITICO (possivel inversao de eixos POINT(lon lat) na WFS 1.1.0): "
                f"{pid} ({lat}, {lon}) devolveu ZERO feicoes nas 3 camadas!"
            )
        elif n_pr == 0 or n_24 == 0 or n_br == 0:
            erros.append(
                f"ERRO DE COBERTURA: {pid} ({lat}, {lon}) devolveu n_pr={n_pr}, n_24={n_24}, n_br={n_br}"
            )

    if erros:
        for e in erros:
            print(e, file=sys.stderr)
        return 1

    print("OK: Todas as coordenadas agricolas conhecidas retornaram feicoes nas 3 camadas com POINT(lat lon).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
