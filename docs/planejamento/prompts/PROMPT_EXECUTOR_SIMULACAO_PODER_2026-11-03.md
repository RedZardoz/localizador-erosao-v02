# Tarefa: executar a simulação de poder e fechar a página de decisão de G-13

**Versão:** 2.0 — 3 de novembro de 2026 (revisa a 1.0, acrescentando as dependências de execução)
**Base do trabalho:** `correcoes/contencao-2026-11-02`
**Origem:** item 4 do [prompt de material de decisão](PROMPT_EXECUTOR_MATERIAL_DECISAO_2026-11-02.md); achados `N-04`, `V-05`
**Entregável:** [`docs/planejamento/decisao/G-13.md`](../decisao/G-13.md) fechado com a execução oficial

> **Por que este prompt existe separado.** O simulador `scripts/d25/poder_d25.py` foi escrito pelo mesmo assistente que produziu os números de conferência dos outros itens. Executá-lo e conferi-lo é trabalho que precisa de **outra mão** — não por formalidade, mas porque a primeira versão desse simulador estava **errada** de um modo que produzia exatamente a conclusão oposta à correta (ver §5). Um simulador que já errou uma vez merece verificação independente.

---

## 1. Papel e limites

**Pode:** executar o simulador, conferir a sua lógica, corrigir defeito que encontrar, preencher a página de decisão, escrever a verificação.

**Não pode:** decidir `G-13`; alterar a margem de 0,10; alterar `src/config/decisoes.ts`; alterar `scripts/d25/avaliacao_d25_referencia.py`; apresentar resultado de simulação como resultado científico.

### Autorização de git — a ser preenchida pelo pesquisador

- [ ] `git commit` na branch ______________________
- [ ] `git push` na branch ______________________
- [ ] nenhuma das duas — escreva, relate os caminhos e pare

---

## 2. Dependências — leia antes de rodar qualquer coisa

Esta é a parte que custou tempo na sessão anterior e por isso está detalhada.

### 2.1 O que o repositório declara

`scripts/d25/requirements.txt` lista, **sem fixar versão**:

```
numpy · pandas · scipy · scikit-learn · xgboost · shapely · pyproj
```

### 2.2 O que estava instalado e o que faltava

No ambiente da sessão de 03/11/2026, `numpy` e `pandas` **já vinham**; as outras cinco **não**. Consequências medidas:

| Ausente | Efeito |
|---|---|
| **`scipy`** | **o simulador aborta** na importação, com mensagem explícita: ele usa `rankdata` e `spearmanr` |
| `scikit-learn`, `xgboost` | `avaliacao_d25_referencia.py` não importa — e portanto a suíte de testes do D25 falha |
| `shapely`, `pyproj` | `fracao_erodida_celulas_referencia.py` não importa — idem |

**Sem as cinco, 7 dos 49 testes do D25 falham com `ModuleNotFoundError`.** Isso **não é defeito do código** — e é provavelmente a origem da observação da auditoria de 31/10 (`F-19`) de que os testes Python eram *"não reproduzíveis aqui"*. Com as dependências instaladas, **os 49 passam**.

### 2.3 Instalação e verificação

```bash
pip install -r scripts/d25/requirements.txt
```

```bash
python3 -c "
import sys; print('python', sys.version.split()[0])
for m in ['numpy','pandas','scipy','sklearn','xgboost','shapely','pyproj']:
    try:
        mod=__import__(m); print(m, getattr(mod,'__version__','?'))
    except ImportError: print(m, 'AUSENTE')
"
```

**Versões em que a execução preliminar funcionou**, para referência — não são pinos, e divergência não é problema por si:

```
python 3.13.18 · numpy 2.5.3 · pandas 3.0.5 · scipy 1.18.1
scikit-learn 1.9.1 · xgboost 3.4.1 · shapely 2.2.0 · pyproj 3.8.0
```

**Se a rede do seu ambiente bloquear o PyPI**, pare e relate: sem `scipy` não há execução, e improvisar uma implementação de `rankdata` para contornar o bloqueio seria trocar uma dependência conferida por código novo não verificado, no meio de uma simulação cujo propósito é verificar.

### 2.4 Baseline da suíte, a confirmar antes de começar

```bash
python3 -m unittest discover -s scripts/d25 -p "test_*.py"
```

**Esperado: `Ran 49 tests ... OK`.** Se divergir, investigue antes de prosseguir — este trabalho não deveria alterar a suíte.

**Aviso esperado, que não é defeito:** `fracao_erodida_celulas_referencia.py:65` emite `DeprecationWarning` do shapely (`shapely.ops.transform` está deprecada em favor de `shapely.transform`). Não corrija aqui — é fora de escopo e merece o seu próprio registro.

---

## 3. A execução oficial

```bash
python3 -u -I scripts/d25/poder_d25.py --conferir \
    --replicas 500 --bootstrap 400 \
    --sd-vantagem 0.02 0.05 0.08 0.10 0.12 0.15 0.20 0.30 0.45 \
    > docs/verificacoes/2026-11-XX_poder_d25.txt 2>&1
```

A grade acima adensa deliberadamente a faixa **0,08 a 0,15**, que é onde a execução preliminar mostrou o poder cruzar 80%.

**Dimensionamento.** O custo cresce com `replicas × bootstrap × |sd-vantagem| × 4 clusters`. Medições reais da sessão anterior, no mesmo simulador:

| Réplicas | Reamostragens | Valores de SD | Tempo |
|---:|---:|---:|---|
| 25 | 60 | 2 | ~1 min 40 s |
| 60 | 120 | 4 | ~15 min |
| 500 | 400 | 9 | **horas** |

**Rode em segundo plano, com `-u`** (sem isso a saída fica no buffer e você não acompanha nada). Se for inviável no seu ambiente, **reduza `--replicas` antes de reduzir a grade de `--sd-vantagem`** — é a grade que responde à pergunta; as réplicas só apertam o erro.

**Declare no relatório o erro de Monte Carlo.** Com `R` réplicas e poder `p`, o erro padrão é `sqrt(p(1-p)/R)`: com 60 réplicas e `p ≈ 0,8` dá ±5 pontos percentuais; com 500, ±1,8.

**A conferência (`--conferir`) tem de passar:** compara a implementação interna de Spearman com `scipy.stats.spearmanr`, e a diferença esperada é `0,00e+00`. Se não for, pare e relate.

---

## 4. Confira o simulador antes de confiar nele

A primeira versão gerava o alvo **i.i.d. entre células**, sem efeito de polígono. Sem variância entre clusters, o bootstrap por cluster produzia IC de largura ~0,02 e **poder de 100% em todos os cenários**, inclusive com 24 clusters — contradizendo a análise de D24 e da auditoria. Foi corrigido, mas confira:

| Verificar | Onde | O que deve ser verdade |
|---|---|---|
| efeito de polígono existe | `gerar_alvo` | a prevalência de zeros varia por polígono (deslocamento em logito) |
| ICC bate com D24 | `ICC_IMPLICITO` | `502/(1 + 501·ICC) ≈ 25,6` unidades efetivas por polígono |
| vantagem heterogênea | `scores_competidores` | o ganho do modelo varia por polígono, com média 0,10 |
| bootstrap por cluster | `ic_bootstrap_por_cluster` | reamostra **polígonos** com reposição, nunca células |
| empates | `spearman` | ranks médios (`rankdata` método `average`) |

**Teste de sanidade, obrigatório:**

```bash
python3 -u -I scripts/d25/poder_d25.py --replicas 200 --bootstrap 200 --sd-vantagem 0.0
```

Com vantagem média de 0,10 e SD zero, o poder deve ser **alto**. Para checar o nível nominal, é preciso vantagem média **zero** — se você alterar o simulador para permitir isso, o poder deve cair para perto de **5%**. Se não cair, o IC está mal calibrado e **nenhuma linha da tabela vale**. Relate o que encontrar.

**Dois pontos onde eu posso estar errado, e que merecem o seu ceticismo:**

1. **A calibração do ICC** usa as ~25,6 unidades efetivas por polígono que D24 **estima** — tratei estimativa como medida, e o efeito de polígono daí derivado governa toda a curva.
2. **A forma da distribuição dos positivos** (Beta com `a ≈ 1,5`, `b = 6`) foi escolhida como plausível para manchas pequenas em célula de 100 m², não medida. O **teto** de Spearman depende dela, embora a direção do efeito não dependa.

---

## 5. O que a página de decisão precisa receber

Preencha [`docs/planejamento/decisao/G-13.md`](../decisao/G-13.md), substituindo a seção **"Resultados preliminares"**:

1. **Tabela de poder** completa: `sd-vantagem` × `k ∈ {36, 30, 28, 24}`.
2. **Tabela de largura do IC**, idem.
3. **O valor de `sd-vantagem` em que o poder cruza 80%**, por número de clusters. É a resposta ao gate.
4. **Réplicas usadas e erro de Monte Carlo.**
5. Remova o aviso do topo **se e somente se** a execução oficial estiver concluída.

**Não remova** as ressalvas da última seção: a simulação continua não usando dado real e continua não modelando autocorrelação entre polígonos (`V-02`).

### O que a execução preliminar já indicou, e que você deve confirmar ou refutar

Com 60 réplicas (±5 pontos), prevalência de zeros de 85%:

| SD da vantagem | k=36 | k=30 | k=28 | k=24 |
|---:|---:|---:|---:|---:|
| 0,05 | 100,0% | 100,0% | 100,0% | 100,0% |
| 0,15 | 71,7% | 61,7% | 61,7% | 56,7% |
| 0,30 | 8,3% | 21,7% | 13,3% | 20,0% |
| 0,45 | 6,7% | 15,0% | 6,7% | 11,7% |

**Duas leituras a verificar:**

- **O poder cruza 80% entre SD 0,05 e 0,15.** Se confirmado, a afirmação da auditoria de que *"0,10 está próximo do ruído com 36 clusters"* é **condicionalmente verdadeira** — falsa se a vantagem for homogênea, verdadeira a partir de SD 0,15.
- **A perda de clusters importa menos que a heterogeneidade.** Em SD 0,15, ir de 36 para 24 clusters custa ~15 pontos; passar de SD 0,05 para 0,15 custa ~28 pontos com os mesmos 36 clusters. Se confirmado, **o custo em poder deixa de ser argumento relevante para escolher entre as saídas de `G-01`**.

**Atenção a um sinal de ruído:** em SD 0,30 e 0,45 os valores não são monotônicos em `k` (8,3% em k=36 contra 21,7% em k=30). Com 60 réplicas isso é compatível com erro de Monte Carlo. Se **persistir** com 500 réplicas, não é ruído — é defeito, e precisa ser investigado antes de qualquer conclusão.

---

## 6. A pergunta que o material tem de responder

Não é *"qual é o poder"*. É:

> **A partir de que grau de heterogeneidade da vantagem entre polígonos a margem de 0,10 deixa de ser detectável, e esse grau é plausível para este problema?**

Um SD de 0,30 corresponde a um modelo que ganha muito em alguns polígonos e **perde** para o RUSLE em outros. Se o poder só colapsa aí, o gate pode ser decidido com mais tranquilidade. Se colapsar já em 0,10, a afirmação da auditoria se confirma e `G-01` passa a ter um custo que hoje não está à vista.

**Relate a resposta nos dois sentidos**, sem recomendar opção.

---

## 7. Fora de escopo

1. **Não decida `G-13`**, nem recomende margem.
2. **Não altere** a margem de 0,10 em lugar algum.
3. **Não rode** `avaliacao_d25_referencia.py`, em nenhum modo — nem `--probatorio`, nem `--dryrun-sintetico`.
4. **Não gere** número que possa ser citado como desfecho: todo arquivo de saída leva no nome e no cabeçalho a marca de simulação.
5. **Não corrija** o `DeprecationWarning` do shapely (§2.4).
6. **Não toque** em `decisoes.ts`, nos perfis de matriz nem no contrato de esquema.
7. **Não abra** pull request.

---

## 8. Relatório

Grave em `docs/auditorias/RELATORIO_SIMULACAO_PODER_2026-11-XX.md`:

1. **Dependências:** o que estava instalado, o que você instalou, versões, e o resultado do baseline de 49 testes.
2. Comando exato, réplicas, reamostragens, semente e **tempo de execução**.
3. Resultado da conferência contra `scipy` e do teste de sanidade.
4. As duas tabelas, e o ponto de cruzamento dos 80%.
5. **Defeitos que você encontrou no simulador**, se encontrou — e são bem-vindos, é para isso que este prompt existe.
6. A resposta à pergunta da §6, nos dois sentidos.
7. O que ficou pendente.

**Resposta final:** 5 a 10 linhas; as duas tabelas; o ponto de cruzamento; o que exige decisão do pesquisador.

**Fim do prompt.** Nenhuma decisão, parâmetro científico ou norma é alterado por este arquivo.
