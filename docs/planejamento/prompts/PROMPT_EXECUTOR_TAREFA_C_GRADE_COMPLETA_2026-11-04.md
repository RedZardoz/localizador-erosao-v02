# PROMPT EXECUTOR — TAREFA C: GRADE COMPLETA A 500 RÉPLICAS (P-6)

**Data:** 04/11/2026
**Branch de trabalho:** `correcoes/contencao-2026-11-02` (ponta esperada: `20b3194`)
**Depende de:** P-S (simulação de poder) e P-4 Tarefa A (atalho de monotonicidade), ambos executados.
**Natureza:** verificação numérica + retificação documental. **Não altera metodologia, limiar nem decisão.**

---

## 1. Objetivo em uma frase

Rodar a grade inteira de SD a $R = 500$ para **fechar as três inversões que a Tarefa A não cobriu** e **apertar em 2,5× o cruzamento de 80% do qual G-13 depende**, corrigindo ao mesmo tempo uma conclusão que a verificação da Tarefa A declarou em excesso.

---

## 2. Por que a Tarefa A não encerrou o assunto

A verificação da Tarefa A (`docs/verificacoes/verificacao_monotonicidade_poder_2026-11-03.md`) conclui que a hipótese de defeito está **"definitivamente refutada"** e que o item de monotonicidade está **"formalmente encerrado e comprovado"**.

A corrida foi correta e o resultado é limpo — em SD 0,30 a curva ficou estritamente decrescente (19,8% > 18,2% > 14,2% > 11,6%) e em SD 0,45 não-crescente, com a largura do IC escalando em $1/\sqrt{k}$ (razões 1,2056 e 1,2136 contra teoria 1,2247). Mas ela cobriu **apenas 2 das 9 linhas de SD**.

O Achado A-1 do prompt P-4 enumerou **seis** inversões. A Tarefa A resolveu três. **Estas três seguem sem verificação a $R = 500$:**

| SD | par | inversão em $R = 80$ |
|---:|:---|---:|
| 0,08 | `k28→k24` | 1,2 pp |
| 0,10 | `k30→k28` | 2,4 pp |
| 0,15 | `k30→k28` | 2,4 pp |

Portanto a conclusão de encerramento formal **não se sustenta sobre a evidência produzida**: ela generaliza de duas linhas de piso para a grade toda. O desfecho provável é que também sejam ruído — mas isso é previsão, não verificação, e a diferença entre as duas é o ponto da Norma.

## 3. O ganho que justifica a corrida, além da monotonicidade

G-13 hoje repousa na faixa $\text{SD} \in [0{,}11; 0{,}13]$, e a Nota de Retificação sobre Precisão Numérica registra que três casas decimais afirmariam precisão ~10× superior à sustentada, porque a $R = 80$ o erro padrão do poder é de $\pm 4{,}5$ pp.

Com $R = 500$, no entorno de 80%:

| $R$ | EP do poder | incerteza no SD de cruzamento |
|---:|---:|---:|
| 80 | 4,47 pp | $\pm 0{,}0056$ |
| **500** | **1,79 pp** | $\pm 0{,}0022$ |

Ou seja, **2,5× mais apertado** — o que torna defensável afirmar o cruzamento com precisão que hoje a nota proíbe. Esse é um resultado que o pesquisador usa; apertar o piso em SD 0,45 não era.

---

## 4. A corrida

```bash
python -u scripts/d25/poder_d25.py --replicas 500 --bootstrap 100 \
  --sd-vantagem 0.02 0.05 0.08 0.10 0.12 0.15 0.20 0.30 0.45
```

**Mantenha `--bootstrap 100`** — é o parâmetro da corrida oficial ($R = 80$, $B = 100$) e da Tarefa A. Mexer em $B$ junto com $R$ tiraria a atribuição de qualquer diferença contra a tabela publicada.

Mantenha a semente padrão `20261103`. Não passe `--seed` diferente sem registrar o motivo.

### Custo

$9 \text{ SD} \times 4\,k \times 500 = 18\,000$ réplicas.

| Ambiente | s / réplica | Tempo |
|:---|---:|---:|
| Máquina do executor (aferido do próprio relatório: 2880 réplicas em ~12 min) | 0,250 | **~75 min** |
| Contêiner de sessão (aferido em `docs/verificacoes/verificacao_custo_e_ruido_poder_d25_2026-11-03.md`) | 0,617 | ~3,1 h |

Rode em segundo plano, com `-u` como acima, para ver a tabela preenchendo linha a linha.

> A nota de retificação justificou a redução a $R = 80$ com "~2,5 h para a grade expandida". Pela medição do próprio relatório, a grade a $R = 500$ sai por **~75 min**. A corrida que foi considerada cara demais custa menos da metade do que se supôs.

### Antes da corrida longa

```bash
pip install -r scripts/d25/requirements.txt
python scripts/d25/poder_d25.py --replicas 5 --bootstrap 100 --sd-vantagem 0.12 --conferir
```

`scipy` é obrigatório — o simulador aborta sem ele, por desenho (Regra 1). A flag `--conferir` valida `spearman()` contra `scipy.spearmanr` e `diferenca_spearman()` contra a referência, com `assert` em $10^{-12}$. **No Windows, não use a flag `-I`** do Python.

---

## 5. Critério de decisão, fixado antes de ver o resultado

Limiar de 2 EP da diferença entre duas células independentes, a $R = 500$:

| Região da tabela | 2 EP |
|:---|---:|
| piso ($p \approx 0{,}15$) | 4,5 pp |
| faixa informativa ($p \approx 0{,}65$) | 6,0 pp |
| teto ($p \approx 0{,}99$) | 1,3 pp |

| Desfecho | Leitura | Ação |
|:---|:---|:---|
| Nenhuma inversão, ou todas abaixo de 1 EP | Ruído confirmado em toda a grade | Encerrar o item — agora com base na grade inteira |
| Inversão entre 1 e 2 EP, sem padrão | Indeterminado; esperado onde a curva verdadeira é plana (teto e piso) | Encerrar como compatível com curva plana; **não** declarar defeito |
| Inversão **acima de 2 EP** com padrão sistemático (mesmo sentido em linhas vizinhas) | Defeito | Investigar antes de concluir — seção 6 |

**Atenção ao teto:** em SD ≤ 0,08 o poder satura em ~100% e 2 EP vale só 1,3 pp, então inversões minúsculas ali cruzam o limiar com facilidade. Saturação não é não-monotonicidade: se as células comparadas estão ambas em 100,0%, não há ordenação a verificar. Relate o caso como teto, não como inversão.

## 6. Se for defeito — onde olhar, em ordem

Nada no gerador depende de `k`: cada polígono é construído de forma independente e `grupos = np.repeat(np.arange(k), CELULAS_POR_POLIGONO)` é remontado a cada `k`. Uma dependência verdadeira de `k` só pode vir da cobertura do IC ou de erro de indexação.

1. **Cobertura do bootstrap percentil por `k` (candidato principal).** O percentil é conhecidamente anticonservador com poucos clusters; se a cobertura real cai quando `k` cai, `lo > 0` ocorre mais vezes — exatamente o sentido das inversões. Diagnóstico: rodar com `--vantagem-media 0.0` e medir, por `k`, a taxa de `lo > 0`, que sob a nula deve ficar em ~2,5% para todo `k`. Se subir conforme `k` cai, o mecanismo está identificado — e é propriedade conhecida do método, não bug.
2. **Saturação pelo `clip`** em `scores_competidores` (`poder_d25.py:196`): `np.clip(rho_base + rng.normal(0, sd_vantagem), 0.02, 0.95)`. Com SD alto satura nos dois extremos e comprime a vantagem assimetricamente. Não deveria depender de `k`; se depender, há erro.
3. **Polígonos sem variação**: o ramo `np.unique(yj).size < 3` gera scores aleatórios.
4. **Convergência de `score_com_rho`**: busca binária com `tol = 0.004`.

Se o item 1 explicar o fenômeno, **não troque o método**: registre o mecanismo e relate. Substituir bootstrap percentil por BCa ou t-bootstrap é mudança metodológica, e isso é do pesquisador (CLAUDE.md §2).

---

## 7. Entregáveis

### 7.1 Saída bruta

Salvar a saída completa em `docs/verificacoes/`, com data, comando e ambiente no cabeçalho (Regra 8: asserção de verificação exige arquivo físico de prova). Sugestão: `verificacao_grade_completa_poder_2026-11-04.md`.

### 7.2 Corrigir a conclusão da Tarefa A

Em `docs/verificacoes/verificacao_monotonicidade_poder_2026-11-03.md`, a seção 4 declara a refutação "definitiva" e o item "formalmente encerrado" com base em 2 das 9 linhas. **Acrescente nota datada** delimitando o alcance daquela corrida (SD 0,30 e 0,45) e remetendo a esta para a grade completa. Preserve o texto original — não reescreva histórico documental.

### 7.3 Reemitir as tabelas oficiais

Em `docs/auditorias/RELATORIO_SIMULACAO_PODER_2026-11-03.md`: Tabela 1 (poder) e Tabela 2 (largura do IC) a $R = 500$, mantendo as de $R = 80$ como registro histórico e marcando claramente qual é qual. Atualizar a Nota de Retificação sobre Monotonicidade com o desfecho das seis inversões, uma por uma.

### 7.4 Atualizar G-13

Em `docs/planejamento/decisao/G-13.md`: recalcular o cruzamento de 80% por linha de `k` com a precisão de $R = 500$ e atualizar a faixa [0,11; 0,13] e a incerteza (de $\pm 0{,}0056$ para $\pm 0{,}0022$). Diga explicitamente o que mudou e o que não mudou. **Não promova a decisão nem altere limiar** — G-13 é do pesquisador.

### 7.5 Limite de alçada

Não mexer em `src/config/decisoes.ts`, em limiar, nem promover decisão a `"decidida"`. Se a corrida sugerir que algum número do registro deveria mudar: **registre e relate, não conserte** (CLAUDE.md §2).

## 8. Verificação pós-execução (CLAUDE.md §6)

```bash
npm run typecheck
npm test
npm test src/lib/seguranca/padroesProibidos.test.ts
```

Linha de base registrada: `tsc` com saída 0, 797 testes TS (3 ignorados), 55 testes Python, varredor de padrões proibidos 34/34. Relate qualquer desvio.

Observação de governança: `scripts/d25/` é **integralmente excluído** da varredura de padrões proibidos (`padroesProibidos.ts:526`). A varredura passar **não** atesta nada sobre o código desse diretório; alterações ali exigem leitura humana.

## 9. Autorização de git

CLAUDE.md §1: nenhuma operação que altere o repositório remoto ou o histórico acontece sem autorização explícita do pesquisador, dada na conversa, para aquela operação. Autorização é específica e não se estende.

O preenchimento deste bloco é do pesquisador. **Quem redigiu este prompt não pode preenchê-lo.**

```
Commit autorizado:   [ ] sim   [ ] não        Data: ____/____/______
Push autorizado:     [ ] sim   [ ] não        Branch: _______________________
Assinatura: ______________________________
```

Sem este bloco preenchido: escreva os arquivos na árvore de trabalho, informe os caminhos completos ao pesquisador e **pare**. Se o Stop hook exigir commit ou push, relate em uma linha que ele está bloqueando e qual operação exige, e espere — a exigência do hook não é autorização.
