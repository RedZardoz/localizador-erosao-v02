# Planejamento de Pesquisa — Localização e Predição de Erosão Laminar

**Objetivo da pesquisa:** validar um método de localização e predição de erosão laminar a partir de variáveis de terreno, espectrais e de regime de chuvas, com modelo supervisionado (XGBoost).

**Restrição superveniente:** o drone multiespectral não está disponível para a fase de treinamento. Passa a ser instrumento de validação final.

**Documento:** planejamento das duas hipóteses de desenho experimental e redefinição do escopo do aplicativo.
**Data:** 08/09/2026

---

## 1. O que muda ao redefinir o objetivo

O aplicativo foi construído para **eleger focos de erosão** e emitir um laudo com perda de solo pela RUSLE. O objetivo real é outro: **produzir dados de treino e validar um método preditivo**. São coisas diferentes, e a diferença não é de implementação — é de papel.

| | Papel antigo | Papel novo |
|---|---|---|
| Pipeline GEE | decide onde há erosão | propõe **onde ir observar** |
| Φ / severidade | é o resultado | é apenas um **critério de amostragem** |
| RUSLE | é o produto final | é a **linha de base de comparação** |
| Rótulo | inexistente (tudo é positivo) | vem **exclusivamente da observação** |
| Tabela Consolidada | peça pericial | **matriz de treino com proveniência** |

Essa mudança resolve sozinha o problema mais grave que a auditoria não tinha como enxergar: hoje o rótulo do sistema (`severity`) é função determinística de quatro variáveis brutas — declividade, BSI, areia e argila, via Φ = declividade×0,40 + BSI×50 + Ψ_solo. Treinar XGBoost com essas features e esse rótulo produziria um modelo que reconstrói os limiares 28,0 e 48,0 com acurácia quase perfeita **sem ter aprendido nada sobre erosão**.

**Regra que rege todo o desenho a partir daqui:**

> Nenhuma quantidade calculada pelo sistema pode ser usada como rótulo. O rótulo vem de observação — de campo, de interpretação de imagem ou de drone. O sistema só produz *features* e *sugestões de onde observar*.

---

## 2. A decisão que precede as duas hipóteses

Antes de escolher entre H1 e H2, é preciso responder uma pergunta que nenhuma das duas resolve:

### O que conta como "erosão laminar presente"?

Sem uma **definição operacional escrita antes de qualquer coleta**, os dois desenhos falham igualmente — porque rótulos inconsistentes limitam o desempenho do modelo mais do que qualquer escolha de algoritmo.

A definição precisa ser: (a) observável pelo instrumento escolhido; (b) aplicável por duas pessoas com o mesmo resultado; (c) registrada antes de olhar os dados.

Indicadores candidatos, do mais objetivo ao mais interpretativo:

| Indicador | Campo | Drone MS | Imagem VHR |
|---|---|---|---|
| Espessura do horizonte A (trado/mini-trincheira) | ✅ direto | ✗ | ✗ |
| Exposição do horizonte B (mudança de cor do solo) | ✅ | ✅ | parcial |
| Pedestais de erosão / raízes expostas | ✅ | parcial | ✗ |
| Início de sulcos (microrravinas) | ✅ | ✅ | parcial |
| Deposição de sedimento em sopé de rampa | ✅ | ✅ | ✅ |
| Vigor diferencial da cultura em manchas | parcial | ✅ | ✅ |

**Recomendação:** adotar um critério **composto e graduado** (ausente / incipiente / moderada / severa) registrado em campo, e colapsá-lo para binário na modelagem. Guardar o grau permite, depois, testar o modelo como classificador binário *e* como ordinal, e permite excluir a classe "incipiente" do treino para afiar a fronteira — recurso padrão quando a classe intermediária é ambígua.

**Ponto crítico:** confirmar **ausência** de erosão laminar é mais difícil que confirmar presença. A erosão laminar é sutil — essa é a premissa do projeto inteiro. O critério de negativo precisa ser tão explícito quanto o de positivo, ou o negativo vira "não vi nada", que não é a mesma coisa que "não há".

---

## 3. Hipótese 1 — Drone multiespectral para treinamento

*(desenho original, hoje inviável; documentado para comparação e para o caso de o drone ser recuperado)*

### 3.1 Geração do rótulo

- Selecionar **N talhões** de 10–30 ha, estratificados no espaço de features (declividade × erodibilidade × cobertura).
- Voo multiespectral, GSD 5–10 cm, ortomosaico + índices espectrais de alta resolução.
- Delimitação de **polígonos** de mancha erosiva sobre o ortomosaico, com verificação em campo de uma subamostra.
- Rasterização dos polígonos para a grade de predição.

### 3.2 A decisão de escala — onde este desenho costuma falhar

O drone rotula a 5–10 cm. O modelo prediz na grade do Sentinel-2 (10 m) e do DEM (30 m). É preciso uma regra de agregação explícita:

> Um pixel de 10 m é positivo se ≥ X% da sua área estiver dentro de mancha erosiva.

- Sugestão: X = 40%, com teste de sensibilidade em 30% e 50%.
- **Recurso recomendado:** descartar do treino os pixels *mistos* (10% < cobertura < 40%). Afia a fronteira de decisão e reduz ruído de rótulo. Custa amostra, ganha qualidade.

### 3.3 A armadilha central: features de inferência

> **O drone fornece o RÓTULO, nunca a FEATURE.**

Se o modelo for treinado com bandas ou índices derivados do drone, ele só poderá predizer onde houve voo — o que anula o propósito do método. As features precisam ser exatamente as mesmas disponíveis em qualquer ponto do estado: Sentinel-2, DEM, clima e solo.

### 3.4 Tamanho de amostra — a vantagem real de H1

Um voo de 20 ha = 200.000 m² ≈ **2.000 pixels Sentinel de 10 m rotulados**. Dez voos ≈ 20.000 pixels.

Mas atenção ao que isso significa de fato: pixels do mesmo voo são fortemente autocorrelacionados. O **número efetivo de unidades independentes é o número de sítios, não de pixels**. Dez voos são dez unidades. Para sustentar uma afirmação de generalização, o desenho precisa de **20–30 sítios independentes**, bem distribuídos.

Consequência obrigatória: validação cruzada **agrupada por voo** (`GroupKFold`), jamais aleatória por pixel. Um k-fold aleatório aqui produziria acurácia de 0,95 e nenhum poder preditivo real.

### 3.5 Riscos de H1

- Regra de agregação de escala é arbitrária e influencia o resultado.
- Poucas unidades independentes, apesar do volume aparente de dados.
- Viés na escolha dos talhões de voo (tende-se a voar onde já se sabe que há erosão).
- **Viés compartilhado entre treino e validação:** mesmo sensor, mesmo intérprete, mesmo critério. A validação mede consistência, não correção.
- Dependência de um equipamento — risco que já se materializou.

---

## 4. Hipótese 2 — Drone somente para validação final

*(desenho viável hoje)*

O rótulo de treino precisa vir de outra fonte. Três alternativas, avaliadas honestamente:

### 4.1 Fontes de rótulo

**Opção A — Interpretação visual em imagem de altíssima resolução**

- Fontes gratuitas a verificar: **PlanetScope/NICFI** (~4,7 m, programa gratuito para os trópicos — confirmar cobertura do Paraná), **CBERS-4A/WPM** (INPE, 2 m PAN / 8 m MUX, gratuito), acervo histórico do Google Earth (altíssima resolução, uso apenas visual).
- Protocolo obrigatório: critério escrito, **dois intérpretes independentes**, medida de concordância (Kappa de Cohen), terceiro intérprete para desempate.
- **Vantagem:** escalável e barata — permite centenas de pontos.
- **Limitação séria:** só detecta erosão laminar **já avançada** (subsolo exposto, manchas claras, deposição em sopé). A incipiente é invisível nessa resolução.
- **Consequência a declarar na dissertação:** o modelo aprenderá a detectar erosão laminar avançada. É um domínio de validade legítimo, desde que explicitado.

**Opção B — Campanha de campo convencional**

- GPS + trado ou mini-trincheira + ficha padronizada de avaliação.
- Indicadores objetivos: espessura do horizonte A, exposição do B, pedestais, marcas em colo de raiz, deposição em sopé.
- **Vantagem:** rótulo de alta qualidade e capaz de detectar a erosão incipiente, que é justamente o alvo científico mais interessante.
- **Limitação:** ~15–30 pontos por dia com equipe; custo de deslocamento domina.
- **Já existe infraestrutura no projeto:** `koboParser.ts` e o componente `KoboFieldImport` importam formulários do KoboToolbox e marcam o ponto como `field-validated`, com as observações preservadas como vieram. É a espinha dorsal pronta para este desenho.

**Opção C — Inventários de erosão existentes**

- IAT, Embrapa Solos, ITCG, teses anteriores na região.
- ⚠️ **Advertência metodológica:** mapas de *suscetibilidade à erosão* são **modelos**, não observações — em geral derivados de declividade e solo, as mesmas variáveis que serão features. Treinar neles é destilar outro modelo, não validar um método novo. **Só serve inventário de erosão observada e mapeada em campo.**

### 4.2 Desenho recomendado para H2 — cadeia em quatro fases

```
Fase A  Interpretação visual (2 intérpretes + Kappa)
        → 300–600 pontos, rótulo de qualidade média
                     ↓
Fase B  Campo em subamostra estratificada (~100 pontos)
        → mede a TAXA DE ERRO da interpretação visual
                     ↓
Fase C  Treino do XGBoost no conjunto grande,
        com ponderação ou correção pelo erro medido em B
                     ↓
Fase D  Drone multiespectral em áreas HELD-OUT,
        nunca vistas em nenhuma fase anterior
        → validação final independente
```

A Fase B é o que torna a Fase A defensável: sem ela, a interpretação visual é uma opinião; com ela, é uma medição com incerteza conhecida.

### 4.3 A vantagem científica que H2 tem sobre H1

Este é o argumento que transforma a restrição em virtude, e vale colocar na dissertação:

> Em H1, treino e validação compartilham sensor, intérprete e critério. Erro sistemático de rotulagem se propaga igualmente aos dois — a validação confirma **consistência**, não **correção**.
>
> Em H2, o rótulo de treino (interpretação + campo) e o de validação (drone multiespectral) são **metodologicamente independentes**. A validação passa a testar se o método generaliza **através de modalidades de observação**. É evidência substancialmente mais forte de que o método funciona.

### 4.4 Riscos de H2

- Rótulo mais ruidoso → teto de desempenho do modelo mais baixo. XGBoost tolera bem ruído **aleatório**; ruído **sistemático** (ex.: intérprete que sempre subestima em solo escuro) é destrutivo. Daí a exigência dos dois intérpretes e do Kappa.
- Domínio restrito à erosão avançada, se a Fase B não corrigir.
- Custo de campo concentrado na Fase B.

---

## 5. Comparação e recomendação

| Critério | H1 — drone no treino | H2 — drone só na validação |
|---|---|---|
| Qualidade do rótulo | **Alta** | Média (alta na subamostra de campo) |
| Volume de rótulos | Muito alto (pixels) | Médio (pontos) |
| Unidades independentes | **Baixo** (nº de voos) | **Alto** (pontos dispersos) |
| Detecta erosão incipiente | Sim | Só via campo (Fase B) |
| Força lógica da validação | **Fraca** (viés compartilhado) | **Forte** (modalidade independente) |
| Custo | Alto e concentrado | Médio e distribuído |
| Viabilidade hoje | **Inviável** | Viável |
| Risco de ponto único de falha | Alto (equipamento) | Baixo |

### Recomendação: **H2** — e não apenas por necessidade

A independência entre a modalidade de rotulagem do treino e a da validação é uma **melhoria real do desenho experimental**, não um consolo. Uma banca aceita mais facilmente "treinei com interpretação corrigida por campo e validei com drone" do que "treinei e validei com o mesmo drone e o mesmo intérprete".

Vale ainda registrar um caminho híbrido: **se o drone ficar disponível para 5–8 voos**, o melhor uso não é treinar — é entrar como **terceira modalidade na Fase B**, medindo a taxa de erro da interpretação visual com precisão muito maior que o campo isolado. Isso fortalece toda a cadeia sem comprometer a independência da Fase D.

---

## 6. Regime de chuvas — onde eu apostaria o ganho preditivo

Você citou o regime de chuvas como variável do método. Hoje o sistema usa **climatologia da NASA POWER, médias mensais de 2001–2020, resolução ~55 km**, para produzir um Fator R anual.

Isso é adequado para a RUSLE, e **inadequado como feature de um modelo local**: dentro de uma AOI municipal ou de sub-bacia, essa variável é praticamente constante. Uma feature constante não carrega informação.

Erosão laminar responde a **eventos**, não a médias. O que provavelmente prediz é o histórico recente de chuva antes da imagem:

| Feature proposta | Fonte |
|---|---|
| Precipitação acumulada 30 / 60 / 90 dias antes da cena | CHIRPS diário (`UCSB-CHG/CHIRPS/DAILY`, ~5,5 km) |
| Intensidade máxima diária no período | CHIRPS / GPM IMERG |
| Nº de eventos erosivos (> 10 mm/dia) | CHIRPS diário |
| Maior sequência de dias secos antes do evento | CHIRPS diário |
| Erosividade EI30 acumulada da estação corrente | derivada de CHIRPS |

Todas as fontes já são acessíveis dentro do próprio Earth Engine, no mesmo `reduceRegion` das demais bandas — sem chamada de rede adicional por ponto.

**Complemento de alto valor — features temporais espectrais.** Para erosão laminar, a **frequência de exposição de solo nu durante a estação chuvosa** deve predizer melhor do que um BSI de data única: nº de meses com BSI acima do limiar, BSI máximo do ciclo, amplitude anual de NDVI. Combinado com a chuva do mesmo período, aproxima-se do mecanismo físico real — chuva erosiva incidindo sobre solo descoberto.

Se eu tivesse que escolher **uma** mudança de maior retorno preditivo neste projeto, seria esta: sair da fotografia de data única para a série temporal, tanto no espectral quanto na chuva.

---

## 7. O aplicativo — novo escopo

### 7.1 O que ele passa a ser

> Não é um eleitor de focos de erosão. É um **desenhador de amostragem e gerenciador de campanha de rotulagem**.

Sete funções, nesta ordem de importância:

1. **Frame de amostragem** — máscara de elegibilidade (uso do solo, faixa de declividade, exclusão de água e área urbana) definindo o universo de onde se pode amostrar. *Já existe e funciona.*
2. **Estratificação do espaço de features** — hoje 6 estratos (3 classes de declividade × 2 grupos de erodibilidade). *Existe; precisa ampliar para incluir cobertura/uso e faixa de chuva.*
3. **Amostragem com espalhamento, não com seleção do topo** — ⚠️ **mudança conceitual central.** Hoje `thinBySpacing()` entrega os pontos de maior score. Para treino é preciso o oposto: cobrir toda a faixa de Φ, incluindo deliberadamente os pontos de Φ baixo, que são os candidatos a **classe negativa**. Amostragem por quantis, não Top-N.
4. **Exportar plano de campo** — navegação até os pontos, ficha de coleta, formulário Kobo. *Parcialmente existe.*
5. **Ingerir rótulos** — Kobo (campo), interpretação visual, resultados de drone, cada um com sua modalidade registrada. *`koboParser` existe e é boa base.*
6. **Montar a matriz de treino com proveniência por variável** — features + rótulo + modalidade + intérprete + data. *Não existe.*
7. **RUSLE como linha de base de comparação** — deixa de ser produto e passa a ser o *benchmark* contra o qual o XGBoost será comparado. É um resultado forte de dissertação: "o modelo supervisionado supera a RUSLE em X". Mas exige que a RUSLE esteja **correta**, porque não se compara contra uma linha de base quebrada.

### 7.2 Requisitos que decorrem do uso em aprendizado de máquina

- **Nenhuma constante de preenchimento.** Valor ausente é `null`, nunca 0,32 / 0,45 / 16. Em modelo de árvore, valor constante vira divisão em valor exato e o modelo aprende o artefato. XGBoost trata `NaN` nativamente — deixar ausente é **melhor** que imputar.
- **Nenhuma feature derivada do rótulo.** Fora da matriz: `severity`, `priorityScore`, `estimatedSoilLoss`, `featureType`, `stratumId` e os cinco fatores RUSLE (funções determinísticas das brutas — colineares e sem informação adicional).
- **Proveniência por variável**, para permitir remover do treino, depois, tudo que não for medição.
- **Bloco espacial exportado junto** com cada ponto, para viabilizar validação cruzada espacial. O *thinning* de 1 km não elimina autocorrelação de solo e relevo — k-fold aleatório inflaria a acurácia.
- **Rotulagem cega:** quem rotula não pode ver o score algorítmico do ponto. Caso contrário, mede-se viés de confirmação. O app deve ser capaz de **exportar a lista de campo sem as colunas de predição**.

### 7.3 O que aproveitar do código atual

**Recomeçar do conceito, não do código.** Há subsistemas bons demais para descartar:

| Manter | Por quê |
|---|---|
| `eligibilityMask.ts` + `eligibilityConstants.ts` | frame de amostragem correto e parametrizado |
| `stratification.ts` + estratos A1–B3 | desenho de estratificação adequado |
| `spatialThinning.ts` | dispersão geográfica; muda o critério, não o algoritmo |
| `aoiTiling.ts` | particionamento para não estourar cota do GEE |
| `koboParser.ts` + `KoboFieldImport` | ingestão de rótulo de campo — base pronta para H2 |
| `spatialMatcher.py` + base fundiária | contexto de manejo e acesso à propriedade para campo |
| `sessionStore` / `localOnly` / `isSyntheticPoint` | segurança e integridade, auditados e corretos |
| `xlsxWriter` + infraestrutura de export | funciona e gera arquivo válido |

| Descartar ou reposicionar | Por quê |
|---|---|
| `severity`, `priorityScore` como resultado | viram critério interno de amostragem |
| Defaults de `parsers.ts` | substituir por ausência explícita |
| `inferPedologyClass` | substituir pela carta real da Embrapa |
| Cálculo de perda de solo como produto | vira linha de base de comparação |
| Bônus CAR no score exportado | separar em `selectionScore` interno |

### 7.4 Sobre os dados da Embrapa

Registrado na auditoria e ainda mais relevante agora: as duas camadas da Embrapa no app (`parana_solos_20201105` e `brasil_erodibilidade_solo`) são requisições WMS `format=image/png` — **imagem decorativa, não consultável**. E o SoilGrids, segundo o próprio teste do projeto, **retorna nulo para o Brasil**.

Como **features de solo são centrais** no seu método, isso deixa de ser um item de correção e passa a ser **pré-requisito**: consultar as cartas da Embrapa por valor no ponto (`WMS GetFeatureInfo` ou `WFS GetFeature`; alternativamente ingerir como *asset* no Earth Engine e amostrar no mesmo `reduceRegion`).

---

## 8. Sequência de execução proposta

```
ETAPA 0   Definição operacional do rótulo (§2)
          Escrita, revisada com o orientador, ANTES de qualquer coleta.
          Sem isso, nada depois tem validade.

ETAPA 1   Features de verdade
          • Solo real da Embrapa (substitui inferPedologyClass)
          • Chuva diária CHIRPS (substitui climatologia)
          • Séries temporais BSI/NDVI
          • Eliminar toda constante de preenchimento

ETAPA 2   Amostragem para treino
          • Amostragem por quantis de Φ, não Top-N
          • Negativos do mesmo frame de elegibilidade
          • Blocos espaciais atribuídos
          • Export de campo CEGO (sem colunas de predição)

ETAPA 3   Campanha de rotulagem (H2, Fases A e B)
          • Interpretação visual: 2 intérpretes + Kappa
          • Campo em subamostra: mede a taxa de erro
          • Ingestão via Kobo

ETAPA 4   Modelagem
          • Matriz só com medição bruta + temporal + chuva
          • Validação cruzada espacial por blocos
          • Linha de base: RUSLE corrigida
          • Métricas honestas para classe desbalanceada (AUC-PR, não só acurácia)

ETAPA 5   Validação final (H2, Fase D)
          • Drone multiespectral em áreas held-out
          • Nunca vistas em nenhuma etapa anterior
```

A **Etapa 0 é bloqueante**. As demais podem sobrepor-se parcialmente.

---

## 9. Pontos para decidir com o orientador

| # | Questão | Impacto |
|---|---|---|
| 1 | Definição operacional de "erosão laminar presente" e de "ausente" | Determina tudo o que vem depois |
| 2 | Binário ou ordinal (ausente / incipiente / moderada / severa)? | Desenho do modelo e da ficha de campo |
| 3 | Domínio de validade: apenas 3–20% de declividade e uso agrícola? | Restringe a inferência; precisa ser declarado |
| 4 | Unidade de predição: pixel de 10 m, de 30 m, ou talhão? | Muda features, rótulo e validação |
| 5 | Nº de pontos de campo viável no cronograma | Fixa o teto de desempenho do modelo |
| 6 | Forma do Fator C na RUSLE (⚠️ inversão documentada na auditoria) | Só afeta a linha de base, não o XGBoost — mas a linha de base precisa estar certa |
| 7 | A RUSLE entra como comparação ou sai do escopo? | Define se as correções C1/C2 são necessárias |

---

## 10. Riscos principais do projeto

1. **Rótulo mal definido** — risco nº 1, e não é técnico. Nenhum ajuste de modelo compensa rótulo inconsistente.
2. **Vazamento de alvo** — usar qualquer quantidade calculada pelo sistema como rótulo produz acurácia excelente e conhecimento zero. Mitigado pela regra da §1.
3. **Autocorrelação espacial** — k-fold aleatório infla a acurácia. Mitigado por blocos espaciais.
4. **Amostra pequena** — o teto do modelo é fixado pelo número de rótulos, não pela qualidade do código. Dimensionar cedo.
5. **Desbalanceamento de classes** — se os positivos forem raros no frame, acurácia é métrica enganosa. Usar AUC-PR e reportar a prevalência.
6. **Viés de confirmação na rotulagem** — mitigado por rotulagem cega ao score.
7. **Extrapolação fora do domínio treinado** — declarar o domínio de validade em vez de predizer em todo o estado sem ressalva.

---

*Documento derivado da auditoria de 08/09/2026 e da redefinição de objetivo discutida na mesma data. Os itens sobre fontes de dados externas (NICFI, CBERS-4A, CHIRPS, GPM IMERG, cartas da Embrapa) precisam de confirmação de cobertura e de condições de uso antes de serem incorporados ao desenho definitivo.*
