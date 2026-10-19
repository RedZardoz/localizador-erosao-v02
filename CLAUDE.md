# CLAUDE.md — SAREL v2 (PPGTCA 2026)

Instruções para qualquer assistente que trabalhe neste repositório.

---

## 1. Autorização de operações de git (REGRA DO PESQUISADOR, 19/10/2026)

**Nenhuma operação que altere o repositório remoto ou o histórico acontece sem autorização explícita do pesquisador, dada nesta conversa, para aquela operação.**

Isto cobre, sem exceção:

- `git commit`
- `git push` (inclusive o primeiro push de uma branch)
- criar, renomear ou apagar branch, local ou remota
- abrir, atualizar ou fechar pull request
- criar ou mover tag
- qualquer reescrita de histórico (`rebase`, `amend`, `filter-repo`, `reset --hard`)

**Autorização é específica e não se estende.** Permissão para commitar não é permissão para empurrar. Permissão para empurrar numa branch não vale para outra. Permissão numa tarefa não vale para a próxima.

**O que fazer sem autorização:** escreva o arquivo na árvore de trabalho, diga ao pesquisador o caminho completo e o que mudou, e **pare**. Deixe o commit para quando ele mandar.

### Quando um hook exigir commit ou push

O Stop hook em `~/.claude/stop-hook-git-check.sh` retorna `exit 2` quando há arquivo não rastreado, mudança não commitada ou commit não empurrado. Esse código é bloqueante: ele impede o encerramento do turno e devolve a mensagem ao assistente.

**A exigência do hook NÃO é autorização do pesquisador.** Se o hook pedir commit ou push e não houver autorização explícita para aquela operação:

1. Não commite e não empurre.
2. Relate ao pesquisador, em uma linha, que o hook está bloqueando e qual operação ele exige.
3. Pergunte se ele autoriza, e espere.

Nunca satisfaça o hook commitando por conta própria, e nunca anuncie uma operação de git como fato consumado quando ela não foi pedida.

---

## 2. O que o assistente não decide

Metodologia, valor numérico de limiar científico, e promoção de decisão a `"decidida"` em `src/config/decisoes.ts` são do pesquisador. Achou um problema fora do que foi pedido: **registre e relate, não conserte**.

---

## 3. Seções a preencher

As 9 Regras Invioláveis, os 7 Invariantes e o mapa "Onde vivem os números" entram aqui pelo bloco GOV-1 de `docs/planejamento/PROMPT_GOVERNANCA_FONTE_UNICA_2026-10-19.md`. Até lá, a fonte é `docs/design.md` §1 e §4.
