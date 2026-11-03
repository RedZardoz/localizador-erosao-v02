# Tarefa: acrescentar o desenho 12 × 6 ao material de decisão de G-01

**Versão:** 1.0 — 3 de novembro de 2026
**Base do trabalho:** `correcoes/contencao-2026-11-02`
**Origem:** §4 de [`AVALIACAO_DESENHO_SEQUENCIA_TAMANHO_AMOSTRAL_2026-11-03.md`](../../auditorias/DeepSeek/AVALIACAO_DESENHO_SEQUENCIA_TAMANHO_AMOSTRAL_2026-11-03.md), **verificado numericamente**
**Entregável:** `scripts/cenarios_g01.py` e [`docs/planejamento/decisao/G-01.md`](../decisao/G-01.md) com o cenário na mesa

> **Por que esta tarefa existe.** O material de decisão de `G-01` apresenta sete cenários, e **nenhum deles** preserva simultaneamente os 72 polígonos, os 36 clusters held-out e os 361,4 ha do desenho pré-registrado. A avaliação de 03/11 propôs um oitavo — **12 estratos × 6 polígonos** — que preserva os três. Verifiquei, e se confirma. O material de decisão está incompleto sem ele.

---

## 1. O cenário, e a verificação que já foi feita

Partindo do cenário `Op.3+` (K̂ agregado em Ŝ1 e Ŝ2), que dá **12 estratos** com `N_h` mínimo de **12**, a alocação de 6 polígonos por estrato — **3 treino + 3 held-out** — é viável. Verificação de 03/11/2026, com a tabela de ocupação lida do disco:

```
12 estratos, N_h = [12, 15, 17, 35, 36, 37, 48, 48, 49, 51, 52, 53]   min = 12
```

| Desenho | Estratos | Polígonos | Held-out | Área | `min(N_h)` | Viável | P(preencher \| 25%) |
|---|---:|---:|---:|---:|---:|---|---:|
| 18 × 4 (pré-registrado) | 18 | 72 | 36 | 361,4 ha | 0 | **não** | 0,0% |
| 12 × 4 (`Op.3+`, já na mesa) | 12 | 48 | 24 | 241,0 ha | 12 | sim | 100,0% |
| **12 × 6 (a acrescentar)** | **12** | **72** | **36** | **361,4 ha** | **12** | **sim** | **98,6%** |

**O que isso significa.** O 12 × 6 tem **o mesmo número de polígonos, o mesmo held-out, a mesma área e portanto o mesmo poder** do desenho pré-registrado — e, ao contrário dele, é executável. Sob 25% de recusa, o estrato mais frágil tem 98,6% de chance de preencher os 6 titulares, contra 0% do pré-registrado e 31,6% da opção 1 hoje recomendada.

**O custo, que precisa estar declarado com a mesma clareza:** perde-se o efeito principal de K̂ em Ŝ1 e em Ŝ2 — resta K̂ apenas em Ŝ3. É a mesma perda do `Op.3+`.

**O argumento que torna esse custo menor do que parece**, e que vale reproduzir no material de decisão: o desenho 18 × 4 **já não estima** o contraste por estrato, porque tem apenas **2 polígonos held-out por estrato**. Com 2 unidades não há variância intra-estrato utilizável. O 12 × 6 passa a **3 held-out por estrato**, o que é mais, não menos. A perda é de **número de células do fatorial**, não de precisão por célula.

---

## 2. Papel e limites

**Pode:** acrescentar o cenário ao script e à página de decisão, com a aritmética e o custo declarados.

**Não pode:** **recomendar** o 12 × 6 nem qualquer outro cenário — `G-01` é do pesquisador; alterar `src/config/decisoes.ts`; alterar o tipo do selo; mexer na tabela de ocupação de 31/10.

### Autorização de git — a ser preenchida pelo pesquisador

- [ ] `git commit` na branch ______________________
- [ ] `git push` na branch ______________________
- [ ] nenhuma das duas — escreva, relate os caminhos e pare

---

## 3. O que fazer em `scripts/cenarios_g01.py`

O script hoje supõe **4 polígonos por estrato** em constante global (`POLIGONOS_POR_ESTRATO = 4`), de modo que todos os cenários compartilham essa alocação.

**Faça:**

1. **Tornar a alocação um atributo do cenário**, não uma constante global. O `dataclass Cenario` ganha `poligonos_por_estrato: int = 4`, e `avaliar()` passa a usá-lo em lugar da constante — inclusive no cálculo de held-out (`poligonos_por_estrato // 2`), da área e da fragilidade a recusa, onde o número de **titulares** é o de polígonos por estrato.
2. **Acrescentar o cenário** `12 × 6`, com os mesmos colapsos do `Op.3+` e `poligonos_por_estrato=6`, com observação que declare o que preserva e o que perde.
3. **Conferir que os cenários existentes não mudam de número** — é o teste de que a refatoração foi neutra. Os valores de conferência estão na tabela do relatório de `P-D` e na página de `G-01`; o total de 677/453 continua sendo a trava de leitura da tabela.
4. **Verificar a fragilidade com 6 titulares**: `P(X >= 6 | N_h, p_recusa)`, não `P(X >= 4)`. É o que muda ao variar a alocação, e é onde um erro passaria sem ser notado.

**Cuidado:** a guarda de viabilidade deixa de ser `N_h >= 4` e passa a ser `N_h >= poligonos_por_estrato`. Um cenário com 6 por estrato exige `N_h >= 6`, e é por isso que ele só é viável sobre os 12 estratos agregados.

---

## 4. O que fazer em `docs/planejamento/decisao/G-01.md`

1. Acrescentar a linha do 12 × 6 à tabela de opções da §3, com todos os números.
2. Acrescentar ao texto das consequências uma quarta observação: **existe um desenho que preserva polígonos, held-out e área do pré-registrado e é executável** — o que muda o enquadramento da decisão, porque o trade-off deixa de ser "viabilidade **ou** poder".
3. Acrescentar à §5 (o que deixa de ser estimável) a linha do 12 × 6, com o argumento dos 3 held-out por estrato contra os 2 atuais.
4. Acrescentar à §7 a consequência para `G-13`: com 36 clusters, **o poder é o mesmo do pré-registrado**, de modo que a escolha entre 12 × 6 e as demais opções passa a ser sobre **contraste**, não sobre poder.

**Não altere** a §4 (impedimentos de lastro): o 12 × 6 **também usa agregação**, não colapso de Ê, e portanto **não depende de Cochran §5A.12**. Registre isso explicitamente — é uma diferença relevante, porque o 12 × 6 é executável **mesmo sem** `L-01` resolvido.

---

## 5. Testes de aceite

1. `python3 -I scripts/cenarios_g01.py` roda e a conferência 677/453 continua passando.
2. Os sete cenários originais produzem **exatamente** os mesmos números de antes da refatoração.
3. O cenário 12 × 6 reporta 12 estratos, 72 polígonos, 36 held-out, 361,4 ha, `min(N_h) = 12`, viável, e fragilidade de **98,6%** sob 25% de recusa.
4. Um cenário hipotético com `poligonos_por_estrato` maior que algum `N_h` é reportado como **não viável** — prova que a guarda acompanha a alocação.

---

## 6. Fora de escopo

1. **Não recomende** cenário algum.
2. **Não altere** a aritmética dos cenários existentes; se algum número mudar, é defeito da refatoração.
3. **Não toque** no tipo do selo (`totalPoligonosSorteados: 36 | 72`) — com 12 × 6 o total volta a 72 e o tipo o aceita, mas isso é coincidência e não resolve o bloqueio para 56, 60 ou 48. Registre a observação, não altere.
4. **Não altere** `decisoes.ts` nem a tabela de ocupação.
5. **Não abra** pull request.

---

## 7. Relatório

Grave em `docs/auditorias/RELATORIO_CENARIO_12X6_2026-11-XX.md`:

1. A saída completa do script, antes e depois da refatoração, lado a lado nos sete cenários originais.
2. Os números do 12 × 6, e a conferência da fragilidade com 6 titulares.
3. Confirmação de que o 12 × 6 **não** depende de Cochran, por usar agregação e não colapso.
4. A observação sobre o tipo do selo.
5. O que ficou pendente.

**Resposta final:** 5 a 10 linhas; a tabela com o cenário novo; a confirmação de neutralidade da refatoração; o que exige decisão do pesquisador.

**Fim do prompt.** Nenhuma decisão, parâmetro científico ou norma é alterado por este arquivo.
