# PROMPT D — EXECUTOR SAREL — retomada da ingestão de Ê
## Calibração de 30 pontos antes do lote de 680

**Objetivo.** Destravar a dimensão Ê, que está `BLOQUEADO` desde 30/09/2026
(`ESTADO.md`: `candidatosComSoloNuMedido: 0`), medindo primeiro **30 pontos** para obter
`tempoPorPontoMs` real, e só então decidir o desenho do lote de 680.

**Os 30 pontos são calibração de infraestrutura, não amostra científica.** Eles não entram no
treino, não alteram D16 e não povoam estrato nenhum. Servem para medir tempo e taxa de falha.

---

## 0. LEITURA OBRIGATÓRIA

1. `docs/DESENVOLVIMENTO.md` integralmente (9 Regras Invioláveis).
2. `src/lib/seguranca/credenciaisSeguras.ts` — a **Regra C1**, e só ela, define como a credencial entra.
3. `docs/planejamento/ESTADO.md`.
4. Rodar `npm run estado:verificar` e conferir.

Informe o branch (`git branch --show-current`) e permaneça nele.

**Vale integralmente o PROTOCOLO ANTI-FABRICAÇÃO do Prompt C (§1).** Toda saída de comando vai
para `docs/verificacoes/execucao/2026-11-09d/` e é citada por caminho, nunca transcrita. Tarefa não
concluída é declarada como não concluída.

---

## 1. CREDENCIAL — Regra C1, via de lote

A ingestão por CLI usa a **via de lote**: a variável de ambiente
`SAREL_GEE_SERVICE_ACCOUNT_FILE` contendo o **CAMINHO** de um arquivo JSON **fora da árvore do
repositório**.

- **Nunca** cole o conteúdo da chave em variável, em arquivo do projeto, no relatório ou no chat.
- `validarCaminhoArquivoCredencial` **recusa** qualquer caminho que resolva dentro do repositório,
  e recusa valores que comecem com `{` ou contenham `private_key`. Isso é proposital; não contorne.
- Se a credencial não estiver disponível, **pare e relate**. Não simule, não gere número algum.

---

## 2. POR QUE AS DUAS TENTATIVAS ANTERIORES FALHARAM

As duas falhas foram de infraestrutura, não de método:

1. `next start` servindo build obsoleto;
2. `404` em `select-candidates` vindo de um servidor que já havia morrido.

**A via desta rodada não usa o servidor Next.** O caminho é CLI, com credencial por variável de
ambiente. Se ainda assim você precisar do servidor para algo, rode `npm run check:build` antes —
esse guarda existe exatamente para a falha (1).

---

## TAREFA 1 — corrigir a definição da métrica (BLOQUEANTE, antes de medir qualquer coisa)

`src/lib/gee/amostragemSoloNuLote.ts:32`:

```ts
export const DEFINICAO_METRICA_SOLO_NU =
  "s2_sr_harmonized_2016_2026_ndvi_lt_0.25_worldcover_v100_v200";
```

Esta string **não foi atualizada** quando a máscara passou a ser a conjunção GEOS3. Ela ainda
descreve a regra antiga (`ndvi_lt_0.25`, só NDVI, operador estrito). E `calcularHashDefinicao`
(`:96`) faz o hash **apenas desta string**. Como o cache de Ê é invalidado pela divergência desse
hash, **ele não invalidaria**: medições sob a regra antiga seriam reaproveitadas como se fossem da
máscara nova. A string é também o rótulo de proveniência da métrica, e hoje ela é falsa.

**Confirmado em 09/11/2026 que o cache ainda não existe** (`docs/verificacoes/cache_frequencia_solo_nu_bp3.json`
ausente aqui e ausente do `git_status.txt` da rodada C). Corrija agora, enquanto custa zero.

### 1.1 Derivar a string dos parâmetros, para nunca mais divergir

Não escreva a string à mão. **Construa-a** a partir de `DECISOES.D10`, de modo que qualquer mudança
futura de limiar mude o hash automaticamente. Por exemplo:

```ts
export const DEFINICAO_METRICA_SOLO_NU = [
  "s2_sr_harmonized",
  INTERVALO_COMPOSICAO_D05.replace(/\s+a\s+/, "_"),
  "geos3_dematte2018",
  `ndvi_${LIMIAR_NDVI_SOLO_NU_MIN_D10}_${LIMIAR_NDVI_SOLO_NU_D10}`,
  `nbr2_${LIMIAR_NBR2_SOLO_NU_MIN_D10}_${LIMIAR_NBR2_SOLO_NU_MAX_D10}`,
  "incl_b4b3_b3b2",
  "worldcover_v100_v200",
].join("_");
```

Ajuste à realidade do arquivo; o que importa são as três propriedades:
(a) os quatro limiares entram na string; (b) a máscara é nomeada (`geos3_dematte2018`) e as duas
inclinações aparecem; (c) nada é digitado à mão que possa divergir dos parâmetros.

### 1.2 Trava obrigatória

Em teste novo ou existente:

1. a string contém os quatro valores de `exigirParametro(DECISOES.D10, ...)`;
2. **meta-teste**: alterando um limiar (via objeto construído no teste, sem tocar em `decisoes.ts`),
   `calcularHashDefinicao` produz hash **diferente**. É este que prova que a invalidação funciona;
3. a string **não** contém `ndvi_lt_0.25` nem qualquer resquício da regra antiga.

---

## TAREFA 2 — CLI dedicado de medição de Ê

Hoje a medição de Ê só existe dentro de `scripts/remedir_candidatos_bp3_d16.ts`, que roda o
pipeline amostral inteiro (thinning, terreno, pedologia, ponto elegível) e **não aceita argumento
algum** — não há como pedir 30 pontos. Rodar aquilo para calibrar tempo seria desproporcional.

Crie `scripts/medir_frequencia_solo_nu_lote.ts`, que faz **só** a medição de Ê:

### 2.1 Entrada

Lê a lista de candidatos de `docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json`
(artefato de 30/09, já no repositório). **Confirme antes** quantos candidatos ele traz e qual é o
campo de id/lat/lon, gravando a inspeção conforme o protocolo. Não presuma a forma do arquivo.

### 2.2 Argumentos

- `--limite N` — mede no máximo N pontos. **Obrigatório** declarar o subconjunto:
  use o PRNG determinístico já existente (`criarPrng`, em `src/lib/gee/estratificacao.ts`) com
  **semente fixa e declarada**, não "os N primeiros" — a ordem do arquivo não é aleatória e
  enviesaria a calibração para uma região.
- `--retomar` — reaproveita o cache existente e mede só o que falta.
- `--saida <caminho>` — arquivo de evidência; padrão em `docs/verificacoes/`.
- Sem `--limite`, mede todos.

### 2.3 Comportamento inviolável

- Usa `carregarCredenciaisServiceAccountLote` (Regra C1). **Recusa-se a rodar sem credencial real**,
  com erro que nomeia a Regra C1.
- Usa o cache (`carregarCacheFrequenciaSoloNu` / `salvarCacheFrequenciaSoloNu`) e o diário de
  requisições (`criarDiarioRequisicoes` / `salvarDiarioRequisicoes`).
- **Jamais** emite número simulado. Falha de ponto é `indisponivel` com causa, **nunca** `0`.
  (Regra 1 / Invariante 5: `Ê = 0` é medida real e legítima; `Ê` ausente é `indisponivel`. Não
  confunda os dois — é a distinção que esta dimensão inteira depende.)
- Grava `FONTE_DOS_DADOS` no cabeçalho da saída, como os demais scripts de auditoria.
- Salva o cache **incrementalmente**, a cada bloco, não só no fim. Se a rodada morrer no ponto 600,
  os 599 anteriores têm de sobreviver.

### 2.4 O que medir, além de Ê

A calibração existe para decidir o desenho do lote de 680. Portanto registre:

| Métrica | Por quê |
|---|---|
| `tempoPorPontoMs` — **mediana, p95 e máximo**, não só a média | a cauda é que decide se 680 termina |
| `tempoTotalMs` da rodada | projeção direta |
| nº de pontos com `Ê` medido / `indisponivel`, por causa | taxa de falha real |
| nº de chamadas ao GEE e nº de erros HTTP, por código | se há 429/quota, o desenho muda |
| `nObservacoes` por ponto — mediana e mínimo | quantas cenas válidas a máscara nova deixa passar |

A última linha é a mais importante cientificamente: a máscara GEOS3 é **bem mais restritiva** que o
NDVI isolado que havia antes. Se a mediana de `nObservacoes` por ponto cair demais, Ê fica
estatisticamente frágil, e isso precisa aparecer **agora**, não depois dos 680.

---

## TAREFA 3 — rodar os 30 pontos

```
npm run build   # ou garanta que nao ha build obsoleto; o CLI nao usa o servidor, mas o typecheck importa
npx tsc --noEmit
```

Depois, com a credencial exportada conforme §1:

```
node --import ./scripts/ts-loader.mjs scripts/medir_frequencia_solo_nu_lote.ts --limite 30
```

Grave a saída completa conforme o protocolo, em
`docs/verificacoes/execucao/2026-11-09d/rodada_30_pontos.txt`.

**Se a rodada falhar**, grave a saída do erro e **pare**. Não tente contornar com outra via, não
reduza o número de pontos por conta própria e não invente resultado parcial. Relate: em que ponto
parou, qual erro, e quantos pontos ficaram no cache.

---

## TAREFA 4 — projetar o lote de 680 (relatar, não decidir)

Com os números da Tarefa 3, apresente — **sem escolher**:

1. Projeção de tempo para 680 pontos usando **mediana** e usando **p95**, e a diferença entre as duas.
2. Se a rodada de 30 teve qualquer erro HTTP, a taxa e os códigos.
3. A pergunta em aberto, que é da decisão do pesquisador: **o lote de 680 roda de uma vez, ou em
   blocos retomáveis?** Lembre que `amostragemSoloNuLote.ts` já tem `TAMANHO_BLOCO_PADRAO = 100` e
   que a concorrência interna é de 15 requisições paralelas — ou seja, o que existe hoje é um laço
   paralelo de requisições por ponto, não um lote verdadeiro do lado do servidor.
4. Sua recomendação técnica em uma frase, com o número que a sustenta.

**Não rode os 680 nesta rodada**, mesmo que a projeção pareça confortável.

---

## TAREFA 5 — evidência (Regra 8) e commit

### 5.1 `docs/verificacoes/2026-11-09d_calibracao_30_pontos_solo_nu.md`

1. A correção da definição da métrica e por que ela era bloqueante.
2. A semente do PRNG e os 30 ids sorteados — reprodutibilidade.
3. A tabela de métricas da Tarefa 2.4, com os números medidos.
4. A projeção da Tarefa 4 e a pergunta em aberto.
5. Declaração explícita de que **os 30 pontos são calibração de infraestrutura** e não entram em
   treino, estrato ou sorteio.
6. Se algo falhou: o quê, onde, e o que ficou no cache.

### 5.2 Commit

```
feat(E-hat): corrigir definicao da metrica e medir calibracao de 30 pontos

- DEFINICAO_METRICA_SOLO_NU passa a ser derivada dos parametros de D10; a string
  anterior ainda descrevia a regra antiga (ndvi_lt_0.25) e teria impedido a
  invalidacao do cache apos a adocao da mascara GEOS3
- novo CLI medir_frequencia_solo_nu_lote.ts, com --limite, --retomar e --saida,
  credencial pela via de lote da Regra C1 e cache incremental
- calibracao de 30 pontos medida; tempo por ponto, taxa de falha e nObservacoes
  por ponto registrados para decidir o desenho do lote de 680

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0124eRLv8s4zYkBWGYtYdZXZ
```

`git push -u origin <branch-atual>`.

**Atenção:** o cache `docs/verificacoes/cache_frequencia_solo_nu_bp3.json` **não** está no
`.gitignore`. Decida e declare: se entrar no Git, ele é evidência versionada e cresce a cada
rodada; se não, acrescente-o ao `.gitignore` e diga no relatório. Não deixe a decisão implícita.

---

## CHECKLIST

Cada item cita o arquivo gravado em `docs/verificacoes/execucao/2026-11-09d/`:

- [ ] Branch: ______
- [ ] T1 — `DEFINICAO_METRICA_SOLO_NU` derivada dos parâmetros; não contém `ndvi_lt_0.25`
- [ ] T1 — meta-teste prova que alterar um limiar muda `calcularHashDefinicao`
- [ ] T2 — CLI criado; forma real do JSON de candidatos inspecionada e gravada
- [ ] T2 — recusa sem credencial, testada e gravada
- [ ] T2 — cache salvo incrementalmente (por bloco), não só no fim
- [ ] T3 — 30 pontos medidos; saída gravada. Se falhou: onde e por quê: ______
- [ ] T3 — mediana, p95 e máximo de `tempoPorPontoMs`: ______
- [ ] T3 — mediana e mínimo de `nObservacoes` por ponto: ______
- [ ] T4 — projeção para 680 por mediana e por p95; recomendação em uma frase
- [ ] T4 — os 680 **não** foram rodados
- [ ] T5 — evidência escrita; destino do cache no Git declarado
- [ ] `npm test` — saída gravada
- [ ] `npm run estado:verificar`, `git status --short` e `git log --oneline -3` gravados
