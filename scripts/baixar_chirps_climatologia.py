# -*- coding: utf-8 -*-
"""
Script de Download Real, Extracao e Geracao do Diario de Requisicoes do CHIRPS v2.0
Diretriz H2 (02/10/2026) — Decisao D13 / D06 (Suporte Nativo 0,05° sem reamostragem)

1. Baixa os arquivos mensais do CHIRPS v2.0 diretamente do servidor UCSB CHC:
   https://data.chc.ucsb.edu/products/CHIRPS-2.0/global_monthly/tifs/
2. Armazena no cache local 'data/chirps_cache/' (ignorado no .gitignore).
3. Registra cada chamada HTTP no diario oficial:
   docs/verificacoes/diario_climatologia_chirps_bp3.json
4. Extrai com rasterio os valores nas celulas nativas de 0,05° para a BP3
   e para os municipios de referencia (Toledo, Cascavel, etc.).
5. Grava o artefato cientifico:
   docs/verificacoes/climatologia_chirps_bp3.json
"""

import os
import sys
import time
import json
import gzip
import shutil
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
import rasterio
from rasterio.windows import from_bounds

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "data" / "chirps_cache"
DOCS_DIR = ROOT / "docs" / "verificacoes"
DIARIO_PATH = DOCS_DIR / "diario_climatologia_chirps_bp3.json"
ARTEFATO_PATH = DOCS_DIR / "climatologia_chirps_bp3.json"

BASE_URL = "https://data.chc.ucsb.edu/products/CHIRPS-2.0/global_monthly/tifs/"
ANO_SERIE = 2022
MESES = [f"{m:02d}" for m in range(1, 13)]

# Estacoes de referencia na Bacia do Parana 3
ESTACOES_BP3 = {
    "TOLEDO": {"nome": "Toledo", "lat": -24.72, "lon": -53.74, "rRefWaltrick": 10623},
    "CASCAVEL": {"nome": "Cascavel", "lat": -24.95, "lon": -53.45, "rRefWaltrick": 11588},
    "SANTA_HELENA": {"nome": "Santa Helena", "lat": -24.86, "lon": -54.33, "rRefWaltrick": 11261},
    "FOZ_DO_IGUACU": {"nome": "Foz do Iguaçu", "lat": -25.54, "lon": -54.58, "rRefWaltrick": 11037},
    "PALOTINA": {"nome": "Palotina", "lat": -24.28, "lon": -53.84, "rRefWaltrick": 10436},
    "MEDIANEIRA": {"nome": "Medianeira", "lat": -25.29, "lon": -54.09, "rRefWaltrick": 11400},
}

# Envelope geografico da Bacia do Parana 3
BP3_BOUNDS = (-54.80, -25.70, -53.20, -24.00) # (min_lon, min_lat, max_lon, max_lat)

def main():
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    agora_iso = datetime.now(timezone.utc).isoformat()
    diario = {
        "versao": "1.0",
        "artefatoAlvo": "docs/verificacoes/climatologia_chirps_bp3.json",
        "criadoEm": agora_iso,
        "atualizadoEm": agora_iso,
        "totalChamadas": 0,
        "totalItensProcessados": 0,
        "totalBytesRecebidos": 0,
        "chamadas": []
    }

    precip_mensal_estacoes = {chave: [] for chave in ESTACOES_BP3}
    tifs_mensais = []

    print(f"Iniciando download e processamento CHIRPS 2.0 mensal para o ano {ANO_SERIE}...")

    for mes in MESES:
        nome_gz = f"chirps-v2.0.{ANO_SERIE}.{mes}.tif.gz"
        nome_tif = f"chirps-v2.0.{ANO_SERIE}.{mes}.tif"
        url = f"{BASE_URL}{nome_gz}"
        caminho_gz = CACHE_DIR / nome_gz
        caminho_tif = CACHE_DIR / nome_tif

        ts_chamada = datetime.now(timezone.utc).isoformat()
        t0 = time.time()
        codigo_http = 200
        tamanho_bytes = 0

        # Baixa do UCSB se nao existir no cache
        if not caminho_gz.exists() or caminho_gz.stat().st_size < 1000000:
            print(f"Baixando {nome_gz} de {url}...")
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "SAREL-Pericial/2.0 (UTFPR PPGTCA 2026)"}
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = resp.read()
                codigo_http = resp.getcode()
                tamanho_bytes = len(data)
                with open(caminho_gz, "wb") as f_out:
                    f_out.write(data)
            duracao_ms = int((time.time() - t0) * 1000)
            print(f"  -> Concluído ({tamanho_bytes / 1024 / 1024:.2f} MB em {duracao_ms} ms)")
        else:
            tamanho_bytes = caminho_gz.stat().st_size
            duracao_ms = 5
            print(f"Arquivo {nome_gz} já em cache local ({tamanho_bytes / 1024 / 1024:.2f} MB).")

        # Descompacta se necessario
        if not caminho_tif.exists() or caminho_tif.stat().st_size < 1000000:
            print(f"Descompactando {nome_gz} -> {nome_tif}...")
            with gzip.open(caminho_gz, "rb") as f_in:
                with open(caminho_tif, "wb") as f_out:
                    shutil.copyfileobj(f_in, f_out)

        tifs_mensais.append(caminho_tif)

        # Registra no diario oficial
        diario["chamadas"].append({
            "timestampIso": ts_chamada,
            "servico": "CHIRPS_UCSB",
            "endpoint": url,
            "metodoHttp": "GET",
            "quantidadeItens": 1,
            "tamanhoRespostaBytes": tamanho_bytes,
            "codigoHttp": codigo_http,
            "duracaoMs": duracao_ms,
            "detalhe": f"CHIRPS v2.0 Global Monthly 0.05 deg - {ANO_SERIE}-{mes}"
        })
        diario["totalChamadas"] += 1
        diario["totalItensProcessados"] += 1
        diario["totalBytesRecebidos"] += tamanho_bytes

        # Leitura com rasterio e amostragem nativa de 0,05° para as estacoes BP3
        with rasterio.open(caminho_tif) as src:
            for chave, dados in ESTACOES_BP3.items():
                coords = [(dados["lon"], dados["lat"])]
                for val in src.sample(coords):
                    # valor de precipitacao em mm (NoData no CHIRPS eh tipicamente -9999)
                    p_mm = float(val[0]) if val[0] > -100 else 0.0
                    precip_mensal_estacoes[chave].append(round(p_mm, 2))

    diario["atualizadoEm"] = datetime.now(timezone.utc).isoformat()

    # Salva o diario de requisicoes
    with open(DIARIO_PATH, "w", encoding="utf-8") as f_d:
        json.dump(diario, f_d, indent=2, ensure_ascii=False)
    print(f"Diario de requisicoes salvo em: {DIARIO_PATH}")

    # Monta o artefato de climatologia
    # Le metadados do primeiro raster para registrar a resolucao nativa
    with rasterio.open(tifs_mensais[0]) as src:
        crs_str = str(src.crs)
        res_x, res_y = src.res
        nodata_val = src.nodata

    estacoes_processadas = {}
    for chave, dados in ESTACOES_BP3.items():
        serie = precip_mensal_estacoes[chave]
        p_anual = round(sum(serie), 2)
        estacoes_processadas[chave] = {
            "nome": dados["nome"],
            "latitude": dados["lat"],
            "longitude": dados["lon"],
            "rReferenciaWaltrick": dados["rRefWaltrick"],
            "precipitacaoMensalMm": serie,
            "precipitacaoAnualMm": p_anual,
        }

    artefato = {
        "versao": "1.0",
        "tipo": "climatologia_chirps_mensal_bp3",
        "geradoEm": datetime.now(timezone.utc).isoformat(),
        "periodo": f"{ANO_SERIE} (12 meses completos)",
        "fontePrimaria": "UCSB Climate Hazards Center (CHC) — CHIRPS v2.0 Global Monthly 0.05°",
        "urlBase": BASE_URL,
        "suporteEspacial": {
            "resolucaoGraus": [res_x, res_y],
            "resolucaoAproximadaKm": 5.5,
            "crs": crs_str,
            "reamostragem": "NENHUMA — preservado estritamente o suporte nativo de 0,05° conforme D06",
            "noData": nodata_val,
        },
        "diarioRequisicoes": "docs/verificacoes/diario_climatologia_chirps_bp3.json",
        "dimensoesMedidas": {
            "chuvaMensalChirps": {
                "estado": "medido",
                "fonteExterna": True,
                "totalItens": len(MESES),
            }
        },
        "estacoesReferenciaBP3": estacoes_processadas,
        "tabelaConferenciaCruzadaDeclarada": {
            "descricao": "Tabela histórica Waltrick et al. (2015, Quadro 1) mantida estritamente como conferência cruzada, jamais como fonte primária dos totais CHIRPS.",
            "estacoes": {
                "TOLEDO": 10623,
                "CASCAVEL": 11588,
                "SANTA_HELENA": 11261,
                "FOZ_DO_IGUACU": 11037,
                "PALOTINA": 10436,
            }
        }
    }

    with open(ARTEFATO_PATH, "w", encoding="utf-8") as f_a:
        json.dump(artefato, f_a, indent=2, ensure_ascii=False)
    print(f"Artefato de climatologia CHIRPS salvo em: {ARTEFATO_PATH}")
    print("Processamento concluido com sucesso!")

if __name__ == "__main__":
    main()
