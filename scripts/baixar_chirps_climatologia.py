# -*- coding: utf-8 -*-
"""
Script de Download Real, Recorte Imediato em Memória e Geração de Climatologia CHIRPS v2.0
Diretrizes H2, L1, L2, L3, L4 (02/10/2026) — Decisão D13b / D06 (Suporte Nativo 0,05° sem reamostragem)

1. Período (L1 / D13b): Série completa disponível (1981-01 ao último ano civil completo: 2025-12 = 540 meses / 45 anos).
   Limite superior derivado dinamicamente (ano civil anterior ao corrente).
2. Gestão de disco (L2): Descompressão em memória (rasterio.io.MemoryFile), recorte imediato da janela BP3
   (33 linhas x 26 colunas de 0,05°, ~3,5 KB por GeoTIFF), gravação em data/chirps_cache/recortes/ e
   descarte total de dados globais. Redução de ~37 GB para ~2 MB.
3. Tratamento pericial de NoData (L3 / P12): Sentinela -9999.0 do CHIRPS v2.0 tratado explicitamente;
   ausência de dados propaga como ausência (None), sem conversão em 0.0 mm. Contabilização de meses válidos.
4. Envelope canônico (L4): Adota src/config/areaInteresse.ts (-54.65, -25.65, -53.35, -24.00), alinhado pixel-perfect
   com a grade de 0,05° (Window col_off=2507, row_off=1480, width=26, height=33).
5. Conferência cruzada Waltrick (Parte V): Janela secundária 1986–2008 (23 anos / 276 meses) comparada indiretamente
   (precipitação vs precipitação), mantendo fator R inoperante (H1).
"""

import os
import sys
import time
import json
import gzip
import math
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

import rasterio
from rasterio.windows import Window
from rasterio.io import MemoryFile

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "data" / "chirps_cache"
RECORTES_DIR = CACHE_DIR / "recortes"
DOCS_DIR = ROOT / "docs" / "verificacoes"
DIARIO_PATH = DOCS_DIR / "diario_climatologia_chirps_bp3.json"
ARTEFATO_PATH = DOCS_DIR / "climatologia_chirps_bp3.json"

BASE_URL = "https://data.chc.ucsb.edu/products/CHIRPS-2.0/global_monthly/tifs/"

# Limites temporais derivados dinamicamente
ANO_INICIAL = 1981
ANO_ATUAL = datetime.now(timezone.utc).year
ANO_FINAL = ANO_ATUAL - 1  # Último ano civil completo disponível (2025)
TOTAL_ANOS = ANO_FINAL - ANO_INICIAL + 1
TOTAL_MESES = TOTAL_ANOS * 12

# Janela secundária histórica para conferência cruzada Waltrick et al. (2015)
ANO_INICIAL_WALTRICK = 1986
ANO_FINAL_WALTRICK = 2008
TOTAL_MESES_WALTRICK = (ANO_FINAL_WALTRICK - ANO_INICIAL_WALTRICK + 1) * 12  # 276 meses

# Sentinela oficial do CHIRPS v2.0 para ausência de dado
# NOTA PERICIAL: Os GeoTIFFs oficiais do CHIRPS v2.0 não declaram nodata no cabeçalho GDAL (retornam None).
# O sentinela -9999.0 é convenção canônica do Climate Hazards Center (CHC).
CHIRPS_NODATA_SENTINEL = -9999.0
LIMIAR_NODATA = -9000.0

# Estações de referência na Bacia do Paraná 3
ESTACOES_BP3 = {
    "TOLEDO": {"nome": "Toledo", "lat": -24.72, "lon": -53.74, "rRefWaltrick": 10623},
    "CASCAVEL": {"nome": "Cascavel", "lat": -24.95, "lon": -53.45, "rRefWaltrick": 11588},
    "SANTA_HELENA": {"nome": "Santa Helena", "lat": -24.86, "lon": -54.33, "rRefWaltrick": 11261},
    "FOZ_DO_IGUACU": {"nome": "Foz do Iguaçu", "lat": -25.54, "lon": -54.58, "rRefWaltrick": 11037},
    "PALOTINA": {"nome": "Palotina", "lat": -24.28, "lon": -53.84, "rRefWaltrick": 10436},
    "MEDIANEIRA": {"nome": "Medianeira", "lat": -25.29, "lon": -54.09, "rRefWaltrick": 11400},
}

# Envelope canônico da BP3 adotado de src/config/areaInteresse.ts:
# lonMin: -54.65, latMin: -25.65, lonMax: -53.35, latMax: -24.00
# Alinhamento exato com a grade nativa CHIRPS 0.05°:
# col_off = 2507, row_off = 1480, width = 26, height = 33
BP3_COL_OFF = 2507
BP3_ROW_OFF = 1480
BP3_WIDTH = 26
BP3_HEIGHT = 33
BP3_WINDOW = Window(col_off=BP3_COL_OFF, row_off=BP3_ROW_OFF, width=BP3_WIDTH, height=BP3_HEIGHT)

# Lock para escritas concorrentes no diário e medições
lock_diario = threading.Lock()


def medir_tamanho_cache():
    if not CACHE_DIR.exists():
        return 0
    return sum(f.stat().st_size for f in CACHE_DIR.rglob("*") if f.is_file())


def processar_recorte_memoria(gz_bytes):
    """
    Descompacta gzip em memória e extrai apenas a janela da BP3 usando MemoryFile.
    Retorna (data_array, profile_recorte, meta_global).
    """
    tif_bytes = gzip.decompress(gz_bytes)
    with MemoryFile(tif_bytes) as memfile:
        with memfile.open() as src:
            data = src.read(1, window=BP3_WINDOW)
            win_transform = rasterio.windows.transform(BP3_WINDOW, src.transform)
            profile = {
                "driver": "GTiff",
                "height": BP3_HEIGHT,
                "width": BP3_WIDTH,
                "count": 1,
                "dtype": data.dtype,
                "crs": src.crs,
                "transform": win_transform,
                "nodata": CHIRPS_NODATA_SENTINEL,
                "compress": "deflate",
            }
            meta_global = {
                "crs": str(src.crs),
                "res": src.res,
            }
            return data, profile, meta_global


def converter_legado_2022_se_existir():
    """
    Converte arquivos globais legados de 2022 em recortes e remove os arquivos globais
    para liberar disco imediatamente (L2).
    """
    arquivos_removidos = 0
    bytes_liberados = 0

    RECORTES_DIR.mkdir(parents=True, exist_ok=True)

    for m in range(1, 13):
        recorte_path = RECORTES_DIR / f"chirps-v2.0.2022.{m:02d}.bp3.tif"
        tif_global = CACHE_DIR / f"chirps-v2.0.2022.{m:02d}.tif"
        gz_global = CACHE_DIR / f"chirps-v2.0.2022.{m:02d}.tif.gz"

        if not recorte_path.exists() and tif_global.exists():
            with rasterio.open(tif_global) as src:
                data = src.read(1, window=BP3_WINDOW)
                win_transform = rasterio.windows.transform(BP3_WINDOW, src.transform)
                profile = {
                    "driver": "GTiff",
                    "height": BP3_HEIGHT,
                    "width": BP3_WIDTH,
                    "count": 1,
                    "dtype": data.dtype,
                    "crs": src.crs,
                    "transform": win_transform,
                    "nodata": CHIRPS_NODATA_SENTINEL,
                    "compress": "deflate",
                }
                with rasterio.open(recorte_path, "w", **profile) as dst:
                    dst.write(data, 1)

        # Remove arquivos globais legados
        if tif_global.exists():
            bytes_liberados += tif_global.stat().st_size
            tif_global.unlink()
            arquivos_removidos += 1
        if gz_global.exists():
            bytes_liberados += gz_global.stat().st_size
            gz_global.unlink()
            arquivos_removidos += 1

    if arquivos_removidos > 0:
        print(f"Limpeza de arquivos legados de 2022 concluída: {arquivos_removidos} arquivos removidos ({bytes_liberados / 1024 / 1024:.2f} MB liberados).")


def baixar_e_recortar_mes(ano, mes, url_base, chamadas_existentes):
    """
    Baixa o arquivo .tif.gz do mês em memória, recorta para a janela da BP3,
    salva em data/chirps_cache/recortes/ e descarta dados globais.
    Retorna a chamada de diário correspondente.
    """
    nome_gz = f"chirps-v2.0.{ano}.{mes:02d}.tif.gz"
    nome_recorte = f"chirps-v2.0.{ano}.{mes:02d}.bp3.tif"
    recorte_path = RECORTES_DIR / nome_recorte
    url = f"{url_base}{nome_gz}"

    # Se o recorte já existe e a chamada já está no diário, retorna a chamada existente
    if recorte_path.exists() and url in chamadas_existentes:
        return chamadas_existentes[url], False

    # Tentativas com backoff exponencial
    tentativas_max = 4
    ultimo_erro = None
    gz_data = None
    codigo_http = 200
    t0 = time.time()

    for tentativa in range(1, tentativas_max + 1):
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "SAREL-Pericial/2.0 (UTFPR PPGTCA 2026; Series Climatologica)"}
            )
            with urllib.request.urlopen(req, timeout=45) as resp:
                codigo_http = resp.getcode()
                gz_data = resp.read()
            break
        except Exception as e:
            ultimo_erro = e
            if tentativa < tentativas_max:
                espera = 2 ** tentativa
                print(f"[{ano}-{mes:02d}] Falha na tentativa {tentativa}/{tentativas_max} ({e}). Aguardando {espera}s...")
                time.sleep(espera)
            else:
                raise RuntimeError(f"Falha definitiva ao baixar {url} após {tentativas_max} tentativas: {ultimo_erro}")

    t1 = time.time()
    duracao_ms = int((t1 - t0) * 1000)
    tamanho_bytes = len(gz_data)

    # Recorte imediato em memória
    data, profile, _ = processar_recorte_memoria(gz_data)
    del gz_data  # Libera memória imediatamente

    with rasterio.open(recorte_path, "w", **profile) as dst:
        dst.write(data, 1)

    chamada = {
        "timestampIso": datetime.now(timezone.utc).isoformat(),
        "servico": "CHIRPS_UCSB",
        "endpoint": url,
        "metodoHttp": "GET",
        "quantidadeItens": 1,
        "tamanhoRespostaBytes": tamanho_bytes,
        "codigoHttp": codigo_http,
        "duracaoMs": duracao_ms,
        "detalhe": f"CHIRPS v2.0 Global Monthly 0.05 deg - {ano}-{mes:02d}"
    }

    return chamada, True


def main():
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    RECORTES_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    t_inicio_total = time.time()
    disco_antes = medir_tamanho_cache()
    print(f"=== SAREL v2.0 — Climatologia CHIRPS v2.0 (Série Completa {ANO_INICIAL} a {ANO_FINAL}) ===")
    print(f"Disco inicial ocupado em cache: {disco_antes:,} bytes ({disco_antes / 1024 / 1024:.2f} MB)")

    # 1. Converte e limpa arquivos globais de 2022 se presentes
    converter_legado_2022_se_existir()

    # 2. Carrega diário existente se houver
    chamadas_map = {}
    if DIARIO_PATH.exists():
        try:
            with open(DIARIO_PATH, "r", encoding="utf-8") as f_d_in:
                diario_antigo = json.load(f_d_in)
                for ch in diario_antigo.get("chamadas", []):
                    chamadas_map[ch["endpoint"]] = ch
            print(f"Diário anterior carregado com {len(chamadas_map)} chamadas registradas.")
        except Exception as e:
            print(f"Aviso: Não foi possível carregar diário anterior: {e}")

    # Lista todos os meses necessários (1981-01 a ANO_FINAL-12)
    meses_totais = [
        (ano, mes)
        for ano in range(ANO_INICIAL, ANO_FINAL + 1)
        for mes in range(1, 13)
    ]

    print(f"Total de meses a processar: {len(meses_totais)} ({ANO_INICIAL}-01 a {ANO_FINAL}-12)")

    # 3. Processamento concorrente com recorte em memória
    disco_pico = disco_antes
    novos_downloads = 0
    concluidos = 0

    # Usamos 8 workers para throughput estável sem sobrecarregar
    max_workers = 8

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futuros = {
            executor.submit(baixar_e_recortar_mes, ano, mes, BASE_URL, chamadas_map): (ano, mes)
            for (ano, mes) in meses_totais
        }

        for fut in as_completed(futuros):
            ano, mes = futuros[fut]
            try:
                chamada, foi_baixado = fut.result()
                with lock_diario:
                    chamadas_map[chamada["endpoint"]] = chamada
                    concluidos += 1
                    if foi_baixado:
                        novos_downloads += 1
                        tam_atual = medir_tamanho_cache()
                        if tam_atual > disco_pico:
                            disco_pico = tam_atual
                        if novos_downloads % 20 == 0 or concluidos == len(meses_totais):
                            print(f"[{concluidos}/{len(meses_totais)}] Processado {ano}-{mes:02d} ({chamada['tamanhoRespostaBytes'] / 1024 / 1024:.2f} MB em {chamada['duracaoMs']} ms). Novos downloads: {novos_downloads}")
                            # Salva diário periodicamente para resiliência
                            diario_temp = {
                                "versao": "2.0",
                                "artefatoAlvo": "docs/verificacoes/climatologia_chirps_bp3.json",
                                "criadoEm": datetime.now(timezone.utc).isoformat(),
                                "atualizadoEm": datetime.now(timezone.utc).isoformat(),
                                "totalChamadas": len(chamadas_map),
                                "totalItensProcessados": len(chamadas_map),
                                "totalBytesRecebidos": sum(c["tamanhoRespostaBytes"] for c in chamadas_map.values()),
                                "chamadas": list(chamadas_map.values()),
                            }
                            with open(DIARIO_PATH, "w", encoding="utf-8") as f_d:
                                json.dump(diario_temp, f_d, indent=2, ensure_ascii=False)
                    else:
                        if concluidos % 50 == 0:
                            print(f"[{concluidos}/{len(meses_totais)}] Recorte já presente em cache: {ano}-{mes:02d}")
            except Exception as e:
                print(f"ERRO fatal ao processar {ano}-{mes:02d}: {e}")
                raise e

    # Mede disco depois
    disco_depois = medir_tamanho_cache()
    if disco_pico < disco_depois:
        disco_pico = disco_depois

    # Ordena chamadas cronologicamente
    lista_chamadas_ordenada = sorted(chamadas_map.values(), key=lambda c: c["endpoint"])

    # Salva diário oficial definitivo
    total_bytes_recebidos = sum(c["tamanhoRespostaBytes"] for c in lista_chamadas_ordenada)
    agora_iso = datetime.now(timezone.utc).isoformat()
    diario_final = {
        "versao": "2.0",
        "artefatoAlvo": "docs/verificacoes/climatologia_chirps_bp3.json",
        "criadoEm": lista_chamadas_ordenada[0]["timestampIso"] if lista_chamadas_ordenada else agora_iso,
        "atualizadoEm": agora_iso,
        "totalChamadas": len(lista_chamadas_ordenada),
        "totalItensProcessados": len(lista_chamadas_ordenada),
        "totalBytesRecebidos": total_bytes_recebidos,
        "chamadas": lista_chamadas_ordenada,
    }
    with open(DIARIO_PATH, "w", encoding="utf-8") as f_d:
        json.dump(diario_final, f_d, indent=2, ensure_ascii=False)
    print(f"Diário de requisições final gravado em {DIARIO_PATH} com {len(lista_chamadas_ordenada)} chamadas.")

    # 4. Extração dos valores nas 6 estações e cômputo da climatologia com respeito a P12 (NoData)
    print("Iniciando extração e cômputo climatológico com respeito estrito a P12...")

    # Estruturas de agregação por estação:
    # chave -> lista de (ano, mes, valor_ou_None)
    series_estacoes = {chave: [] for chave in ESTACOES_BP3}
    crs_str = None
    res_info = None

    # Mapeamento de coordenadas para pixel dentro da janela de 33x26
    # Origem da janela: lonMin=-54.65, latMax=-24.00, res=0.05
    coords_pixel_estacoes = {}
    amostra_primeiro_recorte = RECORTES_DIR / f"chirps-v2.0.{ANO_INICIAL}.01.bp3.tif"
    with rasterio.open(amostra_primeiro_recorte) as src:
        crs_str = str(src.crs)
        res_info = [src.res[0], src.res[1]]
        transform_recorte = src.transform
        for chave, dados in ESTACOES_BP3.items():
            r, c = rasterio.transform.rowcol(transform_recorte, dados["lon"], dados["lat"])
            coords_pixel_estacoes[chave] = (r, c)
            print(f"Estação {dados['nome']}: lon={dados['lon']}, lat={dados['lat']} -> pixel recorte (linha={r}, coluna={c})")

    # Itera sobre todos os 540 meses e lê os dados dos recortes
    ocorrencias_nodata_geral = []

    for ano, mes in meses_totais:
        caminho_recorte = RECORTES_DIR / f"chirps-v2.0.{ano}.{mes:02d}.bp3.tif"
        with rasterio.open(caminho_recorte) as src:
            grid = src.read(1)
            for chave, (r, c) in coords_pixel_estacoes.items():
                val = float(grid[r, c])
                # Checagem pericial de NoData (P12): sentinela -9999 ou <= -9000 ou NaN
                if val <= LIMIAR_NODATA or math.isnan(val):
                    series_estacoes[chave].append((ano, mes, None))
                    ocorrencias_nodata_geral.append((ano, mes, chave, val))
                else:
                    series_estacoes[chave].append((ano, mes, round(val, 2)))

    # 5. Cálculo das métricas climatológicas por estação
    estacoes_artefato = {}

    for chave, dados in ESTACOES_BP3.items():
        registros = series_estacoes[chave]
        meses_esperados = len(registros)
        validos = [r for r in registros if r[2] is not None]
        nodata = [r for r in registros if r[2] is None]

        # Médias mensais de janeiro a dezembro sobre anos válidos (1981-2025)
        medias_mensais_12 = []
        for m in range(1, 13):
            vals_m = [r[2] for r in validos if r[1] == m]
            if len(vals_m) > 0:
                medias_mensais_12.append(round(sum(vals_m) / len(vals_m), 2))
            else:
                medias_mensais_12.append(None)

        # Média anual climatológica: soma das médias dos 12 meses
        media_anual_climatologica = round(sum(m for m in medias_mensais_12 if m is not None), 2)

        # Dados do ano 2022 para critério de aceite falsificável (L1)
        vals_2022 = [r[2] for r in registros if r[0] == 2022]
        total_2022 = round(sum(v for v in vals_2022 if v is not None), 2)
        desvio_2022_mm = round(total_2022 - media_anual_climatologica, 2)
        desvio_2022_pct = round(((total_2022 - media_anual_climatologica) / media_anual_climatologica) * 100, 2)

        conclusao_vies = (
            f"O ano de 2022 apresentou precipitação acumulada de {total_2022} mm, desvio de "
            f"{desvio_2022_mm:+.2f} mm ({desvio_2022_pct:+.2f}%) em relação à média climatológica "
            f"de 45 anos ({media_anual_climatologica} mm)."
        )

        # Janela secundária Waltrick et al. (1986–2008, 23 anos / 276 meses)
        registros_waltrick = [r for r in registros if ANO_INICIAL_WALTRICK <= r[0] <= ANO_FINAL_WALTRICK]
        validos_waltrick = [r for r in registros_waltrick if r[2] is not None]
        nodata_waltrick = [r for r in registros_waltrick if r[2] is None]

        medias_mensais_waltrick = []
        for m in range(1, 13):
            vals_w_m = [r[2] for r in validos_waltrick if r[1] == m]
            if len(vals_w_m) > 0:
                medias_mensais_waltrick.append(round(sum(vals_w_m) / len(vals_w_m), 2))
            else:
                medias_mensais_waltrick.append(None)

        media_anual_waltrick = round(sum(m for m in medias_mensais_waltrick if m is not None), 2)
        dif_waltrick_para_completa_mm = round(media_anual_waltrick - media_anual_climatologica, 2)
        dif_waltrick_para_completa_pct = round(((media_anual_waltrick - media_anual_climatologica) / media_anual_climatologica) * 100, 2)

        estacoes_artefato[chave] = {
            "nome": dados["nome"],
            "latitude": dados["lat"],
            "longitude": dados["lon"],
            "rReferenciaWaltrick": dados["rRefWaltrick"],
            "serieCompleta1981_2025": {
                "mesesEsperados": meses_esperados,
                "mesesValidos": len(validos),
                "mesesNoData": len(nodata),
                "mesesNoDataLista": [f"{r[0]}-{r[1]:02d}" for r in nodata],
                "climatologiaMensalMediaMm": medias_mensais_12,
                "precipitacaoMediaAnualMm": media_anual_climatologica,
            },
            "criterioAceiteAno2022": {
                "precipitacaoMensal2022Mm": [v for v in vals_2022],
                "precipitacaoAnual2022Mm": total_2022,
                "desvioParaMediaClimatologicaMm": desvio_2022_mm,
                "desvioParaMediaClimatologicaPercentual": desvio_2022_pct,
                "conclusaoVies": conclusao_vies,
            },
            "janelaSecundariaWaltrick1986_2008": {
                "descricao": "Janela secundária idêntica ao período de Waltrick et al. (2015, 1986–2008 = 23 anos / 276 meses) para conferência cruzada de insumo.",
                "mesesEsperados": TOTAL_MESES_WALTRICK,
                "mesesValidos": len(validos_waltrick),
                "mesesNoData": len(nodata_waltrick),
                "climatologiaMensalMediaMm": medias_mensais_waltrick,
                "precipitacaoMediaAnualMm": media_anual_waltrick,
                "diferencaParaSerieCompletaMm": dif_waltrick_para_completa_mm,
                "diferencaParaSerieCompletaPercentual": dif_waltrick_para_completa_pct,
                "rRefWaltrickDeclarado": dados["rRefWaltrick"],
                "notaComparacao": "Comparação indireta e estritamente pluviométrica (precipitação vs precipitação). Coeficientes de conversão para R inoperantes conforme Diretriz H1."
            }
        }

    # Monta o artefato científico final
    duracao_execucao_s = round(time.time() - t_inicio_total, 2)
    artefato = {
        "versao": "2.0",
        "tipo": "climatologia_chirps_mensal_bp3",
        "geradoEm": agora_iso,
        "periodo": f"{ANO_INICIAL}-01 a {ANO_FINAL}-12 ({TOTAL_ANOS} anos / {TOTAL_MESES} meses completos)",
        "limiteSuperiorDinamico": True,
        "anoInicial": ANO_INICIAL,
        "anoFinal": ANO_FINAL,
        "totalAnos": TOTAL_ANOS,
        "totalMeses": TOTAL_MESES,
        "fontePrimaria": "UCSB Climate Hazards Center (CHC) — CHIRPS v2.0 Global Monthly 0.05°",
        "urlBase": BASE_URL,
        "envelopeBp3": {
            "fonte": "src/config/areaInteresse.ts",
            "lonMin": -54.65,
            "latMin": -25.65,
            "lonMax": -53.35,
            "latMax": -24.00,
            "justificativaEscolha": (
                "O envelope de src/config/areaInteresse.ts foi adotado como fonte única canônica da verdade. "
                "Ele intersecta a grade nativa de 0,05° do CHIRPS com limites inteiros de células (26 colunas x 33 linhas), "
                "englobando com precisão os 28 municípios da BP3 e todas as 6 estações pluviométricas de referência."
            ),
        },
        "suporteEspacial": {
            "resolucaoGraus": res_info,
            "resolucaoAproximadaKm": 5.5,
            "crs": crs_str,
            "gridWindow": {
                "colOff": BP3_COL_OFF,
                "rowOff": BP3_ROW_OFF,
                "width": BP3_WIDTH,
                "height": BP3_HEIGHT,
            },
            "reamostragem": "NENHUMA — preservado estritamente o suporte nativo de 0,05° conforme D06",
            "noDataSentinelConvencao": CHIRPS_NODATA_SENTINEL,
            "noDataTratamento": "Propagação pericial como ausência (None). Médias computadas exclusivamente sobre meses válidos (P12).",
        },
        "gestaoDisco": {
            "tamanhoAntesBytes": disco_antes,
            "tamanhoPicoBytes": disco_pico,
            "tamanhoDepoisBytes": disco_depois,
            "reducaoBytes": disco_antes - disco_depois,
            "reducaoPercentual": round(((disco_antes - disco_depois) / disco_antes) * 100, 2) if disco_antes > 0 else 0.0,
            "formatoArmazenamento": "GeoTIFF recortado comprimido em DEFLATE (~3,5 KB por mês). Dados globais descartados.",
        },
        "estatisticasNoDataGeral": {
            "totalMesesAvaliados": TOTAL_MESES,
            "totalOcorrenciasNoData": len(ocorrencias_nodata_geral),
            "mesesComNoData": [f"{ano}-{mes:02d} ({estacao})" for ano, mes, estacao, _ in ocorrencias_nodata_geral],
            "notaAuditoria": (
                "Nenhum valor NoData foi substituído por 0.0 ou preenchido por interpolação arbitrária, "
                "garantindo respeito integral à proibição P12."
            )
        },
        "diarioRequisicoes": "docs/verificacoes/diario_climatologia_chirps_bp3.json",
        "dimensoesMedidas": {
            "chuvaMensalChirps": {
                "estado": "medido",
                "fonteExterna": True,
                "totalItens": TOTAL_MESES,
                "anosCobertos": TOTAL_ANOS,
            }
        },
        "fatorRStatus": {
            "estado": "indisponivel",
            "causa": "h1_fonte_ausente",
            "motivo": (
                "Fator R de erosividade segue compulsoriamente indisponível por Diretriz H1. "
                "A consolidação da série completa de precipitação CHIRPS (1981–2025) aprimora a base pluviométrica, "
                "mas não restitui os coeficientes de conversão 107,52 e 46,89 enquanto ausente a fonte primária arquivada."
            )
        },
        "estacoesReferenciaBP3": estacoes_artefato,
    }

    with open(ARTEFATO_PATH, "w", encoding="utf-8") as f_a:
        json.dump(artefato, f_a, indent=2, ensure_ascii=False)

    print(f"\n========================================================")
    print(f"Artefato salvo em: {ARTEFATO_PATH}")
    print(f"Total de meses: {TOTAL_MESES} ({ANO_INICIAL} a {ANO_FINAL})")
    print(f"Disco antes: {disco_antes:,} B | Pico: {disco_pico:,} B | Depois: {disco_depois:,} B")
    print(f"Duração total do script: {duracao_execucao_s} s")
    print(f"Processamento concluído com sucesso!")


if __name__ == "__main__":
    main()
