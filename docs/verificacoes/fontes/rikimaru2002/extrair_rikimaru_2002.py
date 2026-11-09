# -*- coding: utf-8 -*-
"""
Script de extracao e conferencia direta do documento primario:
docs/bibliografia/01_pesquisas_diretamente_relacionadas/Tropical forest cover density mapping - International Society for ....pdf
Rikimaru, Roy & Miyatake (2002) — Tropical forest cover density mapping.
Tropical Ecology 43(1): 39-47.
"""
import sys
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[4]
PDF_PATH = ROOT / "docs" / "bibliografia" / "01_pesquisas_diretamente_relacionadas" / "Tropical forest cover density mapping - International Society for ....pdf"
OUT_PATH = Path(__file__).resolve().parent / "saida_extracao_rikimaru_2002.txt"


def main() -> None:
    if not PDF_PATH.exists():
        print(f"ERRO: PDF nao encontrado em {PDF_PATH}", file=sys.stderr)
        sys.exit(1)

    reader = PdfReader(str(PDF_PATH))
    num_pages = len(reader.pages)
    meta = reader.metadata

    lines = []
    lines.append("========================================================================")
    lines.append("EXTRACAO DIRETA DE Rikimaru et al. (2002) VIA pypdf.PdfReader")
    lines.append("========================================================================")
    lines.append(f"Caminho relativo: {PDF_PATH.relative_to(ROOT).as_posix()}")
    lines.append(f"Tamanho do arquivo (bytes): {PDF_PATH.stat().st_size}")
    lines.append(f"Total de paginas do PDF: {num_pages}")
    lines.append(f"PDF Metadata (/Title): {getattr(meta, 'title', None)}")
    lines.append(f"PDF Metadata (/Author): {getattr(meta, 'author', None)}")
    lines.append("")

    for pno in range(1, num_pages + 1):
        txt = reader.pages[pno - 1].extract_text() or ""
        lines.append(f"--- [PDF PAGINA {pno} / {num_pages}] ---")
        lines.append(txt.strip())
        lines.append("")

    output_text = "\n".join(lines)
    OUT_PATH.write_text(output_text, encoding="utf-8")
    print(f"Extracao concluida: {num_pages} paginas no PDF. Saida gravada em {OUT_PATH.relative_to(ROOT).as_posix()}")


if __name__ == "__main__":
    main()
