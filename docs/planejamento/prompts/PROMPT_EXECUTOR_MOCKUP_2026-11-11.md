# PROMPT T — EXECUTOR SAREL — mockup distribuível para navegador

**Objetivo.** Um pacote estático que abre no navegador, percorre todas as telas e o tour completo,
**sem operar nada**, para que orientadores e financiadores vejam o estado do projeto. Precisa poder
ser distribuído **sem risco**.

---

## 0. PROTOCOLO

`docs/DESENVOLVIMENTO.md`. Informe o branch e permaneça nele. Saídas em
`docs/verificacoes/execucao/2026-11-11t/`. **Commit escrito depois do fato. `git push` confirmado.**

---

## 1. O PRINCÍPIO QUE GOVERNA ESTE PROMPT

O SAREL tem guardas que impedem dado sintético de se passar por real — `assegurarApenasPontosReais`,
o prefixo `SINTETICO_NAO_VOAR_`, o marcador `__SAREL_AVISO__`, a recusa de selo com origem
sintética. **O mockup é sintético por construção e inverte essa relação.**

Portanto a marcação tem de ser **mais forte**, não mais fraca. O risco deste pacote não é vazar
dado: é alguém confundi-lo com o sistema real, ou confundir uma tela de demonstração com um
resultado de pesquisa.

**Regra:** em nenhum momento, em nenhuma tela, deve ser possível olhar e não saber que é demonstração.

---

## 2. SUPERFÍCIE DE RISCO — já medida, não a redescubra

Levantamento do planejador em 11/11/2026:

| Item | Situação | Consequência |
|---|---|---|
| Variáveis `NEXT_PUBLIC_` | **nenhuma** | nenhum segredo vai ao pacote do cliente |
| Token do Mapbox | vem de `credenciais.mapboxToken`, estado de execução | não é embutido no build |
| Selo público (`selo_publico_d16_*.json`) | importado estaticamente por `seloPublicoD16.ts` | **seguro** — é redigido, sem coordenada, sem identificador |
| Universo dos 677 (coordenadas, CAR) | **não** é importado por componente algum | não entra no pacote |
| Cache de Ê | lido por `process.cwd()`, servidor | não entra no pacote |
| Rotas de API | 13 rotas, renderizadas no servidor | **somem na exportação estática** |

**A exportação estática é a trava principal:** sem rotas de API, nenhuma operação real é possível
por construção — não há como consultar o GEE, gravar selo, exportar dado ou chamar serviço externo.
Não é promessa, é ausência de caminho.

---

## TAREFA 1 — exportação estática em configuração própria

Crie configuração de build separada — por exemplo `next.config.mockup.mjs` — com
`output: "export"`, **sem alterar** a configuração de produção.

Acrescente script npm, por exemplo `mockup:build`, e documente o comando no relatório.

**Confirme e grave** que o pacote gerado não contém as 13 rotas de API, e que nenhuma string de
credencial aparece nele:

```
grep -rl "private_key\|service_account\|access_token\|BEGIN PRIVATE KEY" <dir-do-pacote> || echo "LIMPO"
```

---

## TAREFA 2 — conjunto de demonstração

As telas precisam de dados para mostrar. Gere conjunto **sintético**, com a convenção que o projeto
já usa:

- identificadores com prefixo que declare a natureza, no padrão de `SINTETICO_NAO_VOAR_`;
- marcador `__SAREL_AVISO__` ou equivalente em cada registro;
- **coordenadas deslocadas** — dentro da região para que o mapa faça sentido, mas **sem coincidir
  com imóvel real algum**. Não reutilize as coordenadas dos 677;
- **nenhum código CAR real, nenhum nome de proprietário, nenhum estrato associado a ponto real**.

O selo público pode ser mantido como está: é redigido e já foi verificado como livre de chave
proibida e de coordenada.

**Se a geração do conjunto exigir desligar alguma guarda antissintética, não a desligue:** passe
pelo caminho que o projeto já tem para dado declaradamente sintético, e diga no relatório qual foi.

---

## TAREFA 3 — marcação inequívoca

1. **Faixa permanente**, visível em todas as telas, dizendo que é demonstração e não operação —
   não um rodapé discreto.
2. **Marca d'água ou rótulo** nas telas que mostram dados, declarando que os pontos são sintéticos.
3. **Título da aba e nome do arquivo** do pacote declarando "mockup" ou "demonstração".
4. **Tela inicial** com uma frase sobre o que é o pacote, o que mostra e o que não faz, e a data do
   estado retratado.

---

## TAREFA 4 — o que precisa funcionar

- **O tour completo**, com as dezessete etapas e o holofote resolvendo em todas. É o que torna o
  pacote útil para quem não conhece o projeto.
- **Todas as telas abrem**: as oito etapas da casca, os modais, o painel de medição, o de sorteio.
- **Navegação fluida** — quem recebe vai clicar sem orientação.

## TAREFA 5 — o que NÃO pode funcionar

Toda ação que, no sistema real, mede, grava, sorteia, exporta ou contata serviço externo deve estar
**visivelmente desabilitada**, com explicação curta de que a operação existe no sistema real e está
desligada na demonstração.

**Não remova os botões.** Mostrar que a função existe faz parte do propósito do pacote. Desabilite
e explique — é mais informativo que esconder, e é honesto.

---

## TAREFA 6 — verificação antes de distribuir

Grave cada uma:

1. o pacote **não contém** credencial, chave ou token (comando da Tarefa 1);
2. o pacote **não contém** coordenada dos 677 — busque por três coordenadas reais do universo e
   confirme ausência;
3. o pacote **não contém** nome de proprietário nem código CAR;
4. **nenhuma rota de API** no pacote;
5. abrir o pacote **sem rede** e percorrer o tour inteiro — confirme que nada quebra e que nenhuma
   tela tenta chamar serviço externo;
6. o selo público presente é o redigido, não o completo.

A verificação 5 é a mais importante: é a prova de que o pacote não contata nada.

---

## TAREFA 7 — entrega

Pacote em `docs/apresentacoes/` ou diretório próprio, com **README curto** dentro dele: o que é,
como abrir, o que mostra, o que não faz, e a data do estado retratado.

Diga no relatório **como abrir** — se por arquivo local ou se exige servidor estático simples —, e
o tamanho do pacote, que importa para distribuir por e-mail ou nuvem.

---

## CHECKLIST

- [ ] Branch: ______
- [ ] T1 — build estático em config própria; produção **não** alterada; comando: ______
- [ ] T2 — conjunto sintético com marcação; coordenadas deslocadas; sem CAR, sem proprietário
- [ ] T2 — nenhuma guarda antissintética desligada; caminho usado: ______
- [ ] T3 — faixa permanente, marca nos dados, título e tela inicial
- [ ] T4 — tour completo com as 17 âncoras resolvendo; todas as telas abrem
- [ ] T5 — ações operacionais desabilitadas **e explicadas**; botões **não** removidos
- [ ] T6 — as seis verificações gravadas, em especial a de abrir sem rede
- [ ] T7 — README dentro do pacote; forma de abrir e tamanho no relatório
- [ ] `npm test` e `npx tsc --noEmit` gravados
- [ ] **`git push` confirmado contra o remoto**
