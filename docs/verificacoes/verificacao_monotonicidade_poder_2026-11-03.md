# Verificação — Monotonicidade do Simulador de Poder a 500 Réplicas (Tarefa A / P-4)

**Data:** 03/11/2026  
**Comando executado:**
```bash
python -u scripts/d25/poder_d25.py --replicas 500 --bootstrap 100 --sd-vantagem 0.30 0.45
```
**Semente padrão:** `20261103`  
**Ambiente:** Windows (host), Python 3.14.4, numpy 2.4.6, scipy 1.18.0  
**Origem:** Prompt P-4 (`docs/planejamento/prompts/PROMPT_EXECUTOR_ATALHO_MONOTONICIDADE_2026-11-03.md`), Tarefa A  
**Objetivo:** Verificar formalmente a hipótese de ruído de Monte Carlo vs. defeito algorítmico nas linhas de piso de poder (SD 0,30 e 0,45), sob $R = 500$ réplicas e $B = 100$ bootstraps.

---

## 1. Saída Bruta da Execução Oficial

```text
====================================================================================
SIMULACAO DE PODER E DE ESCALA DA MARGEM — D25
NAO E RESULTADO CIENTIFICO: nao existe dado de desfecho neste projeto.
====================================================================================
Empates: ranks medios (scipy rankdata 'average'), o padrao de spearmanr.
Celulas por poligono: 502 | margem pre-registrada: 0.1
Monte Carlo: 500 replicas | bootstrap por cluster: 100
Semente: 20261103 | Spearman do competidor: 0.45
Efeito de poligono: SD 0.8 em logito | ICC implicito por D24: 0.0371 (~25.6 unidades efetivas/poligono)

------------------------------------------------------------------------------------
ITEM 5 / N-03 — A MARGEM DE 0,10 TEM A MESMA ESCALA EM QUALQUER PREVALENCIA?
------------------------------------------------------------------------------------
  zeros   teto Spearman   SD da nula  |dif| 97,5%  0,10 em SD  0,10/teto
------------------------------------------------------------------------
    50%          0.9453      0.01004      0.02134        10.0      0.106
    70%          0.8285      0.01006      0.02097         9.9      0.121
    85%          0.6327      0.01044      0.02367         9.6      0.158
    95%          0.4144      0.01027      0.02191         9.7      0.241

Teto varia de 0.4144 a 0.9453  (razao 2.28x)
SD da nula varia de 0.01004 a 0.01044  (razao 1.04x)

Leitura: 0,10 expresso em desvios da nula e em fracao do teto NAO e constante entre
prevalencias. A prevalencia de zeros so sera conhecida depois do primeiro voo.

------------------------------------------------------------------------------------
ITEM 4 / N-04 — PODER POR NUMERO DE CLUSTERS (diferenca verdadeira = 0,10)
------------------------------------------------------------------------------------
 clusterscenario G-01                             poder   IC medio   largura
------------------------------------------------------------------------------
Vantagem media verdadeira = 0.10. O poder depende criticamente de quanto essa
vantagem VARIA entre poligonos, que e quantidade desconhecida antes do voo.

 SD vantagem        k=36        k=30        k=28        k=24
------------------------------------------------------------
        0.30       19.8%       18.2%       14.2%       11.6%
        0.45       13.6%       11.8%       11.8%       11.6%

Largura media do IC de 95%:
 SD vantagem        k=36        k=30        k=28        k=24
------------------------------------------------------------
        0.30      0.1571      0.1740      0.1786      0.1894
        0.45      0.1877      0.2067      0.2113      0.2278

Prevalencia de zeros usada: 85%. O poder tambem depende dela — Item 5.
Poder = fracao de replicas em que o limite inferior do IC de 95% por cluster excede 0.

Cenarios de G-01, por numero de clusters held-out:
  k=36  pre-registrado, 18 estratos
  k=30  Op.1 / Op.2 pura / Op.3-S1, 15 estratos
  k=28  Op.1-v / Op.2+colapso, 14 estratos
  k=24  Op.3 em S1 e S2, 12 estratos

------------------------------------------------------------------------------------
O que esta simulacao NAO faz
------------------------------------------------------------------------------------
- Nao usa dado real: nao existe desfecho neste projeto.
- Nao modela autocorrelacao espacial ENTRE poligonos (V-02), so o agrupamento dentro.
- Nao recomenda margem, metrica nem desenho. G-12 e G-13 sao do pesquisador.
```

---

## 2. Confronto com a Corrida Oficial ($R = 80$) e Avaliação dos Critérios

### 2.1 Comparação das Estimativas de Poder

| SD vantagem | Métrica | k=36 | k=30 | k=28 | k=24 | Inversões observadas |
|---:|:---|:---:|:---:|:---:|:---:|:---|
| **0,30** | $R=80$ (oficial) | 15,0% | 18,8% | 17,5% | 15,0% | Inversão em $k=36 \to 30$ (+3,8 pp) |
| **0,30** | **$R=500$ (esta corrida)** | **19,8%** | **18,2%** | **14,2%** | **11,6%** | **NENHUMA (estritamente monotônica)** |
| **0,45** | $R=80$ (oficial) | 10,0% | 16,2% | 8,8% | 13,8% | Inversões em $k=36 \to 30$ (+6,2 pp) e $k=28 \to 24$ (+5,0 pp) |
| **0,45** | **$R=500$ (esta corrida)** | **13,6%** | **11,8%** | **11,8%** | **11,6%** | **NENHUMA (fracamente monotônica / não-crescente)** |

### 2.2 Comparação da Largura Média do IC de 95%

| SD vantagem | Corrida | k=36 | k=30 | k=28 | k=24 | Monotônica? |
|---:|:---|:---:|:---:|:---:|:---:|:---:|
| **0,30** | $R=500$ | 0,1571 | 0,1740 | 0,1786 | 0,1894 | **Sim (estritamente crescente)** |
| **0,45** | $R=500$ | 0,1877 | 0,2067 | 0,2113 | 0,2278 | **Sim (estritamente crescente)** |

Razão de largura média $k=24 / k=36$:
- Em SD 0,30: $0,1894 / 0,1571 = 1,2056$
- Em SD 0,45: $0,2278 / 0,1877 = 1,2136$
- Valor teórico da escala por cluster: $\sqrt{36/24} = 1,2247$. O desvio contra a teoria é de apenas $-1,5\%$ e $-0,9\%$, confirmando escala $1/\sqrt{k}$ precisa.

---

## 3. Aplicação do Critério de Decisão Pré-Fixado (§4 do Prompt P-4)

O critério de decisão estabelecia:
1. *Inversões desaparecem ou caem abaixo de ~2,3 pp (1 EP):* **Ruído confirmado.** Curva verdadeira plana no piso, compatível com o Achado A-3. Encerrar o item como verificado.
2. *Inversão persiste entre ~2,3 e ~4,6 pp:* Indeterminado (curva plana).
3. *Inversão persiste acima de ~4,6 pp com padrão sistemático:* Defeito.

**Resultado:**
- Sob $R = 500$, **todas as inversões que existiam em $R = 80$ desapareceram por completo**.
- Em SD 0,30, a curva é estritamente decrescente com a redução de $k$: $19,8\% > 18,2\% > 14,2\% > 11,6\%$.
- Em SD 0,45, a curva é não-crescente: $13,6\% > 11,8\% = 11,8\% > 11,6\%$.
- Não subsiste nenhuma inversão positiva.

## 4. Conclusão

A hipótese de defeito algorítmico no simulador `scripts/d25/poder_d25.py` está **definitivamente refutada**. As inversões observadas na Tabela 1 oficial com $R = 80$ réplicas decorriam exclusivamente do ruído de amostragem de Monte Carlo em regime de piso de poder ($\le 1,17\text{ EP}$ da diferença entre proporções independentes). O item de monotonicidade está formalmente encerrado e comprovado.
