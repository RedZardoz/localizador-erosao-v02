# PROMPT EXECUTOR — ATALHO DE MONOTONICIDADE (P-4)

**Data:** 03/11/2026
**Branch de trabalho:** `correcoes/contencao-2026-11-02` (ponta esperada: `3a9828e`)
**Depende de:** P-S (simulação de poder) e P-3 (retificação das avaliações), ambos já executados.
**Natureza:** verificação numérica + retificação documental. **Não altera metodologia, limiar ou decisão.**

---

## 1. Objetivo em uma frase

Fechar o item que a Nota de Retificação sobre Monotonicidade deixou explicitamente pendente — "a verificação formal com 500 réplicas permanece pendente" — rodando apenas as duas linhas de SD alto onde as inversões são maiores, e **corrigir dois erros estatísticos da própria nota**, acrescentando o enquadramento de regime e a evidência de não reprodutibilidade que a preparação deste prompt levantou.

---

## 2. LEIA ANTES DE RODAR — quatro achados que mudam o escopo

A nota de retificação em `docs/auditorias/RELATORIO_SIMULACAO_PODER_2026-11-03.md` está **direcionalmente correta** — as inversões são de fato compatíveis com ruído — mas carrega **dois erros** que precisam de conserto (A-1 e A-2), omite **um enquadramento decisivo** (A-3), e agora tem a seu favor **evidência empírica nova** (A-4).

A-1 a A-3 foram apurados relendo a Tabela 1 e o código de `scripts/d25/poder_d25.py`, sem rodar simulação nova. A-4 saiu das corridas de aferição de custo, arquivadas em `docs/verificacoes/verificacao_custo_e_ruido_poder_d25_2026-11-03.md`.

### Achado A-1 — A nota registra 4 inversões; existem 6

Enumerando **todos** os pares de `k` adjacentes da Tabela 1 (o poder deve cair quando `k` cai):

| SD | par | poder | inversão | EP(dif) | Δ/EP |
|---:|:---|:---|---:|---:|---:|
| 0,08 | k28→k24 | 98,8% vs 100,0% | 1,2 pp | 1,22 | 0,99 |
| 0,10 | k30→k28 | 93,8% vs 96,2% | 2,4 pp | 3,44 | 0,70 |
| **0,15** | **k30→k28** | **61,3% vs 63,7%** | **2,4 pp** | **7,65** | **0,31** |
| 0,30 | k36→k30 | 15,0% vs 18,8% | 3,8 pp | 5,92 | 0,64 |
| 0,45 | k36→k30 | 10,0% vs 16,2% | 6,2 pp | 5,31 | 1,17 |
| **0,45** | **k28→k24** | **8,8% vs 13,8%** | **5,0 pp** | **4,99** | **1,00** |

As duas linhas em negrito **não constam** da nota. A nota precisa listar seis.

### Achado A-2 — O Δ/EP da nota está inflado por um fator de √2

A nota divide a inversão pelo erro padrão de **uma** proporção, $\sqrt{p(1-p)/R}$. A comparação é entre **duas** proporções estimadas de forma independente (o gerador consome fluxos disjuntos do mesmo `rng` sequencial, célula a célula), logo o denominador correto é o erro padrão da **diferença**:

$$\text{EP}(\hat p_a - \hat p_b) = \sqrt{\frac{p_a(1-p_a)}{R} + \frac{p_b(1-p_b)}{R}}$$

Conferência caso a caso: a razão entre o Δ/EP publicado e o correto é 1,410 / 1,405 / 1,417 / 1,405 — isto é, exatamente $\sqrt{2} = 1,414$.

Corrigido, **nenhuma das seis inversões passa de 1,17 EP** (a nota afirma "dentro de ~1,6 EP"). O erro é conservador: **reforça** a conclusão de ruído em vez de contrariá-la. Mas a estatística publicada está errada e precisa ser corrigida.

### Achado A-3 — As seis inversões estão todas em regime onde o efeito verdadeiro de `k` é ~0

Efeito ponta a ponta de `k` (k=36 → k=24) por linha de SD:

| SD | k=36 | k=24 | queda | regime |
|---:|---:|---:|---:|:---|
| 0,02 | 100,0% | 100,0% | 0,0 pp | **saturado** (teto de 100%) |
| 0,05 | 100,0% | 100,0% | 0,0 pp | **saturado** |
| 0,08 | 100,0% | 100,0% | 0,0 pp | **saturado** |
| 0,10 | 100,0% | 86,2% | 13,8 pp | informativo |
| 0,12 | 82,5% | 72,5% | 10,0 pp | informativo |
| 0,15 | 70,0% | 52,5% | 17,5 pp | informativo |
| 0,20 | 32,5% | 22,5% | 10,0 pp | informativo |
| 0,30 | 15,0% | 15,0% | 0,0 pp | **piso** (poder < 20%) |
| 0,45 | 10,0% | 13,8% | −3,8 pp | **piso** |

Na faixa informativa (SD 0,10–0,20) o efeito de `k` é **grande e limpo: 10 a 17,5 pp, monotônico ponta a ponta em todas as quatro linhas.** As inversões vivem no teto (SD ≤ 0,08), no piso (SD ≥ 0,30), ou no passo `k=30→k=28` — o contraste mais estreito da grade, cujo efeito teórico sobre a largura do IC é de apenas $\sqrt{30/28} = 1,035$.

**Consequência para este atalho, dita sem rodeio:** em SD 0,30 e 0,45 o poder está no piso (10–19%) e a curva verdadeira é **plana**. Não se demonstra monotonicidade onde não há nada para ser monotônico. O melhor desfecho possível da Tarefa A é "as inversões encolhem para dentro da banda de ruído, compatível com curva plana" — confirmação válida, mas fraca, e sobre um regime que **nenhum desenho aceitaria** (poder de 10–19% está muito abaixo de qualquer limiar utilizável).

### Achado A-4 — as inversões não se reproduzem de uma corrida para outra

As duas corridas de aferição de custo (seção 3) produziram, de graça, a evidência mais forte hoje disponível. Com a **mesma semente** `20261103` e só mudando a contagem de réplicas:

| Corrida | SD | valores (k=36 / 30 / 28 / 24) | inversão em |
|:---|---:|:---|:---|
| R=30 | 0,30 | 16,7 / 26,7 / 16,7 / 10,0 | `k36→k30` |
| R=30 | 0,45 | 13,3 / 10,0 / 13,3 / 10,0 | `k30→k28` |
| R=60 | 0,30 | 21,7 / 6,7 / 11,7 / 11,7 | `k30→k28` |
| R=60 | 0,45 | 11,7 / 6,7 / 16,7 / 6,7 | `k30→k28` |
| R=80 (oficial) | 0,30 | 15,0 / 18,8 / 17,5 / 15,0 | `k36→k30` |
| R=80 (oficial) | 0,45 | 10,0 / 16,2 / 8,8 / 13,8 | `k36→k30`, `k28→k24` |

**A inversão troca de célula a cada corrida.** Um defeito algorítmico se fixaria na mesma célula; ruído passeia.

E a oscilação de uma célula única entre as três corridas chega a **20,0 pp** (SD 0,30 / k=30: 26,7% → 6,7% → 18,8%) — maior que a maior inversão da tabela oficial, que é de 6,2 pp. No regime de piso e com $R \le 80$, a ordenação entre células simplesmente não é estimável.

Enquanto isso, a largura do IC nessas mesmas corridas permanece bem comportada (3 de 4 linhas monotônicas; a exceção está na corrida de menos réplicas). Poder errático + largura estável é a assinatura de ruído no indicador binário, não de erro na maquinaria.

### Evidência auxiliar já disponível (não precisa rodar nada)

A Tabela 2 (largura média do IC) é a média de uma grandeza contínua, logo tem variância muito menor que o poder, que é um indicador binário por réplica. Ela se comporta como a teoria manda:

- 7 das 9 linhas são **estritamente** monotônicas na largura; as 2 exceções estão ambas no passo `k=30→k=28`, o de menor efeito teórico.
- A razão de largura k=24/k=36 fica entre 1,156 e 1,246 nas nove linhas, **média 1,198**, contra o valor teórico $\sqrt{36/24} = 1,2247$ — desvio de −2,2%.

Ou seja: o bootstrap por cluster escala em $1/\sqrt{k}$ como previsto. A maquinaria está correta na estatística de baixa variância. Isso já é evidência forte contra "defeito algorítmico".

---

## 3. Tarefas

### Antes de tudo: corrija o `--bootstrap`

O prompt P-S original prescrevia `--bootstrap 200`, mas a **corrida oficial registrada usou `--bootstrap 100`** (relatório, linhas 66 e 69: "$R = 80$ réplicas, $B = 100$ reamostragens por cluster"). Subir $R$ **e** $B$ ao mesmo tempo confunde as duas causas: qualquer diferença contra a tabela publicada ficaria sem atribuição.

**Mantenha `--bootstrap 100`** em todas as corridas abaixo e mexa apenas em $R$. Assim a comparação com a Tabela 1 isola o efeito das réplicas, que é a pergunta em aberto.

### Tarefa A — o atalho pedido (obrigatória)

```bash
python -u scripts/d25/poder_d25.py --replicas 500 --bootstrap 100 --sd-vantagem 0.30 0.45
```

Mantenha a semente padrão (`20261103`) para comparabilidade com o registrado. Não passe `--seed` diferente sem registrar o motivo.

**Atenção:** `CLUSTERS_POR_CENARIO_G01` é constante de módulo e **não há flag que restrinja `k`**. Cada linha de SD roda a grade inteira de 4 valores de `k`, logo a Tarefa A executa $2 \times 4 \times 500 = 4000$ réplicas.

### Tarefa B — o teste que de fato mede monotonicidade (recomendada)

```bash
python -u scripts/d25/poder_d25.py --replicas 500 --bootstrap 100 --sd-vantagem 0.12 0.15
```

Razão: SD 0,12 e 0,15 estão na faixa informativa, onde o efeito verdadeiro de `k` é de 10 a 17,5 pp — detectável com $R = 500$ (EP da diferença $\approx 3$ pp em $p \approx 0,7$). E SD $\approx 0,12$ é exatamente onde vive o cruzamento de 80% do qual **G-13 depende**, hoje registrado como faixa [0,11; 0,13] com $\pm 0,006$ de incerteza a $R = 80$. Apertar esse cruzamento é decisão-relevante; apertar o piso em SD 0,45, onde o poder é de 10–19%, não é.

### Tarefa C — a grade inteira (preferível a A+B, se a máquina permitir)

```bash
python -u scripts/d25/poder_d25.py --replicas 500 --bootstrap 100 \
  --sd-vantagem 0.02 0.05 0.08 0.10 0.12 0.15 0.20 0.30 0.45
```

Isto **substitui A e B** e reemite a Tabela 1 e a Tabela 2 inteiras a $R = 500$, encerrando a monotonicidade em todas as células de uma vez. Veja o custo abaixo antes de descartar: provavelmente é mais barato do que a nota faz parecer.

### Custo — medido, e por que a nota superestimou

Aferição neste contêiner (arquivada em `docs/verificacoes/verificacao_custo_e_ruido_poder_d25_2026-11-03.md`), duas linhas de SD, preâmbulo de 14 s isolado pela diferença entre duas contagens de réplicas:

| Bootstrap | s / réplica |
|---:|---:|
| $B = 200$ | 0,988 |
| $B = 100$ | 0,617 |

O custo **não é linear em $B$** (razão medida 1,60, não 2,00): há trabalho por réplica fora do laço de bootstrap.

A máquina do executor é mais rápida que este contêiner. Calibrando pelo dado do próprio relatório — a grade de 9 linhas a $R = 80$, $B = 100$ (2880 réplicas) levou ~12 min — resulta **0,250 s/réplica**, ou seja, este contêiner é ~2,5× mais lento.

| Corrida | réplicas | aqui ($B{=}100$) | na máquina do executor |
|:---|---:|---:|---:|
| Tarefa A ou B (2 linhas) | 4 000 | ~41 min | **~17 min** |
| Tarefa C (grade de 9 linhas) | 18 000 | ~3,1 h | **~75 min** |

**Consequência:** a nota de retificação justifica a redução a $R = 80$ com "~2,5 h para a grade expandida". Esse número não se sustenta contra a medição do próprio relatório: $12\ \text{min} \times (500/80) = 75\ \text{min}$. A estimativa de 2,5 h superestima em ~2× — e coincide com o custo da grade cheia num contêiner lento como este, não na máquina onde a corrida de fato rodou.

Ou seja: **a Tarefa C provavelmente cabe em ~75 min** e encerra a questão inteira. Rode-a em segundo plano com `-u` e acompanhe a tabela preenchendo linha a linha. Se por qualquer motivo C não for viável, faça A (pedida nominalmente) e, se der, B (que vale mais cientificamente).

## 4. Critério de decisão — quantitativo, fixado antes de ver o resultado

Com $R = 500$, no piso ($p \approx 0,15$), o EP da **diferença** entre duas células é $\sqrt{2 \times 0,15 \times 0,85 / 500} \times 100 \approx \pm 2,3$ pp. O limiar de 2 EP fica em **≈ 4,6 pp**.

| Desfecho em SD 0,30 e 0,45 | Leitura | Ação |
|:---|:---|:---|
| Inversões desaparecem ou caem abaixo de ~2,3 pp (1 EP) | **Ruído confirmado.** Curva verdadeira plana no piso, como o Achado A-3 prevê. | Encerrar o item como verificado. |
| Inversão persiste entre ~2,3 e ~4,6 pp | **Indeterminado.** Esperado se a curva verdadeira for plana: no piso, o sinal é ~0 e o ruído nunca zera. | Encerrar como "compatível com curva plana"; **não** declarar defeito. |
| Inversão persiste **acima de ~4,6 pp** (≥ 2 EP) e **com padrão sistemático** (mesmo sentido nas duas linhas de SD) | **Defeito.** Vá à seção 5. | Investigar antes de qualquer conclusão. |

**Seja honesto sobre o limite:** a inversão de SD 0,45 k36→k30 é hoje de 6,2 pp. Se ela reaparecer **com essa magnitude** a $R = 500$, cruza 2 EP e exige investigação. A de SD 0,30 (3,8 pp) cai na faixa indeterminada mesmo a $R = 500$ — e isso é propriedade do regime, não falha da corrida. Não force uma conclusão binária onde a resolução não existe.

---

## 5. Se for defeito — onde olhar, em ordem

Nada no gerador depende de `k`: cada polígono é construído de forma independente, e `grupos = np.repeat(np.arange(k), CELULAS_POR_POLIGONO)` é remontado corretamente a cada `k`. Portanto uma dependência verdadeira de `k` só pode vir da cobertura do IC ou de um erro de indexação. Verifique nesta ordem:

1. **Cobertura do bootstrap percentil por `k` (candidato principal).** O bootstrap percentil é conhecidamente anticonservador com poucos clusters. Se a cobertura real cair quando `k` cai, o IC fica estreito **relativo à variabilidade verdadeira da estatística** e `lo > 0` acontece mais vezes — exatamente o sentido das inversões observadas. Diagnóstico: medir a cobertura empírica sob vantagem média **zero** (`--vantagem-media 0.0`) em cada `k`; sob a nula, a taxa de `lo > 0` deve ficar em ~2,5% para todo `k`. Se subir conforme `k` cai, o mecanismo está identificado — e é propriedade conhecida do método, não bug do script. Note que a Tabela 2 mostra largura **absoluta** crescendo quando `k` cai; cobertura é outra grandeza, e é a que importa aqui.
2. **Saturação pelo `clip` em `scores_competidores`** (`poder_d25.py:196`): `np.clip(rho_base + rng.normal(0, sd_vantagem), 0.02, 0.95)`. Com SD 0,45 sobre `rho_base` 0,45, essa expressão satura nos dois extremos com frequência alta e comprime a vantagem de forma assimétrica. Isso **não** deveria depender de `k` — se depender, há erro.
3. **Polígonos sem variação**: o ramo `np.unique(yj).size < 3` gera scores aleatórios. A frequência depende da prevalência e de `sd_poligono`, não de `k`.
4. **Convergência de `score_com_rho`**: busca binária com `tol = 0.004`. Falha de convergência não deveria correlacionar com `k`.

Se o item 1 explicar o fenômeno, **não "conserte" o simulador**: registre o mecanismo e relate. Trocar bootstrap percentil por BCa ou por t-bootstrap é mudança de método, e método é do pesquisador (CLAUDE.md §2).

---

## 6. Dependências e ambiente

- `pip install -r scripts/d25/requirements.txt`
- **`scipy` é obrigatório** — o simulador aborta sem ele (não há caminho degradado, por desenho: Regra 1).
- Confira o ambiente antes da corrida longa: `python scripts/d25/poder_d25.py --replicas 5 --bootstrap 100 --sd-vantagem 0.30 --conferir`. A flag `--conferir` valida `spearman()` contra `scipy.spearmanr` e `diferenca_spearman()` contra a referência, com `assert` em $10^{-12}$.
- **No Windows, não use a flag `-I`** do Python.
- Versões aferidas neste ambiente: `scipy 1.18.1`, `numpy 2.5.3`.

---

## 7. Entregáveis

### 7.1 Saída bruta

Salve a saída completa de cada corrida em `docs/verificacoes/` com data e comando no cabeçalho (Regra 8: asserção de verificação exige arquivo físico de prova). Sugestão de nome: `verificacao_monotonicidade_poder_2026-11-03.md`.

### 7.2 Correções na nota de retificação

Em `docs/auditorias/RELATORIO_SIMULACAO_PODER_2026-11-03.md`, na Nota de Retificação sobre Monotonicidade:

- substituir a tabela de 4 inversões pela tabela de **6** da seção 2 deste prompt;
- substituir os Δ/EP pelos valores calculados com o **EP da diferença**, e trocar "dentro de ~1,6 EP" por "**nenhuma passa de 1,17 EP**";
- acrescentar o enquadramento de regime do Achado A-3 (teto / informativo / piso) e a evidência auxiliar da Tabela 2 (escala $1/\sqrt{k}$, média 1,198 contra teoria 1,2247);
- acrescentar o Achado A-4 (as inversões trocam de célula entre corridas; oscilação de 20,0 pp numa célula única), citando o arquivo de verificação `docs/verificacoes/verificacao_custo_e_ruido_poder_d25_2026-11-03.md`;
- corrigir a estimativa de custo conforme a seção 3: a nota justifica $R = 80$ com "~2,5 h para a grade expandida", mas a própria medição do relatório (2880 réplicas em ~12 min) projeta **~75 min** para a grade de 9 linhas a $R = 500$ — superestimativa de ~2×;
- registrar o desfecho da Tarefa A conforme o critério da seção 4.

**Preserve o texto original** e marque as mudanças como nota datada, como o P-3 fez. Não reescreva histórico documental.

### 7.3 `docs/planejamento/decisao/G-13.md`

Atualizar a nota de monotonicidade com o desfecho. Se a Tarefa B rodar, atualizar também o cruzamento de 80% e o intervalo [0,11; 0,13] com a precisão de $R = 500$, deixando claro o que mudou e o que não mudou.

### 7.4 Limite de alçada

Este prompt **não** autoriza mexer em `src/config/decisoes.ts`, em limiar, nem promover decisão a `"decidida"`. Se a corrida sugerir que algum número do registro deveria mudar: **registre e relate, não conserte** (CLAUDE.md §2).

---

## 8. Verificação pós-execução (obrigatória, CLAUDE.md §6)

```bash
npm run typecheck
npm test
npm test src/lib/seguranca/padroesProibidos.test.ts
```

Linha de base registrada na execução anterior: `tsc` com saída 0, 797 testes TS (3 ignorados), 55 testes Python, varredor de padrões proibidos 34/34. Relate qualquer desvio.

Observação de governança, para ciência do executor: `scripts/d25/` é **integralmente excluído** da varredura de padrões proibidos (`padroesProibidos.ts:526`). A varredura passar **não** atesta nada sobre o código dentro desse diretório. Alterações ali precisam de leitura humana.

---

## 9. Autorização de git

CLAUDE.md §1: nenhuma operação que altere o repositório remoto ou o histórico acontece sem autorização explícita do pesquisador, dada na conversa, para aquela operação. Autorização é específica e não se estende.

O preenchimento deste bloco é do pesquisador. **Quem redigiu este prompt não pode preenchê-lo.**

```
Commit autorizado:   [ ] sim   [ ] não        Data: ____/____/______
Push autorizado:     [ ] sim   [ ] não        Branch: _______________________
Assinatura: ______________________________
```

Sem este bloco preenchido: escreva os arquivos na árvore de trabalho, informe os caminhos completos ao pesquisador e **pare**. Se o Stop hook exigir commit ou push, relate em uma linha que ele está bloqueando e qual operação exige, e espere — a exigência do hook não é autorização.
