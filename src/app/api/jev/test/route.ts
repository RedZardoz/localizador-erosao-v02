import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const apiKey = (body.apiKey || '').trim();

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: 'Chave do Jev não fornecida.' },
        { status: 400 }
      );
    }

    if (apiKey.length < 8) {
      return NextResponse.json(
        { ok: false, error: 'Chave do Jev fornecida é excessivamente curta ou em formato inválido.' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const start = Date.now();

    try {
      const response = await fetch('https://api.typesafe.ai/v1/systemone', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: 'jev-latest',
          state: 'Verificação de conectividade SAREL v2.0 - PPGTCA UTFPR',
          questions: {
            ping: {
              type: 'noul',
              instructions: 'O serviço de decisão rápida está operante?',
            },
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;

      if (response.ok) {
        return NextResponse.json({
          ok: true,
          latencyMs,
          message: `Conexão bem-sucedida com Jev (TypeSafe AI)! Latência do modelo System One: ${latencyMs}ms.`,
        });
      }

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          {
            ok: false,
            error: "Acesso não autorizado: Verifique se sua chave da TypeSafe AI está correta ou possui créditos.",
          },
          { status: 401 }
        );
      }

      const errText = await response.text().catch(() => "");
      return NextResponse.json(
        {
          ok: false,
          error: `Resposta da API Jev (HTTP ${response.status}): ${errText.slice(0, 140)}`,
        },
        { status: response.status }
      );
    } catch (netErr: any) {
      clearTimeout(timeoutId);
      return NextResponse.json({
        ok: true,
        offline: true,
        message: 'Chave Jev registrada no SAREL. (Aviso: Validação em rede não pôde ser concluída no momento).',
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Erro interno ao validar chave do Jev.' },
      { status: 500 }
    );
  }
}
