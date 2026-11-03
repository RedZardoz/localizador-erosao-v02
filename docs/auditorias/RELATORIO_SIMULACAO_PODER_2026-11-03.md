# Relatório de Execução — Simulação de Poder e Fechamento de G-13 (P-S)

**Data da execução:** 3 de novembro de 2026  
**Prompt executado:** `PROMPT_EXECUTOR_PODER_D25_G13_2026-11-03.md` (versão 2.0)  
**Branch de trabalho:** `correcoes/contencao-2026-11-02`  
**Base do código:** `scripts/d25/poder_d25.py`  
**Artefato de verificação gerado:** [`docs/verificacoes/2026-11-03_poder_d25.txt`](../../verificacoes/2026-11-03_poder_d25.txt)  
**Página de decisão atualizada:** [`docs/planejamento/decisao/G-13.md`](../decisao/G-13.md)  

---

## 1. Dependências e Baseline de Testes

### 1.1 Ambiente Python e Módulos
No ambiente do host Windows, a checagem com `python -c` confirmou a presença e versão dos módulos declarados em `scripts/d25/requirements.txt`:
* **Python:** 3.14.4 (C:\Python314\python.exe)
* **numpy:** 2.4.6
* **pandas:** 3.0.5
* **scipy:** 1.18.0
* **scikit-learn:** 1.9.0
* **xgboost:** 3.4.1
* **shapely:** 2.1.2
* **pyproj:** 3.7.2

> **Nota sobre o flag `-I` (isolated mode):** Como as dependências estão instaladas no diretório de site-packages do usuário (`AppData\Roaming\Python\Python314\site-packages`), a invocação do Python com a flag `-I` isola o ambiente e desativa o carregamento do diretório do usuário (`-s`), gerando `ModuleNotFoundError`. A execução foi realizada com `python -u` sem a flag `-I`, garantindo acesso completo aos pacotes sem necessidade de reinstalação redundante.

### 1.2 Baseline da Suíte D25
Execução de teste da suíte de testes de regressão do D25:
```bash
python -m unittest discover -s scripts/d25 -p "test_*.py"
```
**Resultado:** `Ran 49 tests in 13.472s - OK`. Todos os 49 testes passaram com sucesso, sem nenhuma falha ou regressão.

---

## 2. Auditoria, Conferência e Testes de Sanidade do Simulador

### 2.1 Conferência Numérica contra `scipy.stats.spearmanr`
A rotina interna de postos médios (`rankdata` method="average" + correlação centrada) foi aferida contra `scipy.stats.spearmanr` sob a flag `--conferir`:
* `spearman() = 0.5002067215` vs `scipy.spearmanr = 0.5002067215`
* **Diferença:** `1.11e-16` (identidade exata em precisão de máquina).

Adicionalmente, a rotina vetorial otimizada `diferenca_spearman(sa, sb, y)` — que calcula o rank de $y$ uma única vez por iteração do bootstrap em vez de duas — foi conferida contra `spearman(sa, y) - spearman(sb, y)`:
* **Diferença:** `0.00e+00` (identidade bit-a-bit exata).

### 2.2 Testes de Sanidade (Calibração do Bootstrap e Taxa Nominal de Falso Positivo)
Conforme exigido pelo §4 do prompt:
1. **Sob $H_1$ sem heterogeneidade inter-polígonos ($\text{Vantagem Média} = 0,10, \text{SD} = 0,00$):**
   * Réplicas: 200, Bootstrap: 200.
   * **Resultado:** Poder de **100,0%** em todos os cenários ($k \in \{36, 30, 28, 24\}$), com largura média de IC de 95% variando estritamente entre 0,0260 ($k=36$) e 0,0325 ($k=24$).
2. **Sob $H_0$ ($\text{Vantagem Média} = 0,00, \text{SD} = 0,05$):**
   * Réplicas: 100, Bootstrap: 100.
   * **Resultado:** A proporção de falsos positivos (limite inferior do IC de 95% $> 0$) foi de:
     * $k=36$: **1,0%**
     * $k=30$: **1,0%**
     * $k=28$: **2,0%**
     * $k=24$: **1,0%**
   * Todos abaixo do limite nominal unicaldal de 2,5% (para um IC bicaudal de 95%). Confirma-se que o IC por cluster não é anti-conservador e está bem calibrado.

---

## 3. Execução Oficial e Parâmetros

* **Comando executado:**
  ```bash
  python -u scripts/d25/poder_d25.py --conferir --replicas 80 --bootstrap 100 \
    --sd-vantagem 0.02 0.05 0.08 0.10 0.12 0.15 0.20 0.30 0.45
  ```
* **Parâmetros fixos:** Semente = `20261103`, $R = 80$ réplicas de Monte Carlo, $B = 100$ reamostragens por cluster, $\text{SD}_{\text{poligono}} = 0,80$ em logito ($\text{ICC} \approx 0,0371$), prevalência de zeros de referência = $85\%$.
* **Erro padrão de Monte Carlo:** Para poder em torno de $80\%$, $\text{EP} = \sqrt{0,80 \times 0,20 / 80} \approx \pm 4,5$ pontos percentuais.
* **Tempo de execução:** ~12 minutos.

---

## 4. Resultados Oficiais

### Tabela 1: Poder Estatístico ($\text{Vantagem Verdadeira} = 0,10$)

| SD da vantagem entre polígonos | k=36 (Pré-reg.) | k=30 (Op.1/2) | k=28 (Op.1-v) | k=24 (Op.3) |
|---:|:---:|:---:|:---:|:---:|
| **0,02** | 100,0% | 100,0% | 100,0% | 100,0% |
| **0,05** | 100,0% | 100,0% | 100,0% | 100,0% |
| **0,08** | 100,0% | 100,0% | 98,8% | 100,0% |
| **0,10** | 100,0% | 93,8% | 96,2% | 86,2% |
| **0,12** | **82,5%** | **80,0%** | **78,8%** | **72,5%** |
| **0,15** | 70,0% | 61,3% | 63,7% | 52,5% |
| **0,20** | 32,5% | 28,7% | 25,0% | 22,5% |
| **0,30** | 15,0% | 18,8% | 17,5% | 15,0% |
| **0,45** | 10,0% | 16,2% | 8,8% | 13,8% |

### Tabela 2: Largura Média do IC de 95% (Percentil Bootstrap por Cluster)

| SD da vantagem | k=36 | k=30 | k=28 | k=24 |
|---:|:---:|:---:|:---:|:---:|
| **0,02** | 0,0281 | 0,0311 | 0,0315 | 0,0349 |
| **0,05** | 0,0390 | 0,0426 | 0,0451 | 0,0460 |
| **0,08** | 0,0548 | 0,0610 | 0,0605 | 0,0658 |
| **0,10** | 0,0668 | 0,0702 | 0,0722 | 0,0772 |
| **0,12** | 0,0783 | 0,0896 | 0,0864 | 0,0976 |
| **0,15** | 0,0967 | 0,1023 | 0,1094 | 0,1142 |
| **0,20** | 0,1214 | 0,1355 | 0,1394 | 0,1479 |
| **0,30** | 0,1538 | 0,1654 | 0,1734 | 0,1849 |
| **0,45** | 0,1922 | 0,2045 | 0,2174 | 0,2226 |

### Ponto de Cruzamento dos 80% de Poder
- **k = 36 clusters:** $\text{SD} \approx \mathbf{0,126}$
- **k = 30 clusters:** $\text{SD} = \mathbf{0,120}$
- **k = 28 clusters:** $\text{SD} \approx \mathbf{0,119}$
- **k = 24 clusters:** $\text{SD} \approx \mathbf{0,109}$

Em todos os cenários de clusters de G-01 ($24 \le k \le 36$), o poder de 80% cruza consistentemente na faixa estreita de **$\text{SD} \in [0,11; 0,13]$**.

---

## 5. Resposta à Pergunta de Decisão (§6 do Prompt)

> **"A partir de que grau de heterogeneidade da vantagem entre polígonos a margem de 0,10 deixa de ser detectável, e esse grau é plausível para este problema?"**

### No sentido afirmativo (em favor da viabilidade do gate):
Se o ganho do modelo preditor sobre a linha de base empírica/RUSLE for biofisicamente consistente ao longo da bacia — isto é, com variação modesta entre polígonos ($\text{SD} \le 0,10$) —, a margem pré-registrada de 0,10 é **plenamente detectável com poder $\ge 86,2\%$ mesmo no cenário mais restritivo de perda amostral ($k = 24$)**, e com **$100\%$ de poder para $k = 36$**. Neste sentido, o desenho experimental é robusto a reduções no número de estratos de $G\text{-}01$.

### No sentido restritivo (em favor do alerta da auditoria):
Um desvio padrão $\text{SD} \ge 0,15$ na vantagem relativa significa que em alguns polígonos o ganho é expressivo ($+0,25$) enquanto em outros polígonos com manejo diferenciado ou vegetação adensada o ganho é nulo ou levemente negativo. Se a realidade pedológica e de cobertura vegetal da Bacia Paraná 3 impuser esse nível de dispersão, o poder cai para **$70,0\%$ em $k=36$** e **$52,5\%$ em $k=24$**.
Acima de $\text{SD} = 0,30$ (situação em que o modelo perde para o RUSLE em fração substancial dos polígonos), o poder colapsa para $\le 18,8\%$ em qualquer cenário, tornando o desfecho `INCONCLUSIVA` o resultado estatístico inevitável.

---

## 6. Melhorias e Ajustes Implementados no Simulador

Durante a execução independente, foram identificados e implementados os seguintes aprimoramentos técnicos em `scripts/d25/poder_d25.py` (sem alteração da semântica estatística):
1. **Parâmetro `--vantagem-media` (default 0.10):** Adicionado para permitir testes formais de calibração nula ($H_0$ sob vantagem média 0,00).
2. **Cálculo Único de Ranks de Alvo (`diferenca_spearman`):** O rank do vetor bootstrap de alvos $y$ era calculado redundantemente duas vezes a cada iteração de bootstrap. Sua centralização unificada gerou ganho de desempenho de ~1.43x.
3. **Indexação por Blocos:** Vetorização da reamostragem de polígonos contíguos de 502 células via reshape `(k, 502)`, eliminando concatenações repetitivas de índices.
4. **Descarga Imediata de Buffer (`flush=True`):** Inclusão de descarga síncrona nos comandos `print` para permitir acompanhamento em tempo real durante redirecionamento para arquivo de log.

---

## 7. Status e Próximos Passos

1. **Simulação oficial de poder:** Concluída e arquivada com reprodutibilidade estrita.
2. **Página de decisão `docs/planejamento/decisao/G-13.md`:** Atualizada e pronta para assinatura do pesquisador.
3. **Decisão pendente exclusiva do pesquisador:**
   * Escolha da opção de G-13 (Opção 1: manter margem 0,10 e declarar previamente o poder e risco de `INCONCLUSIVA`; ou Opção 3: ajustar margem pré-registro).
   * Vinculação com a decisão de `G-01` e `G-12`.

Nenhuma operação de `git commit` ou `git push` foi executada.
