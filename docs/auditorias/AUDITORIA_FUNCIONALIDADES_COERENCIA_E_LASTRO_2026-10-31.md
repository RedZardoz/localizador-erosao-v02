# Auditoria de Funcionalidades, Coerência Metodológica e Lastro Bibliográfico — SAREL v2

**Data:** 31 de outubro de 2026
**Commit auditado:** `f63d8a5` (branch `sarel/executor-2026-10-09`, árvore limpa)
**Objeto:** aplicação SAREL v2 (Next.js/TypeScript), módulos científicos, registro de decisões D01–D26 e parâmetros P01–P24, documentação pública e acervo bibliográfico.
**Natureza:** auditoria técnica independente, somente leitura. Não altera decisões, não promove parâmetros e não corrige código.
**Fora de escopo:** execução viva em GEE, Planet, Embrapa e bases fundiárias; validação estatística de resultados (não há resultado empírico); julgamento de mérito das escolhas metodológicas do pesquisador.

> **Regra de leitura:** esta auditoria separa três perguntas que costumam ser confundidas — (i) *o software faz o que diz que faz?*; (ii) *o que ele faz coincide com o que foi decidido?*; (iii) *o que foi decidido tem lastro externo verificável?*. Um “sim” em (i) não implica “sim” em (ii) nem em (iii).

---

## 1. Sumário executivo

### 1.1 O que está sólido

1. **Arquitetura de integridade incomum para um projeto de mestrado.** As 9 Regras, o tipo `Proveniencia<T>`, os 7 invariantes de exportação e o registro de decisões com `exigirDecisao` formam uma malha real, não decorativa. A matriz de treino é montada por lista de permissão, e os invariantes são executados no ato da exportação, não apenas documentados (`src/lib/export/planilha.ts:370`, `src/lib/export/csv.ts:38`).
2. **O avaliador D25 é o melhor artefato científico do repositório.** Ele exige pré-registro com hash, consome o held-out uma única vez, agrupa o bootstrap por polígono, proíbe alvo e chaves como preditores e separa o competidor RUSLE do modelo (`scripts/d25/avaliacao_d25_referencia.py:52-59`, `:357-415`).
3. **A honestidade sobre dados sintéticos está preservada.** O relatório de benchmark com acurácia 1,0 carrega `"dados_100pct_empiricos": false` e a frase “Não utilizável na dissertação” (`docs/relatorios/modelagem/relatorio_modelagem_xgboost_loco.json:7-14`). O erro está exposto, não varrido.
4. **A linha de base RUSLE não fabrica valores ausentes.** Quando faltam fatores, `perdaSolo` permanece `indisponivel` com causa e motivo, e a memória de cálculo é `null` (`src/lib/rusle/linhaDeBase.ts:124-169`).
5. **O sorteio D16 atual é o de 72 polígonos, com `pi_i = 4/N_h` e Fisher-Yates semeado**, e recusa candidatos sintéticos e sobrescrita de selo (`src/lib/gee/sorteioPoligonos.ts:385-561`).

### 1.2 O que impede o uso probatório hoje

1. **A decisão D11.2, de 31/10/2026, não governa o caminho que produz os estratos.** O código ainda usa o piso antigo de 6 observações para Ê, e a guarda que impediria Ê degradado de entrar nos tercis é contornada porque a rota não envia a proveniência exigida. Isso atinge a definição dos 18 estratos, não um detalhe de tela (F-01).
2. **O critério central da dissertação — comparar XGBoost com RUSLE no held-out — não é executável a partir do app**, porque R e LS nunca são fornecidos à linha de base e `RUSLE_A` sai vazio. O próprio config de pré-registro reconhece que o desfecho será `NAO_AVALIAVEL` (`scripts/d25/config_pre_registro_PROPOSTA.json:61`). É F-02.
3. **A eleição de amostras do app não é a amostragem probabilística de D23.** Há semente fixa 42, complemento por ordem de chegada sem `pi_i`, redistribuição de cota para estratos ocupados e descarte silencioso de estratos vazios (F-03).
4. **P03, D22, D23 e parte de D13/D15 estão decididas no registro, mas não no código.** O padrão é sempre o mesmo: a decisão foi emendada, o código e os testes ficaram no estado anterior (F-04 a F-06, F-18).
5. **O acervo bibliográfico não sustenta todas as citações que o registro invoca.** Na matriz de cobertura, 41 linhas, apenas 16 apontam para arquivo, 7 existem, 9 estão quebradas e 25 não têm arquivo local; as duas travas automáticas de lastro são vácuas (F-17).

### 1.3 Contagem

| Severidade | Quantidade | Consequência |
|---|---:|---|
| **S1 — bloqueante para uso probatório** | 3 | D11.2, RUSLE/D25 e amostragem D23 |
| **S2 — alta** | 9 | P03, D22, atribuição D20, valores fabricados, JEV, kappa, funcionalidades anunciadas, lastro bibliográfico, CI |
| **S3 — média** | 7 | persistência, invariante 6, registro defasado, tercis/estratos, pisos amostrais, variograma, marca de R |
| **S4 — baixa** | 1 | overlay de erro, benchmark legado e fallback de sessão (agrupados em F-20) |

**Não há indício de fabricação de resultados experimentais.** Há, isso sim, **divergência entre o que está decidido, o que está implementado e o que está documentado** — e é exatamente esse triplo desalinhamento que uma banca examina.

---

## 2. Escopo, método e limites

### 2.1 O que foi inspecionado

- **Aplicação:** `src/app/page.tsx`, `src/app/api/**/route.ts`, `src/components/**` (Sidebar, Header, Campanha, Matriz, Exportação, Inspetor, JEV).
- **Núcleo científico:** `src/lib/gee/`, `src/lib/rusle/`, `src/lib/matriz/`, `src/lib/rotulos/`, `src/lib/fundiario/`, `src/lib/seguranca/`, `src/lib/export/`.
- **Registro:** `src/config/decisoes.ts` integral, `docs/planejamento/DECISOES.md`, `src/config/*.test.ts`.
- **Documentação pública:** `README.md`, `docs/README.md`, `docs/metodologia/FICHA_TECNICA_SAREL.md`, `docs/bibliografia/INVENTARIO_SELECAO_BIBLIOGRAFICA.md`.
- **Execução:** `npm run typecheck`, `npm run lint -- --max-warnings 0`, `npm test`.
- **Acervo:** verificação de existência física dos caminhos citados na matriz bibliográfica (script de checagem local, resultado na §6.5).

### 2.2 Critérios

- **Funcional:** a funcionalidade existe, é alcançável pela interface ou por uma rota, e produz o artefato que a documentação promete.
- **Coerência:** o comportamento corresponde à decisão vigente, com a mesma unidade, o mesmo operador e a mesma população.
- **Lastro:** a afirmação científica tem fonte externa archivable, e a fonte foi conferida no primário ou está marcada como não conferida (R-L1 a R-L5).
- **Rastreabilidade:** o dado carrega proveniência suficiente para um terceiro reconstruir a decisão.

### 2.3 Limites declarados

1. **`npm test` não pôde ser executado neste ambiente.** O Vitest falha ao carregar o config com `spawn EPERM` em `vite/.../node.js:2497` (`optimizeSafeRealPathSync`), consequência do caminho com caracteres não ASCII e da restrição de `child_process` do sandbox desta sessão. **Isso não é evidência de teste quebrado**: é limitação do ambiente de auditoria. A afirmação “663 testes verdes” não pôde ser independentemente confirmada aqui.
2. **Não há `data/fundiario_brasil.db`, tiles DEM nem selo D16 real** neste clone. Tudo que depende de base fundiária e de sorteio selado foi auditado por código e por artefatos, não por execução.
3. **Não houve acesso às credenciais GEE/Planet/Embrapa**; as rotas foram lidas, não exercitadas.
4. **Os PDFs do acervo não foram integralmente lidos.** A auditoria verifica existência e rastro de conferência; não substitui a leitura pericial de cada obra.
5. **A auditoria não decide metodologia.** Onde há divergência, a recomendação é de engenharia ou de documentação; a escolha do valor ou do desenho é do pesquisador (CLAUDE.md §2).

---

## 3. Funcionalidades do app: o que existe, o que é prometido

### 3.1 Mapa funcional

| Função | Estado real | Evidência | Observação |
|---|---|---|---|
| Mapa WebGL, AOI, desenho de talhão, filtros e inspetor | **Funciona** | `src/components/map/MapViewer.tsx`, `src/components/sidebar/*`, `src/store/useSarelStore.ts` | Depende de token Mapbox do usuário; sem persistência. |
| Amostragem GEE (candidatos, terreno, solo, S2, thinning) | **Funciona, com desvios** | `src/app/api/gee/select-candidates/route.ts` | Ver F-01 e F-03. |
| Estratificação 3×3×2 | **Implementada** | `src/lib/gee/estratificacao.ts` | Estratos vazios são omitidos e a cota redistribuída; ver F-14. |
| Sorteio D16 de 72 polígonos | **Implementado, não executável com o pool atual** | `src/lib/gee/sorteioPoligonos.ts:385`; `src/app/api/gee/sorteio-d16/route.ts` | Exige ≥4 candidatos nos 18 estratos; `E_1_1_2` tem 0 (auditoria de 31/10). |
| Linha de base RUSLE | **Módulo existe; não ligado** | `src/lib/rusle/linhaDeBase.ts`; `route.ts:1276-1299` | `RUSLE_A` sempre vazio no app; ver F-02. |
| Chuva / G2 / pares de evento | **Não ligado** | `route.ts:1265-1271`: “módulo de chuva não está ligado a esta rota” | D19 é análise secundária e não operacional. |
| Ingestão de rótulos Kobo / Coletor | **Funciona na Central de Campanha** | `src/components/campanha/PainelCampanha.tsx:14-23` | Kappa e binarização implementados. |
| Ingestão de fotointerpretação PlanetScope | **Módulo sem chamador de produção** | `src/lib/rotulos/ingestaoInterpretacao.ts`; nenhuma importação em `src/components` | A Ficha promete “duplo-cego PlanetScope”; a UI não oferece essa entrada. |
| Ingestão de VANT / drone | **Módulo sem chamador de produção na UI** | `src/lib/rotulos/ingestaoDrone.ts` | Usado na montagem/exportação, não como ingestão operacional. |
| Matriz de treino e invariantes | **Funciona** | `src/lib/matriz/montagem.ts`, `invariantes.ts`; `planilha.ts:370` | Ver F-12 (bloco) e F-07 (valores fabricados). |
| Exportação XLSX/CSV/GeoJSON/ZIP | **Funciona** | `src/components/export/ExportModal.tsx:54-175` | Shapefile **não** existe (F-10). |
| VIF e “Spatial Block CV” anunciados | **VIF inexistente**; bloco parcial | `src/config/tourMetodologico.ts:406-419`; `Header.tsx:281` | Não há cálculo de VIF em `src`; ver F-10. |
| Central de Decisões e tour metodológico | **Funciona** | `src/components/decisoes/*`, `src/config/tourMetodologico.ts` | Textos defasados (D01–D19, P03 15/25 m). |
| JEV (auditoria “cognitiva”) | **Funciona, com risco** | `src/lib/jev/jevClient.ts`; `src/app/api/jev/auditar/route.ts` | Envia coordenadas a API externa; ver F-08. |
| Persistência de pontos/rótulos | **Ausente** | `src/store/useSarelStore.ts` (estado em memória); nenhum `localStorage` ou store no servidor para pontos | O selo D16 é o único artefato de amostragem gravado em disco; cotas e logs têm livro-razão próprio. Ver F-11. |

### 3.2 Lacunas funcionais relevantes

**L-1 — O app não fecha a cadeia “rótulo → matriz → modelo”.** Ele fecha “candidato → ponto → matriz → exportação”. A parte de rótulo PlanetScope/VANT existe em módulos isolados, mas não é acessível pela interface; a parte de RUSLE não é alimentada; a parte de chuva não está ligada. A Ficha Técnica descreve a cadeia completa como se estivesse operacional (`docs/metodologia/FICHA_TECNICA_SAREL.md:44-58`), o que superestima o estado atual.

**L-2 — A exportação promete formatos que não produz.** O cabeçalho anuncia “XLSX, CSV, GeoJSON e Shapefile” (`src/components/layout/Header.tsx:448`) e o tour fala em “Shapefile compactado em ZIP” (`src/config/tourMetodologico.ts:644-650`). O `ExportModal` implementa XLSX, CSV, GeoJSON e o ZIP do pacote de reprodutibilidade; não há escritor `.shp` em `src`. Numa demonstração, isso é uma promessa não cumprida.

**L-3 — O “VIF” é apenas texto de tour.** O painel da matriz é anunciado como “cálculo do VIF” (`Header.tsx:281`) e o tour descreve “eliminação recursiva” por VIF > 5 (`tourMetodologico.ts:416-419`), mas não existe função de VIF no código. Pode ser que a intenção seja calcular no script Python; então a UI não deveria atribuir o cálculo ao app.

**L-4 — A campanha vive na memória.** `useSarelStore` não persiste pontos nem rótulos; não há `localStorage`, IndexedDB ou tabela de sessão. O único artefato de amostragem gravado é o selo D16 (`src/app/api/gee/sorteio-d16/route.ts:197`); cotas, logs e configuração de equipe têm gravação própria, mas os pontos e rótulos da campanha não. Um `F5` perde a campanha; um fechamento de aba sem exportação perde o trabalho. Para um instrumento de campo, isso é risco operacional, não apenas conveniência.

**L-5 — O erro de runtime é escondido.** `src/app/page.tsx:44-56` remove o `nextjs-portal` e qualquer `data-nextjs-toast`, e `:74-90` chama `preventDefault()` em `error` e `unhandledrejection`, desviando a mensagem para o log interno. Em desenvolvimento, isso retira do pesquisador o aviso padrão do Next.js; em auditoria, reduz a visibilidade de falhas. O log interno é útil, mas não substitui o erro visível.

---

## 4. Coerência entre decisão e código

### 4.1 Panorama

O registro tem 26 decisões, todas em `decidida`, e 16 parâmetros, dos quais 4 decididos, 11 propostos e 1 pendente (P06). O problema não é a ausência de decisão: é a **defasagem entre a emenda e a implementação**. O padrão se repete em pelo menos seis entradas.

| Bloco | Situação | Comentário |
|---|---|---|
| D01, D03, D04, D05, D08, D09, D10, D14, D17, D18, D21, D26 | **Conforme ou quase** | D01 sem registro de conferência arquivado; D04 com guarda de 24 meses em `montagemTemporal.ts:173`. |
| D02 | **Conforme, lastro frágil** | Limiares em `decisoes.ts` e usados em `amostragemBiofisica.ts:38-45`; referência a Rikimaru não sustenta os cortes (§6). |
| D06 | **Parcial** | Célula de 10 m respeitada; a cifra “78%” segue em verificação declarada. |
| D07 | **Conforme no código, texto do registro defasado** | `elegibilidade.ts:31` já usa [30,40] e o cliente já consulta v2020/v2021 (`copernicusGeeClient.ts:30-31`), mas D07 ainda declara que o código usa [30,40,60] (`decisoes.ts:167`). |
| D11 | **Divergente** | Piso 6 no cliente, 12 na decisão; ver F-01. |
| D12 | **Parcial** | Tercis e 18 estratos existem; método de tercil e empates não declarados; estratos vazios são omitidos. |
| D13 | **Parcial** | Módulo implementado, mas R não é ligado; `pendenteVerificacao` é um campo morto; ver F-18. |
| D15 | **Parcial** | Módulo implementado, mas LS não é ligado; falta o fluxo de `A_in`. |
| D16 | **Implementado, não executável** | 72 polígonos de 5,02 ha e `pi_i=4/N_h` no sorteio; pool atual tem célula vazia. |
| D19 | **Não operacional** | IMERG/G2 não ligados; D19 é análise secundária e declara condição de inexistência. |
| D20 | **Implementado, atribuição errada** | Fórmula híbrida usada, mas proveniência cita D01; ver F-06. |
| D22 | **Não implementado** | P permanece 1,0; ver F-05. |
| D23 | **Parcial e texto conflitante** | Sorteio de polígonos registra `pi_i`; rota de pontos não; D23 fala em 36/2 por estrato, D16 em 72/4. |
| D24 | **Parcial** | Tetos por bloco existem no config D25; o app não os aplica na montagem. |
| D25 | **Implementado, não operacional** | Falta config assinado e `RUSLE_A`; ver F-02. |
| P01 | **Proposta usada em produção** | Fallback de 20 km no variograma (`route.ts:614-618`); P01 segue “proposta”. |
| P02 | **Conforme** | Piso de 1.000 m em `route.ts:317-330`. |
| P03 | **Divergente** | 15/25 m no código; 30 m + estrato + GNSS na decisão; ver F-04. |
| P04 | **Proposta usada em produção** | Buffers 30/150/10% em `elegibilidade.ts:30-37`; P04 não decidido. |
| P05 | **Conforme no código, texto defasado** | `elegibilidade.ts:31` já é [30,40], mas `decisoes.ts:606` ainda declara divergência. |
| P06 | **Pendente** | UDM2 não implementado; a Ficha não menciona a pendência. |
| P07 | **Divergente** | Semente fixa 42; a decisão diz “dinâmica-registrada”; ver F-07. |
| P08–P11, P20–P24 | **Propostas** | Alguns valores são usados como default (P10 = 1,5 no D25; P24 = 20 anos no R), sem decisão. |

### 4.2 F-01 — D11.2 não governa a estratificação (S1)

**O que a decisão exige.** D11.2, emendada em 31/10/2026, exige **n ≥ 12** observações válidas para a frequência de solo nu (Ê) nas janelas decenal e bienal, com SE ≤ 0,144; o fallback de 6 a 11 é excepcional, só em janela curta (<120 dias), e **expressamente vedado** de participar dos tercis e da estratificação de D12 (`src/config/decisoes.ts:223-227`).

**O que o código faz.**
- `src/lib/gee/copernicusGeeClient.ts:29` define `LIMIAR_MINIMO_OBSERVACOES_D11 = 6`.
- `avaliarSuficienciaAmostralD11` só verifica `n < 6` (`:59-68`); não calcula SE, não distingue estimando e não marca regime de fallback.
- A rota monta `CandidatoEstratificacao` **sem** `provenienciaE` (`route.ts:581-588`).
- A guarda de D12 só executa se `c.provenienciaE` existir (`estratificacao.ts:164-174`). Sem o campo, **não executa**.
- Mesmo se executasse, `podeEntrarEstratificacaoD12` só rejeita `modelado` com `qualidade` baixa; um Ê marcado como `medido` passa sem verificação de n (`montagemTemporal.ts:76-88`).

**Impacto.** Os tercis de Ê e, portanto, os 18 estratos, são calculados com medições que a decisão proíbe. Isso contamina a partição, as probabilidades de inclusão, a estimativa de prevalência e a comparação de D25. É o achado mais grave porque atinge o **desenho amostral**, não a apresentação.

**Recomendação (engenharia, não metodologia).** Fazer a rota transportar `provenienciaE` com `qualidade.nObservacoes`, `regime` e `elegivelD12`; alinhar o cliente a 12/SE; tornar `podeEntrarEstratificacaoD12` fail-closed para `medido` sem qualidade; adicionar teste de regressão “Ê com 6 observações não entra em D12”.

### 4.3 F-02 — D25 não é executável a partir do app (S1)

**Evidência.** A rota chama `montarLinhaDeBaseRUSLE` sem `insumoFatorR` nem `insumoFatorLS` (`src/app/api/gee/select-candidates/route.ts:1276-1299`). A função, então, devolve `indisponivel` para R (`linhaDeBase.ts:86-93`) e LS (`:115-122`), e `perdaSolo` fica `indisponivel` (`:150-168`). O perfil `linha-de-base-rusle` exporta `RUSLE_A` vazio (`src/lib/export/planilha.ts:246-261`). O config de pré-registro do D25 registra a consequência: “sem RUSLE_A o desfecho de D25 é NAO_AVALIAVEL” (`scripts/d25/config_pre_registro_PROPOSTA.json:61`).

**Impacto.** A pergunta central da dissertação — o ensemble supera a linha de base física? — não pode ser respondida com o artefato que o app produz hoje. O avaliador D25 está pronto; o insumo não. A Ficha e o README, porém, apresentam a “linha de base RUSLE” como funcionalidade corrente (`README.md:32-37`, `FICHA_TECNICA_SAREL.md:48-52`), o que cria expectativa que o app não cumpre.

**Recomendação.** Ou ligar R (climatologia CHIRPS por célula) e LS (área de contribuição a montante no DEM) com proveniência, ou declarar na UI e nos documentos que a linha de base é **módulo implementado e não integrado**, e impedir que o perfil `linha-de-base-rusle` seja apresentado como completo. Não preencher R ou LS com valor fixo para “fazer rodar”.

### 4.4 F-03 — A eleição de amostras não é a de D23/D16 (S1)

**Evidência.**
- Semente fixa: `const semente = 42` (`route.ts:296`), contra P07 “dinamica-registrada”.
- Cota uniforme sobre **estratos ocupados**, não sobre os 18: `cotaBase = floor(meta/nEstratosAtivos)` e laço só nos ocupados (`estratificacao.ts:263-293`). Estrato vazio desaparece; a cota que sobra é redistribuída.
- Complemento (“top-up”) até `tamanhoAmostra` percorrendo `estratificacaoInput` na ordem de entrada, sem sorteio e sem `pi_i` (`route.ts:673-708`).
- A rota de pontos não registra `pi_i`; só o sorteio de polígonos registra (`sorteioPoligonos.ts:473`).
- D23 define a unidade primária como o polígono e exige `pi_i` por unidade sorteada; a âncora de campo é de 60 a 80 pontos com `pi_i` conhecido (`decisoes.ts:425-427`). A rota usa 50 por default e não registra `pi_i`.

**Impacto.** O botão “Amostragem GEE” produz uma amostra que **não é probabilística com probabilidade conhecida**. Qualquer estimativa de prevalência por Horvitz-Thompson a partir dela é inválida; o top-up introduz seleção determinística; a semente fixa impede que o sorteio seja o “dinâmico registrado” da decisão. Mesmo que o sorteio D16 de polígonos seja o caminho oficial, a âncora de campo continua sem `pi_i`.

**Recomendação.** Separar explicitamente “exploração de pool” de “seleção probabilística”; a segunda deve usar o sorteio D16/D23 com `pi_i`, semente registrada e relatório de cotas; remover o top-up ou atribuir-lhe peso; registrar a semente por execução; adicionar teste que impeça ponto sem `pi_i` de entrar na amostra oficial.

### 4.5 F-04 — P03 está desatualizado no código (S2)

**Evidência.** P03 decidida exige três critérios: teto de 30 m, permanência no mesmo estrato e acurácia GNSS de 5/10 m (`decisoes.ts:585`). O código mantém 15 m nominal e 25 m máximo, sem verificação de estrato nem de GNSS (`src/lib/rotulos/ingestaoKobo.ts:82-83`, `:93-101`). A Ficha repete 15/25 (`FICHA_TECNICA_SAREL.md:109`).

**Impacto.** Pontos de campo serão aceitos ou rejeitados contra um critério que não é o decidido; o vínculo rótulo→célula de 10 m fica mais frouxo que o autorizado, e a checagem de estrato — que é a parte cientificamente mais forte de P03 — simplesmente não existe.

**Recomendação.** Atualizar a ingestão e os testes para os três critérios, ou emendar P03 de volta ao valor antigo com justificativa. Não manter dois critérios em paralelo.

### 4.6 F-05 — D22 não existe no código; P permanece 1,0 (S2)

**Evidência.** D22 decide derivar P de `sentido_plantio`, `presenca_terraco`, `estado_conservacao_terraco` e declividade (`decisoes.ts:407-418`). `obterFatorPPadrao` devolve sempre `{ valor: 1.0, tabela: "Renard..." }` (`linhaDeBase.ts:44-51`); não há leitura das variáveis de campo em `src/lib`. O README e a Ficha ainda descrevem P = 1,0 como estado corrente (`README.md:34`, `FICHA_TECNICA_SAREL.md` seção de RUSLE).

**Impacto.** Quando a linha de base for ligada, todos os pontos — inclusive os com terraceamento observado — receberão P = 1,0. Isso **superestima a perda do RUSLE** nos pontos conservacionistas e pode favorecer artificialmente o XGBoost na comparação de D25. É um viés direcional, não apenas uma omissão.

**Recomendação.** Implementar a tabela de D22 com o selo de provisoriedade exigido pela própria decisão ou declarar formalmente que P=1,0 é o estado probatório atual e que D22 não está operacional. A segunda opção exige retirar do README a apresentação de P=1,0 como decisão vigente.

### 4.7 F-06 — O Fator C híbrido é atribuído a D01 (S2)

**Evidência.** `calcularFatorC(ndvi, bsi)` aplica `((1-NDVI)/2) * (1+BSI)` (`src/lib/rusle/fatorC.ts:69`), mas o cabeçalho e o encapsulador dizem “Decisão D01” (`:13`, `:105`, `:128-133`). D01 decidiu a forma pura; a forma híbrida é D20 (`decisoes.ts:382-392`). A UI chama o indicador de “RUSLE (Durigon C)” mesmo quando o BSI modulou o valor (`src/components/sidebar/StatsOverview.tsx:138`).

**Impacto.** O selo de proveniência fica falso: um leitor do CSV ou do Inspetor não consegue saber se o C é D01 ou D20. Numa auditoria de replicação, isso é exatamente o tipo de “atribuição plausível e errada” que o projeto promete evitar.

**Recomendação.** Ramificar o `modelo` e a lista `decisoes`: D20 quando BSI válido, D01 quando ausente; corrigir rótulos e comentários; teste que verifique a decisão citada em cada caminho.

### 4.8 F-07 — Valores fabricados em pontos de baixo nível (S2)

A Regra 1 proíbe valor inventado; a Regra 2 proíbe corte silencioso. Há três pontos em que a proibição é violada por código de baixo nível, e o varredor não os alcança.

| Local | O que faz | Problema |
|---|---|---|
| `src/lib/gee/serieTemporal.ts:51` | `if (Math.abs(soma) < 1e-6) return 0;` para NDVI | 0 é um NDVI válido; a ausência de denominador vira observação plausível. |
| `src/lib/gee/serieTemporal.ts:53-54` | `if (val > 1) return 1; if (val < -1) return -1;` | Corte silencioso de reflectância anômala; deveria ser `null`/fora-do-dominio. |
| `src/lib/gee/serieTemporal.ts:78-82` | Mesmo padrão para BSI | Idem. |
| `src/lib/gee/amostragemSoloNuLote.ts:497` | `Math.max(0, Math.min(1, rawSoloNu))` com comentário “permitido” | Uma fração fora de [0,1] é sinal de erro; o clamp esconde. |
| `src/lib/matriz/montagem.ts:282` | `blocoEspacial: ... ?? "BLOCO_INDEFINIDO"` | Cria um identificador de bloco falso; o Invariante 6 não o rejeita. |
| `src/lib/jev/jevClient.ts:144-145` | Confiança default 0,95 quando a API não devolve | Número não calibrado apresentado como confiança. |
| `src/lib/jev/fallbackLocal.ts:48-60` | Confianças 0,95/0,92/0,82/0,5 | Idem; heurística com aparência de probabilidade. |

**Impacto.** NDVI = 0 por denominador nulo entra na triagem como “indefinido” ou, pior, como valor baixo; BSI = 0 pode deslocar a classificação; “BLOCO_INDEFINIDO” pode unir pontos sem relação espacial na validação; confiança 0,95 sem base é exatamente o “número mágico” que a Regra 1 combate.

**Recomendação.** Retornar `null` ou `Proveniencia` com `causa: "fora-do-dominio"`; remover o clamp; rejeitar `BLOCO_INDEFINIDO` no invariante; eliminar confianças não calibradas do laudo JEV; ampliar o varredor para `return 0` em funções de índice, com exceções nominais.

### 4.9 F-18 — D13: o fator 9,81 e a marca que não propaga (S3)

**Evidência.** `FATOR_UNIDADE_RUFINO = 9.81` é aplicado para converter a equação de Rufino em R (`src/lib/rusle/fatorR.ts:94`, `:108`). O próprio comentário diz que a origem física é “hipótese, não consta de fonte lida” (`:17-20`). O selo devolve `pendenteVerificacao: true` (`:279`), mas o campo **não existe** em `Proveniencia` (`src/types/proveniencia.ts:19-23`), é forçado por `as unknown as Proveniencia<number>` e não é lido em nenhum outro lugar do código (busca: apenas essa ocorrência). Ou seja: a marca exigida por D13 não chega à UI, ao CSV nem ao pacote.

**Impacto.** O R depende de um fator de unidade sem fonte primária arquivada, e a incerteza que deveria acompanhar o selo desaparece. Como R entra na linha de base e no bloco de chuva de D24, o problema não é cosmético.

**Recomendação.** Adicionar `pendenteVerificacao?: boolean` (ou `qualidade.status`) ao tipo, renderizá-lo no Inspetor e no CSV, ou remover o campo morto e declarar a limitação no `modelo`. Arquivar a fonte do 9,81 ou registrar dívida R-L4 com data.

---

## 5. Critérios científicos

### 5.1 Desenho amostral e inferência

**O que está correto.** A estratificação 3×3×2, o thinning geodésico determinístico e o sorteio de polígonos com `pi_i` são implementações sérias. O sorteio de 72 polígonos registra `pi_i = 4/N_h`, `w_i = N_h/4`, hash de integridade e recusa de sobrescrita (`sorteioPoligonos.ts:473-581`). A validação D25 agrupa o bootstrap por polígono, não por célula (`avaliacao_d25_referencia.py:207-238`), o que é a decisão correta contra pseudorreplicação.

**O que compromete.**
1. **Estratos vazios são omitidos, não reportados como vazios.** `executarAmostragemEstratificada` calcula a cota só sobre `estratosOcupadosIds` (`estratificacao.ts:263-274`) e o relatório lista `estratosVazios`, mas a cota dos vazios é redistribuída. O desenho de 18 estratos deixa de ser fatorial na prática.
2. **Tercis e empates não têm regra declarada.** `calcularLimiaresTercis` escolhe ordem estatística em `ceil(n/3)-1` (`estratificacao.ts:106-111`); `classificarTercil` usa `<=` (`:132-134`). Com Ê contendo muitos zeros — o caso provável de solo nu — todos os zeros caem no tercil 1 e o tercil 2 pode ficar vazio. Não há teste com empates nem declaração do método de quantil.
3. **A cota do top-up não é aleatória.** F-03.
4. **O peso do subconjunto de treino.** O sorteio registra `pi_i = 4/N_h` para os quatro polígonos. Se a análise for restrita aos dois de treino, a probabilidade de inclusão no treino é `2/N_h`, não `4/N_h`; usar `w_i = N_h/4` nessa subamostra dobra o peso. A distinção precisa estar escrita, ou o peso precisa ser específico por papel.

### 5.2 Suficiência temporal

- **D11.2:** F-01.
- **Percentis de cauda:** D11.3 exige 9 observações para p10/p90, mas `calcularEstatisticasBanda` usa `nMinimo = 3` por default (`src/lib/gee/estatisticasSerie.ts:58`) e é chamada sem override (`:162`). O teste consagra o piso 3 (`estatisticasSerie.test.ts:43-54`). Isso permite p10/p90 com três cenas.
- **Harmônicos:** D11.4 usa 12 observações para o modelo de 1 harmônico (p = 4, N/p = 3). Se `usarDoisHarmonicos` for verdadeiro, p = 6 e 12 observações dão N/p = 2, abaixo da regra de inicialização que a própria decisão cita. O código não diferencia o piso por p (`src/lib/gee/harmonicos.ts:30`, `:55`, `:72`).
- **Método de quantil:** a interpolação de `estatisticasSerie.ts:39-48` é a type 7 de Hyndman & Fan, coerente com a verificação de 20/10; o problema é o piso, não a fórmula. O `return 0` para `n = 0` (`:32`) é resíduo de fabricação.

### 5.3 RUSLE

| Fator | Situação | Risco |
|---|---|---|
| R | Implementado com Rufino (a=18,64; b=5,73) e fator 9,81 | 9,81 sem fonte primária; R não ligado ao app; `pendenteVerificacao` morto |
| K | Implementado com `k_solos` e fallback de classe | Conforme; proteção contra `k_solos = 0` existe |
| LS | Implementado (Desmet & Govers; OCR de Renard) | Não ligado; falta `A_in`; D15 parcial |
| C | Híbrido D20 | Fórmula do projeto, não de Durigon; atribuição errada; sem validação empírica no repo |
| P | 1,0 fixo | D22 não implementado; viés potencial contra o RUSLE |

**Comentário científico.** O fator C híbrido `((1-NDVI)/2)(1+BSI)` é uma construção do projeto, não uma equação publicada. D20 a justifica fisicamente, mas não há calibração contra C medido, e o coeficiente 1 é arbitrário (por que não 0,5 ou 2?). Como o C entra no competidor RUSLE, e não no rótulo, o risco é de **enviesar o competidor**, não de contaminar o alvo. A decisão é legítima como escolha pré-registrada, mas a dissertação deve declarar que a forma multiplicativa é uma hipótese do projeto, não uma formulação de Durigon.

### 5.4 Modelagem e avaliação

**O que está bem.** O D25 tem pré-registro por hash, uma única avaliação do held-out, trava de tentativa consumida, `GroupKFold` interno, bootstrap por polígono, três competidores e sensibilidade sem monotonicidade. A lista de preditores proibidos inclui `RUSLE_A`, `RUSLE_Fator_C`, `RUSLE_Fator_P`, alvo, chaves e prefixo `Rotulo_` (`avaliacao_d25_referencia.py:50-59`). Isso é mais rigoroso que a média da literatura aplicada.

**O que falta.**
1. **Config de pré-registro não assinado.** O arquivo é `config_pre_registro_PROPOSTA.json`; não há `sha256_config_congelada` nem `declarado_por`/`declarado_em` no repositório. Sem isso, `--probatorio` recusa rodar (`:367-375`). É coerente com o estado pré-dados, mas significa que D25 ainda não está pré-registrado de fato.
2. **P10 proposto como default.** `TWEEDIE_POWER = 1.5` é usado quando a config não declara a grade, e o comentário reconhece “P10, proposta” (`:45`). Um parâmetro não decidido não deveria ter default silencioso num pipeline probatório; o correto é falhar e exigir a grade.
3. **RUSLE indisponível.** F-02.
4. **Sem resultados empíricos.** Não há como avaliar acurácia, overfitting ou estabilidade; qualquer número do benchmark é infraestrutura, não ciência.
5. **A seleção de hiperparâmetros é feita no treino, mas o espaço é grande** (24 combinações × 3 p para XGB; 5 alphas × 3 p para o penalizado) com poucos polígonos. É pré-registrado, mas a potência é baixa; o desfecho `INCONCLUSIVA` é provável e precisa ser aceito como resultado, não como falha.

### 5.5 Integridade numérica

Além de F-07, há um ponto de desenho: `calcularFatorC` rejeita C fora de [0,1] com exceção, o que é correto; mas `calcularFatorCVanDerKnijff` retorna 0 ou 1 nos extremos (`fatorC.ts:94-99`), o que é um corte silencioso na análise de sensibilidade. Como é sensibilidade declarada, o impacto é menor, mas o padrão é o mesmo.

### 5.6 Validação espacial

O bloco espacial é derivado de um semivariograma empírico de **uma** variável (declividade) (`route.ts:609-613`), com fallback de 20 km quando n < 15 ou quando não há patamar (`blocosEspaciais.ts:74-83`), e a aresta é arredondada para km inteiro (`:128`). P01, que governa a aresta, está “proposta”, não decidida. O resultado é que a validação por blocos pode não isolar a autocorrelação dos preditores espectrais, que é justamente o bloco mais forte. A defesa correta de D25 é o agrupamento por polígono, que é independente do bloco; mas o app anuncia “Spatial Block CV” como se o bloco estivesse calibrado.

---

## 6. Bibliografia e lastro

### 6.1 O que está arquivado e conferido

Há um esforço real, acima do comum: Desmet & Govers 1996, Renard et al. 1997 (com OCR), Rufino et al. 1993, Hyndman & Fan 1996, Zhu 2013, Doc. 246/2024, Cochran 1977 (síntese, não primário). O padrão de arquivar PDF + script de extração + saída bruta é o que a R-L3 pede.

### 6.2 O que não está

- **Durigon et al. (2014):** o PDF existe (`docs/bibliografia/durigon_etal_2014.pdf`), mas não há nota de verificação com “o que a fonte não sustenta”. D01 cita a fórmula, mas o rastro R-L3 não foi produzido.
- **Olofsson et al. (2014), King & Zeng (2001), Rikimaru et al. (2002), Cameron et al. (2008), Congalton & Green (2019), Mannigel et al. (2002), Agresti & Coull (1998), Brown et al. (2001), Drusch et al. (2012), Funk et al. (2015), Huffman et al. (2020), Zanaga et al. (2022), McCool et al. (1989), Quinn et al. (1991), Zevenbergen & Thorne (1987), Beven & Kirkby (1979):** sem PDF no acervo ou sem verificação arquivada, conforme busca por nome em `docs/bibliografia` e `docs/verificacoes/fontes`.
- **Cochran (1977):** só existe a síntese `cochran_1977_sampling_techniques_ch5a12.md`, marcada “NÃO CONFERIDA NO PRIMÁRIO”. D12/D23 a invocam como fundamento de amostragem estratificada.
- **Wischmeier & Smith (1978):** o arquivo `AH_537 Predicting Rainfall Soil Losses.pdf` existe, mas a linha do inventário aponta para `docs/Selecao Bibliografica/...`, caminho que não existe mais.

### 6.3 Citações frágeis ou mal atribuídas

1. **Rikimaru et al. (2002) para os limiares de BSI/NDVI.** A obra é de mapeamento de densidade de dossel florestal (FCD) e não é um estudo de limiares de erosão laminar. Ela pode sustentar o **índice** BSI, não os cortes 0,10 / 0,40 / 0,65 como critérios de erosão. O inventário ainda registra o veículo como “*New Phytologist* / FCD Mapper” (`INVENTARIO...:375`), o que não corresponde ao artigo (a referência usual é *Tropical Ecology* 43(1):39–47); confira-se no primário antes de manter. Não há PDF no acervo. **Esta é a citação mais vulnerável da fundamentação de D02.**
2. **D13 e o fator 9,81.** O coeficiente é reproduzido empiricamente, mas a origem física não está na fonte lida; o registro admite, mas o selo não propaga (F-18).
3. **D22 e a tabela de P.** A própria decisão declara que os coeficientes vieram de saída de IA, atribuídos a Bertoni & Lombardi Neto / Wischmeier & Smith, e **não conferidos no primário** (`decisoes.ts:414`). É dívida declarada, corretamente; mas uma decisão “decidida” que depende de tabela não conferida não pode ser presentada como lastreada.
4. **D15 e o Renard.** A verificação de 02/10 dizia que o PDF era escaneado sem texto e que as equações não foram lidas; o OCR posterior (`docs/verificacoes/fontes/renard1997/saida_ocr_renard_1997.txt:12`) confirmou as constantes. O rastro existe, mas a nota de 02/10 ficou contraditória com o OCR; quem ler só a primeira conclui o oposto. Consolide a evidência.

### 6.4 O inventário não é confiável como “cobertura”

O cabeçalho da matriz afirma que ela traz “metadados completos... e arquivo local arquivado” (`INVENTARIO...:370`). A checagem física de 31/10/2026 encontrou:

| Métrica | Resultado |
|---|---:|
| Linhas de decisão na matriz | 41 |
| Linhas com caminho de arquivo | 16 |
| Caminhos que existem | 7 |
| Caminhos quebrados | 9 |
| Linhas sem qualquer arquivo local (apenas DOI/revista) | 25 |

Os caminhos quebrados incluem `docs/Selecao Bibliografica/Durigon_etal_2014.pdf`, `.../Kaufman_2012...pdf`, `.../Safanelli...pdf`, `docs/verificacoes/fontes/renard1997/renard_1997_handbook_703.pdf` (o arquivo real é `ah_703.pdf`) e `.../nosek...pdf`; vários desses arquivos existem sob outro nome ou em `docs/bibliografia/`, mas a matriz não aponta para eles. O inventário foi escrito antes da reorganização de 31/10 e não foi atualizado.

### 6.5 As duas travas de lastro são vácuas

- `src/config/lastroCientifico.test.ts:33-41` reconhece como “lastro externo” qualquer texto que contenha `(2014)`, `et al.`, DOI ou `v. 24, n. 5`. Não verifica se a obra existe, se está no acervo ou se sustenta a afirmação.
- `src/config/inventarioBibliografico.test.ts:54-56` verifica apenas se o **ID da decisão** aparece em algum lugar do inventário. Como todos os IDs aparecem, qualquer citação passa. O teste não olha autor, título nem caminho.
- O resultado é uma **falsa sensação de cobertura**: a suíte fica verde com citações que ninguém conferiu. A norma R-L5 exige obra, autor, ano, título e DOI; a trava não verifica nenhum deles de forma cruzada.

### 6.6 Consequência para a banca

A banca não precisa encontrar um erro de fórmula para desqualificar o lastro; basta pedir o PDF de Olofsson ou de Rikimaru e perguntar “onde exatamente esta passagem sustenta 0,10?”. O projeto está mais protegido se declarar a dívida (R-L4) do que se apresentar a matriz como completa.

---

## 7. Reprodutibilidade e execução

| Verificação | Resultado em 31/10/2026 | Interpretação |
|---|---|---|
| `npm run typecheck` | **Passa** (exit 0) | Tipagem consistente no commit. |
| `npm run lint -- --max-warnings 0` | **Falha** (exit 1) | 2 warnings `react-hooks/exhaustive-deps`: `MapViewer.tsx:526` e `PointPopup.tsx:69`. O próprio workflow declara que esse passo reprovará até o C28. |
| `npm test` | **Não inicia** neste ambiente | `spawn EPERM` no carregamento do config do Vitest (caminho com acentos + restrição de `child_process` do sandbox). Não é falha de asserção; é limitação do ambiente. |
| `npm run build` | Não executado | Sem valor probatório sem a suíte. |
| CI `.github/workflows/guardas_cientificas.yml` | **Vermelho no lint** | O job roda `lint --max-warnings 0` (linha 39) e falharia no commit atual. |

**Consequência.** A expressão “os três verdes” não é reproduzível no commit auditado: um verde (typecheck), um vermelho (lint) e um não verificável neste ambiente (testes). O CI existe e é uma boa prática, mas está desligado na prática enquanto o lint não passar; um pipeline que nasce vermelho é um pipeline que a equipe aprende a ignorar.

---

## 8. Achados consolidados

| ID   | Severidade | Achado                                                                                                             | Evidência principal                                                                                       | Recomendação                                                                       |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| F-01 | **S1**     | D11.2 (n≥12) não governa a estratificação; guarda de D12 contornada                                                | `copernicusGeeClient.ts:29`; `route.ts:581-588`; `estratificacao.ts:164-174`; `montagemTemporal.ts:76-88` | Propagar proveniência com qualidade; alinhar piso; fail-closed; teste de regressão |
| F-02 | **S1**     | D25 não executável: R/LS ausentes, `RUSLE_A` vazio                                                                 | `route.ts:1276-1299`; `linhaDeBase.ts:86-122`; `config_pre_registro_PROPOSTA.json:61`                     | Ligar R/LS ou declarar módulo não integrado; bloquear perfil incompleto            |
| F-03 | **S1**     | Amostragem do app não é D23: semente 42, top-up, cota redistribuída, sem `pi_i`                                    | `route.ts:296`, `:673-708`; `estratificacao.ts:263-293`; `sorteioPoligonos.ts:473`                        | Separar pool de seleção; sorteio com `pi_i`; remover top-up; registrar semente     |
| F-04 | **S2**     | P03 desatualizado (15/25 m; sem estrato/GNSS)                                                                      | `ingestaoKobo.ts:82-83`; `decisoes.ts:585`                                                                | Alinhar código/testes ou emendar P03                                               |
| F-05 | **S2**     | D22 não implementado; P = 1,0 em todos os pontos                                                                   | `linhaDeBase.ts:44-51`; `decisoes.ts:407-418`                                                             | Implementar D22 ou declarar não operacional; retirar do README                     |
| F-06 | **S2**     | C híbrido atribuído a D01; UI diz “Durigon C”                                                                      | `fatorC.ts:69`, `:105-133`; `StatsOverview.tsx:138`                                                       | Citar D20 quando BSI; corrigir rótulos                                             |
| F-07 | **S2**     | Valores fabricados: NDVI/BSI = 0, clamps, `BLOCO_INDEFINIDO`, confiança JEV                                        | `serieTemporal.ts:51-82`; `amostragemSoloNuLote.ts:497`; `montagem.ts:282`; `jevClient.ts:144`            | Retornar indisponível; remover clamps; rejeitar bloco sentinela; ampliar varredor  |
| F-08 | **S2**     | JEV envia coordenadas e contexto a API externa; laudo com confiança não calibrada                                  | `jevClient.ts:63-71`, `:20`; `fallbackLocal.ts:47-60`                                                     | Remover coordenadas; opt-in; marcar heurística; nunca exportar como rótulo         |
| F-09 | **S2**     | Kappa 0,61 + IC inferior ≥0,61 no código; 0,60 nos documentos                                                      | `concordancia.ts:22`, `:153-156`; `FICHA...:109`                                                          | Decidir e documentar; análise de potência; teste com n conhecido                   |
| F-10 | **S2**     | Shapefile e VIF anunciados, não implementados                                                                      | `Header.tsx:448`; `tourMetodologico.ts:406-419`, `:644`                                                   | Implementar ou remover a promessa; teste de veracidade da UI                       |
| F-11 | **S3**     | Campanha e rótulos não persistem; só o selo D16 grava                                                              | `useSarelStore.ts`; `sorteio-d16/route.ts:197`                                                            | Persistir com proveniência ou autosave/exportação obrigatória                      |
| F-12 | **S3**     | Invariante 6 do código é literais geográficos, não bloco; Ficha descreve outro conjunto                            | `invariantes.ts:533-573`; `montagem.ts:282`; `FICHA...:177-183`                                           | Definir o invariante correto; rejeitar bloco vazio; corrigir Ficha                 |
| F-13 | **S3**     | Registro defasado: D07/P05 declaram divergência que não existe; D23 36 vs D16 72                                   | `decisoes.ts:167`, `:606`, `:425` vs `:442`                                                               | Campo de estado de implementação + data; atualizar textos                          |
| F-14 | **S3**     | Tercis sem método/empate declarados; estratos vazios omitidos                                                      | `estratificacao.ts:106-134`, `:263-293`                                                                   | Declarar quantil e empate; reportar vazio; teste com zeros                         |
| F-15 | **S3**     | p10/p90 com n=3; 2 harmônicos com n=12 (N/p=2)                                                                     | `estatisticasSerie.ts:58`, `:162`; `harmonicos.ts:30-72`                                                  | Pisos por estimando; 18 para 2 harmônicos                                          |
| F-16 | **S3**     | Bloco espacial de uma variável, fallback 20 km, P01 proposta                                                       | `route.ts:609-618`; `blocosEspaciais.ts:74-83`                                                            | Ajustar variograma; múltiplas variáveis; decidir P01                               |
| F-17 | **S2**     | Inventário bibliográfico: 7/41 arquivos existem; 9 caminhos quebrados; guardas vácuas                              | §6.4–6.5                                                                                                  | Reconstruir inventário; verificar arquivo/DOI; travas por obra                     |
| F-18 | **S3**     | R = 9,81 sem fonte; `pendenteVerificacao` morto por cast                                                           | `fatorR.ts:94`, `:279`; `proveniencia.ts:19-23`                                                           | Propagar a marca ou declarar a limitação; arquivar fonte                           |
| F-19 | **S2**     | CI vermelho no lint; testes não reproduzíveis aqui                                                                 | `guardas_cientificas.yml:39`; saída do lint                                                               | Corrigir warnings ou registrar exceção; garantir suíte executável                  |
| F-20 | **S4**     | Overlay de erro suprimido; sessão GEE cai no “último” token; benchmark legado com `rusle_perda_solo` como preditor | `page.tsx:44-90`; `sessaoEfemera.ts:52-61`; JSON do benchmark                                             | Manter erro visível; remover fallback; quarentenar benchmark                       |

---

## 9. Prioridades

### P0 — antes de qualquer uso probatório

1. **Fechar D11.2 no caminho de estratificação** (F-01). Sem isso, o desenho de 18 estratos não é o pré-registrado.
2. **Ligar R e LS ou declarar a linha de base não integrada** (F-02). Sem isso, D25 é `NAO_AVALIAVEL`.
3. **Substituir a eleição de pontos por seleção com `pi_i`** (F-03). Sem isso, não há inferência populacional.
4. **Corrigir a semente fixa e o top-up** (F-03/F-07). Sem isso, a reprodutibilidade é apenas aparente.
5. **Deixar o CI verde** (F-19). Um portão vermelho não protege nada.

### P1 — antes da campanha de campo

6. P03 no código (F-04).
7. D22 implementado ou explicitamente fora do estado probatório (F-05).
8. Kappa decidido e documentado (F-09).
9. Persistência da campanha (F-11).
10. Remover ou implementar Shapefile/VIF (F-10).
11. Reconstruir o inventário bibliográfico e as travas (F-17).
12. Propagar a incerteza de R (F-18).

### P2 — antes da defesa

13. Atualizar D07/P05/D23 e a Ficha (F-13/F-12).
14. Declarar método de tercil e tratamento de empates (F-14).
15. Corrigir pisos de p10/p90 e harmônicos (F-15).
16. Variograma/bloco e P01 (F-16).
17. JEV e LGPD (F-08).
18. Overlay, sessão e benchmark (F-20).

---

## 10. O que esta auditoria não conclui

1. **Não conclui que o método está errado.** As escolhas D01–D26 são, em grande parte, defensáveis e pré-registradas. O que está em causa é a correspondência entre decisão, código e documento.
2. **Não conclui que há resultados fabricados.** O benchmark sintético está rotulado; não há resultado empírico a invalidar.
3. **Não decide os valores em disputa** (12 vs 6; 30 m vs 15/25 m; 72 vs 36; 0,60 vs 0,61). Essas são decisões do pesquisador, e a auditoria apenas mostra onde o código não as acompanha.
4. **Não substitui a leitura dos PDFs.** Onde a fonte não está arquivada, a conclusão é “não há evidência no repositório”, não “a citação é falsa”. A distinção importa: a primeira se resolve arquivando; a segunda, corrigindo.
5. **Não avalia a qualidade estatística dos futuros resultados**, porque não há dados de desfecho.

---

## Anexo A — Evidências de execução

### A.1 Typecheck

```text
> sarel@2.0.0 typecheck
> tsc --noEmit
[exit code: 0]
```

### A.2 Lint

```text
> next lint --max-warnings 0
./src/components/map/MapViewer.tsx
526:6  Warning: React Hook useEffect has a missing dependency: 'credenciais.mapboxToken'.
./src/components/map/PointPopup.tsx
69:6  Warning: React Hook useEffect has missing dependencies: 'atualizarPontoIndividual' and 'point'.
[exit code: 1]
```

### A.3 Testes

```text
> vitest run
failed to load config from ...\vitest.config.mts
Error: Build failed with 1 error:
[plugin externalize-deps] Error: spawn EPERM
    at optimizeSafeRealPathSync (...vite/dist/node/chunks/node.js:2497:2)
```

O erro ocorre no carregamento do config, antes de qualquer teste; é consistente com a restrição de `child_process` do ambiente de auditoria e com o caminho contendo “EROSÃO”. Não foi possível distinguir, aqui, falha de teste de falha de infraestrutura.

### A.4 Checagem do inventário

Script local percorrendo as 41 linhas da matriz R-L5, extraindo o caminho entre crases e testando `fs.existsSync`:

```text
{ total: 41, comPath: 16, existem: 7, faltam: 9, semPath: 25 }
```

---

## Anexo B — Arquivos-chave citados

- Registro: [`src/config/decisoes.ts`](../../src/config/decisoes.ts)
- Amostragem: [`src/app/api/gee/select-candidates/route.ts`](../../src/app/api/gee/select-candidates/route.ts)
- Estratificação: [`src/lib/gee/estratificacao.ts`](../../src/lib/gee/estratificacao.ts)
- Sorteio D16: [`src/lib/gee/sorteioPoligonos.ts`](../../src/lib/gee/sorteioPoligonos.ts)
- RUSLE: [`src/lib/rusle/linhaDeBase.ts`](../../src/lib/rusle/linhaDeBase.ts)
- Invariantes: [`src/lib/matriz/invariantes.ts`](../../src/lib/matriz/invariantes.ts)
- D25: [`scripts/d25/avaliacao_d25_referencia.py`](../../scripts/d25/avaliacao_d25_referencia.py)
- Ficha: [`docs/metodologia/FICHA_TECNICA_SAREL.md`](../metodologia/FICHA_TECNICA_SAREL.md)
- Inventário: [`docs/bibliografia/INVENTARIO_SELECAO_BIBLIOGRAFICA.md`](../bibliografia/INVENTARIO_SELECAO_BIBLIOGRAFICA.md)

---

**Fim do relatório.** Nenhum arquivo de código, decisão ou parâmetro foi alterado por esta auditoria.
