import { NextRequest, NextResponse } from "next/server";
import { GcpCredentialsSchema } from "@/types/erosion";
import { verifyEarthEngineAccess } from "@/lib/gee/verifyEarthEngineAccess";
import { createGeeSession, destroyGeeSession, getGeeSessionMeta, GEE_SESSION_COOKIE } from "@/lib/gee/sessionStore";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 12 * 60 * 60, // 12h, deve casar com SESSION_TTL_MS em sessionStore.ts
};

/**
 * Cria uma sessão de servidor para a Service Account: valida de verdade
 * contra o Google/Earth Engine (mesma checagem de /api/auth/gee-test) e, em
 * caso de sucesso, guarda a credencial no servidor e devolve só um cookie
 * httpOnly com o ID da sessão — a private_key nunca mais precisa trafegar
 * do navegador para o servidor depois deste request.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = GcpCredentialsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Estrutura do JSON de credenciais inválida.",
          details: parseResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    const verification = await verifyEarthEngineAccess(parseResult.data as any);
    if (!verification.success) {
      return NextResponse.json({ success: false, error: verification.error }, { status: verification.status || 400 });
    }

    const sessionId = createGeeSession(parseResult.data as any);

    const res = NextResponse.json({
      success: true,
      message: "Sessão do Earth Engine criada no servidor. A chave privada não será enviada novamente.",
      data: verification.data,
    });
    res.cookies.set(GEE_SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Erro ao criar sessão: ${err.message || "Erro desconhecido"}` },
      { status: 500 }
    );
  }
}

/** Retorna se há uma sessão ativa e seus metadados não sensíveis (nunca a chave). */
export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(GEE_SESSION_COOKIE)?.value;
  const meta = getGeeSessionMeta(sessionId);
  if (!meta) {
    return NextResponse.json({ active: false });
  }
  return NextResponse.json({ active: true, projectId: meta.projectId, clientEmail: meta.clientEmail });
}

/** Encerra a sessão (botão "Encerrar sessão GEE" na UI). */
export async function DELETE(req: NextRequest) {
  const sessionId = req.cookies.get(GEE_SESSION_COOKIE)?.value;
  destroyGeeSession(sessionId);
  const res = NextResponse.json({ success: true });
  res.cookies.delete(GEE_SESSION_COOKIE);
  return res;
}
