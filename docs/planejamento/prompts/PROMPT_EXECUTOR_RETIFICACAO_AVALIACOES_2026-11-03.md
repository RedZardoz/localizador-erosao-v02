# Tarefa: retificar afirmações desatualizadas nas avaliações de 03/11

**Versão:** 1.0 — 3 de novembro de 2026
**Base do trabalho:** `correcoes/contencao-2026-11-02`
**Objeto:** três afirmações, duas nas avaliações de 03/11 e uma no relatório de simulação, que descrevem estado já superado ou têm precisão que os dados não sustentam
**Escopo:** pequeno e documental. Nenhuma linha de código.

> **Natureza desta tarefa.** As avaliações de 03/11 são boas e várias das suas contribuições foram verificadas e aceitas — a proposta 12 × 6 está indo para o material de decisão, e o achado `S1-1` foi confirmado por reprodução e está sendo corrigido. O que segue são **três pontos a retificar**, não uma desqualificação. Retificar é o que mantém um documento utilizável.

---

## 1. Papel e limites

**Pode:** acrescentar nota de retificação aos documentos, com a evidência.

**Não pode:** apagar ou reescrever o texto original de avaliação de terceiro — **acrescente a retificação, não substitua o texto**. Quem lê precisa ver o que foi afirmado e por que não procede. Também não pode alterar `decisoes.ts`, código ou parâmetro.

### Autorização de git — a ser preenchida pelo pesquisador

- [ ] `git commit` na branch ______________________
- [ ] `git push` na branch ______________________
- [ ] nenhuma das duas — escreva, relate os caminhos e pare

---

## 2. Retificação 1 — o simulador de poder já tem efeito de polígono

**Onde:** `docs/auditorias/DeepSeek/AVALIACAO_DESENHO_SEQUENCIA_TAMANHO_AMOSTRAL_2026-11-03.md`, §6.2, item 6.

**O que afirma:** *"a simulação é possivelmente otimista porque gera scores i.i.d. em 502 células, enquanto D24 estima ~25,6 unidades efetivas."*

**Por que não procede.** Isso descreve a **primeira** versão de `scripts/d25/poder_d25.py`, que foi corrigida antes da execução oficial. A versão vigente:

- gera o alvo com **efeito de polígono**, por deslocamento da prevalência de zeros na escala logito (`gerar_alvo`, parâmetro `sd_poligono`);
- calibra o ICC **exatamente** pelas unidades efetivas de D24: `ICC_IMPLICITO = (502/25,6 − 1)/501 ≈ 0,0371`, constante nomeada no módulo;
- faz a vantagem do modelo **variar entre polígonos** (`scores_competidores`, parâmetro `sd_vantagem`), que é o eixo da varredura da execução oficial;
- **imprime** isso no cabeçalho de toda execução: `Efeito de poligono: SD 0.8 em logito | ICC implicito por D24: 0.0371 (~25.6 unidades efetivas/poligono)`.

**A evidência está no próprio arquivo de saída** que a avaliação cita: `docs/verificacoes/2026-11-03_poder_d25.txt`, na linha de cabeçalho.

**A origem provável do mal-entendido** é legítima e vale registrar: o relatório de `P-D` **documenta o defeito e a sua correção** em seção própria, porque registrar o erro era obrigação. Quem lê essa seção sem o parágrafo seguinte conclui que o defeito é vigente. **A lição é sobre a redação do meu relatório, não sobre a leitura da avaliação** — e por isso a retificação deve apontar os dois lados.

**Faça:** nota de retificação no item 6 da §6.2, com a constante, a linha de cabeçalho como evidência e a ressalva de que o relatório de `P-D` é ambíguo nesse ponto.

---

## 3. Retificação 2 — precisão dos pontos de cruzamento dos 80%

**Onde:** `docs/auditorias/RELATORIO_SIMULACAO_PODER_2026-11-03.md`, §4, e `docs/planejamento/decisao/G-13.md`, §3, onde o número for repetido.

**O que afirma:** pontos de cruzamento de `SD ≈ 0,126` (k=36), `0,120` (k=30), `≈0,119` (k=28), `≈0,109` (k=24).

**Por que a precisão não se sustenta.** A execução usou **80 réplicas**, com erro padrão de Monte Carlo de **±4,5 pontos percentuais** no poder — o próprio relatório declara isso. Perto do cruzamento, o gradiente é de cerca de 8 pontos de poder por 0,01 de SD, de modo que a incerteza no SD de cruzamento é da ordem de **±0,006**. Três casas decimais afirmam uma precisão cerca de dez vezes maior que a dos dados.

**O que é defensável:** a faixa que o próprio relatório conclui — **`SD ∈ [0,11; 0,13]`** — e a leitura de que ela é **estreita e praticamente a mesma** para 24 a 36 clusters. Essa é a informação que decide o gate, e ela sobrevive à imprecisão.

**Faça:** nota declarando a incerteza de ±0,006, mantendo a faixa como a conclusão e marcando os valores de três decimais como **interpolação indicativa**, não estimativa. Não apague os números.

---

## 4. Retificação 3 — a não-monotonicidade segue indeterminada

**Onde:** `docs/auditorias/RELATORIO_SIMULACAO_PODER_2026-11-03.md`, §4, Tabela 1.

**O que está em aberto.** O prompt de simulação pedia **500 réplicas** e advertia: *"se a não-monotonicidade persistir com 500 réplicas, não é ruído — é defeito"*. A execução usou **80**, e as inversões permanecem. Análise de cada uma, em unidades de erro padrão:

| Caso | Inversão | Δ/EP |
|---|---:|---:|
| SD 0,08 — k=28 (98,8%) vs k=24 (100,0%) | 1,2 pp | 1,39 |
| SD 0,10 — k=30 (93,8%) vs k=28 (96,2%) | 2,4 pp | 0,98 |
| SD 0,30 — k=36 (15,0%) vs k=30 (18,8%) | 3,8 pp | 0,91 |
| SD 0,45 — k=36 (10,0%) vs k=30 (16,2%) | 6,2 pp | 1,64 |

**Todas dentro de ~1,6 EP, e sem padrão sistemático** — a evidência favorece ruído de Monte Carlo, não defeito. Mas com 80 réplicas a questão não fecha: o teste que o prompt pedia não foi feito.

**Faça:** nota registrando que a verificação de monotonicidade com 500 réplicas **continua pendente**, com esta tabela, e declarando que a evidência disponível favorece ruído. Não afirme que está resolvido.

**Se houver tempo e máquina**, rodar apenas as duas linhas de SD alto com mais réplicas resolveria:

```bash
python -u scripts/d25/poder_d25.py --replicas 500 --bootstrap 200 --sd-vantagem 0.30 0.45
```

Isso é bem mais barato que a grade inteira e é onde a dúvida está. Se a monotonicidade aparecer, era ruído; se persistir, é defeito e precisa de investigação.

---

## 5. Correção de rastreabilidade

`docs/auditorias/RELATORIO_SIMULACAO_PODER_2026-11-03.md` cita, no cabeçalho, `PROMPT_EXECUTOR_PODER_D25_G13_2026-11-03.md`. O arquivo é **`PROMPT_EXECUTOR_SIMULACAO_PODER_2026-11-03.md`**. Corrija a referência.

---

## 6. Fora de escopo

1. **Não apague nem reescreva** o texto original das avaliações — acrescente.
2. **Não altere** código, `decisoes.ts`, parâmetro ou norma.
3. **Não refaça** a execução oficial de poder, exceto as duas linhas de SD alto da §4, se houver máquina.
4. **Não abra** pull request.

---

## 7. Relatório

Grave em `docs/auditorias/RELATORIO_RETIFICACOES_2026-11-XX.md`: onde cada nota foi inserida, a evidência de cada uma, e — se as duas linhas de SD alto foram executadas — o resultado e o veredito sobre a monotonicidade.

**Resposta final:** 3 a 6 linhas; as três retificações; o veredito da monotonicidade, se houver.

**Fim do prompt.** Nenhuma decisão, parâmetro científico ou norma é alterado por este arquivo.
