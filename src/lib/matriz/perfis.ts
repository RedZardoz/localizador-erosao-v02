export type PerfilExportacao =
  | "planilha"
  | "interpretacao-cega"
  | "campo-cego"
  | "voo-cego"
  | "autorizacao"
  | "matriz-treino"
  | "matriz-heldout"
  | "linha-de-base-rusle"
  | "geojson-pontos";

export interface DeclaracaoAlvo {
  coluna: string;
  papel: "primario" | "secundario" | "escala_origem";
  decisaoId: string;
  descricao: string;
}

/**
 * Declaração formal e explícita dos alvos da modelagem matricial supervisionada (PPGTCA 2026).
 * Cada entrada vincula o papel do alvo à respectiva decisão metodológica que o pré-registra.
 */
export const DECLARACAO_ALVOS_MATRIZ: readonly DeclaracaoAlvo[] = [
  {
    coluna: "Fracao_Erodida",
    papel: "primario",
    decisaoId: "D26",
    descricao: "Alvo primário contínuo em [0, 1] sob D26 (reg:tweedie)",
  },
  {
    coluna: "Classe_Alvo_Binaria",
    papel: "secundario",
    decisaoId: "D03",
    descricao: "Desfecho secundário binário de classificação supervisionada sob D03",
  },
  {
    coluna: "Rotulo_Classe",
    papel: "escala_origem",
    decisaoId: "D03",
    descricao: "Escala ordinal de origem do rótulo sob D03 (base da análise de sensibilidade pré-registrada)",
  },
] as const;

export const COLUNAS_ALVO_MATRIZ: readonly string[] = DECLARACAO_ALVOS_MATRIZ.map((a) => a.coluna);

export interface DeclaracaoChave {
  coluna: string;
  categoria:
    | "identificador"
    | "desenho_amostral"
    | "geometria_celula"
    | "modelo_janela"
    | "metadado_rotulo";
  descricao: string;
}

export const DECLARACAO_CHAVES_MATRIZ: readonly DeclaracaoChave[] = [
  {
    coluna: "Celula_ID",
    categoria: "identificador",
    descricao: "Identificador opaco da célula de 10 m (D06/D16/D26)",
  },
  {
    coluna: "Poligono_ID",
    categoria: "identificador",
    descricao: "Unidade de agrupamento/cluster do desenho (D24 mitigação 4; D25 bootstrap)",
  },
  {
    coluna: "Pixel_ID",
    categoria: "identificador",
    descricao: "Identificador opaco do pixel Sentinel-2 para checagem de pixels disjuntos (D26)",
  },
  {
    coluna: "Papel_Conjunto",
    categoria: "desenho_amostral",
    descricao: "Partição de modelagem ('treino' | 'held-out')",
  },
  {
    coluna: "Estrato_ID",
    categoria: "desenho_amostral",
    descricao: "Identificador do estrato biofísico de D12",
  },
  {
    coluna: "Incluida",
    categoria: "geometria_celula",
    descricao: "Filtro de cobertura mínima da célula no voo (P11 / guarda D25)",
  },
  {
    coluna: "Cobertura_Celula",
    categoria: "geometria_celula",
    descricao: "Fração de cobertura da célula pelo voo em [0, 1] (D26)",
  },
  {
    coluna: "Area_Delineada_m2",
    categoria: "geometria_celula",
    descricao: "Área delineada da feição dentro da célula em m² (D26)",
  },
  {
    coluna: "Rotulo_Modalidade",
    categoria: "metadado_rotulo",
    descricao: "Modalidade de observação ('satelite' | 'drone')",
  },
  {
    coluna: "Rotulo_N_Observadores",
    categoria: "metadado_rotulo",
    descricao: "Número de observadores independentes que rotularam a feição",
  },
] as const;

export const COLUNAS_CHAVE_MATRIZ: readonly string[] = DECLARACAO_CHAVES_MATRIZ.map(
  (c) => c.coluna
);


export const JANELA_TEMPORAL_D05 = {
  inicio: "2016-01-01",
  fim: "2026-06-30",
} as const;

export const PERFIS_EXPORTACAO: Record<PerfilExportacao, { descricao: string; colunasPermitidas: string[] }> = {
  planilha: {
    descricao: "Planilha para o pesquisador e dissertação",
    colunasPermitidas: [
      "Ponto_ID",
      "Codigo",
      "Latitude",
      "Longitude",
      "Latitude_DMS",
      "Longitude_DMS",
      "Municipio",
      "Municipio_Origem",
      "Codigo_IBGE",
      "Codigo_IBGE_Origem",
      "Bacia_Hidrografica",
      "Bacia_Hidrografica_Origem",
      "Bloco_Espacial",
      "Estrato_ID",
      "Elevacao_m",
      "Elevacao_m_Origem",
      "Declividade_pct",
      "Declividade_pct_Origem",
      "Declividade_graus",
      "Declividade_graus_Origem",
      "Curvatura_Perfil",
      "Curvatura_Perfil_Origem",
      "Curvatura_Plana",
      "Curvatura_Plana_Origem",
      "Acumulo_Fluxo",
      "Acumulo_Fluxo_Origem",
      "TWI",
      "TWI_Origem",
      "Ordem_Solo",
      "Ordem_Solo_Origem",
      "Subordem_Solo",
      "Subordem_Solo_Origem",
      "Grande_Grupo_Solo",
      "Grande_Grupo_Solo_Origem",
      "Tipo_Unidade_Solo",
      "Tipo_Unidade_Solo_Origem",
      "Confianca_Pedologica",
      "Erodibilidade_Classe",
      "Erodibilidade_Classe_Origem",
      "Marcador_K_Ambiguo_D08",
      "Marcador_K_Ambiguo_D08_Origem",
      "Unidade_Determinante_K_2024_CodUm",
      "Unidade_Determinante_K_2024_OgcFid",
      "Unidade_Determinante_K_2024_ErodUm",
      "Frequencia_Solo_Nu",
      "Frequencia_Solo_Nu_Origem",
      "NDVI",
      "NDVI_Origem",
      "BSI",
      "BSI_Origem",
      "Precip_Acum_30d_mm",
      "Precip_Acum_30d_mm_Origem",
      "Precip_Acum_90d_mm",
      "Precip_Acum_90d_mm_Origem",
      "I30_Max_mm_h",
      "I30_Max_mm_h_Origem",
      "N_Eventos_Erosivos",
      "N_Eventos_Erosivos_Origem",
      "Indice_Mecanismo",
      "Indice_Mecanismo_Origem",
      "Rotulo_Classe",
      "Rotulo_Modalidade",
      "Rotulo_Observador",
      "Rotulo_Observado_Em",
      "Rotulo_Confianca",
      "Rotulo_Kappa",
      "Rotulo_Divergencia",
      "CAR_Codigo",
      "CAR_Status",
      "Titular_Mascarado",
      "Documento_Mascarado",
      "Area_Imovel_ha",
      "RUSLE_Fator_R",
      "RUSLE_Fator_R_Origem",
      "RUSLE_Fator_K",
      "RUSLE_Fator_K_Origem",
      "RUSLE_Fator_LS",
      "RUSLE_Fator_LS_Origem",
      "RUSLE_Fator_C",
      "RUSLE_Fator_C_Origem",
      "RUSLE_Fator_P",
      "RUSLE_Fator_P_Origem",
      "RUSLE_Perda_Solo_t_ha_ano",
      "RUSLE_Perda_Solo_t_ha_ano_Origem",
      "RUSLE_Memoria_Calculo",
      "Campos_Estimados",
      "Rastreio_Versao_Motor",
      "Rastreio_Cenas",
      "Rastreio_Calculado_Em",
    ],
  },
  "interpretacao-cega": {
    descricao: "Plano cego para intérpretes da Fase A",
    colunasPermitidas: [
      "Codigo",
      "Latitude",
      "Longitude",
      "Janela_Inicio",
      "Janela_Fim",
      "Referencia_Cena_Tile",
    ],
  },
  "campo-cego": {
    descricao: "Plano cego para equipe de campo da Fase B",
    colunasPermitidas: [
      "Codigo",
      "Latitude",
      "Longitude",
      "Latitude_DMS",
      "Longitude_DMS",
      "Municipio",
      "Status_Fundiario",
      "Motivo_Acesso",
      "Codigo_CAR",
      "Titular_Mascarado",
      "Rota_Acesso",
    ],
  },
  "voo-cego": {
    descricao: "Plano cego para intérprete de ortomosaico de drone (Fase D)",
    colunasPermitidas: [
      "Codigo",
      "Latitude",
      "Longitude",
      "Area_Voo_Poligono",
    ],
  },
  autorizacao: {
    descricao: "Plano para contato fundiário prévio com proprietários (sem estrato biofísico)",
    colunasPermitidas: [
      "Codigo",
      "Latitude",
      "Longitude",
      "Municipio",
      "Codigo_CAR",
      "Nome_Proprietario",
      "Area_Imovel_Ha",
      "Area_Poligono_Ha",
    ],
  },
  "matriz-treino": {
    descricao: "Matriz final para modelagem supervisionada externa (PPGTCA 2026)",
    colunasPermitidas: [
      "Celula_ID",
      "Poligono_ID",
      "Papel_Conjunto",
      // A-05 — chaves do desenho amostral (selo D16). Sem elas não há avaliação estratificada,
      // inferência de D23 nem auditoria de pi_i (achados V-03 e D-02).
      "Estrato_ID",
      "Pi_i",
      "W_i",
      "N_Candidatos_Estrato",
      // A-05 / T-02 — cobertura da célula e identidade de pixel (CSV de D26). Sem elas, as guardas
      // `_so_incluidas` e `_checar_pixels_disjuntos` do avaliador D25 nunca disparam.
      "Incluida",
      "Cobertura_Celula",
      "Area_Delineada_m2",
      "Pixel_ID",
      // A-05 / V-01 — qual modelo e qual janela produziram a linha (D de detecção, P de predição).
      "Modelo",
      "Data_Referencia",
      "Fim_Janela",
      "Fracao_Erodida",
      "Rotulo_N_Observadores",
      "Ponto_ID",
      "Bloco_Espacial",
      "Elevacao_m",
      "Declividade_pct",
      "Declividade_graus",
      "Curvatura_Perfil",
      "Curvatura_Plana",
      "Acumulo_Fluxo",
      "TWI",
      "Ordem_Solo",
      "Subordem_Solo",
      "Grande_Grupo_Solo",
      "Erodibilidade_Classe",
      "Frequencia_Solo_Nu",
      "Composto_Solo_Nu_B12",
      "Composto_Solo_Nu_Razao_B4_B2",
      "Taxa_Degradacao_SWIR_Anual",
      "NDVI_P90_Serie",
      "RUSLE_Fator_K",
      "RUSLE_Fator_R",
      "Precip_Acum_30d_mm",
      "Precip_Acum_90d_mm",
      "I30_Max_mm_h",
      "N_Eventos_Erosivos",
      "Indice_Mecanismo",
      "Classe_Alvo_Binaria",
      "Rotulo_Classe",
      "Rotulo_Modalidade",
    ],
  },
  "matriz-heldout": {
    descricao: "Matriz de avaliação independente held-out (D16 / D26)",
    colunasPermitidas: [
      "Celula_ID",
      "Poligono_ID",
      "Papel_Conjunto",
      // A-05 — chaves do desenho amostral (selo D16). Sem elas não há avaliação estratificada,
      // inferência de D23 nem auditoria de pi_i (achados V-03 e D-02).
      "Estrato_ID",
      "Pi_i",
      "W_i",
      "N_Candidatos_Estrato",
      // A-05 / T-02 — cobertura da célula e identidade de pixel (CSV de D26). Sem elas, as guardas
      // `_so_incluidas` e `_checar_pixels_disjuntos` do avaliador D25 nunca disparam.
      "Incluida",
      "Cobertura_Celula",
      "Area_Delineada_m2",
      "Pixel_ID",
      // A-05 / V-01 — qual modelo e qual janela produziram a linha (D de detecção, P de predição).
      "Modelo",
      "Data_Referencia",
      "Fim_Janela",
      "Fracao_Erodida",
      "Rotulo_N_Observadores",
      "Ponto_ID",
      "Bloco_Espacial",
      "Elevacao_m",
      "Declividade_pct",
      "Declividade_graus",
      "Curvatura_Perfil",
      "Curvatura_Plana",
      "Acumulo_Fluxo",
      "TWI",
      "Ordem_Solo",
      "Subordem_Solo",
      "Grande_Grupo_Solo",
      "Erodibilidade_Classe",
      "Frequencia_Solo_Nu",
      "Composto_Solo_Nu_B12",
      "Composto_Solo_Nu_Razao_B4_B2",
      "Taxa_Degradacao_SWIR_Anual",
      "NDVI_P90_Serie",
      "RUSLE_Fator_K",
      "RUSLE_Fator_R",
      "Precip_Acum_30d_mm",
      "Precip_Acum_90d_mm",
      "I30_Max_mm_h",
      "N_Eventos_Erosivos",
      "Indice_Mecanismo",
      "Classe_Alvo_Binaria",
      "Rotulo_Classe",
      "Rotulo_Modalidade",
    ],
  },
  "linha-de-base-rusle": {
    descricao: "Linha de base física da RUSLE (D13, D14, D15)",
    colunasPermitidas: [
      "Celula_ID",
      "RUSLE_Fator_R",
      "RUSLE_Fator_K",
      "RUSLE_Fator_LS",
      "RUSLE_Fator_C",
      "RUSLE_Fator_P",
      "Marcador_K_Ambiguo_D08",
      "RUSLE_A",
    ],
  },
  "geojson-pontos": {
    descricao: "Camada GeoJSON de pontos amostrais com atributos biofísicos permitidos",
    colunasPermitidas: [
      "id",
      "codigo",
      "municipio",
      "bacia",
      "altitude_dem",
      "declividade_pct",
      "solo_embrapa",
    ],
  },
};

export function obterColunasPermitidas(perfil: PerfilExportacao): string[] {
  return PERFIS_EXPORTACAO[perfil].colunasPermitidas;
}

/**
 * Perfis estritamente submetidos ao protocolo de cegamento (Invariante 2 / D16).
 */
export const PERFIS_CEGOS: readonly PerfilExportacao[] = [
  "interpretacao-cega",
  "campo-cego",
  "voo-cego",
] as const;

/**
 * Padrões de colunas terminantemente proibidas em qualquer perfil cego.
 * Lista de exclusão que barra vazamento de variáveis de desenho amostral (estrato),
 * titularidade real, documentos pessoais, probabilidades de inclusão (pi_i), pesos (w_i),
 * identificadores de candidato, partições de treino/teste e variáveis-alvo.
 */
export const PADROES_PROIBIDOS_PERFIS_CEGOS: readonly { nome: string; padrao: RegExp }[] = [
  { nome: "estrato biofísico", padrao: /estrato/i },
  { nome: "titular real do imóvel", padrao: /(?:^|_)(?:nome_?proprietario|proprietario)(?:$|_)/i },
  { nome: "titular não mascarado", padrao: /(?:^|_)titular(?!_mascarado)(?:$|_)/i },
  { nome: "documento pessoal não mascarado", padrao: /(?:^|_)documento(?!_mascarado)(?:$|_)/i },
  { nome: "documento pessoal CPF/CNPJ", padrao: /(?:^|_)(?:cpf|cnpj)(?:$|_)/i },
  { nome: "probabilidade de inclusão amostral", padrao: /(?:^|_)(?:pi|pi_i|probabilidade_?inclusao)(?:$|_)/i },
  { nome: "peso amostral", padrao: /(?:^|_)(?:peso|peso_?amostragem|w|w_i)(?:$|_)/i },
  { nome: "identificador de candidato", padrao: /candidato/i },
  { nome: "partição ou papel no conjunto de modelagem", padrao: /(?:^|_)(?:papel_?conjunto|particao|treino|heldout|held_out)(?:$|_)/i },
  { nome: "alvo ou desfecho supervisionado", padrao: /(?:^|_)(?:fracao_?erodida|classe_?alvo_?binaria|rotulo_?classe)(?:$|_)/i },
] as const;

export class ErroViolacaoCegamento extends Error {
  readonly perfil: string;
  readonly coluna: string;
  readonly motivo: string;

  constructor(perfil: string, coluna: string, motivo: string) {
    super(`[VIOLAÇÃO DE CEGAMENTO] O perfil cego '${perfil}' contém a coluna proibida '${coluna}': ${motivo}`);
    this.name = "ErroViolacaoCegamento";
    this.perfil = perfil;
    this.coluna = coluna;
    this.motivo = motivo;
  }
}

/**
 * Valida se um conjunto de colunas para um perfil cego viola o cegamento.
 * Lança ErroViolacaoCegamento na primeira ocorrência de coluna proibida.
 */
export function validarColunasCegas(perfilNome: string, colunas: readonly string[]): void {
  for (const col of colunas) {
    for (const { nome, padrao } of PADROES_PROIBIDOS_PERFIS_CEGOS) {
      if (padrao.test(col)) {
        throw new ErroViolacaoCegamento(perfilNome, col, `identifica ${nome}`);
      }
    }
  }
}

/**
 * Colunas fixadas estritamente para o perfil de autorização fundiária.
 * Contém dados para contato com proprietários, mas OMITE categoricamente o estrato biofísico.
 */
export const COLUNAS_FIXADAS_AUTORIZACAO: readonly string[] = [
  "Codigo",
  "Latitude",
  "Longitude",
  "Municipio",
  "Codigo_CAR",
  "Nome_Proprietario",
  "Area_Imovel_Ha",
  "Area_Poligono_Ha",
] as const;

/**
 * Valida as colunas do perfil autorizacao:
 * 1. O conjunto deve coincidir estritamente com COLUNAS_FIXADAS_AUTORIZACAO.
 * 2. Nenhuma coluna pode identificar estrato biofísico (/estrato/i).
 */
export function validarColunasAutorizacao(colunas: readonly string[]): void {
  for (const col of colunas) {
    if (/estrato/i.test(col)) {
      throw new ErroViolacaoCegamento(
        "autorizacao",
        col,
        "identifica estrato biofísico (omissão obrigatória sob D16 / Tarefa 2)"
      );
    }
  }
}
