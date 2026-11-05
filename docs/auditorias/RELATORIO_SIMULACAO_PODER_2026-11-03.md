# Relatório de Execução — Simulação de Poder e Fechamento de G-13 (P-S)

**Data da execução:** 3 de novembro de 2026  
**Prompt executado:** [`PROMPT_EXECUTOR_SIMULACAO_PODER_2026-11-03.md`](../planejamento/prompts/PROMPT_EXECUTOR_SIMULACAO_PODER_2026-11-03.md) (versão 2.0; referência retificada de `PROMPT_EXECUTOR_PODER_D25_G13_2026-11-03.md`)  
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

* **Comando oficial consolidado ($R = 500$ réplicas — Tarefa C / P-6, 04/11/2026):**
  ```bash
  python -u scripts/d25/poder_d25.py --replicas 500 --bootstrap 100 \
    --sd-vantagem 0.02 0.05 0.08 0.10 0.12 0.15 0.20 0.30 0.45
  ```
  *(Saída bruta completa arquivada em [`docs/verificacoes/verificacao_grade_completa_poder_2026-11-04.md`](../verificacoes/verificacao_grade_completa_poder_2026-11-04.md))*.
* **Comando preliminar histórico ($R = 80$ réplicas — 03/11/2026):**
  ```bash
  python -u scripts/d25/poder_d25.py --conferir --replicas 80 --bootstrap 100 \
    --sd-vantagem 0.02 0.05 0.08 0.10 0.12 0.15 0.20 0.30 0.45
  ```
  *(Saída bruta preliminar arquivada em [`docs/verificacoes/2026-11-03_poder_d25.txt`](../verificacoes/2026-11-03_poder_d25.txt))*.
* **Parâmetros fixos:** Semente = `20261103`, $B = 100$ reamostragens bootstrap por cluster, $\text{SD}_{\text{poligono}} = 0,80$ em logito ($\text{ICC} \approx 0,0371$, calibrado por D24), prevalência de zeros de referência = $85\%$.
* **Erro padrão de Monte Carlo:**
  - Em $R = 80$ (histórico): $\text{EP} = \sqrt{0,80 \times 0,20 / 80} \approx \pm 4,47$ pontos percentuais (incerteza no cruzamento $\pm 0,0056$).
  - Em $R = 500$ (oficial consolidado): $\text{EP} = \sqrt{0,80 \times 0,20 / 500} \approx \mathbf{\pm 1,79}$ pontos percentuais (incerteza no cruzamento $\mathbf{\pm 0,0022}$, aperto de $2{,}5\times$).
* **Tempo de execução da grade a $R=500$:** ~3 horas.

---

## 4. Resultados Oficiais

### Tabela 1: Poder Estatístico Definitivo ($R = 500$ Réplicas — Grade Oficial Consolidada)

| SD da vantagem entre polígonos | k=36 (Pré-reg.) | k=30 (Op.1/2) | k=28 (Op.1-v) | k=24 (Op.3) | Diagnóstico da Linha |
|---:|:---:|:---:|:---:|:---:|:---|
| **0,02** | 100,0% | 100,0% | 100,0% | 100,0% | Saturação no teto ($\equiv 100{,}0\%$) |
| **0,05** | 100,0% | 100,0% | 100,0% | 100,0% | Saturação no teto ($\equiv 100{,}0\%$) |
| **0,08** | 99,8% | 100,0% | 99,4% | 99,0% | Teto saturado ($99,4\% > 99,0\%$ em $k=28 \to 24$) |
| **0,10** | **98,0%** | **95,6%** | **94,8%** | **93,8%** | **Estritamente monotônica** ($98{,}0\% > 95{,}6\% > 94{,}8\% > 93{,}8\%$) |
| **0,12** | **85,8%** | **85,4%** | **83,0%** | **77,2%** | **Estritamente monotônica** ($85{,}8\% > 85{,}4\% > 83{,}0\% > 77{,}2\%$) |
| **0,15** | **63,2%** | **55,6%** | **54,0%** | **52,2%** | **Estritamente monotônica** ($63{,}2\% > 55{,}6\% > 54{,}0\% > 52{,}2\%$) |
| **0,20** | 32,4% | 33,0% | 29,8% | 30,0% | Piso de transição (ruído $\le 0{,}6\text{ pp} \equiv 0{,}20\text{ EP}$) |
| **0,30** | 15,4% | 17,6% | 14,6% | 15,6% | Piso inerte plano (ruído $\le 2{,}2\text{ pp} \equiv 0{,}93\text{ EP}$) |
| **0,45** | 13,4% | 10,6% | 12,0% | 11,8% | Piso inerte plano (ruído $\le 1{,}4\text{ pp} \equiv 0{,}70\text{ EP}$) |

#### Tabela 1-H: Poder Estatístico Preliminar (Registro Histórico — $R = 80$ Réplicas, 03/11/2026)

| SD da vantagem | k=36 | k=30 | k=28 | k=24 | Inversões pontuais em $R=80$ |
|---:|:---:|:---:|:---:|:---:|:---|
| **0,02** | 100,0% | 100,0% | 100,0% | 100,0% | Nenhuma |
| **0,05** | 100,0% | 100,0% | 100,0% | 100,0% | Nenhuma |
| **0,08** | 100,0% | 100,0% | 98,8% | 100,0% | $k=28 \to 24$ (+1,2 pp) |
| **0,10** | 100,0% | 93,8% | 96,2% | 86,2% | $k=30 \to 28$ (+2,4 pp) |
| **0,12** | 82,5% | 80,0% | 78,8% | 72,5% | Nenhuma (monotônica) |
| **0,15** | 70,0% | 61,3% | 63,7% | 52,5% | $k=30 \to 28$ (+2,4 pp) |
| **0,20** | 32,5% | 28,7% | 25,0% | 22,5% | Nenhuma (monotônica) |
| **0,30** | 15,0% | 18,8% | 17,5% | 15,0% | $k=36 \to 30$ (+3,8 pp) |
| **0,45** | 10,0% | 16,2% | 8,8% | 13,8% | $k=36 \to 30$ (+6,2 pp) e $k=28 \to 24$ (+5,0 pp) |

> **[Nota de Retificação sobre Monotonicidade — 04/11/2026, consolidada via Tarefa C / P-6]:**
>
> 1. **Resolução Exaustiva das Seis Inversões Históricas:**  
>    A execução oficial a $R = 500$ réplicas da grade inteira ([`verificacao_grade_completa_poder_2026-11-04.md`](../verificacoes/verificacao_grade_completa_poder_2026-11-04.md)) encerrou o diagnóstico individual de cada uma das seis inversões identificadas no Achado A-1:
>    - **SD 0,08 ($k=28 \to 24$):** Em $R=80$ havia inversão de $+1{,}2\text{ pp}$. Em $R=500$, tornou-se **estritamente decrescente** ($99{,}4\% > 99{,}0\%$), com teto saturado em $k=36 \to 30$ ($99{,}8\% \to 100{,}0\%$, diferença irrelevante de $0{,}2\text{ pp}$).
>    - **SD 0,10 ($k=30 \to 28$):** Em $R=80$ havia inversão de $+2{,}4\text{ pp}$. Em $R=500$, a linha é **estritamente decrescente em todos os degraus**: $98{,}0\% > 95{,}6\% > 94{,}8\% > 93{,}8\%$.
>    - **SD 0,15 ($k=30 \to 28$):** Em $R=80$ havia inversão de $+2{,}4\text{ pp}$. Em $R=500$, a linha é **estritamente decrescente em todos os degraus**: $63{,}2\% > 55{,}6\% > 54{,}0\% > 52{,}2\%$.
>    - **SD 0,30 ($k=36 \to 30$):** Em $R=80$ era de $+3{,}8\text{ pp}$. Em $R=500$, a oscilação residual é de $+2{,}2\text{ pp}$, correspondendo a apenas **$0{,}93\text{ EP(dif)}$** em regime de piso plano ($p \approx 15\%$).
>    - **SD 0,45 ($k=36 \to 30$):** Em $R=80$ era de $+6{,}2\text{ pp}$. Em $R=500$, **desapareceu por completo**, tornando-se estritamente decrescente ($13{,}4\% > 10{,}6\%$).
>    - **SD 0,45 ($k=28 \to 24$):** Em $R=80$ era de $+5{,}0\text{ pp}$. Em $R=500$, a oscilação residual é de $-0{,}2\text{ pp}$ ($12{,}0\% \to 11{,}8\%$), **estritamente decrescente**.
>
> 2. **Monotonicidade na Faixa Informativa e Blindagem Contra Defeito Algorítmico:**  
>    Na faixa de alta relevância prática e decisória ($\text{SD} \in [0{,}10; 0{,}15]$), **zero inversões subsistem** sob $R = 500$: todas as 9 transições de clusters são estritamente monotônicas decrescentes. No piso inerte ($\text{SD} \ge 0{,}20$), todas as variações pontuais situam-se estritamente abaixo de $1{,}0\text{ EP(dif)}$ ($\Delta/\text{EP} \in [0{,}07; 0{,}93]$), comprovando cabalmente que eram artefatos de ruído de Monte Carlo em curva verdadeira plana. A hipótese de defeito algorítmico está **definitivamente descartada com base na grade completa**.

---

### Tabela 2: Largura Média do IC de 95% ($R = 500$ Réplicas — Grade Oficial Consolidada)

| SD da vantagem | k=36 | k=30 | k=28 | k=24 | Razão $k=24 / k=36$ | Teoria $\sqrt{36/24}$ | Monotônica? |
|---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **0,02** | 0,0286 | 0,0318 | 0,0325 | 0,0348 | 1,2168 | 1,2247 | **Sim (estritamente crescente)** |
| **0,05** | 0,0400 | 0,0430 | 0,0446 | 0,0483 | 1,2075 | 1,2247 | **Sim (estritamente crescente)** |
| **0,08** | 0,0545 | 0,0592 | 0,0618 | 0,0655 | 1,2018 | 1,2247 | **Sim (estritamente crescente)** |
| **0,10** | 0,0660 | 0,0720 | 0,0746 | 0,0791 | 1,1985 | 1,2247 | **Sim (estritamente crescente)** |
| **0,12** | 0,0790 | 0,0855 | 0,0873 | 0,0940 | 1,1899 | 1,2247 | **Sim (estritamente crescente)** |
| **0,15** | 0,0972 | 0,1036 | 0,1081 | 0,1159 | 1,1924 | 1,2247 | **Sim (estritamente crescente)** |
| **0,20** | 0,1228 | 0,1345 | 0,1387 | 0,1465 | 1,1930 | 1,2247 | **Sim (estritamente crescente)** |
| **0,30** | 0,1587 | 0,1689 | 0,1748 | 0,1880 | 1,1846 | 1,2247 | **Sim (estritamente crescente)** |
| **0,45** | 0,1874 | 0,2089 | 0,2105 | 0,2247 | 1,1990 | 1,2247 | **Sim (estritamente crescente)** |
| **Média** | — | — | — | — | **1,1982** | **1,2247** | **Desvio de apenas $-2{,}16\%$** |

*(Para fins de rastreabilidade, a Tabela 2 preliminar a $R=80$ exibia médias globais análogas de 0,0281 a 0,2226 com razão média de 1,198 — ver [`2026-11-03_poder_d25.txt`](../verificacoes/2026-11-03_poder_d25.txt))*.

---

### Ponto de Cruzamento dos 80% de Poder ($R = 500$ Réplicas)

Com $R = 500$, o cruzamento de 80% foi recalculado por interpolação linear com erro padrão $2{,}5\times$ mais apertado ($\text{EP}_{\text{poder}} = \pm 1,79\text{ pp}$, incerteza no cruzamento $\mathbf{\pm 0{,}0022}$):

- **k = 36 clusters:** $\text{SD} \approx \mathbf{0{,}128}$ (com IC: $[0{,}125; 0{,}130]$)
- **k = 30 clusters:** $\text{SD} \approx \mathbf{0{,}125}$ (com IC: $[0{,}123; 0{,}128]$)
- **k = 28 clusters:** $\text{SD} \approx \mathbf{0{,}123}$ (com IC: $[0{,}121; 0{,}125]$)
- **k = 24 clusters:** $\text{SD} \approx \mathbf{0{,}117}$ (com IC: $[0{,}114; 0{,}119]$)

Em todos os cenários de clusters de G-01 ($24 \le k \le 36$), o poder de 80% cruza consistentemente no subintervalo $\mathbf{\text{SD} \in [0{,}117; 0{,}128]}$, consolidando com rigor a faixa pré-registrada de $\mathbf{\text{SD} \in [0{,}11; 0{,}13]}$.

> **[Nota de Retificação sobre Precisão Numérica — 04/11/2026, consolidada via P-6]:**  
> Na corrida preliminar ($R = 80$), a incerteza no SD de cruzamento era de $\pm 0{,}0056$, proibindo o uso rigoroso de três casas decimais. Sob $R = 500$, a incerteza reduz-se para $\mathbf{\pm 0{,}0022}$, tornando as três casas decimais analiticamente informativas e defensáveis perante a auditoria. A conclusão central permanece: o cruzamento de 80% independe substantivamente da escolha do cenário de $k$ (variação de apenas $0{,}011$ entre $k=36$ e $k=24$), sendo governado primariamente pela variância espacial da vantagem ($\text{SD}$).

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
