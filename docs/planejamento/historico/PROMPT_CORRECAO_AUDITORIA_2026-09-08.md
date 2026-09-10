# Prompt de Correção — Auditoria de Veracidade do Dado

> **Como usar:** cole este documento inteiro como primeira mensagem em uma sessão nova do Claude Code, na raiz do repositório `geolocalizacao-erosao-propriedade`, branch `correcoes/auditoria-2026-09`.
> Os relatórios de origem estão em `Relatorio_Auditoria_Tabela_Consolidada_2026-09-08.txt` e `Relatorio_Auditoria_Projeto_2026-09-08.txt`. Leia-os antes de tocar em qualquer arquivo.

---

## 1. O que este sistema é, e por que o erro aqui é grave

Este é o instrumento computacional de uma dissertação de mestrado do PPGTCA. Sua função é **eleger pontos com alta probabilidade de erosão laminar** no Estado do Paraná, a partir de:

- variáveis físicas medidas por sensoriamento remoto no **Google Earth Engine** (Sentinel-2, Copernicus DEM, HydroSHEDS);
- **dados de solo da Embrapa** (classe pedológica e erodibilidade);
- **dados fundiários oficiais** (SICAR/CAR, SIGEF, SNCR/INCRA) para associar cada foco a um imóvel rural.

O produto final é a **Tabela Consolidada**, um arquivo de 54 colunas que:

1. será citado como resultado em uma dissertação submetida a banca;
2. **nomeia proprietários rurais** e associa a eles um número de perda de solo.

Isso define o padrão de qualidade. Não é um dashboard: é uma peça que pode ser lida como imputação. Um número errado aqui não é um bug de UI — é uma afirmação falsa sobre uma pessoa identificável ou sobre um resultado científico.

**Princípio inegociável que rege toda esta correção:**

> É sempre preferível uma célula vazia com um motivo declarado a um número plausível de origem desconhecida.
>
> O sistema jamais deve preencher uma lacuna com uma constante e apresentar o resultado como medição. Se o dado não existe, a resposta correta é dizer que não existe — e por quê.

Toda decisão neste trabalho se resolve por esse princípio. Quando estiver em dúvida entre "estimar" e "declarar ausente", declare ausente.

---

## 2. A causa raiz

Uma auditoria completa encontrou 7 defeitos críticos, 8 de alta relevância e 8 médios. Eles **não são independentes**. Todos descendem do mesmo padrão arquitetural:

> O código trata *ter um número* como mais importante do que *saber de onde o número veio*.

Cada integração externa (NASA POWER, SoilGrids, HydroSHEDS, Earth Engine, base fundiária) tem um fallback silencioso que substitui a ausência por uma constante plausível. Nenhuma dessas substituições é registrada de forma consistente, porque existem **quatro caminhos paralelos** que produzem os mesmos campos com regras diferentes:

| Caminho | Arquivo | Uso |
|---|---|---|
| Importação de arquivo | `src/lib/utils/parsers.ts` | CSV / GeoJSON / KML |
| Cálculo ponto a ponto | `src/app/api/gee/analyze-point/route.ts` | recálculo individual |
| Eleição em lote (GEE) | `src/lib/gee/candidateSelector.ts` | pipeline principal, 651 linhas, **sem teste** |
| Enriquecimento em lote | `src/lib/utils/batchEnrichment.ts` | pós-processamento |

O Fator K é resolvido por duas funções distintas que rotulam a mesma origem de forma contraditória. O Fator R por três. A "estimativa" é registrada de quatro maneiras diferentes. **Não existe fonte única de verdade por variável.**

Enquanto essa arquitetura permanecer, cada correção pontual será revertida pelo próximo caminho que alguém adicionar. Por isso a Fase 2 (seção 5) não é opcional.

---

## 3. Regras de trabalho

1. **Leia antes de escrever.** Os dois relatórios de auditoria e os arquivos citados. Não confie nesta lista sem confirmar no código — ela pode conter imprecisão, e o código é a autoridade.
2. **Nenhuma correção sem teste.** Cada defeito corrigido ganha um teste que falha antes da correção e passa depois. Um teste que passaria com o bug presente não conta.
3. **Não invente metodologia.** Três itens (marcados 🛑) exigem decisão do pesquisador e do orientador. Ao chegar neles, **pare e pergunte**. Não escolha uma fórmula por conta própria para uma dissertação.
4. **Não amplie o escopo.** Não refatore o que não está listado. Não reformate arquivos inteiros. Não troque bibliotecas. Diffs cirúrgicos.
5. **Não quebre o que está certo.** A seção 8 lista o que deve ser preservado intacto. Se uma correção sua fizer um daqueles testes falhar, sua correção está errada.
6. **Trabalhe em fases, commitando ao fim de cada uma.** Não faça um único commit gigante.
7. **Relate honestamente.** Se não conseguir corrigir algo, diga. Se uma correção ficou parcial, diga qual parte ficou de fora. Não declare concluído o que não verificou.

---

## 4. FASE 1 — Parar de mentir (bloqueante)

Nada mais importa até isto estar feito. Enquanto esta fase não fechar, **nenhuma Tabela Consolidada deve ser usada como resultado**.

### 1.1 — [C1] Perda de solo produzida por regra ad-hoc, fora da RUSLE

**Arquivo:** `src/lib/utils/parsers.ts` (GeoJSON ~linha 223; CSV ~linha 126)

```js
// GeoJSON
estimatedSoilLoss: parseFloat(props.estimatedSoilLoss || (slope * 2.2).toFixed(1))
// CSV
estimatedSoilLoss: parseFloat(row.soil_loss || row.perda_solo || (slope * 2.1).toFixed(1))
```

O multiplicador 2,2 / 2,1 não existe no README §2.5 nem em nenhuma referência do projeto. É uma reta arbitrária sobre a declividade.

**Prova documental:** no artefato `Tabela_Consolidada_Parana_Todo_o_Estado_150focos_2026-09-04.xlsx`, as **150 de 150 linhas** trazem `Perda_Solo_t_ha_ano = 35,2` — exatamente `16 × 2,2` — enquanto a coluna `RUSLE_Memoria_Calculo` da mesma linha declara **"Cálculo RUSLE não executado"** e as cinco colunas de fatores R, K, LS, C, P estão vazias.

A tabela publica uma perda de solo em t·ha⁻¹·ano⁻¹ que não pode ser reproduzida a partir dos seus próprios fatores. O laudo em PDF agrava, rotulando-a "Perda de Solo Calculada" (`src/lib/pdf/auditPdfGenerator.ts:737`).

**Correção exigida:**
- Remover ambos os multiplicadores. Sem RUSLE executada, `estimatedSoilLoss` fica `undefined` — não 0, não estimativa.
- A célula `Perda_Solo_t_ha_ano` sai vazia e `RUSLE_Memoria_Calculo` continua dizendo "Cálculo RUSLE não executado". As duas passam a concordar.
- Auditar o mesmo padrão em todo o `parsers.ts`: qualquer campo derivado por fórmula inventada recebe o mesmo tratamento.

**Teste:** importar um GeoJSON sem `estimatedSoilLoss` e afirmar que o ponto resultante tem `estimatedSoilLoss === undefined`; exportar e afirmar que a célula está vazia e que a memória de cálculo diz "não executado".

**Teste de invariante (vale para sempre):** para qualquer conjunto de pontos, `Perda_Solo_t_ha_ano` preenchida ⟺ os cinco fatores R, K, LS, C, P preenchidos ⟺ `RUSLE_Memoria_Calculo` exibindo a equação. As três condições são equivalentes, nunca parciais.

---

### 1.2 — [C4] Falha de consulta convertida em afirmação de inexistência de imóvel

**Arquivos:** `src/lib/gee/candidateSelector.ts:~445` e `scripts/spatial_owner_matcher.py:427, 472, 482, 491, 541`

```js
const tenureStatus = match?.status || "sem-correspondencia";
```

Erro de SQLite, coordenada inválida, exceção por item, timeout do subprocesso, banco ausente — **todos** viram `"sem-correspondencia"`. A tabela então imprime, em cinco colunas simultâneas:

> `Status_Consulta_Fundiaria`: "Sem correspondência — nenhum imóvel nesta coordenada"
> `Denominacao_Imovel` / `Codigo_CAR` / `Titular_SNCR` / `Registro_INCRA_SNCR`: "Sem correspondência"

**Este é o defeito mais grave do sistema em termos de consequência.** É uma afirmação positiva de ausência de imóvel, sobre uma coordenada real, gerada por uma falha técnica. Em contexto pericial, "nenhum imóvel nesta coordenada" é exatamente o tipo de asserção que jamais pode nascer de um erro de execução.

O estado correto **já existe** no tipo (`base-nao-disponivel`), já tem texto próprio ("Base não consultada") e já é tratado corretamente por `resolveBlockF()`. Ele simplesmente nunca é atribuído nesses caminhos.

**Correção exigida:**
- Distinguir rigorosamente três desfechos: **consulta bem-sucedida sem match** (`sem-correspondencia`), **consulta impossível** (`base-nao-disponivel`), **consulta falhou** (novo estado `erro-na-consulta`, ou `base-nao-disponivel` com motivo).
- `"sem-correspondencia"` passa a exigir prova positiva: a consulta rodou, a base cobre a UF, e nenhum polígono contém o ponto.
- Nenhum `catch` e nenhum `|| "sem-correspondencia"` pode produzir esse status. Varra os dois arquivos inteiros.
- O campo `mensagem` do matcher (que carrega a causa real) precisa chegar ao ponto e ser exportado. Se não houver coluna adequada, anexe ao `Status_Consulta_Fundiaria`.
- Em `spatialMatcher.ts`, os `resolve({})` defensivos (script ausente, banco ausente, erro de subprocesso, JSON inválido) devem resolver com status explícito, não com objeto vazio.

**Teste:** simular banco ausente, erro de subprocesso e JSON malformado; afirmar que **em nenhum dos três casos** a string "Sem correspondência" aparece na tabela exportada, e que o motivo real está visível.

---

### 1.3 — [C3] Bônus cadastral de +25 contamina o Score de Prioridade exportado

**Arquivo:** `src/lib/gee/candidateSelector.ts:~390` e `~455`

```js
const bonus = isRuralConfirmed ? 25 : 0;
priorityScore: (cand.priorityScore ?? 50) + bonus   // clamp nunca reaplicado
```

O bônus existe para uma finalidade legítima — **preferir alvos dentro de imóveis rurais cadastrados na hora de eleger os candidatos**. Isso está certo e deve ser mantido. O erro é que ele é gravado no campo `priorityScore` e **exportado**. Três consequências:

- rompe a escala documentada: `calculatePriorityScore()` já satura em 100, e `+25` produz até **125**. Verificado: severidade Crítica, BSI 0,90, 25° → base 100 → exportado 125. `src/lib/utils/exportUtils.ts:117` chega a imprimir literalmente `"Score de Prioridade: 125 / 100"`;
- o valor deixa de satisfazer a fórmula do README §3.2, que a tabela declara seguir;
- mistura critério cadastral em índice de risco físico: duas feições erosivas idênticas recebem scores diferentes por estarem ou não dentro de um polígono do CAR.

**Correção exigida:**
- Separar em dois campos: `selectionScore` (interno, com o bônus, usado só por `thinBySpacing` e pelo ranqueamento de eleição) e `priorityScore` (exportado, estritamente conforme README §3.2, sempre em 10–100).
- `priorityScore` nunca é escrito com bônus. `selectionScore` nunca é exportado.
- Documentar o bônus no README, na seção de eleição de candidatos — ele é uma decisão metodológica legítima e precisa estar declarada.

**Teste:** afirmar que `priorityScore` exportado nunca excede 100 nem fica abaixo de 10, para qualquer entrada; e que ele reproduz exatamente `min(100, max(10, round(Ω + BSI×25 + θ×1,2)))`.

---

### 1.4 — [C6] `unmask()` injeta valores fabricados no pipeline GEE

**Arquivo:** `src/lib/gee/candidateSelector.ts:126-160`

```js
bsi     ... .unmask(0.0)
ndvi    ... .unmask(0.5)
sand    ... .unmask(35)
clay    ... .unmask(40)
stratum ... .unmask(4)
```

A máscara de nuvem e sombra (`maskS2Clouds`) é aplicada e, **logo em seguida**, o `unmask()` repõe constantes justamente nos pixels que a máscara descartou. Como `stratifiedSample()` roda com `dropNulls: true`, o `unmask` **impede** o descarte: o pixel nublado é amostrado carregando BSI 0,0 e NDVI 0,5 fabricados.

Esses valores alimentam severidade, score, Fator C e perda de solo. Nada em `Campos_Estimados` os distingue de medição real. O mesmo vale para pixels fora da cobertura das cenas.

**Correção exigida:**
- Remover os `unmask()` das bandas físicas (BSI, NDVI, areia, argila). Pixel sem dado deve ser descartado pelo `dropNulls`, não maquiado.
- Se a remoção reduzir demais a amostra, a resposta correta é ampliar a janela temporal ou o número de cenas do mosaico — **não** repor constantes.
- Para o `stratum.unmask(4)`: avaliar se o estrato 4 é um estrato legítimo ou um lixo. Se for lixo, descartar o pixel.
- Documentar no diagnóstico quantos pixels foram descartados por ausência de dado, ao lado dos contadores de elegibilidade já existentes.

---

### 1.5 — [C7] NDVI, BSI e declividade substituídos por constantes no enriquecimento

**Arquivo:** `src/lib/utils/batchEnrichment.ts:~205`

```js
const ndviVal = typeof pt.ndvi === "number" && !isNaN(pt.ndvi) ? pt.ndvi : 0.32;
const bsiVal  = typeof pt.bsi  === "number" && !isNaN(pt.bsi)  ? pt.bsi  : 0.45;
const slopeDeg = ... : 8.0;
```

Essas constantes alimentam `calculateCFactor()` e `calculateLSFactor()` e portanto a perda de solo exportada. Apenas `kFactor`, `lsFactor` e `rFactor` entram em `estimatedFields`; `ndvi`, `bsi` e `slopeDegrees` não. A memória de cálculo exibirá a equação completa como se tivesse partido de dados observados.

**Correção exigida:** sem NDVI, BSI ou declividade reais, **não calcular RUSLE para aquele ponto**. Deixar os fatores vazios e a memória de cálculo em "não executado". Nunca inventar o insumo.

---

### 1.6 — [A3] Zero legítimo tratado como ausência (coerção `||`)

**Arquivo:** `src/lib/utils/parsers.ts` (ambos os parsers)

```js
const slope = parseFloat(props.slope || props.slopePercent || props.declividade || 16);
const bsi   = parseFloat(props.bsi || props.indice_solo || 0.45);
const ndvi  = parseFloat(props.ndvi || 0.32);
const prio  = parseFloat(props.priorityScore || 70);
```

Um arquivo que informa legitimamente **declividade 0%** (várzea, topo plano) ou **BSI 0** recebe silenciosamente 16% e 0,45. Pior: a checagem `hasProp()` usa `!== undefined && !== null && !== ""`, que considera `0` **presente** — logo o campo **não** entra em `Campos_Estimados`.

**Verificado:** entrada `{slope: 0, bsi: 0, ndvi: 0, priorityScore: 0}` produz `16 / 0,45 / 0,32 / 70` com `Campos_Estimados` **vazio**. A tabela apresenta 16% como medido quando o arquivo disse 0%.

**Correção exigida:**
- Trocar toda coerção `||` por checagem explícita de `undefined`/`null`/`NaN`. `0` é um valor.
- Fazer uma varredura do padrão `|| <literal numérico>` em `src/` inteiro e corrigir cada ocorrência. Não é exclusivo dos parsers — veja também `?? 0` em `earthEngineClient.ts:231-233` e `shapefileExport.ts:603,608`.

**Teste:** os quatro campos acima com valor 0 no arquivo devem chegar como 0 no ponto, e não devem aparecer em `Campos_Estimados`.

---

### 1.7 — [A4] Defaults divergentes entre CSV e GeoJSON

O mesmo ponto, sem atributos, produz duas tabelas diferentes conforme o formato de entrada:

| | Declividade | BSI | NDVI | Altitude | Perda | Score |
|---|---|---|---|---|---|---|
| GeoJSON | 16% | 0,45 | 0,32 | 520 m | 35,2 | 70 |
| CSV | 15% | 0,40 | 0,35 | 500 m | 31,5 | 65 |

Quebra de reprodutibilidade pura.

**Correção exigida:** depois de 1.1, 1.5 e 1.6, **o conjunto correto de defaults é o conjunto vazio**. Campo ausente no arquivo → campo ausente no ponto → célula vazia na tabela → registro em `Campos_Estimados` explicando que a fonte não forneceu. Elimine os dois conjuntos de literais, não os unifique.

---

### 1.8 — [A1] O Bloco F oculta dado fundiário real que o sistema já possui

**Arquivo:** `src/app/api/gee/analyze-point/route.ts`

A rota retorna `carCode`, `propertyName`, `ownerName`, `incraRegistry`, `propertyAreaHa` e `ownerDocumentMasked`, mas **não** retorna `tenureStatus`, `tenureUf`, `tenureQueryDate`, `tenureAssociationCriterion` nem os campos `sicar*`/`sigef*`/`sncr*`.

Como `resolveBlockF()` decide exclusivamente por `tenureStatus`, um ponto que carrega um código CAR e um titular **reais** é exportado com as sete colunas do Bloco F preenchidas com "Consulta não realizada". O dado existe no objeto e é suprimido na tabela.

**Correção exigida:** a rota passa a devolver o objeto de match completo, incluindo `status` e toda a cadeia de proveniência. Verificar também `src/components/sidebar/BatchGeeCalculator.tsx:79`, onde o merge `{...pt, ...json.data}` consome a resposta.

---

### 1.9 — [C5] `Campos_Estimados` não reflete o que foi estimado

Quatro rotas, quatro comportamentos incompatíveis:

| Rota | Defeito |
|---|---|
| `parsers.ts` | sinaliza `slopePercent`, `bsi`, `severity`, `priorityScore`, `estimatedSoilLoss`; **nunca** sinaliza `ndvi`, `elevation`, `soilType`, `featureType`, `municipality`, `watershed`, `macroRegion`, `slopeDegrees` — todos igualmente default |
| `analyze-point/route.ts` | conhece `kResult.approximated` e `satellite.lsApproximated` (ambos em `diagnostics`) e **não** popula `estimatedFields` |
| `batchEnrichment.ts:32` | marca `approximated: false` para valores lidos da `K_FACTOR_TABLE`, **contradizendo** `soilErodibility.ts:160`, que classifica a mesma tabela como `TABELA_SIBCS_APROXIMADA` com `approximated: true` |
| `BatchGeeCalculator.tsx:79` | o merge não limpa flags obsoletos: um ponto importado e depois recalculado no GEE continua marcado como tendo declividade e BSI estimados quando já são medidos — a coluna passa a mentir na direção oposta |

**Correção exigida na Fase 1:** corrigir as quatro rotas para que concordem. **Correção definitiva:** Fase 2 — enquanto isso for responsabilidade de quem escreve cada rota, vai divergir de novo.

---

### 1.10 — [M1] O CSV perde toda a procedência e o bloco LGPD

**Arquivos:** `src/lib/utils/auditTableExport.ts:375`, `src/components/export/ExportModal.tsx:216`, `src/components/data/DataManagerModal.tsx:276`

```js
export function exportAuditTableCSV(points: ErosionPoint[], _meta?: AuditTableMetadata): string
```

O parâmetro existe, nunca é usado, e os dois pontos de chamada sequer o passam. O CSV sai sem data de emissão, sem filtros ativos, sem inventário de bases e **sem a fundamentação LGPD**, que existe apenas na aba 2 do XLSX.

**Correção exigida:** emitir a procedência no CSV como bloco de linhas comentadas no topo, ou como arquivo `.txt` companheiro. O bloco LGPD não é opcional — ele é a base jurídica declarada para o tratamento do nome do titular.

---

### 1.11 — [M2] A aba de procedência afirma consulta que não houve

`buildProvenanceSheet()` intitula **"BASES FUNDIÁRIAS CONSULTADAS"** o que `/api/fundiario/fontes` devolve, que é o inventário das bases **instaladas**. No artefato auditado, a aba lista nove bases (PR, SC, SP) enquanto **148 das 150 linhas** declaram "Consulta não realizada".

**Correção exigida:** renomear para "BASES FUNDIÁRIAS DISPONÍVEIS NESTA INSTALAÇÃO" e acrescentar uma linha com a contagem real: quantos focos foram efetivamente consultados, quantos tiveram match, quantos não foram consultados.

---

## 5. FASE 2 — Tornar a mentira impossível

A Fase 1 corrige as ocorrências. A Fase 2 elimina a classe inteira. **Não pule.**

### 2.1 — Proveniência no sistema de tipos

Hoje um número e sua origem viajam separados: o valor em `ErosionPoint.bsi`, a origem talvez em `estimatedFields`, talvez em `diagnostics`, talvez em lugar nenhum. Enquanto forem separados, vão divergir.

Introduza um tipo que torne **impossível** carregar um valor sem sua origem:

```ts
export type Proveniencia<T> =
  | { estado: "medido";     valor: T; sensor: string; adquiridoEm: string }
  | { estado: "modelado";   valor: T; modelo: string; insumos: string[] }
  | { estado: "tabelado";   valor: T; tabela: string; chave: string }
  | { estado: "indisponivel"; motivo: string };
```

Aplique-o às variáveis científicas: `bsi`, `ndvi`, `elevation`, `slopePercent`, `slopeDegrees`, `soilType`, e aos cinco fatores RUSLE.

Com isso:
- `Campos_Estimados` deixa de ser preenchido à mão em quatro lugares e passa a ser **derivado** — é a lista dos campos cujo estado não é `"medido"`;
- `RUSLE_Memoria_Calculo` passa a poder declarar a origem de cada fator na própria equação;
- fica **estruturalmente impossível** repetir C5, C7, A3, A4 e A8, porque não há como escrever um valor sem dizer de onde veio;
- o compilador passa a recusar o padrão que causou toda esta auditoria.

**Execute isto de forma incremental**, uma variável por vez, com os testes passando a cada passo. Não faça um big-bang.

### 2.2 — Fonte única de verdade por variável

Colapsar as quatro cadeias paralelas. Cada variável científica passa a ter **exatamente uma** função responsável por resolvê-la, e as quatro rotas a chamam.

- **Fator K:** eliminar `batchEnrichment.ts:resolveKFactorForPoint`. Só `soilErodibility.ts:getKFactorRealOrApproximate` permanece.
- **Fator R:** eliminar `batchEnrichment.ts:resolveRegionalRFactor` (constantes 7200/6200/7000/6600). Só `rainfallErosivity.ts` permanece, com `getRegionalRFactorParana` explicitamente marcada como `"modelado"`.
- **Fator LS:** unificar. Hoje `analyze-point` usa HydroSHEDS real e `candidateSelector` usa a constante 10,0 m²/m — dois LS diferentes para o mesmo ponto conforme a rota. Se HydroSHEDS não estiver disponível no lote, o LS fica `"indisponivel"`, não constante.
- **Tipo de solo:** ver Fase 3.

### 2.3 — Cobertura de teste do pipeline principal

`src/lib/gee/candidateSelector.ts` tem 651 linhas, popula a maioria das colunas da tabela e **não tem arquivo de teste**. Crie `candidateSelector.test.ts` cobrindo, com o cliente `ee` mockado: conversão de feature em ponto, propagação de status fundiário, separação `selectionScore`/`priorityScore`, e descarte de pixel sem dado.

Também sem teste: `earthEngineClient.ts`, `stratificationConstants.ts`, `exportUtils.ts`, `xlsxWriter.ts` e as 11 rotas de API.

### 2.4 — Teste de invariantes da Tabela Consolidada

Um único arquivo de teste que valida a tabela **como artefato**, independentemente de quem a produziu:

1. `Perda_Solo` preenchida ⟺ os 5 fatores preenchidos ⟺ memória exibindo a equação;
2. `Score_Prioridade` sempre em [10, 100];
3. `Campos_Estimados` lista **exatamente** os campos cujo estado ≠ `"medido"`;
4. `Origem_Dado` = satélite ⟹ `Cena_Sentinel2`, `Data_Calculo_GEE` e `Versao_Motor_Calculo` preenchidas;
5. a string "Sem correspondência" só aparece quando houve consulta bem-sucedida sem match;
6. nenhuma coluna geográfica contém literal de programa (lista negra: `"Custom"`, `"Bacia Local"`, `"Área Amostral GEE"`, `"Bacia Hidrográfica Local"`);
7. nenhuma coluna tem o mesmo valor em 100% das linhas quando há mais de 20 pontos de origem satelital — um detector genérico de constante disfarçada de medição.

O item 7 teria capturado sozinho todo o defeito C1.

---

## 6. FASE 3 — Cumprir o objetivo do projeto: solo da Embrapa

### 3.1 — 🛑 Os dados da Embrapa não entram em nenhum cálculo

**Este é o achado que mais afeta o objetivo declarado do projeto.**

O sistema exibe duas camadas da Embrapa em `src/components/map/MapViewer.tsx:81-95`:

```
geonode:parana_solos_20201105        (mapa de solos do Paraná)
geonode:brasil_erodibilidade_solo    (erodibilidade do solo)
```

Ambas são requisições **WMS `format=image/png`** — imagem rasterizada sobreposta ao mapa. **Não são consultáveis.** Nenhum valor delas entra em qualquer cálculo.

E `src/lib/embrapa/smartSolosClient.ts` exporta `classifyProfileWithSmartSolos()`, mas **nenhum módulo de cálculo o importa** — só a rota de validação de token (`api/auth/token-test`) e um campo da tela de configuração. A integração com a Embrapa é decorativa: valida-se o token de um serviço que nunca é chamado.

**O que acontece de verdade hoje** — e o projeto documenta isso contra si mesmo. O teste `soilErodibility.test.ts:31` registra: *"comportamento observado nos testes reais contra o Brasil: HTTP 200 com todos os `mean` nulos"*. Ou seja, **o SoilGrids não tem cobertura útil no Brasil**, e o Fator K cai sempre no fallback. A cadeia real é:

```
OpenLandMap areia/argila (250 m, global)
   → regra JS em inferPedologyClass() inventa "Latossolo Vermelho Distroférrico"
      → K_FACTOR_TABLE devolve K = 0,020
         → K entra na RUSLE e determina a perda de solo
```

**O Fator K é função de um palpite**, enquanto o mapa oficial de erodibilidade da Embrapa está carregado na aplicação como PNG decorativo.

**Correção exigida:**
1. Verificar as capacidades do GeoServer da Embrapa (`https://geoinfo.dados.embrapa.br/geoserver/ows?service=WMS&request=GetCapabilities` e o equivalente WFS). Confirmar se as camadas são *queryable*.
2. Se forem, consultar o valor **no ponto** — `WMS GetFeatureInfo` com `info_format=application/json`, ou `WFS GetFeature` com filtro espacial — em vez de renderizar tile.
3. Substituir `inferPedologyClass()` pela classe pedológica **real** da carta da Embrapa, e o Fator K tabelado pela **erodibilidade real** da carta `brasil_erodibilidade_solo`.
4. Alternativa, se a consulta ao GeoServer não for viável: ingerir as cartas como *assets* no Earth Engine e amostrá-las no mesmo `reduceRegion` das demais bandas — o que também elimina uma chamada de rede por ponto.
5. Onde a carta não cobrir o ponto, o resultado é `"indisponivel"` com motivo, **não** o palpite atual.
6. Avaliar honestamente se o `smartSolosClient` é utilizável: ele classifica **perfis** a partir de amostras de horizonte, que este projeto não possui. Se não for aplicável ao caso de uso pontual, **diga isso e remova a integração** em vez de mantê-la como enfeite. Não finja uso.

### 3.2 — [A5] `inferPedologyClass` afirma o que a fonte não suporta

**Arquivo:** `src/lib/gee/stratificationConstants.ts:141-176`

A função deriva classes SiBCS de granulometria OpenLandMap (250 m) e declividade. A distinção **Distroférrico × Eutroférrico** é decidida por `clayPercent > 50` — mas na classificação SiBCS distrófico/eutrófico é definido por **saturação por bases (V%)**, propriedade química que não se deriva de teor de argila. A coluna `Tipo_Solo` publica "Latossolo Vermelho Distroférrico" sem ressalva, e esse nome ainda governa o Fator K e o peso Ψ_solo da severidade.

Observação análoga para `classifyFeatureType()`: rótulos como **"Voçoroca em Expansão"** são atribuídos por limiares de severidade/declividade/BSI, **sem qualquer detecção de feição**. Afirmar a existência de uma voçoroca ativa a partir de uma amostra de 30 m é overclaim.

**Correção exigida:** resolvida pelo item 3.1 (classe real da Embrapa). Enquanto isso não existir, `Tipo_Solo` deve declarar o nível de confiança que a fonte suporta — "Latossolo (inferido por granulometria)" — e entrar em `Campos_Estimados`. `Tipologia_Feicao` deve ser renomeada para deixar claro que é uma **classificação algorítmica de suscetibilidade**, não uma feição observada.

### 3.3 — 🛑 Fator C invertido em relação ao BSI — **PARE E PERGUNTE**

**Arquivo:** `src/lib/rusle/rusleCalculator.ts:calculateCFactor`

```
C = ((1 - NDVI) / 2) ^ (1 + BSI)
```

Como a base `(1-NDVI)/2` é sempre menor que 1, elevá-la a um expoente **menor** produz resultado **maior**. BSI negativo (solo coberto) reduz o expoente e portanto **aumenta** o fator C.

**Medição executada, NDVI fixo em 0,70:**

| BSI | C |
|---|---|
| −0,9 | 0,8272 |
| −0,3 | 0,2650 |
| 0,0 | 0,1500 |
| +0,3 | 0,0849 |
| +0,9 | 0,0272 |

Quanto **mais** solo exposto, **menor** o fator de vulnerabilidade — o inverso do significado físico do fator C na RUSLE.

**Efeito na perda de solo** (R=6800, K=0,02, LS=1,405):

- pixel **vegetado** (NDVI 0,85 / BSI −0,70): C = 0,4597 → **A = 87,84 t/ha/ano**
- pixel de **solo nu** (NDVI 0,10 / BSI +0,50): C = 0,3019 → **A = 57,69 t/ha/ano**

O pixel vegetado recebe perda **52% maior** que o solo nu. Como o objetivo do sistema é *eleger* pontos de erosão, essa inversão empurra a eleição na direção errada.

O docstring da função afirma o oposto do que o código faz. O teste existente passa apenas porque compara um par em que a variação do NDVI mascara a inversão do BSI.

**⚠️ A mesma fórmula consta do README §2.1.C, linha 116.** Não é um bug de implementação: é a formulação adotada na dissertação. Corrigir o código sem corrigir o README criaria divergência entre método declarado e método executado.

**Ação exigida:** **NÃO ALTERE A FÓRMULA POR CONTA PRÓPRIA.** Apresente ao pesquisador: (a) esta demonstração numérica; (b) as alternativas — inverter o sinal do expoente para `(1 − BSI)`, adotar a forma exponencial de Durigon/Gutierrez já citada como alternativa no próprio README §2.1.C, ou desacoplar C do BSI usando só NDVI; (c) o impacto de cada uma sobre os resultados já produzidos. **Aguarde a decisão dele e do orientador.** Só então altere código, README e testes **em conjunto**.

### 3.4 — 🛑 Declividade calculada em EPSG:3857 — **PARE E PERGUNTE**

**Arquivos:** `src/lib/gee/earthEngineClient.ts:170` e `src/lib/gee/candidateSelector.ts:132`

```js
.setDefaultProjection("EPSG:3857", null, 30)
```

Web Mercator distorce distâncias em função da latitude. No Paraná (~24–26° S) o fator de escala é ≈ 1,10: a distância horizontal fica inflada e a declividade correspondentemente **subestimada em cerca de 9–10%**, de forma sistemática. O erro propaga para LS, severidade, score e perda de solo — ou seja, para o critério de eleição.

A guarda `validateSlopePlausibility()` detecta apenas o erro grosseiro de projeção (>75°), não esta distorção.

**Ação exigida:** demonstrar numericamente o desvio para a latitude do Paraná; propor a projeção adequada (UTM 22S/EPSG:31982, ou cálculo em `EPSG:4326` com correção de latitude); estimar o impacto sobre os resultados já gerados. **Apresentar ao pesquisador antes de alterar.** Se for aceito, incrementar `GEE_CALC_ENGINE_VERSION` — o mecanismo `isPointSlopeOutdated()` já existe e forçará o recálculo dos pontos antigos, exatamente como foi feito na correção anterior de projeção.

---

## 7. FASE 4 — Correções de menor porte

| Id | Arquivo | Correção |
|---|---|---|
| A2 | `candidateSelector.ts` | `municipality`, `macroRegion`, `watershed` recebem literais (`"Paraná"`, `"Custom"`/`"Área Amostral GEE"`, `"Bacia Local"`/`"Bacia Hidrográfica Local"`) em 150/150 linhas. Resolver por reverse geocoding IBGE (`src/lib/api/ibgeClient.ts` já existe) e pela base real de bacias (`src/data/paranaBasins.ts`, hoje não consultada). Sem resolução, gravar "não determinado" — nunca literal de programa. |
| A7 | `candidateSelector.ts:523` | `Cena_Sentinel2` grava o rótulo genérico `"COPERNICUS/S2_SR_HARMONIZED (Mosaico Temporal...)"`. Coletar e gravar a lista de `PRODUCT_ID` e datas das cenas que compuseram o mosaico. Sem isso, o resultado não é reauditável. |
| A8 | `earthEngineClient.ts:231-233` | `elevation: Math.round(pixelValues.ELEVATION ?? 0)` e `ndvi: (pixelValues.NDVI ?? 0)`. A guarda de nulos cobre só BSI e SLOPE_DEG. Altitude 0 m e NDVI 0,000 são valores fisicamente significativos. Estender a guarda a todas as bandas. |
| A6 | `batchEnrichment.ts` | Duas resoluções concorrentes do Fator K, com rotulagem contraditória de `approximated`. Resolvido pela Fase 2.2. |
| M3 | `auditTableExport.ts` | Latitude/Longitude gravadas com `toFixed(6)` enquanto `formatToDMS()` recebe a precisão plena — as duas representações da mesma coordenada não derivam do mesmo número. Produziu 1 divergência em 300 conversões no artefato real. Derivar o DMS do valor já arredondado. |
| M4 | `geoUtils.ts:31` | `formatToDMS()` sem rollover de 60,0". Verificado: `-25.99999` produz `"25° 59' 60.0\" S"`, notação DMS inválida. |
| M6 | `auditTableExport.ts` | `Codigo` e `ID_Interno` idênticos em 150/150 linhas. Decidir se são conceitos distintos ou remover a redundância. |
| M7 | `shapefileExport.ts:603,608` | `?? 0` para score e perda grava 0 onde a Tabela Consolidada corretamente deixa vazio. Exportações do mesmo dado divergem entre si. |
| M8 | `rusleCalculator.ts` | Docstring de `calculateSeverity()` lista só Ψ=18 e Ψ=8, omitindo Ψ=13 (Cambissolo) que o código aplica. |
| — | `MAPA_DOCUMENTACAO_CALCULOS.md` | Datado de 01/09/2026, anterior às alterações posteriores do motor de cálculo. Conferir antes de ser citado na dissertação. |
| — | 4 componentes | Avisos `react-hooks/exhaustive-deps` em `AuditDossierModal.tsx:142`, `MapViewer.tsx:561`, `PointPopup.tsx:162`, `useErosionStore.ts:1001`. Baixa prioridade. |

---

## 8. O que NÃO deve ser tocado

Estas partes foram auditadas e estão corretas. Preserve-as. Se uma alteração sua fizer um destes testes falhar, **a alteração está errada**.

- **`resolveBlockF()`** (`auditTableExport.ts`) — regra rigorosa, nunca deixa célula textual em branco, nunca grava 0 em área ausente, distingue os cinco estados de consulta. Bem testada. O defeito C4 está *a montante* dela, não nela.
- **Máscara do SNCR** — o nome do titular é reproduzido byte a byte na forma mascarada oficial, sem tentativa de reversão. CPF/CNPJ nunca é divulgado. Coberto por teste. **Não relaxe isto sob nenhuma circunstância.**
- **`propertyName = None` explícito** em `spatial_owner_matcher.py:245`, com o comentário "Nunca inventar denominação". É exatamente a disciplina que faltou no resto do sistema.
- **`isSyntheticPoint()`** — aplicada em todas as rotas de saída (tabela CSV e XLSX, PDF, GeoJSON, KML, CSV simples, shapefile) e na hidratação e reidratação do store. Cobertura completa, sem brecha.
- **`isLocalRequest()`** — fecha todas as rotas fundiárias antes de qualquer processamento. Coberto por teste.
- **`sessionStore`** — credenciais do GCP em sessão efêmera com cookie httpOnly, nunca em disco.
- **`execFile()` com array de argumentos** — sem shell, sem interpolação. Não há superfície de injeção. Não troque por `exec`.
- **`GEE_CALC_ENGINE_VERSION` + `isPointSlopeOutdated()`** — mecanismo de invalidação por versão do motor. Use-o nas Fases 3.3 e 3.4.
- **Bloco de fundamentação LGPD** na aba de procedência — base jurídica declarada (Lei 13.709/2018, art. 7º, IV) e nota de pseudonimização.
- **Documentação inline dos módulos de cálculo** — cada um declara servidor externo, produto consumido, fórmula e referência à seção do README. Prática rara; mantenha ao editar.
- **`xlsxWriter.ts`** — escrita própria com escape XML por `inlineStr`. O arquivo gerado abre sem erro em leitor externo.
- **Os 156 testes existentes.** Nenhum pode ser deletado ou afrouxado para acomodar uma correção.

---

## 9. Verificação de conclusão

Antes de declarar qualquer fase concluída:

```bash
npx vitest run && npx tsc --noEmit && npx next lint
```

Todos devem passar. **Não desative teste, não use `skip`, não afrouxe asserção para fazer passar.**

Além disso:

1. **Reauditar o artefato.** Reexecutar a conferência que originou este trabalho sobre `Tabela_Consolidada_Parana_Todo_o_Estado_150focos_2026-09-04.xlsx`. Depois da Fase 1, aquele arquivo deve ser **reconhecidamente inválido** — ele foi importado de GeoJSON e nunca passou pelo GEE (`Origem_Dado` = "Importado pelo usuário"; `Cena_Sentinel2`, `Data_Calculo_GEE`, `Versao_Motor_Calculo` e `Estrato_ID` vazias em 150/150 linhas). Ele não deve ser usado como resultado da dissertação, e o sistema deve deixar isso evidente para quem o abrir.

2. **Produzir um artefato novo, de verdade.** Rodar o pipeline GEE completo sobre uma AOI real, exportar a Tabela Consolidada e conferir os sete invariantes da seção 2.4. **Este é o único teste que importa de fato** — todo o resto é preparação para ele. Peça autorização ao pesquisador antes de rodar, porque consome cota do Earth Engine e altera o estado da aplicação.

3. **Relatório final honesto**, contendo: o que foi corrigido, com evidência; o que ficou pendente e por quê; os itens 🛑 que aguardam decisão metodológica; e qualquer defeito **novo** encontrado durante o trabalho. Se algo não foi verificado, diga que não foi verificado — não presuma.

---

## 10. Ordem de execução

```
FASE 1  →  1.1 (C1)  ·  1.2 (C4)  ·  1.3 (C3)  ·  1.4 (C6)  ·  1.5 (C7)
           1.6 (A3)  ·  1.7 (A4)  ·  1.8 (A1)  ·  1.9 (C5)  ·  1.10 (M1)  ·  1.11 (M2)
           ↓ commit — "corrige falsidades da Tabela Consolidada"

FASE 2  →  2.1 proveniência no tipo  ·  2.2 fonte única por variável
           2.3 testes do pipeline    ·  2.4 invariantes da tabela
           ↓ commit — "torna estruturalmente impossível exportar valor sem origem"

FASE 3  →  3.1 Embrapa real (o objetivo do projeto)  ·  3.2 tipo de solo
           3.3 🛑 Fator C — PERGUNTAR              ·  3.4 🛑 projeção — PERGUNTAR
           ↓ commit por item

FASE 4  →  A2 · A7 · A8 · M3 · M4 · M6 · M7 · M8
           ↓ commit — "correções de menor porte"
```

**Comece pela 1.1 e pela 1.2.** São as duas que produzem afirmações falsas sobre resultado científico e sobre propriedade de terceiros.

---

*Prompt derivado da auditoria de 08/09/2026 sobre o branch `correcoes/auditoria-2026-09` (HEAD `ec31669`). Todos os achados foram verificados por leitura de código e, quando havia artefato disponível, por conferência numérica do arquivo exportado. Os achados internos ao pipeline GEE foram estabelecidos por leitura de código — não havia nenhuma exportação de origem satelital no repositório para conferência empírica.*
