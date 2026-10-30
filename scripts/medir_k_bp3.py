import json
import re
import urllib.parse
import urllib.request
import numpy as np
from shapely.geometry import shape, Polygon

OWS = 'https://geoinfo.dados.embrapa.br/geoserver/ows'
params = {
    'service': 'WFS',
    'version': '1.1.0',
    'request': 'GetFeature',
    'typeName': 'geonode:bra_erodibilidade_2024_sirgas2000',
    'outputFormat': 'json',
    'srsName': 'EPSG:4326',
    'bbox': '-25.65,-54.65,-24.00,-53.35,urn:ogc:def:crs:EPSG::4326',
    'maxFeatures': '1000'
}
url = f'{OWS}?{urllib.parse.urlencode(params)}'
print('Fetching all features from WFS...')
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=60) as r:
    data = json.loads(r.read().decode('utf-8'))

features = data.get('features', [])
print(f'Total features returned in BBOX: {len(features)}')

# Load BP3 polygon from bacias.ts
with open('src/lib/localizacao/bacias.ts', 'r', encoding='utf-8') as f:
    ts_content = f.read()

m = re.search(r'export const PARANA3_UNIAO_28_MUNICIPIOS_FEATURE:.*?\"coordinates\":\s*(\[\[\[.*?\]\]\])', ts_content, re.DOTALL)
if not m:
    # Try alternate pattern
    m = re.search(r'PARANA3_UNIAO_28_MUNICIPIOS_FEATURE.*?\[\[\[(-?\d+\.\d+,\s*-?\d+\.\d+.*?\]\]\])', ts_content, re.DOTALL)

coords = json.loads(m.group(1))
bp3_poly = Polygon(coords[0])
print('Loaded BP3 poly, area approx:', bp3_poly.area)

bp3_features = []
k_bp3 = []
poly_ge0300 = []

for f in features:
    props = f.get('properties', {})
    geom = shape(f.get('geometry'))
    k = props.get('k_solos')
    if k is not None:
        try:
            kval = float(k)
            # check intersection with BP3 polygon
            if geom.intersects(bp3_poly):
                # check non-pedological
                erod_um = props.get('erod_um', '') or ''
                if kval == 0 or 'urbana' in erod_um.lower() or 'agua' in erod_um.lower() or 'corpo' in erod_um.lower():
                    continue
                bp3_features.append(f)
                k_bp3.append((kval, props))
                if kval >= 0.0300:
                    poly_ge0300.append((kval, props))
        except Exception as e:
            pass

print(f'\n=== RESULTADOS DA MEDIÇÃO REAL DE K_SOLOS NA BP3 (Camada Embrapa 2024) ===')
print(f'Total de polígonos de solo pedológico interceptando a BP3: {len(bp3_features)}')
k_vals = [k for k, p in k_bp3]
print(f'Mínimo: {min(k_vals):.4f}')
print(f'Máximo: {max(k_vals):.4f}')
print(f'Média: {np.mean(k_vals):.4f}')
print(f'Mediana: {np.median(k_vals):.4f}')
print(f'Tercis (33.33%, 66.67%): {np.percentile(k_vals, 33.33):.4f}, {np.percentile(k_vals, 66.67):.4f}')
print(f'Quartis (25%, 50%, 75%): {np.percentile(k_vals, 25):.4f}, {np.percentile(k_vals, 50):.4f}, {np.percentile(k_vals, 75):.4f}')
print(f'Total de polígonos com K >= 0.0300 (Nível 2 de D09): {len(poly_ge0300)} ({len(poly_ge0300)/len(bp3_features)*100:.1f}%)')
print(f'Total de polígonos com K <= 0.0285 (Nível 1 de D09): {sum(1 for k in k_vals if k <= 0.0285)} ({sum(1 for k in k_vals if k <= 0.0285)/len(bp3_features)*100:.1f}%)')
print(f'Total de polígonos na lacuna 0.0285 < K < 0.0300: {sum(1 for k in k_vals if 0.0285 < k < 0.0300)}')

print('\nDetalhamento dos polígonos com K >= 0.0300 na BP3:')
for k, p in poly_ge0300:
    print(f'  k_solos={k:.4f} | cod_um={p.get("cod_um")} | nom_unidad={p.get("nom_unidad")} | erod_um={p.get("erod_um")} | erod_c1={p.get("erod_c1")} | erod_c2={p.get("erod_c2")} | area_km2={p.get("area_km2")}')

# Também medir a distribuição sobre os 90 candidatos reais de W2 (medicao_w2_candidatos_bp3_2026-09-28.json)
with open('docs/verificacoes/fontes/wfs_erodibilidade/medicao_w2_candidatos_bp3_2026-09-28.json', 'r', encoding='utf-8') as f:
    w2 = json.load(f)
cands = w2.get('candidatosMedidos', [])
k_cand = [c['kSolos2024'] for c in cands if c.get('kSolos2024') is not None and c['kSolos2024'] > 0]
k_cand_eleg = [c['kSolos2024'] for c in cands if c.get('kSolos2024') is not None and c['kSolos2024'] > 0 and c.get('elegivelDeclividadeD07')]

print('\n=== DISTRIBUIÇÃO SOBRE OS CANDIDATOS AMOSTRAIS DA BP3 (Pool W2 - 90 imóveis) ===')
print(f'Candidatos com k_solos medido: {len(k_cand)}')
print(f'Mínimo: {min(k_cand):.4f}, Máximo: {max(k_cand):.4f}, Mediana: {np.median(k_cand):.4f}')
print(f'Tercis: {np.percentile(k_cand, 33.33):.4f}, {np.percentile(k_cand, 66.67):.4f}')
print(f'K >= 0.0300: {sum(1 for k in k_cand if k >= 0.0300)} ({sum(1 for k in k_cand if k >= 0.0300)/len(k_cand)*100:.1f}%)')
print(f'K <= 0.0285: {sum(1 for k in k_cand if k <= 0.0285)} ({sum(1 for k in k_cand if k <= 0.0285)/len(k_cand)*100:.1f}%)')

print('\n=== CANDIDATOS ELEGÍVEIS EM DECLIVIDADE D07 (38 imóveis) ===')
print(f'Mínimo: {min(k_cand_eleg):.4f}, Máximo: {max(k_cand_eleg):.4f}, Mediana: {np.median(k_cand_eleg):.4f}')
print(f'Tercis: {np.percentile(k_cand_eleg, 33.33):.4f}, {np.percentile(k_cand_eleg, 66.67):.4f}')
print(f'K >= 0.0300: {sum(1 for k in k_cand_eleg if k >= 0.0300)} ({sum(1 for k in k_cand_eleg if k >= 0.0300)/len(k_cand_eleg)*100:.1f}%)')
print(f'K <= 0.0285: {sum(1 for k in k_cand_eleg if k <= 0.0285)} ({sum(1 for k in k_cand_eleg if k <= 0.0285)/len(k_cand_eleg)*100:.1f}%)')
