/**
 * ============================================================================
 * API de Ingestão de Rótulos — SAREL (PPGTCA 2026)
 * ============================================================================
 *
 * Conforme §11.6 do Plano v2 e Auditoria B3:
 * Endpoint REST para importação de dados de rotulagem (Kobo, Interpretação Visual, Drone).
 *
 * REQUISITO DE SEGURANÇA:
 * Restrito estritamente a execução local (localhost / 127.0.0.1).
 */

import { NextRequest, NextResponse } from "next/server";
import { assegurarRequisicaoLocal } from "@/lib/gee/auth";
import { ingestarSubmissoesKobo } from "@/lib/rotulos/ingestaoKobo";
import { ingestarInterpretacaoVisual } from "@/lib/rotulos/ingestaoInterpretacao";
import { ingestarValidacaoDrone } from "@/lib/rotulos/ingestaoDrone";
import { PontoAmostral } from "@/types/ponto";
import { ItemInterpretacaoVisual, SubmissaoDrone, SubmissaoKobo } from "@/types/rotulo";

export async function POST(request: NextRequest) {
  try {
    // 1. Guarda de Execução Local
    assegurarRequisicaoLocal(request);

    // 2. Leitura do corpo da requisição
    const body = await request.json();
    const { tipo, dados, pontosReferencia, toleranciaMetros } = body as {
      tipo?: "kobo" | "interpretacao" | "drone";
      dados?: unknown[];
      pontosReferencia?: PontoAmostral[];
      toleranciaMetros?: number;
    };

    if (!tipo || !dados || !Array.isArray(dados)) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Requisição inválida. É obrigatório fornecer 'tipo' ('kobo' | 'interpretacao' | 'drone') e um array 'dados'.",
        },
        { status: 400 }
      );
    }

    if (tipo === "kobo") {
      const resultado = ingestarSubmissoesKobo(
        dados as SubmissaoKobo[],
        pontosReferencia,
        toleranciaMetros
      );
      return NextResponse.json({
        sucesso: true,
        tipo: "kobo",
        resultado,
      });
    }

    if (tipo === "interpretacao") {
      const resultado = ingestarInterpretacaoVisual(
        dados as ItemInterpretacaoVisual[]
      );
      return NextResponse.json({
        sucesso: true,
        tipo: "interpretacao",
        resultado,
      });
    }

    if (tipo === "drone") {
      const resultado = ingestarValidacaoDrone(
        dados as SubmissaoDrone[]
      );
      return NextResponse.json({
        sucesso: true,
        tipo: "drone",
        resultado,
      });
    }

    return NextResponse.json(
      {
        sucesso: false,
        erro: `Tipo de ingestão '${tipo}' não suportado. Utilize 'kobo', 'interpretacao' ou 'drone'.`,
      },
      { status: 400 }
    );
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido na ingestão de rótulos.";
    const status = mensagem.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json(
      {
        sucesso: false,
        erro: mensagem,
      },
      { status }
    );
  }
}
