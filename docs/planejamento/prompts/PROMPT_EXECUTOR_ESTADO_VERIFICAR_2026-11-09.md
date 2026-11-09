# PROMPT B — EXECUTOR SAREL — rodar DEPOIS do prompt da máscara GEOS3
## Regra 3 pede conferência, mas o único script ligado escreve

---

## 0. LEITURA OBRIGATÓRIA

`docs/DESENVOLVIMENTO.md`, `docs/planejamento/ESTADO.md`, `docs/planejamento/DECISOES_DE_CONVERSA.md`.
Informe o branch (`git branch --show-current`) e permaneça nele.
Vale a REGRA DE RELATO do prompt anterior: só saída literal de comando; nada de memória.

---

## 1. O DIAGNÓSTICO — leia antes de editar, para não "consertar" o que funciona

**O painel NÃO tem defeito de desenho.** Confirmado por leitura do código em 09/11/2026:

- `scripts/auditoria/estado_do_projeto.mjs:218` — `if (!opcoes.forcarNovoHead && fs.existsSync(ARQUIVO_ESTADO_MD))`
  fixa o `commitBase` no commit que o arquivo **já registra em disco**. A regeneração é idempotente.
- `:435` — só `--gerar` passa `{ forcarNovoHead: true }` e avança para o HEAD vivo.
- `src/config/estado.espelho.test.ts` chama `gerarEstadoMarkdown()` **sem opções**, logo compara
  contra o commit registrado. **A trava fica verde quando o HEAD anda.** É intencional.

**NÃO** separe a seção 1 (Controle de Versão) do arquivo versionado. **NÃO** remova `.git/HEAD` do
`FONTE_DOS_DADOS`. **NÃO** mexa na lógica de `commitBase` nem na trava de espelho. Qualquer uma
dessas mudanças destrói a estabilidade que os commits `5b4bc06` e `1af5244` construíram.

**O defeito é de fiação, em dois lugares:**

1. `scripts/auditoria/estado_do_projeto.mjs:417` já implementa o modo somente-leitura
   (`--verificar`): compara disco contra o gerado, imprime `OK:` e sai 0, ou imprime as
   divergências e sai 1. **Nunca escreve.** Mas não existe script npm para ele —
   `package.json:20` só tem `"estado": "node scripts/auditoria/estado_do_projeto.mjs --gerar"`.
2. Por isso a Regra 3 manda rodar `npm run estado`, que **escreve**. Toda sessão que cumpre a
   regra suja a árvore de trabalho sem necessidade.

---

## TAREFA 1 — ligar o modo de conferência

Em `package.json`, ao lado da linha 20, acrescente:

```json
"estado:verificar": "node scripts/auditoria/estado_do_projeto.mjs --verificar",
```

Mantenha `"estado"` como está — avançar o painel continua sendo uma ação legítima, só deixa de ser
a porta de entrada padrão.

Verifique os dois caminhos e **cole as duas saídas cruas**:

```
npm run estado:verificar
git status --short
```

A segunda tem de sair **vazia**. Se `estado:verificar` sair com código 1, o painel está
genuinamente dessincronizado: rode `npm run estado`, commite a atualização como mudança própria e
só então siga.

---

## TAREFA 2 — corrigir a Regra 3 nas diretrizes

Em **`CLAUDE.md`** e em **`docs/DESENVOLVIMENTO.md`**, o item 3 da consulta obrigatória de início
de sessão diz hoje, em substância: "Rodar `npm run estado` e conferir antes de propor qualquer
coisa." Substitua por:

```
3. Rodar `npm run estado:verificar` e conferir antes de propor qualquer coisa. Este comando
   SOMENTE LÊ: compara o painel em disco com o estado medido do repositorio e sai com codigo 1
   se divergirem. NAO use `npm run estado` para conferir — ele reescreve o painel avancando-o
   para o HEAD vivo e suja a arvore de trabalho. `npm run estado` e para quando voce QUER
   avancar o painel, e a alteracao resultante entra em commit proprio.
```

Rode `git grep -n "npm run estado" -- . ':!node_modules'` e **cole a saída crua**. Para cada outra
ocorrência que esteja pedindo *conferência* (não geração), troque para `estado:verificar`. Onde a
ocorrência pedir geração, deixe como está e **diga no relatório** qual é e por quê.

**Atenção:** `src/config/desenvolvimentoDiretrizes.test.ts` referencia `ESTADO.md` e
provavelmente fixa o texto das diretrizes. Rode-o antes e depois:

```
npx vitest run src/config/desenvolvimentoDiretrizes.test.ts src/config/estado.espelho.test.ts
```

Se a trava exigir literalmente a frase antiga, **atualize a trava** para a frase nova — não
reverta a diretriz. Cole o `AssertionError` literal se houver.

---

## TAREFA 3 — fechar o ciclo

```
npm test
npm run estado:verificar
git status --short
```

Commit:

```
chore(governanca): ligar modo somente-leitura do painel de estado a Regra 3

O modo --verificar do gerador de ESTADO.md ja existia (estado_do_projeto.mjs:417) e nao
estava ligado a script npm. A Regra 3 pedia conferencia e apontava para `npm run estado`,
que escreve, sujando a arvore em toda sessao que cumpria a regra.

- package.json: novo script "estado:verificar"
- CLAUDE.md e docs/DESENVOLVIMENTO.md: Regra 3 passa a apontar para o modo de leitura,
  com a distincao explicita entre conferir e avancar o painel

Nao houve mudanca na logica de commitBase, no FONTE_DOS_DADOS nem na trava de espelho: o
desenho do painel esta correto e e deliberadamente estavel quando o HEAD anda.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0124eRLv8s4zYkBWGYtYdZXZ
```

Depois: `git push -u origin <branch-atual>`.

---

## CHECKLIST

- [ ] Branch: ______
- [ ] `estado:verificar` existe e sai 0 com árvore limpa (duas saídas cruas coladas)
- [ ] Regra 3 corrigida nos **dois** arquivos
- [ ] Saída crua de `git grep -n "npm run estado"`, com veredicto por ocorrência
- [ ] `desenvolvimentoDiretrizes.test.ts` e `estado.espelho.test.ts` verdes
- [ ] **NÃO** foram tocados: `commitBase`, `FONTE_DOS_DADOS`, seção 1 do painel, trava de espelho
- [ ] `npm test` — resumo literal
- [ ] `git status --short` e `git log --oneline -3`, crus
