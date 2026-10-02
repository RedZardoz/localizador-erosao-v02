# Prompt de Execução — Fechamento de R e LS, e configuração das APIs

**Data:** 02/10/2026
**Base:** `docs/verificacoes/2026-10-02_verificacao_fatores_R_e_LS.md`, commit `1d1070e`
**Duas partes:** H1 a H3 fecham o portão bibliográfico de R e LS; a PARTE B trata do painel de credenciais.

---

# PARTE 0 — O QUE ESTÁ BOM E NÃO SERÁ REFEITO

O portão bibliográfico foi **levado a sério pela primeira vez**, e isso merece registro antes das correções.

Abri os dois PDFs. São reais. `ah_703.pdf` tem **407 páginas** e SHA iniciando em `cd198687`, com metadados trazendo título e autoria verdadeiros — Renard, Foster, Weesies, McCool, Yoder. `waltrick_2015.pdf` é o artigo autêntico do *RBCS* 39:256-267.

E um dado foi **efetivamente verificado contra o texto**: encontrei `106 Toledo 10623` e também o `11588`. Os valores municipais estão corretos.

`tsc` limpo, 54 arquivos, 409 testes. O padrão de arquivamento — PDF, script, saída bruta — foi seguido.

**Os módulos `fatorR.ts`, `fatorLS.ts` e a integração em `linhaDeBase.ts` não serão reescritos.** O que falta é fechar a origem de três coisas.

---

# PARTE A — H1 a H3

## H1 — Os coeficientes de R precisam de fonte, ou saem

`src/lib/rusle/fatorR.ts:65-67` traz:

```ts
a: 107.52,
b: 46.89,
referencia: "Waltrick et al. (2015) / SBCS-NEPAR Bol. 01 (2011) / Rufino et al. (1993)",
```

Procurei `107,52`, `46,89`, `107.52` e `46.89` nos 44.635 caracteres extraídos com sucesso do PDF do Waltrick. **Nenhum aparece.** As equações que o artigo contém têm coeficiente angular da ordem de **1**, não de 46,89:

```
= 103,31 + 0,73      = -103,63 + 1,08      = -74,47 + 1,05
```

E das três obras citadas, **Rufino et al. (1993)** e **Waltrick et al. (2011)** não estão em `docs/verificacoes/fontes/`.

**O que fazer, nesta ordem:**

1. **Arquive a fonte que de fato contém o par `107,52` e `46,89`**, no padrão de G0 — PDF, script de extração, saída bruta — e **mostre os dois números no texto extraído**.
2. Se a fonte for Rufino et al. (1993), note que é obra antiga e pode não ter camada de texto; nesse caso vale o tratamento de H3.
3. **Se nenhuma fonte acessível contiver o par, os coeficientes SAEM.** O fator R volta a `indisponivel` com causa nomeada, e isso é relatado. Não os substitua pelos do Waltrick sem entender a diferença de definição de `Rc` entre as formulações — trocar coeficiente por semelhança é pior que não ter.
4. Em qualquer caso, **a `referencia` do código deve citar apenas obras arquivadas**. Citar três e arquivar uma faz a referência parecer mais forte do que é.

## H2 — O CHIRPS precisa ser baixado de fato

D13 exige o fator R sobre **CHIRPS climatológico**. Não há cache de CHIRPS em lugar algum do repositório, e **não há diário de requisições**. No lugar, há a tabela `CLIMATOLOGIA_CHIRPS_BP3_ESTACOES` codificada no módulo.

O módulo chama-se e se documenta como baseado em CHIRPS; o dado está embutido nele.

**O que fazer:**

1. Baixe os mensais pela via direta do UCSB, que verifiquei estar acessível sem credencial:
   `https://data.chc.ucsb.edu/products/CHIRPS-2.0/global_monthly/tifs/` — HTTP 200, arquivos desde 1981.
2. Cache local fora do versionamento, como `data/dem_cache/`. Confirme no `.gitignore`.
3. **Emita o diário de requisições** de `src/lib/seguranca/diarioRequisicoes.ts`. Esta é a primeira medição externa real desde que a guarda existe — é também o primeiro teste dela, e o prompt anterior já previa isso.
4. A climatologia passa a ser **calculada** da série baixada, com o período declarado. Se a tabela embutida for mantida como conferência cruzada, declare-a como tal e **não** como fonte.
5. Suporte nativo de 0,05° declarado conforme D06. **Não reamostre para 10 m.**

## H3 — "Conferidas" é forte demais para o que o PDF do Renard permite

O `ah_703.pdf` é **escaneamento sem camada de texto**: a extração das páginas 101 a 112 devolve **1 caractere**. As equações no arquivo de saída, sob o título *"EQUAÇÕES E COEFICIENTES PRIMÁRIOS CONFERIDOS"*, **não foram lidas do PDF** — foram redigidas.

**As constantes parecem corretas**, e há verificação interna que sustenta: na declividade de referência de 9%, `S = 16,8 × 0,08964 − 0,50 = 1,006 ≈ 1`, que é a normalização definidora do fator S. Não peço que as troque.

**O que fazer:**

1. Troque o título e o texto do artefato para separar o que foi provado do que não foi: **o acesso está comprovado** — SHA, paginação e metadados de autoria, todos genuínos e que eu confirmei. **O conteúdo não foi extraído**, por limitação do PDF.
2. **Se quiser a conferência real, use OCR** nas páginas 105 a 107 e 325, e comete a saída. É o único caminho para transformar "acesso comprovado" em "conteúdo conferido".
3. Registre no código, junto das constantes, qual dos dois estados vale.

A distinção não é formalidade: **D25 pré-registrou o `rho_RUSLE` como régua**, e a diferença entre "conferido na fonte" e "formulação padrão reproduzida de memória, internamente consistente" é exatamente o que a banca vai querer saber.

---

# PARTE B — CONFIGURAÇÃO DAS APIs DO PAINEL

O painel está bom: cada serviço tem papel declarado, a Embrapa AgroAPI saiu, e os estados aparecem. Esta parte diz **o que configurar e o que deixar**, com a razão de cada um.

## Configurar agora

**Google Earth Engine — essencial e único bloqueador.** Destrava a dimensão Ê, o sorteio dos polígonos e os preditores espectro-temporais. Nada mais no caminho crítico depende de outra credencial.

**Google Maps — útil por uma razão concreta e específica.** O exportador de planos de voo precisa de `plannedHomePosition` por jornada, e hoje ele propõe o centro do primeiro polígono **marcado como sugestão a confirmar em campo**, porque não há dado de acesso viário. O Street View resolve isso de gabinete: dá para verificar acesso de estrada aos 72 sítios antes de sair. É economia real de deslocamento.

## Deixar sem configurar

**CARTO** já opera no padrão público. A chave só remove marca d'água.

**Mapbox** é conveniência de base cartográfica. Não há nada no método que dependa dela.

**Planet — não é necessária.** Detalho abaixo, porque o pesquisador perguntou.

## Planet: por que não

**Nenhuma decisão a exige.** D05 fixou Sentinel-2 exclusivo na matriz de treino; D26 faz o rótulo vir da delineação de VANT a ~4 cm; D16 e D25 não a mencionam. O papel declarado no painel é *"contexto visual no Inspetor para conferência qualitativa"* — conveniência, não requisito.

**O que ela ofereceria já existe ou é pior.** Para olhar o terreno, o VANT a 4 cm é duas ordens de grandeza melhor; para contexto amplo, Mapbox Satellite HD e o satélite do Google Maps estão no mesmo painel e bastam. PlanetScope a 3 m fica entre os dois sem resolver nada que os outros não resolvam.

**E há um risco que desaconselha ativamente.** Se a imagem de alta resolução for usada para **orientar o observador de campo** sobre o que esperar num ponto, o protocolo cego quebra — e é o rótulo que se perde. A mesma precaução vale para quem delineia o ortomosaico.

**Recomendação:** deixar sem configurar. O campo permanece no painel, os campos `planetApiKey`, `planetSceneId`, `planetMosaicId` e `planetTileUrl` já estão em `CAMPOS_PROIBIDOS_MATRIZ_TREINO`, e a guarda continua valendo se um dia houver necessidade específica — que deve ser **posterior** ao registro do rótulo, nunca anterior.

## JEV: configurar é opcional, mas uma guarda é obrigatória

O JEV pergunta a um modelo *"qual o grau de suscetibilidade à erosão laminar desta coordenada de 0 a 4 segundo a RUSLE?"*, com fallback local `MOTOR_LOCAL_RUSLE`. `scoreJev` e `laudoJev` já estão corretamente proibidos na matriz.

**Mas o nome convida a uma confusão com consequência grave.** `MOTOR_LOCAL_RUSLE` **não é** a linha de base RUSLE de D25. A linha de base é o `A = R·K·LS·C·P` calculado em `linhaDeBase.ts`, com os cinco fatores e suas proveniências. Um escore ordinal de 0 a 4 produzido por modelo de linguagem é outra coisa inteiramente.

**Exigências, independentemente de configurar ou não:**

1. **Teste** que assevere que nenhum valor originado do JEV alcança `montarLinhaDeBaseRUSLE`, `perdaSolo`, ou qualquer insumo de avaliação de D25.
2. **Renomeie** `MOTOR_LOCAL_RUSLE` para algo que não possa ser confundido com a linha de base — por exemplo `HEURISTICA_LOCAL_SUSCETIBILIDADE`.
3. O escore do JEV **nunca** é exibido a quem coleta em campo nem a quem delineia o ortomosaico. Verifique o Inspetor quanto a isso e relate.

---

# PARTE C — PROIBIÇÕES

Valem P1 a P12.

- **P8** — `decisoes.ts` proibido.
- **H1 é bloqueante:** sem fonte arquivada que contenha os coeficientes, eles saem e R fica `indisponivel`.
- **P12** — `indisponivel` não vira valor.
- **Não substitua** `107,52 / 46,89` pelos coeficientes do Waltrick sem entender a diferença de definição de `Rc`.
- **Não use o GEE** para o CHIRPS. A via direta está verificada.
- **Não configure a Planet** sem necessidade declarada e posterior ao registro do rótulo.
- **Não execute o sorteio.**

---

# PARTE D — RELATÓRIO

Gerado por `scripts/gerar_relatorio_fase.ts`. Na seção de juízo:

1. **H1 primeiro:** qual fonte foi arquivada, e os dois coeficientes **visíveis no texto extraído** — ou a declaração de que saíram e R está `indisponivel`.
2. O período de CHIRPS baixado, o número de arquivos, e o **diário de requisições** emitido.
3. Como ficou a redação do artefato do Renard, e se houve OCR.
4. Quantos pontos passam a ter `perdaSolo` calculada, e quantos seguem retidos, por qual fator.
5. O resultado do teste de isolamento do JEV, e o novo nome do motor local.

---

## Nota

As três correções de H1 a H3 são de origem, não de cálculo: os módulos estão escritos e os testes passam. O que está em jogo é se o número que sai deles tem procedência demonstrável.

E vale dizer o que mudou de tom: o portão funcionou. Duas obras reais foram obtidas e arquivadas, e um dado foi conferido no texto. O que falta é a disciplina alcançar os **dois números que mais importam** — os que definem a régua contra a qual o XGBoost será julgado.
