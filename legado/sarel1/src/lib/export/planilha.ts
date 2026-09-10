/**
 * ============================================================================
 * Exportador de Planilhas (XLSX e CSV) — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * Conforme Parte V do Prompt e §6.5 do Plano de Implementação v2.
 * Implementa 3 abas no XLSX e CSV sincronizado com metadados e bloco LGPD.
 * Executa previamente a Guarda Antissintético e a Asseguração dos Invariantes.
 */

import ExcelJS from "exceljs";
import { PontoAmostral } from "@/types/ponto";
import { formatarDescricaoOrigem, valorOuNulo } from "@/types/proveniencia";
import { derivarCamposNaoMedidos, assegurarInvariantes } from "@/lib/matriz/invariantes";
import { assegurarApenasPontosReais } from "@/lib/seguranca/guardaSintetico";
import { sincronizarCoordenada } from "./geoConversao";

export interface OpcoesExportacao {
  modoCego?: boolean; // Se true, omite colunas internas e de amostragem
  janelaTemporal?: { inicio: string; fim: string };
  filtrosAtivos?: string[];
  responsavelEmissao?: string;
}

export const BLOCO_FUNDAMENTACAO_LGPD = 
`TRATAMENTO DE DADOS PESSOAIS FUNDIÁRIOS — CONFORMIDADE LGPD (Lei nº 13.709/2018)
O presente documento e a respectiva planilha foram gerados no âmbito do projeto de pesquisa de mestrado do Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA). O tratamento de dados fundiários (código CAR, titular SNCR mascarado e localização do imóvel) fundamenta-se estritamente no Art. 7º, inciso IV da LGPD (realização de estudos por órgão de pesquisa, garantida, sempre que possível, a anonimização dos dados) e no Art. 11, inciso II, alínea 'c'.
A anonimização dos dados de titularidade é originária das bases públicas federais (SNCR/INCRA), sendo integralmente preservada sem engenharia reversa. O acesso aos dados é restrito a finalidades científicas e de autorização de campo para auditoria observacional.`;

/**
 * Monta as linhas de dados da Aba 1.
 */
export function extrairLinhasAbaDados(pontos: PontoAmostral[], modoCego: boolean = false): Record<string, unknown>[] {
  return pontos.map(p => {
    const latSinc = sincronizarCoordenada(p.latitude, "lat");
    const lngSinc = sincronizarCoordenada(p.longitude, "lng");

    const camposNaoMedidos = derivarCamposNaoMedidos(p);

    const linha: Record<string, unknown> = {
      Codigo: p.codigo,
      Latitude: latSinc.decimal,
      Longitude: lngSinc.decimal,
      Latitude_DMS: latSinc.dms,
      Longitude_DMS: lngSinc.dms,
      Altitude_m: valorOuNulo(p.terreno?.elevacao) ?? "",
      Altitude_Origem: formatarDescricaoOrigem(p.terreno?.elevacao),
      Municipio: p.auditoria?.municipio || "não determinado",
      UF: p.auditoria?.uf || "PR",
      Macrorregiao: p.auditoria?.macrorregiao || "não determinado",
      Bacia_Hidrografica: p.auditoria?.baciaHidrografica || "não determinado",

      Declividade_Pct: valorOuNulo(p.terreno?.declividadePct) ?? "",
      Declividade_Pct_Origem: formatarDescricaoOrigem(p.terreno?.declividadePct),
      Declividade_Graus: valorOuNulo(p.terreno?.declividadeGraus) ?? "",
      Declividade_Graus_Origem: formatarDescricaoOrigem(p.terreno?.declividadeGraus),
      Curvatura_Perfil: valorOuNulo(p.terreno?.curvaturaPerfil) ?? "",
      Curvatura_Perfil_Origem: formatarDescricaoOrigem(p.terreno?.curvaturaPerfil),
      Curvatura_Plana: valorOuNulo(p.terreno?.curvaturaPlana) ?? "",
      Curvatura_Plana_Origem: formatarDescricaoOrigem(p.terreno?.curvaturaPlana),
      Acumulo_Fluxo: valorOuNulo(p.terreno?.acumuloFluxo) ?? "",
      Acumulo_Fluxo_Origem: formatarDescricaoOrigem(p.terreno?.acumuloFluxo),
      TWI: valorOuNulo(p.terreno?.twi) ?? "",
      TWI_Origem: formatarDescricaoOrigem(p.terreno?.twi),

      Solo_Ordem: valorOuNulo(p.solo?.ordem) || "não determinado",
      Solo_Ordem_Origem: formatarDescricaoOrigem(p.solo?.ordem),
      Solo_Subordem: valorOuNulo(p.solo?.subOrdem) || "não determinado",
      Solo_Subordem_Origem: formatarDescricaoOrigem(p.solo?.subOrdem),
      Solo_Grande_Grupo: valorOuNulo(p.solo?.grandeGrupo) || "não determinado",
      Solo_Grande_Grupo_Origem: formatarDescricaoOrigem(p.solo?.grandeGrupo),
      Solo_Tipo_Unidade: valorOuNulo(p.solo?.tipoUnidade) || "não determinado",
      Solo_Tipo_Unidade_Origem: formatarDescricaoOrigem(p.solo?.tipoUnidade),
      Solo_Confianca: p.solo?.confiancaPedologica || "indisponivel",
      Solo_Erodibilidade_Classe: valorOuNulo(p.solo?.erodibilidadeClasse) || "não determinado",
      Solo_Erodibilidade_Origem: formatarDescricaoOrigem(p.solo?.erodibilidadeClasse),

      Freq_Solo_Nu: valorOuNulo(p.serie?.frequenciaSoloNu) ?? "",
      Freq_Solo_Nu_Origem: formatarDescricaoOrigem(p.serie?.frequenciaSoloNu),

      Chuva_Acum_30d: valorOuNulo(p.chuva?.precipAcum30d) ?? "",
      Chuva_Acum_30d_Origem: formatarDescricaoOrigem(p.chuva?.precipAcum30d),
      Chuva_Acum_90d: valorOuNulo(p.chuva?.precipAcum90d) ?? "",
      Chuva_Acum_90d_Origem: formatarDescricaoOrigem(p.chuva?.precipAcum90d),
      Chuva_I30_Max: valorOuNulo(p.chuva?.i30Max) ?? "",
      Chuva_I30_Max_Origem: formatarDescricaoOrigem(p.chuva?.i30Max),
      Chuva_Eventos_Erosivos: valorOuNulo(p.chuva?.nEventosErosivos) ?? "",
      Chuva_Eventos_Erosivos_Origem: formatarDescricaoOrigem(p.chuva?.nEventosErosivos),
      Indice_Mecanismo: valorOuNulo(p.chuva?.indiceMecanismo) ?? "",
      Indice_Mecanismo_Origem: formatarDescricaoOrigem(p.chuva?.indiceMecanismo),

      Status_Consulta_Fundiaria: p.fundiario?.status ? (
        p.fundiario.status === "encontrado" ? "Encontrado" :
        p.fundiario.status === "aproximado" ? "ATENÇÃO — associação aproximada" :
        p.fundiario.status === "sem-correspondencia" ? "Sem correspondência — nenhum imóvel nesta coordenada" :
        p.fundiario.status === "base-nao-disponivel" ? "Base não disponível" :
        "Erro na consulta fundiária"
      ) : "Consulta não realizada",
      Codigo_CAR: p.fundiario?.codigoCar || "não consultado",
      Titular_SNCR: p.fundiario?.titularMascarado || "não consultado",
      Documento_Mascarado: p.fundiario?.documentoMascarado || "não consultado",
      Registro_INCRA_SNCR: p.fundiario?.registroIncra || "não consultado",
      Area_Imovel_ha: (p.fundiario?.areaImovelHa !== undefined && p.fundiario?.areaImovelHa !== null) ? p.fundiario.areaImovelHa : "",
      Criterio_Associacao_Fundiaria: p.fundiario?.criterioAssociacao || "não consultado",
      Data_Consulta_Fundiaria: p.fundiario?.consultadoEm || "não consultado",

      Bloco_Espacial: p.blocoEspacial,
      Campos_Estimados: camposNaoMedidos.length > 0 ? camposNaoMedidos.join(", ") : "Nenhum (100% medido)",
      Origem_Dado: p.auditoria?.observacoes || "Processamento analítico SAREL",
      Cena_Sentinel2: p.auditoria?.cenaSentinel2 || "não aplicável",
      Data_Calculo_GEE: p.auditoria?.dataCalculoGee || "não aplicável",
      Versao_Motor_Calculo: p.auditoria?.versaoMotorCalculo || "SAREL-v1.0-PPGTCA",
    };

    // Apenas em modo NÃO CEGO saem dados internos de amostragem
    if (!modoCego) {
      linha.Estrato_ID = p.estratoId;
    }

    return linha;
  });
}

/**
 * Calcula a tabela de qualidade do dado por variável científica para a Aba 3.
 */
export function calcularQualidadeDosDados(pontos: PontoAmostral[]) {
  const n = pontos.length;
  if (n === 0) return [];

  const variaveis = [
    { nome: "Elevação (m)", obter: (p: PontoAmostral) => p.terreno?.elevacao },
    { nome: "Declividade (%)", obter: (p: PontoAmostral) => p.terreno?.declividadePct },
    { nome: "Declividade (graus)", obter: (p: PontoAmostral) => p.terreno?.declividadeGraus },
    { nome: "Curvatura Perfil", obter: (p: PontoAmostral) => p.terreno?.curvaturaPerfil },
    { nome: "Curvatura Plana", obter: (p: PontoAmostral) => p.terreno?.curvaturaPlana },
    { nome: "Acúmulo de Fluxo", obter: (p: PontoAmostral) => p.terreno?.acumuloFluxo },
    { nome: "TWI", obter: (p: PontoAmostral) => p.terreno?.twi },
    { nome: "Ordem do Solo", obter: (p: PontoAmostral) => p.solo?.ordem },
    { nome: "Subordem do Solo", obter: (p: PontoAmostral) => p.solo?.subOrdem },
    { nome: "Grande Grupo Solo", obter: (p: PontoAmostral) => p.solo?.grandeGrupo },
    { nome: "Tipo Unidade Solo", obter: (p: PontoAmostral) => p.solo?.tipoUnidade },
    { nome: "Erodibilidade (Classe)", obter: (p: PontoAmostral) => p.solo?.erodibilidadeClasse },
    { nome: "Frequência Solo Nu", obter: (p: PontoAmostral) => p.serie?.frequenciaSoloNu },
    { nome: "Chuva Acumulada 30d", obter: (p: PontoAmostral) => p.chuva?.precipAcum30d },
    { nome: "Chuva Acumulada 90d", obter: (p: PontoAmostral) => p.chuva?.precipAcum90d },
    { nome: "I30 Máximo", obter: (p: PontoAmostral) => p.chuva?.i30Max },
    { nome: "Eventos Erosivos", obter: (p: PontoAmostral) => p.chuva?.nEventosErosivos },
    { nome: "Índice de Mecanismo", obter: (p: PontoAmostral) => p.chuva?.indiceMecanismo },
  ];

  return variaveis.map(v => {
    let medidos = 0;
    let modelados = 0;
    let tabelados = 0;
    let indisponiveis = 0;

    for (const p of pontos) {
      const prov = v.obter(p);
      if (!prov) {
        indisponiveis++;
      } else {
        switch (prov.estado) {
          case "medido": medidos++; break;
          case "modelado": modelados++; break;
          case "tabelado": tabelados++; break;
          case "indisponivel": indisponiveis++; break;
        }
      }
    }

    return {
      variavel: v.nome,
      total: n,
      pctMedido: Number(((medidos / n) * 100).toFixed(1)),
      pctModelado: Number(((modelados / n) * 100).toFixed(1)),
      pctTabelado: Number(((tabelados / n) * 100).toFixed(1)),
      pctIndisponivel: Number(((indisponiveis / n) * 100).toFixed(1)),
    };
  });
}

/**
 * Gera a planilha XLSX completa de 3 abas usando ExcelJS.
 */
export async function gerarPlanilhaXLSX(pontos: PontoAmostral[], opcoes: OpcoesExportacao = {}): Promise<Buffer> {
  // 1. Guardas obrigatórias
  assegurarApenasPontosReais(pontos, "geração de XLSX");
  assegurarInvariantes(pontos);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SAREL — PPGTCA 2026";
  workbook.created = new Date();

  // --------------------------------------------------------------------------
  // ABA 1 — DADOS
  // --------------------------------------------------------------------------
  const sheetDados = workbook.addWorksheet("Dados");
  const linhasDados = extrairLinhasAbaDados(pontos, opcoes.modoCego);

  if (linhasDados.length > 0) {
    const colunas = Object.keys(linhasDados[0]).map(colName => ({
      header: colName,
      key: colName,
      width: colName.includes("Origem") || colName.includes("Campos") ? 35 : 18,
    }));
    sheetDados.columns = colunas;

    for (const linha of linhasDados) {
      sheetDados.addRow(linha);
    }

    // AutoFilter na primeira linha
    sheetDados.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: colunas.length },
    };

    // Estilo do cabeçalho
    sheetDados.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheetDados.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" }, // Azul institucional
    };
  }

  // --------------------------------------------------------------------------
  // ABA 2 — PROCEDÊNCIA E CONFORMIDADE
  // --------------------------------------------------------------------------
  const sheetProc = workbook.addWorksheet("Procedência e Conformidade");
  sheetProc.columns = [
    { header: "Campo", key: "campo", width: 35 },
    { header: "Valor / Descrição", key: "valor", width: 80 },
  ];

  const totalFundiarioConsultado = pontos.filter(p => p.fundiario && p.fundiario.status !== "sem-correspondencia" && p.fundiario.consultadoEm).length;
  const totalEmbrapaConsultado = pontos.filter(p => p.solo && p.solo.ordem && p.solo.ordem.estado === "medido").length;
  const totalGeeConsultado = pontos.filter(p => p.terreno && p.terreno.declividadePct && p.terreno.declividadePct.estado === "medido").length;

  sheetProc.addRow({ campo: "Data e Hora de Emissão", valor: new Date().toISOString() });
  sheetProc.addRow({ campo: "Modalidade de Exportação", valor: opcoes.modoCego ? "MODO CEGO (Fase de Campo / Interpretação Independente)" : "NORMAL (Completa)" });
  sheetProc.addRow({ campo: "Total de Pontos Amostrais", valor: pontos.length });
  sheetProc.addRow({ campo: "Filtros Ativos", valor: opcoes.filtrosAtivos ? opcoes.filtrosAtivos.join("; ") : "Nenhum filtro restritivo" });
  sheetProc.addRow({ campo: "Janela Temporal", valor: opcoes.janelaTemporal ? `${opcoes.janelaTemporal.inicio} a ${opcoes.janelaTemporal.fim}` : "2019 a 2025" });
  sheetProc.addRow({ campo: "", valor: "" });

  sheetProc.addRow({ campo: "BASES DISPONÍVEIS NESTA INSTALAÇÃO", valor: "INVENTÁRIO TÉCNICO" });
  sheetProc.addRow({ campo: "1. Relevo e Terreno", valor: "COPERNICUS/DEM/GLO30 (Resolução 30m, Projeção EPSG:31982)" });
  sheetProc.addRow({ campo: "2. Pedologia e Erodibilidade", valor: "Embrapa GeoInfo (parana_solos_20201105 e brasil_erodibilidade_solo)" });
  sheetProc.addRow({ campo: "3. Satélites Ópticos", valor: "Sentinel-2 MSI Harmonized / Landsat 8-9 OLI via Earth Engine" });
  sheetProc.addRow({ campo: "4. Precipitação", valor: "CHIRPS Daily (UCSB) e GPM IMERG Semi-Horário (NASA)" });
  sheetProc.addRow({ campo: "5. Malha Fundiária", valor: "SICAR/CAR, SIGEF Brasil e SNCR/INCRA instalados localmente" });
  sheetProc.addRow({ campo: "", valor: "" });

  sheetProc.addRow({ campo: "CONTAGEM REAL DE CONSULTAS EXECUTADAS", valor: "AUDITORIA DE FONTES" });
  sheetProc.addRow({ campo: "Pontos com Terreno GEE Medido", valor: `${totalGeeConsultado} de ${pontos.length} pontos` });
  sheetProc.addRow({ campo: "Pontos com Carta Embrapa Resolvida", valor: `${totalEmbrapaConsultado} de ${pontos.length} pontos` });
  sheetProc.addRow({ campo: "Pontos com Consulta Fundiária Realizada", valor: `${totalFundiarioConsultado} de ${pontos.length} pontos` });
  sheetProc.addRow({ campo: "", valor: "" });

  sheetProc.addRow({ campo: "FUNDAMENTAÇÃO JURÍDICA LGPD", valor: BLOCO_FUNDAMENTACAO_LGPD });

  sheetProc.getRow(1).font = { bold: true };
  sheetProc.getRow(7).font = { bold: true };
  sheetProc.getRow(15).font = { bold: true };
  sheetProc.getRow(21).font = { bold: true };

  // --------------------------------------------------------------------------
  // ABA 3 — QUALIDADE DO DADO
  // --------------------------------------------------------------------------
  const sheetQual = workbook.addWorksheet("Qualidade do Dado");
  sheetQual.columns = [
    { header: "Variável Científica", key: "variavel", width: 30 },
    { header: "Total de Pontos", key: "total", width: 15 },
    { header: "% Medido", key: "pctMedido", width: 15 },
    { header: "% Modelado", key: "pctModelado", width: 15 },
    { header: "% Tabelado", key: "pctTabelado", width: 15 },
    { header: "% Indisponível", key: "pctIndisponivel", width: 15 },
  ];

  const resumoQualidade = calcularQualidadeDosDados(pontos);
  for (const r of resumoQualidade) {
    sheetQual.addRow(r);
  }

  sheetQual.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheetQual.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF065F46" }, // Verde floresta
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Gera arquivo CSV sincronizado com UTF-8 BOM e bloco LGPD no cabeçalho.
 */
export function gerarPlanilhaCSV(pontos: PontoAmostral[], opcoes: OpcoesExportacao = {}): string {
  assegurarApenasPontosReais(pontos, "geração de CSV");
  assegurarInvariantes(pontos);

  const linhasDados = extrairLinhasAbaDados(pontos, opcoes.modoCego);
  if (linhasDados.length === 0) return "\uFEFF";

  const headers = Object.keys(linhasDados[0]);

  const escapeCsv = (val: unknown) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(";") || str.includes("\"") || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const linhasCsv: string[] = [];

  // Metadados sincronizados no cabeçalho
  linhasCsv.push(`# ==============================================================================`);
  linhasCsv.push(`# SAREL — Sistema de Amostragem e Rotulagem para Predição de Erosão Laminar`);
  linhasCsv.push(`# Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA 2026)`);
  linhasCsv.push(`# Data de Emissão: ${new Date().toISOString()}`);
  linhasCsv.push(`# Modalidade: ${opcoes.modoCego ? "MODO CEGO (Colunas de predição/estrato omitidas)" : "NORMAL"}`);
  linhasCsv.push(`# Total de Linhas: ${pontos.length}`);
  linhasCsv.push(`#`);
  linhasCsv.push(`# FUNDAMENTAÇÃO LGPD (Lei 13.709/2018):`);
  const linhasLgpd = BLOCO_FUNDAMENTACAO_LGPD.split("\n");
  for (const l of linhasLgpd) {
    linhasCsv.push(`# ${l}`);
  }
  linhasCsv.push(`# ==============================================================================`);

  // Cabeçalho da tabela
  linhasCsv.push(headers.join(";"));

  // Dados
  for (const linha of linhasDados) {
    const rowStr = headers.map(h => escapeCsv(linha[h])).join(";");
    linhasCsv.push(rowStr);
  }

  // Retorna com UTF-8 BOM
  return "\uFEFF" + linhasCsv.join("\r\n");
}
