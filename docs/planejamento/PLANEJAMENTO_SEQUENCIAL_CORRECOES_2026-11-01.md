# Planejamento Sequencial das Correções — SAREL v2

**Data:** 1 de novembro de 2026
**Base:** [Consolidação dos achados verificados](CONSOLIDACAO_ACHADOS_VERIFICADOS_2026-11-01.md), sobre `f63d8a5`.
**Natureza:** plano de execução. Não decide metodologia, não altera limiar científico e não promove decisão a `decidida` (CLAUDE.md §2).

> **Regra de ordenação:** nada entra numa fase cujo insumo ainda não existe. Um item cuja forma depende de decisão pendente não é "adiantado" — é refeito. Um item que pode corromper dado real é executado antes de qualquer item que apenas melhora o sistema.

---

## 1. Os três critérios que ordenam o plano

1. **Risco de dano irreversível primeiro.** O default de 0,00 no alvo e a duplicidade de `pi_i` podem gravar dado falso ou selar probabilidade errada. Selo de D16 e rótulo humano não se desfazem. Estes vêm antes de tudo que seja só melhoria.
2. **Lastro antes da decisão que ele sustenta.** Uma emenda a D12/D16 apoiada em citação não conferida nasce com o vício que o projeto declarou combater em D22. Conferir a fonte é pré-requisito do gate, não documentação posterior.
3. **Decisão antes da estrutura que a materializa.** O contrato de dados da matriz (`A-05`) codifica quantos estratos, qual `pi_i`, qual partição e quais modelos existem. Construí-lo antes de B-01/B-02/B-03/B-04 é escrever o esquema de um desenho que ainda vai mudar.

---

## 2. Caminho crítico

```
L-01 Cochran no primário ─────┐
                              ├──► B-01 fatorial ──┐
L-02 Olofsson / King & Zeng ──┤                    ├──► A-05 contrato ──► A-06 D25 ──► campanha
                              ├──► B-02 estimando ─┤
                              │                    │
N-03 escala da margem ────────┼──► B-07 família ───┤
                              │    B-12 poder ─────┘
L-03 Bertoni & Lombardi ──────┴──► B-10 fator P ──► interpretação de D25
```

Fora do caminho crítico, e por isso **executáveis desde já em paralelo**: `A-01`, `A-02`, `A-03`, `A-04`, `A-07a`, `A-08`, `A-09`, `N-02`, `L-07`, `L-08`, `A-10`.

---

## Fase 0 — Contenção imediata (dias; sem gate, sem dependência)

Executável agora. Nenhum item depende de decisão pendente, e todos reduzem risco de dado falso.

| Item | O que fazer | Aceite |
|---|---|---|
| **A-07a** | Remover o default `0,00` da fração erodida; campo inicia vazio e salvar exige valor explícito. Remover o observador `"Pesquisador PPGTCA"` e a confiança `"alta"` pré-preenchidos | Não é possível gravar rótulo sem fração digitada; `rotuloHumano` rejeita observador vindo de default de UI |
| **N-02** | Marcar `sortearPoligonosDroneD16` como legada e impedir seu uso em produção (ou removê-la com os testes); corrigir o docstring do módulo, que ainda documenta `pi_i = 2/N_h`; registrar a divergência de D23 (36×10 ha no texto, 72×5,02 ha no código) para emenda | Só uma rotina de sorteio é alcançável a partir da rota e do CLI; o docstring diz `4/N_h` |
| **A-03** | Remover `const semente = 42`; exigir semente explícita ou gerar por `crypto`; registrar no relatório, no critério de seleção e no selo D16 | Sementes diferentes produzem sorteios diferentes; a mesma semente reproduz; o selo contém a semente |
| **A-08** | NDVI/BSI retornam `null` com denominador nulo, sem clamp; remover clamp `[0,1]` da fração de solo nu; remover `"BLOCO_INDEFINIDO"`; remover confiança `0,95` do JEV | `0/0` → indisponível; ponto sem bloco é rejeitado no treino; laudo JEV sem número de confiança |
| **A-09** | Retirar latitude, longitude e município do payload externo do JEV; exigir opt-in; marcar o laudo como heurístico | Payload sem coordenadas; laudo não entra em `montarMatrizTreino` |

**Por que A-07a não espera B-05.** A decisão sobre estado-vs-evento e sobre a regra de coerência classe↔fração é do pesquisador (B-05, A-07b). Remover um default que grava zero silencioso não é decisão: é a Regra 1 do projeto — valor ausente permanece ausente. Se um voo ocorrer antes das decisões, este é o único defeito capaz de produzir rótulo falso.

---

## Fase 1 — Lastro bloqueante (semanas; em paralelo com a Fase 0)

Esta fase existe porque dois gates e a interpretação do desfecho principal dependem de fontes que não estão conferidas.

| Item | Obra | Sustenta | Situação atual |
|---|---|---|---|
| **L-01** | Cochran (1977) §5A.12 | **B-01 opção 1** (colapsar estratos) | Só há síntese secundária autodeclarada `NAO_CONFERIDO_NO_PRIMARIO`, que diz exigir homologação no primário **antes** de emenda a D12/D16 |
| **L-02** | Olofsson et al. (2014); King & Zeng (2001) | **B-02** (estimando), B-09 (âncora), regras de inferência de D23 | Não arquivadas |
| **L-03** | Bertoni & Lombardi Neto | **B-10/B-11** (tabela de P de D22) | Não conferida; tabela de origem em saída de IA |
| **L-10** | Roberts et al. (2017) para **P02** (thinning de 1 km) | **B-01**, via N-14 | Dívida quitada por cruzamento; a fonte trata de validação espacial, não prescreve 1 km para seleção de candidatos |

**Entrega de cada item:** PDF ou exemplar arquivado em `docs/verificacoes/fontes/<id>/` com SHA-256, mais uma nota de conferência que declare **o que a fonte sustenta e o que não sustenta** — o formato que o arquivo de Cochran já adota corretamente, mudando apenas o status.

**Saída para o caso de L-01 demorar.** A dependência `L-01 → B-01` vale **apenas para a opção 1**. As opções 2 (declarar S1×K̂2 fora do domínio de D07) e 3 (desenho condicional) não usam o estimador de variância colapsada e **não dependem de Cochran**. Se o exemplar não for obtido em tempo hábil, o pesquisador pode decidir B-01 por uma dessas opções sem violar a norma de lastro — o que não pode é escolher a opção 1 citando uma síntese que se declara não conferida.

---

## Fase 2 — Gates de desenho (decisão do pesquisador)

Nenhum item desta fase é executável por engenharia. A entrega da engenharia é **material de decisão**, não decisão.

| Gate | Pergunta | Insumo que falta |
|---|---|---|
| **B-01** | Como tratar 4 estratos com `N_h < 4`, um deles zero? | L-01 (para a opção 1); **L-10** (lastro de P02); **N-05**: a alocação 4×18 é a melhor contra poder e custo de voo?; **N-14**: inviabilidade decomposta entre déficit estrutural e efeito do thinning |
| **B-02** | O produto é área da BP3 ou desempenho na população de polígonos elegíveis? | L-02 |
| **B-03** | O hold-out aleatório dentro do estrato sustenta generalização espacial? | — |
| **B-04** | A dissertação alega predição prospectiva (P) ou só detecção (D)? | B-02 |

**Acréscimo obrigatório a B-01 (N-04 e N-05).** A decisão de B-01 altera o número de polígonos held-out: a opção 1 leva a 28–32, contra os 36 sobre os quais o poder já é descrito como marginal para a margem de 0,10. B-01 e B-12 (poder) **não são independentes** e devem ser decididos na mesma sessão, com o custo de voo explícito (56–64 polígonos de 5,02 ha ≈ 281–321 ha a ~4 cm de GSD).

---

## Fase 3 — Pré-registro antes do primeiro rótulo (decisão + engenharia leve)

Tudo nesta fase precisa estar fechado **antes do primeiro dado de desfecho**. Depois, qualquer alteração é flexibilidade analítica.

| Item | O que decidir ou fazer | Observação |
|---|---|---|
| **N-03** | Tratamento de empates na correlação de postos e escala da margem de 0,10 sob alvo zero-inflado | D26 declara que "a maioria das células é 0"; a distribuição nula de Spearman depende da prevalência de zeros, desconhecida antes do voo. Emenda a D25/D26 |
| **B-07 / B-06(prompt)** | Tweedie como ordenador, ou família limitada com calibração | Se a saída for probabilidade ou fração, exige clip e calibração; se for ranking, basta declarar |
| **B-05** | Alvo de estado (cicatriz) ou de incidente (erosão nova) | Define o vocabulário da dissertação e o papel de D19 |
| **B-06 / B-05(prompt)** | Cobertura mínima P11: 0,95, 0,90 ou sem filtro com covariável | P11 está `proposta`; o script de referência já usa 0,95 como se decidido |
| **B-08 / B-07(prompt)** | Regra de kappa: 0,60 ou 0,61, pontual ou com IC inferior | Código e documentos divergem hoje |
| **B-11(proposta)** | P10 e a grade de Tweedie no config | Sem decisão, o modo probatório deve falhar, não usar default |
| **N-06** | Depósito externo do pré-registro com estampa de tempo (OSF, Zenodo ou tag assinada) | O hash atual é auto-certificado: quem edita o config o recalcula |
| **A-07b** | Regra de coerência classe↔fração na gravação do rótulo | Só após B-05; a regra é normativa, não técnica |

---

## Fase 4 — Contrato de dados (engenharia; **depende da Fase 2**)

| Item | O que fazer | Depende de |
|---|---|---|
| **A-05** | Adicionar aos perfis `matriz-treino`/`matriz-heldout`: `Estrato_ID`, `Pi_i`, `W_i`, `N_Candidatos_Estrato`, `Incluida`, `Cobertura_Celula`, `Area_Delineada_m2`, `Pixel_ID` (opaco), `Modelo`, `Data_Referencia`, `Fim_Janela`; popular do selo D16 e do CSV de D26 | **nenhum gate**, se o esquema validar estrutura e não cardinalidade — ver nota abaixo |
| **C-02** | Esquema versionado com validação; a exportação falha se faltar chave do desenho | A-05 |
| **C-07** | Dicionário de dados: coluna, unidade, suporte, origem, decisão | A-05 |

Fecha de uma vez os três achados S1 que têm a mesma causa raiz (`V-01`, `V-03`, `T-02` — ver N-08).

**Correção da dependência declarada na §5 desta primeira versão.** A proposta de 01/11 afirmava que `A-05` depende de `B-02`/`B-03`, e este planejamento repetiu. **Verificação de 02/11 mostra que a dependência é mais fraca do que isso para `A-05`:** o selo D16 já grava `estratoId`, `papelConjunto`, `pi_i`, `w_i` e `nCandidatosEstrato` por polígono (`sorteioPoligonos.ts:531-543`), de modo que os valores vêm do selo que o sorteio gravar, em qualquer cenário de `G-01`; e Zod 3.23.8 já é dependência. `A-05` é portanto **executável agora**, sob uma condição de desenho: o esquema valida **estrutura e proveniência, nunca cardinalidade** — nada de `18`, `72` ou `36` no código. O que permanece dependente de gate é `A-06` (exigir contagens no modo probatório, via `G-01`) e a exportação da segunda matriz (`G-04`).

---

## Fase 5 — D25 fail-closed e poder (engenharia; depende da Fase 4)

| Item | O que fazer | Aceite |
|---|---|---|
| **A-06** | Em `--probatorio`: exigir `Incluida`, `Pixel_ID`, `Estrato_ID`, `Modelo`, `Data_Referencia`; exigir o número de polígonos e estratos **aprovado em B-01** (não o default 36/18); `monotonicidade` não vazia; config congelado com hash conferido; `RUSLE_A` disponível. `_so_incluidas` e `_checar_pixels_disjuntos` falham em modo probatório | Matriz sem `Incluida` falha; `n-1` polígonos falha; monotonicidade vazia falha; hash divergente falha; sem `RUSLE_A` o desfecho é `NAO_AVALIAVEL` antes de qualquer ajuste |
| **B-12** | Simulação de poder com o número de clusters **aprovado em B-01** e a escala de margem definida em **N-03** | Relatório de poder e largura de IC, declarado como sensibilidade, não resultado |

**Correção a aplicar ao enunciado da simulação.** O prompt executor pede "36 clusters, ~25 unidades efetivas". O Anexo A da auditoria dá **920 unidades efetivas no held-out**, ou ≈25,6 **por polígono**. Lido literalmente, o enunciado erra a simulação por um fator próximo de 36.

---

## Fase 6 — Especificação do competidor (decisão; condiciona a leitura do desfecho)

Esta fase é o motivo pelo qual a validação bibliográfica não pode ser tratada como documentação.

Dois dos cinco fatores do RUSLE estão declaradamente mal especificados, **ambos na direção de enfraquecer o competidor**:

- **R** é sucedâneo declarado do EI30 — o CHIRPS é diário e o EI30 exige intensidade em 30 minutos;
- **P** está fixo em 1,0, o que superestima a perda em área terraceada; a tabela de D22 é de origem em saída de IA, não conferida, e não está implementada.

A justificativa de D13 já registra a consequência: *"parte da distância entre o RUSLE e os competidores pode vir da degradação do fator R, não da inferioridade do modelo físico, e essa possibilidade precisa estar escrita antes dos resultados."*

| Item | O que decidir | Depende de |
|---|---|---|
| **L-04** | Tratamento do fator P: manter 1,0 declarando a direção do viés; implementar a tabela com status provisório; ou declarar a comparação condicionada | L-03 |
| **—** | Redação, **antes dos resultados**, da limitação conjunta R+P na comparação de D25 | L-04 |

Sem isso, um resultado favorável ao XGBoost é ambíguo entre "o modelo é melhor" e "o competidor foi mal especificado" — e a ambiguidade é conhecida de antemão, o que a torna indefensável em banca.

---

## Fase 7 — Campanha (depende das Fases 2 e 3)

| Item | O que fazer | Depende de |
|---|---|---|
| **A-11** | Verificar contenção do polígono no imóvel e no domínio antes do selo; reaplicar thinning após realocação; registrar a distância mínima realizada | B-01, B-02 |
| **B-09** | Protocolo pré-registrado de não resposta; âncora de prevalência como seleção separada, com `pi_i` próprio, fora dos polígonos | L-02, B-02 |
| **A-02** | P03: três critérios de campo (já na Fase 0, mas é aqui que passa a valer na prática) | — |

---

## Fase 8 — Lastro remanescente, governança e reporte

| Item | O que fazer |
|---|---|
| **L-05** | Reconstruir o inventário (41 linhas; 16 com caminho, 7 existem, 9 quebrados, 25 sem arquivo — auditoria 31/10 §6.5), nos dois sentidos; **estender as duas travas**: `lastroCientifico.test.ts` (critério sintático — acrescentar existência do caminho, preservando o *ratchet* e as 11 dívidas) e `inventarioBibliografico.test.ts` (hoje só confere o ID da decisão, logo qualquer citação passa) |
| **L-06** | Quitar ou re-datar as 11 entradas de `DIVIDA_DECLARADA` |
| **L-07** | Restringir Rikimaru (2002) ao índice BSI; **reabrir a dívida de D02** (quitação indevida, N-13); declarar os cortes como convenção do projeto, com sensibilidade |
| **L-10** | Auditar as três quitações por cruzamento (D02/Rikimaru, P05/Zanaga, P02/Roberts) pelo critério "qual frase exata a fonte sustenta"; emendar a norma para exigir essa frase (N-13) |
| **L-08** | Propagar `pendenteVerificacao` do fator R ao tipo, à UI e ao CSV |
| **L-09** | Registrar que Agresti & Coull (1998) e Brown et al. (2001) não estão arquivados, e que `SE ≤ 0,144` é auto-verificável por `0,5/√12 = 0,1443` |
| **C-01** | Campo `estadoImplementacao` nas decisões |
| **C-03** | CI com testes de decisão (D11.2, P03, P07, D20, matriz, D25) |
| **C-06** | Rastro achado → commit → teste |
| **A-10** | CI verde; corrigir textos defasados (D07/P05, D23 36↔72, Ficha §7.2 e P03, README, intervalo D01–D26) |
| **—** | Model card, TRIPOD+AI e PROBAST adaptados |

---

## 3. Regras de paralelização

- **Fases 0 e 1 correm juntas.** A Fase 0 é engenharia sem gate; a Fase 1 é obtenção de fontes, que depende de biblioteca e tempo externo. Nenhuma bloqueia a outra.
- **A Fase 2 não começa antes de L-01/L-02**, exceto pelas opções de B-01 que não dependem de Cochran.
- **A Fase 4 não começa antes da Fase 2 fechada.** É a regra que o prompt executor de 01/11 viola ao colocar `A-05` e `A-06` na Trilha A (ver N-09).
- **A Fase 3 precisa estar fechada antes do primeiro rótulo**, independentemente de onde as outras fases estejam.

## 4. O que não fazer

1. **Não executar `A-05` e `A-06` antes dos gates B-01/B-02/B-03/B-04.** O esquema codifica o desenho; escrevê-lo antes garante refazê-lo.
2. **Não congelar `n_estratos = 18` e `n_heldout = 36` como default do config.** A recomendação pendente de B-01 leva a 14–16 e 28–32.
3. **Não abrir a frente de bake-off de modelos** (GAM/EBM/CatBoost/BART/stacking). Não vem de achado, e aumenta a flexibilidade analítica que D24/D25 existem para conter.
4. **Não citar Cochran §5A.12 como lastro** enquanto o status for `NAO_CONFERIDO_NO_PRIMARIO`.
5. **Não citar "7 de 41 caminhos"** — o número não se reproduz.
6. **Não gastar decisão do pesquisador com o fator 9,81 de D13.** A origem está documentada e conferida em duas fontes; resta apenas propagar uma marca (L-08).
7. **Não afrouxar a margem de D25 depois de ver dado.** Se a escala precisa de revisão por causa da inflação de zeros (N-03), a revisão é agora.
8. **Não assinar o termo de gates com a numeração do prompt de 01/11** sem a correção da ambiguidade (N-10).

---

## 5. Termo de gates — numeração unificada

Substitui a seção 11 do prompt executor de 01/11. Cada linha nomeia o tema e os dois identificadores, para que a assinatura não dependa de qual documento o signatário tinha à mão.

| # | Tema | Proposta | Prompt | Pré-requisito | Opção escolhida |
|---|---|---|---|---|---|
| G-01 | Fatorial inviável (+ alocação 4×18) | B-01 | B-01 | **L-01** p/ opção 1 | ____ |
| G-02 | Estimando: área ou polígono | B-02 | B-02 | **L-02** | ____ |
| G-03 | Validação espacial | B-03 | B-03 | — | ____ |
| G-04 | Modelo P no escopo | B-04 | B-04 | G-02 | ____ |
| G-05 | Estado vs evento | B-05 | B-05 | — | ____ |
| G-06 | Cobertura P11 | B-06 | B-05 | G-05 | ____ |
| G-07 | Família do alvo e calibração | B-07 | B-06 | **G-12** | ____ |
| G-08 | Regra de kappa | B-08 | B-07 | — | ____ |
| G-09 | Não resposta e âncora | B-09 | B-09 | L-02, G-02 | ____ |
| G-10 | D22 / fator P da linha de base | B-10 | B-11 | **L-03** | ____ |
| G-11 | P10 e grade de Tweedie | B-11 | — | — | ____ |
| G-12 | Escala da margem e empates em Spearman | — (**N-03**) | — | — | ____ |
| G-13 | Poder e margem de D25 | B-12 | B-08 | **G-01**, G-12 | ____ |
| G-14 | Sítios contínuos: rótulo e IC | B-13 | — | — | ____ |
| G-15 | Depósito externo do pré-registro | — (**N-06**) | — | — | ____ |

**Rebaixados a execução, sem gate:** Rikimaru/D02 → `L-07`; fator 9,81 de D13 → `L-08`.
**Fora de escopo:** bake-off de modelos (prompt B-10).

Assinatura do pesquisador: ______________________  Data: ____/____/______

---

## 6. Prompts previstos

Um prompt por bloco executável, emitido só quando seu insumo existe.

| Prompt | Escopo | Emitir quando |
|---|---|---|
| **P-0 — Contenção** | A-07a, N-02, A-03, A-08, A-09 — [`prompts/PROMPT_EXECUTOR_CONTENCAO_2026-11-01.md`](prompts/PROMPT_EXECUTOR_CONTENCAO_2026-11-01.md) | **Emitido** |
| **P-L — Lastro** | L-01 a L-03 (obtenção), L-05 a L-10, N-13, N-14, especificação do competidor — [`prompts/PROMPT_EXECUTOR_LASTRO_2026-11-01.md`](prompts/PROMPT_EXECUTOR_LASTRO_2026-11-01.md) | **Emitido** |
| **P-A — Decisões vigentes** | A-01 (D11.2), A-02 (P03), A-04 (D20), A-10 (CI e textos) | **Agora**; são decisões já tomadas e não implementadas |
| **P-D — Material de decisão** | Opções para G-01 a G-15 quantificadas (N-03 a N-06, N-14); **não executa nada** — [`prompts/PROMPT_EXECUTOR_MATERIAL_DECISAO_2026-11-02.md`](prompts/PROMPT_EXECUTOR_MATERIAL_DECISAO_2026-11-02.md) | **Parte independente emitida**; o veredito de lastro de G-01/G-02/G-10 entra quando P-L voltar |
| **P-M — Contrato de dados** | A-05, C-02, C-07 — [`prompts/PROMPT_EXECUTOR_CONTRATO_MATRIZ_2026-11-02.md`](prompts/PROMPT_EXECUTOR_CONTRATO_MATRIZ_2026-11-02.md) | **Emitido**: `A-05` é executável já, desde que o esquema não hardcode cardinalidade (ver Fase 4) |
| **P-S — Simulação de poder** | Execução oficial de `poder_d25.py` e fechamento de `G-13`, por outra mão — [`prompts/PROMPT_EXECUTOR_SIMULACAO_PODER_2026-11-03.md`](prompts/PROMPT_EXECUTOR_SIMULACAO_PODER_2026-11-03.md) | **Emitido** |
| **P-V — Validação** | A-06, sensibilidades pré-registradas | Após P-M, P-S e G-13 |
| **P-C — Campanha** | A-11, âncora de D23, protocolo de não resposta | Após G-01, G-02, G-09 |
| **P-R — Reporte** | Model card, TRIPOD+AI, PROBAST, dicionário | Após P-V |

**Fim do planejamento.** Nenhum código, decisão ou parâmetro foi alterado.
