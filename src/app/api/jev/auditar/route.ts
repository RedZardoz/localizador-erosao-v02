/**
 * ============================================================================
 * Rota de Auditoria e Decisão Rápida — Jev & Dual-Engine Fallback
 * SAREL v2.0 — Metodologia PPGTCA 2026
 * ============================================================================
 *
 * Endpoint: POST /api/jev/auditar
 *
 * Entrada:
 * - ponto: PontoAmostral
 * - apiKey?: string (opcional, pode ser resolvida da sessão efêmera)
 *
 * Saída:
 * - ok: boolean
 * - laudo: LaudoAuditoriaPonto ('JEV_SYSTEM_ONE' ou 'HEURISTICA_LOCAL_SUSCETIBILIDADE')
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executarAuditoriaJev } from "@/lib/jev/jevClient";
import { executarAuditoriaLocal } from "@/lib/jev/fallbackLocal";
import { obterSessao, SAREL_SESSION_COOKIE } from "@/lib/seguranca/sessaoEfemera";
import type { PontoAmostral } from "@/types/ponto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const ponto = body.ponto as PontoAmostral | undefined;

    if (!ponto || !ponto.id || !ponto.codigo) {
      return NextResponse.json(
        { ok: false, error: "Ponto amostral não informado ou em estrutura inválida." },
        { status: 400 }
      );
    }

    // 1. Resolve a chave da API (ou do body da requisição ou do cookie de sessão efêmera)
    let apiKey = (body.apiKey || "").trim();
    if (!apiKey) {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get(SAREL_SESSION_COOKIE)?.value;
      const sessao = obterSessao(sessionId);
      if (sessao?.jevApiKey) {
        apiKey = sessao.jevApiKey.trim();
      }
    }

    // 2. Executa a auditoria pela arquitetura de dupla camada
    const laudo = await executarAuditoriaJev(ponto, apiKey);

    return NextResponse.json({
      ok: true,
      laudo,
    });
  } catch (err: any) {
    console.error("Erro inesperado no endpoint /api/jev/auditar:", err);

    // Degradação graciosa mesmo em caso de erro no endpoint
    const bodyFallback = await request.json().catch(() => ({}));
    const pontoFallback = bodyFallback.ponto as PontoAmostral | undefined;

    if (pontoFallback && pontoFallback.id) {
      const laudoSeguro = executarAuditoriaLocal(
        pontoFallback,
        `Exceção no endpoint de auditoria: ${err?.message || "Erro desconhecido"}.`
      );
      return NextResponse.json({ ok: true, laudo: laudoSeguro });
    }

    return NextResponse.json(
      { ok: false, error: err?.message || "Erro interno ao processar auditoria." },
      { status: 500 }
    );
  }
}
