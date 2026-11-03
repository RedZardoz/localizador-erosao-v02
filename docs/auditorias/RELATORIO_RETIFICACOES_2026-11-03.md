# Relatório de Execução — Retificação de Afirmações Desatualizadas (P-3)

**Data:** 3 de novembro de 2026  
**Prompt executado:** [`PROMPT_EXECUTOR_RETIFICACOES_2026-11-03.md`](../planejamento/prompts/PROMPT_EXECUTOR_RETIFICACOES_2026-11-03.md)  
**Branch:** `correcoes/contencao-2026-11-02`  
**Natureza:** Estritamente documental. Nenhuma linha de código, parâmetro científico, regra ou decisão em `decisoes.ts` foi alterada.

> **Princípio aplicado:** O texto original de avaliação de terceiro em `docs/auditorias/DeepSeek/` foi integralmente preservado, acrescido exclusivamente de notas explícitas de retificação e esclarecimento contextual, garantindo que o leitor visualize o que foi afirmado e o lastro factual que justifica a qualificação.

---

## 1. Mapeamento das Retificações Aplicadas

| # | Objeto | Local de Inserção | Evidência Documental / Computacional |
|---|---|---|---|
| **1** | Efeito de polígono no simulador D25 | `docs/auditorias/DeepSeek/AVALIACAO_DESENHO_SEQUENCIA_TAMANHO_AMOSTRAL_2026-11-03.md` (§6.2, item 6 e §9, linha 189) | `scripts/d25/poder_d25.py` (linhas 104-107, 110-140, 179-200); cabeçalho de `docs/verificacoes/2026-11-03_poder_d25.txt` |
| **2** | Precisão dos pontos de cruzamento (80%) | `docs/auditorias/RELATORIO_SIMULACAO_PODER_2026-11-03.md` (§4, após "Ponto de Cruzamento") e `docs/planejamento/decisao/G-13.md` (§3) | Erro padrão de Monte Carlo $\text{EP} \approx \pm 4,5\text{ pp}$ ($R=80$); gradiente local de $\sim 8\text{ pp}$ por $0,01\text{ SD} \implies$ incerteza estatística de $\pm 0,006$ no SD |
| **3** | Não-monotonicidade de Monte Carlo | `docs/auditorias/RELATORIO_SIMULACAO_PODER_2026-11-03.md` (§4, abaixo da Tabela 1) | Tabela analítica das 4 inversões em unidades de erro padrão ($\Delta/\text{EP} \le 1,64$, ruído compatível); declaração formal de pendência de $R=500$ |
| **4** | Rastreabilidade do prompt de simulação | `docs/auditorias/RELATORIO_SIMULACAO_PODER_2026-11-03.md` (cabeçalho, linha 4) | Substituição de `PROMPT_EXECUTOR_PODER_D25_G13_2026-11-03.md` por `PROMPT_EXECUTOR_SIMULACAO_PODER_2026-11-03.md` |

---

## 2. Detalhamento e Evidências

### 2.1 Retificação 1 — O simulador oficial já modela o efeito de agrupamento (D24)
- **Afirmação retificada:** A avaliação de 03/11 apontava que a simulação poderia ser excessivamente otimista por gerar scores com ruído i.i.d. em 502 células, desconsiderando as ~25,6 unidades efetivas de D24.
- **Evidência:** Essa formulação descrevia a versão preliminar interna de `poder_d25.py`, a qual foi devidamente corrigida antes da rodada oficial de Monte Carlo. A versão de produção vigente:
  1. Incorpora a variância inter-polígonos no alvo em escala logito (`sd_poligono = 0.8`);
  2. Calibra o ICC formalmente pelas unidades efetivas estimadas em D24:
     $$\text{ICC}_{\text{implicito}} = \frac{502 / 25,6 - 1}{501} \approx 0,0371$$
  3. Aplica variabilidade inter-polígonos na vantagem do modelo (`sd_vantagem`);
  4. Registra essa modelagem no cabeçalho imutável da execução:
     `Efeito de poligono: SD 0.8 em logito | ICC implicito por D24: 0.0371 (~25.6 unidades efetivas/poligono)`.
- **Origem do mal-entendido:** O relatório de `P-D` documentou formalmente a limitação da versão preliminar e a correção subsequente. A leitura isolada da descrição da não-conformidade sem o parágrafo de resolução induziu ao entendimento de que o modelo ainda operava em i.i.d. puro.

### 2.2 Retificação 2 — Limites de precisão numérica dos pontos de cruzamento dos 80%
- **Afirmação retificada:** A citação de valores com três casas decimais ($\text{SD} \approx 0,126; 0,120; 0,119; 0,109$) aparentava precisão analítica fechada.
- **Evidência:** O estimador de Monte Carlo com $R = 80$ réplicas possui variância finita com $\text{EP} = \sqrt{0,80 \times 0,20 / 80} \approx \pm 4,5\text{ pp}$. Em torno do patamar de 80%, a sensibilidade empírica do poder é de aproximadamente 8 pp para cada deslocamento de $0,01$ em SD. Consequentemente, a incerteza no SD de cruzamento é da ordem de:
  $$\Delta \text{SD} \approx \frac{4,5\text{ pp}}{8\text{ pp} / 0,01} \approx \pm 0,0056 \approx \pm 0,006$$
- Três casas decimais constituem extrapolação linear indicativa. Os números foram mantidos como referência numérica, acompanhados da nota de que a conclusão substantiva de G-13 repousa na faixa **$\text{SD} \in [0,11; 0,13]$**, que é estreita e essencialmente invariante entre 24 e 36 clusters.

### 2.3 Retificação 3 — Monotonicidade entre clusters e encerramento via P-4
- **Situação:** O prompt P-3 apontava preliminarmente 4 inversões sob $R = 80$ réplicas e mantinha o item pendente. O prompt P-4 aprofundou a análise teórica e determinou a execução da Tarefa A com $R = 500$ réplicas e $B = 100$ bootstraps.
- **Correção Estatística dos Achados A-1 e A-2:**
  1. Existem **seis** inversões em pares adjacentes de $k$ na Tabela 1 oficial (duas foram omitidas na contagem preliminar: SD 0,15 $k=30 \to 28$ e SD 0,45 $k=28 \to 24$).
  2. O denominador estatístico correto para proporções independentes é o EP da diferença ($\text{EP}(\hat p_a - \hat p_b) = \sqrt{p_a(1-p_a)/R + p_b(1-p_b)/R}$), que reduz o $\Delta/\text{EP}$ preliminar por um fator de $\sqrt{2}$. **Nenhuma das 6 inversões excede 1,17 EP(dif)**:

| SD | Par | Poder ($k_a$ vs $k_b$) | Inversão | EP(dif) | $\Delta/\text{EP}$ |
|---:|:---|:---|---:|---:|---:|
| 0,08 | $k=28 \to 24$ | 98,8% vs 100,0% | 1,2 pp | 1,22 pp | 0,99 |
| 0,10 | $k=30 \to 28$ | 93,8% vs 96,2% | 2,4 pp | 3,44 pp | 0,70 |
| 0,15 | $k=30 \to 28$ | 61,3% vs 63,7% | 2,4 pp | 7,65 pp | 0,31 |
| 0,30 | $k=36 \to 30$ | 15,0% vs 18,8% | 3,8 pp | 5,92 pp | 0,64 |
| 0,45 | $k=36 \to 30$ | 10,0% vs 16,2% | 6,2 pp | 5,31 pp | 1,17 |
| 0,45 | $k=28 \to 24$ | 8,8% vs 13,8% | 5,0 pp | 4,99 pp | 1,00 |

- **Enquadramento de Regime e Não-Reprodutibilidade (Achados A-3 e A-4):**
  - Na faixa informativa (SD 0,10–0,20), o poder é estritamente monotônico de $k=36$ para $k=24$ com quedas limpas de 10 a 17,5 pp. As inversões ocorriam apenas no teto saturado ($\ge 98\%$) ou no piso inerte ($< 20\%$).
  - Em `docs/verificacoes/verificacao_custo_e_ruido_poder_d25_2026-11-03.md`, constatou-se que as inversões mudam de célula entre corridas ($R=30, 60, 80$) e a oscilação de uma única célula atinge 20,0 pp, provando a natureza aleatória do ruído.
  - A projeção de custo de $R=500$ a $B=100$ na máquina nativa foi corrigida para ~17 min (2 linhas) e ~75 min (grade de 9 linhas).
- **Desfecho da Execução a $R = 500$ (Tarefa A, `verificacao_monotonicidade_poder_2026-11-03.md`):**
  - **SD 0,30:** $19,8\% > 18,2\% > 14,2\% > 11,6\%$ (**estritamente monotônica**);
  - **SD 0,45:** $13,6\% > 11,8\% = 11,8\% > 11,6\%$ (**não-crescente / fracamente monotônica**);
  - **Largura média do IC:** estritamente crescente com a redução de $k$ ($0,1571 \to 0,1894$ e $0,1877 \to 0,2278$), com razões $k=24/k=36$ divergindo em apenas $-1,5\%$ e $-0,9\%$ da teoria de $1/\sqrt{k}$.
- **Veredito:** O critério de decisão pré-fixado (§4 de P-4) foi atendido plenamente: **todas as inversões desapareceram a $R = 500$**. A hipótese de defeito algorítmico está refutada e o item de monotonicidade está **formalmente encerrado e comprovado**.

---

## 3. Verificações de Integridade

- `npm run typecheck`: exit 0 (0 erros).
- `vitest run src/lib/seguranca/padroesProibidos.test.ts`: 34 passed (0 falhas).
- Testes D25 (`scripts/d25/`): 55 passed (0 falhas).
- Nenhum commit ou push executado.
