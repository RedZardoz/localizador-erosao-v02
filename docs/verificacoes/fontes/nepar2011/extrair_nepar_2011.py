# -*- coding: utf-8 -*-
"""
Script de extracao e conferencia direta do documento primario:
docs/verificacoes/fontes/nepar2011/nepar_boletim_01_2011.pdf
(Waltrick, P.C.; Machado, M.A.M.; Oliveira, D.; Grimm, A.M.; Dieckow, J., 2011.
Erosividade de chuvas no Estado do Parana: atualizacao e influencia dos eventos 'El Nino' e 'La Nina'.
Boletim Tecnico No. 01, Sociedade Brasileira de Ciencia do Solo - Nucleo Estadual do Parana (SBCS-NEPAR),
Curitiba/PR, 21 pp. ISSN: 2236-2916).

Extrai e confere:
1. Metadados de integridade fisica: hash SHA-256, tamanho em bytes, contagem de paginas (21 pags no PDF).
2. Metadados estruturais do PDF (PdfReader).
3. Transcricao do texto integral de todas as paginas, incluindo:
   - Metodologia de estimativa por pluviometria (p. 9 do boletim, PDF p. 6).
   - Equacao (1) adaptada de Lombardi Neto (1977): Rc = p^2 / P.
   - Quadro 1.1: Erosividade media anual (R) em MJ.mm.ha^-1.h^-1.ano^-1 para as 114 localidades do Parana (pp. 12-13, PDF p. 8).
"""
import hashlib
import sys
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[4]
PDF_PATH = Path(__file__).resolve().parent / "nepar_boletim_01_2011.pdf"
OUT_PATH = Path(__file__).resolve().parent / "saida_extracao_nepar_2011.txt"


def sha256_file(filepath: Path) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    if not PDF_PATH.exists():
        print(f"ERRO: PDF nao encontrado em {PDF_PATH}", file=sys.stderr)
        sys.exit(1)

    file_size = PDF_PATH.stat().st_size
    file_sha256 = sha256_file(PDF_PATH)

    reader = PdfReader(str(PDF_PATH))
    num_pages = len(reader.pages)
    meta = reader.metadata

    lines = []
    lines.append("========================================================================")
    lines.append("EXTRACAO DIRETA E CONFERENCIA DE nepar_boletim_01_2011.pdf (SBCS-NEPAR)")
    lines.append("========================================================================")
    lines.append(f"Caminho relativo: {PDF_PATH.relative_to(ROOT).as_posix()}")
    lines.append(f"Tamanho do arquivo (bytes): {file_size}")
    lines.append(f"Hash SHA-256: {file_sha256}")
    lines.append(f"Total de paginas do PDF: {num_pages}")
    lines.append(f"PDF Metadata (/Title): {getattr(meta, 'title', None)}")
    lines.append(f"PDF Metadata (/Author): {getattr(meta, 'author', None)}")
    lines.append(f"PDF Metadata (/CreationDate): {getattr(meta, 'creation_date', None)}")
    lines.append(f"PDF Metadata (/Producer): {getattr(meta, 'producer', None)}")
    lines.append("")

    for idx, page in enumerate(reader.pages):
        pno = idx + 1
        txt = page.extract_text() or ""
        lines.append(f"--- [PDF PAGINA {pno} / {num_pages}] ---")
        lines.append(txt.strip())
        lines.append("")

    output_text = "\n".join(lines)
    OUT_PATH.write_text(output_text, encoding="utf-8")
    print(f"Extracao concluida: {num_pages} paginas. Saida gravada em {OUT_PATH.relative_to(ROOT).as_posix()}")


if __name__ == "__main__":
    main()
