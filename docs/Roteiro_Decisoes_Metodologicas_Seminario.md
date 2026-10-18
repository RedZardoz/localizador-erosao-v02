# Roteiro de consulta: decisões metodológicas do SAREL v2

**Para uso durante o seminário "Arcabouço computacional auditável para amostragem estratificada de erosão laminar".**

Fonte: `src/config/decisoes.ts` (branch do executor, após a Fase 5B). Onde o texto original de uma decisão diverge de uma emenda posterior, **vale a emenda** (ver a seção "Cuidados" no fim).
Siglas: **D** = decisão registrada; **P** = parâmetro; **pi_i** = probabilidade de inclusão da unidade sorteada.

---

## 1. Cola de 1 página (o que memorizar)

| Tema | Em uma frase |
|---|---|
| Unidade | Célula de 10 × 10 m do Sentinel-2, sem reamostragem (D06) |
| Alvo | Fração da célula que está erodida, de 0 a 1; binário derivado em ≥ 0,25 (D26) |
| Rótulo | Delineação humana sobre ortomosaico de VANT, cega ao modelo; nada calculado vira rótulo (D02, D16) |
| Desenho | 72 polígonos de 5,02 ha, 4 por estrato, em 18 estratos; 36 de treino e 36 de held-out (D12, D16) |
| Estratos | 3 tercis de declividade × 3 tercis de frequência de solo nu × 2 níveis de erodibilidade = 18 (D12) |
| Sorteio | Estratificado desproporcional, pi_i registrada; selo irreversível (D23) |
| Linha de base | RUSLE: A = R · K · LS · C · P; fator ausente deixa A ausente, nunca zero (D01 a D15) |
| Modelo | XGBoost com perda Tweedie, contra RUSLE e regressão penalizada (D24, D26) |
| Teste | Spearman no held-out; piso 0,40; margem 0,10 sobre a RUSLE; bootstrap por polígono; uma única avaliação (D25) |
| Honestidade | Ainda não há resultado empírico |

---

## 2. Mapa: slide → decisões

| Slide | Tema | Decisões |
|---|---|---|
| 2 | O que evitar | D02, D26, D25 |
| 3 | Fluxo | D07, D12, D16, D23 |
| 4 | Desenho amostral | D12, D16, D23, P02 |
| 5 | Unidade e alvo | D06, D26, D03 |
| 6 | RUSLE | D01, D13, D14, D15, D20, D22 |
| 7 | Proveniência | D13, D14, D21 |
| 8 | Auditabilidade | D16, D24 |
| 9 | Avaliação | D24, D25, D26 |

---

## 3. As decisões, explicadas

### 3.1 Onde e como a amostra é escolhida

**D07: domínio de validade.** O método só vale onde: declividade de 3% a 20%; uso e cobertura do ESA WorldCover nas classes 30 (pastagem) e 40 (lavoura); e as duas épocas do produto concordam. A classe 60 (solo exposto) foi excluída, porque uma das dimensões da estratificação é a própria frequência de solo nu, e admitir solo já exposto tornaria o critério circular. Abaixo de 3% o escoamento raramente tem competência para desagregar o solo de forma laminar; acima de 20% o processo passa a ser dominado por sulcos e voçorocas. *Fora do domínio, nenhuma predição é declarada válida e nenhuma métrica é reportada.*

**D12: 18 estratos.** Matriz fatorial 3 × 3 × 2: tercis de declividade (energia do relevo), tercis de frequência de solo nu (tempo de solo descoberto) e 2 níveis de erodibilidade K̂ (suscetibilidade do solo). São as três dimensões que governam a erosão laminar de forma separável e mensurável por sensoriamento remoto antes de qualquer visita. A frequência de solo nu é a fração de cenas válidas em que a célula aparece com solo exposto, **não** a orientação da vertente.

**D09: níveis de K̂.** Nível 1 = classes 1 a 3 da escala da Embrapa Solos (K ≤ 0,0285); nível 2 = classes 4 e 5 (K ≥ 0,0300). A citação de Mannigel et al. (2002) está suspensa até conferência (emenda de 06/10/2026); a sustentação é o Documentos 246 (Embrapa, 2024).

**D23: regime amostral.** Estratificação desproporcional com pi_i = n_h / N_h registrada para cada unidade sorteada. Substitui o balanceamento 50/50, que era arbitrário e nunca foi implementado. Por registrar pi_i, permite dois usos: treinar em amostra desproporcional e estimar a prevalência real pelo estimador de Horvitz-Thompson. Há também uma âncora de prevalência: 60 a 80 pontos de campo fora dos polígonos, em duas ondas (os 30 primeiros são lote piloto).

**P02: thinning.** Espaçamento geodésico mínimo de 1.000 m entre pontos candidatos, como piso inviolável.

**D21: modelo digital de elevação.** Copernicus DEM GLO-30 na resolução nativa de 30 m, em SIRGAS 2000 / UTM 22S. É proibido reamostrar para grade mais fina: área de contribuição e LS dependem da escala, e reamostrar geraria valores novos sem informação nova, sob selo "medido". Não existe MDE gratuito melhor que 30 m para a Bacia do Paraná 3.

### 3.2 Unidade, alvo e rótulo

**D06: unidade de predição.** A célula de 10 × 10 m do Sentinel-2, na grade nativa do produto L2A. Todo rótulo, preditor e métrica é definido nessa célula. Cada preditor **declara o suporte espacial da sua fonte**: por exemplo, o LS vem de 30 m e é atribuído às células de 10 m contidas nele. Ou seja, a unidade é de 10 m, mas isso não afirma que tudo foi medido a 10 m.

**D26: alvo.** Fração contínua da célula delineada como erodida, de 0 a 1, obtida por rasterização da delineação feita sobre o ortomosaico (a ~4 cm de GSD, uma célula de 10 m contém cerca de 62.500 micropixels). A maioria das células é zero, por isso o ajuste usa objetivo para variável contínua com excesso de zeros: `reg:tweedie`. O binário (fração ≥ 25%, isto é, 25 m² erodidos em 100 m²) é **secundário** e serve para: compatibilidade com os rótulos ordinais de campo, AUC comparável à literatura e o critério de D25. Argumento de fundo: dicotomizar uma variável contínua descarta informação (Altman e Royston, 2006).

**D03: escala dos rótulos de campo.** Coleta ordinal em 4 níveis (ausente, incipiente, moderada, severa). Binarização explícita com corte entre "ausente" e "incipiente": **incipiente conta como positivo**. Razão: a finalidade do método é localizar e predizer, e detectar só erosão moderada ou severa tem baixo valor prático, porque o dano já está consolidado. D03 continua valendo para rótulos de campo e fotointerpretação; D26 rege o alvo do modelo treinado por VANT.

**D02: critérios de triagem.** Classe 1 (erosão): BSI > 0,10 e NDVI < 0,40. Classe 0 (controle/SPD): BSI < 0,00 e NDVI > 0,65. Pela emenda de 06/10/2026, são **critério de triagem de candidatos e ajuda visual, não rótulo** (Regra 4: nada calculado vira rótulo). Como os polígonos são sorteados pelos estratos e nunca pelo rastreio espectral, esses limiares não têm papel na seleção.

**D16: campanha de VANT e campo.** O VANT é a massa de treino **e** o teste independente; o campo é âncora de prevalência e confirmação prospectiva. Geometria (emendada em 29/09/2026): 72 polígonos de 5,02 ha, 4 por estrato nos 18 estratos de D12, sorteados probabilisticamente com pi_i registrada, **nunca escolhidos por suspeita de erosão**. Forma: quadrado de cerca de 224 × 224 m. A inversão de papéis (o VANT antes era só held-out) decorre de medições feitas nas missões de voo já executadas, registradas em `docs/verificacoes/voo/cobertura_voos.geojson`.

**D19: pares de evento.** Reescrita para o desenho por polígonos: a unidade do pareamento é o polígono, não o ponto. Análise secundária, fora do critério de D25.

### 3.3 Linha de base física (RUSLE)

A = R · K · LS · C · P. Se qualquer fator faltar, A é ausente.

**D13: fator R.** Equação regional do Paraná (Rufino et al., 1993, região 1) sobre totais de chuva do CHIRPS, com R **climatológico** (média de longo prazo) e proveniência **"modelado"**, nunca "medido", porque a equação é calibrada com pluviógrafo e aqui é aplicada a estimativa de satélite. Emenda: o fator de unidade 9,81 (conversão para o SI) está documentado em Waltrick (2010) e reproduz o Quadro 1 de 12 estações do IAT a ±0,004%. A tolerância do R por CHIRPS foi fixada em ±10%.

**D14: fator K.** Valor numérico `k_solos` da camada oficial da Embrapa (`bra_erodibilidade_2024_sirgas2000`), com selo "tabelado" (Tabela 5 do Documentos 246). A faixa de classe só entra como alternativa. A versão anterior convertia a classe ordinal numa faixa e perdia a diferença entre unidades de mesma classe.

**D08: unidades em associação.** A ambiguidade de K é determinada na fonte oficial, sem heurística taxonômica; D08 passou a reger só o **marcador de qualidade** da composição pedológica. Foi emendada depois de uma amostra dirigida de 32 pontos.

**D15: fator LS.** Desmet e Govers (1996), algoritmo bidimensional de área de contribuição específica, sobre o GLO-30 a 30 m, **sem reamostrar para 10 m**. Mede e registra a distorção linear de escala da projeção. Por ter suporte de 30 m, o bloco de terreno tem poucas unidades efetivas por polígono (relevante em D24).

**D01 e D20: fator C.** D01: C = (1 − NDVI) / 2 (Durigon et al., 2014), sem parâmetros livres. D20: forma híbrida para plantio direto, C = ((1 − NDVI)/2) · (1 + BSI), com C em [0, 1]; fora disso, indisponível por "fora do domínio". Sem BSI válido, volta à forma pura de D01. O texto da decisão exige selo explícito de que a forma híbrida não é a pura.

**D22: fator P.** Nos pontos com visita de campo, deixa de ser a constante 1,0 e passa a ser derivado do sentido de plantio, da presença de terraço e da declividade. **Os coeficientes da tabela são provisórios** (ver "Cuidados").

**D10: solo descoberto.** NDVI ≤ 0,25 (com BSI > 0,10 quando aplicável), calibrado no sistema GEOS3 (ESALQ-USP) para solos brasileiros. É distinto do limiar de triagem de D02 (NDVI < 0,40): um define solo descoberto, o outro é critério de triagem de candidatos.

### 3.4 Dados e sensores

**D05: série de treino.** Exclusivamente Sentinel-2 MSI L2A, 2016 a 2026. Nenhuma refletância Landsat entra na matriz, em nenhuma forma. O Landsat só serve como camada independente de tendência histórica a 30 m. A razão decisiva é de suporte espacial (um pixel de 30 m cobre 900 m², contra 100 m² da célula), não de preferência por sensor.

**D04: Modelo D e Modelo P.** D detecta feições ativas no instante t0; P prediz risco prospectivo, com **intervalo de guarda de 24 meses** encerrado antes da data do evento, para eliminar vazamento temporal (Kaufman et al., 2012).

**D11: cobertura temporal mínima.** No mínimo 6 observações válidas (sem nuvem ou sombra) por ponto e janela.

**D17 e D18: PlanetScope.** D17: a cota de 3.000 km² vale para todo o período do plano, e a rotulagem por fotointerpretação usa só a cota de tiles. D18: recorte de 250 m de raio (500 m de lado, 25 ha) por ponto.

**P03: casamento de campo com o ponto planejado.** Três critérios independentes no lugar do limiar único anterior, incluindo um teto de erro grosseiro de 30 m (acima disso o registro é rejeitado). **P05:** classes de uso [30, 40]. **P07:** semente aleatória registrada a cada execução.

### 3.5 Regime de dados e avaliação

**D24: regime de dados do XGBoost.** O desenho por polígonos não aumentou a quantidade de dados de forma uniforme: aumentou-a de forma **assimétrica por bloco de preditor**, porque cada bloco varia numa escala espacial diferente. Por isso o **teto de preditores é por bloco**, não global (regra de ordem de 200 eventos por variável, de van der Ploeg et al., 2014). Pela emenda, o held-out tem cerca de 920 unidades efetivas (não 936) e o total de 72 polígonos cerca de 1.841. A declaração a priori usa 5 preditores espectro-temporais, 3 de terreno, 1 de solo e 1 de chuva (total 10). O expoente de Tweedie é escolhido só por validação interna agrupada, na grade {1,2; 1,5; 1,8}.

**D25: critério de refutação pré-registrado, fixado antes de qualquer ajuste.**
- **Conjunto:** só os 36 polígonos de held-out; **uma única avaliação**, sem reuso do held-out para qualquer escolha.
- **Métrica primária:** correlação de Spearman entre o previsto e a fração observada, calculada de forma emparelhada sobre as mesmas células para os três competidores (RUSLE, regressão penalizada, XGBoost).
- **Piso e margem:** ρ ≥ 0,40 e ρ_XGBoost − ρ_RUSLE ≥ 0,10.
- **Inferência:** IC de 95% da diferença emparelhada por bootstrap **cuja unidade é o polígono**, nunca a célula (células vizinhas não são independentes: pseudorreplicação). Por isso a potência é governada pelos agrupamentos (36), e o IC é largo.
- **Desfechos:** corroborada (atinge piso e margem e o IC exclui zero); inconclusiva (margem na estimativa pontual, mas o IC contém zero: não se reporta superioridade e é **vedado reclassificar**); refutada (abaixo do piso ou abaixo da RUSLE). Emenda: desfecho adicional **INCONCLUSIVA_MARGEM** (atinge o piso e é ≥ RUSLE, mas a diferença é < 0,10).
- **Quarto desfecho:** se a regressão penalizada empata ou vence o XGBoost dentro do IC, a hipótese sobre ensembles de árvores (não linearidade e interação são necessárias) fica refutada.
- **Secundárias:** AUC ≥ 0,70 e ΔAUC ≥ 0,05, só reportadas (não condicionam o desfecho; a AUC depende só da ordenação).

---

## 4. Cuidados e honestidade: o que não afirmar

1. **Não há resultado empírico.** Dado coletado: nenhum. O sorteio dos 72 polígonos ainda não foi realizado e depende de decisões suas pendentes.
2. **D22, coeficientes do fator P provisórios.** O próprio registro diz que a tabela veio de uma saída de modelo de IA, atribuída a "Bertoni e Lombardi Neto / Wischmeier e Smith adaptados", e **ainda não foi conferida contra a fonte primária**. Se perguntarem do P, diga isso.
3. **Cifra de ~78% de acerto de atribuição** (rótulo à célula): está **em verificação** e não deve ser citada. O deck de 06/10 diz que a cifra de 78% para CE90 = 1,47 m não se reproduz (com σ = 0,69 m o acerto seria ≈ 89%).
4. **Textos antigos com números superados.** Em D19, D23, D24 e D25 ainda aparecem "36 polígonos de 10 ha", "18 agrupamentos", "1.836" e "936". Isso é o texto original antes da emenda de geometria. **Vale: 72 polígonos de 5,02 ha, 36 de held-out, ≈ 920 unidades efetivas de held-out.** Se a banca vir um número diferente nos anexos, essa é a explicação.
5. **Fator R sem reprodução em Medianeira** (não há fonte). A razão CHIRPS/Waltrick ficou entre 0,91 e 1,00 nos 5 locais comparados.
6. **Parâmetros ainda propostos ou pendentes:** P01 (aresta do bloco espacial), P04 (buffers de exclusão), P06 (fração limpa mínima UDM2: pendente), P08 a P11 e P20 a P24 (tolerâncias, cobertura mínima, mínimo de anos da série de R).
7. **Citações a conferir:** Mannigel et al. (2002) está suspensa; nas decisões a Waltrick et al. (2015) constava "não conferida contra a fonte primária" antes da emenda de D13.

---

## 5. Perguntas prováveis e respostas curtas

**Por que 72 polígonos?** São 4 por estrato nos 18 estratos de D12, dimensionados pela capacidade da campanha de voo e pelo regime de dados de D24. A potência do teste é limitada pelo número de polígonos (36 de held-out), e isso é declarado: o desfecho é ternário justamente por causa disso.

**Por que Spearman e não AUC ou R²?** O alvo é contínuo (D26) e a RUSLE também prediz quantidade contínua. Spearman independe da prevalência e permite comparar os competidores sobre as mesmas células. A AUC é só reportada.

**Por que o polígono é a unidade do bootstrap?** Células do mesmo polígono são autocorrelacionadas. Reamostrar células trataria vizinhas como independentes e daria um IC estreito demais.

**O que impede o ajuste do critério depois de ver os resultados?** Piso, margem e métrica estão fixados em D25 antes de qualquer ajuste; o script grava uma trava e recusa uma segunda avaliação; o desfecho inconclusivo não pode ser reclassificado.

**Por que incipiente conta como positivo?** A finalidade é localização e predição; esperar a erosão moderada ou severa tem baixo valor prático (D03).

**Por que não usar Landsat na matriz?** Suporte espacial: 30 m contra a célula de 10 m (D05). Fica só como camada de tendência fora da matriz.

**Por que tolerância de ±10% para o R do CHIRPS?** Foi fixada pelo pesquisador (D13). Os 5 locais comparados ficaram entre 0,91 e 1,00 de razão. É tolerância de uso, não prova de equivalência.

**O app usa dado sintético?** Não: sem dado real, o app recusa gerar pontos e a matriz fica vazia. Os planos de voo de demonstração são marcados como sintéticos e não voáveis.

**Há resultado?** Não. O trabalho apresenta o método pré-registrado e o software que o sustenta.

---

## 6. Glossário rápido

- **Held-out:** polígonos reservados para o teste final; nunca entram no ajuste.
- **Spearman (ρ):** correlação de postos; depende só da ordenação.
- **Bootstrap por polígono:** reamostragem dos polígonos (não das células) para obter o intervalo de confiança.
- **pi_i:** probabilidade de inclusão da unidade i no sorteio; permite estimar a prevalência real por Horvitz-Thompson.
- **Tweedie:** família de distribuições usada como objetivo do XGBoost para variável contínua não negativa com muitos zeros.
- **GSD:** tamanho do pixel no terreno (a ~4 cm no ortomosaico de VANT).
- **CE90:** erro circular com 90% de confiança (acurácia posicional).
- **Proveniência (selos):** medido, modelado, tabelado ou indisponível (com causa).
- **Regra 4:** nada calculado vira rótulo; o rótulo vem de observação humana.
