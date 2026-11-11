# Material de Decisão — Modelo P e a alegação de predição prospectiva

**Data:** 11/11/2026 · **Base:** commit `a1579db` · **Autor:** planejador, por levantamento do código
**Origem:** achado **S1-6** da auditoria DeepSeek de 09/11/2026
**Natureza:** material para decisão do pesquisador. **Nenhuma alteração foi feita.**

---

## 1. A pergunta

A Decisão **D04** declara dois modelos: **D**, de detecção contemporânea de feições ativas em t0, e
**P**, de predição prospectiva de risco com intervalo de guarda temporal estrito de dois anos,
fundamentado na separação aprender-prever de Kaufman et al. (2012) e na rotação bienal do Plantio
Direto.

**Nenhuma rota de produção emite o Modelo P.**

A decisão é: **implementar P, ou retirar a alegação de predição prospectiva.**

---

## 2. O que foi medido

### 2.1 O que já existe

A infraestrutura de P está construída em quase toda a cadeia:

| Camada | Situação |
|---|---|
| Tipos | `modeloJanela?: "D" \| "P"` em `montagem.ts:129` |
| Cálculo das janelas | `serieTemporal.ts:132` computa `modeloP` |
| Montagem temporal | `montagemTemporal.ts:184` — `janelaAtiva = tipoModelo === "D" ? janelas.modeloD : janelas.modeloP` |
| Montagem da matriz | `montagem.ts:180,329,404` lê `ponto.temporal?.[modeloJanela]` e grava a coluna `Modelo` |
| Coluna na matriz | `Modelo` consta do perfil `matriz-treino` |

### 2.2 O que falta — e é mais do que parece

**(a) Quatro pontos de produção fixam `"D"`:** `PainelMatrizTreino.tsx:42`,
`pacoteReprodutibilidade.ts:151` e `:729`, `planilha.ts:356`. Isoladamente, seriam quatro linhas.

**(b) `temporal.P` nunca é preenchido.** `consolidacaoInspecao.ts:347` escreve **apenas** `D:`; a
chave `P: {` aparece **zero vezes** no arquivo. Expor o parâmetro sem isso produziria linhas vazias
— o pior resultado possível, porque pareceria funcionar.

Portanto não são quatro linhas. É medir a série na janela pré-guarda e consolidá-la, o que exige
rodada de ingestão própria, com as mesmas salvaguardas da que acabou de ser feita para Ê.

### 2.3 A restrição que decide

`avaliacao_d25_referencia.py:501-511` implementa **avaliação única do held-out**, com trava gravada
**antes** do ajuste; falha posterior conta como **tentativa consumida**.

O conjunto reservado tem **33 polígonos**. Ele pode ser gasto **uma vez**.

**Dois modelos avaliados no mesmo held-out consomem duas vezes o que só pode ser gasto uma.** Não é
limitação de engenharia: é o que torna a avaliação probatória. Avaliar D e P no mesmo conjunto
reservado, e relatar o melhor, é a definição de garimpo — exatamente o que o pré-registro existe
para impedir.

Some-se que `config_pre_registro_PROPOSTA.json` traz `pre_registro: null` e declara um único alvo,
`Fracao_Erodida`. **O pré-registro vigente contempla um modelo, não dois.**

---

## 3. As opções

### (A) Retirar a alegação de predição prospectiva

A dissertação afirma detecção contemporânea. D04 é emendada para registrar que o Modelo P foi
especificado, teve sua infraestrutura construída e **não foi executado neste trabalho**, com o
motivo: o conjunto reservado comporta uma avaliação, e ela foi destinada à detecção.

- *Custo:* baixo — uma emenda e a varredura dos documentos que hoje aludem a predição.
- *Perda:* o escopo encolhe. A pesquisa entrega detecção, não previsão.
- *Ganho:* o que se afirma é exatamente o que se demonstra. **Nada a defender que não se sustente.**

### (B) Implementar P e avaliá-lo no mesmo held-out

- *Custo:* alto — ingestão da janela pré-guarda, consolidação, plumbing, avaliação.
- **Inviável como está.** Gasta duas vezes um held-out de uso único. Para ser legítimo, exigiria
  pré-registrar os dois modelos **antes** de qualquer avaliação, com critério de decisão declarado
  — e a avaliação de D ainda não ocorreu, então a janela existe.
- *Risco:* com 33 polígonos reservados, dividir ou reutilizar reduz o poder a um patamar em que
  nenhum dos dois resultados convence.

### (C) Implementar P como análise exploratória declarada

P é construído e avaliado **apenas no conjunto de treino**, por validação cruzada espacial, e
relatado como **exploratório**, sem tocar o held-out, que permanece íntegro para D.

- *Custo:* médio — exige a ingestão da janela pré-guarda, mas não um segundo held-out.
- *Ganho:* a dissertação pode dizer que a arquitetura de predição foi especificada e **ensaiada**,
  com resultado preliminar, sem alegar validação prospectiva.
- *Condição:* o caráter exploratório tem de estar declarado **antes** de ver o resultado, e no
  texto final, de forma que não se confunda com o resultado probatório de D.

### (D) Adiar e registrar

Não implementar agora; registrar P como trabalho futuro com infraestrutura pronta.

- Equivale a (A) no que a dissertação afirma, e preserva o caminho para depois.

---

## 4. Recomendação

**(A), com a emenda redigida de modo a preservar o valor do que foi construído.**

O argumento não é de custo. É que **o conjunto reservado comporta uma avaliação**, e essa avaliação
responde à pergunta central da pesquisa — se o modelo supervisionado detecta erosão laminar melhor
que a linha de base RUSLE. Gastá-la em duas perguntas responde mal às duas.

A (C) é defensável e eu a consideraria se houvesse tempo folgado: ela entrega um ensaio honesto sem
custo probatório. Mas exige uma rodada de ingestão inteira — a janela pré-guarda não está medida —
e a experiência das últimas duas semanas mostra que ingestão consome mais do que se projeta.

A (B) eu desaconselho sem ressalva. Com 33 polígonos, dividir ou reutilizar o held-out produz dois
resultados que não convencem, e a tentação de relatar o melhor existiria mesmo sem ninguém querer.

**O que a (A) preserva:** D04 permanece decidida e correta; a especificação de P fica registrada; a
infraestrutura continua no código, testada. A dissertação ganha uma seção de trabalhos futuros com
base construída, que é mais forte que uma alegação sem matriz.

---

## 5. Se (A) for escolhida, o que precisa ser feito

1. **Emenda a D04** registrando que P foi especificado e não executado, com o motivo — held-out de
   uso único destinado a D — e a data, **antes de qualquer avaliação**, para que não seja lida como
   racionalização posterior.
2. **Varrer os documentos** que aludem a predição prospectiva. O levantamento encontrou menções em
   `DICIONARIO_MATRIZ_TREINO.md`, `Delimitacao_Territorial_e_Selecao_Amostral_MultiEscala_BP3.md`,
   `Demonstracao_Transparencia_Explicabilidade_Calculos.md`, `FICHA_TECNICA_SAREL.md` e
   `Pacote_Reprodutibilidade_Auditoria_Cientifica.md`. Cada uma precisa dizer "especificado" onde
   hoje diz ou sugere "realizado".
3. **Trava** que falhe se algum documento metodológico afirmar predição prospectiva enquanto D04
   registrar P como não executado. É o que impede a alegação de voltar por distração.
4. **Manter o código de P**, com comentário apontando a emenda. Não remover: a infraestrutura é
   parte do que o trabalho construiu.

---

## 6. O que decidir

1. **(A), (B), (C) ou (D)?** A recomendação é **(A)**.
2. Se (C): o pré-registro do caráter exploratório entra **antes** da ingestão da janela pré-guarda,
   e quem o redige é o pesquisador.
3. A emenda de D04 entra agora, **antes da avaliação de D**? Recomendo que sim: emenda posterior ao
   resultado, por mais honesta que seja, é lida como justificativa.
