#!/usr/bin/env python3
"""
Verificador de Integridade Criptográfica do Pacote de Reprodutibilidade
SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar (PPGTCA 2026)

INSTRUÇÕES PARA A BANCA EXAMINADORA / AUDITORIA:
------------------------------------------------
Este script permite verificar a integridade de todos os arquivos de dados,
códigos e dicionários do pacote sem depender de utilitários externos (como o
comando 'sha256sum' do Unix, frequentemente ausente em ambientes Windows).

Como executar:
  - Windows:
      python 07_verificar_integridade.py
    ou apontando para o diretório descompactado:
      python 07_verificar_integridade.py "C:\\caminho\\do\\pacote"

  - Linux / macOS:
      python3 07_verificar_integridade.py
    ou
      python3 07_verificar_integridade.py /caminho/do/pacote

LIMITAÇÃO HONESTA DE SEGURANÇA:
-------------------------------
O manifesto criptográfico ('06_manifesto_integridade_sha256.txt') comprova
estritamente que os arquivos locais não sofreram corrupção de bytes ou
alteração em relação aos hashes registrados no momento da extração do pacote.
Ele NÃO comprova autoria de terceiros e NÃO impede que um adulterador malicioso
modifique os dados e recalcule simultaneamente os hashes dentro do próprio
manifesto. A autenticidade externa integral exige o confronto do hash SHA-256
deste manifesto (ou do arquivo .ZIP completo) com a cifra publicada
oficialmente pelo pesquisador em repositório público ou ata de dissertação.
"""

import sys
import os
import re
import hashlib
from pathlib import Path

NOME_MANIFESTO = "06_manifesto_integridade_sha256.txt"
REGEX_HEX64 = re.compile(r"^[0-9a-fA-F]{64}$")


def calcular_sha256_bytes(caminho: Path) -> str:
    h = hashlib.sha256()
    with open(caminho, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest().lower()


def validar_seguranca_nome_arquivo(nome: str) -> bool:
    """Rejeita caminhos absolutos ou que contenham '..' para evitar path traversal."""
    if nome.startswith("/") or nome.startswith("\\"):
        return False
    if ":" in nome:
        return False
    p = Path(nome)
    if p.is_absolute():
        return False
    partes = p.parts
    if ".." in partes:
        return False
    return True


def main() -> int:
    diretorio_alvo = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parent

    print(f"=== Verificação de Integridade SHA-256 — SAREL ===")
    print(f"Diretório examinado: {diretorio_alvo}")

    caminho_manifesto = diretorio_alvo / NOME_MANIFESTO
    if not caminho_manifesto.is_file():
        print(f"[ERRO] Manifesto de integridade não encontrado: {NOME_MANIFESTO}", file=sys.stderr)
        print("RESULTADO: FALHA DE INTEGRIDADE (manifesto ausente ou ilegível)")
        return 2

    try:
        linhas = caminho_manifesto.read_bytes().decode("utf-8").splitlines()
    except Exception as e:
        print(f"[ERRO] Falha ao ler manifesto '{NOME_MANIFESTO}': {e}", file=sys.stderr)
        print("RESULTADO: FALHA DE INTEGRIDADE (manifesto ilegível)")
        return 2

    entradas: list[tuple[str, str]] = []
    nomes_no_manifesto: set[str] = set()

    for idx, l in enumerate(linhas, start=1):
        linha = l.strip()
        if not linha or linha.startswith("#"):
            continue

        # Formatos aceitos: '<64 hex>  <nome>' ou '<64 hex> *<nome>'
        partes = re.split(r"\s+[ *]?", linha, maxsplit=1)
        if len(partes) != 2:
            print(f"[ERRO] Entrada malformada na linha {idx} do manifesto: '{l}'", file=sys.stderr)
            print("RESULTADO: FALHA DE INTEGRIDADE (entrada malformada no manifesto)")
            return 2

        hash_esperado, nome_arquivo = partes[0].strip(), partes[1].strip()

        if not REGEX_HEX64.match(hash_esperado):
            print(f"[ERRO] Hash inválido (não possui 64 dígitos hex) na linha {idx}: '{hash_esperado}'", file=sys.stderr)
            print("RESULTADO: FALHA DE INTEGRIDADE (hash inválido no manifesto)")
            return 2

        if not validar_seguranca_nome_arquivo(nome_arquivo):
            print(f"[ERRO] Nome de arquivo perigoso (absoluto ou com '..') na linha {idx}: '{nome_arquivo}'", file=sys.stderr)
            print("RESULTADO: FALHA DE INTEGRIDADE (nome de arquivo inseguro)")
            return 2

        entradas.append((hash_esperado.lower(), nome_arquivo))
        nomes_no_manifesto.add(nome_arquivo)

    if not entradas:
        print(f"[ERRO] Manifesto '{NOME_MANIFESTO}' não contém nenhuma entrada válida de arquivo.", file=sys.stderr)
        print("RESULTADO: FALHA DE INTEGRIDADE (manifesto vazio ou sem entradas válidas)")
        return 2

    falhas = 0
    conferidos = 0

    for hash_esperado, nome_relativo in entradas:
        arquivo_alvo = diretorio_alvo / nome_relativo
        if not arquivo_alvo.is_file():
            print(f"[FALHA] Arquivo listado no manifesto NÃO existe: {nome_relativo}")
            falhas += 1
            continue

        try:
            hash_obtido = calcular_sha256_bytes(arquivo_alvo)
        except Exception as e:
            print(f"[FALHA] Não foi possível ler bytes de '{nome_relativo}': {e}")
            falhas += 1
            continue

        if hash_obtido == hash_esperado:
            print(f"[OK] {nome_relativo}")
            conferidos += 1
        else:
            print(f"[DIVERGÊNCIA] {nome_relativo}")
            print(f"   Esperado: {hash_esperado}")
            print(f"   Obtido:   {hash_obtido}")
            falhas += 1

    # Varredura de arquivos adicionais não listados
    arquivos_extras = 0
    try:
        for item in diretorio_alvo.iterdir():
            if item.is_file():
                nome = item.name
                if nome == NOME_MANIFESTO or nome.endswith(".pyc"):
                    continue
                if nome not in nomes_no_manifesto:
                    print(f"AVISO: arquivo não listado no manifesto: {nome}")
                    arquivos_extras += 1
    except Exception:
        pass

    if arquivos_extras > 0:
        print(f"Observação: {arquivos_extras} arquivos não listados no manifesto encontrados.")

    if falhas > 0:
        print(f"RESULTADO: FALHA DE INTEGRIDADE ({falhas} erro(s) em {len(entradas)} arquivo(s))")
        return 1

    print(f"RESULTADO: INTEGRIDADE CONFIRMADA ({conferidos} arquivos)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
