# PROMPT Q — EXECUTOR SAREL — cegamento por distribuição

**Decisão do pesquisador (11/11/2026):** opções **(B) + (D)** do
`docs/planejamento/MATERIAL_DECISAO_CEGAMENTO_2026-11-11.md` — pacotes selados por papel com diário
de distribuição, mais emenda declarando que o SAREL é o console do coordenador e que o cegamento se
dá na distribuição.

**Não implemente seletor de papel na interface.** Foi desaconselhado explicitamente: sem
autenticação, ele é lembrete, não trava, e cria aparência de controle que não sobrevive a uma
pergunta direta na defesa.

---

## 0. LEITURA E PROTOCOLO

1. `docs/DESENVOLVIMENTO.md` integralmente.
2. `docs/planejamento/MATERIAL_DECISAO_CEGAMENTO_2026-11-11.md`.
3. `src/lib/matriz/perfis.ts` — os perfis `interpretacao-cega`, `campo-cego`, `voo-cego`.
4. `src/lib/autorizacao/logRecusas.ts` — o padrão de diário já existente no projeto.
5. `npm run estado:verificar`.

Informe o branch e permaneça nele. **PROTOCOLO ANTI-FABRICAÇÃO do Prompt C (§1)**: saídas em
`docs/verificacoes/execucao/2026-11-11q/`. **Commit escrito depois do fato. `git push` confirmado.**

---

## TAREFA 1 — a trava, antes de tudo

**Faça esta primeiro.** Ela protege tudo o que vem depois.

Verificado em 11/11/2026: `planilha.test.ts` confere que os cinco perfis geram CSV e XLSX válidos e
um comportamento de `Status_Fundiario`, mas **nenhum teste fixa o conjunto de colunas de perfil
algum**. Nada impede que `voo-cego` receba `estrato_id` ou `nomeProprietario` numa edição distraída
— e isso quebraria o cegamento sem quebrar teste.

Crie trava que:

1. **Fixe o conjunto exato de colunas** de `interpretacao-cega`, `campo-cego` e `voo-cego`.
   Coluna nova ou removida **falha**, obrigando quem muda a declarar a mudança.
2. **Proíba, por lista de exclusão**, que qualquer perfil cego contenha coluna que identifique o
   estrato, o titular real, a probabilidade de inclusão, o peso, o identificador de candidato ou o
   papel no conjunto de treino. Use lista de **proibidos**, não de permitidos: coluna nova é
   barrada por omissão.
3. **Meta-teste**: injete `estrato_id` num perfil cego sintético e prove que a trava acusa.

A lista de colunas de cada perfil é a **declaração formal do que cada papel pode ver**. Documente-a
no próprio teste, com uma linha por perfil dizendo a quem se destina.

---

## TAREFA 2 — perfil `autorizacao`

É o único papel que precisa do titular real: quem pede autorização de voo ou coleta.

Acrescente `"autorizacao"` a `PerfilExportacao` e monte o perfil com o mínimo:
código do polígono, coordenadas, município, `codigoCar`, nome do proprietário, área do imóvel e
área do polígono.

**Omita o estrato.** Quem pede autorização não interpreta, e ausência é sempre mais segura que
presença: acrescentar depois é decisão registrada; remover depois de exposto é impossível. Se a
operação mostrar que o estrato é necessário, isso vira decisão nova.

O perfil `autorizacao` **não é cego** — e por isso deve ficar fora da lista de proibidos da Tarefa
1, mas **dentro** de uma trava própria que fixe suas colunas, pelo mesmo motivo.

---

## TAREFA 3 — pacote selado por papel

Para cada papel — `autorizacao`, `campo`, `voo`, `interpretacao` — a exportação passa a produzir um
**pacote**, não um arquivo solto:

- nome do arquivo declara o papel e a data;
- cabeçalho, dentro do arquivo, declara o papel, a data de geração e a advertência de que o
  conteúdo é restrito àquele papel;
- **hash SHA-256 do conteúdo**, registrado no diário da Tarefa 4 e impresso no cabeçalho;
- se o conjunto de pontos estiver vazio, **recusa** com mensagem explícita em vez de gerar pacote vazio.

Reaproveite `extrairLinhasPorPerfil`; não duplique a lógica de montagem.

---

## TAREFA 4 — diário de distribuição

No padrão de `logRecusas.ts`, que já existe no projeto.

Cada geração de pacote registra: **papel** (obrigatório), **data e hora**, **hash do conteúdo**,
**número de pontos**, **perfil usado** e **destinatário** (campo livre, **opcional**).

**Sobre o destinatário:** o esquema aceita o campo mas **não o exige**. Registrar nominalmente
prova mais e cria registro de dado pessoal de membros da equipe; essa é decisão do pesquisador,
tomada no momento de cada entrega, não embutida no esquema. **Não torne o campo obrigatório** e
registre essa escolha no relatório.

O diário é **versionado** — é a prova de que o intérprete recebeu o que recebeu. Confirme com
`git check-ignore -v` que o destino não é ignorado e grave a saída.

---

## TAREFA 5 — a emenda da fronteira (opção D)

Em `src/config/decisoes.ts`, acrescente decisão nova, ou emenda à decisão de cegamento vigente —
localize-a e diga qual escolheu — declarando:

1. **O SAREL é o console do coordenador.** Roda em `127.0.0.1`, sem autenticação e sem conceito de
   usuário; quem o opera tem acesso a todos os perfis. Isso é deliberado e não é falha.
2. **O cegamento se dá na distribuição**, não no acesso ao sistema: o que cada papel pode ver é
   determinado pelo pacote que recebe, e demonstrado pelo diário mais o hash.
3. **O que a dissertação afirma é o que o diário prova** — que o intérprete recebeu arquivo sem
   estrato, sem titular e sem probabilidade de inclusão.
4. Que **seletor de papel na interface foi considerado e recusado**, por ser lembrete sem
   autenticação e por criar aparência de controle inexistente.

Transcreva a decisão em `docs/planejamento/DECISOES_DE_CONVERSA.md`, no formato das demais.

---

## TAREFA 6 — evidência e commit

`docs/verificacoes/2026-11-11q_cegamento_distribuicao.md`:

1. A tabela dos papéis, com o conjunto de colunas de cada um **como a trava o fixa**.
2. O resultado da Tarefa 1, com o meta-teste.
3. O perfil `autorizacao` e a justificativa de omitir o estrato.
4. O formato do pacote e do diário, com exemplo de cabeçalho real gerado.
5. A saída de `git check-ignore -v` do diário.
6. A emenda da Tarefa 5 e onde foi registrada.
7. O que **não** foi feito: ligar `csvAutorizacoes.ts`, que registra desfecho de autorização e
   segue sem consumidor — fica para rodada própria.

---

## CHECKLIST

- [ ] Branch: ______
- [ ] T1 — colunas dos três perfis cegos fixadas; lista de **proibidos**; meta-teste acusa `estrato_id`
- [ ] T2 — perfil `autorizacao` criado, **sem estrato**, com trava própria de colunas
- [ ] T3 — pacote por papel com cabeçalho, hash e recusa de pacote vazio
- [ ] T4 — diário versionado; destinatário **opcional**; `git check-ignore -v` gravado
- [ ] T5 — emenda registrada em `decisoes.ts` e no registro de conversa; recusa do seletor declarada
- [ ] T5 — **nenhum seletor de papel foi implementado**
- [ ] T6 — evidência escrita
- [ ] `npm test` e `npx tsc --noEmit` gravados
- [ ] `npm run estado:verificar`, `git status --short`, `git log --oneline -3` gravados
- [ ] **`git push` confirmado contra o remoto**
