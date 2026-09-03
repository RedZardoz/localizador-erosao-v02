import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { matchRuralProperty } from "@/lib/fundiario/spatialMatcher";
import { isLocalRequest } from "@/lib/security/localOnly";

const RequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  uf: z.string().length(2).optional(),
});

export async function POST(req: NextRequest) {
  if (!isLocalRequest(req)) {
    return NextResponse.json(
      { success: false, error: "Consulta fundiaria disponivel apenas em execucao local." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = RequestSchema.parse(body);

    const match = await matchRuralProperty(parsed.latitude, parsed.longitude, parsed.uf);

    return NextResponse.json({
      success: true,
      data: match,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: `Erro ao consultar dados fundiários: ${err?.message || err}`,
        data: {},
      },
      { status: 400 }
    );
  }
}
