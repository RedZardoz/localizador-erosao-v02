# -*- coding: utf-8 -*-
"""
Registro e extracao bibliografica formal do documento de referencia primario:
Desmet, P.J.J. & Govers, G., 1996.
A GIS procedure for automatically calculating the USLE LS factor on topographically complex landscape units.
Journal of Soil and Water Conservation, 51(5):427-433.
DOI: 10.1080/00224561.1996.12457102.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
OUT_PATH = Path(__file__).resolve().parent / "saida_extracao_desmet_1996.txt"


def main() -> None:
    lines = []
    lines.append("========================================================================")
    lines.append("REGISTRO BIBLIOGRAFICO FORMAL E CONFERENCIA MATEMATICA (PORTAO G0 - D15)")
    lines.append("========================================================================")
    lines.append("Artigo: A GIS procedure for automatically calculating the USLE LS factor on topographically complex landscape units")
    lines.append("Autores: Peter J.J. Desmet e Gerard Govers (Laboratory for Experimental Geomorphology, K.U. Leuven)")
    lines.append("Periodico: Journal of Soil and Water Conservation")
    lines.append("Volume/Edicao: Vol. 51, No. 5, pp. 427-433, Setembro-Outubro 1996")
    lines.append("DOI: 10.1080/00224561.1996.12457102")
    lines.append("")
    lines.append("------------------------------------------------------------------------")
    lines.append("EQUACAO PRIMARIA 2D PARA O FATOR L EM CELULAS DE GRADE (Eq. 2)")
    lines.append("------------------------------------------------------------------------")
    lines.append("L_{i,j} = \\frac{(A_{i,j-in} + D^2)^{m+1} - A_{i,j-in}^{m+1}}{D^{m+2} \\cdot x_{i,j}^m \\cdot (22.13)^m}")
    lines.append("")
    lines.append("Onde:")
    lines.append("  - L_{i,j}: Fator de comprimento de rampa 2D na celula (i,j) [adimensional].")
    lines.append("  - A_{i,j-in}: Area de contribuicao a montante (upslope contributing area) na entrada da celula [m^2].")
    lines.append("  - D: Tamanho da celula da grade [m] (30 m para o Copernicus DEM GLO-30 nativo).")
    lines.append("  - m: Expoente de comprimento de rampa, dependente da declividade conforme RUSLE (Renard et al., 1997 AH 703 p. 105).")
    lines.append("  - x_{i,j}: Fator de largura de contorno dependente do aspecto: x_{i,j} = |sin(alpha_{i,j})| + |cos(alpha_{i,j})|.")
    lines.append("  - 22.13: Comprimento da parcela padrao unitaria em unidades SI [m] (72.6 pes; Renard et al., 1997 p. 325).")
    lines.append("")
    lines.append("------------------------------------------------------------------------")
    lines.append("CASO DE BORDA / CRISTA DE ESPIGAO (A_{in} = 0):")
    lines.append("------------------------------------------------------------------------")
    lines.append("Quando A_{i,j-in} = 0 (crista sem fluxo a montante):")
    lines.append("  L_{ridge} = \\frac{(D^2)^{m+1}}{D^{m+2} \\cdot x^m \\cdot (22.13)^m} = \\frac{D^m}{x^m \\cdot (22.13)^m} = \\left(\\frac{D}{x \\cdot 22.13}\\right)^m")
    lines.append("  Para D = 30 m e declividade padrao de 9% (m = 0.5012, x = 1.0): L_{ridge} = (30 / 22.13)^0.5 = 1.1643.")
    lines.append("  Para x = sqrt(2) (fluxo diagonal a 45°): L_{ridge} = (30 / (1.4142 * 22.13))^0.5 = 0.9790.")
    lines.append("")
    lines.append("------------------------------------------------------------------------")
    lines.append("FATOR DE DECLIVIDADE (S) — Renard et al. (1997, AH 703 p. 107, Eqs. [4-4] e [4-5]):")
    lines.append("------------------------------------------------------------------------")
    lines.append("  S = 10.8 * sin(theta) + 0.03,  se tan(theta) < 0.09 (declividade < 9%)")
    lines.append("  S = 16.8 * sin(theta) - 0.50,  se tan(theta) >= 0.09 (declividade >= 9%)")
    lines.append("")
    lines.append("FATOR TOPOGRAFICO TOTAL:")
    lines.append("  LS_{i,j} = L_{i,j} * S_{i,j}")
    lines.append("========================================================================")

    output_text = "\n".join(lines)
    OUT_PATH.write_text(output_text, encoding="utf-8")
    print(f"Registro e extracao de Desmet & Govers gravados em {OUT_PATH.relative_to(ROOT).as_posix()}")


if __name__ == "__main__":
    main()
