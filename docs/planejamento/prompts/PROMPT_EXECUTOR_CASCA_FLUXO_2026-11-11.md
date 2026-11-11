# PROMPT P — EXECUTOR SAREL — casca de fluxo operacional

**Decisão do pesquisador (11/11/2026):** opção (B) do
`docs/planejamento/MATERIAL_DECISAO_INTERFACE_2026-11-11.md` — nova casca de navegação **sobre** os
painéis existentes.

**Regra que governa este prompt: nenhum painel existente é alterado por dentro.** A casca abre os
painéis que já existem, na ordem do método, e mostra onde a pesquisa está. O que ela acrescenta é
navegação e estado, não funcionalidade nova — com uma exceção declarada na Tarefa 3.

---

## 0. LEITURA E PROTOCOLO

1. `docs/DESENVOLVIMENTO.md` integralmente.
2. `docs/planejamento/MATERIAL_DECISAO_INTERFACE_2026-11-11.md`.
3. `src/types/ui.ts` — `ModalType`; `src/store/useSarelStore.ts` — `modalAtiva`, `setModalAtiva`.
4. `src/lib/gee/seloPublicoD16.ts` — o leitor único.
5. `npm run estado:verificar`.

Informe o branch e permaneça nele. **PROTOCOLO ANTI-FABRICAÇÃO do Prompt C (§1)**: saídas em
`docs/verificacoes/execucao/2026-11-11p/`. **Commit escrito depois do fato. `git push` confirmado.**

---

## TAREFA 1 — a casca

Componente novo, por exemplo `src/components/fluxo/BarraFluxoOperacional.tsx`, renderizado em
`src/app/page.tsx` entre `Header` e a área de mapa. Sempre visível.

Oito etapas, numeradas, na ordem do método:

| # | Rótulo | Abre | Observação |
|---|---|---|---|
| 1 | Área | `setModalAtiva("region")` | — |
| 2 | Triagem | `setModalAtiva("candidates")` | — |
| 3 | Medição | painel novo (Tarefa 3) | hoje sem superfície |
| 4 | Sorteio | `setModalAtiva("sorteio")` | tipo novo (Tarefa 2) |
| 5 | Voos | — | **não implementado** (Tarefa 5) |
| 6 | Campo | `setModalAtiva("campanha")` | ingestão do Coletor já existe ali |
| 7 | Matriz | `setModalAtiva("matriz")` | — |
| 8 | Auditoria | `setModalAtiva("audit-dossier")` | exportação segue em `"export"` |

### 1.1 Estado honesto — a regra central

Cada etapa exibe um de quatro estados, **com o motivo em texto**, nunca apenas um ícone colorido:

- **concluída** — com o dado que a conclui. Exemplo: *"Sorteio — concluído: 67 polígonos, selo de 10/11/2026"*.
- **disponível** — pode ser executada agora.
- **bloqueada** — com a razão. Exemplo: *"Matriz — bloqueada: nenhum rótulo de campo ingerido"*.
- **não implementada** — ver Tarefa 5.

**Proibido**: estado derivado de suposição, valor padrão, ou ícone sem texto. Se a casca não
conseguir determinar o estado de uma etapa, ela exibe **"estado desconhecido"** e diz por quê. É
preferível admitir desconhecimento a exibir verde falso.

### 1.2 De onde vem o estado

| Etapa | Fonte |
|---|---|
| 1 Área | `areas` do store |
| 2 Triagem | `pontos` do store |
| 3 Medição | leitor do selo público (limiares de Ŝ e Ê) e contagem de candidatos |
| 4 Sorteio | `obterComparativoDesenhoD16()` — `disponivel` e os totais realizados |
| 5 Voos | constante: não implementada |
| 6 Campo | pontos com rótulo humano, conforme o store |
| 7 Matriz | existência de rótulos suficientes |
| 8 Auditoria | sempre disponível |

**Nenhum número escrito à mão.** A trava G08 já proíbe; respeite-a e não acrescente exceção à lista
sem justificar.

---

## TAREFA 2 — promover o sorteio a item próprio

Hoje `PainelSorteioD16` é renderizado dentro de `DecisoesModal.tsx:105`. Quem procura o sorteio não
abre "Decisões da Pesquisa".

1. Acrescente `"sorteio"` a `ModalType` em `src/types/ui.ts`.
2. Crie `PainelSorteioModal` que renderize **o mesmo `PainelSorteioD16`, sem alterá-lo**.
3. Monte-o em `page.tsx` ao lado dos demais modais.
4. **Mantenha** a renderização dentro de `DecisoesModal` ou remova-a, como preferir — mas **diga no
   relatório qual escolheu e por quê**. Duplicar a montagem do mesmo painel em dois modais pode
   causar estado compartilhado inesperado; se mantiver, verifique.

---

## TAREFA 3 — superfície para a etapa 3 (Medição)

É a única funcionalidade nova deste prompt, e é **somente leitura**.

Painel que mostra o estado medido das três dimensões, lendo dos artefatos versionados:

- **Ŝ — declividade:** cortes de tercil, do leitor do selo público.
- **Ê — exposição de solo:** cortes de tercil; a máscara GEOS3 em texto (NDVI em [0,00; 0,25],
  NBR2 em [0,00; 0,075], B4 ≥ B3, B3 ≥ B2); e a nota de que o NBR2 é o componente no SWIR que
  separa palhada de solo mineral.
- **K̂ — erodibilidade:** a distribuição por nível, se disponível no artefato.

**Não calcule nada.** Se o dado não estiver disponível, exiba indisponível declarado. Este painel
lê; quem mede é o CLI.

---

## TAREFA 4 — as quatro âncoras do tour

O tour aponta para `data-metodologia` que não existem, e por isso o holofote não encontra alvo:

| Âncora ausente | Onde passa a existir |
|---|---|
| `mascara-solo-geos3` | painel da Tarefa 3 |
| `frequencia-solo-nu-e` | painel da Tarefa 3 |
| `sorteio-d16-realizado` | painel do sorteio (Tarefa 2) |
| `cadeia-verificacao` | etapa 8 da casca, ou painel de auditoria |

Acrescente os atributos `data-metodologia` nesses pontos. **Não altere o texto dos passos do tour**
— ele foi conferido no Prompt N; aqui só se dá âncora ao que já está escrito.

Acrescente trava que **falhe** se algum `seletorAlvo` do tour apontar para `data-metodologia`
inexistente em `src/components` ou `src/app`. Essa trava é a que teria pego o defeito no Prompt N,
e ela vale para sempre. Inclua meta-teste.

---

## TAREFA 5 — a etapa 5 declarada, não simulada

Planos de voo **não existem na interface**: `git grep` por `plano de voo`, `planoVoo`, `.plan`,
`QGroundControl` e `waypoint` em `src/components` não devolve resultado. Os arquivos são gerados
por `src/lib/drone/planoVooNControl.ts` e por script.

A etapa 5 aparece na casca com estado **"não implementada"**, e o texto diz, em uma frase, que os
planos são gerados por script e ainda não têm superfície na interface.

**Não construa a geração nem o download nesta rodada.** Duas decisões do pesquisador estão em
aberto e precedem a implementação:

1. a interface **gera** os planos de voo, ou apenas **baixa** os que o script produziu?
2. o download dos polígonos sorteados vem do **selo público redigido** ou do **selo completo**? Para
   ir a campo é preciso identificar o polígono, logo essa é operação **cega**, sujeita às regras
   K1-K3 do cegamento, e não à regra do selo público.

Registre as duas como pendência em `docs/planejamento/DECISOES_DE_CONVERSA.md`, entrada nova
datada, dizendo que a etapa 5 aguarda essas definições.

---

## TAREFA 6 — travas

1. Toda etapa da casca tem rótulo, estado e, quando bloqueada ou não implementada, motivo em texto.
2. Nenhum número de desenho escrito à mão na casca — G08 continua verde sem exceção nova.
3. Todo `seletorAlvo` do tour resolve para atributo existente (Tarefa 4), com meta-teste.
4. Cada `ModalType` que a casca invoca existe no tipo e tem modal montado em `page.tsx`.
5. Com selo público ausente, a casca exibe estado declarado e **não quebra**.

---

## TAREFA 7 — evidência e commit

`docs/verificacoes/2026-11-11p_casca_fluxo.md`: a tabela das oito etapas com fonte de estado de
cada uma; a decisão da Tarefa 2 sobre a dupla montagem; o que o painel da Tarefa 3 exibe e de onde
lê; as quatro âncoras e o resultado da trava nova; e as duas pendências da Tarefa 5.

Inclua **uma captura de tela da casca** em `docs/figuras/` ou, se não for possível, a transcrição
textual das oito etapas como aparecem.

---

## CHECKLIST

- [ ] Branch: ______
- [ ] T1 — casca com 8 etapas, sempre visível; estado com motivo em texto
- [ ] T1 — nenhum painel existente alterado por dentro
- [ ] T2 — `"sorteio"` em `ModalType`; painel reaproveitado sem alteração; decisão sobre dupla montagem: ______
- [ ] T3 — painel de medição somente leitura; indisponível declarado quando faltar dado
- [ ] T4 — as 4 âncoras existem; trava de seletor do tour passa, com meta-teste
- [ ] T5 — etapa 5 como "não implementada", com motivo; duas pendências registradas
- [ ] T6 — as 5 travas passam; G08 verde sem exceção nova
- [ ] T7 — evidência escrita, com captura ou transcrição das oito etapas
- [ ] `npm test` e `npx tsc --noEmit` gravados
- [ ] `npm run estado:verificar`, `git status --short`, `git log --oneline -3` gravados
- [ ] **`git push` confirmado contra o remoto**
