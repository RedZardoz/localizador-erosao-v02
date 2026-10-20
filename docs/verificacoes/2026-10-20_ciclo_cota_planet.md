# Verificação do ciclo da cota Planet — conferência do instrumento de D17

**Data:** 20 de outubro de 2026
**Decisão conferida:** D17 — "Ciclo da cota Planet e alocação racional entre download e tiles"
**Instrumento:** Planet Labs Education & Research Basic, Plan ID 798565
**Prova arquivada:** `docs/verificacoes/planet/2026-10-20_planet_my_plan_insights.png`
**SHA-256:** `36e7516198551b9f547f40d531664900df5d65879851dacca43b7151fa270af0`
**Fonte da prova:** página *My plan and products* em `insights.planet.com/account/#/my-plan`, capturada pelo pesquisador.

---

## 1. Por que esta verificação existe

A própria D17 a pediu. A sua justificativa registra:

> *"O ciclo contratual efetivo deve ser confirmado na página do plano na conta Planet; a confirmação de ciclo mensal permite relaxar esta decisão sem qualquer alteração operacional."*

D17 foi tomada sob **incerteza declarada**, adotando a hipótese conservadora (cota total, não mensal) por ser segura sob as duas hipóteses, e nomeando o instrumento a conferir. Este documento é essa conferência.

---

## 2. O que a página mostra

| Produto | Cota disponível | Cota total | Válido até | Tipo |
|---|---|---|---|---|
| Education and Research Basic — Basemap tiles | 100.000 tile | 100.000 tile | 05/04/2028 | Planet Sensor Data |
| Education and Research Basic — Scene tiles | 100.000 tile | 100.000 tile | 05/04/2028 | Planet Sensor Data |
| Education and Research Basic — Scene downloads | 3.000 km² | **3.000 km²/month** | 05/04/2028 | Planet Sensor Data |

O rótulo da coluna *Total quota* para Scene downloads é literalmente **`3,000 km²/month`**.

A página também mostra um bloco **Trial** marcado `EXPIRED ON: APRIL 29, 2026` (3.000 monitoring credits por um mês, 1 OAuth client), e uma tabela de produtos ativos vazia (*"No active products"*). Os três produtos E&R acima aparecem na seção *My Products*, válidos até 2028.

---

## 3. Informado pelo pesquisador

- **Abertura da conta:** 31 de março de 2026.
- **Não há acúmulo** de cota entre ciclos mensais.

O Trial expirou 29 dias após a abertura, o que é coerente com a descrição *"3,000 for one month"* e confirma que ele é instrumento distinto dos produtos E&R.

---

## 4. Aritmética decorrente

| | |
|---|---|
| Vigência total (31/03/2026 → 05/04/2028) | 24,1 meses |
| Decorridos até 20/10/2026 | 6,6 meses |
| Restantes | 17,5 meses |

| Leitura | Orçamento |
|---|---|
| **D17, hipótese conservadora** — 3.000 km² para toda a vigência | 3.000 km² |
| **Instrumento conferido** — 3.000 km²/mês, sem acúmulo | **~52.500 km²** restantes |

A cota efetivamente disponível é cerca de **18 vezes** a planejada. Sem acúmulo, cerca de **19.900 km²** dos meses decorridos não foram usados e estão perdidos.

### Contra o dimensionamento de 27/09/2026 citado em D17

| Cenário | Consumo | % do teto **mensal** |
|---|---|---|
| 180 pontos em 1 data + 60 trios pré/pós evento | 75 km² | 2,5% |
| 180 pontos em 3 datas | 135 km² | 4,5% |

O desenho inteiro cabe em **um único mês** de cota, com folga, sem tocar nos 100.000 Scene tiles.

---

## 5. Conclusões

1. **A hipótese conservadora de D17 está superada pelo instrumento.** O ciclo é mensal.
2. **Nada operacional muda.** D17 previu exatamente isto: a confirmação "permite relaxar esta decisão sem qualquer alteração operacional". O consumo projetado é 4,5% de um mês.
3. **A natureza da restrição inverte**, sem passar a restringir: deixa de ser volume total e passa a ser teto mensal — e o teto mensal não é atingido nem por uma expansão de dez vezes no desenho.
4. **A separação tiles × km² de D17 permanece válida** e independe do ciclo: fotointerpretação consome Scene tiles, que não debitam km².
5. **Não há motivo para antecipar aquisições** a fim de "não perder cota". As cenas PlanetScope dos trios de evento são históricas: pedir imagem de 2026 em 2027 debita a cota de 2027. A data da cena é independente da data do pedido. Adquirir sem desenho definido contraria a Regra 4 e o próprio método.

---

## 6. O que NÃO foi confirmado

- **O dia exato do reset mensal.** Provavelmente ancorado na abertura (31/03), mas é dedução, não leitura da página.
- **Se o Trial expirado afeta os produtos E&R.** A página mostra *"No active products"* na tabela superior e os três produtos válidos até 2028 na inferior. A leitura de que são independentes é interpretação da tela, não declaração contratual lida.
- **Se OVERAGE está ligado ou desligado.** A justificativa de D17 menciona que, com overage desligado, a API rejeita a requisição ao esgotar a cota. Não consta desta captura; está em *Settings*.
- **Os termos contratuais do E&R Basic.** Não foram lidos. Esta verificação se apoia no painel da conta, que é o instrumento operacional, não no contrato integral.

Nenhuma das quatro lacunas altera as conclusões da seção 5: todas elas tratam de detalhe de borda, enquanto a conclusão central — a cota não é restrição efetiva — tem margem de duas ordens de grandeza.
