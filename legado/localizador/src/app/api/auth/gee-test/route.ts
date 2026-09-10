import { NextRequest, NextResponse } from "next/server";
import { GcpCredentialsSchema } from "@/types/erosion";
import { verifyEarthEngineAccess } from "@/lib/gee/verifyEarthEngineAccess";

/**
 * Testa uma Service Account contra o Google DE VERDADE, sem persistir nada no
 * servidor (para isso, ver /api/auth/gee-session). Útil para validar um
 * credentials.json antes de decidir usá-lo.
 *
 * Antes desta implementação, esta rota só validava o FORMATO do JSON e
 * sempre retornava sucesso ("handshake simulado"). Agora qualquer falha é um
 * erro real relatado pelo Google.
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

    return NextResponse.json({
      success: true,
      message: "Autenticação real da Service Account validada com o Google Earth Engine!",
      data: verification.data,
    });
  } catch (err: any) {
    console.error("[GEE Test Error]", err);
    return NextResponse.json(
      { success: false, error: "Erro interno ao processar credenciais. Consulte os logs do servidor." },
      { status: 500 }
    );
  }
}
