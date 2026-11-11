# PROMPT S — EXECUTOR SAREL — apresentação (PPTX) e documento (DOCX) didáticos

**Urgente: há apresentação hoje.** Priorize a entrega funcional sobre o refinamento.

**Reaproveite os geradores existentes; não escreva do zero.** `scripts/gerar_apresentacao_pptx.py`
tem 940 linhas e `scripts/gerar_docx_metodologia_integrada.py` tem 913. Ambos foram tocados pela
última vez em **31/10/2026** — antes de todo o trabalho de 09 a 11/11 — e estão desatualizados.

---

## 0. PROTOCOLO

`docs/DESENVOLVIMENTO.md`. Informe o branch e permaneça nele. Saídas em
`docs/verificacoes/execucao/2026-11-11s/`. **Commit escrito depois do fato. `git push` confirmado.**

**Regra que vale mais que todas nesta rodada: nenhum número vem de memória.** Tudo que for
numérico sai de artefato versionado — `docs/verificacoes/selo_publico_d16_2026-11-10.json`,
`src/config/decisoes.ts`, `docs/verificacoes/cache_frequencia_solo_nu_bp3.json` ou os documentos de
evidência. Se não achar a fonte, **omita o número** em vez de estimá-lo.

---

## TAREFA 1 — o que está desatualizado, medido

Em `scripts/gerar_apresentacao_pptx.py`: **seis ocorrências de `0.25`** e quatro de `GEOS3`, nenhuma
de `NBR2`, nenhuma de `677`, nenhuma de `67 polígonos`. Ou seja: a apresentação descreve o limiar
isolado de NDVI, anterior à máscara GEOS3, e não contém nada do que foi medido esta semana.

Corrija e acrescente, conforme as seções abaixo. Grave antes a varredura:

```
grep -n -iE "0[.,]25|GEOS3|NDVI|Fator C|D0[0-9]|D1[0-9]|D2[0-6]" scripts/gerar_apresentacao_pptx.py
```

---

## TAREFA 2 — a apresentação (PPTX)

Didática, para banca e para público não especialista. Estrutura sugerida, ajustável:

**(1) O problema.** Erosão laminar é difusa, não deixa cicatriz óbvia e é subdetectada. A Bacia do
Paraná 3 tem agricultura intensiva sobre solos de erodibilidade variável.

**(2) Por que o SAREL existe.** A pergunta de pesquisa: um modelo supervisionado sobre dados
orbitais detecta erosão laminar melhor que a linha de base física RUSLE? Explique que a resposta
exige três coisas que normalmente faltam — amostra probabilística, rótulo humano independente e
avaliação única pré-registrada.

**(3) O método, em quatro passos.** Delimitar; medir três dimensões biofísicas (declividade,
exposição de solo, erodibilidade); estratificar e sortear; coletar em campo e treinar.

**(4) A máscara de solo exposto.** Conjunção de cinco testes de Demattê et al. (2018), conferido no
primário. Explique **por que o NBR2 importa**: o NDVI isolado não separa palhada de solo mineral, e
é o componente no SWIR que faz essa separação (Daughtry et al., 2001; 2004; Hively et al., 2021).
Esse slide é o mais didático da apresentação — use-o para mostrar rigor, não para exibir fórmula.

**(5) O que foi medido.** 677 candidatos, 148 a 1.011 observações válidas por ponto. Distribuição de
Ê. Os 18 estratos.

**(6) O desenho amostral.** 67 polígonos de 72 nominais, 34 de treino e 33 reservados. **Explique o
estrato vazio** — relevo plano com solo frágil sob plantio direto consolidado não expõe solo, e a
bacia tem só nove candidatos nessa combinação, com Ê máximo de 0,0331. É achado sobre a bacia, não
falha. **Este é o melhor slide da apresentação**: mostra que o desenho encontrou um limite real e o
declarou.

**(7) Como se garante que o resultado é honesto.** Semente pré-registrada antes do sorteio; oito
invariantes do selo; cegamento por distribuição; avaliação única do held-out; reprodutibilidade
verificada em clone limpo.

**(8) O que ainda não foi feito.** Campanha de campo, treino e avaliação. O Modelo P foi
especificado e não executado — ver a emenda de D04. **Declarar o que falta é força, não fraqueza.**

**(9) Referências**, no padrão do projeto.

---

## TAREFA 3 — o documento (DOCX)

Mesma substância, em prosa, para leitura fora da apresentação. Reaproveite
`gerar_docx_metodologia_integrada.py`.

Acrescente o que o PPTX não comporta: a justificativa bibliográfica de cada decisão principal, com
o que cada fonte sustenta **e o que não sustenta** — é a disciplina da Norma de Lastro, e é
material pronto em `docs/verificacoes/fontes/*/conferencia_*.md`.

Aponte para `docs/dissertacao/Verificacao_e_Validacao_SAREL_2026-11-11.docx`, que já documenta os
testes, em vez de duplicá-lo.

---

## TAREFA 4 — o que NÃO pode aparecer

1. **Nenhuma alegação de predição prospectiva.** A pesquisa afirma detecção contemporânea.
2. **Nenhum "NDVI ≤ 0,25" isolado** como critério de solo exposto — é a máscara de cinco testes.
3. **Nenhum Fator C híbrido** como fórmula vigente — D20 é sensibilidade; o analítico é D01.
4. **"Classe 1" e "Classe 0"** não são rótulos: são candidatos espectrais a erosão e a controle.
5. **Nenhum dado de campo**, porque não existe. Nenhum resultado de modelo, porque não houve treino.
6. **Nada identificando polígono, proprietário ou estrato** de ponto específico — a apresentação é
   pública e o cegamento vale.

O item 6 é o que mais me preocupa: um mapa com os 67 polígonos plotados quebraria o cegamento
diante da plateia. Se houver mapa, que mostre a bacia e os estratos **em agregado**, nunca os
polígonos sorteados.

---

## TAREFA 5 — entrega e verificação

Gere os dois arquivos em `docs/apresentacoes/` e `docs/dissertacao/`, conforme a convenção de cada
diretório. **Abra os dois e confira visualmente** antes de commitar — renderize o PPTX e o DOCX em
imagem e olhe, como se faz com qualquer entregável.

No relatório, liste **cada número usado e sua fonte**, em tabela. É o que permite conferir antes de
a apresentação acontecer.

---

## CHECKLIST

- [ ] Branch: ______
- [ ] T1 — varredura gravada; as seis ocorrências de `0.25` tratadas
- [ ] T2 — PPTX com os nove blocos; estrato vazio explicado; o que falta declarado
- [ ] T3 — DOCX com a justificativa bibliográfica e o que cada fonte não sustenta
- [ ] T4 — nenhuma das seis proibições violada; **nenhum polígono plotado**
- [ ] T5 — os dois arquivos conferidos visualmente; tabela de número e fonte no relatório
- [ ] `npm run estado:verificar`, `git status --short`, `git log --oneline -3` gravados
- [ ] **`git push` confirmado contra o remoto**
