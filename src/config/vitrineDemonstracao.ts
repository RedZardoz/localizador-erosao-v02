/**
 * ============================================================================
 * Configuração do Modo Vitrine / Demonstração Estática (Prompt T)
 * ============================================================================
 *
 * Controla a apresentação estática e distribuível para navegador.
 * Quando ativo (via NEXT_PUBLIC_SAREL_MOCKUP="true" no build de demonstração),
 * exibe marcações inequívocas, carrega conjunto declaradamente sintético
 * e mantém ações operacionais/externas visivelmente desabilitadas.
 */

export const IS_VITRINE_DEMONSTRACAO =
  process.env.NEXT_PUBLIC_SAREL_MOCKUP === "true";

export const DATA_ESTADO_VITRINE = "11/11/2026";

export const AVISO_OPERACAO_DESABILITADA =
  "Operação desabilitada no mockup demonstrativo (funcionalidade ativa no ambiente operacional autenticado).";

export const AVISO_EXPORTACAO_DESABILITADA =
  "Exportação desabilitada no mockup demonstrativo para impedir confusão com dados oficiais de pesquisa.";
