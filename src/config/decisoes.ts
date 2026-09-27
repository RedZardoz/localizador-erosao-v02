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
    titulo: "Campanha de campo e voos de drone de alta resolução",
    estado: "decidida" as EstadoDecisao,
    valor: "4 sítios contínuos de referência territorial (10 a 50 ha cada) em Céu Azul e Medianeira voados com o VANT Multiespectral Spectral 2 (Nuvem UAV, 5 bandas, PPK/RTK) mantidos estritamente como held-out, combinados com 120 a 180 pontos de inspeção presencial via formulário KoboCollect sob protocolo cego.",
    justificativa: "Garante cobertura exaustiva da variabilidade pedológica e topográfica da Bacia do Paraná 3, respeitando as restrições logísticas de campo e preservando a segregação cega de dados.",
    referencia: "Metodologia PPGTCA 2026, Seções 3.2 e 3.3",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-22",
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
