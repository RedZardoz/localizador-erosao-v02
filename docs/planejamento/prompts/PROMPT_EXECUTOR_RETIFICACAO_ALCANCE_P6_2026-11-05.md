# PROMPT EXECUTOR — RETIFICAÇÃO DE ALCANCE DAS CONCLUSÕES DO P-6 (P-7)

**Data:** 05/11/2026
**Branch de trabalho:** `correcoes/contencao-2026-11-02` (ponta esperada: `81b2e0f`)
**Depende de:** P-6 (Tarefa C), executado e consolidado em `81b2e0f`.
**Natureza:** retificação documental. **Não roda simulação, não altera código, metodologia, limiar nem decisão.**

---

## 1. Objetivo em uma frase

A grade completa a $R = 500$ foi bem executada e o resultado científico é sólido — mas **três afirmações do texto vão além do que os dados mostram**. Corrigi-las, sem tocar no que está certo.

## 2. Leia isto antes de corrigir: o que NÃO deve ser alterado

O risco aqui é corrigir demais. As afirmações abaixo foram conferidas e **estão corretas**. Preserve-as:

- **27 de 27 comparações de largura do IC são estritamente crescentes.** Conferido. Desvio médio de $-2{,}17\%$ da teoria $1/\sqrt{k}$. É a evidência mais forte de que o estimador por cluster está correto.
- **Na faixa informativa (SD 0,10, 0,12 e 0,15) não subsiste uma única inversão**: as 9 transições são estritamente decrescentes. Conferido (quedas de 4,2, 8,6 e 11,0 pp de $k{=}36$ a $k{=}24$).
- **No piso ($\text{SD} \ge 0{,}20$), todas as variações estão abaixo de $1{,}0\text{ EP}$, com máximo de $0{,}93$–$0{,}94$ EP em SD 0,30.** Conferido. As passagens de `RELATORIO_SIMULACAO_PODER_2026-11-03.md` (linha 126) e `G-13.md` (linha 70) que fazem essa afirmação **restrita ao piso** estão certas e ficam como estão.
- **O cruzamento de 80% em $[0{,}117; 0{,}128]$.** Reconferido por interpolação independente: $k{=}36 \to 0{,}1277$; $k{=}30 \to 0{,}1254$; $k{=}28 \to 0{,}1231$; $k{=}24 \to 0{,}1166$. A atualização de G-13 está correta.
- **A conclusão substantiva: não há defeito no simulador.** Ela se sustenta. O que muda é como ela é afirmada.

---

## 3. As três correções

### R-1 — "Monotonicidade comprovada em todas as 9 linhas" é contrariada pela própria tabela

**Onde:** `docs/verificacoes/verificacao_grade_completa_poder_2026-11-04.md`, linha 220 (item 1 da Conclusão Final):

> "**Comprova a monotonicidade algorítmica** do simulador `scripts/d25/poder_d25.py` em todas as 9 linhas de SD e todos os cenários de $k$"

**Por que está errado:** a tabela de poder a $R = 500$ do próprio documento tem **seis inversões, distribuídas em quatro linhas** (SD 0,08, 0,20, 0,30 e 0,45):

| SD | par | poder | inversão | EP(dif) | Δ/EP | regime |
|---:|:---|:---|---:|---:|---:|:---|
| 0,08 | k36→k30 | 99,8% vs 100,0% | +0,2 pp | 0,20 pp | **1,00** | teto |
| 0,20 | k36→k30 | 32,4% vs 33,0% | +0,6 pp | 2,97 pp | 0,20 | piso |
| 0,20 | k28→k24 | 29,8% vs 30,0% | +0,2 pp | 2,90 pp | 0,07 | piso |
| 0,30 | k36→k30 | 15,4% vs 17,6% | +2,2 pp | 2,35 pp | 0,94 | piso |
| 0,30 | k28→k24 | 14,6% vs 15,6% | +1,0 pp | 2,26 pp | 0,44 | piso |
| 0,45 | k30→k28 | 10,6% vs 12,0% | +1,4 pp | 2,00 pp | 0,70 | piso |

Nenhuma excede o limiar de ruído, e é isso que sustenta "não há defeito". Mas **"nenhuma inversão excede o ruído" e "a curva é monotônica" são afirmações diferentes**, e só a primeira foi demonstrada. Em quatro das nove linhas a curva observada não é monotônica.

**Ação:** substituir por formulação que diga o que foi medido. Sugestão de conteúdo (adapte a redação ao estilo do documento):

> Nenhuma inversão da grade excede o limiar de ruído de Monte Carlo em ponto algum ($\Delta/\text{EP} \le 1{,}00$); a monotonicidade observada é estrita e limpa exatamente onde o efeito verdadeiro de $k$ é detectável (faixa informativa, SD 0,10–0,15); no teto ($\text{SD} \le 0{,}08$) e no piso ($\text{SD} \ge 0{,}20$) a ordenação entre cenários permanece não estimável, porque ali a curva verdadeira é plana — comportamento previsto pelo Achado A-3 do prompt P-4, e não evidência contra o simulador.

Aplique o mesmo ajuste à linha 225 ("definitivamente e formalmente encerrado"): o que está encerrado é **a hipótese de defeito algorítmico**, sobre a grade completa. Não a monotonicidade em toda a grade.

### R-2 — A afirmação de "$\ge 1{,}0$ EP" sem qualificação é contrariada pelo teto

**Onde:** `verificacao_grade_completa_poder_2026-11-04.md`, linha 215, terceira linha da tabela de critérios:

> "Não houve nenhuma ocorrência $\ge 1{,}0\text{ EP}$."

**Por que está errado:** essa linha **não tem qualificação de regime** — fala da grade inteira. A inversão de SD 0,08 `k36→k30` vale **exatamente 1,00 EP** (+0,2 pp contra EP de 0,20 pp). A afirmação é absoluta e o próprio dado a contradiz, ainda que na margem.

**Atenção:** o erro é só da versão **sem qualificação**. As afirmações equivalentes **restritas ao piso** (relatório, linha 126; G-13, linha 70) estão corretas — ver seção 2. Não as altere.

**Ação:** qualificar a linha 215. Sugestão: "Nenhuma ocorrência acima de 2 EP. O máximo da grade é $1{,}00\text{ EP}$, em SD 0,08 `k36→k30` (+0,2 pp), no regime de teto saturado; no piso ($\text{SD} \ge 0{,}20$) o máximo é $0{,}94\text{ EP}$."

Observe também que a linha 215 está na célula do critério "*inversão acima de 2 EP com padrão sistemático*", cujo limiar é **2 EP**, não 1 EP. O diagnóstico ("defeito refutado") continua correto; só o número citado precisa de conserto.

### R-3 — Falta registrar que a Tarefa C não reproduziu a Tarefa A

**Onde:** ausente de todos os três documentos. A seção de confronto da verificação compara $R = 500$ apenas contra $R = 80$, nunca contra a corrida de $R = 500$ da Tarefa A.

**O fato:** nas duas linhas que a Tarefa A já havia rodado — **com a mesma semente `20261103`, o mesmo $R = 500$ e o mesmo $B = 100$** — os resultados são outros:

| SD | Tarefa A ($R=500$) | Tarefa C ($R=500$) | maior divergência |
|---:|:---|:---|---:|
| 0,30 | 19,8 / 18,2 / 14,2 / 11,6 — monotônica | 15,4 / 17,6 / 14,6 / 15,6 — duas inversões | 4,4 pp |
| 0,45 | 13,6 / 11,8 / 11,8 / 11,6 — monotônica | 13,4 / 10,6 / 12,0 / 11,8 — uma inversão | 1,2 pp |

**A causa** é o fluxo único e sequencial do gerador de números aleatórios: `rng = np.random.default_rng(a.seed)` é criado uma vez e consumido célula a célula, na ordem em que as linhas de `--sd-vantagem` aparecem. Na Tarefa A, só duas linhas correram antes dessas células; na Tarefa C, sete. A posição no fluxo é outra, logo os sorteios são outros.

**Por que isso precisa estar escrito, em duas frentes:**

1. O "estritamente decrescente" que a Tarefa A obteve em SD 0,30 **foi em parte sorte**. A mesma configuração, noutro ponto do fluxo, produz inversões. Qualquer leitura que trate aquele resultado como propriedade do simulador está equivocada — e a nota de alcance já inserida na verificação da Tarefa A deve dizer isso.
2. Para um instrumento que embasa G-13: **a semente não fixa célula alguma, fixa a corrida inteira dada a lista exata de argumentos.** Quem reexecutar um subconjunto de linhas não reproduz a tabela publicada. Isso é propriedade de reprodutibilidade e se declara.

**Ação:** acrescentar seção à `verificacao_grade_completa_poder_2026-11-04.md` com a tabela acima, a causa e as duas consequências. Acrescentar uma frase à nota de alcance em `verificacao_monotonicidade_poder_2026-11-03.md` registrando que a Tarefa C não reproduziu aquelas duas linhas e remetendo à nova seção.

> **Fora da sua alçada — registre e relate, não conserte (CLAUDE.md §2):** existe remédio técnico, que é derivar a semente por célula a partir de `(semente, sd, k)` — por exemplo `np.random.default_rng([semente, int(sd*1000), k])` — tornando cada célula reprodutível independentemente do resto da grade. **Não implemente.** Alterar o gerador de aleatoriedade de um instrumento pré-registrado é mudança metodológica, e é do pesquisador. Registre a opção no documento como recomendação e pare.

---

## 4. Limites

- Nenhuma simulação nova. Todos os números deste prompt vêm da saída já arquivada em `81b2e0f`.
- Não alterar `scripts/d25/poder_d25.py`, `src/config/decisoes.ts`, limiar ou estado de decisão.
- Não promover G-13 nem qualquer gate.
- Preservar o texto original e marcar as mudanças como nota datada, como o P-3 fez. Não reescrever histórico documental.
- Não "melhorar" as afirmações listadas na seção 2: elas foram conferidas e estão corretas.

## 5. Entregáveis

1. `docs/verificacoes/verificacao_grade_completa_poder_2026-11-04.md` com R-1, R-2 e R-3 aplicados.
2. `docs/verificacoes/verificacao_monotonicidade_poder_2026-11-03.md` com a frase de R-3.
3. `docs/planejamento/decisao/G-13.md`: o corpo do texto está correto, mas o rótulo **"Monotonicidade Totalmente Comprovada"** (linha 70) carrega o mesmo excesso de R-1. Ajustar o rótulo; não mexer no corpo nem nos números do cruzamento.
4. `docs/auditorias/RELATORIO_SIMULACAO_PODER_2026-11-03.md`: verificar se a nota de 04/11 (linha 114 em diante) repete a generalização de R-1. A passagem da linha 126, **restrita ao piso, está correta** — só corrija se houver afirmação sobre a grade inteira.
5. Nota curta, no relatório ou na verificação, registrando a recomendação de semente por célula como pendência do pesquisador.

## 6. Verificação pós-execução (CLAUDE.md §6)

```bash
npm run typecheck
npm test
npm test src/lib/seguranca/padroesProibidos.test.ts
```

Linha de base: `tsc` com saída 0, 797 testes TS (3 ignorados), 55 testes Python, varredor 34/34. Esta tarefa é documental e não deve alterar nenhum desses números; qualquer desvio é sinal de que algo além do texto foi tocado.

## 7. Autorização de git

CLAUDE.md §1: nenhuma operação que altere o repositório remoto ou o histórico acontece sem autorização explícita do pesquisador, dada na conversa, para aquela operação. Autorização é específica e não se estende.

O preenchimento deste bloco é do pesquisador. **Quem redigiu este prompt não pode preenchê-lo.**

```
Commit autorizado:   [ ] sim   [ ] não        Data: ____/____/______
Push autorizado:     [ ] sim   [ ] não        Branch: _______________________
Assinatura: ______________________________
```

Sem este bloco preenchido: escreva os arquivos na árvore de trabalho, informe os caminhos completos ao pesquisador e **pare**. Se o Stop hook exigir commit ou push, relate em uma linha que ele está bloqueando e qual operação exige, e espere — a exigência do hook não é autorização.
