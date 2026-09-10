/**
 * ============================================================================
 * Escritor XLSX e CSV — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * Ponto de entrada unificado para a exportação de tabelas consolidadas.
 * Toda exportação passa pela guarda antissintético e pelos 7 invariantes.
 */

export {
  gerarPlanilhaXLSX,
  gerarPlanilhaCSV,
  extrairLinhasAbaDados,
  calcularQualidadeDosDados,
  BLOCO_FUNDAMENTACAO_LGPD,
} from "./planilha";

export type { OpcoesExportacao } from "./planilha";
