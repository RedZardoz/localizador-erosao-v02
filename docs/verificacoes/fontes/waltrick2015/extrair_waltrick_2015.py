# -*- coding: utf-8 -*-
"""
Script de extracao e conferencia direta do documento primario:
docs/verificacoes/fontes/waltrick2015/waltrick_2015.pdf
(Waltrick et al., 2015 — Estimativa da erosividade de chuvas no estado do Parana
pelo metodo da pluviometria: atualizacao com dados de 1986 a 2008.
Revista Brasileira de Ciencia do Solo, 39:256-267, 2015. DOI: 10.1590/01000683rbcs20150147).

Extrai:
1. Metadados de prova de acesso: numero total de paginas (len(reader.pages)),
   metadados do PDF (/CreationDate, /Producer, etc.), texto integral das paginas
   de titulo, autoria e resumo (p. 256).
2. Metodologia, equacoes numeradas de erosividade regional do Parana,
   coeficiente de chuva Rc, relacao EI30 mensal e anual, e tabelas de coeficientes
   por regiao/estacao (PDF pp. 1-12 / R. Bras. Ci. Solo pp. 256-267).
"""
import sys
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[4]
PDF_PATH = Path(__file__).resolve().parent / "waltrick_2015.pdf"
OUT_PATH = Path(__file__).resolve().parent / "saida_extracao_waltrick_2015.txt"


def main() -> None:
    if not PDF_PATH.exists():
        print(f"ERRO: PDF nao encontrado em {PDF_PATH}", file=sys.stderr)
        sys.exit(1)

    reader = PdfReader(str(PDF_PATH))
    num_pages = len(reader.pages)
    meta = reader.metadata

    lines = []
    lines.append("========================================================================")
    lines.append("EXTRACAO DIRETA DE waltrick_2015.pdf VIA pypdf.PdfReader")
    lines.append("========================================================================")
    lines.append(f"Caminho relativo: {PDF_PATH.relative_to(ROOT).as_posix()}")
    lines.append(f"Tamanho do arquivo (bytes): {PDF_PATH.stat().st_size}")
    lines.append(f"Total de paginas do PDF (len(reader.pages)): {num_pages}")
    lines.append(f"PDF Metadata (/Title): {getattr(meta, 'title', None)}")
    lines.append(f"PDF Metadata (/Author): {getattr(meta, 'author', None)}")
    lines.append(f"PDF Metadata (/CreationDate): {getattr(meta, 'creation_date', None)}")
    lines.append(f"PDF Metadata (/Producer): {getattr(meta, 'producer', None)}")
    lines.append("")

    for idx, page in enumerate(reader.pages):
        pno = idx + 1
        txt = page.extract_text() or ""
        lines.append(f"--- [PDF PAGINA {pno} / {num_pages} (RBCS p. {255 + pno})] ---")
        lines.append(txt.strip())
        lines.append("")

    output_text = "\n".join(lines)
    OUT_PATH.write_text(output_text, encoding="utf-8")
    print(
        f"Extracao concluida: {num_pages} paginas no PDF. Saida gravada em {OUT_PATH.relative_to(ROOT).as_posix()}"
    )


if __name__ == "__main__":
    main()
