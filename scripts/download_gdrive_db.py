# -*- coding: utf-8 -*-
"""
Utilitário de download automático do banco fundiário (fundiario_brasil.db)
e bases complementares a partir de link público do Google Drive.
Suporta tanto link direto de arquivo quanto link de pasta do Google Drive
(localizando automaticamente Banco_Consolidado_SAREL_GoogleDrive.zip ou
fundiario_brasil.db dentro da pasta via embeddedfolderview).
"""

import os
import re
import sys
import zipfile
import urllib.request
import urllib.parse
import http.cookiejar

DEFAULT_GDRIVE_FOLDER = "https://drive.google.com/drive/folders/1S6UsUYGM3dUh7w_hLrmvcsuh0nSfjyYR?usp=sharing"


def emitir_progresso(percentual: int, mensagem: str) -> None:
    """Emite linha padronizada para a barra de progresso do Instalador_SAREL.exe."""
    sys.stdout.write(f"PROGRESS:{percentual}:{mensagem}\n")
    sys.stdout.flush()


def descobrir_arquivo_na_pasta_gdrive(folder_id: str) -> str:
    """
    Consulta a visualização pública da pasta do Google Drive (embeddedfolderview)
    para localizar automaticamente o ID do arquivo fundiario_brasil.db ou
    Banco_Consolidado_SAREL_GoogleDrive.zip dentro da pasta compartilhada.
    """
    url_lista = f"https://drive.google.com/embeddedfolderview?id={folder_id}#list"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SAREL-Installer/2.0"
    }
    try:
        req = urllib.request.Request(url_lista, headers=headers)
        with urllib.request.urlopen(req, timeout=25) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

        pares = re.findall(
            r'id="entry-([a-zA-Z0-9_-]+)".*?flip-entry-title">([^<]+)<',
            html,
            re.S,
        )
        nomes_prioritarios = [
            "banco_consolidado_sarel_googledrive.zip",
            "fundiario_brasil.zip",
            "fundiario_brasil.db",
            "sarel_dados.zip",
        ]
        for alvo in nomes_prioritarios:
            for entry_id, titulo in pares:
                if titulo.strip().lower() == alvo:
                    return entry_id

        for entry_id, titulo in pares:
            t_low = titulo.strip().lower()
            if t_low.endswith(".db") or (t_low.endswith(".zip") and "fundiario" in t_low):
                return entry_id
    except Exception:
        pass
    return ""


def extrair_id_google_drive(url_ou_id: str) -> tuple[str, bool]:
    """
    Retorna (id, eh_pasta).
    Se for um link de pasta (/folders/...), retorna eh_pasta=True.
    """
    texto = url_ou_id.strip()
    m_folder = re.search(r"/folders/([a-zA-Z0-9_-]{20,})", texto)
    if m_folder:
        return m_folder.group(1), True

    padroes_arquivo = [
        r"/file/d/([a-zA-Z0-9_-]{20,})",
        r"[?&]id=([a-zA-Z0-9_-]{20,})",
    ]
    for padrao in padroes_arquivo:
        m = re.search(padrao, texto)
        if m:
            return m.group(1), False

    if re.match(r"^[a-zA-Z0-9_-]{20,}$", texto):
        return texto, False
    return "", False


def baixar_arquivo_google_drive(url_ou_id: str, destino_final: str) -> int:
    """
    Baixa um arquivo público do Google Drive contornando o aviso de verificação
    de vírus para arquivos de grande porte (ex.: fundiario_brasil.db de 1.6 GB).
    """
    if not url_ou_id.strip() or "COLE_AQUI" in url_ou_id.upper():
        url_ou_id = DEFAULT_GDRIVE_FOLDER

    item_id, eh_pasta = extrair_id_google_drive(url_ou_id)
    if not item_id:
        emitir_progresso(0, "ERRO: Link do Google Drive invalido.")
        return 1

    if eh_pasta:
        emitir_progresso(5, f"Verificando arquivos na pasta do Google Drive ({item_id})...")
        file_id_descoberto = descobrir_arquivo_na_pasta_gdrive(item_id)
        if not file_id_descoberto:
            emitir_progresso(
                0,
                "AVISO: Pasta do Google Drive localizada (Dados INCRA/SICAR/SIGEF/SNCR). "
                "Abrindo pasta no navegador...",
            )
            return 2
        item_id = file_id_descoberto

    pasta_destino = os.path.dirname(os.path.abspath(destino_final))
    os.makedirs(pasta_destino, exist_ok=True)
    arquivo_temp = destino_final + ".part"

    emitir_progresso(8, f"Conectando ao Google Drive (Arquivo ID: {item_id})...")

    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SAREL-Installer/2.0"
    }

    url_direta = (
        f"https://drive.usercontent.google.com/download"
        f"?id={item_id}&export=download&confirm=t"
    )

    try:
        req = urllib.request.Request(url_direta, headers=headers)
        resposta = opener.open(req, timeout=60)
        content_type = resposta.headers.get("Content-Type", "")

        if "text/html" in content_type.lower():
            html = resposta.read().decode("utf-8", errors="ignore")
            uuid_match = re.search(r'name="uuid"\s+value="([^"]+)"', html)
            confirm_match = re.search(r'name="confirm"\s+value="([^"]+)"', html)
            if uuid_match:
                uuid_val = uuid_match.group(1)
                confirm_val = confirm_match.group(1) if confirm_match else "t"
                url_direta = (
                    f"https://drive.usercontent.google.com/download"
                    f"?id={item_id}&export=download&confirm={confirm_val}&uuid={uuid_val}"
                )
                req = urllib.request.Request(url_direta, headers=headers)
                resposta = opener.open(req, timeout=60)
                content_type = resposta.headers.get("Content-Type", "")

        if "text/html" in content_type.lower():
            emitir_progresso(
                0,
                "AVISO: O link aponta para pastas do Google Drive. Abrindo no navegador...",
            )
            return 2

        total_bytes_str = resposta.headers.get("Content-Length")
        total_bytes = int(total_bytes_str) if total_bytes_str and total_bytes_str.isdigit() else 0

        baixados = 0
        bloco = 1024 * 512
        ultimo_pct = -1

        with open(arquivo_temp, "wb") as f_out:
            while True:
                chunk = resposta.read(bloco)
                if not chunk:
                    break
                f_out.write(chunk)
                baixados += len(chunk)
                mb_baixados = baixados / (1024 * 1024)

                if total_bytes > 0:
                    mb_total = total_bytes / (1024 * 1024)
                    pct = int((baixados * 95) / total_bytes)
                    if pct != ultimo_pct:
                        ultimo_pct = pct
                        emitir_progresso(
                            pct,
                            f"Baixando banco do Google Drive: {mb_baixados:.1f} MB / {mb_total:.1f} MB ({pct}%)",
                        )
                else:
                    emitir_progresso(
                        50,
                        f"Baixando banco do Google Drive: {mb_baixados:.1f} MB recebidos...",
                    )

        if zipfile.is_zipfile(arquivo_temp):
            emitir_progresso(96, "Arquivo ZIP detectado. Extraindo banco de dados para a pasta data/...")
            with zipfile.ZipFile(arquivo_temp, "r") as zf:
                zf.extractall(pasta_destino)
            os.remove(arquivo_temp)
            emitir_progresso(100, "SUCESSO: Banco de dados baixado e descompactado em data/!")
            return 0

        if os.path.exists(destino_final):
            os.remove(destino_final)
        os.replace(arquivo_temp, destino_final)
        tamanho_final_mb = os.path.getsize(destino_final) / (1024 * 1024)
        emitir_progresso(
            100,
            f"SUCESSO: Banco instalado em {destino_final} ({tamanho_final_mb:.1f} MB)!",
        )
        return 0

    except Exception as exc:
        if os.path.exists(arquivo_temp):
            try:
                os.remove(arquivo_temp)
            except OSError:
                pass
        emitir_progresso(0, f"ERRO no download do Google Drive: {exc}")
        return 1


def main() -> int:
    if len(sys.argv) < 3:
        print("Uso: python scripts/download_gdrive_db.py <URL_OU_ID_GDRIVE> <CAMINHO_DESTINO>")
        return 1
    url_gdrive = sys.argv[1]
    caminho_destino = sys.argv[2]
    return baixar_arquivo_google_drive(url_gdrive, caminho_destino)


if __name__ == "__main__":
    sys.exit(main())
