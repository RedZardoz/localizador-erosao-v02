#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Remedição ao vivo de correspondência entre parana_solos_20201105 e
bra_erodibilidade_2024_sirgas2000 após a correção U1 (seleção de feição com solo
mapeado quando há múltiplas feições na resposta) e verificação de k_solos (U3 / D14).

NÃO sobrescreve relatorio_correspondencia_bp3_2026-09-28.json nem .txt.
Gera:
- relatorio_correspondencia_bp3_pos_u1_2026-09-28.json
- relatorio_correspondencia_bp3_pos_u1_2026-09-28.txt
- getfeatureinfo_3camadas_r13_fronteira_bp3.json
"""

import json
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
OWS_URL = "https://geoinfo.dados.embrapa.br/geoserver/ows"

LAYER_SOLOS_PR = "geonode:parana_solos_20201105"
LAYER_EROD_BR = "geonode:brasil_erodibilidade_solo"
LAYER_EROD_2024 = "geonode:bra_erodibilidade_2024_sirgas2000"

BBOX_HALF_DEG = 0.0005

# Mesmas 20 coordenadas rurais + 2 controles de consultar_wfs_erodibilidade_2024.py
PONTOS_BP3 = [
    ("R01_Toledo_Rural_Norte", -24.6200, -53.7100),
    ("R02_Cascavel_Rural_Oeste_RRe12", -25.0669, -53.6880),
    ("R03_Palotina_Rural_Leste", -24.2860, -53.7500),
    ("R04_AssisChateaubriand_Sul", -24.4200, -53.8200),
    ("R05_MarechalCandidoRondon_Rural_Leste", -24.5300, -53.9800),
    ("R06_TerraRoxa_Rural_Sul", -24.2200, -54.0800),
    ("R07_Guaira_Rural_Sudeste", -24.1800, -54.1800),
    ("R08_NovaSantaRosa_Rural_Norte", -24.4300, -53.9200),
    ("R09_QuatroPontes_Rural_Sul", -24.6100, -53.9600),
    ("R10_Mercedes_Rural_Leste", -24.4500, -54.1000),
    ("R11_PatoBragado_Rural_Leste", -24.6300, -54.1700),
    ("R12_EntreRiosDoOeste_Rural_Leste", -24.7000, -54.1800),
    ("R13_SantaHelena_Rural_Leste", -24.8800, -54.2600),
    ("R14_Missal_Rural_Leste", -25.0900, -54.1900),
    ("R15_Itaipulandia_Rural_Norte", -25.1000, -54.4200),
    ("R16_SaoMiguelDoIguacu_Rural_Norte", -25.2800, -54.2200),
    ("R17_Medianeira_Rural_Norte", -25.2200, -54.0800),
    ("R18_CeuAzul_Rural_Sul", -25.1900, -53.8400),
    ("R19_Matelandia_Rural_Norte", -25.1800, -53.9800),
    ("R20_SantaTerezinhaItaipu_Rural_Norte", -25.3800, -54.4200),
    ("C01_Palotina_Urbano", -24.2860, -53.8400),
    ("C02_SantaHelena_CorpoDagua", -24.8531, -54.3622),
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

TERMOS_NAO_SOLO = [
    "AREA URBANA",
    "AREAS URBANAS",
    "CORPO D'AGUA",
    "CORPO DAGUA",
    "CORPOS D'AGUA",
    "CORPOS DAGUA",
    "MASSA D'AGUA",
    "MASSAS D'AGUA",
    "AFLORA",
    "ROCHA",
    "DUNAS",
]


def norm_str(s: object) -> str:
    if s is None:
        return ""
    s_nfd = unicodedata.normalize("NFD", str(s).strip().upper())
    return "".join(ch for ch in s_nfd if unicodedata.category(ch) != "Mn")


def eh_nao_solo(val: object) -> bool:
    n = norm_str(val)
    if not n:
        return False
    if n in ("AGUA", "URBANO", "URBANA"):
        return True
    return any(t in n for t in TERMOS_NAO_SOLO)


def extrair_ordem_de_legenda(leg: object) -> str:
    n = norm_str(leg)
    for o in ORDENS_SIBCS:
        if o in n:
            return o
    return ""


def feicao_pr_tem_solo(props: dict) -> bool:
    sbcs = props.get("sbcs")
    legenda = props.get("legenda")
    ordem1 = props.get("ordem_1")
    if not ordem1 or not str(ordem1).strip():
        return False
    if eh_nao_solo(sbcs) or eh_nao_solo(legenda) or eh_nao_solo(ordem1):
        return False
    return True


def feicao_2024_tem_solo(props: dict) -> bool:
    erod_um = props.get("erod_um")
    erod_c1 = props.get("erod_c1")
    legenda = props.get("legenda")
    legenda_c1 = props.get("legenda_c1")
    if (
        eh_nao_solo(erod_um)
        or eh_nao_solo(erod_c1)
        or eh_nao_solo(legenda)
        or eh_nao_solo(legenda_c1)
    ):
        return False
    return bool(legenda_c1 or erod_c1 or erod_um)


def feicao_br_tem_solo(props: dict) -> bool:
    classe = props.get("classe")
    if not classe or eh_nao_solo(classe):
        return False
    return True


def build_getfeatureinfo_url(lat: float, lng: float, feature_count: int = 10) -> str:
    d = BBOX_HALF_DEG
    layers = f"{LAYER_SOLOS_PR},{LAYER_EROD_BR},{LAYER_EROD_2024}"
    params = {
        "service": "WMS",
        "version": "1.1.1",
        "request": "GetFeatureInfo",
        "layers": layers,
        "query_layers": layers,
        "srs": "EPSG:4326",
        "bbox": f"{lng - d},{lat - d},{lng + d},{lat + d}",
        "width": "3",
        "height": "3",
        "x": "1",
        "y": "1",
        "info_format": "application/json",
        "feature_count": str(feature_count),
    }
    return f"{OWS_URL}?{urllib.parse.urlencode(params)}"


def analisar_ponto(feats_pr: list[dict], feats_br: list[dict], feats_2024: list[dict], usar_u1: bool) -> dict:
    if not usar_u1:
        idx_pr = 0 if feats_pr else None
        idx_br = 0 if feats_br else None
        idx_2024 = 0 if feats_2024 else None
    else:
        idx_pr = next((i for i, f in enumerate(feats_pr) if feicao_pr_tem_solo(f["properties"])), (0 if feats_pr else None))
        idx_br = next((i for i, f in enumerate(feats_br) if feicao_br_tem_solo(f["properties"])), (0 if feats_br else None))
        idx_2024 = next((i for i, f in enumerate(feats_2024) if feicao_2024_tem_solo(f["properties"])), (0 if feats_2024 else None))

    p_pr = feats_pr[idx_pr]["properties"] if idx_pr is not None else {}
    p_br = feats_br[idx_br]["properties"] if idx_br is not None else {}
    p_24 = feats_2024[idx_2024]["properties"] if idx_2024 is not None else {}

    sbcs_pr = p_pr.get("sbcs")
    tipo_pr = p_pr.get("tipo_unida")
    ordens_pr = [
        extrair_ordem_de_legenda(p_pr.get(k))
        for k in ("ordem_1", "ordem_2", "ordem_3")
        if p_pr.get(k)
    ]
    ordens_pr = [o for o in ordens_pr if o]

    cod_um_24 = p_24.get("cod_um")
    cod_um2_24 = p_24.get("cod_um2")
    ogc_fid_24 = p_24.get("ogc_fid")
    erod_um_24 = p_24.get("erod_um")
    fator_k_um_24 = p_24.get("fator_k_um")
    k_solos_24 = p_24.get("k_solos")

    legs_24 = [p_24.get(k) for k in ("legenda_c1", "legenda_c2", "legenda_c3", "legenda_c4") if p_24.get(k)]
    ordens_24 = [extrair_ordem_de_legenda(l) for l in legs_24]
    ordens_24 = [o for o in ordens_24 if o]
    erods_24 = [p_24.get(k) for k in ("erod_c1", "erod_c2", "erod_c3", "erod_c4") if p_24.get(k)]

    pr_tem_solo = feicao_pr_tem_solo(p_pr) if p_pr else False
    c24_tem_solo = feicao_2024_tem_solo(p_24) if p_24 else False
    solo_em_ambas = pr_tem_solo and c24_tem_solo

    match_estrito = solo_em_ambas and (ordens_pr == ordens_24) and len(ordens_pr) > 0
    match_dominante = solo_em_ambas and len(ordens_pr) > 0 and len(ordens_24) > 0 and (ordens_pr[0] == ordens_24[0])

    # Via Fator K D14
    if eh_nao_solo(erod_um_24) or not c24_tem_solo or not pr_tem_solo:
        via_k = "indisponivel_fora_do_dominio"
        k_numerico = None
    elif k_solos_24 is not None and float(k_solos_24) > 0:
        via_k = "k_solos_camada_2024_tabelado"
        k_numerico = float(k_solos_24)
    elif p_br.get("classe") and not eh_nao_solo(p_br.get("classe")):
        via_k = "fallback_faixa_classe_d14"
        k_numerico = None
    else:
        via_k = "indisponivel_sem_cobertura"
        k_numerico = None

    return {
        "idx_pr": idx_pr,
        "id_feicao_pr": feats_pr[idx_pr]["id"] if idx_pr is not None else None,
        "sbcs_pr": sbcs_pr,
        "tipo_pr": tipo_pr,
        "ordens_pr": ordens_pr,
        "idx_2024": idx_2024,
        "id_feicao_2024": feats_2024[idx_2024]["id"] if idx_2024 is not None else None,
        "ogc_fid_2024": ogc_fid_24,
        "cod_um_2024": cod_um_24,
        "cod_um2_2024": cod_um2_24,
        "ordens_2024": ordens_24,
        "erods_2024": erods_24,
        "erod_um_2024": erod_um_24,
        "fator_k_um_2024": fator_k_um_24,
        "k_solos_2024": k_solos_24,
        "classe_erod_br": p_br.get("classe"),
        "pr_tem_solo": pr_tem_solo,
        "c24_tem_solo": c24_tem_solo,
        "solo_em_ambas": solo_em_ambas,
        "match_estrito": match_estrito,
        "match_dominante": match_dominante,
        "via_fator_k_d14": via_k,
        "k_numerico_d14": k_numerico,
    }


def main() -> None:
    resultados_pontos = []

    for nome, lat, lng in PONTOS_BP3:
        url = build_getfeatureinfo_url(lat, lng, feature_count=10)
        req = urllib.request.Request(url, headers={"User-Agent": "SAREL-PPGTCA-2026/2.0"})
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw_json = resp.read().decode("utf-8")
            payload = json.loads(raw_json)

        if nome == "R13_SantaHelena_Rural_Leste":
            payload_sem_geom = {
                "type": payload.get("type", "FeatureCollection"),
                "features": [
                    {
                        "type": f.get("type", "Feature"),
                        "id": f.get("id"),
                        "geometry": None,
                        "geometry_name": f.get("geometry_name"),
                        "properties": f.get("properties"),
                    }
                    for f in payload.get("features", [])
                ],
            }
            (BASE_DIR / "getfeatureinfo_3camadas_r13_fronteira_bp3.json").write_text(
                json.dumps(payload_sem_geom, indent=2, ensure_ascii=False), encoding="utf-8"
            )

        features = payload.get("features", [])
        feats_pr = [f for f in features if str(f.get("id", "")).startswith("parana_solos_")]
        feats_br = [f for f in features if str(f.get("id", "")).startswith("brasil_erodibilidade_solo")]
        feats_24 = [f for f in features if str(f.get("id", "")).startswith("bra_erodibilidade_2024")]

        antes = analisar_ponto(feats_pr, feats_br, feats_24, usar_u1=False)
        depois = analisar_ponto(feats_pr, feats_br, feats_24, usar_u1=True)

        mudou_por_u1 = (
            antes["sbcs_pr"] != depois["sbcs_pr"]
            or antes["cod_um2_2024"] != depois["cod_um2_2024"]
            or antes["solo_em_ambas"] != depois["solo_em_ambas"]
            or antes["match_estrito"] != depois["match_estrito"]
        )

        resultados_pontos.append({
            "nome": nome,
            "lat": lat,
            "lng": lng,
            "eh_rural": nome.startswith("R"),
            "n_feicoes_pr": len(feats_pr),
            "n_feicoes_br": len(feats_br),
            "n_feicoes_2024": len(feats_24),
            "ponto_em_fronteira_pr": len(feats_pr) > 1,
            "ponto_em_fronteira_2024": len(feats_24) > 1,
            "feicoes_pr_resumo": [
                {
                    "idx": i,
                    "id": f.get("id"),
                    "sbcs": f.get("properties", {}).get("sbcs"),
                    "tipo_unida": f.get("properties", {}).get("tipo_unida"),
                    "ordem_1": f.get("properties", {}).get("ordem_1"),
                }
                for i, f in enumerate(feats_pr)
            ],
            "feicoes_2024_resumo": [
                {
                    "idx": i,
                    "id": f.get("id"),
                    "ogc_fid": f.get("properties", {}).get("ogc_fid"),
                    "cod_um": f.get("properties", {}).get("cod_um"),
                    "cod_um2": f.get("properties", {}).get("cod_um2"),
                    "erod_um": f.get("properties", {}).get("erod_um"),
                    "k_solos": f.get("properties", {}).get("k_solos"),
                }
                for i, f in enumerate(feats_24)
            ],
            "mudou_por_u1": mudou_por_u1,
            "antes_u1": antes,
            "depois_u1": depois,
        })

    rurais = [r for r in resultados_pontos if r["eh_rural"]]

    def resumir(lista_rurais: list[dict], chave: str) -> dict:
        com_solo = [r for r in lista_rurais if r[chave]["solo_em_ambas"]]
        estritos = [r for r in com_solo if r[chave]["match_estrito"]]
        dominantes = [r for r in com_solo if r[chave]["match_dominante"]]
        divergentes = [r for r in com_solo if not r[chave]["match_estrito"]]
        assocs_pr = [r for r in com_solo if (r[chave]["tipo_pr"] or "").lower() == "associacao" or len(r[chave]["ordens_pr"]) > 1]
        assocs_estritos = [r for r in assocs_pr if r[chave]["match_estrito"]]
        via_tabelado = [r for r in lista_rurais if r[chave]["via_fator_k_d14"] == "k_solos_camada_2024_tabelado"]
        via_fallback = [r for r in lista_rurais if r[chave]["via_fator_k_d14"] == "fallback_faixa_classe_d14"]
        via_fora = [r for r in lista_rurais if r[chave]["via_fator_k_d14"] == "indisponivel_fora_do_dominio"]
        return {
            "total_rurais": len(lista_rurais),
            "solo_em_ambas": len(com_solo),
            "match_estrito": len(estritos),
            "pct_match_estrito": round(100.0 * len(estritos) / len(com_solo), 1) if com_solo else 0.0,
            "match_dominante": len(dominantes),
            "pct_match_dominante": round(100.0 * len(dominantes) / len(com_solo), 1) if com_solo else 0.0,
            "divergentes": len(divergentes),
            "pct_divergentes": round(100.0 * len(divergentes) / len(com_solo), 1) if com_solo else 0.0,
            "total_associacoes_pr": len(assocs_pr),
            "match_estrito_associacoes": len(assocs_estritos),
            "pct_match_estrito_associacoes": round(100.0 * len(assocs_estritos) / len(assocs_pr), 1) if assocs_pr else 0.0,
            "via_k_solos_tabelado": len(via_tabelado),
            "via_fallback_faixa_classe": len(via_fallback),
            "via_fora_do_dominio": len(via_fora),
        }

    resumo_antes = resumir(rurais, "antes_u1")
    resumo_depois = resumir(rurais, "depois_u1")
    pontos_fronteira_pr = [r["nome"] for r in rurais if r["ponto_em_fronteira_pr"]]
    pontos_fronteira_2024 = [r["nome"] for r in rurais if r["ponto_em_fronteira_2024"]]
    pontos_mudaram = [r["nome"] for r in rurais if r["mudou_por_u1"]]

    rel_json = {
        "data_execucao": "2026-09-28",
        "natureza": "Remedição pós-U1 (seleção de feição com solo mapeado) e verificação de k_solos (U3 / D14)",
        "pontos_fronteira_pr_rurais": pontos_fronteira_pr,
        "qtd_pontos_fronteira_pr_rurais": len(pontos_fronteira_pr),
        "pontos_fronteira_2024_rurais": pontos_fronteira_2024,
        "qtd_pontos_fronteira_2024_rurais": len(pontos_fronteira_2024),
        "pontos_que_mudaram_por_u1": pontos_mudaram,
        "qtd_pontos_que_mudaram_por_u1": len(pontos_mudaram),
        "resumo_antes_u1": resumo_antes,
        "resumo_depois_u1": resumo_depois,
        "pontos": resultados_pontos,
    }

    out_json = BASE_DIR / "relatorio_correspondencia_bp3_pos_u1_2026-09-28.json"
    out_txt = BASE_DIR / "relatorio_correspondencia_bp3_pos_u1_2026-09-28.txt"
    out_json.write_text(json.dumps(rel_json, indent=2, ensure_ascii=False), encoding="utf-8")

    linhas = []
    linhas.append("========================================================================================")
    linhas.append("REMEDICAO DE CORRESPONDENCIA WFS/WMS POS-U1 E FATOR K NUMERICO (U3 / D14) — 28/09/2026")
    linhas.append("========================================================================================")
    linhas.append(f"Pontos rurais avaliados: {len(rurais)}")
    linhas.append(f"Pontos rurais em fronteira cartografica (parana_solos > 1 feicao): {len(pontos_fronteira_pr)} -> {pontos_fronteira_pr}")
    linhas.append(f"Pontos rurais em fronteira cartografica (bra_erodibilidade_2024 > 1 feicao): {len(pontos_fronteira_2024)} -> {pontos_fronteira_2024}")
    linhas.append(f"Pontos rurais que mudaram de classificacao por U1: {len(pontos_mudaram)} -> {pontos_mudaram}")
    linhas.append("")
    linhas.append("--- COMPARATIVO ANTES DE U1 vs DEPOIS DE U1 ---")
    linhas.append(f"Solo mapeado em ambas as cartas: ANTES = {resumo_antes['solo_em_ambas']}/{resumo_antes['total_rurais']} | DEPOIS = {resumo_depois['solo_em_ambas']}/{resumo_depois['total_rurais']}")
    linhas.append(f"Correspondencia estrita de sequencia: ANTES = {resumo_antes['match_estrito']}/{resumo_antes['solo_em_ambas']} ({resumo_antes['pct_match_estrito']}%) | DEPOIS = {resumo_depois['match_estrito']}/{resumo_depois['solo_em_ambas']} ({resumo_depois['pct_match_estrito']}%)")
    linhas.append(f"Correspondencia do componente dominante: ANTES = {resumo_antes['match_dominante']}/{resumo_antes['solo_em_ambas']} ({resumo_antes['pct_match_dominante']}%) | DEPOIS = {resumo_depois['match_dominante']}/{resumo_depois['solo_em_ambas']} ({resumo_depois['pct_match_dominante']}%)")
    linhas.append(f"Divergencia entre as duas cartas: ANTES = {resumo_antes['divergentes']}/{resumo_antes['solo_em_ambas']} ({resumo_antes['pct_divergentes']}%) | DEPOIS = {resumo_depois['divergentes']}/{resumo_depois['solo_em_ambas']} ({resumo_depois['pct_divergentes']}%)")
    linhas.append(f"Correspondencia estrita em ASSOCIACOES: ANTES = {resumo_antes['match_estrito_associacoes']}/{resumo_antes['total_associacoes_pr']} ({resumo_antes['pct_match_estrito_associacoes']}%) | DEPOIS = {resumo_depois['match_estrito_associacoes']}/{resumo_depois['total_associacoes_pr']} ({resumo_depois['pct_match_estrito_associacoes']}%)")
    linhas.append(f"Via Fator K D14 (pos-U1 nos 20 pontos rurais): tabelado(k_solos)={resumo_depois['via_k_solos_tabelado']} | fallback(faixa)={resumo_depois['via_fallback_faixa_classe']} | fora_do_dominio={resumo_depois['via_fora_do_dominio']}")
    linhas.append("")
    linhas.append("--- DETALHAMENTO POR PONTO (POS-U1) ---")
    for r in resultados_pontos:
        d = r["depois_u1"]
        linhas.append(
            f"{r['nome']} ({r['lat']}, {r['lng']}) | n_pr={r['n_feicoes_pr']} (idx={d['idx_pr']}, sbcs={d['sbcs_pr']}, ord={d['ordens_pr']}) "
            f"| n_24={r['n_feicoes_2024']} (idx={d['idx_2024']}, cod_um={d['cod_um_2024']}, cod_um2={d['cod_um2_2024']}, ord24={d['ordens_2024']}, erod_um={d['erod_um_2024']}, k_solos={d['k_solos_2024']}, fator_k_um={d['fator_k_um_2024']}) "
            f"| estrito={d['match_estrito']} | dom={d['match_dominante']} | viaK={d['via_fator_k_d14']}"
        )

    out_txt.write_text("\n".join(linhas) + "\n", encoding="utf-8")
    print("\n".join(linhas[:25]))


if __name__ == "__main__":
    main()
