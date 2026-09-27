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
    titulo: "Escala do rótulo (binária ou ordinal)",
    estado: "decidida" as EstadoDecisao,
    valor: "Binária (0: Controle/Não-Erosão, 1: Erosão Laminar Ativa)",
    justificativa: "Classificação supervisionada com XGBoost binary:logistic e validação de alta resolução.",
    referencia: "Metodologia PPGTCA 2026, Seções 3.1 e 5",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-13",
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
    titulo: "Ciclo da cota Planet: mensal ou total",
    estado: "pendente" as EstadoDecisao,
    justificativa: "Proposta estruturada: controle de cota acumulado sobre o volume total de área acadêmica contratada.",
    referencia: "Planet Labs Education & Research Program",
  },
  D18: {
    id: "D18",
    titulo: "Buffer do recorte Planet (recomendado 250m)",
    estado: "pendente" as EstadoDecisao,
    justificativa: "Proposta estruturada: raio de buffer de 250 m (~19,6 ha) ao redor do centróide amostral para cobrir a encosta do talhão.",
    referencia: "Planejamento V3, §10.4",
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
    titulo: "Raio de casamento geodésico Kobo com ponto planejado",
    estado: "decidida" as EstadoDecisao,
    valor: "15 m nominal (tolerância ampliada de até 25 m sob aviso de qualidade; rejeição estrita se > 25 m)",
    justificativa: "Readequado de 150 m para 15 m (1,5 pixel do Sentinel-2), compatível com a escala do pixel de 10 m e a acurácia de GPS/GNSS de navegação em campo (3 a 8 m). Margem ampliada de até 25 m cobre barreiras físicas (cercas, terraços), enquanto desvios acima de 25 m são rejeitados para evitar descaracterização da feição de erosão laminar ou atribuição a pixels vizinhos.",
    referencia: "Congalton & Green (2019); LUCAS Survey (2022); Metodologia PPGTCA 2026, Seção 3.3",
    decididoPor: "pesquisador",
    decididoEm: "2026-09-22",
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
