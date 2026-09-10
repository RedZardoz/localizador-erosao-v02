# Planejamento de Pesquisa v3 — Localização e Predição de Erosão Laminar

**Objetivo:** validar um método de localização e predição de erosão laminar a partir de séries temporais multiespectrais, variáveis de terreno e solo, e regime de chuvas, com modelo supervisionado (XGBoost).

**Arquitetura:** Google Earth Engine (série histórica, terreno, chuva) + Embrapa GeoInfo (solo e erodibilidade) + Planet/PlanetScope (pares de evento) + drone multiespectral (validação final planejada).

**Substitui:** v1 e v2 de 08/09/2026, mantidas para referência.
**Data:** 08/09/2026

> **Nota sobre as referências.** As citações da §13 correspondem a obras que fundamentam cada decisão. **Confira cada uma na fonte original antes de incorporá-la à dissertação** — ano, veículo, volume e paginação. A responsabilidade pela verificação bibliográfica é do pesquisador.

---

## 1. Princípio metodológico que rege o projeto

> **Dado verdadeiro ou ausência declarada. Nunca um valor plausível de origem desconhecida.**

**Justificativa técnica.** Em um sistema que alimenta um classificador supervisionado, preencher lacuna com constante não é neutro: modelos de árvore particionam o espaço por limiares e **criam divisões em valor exato**. Um conjunto de pixels preenchidos com BSI = 0,45 forma um agrupamento artificial perfeitamente separável, que a árvore aprende como se fosse padrão do terreno. O erro não se dilui com mais dados — ele se consolida.

Além disso, o XGBoost trata valor ausente nativamente: o algoritmo aprende, para cada nó, a direção padrão dos ausentes (Chen & Guestrin, 2016). **Deixar `NaN` é tecnicamente superior a imputar**, porque preserva a informação "não observado" em vez de destruí-la.

**Corolário para o rótulo:** nenhuma quantidade calculada pelo sistema pode servir de rótulo. Na versão anterior do aplicativo, `severity` era função determinística de quatro variáveis brutas via Φ = declividade×0,40 + BSI×50 + Ψ_solo. Treinar com essas features e esse rótulo reconstruiria os limiares 28,0 e 48,0 com acurácia quase perfeita **sem aprender nada sobre erosão** — o caso-escola de vazamento de alvo descrito por Kaufman et al. (2012).

---

## 2. Decisões consolidadas

| Decisão | Justificativa |
|---|---|
| Drone apenas na **validação final** | Independência entre modalidade de rotulagem do treino e da validação (§4) |
| Rótulo vem de **observação**, nunca de cálculo | Evita vazamento de alvo (Kaufman et al., 2012) |
| **Série temporal** como eixo, não data única | Separa solo transitoriamente exposto de solo persistentemente erodido (§6.1) |
| **Pares de evento** de chuva | Erosão responde a eventos, não a médias (Wischmeier & Smith, 1978) |
| Chuva: **CHIRPS + IMERG**, SIMEPAR opcional | Portabilidade do método; ver §5.3 |
| Solo: **cartas da Embrapa**, consulta por ponto | Levantamento de campo substitui inferência por regra (§5.2) |
| **RUSLE como linha de base**, não produto | Permite quantificar o ganho do modelo supervisionado |
| **Mapbox fora do caminho analítico** | Mosaico visual sem calibração radiométrica nem data por pixel (§5.5) |

---

## 3. Etapa 0 — Definição operacional do rótulo *(bloqueante)*

**Justificativa.** O desempenho máximo alcançável por qualquer classificador é limitado pela consistência do rótulo. Ruído aleatório de rotulagem reduz a acurácia atingível; ruído **sistemático** — um intérprete que sempre subestima em solo escuro — é aprendido pelo modelo como se fosse sinal. Nenhum ajuste de hiperparâmetro compensa isso. Por isso a definição precede a coleta, e não o contrário.

Requisitos: (a) observável pelo instrumento; (b) reprodutível entre observadores; (c) registrada **antes** de olhar os dados.

| Indicador | Fundamento | Campo | Drone MS | Planet 3–5 m |
|---|---|---|---|---|
| Espessura do horizonte A | Perda laminar remove o horizonte superficial (Bertoni & Lombardi Neto) | direto | não | não |
| Exposição do horizonte B | Mudança de cor por óxidos de ferro e perda de matéria orgânica | sim | sim | parcial |
| Pedestais / raízes expostas | Evidência morfológica clássica de rebaixamento superficial | sim | parcial | não |
| Início de sulcos | Transição laminar → concentrada | sim | sim | parcial |
| Deposição em sopé | Contraparte deposicional da perda a montante | sim | sim | sim |
| Vigor diferencial da cultura | Resposta agronômica à perda de solo fértil | parcial | sim | sim |

**Recomendação: critério composto e graduado** — *ausente / incipiente / moderada / severa* — colapsado para binário na modelagem.

**Justificativa técnica da graduação:** permite (i) testar como classificador binário e ordinal; (ii) **excluir a classe intermediária do treino** para afiar a fronteira de decisão, procedimento padrão quando a classe do meio é ambígua; (iii) medir a concordância entre observadores em escala ordinal, mais informativa que a binária.

**Concordância entre intérpretes:** medir com Kappa de Cohen (1960), interpretando os patamares segundo Landis & Koch (1977). Um Kappa abaixo de 0,60 indica que o critério não está operacional e precisa ser reescrito **antes** da coleta em escala.

**Ponto crítico.** Confirmar **ausência** é mais difícil que confirmar presença — a erosão laminar é difusa e sem feição marcante, o que é a premissa do próprio projeto (Vrieling, 2006). O critério de negativo precisa ser tão explícito quanto o de positivo, sob pena de "não observei" ser registrado como "não há".

---

## 4. Detecção ou predição — e por que fazer os dois

| | Janela da série | Aprende |
|---|---|---|
| **Modelo D — detecção** | vai **até** a data do rótulo | onde há erosão hoje |
| **Modelo P — predição** | encerra **antes**, com intervalo de guarda | onde a erosão vai se instalar |

**Justificativa.** Se a série alcança a data da observação, o modelo pode estar lendo a assinatura da erosão já consumada — a assinatura espectral do horizonte B exposto está *no dado de entrada*. As métricas ficam excelentes e o resultado é um detector rotulado como preditor. É vazamento temporal, variante reconhecida do vazamento de alvo (Kaufman et al., 2012).

**Recomendação: construir os dois.** O Modelo D é o resultado seguro. O Modelo P é a contribuição original. A diferença de desempenho entre eles quantifica **quanto da erosão observada já estava inscrita no histórico espectral anterior** — e isso é, em si, um resultado.

Intervalo de guarda sugerido: 2 anos entre o fim da série e a observação, a ser justificado pela taxa de evolução da erosão laminar na região.

---

## 5. Fontes de dados e justificativa de cada escolha

### 5.1 Earth Engine

| Produto | Papel | Justificativa da escolha |
|---|---|---|
| Sentinel-2 L2A | série multibanda, **SWIR** | 10–20 m, revisita de 5 dias, e as bandas SWIR são as mais informativas para mineralogia de solo (Drusch et al., 2012) |
| Sentinel-1 GRD (SAR) | observação **sob nuvem** | Único sensor que garante aquisição logo após o evento; sensível a rugosidade e umidade |
| Landsat 5/7/8/9 C2 SR | extensão da série | Arquivo desde 1984 permite alcance histórico que o Sentinel-2 não tem; harmonização discutida em Claverie et al. (2018) |
| Copernicus DEM GLO-30 | terreno | Cobertura global consistente, 30 m |
| CHIRPS diário | identificação de eventos | Série desde 1981 com calibração por estações (Funk et al., 2015) |
| GPM IMERG semi-horário | **intensidade** | Resolução sub-horária permite aproximar o I30 do EI30 (§5.3) |

**Plataforma.** O Earth Engine é adotado por permitir processamento server-side sobre o arquivo completo sem download, viabilizando séries longas em escala estadual (Gorelick et al., 2017).

**Declividade — correção obrigatória.** A implementação anterior calculava declividade com `setDefaultProjection("EPSG:3857")`. Web Mercator é conforme mas **não preserva escala**: o fator de escala varia com 1/cos(latitude). Na latitude do Paraná (~24–26° S) isso equivale a ≈ 1,10 — a distância horizontal fica inflada em cerca de 10% e a declividade correspondentemente **subestimada**, de forma sistemática e não aleatória. O cálculo deve usar projeção métrica local (UTM 22S / EPSG:31982) ou correção explícita por latitude.

### 5.2 Embrapa — solo e erodibilidade *(verificado em 08/09/2026)*

**Diagnóstico do que havia.** As duas camadas da Embrapa estavam no aplicativo apenas como requisições WMS `format=image/png` — imagem decorativa, não consultável. A classe de solo era **inferida por regra** sobre granulometria OpenLandMap (250 m), e a distinção *Distroférrico × Eutroférrico* era decidida por `argila > 50%`. Isso não tem respaldo: no SiBCS, o caráter distrófico/eutrófico é definido por **saturação por bases (V%)**, propriedade química que não se deriva de teor de argila (Santos et al., 2018). E o SoilGrids, conforme o próprio teste do projeto registrava, retorna nulo para o Brasil.

**Verificação executada.** Consulta ao `GetCapabilities` do GeoServer da Embrapa confirmou `GetFeatureInfo` com saída `application/json` e `queryable="1"` nas duas camadas. Consultas reais em três coordenadas retornaram:

*Oeste do Paraná (−25,067 / −53,688):*

```
sbcs        RRe12            tipo_unida  associacao
ordem_1     NEOSSOLO         sub_ordem_  REGOLITICO     grande_gru  Eutrofico
ordem_2     CHERNOSSOLO      sub_ordem1  ARGILUVICO     grande_g_1  Ferrico
ordem_3     NITOSSOLO        sub_orde_1  VERMELHO       grande_g_2  Distroferrico
familia_1_  textura argilosa fase_relev  ondulado e montanhoso
erodibilidade -> classe "Alta" (codnum 4)
```

*Noroeste (−23,42 / −52,60):* `LVe1 — LATOSSOLO VERMELHO Eutrófico`, unidade **simples**.
*Oceano (−25,5 / −45,0):* nenhuma feição — ausência de cobertura corretamente distinguível.

**Consequências.** O campo `grande_gru` traz o caráter distrófico/eutrófico **como levantado em campo**. A inferência por regra é substituída por dado de levantamento. No ponto do Oeste, a regra anterior provavelmente retornaria um Latossolo onde o levantamento registra Neossolo Regolítico.

**A ressalva que o próprio dado declara.** O campo `tipo_unida` distingue `simples` de `associacao`. Em associação, a unidade de mapeamento contém até três solos e **a carta não resolve qual ocorre na coordenada específica** — limitação de escala inerente a levantamentos pedológicos, não defeito do dado.

**Decisão:** usar `ordem_1` como componente dominante e **carregar `tipo_unida` como medida de confiança explícita**, propagada até a planilha exportada. Pontos em associação entram no modelo com incerteza declarada. Isso é preferível a descartá-los (perda de amostra) e muito preferível a apresentá-los como certos.

**Erodibilidade.** Retorna **classe categórica** ("Alta"), não valor numérico de K, e o domínio inclui categorias não-pedológicas (verificado: "Area urbana"). Tratar como variável categórica — o XGBoost lida nativamente. **Não converter para K numérico sem respaldo documental da própria Embrapa**, sob pena de reintroduzir por outra via o palpite que se acabou de eliminar.

**Implementação de referência.** `src/lib/embrapa/embrapaSoilClient.ts`, com 19 testes unitários e verificação ao vivo contra o serviço. Distingue rigorosamente três estados — `encontrado`, `sem-cobertura`, `servico-indisponivel` — e nunca devolve valor inventado.

### 5.3 Chuva — e o papel do SIMEPAR

**Fonte primária:** CHIRPS diário (eventos, série longa) + GPM IMERG semi-horário (intensidade).

**Justificativa do IMERG.** O termo de erosividade da USLE/RUSLE é o EI30 — produto da energia cinética pela **intensidade máxima em 30 minutos** (Wischmeier & Smith, 1978; Renard et al., 1997). A climatologia mensal usada anteriormente (médias 2001–2020, ~55 km) não contém intensidade: 40 mm em 8 horas e 40 mm em 40 minutos produzem o mesmo valor mensal e são eventos erosivos completamente distintos. A resolução sub-horária do IMERG permite aproximar o I30 diretamente da observação.

**Por que a climatologia era inadequada como feature.** Além da ausência de intensidade, uma climatologia de 55 km é **praticamente constante** dentro de uma AOI municipal ou de sub-bacia. Variável constante não carrega informação discriminante para um classificador — ela é descartada pelo modelo ou, pior, gera divisões espúrias.

**SIMEPAR não é essencial, e há razão metodológica para não depender dele.** O objetivo declarado é **validar um método**. Um método que exige acesso privilegiado à rede de radar de um estado específico não se reproduz fora do Paraná, o que enfraquece a própria alegação de validade. CHIRPS e IMERG são globais e gratuitos, tornando o método portável e replicável por terceiros — requisito de auditabilidade científica.

**Uso recomendado, se o acesso vier:** verificar a qualidade da estimativa satelital na área de estudo, comparando com estações e radar. Vira contribuição metodológica adicional, sem criar dependência. INMET e ANA/HidroWeb servem ao mesmo propósito com acesso livre.

### 5.4 Planet — pares de evento

**Justificativa da escolha.** A revisita diária do PlanetScope é o que torna viável o pareamento antes/depois de evento. Com Sentinel-2 isolado (5 dias, e nuvem convectiva na estação chuvosa), o número de pares utilizáveis tende a ser insuficiente.

**Limitação a assumir e declarar.** O SuperDove tem 8 bandas (coastal blue, blue, green I, green, yellow, red, red edge, NIR) e **não tem SWIR** — justamente a faixa mais informativa para mineralogia de solo.

> **Planet fornece revisita. Sentinel-2 fornece SWIR.** Complementares; nenhum substitui o outro.

**Divisão de papéis:** Sentinel-2/Landsat sustentam a série histórica e a assinatura persistente de solo; Planet sustenta os pares de evento; Sentinel-1 garante a observação sob nuvem.

**Operacional:**

- **UDM2** — máscara por pixel (clear, cloud, shadow, light/heavy haze, snow + confiança). Permite filtrar por **fração limpa dentro da AOI**, não pelo percentual de nuvem da cena. Uma cena com 60% de nuvem pode estar limpa sobre o talhão.
- **Clipping no pedido** — se a cota for por área entregue, 400 pontos com buffer de 500 m ≈ 400 km² por data, contra dezenas de milhares sem clipping.
- **Harmonização com Sentinel-2** (Orders API) — necessária se as duas fontes entrarem na mesma série, sob pena de a diferença entre sensores virar sinal espúrio.

### 5.5 Mapbox — escopo restrito

**Fora do caminho analítico.** O Mapbox Satellite é mosaico visual RGB, **sem calibração radiométrica, sem data de aquisição por pixel e sem bandas multiespectrais**. Extrair feature dali seria indefensável, e a licença normalmente restringe produtos derivados.

**Não usar na fotointerpretação da Fase A:** sem data de aquisição conhecida, o intérprete não sabe a que momento a imagem corresponde — o que invalida qualquer rotulagem temporalmente ancorada.

**Onde ajuda legitimamente:** Directions API para roteirizar a visita aos pontos de campo (com ~100 pontos dispersos, o ganho logístico é real) e Static Images API para miniatura de contexto na ficha de campo. Para geocodificação de município, o IBGE é a fonte autoritativa e já está integrado.

### 5.6 Fundiário — papel redefinido

**O que muda.** Sob o novo desenho, o dado fundiário **não entra como feature**: seria injetar informação cadastral não-física num modelo de processo físico, além de introduzir correlação espúria (propriedades grandes tendem a manejo distinto, o que o modelo aprenderia como se fosse causa).

**Os quatro papéis legítimos:**

1. **Acesso e autorização para campo.** Não se entra em propriedade alheia sem identificar o titular e obter permissão. Para ~100 pontos de campo e os voos de drone, é requisito **operacional e ético**, não conveniência.
2. **Contexto de manejo.** CAR traz declarações de uso, APP e reserva legal — úteis no desenho da estratificação.
3. **Unidade de agregação.** O imóvel ou talhão pode ser a unidade de amostragem em vez do pixel (decisão em aberto, §12).
4. **Documentação de autorização** para o dossiê da pesquisa.

**Consequência prática de um defeito já identificado.** Na implementação anterior, qualquer falha de consulta — erro de banco, timeout, coordenada inválida — era convertida em status `sem-correspondencia`, e a planilha afirmava *"Sem correspondência — nenhum imóvel nesta coordenada"*. Além de falsa, essa afirmação tem consequência de campo: pode levar a planejar visita a uma propriedade **sem procurar autorização de ninguém**, porque o sistema declarou que não há proprietário. A distinção entre "consultado e não há" e "não foi possível consultar" é requisito, não refinamento.

---

## 6. Camadas de features

### 6.1 Série histórica multibanda — o eixo do método

**Justificativa central.** Uma imagem isolada **não separa** solo recém-gradeado de solo erodido: ambos apresentam alta reflectância e BSI elevado. A série separa, porque os dois fenômenos têm assinatura temporal oposta:

- o **gradeado é transitório** — em 30–45 dias há dossel e o pixel retorna ao padrão fenológico normal;
- a **mancha erodida é persistente** — o horizonte B exposto tem assinatura própria (mais óxidos de ferro, menos matéria orgânica) e a cultura ali cresce com vigor reduzido, safra após safra.

É essa persistência que a série enxerga e a data única não. O uso de séries temporais completas para separar processos persistentes de transitórios é o fundamento do CCDC (Zhu & Woodcock, 2014).

**Bandas e justificativa:**

| Bandas | Papel |
|---|---|
| B11, B12 (SWIR) | mineralogia e umidade — as mais informativas para solo |
| B4, B3, B2 | cor do solo; a razão B4/B2 relaciona-se a óxidos de ferro (hematita/goethita), marcadores de horizonte B |
| B5, B6, B7 (red edge) | estresse da cultura — sinal indireto de perda de solo fértil |
| B8, B8A (NIR) | vigor e estrutura do dossel |

Descartar B1 (aerossol) e B9 (vapor d'água): 60 m e sem informação de solo.

**Dimensionalidade — e por que comprimir é obrigatório.** 10 bandas × 12 meses × 6 anos = **720 features** para ~400 amostras rotuladas. Com p >> n, o modelo ajusta ruído e as importâncias de feature perdem significado. Estratégias:

1. **Regressão harmônica por banda** — ajuste de senoide anual + semianual, guardando offset, amplitude, fase e **tendência linear** (~5 coeficientes/banda → ~50 features). Método consolidado em análise de séries Landsat (Zhu & Woodcock, 2014). *Hipótese técnica: a tendência de longo prazo no SWIR deve ser a feature mais informativa do conjunto, por capturar degradação progressiva do horizonte superficial.*
2. **Estatísticas de distribuição** — percentis 10/50/90, amplitude, desvio.
3. **Frequência de exposição** — nº de observações com NDVI abaixo do limiar, maior sequência contínua de solo descoberto, mês modal de exposição.

**Lacunas — jamais preenchidas com constante.** Ver §1. Manter `NaN` ou interpolar temporalmente de forma declarada.

### 6.2 Composto de solo exposto

Compor usando **apenas as observações em que o pixel estava efetivamente descoberto** (NDVI abaixo do limiar), ao longo de todos os anos disponíveis.

**Justificativa.** O produto é uma reflectância sintética do solo, livre de cobertura vegetal e de ruído fenológico — substancialmente superior a qualquer cena única para caracterização pedológica. Linha consolidada, com desenvolvimento brasileiro relevante: GEOS3 (Demattê et al., 2018) e SCMaP (Rogge et al., 2018).

Ataca diretamente o problema que a inferência por regra tentava resolver, com dado observado em vez de heurística.

### 6.3 Pares de evento — antes e depois da chuva

**A ressalva física.** Solo úmido tem reflectância marcadamente menor em todas as bandas, sobretudo no SWIR (Lobell & Asner, 2002). Umidade é o maior confundidor da análise espectral de solos, e o escurecimento pós-chuva pode encobrir o contraste entre horizonte A e B que se quer medir.

**O que a imagem pós-evento mostra bem:** deposição de sedimento (leques claros em sopé e linhas de drenagem), incisão recente, encrostamento superficial, e turbidez em corpos d'água a jusante — bom proxy indireto de erosão a montante.

**Implicação de desenho — três momentos:**

```
T-   (antes)        cena limpa mais proxima anterior ao evento
T0   (0-2 dias)     Sentinel-1 garantido + Planet se houver janela
                    -> deposicao, incisao, encrostamento
T+   (7-15 dias)    Planet ou Sentinel-2, solo ja seco
                    -> padrao de redistribuicao (erodido claro,
                       deposicional escuro)
```

**Justificativa do T+.** Para erosão laminar, o momento mais informativo pode não ser logo após a chuva, mas após a secagem: a umidade uniformiza a resposta espectral, enquanto o solo seco revela o contraste entre áreas de perda e de deposição.

**Requisito de comparabilidade.** As cenas do par precisam ser radiometricamente comparáveis — mesmo sensor, geometria próxima, estágio fenológico semelhante. Caso contrário, a diferença medida é crescimento da cultura, não efeito da chuva.

**Montagem retrospectiva.** Não se planeja imagear após uma chuva específica; faz-se o inverso sobre o arquivo: (1) listar eventos de alta erosividade via CHIRPS/IMERG; (2) buscar a cena utilizável mais próxima antes e depois; (3) manter pares dentro da janela; (4) **contar quantos pares utilizáveis restam**. O passo 4 decide se este eixo é central ou ilustrativo, e pode ser respondido antes de qualquer compromisso de desenho.

### 6.4 Terreno e a feature de mecanismo

**Terreno (DEM):** declividade (em projeção métrica), curvatura de perfil e plana, acúmulo de fluxo, índice topográfico de umidade, posição na vertente. A curvatura de perfil é incluída por controlar aceleração e desaceleração do escoamento, discriminando zonas de perda e de deposição — mecanismo formalizado no fator LS bidimensional (Moore & Burch, 1986; Desmet & Govers, 1996).

**Feature de mecanismo:**

```
Sigma ( erosividade_t  x  solo_exposto_t )   sobre toda a serie
```

**Justificativa.** É a formalização empírica do mecanismo da erosão hídrica: chuva erosiva incidindo sobre solo descoberto. Estruturalmente análoga ao produto R×C da RUSLE, porém construída a partir de observação em vez de coeficientes tabelados. Se superar a RUSLE clássica no conjunto de validação, é resultado publicável.

### 6.5 O que NÃO entra na matriz

`severity`, `priorityScore`, `estimatedSoilLoss`, `featureType`, `stratumId` e os cinco fatores RUSLE.

**Justificativa:** são funções determinísticas das variáveis brutas — colineares, sem informação adicional, e carregam defeitos identificados na auditoria. Entre eles, a **inversão do Fator C em relação ao BSI**: na formulação C = ((1−NDVI)/2)^(1+BSI), como a base é sempre menor que 1, BSI negativo reduz o expoente e **aumenta** C. Verificado numericamente (NDVI fixo em 0,70): BSI −0,9 → C = 0,83; BSI +0,9 → C = 0,027. Ou seja, mais solo exposto produz menor fator de vulnerabilidade — inverso do significado físico do fator C na RUSLE (Renard et al., 1997).

**Nota:** esta formulação consta do README metodológico do projeto. Corrigi-la exige decisão do pesquisador e do orientador, com as alternativas documentadas na literatura: a forma de Durigon et al. (2014), derivada de NDVI para bacias tropicais, e a forma exponencial de van der Knijff et al. (2000). Como a RUSLE passa a ser linha de base e não produto, o impacto é sobre a comparação — mas uma linha de base incorreta invalida a comparação.

---

## 7. Desenho amostral

### 7.1 Frame de elegibilidade

Mantém-se o atual — ESA WorldCover classes 30/40/60 (Zanaga et al., 2022); declividade 3–20%; exclusão de água com buffer de 30 m; exclusão urbana com buffer de 150 m — **acrescido de**:

> **Cobertura temporal mínima:** número mínimo de observações válidas na série. Justificativa: um ponto com 80% de lacunas produz features harmônicas mal condicionadas, que entram no modelo como ruído com aparência de sinal.

### 7.2 Estratificação

Base atual: 6 estratos (3 classes de declividade × 2 grupos de erodibilidade). **Ampliar** para incluir cobertura/uso e faixa de erosividade, agora que a chuva é variável e não constante.

**Justificativa:** amostragem estratificada garante cobertura do espaço de features, evitando que regiões pouco frequentes do domínio fiquem sem representação — condição para que o modelo seja avaliável fora do modo dominante.

### 7.3 Amostragem por quantis, não Top-N

**Mudança conceitual central.** A implementação anterior entregava os pontos de maior score. Para treino é preciso o oposto: cobrir **toda a faixa** do critério, incluindo deliberadamente os de valor baixo.

**Justificativa:** amostrar apenas o topo produz um conjunto sem variação na variável de interesse — não há classe negativa, e a fronteira de decisão não pode ser estimada. É a diferença entre selecionar alvos de intervenção (onde Top-N é correto) e construir conjunto de treino (onde é fatal).

### 7.4 Classe negativa

Amostrar negativos **do mesmo frame de elegibilidade** dos positivos.

**Justificativa:** se o negativo vier de floresta ou várzea, torna-se trivialmente separável por NDVI, e o modelo aprende a distinguir uso do solo em vez de erosão. O classificador teria acurácia alta e utilidade nula em lavoura, que é o domínio de aplicação.

### 7.5 Bloco espacial

Atribuir bloco espacial a cada ponto, exportado junto.

**Justificativa:** dados geoespaciais violam a hipótese de independência entre amostras. Validação cruzada aleatória coloca vizinhos autocorrelacionados em treino e teste simultaneamente, inflando a estimativa de desempenho — efeito documentado e quantificado por Roberts et al. (2017) e Ploton et al. (2020). O *thinning* de 1 km não elimina a autocorrelação de solo e relevo, que se estende além dessa distância.

---

## 8. Campanha de rotulagem

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

**Justificativa da Fase B.** Sem ela, a interpretação visual é opinião; com ela, é medição com incerteza conhecida. A subamostra de campo transforma o rótulo da Fase A de categórico-subjetivo em categórico-com-taxa-de-erro-estimada, o que permite ponderação ou correção no treino.

**Limitação a declarar.** A interpretação em 3–5 m detecta erosão laminar **já avançada** (subsolo exposto, deposição visível); a incipiente é invisível nessa resolução. O modelo aprenderá o que o rótulo contém. Isso restringe o domínio de validade e **deve ser declarado na dissertação**, não descoberto pela banca.

### 8.1 Seleção das áreas de drone

Com disponibilidade limitada, cada voo precisa render o máximo de informação. Duas exigências:

**Incluir o que o modelo prevê como negativo.** Se as áreas de validação forem apenas onde o modelo prevê erosão, mede-se **precisão** e nunca **recall** — falsos negativos ficam estruturalmente invisíveis. A seleção deve ser estratificada ao longo de toda a faixa de probabilidade predita.

**Rotulagem cega.** Quem interpreta o ortomosaico não pode conhecer a predição do modelo nem qualquer score do ponto. O aplicativo deve exportar a lista de voo **sem as colunas de predição**. Justificativa: viés de confirmação em interpretação visual é bem documentado e, sem cegamento, a validação mede a expectativa do intérprete, não o desempenho do modelo.

**O drone é onde o imageamento por evento funciona de fato:** voa abaixo da base das nuvens, no dia seguinte à chuva, com resolução centimétrica. Vale reservar parte dos voos para pares de evento.

---

## 9. Modelagem

| Decisão | Justificativa |
|---|---|
| **XGBoost** | Desempenho consolidado em dados tabulares heterogêneos; tratamento nativo de ausentes; regularização embutida (Chen & Guestrin, 2016) |
| **Validação cruzada espacial por blocos** | Evita inflação por autocorrelação (Roberts et al., 2017; Ploton et al., 2020) |
| **Separação temporal adicional no Modelo P** | Evita vazamento temporal (§4) |
| **AUC-PR como métrica principal** | Com classe desbalanceada, a curva ROC é otimista; a precisão-recall é mais informativa (Saito & Rehmsmeier, 2015). Reportar a prevalência sempre |
| **Seleção de features aninhada na validação** | Selecionar features fora da CV enviesa a estimativa de desempenho (Cawley & Talbot, 2010) |
| **Linha de base: RUSLE corrigida** | Permite quantificar o ganho do método proposto sobre a prática estabelecida |

---

## 10. O aplicativo — escopo

> Não é um eleitor de focos de erosão. É um **desenhador de amostragem e gerenciador de campanha de rotulagem**, sobre três vias de ingestão.

| Função | Estado |
|---|---|
| Frame de amostragem | existe; acrescentar cobertura temporal mínima |
| Estratificação | existe; ampliar |
| Amostragem por quantis | **mudar** (hoje é Top-N) |
| Série temporal no GEE | **construir** |
| Consulta Embrapa por ponto | **pronta e verificada** (`embrapaSoilClient.ts`) |
| Ingestão Planet (busca, UDM2, pedido com clipping) | **construir** |
| Detecção de eventos (CHIRPS/IMERG) | **construir** |
| Export de campo e de voo, **cego** | parcial |
| Ingestão de rótulo (Kobo, interpretação, drone) | `koboParser` é boa base |
| Matriz de treino com proveniência por variável | **construir** |
| RUSLE como linha de base | existe; requer as correções da auditoria |

### 10.1 Aproveitar do código atual

**Manter:** `eligibilityMask` + `eligibilityConstants`, `stratification`, `spatialThinning`, `aoiTiling`, `koboParser` + `KoboFieldImport`, `spatialMatcher.py` + base fundiária, `sessionStore` / `localOnly` / `isSyntheticPoint`, `xlsxWriter` e a infraestrutura de export, `embrapaSoilClient` (novo).

**Reposicionar ou descartar:** `severity` e `priorityScore` como resultado; defaults de `parsers.ts`; `inferPedologyClass`; perda de solo como produto; bônus CAR no score exportado.

---

## 11. Sequência de execução

```
ETAPA 0   Definicao operacional do rotulo                    BLOQUEANTE

ETAPA 1   Testes de viabilidade (baratos, antes de decidir)
          1a  Primeiro contato com a API do Planet (UDM2 na AOI)
          1b  Pares de evento: quantos realmente existem?

ETAPA 2   Features de verdade
          Embrapa por ponto (pronto) - chuva CHIRPS/IMERG
          Serie historica comprimida - composto de solo exposto
          Declividade em projecao metrica

ETAPA 3   Amostragem para treino
          Quantis - negativos do mesmo frame - blocos espaciais
          Export de campo CEGO

ETAPA 4   Campanha de rotulagem (Fases A e B)

ETAPA 5   Modelagem: Modelo D e Modelo P + linha de base RUSLE

ETAPA 6   Validacao final por drone (Fase D)
```

---

## 12. Pontos para decidir com o orientador

| # | Questão | Impacto |
|---|---|---|
| 1 | Definição operacional de presente / ausente | Determina tudo o que vem depois |
| 2 | Binário ou ordinal | Modelo e ficha de campo |
| 3 | Modelo D, P, ou os dois | Montagem da série e intervalo de guarda |
| 4 | Extensão da série: Sentinel-2 (~2017+) ou incluir Landsat (1984+) | Resolução × profundidade histórica |
| 5 | Unidade de predição: pixel 10 m, 30 m, ou talhão | Features, rótulo e validação |
| 6 | Tratamento das unidades em **associação** pedológica | Amostra × incerteza declarada |
| 7 | Domínio de validade: só 3–20% de declividade e uso agrícola? | Precisa ser declarado |
| 8 | Forma do Fator C na RUSLE (inversão documentada) | Validade da linha de base |
| 9 | Nº de pontos de campo e voos viáveis | Fixa o teto de desempenho |

---

## 13. Referências

*Confira cada item na fonte original antes de citar na dissertação.*

**Erosão e modelagem**
- WISCHMEIER, W. H.; SMITH, D. D. *Predicting rainfall erosion losses: a guide to conservation planning*. USDA, Agriculture Handbook 537, 1978.
- RENARD, K. G. et al. *Predicting soil erosion by water: a guide to conservation planning with the RUSLE*. USDA, Agriculture Handbook 703, 1997.
- DESMET, P. J. J.; GOVERS, G. A GIS procedure for automatically calculating the USLE LS factor on topographically complex landscape units. *Journal of Soil and Water Conservation*, v. 51, n. 5, 1996.
- MOORE, I. D.; BURCH, G. J. Physical basis of the length-slope factor in the Universal Soil Loss Equation. *Soil Science Society of America Journal*, v. 50, 1986.
- BERTONI, J.; LOMBARDI NETO, F. *Conservação do solo*. São Paulo: Ícone.
- LOMBARDI NETO, F.; MOLDENHAUER, W. C. Erosividade da chuva: sua distribuição e relação com perdas de solo em Campinas, SP. *Bragantia*, 1992.
- WALTRICK, P. C. et al. Erosividade de chuvas no Paraná. *Revista Brasileira de Ciência do Solo*, 2015.

**Sensoriamento remoto**
- GORELICK, N. et al. Google Earth Engine: planetary-scale geospatial analysis for everyone. *Remote Sensing of Environment*, v. 202, 2017.
- DRUSCH, M. et al. Sentinel-2: ESA's optical high-resolution mission for GMES operational services. *Remote Sensing of Environment*, v. 120, 2012.
- ROUSE, J. W. et al. Monitoring vegetation systems in the Great Plains with ERTS. NASA, 1974. *(NDVI)*
- RIKIMARU, A.; ROY, P. S.; MIYATAKE, S. Tropical forest cover density mapping. *Tropical Ecology*, v. 43, 2002. *(BSI)*
- VRIELING, A. Satellite remote sensing for water erosion assessment: a review. *Catena*, v. 65, 2006.
- LOBELL, D. B.; ASNER, G. P. Moisture effects on soil reflectance. *Soil Science Society of America Journal*, v. 66, 2002.
- DEMATTÊ, J. A. M. et al. Geospatial Soil Sensing System (GEOS3). *Remote Sensing of Environment*, v. 212, 2018.
- ROGGE, D. et al. Building an exposed soil composite processor (SCMaP). *Remote Sensing of Environment*, 2018.
- ZHU, Z.; WOODCOCK, C. E. Continuous change detection and classification of land cover using all available Landsat data. *Remote Sensing of Environment*, v. 144, 2014.
- CLAVERIE, M. et al. The Harmonized Landsat and Sentinel-2 surface reflectance data set. *Remote Sensing of Environment*, v. 219, 2018.
- ZANAGA, D. et al. ESA WorldCover 10 m 2021 v200. 2022.
- DURIGON, V. L. et al. NDVI time series for monitoring RUSLE cover management factor in a tropical watershed. *International Journal of Remote Sensing*, v. 35, 2014.
- VAN DER KNIJFF, J. M.; JONES, R. J. A.; MONTANARELLA, L. *Soil erosion risk assessment in Europe*. European Soil Bureau, 2000.
- FUNK, C. et al. The climate hazards infrared precipitation with stations. *Scientific Data*, v. 2, 2015. *(CHIRPS)*
- HUFFMAN, G. J. et al. *Integrated Multi-satellitE Retrievals for GPM (IMERG)* — Algorithm Theoretical Basis Document. NASA.

**Solos**
- SANTOS, H. G. et al. *Sistema Brasileiro de Classificação de Solos*. 5. ed. Brasília: Embrapa, 2018.

**Aprendizado de máquina e validação**
- CHEN, T.; GUESTRIN, C. XGBoost: a scalable tree boosting system. *Proc. 22nd ACM SIGKDD*, 2016.
- KAUFMAN, S. et al. Leakage in data mining: formulation, detection, and avoidance. *ACM TKDD*, v. 6, 2012.
- ROBERTS, D. R. et al. Cross-validation strategies for data with temporal, spatial, hierarchical, or phylogenetic structure. *Ecography*, v. 40, 2017.
- PLOTON, P. et al. Spatial validation reveals poor predictive performance of large-scale ecological mapping models. *Nature Communications*, v. 11, 2020.
- CAWLEY, G. C.; TALBOT, N. L. C. On over-fitting in model selection and subsequent selection bias in performance evaluation. *JMLR*, v. 11, 2010.
- SAITO, T.; REHMSMEIER, M. The precision-recall plot is more informative than the ROC plot when evaluating binary classifiers on imbalanced datasets. *PLoS ONE*, v. 10, 2015.
- COHEN, J. A coefficient of agreement for nominal scales. *Educational and Psychological Measurement*, v. 20, 1960.
- LANDIS, J. R.; KOCH, G. G. The measurement of observer agreement for categorical data. *Biometrics*, v. 33, 1977.

---

*Documento v3, derivado da auditoria de 08/09/2026 e das verificações executadas na mesma data. As consultas ao serviço da Embrapa foram realizadas e conferidas; as demais fontes externas requerem confirmação de cobertura e condições de uso antes da incorporação definitiva.*
