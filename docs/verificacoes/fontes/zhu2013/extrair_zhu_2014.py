# -*- coding: utf-8 -*-
"""
Extração pericial de trechos de Zhu (2013/2014) sobre suficiência amostral
e número mínimo de observações em modelos harmônicos OLS de séries temporais.

Obra Primária:
Zhu, Zhe (2013). Continuous Change Detection and Classification of Land Cover
using All Available Landsat Data. PhD Dissertation, Graduate School of Arts
and Sciences, Boston University.
(Base fundacional de Zhu & Woodcock, 2014, Remote Sensing of Environment 144:152-171)

Arquivo no acervo: docs/Selecao Bibliografica/ZheZhu.PHD.Resize.pdf
SHA-256: 4789edc19712c3bebf898002baf775c7fb07c628b76f58373f72897ee32ef173
"""

import os
import hashlib
import pypdf

CAMINHO_PDF = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "Selecao Bibliografica", "ZheZhu.PHD.Resize.pdf"))
if not os.path.exists(CAMINHO_PDF):
    CAMINHO_PDF = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "Selecao Bibliografica", "ZheZhu.PHD.Resize.pdf"))
if not os.path.exists(CAMINHO_PDF):
    CAMINHO_PDF = os.path.abspath("docs/Selecao Bibliografica/ZheZhu.PHD.Resize.pdf")

def main():
    if not os.path.exists(CAMINHO_PDF):
        print(f"Erro: Arquivo não encontrado: {CAMINHO_PDF}")
        return

    with open(CAMINHO_PDF, "rb") as f:
        sha256 = hashlib.sha256(f.read()).hexdigest()

    reader = pypdf.PdfReader(CAMINHO_PDF)
    total_paginas = len(reader.pages)

    # Páginas de interesse:
    # p. 75-76 (Capítulo 3 - CMFDA: 7 parâmetros exigem >= 7 e robustez >= 11 observações)
    # p. 121-122 (Capítulo 4 - CCDC: modelo harmônico de 4 parâmetros exige 12 pixels limpos para inicialização)
    
    saida_txt = []
    saida_txt.append("================================================================================")
    saida_txt.append("EXTRAÇÃO PERICIAL: ZHU (2013/2014) — REGRAS DE SUFICIÊNCIA AMOSTRAL TEMPORAL")
    saida_txt.append(f"Arquivo primário: ZheZhu.PHD.Resize.pdf")
    saida_txt.append(f"SHA-256: {sha256}")
    saida_txt.append(f"Total de páginas: {total_paginas}")
    saida_txt.append("================================================================================\n")

    # Extrair p. 75-76
    saida_txt.append("--- CAPÍTULO 3 (CMFDA): SEÇÃO 3.3.2 (PÁGINAS 75-76) ---")
    saida_txt.append("Contexto: Ajuste OLS de modelo harmônico bimodal com 7 parâmetros.")
    saida_txt.append("Trecho fundamental (p. 76):")
    p76_txt = reader.pages[75].extract_text()
    for linha in p76_txt.split("\n"):
        if any(w in linha for w in ["parameters", "clear observations", "necessary", "robustness", "11 clear"]):
            saida_txt.append(f"  [p. 76] {linha.strip()}")
    saida_txt.append("\nTexto integral da Seção 3.3.2 (p. 76):")
    saida_txt.append(p76_txt)

    # Extrair p. 121-122
    saida_txt.append("\n--- CAPÍTULO 4 (CCDC): SEÇÃO 4.3.2 (PÁGINAS 121-122) ---")
    saida_txt.append("Contexto: Inicialização do modelo harmônico temporal (Zhu & Woodcock 2014, RSE 144:152-171).")
    saida_txt.append("Trecho fundamental (p. 121):")
    p121_txt = reader.pages[120].extract_text()
    for linha in p121_txt.split("\n"):
        if any(w in linha for w in ["clear pixels", "parameters", "initialization", "12", "noise"]):
            saida_txt.append(f"  [p. 121] {linha.strip()}")
    saida_txt.append("\nTexto integral da Seção 4.3.2 (p. 121):")
    saida_txt.append(p121_txt)

    caminho_saida = os.path.join(os.path.dirname(__file__), "saida_extracao_zhu_2014.txt")
    with open(caminho_saida, "w", encoding="utf-8") as f_out:
        f_out.write("\n".join(saida_txt))

    print(f"Extração concluída com sucesso: {caminho_saida}")

if __name__ == "__main__":
    main()
