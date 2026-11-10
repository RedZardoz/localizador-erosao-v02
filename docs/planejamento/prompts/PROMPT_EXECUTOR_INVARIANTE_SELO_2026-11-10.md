# PROMPT I — EXECUTOR SAREL — invariante de totais do selo de sorteio

**Pequeno e focado.** Uma única mudança, antes de o sorteio ser executado. **Não execute o sorteio.**

---

## 0. CONTEXTO

O Prompt H trocou os literais do tipo do selo por `number`:

```ts
- totalPoligonosSorteados: 36 | 72;   totalTreino: 18 | 36;   areaTotalHectares: 360 | 361.44;
+ totalPoligonosSorteados: number;    totalTreino: number;    areaTotalHectares: number;
```

A troca era inevitável: sob a emenda D12/D16 de 10/11/2026 os totais passaram a 67, 34, 33 e
336,34, que não cabiam nos literais. Mas `number` é a substituição mais fraca possível, e o selo é
o artefato que a banca examina.

A exposição prática hoje é pequena, porque os totais são **derivados** dos polígonos sorteados
(`sorteioPoligonos.ts:388-391`) e não passados por fora. O que se perdeu foi a guarda — e ela deve
voltar na camada certa, como invariante de execução, no mesmo padrão da asserção de
Horvitz-Thompson que o Prompt H acertou (`:278-283`).

---

## 1. LEITURA E PROTOCOLO

`docs/DESENVOLVIMENTO.md`; `src/lib/gee/sorteioPoligonos.ts` (montagem do selo, ~:385-420);
`src/lib/gee/sorteioPoligonosTipos.ts`. Rodar `npm run estado:verificar`.

Informe o branch e permaneça nele. **PROTOCOLO ANTI-FABRICAÇÃO do Prompt C (§1)**: saídas em
`docs/verificacoes/execucao/2026-11-10i/`. **Commit escrito depois do fato.**

---

## TAREFA 1 — invariante de totais, antes de o selo ser devolvido

Em `sorteioPoligonos.ts`, imediatamente antes do `return` que monta o selo, verifique e **lance**
com prefixo `[SELO_INVALIDO]` — no mesmo estilo do `[SORTEIO_INVALIDO]` já existente — nomeando o
invariante violado e os valores observados:

| # | Invariante |
|---|---|
| 1 | `totalTreino + totalHeldOut === totalPoligonosSorteados` |
| 2 | `areaTotalHectares === Number((totalPoligonosSorteados * 5.02).toFixed(2))` |
| 3 | `totalPoligonosSorteados === Σ_h n_h`, somando os polígonos efetivamente alocados por estrato |
| 4 | `totalCandidatosEntrada === Σ_h N_h` — os estratos particionam a entrada, sem perder nem duplicar candidato |
| 5 | nenhum `Pixel_ID`/identificador de polígono repetido no selo |
| 6 | todo estrato listado em `estratosCenso` tem `π_i === 1` em todos os seus polígonos |
| 7 | todo estrato listado em `estratosVazios` tem `N_h === 0` e **zero** polígonos alocados |
| 8 | para todo polígono, `π_i ∈ (0, 1]` e `π_i × w_i === 1` (com tolerância 1e-9) |

O invariante 8 já existe por estrato; aqui ele é reconferido **sobre o selo inteiro**, que é o
artefato que sai para fora do processo.

**Não restaure os literais no tipo.** O invariante de execução é estritamente mais forte: literais
verificam pertinência a um conjunto fixo, o invariante verifica consistência interna, que é o que
realmente importa.

### 1.1 Registro no selo

Acrescente ao selo um campo listando os invariantes conferidos, por exemplo
`invariantesVerificados: string[]`, com os identificadores dos oito. É o que permite a quem lê o
selo saber **o que foi verificado**, em vez de confiar.

Isso é mudança de esquema: avalie se `versaoEsquema` deve subir de `1.3.0` para `1.4.0` e
**verifique se algum teste fixa a versão** antes de mudar. Se subir, atualize os que fixarem.

---

## TAREFA 2 — travas

Em `src/lib/gee/sorteioPoligonos.test.ts`, ou em arquivo próprio:

1. **Caminho feliz:** um sorteio válido sobre um pool sintético passa pelos oito invariantes.
2. **Um teste de adulteração por invariante** — oito testes. Construa um selo válido, corrompa
   **um** campo, e prove que lança `[SELO_INVALIDO]` nomeando aquele invariante. É o que demonstra
   que a guarda não é decorativa.
3. **Censo:** um estrato com `N_h = 3` passa nos invariantes 6 e 8 com `π_i = 1`.
4. **Vazio:** um estrato com `N_h = 0` passa no invariante 7 sem alocar polígono.
5. **O universo real:** com os 677 candidatos e os 18 estratos medidos, os oito invariantes passam
   e os totais saem **67 / 34 / 33 / 336,34**. Se qualquer um desses quatro números divergir,
   **pare e relate** — divergência aqui significa que algo mudou no universo desde o commit
   `da2abf9`, e isso precisa ser entendido antes do sorteio.

---

## TAREFA 3 — evidência e commit

`docs/verificacoes/2026-11-10i_invariante_selo.md`, contendo: os oito invariantes com a redação
exata implementada; a tabela dos oito testes de adulteração com o resultado de cada um; a
confirmação dos totais 67/34/33/336,34 sobre o universo real; e a decisão sobre `versaoEsquema`.

**Não execute o sorteio.** D23 proíbe sobrescrever π_i já registrados: a execução é irreversível e
é decisão própria do pesquisador, em rodada dedicada.

---

## CHECKLIST

- [ ] Branch: ______
- [ ] T1 — os 8 invariantes implementados antes do `return`, com `[SELO_INVALIDO]`
- [ ] T1 — literais **não** restaurados no tipo
- [ ] T1 — `invariantesVerificados` no selo; `versaoEsquema`: mantida em 1.3.0 ou subida para ___ (motivo: ______)
- [ ] T2 — 8 testes de adulteração, um por invariante, todos lançando
- [ ] T2 — censo (N_h=3) e vazio (N_h=0) cobertos
- [ ] T2 — universo real: totais ___ / ___ / ___ / ___ (esperado 67 / 34 / 33 / 336,34)
- [ ] T3 — evidência escrita; **sorteio não executado**
- [ ] `npm test` e `npx tsc --noEmit` gravados
- [ ] `npm run estado:verificar`, `git status --short`, `git log --oneline -3` gravados
- [ ] **`git push` executado e confirmado contra o remoto** (o Prompt H foi relatado como concluído sem ter subido)
