/**
 * ============================================================================
 * Motor Determinístico Local de Decisão (Camada 2 - Fallback RUSLE/Embrapa)
 * SAREL v2.0 — Metodologia PPGTCA 2026 (UTFPR Medianeira)
 * ============================================================================
 *
 * Princípio da Degradação Graciosa:
 * Se a API do Jev (TypeSafe AI) estiver ausente, desativada ou inacessível,
 * este motor local assume a auditoria imediata da amostra em microssegundos,
 * aplicando regras físicas consolidadas da RUSLE (Renard et al., 1997)
 * e do SiBCS (Embrapa Solos, 2018).
 */

import type { PontoAmostral } from "@/types/ponto";
import type { LaudoAuditoriaPonto, GrauSuscetibilidade } from "@/types/jev";
import { valorOuNulo } from "@/types/proveniencia";

export function executarAuditoriaLocal(
  ponto: PontoAmostral,
  motivoFallback: string,
  latenciaInformada?: number
): LaudoAuditoriaPonto {
  const agora = new Date().toISOString();

  const ndvi = valorOuNulo(ponto.espectral?.ndvi);
  const bsi = valorOuNulo(ponto.espectral?.bsi);
  const declividade = valorOuNulo(ponto.terreno?.declividadePct);
  const ordemSolo = valorOuNulo(ponto.solo?.ordem);
  const erodibilidadeClasse = valorOuNulo(ponto.solo?.erodibilidadeClasse);

  // 1. Verificação Determinística de Consistência Física
  let valido = true;
  let observacao = "Parâmetros biofísicos e topográficos consistentes com o domínio agrícola.";

  if (declividade !== null && declividade < 0) {
    valido = false;
    observacao = "Inconsistência física: Declividade negativa detectada no MDE.";
  } else if (ndvi !== null && (ndvi < -1 || ndvi > 1)) {
    valido = false;
    observacao = "Inconsistência física: Índice NDVI fora dos limites biofísicos válidos [-1, +1].";
  } else if (bsi !== null && (bsi < -1 || bsi > 1)) {
    valido = false;
    observacao = "Inconsistência física: Índice BSI fora dos limites biofísicos válidos [-1, +1].";
  }

  // 2. Classificação Estruturada da Cobertura de Solo (Taxonomia Fechada)
  let classeCobertura = "Indisponível / Não-Classificado";
  let confiancaCobertura = 0.5;

  if (ndvi !== null && bsi !== null) {
    if (ndvi > 0.6 && bsi < 0.0) {
      classeCobertura = "Plantio Direto Consolidado / Cobertura Densa";
      confiancaCobertura = 0.95;
    } else if (ndvi < 0.4 && bsi > 0.1) {
      classeCobertura = "Solo Exposto Degradado";
      confiancaCobertura = 0.92;
    } else {
      classeCobertura = "Preparo Reduzido / Vegetação em Desenvolvimento";
      confiancaCobertura = 0.82;
    }
  }

  // 3. Avaliação de Suscetibilidade à Erosão (Escala Ordinal 0 a 4 — RUSLE)
  let grau: GrauSuscetibilidade = 1;
  let rotulo: "Nula" | "Baixa" | "Moderada" | "Alta" | "Crítica" = "Baixa";
  let descricao = "Baixa propensão inicial a perdas por arraste hídrico.";

  const isSoloExposto = ndvi !== null && bsi !== null && ndvi < 0.4 && bsi > 0.1;

  if (isSoloExposto) {
    if (declividade !== null) {
      if (declividade > 20) {
        grau = 4;
        rotulo = "Crítica";
        descricao = "Solo exposto em relevo fortemente ondulado; risco extremo de erosão laminar severa.";
      } else if (declividade > 12) {
        grau = 3;
        rotulo = "Alta";
        descricao = "Solo exposto em declive moderado a acentuado; escoamento superficial acelerado.";
      } else if (declividade > 6) {
        grau = 2;
        rotulo = "Moderada";
        descricao = "Solo exposto em terreno suave; suscetibilidade intermediária a desagregação.";
      } else {
        grau = 1;
        rotulo = "Baixa";
        descricao = "Solo exposto em terreno quase plano; baixo potencial de arraste laminar.";
      }
    } else {
      grau = 2;
      rotulo = "Moderada";
      descricao = "Solo exposto detectado; declividade pendente de integração.";
    }
  } else if (ndvi !== null && ndvi > 0.6) {
    if (declividade !== null && declividade > 20) {
      grau = 1;
      rotulo = "Baixa";
      descricao = "Relevo íngreme compensado por biomassa densa do Sistema Plantio Direto.";
    } else {
      grau = 0;
      rotulo = "Nula";
      descricao = "Dossel fechado com palhada protetora; perdas de solo desprezíveis.";
    }
  } else {
    if (declividade !== null && declividade > 15) {
      grau = 2;
      rotulo = "Moderada";
      descricao = "Cobertura vegetal parcial em encosta inclinada.";
    } else {
      grau = 1;
      rotulo = "Baixa";
      descricao = "Manejo conservacionista estável sob condições ordinárias.";
    }
  }

  const latenciaFinal = typeof latenciaInformada === "number" ? latenciaInformada : 1;

  return {
    metodo: "MOTOR_LOCAL_RUSLE",
    pontoId: ponto.id,
    codigo: ponto.codigo,
    timestamp: agora,
    latenciaMs: latenciaFinal,
    consistenciaFisica: {
      valido,
      confianca: valido ? 0.98 : 0.99,
      observacao,
    },
    scoreSuscetibilidade: {
      grau,
      rotulo,
      descricao,
    },
    coberturaManejo: {
      classe: classeCobertura,
      confianca: confiancaCobertura,
    },
    detalhes: {
      ndviObservado: ndvi,
      bsiObservado: bsi,
      declividadePct: declividade,
      ordemSolo,
      erodibilidadeClasse,
      motivoFallback,
    },
  };
}
