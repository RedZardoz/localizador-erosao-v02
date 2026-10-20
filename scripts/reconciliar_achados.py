"""
Reconciliacao dos achados de auditoria do SAREL.

O QUE FAZ: le o indice de achados (docs/auditorias/INDICE_ACHADOS.json), cruza cada
remediacao declarada com o historico do git em TODAS as refs, e aponta divergencia
entre o estado declarado e a evidencia encontrada.

POR QUE EXISTE: um documento de reconciliacao apodrece no dia seguinte. O que nao
apodrece e um indice versionado mais um verificador que o confronta com o repositorio.
Este script e a trava; o JSON e o livro-razao.

LIMITE DECLARADO: casamento por mensagem de commit e PROXY, nao prova. Um bloco pode
ter sido executado dentro de um commit com outro prefixo, e uma mensagem pode citar um
ID sem implementa-lo. Por isso o script NAO decide estado: ele compara o estado
declarado no indice com a evidencia e lista as divergencias para conferencia humana.
Nenhum estado e inferido nem preenchido automaticamente (Regra 1).

USO:
    python scripts/reconciliar_achados.py                 # relatorio
    python scripts/reconciliar_achados.py --evidencias    # inclui os commits achados
"""

import json
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
INDICE = RAIZ / "docs/auditorias/INDICE_ACHADOS.json"

ESTADOS_VALIDOS = {"fechado", "aberto", "recusado-na-origem", "indeterminado"}


def _assuntos() -> list[tuple[str, str]]:
    """(sha, assunto) de todos os commits em todas as refs. Uma chamada so."""
    try:
        saida = subprocess.run(
            ["git", "log", "--all", "--format=%h\t%s"],
            cwd=RAIZ, capture_output=True, text=True, timeout=120,
        )
    except (subprocess.SubprocessError, OSError) as err:
        print(f"ERRO ao consultar o git: {err}", file=sys.stderr)
        return []
    pares = []
    for linha in saida.stdout.strip().split("\n"):
        if "\t" in linha:
            sha, assunto = linha.split("\t", 1)
            pares.append((sha, assunto))
    return pares


_CACHE_ASSUNTOS: list[tuple[str, str]] = []


def commits_do_token(token: str) -> list[str]:
    """
    Commits cujo ASSUNTO COMECA pelo token.

    Ancorado de proposito. A convencao do projeto (R9 dos prompts de executor) e
    "mensagem iniciando pelo ID". Busca por substring em toda a mensagem acusaria
    qualquer commit de documentacao que apenas CITE o identificador — inclusive os
    que relatam que o bloco segue pendente, que e o oposto do que se quer medir.
    Continua sendo proxy, nao prova.
    """
    global _CACHE_ASSUNTOS
    if not _CACHE_ASSUNTOS:
        _CACHE_ASSUNTOS = _assuntos()
    padrao = re.compile(rf"^{re.escape(token)}\b")
    return [f"{sha} {assunto}" for sha, assunto in _CACHE_ASSUNTOS if padrao.match(assunto)]


def main() -> int:
    mostrar_evidencias = "--evidencias" in sys.argv

    if not INDICE.exists():
        print(f"Indice nao encontrado: {INDICE}", file=sys.stderr)
        return 2

    dados = json.loads(INDICE.read_text(encoding="utf-8"))
    achados = dados["achados"]

    contagem: dict[str, int] = {}
    divergencias: list[str] = []
    invalidos: list[str] = []

    for a in achados:
        estado = a["estado"]
        contagem[estado] = contagem.get(estado, 0) + 1

        if estado not in ESTADOS_VALIDOS:
            invalidos.append(f"{a['id']}: estado desconhecido '{estado}'")
            continue

        # A conferencia e POR REMEDIACAO, nao por achado. Um achado fica aberto
        # quando QUALQUER uma de suas remediacoes esta aberta: cobrar commit das
        # outras seria acusar divergencia onde nao ha. E cada metodo tem a sua
        # evidencia propria — decisao se fecha em documento, nao em commit.
        for rem in a.get("remediacoes", []):
            token, est, metodo = rem["token"], rem["estado"], rem["metodo"]
            commits = commits_do_token(token)

            if metodo == "commit" and est == "fechado" and not commits:
                divergencias.append(
                    f"{a['id']}/{token}: declarado FECHADO por commit, mas nenhum "
                    "commit tem assunto iniciando por esse ID."
                )
            elif metodo in ("codigo-execucao", "regra-8") and est == "aberto" and commits:
                divergencias.append(
                    f"{a['id']}/{token}: declarado ABERTO, mas ha {len(commits)} "
                    f"commit(s) com assunto iniciando por esse ID ({commits[0]}). "
                    "Conferir se foi executado."
                )

            if mostrar_evidencias:
                for linha in commits:
                    print(f"  {a['id']} [{token}] {linha}")

    print("=" * 72)
    print("RECONCILIACAO DOS ACHADOS DE AUDITORIA — SAREL")
    print("=" * 72)
    print(f"Indice: {INDICE.relative_to(RAIZ)}")
    print(f"Total de achados: {len(achados)}\n")

    print("Por estado declarado:")
    for estado in sorted(contagem):
        print(f"  {estado:22s} {contagem[estado]:3d}")

    indeterminados = contagem.get("indeterminado", 0)
    if indeterminados:
        pct = 100.0 * indeterminados / len(achados)
        print(f"\n{indeterminados} achados ({pct:.0f}%) sem estado determinado por evidencia.")
        print("Isso NAO e falha do indice: e a medida honesta do que ainda")
        print("precisa de conferencia humana. Preencher por suposicao seria pior.")

    if invalidos:
        print(f"\nESTADOS INVALIDOS ({len(invalidos)}):")
        for i in invalidos:
            print(f"  {i}")

    print(f"\nDIVERGENCIAS entre estado declarado e evidencia de commit: {len(divergencias)}")
    for d in divergencias:
        print(f"  - {d}")
    if not divergencias:
        print("  (nenhuma)")

    print("\nLEMBRETE: casamento por mensagem de commit e proxy. Ausencia de commit")
    print("nao prova que nada foi feito; presenca nao prova que foi feito direito.")

    return 1 if (divergencias or invalidos) else 0


if __name__ == "__main__":
    sys.exit(main())
