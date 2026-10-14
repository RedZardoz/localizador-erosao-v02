# Prompt de Correção — Alvo Supervisionado Circular no Script de Treino, Bloco LOCO Fabricado e Fila Remanescente

**Sistema de Amostragem e Rotulagem para Erosão Laminar (SAREL)** — PPGTCA 2026
**Versão:** 26/09/2026
**Branch de trabalho:** `sarel/v2`
**Etapas anteriores desta sequência, concluídas e verificadas:**
`PROMPT_CORRECAO_FABRICACAO_RUSLE_2026-09-26.md` → commits `53693a8`, `2774932`, `46bf35f`
`PROMPT_CORRECAO_ROTULO_ARQUIVO01_2026-09-26.md` → commits `4ae6d3c`, `e66d3a9`, `7e42014`
**Governa:** `docs/design.md` (9 Regras Invioláveis, Invariantes 1 e 2)
**Natureza:** o item D1 desta lista é a violação mais grave encontrada em toda a sequência de auditoria: o script que treina o modelo da dissertação aceita, como alvo supervisionado, uma variável **calculada** pelo próprio sistema. Isso torna o resultado circular. **Nada aqui altera física, toma decisão metodológica ou destrava decisão pendente.**

---

> ## Como usar
>
> Abra uma sessão nova do agente na raiz do repositório `geolocalizacao-erosao-propriedade` e cole o bloco abaixo como primeira mensagem.
>
> ```
> Execute docs/planejamento/PROMPT_CORRECAO_ALVO_TREINO_E_FILA_2026-09-26.md.
>
> Leia o arquivo inteiro antes de qualquer ação, começando pela PARTE 0
> (Postura de Execução), e leia também docs/design.md (Regras 1 a 9 e
> Invariantes 1 e 2).
>
> Antes de editar qualquer arquivo:
> 1. reproduza os achados D1 a D6 da PARTE I e cole a evidência bruta de cada
>    um (trecho com número de linha real, citado literalmente);
> 2. se algum achado não se reproduzir exatamente como descrito, PARE e me
>    informe a divergência;
> 3. responda às QUESTÕES ABERTAS Q1 a Q4 com sua recomendação e aguarde
>    minhas decisões — três delas mudam comportamento científico e uma muda
>    assinatura pública;
> 4. declare o escopo arquivo por arquivo e aguarde autorização.
>
> T1 é uma regressão introduzida pelos commits de hoje: comece por ela.
> ```

---

# PARTE 0 — POSTURA DE EXECUÇÃO

Contrato permanente de conduta, não crítica. As duas execuções anteriores foram corretas e uma delas encontrou, por iniciativa própria, um código morto que o revisor não havia visto. Os doze itens abaixo consolidam o padrão para que nenhuma execução dependa de sorte.

1. **Não herde o escopo da ferramenta que você audita.** O varredor de padrões proibidos lê apenas `src/lib` e `scripts/`; isso é o **objeto** da auditoria, não o seu escopo de busca. Varra `src` inteiro e `scripts/`, incluindo `.tsx` e `.py`, antes de declarar cobertura.

2. **Procure a implementação correta antes de escrever uma nova.** Se o repositório já tem a versão certa, convirja para ela. Duplicata divergente foi a causa de dois prompts desta sequência.

3. **Toda correção declara o novo modo de falha que ela introduz.** Entre duas saídas honestas, prefira a **falha proporcional** — descartar o registro com contagem declarada — à falha total.

4. **Quando a correção piora um número, entregue o número**, com casas decimais, não a previsão qualitativa.

5. **Citação literal, nunca paráfrase**, em qualquer registro citável em defesa: nome de variável real, linha real, texto real.

6. **Registre o achado incidental no instante em que o vê**, com âncora `arquivo:linha`, num bloco que cresce durante a execução. É assim que se impede acúmulo silencioso entre execuções.

7. **Quando duas leituras plausíveis levam a resultados diferentes, pergunte antes de agir** — e execute, enquanto espera, tudo o que não depende da resposta.

8. **Não afirme conclusão sem o artefato.** "Criado conforme a especificação" não é verificação.

9. **Prefira tornar o defeito visível a torná-lo ausente.** Falhar alto e cedo, nunca preencher, imputar ou rotular por omissão.

10. **Mudança de assinatura ou contrato público é decisão declarada**, não improviso.

11. **Coerência entre artefatos é parte da correção.** Quando você muda **quantos** registros um artefato emite, verifique todo artefato do mesmo pacote que declara essa contagem. O commit `4ae6d3c` reduziu as linhas do Arquivo 01 sem ajustar a contagem declarada no Arquivo 04, e é o item T1 deste prompt.

12. **Comentário normativo no código canônico é norma, e norma pede busca por quem a viola.** `src/lib/matriz/montagem.ts:138` escreve, em comentário, *"NUNCA usar ponto.classeAmostral calculado por NDVI/BSI para definir o alvo y do treino"*. Ao encontrar uma proibição assim, procure imediatamente quem a desobedece em outro arquivo — foi o que revelou o item D1, o mais grave da auditoria.

---

# PARTE I — DIAGNÓSTICO VERIFICADO

Confirmado por leitura direta em 26/09/2026, após os seis commits das etapas anteriores. Ordenado por gravidade científica, exceto T1, que vem primeiro por ser regressão recente. **Reproduza cada item antes de corrigir**; divergência de linha exige parada e relato.

## D1 — CRÍTICO: o script de treino aceita variável calculada como alvo supervisionado

**Arquivo:** `scripts/treinar_xgboost_loco.py`, linhas 421-424.

```python
421:    elif 'classeAmostral' in df.columns:
422:        y_mapped = df['classeAmostral'].map({'erosao': 1, 'controle': 0})
423:        if y_mapped.notna().any() and y_mapped.nunique() > 1:
424:            y_series = y_mapped.fillna(0).astype(int)
```

`classeAmostral` **não é observação humana**. É saída de um classificador espectral do próprio sistema: `src/store/useSarelStore.ts:176` atribui `classeAmostral: classificarPontoEspectral(bsiVal, ndviVal)`, e `src/app/api/gee/select-candidates/route.ts:716` a define a partir de `classeEspectral`. O tipo declara sua natureza em `src/types/ponto.ts:67`: `classeAmostral?: ClasseAmostral; // Classe biofísica amostral`.

A implementação canônica proíbe isso por escrito, em `src/lib/matriz/montagem.ts:137-138`:

```ts
137:    // Determinação do alvo supervisionado binário exclusivamente a partir do rótulo humano (Regra 4 / Invariante 1:
138:    // NUNCA usar ponto.classeAmostral calculado por NDVI/BSI para definir o alvo y do treino)
```

**Por que é o achado mais grave da auditoria.** A Regra 4 (`docs/design.md:17`) determina que modelos e índices *"jamais atuam como gabarito supervisionado"*. Aqui o gabarito é literalmente a saída de uma regra de NDVI/BSI. E o vazamento é **circular**: `NDVI`, `BSI`, `Banda_B2`, `Banda_B4`, `Banda_B8` e `Banda_B12` são colunas permitidas da matriz de treino (`src/lib/matriz/perfis.ts:130-161`). O XGBoost seria treinado para reproduzir `classificarPontoEspectral` a partir dos mesmos insumos espectrais que a geraram. A acurácia relatada mediria a capacidade do modelo de reaprender um limiar de índice — **não** de detectar erosão laminar. Qualquer métrica publicada a partir deste caminho é inválida, e a banca pode demonstrar a circularidade em uma pergunta.

## D2 — Bloco espacial da validação LOCO tem literal fabricado como último recurso

**Arquivo:** `scripts/treinar_xgboost_loco.py`, linhas 402-407.

```python
402:    if 'Latitude' in df.columns and 'Longitude' in df.columns:
403:        df['bloco_loco'] = [identificar_bacia_real(lat, lon) for lat, lon in zip(df['Latitude'], df['Longitude'])]
404:    elif 'bacia' in df.columns and df['bacia'].notna().any() and not (df['bacia'] == 'Bacia Local').all():
405:        df['bloco_loco'] = df['bacia']
406:    else:
407:        df['bloco_loco'] = 'Bacia do Rio Ivaí'
```

**Ressalva de alcançabilidade, a preservar no relatório:** o caminho primário da linha 403 deriva a bacia das coordenadas reais via `identificar_bacia_real`, e toda planilha exportada pelo sistema carrega `Latitude` e `Longitude`. A linha 407 é, portanto, **terceiro nível de fallback**, alcançável apenas quando o dataframe não tem coordenadas **nem** coluna `bacia` utilizável. Não é o caminho comum. Não descreva este item como defeito de alta incidência.

Ainda assim é defeito, por dois motivos:

1. **Colapsaria a validação cruzada espacial se alcançado.** O script é `treinar_xgboost_loco` — *leave-one-cluster-out*. Com um único cluster não há partição espacial, e o erro estimado deixa de controlar autocorrelação, tornando-se otimista (Roberts et al., 2017). Pior: falharia silenciosamente, porque o script seguiria rodando.
2. **Nomeia bacia fora do recorte declarado.** O recorte da pesquisa é a Bacia do Paraná 3 (`Justificativa_Recorte_Espacial_Parana3_SAREL.pdf`, `docs/Delimitacao_Territorial_e_Selecao_Amostral_MultiEscala_BP3.md`). "Bacia do Rio Ivaí" é outra bacia: o literal afirma uma geografia que não é a do estudo.

## D3 — Rótulo ausente convertido em classe confiante

**Arquivo:** `scripts/treinar_xgboost_loco.py`, linhas 240, 413 e 420.

```python
240:        df_erosao['Classe_Alvo_Binaria'] = df_erosao['Classe_Alvo_Binaria'].fillna(1).astype(int)
413:            y_series = df['Classe_Alvo_Binaria'].fillna(0).astype(int)
420:            y_series = df['Classe_Alvo_Binaria'].fillna(0).astype(int)
```

Linha 240: registro sem rótulo, dentro da planilha de erosão, torna-se **positivo**. Linhas 413 e 420: registro sem rótulo torna-se **negativo**. Mesmo defeito corrigido no Arquivo 01 pelo commit `4ae6d3c`, aqui aplicado ao alvo do modelo que efetivamente treina.

Observação de justiça, a preservar na correção: `df_erosao['Classe_Alvo_Binaria'] = 1` na linha 238, quando a coluna **não existe**, é rotulagem pela procedência da planilha — o pesquisador fornece uma planilha de pontos de erosão confirmada. Isso é legítimo e deve apenas ser **declarado explicitamente** na saída do script, não removido.

## D4 — REGRESSÃO DE HOJE: o Datasheet declara contagem divergente do Arquivo 01

**Arquivo:** `src/lib/export/pacoteReprodutibilidade.ts`, linhas 780 e 501.

```ts
780:  const f4_datasheet = gerarJsonDatasheetMetadados(pontos.length);
501:      totalAmostrasTreinamento: totalPontos,
```

O commit `4ae6d3c` fez o Arquivo 01 emitir apenas o subconjunto com rotulagem humana consolidada, mas o Arquivo 04 (Datasheet, conformidade Gebru et al., 2021) continua declarando `pontos.length`. **No mesmo ZIP, dois números incompatíveis.** No estado atual, com a campanha não consolidada, o Datasheet declara o total recebido enquanto a matriz de treino tem zero linhas de dados.

Antes de `4ae6d3c` as contagens coincidiam; a correção tornou a divergência material. É o caso exemplar da Postura 11.

## D5 — Terceira implementação do alvo supervisionado, em `planilha.ts`

**Arquivo:** `src/lib/export/planilha.ts`, função `extrairLinhasPorPerfil`, perfil `"matriz-treino"`, linhas 175-224.

```ts
177:    const rotuloStr = (p.rotulo?.final?.classe ?? "nao-rotulado").trim().toLowerCase();
...
220:      Classe_Alvo_Binaria: p.rotulo?.final ? (ehErosao ? 1 : 0) : "",
221:      Rotulo_Classe: p.rotulo?.final?.classe ?? "não rotulado",
222:      Rotulo_Modalidade: p.rotulo?.final?.modalidade ?? "não rotulado",
```

**Reconhecimento devido:** esta implementação **não fabrica** o alvo. A linha 220 emite célula vazia quando não há rótulo, e a binarização das linhas 178-185 já é a completa, equivalente à canônica. É honesta.

Os defeitos são outros três:

- **D5.a** — lê `p.rotulo?.final` em vez de `rotulosConsolidados`, divergindo da fonte autoritativa decidida na etapa anterior;
- **D5.b** — emite a linha do ponto sem rótulo, com alvo vazio, em vez de excluí-la com motivo registrado como faz `montagem.ts:112` e `:117`;
- **D5.c** — não invoca `assegurarSegregacaoTreino`, permitindo que ponto rotulado por drone entre no perfil `matriz-treino` e quebre o *held-out* (D16).

**Risco combinado com D3:** `planilha.ts` emite `""` honestamente, e `scripts/treinar_xgboost_loco.py:413` converte esse vazio em `0` com `.fillna(0)`. A fabricação se completa no arquivo seguinte. Corrigir D3 sem D5 deixa a porta aberta; corrigir os dois fecha o caminho.

**Chamadores:** `src/components/campanha/PainelCampanha.tsx:46` chama `gerarCsvCientifico(pontosAtivos, perfil)`, com `"matriz-treino"` entre os perfis oferecidos (linha 184). Assinatura atual: `src/lib/export/csv.ts:19`. Ver **Q1**.

## D6 — Fallback entre fontes de rótulo no Inspetor, com erro de forma em tempo de execução

**Arquivo:** `src/components/inspetor/InspetorPonto.tsx`, linhas 118-119.

```tsx
118:  const rotuloConsolidado = rotulosConsolidados[ponto.codigo] ?? (ponto.rotulo ? { final: ponto.rotulo, origens: [ponto.rotulo] } : null);
119:  const rotuloFinal = rotuloConsolidado?.final;
```

Dois problemas:

- **D6.a** — é exatamente o *fallback entre fontes de verdade* proibido na etapa anterior: procedência de rótulo decidida por qual objeto existe primeiro.
- **D6.b** — erro de forma. `ponto.rotulo` é do tipo `RotuloConsolidado` (`src/types/ponto.ts:114`), e `RotuloConsolidado.final` é `Rotulo | null` (`src/types/rotulo.ts`). Envolver `ponto.rotulo` em `{ final: ponto.rotulo }` faz `rotuloFinal` receber um `RotuloConsolidado`, que **não possui** `classe`, `modalidade`, `observador`, `observadoEm` nem `cego`. As linhas 484, 488, 492, 496 e 500 renderizam justamente esses campos.

Dedução a comprovar com teste: quando o caminho de fallback é tomado, o card de rótulo humano exibe campos vazios e `cego` resolve para "Não". **Prove com teste antes de corrigir**, e relate por que `npx tsc --noEmit` aceita a expressão — um caminho de tipagem frouxa aqui é informação que interessa por si.

## Q1 a Q4 — QUESTÕES ABERTAS (responder antes de executar as tarefas correspondentes)

**Q1 (para D5).** `gerarCsvCientifico(pontos, perfil)` (`src/lib/export/csv.ts:19`) não recebe `rotulosConsolidados`. Convergir o perfil `matriz-treino` para `montarMatrizTreino` exige acrescentá-lo à assinatura e passá-lo em `PainelCampanha.tsx:46`. Recomende, liste os chamadores afetados, aguarde. Alternativa a considerar e comparar: fazer o perfil `matriz-treino` de `planilha.ts` **delegar** inteiramente a `montarMatrizTreino`, eliminando a terceira implementação em vez de consertá-la.

**Q2 (escopo do varredor).** `src/lib/seguranca/padroesProibidos.test.ts:168` fixa a raiz em `src/lib` (`path.resolve(__dirname, "..")`) e a linha 160 aceita só `.ts`, excluindo `.test.ts`. Logo `src/app`, `src/components`, `src/config` e `src/store` nunca foram varridos. Duas saídas já levantadas:
(i) ampliar para `src/` completo com `.tsx`, expondo `||` e `??` legítimos de layout;
(ii) ampliar para `src/lib`, `src/app/api`, `src/store` e `src/config`, mantendo `src/components` sob regra própria.
Recomende uma, com a contagem real de violações que cada alternativa expõe hoje — levante a contagem antes de recomendar.

**Q3 (fabricação por ternário na estratificação).** `src/app/api/gee/select-candidates/route.ts:458-462`:

```ts
458:          frequenciaSoloNu:
459:            medS2 && typeof medS2.frequenciaSoloNu === "number"
460:              ? medS2.frequenciaSoloNu
461:              : 0,
462:          nivelK: convK ? convK.nivelEstratoK : 1,
```

Ponto sem Sentinel-2 entra na estratificação como "solo nunca exposto"; ponto sem classe pedológica entra como erodibilidade nível 1. Ambos contaminam os 18 estratos (D12). Nenhuma regex de `??` ou `||` detecta ternário. Observe que a linha 457 (`declividadePct: medTerreno ? ... : 0`) é praticamente inalcançável, protegida pelo *early return* da linha 449 — as outras duas não têm guarda. Duas saídas: descartar o candidato incompleto como já se faz com `medTerreno`, ou criar estrato explícito `"INDISPONIVEL"` fora da matriz canônica. Recomende.

**Q4 (colunas do Arquivo 01).** Registrada em `4ae6d3c` e reafirmada: `gerarCsvMatrizTreinamento` declara lista própria de colunas em vez de consumir `obterColunasPermitidas("matriz-treino")`, e carrega `Latitude`, `Longitude`, `Latitude_DMS`, `Longitude_DMS`, `Municipio`, `Codigo_IBGE`, `RUSLE_Fator_LS` e `RUSLE_Fator_C`. Alternativas (i) renomear o artefato e declarar coordenada como metadado de rastreio, ou (ii) cindir em compêndio + matriz estrita. Recomende, sem executar até decisão.

---

# PARTE II — TAREFAS AUTORIZADAS

Ordem obrigatória. T1 primeiro por ser regressão. T4 e T5 dependem de Q1. T6 depende de Q2 e Q3.

## T1 — Coerência de contagem entre Arquivo 01 e Arquivo 04 (D4)

1. `gerarJsonDatasheetMetadados` passa a receber a contagem **efetivamente emitida** na matriz de treino, não `pontos.length`.
2. Declare as duas grandezas no datasheet, com nomes inequívocos: `totalAmostrasRecebidas` e `totalAmostrasTreinamento` (esta igual às linhas de dados do Arquivo 01). Um número sozinho não distingue recebido de emitido, e essa ambiguidade é a origem de D4.
3. **Teste de coerência entre artefatos** — a asserção que impede a regressão voltar: gerar o pacote completo e asseverar que `totalAmostrasTreinamento` do Arquivo 04 é **igual** ao número de linhas de dados do Arquivo 01 (excluídos cabeçalho, censo e comentários `#`).

### Aceite de T1
- `grep -n 'gerarJsonDatasheetMetadados(pontos.length)' src/lib/export/pacoteReprodutibilidade.ts` → zero linhas.
- Teste de coerência presente e verde, com o caso de rotulagem parcial (alguns pontos rotulados, outros não).

## T2 — Eliminar o alvo supervisionado circular (D1)

No `scripts/treinar_xgboost_loco.py`:

1. **Remover integralmente** o ramo `elif 'classeAmostral' in df.columns` das linhas 421-424. Não substituir por outra heurística.
2. No lugar, abortar com mensagem que nomeie a regra: sem coluna `Classe_Alvo_Binaria` proveniente de rotulagem humana consolidada, o treino não ocorre. Cite a Regra 4 e o comentário normativo de `montagem.ts:137-138`.
3. Registrar no cabeçalho da saída do script a **procedência declarada do alvo**: de qual arquivo e coluna veio `y`, e quantos registros por classe.

Não tratar como equivalente: `classeAmostral` é saída de `classificarPontoEspectral(bsi, ndvi)`; rótulo é observação humana. A substituição de um pelo outro é o defeito.

### Aceite de T2
- `grep -n "classeAmostral" scripts/treinar_xgboost_loco.py` → zero ocorrências em caminho que defina `y_series`.
- Execução sem coluna de alvo humano termina em aborto explícito, com a mensagem colada no relatório.

## T3 — Bloco LOCO honesto (D2)

1. Remover o literal `'Bacia do Rio Ivaí'` da linha 407.
2. Sem informação de bacia por ponto, **abortar** a validação cruzada espacial, com a razão: LOCO exige cluster real; cluster único não estima erro sob autocorrelação espacial (Roberts et al., 2017).
3. Havendo bacia para parte dos pontos: descarte proporcional com contagem declarada (Postura 3), e aborto apenas se restarem menos de 2 clusters — convergindo com o padrão já implantado no Arquivo 05 pelo commit `e66d3a9` (linhas 668-703), que você deve ler e espelhar em vez de inventar formato novo.
4. Imprimir o número de clusters e a distribuição de pontos por cluster antes de ajustar.

### Aceite de T3
- `grep -n "Bacia do Rio Ivaí" scripts/` → zero linhas.
- Saída do script mostra contagem de clusters e distribuição, ou aborto explícito.

## T4 — Rótulo ausente nunca vira classe (D3)

1. Remover `.fillna(1)` da linha 240 e `.fillna(0)` das linhas 413 e 420.
2. Registro sem alvo é **descartado** da matriz, com contagem declarada por motivo — nunca imputado.
3. Manter a rotulagem por procedência de planilha da linha 238, acrescentando declaração explícita na saída: quantos registros receberam alvo pela procedência do arquivo, e qual arquivo.
4. Se após o descarte houver menos de duas classes representadas, abortar: classificação binária exige contraste real, como o próprio *docstring* das linhas 230-234 já argumenta, inclusive nomeando o bloqueio Anti-Mock. Aproveite esse texto, não o reescreva.

### Aceite de T4
- `grep -nE "Classe_Alvo_Binaria.*fillna" scripts/treinar_xgboost_loco.py` → zero linhas.
- Contagem de descartes impressa; aborto verificado no caso de classe única.

## T5 — Convergir o perfil `matriz-treino` de `planilha.ts` (D5) — depende de Q1

Conforme a decisão de Q1, eliminar a terceira implementação: delegar a `montarMatrizTreino` ou, no mínimo, (a) usar `rotulosConsolidados` como fonte única, (b) excluir ponto sem rótulo e ponto com divergência pendente, com motivo registrado, e (c) aplicar `assegurarSegregacaoTreino` como **pós-condição** sobre as linhas efetivamente emitidas — mesmo padrão do commit `4ae6d3c`, linhas 123-127 de `pacoteReprodutibilidade.ts`, que você deve ler antes.

Preservar o que já está certo: a binarização das linhas 178-185 e a célula vazia da linha 220 não são defeito.

### Aceite de T5
- Ponto sem rótulo não aparece no CSV do perfil `matriz-treino`.
- Ponto com modalidade `drone` não é emitido, e a tentativa de emiti-lo dispara a exceção canônica.
- Zero duplicação da regra de binarização no repositório: uma única fonte.

## T6 — Fallback de rótulo no Inspetor (D6)

1. Remover o fallback da linha 118. `rotulosConsolidados` é a fonte única.
2. Quando não houver rótulo consolidado para o ponto, o card declara a ausência — não inventa objeto.
3. Antes de corrigir, **prove o defeito D6.b com teste** e relate por que `tsc` o aceitava.

### Aceite de T6
- Teste demonstrando o estado anterior (campos vazios no caminho de fallback) e o posterior.
- `npx tsc --noEmit` e `npm run build` limpos.

## T7 — Evidência de verificação (Regra 8)

Criar `docs/verificacoes/2026-09-26_alvo_supervisionado_circular_script_treino.md`, no formato de `docs/verificacoes/2026-09-10_distorcao_projecao_declividade.md`, contendo:

1. Citação literal das linhas 421-424 e da cadeia que prova a natureza calculada de `classeAmostral` (`useSarelStore.ts:176` → `classificarPontoEspectral`), mais o comentário normativo de `montagem.ts:137-138`.
2. **Demonstração da circularidade**: quais colunas da matriz de treino (`perfis.ts:130-161`) alimentam `classificarPontoEspectral`, e por que treinar sobre elas para prever sua própria saída mede reaprendizado de limiar, não detecção de erosão.
3. Demonstração de D2: efeito de cluster único sobre a estimativa de erro em validação espacial, com a referência de Roberts et al. (2017), e o registro de que "Bacia do Rio Ivaí" está fora do recorte da Bacia do Paraná 3.
4. Demonstração de D4 com os dois números divergentes do mesmo ZIP, antes e depois.
5. Saídas literais de `npx vitest run`, `npx tsc --noEmit`, `npm run build` e da execução do script em cada cenário de aborto.
6. Declaração de que D13 e D15 permanecem `pendente` e que nenhum valor de R, LS ou A foi produzido.

## T8 — Commits

Um commit por tarefa, na ordem T1 a T7, mensagens em português no padrão do repositório (`git log --oneline -6`). Cada mensagem termina com a identificação do **executor real** — o nome e a versão do agente que de fato escreveu o código:

```
Co-Authored-By: <nome e versão do agente executor> <identificador>
```

**Proibido assinar com a identidade de outro agente.** Em particular, não use `Claude Opus 5`: esse identificador pertence ao agente de auditoria e especificação desta sequência, que não escreve o código das fases. Atribuir a ele trabalho que você executou corrompe o registro de proveniência que o pesquisador declarará academicamente. Use sempre a sua identidade, de forma idêntica em todos os seus commits — por exemplo `Co-Authored-By: Antigravity (Advanced Agentic Pair Programmer) <noreply@antigravity>`.

Sem `push`, sem tag, sem PR sem autorização explícita.

---

# PARTE III — PROIBIÇÕES ABSOLUTAS

## P1 — Não tocar na geração dry-run sintética do script de treino

`scripts/treinar_xgboost_loco.py:300-331` gera controles sintéticos e está **correto**: opt-in por flag `--permitir-dryrun-sintetico` com recusa por padrão na linha 252, marca d'água `CTRL-DRYRUN-` nos códigos, tipologia `"Controle / SPD (Dry-Run)"`, `# permitido:` justificado em cada `np.random`, e propagação de `eh_dryrun` até as funções de relatório (linhas 689, 701, 721, 741). É o padrão da casa feito certo. Não remova, não "limpe", não altere o gate. Se julgar que há defeito ali, registre e pare.

## P2 — `montagem.ts` e `ingestaoDrone.ts` são referência, não alvo

Não alterar `src/lib/matriz/montagem.ts` nem `src/lib/rotulos/ingestaoDrone.ts`. A convergência é na direção deles. Defeito encontrado neles: registrar e **parar para consultar**.

Fica registrado, sem execução: `montagem.ts:202` (`assegurarSegregacaoTreino`) é código inalcançável, pois as linhas 195-199 desviam `drone` para `heldOutDrone` com `continue` antes dela. A proteção efetiva ali é a exclusão, não a exceção.

## P3 — Não relaxar a binarização canônica

Proibido remover termos de `montagem.ts:141-147` para igualar implementações. A convergência é para a regra mais completa.

## P4 — Não inferir fonte autoritativa de rótulo, e nunca encadear fontes

`rotulosConsolidados` é a fonte única, decidida na etapa anterior. Proibido ler de duas fontes com fallback de uma para a outra, em qualquer arquivo: fallback entre fontes de verdade é fabricação de procedência.

## P5 — Fator R, Fator LS e Perda de Solo A permanecem retidos

`D13` e `D15` seguem `pendente` (`src/config/decisoes.ts:139` e `:156`). Não alterar `linhaDeBase.ts`, `fatorC.ts`, `fatorK.ts` nem `rusle.test.ts`. Continuam válidas na íntegra as proibições das duas etapas anteriores, inclusive a rejeição de `R` por latitude/longitude/elevação e de `LS` por rampa fixa de 30 m.

## P6 — Não alterar as listas de permissão de exportação

`src/lib/matriz/perfis.ts` materializa o Invariante 2. Nenhuma coluna acrescentada ou removida, em nenhum perfil. Q4 permanece não executada até decisão.

## P7 — Não executar Q2, Q3 e Q4 antes da decisão

Levantar dados e recomendar é parte da tarefa; executar não é.

## P8 — Não tocar em SAREL 1 e em legado

Nada em `legado/`, `docs/legado/` ou dados de SAREL 1 (Regra 9).

## P9 — Nenhuma asserção sem prova

Regra 8 e Postura 8. Nada declarado verificado sem artefato; nenhum teste relatado verde sem a saída colada.

---

# PARTE IV — RELATÓRIO FINAL EXIGIDO

1. **Reprodução de D1 a D6** com evidência bruta literal e linha real, antes de qualquer edição.
2. **Respostas a Q1, Q2, Q3 e Q4** conforme decidido, com a contagem real de violações que Q2 expõe em cada alternativa.
3. **Diff completo** por arquivo tocado.
4. **Saídas literais** de `npx vitest run`, `npx tsc --noEmit`, `npm run build` e das execuções do script em cada cenário de aborto.
5. **Prova de D1 eliminado**: execução sem coluna de alvo humano abortando, com a mensagem.
6. **Prova de D4 eliminado**: as duas contagens do mesmo ZIP, iguais, no caso de rotulagem parcial.
7. **Prova de D6.b**, com a explicação de por que `tsc` aceitava.
8. **Números concretos** (Postura 4): registros recebidos, emitidos, descartados por motivo, distribuição de classes, número de clusters LOCO.
9. **Novos modos de falha introduzidos** (Postura 3), um por correção.
10. **Bloco de achados incidentais** acumulado (Postura 6), com âncora, inclusive o que parecer menor.
11. **Declaração** de que D13 e D15 permanecem `pendente` e que nenhum valor de R, LS ou A foi produzido.
12. **Lista do que não foi feito** e por qual proibição.

Conclusão parcial é aceitável, com o que ficou e por quê. Conclusão inexistente não é.

---

## Referências normativas do sistema

- **Regras 1 a 9 e Invariantes 1 e 2:** `docs/design.md:14-22` e `:73-74`
- **Regra 4 (rótulo apenas de observação humana):** `docs/design.md:17`
- **Proibição normativa de `classeAmostral` como alvo:** `src/lib/matriz/montagem.ts:137-138`
- **Implementação canônica da matriz de treino:** `src/lib/matriz/montagem.ts:93-234`
- **Guarda de segregação do padrão-ouro:** `src/lib/rotulos/ingestaoDrone.ts:119-125`
- **Padrão de aborto e descarte proporcional já implantado:** `src/lib/export/pacoteReprodutibilidade.ts:664-703` (commit `e66d3a9`)
- **Pós-condição de held-out já implantada:** `src/lib/export/pacoteReprodutibilidade.ts:123-127` (commit `4ae6d3c`)
- **Recorte espacial da pesquisa:** `docs/Delimitacao_Territorial_e_Selecao_Amostral_MultiEscala_BP3.md`
- **Etapas anteriores:** `docs/planejamento/PROMPT_CORRECAO_FABRICACAO_RUSLE_2026-09-26.md` e `docs/planejamento/PROMPT_CORRECAO_ROTULO_ARQUIVO01_2026-09-26.md`

## Referências científicas citadas neste prompt

- Roberts, D. R. et al. (2017). Cross-validation strategies for data with temporal, spatial, hierarchical, or phylogenetic structure. *Ecography*, 40(8), 913-929.
- Chen, T. & Guestrin, C. (2016). XGBoost: A Scalable Tree Boosting System. *Proceedings of KDD 2016*, 785-794.
- Gebru, T. et al. (2021). Datasheets for Datasets. *Communications of the ACM*, 64(12), 86-92.
- Kaufman, S. et al. (2012). Leakage in data mining: Formulation, detection, and avoidance. *ACM Transactions on Knowledge Discovery from Data*, 6(4), 1-21.
- Wilkinson, M. D. et al. (2016). The FAIR Guiding Principles for scientific data management and stewardship. *Scientific Data*, 3, 160018.
