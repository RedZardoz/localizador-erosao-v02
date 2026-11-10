# PROMPT K — EXECUTOR SAREL — juntar Ê no CLI do sorteio

**RODE ESTE ANTES DO PROMPT J.** O Prompt J, como está, falharia na Tarefa 2.

---

## 0. O DEFEITO, MEDIDO

Executado em clone limpo, em 10/11/2026:

```
node --import ./scripts/ts-loader.mjs scripts/sortear_poligonos_d16.ts --dry-run \
  --candidatos docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json
```

Saída: **`Total de candidatos avaliados: 0`**, com os 18 estratos impressos como
`ESTRATO VAZIO DECLARADO (N_h = 0)`.

**Causa.** `universo_candidatos_bp3_d16_2026-11-10.json` foi gravado no Prompt E′, **antes** de Ê
ser medido. Cada candidato traz `frequenciaSoloNu: null` e **não traz `provenienciaE`**. O CLE lê
`--candidatos` e repassa `obj.candidatos` direto como `CandidatoSorteioD16[]`
(`sortear_poligonos_d16.ts:191`), **sem junção com o cache de Ê**.

O teste `Trava T3.5` em `sorteioPoligonos.test.ts` **faz essa junção à mão**: lê os dois arquivos,
monta `mapaCache` e atribui `provenienciaE: med.frequenciaSoloNu`. Por isso o teste dá 67 e o CLI
dá 0. **O teste prova o motor; o CLI não tem o caminho.**

**Fail-closed confirmado:** com `--confirmar`, a guarda da Camada C
(`estratificacao.ts`, Prompt H) lançaria por `provenienciaE ausente` antes de gravar qualquer selo;
e o invariante 4 (`totalCandidatosEntrada === Σ N_h`) pegaria 677 ≠ 0. Nenhum selo inválido seria
escrito. O conserto é para o CLI funcionar, não para evitar dano — o dano já está barrado.

---

## 1. PROTOCOLO

`docs/DESENVOLVIMENTO.md`. `npm run estado:verificar`. Informe o branch e permaneça nele.
**PROTOCOLO ANTI-FABRICAÇÃO do Prompt C (§1)**: saídas em `docs/verificacoes/execucao/2026-11-10k/`.
**Commit escrito depois do fato. `git push` confirmado contra o remoto.**

---

## TAREFA 1 — o CLI passa a juntar Ê

### 1.1 Novo argumento

`--cache <caminho>`, com padrão `docs/verificacoes/cache_frequencia_solo_nu_bp3.json`.

### 1.2 A junção

Para cada candidato lido de `--candidatos`, localize a medição correspondente por `id` em
`cache.itens` e monte `provenienciaE` a partir de `frequenciaSoloNu` do cache, além de preencher
`frequenciaSoloNu` numérico. Use a mesma lógica do `Trava T3.5` — **extraia-a para função
compartilhada** em vez de duplicar, de modo que teste e CLI percorram o mesmo caminho. Essa é a
correção de fundo: o defeito existiu porque os dois caminhos divergiam.

### 1.3 Fail-closed, com erro que nomeia a causa

Hoje candidatos sem Ê somem em silêncio e viram "estrato vazio". Passe a:

- recusar, com `[ERRO_JUNCAO_E]`, se o arquivo de cache não existir ou não tiver `itens`;
- recusar se **algum** candidato não tiver medição no cache, dizendo **quantos** e listando até 5 ids;
- recusar se o `hashDefinicao` do cache divergir do `calcularHashDefinicao()` corrente — cache de
  outra definição de máscara **não pode** alimentar o sorteio;
- imprimir, antes da tabela de estratos: candidatos lidos, candidatos com Ê, e o hash da definição.

### 1.4 Distinguir vazio de ilegível

"Estrato vazio declarado" só deve ser impresso quando a bacia realmente não tem candidatos naquele
estrato. Se a contagem total de candidatos com Ê for zero, o CLI **falha** com mensagem explícita,
em vez de imprimir 18 estratos vazios. Confundir ausência de dado com ausência de terreno é o
defeito que este prompt corrige; não o reproduza em outro lugar.

---

## TAREFA 2 — teste que exercita o CLI, não só o motor

Acrescente teste que invoca **o CLI** (subprocesso, como o antigo meta-teste da trava fazia) com
`--dry-run --candidatos <universo real> --cache <cache real>` e confirma na saída:

- `Total de candidatos avaliados: 677`;
- totais **67 / 34 / 33 / 336,34**;
- `E_1_3_2` como estrato **genuinamente** vazio (N_h = 0) e `E_1_2_2` como censo com N_h = 3;
- modo `DRY-RUN` e nenhum selo gravado.

E um segundo teste provando o fail-closed: apontar `--cache` para arquivo inexistente faz o CLI
sair com código 1 e `[ERRO_JUNCAO_E]`.

**Este par de testes é o que faltava.** Sem exercitar o CLI, a cobertura mede o motor e deixa a
porta de entrada sem guarda.

---

## TAREFA 3 — varredura do mesmo padrão

O defeito é de classe: teste que monta o insumo à mão e caminho de produção que não o monta.
Rode e grave:

```
git grep -n "provenienciaE" -- src scripts
```

Liste, no relatório, **todos** os pontos que constroem `CandidatoSorteioD16` ou
`CandidatoEstratificacao`, e diga para cada um se ele preenche `provenienciaE` e de onde. Se achar
outro caminho de produção que não preenche, **relate** — não conserte nesta rodada sem dizer.

---

## TAREFA 4 — evidência e commit

`docs/verificacoes/2026-11-10k_juncao_e_no_cli.md`: o defeito medido com a saída de 0 candidatos;
a função compartilhada e onde ficou; os erros fail-closed acrescentados; a saída do novo teste de
CLI com os totais; e a varredura da Tarefa 3.

**Não execute o sorteio.** Depois deste prompt verde, o Prompt J roda como escrito, acrescentando
`--cache` aos comandos.

---

## CHECKLIST

- [ ] Branch: ______
- [ ] T1 — `--cache` implementado, com padrão; junção em **função compartilhada** com o teste
- [ ] T1 — recusa por cache ausente, por candidato sem Ê (com contagem e ids) e por hash divergente
- [ ] T1 — total zero com Ê **falha** em vez de imprimir 18 estratos vazios
- [ ] T2 — teste de subprocesso do CLI: `677` lidos, totais 67 / 34 / 33 / 336,34
- [ ] T2 — teste de fail-closed com `--cache` inexistente
- [ ] T3 — saída de `git grep provenienciaE` gravada; outros caminhos de produção listados: ______
- [ ] T4 — evidência escrita; sorteio **não** executado
- [ ] `npm test` e `npx tsc --noEmit` gravados
- [ ] `npm run estado:verificar`, `git status --short`, `git log --oneline -3` gravados
- [ ] **`git push` confirmado contra o remoto**
