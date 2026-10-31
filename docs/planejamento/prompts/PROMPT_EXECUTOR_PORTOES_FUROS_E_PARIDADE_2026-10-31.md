# Tarefa: fechar três furos do varredor e criar o portão de paridade entre artefatos

**Origem:** revisão dos portões automatizados, 31/10/2026, feita sobre `7de7ce1`.

A correção do CLI está confirmada: aborta com `[ERRO_ARQUIVO]`, nomeia as chaves encontradas, `exit 1`. Esta tarefa é sobre o que os portões **não** veem.

---

## Caminhos e push

```bash
git fetch origin
git checkout -B sarel/executor-2026-10-09 origin/sarel/executor-2026-10-09
```

Trabalhe e empurre **direto em `sarel/executor-2026-10-09`**. Não crie branch nova. Não espere notificação. Confirme e encerre:

```bash
git push origin sarel/executor-2026-10-09 && git log --oneline -1 origin/sarel/executor-2026-10-09
```

Baseline: **92 arquivos, 728 testes aprovados, 3 pulados.**

---

## O diagnóstico que motiva a tarefa

Submeti oito formas típicas de fabricação a `varrerCodigo`. **As oito passaram livres:**

| Amostra | Resultado |
| :--- | :--- |
| `const c = bruto?.candidatos ?? [];` | passa |
| `const m = dados?.metricas ?? {};` | passa |
| `{ estado: "medido", valor: 0.0285 }` | passa |
| `const nEf = areaTotal / 1963.5;` | passa |
| `const tercis = [0.0052, 0.0120, 0.0285];` | passa |
| `declividade = 16.0` (Python, topo de módulo) | passa |
| `    declividade = 16.0` (Python, indentado) | passa |
| `d = {"ndvi": 0.32, "bsi": 0.45}` (Python) | passa |

A última é **literalmente o defeito da planilha de 150 focos**, que motivou toda a auditoria de setembro. Escrita em Python hoje, atravessa o portão construído para impedi-la. A terceira é pior em natureza: valor cravado com selo `"medido"` — fabricação com proveniência falsa.

---

# PARTE A — Três furos, com raio de impacto já medido

Medi cada padrão candidato sobre **205 arquivos** reais (`src/**` `.ts`/`.tsx` + `scripts/**` `.py`/`.ts`/`.mjs`, excluindo testes). Use estes números: eles decidem o que vale adicionar.

## A1 — Coalescência com coleção vazia · 6 ocorrências · ADICIONAR

```ts
{ id: "coalescencia-com-colecao-vazia", regex: /\?\?\s*(\[\s*\]|\{\s*\})/ }
```

É o defeito do CLI: `?? []` converte "chave ausente" em "zero itens". O padrão `coalescencia-com-numero` casa `?? 0` e não casa coleção vazia — fabricar *"nenhum resultado"* corrompe tanto quanto fabricar um número.

As seis ocorrências atuais, todas a revisar uma a uma:

```
src/components/inspetor/InspetorPonto.tsx:586
src/lib/embrapa/embrapaSoilClient.ts:1157
src/lib/embrapa/embrapaSoilClient.ts:1254
src/lib/rotulos/ingestaoDrone.ts:166
scripts/remedir_candidatos_bp3_d16.ts:275
scripts/sortear_poligonos_d16.ts:125
```

Para cada uma: se a coleção vazia é **resultado legítimo** (a fonte respondeu e não havia itens), anote com `// permitido:` e justificativa. Se é **ausência de resposta** disfarçada de lista vazia, corrija como no CLI — abortar ou declarar indisponível. As duas em `embrapaSoilClient.ts` e a de `sortear_poligonos_d16.ts` merecem atenção redobrada: são caminhos de dado científico.

## A2 — Literal numérico em proveniência medida · 0 ocorrências · ADICIONAR

```ts
{ id: "literal-em-proveniencia-medida",
  regex: /estado:\s*["']medido["'][^}]{0,80}valor:\s*-?\d+\.\d+/ }
```

Hoje não casa nada. **Custo zero, proteção pura.** Impede que alguém crave um número e o carimbe como medido — a pior forma de fabricação, porque vem com selo de autenticidade. Acrescente meta-teste com caso positivo e negativo.

## A3 — Constante científica em Python · 0 ocorrências · ADICIONAR

```ts
{ id: "constante-cientifica-py",
  regex: /^\s*(ndvi|bsi|declividade|elevacao|perda|fator[a-z]*|erodibilidade)\w*\s*=\s*-?\d+\.\d+\s*(#.*)?$/i }
```

Também sem ocorrências hoje. É o que teria pego `declividade = 16.0`. O `default-numerico-desestruturacao` existente exige que a linha termine logo após o número **e** comece com espaço, o que deixa escapar constante em topo de módulo Python.

Cuidado: esse padrão deve rodar sobre `.py`. Confirme que o caminho de varredura de `scripts/` o aplica.

## A4 — O que NÃO adicionar, e por quê

Testei mais dois candidatos e **recomendo recusar**:

| Candidato | Ocorrências | Veredito |
| :--- | ---: | :--- |
| constante em aritmética (`/ 1963.5`, `* 0.75`) | **55** | ruído. Seria anotado até virar irrelevante. Constante em expressão é legítima em quase todo lugar |
| array de literais decimais | **10** | vários são UI legítima (`MapControls.tsx`, `GraficoSerieTemporal.tsx`). Exigiria restrição por contexto científico que ainda não sei desenhar sem falso positivo |

Não implemente nenhum dos dois. **Registre no relatório que foram medidos e recusados, com o número** — busca malsucedida documentada vale mais que portão inútil.

## A5 — Escopo: `data/*.json` não é varrido por ninguém

`listarArquivosCodigo` aceita `.ts`/`.tsx`; `listarArquivosScripts` aceita `.py`/`.mjs`/`.ts`. **Nenhum aceita `.json`.** Foi por aí que entrou o SHA-256 fabricado do manifesto.

Existe um varredor de JSON em `docs/verificacoes/`, mas procura apenas séries numéricas correlacionadas — não fabricação em geral, e não cobre `data/`.

Acrescente varredura dos JSON versionados de `data/` e `docs/`, com padrões próprios para esse formato:

- **hash implausível** — reutilize `verificarSanidadeHashSha256` de `src/lib/fundiario/manifestoSanidade.ts`, que já existe e já reprova o hash fabricado por dois critérios independentes. Aplique a qualquer campo cujo nome contenha `sha256` ou `hash`;
- **timestamp suspeito** — `geradoEm` terminando em `T00:00:00.000Z` ou em hora cheia com milissegundos zerados é sinal de valor escrito à mão, não gerado.

Não invente outros padrões para JSON sem medir o raio antes.

---

# PARTE B — O portão de paridade entre artefatos

## O que nenhum portão vê hoje

Todas as travas varrem **texto dentro de um arquivo**. Nenhuma verifica **consistência entre artefatos**. Foi exatamente aí que apareceram os defeitos mais caros desta semana:

| Defeito | Como se manifestou |
| :--- | :--- |
| Durigon (2014) | registro cita IJRS 35(2):441-453; PDF da metodologia citava RBCS 38(6):1814-1824 |
| Waltrick | registro cita 2015/RBCS; PDF citava 2010/RBRH |
| unidades efetivas | 1.836, 1.841 e 1.845 circulando ao mesmo tempo |
| manifesto fundiário | relatório descrevia um banco, o artefato descrevia outro |

Nenhum portão vê essa classe, porque nenhum compara duas fontes entre si. `src/config/deflacao.test.ts` é a única exceção — e cobre só a família da deflação, em cinco geradores. **A tarefa é generalizar o que ele faz.**

## O impedimento que você vai encontrar, medido

Contei: **apenas 4 das 42 entradas de `src/config/decisoes.ts` têm bloco `parametros` legível por máquina** — D02, D10, D16, D24. As outras 38 carregam os números apenas em prosa, dentro da string `valor`.

Isso significa que o portão de paridade **só pode cobrir hoje** o que é legível por máquina. Os cortes de K de D09 (0,0285 / 0,0300), os pisos de D11 (6 / 9 / 12) e os limiares de D25 (0,40 / 0,10) estão em prosa.

**Não extraia número de prosa com regex.** É frágil e vai gerar falso negativo silencioso, que é pior que não ter portão. E **não promova número a `parametros` por conta própria** — criar ou alterar parâmetro em `decisoes.ts` é competência do pesquisador (Seção 2 do `CLAUDE.md`).

## Escopo da Fase 1 — o que dá para fazer agora

Construa `src/config/paridadeArtefatos.test.ts` com um **registro explícito de grandezas publicadas**, cada uma com:

- a **fonte canônica**: caminho em `DECISOES[x].parametros.<chave>` ou chave em `data/PARAMETROS_DEFLACAO.json` / `data/MANIFESTO_FUNDIARIO.json`;
- a **forma como aparece em documento** (com separador de milhar, com vírgula decimal, etc.);
- a lista de **consumidores**: os scripts geradores e os `.md` que podem mencioná-la.

O teste lê a fonte, formata, e reprova se um consumidor trouxer valor divergente — nomeando arquivo, linha e os dois valores.

Grandezas da Fase 1, todas com fonte legível hoje:

| Grandeza | Fonte canônica |
| :--- | :--- |
| total de polígonos, área do polígono, área total, held-out, treino | `DECISOES.D16.parametros` |
| tetos de preditores por bloco e teto total | `DECISOES.D24.parametros` |
| limiares espectrais de triagem | `DECISOES.D02.parametros` |
| limiar de solo nu | `DECISOES.D10.parametros` |
| unidades efetivas por bloco | `data/PARAMETROS_DEFLACAO.json` |
| contagem de propriedades, tamanho em bytes do banco | `data/MANIFESTO_FUNDIARIO.json` |

Absorva `deflacao.test.ts` nesse mecanismo **ou** deixe-o como está e documente a relação. Não duplique a cobertura sem dizer qual é a canônica.

## Paridade de citação — a segunda metade

Mesmo mecanismo, aplicado a obras. Para cada obra que aparece em documento gerado, a forma canônica vem do campo `referencia` da decisão correspondente em `decisoes.ts`. O teste reprova divergência de **ano** ou de **periódico** entre o registro e o gerador.

Comece pelas que já deram problema: **Durigon (2014)**, **Waltrick**, **Zhu (2013) / Zhu & Woodcock (2014)**, **Cochran (1977)**, **Kish (1965)**. Preserve as marcações de não conferida no primário — elas fazem parte da forma canônica, não são ruído a limpar.

## Fase 2 — proponha, não execute

Levante **quais grandezas publicadas não podem ser cobertas** por viverem em prosa, e entregue a lista ao pesquisador com a proposta de promovê-las a `parametros`. Candidatas evidentes: os cortes de K de D09, os pisos de D11, os limiares de D25.

É proposta, não execução.

---

## Fora de escopo

- **Não promova** número a `parametros` em `decisoes.ts`, nem crie decisão nova.
- **Não implemente** os dois padrões recusados em A4.
- **Não extraia** número de prosa com regex.
- **Não altere** a análise da catena nem decida entre as quatro saídas do gargalo.
- Não mexa nas dívidas de lastro abertas (D03, D17, D18, P07).

---

## Verificação

```bash
# 1. os tres padroes novos disparam no que devem e nao no que nao devem
npx vitest run src/lib/seguranca/padroesProibidos.test.ts

# 2. teste negativo do portao de paridade — obrigatorio
#    altere temporariamente um numero num gerador, rode, confirme que REPROVA
#    nomeando arquivo, linha e os dois valores; desfaca.
npx vitest run src/config/paridadeArtefatos.test.ts

# 3. varredura de JSON pega o hash fabricado
#    use como fixture: 4b9e4a3b1d2e8f9a0c3d5e7f1b2a4c6e8d0f2a4b6c8e0d2f4a6b8c0e2d4f6a8b

# 4. nada quebrou
npx vitest run && npm run typecheck && npm run lint
```

O passo 2 não é opcional. Portão que nunca se viu reprovar não foi verificado — foi o que aprendemos na trava de deflação.

Rodapé obrigatório em cada commit:
```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0124eRLwbTVuEsVKcsq67486
```

---

## Relatório final

Cada afirmação numérica ou de caminho com o comando que a produziu e a **saída real colada**. Deve conter:

- as 6 ocorrências de `?? []`, uma a uma: corrigida ou anotada, e por quê;
- confirmação de que A2 e A3 entraram com meta-teste e seguem com zero ocorrências;
- o registro de que os dois padrões de A4 foram medidos (55 e 10) e **recusados**;
- a saída do passo 2 mostrando o portão de paridade **reprovando** uma divergência plantada;
- quantas grandezas e quantas citações a Fase 1 cobre, em número;
- a lista da Fase 2 — o que ficou de fora por viver em prosa;
- **a linha de confirmação do push.**

Depois, **encerre o turno**. Não aguarde notificação.
