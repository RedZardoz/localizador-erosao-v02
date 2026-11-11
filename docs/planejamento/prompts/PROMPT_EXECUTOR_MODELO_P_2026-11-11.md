# PROMPT R — EXECUTOR SAREL — retirar a alegação de predição prospectiva

**Decisão do pesquisador (11/11/2026):** opção **(A)** do
`docs/planejamento/MATERIAL_DECISAO_MODELO_P_2026-11-11.md` — a dissertação afirma **detecção
contemporânea**; o Modelo P fica registrado como **especificado e não executado**.

**Esta emenda tem de entrar ANTES da avaliação de D.** Emenda posterior ao resultado, por mais
honesta que seja, é lida como racionalização. A ordem no histórico do Git é o que prova.

**Não remova o código do Modelo P.** A infraestrutura é parte do que o trabalho construiu.

---

## 0. LEITURA E PROTOCOLO

1. `docs/DESENVOLVIMENTO.md` integralmente.
2. `docs/planejamento/MATERIAL_DECISAO_MODELO_P_2026-11-11.md`.
3. `src/config/decisoes.ts`, bloco **D04**.
4. `scripts/d25/avaliacao_d25_referencia.py:501-511` — a avaliação única do held-out.
5. `npm run estado:verificar`.

Informe o branch e permaneça nele. **PROTOCOLO ANTI-FABRICAÇÃO do Prompt C (§1)**: saídas em
`docs/verificacoes/execucao/2026-11-11r/`. **Commit escrito depois do fato. `git push` confirmado.**

---

## TAREFA 1 — emenda a D04

**Faça esta primeiro e commite-a sozinha**, para que o histórico mostre sem ambiguidade que a
emenda precede qualquer avaliação.

Acrescente a `D04.valor` ou `D04.referencia` — escolha o campo e diga qual no relatório — uma
**EMENDA DE 11/11/2026** declarando:

1. O **Modelo P foi especificado** nesta pesquisa, com janela de guarda temporal de dois anos,
   conforme a separação aprender-prever de Kaufman et al. (2012), e sua **infraestrutura foi
   construída**: tipos, cálculo de janelas (`serieTemporal.ts`), montagem temporal
   (`montagemTemporal.ts`) e montagem da matriz (`montagem.ts`) suportam `"D"` e `"P"`.
2. O **Modelo P não foi executado** neste trabalho. Nenhuma rota de produção o emite, e
   `consolidacaoInspecao.ts` popula apenas a janela `D`.
3. **O motivo, que é metodológico e não de custo:** `avaliacao_d25_referencia.py:501-511` implementa
   avaliação **única** do held-out, com trava de tentativa consumida. O conjunto reservado tem **33
   polígonos** e pode ser gasto uma vez. Essa avaliação foi destinada à pergunta central da
   pesquisa — se o modelo supervisionado detecta erosão laminar melhor que a linha de base RUSLE.
   Avaliar dois modelos no mesmo reservado consumiria duas vezes o que só pode ser gasto uma.
4. Que o pré-registro vigente (`config_pre_registro_PROPOSTA.json`) declara **um** alvo e **um**
   modelo, e que qualquer execução futura de P exige pré-registro próprio.
5. Que **a dissertação afirma detecção contemporânea**, não predição prospectiva, e que P consta
   como trabalho futuro com infraestrutura pronta.

**D04 permanece `decidida`** — ela está correta: especifica os dois modelos. O que muda é o
registro de qual foi executado.

Transcreva em `docs/planejamento/DECISOES_DE_CONVERSA.md`, entrada nova datada.

---

## TAREFA 2 — varredura e correção dos documentos

Rode e **grave a saída**:

```
git grep -n -iE "predi[cç][aã]o|predit|prospectiv|antecip" -- docs/metodologia docs/dissertacao
```

O levantamento do planejador encontrou menções em `DICIONARIO_MATRIZ_TREINO.md`,
`Delimitacao_Territorial_e_Selecao_Amostral_MultiEscala_BP3.md`,
`Demonstracao_Transparencia_Explicabilidade_Calculos.md`, `FICHA_TECNICA_SAREL.md` e
`Pacote_Reprodutibilidade_Auditoria_Cientifica.md`.

**Classifique cada ocorrência em três grupos, e trate cada grupo de modo diferente:**

- **(i) afirma que a pesquisa realiza predição prospectiva** → corrigir para "especificado e não
  executado", apontando a emenda da Tarefa 1;
- **(ii) descreve o Modelo P como especificação ou arquitetura** → manter, eventualmente
  acrescentando que não foi executado;
- **(iii) usa "preditor", "modelo preditivo" ou "variável preditora" no sentido estatístico comum**
  → **manter intacto**. Um modelo supervisionado de detecção tem preditores; isso não é alegação de
  predição prospectiva. Não confunda os dois sentidos.

A distinção do item (iii) é a parte delicada desta tarefa. **Liste no relatório cada ocorrência com
o grupo atribuído**, para que a classificação possa ser conferida.

---

## TAREFA 3 — trava

Trava que falhe se **documento metodológico afirmar predição prospectiva realizada** enquanto D04
registrar P como não executado.

Implementação sugerida: detectar, nos documentos de `docs/metodologia` e `docs/dissertacao`,
construções que afirmem realização — por exemplo "realiza predição prospectiva", "o modelo prevê",
"predição prospectiva executada" — e falhar listando arquivo e linha. **Não** faça a trava acusar a
mera palavra "preditor" ou "preditivo", sob pena de virar ruído e ser desligada.

Como qualquer heurística de texto, ela terá limites; declare-os no próprio teste. E inclua
**meta-teste**: injete frase sintética afirmando predição realizada e prove que a trava acusa.

---

## TAREFA 4 — preservar o código de P

**Não remova nada.** Acrescente, nos quatro pontos que fixam `"D"` — `PainelMatrizTreino.tsx:42`,
`pacoteReprodutibilidade.ts:151` e `:729`, `planilha.ts:356` — comentário curto apontando a emenda
da Tarefa 1 e dizendo que `"P"` é suportado pelo motor mas não executado nesta pesquisa.

Acrescente também, em `consolidacaoInspecao.ts`, próximo ao bloco `temporal:`, nota de que a janela
`P` **não é populada** e o que seria necessário para populá-la. É a informação que faltaria a quem
retomar o trabalho.

---

## TAREFA 5 — evidência e commit

`docs/verificacoes/2026-11-11r_modelo_p_nao_executado.md`: a emenda e onde foi registrada; a tabela
da varredura com os três grupos e a classificação de cada ocorrência; o resultado da trava com o
meta-teste; e os pontos de código anotados.

**Dois commits**, nesta ordem: o primeiro com a Tarefa 1 isolada, o segundo com o restante. O
histórico precisa mostrar que a emenda veio antes.

---

## CHECKLIST

- [ ] Branch: ______
- [ ] T1 — emenda em D04, **em commit próprio e primeiro**; campo escolhido: ______
- [ ] T1 — D04 permanece `decidida`; transcrição no registro de conversa
- [ ] T2 — saída da varredura gravada; cada ocorrência classificada em (i), (ii) ou (iii)
- [ ] T2 — ocorrências do grupo (iii) **mantidas intactas**
- [ ] T3 — trava implementada com limites declarados; meta-teste acusa frase sintética
- [ ] T4 — nenhum código de P removido; quatro pontos anotados; nota em `consolidacaoInspecao.ts`
- [ ] T5 — evidência escrita; **dois commits na ordem certa**
- [ ] `npm test` e `npx tsc --noEmit` gravados
- [ ] `npm run estado:verificar`, `git status --short`, `git log --oneline -3` gravados
- [ ] **`git push` confirmado contra o remoto**
