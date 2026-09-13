import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken, EARTH_ENGINE_SCOPES } from "@/lib/gee/auth";
import {
  obterSessao,
  SAREL_SESSION_COOKIE,
} from "@/lib/seguranca/sessaoEfemera";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(SAREL_SESSION_COOKIE)?.value;
    const sessao = obterSessao(sessionId);

    if (!sessao?.gee) {
      return NextResponse.json(
        {
          ok: false,
          active: false,
          error: "Nenhuma credencial do Google Earth Engine encontrada na sessão ativa.",
        },
        { status: 401 }
      );
    }

    // Re-valida o token OAuth2 em tempo real contra o Google
    const token = await getGoogleAccessToken(
      {
        client_email: sessao.gee.client_email,
        private_key: sessao.gee.private_key,
        token_uri: sessao.gee.token_uri,
      },
      EARTH_ENGINE_SCOPES
    );

    return NextResponse.json({
      ok: true,
      active: true,
      project_id: sessao.gee.project_id,
      client_email: sessao.gee.client_email,
      expiresAt: token.expiresAt,
      message: "Sessão do Google Earth Engine verificada e ativa no Google Cloud.",
    });
  } catch (error: any) {
    console.error("Erro no teste de sessão GEE:", error);
    return NextResponse.json(
      {
        ok: false,
        active: false,
        error: error.message || "Erro ao verificar conexão com o Google Earth Engine.",
      },
      { status: 401 }
    );
  }
}
