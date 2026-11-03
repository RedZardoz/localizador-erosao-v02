# Verificação — custo computacional e ruído do simulador de poder (D25)

**Data:** 03/11/2026
**Objeto:** aferição de custo por réplica de `scripts/d25/poder_d25.py` e medição do ruído de Monte Carlo no regime de piso (SD da vantagem ≥ 0,30).
**Motivo:** preparar `docs/planejamento/prompts/PROMPT_EXECUTOR_ATALHO_MONOTONICIDADE_2026-11-03.md` com custo medido em vez de estimado, e aferir se as inversões de monotonicidade registradas em `docs/auditorias/RELATORIO_SIMULACAO_PODER_2026-11-03.md` se reproduzem.
**Ambiente:** Linux, `scipy 1.18.1`, `numpy 2.5.3`. Semente padrão `20261103` em todas as corridas.

> **O que esta verificação NÃO sustenta.** Ela não mede poder estatístico para fins de decisão: 30 e 60 réplicas são insuficientes para isso, e é exatamente esse o ponto demonstrado abaixo. Não substitui a corrida de $R = 500$. Não autoriza alterar limiar, decisão ou metodologia. Não diz nada sobre o regime informativo (SD 0,10–0,20), que não foi rodado aqui. As corridas A e B usaram $B = 200$ e a corrida C usou $B = 100$; as tabelas de poder das seções 3 a 6 vêm de A e B, logo **não são diretamente comparáveis em bootstrap** à Tabela 1 oficial ($B = 100$) — o que elas sustentam é a instabilidade da ordenação entre corridas, não valores de poder.

---

## 1. Comandos executados

```bash
python3 scripts/d25/poder_d25.py --replicas 30 --bootstrap 200 --sd-vantagem 0.30 0.45
python3 scripts/d25/poder_d25.py --replicas 60 --bootstrap 200 --sd-vantagem 0.30 0.45
```

Tempo de parede medido com `date +%s` antes e depois de cada processo:

```bash
python3 scripts/d25/poder_d25.py --replicas 30 --bootstrap 100 --sd-vantagem 0.30 0.45
```

| Corrida | Réplicas | Bootstrap | Réplicas no laço de poder | Tempo de parede |
|:---|---:|---:|---:|---:|
| A | 30 | 200 | 240 | **251 s** |
| B | 60 | 200 | 480 | **488 s** |
| C | 30 | 100 | 240 | **162 s** |

A corrida C foi acrescentada ao se constatar que a corrida oficial do relatório usou $B = 100$, não $B = 200$ (relatório, linhas 66 e 69), de modo que o custo relevante para projetar a corrida de $R = 500$ é o de $B = 100$.

## 2. Modelo de custo

O preâmbulo do Item 5 escala com `max(60, réplicas // 3)`; em ambas as corridas isso resulta em 60, logo o preâmbulo é idêntico nas duas e se cancela na diferença:

- custo por réplica a $B = 200$: $(488 - 251)/240 = \mathbf{0{,}988\ \text{s}}$
- preâmbulo $= 251 - 237 = \mathbf{14\ \text{s}}$
- custo por réplica a $B = 100$: $(162 - 14)/240 = \mathbf{0{,}617\ \text{s}}$

O custo **não é linear em $B$**: a razão medida entre $B = 200$ e $B = 100$ é de **1,60**, não 2,00, porque há trabalho por réplica fora do laço de bootstrap (geração do alvo e dos scores competidores).

### Projeção, a $B = 100$ (o parâmetro da corrida oficial)

Não há flag que restrinja `k`: cada linha de SD roda a grade completa de 4 valores.

| Corrida | réplicas | neste contêiner | na máquina do executor |
|:---|---:|---:|---:|
| 2 linhas de SD a $R = 500$ | 4 000 | ~41 min | **~17 min** |
| grade de 9 linhas a $R = 500$ | 18 000 | ~3,1 h | **~75 min** |

A coluna da máquina do executor é calibrada pelo dado do próprio relatório: a grade de 9 linhas a $R = 80$, $B = 100$ (2880 réplicas) levou ~12 min, o que dá **0,250 s/réplica** — este contêiner é ~2,5× mais lento.

### Observação sobre a justificativa de custo da nota de retificação

A nota justifica a redução a $R = 80$ com "~2,5 h para a grade expandida". Esse número não se sustenta contra a medição relatada no mesmo documento: $12\ \text{min} \times (500/80) = 75\ \text{min}$ para a grade de 9 linhas a $R = 500$. A estimativa de 2,5 h superestima em cerca de 2× — e coincide, por acidente, com o custo dessa mesma grade num contêiner lento como este (3,1 h), não na máquina onde a corrida de fato rodou.

## 3. Tabelas de poder obtidas (saída bruta)

Corrida A — `--replicas 30`:

```
 SD vantagem        k=36        k=30        k=28        k=24
------------------------------------------------------------
        0.30       16.7%       26.7%       16.7%       10.0%
        0.45       13.3%       10.0%       13.3%       10.0%
```

Corrida B — `--replicas 60`:

```
 SD vantagem        k=36        k=30        k=28        k=24
------------------------------------------------------------
        0.30       21.7%        6.7%       11.7%       11.7%
        0.45       11.7%        6.7%       16.7%        6.7%
```

Para comparação, a corrida oficial registrada no relatório (`--replicas 80`):

```
        0.30       15.0%       18.8%       17.5%       15.0%
        0.45       10.0%       16.2%        8.8%       13.8%
```

## 4. Achado 1 — a localização das inversões não se reproduz

| Corrida | SD | valores (k=36, 30, 28, 24) | inversão em |
|:---|---:|:---|:---|
| R=30 | 0,30 | 16,7 / 26,7 / 16,7 / 10,0 | `k36→k30` |
| R=30 | 0,45 | 13,3 / 10,0 / 13,3 / 10,0 | `k30→k28` |
| R=60 | 0,30 | 21,7 / 6,7 / 11,7 / 11,7 | `k30→k28` |
| R=60 | 0,45 | 11,7 / 6,7 / 16,7 / 6,7 | `k30→k28` |
| R=80 | 0,30 | 15,0 / 18,8 / 17,5 / 15,0 | `k36→k30` |
| R=80 | 0,45 | 10,0 / 16,2 / 8,8 / 13,8 | `k36→k30`, `k28→k24` |

A inversão muda de célula a cada contagem de réplicas. **Um defeito algorítmico se fixaria na mesma célula; ruído passeia.** Este é o argumento empírico mais forte hoje disponível contra a hipótese de defeito.

## 5. Achado 2 — a oscilação de uma célula excede qualquer inversão registrada

Amplitude (máx − mín) da mesma célula entre as três corridas:

| Célula | R=30 | R=60 | R=80 | amplitude |
|:---|---:|---:|---:|---:|
| SD 0,30 k=36 | 16,7 | 21,7 | 15,0 | 6,7 pp |
| **SD 0,30 k=30** | **26,7** | **6,7** | **18,8** | **20,0 pp** |
| SD 0,30 k=28 | 16,7 | 11,7 | 17,5 | 5,8 pp |
| SD 0,30 k=24 | 10,0 | 11,7 | 15,0 | 5,0 pp |
| SD 0,45 k=36 | 13,3 | 11,7 | 10,0 | 3,3 pp |
| SD 0,45 k=30 | 10,0 | 6,7 | 16,2 | 9,5 pp |
| SD 0,45 k=28 | 13,3 | 16,7 | 8,8 | 7,9 pp |
| SD 0,45 k=24 | 10,0 | 6,7 | 13,8 | 7,1 pp |

A célula SD 0,30 / k=30 varia 20,0 pp entre corridas — **mais que a maior inversão da tabela oficial (6,2 pp)**. No regime de piso e com $R \le 80$, a ordenação entre células não é estimável.

## 6. Achado 3 — a largura do IC permanece bem comportada

Larguras médias do IC de 95% nas mesmas corridas:

```
Corrida A (R=30)                     Corrida B (R=60)
 SD      k=36    k=30    k=28  k=24    SD      k=36    k=30    k=28    k=24
0.30   0.1593  0.1821  0.1687 0.1873  0.30   0.1602  0.1748  0.1750  0.2014
0.45   0.1769  0.2085  0.2181 0.2327  0.45   0.1904  0.2107  0.2198  0.2372
```

Três das quatro linhas são monotônicas; a exceção é um recuo em `k=28` na corrida A (R=30), a de menor número de réplicas. A largura é média de grandeza contínua e por isso tem variância muito menor que o poder, que é indicador binário por réplica. O contraste entre a seção 4 (poder errático) e esta (largura estável) é a assinatura esperada de ruído de Monte Carlo no indicador, não de erro na maquinaria.

## 7. Conclusão

O custo da corrida de $R = 500$ nas duas linhas de SD alto, a $B = 100$, é de ~41 min neste contêiner e de **~17 min na máquina do executor**; a grade inteira de 9 linhas sai por **~75 min** nessa máquina, e não pelas ~2,5 h que a nota de retificação alega. As inversões de monotonicidade registradas no relatório **não se reproduzem em localização** entre contagens de réplicas, e a oscilação de célula única no regime de piso supera a magnitude de todas elas. Isso favorece fortemente a leitura de ruído amostral já adotada pela Nota de Retificação, sem encerrar formalmente o item, que exige a corrida de $R = 500$.
