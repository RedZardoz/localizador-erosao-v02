# SAREL: base de conhecimento para o assistente de perguntas da audiência

Estado do material: 19 de outubro de 2026. Fonte: registro de decisões do projeto (`DECISOES.md`, gerado em 16/10/2026), verificações em `docs/verificacoes/` e conversas de revisão do projeto. Apresentação: "Arcabouço computacional auditável para amostragem estratificada de erosão laminar".

## 0. Instruções ao assistente de IA

Você auxilia o apresentador a responder perguntas da audiência sobre o projeto SAREL. Siga estas regras.

1. Responda somente com o que está neste documento. Se a informação não está aqui, diga: "isso não consta do material; o apresentador pode responder". Não invente números, nomes, datas nem referências.
2. Distinga sempre três estados: **decidido** (registrado como decisão do pesquisador), **proposta** (sugerida, sem valor decidido) e **pendente** (falta decisão ou dado). Nunca apresente proposta ou pendência como decidida.
3. O projeto não tem resultado empírico. O sorteio de polígonos ainda não foi realizado. Se perguntarem por acurácia, desempenho ou mapa de resultados, responda que ainda não existem.
4. Cite o identificador da decisão quando existir (por exemplo, D12, D16, D25).
5. Seja breve e direto: de 2 a 5 frases por resposta. Se houver ressalva importante, inclua-a (seção 13).
6. Quando a pergunta tocar um ponto marcado em "Limites e pontos frágeis" (seção 13), diga a ressalva em vez de defender o ponto.
7. Responda em português do Brasil.

## 1. Identificação

- Título: Arcabouço computacional auditável para amostragem estratificada de erosão laminar.
- Autores: Luis Alfredo Ferreira da Silva; Fabiana Costa de Araujo Schutz; Kiria Vitoria Nakahati. Orientador: Claudio Leones Bazzi.
- Programa: Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA), Universidade Tecnológica Federal do Paraná (UTFPR), Campus Medianeira.
- Sistema: SAREL (Sistema Automatizado de Reconhecimento de Risco de Erosão Laminar), versão 2.
- Área de estudo: Bacia Hidrográfica do Paraná 3 (BP3), oeste do Paraná.

## 2. O problema e a pergunta

A erosão laminar é uma mancha contínua na vertente, não uma ocorrência pontual. Para treinar e avaliar modelos com sensoriamento remoto é preciso uma amostra com rótulo confiável, e o rótulo só vale se vier de observação humana sobre imagem de alta resolução (VANT). Três restrições moldam o desenho:

1. Um ponto de campo representa mal um fenômeno contínuo (D16).
2. O que é calculado, como índice espectral, nunca vira rótulo. BSI e NDVI geram apenas candidatos para triagem.
3. O acesso depende de proprietários de áreas pequenas: a mediana dos imóveis rurais da bacia é de 11,7 ha.

Pergunta do trabalho: como obter uma amostra defensável sob essas restrições e registrar cada passo de forma que um terceiro possa auditar. O SAREL é o arcabouço computacional que faz isso. Nesta apresentação ele é mostrado como **selecionador amostral auditável**, não como modelo de previsão.

## 3. O aplicativo

Módulos, na ordem de uso, no topo da tela inicial: Amostragem GEE (Google Earth Engine), Campanha e Rótulos, Matriz de Treino, Exportar, mais Configurações e Governança. À esquerda ficam as áreas de amostragem; no mapa, a legenda declara que BSI e NDVI geram só candidatos espectrais.

Fluxo de uso em sete etapas: (1) área e conexão (chaves do GEE, seletor de área); (2) candidatos (amostragem no GEE); (3) estratos e sorteio selado; (4) campanha (voo e autorização); (5) campo (aplicativo SAREL Coletor, Android); (6) matriz de treino; (7) pacote de exportação com verificador de integridade.

Princípios de projeto, aplicados no código:

- **Proveniência de cada valor.** Todo valor traz um selo: medido, modelado, tabelado ou indisponível. Valor ausente nunca vira zero ("ausente não é zero"). Decisão pendente gera estado indisponível com a causa "decisão-pendente" e o identificador (Regra 9).
- **Nada sintético como dado real.** Sem conexão ativa ao GEE o aplicativo recusa gerar pontos; dados de demonstração são marcados como sintéticos e recusados onde um dado real é exigido.
- **Nada na tela sem fonte.** O que aparece deve ter fonte ou ser declarado indisponível.
- **Cegamento.** O intérprete recebe um código opaco, sem estrato nem papel do polígono; a exportação é cega por perfil.
- **Exportação com invariantes.** Sete invariantes bloqueiam a exportação se violados. O pacote traz manifesto com SHA-256 e verificador. O manifesto prova integridade, não autoria.
- **Governança.** O registro de decisões (26 decisões e parâmetros) tem dono, referência e estado; só o pesquisador pode marcar uma decisão como decidida.

## 4. Metodologia: a sequência de dez passos e por que nessa ordem

| Passo | O que se faz | Por que vem aqui |
|---|---|---|
| 1. Definir o domínio | Só se amostra onde o método vale: declividade de 3 a 20%, lavoura e pastagem (D07) | Sem domínio não existe candidato válido |
| 2. Eleger candidatos no GEE | Filtros de solo nu, declividade e espaçamento mínimo de 1 km (P02) | Produz o universo de onde se sorteia |
| 3. Estratificar em 18 estratos | Declividade × solo nu × erodibilidade (D12) | Define o que o sorteio precisa cobrir |
| 4. Checar o pool por estrato | Contar candidatos por estrato antes de selar | O sorteio é irreversível: só se sela com pool que comporte 4 titulares |
| 5. Sorteio selado (72 polígonos) | 4 por estrato, probabilidade de inclusão registrada (D23) | Vem antes de contar os proprietários, para que ninguém escolha os locais |
| 6. Autorização dos proprietários | Contato e protocolo de recusa (proposta, não decidido) | Só se sabe quem contatar depois do selo |
| 7. Voo cego e delineação | O intérprete vê só um código opaco; rótulo por fração (D26) | Só depois da autorização; a cegueira evita que o modelo aprenda o rastreio |
| 8. Âncora de campo | 60 a 80 pontos fora dos polígonos, no SAREL Coletor (D16, D23) | Estima prevalência e acurácia posicional, independente dos polígonos |
| 9. Matriz com proveniência | Sete invariantes bloqueiam a exportação | Só com rótulos consolidados; garante origem declarada |
| 10. Avaliação única | Critério fixado antes dos dados, conjunto de teste usado uma vez (D25) | Por último e uma só vez |

Cada passo depende do anterior. O sorteio selado e a avaliação única são os dois pontos sem volta.

## 5. Estratificação em 18 estratos (D12)

Estratos = 3 (declividade) × 3 (solo nu) × 2 (erodibilidade) = 18. Em cada estrato, 4 polígonos: 2 para treino e 2 para teste (held-out), total 72.

- **Declividade (Ŝ):** 3 tercis, em porcentagem, calculada em EPSG:31982 a partir do Copernicus DEM GLO-30 a 30 m (D21). Representa a energia do relevo.
- **Solo nu (Ê):** 3 tercis da frequência de solo nu no intervalo [0, 1], isto é, a fração de cenas Sentinel-2 válidas da série em que a célula aparece com solo exposto (limiar NDVI ≤ 0,25, combinado com BSI > 0,10 quando aplicável, D10). Não é orientação de vertente. **Ainda não foi medida**, por falta da credencial do GEE.
- **Erodibilidade (K̂):** 2 níveis, pela carta de erodibilidade dos solos do Brasil (Coelho et al., 2024, Embrapa Solos, Documentos 246), atribuindo ao ponto a unidade da carta que o contém (D12, D14, D09).

**Tercis.** Os dois cortes são calculados sobre os candidatos da própria área: ordenam-se os valores e usam-se as posições ⌈n/3⌉ e ⌈2n/3⌉. Valor ≤ primeiro corte vai ao tercil 1; ≤ segundo, ao 2; o resto, ao 3. Valores empatados no corte caem no grupo mais baixo, então os grupos podem diferir um pouco em tamanho. A regra definitiva para empates é decisão do pesquisador ainda pendente (DP-6). Valores não finitos são excluídos do cálculo e contados.

**Níveis de erodibilidade.** A carta tem 6 classes: muito baixa, baixa, média, alta, muito alta, extremamente alta.

- Nível 1: classes muito baixa, baixa e média (classes 1 a 3), K ≤ 0,0285.
- Nível 2: classes alta e muito alta (4 e 5), K ≥ 0,0300.
- Entre 0,0285 e 0,0300 não há enquadramento: o nível fica indisponível (causa "insuficiente"), nunca nível 1 ou 2 por aproximação.
- Categorias não pedológicas (área urbana, corpo d'água, K = 0) retiram o ponto do domínio.
- **Classe 6 (extremamente alta).** O Documentos 246 a inclui, com K de 0,0600 a 0,1100, valores que a própria fonte chama de semiquantitativos e sem valor central. O texto vigente da D09 enumerava o domínio como [1..5]. O pesquisador aprovou, em 19/10/2026, uma emenda (D09 e D14) que a inclui no nível 2: o critério numérico K ≥ 0,0300 já a abrange e a fonte não a exclui do uso agrícola. A emenda está **aprovada e em registro**: será gravada no sistema quando o executor concluir a fase correspondente. Com K numérico publicado pela camada (`k_solos`), o K do ponto vem desse número; se só houver a classe, o K do ponto fica indisponível ("sem valor pontual"), nunca o ponto médio da faixa.
- **Alternativa considerada e não adotada:** excluir a classe 6 do domínio sob a hipótese de que solos extremamente erodíveis não apresentam erosão laminar. Rejeitada: K alto indica maior suscetibilidade, não ausência de erosão laminar; a fonte não exclui a classe; a faixa de declividade de 3 a 20% já retira o relevo em que sulcos e voçorocas dominam. A preocupação residual (sulcos contaminando o rótulo) é questão da regra de delineação (D26), a verificar.
- **Proposta recusada em 29/09:** mover "Média" para o nível 2 foi recusada. "Não se move um limiar físico para resolver um problema amostral."
- **Unidades em associação (D08):** a ambiguidade de K é determinada na fonte oficial, sem heurística. Células da mesma unidade da carta estadual podem cair em níveis diferentes de K̂ porque a carta de erodibilidade tem unidades próprias. Medido em 28/09 sobre 32 pontos: 2 de 8 unidades de associação da bacia receberam níveis diferentes em pontos distintos.

**Série temporal.** Entra na frequência de solo nu (eixo dos estratos), nas métricas de série (persistência, maior sequência de solo nu, composto espectral) que alimentam os preditores do modelo, e na regra de qualidade (mínimo de 6 observações válidas por célula e janela, D11; abaixo disso a métrica é indisponível, não deflacionada). A série de treino é exclusivamente Sentinel-2 L2A de 2016 a 2026 (D05); Landsat só como camada independente de tendência a 30 m, nunca como preditor. As métricas usam fração de cenas válidas, não contagem absoluta, porque o Sentinel-2B só opera desde 2017 e o início da série é mais esparso.

## 6. O sorteio selado (D23)

- Amostragem estratificada desproporcional com a probabilidade de inclusão π_i registrada por unidade sorteada (permite estimadores ponderados, como Horvitz-Thompson).
- O selo registra: semente do sorteio, commit do código, SHA-256 do conjunto de candidatos, hash de integridade do resultado e a tabela reversa de códigos opacos (guardada fora do repositório).
- É **irreversível e idempotente**: se já existe um selo, recusa criar outro. Isso impede escolher o sorteio que favoreça o resultado.
- Antes de selar, uma checagem do pool por estrato verifica se cada estrato comporta 4 titulares (ferramenta pronta, somente leitura).
- **Recusa de proprietário e reservas (proposta, não decidido).** A proposta é o mesmo selo trazer, por estrato, os titulares e reservas ordenadas; a recusa aciona a próxima reserva do mesmo estrato, que herda o papel (treino ou teste), com registro append-only de data e motivo. Número de reservas, número mínimo de titulares por estrato e taxa de recusa esperada estão em aberto (P25, P26, P27, propostas sem valor).
- **Nenhum selo de sorteio foi criado até hoje.** Decisões que ainda bloqueiam o sorteio: frequência de solo nu (DP-3), declividade (DP-4), empates dos tercis (DP-6), pesos do estimador e distância mínima (DP-7), cifras divergentes do held-out (DP-16), entre outras.

## 7. Dificuldades de obter e coordenar as amostras

### 7.1 O polígono precisa caber em um único imóvel (D16)

Para voar é preciso autorização do proprietário, então o polígono deve caber dentro de um só imóvel. Medição de 29/09/2026 sobre os 73.643 imóveis rurais do envelope da bacia (banco fundiário local): um quadrado de 10 ha cabia em 43,4%; um quadrado de 5,02 ha, em 64,7%; um retângulo de mesma área com razão até 1:2, em 71,8%. São **limites superiores**, porque o teste usa a caixa envolvente do imóvel. A fração excluída cai de 57% para 28%. O custo foi dobrar as autorizações, de 36 para 72. Viés declarado, que a emenda reduz mas não elimina: a amostra tende a cair em imóveis maiores, que podem ter outro manejo.

### 7.2 Pool de candidatos por estrato

Duas medições existem; a posterior substitui a anterior.

- **29/09:** 5 de 90 candidatos no nível 2 de erodibilidade dentro de 3 a 20% de declividade (extrapolação de cerca de 33 sobre 593 imóveis do divisor). Houve erro de ordem de operações (o corte de 90 foi feito antes do filtro de declividade). **Superada.**
- **30/09 (retificada em 01/10):** funil: 8.651 imóveis no envelope; 4.679 no divisor hidrográfico e fora de unidades de conservação de proteção integral; 687 após o espaçamento determinístico; 680 no domínio de declividade; 677 com pedologia validada. Desses, 593 no nível 1 e 84 no nível 2 (12,4%), contra 36 necessários (4 por estrato × 9 estratos do nível 2). Por tercil de declividade, no nível 2: S1 = 9, S2 = 14, S3 = 61 (limiares 5,12% e 8,46%). **A frequência de solo nu não foi medida** (credencial do GEE ausente); portanto não se sabe se cada um dos 9 estratos do nível 2 comporta 4 titulares. O estrato de menor declividade com nível 2 é o mais magro.
- Não se sabe quantos dos 84 são de classe 6; a contagem por classe está pedida como registro.
- Respostas legítimas se algum estrato ficar curto: ampliar a área de estudo, usar reservas ordenadas, ou declarar a limitação de potência naquele estrato. Não se move limiar físico para acomodar a amostra.

### 7.3 Logística de voo

- Aeronave: Spectral 2 (Nuvem UAV) com câmera multiespectral MicaSense Altum; 3 baterias disponíveis. (O documento de ingestão de 23/09 descreve 5 bandas; os metadados das missões voadas e os planos de voo mostram o Altum, com 7 bandas. Os números do tempo de voo vêm do Altum.)
- Quantidade: 72 missões de mapeamento (uma por polígono); eram 36. Cerca de 12 jornadas com o teto padrão de 6 polígonos por jornada (parâmetro ajustável do planejador; proposta, não validada em campo). Seis polígonos por jornada com 3 baterias dá 2 polígonos por bateria.
- Tempo: plano para GSD de 4 cm: altitude 92,8 m, pegada 82,6 × 61,8 m, espaçamento de faixa 33,0 m, disparo a cada 12,4 m, cerca de 7 linhas e 123 disparos por polígono de 224 m; velocidade medida nos logs reais de 8,7 a 9,2 m/s (o plano traz 15 m/s). Dá cerca de 3 min de mapeamento por polígono, mais curvas; pelo menos 3,6 h nos 72, sem decolagem, pouso, troca de bateria e deslocamento, que dominam a campanha.
- Missões já voadas: Missão 000 (12,2 ha de dados válidos, 13,0 min de voo, 0,53 ha/min de produtividade) e Missão 009 (30,01 ha, 9,3 min, 2,32 ha/min); a Missão 002 foi excluída por ortomosaico degenerado. A produtividade medida varia muito, então o tempo real pode passar do planejado.
- **Autonomia útil por bateria: não registrada.** O número de decolagens por jornada não está fechado.
- 72 autorizações de proprietário a obter. Os polígonos não podem ser escolhidos por conveniência de acesso: o sorteio é anterior ao contato.

### 7.4 Por que 72 polígonos (e não outro número)

É a estrutura do desenho: 18 estratos × 4 (dois treino e dois teste), porque com 1 polígono por estrato haveria estratos sem treino e outros sem teste. A área total, cerca de 361 ha, é o que o custo de voo suporta (era 360 ha em 36 polígonos de 10 ha). O número de polígonos não foi dimensionado pela necessidade do algoritmo; essa necessidade foi avaliada depois (D24). As unidades efetivas resultam da área total dividida pelo alcance de autocorrelação (50 m), não do tamanho de cada polígono; por isso, trocar 36 polígonos de 10 ha por 72 de 5,02 ha preservou o regime de dados (cerca de 1.836 para 1.845 unidades). A fórmula é n_ef = A / (π · (r/2)²) com r = 50 m.

## 8. Rótulo, campo e papéis (D16, D26, D03)

- **Alvo (D26):** fração da área de cada célula de 10 m delineada como erodida, de 0 a 1, obtida por rasterização da delineação feita sobre o ortomosaico. Alvo binário derivado e secundário: fração ≥ 0,25. Perda Tweedie (parâmetro P10, proposta).
- **Polígonos de VANT (72, 5,02 ha, 361 ha):** massa de treino (2 por estrato) e teste independente (2 por estrato). Rendem cerca de 34.800 células de 10 m e cerca de 1.845 unidades espacialmente independentes (alcance de 50 m).
- **Sorteio pelos estratos biofísicos, nunca pelo rastreio espectral (D02):** voar onde o rastreio aponta erosão faria o modelo aprender a concordar com o rastreio (circularidade).
- **Campo (60 a 80 pontos), fora dos polígonos:** âncora de prevalência e confirmação prospectiva, sorteados com probabilidade conhecida, coletados no SAREL Coletor (Android, em substituição ao KoboCollect), sob protocolo cego, em duas ondas; os 30 primeiros pontos são lote piloto. Funções: estimar a prevalência real (estimador ponderado) e calibrar a acurácia posicional do aparelho.
- **Por que inverter os papéis (D16):** (1) posição: a delineação sobre ortomosaico tem posição melhor que o GNSS de frequência única do aparelho de campo (3 a 8 m); (2) volume: polígonos rendem muito mais unidades independentes que pontos; (3) qualidade do rótulo: delinear sobre imagem de 4 cm é mais confiável que fotointerpretar a 10 m, e mais fiel ao fenômeno contínuo. A fotointerpretação (Fase A) foi aposentada. O valor numérico do ganho de posição (CE90 de 1,47 m, e 78% contra 37% de acerto de atribuição ao pixel) está em verificação (seção 13).
- **Escala do rótulo no campo (D03):** coleta ordinal de quatro níveis (ausente, incipiente, ...), com binarização declarada.
- **Voo cego:** o intérprete recebe código opaco, sem estrato nem papel; planos de voo só saem com terreno real (Copernicus GLO-30); os de demonstração são marcados como sintéticos. Cada polígono é exportado com identificador opaco.

## 9. Avaliação única e critério pré-registrado (D25)

Critério fixado **antes** de qualquer ajuste ou observação de resultado (pré-registro; Nosek et al., 2018).

- Conjunto de avaliação: exclusivamente os 36 polígonos de teste, cerca de 920 unidades efetivas; uma única avaliação, sem reuso para escolher nada.
- Três competidores, comparados nas mesmas células: a linha de base RUSLE, uma regressão penalizada (logística para o alvo binário, Tweedie penalizada para o contínuo) e o XGBoost. Nenhum é privilegiado a priori; o resultado admissível inclui a regressão parcimoniosa vencer.
- Métrica primária: correlação de postos de Spearman entre o previsto e a fração erodida observada. Piso: ρ ≥ 0,40. Margem sobre a linha de base: ρ(XGBoost) − ρ(RUSLE) ≥ 0,10. Secundária (reportada, não condiciona o desfecho): AUC ≥ 0,70 e ganho de AUC ≥ 0,05 sobre o RUSLE.
- Inferência: intervalo de 95% da diferença emparelhada por bootstrap com o **polígono** como unidade de reamostragem (não a célula, para evitar pseudorreplicação). A potência é governada por 36 agrupamentos, então o intervalo é largo.
- Desfechos declarados antes: (1) **corroborada**: atinge piso e margem e o intervalo exclui zero; (2) **inconclusiva**: margem atingida no ponto mas intervalo contém zero (vedado reclassificar depois); (3) **refutada**: abaixo do piso de 0,40 ou abaixo do RUSLE; (3b) **inconclusiva por margem**: atinge o piso e iguala ou supera o RUSLE, mas a diferença é menor que 0,10; (4) **quarto desfecho, independente**: se a regressão penalizada empatar com o XGBoost ou o vencer (limite inferior do intervalo da diferença ρ(XGBoost) − ρ(penalizada) não excede zero), a hipótese de que é preciso um ensemble de árvores fica refutada, ainda que o sensoriamento remoto vença o RUSLE. São resultados distintos e ambos publicáveis.
- Proibido alterar piso, margem, métrica primária, unidade de bootstrap ou definição de desfecho após observar qualquer resultado; proibido reportar métrica de validação interna como desempenho. Refutação é resultado científico válido.
- Sensibilidades pré-registradas: XGBoost sem restrições de monotonicidade e, por D08, exclusão das células com marcador de ambiguidade verdadeiro ou indisponível.
- Justificativa das escolhas: piso de 0,40 como fronteira convencional de discriminação aceitável; margem de 0,10 intermediária entre 0,15 (estrita, que cobraria desempenho que o desenho não pode fornecer) e 0,05 (indistinguível de ruído nesse tamanho de amostra). A estrutura ternária foi mantida mesmo com a potência melhorando de 18 para 36 agrupamentos: afrouxar critério pré-registrado seria a flexibilidade analítica que o pré-registro impede.
- Estado: **não avaliado**. A regra de AUC ≥ 0,70 é convenção de bolso atribuída a Hosmer e Lemeshow, não conferida contra a fonte primária (a D25 admite isso).

## 10. Regime de dados do modelo (D24)

O desenho por polígonos elevou o regime de dados de forma assimétrica por bloco de preditor:

| Bloco | Unidades efetivas | Teto de preditores |
|---|---|---|
| Espectro-temporal (Sentinel-2, índices, métricas de série) | cerca de 1.845 (cerca de 936 de teste) | até 8 |
| Terreno a 30 m | cerca de 396 | até 4 |
| Solo (K) | 72 nominais, menos efetivas | 1 |
| Chuva (I30, erosividade) | 72 nominais, menos efetivas | 1 |

Total de até 14 preditores. Referência: van der Ploeg et al. (2014): métodos flexíveis precisam da ordem de 200 eventos por variável; o desenho anterior por pontos tinha cerca de 200 positivos, de 5 a 15 vezes abaixo. Três dos quatro blocos operam abaixo do regime recomendado, e isso é declarado. Quatro mitigações obrigatórias: (1) três competidores comparados; (2) restrições de monotonicidade física sobre preditores de sinal conhecido; (3) dimensionalidade declarada de antemão por mecanismo físico, nunca por seleção sobre os dados de ajuste; (4) validação cruzada aninhada e agrupada por polígono, com a estimativa honesta vinda só do teste. Aumentar polígonos é a única via de melhorar solo e chuva, "a um custo de voo que o projeto não suporta".

## 11. Linha de base RUSLE

A avaliação compara o modelo ao RUSLE (Renard et al., 1997), com os cinco fatores e proveniência declarada:

- **R (erosividade, D13):** equação regional do Paraná aplicada a totais de chuva CHIRPS climatológicos; proveniência "modelado", nunca "medido" (a equação é calibrada com pluviógrafo e aqui aplicada a total por satélite). Série de cerca de 23 anos (mínimo, proposta P24).
- **K (erodibilidade, D14):** o valor numérico `k_solos` da camada oficial da carta de 2024; a faixa de classe é fallback.
- **LS (D15):** algoritmo bidimensional de área de contribuição específica de Desmet e Govers (1996), a 30 m, com distorção de projeção medida.
- **C (D20):** híbrido para sistema de plantio direto: C = ((1 − NDVI)/2) × (1 + BSI), com C em [0, 1]; fora disso, indisponível. A base é Durigon et al. (2014) (D01).
- **P (D22):** nos pontos com visita de campo, derivado de observação de campo estratificada por declividade; coeficientes provisórios, não conferidos.

O RUSLE entra aqui como competidor de referência, não como verdade.

## 12. Estado atual (19/10/2026)

**Pronto:** plataforma com os módulos do fluxo e recusa de dado sintético; desenho amostral e critério de avaliação pré-registrados; ferramenta de checagem do pool por estrato (somente leitura, recusa candidato sintético); pacote de reprodutibilidade com verificador; registro de 26 decisões.

**Pendente:** nenhum resultado empírico; medir o pool real por estrato (exige o solo nu via GEE); decidir reservas, número mínimo e taxa de recusa (P25 a P27); decisões antes do sorteio (solo nu DP-3, declividade DP-4, empates dos tercis DP-6, pesos do estimador e distância mínima DP-7, cifras do held-out DP-16); gravar no sistema a emenda da classe 6; autorizações, voos e delineação; acerto de atribuição de posição (antes citado como cerca de 78%) em verificação; confirmar a autonomia útil das baterias; conferência bibliográfica completa.

## 13. Limites e pontos frágeis (declare-os se perguntarem)

1. **Sem resultado empírico.** Tudo é método e viabilidade.
2. **Pool por estrato desconhecido.** Só o pool total foi contado (84 de 677 no nível 2); o solo nu não foi medido.
3. **Viés fundiário declarado.** Exigir polígono dentro de um só imóvel favorece imóveis maiores; os percentuais de elegibilidade são limites superiores.
4. **Recusa e reservas: proposta, sem valores decididos.**
5. **Classe 6 de erodibilidade:** emenda aprovada, ainda não gravada; K da classe 6 só como faixa; a medição por classe do pool não existe. Existe divergência entre o texto da D09 ([1..5]) e o código, que já classifica "extremamente alta" no nível 2 numa das funções.
6. **Precisão de posição:** o CE90 de 1,47 m da delineação foi registrado em uma das duas missões medidas; a outra registra 7,04 m no mesmo campo de metadado, e a origem dessa diferença não está esclarecida. O ganho de acerto de atribuição (de 37% para 78%) está em verificação. Não afirmar esses números sem ressalva.
7. **Tempo de voo:** o plano diz cerca de 3 min por polígono; a produtividade medida nas duas missões varia de 0,53 a 2,3 ha/min. A autonomia por bateria não está registrada.
8. **Aeronave e sensor:** documento de 23/09 descreve 5 bandas; dados reais mostram MicaSense Altum (7 bandas).
9. **Regime de dados justo:** três dos quatro blocos de preditores operam abaixo do recomendado (D24); só 36 agrupamentos no teste; a inferência é conservadora.
10. **Referências:** só algumas foram conferidas contra a fonte (Coelho 2024, Rufino 1993, Waltrick, Desmet e Govers 1996, Renard 1997). A citação de Mannigel et al. (2002) está suspensa até conferência (a obra encontrada trata de solos de São Paulo). A regra de AUC de 0,70 não foi conferida.
11. **Cifras do held-out divergentes** em textos antigos (918, 936, 920, 922, 923); a decisão sobre qual vale é pendente (DP-16).
12. **Empates dos tercis:** regra pendente (DP-6).

## 14. Perguntas e respostas prováveis

**O que é o SAREL?** Uma plataforma que seleciona, de forma auditável, onde amostrar erosão laminar: elege candidatos por satélite, estratifica, sorteia com selo irreversível, planeja a campanha de voo e de campo, monta a matriz com a origem de cada valor e exporta um pacote verificável.

**Por que não usar pontos de campo, como é comum?** Porque a erosão laminar é uma mancha contínua; um ponto representa mal o fenômeno, tem posição pior (GNSS de 3 a 8 m) e rende poucas unidades independentes. Polígonos delineados sobre imagem de 4 cm dão rótulo mais fiel e mais volume (D16). O campo ficou como âncora de prevalência.

**Por que 18 estratos?** Declividade (3) × solo nu (3) × erodibilidade (2): as três dimensões que governam a perda de solo laminar e que permitem cobrir combinações raras (D12).

**Por que tercis?** Dividem os candidatos em três grupos de tamanho aproximado, com corte calculado sobre os dados da própria área. Empates caem no grupo mais baixo; a regra final é pendente.

**Por que 72 polígonos?** 18 estratos × 4 (2 treino e 2 teste). A área total (cerca de 361 ha) é o que o custo de voo suporta; ela rende cerca de 1.845 unidades independentes, no limite para o bloco espectral.

**O sorteio já foi feito?** Não. Nenhum selo foi criado. Faltam decisões do pesquisador e a medição do pool por estrato.

**Por que o sorteio é irreversível?** Para que ninguém escolha o sorteio que favoreça o resultado. O selo registra semente, versão do código, hash dos candidatos e do resultado; se já existe selo, o sistema recusa outro.

**E se o proprietário não autorizar?** Há uma proposta (reservas ordenadas por estrato, que herdam o papel do titular), ainda sem parâmetros decididos. O sorteio não é refeito.

**Há candidatos suficientes?** No total, sim (84 no nível 2 de erodibilidade contra 36 necessários, medição de 30/09). Por estrato, não se sabe: falta medir o solo nu.

**Como o solo nu é calculado?** É a fração de cenas Sentinel-2 válidas, de 2016 a 2026, em que a célula aparece com solo exposto (NDVI ≤ 0,25 combinado com BSI > 0,10); exige no mínimo 6 observações válidas.

**O que é erodibilidade e de onde vem?** Suscetibilidade intrínseca do solo à erosão, pela carta da Embrapa de 2024 (Documentos 246), com 6 classes. O nível 1 reúne as classes baixas a média (K ≤ 0,0285) e o nível 2 as altas (K ≥ 0,0300).

**E a classe extremamente alta?** Entra no nível 2 por emenda aprovada em 19/10/2026 (o critério numérico já a abrange), em registro. Tem K como faixa (0,06 a 0,11), sem valor pontual.

**Solo extremamente erodível não tem erosão em sulco em vez de laminar?** K alto aumenta a suscetibilidade à erosão laminar, não a elimina. A preocupação com sulcos e voçorocas é tratada pelo domínio de declividade (3 a 20%) e pela regra de delineação; a exclusão da classe foi avaliada e rejeitada.

**Quantos voos e quanto tempo?** 72 missões, cerca de 12 jornadas de até 6 polígonos; cerca de 3 min de mapeamento por polígono mais curvas, pelo menos 3,6 h no total, com 3 baterias; autonomia útil por confirmar.

**Qual aeronave?** Spectral 2 (Nuvem UAV) com câmera MicaSense Altum.

**Por que reduzir de 10 ha para 5,02 ha?** Para o polígono caber em um único imóvel: a elegibilidade passou de 43,4% para 64,7% (71,8% admitindo retângulo). Mantém-se a área total, e portanto o regime de dados (D16, D24).

**A amostra é viesada?** Há um viés declarado: o requisito de caber num imóvel favorece imóveis maiores. A emenda o reduz, não o elimina.

**O que se compara na avaliação?** RUSLE, regressão penalizada e XGBoost, nas mesmas células, por Spearman, com piso de 0,40 e margem de 0,10 sobre o RUSLE.

**E se o modelo não superar o RUSLE?** É um resultado válido e será apresentado como tal (desfecho refutado ou inconclusivo, declarado antes).

**Por que bootstrap por polígono?** Células do mesmo polígono não são independentes; reamostrar células é pseudorreplicação.

**Por que o critério é pré-registrado?** Sem critério fixado antes, a flexibilidade analítica produz superioridade aparente em qualquer conjunto de dados (Nosek et al., 2018).

**Os dados são reais ou sintéticos?** O sistema recusa dado sintético onde exige dado real e marca o sintético como tal. Não há dado de campo ainda; as missões de VANT existentes foram usadas para medir produtividade de voo.

**Como garantir que o pacote não foi alterado?** O manifesto traz SHA-256 de cada arquivo e há verificador. Prova integridade, não autoria.

**O intérprete sabe de qual estrato é o polígono?** Não. Ele recebe só um código opaco; a exportação é cega por perfil.

**Que fatores formam a linha de base RUSLE?** R, K, LS, C e P, cada um com proveniência (R modelado por CHIRPS; K da carta de 2024; LS de Desmet e Govers; C híbrido para plantio direto; P derivado do campo, provisório).

**Por que Sentinel-2 e não Landsat?** O Sentinel-2 tem resolução de 10 a 20 m e a série de treino é exclusivamente dele (D05); o Landsat entra só como camada separada de tendência histórica a 30 m, nunca como preditor.

**O que ainda falta?** Resultado empírico; medir o solo nu e o pool por estrato; decisões do pesquisador antes do sorteio; autorizações, voos e delineação; conferência bibliográfica.

## 15. Referências (marcadas com † as conferidas contra a fonte no projeto)

- † Coelho, M. R. et al. (2024). Erodibilidade dos solos do Brasil. Rio de Janeiro: Embrapa Solos, Documentos 246.
- † Rufino, R. L. et al. (1993). Erosividade da chuva no Paraná (equação regional).
- † Waltrick, P. C. et al. Erosividade das chuvas no Paraná.
- † Desmet, P. J. J.; Govers, G. (1996). A GIS procedure for automatically calculating the USLE LS factor on topographically complex landscape units. Journal of Soil and Water Conservation 51(5):427-433.
- † Renard, K. G. et al. (1997). Predicting soil erosion by water: RUSLE. Agriculture Handbook 703.
- Durigon, V. L. et al. (2014). International Journal of Remote Sensing 35(2):441-453.
- Cochran, W. G. (1977). Sampling Techniques, 3ª ed.
- Olofsson, P. et al. (2014). Remote Sensing of Environment 148:42-57.
- King, G.; Zeng, L. (2001). Political Analysis 9:137-163.
- van der Ploeg, T.; Austin, P. C.; Steyerberg, E. W. (2014). BMC Medical Research Methodology 14:137.
- Nosek, B. A. et al. (2018). PNAS 115(11):2600-2606.
- Cameron, A. C.; Gelbach, J. B.; Miller, D. L. (2008). Review of Economics and Statistics 90(3):414-427.
- Hanley, J. A.; McNeil, B. J. (1982). Radiology 143(1):29-36.
- Roberts, D. R. et al. (2017). Ecography 40(8):913-929.
- Drusch, M. et al. (2012). Remote Sensing of Environment 120:25-36.
- Zanaga, D. et al. (2021, 2022). ESA WorldCover 10 m.
- Funk, C. et al. (2015). CHIRPS. Scientific Data 2:150066.
- Altman, D. G.; Royston, P. (2006). BMJ 332:1080.

Observação: as referências não marcadas constam do registro de decisões e aguardam conferência bibliográfica completa. A citação de Mannigel et al. (2002) está suspensa.

## 16. Glossário

- **AOI:** área de interesse (área de estudo).
- **BSI / NDVI:** índices espectrais de solo exposto e de vegetação, usados só para triagem de candidatos.
- **CE90:** raio que contém 90% dos erros horizontais de posição.
- **Estrato:** grupo de candidatos definido por uma combinação de declividade, solo nu e erodibilidade.
- **GEE:** Google Earth Engine.
- **GSD:** tamanho do pixel no terreno (resolução do voo).
- **Held-out:** conjunto de teste independente, não usado em ajuste.
- **Horvitz-Thompson:** estimador ponderado pelo inverso da probabilidade de inclusão.
- **K̂ / K:** nível ou valor de erodibilidade do solo (fator K da USLE/RUSLE).
- **π_i:** probabilidade de inclusão de uma unidade no sorteio.
- **Proveniência:** declaração da origem de cada valor (medido, modelado, tabelado, indisponível).
- **RUSLE:** equação universal de perda de solo revisada.
- **Selo:** registro irreversível do sorteio (semente, código, hash).
- **Tercil:** divisão em três grupos de tamanho aproximado pelos cortes de 1/3 e 2/3.
- **VANT:** veículo aéreo não tripulado (drone).
