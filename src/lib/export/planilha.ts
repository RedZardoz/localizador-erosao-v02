import type { PontoAmostral } from "@/types/ponto";
import { formatarDescricaoOrigem, valorOuNulo } from "@/types/proveniencia";
import { derivarCamposNaoMedidos, assegurarInvariantesArtefato, ArtefatoProjetado } from "@/lib/matriz/invariantes";
import { assegurarApenasPontosReais } from "@/lib/seguranca/guardaSintetico";
import { formatToDMS } from "./dms";
import { generateXlsxBuffer, XlsxSheet, XlsxRowValue } from "./xlsxWriter";
import type { PerfilExportacao } from "@/lib/matriz/perfis";

export const BLOCO_FUNDAMENTACAO_LGPD =
`TRATAMENTO DE DADOS PESSOAIS FUNDIÁRIOS — CONFORMIDADE LGPD (Lei nº 13.709/2018)
O presente documento e a respectiva planilha foram gerados no âmbito do projeto de pesquisa de mestrado do Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA). O tratamento de dados fundiários (código CAR, titular SNCR mascarado e localização do imóvel) fundamenta-se estritamente no Art. 7º, inciso IV da LGPD (realização de estudos por órgão de pesquisa, garantida, sempre que possível, a anonimização dos dados) e no Art. 11, inciso II, alínea 'c'.
A anonimização dos dados de titularidade é originária das bases públicas federais (SNCR/INCRA), sendo integralmente preservada sem engenharia reversa. O acesso aos dados é restrito a finalidades científicas e de autorização de campo para auditoria observacional.`;

export interface OpcoesExportacao {
  perfil?: PerfilExportacao;
  filtrosAtivos?: string[];
  janelaTemporal?: { inicio: string; fim: string };
  responsavelEmissao?: string;
}

/**
 * Monta as linhas de dados da Aba 1 (Dados) no formato de colunas duplas.
 */
export function extrairLinhasAbaDados(pontos: PontoAmostral[]): Record<string, unknown>[] {
  return pontos.map((p) => {
    const latDms = formatToDMS(p.latitude, true);
    const lngDms = formatToDMS(p.longitude, false);
    const camposNaoMedidos = derivarCamposNaoMedidos(p);

    const linha: Record<string, unknown> = {
      Ponto_ID: p.id,
      Codigo: p.codigo,
      Latitude: Number(p.latitude.toFixed(6)),
      Longitude: Number(p.longitude.toFixed(6)),
      Latitude_DMS: latDms,
      Longitude_DMS: lngDms,

      Municipio: valorOuNulo(p.localizacao?.municipio) ?? "não determinado",
      Municipio_Origem: formatarDescricaoOrigem(p.localizacao?.municipio),
      Codigo_IBGE: valorOuNulo(p.localizacao?.codigoIbge) ?? "não determinado",
      Codigo_IBGE_Origem: formatarDescricaoOrigem(p.localizacao?.codigoIbge),
      Bacia_Hidrografica: valorOuNulo(p.localizacao?.bacia) ?? "não determinado",
      Bacia_Hidrografica_Origem: formatarDescricaoOrigem(p.localizacao?.bacia),

      Bloco_Espacial: p.blocoEspacial ?? "não atribuído",
      Estrato_ID: p.estratoId,

      Elevacao_m: valorOuNulo(p.terreno?.elevacao) ?? "",
      Elevacao_m_Origem: formatarDescricaoOrigem(p.terreno?.elevacao),
      Declividade_pct: valorOuNulo(p.terreno?.declividadePct) ?? "",
      Declividade_pct_Origem: formatarDescricaoOrigem(p.terreno?.declividadePct),
      Declividade_graus: valorOuNulo(p.terreno?.declividadeGraus) ?? "",
      Declividade_graus_Origem: formatarDescricaoOrigem(p.terreno?.declividadeGraus),
      Curvatura_Perfil: valorOuNulo(p.terreno?.curvaturaPerfil) ?? "",
      Curvatura_Perfil_Origem: formatarDescricaoOrigem(p.terreno?.curvaturaPerfil),
      Curvatura_Plana: valorOuNulo(p.terreno?.curvaturaPlana) ?? "",
      Curvatura_Plana_Origem: formatarDescricaoOrigem(p.terreno?.curvaturaPlana),
      Acumulo_Fluxo: valorOuNulo(p.terreno?.acumuloFluxo) ?? "",
      Acumulo_Fluxo_Origem: formatarDescricaoOrigem(p.terreno?.acumuloFluxo),
      TWI: valorOuNulo(p.terreno?.twi) ?? "",
      TWI_Origem: formatarDescricaoOrigem(p.terreno?.twi),

      Ordem_Solo: valorOuNulo(p.solo?.ordem) ?? "não determinado",
      Ordem_Solo_Origem: formatarDescricaoOrigem(p.solo?.ordem),
      Subordem_Solo: valorOuNulo(p.solo?.subOrdem) ?? "não determinado",
      Subordem_Solo_Origem: formatarDescricaoOrigem(p.solo?.subOrdem),
      Grande_Grupo_Solo: valorOuNulo(p.solo?.grandeGrupo) ?? "não determinado",
      Grande_Grupo_Solo_Origem: formatarDescricaoOrigem(p.solo?.grandeGrupo),
      Tipo_Unidade_Solo: valorOuNulo(p.solo?.tipoUnidade) ?? "não determinado",
      Tipo_Unidade_Solo_Origem: formatarDescricaoOrigem(p.solo?.tipoUnidade),
      Confianca_Pedologica: p.solo?.confiancaPedologica ?? "indisponivel",
      Erodibilidade_Classe: valorOuNulo(p.solo?.erodibilidadeClasse) ?? "não determinado",
      Erodibilidade_Classe_Origem: formatarDescricaoOrigem(p.solo?.erodibilidadeClasse),

      Frequencia_Solo_Nu: valorOuNulo(p.temporal?.D?.serie?.frequenciaSoloNu ?? p.temporal?.P?.serie?.frequenciaSoloNu) ?? "",
      Frequencia_Solo_Nu_Origem: formatarDescricaoOrigem(p.temporal?.D?.serie?.frequenciaSoloNu ?? p.temporal?.P?.serie?.frequenciaSoloNu),

      Precip_Acum_30d_mm: valorOuNulo(p.temporal?.D?.chuva?.precipAcum30d ?? p.temporal?.P?.chuva?.precipAcum30d) ?? "",
      Precip_Acum_30d_mm_Origem: formatarDescricaoOrigem(p.temporal?.D?.chuva?.precipAcum30d ?? p.temporal?.P?.chuva?.precipAcum30d),
      Precip_Acum_90d_mm: valorOuNulo(p.temporal?.D?.chuva?.precipAcum90d ?? p.temporal?.P?.chuva?.precipAcum90d) ?? "",
      Precip_Acum_90d_mm_Origem: formatarDescricaoOrigem(p.temporal?.D?.chuva?.precipAcum90d ?? p.temporal?.P?.chuva?.precipAcum90d),
      I30_Max_mm_h: valorOuNulo(p.temporal?.D?.chuva?.i30Max ?? p.temporal?.P?.chuva?.i30Max) ?? "",
      I30_Max_mm_h_Origem: formatarDescricaoOrigem(p.temporal?.D?.chuva?.i30Max ?? p.temporal?.P?.chuva?.i30Max),
      N_Eventos_Erosivos: valorOuNulo(p.temporal?.D?.chuva?.nEventosErosivos ?? p.temporal?.P?.chuva?.nEventosErosivos) ?? "",
      N_Eventos_Erosivos_Origem: formatarDescricaoOrigem(p.temporal?.D?.chuva?.nEventosErosivos ?? p.temporal?.P?.chuva?.nEventosErosivos),
      Indice_Mecanismo: valorOuNulo(p.temporal?.D?.chuva?.indiceMecanismo ?? p.temporal?.P?.chuva?.indiceMecanismo) ?? "",
      Indice_Mecanismo_Origem: formatarDescricaoOrigem(p.temporal?.D?.chuva?.indiceMecanismo ?? p.temporal?.P?.chuva?.indiceMecanismo),

      Rotulo_Classe: p.rotulo?.final?.classe ?? "não rotulado",
      Rotulo_Modalidade: p.rotulo?.final?.modalidade ?? "não rotulado",
      Rotulo_Observador: p.rotulo?.final?.observador ?? "não informado",
      Rotulo_Observado_Em: p.rotulo?.final?.observadoEm ?? "não informado",
      Rotulo_Confianca: p.rotulo?.final?.confianca ?? "não informado",
      Rotulo_Kappa: p.rotulo?.kappa ?? "",
      Rotulo_Divergencia: p.rotulo?.divergencia ?? "nenhuma",

      CAR_Codigo: p.fundiario?.codigoCar ?? "não consultado",
      CAR_Status: p.fundiario?.status ?? "não consultado",
      Titular_Mascarado: p.fundiario?.titularMascarado ?? "não consultado",
      Documento_Mascarado: p.fundiario?.documentoMascarado ?? "não consultado",
      Area_Imovel_ha: p.fundiario?.areaImovelHa ?? "",

      RUSLE_Fator_R: valorOuNulo(p.linhaDeBase?.fatorR) ?? "",
      RUSLE_Fator_R_Origem: formatarDescricaoOrigem(p.linhaDeBase?.fatorR),
      RUSLE_Fator_K: valorOuNulo(p.linhaDeBase?.fatorK) ?? "",
      RUSLE_Fator_K_Origem: formatarDescricaoOrigem(p.linhaDeBase?.fatorK),
      RUSLE_Fator_LS: valorOuNulo(p.linhaDeBase?.fatorLS) ?? "",
      RUSLE_Fator_LS_Origem: formatarDescricaoOrigem(p.linhaDeBase?.fatorLS),
      RUSLE_Fator_C: valorOuNulo(p.linhaDeBase?.fatorC) ?? "",
      RUSLE_Fator_C_Origem: formatarDescricaoOrigem(p.linhaDeBase?.fatorC),
      RUSLE_Fator_P: valorOuNulo(p.linhaDeBase?.fatorP) ?? "",
      RUSLE_Fator_P_Origem: formatarDescricaoOrigem(p.linhaDeBase?.fatorP),
      RUSLE_Perda_Solo_t_ha_ano: valorOuNulo(p.linhaDeBase?.perdaSolo) ?? "",
      RUSLE_Perda_Solo_t_ha_ano_Origem: formatarDescricaoOrigem(p.linhaDeBase?.perdaSolo),
      RUSLE_Memoria_Calculo: p.linhaDeBase?.memoriaCalculo ?? "não calculado",

      Campos_Estimados: camposNaoMedidos.length > 0 ? camposNaoMedidos.join(", ") : "Nenhum (100% medido)",
      Rastreio_Versao_Motor: p.rastreio?.versaoMotor ?? "não informado",
      Rastreio_Cenas: p.rastreio?.cenas ? p.rastreio.cenas.join("; ") : "não informado",
      Rastreio_Calculado_Em: p.rastreio?.calculadoEm ?? "não informado",
    };

    return linha;
  });
}

/**
 * Gera a planilha XLSX completa com 3 abas, garantindo guarda e invariantes.
 */
export async function gerarPlanilhaXLSX(pontos: PontoAmostral[], opcoes: OpcoesExportacao = {}): Promise<Buffer> {
  // 1. Guarda antissintético
  assegurarApenasPontosReais(pontos, "geração de planilha XLSX");

  // 2. Extração e montagem da Aba 1
  const linhasDados = extrairLinhasAbaDados(pontos);
  const cabecalho = linhasDados.length > 0 ? Object.keys(linhasDados[0]) : [];

  // 3. Validação de Invariantes sobre o artefato projetado
  const artefato: ArtefatoProjetado = {
    perfil: opcoes.perfil ?? "planilha",
    cabecalho,
    linhas: linhasDados,
  };
  assegurarInvariantesArtefato(artefato);

  // 4. Montagem das abas
  const rowsDados: XlsxRowValue[][] = [];
  rowsDados.push(cabecalho.map((col) => ({ value: col, bold: true })));
  for (const linha of linhasDados) {
    rowsDados.push(cabecalho.map((col) => linha[col] as XlsxRowValue));
  }

  const sheet1: XlsxSheet = {
    name: "Dados",
    rows: rowsDados,
    freezeHeader: true,
  };

  // Aba 2 — Procedência e Conformidade
  const rowsProc: XlsxRowValue[][] = [
    [{ value: "METADADO", bold: true }, { value: "VALOR / DESCRIÇÃO", bold: true }],
    ["Data e Hora de Emissão", new Date().toISOString()],
    ["Total de Pontos Amostrais", pontos.length],
    ["Perfil de Exportação", opcoes.perfil ?? "planilha"],
    ["Filtros Ativos", opcoes.filtrosAtivos ? opcoes.filtrosAtivos.join("; ") : "Nenhum filtro restritivo"],
    ["Janela Temporal", opcoes.janelaTemporal ? `${opcoes.janelaTemporal.inicio} a ${opcoes.janelaTemporal.fim}` : "2019 a 2025"],
    ["", ""],
    [{ value: "BASES DISPONÍVEIS NESTA INSTALAÇÃO", bold: true }, { value: "DETALHAMENTO TÉCNICO", bold: true }],
    ["1. Relevo e Terreno", "COPERNICUS/DEM/GLO30 (Projeção métrica EPSG:31982)"],
    ["2. Pedologia", "Embrapa GeoInfo (parana_solos_20201105)"],
    ["3. Sensoriamento Óptico", "Copernicus Sentinel-2 L2A (BOA)"],
    ["4. Pluviometria e Clima", "CHIRPS Diário e GPM IMERG"],
    ["", ""],
    [{ value: "FUNDAMENTAÇÃO LGPD", bold: true }, BLOCO_FUNDAMENTACAO_LGPD],
  ];

  const sheet2: XlsxSheet = {
    name: "Procedência e Conformidade",
    rows: rowsProc,
    freezeHeader: true,
  };

  // Aba 3 — Qualidade do Dado
  const rowsQual: XlsxRowValue[][] = [
    [
      { value: "Variável", bold: true },
      { value: "% Medido", bold: true },
      { value: "% Modelado", bold: true },
      { value: "% Tabelado", bold: true },
      { value: "% Indisponível", bold: true },
    ],
  ];

  const total = pontos.length;
  if (total > 0) {
    const varsMedidas = [
      { nome: "Elevação", obter: (p: PontoAmostral) => p.terreno?.elevacao },
      { nome: "Declividade %", obter: (p: PontoAmostral) => p.terreno?.declividadePct },
      { nome: "Ordem do Solo", obter: (p: PontoAmostral) => p.solo?.ordem },
      { nome: "Erodibilidade", obter: (p: PontoAmostral) => p.solo?.erodibilidadeClasse },
    ];

    for (const v of varsMedidas) {
      let med = 0, mod = 0, tab = 0, ind = 0;
      for (const p of pontos) {
        const prov = v.obter(p);
        if (!prov || prov.estado === "indisponivel") ind++;
        else if (prov.estado === "medido") med++;
        else if (prov.estado === "modelado") mod++;
        else if (prov.estado === "tabelado") tab++;
      }
      rowsQual.push([
        v.nome,
        Number(((med / total) * 100).toFixed(1)),
        Number(((mod / total) * 100).toFixed(1)),
        Number(((tab / total) * 100).toFixed(1)),
        Number(((ind / total) * 100).toFixed(1)),
      ]);
    }
  }

  const sheet3: XlsxSheet = {
    name: "Qualidade do Dado",
    rows: rowsQual,
    freezeHeader: true,
  };

  return generateXlsxBuffer([sheet1, sheet2, sheet3]);
}
