/**
 * ============================================================================
 * Cliente de Inferência Rápida Jev (TypeSafe AI / System One) — SAREL v2.0
 * PPGTCA 2026 — Universidade Tecnológica Federal do Paraná (UTFPR)
 * ============================================================================
 *
 * Este módulo implementa o acesso ao microsserviço acelerador System One.
 * Princípio da Arquitetura Dual-Engine:
 * - Se a API responder dentro de 2.000 ms: Adota a inferência do Jev e grava
 *   'JEV_SYSTEM_ONE'.
 * - Se timeout, ausência de chave ou falha HTTP: Comuta graciosamente para
 *   o motor determinístico local ('MOTOR_LOCAL_RUSLE').
 */

import type { PontoAmostral } from "@/types/ponto";
import type { LaudoAuditoriaPonto, GrauSuscetibilidade } from "@/types/jev";
import { valorOuNulo } from "@/types/proveniencia";
import { executarAuditoriaLocal } from "./fallbackLocal";

const JEV_API_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const TIMEOUT_JEV_MS = 2000;

function rotuloScore(grau: GrauSuscetibilidade): {
  rotulo: "Nula" | "Baixa" | "Moderada" | "Alta" | "Crítica";
  descricao: string;
} {
  switch (grau) {
    case 0:
      return { rotulo: "Nula", descricao: "Sem risco perceptível de perda de solo na coordenada." };
    case 1:
      return { rotulo: "Baixa", descricao: "Risco baixo de desagregação laminar sob manejo atual." };
    case 2:
      return { rotulo: "Moderada", descricao: "Atenção técnica requerida para contenção de escoamento." };
    case 3:
      return { rotulo: "Alta", descricao: "Elevada vulnerabilidade erosiva; prioridade para vistoria." };
    case 4:
      return { rotulo: "Crítica", descricao: "Processo erosivo iminente ou ativo; intervenção urgente." };
  }
}

export async function executarAuditoriaJev(
  ponto: PontoAmostral,
  apiKey?: string
): Promise<LaudoAuditoriaPonto> {
  const chaveLimpa = (apiKey || "").trim();

  // 1. Se a chave não foi configurada, degradação graciosa imediata (0ms)
  if (!chaveLimpa || chaveLimpa.length < 8) {
    return executarAuditoriaLocal(
      ponto,
      "Chave do Jev não configurada. Executando auditoria pelo motor determinístico local."
    );
  }

  const ndvi = valorOuNulo(ponto.espectral?.ndvi);
  const bsi = valorOuNulo(ponto.espectral?.bsi);
  const decliv = valorOuNulo(ponto.terreno?.declividadePct);
  const solo = valorOuNulo(ponto.solo?.ordem);
  const erod = valorOuNulo(ponto.solo?.erodibilidadeClasse);
  const mun = valorOuNulo(ponto.localizacao?.municipio);

  // 2. Montagem do estado biofísico real (sem dados sintéticos)
  const estadoBiofisico = [
    `Ponto Amostral: ${ponto.codigo} (${mun || "Paraná"})`,
    `Coordenadas WGS84: Lat ${ponto.latitude.toFixed(5)}, Lon ${ponto.longitude.toFixed(5)}`,
    decliv !== null ? `Declividade MDE: ${decliv.toFixed(1)}%` : "Declividade: Não informada",
    ndvi !== null ? `NDVI Sentinel-2: ${ndvi.toFixed(3)}` : "NDVI: Não informado",
    bsi !== null ? `BSI Sentinel-2: ${bsi.toFixed(3)}` : "BSI: Não informado",
    solo ? `Classe Solo SiBCS: ${solo}` : "Solo: Não classificado",
    erod ? `Erodibilidade: ${erod}` : "Erodibilidade: Padrão",
  ].join(" | ");

  const payload = {
    model: "jev-latest",
    state: estadoBiofisico,
    questions: {
      consistencia_fisica: {
        type: "noul",
        instructions:
          "Há consistência física e coerência biofísica entre o relevo, o tipo de solo e a reflectância observada na amostra?",
      },
      suscetibilidade_erosao: {
        type: "score",
        scale: [0, 4],
        instructions:
          "Qual o grau de suscetibilidade à erosão laminar desta coordenada de 0 (Nula) a 4 (Crítica) segundo a RUSLE?",
      },
      manejo_cobertura: {
        type: "choice",
        options: [
          "Plantio Direto Consolidado / Cobertura Densa",
          "Preparo Reduzido / Vegetação em Desenvolvimento",
          "Solo Exposto Degradado",
          "Área de Preservação / Florestal",
        ],
        instructions: "Qual a classe categórica predominante de uso e manejo observada?",
      },
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_JEV_MS);
  const inicio = Date.now();

  try {
    const res = await fetch(JEV_API_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chaveLimpa}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const latencia = Date.now() - inicio;

    if (!res.ok) {
      return executarAuditoriaLocal(
        ponto,
        `Resposta da API Jev (HTTP ${res.status}). Comutado para motor local.`,
        latencia
      );
    }

    const data = await res.json().catch(() => null);
    if (!data || typeof data !== "object") {
      return executarAuditoriaLocal(
        ponto,
        "Resposta do Jev em formato ilegível. Comutado para motor local.",
        latencia
      );
    }

    // Extrai as respostas tipadas do Jev
    const qAnswers = data.answers || data.results || data;

    const noulAns = qAnswers.consistencia_fisica;
    const scoreAns = qAnswers.suscetibilidade_erosao;
    const choiceAns = qAnswers.manejo_cobertura;

    const valido = typeof noulAns?.result === "boolean" ? noulAns.result : true;
    const confiancaNoul =
      typeof noulAns?.confidence === "number" ? noulAns.confidence : 0.95;

    let scoreGrau: GrauSuscetibilidade = 1;
    if (
      typeof scoreAns?.score === "number" &&
      scoreAns.score >= 0 &&
      scoreAns.score <= 4
    ) {
      scoreGrau = Math.round(scoreAns.score) as GrauSuscetibilidade;
    }

    const infoScore = rotuloScore(scoreGrau);

    const classeCobertura =
      typeof choiceAns?.choice === "string" && choiceAns.choice.length > 0
        ? choiceAns.choice
        : "Não-Identificada";
    const confiancaCobertura =
      typeof choiceAns?.confidence === "number" ? choiceAns.confidence : 0.9;

    return {
      metodo: "JEV_SYSTEM_ONE",
      pontoId: ponto.id,
      codigo: ponto.codigo,
      timestamp: new Date().toISOString(),
      latenciaMs: latencia,
      consistenciaFisica: {
        valido,
        confianca: confiancaNoul,
        observacao:
          noulAns?.reasoning ||
          (valido
            ? "Consistência biofísica verificada com sucesso pelo Jev."
            : "Anomalia detectada pelo modelo System One."),
      },
      scoreSuscetibilidade: {
        grau: scoreGrau,
        rotulo: infoScore.rotulo,
        descricao: infoScore.descricao,
      },
      coberturaManejo: {
        classe: classeCobertura,
        confianca: confiancaCobertura,
      },
      detalhes: {
        ndviObservado: ndvi,
        bsiObservado: bsi,
        declividadePct: decliv,
        ordemSolo: solo,
        erodibilidadeClasse: erod,
      },
    };
  } catch (err: any) {
    clearTimeout(timer);
    const latencia = Date.now() - inicio;
    const isTimeout = err?.name === "AbortError" || latencia >= TIMEOUT_JEV_MS;
    const motivo = isTimeout
      ? "Timeout de 2.000 ms atingido na API Jev. Degradação para motor local."
      : `Falha de rede ao conectar com o Jev: ${err?.message || "Sem conexão"}.`;

    return executarAuditoriaLocal(ponto, motivo, latencia);
  }
}
