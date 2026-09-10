import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGeeSession, GEE_SESSION_COOKIE } from "@/lib/gee/sessionStore";
import { selectReplacementCandidateWithGEE } from "@/lib/gee/candidateSelector";

/**
 * ============================================================================
 * Rota de Re-eleição e Substituição de Candidato Amostral no Earth Engine
 * Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio
 * (PPGTCA - 2026)
 * ============================================================================
 *
 * SERVIDOR EXTERNO ACESSADO:
 * - Google Earth Engine (GEE API)
 *
 * OBJETIVO METODOLÓGICO & REFERÊNCIA AO README:
 * - README §3.3: Critérios de Elegibilidade em Gabinete e Auditoria Visual.
 * - Quando a inspeção em ultra-resolução (Zoom 19 / Sentinel-2 / Mapbox) constata
 *   que um ponto sorteado caiu sobre floresta, vegetação densa, corpo d'água ou
 *   área urbana, esta rota sorteia um novo alvo substituto no mesmo município/AOI.
 * - REGRA METODOLÓGICA FUNDAMENTAL: O novo ponto sorteado assume estritamente o
 *   mesmo código (ex: PR-CAND-042) e numeração do ponto anulado, preservando
 *   a integridade sequencial das campanhas de campo.
 */

const RequestSchema = z.object({
  pointToReplace: z.any(),
  existingPoints: z.array(z.any()).optional(),
  aoi: z.any().optional(),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get(GEE_SESSION_COOKIE)?.value;
  const credentials = getGeeSession(sessionId);

  if (!credentials) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Nenhuma sessão do Earth Engine ativa. Configure a Service Account em Configurações → GEE Service Account.",
      },
      { status: 401 }
    );
  }

  let parsed;
  try {
    const body = await req.json();
    parsed = RequestSchema.parse(body);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Requisição inválida: ${err?.message || err}` },
      { status: 400 }
    );
  }

  try {
    const replacement = await selectReplacementCandidateWithGEE(credentials, {
      pointToReplace: parsed.pointToReplace,
      existingPoints: parsed.existingPoints || [],
      aoi: parsed.aoi,
    });

    return NextResponse.json({
      success: true,
      data: {
        replacementPoint: replacement,
        replacedCode: parsed.pointToReplace.code,
        message: `Novo ponto re-eleito com sucesso para o código ${parsed.pointToReplace.code}.`,
      },
    });
  } catch (err: any) {
    console.error("[GEE Error - replace-candidate]", err);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao re-eleger candidato no Earth Engine. Consulte os logs do servidor.",
      },
      { status: 502 }
    );
  }
}
