# -*- coding: utf-8 -*-
"""
Script de extracao e conferencia direta do documento metodologico:
docs/verificacoes/fontes/schmidt2019/schmidt_2019_methodsx.pdf
(Schmidt, S.; Tresch, S.; Meusburger, K., 2019.
Modification of the RUSLE slope length and steepness factor (LS-factor) based on rainfall
experiments at steep alpine grasslands. MethodsX, 6:219-229. DOI: 10.1016/j.mex.2019.01.004).

Extrai e confere a formulacao explicita de Desmet & Govers (1996) e Renard et al. (1997):
- Eq. (2) (Desmet & Govers 1996): L_{i,j} = [(A_{i,j-in} + D^2)^{m+1} - A_{i,j-in}^{m+1}] / [D^{m+2} * X_{i,j}^m * 22.13^m]
- Eq. (3) (Renard et al. 1997): m = beta / (1 + beta)
- Eq. (4) (Renard et al. 1997): beta = (sin theta / 0.0896) / [0.56 + 3 * (sin theta)^0.8]
"""
import hashlib
import sys
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[4]
PDF_PATH = Path(__file__).resolve().parent / "schmidt_2019_methodsx.pdf"
OUT_PATH = Path(__file__).resolve().parent / "saida_extracao_schmidt_2019.txt"


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
    lines.append("EXTRACAO DIRETA E CONFERENCIA DE schmidt_2019_methodsx.pdf (Elsevier MethodsX)")
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
