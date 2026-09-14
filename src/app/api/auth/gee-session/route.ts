import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken, EARTH_ENGINE_SCOPES } from "@/lib/gee/auth";
import {
  criarSessao,
  atualizarSessao,
  SAREL_SESSION_COOKIE,
  CredenciaisServiceAccount,
} from "@/lib/seguranca/sessaoEfemera";

export async function POST(request: NextRequest) {
  try {
    const json = (await request.json()) as CredenciaisServiceAccount;

    if (!json.project_id || !json.client_email || !json.private_key) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Arquivo JSON de Service Account incompleto. Campos obrigatórios: 'project_id', 'client_email' e 'private_key'.",
        },
        { status: 400 }
      );
    }

    // 1. Testa autenticação real via troca JWT RS256 com o Google OAuth2
    const token = await getGoogleAccessToken(
      {
        client_email: json.client_email,
        private_key: json.private_key,
        token_uri: json.token_uri,
      },
      EARTH_ENGINE_SCOPES
    );

    // 2. Registra na sessão efêmera em memória no backend
    const existingCookie = request.cookies.get(SAREL_SESSION_COOKIE)?.value;
    let sessionId = existingCookie;

    if (sessionId) {
      const atualizou = atualizarSessao(sessionId, { gee: json });
      if (!atualizou) {
        sessionId = criarSessao({ gee: json });
      }
    } else {
      sessionId = criarSessao({ gee: json });
    }

    const response = NextResponse.json({
      ok: true,
      project_id: json.project_id,
      client_email: json.client_email,
      expiresAt: token.expiresAt,
      message: `Autenticação com Google Earth Engine realizada com sucesso para o projeto '${json.project_id}'.`,
    });

    response.cookies.set(SAREL_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 12 * 60 * 60, // 12h
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Erro na autenticação GEE:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Falha ao autenticar Service Account junto ao Google.",
      },
      { status: 401 }
    );
  }
}
