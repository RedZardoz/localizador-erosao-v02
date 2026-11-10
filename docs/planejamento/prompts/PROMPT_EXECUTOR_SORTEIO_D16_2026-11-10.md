# PROMPT J — EXECUTOR SAREL — execução do sorteio de D16

**ESTE PROMPT EXECUTA UM PASSO IRREVERSÍVEL.** A Decisão D23 proíbe descartar, sobrescrever ou
versionar probabilidades de inclusão (π_i) já registradas. O CLI recusa idempotentemente se já
existir qualquer `sorteio_d16_*.json` em `docs/verificacoes/sorteio/`. **O sorteio se roda uma vez.**

---

## 0. LEITURA OBRIGATÓRIA

1. `docs/DESENVOLVIMENTO.md` integralmente.
2. `src/config/decisoes.ts`, blocos **D16**, **D23** e o parâmetro **P07**.
3. `docs/verificacoes/2026-11-10i_invariante_selo.md` e `2026-11-10h_guarda_d11_e_desenho_18x4.md`.
4. `npm run estado:verificar`.

Informe o branch e permaneça nele. **PROTOCOLO ANTI-FABRICAÇÃO do Prompt C (§1)**: saídas em
`docs/verificacoes/execucao/2026-11-10j/`. **Commit escrito depois do fato.**

---

## 1. PRÉ-CONDIÇÕES — confirme todas antes de qualquer execução

Grave a saída de cada uma:

```
git status --short
```

```
npm test
```

```
npx tsc --noEmit
```

```
ls docs/verificacoes/sorteio/
```

- Árvore limpa; suíte verde; zero erros de tipo.
- `docs/verificacoes/sorteio/` **sem nenhum** `sorteio_d16_*.json`. Se houver, **pare**: o sorteio
  já ocorreu e D23 proíbe repetir.
- Os artefatos de entrada existem: `docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json`
  e `docs/verificacoes/cache_frequencia_solo_nu_bp3.json`.

Se qualquer pré-condição falhar, **pare e relate**. Não contorne.

---

## TAREFA 1 — registrar a semente ANTES de sortear

P07 é `dinamica-registrada`: **não existe semente padrão**, e o CLI recusa `--confirmar` sem
`--semente <N>`. A semente é escolha explícita do pesquisador, registrada **antes** da execução.

**Semente escolhida pelo pesquisador: `<SEMENTE>`**

Antes de rodar, registre em `docs/planejamento/DECISOES_DE_CONVERSA.md`, como entrada nova datada
de 10/11/2026: a semente, quem a escolheu, que ela foi fixada **antes** de qualquer sorteio ter
sido visto, e que a execução é única e irreversível por D23.

---

## TAREFA 2 — dry-run SEM semente

```
node --import ./scripts/ts-loader.mjs scripts/sortear_poligonos_d16.ts --dry-run --candidatos docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json
```

**Não passe `--semente` neste comando.** Sem ela, o CLI gera uma semente aleatória só para o
dry-run (`sortear_poligonos_d16.ts:131-137`) e imprime o resultado. Assim você valida a mecânica
**sem pré-visualizar o sorteio real**.

Isso não é formalidade. Se o dry-run usasse a semente escolhida, seria possível ver o resultado,
não gostar, e trocar a semente — que é escolher o sorteio pelo desfecho. A separação é a garantia
de que isso não aconteceu.

Confira na saída do dry-run, e grave:

- modo impresso como `DRY-RUN (SIMULAÇÃO SEGURA — NENHUM SORTEIO EXECUTADO)`;
- totais **67 / 34 / 33 / 336,34**;
- `E_1_3_2` como estrato vazio declarado, `E_1_2_2` como censo com N_h = 3;
- a mensagem `[DRY-RUN CONCLUÍDO] Nenhum sorteio foi executado e nenhum selo foi gravado`.

**Se qualquer um dos quatro totais divergir, PARE.** Divergência significa que o universo mudou
desde `bb949cf`, e isso precisa ser entendido antes de um passo irreversível.

---

## TAREFA 3 — a execução real

Somente com a Tarefa 2 conferida e a Tarefa 1 commitada:

```
node --import ./scripts/ts-loader.mjs scripts/sortear_poligonos_d16.ts --confirmar --semente <SEMENTE> --candidatos docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json
```

Grave a saída integral em `docs/verificacoes/execucao/2026-11-10j/sorteio_execucao.txt`.

**Rode uma vez.** Se o resultado parecer inconveniente, ele é o resultado. Não repita com outra
semente, não apague o selo, não crie `_v2`. D23 existe exatamente para isso, e o CLI vai recusar
de qualquer forma.

Se a execução falhar no meio, **não repita antes de relatar**: verifique se o selo foi gravado
(`ls docs/verificacoes/sorteio/`) e relate o estado exato. Um selo parcialmente gravado é situação
que o pesquisador precisa decidir, não você.

---

## TAREFA 4 — verificar o selo gravado, lendo do disco

Não confie na saída do console. Leia o arquivo `docs/verificacoes/sorteio/sorteio_d16_*.json` que
foi gravado e confirme, gravando a verificação:

1. `versaoEsquema` é `1.4.0` e `invariantesVerificados` lista os 8.
2. Revalide o selo lido do disco com `validarInvariantesSeloD16` — os 8 invariantes passam sobre o
   artefato persistido, não só sobre o objeto em memória.
3. `semente` no selo é exatamente a registrada na Tarefa 1.
4. Totais: `totalPoligonosSorteados` 67, `totalTreino` 34, `totalHeldOut` 33,
   `areaTotalHectares` 336,34, `totalCandidatosEntrada` 677.
5. `estratosVazios` contém `E_1_3_2`; `estratosCenso` contém os cinco estratos de K̂=2 previstos
   (`E_1_2_2`, `E_2_2_2`, `E_2_3_2`, `E_3_2_2` e o próprio `E_1_2_2` se aplicável) — liste o que
   de fato consta.
6. `gitCommit` e `sha256ConjuntoCandidatos` preenchidos.
7. Nenhum polígono com `pi_i` fora de (0, 1]; nenhum identificador repetido.

Qualquer divergência: **relate e não corrija o selo**. O selo é o registro do que aconteceu.

---

## TAREFA 5 — evidência e commit

`docs/verificacoes/2026-11-10j_sorteio_d16_executado.md`, contendo:

1. A semente, e a confirmação de que foi registrada antes da execução.
2. A confirmação de que o dry-run rodou **sem** `--semente`.
3. Os totais do selo, lidos do disco.
4. A tabela dos 18 estratos com `N_h`, polígonos alocados, `π_i`, `w_i` e regime (amostra, censo ou vazio).
5. A revalidação dos 8 invariantes sobre o artefato persistido.
6. A declaração, já registrada em H, de que **cinco estratos de K̂=2 são censo ou déficit e não têm
   suplente possível** em caso de perda em campo.
7. O que **não** foi feito nesta rodada.

**O selo entra no commit.** É o artefato probatório central do desenho amostral.

---

## CHECKLIST

- [ ] Branch: ______
- [ ] Pré-condições: árvore limpa, suíte verde, tsc limpo, `docs/verificacoes/sorteio/` **vazio**
- [ ] T1 — semente `<SEMENTE>` registrada no registro de conversa **antes** da execução, e commitada
- [ ] T2 — dry-run rodado **sem** `--semente`; totais 67 / 34 / 33 / 336,34 conferidos
- [ ] T3 — execução real, **uma única vez**; saída integral gravada
- [ ] T4 — selo lido do disco e revalidado pelos 8 invariantes
- [ ] T4 — semente no selo igual à registrada: ______
- [ ] T4 — `versaoEsquema` 1.4.0; `estratosVazios` e `estratosCenso` conferidos
- [ ] T5 — evidência escrita; selo commitado
- [ ] `npm run estado:verificar`, `git status --short`, `git log --oneline -3` gravados
- [ ] **`git push` executado e confirmado contra o remoto**
