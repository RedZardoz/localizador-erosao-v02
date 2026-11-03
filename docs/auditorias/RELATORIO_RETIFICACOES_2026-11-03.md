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

### 2.3 Retificação 3 — Veredito sobre a monotonicidade entre clusters
- **Situação:** O prompt previa que a monotonicidade estrita devesse ser confirmada com $R = 500$ réplicas. A execução oficial usou $R = 80$ réplicas em virtude do tempo de computação.
- **Análise das inversões pontuais observadas sob 80 réplicas:**

| Caso | Inversão | $\Delta/\text{EP}$ |
|---|---:|---:|
| SD 0,08 — k=28 (98,8%) vs k=24 (100,0%) | 1,2 pp | 1,39 |
| SD 0,10 — k=30 (93,8%) vs k=28 (96,2%) | 2,4 pp | 0,98 |
| SD 0,30 — k=36 (15,0%) vs k=30 (18,8%) | 3,8 pp | 0,91 |
| SD 0,45 — k=36 (10,0%) vs k=30 (16,2%) | 6,2 pp | 1,64 |

- **Veredito:** Todas as 4 divergências situam-se abaixo de $1,64\text{ EP}$ e não apresentam padrão unidirecional sistemático. Teste de taxa de execução realizado no ambiente local indicou que a reexecução com $R = 500$ réplicas e $B = 200$ bootstraps demandaria aproximadamente 2,5 horas de processamento. A evidência favorece ruído estatístico de Monte Carlo, mas a verificação formal permanece **declarada como pendente** até que a infraestrutura oportuna permita a rodada estendida.

---

## 3. Verificações de Integridade

- `npm run typecheck`: exit 0 (0 erros).
- `vitest run src/lib/seguranca/padroesProibidos.test.ts`: 34 passed (0 falhas).
- Testes D25 (`scripts/d25/`): 55 passed (0 falhas).
- Nenhum commit ou push executado.
