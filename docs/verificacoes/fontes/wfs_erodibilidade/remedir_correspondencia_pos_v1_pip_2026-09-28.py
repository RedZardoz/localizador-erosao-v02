#!/usr/bin/env python3
"""
Remedição ao vivo (terceira medição — V4) sobre as MESMAS 20 coordenadas rurais
(R01..R20) e 2 pontos de controle (C01..C02) da Bacia do Paraná 3.

Compara três colunas lado a lado:
  1. ANTES DE U1 (primeira feição de GetFeatureInfo com bbox)
  2. DEPOIS DE U1 (heurística de preferência por feição com solo no GetFeatureInfo com bbox)
  3. DEPOIS DE V1 (atribuição determinística por ponto-em-polígono via WFS 1.1.0 GetFeature
     com CQL_FILTER=INTERSECTS(geometry, POINT(<lat> <lon>)) nas três camadas)

NÃO sobrescreve relatorio_correspondencia_bp3_2026-09-28.{json,txt} nem
relatorio_correspondencia_bp3_pos_u1_2026-09-28.{json,txt}.
Salva:
  - docs/verificacoes/fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_v1_pip_2026-09-28.json
  - docs/verificacoes/fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_v1_pip_2026-09-28.txt
  - docs/verificacoes/fontes/wfs_erodibilidade/getfeature_pip_3camadas_r13_bp3.json
"""

import json
import os
import unicodedata
import urllib.parse
import urllib.request
from datetime import datetime, timezone

OWS_URL = "https://geoinfo.dados.embrapa.br/geoserver/ows"
TYPE_NAMES = (
    "geonode:parana_solos_20201105,"
    "geonode:bra_erodibilidade_2024_sirgas2000,"
    "geonode:brasil_erodibilidade_solo"
)

PONTOS_BP3 = [
    ("R01_Toledo_Rural_Norte", -24.6200, -53.7100, "rural"),
    ("R02_Cascavel_Rural_Oeste_RRe12", -25.066904, -53.688038, "rural"),
    ("R03_Palotina_Rural_Leste", -24.2860, -53.7500, "rural"),
    ("R04_AssisChateaubriand_Sul", -24.4200, -53.8200, "rural"),
    ("R05_MarechalCandidoRondon_Rural_Leste", -24.5300, -53.9800, "rural"),
    ("R06_TerraRoxa_Rural_Sul", -24.2200, -54.0800, "rural"),
    ("R07_Guaira_Rural_Sudeste", -24.1800, -54.1800, "rural"),
    ("R08_NovaSantaRosa_Rural_Norte", -24.4300, -53.9200, "rural"),
    ("R09_QuatroPontes_Rural_Sul", -24.6100, -53.9600, "rural"),
    ("R10_Mercedes_Rural_Leste", -24.4500, -54.1000, "rural"),
    ("R11_PatoBragado_Rural_Leste", -24.6300, -54.1700, "rural"),
    ("R12_EntreRiosDoOeste_Rural_Leste", -24.7000, -54.1800, "rural"),
    ("R13_SantaHelena_Rural_Leste", -24.8800, -54.2600, "rural"),
    ("R14_Missal_Rural_Leste", -25.0900, -54.1900, "rural"),
    ("R15_Itaipulandia_Rural_Norte", -25.1000, -54.4200, "rural"),
    ("R16_SaoMiguelDoIguacu_Rural_Norte", -25.2800, -54.2200, "rural"),
    ("R17_Medianeira_Rural_Norte", -25.2200, -54.0800, "rural"),
    ("R18_CeuAzul_Rural_Sul", -25.1900, -53.8400, "rural"),
    ("R19_Matelandia_Rural_Norte", -25.1800, -53.9800, "rural"),
    ("R20_SantaTerezinhaItaipu_Rural_Norte", -25.3800, -54.4200, "rural"),
    ("C01_Palotina_Urbano", -24.2860, -53.8400, "controle_urbano"),
    ("C02_SantaHelena_CorpoDagua", -24.8531, -54.3622, "controle_agua"),
]

ORDENS_SIBCS = [
    "LATOSSOLO",
    "NITOSSOLO",
    "ARGISSOLO",
    "NEOSSOLO",
    "CHERNOSSOLO",
    "CAMBISSOLO",
    "GLEISSOLO",
    "PLINTOSSOLO",
    "PLANOSSOLO",
    "ORGANOSSOLO",
    "ESPODOSSOLO",
    "LUVISSOLO",
    "VERTISSOLO",
]


def norm_ascii(val):
    if not val:
        return ""
    s = str(val).strip().upper()
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def eh_nao_solo(val):
    s = norm_ascii(val)
    if not s:
        return False
    return (
        "AREA URBANA" in s
        or "CORPO D'AGUA" in s
        or "CORPO DAGUA" in s
        or "CORPOS D'AGUA" in s
        or "CORPOS DAGUA" in s
        or s == "AGUA"
        or s == "AGUA_EXTERNA"
        or "AFLORAMENTO DE ROCHA" in s
        or "AFLORAMENTOS DE ROCHA" in s
        or s == "DUNAS"
        or s == "PRAIAS"
    )


def extrair_ordem(legenda):
    s = norm_ascii(legenda)
    if not s or eh_nao_solo(s):
        return None
    for ordem in ORDENS_SIBCS:
        if ordem in s:
            return ordem
    return None


def extrair_ordens_pr(props):
    if not props:
        return []
    res = []
    for k in ("ordem_1", "ordem_2", "ordem_3"):
        o = extrair_ordem(props.get(k))
        if o:
            res.append(o)
    return res


def extrair_ordens_2024(props):
    if not props:
        return []
    res = []
    for k in ("legenda_c1", "legenda_c2", "legenda_c3", "legenda_c4"):
        o = extrair_ordem(props.get(k))
        if o:
            res.append(o)
    return res


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


def classificar_via_k_d14(props_pr, props_2024, props_br, multiplas_mesma_camada: bool):
    if multiplas_mesma_camada:
        return ("indisponivel_fronteira_exata", None)

    if not props_pr or not extrair_ordens_pr(props_pr):
        return ("indisponivel_fora_do_dominio", None)

    if props_2024 is not None:
        erod_um = str(props_2024.get("erod_um") or "").strip()
        if eh_nao_solo(erod_um):
            return ("indisponivel_fora_do_dominio", None)
        k_solos = props_2024.get("k_solos")
        if isinstance(k_solos, (int, float)):
            if k_solos == 0:
                return ("indisponivel_fora_do_dominio", None)
            if k_solos > 0:
                return ("k_solos_camada_2024_tabelado", float(k_solos))

    if props_br is not None:
        classe_br = str(props_br.get("classe") or "").strip()
        if eh_nao_solo(classe_br):
            return ("indisponivel_fora_do_dominio", None)
        if classe_br:
            return ("fallback_faixa_classe_d14", None)

    return ("indisponivel_sem_cobertura", None)


def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))

    # Carrega o relatório pos_u1 existente (que já traz ANTES de U1 e DEPOIS de U1) sem modificá-lo
    pos_u1_path = os.path.join(out_dir, "relatorio_correspondencia_bp3_pos_u1_2026-09-28.json")
    with open(pos_u1_path, "r", encoding="utf-8") as f:
        relatorio_pos_u1 = json.load(f)

    mapa_pos_u1 = {r["nome"]: r for r in relatorio_pos_u1["pontos"]}

    resultados_v1 = []
    fixture_r13_pip = None

    for pid, lat, lon, categoria in PONTOS_BP3:
        url = build_get_feature_pip_url(lat, lon)
        req = urllib.request.Request(url, headers={"User-Agent": "SAREL-PPGTCA-2026-V1-PIP/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = json.loads(resp.read().decode("utf-8"))

        # Remove geometria pesada para manter o artefato compacto
        features_compact = []
        for feat in payload.get("features", []):
            features_compact.append(
                {
                    "type": feat.get("type", "Feature"),
                    "id": feat.get("id"),
                    "geometry": None,
                    "geometry_name": feat.get("geometry_name", "geometry"),
                    "properties": feat.get("properties", {}),
                }
            )

        if pid == "R13_SantaHelena_Rural_Leste":
            fixture_r13_pip = {
                "type": "FeatureCollection",
                "url_getfeature_wfs_110": url,
                "features": features_compact,
            }

        f_pr = [f for f in features_compact if str(f.get("id", "")).startswith("parana_solos_")]
        f_24 = [f for f in features_compact if str(f.get("id", "")).startswith("bra_erodibilidade_2024")]
        f_br = [f for f in features_compact if str(f.get("id", "")).startswith("brasil_erodibilidade_solo")]

        multiplas_mesma_camada = len(f_pr) > 1 or len(f_24) > 1 or len(f_br) > 1
        zero_feicoes_total = len(features_compact) == 0
        zero_feicoes_pr = len(f_pr) == 0

        # Causa de zero feições ou não-solo (V3.1)
        causa_zero_ou_nao_solo = None
        if zero_feicoes_total:
            causa_zero_ou_nao_solo = "zero-feicoes-todas-camadas-possivel-agua-ou-fora-cobertura"
        elif zero_feicoes_pr:
            causa_zero_ou_nao_solo = "fora-cobertura-camada-estadual-ou-lacuna-pr"

        pr_props = f_pr[0]["properties"] if len(f_pr) == 1 else None
        e24_props = f_24[0]["properties"] if len(f_24) == 1 else None
        ebr_props = f_br[0]["properties"] if len(f_br) == 1 else None

        ordens_pr = extrair_ordens_pr(pr_props) if pr_props else []
        ordens_24 = extrair_ordens_2024(e24_props) if e24_props else []

        if pr_props and not ordens_pr:
            sbcs_val = str(pr_props.get("sbcs") or "")
            if eh_nao_solo(sbcs_val) or eh_nao_solo(str(pr_props.get("legenda") or "")):
                causa_zero_ou_nao_solo = f"dentro-cobertura-categoria-nao-solo:{sbcs_val}"

        solo_em_ambas = (
            not multiplas_mesma_camada
            and len(ordens_pr) > 0
            and len(ordens_24) > 0
            and not eh_nao_solo(e24_props.get("erod_um") if e24_props else "")
        )
        match_estrito = solo_em_ambas and (ordens_pr == ordens_24)
        match_dominante = solo_em_ambas and (ordens_pr[0] == ordens_24[0])
        via_k, k_num = classificar_via_k_d14(pr_props, e24_props, ebr_props, multiplas_mesma_camada)

        prev = mapa_pos_u1[pid]
        pos_u1_eval = prev["depois_u1"]
        mudou_u1_para_v1 = (
            (pos_u1_eval["sbcs_pr"] != (pr_props.get("sbcs") if pr_props else None))
            or (pos_u1_eval["cod_um_2024"] != (e24_props.get("cod_um") if e24_props else None))
            or (pos_u1_eval["match_estrito"] != match_estrito)
            or (pos_u1_eval["solo_em_ambas"] != solo_em_ambas)
        )

        resultados_v1.append(
            {
                "id": pid,
                "lat": lat,
                "lon": lon,
                "categoria": categoria,
                "url_getfeature_wfs_110": url,
                "n_feicoes_pr_pip": len(f_pr),
                "n_feicoes_2024_pip": len(f_24),
                "n_feicoes_br_pip": len(f_br),
                "multiplas_feicoes_mesma_camada": multiplas_mesma_camada,
                "zero_feicoes_total": zero_feicoes_total,
                "zero_feicoes_pr": zero_feicoes_pr,
                "causa_zero_ou_nao_solo": causa_zero_ou_nao_solo,
                "era_fronteira_bbox_u1": prev["ponto_em_fronteira_pr"],
                "mudou_de_pos_u1_para_pos_v1": mudou_u1_para_v1,
                "antes_u1": prev["antes_u1"],
                "depois_u1": prev["depois_u1"],
                "depois_v1_pip": {
                    "id_feicao_pr": f_pr[0]["id"] if len(f_pr) == 1 else None,
                    "sbcs_pr": pr_props.get("sbcs") if pr_props else None,
                    "tipo_pr": pr_props.get("tipo_unida") if pr_props else None,
                    "ordens_pr": ordens_pr,
                    "id_feicao_2024": f_24[0]["id"] if len(f_24) == 1 else None,
                    "ogc_fid_2024": e24_props.get("ogc_fid") if e24_props else None,
                    "cod_um_2024": e24_props.get("cod_um") if e24_props else None,
                    "cod_um2_2024": e24_props.get("cod_um2") if e24_props else None,
                    "ordens_2024": ordens_24,
                    "erod_c1_2024": e24_props.get("erod_c1") if e24_props else None,
                    "erod_um_2024": e24_props.get("erod_um") if e24_props else None,
                    "k_solos_2024": e24_props.get("k_solos") if e24_props else None,
                    "fator_k_um_2024": e24_props.get("fator_k_um") if e24_props else None,
                    "classe_erod_br": ebr_props.get("classe") if ebr_props else None,
                    "solo_em_ambas": solo_em_ambas,
                    "match_estrito": match_estrito,
                    "match_dominante": match_dominante,
                    "via_fator_k_d14": via_k,
                    "k_numerico_d14": k_num,
                },
            }
        )

    rurais = [r for r in resultados_v1 if r["categoria"] == "rural"]

    def resumir_coluna(chave: str):
        com_solo = [r for r in rurais if r[chave]["solo_em_ambas"]]
        estritos = [r for r in com_solo if r[chave]["match_estrito"]]
        dominantes = [r for r in com_solo if r[chave]["match_dominante"]]
        divergentes = [r for r in com_solo if not r[chave]["match_estrito"]]
        associacoes_pr = [
            r for r in com_solo if norm_ascii(r[chave]["tipo_pr"] or "") == "ASSOCIACAO"
        ]
        associacoes_estritas = [
            r for r in associacoes_pr if r[chave]["match_estrito"]
        ]
        vias_k = {}
        for r in rurais:
            vk = r[chave]["via_fator_k_d14"]
            vias_k[vk] = vias_k.get(vk, 0) + 1

        n_solo = len(com_solo)
        return {
            "total_rurais": len(rurais),
            "rurais_com_solo_em_ambas": n_solo,
            "correspondencia_estrita_n": len(estritos),
            "correspondencia_estrita_pct": round(100.0 * len(estritos) / n_solo, 1) if n_solo else 0.0,
            "correspondencia_dominante_n": len(dominantes),
            "correspondencia_dominante_pct": round(100.0 * len(dominantes) / n_solo, 1) if n_solo else 0.0,
            "divergencia_n": len(divergentes),
            "divergencia_pct": round(100.0 * len(divergentes) / n_solo, 1) if n_solo else 0.0,
            "associacoes_pr_n": len(associacoes_pr),
            "associacoes_correspondencia_estrita_n": len(associacoes_estritas),
            "associacoes_correspondencia_estrita_pct": (
                round(100.0 * len(associacoes_estritas) / len(associacoes_pr), 1)
                if associacoes_pr
                else 0.0
            ),
            "contagem_vias_fator_k_d14": vias_k,
        }

    resumo_antes_u1 = resumir_coluna("antes_u1")
    resumo_depois_u1 = resumir_coluna("depois_u1")
    resumo_depois_v1 = resumir_coluna("depois_v1_pip")

    setes_fronteira_u1 = [r for r in rurais if r["era_fronteira_bbox_u1"]]
    mudaram_entre_7_fronteira = [
        r["id"] for r in setes_fronteira_u1 if r["mudou_de_pos_u1_para_pos_v1"]
    ]
    mudaram_todos_rurais = [r["id"] for r in rurais if r["mudou_de_pos_u1_para_pos_v1"]]
    exatamente_sobre_fronteira_rurais = [
        r["id"] for r in rurais if r["multiplas_feicoes_mesma_camada"]
    ]
    zero_feicoes_rurais = [
        r["id"] for r in rurais if r["zero_feicoes_total"] or r["zero_feicoes_pr"]
    ]

    relatorio_final = {
        "gerado_em_utc": datetime.now(timezone.utc).isoformat(),
        "endpoint_wfs": OWS_URL,
        "mecanismo_v1": (
            "service=WFS&version=1.1.0&request=GetFeature&"
            "typeName=geonode:parana_solos_20201105,geonode:bra_erodibilidade_2024_sirgas2000,geonode:brasil_erodibilidade_solo&"
            "outputFormat=application/json&"
            "CQL_FILTER=INTERSECTS(geometry, POINT(<lat> <lon>));INTERSECTS(geometry, POINT(<lat> <lon>));INTERSECTS(geometry, POINT(<lat> <lon>))"
        ),
        "exemplo_url_r13": fixture_r13_pip["url_getfeature_wfs_110"] if fixture_r13_pip else "",
        "comparativo_3_colunas": {
            "antes_u1": resumo_antes_u1,
            "depois_u1": resumo_depois_u1,
            "depois_v1_pip": resumo_depois_v1,
        },
        "destino_7_pontos_fronteira_u1": {
            "total_fronteira_bbox_u1": len(setes_fronteira_u1),
            "lista_7_fronteira_u1": [r["id"] for r in setes_fronteira_u1],
            "mudaram_de_pos_u1_para_pos_v1": mudaram_entre_7_fronteira,
            "mudaram_todos_rurais_pos_u1_para_pos_v1": mudaram_todos_rurais,
        },
        "casos_fronteira_exata_e_zero_feicoes": {
            "rurais_multiplas_feicoes_mesma_camada": exatamente_sobre_fronteira_rurais,
            "rurais_zero_feicoes": zero_feicoes_rurais,
            "controles_detalhe": [
                {
                    "id": r["id"],
                    "n_feicoes_pr_pip": r["n_feicoes_pr_pip"],
                    "n_feicoes_2024_pip": r["n_feicoes_2024_pip"],
                    "n_feicoes_br_pip": r["n_feicoes_br_pip"],
                    "causa_zero_ou_nao_solo": r["causa_zero_ou_nao_solo"],
                    "sbcs_pr": r["depois_v1_pip"]["sbcs_pr"],
                    "cod_um_2024": r["depois_v1_pip"]["cod_um_2024"],
                    "cod_um2_2024": r["depois_v1_pip"]["cod_um2_2024"],
                    "erod_um_2024": r["depois_v1_pip"]["erod_um_2024"],
                    "k_solos_2024": r["depois_v1_pip"]["k_solos_2024"],
                    "via_fator_k_d14": r["depois_v1_pip"]["via_fator_k_d14"],
                }
                for r in resultados_v1
                if r["categoria"] != "rural"
            ],
        },
        "resultados": resultados_v1,
    }

    json_path = os.path.join(out_dir, "relatorio_correspondencia_bp3_pos_v1_pip_2026-09-28.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(relatorio_final, f, ensure_ascii=False, indent=2)

    if fixture_r13_pip is not None:
        r13_path = os.path.join(out_dir, "getfeature_pip_3camadas_r13_bp3.json")
        with open(r13_path, "w", encoding="utf-8") as f:
            json.dump(fixture_r13_pip, f, ensure_ascii=False, indent=2)

    linhas = []
    linhas.append("========================================================================================")
    linhas.append("REMEDICAO DE CORRESPONDENCIA POS-V1 (PONTO-EM-POLIGONO WFS 1.1.0) — 28/09/2026")
    linhas.append("========================================================================================")
    linhas.append(f"URL GetFeature WFS 1.1.0 (R13 -24.88, -54.26): {relatorio_final['exemplo_url_r13']}")
    linhas.append("")
    linhas.append("--- COMPARATIVO DE 3 COLUNAS (20 PONTOS RURAIS BP3) ---")
    linhas.append(
        f"Solo mapeado em ambas as cartas: "
        f"ANTES_U1 = {resumo_antes_u1['rurais_com_solo_em_ambas']}/20 | "
        f"DEPOIS_U1 = {resumo_depois_u1['rurais_com_solo_em_ambas']}/20 | "
        f"DEPOIS_V1_PIP = {resumo_depois_v1['rurais_com_solo_em_ambas']}/20"
    )
    linhas.append(
        f"Correspondencia estrita de sequencia: "
        f"ANTES_U1 = {resumo_antes_u1['correspondencia_estrita_n']}/{resumo_antes_u1['rurais_com_solo_em_ambas']} ({resumo_antes_u1['correspondencia_estrita_pct']}%) | "
        f"DEPOIS_U1 = {resumo_depois_u1['correspondencia_estrita_n']}/{resumo_depois_u1['rurais_com_solo_em_ambas']} ({resumo_depois_u1['correspondencia_estrita_pct']}%) | "
        f"DEPOIS_V1_PIP = {resumo_depois_v1['correspondencia_estrita_n']}/{resumo_depois_v1['rurais_com_solo_em_ambas']} ({resumo_depois_v1['correspondencia_estrita_pct']}%)"
    )
    linhas.append(
        f"Correspondencia do componente dominante: "
        f"ANTES_U1 = {resumo_antes_u1['correspondencia_dominante_n']}/{resumo_antes_u1['rurais_com_solo_em_ambas']} ({resumo_antes_u1['correspondencia_dominante_pct']}%) | "
        f"DEPOIS_U1 = {resumo_depois_u1['correspondencia_dominante_n']}/{resumo_depois_u1['rurais_com_solo_em_ambas']} ({resumo_depois_u1['correspondencia_dominante_pct']}%) | "
        f"DEPOIS_V1_PIP = {resumo_depois_v1['correspondencia_dominante_n']}/{resumo_depois_v1['rurais_com_solo_em_ambas']} ({resumo_depois_v1['correspondencia_dominante_pct']}%)"
    )
    linhas.append(
        f"Divergencia entre as duas cartas: "
        f"ANTES_U1 = {resumo_antes_u1['divergencia_n']}/{resumo_antes_u1['rurais_com_solo_em_ambas']} ({resumo_antes_u1['divergencia_pct']}%) | "
        f"DEPOIS_U1 = {resumo_depois_u1['divergencia_n']}/{resumo_depois_u1['rurais_com_solo_em_ambas']} ({resumo_depois_u1['divergencia_pct']}%) | "
        f"DEPOIS_V1_PIP = {resumo_depois_v1['divergencia_n']}/{resumo_depois_v1['rurais_com_solo_em_ambas']} ({resumo_depois_v1['divergencia_pct']}%)"
    )
    linhas.append(
        f"Correspondencia estrita em ASSOCIACOES: "
        f"ANTES_U1 = {resumo_antes_u1['associacoes_correspondencia_estrita_n']}/{resumo_antes_u1['associacoes_pr_n']} ({resumo_antes_u1['associacoes_correspondencia_estrita_pct']}%) | "
        f"DEPOIS_U1 = {resumo_depois_u1['associacoes_correspondencia_estrita_n']}/{resumo_depois_u1['associacoes_pr_n']} ({resumo_depois_u1['associacoes_correspondencia_estrita_pct']}%) | "
        f"DEPOIS_V1_PIP = {resumo_depois_v1['associacoes_correspondencia_estrita_n']}/{resumo_depois_v1['associacoes_pr_n']} ({resumo_depois_v1['associacoes_correspondencia_estrita_pct']}%)"
    )
    linhas.append(
        f"Via Fator K D14 (DEPOIS_V1_PIP nos 20 rurais): "
        f"tabelado(k_solos)={resumo_depois_v1['contagem_vias_fator_k_d14'].get('k_solos_camada_2024_tabelado', 0)} | "
        f"fallback(faixa)={resumo_depois_v1['contagem_vias_fator_k_d14'].get('fallback_faixa_classe_d14', 0)} | "
        f"fora_do_dominio={resumo_depois_v1['contagem_vias_fator_k_d14'].get('indisponivel_fora_do_dominio', 0)}"
    )
    linhas.append("")
    linhas.append("--- DESTINO DOS 7 PONTOS DE FRONTEIRA DE U1 AO MUDAR PARA V1 (PIP) ---")
    linhas.append(f"Lista dos 7 pontos de fronteira em U1: {relatorio_final['destino_7_pontos_fronteira_u1']['lista_7_fronteira_u1']}")
    linhas.append(f"Quantos dos 7 pontos mudaram de classificacao de pos-U1 para pos-V1: {len(mudaram_entre_7_fronteira)} -> {mudaram_entre_7_fronteira}")
    linhas.append(f"Quantos dos 20 pontos rurais mudaram de classificacao de pos-U1 para pos-V1: {len(mudaram_todos_rurais)} -> {mudaram_todos_rurais}")
    linhas.append(f"Coordenadas exatamente sobre fronteira (mais de 1 feicao na mesma camada no PIP): {len(exatamente_sobre_fronteira_rurais)} -> {exatamente_sobre_fronteira_rurais}")
    linhas.append(f"Coordenadas rurais com zero feicoes no PIP: {len(zero_feicoes_rurais)} -> {zero_feicoes_rurais}")
    linhas.append("")
    linhas.append("--- DETALHAMENTO POR PONTO (POS-V1 PIP) ---")
    for r in resultados_v1:
        v1 = r["depois_v1_pip"]
        linhas.append(
            f"{r['id']} ({r['lat']}, {r['lon']}) | "
            f"n_pr={r['n_feicoes_pr_pip']} (id={v1['id_feicao_pr']}, sbcs={v1['sbcs_pr']}, ord={v1['ordens_pr']}) | "
            f"n_24={r['n_feicoes_2024_pip']} (id={v1['id_feicao_2024']}, cod_um={v1['cod_um_2024']}, cod_um2={v1['cod_um2_2024']}, ord24={v1['ordens_2024']}, erod_um={v1['erod_um_2024']}, k_solos={v1['k_solos_2024']}) | "
            f"n_br={r['n_feicoes_br_pip']} (classe={v1['classe_erod_br']}) | "
            f"estrito={v1['match_estrito']} | dom={v1['match_dominante']} | viaK={v1['via_fator_k_d14']}"
        )

    txt_path = os.path.join(out_dir, "relatorio_correspondencia_bp3_pos_v1_pip_2026-09-28.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(linhas) + "\n")

    print("\n".join(linhas))


if __name__ == "__main__":
    main()
