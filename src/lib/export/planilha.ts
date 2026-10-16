import type { PontoAmostral } from "@/types/ponto";
import type { RotuloConsolidado } from "@/types/rotulo";
import { formatarDescricaoOrigem, valorOuNulo } from "@/types/proveniencia";
import { derivarCamposNaoMedidos, assegurarInvariantesArtefato, ArtefatoProjetado } from "@/lib/matriz/invariantes";
import { montarMatrizTreino } from "@/lib/matriz/montagem";
import { assegurarSegregacaoTreino } from "@/lib/rotulos/ingestaoDrone";
import { assegurarApenasPontosReais } from "@/lib/seguranca/guardaSintetico";
import { formatToDMS } from "./dms";
import { generateXlsxBuffer, XlsxSheet, XlsxRowValue } from "./xlsxWriter";
import { JANELA_TEMPORAL_D05, type PerfilExportacao } from "@/lib/matriz/perfis";
import { validarMascaraTitularSncr, mascararDocumentoPessoal } from "@/lib/fundiario/protecao";

export const BLOCO_FUNDAMENTACAO_LGPD =
`TRATAMENTO DE DADOS PESSOAIS FUNDIÁRIOS — CONFORMIDADE LGPD (Lei nº 13.709/2018)
O presente documento e a respectiva planilha foram gerados no âmbito do projeto de pesquisa de mestrado do Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA). O tratamento de dados fundiários (código CAR, titular SNCR mascarado e localização do imóvel) fundamenta-se estritamente no Art. 7º, inciso IV da LGPD (realização de estudos por órgão de pesquisa, garantida, sempre que possível, a anonimização dos dados) e no Art. 11, inciso II, alínea 'c'.
A anonimização dos dados de titularidade é originária das bases públicas federais (SNCR/INCRA), sendo integralmente preservada sem engenharia reversa. O acesso aos dados é restrito a finalidades científicas e de autorização de campo para auditoria observacional.`;

export interface OpcoesExportacao {
  perfil?: PerfilExportacao;
  rotulosConsolidados?: Record<string, RotuloConsolidado>;
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
      Marcador_K_Ambiguo_D08: String(p.solo?.kAmbiguoAssociacao ?? p.kAmbiguoAssociacao ?? "indisponivel"),
      Marcador_K_Ambiguo_D08_Origem: formatarDescricaoOrigem(p.solo?.kAmbiguoAssociacaoProveniencia),
      Unidade_Determinante_K_2024_CodUm:
        (p.criterioSelecao?.unidadeDeterminanteK2024?.codUm2 ||
          p.criterioSelecao?.unidadeDeterminanteK2024?.codUm ||
          p.solo?.unidadeDeterminanteK2024?.codUm2 ||
          p.solo?.unidadeDeterminanteK2024?.codUm) ??
        "não determinado",
      Unidade_Determinante_K_2024_OgcFid:
        (p.criterioSelecao?.unidadeDeterminanteK2024?.ogcFid ??
          p.solo?.unidadeDeterminanteK2024?.ogcFid) ??
        "",
      Unidade_Determinante_K_2024_ErodUm:
        (p.criterioSelecao?.unidadeDeterminanteK2024?.erodUm ??
          p.solo?.unidadeDeterminanteK2024?.erodUm) ??
        "não determinado",

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
      Titular_Mascarado: p.fundiario?.titularMascarado
        ? validarMascaraTitularSncr(p.fundiario.titularMascarado) ?? "não consultado"
        : "não consultado",
      Documento_Mascarado: p.fundiario?.documentoMascarado
        ? mascararDocumentoPessoal(p.fundiario.documentoMascarado) ?? "não consultado"
        : "não consultado",
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

      Campos_Estimados: camposNaoMedidos.length > 0 ? camposNaoMedidos.join(", ") : "100% medido",
      Rastreio_Versao_Motor: p.rastreio?.versaoMotor ?? "não informado",
      Rastreio_Cenas: p.rastreio?.cenas ? p.rastreio.cenas.join("; ") : "não informado",
      Rastreio_Calculado_Em: p.rastreio?.calculadoEm ?? "não informado",
    };

    return linha;
  });
}

/**
 * Projeta estritamente as linhas conforme as colunas permitidas por cada Perfil de Exportação
 * (Invariante 2 e Regra 6: Segregação Cega de Exportação).
 */
export function extrairLinhasPorPerfil(
  pontos: PontoAmostral[],
  perfil: PerfilExportacao = "planilha",
  rotulosConsolidados?: Record<string, RotuloConsolidado>
): Record<string, unknown>[] {
  if (perfil === "planilha") {
    return extrairLinhasAbaDados(pontos);
  }

  if (perfil === "interpretacao-cega") {
    return pontos.map((p) => ({
      Codigo: p.codigo,
      Latitude: Number(p.latitude.toFixed(6)),
      Longitude: Number(p.longitude.toFixed(6)),
      Janela_Inicio: p.temporal?.D?.janela?.inicio ?? "",
      Janela_Fim: p.temporal?.D?.janela?.fim ?? "",
      Referencia_Cena_Tile: p.rastreio?.cenas?.join("; ") || "COPERNICUS/S2_SR_HARMONIZED",
    }));
  }

  if (perfil === "campo-cego") {
    return pontos.map((p) => ({
      Codigo: p.codigo,
      Latitude: Number(p.latitude.toFixed(6)),
      Longitude: Number(p.longitude.toFixed(6)),
      Latitude_DMS: formatToDMS(p.latitude, true),
      Longitude_DMS: formatToDMS(p.longitude, false),
      Municipio: valorOuNulo(p.localizacao?.municipio) ?? "não determinado",
      Status_Fundiario: p.fundiario?.status ?? "nao-consultado",
      Motivo_Acesso: p.fundiario?.motivo ?? "Inspeção presencial de campanha PPGTCA",
      Codigo_CAR: p.fundiario?.codigoCar ?? "",
      Titular_Mascarado: p.fundiario?.titularMascarado
        ? validarMascaraTitularSncr(p.fundiario.titularMascarado) ?? ""
        : "",
      Rota_Acesso: `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`,
    }));
  }

  if (perfil === "voo-cego") {
    return pontos.map((p) => {
      let areaVoo = "";
      if (typeof (p as any).areaVooHa === "number" && !isNaN((p as any).areaVooHa)) {
        areaVoo = `${(p as any).areaVooHa} ha`;
      } else if (typeof (p as any).areaVooPoligonoHa === "number" && !isNaN((p as any).areaVooPoligonoHa)) {
        areaVoo = `${(p as any).areaVooPoligonoHa} ha`;
      } else if (typeof (p as any).poligonoVoo?.areaHectares === "number" && !isNaN((p as any).poligonoVoo.areaHectares)) {
        areaVoo = `${(p as any).poligonoVoo.areaHectares} ha`;
      }
      return {
        Codigo: p.codigo,
        Latitude: Number(p.latitude.toFixed(6)),
        Longitude: Number(p.longitude.toFixed(6)),
        Area_Voo_Poligono: areaVoo,
      };
    });
  }

  if (perfil === "geojson-pontos") {
    return pontos.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      municipio: valorOuNulo(p.localizacao?.municipio) ?? "não determinado",
      bacia: valorOuNulo(p.localizacao?.bacia) ?? "não determinado",
      altitude_dem: valorOuNulo(p.terreno?.elevacao) ?? "",
      declividade_pct: valorOuNulo(p.terreno?.declividadePct) ?? "",
      solo_embrapa: valorOuNulo(p.solo?.ordem) ?? "não determinado",
    }));
  }

  if (perfil === "linha-de-base-rusle") {
    return pontos.map((p) => {
      const celulaId = p.celulaId ?? p.codigo ?? p.id;
      const rProv = p.linhaDeBase?.fatorR;
      const kProv = p.linhaDeBase?.fatorK;
      const lsProv = p.linhaDeBase?.fatorLS;
      const cProv = p.linhaDeBase?.fatorC;
      const pProv = p.linhaDeBase?.fatorP;

      const rVal = valorOuNulo(rProv);
      const kVal = valorOuNulo(kProv);
      const lsVal = valorOuNulo(lsProv);
      const cVal = valorOuNulo(cProv);
      const pVal = valorOuNulo(pProv);

      const rValido = rProv && (rProv.estado === "medido" || rProv.estado === "modelado" || rProv.estado === "tabelado") && rVal !== null;
      const kValido = kProv && (kProv.estado === "medido" || kProv.estado === "modelado" || kProv.estado === "tabelado") && kVal !== null;
      const lsValido = lsProv && (lsProv.estado === "medido" || lsProv.estado === "modelado" || lsProv.estado === "tabelado") && lsVal !== null;
      const cValido = cProv && (cProv.estado === "medido" || cProv.estado === "modelado" || cProv.estado === "tabelado") && cVal !== null;
      const pValido = pProv && (pProv.estado === "medido" || pProv.estado === "modelado" || pProv.estado === "tabelado") && pVal !== null;

      let rusleA: number | "" = "";
      if (rValido && kValido && lsValido && cValido && pValido) {
        rusleA = Number((rVal! * kVal! * lsVal! * cVal! * pVal!).toFixed(4));
      }

      const marcadorK = p.solo?.kAmbiguoAssociacao ?? p.kAmbiguoAssociacao ?? "";

      return {
        Celula_ID: celulaId,
        RUSLE_Fator_R: rVal ?? "",
        RUSLE_Fator_K: kVal ?? "",
        RUSLE_Fator_LS: lsVal ?? "",
        RUSLE_Fator_C: cVal ?? "",
        RUSLE_Fator_P: pVal ?? "",
        Marcador_K_Ambiguo_D08: marcadorK,
        RUSLE_A: rusleA,
      };
    });
  }

  // perfil === "matriz-treino" ou "matriz-heldout": Delega integralmente a montarMatrizTreino
  if (perfil === "matriz-treino" || perfil === "matriz-heldout") {
    if (!rotulosConsolidados || (pontos.length > 0 && Object.keys(rotulosConsolidados).length === 0)) {
      throw new Error(
        `[ABORTO — REGRA 4 / POSTURA 9] O perfil '${perfil}' exige o mapa autoritativo 'rotulosConsolidados' não vazio. ` +
        "Exportar a matriz sem rótulos humanos consolidados produziria degradação silenciosa."
      );
    }

    // DEC-5 (N02e): se existir par de rótulos com 2 observadores e κ < 0,60, a exportação é RECUSADA
    const paresComBaixoKappa: string[] = [];
    for (const [codigo, rCons] of Object.entries(rotulosConsolidados)) {
      if (rCons.origens && rCons.origens.length >= 2) {
        if (typeof rCons.kappa === "number" && !isNaN(rCons.kappa) && rCons.kappa < 0.6) {
          paresComBaixoKappa.push(`${codigo} (kappa=${rCons.kappa.toFixed(3)})`);
        }
      }
    }
    if (paresComBaixoKappa.length > 0) {
      throw new Error(
        `[DEC-5] Exportação de '${perfil}' recusada: concordância interobservador insatisfatória (kappa < 0.60) nos seguintes pares: ${paresComBaixoKappa.join(", ")}`
      );
    }

    const resultadoMatriz = montarMatrizTreino(pontos, rotulosConsolidados, { modeloJanela: "D" });

    const linhasFonte = perfil === "matriz-treino" ? resultadoMatriz.linhas : resultadoMatriz.heldOutDrone;

    // Pós-condição: matriz-treino NUNCA contém linha held-out
    if (perfil === "matriz-treino") {
      for (const l of linhasFonte) {
        if (l.papelConjunto === "held-out") {
          throw new Error("VIOLAÇÃO DE CONTRATO (D16): Linha held-out detectada na exportação de 'matriz-treino'.");
        }
      }
    }

    return linhasFonte.map((l) => ({
      Celula_ID: l.celulaId,
      Poligono_ID: l.poligonoId,
      Papel_Conjunto: l.papelConjunto,
      Fracao_Erodida: l.fracaoErodida !== null ? l.fracaoErodida : "",
      Alvo_Binario_25: l.alvoBinario25 !== null ? l.alvoBinario25 : "",
      Rotulo_N_Observadores: l.rotuloNObservadores !== null ? l.rotuloNObservadores : "",
      Ponto_ID: l.pontoId,
      Bloco_Espacial: l.blocoEspacial ?? "BLOCO_INDEFINIDO",
      Elevacao_m: l.elevacao !== null ? l.elevacao : "",
      Declividade_pct: l.declividadePct !== null ? l.declividadePct : "",
      Declividade_graus: l.declividadeGraus !== null ? l.declividadeGraus : "",
      Curvatura_Perfil: l.curvaturaPerfil !== null ? l.curvaturaPerfil : "",
      Curvatura_Plana: l.curvaturaPlana !== null ? l.curvaturaPlana : "",
      Acumulo_Fluxo: l.acumuloFluxo !== null ? l.acumuloFluxo : "",
      TWI: l.twi !== null ? l.twi : "",
      Ordem_Solo: l.ordemSolo ?? "",
      Subordem_Solo: l.subOrdemSolo ?? "",
      Grande_Grupo_Solo: l.grandeGrupoSolo ?? "",
      Erodibilidade_Classe: l.erodibilidadeClasse ?? "",
      Frequencia_Solo_Nu: l.frequenciaSoloNu !== null ? l.frequenciaSoloNu : "",
      Banda_B2: l.bandaB2 !== null ? l.bandaB2 : "",
      Banda_B4: l.bandaB4 !== null ? l.bandaB4 : "",
      Banda_B8: l.bandaB8 !== null ? l.bandaB8 : "",
      Banda_B12: l.bandaB12 !== null ? l.bandaB12 : "",
      NDVI: l.ndvi !== null ? l.ndvi : "",
      BSI: l.bsi !== null ? l.bsi : "",
      Composto_Solo_Nu_B12: l.compostoSoloNuB12 !== null ? l.compostoSoloNuB12 : "",
      Composto_Solo_Nu_Razao_B4_B2: l.compostoSoloNuRazaoB4B2 !== null ? l.compostoSoloNuRazaoB4B2 : "",
      Taxa_Degradacao_SWIR_Anual: l.taxaDegradacaoSwirAnual !== null ? l.taxaDegradacaoSwirAnual : "",
      NDVI_P90_Serie: l.ndviP90Serie !== null ? l.ndviP90Serie : "",
      RUSLE_Fator_K: l.fatorK !== null ? l.fatorK : "",
      RUSLE_Fator_R: l.fatorR !== null ? l.fatorR : "",
      RUSLE_Fator_LS: l.fatorLS !== null ? l.fatorLS : "",
      Precip_Acum_30d_mm: l.precipAcum30d !== null ? l.precipAcum30d : "",
      Precip_Acum_90d_mm: l.precipAcum90d !== null ? l.precipAcum90d : "",
      I30_Max_mm_h: l.i30Max !== null ? l.i30Max : "",
      N_Eventos_Erosivos: l.nEventosErosivos !== null ? l.nEventosErosivos : "",
      Indice_Mecanismo: l.indiceMecanismo !== null ? l.indiceMecanismo : "",
      Classe_Alvo_Binaria: l.classeAlvoBinaria,
      Rotulo_Classe: l.rotuloClasse,
      Rotulo_Modalidade: l.rotuloModalidade,
    }));
  }

  return [];
}

/**
 * Gera a planilha XLSX completa com 3 abas, garantindo guarda e invariantes.
 */
export async function gerarPlanilhaXLSX(pontos: PontoAmostral[], opcoes: OpcoesExportacao = {}): Promise<Buffer> {
  // 1. Guarda antissintético
  assegurarApenasPontosReais(pontos, "geração de planilha XLSX");

  const perfilAtivo = opcoes.perfil ?? "planilha";

  // 2. Extração e montagem da Aba 1 projetada pelo perfil
  const linhasDados = extrairLinhasPorPerfil(pontos, perfilAtivo, opcoes.rotulosConsolidados);
  const cabecalho = linhasDados.length > 0 ? Object.keys(linhasDados[0]) : [];

  // 3. Validação de Invariantes sobre o artefato projetado
  const artefato: ArtefatoProjetado = {
    perfil: perfilAtivo,
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
  const rowsProc: XlsxRowValue[][] = extrairMetadadosProcedencia(pontos, opcoes);

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

export function extrairMetadadosProcedencia(
  pontos: PontoAmostral[],
  opcoes: OpcoesExportacao = {}
): XlsxRowValue[][] {
  const janelaTexto = opcoes.janelaTemporal
    ? `${opcoes.janelaTemporal.inicio} a ${opcoes.janelaTemporal.fim}`
    : `${JANELA_TEMPORAL_D05.inicio} a ${JANELA_TEMPORAL_D05.fim}`;

  return [
    [{ value: "METADADO", bold: true }, { value: "VALOR / DESCRIÇÃO", bold: true }],
    ["Data e Hora de Emissão", new Date().toISOString()],
    ["Total de Pontos Amostrais", pontos.length],
    ["Perfil de Exportação", opcoes.perfil ?? "planilha"],
    ["Filtros Ativos", opcoes.filtrosAtivos ? opcoes.filtrosAtivos.join("; ") : "Nenhum filtro restritivo"],
    ["Janela Temporal", janelaTexto],
    ["", ""],
    [{ value: "BASES DISPONÍVEIS NESTA INSTALAÇÃO", bold: true }, { value: "DETALHAMENTO TÉCNICO", bold: true }],
    ["1. Relevo e Terreno", "COPERNICUS/DEM/GLO30 (Projeção métrica EPSG:31982)"],
    ["2. Pedologia", "Embrapa GeoInfo (parana_solos_20201105)"],
    ["3. Sensoriamento Óptico", "Copernicus Sentinel-2 L2A (BOA)"],
    ["4. Pluviometria e Clima", "indisponível (DEC-6)"],
    ["", ""],
    [{ value: "FUNDAMENTAÇÃO LGPD", bold: true }, BLOCO_FUNDAMENTACAO_LGPD],
  ];
}
