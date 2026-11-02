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
 * - consentimentoEnvioExterno?: boolean — A-09: OPT-IN explícito, obrigatório para que qualquer
 *   dado saia desta máquina. Sem ele, a auditoria roda apenas no motor heurístico local. O payload
 *   externo, quando autorizado, já não contém coordenada, município nem código do ponto.
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
import { exigirRequisicaoLocalConfiavel } from "@/lib/seguranca/localOnly";
import type { PontoAmostral } from "@/types/ponto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const bloqueio = exigirRequisicaoLocalConfiavel(request);
  if (bloqueio) return bloqueio;

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

    // 2. A-09: opt-in explícito. A chamada externa só ocorre por autorização afirmativa de cada
    // requisição; a ausência do campo NÃO é consentimento. Sem ele, degrada para o motor local,
    // que não faz requisição de rede alguma.
    const consentimentoEnvioExterno = body.consentimentoEnvioExterno === true;
    if (!consentimentoEnvioExterno) {
      const laudoLocal = executarAuditoriaLocal(
        ponto,
        "Envio externo não autorizado nesta requisição (A-09: opt-in explícito ausente). " +
          "Auditoria executada apenas pelo motor heurístico local, sem qualquer requisição de rede."
      );
      return NextResponse.json({ ok: true, laudo: laudoLocal, envio_externo: false });
    }

    // Registro de saída: a requisição externa fica anotada no log do processo. O diário persistente
    // de `src/lib/seguranca/diarioRequisicoes.ts` é orientado a artefato com caminho em disco, e
    // vinculá-lo a esta rota exige decidir qual artefato recebe a anotação — decisão do pesquisador.
    console.info(
      `[A-09][SAIDA-EXTERNA] Auditoria JEV autorizada para ponto ${ponto.codigo} em ${new Date().toISOString()}. ` +
        "Payload sem coordenada, municipio ou codigo."
    );

    const laudo = await executarAuditoriaJev(ponto, apiKey);

    return NextResponse.json({
      ok: true,
      laudo,
      envio_externo: true,
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
