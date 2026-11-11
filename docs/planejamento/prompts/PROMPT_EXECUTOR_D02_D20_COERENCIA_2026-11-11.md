# PROMPT O — EXECUTOR SAREL — duas verdades no registro: D02 e D20

**Achado S1-8** da auditoria DeepSeek de 09/11/2026. Não é defeito de execução — é incoerência no
documento que a banca lê primeiro. O código está correto nos dois casos; o registro é que
contradiz a si mesmo.

**Não altera comportamento de cálculo. Não executa sorteio.**

---

## 0. LEITURA E PROTOCOLO

1. `docs/DESENVOLVIMENTO.md` integralmente.
2. `src/config/decisoes.ts`, blocos **D01**, **D02** e **D20**.
3. `docs/planejamento/DECISOES_DE_CONVERSA.md`, entradas **01** e **02**.
4. `docs/auditorias/DeepSeek/AUDITORIA_FUNCIONAL_METODOLOGICA_2026-11-09.md`, achado **S1-8**.
5. `npm run estado:verificar`.

Informe o branch e permaneça nele. **PROTOCOLO ANTI-FABRICAÇÃO do Prompt C (§1)**: saídas em
`docs/verificacoes/execucao/2026-11-11o/`. **Commit escrito depois do fato. `git push` confirmado.**

---

## 1. RESTRIÇÕES TÉCNICAS JÁ MEDIDAS — não as redescubra

Verificado pelo planejador em 11/11/2026:

- `EstadoDecisao = "pendente" | "proposta" | "decidida"`. **Não existe estado de revogação.**
- `exigirParametro` (`decisoes.ts:58`) lança `ErroDecisaoPendente` quando o estado não é
  `"decidida"`.
- `src/lib/gee/amostragemBiofisica.ts:38-45` lê os quatro cortes de D02 via `exigirParametro`.
  **Logo D02 não pode ir para `"pendente"`** sem que os parâmetros migrem antes.
- `DECISOES.D20` **não é consumida por código de produção** — confirme com
  `git grep -n "DECISOES.D20\|REGISTRO_DECISOES.D20" -- src scripts` e grave a saída.
- `decisoesEmendas.test.ts` fixa o estado de dez decisões; **D20 não está entre elas**. Confirme
  antes de alterar e grave a conferência.

---

## TAREFA 1 — D20: uma fórmula decidida a mais para o mesmo fator

Hoje:

```
titulo: "Fórmula do Fator C híbrido SPD: Durigon et al. (2014) modulada pelo BSI"
estado: "decidida"
valor:  "C = ((1 - NDVI) / 2) * (1 + BSI) ..."
```

E o código usa **Durigon puro**: `calcularFatorC(ndvi)` consulta `exigirDecisao(DECISOES.D01)`, e
a variante híbrida vive isolada em `calcularFatorCSensibilidadeBsi`, fora do caminho analítico. A
decisão de conversa 01 registra que o híbrido foi superado.

Quem lê o registro vê **duas fórmulas vigentes para o Fator C**.

**Correção:** rebaixe D20 de `"decidida"` para `"proposta"`, e reescreva título e valor para
declarar o que ela é: **modelo de sensibilidade, não fórmula analítica**. Acrescente EMENDA datada
de 11/11/2026 registrando que:

1. o Fator C analítico do projeto é **exclusivamente** D01, Durigon puro, `C = (1 − NDVI)/2`;
2. o termo multiplicativo `(1 + BSI)` **não consta de nenhuma fonte citada** — é construto do
   projeto, conforme já apontado na verificação bibliográfica de 03/11/2026;
3. D20 permanece disponível apenas como análise de sensibilidade, implementada em
   `calcularFatorCSensibilidadeBsi`.

Se alguma trava fixar `D20.estado === "decidida"`, **atualize a trava** e diga qual era no
relatório — não reverta a correção.

---

## TAREFA 2 — D02: o título não descreve o valor

Hoje:

```
titulo: "Critérios observacionais de presente/ausente e negativo explícito"
valor:  "Amostragem estratificada pura: Classe 1 (Erosão: BSI > 0.10 e NDVI < 0.40) vs
         Classe 0 (Controle/SPD: BSI < 0.00 e NDVI > 0.65) ... EMENDA DE 06/10/2026 ..."
```

O título promete critério observacional — isto é, rótulo humano. O valor entrega regra espectral
de triagem. São naturezas diferentes, e a EMENDA de 06/10 já declarou que os cortes **não** são
rótulo.

**Nesta rodada, faça apenas a correção que não muda comportamento:**

1. **Retitule** para algo que descreva o valor, por exemplo *"Critério espectral de triagem de
   candidatos (BSI e NDVI)"*. O título passa a dizer o que a decisão é.
2. Acrescente EMENDA de 11/11/2026 declarando, em texto: que os quatro cortes são **convenção
   operacional do projeto**, conferido no primário em 09/11/2026 — Rikimaru et al. (2002) formula o
   índice BSI e **não prescreve corte algum**; que a triagem **não produz rótulo** (Regra 4); e que
   o rótulo de presente/ausente é produzido exclusivamente por observação humana, registrada em
   decisão própria.
3. **Mantenha `estado: "decidida"` e os quatro parâmetros onde estão.** Rebaixá-la quebraria
   `amostragemBiofisica.ts` por `ErroDecisaoPendente`, conforme §1.

---

## TAREFA 3 — registrar a decisão que fica em aberto

A entrada 02 do registro de conversa propôs que **D02 volte a pendente e os limiares migrem para
parâmetro operacional**. Essa mudança é maior: exige criar parâmetro na série P, migrar os quatro
cortes, reapontar `amostragemBiofisica.ts` e conferir as travas que leem D02.

**Não a execute.** Registre-a como pendência formal em `DECISOES_DE_CONVERSA.md`, entrada nova
datada de 11/11/2026, contendo:

- a proposta, nos termos da entrada 02;
- a razão de não ter sido executada agora: é mudança de estrutura do registro às vésperas da
  apresentação, e o ganho é de forma, não de conteúdo, já que a EMENDA da Tarefa 2 já declara a
  natureza;
- **o impacto técnico medido**, conforme §1: `exigirParametro` lança para estado diferente de
  `"decidida"`, e `amostragemBiofisica.ts:38-45` lê os quatro cortes;
- que a decisão de executá-la é do pesquisador.

---

## TAREFA 4 — propagação e travas

1. Rode `node scripts/gerar_decisoes_md.mjs --gerar` (confirme o nome real) e verifique
   `paridadeArtefatos.test.ts`, que exige paridade entre `decisoes.ts` e `DECISOES.md`.
2. Rode `git grep -n "Fator C híbrido\|hibrido\|híbrido" -- src docs scripts`, grave a saída e
   **liste no relatório** os documentos que ainda apresentem D20 como fórmula vigente. **Não os
   edite nesta rodada** — quero ver a extensão antes.
3. Acrescente trava que falhe se **duas** decisões em estado `"decidida"` declararem fórmula para o
   mesmo fator RUSLE. É a trava que impede o retorno do defeito. Se a estrutura atual não permitir
   detectá-lo de forma robusta, implemente a verificação restrita ao Fator C e diga isso.
4. Meta-teste da trava de (3): construa par sintético e prove que ela acusa.

---

## TAREFA 5 — evidência e commit

`docs/verificacoes/2026-11-11o_coerencia_d02_d20.md`: o antes e depois de D02 e D20; a saída do
`git grep` de D20 em produção e da conferência das travas; a pendência registrada na Tarefa 3; a
lista de documentos que ainda citam o híbrido como vigente; e o resultado da trava nova com o
meta-teste.

---

## CHECKLIST

- [ ] Branch: ______
- [ ] §1 — saídas de `git grep DECISOES.D20` e da conferência de `decisoesEmendas.test.ts` gravadas
- [ ] T1 — D20 rebaixada a `"proposta"`; título e valor declaram sensibilidade; EMENDA de 11/11
- [ ] T1 — trava que fixava `D20.estado` atualizada, se houver: qual: ______
- [ ] T2 — D02 retitulada; EMENDA de 11/11 com a convenção e a Regra 4
- [ ] T2 — `estado` e os quatro parâmetros de D02 **inalterados**
- [ ] T3 — pendência registrada no registro de conversa, com o impacto técnico medido
- [ ] T4 — `DECISOES.md` regenerado; `paridadeArtefatos` verde
- [ ] T4 — saída de `git grep` do híbrido gravada; documentos **não** editados
- [ ] T4 — trava de fórmula duplicada implementada, com meta-teste
- [ ] T5 — evidência escrita
- [ ] `npm test` e `npx tsc --noEmit` gravados
- [ ] `npm run estado:verificar`, `git status --short`, `git log --oneline -3` gravados
- [ ] **`git push` confirmado contra o remoto**
