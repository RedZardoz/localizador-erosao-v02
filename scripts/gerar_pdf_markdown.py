"""Renderiza o planejamento em PDF (reportlab, mesma pilha dos geradores do SAREL)."""
import re
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ENTRADA, SAIDA = sys.argv[1], sys.argv[2]

AZUL = colors.HexColor("#1F3864")
CINZA = colors.HexColor("#4A4A4A")
CLARO = colors.HexColor("#EDF1F7")
BORDA = colors.HexColor("#C3CCD9")

base = getSampleStyleSheet()
S = {
    "h1": ParagraphStyle("h1", parent=base["Heading1"], fontSize=16, leading=20,
                         textColor=AZUL, spaceBefore=14, spaceAfter=8),
    "h2": ParagraphStyle("h2", parent=base["Heading2"], fontSize=12.5, leading=16,
                         textColor=AZUL, spaceBefore=12, spaceAfter=6),
    "h3": ParagraphStyle("h3", parent=base["Heading3"], fontSize=10.8, leading=14,
                         textColor=CINZA, spaceBefore=9, spaceAfter=4),
    "p": ParagraphStyle("p", parent=base["BodyText"], fontSize=9.3, leading=13.4,
                        alignment=TA_JUSTIFY, spaceAfter=5),
    "li": ParagraphStyle("li", parent=base["BodyText"], fontSize=9.3, leading=13.4,
                         alignment=TA_LEFT, leftIndent=11, bulletIndent=3, spaceAfter=3),
    "cel": ParagraphStyle("cel", parent=base["BodyText"], fontSize=8.1, leading=10.6,
                          alignment=TA_LEFT, spaceAfter=0),
    "celh": ParagraphStyle("celh", parent=base["BodyText"], fontSize=8.1, leading=10.6,
                           alignment=TA_LEFT, textColor=colors.white, spaceAfter=0),
    "cod": ParagraphStyle("cod", parent=base["BodyText"], fontName="Courier", fontSize=8,
                          leading=10.5, leftIndent=8, textColor=CINZA, spaceAfter=5),
    # Citacao em bloco: usada para avisos e notas de correcao, que precisam saltar
    # aos olhos de quem le o documento em diagonal.
    "cit": ParagraphStyle("cit", parent=base["BodyText"], fontSize=9, leading=13,
                          alignment=TA_JUSTIFY, leftIndent=10, rightIndent=6,
                          backColor=CLARO, borderColor=AZUL, borderWidth=0,
                          borderPadding=6, spaceBefore=4, spaceAfter=6),
}


def inline(t: str) -> str:
    """
    Markdown inline -> marcacao do reportlab. Escapa XML primeiro.

    Os trechos entre crases sao RETIRADOS antes das substituicoes de negrito e
    italico e devolvidos no fim. Sem isso, um asterisco dentro de codigo (por
    exemplo `tamanhoAmostra * 25`) e consumido como marcador de italico e produz
    aninhamento invalido, que o reportlab rejeita com erro de parse.
    """
    t = t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    guardados: list[str] = []

    def _guardar(m: re.Match) -> str:
        guardados.append(m.group(1))
        return f"\x00{len(guardados) - 1}\x00"

    t = re.sub(r"`([^`]+)`", _guardar, t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"(?<![\*\w])\*([^*\n]+)\*(?!\*)", r"<i>\1</i>", t)

    for i, codigo in enumerate(guardados):
        t = t.replace(f"\x00{i}\x00", f'<font face="Courier" size="8.2">{codigo}</font>')
    return t


def larguras(n: int, total: float):
    if n == 2:
        return [total * 0.34, total * 0.66]
    if n == 3:
        return [total * 0.30, total * 0.20, total * 0.50]
    if n == 4:
        return [total * 0.26, total * 0.22, total * 0.22, total * 0.30]
    return [total / n] * n


def monta_tabela(linhas, total):
    dados, n = [], len(linhas[0])
    for i, linha in enumerate(linhas):
        estilo = S["celh"] if i == 0 else S["cel"]
        # Normaliza a linha ao nº de colunas do cabeçalho: um "|" solto dentro de
        # uma célula criaria coluna fantasma e estouraria a margem direita.
        if len(linha) > n:
            linha = linha[: n - 1] + [" | ".join(linha[n - 1:])]
        elif len(linha) < n:
            linha = linha + [""] * (n - len(linha))
        dados.append([Paragraph(inline(c), estilo) for c in linha])
    t = Table(dados, colWidths=larguras(n, total), repeatRows=1, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), AZUL),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, CLARO]),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDA),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def rodape(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(CINZA)
    canvas.drawString(20 * mm, 12 * mm, "SAREL — Planejamento para tornar o sistema funcional e útil à pesquisa · 19/10/2026")
    canvas.drawRightString(A4[0] - 20 * mm, 12 * mm, f"p. {doc.page}")
    canvas.setStrokeColor(BORDA)
    canvas.line(20 * mm, 15 * mm, A4[0] - 20 * mm, 15 * mm)
    canvas.restoreState()


doc = SimpleDocTemplate(
    SAIDA, pagesize=A4,
    leftMargin=20 * mm, rightMargin=20 * mm, topMargin=18 * mm, bottomMargin=20 * mm,
    title="Planejamento SAREL — funcional e útil para a pesquisa",
    author="SAREL / PPGTCA 2026",
)
UTIL = A4[0] - 40 * mm

fluxo, buffer_tab, bloco_cod = [], [], []
em_codigo = False

for bruta in open(ENTRADA, encoding="utf-8").read().split("\n"):
    linha = bruta.rstrip()

    if linha.strip().startswith("```"):
        if em_codigo:
            for c in bloco_cod:
                fluxo.append(Paragraph(inline(c), S["cod"]))
            bloco_cod, em_codigo = [], False
        else:
            em_codigo = True
        continue
    if em_codigo:
        bloco_cod.append(linha if linha.strip() else "&nbsp;")
        continue

    # tabelas
    if linha.startswith("|"):
        celulas = [c.strip() for c in linha.strip().strip("|").split("|")]
        if not all(re.fullmatch(r":?-{2,}:?", c) for c in celulas):
            buffer_tab.append(celulas)
        continue
    if buffer_tab:
        fluxo.append(Spacer(1, 3))
        fluxo.append(monta_tabela(buffer_tab, UTIL))
        fluxo.append(Spacer(1, 7))
        buffer_tab = []

    if not linha.strip():
        continue
    if linha.startswith("---"):
        fluxo.append(Spacer(1, 4))
        fluxo.append(HRFlowable(width="100%", thickness=0.6, color=BORDA))
        fluxo.append(Spacer(1, 4))
    elif linha.startswith("#### "):
        fluxo.append(Paragraph(inline(linha[5:]), S["h3"]))
    elif linha.startswith("### "):
        fluxo.append(Paragraph(inline(linha[4:]), S["h3"]))
    elif linha.startswith("## "):
        fluxo.append(Paragraph(inline(linha[3:]), S["h2"]))
    elif linha.startswith("# "):
        fluxo.append(Paragraph(inline(linha[2:]), S["h1"]))
    elif linha.startswith(">"):
        corpo = re.sub(r"^>\s?", "", linha)
        if corpo.strip():
            fluxo.append(Paragraph(inline(corpo), S["cit"]))
    elif re.match(r"^\s*[-*] ", linha):
        fluxo.append(Paragraph(inline(re.sub(r"^\s*[-*] ", "", linha)), S["li"], bulletText="•"))
    elif re.match(r"^\s*\d+\. ", linha):
        num = re.match(r"^\s*(\d+)\. ", linha).group(1)
        fluxo.append(Paragraph(inline(re.sub(r"^\s*\d+\. ", "", linha)), S["li"], bulletText=f"{num}."))
    else:
        fluxo.append(Paragraph(inline(linha), S["p"]))

if buffer_tab:
    fluxo.append(monta_tabela(buffer_tab, UTIL))

doc.build(fluxo, onFirstPage=rodape, onLaterPages=rodape)
print(f"OK -> {SAIDA}")
