# Tarefa: produzir o material de decisão dos gates — parte independente dos relatórios

**Versão:** 1.0 — 2 de novembro de 2026
**Base do trabalho:** `origin/sarel/executor-2026-10-09` (ponta; os commits `1a35f43` e `8262ed9` após `f63d8a5` são apenas documentais)
**Origem:** [Consolidação dos achados verificados](../CONSOLIDACAO_ACHADOS_VERIFICADOS_2026-11-01.md), achados `N-03` a `N-06` e `N-14`; [Planejamento sequencial](../PLANEJAMENTO_SEQUENCIAL_CORRECOES_2026-11-01.md), Fase 2.

> **Este prompt não corrige nada e não decide nada.** Ele produz **material de decisão** para os gates `G-01` a `G-15`: números, cenários e consequências, de modo que o pesquisador escolha com o custo de cada opção à vista. Toda escolha permanece dele (CLAUDE.md §2).

---

## 1. Papel e limites

**Pode:** escrever scripts de cálculo e simulação, produzir tabelas e documentos de verificação, reproduzir e conferir aritmética.

**Não pode:** escolher entre as saídas de `G-01`; alterar `src/config/decisoes.ts`; alterar qualquer parâmetro; tocar em código de produção (`src/`, exceto para leitura); alterar `scripts/d25/avaliacao_d25_referencia.py`.

**Entregue recomendação apenas onde este prompt pedir explicitamente** — e sempre separando "o que o número mostra" de "o que eu sugiro".

### Autorização de git — a ser preenchida pelo pesquisador

- [ ] `git commit` na branch ______________________
- [ ] `git push` na branch ______________________
- [ ] nenhuma das duas — escreva, relate os caminhos e pare

---

## 2. O que fica fora, por depender de relatório pendente

| Gate | Depende de |
|---|---|
| `G-01` **opção de colapso** | veredito de `L-01` (Cochran no primário) — o estimador de variância colapsada precisa de lastro conferido |
| `G-02` | `L-02` (Olofsson et al. 2014; King & Zeng 2001) |
| `G-10` | `L-03` (Bertoni & Lombardi Neto) |
| qualquer item sobre o estado do código | relatório de `P-0` |

**O que este prompt faz é o que não depende disso:** a aritmética dos cenários, a decomposição da inviabilidade, o acoplamento com o poder, a escala da métrica e o depósito do pré-registro. Quando `L-01` voltar, o material estará pronto para receber o veredito de lastro e ir ao gate.

---

## 3. Item 1 — Aritmética dos cenários de `G-01` (**prioritário**)

A fonte é `docs/verificacoes/2026-10-31_ocupacao_estratos_d16.md`, colunas `N_h` antes e pós-thinning.

**Faça:** escrever `scripts/cenarios_g01.py`, que lê os `N_h` da tabela e, para cada cenário, calcula número de estratos, polígonos (4 por estrato), held-out (2 por estrato), área de voo (5,02 ha por polígono), `min(N_h)` resultante, quantidade de estratos em exatamente 4 candidatos, e **se o cenário satisfaz a guarda de `N_h ≥ 4`**.

**Números de conferência.** A aritmética abaixo foi calculada sobre a tabela e **deve ser reproduzida pelo seu script**. Divergência é erro de um dos dois e precisa ser investigada, não acomodada. O total antes do thinning deve fechar em **677 candidatos** e pós-thinning em **453** — se não fechar, a leitura da tabela está errada.

| Cenário | Estratos | Polígonos | Held-out | Área (ha) | `min(N_h)` | Em exatamente 4 | Satisfaz a guarda |
|---|---:|---:|---:|---:|---:|---:|---|
| Pré-registrado (18 estratos) | 18 | 72 | 36 | 361,4 | 0 | 1 | **não** |
| Op. 1 — colapsar `E_1_*_2` e `E_2_{2,3}_2` | 15 | 60 | 30 | 301,2 | 4 | 1 | sim |
| **Op. 1-v — colapsar todo S1×K̂2 e todo S2×K̂2** | 14 | 56 | 28 | 281,1 | **7** | **0** | sim |
| Op. 2 pura — excluir S1×K̂2 do domínio | 15 | 60 | 30 | 301,2 | **2** | 0 | **não** |
| Op. 2 + colapso do S2×K̂2 deficiente | 14 | 56 | 28 | 281,1 | 4 | 1 | sim |
| Op. 3 — K̂ agregado só em Ŝ1 | 15 | 60 | 30 | 301,2 | **2** | 0 | **não** |
| Op. 3 — K̂ agregado em Ŝ1 e Ŝ2 | 12 | 48 | 24 | 241,0 | **12** | 0 | sim |

**Três consequências que o material de decisão precisa declarar, e que nenhum dos documentos de 01/11 registra:**

1. **As opções 2 e 3, como formuladas, não resolvem o problema.** Os quatro estratos inviáveis são `E_1_1_2` (0), `E_1_2_2` (3), `E_2_2_2` (2) e `E_2_3_2` (2) — e **dois deles são Ŝ2×K̂2, não Ŝ1×K̂2**. Declarar S1×K̂2 fora do domínio, ou agregar K̂ apenas em Ŝ1, deixa `E_2_2_2` e `E_2_3_2` em 2 candidatos: a guarda do sorteio continuaria recusando. Ambas só se tornam exequíveis **combinadas** com um remédio para Ŝ2×K̂2.
2. **A opção 1, como descrita, deixa um estrato em exatamente 4** (o colapso `E_2_2_2 + E_2_3_2` = 4), que sob recusa de 25% tem **31,6%** de chance de completar os quatro titulares. É o mesmo ponto frágil de `E_1_3_2` no desenho atual, apenas deslocado.
3. **A variante 1-v domina a opção 1 em todos os eixos:** menos voo (281,1 contra 301,2 ha), `min(N_h)` de 7 contra 4, nenhum estrato sem reserva — ao custo de perder também o contraste de Ê em Ŝ2×K̂2. Ela **não aparece em nenhum dos três documentos** e precisa estar na mesa.

**Produza** `docs/verificacoes/2026-11-02_cenarios_g01.md` com a tabela conferida, as três consequências e, para cada cenário, **o que deixa de ser estimável** (qual contraste se perde).

---

## 4. Item 2 — Decomposição da inviabilidade (N-14)

**Faça:** separar, no mesmo documento, o que é déficit estrutural do que é efeito do thinning de 1 km (P02).

**Números de conferência:**

- Inviáveis **pós-thinning**: `E_1_1_2` (0), `E_1_2_2` (3), `E_2_2_2` (2), `E_2_3_2` (2) — **4 estratos**.
- Inviáveis **antes do thinning**: `E_1_1_2` (0), `E_2_2_2` (3), `E_2_3_2` (2) — **3 estratos**.
- **Único recuperável por revisão de P02:** `E_1_2_2` (4 → 3). `E_1_3_2` perde a única reserva (5 → 4).

**Declare, sem recomendar:** revisar P02 reduziria de 4 para 3 os estratos inviáveis e devolveria uma reserva, mas o espaçamento existe para mitigar pseudorreplicação e reduzi-lo tem custo na validação. O lastro de P02 está sob auditoria em `L-10` (`P-L`, item 3) — **não antecipe esse veredito**.

---

## 5. Item 3 — Fragilidade a recusa por cenário

**Faça:** para cada cenário do Item 1 e cada `N_h` resultante, calcular `P(preencher 4 titulares) = P(X ≥ 4)`, com `X ~ Binomial(N_h, 1 − p_rec)`, para `p_rec ∈ {0,10; 0,25}`. Reportar o **estrato mais frágil** de cada cenário, que é o que governa o risco da campanha.

**Conferência:** `N_h = 4` e `p_rec = 0,25` deve dar **0,3164**; `N_h = 7` e `p_rec = 0,25` deve dar **0,944** — ambos batem com a tabela de 31/10, o que valida sua implementação.

**Declare** a limitação que o módulo de pool já declara: o modelo binomial supõe recusas independentes, e recusas podem ser correlacionadas por vizinhança, cooperativa ou perfil fundiário. Com isso, as probabilidades são **otimistas**.

---

## 6. Item 4 — Acoplamento `G-01` → `G-13` (N-04)

O poder do desfecho de D25 é governado pelo número de **clusters** (polígonos held-out), não pelo de células. Os cenários do Item 1 dão held-out de **36, 30, 28 ou 24**.

**Faça:** `scripts/d25/poder_d25.py`, simulando, para cada cenário:

- alvo contínuo zero-inflado em `[0,1]`;
- 502 células por polígono (`5,02 ha` a 10 m);
- bootstrap **por polígono**, como o D25 faz;
- diferença verdadeira de correlação de postos igual à margem pré-registrada de **0,10**;
- saída: poder estimado e largura média do IC, por número de clusters.

**Regras:**

1. É **análise de sensibilidade, não resultado científico**. O arquivo de saída leva prefixo que o identifique como simulação, e o documento diz na primeira linha que não há dado de desfecho.
2. **Não** altere `avaliacao_d25_referencia.py`.
3. Reporte a prevalência de zeros usada e **varie-a** (ver Item 5): o poder depende dela.

**Conferência de ordem de grandeza:** D24 estima ~920 unidades efetivas para as 18.072 células de 36 polígonos held-out (≈25,6 por polígono). Para 30, 28 e 24 polígonos, espere ~768, ~717 e ~615 unidades efetivas. Se sua simulação divergir muito disso, investigue antes de reportar.

---

## 7. Item 5 — Escala da margem sob inflação de zeros (N-03) — **o item mais delicado**

D26 declara que *"a maioria das células é 0"*; D23 fixa correlação de postos como métrica primária; D25 pré-registra margem de **0,10**. Com forte inflação de zeros, **todos os zeros empatam**, e a correlação de postos passa a medir sobretudo a separação zero/não-zero, somada ao ordenamento interno dos positivos.

**Faça:** simular, com prevalência de zeros em `{0,50; 0,70; 0,85; 0,95}`:

1. a **distribuição nula** da correlação de postos (modelo sem sinal) e seu desvio;
2. o **máximo atingível** pela métrica quando a predição é perfeita — com muitos empates, o teto pode ser menor que 1;
3. o que **0,10 de diferença** representa, em desvios da nula, em cada prevalência;
4. a sensibilidade ao tratamento de empates da implementação usada (declare qual é).

**Entregue** `docs/verificacoes/2026-11-02_escala_margem_spearman.md` respondendo a uma pergunta só: **a margem de 0,10 significa a mesma coisa em qualquer prevalência de zeros?** Se não, o pré-registro fixa um número numa escala que só será conhecida depois do primeiro voo — e isso precisa ser emendado **antes** do primeiro rótulo, não depois.

**Não proponha** nova métrica nem nova margem. Mostre o problema com números; a emenda é do pesquisador (`G-12`).

---

## 8. Item 6 — Potência do portão duplo de kappa (`G-08`)

O código usa kappa `0,61` com exigência de **IC inferior ≥ 0,61**; os documentos dizem `0,60`. O portão duplo é muito mais exigente que o ponto.

**Faça:** calcular, para kappa verdadeiro em `{0,65; 0,70; 0,75; 0,80}`, o **n mínimo** para que o limite inferior do IC de 95% alcance `0,61` com 80% de probabilidade. Reporte em tabela.

**Entregue** o número que falta ao gate: *com o n de fotointerpretação previsto, o portão duplo é alcançável?* Se não for, o pesquisador precisa saber antes de adotá-lo, não depois de reprovar.

---

## 9. Item 7 — Depósito externo do pré-registro (N-06)

`hash_config` (`avaliacao_d25_referencia.py:150-155`) exclui corretamente a chave `pre_registro` do corpo hasheado. Mas o pesquisador escreve o hash no arquivo que controla: quem edita os blocos recalcula o hash. O mecanismo protege contra descuido, não contra a tentação que existe para conter.

**Faça:** levantar as vias de **estampa de tempo externa**, com o que cada uma exige e o que registra: OSF, Zenodo (com DOI), tag Git assinada em repositório público. Para cada uma: custo, se aceita embargo até a defesa, e se a data é verificável por terceiro.

**Não** execute nenhum depósito. Levantamento apenas.

---

## 10. Formato do material de decisão

Para cada gate coberto (`G-01`, `G-08`, `G-12`, `G-13`, `G-15`), uma página em `docs/planejamento/decisao/G-XX.md` com exatamente estas seções:

1. **A pergunta**, em uma frase.
2. **As opções**, incluindo as compostas que o Item 1 revelou necessárias.
3. **O que cada opção custa**, em número: polígonos, held-out, hectares de voo, `min(N_h)`, poder, contraste perdido.
4. **O que fica impedido por falta de lastro**, remetendo a `P-L` sem antecipar o veredito.
5. **O que não é estimável** depois de escolher.
6. **Linha de assinatura**, com o número do gate nos dois documentos de origem (proposta e prompt de 01/11), para que a assinatura não seja ambígua.

---

## 11. Fora de escopo

1. **Não** decida `G-01`, nem recomende entre colapsar, excluir e aninhar. O Item 1 mostra que duas opções são inexequíveis como formuladas — isso é fato aritmético, não recomendação.
2. **Não** altere P02, o thinning, a estratificação ou qualquer parâmetro.
3. **Não** altere `src/config/decisoes.ts` nem `scripts/d25/avaliacao_d25_referencia.py`.
4. **Não** antecipe o veredito de `L-01`, `L-02`, `L-03` ou `L-10`.
5. **Não** rode o D25 em modo probatório, nem em `--dryrun-sintetico`, nem gere número que possa ser citado como desfecho.
6. **Não** implemente o que `P-0` vai corrigir.
7. **Não** abra pull request.

---

## 12. Verificação e relatório

```bash
npm run typecheck
python3 scripts/cenarios_g01.py
python3 scripts/d25/poder_d25.py
python -m unittest discover -s scripts/d25 -p "test_*.py"
```

Grave em `docs/auditorias/RELATORIO_MATERIAL_DECISAO_2026-11-02.md`:

1. A tabela do Item 1, reproduzida pelo seu script, com **divergências em relação aos números de conferência explicitamente apontadas**.
2. A decomposição estrutural × thinning.
3. Fragilidade a recusa, por cenário, com o estrato mais frágil de cada um.
4. Poder por número de clusters, declarado como simulação.
5. A resposta do Item 5: a margem de 0,10 é comparável entre prevalências?
6. O n mínimo do portão duplo de kappa.
7. As vias de depósito externo.
8. O que ficou pendente dos relatórios de `P-0` e `P-L`.

**Resposta final:** 5 a 10 linhas; a tabela de cenários; os três achados do Item 1; o que exige decisão do pesquisador.

**Fim do prompt.** Nenhum código de produção, decisão, parâmetro ou norma é alterado por este arquivo.
