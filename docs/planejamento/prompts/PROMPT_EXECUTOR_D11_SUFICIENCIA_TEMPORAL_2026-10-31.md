# Tarefa: resolver a dívida de lastro de D11 (cobertura temporal mínima)

**Origem:** D11 está em `DIVIDA_DECLARADA` desde 20/10/2026. A auditoria daquela data a classificou como *"a de maior consequência sem fonte: governa suficiência amostral e hoje se apoia apenas na metodologia do próprio projeto"*. Continua aberta.

```bash
git fetch origin
git checkout -B sarel/d11-suficiencia-temporal origin/sarel/executor-2026-10-09
```

---

## O que D11 diz hoje

```
valor:       "Mínimo de 6 observações orbitais válidas (sem nuvem/sombra) por
              ponto/janela temporal para análise de persistência temporal e
              time-series stacking."
referencia:  "Metodologia PPGTCA 2026, Seção 6.1"     ← autorreferência pura
decididoEm:  2026-09-13
```

## O problema não é a falta de citação para o 6

Ao levantar onde o número atua, aparecem **três pisos distintos e não coordenados**, dos quais apenas um tem fonte:

| Piso | Valor | Onde está | O que governa | Lastro |
| :--- | ---: | :--- | :--- | :--- |
| **D11** | **6** | `src/lib/gee/copernicusGeeClient.ts:29` (`LIMIAR_MINIMO_OBSERVACOES_D11`) | admissão do ponto candidato e o cálculo de **Ê** | **nenhum** |
| **DP-24** | **9** | `src/lib/matriz/montagemTemporal.ts:34` (`N_MINIMO_PERCENTIS_CAUDA_DP24`) | percentis de cauda `ndvi_p10` / `ndvi_p90` | Hyndman & Fan (1996), **lido no primário** |
| **harmônicos** | **12** | `src/lib/gee/harmonicos.ts:44` (`nMinimoObservacoes` default) | ajuste harmônico OLS de B12 e B8 | **nenhum declarado** |

O piso de D11 é o **mais baixo dos três** e governa a coisa de maior consequência: se o ponto entra no estudo, e o valor de **Ê**, que é uma das três dimensões dos 18 estratos pré-registrados de D12.

Um único número não pode servir a três estimandos com exigências estatísticas diferentes. É isso que precisa ser resolvido — não encontrar uma fonte que diga "6".

## Três observações que orientam a busca

**1. O 6 coincide exatamente com o número de parâmetros do modelo harmônico de dois harmônicos.** A §3.4 da metodologia publica `ρ(t) = c0 + c1·t + Σ_{i=1..2}[a_i·cos + b_i·sin]` — seis coeficientes. Com n = 6 o ajuste fica saturado: resíduo zero, variância residual indefinida, nenhum grau de liberdade. Vale investigar se o 6 nasceu daí. Se nasceu, ele é o limiar de **identificabilidade**, que não garante nada estatisticamente.

**2. Documento e código divergem sobre quantos harmônicos são usados.** `harmonicos.ts:45` tem `usarDoisHarmonicos ?? false`, e nenhum chamador em produção passa a opção — logo o código ajusta **1 harmônico (p = 4)**, enquanto o documento publica **2 harmônicos (p = 6)**. Como o piso depende de p, essa divergência tem de ser resolvida antes de fixar o piso harmônico. Registre-a de qualquer forma.

**3. Ê é estimado como proporção, e a 6 cenas a precisão é inutilizável para estratificar.** Ê = nSoloNu / nValidas é uma proporção binomial. O erro-padrão em p = 0,5:

| n | SE(Ê) |
| ---: | ---: |
| 6 | **0,204** |
| 9 | 0,167 |
| 12 | 0,144 |
| 20 | 0,112 |
| 30 | 0,091 |

Os tercis que definem seis dos dezoito estratos são cortados nessa escala [0, 1]. A 6 observações, dois tercis vizinhos podem distar menos de um erro-padrão — a atribuição de estrato vira ruído. Esse é o argumento quantitativo mais forte para revisar o piso, e ele independe de achar citação.

---

## O que fazer

### Passo 1 — Inventário (antes de qualquer busca)

Mapeie **todos** os pontos do código onde um mínimo de observações é aplicado, com arquivo, linha, valor e o estimando que ele protege. Os três acima são os que localizei; procure outros (`grep -rnE "nValidas|nMinimo|LIMIAR_MINIMO|observacoes"` em `src/lib`). Entregue a tabela antes de prosseguir.

### Passo 2 — Buscar lastro por estimando, não para o número

Para cada estimando, procure fonte primária. Candidatos que **já estão no acervo ou na bibliografia do projeto** — comece por eles, é a correção mais barata, como a auditoria de 20/10 já havia observado:

- **Ajuste harmônico:** **Zhu & Woodcock (2014)**, *Remote Sensing of Environment* 144:152-171, já citada em **D05** e na §3.4 como a fonte do próprio modelo. Verifique **no primário** se o artigo estabelece regra relacionando número de observações limpas ao número de coeficientes do modelo. Se estabelecer, é o lastro natural: a mesma obra que fornece o modelo fornece o mínimo. **Não presuma a regra — leia e cite a página.**
- **Percentis de cauda:** já resolvido por DP-24 com Hyndman & Fan (1996), arquivado em `docs/verificacoes/fontes/hyndman1996/`. Não refaça; apenas verifique se o escopo declarado cobre o uso atual.
- **Ê como proporção:** literatura canônica de estimação intervalar binomial — **Agresti & Coull (1998)**, *The American Statistician* 52(2):119-126, e **Brown, Cai & DasGupta (2001)**, *Statistical Science* 16(2):101-133. Nenhuma das duas prescreve um n mínimo para sensoriamento remoto; o que elas dão é o instrumento para **o pesquisador declarar a precisão que exige** de Ê e derivar o n correspondente. Declare essa fronteira explicitamente, como DP-24 fez com Hyndman & Fan.

Se a busca não encontrar fonte para algum dos pisos, **não invente e não estique uma fonte adjacente**. Pela R-L4, registre a dívida com o que foi buscado, onde, e por que não serviu. A Seção 5 da Norma é explícita: *"na dúvida sobre se a fonte sustenta a afirmação, ela não sustenta."*

### Passo 3 — Medir o custo antes de propor

Elevar o piso de D11 exclui candidatos. Antes de qualquer proposta, **meça** sobre o conjunto real de candidatos da BP3:

- quantos pontos sobrevivem a cada piso: 6, 9, 12, 20;
- como os tercis de Ê e a ocupação dos 18 estratos mudam em cada cenário;
- se algum estrato fica vazio ou sem os 4 polígonos que D16 exige.

Apresente a tabela. Sem ela, qualquer proposta de piso é opinião.

### Passo 4 — Propor, e PARAR

Com inventário, lastro e medição em mãos, apresente ao pesquisador as opções e **pergunte**. Não altere o valor de D11 por conta própria.

A forma provável da proposta é **decompor D11 em pisos por estimando** — admissão do ponto, Ê, percentis, harmônicos — cada um com seu lastro e sua fronteira declarada, em vez de um número único servindo a quatro propósitos. Mas essa conclusão tem de sair da sua medição, não deste prompt.

---

## Consequência de pré-registro — leia antes de propor qualquer mudança

Ê alimenta os tercis que definem seis dos dezoito estratos de **D12**, e D12 está declarada como pré-registrada antes da coleta. Mudar o piso de D11 muda quais pontos são elegíveis, muda os tercis empíricos e muda a atribuição de estrato.

A favor: **o sorteio real de D16 ainda não aconteceu** — os únicos artefatos de 72 polígonos são os `SINTETICO_NAO_VOAR_*` em `docs/verificacoes/voo_ncontrol/`. A janela está aberta, e é a mais barata que existirá: depois do sorteio, mexer em D11 invalida uma amostra real; depois do voo, invalida trabalho de campo.

Contra: é emenda a decisão pré-registrada e precisa ser declarada como tal — com data, motivo e a observação de que foi feita **antes** de qualquer dado de desfecho existir, que é o que a distingue de HARKing (Nosek et al., 2018, já citada em D25).

Se a proposta implicar mudança, inclua o texto da emenda pronto para D11 e D12.

---

## Entregáveis

1. `docs/auditorias/AUDITORIA_D11_<data>.md` — inventário dos pisos, resultado da busca por estimando (incluindo as buscas que **não** deram fruto, com o que foi consultado), a medição do Passo 3 e as opções apresentadas.
2. Se alguma fonte for lida no primário: arquive em `docs/verificacoes/fontes/<autor><ano>/` com SHA-256, no padrão já usado por `hyndman1996/`, e declare a **fronteira** da fonte — o que ela sustenta e o que não sustenta (R-L3).
3. `src/config/decisoes.ts` — atualizado **apenas** se o pesquisador decidir; caso contrário, apenas o motivo da dívida em `DIVIDA_DECLARADA` atualizado com o que foi buscado.
4. A divergência `usarDoisHarmonicos` (documento = 2 harmônicos, código = 1) registrada, com proposta de resolução.
5. Se a dívida de D11 for fechada, remova-a de `DIVIDA_DECLARADA` — a trava `lastroCientifico.test.ts` já exige essa remoção e vai reprovar se ela ficar obsoleta.

## Fora de escopo

Não mexa nos outros itens de `DIVIDA_DECLARADA` (D03, D17, D18, P07). Não altere o piso de DP-24, que já tem lastro primário. Não reexecute a estratificação nem o sorteio.

---

## Verificação

```bash
npx vitest run && npm run typecheck && npm run lint
npx vitest run src/config/lastroCientifico.test.ts     # a trava de dívida
grep -rnE "LIMIAR_MINIMO_OBSERVACOES_D11|N_MINIMO_PERCENTIS|nMinimoObservacoes" src/lib --include="*.ts" | grep -v test
```

Empurre com `git push -u origin sarel/d11-suficiencia-temporal`. As três últimas rodadas foram empurradas direto em `sarel/executor-2026-10-09` apesar de o prompt pedir branch própria — se houver razão técnica para isso, diga qual no relato, para pararmos de pedir.

Rodapé obrigatório em cada commit:
```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0124eRLwbTVuEsVKcsq67486
```

## Relatório final

Cada afirmação numérica ou de caminho de arquivo acompanhada do comando que a produziu e da saída real colada. Nome de arquivo citado deve ter sido confirmado com `ls` ou `git show`, não lembrado. Se uma busca bibliográfica não encontrou nada, diga o que procurou e onde — busca malsucedida documentada vale mais que citação aproximada.
