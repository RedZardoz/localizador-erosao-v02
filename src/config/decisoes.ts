export type EstadoDecisao = "pendente" | "proposta" | "decidida";

export interface Decisao<T> {
  id: string;              // "D10", "P04"
  titulo: string;
  estado: EstadoDecisao;
  valor?: T;               // so quando "decidida"
  justificativa?: string;
  referencia?: string;     // obra e secao, conferida na fonte
  decididoPor?: string;
  decididoEm?: string;     // AAAA-MM-DD
}

export class ErroDecisaoPendente extends Error {
  readonly decisaoId: string;
  constructor(id: string, titulo: string) {
    super(`Decisão pendente: ${id} (${titulo})`);
    this.name = "ErroDecisaoPendente";
    this.decisaoId = id;
  }
}

export function exigirDecisao<T>(d: Decisao<T>): T {
  if (d.estado !== "decidida" || d.valor === undefined) {
    throw new ErroDecisaoPendente(d.id, d.titulo);
  }
  return d.valor;
}

export const DECISOES: Record<string, Decisao<any>> = {
  D01: {
    id: "D01",
    titulo: "Fórmula do Fator C: Durigon et al. (2014)",
    estado: "decidida" as EstadoDecisao,
    valor: "(1 - NDVI) / 2",
    justificativa: "Validade regional em bacia tropical brasileira, concebida para serie temporal, sem parametros livres e sem corte em [0, 1].",
    referencia: "Durigon et al. (2014), International Journal of Remote Sensing 35(2):441-453",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-08",
  },
  D02: {
    id: "D02",
    titulo: "Critérios observacionais de presente/ausente e negativo explícito",
    estado: "decidida" as EstadoDecisao,
    valor: "Amostragem estratificada pura: Classe 1 (Erosão: BSI > 0.10 e NDVI < 0.40) vs Classe 0 (Controle/SPD: BSI < 0.00 e NDVI > 0.65)",
    justificativa: "Critérios biofísicos objetivos e reprodutíveis validados no Sentinel-2 e PlanetScope.",
    referencia: "Metodologia PPGTCA 2026, Seção 3.1 e Tabela 1",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-13",
  },
  D03: {
    id: "D03",
    titulo: "Escala do rótulo: coleta ordinal com binarização declarada",
    estado: "decidida" as EstadoDecisao,
    valor:
      "COLETA em escala ordinal de quatro níveis, com o vocabulário do SAREL Coletor como canônico: 'ausente', 'incipiente', 'moderada', 'severa'. ALVO SUPERVISIONADO binário, obtido por binarização explícita com corte entre 'ausente' e 'incipiente': ausente => 0; incipiente, moderada e severa => 1. INCIPIENTE CONTA COMO POSITIVO. Os termos 'presente', 'erosao', 'erosão' e '1', aceitos por montarMatrizTreino (montagem.ts:139-148), são aliases legados de versões anteriores e mapeiam para 1. A escala ordinal de quatro níveis é preservada integralmente no dado, não apenas o binário derivado. Fica PRÉ-REGISTRADA uma análise de sensibilidade secundária que repete o ajuste com corte alternativo — ausente => 0, moderada e severa => 1, com 'incipiente' excluído do treino — cujo resultado é reportado junto do principal, qualquer que seja.",
    justificativa:
      "Três razões sustentam o corte em 'incipiente'. Primeira, de propósito: a finalidade declarada do método é localização e predição, e detectar apenas erosão moderada ou severa tem baixo valor prático, porque nesse estágio o dano já está consolidado; excluir a erosão incipiente contrariaria a razão de existir do instrumento. Segunda, de tamanho amostral: o positivo é o recurso escasso da pesquisa, e este é o único corte que não o reduz — a decisão D24 registra que o regime de dados já está abaixo do recomendado para ensembles de árvores, e reduzir positivos agravaria. Terceira, de honestidade: classificar como 'sem erosão' um ponto onde o observador registrou erosão incipiente seria rótulo falso, ainda que conveniente ao desempenho medido. O custo é assumido e declarado: a classe positiva fica heterogênea, e a erosão incipiente é justamente a de detecção mais difícil no pixel de 10 m do Sentinel-2, de modo que incluí-la tende a reduzir o desempenho aparente. É precisamente por isso que a análise de sensibilidade é pré-registrada: a diferença de desempenho entre os dois cortes mede quanto do sinal está na erosão incipiente, e esse contraste é resultado científico, não escolha metodológica a ser feita depois. A binarização é fixada ANTES da campanha e não pode ser alterada após a observação dos resultados, sob pena de flexibilidade analítica.",
    referencia:
      "Metodologia PPGTCA 2026, Seções 3.1 e 5; src/lib/matriz/montagem.ts:139-148 (implementação canônica); modelo de dados do SAREL Coletor (FieldCollection.classe)",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-27",
  },
  D04: {
    id: "D04",
    titulo: "Modelo D (detecção), Modelo P (predição) e intervalo de guarda temporal",
    estado: "decidida" as EstadoDecisao,
    valor: "Ambos os modelos integrados: Modelo D para detecção contemporânea de feições ativas (t0) e Modelo P para predição prospectiva de risco com intervalo de guarda temporal estrito de 2 anos (24 meses) encerrado antes da data do evento para eliminar vazamento temporal (data leakage).",
    justificativa: "A segregação obedece ao princípio de 'learn-predict separation' de Kaufman et al. (2012) e coincide com a rotação bienal do Sistema Plantio Direto (Embrapa Soja), eliminando atalhos e autocorrelação espúria no XGBoost.",
    referencia: "Kaufman et al. (2012), ACM TKDD 6(4):15; Embrapa Soja (Franchini et al., 2011)",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-22",
  },
  D05: {
    id: "D05",
    titulo: "Extensão da série: apenas Sentinel-2 ou inclui Landsat",
    estado: "pendente" as EstadoDecisao,
    justificativa: "Proposta estruturada: adotar exclusivamente a série Sentinel-2 MSI (2016–2026, 10 m) no treinamento supervisionado para evitar salto de escala de 9x (900 m² vs 100 m²) em relação ao Landsat.",
    referencia: "Metodologia PPGTCA 2026, Seção 3.1; Drusch et al. (2012)",
  },
  D06: {
    id: "D06",
    titulo: "Unidade de predição: pixel 10m calibrado por VANT Multiespectral",
    estado: "decidida" as EstadoDecisao,
    valor: "Pixel Sentinel-2 de 10 m com calibração sub-métrica e confronto radiométrico pelo VANT Multiespectral Spectral 2 (Nuvem UAV) — 5 bandas calibradas (Azul, Verde, Vermelho, RedEdge, NIR), PPK/RTK centimétrico e GSD 3 a 7,5 cm — em 4 polígonos contínuos de 10 a 50 ha (Céu Azul e Medianeira)",
    justificativa: "Elimina a subjetividade de vetorização manual de microparcelas, viabiliza o confronto radiométrico direto (Pearson r) entre satélite e drone, e captura o gradiente topo-sequencial completo da catena agrícola (topo, encosta e baixada).",
    referencia: "Metodologia PPGTCA 2026, Seções 3.1 e 3.2; Nuvem UAV (2024)",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-22",
  },
  D07: {
    id: "D07",
    titulo: "Domínio de validade (ex.: declividade 3-20%, uso agrícola)",
    estado: "pendente" as EstadoDecisao,
    justificativa: "Proposta estruturada: declividade entre 3% e 20% (relevo suave ondulado a ondulado) sob uso agrícola de lavouras temporárias e pastagem cultivada (ESA WorldCover 30, 40, 60).",
    referencia: "SiBCS / Embrapa Solos (2018); Metodologia PPGTCA 2026, Seção 3.1",
  },
  D08: {
    id: "D08",
    titulo: "Tratamento das unidades pedológicas em associação",
    estado: "pendente" as EstadoDecisao,
    justificativa: "Proposta estruturada: atribuir o componente dominante (ordem_1) com propagação explícita de confiança pedológica 'media' e ressalva visual no Inspetor.",
    referencia: "Embrapa GeoInfo (parana_solos_20201105); Coelho et al. (2024)",
  },
  D09: {
    id: "D09",
    titulo: "Mapa ordinal das classes de erodibilidade e corte em 2 níveis de K^",
    estado: "decidida" as EstadoDecisao,
    valor: "Domínio agrícola estrito [1..5] conforme escala Embrapa Solos (1 a 5 mapeadas ordinalmente). Classes não-agrícolas excluídas por máscara. Corte K^ para estratificação: Nível 1 = Baixa/Média (classes 1-3, K <= 0.0285) e Nível 2 = Alta/Muito Alta (classes 4-5, K >= 0.0300).",
    justificativa: "Adoção da Proposta A com respaldo normativo oficial da Embrapa Solos (Doc. 246/2024) e validação pedológica de Mannigel et al. (2002).",
    referencia: "Coelho et al. (2024), Documentos 246 Embrapa Solos (Tabela 5); Mannigel et al. (2002), RBCS 26:1039-1049",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-22",
  },
  D10: {
    id: "D10",
    titulo: "Limiar de NDVI para solo descoberto",
    estado: "decidida" as EstadoDecisao,
    valor: "NDVI <= 0.25 (combinado com BSI > 0.10 quando aplicável na assinatura espectral)",
    justificativa: "Calibrado no sistema GEOS3 (GeoCiS/ESALQ-USP) para solos brasileiros sob imagens orbitais (Landsat e Sentinel-2). Garante separação rigorosa entre solo exposto e resíduos de palhada de Plantio Direto.",
    referencia: "Demattê et al. (2018), Remote Sensing of Environment 212:161-175; Safanelli et al. (2021), RBCS 45:e0210080",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-22",
  },
  D11: {
    id: "D11",
    titulo: "Cobertura temporal mínima (nº mínimo de observações válidas)",
    estado: "decidida" as EstadoDecisao,
    valor: "Mínimo de 6 observações orbitais válidas (sem nuvem/sombra) por ponto/janela temporal para análise de persistência temporal e time-series stacking.",
    justificativa: "Critério biofísico necessário para estimar com significância a taxa de degradação linear no SWIR B12, a recuperação do dossel vegetal e a frequência de solo exposto.",
    referencia: "Metodologia PPGTCA 2026, Seção 6.1",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-13",
  },
  D12: {
    id: "D12",
    titulo: "Dimensões da estratificação (18 estratos vs ampliada)",
    estado: "pendente" as EstadoDecisao,
    justificativa: "Proposta estruturada: matriz fatorial de 18 estratos canônicos (3 tercis de declividade S^ x 3 tercis de exposição E^ x 2 níveis de erodibilidade K^).",
    referencia: "Planejamento V3, §7.2; Cochran (1977)",
  },
  D13: {
    id: "D13",
    titulo: "Formulação do Fator R",
    estado: "pendente" as EstadoDecisao,
    justificativa: "Proposta estruturada: equação de erosividade regional do Paraná baseada em séries pluviométricas CHIRPS/IMERG.",
    referencia: "Waltrick et al. (2015), RBCS; Oliveira et al. (2013)",
  },
  D14: {
    id: "D14",
    titulo: "Fator K numérico para linha de base RUSLE",
    estado: "decidida" as EstadoDecisao,
    valor: "Conversão oficial da Tabela 5 da Embrapa Solos (Doc. 246/2024) baseada em Mannigel et al. (2002): Muito baixa = 0.0020-0.0084, Baixa = 0.0090-0.0144, Média = 0.0150-0.0285, Alta = 0.0300-0.0420, Muito alta = 0.0450-0.0585 t*h/(MJ*mm).",
    justificativa: "Converte classes qualitativas da carta pedológica em valores numéricos contínuos de erodibilidade requeridos pela RUSLE, ancorando a linha de base empírica em literatura nacional consolidada.",
    referencia: "Coelho et al. (2024), Documentos 246 Embrapa Solos (Tabela 5); Mannigel et al. (2002), RBCS 26:1039-1049",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-22",
  },
  D15: {
    id: "D15",
    titulo: "Fator LS: método de acúmulo e expoentes m e n",
    estado: "pendente" as EstadoDecisao,
    justificativa: "Proposta estruturada: algoritmo bidimensional de área de contribuição específica (Desmet & Govers, 1996) projetado em UTM 22S (EPSG:31982).",
    referencia: "Desmet & Govers (1996), JSWC 51(5):427-433; McCool et al. (1989)",
  },
  D16: {
    id: "D16",
    titulo: "Campanha: polígonos de VANT como massa de treino e teste, campo como âncora e confirmação",
    estado: "decidida" as EstadoDecisao,
    valor:
      "INVERSÃO DE PAPÉIS em relação à versão anterior desta decisão: o VANT deixa de ser exclusivamente held-out e passa a ser a MASSA DE TREINO e o TESTE INDEPENDENTE; o campo deixa de ser massa de treino e passa a ser ÂNCORA DE PREVALÊNCIA e CONFIRMAÇÃO PROSPECTIVA. (1) POLÍGONOS DE VANT: 36 polígonos de 10 ha (cerca de 316 x 316 m, extensão suficiente para conter a catena completa: topo, encosta e baixada), DOIS POR ESTRATO sobre os 18 estratos de D12, sorteados probabilisticamente com pi_i registrado, jamais escolhidos por suspeita de erosão. De cada par, um polígono vai para treino e o outro para held-out, de modo que treino e teste cobrem os 18 estratos. Total de 360 ha, cerca de 3 jornadas de voo de 3 baterias, com produtividade medida de 2,3 ha/min a GSD de aproximadamente 4 cm. Rende cerca de 1.836 unidades espacialmente independentes a alcance de 50 m, e 36.000 células de 10 m. (2) PONTOS DE CAMPO: 60 a 80 pontos dispersos pela bacia, FORA dos polígonos, sorteados com pi_i conhecido, coletados pelo SAREL Coletor em aparelho Android sob protocolo cego. Sua função NÃO é treinar, e sim estimar a prevalência real e calibrar a acurácia posicional efetiva. (3) CONFIRMAÇÃO PROSPECTIVA: após o treino, amostra sorteada das predições do modelo sobre a bacia, visitada em campo — teste prospectivo, cujo tamanho será fixado quando o modelo existir. (4) FOTOINTERPRETAÇÃO DA FASE A: APOSENTADA. (5) O instrumento de campo passa de KoboCollect para SAREL Coletor.",
    justificativa:
      "A inversão decorre de três medições feitas sobre as missões de VANT já executadas, registradas em docs/verificacoes/voo/cobertura_voos.geojson. Primeira, posição: a delineação sobre ortomosaico tem CE90 medido de 1,47 m, contra 3 a 8 m do GNSS de frequência única do aparelho de campo, o que eleva o acerto de atribuição ao pixel de 10 m de cerca de 37% para cerca de 78%. Segunda, volume: cada polígono de 10 ha rende cerca de 51 unidades espacialmente independentes, de modo que 36 polígonos entregam ordem de 1.800 — contra 200 positivos do desenho por pontos, o que retira o classificador do regime criticamente subdimensionado descrito em D24, ao menos para os preditores que variam dentro do talhão. Terceira, qualidade de rótulo: delinear sobre imagem de 4 cm é mais confiável que fotointerpretar a 10 m, e mais fiel ao fenômeno que a visita a um ponto, porque a erosão laminar é mancha contínua na vertente e não ocorrência pontual. A escolha de DOIS polígonos por estrato, e não um, resolve um problema que só apareceu no cálculo: com um por estrato, reservar cinco como held-out deixaria cinco estratos sem treino e treze sem teste, de modo que o conjunto de teste não cobriria o espaço de covariáveis. A duplicação custa uma jornada de voo adicional e entrega divisão treino/teste completa sobre os 18 estratos, além de permitir estimar variância entre paisagens do mesmo estrato. A aposentadoria da fotointerpretação segue do mesmo raciocínio: sua única vantagem remanescente era alcançar qualquer ponto da bacia sem voar até lá, mas a diversidade de covariáveis passa a ser garantida pelo próprio sorteio estratificado dos 36 polígonos; mantê-la custaria dois intérpretes e a maquinaria de concordância para injetar rótulo de qualidade inferior num conjunto que passou a ter rótulo centimétrico. GUARDA CONTRA CIRCULARIDADE: os polígonos são sorteados pelos estratos biofísicos, nunca pelo rastreio espectral de D02; voar onde o rastreio aponta erosão faria o modelo aprender a concordar com o rastreio em vez de detectar erosão, que é o defeito eliminado em 207dca2 reentrando por outra porta.",
    referencia:
      "Metodologia PPGTCA 2026, Seções 3.2 e 3.3; docs/verificacoes/voo/cobertura_voos.geojson (produtividade, GSD e CE90 medidos em 27/09/2026); D12 (18 estratos); D23 (regime amostral); D26 (alvo contínuo); van der Ploeg, Austin & Steyerberg (2014)",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-27",
  },
  D17: {
    id: "D17",
    titulo: "Ciclo da cota Planet e alocação racional entre download e tiles",
    estado: "decidida" as EstadoDecisao,
    valor:
      "Cota de Scene Downloads de 3.000 km² tratada como TOTAL do período de vigência do plano (Education and Research Basic, Plan ID 798565, até 05/04/2028), não como cota mensal renovável. Alocação: a fotointerpretação de rotulagem consome exclusivamente a cota de Scene Tiles (100.000 tiles), que não debita km²; a cota de km² fica reservada aos recortes analíticos ortho_analytic (PSScene), incluindo os trios pré/pós evento.",
    justificativa:
      "A leitura conservadora (total, não mensal) é segura sob ambas as hipóteses contratuais: se o ciclo for de fato mensal, o planejamento apenas folga, nunca aperta; a hipótese inversa esgotaria a cota com OVERAGE desligado, situação em que a API rejeita a requisição. O dimensionamento medido em 27/09/2026 confirma folga ampla sob a leitura conservadora: com o buffer de D18 (0,25 km² por recorte), 180 pontos em uma data mais 60 trios pré/pós evento consomem 75 km², ou 2,5% da cota total; 180 pontos em três datas consomem 135 km², ou 4,5%. A separação entre tiles e km² é a economia estruturante: rotular por fotointerpretação não deve debitar a cota analítica, e o plano oferece 100.000 tiles exatamente para esse uso. O ciclo contratual efetivo deve ser confirmado na página do plano na conta Planet; a confirmação de ciclo mensal permite relaxar esta decisão sem qualquer alteração operacional.",
    referencia:
      "Planet Labs Education & Research Program, Plan ID 798565 (vigência até 05/04/2028); src/lib/planet/quota.ts (livro-razão persistente); Planejamento V3, §11.1-11.3",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-27",
  },
  D18: {
    id: "D18",
    titulo: "Buffer do recorte Planet por ponto amostral",
    estado: "decidida" as EstadoDecisao,
    valor:
      "Raio de 250 m ao redor do centróide amostral, materializado como bounding box de 500 m de lado em EPSG:4326, equivalente a 0,25 km² (25 ha) por recorte.",
    justificativa:
      "O raio de 250 m cobre a encosta do talhão e o gradiente topo-sequencial da catena agrícola (topo, encosta e baixada), que é a unidade do processo hidrossedimentológico da erosão laminar — o fenômeno não se manifesta num ponto isolado. A área registrada é 25 ha, e não os 19,6 ha da proposta original: criarPoligonoBufferAoi (src/lib/planet/ordersApi.ts:56) produz uma bounding box quadrada de lado 2r, não um círculo de raio r, e o valor circular subestimava o consumo real de cota em 27%. A restrição operante aqui é metodológica, não orçamentária: a cota permitiria raio de até cerca de 1.179 m em 180 pontos por três datas, mas ampliar o recorte além da encosta acrescenta área sem acrescentar relevância de processo.",
    referencia:
      "Planejamento V3, §10.4; src/lib/planet/ordersApi.ts:56 (geometria efetiva do buffer); docs/Delimitacao_Territorial_e_Selecao_Amostral_MultiEscala_BP3.md (catena topo-sequencial)",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-27",
  },
  D19: {
    id: "D19",
    titulo: "Quantidade de pontos com pares de evento",
    estado: "pendente" as EstadoDecisao,
    justificativa: "Proposta estruturada: subconjunto de 40 a 60 pontos amostrais pareados pré/pós evento erosivo pluviométrico.",
    referencia: "Planejamento V3, §10.5",
  },
  D20: {
    id: "D20",
    titulo: "Fórmula do Fator C híbrido SPD: Durigon et al. (2014) modulada pelo BSI",
    estado: "decidida" as EstadoDecisao,
    valor: "C = ((1 - NDVI) / 2) * (1 + BSI), com domínio físico estrito C em [0, 1]; qualquer C fora de [0, 1] resulta em indisponivel com causa fora-do-dominio. Na ausência de BSI válido, aplica-se a forma pura de D01: C = (1 - NDVI) / 2.",
    justificativa:
      "Estende a formulação de Durigon et al. (2014) — decidida em D01 e preservada como caminho puro — acrescentando modulação pelo Índice de Solo Exposto (BSI). Fundamento físico: sob Sistema Plantio Direto, o NDVI isolado não distingue palhada senescente de solo mineral exposto, pois ambos apresentam NDVI baixo. O BSI resolve a ambiguidade pelo sinal: palhada senescente exibe NDVI baixo com BSI negativo (cobertura morta ainda protege o solo do impacto da gota), enquanto solo mineral exposto exibe NDVI baixo com BSI positivo (superfície desprotegida e suscetível ao salpicamento). Como o Fator C expressa a razão de perda de solo sob determinada cobertura em relação ao solo continuamente descoberto, é fisicamente correto que a mesma leitura de NDVI produza C menor sob palhada e C maior sob solo exposto. O domínio estrito em [0, 1] é imposto na saída porque o Fator C é razão adimensional por construção (Renard et al., 1997): sem essa verificação, a combinação NDVI = -1 com BSI = 1 produzia C = 2,0, o dobro do máximo físico, que se propagaria para A = R*K*LS*C*P. Conforme a Regra 2, valor fora do domínio não é cortado por piso ou teto artificial: causa indisponibilidade explícita. Esta decisão NÃO substitui nem revoga D01, que permanece registrada com a formulação original e segue vigente quando o BSI não está disponível.",
    referencia:
      "Durigon et al. (2014), International Journal of Remote Sensing 35(2):441-453 (formulação base); Rikimaru et al. (2002) (Bare Soil Index); Renard et al. (1997), USDA-ARS Agriculture Handbook 703 (domínio do Fator C); docs/auditorias/Relatorio_Auditoria_Integral_Coerencia_Efetividade_2026-09-26.md, achado C1",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-27",
  },
  D21: {
    id: "D21",
    titulo: "Fonte e resolução do Modelo Digital de Elevação",
    estado: "decidida" as EstadoDecisao,
    valor:
      "Copernicus DEM GLO-30 (ESA) na resolução nativa de 30 m, processado em projeção métrica SIRGAS 2000 / UTM 22S (EPSG:31982). Todas as derivadas topográficas — declividade, curvatura de perfil, curvatura plana, área de contribuição específica e TWI — são calculadas na grade nativa de 30 m. É PROIBIDO reamostrar o MDE para grade mais fina: a área de contribuição específica e o fator LS são grandezas dependentes de escala, e reamostrar produziria valores diferentes sem informação nova, sob selo 'medido'. A resolução da fonte é registrada na proveniência de cada variável derivada.",
    justificativa:
      "Não existe MDE gratuito de resolução superior a 30 m com cobertura da Bacia do Paraná 3: o Copernicus EEA-10 (10 m) cobre apenas território europeu, e NASADEM, AW3D30 e FABDEM são igualmente de 30 m. O TOPODATA (INPE) tem 30 m nominais reamostrados de 90 m, ou seja, menor conteúdo real na mesma grade. Limitação declarada e assumida: terraços agrícolas espaçados a 15-40 m no Oeste do Paraná são sub-pixel a 30 m, o que sustenta P = 1,0 na linha de base RUSLE e o selo 'modelado' no fator LS. Desencontro de escala declarado em relação a D06: a unidade de predição é o pixel de 10 m do Sentinel-2, de modo que um único valor de terreno abrange 9 pixels de predição e validação. Esta decisão é expressamente revisável: obtida fonte de resolução superior com cobertura do recorte — o MDT da cartografia base 1:10.000 do ITCG/IAT é o candidato a verificar —, a substituição é feita sem alteração arquitetural, porque a resolução está registrada na proveniência e não embutida em constante de código.",
    referencia:
      "ESA Copernicus DEM GLO-30; Zevenbergen & Thorne (1987) para curvaturas; Beven & Kirkby (1979) para TWI; Desmet & Govers (1996) para dependência de escala de As; docs/auditorias/Relatorio_Auditoria_Integral_Coerencia_Efetividade_2026-09-26.md, achado A3",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-27",
  },
  D22: {
    id: "D22",
    titulo: "Fator P derivado de observação de campo, estratificado por declividade",
    estado: "decidida" as EstadoDecisao,
    valor:
      "Nos pontos com visita de campo, o Fator P deixa de ser a constante tabelada 1,0 e passa a ser derivado da combinação entre as variáveis observadas pelo SAREL Coletor (sentido_plantio, presenca_terraco, estado_conservacao_terraco) e a declividade medida. TABELA ADOTADA (valores PROVISÓRIOS — ver ressalva na justificativa), por intervalo de declividade em %: [1,0-2,0] morro abaixo 1,00 / contorno 0,60 / faixas 0,30 / terraceamento 0,12; [2,1-7,0] 1,00 / 0,50 / 0,25 / 0,10; [7,1-12,0] 1,00 / 0,60 / 0,30 / 0,12; [12,1-18,0] 1,00 / 0,80 / 0,40 / 0,16; [18,1-24,0] 1,00 / 0,90 / 0,45 / 0,18; [>24,0] 1,00 / 0,95 / 0,50 / 0,20. REGRAS DE MAPEAMENTO: sentido_plantio 'morro_abaixo' usa a coluna Morro Abaixo; 'em_nivel' sem terraço usa Contorno; 'em_nivel' com terraço em bom estado de conservação usa Terraceamento associado ao Contorno; 'em_gradiente' usa 1,00 por decisão conservadora, por não constar da tabela; terraço 'assoreado' ou 'rompido' é tratado como AUSENTE, pois terraço rompido não reduz perda de solo, com a condição preservada no dado; terraço combinado a plantio morro abaixo usa a coluna Contorno, não a de Terraceamento, porque o valor tabelado de terraceamento pressupõe associação ao contorno. A coluna 'Cultivo em Faixas' não é utilizável, pois o app não coleta essa prática. Onde NÃO houver visita de campo, P permanece tabelado em 1,0, por prática desconhecida. O selo de proveniência de todo P derivado desta tabela deve declarar o status provisório no campo 'tabela'.",
    justificativa:
      "RESSALVA DE PROCEDÊNCIA, REGISTRADA A PEDIDO DO PESQUISADOR: os coeficientes acima vieram de uma saída de modelo de inteligência artificial, atribuída a 'Bertoni & Lombardi Neto / Wischmeier & Smith adaptados', e AINDA NÃO FORAM CONFERIDOS CONTRA A FONTE PRIMÁRIA. São adotados em caráter provisório até que o pesquisador localize o original. Dois elementos sustentam a adoção provisória: a tabela é internamente coerente, com faixas equivalendo a 0,50 vezes o contorno e terraceamento a 0,20 vezes o contorno em todas as classes de declividade, que é a estrutura multiplicativa canônica de Wischmeier & Smith (1978, Handbook 537); e uma fonte secundária independente (artigo ABRHidro citando Lombardi Neto, 1990) confirma os valores de 1,0 para morro abaixo e 0,5 para contorno. Os intervalos de declividade divergem dos de Wischmeier & Smith original, o que é compatível com a designação 'adaptados'. AUSÊNCIA DE DUPLA CONTAGEM: na RUSLE o efeito do terraceamento costuma ser atribuído ao fator LS, por encurtamento do comprimento de rampa, o que criaria dupla contagem se também entrasse em P. Isso NÃO ocorre aqui, porque D21 fixa o MDE em Copernicus GLO-30 a 30 m, resolução em que terraços espaçados de 15 a 40 m são sub-pixel: o comprimento de rampa derivado do MDE não enxerga o terraço e usa a vertente inteira, de modo que P é o único lugar onde o efeito pode ser contabilizado. CONDICIONAL EXPRESSA: se D21 for revista e adotado MDE que resolva terraços — o MDT 1:10.000 do ITCG é o candidato —, a componente de terraceamento deve SAIR de P, sob pena de dupla contagem. Decisão conservadora em 'em_gradiente': na ausência de coeficiente verificado adota-se 1,00, porque para um instrumento de risco superestimar a perda é a direção segura.",
    referencia:
      "Wischmeier & Smith (1978), USDA Agriculture Handbook 537 (estrutura multiplicativa); Bertoni & Lombardi Neto, Conservação do Solo (fonte primária a conferir); Lombardi Neto (1990) apud ABRHidro (valores de 1,0 e 0,5 confirmados em fonte secundária); Renard et al. (1997), Handbook 703; modelo de dados do SAREL Coletor",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-27",
  },
  D23: {
    id: "D23",
    titulo: "Regime amostral: estratificação desproporcional com probabilidade de inclusão registrada",
    estado: "decidida" as EstadoDecisao,
    valor:
      "Amostragem ESTRATIFICADA DESPROPORCIONAL com a probabilidade de inclusão pi_i REGISTRADA POR UNIDADE SORTEADA, substituindo o balanceamento 50/50 que constava do relatório comparativo e nunca foi implementado. A UNIDADE DE SORTEIO PRIMÁRIA É O POLÍGONO DE VANT, não o ponto: 36 polígonos de 10 ha, dois por estrato sobre os 18 estratos de D12, conforme D16. Para cada estrato h, pi_i = n_h / N_h, com n_h e N_h registrados junto do sorteio. ÂNCORA DE PREVALÊNCIA: 60 a 80 pontos de campo dispersos, fora dos polígonos, sorteados com pi_i conhecido, que estimam a prevalência real por estimador ponderado por 1/pi_i (Horvitz-Thompson) com precisão esperada de cerca de mais ou menos 0,08. A campanha da âncora é executada em DUAS ONDAS: os primeiros 30 pontos funcionam como LOTE PILOTO, validando o protocolo de campo, entregando a primeira estimativa de prevalência e medindo a acurácia posicional efetiva do aparelho no terreno real, que calibra a faixa intermediária de P03; os demais completam a precisão após revisão. REGRAS DE INFERÊNCIA: toda afirmação sobre a Bacia do Paraná 3 — área afetada, prevalência, acurácia do mapa — usa os estimadores estratificados de Olofsson et al. (2014), com intervalo de confiança e com o n EFETIVO declarado, jamais a contagem bruta de pixels ou de células; toda probabilidade predita exige CORREÇÃO A PRIORI (King & Zeng, 2001) ancorada na prevalência estimada. A métrica primária de D26, correlação de postos, é reportada sem correção por ser independente de prevalência.",
    justificativa:
      "O balanceamento 50/50 é um caso particular com razão arbitrária e não justificada; a estratificação desproporcional com pi_i registrado o domina, porque entrega as duas inferências ao mesmo tempo. Treinar na amostra desproporcional é eficiente: King & Zeng (2001) demonstram que sobreamostrar o evento raro e subamostrar os não-eventos economiza até 99% do custo de coleta sem perda de validade, desde que a correção a priori seja aplicada; e registrar pi_i preserva a inferência populacional, que uma amostra desbalanceada sem pesos destrói. O que sobrevive e o que não sobrevive ao desbalanceamento precisa estar explícito, porque a distinção é fonte comum de erro: a correlação de postos e a AUC sobrevivem, por dependerem apenas da ordenação; a probabilidade predita, a acurácia, a precisão e o kappa NÃO sobrevivem, por dependerem de prevalência. MUDANÇA DA UNIDADE DE SORTEIO: a versão anterior desta decisão foi registrada quando a unidade era o ponto; com a inversão de papéis formalizada em D16, a unidade primária passa a ser o polígono, e a lógica de pi_i se aplica igualmente, apenas trocando a população amostrada de pontos candidatos para polígonos candidatos dentro de cada estrato. DIMENSIONAMENTO DA ÂNCORA: a precisão da estimativa de prevalência foi calculada e é o que determina o tamanho. Para prevalência real em torno de 0,15, sessenta a oitenta pontos entregam mais ou menos 0,08, ao passo que alcançar mais ou menos 0,05 exigiria cerca de 196 pontos. Aceitou-se a precisão menor porque a prevalência entra apenas na correção a priori, que afeta CALIBRAÇÃO de probabilidade e não ORDENAÇÃO, e a métrica primária desta pesquisa é de ordenação. O lote piloto foi fundido à primeira onda da âncora em lugar de constituir amostra separada, porque a aposentadoria da fotointerpretação (D16) eliminou uma das quatro funções que ele originalmente cumpria, e as três restantes são cumpridas pelos próprios pontos da âncora.",
    referencia:
      "King, G. & Zeng, L. (2001), Political Analysis 9:137-163; Olofsson, P. et al. (2014), Remote Sensing of Environment 148:42-57; Cochran (1977), Sampling Techniques; D12 (estratos), D16 (campanha), D26 (alvo); docs/auditorias/Relatorio_Auditoria_Integral_Coerencia_Efetividade_2026-09-26.md",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-27",
  },
  D26: {
    id: "D26",
    titulo: "Alvo do modelo treinado por delineação de VANT: fração contínua com binário derivado",
    estado: "decidida" as EstadoDecisao,
    valor:
      "ALVO PRIMÁRIO: fração contínua da área da célula de 10 m delineada como erodida, no intervalo [0, 1], obtida por rasterização da delineação vetorial feita sobre o ortomosaico. A ~4 cm de GSD cada célula de 10 m contém cerca de 62.500 micropixels de VANT, e um polígono de 10 ha contém 1.000 células. TRATAMENTO DA INFLAÇÃO DE ZEROS: a maioria das células é 0, de modo que o ajuste usa objetivo apropriado a variável contínua não-negativa com excesso de zeros — em XGBoost, 'reg:tweedie'. MÉTRICA PRIMÁRIA DE COMPARAÇÃO: correlação de postos de Spearman entre o valor predito e a fração observada, aplicada igualmente aos três competidores de D24, por ser independente de prevalência e por permitir comparação direta com a linha de base RUSLE, que também prediz quantidade contínua. ALVO BINÁRIO DERIVADO: célula classificada como positiva quando a fração erodida for maior ou igual a 25% — isto é, 25 m² de superfície erodida numa célula de 100 m². O binário é SECUNDÁRIO e destina-se a três usos: compatibilidade com os rótulos ordinais de campo e fotointerpretação regidos por D03, reporte de AUC comparável à literatura, e o critério de refutação de D25. RELAÇÃO COM D03: D03 permanece vigente e governa os rótulos de campo e de fotointerpretação, intrinsecamente ordinais; D26 governa os rótulos de VANT, intrinsecamente contínuos. Duas fontes de rótulo, duas representações naturais, mapeamento declarado entre elas. A hierarquia entre alvo primário e secundário é fixada nesta data e NÃO pode ser invertida após a observação de resultados.",
    justificativa:
      "Dicotomizar variável contínua descarta informação, e a literatura estatística é enfática a respeito (Altman & Royston, 2006; Royston, Altman & Sauerbrei, 2006). No caso desta pesquisa o argumento pesa mais que o usual, porque informação por observação é precisamente o recurso escasso: D24 registra que o regime de dados está entre 5 e 15 vezes abaixo do recomendado para ensembles de árvores. Adotar a fração contínua é a única alteração de desenho discutida que AUMENTA a informação disponível sem aumentar a coleta — a delineação vetorial já produz a fração, e binarizá-la seria descartá-la de graça. Há ainda uma convergência decisiva com a hipótese central: a linha de base RUSLE prediz quantidade contínua em toneladas por hectare por ano, de modo que compará-la a um classificador binário exigiria limiarizá-la ou reduzi-la a mero ordenador; com alvo contínuo a comparação entre os três competidores torna-se direta por correlação de postos. O limiar de 25% para o binário derivado foi escolhido entre os extremos: a maioria simples, acima de 50%, descartaria como negativas as células mistas, que são justamente onde a erosão laminar incipiente se manifesta; e qualquer presença acima de zero faria uma mancha de 1 m² positivar uma célula de 100 m². Vinte e cinco por cento correspondem a 25 m² de superfície erodida contígua ou dispersa dentro da célula, extensão fisicamente significativa e detectável. A cifra por vezes citada de que a dicotomização equivale a descartar cerca de um terço da amostra, atribuída a Cohen (1983), NÃO foi conferida contra a fonte primária e é registrada aqui apenas como ordem de grandeza.",
    referencia:
      "Altman, D. G. & Royston, P. (2006), BMJ 332(7549):1080; Royston, P., Altman, D. G. & Sauerbrei, W. (2006), Statistics in Medicine; docs/verificacoes/voo/cobertura_voos.geojson (GSD medido de 3,59 e 3,96 cm nas missões existentes); van der Ploeg, Austin & Steyerberg (2014) para o regime de dados",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-27",
  },
};

export const PARAMETROS: Record<string, Decisao<any>> = {
  P01: {
    id: "P01",
    titulo: "Aresta do bloco espacial",
    estado: "proposta" as EstadoDecisao,
    justificativa: "Derivada do alcance do variograma empírico; fallback provisório de 20 km",
    referencia: "Roberts et al. (2017)",
  },
  P02: {
    id: "P02",
    titulo: "Espaçamento mínimo do thinning",
    estado: "decidida" as EstadoDecisao,
    // Valor em METROS. O consumidor (select-candidates/route.ts) trata numero >= 100 como metros.
    // Nao usar string: "1.000 m" seria lido por parseFloat como 1 metro.
    valor: 1000,
    justificativa:
      "Piso absoluto de 1.000 m para o espaçamento geodésico mínimo entre pontos amostrais, aplicado como limite inferior inviolável do relaxamento iterativo do thinning. O raio de partida permanece em 5.000 m e pode ser reduzido para atingir a meta de pool, mas nunca abaixo deste piso. Substitui o literal de 800 m que vigorava no laço de relaxamento e que furava silenciosamente o próprio parâmetro herdado, afrouxando a independência espacial da amostra para acomodar o tamanho do pool (achado C4 da auditoria integral de 26/09/2026). O thinning controla a autocorrelação espacial entre unidades amostrais e é anterior e independente da aresta do bloco espacial (P01), que governa as dobras da validação cruzada.",
    referencia:
      "Herdado do Localizador de Erosão (SAREL 1) para dispersão espacial; docs/auditorias/Relatorio_Auditoria_Integral_Coerencia_Efetividade_2026-09-26.md, achado C4",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-27",
  },
  P03: {
    id: "P03",
    titulo: "Critério de casamento geodésico de campo com o ponto planejado",
    estado: "decidida" as EstadoDecisao,
    valor:
      "Três critérios independentes, substituindo o limiar único anterior de 15/25 m. (a) TETO DE ERRO GROSSEIRO: 30 m entre a coordenada observada e a planejada; acima disso o registro é rejeitado, por indicar ponto errado visitado ou código digitado errado, não qualidade de posicionamento. (b) CRITÉRIO DE INTEGRIDADE: o ponto observado deve permanecer no mesmo estrato (tercil S^, tercil E^ e nivelK) do ponto sorteado, verificado por reextração das covariáveis na coordenada observada; falha aqui invalida a amostra mesmo dentro dos 30 m. (c) TRAVA DE QUALIDADE POSICIONAL: acurácia GNSS declarada pelo aparelho de até 5 m (meio pixel) é aceita; de 5 a 10 m é aceita com marcação de qualidade que acompanha o registro; acima de 10 m é rejeitada e o ponto deve ser remedido em campo. As features são extraídas na COORDENADA OBSERVADA, nunca na planejada.",
    justificativa:
      "O limiar único anterior confundia três fontes de erro distintas. Primeira: o deslocamento entre o planejado e o observado é conhecido e corrigível — basta extrair as features onde o observador esteve, o que elimina o problema de atribuição em vez de tolerá-lo. Segunda: a incerteza posicional do GNSS é desconhecida e irredutível sem melhor equipamento, e é ela que limita a atribuição ao pixel; medido para pixel de 10 m com erro gaussiano isotrópico, o acerto é de 57,9% a sigma de 3 m, 37,2% a 5 m e 19,6% a 8 m, faixa típica de GNSS de frequência única em campo aberto. Terceira: a pertinência ao estrato é o que a amostragem estratificada realmente exige, e é diretamente verificável — em relevo dissecado o tercil de declividade muda em 10 m, enquanto em chapadão uniforme 30 m não alteram nada, de modo que nenhum limiar métrico único serve aos dois casos. A faixa intermediária de 5 a 10 m foi adotada em lugar de corte seco porque o Galaxy M13 entrega tipicamente 3 a 8 m: cortar em 5 m rejeitaria parcela grande do trabalho de campo. O registro entra com a acurácia gravada, e a decisão de excluir ou ponderar a faixa intermediária é tomada depois, sobre a distribuição empírica obtida no lote piloto. A incoerência anterior fica registrada: os 15 m nominais equivaliam a 1,5 pixel e os 25 m a 2,5 pixels, de modo que a tolerância nominal já garantia a atribuição a pixel vizinho que a própria justificativa dizia querer evitar.",
    referencia:
      "Congalton & Green (2019); LUCAS Survey (2022); Metodologia PPGTCA 2026, Seção 3.3; docs/auditorias/Relatorio_Auditoria_Integral_Coerencia_Efetividade_2026-09-26.md; medições de atribuição de pixel registradas em 2026-09-27",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-27",
  },
  P04: {
    id: "P04",
    titulo: "Buffers de exclusão (água 30m, urbano 150m, ocorrência água 10%)",
    estado: "proposta" as EstadoDecisao,
    justificativa: "Constantes herdadas de eligibilityConstants.ts",
  },
  P05: {
    id: "P05",
    titulo: "Classes elegíveis do ESA WorldCover (30, 40, 60)",
    estado: "proposta" as EstadoDecisao,
    justificativa: "Classes agrícolas e campestres conforme planejamento v3",
  },
  P06: {
    id: "P06",
    titulo: "Fração limpa mínima (UDM2) na AOI do ponto",
    estado: "pendente" as EstadoDecisao,
  },
  P07: {
    id: "P07",
    titulo: "Semente aleatória da amostragem",
    estado: "decidida" as EstadoDecisao,
    valor: "dinamica-registrada",
    justificativa: "Registrada a cada execução para permitir reprodutibilidade exata",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-08",
  },
  P08: {
    id: "P08",
    titulo: "Limiar do alerta visual de baixa variância",
    estado: "proposta" as EstadoDecisao,
    justificativa: "Alerta visual informativo quando desvio padrão for baixo",
  },
  P09: {
    id: "P09",
    titulo: "Método de máscara de nuvem Sentinel-2 (QA60 / SCL)",
    estado: "proposta" as EstadoDecisao,
    justificativa: "maskS2Clouds sem unmask em bandas físicas",
  },
};

export const REGISTRO_DECISOES = DECISOES;
