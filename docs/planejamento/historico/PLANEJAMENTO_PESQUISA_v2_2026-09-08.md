# Planejamento de Pesquisa v2 — Localização e Predição de Erosão Laminar

**Objetivo:** validar um método de localização e predição de erosão laminar a partir de séries temporais multiespectrais, variáveis de terreno e solo, e regime de chuvas, com modelo supervisionado (XGBoost).

**Arquitetura de dados:** Google Earth Engine (série histórica, terreno, solo, chuva) + Planet/PlanetScope (pares de evento em alta revisita) + drone multiespectral (validação final planejada).

**Substitui:** `PLANEJAMENTO_PESQUISA_2026-09-08.md` (v1), mantido para referência.
**Data:** 08/09/2026

---

## 1. Decisões já consolidadas

| Questão | Decisão |
|---|---|
| Papel do drone | **Validação final**, em áreas selecionadas, com voo planejado |
| Fonte do rótulo de treino | Interpretação em alta resolução + campo (nunca cálculo do sistema) |
| Série temporal | **Eixo central** do método, não refinamento |
| Imageamento por evento | Pares antes/depois de chuva erosiva, via Planet |
| Chuva | CHIRPS + GPM IMERG (globais, no GEE). SIMEPAR opcional |
| RUSLE | **Linha de base de comparação**, não produto |
| Credenciais | Setor seguro do próprio aplicativo (padrão já existente) |

### A regra que rege todo o desenho

> Nenhuma quantidade calculada pelo sistema pode ser usada como rótulo. O rótulo vem de observação. O sistema produz apenas *features* e *sugestões de onde observar*.

O motivo é concreto: hoje `severity` é função determinística de quatro variáveis brutas (declividade, BSI, areia, argila) via Φ = declividade×0,40 + BSI×50 + Ψ_solo. Treinar com essas features e esse rótulo reconstruiria os limiares 28,0 e 48,0 com acurácia quase perfeita **sem aprender nada sobre erosão**.

---

## 2. A bifurcação: detecção ou predição?

O termo "previsibilidade" abre uma escolha que exige montagens de dados incompatíveis:

| | Janela da série | O que o modelo aprende |
|---|---|---|
| **Detecção** | vai **até** a data do rótulo | onde há erosão **hoje** |
| **Predição** | termina **antes** da data do rótulo, com intervalo de guarda | onde a erosão **vai** se instalar |

Se a série incluir o período até a observação, o modelo pode estar apenas lendo a assinatura da erosão já consumada. É **vazamento temporal** — o primo do vazamento de alvo.

**Recomendação: construir os dois modelos.**

- **Modelo D (detecção)** — série completa até a observação. Resultado seguro e publicável.
- **Modelo P (predição)** — série encerrada 2 anos antes da observação. A contribuição original.

A comparação entre eles é, por si só, um resultado: mostra **quanto da erosão observada já estava inscrita no histórico espectral anterior**.

---

## 3. Etapa 0 — Definição operacional do rótulo *(bloqueante)*

Nenhuma coleta começa antes disto. Rótulo inconsistente limita o desempenho mais do que qualquer escolha de algoritmo ou de feature.

A definição precisa ser: (a) observável pelo instrumento; (b) aplicável por duas pessoas com o mesmo resultado; (c) registrada **antes** de olhar os dados.

| Indicador | Campo | Drone MS | Planet 3–5 m |
|---|---|---|---|
| Espessura do horizonte A (trado) | direto | não | não |
| Exposição do horizonte B (cor do solo) | sim | sim | parcial |
| Pedestais / raízes expostas | sim | parcial | não |
| Início de sulcos (microrravinas) | sim | sim | parcial |
| Deposição de sedimento em sopé | sim | sim | sim |
| Vigor diferencial da cultura | parcial | sim | sim |

**Recomendação:** critério composto e graduado — *ausente / incipiente / moderada / severa* — registrado em campo e colapsado para binário na modelagem. Permite testar como classificador binário e ordinal, e permite excluir a classe intermediária do treino para afiar a fronteira.

**Ponto crítico:** confirmar **ausência** é mais difícil que confirmar presença. O critério de negativo precisa ser tão explícito quanto o de positivo, ou "não vi nada" será tratado como "não há".

---

## 4. Arquitetura de dados

### 4.1 O que vem do Earth Engine

| Produto | Uso | Resolução |
|---|---|---|
| Sentinel-2 L2A (`S2_SR_HARMONIZED`) | série histórica multibanda, **SWIR** | 10–20 m |
| Sentinel-1 GRD (SAR) | observação **atravessando nuvem**, rugosidade | 10 m |
| Landsat 5/7/8/9 (C2 SR) | extensão da série para trás (desde 1984) | 30 m |
| Copernicus DEM GLO-30 | declividade, curvatura, acúmulo de fluxo | 30 m |
| CHIRPS diário | identificação de eventos, série desde 1981 | ~5,5 km |
| GPM IMERG semi-horário | **intensidade** — aproxima o I30 do EI30 | ~10 km |
| Cartas de solo da Embrapa | classe pedológica e erodibilidade **reais** | vetorial |

**Sentinel-1 é a peça que viabiliza o imageamento pós-evento.** É o único sensor que garante observação logo após a tempestade. Sensível a rugosidade superficial (sulcos, encrostamento) e a umidade. Ressalva honesta: interpretação difícil, umidade e rugosidade se confundem no retroespalhamento, pré-processamento próprio. É adição metodológica real, não plug-and-play. Verificar a revisita na janela temporal escolhida — a constelação teve degradação entre 2022 e a entrada do S1C.

**Embrapa — pré-requisito, não correção.** As duas camadas hoje no aplicativo (`parana_solos_20201105` e `brasil_erodibilidade_solo`) são requisições WMS `format=image/png`: imagem decorativa, não consultável. E o SoilGrids retorna nulo para o Brasil, conforme o próprio teste do projeto registra. Como features de solo são centrais no método, é preciso consultar as cartas **por valor no ponto** (`WMS GetFeatureInfo` ou `WFS GetFeature`), ou ingeri-las como *asset* no GEE e amostrá-las no mesmo `reduceRegion`.

### 4.2 O que vem do Planet

**SuperDove, 8 bandas, 3–5 m, revisita diária.** É o que torna os pares de evento viáveis — com Sentinel-2 sozinho, a estação chuvosa do Paraná deixaria poucos pares utilizáveis.

**Limitação a assumir:** o SuperDove **não tem SWIR** (coastal blue, blue, green I, green, yellow, red, red edge, NIR). E o SWIR é a faixa mais informativa para mineralogia de solo e para distinguir horizonte B exposto.

> **Planet dá revisita. Sentinel-2 dá SWIR.** Complementares; nenhum substitui o outro.

Divisão de papéis daí decorrente:

- **Sentinel-2 / Landsat** → série histórica e assinatura espectral persistente de solo
- **Planet** → pares de evento, onde importa enxergar no dia certo
- **Sentinel-1** → garantia de observação sob nuvem

**Detalhes operacionais que mais importam:**

- **UDM2** — máscara de qualidade por pixel (clear, cloud, shadow, light_haze, heavy_haze, snow + confiança). Permite filtrar por *fração limpa dentro da AOI*, não pelo percentual de nuvem da cena inteira. Uma cena com 60% de nuvem pode estar limpa sobre o talhão.
- **Clipping no pedido** — confirmar como a cota é contabilizada. Se for por área entregue, clipar muda a escala do consumo: 400 pontos com buffer de 500 m ≈ 400 km² por data, contra dezenas de milhares se baixar cenas inteiras.
- **Harmonização com Sentinel-2** — disponível na Orders API. Necessária se Planet e S2 forem combinados na mesma série; sem ela, a diferença entre sensores vira sinal espúrio.
- **APIs:** Data API (busca; item type `PSScene`, assets `ortho_analytic_8b_sr` e `udm2`) e Orders API (pedido, clipping, harmonização, entrega). SDK e CLI em `pip install planet`.

**Uso cirúrgico.** Planet sobre buffers pequenos ao redor dos pontos amostrais e das áreas de validação, nunca varredura ampla.

### 4.3 Chuva — e o papel do SIMEPAR

Fonte primária: **CHIRPS diário** (identificação de eventos, série longa) + **GPM IMERG semi-horário** (intensidade). Ambos no GEE, globais, gratuitos.

O IMERG é o ganho relevante sobre o estado atual do projeto: o sub-horário permite estimar a **intensidade máxima em 30 minutos** — o termo I30 do EI30 da RUSLE, que a climatologia mensal de 2001–2020 hoje empregada não consegue fornecer. Chuva de 40 mm em 8 horas e 40 mm em 40 minutos são eventos erosivos completamente diferentes.

**SIMEPAR não é essencial, e há razão metodológica para não depender dele.** O objetivo é validar um *método*; um método que exige acesso privilegiado à rede de radar de um estado não se reproduz fora do Paraná. CHIRPS e IMERG tornam o método portável.

Uso recomendado do SIMEPAR, se o acesso vier: **verificar** a qualidade da estimativa satelital de chuva na área de estudo, comparando com estações e radar. Vira contribuição metodológica adicional, sem criar dependência. INMET e ANA/HidroWeb servem ao mesmo propósito e são de acesso livre.

### 4.4 Credenciais

Manter o padrão atual do aplicativo: setor próprio de configuração, com as chaves em sessão de servidor efêmera referenciada por cookie `httpOnly`, nunca gravadas em disco (`sessionStore.ts`, `ApiTokensManager.tsx`). O padrão foi auditado e está correto. A chave do Planet entra pelo mesmo caminho, ao lado da Service Account do GEE e dos demais tokens.

---

## 5. As camadas de features

### 5.1 Série histórica multibanda — o eixo do método

**Por que a série, e não a data única.** Uma imagem isolada **não separa** solo recém-gradeado de solo erodido: ambos aparecem como solo exposto. A série separa, porque o gradeado é **transitório** — em 40 dias há dossel — enquanto a mancha erodida é **persistente**: horizonte B exposto tem assinatura própria (mais óxidos de ferro, menos matéria orgânica) e a cultura cresce ali com vigor reduzido, safra após safra.

É essa persistência que a série enxerga e a data única não.

**Bandas úteis (Sentinel-2):**

| Bandas | Papel |
|---|---|
| B11, B12 (SWIR) | mineralogia e umidade — as mais informativas |
| B4, B3, B2 | cor do solo; razão B4/B2 relaciona-se a óxidos de ferro |
| B5, B6, B7 (red edge) | estresse da cultura — sinal indireto de perda de solo |
| B8, B8A (NIR) | vigor e estrutura do dossel |

Descartar B1 (aerossol) e B9 (vapor d'água): 60 m e sem informação de solo.

**O problema de dimensionalidade.** 10 bandas × 12 meses × 6 anos = **720 features** para talvez 400 pontos rotulados. Com p >> n, XGBoost superajusta e as importâncias viram ruído. Compressão obrigatória:

1. **Regressão harmônica por banda** — senoide anual + semianual; guardar offset, amplitude, fase e **tendência linear**. ~5 coeficientes por banda → ~50 features. A tendência de longo prazo no SWIR é, provavelmente, a feature mais informativa do conjunto.
2. **Estatísticas de distribuição** — percentis 10/50/90, amplitude, desvio.
3. **Frequência de exposição** — nº de observações com NDVI abaixo do limiar, maior sequência contínua de solo descoberto, mês modal de exposição.

**Lacunas.** Série longa terá muitas nuvens. Lacuna fica como `NaN` — XGBoost trata nativamente — ou é interpolada temporalmente. **Jamais preenchida com constante:** o `unmask()` hoje presente no pipeline (BSI 0,0 / NDVI 0,5) replicado ao longo de 6 anos criaria um padrão artificial que a árvore aprenderia com prazer.

### 5.2 Composto de solo exposto

Compor usando **apenas as observações em que o pixel estava efetivamente descoberto** (NDVI abaixo do limiar), ao longo de todos os anos disponíveis.

O produto é uma imagem sintética de reflectância do solo, sem cobertura vegetal e sem ruído fenológico — substancialmente superior a qualquer cena única para mapear propriedade de solo e subsolo exposto. Linha de pesquisa consolidada, com trabalho brasileiro relevante (a linha do Demattê, na ESALQ, com o GEOS3 — conferir referências e verificar se há produto pronto para o Paraná).

Ataca de frente o problema que o `inferPedologyClass` hoje tenta resolver por regra sobre granulometria. Roda no mesmo `ImageCollection` do GEE.

### 5.3 Pares de evento — antes e depois da chuva

**A ressalva física.** Logo após a chuva o solo está saturado, e solo úmido tem reflectância muito menor em todas as bandas, sobretudo no SWIR. Umidade é o maior confundidor da análise espectral de solos — o escurecimento pode encobrir o contraste que se quer medir.

O que a imagem pós-evento mostra bem: **deposição de sedimento** (leques claros em sopé e em linhas de drenagem), **incisão recente**, **encrostamento**, e **turbidez** em corpos d'água a jusante — bom proxy indireto.

Para erosão *laminar*, o momento mais informativo pode não ser logo após a chuva, mas alguns dias depois, com o solo seco: áreas erodidas mais claras (subsolo), áreas de deposição mais escuras (topsoil acumulado). A secagem revela o que a umidade mascara.

**Desenho em três momentos:**

```
T-  (antes)          cena limpa mais próxima anterior ao evento
T0  (0-2 dias)       Sentinel-1 garantido + Planet se houver janela
                     -> deposicao, incisao, encrostamento
T+  (7-15 dias)      Planet ou Sentinel-2, solo ja seco
                     -> padrao de redistribuicao
```

**Requisito do pareamento:** as cenas precisam ser radiometricamente comparáveis — mesmo sensor, geometria próxima, estágio fenológico semelhante. Senão a diferença medida é o crescimento da cultura, não a chuva.

**Montagem retrospectiva, não planejada.** Não se planeja imagear depois de uma chuva específica. Faz-se o inverso, sobre o arquivo:

1. varrer CHIRPS/IMERG e listar todos os eventos de alta erosividade (ex.: > 25 mm/dia, ou I30 acima de limiar)
2. para cada evento, buscar no arquivo a cena utilizável mais próxima antes e depois
3. manter apenas pares dentro da janela definida
4. **contar quantos pares utilizáveis realmente restam**

O passo 4 é decisivo e pode ser respondido em uma tarde, **antes** de comprometer o desenho. Se restarem dezenas de pares, é eixo central; se restarem poucos, vira ilustração de caso e o eixo permanece na série histórica.

### 5.4 Terreno, solo e a feature de mecanismo

Terreno (DEM): declividade, curvatura de perfil e plana, acúmulo de fluxo, índice topográfico de umidade (TWI), posição na vertente.

Solo: classe pedológica e erodibilidade **reais** das cartas da Embrapa.

**Feature de mecanismo** — cruzando a série espectral com a série de chuva:

```
Σ ( erosividade_t  ×  solo_exposto_t )    sobre toda a serie
```

É, essencialmente, uma RUSLE empírica construída a partir de observação em vez de coeficientes tabelados. Se superar a RUSLE clássica no conjunto de validação, é resultado de dissertação forte e defensável.

### 5.5 O que NÃO entra na matriz

`severity`, `priorityScore`, `estimatedSoilLoss`, `featureType`, `stratumId` e os cinco fatores RUSLE. Todos são funções determinísticas das variáveis brutas — colineares, sem informação adicional, e carregam os defeitos identificados na auditoria (entre eles a inversão do Fator C em relação ao BSI).

---

## 6. Desenho amostral

### 6.1 Frame de elegibilidade

Mantém-se o atual (ESA WorldCover 30/40/60; declividade 3–20%; exclusão de água com buffer de 30 m; exclusão urbana com buffer de 150 m), **acrescido de um critério novo**:

> **Cobertura temporal mínima** — número mínimo de observações válidas na série. Um ponto com 80% de lacunas não serve para treino.

### 6.2 Estratificação

Os 6 estratos atuais (3 classes de declividade × 2 grupos de erodibilidade) são base adequada. Ampliar para incluir **cobertura/uso** e **faixa de erosividade**, agora que a chuva passa a ser variável e não constante.

### 6.3 Amostragem por quantis, não Top-N

Mudança conceitual central no aplicativo. Hoje `thinBySpacing()` entrega os pontos de maior score. Para treino é preciso o oposto: **cobrir toda a faixa de Φ**, incluindo deliberadamente os de Φ baixo, que são os candidatos a classe negativa.

### 6.4 Classe negativa

Amostrar os negativos **do mesmo frame de elegibilidade** dos positivos. Se o negativo cair em floresta ou várzea, o modelo aprende "NDVI alto = sem erosão" — trivial e inútil em lavoura.

### 6.5 Bloco espacial

Atribuir a cada ponto um bloco espacial, exportado junto. O *thinning* de 1 km não elimina autocorrelação de solo e relevo; k-fold aleatório inflaria a acurácia.

---

## 7. Campanha de rotulagem

```
Fase A   Interpretacao visual em alta resolucao (Planet 3-5 m)
         2 interpretes independentes + Kappa de Cohen
         -> 300-600 pontos, rotulo de qualidade media
                        |
Fase B   Campo em subamostra estratificada (~100 pontos)
         ficha padronizada, ingestao via KoboToolbox
         -> mede a TAXA DE ERRO da interpretacao visual
                        |
Fase C   Treino dos modelos D e P
         ponderacao ou correcao pelo erro medido em B
                        |
Fase D   Drone multiespectral em areas HELD-OUT, voo planejado
         -> validacao final independente
```

A Fase B é o que torna a Fase A defensável: sem ela a interpretação visual é opinião; com ela, é medição com incerteza conhecida.

### 7.1 O drone na Fase D — como escolher as áreas

Com disponibilidade limitada, cada voo precisa render o máximo de informação. Duas exigências:

**Incluir o que o modelo prevê como negativo.** Se as áreas de validação forem só onde o modelo prevê erosão, mede-se precisão e nunca recall — falsos negativos ficam invisíveis. A seleção deve ser **estratificada ao longo da faixa de predição**, incluindo baixa probabilidade.

**Rotulagem cega.** Quem interpreta o ortomosaico não pode conhecer a predição do modelo nem o score algorítmico do ponto. O aplicativo deve exportar a lista de voo **sem as colunas de predição**.

**O drone é onde o imageamento por evento realmente funciona:** voa abaixo da base das nuvens, no dia seguinte à chuva, com resolução centimétrica. A estratégia de par de evento é mais viável no drone que no satélite — vale reservar parte dos voos para isso.

---

## 8. Modelagem

- **Matriz:** apenas medição bruta, features temporais comprimidas, chuva e a feature de mecanismo.
- **Validação cruzada espacial** por blocos. Para o Modelo P, **também** separação temporal.
- **Linha de base:** RUSLE corrigida, e o resultado do Modelo D como referência para o Modelo P.
- **Métricas:** AUC-PR e reporte explícito da prevalência. Com classe desbalanceada, acurácia é enganosa.
- **Regularização e seleção de features:** com ~50–70 features e ~400 amostras, é obrigatória. Aninhar a seleção dentro da validação cruzada, nunca antes dela.

---

## 9. O aplicativo — escopo

> Não é um eleitor de focos de erosão. É um **desenhador de amostragem e gerenciador de campanha de rotulagem**, sobre duas vias de ingestão.

| Função | Estado |
|---|---|
| Frame de amostragem (elegibilidade) | existe; acrescentar cobertura temporal mínima |
| Estratificação | existe; ampliar |
| Amostragem por quantis | **mudar** (hoje é Top-N) |
| Extração de série temporal no GEE | **construir** |
| Ingestão Planet (busca, UDM2, pedido com clipping) | **construir** |
| Detecção de eventos de chuva (CHIRPS/IMERG) | **construir** |
| Export de plano de campo e de voo, **cego** | parcial |
| Ingestão de rótulo (Kobo, interpretação, drone) | `koboParser` é boa base |
| Matriz de treino com proveniência por variável | **construir** |
| RUSLE como linha de base | existe, precisa das correções da auditoria |

### 9.1 Duas vias de ingestão

| | GEE | Planet |
|---|---|---|
| Dados | S1, S2, Landsat, DEM, CHIRPS, IMERG, solo | PlanetScope |
| Processamento | server-side, sem download | busca → pedido → download → local |
| Cota | computação | **área entregue** |

Não é problema, mas é uma segunda via a projetar — e reforça o uso cirúrgico do Planet.

### 9.2 Aproveitar do código atual

**Manter:** `eligibilityMask` + `eligibilityConstants`, `stratification`, `spatialThinning`, `aoiTiling`, `koboParser` + `KoboFieldImport`, `spatialMatcher.py` + base fundiária, `sessionStore` / `localOnly` / `isSyntheticPoint`, `xlsxWriter` e a infraestrutura de export.

**Reposicionar ou descartar:** `severity` e `priorityScore` como resultado (viram critério interno); defaults de `parsers.ts` (substituir por ausência explícita); `inferPedologyClass` (substituir pela carta real da Embrapa); perda de solo como produto (vira linha de base); bônus CAR no score exportado (separar em `selectionScore` interno).

---

## 10. Sequência de execução

```
ETAPA 0   Definicao operacional do rotulo                    BLOQUEANTE

ETAPA 1   Testes de viabilidade (baratos, antes de decidir)
          1a  Primeiro contato com a API do Planet: busca sobre
              um ponto, cobertura limpa por UDM2 na AOI
          1b  Pares de evento: quantos realmente existem?
              CHIRPS/IMERG x arquivo S1/S2/Planet

ETAPA 2   Features de verdade
          Solo real da Embrapa - chuva CHIRPS/IMERG
          Serie historica comprimida - composto de solo exposto

ETAPA 3   Amostragem para treino
          Quantis de PHI - negativos do mesmo frame
          Blocos espaciais - export de campo CEGO

ETAPA 4   Campanha de rotulagem (Fases A e B)

ETAPA 5   Modelagem: Modelo D e Modelo P

ETAPA 6   Validacao final por drone (Fase D), voo planejado
```

A Etapa 1 vale ser feita **antes** de qualquer compromisso de desenho: define se o imageamento por evento é eixo central ou ilustração.

---

## 11. Pontos para decidir com o orientador

| # | Questão | Impacto |
|---|---|---|
| 1 | Definição operacional de presente / ausente | Determina tudo o que vem depois |
| 2 | Binário ou ordinal (ausente / incipiente / moderada / severa) | Desenho do modelo e da ficha de campo |
| 3 | Modelo D, Modelo P, ou os dois | Montagem da série e do intervalo de guarda |
| 4 | Extensão da série: só Sentinel-2 (~2017+) ou incluir Landsat (1984+) | Resolução × profundidade histórica |
| 5 | Unidade de predição: pixel de 10 m, de 30 m, ou talhão | Muda features, rótulo e validação |
| 6 | Domínio de validade: só 3–20% de declividade e uso agrícola? | Restringe a inferência; precisa ser declarado |
| 7 | Nº de pontos de campo e de voos viáveis no cronograma | Fixa o teto de desempenho do modelo |
| 8 | A RUSLE entra como comparação ou sai do escopo | Define se as correções da auditoria são necessárias |

---

## 12. Riscos principais

1. **Rótulo mal definido** — risco nº 1, e não é técnico. Nenhum ajuste de modelo compensa rótulo inconsistente.
2. **Vazamento de alvo** — usar quantidade calculada pelo sistema como rótulo produz acurácia excelente e conhecimento zero.
3. **Vazamento temporal** — série que alcança a data do rótulo transforma predição em detecção sem avisar.
4. **Dimensionalidade** — 720 features para 400 amostras. Compressão e regularização não são opcionais.
5. **Preenchimento de lacuna com constante** — em série longa, cria padrão artificial que a árvore aprende.
6. **Autocorrelação espacial** — k-fold aleatório infla a acurácia.
7. **Cota do Planet** — sem clipping, um único download consome o mês.
8. **Custo de inferência** — 50 features temporais para predizer no estado inteiro exige planejamento no GEE.
9. **Viés de confirmação** — mitigado por rotulagem cega, inclusive no drone.
10. **Amostra pequena** — o teto do modelo é fixado pelo número de rótulos, não pela qualidade do código.

---

*Documento v2, derivado da auditoria de 08/09/2026 e das decisões tomadas na mesma data. As fontes externas citadas (Planet/SuperDove, CHIRPS, GPM IMERG, HLS/Landsat, cartas da Embrapa, GEOS3) precisam de confirmação de cobertura, disponibilidade e condições de uso antes de incorporação definitiva ao desenho.*
