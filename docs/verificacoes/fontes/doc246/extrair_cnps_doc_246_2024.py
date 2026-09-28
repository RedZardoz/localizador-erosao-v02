# -*- coding: utf-8 -*-
"""
Script de extracao e conferencia direta do documento primario:
docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/CNPS-DOC-246-2024.pdf
(Coelho et al., 2024 — Erodibilidade dos solos do Brasil, Embrapa Solos, Documentos 246).

Extrai:
1. Metadados de prova de acesso: numero total de paginas (len(reader.pages)),
   texto integral das paginas de capa, folha de rosto e ficha catalografica (PDF pp. 1-5).
2. Texto integral das paginas de metodologia, tabelas de classes de erodibilidade K
   e discussao por ordem de solo (PDF pp. 12-26).
"""
import os
import sys
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[4]
PDF_PATH = ROOT / "docs" / "Selecao Bibliografica" / "Pesquisas diretamente relacionadas" / "CNPS-DOC-246-2024.pdf"
OUT_PATH = Path(__file__).resolve().parent / "saida_extracao_cnps_doc_246_2024.txt"


def main() -> None:
    if not PDF_PATH.exists():
        print(f"ERRO: PDF nao encontrado em {PDF_PATH}", file=sys.stderr)
        sys.exit(1)

    reader = PdfReader(str(PDF_PATH))
    num_pages = len(reader.pages)
    meta = reader.metadata

    lines = []
    lines.append("========================================================================")
    lines.append("EXTRACAO DIRETA DE CNPS-DOC-246-2024.pdf VIA pypdf.PdfReader")
    lines.append("========================================================================")
    lines.append(f"Caminho relativo: {PDF_PATH.relative_to(ROOT).as_posix()}")
    lines.append(f"Tamanho do arquivo (bytes): {PDF_PATH.stat().st_size}")
    lines.append(f"Total de paginas do PDF (len(reader.pages)): {num_pages}")
    lines.append(f"PDF Metadata (/Title): {getattr(meta, 'title', None)}")
    lines.append(f"PDF Metadata (/Author): {getattr(meta, 'author', None)}")
    lines.append("")

    # Paginas 1 a 5 (capa, folha de rosto, ficha catalografica) e 12 a 26 (metodologia e resultados por ordem)
    pages_to_extract = list(range(1, min(6, num_pages + 1))) + list(range(12, min(27, num_pages + 1)))
    for pno in pages_to_extract:
        txt = reader.pages[pno - 1].extract_text() or ""
        lines.append(f"--- [PDF PAGINA {pno} / {num_pages}] ---")
        lines.append(txt.strip())
        lines.append("")

    output_text = "\n".join(lines)
    OUT_PATH.write_text(output_text, encoding="utf-8")
    print(f"Extracao concluida: {num_pages} paginas no PDF. Saida gravada em {OUT_PATH.relative_to(ROOT).as_posix()}")


if __name__ == "__main__":
    main()
