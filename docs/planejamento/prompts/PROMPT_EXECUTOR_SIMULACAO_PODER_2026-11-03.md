# Tarefa: executar a simulação de poder e fechar a página de decisão de G-13

**Versão:** 1.0 — 3 de novembro de 2026
**Base do trabalho:** `correcoes/contencao-2026-11-02` (ou a branch que o pesquisador indicar)
**Origem:** item 4 do prompt de material de decisao (`PROMPT_EXECUTOR_MATERIAL_DECISAO_2026-11-02.md`, na branch `correcoes/consolidacao-achados-2026-11-01`); achados `N-04`, `V-05`
**Entregável:** `docs/planejamento/decisao/G-13.md` preenchido com a execução oficial

> **Por que este prompt existe separado.** O simulador `scripts/d25/poder_d25.py` foi escrito pelo mesmo assistente que produziu os números de conferência dos outros itens. Executá-lo e conferi-lo é trabalho que precisa de **outra mão** — não por formalidade, mas porque a primeira versão desse simulador estava **errada** de um modo que produzia exatamente a conclusão oposta à correta (ver §4). Um simulador que já errou uma vez merece verificação independente.

---

## 1. Papel e limites

**Pode:** executar o simulador, conferir a sua lógica, corrigir defeito que encontrar, preencher a página de decisão, escrever a verificação.

**Não pode:** decidir `G-13`; alterar a margem de 0,10; alterar `src/config/decisoes.ts`; alterar `scripts/d25/avaliacao_d25_referencia.py`; apresentar resultado de simulação como resultado científico.

### Autorização de git — a ser preenchida pelo pesquisador

- [ ] `git commit` na branch ______________________
- [ ] `git push` na branch ______________________
- [ ] nenhuma das duas — escreva, relate os caminhos e pare

---

## 2. Preparação

As dependências de `scripts/d25/requirements.txt` são **obrigatórias** (`scipy` em particular). Sem elas o simulador aborta com mensagem explícita.

```bash
pip install -r scripts/d25/requirements.txt
python3 -m unittest discover -s scripts/d25 -p "test_*.py"
```

**Baseline conhecido em 03/11/2026:** 49 testes, `OK`. Se divergir, investigue antes de prosseguir — não é esperado que este trabalho altere a suíte.

---

## 3. A execução oficial

```bash
python3 -u -I scripts/d25/poder_d25.py --conferir \
    --replicas 500 --bootstrap 400 \
    --sd-vantagem 0.02 0.05 0.10 0.15 0.20 0.30 0.45 \
    > docs/verificacoes/2026-11-XX_poder_d25.txt 2>&1
```

**Tempo esperado:** a execução cresce com `replicas × bootstrap × |sd-vantagem| × 4 clusters`. Uma execução de 25 réplicas, 60 reamostragens e 2 valores de `sd-vantagem` leva cerca de 100 segundos; a oficial acima é da ordem de **centenas de vezes** isso. **Rode em segundo plano e com saída não bufferizada (`-u`)**, e dimensione: se for inviável no seu ambiente, reduza `--replicas` antes de reduzir a grade de `--sd-vantagem`, porque é a grade que responde à pergunta.

**Declare no relatório** o número de réplicas efetivamente usado e o erro de Monte Carlo correspondente: com `R` réplicas, o erro padrão de uma estimativa de poder `p` é `sqrt(p(1-p)/R)`. Com 60 réplicas e poder próximo de 0,8, isso é cerca de ±5 pontos percentuais — grande demais para distinguir 78% de 82%.

**A conferência (`--conferir`) tem de passar:** ela compara a implementação interna de Spearman com `scipy.stats.spearmanr`. A diferença esperada é 0,00e+00. Se não for, pare e relate.

---

## 4. Confira o simulador antes de confiar nele

A primeira versão gerava o alvo **i.i.d. entre células**, sem efeito de polígono. Sem variância entre clusters, o bootstrap por cluster produzia IC de largura ~0,02 e **poder de 100% em todos os cenários**, inclusive com 24 clusters — contradizendo a análise de D24 e da auditoria. O erro foi corrigido, mas confira estes pontos:

| Verificar | Onde | O que deve ser verdade |
|---|---|---|
| efeito de polígono existe | `gerar_alvo` | a prevalência de zeros varia por polígono (deslocamento em logito) |
| ICC bate com D24 | `ICC_IMPLICITO` | `502/(1 + 501·ICC) ≈ 25,6` unidades efetivas por polígono |
| vantagem heterogênea | `scores_competidores` | o ganho do modelo varia por polígono, com média 0,10 |
| bootstrap por cluster | `ic_bootstrap_por_cluster` | reamostra **polígonos** com reposição, nunca células |
| empates | `spearman` | ranks médios (`rankdata` método `average`) |

**Teste de sanidade que vale fazer:** force `--sd-vantagem 0.0` com vantagem média zero e verifique que o poder cai para perto de 5% (o nível nominal). Se não cair, o IC está mal calibrado e o resto da tabela não vale.

---

## 5. O que a página de decisão precisa receber

Preencha `docs/planejamento/decisao/G-13.md`, substituindo a seção **"Resultados preliminares — não usar para decidir"**:

1. **Tabela de poder** completa: `sd-vantagem` × `k ∈ {36, 30, 28, 24}`.
2. **Tabela de largura do IC**, idem.
3. **O valor de `sd-vantagem` em que o poder cruza 80%**, por número de clusters. É a resposta à pergunta do gate.
4. **O número de réplicas e o erro de Monte Carlo.**
5. Remova o aviso de página incompleta do topo, **se e somente se** a execução oficial estiver concluída.

**Não remova** as ressalvas da §7 daquela página: a simulação continua não usando dado real e continua não modelando autocorrelação entre polígonos.

---

## 6. A pergunta que o material tem de responder

Não é *"qual é o poder"*. É:

> **A partir de que grau de heterogeneidade da vantagem entre polígonos a margem de 0,10 deixa de ser detectável, e esse grau é plausível para este problema?**

Se o poder só cai abaixo de 80% quando a vantagem varia com SD de 0,30 ou mais — isto é, quando o modelo **perde** para o RUSLE em parte dos polígonos —, a afirmação da auditoria de que *"0,10 está próximo do ruído"* precisa ser qualificada, e o gate pode ser decidido com mais tranquilidade. Se cair já em SD de 0,10, a afirmação se confirma e `G-01` passa a ter um custo que hoje não está à vista.

**Relate a resposta nos dois sentidos**, sem recomendar opção.

---

## 7. Fora de escopo

1. **Não decida `G-13`**, nem recomende margem.
2. **Não altere** a margem de 0,10 em lugar algum.
3. **Não rode** `avaliacao_d25_referencia.py`, em nenhum modo — nem `--probatorio`, nem `--dryrun-sintetico`.
4. **Não gere** número que possa ser citado como desfecho: todo arquivo de saída leva no nome e no cabeçalho a marca de simulação.
5. **Não toque** em `decisoes.ts`, nos perfis de matriz nem no contrato de esquema.
6. **Não abra** pull request.

---

## 8. Relatório

Grave em `docs/auditorias/RELATORIO_SIMULACAO_PODER_2026-11-XX.md`:

1. Comando exato, réplicas, reamostragens, semente e **tempo de execução**.
2. Resultado da conferência contra `scipy` e do teste de sanidade do nível nominal.
3. As duas tabelas, e o ponto de cruzamento dos 80%.
4. **Defeitos que você encontrou no simulador**, se encontrou — e são bem-vindos, é para isso que este prompt existe.
5. A resposta à pergunta da §6, nos dois sentidos.
6. O que ficou pendente.

**Resposta final:** 5 a 10 linhas; as duas tabelas; o ponto de cruzamento; o que exige decisão do pesquisador.

**Fim do prompt.** Nenhuma decisão, parâmetro científico ou norma é alterado por este arquivo.
