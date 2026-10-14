# Autorização da FASE A0, com correções obrigatórias, e o comando de sorteio (FASE A1)

**Data:** 28/09/2026
**Natureza:** resposta à sua declaração de escopo (PARTE V, item 3 do `PROMPT_ADENDO_PORTAO_FECHADO_FASE_A0_2026-09-27.md`), mais a **FASE A1**, nova.
**Veredito:** **FASE A0 autorizada**, no escopo declarado, **condicionada às cinco correções da PARTE I**. Elas não são estilo: três delas fariam a execução falhar, e uma poria número errado dentro de um teste.

Sua declaração foi verificada de forma independente. O que estava certo, e é a maior parte, fica registrado: a reprodução do estado inicial (40 arquivos / 288 testes) confere; **as sete âncoras da sua seção 2 estão todas exatas**, inclusive `invariantes.ts:30-52`, que eu não havia conferido; e a **conclusão** da Tarefa 1 é correta.

---

# PARTE I — CINCO CORREÇÕES OBRIGATÓRIAS

## C1 — A tabela de distorção está errada em 15 das 20 linhas. A conclusão, não.

Recomputei os 20 segmentos de forma independente, com `pyproj`, geodésica sobre GRS80 e projeção em EPSG:31982, isolando `PROJ_LIB`.

**Sua conclusão está confirmada:** distorção máxima recomputada **+0,1237%** (em S02), contra os +0,1233% que você relatou. Muito abaixo dos 0,5% de D15. **`EPSG:31982` fica confirmado e mantido** em `src/lib/gee/terreno.ts:24`.

Mas apenas **S01 a S05 conferem**. Os outros 15 divergem, e o erro **cresce sistematicamente de oeste para leste**:

| Segmento | Recomputado | Relatado por você | Erro |
|---|---|---|---|
| S01–S05 | +0,1232 a +0,1201% | +0,1233 a +0,1186% | < 0,002 pp — ok |
| S06 | +0,1118% | +0,1045% | +0,007 pp |
| S13 | +0,0953% | +0,0755% | +0,020 pp |
| S15 | +0,0526% | +0,0123% | +0,040 pp |
| **S18** | **+0,0356%** | **−0,0356%** | **+0,071 pp — sinal invertido** |
| S19 | +0,0459% | +0,0026% | +0,043 pp |

A S18 é a mais reveladora: magnitude idêntica, **sinal trocado**. Não é ruído numérico; é erro de método. O padrão crescente para leste sugere que os cinco segmentos ocidentais foram calculados e os demais interpolados ou estimados.

**Por que isto importa muito mais do que parece.** Você propôs, com razão, criar `src/lib/gee/terreno.test.ts` asseverando os 20 segmentos. Com esta tabela, o teste **fixaria 15 valores errados como verdade de referência** — e um teste que assevera número errado é pior que teste ausente, porque transforma o erro em invariante protegido.

**O que fazer:**

1. **Recompute os 20 segmentos**, com biblioteca geodésica de verdade, e não por fórmula fechada digitada à mão.
2. O teste **não** deve asseverar valor por segmento. Deve asseverar **três propriedades**, que são o que a decisão realmente exige:
   - a distorção máxima sobre todos os segmentos é **inferior a 0,5%** (o critério de D15);
   - o **sinal é positivo em toda a bacia** — consequência de que a bacia inteira está a mais de 1,79 grau do meridiano central de −51 graus, onde `k` já passou de 1; é exatamente essa propriedade que a sua S18 violava;
   - a distorção **cresce monotonicamente com a distância ao meridiano central**, o que é uma propriedade física da projeção e falha ruidosamente se alguém errar a conta.
3. Se ainda quiser tabela por segmento, ela vai para o **relatório e para o pacote de reprodutibilidade**, não para asserção de teste, e com os valores recomputados.

Asseverar propriedade em lugar de valor não é frouxidão: é o que distingue teste que protege a física de teste que protege a aritmética de quem o escreveu.

## C2 — Dois caminhos de arquivo não existem

| Você declarou | Existe? | Correto |
|---|---|---|
| `src/components/inspecao/InspetorPonto.tsx` | **não** | `src/components/inspetor/InspetorPonto.tsx` |
| `src/lib/exportacao/pacoteReprodutibilidade.ts` | **não** | `src/lib/export/pacoteReprodutibilidade.ts` |

`inspecao` / `inspetor` e `exportacao` / `export`. Confira o caminho no disco antes de declarar escopo; caminho declarado que não existe faz a execução parar no meio.

## C3 — `src/lib/gee/copernicusGeeClient.test.ts` não existe

Você declarou que iria *"atualizar os mocks existentes"* nesse arquivo. **Ele não existe.** O único arquivo de teste que menciona `copernicusGeeClient` é `src/lib/seguranca/padroesProibidos.test.ts`, que é varredura de padrões proibidos e não testa comportamento.

Isso muda o tamanho da tarefa: não é atualizar mock, é **criar cobertura de teste do zero** para um cliente que monta grafo de expressão REST do GEE. Os quatro casos que você propôs — (30,30) aceito, (40,30) aceito, (30,10) rejeitado, (60,40) rejeitado — são os casos certos, e continuam exigidos. Mas **declare esta tarefa pelo que ela é** e, se o custo de montar o mock do grafo for alto, **relate antes de começar** em vez de reduzir os casos.

## C4 — O campo `decisao` não existe na variante `indisponivel`

Você afirmou ter verificado que `linhaDeBase.ts` produz `{ estado: "indisponivel", causa: "nao-calculado", decisao: "D13" | "D15" }`.

O tipo em `src/types/proveniencia.ts:19` é:

```
| { estado: "indisponivel"; causa: CausaIndisponibilidade; motivo: string }
```

Sem `decisao`. O campo existe apenas na variante `tabelado`. O que `linhaDeBase.ts:66-104` produz é `estado`, `causa` e `motivo` — o identificador da decisão vai dentro do texto de `motivo`.

A conclusão material está certa: `perdaSolo` segue retida pelo Invariante 1. Mas **um detalhe embelezado dentro de um relatório de verificação contamina o relatório todo**, porque quem lê passa a ter de conferir tudo. Relate o que o arquivo diz, não o que seria razoável ele dizer.

## C5 — Três decisões estão citadas com o número errado

| Você escreveu | Decisão correta | O que a que você citou realmente é |
|---|---|---|
| "Tarefa 2 (**D05** / P05 — Remoção da Classe 60)" | **D07** / P05 | D05 é *"Série de treino: Sentinel-2 exclusivo; Landsat só como camada de tendência"* |
| "Tarefa 3 — Asset WorldCover v100 (**D10**)" | **D07** | D10 é *"Limiar de NDVI para solo descoberto"* |
| "Tarefa 4 (D08, D09, **D14**)" | **D08** e **D09** | D14 é o fator K; relacionado, mas não governa a marcação |

A exclusão da classe 60 e a concordância entre épocas são **ambas de D07**. Corrija antes de escrever comentário em código ou linha em `docs/PROVENIENCIA_ASSISTENCIA_IA.md`: número de decisão errado em comentário é rastreabilidade quebrada, e a Regra 9 protege exatamente isso.

---

# PARTE II — EXIGÊNCIA SOBRE A TAREFA 4

Sua seção sobre o mapeamento de ordens taxonômicas para os dois níveis de K é substantiva e é o tipo de trabalho que a decisão pede. Mas você a apresentou sob o título **"Verificação na Fonte Primária (CNPS-DOC-246-2024.pdf...)"**, com páginas e figuras nomeadas.

Responda, no relatório, de forma literal e sem rodeio: **você abriu esse PDF nesta execução, ou reproduziu o mapeamento de conhecimento prévio?**

As duas respostas são aceitáveis e nenhuma é repreensível. O que não é aceitável é a ambiguidade, porque o gate antifabricação bibliográfica da PARTE III do adendo anterior **depende** dessa distinção. Se foi de conhecimento prévio, a lista entra no código marcada como pendente de conferência, exatamente como D13 e D15 estão, e a marca propaga ao selo de proveniência até alguém abrir o documento.

O mesmo vale para o catálogo STAC do WorldCover v100: mantenha a instrução já dada de **confirmar em tempo de execução** que o identificador resolve, e relate o identificador que efetivamente funcionou.

---

# PARTE III — FASE A1: O COMANDO DE SORTEIO DOS 36 POLÍGONOS

**Só depois da FASE A0 concluída e aceita.** O que segue é implementação do *mecanismo* de sorteio, com o gatilho nas mãos do pesquisador — não é autorização para sortear.

O adendo anterior proibiu executar o sorteio junto da A0. A proibição continua, mas pela razão certa: o sorteio é **irreversível na prática**, porque refazê-lo exigiria descartar `pi_i` já registrado, o que D23 proíbe. A solução não é lembrar de não apertar; é **construir o gatilho de modo que ele se recuse a funcionar fora de hora**.

## O que construir

Um motor, duas superfícies e um selo.

### 1. Motor — `src/lib/gee/sorteioPoligonos.ts`

Função pura, determinística dada a semente. Reaproveita a partição já existente em `src/lib/gee/estratificacao.ts`; **não** reimplemente tercis nem estratos.

Sorteia, sobre os 18 estratos de D12, **dois polígonos de 10 ha por estrato**, totalizando 36, conforme D16. De cada par, um vai para **treino** e o outro para **held-out** — e essa designação é ela mesma **sorteada com a semente registrada**, nunca pela ordem em que os candidatos apareceram.

### 2. Pré-condições, verificadas em código e nomeadas na recusa

O comando **recusa e diz qual condição falhou**. Nunca prossegue parcialmente, nunca avisa em log e continua.

1. `exigirDecisao` passa para **D07, D08, D12, D16, D23** — e propaga `ErroDecisaoPendente` se não.
2. `P05` resolve exatamente para `[30, 40]`. Lista diferente aborta.
3. Todo candidato traz **as duas épocas** do WorldCover, e ambas em `[30, 40]`. Candidato com época faltante não é elegível, e a presença de qualquer um deles no conjunto indica que a Tarefa 3 não rodou — aborta.
4. Todo candidato traz `kAmbiguoAssociacao` como **booleano**, nunca `undefined`. `undefined` significa que a Tarefa 4 não rodou — aborta.
5. **Os 18 estratos têm ao menos 2 candidatos cada.** Estrato com menos de 2 não permite o par treino/held-out de D16 — aborta nomeando os estratos deficientes, e o pesquisador decide.
6. **Nenhum selo de sorteio anterior existe.**
7. **Nenhum insumo do rastreio espectral de D02 participa da elegibilidade nem da ordenação.** Esta é a guarda anticircularidade de D16: sortear onde o rastreio aponta erosão faria o modelo aprender a concordar com o rastreio. Se algum candidato chegar carregando escore de suscetibilidade, `scoreJev`, `severidade` ou `scorePrioridade` como critério, aborta. Reaproveite `CAMPOS_PROIBIDOS_MATRIZ_TREINO` de `src/lib/matriz/invariantes.ts:30-52` como base da lista.

### 3. Selo — `docs/verificacoes/sorteio/sorteio_d16_<AAAA-MM-DD>.json`

Escrito **uma única vez**, contendo:

- a **semente**, conforme P07 (`dinamica-registrada`);
- **`pi_i` por polígono sorteado**, que é a exigência central de D23;
- estrato, centroide e geometria de cada polígono;
- os **limiares de tercil efetivamente usados** (`limiaresS`, `limiaresE`) e a contagem de candidatos por estrato, porque D12 fixou tercis **empíricos** e sem esses limiares o sorteio não é reproduzível;
- a designação **treino / held-out** de cada polígono do par;
- o **commit do git** no momento do sorteio e um **SHA-256 do conjunto de candidatos** de entrada;
- as decisões vigentes e suas datas.

### 4. Idempotência

Se o selo existir, o comando **recusa** e aponta o arquivo. Não sobrescreve, não versiona `_v2`, não pergunta se quer continuar.

Descartar um sorteio selado exige ação separada e explícita do pesquisador, e **D23 proíbe descartar `pi_i` registrado** — de modo que a recusa é o comportamento correto, não uma inconveniência a contornar. Se o pesquisador pedir o descarte, isso é emenda de decisão, e emenda de decisão não é sua (P8).

### 5. Duas superfícies

**CLI** — `scripts/sortear_poligonos_d16.ts`, executável por `npm run sortear:d16`. Com `--dry-run` obrigatório na primeira invocação: verifica todas as pré-condições, mostra quantos candidatos por estrato, e **não sorteia**. O sorteio real exige `--confirmar`.

**Botão na interface** — no painel do pesquisador, **nunca** em tela alcançável durante coleta de campo, por causa do protocolo cego. O botão:

- fica **desabilitado** quando qualquer pré-condição falha, **exibindo qual** — botão habilitado que não faz nada, ou que falha depois de clicado, é pior que botão ausente;
- exibe, antes de confirmar, o que vai acontecer: 36 polígonos, 2 por estrato sobre 18 estratos, 360 ha, e que a ação é **irreversível**;
- exige confirmação explícita em duas etapas;
- depois de executado, troca de estado permanentemente e passa a mostrar o selo, com link para o JSON.

## O que a FASE A1 NÃO faz

Não voa, não gera plano de voo, não escolhe ordem de visita, não toca no coletor de campo. E **não usa os 18 polígonos held-out para nada**: eles ficam reservados à avaliação única de D25 e qualquer uso anterior — inspeção exploratória, ajuste, escolha de hiperparâmetro — contamina a estimativa honesta e invalida o critério de refutação pré-registrado.

---

# PARTE IV — RELATÓRIO EXIGIDO

Valem a PARTE IV (proibições, incluindo P8, P11 e P12) e a PARTE V do adendo anterior. Acrescente:

1. Para cada uma das cinco correções C1 a C5, o que você alterou em relação ao escopo declarado.
2. Os **20 segmentos recomputados**, e a confirmação de que o teste assevera **propriedade** e não valor por segmento.
3. A resposta literal da PARTE II: abriu ou não abriu o PDF do Documentos 246.
4. O identificador do ativo WorldCover v100 que efetivamente resolveu na API.
5. O custo real de criar `copernicusGeeClient.test.ts` do zero, e se os quatro casos ficaram cobertos.
6. Se a FASE A1 foi construída: a saída do `--dry-run`, com a contagem de candidatos por estrato, e a confirmação de que **nenhum sorteio foi executado**.

Assine os commits com **a sua própria identidade**, nunca com `Co-Authored-By: Claude Opus 5`. O `author` é Luís Alfredo Ferreira da Silva (`RedZardoz`). Atualize `docs/PROVENIENCIA_ASSISTENCIA_IA.md` por fase.

---

## Nota final, sobre postura

Sua declaração de escopo foi o melhor documento de pré-execução desta sequência: conferiu as sete âncoras corretamente, declarou a ressalva do polígono de `bacias.ts` sem que fosse preciso cobrar, e não tocou em arquivo algum antes de autorização. As correções acima são de execução, não de método.

Vale extrair delas o padrão comum: os cinco erros são todos do mesmo tipo — **detalhe plausível afirmado como verificado**. Caminho de diretório que soa certo, campo de tipo que faria sentido existir, número de decisão vizinho, valor de distorção coerente com a tendência. Nenhum é invenção grosseira; todos são preenchimento de lacuna por plausibilidade. É precisamente o modo de falha contra o qual este projeto inteiro foi endurecido, e o que o detecta é sempre a mesma coisa: abrir o arquivo, rodar a conta, ler a linha.
