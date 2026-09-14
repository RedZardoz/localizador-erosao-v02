import type { PontoAmostral } from "@/types/ponto";
import { extrairLinhasAbaDados, BLOCO_FUNDAMENTACAO_LGPD } from "./planilha";
import { assegurarApenasPontosReais } from "@/lib/seguranca/guardaSintetico";
import { assegurarInvariantesArtefato, ArtefatoProjetado } from "@/lib/matriz/invariantes";
import type { PerfilExportacao } from "@/lib/matriz/perfis";

function escaparCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Gera arquivo CSV científico estruturado com cabeçalho de metadados, bloco LGPD e tabela com colunas duplas.
 */
export function gerarCsvCientifico(pontos: PontoAmostral[], perfil: PerfilExportacao = "planilha"): string {
  // 1. Guarda antissintético
  assegurarApenasPontosReais(pontos, "geração de arquivo CSV");

  // 2. Extração de dados
  const linhas = extrairLinhasAbaDados(pontos);
  const cabecalho = linhas.length > 0 ? Object.keys(linhas[0]) : [];

  // 3. Validação dos invariantes
  const artefato: ArtefatoProjetado = {
    perfil,
    cabecalho,
    linhas,
  };
  assegurarInvariantesArtefato(artefato);

  // 4. Montagem com BOM UTF-8 e bloco de conformidade LGPD
  const linhasCsv: string[] = [];

  // Cabeçalho de metadados
  linhasCsv.push(`# SAREL — Sistema de Amostragem e Rotulagem para Erosão Laminar`);
  linhasCsv.push(`# Emissão: ${new Date().toISOString()}`);
  linhasCsv.push(`# Total de registros: ${pontos.length}`);
  linhasCsv.push(`# Perfil: ${perfil}`);
  for (const l of BLOCO_FUNDAMENTACAO_LGPD.split("\n")) {
    linhasCsv.push(`# ${l}`);
  }
  linhasCsv.push(``);

  // Linha de cabeçalho
  linhasCsv.push(cabecalho.map(escaparCsv).join(","));

  // Linhas de dados
  for (const l of linhas) {
    const vals = cabecalho.map((col) => escaparCsv(l[col]));
    linhasCsv.push(vals.join(","));
  }

  // UTF-8 BOM no início
  return "\uFEFF" + linhasCsv.join("\r\n");
}
