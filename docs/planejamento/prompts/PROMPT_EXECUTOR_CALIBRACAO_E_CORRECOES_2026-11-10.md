# PROMPT F — EXECUTOR SAREL — 10/11/2026
## Quatro correções do E′ + calibração de 30 pontos de Ê

**O E′ foi bem executado.** O artefato do universo, a trava do sorteio com meta-teste de ponta a
ponta, a recusa em inventar timestamps ausentes e a seção de escopo negativo estão corretos e
ficam. Este prompt corrige quatro pontos e faz a medição que o universo agora permite.

---

## 0. LEITURA OBRIGATÓRIA

1. `docs/DESENVOLVIMENTO.md` integralmente.
2. `docs/verificacoes/2026-11-10_universo_candidatos_e_reprodutibilidade.md` — o que você vai corrigir.
3. `src/lib/seguranca/credenciaisSeguras.ts` — Regra C1.
4. `npm run estado:verificar`.

Informe o branch e permaneça nele. **Vale o PROTOCOLO ANTI-FABRICAÇÃO do Prompt C (§1)**: saída de
comando vai para `docs/verificacoes/execucao/2026-11-10f/` e é citada por caminho.

**Mensagem de commit escrita depois do fato**, descrevendo o que aconteceu.

---

## AVISO OPERACIONAL — ao contrário do E′, agora a credencial É necessária

As Tarefas 1 a 4 rodam sem credencial. **A Tarefa 5 exige** `SAREL_GEE_SERVICE_ACCOUNT_FILE`
definida, apontando para o JSON **fora da árvore do repositório** (Regra C1, via de lote).

**NÃO rode `scripts/remedir_candidatos_bp3_d16.ts` com a credencial definida.** Aquele pipeline,
na linha 411, mede Ê de **todos** os candidatos com terreno em blocos de 100 — seria a ingestão
dos 680 por acidente, antes de o desenho do lote estar decidido e com a guarda de D11.2 ainda
inativa. A Tarefa 5 usa o CLI dedicado, não o pipeline.

---

## TAREFA 1 — corrigir a força da afirmação de reprodutibilidade

Em `docs/verificacoes/2026-11-10_universo_candidatos_e_reprodutibilidade.md`, a seção
**Veredito Científico** afirma:

> "O funil amostral do SAREL v2.0 é demonstradamente 100% determinístico e reproduzível. [...]
> Esta propriedade fica formalmente estabelecida para citação na dissertação de mestrado."

A primeira metade é verdadeira; a segunda vai além do que a execução provou. A saída do próprio
pipeline registra, na etapa 5:

```
-> Cache pedológico carregado: 677 registros válidos em ...cache_pedologia_bp3.json
-> Consultando WFS Embrapa GeoInfo para 3 candidatos pendentes...
```

O `candidatosValidosPedologia = 677` reproduziu porque o cache contém exatamente esses 677. As
etapas 1 e 2 vieram do mesmo arquivo SQLite; a 3, dos mesmos GeoTIFFs locais. **Todas as seis
etapas foram servidas por cache ou arquivo local.**

**Reescreva o veredito** separando as duas afirmações:

- **Provado:** determinismo computacional. Mesmas entradas produzem as mesmas saídas, dígito por
  dígito, 41 dias depois e em outro processo. Isso descarta aleatoriedade oculta, dependência de
  ordem de iteração, semente não inicializada, não-idempotência de P07 e não-determinismo de ponto
  flutuante no thinning. Diga que isso **não é trivial** e nomeie o que descarta.
- **Não provado nesta rodada:** estabilidade das fontes externas — snapshot do SICAR, WFS da
  Embrapa, versão do WorldCover. O teste não detectaria mudança em nenhuma delas.
- Redação sugerida para a frase citável: *"determinismo computacional do funil comprovado em
  10/11/2026 contra a execução de 30/09/2026, sobre as mesmas fontes locais auditadas; a
  estabilidade das fontes externas foi testada por amostragem na Tarefa 2 deste prompt."*

Ajuste a última cláusula ao que a Tarefa 2 de fato achar.

---

## TAREFA 2 — testar a estabilidade da fonte externa por amostragem

Converte a afirmação fraca em forte, ao custo de 30 chamadas.

Crie `scripts/auditoria/conferir_estabilidade_wfs_embrapa.mjs` (ou `.ts`, conforme o idioma dos
demais) que:

1. Sorteia **30 dos 677** candidatos do artefato
   `docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json`, com PRNG determinístico e
   **semente declarada** — use o `criarPrng` existente, não `Math.random`.
2. Reconsulta o WFS da Embrapa GeoInfo para esses 30, pelo mesmo caminho que o pipeline usa
   (`queryEmbrapaSoil`), **sem** ler o cache.
3. Compara, por candidato, `nivelK`, `classeErodibilidade` e `kSolos` contra o que está no cache
   `docs/verificacoes/cache_pedologia_bp3.json`.
4. Emite tabela com `iguais`, `divergentes` e `sem_resposta`, e lista cada divergência com os dois
   valores lado a lado.
5. Grava `FONTE_DOS_DADOS` no cabeçalho e **nunca** escreve no cache — é leitura e comparação.

**Interpretação, a registrar na evidência:**

- 30/30 iguais: a fonte se manteve estável na amostra; a afirmação citável pode incluir isso,
  **declarando que é amostra de 30 em 677**, não censo.
- Qualquer divergência: **achado**, não falha. Relate quantas, quais campos, e se o padrão sugere
  atualização da carta, instabilidade do serviço ou erro de correspondência espacial. **Não
  atualize o cache** nesta rodada — a decisão de reconciliar é do pesquisador.
- Sem resposta do serviço: relate e **não** conclua estabilidade. Serviço fora do ar não é
  evidência de nada.

---

## TAREFA 3 — data fixa no cabeçalho do pipeline

`scripts/remedir_candidatos_bp3_d16.ts` imprime no cabeçalho `Data: 30/09/2026`, fixo no código.
A execução de 10/11 saiu com essa data. É rótulo de proveniência que mente — mesma família do
`DEFINICAO_METRICA_SOLO_NU` corrigido no Prompt D.

Troque pela data real da execução. Varra o arquivo por outras datas fixas no mesmo padrão e
corrija-as; grave a varredura conforme o protocolo.

---

## TAREFA 4 — remover o fallback silencioso do CLI de medição

`scripts/medir_frequencia_solo_nu_lote.ts:131-152`: quando o arquivo de candidatos não traz a lista
individual, o CLI **substitui silenciosamente** o universo por
`docs/verificacoes/fontes/wfs_erodibilidade/medicao_w2_candidatos_bp3_2026-09-28.json`, um pool de
90 pontos de outra medição, emitindo apenas um aviso.

Foi exatamente isso que, no Prompt D, fez a calibração sortear de 90 pontos em vez do universo real
— e o aviso passou despercebido no relatório. **Substituir o universo amostral em silêncio é o
oposto de fail-closed**, e agora que o universo real existe não há razão para o fallback.

**Conserto:** o CLI **falha** com erro explícito quando o arquivo indicado não contém lista
individual de candidatos, nomeando o arquivo esperado. Remova o fallback. Acrescente teste que
prova a recusa ao receber um arquivo só com agregados.

---

## TAREFA 5 — calibração de 30 pontos de Ê

Agora com o universo real e a credencial definida.

### 5.1 Execução

```
node --import ./scripts/ts-loader.mjs scripts/medir_frequencia_solo_nu_lote.ts \
  --candidatos docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json \
  --limite 30 --semente 20261110
```

- Sorteie dos **677** (chave `candidatos` do artefato), que é o universo elegível para
  estratificação — não dos 680.
- `--tamanho-bloco` fica no padrão **1**, que dá latência por ponto, que é o objetivo.
- **Confirme no relatório que o fallback não disparou** e que a fonte foi o artefato indicado.

### 5.2 O que registrar

| Métrica | Por quê |
|---|---|
| `tempoPorPontoMs`: **mediana, p95 e máximo** | a cauda decide se 680 termina |
| `tempoTotalMs` | projeção direta |
| pontos com Ê medido / `indisponivel`, por causa | taxa de falha real |
| requisições ao GEE e erros HTTP, por código | 429/quota muda o desenho do lote |
| **`nObservacoes` por ponto: mediana, mínimo e quantos ficaram com n < 12** | ver 5.3 |

### 5.3 A pergunta científica desta rodada

A máscara GEOS3 é muito mais restritiva que o `NDVI < 0,25` que havia antes: cinco testes em
conjunção, com `NBR2 ≤ 0,075`, que é estreito. **Quantos pontos ficam abaixo das 12 observações de
D11.2?** Se a fração for alta, Ê fica estatisticamente frágil e a guarda do Prompt H vai barrar
parte relevante do universo — o que é um problema de desenho, não de código, e precisa aparecer
agora, nos 30, não depois de 680 medições.

Registre o número explicitamente. É o resultado mais importante desta rodada.

### 5.4 O cache materializa

Com a medição, `docs/verificacoes/cache_frequencia_solo_nu_bp3.json` passa a existir e **não está
no `.gitignore`**. O relatório do Prompt D declarou que ele seria versionado "assim que
materializado". **Execute essa decisão agora**: versione-o e diga no relatório, ou acrescente ao
`.gitignore` e justifique. Não adie de novo.

### 5.5 Projetar os 680 — relatar, não decidir

Com os números, apresente: projeção para 680 por mediana e por p95; taxa e códigos de erro; e sua
recomendação em uma frase com o número que a sustenta. A escolha entre rodada única e blocos
retomáveis é do pesquisador.

**Não rode os 680 nesta rodada**, mesmo que a projeção pareça confortável.

---

## TAREFA 6 — evidência e commit

`docs/verificacoes/2026-11-10f_calibracao_e_estabilidade_fontes.md`, contendo: o veredito
reescrito da Tarefa 1; a tabela da Tarefa 2 com interpretação; as métricas da Tarefa 5 com o número
de 5.3 em destaque; a projeção de 5.5; e o que **não** foi feito.

Mensagem de commit escrita após o fato. Se a Tarefa 5 não rodar por qualquer motivo, a mensagem
diz isso e não afirma calibração.

---

## CHECKLIST

Cada item cita o arquivo gravado em `docs/verificacoes/execucao/2026-11-10f/`:

- [ ] Branch: ______
- [ ] T1 — veredito reescrito separando provado de não provado
- [ ] T2 — 30 consultas ao WFS; iguais: ___ divergentes: ___ sem resposta: ___; cache **não** alterado
- [ ] T3 — data fixa corrigida; varredura de outras datas fixas gravada
- [ ] T4 — fallback removido; CLI falha com erro explícito; teste da recusa passa
- [ ] T5 — fallback **não** disparou; fonte foi o artefato do universo
- [ ] T5 — mediana / p95 / máximo de `tempoPorPontoMs`: ______
- [ ] T5 — **pontos com `nObservacoes` < 12, de 30**: ______
- [ ] T5 — destino do cache no Git executado (versionado ou ignorado), não adiado
- [ ] T5 — os 680 **não** foram rodados
- [ ] T6 — evidência escrita; commit descreve o que aconteceu
- [ ] `npm test` e `npx tsc --noEmit` gravados
- [ ] `npm run estado:verificar`, `git status --short`, `git log --oneline -3` gravados
