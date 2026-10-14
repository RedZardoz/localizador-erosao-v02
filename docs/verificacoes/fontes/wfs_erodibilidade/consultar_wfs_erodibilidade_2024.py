# -*- coding: utf-8 -*-
"""
Script de verificacao em rede (Regra R2) do servico OGC da Embrapa GeoInfo
(https://geoinfo.dados.embrapa.br/geoserver/ows) para:
1. DescribeFeatureType de geonode:bra_erodibilidade_2024_sirgas2000 (lista completa
   de atributos e verificacao da existencia de erod_c4).
2. GetFeatureInfo combinado com as 3 camadas:
   - geonode:parana_solos_20201105
   - geonode:brasil_erodibilidade_solo
   - geonode:bra_erodibilidade_2024_sirgas2000
   com feature_count=10 sobre 20 coordenadas genuinamente rurais/agricolas da Bacia do Parana 3
   (afastadas dos perimetros urbanos das sedes municipais) + 2 controles nao-solo (urbano e agua).
3. Medicao de correspondencia entre legenda_c1..legenda_c4 (carta nacional 2024)
   e ordem_1..ordem_3 (carta estadual do Parana) nos pontos rurais consultados (T2.4).
"""
import json
import unicodedata
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
OWS_URL = "https://geoinfo.dados.embrapa.br/geoserver/ows"
LAYER_SOLOS_PR = "geonode:parana_solos_20201105"
LAYER_EROD_BR = "geonode:brasil_erodibilidade_solo"
LAYER_EROD_2024 = "geonode:bra_erodibilidade_2024_sirgas2000"
BBOX_HALF_DEG = 0.0005

# 20 coordenadas genuinamente rurais/agricolas na Bacia do Parana 3 + 2 controles (urbano e agua)
PONTOS_CONSULTA = [
    ("R01_Toledo_Rural_Norte", -24.6200, -53.7100, "rural"),
    ("R02_Cascavel_Rural_Oeste_RRe12", -25.0669, -53.6880, "rural"),
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


def norm_str(s: str) -> str:
    if not s:
        return ""
    s_nfd = unicodedata.normalize("NFD", str(s).strip().upper())
    return "".join(ch for ch in s_nfd if unicodedata.category(ch) != "Mn")


def extrair_ordem_de_legenda(leg: str) -> str:
    n = norm_str(leg)
    for o in ORDENS_SIBCS:
        if o in n:
            return o
    return ""


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


def fetch_describe_feature_type() -> list[tuple[str, str]]:
    params_xml = {
        "service": "WFS",
        "version": "1.1.0",
        "request": "DescribeFeatureType",
        "typeName": LAYER_EROD_2024,
    }
    url_xml = f"{OWS_URL}?{urllib.parse.urlencode(params_xml)}"
    req = urllib.request.Request(url_xml, headers={"User-Agent": "SAREL-PPGTCA-2026/2.0"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        raw_xml = resp.read().decode("utf-8")

    (BASE_DIR / "describe_feature_type_bra_erodibilidade_2024.xml").write_text(raw_xml, encoding="utf-8")

    root = ET.fromstring(raw_xml)
    fields = []
    for elem in root.iter():
        if elem.tag.endswith("element") and "name" in elem.attrib and "type" in elem.attrib:
            name = elem.attrib["name"]
            if name != "bra_erodibilidade_2024_sirgas2000":
                fields.append((name, elem.attrib["type"]))
    return fields


def main() -> None:
    linhas_rel = []
    linhas_rel.append("========================================================================================")
    linhas_rel.append("RELATORIO DE VERIFICACAO WFS/WMS DE ERODIBILIDADE (28/09/2026)")
    linhas_rel.append("========================================================================================")

    # 1. DescribeFeatureType
    fields = fetch_describe_feature_type()
    field_names = [f[0] for f in fields]
    erod_c4_exists = "erod_c4" in field_names
    linhas_rel.append(f"\n1. DESCRIBEFEATURETYPE DE {LAYER_EROD_2024}")
    linhas_rel.append(f"Total de atributos: {len(fields)}")
    linhas_rel.append(f"Lista completa de campos: {', '.join(field_names)}")
    linhas_rel.append(f"erod_c4 existe? {erod_c4_exists}")
    for fn, ft in fields:
        linhas_rel.append(f"  - {fn}: {ft}")

    # 2. GetFeatureInfo sobre as 22 coordenadas (20 rurais + 2 controles)
    linhas_rel.append("\n2. CONSULTA GETFEATUREINFO (3 CAMADAS, feature_count=10) E CORRESPONDENCIA (T2.4)")
    resultados_pontos = []
    amostra_rural_associacao_salva = False
    amostra_rural_simples_salva = False

    n_rurais_consultados = 0
    n_rurais_com_ambas_solo = 0
    n_rurais_correspondentes_estritos = 0
    n_rurais_correspondentes_dominante = 0
    n_rurais_divergentes = 0
    n_rurais_associacao = 0
    n_rurais_associacao_correspondentes = 0
    n_rurais_caiu_nao_solo_2024 = 0

    for pid, lat, lng, categoria in PONTOS_CONSULTA:
        url = build_getfeatureinfo_url(lat, lng, feature_count=10)
        req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "SAREL-PPGTCA-2026/2.0"})
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw_json = resp.read().decode("utf-8")
            payload = json.loads(raw_json)

        feats = payload.get("features", [])
        f_pr = next((f for f in feats if str(f.get("id", "")).startswith("parana_solos_")), None)
        f_br = next((f for f in feats if str(f.get("id", "")).startswith("brasil_erodibilidade_solo")), None)
        f_24 = next((f for f in feats if str(f.get("id", "")).startswith("bra_erodibilidade_2024")), None)

        p_pr = (f_pr or {}).get("properties", {})
        p_br = (f_br or {}).get("properties", {})
        p_24 = (f_24 or {}).get("properties", {})

        ordens_pr = [norm_str(p_pr.get(k, "")) for k in ("ordem_1", "ordem_2", "ordem_3") if norm_str(p_pr.get(k, ""))]
        legs_24_raw = [str(p_24.get(k) or "").strip() for k in ("legenda_c1", "legenda_c2", "legenda_c3", "legenda_c4")]
        legs_24_raw = [x for x in legs_24_raw if x and x.lower() not in ("none", "null")]
        ordens_24 = [extrair_ordem_de_legenda(x) for x in legs_24_raw if extrair_ordem_de_legenda(x)]
        erods_24 = [str(p_24.get(k) or "").strip() for k in ("erod_c1", "erod_c2", "erod_c3", "erod_c4")]
        erods_24 = [x for x in erods_24 if x and x.lower() not in ("none", "null")]

        # Salva resposta bruta completa de uma associacao rural e de uma unidade simples rural
        if categoria == "rural" and len(ordens_pr) > 1 and not amostra_rural_associacao_salva:
            (BASE_DIR / "getfeatureinfo_3camadas_rural_associacao_bp3.json").write_text(
                json.dumps({"ponto": pid, "lat": lat, "lng": lng, "url": url, "response": payload}, indent=2, ensure_ascii=False),
                encoding="utf-8",
            )
            amostra_rural_associacao_salva = True

        if categoria == "rural" and len(ordens_pr) == 1 and ordens_24 and not amostra_rural_simples_salva:
            (BASE_DIR / "getfeatureinfo_3camadas_rural_simples_bp3.json").write_text(
                json.dumps({"ponto": pid, "lat": lat, "lng": lng, "url": url, "response": payload}, indent=2, ensure_ascii=False),
                encoding="utf-8",
            )
            amostra_rural_simples_salva = True

        # Correspondencia estrita de todos os componentes declarados
        corresponde_estrito = bool(ordens_pr) and bool(ordens_24) and (ordens_pr == ordens_24)
        corresponde_dominante = bool(ordens_pr) and bool(ordens_24) and (ordens_pr[0] == ordens_24[0])

        if categoria == "rural":
            n_rurais_consultados += 1
            if not ordens_24:
                n_rurais_caiu_nao_solo_2024 += 1
            elif ordens_pr:
                n_rurais_com_ambas_solo += 1
                if corresponde_estrito:
                    n_rurais_correspondentes_estritos += 1
                else:
                    n_rurais_divergentes += 1
                if corresponde_dominante:
                    n_rurais_correspondentes_dominante += 1
                if len(ordens_pr) > 1:
                    n_rurais_associacao += 1
                    if corresponde_estrito:
                        n_rurais_associacao_correspondentes += 1

        reg = {
            "id": pid,
            "lat": lat,
            "lng": lng,
            "categoria": categoria,
            "n_features_retornadas": len(feats),
            "pr_sbcs": p_pr.get("sbcs"),
            "pr_tipo_unida": p_pr.get("tipo_unida"),
            "pr_ordens": ordens_pr,
            "br_classe": p_br.get("classe"),
            "br_codnum": p_br.get("codnum"),
            "c2024_ogc_fid": p_24.get("ogc_fid"),
            "c2024_cod_um": p_24.get("cod_um"),
            "c2024_legenda": p_24.get("legenda"),
            "c2024_legendas_c": legs_24_raw,
            "c2024_ordens_extraidas": ordens_24,
            "c2024_erods_c": erods_24,
            "c2024_erod_um": p_24.get("erod_um"),
            "c2024_fator_k_um": p_24.get("fator_k_um"),
            "c2024_k_solos": p_24.get("k_solos"),
            "corresponde_estrito": corresponde_estrito,
            "corresponde_dominante": corresponde_dominante,
        }
        resultados_pontos.append(reg)
        linhas_rel.append(
            f"  [{pid}] ({lat:.4f}, {lng:.4f}) | PR: {p_pr.get('sbcs')} {ordens_pr} ({p_pr.get('tipo_unida')}) "
            f"| 2024: cod_um={p_24.get('cod_um')} ordens={ordens_24} erods={erods_24} erod_um={p_24.get('erod_um')} "
            f"| BR: {p_br.get('classe')} | Estrito={corresponde_estrito} (Dom={corresponde_dominante})"
        )

    linhas_rel.append("\n3. RESUMO QUANTITATIVO DE CORRESPONDENCIA (T2.4)")
    linhas_rel.append(f"  Total de pontos rurais consultados: {n_rurais_consultados}")
    linhas_rel.append(f"  Pontos rurais com solo mapeado em ambas as cartas (PR e 2024): {n_rurais_com_ambas_solo}")
    linhas_rel.append(f"  Pontos rurais em que 2024 retornou poligono nao-solo (urbano/agua de escala 1:250k): {n_rurais_caiu_nao_solo_2024}")
    linhas_rel.append(f"  Correspondencia estrita da sequencia completa de componentes (ordens PR == ordens 2024): {n_rurais_correspondentes_estritos} / {n_rurais_com_ambas_solo}")
    linhas_rel.append(f"  Correspondencia apenas do componente dominante (ordem_1 == legenda_c1): {n_rurais_correspondentes_dominante} / {n_rurais_com_ambas_solo}")
    linhas_rel.append(f"  Divergencia entre as duas cartas sobre solo mapeado: {n_rurais_divergentes} / {n_rurais_com_ambas_solo}")
    linhas_rel.append(f"  Unidades de associacao rurais avaliadas: {n_rurais_associacao} (correspondentes estritas: {n_rurais_associacao_correspondentes})")

    resumo_json = {
        "fields_bra_erodibilidade_2024": fields,
        "erod_c4_exists": erod_c4_exists,
        "n_rurais_consultados": n_rurais_consultados,
        "n_rurais_com_ambas_solo": n_rurais_com_ambas_solo,
        "n_rurais_caiu_nao_solo_2024": n_rurais_caiu_nao_solo_2024,
        "n_rurais_correspondentes_estritos": n_rurais_correspondentes_estritos,
        "n_rurais_correspondentes_dominante": n_rurais_correspondentes_dominante,
        "n_rurais_divergentes": n_rurais_divergentes,
        "n_rurais_associacao": n_rurais_associacao,
        "n_rurais_associacao_correspondentes": n_rurais_associacao_correspondentes,
        "pontos": resultados_pontos,
    }
    (BASE_DIR / "relatorio_correspondencia_bp3_2026-09-28.json").write_text(
        json.dumps(resumo_json, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    texto_rel = "\n".join(linhas_rel)
    (BASE_DIR / "relatorio_correspondencia_bp3_2026-09-28.txt").write_text(texto_rel, encoding="utf-8")
    print(texto_rel)


if __name__ == "__main__":
    main()
