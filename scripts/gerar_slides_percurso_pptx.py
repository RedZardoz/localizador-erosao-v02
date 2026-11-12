#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SAREL — slides de percurso, reprodutibilidade, prevencao de vicios e pipeline.

Acrescenta cinco slides ao deck base gerado por scripts/gerar_apresentacao_pptx.py,
mantendo o slide de contato no fim. Um unico comando reproduz o deck inteiro:

    python3 scripts/gerar_slides_percurso_pptx.py

Nada aqui e evidencia: todo numero exibido vem de medicao registrada no repositorio
(selo de D16, registro de decisoes, contagem de testes) e esta citado no slide.
"""
from __future__ import annotations

import copy
import os
import sys

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gerar_apresentacao_pptx import (  # noqa: E402
    criar_apresentacao,
    C_NAVY_DARK, C_BG_LIGHT, C_CARD_LIGHT, C_BORDER_LIGHT,
    C_EMERALD_DARK, C_EMERALD_MID, C_EMERALD_LIGHT, C_MINT_BG,
    C_CYAN_DARK, C_CYAN_LIGHT, C_AMBER_DARK, C_AMBER_BG,
    C_ROSE_DARK, C_ROSE_BG, C_TEXT_DARK, C_TEXT_MUTED, C_TEXT_LIGHT, C_WHITE,
)

CAT = "PPGTCA 2026 • PESQUISA DE MESTRADO EM EROSÃO LAMINAR (UTFPR)"


def _txt(slide, x, y, w, h, texto, tam=11, cor=C_TEXT_DARK, bold=False,
         align=PP_ALIGN.LEFT, espaco=0):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = Inches(0.03)
    tf.margin_top = tf.margin_bottom = 0
    linhas = texto.split("\n")
    for i, ln in enumerate(linhas):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = ln
        p.font.size = Pt(tam)
        p.font.bold = bold
        p.font.color.rgb = cor
        p.alignment = align
        p.space_after = Pt(espaco)
    return tb


def _caixa(slide, x, y, w, h, fill, borda, raio=True):
    sh = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE if raio else MSO_SHAPE.RECTANGLE,
        Inches(x), Inches(y), Inches(w), Inches(h))
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    sh.line.color.rgb = borda
    sh.line.width = Pt(1)
    sh.shadow.inherit = False
    sh.text_frame.text = ""
    return sh


def _slide(prs, titulo, subtitulo=None):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = C_BG_LIGHT
    barra = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0),
                               Inches(13.333), Inches(1.15))
    barra.fill.solid()
    barra.fill.fore_color.rgb = C_NAVY_DARK
    barra.line.color.rgb = C_NAVY_DARK
    barra.shadow.inherit = False
    _txt(s, 0.8, 0.12, 11.7, 0.3, CAT, tam=9.5, cor=C_EMERALD_LIGHT, bold=True)
    _txt(s, 0.8, 0.40, 11.7, 0.6, titulo, tam=19, cor=C_WHITE, bold=True)
    if subtitulo:
        _txt(s, 0.8, 1.30, 11.7, 0.42, subtitulo, tam=11.5, cor=C_TEXT_MUTED)
    return s


def _linha_tempo(slide, itens, y, x0=0.85, x1=12.5, cor=C_EMERALD_MID,
                 alt_rotulo=0.30, alt_texto=1.25, tam_data=9.5, tam_texto=8.8):
    """Linha do tempo horizontal. itens = [(data, titulo, descricao), ...]."""
    n = len(itens)
    eixo = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x0), Inches(y),
                                  Inches(x1 - x0), Inches(0.045))
    eixo.fill.solid()
    eixo.fill.fore_color.rgb = cor
    eixo.line.fill.background()
    eixo.shadow.inherit = False

    passo = (x1 - x0) / (n - 1) if n > 1 else 0
    larg = min(passo * 0.95, 2.6) if n > 1 else 4.0
    for i, (data, tit, desc) in enumerate(itens):
        cx = x0 + i * passo
        d = 0.26
        no = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(cx - d / 2),
                                    Inches(y - d / 2 + 0.022), Inches(d), Inches(d))
        no.fill.solid()
        no.fill.fore_color.rgb = C_WHITE
        no.line.color.rgb = cor
        no.line.width = Pt(2.25)
        no.shadow.inherit = False
        xs = max(0.15, min(cx - larg / 2, 13.333 - larg - 0.15))
        _txt(slide, xs, y - alt_rotulo - 0.30, larg, alt_rotulo, data,
             tam=tam_data, cor=cor, bold=True, align=PP_ALIGN.CENTER)
        _txt(slide, xs, y + 0.26, larg, alt_texto,
             tit + "\n" + desc, tam=tam_texto, cor=C_TEXT_DARK,
             align=PP_ALIGN.CENTER)
        # titulo em negrito
        tb = slide.shapes[-1]
        tb.text_frame.paragraphs[0].font.bold = True
        tb.text_frame.paragraphs[1].font.color.rgb = C_TEXT_MUTED
        tb.text_frame.paragraphs[1].font.size = Pt(tam_texto - 0.6)


def _rodape(slide, texto):
    _txt(slide, 0.85, 6.95, 11.7, 0.38, texto, tam=8.5, cor=C_TEXT_MUTED)


# ---------------------------------------------------------------- slides

def slide_percurso(prs):
    s = _slide(prs, "O percurso até aqui",
               "Do diagnóstico de coerência à amostra sorteada e lacrada — nove semanas de trabalho medido, não estimado.")
    _linha_tempo(s, [
        ("SET/2026", "Auditoria integral",
         "Coerência e efetividade do desenho auditadas de ponta a ponta."),
        ("OUT/2026", "Contenção",
         "Removido todo caminho capaz de gravar dado falso; contrato da matriz fixado."),
        ("04/11", "Referencial corrigido",
         "Referencial teórico reconferido no primário arquivado."),
        ("09/11", "Máscara no primário",
         "Solo exposto reimplantado a partir de Demattê et al. (2018), não de fonte secundária."),
        ("10/11", "Medição e sorteio",
         "677 candidatos medidos; 67 polígonos sorteados e lacrados com semente pré-registrada."),
        ("11/11", "Cegamento e fluxo",
         "Cegamento por distribuição em 4 perfis; interface reorganizada pelo pipeline."),
        ("12/11", "HOJE",
         "Revisão operacional em conclusão; instrumentação da delineação em preparo."),
    ], y=3.05)

    _caixa(s, 0.85, 4.95, 11.65, 1.75, C_MINT_BG, C_EMERALD_MID)
    _txt(s, 1.15, 5.15, 11.05, 0.3, "ONDE ESTAMOS, EM UMA FRASE", tam=10,
         cor=C_EMERALD_DARK, bold=True)
    _txt(s, 1.15, 5.50, 11.05, 1.1,
         "O desenho amostral está fechado e lacrado: 67 polígonos, 34 de treino e 33 de held-out, 336,34 ha, "
         "sorteados uma única vez com semente pré-registrada 20261110 e selados por hash. O que falta não é desenho — "
         "é instrumentar a entrada do dado de campo e encerrar a revisão operacional, que segue em conclusão.",
         tam=11.5, cor=C_TEXT_DARK)
    _rodape(s, "Fontes: docs/verificacoes/selo_publico_d16_2026-11-10.json; src/config/decisoes.ts; docs/planejamento/prompts/README.md.")
    return s


def slide_duas_revisoes(prs):
    s = _slide(prs, "Revisão operacional, ancorada pela revisão científica",
               "Duas frentes correm juntas. A científica tem precedência: quando as duas divergem, o código muda.")

    _txt(s, 0.85, 1.85, 11.65, 0.3, "FRENTE CIENTÍFICA — o que a literatura primária exige", tam=10,
         cor=C_CYAN_DARK, bold=True)
    _linha_tempo(s, [
        ("Norma de Lastro", "R-L1 a R-L5",
         "Autorreferência não é lastro. Só o primário arquivado conta."),
        ("Conferência", "Primário lido",
         "Demattê et al. (2018), RSE 212:161-175, conferido página a página."),
        ("Achado", "Fonte secundária errada",
         "A máscara difundida em terceiros não é a do artigo de 2018."),
        ("Consequência", "Código corrigido",
         "Máscara de 4 testes reimplantada; variante de 2020 separada e citada à parte."),
    ], y=2.72, x0=1.0, x1=12.3, cor=C_CYAN_LIGHT, alt_texto=1.05)

    _txt(s, 0.85, 4.35, 11.65, 0.3, "FRENTE OPERACIONAL — o que o sistema passa a recusar", tam=10,
         cor=C_EMERALD_DARK, bold=True)
    _linha_tempo(s, [
        ("Parâmetro", "Decisão pendente trava",
         "Parâmetro não decidido lança erro; não há valor por omissão."),
        ("Suficiência", "Guarda de D11.2",
         "Ê exige n ≥ 12 observações válidas, em três camadas independentes."),
        ("Selo", "8 invariantes",
         "O sorteio só devolve resultado se os oito passarem."),
        ("Travas", "Teste de mutação",
         "Cada trava é quebrada de propósito para provar que acusa."),
    ], y=5.22, x0=1.0, x1=12.3, cor=C_EMERALD_MID, alt_texto=1.05)

    _rodape(s, "A correção da máscara é o caso documentado: a revisão científica achou o erro, a operacional o corrigiu e travou. Ver D10 e a emenda de 09/11/2026 em src/config/decisoes.ts.")
    return s


def slide_reprodutibilidade(prs):
    s = _slide(prs, "Reprodutibilidade contra a deriva probabilística",
               "A preocupação central do projeto: um resultado que não se repete não é resultado.")

    _caixa(s, 0.85, 1.80, 5.6, 1.5, C_ROSE_BG, C_ROSE_DARK)
    _txt(s, 1.15, 1.98, 5.0, 0.3, "O RISCO", tam=10, cor=C_ROSE_DARK, bold=True)
    _txt(s, 1.15, 2.30, 5.0, 0.95,
         "Sistemas de IA respondem de modo probabilístico: a mesma pergunta pode devolver outra resposta, "
         "e a diferença não fica registrada em lugar nenhum.", tam=10.5, cor=C_TEXT_DARK)

    _caixa(s, 6.9, 1.80, 5.6, 1.5, C_MINT_BG, C_EMERALD_MID)
    _txt(s, 7.2, 1.98, 5.0, 0.3, "A POSTURA DO SAREL", tam=10, cor=C_EMERALD_DARK, bold=True)
    _txt(s, 7.2, 2.30, 5.0, 0.95,
         "O SAREL não é um sistema generativo: é um funil determinístico. O mesmo insumo devolve o mesmo "
         "resultado, e o que não se pode repetir, o sistema recusa executar.", tam=10.5, cor=C_TEXT_DARK)

    _linha_tempo(s, [
        ("1", "Decisão registrada",
         "Cada parâmetro tem estado explícito."),
        ("2", "Semente pré-registrada",
         "20261110, fixada antes do sorteio."),
        ("3", "Sorteio único",
         "Sem descarte, sobrescrita ou versão _v2."),
        ("4", "Selo por hash",
         "sha256 do conjunto de candidatos."),
        ("5", "Repetição conferida",
         "Clone limpo devolve 67 / 34 / 33."),
        ("6", "Travas provadas",
         "955 testes, quebrados de propósito."),
    ], y=4.55, cor=C_EMERALD_MID, alt_texto=1.30)

    _caixa(s, 0.85, 6.25, 11.65, 0.62, C_AMBER_BG, C_AMBER_DARK)
    _txt(s, 1.15, 6.37, 11.05, 0.42,
         "Onde há aprendizado de máquina, a avaliação é única e pré-registrada: o held-out é lacrado e a tentativa, "
         "uma vez consumida, não se repete.", tam=10.5, cor=C_TEXT_DARK, bold=True)
    return s


def slide_vicios(prs):
    s = _slide(prs, "Prevenção de vícios de treinamento",
               "Cada porta por onde o viés entraria foi fechada antes de haver qualquer dado de treino.")

    _caixa(s, 0.85, 1.80, 11.65, 1.42, C_CARD_LIGHT, C_CYAN_DARK)
    _txt(s, 1.15, 1.96, 11.05, 0.3, "O PAPEL DO VANT DE ALTA RESOLUÇÃO", tam=10, cor=C_CYAN_DARK, bold=True)
    _txt(s, 1.15, 2.28, 11.05, 0.92,
         "A 3,8 cm de GSD medido, cada célula de 10 m contém cerca de 69.252 micropixels. O rótulo deixa de ser um "
         "julgamento visual sobre um pixel de satélite e passa a ser a fração contínua da célula delineada sobre o "
         "ortomosaico — uma medida de área, não uma opinião. É a diferença entre treinar contra a percepção de um "
         "intérprete e treinar contra a geometria do terreno.", tam=11, cor=C_TEXT_DARK)

    _linha_tempo(s, [
        ("VIÉS DO OLHO", "Fotointerpretação aposentada",
         "Sai o julgamento visual sobre pixel de 10 m."),
        ("VIÉS DA FÓRMULA", "Fatores RUSLE proibidos",
         "Não entra a fórmula contra a qual se testa."),
        ("VIÉS DO OPERADOR", "Cegamento por distribuição",
         "Quem voa não vê estrato nem π_i."),
        ("VIÉS DA SELEÇÃO", "Amostragem probabilística",
         "π_i × w_i = 1; deficiente vira censo."),
        ("VIÉS DA TENTATIVA", "Held-out lacrado",
         "Avaliação única, tentativa consumida."),
    ], y=4.75, cor=C_CYAN_LIGHT, alt_texto=1.30, tam_data=9)

    _rodape(s, "Decisões D16 item 4 (aposentadoria da fotointerpretação), D25 (pré-registro e preditores proibidos) e D26 (alvo por delineação). Fonte: src/config/decisoes.ts.")
    return s


def slide_pipeline(prs):
    s = _slide(prs, "O pipeline em execução hoje",
               "Oito fases. Cada uma só abre quando a anterior entrega o que a próxima exige.")

    fases = [
        ("1", "ÁREA", "Concluída", C_EMERALD_MID,
         "Bacia do Paraná 3 delimitada e ativada como área de interesse."),
        ("2", "TRIAGEM", "Critério fixado", C_EMERALD_MID,
         "Candidatos filtrados por máscara espectral de solo exposto, não por limiar isolado."),
        ("3", "MEDIÇÃO", "Concluída", C_EMERALD_MID,
         "677 candidatos medidos, de 148 a 1.011 observações por ponto."),
        ("4", "SORTEIO", "Concluído e lacrado", C_EMERALD_MID,
         "67 polígonos: 34 treino, 33 held-out, 336,34 ha, semente 20261110."),
        ("5", "VOOS", "A implementar", C_AMBER_DARK,
         "Planos de voo por polígono sorteado; áreas definidas pelo sistema."),
        ("6", "CAMPO", "Aguardando", C_AMBER_DARK,
         "Coleta de campo e delineação sobre o ortomosaico do VANT."),
        ("7", "MATRIZ", "Bloqueada", C_ROSE_DARK,
         "Só monta quando houver rótulo de campo; sem rótulo, recusa."),
        ("8", "AUDITORIA", "Contínua", C_CYAN_DARK,
         "Invariantes, cadeia de verificação e auditoria forense, a qualquer momento."),
    ]

    x0, y0, w, h, gx, gy = 0.85, 2.05, 2.82, 2.05, 0.11, 0.42
    for i, (num, nome, status, cor, legenda) in enumerate(fases):
        col, lin = i % 4, i // 4
        x = x0 + col * (w + gx)
        y = y0 + lin * (h + gy)
        _caixa(s, x, y, w, h, C_CARD_LIGHT, C_BORDER_LIGHT)
        barra = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y),
                                   Inches(w), Inches(0.065))
        barra.fill.solid()
        barra.fill.fore_color.rgb = cor
        barra.line.fill.background()
        barra.shadow.inherit = False
        _txt(s, x + 0.16, y + 0.18, 0.4, 0.3, num, tam=15, cor=cor, bold=True)
        _txt(s, x + 0.56, y + 0.22, w - 0.72, 0.3, nome, tam=12, cor=C_TEXT_DARK, bold=True)
        _txt(s, x + 0.16, y + 0.60, w - 0.32, 0.26, status.upper(), tam=8.5, cor=cor, bold=True)
        _txt(s, x + 0.16, y + 0.92, w - 0.32, 1.0, legenda, tam=9, cor=C_TEXT_MUTED)
        if col < 3:
            seta = s.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(x + w + 0.005),
                                      Inches(y + h / 2 - 0.09), Inches(0.10), Inches(0.18))
            seta.fill.solid()
            seta.fill.fore_color.rgb = C_BORDER_LIGHT
            seta.line.fill.background()
            seta.shadow.inherit = False

    _caixa(s, 0.85, 6.62, 11.65, 0.58, C_MINT_BG, C_EMERALD_MID)
    _txt(s, 1.15, 6.74, 11.05, 0.38,
         "A fase 4 encerrou o desenho amostral. O trabalho imediato é instrumentar a entrada da delineação do VANT "
         "(fase 6), que é o que destrava a matriz.", tam=10.5, cor=C_TEXT_DARK, bold=True)
    return s


def slide_proximos_passos(prs):
    s = _slide(prs, "O que vem a seguir",
               "Encerrada a revisão, a campanha entra em execução. O rendimento abaixo vem das missões de VANT já voadas.")
    _linha_tempo(s, [
        ("REVISÃO", "Encerrar a revisão",
         "Três correções e duas decisões."),
        ("AUTORIZAÇÕES", "67 pedidos",
         "Um por polígono, sem estrato."),
        ("VOOS", "336,34 ha de VANT",
         "145 min de voo no melhor caso medido."),
        ("DELINEAÇÃO", "Sobre o ortomosaico",
         "Fração contínua da célula, por rasterização."),
        ("CAMPO", "SAREL Coletor",
         "60 a 80 pontos fora dos polígonos."),
        ("MATRIZ", "Avaliação única",
         "Held-out lacrado, tentativa consumida."),
    ], y=2.70, cor=C_EMERALD_MID, alt_texto=1.15, tam_data=8.5)

    _caixa(s, 0.85, 4.15, 5.6, 2.35, C_CARD_LIGHT, C_EMERALD_MID)
    _txt(s, 1.12, 4.32, 5.1, 0.3, "RENDIMENTO DE VOO — MEDIDO, NÃO ESTIMADO", tam=9.5,
         cor=C_EMERALD_DARK, bold=True)
    _txt(s, 1.12, 4.66, 5.1, 1.75,
         "Missão 009 (Medianeira): 21,56 ha reconstruídos em 9,3 min = 2,32 ha/min.\n"
         "Missão 000 (Céu Azul): 6,84 ha em 13,0 min = 0,53 ha/min.\n\n"
         "67 polígonos × 5,02 ha = 336,34 ha\n"
         "→ 145 min de voo (2,4 h), 2,2 min por polígono.\n"
         "→ 11 a 16 sortidas, pela duração observada dos dois voos.",
         tam=10, cor=C_TEXT_DARK, espaco=1)

    _caixa(s, 6.9, 4.15, 5.6, 2.35, C_AMBER_BG, C_AMBER_DARK)
    _txt(s, 7.17, 4.32, 5.1, 0.3, "O QUE AINDA NÃO ESTÁ MEDIDO", tam=9.5,
         cor=C_AMBER_DARK, bold=True)
    _txt(s, 7.17, 4.66, 5.1, 1.75,
         "Capacidade e número de baterias, tempo de troca e de recarga não constam do "
         "repositório: as sortidas saem da duração dos voos, não de especificação.\n\n"
         "A campanha é dominada por deslocamento e montagem, não por bateria — e esse "
         "tempo não foi medido. O risco maior é a reconstrução: entre as duas missões ela "
         "varia 4,4×, e é daí que vem a diferença de produtividade.",
         tam=10, cor=C_TEXT_DARK, espaco=1)

    _rodape(s, "Fonte: docs/verificacoes/voo/cobertura_voos.geojson e docs/verificacoes/voo/rendimento_voo_67_poligonos_2026-11-12.md. Os pontos do SAREL Coletor não treinam o modelo: ancoram a prevalência real e calibram a acurácia posicional.")
    return s


def mover_para_o_fim(prs, indice):
    """Move o slide de indice dado para o fim, preservando o restante."""
    lst = prs.slides._sldIdLst
    ids = list(lst)
    lst.remove(ids[indice])
    lst.append(ids[indice])


def main(caminho=None):
    caminho = caminho or os.path.join("docs", "apresentacoes",
                                      "Apresentacao_SAREL_PPGTCA_2026.pptx")
    criar_apresentacao(caminho)
    prs = Presentation(caminho)
    base = len(prs.slides._sldIdLst)
    indice_contato = base - 1

    slide_percurso(prs)
    slide_duas_revisoes(prs)
    slide_reprodutibilidade(prs)
    slide_vicios(prs)
    slide_pipeline(prs)
    slide_proximos_passos(prs)

    mover_para_o_fim(prs, indice_contato)
    prs.save(caminho)
    print(f"[OK] {base} slides base + 6 novos = {len(prs.slides._sldIdLst)} slides em {caminho}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else None))
