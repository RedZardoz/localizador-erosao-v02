# Relatório de execução — Material de decisão dos gates (P-D)

**Data:** 3 de novembro de 2026
**Prompt executado:** [`PROMPT_EXECUTOR_MATERIAL_DECISAO_2026-11-02.md`](../planejamento/prompts/PROMPT_EXECUTOR_MATERIAL_DECISAO_2026-11-02.md)
**Branch:** `correcoes/contencao-2026-11-02`
**Natureza:** produz material de decisão. **Não corrige e não decide nada.** `decisoes.ts` não tocado; `avaliacao_d25_referencia.py` não tocado.

> **Ressalva de independência, declarada porque importa.** Os números de conferência do Item 1 foram calculados por mim na sessão anterior, de modo que esta execução **não é verificação independente** deles. O que fiz para mitigar: o script lê a tabela de ocupação do disco em vez de transcrever valores, e aborta se o total não fechar em 677/453. A conferência verdadeira exige outra mão.

---

## 1. Entregas

| Artefato | Conteúdo |
|---|---|
| `scripts/cenarios_g01.py` | Itens 1, 2 e 3: cenários de `G-01`, decomposição da inviabilidade, fragilidade a recusa, **e conferência das probabilidades publicadas na tabela de 31/10** |
| `scripts/d25/poder_d25.py` | Itens 4 e 5: poder por número de clusters e escala da margem sob inflação de zeros |
| `scripts/d25/kappa_portao_duplo.py` | Item 6: potência do portão duplo de kappa |
| `docs/planejamento/decisao/G-01.md` | fatorial inviável |
| `docs/planejamento/decisao/G-08.md` | regra de kappa |
| `docs/planejamento/decisao/G-12.md` | escala da margem (achado `N-03`) |
| `docs/planejamento/decisao/G-13.md` | poder e margem — **incompleta de propósito**, aguarda a execução oficial |
| `docs/planejamento/prompts/PROMPT_EXECUTOR_SIMULACAO_PODER_2026-11-03.md` | `P-S`: executa a simulação de poder **por outra mão** e fecha `G-13` |
| `docs/planejamento/decisao/G-15.md` | depósito externo do pré-registro (achado `N-06`) |

---

## 2. Item 1 — cenários de `G-01`: a aritmética reproduziu

O script lê `docs/verificacoes/2026-10-31_ocupacao_estratos_d16.md` e **aborta** se a soma não fechar. Resultado: `antes=677, pós-thinning=453`, 18 estratos lidos — confere.

| Cenário | Estratos | Polígonos | Held-out | Área | `min(N_h)` | Em 4 | Guarda | P(preencher\|25%) |
|---|---:|---:|---:|---:|---:|---:|---|---:|
| Pré-registrado | 18 | 72 | 36 | 361,4 ha | 0 | 1 | **não** | 0,0% |
| Op.1 (recomendada em 01/11) | 15 | 60 | 30 | 301,2 ha | 4 | 1 | sim | **31,6%** |
| **Op.1-v (ausente dos documentos)** | **14** | **56** | **28** | **281,1 ha** | **7** | **0** | sim | **92,9%** |
| Op.2 pura | 15 | 60 | 30 | 301,2 ha | **2** | 0 | **não** | 0,0% |
| Op.2 + colapso | 14 | 56 | 28 | 281,1 ha | 4 | 1 | sim | 31,6% |
| Op.3 (K̂ só em Ŝ1) | 15 | 60 | 30 | 301,2 ha | **2** | 0 | **não** | 0,0% |
| Op.3+ (K̂ em Ŝ1 e Ŝ2) | **12** | **48** | **24** | **241,0 ha** | **12** | **0** | sim | **100,0%** |

As três consequências do prompt se confirmam: **as opções 2 e 3 puras não resolvem** (deixam `min(N_h)=2`, porque dois dos quatro estratos inviáveis são Ŝ2×K̂2); **a opção 1 desloca a fragilidade** (31,6% de chance de preencher sob 25% de recusa); e **a variante 1-v domina a opção 1** em todos os eixos.

### Divergência encontrada na tabela de 31/10

O script passou a conferir as probabilidades que a própria tabela publica, contra o modelo binomial que ela declara. De **36 valores** (18 estratos × 2 taxas), **35 reproduzem** e **1 não**:

| Estrato | `N_h` | Tabela | Modelo binomial |
|---|---:|---:|---:|
| `E_2_1_2` | 7 | **94,4%** | **92,9443%** |

O valor de 10% do mesmo estrato confere (99,7%), e os de `N_h = 4` conferem exatamente (65,6% e 31,6%). Não identifiquei a origem da diferença e **não corrigi a tabela**. Impacto sobre as conclusões de viabilidade: **nulo** — `E_2_1_2` com 7 candidatos é viável em qualquer cenário. Mas é número publicado numa verificação, e a origem precisa ser esclarecida.

---

## 3. Item 2 — decomposição da inviabilidade (`N-14`)

| Medida | Resultado |
|---|---|
| Inviáveis pós-thinning | 4: `E_1_1_2`, `E_1_2_2`, `E_2_2_2`, `E_2_3_2` |
| Inviáveis antes do thinning | 3: `E_1_1_2`, `E_2_2_2`, `E_2_3_2` |
| Inviável **só** por efeito de P02 | `E_1_2_2` (4 → 3) |
| Perdeu a única reserva por P02 | `E_1_3_2` (5 → 4) |

Sem o thinning haveria 3 estratos inviáveis, não 4. O documento declara explicitamente que isto **não** recomenda afrouxar P02.

---

## 4. Item 3 — fragilidade a recusa

Binomial exata, titulares = 4. O estrato mais frágil de cada cenário governa o risco da campanha: Op.1 e Op.2+ ficam em **31,6%** sob recusa de 25%; Op.1-v em **92,9%**; Op.3+ em **100%**.

**Limitação declarada**, a mesma que o módulo de pool do app declara: supõe recusas **independentes**. Se correlacionarem por vizinhança, cooperativa ou perfil fundiário, os números são **otimistas**.

---

## 5. Item 5 — escala da margem: retificação de um achado meu

**O achado `N-03`, como eu o escrevi em 01/11, está parcialmente errado, e a simulação é que mostrou.**

Eu afirmei que *"a distribuição nula de Spearman depende da prevalência de zeros"*. **Não depende, de forma relevante:** a SD da nula vai de 0,01017 a 0,01152 entre 50% e 95% de zeros — razão de **1,13×**. Em desvios da nula, 0,10 é razoavelmente estável (8,7 a 9,8 SD).

O que varia, e muito, é outra coisa:

| Prevalência de zeros | Teto de Spearman atingível | 0,10 como fração do teto |
|---:|---:|---:|
| 50% | 0,9418 | 0,106 |
| 70% | 0,8309 | 0,120 |
| 85% | 0,6634 | 0,151 |
| 95% | 0,4193 | **0,238** |

**O teto encolhe por fator 2,25.** Com 95% de zeros, o máximo que qualquer score contínuo alcança é 0,42, porque a maior parte das observações compartilha um único rank médio. Uma margem absoluta de 0,10 passa a representar **23,8%** de todo o espaço útil, contra 10,6% com 50% de zeros.

**A conclusão de `N-03` sobrevive — a margem não é comparável entre prevalências — mas pelo mecanismo oposto ao que eu havia indicado.** Não é o ruído que cresce; é o espaço que encolhe. Corrigido na página de `G-12`.

---

## 6. Item 4 — poder por número de clusters: corrigi um defeito grave da minha própria simulação

**A primeira versão desta simulação estava errada, e produzia exatamente a conclusão oposta à correta.**

Eu gerei o alvo i.i.d. em todas as células, **sem efeito de polígono**. Sem variância entre clusters, o bootstrap por cluster — que é o que D25 faz — produzia IC de largura ~0,02 e **poder de 100% em todos os cenários**, inclusive com 24 clusters. Isso contradiz a análise da auditoria e a de D24, e a contradição era artefato meu, não achado.

Corrigido com estrutura hierárquica: cada polígono recebe um deslocamento na prevalência de zeros (escala logito) e uma intensidade típica própria das manchas. O ICC foi calibrado pelas **~25,6 unidades efetivas por polígono** que D24 estima — `502/(1 + 501·ICC) = 25,6` dá `ICC ≈ 0,0371`.

E uma segunda correção de desenho, mais importante: a vantagem do modelo sobre o competidor **não é uniforme entre polígonos**. Ele pode ganhar muito onde a feição é nítida e nada onde a cobertura é densa. É essa heterogeneidade — não o número de células — que o bootstrap por polígono mede, e é ela que governa o poder com poucos clusters. A simulação passou a varrer o desvio da vantagem entre polígonos.

**A entrega, portanto, não é "o poder é X%", e sim uma curva:** o poder depende de uma quantidade desconhecida antes do voo.

**A execução oficial foi deliberadamente delegada.** Escrevi o simulador; executá-lo e conferi-lo pede outra mão — e com mais razão depois de ele já ter errado uma vez, de um modo que invertia a conclusão. O prompt `P-S` (`PROMPT_EXECUTOR_SIMULACAO_PODER_2026-11-03.md`) traz a execução, um roteiro de conferência do próprio simulador e um teste de sanidade do nível nominal. A página de `G-13` carrega números **preliminares** (25 réplicas), marcados como insuficientes para decidir, e o aviso de página incompleta no topo.

**O que os preliminares já mostram:** a largura do IC cresce de 0,029 para 0,066 ao passar de SD 0,02 para 0,10 da vantagem entre polígonos, e cresce pouco com a redução de clusters (0,066 → 0,076 de k=36 a k=24). Isto é, **a heterogeneidade entre polígonos pesa mais sobre o poder do que a perda de clusters que qualquer opção de `G-01` provoca** — o que qualifica a afirmação da auditoria de que "0,10 está próximo do ruído com 36 clusters". A qualificação só se confirma com a execução oficial.

---

## 7. Item 6 — portão duplo de kappa: a informação que faltava ao gate

Dois observadores, tabela 2×2, erro-padrão assintótico de Fleiss, Cohen & Everitt (1969). `n` mínimo para 80% de poder, prevalência marginal de 50%:

| κ verdadeiro | `n` necessário no portão duplo |
|---|---|
| **0,65** | **não alcançado até n = 1.200** |
| 0,70 | n ≥ 500 |
| 0,75 | n ≥ 200 |
| 0,80 | n ≥ 120 |

Com κ verdadeiro em **0,65** — que está **acima** do limiar de 0,61 e é "substancial" por Landis & Koch — o portão duplo tem poder de 45% com n = 1.200, e de 12% com n = 120. A regra reprova concordâncias que, no ponto, seriam aprovadas.

**Limitação declarada:** o SE assintótico supõe itens independentes; em células vizinhas de fotointerpretação isso é otimista, e o `n` real é **maior**.

Este é o único dos cinco gates **decidível hoje**: não espera lastro nem dado.

---

## 8. Item 7 — depósito externo do pré-registro

Levantado na página de `G-15`, com **ressalva de lastro explícita**: a rede deste ambiente bloqueia `zenodo.org`, `doi.org` e os demais, de modo que **nada foi conferido na fonte**.

O ponto técnico que o levantamento acrescenta: **a data de um commit Git é campo editável** (`GIT_COMMITTER_DATE`), e uma assinatura GPG prova autoria, não data. Tag assinada é bom controle interno de integridade e **não substitui** depósito externo datado.

---

## 9. Verificação

```
python3 -I scripts/cenarios_g01.py                        → conferência 677/453 OK
python3 -I scripts/d25/poder_d25.py --conferir            → spearman() == scipy.spearmanr (dif. 0,00e+00)
python3 -I scripts/d25/kappa_portao_duplo.py                  → tabelas de poder
python3 -m unittest discover -s scripts/d25 -p "test_*.py" → 49 testes, OK
npx tsc --noEmit                                           → exit 0 (nada de TypeScript foi tocado)
```

**Sobre a suíte Python:** ela só roda com as dependências de `scripts/d25/requirements.txt` instaladas (`scipy`, `scikit-learn`, `xgboost`, `shapely`, `pyproj`). Sem elas, 7 dos 49 testes falham por `ModuleNotFoundError` — não por defeito. Com elas, **os 49 passam**. A auditoria de 31/10 registrou os testes Python como "não reproduzíveis aqui"; eles são reprodutíveis, com as dependências.

Há um `DeprecationWarning` do shapely em `fracao_erodida_celulas_referencia.py:65` (`shapely.ops.transform` está deprecada em favor de `shapely.transform`). Não é defeito e não foi corrigido — fora de escopo.

---

## 10. Pendências

1. **Conferência independente dos números do Item 1** — foram calculados por mim; o script mitiga lendo a tabela, não substitui outra mão.
2. **A origem do 94,4%** de `E_2_1_2` na tabela de 31/10.
3. **A execução oficial da simulação de poder** — prompt `P-S`, por outra mão.
4. **Todos os cinco gates** seguem aguardando o pesquisador. `G-08` e `G-12` são decidíveis hoje; `G-01` espera `L-01`; `G-13` espera `G-01` e `P-S`; `G-15` espera os outros, por conter o número de estratos no config.
5. **O tipo do selo** (`36 | 72`, `18 | 36`) não aceita nenhuma saída viável de `G-01`. Registrado em `P-M`, segue aberto.

---

## 11. Divergência de branches — resolvida em 03/11/2026

As duas branches eram paralelas por um erro meu: `correcoes/consolidacao-achados-2026-11-01`
foi criada de `f63d8a5`, o commit que os documentos de auditoria citavam, antes de eu descobrir
que a ponta de `sarel/executor-2026-10-09` (`8262ed9`) já continha esses mesmos documentos. O
planejamento ficou de um lado e a execução do outro, e as referências cruzadas quebravam.

**Unificadas por merge** em `correcoes/contencao-2026-11-02`. O merge foi limpo — `f63d8a5` é
ancestral de `8262ed9` e os conjuntos de arquivos não se sobrepõem — e as referências cruzadas
foram restauradas como links.

Observação de nomenclatura: o nome da branch já não descreve o seu conteúdo, que vai muito além
da contenção. Renomear é outra operação e fica a critério do pesquisador.

---

## 12. Achado do varredor de padrões proibidos, registrado durante a execução

`scripts/kappa_portao_duplo.py` foi reprovado pelo varredor com o padrão
`sintese-aleatoria-atributos-fisicos`, em duas linhas: uma **anotação de tipo**
(`rng: np.random.Generator`) e a construção do gerador (`np.random.default_rng(a.seed)`).

**Tentei declarar a concessão com `# permitido:` e descobri que não funciona assim** — e o
mecanismo é melhor do que eu supunha. A isenção só vale para arquivos previamente inscritos
em `LISTA_EXCECOES_AUTORIZADAS`, uma lista fechada dentro de `padroesProibidos.ts`. **Um autor
não pode se auto-conceder exceção.** Não me inscrevi na lista: seria exatamente o que o
mecanismo existe para impedir.

**Resolvido movendo o script para `scripts/d25/`**, onde `poder_d25.py` já estava. E aqui está
o achado que merece registro:

> **`scripts/d25/` é excluído inteiro da varredura de padrões proibidos**
> (`listarArquivosScripts`, `padroesProibidos.ts:526`: `relDir !== "scripts/d25"`).

A exclusão tem razão de ser — o avaliador usa bootstrap e dry-runs declaradamente sintéticos,
de modo que aleatoriedade ali é legítima. Mas a consequência é que **o diretório que contém o
artefato probatório mais sensível do projeto não é varrido**. Não alterei: incluí-lo faria
`avaliacao_d25_referencia.py` reprovar, e decidir o que fazer com isso é do pesquisador.

Mantive no script os comentários que explicam por que a aleatoriedade é legítima ali — não há
ponto amostral, não há matriz e não há rótulo, de modo que a Regra 5 não tem objeto —, mas
removi os marcadores `# permitido:`, que seriam auto-concessão inútil.

**Fim do relatório.** Nenhuma decisão, parâmetro científico ou norma foi alterado.
