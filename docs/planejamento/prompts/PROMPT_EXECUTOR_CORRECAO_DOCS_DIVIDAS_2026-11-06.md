# PROMPT EXECUTOR — CORREÇÃO DE DOIS DEFEITOS FACTUAIS NOS DOCUMENTOS DE DÍVIDAS (P-8)

**Data:** 06/11/2026
**Branch de trabalho:** `correcoes/contencao-2026-11-02` (ponta esperada: `7142b88`)
**Alvo:** os três documentos de decisão de 05/11 em `docs/auditorias/DeepSeek/`.
**Natureza:** correção factual pontual. **Não roda simulação, não altera código, metodologia, limiar nem decisão.**

---

## 1. Objetivo em uma frase

Os documentos de dívidas são bons e as recomendações deles **permanecem válidas** — mas carregam dois erros de fato que, se não forem corrigidos, chegam à reunião com o orientador e daí à dissertação.

## 2. Regra de ouro

Corrigir **apenas** os números e o identificador listados abaixo. **Nenhuma recomendação muda**, nenhum veredito muda, nenhuma redação de análise é reescrita. Em particular, a recomendação de M-09 (opção C) continua a mesma: só os valores que a sustentam é que estavam desatualizados.

Não há gerador versionado para estes três arquivos — são entregáveis externos. Edite os arquivos diretamente (`python-docx` e `python-pptx` estão disponíveis), preservando formatação, estilos e a estrutura dos slides.

---

## 3. Defeito 1 — O DOI de Riley está invertido (três arquivos)

### O fato

| DOI | Parte | Desfecho | Páginas |
|:---|:---|:---|:---|
| `10.1002/sim.7993` | **Parte I** | **contínuos** | 38(7):1262–1275 |
| `10.1002/sim.7992` | **Parte II** | binários e tempo-até-evento | 38(7):1276–1296 |

Os documentos emparelham **a faixa de páginas correta da Parte I** com **o DOI da Parte II**. Verificado em três fontes independentes: registros institucionais da Parte I (p. 1262–1275), registros da Parte II (p. 1276–1296) e a lista de referências do pacote R `pmsampsize`, que cita `sim.7993` para contínuos e `sim.7992` para binários.

Como `7992 < 7993` e "Parte I" vem antes de "Parte II", a inversão é intuitiva — e é exatamente por isso que passa despercebida.

### Onde corrigir

**3.1 — `dividas-bibliograficas-metodologicas-05_11_26.docx`**, lista de referências:

- De: `... Part I — continuous outcomes. Statistics in Medicine, v. 38, n. 7, p. 1262–1275, 2019. DOI: 10.1002/sim.7992.`
- Para: o mesmo, com **`DOI: 10.1002/sim.7993`**.

**3.2 — `estado-projeto-05_11_26.docx`**, lista de referências: mesma linha, mesma correção.

**3.3 — `estado-projeto-05_11_26.pptx`**, **slide 23**:

- De: `RILEY et al. (2019). Sample size for prediction models — Part I. DOI 10.1002/sim.7992.`
- Para: `RILEY et al. (2019). Sample size for prediction models — Part I. DOI 10.1002/sim.7993.`

### 3.4 — A afirmação de M-05 sobre o inventário é falsa e precisa sair

Em `dividas-bibliograficas-metodologicas-05_11_26.docx`, o item M-05 afirma:

> "Riley (2019, Parte I) é a fonte correta para desfecho contínuo. **O inventário cita a Parte II.**"

A segunda frase está errada. Conferido no repositório:

- `docs/bibliografia/INVENTARIO_SELECAO_BIBLIOGRAFICA.md`, linha 406: cita `10.1002/sim.7993` — que **é** a Parte I, a correta;
- `src/config/decisoes.ts`, linha 455 (referência de D24): cita `Statistics in Medicine 38(7):1262-1275` — faixa de páginas **da Parte I**, também correta.

Ou seja, **o inventário já está certo**; quem errou foi a auditoria. O único lugar do projeto que menciona "PART II" é `docs/planejamento/PROMPT_EXECUCAO_DESENHO_CONSOLIDADO_2026-09-27.md`, linha 218, documento histórico de planejamento e sem DOI.

**Ação:** remover a frase "O inventário cita a Parte II" e, no lugar, registrar que o inventário e o registro de decisões **já citam a Parte I corretamente**, e que a dívida de D24 é **metodológica, não bibliográfica**: o problema é usar o critério de 200 EPV de van der Ploeg, que é de desfecho dicotômico, para um alvo contínuo. A recomendação de M-05 (Riley Parte I como primário, 200 EPV como sensibilidade) **continua válida e não muda**.

> **Importante:** sem esta correção, executar M-05 ao pé da letra faria trocar um DOI correto por um errado — cometendo justamente a falha que a auditoria denuncia.

---

## 4. Defeito 2 — Os números de poder estão desatualizados (dois arquivos)

### O fato

Os documentos são de **05/11**. A grade completa a $R = 500$ foi consolidada em `81b2e0f` no dia **04/11**, substituindo a corrida preliminar de $R = 80$. Os dois documentos citam a tabela antiga.

### 4.1 — `dividas-bibliograficas-metodologicas-05_11_26.docx`, item M-09

- De: *"36 clusters dão 100% de poder se a vantagem for homogênea (DP ≤ 0,10), 70% em DP 0,15 e 32,5% em DP 0,20."*
- Para, com os valores vigentes de $R = 500$ em $k = 36$: **98,0%** em DP 0,10; **63,2%** em DP 0,15; **32,4%** em DP 0,20.

Na tabela de opções do mesmo item, a opção B diz *"Aumenta clusters ou aceita 70%"*. Trocar **70%** por **63,2%**.

A diferença em DP 0,15 é de quase 7 pp e não é cosmética: 70% soa marginal, 63,2% soa subdimensionado. **A recomendação (opção C) não muda** — se algo, fica mais bem fundamentada.

### 4.2 — `estado-projeto-05_11_26.docx`, tabela de poder

A tabela atual traz as colunas $k = 36$, $k = 28$ e $k = 24$ com valores de $R = 80$. Substituir integralmente pelos valores de $R = 500$:

| Desvio-padrão da vantagem | 36 clusters | 28 clusters | 24 clusters |
|---:|:---:|:---:|:---:|
| 0,10 | 98,0% | 94,8% | 93,8% |
| 0,12 | 85,8% | 83,0% | 77,2% |
| 0,15 | 63,2% | 54,0% | 52,2% |
| 0,20 | 32,4% | 29,8% | 30,0% |

Acrescentar à legenda ou nota de rodapé: valores de $R = 500$ réplicas, $B = 100$, conforme `docs/verificacoes/verificacao_grade_completa_poder_2026-11-04.md`.

> **Não "conserte" a última linha.** Em SD 0,20, $k{=}28$ (29,8%) é menor que $k{=}24$ (30,0%). A inversão é real na tabela e está **dentro do ruído** (0,07 EP da diferença): no piso de poder a curva verdadeira é plana e a ordenação entre cenários não é estimável. Transcreva como está.

### 4.3 — Verificar se o mesmo número aparece em outro lugar

O `.pptx` não contém tabela de poder — apenas a referência do slide 23 (item 3.3). Ainda assim, faça uma varredura nos três arquivos por `70,0`, `70%`, `100%`, `32,5` e `86,2` e corrija qualquer outra ocorrência da tabela antiga que apareça.

---

## 5. O que NÃO mudar

- Nenhuma recomendação, veredito, nível de prioridade, estimativa de esforço ou critério de aceite.
- O conteúdo analítico de M-05 e M-09 fora das frases citadas.
- A estrutura, a formatação, os estilos e a ordem dos slides.
- As demais referências das listas: conferi apenas a de Riley; as outras não foram objeto desta verificação e não devem ser mexidas.

## 6. Limites de alçada (CLAUDE.md §2 e §2-A)

- Nunca invente, infira de memória ou extrapole referência. Os valores deste prompt vêm de verificação externa (DOI) e da saída já arquivada em `81b2e0f` (poder).
- Não alterar `src/config/decisoes.ts`, limiar, estado de decisão, nem o inventário bibliográfico — que, neste ponto, **já está correto**.
- Não decidir G-01, G-08, G-12, G-13 nem G-15.

## 7. Entregáveis

1. Os três arquivos corrigidos em `docs/auditorias/DeepSeek/`.
2. Nota curta de correção — em `docs/auditorias/` ou ao fim de cada documento — registrando os dois defeitos, a data e a evidência, para que a versão corrigida seja distinguível da que circulou.
3. Relato explícito de qualquer outra ocorrência encontrada na varredura do item 4.3.

## 8. Verificação pós-execução

```bash
npm run typecheck
npm test
npm test src/lib/seguranca/padroesProibidos.test.ts
```

Esta tarefa é documental e não deve alterar nenhum desses resultados; qualquer desvio indica que algo além dos três arquivos foi tocado. Linha de base: `tsc` com saída 0, 797 testes TS (3 ignorados), 55 testes Python, varredor 34/34.

Confira também, relendo os arquivos salvos, que: não resta nenhuma ocorrência de `sim.7992` associada à Parte I; a tabela de poder de `estado-projeto` traz os oito valores novos; e os arquivos continuam abrindo corretamente no Word e no PowerPoint.

## 9. Autorização de git

CLAUDE.md §1: nenhuma operação que altere o repositório remoto ou o histórico acontece sem autorização explícita do pesquisador, dada na conversa, para aquela operação. Autorização é específica e não se estende.

O preenchimento deste bloco é do pesquisador. **Quem redigiu este prompt não pode preenchê-lo.**

```
Commit autorizado:   [ ] sim   [ ] não        Data: ____/____/______
Push autorizado:     [ ] sim   [ ] não        Branch: _______________________
Assinatura: ______________________________
```

Sem este bloco preenchido: escreva os arquivos na árvore de trabalho, informe os caminhos completos ao pesquisador e **pare**. Se o Stop hook exigir commit ou push, relate em uma linha que ele está bloqueando e qual operação exige, e espere — a exigência do hook não é autorização.
